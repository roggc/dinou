import React from "react";
import { createRequire } from "node:module";
import {
  isPprBuildActive,
  getPprStore,
  isInsideSuspense,
  isInsideOuterSuspenseOutsideSlot,
  rollbackPprHolesAfter,
  isInsideCachedSlot,
  getActiveCachedSlotStore,
  getActiveRuntimeDynamicHoleStore,
  runInRuntimeDynamicHole,
  runInSuspense,
  getPprHoleCounter,
  commitPprSuspenseEffects,
  registerHole,
  markDynamicAccess,
  isPageRootElement,
  getPageRootPpr,
  isLayoutRootElement,
  getLayoutRootPpr,
  runWithSegmentPpr,
  isLayoutChildrenPlaceholder,
  runInPageSegment,
  runInLayoutSegment,
  getActivePageSegmentStore,
  getActiveLayoutSegmentStore,
  resetComponentNoDynamicFlag,
  consumeComponentNoDynamicFlag,
  isNoDynamicActive,
  isSlotDiscoveryActive,
} from "./ppr-context.js";
import { getContext } from "./request-context.js";

const REACT_MEMO_CACHE_SENTINEL = Symbol.for("react.memo_cache_sentinel");
const REACT_CONTEXT_TYPE = Symbol.for("react.context");
const CLIENT_REFERENCE_TAG = Symbol.for("react.client.reference");

let fallbackRenderSeq = 0;

function unsupportedHook() {
  throw new Error("This Hook is not supported in Server Components.");
}

function unsupportedRefresh() {
  throw new Error("Refreshing the cache is not supported in Server Components.");
}

function unsupportedContext() {
  throw new Error("Cannot read a Client Context from a Server Component.");
}

function sanitizeIdSegment(val) {
  return String(val || "slot").replace(/[^a-zA-Z0-9_-]/g, "_");
}

function useServerId() {
  const slotStore = getActiveCachedSlotStore();
  if (slotStore && slotStore.slotId) {
    slotStore.idCount = (slotStore.idCount || 0) + 1;
    const safeSlot = sanitizeIdSegment(slotStore.slotId);
    return `_slot_${safeSlot}_dS_${slotStore.idCount.toString(32)}_`;
  }
  if (isSlotDiscoveryActive()) {
    return "_discovery_dS_";
  }
  const holeStore = getActiveRuntimeDynamicHoleStore();
  if (holeStore && holeStore.holeId) {
    holeStore.idCount = (holeStore.idCount || 0) + 1;
    const safeHole = sanitizeIdSegment(holeStore.holeId);
    return `_hole_${safeHole}_dS_${holeStore.idCount.toString(32)}_`;
  }
  const pageStore = getActivePageSegmentStore();
  if (pageStore && pageStore.active) {
    pageStore.idCount = (pageStore.idCount || 0) + 1;
    return `_page_dS_${pageStore.idCount.toString(32)}_`;
  }
  const layoutStore = getActiveLayoutSegmentStore();
  if (layoutStore && layoutStore.active) {
    layoutStore.idCount = (layoutStore.idCount || 0) + 1;
    return `_layout_dS_${layoutStore.idCount.toString(32)}_`;
  }
  const reqCtx = getContext();
  if (reqCtx) {
    reqCtx._dinouUseIdCount = (reqCtx._dinouUseIdCount || 0) + 1;
    return `_page_dS_${reqCtx._dinouUseIdCount.toString(32)}_`;
  }
  const id = ++fallbackRenderSeq;
  return `_dS_${id.toString(32)}_`;
}

