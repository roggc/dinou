import path from "path";
import parser from "@babel/parser";
import traverse from "@babel/traverse";
import fs from "fs";

function parseExports(code) {
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  const exports = new Set();

  traverse.default(ast, {
    ExportDefaultDeclaration() {
      exports.add("default");
    },
    ExportNamedDeclaration(p) {
      if (p.node.declaration) {
        if (p.node.declaration.type === "FunctionDeclaration") {
          exports.add(p.node.declaration.id.name);
        } else if (p.node.declaration.type === "VariableDeclaration") {
          p.node.declaration.declarations.forEach((d) => {
            if (d.id.type === "Identifier") {
              exports.add(d.id.name);
            }
          });
        }
      } else if (p.node.specifiers) {
        p.node.specifiers.forEach((s) => {
          if (s.type === "ExportSpecifier") {
            exports.add(s.exported.name);
          }
        });
      }
    },
  });

  return [...exports];
}

export default function serverFunctionsPlugin(manifestData = {}) {
  return {
    name: "server-functions-proxy",
    setup(build) {
      const root = process.cwd();

      // 1. TRANSFORM FILES DURING BUILD
      build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
        const code = await fs.promises.readFile(args.path, "utf8");

        if (!code.trim().startsWith('"use server"')) return null;

        const exports = parseExports(code);
        if (exports.length === 0) return null;

        const fileUrl = `file:///${path.relative(root, args.path)}`;

        // Proxy code
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

      // 2. REPLACE PLACEHOLDER AFTER BUILD
      build.onEnd(async (result) => {
        // console.log("[server-functions-proxy] manifest:", manifestData);
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
            // console.log(
            //   `[server-functions-proxy] Replaced __SERVER_FUNCTION_PROXY__ in ${outputFile.path}`
            // );
            outputFile.contents = new TextEncoder().encode(newCode);
          }
        }
      });
    },
  };
}
