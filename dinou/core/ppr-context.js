// dinou/core/ppr-context.js
// PPR Pre-rendering Context and Suspense Hole Tracker for Dinou.

import { AsyncLocalStorage } from "node:async_hooks";

const PPR_STORAGE_KEY = Symbol.for("dinou.ppr.storage");
const PAGE_SEGMENT_STORAGE_KEY = Symbol.for("dinou.page.segment.storage");
const LAYOUT_SEGMENT_STORAGE_KEY = Symbol.for("dinou.layout.segment.storage");
const CACHED_SLOT_STORAGE_KEY = Symbol.for("dinou.cached.slot.storage");
const SLOT_DISCOVERY_STORAGE_KEY = Symbol.for("dinou.slot.discovery.storage");
const RUNTIME_STATIC_SUSPENSE_STORAGE_KEY = Symbol.for(
  "dinou.runtime.static.suspense.storage"
);
const PAGE_ROOT_ELEMENTS_KEY = Symbol.for("dinou.page.root.elements");
const LAYOUT_ROOT_ELEMENTS_KEY = Symbol.for("dinou.layout.root.elements");
const LAYOUT_CHILDREN_PLACEHOLDERS_KEY = Symbol.for(
  "dinou.layout.children.placeholders"
);
const NO_DYNAMIC_STATE_KEY = Symbol.for("dinou.ppr.noDynamic.state");

if (!globalThis[PPR_STORAGE_KEY]) {
  globalThis[PPR_STORAGE_KEY] = new AsyncLocalStorage();
}
if (!globalThis[PAGE_SEGMENT_STORAGE_KEY]) {
  globalThis[PAGE_SEGMENT_STORAGE_KEY] = new AsyncLocalStorage();
}
if (!globalThis[LAYOUT_SEGMENT_STORAGE_KEY]) {
  globalThis[LAYOUT_SEGMENT_STORAGE_KEY] = new AsyncLocalStorage();
}
if (!globalThis[CACHED_SLOT_STORAGE_KEY]) {
  globalThis[CACHED_SLOT_STORAGE_KEY] = new AsyncLocalStorage();
}
if (!globalThis[SLOT_DISCOVERY_STORAGE_KEY]) {
  globalThis[SLOT_DISCOVERY_STORAGE_KEY] = new AsyncLocalStorage();
}
if (!globalThis[RUNTIME_STATIC_SUSPENSE_STORAGE_KEY]) {
  globalThis[RUNTIME_STATIC_SUSPENSE_STORAGE_KEY] = new AsyncLocalStorage();
}
if (!globalThis[PAGE_ROOT_ELEMENTS_KEY]) {
  globalThis[PAGE_ROOT_ELEMENTS_KEY] = new WeakMap();
}
if (!globalThis[LAYOUT_ROOT_ELEMENTS_KEY]) {
  globalThis[LAYOUT_ROOT_ELEMENTS_KEY] = new WeakMap();
}
if (!globalThis[LAYOUT_CHILDREN_PLACEHOLDERS_KEY]) {
  globalThis[LAYOUT_CHILDREN_PLACEHOLDERS_KEY] = new WeakSet();
}
if (!globalThis[NO_DYNAMIC_STATE_KEY]) {
  globalThis[NO_DYNAMIC_STATE_KEY] = { currentComponentNoDynamic: false };
}

const pprStorage = globalThis[PPR_STORAGE_KEY];
const pageSegmentStorage = globalThis[PAGE_SEGMENT_STORAGE_KEY];
const layoutSegmentStorage = globalThis[LAYOUT_SEGMENT_STORAGE_KEY];
const cachedSlotStorage = globalThis[CACHED_SLOT_STORAGE_KEY];
const slotDiscoveryStorage = globalThis[SLOT_DISCOVERY_STORAGE_KEY];
const runtimeStaticSuspenseStorage = globalThis[RUNTIME_STATIC_SUSPENSE_STORAGE_KEY];
const pageRootElements = globalThis[PAGE_ROOT_ELEMENTS_KEY];
const layoutRootElements = globalThis[LAYOUT_ROOT_ELEMENTS_KEY];
const layoutChildrenPlaceholders = globalThis[LAYOUT_CHILDREN_PLACEHOLDERS_KEY];

