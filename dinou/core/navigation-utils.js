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

/**
 * Interpolates dynamic route segments (`[param]`, `[...param]`, `[[param]]`, `[[...param]]`)
 * using the provided `params` dictionary while preserving query strings and hashes.
 * Fast-paths static and already-interpolated URLs with zero allocations.
 */
export function interpolateRouteParams(href, params) {
  if (!href || typeof href !== "string") {
    return "";
  }

  if (!params && !href.includes("[")) {
    return href;
  }

  if (isExternalUrl(href)) {
    return href;
  }

  const qIdx = href.indexOf("?");
  const hIdx = href.indexOf("#");
  let splitIdx = -1;
  if (qIdx !== -1 && hIdx !== -1) splitIdx = Math.min(qIdx, hIdx);
  else if (qIdx !== -1) splitIdx = qIdx;
  else if (hIdx !== -1) splitIdx = hIdx;

  const pathnamePart = splitIdx === -1 ? href : href.slice(0, splitIdx);
  const suffix = splitIdx === -1 ? "" : href.slice(splitIdx);

  if (!pathnamePart || !pathnamePart.includes("[")) {
    return href;
  }

  const isDev =
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV !== "production";

  const hasLeadingSlash = pathnamePart.startsWith("/");
  const rawSegments = (
    hasLeadingSlash ? pathnamePart.slice(1) : pathnamePart
  ).split("/");
  const outSegments = [];

  for (const seg of rawSegments) {
    if (seg === "") continue;

    if (seg.startsWith("[[...") && seg.endsWith("]]")) {
      const key = seg.slice(5, -2);
      const val = params ? params[key] : undefined;
      if (val == null) continue;
      if (Array.isArray(val)) {
        for (const item of val) {
          if (item != null && String(item) !== "") {
            outSegments.push(encodeURIComponent(String(item)));
          }
        }
      } else if (String(val) !== "") {
        outSegments.push(encodeURIComponent(String(val)));
      }
    } else if (seg.startsWith("[[") && seg.endsWith("]]")) {
      const key = seg.slice(2, -2);
      const val = params ? params[key] : undefined;
      if (val == null || String(val) === "") continue;
      outSegments.push(encodeURIComponent(String(val)));
    } else if (seg.startsWith("[...") && seg.endsWith("]")) {
      const key = seg.slice(4, -1);
      const val = params ? params[key] : undefined;
      if (Array.isArray(val) && val.length > 0) {
        for (const item of val) {
          outSegments.push(encodeURIComponent(String(item)));
        }
      } else if (val != null && !Array.isArray(val) && String(val) !== "") {
        outSegments.push(encodeURIComponent(String(val)));
      } else {
        if (isDev) {
          console.error(
            `[Dinou] Missing required catch-all route parameter "${key}" for route pattern "${href}".`
          );
        }
        outSegments.push(seg);
      }
    } else if (seg.startsWith("[") && seg.endsWith("]")) {
      const key = seg.slice(1, -1);
      const val = params ? params[key] : undefined;
      if (val != null && String(val) !== "") {
        outSegments.push(encodeURIComponent(String(val)));
      } else {
        if (isDev) {
          console.error(
            `[Dinou] Missing required route parameter "${key}" for route pattern "${href}".`
          );
        }
        outSegments.push(seg);
      }
    } else {
      outSegments.push(seg);
    }
  }

  const interpolatedPath = hasLeadingSlash
    ? "/" + outSegments.join("/")
    : outSegments.join("/");

  return interpolatedPath + suffix;
}

export function resolveBasePathname(from, currentPathname) {
  if (!from || typeof from !== "string" || !currentPathname) {
    return currentPathname || "/";
  }
  const cleanFrom = from.startsWith("/") ? from : "/" + from;
  if (cleanFrom === "/") {
    return "/";
  }
  const fromSegs = cleanFrom.slice(1).split("/").filter(Boolean);
  if (fromSegs.some((s) => s.startsWith("[...") || s.startsWith("[["))) {
    return currentPathname;
  }
  const pathSegs = currentPathname
    .split("?")[0]
    .split("#")[0]
    .split("/")
    .filter(Boolean);
  if (pathSegs.length < fromSegs.length) {
    return currentPathname;
  }
  for (let i = 0; i < fromSegs.length; i++) {
    const fSeg = fromSegs[i];
    if (fSeg.startsWith("[") && fSeg.endsWith("]")) continue;
    if (fSeg !== pathSegs[i]) return currentPathname;
  }
  return "/" + pathSegs.slice(0, fromSegs.length).join("/");
}

export function resolveUrl(href, currentPathname, from) {
  if (!href) {
    return "";
  }

  if (isExternalUrl(href)) {
    return href;
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";

  if (href.startsWith("/") || href.includes("://")) {
    const url = new URL(href, origin);
    return normalize(url.pathname + url.search + url.hash);
  }

  const isQueryOrHashOnly = href.startsWith("?") || href.startsWith("#");
  let base =
    (!isQueryOrHashOnly && from
      ? resolveBasePathname(from, currentPathname)
      : currentPathname) || "/";
  if (!isQueryOrHashOnly && !base.endsWith("/")) base += "/";

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
