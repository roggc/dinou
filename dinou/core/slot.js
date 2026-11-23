"use client";

import React from "react";

const createContext = React.createContext;
const useContext = React.useContext;
const useMemo = React.useMemo;
const useState = React.useState;
const useEffect = React.useEffect;
const useLayoutEffect = React.useLayoutEffect || React.useEffect;
const startTransition = React.startTransition;
const use = React.use;
const createElement = React.createElement;
const Suspense = React.Suspense;
const Component = typeof React.Component === "function" ? React.Component : class {};

export function flushPendingSsrStreams() {
  if (
    typeof window !== "undefined" &&
    typeof window.$RV === "function" &&
    Array.isArray(window.$RB) &&
    window.$RB.length > 0
  ) {
    try {
      window.$RV(window.$RB);
    } catch (e) {}
  }
}

export function pruneOrphanedSsrStreams() {
  if (typeof window === "undefined" || !Array.isArray(window.$RB)) return;
  const rb = window.$RB;
  for (let i = rb.length - 2; i >= 0; i -= 2) {
    const boundaryTpl = rb[i];
    const hiddenSlot = rb[i + 1];
    if (!boundaryTpl || !boundaryTpl.parentNode) {
      if (hiddenSlot && hiddenSlot.parentNode) {
        hiddenSlot.parentNode.removeChild(hiddenSlot);
      }
      rb.splice(i, 2);
    }
  }
}

export const DinouPageContext =
  typeof globalThis !== "undefined" && globalThis.__DINOU_PAGE_CONTEXT__
    ? globalThis.__DINOU_PAGE_CONTEXT__
    : (typeof createContext === "function"
        ? (typeof globalThis !== "undefined"
            ? (globalThis.__DINOU_PAGE_CONTEXT__ = createContext(null))
            : createContext(null))
        : null);

export function cleanErrorStack(stack) {
  if (!stack || typeof stack !== "string") return "";
  const lines = stack.split("\n");
  const filtered = [];

  for (const line of lines) {
    if (!line.trim().startsWith("at ")) {
      filtered.push(line);
      continue;
    }

    if (
      line.includes("resolveErrorDev") ||
      line.includes("resolveErrorModel") ||
      line.includes("processFullStringRow") ||
      line.includes("processFullBinaryRow") ||
      line.includes("processBinaryChunk") ||
      line.includes("buildFakeCallStack") ||
      line.includes("createFakeFunction") ||
      line.includes("initializeFakeTask") ||
      line.includes("getRootTask") ||
      line.includes("progress (http") ||
      line.includes("__hmr_client__") ||
      (line.includes("http://") && line.includes("/chunk-"))
    ) {
      continue;
    }

    if (
      line.includes("node_modules/@roggc/react-server-dom-esm") ||
      line.includes("node_modules/react-dom") ||
      line.includes("node_modules/react/") ||
      line.includes("node:internal") ||
      line.includes("asyncRenderJSXToClientJSX") ||
      line.includes("renderModelDestructive") ||
      line.includes("renderHtmlStream") ||
      line.includes("pipeRSC")
    ) {
      continue;
    }

    filtered.push(line);
  }

  return (filtered.length > 0 ? filtered : lines).join("\n").trim();
}

