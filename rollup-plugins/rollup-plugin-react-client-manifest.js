const { readFileSync, writeFileSync, mkdirSync, existsSync } = require("fs");
const path = require("path");
const { dirname } = require("path");
const glob = require("fast-glob");
const { pathToFileURL } = require("url");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

function reactClientManifestPlugin({
  srcDir = path.resolve("src"),
  manifestPath = "public/react-client-manifest.json",
} = {}) {
  const manifest = {};
  const clientModules = new Set();
  const serverModules = new Set();

  return {
    name: "react-client-manifest",

    async buildStart() {
      const files = await glob(["**/*.{js,jsx,ts,tsx}"], {
        cwd: srcDir,
        absolute: true,
      });

      // Pasada única: clasificar y procesar clients
      for (const absPath of files) {
        const code = readFileSync(absPath, "utf8");
        const normalizedPath = absPath.split(path.sep).join(path.posix.sep);

        if (/^(['"])use client\1/.test(code.trim())) {
          clientModules.add(normalizedPath);

          const fileUrl = pathToFileURL(absPath).href;
          const relPath =
            "./" + path.relative(process.cwd(), absPath).replace(/\\/g, "/");

          // Parsea el AST con Babel (soporta TS/JSX)
          const ast = parser.parse(code, {
            sourceType: "module",
            plugins: ["jsx", "typescript"],
          });

          const exports = new Set(); // Almacena nombres de exports (named + default)

          traverse(ast, {
            ExportDefaultDeclaration(path) {
              exports.add("default");
            },
            ExportNamedDeclaration(path) {
              if (path.node.declaration) {
                if (
                  path.node.declaration.type === "FunctionDeclaration" ||
                  path.node.declaration.type === "ClassDeclaration"
                ) {
                  exports.add(path.node.declaration.id.name);
                } else if (
                  path.node.declaration.type === "VariableDeclaration"
                ) {
                  path.node.declaration.declarations.forEach((decl) => {
                    if (decl.id.type === "Identifier") {
                      exports.add(decl.id.name);
                    }
                  });
                }
              } else if (path.node.specifiers) {
                path.node.specifiers.forEach((spec) => {
                  if (spec.type === "ExportSpecifier") {
                    exports.add(spec.exported.name);
                  }
                });
              }
            },
          });

          // Agrega entradas al manifiesto por cada export
          for (const expName of exports) {
            const manifestKey =
              expName === "default" ? fileUrl : `${fileUrl}#${expName}`;
            manifest[manifestKey] = {
              id: relPath,
              chunks: expName,
              name: expName,
            };
          }

          // Emite el chunk para el módulo completo (no por export)
          this.emitFile({
            type: "chunk",
            id: absPath,
            name: path.basename(absPath, path.extname(absPath)),
          });
        } else {
          serverModules.add(normalizedPath);
        }
      }
    },

    async transform(code, id) {
      const normalizedId = id.split(path.sep).join(path.posix.sep);
      if (!clientModules.has(normalizedId)) return null;

      return code;
    },

    async watchChange(id) {
      // console.log(`File changed: ${id}`);
      if (
        !id.endsWith(".tsx") &&
        !id.endsWith(".jsx") &&
        !id.endsWith(".js") &&
        !id.endsWith(".ts")
      )
        return;
      const normalizedId = id.split(path.sep).join(path.posix.sep);
      if (!existsSync(id)) {
        const fileUrl = pathToFileURL(id).href;
        for (const key in manifest) {
          if (key.startsWith(fileUrl)) {
            delete manifest[key];
          }
        }
        clientModules.delete(normalizedId);
        serverModules.delete(normalizedId);
        return;
      }
      const code = readFileSync(id, "utf8");
      const fileUrl = pathToFileURL(id).href;

      // Determina si era cliente antes del cambio
      const wasClient = clientModules.has(normalizedId);

      if (/^(['"])use client\1/.test(code.trim())) {
        clientModules.add(normalizedId);
        serverModules.delete(normalizedId);
        // Parsea AST como arriba
        const ast = parser.parse(code, {
          sourceType: "module",
          plugins: ["jsx", "typescript"],
        });
        const exports = new Set();
        traverse(ast, {
          ExportDefaultDeclaration(path) {
            exports.add("default");
          },
          ExportNamedDeclaration(path) {
            if (path.node.declaration) {
              if (
                path.node.declaration.type === "FunctionDeclaration" ||
                path.node.declaration.type === "ClassDeclaration"
              ) {
                exports.add(path.node.declaration.id.name);
              } else if (path.node.declaration.type === "VariableDeclaration") {
                path.node.declaration.declarations.forEach((decl) => {
                  if (decl.id.type === "Identifier") {
                    exports.add(decl.id.name);
                  }
                });
              }
            } else if (path.node.specifiers) {
              path.node.specifiers.forEach((spec) => {
                if (spec.type === "ExportSpecifier") {
                  exports.add(spec.exported.name);
                }
              });
            }
          },
        });

        // Remueve entradas antiguas para este módulo
        for (const key in manifest) {
          if (key.startsWith(fileUrl)) {
            delete manifest[key];
          }
        }

        // Agrega nuevas
        for (const expName of exports) {
          const manifestKey =
            expName === "default" ? fileUrl : `${fileUrl}#${expName}`;
          const relPath =
            "./" + path.relative(process.cwd(), id).replace(/\\/g, "/");
          manifest[manifestKey] = {
            id: relPath,
            chunks: expName,
            name: expName,
          };
        }

        this.addWatchFile(id);
      } else {
        // Remueve todas las entradas para este módulo si ya no es client
        for (const key in manifest) {
          if (key.startsWith(fileUrl)) {
            delete manifest[key];
          }
        }
        clientModules.delete(normalizedId);
        serverModules.add(normalizedId);
      }
    },

    generateBundle(outputOptions, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== "chunk") continue;

        for (const modulePath of Object.keys(chunk.modules)) {
          const absModulePath = path.resolve(modulePath);
          const baseFileUrl = pathToFileURL(absModulePath).href;

          // Actualiza todas las entradas que coincidan con el baseFileUrl (incluyendo #export)
          for (const manifestKey in manifest) {
            if (manifestKey.startsWith(baseFileUrl)) {
              manifest[manifestKey].id = "/" + fileName; // Apunta al mismo chunk
            }
          }
        }
      }

      const serialized = JSON.stringify(manifest, null, 2);
      mkdirSync(dirname(manifestPath), { recursive: true });
      writeFileSync(manifestPath, serialized);
    },
  };
}

module.exports = reactClientManifestPlugin;
