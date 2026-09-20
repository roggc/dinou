const path = require("path");
const fs = require("fs");

function getDinouCoreDir() {
  // 1. Modo eyectado: ./dinou/core en la raíz del proyecto
  const localCore = path.resolve(process.cwd(), "dinou/core");
  if (fs.existsSync(localCore)) return localCore;

  // 2. Modo librería sin empaquetar: dinou-paths.js ya está en dinou/core
  if (fs.existsSync(path.join(__dirname, "register-loader.mjs"))) {
    return __dirname;
  }

  // 3. Resolución estándar de Node
  try {
    const serverPath = require.resolve("dinou/server");
    const resolvedCore = path.join(path.dirname(serverPath), "core");
    if (fs.existsSync(resolvedCore)) return resolvedCore;
  } catch (e) { }

  // 4. Modo bundle de Webpack (ej. corriendo desde .dinou/dist3/server/handler.js)
  // La estructura del paquete instalado es node_modules/dinou/dinou/core
  const nodeModulesDinouCore = path.resolve(process.cwd(), "node_modules/dinou/dinou/core");
  if (fs.existsSync(nodeModulesDinouCore)) return nodeModulesDinouCore;

  // 5. Fallback por si la estructura fuese plana
  return path.resolve(process.cwd(), "node_modules/dinou/core");
}

const dinouCoreDir = getDinouCoreDir();

module.exports = {
  dinouCoreDir,
  getDinouCoreDir,
};
