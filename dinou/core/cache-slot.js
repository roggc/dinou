// dinou/core/cache-slot.js
// Primitive for Vertical Segmentation (Micro-ISR) in React Server Components.
// Caches and invalidates component sub-trees inside pages using revalidate & revalidateTag.

import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import React from "react";
import { getStorageAdapter } from "./storage-adapter.js";
import { asyncRenderJSXToClientJSX } from "./render-jsx-to-client-jsx.js";
import { DinouCacheSlotBoundary as RawDinouCacheSlotBoundary } from "./slot.js";
import { getContext } from "./request-context.js";
import { getJSX } from "./get-jsx.js";
import {
  isPprBuildActive,
  isInsideSuspense,
  deferPprSuspenseEffect,
  runWithPprContext,
} from "./ppr-context.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const currentDir = path.dirname(fileURLToPath(import.meta.url));

const INFLIGHT_KEY = Symbol.for("dinou.slot.inflight.renders");
if (!globalThis[INFLIGHT_KEY]) {
  globalThis[INFLIGHT_KEY] = new Map();
}
const inflightSlotRenders = globalThis[INFLIGHT_KEY];

const RECENT_FRESH_KEY = Symbol.for("dinou.slot.recent.fresh");
if (!globalThis[RECENT_FRESH_KEY]) {
  globalThis[RECENT_FRESH_KEY] = new Map();
}
const recentFreshSlotRenders = globalThis[RECENT_FRESH_KEY];

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
if (!globalThis[PRE_EVAL_ROUTES_KEY]) {
  globalThis[PRE_EVAL_ROUTES_KEY] = new Set();
}
const preEvaluatingRoutes = globalThis[PRE_EVAL_ROUTES_KEY];

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
    const pkg = require("@roggc/react-server-dom-esm/server.node.js");
    if (typeof pkg.registerServerReference === "function") {
      _registerServerRefFn = pkg.registerServerReference;
      return _registerServerRefFn;
    }
  } catch (e) {}
  return null;
}

let _DinouCacheSlotBoundary = null;
function getCacheSlotBoundary() {
  if (!_DinouCacheSlotBoundary) {
    let DinouCacheSlotBoundary = RawDinouCacheSlotBoundary;
    if (
      typeof DinouCacheSlotBoundary === "function" &&
      DinouCacheSlotBoundary.$$typeof !== Symbol.for("react.client.reference")
    ) {
      const slotPath = path.resolve(currentDir, "slot.js");
      const fileUrl = pathToFileURL(slotPath).href;
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
          const pkg = require("@roggc/react-server-dom-esm/server.node.js");
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
            serverRef = regServerRef(serverRef, value.id, null);
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
      if (Array.isArray(children)) {
        delete props.children;
        return React.createElement(type, props, ...children);
      }
      return React.createElement(type, props);
    }
    return node;
  }

  return toReactElement(parsed);
}

function recordSlotTagsOnContext(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return;
  try {
    const reqContext = getContext();
    if (reqContext) {
      if (!reqContext._slotTags) {
        reqContext._slotTags = new Set();
      }
      for (const t of tags) {
        if (t) reqContext._slotTags.add(t);
      }
    }
  } catch (e) {}
}

function commitSlotTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return;
  if (!deferPprSuspenseEffect(() => recordSlotTagsOnContext(tags))) {
    recordSlotTagsOnContext(tags);
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
    typeof storage.isDeleted === "function" && storage.isDeleted(storageKey);
  if (isDeleted) {
    return null;
  }

  try {
    const reqContext = getContext();
    const assets =
      reqContext?.env?.ASSETS ||
      reqContext?.platformContext?.env?.ASSETS ||
      reqContext?.req?.env?.ASSETS;
    if (assets && typeof assets.fetch === "function") {
      const cleanKey = String(storageKey || "").replace(/^\/+/, "");
      const metaKey = cleanKey.endsWith("/slot.json")
        ? cleanKey.slice(0, -"/slot.json".length) + "/slot.metadata.json"
        : `${cleanKey}.metadata.json`;
      const [slotRes, metaRes] = await Promise.all([
        assets.fetch(new Request(`http://localhost/${cleanKey}`)),
        assets.fetch(new Request(`http://localhost/${metaKey}`)),
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
            ...(Array.isArray(knownTags) ? knownTags : []),
          ]);
          if (typeof storage.getTagInvalidatedAt === "function") {
            for (const t of combinedTags) {
              const invAt = storage.getTagInvalidatedAt(t);
              if (invAt > 0 && invAt >= generatedAt) {
                return null;
              }
            }
          }
          cached = { content, metadata };
          await storage.set(cleanKey, content, metadata);
          return cached;
        }
      }
    }
  } catch (e) {}

  return cached;
}

