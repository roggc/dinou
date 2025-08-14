const path = require("path");
function reactRefreshWrapModules() {
  return {
    name: "react-refresh-wrap-modules",
    renderChunk(code, chunk) {
      if (
        !chunk ||
        !/\.(jsx?|tsx?)$/.test(chunk.fileName) ||
        chunk.fileName.includes("refresh.js") ||
        chunk.fileName.includes("runtime.js")
      ) {
        return null;
      }
      const safeId = JSON.stringify(chunk.fileName);
      const wrappedCode = `
import RefreshRuntime from "/refresh.js";

let prevRefreshReg = window.$RefreshReg$;
let prevRefreshSig = window.$RefreshSig$;

window.$RefreshReg$ = (type, id) => {
  RefreshRuntime.register(type, ${safeId} + ' %exports%');
};
window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;

// --- código original ---
${code}
// --- fin código original ---

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
