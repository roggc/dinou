// dinou/adapters/bun.js
// Native Bun Adapter for Dinou (Pre-bundled AOT).
// Serves the standalone pre-bundled server from .dinou/bun/server.js.

import * as path from "node:path";
import * as fs from "node:fs";
import { pathToFileURL } from "node:url";
import { AsyncLocalStorage } from "node:async_hooks";
import { loadEnvFiles } from "../core/env.js";

const cwd =
  typeof process !== "undefined" && typeof process.cwd === "function"
    ? process.cwd()
    : ".";
loadEnvFiles(cwd, { mode: "production" });

if (
  typeof globalThis.AsyncLocalStorage === "undefined" &&
  typeof AsyncLocalStorage !== "undefined"
) {
  globalThis.AsyncLocalStorage = AsyncLocalStorage;
}

const isMain = Boolean(typeof import.meta !== "undefined" && import.meta.main);
const bundlePath = path.resolve(cwd, ".dinou/bun/server.js");

let bundleModule = null;
if (fs.existsSync(bundlePath)) {
  try {
    bundleModule = await import(pathToFileURL(bundlePath).href);
  } catch (e) {
    console.error("[Dinou Bun Adapter] Failed to load .dinou/bun/server.js:", e);
    if (isMain) {
      process.exit(1);
    }
  }
} else if (isMain) {
  console.error(
    "❌ [Dinou Bun Adapter] .dinou/bun/server.js not found. Please run 'npm run build:bun' first."
  );
  process.exit(1);
}

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || undefined;
const IDLE_TIMEOUT = Number(process.env.IDLE_TIMEOUT || 120);

export async function fetch(req) {
  if (bundleModule && typeof bundleModule.fetch === "function") {
    return bundleModule.fetch(req);
  }
  if (
    bundleModule &&
    bundleModule.default &&
    typeof bundleModule.default.fetch === "function"
  ) {
    return bundleModule.default.fetch(req);
  }
  return new Response(
    "Dinou Bun bundle not found. Please run 'npm run build:bun' first.",
    {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    }
  );
}

if (isMain && bundleModule) {
  console.log(
    `🚀 Dinou (Bun AOT Dual-Bundle) server running on http://${HOST || "localhost"}:${PORT}`
  );
}

export default {
  port: PORT,
  ...(HOST ? { hostname: HOST } : {}),
  fetch,
  idleTimeout: IDLE_TIMEOUT,
};

if (typeof process !== "undefined") {
  process.on("SIGTERM", () => process.exit(0));
  process.on("SIGINT", () => process.exit(0));
  if (process.stdin && typeof process.stdin.on === "function") {
    process.stdin.on("end", () => process.exit(0));
    process.stdin.on("close", () => process.exit(0));
    if (typeof process.stdin.unref === "function") {
      process.stdin.unref();
    }
  }
}
