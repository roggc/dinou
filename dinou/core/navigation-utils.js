export function resolveUrl(href, currentPathname) {
  // 1. Si es absoluta (empieza por /) o es una URL completa, no tocamos base
  if (href.startsWith("/") || href.includes("://")) {
    const url = new URL(href, window.location.origin);
    return normalize(url.pathname + url.search + url.hash);
  }

  // 2. Si es relativa, aplicamos tu lógica de "añadir" (Directorio Virtual)
  let base = currentPathname;
  if (!base.endsWith("/")) base += "/";

  const resolved = new URL(href, window.location.origin + base);
  return normalize(resolved.pathname + resolved.search + resolved.hash);
}

function normalize(path) {
  // Evitamos que "/home/" y "/home" sean distintas, excepto para "/"
  if (
    path.length > 1 &&
    path.endsWith("/") &&
    !path.includes("?") &&
    !path.includes("#")
  ) {
    return path.slice(0, -1);
  }
  return path;
}
