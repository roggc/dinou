// dinou/core/layout-composition.js
// Per-level layout own-fragment rendering and composition for Dinou.
// Allows every layout level (Root -> L1 -> L2 -> ...) to be cached,
// revalidated, slot-refreshed, or executed dynamically independently
// without re-executing sibling/ancestor/descendant layout levels.

import path from "node:path";
import React from "react";
import importModule from "./import-module.js";
import { getFilePathAndDynamicParams } from "./get-file-path-and-dynamic-params.js";
import { getLayoutProps, resolveLayoutChainPpr } from "./layout-functions.js";
import {
  asyncRenderJSXToClientJSX,
  replaceLayoutChildrenPlaceholder,
} from "./render-jsx-to-client-jsx.js";
import {
  markLayoutRootElement,
  createLayoutChildrenPlaceholder,
  runInLayoutSegment,
  runWithPprContext,
  resetPprHoles,
  getRegisteredHoles,
  getPprHoleCounter,
} from "./ppr-context.js";
import { getContext, requestStorage } from "./request-context.js";
import { createDinouPageSlotElement } from "./get-jsx.js";
import {
  serializeJSX,
  deserializeJSX,
  refreshNestedSlotsInTree,
} from "./cache-slot.js";
import { readDist2Fallback } from "./storage-adapter.js";
import { fetchCloudflareDist2Asset } from "./static-assets.js";
import { spliceDynamicHolesIntoShell } from "./ppr-runtime.js";

function sanitizeLayoutScope(key) {
  return String(key || "root").replace(/[^a-zA-Z0-9_-]/g, "_");
}

function shiftPprHoleString(val, offset) {
  if (typeof val !== "string" || !offset) return val;
  const m = val.match(/^ppr-hole-(\d+)$/);
  if (!m) return val;
  return `ppr-hole-${Number(m[1]) + offset}`;
}

function shiftPprHoleEntry(hole, offset) {
  if (!offset) return hole;
  if (typeof hole === "string") {
    return shiftPprHoleString(hole, offset);
  }
  if (hole && typeof hole === "object" && typeof hole.id === "string") {
    return {
      ...hole,
      id: shiftPprHoleString(hole.id, offset),
    };
  }
  return hole;
}

function shiftPprHoleIdsInTree(node, offset) {
  if (!offset || node == null || typeof node !== "object") return node;
  if (
    node instanceof Promise ||
    typeof node.then === "function" ||
    node.$$typeof === Symbol.for("react.client.reference") ||
    node.$$typeof === Symbol.for("react.server.reference")
  ) {
    return node;
  }
  if (Array.isArray(node)) {
    let changed = false;
    const mapped = node.map((item) => {
      const updated = shiftPprHoleIdsInTree(item, offset);
      if (updated !== item) changed = true;
      return updated;
    });
    return changed ? mapped : node;
  }
  if (node.$$typeof === Symbol.for("react.transitional.element")) {
    if (!node.props || typeof node.props !== "object") return node;
    let changed = false;
    const newProps = { ...node.props };
    if (typeof newProps["data-ppr-hole"] === "string") {
      const shifted = shiftPprHoleString(newProps["data-ppr-hole"], offset);
      if (shifted !== newProps["data-ppr-hole"]) {
        newProps["data-ppr-hole"] = shifted;
        changed = true;
      }
    }
    if (typeof newProps["data-ppr-static-parent"] === "string") {
      const shifted = shiftPprHoleString(newProps["data-ppr-static-parent"], offset);
      if (shifted !== newProps["data-ppr-static-parent"]) {
        newProps["data-ppr-static-parent"] = shifted;
        changed = true;
      }
    }
    for (const [k, v] of Object.entries(node.props)) {
      if (k === "data-ppr-hole" || k === "data-ppr-static-parent") continue;
      if (v && typeof v === "object") {
        const updated = shiftPprHoleIdsInTree(v, offset);
        if (updated !== v) {
          newProps[k] = updated;
          changed = true;
        }
      }
    }
    if (!changed) return node;
    if (node.key != null) newProps.key = node.key;
    const children = newProps.children;
    if (Array.isArray(children)) {
      delete newProps.children;
      return React.createElement(node.type, newProps, ...children);
    }
    return React.createElement(node.type, newProps);
  }
  let changed = false;
  const clone = { ...node };
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === "object") {
      const updated = shiftPprHoleIdsInTree(v, offset);
      if (updated !== v) {
        clone[k] = updated;
        changed = true;
      }
    }
  }
  return changed ? clone : node;
}

