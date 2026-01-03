"use client";

import { useRouter } from "./navigation.js";
import { resolveUrl } from "./navigation-utils.js";

export function Link({
  href,
  children,
  prefetch = true,
  fresh = false,
  ...props
}) {
  const { push } = useRouter();

  const handlePrefetch = () => {
    if (!prefetch || !href || fresh) return;
    const finalPath = resolveUrl(href, window.location.pathname);
    // Llamamos a la función global que expondremos en client.jsx
    if (window.__DINOU_PREFETCH__) {
      window.__DINOU_PREFETCH__(finalPath);
    }
  };

  const handleClick = (e) => {
    // Teclas especiales (abrir en pestaña nueva, etc)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    push(href, { fresh }); // navigate ya usará la lógica de resolución interna
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={handlePrefetch} // ¡Magia!
      {...props}
    >
      {children}
    </a>
  );
}
