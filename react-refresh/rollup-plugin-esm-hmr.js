// plugins/rollup-plugin-esm-hmr.cjs
const fs = require("node:fs");
const path = require("node:path");
const { EsmHmrEngine } = require("./esm-hmr/server");
const { createServer } = require("node:http");
let changedIds = new Set();
function esmHmrPlugin({ root = process.cwd() } = {}) {
  const hmrEngine = new EsmHmrEngine();
  let serverStarted = false;

  return {
    name: "esm-hmr",

    buildStart() {
      if (!serverStarted) {
        const server = createServer();
        hmrEngine.clients.clear(); // optional cleanup
        // console.log("[esm-hmr] Starting WebSocket server...");
        new EsmHmrEngine({ server });
        server.listen(3002, () => {
          // console.log("[esm-hmr] WebSocket server listening on port 3002");
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
        // console.log("[HMR] inject import.meta.hot for", safeId);
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
    writeBundle(options, bundle) {
      for (const [fileName, chunkInfo] of Object.entries(bundle)) {
        for (const modulePath of Object.keys(chunkInfo.modules ?? {})) {
          if (changedIds.has(modulePath)) {
            // console.log(`Updated module ${modulePath} is in chunk ${fileName}`);
            const normalizedId = fileName;
            const entry = hmrEngine.getEntry(normalizedId);
            // console.log("[HMR] watchChange", normalizedId, entry);

            if (entry?.isHmrAccepted) {
              // console.log("[HMR] Broadcasting update for", normalizedId);
              hmrEngine.broadcastMessage({ type: "update", url: normalizedId });
            } else {
              hmrEngine.broadcastMessage({ type: "reload" });
            }
          }
        }
      }
      changedIds.clear();
    },
  };
}

module.exports = {
  esmHmrPlugin,
};
