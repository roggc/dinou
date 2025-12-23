import path from "path";
import fs from "node:fs/promises";
import parseExports from "../../core/parse-exports.js";
import { useServerRegex } from "../../constants.js";

export default function serverFunctionsPlugin(manifestData = {}) {
  return {
    name: "server-functions-proxy",
    setup(build) {
      const root = process.cwd();
      const serverFunctions = new Map(); // Recolectar aquí: Map<relativePath, Set<exports>>

      // 1. TRANSFORM FILES DURING BUILD
      build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
        const code = await fs.readFile(args.path, "utf8");

        if (!useServerRegex.test(code.trim())) return null;

        const exports = parseExports(code);
        if (exports.length === 0) return null;

        const relativePath = path.relative(root, args.path);
        serverFunctions.set(relativePath, new Set(exports)); // Guardar exports como Set para uniqueness

        const fileUrl = `file:///${relativePath}`;

        // Proxy code (igual que antes)
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
          contents: proxyCode,
          loader: "js",
        };
      });

      // 2. REPLACE PLACEHOLDER AND GENERATE MANIFEST AFTER BUILD
      build.onEnd(async (result) => {
        const hashedProxy =
          "/" +
          (manifestData["serverFunctionProxy.js"] || "serverFunctionProxy.js");

        for (const outputFile of Object.values(result.outputFiles)) {
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

        // Generar manifest: convertir Map a objeto simple
        const manifestObj = {};
        for (const [path, exportsSet] of serverFunctions.entries()) {
          manifestObj[path] = Array.from(exportsSet);
        }

        // Escribir el manifest en el output dir (ej. mismo lugar que otros assets)
        const manifestPath = path.join(
          "server_functions_manifest",
          "server-functions-manifest.json"
        );
        await fs.mkdir(path.dirname(manifestPath), { recursive: true });
        await fs.writeFile(manifestPath, JSON.stringify(manifestObj, null, 2));
        // console.log(
        //   `[server-functions-proxy] Generated manifest at ${manifestPath}`
        // );
      });
    },
  };
}
