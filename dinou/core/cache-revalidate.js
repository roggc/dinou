import path from "node:path";
import fs from "node:fs/promises";
import { existsSync, copyFileSync } from "node:fs";
import { AsyncLocalStorage } from "node:async_hooks";
import { getContext, requestStorage } from "./request-context.js";
import { resolveRelativeUrl } from "./url-resolver.js";
import { getStorageAdapter } from "./storage-adapter.js";
import { isEdgeRuntime, renderRSCStream } from "./rsc-renderer.js";
import getJSX from "./get-jsx.js";
import { getFilePathAndDynamicParams } from "./get-file-path-and-dynamic-params.js";
import { getActiveLayoutChain, resolveLayoutFunctionsConfig } from "./layout-functions.js";
import importModule from "./import-module.js";
import { resolveModulePpr } from "./resolve-module-ppr.js";
import { getDinouConfig } from "./load-dinou-config.js";
import { createBailoutProxy } from "./bailout-proxy.js";
import {
  runWithPprContext,
  resetPprHoles,
  getRegisteredHoles,
  getPprHoleCounter,
  runInPageSegment,
  runInLayoutSegment,
} from "./ppr-context.js";
import { asyncRenderJSXToClientJSX } from "./render-jsx-to-client-jsx.js";
import {
  serializeJSX,
  deserializeJSX,
  refreshNestedSlotsInTree,
} from "./cache-slot.js";

const INFLIGHT_LAYOUT_REVAL_KEY = Symbol.for("dinou.layout.inflight.revalidations");
if (!globalThis[INFLIGHT_LAYOUT_REVAL_KEY]) {
  globalThis[INFLIGHT_LAYOUT_REVAL_KEY] = new Map();
}
const inflightLayoutRevalidations = globalThis[INFLIGHT_LAYOUT_REVAL_KEY];

const REVAL_QUEUE_STORAGE_KEY = Symbol.for("dinou.reval.queue.storage");
if (!globalThis[REVAL_QUEUE_STORAGE_KEY]) {
  globalThis[REVAL_QUEUE_STORAGE_KEY] = new AsyncLocalStorage();
}
const revalQueueStorage = globalThis[REVAL_QUEUE_STORAGE_KEY];

const REVAL_STATE_KEY = Symbol.for("dinou.reval.queue.state");
if (!globalThis[REVAL_STATE_KEY]) {
  globalThis[REVAL_STATE_KEY] = {
    queue: Promise.resolve(),
    lastGenTime: 0,
  };
}
const revalState = globalThis[REVAL_STATE_KEY];

function markRouteDynamicInMap(reqPathWithSlash, cleanPath, isDyn) {
  const map = typeof globalThis !== "undefined" ? globalThis[Symbol.for("dinou.isDynamic.map")] : null;
  if (!map) return;
  for (const key of [reqPathWithSlash, cleanPath]) {
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, { value: Boolean(isDyn) });
    } else {
      map.get(key).value = Boolean(isDyn);
    }
  }
}

function nextMonotonicGenTime(prevGenTime = 0) {
  const now = Date.now();
  const next = Math.max(now, Number(prevGenTime || 0) + 1, revalState.lastGenTime + 1);
  revalState.lastGenTime = next;
  return next;
}

function enqueueRevalidation(fn) {
  if (revalQueueStorage.getStore()) {
    return fn();
  }
  const run = () => revalQueueStorage.run(true, fn);
  const nextPromise = revalState.queue.then(run, run);
  revalState.queue = nextPromise.catch(() => {});
  return nextPromise;
}

async function resolveRouteConfigForRevalidate(pagePath, reqSegments, existingMeta = {}) {
  const srcFolder = path.resolve(process.cwd(), "src");
  let isRoutePpr =
    typeof existingMeta?.ppr === "boolean" ? existingMeta.ppr : null;
  let tags = Array.isArray(existingMeta?.tags) ? existingMeta.tags : null;
  let revalidate = existingMeta?.revalidate;
  let pageRevalidate = existingMeta?.pageRevalidate;

  let pfMod = null;
  let dParams = {};
  if (pagePath) {
    try {
      const [, resolvedParams] = getFilePathAndDynamicParams(
        reqSegments,
        {},
        srcFolder
      );
      dParams = resolvedParams ?? {};
      const pageFolder = path.dirname(pagePath);
      const [pageFunctionsPath] = getFilePathAndDynamicParams(
        reqSegments,
        {},
        pageFolder,
        "page_functions",
        true,
        true,
        undefined,
        reqSegments.length
      );
      if (pageFunctionsPath) {
        pfMod = await importModule(pageFunctionsPath);
      }
    } catch (e) {}
  }

  if (isRoutePpr === null) {
    let inheritedPpr = false;
    try {
      const globalCfg = await getDinouConfig();
      inheritedPpr = Boolean(globalCfg?.ppr);
      const layouts = getFilePathAndDynamicParams(
        reqSegments,
        {},
        srcFolder,
        "layout",
        true,
        false,
        undefined,
        0,
        {},
        true
      );
      if (layouts && Array.isArray(layouts)) {
        for (const [lPath, lParams] of layouts) {
          const lConfig = await resolveLayoutFunctionsConfig(lPath, lParams);
          if (lConfig && lConfig.ppr !== null && lConfig.ppr !== undefined) {
            inheritedPpr = Boolean(lConfig.ppr);
          }
        }
      }
    } catch (e) {}

    let explicitPagePpr = null;
    if (pfMod) {
      try {
        explicitPagePpr = await resolveModulePpr(pfMod);
      } catch (e) {}
    }
    isRoutePpr = explicitPagePpr !== null ? explicitPagePpr : inheritedPpr;
  }

  if ((!tags || tags.length === 0) && pfMod) {
    try {
      const defaultExport = pfMod.default?.default
        ? pfMod.default.default
        : pfMod.default;
      const rawTags = pfMod.getCacheTags ?? defaultExport?.getCacheTags;
      if (typeof rawTags === "function") {
        tags = await rawTags(dParams);
      } else if (Array.isArray(rawTags)) {
        tags = rawTags;
      }
    } catch (e) {}
  }

  if ((revalidate === undefined || pageRevalidate === undefined) && pfMod) {
    try {
      const defaultExport = pfMod.default?.default
        ? pfMod.default.default
        : pfMod.default;
      const pfRevalidate =
        typeof pfMod.revalidate === "function"
          ? await pfMod.revalidate()
          : typeof defaultExport?.revalidate === "function"
          ? await defaultExport.revalidate()
          : pfMod.revalidate ?? defaultExport?.revalidate;
      if (revalidate === undefined) {
        revalidate = pfRevalidate;
      }
      if (pageRevalidate === undefined) {
        pageRevalidate = pfRevalidate !== undefined ? pfRevalidate : null;
      }
    } catch (e) {}
  }
  if (pageRevalidate === undefined) {
    pageRevalidate = null;
  }

  return {
    isRoutePpr: Boolean(isRoutePpr),
    tags: Array.isArray(tags) ? tags : [],
    revalidate,
    pageRevalidate,
  };
}

