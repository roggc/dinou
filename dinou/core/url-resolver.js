export function resolveRelativeUrl(href, currentPathname) {
  if (!href || typeof href !== "string") {
    return "/";
  }
  if (href.startsWith("/") || href.includes("://")) {
    return href;
  }
  let base = String(currentPathname || "/").split("?")[0].split("#")[0] || "/";
  if (!base.endsWith("/")) {
    base += "/";
  }
  const resolved = new URL(href, "http://localhost" + base);
  return resolved.pathname + resolved.search + resolved.hash;
}

export default { resolveRelativeUrl };
