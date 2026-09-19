// dinou/adapters/deno.js
// Native Deno & Deno Deploy Adapter for Dinou v7.
// Supports standalone containers, Deno CLI, and Deno Deploy Edge.

import * as path from "node:path";
import * as fs from "node:fs";
import { pathToFileURL } from "node:url";
import { handleRequest } from "../core/handler.js";
import { setStorageAdapter, DenoKVStorage } from "../core/storage-adapter.js";

// Ensure global runtime flag
if (typeof globalThis !== "undefined") {
  globalThis.__DINOU_RUNTIME__ = "deno";
}

// 1. Auto-configure Deno KV Storage in Edge / Deploy environments if available
if (typeof Deno !== "undefined" && typeof Deno.openKv === "function") {
  try {
    const isDeploy = Boolean(Deno.env.get("DENO_DEPLOYMENT_ID") || Deno.env.get("DINOU_USE_KV"));
    if (isDeploy) {
      setStorageAdapter(new DenoKVStorage());
      console.log("[Dinou Deno] Initialized DenoKVStorage for ISR cache.");
    }
  } catch (e) {
    // Permission or environment guard
  }
}

// 2. Load in-memory route modules if generated
try {
  const cwd = typeof Deno !== "undefined" ? Deno.cwd() : process.cwd();
  const routeModulesPath = path.resolve(cwd, ".dinou/route-modules.js");
  if (fs.existsSync(routeModulesPath)) {
    await import(pathToFileURL(routeModulesPath).href);
  }
} catch (e) {
  // Ignore in edge bundles where routes are already inlined
}

const PORT = Number(
  (typeof Deno !== "undefined" ? Deno.env.get("PORT") : process.env.PORT) || 3000
);

const cwd = typeof Deno !== "undefined" ? Deno.cwd() : process.cwd();
const dist3Dir = path.resolve(cwd, ".dinou/dist3");

export async function fetch(req) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Static assets delivery (if running with disk access)
  if (pathname !== "/" && typeof Deno !== "undefined" && typeof Deno.readFile === "function") {
    try {
      const filePath = path.join(dist3Dir, pathname);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const content = await Deno.readFile(filePath);
        // Content-type header detection
        const ext = path.extname(filePath).toLowerCase();
        const headers = {};
        if (ext === ".js" || ext === ".mjs") headers["content-type"] = "application/javascript; charset=utf-8";
        else if (ext === ".css") headers["content-type"] = "text/css; charset=utf-8";
        else if (ext === ".json") headers["content-type"] = "application/json";
        else if (ext === ".svg") headers["content-type"] = "image/svg+xml";
        else if (ext === ".png") headers["content-type"] = "image/png";
        else if (ext === ".ico") headers["content-type"] = "image/x-icon";
        return new Response(content, { headers });
      }
    } catch (e) {
      // Fallback to Dinou handler
    }
  }

  // Dinou Universal Handler
  return handleRequest(req, { runtime: "deno" });
}

// Start standalone server if run directly in Deno
if (typeof Deno !== "undefined" && typeof Deno.serve === "function" && import.meta.main) {
  Deno.serve({ port: PORT }, fetch);
}

export default {
  port: PORT,
  fetch,
};