async function walkMetadataFiles(dir, fileList = []) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walkMetadataFiles(entryPath, fileList);
      } else if (
        entry.name === "metadata.json" ||
        entry.name === "layout.metadata.json" ||
        entry.name === "slot.metadata.json"
      ) {
        fileList.push(entryPath);
      }
    }
  } catch (err) {
    // Ignore read errors for individual folders/files
  }
  return fileList;
}

function normalizeRevalidatePath(reqPath) {
  let targetPath = reqPath;

  if (targetPath && !targetPath.startsWith("/") && !targetPath.includes("://")) {
    const ctx = getContext();
    let currentPathname = "/";
    if (ctx && ctx.req) {
      const headerPath =
        ctx.req.headers?.["x-dinou-current-path"] ||
        ctx.req.headers?.["X-Dinou-Current-Path"];
      const referer = ctx.req.headers?.referer;
      if (headerPath) {
        currentPathname = headerPath;
      } else if (referer) {
        try {
          currentPathname = new URL(referer).pathname;
        } catch (e) {}
      } else {
        currentPathname = ctx.req.path || "/";
      }
    }
    targetPath = resolveRelativeUrl(targetPath, currentPathname);
  }

  let cleanPath = targetPath;
  if (!cleanPath.startsWith("/")) {
    cleanPath = "/" + cleanPath;
  }
  if (cleanPath !== "/" && cleanPath.endsWith("/")) {
    cleanPath = cleanPath.slice(0, -1);
  }
  return cleanPath;
}

