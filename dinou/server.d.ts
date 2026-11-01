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

export type {
  PPRConfig,
  RouteSegmentConfig,
  PageFunctions,
  LayoutFunctions,
  StaticPathItem,
  StaticPathsResult,
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
