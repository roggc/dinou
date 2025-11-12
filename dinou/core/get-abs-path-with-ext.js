const fs = require("fs");
const path = require("path");
const { fileURLToPath, pathToFileURL } = require("url");

// Lee tsconfig/jsconfig y construye un map de alias -> targetBase
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

    // Normaliza: el primer target es el que usaremos
    let target = Array.isArray(targets) ? targets[0] : targets;

    // Soportar patterns con /* al final: "@/*" -> "src/*"
    const keyIsWildcard = key.endsWith("/*");
    const targetIsWildcard = target.endsWith("/*");

    const alias = keyIsWildcard ? key.slice(0, -1) : key; // "@/"
    const targetBase = targetIsWildcard ? target.slice(0, -1) : target; // "src" o "../lib"

    // resolvemos el targetBase relativo a baseUrl si no es absoluto
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

// Añadir extensiones si no existen
function tryExtensions(filePath) {
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile())
    return filePath;
  const exts = [".js", ".ts", ".jsx", ".tsx"];
  for (const ext of exts) {
    const f = filePath + ext;
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  }
  // Si es carpeta, probar index.*
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    for (const ext of exts) {
      const f = path.join(filePath, "index" + ext);
      if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
    }
  }
  return null;
}

exports.getAbsPathWithExt = function getAbsPathWithExt(specifier, context) {
  if (aliasMap.size > 0) {
    for (const [alias, info] of aliasMap.entries()) {
      if (specifier.startsWith(alias)) {
        const absPath = path.resolve(
          info.resolvedTargetBase,
          specifier.slice(alias.length)
        );
        return tryExtensions(absPath);
      }
    }
  }

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const parentURL = context.parentURL || pathToFileURL(process.cwd()).href;
    const parentDir = path.dirname(fileURLToPath(parentURL));
    const absPath = path.resolve(parentDir, specifier);
    return tryExtensions(absPath);
  }

  return null;
};
