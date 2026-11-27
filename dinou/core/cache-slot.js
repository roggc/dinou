// dinou/core/cache-slot.js
// Primitive for Vertical Segmentation (Micro-ISR) in React Server Components.
// Caches and invalidates component sub-trees inside pages using revalidate & revalidateTag.

import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import React from "react";
import {
  getStorageAdapter,
  FileSystemStorage,
  readDist2Fallback,
} from "./storage-adapter.js";
import { asyncRenderJSXToClientJSX } from "./render-jsx-to-client-jsx.js";
import { DinouCacheSlotBoundary as RawDinouCacheSlotBoundary } from "./slot.js";
import {
  getContext,
  requestStorage,
  copyCustomContextProperties,
} from "./request-context.js";
import { createBailoutProxy, unwrapBailoutProxy } from "./bailout-proxy.js";
import { getJSX } from "./get-jsx.js";
import { getErrorJSX } from "./get-error-jsx.js";
import { getActiveLayoutChain } from "./layout-functions.js";
import {
  isPprBuildActive,
  isInsideSuspense,
  isInsideOuterSuspenseOutsideSlot,
  isInsideRuntimeSuspenseOutsideSlot,
  deferPprSuspenseEffect,
  runWithPprContext,
  isInsideLayoutSegment,
  isInsidePageSegment,
  markDynamicAccess,
  runInCachedSlot,
  runInSlotDiscovery,
  isSlotDiscoveryActive,
} from "./ppr-context.js";
import { createRequire } from "node:module";
import { fetchCloudflareDist2Asset } from "./static-assets.js";

let require = null;
let currentDir = ".";
try {
  require = createRequire(import.meta.url);
  currentDir = path.dirname(fileURLToPath(import.meta.url));
} catch (e) {}

const INFLIGHT_KEY = Symbol.for("dinou.slot.inflight.renders");
if (!globalThis[INFLIGHT_KEY]) {
  globalThis[INFLIGHT_KEY] = new Map();
}
const inflightSlotRenders = globalThis[INFLIGHT_KEY];

const SLOT_GEN_KEY = Symbol.for("dinou.slot.render.generation");
if (!globalThis[SLOT_GEN_KEY]) {
  globalThis[SLOT_GEN_KEY] = new Map();
}
const slotRenderGenerations = globalThis[SLOT_GEN_KEY];

const RECENT_FRESH_KEY = Symbol.for("dinou.slot.recent.fresh");
if (!globalThis[RECENT_FRESH_KEY]) {
  globalThis[RECENT_FRESH_KEY] = new Map();
}
const recentFreshSlotRenders = globalThis[RECENT_FRESH_KEY];

const REVAL_QUEUE_STORAGE_KEY = Symbol.for("dinou.reval.queue.storage");
function isRevalidationActive() {
  return Boolean(globalThis[REVAL_QUEUE_STORAGE_KEY]?.getStore());
}

const BG_REVAL_KEY = Symbol.for("dinou.slot.background.revalidations");
if (!globalThis[BG_REVAL_KEY]) {
  globalThis[BG_REVAL_KEY] = new Set();
}
const backgroundRevalidations = globalThis[BG_REVAL_KEY];

const SLOT_REGISTRY_KEY = Symbol.for("dinou.slot.registry");
if (!globalThis[SLOT_REGISTRY_KEY]) {
  globalThis[SLOT_REGISTRY_KEY] = new Map();
}
const slotRegistry = globalThis[SLOT_REGISTRY_KEY];

const DISCOVERING_SLOTS_KEY = Symbol.for("dinou.slot.discovering");
if (!globalThis[DISCOVERING_SLOTS_KEY]) {
  globalThis[DISCOVERING_SLOTS_KEY] = new Set();
}
const discoveringSlots = globalThis[DISCOVERING_SLOTS_KEY];

const PRE_EVAL_ROUTES_KEY = Symbol.for("dinou.slot.preeval.routes");
if (!globalThis[PRE_EVAL_ROUTES_KEY] || !(globalThis[PRE_EVAL_ROUTES_KEY] instanceof Map)) {
  globalThis[PRE_EVAL_ROUTES_KEY] = new Map();
}
const preEvaluatingRoutes = globalThis[PRE_EVAL_ROUTES_KEY];

function normalizeSlotRouteKey(rawPath) {
  if (typeof rawPath !== "string" || rawPath.trim() === "") return null;
  const clean = rawPath.split("?")[0].split("#")[0].replace(/\\/g, "/");
  if (
    clean.includes("____rsc_") ||
    clean.includes("____server_function____")
  ) {
    return null;
  }
  return clean
    .split("/")
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch (e) {
        return s;
      }
    })
    .join("/");
}

function doesSlotEntryMatchRoute(entry, targetRouteKey) {
  if (targetRouteKey === null || targetRouteKey === undefined) return true;
  const keys = entry?.routeKeys;
  if (!(keys instanceof Set) || keys.size === 0) return true;
  if (targetRouteKey === "") return true;
  for (const k of keys) {
    if (
      k === "" ||
      k === targetRouteKey ||
      targetRouteKey.startsWith(k + "/") ||
      k.startsWith(targetRouteKey + "/")
    ) {
      return true;
    }
  }
  return false;
}

function isCloudflareWorkersRuntime() {
  return (
    typeof navigator !== "undefined" &&
    navigator.userAgent === "Cloudflare-Workers"
  );
}

function createDiscoveryContext(currentPath) {
  const outerCtx = getContext();
  const rawQuery = unwrapBailoutProxy(outerCtx?.req?.query);
  const rawCookies = unwrapBailoutProxy(outerCtx?.req?.cookies);
  const rawHeaders = unwrapBailoutProxy(outerCtx?.req?.headers);
  const activeEnv =
    outerCtx?.env ||
    outerCtx?.platformContext?.env ||
    outerCtx?.req?.env ||
    (typeof globalThis !== "undefined" ? globalThis.__DINOU_ENV__ : undefined) ||
    {};
  let reqPath =
    typeof currentPath === "string" && currentPath
      ? currentPath.split("?")[0]
      : outerCtx?.req?.path || "/";
  if (!reqPath.startsWith("/")) reqPath = "/" + reqPath;
  const discoveryCtx = {
    req: {
      query: createBailoutProxy(
        rawQuery && typeof rawQuery === "object" ? { ...rawQuery } : {},
        "req.query"
      ),
      cookies: createBailoutProxy(
        rawCookies && typeof rawCookies === "object" ? { ...rawCookies } : {},
        "req.cookies"
      ),
      headers: createBailoutProxy(
        rawHeaders && typeof rawHeaders === "object" ? { ...rawHeaders } : {},
        "req.headers"
      ),
      path: reqPath,
      url: reqPath,
      method: "GET",
      env: activeEnv,
    },
    res: {
      status() {},
      setHeader() {},
      cookie() {},
      clearCookie() {},
      redirect() {},
    },
    env: activeEnv,
    platformContext: outerCtx?.platformContext
      ? { ...outerCtx.platformContext, isSSG: false }
      : { env: activeEnv },
    _isStaticHtmlRender: Boolean(outerCtx?._isStaticHtmlRender),
    _isSlotDiscovery: true,
  };
  if (outerCtx && !outerCtx._isStaticHtmlRender) {
    copyCustomContextProperties(outerCtx, discoveryCtx);
  }
  return discoveryCtx;
}

let _registerServerRefFn = null;
function getRegisterServerReference() {
  if (_registerServerRefFn) return _registerServerRefFn;
  if (
    typeof globalThis !== "undefined" &&
    globalThis.__DINOU_EDGE_RENDERER__ &&
    typeof globalThis.__DINOU_EDGE_RENDERER__.registerServerReference === "function"
  ) {
    _registerServerRefFn = globalThis.__DINOU_EDGE_RENDERER__.registerServerReference;
    return _registerServerRefFn;
  }
  try {
    const pkg = require("react-server-dom-webpack/server");
    if (typeof pkg.registerServerReference === "function") {
      _registerServerRefFn = pkg.registerServerReference;
      return _registerServerRefFn;
    }
  } catch (e) {}
  try {
    const pkg = require("@roggc/react-server-dom-esm/server.node");
    if (typeof pkg.registerServerReference === "function") {
      _registerServerRefFn = pkg.registerServerReference;
      return _registerServerRefFn;
    }
  } catch (e) {}
  return null;
}

