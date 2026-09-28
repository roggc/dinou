import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";
import createScopedName from "../../core/createScopedName.js";
import postCssModules from "postcss-modules";
import postcss from "postcss";
import postcssImport from "postcss-import";
import { getAbsPathWithExt } from "../../core/get-abs-path-with-ext.js";
import { pathToFileURL } from "node:url";
import resolve from "resolve";
import createPostCSSExtractPlugin from "../plugins-postcss/postcss-extract-plugin.js";

const cssCache = new Map();
let cssCacheLoaded = false;
let cssCacheDirty = false;

function getCssCachePath() {
  const dir = path.resolve(process.cwd(), ".dinou/cache");
  return { dir, file: path.join(dir, "css-dev-cache.json") };
}

function loadCssCache() {
  if (cssCacheLoaded) return;
  cssCacheLoaded = true;
  try {
    const { file } = getCssCachePath();
    if (fsSync.existsSync(file)) {
      const parsed = JSON.parse(fsSync.readFileSync(file, "utf8"));
      for (const [k, v] of Object.entries(parsed)) {
        cssCache.set(k, v);
      }
    }
  } catch (e) {}
}

async function saveCssCache() {
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

export default function cssProcessorPlugin({ outdir = ".dinou/public", hmrEngine } = {}) {
  const { finalize, plugin: extractor, addExtractedCss } = createPostCSSExtractPlugin({
    outputFile: `${outdir}/styles.css`,
  });

  let isInitial = true;
  let hasCssChange = false;
  let postCssTotalTime = 0;
  let postCssCount = 0;

  return {
    name: "css-processor",
    setup(build) {
      build.onStart(() => {
        hasCssChange = false;
        postCssTotalTime = 0;
        postCssCount = 0;
      });

      build.onLoad({ filter: /\.css$/ }, async (args) => {
        const filePath = args.path;
        loadCssCache();
        const stat = await fs.stat(filePath);
        const cached = cssCache.get(filePath);

        if (cached && cached.mtime === stat.mtimeMs) {
          if (cached.extractedCss && typeof addExtractedCss === "function") {
            addExtractedCss(cached.extractedCss);
          }
          if (filePath.endsWith(".module.css")) {
            return {
              contents: `export default ${JSON.stringify(cached.map || {})};`,
              loader: "js",
              watchFiles: [filePath],
            };
          } else {
            return {
              contents: `/* global: ${path.basename(filePath)} */`,
              loader: "js",
              watchFiles: [filePath],
            };
          }
        }

        hasCssChange = true;
        const tPostCss0 = Date.now();
        const source = await fs.readFile(filePath, "utf8");

        let map = {};
        let extractedForFile = "";
        const fileCapturePlugin = {
          postcssPlugin: "file-capture",
          OnceExit(root) {
            extractedForFile = root.toString();
          },
        };

        await postcss([
          postcssImport({
            resolve: (id, basedir) => {
              const resolvedAlias = getAbsPathWithExt(id, {
                parentURL: pathToFileURL(basedir).href,
              });
              if (resolvedAlias) {
                return resolvedAlias;
              }
              if (id.startsWith("tailwindcss/")) {
                return resolve.sync(id, { basedir, extensions: [".css"] });
              }
              try {
                return resolve.sync(id, { basedir, extensions: [".css"] });
              } catch (err) {
                console.warn("FALLBACK FAILED:", id, err.message);
                throw err;
              }
            },
          }),
          tailwindcss(),
          autoprefixer,
          postCssModules({
            generateScopedName: (name, filename) => {
              if (!filename.endsWith(".module.css")) return name;
              return createScopedName(name, filename);
            },
            getJSON: (_, json) => {
              map = json;
            },
          }),
          fileCapturePlugin,
          extractor,
        ]).process(source, { from: filePath });

        postCssTotalTime += Date.now() - tPostCss0;
        postCssCount++;
        globalThis.__DINOU_POSTCSS_TIME__ = postCssTotalTime;
        globalThis.__DINOU_POSTCSS_COUNT__ = postCssCount;

        cssCache.set(filePath, {
          mtime: stat.mtimeMs,
          map,
          extractedCss: extractedForFile,
        });
        cssCacheDirty = true;

        if (filePath.endsWith(".module.css")) {
          return {
            contents: `export default ${JSON.stringify(map)};`,
            loader: "js",
            watchFiles: [filePath],
          };
        } else {
          return {
            contents: `/* global: ${path.basename(filePath)} */`,
            loader: "js",
            watchFiles: [filePath],
          };
        }
      });
      build.onEnd(() => {
        finalize();
        saveCssCache().catch(() => {});
        globalThis.__DINOU_POSTCSS_TIME__ = postCssTotalTime;
        globalThis.__DINOU_POSTCSS_COUNT__ = postCssCount;
        if (!isInitial && hasCssChange && hmrEngine?.value?.broadcastMessage) {
          hmrEngine.value.broadcastMessage({ type: "style-update", url: "/styles.css" });
        }
        isInitial = false;
        hasCssChange = false;
      });
    },
  };
}