const NO_DYNAMIC_HOOK_KEY = Symbol.for("dinou.ppr.noDynamic.hook");
export const SKIP_STATIC_SUSPENSE_SYMBOL = Symbol.for("dinou.ppr.skipStatic");
const noDynamicState = globalThis[NO_DYNAMIC_STATE_KEY];

export function runInRuntimeStaticSuspense(callback) {
  const prev = runtimeStaticSuspenseStorage.getStore();
  return runtimeStaticSuspenseStorage.run(
    { active: true, depth: (prev?.depth || 0) + 1 },
    callback
  );
}

export function runInRuntimeDynamicHole(callback, holeId = null) {
  const prev = runtimeStaticSuspenseStorage.getStore();
  const slotDepthAtSuspense =
    prev && typeof prev.slotDepthAtSuspense === "number"
      ? prev.slotDepthAtSuspense
      : cachedSlotStorage.getStore()?.depth || 0;
  return runtimeStaticSuspenseStorage.run(
    {
      active: false,
      depth: 0,
      holeId: holeId || prev?.holeId || null,
      idCount: 0,
      childHoleCount: 0,
      slotDepthAtSuspense,
    },
    callback
  );
}

export function getActiveRuntimeDynamicHoleStore() {
  const store = runtimeStaticSuspenseStorage.getStore();
  return store && store.holeId ? store : null;
}

export function isInsideRuntimeSuspenseOutsideSlot() {
  const currentSlotDepth = cachedSlotStorage.getStore()?.depth || 0;
  if (currentSlotDepth > 0) return false;
  const holeStore = getActiveRuntimeDynamicHoleStore();
  if (holeStore && (holeStore.slotDepthAtSuspense || 0) === 0) {
    return true;
  }
  return isInsideOuterSuspenseOutsideSlot();
}

export function isRuntimeStaticSuspenseActive() {
  const store = runtimeStaticSuspenseStorage.getStore();
  return Boolean(store && store.active && store.depth > 0);
}

export function noDynamic() {
  if (isRuntimeStaticSuspenseActive() && !isPprBuildActive()) {
    const err = new Error(
      "[Dinou PPR] Skipping static noDynamic() subtree during runtime hole traversal"
    );
    err.$$typeof = SKIP_STATIC_SUSPENSE_SYMBOL;
    throw err;
  }
  noDynamicState.currentComponentNoDynamic = true;
  const store = pprStorage.getStore();
  if (store && store.suspenseDepth > 0) {
    store.noDynamic = true;
  }
}

if (typeof globalThis !== "undefined") {
  globalThis[NO_DYNAMIC_HOOK_KEY] = noDynamic;
}

export function resetComponentNoDynamicFlag() {
  noDynamicState.currentComponentNoDynamic = false;
}

export function consumeComponentNoDynamicFlag() {
  const val = noDynamicState.currentComponentNoDynamic;
  noDynamicState.currentComponentNoDynamic = false;
  return val;
}

export function isNoDynamicActive() {
  if (noDynamicState.currentComponentNoDynamic) return true;
  const store = pprStorage.getStore();
  return Boolean(store && store.noDynamic);
}

export function runInCachedSlot(callback, options = {}) {
  const prev = cachedSlotStorage.getStore();
  const isCached = options?.cached !== false;
  const slotId =
    typeof options === "string"
      ? options
      : options?.slotId || prev?.slotId || null;
  return cachedSlotStorage.run(
    {
      depth: (prev?.depth || 0) + (isCached ? 1 : 0),
      slotId,
      idCount: 0,
    },
    callback
  );
}

export function getActiveCachedSlotStore() {
  return cachedSlotStorage.getStore() || null;
}

export function isInsideCachedSlot() {
  return Boolean((cachedSlotStorage.getStore()?.depth || 0) > 0);
}

export function runInSlotDiscovery(callback) {
  return slotDiscoveryStorage.run({ active: true }, callback);
}

export function isSlotDiscoveryActive() {
  return Boolean(slotDiscoveryStorage.getStore()?.active);
}

export function markPageRootElement(el, segmentPpr = null) {
  if (el && typeof el === "object") {
    pageRootElements.set(el, {
      isPpr: typeof segmentPpr === "boolean" ? segmentPpr : null,
    });
  }
  return el;
}

