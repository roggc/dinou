import { createRequire as __dinou_createRequire } from "node:module";
import { fileURLToPath as __dinou_fileURLToPath } from "node:url";
import __dinou_path from "node:path";
const require = __dinou_createRequire(import.meta.url);
const __filename = __dinou_fileURLToPath(import.meta.url);
const __dirname = __dinou_path.dirname(__filename);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../node_modules/typescript-paths/lib/core.js
var require_core = __commonJS({
  "../node_modules/typescript-paths/lib/core.js"(exports) {
    "use strict";
    var Module = __require("module");
    var path2 = __require("path");
    var ts2 = __require("typescript");
    var fs2 = __require("fs");
    var LogLevel2 = /* @__PURE__ */ (function(LogLevel3) {
      LogLevel3[LogLevel3["None"] = 0] = "None";
      LogLevel3[LogLevel3["Error"] = 1] = "Error";
      LogLevel3[LogLevel3["Warning"] = 2] = "Warning";
      LogLevel3[LogLevel3["Info"] = 3] = "Info";
      LogLevel3[LogLevel3["Debug"] = 4] = "Debug";
      LogLevel3[LogLevel3["Trace"] = 5] = "Trace";
      return LogLevel3;
    })({});
    function convertLogLevel2(level) {
      switch (level) {
        case "none":
          return LogLevel2.None;
        case "error":
          return LogLevel2.Error;
        case "warn":
          return LogLevel2.Warning;
        case "info":
          return LogLevel2.Info;
        case "debug":
          return LogLevel2.Debug;
        case "trace":
          return LogLevel2.Trace;
        default:
          return void 0;
      }
    }
    var Reset = "\x1B[0m";
    var FgRed = "\x1B[31m";
    var FgYellow = "\x1B[33m";
    var FgBlue = "\x1B[34m";
    var FgCyan = "\x1B[36m";
    var FgMagenta = "\x1B[35m";
    function fromTYPESCRIPT_PATHS_LOG_LEVEL() {
      const env = process.env["TYPESCRIPT_PATHS_LOG_LEVEL"];
      switch (env) {
        case "none":
          return LogLevel2.None;
        case "error":
          return LogLevel2.Error;
        case "warn":
          return LogLevel2.Warning;
        case "info":
          return LogLevel2.Info;
        case "debug":
          return LogLevel2.Debug;
        case "trace":
          return LogLevel2.Trace;
        default:
          return void 0;
      }
    }
    function createLogger2({
      logLevel = fromTYPESCRIPT_PATHS_LOG_LEVEL() || LogLevel2.Info,
      colors = true,
      ID = "typescript-paths"
    } = {}) {
      return function log(level, ...args) {
        if (logLevel < level) {
          return;
        }
        if (ID) {
          args.unshift(`[${ID}]:`);
        }
        if (colors) {
          args = args.map((a) => {
            if (typeof a !== "string") return a;
            switch (level) {
              case LogLevel2.Error:
                return FgRed + a + Reset;
              case LogLevel2.Warning:
                return FgYellow + a + Reset;
              case LogLevel2.Info:
                return FgBlue + a + Reset;
              case LogLevel2.Debug:
                return FgCyan + a + Reset;
              case LogLevel2.Trace:
                return FgMagenta + a + Reset;
            }
          });
        }
        switch (level) {
          case LogLevel2.Error:
            console.error(...args);
            break;
          case LogLevel2.Warning:
            console.warn(...args);
            break;
          case LogLevel2.Info:
            console.info(...args);
            break;
          case LogLevel2.Debug:
            console.log(...args);
            break;
          case LogLevel2.Trace:
            console.log(...args);
            break;
        }
      };
    }
    function getTsConfig({
      tsConfigPath,
      log = createLogger2(),
      host = ts2.sys
    }) {
      const {
        error,
        config
      } = ts2.readConfigFile(tsConfigPath, host.readFile);
      if (error) {
        let hasError = false;
        switch (error.category) {
          case ts2.DiagnosticCategory.Error:
            log(LogLevel2.Error, error.messageText);
            hasError = true;
            break;
        }
        if (hasError) return void 0;
      }
      let {
        options: compilerOptions,
        errors,
        fileNames,
        projectReferences
      } = ts2.parseJsonConfigFileContent(config, host, path2.resolve(path2.dirname(tsConfigPath)));
      if (errors.length > 0) {
        let hasError = false;
        for (const error2 of errors) {
          switch (error2.category) {
            case ts2.DiagnosticCategory.Error:
              log(LogLevel2.Error, error2.messageText);
              hasError = true;
              break;
          }
        }
        if (hasError) return void 0;
      }
      const ret = {
        filePath: path2.resolve(tsConfigPath),
        compilerOptions,
        fileNames: fileNames.map(path2.normalize),
        extends: config.extends
      };
      if (projectReferences) {
        ret.references = [];
        for (const r of projectReferences) {
          let tsConfigPath2 = r.path;
          try {
            const stat = fs2.lstatSync(tsConfigPath2);
            if (stat.isDirectory()) {
              tsConfigPath2 = path2.join(tsConfigPath2, "tsconfig.json");
            }
          } catch (err) {
            const error2 = err;
            log(LogLevel2.Error, error2.message);
            return void 0;
          }
          const cfg = getTsConfig({
            tsConfigPath: tsConfigPath2,
            log,
            host
          });
          if (cfg) ret.references.push(cfg);
        }
      }
      return ret;
    }
    function createMappings({
      paths,
      log = createLogger2(),
      respectCoreModule = true
    }) {
      const countWildcard = (value) => value.match(/\*/g)?.length ?? 0;
      const mappings = [];
      for (const pattern of Object.keys(paths)) {
        if (countWildcard(pattern) > 1) {
          log(LogLevel2.Warning, `Pattern '${pattern}' can have at most one '*' character.`);
          continue;
        }
        const wildcard = pattern.indexOf("*");
        if (respectCoreModule) {
          let skip = false;
          for (const key of Module.builtinModules) {
            if (pattern === key || pattern.startsWith(key + "/")) {
              log(LogLevel2.Warning, `path pattern '${pattern}' is ignored.`);
              log(LogLevel2.Info, `respect core module '${key}'.`);
              skip = true;
            }
          }
          if (skip) continue;
        }
        const targets = paths[pattern].filter((target) => {
          if (countWildcard(target) > 1) {
            log(LogLevel2.Warning, `Substitution '${target}' in pattern '${pattern}' can have at most one '*' character.`);
            return false;
          }
          return true;
        });
        if (targets.length === 0) {
          continue;
        }
        if (pattern === "*") {
          mappings.push({
            wildcard: true,
            pattern,
            prefix: "",
            suffix: "",
            targets
          });
          continue;
        }
        mappings.push({
          wildcard: wildcard !== -1,
          pattern,
          prefix: pattern.substring(0, wildcard),
          suffix: pattern.substring(wildcard + 1),
          targets
        });
      }
      for (const mapping of mappings) {
        log(LogLevel2.Debug, `pattern: '${mapping.pattern}' targets: '${mapping.targets}'`);
      }
      return mappings;
    }
    function isPatternMatch(prefix, suffix, candidate) {
      return candidate.length >= prefix.length + suffix.length && candidate.startsWith(prefix) && candidate.endsWith(suffix);
    }
    function findMatch(moduleName, mappings) {
      let longestMatchedPrefixLength = -1;
      let matched;
      for (const mapping of mappings) {
        const {
          wildcard,
          prefix,
          suffix,
          pattern
        } = mapping;
        if (wildcard && isPatternMatch(prefix, suffix, moduleName)) {
          if (longestMatchedPrefixLength < prefix.length) {
            longestMatchedPrefixLength = prefix.length;
            matched = mapping;
          }
        } else if (moduleName === pattern) {
          matched = mapping;
          break;
        }
      }
      return matched;
    }
    function resolveModuleName({
      mappings,
      request,
      importer,
      compilerOptions,
      host,
      falllback
    }) {
      const matched = findMatch(request, mappings);
      if (!matched) {
        return void 0;
      }
      const matchedWildcard = request.slice(matched.prefix.length, request.length - matched.suffix.length);
      for (const target of matched.targets) {
        const updated = matched.wildcard ? target.replace("*", matchedWildcard) : target;
        const base = compilerOptions.baseUrl ?? compilerOptions.pathsBasePath;
        const moduleName = path2.resolve(base, updated);
        const ext = path2.extname(moduleName);
        switch (ext) {
          case ".ts":
          case ".tsx":
          case ".json":
            return moduleName;
          case ".js":
          case ".jsx":
            if (compilerOptions.module === ts2.ModuleKind.NodeNext) {
              break;
            }
            return moduleName;
        }
        const result = ts2.resolveModuleName(moduleName, importer, compilerOptions, host);
        if (result?.resolvedModule) {
          return path2.normalize(result.resolvedModule.resolvedFileName);
        }
        if (falllback?.(moduleName)) return moduleName;
      }
      return void 0;
    }
    function fromTS_NODE_PROJECT() {
      const env = process.env["TS_NODE_PROJECT"];
      if (env) return env.split(path2.delimiter).filter(Boolean);
      return void 0;
    }
    function createHandler2({
      searchPath,
      tsConfigPath = fromTS_NODE_PROJECT(),
      respectCoreModule = true,
      log = createLogger2(),
      falllback
    } = {}) {
      if (!tsConfigPath) {
        if (searchPath && searchPath instanceof Array) {
          tsConfigPath = searchPath.map((p) => ts2.findConfigFile(p, ts2.sys.fileExists)).filter((v) => Boolean(v));
        } else {
          tsConfigPath = ts2.findConfigFile(searchPath || ts2.sys.getCurrentDirectory(), ts2.sys.fileExists) || [];
        }
      }
      const host = {
        ...ts2.sys,
        fileExists(filename) {
          if (filename.endsWith(ts2.Extension.Dts)) return false;
          return ts2.sys.fileExists(filename);
        }
      };
      const services = [];
      const configs = spreadTsConfig(tsConfigPath);
      if (!configs) {
        return void 0;
      }
      for (const config of configs) {
        addServices(config);
      }
      return (request, importer) => services.reduce((result, srv) => {
        if (result) {
          return result;
        }
        const {
          compilerOptions,
          cache,
          fileNames,
          mappings
        } = srv;
        const exist = cache.get(importer);
        if (exist !== void 0) {
          cache.delete(importer);
          cache.set(importer, exist);
          if (!exist) return void 0;
        } else if (fileNames.indexOf(importer) === -1) {
          if (cache.size === 1 << 8) cache.delete(cache.keys().next().value);
          cache.set(importer, false);
          return void 0;
        } else {
          if (cache.size === 1 << 8) cache.delete(cache.keys().next().value);
          cache.set(importer, true);
        }
        return resolveModuleName({
          compilerOptions,
          host,
          importer,
          request,
          mappings,
          falllback
        });
      }, void 0);
      function addServices(config) {
        const {
          compilerOptions,
          fileNames,
          references
        } = config;
        if (!compilerOptions.paths || compilerOptions.paths instanceof Array) return;
        services.push({
          compilerOptions,
          fileNames,
          mappings: createMappings({
            log,
            respectCoreModule,
            paths: compilerOptions.paths
          }),
          cache: /* @__PURE__ */ new Map()
        });
        if (references) {
          for (const config2 of references) {
            addServices(config2);
          }
        }
      }
      function spreadTsConfig(tsConfigPath2) {
        if (typeof tsConfigPath2 === "string") {
          tsConfigPath2 = [tsConfigPath2];
        } else if (!(tsConfigPath2 instanceof Array)) {
          tsConfigPath2 = [tsConfigPath2];
        }
        const configs2 = [];
        for (const configPayloadOrPath of tsConfigPath2) {
          if (typeof configPayloadOrPath === "string") {
            log(LogLevel2.Trace, `loading: ${configPayloadOrPath}`);
          }
          const config = typeof configPayloadOrPath === "string" ? getTsConfig({
            tsConfigPath: configPayloadOrPath,
            host: ts2.sys,
            log
          }) : configPayloadOrPath;
          if (!config) {
            return void 0;
          }
          configs2.push(config);
        }
        return configs2;
      }
    }
    function register({
      tsConfigPath,
      respectCoreModule,
      logLevel,
      colors,
      loggerID,
      falllback
    } = {}) {
      const log = createLogger2({
        logLevel: convertLogLevel2(logLevel),
        colors,
        ID: loggerID
      });
      const handler = createHandler2({
        tsConfigPath,
        respectCoreModule,
        log,
        falllback
      });
      if (!handler) {
        return () => {
        };
      }
      const originalResolveFilename = Module["_resolveFilename"];
      Module["_resolveFilename"] = function(request, parent, ...args) {
        if (!parent) return originalResolveFilename.apply(this, arguments);
        const moduleName = handler(request, parent.filename);
        if (moduleName) {
          log(LogLevel2.Debug, `${request} -> ${moduleName}`);
          return originalResolveFilename.apply(this, [moduleName, parent, ...args]);
        }
        return originalResolveFilename.apply(this, arguments);
      };
      return () => {
        Module["_resolveFilename"] = originalResolveFilename;
      };
    }
    exports.LogLevel = LogLevel2;
    exports.convertLogLevel = convertLogLevel2;
    exports.createHandler = createHandler2;
    exports.createLogger = createLogger2;
    exports.createMappings = createMappings;
    exports.findMatch = findMatch;
    exports.fromTS_NODE_PROJECT = fromTS_NODE_PROJECT;
    exports.fromTYPESCRIPT_PATHS_LOG_LEVEL = fromTYPESCRIPT_PATHS_LOG_LEVEL;
    exports.getTsConfig = getTsConfig;
    exports.isPatternMatch = isPatternMatch;
    exports.register = register;
    exports.resolveModuleName = resolveModuleName;
  }
});

