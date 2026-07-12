export async function revalidatePath(path) {
  const { revalidatePath: fn } = await import("./core/cache-revalidate.js");
  return fn(path);
}

export async function revalidateTag(tag) {
  const { revalidateTag: fn } = await import("./core/cache-revalidate.js");
  return fn(tag);
}
