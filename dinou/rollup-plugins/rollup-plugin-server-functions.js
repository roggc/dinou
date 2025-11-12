// rollup-plugin-server-functions.js
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

function parseExports(code) {
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });
  const exports = new Set();

  traverse(ast, {
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

  return Array.from(exports);
}

function serverFunctionsPlugin() {
  return {
    name: "server-functions-proxy",
    transform(code, id) {
      if (!code.trim().startsWith('"use server"')) return null;

      const exports = parseExports(code);
      if (exports.length === 0) return null;

      const fileUrl = `file:///${path.relative(process.cwd(), id)}`;

      // Generamos un módulo que exporta proxies en lugar del código real
      let proxyCode = `
        import { createServerFunctionProxy } from "/serverFunctionProxy.js";
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
  };
}

module.exports = serverFunctionsPlugin;
