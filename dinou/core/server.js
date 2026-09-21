require("dotenv/config");
const { pathToFileURL } = require("url");
const path = require("path");

// Register ESM loader programmatically so --import flag is not required
const { register } = require("node:module");
if (typeof register === "function") {
  try {
    const loaderPath = path.resolve(__dirname, "./babel-esm-loader.js");
    register(pathToFileURL(loaderPath).href, pathToFileURL("./"));
  } catch (e) {
    // Loader might already be registered
  }
}

const Module = require("module");
const originalResolveFilename = Module._resolveFilename;
const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";
globalThis.__dinou_require__ = require;
try {
  const { AsyncLocalStorage } = require("node:async_hooks");
  if (typeof globalThis.AsyncLocalStorage === "undefined") {
    globalThis.AsyncLocalStorage = AsyncLocalStorage;
  }
} catch (e) {}

let reactServerPath, reactDomServerPath, reactJsxRuntimePath, reactJsxDevRuntimePath;
let roggcServerNodePath, webpackServerNodePath;

try {
  const reactPkgJson = require.resolve("react/package.json");
  reactServerPath = path.join(path.dirname(reactPkgJson), "react.react-server.js");
  reactJsxRuntimePath = path.join(path.dirname(reactPkgJson), "jsx-runtime.react-server.js");
  reactJsxDevRuntimePath = path.join(path.dirname(reactPkgJson), "jsx-dev-runtime.react-server.js");

  const reactDomPkgJson = require.resolve("react-dom/package.json");
  reactDomServerPath = path.join(path.dirname(reactDomPkgJson), "react-dom.react-server.js");
} catch (e) {}

try {
  const roggcPkgJson = require.resolve("@roggc/react-server-dom-esm/package.json");
  roggcServerNodePath = path.join(path.dirname(roggcPkgJson), "server.node.js");
} catch (e) {}

