// dinou/core/resolve-module-ppr.js
// Resolves the PPR configuration from an imported module (page_functions, layout_functions).
// Supports constants (export const ppr = true/false), sync functions (export function ppr()),
// and async functions (export async function ppr()).

async function resolveModulePpr(mod) {
  if (!mod) return null;
  const raw =
    mod.ppr !== undefined
      ? mod.ppr
      : mod.default?.ppr !== undefined
      ? mod.default.ppr
      : undefined;

  if (raw === undefined || raw === null) return null;

  if (typeof raw === "function") {
    try {
      const res = await raw();
      return res !== null && res !== undefined ? Boolean(res) : null;
    } catch (e) {
      console.error("[Dinou PPR] Error evaluating ppr() function:", e);
      return null;
    }
  }

  return Boolean(raw);
}

module.exports = {
  resolveModulePpr,
};
