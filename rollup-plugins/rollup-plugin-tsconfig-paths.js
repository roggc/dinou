"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === "object") || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, "default", { value: mod, enumerable: true })
      : target,
    mod
  )
);

// src/plugin.ts
var import_node_fs = __toESM(require("fs"));
var import_node_path = __toESM(require("path"));
var import_typescript = __toESM(require("typescript"));
var import_typescript_paths = require("typescript-paths");
var PLUGIN_NAME = "tsconfig-paths";
function tsConfigPaths({
  tsConfigPath,
  respectCoreModule,
  logLevel,
  colors = true,
} = {}) {
  let log;
  let handler;
  return {
    name: PLUGIN_NAME,
    buildStart() {
      log = (0, import_typescript_paths.createLogger)({
        logLevel: (0, import_typescript_paths.convertLogLevel)(logLevel),
        colors,
        ID: PLUGIN_NAME,
      });
      log(
        import_typescript_paths.LogLevel.Debug,
        `typescript version: ${import_typescript.default.version}`
      );
      handler = (0, import_typescript_paths.createHandler)({
        log,
        tsConfigPath,
        respectCoreModule,
        falllback: (moduleName) =>
          import_node_fs.default.existsSync(moduleName) ||
          import_node_fs.default.existsSync(moduleName + ".mjs"),
      });
      return;
    },
    async resolveId(request, importer, options) {
      if (!importer || request.startsWith("\0")) {
        return null;
      }
      let moduleName = handler == null ? void 0 : handler(request, importer);

      if (!moduleName) {
        return this.resolve(request, importer, { skipSelf: true, ...options });
      }
      log(
        import_typescript_paths.LogLevel.Debug,
        `${request} -> ${moduleName}`
      );
      if (!import_node_path.default.extname(moduleName)) {
        return this.resolve(moduleName, importer, {
          skipSelf: true,
          ...options,
        });
      }

      return moduleName;
    },
  };
}

// src/index.ts
tsConfigPaths["default"] = tsConfigPaths;
module.exports = tsConfigPaths;
