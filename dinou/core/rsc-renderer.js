// dinou/core/rsc-renderer.js
// Universal RSC Stream Renderer supporting Node Streams and Web Streams (Cloudflare Workers / Edge).

const { pathToFileURL } = require("url");

const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";

function isEdgeRuntime(options = {}) {
  const rt =
    (options && options.runtime) ||
    (typeof globalThis !== "undefined" && globalThis.__DINOU_RUNTIME__) ||
    (typeof process !== "undefined" && process.env && process.env.DINOU_RUNTIME);
  if (
    typeof rt === "string" &&
    (rt === "edge" || rt === "deno-edge" || rt === "bun" || rt === "bun-bundle" || rt === "node-bundle" || rt.includes("edge") || rt.includes("bundle"))
  ) {
    return true;
  }
  return false;
}

let nodeRender = null;
function getNodeRenderer() {
  if (!nodeRender) {
    nodeRender = isWebpack
      ? require("react-server-dom-webpack/server")
      : require("@roggc/react-server-dom-esm/server");
  }
  return nodeRender;
}

let edgeRender = null;
function getEdgeRenderer() {
  if (!edgeRender) {
    try {
      edgeRender = require("react-server-dom-webpack/server.edge");
    } catch (e) {
      edgeRender = require("react-server-dom-webpack/server");
    }
  }
  return edgeRender;
}

/**
 * Renders JSX / Model to an RSC Stream based on runtime environment.
 * @param {*} model The React element tree or value to render
 * @param {object} manifest The client component manifest
 * @param {object} options Runtime options ({ runtime: "node" | "edge" })
 * @returns {ReadableStream | { pipe: Function, abort: Function }}
 */
function renderRSCStream(model, manifest, options = {}) {
  if (isEdgeRuntime(options)) {
    const edge = getEdgeRenderer();
    const clientManifest =
      manifest ||
      (typeof globalThis !== "undefined" && globalThis.__DINOU_CLIENT_MANIFEST__) ||
      {};
    return edge.renderToReadableStream(model, clientManifest, options);
  }

  const node = getNodeRenderer();
  const manifestOrUrl = isWebpack
    ? manifest
    : (pathToFileURL(process.cwd()).href + "/");
  return node.renderToPipeableStream(model, manifestOrUrl, options);
}

/**
 * Pipes RSC rendering to a response bridge or returns a native Web Response directly.
 * @param {*} model
 * @param {object} bridge WebResponseBridge instance
 * @param {object} manifest
 * @param {object} options
 */
function pipeRSC(model, bridge, manifest, options = {}) {
  if (isEdgeRuntime(options)) {
    const stream = renderRSCStream(model, manifest, options);
    bridge.setEdgeStream(stream);
    return;
  }

  const { pipe } = renderRSCStream(model, manifest, options);
  pipe(bridge);
}

module.exports = {
  isEdgeRuntime,
  renderRSCStream,
  pipeRSC,
};
