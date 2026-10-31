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
  const errorPromise = useMemo(() => {
    if (typeof getErrorRSC === "function") {
      const route = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
      return getErrorRSC(route, error);
    }
    return null;
  }, [error]);

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

if (
  typeof window !== "undefined" &&
  !window.__DINOU_UNMOUNTED_SLOT_LISTENER_INSTALLED__
) {
  window.__DINOU_UNMOUNTED_SLOT_LISTENER_INSTALLED__ = true;
  window.addEventListener("dinou:refresh-slot", (e) => {
    const targetId = e?.detail?.id;
    const options = e?.detail?.options;
    if (typeof window.__DINOU_FETCH_SLOT__ !== "function") return;

    for (const [slotId, entry] of knownClientSlots.entries()) {
      if (mountedClientSlots.has(slotId)) continue;
      const matchesTag =
        Array.isArray(entry.tags) && targetId && entry.tags.includes(targetId);
      if (!e || !e.detail || targetId === slotId || targetId === "*" || matchesTag) {
        const fetchOpts = {
          ...(options || {}),
          currentPath: entry.routePath || window.location.pathname,
        };
        const promise = window.__DINOU_FETCH_SLOT__(slotId, fetchOpts);
        if (promise && typeof promise.then === "function") {
          entry.pendingPromise = promise;
          const baseRef = entry.baseChildren;
          promise.then(
            (resolved) => {
              if (entry.pendingPromise === promise) {
                entry.pendingPromise = null;
              }
              slotOverrideCache.set(slotId, {
                baseChildren: baseRef,
                content: resolved,
              });
              if (typeof entry.notifyMounted === "function") {
                entry.notifyMounted(resolved, baseRef);
              }
            },
            () => {
              if (entry.pendingPromise === promise) {
                entry.pendingPromise = null;
              }
            }
          );
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
  const cachedOverride = isBrowser ? slotOverrideCache.get(id) : null;
  const initialContent =
    cachedOverride && cachedOverride.baseChildren === children
      ? cachedOverride.content
      : null;

  const [override, setOverride] = useState({
    baseChildren: children,
    content: initialContent,
  });
  const childrenRef =
    typeof React.useRef === "function" ? React.useRef(children) : { current: children };
  childrenRef.current = children;

  if (isBrowser) {
    const existingKnown = knownClientSlots.get(id);
    if (!existingKnown || existingKnown.baseChildren !== children) {
      knownClientSlots.set(id, {
        id,
        tags: Array.isArray(tags) ? tags : [],
        baseChildren: children,
        routePath: window.location.pathname,
        pendingPromise: existingKnown?.pendingPromise || null,
        notifyMounted: existingKnown?.notifyMounted || null,
      });
    } else if (Array.isArray(tags)) {
      existingKnown.tags = tags;
    }
    if (cachedOverride && cachedOverride.baseChildren !== children) {
      slotOverrideCache.delete(id);
    }
  }

  useEffect(() => {
    mountedClientSlots.add(id);
    const applyResolved = (resolved, baseRef = childrenRef.current) => {
      slotOverrideCache.set(id, {
        baseChildren: baseRef,
        content: resolved,
      });
      const applyFn = () => {
        setOverride({
          baseChildren: baseRef,
          content: resolved,
        });
      };
      if (typeof startTransition === "function") {
        startTransition(applyFn);
      } else {
        applyFn();
      }
    };

    const knownEntry = knownClientSlots.get(id);
    if (knownEntry) {
      knownEntry.routePath = window.location.pathname;
      knownEntry.baseChildren = childrenRef.current;
      knownEntry.notifyMounted = applyResolved;
      if (Array.isArray(tags)) {
        knownEntry.tags = tags;
      }
      if (knownEntry.pendingPromise) {
        const pending = knownEntry.pendingPromise;
        pending.then(
          (resolved) => {
            applyResolved(resolved, childrenRef.current);
          },
          () => {}
        );
      }
    }

    const latestCached = slotOverrideCache.get(id);
    if (
      latestCached &&
      latestCached.baseChildren === childrenRef.current &&
      latestCached.content !== null
    ) {
      setOverride((prev) =>
        prev.content === latestCached.content && prev.baseChildren === childrenRef.current
          ? prev
          : { baseChildren: childrenRef.current, content: latestCached.content }
      );
    }

    const handleRefresh = (e) => {
      const targetId = e?.detail?.id;
      const matchesTag = Array.isArray(tags) && targetId && tags.includes(targetId);
      if (!e || !e.detail || targetId === id || targetId === "*" || matchesTag) {
        if (
          typeof window !== "undefined" &&
          typeof window.__DINOU_FETCH_SLOT__ === "function"
        ) {
          const promise = window.__DINOU_FETCH_SLOT__(id, e.detail?.options);
          if (promise && typeof promise.then === "function") {
            promise.then(
              (resolved) => {
                applyResolved(resolved, childrenRef.current);
              },
              (err) => {
                console.error(`[Dinou] Failed to refresh slot "${id}":`, err);
              }
            );
          } else if (promise) {
            applyResolved(promise, childrenRef.current);
          }
        }
      }
    };
    window.addEventListener("dinou:refresh-slot", handleRefresh);
    return () => {
      mountedClientSlots.delete(id);
      const curKnown = knownClientSlots.get(id);
      if (curKnown && curKnown.notifyMounted === applyResolved) {
        curKnown.notifyMounted = null;
      }
      window.removeEventListener("dinou:refresh-slot", handleRefresh);
    };
  }, [id, tags]);

  if (isBrowser) {
    const latestCached = slotOverrideCache.get(id);
    if (
      latestCached &&
      latestCached.content !== null &&
      latestCached.baseChildren === children
    ) {
      return latestCached.content;
    }
  }
  if (override.content !== null && override.baseChildren === children) {
    return override.content;
  }
  return children;
}

export default DinouPageSlot;
