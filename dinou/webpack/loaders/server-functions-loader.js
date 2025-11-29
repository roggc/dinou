// server-functions-loader.js
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const path = require("path");

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

module.exports = function serverFunctionsLoader(source) {
  if (!source.trim().startsWith('"use server"')) return source;

  const callback = this.async();
  const exports = parseExports(source);
  if (exports.length === 0) return callback(null, source);

  const fileUrl = `file:///${path.relative(process.cwd(), this.resourcePath)}`;

  let out = `import { createServerFunctionProxy } from "__SERVER_FUNCTION_PROXY__";\n`;

  for (const name of exports) {
    const key =
      name === "default" ? `${fileUrl}#default` : `${fileUrl}#${name}`;

    if (name === "default") {
      out += `export default createServerFunctionProxy(${JSON.stringify(
        key
      )});\n`;
    } else {
      out += `export const ${name} = createServerFunctionProxy(${JSON.stringify(
        key
      )});\n`;
    }
  }

  callback(null, out);
};
