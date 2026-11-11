/**
 * Revalidates the cache for a specific route path (both its layout segment, if present, and its page).
 * Child routes sharing the layout have their `index.html` lazily re-composed on demand (preserving their cached `page.rsc` payloads) to ensure 0 hydration mismatch.
 * @param path The path of the route to revalidate (e.g. "/blog" or "/dashboard").
 */
export declare function revalidatePath(path: string): Promise<void>;
/**
 * @deprecated The `options` parameter (`{ cascade }` / `"layout"`) is deprecated and ignored since 9.0.3.
 * Zero hydration mismatch is now guaranteed automatically via lazy `index.html` re-composition,
 * and layout-only revalidation should use `revalidateLayout(path)`.
 */
export declare function revalidatePath(
  path: string,
  options?: { cascade?: boolean } | "layout"
): Promise<void>;

/**
 * Revalidates only the page component (`page.rsc`) and its HTML (`index.html`) for a specific route path,
 * composing with the cached layout without re-executing `layout.tsx`.
 * @param path The path of the page to revalidate (e.g. "/dashboard/analytics").
 */
export declare function revalidatePage(path: string): Promise<void>;

/**
 * Revalidates only the layout shell (`layout.rsc` and `layout.metadata.json`) for a specific route path,
 * without re-rendering child pages. Affected `index.html` files are lazily re-composed on demand.
 * @param path The path of the layout segment to revalidate (e.g. "/dashboard").
 */
export declare function revalidateLayout(path: string): Promise<boolean>;

/**
 * Revalidates all routes, layouts, or cache slots that are associated with the specified cache tag.
 * Layout tags surgically revalidate only the layout shell (`layout.rsc`), while affected `index.html` files
 * are lazily re-composed on demand to ensure 0 hydration mismatch.
 * @param tag The tag string to revalidate (e.g. "blog-posts").
 */
export declare function revalidateTag(tag: string): Promise<void>;
/**
 * @deprecated The `options` parameter (`{ cascade }` / `"layout"`) is deprecated and ignored since 9.0.3.
 * Zero hydration mismatch is now guaranteed automatically via lazy `index.html` re-composition.
 */
export declare function revalidateTag(
  tag: string,
  options?: { cascade?: boolean } | "layout"
): Promise<void>;

import type { RequestContextStore } from "./index";

export type {
  PPRConfig,
  RouteSegmentConfig,
  PageFunctions,
  LayoutFunctions,
  StaticPathItem,
  StaticPathsResult,
  RequestContextStore,
  ResponseProxy,
  CookieOptions,
  Query,
  Cookies,
  Headers,
  DinouConfig,
  DinouPlugin,
  ServerHookContext,
  NodeMiddleware,
  NavigationOptions,
  LinkProps,
  PageProps,
  LayoutProps,
  SlotProps,
  ErrorProps,
  NotFoundProps,
  RouteParams,
  LayoutParams,
  LayoutSlots,
  SlotParams,
  ErrorParams,
  DinouRoutePattern,
  DinouLayoutPattern,
  DinouSlotPattern,
  DinouRegisteredSlotPattern,
  DinouErrorPattern,
  DinouNotFoundPattern,
  DinouSegmentPattern,
  DinouRoute,
  DinouLinkTarget,
  DinouNavigableRoutePatternMap,
  DinouNavigableRouteKey,
  DinouDynamicRoutePattern,
  DinouDynamicRouteWithSuffix,
  BuildDirectoryPrefixes,
  ExtractParentDirectories,
  PeelOptionalRouteSegments,
  DinouEffectiveRoutePattern,
  DinouFromSlashRoute,
  DinouFromRoute,
  SplitRouteSegments,
  StripCommonPrefix,
  HasVariableLengthSegment,
  HasDynamicSegment,
  ToDotDotSegments,
  JoinSlash,
  SegmentToTemplate,
  MapSegmentsToTemplate,
  SharesFirstSegment,
  ComputeRelativeCompletionSingle,
  ComputeRelativeAllPatternsSingle,
  ComputeRelativeTemplateSingle,
  DistributeRelativeCompletions,
  DistributeAllRelativePatterns,
  DistributeRelativeTemplates,
  DinouRelativeDynamicPattern,
  DinouRelativeLinkTarget,
  DinouLinkTargetForFrom,
  DinouScopedLinkTarget,
  ScopedLinkTargetForFrom,
  DinouRouter,
  CleanRoutePath,
  ExtractRouteParams,
  ExtractSegmentParam,
  SimplifyParams,
  FallbackRouteParams,
  FormatPatternKeys,
  FormatOptionalPatternKeys,
  IsUnion,
  LookupSingleSegmentParams,
  LookupSegmentParams,
  ToLinkInputParamValue,
  ToLinkInputParams,
  StripUrlSuffix,
  IsExternalLinkHref,
  IsInternalBracketPattern,
  ValidatedLinkHref,
  HasInvalidBracketPatternForFrom,
  HasInvalidBracketPattern,
  HasBracketPattern,
  UnionToIntersection,
  ResolveSingleLinkParams,
  ResolveLinkParams,
  LinkParamsPropsForFrom,
  LinkParamsProps,
  RouterNavigationArgs,
  RouterRelativeNavigationOptions,
  DinouRouterNavigateFn,
  ScopedRouterNavigationArgs,
  ScopedDinouRouterNavigateFn,
  ScopedUseRouterHook,
  ScopedLinkProps,
  ScopedLinkComponent,
} from "./index";

