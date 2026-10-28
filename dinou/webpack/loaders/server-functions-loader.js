import path from "node:path";
import { normalizePathCase } from "../../core/path-utils.js";
import parseExports from "../../core/parse-exports.js";
import { useClientRegex, useServerRegex } from "../../constants.js";
import { extractServerFunctions, hasServerFunctions } from "../../core/transform-server-functions.js";

export default function (source) {
  const options = this.getOptions ? this.getOptions() : {};
  const trimmed = source.trim();

  if (useClientRegex.test(trimmed)) {
    return source;
  }

  const norm = path.resolve(this.resourcePath).replace(/\\/g, "/").toLowerCase();

  const isModuleLevel = useServerRegex.test(trimmed);
  const hasBodyUseServer = !isModuleLevel && hasServerFunctions(source);

  if (options.serverFiles) {
    if (!options.serverFiles.has(norm)) {
      if (!isModuleLevel && !hasBodyUseServer) {
        return source;
      }
      options.serverFiles.add(norm);
    }
  }

  if (!isModuleLevel && !hasBodyUseServer) {
    if (options.serverFiles) {
      options.serverFiles.delete(norm);
    }
    return source;
  }

  const exports = isModuleLevel
    ? parseExports(source)
    : extractServerFunctions(source, this.resourcePath);
  if (!exports || exports.length === 0) {
    if (options.serverFiles) {
      options.serverFiles.delete(norm);
    }
    return source;
  }

  // Build IDs
  const moduleId = this.resourcePath;
  const relativePath = path.relative(
    normalizePathCase(process.cwd()),
    normalizePathCase(moduleId)
  );
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
        key,
      )})(...args)
  );
`;
    } else {
      proxyCode += `
export const ${exp} = (...args) =>
  loadProxy().then(mod => (mod.default ?? mod ?? window.__SERVER_FUNCTION_PROXY_LIB__).createServerFunctionProxy(${JSON.stringify(
        key,
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
    JSON.stringify(manifestEntry, null, 2),
  );

  return proxyCode;
};
