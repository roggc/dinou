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

// node_modules/loader-utils/lib/hash/wasm-hash.js
var require_wasm_hash = __commonJS({
  "node_modules/loader-utils/lib/hash/wasm-hash.js"(exports, module) {
    "use strict";
    var MAX_SHORT_STRING = Math.floor((65536 - 64) / 4) & ~3;
    var WasmHash = class {
      /**
       * @param {WebAssembly.Instance} instance wasm instance
       * @param {WebAssembly.Instance[]} instancesPool pool of instances
       * @param {number} chunkSize size of data chunks passed to wasm
       * @param {number} digestSize size of digest returned by wasm
       */
      constructor(instance, instancesPool, chunkSize, digestSize) {
        const exports2 = (
          /** @type {any} */
          instance.exports
        );
        exports2.init();
        this.exports = exports2;
        this.mem = Buffer.from(exports2.memory.buffer, 0, 65536);
        this.buffered = 0;
        this.instancesPool = instancesPool;
        this.chunkSize = chunkSize;
        this.digestSize = digestSize;
      }
      reset() {
        this.buffered = 0;
        this.exports.init();
      }
      /**
       * @param {Buffer | string} data data
       * @param {BufferEncoding=} encoding encoding
       * @returns {this} itself
       */
      update(data, encoding) {
        if (typeof data === "string") {
          while (data.length > MAX_SHORT_STRING) {
            this._updateWithShortString(data.slice(0, MAX_SHORT_STRING), encoding);
            data = data.slice(MAX_SHORT_STRING);
          }
          this._updateWithShortString(data, encoding);
          return this;
        }
        this._updateWithBuffer(data);
        return this;
      }
      /**
       * @param {string} data data
       * @param {BufferEncoding=} encoding encoding
       * @returns {void}
       */
      _updateWithShortString(data, encoding) {
        const { exports: exports2, buffered, mem, chunkSize } = this;
        let endPos;
        if (data.length < 70) {
          if (!encoding || encoding === "utf-8" || encoding === "utf8") {
            endPos = buffered;
            for (let i = 0; i < data.length; i++) {
              const cc = data.charCodeAt(i);
              if (cc < 128) {
                mem[endPos++] = cc;
              } else if (cc < 2048) {
                mem[endPos] = cc >> 6 | 192;
                mem[endPos + 1] = cc & 63 | 128;
                endPos += 2;
              } else {
                endPos += mem.write(data.slice(i), endPos, encoding);
                break;
              }
            }
          } else if (encoding === "latin1") {
            endPos = buffered;
            for (let i = 0; i < data.length; i++) {
              const cc = data.charCodeAt(i);
              mem[endPos++] = cc;
            }
          } else {
            endPos = buffered + mem.write(data, buffered, encoding);
          }
        } else {
          endPos = buffered + mem.write(data, buffered, encoding);
        }
        if (endPos < chunkSize) {
          this.buffered = endPos;
        } else {
          const l = endPos & ~(this.chunkSize - 1);
          exports2.update(l);
          const newBuffered = endPos - l;
          this.buffered = newBuffered;
          if (newBuffered > 0) {
            mem.copyWithin(0, l, endPos);
          }
        }
      }
      /**
       * @param {Buffer} data data
       * @returns {void}
       */
      _updateWithBuffer(data) {
        const { exports: exports2, buffered, mem } = this;
        const length = data.length;
        if (buffered + length < this.chunkSize) {
          data.copy(mem, buffered, 0, length);
          this.buffered += length;
        } else {
          const l = buffered + length & ~(this.chunkSize - 1);
          if (l > 65536) {
            let i = 65536 - buffered;
            data.copy(mem, buffered, 0, i);
            exports2.update(65536);
            const stop = l - buffered - 65536;
            while (i < stop) {
              data.copy(mem, 0, i, i + 65536);
              exports2.update(65536);
              i += 65536;
            }
            data.copy(mem, 0, i, l - buffered);
            exports2.update(l - buffered - i);
          } else {
            data.copy(mem, buffered, 0, l - buffered);
            exports2.update(l);
          }
          const newBuffered = length + buffered - l;
          this.buffered = newBuffered;
          if (newBuffered > 0) {
            data.copy(mem, 0, length - newBuffered, length);
          }
        }
      }
      digest(type) {
        const { exports: exports2, buffered, mem, digestSize } = this;
        exports2.final(buffered);
        this.instancesPool.push(this);
        const hex = mem.toString("latin1", 0, digestSize);
        if (type === "hex") {
          return hex;
        }
        if (type === "binary" || !type) {
          return Buffer.from(hex, "hex");
        }
        return Buffer.from(hex, "hex").toString(type);
      }
    };
    var create = (wasmModule, instancesPool, chunkSize, digestSize) => {
      if (instancesPool.length > 0) {
        const old = instancesPool.pop();
        old.reset();
        return old;
      } else {
        return new WasmHash(
          new WebAssembly.Instance(wasmModule),
          instancesPool,
          chunkSize,
          digestSize
        );
      }
    };
    module.exports = create;
    module.exports.MAX_SHORT_STRING = MAX_SHORT_STRING;
  }
});

