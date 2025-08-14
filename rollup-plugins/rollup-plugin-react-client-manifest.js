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

  return {
    name: "react-client-manifest",

    // async buildStart() {
    //   const files = await glob(["**/*.{js,jsx,ts,tsx}"], {
    //     cwd: srcDir,
    //     absolute: true,
    //   });

    //   for (const absPath of files) {
    //     const code = readFileSync(absPath, "utf8");

    //     // Detects 'use client' directive at the top of the file
    //     if (!/^(['"])use client\1/.test(code.trim())) continue;

    //     const fileUrl = pathToFileURL(absPath).href;
    //     const relPath =
    //       "./" + path.relative(process.cwd(), absPath).replace(/\\/g, "/");

    //     manifest[fileUrl] = {
    //       id: relPath,
    //       chunks: "default",
    //       name: "default",
    //     };

    //     clientModules.add(absPath);

    //     // 👇 Emits this module as a separate chunk entry
    //     this.emitFile({
    //       type: "chunk",
    //       id: absPath,
    //       name: path.basename(absPath, path.extname(absPath)), // ex: 'counter'
    //     });
    //   }
    // },
    async buildStart() {
      const files = await glob(["**/*.{js,jsx,ts,tsx}"], {
        cwd: srcDir,
        absolute: true,
      });

      for (const absPath of files) {
        const code = readFileSync(absPath, "utf8");

        if (!/^(['"])use client\1/.test(code.trim())) continue;

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

        // if (exports.size === 0) {
        //   console.warn(`No exports found in client component: ${absPath}`);
        //   // continue;
        // }

        // Agrega entradas al manifiesto por cada export
        for (const expName of exports) {
          const manifestKey =
            expName === "default" ? fileUrl : `${fileUrl}#${expName}`;
          manifest[manifestKey] = {
            id: relPath,
            chunks: expName, // Puedes ajustar si usas chunks múltiples
            name: expName,
          };
        }

        clientModules.add(absPath);

        // Emite el chunk para el módulo completo (no por export)
        this.emitFile({
          type: "chunk",
          id: absPath,
          name: path.basename(absPath, path.extname(absPath)),
        });
      }
    },
    // watchChange(id) {
    //   // console.log(`File changed: ${id}`);
    //   if (
    //     !id.endsWith(".tsx") &&
    //     !id.endsWith(".jsx") &&
    //     !id.endsWith(".js") &&
    //     !id.endsWith(".ts")
    //   )
    //     return;
    //   if (!existsSync(id)) {
    //     const fileUrl = pathToFileURL(id).href;
    //     delete manifest[fileUrl];
    //     clientModules.delete(id);
    //     return;
    //   }
    //   const code = readFileSync(id, "utf8");

    //   const fileUrl = pathToFileURL(id).href;

    //   if (/^(['"])use client\1/.test(code.trim())) {
    //     const relPath =
    //       "./" + path.relative(process.cwd(), id).replace(/\\/g, "/");
    //     manifest[fileUrl] = {
    //       id: relPath,
    //       chunks: "default",
    //       name: "default",
    //     };
    //     clientModules.add(id);
    //     this.addWatchFile(id); // Make sure Rollup watches it
    //   } else {
    //     // If it was client but is no longer, remove it
    //     delete manifest[fileUrl];
    //     clientModules.delete(id);
    //   }
    // },
    watchChange(id) {
      console.log(`File changed: ${id}`);
      if (
        !id.endsWith(".tsx") &&
        !id.endsWith(".jsx") &&
        !id.endsWith(".js") &&
        !id.endsWith(".ts")
      )
        return;
      if (!existsSync(id)) {
        const fileUrl = pathToFileURL(id).href;
        delete manifest[fileUrl];
        clientModules.delete(id);
        return;
      }
      const code = readFileSync(id, "utf8");
      const fileUrl = pathToFileURL(id).href;

      if (/^(['"])use client\1/.test(code.trim())) {
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

        clientModules.add(id);
        this.addWatchFile(id);
      } else {
        // Remueve todas las entradas para este módulo si ya no es client
        for (const key in manifest) {
          if (key.startsWith(fileUrl)) {
            delete manifest[key];
          }
        }
        clientModules.delete(id);
      }
    },
    // generateBundle(outputOptions, bundle) {
    //   for (const [fileName, chunk] of Object.entries(bundle)) {
    //     if (chunk.type !== "chunk") continue;

    //     for (const modulePath of Object.keys(chunk.modules)) {
    //       const absModulePath = path.resolve(modulePath);
    //       const fileUrl = pathToFileURL(absModulePath).href;

    //       if (manifest[fileUrl]) {
    //         // manifest[fileUrl].chunks.push(fileName);
    //         manifest[fileUrl].id = "/" + fileName;
    //       }
    //     }
    //   }

    //   const serialized = JSON.stringify(manifest, null, 2);
    //   mkdirSync(dirname(manifestPath), { recursive: true });
    //   writeFileSync(manifestPath, serialized);
    //   // console.log(`✅ react-client-manifest.json written to ${manifestPath}`);
    // },
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
      // console.log(`✅ react-client-manifest.json written to ${manifestPath}`);
    },
  };
}

module.exports = reactClientManifestPlugin;
