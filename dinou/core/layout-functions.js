const path = require("path");
const { existsSync } = require("./vfs");
const importModule = require("./import-module");

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
  };

  if (!layoutPath) return defaultConfig;

  const layoutFolder = /\.[a-zA-Z0-9]+$/.test(layoutPath)
    ? path.dirname(layoutPath)
    : layoutPath;
  const layoutFunctionsPath = getLayoutFunctionsPath(layoutFolder);
  if (!layoutFunctionsPath) return defaultConfig;

  try {
    const mod = await importModule(layoutFunctionsPath);
    const resolvedAllowISG =
      typeof mod.allowISG === "function"
        ? await mod.allowISG()
        : typeof mod.default?.allowISG === "function"
        ? await mod.default.allowISG()
        : (mod.allowISG ?? mod.default?.allowISG ?? true);

    const getStaticPathsFn = mod.getStaticPaths || mod.default?.getStaticPaths;
    let staticPathsSet = null;
    if (typeof getStaticPathsFn === "function") {
      const paths = await getStaticPathsFn();
      if (Array.isArray(paths)) {
        staticPathsSet = new Set(
          paths.map((p) => {
            if (typeof p === "object" && p !== null) {
              const sorted = Object.entries(p).sort((a, b) => a[0].localeCompare(b[0]));
              return JSON.stringify(sorted);
            }
            return String(p);
          })
        );
      }
    }

    const dynamicFnOrVal = mod.dynamic ?? mod.default?.dynamic;
    const isDynamic = Boolean(
      (typeof dynamicFnOrVal === "function" ? await dynamicFnOrVal() : dynamicFnOrVal) ||
      mod.revalidate === 0 ||
      mod.default?.revalidate === 0
    );

    const revalidateVal =
      typeof mod.revalidate === "function"
        ? await mod.revalidate()
        : typeof mod.default?.revalidate === "function"
        ? await mod.default.revalidate()
        : (mod.revalidate ?? mod.default?.revalidate);

    const getTagsFn =
      mod.getCacheTags ||
      mod.cacheTags ||
      mod.default?.getCacheTags ||
      mod.default?.cacheTags;
    let tagsVal =
      typeof getTagsFn === "function"
        ? await getTagsFn(dParams)
        : (mod.tags || mod.cacheTags || mod.getCacheTags || mod.default?.tags || mod.default?.cacheTags || mod.default?.getCacheTags || []);

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
    };
  } catch (err) {
    console.error(`[Dinou] Error resolving layout_functions config from ${layoutFunctionsPath}:`, err);
    return defaultConfig;
  }
}

module.exports = {
  getLayoutFunctionsPath,
  getLayoutProps,
  resolveLayoutFunctionsConfig,
};

