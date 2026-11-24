import path from "node:path";
import { existsSync } from "./vfs.js";
import importModule from "./import-module.js";
import { resolveModulePpr } from "./resolve-module-ppr.js";
import {
  getFilePathAndDynamicParams,
  getLayoutsForLayoutKey,
} from "./get-file-path-and-dynamic-params.js";
import { getDinouConfig } from "./load-dinou-config.js";

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
  const globalCfg = await getDinouConfig();
  const defaultAllowISG =
    globalCfg?.allowISG !== undefined && globalCfg?.allowISG !== null
      ? Boolean(globalCfg.allowISG)
      : true;

  const defaultConfig = {
    allowISG: defaultAllowISG,
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
    const rawAllowISG =
      mod.allowISG !== undefined ? mod.allowISG : defaultExport?.allowISG;
    const resolvedAllowISG =
      typeof rawAllowISG === "function"
        ? await rawAllowISG()
        : (rawAllowISG ?? defaultAllowISG);

    const getStaticPathsFn = mod.getStaticPaths || defaultExport?.getStaticPaths;
    let staticPathsSet = null;
    if (getStaticPathsFn) {
      const paths = await (typeof getStaticPathsFn === "function" ? getStaticPathsFn() : getStaticPathsFn);
      if (Array.isArray(paths)) {
        staticPathsSet = new Set(
          paths.map((p) => {
            if (typeof p === "object" && p !== null && !Array.isArray(p)) {
              const sorted = Object.entries(p)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([k, v]) => [
                  k,
                  Array.isArray(v)
                    ? v.join(",")
                    : v === undefined || v === null
                    ? ""
                    : String(v),
                ]);
              return JSON.stringify(sorted);
            }
            if (Array.isArray(p)) {
              return p.join(",");
            }
            return p === undefined || p === null ? "" : String(p);
          })
        );
      }
    }

    const rawRevalidate =
      mod.revalidate !== undefined ? mod.revalidate : defaultExport?.revalidate;
    const revalidateVal =
      typeof rawRevalidate === "function"
        ? await rawRevalidate()
        : rawRevalidate;

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

function safeDecodeSegment(val) {
  try {
    return val ? decodeURIComponent(val) : val;
  } catch (e) {
    return val;
  }
}

/**
 * Computes a collision-free canonical storage/routing key (`cleanLayoutKey` & `layoutRoutePath`)
 * from a layout folder's relative path segments under `src/`, concrete request segments, and
 * resolved dynamic parameters. Preserves `(group)` segments so sibling route-group layouts
 * never overwrite each other, and preserves empty optional segment markers (`[[...slug]]` /
 * `[[param]]`) so a 0-segment optional layout never collides with its parent directory layout.
 */
