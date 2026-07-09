require("dotenv/config");
const Module = require("module");
const originalResolveFilename = Module._resolveFilename;
const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";
globalThis.__dinou_require__ = require;
const path = require("path");

const { normalizePathCase } = require("./path-utils.js");

let reactServerPath, reactDomServerPath, reactJsxRuntimePath, reactJsxDevRuntimePath;

if (!isWebpack) {
  const reactPkgJson = require.resolve("react/package.json");
  reactServerPath = path.join(path.dirname(reactPkgJson), "react.react-server.js");
  reactJsxRuntimePath = path.join(path.dirname(reactPkgJson), "jsx-runtime.react-server.js");
  reactJsxDevRuntimePath = path.join(path.dirname(reactPkgJson), "jsx-dev-runtime.react-server.js");

  const reactDomPkgJson = require.resolve("react-dom/package.json");
  reactDomServerPath = path.join(path.dirname(reactDomPkgJson), "react-dom.react-server.js");
}

Module._resolveFilename = function (request, parent, isMain, options) {
  if (!isWebpack) {
    if (request === "react") {
      return reactServerPath;
    } else if (request === "react-dom") {
      return reactDomServerPath;
    } else if (request === "react/jsx-runtime") {
      return reactJsxRuntimePath;
    } else if (request === "react/jsx-dev-runtime") {
      return reactJsxDevRuntimePath;
    }
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require("./register-paths");
const webpackRegister = require("react-server-dom-webpack/node-register");
const { readFileSync, existsSync, createReadStream } = require("fs");
// const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";
const { renderToPipeableStream } = isWebpack
  ? require("react-server-dom-webpack/server")
  : require("@roggc/react-server-dom-esm/server");
const express = require("express");
const getJSX = require("./get-jsx.js");
const { getFilePathAndDynamicParams } = require("./get-file-path-and-dynamic-params.js");
const { getErrorJSX } = require("./get-error-jsx.js");
const addHook = require("./asset-require-hook.js");
const { extensions } = require("./asset-extensions.js");
if (isWebpack) {
  webpackRegister();
}
const babelRegister = require("@babel/register");
babelRegister({
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
const importModule = require("./import-module");
const generateStatic = require("./generate-static.js");
const renderAppToHtml = require("./render-app-to-html.js");
const { revalidating, regenerating } = require("./revalidating.js");
const isDevelopment = process.env.NODE_ENV !== "production";
const outputFolder = isDevelopment ? "public" : "dist3";
const chokidar = require("chokidar");
const { fileURLToPath, pathToFileURL } = require("url");
const parseExports = require("./parse-exports.js");
const { requestStorage } = require("./request-context.js");
const { useServerRegex } = require("../constants.js");
const processLimiter = require("./concurrency-manager.js");
const { generatingISG } = require("./generating-isg.js");
const { getStatus } = require("./status-manifest.js");
if (isDevelopment) {
  const manifestPath = path.resolve(
    process.cwd(),
    isWebpack
      ? `${outputFolder}/react-client-manifest.json`
      : `react_client_manifest/react-client-manifest.json`,
  );
  const manifestFolderPath = path.resolve(
    process.cwd(),
    isWebpack ? outputFolder : "react_client_manifest",
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
      maxRetries = 10,
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

    async function onManifestChange(chokidarPath, stats, delayMs = 100) {
      if (isWebpack && chokidarPath !== manifestPath) return;
      if (Object.keys(currentManifest).length === 0 && isInitial) {
        try {
          currentManifest = await loadManifestWithRetry({
            manifestPath,
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
    manifestWatcher.on("unlink", () => {
      isInitial = true;
      currentManifest = {};
    });
    manifestWatcher.on("change", onManifestChange);
  }
  startManifestWatcher();
}
let serverFunctionsManifest = null;

if (!isDevelopment) {
  // In prod/build: load generated manifest
  const manifestPath = path.resolve(
    process.cwd(),
    isWebpack
      ? `${outputFolder}/server-functions-manifest.json`
      : `server_functions_manifest/server-functions-manifest.json`,
  ); // Adjust 'dist/' to your outdir
  if (existsSync(manifestPath)) {
    serverFunctionsManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    // Convert arrays to Sets for fast lookups
    for (const key in serverFunctionsManifest) {
      serverFunctionsManifest[key] = new Set(serverFunctionsManifest[key]);
    }
    console.log("[server] Loaded server functions manifest");
  } else {
    console.error("[server] Manifest not found - falling back to file reads");
  }
}
const cookieParser = require("cookie-parser");
const appUseCookieParser = cookieParser();
const app = express();
app.use(appUseCookieParser);
app.use(express.json());

// ============================================================
// 🛡️ ANTI-BOT SHIELD (Prevent ISG from collapsing)
// ============================================================
const botGarbagePatterns = [
  /\.php$/i, // Any PHP file
  /\.env$/i, // Attempts to steal environment variables
  /\.git\b/i, // Attempts to access Git repository
  /wp-admin/i, // WordPress admin
  /wp-content/i, // WordPress content
  /wp-includes/i, // WordPress core files
  /xmlrpc\.php/i, // WordPress DDoS attacks
  /\.sql$/i, // Attempts to download database dumps
  /\.asp$/i, // Legacy ASP pages
  /\.jsp$/i, // JSP pages
  /\.cgi$/i, // Old CGI scripts
  /\.bak$/i, // Backup files
  /\.log$/i, // Log files
];

app.use((req, res, next) => {
  const isGarbage = botGarbagePatterns.some((pattern) => pattern.test(req.path));
  if (isGarbage) {
    // Return 404 immediately to prevent the ISG engine from spawning processes
    return res.status(404).send("Not Found");
  }
  next();
});

const { resolveRelativeUrl } = require("./url-resolver");

function getContext(req, res) {
  let hasRedirected = false;
  // Helper to execute res methods safely
  const safeResCall = (methodName, ...args) => {
    if (hasRedirected) return;
    if (res.headersSent) {
      if (methodName === "redirect" && req.path.includes("____rsc_payload")) {
        return; // Silence streaming redirects during RSC payload requests
      }
      console.log(
        `[Dinou] res.${methodName} called but headers already sent. Ignoring.`,
      );
      return; // Exit silently
    }
    if (methodName === "redirect") {
      hasRedirected = true;
      // 1. Normalize arguments (Status and URL)
      let url = args[0];
      let status = 302; // Default

      if (args.length === 2) {
        status = args[0];
        url = args[1];
      }

      function safeRedirect(targetUrl) {
        const resolvedUrl = resolveRelativeUrl(targetUrl, req.path);
        let finalUrl = "/";
        if (
          typeof resolvedUrl === "string" &&
          resolvedUrl.startsWith("/") &&
          !resolvedUrl.startsWith("//")
        ) {
          finalUrl = resolvedUrl;
        } else {
          console.warn(
            `[Dinou Security] Blocked unsafe redirect to: ${targetUrl}`,
          );
        }

        if (req.path.includes("____rsc_payload")) {
          res.setHeader("x-rsc-redirect", finalUrl);
          res.status(200).end();
          return;
        }

        res.redirect.apply(res, [status, finalUrl]);
      }
      return safeRedirect(url);
    }
    // Execute maintaining 'this' context with bind/apply
    return res[methodName].apply(res, args);
  };

  const context = {
    req: {
      cookies: { ...req.cookies },
      headers: {
        "user-agent": req.headers["user-agent"],
        cookie: req.headers["cookie"],
        referer: req.headers["referer"],
        host: req.headers["host"],
        authorization: req.headers["authorization"],
        "accept-language": req.headers["accept-language"],
        "x-forwarded-for": req.headers["x-forwarded-for"],
        forwarded: req.headers["forwarded"],
        "content-type": req.headers["content-type"],
        origin: req.headers["origin"],
      },
      query: { ...req.query },
      path: req.path,
      method: req.method,
    },
    res: {
      // 1. STATUS
      status: (code) => safeResCall("status", code),

      // 2. SET HEADER
      setHeader: (name, value) => safeResCall("setHeader", name, value),

      // 3. CLEAR COOKIE
      // Note: If headersSent is true, the cookie will NOT be cleared in this RSC request.
      // If clearing it is vital, you should handle it in the Client Component or separate API route.
      clearCookie: (name, options) => safeResCall("clearCookie", name, options),
      cookie: (name, value, options) =>
        safeResCall("cookie", name, value, options),

      // 4. REDIRECT (Your existing smart wrapper)
      redirect: (...args) => safeResCall("redirect", ...args),
    },
  };
  return context;
}

function getContextForServerFunctionEndpoint(req, res) {
  const context = {
    req: {
      cookies: { ...req.cookies },
      headers: {
        "user-agent": req.headers["user-agent"],
        cookie: req.headers["cookie"],
        referer: req.headers["referer"],
        host: req.headers["host"],
        authorization: req.headers["authorization"],
        "accept-language": req.headers["accept-language"],
        "x-forwarded-for": req.headers["x-forwarded-for"],
        forwarded: req.headers["forwarded"],
        "content-type": req.headers["content-type"],
        origin: req.headers["origin"],
      },
      query: { ...req.query },
      path: req.path,
      method: req.method,
    },
    res: {
      redirect: (urlOrStatus, url) => {
        const rawUrl = url || urlOrStatus;
        const referer = req.headers["referer"];
        let refererPath = "/";
        if (referer) {
          try {
            refererPath = new URL(referer).pathname;
          } catch (e) { }
        }
        const resolvedUrl = resolveRelativeUrl(rawUrl, refererPath);
        let finalUrl = "/";
        if (
          typeof resolvedUrl === "string" &&
          resolvedUrl.startsWith("/") &&
          !resolvedUrl.startsWith("//")
        ) {
          finalUrl = resolvedUrl;
        } else {
          console.warn(
            `[Dinou Security] Blocked unsafe server function redirect to: ${rawUrl}`,
          );
        }
        // We throw a special object that the endpoint will intercept
        throw {
          $$type: "dinou-internal-redirect",
          url: finalUrl,
        };
      },
      status: (code) => {
        // If there is already a stream, we can't change the status, ignore or log warning
        if (!res.headersSent) res.status(code);
      },
      setHeader: (n, v) => {
        if (!res.headersSent) res.setHeader(n, v);
      },

      // ============================================================
      // COOKIE IMPLEMENTATION (Hybrid: Headers + Script Injection)
      // ============================================================
      cookie: (name, value, options) => {
        // SCENARIO A: We haven't started responding yet
        // Use Express native method. It's the best.
        if (!res.headersSent) {
          // Ensure correct Content-Type if it's the first write
          res.setHeader("Content-Type", "text/x-component");
          res.cookie(name, value, options);
          return;
        }

        // SCENARIO B: Streaming active (Headers Sent)
        // Send safe stream command.

        // 🛑 Security: JS cannot write HttpOnly cookies
        if (options && options.httpOnly) {
          console.error(
            `[Dinou Error] Cannot set HttpOnly cookie '${name}' in Server Function endpoint because streaming has started.`,
          );
          return;
        }

        // Manual cookie string construction
        // Format: key=value; attributes...
        let cookieStr = `${name}=${encodeURIComponent(value)}`;

        if (options) {
          if (options.path) cookieStr += `; path=${options.path}`;
          if (options.domain) cookieStr += `; domain=${options.domain}`;
          if (options.maxAge) cookieStr += `; max-age=${options.maxAge}`;
          if (options.expires)
            cookieStr += `; expires=${new Date(options.expires).toUTCString()}`;
          if (options.secure) cookieStr += `; secure`;
          if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`;
        }

        // Safe packaging for stream command
        const safeCookieStr = JSON.stringify(cookieStr);

        // Write to stream
        res.write(`D:{"type":"cookie","cookie":${safeCookieStr}}\n`);
      },

      clearCookie: (name, options) => {
        // SCENARIO A: Native
        if (!res.headersSent) {
          res.setHeader("Content-Type", "text/x-component");
          res.clearCookie(name, options);
          return;
        }

        // SCENARIO B: Custom stream command
        let cookieStr = `${name}=; Max-Age=0`;
        const path = options?.path || "/";
        cookieStr += `; path=${path}`;
        if (options) {
          if (options.domain) cookieStr += `; domain=${options.domain}`;
          if (options.secure) cookieStr += `; secure`;
          if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`;
        }
        cookieStr += ";";
        const safeCookieStr = JSON.stringify(cookieStr);
        res.write(`D:{"type":"cookie","cookie":${safeCookieStr}}\n`);
      },
    },
  };
  return context;
}

app.use(express.static(path.resolve(process.cwd(), outputFolder)));

const clientManifestResolvedPath = path.resolve(
  process.cwd(),
  isWebpack
    ? `${outputFolder}/react-client-manifest.json`
    : `react_client_manifest/react-client-manifest.json`,
);

function isManifestReady() {
  try {
    return existsSync(clientManifestResolvedPath) && readFileSync(clientManifestResolvedPath, "utf8").trim().length > 2;
  } catch (e) {
    return false;
  }
}

let isReady = isDevelopment; // In dev we are always ready (or almost)

app.get("/__DINOU_STATUS_PLAYWRIGHT__", (req, res) => {
  res.json({
    status: "ok",
    isReady: isDevelopment ? isManifestReady() : isReady,
    mode: isDevelopment ? "development" : "production",
  });
});

app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json({
    name: "Dinou DevTools",
    description: "Dinou DevTools for Chrome",
    version: "1.0.0",
    devtools_page: `/${outputFolder}/devtools.html`,
  });
});

let cachedClientManifest = null;
if (!isDevelopment) {
  // Initial load
  cachedClientManifest = JSON.parse(
    readFileSync(
      path.resolve(
        process.cwd(),
        isWebpack
          ? `${outputFolder}/react-client-manifest.json`
          : `react_client_manifest/react-client-manifest.json`,
      ),
      "utf8",
    ),
  );
}

const isDynamic = new Map();

async function serveRSCPayload(req, res, isOld = false, isStatic = false) {
  try {
    const reqPath = (
      req.path.endsWith("/") ? req.path : req.path + "/"
    ).replace(
      isOld
        ? isStatic
          ? "/____rsc_payload_old_static____"
          : "/____rsc_payload_old____"
        : isStatic
          ? "/____rsc_payload_static____"
          : "/____rsc_payload____",
      "",
    );
    // 1. Correct Map initialization
    if (!isDynamic.has(reqPath)) {
      // Initialize with a mutable object.
      // By default we assume it is NOT dynamic (false) until proven otherwise.
      isDynamic.set(reqPath, { value: false });
    }

    // Get reference to the mutable object
    const dynamicState = isDynamic.get(reqPath);
    // console.log(
    //   "rscPayload-> dynamicState.value, isStatic, reqPath",
    //   dynamicState.value,
    //   isStatic,
    //   reqPath
    // );
    if ((!isDevelopment && !dynamicState.value) || isStatic) {
      let currentGeneratedAt = null;
      try {
        const metadataPath = path.join("dist2", reqPath, "metadata.json");
        if (existsSync(metadataPath)) {
          const metaObj = JSON.parse(readFileSync(metadataPath, "utf8"));
          currentGeneratedAt = metaObj.generatedAt || null;
        }
      } catch (e) { }

      const useOld =
        isOld ||
        regenerating.has(reqPath) ||
        (req.query.buildId &&
          currentGeneratedAt &&
          req.query.buildId !== String(currentGeneratedAt));

      const payloadPath = path.resolve(
        "dist2",
        reqPath.replace(/^\//, ""),
        useOld ? "rsc._old.rsc" : "rsc.rsc",
      );

      const distDir = path.resolve("dist2");

      if (!payloadPath.startsWith(distDir)) {
        return res.status(403).end();
      }
      if (existsSync(payloadPath)) {
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        try {
          const buffer = readFileSync(payloadPath);
          return res.send(buffer);
        } catch (err) {
          console.error("Error reading RSC file:", err);
          return res.status(500).end();
        }
      }
    }
    let isPathBlocked = false;
    const reqSegments = reqPath.split("/").filter(Boolean);
    const srcFolder = path.resolve(process.cwd(), "src");
    const [pagePath, dynamicParams] = getFilePathAndDynamicParams(
      reqSegments,
      req.query,
      srcFolder,
    );

    if (pagePath) {
      let cachedConfig = pageFunctionsConfigCache.get(pagePath);
      if (!cachedConfig) {
        const pageFolder = path.dirname(pagePath);
        const [pageFunctionsPath] = getFilePathAndDynamicParams(
          reqSegments,
          req.query,
          pageFolder,
          "page_functions",
          true,
          true,
          undefined,
          reqSegments.length,
        );

        if (pageFunctionsPath) {
          const pageFunctionsModule = await importModule(pageFunctionsPath);
          const allowISGValue = pageFunctionsModule.allowISG
            ? await pageFunctionsModule.allowISG()
            : true;

          let staticPathsSet = null;
          if (pageFunctionsModule.getStaticPaths) {
            const paths = await pageFunctionsModule.getStaticPaths();
            staticPathsSet = new Set(
              (paths || []).map((pathObj) => {
                const sortedEntries = Object.entries(pathObj).sort((a, b) =>
                  a[0].localeCompare(b[0])
                );
                return JSON.stringify(sortedEntries);
              })
            );
          }

          cachedConfig = {
            allowISG: allowISGValue,
            staticPathsSet,
            validateParams: pageFunctionsModule.validateParams || null,
          };
        } else {
          cachedConfig = {
            allowISG: true,
            staticPathsSet: null,
            validateParams: null,
          };
        }

        if (!isDevelopment) {
          pageFunctionsConfigCache.set(pagePath, cachedConfig);
        }
      }

      const { allowISG: allowISGValue, staticPathsSet, validateParams: validateParamsFn } = cachedConfig;
      const hasParams = Object.keys(dynamicParams || {}).length > 0;
      if (hasParams) {
        if (validateParamsFn) {
          const isValid = await validateParamsFn(dynamicParams);
          if (!isValid) {
            isPathBlocked = true;
          }
        }

        if (!isPathBlocked && allowISGValue === false) {
          let isPathAllowed = false;
          if (staticPathsSet) {
            const sortedQueryEntries = Object.entries(dynamicParams)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([k, v]) => {
                if (Array.isArray(v)) return [k, v.join(",")];
                return [k, String(v)];
              });
            const serializedQuery = JSON.stringify(sortedQueryEntries);
            isPathAllowed = staticPathsSet.has(serializedQuery);
          }
          if (!isPathAllowed) {
            if (isDevelopment) {
              isPathBlocked = true;
            } else {
              const htmlPath = path.join("dist2", reqPath, "index.html");
              if (!existsSync(htmlPath)) {
                isPathBlocked = true;
              }
            }
          }
        }
      }
    }

    const context = getContext(req, res);
    const isNotFound = {};
    await requestStorage.run(context, async () => {
      const jsx = await getJSX(
        reqPath,
        { ...req.query },
        isNotFound,
        isDevelopment,
        isPathBlocked,
      );

      if (isNotFound.value) {
        res.status(404);
      }

      if (res.headersSent) {
        return;
      }

      const manifest = isDevelopment
        ? JSON.parse(
          readFileSync(
            path.resolve(
              process.cwd(),
              isWebpack
                ? `${outputFolder}/react-client-manifest.json`
                : `react_client_manifest/react-client-manifest.json`,
            ),
            "utf8",
          ),
        )
        : cachedClientManifest;

      const { pipe } = isWebpack
        ? renderToPipeableStream(jsx, manifest)
        : renderToPipeableStream(jsx, pathToFileURL(process.cwd()).href + "/");
      pipe(res);
    });
  } catch (error) {
    console.error("Error rendering RSC:", error);
    try {
      const serializedError = {
        message: error.message || "Unknown Error",
        name: error.name,
        stack: isDevelopment ? error.stack : undefined,
      };
      const context = getContext(req, res);
      await requestStorage.run(context, async () => {
        const jsx = await getErrorJSX(
          reqPath,
          { ...req.query },
          serializedError,
          isDevelopment,
        );
        const manifest = isDevelopment
          ? JSON.parse(
            readFileSync(
              path.resolve(
                process.cwd(),
                isWebpack
                  ? `${outputFolder}/react-client-manifest.json`
                  : `react_client_manifest/react-client-manifest.json`,
              ),
              "utf8",
            ),
          )
          : cachedClientManifest;
        const { pipe } = isWebpack
          ? renderToPipeableStream(jsx, manifest)
          : renderToPipeableStream(jsx, pathToFileURL(process.cwd()).href + "/");
        res.status(500);
        pipe(res);
      });
    } catch (innerError) {
      console.error("Fatal error rendering fallback error RSC:", innerError);
      res.status(500).send("Internal Server Error");
    }
  }
}

app.get(/^\/____rsc_payload____\/.*\/?$/, async (req, res) => {
  await serveRSCPayload(req, res, false, false);
});

app.get(/^\/____rsc_payload_old____\/.*\/?$/, async (req, res) => {
  await serveRSCPayload(req, res, true, false);
});

app.get(/^\/____rsc_payload_static____\/.*\/?$/, async (req, res) => {
  await serveRSCPayload(req, res, false, true);
});

app.get(/^\/____rsc_payload_old_static____\/.*\/?$/, async (req, res) => {
  await serveRSCPayload(req, res, true, true);
});

app.post(/^\/____rsc_payload_error____\/.*\/?$/, async (req, res) => {
  try {
    const reqPath = (
      req.path.endsWith("/") ? req.path : req.path + "/"
    ).replace("/____rsc_payload_error____", "");

    const context = getContext(req, res);
    await requestStorage.run(context, async () => {
      const jsx = await getErrorJSX(
        reqPath,
        { ...req.query },
        req.body.error,
        isDevelopment,
      );
      const manifest = isDevelopment
        ? JSON.parse(
          readFileSync(
            path.resolve(
              process.cwd(),
              isWebpack
                ? `${outputFolder}/react-client-manifest.json`
                : `react_client_manifest/react-client-manifest.json`,
            ),
            "utf8",
          ),
        )
        : cachedClientManifest;
      const { pipe } = isWebpack
        ? renderToPipeableStream(jsx, manifest)
        : renderToPipeableStream(jsx, pathToFileURL(process.cwd()).href + "/");
      pipe(res);
    });
  } catch (error) {
    console.error("Error rendering RSC:", error);
    res.status(500).send("Internal Server Error");
  }
});

const pageFunctionsConfigCache = new Map();

app.get(/^\/.*\/?$/, async (req, res) => {
  try {
    const reqSegments = req.path.split("/").filter(Boolean);
    const srcFolder = path.resolve(process.cwd(), "src");
    const [pagePath, dynamicParams] = getFilePathAndDynamicParams(
      reqSegments,
      req.query,
      srcFolder,
    );

    if (!pagePath) {
      if (path.extname(req.path)) {
        return res.status(404).send("Not Found");
      }
    }

    let isPathBlocked = false;

    if (pagePath) {
      let cachedConfig = pageFunctionsConfigCache.get(pagePath);
      if (!cachedConfig) {
        const pageFolder = path.dirname(pagePath);
        const [pageFunctionsPath] = getFilePathAndDynamicParams(
          reqSegments,
          req.query,
          pageFolder,
          "page_functions",
          true,
          true,
          undefined,
          reqSegments.length,
        );

        if (pageFunctionsPath) {
          const pageFunctionsModule = await importModule(pageFunctionsPath);
          const allowISGValue = pageFunctionsModule.allowISG
            ? await pageFunctionsModule.allowISG()
            : true;

          let staticPathsSet = null;
          if (pageFunctionsModule.getStaticPaths) {
            const paths = await pageFunctionsModule.getStaticPaths();
            staticPathsSet = new Set(
              (paths || []).map((pathObj) => {
                const sortedEntries = Object.entries(pathObj).sort((a, b) =>
                  a[0].localeCompare(b[0])
                );
                return JSON.stringify(sortedEntries);
              })
            );
          }

          cachedConfig = {
            allowISG: allowISGValue,
            staticPathsSet,
            validateParams: pageFunctionsModule.validateParams || null,
          };
        } else {
          cachedConfig = {
            allowISG: true,
            staticPathsSet: null,
            validateParams: null,
          };
        }

        if (!isDevelopment) {
          pageFunctionsConfigCache.set(pagePath, cachedConfig);
        }
      }

      const { allowISG: allowISGValue, staticPathsSet, validateParams: validateParamsFn } = cachedConfig;
      const hasParams = Object.keys(dynamicParams || {}).length > 0;
      if (hasParams) {
        if (validateParamsFn) {
          const isValid = await validateParamsFn(dynamicParams);
          if (!isValid) {
            isPathBlocked = true;
          }
        }

        if (!isPathBlocked && allowISGValue === false) {
          let isPathAllowed = false;
          if (staticPathsSet) {
            const sortedQueryEntries = Object.entries(dynamicParams)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([k, v]) => {
                if (Array.isArray(v)) return [k, v.join(",")];
                return [k, String(v)];
              });
            const serializedQuery = JSON.stringify(sortedQueryEntries);
            isPathAllowed = staticPathsSet.has(serializedQuery);
          }
          if (!isPathAllowed) {
            if (isDevelopment) {
              isPathBlocked = true;
            } else {
              const htmlPath = path.join("dist2", req.path, "index.html");
              if (!existsSync(htmlPath)) {
                isPathBlocked = true;
              }
            }
          }
        }
      }
    }

    const reqPath = req.path.endsWith("/") ? req.path : req.path + "/";

    // 1. Correct Map initialization
    if (!isDynamic.has(reqPath)) {
      // Initialize with a mutable object.
      // By default we assume it is NOT dynamic (false) until proven otherwise.
      isDynamic.set(reqPath, { value: false });
    }

    // Get reference to the mutable object
    const dynamicState = isDynamic.get(reqPath);
    // console.log("dynamicState.value", dynamicState.value);
    if (!isDevelopment && !dynamicState.value && pagePath && !isPathBlocked) {
      revalidating(reqPath, dynamicState);
      let htmlPathOld;
      if (regenerating.has(reqPath)) {
        // Still regenerating, serve old HTML if exists
        htmlPathOld = path.join("dist2", reqPath, "index._old.html");
      }
      const htmlPath = path.join("dist2", reqPath, "index.html");
      // Decide which file to read
      const fileToRead = htmlPathOld || htmlPath;

      if (existsSync(fileToRead) && !dynamicState.value) {
        res.setHeader("Content-Type", "text/html");
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        const meta = getStatus[reqPath];

        if (meta && meta.status) {
          res.statusCode = meta.status;
        } else {
          res.statusCode = 200; // Default
        }
        try {
          let htmlContent = readFileSync(fileToRead, "utf8");
          let buildId = "";
          try {
            const metadataPath = path.join("dist2", reqPath, "metadata.json");
            if (existsSync(metadataPath)) {
              const metaObj = JSON.parse(readFileSync(metadataPath, "utf8"));
              buildId = metaObj.generatedAt || "";
            }
          } catch (e) { }

          let scripts = `<script>window.__DINOU_USE_STATIC__=true;</script>`;
          if (htmlPathOld) {
            scripts += `<script>window.__DINOU_USE_OLD_RSC__=true;</script>`;
          }
          if (buildId) {
            scripts += `<script>window.__DINOU_BUILD_ID__="${buildId}";</script>`;
          }

          htmlContent = htmlContent.replace("</head>", `${scripts}</head>`);
          res.send(htmlContent);
        } catch (err) {
          console.error("Error reading HTML file:", err);
          if (!res.headersSent) res.status(500).send("Server Error");
        }
        return;
      }
    }

    const contextForChild = {
      req: {
        // Only serialize what is necessary for getContext().req
        query: { ...req.query },
        cookies: { ...req.cookies },
        headers: {
          "user-agent": req.headers["user-agent"],
          cookie: req.headers["cookie"],
          referer: req.headers["referer"],
          host: req.headers["host"],
          authorization: req.headers["authorization"],
          "accept-language": req.headers["accept-language"],
          "x-forwarded-for": req.headers["x-forwarded-for"],
          forwarded: req.headers["forwarded"],
          "content-type": req.headers["content-type"],
          origin: req.headers["origin"],
        },
        path: req.path,
        method: req.method,
      },
      // Do not include res here
    };
    processLimiter
      .run(async () => {
        const isDynamic = true;
        const capturedStatus = null;
        const appHtmlStream = renderAppToHtml(
          reqPath,
          JSON.stringify({ ...req.query }),
          contextForChild,
          res,
          capturedStatus,
          isDynamic,
          isPathBlocked,
        );

        res.setHeader("Content-Type", "text/html");
        appHtmlStream.pipe(res);

        // 👇 ISG TRIGGER GOES HERE 👇
        // We use 'finish' to ensure the user received everything (Status 200).
        // It's "Fire and Forget": We don't use 'await', runs in background.
        res.on("finish", () => {
          if (
            !isDevelopment &&
            res.statusCode === 200 && // Only if success
            req.method === "GET" && // Only GET requests
            isReady
          ) {
            generatingISG(reqPath, dynamicState);
          }
        });
        // 👆 END OF ISG TRIGGER 👆

        // 💡 TRICK: We want to release the concurrency slot ONLY when
        // the stream has finished sending or there is an error.
        await new Promise((resolve) => {
          appHtmlStream.on("end", resolve);
          appHtmlStream.on("error", (error) => {
            console.error("Stream error:", error);
            if (!res.headersSent) res.status(500).send("Internal Server Error");
            resolve(); // Better resolve at the end
          });
          res.on("close", resolve); // If user closes the tab
        });
      })
      .catch((err) => {
        console.error("Error in limited SSR:", err);
        if (!res.headersSent) res.status(500).send("Server Busy or Error");
      });
  } catch (error) {
    console.error("Error rendering React app:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Helper function to verify origin
function isOriginAllowed(req) {
  // 1. In server-to-server or tools environments, sometimes there is no Origin.
  // If you decide it is mandatory, return false here.
  // But modern browsers ALWAYS send Origin on POST.
  const origin = req.headers.origin;

  // If no origin (e.g. curl call or server-side fetch without headers),
  // you decide whether to be strict or permissive.
  if (!origin) return false; // Change to true if you want to allow without origin.

  try {
    // Parse to ignore protocol (http/https) and port if they differ subtly
    const originHost = new URL(origin).host;
    const serverHost = req.headers["x-forwarded-host"] || req.headers.host;

    // Compare host (domain:port)
    return originHost === serverHost;
  } catch (e) {
    return false; // If origin URL is invalid, reject.
  }
}

const multer = require("multer");

const upload = multer().any();

const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
};

app.post("/____server_function____", async (req, res) => {
  try {
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      await runMiddleware(req, res, upload);
    }

    // 1. Check Origin (Prevent calls from other domains)
    const origin = req.headers.origin;
    const host = req.headers["x-forwarded-host"] || req.headers.host;

    // Note: Locally sometimes origin is undefined or null, allow in dev if necessary
    if (!isDevelopment && origin && !origin.includes(host)) {
      return res.status(403).json({ error: "Invalid Origin" });
    }

    // 2. Check Custom Header (Robust CSRF defense)
    // Make sure your client (server-function-proxy.js) sends this header
    if (req.headers["x-server-function-call"] !== "1") {
      return res.status(403).json({ error: "Missing security header" });
    }

    // 2. Origin Check (NEW)
    if (!isDevelopment && !isOriginAllowed(req)) {
      console.error(
        `[Security] Blocked request from origin: ${req.headers.origin}`,
      );
      return res.status(403).json({ error: "Origin not allowed" });
    }

    let id, args;

    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      id = req.body.__dinou_func_id;

      const formData = new FormData();

      for (const key in req.body) {
        if (key === "__dinou_func_id" || key === "__dinou_args") continue;
        formData.append(key, req.body[key]);
      }

      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          const blob = new Blob([file.buffer], { type: file.mimetype });
          formData.append(file.fieldname, blob, file.originalname);
        }
      }

      args = [formData];

      if (req.body.__dinou_args) {
        try {
          const extraArgs = JSON.parse(req.body.__dinou_args);
          args.push(...extraArgs);
        } catch (e) {
          console.error("Error parsing extra args in multipart request");
        }
      }
    } else {
      id = req.body.id;
      args = req.body.args;
    }

    // Basic input validation: id must be string, args an array
    if (typeof id !== "string" || !Array.isArray(args)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const [fileUrl, exportName] = id.split("#");

    // Validate fileUrl: must start with 'file://' and not contain suspicious chars
    if (!fileUrl.startsWith("file://")) {
      return res.status(400).json({ error: "Invalid file URL format" });
    }

    let relativePath;

    // Check if the URL is a relative reference (e.g. file:///src/...)
    // If so, extract it directly without using fileURLToPath (which throws on Windows without a drive letter)
    const isRelativeSrc = fileUrl.startsWith("file:///src/") || fileUrl.startsWith("file:///src\\");

    if (isRelativeSrc) {
      relativePath = fileUrl.replace(/^file:\/\/\/?/, "").trim();
    } else {
      const resolvedPath = fileURLToPath(fileUrl);
      relativePath = resolvedPath;

      const normalizedCwd = normalizePathCase(process.cwd());
      const normalizedResolved = normalizePathCase(resolvedPath);

      if (normalizedResolved.startsWith(normalizedCwd)) {
        relativePath = path.relative(normalizedCwd, normalizedResolved);
      } else {
        relativePath = relativePath.replace(/^[\\/]+/, "");
      }
    }
    const normalizedRelative = relativePath.replace(/\\/g, "/");
    if (
      normalizedRelative.startsWith("/") ||
      normalizedRelative.includes("..") ||
      normalizedRelative.includes(":")
    ) {
      return res
        .status(400)
        .json({ error: "Invalid path: no absolute, traversal, or drive letter allowed" });
    }

    // Restrict to 'src/' folder: prepend 'src/' if missing, and resolve absolutePath
    if (!relativePath.startsWith("src/") && !relativePath.startsWith("src\\")) {
      relativePath = path.join("src", relativePath);
    }
    const absolutePath = path.resolve(process.cwd(), relativePath);

    // Verify that absolutePath is strictly inside 'src/'
    const srcDir = path.resolve(process.cwd(), "src");
    if (!absolutePath.startsWith(srcDir + path.sep)) {
      return res
        .status(403)
        .json({ error: "Access denied: file outside src directory" });
    }

    // Verify that the file exists
    if (!existsSync(absolutePath)) {
      // console.error("❌ [Dinou Server Function 404] File not found! id:", id, "relativePath:", relativePath, "absolutePath:", absolutePath);
      return res.status(404).json({ error: "File not found" });
    }

    const normalizedKey = relativePath.replace(/\\/g, "/");
    let allowedExports;
    if (serverFunctionsManifest) {
      // Prod: use manifest (relativePath is already normalized)
      allowedExports = serverFunctionsManifest[normalizedKey];
    } else {
      if (!isDevelopment) {
        return res
          .status(403)
          .json({ error: "Access denied: Manifest missing in production" });
      }
      const fileContent = readFileSync(absolutePath, "utf8"); // Reads only once
      if (!useServerRegex.test(fileContent)) {
        return res
          .status(403)
          .json({ error: "Not a valid server function file" });
      }
      // Parse exports
      const exports = parseExports(fileContent);
      allowedExports = new Set(exports);
    }

    // Validate exportName against allowedExports
    if (
      !exportName ||
      !allowedExports ||
      !allowedExports.has(exportName)
    ) {
      return res.status(400).json({ error: "Invalid export name" });
    }

    // Proceed with import
    const mod = await importModule(absolutePath);

    // Validate exportName
    if (!exportName || (exportName !== "default" && !mod[exportName])) {
      return res.status(400).json({ error: "Invalid export name" });
    }
    const fn = exportName === "default" ? mod.default : mod[exportName];

    if (typeof fn !== "function") {
      return res.status(400).json({ error: "Export is not a function" });
    }

    const context = getContextForServerFunctionEndpoint(req, res);

    let result;
    try {
      result = await requestStorage.run(context, async () => {
        return await fn(...args);
      });
    } catch (err) {
      // 💡 WE INTERCEPT THE REDIRECT
      if (err && err.$$type === "dinou-internal-redirect") {
        const safeUrl = JSON.stringify(err.url);

        if (!res.headersSent) {
          // SCENARIO A: Clean (Content-Type application/json)
          res.setHeader("Content-Type", "application/json");
          res.setHeader("X-Dinou-Redirect", err.url);
          return res.status(200).json({ redirect: err.url });
        } else {
          // SCENARIO B: Dirty/Active Stream
          // Write a custom line-based stream command
          res.write(`D:{"type":"redirect","url":${safeUrl}}\n`);

          // ⚠️ IMPORTANT:
          // 1. We close the response, since we redirected and there will be no RSC payload.
          // 2. WE STOP execution so it doesn't continue to res.json() below.
          res.end();
          return;
        }
      }
      throw err; // If it's another error, throw it to the outer catch
    }

    if (!res.headersSent) res.setHeader("Content-Type", "text/x-component");
    const manifestPath = path.resolve(
      process.cwd(),
      isWebpack
        ? `${outputFolder}/react-client-manifest.json`
        : `react_client_manifest/react-client-manifest.json`,
    );
    // Verify that the manifest exists to avoid errors
    if (!existsSync(manifestPath)) {
      return res.status(500).json({ error: "Manifest not found" });
    }
    const manifest = isDevelopment
      ? JSON.parse(readFileSync(manifestPath, "utf8"))
      : cachedClientManifest;
    const { pipe } = isWebpack
      ? renderToPipeableStream(result, manifest)
      : renderToPipeableStream(result, pathToFileURL(process.cwd()).href + "/");
    pipe(res);
  } catch (err) {
    console.error(`Server function error [${req.body?.id}]:`, err);
    // In production, do not send full err.message to avoid leaks
    res.status(500).json({ error: "Internal server error" });
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
      console.log("🏗️  [Background] Starting static generation (SSG)...");

      generateStatic()
        .then(() => {
          console.log("✅ [Background] Static generation finished.");
          isReady = true;
        })
        .catch((err) => {
          console.error(
            "❌ [Background] Static generation failed (App continues in Dynamic Mode):",
            err,
          );
          isReady = true;
        });
    } else {
      console.log("⚙️  [Startup] Running in Development Mode");
    }
  } catch (error) {
    console.error("💥 [Fatal Startup Error]:", error);
    process.exit(1);
  }
})();