async function readStorageArtifact(storage, key, platformContext = null, reqUrl = null) {
  if (!storage || !key) return null;
  try {
    const item = await storage.get(key);
    if (item && typeof item.content === "string" && item.content.length > 0) {
      return item;
    }
  } catch (e) {}

  const isDeleted =
    typeof storage.isKeyDeleted === "function"
      ? await storage.isKeyDeleted(key)
      : typeof storage.isDeleted === "function" && storage.isDeleted(key);
  if (isDeleted) {
    return null;
  }

  try {
    const isCfWorkers =
      typeof navigator !== "undefined" &&
      navigator.userAgent === "Cloudflare-Workers";
    const reqContext = isCfWorkers ? requestStorage?.getStore?.() : getContext();
    const assets =
      platformContext?.env?.ASSETS ||
      reqContext?.env?.ASSETS ||
      reqContext?.platformContext?.env?.ASSETS ||
      reqContext?.req?.env?.ASSETS ||
      (!isCfWorkers && typeof globalThis !== "undefined"
        ? globalThis.__DINOU_ENV__?.ASSETS
        : null);
    if (assets && typeof assets.fetch === "function") {
      const cleanKey = String(key).replace(/^\/+/, "");
      const res = await fetchCloudflareDist2Asset(assets, cleanKey, reqUrl || undefined);
      if (res && res.status === 200) {
        const ct = res.headers?.get?.("content-type") || "";
        const content = await res.text();
        if (content && !ct.includes("text/html") && !content.trimStart().startsWith("<")) {
          try {
            await storage.set(cleanKey, content);
          } catch (e) {}
          return { content };
        }
      }
    }
  } catch (e) {}

  try {
    const fallback = await readDist2Fallback(storage, key);
    if (fallback && typeof fallback.content === "string" && fallback.content.length > 0) {
      return fallback;
    }
  } catch (e) {}

  return null;
}

async function readLayoutMeta(storage, cleanLayoutKey, platformContext = null, reqUrl = null) {
  const metaKey = cleanLayoutKey
    ? `${cleanLayoutKey}/layout.metadata.json`
    : "layout.metadata.json";
  const item = await readStorageArtifact(storage, metaKey, platformContext, reqUrl);
  if (item?.metadata && typeof item.metadata === "object") {
    return item.metadata;
  }
  if (item?.content && item.content.trimStart().startsWith("{")) {
    try {
      return JSON.parse(item.content);
    } catch (e) {}
  }
  return null;
}

/**
 * Renders ONLY a single layout level (with its own @slots and layout_functions.getProps),
 * placing a createLayoutChildrenPlaceholder() where `children` goes.
 *
 * When `usePprContext` is true (SSG / ISR revalidation), runs inside runWithPprContext
 * with `resetPprHoles(0)` so its own dynamic holes are numbered 1..N relative to 0.
 * When `usePprContext` is false (live dynamic layout on a real request), executes
 * directly in the request context without PPR postponement.
 */
