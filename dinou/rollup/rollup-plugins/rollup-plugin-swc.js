// dinou/rollup/rollup-plugins/rollup-plugin-swc.js
// Ultra-fast SWC transpilation plugin for Rollup with high-speed in-memory cache.
// Replaces heavy Babel pipeline in development and eliminates multi-second HMR latencies.

const path = require("node:path");
const fs = require("node:fs");

let swc = null;
try {
  swc = require("@swc/core");
} catch (e) {
  console.warn("⚠️ [@swc/core] not found. Please ensure @swc/core is installed for fast Rollup builds.");
}

function rollupSwcPlugin(options = {}) {
  const isDev = process.env.NODE_ENV !== "production" || process.env.DINOU_DEV === "true";

  // In-Memory Cache: normSrc -> { mtime, code, map }
  const memCache = new Map();

  return {
    name: "rollup-plugin-swc",

    async transform(code, id) {
      if (!swc || id.includes("\0") || id.startsWith("commonjsHelpers")) {
        return null;
      }

      const isNodeModules = id.includes("node_modules");
      const isDinou = id.includes("dinou");
      const isReactRefresh = id.includes("react-refresh");
      if (isNodeModules && !isDinou && !isReactRefresh) {
        return null;
      }

      const cleanId = id.replace(/\?.*$/, "");
      if (!/\.[jt]sx?$/i.test(cleanId)) {
        return null;
      }

      const normSrc = path.resolve(cleanId);
      const isTs = normSrc.endsWith(".ts") || normSrc.endsWith(".tsx");
      const isJsx = normSrc.endsWith(".tsx") || normSrc.endsWith(".jsx");

      // Memory Cache check
      let mtimeMs = 0;
      try {
        const stat = fs.statSync(normSrc);
        mtimeMs = stat.mtimeMs;
      } catch (e) {}

      if (mtimeMs > 0 && memCache.has(normSrc)) {
        const entry = memCache.get(normSrc);
        if (entry.mtime === mtimeMs) {
          return {
            code: entry.code,
            map: entry.map,
          };
        }
      }

      // Compile with native Rust SWC
      try {
        const swcResult = await swc.transform(code, {
          filename: normSrc,
          sourceMaps: isDev ? "inline" : false,
          jsc: {
            parser: isTs
              ? { syntax: "typescript", tsx: isJsx, dynamicImport: true }
              : { syntax: "ecmascript", jsx: isJsx, dynamicImport: true },
            target: "es2022",
            transform: {
              react: {
                runtime: "automatic",
                development: isDev,
                refresh: isDev,
              },
            },
          },
        });

        const outputCode = swcResult.code;
        const outputMap = swcResult.map ? JSON.parse(swcResult.map) : null;

        memCache.set(normSrc, { mtime: mtimeMs, code: outputCode, map: outputMap });

        return {
          code: outputCode,
          map: outputMap,
        };
      } catch (err) {
        console.error(`❌ [Rollup SWC Transform Error in ${path.basename(normSrc)}]:`, err.message || err);
        return null;
      }
    },
  };
}

module.exports = rollupSwcPlugin;

