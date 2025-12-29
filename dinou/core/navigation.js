// dinou/core/navigation.js
"use client";
import React from "react";

// Mocks defensivos
const createContext =
  React.createContext ||
  ((defaultValue) => ({
    Provider: ({ children }) => children,
    _currentValue: defaultValue,
  }));
const useContext = React.useContext || (() => null);

// 🔄 CAMBIO: Valor por defecto ahora es un objeto compatible
export const RouterContext = createContext({
  url: "",
  navigate: (url) => {
    console.warn("navigate called outside Router");
  },
  isPending: false, // Default value
});

// Función de limpieza (Mantenemos la lógica de trailing slash)
function normalizePath(path) {
  if (!path) return "";
  if (path === "/") return "/";
  if (path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

// ⏳ NUEVO HOOK: useNavigationLoading
export function useNavigationLoading() {
  // 1. En el servidor siempre es false
  if (typeof window === "undefined") {
    return false;
  }

  // 2. En el cliente, leemos del contexto
  const context = useContext(RouterContext);

  // Si el contexto es antiguo (string) o nulo, asumimos false
  if (!context || typeof context === "string") {
    return false;
  }

  return context.isPending;
}

// 🧭 NUEVO HOOK: useRouter
export function useRouter() {
  const context = useContext(RouterContext);

  // En el servidor (SSR), context.navigate no hará nada, lo cual es correcto.
  // En el cliente, usará la función definida en client.jsx.
  return {
    push: (href) => context.navigate(href),
    replace: (href) => context.navigate(href, { replace: true }),
    // Futuro: back(), forward(), refresh()...
  };
}

export function usePathname() {
  // 🟢 1. LÓGICA DE SERVIDOR (SSR)
  if (typeof window === "undefined") {
    try {
      const dynamicRequire = require;
      // 🛡️ webpackIgnore para evitar bundling de cosas de servidor
      const { getContext } = dynamicRequire(
        /* webpackIgnore: true */ "./request-context.js"
      );
      const ctx = getContext();
      if (ctx && ctx.req) {
        return normalizePath(ctx.req.path);
      }
    } catch (e) {}
  }

  // 🔵 2. LÓGICA DE CLIENTE
  const context = useContext(RouterContext);

  // ⚠️ CAMBIO CRÍTICO: Ahora extraemos .url del objeto
  // Soportamos ambos casos por si acaso (string antiguo o objeto nuevo)
  const fullRoute = typeof context === "string" ? context : context.url;

  if (typeof fullRoute !== "string") {
    return "";
  }

  const path = fullRoute.split("?")[0];
  return normalizePath(path);
}

export function useSearchParams() {
  // 🟢 1. LÓGICA DE SERVIDOR
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

  // 🔵 2. LÓGICA DE CLIENTE
  const context = useContext(RouterContext);

  // ⚠️ CAMBIO CRÍTICO: Extraemos .url
  const fullRoute = typeof context === "string" ? context : context.url;

  if (typeof fullRoute !== "string") return new URLSearchParams();

  const searchPart = fullRoute.split("?")[1] || "";
  return new URLSearchParams(searchPart);
}