async function renderSingleLayoutLevel(entry, options = {}) {
  const {
    reqSegments = [],
    queryObj = {},
    isDevelopment = false,
    usePprContext = true,
  } = options;

  const layoutEffectivePpr = Boolean(entry.effectivePpr);
  const layoutModule = await importModule(entry.layoutPath);
  const Layout = layoutModule.default ?? layoutModule;

  const runRenderBody = async () => {
    const ctx = getContext();
    const prevLayoutSlotTags = ctx?._layoutSlotTags;
    const prevAllSlotTags = ctx?._slotTags;
    const ownSlotTagSet = new Set();

    const makeSegmentStore = () => ({
      active: true,
      idCount: 0,
      holeCount: 0,
      scopePrefix: sanitizeLayoutScope(entry.cleanLayoutKey),
    });

    const layoutSegmentStore = makeSegmentStore();
    const slots = entry.slots || {};
    const dParams = entry.dParams || {};
    const updatedSlots = {};

    if (!usePprContext || !layoutEffectivePpr) {
      if (ctx) {
        ctx._layoutSlotTags = ownSlotTagSet;
      }
    }

    for (const [slotName, slotValue] of Object.entries(slots)) {
      let updatedSlotElement;
      const slotFilePath = slotValue?.slotPath || slotValue?.props?.__modulePath;
      const slotParams = slotValue?.slotParams || slotValue?.props?.params || dParams || {};
      const prevSlotIdCount = layoutSegmentStore.idCount;
      const prevSlotHoleCount = layoutSegmentStore.holeCount;
      try {
        let elementToRender;
        if (slotValue && slotValue.slotPath) {
          const slotModule = await importModule(slotValue.slotPath);
          const Slot = slotModule.default ?? slotModule;
          elementToRender = React.createElement(Slot, {
            params: slotParams,
            key: slotName,
            __modulePath: slotValue.slotPath,
          });
        } else {
          elementToRender = slotValue;
        }
        elementToRender = markLayoutRootElement(
          elementToRender,
          layoutEffectivePpr,
          sanitizeLayoutScope(entry.cleanLayoutKey)
        );
        const resolvedSlot = await runInLayoutSegment(
          () => asyncRenderJSXToClientJSX(elementToRender),
          layoutSegmentStore
        );
        updatedSlotElement =
          usePprContext && layoutEffectivePpr ? elementToRender : resolvedSlot;
      } catch (e) {
        layoutSegmentStore.idCount = prevSlotIdCount;
        layoutSegmentStore.holeCount = prevSlotHoleCount;
        if (slotFilePath) {
          const realSlotFolder = path.dirname(slotFilePath);
          const [slotErrorPath, slotErrorParams] = getFilePathAndDynamicParams(
            reqSegments,
            queryObj,
            realSlotFolder,
            "error",
            true,
            true,
            undefined,
            reqSegments.length,
            slotParams
          );
          if (slotErrorPath) {
            const slotErrorModule = await importModule(slotErrorPath);
            const SlotError = slotErrorModule.default ?? slotErrorModule;
            const serializedError = {
              message: e.message || "Unknown Error",
              name: e.name,
              stack: isDevelopment ? e.stack : undefined,
            };
            updatedSlotElement = React.createElement(SlotError, {
              params: slotErrorParams,
              key: slotName,
              error: serializedError,
            });
          } else {
            updatedSlotElement = null;
          }
        } else {
          updatedSlotElement = null;
        }
      } finally {
        updatedSlots[slotName] = updatedSlotElement;
      }
      if (ctx?._hasRedirected) {
        if (ctx) {
          ctx._layoutSlotTags = prevLayoutSlotTags;
          ctx._slotTags = prevAllSlotTags;
        }
        return null;
      }
    }

    const layoutProps = await getLayoutProps(entry.layoutPath, dParams);
    if (ctx?._hasRedirected) {
      if (ctx) {
        ctx._layoutSlotTags = prevLayoutSlotTags;
        ctx._slotTags = prevAllSlotTags;
      }
      return null;
    }

    const placeholder = createLayoutChildrenPlaceholder();
    const props = { params: dParams, ...updatedSlots, ...(layoutProps ?? {}) };
    const layoutElement = markLayoutRootElement(
      React.createElement(Layout, props, placeholder),
      layoutEffectivePpr,
      sanitizeLayoutScope(entry.cleanLayoutKey)
    );

    if (usePprContext) {
      resetPprHoles(0);
    }

    // For PPR layouts, slots were only error-probed above and will now be rendered
    // cleanly inside `layoutElement` in exact JSX order.
    const renderSegStore =
      usePprContext && layoutEffectivePpr ? makeSegmentStore() : layoutSegmentStore;
    if (ctx) {
      ctx._layoutSlotTags = ownSlotTagSet;
    }

    let ownTree;
    try {
      ownTree = await runInLayoutSegment(
        () => asyncRenderJSXToClientJSX(layoutElement),
        renderSegStore
      );
    } finally {
      if (ctx) {
        if (prevLayoutSlotTags instanceof Set) {
          for (const t of ownSlotTagSet) prevLayoutSlotTags.add(t);
          ctx._layoutSlotTags = prevLayoutSlotTags;
        } else {
          ctx._layoutSlotTags = ownSlotTagSet;
        }
      }
    }

    if (ctx?._hasRedirected) {
      return null;
    }

    const ownHoles = usePprContext && layoutEffectivePpr ? getRegisteredHoles() : [];
    const ownSuspenseCount =
      usePprContext && layoutEffectivePpr ? Number(getPprHoleCounter() || 0) : 0;
    const ownSlotTags = Array.from(ownSlotTagSet);

    return {
      ownTree,
      ownHoles,
      ownSuspenseCount,
      ownSlotTags,
      effectivePpr: layoutEffectivePpr,
      placeholder,
    };
  };

  if (usePprContext) {
    return await runWithPprContext({ isPpr: layoutEffectivePpr }, runRenderBody);
  }
  return await runRenderBody();
}

