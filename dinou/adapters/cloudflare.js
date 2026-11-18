// dinou/adapters/cloudflare.js
// Cloudflare Workers Adapter for Dinou (AOT Dual-Bundle & Edge Fallback).
// Delegates to the pre-bundled .dinou/cloudflare/worker.js orchestrator when present,
// and preserves custom storage adapters + registered SSR renderers in direct edge usage.

import * as path from "node:path";
import * as fs from "node:fs";
import { pathToFileURL } from "node:url";
import { handleRequest } from "../core/handler.js";
import {
  setStorageAdapter,
  hasExplicitStorageAdapter,
  CloudflareKVStorage,
  MemoryStorage,
} from "../core/storage-adapter.js";
import {
  getStaticContentType,
  isPublicStaticAssetRequest,
  isReservedCloudflareDist2RequestPath,
} from "../core/static-assets.js";

if (typeof globalThis !== "undefined") {
  globalThis.__DINOU_RUNTIME__ = "edge";
}

const workerCacheByPath = new Map();

async function getPrebuiltCloudflareWorker() {
  try {
    if (
      typeof process === "undefined" ||
      typeof process.cwd !== "function" ||
      typeof fs.existsSync !== "function"
    ) {
      return null;
    }
    const workerPath = path.resolve(process.cwd(), ".dinou/cloudflare/worker.js");
    if (!fs.existsSync(workerPath)) {
      return null;
    }
    let mtimeMs = 0;
    try {
      mtimeMs = fs.statSync(workerPath).mtimeMs;
    } catch (e) {}
    const cached = workerCacheByPath.get(workerPath);
    if (cached && cached.mtimeMs === mtimeMs) {
      return cached.promise;
    }
    const promise = import(pathToFileURL(workerPath).href).catch((err) => {
      workerCacheByPath.delete(workerPath);
      console.error("[Dinou Cloudflare Adapter] Failed to load .dinou/cloudflare/worker.js:", err);
      return null;
    });
    workerCacheByPath.set(workerPath, { mtimeMs, promise });
    return promise;
  } catch (e) {
    return null;
  }
}

let storageInitialized = false;

export default {
  /**
   * Cloudflare Workers fetch handler
   * @param {Request} request
   * @param {object} env Bindings (KV, D1, ASSETS, Environment variables)
   * @param {object} ctx Execution context (waitUntil, passThroughOnException)
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    const prebuilt = await getPrebuiltCloudflareWorker();
    const prebuiltFetch =
      prebuilt?.default && typeof prebuilt.default.fetch === "function"
        ? prebuilt.default.fetch
        : typeof prebuilt?.fetch === "function"
          ? prebuilt.fetch
          : null;
    if (prebuiltFetch) {
      return prebuiltFetch(request, env, ctx);
    }

    const url = new URL(request.url);
    if (
      url.pathname.startsWith("/cdn-cgi/") ||
      isReservedCloudflareDist2RequestPath(url.pathname)
    ) {
      return new Response(null, { status: 404 });
    }

    if (!storageInitialized) {
      if (!hasExplicitStorageAdapter()) {
        if (env && env.DINOU_CACHE) {
          setStorageAdapter(new CloudflareKVStorage(env.DINOU_CACHE));
        } else {
          setStorageAdapter(new MemoryStorage());
        }
      }
      storageInitialized = true;
    }

    const isRSCPayload = url.pathname.includes("____rsc_");
    const isServerFunction =
      url.pathname.includes("____server_function____") ||
      request.headers.get("x-server-function-call") === "1";

    const isStaticAsset = isPublicStaticAssetRequest(url.pathname);

    if (
      !isRSCPayload &&
      !isServerFunction &&
      isStaticAsset &&
      env &&
      env.ASSETS &&
      (request.method === "GET" || request.method === "HEAD")
    ) {
      try {
        const assetRes = await env.ASSETS.fetch(
          request.clone ? request.clone() : request
        );
        if (assetRes && assetRes.status < 400) {
          const rawCt = (assetRes.headers.get("content-type") || "").trim();
          const lowerCt = rawCt.toLowerCase();
          const expectedCt = getStaticContentType(url.pathname);
          const needsContentTypeFix =
            !rawCt ||
            (lowerCt === "application/octet-stream" &&
              expectedCt !== "application/octet-stream") ||
            (url.pathname.toLowerCase().endsWith("/apple-app-site-association") &&
              !lowerCt.includes("json"));
          if (needsContentTypeFix) {
            const headers = new Headers(assetRes.headers);
            headers.set("content-type", expectedCt);
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

    const registeredSsr =
      typeof globalThis !== "undefined" &&
      typeof globalThis.__DINOU_RENDER_HTML_STREAM__ === "function"
        ? globalThis.__DINOU_RENDER_HTML_STREAM__
        : undefined;

    return handleRequest(request, {
      env,
      ctx,
      runtime: "edge",
      ...(registeredSsr ? { renderHtmlStream: registeredSsr } : {}),
    });
  },
};
