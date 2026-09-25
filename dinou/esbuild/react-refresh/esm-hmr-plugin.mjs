// plugins-esbuild/esm-hmr-plugin.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { transformSync } from "@swc/core";
import { createServer } from "node:http";
import { EsmHmrEngine } from "./esm-hmr/server.js";
import { fileURLToPath } from "node:url";
import write from "../helpers-esbuild/write.mjs";
import normalizePath from "../helpers-esbuild/normalize-path.mjs";

const norm = (p) => path.resolve(p).replace(/\\/g, "/");
const normKey = (p) => {
  if (!p) return "";
  let s = path.resolve(p).replace(/\\/g, "/");
  if (process.platform === "win32") {
    s = s.replace(/^([a-zA-Z]):/, (_, d) => d.toLowerCase() + ":");
  }
  return s;
};
let serverStarted = false;

export default function esmHmrPlugin({
  entryNames = ["main", "error"],
  changedIds,
  hmrEngine,
} = {}) {
  return {
    name: "esm-hmr",

    setup(build) {
      let isInitialBuild = true;
      const outdir = build.initialOptions.outdir || ".dinou/public";
      const entryPoints = build.initialOptions.entryPoints;

      const entrySources = [];
      const entryAbsPaths = [];
      const entryOutputNames = [];

      if (!serverStarted) {
        const server = createServer();
        server.on("error", (err) => {
          if (err.code === "EADDRINUSE") {
            // Port already in use, keep quiet or warn
          } else {
            console.error("❌ [esm-hmr] Server error:", err);
          }
        });
        hmrEngine.value = new EsmHmrEngine({ server });
        hmrEngine.value.server = server;
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

        // 1. Check if it is a ROOT Entry (client.jsx or error.tsx)
        // These are the ones saved in 'entryAbsPaths'
        const rootIndex = entryAbsPaths.findIndex(
          (entryPath) => norm(entryPath) === absNorm,
        );

        // CASE A: It is Main or Error (Roots)
        if (rootIndex !== -1) {
          const source = entrySources[rootIndex];
          if (source) {
            let injectCode = `import { createHotContext } from "/__hmr_client__.js";\n`;
            injectCode += `window.__hotContext = createHotContext;\n`;

            // IMPORTANT: We return RAW 'source' + injection.
            // Without passing through Babel/SWC to prevent $RefreshSig$ from breaking initialization.
            return {
              contents: injectCode + source,
              loader: "jsx",
            };
          }
          return null;
        }

        // 2. Check if it is any OTHER Entry Point from the esbuild configuration
        // (Here are your pages, layouts, components...)
        const isAnEntryPoint = Object.values(entryPoints).some(
          (val) => norm(path.resolve(val)) === absNorm,
        );

        // CASE B: It is a user page or component
        if (isAnEntryPoint) {
          // HERE we DO apply SWC transformation to enable React Fast Refresh
          const source = await fs.readFile(args.path, "utf8");
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

        // CASE C: It is not an entry point (libraries, internal helpers, node_modules...)
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

          // Only wrap user component chunks that contain actual app code (not third-party libraries/vendor)
          const outputInfo = result.metafile.outputs[bF];
          const inputFiles = Object.keys(outputInfo?.inputs || {});
          const hasUserCode = inputFiles.some(
            (f) =>
              !f.includes("node_modules") &&
              !f.includes("dinou") &&
              /\.(jsx?|tsx?)$/.test(f)
          );
          if (!hasUserCode) continue;

          const source = new TextDecoder().decode(outputFile.contents);

          const imports = Array.from(
            source.matchAll(/import\s+["'](.+?)["']/g),
          ).map((m) => m[1]);

          hmrEngine.value.setEntry(urlId, imports, true);
          const acceptedEntry = hmrEngine.value.getEntry(urlId, true);
          acceptedEntry.isHmrAccepted = true;
          const wrappedCode = `
          const RefreshRuntime = window.__reactRefreshRuntime;
          let prevRefreshReg = window.$RefreshReg$;
          let prevRefreshSig = window.$RefreshSig$;
          window.$RefreshReg$ = (type, id) => {
            const fullId = (id && id.includes('#')) ? id : (${safeId} + '#' + id);
            RefreshRuntime.register(type, fullId);
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
                // Fallback: full reload if it is not a boundary
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
        if (isInitialBuild) {
          isInitialBuild = false;
          changedIds?.clear();
          return;
        }

        if (!result.metafile) {
          return;
        }

        if (changedIds.size === 0) return;

        // If only CSS files were modified, styles are updated via style-update in cssProcessorPlugin.
        // Do NOT trigger full reload or JS component updates.
        const isCssOnly = Array.from(changedIds).every((id) => {
          const lower = id.toLowerCase();
          return (
            (lower.endsWith(".css") || lower.endsWith(".scss") || lower.endsWith(".less")) &&
            !lower.endsWith(".module.css")
          );
        });
        if (isCssOnly) {
          changedIds.clear();
          return;
        }

        const bundleFiles = Object.keys(result.metafile.outputs);
        const pendingUpdateUrls = new Set();
        let needsFullReload = false;

        const frameworkEntries = new Set([
          "main.js",
          "error.js",
          "serverFunctionProxy.js",
          "runtime.js",
          "react-refresh-entry.js",
        ]);

        for (const fileName of bundleFiles) {
          // Only inspect actual JavaScript output chunks (skip sourcemaps, css, images, etc.)
          if (!fileName.endsWith(".js") || fileName.endsWith(".js.map")) {
            continue;
          }
          const baseName = path.basename(fileName);
          if (frameworkEntries.has(baseName)) {
            continue;
          }

          const chunk = result.metafile.outputs[fileName];
          const modules = Object.keys(chunk?.inputs ?? {});

          const isChangedByModule = modules.some((modulePath) => {
            const cleanPath = modulePath.replace(/^[a-zA-Z0-9_-]+:/, "");
            const norm = normKey(cleanPath);
            const lower = norm.toLowerCase();
            if (
              (lower.endsWith(".css") || lower.endsWith(".scss") || lower.endsWith(".less")) &&
              !lower.endsWith(".module.css")
            ) {
              return false;
            }
            return changedIds.has(norm);
          });

          if (isChangedByModule) {
            const url = "/" + path.relative(outdir, fileName).replace(/\\/g, "/");
            const baseNameUrl = "/" + baseName;
            const entry = hmrEngine.value.getEntry(url) || hmrEngine.value.getEntry(baseNameUrl);
            if (entry?.isHmrAccepted) {
              pendingUpdateUrls.add(baseNameUrl);
            } else {
              needsFullReload = true;
            }
          }
        }

        if (pendingUpdateUrls.size > 0 && !needsFullReload) {
          for (const url of pendingUpdateUrls) {
            console.log(`⚡ [HMR Dev] Updating client component: ${url}`);
            hmrEngine.value.broadcastMessage({ type: "update", url });
          }
        } else if (needsFullReload || pendingUpdateUrls.size === 0) {
          console.log(`⚡ [HMR Dev] Full reload triggered (needsFullReload: ${needsFullReload}, pendingUpdateUrls: ${Array.from(pendingUpdateUrls)})`);
          hmrEngine.value.broadcastMessage({ type: "reload" });
        }
        changedIds.clear();
      });
    },
  };
}

export { esmHmrPlugin };