function snapshotActiveIdCounts() {
  const slotStore = getActiveCachedSlotStore();
  const holeStore = getActiveRuntimeDynamicHoleStore();
  const pageStore = getActivePageSegmentStore();
  const layoutStore = getActiveLayoutSegmentStore();
  const reqCtx = getContext();
  return {
    slotStore,
    slotCount: slotStore ? slotStore.idCount || 0 : 0,
    holeStore,
    holeCount: holeStore ? holeStore.idCount || 0 : 0,
    pageStore,
    pageCount: pageStore ? pageStore.idCount || 0 : 0,
    layoutStore,
    layoutCount: layoutStore ? layoutStore.idCount || 0 : 0,
    reqCtx,
    reqCount: reqCtx ? reqCtx._dinouUseIdCount || 0 : 0,
    fallbackSeq: fallbackRenderSeq,
  };
}

function restoreActiveIdCounts(snap) {
  if (!snap) return;
  if (snap.slotStore) snap.slotStore.idCount = snap.slotCount;
  if (snap.holeStore) snap.holeStore.idCount = snap.holeCount;
  if (snap.pageStore) snap.pageStore.idCount = snap.pageCount;
  if (snap.layoutStore) snap.layoutStore.idCount = snap.layoutCount;
  if (snap.reqCtx) snap.reqCtx._dinouUseIdCount = snap.reqCount;
  fallbackRenderSeq = snap.fallbackSeq;
}

function useServerUsable(usable) {
  if (
    (usable !== null && typeof usable === "object") ||
    typeof usable === "function"
  ) {
    if (typeof usable.then === "function") {
      if (usable.status === "fulfilled") {
        return usable.value;
      }
      if (usable.status === "rejected") {
        throw usable.reason;
      }
      if (typeof usable.status !== "string") {
        usable.status = "pending";
        usable.then(
          (fulfilledValue) => {
            if (usable.status === "pending") {
              usable.status = "fulfilled";
              usable.value = fulfilledValue;
            }
          },
          (error) => {
            if (usable.status === "pending") {
              usable.status = "rejected";
              usable.reason = error;
            }
          }
        );
        if (usable.status === "fulfilled") {
          return usable.value;
        }
        if (usable.status === "rejected") {
          throw usable.reason;
        }
      }
      throw usable;
    }
    if (usable.$$typeof === REACT_CONTEXT_TYPE) {
      unsupportedContext();
    }
    if (usable.$$typeof === CLIENT_REFERENCE_TAG) {
      if (usable.value != null && usable.value.$$typeof === REACT_CONTEXT_TYPE) {
        unsupportedContext();
      }
      throw new Error("Cannot use() an already resolved Client Reference.");
    }
  }
  throw new Error("An unsupported type was passed to use(): " + String(usable));
}

const DinouServerHooksDispatcher = {
  readContext: unsupportedContext,
  use: useServerUsable,
  useCallback(callback) {
    return callback;
  },
  useContext: unsupportedContext,
  useEffect: unsupportedHook,
  useImperativeHandle: unsupportedHook,
  useLayoutEffect: unsupportedHook,
  useInsertionEffect: unsupportedHook,
  useMemo(nextCreate) {
    return nextCreate();
  },
  useReducer: unsupportedHook,
  useRef: unsupportedHook,
  useState: unsupportedHook,
  useDebugValue() {},
  useDeferredValue: unsupportedHook,
  useTransition: unsupportedHook,
  useSyncExternalStore: unsupportedHook,
  useId: useServerId,
  useHostTransitionStatus: unsupportedHook,
  useFormState: unsupportedHook,
  useActionState: unsupportedHook,
  useOptimistic: unsupportedHook,
  useMemoCache(size) {
    const data = new Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = REACT_MEMO_CACHE_SENTINEL;
    }
    return data;
  },
  useCacheRefresh() {
    return unsupportedRefresh;
  },
  useEffectEvent: unsupportedHook,
};

function getCallerComponentSite() {
  const stack = new Error().stack;
  if (!stack) return null;
  const lines = stack.split("\n");
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (
      !line.includes("useServerId") &&
      !line.includes("patchDispatcherObject") &&
      !line.includes("exports.useId") &&
      !line.includes("exports.use ") &&
      !line.includes("Object.useId") &&
      !line.includes("Object.use ")
    ) {
      return line.trim();
    }
  }
  return null;
}