function resolveCacheSlotFileUrlFromManifest(exportName) {
  const manifest =
    typeof globalThis !== "undefined" ? globalThis.__DINOU_CLIENT_MANIFEST__ : null;
  if (manifest && typeof manifest === "object") {
    const suffix = `#${exportName}`;
    const preferredSuffix = `/slot.js${suffix}`;
    let fallbackKey = null;
    for (const key of Object.keys(manifest)) {
      if (key.endsWith(preferredSuffix)) {
        return key.slice(0, -suffix.length);
      }
      if (!fallbackKey && key.endsWith(suffix)) {
        fallbackKey = key;
      }
    }
    if (fallbackKey) {
      return fallbackKey.slice(0, -suffix.length);
    }
  }
  const slotPath = path.resolve(currentDir, "slot.js");
  return pathToFileURL(slotPath).href;
}

let _DinouCacheSlotBoundary = null;
function getCacheSlotBoundary() {
  if (!_DinouCacheSlotBoundary) {
    let DinouCacheSlotBoundary = RawDinouCacheSlotBoundary;
    if (
      typeof DinouCacheSlotBoundary === "function" &&
      DinouCacheSlotBoundary.$$typeof !== Symbol.for("react.client.reference")
    ) {
      const fileUrl = resolveCacheSlotFileUrlFromManifest("DinouCacheSlotBoundary");
      let regFn = null;
      if (
        typeof globalThis !== "undefined" &&
        globalThis.__DINOU_EDGE_RENDERER__ &&
        typeof globalThis.__DINOU_EDGE_RENDERER__.registerClientReference === "function"
      ) {
        regFn = globalThis.__DINOU_EDGE_RENDERER__.registerClientReference;
      }
      if (!regFn) {
        try {
          const pkg = require("react-server-dom-webpack/server");
          regFn = pkg.registerClientReference;
        } catch (e) {}
      }
      if (!regFn) {
        try {
          const pkg = require("@roggc/react-server-dom-esm/server.node");
          regFn = pkg.registerClientReference;
        } catch (e) {}
      }
      if (regFn) {
        DinouCacheSlotBoundary = regFn(
          DinouCacheSlotBoundary,
          fileUrl,
          "DinouCacheSlotBoundary"
        );
      } else {
        Object.defineProperties(DinouCacheSlotBoundary, {
          $$typeof: { value: Symbol.for("react.client.reference") },
          $$id: { value: fileUrl + "#DinouCacheSlotBoundary" },
        });
      }
    }
    _DinouCacheSlotBoundary = DinouCacheSlotBoundary;
  }
  return _DinouCacheSlotBoundary;
}

/**
 * Serializes a resolved JSX element tree into a JSON-safe string,
 * preserving symbols, React 19 transitional elements, client component references,
 * and server function references ("use server").
 */
function serializeJSX(jsx) {
  return JSON.stringify(jsx, (key, value) => {
    if (typeof value === "symbol") {
      return { __dinou_symbol__: Symbol.keyFor(value) || value.description };
    }
    if (
      (typeof value === "function" || typeof value === "object") &&
      value !== null &&
      value.$$typeof === Symbol.for("react.client.reference")
    ) {
      return {
        __dinou_client_ref__: true,
        id: value.$$id || value.name,
        name: value.name,
        async: value.$$async,
      };
    }
    if (
      (typeof value === "function" || typeof value === "object") &&
      value !== null &&
      value.$$typeof === Symbol.for("react.server.reference")
    ) {
      return {
        __dinou_server_ref__: true,
        id: value.$$id || value.name,
        bound: value.$$bound || null,
      };
    }
    if (
      value &&
      typeof value === "object" &&
      value.$$typeof === Symbol.for("react.transitional.element")
    ) {
      return {
        __dinou_element__: true,
        type: value.type,
        props: value.props,
        key: value.key,
      };
    }
    return value;
  });
}

/**
 * Deserializes a JSON string back into a genuine React 19 element tree.
 */
function deserializeJSX(json) {
  const parsed = JSON.parse(json, (key, value) => {
    if (value && typeof value === "object") {
      if (value.__dinou_symbol__) {
        return Symbol.for(value.__dinou_symbol__);
      }
      if (value.__dinou_client_ref__) {
        const fakeRef = function () {};
        Object.defineProperties(fakeRef, {
          $$typeof: { value: Symbol.for("react.client.reference") },
          $$id: { value: value.id },
          name: { value: value.name },
          $$async: { value: value.async },
        });
        return fakeRef;
      }
      if (value.__dinou_server_ref__) {
        let serverRef = function () {};
        const regServerRef = getRegisterServerReference();
        if (regServerRef) {
          try {
            const rawId = typeof value.id === "string" ? value.id : "";
            const hashIdx = rawId.lastIndexOf("#");
            if (hashIdx !== -1) {
              serverRef = regServerRef(
                serverRef,
                rawId.slice(0, hashIdx),
                rawId.slice(hashIdx + 1)
              );
            } else {
              serverRef = regServerRef(serverRef, rawId, null);
            }
            if (Array.isArray(value.bound) && typeof serverRef.bind === "function") {
              serverRef = serverRef.bind(null, ...value.bound);
            }
          } catch (e) {}
        }
        if (serverRef.$$typeof !== Symbol.for("react.server.reference")) {
          Object.defineProperties(serverRef, {
            $$typeof: { value: Symbol.for("react.server.reference") },
            $$id: { value: value.id },
            $$bound: { value: value.bound || null },
          });
        }
        return serverRef;
      }
    }
    return value;
  });

  function toReactElement(node) {
    if (node == null || typeof node !== "object") return node;
    if (Array.isArray(node)) return node.map(toReactElement);

    if (node.__dinou_element__) {
      const type = node.type;
      const props = {};
      if (node.props) {
        for (const [k, v] of Object.entries(node.props)) {
          if (k === "key") continue;
          props[k] = toReactElement(v);
        }
      }
      if (node.key != null) {
        props.key = node.key;
      }
      const children = props.children;
      let elem;
      if (Array.isArray(children)) {
        for (const ch of children) {
          if (ch && typeof ch === "object" && ch._store) {
            ch._store.validated = 1;
          }
        }
        delete props.children;
        elem = React.createElement(type, props, ...children);
      } else {
        elem = React.createElement(type, props);
      }
      if (elem && typeof elem === "object" && elem._store) {
        elem._store.validated = 1;
      }
      return elem;
    }
    return node;
  }

  return toReactElement(parsed);
}

function recordSlotTagsOnContext(
  tags,
  inLayout = isInsideLayoutSegment(),
  inPage = isInsidePageSegment()
) {
  if (!Array.isArray(tags) || tags.length === 0) return;
  try {
    const reqContext = getContext();
    if (reqContext) {
      if (!reqContext._slotTags) {
        reqContext._slotTags = new Set();
      }
      if (!reqContext._layoutSlotTags) {
        reqContext._layoutSlotTags = new Set();
      }
      if (!reqContext._pageSlotTags) {
        reqContext._pageSlotTags = new Set();
      }
      for (const t of tags) {
        if (!t) continue;
        reqContext._slotTags.add(t);
        if (inPage) {
          reqContext._pageSlotTags.add(t);
        } else if (inLayout) {
          reqContext._layoutSlotTags.add(t);
        } else if (!reqContext._layoutSlotTags.has(t)) {
          reqContext._pageSlotTags.add(t);
        }
      }
    }
  } catch (e) {}
}

function commitSlotTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return;
  const inLayout = isInsideLayoutSegment();
  const inPage = isInsidePageSegment();
  if (!deferPprSuspenseEffect(() => recordSlotTagsOnContext(tags, inLayout, inPage))) {
    recordSlotTagsOnContext(tags, inLayout, inPage);
  }
}

/**
 * Reads a slot entry from storage, falling back to pre-rendered Edge static assets (env.ASSETS)
 * when the runtime KV/Memory storage has not yet hydrated the build-time slot artifact.
 */
