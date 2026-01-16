require("dotenv/config");
require("./register-paths");
require("./register-hooks.js");
const webpackRegister = require("react-server-dom-webpack/node-register");
const path = require("path");
const { readFileSync, existsSync, createReadStream } = require("fs");
const { renderToPipeableStream } = require("react-server-dom-webpack/server");
const express = require("express");
const getJSX = require("./get-jsx.js");
const { getErrorJSX } = require("./get-error-jsx.js");
const addHook = require("./asset-require-hook.js");
const { extensions } = require("./asset-extensions.js");
webpackRegister();
const babelPluginRegisterImports = require("./babel-plugin-register-imports.js");
const babelRegister = require("@babel/register");
babelRegister({
  ignore: [/node_modules[\\/](?!dinou)/],
  presets: [
    ["@babel/preset-react", { runtime: "automatic" }],
    "@babel/preset-typescript",
  ],
  plugins: [babelPluginRegisterImports, "@babel/transform-modules-commonjs"],
  extensions: [".js", ".jsx", ".ts", ".tsx"],
});
const createScopedName = require("./createScopedName");
require("css-modules-require-hook")({
  generateScopedName: createScopedName,
});
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
const { fileURLToPath } = require("url");
const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";
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
      : `react_client_manifest/react-client-manifest.json`
  );
  const manifestFolderPath = path.resolve(
    process.cwd(),
    isWebpack ? outputFolder : "react_client_manifest"
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
          return JSON.parse(readFileSync(manifestPath, "utf8"));
        } catch (err) {
          if (err.code !== "ENOENT") {
            throw err; // Rethrow if it's not a file not found error
          }
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
          `[Server HMR] Could not resolve or clear ${modulePath}: ${err.message}`
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
    // manifestWatcher.on("all", (event) => console.log("event", event));
    manifestWatcher.on("change", onManifestChange);
  }
  startManifestWatcher();
}
let serverFunctionsManifest = null;
// const devCache = new Map(); // For dev: Map<absolutePath, Set<exports>>