export function DefaultDevError({ error }) {
  const isDev = process.env.NODE_ENV !== "production";
  return createElement(
    "div",
    {
      style: {
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "32px",
        maxWidth: "960px",
        margin: "40px auto",
        backgroundColor: "#fff1f2",
        border: "1px solid #fecdd3",
        borderRadius: "12px",
        color: "#9f1239",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
      },
    },
    createElement(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" } },
      createElement(
        "span",
        { style: { background: "#e11d48", color: "white", padding: "2px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: "bold" } },
        isDev ? "Dinou Dev Error" : "Application Error"
      ),
      createElement(
        "h2",
        { style: { margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#881337" } },
        error?.message || "Unhandled Application Error"
      )
    ),
    isDev && createElement(
      "p",
      { style: { margin: "0 0 16px 0", fontSize: "0.875rem", color: "#9f1239", lineHeight: 1.5 } },
      "An unhandled error occurred during rendering. You can provide a custom error UI by creating an ",
      createElement("code", { style: { background: "#ffe4e6", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 } }, "error.tsx"),
      " file in your route folder."
    ),
    isDev && error?.stack && createElement(
      "pre",
      {
        style: {
          background: "#0f172a",
          color: "#f8fafc",
          padding: "16px",
          borderRadius: "8px",
          overflowX: "auto",
          fontSize: "0.8125rem",
          lineHeight: 1.6,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        },
      },
      cleanErrorStack(error.stack)
    )
  );
}

function SlotErrorRenderer({ error, reset }) {
  const getErrorRSC = typeof globalThis !== "undefined" ? globalThis.__DINOU_GET_ERROR_RSC_PAYLOAD__ : null;
  const isStaticExport =
    typeof window !== "undefined" &&
    Boolean(window.__DINOU_STATIC_EXPORT__ || window.__DINOU_STATIC_EXPORT_UNLOADING__);
  const errorPromise = useMemo(() => {
    if (!isStaticExport && typeof getErrorRSC === "function") {
      const route = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
      return getErrorRSC(route, error);
    }
    return null;
  }, [error, isStaticExport]);

  if (!errorPromise) {
    return createElement(DefaultDevError, { error });
  }

  const element = use ? use(errorPromise) : errorPromise;
  if (!element) {
    return createElement(DefaultDevError, { error });
  }

  if (React.isValidElement(element)) {
    if (typeof element.type === "string") {
      return React.cloneElement(element);
    }
    return React.cloneElement(element, { error, reset });
  }

  return element;
}

class InnerErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[Dinou] Inner Error Boundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return createElement(DefaultDevError, { error: this.state.error });
    }
    return this.props.children;
  }
}

class SlotErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof window !== "undefined" && window.__DINOU_STATIC_EXPORT_UNLOADING__) return;
    console.error("[Dinou] Page Error caught in Slot:", error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (
      this.state.hasError &&
      (prevProps.resetKey !== this.props.resetKey || prevProps.pagePromise !== this.props.pagePromise)
    ) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      if (typeof window !== "undefined" && window.__DINOU_STATIC_EXPORT_UNLOADING__) {
        return null;
      }
      const reset = () => this.setState({ hasError: false, error: null });
      return createElement(
        InnerErrorBoundary,
        null,
        createElement(
          Suspense,
          { fallback: null },
          createElement(SlotErrorRenderer, { error: this.state.error, reset })
        )
      );
    }
    return this.props.children;
  }
}

function PageConsumer({ pagePromise, pageElement }) {
  if (typeof useLayoutEffect === "function" && typeof window !== "undefined") {
    useLayoutEffect(() => {
      pruneOrphanedSsrStreams();
      if (
        typeof document !== "undefined" &&
        document.body &&
        document.body.getAttribute("data-hydrated") !== "true"
      ) {
        document.body.setAttribute("data-hydrated", "true");
      }
    });
  }
  if (pageElement !== undefined) {
    return pageElement;
  }
  if (pagePromise && pagePromise.status === "rejected") {
    throw pagePromise.reason;
  }
  return use ? use(pagePromise) : pagePromise;
}

export function DinouPageSlot() {
  const fallbackContext =
    typeof globalThis !== "undefined" ? globalThis.__DINOU_SSR_SLOT_CONTEXT__ : null;
  const slotContext =
    typeof useContext === "function" && DinouPageContext
      ? useContext(DinouPageContext) || fallbackContext
      : fallbackContext;
  if (!slotContext) {
    return null;
  }
  const pageElement =
    slotContext && slotContext.pageElement !== undefined
      ? slotContext.pageElement
      : undefined;
  const pagePromise =
    slotContext && slotContext.pagePromise !== undefined
      ? slotContext.pagePromise
      : slotContext;
  const resetKey =
    slotContext && slotContext.resetKey !== undefined
      ? slotContext.resetKey
      : pagePromise;

  return createElement(
    SlotErrorBoundary,
    { resetKey, pagePromise },
    createElement(PageConsumer, { pagePromise, pageElement })
  );
}

const slotOverrideCache =
  typeof globalThis !== "undefined"
    ? (globalThis.__DINOU_SLOT_OVERRIDE_CACHE__ =
        globalThis.__DINOU_SLOT_OVERRIDE_CACHE__ || new Map())
    : new Map();

const knownClientSlots =
  typeof globalThis !== "undefined"
    ? (globalThis.__DINOU_KNOWN_CLIENT_SLOTS__ =
        globalThis.__DINOU_KNOWN_CLIENT_SLOTS__ || new Map())
    : new Map();

const mountedClientSlots =
  typeof globalThis !== "undefined"
    ? (globalThis.__DINOU_MOUNTED_CLIENT_SLOTS__ =
        globalThis.__DINOU_MOUNTED_CLIENT_SLOTS__ || new Set())
    : new Set();

