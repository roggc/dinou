import { ClientRedirect } from "./client-redirect.jsx";

const DINOU_CONTEXT_KEY = Symbol.for("dinou.request.context.storage");

/**
 * Universal redirection function.
 * Use it with 'return': return redirect('/login');
 */
export function redirect(destination) {
  // 1. We try to get the server context
  if (typeof window === "undefined") {
    let ctx;
    try {
      const storage = globalThis[DINOU_CONTEXT_KEY];
      if (storage && typeof storage.getStore === "function") {
        ctx = storage.getStore();
      }
      if (!ctx && typeof globalThis !== "undefined") {
        ctx = globalThis[Symbol.for("dinou.request.context.current")];
      }
    } catch (e) { }

    // 2. If we are on the server and headers have NOT been sent yet...
    // We can do a real HTTP redirect (Status 307 or x-rsc-redirect).
    // This is better for SEO and speed in Hard Navigation.
    if (ctx && ctx.res && typeof ctx.res.redirect === "function") {
      ctx.res.redirect(destination);
      return <ClientRedirect to={destination} />;
    }
  }

  // 3. FALLBACK: If we are on the Client, OR if the Server has already started the stream (headers sent)
  // We return the component that will force the redirection in the browser.
  return <ClientRedirect to={destination} />;
}

export default redirect;
