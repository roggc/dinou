function hasDirective(code, directive) {
  if (typeof code !== "string" || !code.includes(directive)) return false;
  const header = code
    .slice(0, 2000)
    .replace(/\/\/[^\r\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();
  return (
    header.startsWith(`"${directive}"`) ||
    header.startsWith(`'${directive}'`)
  );
}

const useClientRegex = {
  test(code) {
    return hasDirective(code, "use client");
  },
  [Symbol.match](str) {
    return this.test(str) ? [str] : null;
  },
};

const useServerRegex = {
  test(code) {
    return hasDirective(code, "use server");
  },
  [Symbol.match](str) {
    return this.test(str) ? [str] : null;
  },
};

module.exports = { useClientRegex, useServerRegex };
