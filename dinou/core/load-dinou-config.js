import path from "node:path";
import {
  existsSync,
  mkdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

let require = null;
let dinouPackageRoot = null;
try {
  if (typeof import.meta !== "undefined" && import.meta.url) {
    require = createRequire(import.meta.url);
    dinouPackageRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      ".."
    );
  }
} catch (e) {}

export const DINOU_CONFIG_FILENAMES = [
  "dinou.config.ts",
  "dinou.config.mjs",
  "dinou.config.js",
  "dinou.config.cjs",
];

const ROOT_SETUP_FILENAMES = new Set([
  "dinou.setup.mjs",
  "dinou.setup.js",
  "dinou.setup.ts",
]);

let dinouConfig = { plugins: [] };
const dinouConfigPromisesByCwd = new Map();
const devConfigCacheByCwd = new Map();
let devImportCounter = 0;
const AUTO_LOADED_PROD_CONFIG = Symbol.for("dinou.autoLoadedProdConfig");

function resolveCwd(customCwd) {
  return path.resolve(
    customCwd ||
      (typeof process !== "undefined" && typeof process.cwd === "function"
        ? process.cwd()
        : ".")
  );
}

function isActiveDinouDevServer() {
  if (
    typeof globalThis !== "undefined" &&
    Boolean(globalThis.__DINOU_DEV__)
  ) {
    return true;
  }
  if (typeof process !== "undefined" && process.env) {
    return process.env.DINOU_DEV === "true";
  }
  return false;
}

function isDevEnvironment() {
  if (isActiveDinouDevServer()) {
    return true;
  }
  if (typeof process !== "undefined" && process.env) {
    return process.env.NODE_ENV !== "production";
  }
  return false;
}

/**
 * Finds the active `dinou.config.{ts,mjs,js,cjs}` file in `customCwd`,
 * following Dinou's deterministic extension precedence.
 *
 * @param {string} [customCwd]
 * @returns {string | null}
 */
