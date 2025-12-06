const { readFileSync, writeFileSync, mkdirSync, existsSync } = require("fs");
const path = require("path");
const { dirname } = require("path");
const glob = require("fast-glob");
const { pathToFileURL } = require("url");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { regex } = require("../../core/asset-extensions.js");
const createScopedName = require("../../core/createScopedName.js");
const { getAbsPathWithExt } = require("../../core/get-abs-path-with-ext.js");

function reactClientManifestPlugin({
  srcDir = path.resolve("src"),
  manifestPath = "react_client_manifest/react-client-manifest.json",
  assetInclude = regex,
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

  // Updated to async, accepts pluginContext (Rollup's 'this'), resolves aliases/paths via this.resolve
  async function getImportsAndAssetsAndCsss(
    code,
    baseFilePath,
    visited = new Set(),
    pluginContext
  ) {
    if (visited.has(baseFilePath)) {
      return { imports: [], assets: [], csss: [] };
    }
    visited.add(baseFilePath);

    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
    const imports = new Set();
    const assets = new Set();
    const csss = new Set();

    // Collect all ImportDeclarations first (to await resolves in batch if needed, but sequential is fine)
    const importNodes = [];
    traverse(ast, {
      ImportDeclaration(nodePath) {
        importNodes.push(nodePath);
      },
    });

    for (const nodePath of importNodes) {
      const source = nodePath.node.source.value;
      // console.log("source", source);

      // Resolve the import
      const absImportPathWithExt = getAbsPathWithExt(source, {
        parentURL: pathToFileURL(baseFilePath).href,
      });
      if (!absImportPathWithExt) {
        // console.warn(`[resolve failed] ${source} from ${baseFilePath}`);
        continue;
      }

      // console.log("absImportPath", absImportPath);
      if (
        absImportPathWithExt.endsWith(".css") ||
        absImportPathWithExt.endsWith(".scss") ||
        absImportPathWithExt.endsWith(".less")
      ) {
        csss.add(absImportPathWithExt); // Track for watch
        continue; // Don’t recurse into styles
      }

      // Check if it's an asset
      if (assetInclude.test(absImportPathWithExt)) {
        assets.add(absImportPathWithExt);
        continue; // Don't recurse for assets
      }

      // Otherwise, it's a code import
      imports.add(absImportPathWithExt);

      try {
        const importCode = readFileSync(absImportPathWithExt, "utf8");
        const nested = await getImportsAndAssetsAndCsss(
          importCode,
          absImportPathWithExt,
          visited,
          pluginContext
        );
        nested.imports.forEach((nestedPath) => imports.add(nestedPath));
        nested.assets.forEach((nestedPath) => assets.add(nestedPath));
        nested.csss.forEach((nestedPath) => csss.add(nestedPath));
      } catch (err) {
        console.warn(
          `[react-client-manifest] Could not read import: ${absImportPathWithExt}`,
          err.message
        );
      }
    }

    return {
      imports: Array.from(imports),
      assets: Array.from(assets),
      csss: Array.from(csss),
    };
  }

  // New helper to emit a single asset (used in buildStart and watchChange)
  function emitAsset(absAssetPath, pluginContext) {
    const source = readFileSync(absAssetPath);
    const base = path.basename(absAssetPath, path.extname(absAssetPath));
    const scoped = createScopedName(base, absAssetPath);
    const ext = path.extname(absAssetPath);
    const fileName = `assets/${scoped}${ext}`;
    pluginContext.emitFile({
      type: "asset",
      fileName,
      source,
    });
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
          const { imports, assets, csss } = await getImportsAndAssetsAndCsss(
            code,
            absPath,
            new Set(),
            this
          );
          // console.log("assets", assets);
          for (const importPath of imports) {
            this.addWatchFile(importPath);
          }
          // Emit assets for server components (replicate dinouAssetPlugin logic)
          for (const assetPath of assets) {
            this.addWatchFile(assetPath);
            emitAsset(assetPath, this); // Emit assets
          }
          for (const cssPath of csss) {
            this.addWatchFile(cssPath);
            // Emit CSS as a Rollup asset so postcss() processes it
            this.emitFile({
              type: "chunk",
              id: cssPath,
              name: path.basename(cssPath, path.extname(cssPath)),
            });
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
          const { imports, assets, csss } = await getImportsAndAssetsAndCsss(
            code,
            id,
            new Set(),
            this
          );
          for (const importPath of imports) {
            this.addWatchFile(importPath);
          }
          // console.log("assets", assets);
          for (const assetPath of assets) {
            this.addWatchFile(assetPath);
            // emitAsset(assetPath, this); // Re-emit assets on server file change
          }
          for (const cssPath of csss) {
            this.addWatchFile(cssPath);
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
