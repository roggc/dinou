import { isPprBuildActive, isInsideOuterSuspenseOutsideSlot, markDynamicAccess } from "./ppr-context.js";

function triggerBailout(label, onBailout) {
  if (isPprBuildActive() && isInsideOuterSuspenseOutsideSlot()) {
    markDynamicAccess(label);
  } else if (typeof onBailout === "function") {
    onBailout();
  }
}

export const BAILOUT_RAW_TARGET = Symbol.for("dinou.bailout.raw");

export function unwrapBailoutProxy(value) {
  if (value && (typeof value === "object" || typeof value === "function")) {
    return value[BAILOUT_RAW_TARGET] || value;
  }
  return value;
}

/**
 * Creates a transparent proxy that spies on property accesses
 * to detect dynamic usage and trigger a bailout callback.
 * 
 * @param {Object} target - The object to proxy (cookies, headers, query...)
 * @param {string} label - Name for logging/debugging
 * @param {Function} onBailout - Callback invoked when property access occurs
 * @returns {Proxy}
 */
export function createBailoutProxy(target, label = "Context", onBailout) {
  const safeTarget = target || {};

  return new Proxy(safeTarget, {
    get(t, prop, receiver) {
      if (prop === BAILOUT_RAW_TARGET) {
        return t;
      }
      if (
        typeof prop === "symbol" ||
        prop === "inspect" ||
        prop === "valueOf" ||
        prop === "toString" ||
        prop === "constructor" ||
        prop === "prototype"
      ) {
        return Reflect.get(t, prop, receiver);
      }

      triggerBailout(label, onBailout);

      return Reflect.get(t, prop, receiver);
    },

    ownKeys(t) {
      triggerBailout(label, onBailout);
      return Reflect.ownKeys(t);
    },

    has(t, prop) {
      if (
        typeof prop !== "symbol" &&
        prop !== "constructor" &&
        prop !== "prototype"
      ) {
        triggerBailout(label, onBailout);
      }
      return Reflect.has(t, prop);
    },
  });
}

export default {
  BAILOUT_RAW_TARGET,
  unwrapBailoutProxy,
  createBailoutProxy,
};
