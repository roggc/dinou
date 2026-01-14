const contextModule = require("./core/request-context.js");
const navigationModule = require("./core/navigation.js");
const clientRedirectModule = require("./core/client-redirect.jsx");
const redirectModule = require("./core/redirect.jsx");
const linkModule = require("./core/link.jsx");

module.exports = {
  getContext: contextModule.getContext,
  usePathname: navigationModule.usePathname,
  useSearchParams: navigationModule.useSearchParams,
  useRouter: navigationModule.useRouter,
  useNavigationLoading: navigationModule.useNavigationLoading,
  redirect: redirectModule.redirect,
  ClientRedirect: clientRedirectModule.ClientRedirect,
  Link: linkModule.Link,
};
