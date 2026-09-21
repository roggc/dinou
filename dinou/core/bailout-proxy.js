// dinou/core/bailout-proxy.js

/**
 * Creates a transparent proxy that spies on property accesses
 * to detect dynamic usage and trigger a bailout callback.
 * 
 * @param {Object} target - The object to proxy (cookies, headers, query...)
 * @param {string} label - Name for logging/debugging
 * @param {Function} onBailout - Callback invoked when property access occurs
 * @returns {Proxy}
 */
function createBailoutProxy(target, label = "Context", onBailout) {
  const safeTarget = target || {};

  return new Proxy(safeTarget, {
    get(t, prop, receiver) {
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

      if (typeof onBailout === "function") {
        onBailout();
      }

      return Reflect.get(t, prop, receiver);
    },

    ownKeys(t) {
      if (typeof onBailout === "function") {
        onBailout();
      }
      return Reflect.ownKeys(t);
    },

    has(t, prop) {
      if (
        typeof prop !== "symbol" &&
        prop !== "constructor" &&
        prop !== "prototype" &&
        typeof onBailout === "function"
      ) {
        onBailout();
      }
      return Reflect.has(t, prop);
    },
  });
}

module.exports = {
  createBailoutProxy,
};
