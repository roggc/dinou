// index.js (El Entry Point de tu paquete 'dinou')

// 1. Exportaciones del Core (si las tienes)
// module.exports = {
//   startServer: require('./server-runner.js'),
//   build: require('./builder.js'),
// }

// 2. Re-exportar funciones utilitarias o API para el usuario final

// Re-exporta getContext y requestStorage
// Asegúrate de que la ruta aquí es la correcta (ej. si 'context.js' está en la raíz)
const contextModule = require("./core/request-context.js");
const navigationModule = require("./core/navigation.js");

// Puedes usar re-exportación nombrada
module.exports = {
  // Re-exporta el módulo principal (si tu 'dinou' principal es una función, ponla aquí)

  // API de Contexto
  getContext: contextModule.getContext,
  usePathname: navigationModule.usePathname,
  useSearchParams: navigationModule.useSearchParams,

  // Otras utilidades que puedas añadir en el futuro, ej:
  // cache: require('./cache.js').cache,
  // defineRoute: require('./router.js').defineRoute,
};
