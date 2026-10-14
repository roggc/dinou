import RefreshRuntime from "/refresh.js";
import { isReactRefreshBoundary } from "./is-react-refresh-boundary";

const runtime = RefreshRuntime?.default || RefreshRuntime;

if (
  typeof window !== "undefined" &&
  !window.__REACT_REFRESH_RUNTIME_INSTALLED__
) {
  runtime.injectIntoGlobalHook(window);
  window.__reactRefreshRuntime = runtime;
  window.$RefreshReg$ = (type, id) => {
    runtime?.register(type, id);
  };
  window.$RefreshSig$ = runtime?.createSignatureFunctionForTransform
    ? runtime.createSignatureFunctionForTransform.bind(runtime)
    : () => (type) => type;
  window.__REACT_REFRESH_RUNTIME_INSTALLED__ = true;

  let refreshTimeout;
  window.performReactRefresh = runtime.performReactRefresh;
  window.__debouncePerformReactRefresh = () => {
    clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(() => {
      try {
        runtime.performReactRefresh();
      } catch (err) {
        console.warn("React Refresh failed:", err);
      }
    }, 30); // 30ms debounce
  };

  window.__isReactRefreshBoundary = (moduleExports) =>
    isReactRefreshBoundary(runtime, moduleExports);
}
