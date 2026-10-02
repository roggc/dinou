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

function parsePprConfigWithBabel(code) {
  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });

    let pprValue = null;
    const traverseFn = typeof traverse === "function" ? traverse : (traverse.default || traverse);

    traverseFn(ast, {
      ExportNamedDeclaration(p) {
        if (p.node.declaration && p.node.declaration.type === "VariableDeclaration") {
          for (const d of p.node.declaration.declarations) {
            if (d.id && d.id.type === "Identifier") {
              if (d.id.name === "ppr" || d.id.name === "experimental_ppr") {
                if (d.init) {
                  if (d.init.type === "BooleanLiteral") {
                    pprValue = d.init.value;
                  } else if (d.init.type === "StringLiteral") {
                    pprValue = d.init.value !== "false";
                  } else if (d.init.type === "Identifier") {
                    pprValue = d.init.name === "true";
                  } else {
                    pprValue = true;
                  }
                } else {
                  pprValue = true;
                }
              }
            }
          }
        }
      },
    });

    return pprValue;
  } catch (e) {
    // Regex fallback
    const match = code.match(/(?:export\s+const|export\s+let|export\s+var)\s+(?:experimental_)?ppr\s*=\s*(true|false|"[^"]*"|'[^']*')/);
    if (match) {
      const val = match[1].trim();
      return val !== "false" && val !== '"false"' && val !== "'false'";
    }
    return null;
  }
}

function parsePprConfig(code) {
  if (!code || typeof code !== "string") return null;
  if (!code.includes("ppr")) return null;

  if (swc && typeof swc.parseSync === "function") {
    try {
      const ast = swc.parseSync(code, { syntax: "typescript", tsx: true });
      for (const item of ast.body) {
        if (item.type === "ExportDeclaration" || item.type === "ExportNamedDeclaration") {
          const d = item.declaration;
          if (d && d.type === "VariableDeclaration") {
            for (const v of d.declarations) {
              const name = v.id?.value || v.id?.name;
              if (name === "ppr" || name === "experimental_ppr") {
                if (v.init) {
                  if (v.init.type === "BooleanLiteral") return Boolean(v.init.value);
                  if (v.init.type === "StringLiteral") return v.init.value !== "false";
                  if (v.init.type === "Identifier") return v.init.value === "true";
                  return true;
                }
                return true;
              }
            }
          }
        }
      }
      return null;
    } catch (e) {
      // Fallback to Babel
    }
  }

  return parsePprConfigWithBabel(code);
}

parseExports.parsePprConfig = parsePprConfig;
parseExports.hasPpr = (code) => parsePprConfig(code) === true;

module.exports = parseExports;

