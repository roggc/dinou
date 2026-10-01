// dinou/core/client.jsx
if (typeof window !== "undefined") {
  if (!window.$RefreshReg$) window.$RefreshReg$ = () => { };
  if (!window.$RefreshSig$) window.$RefreshSig$ = () => (type) => type;
}
import {
  use,
  useRef,
  useState,
  useEffect,
  useTransition,
  useLayoutEffect,
  useMemo,
  useCallback,
  Component,
  createElement,
  StrictMode,
} from "react";
import { createFromFetch } from "@roggc/react-server-dom-esm/client";
import { hydrateRoot } from "react-dom/client";
import { RouterContext } from "./navigation.js";
import { resolveUrl, isExternalUrl } from "./navigation-utils.js";
import { createServerFunctionProxy } from "./server-function-proxy.js";
import { DinouPageContext, DinouPageSlot, cleanErrorStack } from "./slot.js";

// ====================================================================
// 1. GLOBAL STATE (Outside the component)
// ====================================================================
const pageCache = new Map();
const layoutCache = new Map();
const scrollCache = new Map();

const getCurrentRoute = () => window.location.pathname + window.location.search;

// ====================================================================
// 2. PURE HELPERS
// ====================================================================

// Helper to determine active layout folder for a pathname
const getLayoutKey = (pathname) => {
  const layouts = (typeof window !== "undefined" && window.__DINOU_LAYOUTS__) || ["", "docs"];
  const cleanPath = pathname.split("?")[0].split("#")[0];
  const segments = cleanPath.split("/").filter(Boolean);

  for (let i = segments.length; i >= 1; i--) {
    const candidate = segments.slice(0, i).join("/");
    if (layouts.includes(candidate)) {
      return "/" + candidate;
    }
  }
  if (layouts.includes("") || layouts.includes("/")) {
    return "/";
  }
  return null;
};

// Helper to detect if we only change the hash on the same page
const isHashChangeOnly = (finalPath) => {
  const targetUrl = new URL(finalPath, window.location.origin);
  const normalize = (p) =>
    p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;

  const targetPath = normalize(targetUrl.pathname);
  const currentPath = normalize(window.location.pathname);

  return (
    targetPath + targetUrl.search === currentPath + window.location.search &&
    targetUrl.hash !== ""
  );
};

const getPagePayload = (route, isPrefetch = false) => {
  const url = route.split("::")[0];
  if (pageCache.has(url)) {
    return pageCache.get(url);
  }

  let payloadUrl;
  if (window.__DINOU_USE_OLD_RSC__ || window.__DINOU_USE_STATIC__) {
    payloadUrl = window.__DINOU_USE_OLD_RSC__
      ? window.__DINOU_USE_STATIC__
        ? "/____rsc_page_old_static____" + url
        : "/____rsc_page_old____" + url
      : window.__DINOU_USE_STATIC__
        ? "/____rsc_page_static____" + url
        : "/____rsc_page____" + url;
  } else {
    payloadUrl = "/____rsc_page____" + url;
  }

  const buildId = window.__DINOU_BUILD_ID__;
  if (buildId) {
    payloadUrl += (payloadUrl.includes("?") ? "&" : "?") + "buildId=" + buildId;
  }

  const promise = createFromFetch(
    fetch(payloadUrl).then((res) => {
      if (res.headers.has("x-rsc-redirect")) {
        const redirectUrl = res.headers.get("x-rsc-redirect");
        pageCache.delete(url);
        if (!isPrefetch) {
          if (window.__DINOU_ROUTER_NAVIGATE__) {
            window.__DINOU_ROUTER_NAVIGATE__(redirectUrl, { replace: true });
          } else {
            window.location.href = redirectUrl;
          }
        }
        return new Promise(() => {});
      }
      return res;
    }),
    {
      callServer: async (id, args) => {
        const proxy = createServerFunctionProxy(id);
        return proxy(...args);
      },
    }
  );

  promise.catch(() => {});
  pageCache.set(url, promise);
  return promise;
};