// node_modules/loader-utils/lib/hash/xxhash64.js
var require_xxhash64 = __commonJS({
  "node_modules/loader-utils/lib/hash/xxhash64.js"(exports, module) {
    "use strict";
    var create = require_wasm_hash();
    var xxhash64 = new WebAssembly.Module(
      Buffer.from(
        // 1173 bytes
        "AGFzbQEAAAABCAJgAX8AYAAAAwQDAQAABQMBAAEGGgV+AUIAC34BQgALfgFCAAt+AUIAC34BQgALByIEBGluaXQAAAZ1cGRhdGUAAQVmaW5hbAACBm1lbW9yeQIACrUIAzAAQtbrgu7q/Yn14AAkAELP1tO+0ser2UIkAUIAJAJC+erQ0OfJoeThACQDQgAkBAvUAQIBfwR+IABFBEAPCyMEIACtfCQEIwAhAiMBIQMjAiEEIwMhBQNAIAIgASkDAELP1tO+0ser2UJ+fEIfiUKHla+vmLbem55/fiECIAMgASkDCELP1tO+0ser2UJ+fEIfiUKHla+vmLbem55/fiEDIAQgASkDEELP1tO+0ser2UJ+fEIfiUKHla+vmLbem55/fiEEIAUgASkDGELP1tO+0ser2UJ+fEIfiUKHla+vmLbem55/fiEFIAAgAUEgaiIBSw0ACyACJAAgAyQBIAQkAiAFJAMLqwYCAX8EfiMEQgBSBH4jACICQgGJIwEiA0IHiXwjAiIEQgyJfCMDIgVCEol8IAJCz9bTvtLHq9lCfkIfiUKHla+vmLbem55/foVCh5Wvr5i23puef35CnaO16oOxjYr6AH0gA0LP1tO+0ser2UJ+Qh+JQoeVr6+Ytt6bnn9+hUKHla+vmLbem55/fkKdo7Xqg7GNivoAfSAEQs/W077Sx6vZQn5CH4lCh5Wvr5i23puef36FQoeVr6+Ytt6bnn9+Qp2jteqDsY2K+gB9IAVCz9bTvtLHq9lCfkIfiUKHla+vmLbem55/foVCh5Wvr5i23puef35CnaO16oOxjYr6AH0FQsXP2bLx5brqJwsjBCAArXx8IQIDQCABQQhqIABNBEAgAiABKQMAQs/W077Sx6vZQn5CH4lCh5Wvr5i23puef36FQhuJQoeVr6+Ytt6bnn9+Qp2jteqDsY2K+gB9IQIgAUEIaiEBDAELCyABQQRqIABNBEACfyACIAE1AgBCh5Wvr5i23puef36FQheJQs/W077Sx6vZQn5C+fPd8Zn2masWfCECIAFBBGoLIQELA0AgACABRwRAIAIgATEAAELFz9my8eW66id+hUILiUKHla+vmLbem55/fiECIAFBAWohAQwBCwtBACACIAJCIYiFQs/W077Sx6vZQn4iAiACQh2IhUL5893xmfaZqxZ+IgIgAkIgiIUiAkIgiCIDQv//A4NCIIYgA0KAgPz/D4NCEIiEIgNC/4GAgPAfg0IQhiADQoD+g4CA4D+DQgiIhCIDQo+AvIDwgcAHg0IIhiADQvCBwIeAnoD4AINCBIiEIgNChoyYsODAgYMGfEIEiEKBgoSIkKDAgAGDQid+IANCsODAgYOGjJgwhHw3AwBBCCACQv////8PgyICQv//A4NCIIYgAkKAgPz/D4NCEIiEIgJC/4GAgPAfg0IQhiACQoD+g4CA4D+DQgiIhCICQo+AvIDwgcAHg0IIhiACQvCBwIeAnoD4AINCBIiEIgJChoyYsODAgYMGfEIEiEKBgoSIkKDAgAGDQid+IAJCsODAgYOGjJgwhHw3AwAL",
        "base64"
      )
    );
    module.exports = create.bind(null, xxhash64, [], 32, 16);
  }
});

