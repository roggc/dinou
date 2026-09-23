// dinou/core/manifest-provider.js
// Universal provider for RSC Client Manifest and Server Functions Manifest.
// Supports in-memory injection for Edge/Cloudflare Workers and disk fallback for Node.js.

const path = require("path");
const fs = require("fs");

let cachedClientManifest = null;
let cachedServerFunctionsManifest = null;

function isDevMode() {
  return (
    process.env.DINOU_DEV === "true" ||
    (typeof globalThis !== "undefined" && Boolean(globalThis.__DINOU_DEV__)) ||
    process.env.NODE_ENV !== "production"
  );
}

function getOutputFolder() {
  return isDevMode() ? ".dinou/public" : ".dinou/dist3";
}

function getClientManifestPath() {
  const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";
  const outputFolder = getOutputFolder();
  return path.resolve(
    process.cwd(),
    isWebpack
      ? `${outputFolder}/react-client-manifest.json`
      : `.dinou/react_client_manifest/react-client-manifest.json`
  );
}

function getServerFunctionsManifestPath() {
  const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";
  const outputFolder = getOutputFolder();
  return path.resolve(
    process.cwd(),
    isWebpack
      ? `${outputFolder}/server-functions-manifest.json`
      : `.dinou/server_functions_manifest/server-functions-manifest.json`
  );
}

function isManifestReady() {
  if (typeof globalThis !== "undefined" && globalThis.__DINOU_CLIENT_MANIFEST__) {
    return true;
  }
  try {
    const p = getClientManifestPath();
    return fs.existsSync(p) && fs.readFileSync(p, "utf8").trim().length > 2;
  } catch (e) {
    return false;
  }
}

function getClientManifest() {
  if (typeof globalThis !== "undefined" && globalThis.__DINOU_CLIENT_MANIFEST__) {
    return globalThis.__DINOU_CLIENT_MANIFEST__;
  }
  const isDevelopment = isDevMode();
  if (!isDevelopment && cachedClientManifest) {
    return cachedClientManifest;
  }
  try {
    const p = getClientManifestPath();
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, "utf8"));
      if (!isDevelopment) cachedClientManifest = parsed;
      return parsed;
    }
  } catch (e) {}
  return cachedClientManifest || {};
}

function setClientManifest(manifest) {
  cachedClientManifest = manifest;
  if (typeof globalThis !== "undefined") {
    globalThis.__DINOU_CLIENT_MANIFEST__ = manifest;
  }
}

function getServerFunctionsManifest() {
  if (typeof globalThis !== "undefined" && globalThis.__DINOU_SERVER_FUNCTIONS_MANIFEST__) {
    const raw = globalThis.__DINOU_SERVER_FUNCTIONS_MANIFEST__;
    if (raw instanceof Map) return raw;
    const parsed = {};
    for (const key in raw) {
      parsed[key] = raw[key] instanceof Set ? raw[key] : new Set(raw[key]);
    }
    return parsed;
  }

  const isDevelopment = isDevMode();
  const p = getServerFunctionsManifestPath();

  if (isDevelopment) {
    if (fs.existsSync(p)) {
      try {
        const raw = JSON.parse(fs.readFileSync(p, "utf8"));
        const parsed = {};
        for (const key in raw) {
          parsed[key] = new Set(raw[key]);
        }
        return parsed;
      } catch (e) {}
    }
    return null;
  }

  if (!cachedServerFunctionsManifest && fs.existsSync(p)) {
    try {
      const raw = JSON.parse(fs.readFileSync(p, "utf8"));
      cachedServerFunctionsManifest = {};
      for (const key in raw) {
        cachedServerFunctionsManifest[key] = new Set(raw[key]);
      }
    } catch (e) {}
  }
  return cachedServerFunctionsManifest;
}

function setServerFunctionsManifest(manifest) {
  cachedServerFunctionsManifest = manifest;
  if (typeof globalThis !== "undefined") {
    globalThis.__DINOU_SERVER_FUNCTIONS_MANIFEST__ = manifest;
  }
}

module.exports = {
  isManifestReady,
  getClientManifest,
  setClientManifest,
  getServerFunctionsManifest,
  setServerFunctionsManifest,
};