const getLayoutPayload = (layoutKey, searchPart = "") => {
  if (!layoutKey) return null;
  const cacheKey = `${layoutKey}${searchPart}`;
  if (layoutCache.has(cacheKey)) {
    return layoutCache.get(cacheKey);
  }

  const cleanKey = layoutKey === "/" ? "" : layoutKey;
  let layoutUrl =
    (window.__DINOU_USE_STATIC__
      ? "/____rsc_layout_static____"
      : "/____rsc_layout____") + cleanKey + searchPart;

  const promise = createFromFetch(
    fetch(layoutUrl).then((res) => {
      if (!res.ok) {
        console.warn(
          `[Dinou Router] Layout ${layoutKey} fetch returned status ${res.status}`
        );
      }
      return res;
    }),
    {
      callServer: async (id, args) => {
        const proxy = createServerFunctionProxy(id);
        return proxy(...args);
      },
    }
  );

  promise.catch(() => {});
  layoutCache.set(cacheKey, promise);
  return promise;
};

const getErrorRSCPayload = (route, error) => {
  const url = route.split("::")[0];
  const cacheKey = `error::${url}::${error.message || String(error)}`;
  if (pageCache.has(cacheKey)) {
    return pageCache.get(cacheKey);
  }

  const payloadUrl = "/____rsc_payload_error____" + url;
  const promise = createFromFetch(
    fetch(payloadUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: {
          message: error.message || "Unknown Error",
          name: error.name,
          stack: error.stack,
        },
      }),
    }).then((res) => {
      if (res.headers.has("x-rsc-redirect")) {
        const redirectUrl = res.headers.get("x-rsc-redirect");
        pageCache.delete(cacheKey);
        if (window.__DINOU_ROUTER_NAVIGATE__) {
          window.__DINOU_ROUTER_NAVIGATE__(redirectUrl, { replace: true });
        } else {
          window.location.href = redirectUrl;
        }
        return new Promise(() => { });
      }
      return res;
    }),
    {
      callServer: async (id, args) => {
        const proxy = createServerFunctionProxy(id);
        return proxy(...args);
      }
    }
  );
  pageCache.set(cacheKey, promise);
  return promise;
};