async function revalidatePage(reqPath, internalOptions = {}) {
  const cleanPath = normalizeRevalidatePath(reqPath);
  const onlyRefreshSlots = Boolean(internalOptions?.onlyRefreshSlots);
  return enqueueRevalidation(async () => {
  if (isEdgeRuntime()) {
    const storage = getStorageAdapter();
    const cleanPathKey = cleanPath.replace(/^\/+/, "").replace(/\/+$/, "");
    const htmlKey = cleanPathKey ? `${cleanPathKey}/index.html` : "index.html";
    const shellHtmlKey = cleanPathKey ? `${cleanPathKey}/shell.html` : "shell.html";
    const oldHtmlKey = cleanPathKey ? `${cleanPathKey}/index._old.html` : "index._old.html";
    const metaKey = cleanPathKey ? `${cleanPathKey}/metadata.json` : "metadata.json";
    const rscKey = cleanPathKey ? `${cleanPathKey}/page.rsc` : "page.rsc";
    const shellRscKey = cleanPathKey ? `${cleanPathKey}/shell.rsc` : "shell.rsc";
    const shellPageKey = cleanPathKey ? `${cleanPathKey}/shell.page.json` : "shell.page.json";
    const oldRscKey = cleanPathKey ? `${cleanPathKey}/page._old.rsc` : "page._old.rsc";
    const legacyRscKey = cleanPathKey ? `${cleanPathKey}/rsc.rsc` : "rsc.rsc";

    let cached = await storage.get(htmlKey);
    if (!cached && cleanPathKey) {
      cached = await storage.get(cleanPathKey);
    }
    if (!cached) {
      cached = await storage.get(shellHtmlKey);
    }
    let currentMeta = (cached && cached.metadata) || {};
    try {
      const metaItem = await storage.get(metaKey);
      if (metaItem && metaItem.content) {
        currentMeta = JSON.parse(metaItem.content);
      }
    } catch (e) {}

    let existingPageRsc = null;
    try {
      existingPageRsc = await storage.get(rscKey);
    } catch (e) {}

    const reqPathWithSlash = cleanPath.endsWith("/") ? cleanPath : cleanPath + "/";
    const reqSegments = cleanPath.split("/").filter(Boolean);
    const srcFolder = path.resolve(process.cwd(), "src");
    const [pagePath] = getFilePathAndDynamicParams(reqSegments, {}, srcFolder);

    const routeCfg = await resolveRouteConfigForRevalidate(
      pagePath,
      reqSegments,
      currentMeta
    );
    const isRoutePpr = routeCfg.isRoutePpr;
    if (!Array.isArray(currentMeta.tags) || currentMeta.tags.length === 0) {
      currentMeta.tags = routeCfg.tags;
    }
    if (currentMeta.revalidate === undefined && routeCfg.revalidate !== undefined) {
      currentMeta.revalidate = routeCfg.revalidate;
    }
    if (currentMeta.pageRevalidate === undefined && routeCfg.pageRevalidate !== undefined) {
      currentMeta.pageRevalidate = routeCfg.pageRevalidate;
    }
    if (currentMeta.status === undefined) {
      currentMeta.status = 200;
    }

    let activeLayoutRscText = "";
    let maxActiveLayoutGenTime = 0;
    let leafSuspenseCount = 0;
    let leafHoles = [];
    try {
      const activeChain = getActiveLayoutChain(reqSegments, {}, srcFolder);
      if (activeChain.length > 0) {
        for (const entry of activeChain) {
          const lMetaKey = entry.cleanLayoutKey
            ? `${entry.cleanLayoutKey}/layout.metadata.json`
            : "layout.metadata.json";
          const lItem = await storage.get(lMetaKey);
          let lMetaObj = lItem?.metadata || null;
          if (!lMetaObj && lItem?.content) {
            try {
              lMetaObj = JSON.parse(lItem.content);
            } catch (e) {}
          }
          const lGen = Number(lMetaObj?.generatedAt || 0);
          entry.generatedAt = lGen;
          entry.suspenseCount = Number(lMetaObj?.suspenseCount || 0);
          entry.holes = Array.isArray(lMetaObj?.holes) ? lMetaObj.holes : [];
          if (lGen > maxActiveLayoutGenTime) {
            maxActiveLayoutGenTime = lGen;
          }
        }
        const leafLayout = activeChain[0];
        if (activeChain.length > 1 && maxActiveLayoutGenTime > (leafLayout.generatedAt || 0)) {
          await revalidateLayout(leafLayout.layoutRoutePath);
          const refreshedMetaKey = leafLayout.cleanLayoutKey
            ? `${leafLayout.cleanLayoutKey}/layout.metadata.json`
            : "layout.metadata.json";
          const refreshedItem = await storage.get(refreshedMetaKey);
          if (refreshedItem?.content) {
            try {
              const parsed = JSON.parse(refreshedItem.content);
              leafLayout.generatedAt = Number(parsed?.generatedAt || leafLayout.generatedAt || 0);
              leafLayout.suspenseCount = Number(parsed?.suspenseCount || 0);
              leafLayout.holes = Array.isArray(parsed?.holes) ? parsed.holes : [];
              if (leafLayout.generatedAt > maxActiveLayoutGenTime) {
                maxActiveLayoutGenTime = leafLayout.generatedAt;
              }
            } catch (e) {}
          }
        }
        leafSuspenseCount = Number(leafLayout.suspenseCount || 0);
        leafHoles = Array.isArray(leafLayout.holes) ? leafLayout.holes : [];
        const leafRscKey = leafLayout.cleanLayoutKey
          ? `${leafLayout.cleanLayoutKey}/layout.rsc`
          : "layout.rsc";
        const leafRscItem = await storage.get(leafRscKey);
        if (leafRscItem && leafRscItem.content && !leafRscItem.content.trimStart().startsWith("<")) {
          activeLayoutRscText = leafRscItem.content;
        }
      }
    } catch (e) {}

    const prevGenTime = Math.max((currentMeta && currentMeta.generatedAt) || 0, maxActiveLayoutGenTime);
    const now = Date.now();
    const newGenTime = nextMonotonicGenTime(prevGenTime);
    currentMeta.generatedAt = newGenTime;
    currentMeta.pageGeneratedAt = newGenTime;

    let newHtml = cached ? cached.content : "";
    let renderedRsc = "";
    let renderedFullRsc = "";
    let composedFromCachedLayout = false;

    if (pagePath) {
      const revalDynamicState = { value: false };
      const rawHeaders = {
        "user-agent": "Dinou-ISR-Revalidator",
        host: "localhost",
        "x-forwarded-proto": "http",
      };
      const markRevalDynamic = () => {
        revalDynamicState.value = true;
      };
      const revalContext = {
        req: {
          query: createBailoutProxy({}, "req.query", markRevalDynamic),
          cookies: createBailoutProxy({}, "req.cookies", markRevalDynamic),
          headers: createBailoutProxy(rawHeaders, "req.headers", markRevalDynamic),
          path: reqPathWithSlash,
          method: "GET",
        },
        res: {
          status() {},
          setHeader() {
            markRevalDynamic();
          },
          cookie() {
            markRevalDynamic();
          },
          clearCookie() {
            markRevalDynamic();
          },
          redirect() {
            markRevalDynamic();
          },
        },
      };
      const clientManifest =
        (typeof globalThis !== "undefined" && globalThis.__DINOU_CLIENT_MANIFEST__) || {};

      try {
        await requestStorage.run(revalContext, async () => {
          const isNotFound = {};
          let resolvedPageJsx = null;

          if (onlyRefreshSlots) {
            try {
              const existingShellPage = await storage.get(shellPageKey);
              if (existingShellPage && existingShellPage.content) {
                const deserialized = deserializeJSX(existingShellPage.content);
                resolvedPageJsx = await runInPageSegment(() =>
                  refreshNestedSlotsInTree(deserialized, "__ppr_shell__", {
                    currentPath: reqPathWithSlash,
                  })
                );
                if (resolvedPageJsx) {
                  await storage.set(shellPageKey, serializeJSX(resolvedPageJsx));
                }
              }
            } catch (e) {
              resolvedPageJsx = null;
            }
          }

          if (isRoutePpr) {
            let pageHoles = Array.isArray(currentMeta.holes) ? currentMeta.holes : [];
            if (!resolvedPageJsx) {
              await runWithPprContext({ isPpr: true }, async () => {
                const rawPageJsx = await getJSX(
                  reqPathWithSlash,
                  {},
                  isNotFound,
                  false,
                  false,
                  { segment: "page" }
                );
                resetPprHoles(leafSuspenseCount);
                resolvedPageJsx = await runInPageSegment(() =>
                  asyncRenderJSXToClientJSX(rawPageJsx)
                );
                pageHoles = getRegisteredHoles();
              });
              if (resolvedPageJsx && !isNotFound.value) {
                try {
                  await storage.set(shellPageKey, serializeJSX(resolvedPageJsx));
                } catch (e) {}
              }
            }
            if (resolvedPageJsx && !isNotFound.value) {
              const pageStream = renderRSCStream(resolvedPageJsx, clientManifest, {
                runtime: "edge",
              });
              renderedRsc = await new Response(pageStream).text();
            }
            currentMeta.ppr = true;
            const mergedHoles = Array.from(new Set([...leafHoles, ...pageHoles]));
            if (mergedHoles.length > 0 || !Array.isArray(currentMeta.holes)) {
              currentMeta.holes = mergedHoles;
            }
          } else {
            if (!resolvedPageJsx) {
              const rawPageJsx = await getJSX(
                reqPathWithSlash,
                {},
                isNotFound,
                false,
                false,
                {
                  segment: "page",
                }
              );
              if (revalDynamicState.value) {
                return;
              }
              if (rawPageJsx && !isNotFound.value) {
                resolvedPageJsx = await runInPageSegment(() =>
                  asyncRenderJSXToClientJSX(rawPageJsx)
                );
                if (revalDynamicState.value) {
                  return;
                }
                if (resolvedPageJsx) {
                  try {
                    await storage.set(shellPageKey, serializeJSX(resolvedPageJsx));
                  } catch (e) {}
                }
              }
            }
            if (resolvedPageJsx && !isNotFound.value) {
              const pageStream = renderRSCStream(resolvedPageJsx, clientManifest, {
                runtime: "edge",
              });
              renderedRsc = await new Response(pageStream).text();
            }
          }

          const pageSlotTags = revalContext._pageSlotTags || revalContext._slotTags;
          if (pageSlotTags && pageSlotTags.size > 0) {
            currentMeta.slotTags = Array.from(pageSlotTags);
          }

          const renderHtmlStream =
            typeof globalThis !== "undefined" && globalThis.__DINOU_RENDER_HTML_STREAM__;
          const knownLayouts =
            (typeof globalThis !== "undefined" && globalThis.__DINOU_LAYOUTS__) || [];
          const bootstrapScriptContent = isRoutePpr
            ? `window.__DINOU_LAYOUTS__ = ${JSON.stringify(knownLayouts)};\nwindow.__DINOU_USE_STATIC__ = false;\nwindow.__DINOU_PPR__ = true;\nwindow.__DINOU_BUILD_ID__ = "${newGenTime}";\n`
            : `window.__DINOU_LAYOUTS__ = ${JSON.stringify(knownLayouts)};\nwindow.__DINOU_USE_STATIC__ = true;\nwindow.__DINOU_BUILD_ID__ = "${newGenTime}";\n`;
          const assetManifest =
            (typeof globalThis !== "undefined" && globalThis.__DINOU_ASSET_MANIFEST__) || {};
          const rawMain = assetManifest["main.js"] || "/main.js";
          const clientEntry = rawMain.startsWith("/") ? rawMain : "/" + rawMain;

          const encoder = new TextEncoder();
          const toStream = (str) =>
            new ReadableStream({
              start(controller) {
                controller.enqueue(encoder.encode(str));
                controller.close();
              },
            });

          if (activeLayoutRscText && renderedRsc && typeof renderHtmlStream === "function") {
            try {
              const htmlStream = await renderHtmlStream(toStream(activeLayoutRscText), {
                pageRscStream: toStream(renderedRsc),
                bootstrapModules: [clientEntry],
                bootstrapScriptContent,
                waitForAll: true,
              });
              const htmlText = await new Response(htmlStream).text();
              if (htmlText) {
                newHtml = htmlText;
                composedFromCachedLayout = true;
              }
            } catch (composeErr) {
              if (process.env.DINOU_DEBUG) {
                console.warn(`⚠️ [Edge Revalidate] Layout+Page composition fallback for ${cleanPath}:`, composeErr?.message || composeErr);
              }
            }
          }

          if (!composedFromCachedLayout) {
            let fullJsx = null;
            if (isRoutePpr) {
              await runWithPprContext({ isPpr: true }, async () => {
                const rawFullJsx = await getJSX(
                  reqPathWithSlash,
                  {},
                  isNotFound,
                  false,
                  false
                );
                resetPprHoles(0);
                fullJsx = await asyncRenderJSXToClientJSX(rawFullJsx);
                const fullHoles = getRegisteredHoles();
                if (fullHoles.length > 0) {
                  currentMeta.holes = fullHoles;
                }
              });
            } else {
              fullJsx = await getJSX(reqPathWithSlash, {}, isNotFound, false, false);
              if (revalDynamicState.value) {
                return;
              }
            }
            if (fullJsx && !isNotFound.value) {
              const fullRscStream = renderRSCStream(fullJsx, clientManifest, { runtime: "edge" });
              if (typeof renderHtmlStream === "function") {
                const [streamForSsr, streamForRsc] = fullRscStream.tee();
                const [rscText, htmlStream] = await Promise.all([
                  new Response(streamForRsc).text(),
                  renderHtmlStream(streamForSsr, {
                    bootstrapModules: [clientEntry],
                    bootstrapScriptContent,
                    waitForAll: true,
                  }),
                ]);
                renderedFullRsc = rscText;
                const htmlText = await new Response(htmlStream).text();
                if (htmlText) {
                  newHtml = htmlText;
                }
              } else {
                renderedFullRsc = await new Response(fullRscStream).text();
              }
            }
          }
        });
      } catch (e) {
        console.warn(`⚠️ [Edge Revalidate] Render fallback for ${cleanPath}:`, e?.message || e);
      }
      if (revalDynamicState.value && !isRoutePpr) {
        markRouteDynamicInMap(reqPathWithSlash, cleanPath, true);
        console.log(`[ISR] Bailout detected for ${cleanPath}. Switching to Dynamic.`);
        return;
      }
      markRouteDynamicInMap(reqPathWithSlash, cleanPath, false);
    }

    try {
      if (cached && cached.content) {
        await storage.set(oldHtmlKey, cached.content);
      }
      if (existingPageRsc && existingPageRsc.content) {
        await storage.set(oldRscKey, existingPageRsc.content);
      }
    } catch (e) {}

    if (newHtml && ((!renderedFullRsc && !composedFromCachedLayout) || now <= prevGenTime)) {
      newHtml = newHtml.replace(
        /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
        new Date(newGenTime).toISOString()
      );
    }
    await storage.set(htmlKey, newHtml, currentMeta);
    if (isRoutePpr) {
      await storage.set(shellHtmlKey, newHtml, currentMeta);
    }
    if (cleanPathKey) {
      await storage.set(cleanPathKey, newHtml, currentMeta);
    }
    await storage.set(metaKey, JSON.stringify(currentMeta));

    try {
      if (renderedRsc) {
        const finalRsc =
          now <= prevGenTime
            ? renderedRsc.replace(
                /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
                new Date(newGenTime).toISOString()
              )
            : renderedRsc;
        await storage.set(rscKey, finalRsc);
        if (isRoutePpr) {
          await storage.set(shellRscKey, finalRsc);
        }
        if (renderedFullRsc) {
          const finalFullRsc =
            now <= prevGenTime
              ? renderedFullRsc.replace(
                  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
                  new Date(newGenTime).toISOString()
                )
              : renderedFullRsc;
          await storage.set(legacyRscKey, finalFullRsc);
        }
      } else {
        let cachedRsc = await storage.get(rscKey);
        if (!cachedRsc) {
          cachedRsc = await storage.get(legacyRscKey);
        }
        if (cachedRsc && cachedRsc.content) {
          const newRsc = cachedRsc.content.replace(
            /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
            new Date(newGenTime).toISOString()
          );
          await storage.set(rscKey, newRsc);
        }
      }
    } catch (e) {}

    console.log(`✅ [Edge Revalidate] Successfully revalidated page ${cleanPath} (generatedAt: ${newGenTime})`);
    return;
  }

  const dist2Folder = path.resolve(process.cwd(), ".dinou/dist2");
  const reqPathWithSlash = cleanPath.endsWith("/") ? cleanPath : cleanPath + "/";

  // Check if there is an existing page to copy to _old
  try {
    if (existsSync(path.join(dist2Folder, reqPathWithSlash, "index.html"))) {
      copyFileSync(
        path.join(dist2Folder, reqPathWithSlash, "index.html"),
        path.join(dist2Folder, reqPathWithSlash, "index._old.html")
      );
    }
    if (existsSync(path.join(dist2Folder, reqPathWithSlash, "page.rsc"))) {
      copyFileSync(
        path.join(dist2Folder, reqPathWithSlash, "page.rsc"),
        path.join(dist2Folder, reqPathWithSlash, "page._old.rsc")
      );
    }
    if (existsSync(path.join(dist2Folder, reqPathWithSlash, "rsc.rsc"))) {
      copyFileSync(
        path.join(dist2Folder, reqPathWithSlash, "rsc.rsc"),
        path.join(dist2Folder, reqPathWithSlash, "rsc._old.rsc")
      );
    }
  } catch (e) {
    // Ignore copy errors
  }

  console.log(`[Revalidate] Starting on-demand page revalidation for ${cleanPath}...`);
  try {
    const isDynamic = {};
    await getBuildStaticPage()(cleanPath, isDynamic);
    if (isDynamic.value) {
      console.log(`[Revalidate] Bailout detected for ${cleanPath}. Switching to dynamic (skipping static write).`);
      return;
    }

    const rscResult = await getGenerateStaticRSC()(cleanPath);
    if (!rscResult.success) {
      console.warn(`⚠️ [Revalidate] RSC generation failed for ${cleanPath}.`);
      if (rscResult.tempPath && existsSync(rscResult.tempPath)) {
        await fs.unlink(rscResult.tempPath).catch(() => {});
      }
      return;
    }

    await getSafeRename()(rscResult.tempPath, rscResult.finalPath);

    const pageResult = await getGenerateStaticPage()(cleanPath);
    if (pageResult.success) {
      await getSafeRename()(pageResult.tempPath, pageResult.finalPath);
      getUpdateStatus()(cleanPath, pageResult.status);
      console.log(`✅ [Revalidate] Successfully revalidated page ${cleanPath} (Status: ${pageResult.status})`);
    } else {
      console.warn(`⚠️ [Revalidate] HTML generation failed for ${cleanPath}.`);
      if (pageResult.tempPath && existsSync(pageResult.tempPath)) {
        await fs.unlink(pageResult.tempPath).catch(() => {});
      }
    }
  } catch (e) {
    console.warn(`⚠️ [Revalidate] Failed to revalidate page ${cleanPath}:`, e.message || e);
  }
  });
}

