// dinou/register-loader.mjs
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
globalThis.__dinou_require__ = require;
try {
  const { AsyncLocalStorage } = require("node:async_hooks");
  if (typeof globalThis.AsyncLocalStorage === "undefined") {
    globalThis.AsyncLocalStorage = AsyncLocalStorage;
  }
} catch (e) {}

const loaderPath = require.resolve("./babel-esm-loader.js");

register(pathToFileURL(loaderPath).href, pathToFileURL("./"));
