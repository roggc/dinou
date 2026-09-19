const { pathToFileURL } = require("url");
const path = require("path");
const fs = require("fs");

function getMtimeParam(absPath) {
  try {
    const stats = fs.statSync(absPath);
    return Math.round(stats.mtimeMs);
  } catch (e) {
    return Date.now();
  }
}

function normalizeKey(p) {
  if (!p) return "";
  let s = String(p).replace(/\\/g, "/");
  s = s.replace(/^file:\/\/\/?/, "");
  const cwd = typeof process !== "undefined" && typeof process.cwd === "function"
    ? process.cwd().replace(/\\/g, "/")
    : "";
  if (cwd && s.startsWith(cwd)) {
    s = s.slice(cwd.length);
  }
  s = s.replace(/^\/+/, "").replace(/^\.\//, "");
  return s;
}

async function importModule(modulePath) {
  const registry = typeof globalThis !== "undefined" ? globalThis.__DINOU_ROUTE_MODULES__ : null;
  if (registry) {
    const key = normalizeKey(modulePath);
    if (registry[key]) {
      const loader = registry[key];
      return typeof loader === "function" ? await loader() : loader;
    }
    // Also try with or without extensions / leading src/
    const alternateKeys = [
      key,
      key.startsWith("src/") ? key.slice(4) : "src/" + key,
      key.replace(/\.[jt]sx?$/, ""),
    ];
    for (const alt of alternateKeys) {
      if (registry[alt]) {
        const loader = registry[alt];
        return typeof loader === "function" ? await loader() : loader;
      }
    }
  }

  const absPath = path.isAbsolute(modulePath)
    ? modulePath
    : path.resolve(process.cwd(), modulePath);

  let fileUrl = pathToFileURL(absPath).href;
  if (process.env.NODE_ENV !== "production") {
    fileUrl += `?mtime=${getMtimeParam(absPath)}`;
  }

  const mod = await import(/* webpackIgnore: true */ fileUrl);
  return mod;
}

function registerRouteModules(modulesMap) {
  if (typeof globalThis !== "undefined") {
    globalThis.__DINOU_ROUTE_MODULES__ = {
      ...(globalThis.__DINOU_ROUTE_MODULES__ || {}),
      ...modulesMap,
    };
  }
}

importModule.register = registerRouteModules;

module.exports = importModule;
