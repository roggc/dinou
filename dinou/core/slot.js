"use client";

import React from "react";

const createContext = React.createContext;
const useContext = React.useContext;
const useMemo = React.useMemo;
const useState = React.useState;
const useEffect = React.useEffect;
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

function PageConsumer({ pagePromise }) {
  if (pagePromise && pagePromise.status === "rejected") {
    throw pagePromise.reason;
  }
  return use ? use(pagePromise) : pagePromise;
}

export function DinouPageSlot() {
  if (typeof useContext !== "function" || !DinouPageContext) {
    return null;
  }
  const slotContext = useContext(DinouPageContext);
  if (!slotContext) {
    return null;
  }
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
    createElement(PageConsumer, { pagePromise })
  );
}

function SlotConsumer({ slotPromise, fallback }) {
  if (slotPromise && slotPromise.status === "rejected") {
    throw slotPromise.reason;
  }
  return use ? use(slotPromise) : (slotPromise || fallback);
}

export function DinouCacheSlotBoundary({ id, children }) {
  if (typeof useState !== "function") {
    return children;
  }
  const [slotPromise, setSlotPromise] = useState(null);

  useEffect(() => {
    const handleRefresh = (e) => {
      if (!e || !e.detail || e.detail.id === id || e.detail.id === "*") {
        if (
          typeof window !== "undefined" &&
          typeof window.__DINOU_FETCH_SLOT__ === "function"
        ) {
          const promise = window.__DINOU_FETCH_SLOT__(id, e.detail?.options);
          if (promise) {
            if (typeof startTransition === "function") {
              startTransition(() => {
                setSlotPromise(promise);
              });
            } else {
              setSlotPromise(promise);
            }
          }
        }
      }
    };
    window.addEventListener("dinou:refresh-slot", handleRefresh);
    return () => window.removeEventListener("dinou:refresh-slot", handleRefresh);
  }, [id]);

  if (slotPromise) {
    return createElement(
      SlotErrorBoundary,
      { resetKey: slotPromise, pagePromise: slotPromise },
      createElement(
        Suspense,
        { fallback: children },
        createElement(SlotConsumer, { slotPromise, fallback: children })
      )
    );
  }
  return children;
}

export default DinouPageSlot;
