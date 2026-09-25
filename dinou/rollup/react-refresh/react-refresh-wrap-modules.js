const frameworkEntries = new Set([
  "main.js",
  "error.js",
  "runtime.js",
  "refresh.js",
  "serverFunctionProxy.js",
  "dinouClientRedirect.js",
  "dinouLink.js",
  "__hmr_client__.js",
  "_commonjsHelpers.js",
]);

function reactRefreshWrapModules() {
  return {
    name: "react-refresh-wrap-modules",
    renderChunk(code, chunk) {
      if (
        !chunk ||
        !/\.(jsx?|tsx?)$/.test(chunk.fileName) ||
        frameworkEntries.has(chunk.fileName) ||
        chunk.fileName.includes("refresh.js") ||
        chunk.fileName.includes("runtime.js") ||
        chunk.fileName.includes("_commonjsHelpers")
      ) {
        return null;
      }

      // Only wrap user component chunks that contain actual app code (not third-party libraries)
      const modulePaths = Object.keys(chunk.modules || {});
      const hasUserCode = modulePaths.some(
        (p) =>
          !p.includes("node_modules") &&
          !p.includes("dinou[\\/]core") &&
          !p.includes("dinou[\\/]rollup") &&
          !p.includes("dinou[\\/]esbuild") &&
          !p.includes("dinou[\\/]webpack") &&
          !p.includes("dinou/core") &&
          !p.includes("dinou/rollup") &&
          !p.includes("dinou/esbuild") &&
          !p.includes("dinou/webpack")
      );

      if (!hasUserCode) {
        return null;
      }

      const urlId = "/" + chunk.fileName;
      const safeId = JSON.stringify(urlId);
      const wrappedCode = `
const RefreshRuntime = window.__reactRefreshRuntime;
const actualRuntime = RefreshRuntime?.default || RefreshRuntime;
let prevRefreshReg = window.$RefreshReg$;
let prevRefreshSig = window.$RefreshSig$;

window.$RefreshReg$ = (type, id) => {
  const fullId = (id && id.includes('#')) ? id : (${safeId} + '#' + id);
  actualRuntime?.register(type, fullId);
};
window.$RefreshSig$ = (actualRuntime?.createSignatureFunctionForTransform)
  ? actualRuntime.createSignatureFunctionForTransform.bind(actualRuntime)
  : (prevRefreshSig || (() => (type) => type));

if (!import.meta.hot) import.meta.hot = window.__hotContext?.(${safeId});

// --- original code ---
${code}
// --- end original code ---

if (import.meta.hot) {
  import.meta.hot.accept(({ module }) => {
    if (window.__isReactRefreshBoundary && window.__isReactRefreshBoundary(module)) {
      window.__debouncePerformReactRefresh?.();
    } else {
      import.meta.hot.invalidate();
    }
  });
}

window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
`;

      return {
        code: wrappedCode,
        map: null,
      };
    },
  };
}

module.exports = reactRefreshWrapModules;