/**
 * Traverses a deserialized JSX tree from a cached outer slot and refreshes
 * any nested <DinouCacheSlot> boundaries so inner slot invalidations are
 * respected even when the outer slot hits its cache.
 */
async function refreshNestedSlotsInTree(node, currentSlotId, options = {}) {
  if (node == null || typeof node !== "object") return node;
  if (discoveringSlots.size > 0 || preEvaluatingRoutes.size > 0) return node;

  if (Array.isArray(node)) {
    return Promise.all(
      node.map((item) => refreshNestedSlotsInTree(item, currentSlotId, options))
    );
  }

  if (node.$$typeof === Symbol.for("react.transitional.element")) {
    const nestedSlotId = node.props && node.props.__dinou_slot__;
    if (nestedSlotId && nestedSlotId !== currentSlotId) {
      if (Array.isArray(node.props.tags)) {
        commitSlotTags(node.props.tags);
      }
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
      const freshInner = await getSlotJSX(nestedSlotId, {
        ...options,
        currentPath,
      });
      if (freshInner !== null) {
        const refreshedInner = await refreshNestedSlotsInTree(
          freshInner,
          nestedSlotId,
          options
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

  const slotId = id || tag || (Array.isArray(tags) ? tags[0] : null);
  if (!slotId) {
    return typeof children === "function" ? await children() : children;
  }

  const allTags = Array.isArray(tags)
    ? [...tags]
    : tag
    ? [tag]
    : [];

  const storageKey = `slots/${slotId}/slot.json`;
  const storage = getStorageAdapter();
  const isNoCache = revalidate === 0;

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
  slotRegistry.set(slotId, {
    render: async () => {
      const childElement = typeof children === "function" ? await children() : children;
      return await asyncRenderJSXToClientJSX(childElement);
    },
    discover: async () => {
      if (discoveringSlots.has(slotId)) return;
      discoveringSlots.add(slotId);
      try {
        const childElement = typeof children === "function" ? await children() : children;
        await asyncRenderJSXToClientJSX(childElement);
      } catch (e) {
      } finally {
        discoveringSlots.delete(slotId);
      }
    },
    tags: allTags,
    revalidate: typeof revalidate === "number" ? revalidate : undefined,
  });

  // When running inside a nested slot discovery pass, recursively discover any child slots
  if (discoveringSlots.size > 0 && !discoveringSlots.has(slotId)) {
    const ownEntry = slotRegistry.get(slotId);
    if (ownEntry && typeof ownEntry.discover === "function") {
      await ownEntry.discover();
    }
  }

  if (!storage || isNoCache) {
    const childElement = typeof children === "function" ? await children() : children;
    const directContent = await asyncRenderJSXToClientJSX(childElement);
    commitSlotTags(allTags);
    return wrapWithBoundary(directContent, true);
  }

  // 1. Check if cached in storage
  let cached = await getSlotFromStorage(storage, storageKey, allTags);

  // During a PPR static shell build, if a slot is inside a <Suspense> boundary
  // and was only cached at runtime (not part of the static shell), do not short-circuit
  // from disk so any dynamic request access (cookies/headers/query) inside the slot still
  // triggers PPR postpone.
  if (
    isPprBuildActive() &&
    isInsideSuspense() &&
    cached &&
    !cached.metadata?.inStaticShell
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

    if (revalidateSeconds === 0) {
      const childElement = typeof children === "function" ? await children() : children;
      const directContent = await asyncRenderJSXToClientJSX(childElement);
      commitSlotTags(allTags);
      return wrapWithBoundary(directContent, true);
    }

    const isExpired =
      typeof revalidateSeconds === "number" &&
      revalidateSeconds > 0 &&
      now > generatedAt + revalidateSeconds * 1000;

    if (!isExpired) {
      try {
        const restored = deserializeJSX(cached.content);
        const withRefreshedNested = await refreshNestedSlotsInTree(restored, slotId);
        commitSlotTags(allTags);
        return wrapWithBoundary(withRefreshedNested, false);
      } catch (err) {}
    } else {
      // Stale-While-Revalidate
      try {
        const staleJSX = deserializeJSX(cached.content);

        if (!backgroundRevalidations.has(storageKey)) {
          backgroundRevalidations.add(storageKey);
          const bgPromise = (async () => {
            try {
              const childElement = typeof children === "function" ? await children() : children;
              const resolved = await asyncRenderJSXToClientJSX(childElement);
              const serialized = serializeJSX(resolved);
              await storage.set(storageKey, serialized, {
                tags: allTags,
                revalidate: revalidateSeconds,
                generatedAt: Date.now(),
                slotId,
                inStaticShell: Boolean(meta.inStaticShell),
              });
            } catch (e) {
              console.error(`[DinouCacheSlot] Background revalidation failed for slot "${slotId}":`, e);
            } finally {
              backgroundRevalidations.delete(storageKey);
            }
          })();

          try {
            const reqContext = getContext();
            const ctx = reqContext?.ctx || reqContext?.platformContext?.ctx || reqContext?.req?.ctx;
            if (ctx && typeof ctx.waitUntil === "function") {
              ctx.waitUntil(bgPromise);
            }
          } catch (e) {}
        }

        const withRefreshedNested = await refreshNestedSlotsInTree(staleJSX, slotId);
        commitSlotTags(allTags);
        return wrapWithBoundary(withRefreshedNested, false);
      } catch (err) {}
    }
  }

  // 2. Cache MISS or expired without usable stale content: Deduplicate synchronous render
  if (inflightSlotRenders.has(storageKey)) {
    try {
      const deduped = await inflightSlotRenders.get(storageKey);
      commitSlotTags(allTags);
      return wrapWithBoundary(deduped, true);
    } catch (e) {}
  }

  const inPprSuspense = isPprBuildActive() && isInsideSuspense();
  const isPprShellBuild = isPprBuildActive();

  const renderPromise = (async () => {
    const childElement = typeof children === "function" ? await children() : children;
    const resolved = await asyncRenderJSXToClientJSX(childElement);
    const serialized = serializeJSX(resolved);

    const slotMeta = {
      tags: allTags,
      revalidate: typeof revalidate === "number" ? revalidate : undefined,
      generatedAt: Date.now(),
      slotId,
      inStaticShell: Boolean(isPprShellBuild),
    };

    const persistSlot = async () => {
      try {
        await storage.set(storageKey, serialized, slotMeta);
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
  try {
    const fresh = await renderPromise;
    commitSlotTags(allTags);
    return wrapWithBoundary(fresh, true);
  } finally {
    inflightSlotRenders.delete(storageKey);
  }
}

/**
 * Resolves a slot ID or tag to its canonical slotId using slotRegistry or storage metadata.
 */
async function resolveCanonicalSlotId(slotIdOrTag, storage) {
  if (slotRegistry.has(slotIdOrTag)) {
    return slotIdOrTag;
  }
  for (const [regId, entry] of slotRegistry.entries()) {
    if (Array.isArray(entry.tags) && entry.tags.includes(slotIdOrTag)) {
      return regId;
    }
  }
  if (storage) {
    try {
      const direct = await getSlotFromStorage(storage, `slots/${slotIdOrTag}/slot.json`);
      if (direct && direct.content) {
        return slotIdOrTag;
      }
      if (typeof storage.keys === "function") {
        const keys = await storage.keys("slots/");
        for (const rawKey of keys) {
          const key = String(rawKey || "").replace(/\\/g, "/");
          if (key.endsWith("/slot.json") || key.endsWith("/slot.metadata.json")) {
            const item = await storage.get(key);
            let meta = item?.metadata;
            if (!meta && key.endsWith("/slot.metadata.json") && item?.content) {
              try {
                meta = JSON.parse(item.content);
              } catch (e) {}
            }
            if (meta && Array.isArray(meta.tags) && meta.tags.includes(slotIdOrTag)) {
              if (meta.slotId) return meta.slotId;
              const match = key.match(/^slots\/([^/]+)\//);
              if (match) return match[1];
            }
          }
        }
      }
    } catch (e) {}
  }
  return slotIdOrTag;
}

/**
 * Resolves a slot's JSX tree for the granular /____rsc_slot____/:id endpoint.
 */
async function getSlotJSX(slotId, options = {}) {
  const storage = getStorageAdapter();
  let targetId = await resolveCanonicalSlotId(slotId, storage);
  let storageKey = `slots/${targetId}/slot.json`;

  // 1. Check storage cache
  let cached = await getSlotFromStorage(storage, storageKey);

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

    const isNoCache = revalidateSeconds === 0;
    const isExpired =
      isNoCache ||
      (typeof revalidateSeconds === "number" &&
        revalidateSeconds > 0 &&
        now > generatedAt + revalidateSeconds * 1000);

    if (!isExpired && !options.fresh) {
      try {
        const restored = deserializeJSX(cached.content);
        return await refreshNestedSlotsInTree(restored, targetId, options);
      } catch (e) {}
    }
  }

  async function discoverFromRegisteredSlots() {
    const attempted = new Set();
    let progressed = true;
    while (!slotRegistry.has(targetId) && progressed) {
      progressed = false;
      for (const [regKey, entry] of Array.from(slotRegistry.entries())) {
        if (attempted.has(regKey)) continue;
        attempted.add(regKey);
        progressed = true;
        if (typeof entry.discover === "function") {
          await entry.discover();
          targetId = await resolveCanonicalSlotId(slotId, storage);
          if (slotRegistry.has(targetId)) return;
        }
      }
    }
  }

  // 2. First try discovering nested slots from already-registered outer slots
  if (!slotRegistry.has(targetId)) {
    await discoverFromRegisteredSlots();
  }

  // 3. If still not in slotRegistry (e.g., cold server start), pre-evaluate the route once
  if (
    !slotRegistry.has(targetId) &&
    options.currentPath &&
    !preEvaluatingRoutes.has(options.currentPath)
  ) {
    preEvaluatingRoutes.add(options.currentPath);
    try {
      const isNotFound = { value: false };
      await runWithPprContext({ isPpr: true }, async () => {
        const pageJsx = await getJSX(options.currentPath, {}, isNotFound, false, false, {
          segment: "page",
        });
        if (pageJsx) {
          await asyncRenderJSXToClientJSX(pageJsx);
        }
        targetId = await resolveCanonicalSlotId(slotId, storage);

        if (!slotRegistry.has(targetId)) {
          const fullJsx = await getJSX(options.currentPath, {}, isNotFound, false, false);
          if (fullJsx) {
            await asyncRenderJSXToClientJSX(fullJsx);
          }
          targetId = await resolveCanonicalSlotId(slotId, storage);
        }
      });
    } catch (e) {
      console.warn(
        `[getSlotJSX] Could not pre-evaluate route "${options.currentPath}" to register slot "${slotId}":`,
        e
      );
    } finally {
      preEvaluatingRoutes.delete(options.currentPath);
    }

    if (!slotRegistry.has(targetId)) {
      await discoverFromRegisteredSlots();
    }
  }

  storageKey = `slots/${targetId}/slot.json`;

  if (slotRegistry.has(targetId)) {
    const entry = slotRegistry.get(targetId);
    const reqUrl = String(options.req?.url || "");
    const qIdx = reqUrl.indexOf("?");
    const queryKey = qIdx !== -1 ? reqUrl.slice(qIdx) : "";
    const stampedeKey = `${storageKey}::${queryKey}`;
    try {
      if (inflightSlotRenders.has(storageKey)) {
        const deduped = await inflightSlotRenders.get(storageKey);
        return await refreshNestedSlotsInTree(deduped, targetId, options);
      }

      if (options.fresh && recentFreshSlotRenders.has(stampedeKey)) {
        const recent = recentFreshSlotRenders.get(stampedeKey);
        if (recent && Date.now() - recent.timestamp < 1000 && recent.serialized) {
          const restored = deserializeJSX(recent.serialized);
          return await refreshNestedSlotsInTree(restored, targetId, options);
        }
        recentFreshSlotRenders.delete(stampedeKey);
      }

      const renderPromise = (async () => {
        const resolved = await entry.render();
        const serialized = serializeJSX(resolved);
        if (options.fresh) {
          recentFreshSlotRenders.set(stampedeKey, {
            timestamp: Date.now(),
            serialized,
          });
        }
        if (storage && entry.revalidate !== 0) {
          await storage.set(storageKey, serialized, {
            tags: entry.tags,
            revalidate: entry.revalidate,
            generatedAt: Date.now(),
            slotId: targetId,
            inStaticShell: Boolean(cached?.metadata?.inStaticShell),
          });
          if (Boolean(cached?.metadata?.inStaticShell) && options.currentPath) {
            const cleanRouteKey = String(options.currentPath)
              .split("?")[0]
              .replace(/^\/+/, "")
              .replace(/\/+$/, "");
            const htmlKey = cleanRouteKey ? `${cleanRouteKey}/index.html` : "index.html";
            const shellHtmlKey = cleanRouteKey ? `${cleanRouteKey}/shell.html` : "shell.html";
            const metaKey = cleanRouteKey ? `${cleanRouteKey}/metadata.json` : "metadata.json";
            const shellRscKey = cleanRouteKey ? `${cleanRouteKey}/shell.rsc` : "shell.rsc";
            const rscKey = cleanRouteKey ? `${cleanRouteKey}/rsc.rsc` : "rsc.rsc";
            await Promise.all([
              storage.delete(htmlKey),
              storage.delete(shellHtmlKey),
              storage.delete(metaKey),
              storage.delete(shellRscKey),
              storage.delete(rscKey),
            ]);
          }
        }
        return deserializeJSX(serialized);
      })();

      inflightSlotRenders.set(storageKey, renderPromise);
      try {
        const restored = await renderPromise;
        return await refreshNestedSlotsInTree(restored, targetId, options);
      } finally {
        inflightSlotRenders.delete(storageKey);
      }
    } catch (e) {
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

export {
  DinouCacheSlot,
  getSlotJSX,
  serializeJSX,
  deserializeJSX,
};
export default {
  DinouCacheSlot,
  getSlotJSX,
  serializeJSX,
  deserializeJSX,
};
