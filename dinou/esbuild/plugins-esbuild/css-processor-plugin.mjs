import fs from "node:fs/promises";
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

export default function cssProcessorPlugin({ outdir = ".dinou/public", hmrEngine } = {}) {
  const { finalize, plugin: extractor } = createPostCSSExtractPlugin({
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
        hasCssChange = true;
        const tPostCss0 = Date.now();
        const filePath = args.path;
        const source = await fs.readFile(filePath, "utf8");

        let map = {};

        await postcss([
          postcssImport({
            resolve: (id, basedir) => {
              const resolvedAlias = getAbsPathWithExt(id, {
                parentURL: pathToFileURL(basedir).href,
              });
              if (resolvedAlias) {
                console.log("ALIAS RESOLVED:", resolvedAlias);
                return resolvedAlias;
              }
              if (id.startsWith("tailwindcss/")) {
                console.log("TAILWIND INTERNAL:", id);
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
          extractor,
        ]).process(source, { from: filePath });

        postCssTotalTime += Date.now() - tPostCss0;
        postCssCount++;
        globalThis.__DINOU_POSTCSS_TIME__ = postCssTotalTime;
        globalThis.__DINOU_POSTCSS_COUNT__ = postCssCount;

        if (filePath.endsWith(".module.css")) {
          // console.log(`[CSS MODULE] ${path.basename(filePath)} →`, map);
          return {
            contents: `export default ${JSON.stringify(map)};`,
            loader: "js",
          };
        } else {
          return {
            contents: `/* global: ${path.basename(filePath)} */`,
            loader: "js",
          };
        }
      });
      build.onEnd(() => {
        finalize();
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
