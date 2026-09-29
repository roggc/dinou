const { readFileSync, writeFileSync, mkdirSync, existsSync } = require("fs");
const path = require("path");
const { dirname } = require("path");
const glob = require("fast-glob");
const { pathToFileURL } = require("url");
let swc = null;
try {
  swc = require("@swc/core");
} catch (e) {}
const parser = require("@babel/parser");
const _traverseRaw = require("@babel/traverse");
const traverse = typeof _traverseRaw === "function" ? _traverseRaw : (_traverseRaw.default || _traverseRaw);
const { regex } = require("../../core/asset-extensions.js");
const createScopedName = require("../../core/createScopedName.js");
const { getAbsPathWithExt } = require("../../core/get-abs-path-with-ext.js");
const { useClientRegex, useServerRegex } = require("../../constants.js");
const parseExports = require("../../core/parse-exports.js");

function getDefaultExportName(code) {
  let name = null;
  if (swc && typeof swc.parseSync === "function") {
    try {
      const ast = swc.parseSync(code, { syntax: "typescript", tsx: true });
      for (const item of ast.body) {
        if (item.type === "ExportDefaultDeclaration") {
          const d = item.decl;
          if (d) {
            if (d.type === "Identifier") {
              name = d.value;
            } else if (
              (d.type === "FunctionDeclaration" || d.type === "ClassDeclaration") &&
              d.identifier?.value
            ) {
              name = d.identifier.value;
            }
          }
          break;
        } else if (item.type === "ExportDefaultExpression") {
          if (item.expression?.type === "Identifier") {
            name = item.expression.value;
            break;
          }
        }
      }
      if (name) return name;
    } catch (e) {}
  }

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
  manifestPath = ".dinou/react_client_manifest/react-client-manifest.json",
  assetInclude = regex,
  serverFiles = new Set(),
} = {}) {
  const manifest = {};
  const clientModules = new Set();
  const serverModules = new Set();
  let lastManifest = null;

const urlToManifestKeys = new Map();
const defaultExportCache = new Map();

function normalizeFsPath(p) {
  return path.resolve(p).replace(/\\/g, "/").toLowerCase();
}

function alignDrive(p) {
  const resolved = path.resolve(p);
  const cwd = process.cwd();
  if (process.platform === "win32" && resolved.length > 2 && resolved[1] === ":" && cwd.length > 2 && cwd[1] === ":") {
    return cwd[0] + resolved.slice(1);
  }
  return resolved;
}

function getStableChunkName(absPath) {
  const norm = absPath.replace(/\\/g, "/");
  if (norm.endsWith("/core/client-redirect.jsx") || norm.endsWith("/core/client-redirect.js")) {
    return "dinouClientRedirect";
  }
  if (norm.endsWith("/core/link.jsx") || norm.endsWith("/core/link.js")) {
    return "dinouLink";
  }
  const rel = path.relative(process.cwd(), absPath).replace(/\\/g, "/");
  const clean = rel
    .replace(/\.[jt]sx?$/, "")
    .replace(/^src\//, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  return clean || path.basename(absPath, path.extname(absPath));
}

function normalizeFileUrl(p) {
  const abs = path.resolve(p);
  const norm =
    abs.length > 1 && abs[1] === ":"
      ? abs[0].toUpperCase() + abs.slice(1)
      : abs;
  return pathToFileURL(norm).href;
}

function setManifestEntry(fileUrl, expName, entry) {
  const keys = [expName === "default" ? fileUrl : `${fileUrl}#${expName}`];
  if (process.platform === "win32") {
    const winMatch = fileUrl.match(/^file:\/\/\/([a-zA-Z]):(\/.*)$/);
    if (winMatch) {
      const drive = winMatch[1];
      const altDrive = drive === drive.toLowerCase() ? drive.toUpperCase() : drive.toLowerCase();
      const altUrl = `file:///${altDrive}:${winMatch[2]}`;
      keys.push(expName === "default" ? altUrl : `${altUrl}#${expName}`);
    }
  }
  const fileUrlLower = fileUrl.toLowerCase();
  let keySet = urlToManifestKeys.get(fileUrlLower);
  if (!keySet) {
    keySet = new Set();
    urlToManifestKeys.set(fileUrlLower, keySet);
  }
  for (const k of keys) {
    manifest[k] = { ...entry };
    keySet.add(k);
  }
}

  function updateManifestForModule(absPath, code, isClientModule) {
    const fileUrl = normalizeFileUrl(absPath);
    const fileUrlLower = fileUrl.toLowerCase();
    const stableChunkName = getStableChunkName(absPath);
    const stableChunkUrl = "/" + stableChunkName + ".js";

    // Delete previous keys from manifest and determine if an existing chunk ID should be kept
    const oldKeys = urlToManifestKeys.get(fileUrlLower);
    let previousChunkId = null;
    if (oldKeys) {
      for (const k of oldKeys) {
        if (!previousChunkId && manifest[k]?.id && manifest[k].id.startsWith("/")) {
          previousChunkId = manifest[k].id;
        }
        delete manifest[k];
      }
      oldKeys.clear();
    } else {
      for (const key in manifest) {
        if (key.toLowerCase().startsWith(fileUrlLower)) {
          if (!previousChunkId && manifest[key]?.id && manifest[key].id.startsWith("/")) {
            previousChunkId = manifest[key].id;
          }
          delete manifest[key];
        }
      }
    }

    if (isClientModule) {
      const exports = parseExports(code);
      const defaultName = getDefaultExportName(code);
      if (defaultName) {
        defaultExportCache.set(path.resolve(absPath), defaultName);
      }
      const chunkIdToUse = previousChunkId || stableChunkUrl;
      for (const expName of exports) {
        setManifestEntry(fileUrl, expName, {
          id: chunkIdToUse,
          chunks: expName,
          name: expName,
        });
      }
    }
  }

  // Updated to async, accepts pluginContext (Rollup's 'this'), resolves aliases/paths via this.resolve
  async function getImportsAndAssetsAndCsss(
    code,
    baseFilePath,
    visited = new Set(),
    pluginContext,
    sharedCache = null
  ) {
    if (visited.has(baseFilePath)) {
      return { imports: [], assets: [], csss: [] };
    }
    visited.add(baseFilePath);

    if (sharedCache && sharedCache.has(baseFilePath)) {
      return sharedCache.get(baseFilePath);
    }

    const importSources = [];
    if (swc && typeof swc.parseSync === "function") {
      try {
        const ast = swc.parseSync(code, { syntax: "typescript", tsx: true });
        for (const item of ast.body) {
          if (item.type === "ImportDeclaration" && item.source?.value) {
            importSources.push(item.source.value);
          }
        }
      } catch (e) {}
    }

    if (importSources.length === 0 && (!swc || typeof swc.parseSync !== "function")) {
      try {
        const ast = parser.parse(code, {
          sourceType: "module",
          plugins: ["jsx", "typescript"],
        });
        traverse(ast, {
          ImportDeclaration(nodePath) {
            if (nodePath.node?.source?.value) {
              importSources.push(nodePath.node.source.value);
            }
          },
        });
      } catch (e) {}
    }

    const imports = new Set();
    const assets = new Set();
    const csss = new Set();

    for (const source of importSources) {
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

      // Do not recurse into third-party libraries in node_modules for server asset discovery
      if (absImportPathWithExt.includes("node_modules")) {
        continue;
      }

      // Otherwise, it's a code import
      imports.add(absImportPathWithExt);

      try {
        const importCode = readFileSync(absImportPathWithExt, "utf8");
        const nested = await getImportsAndAssetsAndCsss(
          importCode,
          absImportPathWithExt,
          visited,
          pluginContext,
          sharedCache
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

    const result = {
      imports: Array.from(imports),
      assets: Array.from(assets),
      csss: Array.from(csss),
    };
    if (sharedCache) {
      sharedCache.set(baseFilePath, result);
    }
    return result;
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

  let isInitial = true;
  const knownClientChunks = new Map();
  const knownCssChunks = new Map();
  let hasPendingCssChange = false;

  return {
    name: "react-client-manifest",
    async buildStart(options) {
      if (!isInitial) {
        for (const entry of knownClientChunks.values()) {
          this.emitFile({
            type: "chunk",
            id: entry.id,
            name: entry.name,
          });
        }
        if (hasPendingCssChange) {
          for (const entry of knownCssChunks.values()) {
            this.emitFile({
              type: "chunk",
              id: entry.id,
              name: entry.name,
            });
          }
        }
        hasPendingCssChange = false;
        return;
      }
      isInitial = false;
      const tManifest0 = Date.now();

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
      const emittedChunks = new Set();
      const emittedAssets = new Set();
      const sharedAstCache = new Map();

      let fileScanIdx = 0;
      for (const absPath of uniqueFiles) {
        if (++fileScanIdx % 50 === 0) {
          await new Promise((resolve) => setImmediate(resolve));
        }
        const normAbs = alignDrive(absPath);
        const normKey = normalizeFsPath(normAbs);
        const code = readFileSync(normAbs, "utf8");
        const isClientModule = useClientRegex.test(code.trim());
        const isServerModule = useServerRegex.test(code.trim());
        if (isServerModule) {
          serverFiles.add(normKey);
        }

        if (isClientModule) {
          clientModules.add(normKey);
          updateManifestForModule(normAbs, code, true);
          this.addWatchFile(normAbs);
          const chunkName = getStableChunkName(normAbs);
          knownClientChunks.set(normKey, { id: normAbs, name: chunkName });
          if (!emittedChunks.has(normKey)) {
            emittedChunks.add(normKey);
            this.emitFile({
              type: "chunk",
              id: normAbs,
              name: chunkName,
            });
          }
        } else if (isPageOrLayout(normAbs)) {
          serverModules.add(normKey);
          this.addWatchFile(normAbs);
          const { imports, assets, csss } = await getImportsAndAssetsAndCsss(
            code,
            normAbs,
            new Set(),
            this,
            sharedAstCache
          );
          for (const importPath of imports) {
            this.addWatchFile(importPath);
          }
          // Emit assets for server components (replicate dinouAssetPlugin logic)
          for (const assetPath of assets) {
            this.addWatchFile(assetPath);
            if (!emittedAssets.has(assetPath)) {
              emittedAssets.add(assetPath);
              emitAsset(assetPath, this);
            }
          }
          for (const cssPath of csss) {
            this.addWatchFile(cssPath);
            const normCssAbs = alignDrive(cssPath);
            const normCssKey = normalizeFsPath(normCssAbs);
            const chunkName = path.basename(normCssAbs, path.extname(normCssAbs));
            knownCssChunks.set(normCssKey, { id: normCssAbs, name: chunkName });
            if (!emittedChunks.has(normCssKey)) {
              emittedChunks.add(normCssKey);
              // Emit CSS as a Rollup asset so postcss() processes it
              this.emitFile({
                type: "chunk",
                id: normCssAbs,
                name: chunkName,
              });
            }
          }
        }
      }
      globalThis.__DINOU_ROLLUP_MANIFEST_TIME__ = Date.now() - tManifest0;
    },
    async transform(code, id) {
      if (
        id.includes("\0") ||
        (id.includes("node_modules") && !id.includes("dinou")) ||
        id.startsWith("commonjsHelpers") ||
        id.includes("react-refresh")
      )
        return;
      if (!useClientRegex.test(code)) return;
      const normAbs = alignDrive(id);
      const normId = normalizeFsPath(normAbs);

      if (!clientModules.has(normId)) {
        clientModules.add(normId);
        updateManifestForModule(normAbs, code, true);
        const chunkName = getStableChunkName(normAbs);
        knownClientChunks.set(normId, { id: normAbs, name: chunkName });
        this.emitFile({
          type: "chunk",
          id: normAbs,
          name: chunkName,
        });
      }
    },
    async watchChange(id) {
      const lower = id.toLowerCase();
      if (lower.endsWith(".css") || lower.endsWith(".scss") || lower.endsWith(".less")) {
        hasPendingCssChange = true;
        return;
      }
      if (
        !lower.endsWith(".tsx") &&
        !lower.endsWith(".jsx") &&
        !lower.endsWith(".js") &&
        !lower.endsWith(".ts")
      )
        return;
      const normAbs = alignDrive(id);
      const normId = normalizeFsPath(normAbs);
      if (!existsSync(normAbs)) {
        const fileUrl = normalizeFileUrl(normAbs);
        const fileUrlLower = fileUrl.toLowerCase();
        for (const key in manifest) {
          if (key.toLowerCase().startsWith(fileUrlLower)) {
            delete manifest[key];
          }
        }
        clientModules.delete(normId);
        serverModules.delete(normId);
        serverFiles.delete(normId);
        knownClientChunks.delete(normId);
        return;
      }
      const code = readFileSync(normAbs, "utf8");
      const isClientModule = useClientRegex.test(code.trim());
      const isServerModule = useServerRegex.test(code.trim());
      if (isServerModule) {
        serverFiles.add(normId);
      } else {
        serverFiles.delete(normId);
      }

      updateManifestForModule(normAbs, code, isClientModule);

      if (isClientModule) {
        clientModules.add(normId);
        const chunkName = getStableChunkName(normAbs);
        knownClientChunks.set(normId, { id: normAbs, name: chunkName });
        serverModules.delete(normId);
        this.addWatchFile(normAbs);
      } else {
        clientModules.delete(normId);
        knownClientChunks.delete(normId);
        if (isPageOrLayout(normAbs)) {
          serverModules.add(normId);
          this.addWatchFile(normAbs);
          const { imports, assets, csss } = await getImportsAndAssetsAndCsss(
            code,
            normAbs,
            new Set(),
            this
          );
          for (const importPath of imports) {
            this.addWatchFile(importPath);
          }
          for (const assetPath of assets) {
            this.addWatchFile(assetPath);
          }
          for (const cssPath of csss) {
            this.addWatchFile(cssPath);
            const normCssAbs = alignDrive(cssPath);
            const normCssKey = normalizeFsPath(normCssAbs);
            const chunkName = path.basename(normCssAbs, path.extname(normCssAbs));
            knownCssChunks.set(normCssKey, { id: normCssAbs, name: chunkName });
          }
        } else {
          serverModules.delete(normId);
        }
      }
    },
    generateBundle(outputOptions, bundle) {
      const normFsPathCache = new Map();
      function getNormFsPath(p) {
        let n = normFsPathCache.get(p);
        if (!n) {
          n = normalizeFsPath(p);
          normFsPathCache.set(p, n);
        }
        return n;
      }

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== "chunk") continue;
        const chunkUrl = "/" + fileName;

        // Process entry point facadeModuleId for default export preservation
        if (chunk.facadeModuleId) {
          const absModulePath = path.resolve(chunk.facadeModuleId);
          if (
            !absModulePath.includes("\0") &&
            !absModulePath.startsWith("commonjsHelpers") &&
            (!absModulePath.includes("node_modules") || absModulePath.includes("dinou"))
          ) {
            const normPath = getNormFsPath(absModulePath);
            if (clientModules.has(normPath)) {
              const fileUrl = normalizeFileUrl(absModulePath);
              const fileUrlLower = fileUrl.toLowerCase();
              const keys = urlToManifestKeys.get(fileUrlLower);
              if (keys) {
                for (const k of keys) {
                  if (manifest[k]) manifest[k].id = chunkUrl;
                }
              }
              setManifestEntry(fileUrl, "default", {
                id: chunkUrl,
                chunks: "default",
                name: "default",
              });

              if (!chunk.exports.includes("default")) {
                const defaultName = defaultExportCache.get(absModulePath);
                if (defaultName && chunk.exports.includes(defaultName)) {
                  chunk.code += `\nexport { ${defaultName} as default };\n`;
                  chunk.exports.push("default");
                }
              }
            }
          }
        }

        // Map all modules in the chunk to this chunk in the manifest (only if they are client modules)
        for (const modulePath of Object.keys(chunk.modules)) {
          if (
            modulePath.includes("\0") ||
            modulePath.startsWith("commonjsHelpers") ||
            (modulePath.includes("node_modules") && !modulePath.includes("dinou"))
          ) {
            continue;
          }
          const normPath = getNormFsPath(modulePath);

          if (clientModules.has(normPath)) {
            const fileUrl = normalizeFileUrl(modulePath);
            const fileUrlLower = fileUrl.toLowerCase();
            const keys = urlToManifestKeys.get(fileUrlLower);
            if (keys) {
              for (const k of keys) {
                if (manifest[k]) manifest[k].id = chunkUrl;
              }
            }
          }
        }
      }

      function areManifestsSemanticallyEqual(m1, m2) {
        if (!m1 || !m2) return false;
        const k1 = Object.keys(m1);
        const k2 = Object.keys(m2);
        if (k1.length !== k2.length) return false;
        for (const k of k1) {
          const v1 = m1[k];
          const v2 = m2[k];
          if (!v2) return false;
          if (
            v1.id !== v2.id ||
            v1.name !== v2.name ||
            v1.chunks !== v2.chunks
          ) {
            return false;
          }
        }
        return true;
      }

      if (typeof globalThis !== "undefined") {
        globalThis.__DINOU_RAW_CLIENT_MANIFEST__ = { ...manifest };
      }

      const isDev = process.env.NODE_ENV !== "production" || process.env.DINOU_DEV === "true";
      const shouldWriteToDisk = process.env.DINOU_WRITE_TO_DISK === "true" || !isDev;

      let existingManifest = null;
      if (shouldWriteToDisk && existsSync(manifestPath)) {
        try {
          existingManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
        } catch (e) {}
      }

      if (!lastManifest || !areManifestsSemanticallyEqual(lastManifest, manifest)) {
        lastManifest = JSON.parse(JSON.stringify(manifest));
        if (shouldWriteToDisk) {
          const sortedManifest = {};
          for (const k of Object.keys(manifest).sort()) {
            sortedManifest[k] = manifest[k];
          }
          mkdirSync(dirname(manifestPath), { recursive: true });
          writeFileSync(manifestPath, JSON.stringify(sortedManifest, null, 2));
        }
        manifestUpdatedCallback?.();
      }
    },
  };
}

let manifestUpdatedCallback = null;
function setOnManifestUpdated(cb) {
  manifestUpdatedCallback = cb;
}
reactClientManifestPlugin.setOnManifestUpdated = setOnManifestUpdated;

module.exports = reactClientManifestPlugin;
