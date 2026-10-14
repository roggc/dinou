const path = require("path");
const { existsSync } = require("fs");
const { pathToFileURL } = require("url");

let dinouConfig = { plugins: [] };
let dinouConfigPromise = null;

async function getDinouConfig() {
  if (typeof globalThis !== "undefined" && globalThis.__DINOU_CONFIG__) {
    return globalThis.__DINOU_CONFIG__;
  }
  if (dinouConfigPromise) return dinouConfigPromise;
  dinouConfigPromise = (async () => {
    const cwd = typeof process !== "undefined" && typeof process.cwd === "function" ? process.cwd() : ".";
    for (const filename of ["dinou.config.js", "dinou.config.mjs", "dinou.config.cjs", "dinou.config.ts"]) {
      const p = path.resolve(cwd, filename);
      if (existsSync(p)) {
        try {
          let loaded;
          const isDev = process.env.NODE_ENV !== "production";
          if (p.endsWith(".mjs")) {
            loaded = await import(pathToFileURL(p).href + (isDev ? `?t=${Date.now()}` : ""));
          } else {
            const nodeReq =
              typeof globalThis !== "undefined" && typeof globalThis.__dinou_require__ === "function"
                ? globalThis.__dinou_require__
                : typeof require === "function"
                ? require
                : null;
            if (nodeReq) {
              try {
                loaded = nodeReq(p);
              } catch (e) {
                loaded = await import(pathToFileURL(p).href + (isDev ? `?t=${Date.now()}` : ""));
              }
            } else {
              loaded = await import(pathToFileURL(p).href + (isDev ? `?t=${Date.now()}` : ""));
            }
          }
          const cfg = loaded && loaded.default ? loaded.default : loaded || { plugins: [] };
          dinouConfig = cfg;
          return cfg;
        } catch (err) {
          console.error(`[Dinou] Error loading ${filename}:`, err);
        }
      }
    }
    return dinouConfig;
  })();
  return dinouConfigPromise;
}

// Initial sync attempt if already set on globalThis
if (typeof globalThis !== "undefined" && globalThis.__DINOU_CONFIG__) {
  dinouConfig = globalThis.__DINOU_CONFIG__;
}

module.exports = {
  getDinouConfig,
};
