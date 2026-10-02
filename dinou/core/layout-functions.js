const path = require("path");
const { existsSync } = require("./vfs");
const importModule = require("./import-module");
const { resolveModulePpr } = require("./resolve-module-ppr");

const LAYOUT_FUNCTIONS_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];
const LAYOUT_FUNCTIONS_NAMES = ["layout_functions", "layout.functions"];

/**
 * Finds the layout_functions file in the given layout directory, if it exists.
 * @param {string} layoutFolderPath
 * @returns {string | null}
 */
function getLayoutFunctionsPath(layoutFolderPath) {
  if (!layoutFolderPath) return null;
  for (const name of LAYOUT_FUNCTIONS_NAMES) {
    for (const ext of LAYOUT_FUNCTIONS_EXTENSIONS) {
      const candidate = path.join(layoutFolderPath, `${name}${ext}`);
      if (existsSync(candidate)) {
        return candidate;
      }
      const slashCandidate = candidate.replace(/\\/g, "/");
      if (existsSync(slashCandidate)) {
        return slashCandidate;
      }
      if (typeof globalThis !== "undefined" && globalThis.__DINOU_ROUTE_MODULES__) {
        const norm = slashCandidate.replace(/^file:\/\/\/?/, "").replace(/^\/+/, "");
        const clean = norm.startsWith("src/") ? norm : "src/" + norm.replace(/^.*\/src\//, "");
        if (globalThis.__DINOU_ROUTE_MODULES__[clean] || globalThis.__DINOU_ROUTE_MODULES__[norm]) {
          return clean;
        }
      }
    }
  }
  return null;
}

/**
 * Executes getProps from layout_functions for a given layout, returning the props directly.
 * @param {string} layoutPath
 * @param {object} dParams
 * @returns {Promise<object>}
 */
async function getLayoutProps(layoutPath, dParams = {}) {
  if (!layoutPath) return {};
  const layoutFolder = /\.[a-zA-Z0-9]+$/.test(layoutPath)
    ? path.dirname(layoutPath)
    : layoutPath;
  const layoutFunctionsPath = getLayoutFunctionsPath(layoutFolder);
  if (!layoutFunctionsPath) return {};

  try {
    const mod = await importModule(layoutFunctionsPath);
    const getPropsFn =
      mod.getProps ||
      mod.default?.getProps ||
      (typeof mod.default === "function" ? mod.default : null);
    if (typeof getPropsFn === "function") {
      const res = await getPropsFn(dParams);
      return res && typeof res === "object" ? res : {};
    }
  } catch (err) {
    console.error(`[Dinou] Error executing getProps in ${layoutFunctionsPath}:`, err);
  }
  return {};
}

/**
 * Resolves layout_functions configuration (revalidate, tags, dynamic, allowISG, validateParams).
 * @param {string} layoutPath
 * @param {object} dParams
 * @returns {Promise<object>}
 */
async function resolveLayoutFunctionsConfig(layoutPath, dParams = {}) {
  const defaultConfig = {
    allowISG: true,
    staticPathsSet: null,
    validateParams: null,
    isDynamic: false,
    revalidate: undefined,
    tags: [],
    getProps: null,
    ppr: null,
  };

  if (!layoutPath) return defaultConfig;

  const layoutFolder = /\.[a-zA-Z0-9]+$/.test(layoutPath)
    ? path.dirname(layoutPath)
    : layoutPath;
  const layoutFunctionsPath = getLayoutFunctionsPath(layoutFolder);
  if (!layoutFunctionsPath) return defaultConfig;

  let layoutPpr = null;
  try {
    const mod = await importModule(layoutFunctionsPath);
    if (mod) {
      layoutPpr = await resolveModulePpr(mod);
    }
    if (layoutPpr === null && typeof globalThis !== "undefined" && globalThis.__DINOU_ROUTE_METADATA__) {
      const normKey = layoutFunctionsPath ? layoutFunctionsPath.replace(/\\/g, "/") : "";
      for (const [k, meta] of Object.entries(globalThis.__DINOU_ROUTE_METADATA__)) {
        if (meta.ppr !== undefined && (normKey === k || normKey.endsWith("/" + k) || normKey.endsWith(k))) {
          layoutPpr = Boolean(meta.ppr);
          break;
        }
      }
    }
    const resolvedAllowISG =
      typeof mod.allowISG === "function"
        ? await mod.allowISG()
        : typeof mod.default?.allowISG === "function"
        ? await mod.default.allowISG()
        : (mod.allowISG ?? mod.default?.allowISG ?? true);

    const getStaticPathsFn = mod.getStaticPaths || mod.default?.getStaticPaths;
    let staticPathsSet = null;
    if (getStaticPathsFn) {
      const paths = await (typeof getStaticPathsFn === "function" ? getStaticPathsFn() : getStaticPathsFn);
      if (Array.isArray(paths)) {
        staticPathsSet = new Set(
          paths.map((p) => {
            if (typeof p === "object" && p !== null && !Array.isArray(p)) {
              const sorted = Object.entries(p).sort((a, b) => a[0].localeCompare(b[0]));
              return JSON.stringify(sorted);
            }
            return String(p);
          })
        );
      }
    }

    const revalidateVal =
      typeof mod.revalidate === "function"
        ? await mod.revalidate()
        : typeof mod.default?.revalidate === "function"
        ? await mod.default.revalidate()
        : (mod.revalidate ?? mod.default?.revalidate);

    const isDynamic = typeof revalidateVal === "number" && revalidateVal < 1;

    const rawTags = mod.getCacheTags ?? mod.default?.getCacheTags;
    let tagsVal = [];
    if (typeof rawTags === "function") {
      try {
        tagsVal = await rawTags(dParams);
      } catch (e) {
        console.error("Error running getCacheTags in layout-functions:", e);
      }
    } else if (Array.isArray(rawTags)) {
      tagsVal = rawTags;
    }

    const validateParamsFn = mod.validateParams || mod.default?.validateParams;
    const getPropsFn =
      mod.getProps ||
      mod.default?.getProps ||
      (typeof mod.default === "function" ? mod.default : null);

    return {
      allowISG: resolvedAllowISG,
      staticPathsSet,
      validateParams: typeof validateParamsFn === "function" ? validateParamsFn : null,
      isDynamic,
      revalidate: revalidateVal,
      tags: Array.isArray(tagsVal) ? tagsVal : [],
      getProps: typeof getPropsFn === "function" ? getPropsFn : null,
      ppr: layoutPpr,
    };
  } catch (err) {
    console.error(`[Dinou] Error resolving layout_functions config from ${layoutFunctionsPath}:`, err);
    return { ...defaultConfig, ppr: layoutPpr };
  }
}

module.exports = {
  getLayoutFunctionsPath,
  getLayoutProps,
  resolveLayoutFunctionsConfig,
};

