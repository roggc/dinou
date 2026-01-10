export function resolveUrl(href, currentPathname) {
  if (href.startsWith("/") || href.includes("://")) {
    const url = new URL(href, window.location.origin);
    return normalize(url.pathname + url.search + url.hash);
  }

  let base = currentPathname;
  if (!base.endsWith("/")) base += "/";

  const resolved = new URL(href, window.location.origin + base);
  return normalize(resolved.pathname + resolved.search + resolved.hash);
}

function normalize(path) {
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
