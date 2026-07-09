function normalizePathCase(p) {
  if (process.platform === "win32" && typeof p === "string" && p[1] === ":") {
    return p.charAt(0).toLowerCase() + p.slice(1);
  }
  return p;
}

module.exports = {
  normalizePathCase,
};
