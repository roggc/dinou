// dinou/core/client.jsx
import {
  use,
  useState,
  useEffect,
  useTransition,
  useLayoutEffect,
  useMemo, // 1. Añadimos useMemo
} from "react";
import { createFromFetch } from "react-server-dom-webpack/client";
import { hydrateRoot } from "react-dom/client";
import { RouterContext } from "./navigation.js";

const cache = new Map();
const scrollCache = new Map();

const getCurrentRoute = () => window.location.pathname + window.location.search;

function Router() {
  const [route, setRoute] = useState(getCurrentRoute());
  const [isPopState, setIsPopState] = useState(false);
  // ⚡️ HOOK DE TRANSICIÓN
  // isPending será true mientras React espera el fetch del RSC y el renderizado
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    document.body.setAttribute("data-hydrated", "true");
  }, []);

  // ⚡️ NUEVA FUNCIÓN: navigate
  // Esta es la pieza clave que expone la lógica al mundo
  const navigate = (href, options = {}) => {
    // 1. Guardar scroll actual
    scrollCache.set(
      window.location.pathname + window.location.search,
      window.scrollY
    );

    // 2. Actualizar Historial (Soporte para replace o push)
    if (options.replace) {
      window.history.replaceState(null, "", href);
    } else {
      window.history.pushState(null, "", href);
    }

    // 3. Actualizar React
    startTransition(() => {
      setIsPopState(false);
      setRoute(href);
    });
  };

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const onNavigate = (e) => {
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
      if (!href || !href.startsWith("/")) return;

      e.preventDefault();

      // ♻️ REUTILIZAMOS LA FUNCIÓN NAVIGATE
      navigate(href);
    };

    const onPopState = () => {
      startTransition(() => {
        setIsPopState(true);
        setRoute(getCurrentRoute());
      });
    };

    window.addEventListener("click", onNavigate);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("click", onNavigate);
      window.removeEventListener("popstate", onPopState);
    };
  }, []); // Dependencias vacías, navigate es estable dentro del closure, pero mejor así.

  useLayoutEffect(() => {
    requestAnimationFrame(() => {
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

  // Lógica RSC
  let content = cache.get(route);
  if (!content) {
    const payloadUrl = window.__DINOU_USE_OLD_RSC__
      ? "/____rsc_payload_old____" + route
      : "/____rsc_payload____" + route;

    content = createFromFetch(fetch(payloadUrl));
    cache.set(route, content);
  }

  // 📦 VALOR DEL CONTEXTO: Ahora es un Objeto
  // Usamos useMemo para evitar re-renders innecesarios si algo más cambiara
  const contextValue = useMemo(
    () => ({
      url: route, // La URL actual
      navigate, // La función para navegar
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