async function getSlotFromStorage(storage, storageKey, knownTags = []) {
  if (!storage) return null;
  let cached = null;
  try {
    cached = await storage.get(storageKey);
  } catch (err) {}
  if (cached && cached.content) {
    return cached;
  }

  const isDeleted =
    typeof storage.isKeyDeleted === "function"
      ? await storage.isKeyDeleted(storageKey)
      : typeof storage.isDeleted === "function" && storage.isDeleted(storageKey);
  if (isDeleted) {
    return null;
  }

  const cleanKeyForSlotId = String(storageKey || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
  const slotIdFromKey = cleanKeyForSlotId.match(/^slots\/([^/]+)\//)?.[1];

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
      const cleanKey = cleanKeyForSlotId;
      const metaKey = cleanKey.endsWith("/slot.json")
        ? cleanKey.slice(0, -"/slot.json".length) + "/slot.metadata.json"
        : `${cleanKey}.metadata.json`;
      const [slotRes, metaRes] = await Promise.all([
        fetchCloudflareDist2Asset(assets, cleanKey),
        fetchCloudflareDist2Asset(assets, metaKey),
      ]);
      if (slotRes && slotRes.status === 200) {
        const ct = slotRes.headers?.get?.("content-type") || "";
        const content = await slotRes.text();
        if (!ct.includes("text/html") && !content.trimStart().startsWith("<")) {
          let metadata = null;
          if (metaRes && metaRes.status === 200) {
            try {
              metadata = await metaRes.json();
            } catch (e) {}
          }
          const generatedAt = metadata?.generatedAt || 0;
          const combinedTags = new Set([
            ...(Array.isArray(metadata?.tags) ? metadata.tags : []),
            ...(metadata?.slotId ? [metadata.slotId] : []),
            ...(slotIdFromKey ? [slotIdFromKey] : []),
            ...(Array.isArray(knownTags) ? knownTags : []),
          ]);
          const combinedTagList = Array.from(combinedTags).filter(Boolean);
          if (combinedTagList.length > 0) {
            const invTimestamps = await Promise.all(
              combinedTagList.map((t) =>
                typeof storage.getTagInvalidatedAtAsync === "function"
                  ? storage.getTagInvalidatedAtAsync(t)
                  : typeof storage.getTagInvalidatedAt === "function"
                  ? storage.getTagInvalidatedAt(t)
                  : 0
              )
            );
            if (invTimestamps.some((invAt) => invAt > 0 && invAt >= generatedAt)) {
              return null;
            }
          }
          cached = { content, metadata };
          await storage.set(cleanKey, content, metadata);
          return cached;
        }
      }
    }
  } catch (e) {}

  const fallbackKnownTags = slotIdFromKey
    ? Array.from(
        new Set([
          ...(Array.isArray(knownTags) ? knownTags : []),
          slotIdFromKey,
        ])
      )
    : knownTags;
  const dist2Item = await readDist2Fallback(storage, storageKey, fallbackKnownTags);
  if (dist2Item && dist2Item.content) {
    return dist2Item;
  }

  return cached;
}

async function readMetaFromStorageOrAssets(storage, key) {
  if (!storage || !key) return null;
  try {
    const item = await storage.get(key);
    if (item?.metadata && typeof item.metadata === "object") return item.metadata;
    if (item?.content) return JSON.parse(item.content);
  } catch (e) {}
  const isDeleted =
    typeof storage.isKeyDeleted === "function"
      ? await storage.isKeyDeleted(key)
      : typeof storage.isDeleted === "function" && storage.isDeleted(key);
  if (isDeleted) return null;
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
        const text = await res.text();
        if (text && text.trimStart().startsWith("{")) {
          const parsed = JSON.parse(text);
          await storage.set(cleanKey, text);
          return parsed;
        }
      }
    }
  } catch (e) {}
  const dist2Item = await readDist2Fallback(storage, key);
  if (dist2Item) {
    if (dist2Item.metadata && typeof dist2Item.metadata === "object") {
      return dist2Item.metadata;
    }
    if (dist2Item.content && dist2Item.content.trimStart().startsWith("{")) {
      try {
        return JSON.parse(dist2Item.content);
      } catch (e) {}
    }
  }
  return null;
}

/**
 * Traverses a deserialized JSX tree from a cached outer slot and refreshes
 * any nested <DinouCacheSlot> boundaries so inner slot invalidations are
 * respected even when the outer slot hits its cache.
 */
async function refreshNestedSlotsInTree(node, currentSlotId, options = {}) {
  if (node == null || typeof node !== "object") return node;
  if (isSlotDiscoveryActive()) return node;

  if (Array.isArray(node)) {
    return Promise.all(
      node.map((item) => refreshNestedSlotsInTree(item, currentSlotId, options))
    );
  }

  if (node.$$typeof === Symbol.for("react.transitional.element")) {
    const nestedSlotId = node.props && node.props.__dinou_slot__;
    if (nestedSlotId && nestedSlotId !== currentSlotId) {
      const nestedTags = Array.isArray(node.props.tags) ? node.props.tags : [];
      commitSlotTags(Array.from(new Set([nestedSlotId, ...nestedTags].filter(Boolean))));
      if (!slotRegistry.has(nestedSlotId) && slotRegistry.has(currentSlotId)) {
        const parentEntry = slotRegistry.get(currentSlotId);
        if (parentEntry && typeof parentEntry.discover === "function") {
          await parentEntry.discover();
        }
      }
      let currentPath = options.currentPath;
      if (!currentPath) {
        try {
          currentPath = getContext()?.req?.path;
        } catch (e) {}
      }
      const nestedOptions = {
        ...options,
        fresh: false,
        currentPath,
        skipHostRevalidate: true,
      };
      const freshInner = await getSlotJSX(nestedSlotId, nestedOptions);
      if (freshInner !== null) {
        const refreshedInner = await refreshNestedSlotsInTree(
          freshInner,
          nestedSlotId,
          nestedOptions
        );
        const newProps = { ...node.props };
        if (node.key != null) newProps.key = node.key;
        delete newProps.children;
        return React.createElement(node.type, newProps, refreshedInner);
      }
    }

    if (node.props && typeof node.props === "object") {
      let changed = false;
      const newProps = { ...node.props };
      for (const [k, v] of Object.entries(node.props)) {
        if (v && typeof v === "object") {
          const updated = await refreshNestedSlotsInTree(v, currentSlotId, options);
          if (updated !== v) {
            newProps[k] = updated;
            changed = true;
          }
        }
      }
      if (changed) {
        if (node.key != null) newProps.key = node.key;
        const children = newProps.children;
        if (Array.isArray(children)) {
          delete newProps.children;
          return React.createElement(node.type, newProps, ...children);
        }
        return React.createElement(node.type, newProps);
      }
    }
  }

  return node;
}

async function DinouDeferredSlotStream({ promise }) {
  const [res] = await Promise.all([
    promise,
    new Promise((r) => setTimeout(r, 0)),
  ]);
  return res;
}
DinouDeferredSlotStream.$$dinouDeferredSuspenseStream = true;

/**
 * DinouCacheSlot component.
 *
 * @param {object} props
 * @param {string} [props.id] Unique slot identifier
 * @param {string} [props.tag] Cache tag for granular revalidateTag invalidation
 * @param {string[]} [props.tags] Array of cache tags
 * @param {number} [props.revalidate] Revalidation TTL in seconds (0 = no-cache, >0 = ISR)
 * @param {React.ReactNode | Function} props.children Child component(s)
 */
