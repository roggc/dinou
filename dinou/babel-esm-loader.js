const fs = require("fs");
const path = require("path");
const { transformAsync } = require("@babel/core");
const { fileURLToPath, pathToFileURL } = require("url");
const createScopedName = require("./createScopedName");

require("css-modules-require-hook")({
  generateScopedName: createScopedName,
  extensions: [".css"],
});

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
  if (fs.existsSync(filePath)) return filePath;
  const exts = [".js", ".ts", ".jsx", ".tsx"];
  for (const ext of exts) {
    const f = filePath + ext;
    if (fs.existsSync(f)) return f;
  }
  // Si es carpeta, probar index.*
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    for (const ext of exts) {
      const f = path.join(filePath, "index" + ext);
      if (fs.existsSync(f)) return f;
    }
  }
  return null;
}

exports.resolve = async function resolve(specifier, context, defaultResolve) {
  if (aliasMap.size > 0) {
    for (const [alias, info] of aliasMap.entries()) {
      if (specifier.startsWith(alias)) {
        const absPath = path.resolve(
          info.resolvedTargetBase,
          specifier.slice(alias.length)
        );
        const found = tryExtensions(absPath);
        if (found) {
          const url = pathToFileURL(found).href;

          return {
            url,
            shortCircuit: true,
          };
        }
      }
    }
  }

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const parentURL = context.parentURL || pathToFileURL(process.cwd()).href;
    const parentDir = path.dirname(fileURLToPath(parentURL));
    const absPath = path.resolve(parentDir, specifier);
    const found = tryExtensions(absPath);
    if (found) return { url: pathToFileURL(found).href, shortCircuit: true };
  }

  // Fallback to default resolver
  return defaultResolve(specifier, context, defaultResolve);
};

exports.load = async function load(url, context, defaultLoad) {
  // --- 🟢 Handle non-JS assets (png, jpg, etc.)
  const assetExts = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
    ".avif",
    ".ico",
    ".mp4",
    ".webm",
    ".ogg",
    ".mov",
    ".avi",
    ".mkv",
    ".mp3",
    ".wav",
    ".flac",
    ".m4a",
    ".aac",
    ".mjpeg",
    ".mjpg",
  ];
  const ext = path.extname(url.split("?")[0]); // remove query params if any

  if (assetExts.includes(ext)) {
    // Return a tiny stub that mimics what asset-require-hook would do
    const filepath = fileURLToPath(url);
    const localName = path.basename(filepath, ext);
    const hashedName = createScopedName(localName, filepath);
    const virtualExport = `export default "/assets/${hashedName}${ext}";`;

    return {
      format: "module",
      source: virtualExport,
      shortCircuit: true,
      url,
    };
  }

  if (ext === ".css") {
    const mod = require(fileURLToPath(url));
    const source = `export default ${JSON.stringify(mod)};`;
    return { format: "module", source, shortCircuit: true, url };
  }
  if (/\.(jsx|tsx|ts|js)$/.test(url)) {
    let filename;
    try {
      filename = fileURLToPath(
        url.startsWith("file://") ? url : pathToFileURL(url).href
      );
    } catch (e) {
      throw e;
    }
    const rel = path.relative(process.cwd(), filename);
    if (ext === ".js" && !rel.startsWith("src" + path.sep))
      return defaultLoad(url, context, defaultLoad);
    const source = fs.readFileSync(filename, "utf-8");
    if (ext === ".js") {
      return {
        format: "module",
        source,
        shortCircuit: true,
        url,
      };
    }

    const { code } = await transformAsync(source, {
      filename,
      presets: [
        ["@babel/preset-react", { runtime: "automatic" }],
        "@babel/preset-typescript",
      ],
      sourceMaps: "inline",
      ast: false,
    });

    const urlToReturn = pathToFileURL(filename).href;

    return {
      format: "module",
      source: code,
      shortCircuit: true,
      url: urlToReturn,
    };
  }

  if (url) {
    return defaultLoad(url, context, defaultLoad);
  }
};
