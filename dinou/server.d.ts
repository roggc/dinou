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
