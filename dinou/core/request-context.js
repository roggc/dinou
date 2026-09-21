// dinou/core/request-context.js

const DINOU_CONTEXT_KEY = Symbol.for("dinou.request.context.storage");
let requestStorage;

if (typeof window === "undefined") {
  let AsyncLocalStorageClass;

  if (typeof globalThis.AsyncLocalStorage !== "undefined") {
    AsyncLocalStorageClass = globalThis.AsyncLocalStorage;
  }

  if (!AsyncLocalStorageClass) {
    try {
      if (typeof globalThis.__dinou_require__ === "function") {
        AsyncLocalStorageClass = globalThis.__dinou_require__("node:async_hooks")?.AsyncLocalStorage;
      } else if (typeof process !== "undefined" && process.versions && process.versions.node) {
        const nodeRequire = (0, eval)("require");
        AsyncLocalStorageClass = nodeRequire("node:async_hooks")?.AsyncLocalStorage;
      }
    } catch (e) {}
  }

  if (AsyncLocalStorageClass) {
    if (!globalThis[DINOU_CONTEXT_KEY]) {
      globalThis[DINOU_CONTEXT_KEY] = new AsyncLocalStorageClass();
    }
    requestStorage = globalThis[DINOU_CONTEXT_KEY];
  } else {
    requestStorage = {
      run: (store, callback) => callback(),
      getStore: () => undefined,
    };
  }
} else {
  requestStorage = {
    run: (store, callback) => callback(),
    getStore: () => undefined,
  };
}

function setCurrentContext(ctx) {
  if (typeof globalThis !== "undefined") {
    globalThis[Symbol.for("dinou.request.context.current")] = ctx;
  }
}

function getCurrentContext() {
  if (typeof globalThis !== "undefined") {
    return globalThis[Symbol.for("dinou.request.context.current")];
  }
  return undefined;
}

function getContext() {
  if (typeof window !== "undefined") {
    console.error(
      "[Dinou] ❌ You are calling getContext() inside a Client Component running in the browser. This function is Server-Only. Pass the data as props from a Server Component instead."
    );
    return {};
  }
  const store = requestStorage?.getStore();
  return store || getCurrentContext() || {};
}

module.exports = {
  requestStorage,
  getContext,
  setCurrentContext,
  getCurrentContext,
};
