// dinou/core/handler.js
// Universal Web Standards Request Handler for Dinou.
// Implements (Request) => Promise<Response> independently of Express.

import path from "node:path";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PassThrough, Readable } from "node:stream";

const FormData = globalThis.FormData;
const Blob = globalThis.Blob;

const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";
const isDevelopment =
  process.env.DINOU_DEV === "true" ||
  (typeof globalThis !== "undefined" && Boolean(globalThis.__DINOU_DEV__)) ||
  process.env.NODE_ENV !== "production";
const outputFolder = isDevelopment ? ".dinou/public" : ".dinou/dist3";

import { normalizePathCase } from "./path-utils.js";
import { resolveRelativeUrl } from "./url-resolver.js";
import {
  getFilePathAndDynamicParams,
  getLayoutsForLayoutKey,
} from "./get-file-path-and-dynamic-params.js";
import getJSX, { createDinouPageSlotElement } from "./get-jsx.js";
import { getErrorJSX } from "./get-error-jsx.js";
import importModule from "./import-module.js";
import { resolveLayoutFunctionsConfig, getActiveLayoutChain, resolveLayoutChainPpr } from "./layout-functions.js";
import { revalidating, regenerating, inFlightGenerations } from "./revalidating.js";
import { generatingISG } from "./generating-isg.js";
import {
  requestStorage,
  setCurrentContext,
  copyCustomContextProperties,
} from "./request-context.js";
import {
  createUnifiedEnv,
  syncEdgeEnvToProcessEnv,
  isBotEnvProbePath,
} from "./runtime-env.js";
import { getStatus } from "./status-manifest.js";
import { discoverLayoutsFromFileRelPaths, discoverLayoutsFromFs } from "./discover-layouts.js";

import {
  isManifestReady,
  getClientManifest,
  getServerFunctionsManifest,
} from "./manifest-provider.js";
import { pipeRSC, renderRSCStream, isEdgeRuntime } from "./rsc-renderer.js";
import {
  getStorageAdapter,
  setStorageAdapter,
  readDist2Fallback,
} from "./storage-adapter.js";
import { createBailoutProxy } from "./bailout-proxy.js";
import getAssetFromManifest from "./get-asset-from-manifest.js";
import {
  fetchCloudflareDist2Asset,
  isReservedCloudflareDist2RequestPath,
} from "./static-assets.js";
import {
  handlePprResume,
  spliceDynamicHolesIntoShell,
  readShellJsonFromStorage,
} from "./ppr-runtime.js";
import { resolveModulePpr } from "./resolve-module-ppr.js";
import { getDinouConfig as loadDinouConfig } from "./load-dinou-config.js";
import {
  getSlotJSX,
  serializeJSX,
  deserializeJSX,
  refreshNestedSlotsInTree,
  hasExpiredSlots,
  inspectSlotsFreshness,
} from "./cache-slot.js";
import {
  runWithPprContext,
  getRegisteredHoles,
  resetPprHoles,
  getPprHoleCounter,
  runInPageSegment,
  runInLayoutSegment,
  isSlotDiscoveryActive,
} from "./ppr-context.js";
import {
  asyncRenderJSXToClientJSX,
  replaceLayoutChildrenPlaceholder,
} from "./render-jsx-to-client-jsx.js";
import {
  renderSingleLayoutLevel,
  spliceSingleLayoutOwnHoles,
  composeLayoutChainFromOwnFragments,
  hydrateActiveChainPpr,
  readStorageArtifact,
} from "./layout-composition.js";

// Load Dinou configuration and plugins
let dinouConfig = { plugins: [] };
let dinouConfigPromise = null;
const AUTO_LOADED_PROD_CONFIG = Symbol.for("dinou.autoLoadedProdConfig");

async function getDinouConfig() {
  const isSsgBuild =
    typeof globalThis !== "undefined" && Boolean(globalThis.__DINOU_IS_SSG_BUILD__);
  const isActiveDevServer =
    process.env.DINOU_DEV === "true" ||
    (typeof globalThis !== "undefined" && Boolean(globalThis.__DINOU_DEV__));
  const aotOrProdCached =
    typeof globalThis !== "undefined"
      ? globalThis.__DINOU_AOT_CONFIG__ ||
        (globalThis.__DINOU_CONFIG__ &&
        !isActiveDevServer &&
        (!isDevelopment || !globalThis.__DINOU_CONFIG__[AUTO_LOADED_PROD_CONFIG])
          ? globalThis.__DINOU_CONFIG__
          : null)
      : null;
  if (aotOrProdCached) {
    if (!isSsgBuild && aotOrProdCached.storage) {
      setStorageAdapter(aotOrProdCached.storage);
    }
    dinouConfig = aotOrProdCached;
    return aotOrProdCached;
  }
  if (!dinouConfigPromise || isDevelopment) {
    dinouConfigPromise = loadDinouConfig();
  }
  const cfg = await dinouConfigPromise;
  if (!isSsgBuild && cfg && cfg.storage) {
    setStorageAdapter(cfg.storage);
  }
  dinouConfig = cfg;
  return cfg;
}

// Initial sync load attempt for immediate storage adapter setup
if (
  typeof globalThis !== "undefined" &&
  (globalThis.__DINOU_AOT_CONFIG__ || globalThis.__DINOU_CONFIG__)
) {
  const cfg = globalThis.__DINOU_AOT_CONFIG__ || globalThis.__DINOU_CONFIG__;
  if (!globalThis.__DINOU_IS_SSG_BUILD__ && cfg && cfg.storage) {
    setStorageAdapter(cfg.storage);
  }
  dinouConfig = cfg;
} else {
  const cwdSync = typeof process !== "undefined" && typeof process.cwd === "function" ? process.cwd() : null;
  if (cwdSync) {
    for (const filename of ["dinou.config.cjs", "dinou.config.js"]) {
      const syncPath = path.resolve(cwdSync, filename);
      if (existsSync(syncPath)) {
        try {
          const nodeReqSync = (typeof globalThis !== "undefined" && typeof globalThis.__dinou_require__ === "function")
            ? globalThis.__dinou_require__
            : (typeof require === "function" ? require : null);
          if (nodeReqSync) {
            const loaded = nodeReqSync(syncPath);
            const cfg = (loaded && loaded.default) ? loaded.default : (loaded || { plugins: [] });
            if (
              !(typeof globalThis !== "undefined" && globalThis.__DINOU_IS_SSG_BUILD__) &&
              cfg &&
              cfg.storage
            ) {
              setStorageAdapter(cfg.storage);
            }
            dinouConfig = cfg;
          }
        } catch (err) {}
        break;
      }
    }
  }
}

function safeJsonForInlineScript(str) {
  return JSON.stringify(str)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function formatRscPushScript(kind, chunkStr) {
  const arrName = `__DINOU_RSC_${kind}__`;
  const pushFn = `__DINOU_RSC_${kind}_PUSH__`;
  const encoded = safeJsonForInlineScript(chunkStr);
  return `<script>(self.${arrName}=self.${arrName}||[]).push(${encoded});if(self.${pushFn})self.${pushFn}(${encoded});</script>`;
}

function formatRscDoneScript(kind) {
  const doneName = `__DINOU_RSC_${kind}_DONE__`;
  const closeFn = `__DINOU_RSC_${kind}_CLOSE__`;
  return `<script>self.${doneName}=true;if(self.${closeFn})self.${closeFn}();</script>`;
}

function injectInlineRscIntoHtmlString(fullHtml, layoutRscText, pageRscText, hasLayout) {
  if (!fullHtml || !pageRscText || (hasLayout && !layoutRscText)) return fullHtml;
  let inlineScripts =
    "<script>window.__DINOU_INLINE_RSC__=true;window.__DINOU_RSC_P__=window.__DINOU_RSC_P__||[];window.__DINOU_RSC_L__=window.__DINOU_RSC_L__||[];</script>";
  if (hasLayout && layoutRscText) {
    inlineScripts += formatRscPushScript("L", layoutRscText) + formatRscDoneScript("L");
  }
  inlineScripts += formatRscPushScript("P", pageRscText) + formatRscDoneScript("P");
  const scriptMatch = fullHtml.match(/<script[^>]*\bsrc="\/(?:runtime|main)/i);
  if (scriptMatch && typeof scriptMatch.index === "number") {
    const idx = scriptMatch.index;
    return fullHtml.slice(0, idx) + inlineScripts + fullHtml.slice(idx);
  }
  const bodyCloseIdx = fullHtml.toLowerCase().lastIndexOf("</body>");
  if (bodyCloseIdx !== -1) {
    return fullHtml.slice(0, bodyCloseIdx) + inlineScripts + fullHtml.slice(bodyCloseIdx);
  }
  return fullHtml + inlineScripts;
}

function createInlineRscHtmlStream(htmlStream, context, clientManifest) {
  const hasLayoutSegment =
    context._resolvedLayoutClientJsx !== null &&
    context._resolvedLayoutClientJsx !== undefined;
  const layoutStream = hasLayoutSegment
    ? requestStorage.run(context, () =>
        renderRSCStream(context._resolvedLayoutClientJsx, clientManifest, {
          runtime: "edge",
        })
      )
    : null;
  const pageStream = requestStorage.run(context, () =>
    renderRSCStream(context._resolvedPageClientJsx, clientManifest, {
      runtime: "edge",
    })
  );

  const encoder = new TextEncoder();
  let initialSpliceDone = false;
  let streamClosed = false;
  let htmlBuffer = "";
  const pendingScripts = [];

  return new ReadableStream({
    async start(controller) {
      const safeEnqueueText = (str) => {
        if (streamClosed || !str) return;
        try {
          controller.enqueue(encoder.encode(str));
        } catch (e) {}
      };

      const flushPendingScripts = () => {
        if (pendingScripts.length === 0) return;
        const batch = pendingScripts.splice(0, pendingScripts.length).join("");
        safeEnqueueText(batch);
      };

      const onRscScript = (scriptStr) => {
        pendingScripts.push(scriptStr);
        if (initialSpliceDone && htmlBuffer.length === 0) {
          flushPendingScripts();
        }
      };

      const startPump = (rscStream, kind) => {
        if (!rscStream) {
          return {
            firstChunkReady: Promise.resolve(),
            donePromise: Promise.resolve(),
          };
        }
        let resolveFirst;
        const firstChunkReady = new Promise((r) => {
          resolveFirst = r;
        });
        const donePromise = (async () => {
          const reader = rscStream.getReader();
          const decoder = new TextDecoder();
          let first = true;
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                const rem = decoder.decode();
                if (rem) {
                  onRscScript(formatRscPushScript(kind, rem));
                }
                onRscScript(formatRscDoneScript(kind));
                if (first) {
                  first = false;
                  resolveFirst();
                }
                break;
              }
              const chunkStr = decoder.decode(value, { stream: true });
              if (chunkStr) {
                onRscScript(formatRscPushScript(kind, chunkStr));
                if (first) {
                  first = false;
                  resolveFirst();
                }
              }
            }
          } catch (err) {
            onRscScript(formatRscDoneScript(kind));
            if (first) {
              first = false;
              resolveFirst();
            }
          }
        })();
        return { firstChunkReady, donePromise };
      };

      const layoutPump = startPump(layoutStream, "L");
      const pagePump = startPump(pageStream, "P");

      const htmlReader = htmlStream.getReader();
      const htmlDecoder = new TextDecoder();
      let heldBodyClose = "";

      try {
        while (true) {
          const { done, value } = await htmlReader.read();
          if (done) {
            const rem = htmlDecoder.decode();
            if (rem) {
              htmlBuffer += rem;
            }
            if (heldBodyClose) {
              htmlBuffer = heldBodyClose + htmlBuffer;
              heldBodyClose = "";
            }
            const closeMatch = htmlBuffer.match(/<\/body>\s*<\/html>\s*$/i);
            if (closeMatch) {
              heldBodyClose = closeMatch[0];
              htmlBuffer = htmlBuffer.slice(0, htmlBuffer.length - heldBodyClose.length);
            }
            if (!initialSpliceDone) {
              await Promise.race([
                Promise.all([layoutPump.firstChunkReady, pagePump.firstChunkReady]),
                new Promise((r) => setTimeout(r, 15)),
              ]);
              const scriptMatch = htmlBuffer.match(/<script[^>]*\bsrc="\/(?:runtime|main)/i);
              const scriptsToInject = pendingScripts.splice(0, pendingScripts.length).join("");
              if (scriptMatch && typeof scriptMatch.index === "number") {
                const idx = scriptMatch.index;
                htmlBuffer = htmlBuffer.slice(0, idx) + scriptsToInject + htmlBuffer.slice(idx);
              } else {
                htmlBuffer += scriptsToInject;
              }
              initialSpliceDone = true;
            }
            if (htmlBuffer) {
              safeEnqueueText(htmlBuffer);
              htmlBuffer = "";
            }
            break;
          }

          const text = htmlDecoder.decode(value, { stream: true });
          if (!text) continue;

          if (heldBodyClose) {
            htmlBuffer += heldBodyClose + text;
            heldBodyClose = "";
          } else {
            htmlBuffer += text;
          }

          const closeMatch = htmlBuffer.match(/<\/body>\s*<\/html>\s*$/i);
          if (closeMatch) {
            heldBodyClose = closeMatch[0];
            htmlBuffer = htmlBuffer.slice(0, htmlBuffer.length - heldBodyClose.length);
          }

          if (!initialSpliceDone) {
            const scriptMatch = htmlBuffer.match(
              /<script\b[^>]*\bsrc="\/(?:runtime|main)[^"]*"[^>]*><\/script>/i
            );
            if (scriptMatch && typeof scriptMatch.index === "number") {
              await Promise.race([
                Promise.all([layoutPump.firstChunkReady, pagePump.firstChunkReady]),
                new Promise((r) => setTimeout(r, 15)),
              ]);
              const idx = scriptMatch.index;
              const scriptsToInject = pendingScripts.splice(0, pendingScripts.length).join("");
              htmlBuffer = htmlBuffer.slice(0, idx) + scriptsToInject + htmlBuffer.slice(idx);
              initialSpliceDone = true;
            }
          }

          if (initialSpliceDone) {
            const lastScriptClose = htmlBuffer.toLowerCase().lastIndexOf("</script>");
            if (lastScriptClose !== -1) {
              const cutIdx = lastScriptClose + 9;
              const toFlush = htmlBuffer.slice(0, cutIdx);
              htmlBuffer = htmlBuffer.slice(cutIdx);
              if (toFlush) {
                safeEnqueueText(toFlush);
              }
              if (htmlBuffer.length === 0 && pendingScripts.length > 0) {
                flushPendingScripts();
              }
            }
          }
        }

        initialSpliceDone = true;
        flushPendingScripts();
        await Promise.all([layoutPump.donePromise, pagePump.donePromise]);
        flushPendingScripts();
        if (heldBodyClose) {
          safeEnqueueText(heldBodyClose);
          heldBodyClose = "";
        }
        streamClosed = true;
        controller.close();
      } catch (err) {
        streamClosed = true;
        try {
          controller.error(err);
        } catch (e) {}
      }
    },
  });
}

// Anti-Bot Shield patterns
const botGarbagePatterns = [
  /\.php$/i,
  /\.env$/i,
  /\.git\b/i,
  /wp-admin/i,
  /wp-content/i,
  /wp-includes/i,
  /xmlrpc\.php/i,
  /\.sql$/i,
  /\.asp$/i,
  /\.jsp$/i,
  /\.cgi$/i,
  /\.bak$/i,
  /\.log$/i,
];

function isBotScannerRequest(pathname) {
  if (!pathname || typeof pathname !== "string") return false;
  if (isBotEnvProbePath(pathname)) return true;
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {}
  return botGarbagePatterns.some(
    (pattern) => pattern.test(pathname) || pattern.test(decoded)
  );
}

const IS_DYNAMIC_MAP_KEY = Symbol.for("dinou.isDynamic.map");
if (!globalThis[IS_DYNAMIC_MAP_KEY]) {
  globalThis[IS_DYNAMIC_MAP_KEY] = new Map();
}
const isDynamic = globalThis[IS_DYNAMIC_MAP_KEY];
const pageFunctionsConfigCache = new Map();

async function resolvePprForRoute(
  pagePath,
  pageFunctionsModule,
  reqSegments,
  queryObj,
  options = {},
) {
  const srcFolder = path.resolve(process.cwd(), "src");
  const { defaultPpr, anyLayoutPpr } = await resolveLayoutChainPpr(
    reqSegments || [],
    queryObj || {},
    srcFolder,
    {
      ignoreNoLayout: Boolean(options?.ignoreNoLayout),
      exactLayoutKey: Boolean(options?.exactLayoutKey),
    },
  );

  if (options?.segment === "layout") {
    return Boolean(anyLayoutPpr);
  }

  let explicitPagePpr = null;
  let pfMod = pageFunctionsModule;
  if (!pfMod && pagePath) {
    try {
      const pageFolder = path.dirname(pagePath);
      const [pageFunctionsPath] = getFilePathAndDynamicParams(
        reqSegments || [],
        queryObj || {},
        pageFolder,
        "page_functions",
        true,
        true,
        undefined,
        (reqSegments || []).length,
      );
      if (pageFunctionsPath) {
        pfMod = await importModule(pageFunctionsPath);
      }
    } catch (e) {}
  }

  if (pfMod) {
    explicitPagePpr = await resolveModulePpr(pfMod);
  }
  if (
    explicitPagePpr === null &&
    typeof globalThis !== "undefined" &&
    globalThis.__DINOU_ROUTE_METADATA__ &&
    pagePath
  ) {
    const normPage = pagePath.replace(/\\/g, "/");
    const pageDir = path.dirname(normPage);
    for (const [k, meta] of Object.entries(
      globalThis.__DINOU_ROUTE_METADATA__,
    )) {
      if (
        meta.ppr !== undefined &&
        (normPage.endsWith(k) || k.startsWith(pageDir + "/page_functions"))
      ) {
        explicitPagePpr = Boolean(meta.ppr);
        break;
      }
    }
  }

  const pageEffectivePpr =
    explicitPagePpr !== null ? explicitPagePpr : Boolean(defaultPpr);
  if (options?.segment === "page") {
    return Boolean(pageEffectivePpr);
  }
  return Boolean(pageEffectivePpr || anyLayoutPpr);
}

/**
 * Resolves page_functions configuration (allowISG, validateParams, getStaticPaths)
 * and determines whether the current request path is blocked or allowed for ISG.
 */
async function resolvePageFunctionsConfig(pagePath, reqSegments, queryObj, dynamicParams, reqPath, isSSG = false) {
  const globalCfg = await getDinouConfig();
  const defaultAllowISG =
    globalCfg?.allowISG !== undefined && globalCfg?.allowISG !== null
      ? Boolean(globalCfg.allowISG)
      : true;

  let isPathBlocked = false;
  let allowISGValue = defaultAllowISG;
  let isDynamicConfig = false;
  let cachedConfig = null;

  if (pagePath) {
    cachedConfig = pageFunctionsConfigCache.get(pagePath);
    if (!cachedConfig) {
      const pageFolder = path.dirname(pagePath);
      const [pageFunctionsPath] = getFilePathAndDynamicParams(
        reqSegments,
        queryObj,
        pageFolder,
        "page_functions",
        true,
        true,
        undefined,
        reqSegments.length,
      );

      let pageFunctionsModule = null;
      if (pageFunctionsPath) {
        try {
          pageFunctionsModule = await importModule(pageFunctionsPath);
        } catch (e) {}
      }

      const isPpr = await resolvePprForRoute(pagePath, pageFunctionsModule, reqSegments, queryObj);
      const isPagePpr = await resolvePprForRoute(pagePath, pageFunctionsModule, reqSegments, queryObj, {
        segment: "page",
      });

      if (pageFunctionsModule) {
        const defaultExport = pageFunctionsModule.default?.default ? pageFunctionsModule.default.default : pageFunctionsModule.default;
        const rawAllowISG =
          pageFunctionsModule.allowISG !== undefined
            ? pageFunctionsModule.allowISG
            : defaultExport?.allowISG;
        const resolvedAllowISG =
          typeof rawAllowISG === "function"
            ? await rawAllowISG()
            : (rawAllowISG ?? null);

        const getStaticPathsFn = pageFunctionsModule.getStaticPaths || defaultExport?.getStaticPaths;
        let staticPathsSet = null;
        if (getStaticPathsFn) {
          const paths = await (typeof getStaticPathsFn === "function"
            ? getStaticPathsFn()
            : getStaticPathsFn);
          if (Array.isArray(paths)) {
            staticPathsSet = new Set(
              paths.map((pathObj) => {
                if (pathObj && typeof pathObj === "object" && !Array.isArray(pathObj)) {
                  const sortedEntries = Object.entries(pathObj)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([k, v]) => [
                      k,
                      Array.isArray(v)
                        ? v.join(",")
                        : v === undefined || v === null
                        ? ""
                        : String(v),
                    ]);
                  return JSON.stringify(sortedEntries);
                }
                if (Array.isArray(pathObj)) {
                  return pathObj.join(",");
                }
                return pathObj === undefined || pathObj === null ? "" : String(pathObj);
              })
            );
          }
        }

        const rawRevalidate =
          pageFunctionsModule.revalidate !== undefined
            ? pageFunctionsModule.revalidate
            : defaultExport?.revalidate;
        let revalidateVal =
          typeof rawRevalidate === "function"
            ? await rawRevalidate()
            : rawRevalidate;

        const isDynamic = typeof revalidateVal === "number" && revalidateVal < 1;
        const rawTags = pageFunctionsModule.getCacheTags ?? defaultExport?.getCacheTags;

        cachedConfig = {
          allowISG: resolvedAllowISG,
          staticPathsSet,
          validateParams: pageFunctionsModule.validateParams || defaultExport?.validateParams || null,
          isDynamic,
          revalidate: revalidateVal,
          getCacheTagsFn: typeof rawTags === "function" ? rawTags : null,
          staticTags: Array.isArray(rawTags) ? rawTags : [],
          ppr: isPpr,
          pagePpr: isPagePpr,
        };
      } else {
        cachedConfig = {
          allowISG: null,
          staticPathsSet: null,
          validateParams: null,
          isDynamic: false,
          revalidate: undefined,
          getCacheTagsFn: null,
          staticTags: [],
          ppr: isPpr,
          pagePpr: isPagePpr,
        };
      }

      if (!isDevelopment) {
        pageFunctionsConfigCache.set(pagePath, cachedConfig);
      }
    }

    const { allowISG: cachedAllowISG, staticPathsSet, validateParams: validateParamsFn, isDynamic: cachedIsDynamic } = cachedConfig;
    allowISGValue =
      cachedAllowISG !== null && cachedAllowISG !== undefined
        ? Boolean(cachedAllowISG)
        : defaultAllowISG;
    isDynamicConfig = Boolean(cachedIsDynamic);
    const hasParams = Object.keys(dynamicParams || {}).length > 0;
    if (hasParams) {
      if (validateParamsFn) {
        const isValid = await validateParamsFn(dynamicParams);
        if (!isValid) {
          isPathBlocked = true;
        }
      }

      if (!isPathBlocked && allowISGValue === false && !isSSG) {
        let isPathAllowed = false;
        if (staticPathsSet) {
          const sortedQueryEntries = Object.entries(dynamicParams)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([k, v]) => [
              k,
              Array.isArray(v)
                ? v.join(",")
                : v === undefined || v === null
                ? ""
                : String(v),
            ]);
          const serializedQuery = JSON.stringify(sortedQueryEntries);
          const singleVal = Object.values(dynamicParams)[0];
          const singleValStr = Array.isArray(singleVal)
            ? singleVal.join(",")
            : singleVal === undefined || singleVal === null
            ? ""
            : String(singleVal);
          isPathAllowed = staticPathsSet.has(serializedQuery) || staticPathsSet.has(singleValStr);
        }
        if (!isPathAllowed) {
          if (isDevelopment) {
            isPathBlocked = true;
          } else {
            const cleanReq = reqPath.replace(/^\//, "").replace(/\/$/, "");
            const htmlPath = path.join(process.cwd(), ".dinou/dist2", cleanReq, "index.html");
            const shellHtmlPath = path.join(process.cwd(), ".dinou/dist2", cleanReq, "shell.html");
            const pageRscPath = path.join(process.cwd(), ".dinou/dist2", cleanReq, "page.rsc");
            if (!existsSync(htmlPath) && !existsSync(shellHtmlPath) && !existsSync(pageRscPath)) {
              isPathBlocked = true;
            }
          }
        }
      }
    }
  }

  let resolvedTags = cachedConfig?.staticTags || [];
  if (typeof cachedConfig?.getCacheTagsFn === "function") {
    try {
      const dynamicTags = await cachedConfig.getCacheTagsFn(dynamicParams);
      resolvedTags = Array.isArray(dynamicTags) ? dynamicTags : [];
    } catch (e) {
      console.error("Error running getCacheTags in handler:", e);
    }
  }

  return {
    isPathBlocked,
    allowISGValue,
    isDynamicConfig,
    revalidate: cachedConfig?.revalidate,
    tags: resolvedTags,
    ppr: Boolean(cachedConfig?.ppr),
    pagePpr: Boolean(cachedConfig?.pagePpr),
    staticPathsSet: cachedConfig?.staticPathsSet || null,
  };
}

/**
 * Evaluates whether a layout segment blocks the current request via validateParams or allowISG=false.
 * Only applies when the layout segment has dynamic parameters (Object.keys(lParams || {}).length > 0).
 */
