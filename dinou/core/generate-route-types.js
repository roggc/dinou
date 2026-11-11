// dinou/core/generate-route-types.js
import fs from "node:fs";
import path from "node:path";

const PAGE_EXTENSIONS = [".tsx", ".jsx", ".ts", ".js", ".mjs"];
const LAYOUT_FUNCTIONS_NAMES = ["layout_functions", "layout.functions"];
const VALID_IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function safeReaddir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return [];
  }
}

function hasEntryFile(entries, baseNames) {
  const names = Array.isArray(baseNames) ? baseNames : [baseNames];
  return entries.some(
    (e) =>
      !e.isDirectory() &&
      names.some((base) => PAGE_EXTENSIONS.some((ext) => e.name === `${base}${ext}`))
  );
}

function hasDinouShadowInDir(dir, entries) {
  if (hasEntryFile(entries, "dinou")) {
    return true;
  }
  const dinouSubdir = entries.find((e) => e.isDirectory() && e.name === "dinou");
  if (dinouSubdir) {
    const subEntries = safeReaddir(path.join(dir, "dinou"));
    if (hasEntryFile(subEntries, "index")) {
      return true;
    }
  }
  return false;
}

function normKey(p) {
  const resolved = path.resolve(p).replace(/\\/g, "/");
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function formatTsKey(key) {
  return VALID_IDENTIFIER_RE.test(key) ? key : JSON.stringify(key);
}

function extractParamsFromSegments(segments) {
  const params = {};
  for (const seg of segments) {
    if (seg.startsWith("[[...") && seg.endsWith("]]")) {
      const paramName = seg.slice(5, -2);
      params[paramName] = "string[] | undefined";
    } else if (seg.startsWith("[[") && seg.endsWith("]]")) {
      const paramName = seg.slice(2, -2);
      params[paramName] = "string | undefined";
    } else if (seg.startsWith("[...") && seg.endsWith("]")) {
      const paramName = seg.slice(4, -1);
      params[paramName] = "string[]";
    } else if (seg.startsWith("[") && seg.endsWith("]")) {
      const paramName = seg.slice(1, -1);
      params[paramName] = "string";
    }
  }
  return params;
}

function formatParamsMapEntries(paramsMap) {
  const sortedPaths = Object.keys(paramsMap).sort();
  return sortedPaths
    .map((rPath) => {
      const pObj = paramsMap[rPath];
      const keys = Object.keys(pObj);
      if (keys.length === 0) {
        return `    ${JSON.stringify(rPath)}: Record<string, never>;`;
      }
      const props = keys
        .map((k) => {
          const isOptional = pObj[k].includes("undefined");
          const cleanType = pObj[k].replace(" | undefined", "");
          return `${formatTsKey(k)}${isOptional ? "?" : ""}: ${cleanType}`;
        })
        .join("; ");
      return `    ${JSON.stringify(rPath)}: { ${props} };`;
    })
    .join("\n");
}

function formatLayoutSlotsEntries(layoutPaths, slotNamesBySegment) {
  const mergedPaths = new Set([...layoutPaths, ...slotNamesBySegment.keys()]);
  const sortedPaths = [...mergedPaths].sort();
  return sortedPaths
    .map((lPath) => {
      const slotSet = slotNamesBySegment.get(lPath);
      if (!slotSet || slotSet.size === 0) {
        return `    ${JSON.stringify(lPath)}: {};`;
      }
      const slotProps = Array.from(slotSet)
        .sort()
        .map((sName) => `${formatTsKey(sName)}?: ReactNode`)
        .join("; ");
      return `    ${JSON.stringify(lPath)}: { ${slotProps} };`;
    })
    .join("\n");
}

/**
 * Inspects a parallel `@slot` folder (supporting nested route groups `(group)`
 * and optional trailing segments `[[opt]]` / `[[...opt]]`) for `page.*` and `error.*`,
 * and records contextual `./dinou` directories for slot segments.
 */
function inspectSlotDirectory(
  slotDir,
  extraSegments = [],
  state = {
    hasPage: false,
    hasError: false,
    extraSegments: [],
    contextualDirs: [],
  },
  context = null
) {
  if (!fs.existsSync(slotDir)) return state;

  let entries;
  try {
    entries = fs.readdirSync(slotDir, { withFileTypes: true });
  } catch (e) {
    return state;
  }

  const foundPage = hasEntryFile(entries, "page");
  const foundError = hasEntryFile(entries, "error");
  let hasChildSlotRoute = false;

  if (foundPage) {
    state.hasPage = true;
    for (const seg of extraSegments) {
      if (!state.extraSegments.includes(seg)) {
        state.extraSegments.push(seg);
      }
    }
  }
  if (foundError) {
    state.hasError = true;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    if (name.startsWith("_") || name.startsWith("@")) continue;

    if (name.startsWith("(") && name.endsWith(")")) {
      const prevCount = state.contextualDirs.length;
      inspectSlotDirectory(path.join(slotDir, name), extraSegments, state, context);
      if (state.contextualDirs.length > prevCount) {
        hasChildSlotRoute = true;
      }
    } else if (name.startsWith("[[") && name.endsWith("]]")) {
      const prevCount = state.contextualDirs.length;
      inspectSlotDirectory(
        path.join(slotDir, name),
        [...extraSegments, name],
        state,
        context
      );
      if (state.contextualDirs.length > prevCount) {
        hasChildSlotRoute = true;
      }
    }
  }

  if (context && (foundPage || foundError || hasChildSlotRoute)) {
    const relDir = path.relative(context.srcRoot, slotDir).replace(/\\/g, "/");
    const lookupPath =
      extraSegments.length > 0
        ? `${context.baseSlotPath}/${extraSegments.join("/")}`
        : context.baseSlotPath;
    const hasShadowDinou = hasDinouShadowInDir(slotDir, entries);
    state.contextualDirs.push({
      relDir,
      fromPath: context.parentSegmentPath,
      lookupPath,
      isSlot: true,
      isEscaped: Boolean(context.isEscaped),
      hasShadowDinou,
    });
  }

  return state;
}

/**
 * Recursively scans directory to collect all navigable `page.*` routes according to Dinou conventions.
 * - Ignores folders starting with '_' for route registration
 * - Ignores folders starting with '@' (parallel route slots)
 * - Transparently handles route groups '(group)' by stripping them from URL paths
 * - Tracks dynamic parameters: [id], [...slug], [[slug]], [[...slug]]
 */
function collectRoutes(dir, segments = [], routes = []) {
  const topology = collectRouteTopology(dir, segments);
  routes.push(...topology.routes);
  return routes;
}

/**
 * Single-pass horizontal & hierarchical topology scanner across `src/`:
 * - `routes`: navigable URLs (`page.*`) for Level 1 (`<Link>`, `router.push`)
 * - `pageSegments`: `page.*`, `page_functions.*`, and `not_found.*` segments for `PageProps` / `PageFunctions`
 * - `layouts`: `layout.*` and `layout_functions.*` segments (including intermediate layouts without a sibling `page.*`)
 * - `slots`: parallel `@slot` segments (`@slot/page.*`) and parent layout slot injection map
 * - `errorSegments`: all segments capable of hosting an `error.*` boundary (including `@slot/error.*` and intermediate folders)
 * - `contextualDirs`: physical directories inside `src/` that belong to the route tree (for `.dinou/routes/<relDir>/dinou.{d.ts,js}`),
 *   including fallback contextual shims for `_`-escaped route folders so TypeScript/IDEs never break on `"./dinou"`.
 */
function collectRouteTopology(
  dir,
  segments = [],
  topology = {
    routes: [],
    pageSegments: [],
    layouts: [],
    slots: [],
    errorSegments: [],
    slotNamesBySegment: new Map(),
    contextualDirs: [],
  }
) {
  if (!topology.contextualDirs) {
    topology.contextualDirs = [];
  }
  const srcRoot = path.resolve(dir);

  function scanDir(currentDir, currentSegments, isEscaped = false) {
    if (!fs.existsSync(currentDir)) return false;

    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (e) {
      return false;
    }

    const segmentPath =
      currentSegments.length === 0 ? "/" : "/" + currentSegments.join("/");

    const hasPage = hasEntryFile(entries, "page");
    const hasPageFunctions = hasEntryFile(entries, "page_functions");
    const hasNotFound = hasEntryFile(entries, "not_found");
    const hasLayout = hasEntryFile(entries, "layout");
    const hasLayoutFunctions = hasEntryFile(entries, LAYOUT_FUNCTIONS_NAMES);
    const hasError = hasEntryFile(entries, "error");

    const hasOwnRouteFile =
      hasPage ||
      hasPageFunctions ||
      hasNotFound ||
      hasLayout ||
      hasLayoutFunctions ||
      hasError;

    if (!isEscaped) {
      if (hasPage) {
        topology.routes.push({
          path: segmentPath,
          segments: [...currentSegments],
        });
      }

      if (hasPage || hasPageFunctions || hasNotFound) {
        topology.pageSegments.push({
          path: segmentPath,
          segments: [...currentSegments],
        });
      }

      if (hasLayout || hasLayoutFunctions) {
        topology.layouts.push({
          path: segmentPath,
          segments: [...currentSegments],
        });
      }

      if (hasError || hasPage || hasNotFound || hasLayout || hasLayoutFunctions) {
        topology.errorSegments.push({
          path: segmentPath,
          segments: [...currentSegments],
        });
      }
    }

    let hasChildRoute = false;
    const localSlotNames = new Set();

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const name = entry.name;
      // Escaped/parked folders (_*): excluded from global route maps,
      // but still emit fallback contextual "./dinou" shims if they contain route files.
      if (name.startsWith("_")) {
        const escapedHasRoute = scanDir(
          path.join(currentDir, name),
          [...currentSegments, name],
          true
        );
        if (isEscaped && escapedHasRoute) {
          hasChildRoute = true;
        }
        continue;
      }

      // Parallel route slots: @slot
      if (name.startsWith("@")) {
        const slotName = name.slice(1);
        if (!slotName) continue;

        const baseSlotPath =
          (currentSegments.length === 0 ? "" : "/" + currentSegments.join("/")) +
          "/@" +
          slotName;
        const slotState = inspectSlotDirectory(
          path.join(currentDir, name),
          [],
          undefined,
          {
            srcRoot,
            parentSegmentPath: segmentPath,
            baseSlotPath,
            isEscaped,
          }
        );
        const slotDetailedPath =
          slotState.extraSegments.length > 0
            ? `${baseSlotPath}/${slotState.extraSegments.join("/")}`
            : null;
        const slotCombinedSegments = [
          ...currentSegments,
          ...slotState.extraSegments,
        ];

        if (slotState.hasPage) {
          hasChildRoute = true;
          localSlotNames.add(slotName);
          if (!isEscaped) {
            if (!topology.slotNamesBySegment.has(segmentPath)) {
              topology.slotNamesBySegment.set(segmentPath, new Set());
            }
            topology.slotNamesBySegment.get(segmentPath).add(slotName);

            topology.slots.push({
              path: baseSlotPath,
              parentPath: segmentPath,
              slotName,
              segments: slotCombinedSegments,
            });
            if (slotDetailedPath) {
              topology.slots.push({
                path: slotDetailedPath,
                parentPath: segmentPath,
                slotName,
                segments: slotCombinedSegments,
              });
            }
          }
        }

        if (slotState.hasPage || slotState.hasError) {
          hasChildRoute = true;
          if (!isEscaped) {
            topology.errorSegments.push({
              path: baseSlotPath,
              segments: slotCombinedSegments,
            });
            if (slotDetailedPath) {
              topology.errorSegments.push({
                path: slotDetailedPath,
                segments: slotCombinedSegments,
              });
            }
          }
        }

        if (slotState.contextualDirs.length > 0) {
          hasChildRoute = true;
          topology.contextualDirs.push(...slotState.contextualDirs);
        }
        continue;
      }

      // Route groups: (group) - do not add to URL path
      if (name.startsWith("(") && name.endsWith(")")) {
        if (scanDir(path.join(currentDir, name), currentSegments, isEscaped)) {
          hasChildRoute = true;
        }
        continue;
      }

      if (scanDir(path.join(currentDir, name), [...currentSegments, name], isEscaped)) {
        hasChildRoute = true;
      }
    }

    const hasAnyRouteInSubtree = hasOwnRouteFile || hasChildRoute;
    if (hasAnyRouteInSubtree) {
      const relDir = path.relative(srcRoot, currentDir).replace(/\\/g, "/");
      const hasShadowDinou = hasDinouShadowInDir(currentDir, entries);
      topology.contextualDirs.push({
        relDir,
        fromPath: segmentPath,
        lookupPath: segmentPath,
        isSlot: false,
        isEscaped,
        escapedSlotNames: isEscaped ? Array.from(localSlotNames).sort() : undefined,
        hasShadowDinou,
      });
    }

    return hasAnyRouteInSubtree;
  }

  scanDir(srcRoot, segments, false);
  return topology;
}