async function DinouCacheSlot(props) {
  const { id, tag, tags, revalidate, children } = props || {};
  const isNoCache = typeof revalidate === "number" && revalidate < 1;
  const reqCtxInitial = getContext();
  const rawQueryInitial = unwrapBailoutProxy(reqCtxInitial?.req?.query);
  const shouldStreamSlotInSuspense =
    isInsideRuntimeSuspenseOutsideSlot() &&
    !isPprBuildActive() &&
    !reqCtxInitial?.platformContext?.isSSG &&
    !isRevalidationActive() &&
    !isSlotDiscoveryActive() &&
    !reqCtxInitial?._isPprRuntimeResume &&
    (Boolean(reqCtxInitial?._dynamicState?.value) ||
      isNoCache ||
      Object.keys(rawQueryInitial || {}).length > 0 ||
      process.env.DINOU_DEV === "true" ||
      process.env.NODE_ENV !== "production");

  const slotId = id || tag || (Array.isArray(tags) ? tags[0] : null);
  if (!slotId) {
    if (isNoCache && !isSlotDiscoveryActive()) {
      if (isPprBuildActive() && isInsideOuterSuspenseOutsideSlot()) {
        markDynamicAccess("slot-revalidate-0");
      } else {
        try {
          getContext()?._markDynamic?.();
        } catch (e) {}
      }
    }
    const runScope = isNoCache ? (fn) => fn() : runInCachedSlot;
    const computeAnon = () =>
      runScope(async () => {
        const childElement = typeof children === "function" ? await children() : children;
        return await asyncRenderJSXToClientJSX(childElement);
      });
    if (shouldStreamSlotInSuspense) {
      const anonPromise = computeAnon();
      anonPromise.catch(() => {});
      return React.createElement(DinouDeferredSlotStream, { promise: anonPromise });
    }
    return await computeAnon();
  }

  const allTags = Array.from(
    new Set(
      [...(tag ? [tag] : []), ...(Array.isArray(tags) ? tags : [])].filter(
        Boolean
      )
    )
  );
  const slotTagsToCommit = Array.from(new Set([slotId, ...allTags].filter(Boolean)));

  const storageKey = `slots/${slotId}/slot.json`;
  const storage = getStorageAdapter();
  const runSlotScope = (fn) =>
    runInCachedSlot(fn, { cached: !isNoCache, slotId });

  function wrapWithBoundary(content, alreadyRendered = false) {
    const Boundary = getCacheSlotBoundary();
    if (!Boundary) return content;
    const elem = React.createElement(
      Boundary,
      { id: slotId, tags: allTags, __dinou_slot__: slotId },
      content
    );
    if (alreadyRendered) {
      return Object.defineProperties(
        Object.create(Object.getPrototypeOf(elem)),
        {
          ...Object.getOwnPropertyDescriptors(elem),
          __clientJsxAlreadyRendered: {
            value: true,
            enumerable: false,
            configurable: true,
          },
        }
      );
    }
    return elem;
  }

  // Register in slotRegistry for on-demand endpoint re-rendering and nested slot discovery
  const prevSlotEntry = slotRegistry.get(slotId);
  const slotRouteKeys =
    prevSlotEntry?.routeKeys instanceof Set
      ? prevSlotEntry.routeKeys
      : new Set();
  const currentSlotRouteKey = normalizeSlotRouteKey(reqCtxInitial?.req?.path);
  if (currentSlotRouteKey !== null) {
    slotRouteKeys.add(currentSlotRouteKey);
  }
  slotRegistry.set(slotId, {
    render: async () => {
      return await runSlotScope(async () => {
        const childElement = typeof children === "function" ? await children() : children;
        return await asyncRenderJSXToClientJSX(childElement);
      });
    },
    discover: async (discoverPath) => {
      if (discoveringSlots.has(slotId)) return;
      discoveringSlots.add(slotId);
      try {
        const fallbackRoute =
          discoverPath ||
          (slotRouteKeys.size > 0
            ? "/" + Array.from(slotRouteKeys)[0]
            : undefined);
        await requestStorage.run(
          createDiscoveryContext(fallbackRoute),
          async () => {
            await runWithPprContext({ isPpr: true }, async () => {
              await runInSlotDiscovery(async () => {
                await runSlotScope(async () => {
                  const childElement =
                    typeof children === "function"
                      ? await children()
                      : children;
                  await asyncRenderJSXToClientJSX(childElement);
                });
              });
            });
          }
        );
      } catch (e) {
      } finally {
        discoveringSlots.delete(slotId);
      }
    },
    tags: allTags,
    revalidate: typeof revalidate === "number" ? revalidate : undefined,
    routeKeys: slotRouteKeys,
  });

  // When running inside a nested slot discovery pass, recursively discover any child slots
  // and short-circuit so discovery passes never overwrite storage cache with discovery renders.
  if (isSlotDiscoveryActive()) {
    if (!discoveringSlots.has(slotId)) {
      const ownEntry = slotRegistry.get(slotId);
      if (ownEntry && typeof ownEntry.discover === "function") {
        await ownEntry.discover();
      }
    }
    return null;
  }

  if (isNoCache && !isSlotDiscoveryActive()) {
    if (isPprBuildActive() && isInsideOuterSuspenseOutsideSlot()) {
      markDynamicAccess("slot-revalidate-0");
    } else {
      try {
        getContext()?._markDynamic?.();
      } catch (e) {}
    }
  }

  if (!storage || isNoCache) {
    if (shouldStreamSlotInSuspense) {
      commitSlotTags(slotTagsToCommit);
      const noCacheStreamPromise = (async () => {
        const directContent = await runSlotScope(async () => {
          const childElement = typeof children === "function" ? await children() : children;
          return await asyncRenderJSXToClientJSX(childElement);
        });
        return await asyncRenderJSXToClientJSX(wrapWithBoundary(directContent, true));
      })();
      noCacheStreamPromise.catch(() => {});
      return React.createElement(DinouDeferredSlotStream, {
        promise: noCacheStreamPromise,
      });
    }
    const directContent = await runSlotScope(async () => {
      const childElement = typeof children === "function" ? await children() : children;
      return await asyncRenderJSXToClientJSX(childElement);
    });
    commitSlotTags(slotTagsToCommit);
    return wrapWithBoundary(directContent, true);
  }

  // 1. Check if cached in storage
  let cached = await getSlotFromStorage(storage, storageKey, slotTagsToCommit);

  // During a PPR static shell build, if a slot is inside a <Suspense> boundary
  // and was only cached at runtime (not part of the static shell), do not short-circuit
  // from disk so any dynamic request access (cookies/headers/query) inside the slot still
  // triggers PPR postpone.
  if (
    isPprBuildActive() &&
    isInsideOuterSuspenseOutsideSlot() &&
    cached &&
    !cached.metadata?.inStaticSuspense
  ) {
    cached = null;
  }

  const now = Date.now();
  if (cached && cached.content) {
    const meta = cached.metadata || {};
    const generatedAt = meta.generatedAt || 0;
    const revalidateSeconds =
      typeof revalidate === "number"
        ? revalidate
        : typeof meta.revalidate === "number"
        ? meta.revalidate
        : undefined;

    if (typeof revalidateSeconds === "number" && revalidateSeconds < 1) {
      if (!isSlotDiscoveryActive()) {
        if (isPprBuildActive() && isInsideOuterSuspenseOutsideSlot()) {
          markDynamicAccess("slot-revalidate-0");
        } else {
          try {
            getContext()?._markDynamic?.();
          } catch (e) {}
        }
      }
      if (shouldStreamSlotInSuspense) {
        commitSlotTags(slotTagsToCommit);
        const noCacheStreamPromise = (async () => {
          const directContent = await runSlotScope(async () => {
            const childElement = typeof children === "function" ? await children() : children;
            return await asyncRenderJSXToClientJSX(childElement);
          });
          return await asyncRenderJSXToClientJSX(wrapWithBoundary(directContent, true));
        })();
        noCacheStreamPromise.catch(() => {});
        return React.createElement(DinouDeferredSlotStream, {
          promise: noCacheStreamPromise,
        });
      }
      const directContent = await runSlotScope(async () => {
        const childElement = typeof children === "function" ? await children() : children;
        return await asyncRenderJSXToClientJSX(childElement);
      });
      commitSlotTags(slotTagsToCommit);
      return wrapWithBoundary(directContent, true);
    }

    const isExpired =
      typeof revalidateSeconds === "number" &&
      revalidateSeconds > 0 &&
      now > generatedAt + revalidateSeconds * 1000;

    const serveStaleWhileRevalidate =
      isExpired &&
      Boolean(meta.inStaticShell) &&
      !isRevalidationActive() &&
      !isPprBuildActive() &&
      !getContext()?.platformContext?.isSSG;

    if (
      serveStaleWhileRevalidate &&
      !getContext()?._isPprRuntimeResume &&
      !backgroundRevalidations.has(storageKey) &&
      !inflightSlotRenders.has(storageKey)
    ) {
      backgroundRevalidations.add(storageKey);
      const reqContext = getContext();
      const currentPath = reqContext?.req?.path;
      const bgPromise = (async () => {
        try {
          await getSlotJSX(slotId, { fresh: true, currentPath });
        } catch (e) {
          console.error(
            `[DinouCacheSlot] Background revalidation failed for slot "${slotId}":`,
            e
          );
        } finally {
          backgroundRevalidations.delete(storageKey);
        }
      })();
      const ctx = reqContext?.platformContext?.ctx;
      if (ctx && typeof ctx.waitUntil === "function") {
        ctx.waitUntil(bgPromise);
      }
    }

    if (!isExpired || serveStaleWhileRevalidate) {
      try {
        const restored = deserializeJSX(cached.content);
        const withRefreshedNested = await refreshNestedSlotsInTree(restored, slotId);
        commitSlotTags(slotTagsToCommit);
        return wrapWithBoundary(withRefreshedNested, false);
      } catch (err) {}
    }
  }

  // 2. Cache MISS or expired TTL: Deduplicate synchronous render
  if (inflightSlotRenders.has(storageKey)) {
    const existingPromise = inflightSlotRenders.get(storageKey);
    if (shouldStreamSlotInSuspense) {
      commitSlotTags(slotTagsToCommit);
      const dedupedStreamPromise = existingPromise.then(async (deduped) => {
        return await asyncRenderJSXToClientJSX(wrapWithBoundary(deduped, true));
      });
      dedupedStreamPromise.catch(() => {});
      return React.createElement(DinouDeferredSlotStream, {
        promise: dedupedStreamPromise,
      });
    }
    try {
      const deduped = await existingPromise;
      commitSlotTags(slotTagsToCommit);
      return wrapWithBoundary(deduped, !isPprBuildActive());
    } catch (e) {}
  }

  const inPprSuspense = isPprBuildActive() && isInsideOuterSuspenseOutsideSlot();
  const reqCtxForMeta = getContext();
  const isSlotEndpointReq = String(
    reqCtxForMeta?.req?.rawPath || reqCtxForMeta?.req?.path || ""
  ).includes("____rsc_slot____");
  const isPprShellBuild =
    !isSlotEndpointReq && !reqCtxForMeta?._isPprRuntimeResume;

  const renderPromise = (async () => {
    const resolved = await runInCachedSlot(
      async () => {
        const childElement = typeof children === "function" ? await children() : children;
        return await asyncRenderJSXToClientJSX(childElement);
      },
      { cached: true, slotId }
    );
    const serialized = serializeJSX(resolved);

    const slotMeta = {
      tags: allTags,
      revalidate: typeof revalidate === "number" ? revalidate : undefined,
      generatedAt: Date.now(),
      slotId,
      inStaticShell: Boolean(isPprShellBuild || cached?.metadata?.inStaticShell),
      inStaticSuspense: Boolean(inPprSuspense || cached?.metadata?.inStaticSuspense),
    };

    const persistSlot = async () => {
      try {
        await storage.set(storageKey, serialized, slotMeta);
        if (!storage.baseDir) {
          try {
            await storage.set(`slots/${slotId}/slot.metadata.json`, JSON.stringify(slotMeta));
          } catch (metaErr) {}
        }
      } catch (err) {
        console.error(`[DinouCacheSlot] Failed to write cache for slot "${slotId}":`, err);
      }
    };

    if (inPprSuspense) {
      if (!deferPprSuspenseEffect(persistSlot)) {
        await persistSlot();
      }
    } else {
      await persistSlot();
    }

    return deserializeJSX(serialized);
  })();

  inflightSlotRenders.set(storageKey, renderPromise);
  if (shouldStreamSlotInSuspense) {
    commitSlotTags(slotTagsToCommit);
    const streamPromise = (async () => {
      try {
        const fresh = await renderPromise;
        return await asyncRenderJSXToClientJSX(wrapWithBoundary(fresh, true));
      } finally {
        inflightSlotRenders.delete(storageKey);
      }
    })();
    streamPromise.catch(() => {});
    return React.createElement(DinouDeferredSlotStream, {
      promise: streamPromise,
    });
  }
  try {
    const fresh = await renderPromise;
    commitSlotTags(slotTagsToCommit);
    return wrapWithBoundary(fresh, true);
  } finally {
    inflightSlotRenders.delete(storageKey);
  }
}
DinouCacheSlot.$$dinouCacheSlot = true;

