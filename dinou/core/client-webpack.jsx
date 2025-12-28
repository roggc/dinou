import {
  use,
  useState,
  useEffect,
  startTransition,
  useLayoutEffect,
} from "react";
import { createFromFetch } from "react-server-dom-webpack/client";
import { hydrateRoot } from "react-dom/client";
import { RouterContext } from "./navigation.js";

// Caché global para no volver a pedir payloads de rutas ya visitadas
const cache = new Map();
const scrollCache = new Map();

// Función auxiliar para calcular la ruta relativa actual
const getCurrentRoute = () => window.location.pathname + window.location.search;

function Router() {
  // 1. Estado que controla la URL actual
  const [route, setRoute] = useState(getCurrentRoute());
  // Estado para saber si la navegación actual fue por "Pop" (Atrás/Adelante)
  const [isPopState, setIsPopState] = useState(false);

  useEffect(() => {
    document.body.setAttribute("data-hydrated", "true");
  }, []);

  // 2. Efecto para interceptar clicks en enlaces <a>
  useEffect(() => {
    // Desactivar restauración automática del navegador
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const onNavigate = (e) => {
      // Buscamos si el click fue en un <a> o dentro de uno
      const anchor = e.target.closest("a");

      // Si no es un enlace, o tiene target blank, o teclas modificadoras, ignoramos
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

      // Verificamos que sea un enlace interno (mismo dominio)
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/")) return;

      // 🛑 PREVENIMOS LA RECARGA DEL NAVEGADOR
      e.preventDefault();

      // 1. Guardar scroll actual antes de irnos
      scrollCache.set(
        window.location.pathname + window.location.search,
        window.scrollY
      );

      // Cambiamos la URL en la barra de direcciones sin recargar
      window.history.pushState(null, "", href);

      // Usamos startTransition para que la UI no se bloquee mientras llega el payload
      startTransition(() => {
        setIsPopState(false); // Es una navegación nueva
        setRoute(href);
      });
    };

    // 3. Efecto para manejar los botones Atrás/Adelante del navegador
    const onPopState = () => {
      startTransition(() => {
        setIsPopState(true); // Es una navegación de historial
        setRoute(getCurrentRoute());
      });
    };

    window.addEventListener("click", onNavigate);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("click", onNavigate);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useLayoutEffect(() => {
    // requestAnimationFrame asegura que el DOM esté listo
    requestAnimationFrame(() => {
      if (isPopState) {
        const key = route; // Ojo, route ya tiene pathname + search
        const savedY = scrollCache.get(key);

        // console.log(
        //   `[Router] POP detected. Key: ${key}, SavedY: ${savedY}, CurrentHeight: ${document.body.scrollHeight}`
        // );

        if (savedY !== undefined) {
          window.scrollTo(0, savedY);
        }
      } else {
        // console.log(`[Router] PUSH detected. Scrolling to top.`);
        window.scrollTo(0, 0);
      }
    });
  }, [route, isPopState]);

  // 4. Lógica de Obtención de Datos (RSC)
  let content = cache.get(route);

  // Si no está en caché, pedimos el Payload
  if (!content) {
    const payloadUrl = window.__DINOU_USE_OLD_RSC__
      ? "/____rsc_payload_old____" + route
      : "/____rsc_payload____" + route;

    content = createFromFetch(fetch(payloadUrl));
    cache.set(route, content);
  }

  // 5. PROVIDER: Envolvemos el contenido RSC con el Contexto
  // Pasamos 'route' (que es la URL completa relativa)
  return (
    <RouterContext.Provider value={route}>
      {use(content)}
    </RouterContext.Provider>
  );
}

// Hidratamos una sola vez con el Router
hydrateRoot(document, <Router />);

// HMR
if (import.meta.hot) {
  import.meta.hot.accept();
}