/**
 * Composes an active layout chain (innermost [0] -> outermost [n-1]) from each level's
 * cached `shell.layout.own.json` (plus any freshly rendered `overrides` keyed by `cleanLayoutKey`).
 *
 * Returns null if any required level has no override and no cached `shell.layout.own.json`
 * (allowing callers to gracefully fall back to full getJSX).
 */
async function composeLayoutChainFromOwnFragments(activeChain, storage, options = {}) {
  if (!Array.isArray(activeChain) || activeChain.length === 0) {
    return null;
  }

  const {
    overrides = null, // Map<cleanLayoutKey, { ownTree, ownHoles, ownSuspenseCount, ownSlotTags, effectivePpr }>
    platformContext = null,
    reqUrl = null,
    refreshSlotsForKeys = null, // Set<cleanLayoutKey> | "all"
    currentPath = "/",
    persistRefreshedOwnKeys = false,
  } = options;

  let composedTree = null;
  let runningOffset = 0;
  const composedHoles = [];
  const composedSlotTags = new Set();
  let anyLayoutPpr = false;
  let leafOwnMeta = null;

  for (let i = activeChain.length - 1; i >= 0; i--) {
    const entry = activeChain[i];
    const key = entry.cleanLayoutKey || "";
    const override = overrides && overrides.has(key) ? overrides.get(key) : null;

    let ownTree = null;
    let ownHoles = [];
    let ownSuspenseCount = 0;
    let ownSlotTags = [];
    let levelPpr = Boolean(entry.effectivePpr);

    if (override && override.ownTree !== undefined) {
      ownTree = override.ownTree;
      ownHoles = Array.isArray(override.ownHoles) ? override.ownHoles : [];
      ownSuspenseCount = Number(override.ownSuspenseCount || 0);
      ownSlotTags = Array.isArray(override.ownSlotTags) ? override.ownSlotTags : [];
      if (typeof override.effectivePpr === "boolean") {
        levelPpr = override.effectivePpr;
      }
    } else {
      const ownKey = key ? `${key}/shell.layout.own.json` : "shell.layout.own.json";
      const [ownItem, lMeta] = await Promise.all([
        readStorageArtifact(storage, ownKey, platformContext, reqUrl),
        readLayoutMeta(storage, key, platformContext, reqUrl),
      ]);
      if (!ownItem || !ownItem.content || !ownItem.content.trim().startsWith("{")) {
        return null;
      }
      if (lMeta?.dynamic) {
        return null;
      }
      try {
        ownTree = deserializeJSX(ownItem.content);
      } catch (e) {
        return null;
      }

      const shouldRefreshSlots =
        refreshSlotsForKeys === "all" ||
        (refreshSlotsForKeys instanceof Set && refreshSlotsForKeys.has(key));
      if (shouldRefreshSlots) {
        const ctx = getContext();
        const prevLayoutSlotTags = ctx?._layoutSlotTags;
        const refreshedTagSet = new Set();
        if (ctx) ctx._layoutSlotTags = refreshedTagSet;
        try {
          ownTree = await runInLayoutSegment(() =>
            refreshNestedSlotsInTree(ownTree, "__layout_shell__", {
              currentPath: currentPath || entry.layoutRoutePath || "/",
            })
          );
        } finally {
          if (ctx) {
            if (prevLayoutSlotTags instanceof Set) {
              for (const t of refreshedTagSet) prevLayoutSlotTags.add(t);
              ctx._layoutSlotTags = prevLayoutSlotTags;
            } else {
              ctx._layoutSlotTags = refreshedTagSet;
            }
          }
        }
        const shouldPersistOwn =
          persistRefreshedOwnKeys === true ||
          (persistRefreshedOwnKeys instanceof Set && persistRefreshedOwnKeys.has(key));
        if (shouldPersistOwn && ownTree) {
          try {
            await storage.set(ownKey, serializeJSX(ownTree));
          } catch (e) {}
        }
        if (refreshedTagSet.size > 0) {
          ownSlotTags = Array.from(refreshedTagSet);
        }
      }

      if (lMeta) {
        ownHoles = Array.isArray(lMeta.ownHoles)
          ? lMeta.ownHoles
          : i === activeChain.length - 1 && Array.isArray(lMeta.holes)
          ? lMeta.holes
          : [];
        ownSuspenseCount =
          typeof lMeta.ownSuspenseCount === "number"
            ? lMeta.ownSuspenseCount
            : i === activeChain.length - 1 && typeof lMeta.suspenseCount === "number"
            ? lMeta.suspenseCount
            : ownHoles.length;
        if (ownSlotTags.length === 0) {
          ownSlotTags = Array.isArray(lMeta.ownSlotTags)
            ? lMeta.ownSlotTags
            : i === activeChain.length - 1 && Array.isArray(lMeta.slotTags)
            ? lMeta.slotTags
            : [];
        }
        if (typeof lMeta.ownPpr === "boolean") {
          levelPpr = lMeta.ownPpr;
        }
      }
    }

    if (levelPpr) {
      anyLayoutPpr = true;
      if (runningOffset > 0) {
        ownTree = shiftPprHoleIdsInTree(ownTree, runningOffset);
      }
      for (const h of ownHoles) {
        composedHoles.push(shiftPprHoleEntry(h, runningOffset));
      }
      runningOffset += ownSuspenseCount;
    }

    for (const t of ownSlotTags) {
      if (t) composedSlotTags.add(t);
    }

    if (i === 0) {
      leafOwnMeta = {
        ownHoles,
        ownSuspenseCount,
        ownSlotTags,
        ownPpr: levelPpr,
      };
    }

    if (composedTree === null) {
      composedTree = ownTree;
    } else {
      composedTree = replaceLayoutChildrenPlaceholder(composedTree, ownTree);
    }
  }

  if (composedTree === null) {
    return null;
  }

  const layoutOnlyTree = replaceLayoutChildrenPlaceholder(
    composedTree,
    createDinouPageSlotElement()
  );

  return {
    layoutOnlyTree,
    composedWithPlaceholder: composedTree,
    holes: composedHoles,
    suspenseCount: runningOffset,
    slotTags: Array.from(composedSlotTags),
    anyLayoutPpr,
    leafOwnMeta,
  };
}

