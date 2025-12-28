// src/core/register-hooks.js
if (!global.__DINOU_MODULE_MAP) {
  global.__DINOU_MODULE_MAP = new WeakMap();
}

global.__DINOU_REGISTER_MODULE = function (mod, id, isPackage) {
  if (!mod) return;

  const meta = { id, isPackage };

  if (typeof mod === "object" || typeof mod === "function") {
    global.__DINOU_MODULE_MAP.set(mod, meta);
  }

  try {
    if (mod.default) global.__DINOU_MODULE_MAP.set(mod.default, meta);
  } catch (e) {}
};
