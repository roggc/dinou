// dinou/core/edge-ssr.js
// Native React 19 Edge SSR Streaming Engine for Dinou.
// Reconstructs React element tree from RSC stream and renders native HTML stream via react-dom/server.edge.

import React from "react";
import { createFromReadableStream } from "react-server-dom-webpack/client.edge";
import { renderToReadableStream } from "react-dom/server.edge";
import { DinouPageContext } from "./slot.js";

const HEAD_OPEN_RE = /<head(?:\s[^>]*)?>/i;
const HEAD_CLOSE_END_RE = /<\/head\s*>$/i;
const MODULE_SCRIPT_RE = /<script\b[^>]*\btype\s*=\s*(?:"module"|'module'|module(?=\s|>|\/))[^>]*>/i;
const MODULE_PRELOAD_RE = /<link\b[^>]*\brel\s*=\s*(?:"modulepreload"|'modulepreload'|modulepreload(?=\s|>|\/))[^>]*\/?>/gi;
const MAX_HEAD_BUFFER_BYTES = 262144; // 256 KB safety cap

function concatBytes(a, b) {
  if (!a || a.byteLength === 0) return b;
  if (!b || b.byteLength === 0) return a;
  const out = new Uint8Array(a.byteLength + b.byteLength);
  out.set(a, 0);
  out.set(b, a.byteLength);
  return out;
}

function isAsciiWhitespace(byte) {
  return (
    byte === 0x20 ||
    byte === 0x09 ||
    byte === 0x0a ||
    byte === 0x0d ||
    byte === 0x0c
  );
}

function findHeadCloseByteRange(bytes) {
  const len = bytes.length;
  for (let i = 0; i <= len - 7; i++) {
    if (
      bytes[i] === 0x3c && // '<'
      bytes[i + 1] === 0x2f && // '/'
      (bytes[i + 2] === 0x68 || bytes[i + 2] === 0x48) && // 'h' | 'H'
      (bytes[i + 3] === 0x65 || bytes[i + 3] === 0x45) && // 'e' | 'E'
      (bytes[i + 4] === 0x61 || bytes[i + 4] === 0x41) && // 'a' | 'A'
      (bytes[i + 5] === 0x64 || bytes[i + 5] === 0x44) // 'd' | 'D'
    ) {
      let j = i + 6;
      while (j < len && isAsciiWhitespace(bytes[j])) {
        j++;
      }
      if (j < len && bytes[j] === 0x3e) {
        return { start: i, end: j + 1 };
      }
    }
  }
  return null;
}

function hasHeadOpenTag(bytes) {
  const len = bytes.length;
  for (let i = 0; i <= len - 6; i++) {
    if (
      bytes[i] === 0x3c && // '<'
      (bytes[i + 1] === 0x68 || bytes[i + 1] === 0x48) && // 'h' | 'H'
      (bytes[i + 2] === 0x65 || bytes[i + 2] === 0x45) && // 'e' | 'E'
      (bytes[i + 3] === 0x61 || bytes[i + 3] === 0x41) && // 'a' | 'A'
      (bytes[i + 4] === 0x64 || bytes[i + 4] === 0x44) // 'd' | 'D'
    ) {
      const next = bytes[i + 5];
      if (next === 0x3e || next === 0x2f || isAsciiWhitespace(next)) {
        return true;
      }
    }
  }
  return false;
}

function findBodyOpenByteIndex(bytes) {
  const len = bytes.length;
  for (let i = 0; i <= len - 6; i++) {
    if (
      bytes[i] === 0x3c && // '<'
      (bytes[i + 1] === 0x62 || bytes[i + 1] === 0x42) && // 'b' | 'B'
      (bytes[i + 2] === 0x6f || bytes[i + 2] === 0x4f) && // 'o' | 'O'
      (bytes[i + 3] === 0x64 || bytes[i + 3] === 0x44) && // 'd' | 'D'
      (bytes[i + 4] === 0x79 || bytes[i + 4] === 0x59) // 'y' | 'Y'
    ) {
      const next = bytes[i + 5];
      if (next === 0x3e || next === 0x2f || isAsciiWhitespace(next)) {
        return i;
      }
    }
  }
  return -1;
}

