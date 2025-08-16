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

  // Función para parsear el código y extraer exports
  function parseExports(code) {
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

    return exports;
  }

  // Función para actualizar el manifiesto con un módulo
  function updateManifestForModule(absPath, code, isClientModule) {
    const fileUrl = pathToFileURL(absPath).href;
    const relPath =
      "./" + path.relative(process.cwd(), absPath).replace(/\\/g, "/");

    // Remueve entradas antiguas para este módulo
    for (const key in manifest) {
      if (key.startsWith(fileUrl)) {
        delete manifest[key];
      }
    }

    if (isClientModule) {
      const exports = parseExports(code);
      for (const expName of exports) {
        const manifestKey =
          expName === "default" ? fileUrl : `${fileUrl}#${expName}`;
        manifest[manifestKey] = {
          id: relPath,
          chunks: expName,
          name: expName,
        };
      }
      clientModules.add(absPath);
    } else {
      clientModules.delete(absPath);
    }
  }

  return {
    name: "react-client-manifest",
    async buildStart() {
      const files = await glob(["**/*.{js,jsx,ts,tsx}"], {
        cwd: srcDir,
        absolute: true,
      });

      for (const absPath of files) {
        const code = readFileSync(absPath, "utf8");
        const isClientModule = /^(['"])use client\1/.test(code.trim());

        if (!isClientModule) continue;

        updateManifestForModule(absPath, code, true);

        // Emite el chunk para el módulo completo
        this.emitFile({
          type: "chunk",
          id: absPath,
          name: path.basename(absPath, path.extname(absPath)),
        });
      }
    },
    watchChange(id) {
      if (!/\.(jsx?|tsx?)$/.test(id)) return;

      if (!existsSync(id)) {
        const fileUrl = pathToFileURL(id).href;
        for (const key in manifest) {
          if (key.startsWith(fileUrl)) {
            delete manifest[key];
          }
        }
        clientModules.delete(id);
        return;
      }

      const code = readFileSync(id, "utf8");
      const isClientModule = /^(['"])use client\1/.test(code.trim());

      updateManifestForModule(id, code, isClientModule);

      if (isClientModule) {
        this.addWatchFile(id);
      }
    },
    generateBundle(outputOptions, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== "chunk") continue;

        for (const modulePath of Object.keys(chunk.modules)) {
          const absModulePath = path.resolve(modulePath);
          const baseFileUrl = pathToFileURL(absModulePath).href;

          // Actualiza todas las entradas que coincidan con el baseFileUrl
          for (const manifestKey in manifest) {
            if (manifestKey.startsWith(baseFileUrl)) {
              manifest[manifestKey].id = "/" + fileName;
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
