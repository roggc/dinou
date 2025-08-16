import RefreshRuntime from "/refresh.js";
import { isReactRefreshBoundary } from "./is-react-refresh-boundary";

if (
  typeof window !== "undefined" &&
  !window.__REACT_REFRESH_RUNTIME_INSTALLED__
) {
  RefreshRuntime.injectIntoGlobalHook(window);
  window.$RefreshReg$ = () => {};
  window.$RefreshSig$ = () => (type) => type;
  window.__REACT_REFRESH_RUNTIME_INSTALLED__ = true;

  let refreshTimeout;
  window.performReactRefresh = RefreshRuntime.performReactRefresh;
  window.__debouncePerformReactRefresh = () => {
    clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(() => {
      try {
        RefreshRuntime.performReactRefresh();
      } catch (err) {
        console.warn("React Refresh failed:", err);
      }
    }, 30); // 30ms debounce
  };

  window.__isReactRefreshBoundary = (moduleExports) =>
    isReactRefreshBoundary(RefreshRuntime, moduleExports);
}
