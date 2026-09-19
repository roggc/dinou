// dinou/core/run-ssg.js
// Standalone Static Site Generation (SSG) runner for Dinou.
const { pathToFileURL } = require("url");
const path = require("path");
const { register } = require("node:module");
globalThis.__dinou_require__ = require;

const { dinouCoreDir } = require("./dinou-paths.js");

if (typeof register === "function") {
  try {
    const loaderPath = path.join(dinouCoreDir, "babel-esm-loader.js");
    register(pathToFileURL(loaderPath).href, pathToFileURL("./"));
  } catch (e) {
    // Loader might already be registered
  }
}

const Module = require("module");
const originalResolveFilename = Module._resolveFilename;

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
const addHook = require("./asset-require-hook.js");
const { extensions } = require("./asset-extensions.js");
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

const generateStatic = require("./generate-static.js");

async function runSSG() {
  console.log("🏗️  [SSG] Pre-rendering static pages and RSC payloads...");
  await generateStatic();
  console.log("✅ [SSG] Static generation finished successfully.");
}

if (require.main === module) {
  runSSG().catch((err) => {
    console.error("❌ [SSG] Static generation failed:", err);
    process.exit(1);
  });
}

module.exports = { runSSG };
