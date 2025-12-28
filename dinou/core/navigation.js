"use client";
import React from "react";
// console.log("🔥🔥 NAVIGATION MODULE INITIALIZED 🔥🔥");
// Mocks defensivos
const createContext =
  React.createContext ||
  ((defaultValue) => ({
    Provider: ({ children }) => children,
    _currentValue: defaultValue,
  }));
const useContext = React.useContext || (() => null);

export const RouterContext = createContext("");

// 🧹 UTILIDAD DE NORMALIZACIÓN
// Quita la barra final, excepto si es la raíz "/"
function normalizePath(path) {
  if (!path) return "";
  if (path === "/") return "/";
  if (path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export function usePathname() {
  // 🟢 1. LÓGICA DE SERVIDOR (SSR)
  if (typeof window === "undefined") {
    try {
      const dynamicRequire = require;
      const { getContext } = dynamicRequire(
        /* webpackIgnore: true */ "./request-context.js"
      );
      const ctx = getContext();

      if (ctx && ctx.req) {
        // APLICAMOS NORMALIZACIÓN AQUÍ
        return normalizePath(ctx.req.path);
      }
    } catch (e) {}
  }

  // 🔵 2. LÓGICA DE CLIENTE
  const fullRoute = useContext(RouterContext);

  if (typeof fullRoute !== "string") {
    return "";
  }

  const path = fullRoute.split("?")[0];
  // APLICAMOS NORMALIZACIÓN AQUÍ TAMBIÉN
  return normalizePath(path);
}

export function useSearchParams() {
  // ... (Esta parte se queda igual, search params no les afecta el trailing slash del path)
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

  const fullRoute = useContext(RouterContext);
  if (typeof fullRoute !== "string") return new URLSearchParams();

  const searchPart = fullRoute.split("?")[1] || "";
  return new URLSearchParams(searchPart);
}
// export const RouterContext = createContext({
//   url: "/",
//   navigate: (url) => {},
// });