export function isPageRootElement(el) {
  return Boolean(el && typeof el === "object" && pageRootElements.has(el));
}

export function getPageRootPpr(el) {
  if (el && typeof el === "object" && pageRootElements.has(el)) {
    return pageRootElements.get(el)?.isPpr ?? null;
  }
  return null;
}

export function markLayoutRootElement(el, segmentPpr = null) {
  if (el && typeof el === "object") {
    layoutRootElements.set(el, {
      isPpr: typeof segmentPpr === "boolean" ? segmentPpr : null,
    });
  }
  return el;
}

export function isLayoutRootElement(el) {
  return Boolean(el && typeof el === "object" && layoutRootElements.has(el));
}

export function getLayoutRootPpr(el) {
  if (el && typeof el === "object" && layoutRootElements.has(el)) {
    return layoutRootElements.get(el)?.isPpr ?? null;
  }
  return null;
}

export function runWithSegmentPpr(segmentPpr, callback) {
  const runClearedRuntimeHole = () =>
    runtimeStaticSuspenseStorage.run(null, callback);
  const store = getPprStore();
  if (!store) {
    return runClearedRuntimeHole();
  }
  const nextStore = {
    ...store,
    isPpr: typeof segmentPpr === "boolean" ? segmentPpr : store.isPpr,
    suspenseDepth: 0,
    currentHoleId: null,
    holeStack: [],
    noDynamic: false,
    hasOuterSuspenseOutsideSlot: false,
    pendingEffects: null,
    parentPendingEffects: null,
  };
  return pprStorage.run(nextStore, runClearedRuntimeHole);
}

export function createLayoutChildrenPlaceholder() {
  const placeholder = {
    $$typeof: Symbol.for("react.transitional.element"),
    type: Symbol.for("dinou.layout.children.placeholder"),
    key: null,
    ref: null,
    props: {},
  };
  layoutChildrenPlaceholders.add(placeholder);
  return placeholder;
}

export function isLayoutChildrenPlaceholder(el) {
  return Boolean(
    el &&
      typeof el === "object" &&
      (layoutChildrenPlaceholders.has(el) ||
        el.type === Symbol.for("dinou.layout.children.placeholder"))
  );
}

export function runInPageSegment(callback, storeOverride = null) {
  const prev = pageSegmentStorage.getStore();
  const store =
    storeOverride || prev || { active: true, idCount: 0, holeCount: 0 };
  return layoutSegmentStorage.run(null, () =>
    pageSegmentStorage.run(store, callback)
  );
}

export function getActivePageSegmentStore() {
  return pageSegmentStorage.getStore() || null;
}

export function isInsidePageSegment() {
  return Boolean(pageSegmentStorage.getStore()?.active);
}

export function runInLayoutSegment(callback, storeOverride = null) {
  const prev = layoutSegmentStorage.getStore();
  const store =
    storeOverride || prev || { active: true, idCount: 0, holeCount: 0 };
  return pageSegmentStorage.run(null, () =>
    layoutSegmentStorage.run(store, callback)
  );
}

export function getActiveLayoutSegmentStore() {
  return layoutSegmentStorage.getStore() || null;
}

export function isInsideLayoutSegment() {
  return Boolean(
    layoutSegmentStorage.getStore()?.active && !isInsidePageSegment()
  );
}

/**
 * Executes a function within a PPR pre-render context.
 * @param {object} options
 * @param {Function} callback
 * @returns {Promise<any>}
 */
export function runWithPprContext(options, callback) {
  const sharedCounter = { nextHoleIndex: 0 };
  const sharedHoles = new Map();
  const store = {
    isPpr: Boolean(options?.isPpr),
    suspenseDepth: 0,
    currentHoleId: null,
    holeStack: [],
    holes: sharedHoles,
    counter: sharedCounter,
    get nextHoleIndex() {
      return sharedCounter.nextHoleIndex;
    },
    set nextHoleIndex(val) {
      sharedCounter.nextHoleIndex = val;
    },
    ...options,
  };
  return pprStorage.run(store, callback);
}

export function getPprStore() {
  return pprStorage.getStore() || null;
}

export function isPprBuildActive() {
  const store = getPprStore();
  return Boolean(store && store.isPpr);
}