export function findDinouConfigFile(customCwd) {
  const cwd = resolveCwd(customCwd);
  for (const filename of DINOU_CONFIG_FILENAMES) {
    const candidate = path.resolve(cwd, filename);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Checks whether `filePath` is a root `dinou.config.*` or `dinou.setup.*` file.
 *
 * @param {string} filePath
 * @param {string} [projectRoot]
 * @returns {boolean}
 */
export function isWatchedDinouConfigOrSetupFile(filePath, projectRoot) {
  if (!filePath) return false;
  const root = resolveCwd(projectRoot);
  const resolved = path.resolve(filePath);
  if (path.dirname(resolved).toLowerCase() !== root.toLowerCase()) {
    return false;
  }
  const base = path.basename(resolved).toLowerCase();
  return (
    DINOU_CONFIG_FILENAMES.includes(base) || ROOT_SETUP_FILENAMES.has(base)
  );
}

/**
 * Clears cached Dinou configuration for `customCwd` (or all directories when omitted).
 * Used by `dinou dev` live hot-reloading and test suites.
 *
 * @param {string} [customCwd]
 */
export function clearDinouConfigCache(customCwd) {
  if (customCwd) {
    const cwd = resolveCwd(customCwd);
    dinouConfigPromisesByCwd.delete(cwd);
    devConfigCacheByCwd.delete(cwd);
    if (
      typeof globalThis !== "undefined" &&
      !globalThis.__DINOU_AOT_CONFIG__ &&
      (!globalThis.__DINOU_CONFIG_CWD__ ||
        globalThis.__DINOU_CONFIG_CWD__ === cwd)
    ) {
      delete globalThis.__DINOU_CONFIG__;
      delete globalThis.__DINOU_CONFIG_CWD__;
    }
  } else {
    dinouConfigPromisesByCwd.clear();
    devConfigCacheByCwd.clear();
    if (
      typeof globalThis !== "undefined" &&
      !globalThis.__DINOU_AOT_CONFIG__
    ) {
      delete globalThis.__DINOU_CONFIG__;
      delete globalThis.__DINOU_CONFIG_CWD__;
    }
  }
}

function getLocalEsbuild(cwd) {
  if (
    typeof process === "undefined" ||
    !process.versions ||
    !process.versions.node ||
    (process.env && process.env.DINOU_RUNTIME === "edge")
  ) {
    return null;
  }
  const esbuildPkg = "esbuild";
  try {
    if (typeof require === "function") {
      return require(esbuildPkg);
    }
  } catch (e) {}
  try {
    const projectReq = createRequire(path.join(cwd, "package.json"));
    return projectReq(esbuildPkg);
  } catch (e) {}
  return null;
}

function resolveActiveDinouRoot(cwd) {
  const ejectedCandidate = path.resolve(cwd, "dinou");
  if (
    existsSync(ejectedCandidate) &&
    existsSync(path.join(ejectedCandidate, "core", "config.js"))
  ) {
    return ejectedCandidate;
  }
  if (
    dinouPackageRoot &&
    existsSync(path.join(dinouPackageRoot, "core", "config.js"))
  ) {
    return dinouPackageRoot;
  }
  const nmNested = path.resolve(cwd, "node_modules", "dinou", "dinou");
  if (existsSync(path.join(nmNested, "core", "config.js"))) {
    return nmNested;
  }
  const nmFlat = path.resolve(cwd, "node_modules", "dinou");
  if (existsSync(path.join(nmFlat, "core", "config.js"))) {
    return nmFlat;
  }
  return null;
}

function createEsbuildDinouConfigPlugin(cwd, outDir = cwd) {
  const activeDinouRoot = resolveActiveDinouRoot(cwd);
  return {
    name: "dinou-config-alias",
    setup(build) {
      build.onResolve({ filter: /^dinou(?:\/config)?$/ }, () => {
        if (activeDinouRoot) {
          return { path: path.join(activeDinouRoot, "core", "config.js") };
        }
        return { path: "dinou/config", external: true };
      });
      build.onResolve({ filter: /^dinou\/server$/ }, () => {
        if (activeDinouRoot) {
          const serverAbs = path.join(activeDinouRoot, "server.js");
          const rel = path.relative(outDir, serverAbs).replace(/\\/g, "/");
          if (rel && !path.isAbsolute(rel)) {
            return {
              path: rel.startsWith(".") ? rel : "./" + rel,
              external: true,
            };
          }
          return { path: serverAbs };
        }
        return { path: "dinou/server", external: true };
      });
    },
  };
}

/**
 * Emits a pre-transpiled pure-ESM server bootstrap and bundler entry wrappers
 * into `.dinou/dist1/` so Esbuild, Rollup, and Webpack production server builds
 * (`.dinou/dist1/server/handler.js` & `netlify.js`) as well as `--omit=dev`
 * Node runtimes execute `setupFiles` and load `dinou.config.*` without needing
 * `esbuild` or TypeScript loaders at runtime.
 *
 * @param {object} options
 * @param {string} [options.projectRoot]
 * @param {string[]} [options.setupFiles]
 * @param {string} options.handlerPath
 * @param {string} options.netlifyPath
 * @returns {Promise<{ handlerEntry: string, netlifyEntry: string, bootstrapPath: string | null }>}
 */
export async function prepareDist1ServerEntries({
  projectRoot,
  setupFiles = [],
  handlerPath,
  netlifyPath,
}) {
  const cwd = resolveCwd(projectRoot);
  const configFile = findDinouConfigFile(cwd);
  if ((!setupFiles || setupFiles.length === 0) && !configFile) {
    return {
      handlerEntry: handlerPath,
      netlifyEntry: netlifyPath,
      bootstrapPath: null,
    };
  }

  const dist1Dir = path.resolve(cwd, ".dinou", "dist1");
  const entriesDir = path.join(dist1Dir, "_entries");
  mkdirSync(entriesDir, { recursive: true });

  const rawBootstrapPath = path.join(entriesDir, "raw-server-bootstrap.mjs");
  const compiledBootstrapPath = path.join(dist1Dir, "dinou-server-bootstrap.mjs");

  let rawCode = "// Auto-generated Dinou server bootstrap (setupFiles + dinou.config)\n";
  for (const sf of setupFiles) {
    rawCode += `import ${JSON.stringify(sf.replace(/\\/g, "/"))};\n`;
  }
  if (configFile) {
    rawCode += `import * as __dinouConfigMod from ${JSON.stringify(configFile.replace(/\\/g, "/"))};\n`;
    rawCode += `const __resolvedDinouCfg = (__dinouConfigMod && __dinouConfigMod.default) ? __dinouConfigMod.default : (__dinouConfigMod || { plugins: [] });\n`;
    rawCode += `globalThis.__DINOU_AOT_CONFIG__ = __resolvedDinouCfg;\n`;
    rawCode += `globalThis.__DINOU_CONFIG__ = __resolvedDinouCfg;\n`;
    rawCode += `globalThis.__DINOU_CONFIG_CWD__ = typeof process !== "undefined" && typeof process.cwd === "function" ? process.cwd() : "";\n`;
    rawCode += `export default __resolvedDinouCfg;\n`;
  } else {
    rawCode += `export default { plugins: [] };\n`;
  }

  writeFileSync(rawBootstrapPath, rawCode, "utf8");

  const esbuild = getLocalEsbuild(cwd);
  if (esbuild && typeof esbuild.build === "function") {
    const { esbuildTsconfigAliasesPlugin } = await import(
      "./tsconfig-aliases.js"
    );
    await esbuild.build({
      entryPoints: [rawBootstrapPath],
      outfile: compiledBootstrapPath,
      bundle: true,
      format: "esm",
      platform: "node",
      target: "node20",
      packages: "external",
      jsx: "automatic",
      loader: {
        ".js": "jsx",
        ".jsx": "jsx",
        ".ts": "ts",
        ".tsx": "tsx",
        ".json": "json",
        ".css": "empty",
      },
      plugins: [
        createEsbuildDinouConfigPlugin(cwd, dist1Dir),
        esbuildTsconfigAliasesPlugin({
          projectRoot: cwd,
          skipAssets: false,
        }),
      ],
    });
  } else {
    writeFileSync(compiledBootstrapPath, rawCode, "utf8");
  }

  const bootstrapSlash = compiledBootstrapPath.replace(/\\/g, "/");
  const handlerSlash = handlerPath.replace(/\\/g, "/");
  const netlifySlash = netlifyPath.replace(/\\/g, "/");

  const handlerWrapperPath = path.join(entriesDir, "handler.mjs");
  const netlifyWrapperPath = path.join(entriesDir, "netlify.mjs");

  writeFileSync(
    handlerWrapperPath,
    `import * as __boot from ${JSON.stringify(bootstrapSlash)};\nglobalThis.__DINOU_BOOTSTRAPPED__ = Boolean(__boot);\nexport * from ${JSON.stringify(handlerSlash)};\nexport { default } from ${JSON.stringify(handlerSlash)};\n`,
    "utf8"
  );
  writeFileSync(
    netlifyWrapperPath,
    `import * as __boot from ${JSON.stringify(bootstrapSlash)};\nglobalThis.__DINOU_BOOTSTRAPPED__ = Boolean(__boot);\nexport * from ${JSON.stringify(netlifySlash)};\nexport { default } from ${JSON.stringify(netlifySlash)};\n`,
    "utf8"
  );

  return {
    handlerEntry: handlerWrapperPath,
    netlifyEntry: netlifyWrapperPath,
    bootstrapPath: compiledBootstrapPath,
  };
}

async function loadConfigFromDisk(cwd, isDev, configFile) {
  if (!configFile) {
    const prebuiltDist1 = path.resolve(
      cwd,
      ".dinou",
      "dist1",
      "dinou-server-bootstrap.mjs"
    );
    if (!isDev && existsSync(prebuiltDist1)) {
      try {
        const mod = await import(pathToFileURL(prebuiltDist1).href);
        const cfg = mod && mod.default ? mod.default : mod || { plugins: [] };
        dinouConfig = cfg;
        return cfg;
      } catch (e) {}
    }
    const fallback = { plugins: [] };
    dinouConfig = fallback;
    return fallback;
  }

  const filename = path.basename(configFile);
  try {
    let loaded;
    const prebuiltDist1 = path.resolve(
      cwd,
      ".dinou",
      "dist1",
      "dinou-server-bootstrap.mjs"
    );
    const esbuild = getLocalEsbuild(cwd);

    if (!isDev && !esbuild && existsSync(prebuiltDist1)) {
      loaded = await import(pathToFileURL(prebuiltDist1).href);
    } else if (esbuild && typeof esbuild.build === "function") {
      const outDir = path.resolve(cwd, ".dinou");
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
      }
      const bundledPath = path.resolve(outDir, "dinou.config.bundled.mjs");
      const { esbuildTsconfigAliasesPlugin } = await import(
        "./tsconfig-aliases.js"
      );
      await esbuild.build({
        entryPoints: [configFile],
        outfile: bundledPath,
        bundle: true,
        format: "esm",
        platform: "node",
        packages: "external",
        jsx: "automatic",
        sourcemap: "inline",
        plugins: [
          createEsbuildDinouConfigPlugin(cwd, outDir),
          esbuildTsconfigAliasesPlugin({
            projectRoot: cwd,
            skipAssets: false,
          }),
        ],
      });
      const cacheBuster = isDev
        ? `?t=${Date.now()}-${++devImportCounter}`
        : "";
      loaded = await import(pathToFileURL(bundledPath).href + cacheBuster);
    } else if (!isDev && existsSync(prebuiltDist1)) {
      loaded = await import(pathToFileURL(prebuiltDist1).href);
    } else if (configFile.endsWith(".mjs")) {
      const cacheBuster = isDev
        ? `?t=${Date.now()}-${++devImportCounter}`
        : "";
      loaded = await import(pathToFileURL(configFile).href + cacheBuster);
    } else {
      const nodeReq =
        typeof globalThis !== "undefined" &&
        typeof globalThis.__dinou_require__ === "function"
          ? globalThis.__dinou_require__
          : typeof require === "function"
            ? require
            : null;
      if (nodeReq && !isDev) {
        try {
          loaded = nodeReq(configFile);
        } catch (e) {
          loaded = await import(pathToFileURL(configFile).href);
        }
      } else {
        const cacheBuster = isDev
          ? `?t=${Date.now()}-${++devImportCounter}`
          : "";
        loaded = await import(pathToFileURL(configFile).href + cacheBuster);
      }
    }

    const cfg =
      loaded && loaded.default ? loaded.default : loaded || { plugins: [] };
    dinouConfig = cfg;
    if (!isDev && typeof globalThis !== "undefined") {
      if (cfg && typeof cfg === "object") {
        try {
          Object.defineProperty(cfg, AUTO_LOADED_PROD_CONFIG, {
            value: true,
            configurable: true,
          });
        } catch (e) {}
      }
      globalThis.__DINOU_CONFIG__ = cfg;
      globalThis.__DINOU_CONFIG_CWD__ = cwd;
    }
    return cfg;
  } catch (err) {
    console.error(`[Dinou] Error loading ${filename}:`, err);
    const fallback = { plugins: [] };
    dinouConfig = fallback;
    return fallback;
  }
}

async function getDinouConfig(customCwd) {
  const cwd = resolveCwd(customCwd);
  const isDev = isDevEnvironment();

  if (
    typeof globalThis !== "undefined" &&
    globalThis.__DINOU_AOT_CONFIG__ &&
    (!globalThis.__DINOU_CONFIG_CWD__ ||
      globalThis.__DINOU_CONFIG_CWD__ === cwd)
  ) {
    dinouConfig = globalThis.__DINOU_AOT_CONFIG__;
    return globalThis.__DINOU_AOT_CONFIG__;
  }

  if (
    typeof globalThis !== "undefined" &&
    globalThis.__DINOU_CONFIG__ &&
    !isActiveDinouDevServer() &&
    (!isDev || !globalThis.__DINOU_CONFIG__[AUTO_LOADED_PROD_CONFIG]) &&
    (!globalThis.__DINOU_CONFIG_CWD__ ||
      globalThis.__DINOU_CONFIG_CWD__ === cwd)
  ) {
    dinouConfig = globalThis.__DINOU_CONFIG__;
    return globalThis.__DINOU_CONFIG__;
  }

  if (!isDev && dinouConfigPromisesByCwd.has(cwd)) {
    return dinouConfigPromisesByCwd.get(cwd);
  }

  if (isDev) {
    const configFile = findDinouConfigFile(cwd);
    let mtimeMs = 0;
    if (configFile) {
      try {
        mtimeMs = statSync(configFile).mtimeMs;
      } catch (e) {}
    }
    const cachedDev = devConfigCacheByCwd.get(cwd);
    if (
      cachedDev &&
      cachedDev.filePath === configFile &&
      cachedDev.mtimeMs === mtimeMs
    ) {
      if (cachedDev.promise) return cachedDev.promise;
      dinouConfig = cachedDev.config;
      return cachedDev.config;
    }

    const devPromise = loadConfigFromDisk(cwd, true, configFile).then((cfg) => {
      devConfigCacheByCwd.set(cwd, {
        filePath: configFile,
        mtimeMs,
        config: cfg,
        promise: null,
      });
      return cfg;
    });
    devConfigCacheByCwd.set(cwd, {
      filePath: configFile,
      mtimeMs,
      config: null,
      promise: devPromise,
    });
    return devPromise;
  }

  const configFile = findDinouConfigFile(cwd);
  const loadPromise = loadConfigFromDisk(cwd, false, configFile);
  dinouConfigPromisesByCwd.set(cwd, loadPromise);
  return loadPromise;
}

if (
  typeof globalThis !== "undefined" &&
  (globalThis.__DINOU_AOT_CONFIG__ || globalThis.__DINOU_CONFIG__)
) {
  dinouConfig = globalThis.__DINOU_AOT_CONFIG__ || globalThis.__DINOU_CONFIG__;
}

export { getDinouConfig };
export default {
  getDinouConfig,
  findDinouConfigFile,
  isWatchedDinouConfigOrSetupFile,
  clearDinouConfigCache,
  prepareDist1ServerEntries,
  DINOU_CONFIG_FILENAMES,
};
