import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import createScopedName from "../../core/createScopedName.js";
import { normalizePathCase } from "../../core/path-utils.js";
import {
  postcss,
  postCssModules,
  createBasePostCssPlugins,
  isTailwindStylesheetSource,
} from "../../core/postcss-pipeline.js";
import createPostCSSExtractPlugin from "../plugins-postcss/postcss-extract-plugin.js";

const CSS_CACHE_VERSION = 2;
const cssCache = new Map();
let cssCacheLoaded = false;
let cssCacheDirty = false;

function normalizeFileKey(filePath) {
  if (!filePath) return "";
  return normalizePathCase(path.resolve(filePath)).replace(/\\/g, "/");
}

function getFileMtimeSafe(filePath) {
  try {
    return fsSync.statSync(filePath).mtimeMs;
  } catch (e) {
    return -1;
  }
}

function isCssCacheEntryFresh(cached, rootPath) {
  if (!cached || cached.v !== CSS_CACHE_VERSION || cached.isTailwind) return false;
  const rootMtime = getFileMtimeSafe(rootPath);
  if (rootMtime < 0 || cached.mtime !== rootMtime) return false;
  if (Array.isArray(cached.deps)) {
    for (const dep of cached.deps) {
      if (getFileMtimeSafe(dep.path) !== dep.mtime) {
        return false;
      }
    }
  }
  return true;
}

function getCssCachePath() {
  const dir = path.resolve(process.cwd(), ".dinou/cache");
  return { dir, file: path.join(dir, "css-dev-cache.json") };
}

function loadCssCache() {
  if (process.env.NODE_ENV === "production") return;
  if (cssCacheLoaded) return;
  cssCacheLoaded = true;
  try {
    const { file } = getCssCachePath();
    if (fsSync.existsSync(file)) {
      const parsed = JSON.parse(fsSync.readFileSync(file, "utf8"));
      for (const [k, v] of Object.entries(parsed)) {
        if (v && v.v === CSS_CACHE_VERSION) {
          cssCache.set(k, v);
        }
      }
    }
  } catch (e) {}
}

async function saveCssCache() {
  if (process.env.NODE_ENV === "production") return;
  if (!cssCacheDirty) return;
  cssCacheDirty = false;
  try {
    const { dir, file } = getCssCachePath();
    if (!fsSync.existsSync(dir)) {
      fsSync.mkdirSync(dir, { recursive: true });
    }
    const data = {};
    for (const [k, v] of cssCache.entries()) {
      data[k] = v;
    }
    await fs.writeFile(file, JSON.stringify(data), "utf8");
  } catch (e) {}
}

