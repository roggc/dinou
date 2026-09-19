// dinou/adapters/cloudflare.js
// Cloudflare Workers Adapter for Dinou v7.
// Universal edge entry point with KV storage, route registry, and Web Streams.

import { handleRequest } from "../core/handler.js";
import { setStorageAdapter, CloudflareKVStorage } from "../core/storage-adapter.js";

// Ensure Edge runtime flag is set globally
if (typeof globalThis !== "undefined") {
  globalThis.__DINOU_RUNTIME__ = "edge";
}

let storageInitialized = false;

export default {
  /**
   * Cloudflare Workers fetch handler
   * @param {Request} request 
   * @param {object} env Bindings (KV, D1, Environment variables)
   * @param {object} ctx Execution context (waitUntil, passThroughOnException)
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    if (!storageInitialized && env && env.DINOU_CACHE) {
      setStorageAdapter(new CloudflareKVStorage(env.DINOU_CACHE));
      storageInitialized = true;
    }

    return handleRequest(request, {
      env,
      ctx,
      runtime: "edge",
    });
  },
};
