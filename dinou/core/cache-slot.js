// dinou/core/cache-slot.js
// Primitive for Vertical Segmentation (Micro-ISR) in React Server Components.
// Caches and invalidates component sub-trees inside pages using revalidate & revalidateTag.

const path = require("path");
const { pathToFileURL } = require("url");
const React = require("react");
const { getStorageAdapter } = require("./storage-adapter.js");
const { asyncRenderJSXToClientJSX } = require("./render-jsx-to-client-jsx.js");

const INFLIGHT_KEY = Symbol.for("dinou.slot.inflight.renders");
if (!globalThis[INFLIGHT_KEY]) {
  globalThis[INFLIGHT_KEY] = new Map();
}
const inflightSlotRenders = globalThis[INFLIGHT_KEY];

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

let _DinouCacheSlotBoundary = null;
function getCacheSlotBoundary() {
  if (!_DinouCacheSlotBoundary) {
    let { DinouCacheSlotBoundary } = require("./slot.js");
    if (
      typeof DinouCacheSlotBoundary === "function" &&
      DinouCacheSlotBoundary.$$typeof !== Symbol.for("react.client.reference")
    ) {
      const slotPath = path.resolve(__dirname, "slot.js");
      const fileUrl = pathToFileURL(slotPath).href;
      let regFn = null;
      try {
        const pkg = require("react-server-dom-webpack/server");
        regFn = pkg.registerClientReference;
      } catch (e) {}
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
 * preserving symbols, React 19 transitional elements, and client component references.
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

  function wrapWithBoundary(content) {
    const Boundary = getCacheSlotBoundary();
    if (!Boundary) return content;
    return React.createElement(Boundary, { id: slotId }, content);
  }

  // Register in slotRegistry for on-demand endpoint re-rendering
  slotRegistry.set(slotId, {
    render: async () => {
      const childElement = typeof children === "function" ? await children() : children;
      return await asyncRenderJSXToClientJSX(childElement);
    },
    tags: allTags,
    revalidate: typeof revalidate === "number" ? revalidate : undefined,
  });

  if (!storage) {
    const directContent = typeof children === "function" ? await children() : children;
    return wrapWithBoundary(directContent);
  }

  // 1. Check if cached in storage
  let cached = null;
  try {
    cached = await storage.get(storageKey);
  } catch (err) {}

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

    const isExpired =
      typeof revalidateSeconds === "number" &&
      revalidateSeconds > 0 &&
      now > generatedAt + revalidateSeconds * 1000;

    if (!isExpired) {
      try {
        const restored = deserializeJSX(cached.content);
        return wrapWithBoundary(restored);
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
              });
            } catch (e) {
              console.error(`[DinouCacheSlot] Background revalidation failed for slot "${slotId}":`, e);
            } finally {
              backgroundRevalidations.delete(storageKey);
            }
          })();

          try {
            const { getContext } = require("./request-context.js");
            const reqContext = getContext();
            const ctx = reqContext?.ctx || reqContext?.platformContext?.ctx || reqContext?.req?.ctx;
            if (ctx && typeof ctx.waitUntil === "function") {
              ctx.waitUntil(bgPromise);
            }
          } catch (e) {}
        }

        return wrapWithBoundary(staleJSX);
      } catch (err) {}
    }
  }

  // 2. Cache MISS or expired without usable stale content: Deduplicate synchronous render
  if (inflightSlotRenders.has(storageKey)) {
    try {
      const deduped = await inflightSlotRenders.get(storageKey);
      return wrapWithBoundary(deduped);
    } catch (e) {}
  }

  const renderPromise = (async () => {
    const childElement = typeof children === "function" ? await children() : children;
    const resolved = await asyncRenderJSXToClientJSX(childElement);
    const serialized = serializeJSX(resolved);

    try {
      await storage.set(storageKey, serialized, {
        tags: allTags,
        revalidate: typeof revalidate === "number" ? revalidate : undefined,
        generatedAt: Date.now(),
        slotId,
      });
    } catch (err) {
      console.error(`[DinouCacheSlot] Failed to write cache for slot "${slotId}":`, err);
    }

    return deserializeJSX(serialized);
  })();

  inflightSlotRenders.set(storageKey, renderPromise);
  try {
    const fresh = await renderPromise;
    return wrapWithBoundary(fresh);
  } finally {
    inflightSlotRenders.delete(storageKey);
  }
}

/**
 * Resolves a slot's JSX tree for the granular /____rsc_slot____/:id endpoint.
 */
async function getSlotJSX(slotId, options = {}) {
  const storage = getStorageAdapter();
  const storageKey = `slots/${slotId}/slot.json`;

  // 1. Check storage cache
  let cached = null;
  if (storage) {
    try {
      cached = await storage.get(storageKey);
    } catch (e) {}
  }

  const now = Date.now();
  if (cached && cached.content) {
    const meta = cached.metadata || {};
    const generatedAt = meta.generatedAt || 0;
    const revalidateSeconds =
      typeof meta.revalidate === "number" ? meta.revalidate : undefined;

    const isExpired =
      typeof revalidateSeconds === "number" &&
      revalidateSeconds > 0 &&
      now > generatedAt + revalidateSeconds * 1000;

    if (!isExpired && !options.fresh) {
      try {
        return deserializeJSX(cached.content);
      } catch (e) {}
    }
  }

  // 2. If missing from storage (e.g. was invalidated) or expired or forced fresh:
  if (!slotRegistry.has(slotId) && options.currentPath) {
    try {
      const { getJSX } = require("./get-jsx.js");
      const isNotFound = { value: false };
      await getJSX(options.currentPath, {}, isNotFound, false, false, { segment: "page" });
    } catch (e) {
      console.warn(`[getSlotJSX] Could not pre-evaluate route "${options.currentPath}" to register slot "${slotId}":`, e);
    }
  }

  if (slotRegistry.has(slotId)) {
    const entry = slotRegistry.get(slotId);
    try {
      const resolved = await entry.render();
      const serialized = serializeJSX(resolved);
      if (storage) {
        await storage.set(storageKey, serialized, {
          tags: entry.tags,
          revalidate: entry.revalidate,
          generatedAt: Date.now(),
          slotId,
        });
      }
      return deserializeJSX(serialized);
    } catch (e) {
      console.error(`[getSlotJSX] Failed to regenerate slot "${slotId}":`, e);
    }
  }

  // Fallback to cached content if regeneration failed
  if (cached && cached.content) {
    try {
      return deserializeJSX(cached.content);
    } catch (e) {}
  }

  return null;
}

module.exports = {
  DinouCacheSlot,
  getSlotJSX,
  serializeJSX,
  deserializeJSX,
};
