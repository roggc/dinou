const path = require("path");
const fs = require("fs");

function getDinouCoreDir() {
  const localCore = path.resolve(process.cwd(), "dinou/core");
  if (fs.existsSync(localCore)) return localCore;
  try {
    const serverPath = require.resolve("dinou/server");
    const resolvedCore = path.join(path.dirname(serverPath), "core");
    if (fs.existsSync(resolvedCore)) return resolvedCore;
  } catch (e) {}
  return path.resolve(process.cwd(), "node_modules/dinou/core");
}

const dinouCoreDir = getDinouCoreDir();

module.exports = {
  dinouCoreDir,
  getDinouCoreDir,
};
