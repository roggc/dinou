// dinou/adapters/deno.js
// Native Deno & Deno Deploy Adapter for Dinou v7.
// Supports standalone containers, Deno CLI, and Deno Deploy Edge.

import * as path from "node:path";
import * as fs from "node:fs";
import { pathToFileURL } from "node:url";

const cwd = typeof Deno !== "undefined" ? Deno.cwd() : process.cwd();
const mainBundlePath = path.resolve(cwd, ".dinou/deno/main.js");

let mainModule = null;
if (fs.existsSync(mainBundlePath)) {
  try {
    mainModule = await import(pathToFileURL(mainBundlePath).href);
  } catch (e) {
    console.error("[Dinou Deno Adapter] Failed to load .dinou/deno/main.js:", e);
  }
}

const PORT = Number(
  (typeof Deno !== "undefined" ? Deno.env.get("PORT") : process.env.PORT) || 3000
);

export async function fetch(req) {
  if (mainModule && typeof mainModule.fetch === "function") {
    return mainModule.fetch(req);
  }
  return new Response("Dinou bundle not found. Please run 'npm run build:deno' first.", {
    status: 500,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

// Start standalone server if run directly in Deno
if (typeof Deno !== "undefined" && typeof Deno.serve === "function" && import.meta.main) {
  Deno.serve({ port: PORT }, fetch);
}

export default {
  port: PORT,
  fetch,
};
