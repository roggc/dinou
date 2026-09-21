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
    // 1. Reconstruct JSX element tree from RSC wire stream
    const elementTree = await createFromReadableStream(rscStream, {
      serverConsumerManifest: consumerManifest,
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
    console.error("[Edge Native SSR] Fatal stream reconstruction error:", err);
    throw err;
  }
}
