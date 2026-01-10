import { ClientRedirect } from "./client-redirect.jsx";

/**
 * Universal redirection function.
 * Use it with 'return': return redirect('/login');
 */
export function redirect(destination) {
  // 1. We try to get the server context
  if (typeof window === "undefined") {
    // getContext() must be accessible here
    const dynamicRequire = require;
    const { getContext } = dynamicRequire(
      /* webpackIgnore: true */ "./request-context.js"
    );
    const ctx = getContext();

    // 2. If we are on the server and headers have NOT been sent yet...
    // We can do a real HTTP redirect (Status 307).
    // This is better for SEO and speed in Hard Navigation.
    if (ctx && ctx.res) {
      ctx.res.redirect(destination);
      return <ClientRedirect to={destination} />;
    }
  }

  // 3. FALLBACK: If we are on the Client, OR if the Server has already started the stream (headers sent)
  // We return the component that will force the redirection in the browser.
  return <ClientRedirect to={destination} />;
}