try {
  const webpackPkgJson = require.resolve("react-server-dom-webpack/package.json");
  webpackServerNodePath = path.join(path.dirname(webpackPkgJson), "server.node.js");
} catch (e) {}

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === "react") {
    return reactServerPath;
  } else if (request === "react-dom") {
    return reactDomServerPath;
  } else if (request === "react/jsx-runtime") {
    return reactJsxRuntimePath;
  } else if (request === "react/jsx-dev-runtime") {
    return reactJsxDevRuntimePath;
  } else if (request === "@roggc/react-server-dom-esm/server" && roggcServerNodePath) {
    return roggcServerNodePath;
  } else if (request === "react-server-dom-webpack/server" && webpackServerNodePath) {
    return webpackServerNodePath;
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require("./register-paths");
const webpackRegister = isWebpack ? require("react-server-dom-webpack/node-register") : null;
if (webpackRegister) webpackRegister();
const { readFileSync, existsSync } = require("fs");
const express = require("express");
const addHook = require("./asset-require-hook.js");
const { extensions } = require("./asset-extensions.js");
const babelRegister = require("@babel/register");
babelRegister({
  cache: false,
  ignore: [/node_modules[\\/](?!dinou)/],
  presets: [
    ["@babel/preset-react", { runtime: "automatic" }],
    "@babel/preset-typescript",
  ],
  plugins: ["@babel/transform-modules-commonjs"],
  extensions: [".js", ".jsx", ".ts", ".tsx"],
});
const createScopedName = require("./createScopedName");
require("./css-require-hook.js")();
addHook({
  extensions,
  name: function (localName, filepath) {
    const result = createScopedName(localName, filepath);
    return result + ".[ext]";
  },
  publicPath: "/assets/",
});

// Load Dinou configuration and plugins
let dinouConfig = { plugins: [] };
const dinouConfigPath = path.resolve(process.cwd(), "dinou.config.js");
if (existsSync(dinouConfigPath)) {
  try {
    dinouConfig = require(dinouConfigPath);
  } catch (err) {
    console.error("[Dinou] Error loading dinou.config.js:", err);
  }
}

const isDevelopment = process.env.NODE_ENV !== "production";
const outputFolder = isDevelopment ? ".dinou/public" : ".dinou/dist3";
const chokidar = require("chokidar");
const { fileURLToPath } = require("url");
if (isDevelopment) {
  const manifestPath = path.resolve(
    process.cwd(),
    isWebpack
      ? `${outputFolder}/react-client-manifest.json`
      : `.dinou/react_client_manifest/react-client-manifest.json`,
  );
  const manifestFolderPath = path.resolve(
    process.cwd(),
    isWebpack ? outputFolder : ".dinou/react_client_manifest",
  );

  let manifestWatcher = null;

  function startManifestWatcher() {
    let currentManifest = {};
    let isInitial = true;
    // If an old watcher already exists, close it first
    if (manifestWatcher) {
      try {
        manifestWatcher.close();
      } catch (e) {
        console.warn("Failed closing old watcher:", e);
      }
    }

    // console.log("[Watcher] Starting watcher");

    manifestWatcher = chokidar.watch(manifestFolderPath, {
      persistent: true,
      ignored: /node_modules/,
    });

    async function loadManifestWithRetry({
      manifestPath,
      maxRetries = 25,
      delayMs = 100,
    } = {}) {
      let attempts = 0;
      while (attempts < maxRetries) {
        try {
          // console.log(`Attempting to load manifest (try ${attempts + 1})...`);
          const text = readFileSync(manifestPath, "utf8");
          if (!text.trim()) throw new Error("Empty JSON");
          return JSON.parse(text);
        } catch (err) {
          attempts++;
          if (attempts >= maxRetries) {
            throw err; // Rethrow after max retries
          }
          // Wait for the specified delay before retrying
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    function getParents(resolvedPath) {
      const parents = [];
      Object.values(require.cache).forEach((mod) => {
        if (
          mod.children &&
          mod.children.some((child) => child.id === resolvedPath)
        ) {
          parents.push(mod.id);
        }
      });
      return parents;
    }

    function clearRequireCache(modulePath, visited = new Set()) {
      try {
        const resolved = require.resolve(modulePath);
        if (visited.has(resolved)) return;
        visited.add(resolved);

        if (require.cache[resolved]) {
          delete require.cache[resolved];
          // console.log(`[Server HMR] Cleared cache for ${resolved}`);

          const parents = getParents(resolved);
          for (const parent of parents) {
            // Optional: Skip if parent not in src/ (safety)
            if (parent.startsWith(path.resolve(process.cwd(), "src"))) {
              clearRequireCache(parent, visited);
            }
          }
        }
      } catch (err) {
        console.warn(
          `[Server HMR] Could not resolve or clear ${modulePath}: ${err.message}`,
        );
      }
    }

    let manifestTimeout;

    function readJSONWithRetry(pathToRead, retries = 4, delay = 10) {
      for (let i = 0; i < retries; i++) {
        try {
          const text = readFileSync(pathToRead, "utf8");
          if (!text.trim()) throw new Error("Empty JSON");
          return JSON.parse(text);
        } catch (err) {
          if (i === retries - 1) throw err;
          // tiny sleep
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
        }
      }
    }

    function handleManifestUpdate(newManifest) {
      // console.log("handle manifest update", newManifest, currentManifest);
      for (const key in currentManifest) {
        if (!(key in newManifest)) {
          const absPath = fileURLToPath(key);
          clearRequireCache(absPath);
          // console.log(`Cleared cache for ${absPath} (client -> server)`);
        }
      }

      // Handle added entries: server -> client switch
      for (const key in newManifest) {
        if (!(key in currentManifest)) {
          const absPath = fileURLToPath(key);
          clearRequireCache(absPath);
          // console.log(`Cleared cache for ${absPath} (server -> client)`);
        }
      }

      currentManifest = newManifest;
    }

    function isManifestFile(targetPath) {
      if (!targetPath) return false;
      return path.resolve(targetPath).toLowerCase() === path.resolve(manifestPath).toLowerCase();
    }

    async function onManifestChange(chokidarPath, stats, delayMs = 100) {
      if (!isManifestFile(chokidarPath)) return;
      if (Object.keys(currentManifest).length === 0 && isInitial) {
        try {
          currentManifest = await loadManifestWithRetry({
            manifestPath,
            maxRetries: 25,
            delayMs,
          });
          // console.log("Loaded initial manifest for HMR.", currentManifest);
          isInitial = false;
        } catch (err) {
          console.error("Failed to load initial manifest after retries:", err);
        }
        return;
      }
      try {
        // console.log("change event");
        clearTimeout(manifestTimeout);

        manifestTimeout = setTimeout(() => {
          try {
            const newManifest = readJSONWithRetry(manifestPath);
            handleManifestUpdate(newManifest);
          } catch (err) {
            console.error("Manifest not ready:", err.message);
          }
        }, 50);
      } catch (err) {
        console.error("Error handling manifest change:", err);
      }
    }

    manifestWatcher.on("add", onManifestChange);
    manifestWatcher.on("unlinkDir", startManifestWatcher);
    manifestWatcher.on("unlink", (unlinkedPath) => {
      if (isManifestFile(unlinkedPath)) {
        isInitial = true;
        currentManifest = {};
      }
    });
    manifestWatcher.on("change", onManifestChange);
  }
  startManifestWatcher();
}

const cookieParser = require("cookie-parser");
const appUseCookieParser = cookieParser();
const app = express();
app.use(appUseCookieParser);

// Run plugins onServerInit hook
if (dinouConfig.plugins && Array.isArray(dinouConfig.plugins)) {
  for (const plugin of dinouConfig.plugins) {
    if (typeof plugin.onServerInit === "function") {
      try {
        plugin.onServerInit(app);
        console.log(`[Dinou] Plugin initialized: "${plugin.name || "unnamed"}"`);
      } catch (err) {
        console.error(`[Dinou] Error initializing plugin "${plugin.name || "unnamed"}":`, err);
      }
    }
  }
}

app.use(express.json());

// 1. Static files serving
app.use(express.static(path.resolve(process.cwd(), outputFolder)));

const { nodeToWebRequest, sendWebResponseToNode } = require("./http-adapter.js");

let handleRequestFn = null;

function extractHandleRequest(mod) {
  if (typeof mod?.handleRequest === "function") return mod.handleRequest;
  if (typeof mod?.default === "function") return mod.default;
  if (typeof mod?.default?.handleRequest === "function") return mod.default.handleRequest;
  if (typeof mod?.default?.default === "function") return mod.default.default;
  return typeof mod === "function" ? mod : null;
}

async function getHandleRequest() {
  if (handleRequestFn) return handleRequestFn;
  const bundledPath = path.resolve(process.cwd(), ".dinou/dist3/server/handler.js");
  if (!isDevelopment && existsSync(bundledPath)) {
    try {
      const bundled = await import(pathToFileURL(bundledPath).href);
      handleRequestFn = extractHandleRequest(bundled);
      if (typeof handleRequestFn === "function") {
        console.log("⚡ [Dinou Server] Using pre-bundled server handler from .dinou/dist3/server/handler.js");
        return handleRequestFn;
      }
    } catch (e) {
      console.warn("⚠️ [Dinou Server] Could not load bundled handler, falling back to source handler:", e);
    }
  }
  const source = require("./handler.js");
  handleRequestFn = extractHandleRequest(source);
  return handleRequestFn;
}

// 2. Dynamic requests: delegated to the universal WHATWG handler
app.use(async (req, res, next) => {
  try {
    const handleRequest = await getHandleRequest();
    const webRequest = nodeToWebRequest(req);
    const webResponse = await handleRequest(webRequest);
    await sendWebResponseToNode(webResponse, res);
  } catch (err) {
    next(err);
  }
});

const port = process.env.PORT || 3000;

const http = require("http");

// ============================================================
// STARTUP SEQUENCE
// ============================================================
(async () => {
  try {
    console.log("👉 [Startup] Initializing HTTP Server...");
    await getHandleRequest();
    const server = http.createServer(app);

    // 2. ERROR HANDLING (Anti-Zombies)
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`\n❌ FATAL ERROR: Port ${port} is already in use!`);
      } else {
        console.error("❌ [Server Error]:", error);
      }
      process.exit(1);
    });

    await new Promise((resolve) => {
      server.listen(port, () => {
        console.log(
          `\n🚀 Dinou Server is ready and listening on http://localhost:${port}`,
        );
        console.log(
          `   Environment: ${isDevelopment ? "Development" : "Production"}`,
        );
        resolve();
      });
    });

    if (!isDevelopment) {
      const routeModulesPath = path.resolve(process.cwd(), ".dinou/route-modules.js");
      if (existsSync(routeModulesPath)) {
        try {
          await import(pathToFileURL(routeModulesPath).href);
          console.log("⚡ [Startup] Loaded route modules into memory (0 ms disk access)");
        } catch (e) {
          console.warn("⚠️ [Startup] Could not load route modules into memory:", e);
        }
      }

      const dist2Path = path.resolve(process.cwd(), ".dinou/dist2");
      if (existsSync(dist2Path)) {
        console.log("⚡ [Startup] Pre-rendered static pages found at .dinou/dist2");
      } else {
        console.warn(
          "⚠️  [Startup] Pre-rendered static pages not found at .dinou/dist2. Operating in Dynamic Mode (ISG will promote pages on demand).",
        );
      }
    } else {
      console.log("⚙️  [Startup] Running in Development Mode");
    }
  } catch (error) {
    console.error("💥 [Fatal Startup Error]:", error);
    process.exit(1);
  }
})();