/**
 * Resolves `effectivePpr` onto every entry of `activeChain` using `resolveLayoutChainPpr`.
 */
async function hydrateActiveChainPpr(activeChain, reqSegments, queryObj, srcFolder, options = {}) {
  const { layoutPprMap, defaultPpr, anyLayoutPpr } = await resolveLayoutChainPpr(
    reqSegments,
    queryObj,
    srcFolder,
    options
  );
  for (const entry of activeChain) {
    const norm = entry.layoutPath.replace(/\\/g, "/");
    entry.effectivePpr = layoutPprMap.has(norm)
      ? Boolean(layoutPprMap.get(norm))
      : Boolean(defaultPpr);
  }
  return { layoutPprMap, defaultPpr, anyLayoutPpr };
}

/**
 * Splices live dynamic PPR holes into a single static PPR layout level's cached
 * `shell.layout.own.json` without re-executing the layout's static shell.
 * Used when composing a static PPR layout alongside a dynamic sibling/child layout
 * (e.g., L1 PPR -> L2 Dynamic -> Page PPR) on both SSR GET and /____rsc_layout____.
 */
async function spliceSingleLayoutOwnHoles(entry, storage, options = {}) {
  const {
    platformContext = null,
    reqUrl = null,
    currentPath = "/",
  } = options;

  const key = entry.cleanLayoutKey || "";
  const ownKey = key ? `${key}/shell.layout.own.json` : "shell.layout.own.json";
  const [ownItem, lMeta] = await Promise.all([
    readStorageArtifact(storage, ownKey, platformContext, reqUrl),
    readLayoutMeta(storage, key, platformContext, reqUrl),
  ]);
  if (!ownItem || !ownItem.content || !ownItem.content.trim().startsWith("{")) {
    return null;
  }
  if (lMeta?.dynamic) {
    return null;
  }
  let cachedOwnTree;
  try {
    cachedOwnTree = deserializeJSX(ownItem.content);
  } catch (e) {
    return null;
  }

  const layoutModule = await importModule(entry.layoutPath);
  const Layout = layoutModule.default ?? layoutModule;
  const slots = entry.slots || {};
  const dParams = entry.dParams || {};
  const rawSlots = {};

  for (const [slotName, slotValue] of Object.entries(slots)) {
    const slotParams = slotValue?.slotParams || slotValue?.props?.params || dParams || {};
    if (slotValue && slotValue.slotPath) {
      const slotModule = await importModule(slotValue.slotPath);
      const Slot = slotModule.default ?? slotModule;
      rawSlots[slotName] = React.createElement(Slot, {
        params: slotParams,
        key: slotName,
        __modulePath: slotValue.slotPath,
      });
    } else {
      rawSlots[slotName] = slotValue;
    }
  }

  const ctx = getContext();
  const layoutProps = await getLayoutProps(entry.layoutPath, dParams);
  if (ctx?._hasRedirected) {
    return null;
  }

  const placeholder = createLayoutChildrenPlaceholder();
  const props = { params: dParams, ...rawSlots, ...(layoutProps ?? {}) };
  const liveRawLayoutEl = markLayoutRootElement(
    React.createElement(Layout, props, placeholder),
    true,
    sanitizeLayoutScope(key)
  );

  const prevResume = ctx?._isPprRuntimeResume;
  if (ctx) ctx._isPprRuntimeResume = true;
  let resolvedOwnTree;
  try {
    const splicedTree = await spliceDynamicHolesIntoShell(
      cachedOwnTree,
      liveRawLayoutEl,
      0
    );
    const renderSegStore = {
      active: true,
      idCount: 0,
      holeCount: 0,
      scopePrefix: sanitizeLayoutScope(key),
    };
    resolvedOwnTree = await runInLayoutSegment(
      () => asyncRenderJSXToClientJSX(splicedTree),
      renderSegStore
    );
  } finally {
    if (ctx) ctx._isPprRuntimeResume = prevResume;
  }

  if (ctx?._hasRedirected) {
    return null;
  }

  return {
    ownTree: resolvedOwnTree,
    ownHoles: [],
    ownSuspenseCount: 0,
    ownSlotTags: Array.isArray(lMeta?.ownSlotTags) ? lMeta.ownSlotTags : [],
    effectivePpr: false,
    placeholder,
  };
}

export {
  shiftPprHoleIdsInTree,
  shiftPprHoleEntry,
  renderSingleLayoutLevel,
  spliceSingleLayoutOwnHoles,
  composeLayoutChainFromOwnFragments,
  hydrateActiveChainPpr,
  readStorageArtifact,
  readLayoutMeta,
};
export default {
  shiftPprHoleIdsInTree,
  shiftPprHoleEntry,
  renderSingleLayoutLevel,
  spliceSingleLayoutOwnHoles,
  composeLayoutChainFromOwnFragments,
  hydrateActiveChainPpr,
  readStorageArtifact,
  readLayoutMeta,
};
