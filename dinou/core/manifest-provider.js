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

function createDevClientManifestProxy(target) {
  if (!target || typeof target !== "object") return target;
  if (target.__isDinouDevProxy) return target;

  return new Proxy(target, {
    get(obj, prop, receiver) {
      if (prop === "__isDinouDevProxy") return true;
      if (typeof prop !== "string") {
        return Reflect.get(obj, prop, receiver);
      }
      if (prop in obj) {
        return obj[prop];
      }

      // 1. Try drive-letter / url casing variations
      let altProp = null;
      if (prop.startsWith("file:///c:/")) {
        altProp = "file:///C:/" + prop.slice(11);
      } else if (prop.startsWith("file:///C:/")) {
        altProp = "file:///c:/" + prop.slice(11);
      }
      if (altProp && altProp in obj) {
        return obj[altProp];
      }

      // 2. Check if disk manifest has been updated
      const hashIdx = prop.lastIndexOf("#");
      const baseUri = hashIdx !== -1 ? prop.slice(0, hashIdx) : prop;
      const expName = hashIdx !== -1 ? prop.slice(hashIdx + 1) : "default";

      let altBaseUri = null;
      if (baseUri.startsWith("file:///c:/")) {
        altBaseUri = "file:///C:/" + baseUri.slice(11);
      } else if (baseUri.startsWith("file:///C:/")) {
        altBaseUri = "file:///c:/" + baseUri.slice(11);
      }

      try {
        const p = getClientManifestPath();
        if (fs.existsSync(p)) {
          const fresh = JSON.parse(fs.readFileSync(p, "utf8"));
          if (fresh[prop]) {
            const entry = { ...fresh[prop] };
            if (hashIdx !== -1) entry.name = expName;
            obj[prop] = entry;
            return entry;
          }
          if (altProp && fresh[altProp]) {
            const entry = { ...fresh[altProp] };
            if (hashIdx !== -1) entry.name = expName;
            obj[prop] = entry;
            return entry;
          }
          if (hashIdx !== -1) {
            const baseEntry = fresh[baseUri] || (altBaseUri && fresh[altBaseUri]);
            if (baseEntry) {
              const entry = { ...baseEntry, name: expName };
              obj[prop] = entry;
              return entry;
            }
          }
        }
      } catch (e) {}

      // 3. Fallback for client files in src/ during hot edits
      if (baseUri.startsWith("file:///")) {
        try {
          const { fileURLToPath } = require("url");
          const localPath = fileURLToPath(baseUri);
          if (fs.existsSync(localPath)) {
            const fallbackEntry = { id: baseUri, chunks: [], name: expName };
            obj[prop] = fallbackEntry;
            if (!obj[baseUri]) {
              obj[baseUri] = { id: baseUri, chunks: [], name: "*" };
            }
            return fallbackEntry;
          }
        } catch (e) {}
      }

      return Reflect.get(obj, prop, receiver);
    },
  });
}

function getClientManifest() {
  if (typeof globalThis !== "undefined" && globalThis.__DINOU_CLIENT_MANIFEST__) {
    const manifest = globalThis.__DINOU_CLIENT_MANIFEST__;
    if (isDevMode() && !manifest.__isDinouDevProxy) {
      globalThis.__DINOU_CLIENT_MANIFEST__ = createDevClientManifestProxy(manifest);
      return globalThis.__DINOU_CLIENT_MANIFEST__;
    }
    return manifest;
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
      return isDevelopment ? createDevClientManifestProxy(parsed) : parsed;
    }
  } catch (e) {}
  return cachedClientManifest || (isDevelopment ? createDevClientManifestProxy({}) : {});
}

function setClientManifest(manifest) {
  cachedClientManifest = manifest;
  if (typeof globalThis !== "undefined") {
    globalThis.__DINOU_CLIENT_MANIFEST__ = isDevMode()
      ? createDevClientManifestProxy(manifest)
      : manifest;
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
