const { pathToFileURL } = require("url");
const path = require("path");

async function importModule(modulePath) {
  try {
    return require(modulePath);
  } catch (err) {
    if (
      err.code === "ERR_REQUIRE_ESM" ||
      /require\(\) of ES Module/.test(err.message)
    ) {
      const absPath = path.isAbsolute(modulePath)
        ? modulePath
        : path.resolve(process.cwd(), modulePath);

      const fileUrl = pathToFileURL(absPath).href;
      const mod = await import(fileUrl);
      return mod;
    }
    throw err;
  }
}

module.exports = importModule;