function couldStartHtmlDocument(bytes) {
  let i = 0;
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    i = 3;
  }
  while (i < bytes.length && isAsciiWhitespace(bytes[i])) {
    i++;
  }
  if (i >= bytes.length) return true;
  const limit = Math.min(bytes.length, i + 10);
  let sample = "";
  for (let k = i; k < limit; k++) {
    sample += String.fromCharCode(bytes[k]).toLowerCase();
  }
  const prefixes = ["<!doctype", "<html", "<head"];
  return prefixes.some((p) => {
    if (sample.length < p.length) return p.startsWith(sample);
    if (!sample.startsWith(p)) return false;
    if (sample.length === p.length) return true;
    const next = sample[p.length];
    return (
      next === ">" ||
      next === "/" ||
      next === " " ||
      next === "\t" ||
      next === "\n" ||
      next === "\r" ||
      next === "\f"
    );
  });
}

/**
 * Injects `<script type="importmap">` inside `<head>` right after all metadata (`<title>`,
 * `<meta property="og:*">`, `<link rel="stylesheet">`, etc.) and strictly before any
 * `<link rel="modulepreload">` or `<script type="module">`, keeping `<!DOCTYPE html>` at byte 0
 * (HTML5 Standards Mode) and Open Graph / SEO meta tags within the first ~1-2 KB of the document.
 */
export function injectImportMapIntoHeadSegment(headSegment, importMapHtml) {
  const closeMatch = HEAD_CLOSE_END_RE.exec(headSegment);
  if (!closeMatch) {
    return importMapHtml + headSegment;
  }

  const beforeClose = headSegment.slice(0, closeMatch.index);
  const closeTag = closeMatch[0];

  const openMatch = HEAD_OPEN_RE.exec(beforeClose);
  const headContentStart = openMatch ? openMatch.index + openMatch[0].length : 0;
  const prefix = beforeClose.slice(0, headContentStart);
  const headInner = beforeClose.slice(headContentStart);

  const moduleScriptMatch = MODULE_SCRIPT_RE.exec(headInner);
  if (moduleScriptMatch) {
    const splitAt = moduleScriptMatch.index;
    const beforeModule = headInner.slice(0, splitAt);
    const fromModule = headInner.slice(splitAt);
    const preloads = [];
    const cleanedBeforeModule = beforeModule.replace(MODULE_PRELOAD_RE, (m) => {
      preloads.push(m);
      return "";
    });
    return prefix + cleanedBeforeModule + importMapHtml + preloads.join("") + fromModule + closeTag;
  }

  const preloads = [];
  const cleanedHeadInner = headInner.replace(MODULE_PRELOAD_RE, (m) => {
    preloads.push(m);
    return "";
  });
  return prefix + cleanedHeadInner + importMapHtml + preloads.join("") + closeTag;
}

