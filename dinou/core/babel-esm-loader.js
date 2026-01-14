const fs = require("fs");
const path = require("path");
const { transformAsync } = require("@babel/core");
const { fileURLToPath, pathToFileURL } = require("url");
const createScopedName = require("./createScopedName");
const { extensionsWithDot } = require("./asset-extensions.js");
const { getAbsPathWithExt } = require("./get-abs-path-with-ext.js");

require("css-modules-require-hook")({
  generateScopedName: createScopedName,
  extensions: [".css"],
});

exports.resolve = async function resolve(specifier, context, defaultResolve) {
  const absPathWithExt = getAbsPathWithExt(specifier, context);
  if (absPathWithExt) {
    const url = pathToFileURL(absPathWithExt).href;

    return {
      url,
      shortCircuit: true,
    };
  }

  // Fallback to default resolver
  return defaultResolve(specifier, context, defaultResolve);
};

exports.load = async function load(url, context, defaultLoad) {
  // --- 🟢 Handle non-JS assets (png, jpg, etc.)
  const assetExts = extensionsWithDot;
  const ext = path.extname(url.split("?")[0]); // remove search params if any

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