async function isLayoutSegmentBlocked(
  layoutPath,
  lParams,
  layoutConfig,
  cleanLayoutKey,
  reqPath,
  isDevelopment,
  isSSG = false,
) {
  if (!layoutPath || !layoutConfig) return false;
  if (Object.keys(lParams || {}).length === 0) return false;

  if (layoutConfig.validateParams) {
    const isValid = await layoutConfig.validateParams(lParams);
    if (!isValid) {
      return true;
    }
  }

  if (layoutConfig.allowISG === false && !isSSG) {
    let isPathAllowed = false;
    if (layoutConfig.staticPathsSet) {
      const sortedEntries = Object.entries(lParams)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([k, v]) => [
          k,
          Array.isArray(v)
            ? v.join(",")
            : v === undefined || v === null
            ? ""
            : String(v),
        ]);
      const serialized = JSON.stringify(sortedEntries);
      const singleVal = Object.values(lParams)[0];
      const singleValStr = Array.isArray(singleVal)
        ? singleVal.join(",")
        : singleVal === undefined || singleVal === null
        ? ""
        : String(singleVal);
      isPathAllowed =
        layoutConfig.staticPathsSet.has(serialized) ||
        layoutConfig.staticPathsSet.has(singleValStr);
    }
    if (!isPathAllowed) {
      if (isDevelopment) {
        return true;
      }
      const cleanReq = reqPath.replace(/^\//, "").replace(/\/$/, "");
      const targetLayoutKey = cleanLayoutKey !== undefined ? cleanLayoutKey : cleanReq;
      const layoutRscPath = path.join(process.cwd(), ".dinou/dist2", targetLayoutKey, "layout.rsc");
      const htmlPath = path.join(process.cwd(), ".dinou/dist2", cleanReq, "index.html");
      const shellHtmlPath = path.join(process.cwd(), ".dinou/dist2", cleanReq, "shell.html");
      if (!existsSync(layoutRscPath) && !existsSync(htmlPath) && !existsSync(shellHtmlPath)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Parses the Cookie header into an object dictionary.
 */
function parseCookieHeader(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    try {
      cookies[key] = decodeURIComponent(val);
    } catch {
      cookies[key] = val;
    }
  }
  return cookies;
}

let discoveredLayoutsCache = null;
let lastLayoutsDiscoveryTime = 0;

function getDiscoveredLayouts() {
  if (typeof globalThis !== "undefined" && Array.isArray(globalThis.__DINOU_LAYOUTS__) && globalThis.__DINOU_LAYOUTS__.length > 0) {
    return globalThis.__DINOU_LAYOUTS__;
  }
  const now = Date.now();
  if (discoveredLayoutsCache && now - lastLayoutsDiscoveryTime < 1000) {
    return discoveredLayoutsCache;
  }
  let discovered = [];

  // 1. Edge/Workers: Discover layouts and page rules from VFS
  if (typeof globalThis !== "undefined" && globalThis.__DINOU_VFS__) {
    const vfs = globalThis.__DINOU_VFS__;
    const vfsFiles = [];
    for (const key of Object.keys(vfs)) {
      if (vfs[key]?.type === "file") {
        const idx = key.indexOf("src/");
        if (idx !== -1) {
          vfsFiles.push(key.slice(idx + 4));
        }
      }
    }
    if (vfsFiles.length > 0) {
      discovered = discoverLayoutsFromFileRelPaths(vfsFiles);
    }
  }

  // 2. Edge/Workers: Discover layouts and page rules from Route Modules registry
  if (discovered.length === 0 && typeof globalThis !== "undefined" && globalThis.__DINOU_ROUTE_MODULES__) {
    const modFiles = [];
    for (const key of Object.keys(globalThis.__DINOU_ROUTE_MODULES__)) {
      const idx = key.indexOf("src/");
      if (idx !== -1) {
        modFiles.push(key.slice(idx + 4));
      } else {
        modFiles.push(key);
      }
    }
    if (modFiles.length > 0) {
      discovered = discoverLayoutsFromFileRelPaths(modFiles);
    }
  }

  // 3. Node/Local filesystem discovery
  if (discovered.length === 0) {
    try {
      const srcFolder = path.resolve(process.cwd(), "src");
      discovered = discoverLayoutsFromFs(srcFolder, { existsSync, readdirSync });
    } catch (e) {}
  }

  discoveredLayoutsCache = discovered;
  lastLayoutsDiscoveryTime = now;
  return discovered;
}

async function readMetaFromStorage(storage, metaKey, fallbackKey = null, platformContext = null, requestUrl = null) {
  if (storage) {
    try {
      const metaItem = await storage.get(metaKey);
      if (metaItem) {
        if (metaItem.metadata && typeof metaItem.metadata === "object" && metaItem.metadata.generatedAt) {
          return metaItem.metadata;
        }
        if (typeof metaItem.content === "string" && metaItem.content.trim().startsWith("{")) {
          return JSON.parse(metaItem.content);
        }
      }
      if (fallbackKey) {
        const fbItem = await storage.get(fallbackKey);
        if (fbItem && fbItem.metadata && typeof fbItem.metadata === "object" && fbItem.metadata.generatedAt) {
          return fbItem.metadata;
        }
      }
    } catch (e) {}
  }
  const isDeleted =
    storage &&
    (typeof storage.isKeyDeleted === "function"
      ? await storage.isKeyDeleted(metaKey)
      : typeof storage.isDeleted === "function" && storage.isDeleted(metaKey));
  if (
    platformContext &&
    platformContext.env &&
    platformContext.env.ASSETS &&
    requestUrl &&
    !isDeleted
  ) {
    try {
      const metaRes = await fetchCloudflareDist2Asset(
        platformContext.env.ASSETS,
        metaKey,
        requestUrl
      );
      if (metaRes && metaRes.status === 200) {
        const text = await metaRes.text();
        if (text && text.trim().startsWith("{")) {
          const parsed = JSON.parse(text);
          if (storage) {
            await storage.set(metaKey, text);
          }
          return parsed;
        }
      }
    } catch (e) {}
  }
  if (!isDeleted && storage) {
    const dist2Item = await readDist2Fallback(storage, metaKey);
    if (dist2Item) {
      if (dist2Item.metadata && typeof dist2Item.metadata === "object" && dist2Item.metadata.generatedAt) {
        return dist2Item.metadata;
      }
      if (typeof dist2Item.content === "string" && dist2Item.content.trim().startsWith("{")) {
        try {
          return JSON.parse(dist2Item.content);
        } catch (e) {}
      }
    }
  }
  return null;
}

async function readRscFromStorage(storage, rscKey, platformContext = null, requestUrl = null) {
  if (storage) {
    try {
      const item = await storage.get(rscKey);
      if (item && typeof item.content === "string" && item.content.length > 0 && !item.content.trimStart().startsWith("<")) {
        return item.content;
      }
    } catch (e) {}
  }
  const isDeleted =
    storage &&
    (typeof storage.isKeyDeleted === "function"
      ? await storage.isKeyDeleted(rscKey)
      : typeof storage.isDeleted === "function" && storage.isDeleted(rscKey));
  if (
    platformContext &&
    platformContext.env &&
    platformContext.env.ASSETS &&
    requestUrl &&
    !isDeleted
  ) {
    try {
      const assetRes = await fetchCloudflareDist2Asset(
        platformContext.env.ASSETS,
        rscKey,
        requestUrl
      );
      if (assetRes && assetRes.status === 200) {
        const text = await assetRes.text();
        if (text && !text.trimStart().startsWith("<")) {
          if (storage) {
            await storage.set(rscKey, text);
          }
          return text;
        }
      }
    } catch (e) {}
  }
  if (!isDeleted && storage) {
    const dist2Item = await readDist2Fallback(storage, rscKey);
    if (
      dist2Item &&
      typeof dist2Item.content === "string" &&
      dist2Item.content.length > 0 &&
      !dist2Item.content.trimStart().startsWith("<")
    ) {
      return dist2Item.content;
    }
  }
  return "";
}

function __noopMarker() {
  return discovered;
}

function applyStreamingResponseHeaders(headers) {
  if (!headers.has("Content-Encoding")) {
    headers.set("Content-Encoding", "identity");
  }
  if (!headers.has("X-Accel-Buffering")) {
    headers.set("X-Accel-Buffering", "no");
  }
  const contentType = headers.get("Content-Type") || "";
  if (
    contentType.toLowerCase().startsWith("text/x-component") &&
    !headers.has("X-Content-Type-Options")
  ) {
    headers.set("X-Content-Type-Options", "nosniff");
  }
  const cacheControl = headers.get("Cache-Control");
  if (!cacheControl) {
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, no-transform");
  } else if (!/\bno-transform\b/i.test(cacheControl)) {
    headers.set("Cache-Control", `${cacheControl}, no-transform`);
  }
}

/**
 * Bridges Node.js style response methods to a WHATWG Web Response.
 */
class WebResponseBridge extends PassThrough {
  constructor(platformContext = null) {
    super();
    this.statusCode = 200;
    this._explicitStatusSet = false;
    this.statusMessage = "";
    this.headers = new Headers();
    this.cookies = [];
    this.headersSent = false;
    this._resolved = false;
    this._platformContext = platformContext;
    this._responsePromise = new Promise((resolve) => {
      this._resolveResponse = resolve;
    });
    this.on("error", () => {});
  }

  status(code) {
    this.statusCode = code;
    this._explicitStatusSet = true;
    return this;
  }

  setHeader(name, value) {
    if (this.headersSent) return this;
    if (name.toLowerCase() === "set-cookie") {
      this.cookies.push(String(value));
    } else {
      this.headers.set(name, String(value));
    }
    return this;
  }

  cookie(name, value, options = {}) {
    let cookieStr = `${name}=${encodeURIComponent(value)}`;
    if (options.path) cookieStr += `; Path=${options.path}`;
    if (options.domain) cookieStr += `; Domain=${options.domain}`;
    if (options.maxAge !== undefined) cookieStr += `; Max-Age=${options.maxAge}`;
    if (options.expires) cookieStr += `; Expires=${new Date(options.expires).toUTCString()}`;
    if (options.secure) cookieStr += `; Secure`;
    if (options.httpOnly) cookieStr += `; HttpOnly`;
    if (options.sameSite) cookieStr += `; SameSite=${options.sameSite}`;
    this.cookies.push(cookieStr);
    return this;
  }

  clearCookie(name, options = {}) {
    return this.cookie(name, "", { ...options, maxAge: 0, expires: new Date(0) });
  }

  redirect(urlOrStatus, targetUrl) {
    let code = 302;
    let url = targetUrl;
    if (typeof urlOrStatus === "number") {
      code = urlOrStatus;
    } else if (urlOrStatus) {
      url = urlOrStatus;
    }
    this.status(code);
    this.setHeader("Location", url || "/");
    this.end();
  }

  send(body) {
    if (typeof body === "string") {
      if (!this.headers.has("Content-Type")) {
        this.setHeader("Content-Type", "text/html; charset=utf-8");
      }
      this.end(Buffer.from(body));
    } else if (Buffer.isBuffer(body)) {
      if (!this.headers.has("Content-Type")) {
        this.setHeader("Content-Type", "application/octet-stream");
      }
      this.end(body);
    } else if (typeof body === "object") {
      this.json(body);
    } else {
      this.end(String(body));
    }
  }

  json(data) {
    this.setHeader("Content-Type", "application/json; charset=utf-8");
    this.end(Buffer.from(JSON.stringify(data)));
  }

  _commitHeaders() {
    if (!this.headersSent) {
      this.headersSent = true;
      for (const c of this.cookies) {
        this.headers.append("Set-Cookie", c);
      }
      applyStreamingResponseHeaders(this.headers);
      const webStream = Readable.toWeb(this);
      const res = new Response(webStream, {
        status: this.statusCode,
        statusText: this.statusMessage || undefined,
        headers: this.headers,
        encodeBody: "manual",
      });
      this._resolved = true;
      this._resolveResponse(res);
    }
  }

  write(chunk, encoding, callback) {
    if (this.writableEnded || this.destroyed) {
      if (typeof callback === "function") callback();
      return false;
    }
    this._commitHeaders();
    return super.write(chunk, encoding, callback);
  }

  end(chunk, encoding, callback) {
    if (this.writableEnded || this.destroyed) {
      if (typeof callback === "function") callback();
      return this;
    }
    if (!this.headersSent) {
      this.headersSent = true;
      for (const c of this.cookies) {
        this.headers.append("Set-Cookie", c);
      }
      let body = null;
      if (chunk !== undefined && chunk !== null) {
        body = chunk;
      }
      const res = new Response(body, {
        status: this.statusCode,
        statusText: this.statusMessage || undefined,
        headers: this.headers,
      });
      this._resolved = true;
      this._resolveResponse(res);
      super.end();
      if (typeof callback === "function") callback();
      return this;
    }
    this._commitHeaders();
    return super.end(chunk, encoding, callback);
  }

  setEdgeStream(readableStream) {
    this.headersSent = true;
    for (const c of this.cookies) {
      this.headers.append("Set-Cookie", c);
    }
    applyStreamingResponseHeaders(this.headers);

    const textEncoder = new TextEncoder();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const onBridgeData = (chunk) => {
      try {
        const data = typeof chunk === "string" ? textEncoder.encode(chunk) : chunk;
        writer.write(data).catch(() => {});
      } catch (e) {}
    };
    this.on("data", onBridgeData);

    const pumpPromise = (async () => {
      let reader;
      try {
        reader = readableStream.getReader();
      } catch (err) {
        try {
          await writer.abort(err).catch(() => {});
        } catch (_) {}
        return;
      }
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value).catch(() => {});
        }
      } catch (err) {
        try {
          await writer.abort(err).catch(() => {});
        } catch (e) {}
        return;
      } finally {
        this.removeListener("data", onBridgeData);
      }
      try {
        await writer.close().catch(() => {});
      } catch (e) {}
    })();

    if (
      this._platformContext &&
      this._platformContext.ctx &&
      typeof this._platformContext.ctx.waitUntil === "function"
    ) {
      this._platformContext.ctx.waitUntil(pumpPromise);
    }

    const res = new Response(readable, {
      status: this.statusCode,
      statusText: this.statusMessage || undefined,
      headers: this.headers,
      encodeBody: "manual",
    });
    this._resolved = true;
    this._resolveResponse(res);
  }

  toResponse() {
    return this._responsePromise;
  }
}

/**
 * Creates the Dinou request context object.
 */
