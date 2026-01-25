// plugins-esbuild/esm-hmr-plugin.mjs
import fs from "node:fs/promises";
import path from "node:path";
// import * as babelCore from "@babel/core";
// import { babelConfig } from "./babel-config.js";
import { transformSync } from "@swc/core";
import { createServer } from "node:http";
import { EsmHmrEngine } from "./esm-hmr/server.js";
import { fileURLToPath } from "node:url";
import write from "../helpers-esbuild/write.mjs";
import normalizePath from "../helpers-esbuild/normalize-path.mjs";

const norm = (p) => path.resolve(p).replace(/\\/g, "/");
let serverStarted = false;

export default function esmHmrPlugin({
  entryNames = ["main", "error"],
  changedIds,
  hmrEngine,
} = {}) {
  return {
    name: "esm-hmr",

    setup(build) {
      const outdir = build.initialOptions.outdir || "public";
      const entryPoints = build.initialOptions.entryPoints;

      const entrySources = [];
      const entryAbsPaths = [];
      const entryOutputNames = [];

      if (!serverStarted) {
        const server = createServer();
        hmrEngine.value = new EsmHmrEngine({ server });
        server.listen(3001, () => {
          // console.log("[esm-hmr] WebSocket server listening on port 3001");
        });
        serverStarted = true;
      }

      build.onStart(async () => {
        for (const entryName of entryNames) {
          const entryPath = entryPoints?.[entryName];
          if (!entryPath) return;

          const absPath = path.resolve(entryPath);
          entryAbsPaths.push(absPath);
          entrySources.push(await fs.readFile(absPath, "utf8"));
          entryOutputNames.push(entryName + ".js");
        }
      });

      build.onLoad({ filter: /.*/ }, async (args) => {
        const abs = path.resolve(args.path);

        const absNorm = norm(abs);

        // 1. Comprobamos si es un ROOT Entry (client.jsx o error.tsx)
        // Estos son los que tienes guardados en 'entryAbsPaths'
        const rootIndex = entryAbsPaths.findIndex(
          (entryPath) => norm(entryPath) === absNorm,
        );

        // CASO A: Es Main o Error (Roots)
        if (rootIndex !== -1) {
          const source = entrySources[rootIndex];
          if (source) {
            let injectCode = `import { createHotContext } from "/__hmr_client__.js";\n`;
            injectCode += `window.__hotContext = createHotContext;\n`;

            // IMPORTANTE: Devolvemos 'source' CRUDO + inyección.
            // Sin pasar por Babel para evitar que $RefreshSig$ rompa la inicialización.
            return {
              contents: injectCode + source,
              loader: "jsx",
            };
          }
          return null;
        }

        // 2. Comprobamos si es cualquier OTRO Entry Point de la configuración de esbuild
        // (Aquí están tus páginas, layouts, componentes...)
        const isAnEntryPoint = Object.values(entryPoints).some(
          (val) => norm(path.resolve(val)) === absNorm,
        );

        // CASO B: Es una página o componente de usuario
        if (isAnEntryPoint) {
          // AQUÍ SÍ aplicamos Babel para tener React Fast Refresh
          const source = await fs.readFile(args.path, "utf8");

          // try {
          //   const transformed = babelCore.transformSync(source, {
          //     ...babelConfig,
          //     filename: abs,
          //   }).code;

          //   return {
          //     contents: transformed,
          //     loader: args.path.endsWith(".tsx") ? "tsx" : "jsx",
          //   };
          // } catch (e) {
          //   // Si babel falla, fallback al original
          //   return null;
          // }
          try {
            const { code } = transformSync(source, {
              filename: abs,
              jsc: {
                parser: {
                  syntax: "typescript",
                  tsx: true,
                  dynamicImport: true,
                },
                target: "es2022",
                transform: {
                  react: {
                    refresh: true,
                    development: true,
                    runtime: "automatic",
                  },
                },
              },
            });

            return {
              contents: code,
              loader: "js",
            };
          } catch (e) {
            console.error("SWC Error:", e);
            return null;
          }
        }

        // CASO C: No es un entry point (librerías, helpers internos, node_modules...)
        return null;
      });

      build.onEnd(async (result) => {
        if (!result || !result.outputFiles) return;
        const clientPath = path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          "./esm-hmr/client.mjs",
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
              normalizeRel(path.relative(process.cwd(), f.path)) === relPath,
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
            source.matchAll(/import\s+["'](.+?)["']/g),
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
