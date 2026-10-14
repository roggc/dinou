// rollup-plugin-server-functions.js
const path = require("path");
const fs = require("fs/promises");
const manifestGeneratorPlugin = require("./manifest-generator-plugin");
const parseExports = require("../../core/parse-exports.js");
const { useServerRegex } = require("../../constants.js");

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
    return path.resolve(p).replace(/\\/g, "/").toLowerCase();
  }

  return {
    name: "server-functions-proxy",
    transform(code, id) {
      if (id.includes("node_modules") || id.includes("\0")) return null;
      if (serverFiles && !serverFiles.has(normalizeFsPath(id))) return null;
      if (!useServerRegex.test(code)) return null;

      const exports = parseExports(code);
      if (exports.length === 0) return null;

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
      if (serverFunctions.size === 0) {
        if (typeof globalThis !== "undefined") {
          globalThis.__DINOU_RAW_SERVER_FUNCTIONS_MANIFEST__ = {};
        }
        return;
      }
      const manifest = manifestGeneratorPlugin.manifestData;
      const hashedPath =
        "/" + (manifest["serverFunctionProxy.js"] || "serverFunctionProxy.js");

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
        process.env.DINOU_WRITE_TO_DISK === "true" || !isDev;

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

module.exports = serverFunctionsPlugin;
