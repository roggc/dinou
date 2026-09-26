// dinou/rollup/rollup-plugins/rollup-plugin-memory.js
// Stores all bundled chunks, assets and sourcemaps in memory (globalThis.__DINOU_MEM_FILES__)
// and deletes them from Rollup's emit queue in dev mode to prevent massive disk writes.

const path = require("node:path");

function rollupMemoryPlugin() {
  return {
    name: "rollup-memory-plugin",
    generateBundle(options, bundle) {
      const isDev =
        process.env.NODE_ENV !== "production" ||
        process.env.DINOU_DEV === "true";

      // Solo actúa en modo desarrollo. En producción, Rollup escribe a .dinou/dist3 normalmente.
      if (!isDev) {
        return;
      }

      const shouldWriteToDisk = process.env.DINOU_WRITE_TO_DISK === "true";

      if (typeof globalThis !== "undefined") {
        if (!globalThis.__DINOU_MEM_FILES__) {
          globalThis.__DINOU_MEM_FILES__ = new Map();
        }
      }

      for (const [fileName, item] of Object.entries(bundle)) {
        const normKey = fileName.replace(/\\/g, "/");
        const raw = item.type === "asset" ? item.source : item.code;
        const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw || "");

        if (typeof globalThis !== "undefined" && globalThis.__DINOU_MEM_FILES__) {
          globalThis.__DINOU_MEM_FILES__.set(normKey, buf);
          globalThis.__DINOU_MEM_FILES__.set("/" + normKey, buf);
          const base = path.basename(normKey);
          if (!globalThis.__DINOU_MEM_FILES__.has(base)) {
            globalThis.__DINOU_MEM_FILES__.set(base, buf);
          }
        }

        if (item.map) {
          const mapKey = `${normKey}.map`;
          const mapRaw =
            typeof item.map.toString === "function"
              ? item.map.toString()
              : JSON.stringify(item.map);
          const mapBuf = Buffer.from(mapRaw);
          if (
            typeof globalThis !== "undefined" &&
            globalThis.__DINOU_MEM_FILES__
          ) {
            globalThis.__DINOU_MEM_FILES__.set(mapKey, mapBuf);
            globalThis.__DINOU_MEM_FILES__.set("/" + mapKey, mapBuf);
            const baseMap = path.basename(mapKey);
            if (!globalThis.__DINOU_MEM_FILES__.has(baseMap)) {
              globalThis.__DINOU_MEM_FILES__.set(baseMap, mapBuf);
            }
          }
        }

        if (!shouldWriteToDisk) {
          delete bundle[fileName];
        }
      }
    },
  };
}

module.exports = rollupMemoryPlugin;
