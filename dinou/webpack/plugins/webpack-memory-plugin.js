// dinou/webpack/plugins/webpack-memory-plugin.js
// Captures Webpack client assets, chunks, manifests, and sourcemaps in memory (globalThis.__DINOU_MEM_FILES__)
// and sets global raw manifests in dev mode to prevent massive disk writes.

import path from "node:path";

class WebpackMemoryPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    const isDev =
      process.env.NODE_ENV !== "production" ||
      process.env.DINOU_DEV === "true";

    // Only acts in development mode. In production, Webpack writes to .dinou/dist3 normally.
    if (!isDev) {
      return;
    }

    const pluginName = "WebpackMemoryPlugin";

    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.afterProcessAssets.tap(pluginName, (assets) => {
        if (typeof globalThis !== "undefined") {
          if (!globalThis.__DINOU_MEM_FILES__) {
            globalThis.__DINOU_MEM_FILES__ = new Map();
          }
        }

        if (typeof globalThis !== "undefined" && globalThis.__DINOU_MEM_FILES__) {
          const stylesInfo = compilation.getAsset("styles.css")?.info;
          if (!assets["styles.css"] || stylesInfo?.copied) {
            globalThis.__DINOU_MEM_FILES__.delete("styles.css");
            globalThis.__DINOU_MEM_FILES__.delete("/styles.css");
          }
        }

        for (const [filename, asset] of Object.entries(assets)) {
          if (!asset) continue;
          if (compilation.getAsset(filename)?.info?.copied) {
            continue;
          }

          const normKey = filename.replace(/\\/g, "/");
          const cleanKey = normKey.replace(/^\/+/, "");
          const raw = typeof asset.source === "function" ? asset.source() : asset;
          const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw || "");

          if (cleanKey === "react-client-manifest.json") {
            try {
              globalThis.__DINOU_RAW_CLIENT_MANIFEST__ = JSON.parse(buf.toString("utf8"));
            } catch (e) {}
            continue;
          }
          if (cleanKey === "server-functions-manifest.json") {
            try {
              globalThis.__DINOU_RAW_SERVER_FUNCTIONS_MANIFEST__ = JSON.parse(buf.toString("utf8"));
            } catch (e) {}
            continue;
          }
          if (cleanKey === "react-ssr-manifest.json") {
            continue;
          }

          if (typeof globalThis !== "undefined" && globalThis.__DINOU_MEM_FILES__) {
            globalThis.__DINOU_MEM_FILES__.set(cleanKey, buf);
            globalThis.__DINOU_MEM_FILES__.set("/" + cleanKey, buf);
            const base = path.basename(cleanKey);
            globalThis.__DINOU_MEM_FILES__.set(base, buf);
          }
        }
      });
    });
  }
}

export { WebpackMemoryPlugin };
export default WebpackMemoryPlugin;
