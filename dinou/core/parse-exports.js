const parser = require("@babel/parser");
const traverse = require("@babel/traverse");

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
        if (
          p.node.declaration.type === "FunctionDeclaration" ||
          p.node.declaration.type === "ClassDeclaration"
        ) {
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

module.exports = parseExports;
