// // dinou/core/request-context.js

// const DINOU_CONTEXT_KEY = Symbol.for("dinou.request.context.storage");
// let requestStorage;

// if (typeof window === "undefined") {
//   // 🟢 ENTORNO SERVIDOR (Node.js)

//   // 🛡️ SOLUCIÓN PARA TODOS LOS BUNDLERS:
//   // 1. Webpack: Usamos __non_webpack_require__ para que ignore totalmente el import.
//   // 2. Esbuild/Otros: Usamos 'require' normal.
//   // 3. 'target': Definimos el string fuera para evitar análisis estático de esquemas "node:".

//   const r =
//     typeof __non_webpack_require__ !== "undefined"
//       ? __non_webpack_require__
//       : require;

//   // Rompemos el string para que ningún analizador estático detecte "node:" como protocolo
//   const target = "node" + ":async_hooks";

//   const { AsyncLocalStorage } = r(target);

//   if (!global[DINOU_CONTEXT_KEY]) {
//     global[DINOU_CONTEXT_KEY] = new AsyncLocalStorage();
//   }

//   requestStorage = global[DINOU_CONTEXT_KEY];
// } else {
//   // 🔵 ENTORNO CLIENTE
//   requestStorage = {
//     run: (store, callback) => callback(),
//     getStore: () => undefined,
//   };
// }

// // ... Resto del archivo igual ...
// function getContext() {
//   if (!requestStorage) return undefined;
//   const store = requestStorage.getStore();
//   return store;
// }

// module.exports = {
//   requestStorage,
//   getContext,
// };

// dinou/core/request-context.js

const DINOU_CONTEXT_KEY = Symbol.for("dinou.request.context.storage");
let requestStorage;

// 1. Lógica Condicional
if (typeof window === "undefined") {
  // 🟢 ENTORNO SERVIDOR (Node.js)

  // 🛡️ TRUCO SUPREMO ANTI-WEBPACK:
  // Usamos eval("require"). Webpack ve un string y lo ignora.
  // Node.js ejecuta el eval y obtiene la función require real.
  // Esto elimina TODOS los warnings de "Critical dependency" y "target node".
  const nodeRequire = eval("require");

  const { AsyncLocalStorage } = nodeRequire("node:async_hooks");

  if (!global[DINOU_CONTEXT_KEY]) {
    global[DINOU_CONTEXT_KEY] = new AsyncLocalStorage();
  }

  requestStorage = global[DINOU_CONTEXT_KEY];
} else {
  // 🔵 ENTORNO CLIENTE
  requestStorage = {
    run: (store, callback) => callback(),
    getStore: () => undefined,
  };
}

// ... Resto del archivo igual ...
function getContext() {
  if (typeof window !== "undefined") {
    console.error(
      "[Dinou] ❌ You are calling getContext() inside a Client Component running in the browser. This function is Server-Only. Pass the data as props from a Server Component instead."
    );
    return {}; // Retorno seguro para evitar crash total, pero avisa al dev.
  }
  if (!requestStorage) return undefined;
  const store = requestStorage.getStore();
  return store;
}

module.exports = {
  requestStorage,
  getContext,
};
