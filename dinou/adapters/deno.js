// dinou/adapters/deno.js
// Native Deno & Deno Deploy Adapter for Dinou (Pre-bundled AOT).
// Supports standalone containers, Deno CLI, and Deno Deploy Edge.

import * as path from "node:path";
import * as fs from "node:fs";
import { pathToFileURL } from "node:url";
import { AsyncLocalStorage } from "node:async_hooks";
import { loadEnvFiles } from "../core/env.js";

if (
  typeof globalThis.AsyncLocalStorage === "undefined" &&
  typeof AsyncLocalStorage !== "undefined"
) {
  globalThis.AsyncLocalStorage = AsyncLocalStorage;
}

const isMain = Boolean(typeof import.meta !== "undefined" && import.meta.main);
const cwd = typeof Deno !== "undefined" ? Deno.cwd() : process.cwd();
try {
  loadEnvFiles(cwd, { mode: "production" });
} catch (e) {}
const mainBundlePath = path.resolve(cwd, ".dinou/deno/main.js");

let mainModule = null;
if (fs.existsSync(mainBundlePath)) {
  try {
    mainModule = await import(pathToFileURL(mainBundlePath).href);
  } catch (e) {
    console.error("[Dinou Deno Adapter] Failed to load .dinou/deno/main.js:", e);
    if (isMain) {
      if (typeof Deno !== "undefined" && typeof Deno.exit === "function") {
        Deno.exit(1);
      } else if (typeof process !== "undefined") {
        process.exit(1);
      }
    }
  }
} else if (isMain) {
  console.error(
    "❌ [Dinou Deno Adapter] .dinou/deno/main.js not found. Please run 'npm run build:deno' first."
  );
  if (typeof Deno !== "undefined" && typeof Deno.exit === "function") {
    Deno.exit(1);
  } else if (typeof process !== "undefined") {
    process.exit(1);
  }
}

const PORT = Number(
  (typeof Deno !== "undefined" ? Deno.env.get("PORT") : process.env.PORT) || 3000
);
const HOST =
  (typeof Deno !== "undefined" ? Deno.env.get("HOST") : process.env.HOST) ||
  undefined;

export async function fetch(req) {
  if (mainModule && typeof mainModule.fetch === "function") {
    return mainModule.fetch(req);
  }
  if (
    mainModule &&
    mainModule.default &&
    typeof mainModule.default.fetch === "function"
  ) {
    return mainModule.default.fetch(req);
  }
  return new Response(
    "Dinou bundle not found. Please run 'npm run build:deno' first.",
    {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    }
  );
}

// Start standalone server if run directly in Deno
if (typeof Deno !== "undefined" && typeof Deno.serve === "function" && isMain) {
  Deno.serve(HOST ? { port: PORT, hostname: HOST } : { port: PORT }, fetch);
}

export default {
  port: PORT,
  ...(HOST ? { hostname: HOST } : {}),
  fetch,
};