function computeLayoutKeyFromFolder(rawFolderSegs, reqSegments = [], dParams = {}) {
  const decodedReqSegs = (reqSegments || []).map((s) =>
    s === undefined || s === null ? "" : safeDecodeSegment(String(s))
  );
  const keySegs = [];
  let uIdx = 0;

  for (const seg of rawFolderSegs || []) {
    if (seg.startsWith("(") && seg.endsWith(")")) {
      if (uIdx < decodedReqSegs.length && decodedReqSegs[uIdx] === seg) {
        uIdx += 1;
      }
      keySegs.push(seg);
      continue;
    }
    if (seg.startsWith("[[...") && seg.endsWith("]]")) {
      const pName = seg.slice(5, -2);
      const val = dParams?.[pName];
      const count = Array.isArray(val) ? val.length : val ? 1 : 0;
      if (count > 0) {
        for (let k = 0; k < count; k++) {
          if (uIdx < decodedReqSegs.length) {
            keySegs.push(decodedReqSegs[uIdx++]);
          } else if (Array.isArray(val) && val[k] !== undefined) {
            keySegs.push(String(val[k]));
          } else if (!Array.isArray(val) && val !== undefined) {
            keySegs.push(String(val));
          }
        }
      } else {
        if (uIdx < decodedReqSegs.length && decodedReqSegs[uIdx] === seg) {
          uIdx += 1;
        }
        keySegs.push(seg);
      }
      continue;
    }
    if (seg.startsWith("[...") && seg.endsWith("]")) {
      const pName = seg.slice(4, -1);
      const val = dParams?.[pName];
      const count = Array.isArray(val) ? val.length : val ? 1 : 0;
      for (let k = 0; k < count; k++) {
        if (uIdx < decodedReqSegs.length) {
          keySegs.push(decodedReqSegs[uIdx++]);
        } else if (Array.isArray(val) && val[k] !== undefined) {
          keySegs.push(String(val[k]));
        } else if (!Array.isArray(val) && val !== undefined) {
          keySegs.push(String(val));
        }
      }
      continue;
    }
    if (seg.startsWith("[[") && seg.endsWith("]]")) {
      const pName = seg.slice(2, -2);
      const val = dParams?.[pName];
      if (val !== undefined && val !== null && val !== "") {
        if (uIdx < decodedReqSegs.length) {
          keySegs.push(decodedReqSegs[uIdx++]);
        } else {
          keySegs.push(String(val));
        }
      } else {
        if (uIdx < decodedReqSegs.length && decodedReqSegs[uIdx] === seg) {
          uIdx += 1;
        }
        keySegs.push(seg);
      }
      continue;
    }
    if (uIdx < decodedReqSegs.length) {
      keySegs.push(decodedReqSegs[uIdx++]);
    } else if (seg.startsWith("[") && seg.endsWith("]")) {
      const pName = seg.slice(1, -1);
      const val = dParams?.[pName];
      if (val !== undefined && val !== null) {
        keySegs.push(String(val));
      }
    } else {
      keySegs.push(seg);
    }
  }

  const cleanLayoutKey = keySegs.join("/");
  const layoutRoutePath = cleanLayoutKey ? "/" + cleanLayoutKey : "/";
  return { cleanLayoutKey, layoutRoutePath };
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

  const allLayouts = options.exactLayoutKey
    ? getLayoutsForLayoutKey(reqSegments, queryObj, srcFolder)
    : getFilePathAndDynamicParams(
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
    const { cleanLayoutKey, layoutRoutePath } = computeLayoutKeyFromFolder(
      rawFolderSegs,
      reqSegments,
      dParams
    );

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

/**
 * Resolves the effective PPR boolean for each active layout in the chain (from outermost to innermost).
 * Each layout segment uses its own explicit `ppr` config in `layout_functions`, or falls back to
 * the global default `ppr` from `dinou.config.js` (`false` if omitted). No parent-to-child inheritance.
 */
async function resolveLayoutChainPpr(
  reqSegments,
  queryObj = {},
  srcFolder = path.resolve(process.cwd(), "src"),
  options = {}
) {
  const globalCfg = await getDinouConfig();
  const defaultPpr = Boolean(globalCfg?.ppr);
  const activeChain = getActiveLayoutChain(reqSegments, queryObj, srcFolder, options);
  const layoutPprMap = new Map();

  for (let i = activeChain.length - 1; i >= 0; i--) {
    const entry = activeChain[i];
    const lConfig = await resolveLayoutFunctionsConfig(entry.layoutPath, entry.dParams);
    const segmentPpr =
      lConfig && lConfig.ppr !== null && lConfig.ppr !== undefined
        ? Boolean(lConfig.ppr)
        : defaultPpr;
    entry.effectivePpr = segmentPpr;
    layoutPprMap.set(entry.layoutPath, segmentPpr);
    layoutPprMap.set(path.normalize(entry.layoutPath), segmentPpr);
    layoutPprMap.set(entry.layoutPath.replace(/\\/g, "/"), segmentPpr);
  }

  const anyLayoutPpr = activeChain.some((entry) => Boolean(entry.effectivePpr));
  return {
    activeChain,
    layoutPprMap,
    defaultPpr,
    anyLayoutPpr,
  };
}

export {
  getLayoutFunctionsPath,
  getLayoutProps,
  resolveLayoutFunctionsConfig,
  computeLayoutKeyFromFolder,
  getActiveLayoutChain,
  resolveLayoutChainPpr,
};
export default {
  getLayoutFunctionsPath,
  getLayoutProps,
  resolveLayoutFunctionsConfig,
  computeLayoutKeyFromFolder,
  getActiveLayoutChain,
  resolveLayoutChainPpr,
};