/**
 * Generates TypeScript type definitions for all discovered routes, layouts, parallel slots, and error boundaries.
 * Accepts either a full `topology` object from `collectRouteTopology` or a legacy `routes` array.
 */
function generateRouteDefinitions(routesOrTopology) {
  const isLegacyArray = Array.isArray(routesOrTopology);
  const routes = isLegacyArray ? routesOrTopology : routesOrTopology?.routes || [];
  const pageSegments = isLegacyArray ? routes : routesOrTopology?.pageSegments || routes;
  const layouts = isLegacyArray ? [] : routesOrTopology?.layouts || [];
  const slots = isLegacyArray ? [] : routesOrTopology?.slots || [];
  const errorSegments = isLegacyArray ? routes : routesOrTopology?.errorSegments || [];
  const slotNamesBySegment = isLegacyArray
    ? new Map()
    : routesOrTopology?.slotNamesBySegment || new Map();

  const staticRoutes = new Set();
  const dynamicTemplateRoutes = new Set();
  const navigableParamsMap = {};
  const routeParamsMap = {};
  const layoutParamsMap = {};
  const slotParamsMap = {};
  const errorParamsMap = {};

  // 1. Level 1 navigable URLs & navigable pattern params (strictly from `page.*` routes)
  for (const route of routes) {
    const segments = route.segments;
    navigableParamsMap[route.path] = {
      ...(navigableParamsMap[route.path] || {}),
      ...extractParamsFromSegments(segments),
    };
    const isDynamic = segments.some((s) => s.startsWith("[") && s.endsWith("]"));

    if (!isDynamic) {
      staticRoutes.add(route.path);
    } else {
      const transformedSegments = segments.map((seg) => {
        if (seg.startsWith("[[...") && seg.endsWith("]]")) {
          return "${string}";
        } else if (seg.startsWith("[[") && seg.endsWith("]]")) {
          return "${string | number}";
        } else if (seg.startsWith("[...") && seg.endsWith("]")) {
          return "${string}";
        } else if (seg.startsWith("[") && seg.endsWith("]")) {
          return "${string | number}";
        }
        return seg;
      });

      dynamicTemplateRoutes.add("`/" + transformedSegments.join("/") + "`");

      // Progressively peel off trailing optional segments to register valid intermediate variants
      let cur = [...segments];
      while (
        cur.length > 0 &&
        cur[cur.length - 1].startsWith("[[") &&
        cur[cur.length - 1].endsWith("]]")
      ) {
        cur.pop();
        if (cur.length === 0) {
          staticRoutes.add("/");
        } else if (!cur.some((s) => s.startsWith("[") && s.endsWith("]"))) {
          staticRoutes.add("/" + cur.join("/"));
        } else {
          const transformed = cur.map((seg) => {
            if (seg.startsWith("[[...") && seg.endsWith("]]")) return "${string}";
            if (seg.startsWith("[[") && seg.endsWith("]]")) return "${string | number}";
            if (seg.startsWith("[...") && seg.endsWith("]")) return "${string}";
            if (seg.startsWith("[") && seg.endsWith("]")) return "${string | number}";
            return seg;
          });
          dynamicTemplateRoutes.add("`/" + transformed.join("/") + "`");
        }
      }
    }
  }

  // 2. Level 2 Page & NotFound parameters (`DinouRouteParamsMap`)
  for (const segEntry of pageSegments) {
    routeParamsMap[segEntry.path] = {
      ...(routeParamsMap[segEntry.path] || {}),
      ...extractParamsFromSegments(segEntry.segments),
    };
  }

  // 3. Level 2 Layout segment parameters (`DinouLayoutParamsMap`)
  for (const layoutEntry of layouts) {
    layoutParamsMap[layoutEntry.path] = {
      ...(layoutParamsMap[layoutEntry.path] || {}),
      ...extractParamsFromSegments(layoutEntry.segments),
    };
  }

  // 4. Level 2 Parallel `@slot` parameters (`DinouSlotParamsMap`)
  for (const slotEntry of slots) {
    slotParamsMap[slotEntry.path] = {
      ...(slotParamsMap[slotEntry.path] || {}),
      ...extractParamsFromSegments(slotEntry.segments),
    };
  }

  // 5. Level 2 Error boundary parameters (`DinouErrorParamsMap`)
  for (const errEntry of errorSegments) {
    errorParamsMap[errEntry.path] = {
      ...(errorParamsMap[errEntry.path] || {}),
      ...extractParamsFromSegments(errEntry.segments),
    };
  }

  return {
    staticRoutes: Array.from(staticRoutes).sort(),
    dynamicRoutes: Array.from(dynamicTemplateRoutes).sort(),
    navigableParamsMap,
    routeParamsMap,
    layoutParamsMap,
    slotParamsMap,
    errorParamsMap,
    slotNamesBySegment,
  };
}