if (typeof globalThis !== "undefined") {
  globalThis.__DINOU_GET_ERROR_RSC_PAYLOAD__ = getErrorRSCPayload;
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[Dinou] ErrorBoundary caught error:", error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }
      const isDev = process.env.NODE_ENV !== "production";
      return (
        <html lang="en">
          <head>
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>"Dinou Dev Error from client.jsx ErrorBoundary"</title>
          </head>
          <body
            style={{
              margin: 0,
              backgroundColor: "#fff1f2",
              padding: "20px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                padding: "32px",
                maxWidth: "960px",
                margin: "40px auto",
                backgroundColor: "#fff1f2",
                border: "1px solid #fecdd3",
                borderRadius: "12px",
                color: "#9f1239",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <span
                  style={{
                    background: "#e11d48",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  {isDev ? "Dinou Dev Error" : "Application Error"}
                </span>
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#881337" }}>
                  {this.state.error?.message || "Unhandled Application Error"}
                </h2>
              </div>
              {isDev && (
                <p style={{ margin: "0 0 16px 0", fontSize: "0.875rem", color: "#9f1239", lineHeight: 1.5 }}>
                  An unhandled error occurred during rendering. You can provide a custom error UI by creating an{" "}
                  <code style={{ background: "#ffe4e6", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                    error.tsx
                  </code>{" "}
                  file in your route folder.
                </p>
              )}
              {isDev && this.state.error?.stack && (
                <pre
                  style={{
                    background: "#0f172a",
                    color: "#f8fafc",
                    padding: "16px",
                    borderRadius: "8px",
                    overflowX: "auto",
                    fontSize: "0.8125rem",
                    lineHeight: 1.6,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  }}
                >
                  {cleanErrorStack(this.state.error.stack)}
                </pre>
              )}
            </div>
          </body>
        </html>
      );
    }
    return this.props.children;
  }
}


// ====================================================================
// 3. ROUTER COMPONENT
// ====================================================================

function Router() {
  const [route, setRoute] = useState(getCurrentRoute());
  const [isPopState, setIsPopState] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [version, setVersion] = useState(0);
  const [navError, setNavError] = useState(null);
  const [navCount, setNavCount] = useState(0);

  // If the initial SSR render had a page-level error wrapped inside a working layout,
  // we hydrate the layout normally so the navbar/sidebar are fully interactive,
  // while supplying the server error directly to DinouPageSlot to avoid refetching.
  const initialPageErrorRef = useRef(
    typeof window !== "undefined" &&
    window.__DINOU_ERROR_MESSAGE__ &&
    window.__DINOU_ERROR_SEGMENT__ === "page"
      ? (() => {
          const err = new Error(window.__DINOU_ERROR_MESSAGE__);
          err.name = window.__DINOU_ERROR_NAME__ || "Error";
          if (window.__DINOU_ERROR_STACK__) err.stack = window.__DINOU_ERROR_STACK__;
          return getErrorRSCPayload(getCurrentRoute(), err);
        })()
      : null
  );

  // 🧭 NAVIGATE FUNCTION (Core Logic)
  const navigate = (href, options = {}) => {
    initialPageErrorRef.current = null;
    if (typeof window !== "undefined" && window.__DINOU_ACTIVE_LAYOUT__) {
      window.__DINOU_ACTIVE_LAYOUT__ = null;
    }
    const finalPath = resolveUrl(href, window.location.pathname);

    // 🛡️ NAVIGATE PROTECTION: Hash Detection
    if (isHashChangeOnly(finalPath)) {
      if (options.replace) {
        window.history.replaceState(null, "", finalPath);
      } else {
        window.history.pushState(null, "", finalPath);
      }

      // Manual scroll
      const hash = new URL(finalPath, window.location.origin).hash;
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "auto" });
      }
      return; // CRITICAL STOP
    }

    if (options.fresh) {
      pageCache.delete(finalPath);
    }

    // Normal RSC Navigation
    scrollCache.set(
      window.location.pathname + window.location.search,
      window.scrollY,
    );
    if (options.replace) {
      window.history.replaceState(null, "", finalPath);
    } else {
      window.history.pushState(null, "", finalPath);
    }

    startTransition(() => {
      setIsPopState(false);
      setRoute(finalPath);
      setNavError(null);
      setNavCount((c) => c + 1);
    });
  };

  const back = () => window.history.back();
  const forward = () => window.history.forward();
  const refresh = useCallback(() => {
    const currentPath = window.location.pathname + window.location.search;
    pageCache.delete(currentPath);
    startTransition(() => {
      setVersion((v) => v + 1);
      setNavError(null);
      setNavCount((c) => c + 1);
    });
  }, [startTransition]);

  // 🔌 EFFECT 1: Expose Global Prefetch & Navigation
  useEffect(() => {
    window.__DINOU_PREFETCH__ = (url) => {
      // 🛡️ PREFETCH PROTECTION: If it's a local hash, do nothing
      if (isHashChangeOnly(url)) return;
      const lKey = getLayoutKey(url);
      if (lKey && !layoutCache.has(lKey)) {
        getLayoutPayload(lKey);
      }
      getPagePayload(url, true);
    };

    window.__DINOU_ROUTER_NAVIGATE__ = navigate;
    window.__DINOU_ROUTER_REFRESH__ = refresh;

    // Hydration
    document.body.setAttribute("data-hydrated", "true");

    return () => {
      if (window.__DINOU_ROUTER_NAVIGATE__ === navigate) {
        window.__DINOU_ROUTER_NAVIGATE__ = undefined;
      }
      if (window.__DINOU_ROUTER_REFRESH__ === refresh) {
        window.__DINOU_ROUTER_REFRESH__ = undefined;
      }
    };
  }, [navigate, refresh]);

  // 🔌 EFFECT 2: Global Listeners (Click and PopState)
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const onNavigate = (e) => {
      // 🛡️ FIX: If the event was already processed (preventDefault called by Link), we ignore it.
      if (e.defaultPrevented) return;
      const anchor = e.target.closest("a");
      if (
        !anchor ||
        anchor.target ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || isExternalUrl(href))
        return;

      // We use the unified helper
      const finalPath = resolveUrl(href, window.location.pathname);

      // We use the same hash detection helper for consistency
      if (isHashChangeOnly(finalPath)) {
        return; // The browser handles it natively or navigate would handle it
      }

      e.preventDefault();
      navigate(href);
    };

    const onPopState = () => {
      initialPageErrorRef.current = null;
      if (typeof window !== "undefined" && window.__DINOU_ACTIVE_LAYOUT__) {
        window.__DINOU_ACTIVE_LAYOUT__ = null;
      }
      const target = getCurrentRoute();
      startTransition(() => {
        setIsPopState(true);
        setRoute(target);
        setNavError(null);
        setNavCount((c) => c + 1);
      });
    };

    window.addEventListener("click", onNavigate);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("click", onNavigate);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  // 🔌 EFFECT 3: Scroll Management (Restoration)
  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      if (window.location.hash) return;

      if (isPopState) {
        const key = route;
        const savedY = scrollCache.get(key);
        if (savedY !== undefined) {
          window.scrollTo(0, savedY);
        }
      } else {
        window.scrollTo(0, 0);
      }
    });
  }, [route, isPopState]);

  // 🔌 EFFECT 4: Scroll Management (Hash on new page)
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const id = hash.replace("#", "");
    const scrollToHash = () => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "auto" });
        return true;
      }
      return false;
    };

    if (scrollToHash()) return;

    let frames = 0;
    const interval = setInterval(() => {
      frames++;
      if (scrollToHash() || frames > 20) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [route]);

  // RSC Segmented Navigation Logic
  const cleanRoutePath = route.split("?")[0].split("#")[0];
  const searchPart = route.includes("?") ? "?" + route.split("?")[1].split("#")[0] : "";
  const layoutKey = useMemo(() => {
    if (
      typeof window !== "undefined" &&
      window.__DINOU_ACTIVE_LAYOUT__ &&
      route === getCurrentRoute()
    ) {
      return window.__DINOU_ACTIVE_LAYOUT__;
    }
    return getLayoutKey(cleanRoutePath);
  }, [cleanRoutePath, route]);

  const pagePromise = useMemo(() => {
    if (initialPageErrorRef.current && route === getCurrentRoute()) {
      return initialPageErrorRef.current;
    }
    if (navError) return getErrorRSCPayload(route, navError);
    return getPagePayload(route + (version ? `?v=${version}` : ""));
  }, [route, version, navError]);

  const layoutPromise = useMemo(() => {
    return layoutKey !== null ? getLayoutPayload(layoutKey, searchPart) : null;
  }, [layoutKey, searchPart]);

  const contextValue = useMemo(
    () => ({
      url: route,
      navigate,
      back,
      forward,
      refresh,
      isPending,
    }),
    [route, isPending],
  );

  const slotContextValue = useMemo(
    () => ({
      pagePromise,
      resetKey: `${route}::${navCount}`,
    }),
    [pagePromise, route, navCount]
  );

  return (
    <RouterContext.Provider value={contextValue}>
      <ErrorBoundary
        resetKey={`${route}::${navCount}`}
        onError={setNavError}
      >
        <DinouPageContext.Provider value={slotContextValue}>
          {navError
            ? use(pagePromise)
            : layoutPromise
              ? use(layoutPromise)
              : use(pagePromise)}
        </DinouPageContext.Provider>
      </ErrorBoundary>
    </RouterContext.Provider>
  );
}

