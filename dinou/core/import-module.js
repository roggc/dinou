const { pathToFileURL } = require("url");
const path = require("path");
const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";

async function importModule(modulePath) {
  const absPath = path.isAbsolute(modulePath)
    ? modulePath
    : path.resolve(process.cwd(), modulePath);

  if (!isWebpack) {
    let fileUrl = pathToFileURL(absPath).href;
    if (process.env.NODE_ENV !== "production") {
      fileUrl += `?t=${Date.now()}`;
    }
    const mod = await import(fileUrl);
    return mod;
  }

  try {
    if (process.env.NODE_ENV !== "production") {
      try {
        const resolved = require.resolve(absPath);
        delete require.cache[resolved];
      } catch (e) {}
    }
    return require(absPath);
  } catch (err) {
    if (
      err.code === "ERR_REQUIRE_ESM" ||
      /require\(\) of ES Module/.test(err.message)
    ) {
      let fileUrl = pathToFileURL(absPath).href;
      if (process.env.NODE_ENV !== "production") {
        fileUrl += `?t=${Date.now()}`;
      }
      const mod = await import(fileUrl);
      return mod;
    }
    throw err;
  }
}

module.exports = importModule;