function buildContextualDinouJs(fromPath) {
  const routeLiteral = JSON.stringify(fromPath);
  return `// This file is auto-generated by Dinou. Do not edit directly.
import { createElement } from "react";
import {
  Link as BaseLink,
  useRouter as useBaseRouter,
  defineConfig,
  getContext,
  noDynamic,
  usePathname,
  useSearchParams,
  refreshSlot,
  useNavigationLoading,
  redirect,
  ClientRedirect,
} from "dinou";

export const ROUTE = ${routeLiteral};

export function Link(props) {
  return createElement(BaseLink, {
    ...props,
    from: props?.from ?? ROUTE,
  });
}

export function useRouter() {
  const router = useBaseRouter();
  return {
    ...router,
    push: (href, options) =>
      router.push(href, { ...options, from: options?.from ?? ROUTE }),
    replace: (href, options) =>
      router.replace(href, { ...options, from: options?.from ?? ROUTE }),
  };
}

export {
  defineConfig,
  getContext,
  noDynamic,
  usePathname,
  useSearchParams,
  refreshSlot,
  useNavigationLoading,
  redirect,
  ClientRedirect,
};

const dinou = {
  ROUTE,
  defineConfig,
  getContext,
  noDynamic,
  usePathname,
  useSearchParams,
  useRouter,
  refreshSlot,
  useNavigationLoading,
  redirect,
  ClientRedirect,
  Link,
};

export default dinou;
`;
}