function createRequestContext(simReq, resBridge, platformContext = {}, dynamicState = null) {
  let hasRedirected = false;

  const markDynamic = () => {
    if (isSlotDiscoveryActive()) return;
    if (dynamicState) {
      dynamicState.value = true;
    }
  };

  const isRscSimReq = Boolean(
    simReq.isRscRequest ||
      String(simReq.rawPath || simReq.path || "").includes("____rsc_")
  );

  const isAllowedRedirectTarget = (candidate) =>
    typeof candidate === "string" &&
    ((candidate.startsWith("/") && !candidate.startsWith("//")) ||
      /^https?:\/\//i.test(candidate));

  const safeResCall = (methodName, ...args) => {
    if (hasRedirected) return;
    if (
      methodName === "status" ||
      methodName === "setHeader" ||
      methodName === "cookie" ||
      methodName === "clearCookie" ||
      methodName === "redirect"
    ) {
      markDynamic();
    }
    if (methodName === "clearCookie") {
      const [name, options] = args;
      let cookieStr = `${name}=; Max-Age=0`;
      const path = options?.path || "/";
      cookieStr += `; path=${path}`;
      if (options) {
        if (options.domain) cookieStr += `; domain=${options.domain}`;
        if (options.secure) cookieStr += `; secure`;
        if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`;
      }
      cookieStr += ";";
      const safeCookieStr = JSON.stringify(cookieStr);
      const scriptTag = `<script>document.cookie = ${safeCookieStr};</script>`;
      resBridge._injectedScripts = (resBridge._injectedScripts || "") + scriptTag;
      if (resBridge.headersSent) {
        if (!isRscSimReq) {
          resBridge.write(scriptTag);
        }
        return;
      }
      return resBridge.clearCookie(name, options);
    }
    if (methodName === "cookie") {
      const [name, value, options] = args;
      let cookieStr = `${name}=${encodeURIComponent(value)}`;
      if (options) {
        if (options.path) cookieStr += `; path=${options.path}`;
        if (options.domain) cookieStr += `; domain=${options.domain}`;
        if (options.maxAge) cookieStr += `; max-age=${options.maxAge}`;
        if (options.expires) cookieStr += `; expires=${new Date(options.expires).toUTCString()}`;
        if (options.secure) cookieStr += `; secure`;
        if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`;
      }
      if (!options?.httpOnly) {
        const safeCookieStr = JSON.stringify(cookieStr);
        const scriptTag = `<script>document.cookie = ${safeCookieStr};</script>`;
        resBridge._injectedScripts = (resBridge._injectedScripts || "") + scriptTag;
        if (resBridge.headersSent) {
          if (!isRscSimReq) {
            resBridge.write(scriptTag);
          }
          return;
        }
      } else if (resBridge.headersSent) {
        console.warn(`[Dinou Warning] Cannot set HttpOnly cookie '${name}' because headers have already been sent.`);
        return;
      }
      return resBridge.cookie(name, value, options);
    }
    if (resBridge.headersSent) {
      if (methodName === "redirect") {
        if (isRscSimReq) {
          return;
        }
        hasRedirected = true;
        if (context) context._hasRedirected = true;
        let url = args[0];
        if (args.length === 2) {
          url = args[1];
        }
        const resolvedUrl = resolveRelativeUrl(url, simReq.path);
        const finalUrl = isAllowedRedirectTarget(resolvedUrl) ? resolvedUrl : "/";
        if (context) context._redirectLocation = finalUrl;
        const safeUrl = JSON.stringify(finalUrl);
        resBridge.write(`<script>window.location.href = ${safeUrl};</script>`);
        resBridge.end();
        return;
      }
      return;
    }
    if (methodName === "redirect") {
      hasRedirected = true;
      if (context) context._hasRedirected = true;
      let url = args[0];
      let status = 302;
      if (args.length === 2) {
        status = args[0];
        url = args[1];
      }
      const resolvedUrl = resolveRelativeUrl(url, simReq.path);
      const finalUrl = isAllowedRedirectTarget(resolvedUrl) ? resolvedUrl : "/";
      if (context) context._redirectLocation = finalUrl;
      if (context?._isPprRuntimeResume) {
        return;
      }
      if (isRscSimReq) {
        resBridge.setHeader("x-rsc-redirect", finalUrl);
        resBridge.status(200).end();
        return;
      }
      return resBridge.redirect(status, finalUrl);
    }
    return resBridge[methodName].apply(resBridge, args);
  };

  const cookiesProxy = createBailoutProxy(simReq.cookies, "Cookies", markDynamic);
  const headersProxy = createBailoutProxy(simReq.headers, "Headers", markDynamic);
  const queryProxy = createBailoutProxy(simReq.query, "Query", markDynamic);
  const unifiedEnv = createUnifiedEnv(platformContext.env);

  const context = {
    req: {
      cookies: cookiesProxy,
      headers: headersProxy,
      query: queryProxy,
      path: simReq.path,
      rawPath: simReq.rawPath || simReq.path,
      isRscRequest: isRscSimReq,
      method: simReq.method,
      env: unifiedEnv,
      ctx: platformContext.ctx || null,
    },
    res: {
      status: (code) => safeResCall("status", code),
      setHeader: (name, value) => safeResCall("setHeader", name, value),
      clearCookie: (name, options) => safeResCall("clearCookie", name, options),
      cookie: (name, value, options) => safeResCall("cookie", name, value, options),
      redirect: (...args) => safeResCall("redirect", ...args),
    },
    env: unifiedEnv,
    ctx: platformContext.ctx || null,
    platformContext,
    _markDynamic: markDynamic,
    _dynamicState: dynamicState,
    _hasRedirected: false,
  };

  if (
    !platformContext?.isSSG &&
    dinouConfig.plugins &&
    Array.isArray(dinouConfig.plugins)
  ) {
    for (const plugin of dinouConfig.plugins) {
      if (typeof plugin.onRequestContext === "function") {
        try {
          plugin.onRequestContext(simReq, resBridge, context);
        } catch (err) {
          console.error(`[Dinou] Error in plugin "${plugin.name || "unnamed"}":`, err);
        }
      }
    }
  }

  setCurrentContext(context);
  return context;
}

/**
 * Context for Server Function endpoints.
 */
function createServerFunctionContext(simReq, resBridge, platformContext = {}) {
  const unifiedEnv = createUnifiedEnv(platformContext.env);
  const context = {
    req: {
      cookies: { ...simReq.cookies },
      headers: { ...simReq.headers },
      query: { ...simReq.query },
      path: simReq.path,
      rawPath: simReq.rawPath || simReq.path,
      isRscRequest: false,
      method: simReq.method,
      env: unifiedEnv,
      ctx: platformContext.ctx || null,
    },
    res: {
      redirect: (urlOrStatus, url) => {
        const rawUrl = url || urlOrStatus;
        const currentPath = simReq.headers["x-dinou-current-path"];
        const referer = simReq.headers["referer"];
        let refererPath = "/";
        if (currentPath) {
          refererPath = currentPath;
        } else if (referer) {
          try {
            refererPath = new URL(referer).pathname;
          } catch (e) { }
        }
        const resolvedUrl = resolveRelativeUrl(rawUrl, refererPath);
        let finalUrl = "/";
        if (typeof resolvedUrl === "string" && resolvedUrl.startsWith("/") && !resolvedUrl.startsWith("//")) {
          finalUrl = resolvedUrl;
        }
        throw {
          $$type: "dinou-internal-redirect",
          url: finalUrl,
        };
      },
      status: (code) => {
        if (!resBridge.headersSent) resBridge.status(code);
      },
      setHeader: (n, v) => {
        if (!resBridge.headersSent) resBridge.setHeader(n, v);
      },
      cookie: (name, value, options) => {
        if (!resBridge.headersSent) {
          resBridge.setHeader("Content-Type", "text/x-component");
          resBridge.cookie(name, value, options);
          return;
        }
        let cookieStr = `${name}=${encodeURIComponent(value)}`;
        if (options) {
          if (options.path) cookieStr += `; path=${options.path}`;
          if (options.domain) cookieStr += `; domain=${options.domain}`;
          if (options.maxAge) cookieStr += `; max-age=${options.maxAge}`;
          if (options.expires) cookieStr += `; expires=${new Date(options.expires).toUTCString()}`;
          if (options.secure) cookieStr += `; secure`;
          if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`;
        }
        resBridge.write(`D:{"type":"cookie","cookie":${JSON.stringify(cookieStr)}}\n`);
      },
      clearCookie: (name, options) => {
        if (!resBridge.headersSent) {
          resBridge.setHeader("Content-Type", "text/x-component");
          resBridge.clearCookie(name, options);
          return;
        }
        let cookieStr = `${name}=; Max-Age=0; path=${options?.path || "/"}`;
        resBridge.write(`D:{"type":"cookie","cookie":${JSON.stringify(cookieStr)}}\n`);
      },
    },
    env: unifiedEnv,
    ctx: platformContext.ctx || null,
    platformContext,
    _dynamicState: { value: true },
  };
  setCurrentContext(context);
  return context;
}

function normalizeLogicalRequestPathname(pathname, headersObj = {}) {
  if (typeof pathname !== "string" || !pathname) {
    return "/";
  }
  if (
    /^\/____rsc_(?:page|layout|payload)(?:_(?:old_static|old|static))?____(?:\/|$)/.test(
      pathname
    )
  ) {
    const stripped = pathname.replace(
      /^\/____rsc_(?:page|layout|payload)(?:_(?:old_static|old|static))?____/,
      ""
    );
    return stripped || "/";
  }
  if (/^\/____rsc_payload_error____(?:\/|$)/.test(pathname)) {
    const stripped = pathname.replace(/^\/____rsc_payload_error____/, "");
    return stripped || "/";
  }
  if (/^\/____rsc_slot____(?:\/|$)/.test(pathname)) {
    const currentPath = headersObj["x-dinou-current-path"];
    if (typeof currentPath === "string" && currentPath.startsWith("/")) {
      return currentPath.split("?")[0] || "/";
    }
  }
  return pathname;
}

function finalizePluginResponse(result, bridge, request, isRscWireRequest) {
  let hasBridgeHeaders = false;
  for (const _ of bridge.headers.keys()) {
    hasBridgeHeaders = true;
    break;
  }
  const hasBridgeCookies = bridge.cookies.length > 0;
  let finalRes = result;

  if (hasBridgeHeaders || hasBridgeCookies) {
    const mergedHeaders = new Headers(result.headers);
    for (const [k, v] of bridge.headers.entries()) {
      if (!mergedHeaders.has(k)) {
        mergedHeaders.set(k, v);
      }
    }
    for (const c of bridge.cookies) {
      mergedHeaders.append("Set-Cookie", c);
    }
    finalRes = new Response(result.body, {
      status: result.status,
      statusText: result.statusText,
      headers: mergedHeaders,
    });
  }

  const location = finalRes.headers.get("location");
  if (
    isRscWireRequest &&
    finalRes.status >= 300 &&
    finalRes.status < 400 &&
    location
  ) {
    const reqUrl = new URL(request.url);
    let redirectTarget = location;
    try {
      const resolved = new URL(location, reqUrl.origin);
      if (resolved.origin === reqUrl.origin) {
        redirectTarget = resolved.pathname + resolved.search + resolved.hash;
      } else {
        redirectTarget = resolved.href;
      }
    } catch (e) {}

    const rscHeaders = new Headers();
    for (const [k, v] of finalRes.headers.entries()) {
      const lower = k.toLowerCase();
      if (lower === "location" || lower === "set-cookie") continue;
      rscHeaders.set(k, v);
    }
    const setCookies =
      typeof finalRes.headers.getSetCookie === "function"
        ? finalRes.headers.getSetCookie()
        : [];
    for (const c of setCookies) {
      rscHeaders.append("Set-Cookie", c);
    }
    rscHeaders.set("x-rsc-redirect", redirectTarget);
    if (!rscHeaders.has("Cache-Control")) {
      rscHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate");
    }
    return new Response("", {
      status: 200,
      headers: rscHeaders,
    });
  }

  return finalRes;
}

/**
 * Universal request handler: (Request, platformContext?) => Promise<Response>
 * @param {Request} request 
 * @param {object} platformContext Optional runtime context ({ env, ctx, runtime })
 * @returns {Promise<Response>}
 */
async function handleRequest(request, platformContext = {}) {
  if (typeof globalThis !== "undefined") {
    if (platformContext?.renderHtmlStream) {
      globalThis.__DINOU_RENDER_HTML_STREAM__ = platformContext.renderHtmlStream;
    } else if (typeof globalThis.__DINOU_RENDER_HTML_STREAM__ === "function") {
      platformContext = {
        ...platformContext,
        renderHtmlStream: globalThis.__DINOU_RENDER_HTML_STREAM__,
      };
    }
    if (platformContext?.env) {
      globalThis.__DINOU_ENV__ = platformContext.env;
      syncEdgeEnvToProcessEnv(platformContext.env);
    }
  }
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. Anti-Bot Shield & Reserved Internal Namespace Guard
  if (
    isBotScannerRequest(pathname) ||
    isReservedCloudflareDist2RequestPath(pathname)
  ) {
    return new Response("Not Found", { status: 404 });
  }

  // 2. Playwright status endpoint
  if (pathname === "/__DINOU_STATUS_PLAYWRIGHT__") {
    return Response.json({
      status: "ok",
      isReady: isDevelopment ? isManifestReady() : true,
      mode: isDevelopment ? "development" : "production",
    });
  }

  // 3. DevTools manifest
  if (pathname === "/.well-known/appspecific/com.chrome.devtools.json") {
    return Response.json({
      name: "Dinou DevTools",
      description: "Dinou DevTools for Chrome",
      version: "1.0.0",
      devtools_page: `/${outputFolder}/devtools.html`,
    });
  }

  // Extract simulated request params for existing Dinou core helpers
  const headersObj = {};
  for (const [k, v] of request.headers.entries()) {
    headersObj[k.toLowerCase()] = v;
  }
  const cookiesObj = parseCookieHeader(headersObj["cookie"] || "");
  const queryObj = {};
  for (const [k, v] of url.searchParams.entries()) {
    if (k === "__proto__") continue;
    if (Object.prototype.hasOwnProperty.call(queryObj, k)) {
      if (Array.isArray(queryObj[k])) {
        queryObj[k].push(v);
      } else {
        queryObj[k] = [queryObj[k], v];
      }
    } else {
      queryObj[k] = v;
    }
  }
  const internalBuildId = queryObj.____build_id____;
  const internalRefreshVersion = queryObj.____v____;
  delete queryObj.____build_id____;
  delete queryObj.____v____;

  const isRscWireRequest =
    pathname.includes("____rsc_") && !pathname.includes("____server_function____");
  const logicalPathname = normalizeLogicalRequestPathname(pathname, headersObj);

  const simReq = {
    path: logicalPathname,
    rawPath: pathname,
    isRscRequest: isRscWireRequest,
    url: logicalPathname + url.search,
    query: queryObj,
    headers: headersObj,
    cookies: cookiesObj,
    method: request.method,
  };

  const cfg = await getDinouConfig();
  const bridge = new WebResponseBridge(platformContext);
  const rootContext = createRequestContext(simReq, bridge, platformContext);

  return await requestStorage.run(rootContext, async () => {
  // 4. Plugin onRequest Hook (Universal Middlewares & Webhooks; skipped during build-time SSG)
  if (!platformContext?.isSSG && cfg.plugins && Array.isArray(cfg.plugins)) {
    for (const plugin of cfg.plugins) {
      if (typeof plugin.onRequest === "function") {
        try {
          const result = await requestStorage.run(rootContext, () =>
            plugin.onRequest(request, rootContext)
          );
          if (bridge._resolved || bridge.headersSent) {
            return bridge.toResponse();
          }
          if (result instanceof Response) {
            return finalizePluginResponse(
              result,
              bridge,
              request,
              isRscWireRequest
            );
          }
        } catch (pluginErr) {
          console.error(`[Dinou Plugin Error: "${plugin.name || "unnamed"}"]:`, pluginErr);
          return new Response("Internal Server Error", { status: 500 });
        }
      }
    }
  }

  // 5. Server Functions Endpoint (POST /____server_function____)
  if (pathname === "/____server_function____" && request.method === "POST") {
    try {
      const origin = headersObj["origin"];
      const host = headersObj["x-forwarded-host"] || headersObj["host"];

      if (!isDevelopment && origin && !origin.includes(host)) {
        return Response.json({ error: "Invalid Origin" }, { status: 403 });
      }
      if (headersObj["x-server-function-call"] !== "1") {
        return Response.json({ error: "Missing security header" }, { status: 403 });
      }

      let id, args;
      const contentType = headersObj["content-type"] || "";

      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        id = formData.get("__dinou_func_id");
        const extraArgs = formData.get("__dinou_args");
        const formDataIndex = formData.get("__dinou_formData_index");

        // Strip internal keys
        formData.delete("__dinou_func_id");
        formData.delete("__dinou_args");
        formData.delete("__dinou_formData_index");

        if (extraArgs) {
          try {
            const parsedArgs = JSON.parse(extraArgs);
            if (formDataIndex !== null) {
              parsedArgs[parseInt(formDataIndex, 10)] = formData;
              args = parsedArgs;
            } else {
              args = [formData, ...parsedArgs];
            }
          } catch (e) {
            args = [formData];
          }
        } else {
          args = [formData];
        }
      } else {
        const bodyJson = await request.json();
        id = bodyJson.id;
        args = bodyJson.args;
      }

      if (typeof id !== "string" || !Array.isArray(args)) {
        return Response.json({ error: "Invalid request body" }, { status: 400 });
      }

      const [fileUrl, exportName] = id.split("#");
      if (!fileUrl.startsWith("file://")) {
        return Response.json({ error: "Invalid file URL format" }, { status: 400 });
      }

      let relativePath;
      const isRelativeSrc = fileUrl.startsWith("file:///src/") || fileUrl.startsWith("file:///src\\");
      if (isRelativeSrc) {
        relativePath = fileUrl.replace(/^file:\/\/\/?/, "").trim();
      } else {
        let resolvedPath;
        try {
          resolvedPath = fileURLToPath(fileUrl);
        } catch (e) {
          return Response.json({ error: "Invalid file URL format" }, { status: 400 });
        }
        const normalizedCwd = normalizePathCase(process.cwd());
        const normalizedResolved = normalizePathCase(resolvedPath);
        if (normalizedResolved.startsWith(normalizedCwd)) {
          relativePath = path.relative(normalizedCwd, normalizedResolved);
        } else {
          relativePath = normalizedResolved;
        }
      }

      const normalizedRelativePath = path.normalize(relativePath).replace(/\\/g, "/");
      const hasEscapedDir = normalizedRelativePath.split("/").slice(1, -1).some((seg) => seg.startsWith("_"));
      if ((!normalizedRelativePath.startsWith("src/") && normalizedRelativePath !== "src") || hasEscapedDir) {
        return Response.json({ error: "Forbidden access" }, { status: 403 });
      }

      const sfManifest = getServerFunctionsManifest();
      let resolvedRelativePath = normalizedRelativePath;
      if (sfManifest) {
        let allowedExports = sfManifest[normalizedRelativePath];
        if (!allowedExports) {
          const lowerTarget = normalizedRelativePath.toLowerCase();
          const matchedKey = Object.keys(sfManifest).find((k) => k.toLowerCase() === lowerTarget);
          if (matchedKey) {
            allowedExports = sfManifest[matchedKey];
            resolvedRelativePath = matchedKey;
          }
        }
        if (!allowedExports || !allowedExports.has(exportName)) {
          return Response.json({ error: "Invalid export name" }, { status: 400 });
        }
      }

      const absPath = path.resolve(process.cwd(), resolvedRelativePath);
      const mod = await importModule(absPath);
      const fn = exportName === "default" ? mod.default : mod[exportName];

      if (typeof fn !== "function") {
        return Response.json({ error: `Function '${exportName}' not found` }, { status: 404 });
      }

      const context = createServerFunctionContext(simReq, bridge, platformContext);
      copyCustomContextProperties(rootContext, context);
      let returnValue;
      try {
        await requestStorage.run(context, async () => {
          returnValue = await fn(...args);
        });
      } catch (e) {
        if (e && e.$$type === "dinou-internal-redirect") {
          const safeUrl = JSON.stringify(e.url);
          if (!bridge.headersSent) {
            bridge.setHeader("Content-Type", "application/json");
            bridge.setHeader("X-Dinou-Redirect", e.url);
            bridge.setHeader("x-rsc-redirect", e.url);
            bridge.status(200);
            bridge.json({ redirect: e.url });
            return bridge.toResponse();
          } else {
            bridge.write(`D:{"type":"redirect","url":${safeUrl}}\n`);
            bridge.end();
            return bridge.toResponse();
          }
        }
        throw e;
      }

      bridge.setHeader("Content-Type", "text/x-component");
      if (!bridge.headers.has("Cache-Control")) {
  bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
}

      const manifest = getClientManifest();
      requestStorage.run(context, () => {
        pipeRSC(returnValue, bridge, manifest, platformContext);
      });
      return bridge.toResponse();
    } catch (err) {
      console.error("[Dinou] Error executing server function:", err);
      const errorPayload = { error: err?.message || "Internal Server Error" };
      if (err && typeof err.digest === "string") {
        errorPayload.digest = err.digest;
      }
      return Response.json(errorPayload, { status: 500 });
    }
  }

  // 5. Client Error RSC Endpoint (POST /____rsc_payload_error____/*)
  if (pathname.includes("____rsc_payload_error____") && request.method === "POST") {
    try {
      const cleanPath = (pathname.endsWith("/") ? pathname : pathname + "/")
        .replace("/____rsc_payload_error____", "");

      let body = {};
      try {
        body = await request.json();
      } catch (e) {}

      const rawClientError = body?.error || { message: "Unknown Error" };
      const clientError = {
        message: isDevelopment
          ? (rawClientError.message || "Unknown Error")
          : "An error occurred in the Server Components render",
        name: rawClientError.name || "Error",
        stack: isDevelopment ? rawClientError.stack : undefined,
      };
      const context = createRequestContext(simReq, bridge, platformContext);
      copyCustomContextProperties(rootContext, context);

      await requestStorage.run(context, async () => {
        const jsx = await getErrorJSX(
          cleanPath,
          queryObj,
          clientError,
          isDevelopment,
          { segment: "page" },
        );
        bridge.setHeader("Content-Type", "text/x-component");
        if (!bridge.headers.has("Cache-Control")) {
  bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
}

        const manifest = getClientManifest();
        pipeRSC(jsx, bridge, manifest, platformContext);
      });
      return bridge.toResponse();
    } catch (err) {
      console.error("[Dinou] Error rendering fallback error RSC:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  // 5.5. Granular Slot RSC Endpoint (GET /____rsc_slot____/*)
  if (pathname.includes("____rsc_slot____")) {
    try {
      const slotId = pathname
        .replace(/^.*\/____rsc_slot____\/?/, "")
        .split("?")[0]
        .split("/")[0]
        .trim();

      if (!slotId) {
        return new Response("Missing slot id", { status: 400 });
      }

      const urlObj = new URL(request.url || `http://localhost${pathname}`);
      const isFresh = urlObj.searchParams.get("fresh") === "1" || urlObj.searchParams.has("fresh");

      const currentPath =
        request.headers?.get?.("x-dinou-current-path") ||
        simReq.headers?.["x-dinou-current-path"] ||
        "/";

      const context = createRequestContext(simReq, bridge, platformContext);
      copyCustomContextProperties(rootContext, context);

      let slotJsx = null;
      await requestStorage.run(context, async () => {
        slotJsx = await getSlotJSX(slotId, {
          req: request,
          currentPath,
          fresh: isFresh,
        });

        if (!slotJsx) {
          bridge.status(404);
          bridge.send(`Slot "${slotId}" not found in cache or registry`);
          return;
        }

        bridge.setHeader("Content-Type", "text/x-component");
        if (!bridge.headers.has("Cache-Control")) {
  bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
}
        bridge.setHeader("X-Dinou-Slot", slotId);

        const manifest = getClientManifest();
        pipeRSC(slotJsx, bridge, manifest, platformContext);
      });

      return bridge.toResponse();
    } catch (err) {
      console.error("[Dinou] Error rendering slot RSC payload:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  // 6. Segmented RSC Payload Endpoints (GET /____rsc_page____/*, /____rsc_layout____/*, /____rsc_payload____/*)
  if (
    pathname.includes("____rsc_page") ||
    pathname.includes("____rsc_layout") ||
    pathname.includes("____rsc_payload")
  ) {
    const isLayoutReq = pathname.includes("____rsc_layout");
    const isPageReq = pathname.includes("____rsc_page");
    const isOld =
      pathname.includes("_old_static") ||
      pathname.includes("_old");
    const isStatic =
      pathname.includes("_old_static") ||
      pathname.includes("_static");

    const rawCleanPath = (pathname.endsWith("/") ? pathname : pathname + "/")
      .replace(/^\/____rsc_(?:page|layout|payload)_(?:old_static|old|static)____/, "")
      .replace(/^\/____rsc_(?:page|layout|payload)____/, "");

    const reqSegments = rawCleanPath
      .split("/")
      .filter(Boolean)
      .map((s) => {
        if (!isLayoutReq) return s;
        try {
          return decodeURIComponent(s);
        } catch (e) {
          return s;
        }
      });
    const cleanPath = isLayoutReq
      ? reqSegments.length > 0
        ? "/" + reqSegments.join("/") + "/"
        : "/"
      : rawCleanPath;
    const srcFolder = path.resolve(process.cwd(), "src");
    const [pagePath, dynamicParams] = isLayoutReq
      ? [undefined, {}]
      : getFilePathAndDynamicParams(reqSegments, queryObj, srcFolder);

    let layoutPath = null;
    let layoutParams = dynamicParams;
    let layouts = null;
    if (isLayoutReq) {
      layouts = getLayoutsForLayoutKey(reqSegments, queryObj, srcFolder);
      if (layouts && layouts.length > 0) {
        const leafLayout = layouts[layouts.length - 1];
        layoutPath = leafLayout[0];
        layoutParams = leafLayout[1] || dynamicParams;
      }
    }

    if (!isDynamic.has(cleanPath)) {
      isDynamic.set(cleanPath, { value: false });
    }
    const dynamicState = isLayoutReq ? { value: false } : isDynamic.get(cleanPath);

    const reqPath = cleanPath.endsWith("/") ? cleanPath : cleanPath + "/";
    let isPathBlocked = false;
    let blockedLayoutAncestors = null;

    let layoutConfig = null;
    let pageConfig = null;
    await requestStorage.run(rootContext, async () => {
      // Authoritative perimeter validation (root-to-child layouts, then page) BEFORE any cached RSC hit
      const perimeterLayoutChain = getActiveLayoutChain(reqSegments, queryObj, srcFolder, {
        ignoreNoLayout: isLayoutReq,
        exactLayoutKey: isLayoutReq,
      });
      if (perimeterLayoutChain.length > 0) {
        for (let i = perimeterLayoutChain.length - 1; i >= 0; i--) {
          const entry = perimeterLayoutChain[i];
          const lCfg = await resolveLayoutFunctionsConfig(entry.layoutPath, entry.dParams);
          if (i === 0 && isLayoutReq) {
            layoutConfig = lCfg;
          }
          if (isLayoutReq && lCfg.isDynamic) {
            dynamicState.value = true;
          }
          if (
            await isLayoutSegmentBlocked(
              entry.layoutPath,
              entry.dParams,
              lCfg,
              entry.cleanLayoutKey,
              reqPath,
              isDevelopment,
              Boolean(platformContext?.isSSG),
            )
          ) {
            isPathBlocked = true;
            blockedLayoutAncestors = perimeterLayoutChain.slice(i + 1);
            break;
          }
        }
      } else if (isLayoutReq && layoutPath) {
        layoutConfig = await resolveLayoutFunctionsConfig(layoutPath, layoutParams);
        if (layoutConfig.isDynamic) {
          dynamicState.value = true;
        }
        if (
          await isLayoutSegmentBlocked(
            layoutPath,
            layoutParams,
            layoutConfig,
            undefined,
            reqPath,
            isDevelopment,
            Boolean(platformContext?.isSSG),
          )
        ) {
          isPathBlocked = true;
          blockedLayoutAncestors = [];
        }
      }

      if (!isLayoutReq && !isPathBlocked) {
        pageConfig = await resolvePageFunctionsConfig(
          pagePath,
          reqSegments,
          queryObj,
          dynamicParams,
          reqPath,
          Boolean(platformContext?.isSSG),
        );
        if (pageConfig.isDynamicConfig) {
          dynamicState.value = true;
        }
        isPathBlocked = pageConfig.isPathBlocked;
      }
    });

    if (isPathBlocked) {
      // Emit a valid React Flight 404 payload so soft <Link> navigations render not_found.tsx
      // inside unblocked cached ancestor layouts without crashing Flight deserialization or
      // executing the blocked layout/page.
      const blockedCtx = createRequestContext(simReq, bridge, platformContext, { value: true });
      copyCustomContextProperties(rootContext, blockedCtx);
      await requestStorage.run(blockedCtx, async () => {
        try {
          let blockedJsx = null;
          if (isLayoutReq) {
            const unblockedChain = Array.isArray(blockedLayoutAncestors)
              ? blockedLayoutAncestors
              : [];
            if (unblockedChain.length > 0) {
              const storage = getStorageAdapter();
              await hydrateActiveChainPpr(unblockedChain, reqSegments, queryObj, srcFolder, {
                ignoreNoLayout: true,
              });
              const overrides = new Map();
              for (let i = unblockedChain.length - 1; i >= 0; i--) {
                const entry = unblockedChain[i];
                const lCfg = await resolveLayoutFunctionsConfig(entry.layoutPath, entry.dParams);
                const lMetaKey = entry.cleanLayoutKey
                  ? `${entry.cleanLayoutKey}/layout.metadata.json`
                  : "layout.metadata.json";
                const lRscKey = entry.cleanLayoutKey
                  ? `${entry.cleanLayoutKey}/layout.rsc`
                  : "layout.rsc";
                const lMeta = !isDevelopment
                  ? await readMetaFromStorage(
                      storage,
                      lMetaKey,
                      lRscKey,
                      platformContext,
                      request.url
                    )
                  : null;
                if (isDevelopment || lCfg.isDynamic || lMeta?.dynamic || !lMeta) {
                  const single = await renderSingleLayoutLevel(entry, {
                    reqSegments,
                    queryObj,
                    isDevelopment,
                    usePprContext: false,
                  });
                  if (blockedCtx._hasRedirected) break;
                  if (single && single.ownTree) {
                    overrides.set(entry.cleanLayoutKey || "", single);
                  }
                } else if (
                  lMeta?.ownPpr &&
                  Array.isArray(lMeta.ownHoles) &&
                  lMeta.ownHoles.length > 0
                ) {
                  const spliced = await spliceSingleLayoutOwnHoles(entry, storage, {
                    platformContext,
                    reqUrl: request.url,
                    currentPath: reqPath,
                    reqSegments,
                    queryObj,
                    isDevelopment,
                  });
                  if (blockedCtx._hasRedirected) break;
                  if (spliced && spliced.ownTree) {
                    overrides.set(entry.cleanLayoutKey || "", spliced);
                  }
                }
              }
              if (!blockedCtx._hasRedirected) {
                const composed = await composeLayoutChainFromOwnFragments(
                  unblockedChain,
                  storage,
                  {
                    overrides,
                    platformContext,
                    reqUrl: request.url,
                    currentPath: reqPath,
                  }
                );
                if (composed && composed.layoutOnlyTree) {
                  blockedJsx = composed.layoutOnlyTree;
                }
              }
            }
            if (!blockedJsx) {
              blockedJsx = createDinouPageSlotElement();
            }
          } else {
            blockedJsx = await getJSX(reqPath, queryObj, { value: true }, isDevelopment, true, {
              segment: "page",
            });
          }
          if (bridge.headers.has("x-rsc-redirect") || bridge.headers.has("Location")) {
            return;
          }
          bridge.status(404);
          bridge.setHeader("Content-Type", "text/x-component");
          if (!bridge.headers.has("Cache-Control")) {
            bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
          }
          pipeRSC(blockedJsx, bridge, getClientManifest(), platformContext);
        } catch (blockedErr) {
          if (!bridge.headersSent) {
            bridge.status(404).send("Not Found");
          }
        }
      });
      return bridge.toResponse();
    }

    const nonBuildIdQueryKeys = Object.keys(queryObj);
    const hasQueryParams = nonBuildIdQueryKeys.length > 0;

    const targetFileName = isLayoutReq
      ? isOld
        ? "layout._old.rsc"
        : "layout.rsc"
      : isOld
      ? "page._old.rsc"
      : "page.rsc";

    let isRoutePpr = false;
    let hasDetectedSegmentPpr = false;
    let currentGeneratedAt = null;
    let leafLayoutSuspenseCount = 0;
    if (!isDevelopment) {
      const storage = getStorageAdapter();
      const cleanRel = cleanPath.replace(/^\/+/, "").replace(/\/+$/, "");
      try {
        const activeChain = getActiveLayoutChain(reqSegments, queryObj, srcFolder, {
          ignoreNoLayout: isLayoutReq,
          exactLayoutKey: isLayoutReq,
        });
        if (activeChain.length > 0) {
          for (const entry of activeChain) {
            const lMetaKey = entry.cleanLayoutKey ? `${entry.cleanLayoutKey}/layout.metadata.json` : "layout.metadata.json";
            const lRscKey = entry.cleanLayoutKey ? `${entry.cleanLayoutKey}/layout.rsc` : "layout.rsc";
            const lMeta = await readMetaFromStorage(storage, lMetaKey, lRscKey, platformContext, request.url);
            entry.generatedAt = Number(lMeta?.generatedAt || 0);
            entry.layoutGeneratedAt = Number(lMeta?.layoutGeneratedAt || lMeta?.generatedAt || 0);
            entry.ownGeneratedAt = Number(lMeta?.ownGeneratedAt || lMeta?.layoutGeneratedAt || lMeta?.generatedAt || 0);
            entry.suspenseCount = Number(lMeta?.suspenseCount || 0);
            entry.revalidate = lMeta?.revalidate;
            entry.slotTags = Array.isArray(lMeta?.slotTags) ? lMeta.slotTags : [];
          }
          if (!platformContext?.isSSG && !isOld && !dynamicState.value) {
            for (let i = activeChain.length - 1; i >= 0; i--) {
              const entry = activeChain[i];
              const isLayoutTtlExpired =
                typeof entry.revalidate === "number" &&
                entry.revalidate >= 1 &&
                entry.ownGeneratedAt > 0 &&
                Date.now() > entry.ownGeneratedAt + entry.revalidate * 1000;
              const layoutSlotFreshness =
                !isLayoutTtlExpired && entry.slotTags.length > 0
                  ? await inspectSlotsFreshness(entry.slotTags, entry.generatedAt)
                  : { hasExpired: false, hasNewer: false };
              const isLayoutSlotTtlExpired = layoutSlotFreshness.hasExpired;
              const isLayoutSlotNewer =
                !internalBuildId && layoutSlotFreshness.hasNewer;
              const ancestors =
                i < activeChain.length - 1 ? activeChain.slice(i + 1) : [];
              const maxAncestorGen =
                ancestors.length > 0
                  ? Math.max(0, ...ancestors.map((l) => l.generatedAt || 0))
                  : 0;
              const maxAncestorOwnGen =
                ancestors.length > 0
                  ? Math.max(
                      0,
                      ...ancestors.map((l) => l.layoutGeneratedAt || l.generatedAt || 0)
                    )
                  : 0;
              const entryOwnGen = entry.layoutGeneratedAt || entry.generatedAt || 0;
              const isAncestorOwnNewer =
                entryOwnGen > 0 && maxAncestorOwnGen > entryOwnGen;
              const isAncestorSlotOnlyNewer =
                !isAncestorOwnNewer &&
                entry.generatedAt > 0 &&
                maxAncestorGen > entry.generatedAt;
              const isAncestorNewer = isAncestorOwnNewer || isAncestorSlotOnlyNewer;
              if (
                isLayoutSlotTtlExpired &&
                !isLayoutSlotNewer &&
                !isLayoutTtlExpired &&
                !(isLayoutReq && isAncestorNewer)
              ) {
                const layoutSlotRevalKey = `layout-slot:${entry.layoutRoutePath}`;
                const layoutSlotRevalPromise = (async () => {
                  if (regenerating.has(layoutSlotRevalKey)) return;
                  regenerating.add(layoutSlotRevalKey);
                  try {
                    const { revalidateLayout } = await import("./cache-revalidate.js");
                    await revalidateLayout(entry.layoutRoutePath, { onlyRefreshSlots: true });
                  } catch (err) {
                    console.error(`❌ [Slot ISR] Error refreshing layout slots for ${entry.layoutRoutePath}:`, err);
                  } finally {
                    regenerating.delete(layoutSlotRevalKey);
                  }
                })();
                if (platformContext && platformContext.ctx && typeof platformContext.ctx.waitUntil === "function") {
                  platformContext.ctx.waitUntil(layoutSlotRevalPromise);
                }
              } else if (
                isLayoutTtlExpired ||
                isLayoutSlotNewer ||
                (isLayoutReq && isAncestorNewer)
              ) {
                const { revalidateLayout } = await import("./cache-revalidate.js");
                await revalidateLayout(entry.layoutRoutePath, {
                  recomposeOnly: !isLayoutTtlExpired && !isLayoutSlotNewer && isAncestorOwnNewer,
                  onlyRefreshSlots:
                    !isLayoutTtlExpired &&
                    !isAncestorOwnNewer &&
                    (isLayoutSlotNewer || isAncestorSlotOnlyNewer),
                  onlyIfExpired:
                    isLayoutTtlExpired && !isLayoutSlotNewer && !(isLayoutReq && isAncestorNewer),
                });
                const lMetaKey = entry.cleanLayoutKey
                  ? `${entry.cleanLayoutKey}/layout.metadata.json`
                  : "layout.metadata.json";
                const lRscKey = entry.cleanLayoutKey
                  ? `${entry.cleanLayoutKey}/layout.rsc`
                  : "layout.rsc";
                const refreshedMeta = await readMetaFromStorage(
                  storage,
                  lMetaKey,
                  lRscKey,
                  platformContext,
                  request.url
                );
                if (refreshedMeta?.generatedAt) {
                  entry.generatedAt = Number(refreshedMeta.generatedAt);
                }
                if (refreshedMeta?.layoutGeneratedAt || refreshedMeta?.generatedAt) {
                  entry.layoutGeneratedAt = Number(
                    refreshedMeta.layoutGeneratedAt || refreshedMeta.generatedAt
                  );
                }
                if (
                  refreshedMeta?.ownGeneratedAt ||
                  refreshedMeta?.layoutGeneratedAt ||
                  refreshedMeta?.generatedAt
                ) {
                  entry.ownGeneratedAt = Number(
                    refreshedMeta.ownGeneratedAt ||
                      refreshedMeta.layoutGeneratedAt ||
                      refreshedMeta.generatedAt
                  );
                }
                if (refreshedMeta?.suspenseCount !== undefined) {
                  entry.suspenseCount = Number(refreshedMeta.suspenseCount || 0);
                }
              }
            }
          }
          leafLayoutSuspenseCount = Number(activeChain[0]?.suspenseCount || 0);
        }
      } catch (e) {}

      if (!platformContext?.isSSG) {
        const metaFileName = isLayoutReq ? "layout.metadata.json" : "metadata.json";
        const metaKey = cleanRel ? `${cleanRel}/${metaFileName}` : metaFileName;
        const rscBaseName = isLayoutReq ? "layout.rsc" : "page.rsc";
        const rscBaseKey = cleanRel ? `${cleanRel}/${rscBaseName}` : rscBaseName;
        const edgeMeta = await readMetaFromStorage(storage, metaKey, rscBaseKey, platformContext, request.url);
        if (edgeMeta) {
          currentGeneratedAt = edgeMeta.generatedAt || null;
          if (isLayoutReq) {
            if (edgeMeta.dynamic || edgeMeta.hasDynamicAncestor) {
              dynamicState.value = true;
            }
            if (edgeMeta.ppr !== undefined) {
              isRoutePpr = Boolean(edgeMeta.ppr);
              hasDetectedSegmentPpr = true;
            }
            if (Array.isArray(edgeMeta.holes) && edgeMeta.holes.length > 0) {
              isRoutePpr = true;
              hasDetectedSegmentPpr = true;
            }
          } else if (edgeMeta.pagePpr !== undefined) {
            isRoutePpr = Boolean(edgeMeta.pagePpr);
            hasDetectedSegmentPpr = true;
          } else if (edgeMeta.ppr !== undefined) {
            isRoutePpr = Boolean(edgeMeta.ppr);
            hasDetectedSegmentPpr = true;
          }
        }
      }
    }
    if (!currentGeneratedAt && !platformContext?.isSSG && !isEdgeRuntime(platformContext)) {
      try {
        const metaFileName = isLayoutReq ? "layout.metadata.json" : "metadata.json";
        const metadataPath = path.join(".dinou/dist2", cleanPath, metaFileName);
        if (existsSync(metadataPath)) {
          const metaObj = JSON.parse(readFileSync(metadataPath, "utf8"));
          currentGeneratedAt = metaObj.generatedAt || null;
          if (isLayoutReq) {
            if (metaObj.dynamic || metaObj.hasDynamicAncestor) {
              dynamicState.value = true;
            }
            if (metaObj.ppr !== undefined) {
              isRoutePpr = Boolean(metaObj.ppr);
              hasDetectedSegmentPpr = true;
            }
            if (Array.isArray(metaObj.holes) && metaObj.holes.length > 0) {
              isRoutePpr = true;
              hasDetectedSegmentPpr = true;
            }
          } else if (metaObj.pagePpr !== undefined) {
            isRoutePpr = Boolean(metaObj.pagePpr);
            hasDetectedSegmentPpr = true;
          } else if (metaObj.ppr !== undefined) {
            isRoutePpr = Boolean(metaObj.ppr);
            hasDetectedSegmentPpr = true;
          }
        }
      } catch (e) {}
    }

    if (!hasDetectedSegmentPpr) {
      isRoutePpr = isLayoutReq
        ? await resolvePprForRoute(null, null, reqSegments, queryObj, {
            segment: "layout",
            ignoreNoLayout: true,
            exactLayoutKey: true,
          })
        : pageConfig?.pagePpr !== undefined && pageConfig?.pagePpr !== null
        ? Boolean(pageConfig.pagePpr)
        : await resolvePprForRoute(pagePath, null, reqSegments, queryObj, {
            segment: "page",
          });
    }

    const canServeCachedRsc = isLayoutReq
      ? !isDevelopment &&
        !platformContext?.isSSG &&
        (!dynamicState.value || (isStatic && Boolean(internalBuildId))) &&
        !isRoutePpr
      : !isDevelopment &&
        !platformContext?.isSSG &&
        (!dynamicState.value || (isStatic && Boolean(internalBuildId))) &&
        (!hasQueryParams || isStatic) &&
        !isRoutePpr;

    if (canServeCachedRsc) {
      const hasTimestampComparison = Boolean(
        !internalRefreshVersion && internalBuildId && currentGeneratedAt
      );
      const useOld =
        isOld ||
        (hasTimestampComparison
          ? Number(internalBuildId) < Number(currentGeneratedAt)
          : !isEdgeRuntime(platformContext) &&
            (regenerating.has(reqPath) || regenerating.has(cleanPath)));

      const resolvedTargetFileName = targetFileName;

      const actualFileName = useOld
        ? isLayoutReq
          ? "layout._old.rsc"
          : "page._old.rsc"
        : resolvedTargetFileName;

      let payloadPath = path.resolve(
        ".dinou/dist2",
        cleanPath.replace(/^\//, ""),
        actualFileName,
      );

      if (!existsSync(payloadPath) && useOld) {
        const currentFallbackPath = path.resolve(
          ".dinou/dist2",
          cleanPath.replace(/^\//, ""),
          resolvedTargetFileName,
        );
        if (existsSync(currentFallbackPath)) {
          payloadPath = currentFallbackPath;
        }
      }

      // Legacy fallback for rsc_payload if page.rsc doesn't exist
      if (!existsSync(payloadPath) && !isLayoutReq && !isPageReq) {
        const legacyPath = path.resolve(
          ".dinou/dist2",
          cleanPath.replace(/^\//, ""),
          useOld ? "rsc._old.rsc" : "rsc.rsc",
        );
        if (existsSync(legacyPath)) {
          payloadPath = legacyPath;
        }
      }

      const distDir = path.resolve(".dinou/dist2");
      if (!payloadPath.startsWith(distDir)) {
        return new Response("Forbidden", { status: 403 });
      }

      const storage = getStorageAdapter();
      if (storage) {
        const cleanRel = cleanPath.replace(/^\/+/, "").replace(/\/+$/, "");
        const rscKey = cleanRel ? `${cleanRel}/${actualFileName}` : actualFileName;
        try {
          let cached = await storage.get(rscKey);
          if (
            isLayoutReq &&
            !useOld &&
            !internalRefreshVersion &&
            internalBuildId &&
            cached?.metadata?.generatedAt &&
            Number(internalBuildId) < Number(cached.metadata.generatedAt)
          ) {
            const oldLayoutKey = cleanRel
              ? `${cleanRel}/layout._old.rsc`
              : "layout._old.rsc";
            const oldCached = await storage.get(oldLayoutKey);
            if (oldCached && oldCached.content) {
              cached = oldCached;
            }
          }
          if (!cached && useOld) {
            const fallbackCurrKey = cleanRel
              ? `${cleanRel}/${resolvedTargetFileName}`
              : resolvedTargetFileName;
            cached = await storage.get(fallbackCurrKey);
          }
          if (!cached && !isLayoutReq && !isPageReq) {
            cached = await storage.get(cleanRel ? `${cleanRel}/rsc.rsc` : "rsc.rsc");
          }
          if (cached && cached.content) {
            let isExpired = false;
            let isSlotOnlyExpired = false;
            if (isLayoutReq && cached.metadata) {
              const { revalidate, generatedAt } = cached.metadata;
              if (typeof revalidate === "number" && revalidate >= 1 && Date.now() > (generatedAt || 0) + revalidate * 1000) {
                isExpired = true;
              }
            } else if (!isLayoutReq && !useOld && !internalBuildId) {
              const pMetaKey = cleanRel ? `${cleanRel}/metadata.json` : "metadata.json";
              const pRscBaseKey = cleanRel ? `${cleanRel}/page.rsc` : "page.rsc";
              const pMeta =
                cached.metadata ||
                (await readMetaFromStorage(storage, pMetaKey, pRscBaseKey, platformContext, request.url));
              let isSlotNewer = false;
              if (pMeta) {
                const pReval =
                  pMeta.pageRevalidate !== undefined && pMeta.pageRevalidate !== null
                    ? pMeta.pageRevalidate
                    : pMeta.revalidate;
                const pGen = pMeta.pageGeneratedAt || pMeta.generatedAt || 0;
                if (typeof pReval === "number" && pReval >= 1 && pGen > 0 && Date.now() > pGen + pReval * 1000) {
                  isExpired = true;
                } else if (Array.isArray(pMeta.slotTags) && pMeta.slotTags.length > 0) {
                  const slotFreshness = await inspectSlotsFreshness(
                    pMeta.slotTags,
                    pMeta.generatedAt || 0
                  );
                  isSlotNewer = slotFreshness.hasNewer;
                  isSlotOnlyExpired = !isSlotNewer && slotFreshness.hasExpired;
                }
              }
              if (isSlotNewer && !isExpired) {
                const { revalidatePage } = await import("./cache-revalidate.js");
                await revalidatePage(cleanPath, { onlyRefreshSlots: true });
                const refreshedCached = await storage.get(rscKey);
                if (refreshedCached && refreshedCached.content) {
                  cached = refreshedCached;
                }
              } else if (isSlotOnlyExpired && !isExpired) {
                const slotRevalKey = `slot:${reqPath}`;
                const slotRevalPromise = (async () => {
                  if (
                    regenerating.has(slotRevalKey) ||
                    regenerating.has(reqPath) ||
                    regenerating.has(cleanPath)
                  ) {
                    return;
                  }
                  regenerating.add(slotRevalKey);
                  try {
                    const { revalidatePage } = await import("./cache-revalidate.js");
                    await revalidatePage(cleanPath, { onlyRefreshSlots: true });
                  } catch (err) {
                    console.error(`❌ [Slot ISR] Error refreshing slots for ${cleanPath}:`, err);
                  } finally {
                    regenerating.delete(slotRevalKey);
                  }
                })();
                if (platformContext && platformContext.ctx && typeof platformContext.ctx.waitUntil === "function") {
                  platformContext.ctx.waitUntil(slotRevalPromise);
                }
              } else if (isExpired) {
                if (regenerating.has(reqPath) || regenerating.has(cleanPath)) {
                  isExpired = false;
                } else {
                  regenerating.add(reqPath);
                  try {
                    const { revalidatePage } = await import("./cache-revalidate.js");
                    await revalidatePage(cleanPath, { onlyIfExpired: true });
                  } finally {
                    regenerating.delete(reqPath);
                  }
                  if (!dynamicState.value) {
                    const refreshedCached = await storage.get(rscKey);
                    if (refreshedCached && refreshedCached.content) {
                      cached = refreshedCached;
                      isExpired = false;
                    }
                  } else {
                    isExpired = true;
                  }
                }
              }
            }
            if (!isExpired) {
              const contentStr = typeof cached.content === "string" ? cached.content : "";
              if (!contentStr.trimStart().startsWith("<")) {
                bridge.setHeader("Content-Type", "text/x-component");
                if (!bridge.headers.has("Cache-Control")) {
  bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
}
                bridge.end(cached.content);
                return bridge.toResponse();
              }
            }
          }
        } catch (e) {}

        const isRscDeleted =
          typeof storage.isKeyDeleted === "function"
            ? await storage.isKeyDeleted(rscKey)
            : typeof storage.isDeleted === "function" && storage.isDeleted(rscKey);

        if (
          platformContext &&
          platformContext.env &&
          platformContext.env.ASSETS &&
          !isRscDeleted
        ) {
          try {
            const assetRes = await fetchCloudflareDist2Asset(
              platformContext.env.ASSETS,
              rscKey,
              request.url
            );
            if (assetRes && assetRes.status === 200) {
              const contentType = assetRes.headers.get("content-type") || "";
              const rscContent = await assetRes.text();
              if (
                rscContent &&
                rscContent.trim().length > 0 &&
                !contentType.includes("text/html") &&
                !rscContent.trimStart().startsWith("<")
              ) {
                await storage.set(rscKey, rscContent);
                bridge.setHeader("Content-Type", "text/x-component");
                if (!bridge.headers.has("Cache-Control")) {
  bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
}
                bridge.end(rscContent);
                return bridge.toResponse();
              }
            }
          } catch (e) {}
        }

        if (!isRscDeleted) {
          const dist2Rsc = await readDist2Fallback(storage, rscKey);
          if (
            dist2Rsc &&
            typeof dist2Rsc.content === "string" &&
            dist2Rsc.content.trim().length > 0 &&
            !dist2Rsc.content.trimStart().startsWith("<")
          ) {
            bridge.setHeader("Content-Type", "text/x-component");
            if (!bridge.headers.has("Cache-Control")) {
  bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
}
            bridge.end(dist2Rsc.content);
            return bridge.toResponse();
          }
        }
      } else if (existsSync(payloadPath)) {
        try {
          const buffer = readFileSync(payloadPath);
          if (buffer && buffer.length > 0) {
            bridge.setHeader("Content-Type", "application/octet-stream");
            if (!bridge.headers.has("Cache-Control")) {
  bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
}
            bridge.end(buffer);
            return bridge.toResponse();
          }
        } catch (err) {
          console.error("[Dinou] Error reading RSC file:", err);
          return new Response("Internal Server Error", { status: 500 });
        }
      }
    }

    // Perimeter checks (root-to-child layouts + page) already ran authoritatively above before cache lookup.
    if (isPathBlocked) {
      return new Response("Not Found", { status: 404 });
    }

    const rscDynamicState = isLayoutReq ? dynamicState : (isRoutePpr ? { value: false } : dynamicState);
    const context = createRequestContext(simReq, bridge, platformContext, rscDynamicState);
    copyCustomContextProperties(rootContext, context);
    const isNotFound = {};
    const segment = isLayoutReq ? "layout" : "page";

    await requestStorage.run(context, async () => {
      try {
        let jsx;
        if (platformContext?.isSSG) {
          let handledPerLevelSsgLayout = false;
          if (isLayoutReq) {
            try {
              const storage = getStorageAdapter();
              const cleanRel = cleanPath.replace(/^\/+/, "").replace(/\/+$/, "");
              const activeChain = getActiveLayoutChain(reqSegments, queryObj, srcFolder, {
                ignoreNoLayout: true,
                exactLayoutKey: true,
              });
              if (activeChain.length > 0 && activeChain[0].cleanLayoutKey === cleanRel) {
                await hydrateActiveChainPpr(activeChain, reqSegments, queryObj, srcFolder, {
                  ignoreNoLayout: true,
                  exactLayoutKey: true,
                });
                const leafEntry = activeChain[0];
                const leafLayoutCfg = await resolveLayoutFunctionsConfig(
                  leafEntry.layoutPath,
                  leafEntry.dParams
                );
                // Isolate THIS layout level's own dynamic state from any dynamic ancestor
                // so a static L3 underneath a dynamic L2 still persists its own shell.layout.own.json!
                const ownDynamicState = { value: Boolean(leafLayoutCfg.isDynamic) };
                const ownCtx = createRequestContext(
                  simReq,
                  bridge,
                  platformContext,
                  ownDynamicState
                );
                copyCustomContextProperties(rootContext, ownCtx);
                const single = await requestStorage.run(ownCtx, () =>
                  renderSingleLayoutLevel(leafEntry, {
                    reqSegments,
                    queryObj,
                    isDevelopment,
                    usePprContext: true,
                  })
                );
                if (ownDynamicState.value) {
                  bridge.setHeader("X-Dinou-Dynamic", "true");
                  if (single && single.ownTree) {
                    jsx = single.ownTree;
                    handledPerLevelSsgLayout = true;
                  }
                } else if (single && single.ownTree) {
                  const ownKey = cleanRel
                    ? `${cleanRel}/shell.layout.own.json`
                    : "shell.layout.own.json";
                  try {
                    await storage.set(ownKey, serializeJSX(single.ownTree));
                  } catch (e) {}
                  bridge.setHeader("X-Dinou-Own-Static", "true");
                  bridge.setHeader(
                    "X-Dinou-Own-Suspense-Count",
                    String(single.ownSuspenseCount || 0)
                  );
                  bridge.setHeader(
                    "X-Dinou-Own-Ppr",
                    single.effectivePpr ? "true" : "false"
                  );
                  if (Array.isArray(single.ownHoles)) {
                    bridge.setHeader(
                      "X-Dinou-Own-Ppr-Holes",
                      JSON.stringify(single.ownHoles)
                    );
                  }
                  if (Array.isArray(single.ownSlotTags)) {
                    bridge.setHeader(
                      "X-Dinou-Own-Slot-Tags",
                      JSON.stringify(single.ownSlotTags)
                    );
                  }
                  const overrides = new Map([[cleanRel, single]]);
                  const composed = await composeLayoutChainFromOwnFragments(
                    activeChain,
                    storage,
                    {
                      overrides,
                      platformContext,
                      reqUrl: request.url,
                      currentPath: reqPath,
                    }
                  );
                  if (composed && composed.layoutOnlyTree) {
                    const shellLayoutKey = cleanRel
                      ? `${cleanRel}/shell.layout.json`
                      : "shell.layout.json";
                    try {
                      await storage.set(
                        shellLayoutKey,
                        serializeJSX(composed.layoutOnlyTree)
                      );
                    } catch (e) {}
                    if (composed.slotTags.length > 0) {
                      bridge.setHeader(
                        "X-Dinou-Slot-Tags",
                        JSON.stringify(composed.slotTags)
                      );
                    }
                    if (composed.holes.length > 0) {
                      bridge.setHeader(
                        "X-Dinou-Ppr-Holes",
                        JSON.stringify(composed.holes)
                      );
                    }
                    if (composed.anyLayoutPpr) {
                      bridge.setHeader("X-Dinou-Ppr", "true");
                    }
                    bridge.setHeader(
                      "X-Dinou-Suspense-Count",
                      String(composed.suspenseCount || 0)
                    );
                    jsx = composed.layoutOnlyTree;
                    handledPerLevelSsgLayout = true;
                  } else {
                    // This layout level itself is static, but an ancestor layout is dynamic.
                    // Keep shell.layout.own.json and mark metadata with hasDynamicAncestor
                    // instead of falsely marking THIS layout dynamic:true!
                    bridge.setHeader("X-Dinou-Has-Dynamic-Ancestor", "true");
                    if (Array.isArray(single.ownSlotTags) && single.ownSlotTags.length > 0) {
                      bridge.setHeader(
                        "X-Dinou-Slot-Tags",
                        JSON.stringify(single.ownSlotTags)
                      );
                    }
                    jsx = single.ownTree;
                    handledPerLevelSsgLayout = true;
                  }
                }
              }
            } catch (e) {
              handledPerLevelSsgLayout = false;
            }
          }
          if (!handledPerLevelSsgLayout) {
            const ssgIsPpr = isLayoutReq
              ? Boolean(
                  isRoutePpr ||
                    (await resolvePprForRoute(null, null, reqSegments, queryObj, {
                      segment: "layout",
                      ignoreNoLayout: true,
                      exactLayoutKey: true,
                    })),
                )
              : Boolean(isRoutePpr);
            jsx = await runWithPprContext({ isPpr: ssgIsPpr }, async () => {
              const rawJsx = await getJSX(reqPath, queryObj, isNotFound, isDevelopment, isPathBlocked, {
                segment,
              });
              const startIdx = isLayoutReq ? 0 : leafLayoutSuspenseCount;
              resetPprHoles(startIdx);
              const runSeg = isLayoutReq ? runInLayoutSegment : runInPageSegment;
              const rendered = await runSeg(() => asyncRenderJSXToClientJSX(rawJsx));
              const slotTagSet = isLayoutReq
                ? context._layoutSlotTags || context._slotTags
                : context._pageSlotTags || context._slotTags;
              if (slotTagSet && slotTagSet.size > 0) {
                bridge.setHeader("X-Dinou-Slot-Tags", JSON.stringify(Array.from(slotTagSet)));
              }
              const regHoles = getRegisteredHoles();
              if (regHoles.length > 0) {
                bridge.setHeader("X-Dinou-Ppr-Holes", JSON.stringify(regHoles));
              }
              if (isLayoutReq && ssgIsPpr) {
                bridge.setHeader("X-Dinou-Ppr", "true");
              }
              bridge.setHeader("X-Dinou-Suspense-Count", String(getPprHoleCounter()));
              if (rscDynamicState.value) {
                bridge.setHeader("X-Dinou-Dynamic", "true");
              }
              if (rendered && !rscDynamicState.value) {
                try {
                  const storage = getStorageAdapter();
                  const cleanRel = cleanPath.replace(/^\/+/, "").replace(/\/+$/, "");
                  const shellPageKey = isLayoutReq ? (cleanRel ? `${cleanRel}/shell.layout.json` : "shell.layout.json") : (cleanRel ? `${cleanRel}/shell.page.json` : "shell.page.json");
                  await storage.set(shellPageKey, serializeJSX(rendered));
                } catch (e) {}
              }
              return rendered;
            });
          }
        } else if (!isDevelopment && !dynamicState.value && (isPageReq || isLayoutReq) && isRoutePpr) {
          const storage = getStorageAdapter();
          const cleanRel = cleanPath.replace(/^\/+/, "").replace(/\/+$/, "");
          const shellKey = isLayoutReq
            ? cleanRel
              ? `${cleanRel}/shell.layout.json`
              : "shell.layout.json"
            : cleanRel
            ? `${cleanRel}/shell.page.json`
            : "shell.page.json";
          // Snapshot shellJson BEFORE launching any background slot SWR so this response stays consistent.
          const shellJson = await readRscFromStorage(
            storage,
            shellKey,
            platformContext,
            request.url
          );
          if (isPageReq) {
            try {
              const pMetaKey = cleanRel ? `${cleanRel}/metadata.json` : "metadata.json";
              const pRscBaseKey = cleanRel ? `${cleanRel}/page.rsc` : "page.rsc";
              const pMeta = await readMetaFromStorage(storage, pMetaKey, pRscBaseKey, platformContext, request.url);
              if (pMeta && Array.isArray(pMeta.slotTags) && pMeta.slotTags.length > 0) {
                const isPprPageSlotExpired = await hasExpiredSlots(pMeta.slotTags);
                if (isPprPageSlotExpired) {
                  const slotRevalKey = `slot:${reqPath}`;
                  const slotRevalPromise = (async () => {
                    if (regenerating.has(slotRevalKey) || regenerating.has(reqPath)) return;
                    regenerating.add(slotRevalKey);
                    try {
                      const { revalidatePage } = await import("./cache-revalidate.js");
                      await revalidatePage(reqPath, { onlyRefreshSlots: true });
                    } catch (err) {
                      console.error(`❌ [Slot ISR] Error refreshing slots for ${reqPath}:`, err);
                    } finally {
                      regenerating.delete(slotRevalKey);
                    }
                  })();
                  if (platformContext && platformContext.ctx && typeof platformContext.ctx.waitUntil === "function") {
                    platformContext.ctx.waitUntil(slotRevalPromise);
                  }
                }
              }
            } catch (e) {}
          }
          if (shellJson) {
            context._isPprRuntimeResume = true;
            try {
              let cachedShellTree = deserializeJSX(shellJson);
              const runSeg = isLayoutReq ? runInLayoutSegment : runInPageSegment;
              const slotScope = isLayoutReq ? "__layout_shell__" : "__ppr_shell__";
              cachedShellTree = await runSeg(() =>
                refreshNestedSlotsInTree(
                  cachedShellTree,
                  slotScope,
                  { currentPath: reqPath }
                )
              );
              jsx = await spliceDynamicHolesIntoShell(
                cachedShellTree,
                () =>
                  getJSX(reqPath, queryObj, isNotFound, isDevelopment, isPathBlocked, { skipLayoutProbe: true,
                    segment,
                  }),
                isLayoutReq ? 0 : leafLayoutSuspenseCount
              );
            } catch (spliceErr) {
              console.warn(`[Dinou PPR] Error splicing dynamic holes for ${reqPath}:`, spliceErr);
            }
          }
          if (!jsx && isLayoutReq && !isDevelopment && !platformContext?.isSSG) {
            context._isPprRuntimeResume = false;
            try {
              const activeChain = getActiveLayoutChain(reqSegments, queryObj, srcFolder, {
                ignoreNoLayout: true,
                exactLayoutKey: true,
              });
              if (activeChain.length > 0) {
                await hydrateActiveChainPpr(activeChain, reqSegments, queryObj, srcFolder, {
                  ignoreNoLayout: true,
                  exactLayoutKey: true,
                });
                const overrides = new Map();
                for (let i = activeChain.length - 1; i >= 0; i--) {
                  const entry = activeChain[i];
                  const lCfg = await resolveLayoutFunctionsConfig(entry.layoutPath, entry.dParams);
                  const lMetaKey = entry.cleanLayoutKey
                    ? `${entry.cleanLayoutKey}/layout.metadata.json`
                    : "layout.metadata.json";
                  const lRscKey = entry.cleanLayoutKey
                    ? `${entry.cleanLayoutKey}/layout.rsc`
                    : "layout.rsc";
                  const lMeta = await readMetaFromStorage(
                    storage,
                    lMetaKey,
                    lRscKey,
                    platformContext,
                    request.url
                  );
                  if (lCfg.isDynamic || lMeta?.dynamic || !lMeta) {
                    const single = await renderSingleLayoutLevel(entry, {
                      reqSegments,
                      queryObj,
                      isDevelopment,
                      usePprContext: false,
                    });
                    if (context._hasRedirected) break;
                    if (single && single.ownTree) {
                      overrides.set(entry.cleanLayoutKey || "", single);
                    }
                  } else if (
                    lMeta?.ownPpr &&
                    Array.isArray(lMeta.ownHoles) &&
                    lMeta.ownHoles.length > 0
                  ) {
                    const spliced = await spliceSingleLayoutOwnHoles(entry, storage, {
                      platformContext,
                      reqUrl: request.url,
                      currentPath: reqPath,
                      reqSegments,
                      queryObj,
                      isDevelopment,
                    });
                    if (context._hasRedirected) break;
                    if (spliced && spliced.ownTree) {
                      overrides.set(entry.cleanLayoutKey || "", spliced);
                    }
                  }
                }
                if (!context._hasRedirected) {
                  const composed = await composeLayoutChainFromOwnFragments(
                    activeChain,
                    storage,
                    {
                      overrides,
                      platformContext,
                      reqUrl: request.url,
                      currentPath: reqPath,
                    }
                  );
                  if (composed && composed.layoutOnlyTree) {
                    jsx = composed.layoutOnlyTree;
                  }
                }
              }
            } catch (e) {}
          }
          if (!jsx && !context._hasRedirected) {
            context._isPprRuntimeResume = false;
            jsx = await getJSX(reqPath, queryObj, isNotFound, isDevelopment, isPathBlocked, {
              segment,
            });
          }
        } else {
          if (
            !isDevelopment &&
            !platformContext?.isSSG &&
            isLayoutReq &&
            dynamicState.value
          ) {
            try {
              const storage = getStorageAdapter();
              const activeChain = getActiveLayoutChain(reqSegments, queryObj, srcFolder, {
                ignoreNoLayout: true,
                exactLayoutKey: true,
              });
              if (activeChain.length > 0) {
                await hydrateActiveChainPpr(activeChain, reqSegments, queryObj, srcFolder, {
                  ignoreNoLayout: true,
                  exactLayoutKey: true,
                });
                const overrides = new Map();
                let failedRscLayoutIdx = -1;
                let failedRscLayoutErr = null;
                for (let i = activeChain.length - 1; i >= 0; i--) {
                  const entry = activeChain[i];
                  const lCfg = await resolveLayoutFunctionsConfig(entry.layoutPath, entry.dParams);
                  const lMetaKey = entry.cleanLayoutKey
                    ? `${entry.cleanLayoutKey}/layout.metadata.json`
                    : "layout.metadata.json";
                  const lRscKey = entry.cleanLayoutKey
                    ? `${entry.cleanLayoutKey}/layout.rsc`
                    : "layout.rsc";
                  let lMeta = await readMetaFromStorage(
                    storage,
                    lMetaKey,
                    lRscKey,
                    platformContext,
                    request.url
                  );
                  if (lCfg.isDynamic || lMeta?.dynamic) {
                    try {
                      const single = await renderSingleLayoutLevel(entry, {
                        reqSegments,
                        queryObj,
                        isDevelopment,
                        usePprContext: false,
                      });
                      if (context._hasRedirected) break;
                      if (single && single.ownTree) {
                        overrides.set(entry.cleanLayoutKey || "", single);
                      }
                    } catch (layoutErr) {
                      failedRscLayoutIdx = i;
                      failedRscLayoutErr = layoutErr;
                      break;
                    }
                  } else if (lMeta) {
                    const ownGen = Number(
                      lMeta.ownGeneratedAt ||
                        lMeta.layoutGeneratedAt ||
                        lMeta.generatedAt ||
                        0
                    );
                    const lReval =
                      typeof lMeta.revalidate === "number"
                        ? lMeta.revalidate
                        : lCfg.revalidate;
                    const lSlotTags = Array.from(
                      new Set([
                        ...(Array.isArray(lMeta.ownSlotTags) ? lMeta.ownSlotTags : []),
                        ...(Array.isArray(lMeta.slotTags) ? lMeta.slotTags : []),
                      ])
                    );
                    if (
                      typeof lReval === "number" &&
                      lReval >= 1 &&
                      ownGen > 0 &&
                      Date.now() > ownGen + lReval * 1000
                    ) {
                      const { revalidateLayout } = await import("./cache-revalidate.js");
                      await revalidateLayout(entry.layoutRoutePath, {
                        onlyIfExpired: true,
                      });
                      lMeta =
                        (await readMetaFromStorage(
                          storage,
                          lMetaKey,
                          lRscKey,
                          platformContext,
                          request.url
                        )) || lMeta;
                    } else if (lSlotTags.length > 0) {
                      const lSlotFresh = await inspectSlotsFreshness(
                        lSlotTags,
                        lMeta.generatedAt || 0
                      );
                      if (lSlotFresh.hasNewer) {
                        const { revalidateLayout } = await import("./cache-revalidate.js");
                        await revalidateLayout(entry.layoutRoutePath, {
                          onlyRefreshSlots: true,
                        });
                        lMeta =
                          (await readMetaFromStorage(
                            storage,
                            lMetaKey,
                            lRscKey,
                            platformContext,
                            request.url
                          )) || lMeta;
                      } else if (lSlotFresh.hasExpired) {
                        const layoutSlotRevalKey = `layout-slot:${entry.layoutRoutePath}`;
                        const lSlotPromise = (async () => {
                          if (regenerating.has(layoutSlotRevalKey)) return;
                          regenerating.add(layoutSlotRevalKey);
                          try {
                            const { revalidateLayout } = await import("./cache-revalidate.js");
                            await revalidateLayout(entry.layoutRoutePath, {
                              onlyRefreshSlots: true,
                            });
                          } catch (err) {
                            console.error(
                              `❌ [Slot ISR] Error refreshing layout slots for ${entry.layoutRoutePath}:`,
                              err
                            );
                          } finally {
                            regenerating.delete(layoutSlotRevalKey);
                          }
                        })();
                        if (
                          platformContext?.ctx &&
                          typeof platformContext.ctx.waitUntil === "function"
                        ) {
                          platformContext.ctx.waitUntil(lSlotPromise);
                        }
                      }
                    }
                    if (
                      lMeta?.ownPpr &&
                      Array.isArray(lMeta.ownHoles) &&
                      lMeta.ownHoles.length > 0
                    ) {
                      const spliced = await spliceSingleLayoutOwnHoles(entry, storage, {
                        platformContext,
                        reqUrl: request.url,
                        currentPath: reqPath,
                        reqSegments,
                        queryObj,
                        isDevelopment,
                      });
                      if (context._hasRedirected) break;
                      if (spliced && spliced.ownTree) {
                        overrides.set(entry.cleanLayoutKey || "", spliced);
                      }
                    }
                  }
                }
                if (!context._hasRedirected && failedRscLayoutIdx >= 0 && failedRscLayoutErr) {
                  const healthyAncestors = activeChain.slice(failedRscLayoutIdx + 1);
                  if (healthyAncestors.length > 0) {
                    const serializedLayoutErr = {
                      message: isDevelopment
                        ? (failedRscLayoutErr?.message ||
                            "An error occurred in the Server Components render")
                        : "An error occurred in the Server Components render",
                      name: failedRscLayoutErr?.name || "Error",
                      stack: isDevelopment ? failedRscLayoutErr?.stack : undefined,
                    };
                    const errPageJsx = await getErrorJSX(
                      reqPath,
                      queryObj,
                      serializedLayoutErr,
                      isDevelopment,
                      { segment: "page" }
                    );
                    const composedHealthy = await composeLayoutChainFromOwnFragments(
                      healthyAncestors,
                      storage,
                      {
                        overrides,
                        platformContext,
                        reqUrl: request.url,
                        currentPath: reqPath,
                      }
                    );
                    if (composedHealthy && composedHealthy.composedWithPlaceholder) {
                      jsx = replaceLayoutChildrenPlaceholder(
                        composedHealthy.composedWithPlaceholder,
                        errPageJsx
                      );
                      bridge.status(500);
                      bridge.setHeader("x-dinou-has-error", "true");
                    }
                  }
                } else if (!context._hasRedirected && overrides.size > 0) {
                  const composed = await composeLayoutChainFromOwnFragments(
                    activeChain,
                    storage,
                    {
                      overrides,
                      platformContext,
                      reqUrl: request.url,
                      currentPath: reqPath,
                    }
                  );
                  if (composed && composed.layoutOnlyTree) {
                    jsx = composed.layoutOnlyTree;
                  }
                }
              }
            } catch (e) {}
          }
          if (!jsx && !context._hasRedirected) {
            jsx = await getJSX(reqPath, queryObj, isNotFound, isDevelopment, isPathBlocked, {
              segment,
            });
          }
        }
        if (bridge.headers.has("x-rsc-redirect") || bridge.headers.has("Location")) {
          return;
        }
        if ((isNotFound.value && !isLayoutReq) || isPathBlocked) {
          bridge.status(404);
        }
        bridge.setHeader("Content-Type", "text/x-component");
        if (!bridge.headers.has("Cache-Control")) {
  bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
}

        const manifest = getClientManifest();
        pipeRSC(jsx, bridge, manifest, platformContext);
      } catch (err) {
        if (bridge.headers.has("x-rsc-redirect") || bridge.headers.has("Location")) {
          return;
        }
        console.error(`[Dinou] Error rendering RSC ${segment}:`, err);
        const serializedError = {
          message: isDevelopment
            ? (err.message || "An error occurred in the Server Components render")
            : "An error occurred in the Server Components render",
          name: err.name || "Error",
          stack: isDevelopment ? err.stack : undefined,
        };
        const errJsx = await getErrorJSX(reqPath, queryObj, serializedError, isDevelopment, { segment });
        bridge.status(500);
        const manifest = getClientManifest();
        pipeRSC(errJsx, bridge, manifest, platformContext);
      }
    });

    return bridge.toResponse();
  }

  // 7. Page SSR HTML & ISG/ISR (GET /*)
  const reqSegments = pathname.split("/").filter(Boolean);
  const srcFolder = path.resolve(process.cwd(), "src");
  const [pagePath, dynamicParams] = getFilePathAndDynamicParams(reqSegments, queryObj, srcFolder);

  if (!pagePath && path.extname(pathname)) {
    return new Response("Not Found", { status: 404 });
  }

  const reqPath = pathname.endsWith("/") ? pathname : pathname + "/";
  if (!isDynamic.has(reqPath)) {
    isDynamic.set(reqPath, { value: false });
  }
  const pageDynamicStateRef = isDynamic.get(reqPath);
  let dynamicState = pageDynamicStateRef;
  if (platformContext?.isSSG) {
    dynamicState.value = false;
  }

  const layouts = getFilePathAndDynamicParams(
    reqSegments,
    queryObj,
    srcFolder,
    "layout",
    true,
    false,
    undefined,
    0,
    {},
    true
  );

  let isPathBlocked = false;
  let blockedLayoutIdx = -1;
  let allowISGValue = true;
  let isDynamicConfig = false;
  let revalidate = undefined;
  let tags = [];
  let isPprConfig = false;
  let isPagePprConfig = false;
  let hasStaticDynamicConfig = false;
  let hasDynamicLayoutConfig = false;
  let combinedTags = [];
  let combinedRevalidate = undefined;

  // 1. Evaluate ancestor layouts root-to-child FIRST so a parent layout perimeter guard
  // (`validateParams` returning false or `allowISG: false`) halts before child layouts/pages run.
  const activeLayoutsForRoute = getActiveLayoutChain(reqSegments, queryObj, srcFolder);
  if (activeLayoutsForRoute.length > 0) {
    await requestStorage.run(rootContext, async () => {
      for (let i = activeLayoutsForRoute.length - 1; i >= 0; i--) {
        const entry = activeLayoutsForRoute[i];
        const layoutConfig = await resolveLayoutFunctionsConfig(entry.layoutPath, entry.dParams);
        entry.isDynamicConfig = Boolean(layoutConfig.isDynamic);
        entry.revalidate = layoutConfig.revalidate;

        if (
          await isLayoutSegmentBlocked(
            entry.layoutPath,
            entry.dParams,
            layoutConfig,
            entry.cleanLayoutKey,
            reqPath,
            isDevelopment,
            Boolean(platformContext?.isSSG),
          )
        ) {
          isPathBlocked = true;
          blockedLayoutIdx = i;
          allowISGValue = false;
          break;
        }

        if (layoutConfig.isDynamic) {
          // Do NOT mutate shared pageDynamicStateRef: a dynamic layout must never poison
          // /____rsc_page____/<route> caching for static child pages underneath it!
          dynamicState = { value: true };
          hasStaticDynamicConfig = true;
          hasDynamicLayoutConfig = true;
        } else if (
          !isDevelopment &&
          !platformContext?.isSSG
        ) {
          try {
            const storageForMeta = getStorageAdapter();
            const lMetaKey = entry.cleanLayoutKey
              ? `${entry.cleanLayoutKey}/layout.metadata.json`
              : "layout.metadata.json";
            const lRscKey = entry.cleanLayoutKey
              ? `${entry.cleanLayoutKey}/layout.rsc`
              : "layout.rsc";
            const lMeta = await readMetaFromStorage(
              storageForMeta,
              lMetaKey,
              lRscKey,
              platformContext,
              request.url
            );
            if (lMeta?.dynamic) {
              entry.isDynamicConfig = true;
              dynamicState = { value: true };
              hasDynamicLayoutConfig = true;
            }
          } catch (e) {}
        }

        if (typeof layoutConfig.revalidate === "number" && layoutConfig.revalidate >= 0) {
          if (typeof combinedRevalidate === "number") {
            combinedRevalidate = Math.min(combinedRevalidate, layoutConfig.revalidate);
          } else {
            combinedRevalidate = layoutConfig.revalidate;
          }
        }

        if (Array.isArray(layoutConfig.tags)) {
          for (const t of layoutConfig.tags) {
            if (!combinedTags.includes(t)) {
              combinedTags.push(t);
            }
          }
        }
      }
    });
  }

  // 2. Evaluate page_functions only when no ancestor layout blocked the request
  if (!isPathBlocked) {
    const pageCfg = await requestStorage.run(rootContext, () =>
      resolvePageFunctionsConfig(
        pagePath,
        reqSegments,
        queryObj,
        dynamicParams,
        reqPath,
        Boolean(platformContext?.isSSG),
      )
    );
    isPathBlocked = pageCfg.isPathBlocked;
    allowISGValue = pageCfg.allowISGValue;
    isDynamicConfig = pageCfg.isDynamicConfig;
    revalidate = pageCfg.revalidate;
    tags = pageCfg.tags;
    isPprConfig = pageCfg.ppr;
    isPagePprConfig = pageCfg.pagePpr;

    if (isDynamicConfig) {
      pageDynamicStateRef.value = true;
      dynamicState.value = true;
      hasStaticDynamicConfig = true;
    }

    if (typeof revalidate === "number" && revalidate >= 0) {
      if (typeof combinedRevalidate === "number") {
        combinedRevalidate = Math.min(combinedRevalidate, revalidate);
      } else {
        combinedRevalidate = revalidate;
      }
    }

    if (Array.isArray(tags)) {
      const merged = [...tags];
      for (const t of combinedTags) {
        if (!merged.includes(t)) {
          merged.push(t);
        }
      }
      combinedTags = merged;
    }
  }

  // Unified Runtime (Edge, Dual-Bundle & Classic Node with HTML renderer): ISR, ISG & 3D Caching Cube Delivery
  if (isEdgeRuntime(platformContext) || typeof platformContext?.renderHtmlStream === "function") {
    const cleanPath = reqPath.replace(/^\/+/, "").replace(/\/+$/, "");
    const storage = getStorageAdapter();
    const htmlKey = cleanPath ? `${cleanPath}/index.html` : "index.html";
    const metaKey = cleanPath ? `${cleanPath}/metadata.json` : "metadata.json";

    // 1. Check storageAdapter (production only)
    let cachedItem = null;
    if (!isDevelopment) {
      cachedItem = await storage.get(htmlKey);
      if (!cachedItem) {
        cachedItem = await storage.get(cleanPath);
      }
      if (!cachedItem && isPprConfig) {
        const shellHtmlKey = cleanPath ? `${cleanPath}/shell.html` : "shell.html";
        cachedItem = await storage.get(shellHtmlKey);
      }
    }

    // 2. If not in storageAdapter, check env.ASSETS or local .dinou/dist2 for pre-rendered build static page
    const checkDeleted = async (k) =>
      typeof storage.isKeyDeleted === "function"
        ? await storage.isKeyDeleted(k)
        : typeof storage.isDeleted === "function" && storage.isDeleted(k);
    const isRouteDeletedInStorage =
      (await checkDeleted(htmlKey)) ||
      (await checkDeleted(metaKey)) ||
      (cleanPath ? await checkDeleted(cleanPath) : false);
    if (!isDevelopment && !cachedItem && !isRouteDeletedInStorage && platformContext && platformContext.env && platformContext.env.ASSETS) {
      try {
        const metaRes = await fetchCloudflareDist2Asset(
          platformContext.env.ASSETS,
          metaKey,
          request.url
        );
        if (metaRes && metaRes.status === 200) {
          const ct = metaRes.headers.get("content-type") || "";
          if (ct.includes("json") || !ct.includes("html")) {
            let metadata = null;
            try {
              metadata = await metaRes.json();
            } catch (e) {}

            if (metadata && typeof metadata === "object" && metadata.generatedAt) {
              const assetRes = await fetchCloudflareDist2Asset(
                platformContext.env.ASSETS,
                htmlKey,
                request.url
              );
              if (assetRes && assetRes.status === 200) {
                const html = await assetRes.text();
                cachedItem = {
                  content: html,
                  metadata,
                };
                await storage.set(htmlKey, html, cachedItem.metadata);
                await storage.set(metaKey, JSON.stringify(cachedItem.metadata));
                const layoutMetaKey = cleanPath ? `${cleanPath}/layout.metadata.json` : "layout.metadata.json";
                try {
                  const layoutMetaRes = await fetchCloudflareDist2Asset(
                    platformContext.env.ASSETS,
                    layoutMetaKey,
                    request.url
                  );
                  if (layoutMetaRes && layoutMetaRes.status === 200) {
                    const layoutMetaText = await layoutMetaRes.text();
                    await storage.set(layoutMetaKey, layoutMetaText);
                  }
                } catch (e) {}
              }
            }
          }
        }
      } catch (e) {}
    }

    if (!isDevelopment && !cachedItem && !isRouteDeletedInStorage) {
      cachedItem = await readDist2Fallback(storage, htmlKey);
      if (!cachedItem && isPprConfig) {
        const shellHtmlKey = cleanPath ? `${cleanPath}/shell.html` : "shell.html";
        cachedItem = await readDist2Fallback(storage, shellHtmlKey);
      }
      if (cachedItem) {
        const layoutMetaKey = cleanPath ? `${cleanPath}/layout.metadata.json` : "layout.metadata.json";
        await readDist2Fallback(storage, layoutMetaKey);
      }
    }

    // 2b. If PPR route shell was invalidated (e.g. by revalidateTag on a static shell slot),
    // or is a dynamic-param ISG route being visited for the first time,
    // regenerate the static shell in an isolated SSG pass before resuming dynamic holes.
    const shellHtmlKeyForCheck = cleanPath ? `${cleanPath}/shell.html` : "shell.html";
    const isShellDeletedInStorage =
      isRouteDeletedInStorage || (await checkDeleted(shellHtmlKeyForCheck));
    const hasDynamicUrlParams = Boolean(dynamicParams && Object.keys(dynamicParams).length > 0);
    if (
      !isDevelopment &&
      !cachedItem &&
      !dynamicState.value &&
      isPprConfig &&
      (isShellDeletedInStorage || (hasDynamicUrlParams && allowISGValue !== false)) &&
      !isPathBlocked &&
      queryObj.ssr_crash !== "true" &&
      !platformContext?.isSSG
    ) {
      const newlyPopulatedLayoutKeys = [];
      try {
        if (hasDynamicUrlParams && activeLayoutsForRoute.length > 0) {
          for (let i = activeLayoutsForRoute.length - 1; i >= 0; i--) {
            const entry = activeLayoutsForRoute[i];
            if (entry.isDynamicConfig) continue;
            const ownKey = entry.cleanLayoutKey
              ? `${entry.cleanLayoutKey}/shell.layout.own.json`
              : "shell.layout.own.json";
            const lMetaKey = entry.cleanLayoutKey
              ? `${entry.cleanLayoutKey}/layout.metadata.json`
              : "layout.metadata.json";
            const lRscKey = entry.cleanLayoutKey
              ? `${entry.cleanLayoutKey}/layout.rsc`
              : "layout.rsc";
            const [existingOwn, existingMeta] = await Promise.all([
              readStorageArtifact(storage, ownKey, platformContext, request.url),
              readMetaFromStorage(storage, lMetaKey, lRscKey, platformContext, request.url),
            ]);
            if (existingMeta?.dynamic) continue;
            if (!existingOwn || !existingMeta) {
              const { revalidateLayout } = await import("./cache-revalidate.js");
              const didPopulate = await revalidateLayout(entry.layoutRoutePath);
              if (didPopulate && entry.cleanLayoutKey) {
                newlyPopulatedLayoutKeys.push(entry.cleanLayoutKey);
              }
            }
          }
        }
        const ssgUrl = new URL(reqPath, request.url);
        const ssgReq = new Request(ssgUrl.href, { method: "GET" });
        const ssgRes = await handleRequest(ssgReq, {
          ...platformContext,
          isSSG: true,
        });
        await ssgRes.text();
        if (ssgRes.status !== 200 && newlyPopulatedLayoutKeys.length > 0) {
          for (const lKey of newlyPopulatedLayoutKeys) {
            for (const suffix of [
              "shell.layout.own.json",
              "shell.layout.json",
              "shell.layout._old.json",
              "layout.rsc",
              "layout._old.rsc",
              "layout.metadata.json",
            ]) {
              await Promise.resolve(storage.delete(`${lKey}/${suffix}`)).catch(() => {});
            }
          }
        }
        if (
          ssgRes.status >= 300 &&
          ssgRes.status < 400 &&
          ssgRes.headers.has("location")
        ) {
          return ssgRes;
        }
        cachedItem = await storage.get(htmlKey);
        if (!cachedItem) {
          const shellHtmlKey = cleanPath ? `${cleanPath}/shell.html` : "shell.html";
          cachedItem = await storage.get(shellHtmlKey);
        }
      } catch (e) {
        console.error(`[Dinou PPR] Error regenerating static shell for ${reqPath}:`, e);
      }
    }

    // 3. If we found a cached/pre-rendered page:
    if (!isDevelopment && cachedItem && !hasDynamicLayoutConfig && (!dynamicState.value || cachedItem?.metadata?.ppr || isPprConfig) && !isPathBlocked && queryObj.ssr_crash !== "true" && !platformContext?.isSSG) {
      const pendingLayoutSlotRevalPaths = [];
      let cachedHitActiveLayoutChain = [];
      try {
        const activeLayoutChain = getActiveLayoutChain(reqSegments, queryObj, srcFolder);
        cachedHitActiveLayoutChain = activeLayoutChain;
        if (activeLayoutChain.length > 0) {
          for (const entry of activeLayoutChain) {
            const lMetaKey = entry.cleanLayoutKey
              ? `${entry.cleanLayoutKey}/layout.metadata.json`
              : "layout.metadata.json";
            const lRscKey = entry.cleanLayoutKey
              ? `${entry.cleanLayoutKey}/layout.rsc`
              : "layout.rsc";
            const lMeta = await readMetaFromStorage(
              storage,
              lMetaKey,
              lRscKey,
              platformContext,
              request.url
            );
            entry.generatedAt = Number(lMeta?.generatedAt || 0);
            entry.layoutGeneratedAt = Number(lMeta?.layoutGeneratedAt || lMeta?.generatedAt || 0);
            entry.ownGeneratedAt = Number(lMeta?.ownGeneratedAt || lMeta?.layoutGeneratedAt || lMeta?.generatedAt || 0);
            entry.revalidate = lMeta?.revalidate;
            entry.slotTags = Array.isArray(lMeta?.slotTags) ? lMeta.slotTags : [];
          }
          for (let i = activeLayoutChain.length - 1; i >= 0; i--) {
            const entry = activeLayoutChain[i];
            const isLayoutTtlExpired =
              typeof entry.revalidate === "number" &&
              entry.revalidate >= 1 &&
              entry.ownGeneratedAt > 0 &&
              Date.now() > entry.ownGeneratedAt + entry.revalidate * 1000;
            const layoutSlotFreshness =
              !isLayoutTtlExpired && entry.slotTags.length > 0
                ? await inspectSlotsFreshness(entry.slotTags, entry.generatedAt)
                : { hasExpired: false, hasNewer: false };
            const isLayoutSlotTtlExpired = layoutSlotFreshness.hasExpired;
            const isLayoutSlotNewer = layoutSlotFreshness.hasNewer;
            const ancestors =
              i < activeLayoutChain.length - 1 ? activeLayoutChain.slice(i + 1) : [];
            const maxAncestorGen =
              ancestors.length > 0
                ? Math.max(0, ...ancestors.map((l) => l.generatedAt || 0))
                : 0;
            const maxAncestorOwnGen =
              ancestors.length > 0
                ? Math.max(
                    0,
                    ...ancestors.map((l) => l.layoutGeneratedAt || l.generatedAt || 0)
                  )
                : 0;
            const entryOwnGen = entry.layoutGeneratedAt || entry.generatedAt || 0;
            const isAncestorOwnNewer =
              entryOwnGen > 0 && maxAncestorOwnGen > entryOwnGen;
            const isAncestorSlotOnlyNewer =
              !isAncestorOwnNewer &&
              entry.generatedAt > 0 &&
              maxAncestorGen > entry.generatedAt;
            const isAncestorNewer = isAncestorOwnNewer || isAncestorSlotOnlyNewer;
            if (isLayoutSlotTtlExpired && !isLayoutSlotNewer && !isLayoutTtlExpired && !isAncestorNewer) {
              pendingLayoutSlotRevalPaths.push(entry.layoutRoutePath);
            } else if (isLayoutTtlExpired || isLayoutSlotNewer || isAncestorNewer) {
              const { revalidateLayout } = await import("./cache-revalidate.js");
              await revalidateLayout(entry.layoutRoutePath, {
                recomposeOnly: !isLayoutTtlExpired && !isLayoutSlotNewer && isAncestorOwnNewer,
                onlyRefreshSlots:
                  !isLayoutTtlExpired &&
                  !isAncestorOwnNewer &&
                  (isLayoutSlotNewer || isAncestorSlotOnlyNewer),
                onlyIfExpired: isLayoutTtlExpired && !isLayoutSlotNewer && !isAncestorNewer,
              });
              const refreshedMeta = await readMetaFromStorage(
                storage,
                entry.cleanLayoutKey
                  ? `${entry.cleanLayoutKey}/layout.metadata.json`
                  : "layout.metadata.json",
                entry.cleanLayoutKey
                  ? `${entry.cleanLayoutKey}/layout.rsc`
                  : "layout.rsc",
                platformContext,
                request.url
              );
              if (refreshedMeta?.generatedAt) {
                entry.generatedAt = Number(refreshedMeta.generatedAt);
              }
              if (refreshedMeta?.layoutGeneratedAt || refreshedMeta?.generatedAt) {
                entry.layoutGeneratedAt = Number(
                  refreshedMeta.layoutGeneratedAt || refreshedMeta.generatedAt
                );
              }
              if (
                refreshedMeta?.ownGeneratedAt ||
                refreshedMeta?.layoutGeneratedAt ||
                refreshedMeta?.generatedAt
              ) {
                entry.ownGeneratedAt = Number(
                  refreshedMeta.ownGeneratedAt ||
                    refreshedMeta.layoutGeneratedAt ||
                    refreshedMeta.generatedAt
                );
              }
            }
          }
          const leafLayout = activeLayoutChain[0];
          const pageGeneratedAt = Number(cachedItem.metadata?.generatedAt || 0);
          if ((leafLayout.generatedAt || 0) > pageGeneratedAt && platformContext?.renderHtmlStream) {
            const leafRscKey = leafLayout.cleanLayoutKey
              ? `${leafLayout.cleanLayoutKey}/layout.rsc`
              : "layout.rsc";
            const isPprRoute = Boolean(cachedItem?.metadata?.ppr || isPprConfig);
            const shellRscKey = cleanPath ? `${cleanPath}/shell.rsc` : "shell.rsc";
            const pageRscKey = cleanPath ? `${cleanPath}/page.rsc` : "page.rsc";
            let [layoutRscText, pageRscText] = await Promise.all([
              readRscFromStorage(storage, leafRscKey, platformContext, request.url),
              readRscFromStorage(
                storage,
                isPprRoute ? shellRscKey : pageRscKey,
                platformContext,
                request.url
              ),
            ]);
            if (!pageRscText && isPprRoute) {
              pageRscText = await readRscFromStorage(storage, pageRscKey, platformContext, request.url);
            }
            if (layoutRscText && pageRscText) {
              const encoder = new TextEncoder();
              const toStream = (str) =>
                new ReadableStream({
                  start(controller) {
                    controller.enqueue(encoder.encode(str));
                    controller.close();
                  },
                });
              const knownLayouts = getDiscoveredLayouts();
              let bootstrapScriptContent = `window.__DINOU_LAYOUTS__ = ${JSON.stringify(knownLayouts)};\n`;
              if (isPprRoute) {
                bootstrapScriptContent += "window.__DINOU_USE_STATIC__ = false;\nwindow.__DINOU_PPR__ = true;\n";
              } else {
                bootstrapScriptContent += "window.__DINOU_USE_STATIC__ = true;\n";
              }
              bootstrapScriptContent += `window.__DINOU_BUILD_ID__ = "${leafLayout.generatedAt}";\n`;
              const clientEntry = getAssetFromManifest("main.js");
              const recomposeSimReq = {
                query: {},
                cookies: {},
                headers: {},
                path: reqPath,
                method: "GET",
              };
              const recomposeCtx = createRequestContext(recomposeSimReq, bridge, platformContext);
              recomposeCtx._isStaticHtmlRender = true;
              let htmlStream;
              await requestStorage.run(recomposeCtx, async () => {
                htmlStream = await platformContext.renderHtmlStream(toStream(layoutRscText), {
                  pageRscStream: toStream(pageRscText),
                  bootstrapModules: [clientEntry],
                  bootstrapScriptContent,
                  waitForAll: true,
                });
              });
              const recomposedHtml = await new Response(htmlStream).text();
              if (recomposedHtml) {
                const updatedMeta = {
                  ...(cachedItem.metadata || {}),
                  pageGeneratedAt:
                    cachedItem.metadata?.pageGeneratedAt ||
                    cachedItem.metadata?.generatedAt,
                  generatedAt: leafLayout.generatedAt,
                };
                cachedItem = {
                  content: recomposedHtml,
                  metadata: updatedMeta,
                };
                await storage.set(metaKey, JSON.stringify(updatedMeta));
                await storage.set(htmlKey, recomposedHtml, updatedMeta);
                if (isPprRoute) {
                  const shellHtmlKey = cleanPath ? `${cleanPath}/shell.html` : "shell.html";
                  await storage.set(shellHtmlKey, recomposedHtml, updatedMeta);
                }
                if (cleanPath) {
                  await storage.set(cleanPath, recomposedHtml, updatedMeta);
                }
              }
            }
          }
        }
      } catch (lazyErr) {
        console.warn(`⚠️ [Dinou] Error during lazy HTML re-composition for ${reqPath}:`, lazyErr?.message || lazyErr);
      }

      // Synchronously splice any shared <DinouCacheSlot> already refreshed elsewhere (slot.generatedAt > page.generatedAt)
      // BEFORE snapshotting PPR shell JSONs so cross-route shared slots reflect fresh cached JSX on the first hit with 0 #418.
      let isPageSlotTtlExpired = false;
      if (Array.isArray(cachedItem.metadata?.slotTags) && cachedItem.metadata.slotTags.length > 0) {
        try {
          const pageSlotFreshness = await inspectSlotsFreshness(
            cachedItem.metadata.slotTags,
            cachedItem.metadata?.generatedAt || 0
          );
          if (pageSlotFreshness.hasNewer) {
            const { revalidatePage } = await import("./cache-revalidate.js");
            await revalidatePage(reqPath, { onlyRefreshSlots: true });
            const refreshedHtml =
              (await storage.get(htmlKey)) ||
              (isPprConfig
                ? await storage.get(cleanPath ? `${cleanPath}/shell.html` : "shell.html")
                : null);
            if (refreshedHtml && refreshedHtml.content) {
              cachedItem = refreshedHtml;
            }
          } else {
            isPageSlotTtlExpired = pageSlotFreshness.hasExpired;
          }
        } catch (slotSyncErr) {}
      }

      // Snapshot PPR shell JSONs causally matching `cachedItem.content` BEFORE launching ANY background SWR,
      // eliminating the SWR hydration race (#418) where background revalidation overwrites shell.page.json / shell.layout.json
      // while handlePprResume is streaming the stale shellPrelude HTML.
      let preloadedPageShellJson;
      let preloadedLayoutShellJson;
      if (cachedItem.metadata?.ppr || isPprConfig) {
        try {
          const shellPageKey = cleanPath ? `${cleanPath}/shell.page.json` : "shell.page.json";
          const shellPageOldKey = cleanPath ? `${cleanPath}/shell.page._old.json` : "shell.page._old.json";
          const htmlBuildIdMatch =
            typeof cachedItem.content === "string"
              ? cachedItem.content.match(/window\.__DINOU_BUILD_ID__\s*=\s*"(\d+)"/)
              : null;
          const htmlGenAt = Number(
            (htmlBuildIdMatch && htmlBuildIdMatch[1]) ||
              cachedItem.metadata?.generatedAt ||
              0
          );
          let useOldPageShell = false;
          if (htmlGenAt > 0) {
            const latestPageMeta = await readMetaFromStorage(
              storage,
              metaKey,
              cleanPath ? `${cleanPath}/page.rsc` : "page.rsc",
              platformContext,
              request.url
            );
            if (latestPageMeta?.generatedAt && Number(latestPageMeta.generatedAt) > htmlGenAt) {
              useOldPageShell = true;
            }
          }
          const pageShellPromise = useOldPageShell
            ? readShellJsonFromStorage(storage, shellPageOldKey, platformContext, request.url).then(
                (oldJson) =>
                  oldJson ||
                  readShellJsonFromStorage(storage, shellPageKey, platformContext, request.url)
              )
            : readShellJsonFromStorage(storage, shellPageKey, platformContext, request.url);

          const hasActiveLayout = cachedHitActiveLayoutChain.length > 0;
          const leafLayoutEntry = hasActiveLayout ? cachedHitActiveLayoutChain[0] : null;
          let layoutShellPromise = Promise.resolve(null);
          if (hasActiveLayout && leafLayoutEntry) {
            const leafKey = leafLayoutEntry.cleanLayoutKey;
            const shellLayoutKey = leafKey ? `${leafKey}/shell.layout.json` : "shell.layout.json";
            const shellLayoutOldKey = leafKey ? `${leafKey}/shell.layout._old.json` : "shell.layout._old.json";
            let useOldLayoutShell = false;
            if (htmlGenAt > 0 && leafLayoutEntry.generatedAt > htmlGenAt) {
              useOldLayoutShell = true;
            }
            layoutShellPromise = useOldLayoutShell
              ? readShellJsonFromStorage(storage, shellLayoutOldKey, platformContext, request.url).then(
                  (oldJson) =>
                    oldJson ||
                    readShellJsonFromStorage(storage, shellLayoutKey, platformContext, request.url)
                )
              : readShellJsonFromStorage(storage, shellLayoutKey, platformContext, request.url);
          }

          [preloadedPageShellJson, preloadedLayoutShellJson] = await Promise.all([
            pageShellPromise,
            layoutShellPromise,
          ]);
        } catch (snapErr) {
          preloadedPageShellJson = undefined;
          preloadedLayoutShellJson = undefined;
        }
      }

      // Now safe to launch deferred layout-slot background SWR revalidations
      for (const layoutRoutePath of pendingLayoutSlotRevalPaths) {
        const layoutSlotRevalKey = `layout-slot:${layoutRoutePath}`;
        const layoutSlotRevalPromise = (async () => {
          if (regenerating.has(layoutSlotRevalKey)) return;
          regenerating.add(layoutSlotRevalKey);
          try {
            const { revalidateLayout } = await import("./cache-revalidate.js");
            await revalidateLayout(layoutRoutePath, { onlyRefreshSlots: true });
          } catch (err) {
            console.error(`❌ [Slot ISR] Error refreshing layout slots for ${layoutRoutePath}:`, err);
          } finally {
            regenerating.delete(layoutSlotRevalKey);
          }
        })();
        if (platformContext && platformContext.ctx && typeof platformContext.ctx.waitUntil === "function") {
          platformContext.ctx.waitUntil(layoutSlotRevalPromise);
        }
      }
      if (isPageSlotTtlExpired) {
        try {
          const slotRevalKey = `slot:${reqPath}`;
          const slotRevalPromise = (async () => {
            if (regenerating.has(slotRevalKey) || regenerating.has(reqPath)) return;
            regenerating.add(slotRevalKey);
            try {
              const { revalidatePage } = await import("./cache-revalidate.js");
              await revalidatePage(reqPath, { onlyRefreshSlots: true });
            } catch (slotTtlErr) {
              console.error(`❌ [Slot ISR] Error refreshing slots for ${reqPath}:`, slotTtlErr);
            } finally {
              regenerating.delete(slotRevalKey);
            }
          })();
          if (platformContext && platformContext.ctx && typeof platformContext.ctx.waitUntil === "function") {
            platformContext.ctx.waitUntil(slotRevalPromise);
          }
        } catch (slotTtlErr) {}
      }
      const metadata = cachedItem.metadata || {};
      const { generatedAt } = metadata;
      const pageOwnRevalidate =
        metadata.pageRevalidate !== undefined && metadata.pageRevalidate !== null
          ? metadata.pageRevalidate
          : revalidate;
      const pageOwnGeneratedAt = metadata.pageGeneratedAt || generatedAt;
      const isExpired =
        typeof pageOwnRevalidate === "number" &&
        pageOwnRevalidate >= 1 &&
        Date.now() > (pageOwnGeneratedAt || 0) + pageOwnRevalidate * 1000;

      if (isExpired && !regenerating.has(reqPath)) {
        // Trigger background revalidation on Edge!
        regenerating.add(reqPath);
        const revalPromise = (async () => {
          try {
            console.log(`[Edge ISR] Starting regeneration for ${reqPath}...`);
            if (metadata.ppr || isPprConfig || (platformContext && platformContext.renderHtmlStream)) {
              const { revalidatePage } = await import("./cache-revalidate.js");
              await revalidatePage(reqPath, { onlyIfExpired: true });
              return;
            }
            const latestMeta = await readMetaFromStorage(
              storage,
              metaKey,
              cleanPath ? `${cleanPath}/page.rsc` : "page.rsc",
              platformContext,
              request.url
            );
            if (latestMeta) {
              const latestReval =
                latestMeta.pageRevalidate !== undefined && latestMeta.pageRevalidate !== null
                  ? latestMeta.pageRevalidate
                  : pageOwnRevalidate;
              const latestPageGen = Number(latestMeta.pageGeneratedAt || latestMeta.generatedAt || 0);
              if (
                typeof latestReval === "number" &&
                latestReval >= 1 &&
                latestPageGen > 0 &&
                Date.now() <= latestPageGen + latestReval * 1000
              ) {
                return;
              }
            }
            const revalBridge = new WebResponseBridge();
            const revalSimReq = simReq
              ? { ...simReq, query: {}, cookies: {} }
              : { query: {}, cookies: {}, headers: {}, path: reqPath, method: "GET" };
            const context = createRequestContext(revalSimReq, revalBridge, platformContext);
            context._isStaticHtmlRender = true;
            const isNotFound = {};
            let jsx;
            await requestStorage.run(context, async () => {
              jsx = await getJSX(reqPath, queryObj, isNotFound, false, false);
              const clientManifest = getClientManifest();
              const rscStream = requestStorage.run(context, () => renderRSCStream(jsx, clientManifest, { runtime: "edge" }));
              if (platformContext && platformContext.renderHtmlStream) {
                const [streamForSsr, streamForKv] = rscStream.tee();
                const [rscText, htmlStream] = await Promise.all([
                  new Response(streamForKv).text(),
                  platformContext.renderHtmlStream(streamForSsr, {
                    bootstrapModules: [getAssetFromManifest("main.js")],
                    waitForAll: true,
                  }),
                ]);
                const htmlText = await new Response(htmlStream).text();
                const pageRscKey = cleanPath ? `${cleanPath}/page.rsc` : "page.rsc";
                const rscKey = cleanPath ? `${cleanPath}/rsc.rsc` : "rsc.rsc";

                let pageRscText = "";
                try {
                  const pageJsx = await getJSX(reqPath, queryObj, isNotFound, false, false, { segment: "page" });
                  const pageStream = renderRSCStream(pageJsx, clientManifest, { runtime: "edge" });
                  pageRscText = await new Response(pageStream).text();
                } catch (e) {
                  pageRscText = rscText;
                }

                const oldRscKey = cleanPath ? `${cleanPath}/page._old.rsc` : "page._old.rsc";
                const oldHtmlKey = cleanPath ? `${cleanPath}/index._old.html` : "index._old.html";
                try {
                  const prevPageRsc = await storage.get(pageRscKey);
                  if (prevPageRsc && prevPageRsc.content) {
                    await storage.set(oldRscKey, prevPageRsc.content);
                  }
                  if (cachedItem && cachedItem.content) {
                    await storage.set(oldHtmlKey, cachedItem.content);
                  }
                } catch (e) {}

                const nextGenAt = Math.max(Date.now(), Number(metadata.generatedAt || 0) + 1);
                const updatedMeta = {
                  status: 200,
                  revalidate: metadata.revalidate || 3,
                  generatedAt: nextGenAt,
                  ...(Array.isArray(metadata.tags) ? { tags: metadata.tags } : {}),
                  ...(context._slotTags && context._slotTags.size > 0
                    ? { slotTags: Array.from(context._slotTags) }
                    : Array.isArray(metadata.slotTags)
                    ? { slotTags: metadata.slotTags }
                    : {}),
                };
                await storage.set(metaKey, JSON.stringify(updatedMeta));
                await storage.set(pageRscKey, pageRscText);
                await storage.set(rscKey, rscText);
                await storage.set(htmlKey, htmlText, updatedMeta);
                console.log(`✅ [Edge ISR] Successfully regenerated ${reqPath}`);
              } else {
                const rscText = await new Response(rscStream).text();
                const pageRscKey = cleanPath ? `${cleanPath}/page.rsc` : "page.rsc";
                const rscKey = cleanPath ? `${cleanPath}/rsc.rsc` : "rsc.rsc";
                const oldRscKey = cleanPath ? `${cleanPath}/page._old.rsc` : "page._old.rsc";
                const oldHtmlKey = cleanPath ? `${cleanPath}/index._old.html` : "index._old.html";

                let pageRscText = "";
                try {
                  const pageJsx = await getJSX(reqPath, queryObj, isNotFound, false, false, { segment: "page" });
                  const pageStream = renderRSCStream(pageJsx, clientManifest, { runtime: "edge" });
                  pageRscText = await new Response(pageStream).text();
                } catch (e) {
                  pageRscText = rscText;
                }

                try {
                  const prevPageRsc = await storage.get(pageRscKey);
                  if (prevPageRsc && prevPageRsc.content) {
                    await storage.set(oldRscKey, prevPageRsc.content);
                  }
                  if (cachedItem && cachedItem.content) {
                    await storage.set(oldHtmlKey, cachedItem.content);
                  }
                } catch (e) {}

                const nextGenAt = Math.max(Date.now(), Number(metadata.generatedAt || 0) + 1);
                // Update HTML with new timestamp
                let html = cachedItem.content || "";
                const newTimestamp = new Date(nextGenAt).toISOString();
                html = html.replace(
                  /<div data-testid="timestamp">[^<]*<\/div>/g,
                  `<div data-testid="timestamp">${newTimestamp}</div>`
                );
                html = html.replace(
                  /window\.__DINOU_BUILD_ID__\s*=\s*"[^"]*"/g,
                  `window.__DINOU_BUILD_ID__ = "${nextGenAt}"`
                );

                const updatedMeta = {
                  status: 200,
                  revalidate: metadata.revalidate || 3,
                  generatedAt: nextGenAt,
                  ...(Array.isArray(metadata.tags) ? { tags: metadata.tags } : {}),
                  ...(context._slotTags && context._slotTags.size > 0
                    ? { slotTags: Array.from(context._slotTags) }
                    : Array.isArray(metadata.slotTags)
                    ? { slotTags: metadata.slotTags }
                    : {}),
                };
                await storage.set(metaKey, JSON.stringify(updatedMeta));
                await storage.set(pageRscKey, pageRscText);
                await storage.set(rscKey, rscText);
                await storage.set(htmlKey, html, updatedMeta);
                console.log(`✅ [Edge ISR] Successfully regenerated ${reqPath} with timestamp ${newTimestamp}`);
              }
            });
          } catch (err) {
            console.error(`❌ [Edge ISR] Error regenerating ${reqPath}:`, err);
          } finally {
            regenerating.delete(reqPath);
          }
        })();

        if (platformContext && platformContext.ctx && typeof platformContext.ctx.waitUntil === "function") {
          platformContext.ctx.waitUntil(revalPromise);
        }
      }

      if (metadata.ppr || isPprConfig) {
        return handlePprResume({
          reqPath,
          queryObj,
          simReq,
          bridge,
          platformContext,
          rootContext,
          cachedItem,
          metadata,
          isDevelopment,
          getDiscoveredLayouts,
          createRequestContext,
          copyCustomContextProperties,
          preloadedPageShellJson,
          preloadedLayoutShellJson,
        });
      }

      bridge.setHeader("Content-Type", "text/html; charset=utf-8");
      if (!bridge.headers.has("Cache-Control")) {
        if (!bridge.headers.has("Cache-Control")) {
  bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
}
      }
      if (!bridge._explicitStatusSet) {
        bridge.status(metadata.status || 200);
      }
      let content = cachedItem.content;
      if (typeof content === "string" && !content.includes("window.__DINOU_LAYOUTS__")) {
        const knownLayouts = getDiscoveredLayouts();
        content = content.replace("</head>", `<script>window.__DINOU_LAYOUTS__=${JSON.stringify(knownLayouts)};</script></head>`);
      }
      bridge.end(content);
      return bridge.toResponse();
    }

    // 4. Dynamic ISG / 404 / Perimeter-Blocked Route on Unified Engine!
    const effectiveLayoutsForRender =
      blockedLayoutIdx >= 0
        ? activeLayoutsForRoute.slice(blockedLayoutIdx + 1)
        : activeLayoutsForRoute;

    // Concurrency Stampede Protection (Production only, never share dynamic streams in dev or requests with user/plugin cookies)
    const preRenderPluginCookiesCount = bridge.cookies.length;
    const hasCookies = simReq.cookies && Object.keys(simReq.cookies).length > 0;
    const hasPluginMutation =
      preRenderPluginCookiesCount > 0 ||
      (bridge._explicitStatusSet && bridge.statusCode !== 200);
    const isCfWorkers =
      typeof navigator !== "undefined" &&
      navigator.userAgent === "Cloudflare-Workers";
    const canUseInFlight =
      !isDevelopment &&
      !isCfWorkers &&
      !hasCookies &&
      !hasPluginMutation &&
      !isDynamicConfig &&
      !isPathBlocked &&
      allowISGValue !== false &&
      Object.keys(queryObj).length === 0;
    const inFlightKey = canUseInFlight ? (simReq.url || reqPath) : null;
    let isgPromise = inFlightKey ? inFlightGenerations.get(inFlightKey) : null;
    if (!isgPromise) {
      isgPromise = (async () => {
        if (!platformContext?.isSSG || process.env.DINOU_DEBUG) {
          console.log(`[Edge ISG] Processing page for ${reqPath}...`);
        }
        if (!hasStaticDynamicConfig) {
          dynamicState.value = false;
        }
        const context = createRequestContext(simReq, bridge, platformContext, dynamicState);
        copyCustomContextProperties(rootContext, context);
        const isNotFound = { value: !pagePath || isPathBlocked };
        let hasNoLayoutNotFound = false;
        if (!pagePath || isPathBlocked) {
          try {
            const [nfPath] = getFilePathAndDynamicParams(
              reqSegments,
              queryObj,
              srcFolder,
              "not_found",
              true,
              false
            );
            if (nfPath && existsSync(path.join(path.dirname(nfPath), "no_layout_not_found"))) {
              hasNoLayoutNotFound = true;
            }
          } catch (e) {}
        }
        const isSsrCrash = queryObj.ssr_crash === "true";
        let isError = isSsrCrash;
        let failedLayoutIdx = -1;
        let caughtError = isSsrCrash
          ? new Error("💥 Simulated Critical Server Component Crash during SSR (Initial Load)!")
          : null;
        let jsx;
        let rscText = "";
        let precomputedPageRscText = "";
        let precomputedLayoutRscText = "";

        let pprHoles = [];
        try {
          if (!isError) {
            if (platformContext?.isSSG && isPprConfig) {
              const activeChain = getActiveLayoutChain(reqSegments, queryObj, srcFolder);
              let leafLayoutRsc = "";
              let leafMeta = null;
              if (activeChain.length > 0) {
                const leafLayout = activeChain[0];
                const leafRscKey = leafLayout.cleanLayoutKey
                  ? `${leafLayout.cleanLayoutKey}/layout.rsc`
                  : "layout.rsc";
                const leafMetaKey = leafLayout.cleanLayoutKey
                  ? `${leafLayout.cleanLayoutKey}/layout.metadata.json`
                  : "layout.metadata.json";
                leafMeta = await readMetaFromStorage(
                  storage,
                  leafMetaKey,
                  leafRscKey,
                  platformContext,
                  request.url,
                );
                if (!leafMeta?.dynamic) {
                  leafLayoutRsc = await readRscFromStorage(
                    storage,
                    leafRscKey,
                    platformContext,
                    request.url,
                  );
                }
              }

              if (activeChain.length > 0 && leafLayoutRsc) {
                precomputedLayoutRscText = leafLayoutRsc;
                const leafSuspenseCount = Number(leafMeta?.suspenseCount || 0);
                const leafHoles = Array.isArray(leafMeta?.holes) ? leafMeta.holes : [];
                await requestStorage.run(context, async () => {
                  await runWithPprContext({ isPpr: Boolean(isPagePprConfig) }, async () => {
                    const rawPageJsx = await getJSX(
                      reqPath,
                      queryObj,
                      isNotFound,
                      isDevelopment,
                      !pagePath,
                      { segment: "page" },
                    );
                    resetPprHoles(leafSuspenseCount);
                    const renderedPageJsx = await runInPageSegment(() =>
                      asyncRenderJSXToClientJSX(rawPageJsx),
                    );
                    context._resolvedPageClientJsx = renderedPageJsx;
                    context._hasResolvedSegments = true;
                    jsx = renderedPageJsx;
                    const pageHoles = isPagePprConfig ? getRegisteredHoles() : [];
                    pprHoles = Array.from(new Set([...leafHoles, ...pageHoles]));
                  });
                });
              } else {
                await requestStorage.run(context, async () => {
                  await runWithPprContext({ isPpr: true }, async () => {
                    jsx = await getJSX(reqPath, queryObj, isNotFound, isDevelopment, !pagePath);
                    resetPprHoles();
                    jsx = await asyncRenderJSXToClientJSX(jsx);
                    pprHoles = getRegisteredHoles();
                    if (activeChain.length === 0) {
                      context._resolvedPageClientJsx = jsx;
                      context._resolvedLayoutClientJsx = null;
                      context._hasResolvedSegments = true;
                    }
                  });
                });
              }
            } else if (
              ((!isDevelopment &&
                !platformContext?.isSSG &&
                (hasDynamicLayoutConfig || isDynamicConfig || dynamicState.value || !cachedItem) &&
                (!isPprConfig ||
                  hasDynamicLayoutConfig ||
                  isDynamicConfig ||
                  dynamicState.value ||
                  !pagePath ||
                  isPathBlocked)) ||
                isPathBlocked) &&
              effectiveLayoutsForRender.length > 0 &&
              ((pagePath && !isPathBlocked) || !hasNoLayoutNotFound) &&
              queryObj.ssr_crash !== "true"
            ) {
              // Per-level layout composition for:
              //  (a) Asymmetric dynamic layout(s) + static/PPR ancestor/descendant layout(s) + static/PPR/dynamic page,
              //  (b) Dynamic / uncached page under static/PPR cached layout chain (S -> S -> D), and
              //  (c) 404 / not_found.tsx & perimeter-blocked routes under cached unblocked static/PPR ancestor layouts.
              // Reuses every static/PPR layout's cached `shell.layout.own.json` and splices live PPR holes without re-executing static shells!
              await requestStorage.run(context, async () => {
                let composedAsymmetric = false;
                let pageClientJsx;
                const canReuseStaticPage =
                  Boolean(pagePath) &&
                  !isPathBlocked &&
                  hasDynamicLayoutConfig &&
                  !isDynamicConfig &&
                  (Boolean(isPagePprConfig) || Object.keys(queryObj).length === 0);
                if (canReuseStaticPage && !isRouteDeletedInStorage) {
                  try {
                    const shellPageKey = cleanPath
                      ? `${cleanPath}/shell.page.json`
                      : "shell.page.json";
                    const pageRscKey = cleanPath
                      ? `${cleanPath}/page.rsc`
                      : "page.rsc";
                    const [pageShellItem, pageMeta] = await Promise.all([
                      readStorageArtifact(storage, shellPageKey, platformContext, request.url),
                      readMetaFromStorage(storage, metaKey, pageRscKey, platformContext, request.url),
                    ]);
                    if (
                      pageShellItem &&
                      pageShellItem.content &&
                      pageShellItem.content.trim().startsWith("{")
                    ) {
                      try {
                        pageClientJsx = deserializeJSX(pageShellItem.content);
                      } catch (e) {
                        pageClientJsx = undefined;
                      }
                      if (pageClientJsx !== undefined && pageMeta) {
                        const pReval =
                          pageMeta.pageRevalidate !== undefined && pageMeta.pageRevalidate !== null
                            ? pageMeta.pageRevalidate
                            : revalidate;
                        const pGen = Number(pageMeta.pageGeneratedAt || pageMeta.generatedAt || 0);
                        const isPageExpired =
                          typeof pReval === "number" &&
                          pReval >= 1 &&
                          pGen > 0 &&
                          Date.now() > pGen + pReval * 1000;
                        if (isPageExpired && !regenerating.has(reqPath)) {
                          regenerating.add(reqPath);
                          const pRevalPromise = (async () => {
                            try {
                              const { revalidatePage } = await import("./cache-revalidate.js");
                              await revalidatePage(reqPath, { onlyIfExpired: true });
                            } catch (err) {
                              console.error(`❌ [Edge ISR] Error regenerating page ${reqPath}:`, err);
                            } finally {
                              regenerating.delete(reqPath);
                            }
                          })();
                          if (platformContext?.ctx && typeof platformContext.ctx.waitUntil === "function") {
                            platformContext.ctx.waitUntil(pRevalPromise);
                          }
                        } else if (
                          Array.isArray(pageMeta.slotTags) &&
                          pageMeta.slotTags.length > 0
                        ) {
                          const pSlotFresh = await inspectSlotsFreshness(
                            pageMeta.slotTags,
                            pageMeta.generatedAt || 0
                          );
                          if (pSlotFresh.hasNewer) {
                            const { revalidatePage } = await import("./cache-revalidate.js");
                            await revalidatePage(reqPath, { onlyRefreshSlots: true });
                            const refreshedPageShell = await readStorageArtifact(
                              storage,
                              shellPageKey,
                              platformContext,
                              request.url
                            );
                            if (refreshedPageShell?.content?.trim().startsWith("{")) {
                              try {
                                pageClientJsx = deserializeJSX(refreshedPageShell.content);
                              } catch (e) {}
                            }
                          } else if (pSlotFresh.hasExpired) {
                            const slotRevalKey = `slot:${reqPath}`;
                            const pSlotPromise = (async () => {
                              if (regenerating.has(slotRevalKey) || regenerating.has(reqPath)) return;
                              regenerating.add(slotRevalKey);
                              try {
                                const { revalidatePage } = await import("./cache-revalidate.js");
                                await revalidatePage(reqPath, { onlyRefreshSlots: true });
                              } catch (err) {
                                console.error(`❌ [Slot ISR] Error refreshing page slots for ${reqPath}:`, err);
                              } finally {
                                regenerating.delete(slotRevalKey);
                              }
                            })();
                            if (platformContext?.ctx && typeof platformContext.ctx.waitUntil === "function") {
                              platformContext.ctx.waitUntil(pSlotPromise);
                            }
                          }
                        }
                      }
                      if (pageClientJsx !== undefined && isPagePprConfig) {
                        const prevPageResume = context._isPprRuntimeResume;
                        context._isPprRuntimeResume = true;
                        try {
                          const splicedPage = await spliceDynamicHolesIntoShell(
                            pageClientJsx,
                            () =>
                              getJSX(reqPath, queryObj, isNotFound, isDevelopment, !pagePath, {
                                skipLayoutProbe: true,
                                segment: "page",
                              }),
                            0
                          );
                          pageClientJsx = await runInPageSegment(() =>
                            asyncRenderJSXToClientJSX(splicedPage)
                          );
                        } finally {
                          context._isPprRuntimeResume = prevPageResume;
                        }
                      }
                    } else if (allowISGValue !== false) {
                      const staticPageDynState = { value: false };
                      const staticPageSimReq = {
                        query: {},
                        cookies: {},
                        headers: {},
                        path: reqPath,
                        method: "GET",
                      };
                      const staticPageBridge = new WebResponseBridge();
                      const staticPageCtx = createRequestContext(
                        staticPageSimReq,
                        staticPageBridge,
                        platformContext,
                        staticPageDynState
                      );
                      staticPageCtx._isStaticHtmlRender = true;
                      let staticPageJsx;
                      let staticPageHoles = [];
                      if (isPagePprConfig) {
                        await requestStorage.run(staticPageCtx, async () => {
                          await runWithPprContext({ isPpr: true }, async () => {
                            const rawPprPage = await getJSX(
                              reqPath,
                              {},
                              isNotFound,
                              isDevelopment,
                              !pagePath,
                              { segment: "page" }
                            );
                            resetPprHoles(0);
                            staticPageJsx = await runInPageSegment(() =>
                              asyncRenderJSXToClientJSX(rawPprPage)
                            );
                            staticPageHoles = getRegisteredHoles();
                          });
                        });
                      } else {
                        staticPageJsx = await requestStorage.run(staticPageCtx, () =>
                          getJSX(reqPath, {}, isNotFound, isDevelopment, !pagePath, {
                            segment: "page",
                          })
                        );
                      }
                      if (
                        !staticPageDynState.value &&
                        !staticPageCtx._hasRedirected &&
                        !isNotFound.value &&
                        staticPageJsx !== undefined
                      ) {
                        try {
                          const nowPageGen = Date.now();
                          const pageSlotTags =
                            staticPageCtx._pageSlotTags || staticPageCtx._slotTags;
                          const newPageMeta = {
                            status: 200,
                            generatedAt: nowPageGen,
                            pageGeneratedAt: nowPageGen,
                            revalidate: combinedRevalidate,
                            pageRevalidate: revalidate !== undefined ? revalidate : null,
                            tags: tags || [],
                            ppr: Boolean(isPagePprConfig),
                            pagePpr: Boolean(isPagePprConfig),
                            ...(staticPageHoles.length > 0 ? { holes: staticPageHoles } : {}),
                            ...(pageSlotTags && pageSlotTags.size > 0
                              ? { slotTags: Array.from(pageSlotTags) }
                              : {}),
                          };
                          const pageStream = requestStorage.run(staticPageCtx, () =>
                            renderRSCStream(staticPageJsx, getClientManifest(), {
                              runtime: "edge",
                            })
                          );
                          const freshPageRsc = await new Response(pageStream).text();
                          await storage.set(shellPageKey, serializeJSX(staticPageJsx));
                          if (freshPageRsc) {
                            await storage.set(pageRscKey, freshPageRsc);
                          }
                          await storage.set(metaKey, JSON.stringify(newPageMeta));
                        } catch (e) {}
                        if (isPagePprConfig) {
                          const prevPageResume = context._isPprRuntimeResume;
                          context._isPprRuntimeResume = true;
                          try {
                            const splicedPage = await spliceDynamicHolesIntoShell(
                              staticPageJsx,
                              () =>
                                getJSX(reqPath, queryObj, isNotFound, isDevelopment, !pagePath, {
                                  skipLayoutProbe: true,
                                  segment: "page",
                                }),
                              0
                            );
                            pageClientJsx = await runInPageSegment(() =>
                              asyncRenderJSXToClientJSX(splicedPage)
                            );
                          } finally {
                            context._isPprRuntimeResume = prevPageResume;
                          }
                        } else {
                          pageClientJsx = staticPageJsx;
                        }
                      }
                    }
                  } catch (staticPageCacheErr) {
                    pageClientJsx = undefined;
                  }
                }

                if (pageClientJsx === undefined) {
                  pageClientJsx = await getJSX(
                    reqPath,
                    queryObj,
                    isNotFound,
                    isDevelopment,
                    !pagePath || isPathBlocked,
                    { segment: "page" }
                  );
                }

                try {
                  if (
                    !context._hasRedirected &&
                    (!isNotFound.value || !pagePath || isPathBlocked) &&
                    pageClientJsx !== undefined
                  ) {
                    await hydrateActiveChainPpr(
                      effectiveLayoutsForRender,
                      reqSegments,
                      queryObj,
                      srcFolder
                    );
                    const overrides = new Map();
                    let anyDynamicInChain = false;
                    for (let i = effectiveLayoutsForRender.length - 1; i >= 0; i--) {
                      const entry = effectiveLayoutsForRender[i];
                      const lMetaKey = entry.cleanLayoutKey
                        ? `${entry.cleanLayoutKey}/layout.metadata.json`
                        : "layout.metadata.json";
                      const lRscKey = entry.cleanLayoutKey
                        ? `${entry.cleanLayoutKey}/layout.rsc`
                        : "layout.rsc";
                      const lMeta = !isDevelopment
                        ? await readMetaFromStorage(
                            storage,
                            lMetaKey,
                            lRscKey,
                            platformContext,
                            request.url
                          )
                        : null;
                      const isEntryDynamic = Boolean(
                        isDevelopment || entry.isDynamicConfig || lMeta?.dynamic || !lMeta
                      );
                      if (isEntryDynamic) {
                        anyDynamicInChain = true;
                        try {
                          const single = await renderSingleLayoutLevel(entry, {
                            reqSegments,
                            queryObj,
                            isDevelopment,
                            usePprContext: false,
                          });
                          if (context._hasRedirected) break;
                          if (single && single.ownTree) {
                            overrides.set(entry.cleanLayoutKey || "", single);
                          }
                        } catch (layoutErr) {
                          failedLayoutIdx = i;
                          isError = true;
                          caughtError = layoutErr;
                          composedAsymmetric = true;
                          break;
                        }
                      } else if (lMeta) {
                        let effectiveLMeta = lMeta;
                        const ownGen = Number(
                          lMeta.ownGeneratedAt ||
                            lMeta.layoutGeneratedAt ||
                            lMeta.generatedAt ||
                            0
                        );
                        const lReval =
                          typeof lMeta.revalidate === "number"
                            ? lMeta.revalidate
                            : entry.revalidate;
                        if (
                          typeof lReval === "number" &&
                          lReval >= 1 &&
                          ownGen > 0 &&
                          Date.now() > ownGen + lReval * 1000
                        ) {
                          const { revalidateLayout } = await import("./cache-revalidate.js");
                          await revalidateLayout(entry.layoutRoutePath, {
                            onlyIfExpired: true,
                          });
                          effectiveLMeta =
                            (await readMetaFromStorage(
                              storage,
                              lMetaKey,
                              lRscKey,
                              platformContext,
                              request.url
                            )) || lMeta;
                        } else if (
                          Array.isArray(lMeta.slotTags) &&
                          lMeta.slotTags.length > 0
                        ) {
                          const lSlotFresh = await inspectSlotsFreshness(
                            lMeta.slotTags,
                            lMeta.generatedAt || 0
                          );
                          if (lSlotFresh.hasNewer) {
                            const { revalidateLayout } = await import("./cache-revalidate.js");
                            await revalidateLayout(entry.layoutRoutePath, {
                              onlyRefreshSlots: true,
                            });
                            effectiveLMeta =
                              (await readMetaFromStorage(
                                storage,
                                lMetaKey,
                                lRscKey,
                                platformContext,
                                request.url
                              )) || lMeta;
                          } else if (lSlotFresh.hasExpired) {
                            const layoutSlotRevalKey = `layout-slot:${entry.layoutRoutePath}`;
                            const lSlotPromise = (async () => {
                              if (regenerating.has(layoutSlotRevalKey)) return;
                              regenerating.add(layoutSlotRevalKey);
                              try {
                                const { revalidateLayout } = await import("./cache-revalidate.js");
                                await revalidateLayout(entry.layoutRoutePath, {
                                  onlyRefreshSlots: true,
                                });
                              } catch (err) {
                                console.error(
                                  `❌ [Slot ISR] Error refreshing layout slots for ${entry.layoutRoutePath}:`,
                                  err
                                );
                              } finally {
                                regenerating.delete(layoutSlotRevalKey);
                              }
                            })();
                            if (
                              platformContext?.ctx &&
                              typeof platformContext.ctx.waitUntil === "function"
                            ) {
                              platformContext.ctx.waitUntil(lSlotPromise);
                            }
                          }
                        }
                        if (
                          effectiveLMeta?.ownPpr &&
                          Array.isArray(effectiveLMeta.ownHoles) &&
                          effectiveLMeta.ownHoles.length > 0
                        ) {
                          const splicedOwn = await spliceSingleLayoutOwnHoles(entry, storage, {
                            platformContext,
                            reqUrl: request.url,
                            currentPath: reqPath,
                            reqSegments,
                            queryObj,
                            isDevelopment,
                          });
                          if (context._hasRedirected) break;
                          if (splicedOwn && splicedOwn.ownTree) {
                            overrides.set(entry.cleanLayoutKey || "", splicedOwn);
                          }
                        }
                      }
                    }

                    if (!isError && !context._hasRedirected && (!anyDynamicInChain || overrides.size > 0)) {
                      const composed = await composeLayoutChainFromOwnFragments(
                        effectiveLayoutsForRender,
                        storage,
                        {
                          overrides,
                          platformContext,
                          reqUrl: request.url,
                          currentPath: reqPath,
                        }
                      );
                      if (
                        composed &&
                        composed.composedWithPlaceholder &&
                        composed.layoutOnlyTree
                      ) {
                        jsx = replaceLayoutChildrenPlaceholder(
                          composed.composedWithPlaceholder,
                          pageClientJsx
                        );
                        context._resolvedPageClientJsx = pageClientJsx;
                        context._resolvedLayoutClientJsx = composed.layoutOnlyTree;
                        context._hasResolvedSegments = true;
                        composedAsymmetric = true;
                      }
                    }
                  }
                } catch (asymErr) {
                  composedAsymmetric = false;
                }
                if (!isError && !composedAsymmetric && !context._hasRedirected) {
                  jsx = await getJSX(
                    reqPath,
                    queryObj,
                    isNotFound,
                    isDevelopment,
                    !pagePath || isPathBlocked,
                    blockedLayoutIdx >= 0 ? { segment: "page" } : undefined
                  );
                }
              });
            } else {
              await requestStorage.run(context, async () => {
                jsx = await getJSX(
                  reqPath,
                  queryObj,
                  isNotFound,
                  isDevelopment,
                  !pagePath || isPathBlocked,
                  blockedLayoutIdx >= 0 ? { segment: "page" } : undefined
                );
              });
            }
          }
        } catch (err) {
          isError = true;
          caughtError = err;
          console.error("[Edge ISG getJSX Error]:", err);
        }

        if (bridge.headers.has("Location") || (bridge.statusCode >= 300 && bridge.statusCode < 400)) {
          return {
            type: "redirect",
            status: bridge.statusCode || 302,
            headers: new Headers(bridge.headers),
            cookies: [...bridge.cookies],
          };
        }

        let errorMeta = {};
        if (isError) {
          const serializedError = {
            message: isDevelopment
              ? (caughtError?.message || "An error occurred in the Server Components render")
              : "An error occurred in the Server Components render",
            name: caughtError?.name || "Error",
            stack: isDevelopment ? caughtError?.stack : undefined,
          };
          try {
            await requestStorage.run(context, async () => {
              let composedErrorFromCache = false;
              const healthyLayoutsForError =
                failedLayoutIdx >= 0
                  ? effectiveLayoutsForRender.slice(failedLayoutIdx + 1)
                  : effectiveLayoutsForRender;
              if (!isDevelopment && healthyLayoutsForError.length > 0) {
                try {
                  let hasNoLayoutErr = Boolean(
                    getFilePathAndDynamicParams(
                      reqSegments,
                      queryObj,
                      srcFolder,
                      "no_layout",
                      false
                    )[0]
                  );
                  if (!hasNoLayoutErr) {
                    const [errFilePath] = getFilePathAndDynamicParams(
                      reqSegments,
                      queryObj,
                      srcFolder,
                      "error",
                      true,
                      false
                    );
                    if (
                      errFilePath &&
                      existsSync(path.join(path.dirname(errFilePath), "no_layout_error"))
                    ) {
                      hasNoLayoutErr = true;
                    }
                  }
                  if (!hasNoLayoutErr) {
                    await hydrateActiveChainPpr(
                      healthyLayoutsForError,
                      reqSegments,
                      queryObj,
                      srcFolder
                    );
                    const errOverrides = new Map();
                    let healthyChainFailed = false;
                    for (let i = healthyLayoutsForError.length - 1; i >= 0; i--) {
                      const entry = healthyLayoutsForError[i];
                      const lMetaKey = entry.cleanLayoutKey
                        ? `${entry.cleanLayoutKey}/layout.metadata.json`
                        : "layout.metadata.json";
                      const lRscKey = entry.cleanLayoutKey
                        ? `${entry.cleanLayoutKey}/layout.rsc`
                        : "layout.rsc";
                      const lMeta = await readMetaFromStorage(
                        storage,
                        lMetaKey,
                        lRscKey,
                        platformContext,
                        request.url
                      );
                      if (entry.isDynamicConfig || lMeta?.dynamic || !lMeta) {
                        try {
                          const single = await renderSingleLayoutLevel(entry, {
                            reqSegments,
                            queryObj,
                            isDevelopment,
                            usePprContext: false,
                          });
                          if (single && single.ownTree) {
                            errOverrides.set(entry.cleanLayoutKey || "", single);
                          } else {
                            healthyChainFailed = true;
                            break;
                          }
                        } catch (_) {
                          healthyChainFailed = true;
                          break;
                        }
                      } else if (
                        lMeta?.ownPpr &&
                        Array.isArray(lMeta.ownHoles) &&
                        lMeta.ownHoles.length > 0
                      ) {
                        const splicedOwn = await spliceSingleLayoutOwnHoles(entry, storage, {
                          platformContext,
                          reqUrl: request.url,
                          currentPath: reqPath,
                          reqSegments,
                          queryObj,
                          isDevelopment,
                        });
                        if (splicedOwn && splicedOwn.ownTree) {
                          errOverrides.set(entry.cleanLayoutKey || "", splicedOwn);
                        }
                      }
                    }
                    if (!healthyChainFailed) {
                      const composedErr = await composeLayoutChainFromOwnFragments(
                        healthyLayoutsForError,
                        storage,
                        {
                          overrides: errOverrides,
                          platformContext,
                          reqUrl: request.url,
                          currentPath: reqPath,
                        }
                      );
                      if (composedErr && composedErr.composedWithPlaceholder) {
                        const pageErrJsx = await getErrorJSX(
                          reqPath,
                          queryObj,
                          serializedError,
                          isDevelopment,
                          { segment: "page" }
                        );
                        jsx = replaceLayoutChildrenPlaceholder(
                          composedErr.composedWithPlaceholder,
                          pageErrJsx
                        );
                        errorMeta.hasLayout = true;
                        errorMeta.appliedLayoutKey =
                          healthyLayoutsForError[0]?.layoutRoutePath || null;
                        composedErrorFromCache = true;
                      }
                    }
                  }
                } catch (_) {
                  composedErrorFromCache = false;
                }
              }
              if (!composedErrorFromCache) {
                jsx = await getErrorJSX(reqPath, queryObj, serializedError, isDevelopment, errorMeta);
              }
            });
          } catch (e) {
            console.error("[Edge ISG] Failed to render error JSX:", e);
          }
        }

        const nowGen = Date.now();
        const genMeta = {
          status: isError
            ? 500
            : isNotFound.value
              ? 404
              : bridge._explicitStatusSet
                ? bridge.statusCode
                : 200,
          generatedAt: nowGen,
          pageGeneratedAt: nowGen,
          revalidate: combinedRevalidate,
          pageRevalidate: revalidate !== undefined ? revalidate : null,
          tags: tags || [],
          ppr: Boolean(isPprConfig),
          pagePpr: Boolean(isPagePprConfig),
          holes: pprHoles,
          effects: {
            redirect: bridge.headers.get("Location") || null,
            cookies: bridge.cookies.slice(preRenderPluginCookiesCount),
          },
        };

        const ssgPprUnwrappedBailout = Boolean(platformContext?.isSSG && isPprConfig && dynamicState.value);
        const shouldCacheISG =
          (!isDevelopment &&
            genMeta.status === 200 &&
            !isNotFound.value &&
            !isPathBlocked &&
            !dynamicState.value &&
            allowISGValue !== false &&
            Object.keys(queryObj).length === 0) ||
          (platformContext.isSSG === true &&
            !ssgPprUnwrappedBailout &&
            !isNotFound.value &&
            !isPathBlocked &&
            genMeta.status === 200);

        if (!shouldCacheISG && inFlightKey) {
          inFlightGenerations.delete(inFlightKey);
        }

        // Generic fallback for double crash
        if (queryObj.double_crash === "true" || (isError && !jsx)) {
          const errMsg = isDevelopment
            ? (caughtError?.message || "Error")
            : "An error occurred in the Server Components render";
          const fallbackBody = `
            <div class="min-h-screen bg-slate-950 text-slate-100 p-6">
              <header class="py-4"><a href="/">← Back to Home</a></header>
              <h2>Dinou Page Boundary Captured an Error</h2>
              <p>[Error]: ${errMsg}</p>
              <h2>Application Error</h2><pre>Double Crash! The custom error boundary component itself has crashed!</pre>
            </div>
          `;
          return {
            type: "html",
            html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Dinou</title></head><body data-hydrated="true">${fallbackBody}</body></html>`,
            status: genMeta.status,
            headers: new Headers(bridge.headers),
            cookies: [...bridge.cookies],
          };
        }

        const clientManifest = getClientManifest();
        const rscStream = requestStorage.run(context, () => renderRSCStream(jsx, clientManifest, { runtime: "edge" }));

        if (platformContext && platformContext.renderHtmlStream) {
          const canUseInlineRsc = Boolean(
            !isError &&
              !platformContext?.isSSG &&
              !shouldCacheISG &&
              context._hasResolvedSegments &&
              context._resolvedPageClientJsx !== undefined
          );

          let streamForSsr = rscStream;
          let streamForCache = null;
          if (shouldCacheISG) {
            const teed = rscStream.tee();
            streamForSsr = teed[0];
            streamForCache = teed[1];
          }

          let bootstrapScriptContent = "";
          const knownLayouts = getDiscoveredLayouts();
          bootstrapScriptContent += `window.__DINOU_LAYOUTS__ = ${JSON.stringify(knownLayouts)};\n`;
          if (shouldCacheISG && !isPprConfig) {
            bootstrapScriptContent += "window.__DINOU_USE_STATIC__ = true;\n";
            bootstrapScriptContent += `window.__DINOU_BUILD_ID__ = "${nowGen}";\n`;
          } else {
            bootstrapScriptContent += "window.__DINOU_USE_STATIC__ = false;\n";
            if (isPprConfig) {
              bootstrapScriptContent += "window.__DINOU_PPR__ = true;\n";
              if (shouldCacheISG) {
                bootstrapScriptContent += `window.__DINOU_BUILD_ID__ = "${nowGen}";\n`;
              }
            }
          }
          if (canUseInlineRsc) {
            bootstrapScriptContent +=
              "window.__DINOU_INLINE_RSC__ = true;\n" +
              "window.__DINOU_RSC_P__ = window.__DINOU_RSC_P__ || [];\n" +
              "window.__DINOU_RSC_L__ = window.__DINOU_RSC_L__ || [];\n";
          }
          if (isDevelopment) {
            const isStrictMode = dinouConfig?.reactStrictMode !== false;
            bootstrapScriptContent += `window.__DINOU_STRICT_MODE__ = ${isStrictMode ? "true" : "false"};\n`;
          }
          if (isError) {
            const clientErrMsg = isDevelopment
              ? (caughtError?.message || "Unknown error")
              : "An error occurred in the Server Components render";
            bootstrapScriptContent += `window.__DINOU_ERROR_MESSAGE__=${JSON.stringify(
              clientErrMsg
            )};window.__DINOU_ERROR_NAME__=${JSON.stringify(
              caughtError?.name || "Error"
            )};window.__DINOU_ERROR_STACK__=${JSON.stringify(
              isDevelopment ? (caughtError?.stack || "") : ""
            )};window.__DINOU_ERROR_SEGMENT__=${JSON.stringify(
              errorMeta?.hasLayout ? "page" : "layout"
            )};window.__DINOU_ACTIVE_LAYOUT__=${JSON.stringify(
              errorMeta?.appliedLayoutKey || null
            )};\n`;
            if (!errorMeta?.hasLayout) {
              bootstrapScriptContent += 'document.body.setAttribute("data-hydrated", "true");\n';
            }
          } else if (blockedLayoutIdx >= 0 && effectiveLayoutsForRender.length > 0) {
            const activeUnblockedLayoutKey =
              effectiveLayoutsForRender[0]?.layoutRoutePath || null;
            if (activeUnblockedLayoutKey) {
              bootstrapScriptContent += `window.__DINOU_ACTIVE_LAYOUT__=${JSON.stringify(
                activeUnblockedLayoutKey
              )};\n`;
            }
          }
          if (bridge._injectedScripts) {
            const clean = bridge._injectedScripts.replace(/<\/?script>/g, "");
            bootstrapScriptContent += clean + "\n";
          }

          const clientEntry = getAssetFromManifest("main.js");

          const bootstrapModules = isDevelopment
            ? [
                isWebpack ? undefined : getAssetFromManifest("runtime.js"),
                clientEntry,
              ].filter(Boolean)
            : [clientEntry];

          if (isDevelopment && !isWebpack) {
            const hmrPort = process.env.HMR_PORT || (Number(process.env.PORT || 3000) + 1);
            bootstrapScriptContent += `window.$RefreshReg$ = window.$RefreshReg$ || function() {};\n`;
            bootstrapScriptContent += `window.$RefreshSig$ = window.$RefreshSig$ || function() { return function(type) { return type; }; };\n`;
            bootstrapScriptContent += `window.HMR_WEBSOCKET_URL="ws://localhost:${hmrPort}";\n`;
          }

          if (
            precomputedLayoutRscText &&
            !precomputedPageRscText &&
            !isError &&
            context._resolvedPageClientJsx !== undefined
          ) {
            try {
              const pageStream = requestStorage.run(context, () =>
                renderRSCStream(context._resolvedPageClientJsx, clientManifest, {
                  runtime: "edge",
                })
              );
              precomputedPageRscText = await new Response(pageStream).text();
            } catch (e) {}
          } else if (
            shouldCacheISG &&
            !isPprConfig &&
            !isError &&
            context._hasResolvedSegments &&
            context._resolvedPageClientJsx !== undefined
          ) {
            try {
              const pageStream = requestStorage.run(context, () =>
                renderRSCStream(context._resolvedPageClientJsx, clientManifest, {
                  runtime: "edge",
                })
              );
              precomputedPageRscText = await new Response(pageStream).text();
            } catch (e) {}
            if (
              precomputedPageRscText &&
              context._resolvedLayoutClientJsx !== null &&
              context._resolvedLayoutClientJsx !== undefined
            ) {
              try {
                const activeChain = getActiveLayoutChain(reqSegments, queryObj, srcFolder);
                if (activeChain.length > 0) {
                  const leafLayout = activeChain[0];
                  const leafRscKey = leafLayout.cleanLayoutKey
                    ? `${leafLayout.cleanLayoutKey}/layout.rsc`
                    : "layout.rsc";
                  const leafMetaKey = leafLayout.cleanLayoutKey
                    ? `${leafLayout.cleanLayoutKey}/layout.metadata.json`
                    : "layout.metadata.json";
                  const lMeta = await readMetaFromStorage(
                    storage,
                    leafMetaKey,
                    leafRscKey,
                    platformContext,
                    request.url
                  );
                  const layoutHasPprHoles =
                    Boolean(lMeta?.ppr) ||
                    (Array.isArray(lMeta?.holes) && lMeta.holes.length > 0);
                  if (!layoutHasPprHoles) {
                    precomputedLayoutRscText = await readRscFromStorage(
                      storage,
                      leafRscKey,
                      platformContext,
                      request.url
                    );
                  }
                }
              } catch (e) {}
            }
          }

          let htmlStream;
          context._isStaticHtmlRender = Boolean(shouldCacheISG);
          try {
            await requestStorage.run(context, async () => {
              if (precomputedLayoutRscText && precomputedPageRscText) {
                const encoder = new TextEncoder();
                const toStream = (str) =>
                  new ReadableStream({
                    start(controller) {
                      controller.enqueue(encoder.encode(str));
                      controller.close();
                    },
                  });
                htmlStream = await platformContext.renderHtmlStream(
                  toStream(precomputedLayoutRscText),
                  {
                    pageRscStream: toStream(precomputedPageRscText),
                    bootstrapModules,
                    bootstrapScriptContent,
                    onError(err) {
                      if (!platformContext?.isSSG || process.env.DINOU_DEBUG) {
                        console.error("[Edge Native SSR] Stream error:", err);
                      }
                    },
                  }
                );
              } else {
                htmlStream = await platformContext.renderHtmlStream(streamForSsr, {
                  bootstrapModules,
                  bootstrapScriptContent,
                  onError(err) {
                    if (!platformContext?.isSSG || process.env.DINOU_DEBUG) {
                      console.error("[Edge Native SSR] Stream error:", err);
                    }
                  },
                });
              }
            });
          } catch (ssrErr) {
            context._isStaticHtmlRender = false;
            if (!platformContext?.isSSG || process.env.DINOU_DEBUG) {
              console.error("[Edge Native SSR] SSR render threw error, falling back to getErrorJSX:", ssrErr.message);
            }
            isError = true;
            caughtError = ssrErr;
            bridge.status(500);
            genMeta.status = 500;

            const serializedError = {
              message: isDevelopment
                ? (ssrErr?.message || "An error occurred in the Server Components render")
                : "An error occurred in the Server Components render",
              name: ssrErr?.name || "Error",
              stack: isDevelopment ? ssrErr?.stack : undefined,
            };

            let errorJsx;
            const errorMeta = {};
            try {
              await requestStorage.run(context, async () => {
                errorJsx = await getErrorJSX(reqPath, queryObj, serializedError, isDevelopment, errorMeta);
              });
            } catch (errJsxErr) {
              console.error("[Edge Native SSR] Failed to get error JSX:", errJsxErr);
            }

            if (!errorJsx) {
              const errMsg = isDevelopment
                ? (ssrErr?.message || "Error")
                : "An error occurred in the Server Components render";
              const stackHtml = isDevelopment && serializedError.stack
                ? `<pre style="background:#0f172a;color:#f8fafc;padding:16px;border-radius:8px;overflow-x:auto;font-size:0.8125rem;line-height:1.6;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${serializedError.stack.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`
                : "";
              const devHelp = isDevelopment
                ? `<p style="margin:0 0 16px 0;font-size:0.875rem;color:#9f1239;line-height:1.5;">An unhandled error occurred during rendering. You can provide a custom error UI by creating an <code style="background:#ffe4e6;padding:2px 6px;border-radius:4px;font-weight:600;">error.tsx</code> file in your route folder.</p>`
                : "";
              return {
                type: "html",
                html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dinou Dev Error</title></head><body style="margin:0;background:#fff1f2;padding:20px;"><div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px;max-width:960px;margin:40px auto;background-color:#fff1f2;border:1px solid #fecdd3;border-radius:12px;color:#9f1239;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;"><span style="background:#e11d48;color:white;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:bold;">${isDevelopment ? "Dinou Dev Error" : "Application Error"}</span><h2 style="margin:0;font-size:1.25rem;font-weight:700;color:#881337;">${errMsg.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2></div>${devHelp}${stackHtml}</div></body></html>`,
                status: 500,
                headers: new Headers(bridge.headers),
                cookies: [...bridge.cookies],
              };
            }

            const errorRscStream = requestStorage.run(context, () =>
              renderRSCStream(errorJsx, clientManifest, { runtime: "edge" })
            );
            const errorClientEntry = getAssetFromManifest("main.js");
            const errorBootstrapModules = isDevelopment
              ? [
                  isWebpack ? undefined : getAssetFromManifest("runtime.js"),
                  errorClientEntry,
                ].filter(Boolean)
              : [errorClientEntry];

            let errorBootstrapScript = "";
            const knownLayouts = getDiscoveredLayouts();
            errorBootstrapScript += `window.__DINOU_LAYOUTS__ = ${JSON.stringify(knownLayouts)};\n`;
            errorBootstrapScript += "window.__DINOU_USE_STATIC__ = false;\n";
            errorBootstrapScript += `window.__DINOU_ERROR_MESSAGE__=${JSON.stringify(
              serializedError.message
            )};window.__DINOU_ERROR_NAME__=${JSON.stringify(
              serializedError.name
            )};window.__DINOU_ERROR_STACK__=${JSON.stringify(
              isDevelopment ? (serializedError.stack || "") : ""
            )};window.__DINOU_ERROR_SEGMENT__=${JSON.stringify(
              errorMeta?.hasLayout ? "page" : "layout"
            )};window.__DINOU_ACTIVE_LAYOUT__=${JSON.stringify(
              errorMeta?.appliedLayoutKey || null
            )};\n`;
            if (!errorMeta?.hasLayout) {
              errorBootstrapScript += 'document.body.setAttribute("data-hydrated", "true");\n';
            }
            if (isDevelopment) {
              const isStrictMode = dinouConfig?.reactStrictMode !== false;
              errorBootstrapScript += `window.__DINOU_STRICT_MODE__ = ${isStrictMode ? "true" : "false"};\n`;
            }
            if (isDevelopment && !isWebpack) {
              const hmrPort = process.env.HMR_PORT || (Number(process.env.PORT || 3000) + 1);
              errorBootstrapScript += `window.$RefreshReg$ = window.$RefreshReg$ || function() {};\n`;
              errorBootstrapScript += `window.$RefreshSig$ = window.$RefreshSig$ || function() { return function(type) { return type; }; };\n`;
              errorBootstrapScript += `window.HMR_WEBSOCKET_URL="ws://localhost:${hmrPort}";\n`;
            }

            try {
              await requestStorage.run(context, async () => {
                htmlStream = await platformContext.renderHtmlStream(errorRscStream, {
                  bootstrapModules: errorBootstrapModules,
                  bootstrapScriptContent: errorBootstrapScript,
                  onError(err) {
                    if (!platformContext?.isSSG || process.env.DINOU_DEBUG) {
                      console.error("[Edge Native SSR Error Page] Stream error:", err);
                    }
                  },
                });
              });
            } catch (errStreamErr) {
              console.error("[Edge Native SSR] Error stream rendering failed, using emergency HTML fallback:", errStreamErr);
              const errMsg = isDevelopment
                ? (serializedError.message || "Error")
                : "An error occurred in the Server Components render";
              const stackHtml = isDevelopment && serializedError.stack
                ? `<pre style="background:#0f172a;color:#f8fafc;padding:16px;border-radius:8px;overflow-x:auto;font-size:0.8125rem;line-height:1.6;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${serializedError.stack.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`
                : "";
              const devHelp = isDevelopment
                ? `<p style="margin:0 0 16px 0;font-size:0.875rem;color:#9f1239;line-height:1.5;">An unhandled error occurred during rendering. You can provide a custom error UI by creating an <code style="background:#ffe4e6;padding:2px 6px;border-radius:4px;font-weight:600;">error.tsx</code> file in your route folder.</p>`
                : "";
              return {
                type: "html",
                html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dinou Dev Error</title></head><body style="margin:0;background:#fff1f2;padding:20px;"><div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px;max-width:960px;margin:40px auto;background-color:#fff1f2;border:1px solid #fecdd3;border-radius:12px;color:#9f1239;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;"><span style="background:#e11d48;color:white;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:bold;">${isDevelopment ? "Dinou Dev Error" : "Application Error"}</span><h2 style="margin:0;font-size:1.25rem;font-weight:700;color:#881337;">${errMsg.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2></div>${devHelp}${stackHtml}</div></body></html>`,
                status: 500,
                headers: new Headers(bridge.headers),
                cookies: [...bridge.cookies],
              };
            }
          }

          if (bridge.headers.has("Location") || (bridge.statusCode >= 300 && bridge.statusCode < 400)) {
            return {
              type: "redirect",
              status: bridge.statusCode || 302,
              headers: new Headers(bridge.headers),
              cookies: [...bridge.cookies],
            };
          }

          if (shouldCacheISG) {
            const rscKey = cleanPath ? `${cleanPath}/rsc.rsc` : "rsc.rsc";
            let fullHtml = "";
            let rscPayload = "";
            try {
              const [rsc, html] = await requestStorage.run(context, () =>
                Promise.all([
                  new Response(streamForCache).text(),
                  new Response(htmlStream).text(),
                ])
              );
              rscPayload = rsc;
              fullHtml = html;
            } catch (drainErr) {
              console.error("[Edge ISG] Error reading streams:", drainErr);
            } finally {
              context._isStaticHtmlRender = false;
            }

            if (fullHtml) {
              if (!dynamicState.value || (platformContext.isSSG === true && !ssgPprUnwrappedBailout)) {
                if (platformContext.isSSG === true && !ssgPprUnwrappedBailout) dynamicState.value = false;
                for (const k of [reqPath, cleanPath, cleanPath ? `/${cleanPath}` : "/"]) {
                  if (!k) continue;
                  if (isDynamic.has(k)) {
                    isDynamic.get(k).value = false;
                  }
                }
                const pageSlotTags =
                  layouts && layouts.length > 0
                    ? context._pageSlotTags
                    : context._pageSlotTags && context._pageSlotTags.size > 0
                    ? context._pageSlotTags
                    : context._slotTags;
                if (pageSlotTags && pageSlotTags.size > 0) {
                  genMeta.slotTags = Array.from(pageSlotTags);
                }
                try {
                  const pageRscKey = cleanPath ? `${cleanPath}/page.rsc` : "page.rsc";
                  let pageRscText = precomputedPageRscText || "";
                  if (context._resolvedPageClientJsx) {
                    if (!pageRscText) {
                      try {
                        const pageStream = requestStorage.run(context, () =>
                          renderRSCStream(context._resolvedPageClientJsx, clientManifest, { runtime: "edge" })
                        );
                        pageRscText = await new Response(pageStream).text();
                      } catch (e) {}
                    }
                    try {
                      const shellPageKey = cleanPath ? `${cleanPath}/shell.page.json` : "shell.page.json";
                      await storage.set(shellPageKey, serializeJSX(context._resolvedPageClientJsx));
                    } catch (e) {}
                  }
                  if (!pageRscText && !platformContext?.isSSG && !genMeta.ppr) {
                    try {
                      const pageJsx = await requestStorage.run(context, () =>
                        getJSX(reqPath, queryObj, isNotFound, false, false, { segment: "page" })
                      );
                      const pageStream = requestStorage.run(context, () =>
                        renderRSCStream(pageJsx, clientManifest, { runtime: "edge" })
                      );
                      pageRscText = await new Response(pageStream).text();
                    } catch (e) {
                      pageRscText = rscPayload;
                    }
                  }
                  if (pageRscText) {
                    await storage.set(pageRscKey, pageRscText);
                  }
                  await storage.set(rscKey, rscPayload);
                  await storage.set(htmlKey, fullHtml, genMeta);
                  await storage.set(metaKey, JSON.stringify(genMeta));
                  if (genMeta.ppr) {
                    const shellHtmlKey = cleanPath ? `${cleanPath}/shell.html` : "shell.html";
                    const shellRscKey = cleanPath ? `${cleanPath}/shell.rsc` : "shell.rsc";
                    await storage.set(shellHtmlKey, fullHtml, genMeta);
                    await storage.set(shellRscKey, pageRscText || rscPayload);
                  } else if (
                    !platformContext?.isSSG &&
                    hasDynamicUrlParams &&
                    activeLayoutsForRoute.length > 0
                  ) {
                    try {
                      for (let i = activeLayoutsForRoute.length - 1; i >= 0; i--) {
                        const entry = activeLayoutsForRoute[i];
                        if (entry.isDynamicConfig) continue;
                        const ownKey = entry.cleanLayoutKey
                          ? `${entry.cleanLayoutKey}/shell.layout.own.json`
                          : "shell.layout.own.json";
                        const lMetaKey = entry.cleanLayoutKey
                          ? `${entry.cleanLayoutKey}/layout.metadata.json`
                          : "layout.metadata.json";
                        const lRscKey = entry.cleanLayoutKey
                          ? `${entry.cleanLayoutKey}/layout.rsc`
                          : "layout.rsc";
                        const [existingOwn, existingMeta] = await Promise.all([
                          readStorageArtifact(storage, ownKey, platformContext, request.url),
                          readMetaFromStorage(storage, lMetaKey, lRscKey, platformContext, request.url),
                        ]);
                        if (existingMeta?.dynamic) continue;
                        if (!existingOwn || !existingMeta) {
                          const { revalidateLayout } = await import("./cache-revalidate.js");
                          await revalidateLayout(entry.layoutRoutePath);
                        }
                      }
                    } catch (e) {}
                  }
                  if (!platformContext?.isSSG && !genMeta.ppr && !isError && context._hasResolvedSegments && pageRscText) {
                    let layoutRscText = precomputedLayoutRscText || "";
                    const hasLayoutSeg =
                      context._resolvedLayoutClientJsx !== null &&
                      context._resolvedLayoutClientJsx !== undefined;
                    if (hasLayoutSeg && !layoutRscText) {
                      try {
                        const layoutStream = requestStorage.run(context, () =>
                          renderRSCStream(context._resolvedLayoutClientJsx, clientManifest, {
                            runtime: "edge",
                          })
                        );
                        layoutRscText = await new Response(layoutStream).text();
                      } catch (e) {}
                    }
                    if (!hasLayoutSeg || layoutRscText) {
                      fullHtml = injectInlineRscIntoHtmlString(
                        fullHtml,
                        layoutRscText,
                        pageRscText,
                        hasLayoutSeg
                      );
                    }
                  }
                  if (!platformContext?.isSSG || process.env.DINOU_DEBUG) {
                    console.log(`✅ [Edge ISG] Successfully cached ${reqPath} to KV`);
                  }
                } catch (cacheErr) {
                  console.error("[Edge ISG] Error caching to KV:", cacheErr);
                }
              } else {
                if (inFlightKey) {
                  inFlightGenerations.delete(inFlightKey);
                }
                fullHtml = fullHtml.replace(
                  "window.__DINOU_USE_STATIC__ = true;",
                  "window.__DINOU_USE_STATIC__ = false;"
                );
                if (
                  !platformContext?.isSSG &&
                  !isError &&
                  context._hasResolvedSegments &&
                  context._resolvedPageClientJsx !== undefined
                ) {
                  try {
                    const hasLayoutSeg =
                      context._resolvedLayoutClientJsx !== null &&
                      context._resolvedLayoutClientJsx !== undefined;
                    const pageStream = requestStorage.run(context, () =>
                      renderRSCStream(context._resolvedPageClientJsx, clientManifest, {
                        runtime: "edge",
                      })
                    );
                    const layoutPromise = hasLayoutSeg
                      ? new Response(
                          requestStorage.run(context, () =>
                            renderRSCStream(context._resolvedLayoutClientJsx, clientManifest, {
                              runtime: "edge",
                            })
                          )
                        ).text()
                      : Promise.resolve("");
                    const [layoutRscText, pageRscText] = await Promise.all([
                      layoutPromise,
                      new Response(pageStream).text(),
                    ]);
                    if (pageRscText && (!hasLayoutSeg || layoutRscText)) {
                      fullHtml = injectInlineRscIntoHtmlString(
                        fullHtml,
                        layoutRscText,
                        pageRscText,
                        hasLayoutSeg
                      );
                    }
                  } catch (e) {}
                }
                if (!platformContext?.isSSG || process.env.DINOU_DEBUG) {
                  console.log(`ℹ️ [Edge ISG] Dynamic bailout detected during render for ${reqPath}, skipping KV cache`);
                }
              }
              return {
                type: "html",
                html: fullHtml,
                status: genMeta.status,
                headers: new Headers(bridge.headers),
                cookies: [...bridge.cookies],
              };
            }
          }

          // Dynamic streaming responses cannot be shared across multiple requests in inFlightGenerations
          if (inFlightKey) {
            inFlightGenerations.delete(inFlightKey);
          }

          if (canUseInlineRsc && !isError && htmlStream) {
            htmlStream = createInlineRscHtmlStream(htmlStream, context, clientManifest);
          }

          return {
            type: "stream",
            stream: htmlStream,
            status: genMeta.status,
            headers: new Headers(bridge.headers),
            cookies: [...bridge.cookies],
          };
        }

        throw new Error(
          "[Dinou Edge] platformContext.renderHtmlStream is required for Edge rendering. Ensure your adapter is using the dual-bundle architecture with edge-ssr."
        );
      })();

      if (inFlightKey) {
        inFlightGenerations.set(inFlightKey, isgPromise);
      }
    }

    try {
      const result = await isgPromise;
      if (result.type === "redirect") {
        bridge.status(result.status || 302);
        if (result.headers) {
          for (const [k, v] of result.headers.entries()) {
            bridge.setHeader(k, v);
          }
        }
        if (result.cookies) {
          for (const c of result.cookies) {
            if (!bridge.cookies.includes(c)) {
              bridge.cookies.push(c);
            }
          }
        }
        bridge.end();
        return bridge.toResponse();
      }

      if (result.headers) {
        for (const [k, v] of result.headers.entries()) {
          bridge.setHeader(k, v);
        }
      }
      if (result.cookies) {
        for (const c of result.cookies) {
          if (!bridge.cookies.includes(c)) {
            bridge.cookies.push(c);
          }
        }
      }
      bridge.setHeader("Content-Type", "text/html; charset=utf-8");
      if (!bridge.headers.has("Cache-Control")) {
        if (!bridge.headers.has("Cache-Control")) {
  bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
}
      }
      if (
        !bridge._explicitStatusSet ||
        result.status === 404 ||
        result.status === 500
      ) {
        bridge.status(result.status || 200);
      }

      if (result.type === "stream") {
        bridge.setEdgeStream(result.stream);
        return bridge.toResponse();
      }

      bridge.end(result.html);
      return bridge.toResponse();
    } finally {
      if (inFlightKey) {
        inFlightGenerations.delete(inFlightKey);
      }
    }
  }

  // Node.js Runtime: Serve static pre-rendered HTML if available in production
  if (!isDevelopment && (!dynamicState.value || isPprConfig) && pagePath && !isPathBlocked) {
    revalidating(reqPath, dynamicState);
    let htmlPathOld;
    if (regenerating.has(reqPath)) {
      htmlPathOld = path.join(".dinou/dist2", reqPath, "index._old.html");
    }
    const htmlPath = path.join(".dinou/dist2", reqPath, "index.html");
    const shellHtmlPath = path.join(".dinou/dist2", reqPath, "shell.html");
    const fileToRead =
      htmlPathOld && existsSync(htmlPathOld)
        ? htmlPathOld
        : existsSync(htmlPath)
        ? htmlPath
        : isPprConfig && existsSync(shellHtmlPath)
        ? shellHtmlPath
        : htmlPath;

    if (existsSync(fileToRead) && (!dynamicState.value || isPprConfig)) {
      bridge.setHeader("Content-Type", "text/html; charset=utf-8");
      if (!bridge.headers.has("Cache-Control")) {
  bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
}
      let status = getStatus(reqPath);
      try {
        let htmlContent = readFileSync(fileToRead, "utf8");
        let buildId = "";
        try {
          const metadataPath = path.join(".dinou/dist2", reqPath, "metadata.json");
          if (existsSync(metadataPath)) {
            const metaObj = JSON.parse(readFileSync(metadataPath, "utf8"));
            buildId = metaObj.generatedAt || "";
            if (!status && metaObj.status) {
              status = metaObj.status;
            }
            if (metaObj.ppr || isPprConfig) {
              return handlePprResume({
                reqPath,
                queryObj,
                simReq,
                bridge,
                platformContext,
                rootContext,
                cachedItem: { content: htmlContent, metadata: metaObj },
                metadata: metaObj,
                isDevelopment,
                getDiscoveredLayouts,
                createRequestContext,
                copyCustomContextProperties,
              });
            }
          }
        } catch (e) {}

        if (!bridge._explicitStatusSet) {
          bridge.status(status || 200);
        }

        const knownLayouts = getDiscoveredLayouts();
        let scripts = `<script>window.__DINOU_USE_STATIC__=true;window.__DINOU_LAYOUTS__=${JSON.stringify(knownLayouts)};</script>`;
        if (htmlPathOld && existsSync(htmlPathOld)) {
          scripts += `<script>window.__DINOU_USE_OLD_RSC__=true;</script>`;
        }
        if (buildId) {
          scripts += `<script>window.__DINOU_BUILD_ID__="${buildId}";</script>`;
        }

        htmlContent = htmlContent.replace("</head>", `${scripts}</head>`);
        bridge.end(htmlContent);
        return bridge.toResponse();
      } catch (err) {
        console.error("[Dinou] Error reading HTML file:", err);
        if (!bridge.headersSent) bridge.status(500).send("Server Error");
        return bridge.toResponse();
      }
    }
  }

  if (!bridge.headersSent) {
    bridge.status(500).send("Internal Server Error: No renderer available");
  }
  return bridge.toResponse();
  });
}

export {
  handleRequest,
  WebResponseBridge,
  resolvePageFunctionsConfig,
};
export default handleRequest;
