require("dotenv/config");
require("./register-paths");
const webpackRegister = require("react-server-dom-webpack/node-register");
const path = require("path");
const { readFileSync, existsSync, createReadStream } = require("fs");
const { renderToPipeableStream } = require("react-server-dom-webpack/server");
const express = require("express");
const getSSGJSXOrJSX = require("./get-ssg-jsx-or-jsx.js");
const { getErrorJSX } = require("./get-error-jsx.js");
const addHook = require("./asset-require-hook.js");
const { extensions } = require("./asset-extensions.js");
webpackRegister();
const babelRegister = require("@babel/register");
babelRegister({
  ignore: [/[\\\/](build|server|node_modules)[\\\/]/],
  presets: [
    ["@babel/preset-react", { runtime: "automatic" }],
    "@babel/preset-typescript",
  ],
  plugins: ["@babel/transform-modules-commonjs"],
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
const revalidating = require("./revalidating.js");
const isDevelopment = process.env.NODE_ENV !== "production";
const outputFolder = isDevelopment ? "public" : "dist3";
const chokidar = require("chokidar");
const { fileURLToPath } = require("url");
const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";
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
  let currentManifest = {};

  const manifestWatcher = chokidar.watch(manifestFolderPath, {
    persistent: true,
    ignored: /node_modules/,
  });
  let isInitial = true;

  async function loadManifestWithRetry(
    manifestPath,
    maxRetries = 10,
    delayMs = 100
  ) {
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

  manifestWatcher.on("add", async (chokidarPath) => {
    if (Object.keys(currentManifest).length === 0 && isInitial) {
      if (isWebpack && chokidarPath !== manifestPath) {
        // console.log("webpack: not manifest path");
        return;
      }

      try {
        currentManifest = await loadManifestWithRetry(manifestPath);
        // console.log("Loaded initial manifest for HMR.", currentManifest);
        isInitial = false;
      } catch (err) {
        console.error("Failed to load initial manifest after retries:", err);
      }
      return;
    }
  });

  manifestWatcher.on("unlink", () => {
    isInitial = true;
    currentManifest = {};
    // console.log("unlinked");
  });

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

  manifestWatcher.on("change", (chokidarPath) => {
    try {
      if (isWebpack && chokidarPath !== manifestPath) {
        // console.log("webpack change: not manifest");
        return;
      }
      // console.log("[Server HMR] Detected manifest change.");
      const newManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      // Handle removed entries: client -> server switch
      // console.log(
      //   "currentManifest",
      //   currentManifest,
      //   "newManifest",
      //   newManifest
      // );
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
    } catch (err) {
      console.error("Error handling manifest change:", err);
    }
  });
}
const cookieParser = require("cookie-parser");
const appUseCookieParser = cookieParser();
const app = express();
app.use(appUseCookieParser);
app.use(express.json());

app.use(express.static(path.resolve(process.cwd(), outputFolder)));

app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json({
    name: "Dinou DevTools",
    description: "Dinou DevTools for Chrome",
    version: "1.0.0",
    devtools_page: `/${outputFolder}/devtools.html`,
  });
});

app.get(/^\/____rsc_payload____\/.*\/?$/, async (req, res) => {
  try {
    const reqPath = (
      req.path.endsWith("/") ? req.path : req.path + "/"
    ).replace("/____rsc_payload____", "");

    if (!isDevelopment && Object.keys({ ...req.query }).length === 0) {
      const payloadPath = path.join("dist2", reqPath, "rsc.rsc");
      if (existsSync(payloadPath)) {
        res.setHeader("Content-Type", "application/octet-stream");
        const readStream = createReadStream(payloadPath);
        readStream.on("error", (err) => {
          console.error("Error reading RSC file:", err);
          res.status(500).end();
        });
        return readStream.pipe(res);
      }
    }
    const jsx = await getSSGJSXOrJSX(
      reqPath,
      { ...req.query },
      { ...req.cookies },
      isDevelopment
    );
    const manifest = JSON.parse(
      readFileSync(
        path.resolve(
          isWebpack
            ? `${outputFolder}/react-client-manifest.json`
            : `react_client_manifest/react-client-manifest.json`
        ),
        "utf8"
      )
    );

    const { pipe } = renderToPipeableStream(jsx, manifest);
    pipe(res);
  } catch (error) {
    console.error("Error rendering RSC:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post(/^\/____rsc_payload_error____\/.*\/?$/, async (req, res) => {
  try {
    const reqPath = (
      req.path.endsWith("/") ? req.path : req.path + "/"
    ).replace("/____rsc_payload_error____", "");
    const jsx = await getErrorJSX(reqPath, { ...req.query }, req.body.error);
    const manifest = readFileSync(
      path.resolve(
        process.cwd(),
        isWebpack
          ? `${outputFolder}/react-client-manifest.json`
          : `react_client_manifest/react-client-manifest.json`
      ),
      "utf8"
    );
    const moduleMap = JSON.parse(manifest);
    const { pipe } = renderToPipeableStream(jsx, moduleMap);
    pipe(res);
  } catch (error) {
    console.error("Error rendering RSC:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get(/^\/.*\/?$/, (req, res) => {
  try {
    const reqPath = req.path.endsWith("/") ? req.path : req.path + "/";

    if (!isDevelopment && Object.keys({ ...req.query }).length === 0) {
      revalidating(reqPath);
      const htmlPath = path.join("dist2", reqPath, "index.html");

      if (existsSync(htmlPath)) {
        res.setHeader("Content-Type", "text/html");
        return createReadStream(htmlPath).pipe(res);
      }
    }

    const appHtmlStream = renderAppToHtml(
      reqPath,
      JSON.stringify({ ...req.query }),
      JSON.stringify({ ...req.cookies })
    );

    res.setHeader("Content-Type", "text/html");
    appHtmlStream.pipe(res);

    appHtmlStream.on("error", (error) => {
      console.error("Stream error:", error);
      res.status(500).send("Internal Server Error");
    });
  } catch (error) {
    console.error("Error rendering React app:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/____server_function____", async (req, res) => {
  try {
    const { id, args } = req.body;
    const [fileUrl, exportName] = id.split("#");

    let relativePath = fileUrl.replace(/^file:\/\/\/?/, "");
    const absolutePath = path.resolve(process.cwd(), relativePath);

    const mod = await importModule(absolutePath);

    const fn = exportName === "default" ? mod.default : mod[exportName];

    if (typeof fn !== "function") {
      return res.status(400).json({ error: "Export is not a function" });
    }

    const context = { req, res };
    args.push(context);
    const result = await fn(...args);

    if (
      result &&
      result.$$typeof === Symbol.for("react.transitional.element")
    ) {
      res.setHeader("Content-Type", "text/x-component");
      const manifest = readFileSync(
        path.resolve(
          process.cwd(),
          isWebpack
            ? `${outputFolder}/react-client-manifest.json`
            : `react_client_manifest/react-client-manifest.json`
        ),
        "utf8"
      );
      const moduleMap = JSON.parse(manifest);
      const { pipe } = renderToPipeableStream(result, moduleMap);
      pipe(res);
    } else {
      res.json(result);
    }
  } catch (err) {
    console.error(`Server function error [${req.body.id}]:`, err);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, async () => {
  if (!isDevelopment) {
    await generateStatic();
  } else {
    console.log("⚙️ Rendering dynamically in dev mode");
  }
  console.log(`Listening on port ${port}`);
});
