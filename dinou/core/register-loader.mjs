// dinou/register-loader.mjs
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const loaderPath = require.resolve("./babel-esm-loader.js");

register(pathToFileURL(loaderPath).href, pathToFileURL("./"));
