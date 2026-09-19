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
      const reqFn =
        typeof globalThis.__dinou_require__ === "function"
          ? globalThis.__dinou_require__
          : typeof eval === "function"
            ? eval("require")
            : null;
      if (typeof reqFn === "function") {
        const asyncHooks = reqFn("node:async_hooks") || reqFn("async_hooks");
        AsyncLocalStorageClass = asyncHooks?.AsyncLocalStorage;
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

function getContext() {
  if (typeof window !== "undefined") {
    console.error(
      "[Dinou] ❌ You are calling getContext() inside a Client Component running in the browser. This function is Server-Only. Pass the data as props from a Server Component instead."
    );
    return {};
  }
  if (!requestStorage) return undefined;
  const store = requestStorage.getStore();
  return store;
}

module.exports = {
  requestStorage,
  getContext,
};
