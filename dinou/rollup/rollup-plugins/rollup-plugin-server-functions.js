// rollup-plugin-server-functions.js
const path = require("path");
const fs = require("fs/promises");
const manifestGeneratorPlugin = require("./manifest-generator-plugin");
const parseExports = require("../../core/parse-exports.js");
const { useServerRegex } = require("../../constants.js");

function serverFunctionsPlugin() {
  const root = process.cwd();
  const serverFunctions = new Map(); // Recolectar aquí: Map<relativePath, Set<exports>>

  return {
    name: "server-functions-proxy",
    transform(code, id) {
      if (!useServerRegex.test(code.trim())) return null;

      const exports = parseExports(code);
      if (exports.length === 0) return null;

      const relativePath = path.relative(root, id);
      serverFunctions.set(relativePath, new Set(exports)); // Guardar exports como Set para uniqueness

      const fileUrl = `file:///${relativePath}`;

      // Generamos un módulo que exporta proxies en lugar del código real
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
    generateBundle(options, bundle) {
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

      // Generar manifest: convertir Map a objeto simple
      const manifestObj = {};
      for (const [relPath, exportsSet] of serverFunctions.entries()) {
        manifestObj[relPath] = Array.from(exportsSet);
      }

      // Escribir el manifest en la carpeta especificada (ej. mismo lugar que otros assets)
      const manifestPath = path.join(
        "server_functions_manifest",
        "server-functions-manifest.json"
      );
      fs.mkdir(path.dirname(manifestPath), { recursive: true })
        .then(() =>
          fs.writeFile(manifestPath, JSON.stringify(manifestObj, null, 2))
        )
        .then(() => {
          // console.log(`[rollup-server-functions] Generated manifest at ${manifestPath}`);
        })
        .catch(console.error);
    },
  };
}

module.exports = serverFunctionsPlugin;