function patchDispatcherObject(dispatcher, internals) {
  if (!dispatcher || typeof dispatcher !== "object" || dispatcher === DinouServerHooksDispatcher) {
    return;
  }
  if (dispatcher._dinouWrappedDispatcher) {
    return;
  }
  const origUse = typeof dispatcher.use === "function" ? dispatcher.use : null;
  let activeOwnerKey = null;
  let activeIdSnap = null;

  try {
    dispatcher.useId = function dinouPatchedUseId() {
      const owner = internals?.A?.getOwner?.() || getCallerComponentSite();
      if (owner !== activeOwnerKey || !activeIdSnap) {
        activeOwnerKey = owner;
        activeIdSnap = snapshotActiveIdCounts();
      }
      return useServerId();
    };
    if (origUse && origUse !== useServerUsable) {
      dispatcher.use = function dinouPatchedUse(usable) {
        const owner = internals?.A?.getOwner?.() || getCallerComponentSite();
        try {
          return origUse.call(this, usable);
        } catch (err) {
          if (activeIdSnap && (!owner || !activeOwnerKey || owner === activeOwnerKey)) {
            restoreActiveIdCounts(activeIdSnap);
          }
          activeIdSnap = null;
          activeOwnerKey = null;
          throw err;
        }
      };
    }
    Object.defineProperty(dispatcher, "_dinouWrappedDispatcher", {
      value: true,
      enumerable: false,
      configurable: true,
    });
  } catch (_) {}
}

function patchInternalsDispatcherSetter(internals) {
  if (!internals || typeof internals !== "object" || internals._dinouPatchedH) {
    return;
  }
  let currentH = internals.H;
  if (currentH && typeof currentH === "object") {
    patchDispatcherObject(currentH, internals);
  }
  try {
    Object.defineProperty(internals, "H", {
      configurable: true,
      enumerable: true,
      get() {
        return currentH;
      },
      set(nextH) {
        if (nextH && typeof nextH === "object") {
          patchDispatcherObject(nextH, internals);
        }
        currentH = nextH;
      },
    });
    internals._dinouPatchedH = true;
  } catch (_) {}
}

let _cachedReactInternalsList = null;
function getReactInternalsList() {
  if (_cachedReactInternalsList) return _cachedReactInternalsList;
  const set = new Set();
  const addFromModule = (mod) => {
    if (!mod || typeof mod !== "object") return;
    const s = mod.__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    const c = mod.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    if (s && typeof s === "object" && "H" in s) {
      patchInternalsDispatcherSetter(s);
      set.add(s);
    }
    if (c && typeof c === "object" && "H" in c) {
      patchInternalsDispatcherSetter(c);
      set.add(c);
    }
  };
  addFromModule(React);
  try {
    const req = createRequire(import.meta.url);
    try {
      addFromModule(req("react/index.js"));
    } catch (_) {}
    try {
      addFromModule(req("react/react.react-server.js"));
    } catch (_) {}
  } catch (_) {}
  _cachedReactInternalsList = Array.from(set);
  return _cachedReactInternalsList;
}

function ensureServerHooksPatched() {
  const list = getReactInternalsList();
  for (const internals of list) {
    patchInternalsDispatcherSetter(internals);
  }
}

ensureServerHooksPatched();

function invokeWithServerHooksDispatcher(callFn) {
  const internalsList = getReactInternalsList();
  const prevDispatchers = internalsList.map((internals) => internals.H);
  for (const internals of internalsList) {
    internals.H = DinouServerHooksDispatcher;
  }
  try {
    return callFn();
  } finally {
    for (let i = 0; i < internalsList.length; i++) {
      internalsList[i].H = prevDispatchers[i];
    }
  }
}

function isThenable(val) {
  return (
    val !== null &&
    (typeof val === "object" || typeof val === "function") &&
    val.$$typeof !== CLIENT_REFERENCE_TAG && !isClientComponent(val) && typeof val.then === "function"
  );
}

