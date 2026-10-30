import path from "node:path";
import { existsSync } from "./vfs.js";
import importModule from "./import-module.js";
import { resolveModulePpr } from "./resolve-module-ppr.js";
import { getFilePathAndDynamicParams } from "./get-file-path-and-dynamic-params.js";

const LAYOUT_FUNCTIONS_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".mjs"];
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
    const defaultExport = mod.default?.default ? mod.default.default : mod.default;
    const getPropsFn =
      mod.getProps ||
      defaultExport?.getProps ||
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
    const defaultExport = mod.default?.default ? mod.default.default : mod.default;
    const resolvedAllowISG =
      typeof mod.allowISG === "function"
        ? await mod.allowISG()
        : typeof defaultExport?.allowISG === "function"
        ? await defaultExport.allowISG()
        : (mod.allowISG ?? defaultExport?.allowISG ?? true);

    const getStaticPathsFn = mod.getStaticPaths || defaultExport?.getStaticPaths;
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
        : typeof defaultExport?.revalidate === "function"
        ? await defaultExport.revalidate()
        : (mod.revalidate ?? defaultExport?.revalidate);

    const isDynamic = typeof revalidateVal === "number" && revalidateVal < 1;

    const rawTags = mod.getCacheTags ?? defaultExport?.getCacheTags;
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

    const validateParamsFn = mod.validateParams || defaultExport?.validateParams;
    const getPropsFn =
      mod.getProps ||
      defaultExport?.getProps ||
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

/**
 * Returns the active layout chain for a route from innermost (leaf) to outermost (root),
 * honoring `no_layout` and stopping at `reset_layout`.
 */
function getActiveLayoutChain(
  reqSegments,
  queryObj = {},
  srcFolder = path.resolve(process.cwd(), "src"),
  options = {}
) {
  if (
    !options.ignoreNoLayout &&
    getFilePathAndDynamicParams(reqSegments, queryObj, srcFolder, "no_layout", false)[0]
  ) {
    return [];
  }

  const allLayouts = getFilePathAndDynamicParams(
    reqSegments,
    queryObj,
    srcFolder,
    "layout",
    true,
    false,
    undefined,
    0,
    {},
    true
  );

  if (!allLayouts || !Array.isArray(allLayouts) || allLayouts.length === 0) {
    return [];
  }

  const normSrc = srcFolder.replace(/\\/g, "/").replace(/\/+$/, "");
  const activeChain = [];

  for (const [layoutPath, dParams, slots] of [...allLayouts].reverse()) {
    const layoutFolderPath = path.dirname(layoutPath);
    const resetLayoutPath = getFilePathAndDynamicParams(
      [],
      {},
      layoutFolderPath,
      "reset_layout",
      false
    )[0];

    const normFolder = layoutFolderPath.replace(/\\/g, "/").replace(/\/+$/, "");
    let relFromSrc = "";
    if (normFolder === normSrc) {
      relFromSrc = "";
    } else if (normFolder.startsWith(normSrc + "/")) {
      relFromSrc = normFolder.slice(normSrc.length + 1);
    } else {
      const srcIdx = normFolder.lastIndexOf("/src/");
      if (srcIdx !== -1) {
        relFromSrc = normFolder.slice(srcIdx + 5);
      } else if (normFolder.endsWith("/src")) {
        relFromSrc = "";
      }
    }

    const rawFolderSegs = relFromSrc.split("/").filter(Boolean);
    let urlSegCount = 0;
    for (const seg of rawFolderSegs) {
      if (seg.startsWith("(") && seg.endsWith(")")) continue;
      if (seg.startsWith("[[...") && seg.endsWith("]]")) {
        const pName = seg.slice(5, -2);
        const val = dParams?.[pName];
        urlSegCount += Array.isArray(val) ? val.length : val ? 1 : 0;
      } else if (seg.startsWith("[...") && seg.endsWith("]")) {
        const pName = seg.slice(4, -1);
        const val = dParams?.[pName];
        urlSegCount += Array.isArray(val) ? val.length : val ? 1 : 0;
      } else {
        urlSegCount += 1;
      }
    }

    const cleanLayoutKey = reqSegments.slice(0, urlSegCount).join("/");
    const layoutRoutePath = cleanLayoutKey ? "/" + cleanLayoutKey : "/";

    activeChain.push({
      layoutPath,
      dParams: dParams || {},
      slots: slots || {},
      cleanLayoutKey,
      layoutRoutePath,
      hasResetLayout: Boolean(resetLayoutPath),
    });

    if (resetLayoutPath) {
      break;
    }
  }

  return activeChain;
}

export {
  getLayoutFunctionsPath,
  getLayoutProps,
  resolveLayoutFunctionsConfig,
  getActiveLayoutChain,
};
export default {
  getLayoutFunctionsPath,
  getLayoutProps,
  resolveLayoutFunctionsConfig,
  getActiveLayoutChain,
};
