// dinou/core/no-dynamic.js
// Opt-out primitive for Static <Suspense> boundaries in Partial Prerendering (PPR).

const NO_DYNAMIC_HOOK_KEY = Symbol.for("dinou.ppr.noDynamic.hook");

/**
 * Opts the enclosing <Suspense> boundary out of becoming a Dynamic PPR Hole
 * when wrapping an async Server Component on a PPR route (`ppr = true`).
 *
 * Call `noDynamic()` synchronously at the top of your async Server Component
 * (before the first `await`) so Dinou resolves its promise at build time and
 * bakes the rendered output directly into the Static Shell (`shell.html`).
 */
export function noDynamic() {
  if (typeof window !== "undefined") {
    return;
  }
  const hook = globalThis[NO_DYNAMIC_HOOK_KEY];
  if (typeof hook === "function") {
    hook();
  }
}

export default noDynamic;

