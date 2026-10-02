const {
  StorageAdapter,
  FileSystemStorage,
  CloudflareKVStorage,
  DenoKVStorage,
  MemoryStorage,
  RedisStorage,
  getStorageAdapter,
  setStorageAdapter,
} = require("./core/storage-adapter.js");
const { DinouCacheSlot } = require("./core/cache-slot.js");

module.exports = {
  DinouCacheSlot,
  revalidatePath: async function (path) {
    const { revalidatePath: fn } = require("./core/cache-revalidate.js");
    return fn(path);
  },
  revalidateTag: async function (tag) {
    const { revalidateTag: fn } = require("./core/cache-revalidate.js");
    return fn(tag);
  },
  StorageAdapter,
  FileSystemStorage,
  CloudflareKVStorage,
  DenoKVStorage,
  MemoryStorage,
  RedisStorage,
  getStorageAdapter,
  setStorageAdapter,
};
