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

const MAX_ACTIVE_CHAIN_CACHE_ENTRIES = 1000;
const layoutFunctionsPathCache = new Map();
const layoutFunctionsConfigCache = new Map();
const activeLayoutChainCache = new Map();
let activeLayoutChainCacheVfsRef = null;

function isLayoutDevMode() {
  return (
    process.env.DINOU_DEV === "true" ||
    (typeof globalThis !== "undefined" && Boolean(globalThis.__DINOU_DEV__)) ||
    process.env.NODE_ENV !== "production"
  );
}

function clearLayoutFunctionsPathCache() {
  layoutFunctionsPathCache.clear();
}

function clearLayoutFunctionsConfigCache() {
  layoutFunctionsConfigCache.clear();
}

function clearActiveLayoutChainCache() {
  activeLayoutChainCache.clear();
  activeLayoutChainCacheVfsRef =
    typeof globalThis !== "undefined" ? globalThis.__DINOU_VFS__ || null : null;
}

function getActiveLayoutChainCacheSize() {
  return activeLayoutChainCache.size;
}

function cloneLayoutParams(params) {
  if (!params || typeof params !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(params)) {
    out[k] = Array.isArray(v) ? v.slice() : v;
  }
  return out;
}

function cloneLayoutSlots(slots) {
  if (!slots || typeof slots !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(slots)) {
    out[k] =
      v && typeof v === "object"
        ? { slotPath: v.slotPath, slotParams: cloneLayoutParams(v.slotParams) }
        : v;
  }
  return out;
}

function cloneActiveLayoutChain(chain) {
  if (!Array.isArray(chain) || chain.length === 0) return [];
  return chain.map((entry) => ({
    layoutPath: entry.layoutPath,
    dParams: cloneLayoutParams(entry.dParams),
    slots: cloneLayoutSlots(entry.slots),
    cleanLayoutKey: entry.cleanLayoutKey,
    layoutRoutePath: entry.layoutRoutePath,
    hasResetLayout: entry.hasResetLayout,
  }));
}

function getLayoutConfigCacheKey(layoutFunctionsPath) {
  const hasRouteModules =
    typeof globalThis !== "undefined" && Boolean(globalThis.__DINOU_ROUTE_MODULES__);
  const rawKey = String(layoutFunctionsPath || "").replace(/\\/g, "/");
  const prefix = hasRouteModules ? "m:" : "f:";
  return path.isAbsolute(layoutFunctionsPath)
    ? `${prefix}${rawKey}`
    : `${prefix}${process.cwd().replace(/\\/g, "/")}/${rawKey}`;
}

/**
 * Finds the layout_functions file in the given layout directory, if it exists.
 * Cached in production (`!isLayoutDevMode()`) to avoid repeated extension probes.
 * @param {string} layoutFolderPath
 * @returns {string | null}
 */
