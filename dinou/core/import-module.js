const { pathToFileURL } = require("url");
const path = require("path");
const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";

async function importModule(modulePath) {
  const absPath = path.isAbsolute(modulePath)
    ? modulePath
    : path.resolve(process.cwd(), modulePath);

  if (!isWebpack) {
    const fileUrl = pathToFileURL(absPath).href;
    const mod = await import(fileUrl);
    return mod;
  }

  try {
    return require(absPath);
  } catch (err) {
    if (
      err.code === "ERR_REQUIRE_ESM" ||
      /require\(\) of ES Module/.test(err.message)
    ) {
      const fileUrl = pathToFileURL(absPath).href;
      const mod = await import(fileUrl);
      return mod;
    }
    throw err;
  }
}

module.exports = importModule;
