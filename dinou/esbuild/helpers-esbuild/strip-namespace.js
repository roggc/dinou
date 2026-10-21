export function stripNamespace(p) {
  if (!p) return "";
  if (/^[a-zA-Z]:[/\\]/.test(p)) {
    return p;
  }
  return p.replace(/^[a-zA-Z0-9_-]+:/, "");
}

export default stripNamespace;
