export async function revalidatePath(path, options) {
  const { revalidatePath: fn } = await import("./core/cache-revalidate.js");
  return fn(path, options);
}

export async function revalidatePage(path) {
  const { revalidatePage: fn } = await import("./core/cache-revalidate.js");
  return fn(path);
}

export async function revalidateTag(tag, options) {
  const { revalidateTag: fn } = await import("./core/cache-revalidate.js");
  return fn(tag, options);
}

export async function DinouCacheSlot(props) {
  const { DinouCacheSlot: fn } = await import("./core/cache-slot.js");
  return fn(props);
}

export {
  StorageAdapter,
  FileSystemStorage,
  CloudflareKVStorage,
  DenoKVStorage,
  MemoryStorage,
  RedisStorage,
  getStorageAdapter,
  setStorageAdapter,
} from "./core/storage-adapter.js";
