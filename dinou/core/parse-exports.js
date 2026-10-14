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
        const decl = p.node.declaration;
        if (!decl) return;

        if (decl.type === "FunctionDeclaration") {
          if (decl.id && decl.id.name === "ppr") {
            for (const s of decl.body?.body || []) {
              if (s.type === "ReturnStatement" && s.argument) {
                if (s.argument.type === "BooleanLiteral") pprValue = s.argument.value;
                else if (s.argument.type === "StringLiteral") pprValue = s.argument.value !== "false";
                else if (s.argument.type === "Identifier") pprValue = s.argument.name === "true";
              }
            }
            if (pprValue === null) pprValue = true;
          }
        } else if (decl.type === "VariableDeclaration") {
          for (const d of decl.declarations) {
            if (d.id && d.id.type === "Identifier") {
              if (d.id.name === "ppr") {
                if (d.init) {
                  if (d.init.type === "BooleanLiteral") {
                    pprValue = d.init.value;
                  } else if (d.init.type === "StringLiteral") {
                    pprValue = d.init.value !== "false";
                  } else if (d.init.type === "Identifier") {
                    pprValue = d.init.name === "true";
                  } else if (d.init.type === "ArrowFunctionExpression" || d.init.type === "FunctionExpression") {
                    if (d.init.body.type === "BooleanLiteral") {
                      pprValue = d.init.body.value;
                    } else if (d.init.body.type === "BlockStatement") {
                      for (const s of d.init.body.body || []) {
                        if (s.type === "ReturnStatement" && s.argument) {
                          if (s.argument.type === "BooleanLiteral") pprValue = s.argument.value;
                          else if (s.argument.type === "StringLiteral") pprValue = s.argument.value !== "false";
                          else if (s.argument.type === "Identifier") pprValue = s.argument.name === "true";
                        }
                      }
                    }
                    if (pprValue === null) pprValue = true;
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
    const matchConst = code.match(/(?:export\s+const|export\s+let|export\s+var)\s+ppr\s*=\s*(true|false|"[^"]*"|'[^']*')/);
    if (matchConst) {
      const val = matchConst[1].trim();
      return val !== "false" && val !== '"false"' && val !== "'false'";
    }
    const matchFunc = code.match(/(?:export\s+(?:async\s+)?function\s+ppr\s*\([^)]*\)\s*\{[\s\S]*?return\s+(true|false))/);
    if (matchFunc) {
      return matchFunc[1] === "true";
    }
    const matchArrow = code.match(/(?:export\s+const|export\s+let|export\s+var)\s+ppr\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>\s*(?:\{[\s\S]*?return\s+(true|false)|(true|false))/);
    if (matchArrow) {
      const val = matchArrow[1] || matchArrow[2];
      return val === "true";
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
          if (!d) continue;

          if (d.type === "FunctionDeclaration") {
            const name = d.identifier?.value || d.identifier?.name;
            if (name === "ppr") {
              for (const stmt of d.body?.stmts || []) {
                if (stmt.type === "ReturnStatement" && stmt.argument) {
                  if (stmt.argument.type === "BooleanLiteral") return Boolean(stmt.argument.value);
                  if (stmt.argument.type === "StringLiteral") return stmt.argument.value !== "false";
                  if (stmt.argument.type === "Identifier") return stmt.argument.value === "true";
                }
              }
              return true;
            }
          } else if (d.type === "VariableDeclaration") {
            for (const v of d.declarations) {
              const name = v.id?.value || v.id?.name;
              if (name === "ppr") {
                if (v.init) {
                  if (v.init.type === "BooleanLiteral") return Boolean(v.init.value);
                  if (v.init.type === "StringLiteral") return v.init.value !== "false";
                  if (v.init.type === "Identifier") return v.init.value === "true";
                  if (v.init.type === "ArrowFunctionExpression" || v.init.type === "FunctionExpression") {
                    if (v.init.body.type === "BooleanLiteral") return Boolean(v.init.body.value);
                    if (v.init.body.type === "BlockStatement") {
                      for (const s of v.init.body.stmts || []) {
                        if (s.type === "ReturnStatement" && s.argument) {
                          if (s.argument.type === "BooleanLiteral") return Boolean(s.argument.value);
                          if (s.argument.type === "StringLiteral") return s.argument.value !== "false";
                          if (s.argument.type === "Identifier") return s.argument.value === "true";
                        }
                      }
                    }
                    return true;
                  }
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

const { resolveModulePpr } = require("./resolve-module-ppr");

parseExports.parsePprConfig = parsePprConfig;
parseExports.hasPpr = (code) => parsePprConfig(code) === true;
parseExports.resolveModulePpr = resolveModulePpr;

module.exports = parseExports;