export default function cssProcessorPlugin({
  outdir = ".dinou/public",
  hmrEngine,
  changedIds,
  cssRefreshRef,
  cssModuleClassChanges,
} = {}) {
  const { finalize, plugin: extractor, setExtractedCss } =
    createPostCSSExtractPlugin({
      outputFile: `${outdir}/styles.css`,
    });

  let isInitial = true;
  let hasCssChange = false;
  let postCssTotalTime = 0;
  let postCssCount = 0;
  const reloadedInCurrentBuild = new Set();
  const tailwindCssFiles = new Set();
  const emittedCssAssets = new Map();
  const lastSessionModuleMapJson = new Map();

  function recordEmittedCssAsset(resolvedAssetPath, assetFileName) {
    emittedCssAssets.set(assetFileName, resolvedAssetPath);
  }

  function flushEmittedCssAssets() {
    if (emittedCssAssets.size === 0) return;
    const isProduction = process.env.NODE_ENV === "production";
    const shouldWriteToDisk =
      process.env.DINOU_WRITE_TO_DISK === "true" || isProduction;

    for (const [assetFileName, absAssetPath] of emittedCssAssets.entries()) {
      if (!fsSync.existsSync(absAssetPath)) continue;
      try {
        const buf = fsSync.readFileSync(absAssetPath);
        if (typeof globalThis !== "undefined") {
          if (!globalThis.__DINOU_MEM_FILES__) {
            globalThis.__DINOU_MEM_FILES__ = new Map();
          }
          globalThis.__DINOU_MEM_FILES__.set(assetFileName, buf);
          globalThis.__DINOU_MEM_FILES__.set("/" + assetFileName, buf);
          globalThis.__DINOU_MEM_FILES__.set(path.basename(assetFileName), buf);
        }
        if (shouldWriteToDisk) {
          const destPath = path.resolve(outdir, assetFileName);
          const destDir = path.dirname(destPath);
          if (!fsSync.existsSync(destDir)) {
            fsSync.mkdirSync(destDir, { recursive: true });
          }
          fsSync.writeFileSync(destPath, buf);
        }
      } catch (e) {}
    }
  }

  async function processCssFile(filePath) {
    const absPath = path.resolve(filePath);
    const cacheKey = normalizeFileKey(absPath);
    const tPostCss0 = Date.now();
    const stat = await fs.stat(absPath);
    const source = await fs.readFile(absPath, "utf8");

    let map = {};
    let extractedForFile = "";
    const localAssets = [];
    const fileCapturePlugin = {
      postcssPlugin: "file-capture",
      OnceExit(root) {
        extractedForFile = root.toString();
      },
    };

    const result = await postcss([
      ...createBasePostCssPlugins({
        onAsset: (resolvedAssetPath, assetFileName) => {
          localAssets.push({ resolvedAssetPath, assetFileName });
          recordEmittedCssAsset(resolvedAssetPath, assetFileName);
        },
      }),
      postCssModules({
        generateScopedName: (name, filename) => {
          if (!filename || !filename.endsWith(".module.css")) return name;
          return createScopedName(name, filename);
        },
        getJSON: (_, json) => {
          map = json || {};
        },
      }),
      fileCapturePlugin,
      extractor,
    ]).process(source, { from: absPath });

    const depPaths = new Set();
    let usesTailwind = isTailwindStylesheetSource(source);
    if (Array.isArray(result.messages)) {
      for (const msg of result.messages) {
        if (msg && msg.type === "dependency" && msg.file) {
          const resolvedDep = path.resolve(msg.file);
          depPaths.add(resolvedDep);
          if (resolvedDep.replace(/\\/g, "/").includes("/tailwindcss/")) {
            usesTailwind = true;
          }
        }
        if (msg && msg.type === "dir-dependency") {
          usesTailwind = true;
        }
      }
    }
    depPaths.delete(absPath);

    if (usesTailwind) {
      tailwindCssFiles.add(absPath);
    } else {
      tailwindCssFiles.delete(absPath);
    }

    postCssTotalTime += Date.now() - tPostCss0;
    postCssCount++;
    globalThis.__DINOU_POSTCSS_TIME__ = postCssTotalTime;
    globalThis.__DINOU_POSTCSS_COUNT__ = postCssCount;

    const deps = Array.from(depPaths).map((depPath) => ({
      path: depPath,
      mtime: getFileMtimeSafe(depPath),
    }));

    if (process.env.NODE_ENV !== "production") {
      cssCache.set(cacheKey, {
        v: CSS_CACHE_VERSION,
        mtime: stat.mtimeMs,
        deps,
        assets: localAssets,
        isTailwind: usesTailwind,
        map,
        extractedCss: extractedForFile,
      });
      cssCacheDirty = true;
    }

    return {
      map,
      watchFiles: [absPath, ...Array.from(depPaths)],
    };
  }

  async function refreshTailwindStylesheets(skipReloaded = false) {
    let anyProcessed = false;
    for (const twFile of Array.from(tailwindCssFiles)) {
      if (!fsSync.existsSync(twFile)) {
        tailwindCssFiles.delete(twFile);
        continue;
      }
      if (skipReloaded && reloadedInCurrentBuild.has(normalizeFileKey(twFile))) {
        continue;
      }
      await processCssFile(twFile);
      anyProcessed = true;
    }
    if (!anyProcessed) return false;
    flushEmittedCssAssets();
    const stylesChanged = finalize();
    if (stylesChanged && hmrEngine?.value?.broadcastMessage) {
      hmrEngine.value.broadcastMessage({
        type: "style-update",
        url: "/styles.css",
      });
    }
    return stylesChanged;
  }

  if (cssRefreshRef && typeof cssRefreshRef === "object") {
    cssRefreshRef.refresh = () => refreshTailwindStylesheets(false);
  }

  return {
    name: "css-processor",
    setup(build) {
      build.onStart(() => {
        hasCssChange = false;
        postCssTotalTime = 0;
        postCssCount = 0;
        reloadedInCurrentBuild.clear();
        cssModuleClassChanges?.clear();
      });

      build.onLoad({ filter: /\.css$/ }, async (args) => {
        const filePath = path.resolve(args.path);
        const cacheKey = normalizeFileKey(filePath);
        const lowerKey = cacheKey.toLowerCase();
        loadCssCache();
        const cached =
          process.env.NODE_ENV !== "production" ? cssCache.get(cacheKey) : null;

        const isModule = filePath.endsWith(".module.css");
        if (cached && isCssCacheEntryFresh(cached, filePath)) {
          setExtractedCss(filePath, cached.extractedCss || "");
          if (isModule) {
            lastSessionModuleMapJson.set(
              lowerKey,
              JSON.stringify(cached.map || {})
            );
          }
          if (Array.isArray(cached.assets)) {
            for (const item of cached.assets) {
              recordEmittedCssAsset(item.resolvedAssetPath, item.assetFileName);
            }
          }
          const depFiles = Array.isArray(cached.deps)
            ? cached.deps.map((d) => d.path)
            : [];
          return {
            contents: isModule
              ? `export default ${JSON.stringify(cached.map || {})};`
              : `/* global: ${path.basename(filePath)} */`,
            loader: "js",
            watchFiles: [filePath, ...depFiles],
          };
        }

        hasCssChange = true;
        reloadedInCurrentBuild.add(cacheKey);
        const { map, watchFiles } = await processCssFile(filePath);

        if (isModule) {
          const nextMapJson = JSON.stringify(map || {});
          const prevMapJson = lastSessionModuleMapJson.get(lowerKey);
          lastSessionModuleMapJson.set(lowerKey, nextMapJson);
          if (
            !isInitial &&
            (prevMapJson === undefined || prevMapJson !== nextMapJson)
          ) {
            cssModuleClassChanges?.add(lowerKey);
          }
          return {
            contents: `export default ${nextMapJson};`,
            loader: "js",
            watchFiles,
          };
        }
        return {
          contents: `/* global: ${path.basename(filePath)} */`,
          loader: "js",
          watchFiles,
        };
      });

      build.onEnd(async () => {
        if (
          !isInitial &&
          tailwindCssFiles.size > 0 &&
          changedIds &&
          changedIds.size > 0
        ) {
          const hasSourceChange = Array.from(changedIds).some((id) =>
            /\.(?:[jt]sx?|mdx|html)$/i.test(id)
          );
          if (hasSourceChange) {
            for (const twFile of Array.from(tailwindCssFiles)) {
              if (!fsSync.existsSync(twFile)) {
                tailwindCssFiles.delete(twFile);
                continue;
              }
              if (!reloadedInCurrentBuild.has(normalizeFileKey(twFile))) {
                await processCssFile(twFile);
              }
            }
          }
        }

        flushEmittedCssAssets();
        const stylesChanged = finalize();
        saveCssCache().catch(() => {});
        globalThis.__DINOU_POSTCSS_TIME__ = postCssTotalTime;
        globalThis.__DINOU_POSTCSS_COUNT__ = postCssCount;
        if (
          !isInitial &&
          (hasCssChange || stylesChanged) &&
          hmrEngine?.value?.broadcastMessage
        ) {
          hmrEngine.value.broadcastMessage({
            type: "style-update",
            url: "/styles.css",
          });
        }
        isInitial = false;
        hasCssChange = false;
      });
    },
  };
}
