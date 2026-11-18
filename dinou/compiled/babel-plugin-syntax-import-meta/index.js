import { createRequire as __dinou_createRequire } from "node:module";
import { fileURLToPath as __dinou_fileURLToPath } from "node:url";
import __dinou_path from "node:path";
const require = __dinou_createRequire(import.meta.url);
const __filename = __dinou_fileURLToPath(import.meta.url);
const __dirname = __dinou_path.dirname(__filename);
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/@babel/helper-plugin-utils/lib/index.js
var require_lib = __commonJS({
  "node_modules/@babel/helper-plugin-utils/lib/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.declare = declare;
    exports.declarePreset = void 0;
    var apiPolyfills = {
      assertVersion: (api) => (range) => {
        throwVersionError(range, api.version);
      }
    };
    Object.assign(apiPolyfills, {
      targets: () => () => {
        return {};
      },
      assumption: () => () => {
        return void 0;
      },
      addExternalDependency: () => () => {
      }
    });
    function declare(builder) {
      return (api, options, dirname) => {
        let clonedApi;
        for (const name of Object.keys(apiPolyfills)) {
          if (api[name]) continue;
          clonedApi != null ? clonedApi : clonedApi = copyApiObject(api);
          clonedApi[name] = apiPolyfills[name](clonedApi);
        }
        return builder(clonedApi != null ? clonedApi : api, options || {}, dirname);
      };
    }
    var declarePreset = exports.declarePreset = declare;
    function copyApiObject(api) {
      let proto = null;
      if (typeof api.version === "string" && api.version.startsWith("7.")) {
        proto = Object.getPrototypeOf(api);
        if (proto && (!hasOwnProperty.call(proto, "version") || !hasOwnProperty.call(proto, "transform") || !hasOwnProperty.call(proto, "template") || !hasOwnProperty.call(proto, "types"))) {
          proto = null;
        }
      }
      return Object.assign({}, proto, api);
    }
    function throwVersionError(range, version) {
      if (typeof range === "number") {
        if (!Number.isInteger(range)) {
          throw new Error("Expected string or integer value.");
        }
        range = `^${range}.0.0-0`;
      }
      if (typeof range !== "string") {
        throw new Error("Expected string or integer value.");
      }
      const limit = Error.stackTraceLimit;
      if (typeof limit === "number" && limit < 25) {
        Error.stackTraceLimit = 25;
      }
      let err;
      if (version.startsWith("7.")) {
        err = new Error(`Requires Babel "^7.0.0-beta.41", but was loaded with "${version}". You'll need to update your @babel/core version.`);
      } else {
        err = new Error(`Requires Babel "${range}", but was loaded with "${version}". If you are sure you have a compatible version of @babel/core, it is likely that something in your build process is loading the wrong version. Inspect the stack trace of this error to look for the first entry that doesn't mention "@babel/core" or "babel-core" to see what is calling Babel.`);
      }
      if (typeof limit === "number") {
        Error.stackTraceLimit = limit;
      }
      throw Object.assign(err, {
        code: "BABEL_VERSION_UNSUPPORTED",
        version,
        range
      });
    }
  }
});

// node_modules/@babel/plugin-syntax-import-meta/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/@babel/plugin-syntax-import-meta/lib/index.js"(exports) {
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    var _helperPluginUtils = require_lib();
    var _default = (0, _helperPluginUtils.declare)((api) => {
      api.assertVersion(7);
      return {
        name: "syntax-import-meta",
        manipulateOptions(opts, parserOpts) {
          parserOpts.plugins.push("importMeta");
        }
      };
    });
    exports.default = _default;
  }
});
export default require_lib2();
