import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

let dinouConfig = { plugins: [] };
let dinouConfigPromise = null;

async function getDinouConfig() {
  if (typeof globalThis !== "undefined" && globalThis.__DINOU_CONFIG__) {
    return globalThis.__DINOU_CONFIG__;
  }
  if (dinouConfigPromise) return dinouConfigPromise;
  dinouConfigPromise = (async () => {
    const cwd = typeof process !== "undefined" && typeof process.cwd === "function" ? process.cwd() : ".";
    for (const filename of ["dinou.config.ts", "dinou.config.mjs", "dinou.config.js", "dinou.config.cjs"]) {
      const p = path.resolve(cwd, filename);
      if (existsSync(p)) {
        try {
          let loaded;
          const isDev = process.env.NODE_ENV !== "production";
          let esbuild;
          if (
            typeof process !== "undefined" &&
            process.versions &&
            process.versions.node &&
            process.env.DINOU_RUNTIME !== "edge"
          ) {
            try {
              const req = typeof require === "function" ? require : null;
              const esbuildPkg = "esbuild";
              if (req) {
                esbuild = req(esbuildPkg);
              }
            } catch (e) {}
          }

          if (esbuild && typeof esbuild.build === "function") {
            const outDir = path.resolve(cwd, ".dinou");
            if (!existsSync(outDir)) {
              mkdirSync(outDir, { recursive: true });
            }
            const bundledPath = path.resolve(outDir, "dinou.config.bundled.mjs");
            await esbuild.build({
              entryPoints: [p],
              outfile: bundledPath,
              bundle: true,
              format: "esm",
              platform: "node",
              packages: "external",
              sourcemap: "inline",
              plugins: [
                {
                  name: "dinou-config-alias",
                  setup(build) {
                    build.onResolve({ filter: /^dinou$/ }, () => {
                      return { path: "dinou/config", external: true };
                    });
                  },
                },
              ],
            });
            loaded = await import(pathToFileURL(bundledPath).href + (isDev ? `?t=${Date.now()}` : ""));
          } else if (p.endsWith(".mjs")) {
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

export {
  getDinouConfig,
};
export default {
  getDinouConfig,
};
