// server-functions-loader-simple.js
const path = require("path");
const parseExports = require("../../core/parse-exports.js");

module.exports = function (source) {
  // Detect "use server"
  const lines = source.split("\n");
  let hasUseServer = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.startsWith('"use server"') ||
      trimmed.startsWith("'use server'")
    ) {
      hasUseServer = true;
      break;
    }
  }

  if (!hasUseServer) return source;

  const exports = parseExports(source);
  if (exports.length === 0) return source;

  // Build IDs
  const moduleId = this.resourcePath;
  const relativePath = path.relative(process.cwd(), moduleId);
  const normalizedPath = relativePath.replace(/\\/g, "/");

  const fileUrl = `file:///${normalizedPath}`;

  //
  // IMPORTANT: dynamic import instead of static import
  //
  // Webpack will NOT try to resolve "__SERVER_FUNCTION_PROXY__"
  // as a module → it will remain a string → replaced later → browser loads it.

  let proxyCode = `
const loadProxy = new Function('return import("/"+"__SERVER_FUNCTION_PROXY__")');
`;

  for (const exp of exports) {
    const key = exp === "default" ? `${fileUrl}#default` : `${fileUrl}#${exp}`;

    if (exp === "default") {
      proxyCode += `
export default (...args) =>
  loadProxy().then(mod =>
    (mod.default ?? mod ?? window.__SERVER_FUNCTION_PROXY_LIB__).createServerFunctionProxy(${JSON.stringify(
      key
    )})(...args)
  );
`;
    } else {
      proxyCode += `
export const ${exp} = (...args) =>
  loadProxy().then(mod => (mod.default ?? mod ?? window.__SERVER_FUNCTION_PROXY_LIB__).createServerFunctionProxy(${JSON.stringify(
    key
  )})(...args)
  );
`;
    }
  }

  // Emit manifest entry
  const manifestEntry = {
    path: normalizedPath,
    exports: exports,
  };

  this.emitFile(
    `server-functions/${normalizedPath}.json`,
    JSON.stringify(manifestEntry, null, 2)
  );

  return proxyCode;
};