export function isInsideSuspense() {
  const store = getPprStore();
  return Boolean(store && store.suspenseDepth > 0);
}

export function isInsideOuterSuspenseOutsideSlot() {
  const store = getPprStore();
  return Boolean(
    store && store.suspenseDepth > 0 && store.hasOuterSuspenseOutsideSlot
  );
}

export function rollbackPprHolesAfter(countBefore) {
  const store = getPprStore();
  if (!store) return;
  const target = Number(countBefore) || 0;
  const current = store.counter
    ? store.counter.nextHoleIndex
    : store.nextHoleIndex || 0;
  if (current > target) {
    for (let i = target + 1; i <= current; i++) {
      store.holes.delete(`ppr-hole-${i}`);
    }
    if (store.counter) {
      store.counter.nextHoleIndex = target;
    } else {
      store.nextHoleIndex = target;
    }
  }
}

export function resetPprHoles(startIndex = 0) {
  const store = getPprStore();
  if (store) {
    const startVal = Number(startIndex) || 0;
    if (store.counter) {
      store.counter.nextHoleIndex = startVal;
    } else {
      store.nextHoleIndex = startVal;
    }
    if (store.holes && typeof store.holes.clear === "function") {
      store.holes.clear();
    }
    store.suspenseDepth = 0;
    store.currentHoleId = null;
    if (Array.isArray(store.holeStack)) {
      store.holeStack.length = 0;
    }
  }
}

export function getPprHoleCounter() {
  const store = getPprStore();
  if (store) {
    return store.counter ? store.counter.nextHoleIndex : store.nextHoleIndex || 0;
  }
  return 0;
}

export function runInSuspense(callback, explicitHoleId = null) {
  const store = getPprStore();
  if (!store || !store.isPpr) {
    let holeId = explicitHoleId;
    if (!holeId) {
      const holeStore = getActiveRuntimeDynamicHoleStore();
      const layoutStore = getActiveLayoutSegmentStore();
      const pageStore = getActivePageSegmentStore();
      if (holeStore && holeStore.holeId) {
        holeStore.childHoleCount = (holeStore.childHoleCount || 0) + 1;
        holeId = `${holeStore.holeId}-${holeStore.childHoleCount}`;
      } else if (
        layoutStore &&
        layoutStore.active &&
        !isInsidePageSegment()
      ) {
        layoutStore.holeCount = (layoutStore.holeCount || 0) + 1;
        holeId = `layout-hole-${layoutStore.holeCount}`;
      } else if (pageStore && pageStore.active) {
        pageStore.holeCount = (pageStore.holeCount || 0) + 1;
        holeId = `ppr-hole-${pageStore.holeCount}`;
      } else {
        holeId = "ppr-hole-1";
      }
    }
    return callback(holeId, null);
  }
  let holeId = explicitHoleId;
  if (!holeId) {
    if (store.counter) {
      store.counter.nextHoleIndex++;
      holeId = `ppr-hole-${store.counter.nextHoleIndex}`;
    } else {
      store.nextHoleIndex++;
      holeId = `ppr-hole-${store.nextHoleIndex}`;
    }
  }
  const nextStack = Array.isArray(store.holeStack)
    ? [...store.holeStack, holeId]
    : [holeId];
  const pendingEffects = [];
  const slotDepthAtSuspense = cachedSlotStorage.getStore()?.depth || 0;
  const hasOuterSuspenseOutsideSlot = Boolean(
    store.hasOuterSuspenseOutsideSlot || slotDepthAtSuspense === 0
  );
  const childStore = {
    ...store,
    suspenseDepth: store.suspenseDepth + 1,
    currentHoleId: holeId,
    holeStack: nextStack,
    noDynamic: false,
    settled: false,
    slotDepthAtSuspense,
    hasOuterSuspenseOutsideSlot,
    pendingEffects,
    parentPendingEffects: Array.isArray(store.pendingEffects)
      ? store.pendingEffects
      : null,
  };
  return pprStorage.run(childStore, () => callback(holeId, childStore));
}

