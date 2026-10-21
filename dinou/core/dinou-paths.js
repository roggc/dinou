import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const currentDir = path.dirname(fileURLToPath(import.meta.url));

export function getDinouCoreDir() {
  // Edge runtime guard: en Cloudflare Workers / Deno Edge no hay sistema de archivos dinámico
  if (typeof process !== "undefined" && process.env && process.env.DINOU_RUNTIME === "edge") {
    return "/dinou/core";
  }

  // 1. Modo eyectado: ./dinou/core en la raíz del proyecto
  try {
    const cwd = typeof process !== "undefined" && process.cwd ? process.cwd() : "";
    const localCore = path.resolve(cwd, "dinou/core");
    if (fs.existsSync && fs.existsSync(localCore)) return localCore;
  } catch (e) {}

  // 2. Modo librería sin empaquetar: dinou-paths.js ya está en dinou/core
  try {
    if (fs.existsSync && fs.existsSync(path.join(currentDir, "handler.js"))) {
      return currentDir;
    }
  } catch (e) {}

  // 3. Resolución estándar de Node
  try {
    const serverPath = require.resolve("dinou/server");
    const resolvedCore = path.join(path.dirname(serverPath), "core");
    if (fs.existsSync && fs.existsSync(resolvedCore)) return resolvedCore;
  } catch (e) { }

  // 4. Modo bundle de Webpack (ej. corriendo desde .dinou/dist3/server/handler.js)
  // La estructura del paquete instalado es node_modules/dinou/dinou/core
  try {
    const cwd = typeof process !== "undefined" && process.cwd ? process.cwd() : "";
    const nodeModulesDinouCore = path.resolve(cwd, "node_modules/dinou/dinou/core");
    if (fs.existsSync && fs.existsSync(nodeModulesDinouCore)) return nodeModulesDinouCore;

    // 5. Fallback por si la estructura fuese plana
    return path.resolve(cwd, "node_modules/dinou/core");
  } catch (e) {}

  return "/dinou/core";
}

export const dinouCoreDir = getDinouCoreDir();

export default {
  dinouCoreDir,
  getDinouCoreDir,
};
