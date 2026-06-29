function resolveRelativeUrl(href, currentPathname) {
  if (href.startsWith("/") || href.includes("://")) {
    return href;
  }
  let base = currentPathname || "/";
  if (!base.endsWith("/")) {
    base += "/";
  }
  const resolved = new URL(href, "http://localhost" + base);
  return resolved.pathname + resolved.search + resolved.hash;
}

module.exports = { resolveRelativeUrl };