function buildContextualDinouDts({
  fromPath,
  lookupPath,
  isSlot,
  isEscaped = false,
  escapedSlotNames = [],
}) {
  const routeLiteral = JSON.stringify(fromPath);
  const lookupLiteral = JSON.stringify(lookupPath);
  const slotPropsDecl = isSlot
    ? `export interface SlotProps {\n  params: RouteParams;\n}`
    : `export type SlotProps<T extends Dinou.DinouSlotPattern = Dinou.DinouSlotPattern> = Dinou.SlotProps<T>;`;

  const routeConstDecl = isEscaped
    ? `export declare const ROUTE: string;`
    : `export declare const ROUTE = ${routeLiteral};`;

  const layoutParamsLookup = isEscaped ? routeLiteral : "typeof ROUTE";

  const layoutSlotsExpr = isEscaped
    ? escapedSlotNames && escapedSlotNames.length > 0
      ? `{ ${escapedSlotNames.map((sName) => `${formatTsKey(sName)}?: ReactNode`).join("; ")} }`
      : `{}`
    : `Dinou.LayoutSlots<typeof ROUTE>`;

  return `// This file is auto-generated by Dinou. Do not edit directly.
import type { ReactNode } from "react";
import type * as Dinou from "dinou";
import {
  defineConfig,
  getContext,
  noDynamic,
  usePathname,
  useSearchParams,
  refreshSlot,
  useNavigationLoading,
  redirect,
  ClientRedirect,
} from "dinou";

/**
 * URL route pattern associated with this directory (${routeLiteral}).
 */
${routeConstDecl}

/**
 * Resolved dynamic route parameters for this directory (${lookupLiteral}),
 * or for an explicit segment pattern \`T\` if provided.
 */
export type RouteParams<
  T extends Dinou.DinouSegmentPattern | undefined = undefined
> = [T] extends [undefined]
  ? Dinou.LookupSingleSegmentParams<${lookupLiteral}>
  : Dinou.RouteParams<Extract<T, Dinou.DinouSegmentPattern>>;

/**
 * Zero-boilerplate Page component props pre-bound to this directory (${lookupLiteral}).
 * Optionally accepts \`TProps\` for custom props returned by \`page_functions.ts\` (\`getProps\`).
 */
export type PageProps<TProps extends object = {}> = Dinou.SimplifyParams<
  {
    params: RouteParams;
  } & TProps
>;

/**
 * Zero-boilerplate Layout component props pre-bound to this directory (${routeLiteral}),
 * including auto-inferred sibling \`@slot\` ReactNode props and optional \`TProps\` from \`layout_functions.ts\`.
 */
export type LayoutProps<TProps extends object = {}> = Dinou.SimplifyParams<
  {
    children: ReactNode;
    params: Dinou.LookupSingleSegmentParams<${layoutParamsLookup}>;
  } & ${layoutSlotsExpr} &
    TProps
>;

${slotPropsDecl}

/**
 * Zero-boilerplate Error boundary props (\`error.tsx\`) pre-bound to this directory (${lookupLiteral}).
 */
export interface ErrorProps {
  error: Error;
  params: RouteParams;
}

/**
 * Zero-boilerplate Not-Found boundary props (\`not_found.tsx\`) pre-bound to this directory (${lookupLiteral}).
 */
export type NotFoundProps<TProps extends object = {}> = Dinou.SimplifyParams<
  {
    params: RouteParams;
  } & TProps
>;

/**
 * Zero-boilerplate \`page_functions.ts\` contract pre-bound to this directory's \`RouteParams\`.
 */
export type PageFunctions<TProps = any> = Dinou.RouteSegmentConfig<
  RouteParams,
  TProps
>;

/**
 * Zero-boilerplate \`layout_functions.ts\` contract pre-bound to this directory's layout \`params\`.
 */
export type LayoutFunctions<TProps = any> = Dinou.RouteSegmentConfig<
  Dinou.LookupSingleSegmentParams<${layoutParamsLookup}>,
  TProps
>;

/**
 * Props for the route-contextual \`<Link>\` component pre-bound to \`from=${routeLiteral}\`.
 */
export type LinkProps<
  TFrom extends Dinou.DinouFromRoute | undefined = undefined,
  THref extends Dinou.ScopedLinkTargetForFrom<
    typeof ROUTE,
    TFrom
  > = Dinou.ScopedLinkTargetForFrom<typeof ROUTE, TFrom>
> = Dinou.ScopedLinkProps<typeof ROUTE, TFrom, THref>;

/**
 * Route-contextual \`<Link>\` pre-bound to \`from=${routeLiteral}\`.
 * Autocompletes and validates relative targets (\`"sub"\`, \`"./sub"\`, \`"../other"\`),
 * absolute routes, and dynamic \`[param]\` routes without requiring a \`from\` prop.
 */
export declare const Link: Dinou.ScopedLinkComponent<typeof ROUTE>;

/**
 * Route-contextual \`useRouter()\` hook pre-bound to \`from=${routeLiteral}\`.
 * Autocompletes and validates relative targets (\`router.push("sub")\`) and absolute/dynamic
 * routes without requiring \`{ from }\`.
 */
export declare const useRouter: Dinou.ScopedUseRouterHook<typeof ROUTE>;

export {
  defineConfig,
  getContext,
  noDynamic,
  usePathname,
  useSearchParams,
  refreshSlot,
  useNavigationLoading,
  redirect,
  ClientRedirect,
};

export type {
  Query,
  Cookies,
  Headers,
  CookieOptions,
  ResponseProxy,
  RequestContextStore,
  NodeMiddleware,
  ServerHookContext,
  DinouPlugin,
  DinouConfig,
  PPRConfig,
  StaticPathItem,
  StaticPathsResult,
  RouteSegmentConfig,
  ClientRedirectProps,
  NavigationOptions,
  DinouRouter,
  DinouRoute,
  DinouRoutePattern,
  DinouRegisteredSlotPattern,
  DinouSlotPattern,
  DinouLayoutPattern,
  DinouErrorPattern,
  DinouNotFoundPattern,
  DinouSegmentPattern,
  LayoutParams,
  LayoutSlots,
  SlotParams,
  ErrorParams,
  DinouLinkTarget,
  DinouFromRoute,
  DinouRelativeLinkTarget,
  DinouLinkTargetForFrom,
  DinouScopedLinkTarget,
  ScopedLinkProps,
  ScopedLinkComponent,
  ScopedUseRouterHook,
} from "dinou";

declare const dinou: {
  ROUTE: typeof ROUTE;
  defineConfig: typeof defineConfig;
  getContext: typeof getContext;
  noDynamic: typeof noDynamic;
  usePathname: typeof usePathname;
  useSearchParams: typeof useSearchParams;
  useRouter: typeof useRouter;
  refreshSlot: typeof refreshSlot;
  useNavigationLoading: typeof useNavigationLoading;
  redirect: typeof redirect;
  ClientRedirect: typeof ClientRedirect;
  Link: typeof Link;
};

export default dinou;
`;
}

