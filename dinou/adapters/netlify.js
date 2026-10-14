// dinou/adapters/netlify.js
// Netlify Functions v2 Adapter for Dinou.
// Automatically routes all requests to Dinou's universal Web Standards handler.
Object.assign(process.env, { NODE_ENV: "production" });

import { register } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import Module from "node:module";

import { dinouCoreDir } from "../core/dinou-paths.js";

if (typeof register === "function") {
  try {
    const loaderPath = path.join(dinouCoreDir, "babel-esm-loader.js");
    register(pathToFileURL(loaderPath).href, pathToFileURL("./"));
  } catch (e) {
    console.error("[Dinou Adapter] Loader registration failed:", e);
  }
}

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

if (Module && Module._resolveFilename) {
  const originalResolveFilename = Module._resolveFilename;
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
}

if (typeof require === "function") {
  globalThis.__dinou_require__ = require;
}

import { handleRequest } from "../core/handler.js";

/**
 * Netlify Function v2 handler
 * @param {Request} request 
 * @param {object} context 
 * @returns {Promise<Response>}
 */
export default async function netlifyHandler(request, context) {
  return handleRequest(request);
}

export const config = {
  path: "/*",
  preferStatic: true,
};

