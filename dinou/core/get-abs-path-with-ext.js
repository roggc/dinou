const fs = require("fs");
const path = require("path");
const { fileURLToPath, pathToFileURL } = require("url");

// Reads tsconfig/jsconfig and builds a map of alias -> targetBase
function loadTsconfigAliases() {
  const cwd = process.cwd();
  const tsconfigPath = path.resolve(cwd, "tsconfig.json");
  const jsconfigPath = path.resolve(cwd, "jsconfig.json");
  const configFile = fs.existsSync(tsconfigPath)
    ? tsconfigPath
    : fs.existsSync(jsconfigPath)
    ? jsconfigPath
    : null;
  if (!configFile) return new Map();

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configFile, "utf8"));
  } catch (err) {
    // Malformed json
    return new Map();
  }

  const paths = (config.compilerOptions && config.compilerOptions.paths) || {};
  const baseUrl =
    (config.compilerOptions && config.compilerOptions.baseUrl) || ".";
  const absoluteBase = path.resolve(cwd, baseUrl);

  const map = new Map();

  for (const key of Object.keys(paths)) {
    const targets = paths[key];
    if (!targets || !targets.length) continue;

    // Normalize: the first target is the one we will use
    let target = Array.isArray(targets) ? targets[0] : targets;

    // Support patterns with /* at the end: "@/*" -> "src/*"
    const keyIsWildcard = key.endsWith("/*");
    const targetIsWildcard = target.endsWith("/*");

    const alias = keyIsWildcard ? key.slice(0, -1) : key; // "@/"
    const targetBase = targetIsWildcard ? target.slice(0, -1) : target; // "src" or "../lib"

    // we resolve the targetBase relative to baseUrl if it is not absolute
    const resolvedTargetBase = path.resolve(absoluteBase, targetBase);

    map.set(alias, {
      resolvedTargetBase,
      keyIsWildcard,
      targetIsWildcard,
    });
  }

  return map;
}

const aliasMap = loadTsconfigAliases();

// Add extensions if they do not exist
function tryExtensions(filePath) {
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile())
    return filePath;
  const exts = [".js", ".ts", ".jsx", ".tsx"];
  for (const ext of exts) {
    const f = filePath + ext;
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  }
  // If it is a folder, try index.*
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    for (const ext of exts) {
      const f = path.join(filePath, "index" + ext);
      if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
    }
  }
  return null;
}

exports.getAbsPathWithExt = function getAbsPathWithExt(specifier, context) {
  const cleanSpecifier = specifier ? specifier.split("?")[0] : specifier;
  if (!cleanSpecifier) return null;

  if (aliasMap.size > 0) {
    for (const [alias, info] of aliasMap.entries()) {
      if (cleanSpecifier.startsWith(alias)) {
        const absPath = path.resolve(
          info.resolvedTargetBase,
          cleanSpecifier.slice(alias.length)
        );
        return tryExtensions(absPath);
      }
    }
  }

  if (cleanSpecifier.startsWith("./") || cleanSpecifier.startsWith("../")) {
    const parentURL = context?.parentURL || pathToFileURL(process.cwd()).href;
    const cleanParentURL = parentURL.split("?")[0];
    const parentDir = path.dirname(fileURLToPath(cleanParentURL));
    const absPath = path.resolve(parentDir, cleanSpecifier);
    return tryExtensions(absPath);
  }

  return null;
};
