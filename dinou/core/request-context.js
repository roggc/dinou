// dinou/core/request-context.js

const DINOU_CONTEXT_KEY = Symbol.for("dinou.request.context.storage");
let requestStorage;

if (typeof window === "undefined") {
  const nodeRequire = eval("require");

  const { AsyncLocalStorage } = nodeRequire("node:async_hooks");

  if (!global[DINOU_CONTEXT_KEY]) {
    global[DINOU_CONTEXT_KEY] = new AsyncLocalStorage();
  }

  requestStorage = global[DINOU_CONTEXT_KEY];
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
