// rollup-plugin-server-functions.js
import path from "node:path";
import fs from "node:fs/promises";
import manifestGeneratorPlugin from "./manifest-generator-plugin.js";
import parseExports from "../../core/parse-exports.js";
import { useServerRegex } from "../../constants.js";
import { extractServerFunctions, hasServerFunctions } from "../../core/transform-server-functions.js";

function serverFunctionsPlugin(manifestData = {}, options = {}) {
  const opts =
    typeof manifestData === "object" &&
    manifestData !== null &&
    ("onManifestUpdated" in manifestData || "serverFiles" in manifestData)
      ? manifestData
      : options;
  const serverFiles =
    opts.serverFiles || manifestData.serverFiles || options.serverFiles || null;
  const root = process.cwd();
  const serverFunctions = new Map(); // Collect here: Map<relativePath, Set<exports>>

  function normalizeFsPath(p) {
    const resolved = path.resolve(p).replace(/\\/g, "/");
    return process.platform === "win32" ? resolved.toLowerCase() : resolved;
  }

  return {
    name: "server-functions-proxy",
    transform(code, id) {
      if (id.includes("node_modules") || id.includes("\0")) return null;
      if (serverFiles && !serverFiles.has(normalizeFsPath(id))) {
        if (!useServerRegex.test(code.trim()) && !hasServerFunctions(code)) return null;
        serverFiles.add(normalizeFsPath(id));
      } else if (!useServerRegex.test(code.trim()) && !hasServerFunctions(code)) {
        return null;
      }

      const isModuleLevel = useServerRegex.test(code.trim());
      const exports = isModuleLevel ? parseExports(code) : extractServerFunctions(code, id);
      if (!exports || exports.length === 0) return null;

      const relativePath = path.relative(root, id).replace(/\\/g, "/");
      serverFunctions.set(relativePath, new Set(exports)); // Save exports as a Set for uniqueness

      const fileUrl = `file:///${relativePath}`;

      // Generate a module that exports proxies instead of the real code
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

      return {
        code: proxyCode,
        map: null,
      };
    },
    // 🪄 After manifest exists, replace the placeholder with the final URL
    async generateBundle(options, bundle) {
      if (serverFiles && serverFiles.size > 0) {
        for (const filePath of serverFiles) {
          const rel = path.relative(root, filePath).replace(/\\/g, "/");
          if (!serverFunctions.has(rel)) {
            try {
              const fileCode = await fs.readFile(filePath, "utf8");
              if (useServerRegex.test(fileCode.trim())) {
                const exports = parseExports(fileCode);
                if (exports && exports.length > 0) {
                  serverFunctions.set(rel, new Set(exports));
                }
              } else if (hasServerFunctions(fileCode)) {
                const actions = extractServerFunctions(fileCode, filePath);
                if (actions && actions.length > 0) {
                  serverFunctions.set(rel, new Set(actions));
                }
              }
            } catch (e) {}
          }
        }
      }

      if (serverFunctions.size === 0) {
        if (typeof globalThis !== "undefined") {
          globalThis.__DINOU_RAW_SERVER_FUNCTIONS_MANIFEST__ = {};
        }
        return;
      }
      const isProd =
        process.env.NODE_ENV === "production" &&
        process.env.DINOU_DEV !== "true";
      const manifest = manifestGeneratorPlugin.manifestData;
      const proxyName = manifest["serverFunctionProxy.js"];
      if (isProd && !proxyName) {
        throw new Error(
          "[Dinou] rollup-plugin-server-functions: could not find hashed 'serverFunctionProxy.js' in manifest during production build."
        );
      }
      const hashedPath =
        "/" + (proxyName || "serverFunctionProxy.js");

      for (const file of Object.keys(bundle)) {
        const chunk = bundle[file];
        if (chunk.type === "asset" || !chunk.code) continue;
        if (chunk.code.includes("/__SERVER_FUNCTION_PROXY__")) {
          chunk.code = chunk.code.replace(
            /\/__SERVER_FUNCTION_PROXY__/g,
            hashedPath
          );
        }
      }

      // Generate manifest: convert Map to a simple object
      const manifestObj = {};
      for (const [relPath, exportsSet] of serverFunctions.entries()) {
        manifestObj[relPath] = Array.from(exportsSet);
      }

      if (typeof globalThis !== "undefined") {
        globalThis.__DINOU_RAW_SERVER_FUNCTIONS_MANIFEST__ = manifestObj;
      }

      const isDev =
        process.env.NODE_ENV !== "production" ||
        process.env.DINOU_DEV === "true";
      const shouldWriteToDisk =
        process.env.DINOU_WRITE_TO_DISK === "false"
          ? false
          : process.env.DINOU_WRITE_TO_DISK === "true" || !isDev;

      if (shouldWriteToDisk) {
        // Write the manifest to the specified folder (e.g. same place as other assets)
        const manifestPath = path.join(
          ".dinou/server_functions_manifest",
          "server-functions-manifest.json"
        );
        try {
          await fs.mkdir(path.dirname(manifestPath), { recursive: true });
          await fs.writeFile(manifestPath, JSON.stringify(manifestObj, null, 2));
        } catch (err) {
          console.error(err);
        }
      }
    },
  };
}

export { serverFunctionsPlugin };
export default serverFunctionsPlugin;
