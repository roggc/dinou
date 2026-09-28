// dinou/core/edge-ssr.js
// Native React 19 Edge SSR Streaming Engine for Dinou.
// Reconstructs React element tree from RSC stream and renders native HTML stream via react-dom/server.edge.

import { createFromReadableStream } from "react-server-dom-webpack/client.edge";
import { renderToReadableStream } from "react-dom/server.edge";

/**
 * Reconstructs an RSC stream into a React element tree and streams HTML via react-dom/server.edge.
 * @param {ReadableStream} rscStream The RSC binary stream
 * @param {object} consumerManifest The client components consumer manifest ({ moduleMap, serverModuleMap, moduleLoading })
 * @param {object} options Configuration options ({ bootstrapModules, bootstrapScriptContent, onError, waitForAll })
 * @returns {Promise<ReadableStream>} The HTML stream
 */
export async function renderRscStreamToHtmlStream(rscStream, consumerManifest, options = {}) {
  try {
    let effectiveManifest = consumerManifest;
    if (consumerManifest && consumerManifest.moduleMap && !consumerManifest.moduleMap.__isDinouProxy) {
      const origMap = consumerManifest.moduleMap;
      const proxyMap = new Proxy(origMap, {
        get(target, prop) {
          if (typeof prop !== "string") return target[prop];
          if (prop === "__isDinouProxy") return true;
          if (prop in target) return target[prop];

          const dynamicMap = typeof globalThis !== "undefined" ? globalThis.__DINOU_DYNAMIC_SSR_MODULE_MAP__ : null;
          if (dynamicMap) {
            if (prop in dynamicMap) {
              target[prop] = dynamicMap[prop];
              return dynamicMap[prop];
            }
            const altProp = prop.startsWith("/") ? prop.slice(1) : "/" + prop;
            if (altProp in dynamicMap) {
              target[prop] = dynamicMap[altProp];
              return dynamicMap[altProp];
            }
          }

          const clientManifest = typeof globalThis !== "undefined" ? (globalThis.__DINOU_CLIENT_MANIFEST__ || globalThis.__DINOU_RAW_CLIENT_MANIFEST__) : null;
          if (clientManifest) {
            const cleanProp = prop.startsWith("/") ? prop.slice(1) : prop;
            for (const [k, v] of Object.entries(clientManifest)) {
              if (!v?.id) continue;
              const cleanVId = v.id.startsWith("/") ? v.id.slice(1) : v.id;
              if (v.id === prop || cleanVId === cleanProp || ("/" + cleanVId) === prop) {
                const fileUrl = k.split("#")[0];
                const entry = { "*": { id: fileUrl, chunks: [], name: "*" } };
                target[prop] = entry;
                return entry;
              }
            }
          }

          if (prop.startsWith("file://")) {
            const canonicalProp = prop.startsWith("file:///") ? prop : "file:///" + prop.slice(7);
            const entry = { "*": { id: canonicalProp, chunks: [], name: "*" } };
            target[prop] = entry;
            return entry;
          }

          return target[prop];
        },
        has(target, prop) {
          if (prop === "__isDinouProxy") return true;
          if (prop in target) return true;
          const dynamicMap = typeof globalThis !== "undefined" ? globalThis.__DINOU_DYNAMIC_SSR_MODULE_MAP__ : null;
          if (dynamicMap && (prop in dynamicMap || (prop.startsWith("/") ? prop.slice(1) : "/" + prop) in dynamicMap)) return true;
          return false;
        }
      });
      effectiveManifest = { ...consumerManifest, moduleMap: proxyMap };
    }

    // 1. Reconstruct JSX element tree from RSC wire stream
    const elementTree = await createFromReadableStream(rscStream, {
      serverConsumerManifest: effectiveManifest,
    });

    // 2. Stream HTML using React 19's native Edge renderer
    const htmlStream = await renderToReadableStream(elementTree, {
      bootstrapModules: options.bootstrapModules || ["/main.js"],
      bootstrapScriptContent: options.bootstrapScriptContent,
      onError(error) {
        if (options.onError) {
          options.onError(error);
        } else {
          console.error("[Edge Native SSR] Render error:", error);
        }
      },
    });

    if (options.waitForAll) {
      await htmlStream.allReady;
    }

    const importMapHtml = options.importMapHtml || (typeof globalThis !== "undefined" && globalThis.__DINOU_IMPORT_MAP_HTML__) || "";
    if (importMapHtml) {
      const encoder = new TextEncoder();
      const importMapBytes = encoder.encode(importMapHtml);
      let injected = false;
      const transform = new TransformStream({
        transform(chunk, controller) {
          if (!injected) {
            injected = true;
            controller.enqueue(importMapBytes);
          }
          controller.enqueue(chunk);
        },
      });
      return htmlStream.pipeThrough(transform);
    }

    return htmlStream;
  } catch (err) {
    if (process.env.DINOU_DEBUG) {
      console.error("[Edge Native SSR] Fatal stream reconstruction error:", err);
    }
    throw err;
  }
}
