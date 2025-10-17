const tsconfigPaths = require("tsconfig-paths");
const path = require("path");
const fs = require("fs");

// 🧩 --- Patch for .mjs handling (instead of editing node_modules)
try {
  const internalPath = require.resolve("tsconfig-paths/lib/try-path.js");
  const tryPath = require(internalPath);

  if (tryPath.getStrippedPath && !tryPath.getStrippedPath.__patchedForMJS) {
    const original = tryPath.getStrippedPath;

    tryPath.getStrippedPath = function patchedGetStrippedPath(tryPathArg) {
      if (tryPathArg.type === "extension" && tryPathArg.path.endsWith(".mjs")) {
        return tryPathArg.path; // 🚀 Skip removeExtension for .mjs
      }
      return original.call(this, tryPathArg);
    };

    tryPath.getStrippedPath.__patchedForMJS = true;
  }
} catch (e) {
  console.warn("[tsconfig-paths] Could not patch getStrippedPath:", e);
}

function getConfigFileIfExists() {
  const tsconfigPath = path.resolve(process.cwd(), "tsconfig.json");
  const jsconfigPath = path.resolve(process.cwd(), "jsconfig.json");

  if (fs.existsSync(tsconfigPath)) return tsconfigPath;
  if (fs.existsSync(jsconfigPath)) return jsconfigPath;

  return null;
}

const configFile = getConfigFileIfExists();

if (configFile) {
  const config = require(configFile);
  const { baseUrl, paths } = config.compilerOptions || {};

  if (baseUrl && paths) {
    // tsconfigPaths.register({
    //   baseUrl: path.resolve(process.cwd(), baseUrl),
    //   paths,
    // });

    const absoluteBaseUrl = path.resolve(process.cwd(), baseUrl);
    const matchPath = tsconfigPaths.createMatchPath(absoluteBaseUrl, paths);

    // Patch node's module loading
    const Module = require("module");
    const originalLoader = Module._load;
    Module._load = function (request) {
      const found = matchPath(
        request,
        undefined,
        undefined, // fileExists (default)
        [".js", ".jsx", ".ts", ".tsx", ".mjs"] // Custom extensions including .mjs
      );
      if (found) {
        const modifiedArguments = [found].concat([].slice.call(arguments, 1));
        return originalLoader.apply(this, modifiedArguments);
      }
      return originalLoader.apply(this, arguments);
    };
  }
}
