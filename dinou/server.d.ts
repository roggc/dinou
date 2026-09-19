/**
 * Revalidates the cache for a specific route path.
 * * It deletes the old cached HTML and RSC files and rebuilds them synchronously.
 * @param path The path of the route to revalidate (e.g. "/blog" or "/blog/12").
 */
export declare function revalidatePath(path: string): Promise<void>;

/**
 * Revalidates all routes that are associated with the specified cache tag.
 * @param tag The tag string to revalidate (e.g. "blog-posts").
 */
export declare function revalidateTag(tag: string): Promise<void>;

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
