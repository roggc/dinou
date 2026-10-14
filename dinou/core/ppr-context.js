// dinou/core/ppr-context.js
// PPR Pre-rendering Context and Suspense Hole Tracker for Dinou v7.2.

const { AsyncLocalStorage } = require("async_hooks");

const pprStorage = new AsyncLocalStorage();

/**
 * Executes a function within a PPR pre-render context.
 * @param {object} options
 * @param {Function} callback
 * @returns {Promise<any>}
 */
function runWithPprContext(options, callback) {
  const store = {
    isPpr: Boolean(options?.isPpr),
    suspenseDepth: 0,
    currentHoleId: null,
    holes: new Map(),
    nextHoleIndex: 0,
    ...options,
  };
  return pprStorage.run(store, callback);
}

function getPprStore() {
  return pprStorage.getStore() || null;
}

function isPprBuildActive() {
  const store = getPprStore();
  return Boolean(store && store.isPpr);
}

function isInsideSuspense() {
  const store = getPprStore();
  return Boolean(store && store.suspenseDepth > 0);
}

function enterSuspense(holeId = null) {
  const store = getPprStore();
  if (store) {
    store.suspenseDepth++;
    if (!holeId) {
      store.nextHoleIndex++;
      holeId = `ppr-hole-${store.nextHoleIndex}`;
    }
    store.currentHoleId = holeId;
    return holeId;
  }
  return null;
}

function exitSuspense() {
  const store = getPprStore();
  if (store) {
    store.suspenseDepth = Math.max(0, store.suspenseDepth - 1);
    if (store.suspenseDepth === 0) {
      store.currentHoleId = null;
    }
  }
}

function markDynamicAccess(type = "dynamic") {
  const store = getPprStore();
  if (store && store.isPpr && store.suspenseDepth > 0) {
    const holeId = store.currentHoleId || `ppr-hole-${store.nextHoleIndex}`;
    const error = new Error(`[Dinou PPR] Dynamic access to '${type}' postponed inside Suspense`);
    error.$$typeof = Symbol.for("dinou.ppr.postpone");
    error.pprType = type;
    error.holeId = holeId;
    throw error;
  }
}

function registerHole(holeId, meta = {}) {
  const store = getPprStore();
  if (store) {
    store.holes.set(holeId, {
      id: holeId,
      registeredAt: Date.now(),
      ...meta,
    });
  }
}

function getRegisteredHoles() {
  const store = getPprStore();
  if (store) {
    return Array.from(store.holes.keys());
  }
  return [];
}

module.exports = {
  runWithPprContext,
  getPprStore,
  isPprBuildActive,
  isInsideSuspense,
  enterSuspense,
  exitSuspense,
  markDynamicAccess,
  registerHole,
  getRegisteredHoles,
};
