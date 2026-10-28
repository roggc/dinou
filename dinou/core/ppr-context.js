// dinou/core/ppr-context.js
// PPR Pre-rendering Context and Suspense Hole Tracker for Dinou.

import { AsyncLocalStorage } from "node:async_hooks";

const pprStorage = new AsyncLocalStorage();

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

export function resetPprHoles() {
  const store = getPprStore();
  if (store) {
    if (store.counter) {
      store.counter.nextHoleIndex = 0;
    } else {
      store.nextHoleIndex = 0;
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

export function runInSuspense(callback, explicitHoleId = null) {
  const store = getPprStore();
  if (!store) {
    return callback(null);
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
  const childStore = {
    ...store,
    suspenseDepth: store.suspenseDepth + 1,
    currentHoleId: holeId,
    holeStack: nextStack,
  };
  return pprStorage.run(childStore, () => callback(holeId));
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
  if (store && store.isPpr && store.suspenseDepth > 0) {
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
  runWithPprContext,
  getPprStore,
  isPprBuildActive,
  isInsideSuspense,
  resetPprHoles,
  runInSuspense,
  enterSuspense,
  exitSuspense,
  markDynamicAccess,
  registerHole,
  getRegisteredHoles,
};