function getLayoutFunctionsPath(layoutFolderPath) {
  if (!layoutFolderPath) return null;
  const isDev = isLayoutDevMode();
  const routeModules =
    typeof globalThis !== "undefined" ? globalThis.__DINOU_ROUTE_MODULES__ : null;
  let cacheKey = null;
  if (!isDev) {
    const rawKey = String(layoutFolderPath).replace(/\\/g, "/");
    const prefix = routeModules ? "m:" : "f:";
    cacheKey = path.isAbsolute(layoutFolderPath)
      ? `${prefix}${rawKey}`
      : `${prefix}${process.cwd().replace(/\\/g, "/")}/${rawKey}`;
    if (layoutFunctionsPathCache.has(cacheKey)) {
      return layoutFunctionsPathCache.get(cacheKey);
    }
  }

  let resolved = null;
  outer: for (const name of LAYOUT_FUNCTIONS_NAMES) {
    for (const ext of LAYOUT_FUNCTIONS_EXTENSIONS) {
      const candidate = path.join(layoutFolderPath, `${name}${ext}`);
      if (existsSync(candidate)) {
        resolved = candidate;
        break outer;
      }
      if (routeModules) {
        const slashCandidate = candidate.replace(/\\/g, "/");
        const norm = slashCandidate.replace(/^file:\/\/\/?/, "").replace(/^\/+/, "");
        const clean = norm.startsWith("src/") ? norm : "src/" + norm.replace(/^.*\/src\//, "");
        if (routeModules[clean] || routeModules[norm]) {
          resolved = clean;
          break outer;
        }
      }
    }
  }

  if (cacheKey !== null) {
    layoutFunctionsPathCache.set(cacheKey, resolved);
  }
  return resolved;
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
    let getPropsFn = null;
    if (!isLayoutDevMode()) {
      const cfgKey = getLayoutConfigCacheKey(layoutFunctionsPath);
      const cached = layoutFunctionsConfigCache.get(cfgKey);
      if (cached) {
        getPropsFn = cached.getProps;
        if (typeof getPropsFn !== "function") return {};
      }
    }
    if (!getPropsFn) {
      const mod = await importModule(layoutFunctionsPath);
      const defaultExport = mod.default?.default ? mod.default.default : mod.default;
      getPropsFn =
        mod.getProps ||
        defaultExport?.getProps ||
        (typeof mod.default === "function" ? mod.default : null);
    }
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
 * Caches static module exports (including `getStaticPaths` set, `allowISG`, `ppr`, `validateParams`,
 * `getProps`) in production while still invoking per-request dynamic `revalidate(dParams)` and
 * `getCacheTags(dParams)` functions on every call.
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

  const isDev = isLayoutDevMode();
  const cacheKey = !isDev ? getLayoutConfigCacheKey(layoutFunctionsPath) : null;
  let cachedStatic = cacheKey ? layoutFunctionsConfigCache.get(cacheKey) : null;

  if (!cachedStatic) {
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
          : (rawAllowISG ?? null);

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
      const revalidateFn = typeof rawRevalidate === "function" ? rawRevalidate : null;
      const staticRevalidate = revalidateFn ? undefined : rawRevalidate;

      const rawTags = mod.getCacheTags ?? defaultExport?.getCacheTags;
      const getCacheTagsFn = typeof rawTags === "function" ? rawTags : null;
      const staticTags = Array.isArray(rawTags) ? rawTags : [];

      const validateParamsFn = mod.validateParams || defaultExport?.validateParams;
      const getPropsFn =
        mod.getProps ||
        defaultExport?.getProps ||
        (typeof mod.default === "function" ? mod.default : null);

      cachedStatic = {
        allowISG: resolvedAllowISG,
        staticPathsSet,
        validateParams: typeof validateParamsFn === "function" ? validateParamsFn : null,
        revalidateFn,
        staticRevalidate,
        getCacheTagsFn,
        staticTags,
        getProps: typeof getPropsFn === "function" ? getPropsFn : null,
        ppr: layoutPpr,
      };
      if (cacheKey) {
        layoutFunctionsConfigCache.set(cacheKey, cachedStatic);
      }
    } catch (err) {
      console.error(`[Dinou] Error resolving layout_functions config from ${layoutFunctionsPath}:`, err);
      return { ...defaultConfig, ppr: layoutPpr };
    }
  }

  let revalidateVal = cachedStatic.staticRevalidate;
  if (typeof cachedStatic.revalidateFn === "function") {
    try {
      revalidateVal = await cachedStatic.revalidateFn(dParams);
    } catch (err) {
      console.error(`[Dinou] Error running revalidate in ${layoutFunctionsPath}:`, err);
    }
  }
  const isDynamic = typeof revalidateVal === "number" && revalidateVal < 1;

  let tagsVal = cachedStatic.staticTags;
  if (typeof cachedStatic.getCacheTagsFn === "function") {
    try {
      const dynTags = await cachedStatic.getCacheTagsFn(dParams);
      tagsVal = Array.isArray(dynTags) ? dynTags : [];
    } catch (e) {
      console.error("Error running getCacheTags in layout-functions:", e);
      tagsVal = [];
    }
  }

  const effectiveAllowISG =
    cachedStatic.allowISG !== null && cachedStatic.allowISG !== undefined
      ? Boolean(cachedStatic.allowISG)
      : defaultAllowISG;

  return {
    allowISG: effectiveAllowISG,
    staticPathsSet: cachedStatic.staticPathsSet,
    validateParams: cachedStatic.validateParams,
    isDynamic,
    revalidate: revalidateVal,
    tags: Array.isArray(tagsVal) ? tagsVal : [],
    getProps: cachedStatic.getProps,
    ppr: cachedStatic.ppr,
  };
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
  const normSrc = String(srcFolder || "").replace(/\\/g, "/").replace(/\/+$/, "");
  let chainCacheKey = null;
  if (!isLayoutDevMode()) {
    const currentVfs =
      typeof globalThis !== "undefined" ? globalThis.__DINOU_VFS__ || null : null;
    if (currentVfs !== activeLayoutChainCacheVfsRef) {
      activeLayoutChainCache.clear();
      activeLayoutChainCacheVfsRef = currentVfs;
    }
    const segKey = Array.isArray(reqSegments) ? reqSegments.join("\x1f") : "";
    chainCacheKey = `${normSrc}\0${segKey}\0${options?.ignoreNoLayout ? 1 : 0}\0${options?.exactLayoutKey ? 1 : 0}`;
    if (activeLayoutChainCache.has(chainCacheKey)) {
      const cachedChain = activeLayoutChainCache.get(chainCacheKey);
      // Refresh LRU recency
      activeLayoutChainCache.delete(chainCacheKey);
      activeLayoutChainCache.set(chainCacheKey, cachedChain);
      return cloneActiveLayoutChain(cachedChain);
    }
  }

  const storeChainInCache = (chain) => {
    if (chainCacheKey !== null) {
      const snapshot = cloneActiveLayoutChain(chain);
      if (activeLayoutChainCache.has(chainCacheKey)) {
        activeLayoutChainCache.delete(chainCacheKey);
      } else if (activeLayoutChainCache.size >= MAX_ACTIVE_CHAIN_CACHE_ENTRIES) {
        const oldestKey = activeLayoutChainCache.keys().next().value;
        activeLayoutChainCache.delete(oldestKey);
      }
      activeLayoutChainCache.set(chainCacheKey, snapshot);
    }
    return chain;
  };

  if (
    !options.ignoreNoLayout &&
    getFilePathAndDynamicParams(reqSegments, queryObj, srcFolder, "no_layout", false)[0]
  ) {
    return storeChainInCache([]);
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
    return storeChainInCache([]);
  }

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

  return storeChainInCache(activeChain);
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
  const activeChain = Array.isArray(options?.activeChain)
    ? options.activeChain
    : getActiveLayoutChain(reqSegments, queryObj, srcFolder, options);
  const layoutPprMap = new Map();

  for (let i = activeChain.length - 1; i >= 0; i--) {
    const entry = activeChain[i];
    const lConfig =
      entry._layoutConfig ||
      (await resolveLayoutFunctionsConfig(entry.layoutPath, entry.dParams));
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
  clearLayoutFunctionsPathCache,
  clearLayoutFunctionsConfigCache,
  clearActiveLayoutChainCache,
  getActiveLayoutChainCacheSize,
  getLayoutProps,
  resolveLayoutFunctionsConfig,
  computeLayoutKeyFromFolder,
  getActiveLayoutChain,
  resolveLayoutChainPpr,
};
export default {
  getLayoutFunctionsPath,
  clearLayoutFunctionsPathCache,
  clearLayoutFunctionsConfigCache,
  clearActiveLayoutChainCache,
  getActiveLayoutChainCacheSize,
  getLayoutProps,
  resolveLayoutFunctionsConfig,
  computeLayoutKeyFromFolder,
  getActiveLayoutChain,
  resolveLayoutChainPpr,
};
