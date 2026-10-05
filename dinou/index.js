const contextModule = require("./core/request-context.js");
const navigationModule = require("./core/navigation.js");
const { defineConfig } = require("./core/config.js");

module.exports = {
  defineConfig,
  getContext: contextModule.getContext,
  usePathname: navigationModule.usePathname,
  useSearchParams: navigationModule.useSearchParams,
  useRouter: navigationModule.useRouter,
  refreshSlot: navigationModule.refreshSlot,
  useNavigationLoading: navigationModule.useNavigationLoading,
  get redirect() {
    return require("./core/redirect.jsx").redirect;
  },
  get ClientRedirect() {
    return require("./core/client-redirect.jsx").ClientRedirect;
  },
  get Link() {
    return require("./core/link.jsx").Link;
  },
};
