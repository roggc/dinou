// dinou/core/jsxStore.js

// Almacén en memoria
// Key: reqPath (string)
// Value: {
//    jsx: Object (El JSX serializado),
//    revalidate: number,
//    generatedAt: number
// }
const store = new Map();

/**
 * Guarda el resultado de la generación estática.
 * @param {string} reqPath - La ruta (ej: "/about/")
 * @param {object} json - { jsx, revalidate, generatedAt }
 */
function setJSXJSON(reqPath, json) {
  // Guardamos directamente el objeto en memoria.
  // Al ser referencia, es instantáneo.
  store.set(reqPath, json);
}

/**
 * Obtiene los datos para servir el RSC o comprobar revalidación.
 * @param {string} reqPath
 * @returns {object|undefined}
 */
function getJSXJSON(reqPath) {
  return store.get(reqPath);
}

/**
 * Verifica si tenemos datos para esa ruta
 */
function hasJSXJSON(reqPath) {
  return store.has(reqPath);
}

/**
 * (Opcional) Borra datos si una página deja de existir
 */
function deleteJSXJSON(reqPath) {
  store.delete(reqPath);
}

/**
 * 🆕 Obtiene todas las rutas estáticas disponibles.
 * Reemplaza a la antigua función que leía el disco recursivamente.
 *
 * @returns {string[]} Array de rutas (ej: ["/", "/about/", "/blog/post-1/"])
 */
function getStaticPaths() {
  // Array.from convierte el iterador de llaves en un Array real
  return Array.from(store.keys());
}

module.exports = {
  setJSXJSON,
  getJSXJSON,
  hasJSXJSON,
  deleteJSXJSON,
  getStaticPaths,
};
