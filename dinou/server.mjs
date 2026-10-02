export async function revalidatePath(path) {
  const { revalidatePath: fn } = await import("./core/cache-revalidate.js");
  return fn(path);
}

export async function revalidateTag(tag) {
  const { revalidateTag: fn } = await import("./core/cache-revalidate.js");
  return fn(tag);
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
