import fs from "node:fs";
import path from "node:path";
import module, { createRequire } from "node:module";

// Compatibility shim for Webpack 5.112+ internal file reorganization with react-server-dom-webpack
const originalResolveFilename = module._resolveFilename;
if (originalResolveFilename) {
  module._resolveFilename = function (request, parent, isMain, options) {
    if (request === "webpack/lib/dependencies/ModuleDependency") {
      try {
        return originalResolveFilename.call(this, request, parent, isMain, options);
      } catch {
        return originalResolveFilename.call(
          this,
          "webpack/lib/dependencies/core/ModuleDependency",
          parent,
          isMain,
          options
        );
      }
    }
    if (request === "webpack/lib/Template") {
      try {
        return originalResolveFilename.call(this, request, parent, isMain, options);
      } catch {
        return originalResolveFilename.call(
          this,
          "webpack/lib/template/Template",
          parent,
          isMain,
          options
        );
      }
    }
    return originalResolveFilename.call(this, request, parent, isMain, options);
  };
}

let cachedPlugin = null;

export function loadReactServerWebpackPlugin() {
  if (cachedPlugin) return cachedPlugin;

  const dinouReq = createRequire(import.meta.url);
  let baseReq = dinouReq;
  let pluginEntry = null;
  try {
    pluginEntry = dinouReq.resolve("react-server-dom-webpack/plugin");
  } catch {
    baseReq = createRequire(path.resolve(process.cwd(), "package.json"));
    pluginEntry = baseReq.resolve("react-server-dom-webpack/plugin");
  }

  const isBunRuntime =
    typeof Bun !== "undefined" || Boolean(process.versions?.bun);

  if (!isBunRuntime) {
    try {
      const loaded = baseReq(pluginEntry);
      cachedPlugin = loaded?.default || loaded;
      return cachedPlugin;
    } catch {
      // Fallback to scoped CJS evaluator below
    }
  }

  // Bun's native Zig CJS loader bypasses `module._resolveFilename`, so evaluate
  // `react-server-dom-webpack-plugin.js` with a scoped `require` shim that maps
  // Webpack 5.112+ relocated internal module paths cleanly in memory.
  const implPath = path.resolve(
    path.dirname(pluginEntry),
    "cjs/react-server-dom-webpack-plugin.js"
  );
  const implReq = createRequire(implPath);
  const resolveWebpackInternal = (id, fallbackId) => {
    try {
      return implReq(id);
    } catch {
      try {
        return implReq(fallbackId);
      } catch {
        return baseReq(fallbackId);
      }
    }
  };

  const scopedRequire = (id) => {
    if (id === "webpack/lib/dependencies/ModuleDependency") {
      return resolveWebpackInternal(
        id,
        "webpack/lib/dependencies/core/ModuleDependency"
      );
    }
    if (id === "webpack/lib/Template") {
      return resolveWebpackInternal(id, "webpack/lib/template/Template");
    }
    try {
      return implReq(id);
    } catch {
      return baseReq(id);
    }
  };
  Object.assign(scopedRequire, implReq);

  const mod = { exports: {} };
  const source = fs.readFileSync(implPath, "utf8");
  const wrapperFn = new Function(
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
    source
  );
  wrapperFn(
    mod.exports,
    scopedRequire,
    mod,
    implPath,
    path.dirname(implPath)
  );

  cachedPlugin = mod.exports?.default || mod.exports;
  return cachedPlugin;
}

export default { loadReactServerWebpackPlugin };
