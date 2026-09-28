let swc = null;
try {
  swc = require("@swc/core");
} catch (e) {}

const parser = require("@babel/parser");
const traverse = require("@babel/traverse");

function parseExportsWithBabel(code) {
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  const exports = new Set();
  const traverseFn = typeof traverse === "function" ? traverse : (traverse.default || traverse);

  traverseFn(ast, {
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

function parseExports(code) {
  if (swc && typeof swc.parseSync === "function") {
    try {
      const ast = swc.parseSync(code, { syntax: "typescript", tsx: true });
      const exports = new Set();
      for (const item of ast.body) {
        if (item.type === "ExportDefaultDeclaration" || item.type === "ExportDefaultExpression") {
          exports.add("default");
        } else if (item.type === "ExportDeclaration") {
          const d = item.declaration;
          if (!d) continue;
          if (d.type === "FunctionDeclaration" || d.type === "ClassDeclaration") {
            if (d.identifier?.value) exports.add(d.identifier.value);
          } else if (d.type === "VariableDeclaration") {
            for (const v of d.declarations) {
              if (v.id.type === "Identifier") exports.add(v.id.value);
            }
          }
        } else if (item.type === "ExportNamedDeclaration") {
          const d = item.declaration;
          if (d) {
            if (d.type === "FunctionDeclaration" || d.type === "ClassDeclaration") {
              if (d.identifier?.value) exports.add(d.identifier.value);
            } else if (d.type === "VariableDeclaration") {
              for (const v of d.declarations) {
                if (v.id.type === "Identifier") exports.add(v.id.value);
              }
            }
          }
          if (item.specifiers) {
            for (const s of item.specifiers) {
              const name = s.exported?.value || s.orig?.value;
              if (name) exports.add(name);
            }
          }
        }
      }
      return [...exports];
    } catch (e) {
      // Fallback to Babel
    }
  }

  return parseExportsWithBabel(code);
}

module.exports = parseExports;