async function revalidatePath(reqPath, options) {
  if (options !== undefined) {
    console.warn(
      `⚠️ [Dinou] The second parameter (options) in revalidatePath("${reqPath}", ...) is deprecated and ignored since v9.0.3. Zero hydration mismatch is now guaranteed automatically via lazy index.html re-composition.`
    );
  }
  const cleanPath = normalizeRevalidatePath(reqPath);

  if (isEdgeRuntime()) {
    const storage = getStorageAdapter();
    const cleanPathKey = cleanPath.replace(/^\/+/, "").replace(/\/+$/, "");
    const layoutRscKey = cleanPathKey ? `${cleanPathKey}/layout.rsc` : "layout.rsc";
    const layoutMetaKey = cleanPathKey ? `${cleanPathKey}/layout.metadata.json` : "layout.metadata.json";

    // 1. Revalidar primero el layout si existe para este segmento (para que revalidatePage componga con el layout fresco)
    const cachedLayout = await storage.get(layoutRscKey);
    const cachedLayoutMeta = await storage.get(layoutMetaKey);
    if (cachedLayout || cachedLayoutMeta) {
      await revalidateLayout(cleanPath);
    }

    // 2. Revalidar la página
    await revalidatePage(cleanPath);
    return;
  }

  const dist2Folder = path.resolve(process.cwd(), ".dinou/dist2");
  const reqPathWithSlash = cleanPath.endsWith("/") ? cleanPath : cleanPath + "/";
  const targetDir = path.join(dist2Folder, reqPathWithSlash);

  // 1. Revalidar el layout si existe en este segmento
  const layoutFinalPath = path.join(targetDir, "layout.rsc");
  const layoutOldPath = path.join(targetDir, "layout._old.rsc");
  if (existsSync(layoutFinalPath) || existsSync(layoutOldPath)) {
    await revalidateLayout(cleanPath);
  }

  // 2. Revalidar la página
  await revalidatePage(cleanPath);
}

