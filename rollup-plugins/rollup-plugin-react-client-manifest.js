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

  function updateManifestForModule(absPath, code, isClientModule) {
    const fileUrl = pathToFileURL(absPath).href;
    const relPath =
      "./" + path.relative(process.cwd(), absPath).replace(/\\/g, "/");

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
    }
  }

  function getImports(code, baseFilePath, visited = new Set()) {
    if (visited.has(baseFilePath)) {
      return [];
    }
    visited.add(baseFilePath);

    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
    const imports = new Set();

    traverse(ast, {
      ImportDeclaration(nodePath) {
        const source = nodePath.node.source.value;
        if (source.startsWith(".")) {
          let absImportPath = path.resolve(path.dirname(baseFilePath), source);
          const extensions = [".js", ".jsx", ".ts", ".tsx"];
          if (!extensions.some((ext) => absImportPath.endsWith(ext))) {
            for (const ext of extensions) {
              const potentialPath = absImportPath + ext;
              if (existsSync(potentialPath)) {
                absImportPath = potentialPath;
                break;
              }
            }
          }
          if (existsSync(absImportPath)) {
            imports.add(absImportPath);
            try {
              const importCode = readFileSync(absImportPath, "utf8");
              const nestedImports = getImports(
                importCode,
                absImportPath,
                visited
              );
              nestedImports.forEach((nestedPath) => imports.add(nestedPath));
            } catch (err) {
              console.warn(
                `[react-client-manifest] Could not read import: ${absImportPath}`,
                err.message
              );
            }
          } else {
            console.warn(
              `[react-client-manifest] Import path not found: ${absImportPath}`
            );
          }
        }
      },
    });

    return Array.from(imports);
  }

  function isPageOrLayout(absPath) {
    const fileName = path.basename(absPath);
    return fileName.startsWith("page.") || fileName.startsWith("layout.");
  }

  function isAsyncDefaultExport(code) {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });

    let isAsync = false;

    traverse(ast, {
      ExportDefaultDeclaration(path) {
        let decl = path.node.declaration;

        if (decl.type === "Identifier") {
          const binding = path.scope.getBinding(decl.name);
          if (binding && binding.path) {
            decl = binding.path.node;
            if (decl.type === "VariableDeclarator") {
              decl = decl.init;
            }
          }
        }

        if (
          decl &&
          (decl.type === "FunctionDeclaration" ||
            decl.type === "ArrowFunctionExpression" ||
            decl.type === "FunctionExpression")
        ) {
          isAsync = decl.async;
        }
      },
    });

    return isAsync;
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
        const normalizedPath = absPath.split(path.sep).join(path.posix.sep);
        const isClientModule = /^(['"])use client\1/.test(code.trim());

        if (isClientModule) {
          clientModules.add(normalizedPath);
          updateManifestForModule(absPath, code, true);
          this.emitFile({
            type: "chunk",
            id: absPath,
            name: path.basename(absPath, path.extname(absPath)),
          });
        } else if (isPageOrLayout(absPath)) {
          if (!isAsyncDefaultExport(code)) {
            this.warn(
              `[react-client-manifest] The file ${normalizedPath} is a page or layout without "use client" directive, but its default export is not an async function. Add "use client" if it's a client component, or make the default export async if it's a server component.`
            );
          }
          serverModules.add(normalizedPath);
          this.addWatchFile(absPath);
          const imports = getImports(code, absPath);
          for (const importPath of imports) {
            this.addWatchFile(importPath);
          }
        }
      }
    },
    async watchChange(id) {
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
      const isClientModule = /^(['"])use client\1/.test(code.trim());

      updateManifestForModule(id, code, isClientModule);

      if (isClientModule) {
        clientModules.add(normalizedId);
        serverModules.delete(normalizedId);
        this.addWatchFile(id);
      } else {
        clientModules.delete(normalizedId);
        if (isPageOrLayout(id)) {
          if (!isAsyncDefaultExport(code)) {
            this.warn(
              `[react-client-manifest] The file ${normalizedId} is a page or layout without "use client" directive, but its default export is not an async function. Add "use client" if it's a client component, or make the default export async if it's a server component.`
            );
          }
          serverModules.add(normalizedId);
          this.addWatchFile(id);
          const imports = getImports(code, id);
          for (const importPath of imports) {
            this.addWatchFile(importPath);
          }
        } else {
          serverModules.delete(normalizedId);
        }
      }
    },
    generateBundle(outputOptions, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== "chunk") continue;
        for (const modulePath of Object.keys(chunk.modules)) {
          const absModulePath = path.resolve(modulePath);
          const baseFileUrl = pathToFileURL(absModulePath).href;
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
