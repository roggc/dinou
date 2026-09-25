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

let activeHmrEngine = null;

function esmHmrPlugin() {
  let hmrEngine;
  let server = null;
  let serverStarted = false;

  return {
    name: "esm-hmr",

    buildStart() {
      if (!serverStarted) {
        server = createServer();
        server.on("error", (err) => {
          if (err.code === "EADDRINUSE") {
            console.warn("⚠️ [Rollup HMR] Port 3001 already in use, reusing existing listener.");
          } else {
            console.error("❌ [Rollup HMR Server Error]:", err);
          }
        });
        hmrEngine = new EsmHmrEngine({ server });
        activeHmrEngine = hmrEngine;
        server.listen(3001, () => {
          // console.log("[esm-hmr] WebSocket server listening on port 3001");
        });
        serverStarted = true;
      }
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
      this.emitFile({
        type: "asset",
        fileName: "__hmr_client__.js",
        source: fs.readFileSync(clientPath, "utf-8"),
      });
    },

    writeBundle(_options, bundle) {
      if (changedIds.size === 0) return;

      let hasCssUpdate = false;
      for (const [fileName, chunkInfo] of Object.entries(bundle)) {
        const isChanged = Object.keys(chunkInfo.modules ?? {}).some((modPath) => {
          return changedIds.has(normalizePath(modPath));
        });

        if (isChanged) {
          if (fileName.endsWith(".css")) {
            hasCssUpdate = true;
            continue;
          }
          const urlId = "/" + fileName;
          const entry = hmrEngine?.getEntry(urlId) || hmrEngine?.getEntry(fileName);
          if (entry?.isHmrAccepted) {
            pendingUpdateUrls.add(urlId);
          } else {
            needsFullReload = true;
          }
        }
      }

      if (hasCssUpdate) {
        hmrEngine?.broadcastMessage({ type: "style-update", url: "/styles.css" });
      }

      if (needsFullReload) {
        hmrEngine?.broadcastMessage({ type: "reload" });
      } else {
        for (const url of pendingUpdateUrls) {
          hmrEngine?.broadcastMessage({ type: "update", url });
        }
      }

      changedIds.clear();
      pendingUpdateUrls.clear();
      needsFullReload = false;
    },

    closeWatcher() {
      if (server) {
        try { server.close(); } catch (e) {}
      }
    },
  };
}

module.exports = {
  esmHmrPlugin,
  getHmrEngine: () => activeHmrEngine,
};