async function revalidateLayout(cleanPath, internalOptions = {}) {
  let targetPath = cleanPath;
  if (!targetPath.startsWith("/")) {
    targetPath = "/" + targetPath;
  }
  if (targetPath !== "/" && targetPath.endsWith("/")) {
    targetPath = targetPath.slice(0, -1);
  }
  const onlyRefreshSlots = Boolean(internalOptions?.onlyRefreshSlots);
  const inFlightKey = `${targetPath}:${onlyRefreshSlots ? "slots" : "full"}`;

  if (inflightLayoutRevalidations.has(inFlightKey)) {
    return inflightLayoutRevalidations.get(inFlightKey);
  }

  const revalPromise = enqueueRevalidation(async () => {
    if (isEdgeRuntime()) {
      const storage = getStorageAdapter();
      const cleanPathKey = targetPath.replace(/^\/+/, "").replace(/\/+$/, "");
      const layoutRscKey = cleanPathKey ? `${cleanPathKey}/layout.rsc` : "layout.rsc";
      const layoutOldRscKey = cleanPathKey ? `${cleanPathKey}/layout._old.rsc` : "layout._old.rsc";
      const layoutMetaKey = cleanPathKey ? `${cleanPathKey}/layout.metadata.json` : "layout.metadata.json";
      const shellLayoutKey = cleanPathKey ? `${cleanPathKey}/shell.layout.json` : "shell.layout.json";

      let cached = await storage.get(layoutRscKey);
      let currentMeta = (cached && cached.metadata) || {};
      try {
        const metaItem = await storage.get(layoutMetaKey);
        if (metaItem && metaItem.content) {
          currentMeta = JSON.parse(metaItem.content);
        }
      } catch (e) {}

      try {
        if (cached && cached.content) {
          await storage.set(layoutOldRscKey, cached.content);
        }
      } catch (e) {}

      const reqSegments = targetPath.split("/").filter(Boolean);
      const srcFolder = path.resolve(process.cwd(), "src");
      try {
        const [layoutPath, layoutParams] = getFilePathAndDynamicParams(
          reqSegments,
          {},
          srcFolder,
          "layout",
          true,
          false,
          undefined,
          0
        );
        if (layoutPath) {
          const layoutCfg = await resolveLayoutFunctionsConfig(layoutPath, layoutParams || {});
          if (Array.isArray(layoutCfg.tags) && layoutCfg.tags.length > 0) {
            currentMeta.tags = layoutCfg.tags;
          } else if (!Array.isArray(currentMeta.tags)) {
            currentMeta.tags = [];
          }
          if (layoutCfg.revalidate !== undefined) {
            currentMeta.revalidate = layoutCfg.revalidate;
          }
          if (layoutCfg.ppr !== null && layoutCfg.ppr !== undefined) {
            currentMeta.ppr = Boolean(layoutCfg.ppr);
          }
        }
      } catch (e) {}

      const prevGenTime = (currentMeta && currentMeta.generatedAt) || 0;
      const now = Date.now();
      const newGenTime = nextMonotonicGenTime(prevGenTime);
      currentMeta.generatedAt = newGenTime;
      if (currentMeta.status === undefined) {
        currentMeta.status = 200;
      }

      const reqPathWithSlash = targetPath.endsWith("/") ? targetPath : targetPath + "/";
      let newLayoutRsc = cached && cached.content ? cached.content : "";
      try {
        const revalDynamicState = { value: false };
        const rawHeaders = {
          "user-agent": "Dinou-ISR-Revalidator",
          host: "localhost",
          "x-forwarded-proto": "http",
        };
        const markRevalDynamic = () => {
          revalDynamicState.value = true;
        };
        const revalContext = {
          req: {
            query: createBailoutProxy({}, "req.query", markRevalDynamic),
            cookies: createBailoutProxy({}, "req.cookies", markRevalDynamic),
            headers: createBailoutProxy(rawHeaders, "req.headers", markRevalDynamic),
            path: reqPathWithSlash,
            method: "GET",
          },
          res: {
            status() {},
            setHeader() {
              markRevalDynamic();
            },
            cookie() {
              markRevalDynamic();
            },
            clearCookie() {
              markRevalDynamic();
            },
            redirect() {
              markRevalDynamic();
            },
          },
        };
        const clientManifest =
          (typeof globalThis !== "undefined" && globalThis.__DINOU_CLIENT_MANIFEST__) || {};
        await requestStorage.run(revalContext, async () => {
          let resolvedLayoutJsx = null;
          if (onlyRefreshSlots) {
            try {
              const existingShellLayout = await storage.get(shellLayoutKey);
              if (existingShellLayout && existingShellLayout.content) {
                const deserialized = deserializeJSX(existingShellLayout.content);
                resolvedLayoutJsx = await runInLayoutSegment(() =>
                  refreshNestedSlotsInTree(deserialized, "__layout_shell__", {
                    currentPath: reqPathWithSlash,
                  })
                );
                if (resolvedLayoutJsx) {
                  await storage.set(shellLayoutKey, serializeJSX(resolvedLayoutJsx));
                }
              }
            } catch (e) {
              resolvedLayoutJsx = null;
            }
          }
          if (!resolvedLayoutJsx) {
            await runWithPprContext({ isPpr: true }, async () => {
              const rawJsx = await getJSX(reqPathWithSlash, {}, {}, false, false, {
                segment: "layout",
              });
              resetPprHoles(0);
              resolvedLayoutJsx = await runInLayoutSegment(() =>
                asyncRenderJSXToClientJSX(rawJsx)
              );
              const layoutHoles = getRegisteredHoles();
              if (layoutHoles.length > 0) {
                currentMeta.holes = layoutHoles;
              }
              currentMeta.suspenseCount = getPprHoleCounter();
              if (resolvedLayoutJsx) {
                try {
                  await storage.set(shellLayoutKey, serializeJSX(resolvedLayoutJsx));
                } catch (e) {}
              }
            });
          }
          if (resolvedLayoutJsx) {
            const stream = renderRSCStream(resolvedLayoutJsx, clientManifest, {
              runtime: "edge",
            });
            const rendered = await new Response(stream).text();
            if (rendered) {
              newLayoutRsc = rendered;
            }
          }
          const layoutSlotTags = revalContext._layoutSlotTags || revalContext._slotTags;
          if (layoutSlotTags && layoutSlotTags.size > 0) {
            currentMeta.slotTags = Array.from(layoutSlotTags);
          }
        });
      } catch (e) {
        console.warn(`⚠️ [Edge Revalidate] Layout render fallback for ${targetPath}:`, e?.message || e);
      }
      if (newLayoutRsc && now <= prevGenTime) {
        newLayoutRsc = newLayoutRsc.replace(
          /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
          new Date(newGenTime).toISOString()
        );
      }
      if (newLayoutRsc) {
        await storage.set(layoutRscKey, newLayoutRsc, currentMeta);
      }
      await storage.set(layoutMetaKey, JSON.stringify(currentMeta));
      console.log(`✅ [Edge Revalidate] Successfully revalidated layout ${targetPath} (generatedAt: ${newGenTime})`);
      return true;
    }

    const dist2Folder = path.resolve(process.cwd(), ".dinou/dist2");
    const reqPathWithSlash = targetPath.endsWith("/") ? targetPath : targetPath + "/";
    const layoutFinalPath = path.join(dist2Folder, reqPathWithSlash, "layout.rsc");
    const layoutOldPath = path.join(dist2Folder, reqPathWithSlash, "layout._old.rsc");

    if (existsSync(layoutFinalPath)) {
      try {
        copyFileSync(layoutFinalPath, layoutOldPath);
      } catch (e) {}
    }

    console.log(`[Revalidate] Starting on-demand layout revalidation for ${targetPath}...`);
    try {
      const layoutRscResult = await getGenerateStaticRSC()(targetPath, { segment: "layout" });
      if (layoutRscResult && layoutRscResult.success) {
        await getSafeRename()(layoutRscResult.tempPath, layoutRscResult.finalPath);
        console.log(`✅ [Revalidate] Successfully revalidated layout ${targetPath}`);
        return true;
      }
    } catch (err) {
      console.warn(`⚠️ [Revalidate] Failed to revalidate layout ${targetPath}:`, err.message || err);
    }
    return false;
  });

  inflightLayoutRevalidations.set(inFlightKey, revalPromise);
  try {
    return await revalPromise;
  } finally {
    inflightLayoutRevalidations.delete(inFlightKey);
  }
}

