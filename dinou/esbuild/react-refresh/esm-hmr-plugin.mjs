// plugins-esbuild/esm-hmr-plugin.mjs
import fs from "node:fs/promises";
import path from "node:path";
import * as babelCore from "@babel/core";
import { babelConfig } from "./babel-config.js";
import { createServer } from "node:http";
import { EsmHmrEngine } from "./esm-hmr/server.js";
import { fileURLToPath } from "node:url";
import write from "../helpers-esbuild/write.mjs";
import normalizePath from "../helpers-esbuild/normalize-path.mjs";

const norm = (p) => path.resolve(p).replace(/\\/g, "/");
let serverStarted = false;

export default function esmHmrPlugin({
  entryName = "main",
  changedIds,
  hmrEngine,
} = {}) {
  return {
    name: "esm-hmr",

    setup(build) {
      const outdir = build.initialOptions.outdir || "public";
      const entryPoints = build.initialOptions.entryPoints;

      let entrySource = null;
      let entryAbsPath = null;
      let entryOutputName = null;

      if (!serverStarted) {
        const server = createServer();
        hmrEngine.value = new EsmHmrEngine({ server });
        server.listen(3001, () => {
          // console.log("[esm-hmr] WebSocket server listening on port 3001");
        });
        serverStarted = true;
      }

      build.onStart(async () => {
        const entryPath = entryPoints?.[entryName];
        if (!entryPath) return;

        entryAbsPath = path.resolve(entryPath);
        entrySource = await fs.readFile(entryAbsPath, "utf8");
        entryOutputName = entryName + ".js";

        // console.log(
        //   `[esm-hmr] Entry cargado: ${entryAbsPath} → ${entryOutputName}`
        // );
      });

      build.onLoad({ filter: /.*/ }, async (args) => {
        const abs = path.resolve(args.path);

        const outfileName = Object.entries(entryPoints).find(
          ([, value]) => norm(value) === norm(abs)
        )?.[0];

        if (!outfileName) {
          return null;
        }

        if (abs === entryAbsPath && entrySource) {
          let injectCode = `import { createHotContext } from "/__hmr_client__.js";\n`;
          injectCode += `window.__hotContext = createHotContext;\n`;

          return {
            contents: injectCode + entrySource,
            loader: "jsx",
          };
        }

        const source = await fs.readFile(args.path, "utf8");
        const transformed = babelCore.transformSync(source, {
          ...babelConfig,
          filename: abs,
        }).code;

        return {
          contents: transformed,
          loader: args.path.endsWith(".tsx") ? "tsx" : "jsx",
        };
      });

      build.onEnd(async (result) => {
        if (!result || !result.outputFiles) return;
        const clientPath = path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          "./esm-hmr/client.mjs"
        );
        const clientCode = await fs.readFile(clientPath, "utf8");
        const assetPath = path.join(outdir, "__hmr_client__.js");
        result.outputFiles.push({
          path: assetPath,
          contents: new TextEncoder().encode(clientCode),
        });
      });

      build.onEnd(async (result) => {
        if (!result.metafile) {
          // console.warn(
          //   "[hmr-plugin] Metafile is missing. Enable 'metafile: true'"
          // );
          return;
        }
        const bundleFiles = Object.keys(result.metafile.outputs);
        const normalizeRel = (p) => p.replace(/\\/g, "/");

        for (const bF of bundleFiles) {
          if (!bF.endsWith(".js")) {
            continue;
          }
          const relPath = normalizeRel(bF);
          const outputFile = result.outputFiles.find(
            (f) =>
              normalizeRel(path.relative(process.cwd(), f.path)) === relPath
          );
          if (!outputFile) continue;
          const baseName = path.basename(bF, ".js");

          const outfile = `${baseName}.js`;
          const outfile_basename = path.basename(outfile);
          const urlId = "/" + outfile_basename;
          const safeId = JSON.stringify(urlId);
          const frameworkEntries = [
            "main.js",
            "error.js",
            "serverFunctionProxy.js",
            "runtime.js",
            "react-refresh-entry.js",
          ];
          if (frameworkEntries.some((e) => e === outfile_basename)) continue;
          const source = new TextDecoder().decode(outputFile.contents);

          const imports = Array.from(
            source.matchAll(/import\s+["'](.+?)["']/g)
          ).map((m) => m[1]);

          hmrEngine.value.setEntry(urlId, imports, true);
          const wrappedCode = `
          const RefreshRuntime = window.__reactRefreshRuntime;
          let prevRefreshReg = window.$RefreshReg$;
          let prevRefreshSig = window.$RefreshSig$;
          window.$RefreshReg$ = (type, id) => {
            RefreshRuntime.register(type, ${safeId} + '#' + id);
          };
          window.$RefreshSig$ = RefreshRuntime?.createSignatureFunctionForTransform;
          if (!import.meta.hot) import.meta.hot = window.__hotContext?.(${safeId});
          // --- original code ---
          ${source}
          // --- end original code ---
          if (import.meta.hot) {
            import.meta.hot.accept(({module}) => {
              if (window.__isReactRefreshBoundary && window.__isReactRefreshBoundary(module)) {
                window.__debouncePerformReactRefresh();
              } else {
                // Fallback: full reload si no es boundary
                import.meta.hot.invalidate();
              }
            });
          }
          window.$RefreshReg$ = prevRefreshReg;
          window.$RefreshSig$ = prevRefreshSig;
        `;
          outputFile.contents = new TextEncoder().encode(wrappedCode);
        }
      });

      build.onEnd(write);

      build.onEnd(async (result) => {
        if (!result.metafile) {
          // console.warn(
          //   "[hmr-plugin] Metafile is missing. Enable 'metafile: true'"
          // );
          return;
        }
        // console.log("###############################", changedIds.size);
        if (changedIds.size === 0) return;
        const bundleFiles = Object.keys(result.metafile.outputs);
        const pendingUpdateUrls = new Set();
        let needsFullReload = false;
        for (const fileName of bundleFiles) {
          const chunk = result.metafile.outputs[fileName];
          const modules = Object.keys(chunk?.inputs ?? {});

          for (const modulePath of modules) {
            if (changedIds.has(normalizePath(path.resolve(modulePath)))) {
              // console.log("entry_________", fileName);
              // console.log(
              //   "dependencyTree",
              //   hmrEngine.value.getDependencyTree()
              // );
              const url = "/" + path.relative(outdir, fileName);
              // console.log("url", url);
              const entry = hmrEngine.value.getEntry(url);
              // console.log("entry______:", entry);
              if (entry?.isHmrAccepted) {
                pendingUpdateUrls.add(url);
              } else {
                needsFullReload = true;
              }
            }
          }
        }

        if (needsFullReload || pendingUpdateUrls.size === 0) {
          // console.log("Full reload____________");
          hmrEngine.value.broadcastMessage({ type: "reload" });
        } else {
          for (const url of pendingUpdateUrls) {
            // console.log("Updateeeee____________");
            hmrEngine.value.broadcastMessage({ type: "update", url });
          }
        }
        changedIds.clear();
      });
    },
  };
}

// === Exporta para usar en dev.mjs ===
export { esmHmrPlugin };