const SlotRenderBatchContext =
  typeof globalThis !== "undefined"
    ? (globalThis.__DINOU_SLOT_BATCH_CONTEXT__ =
        globalThis.__DINOU_SLOT_BATCH_CONTEXT__ ||
        (typeof createContext === "function" ? createContext(0) : null))
    : typeof createContext === "function"
    ? createContext(0)
    : null;

function ensureKnownSlotEntry(id, tags, children) {
  let entry = knownClientSlots.get(id);
  if (!entry) {
    entry = {
      id,
      tags: Array.isArray(tags) ? tags : [],
      baseChildren: children,
      routePath: typeof window !== "undefined" ? window.location.pathname : "/",
      pendingPromise: null,
      pendingReqId: 0,
      pendingBatchId: 0,
      latestReqId: 0,
      subscribers: new Set(),
    };
    knownClientSlots.set(id, entry);
  } else {
    if (!(entry.subscribers instanceof Set)) {
      entry.subscribers = new Set();
    }
    if (Array.isArray(tags) && tags.length > 0) {
      entry.tags = Array.from(new Set([...(entry.tags || []), ...tags]));
    }
    entry.baseChildren = children;
    if (typeof window !== "undefined") {
      entry.routePath = window.location.pathname;
    }
  }
  return entry;
}

function getSlotOverrideForChildren(id, children, ancestorBatchId = 0) {
  const cachedOverride = slotOverrideCache.get(id);
  if (!cachedOverride || cachedOverride.content === null) return null;
  if (cachedOverride.baseChildrenSet instanceof Set) {
    if (cachedOverride.baseChildrenSet.has(children)) {
      return cachedOverride;
    }
    if (ancestorBatchId > 0 && cachedOverride.batchId === ancestorBatchId) {
      cachedOverride.baseChildrenSet.add(children);
      return cachedOverride;
    }
    return null;
  }
  if (cachedOverride.baseChildren === children) {
    return cachedOverride;
  }
  if (ancestorBatchId > 0 && cachedOverride.batchId === ancestorBatchId) {
    cachedOverride.baseChildrenSet = new Set([cachedOverride.baseChildren, children]);
    return cachedOverride;
  }
  return null;
}

if (
  typeof window !== "undefined" &&
  !window.__DINOU_SLOT_REFRESH_DISPATCHER_INSTALLED__
) {
  window.__DINOU_SLOT_REFRESH_DISPATCHER_INSTALLED__ = true;
  window.addEventListener("dinou:refresh-slot", (e) => {
    const targetId = e?.detail?.id;
    const options = e?.detail?.options;
    if (typeof window.__DINOU_FETCH_SLOT__ !== "function") return;

    const batchId =
      typeof globalThis !== "undefined"
        ? (globalThis.__DINOU_SLOT_BATCH_SEQ__ =
            (globalThis.__DINOU_SLOT_BATCH_SEQ__ || 0) + 1)
        : 1;

    for (const [slotId, entry] of knownClientSlots.entries()) {
      const matchesTag =
        Array.isArray(entry.tags) && targetId && entry.tags.includes(targetId);
      if (!e || !e.detail || targetId === slotId || targetId === "*" || matchesTag) {
        const hasMountedSubscribers =
          entry.subscribers instanceof Set && entry.subscribers.size > 0;
        if (
          targetId === "*" &&
          !hasMountedSubscribers &&
          entry.routePath &&
          entry.routePath !== window.location.pathname
        ) {
          continue;
        }
        const fetchOpts = hasMountedSubscribers
          ? options
          : {
              ...(options || {}),
              currentPath: entry.routePath || window.location.pathname,
            };
        const promise = window.__DINOU_FETCH_SLOT__(slotId, fetchOpts);
        const reqId = (entry.latestReqId || 0) + 1;
        entry.latestReqId = reqId;

        const commitResolved = (resolved) => {
          flushPendingSsrStreams();
          const baseChildrenSet = new Set();
          if (entry.subscribers instanceof Set && entry.subscribers.size > 0) {
            for (const sub of entry.subscribers) {
              try {
                baseChildrenSet.add(sub.getBase());
              } catch (err) {}
            }
          } else {
            baseChildrenSet.add(entry.baseChildren);
          }
          slotOverrideCache.set(slotId, {
            baseChildren: entry.baseChildren,
            baseChildrenSet,
            content: resolved,
            batchId,
          });
          if (entry.subscribers instanceof Set && entry.subscribers.size > 0) {
            for (const sub of Array.from(entry.subscribers)) {
              try {
                sub.apply(resolved, batchId);
              } catch (err) {}
            }
          }
        };

        if (promise && typeof promise.then === "function") {
          entry.pendingPromise = promise;
          entry.pendingReqId = reqId;
          entry.pendingBatchId = batchId;
          const settledPromise = promise.then(
            (resolved) => {
              if (entry.latestReqId !== reqId) {
                return;
              }
              if (entry.pendingPromise === promise) {
                entry.pendingPromise = null;
              }
              commitResolved(resolved);
            },
            (err) => {
              if (entry.pendingPromise === promise) {
                entry.pendingPromise = null;
              }
              if (hasMountedSubscribers) {
                console.error(`[Dinou] Failed to refresh slot "${slotId}":`, err);
              }
            }
          );
          if (Array.isArray(e?.detail?.promises)) {
            e.detail.promises.push(settledPromise);
          }
        } else if (promise) {
          entry.pendingPromise = null;
          commitResolved(promise);
        }
      }
    }
  });
}

