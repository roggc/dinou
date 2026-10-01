const path = require("path");
const { existsSync } = require("./vfs");
const importModule = require("./import-module");

const LAYOUT_FUNCTIONS_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];

/**
 * Finds the layout_functions file in the given layout directory, if it exists.
 * @param {string} layoutFolderPath
 * @returns {string | null}
 */
function getLayoutFunctionsPath(layoutFolderPath) {
  if (!layoutFolderPath) return null;
  for (const ext of LAYOUT_FUNCTIONS_EXTENSIONS) {
    const candidate = path.join(layoutFolderPath, `layout_functions${ext}`);
    if (existsSync(candidate)) {
      return candidate;
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
  const layoutFolder = path.dirname(layoutPath);
  const layoutFunctionsPath = getLayoutFunctionsPath(layoutFolder);
  if (!layoutFunctionsPath) return {};

  try {
    const mod = await importModule(layoutFunctionsPath);
    if (typeof mod.getProps === "function") {
      const res = await mod.getProps(dParams);
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

  const layoutFolder = path.dirname(layoutPath);
  const layoutFunctionsPath = getLayoutFunctionsPath(layoutFolder);
  if (!layoutFunctionsPath) return defaultConfig;

  try {
    const mod = await importModule(layoutFunctionsPath);
    const resolvedAllowISG = typeof mod.allowISG === "function"
      ? await mod.allowISG()
      : (mod.allowISG ?? true);

    let staticPathsSet = null;
    if (typeof mod.getStaticPaths === "function") {
      const paths = await mod.getStaticPaths();
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

    const isDynamic = Boolean(
      (typeof mod.dynamic === "function" ? await mod.dynamic() : mod.dynamic) ||
      mod.revalidate === 0
    );

    let revalidateVal = typeof mod.revalidate === "function"
      ? await mod.revalidate()
      : mod.revalidate;

    const getTagsFn = mod.getCacheTags || mod.cacheTags;
    let tagsVal = typeof getTagsFn === "function"
      ? await getTagsFn(dParams)
      : (mod.tags || mod.cacheTags || mod.getCacheTags || []);

    return {
      allowISG: resolvedAllowISG,
      staticPathsSet,
      validateParams: typeof mod.validateParams === "function" ? mod.validateParams : null,
      isDynamic,
      revalidate: revalidateVal,
      tags: Array.isArray(tagsVal) ? tagsVal : [],
      getProps: typeof mod.getProps === "function" ? mod.getProps : null,
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
