import path from "node:path";
import fs from "node:fs/promises";
import { existsSync, copyFileSync } from "node:fs";
import { AsyncLocalStorage } from "node:async_hooks";
import { getContext, requestStorage } from "./request-context.js";
import { resolveRelativeUrl } from "./url-resolver.js";
import { getStorageAdapter, readDist2Fallback } from "./storage-adapter.js";
import { isEdgeRuntime, renderRSCStream } from "./rsc-renderer.js";
import getJSX from "./get-jsx.js";
import { getFilePathAndDynamicParams } from "./get-file-path-and-dynamic-params.js";
import { getActiveLayoutChain, resolveLayoutFunctionsConfig, resolveLayoutChainPpr } from "./layout-functions.js";
import importModule from "./import-module.js";
import { resolveModulePpr } from "./resolve-module-ppr.js";
import { getDinouConfig } from "./load-dinou-config.js";
import { createBailoutProxy, unwrapBailoutProxy } from "./bailout-proxy.js";
import {
  runWithPprContext,
  resetPprHoles,
  getRegisteredHoles,
  getPprHoleCounter,
  runInPageSegment,
  runInLayoutSegment,
  isSlotDiscoveryActive,
} from "./ppr-context.js";
import { asyncRenderJSXToClientJSX } from "./render-jsx-to-client-jsx.js";
import {
  serializeJSX,
  deserializeJSX,
  refreshNestedSlotsInTree,
  inspectSlotsFreshness,
} from "./cache-slot.js";
import {
  renderSingleLayoutLevel,
  composeLayoutChainFromOwnFragments,
  hydrateActiveChainPpr,
} from "./layout-composition.js";
import { fetchCloudflareDist2Asset } from "./static-assets.js";

let _cachedRevalLayoutsRef = null;
let _cachedRevalLayoutsJson = "[]";

function getRevalLayoutsJson() {
  const knownLayouts =
    (typeof globalThis !== "undefined" && globalThis.__DINOU_LAYOUTS__) || null;
  if (!knownLayouts) return "[]";
  if (knownLayouts === _cachedRevalLayoutsRef) {
    return _cachedRevalLayoutsJson;
  }
  const serialized = JSON.stringify(knownLayouts);
  _cachedRevalLayoutsRef = knownLayouts;
  _cachedRevalLayoutsJson = serialized;
  return serialized;
}

const INFLIGHT_LAYOUT_REVAL_KEY = Symbol.for("dinou.layout.inflight.revalidations");
if (!globalThis[INFLIGHT_LAYOUT_REVAL_KEY]) {
  globalThis[INFLIGHT_LAYOUT_REVAL_KEY] = new Map();
}
const inflightLayoutRevalidations = globalThis[INFLIGHT_LAYOUT_REVAL_KEY];

const INFLIGHT_PAGE_REVAL_KEY = Symbol.for("dinou.page.inflight.revalidations");
if (!globalThis[INFLIGHT_PAGE_REVAL_KEY]) {
  globalThis[INFLIGHT_PAGE_REVAL_KEY] = new Map();
}
const inflightPageRevalidations = globalThis[INFLIGHT_PAGE_REVAL_KEY];

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

function isCloudflareWorkersRuntime() {
  return (
    typeof navigator !== "undefined" &&
    navigator.userAgent === "Cloudflare-Workers"
  );
}

function recordClientRevalidationHint(kind, value, explicitCtx = null) {
  try {
    const ctx = explicitCtx || getContext();
    if (!ctx || !ctx._isServerFunction) return;
    if (!ctx._revalidatedHint) {
      ctx._revalidatedHint = {
        pages: new Set(),
        layouts: new Set(),
        allPages: false,
        allLayouts: false,
      };
    }
    if (kind === "page" && value) {
      ctx._revalidatedHint.pages.add(String(value));
    } else if (kind === "layout" && value) {
      ctx._revalidatedHint.layouts.add(String(value));
    } else if (kind === "allPages") {
      ctx._revalidatedHint.allPages = true;
    } else if (kind === "allLayouts") {
      ctx._revalidatedHint.allLayouts = true;
    }
  } catch (e) {}
}

function enqueueRevalidation(fn) {
  if (revalQueueStorage.getStore()) {
    return fn();
  }
  if (isCloudflareWorkersRuntime()) {
    const reqCtx = requestStorage?.getStore?.();
    if (reqCtx && typeof reqCtx === "object") {
      const prevQueue = reqCtx._cfRevalQueue || Promise.resolve();
      const run = () => revalQueueStorage.run(true, fn);
      const nextPromise = prevQueue.then(run, run);
      reqCtx._cfRevalQueue = nextPromise.catch(() => {});
      return nextPromise;
    }
    return revalQueueStorage.run(true, fn);
  }
  const run = () => revalQueueStorage.run(true, fn);
  const nextPromise = revalState.queue.then(run, run);
  revalState.queue = nextPromise.catch(() => {});
  return nextPromise;
}

async function readEdgeStorageOrAsset(storage, key) {
  if (!storage || !key) return null;
  try {
    const item = await storage.get(key);
    if (item && item.content) return item;
  } catch (e) {}
  const isDeleted =
    typeof storage.isKeyDeleted === "function"
      ? await storage.isKeyDeleted(key)
      : typeof storage.isDeleted === "function" && storage.isDeleted(key);
  if (isDeleted) {
    return null;
  }
  try {
    const isCfWorkers = isCloudflareWorkersRuntime();
    const reqContext = isCfWorkers ? requestStorage?.getStore?.() : getContext();
    const assets =
      reqContext?.env?.ASSETS ||
      reqContext?.platformContext?.env?.ASSETS ||
      reqContext?.req?.env?.ASSETS ||
      (!isCfWorkers && typeof globalThis !== "undefined"
        ? globalThis.__DINOU_ENV__?.ASSETS
        : null);
    if (assets && typeof assets.fetch === "function") {
      const cleanKey = String(key).replace(/^\/+/, "");
      const res = await fetchCloudflareDist2Asset(assets, cleanKey);
      if (res && res.status === 200) {
        const ct = res.headers?.get?.("content-type") || "";
        const content = await res.text();
        const isHtmlExpected = cleanKey.endsWith(".html");
        if (
          content &&
          (isHtmlExpected || (!ct.includes("text/html") && !content.trimStart().startsWith("<")))
        ) {
          const item = { content };
          await storage.set(cleanKey, content);
          return item;
        }
      }
    }
  } catch (e) {}
  return await readDist2Fallback(storage, key);
}

function matchesStaticPathsSet(staticPathsSet, paramsObj) {
  if (!staticPathsSet || !paramsObj || Object.keys(paramsObj).length === 0) {
    return false;
  }
  const sortedEntries = Object.entries(paramsObj)
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
  const singleVal = Object.values(paramsObj)[0];
  const singleValStr = Array.isArray(singleVal)
    ? singleVal.join(",")
    : singleVal === undefined || singleVal === null
    ? ""
    : String(singleVal);
  return staticPathsSet.has(serialized) || staticPathsSet.has(singleValStr);
}

function buildStaticPathsSetFromRaw(paths) {
  if (!Array.isArray(paths)) return null;
  const set = new Set();
  for (const p of paths) {
    if (typeof p === "string" || typeof p === "number") {
      set.add(String(p));
    } else if (Array.isArray(p)) {
      set.add(p.map((item) => (item === undefined || item === null ? "" : String(item))).join(","));
    } else if (p && typeof p === "object") {
      const sortedEntries = Object.entries(p)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([k, v]) => [
          k,
          Array.isArray(v)
            ? v.join(",")
            : v === undefined || v === null
            ? ""
            : String(v),
        ]);
      set.add(JSON.stringify(sortedEntries));
    }
  }
  return set;
}

async function isLayoutChainBlockedForRevalidate(activeChain, storage) {
  if (!Array.isArray(activeChain) || activeChain.length === 0) return false;
  for (let i = activeChain.length - 1; i >= 0; i--) {
    const entry = activeChain[i];
    if (!entry?.layoutPath || !entry.dParams || Object.keys(entry.dParams).length === 0) {
      continue;
    }
    try {
      const lCfg = await resolveLayoutFunctionsConfig(entry.layoutPath, entry.dParams);
      if (typeof lCfg.validateParams === "function") {
        const isValid = await lCfg.validateParams(entry.dParams);
        if (!isValid) return true;
      }
      if (lCfg.allowISG === false) {
        if (matchesStaticPathsSet(lCfg.staticPathsSet, entry.dParams)) {
          continue;
        }
        const lRscKey = entry.cleanLayoutKey
          ? `${entry.cleanLayoutKey}/layout.rsc`
          : "layout.rsc";
        const existing = await readEdgeStorageOrAsset(storage, lRscKey);
        if (!existing || !existing.content) {
          return true;
        }
      }
    } catch (e) {}
  }
  return false;
}

async function resolveRouteConfigForRevalidate(
  pagePath,
  reqSegments,
  existingMeta = {},
  hasExistingArtifact = false
) {
  const srcFolder = path.resolve(process.cwd(), "src");
  let isRoutePpr =
    typeof existingMeta?.ppr === "boolean" ? existingMeta.ppr : null;
  let isPagePpr =
    typeof existingMeta?.pagePpr === "boolean" ? existingMeta.pagePpr : null;
  let tags = Array.isArray(existingMeta?.tags) ? existingMeta.tags : null;
  let revalidate = existingMeta?.revalidate;
  let pageRevalidate = existingMeta?.pageRevalidate;
  let isBlocked = false;

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

  if (pfMod && Object.keys(dParams).length > 0) {
    try {
      const defaultExport = pfMod.default?.default
        ? pfMod.default.default
        : pfMod.default;
      const validateParamsFn = pfMod.validateParams || defaultExport?.validateParams;
      if (typeof validateParamsFn === "function") {
        const isValid = await validateParamsFn(dParams);
        if (!isValid) {
          isBlocked = true;
        }
      }
      if (!isBlocked) {
        const globalCfg = await getDinouConfig();
        const defaultAllowISG =
          globalCfg?.allowISG !== undefined && globalCfg?.allowISG !== null
            ? Boolean(globalCfg.allowISG)
            : true;
        const rawAllowISG =
          pfMod.allowISG !== undefined ? pfMod.allowISG : defaultExport?.allowISG;
        const resolvedAllowISG =
          typeof rawAllowISG === "function"
            ? await rawAllowISG()
            : rawAllowISG !== undefined && rawAllowISG !== null
            ? Boolean(rawAllowISG)
            : defaultAllowISG;
        if (resolvedAllowISG === false && !hasExistingArtifact) {
          const getStaticPathsFn = pfMod.getStaticPaths || defaultExport?.getStaticPaths;
          let allowed = false;
          if (typeof getStaticPathsFn === "function") {
            const rawPaths = await getStaticPathsFn();
            const set = buildStaticPathsSetFromRaw(rawPaths);
            allowed = matchesStaticPathsSet(set, dParams);
          }
          if (!allowed) {
            isBlocked = true;
          }
        }
      }
    } catch (e) {}
  }

  if (isRoutePpr === null || isPagePpr === null) {
    const { defaultPpr, anyLayoutPpr } = await resolveLayoutChainPpr(
      reqSegments || [],
      {},
      srcFolder,
    );

    let explicitPagePpr = null;
    if (pfMod) {
      try {
        explicitPagePpr = await resolveModulePpr(pfMod);
      } catch (e) {}
    }
    const resolvedPagePpr =
      explicitPagePpr !== null ? explicitPagePpr : Boolean(defaultPpr);
    if (isPagePpr === null) {
      isPagePpr = Boolean(resolvedPagePpr);
    }
    if (isRoutePpr === null) {
      isRoutePpr = Boolean(resolvedPagePpr || anyLayoutPpr);
    }
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
      const rawRevalidate =
        pfMod.revalidate !== undefined
          ? pfMod.revalidate
          : defaultExport?.revalidate;
      const pfRevalidate =
        typeof rawRevalidate === "function"
          ? await rawRevalidate(dParams)
          : rawRevalidate;
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
    isPagePpr: Boolean(isPagePpr),
    tags: Array.isArray(tags) ? tags : [],
    revalidate,
    pageRevalidate,
    isBlocked,
  };
}

