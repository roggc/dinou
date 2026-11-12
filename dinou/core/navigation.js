// dinou/core/navigation.js
"use client";
import React from "react";
import { interpolateRouteParams, resolveUrl } from "./navigation-utils.js";

// Defensive mocks
const createContext =
  React.createContext ||
  ((defaultValue) => ({
    Provider: ({ children }) => children,
    _currentValue: defaultValue,
  }));
const useContext = React.useContext || (() => null);
const useState =
  React.useState ||
  ((init) => [typeof init === "function" ? init() : init, () => {}]);
const useEffect = React.useEffect || (() => {});
const useSyncExternalStore =
  React.useSyncExternalStore || ((_sub, getSnap) => getSnap());
const emptySubscribe = () => () => {};

// 🔄 CHANGE: Now default value is a compatible object
export const RouterContext = createContext({
  url: "",
  navigate: (url) => {
    console.warn("navigate called outside Router");
  },
  isPending: false, // Default value
});

// Cleanup function (We keep the trailing slash logic)
function normalizePath(path) {
  if (!path) return "";
  if (path === "/") return "/";
  if (path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

// ⏳ NEW HOOK: useNavigationLoading
export function useNavigationLoading() {
  // 1. On the server it is always false
  if (typeof window === "undefined") {
    return false;
  }

  // 2. On the client, we read from the context
  const context = useContext(RouterContext);

  // If the context is old (string) or null, we assume false
  if (!context || typeof context === "string") {
    return false;
  }

  return context.isPending;
}

/**
 * A Client Component hook that allows you to programmatically navigate between routes.
 */
export function useRouter() {
  const context = useContext(RouterContext);

  // Guards for SSR (optional, but good practice)
  if (!context) {
    // On the server we return empty functions to not break the rendering
    return {
      push: () => { },
      replace: () => { },
      back: () => { },
      forward: () => { },
      refresh: (options) => { },
      refreshSlot: (slotId, options) => Promise.resolve(),
    };
  }

  return {
    push: (href, options) => { const { params, from, ...restOptions } = options || {}; const interpolated = interpolateRouteParams(href, params); const target = from && typeof window !== "undefined" ? resolveUrl(interpolated, window.location.pathname, from) : interpolated; return context.navigate(target, restOptions); },
    replace: (href, options) => { const { params, from, ...restOptions } = options || {}; const interpolated = interpolateRouteParams(href, params); const target = from && typeof window !== "undefined" ? resolveUrl(interpolated, window.location.pathname, from) : interpolated; return context.navigate(target, { replace: true, ...restOptions }); },


    /**
     * Navigate back in the browser's history.
     * Equivalent to clicking the browser's Back button.
     */
    back: () => context.back(),

    /**
     * Navigate forward in the browser's history.
     */
    forward: () => context.forward(),

    /**
     * Refresh the current route.
     * Makes a new request to the server for the current URL, clearing the cache,
     * and re-renders the server component without a full browser reload.
     * Pass `{ layout: true }` to also invalidate and re-render the layout.
     */
    refresh: (options) => context.refresh(options),

    /**
     * Refresh a specific DinouCacheSlot without re-rendering the rest of the page.
     * @param {string} slotId The ID or tag of the slot to refresh.
     * @param {object} [options] Optional configuration ({ fresh?: boolean }).
     */
    refreshSlot: (slotId, options) => refreshSlot(slotId, options),
  };
}

export function refreshSlot(slotId, options) {
  if (typeof window !== "undefined") {
    if (typeof window.__DINOU_REFRESH_SLOT__ === "function") {
      return window.__DINOU_REFRESH_SLOT__(slotId, options);
    }
    const promises = [];
    window.dispatchEvent(
      new CustomEvent("dinou:refresh-slot", {
        detail: { id: slotId, options, promises },
      })
    );
    return Promise.all(promises).then(() => undefined);
  }
  return Promise.resolve();
}

const DINOU_CONTEXT_KEY = Symbol.for("dinou.request.context.storage");
const BAILOUT_RAW_TARGET = Symbol.for("dinou.bailout.raw");

function queryObjectToURLSearchParams(query) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, val]) => {
    if (Array.isArray(val)) {
      val.forEach((v) => {
        if (v !== undefined && v !== null) params.append(key, String(v));
      });
    } else if (val !== undefined && val !== null) {
      params.append(key, String(val));
    }
  });
  return params;
}

