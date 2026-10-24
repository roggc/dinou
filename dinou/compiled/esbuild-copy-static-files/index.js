import { createRequire as __dinou_createRequire } from "node:module";
import { fileURLToPath as __dinou_fileURLToPath } from "node:url";
import __dinou_path from "node:path";
const require = __dinou_createRequire(import.meta.url);
const __filename = __dinou_fileURLToPath(import.meta.url);
const __dirname = __dinou_path.dirname(__filename);
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// ../node_modules/esbuild-copy-static-files/index.js
var require_esbuild_copy_static_files = __commonJS({
  "../node_modules/esbuild-copy-static-files/index.js"(exports, module) {
    var crypto = __require("crypto");
    var fs = __require("fs");
    var getDigest = (string) => {
      const hash = crypto.createHash("md5");
      const data = hash.update(string, "utf-8");
      return data.digest("hex");
    };
    var getFileDigest = (path) => {
      if (!fs.existsSync(path)) {
        return null;
      }
      if (fs.statSync(path).isDirectory()) {
        return null;
      }
      return getDigest(fs.readFileSync(path));
    };
    function filter(src, dest) {
      if (!fs.existsSync(dest)) {
        return true;
      }
      if (fs.statSync(dest).isDirectory()) {
        return true;
      }
      return getFileDigest(src) !== getFileDigest(dest);
    }
    module.exports = (options = {}) => ({
      name: "copy-static-files",
      setup(build) {
        let src = options.src || "./static";
        let dest = options.dest || "../public";
        build.onEnd(() => fs.cpSync(src, dest, {
          dereference: options.dereference || true,
          errorOnExist: options.errorOnExist || false,
          filter: options.filter || filter,
          force: options.force || true,
          preserveTimestamps: options.preserveTimestamps || true,
          recursive: options.recursive || true
        }));
      }
    });
  }
});
export default require_esbuild_copy_static_files();