function compareLayoutPathsAncestorFirst(pathA, pathB) {
  const cleanA = String(pathA || "/").replace(/^\/+/, "").replace(/\/+$/, "");
  const cleanB = String(pathB || "/").replace(/^\/+/, "").replace(/\/+$/, "");
  const depthA = cleanA ? cleanA.split("/").filter(Boolean).length : 0;
  const depthB = cleanB ? cleanB.split("/").filter(Boolean).length : 0;
  if (depthA !== depthB) return depthA - depthB;
  return cleanA < cleanB ? -1 : cleanA > cleanB ? 1 : 0;
}

async function walkMetadataFiles(dir, fileList = []) {
  try {
    const entries = (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    );
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

function stripVirtualLayoutSegments(key) {
  return String(key || "")
    .split("/")
    .filter(Boolean)
    .filter(
      (s) =>
        !(s.startsWith("[[") && s.endsWith("]]")) &&
        !(s.startsWith("(") && s.endsWith(")"))
    )
    .join("/");
}

function normalizeRevalidatePath(reqPath) {
  let targetPath = reqPath;

  if (targetPath && !targetPath.startsWith("/") && !targetPath.includes("://")) {
    const ctx = getContext();
    let currentPathname = "/";
    if (ctx && ctx.req) {
      const rawReqHeaders = unwrapBailoutProxy(ctx.req.headers);
      const readHeader = (name) => {
        if (!rawReqHeaders) return undefined;
        if (typeof rawReqHeaders.get === "function") {
          return rawReqHeaders.get(name) ?? undefined;
        }
        return rawReqHeaders[name];
      };
      const headerPath =
        readHeader("x-dinou-current-path") ||
        readHeader("X-Dinou-Current-Path");
      const referer = readHeader("referer") || readHeader("Referer");
      if (headerPath) {
        currentPathname = String(headerPath).split("?")[0].split("#")[0] || "/";
      } else if (referer) {
        try {
          currentPathname = new URL(referer).pathname;
        } catch (e) {}
      } else {
        const reqPathCandidate = ctx.req.path || "/";
        currentPathname = reqPathCandidate.includes("____server_function____")
          ? "/"
          : reqPathCandidate;
      }
    }
    targetPath = resolveRelativeUrl(targetPath, currentPathname);
  }

  let cleanPath = String(targetPath || "/").split("?")[0].split("#")[0] || "/";
  const decodedSegs = [];
  for (const rawSeg of cleanPath.split("/").filter(Boolean)) {
    let dec = rawSeg;
    try {
      dec = decodeURIComponent(rawSeg);
    } catch (e) {
      dec = rawSeg;
    }
    if (
      dec === "." ||
      dec === ".." ||
      dec.includes("/") ||
      dec.includes("\\") ||
      dec.includes("\0")
    ) {
      continue;
    }
    decodedSegs.push(dec);
  }
  cleanPath = decodedSegs.length > 0 ? "/" + decodedSegs.join("/") : "/";
  return cleanPath;
}

async function revalidatePage(reqPath, internalOptions = {}) {
  const cleanPath = normalizeRevalidatePath(reqPath);
  const onlyRefreshSlots = Boolean(internalOptions?.onlyRefreshSlots);
  const onlyIfExpired = Boolean(internalOptions?.onlyIfExpired);
  const retryDepth = Number(internalOptions?._retryDepth || 0);
  if (!onlyIfExpired && !onlyRefreshSlots) {
    recordClientRevalidationHint("page", cleanPath);
  }
  const inFlightKey = `${cleanPath}:${onlyRefreshSlots ? "slots" : "full"}:${onlyIfExpired ? "ttl" : "force"}`;
  // Never await an outer queued inflightPageRevalidations promise when already inside
  // revalQueueStorage (holding revalState.queue), or a concurrent caller queued behind us
  // on revalState.queue would create a permanent self-deadlock.
  const isInsideRevalQueue = Boolean(revalQueueStorage.getStore());
  const useInflightDedup = !isCloudflareWorkersRuntime() && !isInsideRevalQueue;

  if (useInflightDedup && inflightPageRevalidations.has(inFlightKey)) {
    return inflightPageRevalidations.get(inFlightKey);
  }

  const revalPromise = enqueueRevalidation(async () => {
    const storage = getStorageAdapter();
    const cleanPathKey = cleanPath.replace(/^\/+/, "").replace(/\/+$/, "");
    const htmlKey = cleanPathKey ? `${cleanPathKey}/index.html` : "index.html";
    const shellHtmlKey = cleanPathKey ? `${cleanPathKey}/shell.html` : "shell.html";
    const oldHtmlKey = cleanPathKey ? `${cleanPathKey}/index._old.html` : "index._old.html";
    const metaKey = cleanPathKey ? `${cleanPathKey}/metadata.json` : "metadata.json";
    const rscKey = cleanPathKey ? `${cleanPathKey}/page.rsc` : "page.rsc";
    const shellRscKey = cleanPathKey ? `${cleanPathKey}/shell.rsc` : "shell.rsc";
    const shellPageKey = cleanPathKey ? `${cleanPathKey}/shell.page.json` : "shell.page.json";
    const shellPageOldKey = cleanPathKey ? `${cleanPathKey}/shell.page._old.json` : "shell.page._old.json";
    const oldRscKey = cleanPathKey ? `${cleanPathKey}/page._old.rsc` : "page._old.rsc";
    const legacyRscKey = cleanPathKey ? `${cleanPathKey}/rsc.rsc` : "rsc.rsc";

    let cached = await storage.get(htmlKey);
    if (!cached && cleanPathKey) {
      cached = await storage.get(cleanPathKey);
    }
    if (!cached) {
      cached = await storage.get(shellHtmlKey);
    }
    if (!cached) {
      cached = await readEdgeStorageOrAsset(storage, htmlKey);
    }
    let currentMeta = (cached && cached.metadata) || {};
    try {
      const metaItem = await readEdgeStorageOrAsset(storage, metaKey);
      if (metaItem && metaItem.content) {
        currentMeta = JSON.parse(metaItem.content);
      }
    } catch (e) {}

    let existingPageRsc = null;
    try {
      existingPageRsc = await readEdgeStorageOrAsset(storage, rscKey);
    } catch (e) {}

    const reqPathWithSlash = cleanPath.endsWith("/") ? cleanPath : cleanPath + "/";
    const reqSegments = cleanPath.split("/").filter(Boolean);
    const srcFolder = path.resolve(process.cwd(), "src");
    const [pagePath] = getFilePathAndDynamicParams(reqSegments, {}, srcFolder);

    if (!pagePath && !cached && !existingPageRsc) {
      return;
    }

    const activeChainCheck = getActiveLayoutChain(reqSegments, {}, srcFolder);
    if (await isLayoutChainBlockedForRevalidate(activeChainCheck, storage)) {
      return;
    }

    const transitionPageToDynamicTombstone = async ({
      prevGen = 0,
      notFound = false,
      logMessage = null,
    } = {}) => {
      markRouteDynamicInMap(reqPathWithSlash, cleanPath, true);
      const prevGenForTombstone = Math.max(
        Number((currentMeta && currentMeta.generatedAt) || 0),
        Number(prevGen || 0)
      );
      // Preserve causal _old snapshots BEFORE advancing metadata.json and evicting current artifacts
      // so in-flight tabs hydrating ?____build_id____=T_prev receive matching page._old.rsc /
      // shell.page._old.json with zero React #418!
      try {
        if (cached && cached.content) {
          await storage.set(oldHtmlKey, cached.content);
        }
        if (existingPageRsc && existingPageRsc.content) {
          await storage.set(oldRscKey, existingPageRsc.content);
        }
        const prevShellPage = await readEdgeStorageOrAsset(storage, shellPageKey);
        if (prevShellPage && prevShellPage.content) {
          await storage.set(shellPageOldKey, prevShellPage.content);
        }
      } catch (e) {}
      const tombstoneMeta = {
        ...currentMeta,
        dynamic: true,
        generatedAt: nextMonotonicGenTime(prevGenForTombstone),
      };
      if (notFound) {
        tombstoneMeta.notFound = true;
        tombstoneMeta.status = 404;
      } else {
        delete tombstoneMeta.notFound;
      }
      // Commit metadata.json BEFORE evicting current RSC/PPR/HTML artifacts so concurrent readers
      // never observe evicted artifacts with a stale generatedAt timestamp.
      try {
        await storage.set(metaKey, JSON.stringify(tombstoneMeta));
      } catch (e) {}
      // Keep physical index.html intact on FileSystemStorage (storage.baseDir) for concurrency safety
      // (in-flight file streams & Hybrid Static/Dynamic switching; FileSystemStorage.get() reads
      // companion metadata.json so cachedItem.metadata.dynamic === true is immediately visible).
      // On non-FS distributed/Edge adapters (Redis, Deno KV, Cloudflare KV, Memory), storage.get(htmlKey)
      // returns inline metadata stored on htmlKey itself — so we MUST delete htmlKey & cleanPathKey
      // (writing KV/Redis tombstones that suppress stale .dinou/dist2 and env.ASSETS fallback).
      const bailoutKeysToEvict = [
        shellHtmlKey,
        rscKey,
        shellRscKey,
        shellPageKey,
        legacyRscKey,
      ];
      if (!storage.baseDir) {
        bailoutKeysToEvict.push(htmlKey);
        if (cleanPathKey) {
          bailoutKeysToEvict.push(cleanPathKey);
        }
      }
      await Promise.all(
        bailoutKeysToEvict.map((k) => Promise.resolve(storage.delete(k)).catch(() => {}))
      );
      if (logMessage) {
        console.log(logMessage);
      }
    };

    const hasExistingPageArtifact = Boolean(
      (cached && cached.content) || (existingPageRsc && existingPageRsc.content)
    );
    const routeCfg = await resolveRouteConfigForRevalidate(
      pagePath,
      reqSegments,
      currentMeta,
      hasExistingPageArtifact
    );
    if (routeCfg.isBlocked) {
      if (
        hasExistingPageArtifact ||
        (currentMeta && Object.keys(currentMeta).length > 0)
      ) {
        await transitionPageToDynamicTombstone({
          notFound: true,
          logMessage: `[ISR] Perimeter block / notFound detected for ${cleanPath}. Switching to Dynamic 404.`,
        });
      }
      return;
    }
    const effectivePageReval =
      routeCfg.pageRevalidate !== undefined && routeCfg.pageRevalidate !== null
        ? routeCfg.pageRevalidate
        : routeCfg.revalidate;
    if (typeof effectivePageReval === "number" && effectivePageReval < 1) {
      return;
    }
    const isRoutePpr = routeCfg.isRoutePpr;
    const isPagePpr = routeCfg.isPagePpr;
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

    if (onlyIfExpired && !onlyRefreshSlots) {
      const latestReval =
        currentMeta.pageRevalidate !== undefined && currentMeta.pageRevalidate !== null
          ? currentMeta.pageRevalidate
          : currentMeta.revalidate;
      const latestPageGenAt = Number(
        currentMeta.pageGeneratedAt || currentMeta.generatedAt || 0
      );
      const stillExpired =
        typeof latestReval === "number" &&
        latestReval >= 1 &&
        latestPageGenAt > 0 &&
        Date.now() > latestPageGenAt + latestReval * 1000;
      if (!stillExpired) {
        return;
      }
    }

    let activeLayoutRscText = "";
    let maxActiveLayoutGenTime = 0;
    let leafSuspenseCount = 0;
    let leafHoles = [];
    let hasActiveLayoutChain = false;
    let composedLeafLayoutMetaKey = null;
    let composedLeafLayoutGen = 0;
    let hasDynamicLayoutInChain = false;
    try {
      const activeChain = getActiveLayoutChain(reqSegments, {}, srcFolder);
      if (activeChain.length > 0) {
        hasActiveLayoutChain = true;
        for (const entry of activeChain) {
          let lCfg = null;
          try {
            lCfg = await resolveLayoutFunctionsConfig(entry.layoutPath, entry.dParams);
          } catch (e) {}
          const lMetaKey = entry.cleanLayoutKey
            ? `${entry.cleanLayoutKey}/layout.metadata.json`
            : "layout.metadata.json";
          const lItem = await readEdgeStorageOrAsset(storage, lMetaKey);
          let lMetaObj = lItem?.metadata || null;
          if (!lMetaObj && lItem?.content) {
            try {
              lMetaObj = JSON.parse(lItem.content);
            } catch (e) {}
          }
          const lGen = Number(lMetaObj?.generatedAt || 0);
          entry.generatedAt = lGen;
          entry.layoutGeneratedAt = Number(lMetaObj?.layoutGeneratedAt || lGen || 0);
          entry.suspenseCount = Number(lMetaObj?.suspenseCount || 0);
          entry.holes = Array.isArray(lMetaObj?.holes) ? lMetaObj.holes : [];
          entry.isDynamic = Boolean(lCfg?.isDynamic || lMetaObj?.dynamic);
          if (entry.isDynamic) {
            hasDynamicLayoutInChain = true;
          }
          if (lGen > maxActiveLayoutGenTime) {
            maxActiveLayoutGenTime = lGen;
          }
        }
        if (!hasDynamicLayoutInChain) {
          const leafLayout = activeChain[0];
          const leafRscKey = leafLayout.cleanLayoutKey
            ? `${leafLayout.cleanLayoutKey}/layout.rsc`
            : "layout.rsc";
          let leafRscItem = await readEdgeStorageOrAsset(storage, leafRscKey);
          let hasValidLeafRsc = Boolean(
            leafRscItem &&
              leafRscItem.content &&
              !leafRscItem.content.trimStart().startsWith("<")
          );
          const ancestors = activeChain.length > 1 ? activeChain.slice(1) : [];
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
          const leafGen = leafLayout.generatedAt || 0;
          const leafOwnGen = leafLayout.layoutGeneratedAt || leafGen;
          const hasRouteEngine = Boolean(
            typeof globalThis !== "undefined" && globalThis.__DINOU_ROUTE_MAP__
          );
          const isLeafMissing =
            !hasValidLeafRsc &&
            (isEdgeRuntime() || hasRouteEngine || maxAncestorGen > 0 || onlyRefreshSlots);
          const isAncestorOwnNewer = leafOwnGen > 0 && maxAncestorOwnGen > leafOwnGen;
          const isAncestorSlotOnlyNewer =
            !isAncestorOwnNewer && leafGen > 0 && maxAncestorGen > leafGen;
          if (isLeafMissing || isAncestorOwnNewer || isAncestorSlotOnlyNewer) {
            await revalidateLayout(leafLayout.layoutRoutePath, {
              recomposeOnly: !isLeafMissing && isAncestorOwnNewer,
              onlyRefreshSlots:
                !isAncestorOwnNewer && (isAncestorSlotOnlyNewer || isLeafMissing),
            });
            const refreshedMetaKey = leafLayout.cleanLayoutKey
              ? `${leafLayout.cleanLayoutKey}/layout.metadata.json`
              : "layout.metadata.json";
            const refreshedItem = await readEdgeStorageOrAsset(storage, refreshedMetaKey);
            if (refreshedItem?.content) {
              try {
                const parsed = JSON.parse(refreshedItem.content);
                leafLayout.generatedAt = Number(parsed?.generatedAt || leafLayout.generatedAt || 0);
                leafLayout.layoutGeneratedAt = Number(
                  parsed?.layoutGeneratedAt || leafLayout.generatedAt || 0
                );
                leafLayout.suspenseCount = Number(parsed?.suspenseCount || 0);
                leafLayout.holes = Array.isArray(parsed?.holes) ? parsed.holes : [];
                if (leafLayout.generatedAt > maxActiveLayoutGenTime) {
                  maxActiveLayoutGenTime = leafLayout.generatedAt;
                }
              } catch (e) {}
            }
            leafRscItem = await readEdgeStorageOrAsset(storage, leafRscKey);
            hasValidLeafRsc = Boolean(
              leafRscItem &&
                leafRscItem.content &&
                !leafRscItem.content.trimStart().startsWith("<")
            );
          }
          leafSuspenseCount = Number(leafLayout.suspenseCount || 0);
          leafHoles = Array.isArray(leafLayout.holes) ? leafLayout.holes : [];
          if (hasValidLeafRsc) {
            activeLayoutRscText = leafRscItem.content;
            composedLeafLayoutMetaKey = leafLayout.cleanLayoutKey
              ? `${leafLayout.cleanLayoutKey}/layout.metadata.json`
              : "layout.metadata.json";
            composedLeafLayoutGen = Number(leafLayout.generatedAt || 0);
          }
        }
      }
    } catch (e) {}

    const prevGenTime = Math.max((currentMeta && currentMeta.generatedAt) || 0, maxActiveLayoutGenTime);
    const prevPageOwnGenTime =
      (currentMeta && (currentMeta.pageGeneratedAt || currentMeta.generatedAt)) || 0;
    const initialTagInvMap = new Map();
    if (isCloudflareWorkersRuntime() && retryDepth < 2) {
      const initTags = Array.from(
        new Set([
          ...(Array.isArray(currentMeta?.slotTags) ? currentMeta.slotTags : []),
          ...(Array.isArray(currentMeta?.tags) ? currentMeta.tags : []),
        ])
      ).filter(Boolean);
      if (initTags.length > 0) {
        await Promise.all(
          initTags.map(async (t) => {
            try {
              const invAt =
                typeof storage.getTagInvalidatedAtAsync === "function"
                  ? await storage.getTagInvalidatedAtAsync(t)
                  : typeof storage.getTagInvalidatedAt === "function"
                  ? storage.getTagInvalidatedAt(t)
                  : 0;
              initialTagInvMap.set(t, Number(invAt || 0));
            } catch (e) {}
          })
        );
      }
    }
    const now = Date.now();
    const newGenTime = nextMonotonicGenTime(prevGenTime);
    currentMeta.generatedAt = newGenTime;
    let didSpliceOnlyPageSlots = false;

    let newHtml = cached ? cached.content : "";
    let renderedRsc = "";
    let pageRscForCompose = "";
    let renderedFullRsc = "";
    let pendingShellPageJson = null;
    let composedFromCachedLayout = false;

    if (pagePath) {
      const revalDynamicState = { value: false };
      const rawHeaders = {
        "user-agent": "Dinou-ISR-Revalidator",
        host: "localhost",
        "x-forwarded-proto": "http",
      };
      const markRevalDynamic = () => {
        if (isSlotDiscoveryActive()) return;
        revalDynamicState.value = true;
      };
      const outerCtx = getContext();
      const activeEnv =
        outerCtx?.env ||
        outerCtx?.platformContext?.env ||
        outerCtx?.req?.env ||
        (typeof globalThis !== "undefined" ? globalThis.__DINOU_ENV__ : undefined) ||
        {};
      const revalContext = {
        req: {
          query: createBailoutProxy({}, "req.query", markRevalDynamic),
          cookies: createBailoutProxy({}, "req.cookies", markRevalDynamic),
          headers: createBailoutProxy(rawHeaders, "req.headers", markRevalDynamic),
          path: reqPathWithSlash,
          method: "GET",
          env: activeEnv,
        },
        res: {
          status(code) {
            const numericCode = Number(code);
            if (!Number.isNaN(numericCode)) {
              revalContext._statusCode = numericCode;
            }
            if (Number.isNaN(numericCode) || numericCode !== 200) {
              markRevalDynamic();
            }
            return revalContext.res;
          },
          setHeader() {
            markRevalDynamic();
          },
          cookie() {
            markRevalDynamic();
          },
          clearCookie() {
            markRevalDynamic();
          },
          redirect(urlOrStatus, targetUrl) {
            revalContext._hasRedirected = true;
            if (typeof urlOrStatus === "number") {
              revalContext._statusCode = urlOrStatus;
              revalContext._redirectLocation = targetUrl;
            } else {
              revalContext._statusCode = 302;
              revalContext._redirectLocation = urlOrStatus;
            }
            markRevalDynamic();
          },
        },
        env: activeEnv,
        platformContext: outerCtx?.platformContext || { env: activeEnv },
        _isStaticHtmlRender: true,
        _hasRedirected: false,
        _statusCode: 200,
      };
      const clientManifest =
        (typeof globalThis !== "undefined" && globalThis.__DINOU_CLIENT_MANIFEST__) || {};
      const isNotFound = { value: false };

      try {
        await requestStorage.run(revalContext, async () => {
          let resolvedPageJsx = null;

          if (onlyRefreshSlots) {
            try {
              const existingShellPage = await readEdgeStorageOrAsset(storage, shellPageKey);
              if (existingShellPage && existingShellPage.content) {
                const deserialized = deserializeJSX(existingShellPage.content);
                resolvedPageJsx = await runInPageSegment(() =>
                  refreshNestedSlotsInTree(deserialized, "__ppr_shell__", {
                    currentPath: reqPathWithSlash,
                  })
                );
                if (resolvedPageJsx) {
                  didSpliceOnlyPageSlots = true;
                  pendingShellPageJson = serializeJSX(resolvedPageJsx);
                }
              }
            } catch (e) {
              resolvedPageJsx = null;
            }
          }

          if (isRoutePpr) {
            let pageHoles = [];
            if (!resolvedPageJsx) {
              await runWithPprContext({ isPpr: Boolean(isPagePpr) }, async () => {
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
                pageHoles = isPagePpr ? getRegisteredHoles() : [];
              });
              if (revalDynamicState.value) {
                resolvedPageJsx = null;
                return;
              }
              if (resolvedPageJsx && !isNotFound.value) {
                try {
                  pendingShellPageJson = serializeJSX(resolvedPageJsx);
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
            currentMeta.pagePpr = Boolean(isPagePpr);
            const mergedHoles =
              onlyRefreshSlots && Array.isArray(currentMeta.holes)
                ? currentMeta.holes
                : Array.from(new Set([...leafHoles, ...pageHoles]));
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
                    pendingShellPageJson = serializeJSX(resolvedPageJsx);
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
          const knownLayoutsJson = getRevalLayoutsJson();
          const bootstrapScriptContent = isRoutePpr
            ? `window.__DINOU_LAYOUTS__ = ${knownLayoutsJson};\nwindow.__DINOU_USE_STATIC__ = false;\nwindow.__DINOU_PPR__ = true;\nwindow.__DINOU_BUILD_ID__ = "${newGenTime}";\n`
            : `window.__DINOU_LAYOUTS__ = ${knownLayoutsJson};\nwindow.__DINOU_USE_STATIC__ = true;\nwindow.__DINOU_BUILD_ID__ = "${newGenTime}";\n`;
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

          const shouldBumpSameMsPageTs = Boolean(
            renderedRsc && !didSpliceOnlyPageSlots && now <= prevGenTime
          );
          const sameMsPageIso = shouldBumpSameMsPageTs
            ? new Date(newGenTime).toISOString()
            : "";
          pageRscForCompose = shouldBumpSameMsPageTs
            ? renderedRsc.replace(
                /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
                sameMsPageIso
              )
            : renderedRsc;
          if (shouldBumpSameMsPageTs && pendingShellPageJson) {
            pendingShellPageJson = pendingShellPageJson.replace(
              /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
              sameMsPageIso
            );
          }

          if (activeLayoutRscText && pageRscForCompose && typeof renderHtmlStream === "function") {
            try {
              const htmlStream = await renderHtmlStream(toStream(activeLayoutRscText), {
                pageRscStream: toStream(pageRscForCompose),
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
          } else if (
            !hasActiveLayoutChain &&
            (didSpliceOnlyPageSlots || shouldBumpSameMsPageTs) &&
            pageRscForCompose &&
            typeof renderHtmlStream === "function"
          ) {
            try {
              const htmlStream = await renderHtmlStream(toStream(pageRscForCompose), {
                bootstrapModules: [clientEntry],
                bootstrapScriptContent,
                waitForAll: true,
              });
              const htmlText = await new Response(htmlStream).text();
              if (htmlText) {
                renderedFullRsc = pageRscForCompose;
                newHtml = htmlText;
                composedFromCachedLayout = true;
              }
            } catch (composeErr) {}
          }

          if (!composedFromCachedLayout && !hasDynamicLayoutInChain) {
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
        if (e && e.$$type === "dinou-internal-redirect") {
          revalContext._hasRedirected = true;
          revalDynamicState.value = true;
        } else if (isEdgeRuntime() || process.env.DINOU_DEBUG) {
          console.warn(`⚠️ [Edge Revalidate] Render fallback for ${cleanPath}:`, e?.message || e);
        }
      }
      const hasNon200Status = Boolean(
        revalContext._statusCode && Number(revalContext._statusCode) !== 200
      );
      if (revalDynamicState.value || revalContext._hasRedirected || hasNon200Status) {
        await transitionPageToDynamicTombstone({
          prevGen: prevGenTime,
          notFound: Number(revalContext._statusCode) === 404,
          logMessage: revalContext._hasRedirected
            ? `[ISR] Redirect detected for ${cleanPath}. Switching to Dynamic.`
            : hasNon200Status
            ? `[ISR] Non-200 status (${revalContext._statusCode}) detected for ${cleanPath}. Switching to Dynamic.`
            : `[ISR] Bailout detected for ${cleanPath}. Switching to Dynamic.`,
        });
        return;
      }
      if (isNotFound.value) {
        await transitionPageToDynamicTombstone({
          prevGen: prevGenTime,
          notFound: true,
          logMessage: `[ISR] NotFound detected for ${cleanPath}. Switching to Dynamic 404.`,
        });
        return;
      }
      markRouteDynamicInMap(reqPathWithSlash, cleanPath, false);
    }

    const didRenderFreshPage = Boolean(
      renderedRsc || renderedFullRsc || composedFromCachedLayout
    );

    if (!didRenderFreshPage) {
      if (!pagePath) {
        await transitionPageToDynamicTombstone({
          prevGen: prevGenTime,
          notFound: true,
          logMessage: `[ISR] Removed route detected for ${cleanPath}. Switching to Dynamic 404.`,
        });
        return;
      }
      if (!isEdgeRuntime()) {
        const keysToEvict = [
          htmlKey,
          shellHtmlKey,
          rscKey,
          shellRscKey,
          shellPageKey,
          legacyRscKey,
          metaKey,
        ];
        if (cleanPathKey) {
          keysToEvict.push(cleanPathKey);
        }
        await Promise.all(
          keysToEvict.map((k) => Promise.resolve(storage.delete(k)).catch(() => {}))
        );
      }
      return;
    }

    if (!pagePath && !cached && !existingPageRsc) {
      return;
    }

    try {
      if (cached && cached.content) {
        await storage.set(oldHtmlKey, cached.content);
      }
      if (existingPageRsc && existingPageRsc.content) {
        await storage.set(oldRscKey, existingPageRsc.content);
      }
      if (pendingShellPageJson) {
        const prevShellPage = await readEdgeStorageOrAsset(storage, shellPageKey);
        if (prevShellPage && prevShellPage.content) {
          await storage.set(shellPageOldKey, prevShellPage.content);
        }
      }
    } catch (e) {}

    const commitGenTime = nextMonotonicGenTime(newGenTime);
    if (commitGenTime !== newGenTime && newHtml) {
      newHtml = newHtml.replace(
        `window.__DINOU_BUILD_ID__ = "${newGenTime}"`,
        `window.__DINOU_BUILD_ID__ = "${commitGenTime}"`
      );
    }
    delete currentMeta.dynamic;
    delete currentMeta.notFound;
    currentMeta.status = 200;
    currentMeta.generatedAt = commitGenTime;
    currentMeta.pageSlotsGeneratedAt = commitGenTime;

    if (newHtml && !renderedFullRsc && !composedFromCachedLayout) {
      newHtml = newHtml.replace(
        /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
        new Date(commitGenTime).toISOString()
      );
    }
    currentMeta.pageGeneratedAt =
      didSpliceOnlyPageSlots && prevPageOwnGenTime > 0
        ? prevPageOwnGenTime
        : commitGenTime;

    let finalPageRscToWrite = "";
    let finalFullRscToWrite = "";
    if (renderedRsc) {
      finalPageRscToWrite = pageRscForCompose || renderedRsc;
      if (renderedFullRsc) {
        finalFullRscToWrite = renderedFullRsc;
      }
    } else {
      try {
        let cachedRsc =
          existingPageRsc && existingPageRsc.content
            ? existingPageRsc
            : await storage.get(rscKey);
        if (!cachedRsc) {
          cachedRsc = await storage.get(legacyRscKey);
        }
        if (cachedRsc && cachedRsc.content) {
          finalPageRscToWrite = cachedRsc.content.replace(
            /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
            new Date(commitGenTime).toISOString()
          );
        }
      } catch (e) {}
    }

    // Cross-isolate optimistic consistency check (Cloudflare Workers / distributed KV):
    // Prevent a slower isolate from clobbering newer layout/page/slot commits with stale artifacts,
    // without false-triggering on slots freshly written by THIS revalidation pass or upgrading
    // surgical `onlyRefreshSlots` retries into full page re-executions.
    const checkCloudflarePageRace = async (committedGen = 0) => {
      if (!isCloudflareWorkersRuntime() || retryDepth >= 2) return false;
      try {
        const latestMetaItem = await storage.get(metaKey);
        const latestMetaObj =
          latestMetaItem?.metadata ||
          (latestMetaItem?.content && latestMetaItem.content.trim().startsWith("{")
            ? JSON.parse(latestMetaItem.content)
            : null);
        const latestMetaGen = Number(latestMetaObj?.generatedAt || 0);
        if (committedGen > 0) {
          if (latestMetaGen > committedGen) return true;
        } else if (latestMetaGen > prevGenTime) {
          return true;
        }
        if (composedLeafLayoutMetaKey) {
          const latestLeafItem = await storage.get(composedLeafLayoutMetaKey);
          const latestLeafObj =
            latestLeafItem?.metadata ||
            (latestLeafItem?.content && latestLeafItem.content.trim().startsWith("{")
              ? JSON.parse(latestLeafItem.content)
              : null);
          if (Number(latestLeafObj?.generatedAt || 0) > composedLeafLayoutGen) {
            return true;
          }
        }
        const tagsToCheck = Array.from(
          new Set([
            ...(Array.isArray(currentMeta.slotTags) ? currentMeta.slotTags : []),
            ...(Array.isArray(currentMeta.tags) ? currentMeta.tags : []),
          ])
        ).filter(Boolean);
        if (tagsToCheck.length > 0) {
          const tagInvResults = await Promise.all(
            tagsToCheck.map(async (t) => {
              const invAt =
                typeof storage.getTagInvalidatedAtAsync === "function"
                  ? await storage.getTagInvalidatedAtAsync(t)
                  : typeof storage.getTagInvalidatedAt === "function"
                  ? storage.getTagInvalidatedAt(t)
                  : 0;
              const baselineInvAt = initialTagInvMap.has(t)
                ? initialTagInvMap.get(t)
                : now;
              return Number(invAt || 0) > baselineInvAt;
            })
          );
          if (tagInvResults.some(Boolean)) {
            return true;
          }
        }
        if (
          committedGen > 0 &&
          Array.isArray(currentMeta.slotTags) &&
          currentMeta.slotTags.length > 0
        ) {
          const slotCheck = await inspectSlotsFreshness(
            currentMeta.slotTags,
            committedGen,
            { bypassRequestCache: true }
          );
          if (slotCheck.hasNewer) {
            return true;
          }
        }
      } catch (e) {}
      return false;
    };

    if (await checkCloudflarePageRace(0)) {
      return await revalidatePage(reqPath, {
        ...internalOptions,
        _retryDepth: retryDepth + 1,
      });
    }

    // Causal commit order to guarantee zero hydration mismatch (#418) under concurrent ISR reads:
    // 1. _old snapshot already committed above (so buildId < currentGeneratedAt resolves T_prev)
    // 2. metadata.json advances currentGeneratedAt to commitGenTime (routing T_prev clients to _old)
    // 3. page.rsc / shell.rsc / shell.page.json commit T_new before any HTML exposes buildId=commitGenTime
    // 4. index.html / shell.html / cleanPathKey commit last
    await storage.set(metaKey, JSON.stringify(currentMeta));

    if (pendingShellPageJson) {
      try {
        await storage.set(shellPageKey, pendingShellPageJson);
      } catch (e) {}
    }

    try {
      if (finalPageRscToWrite) {
        await storage.set(rscKey, finalPageRscToWrite);
        if (isRoutePpr && renderedRsc) {
          await storage.set(shellRscKey, finalPageRscToWrite);
        }
      }
      if (finalFullRscToWrite) {
        await storage.set(legacyRscKey, finalFullRscToWrite);
      }
    } catch (e) {}

    if (newHtml && !hasDynamicLayoutInChain) {
      await storage.set(htmlKey, newHtml, currentMeta);
      if (isRoutePpr) {
        await storage.set(shellHtmlKey, newHtml, currentMeta);
      }
      if (cleanPathKey) {
        await storage.set(cleanPathKey, newHtml, currentMeta);
      }
    }

    if (await checkCloudflarePageRace(commitGenTime)) {
      return await revalidatePage(reqPath, {
        ...internalOptions,
        _retryDepth: retryDepth + 1,
      });
    }

    console.log(`✅ [Edge Revalidate] Successfully revalidated page ${cleanPath} (generatedAt: ${commitGenTime})`);
  });

  if (useInflightDedup) {
    inflightPageRevalidations.set(inFlightKey, revalPromise);
  }
  try {
    return await revalPromise;
  } finally {
    if (useInflightDedup) {
      inflightPageRevalidations.delete(inFlightKey);
    }
  }
}

async function revalidatePath(reqPath, options) {
  if (options !== undefined) {
    console.warn(
      `⚠️ [Dinou] The second parameter (options) in revalidatePath("${reqPath}", ...) is deprecated and ignored since v9.0.3. Zero hydration mismatch is now guaranteed automatically via lazy index.html re-composition.`
    );
  }
  const cleanPath = normalizeRevalidatePath(reqPath);
  const storage = getStorageAdapter();
  const cleanPathKey = cleanPath.replace(/^\/+/, "").replace(/\/+$/, "");
  const reqSegments = cleanPath.split("/").filter(Boolean);
  const decodedCleanKey = reqSegments
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch (e) {
        return s;
      }
    })
    .join("/");
  const srcFolder = path.resolve(process.cwd(), "src");

  // 1. Revalidate layout first if present for this exact segment (including `(group)` and
  //    0-segment `[[...slug]]` / `[[param]]` co-located layouts whose canonical `cleanLayoutKey`
  //    differs from the raw URL `cleanPathKey`), without revalidating shared parent layouts.
  let hasOwnLayoutFile = false;
  let targetLayoutRoutePath = null;
  let hasExplicitLayoutSegmentOnly = false;
  let pagePath = null;
  try {
    const [resolvedPagePath] = getFilePathAndDynamicParams(reqSegments, {}, srcFolder);
    pagePath = resolvedPagePath || null;
  } catch (e) {}

  let activeChain = [];
  try {
    activeChain = getActiveLayoutChain(reqSegments, {}, srcFolder);
  } catch (e) {}

  if (pagePath && activeChain.length > 0) {
    const normPageDir = path.dirname(pagePath).replace(/\\/g, "/").replace(/\/+$/, "");
    const leafLayout = activeChain[0];
    const normLeafLayoutDir = leafLayout?.layoutPath
      ? path.dirname(leafLayout.layoutPath).replace(/\\/g, "/").replace(/\/+$/, "")
      : "";
    if (
      (normLeafLayoutDir && normLeafLayoutDir === normPageDir) ||
      stripVirtualLayoutSegments(leafLayout?.cleanLayoutKey) === decodedCleanKey
    ) {
      hasOwnLayoutFile = true;
      targetLayoutRoutePath = leafLayout.layoutRoutePath;
    }
  } else if (!pagePath) {
    try {
      const exactChain = getActiveLayoutChain(reqSegments, {}, srcFolder, {
        ignoreNoLayout: true,
        exactLayoutKey: true,
      });
      if (exactChain.length > 0) {
        const leaf = exactChain[0];
        if (
          leaf.cleanLayoutKey === decodedCleanKey ||
          stripVirtualLayoutSegments(leaf.cleanLayoutKey) === decodedCleanKey
        ) {
          hasOwnLayoutFile = true;
          targetLayoutRoutePath = leaf.layoutRoutePath;
          hasExplicitLayoutSegmentOnly = true;
        }
      }
    } catch (e) {}

    if (!hasOwnLayoutFile) {
      const candidateKeys = Array.from(new Set([cleanPathKey, decodedCleanKey]));
      for (const candKey of candidateKeys) {
        const layoutRscKey = candKey ? `${candKey}/layout.rsc` : "layout.rsc";
        const layoutMetaKey = candKey
          ? `${candKey}/layout.metadata.json`
          : "layout.metadata.json";
        const cachedLayout = await readEdgeStorageOrAsset(storage, layoutRscKey);
        const cachedLayoutMeta = await readEdgeStorageOrAsset(storage, layoutMetaKey);
        if (cachedLayout || cachedLayoutMeta) {
          targetLayoutRoutePath = candKey ? "/" + candKey : "/";
          break;
        }
      }
    }
  }

  if (targetLayoutRoutePath) {
    await revalidateLayout(targetLayoutRoutePath);
  }

  // 2. Revalidate page (skip when caller targeted a layout-only segment such as "/grp/(alpha)")
  if (!hasExplicitLayoutSegmentOnly) {
    await revalidatePage(cleanPath);
  }
}

async function revalidateLayout(reqPath, internalOptions = {}) {
  const targetPath = normalizeRevalidatePath(reqPath);
  const onlyRefreshSlots = Boolean(internalOptions?.onlyRefreshSlots);
  const onlyIfExpired = Boolean(internalOptions?.onlyIfExpired);
  const recomposeOnly = Boolean(internalOptions?.recomposeOnly);
  const retryDepth = Number(internalOptions?._retryDepth || 0);
  if (!onlyIfExpired && !onlyRefreshSlots) {
    recordClientRevalidationHint("layout", targetPath);
  }
  const inFlightKey = `${targetPath}:${recomposeOnly ? "recompose" : onlyRefreshSlots ? "slots" : "full"}:${onlyIfExpired ? "ttl" : "force"}`;
  // Never await an outer queued inflightLayoutRevalidations promise when already inside
  // revalQueueStorage (e.g. revalidatePage holding revalState.queue calling nested revalidateLayout),
  // or a concurrent caller queued behind us on revalState.queue would permanently deadlock the queue.
  const isInsideRevalQueue = Boolean(revalQueueStorage.getStore());
  const useInflightDedup = !isCloudflareWorkersRuntime() && !isInsideRevalQueue;

  if (useInflightDedup && inflightLayoutRevalidations.has(inFlightKey)) {
    return inflightLayoutRevalidations.get(inFlightKey);
  }

  const revalPromise = enqueueRevalidation(async () => {
      const storage = getStorageAdapter();
      const rawReqSegments = targetPath.split("/").filter(Boolean).map((s) => {
        try {
          return decodeURIComponent(s);
        } catch (e) {
          return s;
        }
      });
      const rawCleanPathKey = rawReqSegments.join("/");
      const srcFolder = path.resolve(process.cwd(), "src");

      let activeChainPre = [];
      try {
        activeChainPre = getActiveLayoutChain(rawReqSegments, {}, srcFolder, {
          ignoreNoLayout: true,
          exactLayoutKey: true,
        });
      } catch (e) {}

      let cleanPathKey = rawCleanPathKey;
      if (
        activeChainPre.length > 0 &&
        (activeChainPre[0].cleanLayoutKey === rawCleanPathKey ||
          stripVirtualLayoutSegments(activeChainPre[0].cleanLayoutKey) === rawCleanPathKey)
      ) {
        cleanPathKey = activeChainPre[0].cleanLayoutKey || "";
      }

      const reqSegments = cleanPathKey ? cleanPathKey.split("/").filter(Boolean) : [];
      const effectiveTargetPath = cleanPathKey ? "/" + cleanPathKey : "/";

      const layoutRscKey = cleanPathKey ? `${cleanPathKey}/layout.rsc` : "layout.rsc";
      const layoutOldRscKey = cleanPathKey ? `${cleanPathKey}/layout._old.rsc` : "layout._old.rsc";
      const layoutMetaKey = cleanPathKey ? `${cleanPathKey}/layout.metadata.json` : "layout.metadata.json";
      const shellLayoutKey = cleanPathKey ? `${cleanPathKey}/shell.layout.json` : "shell.layout.json";
      const shellLayoutOwnKey = cleanPathKey ? `${cleanPathKey}/shell.layout.own.json` : "shell.layout.own.json";
      const shellLayoutOldKey = cleanPathKey ? `${cleanPathKey}/shell.layout._old.json` : "shell.layout._old.json";

      let cached = await readEdgeStorageOrAsset(storage, layoutRscKey);
      let currentMeta = (cached && cached.metadata) || {};
      let hasCachedMeta = Boolean(cached && cached.metadata);
      try {
        const metaItem = await readEdgeStorageOrAsset(storage, layoutMetaKey);
        if (metaItem && metaItem.content) {
          currentMeta = JSON.parse(metaItem.content);
          hasCachedMeta = true;
        }
      } catch (e) {}

      let resolvedLayoutFilePath = null;
      let isTargetLayoutDynamic = false;
      if (await isLayoutChainBlockedForRevalidate(activeChainPre, storage)) {
        return false;
      }
      try {
        const leafEntryPre =
          activeChainPre.length > 0 && activeChainPre[0].cleanLayoutKey === cleanPathKey
            ? activeChainPre[0]
            : null;
        if (!leafEntryPre && !cached && !hasCachedMeta) {
          return false;
        }
        const layoutPath = leafEntryPre?.layoutPath || null;
        const layoutParams = leafEntryPre?.dParams || {};
        resolvedLayoutFilePath = layoutPath || null;
        if (layoutPath) {
          const layoutCfg = await resolveLayoutFunctionsConfig(layoutPath, layoutParams || {});
          if (layoutCfg.isDynamic) {
            isTargetLayoutDynamic = true;
          }
          if (Array.isArray(layoutCfg.tags) && layoutCfg.tags.length > 0) {
            currentMeta.tags = layoutCfg.tags;
          } else if (!Array.isArray(currentMeta.tags)) {
            currentMeta.tags = [];
          }
          if (layoutCfg.revalidate !== undefined) {
            currentMeta.revalidate = layoutCfg.revalidate;
          }
        }
        const { anyLayoutPpr } = await resolveLayoutChainPpr(reqSegments, {}, srcFolder, {
          ignoreNoLayout: true,
          exactLayoutKey: true,
        });
        currentMeta.ppr = Boolean(anyLayoutPpr);
      } catch (e) {}

      if (isTargetLayoutDynamic) {
        return false;
      }

      if (onlyIfExpired && !onlyRefreshSlots && !recomposeOnly) {
        const latestLayoutReval = currentMeta.revalidate;
        const latestLayoutGenAt = Number(
          currentMeta.ownGeneratedAt ||
            currentMeta.layoutGeneratedAt ||
            currentMeta.generatedAt ||
            0
        );
        const stillExpired =
          typeof latestLayoutReval === "number" &&
          latestLayoutReval >= 1 &&
          latestLayoutGenAt > 0 &&
          Date.now() > latestLayoutGenAt + latestLayoutReval * 1000;
        if (!stillExpired) {
          return false;
        }
      }

      const prevGenTime = (currentMeta && currentMeta.generatedAt) || 0;
      const prevLayoutOwnGenTime =
        (currentMeta && (currentMeta.layoutGeneratedAt || currentMeta.generatedAt)) || 0;
      const prevLayoutOwnLevelGenTime =
        (currentMeta &&
          (currentMeta.ownGeneratedAt ||
            currentMeta.layoutGeneratedAt ||
            currentMeta.generatedAt)) ||
        0;
      const initialLayoutTagInvMap = new Map();
      if (isCloudflareWorkersRuntime() && retryDepth < 2) {
        const initLayoutTags = Array.from(
          new Set([
            ...(Array.isArray(currentMeta?.ownSlotTags) ? currentMeta.ownSlotTags : []),
            ...(Array.isArray(currentMeta?.slotTags) ? currentMeta.slotTags : []),
            ...(Array.isArray(currentMeta?.tags) ? currentMeta.tags : []),
          ])
        ).filter(Boolean);
        if (initLayoutTags.length > 0) {
          await Promise.all(
            initLayoutTags.map(async (t) => {
              try {
                const invAt =
                  typeof storage.getTagInvalidatedAtAsync === "function"
                    ? await storage.getTagInvalidatedAtAsync(t)
                    : typeof storage.getTagInvalidatedAt === "function"
                    ? storage.getTagInvalidatedAt(t)
                    : 0;
                initialLayoutTagInvMap.set(t, Number(invAt || 0));
              } catch (e) {}
            })
          );
        }
      }
      const now = Date.now();
      const newGenTime = nextMonotonicGenTime(prevGenTime);
      currentMeta.generatedAt = newGenTime;
      if (currentMeta.status === undefined) {
        currentMeta.status = 200;
      }

      const reqPathWithSlash = effectiveTargetPath.endsWith("/")
        ? effectiveTargetPath
        : effectiveTargetPath + "/";
      let newLayoutRsc = cached && cached.content ? cached.content : "";
      let didRenderFreshLayout = false;
      let didSpliceOnlyLayoutSlots = false;
      let didRecomposeOnly = false;
      let pendingShellLayoutJson = null;
      let pendingShellLayoutOwnJson = null;
      const revalDynamicState = { value: false };
      let layoutHasRedirected = false;
      try {
        const rawHeaders = {
          "user-agent": "Dinou-ISR-Revalidator",
          host: "localhost",
          "x-forwarded-proto": "http",
        };
        const markRevalDynamic = () => {
          if (isSlotDiscoveryActive()) return;
          revalDynamicState.value = true;
        };
        const outerCtx = getContext();
        const activeEnv =
          outerCtx?.env ||
          outerCtx?.platformContext?.env ||
          outerCtx?.req?.env ||
          (typeof globalThis !== "undefined" ? globalThis.__DINOU_ENV__ : undefined) ||
          {};
        let layoutStatusCode = 200;
        const revalContext = {
          req: {
            query: createBailoutProxy({}, "req.query", markRevalDynamic),
            cookies: createBailoutProxy({}, "req.cookies", markRevalDynamic),
            headers: createBailoutProxy(rawHeaders, "req.headers", markRevalDynamic),
            path: reqPathWithSlash,
            method: "GET",
            env: activeEnv,
          },
          res: {
            status(code) {
              const numericCode = Number(code);
              if (!Number.isNaN(numericCode)) {
                layoutStatusCode = numericCode;
                revalContext._statusCode = numericCode;
              }
              if (Number.isNaN(numericCode) || numericCode !== 200) {
                markRevalDynamic();
              }
              return revalContext.res;
            },
            setHeader() {
              markRevalDynamic();
            },
            cookie() {
              markRevalDynamic();
            },
            clearCookie() {
              markRevalDynamic();
            },
            redirect(urlOrStatus, targetUrl) {
              layoutHasRedirected = true;
              revalContext._hasRedirected = true;
              if (typeof urlOrStatus === "number") {
                layoutStatusCode = urlOrStatus;
                revalContext._statusCode = urlOrStatus;
                revalContext._redirectLocation = targetUrl;
              } else {
                layoutStatusCode = 302;
                revalContext._statusCode = 302;
                revalContext._redirectLocation = urlOrStatus;
              }
              markRevalDynamic();
            },
          },
          env: activeEnv,
          platformContext: outerCtx?.platformContext || { env: activeEnv },
          _isStaticHtmlRender: true,
          _hasRedirected: false,
          _statusCode: 200,
        };
        const clientManifest =
          (typeof globalThis !== "undefined" && globalThis.__DINOU_CLIENT_MANIFEST__) || {};
        await requestStorage.run(revalContext, async () => {
          let resolvedLayoutJsx = null;
          const activeChain = getActiveLayoutChain(reqSegments, {}, srcFolder, {
            ignoreNoLayout: true,
            exactLayoutKey: true,
          });
          if (activeChain.length > 0) {
            await hydrateActiveChainPpr(activeChain, reqSegments, {}, srcFolder, {
              ignoreNoLayout: true,
              exactLayoutKey: true,
            });
          }
          const hasExactOwnLayout =
            activeChain.length > 0 && activeChain[0].cleanLayoutKey === cleanPathKey;

          // 1. Recompose-only path (an ancestor layout updated; preserve THIS layout's cached own shell!)
          if (recomposeOnly && hasExactOwnLayout) {
            try {
              const composed = await composeLayoutChainFromOwnFragments(activeChain, storage, {
                currentPath: reqPathWithSlash,
              });
              if (composed && composed.layoutOnlyTree) {
                resolvedLayoutJsx = composed.layoutOnlyTree;
                didRecomposeOnly = true;
                pendingShellLayoutJson = serializeJSX(resolvedLayoutJsx);
                currentMeta.ppr = Boolean(composed.anyLayoutPpr);
                currentMeta.suspenseCount = composed.suspenseCount;
                if (composed.holes.length > 0) {
                  currentMeta.holes = composed.holes;
                } else {
                  delete currentMeta.holes;
                }
                if (composed.slotTags.length > 0) {
                  currentMeta.slotTags = composed.slotTags;
                }
              }
            } catch (e) {
              if (e && e.$$type === "dinou-internal-redirect") {
                throw e;
              }
              resolvedLayoutJsx = null;
            }
          }

          // 2. Slot-only refresh path (refresh <DinouCacheSlot> without re-executing layout host)
          let ownOnlyUnderDynamicAncestor = false;
          if (!resolvedLayoutJsx && onlyRefreshSlots) {
            try {
              let hasNewerAncestorOwnLayout = false;
              if (prevLayoutOwnGenTime > 0 && activeChain.length > 1) {
                for (const anc of activeChain.slice(1)) {
                  const ancMetaKey = anc.cleanLayoutKey
                    ? `${anc.cleanLayoutKey}/layout.metadata.json`
                    : "layout.metadata.json";
                  const ancItem = await readEdgeStorageOrAsset(storage, ancMetaKey);
                  let ancMetaObj = ancItem?.metadata || null;
                  if (!ancMetaObj && ancItem?.content) {
                    try {
                      ancMetaObj = JSON.parse(ancItem.content);
                    } catch (e) {}
                  }
                  const ancOwnGen = Number(
                    ancMetaObj?.layoutGeneratedAt || ancMetaObj?.generatedAt || 0
                  );
                  if (ancOwnGen > prevLayoutOwnGenTime) {
                    hasNewerAncestorOwnLayout = true;
                    break;
                  }
                }
              }
              if (hasExactOwnLayout) {
                const composed = await composeLayoutChainFromOwnFragments(activeChain, storage, {
                  refreshSlotsForKeys: "all",
                  persistRefreshedOwnKeys: new Set([cleanPathKey]),
                  currentPath: reqPathWithSlash,
                });
                if (composed && composed.layoutOnlyTree) {
                  resolvedLayoutJsx = composed.layoutOnlyTree;
                  didSpliceOnlyLayoutSlots = !hasNewerAncestorOwnLayout;
                  didRecomposeOnly = hasNewerAncestorOwnLayout;
                  pendingShellLayoutJson = serializeJSX(resolvedLayoutJsx);
                  currentMeta.ppr = Boolean(composed.anyLayoutPpr);
                  currentMeta.suspenseCount = composed.suspenseCount;
                  if (composed.holes.length > 0) {
                    currentMeta.holes = composed.holes;
                  } else {
                    delete currentMeta.holes;
                  }
                  if (composed.slotTags.length > 0) {
                    currentMeta.slotTags = composed.slotTags;
                  }
                } else if (currentMeta.hasDynamicAncestor) {
                  // Static layout underneath a dynamic ancestor (e.g., L1 -> Dyn L2 -> Static/PPR L3):
                  // refresh slots inside L3/shell.layout.own.json ONLY without re-executing L3 host!
                  const existingOwnLayout = await readEdgeStorageOrAsset(storage, shellLayoutOwnKey);
                  if (existingOwnLayout && existingOwnLayout.content) {
                    const deserializedOwn = deserializeJSX(existingOwnLayout.content);
                    const refreshedOwn = await runInLayoutSegment(() =>
                      refreshNestedSlotsInTree(deserializedOwn, "__layout_shell__", {
                        currentPath: reqPathWithSlash,
                      })
                    );
                    if (refreshedOwn) {
                      pendingShellLayoutOwnJson = serializeJSX(refreshedOwn);
                      didSpliceOnlyLayoutSlots = true;
                      didRenderFreshLayout = true;
                      ownOnlyUnderDynamicAncestor = true;
                    }
                  }
                }
              }
              if (!resolvedLayoutJsx && !ownOnlyUnderDynamicAncestor && !hasNewerAncestorOwnLayout) {
                const existingShellLayout = await readEdgeStorageOrAsset(storage, shellLayoutKey);
                if (existingShellLayout && existingShellLayout.content) {
                  const deserialized = deserializeJSX(existingShellLayout.content);
                  resolvedLayoutJsx = await runInLayoutSegment(() =>
                    refreshNestedSlotsInTree(deserialized, "__layout_shell__", {
                      currentPath: reqPathWithSlash,
                    })
                  );
                  if (resolvedLayoutJsx) {
                    didSpliceOnlyLayoutSlots = true;
                    pendingShellLayoutJson = serializeJSX(resolvedLayoutJsx);
                  }
                }
              }
            } catch (e) {
              if (e && e.$$type === "dinou-internal-redirect") {
                throw e;
              }
              resolvedLayoutJsx = null;
            }
          }

          // 3. Per-level isolated layout revalidation: render ONLY this layout level and splice into cached ancestors!
          if (!resolvedLayoutJsx && !ownOnlyUnderDynamicAncestor && hasExactOwnLayout) {
            try {
              const leafEntry = activeChain[0];
              const single = await renderSingleLayoutLevel(leafEntry, {
                reqSegments,
                queryObj: {},
                isDevelopment: false,
                usePprContext: true,
              });
              if (single && single.ownTree && !revalDynamicState.value) {
                pendingShellLayoutOwnJson = serializeJSX(single.ownTree);
                currentMeta.ownHoles = single.ownHoles;
                currentMeta.ownSuspenseCount = single.ownSuspenseCount;
                currentMeta.ownSlotTags = single.ownSlotTags;
                currentMeta.ownPpr = Boolean(single.effectivePpr);

                let hasDynAncestor = false;
                for (const anc of activeChain.slice(1)) {
                  const ancCfg = await resolveLayoutFunctionsConfig(anc.layoutPath, anc.dParams);
                  if (ancCfg.isDynamic) {
                    hasDynAncestor = true;
                    break;
                  }
                  const ancMetaKey = anc.cleanLayoutKey
                    ? `${anc.cleanLayoutKey}/layout.metadata.json`
                    : "layout.metadata.json";
                  const ancItem = await readEdgeStorageOrAsset(storage, ancMetaKey);
                  let ancMetaObj = ancItem?.metadata || null;
                  if (!ancMetaObj && ancItem?.content) {
                    try {
                      ancMetaObj = JSON.parse(ancItem.content);
                    } catch (e) {}
                  }
                  if (ancMetaObj?.dynamic) {
                    hasDynAncestor = true;
                    break;
                  }
                }

                if (hasDynAncestor) {
                  // This layout itself is static, but an ancestor is dynamic (S -> D -> S).
                  // Persist ONLY this level's own fragment & metadata — never freeze the dynamic ancestor!
                  currentMeta.hasDynamicAncestor = true;
                  delete currentMeta.dynamic;
                  if (Array.isArray(single.ownSlotTags) && single.ownSlotTags.length > 0) {
                    currentMeta.slotTags = single.ownSlotTags;
                  }
                  didRenderFreshLayout = true;
                  ownOnlyUnderDynamicAncestor = true;
                } else {
                  const overrides = new Map([[cleanPathKey, single]]);
                  const composed = await composeLayoutChainFromOwnFragments(activeChain, storage, {
                    overrides,
                    currentPath: reqPathWithSlash,
                  });
                  if (composed && composed.layoutOnlyTree) {
                    resolvedLayoutJsx = composed.layoutOnlyTree;
                    pendingShellLayoutJson = serializeJSX(resolvedLayoutJsx);
                    currentMeta.ppr = Boolean(composed.anyLayoutPpr);
                    currentMeta.suspenseCount = composed.suspenseCount;
                    if (composed.holes.length > 0) {
                      currentMeta.holes = composed.holes;
                    } else {
                      delete currentMeta.holes;
                    }
                    if (composed.slotTags.length > 0) {
                      currentMeta.slotTags = composed.slotTags;
                    }
                  }
                }
              }
            } catch (e) {
              if (e && e.$$type === "dinou-internal-redirect") {
                throw e;
              }
              resolvedLayoutJsx = null;
            }
          }

          // 4. Fallback: full layout chain render via getJSX (e.g. missing ancestor shell.layout.own.json)
          if (!resolvedLayoutJsx && !ownOnlyUnderDynamicAncestor && !revalDynamicState.value) {
            const isLayoutPpr = Boolean(
              currentMeta.ppr || (Array.isArray(currentMeta.holes) && currentMeta.holes.length > 0)
            );
            await runWithPprContext({ isPpr: isLayoutPpr }, async () => {
              const rawJsx = await getJSX(reqPathWithSlash, {}, {}, false, false, {
                segment: "layout",
              });
              resetPprHoles(0);
              resolvedLayoutJsx = await runInLayoutSegment(() =>
                asyncRenderJSXToClientJSX(rawJsx)
              );
              if (revalDynamicState.value) {
                resolvedLayoutJsx = null;
                return;
              }
              const layoutHoles = getRegisteredHoles();
              if (layoutHoles.length > 0) {
                currentMeta.holes = layoutHoles;
              }
              currentMeta.suspenseCount = getPprHoleCounter();
              if (resolvedLayoutJsx) {
                pendingShellLayoutJson = serializeJSX(resolvedLayoutJsx);
              }
            });
          }
          if (revalDynamicState.value) {
            return;
          }
          if (resolvedLayoutJsx) {
            const stream = renderRSCStream(resolvedLayoutJsx, clientManifest, {
              runtime: "edge",
            });
            const rendered = await new Response(stream).text();
            if (rendered) {
              newLayoutRsc = rendered;
              didRenderFreshLayout = true;
            }
          }
          if (!Array.isArray(currentMeta.slotTags) || currentMeta.slotTags.length === 0) {
            const layoutSlotTags = revalContext._layoutSlotTags || revalContext._slotTags;
            if (layoutSlotTags && layoutSlotTags.size > 0) {
              currentMeta.slotTags = Array.from(layoutSlotTags);
            }
          }
        });
      } catch (e) {
        if (e && e.$$type === "dinou-internal-redirect") {
          layoutHasRedirected = true;
          revalDynamicState.value = true;
        } else if (isEdgeRuntime() || process.env.DINOU_DEBUG) {
          console.warn(`⚠️ [Edge Revalidate] Layout render fallback for ${targetPath}:`, e?.message || e);
        }
      }

      if (revalDynamicState.value || layoutHasRedirected) {
        // Preserve causal layout _old snapshots BEFORE advancing layout.metadata.json and
        // evicting current layout artifacts so in-flight tabs hydrating T_prev receive
        // matching layout._old.rsc / shell.layout._old.json with zero #418!
        try {
          if (cached && cached.content) {
            await storage.set(layoutOldRscKey, cached.content);
          }
          const prevShellLayout = await readEdgeStorageOrAsset(storage, shellLayoutKey);
          if (prevShellLayout && prevShellLayout.content) {
            await storage.set(shellLayoutOldKey, prevShellLayout.content);
          }
        } catch (e) {}
        try {
          await storage.set(
            layoutMetaKey,
            JSON.stringify({
              ...currentMeta,
              dynamic: true,
              generatedAt: nextMonotonicGenTime(prevGenTime),
            })
          );
        } catch (e) {}
        await Promise.all(
          [
            layoutRscKey,
            shellLayoutKey,
            shellLayoutOwnKey,
          ].map((k) => Promise.resolve(storage.delete(k)).catch(() => {}))
        );
        return false;
      }

      if (!didRenderFreshLayout) {
        if (!resolvedLayoutFilePath) {
          if (cached || hasCachedMeta) {
            try {
              if (cached && cached.content) {
                await storage.set(layoutOldRscKey, cached.content);
              }
              const prevShellLayout = await readEdgeStorageOrAsset(storage, shellLayoutKey);
              if (prevShellLayout && prevShellLayout.content) {
                await storage.set(shellLayoutOldKey, prevShellLayout.content);
              }
              await storage.set(
                layoutMetaKey,
                JSON.stringify({
                  ...currentMeta,
                  dynamic: true,
                  notFound: true,
                  generatedAt: nextMonotonicGenTime(prevGenTime),
                })
              );
            } catch (e) {}
            await Promise.all(
              [layoutRscKey, shellLayoutKey, shellLayoutOwnKey].map((k) =>
                Promise.resolve(storage.delete(k)).catch(() => {})
              )
            );
            return true;
          }
          return false;
        }
        if (!isEdgeRuntime()) {
          await Promise.all(
            [layoutRscKey, layoutMetaKey, shellLayoutKey, shellLayoutOwnKey].map((k) =>
              Promise.resolve(storage.delete(k)).catch(() => {})
            )
          );
          return Boolean(cached || hasCachedMeta || resolvedLayoutFilePath);
        }
        return false;
      }

      if (!resolvedLayoutFilePath && !cached && !hasCachedMeta) {
        return false;
      }

      try {
        if (cached && cached.content) {
          await storage.set(layoutOldRscKey, cached.content);
        }
        if (pendingShellLayoutJson) {
          const prevShellLayout = await readEdgeStorageOrAsset(storage, shellLayoutKey);
          if (prevShellLayout && prevShellLayout.content) {
            await storage.set(shellLayoutOldKey, prevShellLayout.content);
          }
        }
      } catch (e) {}

      const commitLayoutGenTime = nextMonotonicGenTime(newGenTime);
      delete currentMeta.dynamic;
      delete currentMeta.notFound;
      currentMeta.status = 200;
      currentMeta.generatedAt = commitLayoutGenTime;
      if (
        newLayoutRsc &&
        !didRecomposeOnly &&
        !didSpliceOnlyLayoutSlots &&
        now <= prevGenTime
      ) {
        const layoutIsoCommit = new Date(commitLayoutGenTime).toISOString();
        newLayoutRsc = newLayoutRsc.replace(
          /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
          layoutIsoCommit
        );
        if (pendingShellLayoutJson) {
          pendingShellLayoutJson = pendingShellLayoutJson.replace(
            /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
            layoutIsoCommit
          );
        }
        if (pendingShellLayoutOwnJson) {
          pendingShellLayoutOwnJson = pendingShellLayoutOwnJson.replace(
            /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
            layoutIsoCommit
          );
        }
      }
      currentMeta.layoutGeneratedAt =
        didSpliceOnlyLayoutSlots && prevLayoutOwnGenTime > 0
          ? prevLayoutOwnGenTime
          : commitLayoutGenTime;
      currentMeta.ownGeneratedAt =
        (didSpliceOnlyLayoutSlots || didRecomposeOnly) && prevLayoutOwnLevelGenTime > 0
          ? prevLayoutOwnLevelGenTime
          : commitLayoutGenTime;
      const checkCloudflareLayoutRace = async (committedGen = 0) => {
        if (!isCloudflareWorkersRuntime() || retryDepth >= 2) return false;
        try {
          const latestItem = await storage.get(layoutMetaKey);
          const latestObj =
            latestItem?.metadata ||
            (latestItem?.content && latestItem.content.trim().startsWith("{")
              ? JSON.parse(latestItem.content)
              : null);
          const latestGen = Number(latestObj?.generatedAt || 0);
          if (committedGen > 0) {
            if (latestGen > committedGen) return true;
          } else if (latestGen > prevGenTime) {
            return true;
          }
          const lAllTags = Array.from(
            new Set([
              ...(Array.isArray(currentMeta.ownSlotTags) ? currentMeta.ownSlotTags : []),
              ...(Array.isArray(currentMeta.slotTags) ? currentMeta.slotTags : []),
              ...(Array.isArray(currentMeta.tags) ? currentMeta.tags : []),
            ])
          ).filter(Boolean);
          if (lAllTags.length > 0) {
            const lTagInvResults = await Promise.all(
              lAllTags.map(async (t) => {
                const invAt =
                  typeof storage.getTagInvalidatedAtAsync === "function"
                    ? await storage.getTagInvalidatedAtAsync(t)
                    : typeof storage.getTagInvalidatedAt === "function"
                    ? storage.getTagInvalidatedAt(t)
                    : 0;
                const baselineInvAt = initialLayoutTagInvMap.has(t)
                  ? initialLayoutTagInvMap.get(t)
                  : now;
                return Number(invAt || 0) > baselineInvAt;
              })
            );
            if (lTagInvResults.some(Boolean)) {
              return true;
            }
          }
          const lSlotTags = Array.from(
            new Set([
              ...(Array.isArray(currentMeta.ownSlotTags) ? currentMeta.ownSlotTags : []),
              ...(Array.isArray(currentMeta.slotTags) ? currentMeta.slotTags : []),
            ])
          );
          if (committedGen > 0 && lSlotTags.length > 0) {
            const slotCheck = await inspectSlotsFreshness(
              lSlotTags,
              committedGen,
              { bypassRequestCache: true }
            );
            if (slotCheck.hasNewer) return true;
          }
        } catch (e) {}
        return false;
      };

      if (await checkCloudflareLayoutRace(0)) {
        return await revalidateLayout(reqPath, {
          ...internalOptions,
          _retryDepth: retryDepth + 1,
        });
      }

      // Causal commit order: persist layout payload artifacts (shell.layout.own.json, shell.layout.json,
      // and layout.rsc with inline currentMeta) BEFORE advancing layout.metadata.json so concurrent
      // readers checking layoutGeneratedAt never observe T_new while layout.rsc is still T_old.
      if (pendingShellLayoutOwnJson) {
        try {
          await storage.set(shellLayoutOwnKey, pendingShellLayoutOwnJson);
        } catch (e) {}
      }
      if (pendingShellLayoutJson) {
        try {
          await storage.set(shellLayoutKey, pendingShellLayoutJson);
        } catch (e) {}
      }
      if (newLayoutRsc) {
        await storage.set(layoutRscKey, newLayoutRsc, currentMeta);
      }
      await storage.set(layoutMetaKey, JSON.stringify(currentMeta));

      if (await checkCloudflareLayoutRace(commitLayoutGenTime)) {
        return await revalidateLayout(reqPath, {
          ...internalOptions,
          _retryDepth: retryDepth + 1,
        });
      }

      console.log(`✅ [Edge Revalidate] Successfully revalidated layout ${targetPath} (generatedAt: ${commitLayoutGenTime})`);
      return true;
  });

  if (useInflightDedup) {
    inflightLayoutRevalidations.set(inFlightKey, revalPromise);
  }
  try {
    return await revalPromise;
  } finally {
    if (useInflightDedup) {
      inflightLayoutRevalidations.delete(inFlightKey);
    }
  }
}

const TAG_SCAN_CONCURRENCY = 16;

async function runBoundedConcurrency(items, concurrency, worker) {
  if (!Array.isArray(items) || items.length === 0) return;
  const limit = Math.min(concurrency, items.length);
  let cursor = 0;
  const runners = Array.from({ length: limit }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      await worker(items[idx]);
    }
  });
  await Promise.all(runners);
}

async function revalidateTag(tag, options) {
  const sfCallerCtx = getContext();
  if (options !== undefined) {
    console.warn(
      `⚠️ [Dinou] The second parameter (options) in revalidateTag("${tag}", ...) is deprecated and ignored since v9.0.3. Zero hydration mismatch is now guaranteed automatically via lazy index.html re-composition.`
    );
  }
  console.log(`[Revalidate] Starting on-demand revalidation for tag: "${tag}"...`);

  const storage = getStorageAdapter();
  if (isEdgeRuntime() || (storage && typeof storage.keys === "function")) {
    if (storage && typeof storage.keys === "function") {
      const isFsStorage = Boolean(storage && storage.baseDir);
      const targetPaths = new Map();
      const targetLayoutPaths = new Map();
      const targetSlotKeys = new Set();

      if (typeof storage.markTagInvalidatedAsync === "function") {
        await storage.markTagInvalidatedAsync(tag);
      } else if (typeof storage.markTagInvalidated === "function") {
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

      const readKeyOrFallback = async (k) =>
        (await storage.get(k)) || (await readEdgeStorageOrAsset(storage, k));

      // O(1) inverted tag index fast path (FileSystemStorage & non-disk-hydrated MemoryStorage)
      const indexedTargets =
        typeof storage.findTargetsByTag === "function"
          ? await storage.findTargetsByTag(tag)
          : null;

      if (indexedTargets) {
        if (indexedTargets.slotKeys) {
          for (const k of indexedTargets.slotKeys) targetSlotKeys.add(k);
        }
        if (indexedTargets.layoutPaths) {
          for (const [normPath, opts] of indexedTargets.layoutPaths.entries()) {
            const prev = targetLayoutPaths.get(normPath);
            targetLayoutPaths.set(normPath, {
              onlyRefreshSlots: prev
                ? prev.onlyRefreshSlots && opts.onlyRefreshSlots
                : opts.onlyRefreshSlots,
            });
          }
        }
        if (indexedTargets.pagePaths) {
          for (const [normPath, opts] of indexedTargets.pagePaths.entries()) {
            const prev = targetPaths.get(normPath);
            targetPaths.set(normPath, {
              onlyRefreshSlots: prev
                ? prev.onlyRefreshSlots && opts.onlyRefreshSlots
                : opts.onlyRefreshSlots,
            });
          }
        }
      } else {
        let listedMetaMap = null;
        const allKeysSet = new Set();
        if (typeof storage.listKeysWithMetadata === "function") {
          listedMetaMap = await storage.listKeysWithMetadata();
          if (listedMetaMap) {
            for (const k of listedMetaMap.keys()) {
              allKeysSet.add(k);
            }
          }
        }
        if (!listedMetaMap) {
          for (const k of await storage.keys()) {
            allKeysSet.add(k);
          }
        }
        if (!isFsStorage && storage.hydrateFromDisk !== false) {
          try {
            const dist2Folder = path.resolve(process.cwd(), ".dinou/dist2");
            if (existsSync(dist2Folder)) {
              const diskMetaFiles = await walkMetadataFiles(dist2Folder);
              await runBoundedConcurrency(diskMetaFiles, TAG_SCAN_CONCURRENCY, async (diskMeta) => {
                const relKey = path
                  .relative(dist2Folder, diskMeta)
                  .replace(/\\/g, "/");
                const deleted =
                  typeof storage.isKeyDeleted === "function"
                    ? await storage.isKeyDeleted(relKey)
                    : typeof storage.isDeleted === "function" &&
                      storage.isDeleted(relKey);
                if (!deleted) {
                  allKeysSet.add(relKey);
                }
              });
            }
          } catch (e) {}
        }

        const classifyWithMeta = (key, kind, meta) => {
          if (kind === "slot") {
            const slotIdMatch = key.match(/^slots\/([^/]+)\//);
            const matchedSlotId = meta?.slotId || slotIdMatch?.[1];
            const matchesSlotId = Boolean(matchedSlotId && matchedSlotId === tag);
            const matchesSlotTag = Boolean(
              meta && Array.isArray(meta.tags) && meta.tags.includes(tag)
            );
            if (matchesSlotId || matchesSlotTag) {
              targetSlotKeys.add(key);
              if (key.endsWith("/slot.metadata.json")) {
                targetSlotKeys.add(key.slice(0, -"/slot.metadata.json".length) + "/slot.json");
              } else if (key.endsWith("/slot.json")) {
                targetSlotKeys.add(key.slice(0, -"/slot.json".length) + "/slot.metadata.json");
              }
            }
            return;
          }
          const hasRouteTag = Boolean(meta && Array.isArray(meta.tags) && meta.tags.includes(tag));
          const hasSlotTag = Boolean(
            meta &&
              ((Array.isArray(meta.slotTags) && meta.slotTags.includes(tag)) ||
                (Array.isArray(meta.ownSlotTags) && meta.ownSlotTags.includes(tag)))
          );
          if (!hasRouteTag && !hasSlotTag) return;

          if (kind === "layout") {
            const cleanKey = key
              .replace(/\/(?:layout\.metadata\.json|layout\.rsc)$/, "")
              .replace(/^(?:layout\.metadata\.json|layout\.rsc)$/, "");
            const normPath = cleanKey ? (cleanKey.startsWith("/") ? cleanKey : "/" + cleanKey) : "/";
            const prev = targetLayoutPaths.get(normPath);
            targetLayoutPaths.set(normPath, {
              onlyRefreshSlots: prev ? prev.onlyRefreshSlots && !hasRouteTag : !hasRouteTag && hasSlotTag,
            });
            return;
          }

          const cleanKey = key
            .replace(/\/(?:metadata\.json|index\.html|shell\.html)$/, "")
            .replace(/^(?:metadata\.json|index\.html|shell\.html)$/, "");
          if (cleanKey.startsWith("slots/") || cleanKey.endsWith("layout.rsc") || cleanKey.endsWith("layout.metadata.json")) {
            return;
          }
          const normPath = cleanKey ? (cleanKey.startsWith("/") ? cleanKey : "/" + cleanKey) : "/";
          const prev = targetPaths.get(normPath);
          targetPaths.set(normPath, {
            onlyRefreshSlots: prev ? prev.onlyRefreshSlots && !hasRouteTag : !hasRouteTag && hasSlotTag,
          });
        };

        const keysNeedingFetch = [];
        for (const rawKey of allKeysSet) {
          const key = String(rawKey || "").replace(/\\/g, "/");
          let kind = null;
          let storageOnly = false;
          if (key.endsWith("/slot.metadata.json") || (!isFsStorage && (key.startsWith("slots/") || key.endsWith("/slot.json")))) {
            kind = "slot";
          } else if (key.endsWith("layout.metadata.json") || (!isFsStorage && key.endsWith("layout.rsc"))) {
            kind = "layout";
          } else if (key.endsWith("metadata.json")) {
            kind = "page";
          } else if (!isFsStorage && (key.endsWith("index.html") || key.endsWith("shell.html"))) {
            kind = "page";
            storageOnly = true;
          }
          if (!kind) continue;

          // Cloudflare KV fast path: classify directly from kv.list() inline metadata with 0 kv.get() calls!
          if (listedMetaMap && listedMetaMap.has(rawKey)) {
            const inlineMeta = listedMetaMap.get(rawKey);
            if (inlineMeta && typeof inlineMeta === "object") {
              classifyWithMeta(key, kind, inlineMeta);
              continue;
            }
            // If inline metadata overflowed (>1024B) and its companion *.metadata.json is also listed,
            // skip reading the bulky payload key (index.html / shell.html / layout.rsc / slot.json).
            if (kind === "page" && (key.endsWith("index.html") || key.endsWith("shell.html"))) {
              const compMeta = key.replace(/(?:index|shell)\.html$/, "metadata.json");
              if (allKeysSet.has(compMeta)) continue;
            } else if (kind === "layout" && key.endsWith("layout.rsc")) {
              const compMeta = key.replace(/layout\.rsc$/, "layout.metadata.json");
              if (allKeysSet.has(compMeta)) continue;
            } else if (kind === "slot" && key.endsWith("/slot.json")) {
              const compMeta = key.replace(/\/slot\.json$/, "/slot.metadata.json");
              if (allKeysSet.has(compMeta)) continue;
            }
          }

          keysNeedingFetch.push({ key, kind, storageOnly });
        }

        await runBoundedConcurrency(keysNeedingFetch, TAG_SCAN_CONCURRENCY, async ({ key, kind, storageOnly }) => {
          try {
            const item = storageOnly ? await storage.get(key) : await readKeyOrFallback(key);
            let meta = item?.metadata;
            if (!meta && !storageOnly && item?.content) {
              try {
                meta = JSON.parse(item.content);
              } catch (e) {}
            }
            classifyWithMeta(key, kind, meta);
          } catch (e) {}
        });
      }

      // 0. Snapshot invalidated slot artifacts before deletion so if slot regeneration throws during
      // static host revalidation, we can restore last-known-good slot.json without losing fallback cache.
      const failedSlotSet = (globalThis[Symbol.for("dinou.slot.failed.renders")] ||= new Set());
      const slotBackups = new Map();
      const affectedSlotIds = new Set();
      for (const k of targetSlotKeys) {
        const m = String(k || "").match(/^slots\/([^/]+)\//);
        if (m) affectedSlotIds.add(m[1]);
      }
      for (const sid of affectedSlotIds) {
        failedSlotSet.delete(sid);
        try {
          const prevJson = await readKeyOrFallback(`slots/${sid}/slot.json`);
          if (prevJson && prevJson.content) {
            let prevMeta =
              prevJson.metadata && typeof prevJson.metadata === "object"
                ? { ...prevJson.metadata }
                : null;
            if (!prevMeta || !Array.isArray(prevMeta.tags)) {
              try {
                const prevMetaItem = await readKeyOrFallback(`slots/${sid}/slot.metadata.json`);
                let parsedMeta =
                  prevMetaItem?.metadata && typeof prevMetaItem.metadata === "object"
                    ? prevMetaItem.metadata
                    : null;
                if (!parsedMeta && prevMetaItem?.content) {
                  parsedMeta = JSON.parse(prevMetaItem.content);
                }
                if (parsedMeta && typeof parsedMeta === "object") {
                  prevMeta = { ...(prevMeta || {}), ...parsedMeta };
                }
              } catch (e) {}
            }
            if (!prevMeta) {
              prevMeta = { slotId: sid };
            } else if (!prevMeta.slotId) {
              prevMeta.slotId = sid;
            }
            slotBackups.set(sid, { content: prevJson.content, metadata: prevMeta });
          }
        } catch (e) {}
      }

      // 1. Delete invalidated slot artifacts first so subsequent layout/page revalidations re-render the fresh slot
      await Promise.all(Array.from(targetSlotKeys).map((k) => storage.delete(k)));

      // 2. Revalidate affected layouts strictly ancestor-first (sequentially!) so parent shells,
      //    slots, and timestamps always commit before descendants — including on Cloudflare Workers
      //    where enqueueRevalidation does not serialize across concurrent Promise.all tasks.
      const sortedTargetLayouts = Array.from(targetLayoutPaths.entries()).sort(([a], [b]) =>
        compareLayoutPathsAncestorFirst(a, b)
      );
      for (const [p, opts] of sortedTargetLayouts) {
        if (!opts?.onlyRefreshSlots) {
          recordClientRevalidationHint("layout", p, sfCallerCtx);
        }
        await revalidateLayout(p, opts);
      }

      // 3. Revalidate affected pages sequentially (without deleting metadata.json!)
      for (const [p, opts] of targetPaths.entries()) {
        if (!opts?.onlyRefreshSlots) {
          recordClientRevalidationHint("page", p, sfCallerCtx);
        }
        await revalidatePage(p, opts);
      }

      if (
        sortedTargetLayouts.length === 0 &&
        targetPaths.size === 0 &&
        targetSlotKeys.size === 0
      ) {
        recordClientRevalidationHint("allPages", true, sfCallerCtx);
      }

      // 4. Restore last-known-good slot cache (BOTH slot.json AND full slot.metadata.json)
      //    ONLY for slots whose regeneration threw an error
      for (const [sid, backup] of slotBackups.entries()) {
        if (!failedSlotSet.has(sid)) continue;
        failedSlotSet.delete(sid);
        try {
          const existing = await storage.get(`slots/${sid}/slot.json`);
          if (!existing || !existing.content) {
            const restoredMeta = backup.metadata || { slotId: sid };
            await storage.set(`slots/${sid}/slot.json`, backup.content, restoredMeta);
            try {
              await storage.set(`slots/${sid}/slot.metadata.json`, JSON.stringify(restoredMeta));
            } catch (e) {}
          }
        } catch (e) {}
      }
    }
    return;
  }

  if (storage) {
    if (typeof storage.markTagInvalidatedAsync === "function") {
      await storage.markTagInvalidatedAsync(tag);
    } else if (typeof storage.markTagInvalidated === "function") {
      storage.markTagInvalidated(tag);
    }
  }
  globalThis[Symbol.for("dinou.slot.recent.fresh")]?.clear?.();

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
      const isSlotMeta = path.basename(fileOfMeta) === "slot.metadata.json";
      const hasSlotIdMatch =
        isSlotMeta &&
        (metadata?.slotId === tag || path.basename(path.dirname(fileOfMeta)) === tag);
      const hasRouteTag = Boolean(metadata && Array.isArray(metadata.tags) && metadata.tags.includes(tag));
      const hasSlotTag = Boolean(
        metadata &&
          ((Array.isArray(metadata.slotTags) && metadata.slotTags.includes(tag)) ||
            (Array.isArray(metadata.ownSlotTags) && metadata.ownSlotTags.includes(tag)))
      );
      if (hasSlotIdMatch || hasRouteTag || hasSlotTag) {
        if (isSlotMeta) {
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
  targetLayoutPaths.sort((a, b) => compareLayoutPathsAncestorFirst(a.reqPath, b.reqPath));
  for (const { reqPath, onlyRefreshSlots } of targetLayoutPaths) {
    recordClientRevalidationHint("layout", reqPath, sfCallerCtx);
    await revalidateLayout(reqPath, { onlyRefreshSlots });
  }
  for (const { reqPath, onlyRefreshSlots } of targetPagePaths) {
    recordClientRevalidationHint("page", reqPath, sfCallerCtx);
    await revalidatePage(reqPath, { onlyRefreshSlots });
  }
  if (targetLayoutPaths.length === 0 && targetPagePaths.length === 0) {
    recordClientRevalidationHint("allPages", true, sfCallerCtx);
  }
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