// node_modules/loader-utils/lib/hash/BatchedHash.js
var require_BatchedHash = __commonJS({
  "node_modules/loader-utils/lib/hash/BatchedHash.js"(exports, module) {
    var MAX_SHORT_STRING = require_wasm_hash().MAX_SHORT_STRING;
    var BatchedHash = class {
      constructor(hash) {
        this.string = void 0;
        this.encoding = void 0;
        this.hash = hash;
      }
      /**
       * Update hash {@link https://nodejs.org/api/crypto.html#crypto_hash_update_data_inputencoding}
       * @param {string|Buffer} data data
       * @param {string=} inputEncoding data encoding
       * @returns {this} updated hash
       */
      update(data, inputEncoding) {
        if (this.string !== void 0) {
          if (typeof data === "string" && inputEncoding === this.encoding && this.string.length + data.length < MAX_SHORT_STRING) {
            this.string += data;
            return this;
          }
          this.hash.update(this.string, this.encoding);
          this.string = void 0;
        }
        if (typeof data === "string") {
          if (data.length < MAX_SHORT_STRING && // base64 encoding is not valid since it may contain padding chars
          (!inputEncoding || !inputEncoding.startsWith("ba"))) {
            this.string = data;
            this.encoding = inputEncoding;
          } else {
            this.hash.update(data, inputEncoding);
          }
        } else {
          this.hash.update(data);
        }
        return this;
      }
      /**
       * Calculates the digest {@link https://nodejs.org/api/crypto.html#crypto_hash_digest_encoding}
       * @param {string=} encoding encoding of the return value
       * @returns {string|Buffer} digest
       */
      digest(encoding) {
        if (this.string !== void 0) {
          this.hash.update(this.string, this.encoding);
        }
        return this.hash.digest(encoding);
      }
    };
    module.exports = BatchedHash;
  }
});

// node_modules/loader-utils/lib/hash/md4.js
var require_md4 = __commonJS({
  "node_modules/loader-utils/lib/hash/md4.js"(exports, module) {
    "use strict";
    var create = require_wasm_hash();
    var md4 = new WebAssembly.Module(
      Buffer.from(
        // 2150 bytes
        "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",
        "base64"
      )
    );
    module.exports = create.bind(null, md4, [], 64, 32);
  }
});

// node_modules/loader-utils/lib/hash/BulkUpdateDecorator.js
var require_BulkUpdateDecorator = __commonJS({
  "node_modules/loader-utils/lib/hash/BulkUpdateDecorator.js"(exports, module) {
    var BULK_SIZE = 2e3;
    var digestCaches = {};
    var BulkUpdateDecorator = class {
      /**
       * @param {Hash | function(): Hash} hashOrFactory function to create a hash
       * @param {string=} hashKey key for caching
       */
      constructor(hashOrFactory, hashKey) {
        this.hashKey = hashKey;
        if (typeof hashOrFactory === "function") {
          this.hashFactory = hashOrFactory;
          this.hash = void 0;
        } else {
          this.hashFactory = void 0;
          this.hash = hashOrFactory;
        }
        this.buffer = "";
      }
      /**
       * Update hash {@link https://nodejs.org/api/crypto.html#crypto_hash_update_data_inputencoding}
       * @param {string|Buffer} data data
       * @param {string=} inputEncoding data encoding
       * @returns {this} updated hash
       */
      update(data, inputEncoding) {
        if (inputEncoding !== void 0 || typeof data !== "string" || data.length > BULK_SIZE) {
          if (this.hash === void 0) {
            this.hash = this.hashFactory();
          }
          if (this.buffer.length > 0) {
            this.hash.update(this.buffer);
            this.buffer = "";
          }
          this.hash.update(data, inputEncoding);
        } else {
          this.buffer += data;
          if (this.buffer.length > BULK_SIZE) {
            if (this.hash === void 0) {
              this.hash = this.hashFactory();
            }
            this.hash.update(this.buffer);
            this.buffer = "";
          }
        }
        return this;
      }
      /**
       * Calculates the digest {@link https://nodejs.org/api/crypto.html#crypto_hash_digest_encoding}
       * @param {string=} encoding encoding of the return value
       * @returns {string|Buffer} digest
       */
      digest(encoding) {
        let digestCache;
        const buffer = this.buffer;
        if (this.hash === void 0) {
          const cacheKey = `${this.hashKey}-${encoding}`;
          digestCache = digestCaches[cacheKey];
          if (digestCache === void 0) {
            digestCache = digestCaches[cacheKey] = /* @__PURE__ */ new Map();
          }
          const cacheEntry = digestCache.get(buffer);
          if (cacheEntry !== void 0) {
            return cacheEntry;
          }
          this.hash = this.hashFactory();
        }
        if (buffer.length > 0) {
          this.hash.update(buffer);
        }
        const digestResult = this.hash.digest(encoding);
        if (digestCache !== void 0) {
          digestCache.set(buffer, digestResult);
        }
        return digestResult;
      }
    };
    module.exports = BulkUpdateDecorator;
  }
});

