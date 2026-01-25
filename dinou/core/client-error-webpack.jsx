import {
  use,
  useState,
  useEffect,
  useTransition,
  useLayoutEffect,
  useMemo,
} from "react";
import { createFromFetch } from "react-server-dom-webpack/client";
import { hydrateRoot } from "react-dom/client";
import { RouterContext } from "./navigation.js";
import { resolveUrl } from "./navigation-utils.js";

// ====================================================================
// 1. GLOBAL STATE (Outside the component)
// ====================================================================
const cache = new Map();
const scrollCache = new Map();

const getCurrentRoute = () => window.location.pathname + window.location.search;

// ====================================================================
// 2. PURE HELPERS
// ====================================================================

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

const getRSCPayload = (rscKey) => {
  const url = rscKey.split("::")[0];
  // Important: url must already be normalized here
  if (cache.has(url)) return cache.get(url);

  const content = createFromFetch(
    fetch("/____rsc_payload_error____" + url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: {
          message: window.__DINOU_ERROR_MESSAGE__ || "Unknown Error",
          stack: window.__DINOU_ERROR_STACK__,
          name: window.__DINOU_ERROR_NAME__,
        },
      }),
    }),
  );
  cache.set(url, content);
  return content;
};

// ====================================================================
// 3. ROUTER COMPONENT
// ====================================================================

function Router() {
  const [route, setRoute] = useState(getCurrentRoute());
  const [isPopState, setIsPopState] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [version, setVersion] = useState(0);

  // 🔌 EFFECT 1: Expose Global Prefetch
  useEffect(() => {
    window.__DINOU_PREFETCH__ = (url) => {
      // 🛡️ PREFETCH PROTECTION: If it's a local hash, do nothing
      if (isHashChangeOnly(url)) return;
      getRSCPayload(url);
    };

    // Hydration
    document.body.setAttribute("data-hydrated", "true");
  }, []); // Only on mount

  // 🧭 NAVIGATE FUNCTION (Core Logic)
  const navigate = (href, options = {}) => {
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
      // console.log(`[Router] Force refreshing: ${finalPath}`);
      cache.delete(finalPath);
    }

    // Normal RSC Navigation
    scrollCache.set(
      window.location.pathname + window.location.search,
      window.scrollY,
    );
    // cache.delete(finalPath);
    if (options.replace) {
      window.history.replaceState(null, "", finalPath);
    } else {
      window.history.pushState(null, "", finalPath);
    }

    startTransition(() => {
      setIsPopState(false);
      setRoute(finalPath);
    });
  };

  const back = () => window.history.back();
  const forward = () => window.history.forward();
  const refresh = () => {
    const currentPath = window.location.pathname + window.location.search;
    // console.log(`[Router] Soft Refreshing: ${currentPath}`);

    // 1. Delete cache to ensure fresh data
    cache.delete(currentPath);

    // 2. Start transition (to show isPending if you want)
    startTransition(() => {
      // 3. Increment version to force re-execution of useMemo
      setVersion((v) => v + 1);
    });
  };

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
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:"))
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
      const target = getCurrentRoute();
      // Optional: cache.delete(target); // Uncomment if you want refresh on going back
      startTransition(() => {
        setIsPopState(true);
        setRoute(target);
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

    requestAnimationFrame(() => {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "auto" });
      }
    });
  }, [route]);

  // RSC Logic
  const rscKey = route + "::" + version;
  const content = getRSCPayload(rscKey);

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

  return (
    <RouterContext.Provider value={contextValue}>
      {use(content)}
    </RouterContext.Provider>
  );
}

hydrateRoot(document, <Router />);

if (import.meta.hot) {
  import.meta.hot.accept();
}
