const tsconfigPaths = require("tsconfig-paths");
const path = require("path");
const fs = require("fs");

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
    tsconfigPaths.register({
      baseUrl: path.resolve(process.cwd(), baseUrl),
      paths,
    });
  }
}