// ../node_modules/typescript-paths/lib/index.js
var require_lib = __commonJS({
  "../node_modules/typescript-paths/lib/index.js"(exports) {
    "use strict";
    var register = require_core();
    __require("module");
    __require("path");
    __require("typescript");
    __require("fs");
    exports.LogLevel = register.LogLevel;
    exports.convertLogLevel = register.convertLogLevel;
    exports.createHandler = register.createHandler;
    exports.createLogger = register.createLogger;
    exports.createMappings = register.createMappings;
    exports.findMatch = register.findMatch;
    exports.fromTS_NODE_PROJECT = register.fromTS_NODE_PROJECT;
    exports.fromTYPESCRIPT_PATHS_LOG_LEVEL = register.fromTYPESCRIPT_PATHS_LOG_LEVEL;
    exports.getTsConfig = register.getTsConfig;
    exports.isPatternMatch = register.isPatternMatch;
    exports.register = register.register;
    exports.resolveModuleName = register.resolveModuleName;
  }
});

// ../node_modules/rollup-plugin-tsconfig-paths/index.mjs
var import_typescript_paths = __toESM(require_lib(), 1);
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
var PLUGIN_NAME = "tsconfig-paths";
function tsConfigPaths({
  tsConfigPath,
  respectCoreModule,
  logLevel,
  colors = true
} = {}) {
  let log;
  let handler;
  return {
    name: PLUGIN_NAME,
    buildStart() {
      log = (0, import_typescript_paths.createLogger)({ logLevel: (0, import_typescript_paths.convertLogLevel)(logLevel), colors, ID: PLUGIN_NAME });
      log(import_typescript_paths.LogLevel.Debug, `typescript version: ${ts.version}`);
      handler = (0, import_typescript_paths.createHandler)({
        log,
        tsConfigPath,
        respectCoreModule,
        falllback: (moduleName) => fs.existsSync(moduleName)
      });
      return;
    },
    async resolveId(request, importer, options) {
      if (!importer || request.startsWith("\0")) {
        return null;
      }
      const moduleName = handler == null ? void 0 : handler(request, importer);
      if (!moduleName) {
        return this.resolve(request, importer, { skipSelf: true, ...options });
      }
      log(import_typescript_paths.LogLevel.Debug, `${request} -> ${moduleName}`);
      if (!path.extname(moduleName)) {
        return this.resolve(moduleName, importer, { skipSelf: true, ...options });
      }
      return moduleName;
    }
  };
}
var src_default = tsConfigPaths;
export {
  src_default as default
};