async function revalidateTag(tag, options) {
  if (options !== undefined) {
    console.warn(
      `⚠️ [Dinou] The second parameter (options) in revalidateTag("${tag}", ...) is deprecated and ignored since v9.0.3. Zero hydration mismatch is now guaranteed automatically via lazy index.html re-composition.`
    );
  }
  console.log(`[Revalidate] Starting on-demand revalidation for tag: "${tag}"...`);

  const storage = getStorageAdapter();
  if (isEdgeRuntime() || (storage && typeof storage.keys === "function")) {
    if (storage && typeof storage.keys === "function") {
      const allKeys = await storage.keys();
      const targetPaths = new Map();
      const targetLayoutPaths = new Map();
      const targetSlotKeys = new Set();
      if (typeof storage.markTagInvalidated === "function") {
        storage.markTagInvalidated(tag);
      }
      globalThis[Symbol.for("dinou.slot.recent.fresh")]?.clear?.();
      const slotReg = globalThis[Symbol.for("dinou.slot.registry")];
      if (slotReg && typeof slotReg.entries === "function") {
        for (const [regId, entry] of slotReg.entries()) {
          if (regId === tag || (Array.isArray(entry?.tags) && entry.tags.includes(tag))) {
            targetSlotKeys.add(`slots/${regId}/slot.json`);
            targetSlotKeys.add(`slots/${regId}/slot.metadata.json`);
          }
        }
      }
      const isFsStorage = Boolean(storage && storage.baseDir);
      for (const rawKey of allKeys) {
        const key = String(rawKey || "").replace(/\\/g, "/");
        if (key.endsWith("/slot.metadata.json") || (!isFsStorage && (key.startsWith("slots/") || key.endsWith("/slot.json")))) {
          try {
            const item = await storage.get(key);
            let meta = item?.metadata;
            if (!meta && item?.content) {
              try {
                meta = JSON.parse(item.content);
              } catch (e) {}
            }
            if (meta && Array.isArray(meta.tags) && meta.tags.includes(tag)) {
              targetSlotKeys.add(key);
              if (key.endsWith("/slot.metadata.json")) {
                targetSlotKeys.add(key.slice(0, -"/slot.metadata.json".length) + "/slot.json");
              } else if (key.endsWith("/slot.json")) {
                targetSlotKeys.add(key.slice(0, -"/slot.json".length) + "/slot.metadata.json");
              }
            }
          } catch (e) {}
        } else if (key.endsWith("layout.metadata.json") || (!isFsStorage && key.endsWith("layout.rsc"))) {
          try {
            const item = await storage.get(key);
            let meta = item?.metadata;
            if (!meta && item?.content) {
              try {
                meta = JSON.parse(item.content);
              } catch (e) {}
            }
            const hasRouteTag = Boolean(meta && Array.isArray(meta.tags) && meta.tags.includes(tag));
            const hasSlotTag = Boolean(meta && Array.isArray(meta.slotTags) && meta.slotTags.includes(tag));
            if (hasRouteTag || hasSlotTag) {
              const cleanKey = key
                .replace(/\/(?:layout\.metadata\.json|layout\.rsc)$/, "")
                .replace(/^(?:layout\.metadata\.json|layout\.rsc)$/, "");
              const normPath = cleanKey ? (cleanKey.startsWith("/") ? cleanKey : "/" + cleanKey) : "/";
              const prev = targetLayoutPaths.get(normPath);
              targetLayoutPaths.set(normPath, {
                onlyRefreshSlots: prev ? prev.onlyRefreshSlots && !hasRouteTag : !hasRouteTag && hasSlotTag,
              });
            }
          } catch (e) {}
        } else if (key.endsWith("metadata.json")) {
          try {
            const item = await storage.get(key);
            let meta = item?.metadata;
            if (!meta && item?.content) {
              try {
                meta = JSON.parse(item.content);
              } catch (e) {}
            }
            const hasRouteTag = Boolean(meta && Array.isArray(meta.tags) && meta.tags.includes(tag));
            const hasSlotTag = Boolean(meta && Array.isArray(meta.slotTags) && meta.slotTags.includes(tag));
            if (hasRouteTag || hasSlotTag) {
              const cleanKey = key
                .replace(/\/(?:metadata\.json|index\.html)$/, "")
                .replace(/^(?:metadata\.json|index\.html)$/, "");
              if (cleanKey.startsWith("slots/") || cleanKey.endsWith("layout.rsc") || cleanKey.endsWith("layout.metadata.json")) {
                continue;
              }
              const normPath = cleanKey ? (cleanKey.startsWith("/") ? cleanKey : "/" + cleanKey) : "/";
              const prev = targetPaths.get(normPath);
              targetPaths.set(normPath, {
                onlyRefreshSlots: prev ? prev.onlyRefreshSlots && !hasRouteTag : !hasRouteTag && hasSlotTag,
              });
            }
          } catch (e) {}
        } else if (!isFsStorage && (key.endsWith("index.html") || key.endsWith("shell.html"))) {
          try {
            const item = await storage.get(key);
            const meta = item?.metadata;
            const hasRouteTag = Boolean(meta && Array.isArray(meta.tags) && meta.tags.includes(tag));
            const hasSlotTag = Boolean(meta && Array.isArray(meta.slotTags) && meta.slotTags.includes(tag));
            if (hasRouteTag || hasSlotTag) {
              const cleanKey = key
                .replace(/\/(?:metadata\.json|index\.html|shell\.html)$/, "")
                .replace(/^(?:metadata\.json|index\.html|shell\.html)$/, "");
              if (cleanKey.startsWith("slots/") || cleanKey.endsWith("layout.rsc") || cleanKey.endsWith("layout.metadata.json")) {
                continue;
              }
              const normPath = cleanKey ? (cleanKey.startsWith("/") ? cleanKey : "/" + cleanKey) : "/";
              const prev = targetPaths.get(normPath);
              targetPaths.set(normPath, {
                onlyRefreshSlots: prev ? prev.onlyRefreshSlots && !hasRouteTag : !hasRouteTag && hasSlotTag,
              });
            }
          } catch (e) {}
        }
      }

      // 1. Delete invalidated slot artifacts first so subsequent layout/page revalidations re-render the fresh slot
      await Promise.all(Array.from(targetSlotKeys).map((k) => storage.delete(k)));

      // 2. Revalidate affected layouts first so any subsequent revalidatePage uses the updated layout.rsc
      await Promise.all(
        Array.from(targetLayoutPaths.entries()).map(([p, opts]) => revalidateLayout(p, opts))
      );

      // 3. Revalidate affected pages (without deleting metadata.json!)
      await Promise.all(
        Array.from(targetPaths.entries()).map(([p, opts]) => revalidatePage(p, opts))
      );
    }
    return;
  }

  const dist2Folder = path.resolve(process.cwd(), ".dinou/dist2");
  if (!existsSync(dist2Folder)) return;

  const metadataFiles = await walkMetadataFiles(dist2Folder);
  const slotPromises = [];
  const targetLayoutPaths = [];
  const targetPagePaths = [];

  for (const fileOfMeta of metadataFiles) {
    try {
      const content = await fs.readFile(fileOfMeta, "utf8");
      const metadata = JSON.parse(content);
      const hasRouteTag = Boolean(metadata && Array.isArray(metadata.tags) && metadata.tags.includes(tag));
      const hasSlotTag = Boolean(metadata && Array.isArray(metadata.slotTags) && metadata.slotTags.includes(tag));
      if (hasRouteTag || hasSlotTag) {
        if (path.basename(fileOfMeta) === "slot.metadata.json") {
          const slotFolder = path.dirname(fileOfMeta);
          console.log(`✅ [Revalidate] Invalidating cache slot directory: ${slotFolder}`);
          slotPromises.push(
            fs.rm(slotFolder, { recursive: true, force: true }).catch(() => {})
          );
        } else if (path.basename(fileOfMeta) === "layout.metadata.json") {
          const relative = path.relative(dist2Folder, path.dirname(fileOfMeta));
          const reqPath = "/" + relative.replace(/\\/g, "/");
          targetLayoutPaths.push({
            reqPath,
            onlyRefreshSlots: !hasRouteTag && hasSlotTag,
          });
        } else {
          const relative = path.relative(dist2Folder, path.dirname(fileOfMeta));
          const reqPath = "/" + relative.replace(/\\/g, "/");
          targetPagePaths.push({
            reqPath,
            onlyRefreshSlots: !hasRouteTag && hasSlotTag,
          });
        }
      }
    } catch (err) {
      console.error(`[Revalidate] Error reading tags from ${fileOfMeta}:`, err);
    }
  }

  await Promise.all(slotPromises);
  await Promise.all(
    targetLayoutPaths.map(({ reqPath, onlyRefreshSlots }) =>
      revalidateLayout(reqPath, { onlyRefreshSlots })
    )
  );
  await Promise.all(
    targetPagePaths.map(({ reqPath, onlyRefreshSlots }) =>
      revalidatePage(reqPath, { onlyRefreshSlots })
    )
  );
}

export {
  revalidatePath,
  revalidatePage,
  revalidateTag,
  revalidateLayout,
};
export default {
  revalidatePath,
  revalidatePage,
  revalidateTag,
  revalidateLayout,
};