const routerElement = createElement(Router);
const isDev = process.env.NODE_ENV !== "production";
const useStrictMode = isDev && (typeof window === "undefined" || window.__DINOU_STRICT_MODE__ !== false);

const app = useStrictMode
  ? createElement(StrictMode, null, routerElement)
  : routerElement;

const onRecoverableError = (error) => {
  // 🛡️ Filter benign ViewTransition aborts when document is hidden (e.g. background tab or HMR while in IDE)
  if (
    error?.name === "InvalidStateError" &&
    (error?.message?.includes("Document hidden") || (typeof document !== "undefined" && document.hidden))
  ) {
    return;
  }
  if (error?.name === "AbortError" && error?.message?.includes("transition")) {
    return;
  }

  if (typeof reportError === "function") {
    reportError(error);
  } else {
    console.error(error);
  }
};

// If the server rendered a fatal layout error during SSR (meaning there is no layout DOM to hydrate),
// do NOT attempt to hydrate the application over it.
const hasInitialServerError =
  typeof window !== "undefined" && Boolean(window.__DINOU_ERROR_MESSAGE__);
const isLayoutError =
  hasInitialServerError && window.__DINOU_ERROR_SEGMENT__ !== "page";

if (!isLayoutError) {
  hydrateRoot(document, app, { onRecoverableError });
} else {
  console.warn(
    "[Dinou] Initial layout server error detected:",
    window.__DINOU_ERROR_MESSAGE__,
    "- skipping client hydration to preserve the server-rendered error screen."
  );
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