export function createImportMapTransformStream(importMapHtml) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder("utf-8");
  const importMapBytes = encoder.encode(importMapHtml);
  let injected = false;
  let buffered = new Uint8Array(0);

  const flushFallback = (controller) => {
    if (injected) return;
    injected = true;
    const data = buffered;
    buffered = new Uint8Array(0);
    if (data.byteLength === 0) {
      controller.enqueue(importMapBytes);
      return;
    }
    const bodyIdx = findBodyOpenByteIndex(data);
    if (bodyIdx !== -1) {
      if (bodyIdx > 0) controller.enqueue(data.subarray(0, bodyIdx));
      controller.enqueue(importMapBytes);
      controller.enqueue(data.subarray(bodyIdx));
      return;
    }
    controller.enqueue(importMapBytes);
    controller.enqueue(data);
  };

  return new TransformStream({
    transform(chunk, controller) {
      const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;
      if (injected) {
        controller.enqueue(bytes);
        return;
      }

      buffered = concatBytes(buffered, bytes);

      // Standard full HTML document: inject inside <head> right before </head>
      const headClose = findHeadCloseByteRange(buffered);
      if (headClose) {
        injected = true;
        const headStr = decoder.decode(buffered.subarray(0, headClose.end));
        const transformedHead = injectImportMapIntoHeadSegment(headStr, importMapHtml);
        const tail = buffered.subarray(headClose.end);
        buffered = new Uint8Array(0);
        controller.enqueue(encoder.encode(transformedHead));
        if (tail.byteLength > 0) {
          controller.enqueue(tail);
        }
        return;
      }

      // Fragment without <html>/<head> (e.g. `no_layout` route): don't stall streaming
      if (!couldStartHtmlDocument(buffered)) {
        injected = true;
        const data = buffered;
        buffered = new Uint8Array(0);
        controller.enqueue(importMapBytes);
        controller.enqueue(data);
        return;
      }

      // Document with <body> and no <head> tag at all
      if (!hasHeadOpenTag(buffered)) {
        const bodyIdx = findBodyOpenByteIndex(buffered);
        if (bodyIdx !== -1) {
          injected = true;
          const data = buffered;
          buffered = new Uint8Array(0);
          if (bodyIdx > 0) controller.enqueue(data.subarray(0, bodyIdx));
          controller.enqueue(importMapBytes);
          controller.enqueue(data.subarray(bodyIdx));
          return;
        }
      }

      if (buffered.byteLength >= MAX_HEAD_BUFFER_BYTES) {
        flushFallback(controller);
      }
    },
    flush(controller) {
      if (!injected) {
        const headClose = findHeadCloseByteRange(buffered);
        if (headClose) {
          injected = true;
          const headStr = decoder.decode(buffered.subarray(0, headClose.end));
          const transformedHead = injectImportMapIntoHeadSegment(headStr, importMapHtml);
          const tail = buffered.subarray(headClose.end);
          buffered = new Uint8Array(0);
          controller.enqueue(encoder.encode(transformedHead));
          if (tail.byteLength > 0) {
            controller.enqueue(tail);
          }
        } else {
          flushFallback(controller);
        }
      }
    },
  });
}

/**
 * Reconstructs an RSC stream into a React element tree and streams HTML via react-dom/server.edge.
 * @param {ReadableStream} rscStream The RSC binary stream
 * @param {object} consumerManifest The client components consumer manifest ({ moduleMap, serverModuleMap, moduleLoading })
 * @param {object} options Configuration options ({ bootstrapModules, bootstrapScriptContent, onError, waitForAll, pageRscStream })
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
      effectiveManifest = { ...consumerManifest, moduleMap: proxyMap, serverModuleMap: null };
    } else if (effectiveManifest) {
      effectiveManifest = { ...effectiveManifest, serverModuleMap: null };
    }

    // 1. Reconstruct JSX element tree from RSC wire stream(s)
    let elementTree;
    if (options.pageRscStream) {
      const [layoutTree, pageTree] = await Promise.all([
        createFromReadableStream(rscStream, {
          serverConsumerManifest: effectiveManifest,
        }),
        createFromReadableStream(options.pageRscStream, {
          serverConsumerManifest: effectiveManifest,
        }),
      ]);
      const slotValue = {
        pageElement: pageTree,
        pagePromise: Promise.resolve(pageTree),
        resetKey: "ssr",
      };
      if (typeof globalThis !== "undefined") {
        globalThis.__DINOU_SSR_SLOT_CONTEXT__ = slotValue;
      }
      elementTree = DinouPageContext
        ? React.createElement(DinouPageContext.Provider, { value: slotValue }, layoutTree)
        : layoutTree;
    } else {
      if (typeof globalThis !== "undefined") {
        globalThis.__DINOU_SSR_SLOT_CONTEXT__ = null;
      }
      elementTree = await createFromReadableStream(rscStream, {
        serverConsumerManifest: effectiveManifest,
      });
    }

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

    const importMapHtml = options.importMapHtml !== undefined ? options.importMapHtml : ((typeof globalThis !== "undefined" && globalThis.__DINOU_IMPORT_MAP_HTML__) || "");
    if (importMapHtml) {
      return htmlStream.pipeThrough(createImportMapTransformStream(importMapHtml));
    }

    return htmlStream;
  } catch (err) {
    if (process.env.DINOU_DEBUG) {
      console.error("[Edge Native SSR] Fatal stream reconstruction error:", err);
    }
    throw err;
  }
}
