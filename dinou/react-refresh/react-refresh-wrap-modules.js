function reactRefreshWrapModules() {
  return {
    name: "react-refresh-wrap-modules",
    renderChunk(code, chunk) {
      if (
        !chunk ||
        !/\.(jsx?|tsx?)$/.test(chunk.fileName) ||
        chunk.fileName.includes("refresh.js") ||
        chunk.fileName.includes("runtime.js") ||
        chunk.fileName.includes("_commonjsHelpers.js")
      ) {
        return null;
      }
      const safeId = JSON.stringify(chunk.fileName);
      const wrappedCode = `
import RefreshRuntime from "/refresh.js";

let prevRefreshReg = window.$RefreshReg$;
let prevRefreshSig = window.$RefreshSig$;

window.$RefreshReg$ = (type, id) => {
  RefreshRuntime.register(type, ${safeId} + '#' + id);
};
window.$RefreshSig$ = RefreshRuntime?.createSignatureFunctionForTransform;

// --- original code ---
${code}
// --- end original code ---

window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

if (import.meta.hot) {
  import.meta.hot.accept();
  window.__debouncePerformReactRefresh?.();
}
`;

      return {
        code: wrappedCode,
        map: null,
      };
    },
  };
}

module.exports = reactRefreshWrapModules;
