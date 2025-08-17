// plugins/rollup-plugin-esm-hmr.cjs
const fs = require("node:fs");
const path = require("node:path");
const { EsmHmrEngine } = require("./esm-hmr/server");
const { createServer } = require("node:http");
const changedIds = new Set();
const pendingUpdateUrls = new Set();
let needsFullReload = false;
function esmHmrPlugin() {
  let hmrEngine;
  let serverStarted = false;

  return {
    name: "esm-hmr",

    buildStart() {
      if (!serverStarted) {
        const server = createServer();
        hmrEngine = new EsmHmrEngine({ server });
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

      const acceptsHmr = code.includes("import.meta.hot.accept");
      const imports = Array.from(code.matchAll(/import\s+["'](.+?)["']/g)).map(
        (m) => m[1]
      );
      const normalizedId = chunk.fileName;
      hmrEngine.setEntry(normalizedId, imports, true);

      const isClientEntry = normalizedId === "main.js";

      let injectCode = "";

      // 🔥 Inject client HMR runtime if it's the entry
      if (isClientEntry && !code.includes("/__hmr_client__.js")) {
        injectCode += `import { createHotContext } from "/__hmr_client__.js";window.__hotContext = createHotContext;\n`;
      }

      // 🔥 Inject import.meta.hot definition if user accepts HMR
      if (acceptsHmr) {
        const safeId = JSON.stringify(normalizedId);
        injectCode += `if (!import.meta.hot) import.meta.hot = window.__hotContext?.(${safeId});\n`;
      }

      if (injectCode) {
        code = injectCode + code;
      }

      return {
        code,
        map: null,
      };
    },

    watchChange(id) {
      changedIds.add(id);
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
      for (const [fileName, chunkInfo] of Object.entries(bundle)) {
        for (const modulePath of Object.keys(chunkInfo.modules ?? {})) {
          if (changedIds.has(path.resolve(modulePath))) {
            const entry = hmrEngine.getEntry(fileName);
            if (entry?.isHmrAccepted) {
              pendingUpdateUrls.add(fileName);
            } else {
              needsFullReload = true;
            }
          }
        }
      }
    },
    closeBundle() {
      if (changedIds.size === 0) return;

      if (needsFullReload || pendingUpdateUrls.size === 0) {
        // console.log("[HMR] Full reload");
        hmrEngine.broadcastMessage({ type: "reload" });
      } else {
        for (const url of pendingUpdateUrls) {
          // console.log("[HMR] Broadcasting update for", url);
          hmrEngine.broadcastMessage({ type: "update", url });
        }
      }

      changedIds.clear();
      pendingUpdateUrls.clear();
      needsFullReload = false;
    },
  };
}

module.exports = {
  esmHmrPlugin,
};
