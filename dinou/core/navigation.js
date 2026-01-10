// dinou/core/navigation.js
"use client";
import React from "react";

// Defensive mocks
const createContext =
  React.createContext ||
  ((defaultValue) => ({
    Provider: ({ children }) => children,
    _currentValue: defaultValue,
  }));
const useContext = React.useContext || (() => null);

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
      push: () => {},
      replace: () => {},
      back: () => {},
      forward: () => {},
      refresh: () => {},
    };
  }

  return {
    push: (href, options) => context.navigate(href, options),
    replace: (href, options) =>
      context.navigate(href, { replace: true, ...options }),

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
     */
    refresh: () => context.refresh(),
  };
}

export function usePathname() {
  // 🟢 1. SERVER LOGIC (SSR)
  if (typeof window === "undefined") {
    try {
      const dynamicRequire = require;
      // 🛡️ webpackIgnore to avoid bundling server things
      const { getContext } = dynamicRequire(
        /* webpackIgnore: true */ "./request-context.js"
      );
      const ctx = getContext();
      if (ctx && ctx.req) {
        return normalizePath(ctx.req.path);
      }
    } catch (e) {}
  }

  // 🔵 2. CLIENT LOGIC
  const context = useContext(RouterContext);

  // ⚠️ CRITICAL CHANGE: Now we extract .url from the object
  // We support both cases just in case (old string or new object)
  const fullRoute = typeof context === "string" ? context : context.url;

  if (typeof fullRoute !== "string") {
    return "";
  }

  const path = fullRoute.split("?")[0];
  return normalizePath(path);
}

export function useSearchParams() {
  // 🟢 1. SERVER LOGIC
  if (typeof window === "undefined") {
    try {
      const dynamicRequire = require;
      const { getContext } = dynamicRequire(
        /* webpackIgnore: true */ "./request-context.js"
      );
      const ctx = getContext();
      if (ctx && ctx.req && ctx.req.query) {
        const params = new URLSearchParams();
        Object.entries(ctx.req.query).forEach(([key, val]) => {
          if (Array.isArray(val)) val.forEach((v) => params.append(key, v));
          else if (val) params.append(key, val);
        });
        return params;
      }
    } catch (e) {}
  }

  // 🔵 2. CLIENT LOGIC
  const context = useContext(RouterContext);

  // ⚠️ CRITICAL CHANGE: We extract .url
  const fullRoute = typeof context === "string" ? context : context.url;

  if (typeof fullRoute !== "string") return new URLSearchParams();

  const searchPart = fullRoute.split("?")[1] || "";
  return new URLSearchParams(searchPart);
}
