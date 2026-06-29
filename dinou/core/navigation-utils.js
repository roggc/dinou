export function isExternalUrl(href) {
  if (!href) return false;

  // Protocol-relative (e.g. //google.com)
  if (href.startsWith("//")) {
    return true;
  }

  // Absolute with protocol (e.g. https://google.com)
  if (href.includes("://")) {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
      const url = new URL(href, origin);
      return url.origin !== origin;
    } catch (e) {
      return true;
    }
  }

  // Other protocols (mailto:, tel:, javascript:, etc.)
  if (/^[a-zA-Z0-9+-.]+:[^//]/.test(href) || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
    return true;
  }

  return false;
}

export function resolveUrl(href, currentPathname) {
  if (isExternalUrl(href)) {
    return href;
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";

  if (href.startsWith("/") || href.includes("://")) {
    const url = new URL(href, origin);
    return normalize(url.pathname + url.search + url.hash);
  }

  let base = currentPathname;
  if (!base.endsWith("/")) base += "/";

  const resolved = new URL(href, origin + base);
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
