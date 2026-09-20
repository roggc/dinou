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
    const url = new URL(request.url);
    if (url.pathname.startsWith("/cdn-cgi/")) {
      return new Response(null, { status: 404 });
    }

    if (!storageInitialized && env && env.DINOU_CACHE) {
      setStorageAdapter(new CloudflareKVStorage(env.DINOU_CACHE));
      storageInitialized = true;
    }

    const isRSCPayload = url.pathname.includes("____rsc_payload");
    const isServerFunction = url.pathname.includes("____server_function____") || request.headers.get("x-server-function-call") === "1";

    if (isRSCPayload && env && env.ASSETS) {
      const cleanPath = url.pathname
        .replace("/____rsc_payload_old_static____", "")
        .replace("/____rsc_payload_old____", "")
        .replace("/____rsc_payload_static____", "")
        .replace("/____rsc_payload____", "")
        .replace(/^\/+/, "")
        .replace(/\/+$/, "");
      const rscAssetPath = cleanPath ? `/${cleanPath}/rsc.rsc` : "/rsc.rsc";
      const assetUrl = new URL(rscAssetPath, request.url);
      try {
        const rscRes = await env.ASSETS.fetch(new Request(assetUrl, request));
        if (rscRes && rscRes.status === 200) {
          const headers = new Headers(rscRes.headers);
          headers.set("Content-Type", "text/x-component");
          return new Response(rscRes.body, {
            status: 200,
            headers,
          });
        }
      } catch (e) {}
    }

    if (!isRSCPayload && !isServerFunction && env && env.ASSETS && (request.method === "GET" || request.method === "HEAD")) {
      try {
        const assetRes = await env.ASSETS.fetch(request.clone ? request.clone() : request);
        if (assetRes && assetRes.status < 400) {
          return assetRes;
        }
      } catch (e) {}
    }

    return handleRequest(request, {
      env,
      ctx,
      runtime: "edge",
    });
  },
};