if (!isDevelopment) {
  // In prod/build: load generated manifest
  const manifestPath = path.resolve(
    process.cwd(),
    isWebpack
      ? `${outputFolder}/server-functions-manifest.json`
      : `server_functions_manifest/server-functions-manifest.json`
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

function getContext(req, res) {
  // Helper to execute res methods safely
  const safeResCall = (methodName, ...args) => {
    if (res.headersSent) {
      console.log(
        `[Dinou] res.${methodName} called but headers already sent. Ignoring.`
      );
      // console.warn(
      //   `[Dinou Warning] RSC Stream active. Ignoring res.${methodName}() to avoid crash.`
      // );
      return; // Exit silently
    }
    if (methodName === "redirect") {
      // 1. Normalize arguments (Status and URL)
      let url = args[0];
      let status = 302; // Default

      if (args.length === 2) {
        status = args[0];
        url = args[1];
      }

      function safeRedirect(targetUrl) {
        // Validate it's a string before calling startsWith
        if (
          typeof targetUrl === "string" &&
          targetUrl.startsWith("/") &&
          !targetUrl.startsWith("//")
        ) {
          res.redirect.apply(res, [status, targetUrl]);
        } else {
          res.redirect.apply(res, [status, "/"]);
        }
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
      // redirect: (...args) => {
      //   if (res.headersSent) {
      //     // Do nothing on res object.
      //     // We trust that your Server Function will return <ClientRedirect />
      //     return;
      //   }
      //   res.redirect.apply(res, args);
      // },
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
      },
      query: { ...req.query },
      path: req.path,
      method: req.method,
    },
    res: {
      redirect: (urlOrStatus, url) => {
        const targetUrl = url || urlOrStatus;
        // We throw a special object that the endpoint will intercept
        throw {
          $$type: "dinou-internal-redirect",
          url: targetUrl,
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
        // Inject JavaScript.

        // 🛑 Security: JS cannot write HttpOnly cookies
        if (options && options.httpOnly) {
          console.error(
            `[Dinou Error] Cannot set HttpOnly cookie '${name}' in Server Function endpoint because streaming has started.`
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

        // Safe packaging for injection
        const safeCookieStr = JSON.stringify(cookieStr);

        // Write to stream
        res.write(`<script>document.cookie = ${safeCookieStr};</script>`);
      },

      clearCookie: (name, options) => {
        const path = options?.path || "/";

        // SCENARIO A: Native
        if (!res.headersSent) {
          res.setHeader("Content-Type", "text/x-component");
          res.clearCookie(name, options);
          return;
        }

        // SCENARIO B: Script Injection
        const safeName = JSON.stringify(name);
        const safePath = JSON.stringify(path);

        res.write(
          `<script>document.cookie = ${safeName} + "=; Max-Age=0; path=" + ${safePath} + ";";</script>`
        );
      },
    },
  };
  return context;
}

app.use(express.static(path.resolve(process.cwd(), outputFolder)));

let isReady = isDevelopment; // In dev we are always ready (or almost)

app.get("/__DINOU_STATUS_PLAYWRIGHT__", (req, res) => {
  res.json({
    status: "ok",
    isReady,
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
          : `react_client_manifest/react-client-manifest.json`
      ),
      "utf8"
    )
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
      ""
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
    if (
      (!isDevelopment &&
        /*Object.keys({ ...req.query }).length === 0 &&*/
        !dynamicState.value) ||
      isStatic
    ) {
      const payloadPath = path.resolve(
        "dist2",
        reqPath.replace(/^\//, ""),
        isOld || regenerating.has(reqPath) ? "rsc._old.rsc" : "rsc.rsc"
      );
      const distDir = path.resolve("dist2");

      if (!payloadPath.startsWith(distDir)) {
        return res.status(403).end();
      }
      if (existsSync(payloadPath)) {
        res.setHeader("Content-Type", "application/octet-stream");
        const readStream = createReadStream(payloadPath);
        readStream.on("error", (err) => {
          console.error("Error reading RSC file:", err);
          res.status(500).end();
        });
        // readStream.on("end", () => {
        //   if (!regenerating.has(reqPath)) {
        //     // Regeneration has finished, delete the old one
        //     try {
        //       unlinkSync(payloadPathOld);
        //     } catch (err) {
        //       console.error("Error deleting old RSC file:", err);
        //     }
        //   }
        // });
        return readStream.pipe(res);
      }
    }
    const context = getContext(req, res);
    const isNotFound = null;
    await requestStorage.run(context, async () => {
      const jsx = await getJSX(
        reqPath,
        { ...req.query },
        isNotFound,
        isDevelopment
      );
      const manifest = isDevelopment
        ? JSON.parse(
            readFileSync(
              path.resolve(
                process.cwd(),
                isWebpack
                  ? `${outputFolder}/react-client-manifest.json`
                  : `react_client_manifest/react-client-manifest.json`
              ),
              "utf8"
            )
          )
        : cachedClientManifest;

      const { pipe } = renderToPipeableStream(jsx, manifest);
      pipe(res);
    });
  } catch (error) {
    console.error("Error rendering RSC:", error);
    res.status(500).send("Internal Server Error");
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
    const jsx = await getErrorJSX(
      reqPath,
      { ...req.query },
      req.body.error,
      isDevelopment
    );
    const manifest = isDevelopment
      ? JSON.parse(
          readFileSync(
            path.resolve(
              process.cwd(),
              isWebpack
                ? `${outputFolder}/react-client-manifest.json`
                : `react_client_manifest/react-client-manifest.json`
            ),
            "utf8"
          )
        )
      : cachedClientManifest;
    const { pipe } = renderToPipeableStream(jsx, manifest);
    pipe(res);
  } catch (error) {
    console.error("Error rendering RSC:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get(/^\/.*\/?$/, (req, res) => {
  try {
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
    if (
      !isDevelopment &&
      /*Object.keys({ ...req.query }).length === 0 &&*/
      !dynamicState.value
    ) {
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
        const meta = getStatus[reqPath];

        if (meta && meta.status) {
          res.statusCode = meta.status;
        } else {
          res.statusCode = 200; // Default
        }
        const rStream = createReadStream(fileToRead);

        rStream.on("error", (err) => {
          console.error("Error reading HTML file:", err);
          if (!res.headersSent) res.status(500).send("Server Error");
        });

        // 1. IMPORTANT: We use { end: false } so pipe doesn't close the response
        rStream.pipe(res, { end: false });

        // 2. When the file finishes sending...
        rStream.on("end", () => {
          // 3. Write our additional content
          if (htmlPathOld) {
            res.write("<script>window.__DINOU_USE_OLD_RSC__=true;</script>");
          }
          res.write("<script>window.__DINOU_USE_STATIC__=true;</script>");

          // 4. Manually close the response (now we do)
          res.end();

          // // 5. Optional cleanup logic (async to avoid blocking)
          // if (htmlPathOld && !regenerating.has(reqPath)) {
          //   // It is better to use fs.promises to avoid blocking the event loop
          //   require("fs")
          //     .promises.unlink(htmlPathOld)
          //     .catch((err) => {
          //       console.error("Error deleting old HTML file:", err);
          //     });
          // }
        });

        return; // The stream is already flowing
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
          isDynamic
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
            // resolve(); // ⚠️ WATCH OUT: If you resolve here and then try to send status 500, it might fail if headers sent
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
    const serverHost = req.headers.host;

    // Compare host (domain:port)
    return originHost === serverHost;
  } catch (e) {
    return false; // If origin URL is invalid, reject.
  }
}

app.post("/____server_function____", async (req, res) => {
  try {
    // 1. Check Origin (Prevent calls from other domains)
    const origin = req.headers.origin;
    const host = req.headers.host;

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
        `[Security] Blocked request from origin: ${req.headers.origin}`
      );
      return res.status(403).json({ error: "Origin not allowed" });
    }
    const { id, args } = req.body;

    // Basic input validation: id must be string, args an array
    if (typeof id !== "string" || !Array.isArray(args)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const [fileUrl, exportName] = id.split("#");

    // Validate fileUrl: must start with 'file://' and not contain suspicious chars
    if (!fileUrl.startsWith("file://")) {
      return res.status(400).json({ error: "Invalid file URL format" });
    }

    // Extract relativePath and normalize (remove 'file://' and potential '/')
    let relativePath = fileUrl.replace(/^file:\/\/\/?/, "").trim();
    if (relativePath.startsWith("/") || relativePath.includes("..")) {
      return res
        .status(400)
        .json({ error: "Invalid path: no absolute or traversal allowed" });
    }
    // console.log("relPath", relativePath);
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
    // console.log("absPath", absolutePath);
    // Verify that the file exists
    if (!existsSync(absolutePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    let allowedExports;
    if (serverFunctionsManifest) {
      // Prod: use manifest (relativePath is already normalized)
      allowedExports = serverFunctionsManifest[relativePath];
    } else {
      // Dev: use cache or verify file
      // allowedExports = devCache.get(absolutePath);
      // if (!allowedExports) {
      const fileContent = readFileSync(absolutePath, "utf8"); // Reads only once
      if (!useServerRegex.test(fileContent)) {
        return res
          .status(403)
          .json({ error: "Not a valid server function file" });
      }
      // Parse exports (you need to implement parseExports on server if not present)
      const exports = parseExports(fileContent); // Assume you move parseExports to a shared util
      allowedExports = new Set(exports);
      // devCache.set(absolutePath, allowedExports);
      // }
    }

    // Validate exportName against allowedExports
    if (
      !exportName ||
      (exportName !== "default" && !allowedExports.has(exportName))
    ) {
      return res.status(400).json({ error: "Invalid export name" });
    }

    // Proceed with import (using your importModule)
    const mod = await importModule(absolutePath);

    // Validate exportName: only allow 'default' or others if you define a whitelist
    if (!exportName || (exportName !== "default" && !mod[exportName])) {
      return res.status(400).json({ error: "Invalid export name" });
    }
    const fn = exportName === "default" ? mod.default : mod[exportName];

    if (typeof fn !== "function") {
      return res.status(400).json({ error: "Export is not a function" });
    }

    await processLimiter.run(async () => {
      const context = getContextForServerFunctionEndpoint(req, res);

      let result;
      try {
        result = await requestStorage.run(context, async () => {
          return await fn(...args);
        });
      } catch (err) {
        // 💡 WE INTERCEPT THE REDIRECT
        if (err && err.$$type === "dinou-internal-redirect") {
          // 1. Always sanitize the URL
          const safeUrl = JSON.stringify(err.url);
          const script = `<script>window.location.href = ${safeUrl};</script>`;

          if (!res.headersSent) {
            // SCENARIO A: Clean (Content-Type html)
            res.setHeader("Content-Type", "text/html");
            return res.send(script); // res.send calls end() and return stops the function
          } else {
            // SCENARIO B: Dirty/Active Stream (Content-Type already set by clearCookie)
            // Write the script to the existing stream
            res.write(script);

            // ⚠️ IMPORTANT:
            // 1. We close the response, since we redirected and there will be no RSC payload.
            res.end();

            // 2. WE STOP execution so it doesn't continue to res.json() below.
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
          : `react_client_manifest/react-client-manifest.json`
      );
      // Verify that the manifest exists to avoid errors
      if (!existsSync(manifestPath)) {
        return res.status(500).json({ error: "Manifest not found" });
      }
      const manifest = isDevelopment
        ? JSON.parse(readFileSync(manifestPath, "utf8"))
        : cachedClientManifest;
      const { pipe } = renderToPipeableStream(result, manifest);
      pipe(res);
    });
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
    // 1. CREAR SERVIDOR
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

    // 3. LISTEN (ARRANCAR INMEDIATAMENTE)
    // Esto hace feliz a DigitalOcean y los Health Checks
    await new Promise((resolve) => {
      server.listen(port, () => {
        console.log(
          `\n🚀 Dinou Server is ready and listening on http://localhost:${port}`
        );
        console.log(
          `   Environment: ${isDevelopment ? "Development" : "Production"}`
        );
        resolve();
      });
    });

    // 4. GENERACIÓN ESTÁTICA EN SEGUNDO PLANO (NON-BLOCKING)
    // El servidor ya está escuchando. Ahora generamos los estáticos.
    // Si entra una petición ahora, se servirá dinámicamente.
    if (!isDevelopment) {
      console.log("🏗️  [Background] Starting static generation (SSG)...");

      // No hacemos await aquí si no queremos bloquear el Event Loop completamente,
      // aunque en Node el rendering suele ser síncrono/CPU heavy,
      // así que el servidor podría ir un poco lento durante la generación.
      // Pero para un health check simple (ping) debería bastar.

      generateStatic()
        .then(() => {
          console.log("✅ [Background] Static generation finished.");
          isReady = true;
        })
        .catch((err) => {
          console.error(
            "❌ [Background] Static generation failed (App continues in Dynamic Mode):",
            err
          );
          isReady = true;
          // Opcional: process.exit(1) si consideras que sin estáticos la app no debe vivir.
          // Yo recomiendo NO salir, para que la web siga funcionando dinámicamente.
        });
    } else {
      console.log("⚙️  [Startup] Running in Development Mode");
    }
  } catch (error) {
    console.error("💥 [Fatal Startup Error]:", error);
    process.exit(1);
  }
})();
