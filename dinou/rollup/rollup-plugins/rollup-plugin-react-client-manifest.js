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
const { useClientRegex } = require("../../constants.js");
const parseExports = require("../../core/parse-exports.js");

function getDefaultExportName(code) {
  let name = null;
  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
    traverse(ast, {
      ExportDefaultDeclaration(p) {
        const decl = p.node.declaration;
        if (decl.type === "Identifier") {
          name = decl.name;
        } else if (
          (decl.type === "FunctionDeclaration" || decl.type === "ClassDeclaration") &&
          decl.id
        ) {
          name = decl.id.name;
        }
      },
    });
  } catch (e) {
    // Ignore parse errors
  }
  return name;
}

function reactClientManifestPlugin({
  srcDir = path.resolve("src"),
  manifestPath = "react_client_manifest/react-client-manifest.json",
  assetInclude = regex,
} = {}) {
  const manifest = {};
  const clientModules = new Set();
  const serverModules = new Set();

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


  return {
    name: "react-client-manifest",
    async buildStart(options) {
      const srcFiles = await glob(["**/*.{js,jsx,ts,tsx}"], {
        cwd: srcDir,
        absolute: true,
      });

      // B. Extract the entry points from the Rollup configuration
      const inputOption = options.input;
      let entryPoints = [];

      if (typeof inputOption === "string") {
        // Case 1: input: "src/index.js"
        entryPoints = [inputOption];
      } else if (Array.isArray(inputOption)) {
        // Case 2: input: ["src/a.js", "src/b.js"]
        entryPoints = inputOption;
      } else if (typeof inputOption === "object" && inputOption !== null) {
        // Case 3: input: { main: "src/index.js", other: "src/other.js" }
        entryPoints = Object.values(inputOption);
      }
      const uniqueFiles = new Set([...srcFiles, ...entryPoints]);

      for (const absPath of uniqueFiles) {
        const code = readFileSync(absPath, "utf8");
        const normalizedPath = absPath.split(path.sep).join(path.posix.sep);
        const isClientModule = useClientRegex.test(code.trim());

        if (isClientModule) {
          clientModules.add(normalizedPath);
          updateManifestForModule(absPath, code, true);
          this.emitFile({
            type: "chunk",
            id: absPath,
            name: path.basename(absPath, path.extname(absPath)),
          });
        } else if (isPageOrLayout(absPath)) {
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
    async transform(code, id) {
      if (id.includes("\0") || id.startsWith("commonjsHelpers") || id.includes("node_modules/rollup") || id.includes("react-refresh")) return;
      const normalizedId = id.split(path.sep).join(path.posix.sep);
      const isClientModule = useClientRegex.test(code.trim());

      if (isClientModule) {
        console.log("👉 [react-client-manifest] Found client module in transform:", normalizedId);
        if (!clientModules.has(normalizedId)) {
          clientModules.add(normalizedId);
          updateManifestForModule(id, code, true);
          this.emitFile({
            type: "chunk",
            id: id,
            name: path.basename(id, path.extname(id)),
          });
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
      const isClientModule = useClientRegex.test(code.trim());

      updateManifestForModule(id, code, isClientModule);

      if (isClientModule) {
        clientModules.add(normalizedId);
        serverModules.delete(normalizedId);
        this.addWatchFile(id);
      } else {
        clientModules.delete(normalizedId);
        if (isPageOrLayout(id)) {
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

        // Process entry point facadeModuleId for default export preservation
        if (chunk.facadeModuleId) {
          const absModulePath = path.resolve(chunk.facadeModuleId);
          if (!absModulePath.includes("\0") && !absModulePath.startsWith("commonjsHelpers")) {
            const fileUrl = pathToFileURL(absModulePath).href;
            manifest[fileUrl] = {
              id: "/" + fileName,
              chunks: "default",
              name: "default",
            };
            manifest[fileUrl + "#default"] = {
              id: "/" + fileName,
              chunks: "default",
              name: "default",
            };

            if (!chunk.exports.includes("default")) {
              try {
                const originalCode = readFileSync(absModulePath, "utf8");
                const defaultName = getDefaultExportName(originalCode);
                if (defaultName && chunk.exports.includes(defaultName)) {
                  chunk.code += `\nexport { ${defaultName} as default };\n`;
                  chunk.exports.push("default");
                  console.log(`👉 [react-client-manifest] Appended default export alias to chunk ${fileName}: export { ${defaultName} as default };`);
                }
              } catch (err) {
                // Ignore errors
              }
            }
          }
        }

        // Map all modules in the chunk to this chunk in the manifest (only if they are client modules)
        for (const modulePath of Object.keys(chunk.modules)) {
          if (modulePath.includes("\0") || modulePath.startsWith("commonjsHelpers")) continue;
          const absModulePath = path.resolve(modulePath);
          const normalizedPath = absModulePath.split(path.sep).join(path.posix.sep);

          if (clientModules.has(normalizedPath)) {
            const fileUrl = pathToFileURL(absModulePath).href;
            // Update the chunk id for all exports of this module
            for (const key of Object.keys(manifest)) {
              if (key === fileUrl || key.startsWith(fileUrl + "#")) {
                manifest[key].id = "/" + fileName;
              }
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
