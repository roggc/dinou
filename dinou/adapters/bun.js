// dinou/adapters/bun.js
// Native Bun Adapter for Dinou v7 (Pre-bundled AOT).
// Serves the standalone pre-bundled server from .dinou/bun/server.js.

import * as path from "node:path";
import * as fs from "node:fs";
import { pathToFileURL } from "node:url";

const cwd = typeof process !== "undefined" && typeof process.cwd === "function" ? process.cwd() : ".";
const bundlePath = path.resolve(cwd, ".dinou/bun/server.js");

let bundleModule = null;
if (fs.existsSync(bundlePath)) {
  try {
    bundleModule = await import(pathToFileURL(bundlePath).href);
  } catch (e) {
    console.error("[Dinou Bun Adapter] Failed to load .dinou/bun/server.js:", e);
  }
}

const PORT = Number(process.env.PORT || 3000);
const IDLE_TIMEOUT = Number(process.env.IDLE_TIMEOUT || 120);

export async function fetch(req) {
  if (bundleModule && typeof bundleModule.fetch === "function") {
    return bundleModule.fetch(req);
  }
  if (bundleModule && bundleModule.default && typeof bundleModule.default.fetch === "function") {
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

export default {
  port: PORT,
  fetch,
  idleTimeout: IDLE_TIMEOUT,
};
