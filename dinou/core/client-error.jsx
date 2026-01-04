// dinou/core/client.jsx
import {
  use,
  useState,
  useEffect,
  useTransition,
  useLayoutEffect,
  useMemo,
} from "react";
import { createFromFetch } from "@roggc/react-server-dom-esm/client";
import { hydrateRoot } from "react-dom/client";
import { RouterContext } from "./navigation.js";
import { resolveUrl } from "./navigation-utils.js";

// ====================================================================
// 1. ESTADO GLOBAL (Fuera del componente)
// ====================================================================
const cache = new Map();
const scrollCache = new Map();

const getCurrentRoute = () => window.location.pathname + window.location.search;

// ====================================================================
// 2. HELPERS PUROS
// ====================================================================

// Helper para detectar si solo cambiamos el hash en la misma página
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

const getRSCPayload = (url) => {
  // Importante: url ya debe venir normalizada aquí
  if (cache.has(url)) return cache.get(url);

  const content = createFromFetch(
    fetch("/____rsc_payload_error____" + url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: {
          message: window.__DINOU_ERROR_MESSAGE__ || "Unknown error",
          stack: window.__DINOU_ERROR_STACK__ || "No stack trace available",
        },
      }),
    })
  );
  cache.set(url, content);
  return content;
};

// ====================================================================
// 3. COMPONENTE ROUTER
// ====================================================================

function Router() {
  const [route, setRoute] = useState(getCurrentRoute());
  const [isPopState, setIsPopState] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [version, setVersion] = useState(0);

  // 🔌 EFECTO 1: Exponer Prefetch Global
  useEffect(() => {
    window.__DINOU_PREFETCH__ = (url) => {
      // 🛡️ PROTECCIÓN PREFETCH: Si es un hash local, no hacemos nada
      if (isHashChangeOnly(url)) return;
      getRSCPayload(url);
    };

    // Hidratación
    document.body.setAttribute("data-hydrated", "true");
  }, []); // Solo al montar

  // 🧭 FUNCIÓN NAVIGATE (Core Logic)
  const navigate = (href, options = {}) => {
    const finalPath = resolveUrl(href, window.location.pathname);

    // 🛡️ PROTECCIÓN NAVIGATE: Detección de Hash
    if (isHashChangeOnly(finalPath)) {
      if (options.replace) {
        window.history.replaceState(null, "", finalPath);
      } else {
        window.history.pushState(null, "", finalPath);
      }

      // Scroll manual
      const hash = new URL(finalPath, window.location.origin).hash;
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "auto" });
      }
      return; // STOP CRÍTICO
    }

    if (options.fresh) {
      // console.log(`[Router] Force refreshing: ${finalPath}`);
      cache.delete(finalPath);
    }

    // Navegación RSC Normal
    scrollCache.set(
      window.location.pathname + window.location.search,
      window.scrollY
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

    // 1. Borrar caché para asegurar datos frescos
    cache.delete(currentPath);

    // 2. Iniciar transición (para mostrar isPending si quieres)
    startTransition(() => {
      // 3. Incrementamos versión para forzar re-ejecución de useMemo
      setVersion((v) => v + 1);
    });
  };

  // 🔌 EFECTO 2: Listeners Globales (Click y PopState)
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const onNavigate = (e) => {
      // 🛡️ FIX: Si el evento ya fue procesado (preventDefault llamado por Link), lo ignoramos.
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

      // Usamos el helper unificado
      const finalPath = resolveUrl(href, window.location.pathname);

      // Usamos el mismo helper de detección de hash para consistencia
      if (isHashChangeOnly(finalPath)) {
        return; // El navegador lo maneja nativamente o el navigate lo manejaría
      }

      e.preventDefault();
      navigate(href);
    };

    const onPopState = () => {
      const target = getCurrentRoute();
      // Opcional: cache.delete(target); // Descomenta si quieres refresh al volver atrás
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

  // 🔌 EFECTO 3: Gestión de Scroll (Restauración)
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

  // 🔌 EFECTO 4: Gestión de Scroll (Hash en página nueva)
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

  // Lógica RSC
  const content = getRSCPayload(route);

  const contextValue = useMemo(
    () => ({
      url: route,
      navigate,
      back,
      forward,
      refresh,
      isPending,
    }),
    [route, isPending]
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