export function DinouCacheSlotBoundary({ id, tags, children }) {
  if (typeof useState !== "function") {
    return children;
  }
  const isBrowser = typeof window !== "undefined";
  const ancestorBatchId =
    SlotRenderBatchContext && typeof useContext === "function"
      ? useContext(SlotRenderBatchContext)
      : 0;
  const initialOverride = isBrowser
    ? getSlotOverrideForChildren(id, children, ancestorBatchId)
    : null;

  const [override, setOverride] = useState({
    baseChildren: children,
    content: initialOverride ? initialOverride.content : null,
    batchId: initialOverride ? initialOverride.batchId || 0 : 0,
  });
  const childrenRef =
    typeof React.useRef === "function" ? React.useRef(children) : { current: children };
  childrenRef.current = children;

  if (isBrowser) {
    ensureKnownSlotEntry(id, tags, children);
  }

  if (typeof useLayoutEffect === "function" && isBrowser) {
    useLayoutEffect(() => {
      if (override.content !== null) {
        pruneOrphanedSsrStreams();
      }
    }, [override.content]);
  }

  const tagsKey = Array.isArray(tags) ? tags.join("\0") : "";

  useEffect(() => {
    const applyResolved = (resolved, resolvedBatchId = 0) => {
      const baseRef = childrenRef.current;
      const applyFn = () => {
        setOverride({
          baseChildren: baseRef,
          content: resolved,
          batchId: resolvedBatchId,
        });
      };
      if (typeof startTransition === "function") {
        startTransition(applyFn);
      } else {
        applyFn();
      }
    };

    const entry = ensureKnownSlotEntry(id, tags, childrenRef.current);
    const subscriber = {
      apply: applyResolved,
      getBase: () => childrenRef.current,
    };
    entry.subscribers.add(subscriber);
    mountedClientSlots.add(id);

    if (entry.pendingPromise) {
      const pending = entry.pendingPromise;
      const pendingReqId = entry.pendingReqId;
      const pendingBatchId = entry.pendingBatchId || 0;
      pending.then(
        (resolved) => {
          if (entry.latestReqId !== pendingReqId) {
            return;
          }
          if (entry.pendingPromise === pending) {
            entry.pendingPromise = null;
          }
          const curCache = slotOverrideCache.get(id);
          if (curCache && curCache.baseChildrenSet instanceof Set) {
            curCache.baseChildrenSet.add(childrenRef.current);
          }
          applyResolved(resolved, pendingBatchId);
        },
        () => {}
      );
    }

    const latestCached = getSlotOverrideForChildren(id, childrenRef.current, ancestorBatchId);
    if (latestCached && latestCached.content !== null) {
      setOverride((prev) =>
        prev.content === latestCached.content && prev.baseChildren === childrenRef.current
          ? prev
          : {
              baseChildren: childrenRef.current,
              content: latestCached.content,
              batchId: latestCached.batchId || 0,
            }
      );
    }

    return () => {
      entry.subscribers.delete(subscriber);
      if (entry.subscribers.size === 0) {
        mountedClientSlots.delete(id);
      }
    };
  }, [id, tagsKey]);

  const wrapWithBatch = (content, batchId) => {
    if (SlotRenderBatchContext) {
      return createElement(
        SlotRenderBatchContext.Provider,
        { value: batchId || ancestorBatchId || 0 },
        content
      );
    }
    return content;
  };

  if (isBrowser) {
    const latestCached = getSlotOverrideForChildren(id, children, ancestorBatchId);
    if (latestCached && latestCached.content !== null) {
      return wrapWithBatch(latestCached.content, latestCached.batchId || 0);
    }
  }
  if (override.content !== null && override.baseChildren === children) {
    return wrapWithBatch(override.content, override.batchId || 0);
  }
  return wrapWithBatch(children, 0);
}

export default DinouPageSlot;