function writeFileIfChanged(targetPath, content) {
  const current = fs.existsSync(targetPath)
    ? fs.readFileSync(targetPath, "utf8")
    : null;
  if (current !== content) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content, "utf8");
  }
}

function pruneContextualRoutesDir(routesOutRoot, expectedFiles) {
  if (!fs.existsSync(routesOutRoot)) return;

  function cleanDirRecursive(dir, isRoot = false) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        cleanDirRecursive(fullPath, false);
      } else if (entry.name === "dinou.js" || entry.name === "dinou.d.ts") {
        if (!expectedFiles.has(normKey(fullPath))) {
          try {
            fs.unlinkSync(fullPath);
          } catch (e) {}
        }
      }
    }

    if (!isRoot) {
      try {
        const remaining = fs.readdirSync(dir);
        if (remaining.length === 0) {
          fs.rmdirSync(dir);
        }
      } catch (e) {}
    }
  }

  cleanDirRecursive(routesOutRoot, true);
}

function syncContextualRouteModules(projectRoot, contextualDirs) {
  const routesOutRoot = path.resolve(projectRoot, ".dinou/routes");
  const expectedFiles = new Set();

  for (const ctxEntry of contextualDirs) {
    if (ctxEntry.hasShadowDinou && !ctxEntry.isEscaped) {
      const shadowRel = ctxEntry.relDir ? `src/${ctxEntry.relDir}/dinou` : "src/dinou";
      console.warn(
        `[Dinou] Warning: "${shadowRel}" shadows the generated route-contextual "./dinou" module for segment "${ctxEntry.lookupPath}".`
      );
    }

    const outDir = ctxEntry.relDir
      ? path.resolve(routesOutRoot, ctxEntry.relDir)
      : routesOutRoot;
    const jsPath = path.join(outDir, "dinou.js");
    const dtsPath = path.join(outDir, "dinou.d.ts");

    expectedFiles.add(normKey(jsPath));
    expectedFiles.add(normKey(dtsPath));

    writeFileIfChanged(jsPath, buildContextualDinouJs(ctxEntry.fromPath));
    writeFileIfChanged(dtsPath, buildContextualDinouDts(ctxEntry));
  }

  pruneContextualRoutesDir(routesOutRoot, expectedFiles);
}

