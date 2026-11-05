// dinou/core/ppr-context.js
// PPR Pre-rendering Context and Suspense Hole Tracker for Dinou.

import { AsyncLocalStorage } from "node:async_hooks";

const pprStorage = new AsyncLocalStorage();
const pageSegmentStorage = new AsyncLocalStorage();
const layoutSegmentStorage = new AsyncLocalStorage();
const cachedSlotStorage = new AsyncLocalStorage();
const slotDiscoveryStorage = new AsyncLocalStorage();
const runtimeStaticSuspenseStorage = new AsyncLocalStorage();
const pageRootElements = new WeakSet();

const NO_DYNAMIC_HOOK_KEY = Symbol.for("dinou.ppr.noDynamic.hook");
export const SKIP_STATIC_SUSPENSE_SYMBOL = Symbol.for("dinou.ppr.skipStatic");
let currentComponentNoDynamic = false;

export function runInRuntimeStaticSuspense(callback) {
  const prev = runtimeStaticSuspenseStorage.getStore();
  return runtimeStaticSuspenseStorage.run(
    { active: true, depth: (prev?.depth || 0) + 1 },
    callback
  );
}

export function runInRuntimeDynamicHole(callback) {
  return runtimeStaticSuspenseStorage.run({ active: false, depth: 0 }, callback);
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
  currentComponentNoDynamic = true;
  const store = pprStorage.getStore();
  if (store && store.suspenseDepth > 0) {
    store.noDynamic = true;
  }
}

if (typeof globalThis !== "undefined") {
  globalThis[NO_DYNAMIC_HOOK_KEY] = noDynamic;
}

export function resetComponentNoDynamicFlag() {
  currentComponentNoDynamic = false;
}

export function consumeComponentNoDynamicFlag() {
  const val = currentComponentNoDynamic;
  currentComponentNoDynamic = false;
  return val;
}

export function isNoDynamicActive() {
  if (currentComponentNoDynamic) return true;
  const store = pprStorage.getStore();
  return Boolean(store && store.noDynamic);
}

export function runInCachedSlot(callback) {
  const prev = cachedSlotStorage.getStore();
  return cachedSlotStorage.run({ depth: (prev?.depth || 0) + 1 }, callback);
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

export function markPageRootElement(el) {
  if (el && typeof el === "object") {
    pageRootElements.add(el);
  }
  return el;
}

export function isPageRootElement(el) {
  return Boolean(el && typeof el === "object" && pageRootElements.has(el));
}

export function runInPageSegment(callback) {
  return pageSegmentStorage.run({ active: true }, callback);
}

export function isInsidePageSegment() {
  return Boolean(pageSegmentStorage.getStore()?.active);
}

export function runInLayoutSegment(callback) {
  return layoutSegmentStorage.run({ active: true }, callback);
}

export function isInsideLayoutSegment() {
  return Boolean(layoutSegmentStorage.getStore()?.active);
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
  if (!store) {
    return callback(null, null);
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
  isRuntimeStaticSuspenseActive,
  resetComponentNoDynamicFlag,
  consumeComponentNoDynamicFlag,
  isNoDynamicActive,
  runInCachedSlot,
  isInsideCachedSlot,
  runInSlotDiscovery,
  isSlotDiscoveryActive,
  runInPageSegment,
  isInsidePageSegment,
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