const DIST2_SLOTS_FS_KEY = Symbol.for("dinou.dist2.slots.fs.index");

function getDist2SlotsFs() {
  try {
    const cwdBase = path.resolve(process.cwd(), ".dinou/dist2");
    const existing = globalThis[DIST2_SLOTS_FS_KEY];
    if (existing && existing.baseDir === cwdBase) {
      return existing;
    }
    const created = new FileSystemStorage(cwdBase);
    globalThis[DIST2_SLOTS_FS_KEY] = created;
    return created;
  } catch (e) {
    return null;
  }
}

/**
 * Batch-resolves one or more slot IDs or tags to ALL matching canonical slotIds in a single pass.
 * Uses FileSystemStorage's O(1) mtime-validated tag index on disk storages (avoiding O(N*M) disk
 * scans per request) and deduplicated single-pass key inspection on distributed KV/Redis storages.
 */
async function resolveAllCanonicalSlotIdsBatch(rawTagsOrIds, storage) {
  const resultMap = new Map();
  const uniqueTags = [];
  const tagSet = new Set();
  for (const raw of rawTagsOrIds || []) {
    if (!raw || tagSet.has(raw)) continue;
    tagSet.add(raw);
    uniqueTags.push(raw);
    resultMap.set(raw, new Set());
  }
  if (uniqueTags.length === 0) return resultMap;

  // 1. In-memory slotRegistry check (O(registrySize) once for the entire batch)
  for (const tag of uniqueTags) {
    if (slotRegistry.has(tag)) {
      resultMap.get(tag).add(tag);
    }
  }
  for (const [regId, entry] of slotRegistry.entries()) {
    if (Array.isArray(entry.tags)) {
      for (const t of entry.tags) {
        if (tagSet.has(t)) {
          resultMap.get(t).add(regId);
        }
      }
    }
  }

  if (storage) {
    try {
      // 2. O(1) slot tag index for FileSystemStorage and MemoryStorage
      if (typeof storage.getSlotTagIndex === "function") {
        const idx = storage.getSlotTagIndex();
        for (const tag of uniqueTags) {
          const indexedIds = idx.get(tag);
          if (indexedIds) {
            const targetSet = resultMap.get(tag);
            for (const id of indexedIds) targetSet.add(id);
          }
        }
        if (!isCloudflareWorkersRuntime() && !storage.baseDir && storage.hydrateFromDisk !== false) {
          try {
            const dist2Fs = getDist2SlotsFs();
            if (dist2Fs && typeof dist2Fs.getSlotTagIndex === "function") {
              const dist2Index = dist2Fs.getSlotTagIndex();
              for (const tag of uniqueTags) {
                const indexedIds = dist2Index.get(tag);
                if (indexedIds) {
                  const targetSet = resultMap.get(tag);
                  for (const id of indexedIds) targetSet.add(id);
                }
              }
            }
          } catch (e) {}
        }
      } else {
        // 3. Distributed storages (Cloudflare KV, Redis, Deno KV):
        //    a) Merge read-only .dinou/dist2/slots fallback via cached O(1) disk index (skip on workerd)
        const isCfWorkers =
          typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
        if (!isCfWorkers && !storage.baseDir && storage.hydrateFromDisk !== false) {
          try {
            const dist2Fs = getDist2SlotsFs();
            if (dist2Fs && typeof dist2Fs.getSlotTagIndex === "function") {
              const dist2Index = dist2Fs.getSlotTagIndex();
              for (const tag of uniqueTags) {
                const indexedIds = dist2Index.get(tag);
                if (indexedIds) {
                  const targetSet = resultMap.get(tag);
                  for (const id of indexedIds) targetSet.add(id);
                }
              }
            }
          } catch (e) {}
        }
        //    b) Single-pass parallel inspection: reuse inline KV list() metadata when available
        //       to avoid N extra kv.get() roundtrips; fetch missing metadata in parallel via Promise.all
        const inlineEntries =
          typeof storage.listSlotMetadataEntries === "function"
            ? await storage.listSlotMetadataEntries()
            : null;
        if (inlineEntries) {
          const missingMetaEntries = [];
          for (const [slotDirId, entry] of inlineEntries.entries()) {
            if (tagSet.has(slotDirId)) {
              resultMap.get(slotDirId).add(slotDirId);
            }
            if (entry.metadata && Array.isArray(entry.metadata.tags)) {
              const canonicalId = entry.metadata.slotId || slotDirId;
              for (const t of entry.metadata.tags) {
                if (tagSet.has(t)) resultMap.get(t).add(canonicalId);
              }
            } else {
              missingMetaEntries.push(entry);
            }
          }
          if (missingMetaEntries.length > 0) {
            await Promise.all(
              missingMetaEntries.map(async ({ slotDirId, key }) => {
                const item =
                  (await storage.get(key)) || (await readDist2Fallback(storage, key));
                let meta = item?.metadata;
                if (!meta && key.endsWith("/slot.metadata.json") && item?.content) {
                  try {
                    meta = JSON.parse(item.content);
                  } catch (e) {}
                }
                if (meta && Array.isArray(meta.tags)) {
                  const canonicalId = meta.slotId || slotDirId;
                  for (const t of meta.tags) {
                    if (tagSet.has(t)) resultMap.get(t).add(canonicalId);
                  }
                }
              })
            );
          }
        } else {
          const preferredKeyBySlot = new Map();
          if (typeof storage.keys === "function") {
            const keys = await storage.keys("slots/");
            for (const rawKey of keys) {
              const key = String(rawKey || "").replace(/\\/g, "/");
              if (key.endsWith("/slot.metadata.json")) {
                const m = key.match(/^slots\/([^/]+)\//);
                if (m) preferredKeyBySlot.set(m[1], key);
              } else if (key.endsWith("/slot.json")) {
                const m = key.match(/^slots\/([^/]+)\//);
                if (m && !preferredKeyBySlot.has(m[1])) {
                  preferredKeyBySlot.set(m[1], key);
                }
              }
            }
          }
          for (const tag of uniqueTags) {
            if (preferredKeyBySlot.has(tag)) {
              resultMap.get(tag).add(tag);
            }
          }
          if (preferredKeyBySlot.size > 0) {
            await Promise.all(
              Array.from(preferredKeyBySlot.entries()).map(async ([slotDirId, key]) => {
                const item =
                  (await storage.get(key)) || (await readDist2Fallback(storage, key));
                let meta = item?.metadata;
                if (!meta && key.endsWith("/slot.metadata.json") && item?.content) {
                  try {
                    meta = JSON.parse(item.content);
                  } catch (e) {}
                }
                if (meta && Array.isArray(meta.tags)) {
                  const canonicalId = meta.slotId || slotDirId;
                  for (const t of meta.tags) {
                    if (tagSet.has(t)) {
                      resultMap.get(t).add(canonicalId);
                    }
                  }
                }
              })
            );
          }
          //    c) Direct lookup fallback when adapter does not implement storage.keys()
          if (typeof storage.keys !== "function") {
            await Promise.all(
              uniqueTags.map(async (tag) => {
                if (resultMap.get(tag).size === 0) {
                  const direct = await getSlotFromStorage(storage, `slots/${tag}/slot.json`);
                  if (direct && direct.content) {
                    resultMap.get(tag).add(tag);
                  }
                }
              })
            );
          }
        }
      }
    } catch (e) {}
  }

  return resultMap;
}

/**
 * Resolves a slot ID or tag to ALL matching canonical slotIds using slotRegistry and storage metadata.
 * Prevents multi-slot shared tags from being masked by the first matching slot.
 */
async function resolveAllCanonicalSlotIds(slotIdOrTag, storage) {
  if (!slotIdOrTag) return [];
  const batch = await resolveAllCanonicalSlotIdsBatch([slotIdOrTag], storage);
  const matched = batch.get(slotIdOrTag);
  return matched && matched.size > 0 ? Array.from(matched) : [slotIdOrTag];
}

/**
 * Resolves a slot ID or tag to its canonical slotId using slotRegistry or storage metadata.
 */
async function resolveCanonicalSlotId(slotIdOrTag, storage) {
  if (!slotIdOrTag) return slotIdOrTag;
  if (slotRegistry.has(slotIdOrTag)) {
    return slotIdOrTag;
  }
  for (const [regId, entry] of slotRegistry.entries()) {
    if (Array.isArray(entry.tags) && entry.tags.includes(slotIdOrTag)) {
      return regId;
    }
  }
  const all = await resolveAllCanonicalSlotIds(slotIdOrTag, storage);
  return all.length > 0 ? all[0] : slotIdOrTag;
}

/**
 * Resolves a slot's JSX tree for the granular /____rsc_slot____/:id endpoint.
 */
async function getSlotJSX(slotId, options = {}) {
  const storage = getStorageAdapter();
  let targetId = await resolveCanonicalSlotId(slotId, storage);
  let storageKey = `slots/${targetId}/slot.json`;

  const reqUrlEarly = String(options.req?.url || "");
  const qIdxEarly = reqUrlEarly.indexOf("?");
  const queryKeyEarly = qIdxEarly !== -1 ? reqUrlEarly.slice(qIdxEarly) : "";
  const hasHttpRequestEarly = Boolean(reqUrlEarly);
  const earlyStampedeKey = `${storageKey}::${queryKeyEarly}`;
  const earlyInflightKey = options.fresh ? earlyStampedeKey : storageKey;
  const regEntryEarly = slotRegistry.get(targetId);
  const isEarlyNoCache =
    typeof regEntryEarly?.revalidate === "number" && regEntryEarly.revalidate < 1;

  if (!isEarlyNoCache && inflightSlotRenders.has(earlyInflightKey)) {
    try {
      const deduped = await inflightSlotRenders.get(earlyInflightKey);
      return await refreshNestedSlotsInTree(deduped, targetId, options);
    } catch (e) {}
  }

  if (
    !isEarlyNoCache &&
    options.fresh &&
    hasHttpRequestEarly &&
    recentFreshSlotRenders.has(earlyStampedeKey)
  ) {
    const recent = recentFreshSlotRenders.get(earlyStampedeKey);
    if (recent && Date.now() - recent.timestamp < 500 && recent.serialized) {
      recent.timestamp = Date.now();
      const restored = deserializeJSX(recent.serialized);
      return await refreshNestedSlotsInTree(restored, targetId, options);
    }
    recentFreshSlotRenders.delete(earlyStampedeKey);
  }

  // 1. Check storage cache
  let cached = await getSlotFromStorage(storage, storageKey, [targetId]);

  const regEntryInitial = slotRegistry.get(targetId);
  const now = Date.now();
  if (cached && cached.content) {
    const meta = cached.metadata || {};
    const generatedAt = meta.generatedAt || 0;
    const revalidateSeconds =
      typeof regEntryInitial?.revalidate === "number"
        ? regEntryInitial.revalidate
        : typeof meta.revalidate === "number"
        ? meta.revalidate
        : undefined;

    const isNoCache = typeof revalidateSeconds === "number" && revalidateSeconds < 1;
    const isExpired =
      isNoCache ||
      (typeof revalidateSeconds === "number" &&
        revalidateSeconds >= 1 &&
        now > generatedAt + revalidateSeconds * 1000);

    const serveStaleWhileRevalidate =
      isExpired &&
      !isNoCache &&
      !options.fresh &&
      Boolean(options.skipHostRevalidate) &&
      Boolean(meta.inStaticShell) &&
      !getContext()?._isPprRuntimeResume &&
      !isRevalidationActive() &&
      !isPprBuildActive() &&
      !getContext()?.platformContext?.isSSG;

    if (
      serveStaleWhileRevalidate &&
      !backgroundRevalidations.has(storageKey) &&
      !inflightSlotRenders.has(storageKey)
    ) {
      backgroundRevalidations.add(storageKey);
      const reqContext = getContext();
      const bgCurrentPath = options.currentPath || reqContext?.req?.path;
      const bgPromise = (async () => {
        try {
          await getSlotJSX(targetId, { fresh: true, currentPath: bgCurrentPath });
        } catch (e) {
          console.error(
            `[getSlotJSX] Background revalidation failed for nested slot "${targetId}":`,
            e
          );
        } finally {
          backgroundRevalidations.delete(storageKey);
        }
      })();
      const ctx = reqContext?.platformContext?.ctx;
      if (ctx && typeof ctx.waitUntil === "function") {
        ctx.waitUntil(bgPromise);
      }
    }

    if ((!isExpired && !options.fresh) || serveStaleWhileRevalidate) {
      try {
        const restored = deserializeJSX(cached.content);
        return await refreshNestedSlotsInTree(restored, targetId, options);
      } catch (e) {}
    }
  }

  const attemptedDiscoveryKeys = new Set();
  async function discoverFromRegisteredSlots(filterRouteKey = undefined) {
    let progressed = true;
    while (!slotRegistry.has(targetId) && progressed) {
      progressed = false;
      for (const [regKey, entry] of Array.from(slotRegistry.entries())) {
        if (attemptedDiscoveryKeys.has(regKey)) continue;
        if (
          filterRouteKey !== undefined &&
          filterRouteKey !== null &&
          !doesSlotEntryMatchRoute(entry, filterRouteKey)
        ) {
          continue;
        }
        attemptedDiscoveryKeys.add(regKey);
        progressed = true;
        if (typeof entry.discover === "function") {
          await entry.discover(options.currentPath);
          targetId = await resolveCanonicalSlotId(slotId, storage);
          if (slotRegistry.has(targetId)) return;
        }
      }
    }
  }

  const cleanCurrentRouteKey = options.currentPath
    ? normalizeSlotRouteKey(options.currentPath)
    : null;

  // 2. First try discovering nested slots from already-registered outer slots matching this route
  if (!slotRegistry.has(targetId)) {
    await discoverFromRegisteredSlots(cleanCurrentRouteKey);
  }

  // 3. If still not in slotRegistry (e.g., cold server start), pre-evaluate the route once
  if (!slotRegistry.has(targetId) && options.currentPath) {
    const usePreEvalDedup = !isCloudflareWorkersRuntime();
    if (usePreEvalDedup && preEvaluatingRoutes.has(options.currentPath)) {
      try {
        await preEvaluatingRoutes.get(options.currentPath);
      } catch (e) {}
      targetId = await resolveCanonicalSlotId(slotId, storage);
    } else {
      const preEvalPromise = (async () => {
        try {
          const isNotFound = { value: false };
          await requestStorage.run(
            createDiscoveryContext(options.currentPath),
            async () => {
              await runWithPprContext({ isPpr: true }, async () => {
                await runInSlotDiscovery(async () => {
                  try {
                    const pageJsx = await getJSX(
                      options.currentPath,
                      {},
                      isNotFound,
                      false,
                      false,
                      {
                        segment: "page",
                      }
                    );
                    if (pageJsx) {
                      await asyncRenderJSXToClientJSX(pageJsx);
                    }
                    const resolvedId = await resolveCanonicalSlotId(
                      slotId,
                      storage
                    );

                    if (!slotRegistry.has(resolvedId)) {
                      const fullJsx = await getJSX(
                        options.currentPath,
                        {},
                        isNotFound,
                        false,
                        false
                      );
                      if (fullJsx) {
                        await asyncRenderJSXToClientJSX(fullJsx);
                      }
                    }
                  } catch (routeErr) {
                    // If the route itself throws an error (rendering error.tsx), discover
                    // any <DinouCacheSlot> mounted inside the route's error.tsx boundary!
                    try {
                      const errJsx = await getErrorJSX(
                        options.currentPath,
                        {},
                        {
                          message: routeErr?.message || "Error",
                          name: routeErr?.name || "Error",
                        },
                        false,
                        {}
                      );
                      if (errJsx) {
                        await asyncRenderJSXToClientJSX(errJsx);
                      }
                    } catch (_) {}
                  }
                });
              });
            }
          );
        } catch (e) {
          console.warn(
            `[getSlotJSX] Could not pre-evaluate route "${options.currentPath}" to register slot "${slotId}":`,
            e
          );
        } finally {
          if (usePreEvalDedup) {
            preEvaluatingRoutes.delete(options.currentPath);
          }
        }
      })();
      if (usePreEvalDedup) {
        preEvaluatingRoutes.set(options.currentPath, preEvalPromise);
      }
      await preEvalPromise;
      targetId = await resolveCanonicalSlotId(slotId, storage);
    }

    if (!slotRegistry.has(targetId)) {
      await discoverFromRegisteredSlots(cleanCurrentRouteKey);
    }
  }

  // 4. Final global fallback across any remaining registered slots if route-scoped lookup missed
  if (!slotRegistry.has(targetId)) {
    await discoverFromRegisteredSlots(null);
  }

  storageKey = `slots/${targetId}/slot.json`;

  if (slotRegistry.has(targetId)) {
    const entry = slotRegistry.get(targetId);
    const isEntryNoCache =
      typeof entry.revalidate === "number" && entry.revalidate < 1;
    const reqUrl = String(options.req?.url || "");
    const qIdx = reqUrl.indexOf("?");
    const queryKey = qIdx !== -1 ? reqUrl.slice(qIdx) : "";
    const hasHttpRequest = Boolean(reqUrl);
    const stampedeKey = `${storageKey}::${queryKey}`;
    const inflightKey = options.fresh ? stampedeKey : storageKey;
    try {
      if (!isEntryNoCache && inflightSlotRenders.has(inflightKey)) {
        const deduped = await inflightSlotRenders.get(inflightKey);
        return await refreshNestedSlotsInTree(deduped, targetId, options);
      }

      if (
        !isEntryNoCache &&
        options.fresh &&
        hasHttpRequest &&
        recentFreshSlotRenders.has(stampedeKey)
      ) {
        const recent = recentFreshSlotRenders.get(stampedeKey);
        if (recent && Date.now() - recent.timestamp < 500 && recent.serialized) {
          recent.timestamp = Date.now();
          const restored = deserializeJSX(recent.serialized);
          return await refreshNestedSlotsInTree(restored, targetId, options);
        }
        recentFreshSlotRenders.delete(stampedeKey);
      }

      const renderGen = (slotRenderGenerations.get(storageKey) || 0) + 1;
      slotRenderGenerations.set(storageKey, renderGen);
      const isLatestGen = () => slotRenderGenerations.get(storageKey) === renderGen;

      const renderPromise = (async () => {
        const resolved = await entry.render();
        const serialized = serializeJSX(resolved);
        if (!isEntryNoCache && options.fresh && hasHttpRequest && isLatestGen()) {
          recentFreshSlotRenders.set(stampedeKey, {
            timestamp: Date.now(),
            serialized,
          });
        }
        if (storage && !isEntryNoCache && isLatestGen()) {
          const revalStateRef =
            typeof globalThis !== "undefined"
              ? globalThis[Symbol.for("dinou.reval.queue.state")]
              : null;
          const nextSlotGenAt = Math.max(
            Date.now(),
            Number(cached?.metadata?.generatedAt || 0) + 1,
            Number(revalStateRef?.lastGenTime || 0) + 1
          );
          if (revalStateRef && nextSlotGenAt > (revalStateRef.lastGenTime || 0)) {
            revalStateRef.lastGenTime = nextSlotGenAt;
          }
          const freshSlotMeta = {
            tags: entry.tags,
            revalidate: entry.revalidate,
            generatedAt: nextSlotGenAt,
            slotId: targetId,
            inStaticShell: Boolean(cached?.metadata?.inStaticShell),
            inStaticSuspense: Boolean(cached?.metadata?.inStaticSuspense),
          };
          await storage.set(storageKey, serialized, freshSlotMeta);
          if (!storage.baseDir) {
            try {
              await storage.set(`slots/${targetId}/slot.metadata.json`, JSON.stringify(freshSlotMeta));
            } catch (metaErr) {}
          }
        }
        if (!isEntryNoCache && options.fresh && hasHttpRequest && isLatestGen()) {
          recentFreshSlotRenders.set(stampedeKey, {
            timestamp: Date.now(),
            serialized,
          });
        }
        return deserializeJSX(serialized);
      })();

      let restored;
      if (!isEntryNoCache) {
        inflightSlotRenders.set(inflightKey, renderPromise);
      }
      try {
        restored = await renderPromise;
      } finally {
        if (!isEntryNoCache) {
          inflightSlotRenders.delete(inflightKey);
        }
      }

      if (
        storage &&
        !isEntryNoCache &&
        !options.skipHostRevalidate &&
        options.currentPath &&
        isLatestGen()
      ) {
        try {
          const cleanRouteKey = String(options.currentPath)
            .split("?")[0]
            .split("#")[0]
            .split("/")
            .filter(Boolean)
            .map((s) => {
              try {
                return decodeURIComponent(s);
              } catch (e) {
                return s;
              }
            })
            .join("/");
          const slotTagsToMatch = new Set([
            targetId,
            slotId,
            ...(Array.isArray(entry.tags) ? entry.tags : []),
          ]);
          const segments = cleanRouteKey.split("/").filter(Boolean);
          const candidateLayoutKeySet = new Set([""]);
          try {
            const activeChain = getActiveLayoutChain(
              segments,
              {},
              path.resolve(process.cwd(), "src")
            );
            for (const entry of activeChain) {
              candidateLayoutKeySet.add(entry.cleanLayoutKey || "");
            }
          } catch (e) {}
          let acc = "";
          for (const seg of segments) {
            acc = acc ? `${acc}/${seg}` : seg;
            candidateLayoutKeySet.add(acc);
          }
          const sortedLayoutKeys = Array.from(candidateLayoutKeySet).sort((a, b) => {
            const depthA = a ? a.split("/").filter(Boolean).length : 0;
            const depthB = b ? b.split("/").filter(Boolean).length : 0;
            if (depthA !== depthB) return depthA - depthB;
            return a < b ? -1 : a > b ? 1 : 0;
          });
          for (const lKey of sortedLayoutKeys) {
            const lMetaKey = lKey ? `${lKey}/layout.metadata.json` : "layout.metadata.json";
            const lMeta = await readMetaFromStorageOrAssets(storage, lMetaKey);
            const lTags = Array.from(
              new Set([
                ...(Array.isArray(lMeta?.slotTags) ? lMeta.slotTags : []),
                ...(Array.isArray(lMeta?.ownSlotTags) ? lMeta.ownSlotTags : []),
              ])
            );
            if (lTags.some((t) => slotTagsToMatch.has(t))) {
              const { revalidateLayout } = await import("./cache-revalidate.js");
              await revalidateLayout(lKey ? "/" + lKey : "/", { onlyRefreshSlots: true });
            }
          }
          const metaKey = cleanRouteKey ? `${cleanRouteKey}/metadata.json` : "metadata.json";
          const pageMeta = await readMetaFromStorageOrAssets(storage, metaKey);
          if (
            pageMeta &&
            Array.isArray(pageMeta.slotTags) &&
            pageMeta.slotTags.some((t) => slotTagsToMatch.has(t))
          ) {
            const { revalidatePage } = await import("./cache-revalidate.js");
            await revalidatePage("/" + cleanRouteKey, { onlyRefreshSlots: true });
          }
        } catch (e) {}
      }

      return await refreshNestedSlotsInTree(restored, targetId, options);
    } catch (e) {
      try {
        const failedSet = (globalThis[Symbol.for("dinou.slot.failed.renders")] ||= new Set());
        failedSet.add(targetId);
      } catch (err) {}
      console.error(`[getSlotJSX] Failed to regenerate slot "${targetId}":`, e);
    }
  }

  // Fallback to cached content if regeneration failed
  if (cached && cached.content) {
    try {
      const restored = deserializeJSX(cached.content);
      return await refreshNestedSlotsInTree(restored, targetId, options);
    } catch (e) {}
  }

  return null;
}

async function getSlotMetaFromStorage(storage, targetId, knownTags = []) {
  if (!storage || !targetId) return null;
  if (typeof storage.getSlotMetadata === "function") {
    try {
      const fast = await storage.getSlotMetadata(targetId);
      if (fast && fast.exists) {
        return { exists: true, metadata: fast.metadata || {} };
      }
    } catch (err) {}
  }
  const full = await getSlotFromStorage(storage, `slots/${targetId}/slot.json`, knownTags);
  if (full && full.content) {
    return { exists: true, metadata: full.metadata || {} };
  }
  return null;
}

async function inspectSlotsFreshness(slotTags, hostGeneratedAt = 0, options = {}) {
  const result = { hasExpired: false, hasNewer: false };
  if (!Array.isArray(slotTags) || slotTags.length === 0) return result;
  const storage = getStorageAdapter();
  if (!storage) return result;
  const now = Date.now();
  const hostGen = Number(hostGeneratedAt || 0);
  const resolvedBatch = await resolveAllCanonicalSlotIdsBatch(slotTags, storage);

  // Deduplicate targetIds and collect all associated raw tags per targetId
  const tagsByTargetId = new Map();
  for (const rawTagOrId of slotTags) {
    if (!rawTagOrId) continue;
    const matchedSet = resolvedBatch.get(rawTagOrId);
    const targetIds =
      matchedSet && matchedSet.size > 0 ? Array.from(matchedSet) : [rawTagOrId];
    for (const targetId of targetIds) {
      if (!targetId) continue;
      let tagSet = tagsByTargetId.get(targetId);
      if (!tagSet) {
        tagSet = new Set([targetId]);
        tagsByTargetId.set(targetId, tagSet);
      }
      tagSet.add(rawTagOrId);
    }
  }
  if (tagsByTargetId.size === 0) return result;

  // Request-scoped memoization (auto-invalidated on any storage mutation via _mutationEpoch;
  // bypassed during active revalidations and explicit cross-isolate race checks).
  const reqCtx = requestStorage?.getStore?.();
  const canUseReqCache = Boolean(
    reqCtx &&
      typeof reqCtx === "object" &&
      !options?.bypassRequestCache &&
      !isRevalidationActive()
  );
  const currentEpoch = Number(storage._mutationEpoch || 0);
  let slotMetaCache = null;
  if (canUseReqCache) {
    if (
      !reqCtx._dinouSlotMetaCache ||
      reqCtx._dinouSlotMetaCache.storage !== storage ||
      reqCtx._dinouSlotMetaCache.epoch !== currentEpoch
    ) {
      reqCtx._dinouSlotMetaCache = {
        storage,
        epoch: currentEpoch,
        entries: new Map(),
      };
    }
    slotMetaCache = reqCtx._dinouSlotMetaCache.entries;
  }

  const readTagInvAt = async (tag) =>
    typeof storage.getTagInvalidatedAtAsync === "function"
      ? await storage.getTagInvalidatedAtAsync(tag)
      : typeof storage.getTagInvalidatedAt === "function"
      ? storage.getTagInvalidatedAt(tag)
      : 0;

  const inspectOneTarget = async ([targetId, tagSet]) => {
    const knownTags = Array.from(tagSet);
    const storageKey = `slots/${targetId}/slot.json`;
    let info = slotMetaCache ? slotMetaCache.get(targetId) : null;

    if (!info) {
      const slotMetaRes = await getSlotMetaFromStorage(storage, targetId, knownTags);
      if (!slotMetaRes || !slotMetaRes.exists) {
        const isDeleted =
          typeof storage.isKeyDeleted === "function"
            ? await storage.isKeyDeleted(storageKey)
            : typeof storage.isDeleted === "function" && storage.isDeleted(storageKey);
        const tagInvMap = new Map();
        if (!isDeleted && knownTags.length > 0) {
          const invValues = await Promise.all(knownTags.map((t) => readTagInvAt(t)));
          for (let i = 0; i < knownTags.length; i++) {
            tagInvMap.set(knownTags[i], Number(invValues[i] || 0));
          }
        }
        info = {
          exists: false,
          isDeleted: Boolean(isDeleted),
          tagInvMap,
          generatedAt: 0,
          revalidate: undefined,
        };
      } else {
        const meta = slotMetaRes.metadata || {};
        info = {
          exists: true,
          isDeleted: false,
          tagInvMap: null,
          generatedAt: Number(meta.generatedAt || 0),
          revalidate: typeof meta.revalidate === "number" ? meta.revalidate : undefined,
        };
      }
      if (slotMetaCache) {
        slotMetaCache.set(targetId, info);
      }
    } else if (!info.exists && !info.isDeleted && hostGen > 0) {
      const missingTags = knownTags.filter((t) => !info.tagInvMap.has(t));
      if (missingTags.length > 0) {
        const invValues = await Promise.all(missingTags.map((t) => readTagInvAt(t)));
        for (let i = 0; i < missingTags.length; i++) {
          info.tagInvMap.set(missingTags[i], Number(invValues[i] || 0));
        }
      }
    }

    if (!info.exists) {
      let isTagInvalidated = false;
      if (!info.isDeleted && hostGen > 0 && info.tagInvMap) {
        for (const t of knownTags) {
          const invAt = info.tagInvMap.get(t) || 0;
          if (invAt > 0 && invAt >= hostGen) {
            isTagInvalidated = true;
            break;
          }
        }
      }
      return { hasNewer: Boolean(info.isDeleted || isTagInvalidated), hasExpired: false };
    }

    const slotGen = info.generatedAt;
    const hasNewer = hostGen > 0 && slotGen > hostGen;
    const regEntry = slotRegistry.get(targetId);
    const revalidateSeconds =
      typeof regEntry?.revalidate === "number"
        ? regEntry.revalidate
        : info.revalidate;
    const hasExpired =
      typeof revalidateSeconds === "number" &&
      revalidateSeconds >= 1 &&
      now > slotGen + revalidateSeconds * 1000;
    return { hasNewer, hasExpired };
  };

  const perTargetResults = await Promise.all(
    Array.from(tagsByTargetId.entries()).map(inspectOneTarget)
  );
  for (const r of perTargetResults) {
    if (r.hasNewer) result.hasNewer = true;
    if (r.hasExpired) result.hasExpired = true;
  }
  return result;
}

async function hasExpiredSlots(slotTags) {
  const { hasExpired } = await inspectSlotsFreshness(slotTags, 0);
  return hasExpired;
}

export {
  DinouCacheSlot,
  getSlotJSX,
  serializeJSX,
  deserializeJSX,
  refreshNestedSlotsInTree,
  hasExpiredSlots,
  inspectSlotsFreshness,
};
export default {
  DinouCacheSlot,
  getSlotJSX,
  serializeJSX,
  deserializeJSX,
  refreshNestedSlotsInTree,
  hasExpiredSlots,
  inspectSlotsFreshness,
};
