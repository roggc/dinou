// In-memory store
const store = new Map();

/**
 * Saves the result of the static generation.
 * @param {string} reqPath - The route (e.g., "/about/")
 * @param {object} json - { jsx, revalidate, generatedAt }
 */
function setJSXJSON(reqPath, json) {
  // We save the object directly in memory.
  // As a reference, it is instantaneous.
  store.set(reqPath, json);
}

/**
 * Gets the data to serve the RSC or check revalidation.
 * @param {string} reqPath
 * @returns {object|undefined}
 */
function getJSXJSON(reqPath) {
  return store.get(reqPath);
}

/**
 * Verifies if we have data for that route
 */
function hasJSXJSON(reqPath) {
  return store.has(reqPath);
}

/**
 * (Optional) Deletes data if a page no longer exists
 */
function deleteJSXJSON(reqPath) {
  store.delete(reqPath);
}

/**
 * 🆕 Gets all available static routes.
 * Replaces the old function that read the disk recursively.
 *
 * @returns {string[]} Array of routes (e.g., ["/", "/about/", "/blog/post-1/"])
 */
function getStaticPaths() {
  // Array.from converts the iterator of keys into a real Array
  return Array.from(store.keys());
}

module.exports = {
  setJSXJSON,
  getJSXJSON,
  hasJSXJSON,
  deleteJSXJSON,
  getStaticPaths,
};
