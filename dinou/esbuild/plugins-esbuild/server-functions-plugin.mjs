import path from "path";
import fs from "node:fs/promises";
import parseExports from "../../core/parse-exports.js";
import { useServerRegex } from "../../constants.js";

export default function serverFunctionsPlugin(manifestData = {}, options = {}) {
  const opts =
    typeof manifestData === "object" && manifestData !== null && ("onManifestUpdated" in manifestData || "serverFiles" in manifestData)
      ? manifestData
      : options;
  const manifestMap = opts.manifestData || (manifestData.onManifestUpdated ? {} : manifestData) || {};
  const onManifestUpdated = opts.onManifestUpdated;
  const serverFiles = opts.serverFiles || manifestData.serverFiles || options.serverFiles || null;
  const normalizeNormPath = (p) => {
    let s = path.resolve(p).replace(/\\/g, "/");
    if (process.platform === "win32") {
      s = s.replace(/^([a-zA-Z]):/, (_, d) => d.toLowerCase() + ":");
    }
    return s;
  };
  const serverFilesSet = serverFiles
    ? new Set(Array.from(serverFiles).map((f) => normalizeNormPath(f)))
    : null;

  return {
    name: "server-functions-proxy",
    setup(build) {
      const root = process.cwd();
      const serverFunctions = new Map(); // Collect server functions here: Map<relativePath, Set<exports>>
      const sfCache = new Map(); // Cache by path: { mtimeMs, isServer, relativePath, exportsSet, proxyCode }
      let sfTime = 0;
      let sfCount = 0;

      build.onStart(() => {
        sfTime = 0;
        sfCount = 0;
      });

      // 1. TRANSFORM FILES DURING BUILD
      build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
        const normPath = args.path.replace(/\\/g, "/");
        if (normPath.includes("/node_modules/") || normPath.includes("/.dinou/")) return null;

        if (serverFilesSet) {
          const absNorm = normalizeNormPath(args.path);
          if (!serverFilesSet.has(absNorm)) {
            return null;
          }
        }

        const t0 = Date.now();
        try {
          let stat;
          try {
            stat = await fs.stat(args.path);
          } catch (e) {
            return null;
          }

          const cached = sfCache.get(args.path);
          if (cached && cached.mtimeMs === stat.mtimeMs) {
            if (!cached.isServer) return null;
            serverFunctions.set(cached.relativePath, cached.exportsSet);
            return { contents: cached.proxyCode, loader: "js" };
          }

          const code = await fs.readFile(args.path, "utf8");

          if (!useServerRegex.test(code.trim())) {
            sfCache.set(args.path, { mtimeMs: stat.mtimeMs, isServer: false });
            return null;
          }

          const exports = parseExports(code);
          if (exports.length === 0) {
            sfCache.set(args.path, { mtimeMs: stat.mtimeMs, isServer: false });
            return null;
          }

          const relativePath = path.relative(root, args.path).replace(/\\/g, "/");
          const exportsSet = new Set(exports);
          serverFunctions.set(relativePath, exportsSet); // Save exports as a Set to guarantee uniqueness

          const fileUrl = `file:///${relativePath}`;

          // Generate proxy code that forwards calls to the server instead of executing the actual code
          let proxyCode = `
            import { createServerFunctionProxy } from "/__SERVER_FUNCTION_PROXY__";
          `;

          for (const exp of exports) {
            const key =
              exp === "default" ? `${fileUrl}#default` : `${fileUrl}#${exp}`;

            if (exp === "default") {
              proxyCode += `export default createServerFunctionProxy(${JSON.stringify(
                key
              )});\n`;
            } else {
              proxyCode += `export const ${exp} = createServerFunctionProxy(${JSON.stringify(
                key
              )});\n`;
            }
          }

          sfCache.set(args.path, {
            mtimeMs: stat.mtimeMs,
            isServer: true,
            relativePath,
            exportsSet,
            proxyCode,
          });

          return {
            contents: proxyCode,
            loader: "js",
          };
        } finally {
          sfTime += Date.now() - t0;
          sfCount++;
          globalThis.__DINOU_SF_TIME__ = sfTime;
          globalThis.__DINOU_SF_COUNT__ = sfCount;
        }
      });

      // 2. REPLACE PLACEHOLDER AND GENERATE MANIFEST AFTER BUILD
      build.onEnd(async (result) => {
        const tEnd0 = Date.now();
        try {
          if (serverFunctions.size === 0) {
            if (typeof globalThis !== "undefined") {
              globalThis.__DINOU_RAW_SERVER_FUNCTIONS_MANIFEST__ = {};
            }
            return;
          }
          const hashedProxy =
          "/" +
          (manifestMap["serverFunctionProxy.js"] || "serverFunctionProxy.js");

          const serverFnNormalized = new Set();
          for (const relPath of serverFunctions.keys()) {
            serverFnNormalized.add(path.resolve(root, relPath).replace(/\\/g, "/").toLowerCase());
          }

          let targetOutputFiles = Object.values(result.outputFiles || {});
          if (result.metafile && result.metafile.outputs) {
            const allowedOutputs = new Set();
            for (const [outPath, outMeta] of Object.entries(result.metafile.outputs)) {
              const hasSf = Object.keys(outMeta.inputs || {}).some((inPath) => {
                const norm = path.resolve(root, inPath).replace(/\\/g, "/").toLowerCase();
                return serverFnNormalized.has(norm);
              });
              if (hasSf) {
                allowedOutputs.add(path.resolve(root, outPath).replace(/\\/g, "/").toLowerCase());
              }
            }
            targetOutputFiles = targetOutputFiles.filter((outputFile) => {
              const norm = path.resolve(outputFile.path).replace(/\\/g, "/").toLowerCase();
              return allowedOutputs.has(norm);
            });
          }

          for (const outputFile of targetOutputFiles) {
            const fileCode = new TextDecoder().decode(outputFile.contents);

            if (!fileCode) continue;
            if (fileCode.includes("/__SERVER_FUNCTION_PROXY__")) {
              const newCode = fileCode.replace(
                /\/__SERVER_FUNCTION_PROXY__/g,
                hashedProxy
              );
              outputFile.contents = new TextEncoder().encode(newCode);
            }
          }

          // Generate the final manifest by converting the Map to a plain object
          const manifestObj = {};
          for (const [path, exportsSet] of serverFunctions.entries()) {
            manifestObj[path] = Array.from(exportsSet);
          }

          if (typeof globalThis !== "undefined") {
            globalThis.__DINOU_RAW_SERVER_FUNCTIONS_MANIFEST__ = manifestObj;
          }

          const isDev = process.env.DINOU_DEV === "true" || process.env.NODE_ENV === "development";
          const shouldWriteToDisk = process.env.DINOU_WRITE_TO_DISK === "true" || !isDev;

          if (shouldWriteToDisk) {
            // Write the server functions manifest JSON file to the output directory
            const manifestPath = path.join(
              ".dinou/server_functions_manifest",
              "server-functions-manifest.json"
            );
            await fs.mkdir(path.dirname(manifestPath), { recursive: true });
            await fs.writeFile(manifestPath, JSON.stringify(manifestObj, null, 2));
          }
        } finally {
          globalThis.__DINOU_SF_END_TIME__ = Date.now() - tEnd0;
        }
      });
    },
  };
}
