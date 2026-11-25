// dinou/core/request-context.js
import { createUnifiedEnv } from "./runtime-env.js";

const DINOU_CONTEXT_KEY = Symbol.for("dinou.request.context.storage");
let requestStorage;

if (typeof window === "undefined") {
  let AsyncLocalStorageClass =
    typeof globalThis.AsyncLocalStorage !== "undefined"
      ? globalThis.AsyncLocalStorage
      : undefined;

  if (!AsyncLocalStorageClass) {
    try {
      if (typeof globalThis.__dinou_require__ === "function") {
        AsyncLocalStorageClass = globalThis.__dinou_require__("node:async_hooks")?.AsyncLocalStorage;
      } else if (typeof process !== "undefined" && typeof process.getBuiltinModule === "function") {
        AsyncLocalStorageClass = process.getBuiltinModule("node:async_hooks")?.AsyncLocalStorage;
      } else if (typeof process !== "undefined" && process.versions && (process.versions.node || process.versions.bun)) {
        const getRequire = new Function("return typeof require !== 'undefined' ? require : null");
        const nodeRequire = getRequire();
        if (nodeRequire) {
          AsyncLocalStorageClass = nodeRequire("node:async_hooks")?.AsyncLocalStorage;
        }
      }
    } catch (e) {}
  }

  if (AsyncLocalStorageClass) {
    if (typeof globalThis.AsyncLocalStorage === "undefined") {
      globalThis.AsyncLocalStorage = AsyncLocalStorageClass;
    }
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

const noopResponseProxy = Object.freeze({
  cookie() {},
  clearCookie() {},
  setHeader() {},
  redirect() {},
  status() {},
});

function createFallbackServerContext() {
  const unifiedEnv = createUnifiedEnv();
  return {
    req: {
      query: {},
      cookies: {},
      headers: {},
      path: "/",
      rawPath: "/",
      isRscRequest: false,
      method: "GET",
      env: unifiedEnv,
      ctx: null,
    },
    res: noopResponseProxy,
    env: unifiedEnv,
    ctx: null,
  };
}

function getContext() {
  if (typeof window !== "undefined") {
    console.error(
      "[Dinou] ❌ You are calling getContext() inside a Client Component running in the browser. This function is Server-Only. Pass the data as props from a Server Component instead."
    );
    return {
      req: {
        query: {},
        cookies: {},
        headers: {},
        path: "/",
        rawPath: "/",
        isRscRequest: false,
        method: "GET",
        env: {},
        ctx: null,
      },
      res: noopResponseProxy,
      env: {},
      ctx: null,
    };
  }
  const store = requestStorage?.getStore() || getCurrentContext();
  if (store) {
    if (!store.env) {
      store.env = createUnifiedEnv(store.platformContext?.env);
    }
    if (store.req && !store.req.env) {
      store.req.env = store.env;
    }
    return store;
  }
  return createFallbackServerContext();
}

const RESERVED_CTX_KEYS = new Set([
  "req",
  "res",
  "env",
  "ctx",
  "platformContext",
  "_markDynamic",
  "_dynamicState",
  "_hasRedirected",
  "_isStaticHtmlRender",
  "_isPprRuntimeResume",
  "_isSlotDiscovery",
  "_slotTags",
  "_layoutSlotTags",
  "_pageSlotTags",
  "_resolvedPageClientJsx",
  "_resolvedLayoutClientJsx",
  "_hasResolvedSegments",
  "_redirectLocation",
  "_dinouUseIdCount",
]);

const RESERVED_REQ_KEYS = new Set([
  "cookies",
  "headers",
  "query",
  "path",
  "rawPath",
  "isRscRequest",
  "url",
  "method",
  "env",
  "ctx",
]);

function copyCustomContextProperties(source, target) {
  if (!source || !target) return;
  for (const key of Object.keys(source)) {
    if (!RESERVED_CTX_KEYS.has(key)) {
      target[key] = source[key];
    }
  }
  if (source.req && target.req) {
    for (const key of Object.keys(source.req)) {
      if (!RESERVED_REQ_KEYS.has(key)) {
        target.req[key] = source.req[key];
      }
    }
  }
}

export {
  requestStorage,
  getContext,
  setCurrentContext,
  getCurrentContext,
  copyCustomContextProperties,
};
export default {
  requestStorage,
  getContext,
  setCurrentContext,
  getCurrentContext,
  copyCustomContextProperties,
};