export function usePathname() {
  // 🟢 1. SERVER LOGIC (SSR)
  if (typeof window === "undefined") {
    try {
      const storage = globalThis[DINOU_CONTEXT_KEY];
      const ctx = (storage && typeof storage.getStore === "function" ? storage.getStore() : null)
        || globalThis[Symbol.for("dinou.request.context.current")];
      if (ctx && ctx.req) {
        return normalizePath(ctx.req.path);
      }
    } catch (e) {
      console.log("error getContext usePathname", e);
    }
  }

  // 🔵 2. CLIENT LOGIC
  const context = useContext(RouterContext);

  // ⚠️ CRITICAL CHANGE: Now we extract .url from the object
  // We support both cases just in case (old string or new object)
  const fullRoute = typeof context === "string" ? context : context.url;

  if (typeof fullRoute !== "string") {
    return "";
  }

  const path = fullRoute.split("#")[0].split("?")[0];
  return normalizePath(path);
}

export function useSearchParams() {
  // 🟢 1. SERVER LOGIC
  if (typeof window === "undefined") {
    try {
      const storage = globalThis[DINOU_CONTEXT_KEY];
      const ctx =
        (storage && typeof storage.getStore === "function"
          ? storage.getStore()
          : null) || globalThis[Symbol.for("dinou.request.context.current")];
      const clientH =
        React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?.H;
      const isClientSsrRender =
        typeof React.useState === "function" &&
        Boolean(clientH) &&
        !clientH._dinouIsServerHooksDispatcher;
      if (isClientSsrRender) {
        if (!ctx || ctx._isPprRuntimeResume || ctx._isStaticHtmlRender) {
          return new URLSearchParams();
        }
        const rawQuery =
          ctx.req && ctx.req.query
            ? ctx.req.query[BAILOUT_RAW_TARGET] || ctx.req.query
            : null;
        if (rawQuery) {
          return queryObjectToURLSearchParams(rawQuery);
        }
        return new URLSearchParams();
      }
      if (ctx && ctx.req && ctx.req.query) {
        return queryObjectToURLSearchParams(ctx.req.query);
      }
    } catch (e) {
      if (
        e &&
        (e.$$typeof === Symbol.for("dinou.ppr.postpone") ||
          e.$$typeof === Symbol.for("react.postpone") ||
          e.$$typeof === Symbol.for("dinou.ppr.skipStatic"))
      ) {
        throw e;
      }
    }
    return new URLSearchParams();
  }

  // 🔵 2. CLIENT LOGIC
  const context = useContext(RouterContext);
  const isReactHydrating = useSyncExternalStore(
    emptySubscribe,
    () => false,
    () => true
  );
  const isStaticHydrating =
    isReactHydrating &&
    typeof window !== "undefined" &&
    Boolean(window.__DINOU_USE_STATIC__ || window.__DINOU_PPR_RESUME__);

  if (isStaticHydrating) {
    return new URLSearchParams();
  }

  // ⚠️ CRITICAL CHANGE: We extract .url
  const fullRoute = typeof context === "string" ? context : context?.url;

  if (typeof fullRoute === "string" && fullRoute.includes("?")) {
    const searchPart = (fullRoute.split("?")[1] || "").split("#")[0];
    return new URLSearchParams(searchPart);
  }

  if (typeof window !== "undefined" && window.location && window.location.search) {
    return new URLSearchParams(window.location.search);
  }

  return new URLSearchParams();
}

