// core/request-context.js
const { AsyncLocalStorage } = require("node:async_hooks");

// 1. Definir una clave global única
const DINOU_CONTEXT_KEY = Symbol.for("dinou.request.context.storage");

// 2. Usar el global para asegurar el Singleton
if (!global[DINOU_CONTEXT_KEY]) {
  global[DINOU_CONTEXT_KEY] = new AsyncLocalStorage();
}

const requestStorage = global[DINOU_CONTEXT_KEY];
// const requestStorage = new AsyncLocalStorage();

// El resto de tu archivo...
function getContext() {
  const store = requestStorage.getStore(); // AHORA LEE DE LA INSTANCIA ÚNICA GLOBAL
  return store;
}

module.exports = {
  requestStorage,
  getContext,
};
