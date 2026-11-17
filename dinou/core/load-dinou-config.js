import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

let require = null;
try {
  if (typeof import.meta !== "undefined" && import.meta.url) {
    require = createRequire(import.meta.url);
  }
} catch (e) {}

let dinouConfig = { plugins: [] };
const dinouConfigPromisesByCwd = new Map();

async function getDinouConfig(customCwd) {
  const cwd = path.resolve(
    customCwd ||
      (typeof process !== "undefined" && typeof process.cwd === "function"
        ? process.cwd()
        : ".")
  );

  if (
    typeof globalThis !== "undefined" &&
    globalThis.__DINOU_CONFIG__ &&
    (!globalThis.__DINOU_CONFIG_CWD__ || globalThis.__DINOU_CONFIG_CWD__ === cwd)
  ) {
    return globalThis.__DINOU_CONFIG__;
  }

  const isDev = process.env.NODE_ENV !== "production";
  if (!isDev && dinouConfigPromisesByCwd.has(cwd)) {
    return dinouConfigPromisesByCwd.get(cwd);
  }

  const loadPromise = (async () => {
    for (const filename of [
      "dinou.config.ts",
      "dinou.config.mjs",
      "dinou.config.js",
      "dinou.config.cjs",
    ]) {
      const p = path.resolve(cwd, filename);
      if (existsSync(p)) {
        try {
          let loaded;
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
            const { esbuildTsconfigAliasesPlugin } = await import(
              "./tsconfig-aliases.js"
            );
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
                esbuildTsconfigAliasesPlugin({
                  projectRoot: cwd,
                  skipAssets: false,
                }),
              ],
            });
            loaded = await import(
              pathToFileURL(bundledPath).href + (isDev ? `?t=${Date.now()}` : "")
            );
          } else if (p.endsWith(".mjs")) {
            loaded = await import(
              pathToFileURL(p).href + (isDev ? `?t=${Date.now()}` : "")
            );
          } else {
            const nodeReq =
              typeof globalThis !== "undefined" &&
              typeof globalThis.__dinou_require__ === "function"
                ? globalThis.__dinou_require__
                : typeof require === "function"
                  ? require
                  : null;
            if (nodeReq) {
              try {
                loaded = nodeReq(p);
              } catch (e) {
                loaded = await import(
                  pathToFileURL(p).href + (isDev ? `?t=${Date.now()}` : "")
                );
              }
            } else {
              loaded = await import(
                pathToFileURL(p).href + (isDev ? `?t=${Date.now()}` : "")
              );
            }
          }
          const cfg =
            loaded && loaded.default ? loaded.default : loaded || { plugins: [] };
          dinouConfig = cfg;
          if (typeof globalThis !== "undefined") {
            globalThis.__DINOU_CONFIG__ = cfg;
            globalThis.__DINOU_CONFIG_CWD__ = cwd;
          }
          return cfg;
        } catch (err) {
          console.error(`[Dinou] Error loading ${filename}:`, err);
        }
      }
    }
    const fallback = { plugins: [] };
    dinouConfig = fallback;
    return fallback;
  })();

  if (!isDev) {
    dinouConfigPromisesByCwd.set(cwd, loadPromise);
  }
  return loadPromise;
}

if (typeof globalThis !== "undefined" && globalThis.__DINOU_CONFIG__) {
  dinouConfig = globalThis.__DINOU_CONFIG__;
}

export { getDinouConfig };
export default {
  getDinouConfig,
};
