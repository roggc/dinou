import { getContext } from "./core/request-context.js";
import { noDynamic } from "./core/no-dynamic.js";

export { getContext, noDynamic };

const REVALIDATION_API_SYMBOL = Symbol.for("dinou.revalidation.api");

function getActiveRevalidationApi() {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.__DINOU_EDGE_RENDERER__ &&
    globalThis[REVALIDATION_API_SYMBOL]
  ) {
    return globalThis[REVALIDATION_API_SYMBOL];
  }
  return null;
}

export async function revalidatePath(path, options) {
  const api = getActiveRevalidationApi();
  if (api && typeof api.revalidatePath === "function") {
    return api.revalidatePath(path, options);
  }
  const { revalidatePath: fn } = await import("./core/cache-revalidate.js");
  return fn(path, options);
}

export async function revalidatePage(path) {
  const api = getActiveRevalidationApi();
  if (api && typeof api.revalidatePage === "function") {
    return api.revalidatePage(path);
  }
  const { revalidatePage: fn } = await import("./core/cache-revalidate.js");
  return fn(path);
}

export async function revalidateLayout(path) {
  const api = getActiveRevalidationApi();
  if (api && typeof api.revalidateLayout === "function") {
    return api.revalidateLayout(path);
  }
  const { revalidateLayout: fn } = await import("./core/cache-revalidate.js");
  return fn(path);
}

export async function revalidateTag(tag, options) {
  const api = getActiveRevalidationApi();
  if (api && typeof api.revalidateTag === "function") {
    return api.revalidateTag(tag, options);
  }
  const { revalidateTag: fn } = await import("./core/cache-revalidate.js");
  return fn(tag, options);
}

export async function DinouCacheSlot(props) {
  const { DinouCacheSlot: fn } = await import("./core/cache-slot.js");
  return fn(props);
}
DinouCacheSlot.$$dinouCacheSlot = true;

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
