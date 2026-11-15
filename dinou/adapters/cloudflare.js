// dinou/adapters/cloudflare.js
// Cloudflare Workers Adapter for Dinou v7.
// Universal edge entry point with KV storage, route registry, and Web Streams.

import { handleRequest } from "../core/handler.js";
import {
  getStorageAdapter,
  setStorageAdapter,
  CloudflareKVStorage,
  MemoryStorage,
} from "../core/storage-adapter.js";
import {
  getStaticContentType,
  isPublicStaticAssetRequest,
  isReservedCloudflareDist2RequestPath,
} from "../core/static-assets.js";

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
    if (
      url.pathname.startsWith("/cdn-cgi/") ||
      isReservedCloudflareDist2RequestPath(url.pathname)
    ) {
      return new Response(null, { status: 404 });
    }

    if (!storageInitialized) {
      if (env && env.DINOU_CACHE) {
        setStorageAdapter(new CloudflareKVStorage(env.DINOU_CACHE));
      } else {
        setStorageAdapter(new MemoryStorage());
      }
      storageInitialized = true;
    }

    const isRSCPayload = url.pathname.includes("____rsc_");
    const isServerFunction = url.pathname.includes("____server_function____") || request.headers.get("x-server-function-call") === "1";

    // Static assets: public/ files, /assets/*, /.well-known/*, and client bundles
    const isStaticAsset = isPublicStaticAssetRequest(url.pathname);

    if (!isRSCPayload && !isServerFunction && isStaticAsset && env && env.ASSETS && (request.method === "GET" || request.method === "HEAD")) {
      try {
        const assetRes = await env.ASSETS.fetch(request.clone ? request.clone() : request);
        if (assetRes && assetRes.status < 400) {
          if (
            url.pathname.toLowerCase().endsWith("/apple-app-site-association") &&
            !(assetRes.headers.get("content-type") || "").toLowerCase().includes("json")
          ) {
            const headers = new Headers(assetRes.headers);
            headers.set("content-type", getStaticContentType(url.pathname));
            return new Response(assetRes.body, {
              status: assetRes.status,
              statusText: assetRes.statusText,
              headers,
            });
          }
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