export interface DinouCacheSlotProps {
  id?: string;
  tag?: string;
  tags?: string[];
  revalidate?: number;
  children: any;
}

/**
 * DinouCacheSlot: Vertical segmentation primitive (Micro-ISR) for React Server Components.
 * Caches and invalidates component sub-trees inside a page via revalidate and revalidateTag,
 * without re-evaluating the parent page or re-fetching unneeded database queries.
 */
export declare function DinouCacheSlot(props: DinouCacheSlotProps): Promise<any>;

/**
 * Opts the enclosing `<Suspense>` boundary out of becoming a Dynamic PPR Hole
 * when wrapping an async Server Component on a PPR route (`ppr = true`).
 *
 * Call `noDynamic()` synchronously at the top of your async Server Component
 * (before its first `await`) so Dinou resolves its promise at build time and
 * bakes the rendered output directly into the Static Shell (`shell.html`).
 */
export declare function noDynamic(): void;

/**
 * Gets the current request context (req and res proxy) synchronously.
 * Must be called within a Server Component, `getProps`, or a `"use server"` Server Function.
 * @returns The current request context store, or `undefined` if called outside a request scope.
 */
export declare function getContext(): RequestContextStore | undefined;

// ====================================================================
// STORAGE ADAPTER TYPES (ISR / CACHE)
// ====================================================================

export interface StorageItem {
  content: string;
  metadata?: any;
}

export abstract class StorageAdapter {
  abstract get(key: string): Promise<StorageItem | null>;
  abstract set(key: string, content: string, metadata?: any): Promise<void>;
  abstract has(key: string): Promise<boolean>;
  abstract delete(key: string): Promise<void>;
}

export class FileSystemStorage extends StorageAdapter {
  constructor(baseDir?: string);
  get(key: string): Promise<StorageItem | null>;
  set(key: string, content: string, metadata?: any): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}

export class CloudflareKVStorage extends StorageAdapter {
  constructor(kvNamespace: any);
  get(key: string): Promise<StorageItem | null>;
  set(key: string, content: string, metadata?: any): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}

export class DenoKVStorage extends StorageAdapter {
  constructor(kvInstance?: any);
  get(key: string): Promise<StorageItem | null>;
  set(key: string, content: string, metadata?: any): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}

export class MemoryStorage extends StorageAdapter {
  constructor();
  get(key: string): Promise<StorageItem | null>;
  set(key: string, content: string, metadata?: any): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}

export class RedisStorage extends StorageAdapter {
  constructor(redisClient: any, prefix?: string);
  get(key: string): Promise<StorageItem | null>;
  set(key: string, content: string, metadata?: any): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}

export function getStorageAdapter(): StorageAdapter;
export function setStorageAdapter(adapter: StorageAdapter): void;