function isCacheSlotComponent(fn) {
  if (!fn || fn.$$typeof === CLIENT_REFERENCE_TAG || isClientComponent(fn)) return false;
  return Boolean(fn.$$dinouCacheSlot || fn.name === "DinouCacheSlot");
}

function containsCacheSlot(node) {
  if (!node || typeof node !== "object") return false;
  if (Array.isArray(node)) {
    return node.some(containsCacheSlot);
  }
  if (node.$$typeof === Symbol.for("react.transitional.element")) {
    if (isCacheSlotComponent(node.type)) return true;
    return containsCacheSlot(node.props?.children);
  }
  return false;
}

async function invokeServerComponentInPpr(fn, callFn) {
  while (true) {
    resetComponentNoDynamicFlag();
    const idSnap = snapshotActiveIdCounts();
    let rawResult;
    try {
      rawResult = invokeWithServerHooksDispatcher(callFn);
    } catch (thrown) {
      restoreActiveIdCounts(idSnap);
      const optedOutOnThrow = consumeComponentNoDynamicFlag();
      if (isThenable(thrown)) {
        if (
          !isCacheSlotComponent(fn) &&
          isPprBuildActive() &&
          isInsideOuterSuspenseOutsideSlot() &&
          !isSlotDiscoveryActive() &&
          !optedOutOnThrow &&
          !isNoDynamicActive()
        ) {
          try {
            thrown.then(null, () => {});
          } catch (_) {}
          markDynamicAccess("async-suspense");
        }
        await thrown;
        continue;
      }
      throw thrown;
    }
    const optedOut = consumeComponentNoDynamicFlag();
    if (
      isThenable(rawResult) &&
      !isCacheSlotComponent(fn) &&
      isPprBuildActive() &&
      isInsideOuterSuspenseOutsideSlot() &&
      !isSlotDiscoveryActive() &&
      !optedOut &&
      !isNoDynamicActive()
    ) {
      try {
        rawResult.then(null, () => {});
      } catch (_) {}
      markDynamicAccess("async-suspense");
    }
    return await rawResult;
  }
}

function cloneWithDevProps(jsx, newProps, resolvedKey, overrideType) {
  const cloned = {
    ...jsx,
    $$typeof: Symbol.for("react.transitional.element"),
    type: overrideType !== undefined ? overrideType : jsx.type,
    props: newProps,
    key: resolvedKey,
  };
  if ("_owner" in jsx) cloned._owner = jsx._owner;
  if ("_store" in jsx && jsx._store) {
    cloned._store = {};
    Object.defineProperty(cloned._store, "validated", {
      configurable: false,
      enumerable: false,
      writable: true,
      value: jsx._store.validated || 1,
    });
  }
  for (const devProp of ["ref", "_debugInfo", "_debugStack", "_debugTask"]) {
    const desc = Object.getOwnPropertyDescriptor(jsx, devProp);
    if (desc) {
      Object.defineProperty(cloned, devProp, desc);
    }
  }
  return cloned;
}

function replaceLayoutChildrenPlaceholder(node, replacement, placeholder) {
  if (node == null || typeof node !== "object") return node;
  if (node === placeholder || isLayoutChildrenPlaceholder(node)) {
    return replacement;
  }
  if (Array.isArray(node)) {
    let changed = false;
    const mapped = node.map((item) => {
      const updated = replaceLayoutChildrenPlaceholder(item, replacement, placeholder);
      if (updated !== item) changed = true;
      return updated;
    });
    return changed ? mapped : node;
  }
  if (node.$$typeof === Symbol.for("react.transitional.element")) {
    if (node.props && typeof node.props === "object") {
      let changed = false;
      const newProps = { ...node.props };
      for (const [k, v] of Object.entries(node.props)) {
        if (v && typeof v === "object") {
          const updated = replaceLayoutChildrenPlaceholder(v, replacement, placeholder);
          if (updated !== v) {
            newProps[k] = updated;
            changed = true;
          }
        }
      }
      if (changed) {
        return cloneWithDevProps(node, newProps, node.key);
      }
    }
    return node;
  }
  if (
    node instanceof Promise ||
    isThenable(node) ||
    node.$$typeof === CLIENT_REFERENCE_TAG ||
    isClientComponent(node)
  ) {
    return node;
  }
  let changed = false;
  const clone = { ...node };
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === "object") {
      const updated = replaceLayoutChildrenPlaceholder(v, replacement, placeholder);
      if (updated !== v) {
        clone[k] = updated;
        changed = true;
      }
    }
  }
  return changed ? clone : node;
}