/**
 * Generates `.dinou/types/routes.d.ts` ambient definitions and `.dinou/routes/<relDir>/dinou.{js,d.ts}`
 * route-contextual modules.
 * @param {string} projectRoot Root directory of the project (default process.cwd())
 */
function generateRouteTypes(projectRoot = process.cwd()) {
  const srcDir = path.resolve(projectRoot, "src");
  if (!fs.existsSync(srcDir)) return;

  const topology = collectRouteTopology(srcDir);
  const {
    staticRoutes,
    dynamicRoutes,
    navigableParamsMap,
    routeParamsMap,
    layoutParamsMap,
    slotParamsMap,
    errorParamsMap,
    slotNamesBySegment,
  } = generateRouteDefinitions(topology);

  const staticUnion =
    staticRoutes.length > 0
      ? staticRoutes.map((r) => `  | ${JSON.stringify(r)}`).join("\n")
      : "  | string";

  const dynamicUnion =
    dynamicRoutes.length > 0
      ? dynamicRoutes.map((r) => `  | ${r}`).join("\n")
      : "  | never";

  const navigableParamsEntries = formatParamsMapEntries(navigableParamsMap);
  const paramsEntries = formatParamsMapEntries(routeParamsMap);
  const layoutParamsEntries = formatParamsMapEntries(layoutParamsMap);
  const layoutSlotsEntries = formatLayoutSlotsEntries(
    Object.keys(layoutParamsMap),
    slotNamesBySegment
  );
  const slotParamsEntries = formatParamsMapEntries(slotParamsMap);
  const errorParamsEntries = formatParamsMapEntries(errorParamsMap);

  const formatInterfaceBody = (body) => (body ? `\n${body}\n  ` : "");

  const content = `// This file is auto-generated by Dinou. Do not edit directly.
import type { ReactNode } from "react";
import "dinou";

declare module "dinou" {
  export type DinouStaticRoutes =
${staticUnion};

  export type DinouDynamicRoutes =
${dynamicUnion};

  export type DinouInternalRoute = DinouStaticRoutes | DinouDynamicRoutes;

  export type DinouRelativeOrExternalRoute =
    | \`http://\${string}\`
    | \`https://\${string}\`
    | \`mailto:\${string}\`
    | \`tel:\${string}\`
    | \`#\${string}\`
    | \`?\${string}\`;

  export type DinouGeneratedRoute =
    | DinouStaticRoutes
    | ((
        | DinouDynamicRoutes
        | \`\${DinouInternalRoute}?\${string}\`
        | \`\${DinouInternalRoute}#\${string}\`
        | DinouRelativeOrExternalRoute
      ) & Record<never, never>);

  export interface DinouNavigableParamsMap {${formatInterfaceBody(navigableParamsEntries)}}

  export interface DinouRouteParamsMap {${formatInterfaceBody(paramsEntries)}}

  export interface DinouLayoutParamsMap {${formatInterfaceBody(layoutParamsEntries)}}

  export interface DinouLayoutSlotsMap {${formatInterfaceBody(layoutSlotsEntries)}}

  export interface DinouSlotParamsMap {${formatInterfaceBody(slotParamsEntries)}}

  export interface DinouErrorParamsMap {${formatInterfaceBody(errorParamsEntries)}}

  namespace DinouRouter {
    interface Register {
      route: DinouGeneratedRoute;
      navigableParams: DinouNavigableParamsMap;
      params: DinouRouteParamsMap;
      layoutParams: DinouLayoutParamsMap;
      layoutSlots: DinouLayoutSlotsMap;
      slotParams: DinouSlotParamsMap;
      errorParams: DinouErrorParamsMap;
    }
  }
}
`;

  // 1. Write .dinou/types/routes.d.ts
  const typesDir = path.resolve(projectRoot, ".dinou/types");
  try {
    writeFileIfChanged(path.join(typesDir, "routes.d.ts"), content);
  } catch (e) {
    if (process.env.DINOU_DEBUG) {
      console.warn("[Dinou] Could not write .dinou/types/routes.d.ts:", e.message);
    }
  }

  // 2. Write & prune .dinou/routes/<relDir>/dinou.{js,d.ts}
  try {
    syncContextualRouteModules(projectRoot, topology.contextualDirs || []);
  } catch (e) {
    if (process.env.DINOU_DEBUG) {
      console.warn("[Dinou] Could not sync .dinou/routes modules:", e.message);
    }
  }

  return {
    staticCount: staticRoutes.length,
    dynamicCount: dynamicRoutes.length,
    totalRoutes: topology.routes.length,
    layoutCount: Object.keys(layoutParamsMap).length,
    slotCount: Object.keys(slotParamsMap).length,
    contextualDirCount: (topology.contextualDirs || []).length,
  };
}

export {
  collectRoutes,
  collectRouteTopology,
  generateRouteDefinitions,
  generateRouteTypes,
};
export default {
  collectRoutes,
  collectRouteTopology,
  generateRouteDefinitions,
  generateRouteTypes,
};
