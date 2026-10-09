/**
 * Revalidates the cache for a specific route path.
 * * It deletes the old cached HTML and RSC files and rebuilds them synchronously.
 * * When `{ cascade: true }` is specified, if a layout is present and revalidated in that path,
 * it cascades `revalidatePage` to all child routes to ensure 0 hydration mismatch.
 * @param path The path of the route to revalidate (e.g. "/blog" or "/dashboard").
 * @param options Optional configuration: `{ cascade?: boolean }` or legacy `"layout"`.
 */
export declare function revalidatePath(
  path: string,
  options?: { cascade?: boolean } | "layout"
): Promise<void>;

/**
 * Revalidates only the page component (`page.rsc`) and its HTML (`index.html`) for a specific route path,
 * without touching any layout.
 * @param path The path of the page to revalidate (e.g. "/dashboard/analytics").
 */
export declare function revalidatePage(path: string): Promise<void>;

/**
 * Revalidates all routes that are associated with the specified cache tag.
 * @param tag The tag string to revalidate (e.g. "blog-posts").
 */
export declare function revalidateTag(tag: string): Promise<void>;
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