export function deferPprSuspenseEffect(effectFn) {
  const store = getPprStore();
  if (
    store &&
    store.isPpr &&
    store.suspenseDepth > 0 &&
    Array.isArray(store.pendingEffects) &&
    typeof effectFn === "function"
  ) {
    if (store.settled) {
      return true;
    }
    store.pendingEffects.push(effectFn);
    return true;
  }
  return false;
}

export async function commitPprSuspenseEffects(childStore) {
  if (!childStore || !Array.isArray(childStore.pendingEffects)) return;
  const effects = childStore.pendingEffects.splice(0);
  if (effects.length === 0) return;
  if (Array.isArray(childStore.parentPendingEffects)) {
    childStore.parentPendingEffects.push(...effects);
    return;
  }
  for (const fn of effects) {
    await fn();
  }
}

export function enterSuspense(holeId = null) {
  const store = getPprStore();
  if (store) {
    store.suspenseDepth++;
    if (!holeId) {
      if (store.counter) {
        store.counter.nextHoleIndex++;
        holeId = `ppr-hole-${store.counter.nextHoleIndex}`;
      } else {
        store.nextHoleIndex++;
        holeId = `ppr-hole-${store.nextHoleIndex}`;
      }
    }
    if (Array.isArray(store.holeStack)) {
      store.holeStack.push(holeId);
    }
    store.currentHoleId = holeId;
    return holeId;
  }
  return null;
}

export function exitSuspense() {
  const store = getPprStore();
  if (store) {
    store.suspenseDepth = Math.max(0, store.suspenseDepth - 1);
    if (Array.isArray(store.holeStack) && store.holeStack.length > 0) {
      store.holeStack.pop();
      store.currentHoleId =
        store.holeStack.length > 0
          ? store.holeStack[store.holeStack.length - 1]
          : null;
    } else if (store.suspenseDepth === 0) {
      store.currentHoleId = null;
    }
  }
}

export function markDynamicAccess(type = "dynamic") {
  const store = getPprStore();
  if (
    store &&
    store.isPpr &&
    store.suspenseDepth > 0 &&
    store.hasOuterSuspenseOutsideSlot
  ) {
    const idx = store.counter ? store.counter.nextHoleIndex : store.nextHoleIndex;
    const holeId = store.currentHoleId || `ppr-hole-${idx}`;
    const error = new Error(
      `[Dinou PPR] Dynamic access to '${type}' postponed inside Suspense`
    );
    error.$$typeof = Symbol.for("dinou.ppr.postpone");
    error.pprType = type;
    error.holeId = holeId;
    throw error;
  }
}

export function registerHole(holeId, meta = {}) {
  const store = getPprStore();
  if (store && holeId) {
    store.holes.set(holeId, {
      id: holeId,
      registeredAt: Date.now(),
      ...meta,
    });
  }
}

export function getRegisteredHoles() {
  const store = getPprStore();
  if (store) {
    return Array.from(store.holes.keys());
  }
  return [];
}

export default {
  noDynamic,
  SKIP_STATIC_SUSPENSE_SYMBOL,
  runInRuntimeStaticSuspense,
  runInRuntimeDynamicHole,
  getActiveRuntimeDynamicHoleStore,
  isRuntimeStaticSuspenseActive,
  resetComponentNoDynamicFlag,
  consumeComponentNoDynamicFlag,
  isNoDynamicActive,
  runInCachedSlot,
  isInsideCachedSlot,
  runInSlotDiscovery,
  isSlotDiscoveryActive,
  markPageRootElement,
  isPageRootElement,
  getPageRootPpr,
  markLayoutRootElement,
  isLayoutRootElement,
  getLayoutRootPpr,
  runWithSegmentPpr,
  createLayoutChildrenPlaceholder,
  isLayoutChildrenPlaceholder,
  runInPageSegment,
  isInsidePageSegment,
  runInLayoutSegment,
  isInsideLayoutSegment,
  runWithPprContext,
  getPprStore,
  isPprBuildActive,
  isInsideSuspense,
  isInsideOuterSuspenseOutsideSlot,
  rollbackPprHolesAfter,
  resetPprHoles,
  getPprHoleCounter,
  runInSuspense,
  deferPprSuspenseEffect,
  commitPprSuspenseEffects,
  enterSuspense,
  exitSuspense,
  markDynamicAccess,
  registerHole,
  getRegisteredHoles,
};