// Function to check if a component is a client component
function isClientComponent(type) {
  if (!type) {
    return false;
  }
  const CLIENT_REFERENCE = Symbol.for("react.client.reference");
  return (
    (typeof type === "function" && type.$$typeof === CLIENT_REFERENCE) ||
    (typeof type === "object" && type.$$typeof === CLIENT_REFERENCE)
  );
}

const holeBoundaryPromiseCache = new WeakMap();
async function DinouSuspenseHoleBoundary(props) {
  if (props && typeof props === "object" && holeBoundaryPromiseCache.has(props)) {
    return await holeBoundaryPromiseCache.get(props);
  }
  const { holeId, children } = props || {};
  const promise = runInRuntimeDynamicHole(
    () => asyncRenderJSXToClientJSX(children),
    holeId
  );
  if (props && typeof props === "object") {
    holeBoundaryPromiseCache.set(props, promise);
  }
  return await promise;
}
DinouSuspenseHoleBoundary.$$dinouDeferredSuspenseStream = true;

async function asyncRenderJSXToClientJSX(jsx, key = null) {
  if (isPageRootElement(jsx)) {
    const pagePpr = getPageRootPpr(jsx);
    return await runWithSegmentPpr(pagePpr, () =>
      runInPageSegment(async () => {
        const resolved = await asyncRenderJSXToClientJSXInner(jsx, key);
        const ctx = getContext();
        if (ctx) {
          ctx._resolvedPageClientJsx = resolved;
        }
        return resolved;
      })
    );
  }
  if (isLayoutRootElement(jsx)) {
    const layoutPpr = getLayoutRootPpr(jsx);
    return await runWithSegmentPpr(layoutPpr, () =>
      runInLayoutSegment(async () => {
        return await asyncRenderJSXToClientJSXInner(jsx, key);
      })
    );
  }
  return await asyncRenderJSXToClientJSXInner(jsx, key);
}