// node_modules/loader-utils/lib/getHashDigest.js
var require_getHashDigest = __commonJS({
  "node_modules/loader-utils/lib/getHashDigest.js"(exports, module) {
    "use strict";
    var baseEncodeTables = {
      26: "abcdefghijklmnopqrstuvwxyz",
      32: "123456789abcdefghjkmnpqrstuvwxyz",
      // no 0lio
      36: "0123456789abcdefghijklmnopqrstuvwxyz",
      49: "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ",
      // no lIO
      52: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      58: "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ",
      // no 0lIO
      62: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      64: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_"
    };
    function divmod32(uint32Array, divisor) {
      let carry = 0;
      for (let i = uint32Array.length - 1; i >= 0; i--) {
        const value = carry * 4294967296 + uint32Array[i];
        carry = value % divisor;
        uint32Array[i] = Math.floor(value / divisor);
      }
      return carry;
    }
    function encodeBufferToBase(buffer, base, length) {
      const encodeTable = baseEncodeTables[base];
      if (!encodeTable) {
        throw new Error("Unknown encoding base" + base);
      }
      const limit = Math.ceil(buffer.length * 8 / Math.log2(base));
      length = Math.min(length, limit);
      const uint32Array = new Uint32Array(Math.ceil(buffer.length / 4));
      buffer.copy(Buffer.from(uint32Array.buffer));
      let output = "";
      for (let i = 0; i < length; i++) {
        output = encodeTable[divmod32(uint32Array, base)] + output;
      }
      return output;
    }
    var crypto = void 0;
    var createXXHash64 = void 0;
    var createMd4 = void 0;
    var BatchedHash = void 0;
    var BulkUpdateDecorator = void 0;
    function getHashDigest(buffer, algorithm, digestType, maxLength) {
      algorithm = algorithm || "xxhash64";
      maxLength = maxLength || 9999;
      let hash;
      if (algorithm === "xxhash64") {
        if (createXXHash64 === void 0) {
          createXXHash64 = require_xxhash64();
          if (BatchedHash === void 0) {
            BatchedHash = require_BatchedHash();
          }
        }
        hash = new BatchedHash(createXXHash64());
      } else if (algorithm === "md4") {
        if (createMd4 === void 0) {
          createMd4 = require_md4();
          if (BatchedHash === void 0) {
            BatchedHash = require_BatchedHash();
          }
        }
        hash = new BatchedHash(createMd4());
      } else if (algorithm === "native-md4") {
        if (typeof crypto === "undefined") {
          crypto = __require("crypto");
          if (BulkUpdateDecorator === void 0) {
            BulkUpdateDecorator = require_BulkUpdateDecorator();
          }
        }
        hash = new BulkUpdateDecorator(() => crypto.createHash("md4"), "md4");
      } else {
        if (typeof crypto === "undefined") {
          crypto = __require("crypto");
          if (BulkUpdateDecorator === void 0) {
            BulkUpdateDecorator = require_BulkUpdateDecorator();
          }
        }
        hash = new BulkUpdateDecorator(
          () => crypto.createHash(algorithm),
          algorithm
        );
      }
      hash.update(buffer);
      if (digestType === "base26" || digestType === "base32" || digestType === "base36" || digestType === "base49" || digestType === "base52" || digestType === "base58" || digestType === "base62" || digestType === "base64safe") {
        return encodeBufferToBase(
          hash.digest(),
          digestType === "base64safe" ? 64 : digestType.substr(4),
          maxLength
        );
      }
      return hash.digest(digestType || "hex").substr(0, maxLength);
    }
    module.exports = getHashDigest;
  }
});

