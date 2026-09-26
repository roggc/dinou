// plugins/rollup-plugin-esm-hmr.cjs
const fs = require("node:fs");
const path = require("node:path");
const { EsmHmrEngine } = require("./esm-hmr/server");
const { createServer } = require("node:http");
const changedIds = new Set();
const pendingUpdateUrls = new Set();
let needsFullReload = false;

function normalizePath(p) {
  return path.resolve(p).replace(/\\/g, "/").toLowerCase();
}

let activeServer = null;
let activeHmrEngine = null;

function esmHmrPlugin() {
  let hmrEngine = activeHmrEngine;

  return {
    name: "esm-hmr",

    buildStart() {
      if (!activeHmrEngine) {
        const hmrPort = Number(
          process.env.HMR_PORT || (Number(process.env.PORT || 3000) + 1)
        );
        activeServer = createServer();
        activeServer.on("error", (err) => {
          if (err.code === "EADDRINUSE") {
            console.warn(`⚠️ [Rollup HMR] Port ${hmrPort} already in use, reusing existing listener.`);
          } else {
            console.error("❌ [Rollup HMR Server Error]:", err);
          }
        });
        activeHmrEngine = new EsmHmrEngine({ server: activeServer });
        activeServer.listen(hmrPort, () => {
          // console.log(`[esm-hmr] WebSocket server listening on port ${hmrPort}`);
        });
      }
      hmrEngine = activeHmrEngine;
    },

    renderChunk(code, chunk) {
      if (
        !chunk.fileName.endsWith(".js") &&
        !chunk.fileName.endsWith(".jsx") &&
        !chunk.fileName.endsWith(".ts") &&
        !chunk.fileName.endsWith(".tsx")
      ) {
        return null;
      }

      const imports = Array.from(code.matchAll(/import\s+["'](.+?)["']/g)).map(
        (m) => m[1]
      );
      const normalizedId = chunk.fileName;
      const urlId = "/" + chunk.fileName;
      hmrEngine?.setEntry(urlId, imports, true);
      hmrEngine?.setEntry(normalizedId, imports, true);

      const isClientEntry = normalizedId === "main.js";

      // Inject client HMR runtime if it's the entry
      if (isClientEntry && !code.includes("/__hmr_client__.js")) {
        return {
          code: `import { createHotContext } from "/__hmr_client__.js";window.__hotContext = createHotContext;\n` + code,
          map: null,
        };
      }

      return null;
    },

    watchChange(id) {
      changedIds.add(normalizePath(id));
    },

    generateBundle(options, bundle) {
      const clientPath = path.resolve(__dirname, "./esm-hmr/client.js");
      let clientSource = fs.readFileSync(clientPath, "utf-8");
      const isDebug =
        process.env.DINOU_DEBUG === "true" ||
        process.env.DINOU_DEBUG === "1" ||
        process.env.DEBUG === "true" ||
        process.env.DEBUG === "1";
      if (isDebug) {
        clientSource = "window.__DINOU_DEBUG__ = true;\n" + clientSource;
      }
      this.emitFile({
        type: "asset",
        fileName: "__hmr_client__.js",
        source: clientSource,
      });
    },

    writeBundle(_options, bundle) {
      if (changedIds.size === 0) return;

      const hasCssUpdate = Array.from(changedIds).some((id) => {
        const lower = id.toLowerCase();
        return lower.endsWith(".css") || lower.endsWith(".scss") || lower.endsWith(".less");
      });

      for (const [fileName, chunkInfo] of Object.entries(bundle)) {
        if (fileName.endsWith(".css") || chunkInfo.type !== "chunk") {
          continue;
        }

        let isChangedByJs = false;

        // 1. Check facadeModuleId
        if (chunkInfo.facadeModuleId) {
          const facadeNorm = normalizePath(chunkInfo.facadeModuleId.replace(/\?.*$/, ""));
          if (changedIds.has(facadeNorm)) {
            isChangedByJs = true;
          }
        }

        // 2. Check modules in chunk
        if (!isChangedByJs && chunkInfo.modules) {
          isChangedByJs = Object.keys(chunkInfo.modules).some((modPath) => {
            const norm = normalizePath(modPath.replace(/\?.*$/, ""));
            const lower = norm.toLowerCase();
            if (
              (lower.endsWith(".css") || lower.endsWith(".scss") || lower.endsWith(".less")) &&
              !lower.endsWith(".module.css")
            ) {
              return false;
            }
            return changedIds.has(norm);
          });
        }

        // 3. Fallback: match chunk filename with base name or relative path of changedId
        if (!isChangedByJs) {
          const chunkFileNameLower = fileName.toLowerCase().replace(/\.[jt]sx?$/, "");
          for (const changedId of changedIds) {
            const relClean = changedId
              .replace(/^.*\/src\//, "")
              .replace(/\.[jt]sx?$/, "")
              .replace(/[^a-zA-Z0-9_-]/g, "_")
              .toLowerCase();
            if (relClean && chunkFileNameLower.includes(relClean)) {
              isChangedByJs = true;
              break;
            }
            const baseName = path.basename(changedId).replace(/\.[jt]sx?$/, "").toLowerCase();
            if (baseName.length > 2 && baseName !== "page" && baseName !== "layout" && baseName !== "index" && chunkFileNameLower.includes(baseName)) {
              isChangedByJs = true;
              break;
            }
          }
        }

        if (isChangedByJs) {
          const urlId = "/" + fileName;
          pendingUpdateUrls.add(urlId);
        }
      }

      if (hasCssUpdate) {
        hmrEngine?.broadcastMessage({ type: "style-update", url: "/styles.css" });
      }

      const timelineTime = () =>
        new Date().toTimeString().slice(0, 8) +
        "." +
        String(Date.now() % 1000).padStart(3, "0");
      const timelineRel = () =>
        globalThis.__TIMELINE_T0__
          ? `[+${Date.now() - globalThis.__TIMELINE_T0__}ms]`
          : ``;

      const isDebug =
        process.env.DINOU_DEBUG === "true" ||
        process.env.DINOU_DEBUG === "1" ||
        process.env.DEBUG === "true" ||
        process.env.DEBUG === "1";

      if (isDebug && changedIds.size > 0) {
        console.log(
          `⏱️ [TIMELINE ${timelineTime()}] ${timelineRel()} [HMR Rollup] Changed: [${Array.from(changedIds).join(", ")}] -> Chunks: [${Array.from(pendingUpdateUrls).join(", ")}]`
        );
      }

      if (pendingUpdateUrls.size > 0 && !needsFullReload) {
        for (const url of pendingUpdateUrls) {
          if (isDebug) {
            console.log(
              `⏱️ [TIMELINE ${timelineTime()}] ${timelineRel()} ⚡ [HMR Broadcast] Sending update to browser: ${url}`
            );
          } else {
            console.log(`⚡ [HMR] Updating client component: ${url}`);
          }
          hmrEngine?.broadcastMessage({ type: "update", url });
        }
      } else if (needsFullReload) {
        if (isDebug) {
          console.log(
            `⏱️ [TIMELINE ${timelineTime()}] ${timelineRel()} ⚡ [HMR Broadcast] Full reload triggered`
          );
        } else {
          console.log(`⚡ [HMR] Full reload triggered`);
        }
        hmrEngine?.broadcastMessage({ type: "reload" });
      }

      changedIds.clear();
      pendingUpdateUrls.clear();
      needsFullReload = false;
    },

    closeWatcher() {
      // Shared server stays open across restarts
    },
  };
}

function notifyFileChanged(absPath) {
  if (absPath) {
    changedIds.add(normalizePath(absPath));
  }
}

module.exports = {
  esmHmrPlugin,
  getHmrEngine: () => activeHmrEngine,
  notifyFileChanged,
  closeHmrServer: () => {
    if (activeServer) {
      try {
        activeServer.close();
      } catch (e) {}
      activeServer = null;
      activeHmrEngine = null;
    }
  },
};