async function asyncRenderJSXToClientJSXInner(jsx, key = null) {
  if (
    typeof jsx === "string" ||
    typeof jsx === "number" ||
    typeof jsx === "boolean" ||
    typeof jsx === "function" ||
    typeof jsx === "undefined" ||
    jsx === null
  ) {
    return jsx;
  } else if (Array.isArray(jsx)) {
    const results = [];
    for (const child of jsx) {
      if (isThenable(child)) {
        if (
          isPprBuildActive() &&
          isInsideOuterSuspenseOutsideSlot() &&
          !isSlotDiscoveryActive() &&
          !isNoDynamicActive()
        ) {
          try {
            child.then(null, () => {});
          } catch (_) {}
          markDynamicAccess("async-suspense");
        }
        results.push(child);
      } else {
        results.push(await asyncRenderJSXToClientJSX(child, child?.key ?? null));
      }
    }
    return results;
  } else if (typeof jsx === "symbol") {
    if (jsx === Symbol.for("react.fragment")) {
      // Handle Fragment as an empty props object
      return React.createElement(React.Fragment, key != null ? { key } : null);
    }
    console.error("Unsupported symbol:", String(jsx));
    throw new Error(`Unsupported symbol: ${String(jsx)}`);
  } else if (typeof jsx === "object") {
    if (isLayoutChildrenPlaceholder(jsx)) {
      return jsx;
    }
    if (jsx.$$typeof === Symbol.for("react.transitional.element")) {
      if (jsx.type === Symbol.for("react.suspense")) {
        if (isPprBuildActive()) {
          return await runInSuspense(async (holeId, suspenseStore) => {
            const countBefore = getPprHoleCounter();
            try {
              const renderedChildren = isInsideCachedSlot()
                ? await asyncRenderJSXToClientJSX(jsx.props?.children)
                : await runInRuntimeDynamicHole(
                    () => asyncRenderJSXToClientJSX(jsx.props?.children),
                    holeId
                  );
              const renderedFallback = await asyncRenderJSXToClientJSX(jsx.props?.fallback);
              const hasNestedSuspense = getPprHoleCounter() > countBefore;
              await commitPprSuspenseEffects(suspenseStore);
              return cloneWithDevProps(
                jsx,
                {
                  ...jsx.props,
                  ...(hasNestedSuspense ? { "data-ppr-static-parent": holeId } : {}),
                  children: hasNestedSuspense
                    ? React.createElement(
                        "div",
                        { "data-ppr-static-parent": holeId, style: { display: "contents" } },
                        renderedChildren
                      )
                    : renderedChildren,
                  fallback: renderedFallback,
                },
                key ?? jsx.key
              );
            } catch (err) {
              if (
                (suspenseStore?.slotDepthAtSuspense || 0) === 0 &&
                ((err && err.$$typeof === Symbol.for("dinou.ppr.postpone")) ||
                  (err && typeof err?.then === "function") ||
                  (err && err?.$$typeof === Symbol.for("react.postpone")))
              ) {
                rollbackPprHolesAfter(countBefore);
                registerHole(holeId, { type: err.pprType || "suspense" });
                const renderedFallback = await asyncRenderJSXToClientJSX(jsx.props?.fallback);
                return cloneWithDevProps(
                  jsx,
                  {
                    "data-ppr-hole": holeId,
                    style: { display: "contents" },
                    children: renderedFallback,
                  },
                  key ?? jsx.key,
                  "div"
                );
              }
              throw err;
            } finally {
              if (suspenseStore) {
                suspenseStore.settled = true;
              }
            }
          });
        }
        if (isInsideCachedSlot()) {
          return await runInSuspense(async () => {
            return cloneWithDevProps(
              jsx,
              await asyncRenderJSXToClientJSX(jsx.props),
              key ?? jsx.key
            );
          });
        }
        const shouldEagerlyResolveSuspense =
          Boolean(getPprStore()) ||
          Boolean(getActiveRuntimeDynamicHoleStore()) ||
          Boolean(getContext()?.platformContext?.isSSG) ||
          process.env.NODE_ENV === "production" ||
          containsCacheSlot(jsx.props?.children);
        if (shouldEagerlyResolveSuspense) {
          return await runInSuspense(async (holeId) => {
            const renderedChildren = await runInRuntimeDynamicHole(
              () => asyncRenderJSXToClientJSX(jsx.props?.children),
              holeId
            );
            const renderedFallback = await asyncRenderJSXToClientJSX(jsx.props?.fallback);
            return cloneWithDevProps(
              jsx,
              {
                ...jsx.props,
                children: renderedChildren,
                fallback: renderedFallback,
              },
              key ?? jsx.key
            );
          });
        }
        if (jsx.props?.children?.type === DinouSuspenseHoleBoundary) {
          return jsx;
        }
        return await runInSuspense(async (holeId) => {
          const renderedFallback = await asyncRenderJSXToClientJSX(jsx.props?.fallback);
          return cloneWithDevProps(
            jsx,
            {
              ...jsx.props,
              children: React.createElement(DinouSuspenseHoleBoundary, {
                holeId,
                children: jsx.props?.children,
              }),
              fallback: renderedFallback,
            },
            key ?? jsx.key
          );
        });
      } else if (
        jsx.type === Symbol.for("react.fragment") ||
        jsx.type === Symbol.for("react.view_transition") ||
        typeof jsx.type === "string"
      ) {
        return cloneWithDevProps(
          jsx,
          await asyncRenderJSXToClientJSX(jsx.props),
          key ?? jsx.key
        );
      } else if (typeof jsx.type === "function") {
        const Component = jsx.type;
        const props = jsx.props;
        if (isClientComponent(Component)) {
          if (jsx.__clientJsxAlreadyRendered) {
            return cloneWithDevProps(
              jsx,
              props,
              key ?? jsx.key,
              Component
            );
          }
          return cloneWithDevProps(
            jsx,
            await asyncRenderJSXToClientJSX(props),
            key ?? jsx.key,
            Component
          );
        } else if (Component.$$dinouDeferredSuspenseStream) {
          return jsx;
        } else {
          // Server component: execute and process
          const returnedJsx = await invokeServerComponentInPpr(Component, () =>
            Component(props)
          );
          return await asyncRenderJSXToClientJSX(returnedJsx, key ?? jsx.key);
        }
      } else if (
        typeof jsx.type === "object" &&
        jsx.type !== null &&
        jsx.type.$$typeof === Symbol.for("react.forward_ref")
      ) {
        if (isClientComponent(jsx.type)) {
          return cloneWithDevProps(
            jsx,
            await asyncRenderJSXToClientJSX(jsx.props),
            key ?? jsx.key,
            jsx.type
          );
        } else {
          const returnedJsx = await invokeServerComponentInPpr(
            jsx.type.render,
            () => jsx.type.render(jsx.props, jsx.ref)
          );
          return await asyncRenderJSXToClientJSX(returnedJsx, key ?? jsx.key);
        }
      } else if (
        typeof jsx.type === "object" &&
        jsx.type !== null &&
        jsx.type.$$typeof === Symbol.for("react.memo")
      ) {
        if (isClientComponent(jsx.type)) {
          return cloneWithDevProps(
            jsx,
            await asyncRenderJSXToClientJSX(jsx.props),
            key ?? jsx.key,
            jsx.type
          );
        } else {
          const innerComp = jsx.type.type;
          if (typeof innerComp === "function") {
            const returnedJsx = await invokeServerComponentInPpr(innerComp, () =>
              innerComp(jsx.props)
            );
            return await asyncRenderJSXToClientJSX(returnedJsx, key ?? jsx.key);
          }
          if (typeof innerComp === "object" && innerComp !== null) {
            return await asyncRenderJSXToClientJSX(
              cloneWithDevProps(jsx, jsx.props, key ?? jsx.key, innerComp),
              key ?? jsx.key
            );
          }
          return null;
        }
      } else {
        console.error("Unsupported JSX type:", jsx.type);
        throw new Error("Unsupported JSX type");
      }
    } else if (jsx instanceof Promise) {
      return jsx;
    } else {
      // Process object props (e.g., { className: "foo" })
      const entries = [];
      for (const [propName, value] of Object.entries(jsx)) {
        if (isThenable(value)) {
          if (
            isPprBuildActive() &&
            isInsideOuterSuspenseOutsideSlot() &&
            !isSlotDiscoveryActive() &&
            !isNoDynamicActive()
          ) {
            try {
              value.then(null, () => {});
            } catch (_) {}
            markDynamicAccess("async-suspense");
          }
          entries.push([propName, value]);
        } else {
          entries.push([propName, await asyncRenderJSXToClientJSX(value)]);
        }
      }
      return Object.fromEntries(entries);
    }
  } else {
    throw new Error("Not implemented");
  }
}

export {
  asyncRenderJSXToClientJSX,
  invokeWithServerHooksDispatcher,
  ensureServerHooksPatched,
  replaceLayoutChildrenPlaceholder,
};
export default {
  asyncRenderJSXToClientJSX,
  invokeWithServerHooksDispatcher,
  ensureServerHooksPatched,
  replaceLayoutChildrenPlaceholder,
};