// node_modules/loader-utils/lib/interpolateName.js
var require_interpolateName = __commonJS({
  "node_modules/loader-utils/lib/interpolateName.js"(exports, module) {
    "use strict";
    var path = __require("path");
    var getHashDigest = require_getHashDigest();
    function interpolateName(loaderContext, name, options = {}) {
      let filename;
      const hasQuery = loaderContext.resourceQuery && loaderContext.resourceQuery.length > 1;
      if (typeof name === "function") {
        filename = name(
          loaderContext.resourcePath,
          hasQuery ? loaderContext.resourceQuery : void 0
        );
      } else {
        filename = name || "[hash].[ext]";
      }
      const context = options.context;
      const content = options.content;
      const regExp = options.regExp;
      let ext = "bin";
      let basename = "file";
      let directory = "";
      let folder = "";
      let query = "";
      if (loaderContext.resourcePath) {
        const parsed = path.parse(loaderContext.resourcePath);
        let resourcePath = loaderContext.resourcePath;
        if (parsed.ext) {
          ext = parsed.ext.substr(1);
        }
        if (parsed.dir) {
          basename = parsed.name;
          resourcePath = parsed.dir + path.sep;
        }
        if (typeof context !== "undefined") {
          directory = path.relative(context, resourcePath + "_").replace(/\\/g, "/").replace(/\.\.(\/)?/g, "_$1");
          directory = directory.substr(0, directory.length - 1);
        } else {
          directory = resourcePath.replace(/\\/g, "/").replace(/\.\.(\/)?/g, "_$1");
        }
        if (directory.length <= 1) {
          directory = "";
        } else {
          folder = path.basename(directory);
        }
      }
      if (loaderContext.resourceQuery && loaderContext.resourceQuery.length > 1) {
        query = loaderContext.resourceQuery;
        const hashIdx = query.indexOf("#");
        if (hashIdx >= 0) {
          query = query.substr(0, hashIdx);
        }
      }
      let url = filename;
      if (content) {
        url = url.replace(
          /\[(?:([^[:\]]+):)?(?:hash|contenthash)(?::([a-z]+\d*(?:safe)?))?(?::(\d+))?\]/gi,
          (all, hashType, digestType, maxLength) => getHashDigest(content, hashType, digestType, parseInt(maxLength, 10))
        );
      }
      url = url.replace(/\[ext\]/gi, () => ext).replace(/\[name\]/gi, () => basename).replace(/\[path\]/gi, () => directory).replace(/\[folder\]/gi, () => folder).replace(/\[query\]/gi, () => query);
      if (regExp && loaderContext.resourcePath) {
        const match = loaderContext.resourcePath.match(new RegExp(regExp));
        match && match.forEach((matched, i) => {
          url = url.replace(new RegExp("\\[" + i + "\\]", "ig"), matched);
        });
      }
      if (typeof loaderContext.options === "object" && typeof loaderContext.options.customInterpolateName === "function") {
        url = loaderContext.options.customInterpolateName.call(
          loaderContext,
          url,
          name,
          options
        );
      }
      return url;
    }
    module.exports = interpolateName;
  }
});

// node_modules/generic-names/index.js
var require_generic_names = __commonJS({
  "node_modules/generic-names/index.js"(exports, module) {
    var interpolateName = require_interpolateName();
    var path = __require("path");
    module.exports = function createGenerator(pattern, options) {
      options = options || {};
      var context = options && typeof options.context === "string" ? options.context : process.cwd();
      var hashPrefix = options && typeof options.hashPrefix === "string" ? options.hashPrefix : "";
      return function generate(localName, filepath) {
        var name = pattern.replace(/\[local\]/gi, localName);
        var loaderContext = {
          resourcePath: filepath
        };
        var loaderOptions = {
          content: hashPrefix + path.relative(context, filepath).replace(/\\/g, "/") + "\0" + localName,
          context
        };
        var genericName = interpolateName(loaderContext, name, loaderOptions);
        return genericName.replace(new RegExp("[^a-zA-Z0-9\\-_\xA0-\uFFFF]", "g"), "-").replace(/^((-?[0-9])|--)/, "_$1");
      };
    };
  }
});
export default require_generic_names();
