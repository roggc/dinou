// dinou/register-loader.mjs
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Resuelve el loader dentro del propio paquete dinou
const loaderPath = require.resolve("./babel-esm-loader.js");

// Registra el loader ESM
register(pathToFileURL(loaderPath).href, pathToFileURL("./"));
