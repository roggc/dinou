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

// node_modules/tapable/lib/Hook.js
var require_Hook = __commonJS({
  "node_modules/tapable/lib/Hook.js"(exports, module) {
    "use strict";
    var util = __require("util");
    var deprecateContext = util.deprecate(
      () => {
      },
      "Hook.context is deprecated and will be removed"
    );
    function CALL_DELEGATE(...args) {
      this.call = this._createCall("sync");
      return this.call(...args);
    }
    function CALL_ASYNC_DELEGATE(...args) {
      this.callAsync = this._createCall("async");
      return this.callAsync(...args);
    }
    function PROMISE_DELEGATE(...args) {
      this.promise = this._createCall("promise");
      return this.promise(...args);
    }
    var Hook = class {
      constructor(args = [], name = void 0) {
        this._args = args;
        this.name = name;
        this.taps = [];
        this.interceptors = [];
        this._call = CALL_DELEGATE;
        this.call = CALL_DELEGATE;
        this._callAsync = CALL_ASYNC_DELEGATE;
        this.callAsync = CALL_ASYNC_DELEGATE;
        this._promise = PROMISE_DELEGATE;
        this.promise = PROMISE_DELEGATE;
        this._x = void 0;
        this.compile = this.compile;
        this.tap = this.tap;
        this.tapAsync = this.tapAsync;
        this.tapPromise = this.tapPromise;
      }
      compile(_options) {
        throw new Error("Abstract: should be overridden");
      }
      _createCall(type) {
        return this.compile({
          taps: this.taps,
          interceptors: this.interceptors,
          args: this._args,
          type
        });
      }
      _tap(type, options, fn) {
        if (typeof options === "string") {
          const name = options.trim();
          if (name === "") {
            throw new Error("Missing name for tap");
          }
          options = { type, fn, name };
        } else {
          if (typeof options !== "object" || options === null) {
            throw new Error("Invalid tap options");
          }
          let { name } = options;
          if (typeof name === "string") {
            name = name.trim();
          }
          if (typeof name !== "string" || name === "") {
            throw new Error("Missing name for tap");
          }
          if (typeof options.context !== "undefined") {
            deprecateContext();
          }
          let onlyName = true;
          for (const key in options) {
            if (key !== "name") {
              onlyName = false;
              break;
            }
          }
          if (onlyName) {
            options = { type, fn, name };
          } else {
            options.name = name;
            options = Object.assign({ type, fn }, options);
          }
        }
        options = this._runRegisterInterceptors(options);
        this._insert(options);
      }
      tap(options, fn) {
        this._tap("sync", options, fn);
      }
      tapAsync(options, fn) {
        this._tap("async", options, fn);
      }
      tapPromise(options, fn) {
        this._tap("promise", options, fn);
      }
      _runRegisterInterceptors(options) {
        const { interceptors } = this;
        const { length } = interceptors;
        if (length === 0) return options;
        for (let i = 0; i < length; i++) {
          const interceptor = interceptors[i];
          if (interceptor.register) {
            const newOptions = interceptor.register(options);
            if (newOptions !== void 0) {
              options = newOptions;
            }
          }
        }
        return options;
      }
      withOptions(options) {
        const mergeOptions = (opt) => Object.assign({}, options, typeof opt === "string" ? { name: opt } : opt);
        return {
          name: this.name,
          tap: (opt, fn) => this.tap(mergeOptions(opt), fn),
          tapAsync: (opt, fn) => this.tapAsync(mergeOptions(opt), fn),
          tapPromise: (opt, fn) => this.tapPromise(mergeOptions(opt), fn),
          intercept: (interceptor) => this.intercept(interceptor),
          isUsed: () => this.isUsed(),
          withOptions: (opt) => this.withOptions(mergeOptions(opt))
        };
      }
      isUsed() {
        return this.taps.length > 0 || this.interceptors.length > 0;
      }
      intercept(interceptor) {
        this._resetCompilation();
        this.interceptors.push(Object.assign({}, interceptor));
        if (interceptor.register) {
          for (let i = 0; i < this.taps.length; i++) {
            this.taps[i] = interceptor.register(this.taps[i]);
          }
        }
      }
      _resetCompilation() {
        this.call = this._call;
        this.callAsync = this._callAsync;
        this.promise = this._promise;
      }
      _insert(item) {
        this._resetCompilation();
        const { taps } = this;
        const stage = typeof item.stage === "number" ? item.stage : 0;
        if (!(typeof item.before === "string" || Array.isArray(item.before))) {
          const n = taps.length;
          if (n === 0 || (taps[n - 1].stage || 0) <= stage) {
            taps[n] = item;
            return;
          }
        }
        let before;
        if (typeof item.before === "string") {
          before = /* @__PURE__ */ new Set([item.before]);
        } else if (Array.isArray(item.before)) {
          before = new Set(item.before);
        }
        let i = taps.length;
        while (i > 0) {
          i--;
          const tap = taps[i];
          taps[i + 1] = tap;
          const xStage = tap.stage || 0;
          if (before) {
            if (before.has(tap.name)) {
              before.delete(tap.name);
              continue;
            }
            if (before.size > 0) {
              continue;
            }
          }
          if (xStage > stage) {
            continue;
          }
          i++;
          break;
        }
        taps[i] = item;
      }
    };
    Object.setPrototypeOf(Hook.prototype, null);
    module.exports = Hook;
  }
});

// node_modules/tapable/lib/HookCodeFactory.js
var require_HookCodeFactory = __commonJS({
  "node_modules/tapable/lib/HookCodeFactory.js"(exports, module) {
    "use strict";
    var HookCodeFactory = class {
      constructor(config) {
        this.config = config;
        this.options = void 0;
        this._args = void 0;
      }
      create(options) {
        this.init(options);
        let fn;
        switch (options.type) {
          case "sync":
            fn = new Function(
              this.args(),
              `"use strict";
${this.header()}${this.contentWithInterceptors({
                onError: (err) => `throw ${err};
`,
                onResult: (result) => `return ${result};
`,
                resultReturns: true,
                onDone: () => "",
                rethrowIfPossible: true
              })}`
            );
            break;
          case "async":
            fn = new Function(
              this.args({
                after: "_callback"
              }),
              `"use strict";
${this.header()}${this.contentWithInterceptors({
                onError: (err) => `_callback(${err});
`,
                onResult: (result) => `_callback(null, ${result});
`,
                onDone: () => "_callback();\n"
              })}`
            );
            break;
          case "promise": {
            let errorHelperUsed = false;
            const content = this.contentWithInterceptors({
              onError: (err) => {
                errorHelperUsed = true;
                return `_error(${err});
`;
              },
              onResult: (result) => `_resolve(${result});
`,
              onDone: () => "_resolve();\n"
            });
            let code = "";
            code += '"use strict";\n';
            code += this.header();
            code += "return new Promise((function(_resolve, _reject) {\n";
            if (errorHelperUsed) {
              code += "var _sync = true;\n";
              code += "function _error(_err) {\n";
              code += "if(_sync)\n";
              code += "_resolve(Promise.resolve().then((function() { throw _err; })));\n";
              code += "else\n";
              code += "_reject(_err);\n";
              code += "};\n";
            }
            code += content;
            if (errorHelperUsed) {
              code += "_sync = false;\n";
            }
            code += "}));\n";
            fn = new Function(this.args(), code);
            break;
          }
        }
        this.deinit();
        return fn;
      }
      setup(instance, options) {
        const { taps } = options;
        const { length } = taps;
        const fns = Array.from({ length });
        for (let i = 0; i < length; i++) {
          fns[i] = taps[i].fn;
        }
        instance._x = fns;
      }
      /**
       * @param {{ type: "sync" | "promise" | "async", taps: Array<Tap>, interceptors: Array<Interceptor> }} options
       */
      init(options) {
        this.options = options;
        this._args = options.args;
        this._joinedArgs = void 0;
      }
      deinit() {
        this.options = void 0;
        this._args = void 0;
        this._joinedArgs = void 0;
      }
      contentWithInterceptors(options) {
        if (this.options.interceptors.length > 0) {
          const { onError, onResult, onDone } = options;
          let code = "";
          for (let i = 0; i < this.options.interceptors.length; i++) {
            const interceptor = this.options.interceptors[i];
            if (interceptor.call) {
              code += `${this.getInterceptor(i)}.call(${this.args({
                before: interceptor.context ? "_context" : void 0
              })});
`;
            }
          }
          code += this.content(
            Object.assign(options, {
              onError: onError && ((err) => {
                let code2 = "";
                for (let i = 0; i < this.options.interceptors.length; i++) {
                  const interceptor = this.options.interceptors[i];
                  if (interceptor.error) {
                    code2 += `${this.getInterceptor(i)}.error(${err});
`;
                  }
                }
                code2 += onError(err);
                return code2;
              }),
              onResult: onResult && ((result) => {
                let code2 = "";
                for (let i = 0; i < this.options.interceptors.length; i++) {
                  const interceptor = this.options.interceptors[i];
                  if (interceptor.result) {
                    code2 += `${this.getInterceptor(i)}.result(${result});
`;
                  }
                }
                code2 += onResult(result);
                return code2;
              }),
              onDone: onDone && (() => {
                let code2 = "";
                for (let i = 0; i < this.options.interceptors.length; i++) {
                  const interceptor = this.options.interceptors[i];
                  if (interceptor.done) {
                    code2 += `${this.getInterceptor(i)}.done();
`;
                  }
                }
                code2 += onDone();
                return code2;
              })
            })
          );
          return code;
        }
        return this.content(options);
      }
      header() {
        let code = "";
        code += this.needContext() ? "var _context = {};\n" : "var _context;\n";
        code += "var _x = this._x;\n";
        if (this.options.interceptors.length > 0) {
          code += "var _taps = this.taps;\n";
          code += "var _interceptors = this.interceptors;\n";
        }
        return code;
      }
      needContext() {
        const { taps } = this.options;
        for (let i = 0; i < taps.length; i++) {
          if (taps[i].context) return true;
        }
        return false;
      }
      callTap(tapIndex, { onError, onResult, onDone, rethrowIfPossible }) {
        let code = "";
        let hasTapCached = false;
        for (let i = 0; i < this.options.interceptors.length; i++) {
          const interceptor = this.options.interceptors[i];
          if (interceptor.tap) {
            if (!hasTapCached) {
              code += `var _tap${tapIndex} = ${this.getTap(tapIndex)};
`;
              hasTapCached = true;
            }
            code += `${this.getInterceptor(i)}.tap(${interceptor.context ? "_context, " : ""}_tap${tapIndex});
`;
          }
        }
        code += `var _fn${tapIndex} = ${this.getTapFn(tapIndex)};
`;
        const tap = this.options.taps[tapIndex];
        switch (tap.type) {
          case "sync":
            if (!rethrowIfPossible) {
              code += `var _hasError${tapIndex} = false;
`;
              code += "try {\n";
            }
            if (onResult) {
              code += `var _result${tapIndex} = _fn${tapIndex}(${this.args({
                before: tap.context ? "_context" : void 0
              })});
`;
            } else {
              code += `_fn${tapIndex}(${this.args({
                before: tap.context ? "_context" : void 0
              })});
`;
            }
            if (!rethrowIfPossible) {
              code += "} catch(_err) {\n";
              code += `_hasError${tapIndex} = true;
`;
              code += onError("_err");
              code += "}\n";
              code += `if(!_hasError${tapIndex}) {
`;
            }
            if (onResult) {
              code += onResult(`_result${tapIndex}`);
            }
            if (onDone) {
              code += onDone();
            }
            if (!rethrowIfPossible) {
              code += "}\n";
            }
            break;
          case "async": {
            let cbCode = "";
            cbCode += onResult ? `(function(_err${tapIndex}, _result${tapIndex}) {
` : `(function(_err${tapIndex}) {
`;
            cbCode += `if(_err${tapIndex}) {
`;
            cbCode += onError(`_err${tapIndex}`);
            cbCode += "} else {\n";
            if (onResult) {
              cbCode += onResult(`_result${tapIndex}`);
            }
            if (onDone) {
              cbCode += onDone();
            }
            cbCode += "}\n";
            cbCode += "})";
            code += `_fn${tapIndex}(${this.args({
              before: tap.context ? "_context" : void 0,
              after: cbCode
            })});
`;
            break;
          }
          case "promise":
            code += `var _hasResult${tapIndex} = false;
`;
            code += `var _promise${tapIndex} = _fn${tapIndex}(${this.args({
              before: tap.context ? "_context" : void 0
            })});
`;
            code += `if (!_promise${tapIndex} || !_promise${tapIndex}.then)
`;
            code += `  throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise${tapIndex} + ')');
`;
            code += `_promise${tapIndex}.then((function(_result${tapIndex}) {
`;
            code += `_hasResult${tapIndex} = true;
`;
            if (onResult) {
              code += onResult(`_result${tapIndex}`);
            }
            if (onDone) {
              code += onDone();
            }
            code += `}), function(_err${tapIndex}) {
`;
            code += `if(_hasResult${tapIndex}) throw _err${tapIndex};
`;
            code += onError(
              `!_err${tapIndex} ? new Error('Tap function (tapPromise) rejects "' + _err${tapIndex} + '" value') : _err${tapIndex}`
            );
            code += "});\n";
            break;
        }
        return code;
      }
      callTapsSeries({
        onError,
        onResult,
        resultReturns,
        onDone,
        doneReturns,
        rethrowIfPossible
      }) {
        const { taps } = this.options;
        const tapsLength = taps.length;
        if (tapsLength === 0) return onDone();
        let firstAsync = -1;
        for (let i = 0; i < tapsLength; i++) {
          if (taps[i].type !== "sync") {
            firstAsync = i;
            break;
          }
        }
        const somethingReturns = resultReturns || doneReturns;
        const doneBreak = (skipDone) => {
          if (skipDone) return "";
          return onDone();
        };
        let code = "";
        let current = onDone;
        let unrollCounter = 0;
        for (let j = tapsLength - 1; j >= 0; j--) {
          const i = j;
          const unroll = current !== onDone && (taps[i].type !== "sync" || unrollCounter++ > 20);
          if (unroll) {
            unrollCounter = 0;
            code += `function _next${i}() {
`;
            code += current();
            code += "}\n";
            current = () => `${somethingReturns ? "return " : ""}_next${i}();
`;
          }
          const done = current;
          const content = this.callTap(i, {
            onError: (error) => onError(i, error, done, doneBreak),
            onResult: onResult && ((result) => onResult(i, result, done, doneBreak)),
            onDone: !onResult && done,
            rethrowIfPossible: rethrowIfPossible && (firstAsync < 0 || i < firstAsync)
          });
          current = () => content;
        }
        code += current();
        return code;
      }
      callTapsLooping({ onError, onDone, rethrowIfPossible }) {
        if (this.options.taps.length === 0) return onDone();
        const syncOnly = this.options.taps.every((t) => t.type === "sync");
        let code = "";
        if (!syncOnly) {
          code += "var _looper = (function() {\n";
          code += "var _loopAsync = false;\n";
        }
        code += "var _loop;\n";
        code += "do {\n";
        code += "_loop = false;\n";
        for (let i = 0; i < this.options.interceptors.length; i++) {
          const interceptor = this.options.interceptors[i];
          if (interceptor.loop) {
            code += `${this.getInterceptor(i)}.loop(${this.args({
              before: interceptor.context ? "_context" : void 0
            })});
`;
          }
        }
        code += this.callTapsSeries({
          onError,
          onResult: (i, result, next, doneBreak) => {
            let code2 = "";
            code2 += `if(${result} !== undefined) {
`;
            code2 += "_loop = true;\n";
            if (!syncOnly) code2 += "if(_loopAsync) _looper();\n";
            code2 += doneBreak(true);
            code2 += "} else {\n";
            code2 += next();
            code2 += "}\n";
            return code2;
          },
          onDone: onDone && (() => {
            let code2 = "";
            code2 += "if(!_loop) {\n";
            code2 += onDone();
            code2 += "}\n";
            return code2;
          }),
          rethrowIfPossible: rethrowIfPossible && syncOnly
        });
        code += "} while(_loop);\n";
        if (!syncOnly) {
          code += "_loopAsync = true;\n";
          code += "});\n";
          code += "_looper();\n";
        }
        return code;
      }
      callTapsParallel({
        onError,
        onResult,
        onDone,
        rethrowIfPossible,
        onTap = (i, run) => run()
      }) {
        const { taps } = this.options;
        const tapsLength = taps.length;
        if (tapsLength <= 1) {
          return this.callTapsSeries({
            onError,
            onResult,
            onDone,
            rethrowIfPossible
          });
        }
        const done = () => {
          if (onDone) return "if(--_counter === 0) _done();\n";
          return "--_counter;";
        };
        const doneBreak = (skipDone) => {
          if (skipDone || !onDone) return "_counter = 0;\n";
          return "_counter = 0;\n_done();\n";
        };
        let code = "";
        code += "do {\n";
        code += `var _counter = ${tapsLength};
`;
        if (onDone) {
          code += "var _done = (function() {\n";
          code += onDone();
          code += "});\n";
        }
        for (let i = 0; i < tapsLength; i++) {
          code += "if(_counter <= 0) break;\n";
          code += onTap(
            i,
            () => this.callTap(i, {
              onError: (error) => {
                let code2 = "";
                code2 += "if(_counter > 0) {\n";
                code2 += onError(i, error, done, doneBreak);
                code2 += "}\n";
                return code2;
              },
              onResult: onResult && ((result) => {
                let code2 = "";
                code2 += "if(_counter > 0) {\n";
                code2 += onResult(i, result, done, doneBreak);
                code2 += "}\n";
                return code2;
              }),
              onDone: !onResult && (() => done()),
              rethrowIfPossible
            }),
            done,
            doneBreak
          );
        }
        code += "} while(false);\n";
        return code;
      }
      args({ before, after } = {}) {
        let joined = this._joinedArgs;
        if (joined === void 0) {
          joined = this._args.length === 0 ? "" : this._args.join(", ");
          this._joinedArgs = joined;
        }
        if (!before && !after) return joined;
        if (joined.length === 0) {
          if (before && after) return `${before}, ${after}`;
          return before || after;
        }
        if (before && after) return `${before}, ${joined}, ${after}`;
        if (before) return `${before}, ${joined}`;
        return `${joined}, ${after}`;
      }
      getTapFn(idx) {
        return `_x[${idx}]`;
      }
      getTap(idx) {
        return `_taps[${idx}]`;
      }
      getInterceptor(idx) {
        return `_interceptors[${idx}]`;
      }
    };
    module.exports = HookCodeFactory;
  }
});

// node_modules/tapable/lib/AsyncParallelBailHook.js
var require_AsyncParallelBailHook = __commonJS({
  "node_modules/tapable/lib/AsyncParallelBailHook.js"(exports, module) {
    "use strict";
    var Hook = require_Hook();
    var HookCodeFactory = require_HookCodeFactory();
    var AsyncParallelBailHookCodeFactory = class extends HookCodeFactory {
      content({ onError, onResult, onDone }) {
        let code = "";
        code += `var _results = new Array(${this.options.taps.length});
`;
        code += "var _checkDone = function() {\n";
        code += "for(var i = 0; i < _results.length; i++) {\n";
        code += "var item = _results[i];\n";
        code += "if(item === undefined) return false;\n";
        code += "if(item.result !== undefined) {\n";
        code += onResult("item.result");
        code += "return true;\n";
        code += "}\n";
        code += "if(item.error) {\n";
        code += onError("item.error");
        code += "return true;\n";
        code += "}\n";
        code += "}\n";
        code += "return false;\n";
        code += "}\n";
        code += this.callTapsParallel({
          onError: (i, err, done, doneBreak) => {
            let code2 = "";
            code2 += `if(${i} < _results.length && ((_results.length = ${i + 1}), (_results[${i}] = { error: ${err} }), _checkDone())) {
`;
            code2 += doneBreak(true);
            code2 += "} else {\n";
            code2 += done();
            code2 += "}\n";
            return code2;
          },
          onResult: (i, result, done, doneBreak) => {
            let code2 = "";
            code2 += `if(${i} < _results.length && (${result} !== undefined && (_results.length = ${i + 1}), (_results[${i}] = { result: ${result} }), _checkDone())) {
`;
            code2 += doneBreak(true);
            code2 += "} else {\n";
            code2 += done();
            code2 += "}\n";
            return code2;
          },
          onTap: (i, run, done, _doneBreak) => {
            let code2 = "";
            if (i > 0) {
              code2 += `if(${i} >= _results.length) {
`;
              code2 += done();
              code2 += "} else {\n";
            }
            code2 += run();
            if (i > 0) code2 += "}\n";
            return code2;
          },
          onDone
        });
        return code;
      }
    };
    var factory = new AsyncParallelBailHookCodeFactory();
    function COMPILE(options) {
      factory.setup(this, options);
      return factory.create(options);
    }
    function AsyncParallelBailHook(args = [], name = void 0) {
      const hook = new Hook(args, name);
      hook.constructor = AsyncParallelBailHook;
      hook.compile = COMPILE;
      hook._call = void 0;
      hook.call = void 0;
      return hook;
    }
    AsyncParallelBailHook.prototype = null;
    module.exports = AsyncParallelBailHook;
  }
});

// node_modules/tapable/lib/AsyncParallelHook.js
var require_AsyncParallelHook = __commonJS({
  "node_modules/tapable/lib/AsyncParallelHook.js"(exports, module) {
    "use strict";
    var Hook = require_Hook();
    var HookCodeFactory = require_HookCodeFactory();
    var AsyncParallelHookCodeFactory = class extends HookCodeFactory {
      content({ onError, onDone }) {
        return this.callTapsParallel({
          onError: (i, err, done, doneBreak) => onError(err) + doneBreak(true),
          onDone
        });
      }
    };
    var factory = new AsyncParallelHookCodeFactory();
    function COMPILE(options) {
      factory.setup(this, options);
      return factory.create(options);
    }
    function AsyncParallelHook(args = [], name = void 0) {
      const hook = new Hook(args, name);
      hook.constructor = AsyncParallelHook;
      hook.compile = COMPILE;
      hook._call = void 0;
      hook.call = void 0;
      return hook;
    }
    AsyncParallelHook.prototype = null;
    module.exports = AsyncParallelHook;
  }
});

// node_modules/tapable/lib/AsyncSeriesBailHook.js
var require_AsyncSeriesBailHook = __commonJS({
  "node_modules/tapable/lib/AsyncSeriesBailHook.js"(exports, module) {
    "use strict";
    var Hook = require_Hook();
    var HookCodeFactory = require_HookCodeFactory();
    var AsyncSeriesBailHookCodeFactory = class extends HookCodeFactory {
      content({ onError, onResult, resultReturns, onDone }) {
        return this.callTapsSeries({
          onError: (i, err, next, doneBreak) => onError(err) + doneBreak(true),
          onResult: (i, result, next) => `if(${result} !== undefined) {
${onResult(
            result
          )}
} else {
${next()}}
`,
          resultReturns,
          onDone
        });
      }
    };
    var factory = new AsyncSeriesBailHookCodeFactory();
    function COMPILE(options) {
      factory.setup(this, options);
      return factory.create(options);
    }
    function AsyncSeriesBailHook(args = [], name = void 0) {
      const hook = new Hook(args, name);
      hook.constructor = AsyncSeriesBailHook;
      hook.compile = COMPILE;
      hook._call = void 0;
      hook.call = void 0;
      return hook;
    }
    AsyncSeriesBailHook.prototype = null;
    module.exports = AsyncSeriesBailHook;
  }
});

// node_modules/tapable/lib/AsyncSeriesHook.js
var require_AsyncSeriesHook = __commonJS({
  "node_modules/tapable/lib/AsyncSeriesHook.js"(exports, module) {
    "use strict";
    var Hook = require_Hook();
    var HookCodeFactory = require_HookCodeFactory();
    var AsyncSeriesHookCodeFactory = class extends HookCodeFactory {
      content({ onError, onDone }) {
        return this.callTapsSeries({
          onError: (i, err, next, doneBreak) => onError(err) + doneBreak(true),
          onDone
        });
      }
    };
    var factory = new AsyncSeriesHookCodeFactory();
    function COMPILE(options) {
      factory.setup(this, options);
      return factory.create(options);
    }
    function AsyncSeriesHook(args = [], name = void 0) {
      const hook = new Hook(args, name);
      hook.constructor = AsyncSeriesHook;
      hook.compile = COMPILE;
      hook._call = void 0;
      hook.call = void 0;
      return hook;
    }
    AsyncSeriesHook.prototype = null;
    module.exports = AsyncSeriesHook;
  }
});

// node_modules/tapable/lib/AsyncSeriesLoopHook.js
var require_AsyncSeriesLoopHook = __commonJS({
  "node_modules/tapable/lib/AsyncSeriesLoopHook.js"(exports, module) {
    "use strict";
    var Hook = require_Hook();
    var HookCodeFactory = require_HookCodeFactory();
    var AsyncSeriesLoopHookCodeFactory = class extends HookCodeFactory {
      content({ onError, onDone }) {
        return this.callTapsLooping({
          onError: (i, err, next, doneBreak) => onError(err) + doneBreak(true),
          onDone
        });
      }
    };
    var factory = new AsyncSeriesLoopHookCodeFactory();
    function COMPILE(options) {
      factory.setup(this, options);
      return factory.create(options);
    }
    function AsyncSeriesLoopHook(args = [], name = void 0) {
      const hook = new Hook(args, name);
      hook.constructor = AsyncSeriesLoopHook;
      hook.compile = COMPILE;
      hook._call = void 0;
      hook.call = void 0;
      return hook;
    }
    AsyncSeriesLoopHook.prototype = null;
    module.exports = AsyncSeriesLoopHook;
  }
});

// node_modules/tapable/lib/AsyncSeriesWaterfallHook.js
var require_AsyncSeriesWaterfallHook = __commonJS({
  "node_modules/tapable/lib/AsyncSeriesWaterfallHook.js"(exports, module) {
    "use strict";
    var Hook = require_Hook();
    var HookCodeFactory = require_HookCodeFactory();
    var AsyncSeriesWaterfallHookCodeFactory = class extends HookCodeFactory {
      content({ onError, onResult, _onDone }) {
        return this.callTapsSeries({
          onError: (i, err, next, doneBreak) => onError(err) + doneBreak(true),
          onResult: (i, result, next) => {
            let code = "";
            code += `if(${result} !== undefined) {
`;
            code += `${this._args[0]} = ${result};
`;
            code += "}\n";
            code += next();
            return code;
          },
          onDone: () => onResult(this._args[0])
        });
      }
    };
    var factory = new AsyncSeriesWaterfallHookCodeFactory();
    function COMPILE(options) {
      factory.setup(this, options);
      return factory.create(options);
    }
    function AsyncSeriesWaterfallHook(args = [], name = void 0) {
      if (args.length < 1) {
        throw new Error("Waterfall hooks must have at least one argument");
      }
      const hook = new Hook(args, name);
      hook.constructor = AsyncSeriesWaterfallHook;
      hook.compile = COMPILE;
      hook._call = void 0;
      hook.call = void 0;
      return hook;
    }
    AsyncSeriesWaterfallHook.prototype = null;
    module.exports = AsyncSeriesWaterfallHook;
  }
});

// node_modules/tapable/lib/HookMap.js
var require_HookMap = __commonJS({
  "node_modules/tapable/lib/HookMap.js"(exports, module) {
    "use strict";
    var util = __require("util");
    var defaultFactory = (key, hook) => hook;
    var HookMap = class {
      constructor(factory, name = void 0) {
        this._map = /* @__PURE__ */ new Map();
        this.name = name;
        this._factory = factory;
        this._interceptors = [];
      }
      get(key) {
        return this._map.get(key);
      }
      for(key) {
        const map = this._map;
        const hook = map.get(key);
        if (hook !== void 0) {
          return hook;
        }
        let newHook = this._factory(key);
        const interceptors = this._interceptors;
        for (let i = 0; i < interceptors.length; i++) {
          newHook = interceptors[i].factory(key, newHook);
        }
        map.set(key, newHook);
        return newHook;
      }
      intercept(interceptor) {
        this._interceptors.push(
          Object.assign(
            {
              factory: defaultFactory
            },
            interceptor
          )
        );
      }
    };
    HookMap.prototype.tap = util.deprecate(function tap(key, options, fn) {
      return this.for(key).tap(options, fn);
    }, "HookMap#tap(key,\u2026) is deprecated. Use HookMap#for(key).tap(\u2026) instead.");
    HookMap.prototype.tapAsync = util.deprecate(function tapAsync(key, options, fn) {
      return this.for(key).tapAsync(options, fn);
    }, "HookMap#tapAsync(key,\u2026) is deprecated. Use HookMap#for(key).tapAsync(\u2026) instead.");
    HookMap.prototype.tapPromise = util.deprecate(function tapPromise(key, options, fn) {
      return this.for(key).tapPromise(options, fn);
    }, "HookMap#tapPromise(key,\u2026) is deprecated. Use HookMap#for(key).tapPromise(\u2026) instead.");
    module.exports = HookMap;
  }
});

// node_modules/tapable/lib/MultiHook.js
var require_MultiHook = __commonJS({
  "node_modules/tapable/lib/MultiHook.js"(exports, module) {
    "use strict";
    var MultiHook = class _MultiHook {
      constructor(hooks, name = void 0) {
        this.hooks = hooks;
        this.name = name;
      }
      tap(options, fn) {
        const { hooks } = this;
        for (let i = 0; i < hooks.length; i++) {
          hooks[i].tap(options, fn);
        }
      }
      tapAsync(options, fn) {
        const { hooks } = this;
        for (let i = 0; i < hooks.length; i++) {
          hooks[i].tapAsync(options, fn);
        }
      }
      tapPromise(options, fn) {
        const { hooks } = this;
        for (let i = 0; i < hooks.length; i++) {
          hooks[i].tapPromise(options, fn);
        }
      }
      isUsed() {
        const { hooks } = this;
        for (let i = 0; i < hooks.length; i++) {
          if (hooks[i].isUsed()) return true;
        }
        return false;
      }
      intercept(interceptor) {
        const { hooks } = this;
        for (let i = 0; i < hooks.length; i++) {
          hooks[i].intercept(interceptor);
        }
      }
      withOptions(options) {
        return new _MultiHook(
          this.hooks.map((hook) => hook.withOptions(options)),
          this.name
        );
      }
    };
    module.exports = MultiHook;
  }
});

// node_modules/tapable/lib/SyncBailHook.js
var require_SyncBailHook = __commonJS({
  "node_modules/tapable/lib/SyncBailHook.js"(exports, module) {
    "use strict";
    var Hook = require_Hook();
    var HookCodeFactory = require_HookCodeFactory();
    var SyncBailHookCodeFactory = class extends HookCodeFactory {
      content({ onError, onResult, resultReturns, onDone, rethrowIfPossible }) {
        return this.callTapsSeries({
          onError: (i, err) => onError(err),
          onResult: (i, result, next) => `if(${result} !== undefined) {
${onResult(
            result
          )};
} else {
${next()}}
`,
          resultReturns,
          onDone,
          rethrowIfPossible
        });
      }
    };
    var factory = new SyncBailHookCodeFactory();
    var TAP_ASYNC = () => {
      throw new Error("tapAsync is not supported on a SyncBailHook");
    };
    var TAP_PROMISE = () => {
      throw new Error("tapPromise is not supported on a SyncBailHook");
    };
    function COMPILE(options) {
      factory.setup(this, options);
      return factory.create(options);
    }
    function SyncBailHook(args = [], name = void 0) {
      const hook = new Hook(args, name);
      hook.constructor = SyncBailHook;
      hook.tapAsync = TAP_ASYNC;
      hook.tapPromise = TAP_PROMISE;
      hook.compile = COMPILE;
      return hook;
    }
    SyncBailHook.prototype = null;
    module.exports = SyncBailHook;
  }
});

// node_modules/tapable/lib/SyncHook.js
var require_SyncHook = __commonJS({
  "node_modules/tapable/lib/SyncHook.js"(exports, module) {
    "use strict";
    var Hook = require_Hook();
    var HookCodeFactory = require_HookCodeFactory();
    var SyncHookCodeFactory = class extends HookCodeFactory {
      content({ onError, onDone, rethrowIfPossible }) {
        return this.callTapsSeries({
          onError: (i, err) => onError(err),
          onDone,
          rethrowIfPossible
        });
      }
    };
    var factory = new SyncHookCodeFactory();
    var TAP_ASYNC = () => {
      throw new Error("tapAsync is not supported on a SyncHook");
    };
    var TAP_PROMISE = () => {
      throw new Error("tapPromise is not supported on a SyncHook");
    };
    function COMPILE(options) {
      factory.setup(this, options);
      return factory.create(options);
    }
    function SyncHook(args = [], name = void 0) {
      const hook = new Hook(args, name);
      hook.constructor = SyncHook;
      hook.tapAsync = TAP_ASYNC;
      hook.tapPromise = TAP_PROMISE;
      hook.compile = COMPILE;
      return hook;
    }
    SyncHook.prototype = null;
    module.exports = SyncHook;
  }
});

// node_modules/tapable/lib/SyncLoopHook.js
var require_SyncLoopHook = __commonJS({
  "node_modules/tapable/lib/SyncLoopHook.js"(exports, module) {
    "use strict";
    var Hook = require_Hook();
    var HookCodeFactory = require_HookCodeFactory();
    var SyncLoopHookCodeFactory = class extends HookCodeFactory {
      content({ onError, onDone, rethrowIfPossible }) {
        return this.callTapsLooping({
          onError: (i, err) => onError(err),
          onDone,
          rethrowIfPossible
        });
      }
    };
    var factory = new SyncLoopHookCodeFactory();
    var TAP_ASYNC = () => {
      throw new Error("tapAsync is not supported on a SyncLoopHook");
    };
    var TAP_PROMISE = () => {
      throw new Error("tapPromise is not supported on a SyncLoopHook");
    };
    function COMPILE(options) {
      factory.setup(this, options);
      return factory.create(options);
    }
    function SyncLoopHook(args = [], name = void 0) {
      const hook = new Hook(args, name);
      hook.constructor = SyncLoopHook;
      hook.tapAsync = TAP_ASYNC;
      hook.tapPromise = TAP_PROMISE;
      hook.compile = COMPILE;
      return hook;
    }
    SyncLoopHook.prototype = null;
    module.exports = SyncLoopHook;
  }
});

// node_modules/tapable/lib/SyncWaterfallHook.js
var require_SyncWaterfallHook = __commonJS({
  "node_modules/tapable/lib/SyncWaterfallHook.js"(exports, module) {
    "use strict";
    var Hook = require_Hook();
    var HookCodeFactory = require_HookCodeFactory();
    var SyncWaterfallHookCodeFactory = class extends HookCodeFactory {
      content({ onError, onResult, resultReturns, rethrowIfPossible }) {
        return this.callTapsSeries({
          onError: (i, err) => onError(err),
          onResult: (i, result, next) => {
            let code = "";
            code += `if(${result} !== undefined) {
`;
            code += `${this._args[0]} = ${result};
`;
            code += "}\n";
            code += next();
            return code;
          },
          onDone: () => onResult(this._args[0]),
          doneReturns: resultReturns,
          rethrowIfPossible
        });
      }
    };
    var factory = new SyncWaterfallHookCodeFactory();
    var TAP_ASYNC = () => {
      throw new Error("tapAsync is not supported on a SyncWaterfallHook");
    };
    var TAP_PROMISE = () => {
      throw new Error("tapPromise is not supported on a SyncWaterfallHook");
    };
    function COMPILE(options) {
      factory.setup(this, options);
      return factory.create(options);
    }
    function SyncWaterfallHook(args = [], name = void 0) {
      if (args.length < 1) {
        throw new Error("Waterfall hooks must have at least one argument");
      }
      const hook = new Hook(args, name);
      hook.constructor = SyncWaterfallHook;
      hook.tapAsync = TAP_ASYNC;
      hook.tapPromise = TAP_PROMISE;
      hook.compile = COMPILE;
      return hook;
    }
    SyncWaterfallHook.prototype = null;
    module.exports = SyncWaterfallHook;
  }
});

// node_modules/tapable/lib/index.js
var require_lib = __commonJS({
  "node_modules/tapable/lib/index.js"(exports, module) {
    "use strict";
    module.exports.AsyncParallelBailHook = require_AsyncParallelBailHook();
    module.exports.AsyncParallelHook = require_AsyncParallelHook();
    module.exports.AsyncSeriesBailHook = require_AsyncSeriesBailHook();
    module.exports.AsyncSeriesHook = require_AsyncSeriesHook();
    module.exports.AsyncSeriesLoopHook = require_AsyncSeriesLoopHook();
    module.exports.AsyncSeriesWaterfallHook = require_AsyncSeriesWaterfallHook();
    module.exports.HookMap = require_HookMap();
    module.exports.MultiHook = require_MultiHook();
    module.exports.SyncBailHook = require_SyncBailHook();
    module.exports.SyncHook = require_SyncHook();
    module.exports.SyncLoopHook = require_SyncLoopHook();
    module.exports.SyncWaterfallHook = require_SyncWaterfallHook();
    module.exports.__esModule = true;
  }
});

// node_modules/mini-css-extract-plugin/dist/plugin-options.json
var require_plugin_options = __commonJS({
  "node_modules/mini-css-extract-plugin/dist/plugin-options.json"(exports, module) {
    module.exports = {
      title: "Mini CSS Extract Plugin options",
      type: "object",
      additionalProperties: false,
      properties: {
        filename: {
          anyOf: [
            {
              type: "string",
              absolutePath: false,
              minLength: 1
            },
            {
              instanceof: "Function"
            }
          ],
          description: "This option determines the name of each output CSS file.",
          link: "https://github.com/webpack/mini-css-extract-plugin#filename"
        },
        chunkFilename: {
          anyOf: [
            {
              type: "string",
              absolutePath: false,
              minLength: 1
            },
            {
              instanceof: "Function"
            }
          ],
          description: "This option determines the name of non-entry chunk files.",
          link: "https://github.com/webpack/mini-css-extract-plugin#chunkfilename"
        },
        experimentalUseImportModule: {
          type: "boolean",
          description: "Enable the experimental importModule approach instead of using child compilers. This uses less memory and is faster.",
          link: "https://github.com/webpack/mini-css-extract-plugin#experimentaluseimportmodule"
        },
        ignoreOrder: {
          type: "boolean",
          description: "Remove Order Warnings.",
          link: "https://github.com/webpack/mini-css-extract-plugin#ignoreorder"
        },
        insert: {
          description: "Inserts the `link` tag at the given position for non-initial (async) (https://webpack.js.org/concepts/under-the-hood/#chunks) CSS chunks.",
          link: "https://github.com/webpack/mini-css-extract-plugin#insert",
          anyOf: [
            {
              type: "string"
            },
            {
              instanceof: "Function"
            }
          ]
        },
        attributes: {
          description: "Adds custom attributes to the `link` tag for non-initial (async) (https://webpack.js.org/concepts/under-the-hood/#chunks) CSS chunks.",
          link: "https://github.com/webpack/mini-css-extract-plugin#attributes",
          type: "object"
        },
        linkType: {
          anyOf: [
            {
              enum: ["text/css"]
            },
            {
              type: "boolean"
            }
          ],
          description: "This option allows loading asynchronous chunks with a custom link type",
          link: "https://github.com/webpack/mini-css-extract-plugin#linktype"
        },
        runtime: {
          type: "boolean",
          description: "Enabled/Disables runtime generation. CSS will be still extracted and can be used for a custom loading methods.",
          link: "https://github.com/webpack/mini-css-extract-plugin#noRuntime"
        }
      }
    };
  }
});

// node_modules/mini-css-extract-plugin/dist/utils.js
var require_utils = __commonJS({
  "node_modules/mini-css-extract-plugin/dist/utils.js"(exports, module) {
    "use strict";
    var NativeModule = __require("module");
    var path = __require("path");
    function trueFn() {
      return true;
    }
    function findModuleById(compilation, id) {
      const {
        modules,
        chunkGraph
      } = compilation;
      for (const module2 of modules) {
        const moduleId = typeof chunkGraph !== "undefined" ? chunkGraph.getModuleId(module2) : module2.id;
        if (moduleId === id) {
          return module2;
        }
      }
      return null;
    }
    function evalModuleCode(loaderContext, code, filename) {
      const module2 = new NativeModule(filename, loaderContext);
      module2.paths = NativeModule._nodeModulePaths(loaderContext.context);
      module2.filename = filename;
      module2._compile(code, filename);
      return module2.exports;
    }
    function compareIds(a, b) {
      if (typeof a !== typeof b) {
        return typeof a < typeof b ? -1 : 1;
      }
      if (a < b) {
        return -1;
      }
      if (a > b) {
        return 1;
      }
      return 0;
    }
    function compareModulesByIdentifier(a, b) {
      return compareIds(a.identifier(), b.identifier());
    }
    var MODULE_TYPE = "css/mini-extract";
    var AUTO_PUBLIC_PATH = "__mini_css_extract_plugin_public_path_auto__";
    var ABSOLUTE_PUBLIC_PATH = "webpack:///mini-css-extract-plugin/";
    var BASE_URI = "webpack://";
    var SINGLE_DOT_PATH_SEGMENT = "__mini_css_extract_plugin_single_dot_path_segment__";
    function isAbsolutePath(str) {
      return path.posix.isAbsolute(str) || path.win32.isAbsolute(str);
    }
    var RELATIVE_PATH_REGEXP = /^\.\.?[/\\]/;
    function isRelativePath(str) {
      return RELATIVE_PATH_REGEXP.test(str);
    }
    function stringifyRequest(loaderContext, request) {
      if (typeof loaderContext.utils !== "undefined" && typeof loaderContext.utils.contextify === "function") {
        return JSON.stringify(loaderContext.utils.contextify(loaderContext.context || loaderContext.rootContext, request));
      }
      const splitted = request.split("!");
      const {
        context
      } = loaderContext;
      return JSON.stringify(splitted.map((part) => {
        const splittedPart = part.match(/^(.*?)(\?.*)/);
        const query = splittedPart ? splittedPart[2] : "";
        let singlePath = splittedPart ? splittedPart[1] : part;
        if (isAbsolutePath(singlePath) && context) {
          singlePath = path.relative(context, singlePath);
          if (isAbsolutePath(singlePath)) {
            return singlePath + query;
          }
          if (isRelativePath(singlePath) === false) {
            singlePath = `./${singlePath}`;
          }
        }
        return singlePath.replace(/\\/g, "/") + query;
      }).join("!"));
    }
    function getUndoPath(filename, outputPath, enforceRelative) {
      let depth = -1;
      let append = "";
      outputPath = outputPath.replace(/[\\/]$/, "");
      for (const part of filename.split(/[/\\]+/)) {
        if (part === "..") {
          if (depth > -1) {
            depth--;
          } else {
            const i = outputPath.lastIndexOf("/");
            const j = outputPath.lastIndexOf("\\");
            const pos = i < 0 ? j : j < 0 ? i : Math.max(i, j);
            if (pos < 0) {
              return `${outputPath}/`;
            }
            append = `${outputPath.slice(pos + 1)}/${append}`;
            outputPath = outputPath.slice(0, pos);
          }
        } else if (part !== ".") {
          depth++;
        }
      }
      return depth > 0 ? `${"../".repeat(depth)}${append}` : enforceRelative ? `./${append}` : append;
    }
    function stringifyLocal(value) {
      return typeof value === "function" ? value.toString() : JSON.stringify(value);
    }
    var toSimpleString = (str) => {
      if (`${+str}` === str) {
        return str;
      }
      return JSON.stringify(str);
    };
    var quoteMeta = (str) => str.replace(/[-[\]\\/{}()*+?.^$|]/g, "\\$&");
    var getCommonPrefix = (items) => {
      let [prefix] = items;
      for (let i = 1; i < items.length; i++) {
        const item = items[i];
        for (let prefixIndex = 0; prefixIndex < prefix.length; prefixIndex++) {
          if (item[prefixIndex] !== prefix[prefixIndex]) {
            prefix = prefix.slice(0, prefixIndex);
            break;
          }
        }
      }
      return prefix;
    };
    var getCommonSuffix = (items) => {
      let [suffix] = items;
      for (let i = 1; i < items.length; i++) {
        const item = items[i];
        for (let itemIndex = item.length - 1, suffixIndex = suffix.length - 1; suffixIndex >= 0; itemIndex--, suffixIndex--) {
          if (item[itemIndex] !== suffix[suffixIndex]) {
            suffix = suffix.slice(suffixIndex + 1);
            break;
          }
        }
      }
      return suffix;
    };
    var popCommonItems = (itemsSet, getKey, condition) => {
      const map = /* @__PURE__ */ new Map();
      for (const item of itemsSet) {
        const key = getKey(item);
        if (key) {
          let list = map.get(key);
          if (list === void 0) {
            list = [];
            map.set(key, list);
          }
          list.push(item);
        }
      }
      const result = [];
      for (const list of map.values()) {
        if (condition(list)) {
          for (const item of list) {
            itemsSet.delete(item);
          }
          result.push(list);
        }
      }
      return result;
    };
    var itemsToRegexp = (itemsArr) => {
      if (itemsArr.length === 1) {
        return quoteMeta(itemsArr[0]);
      }
      const finishedItems = [];
      let countOfSingleCharItems = 0;
      for (const item of itemsArr) {
        if (item.length === 1) {
          countOfSingleCharItems++;
        }
      }
      if (countOfSingleCharItems === itemsArr.length) {
        return `[${quoteMeta(itemsArr.sort().join(""))}]`;
      }
      const items = new Set(itemsArr.sort());
      if (countOfSingleCharItems > 2) {
        let singleCharItems = "";
        for (const item of items) {
          if (item.length === 1) {
            singleCharItems += item;
            items.delete(item);
          }
        }
        finishedItems.push(`[${quoteMeta(singleCharItems)}]`);
      }
      if (finishedItems.length === 0 && items.size === 2) {
        const prefix = getCommonPrefix(itemsArr);
        const suffix = getCommonSuffix(itemsArr.map((item) => item.slice(prefix.length)));
        if (prefix.length > 0 || suffix.length > 0) {
          return `${quoteMeta(prefix)}${itemsToRegexp(itemsArr.map((i) => i.slice(prefix.length, -suffix.length || void 0)))}${quoteMeta(suffix)}`;
        }
      }
      if (finishedItems.length === 0 && items.size === 2) {
        const it = items[Symbol.iterator]();
        const a = it.next().value;
        const b = it.next().value;
        if (a.length > 0 && b.length > 0 && a.slice(-1) === b.slice(-1)) {
          return `${itemsToRegexp([a.slice(0, -1), b.slice(0, -1)])}${quoteMeta(a.slice(-1))}`;
        }
      }
      const prefixed = popCommonItems(items, (item) => item.length >= 1 ? item[0] : false, (list) => {
        if (list.length >= 3) return true;
        if (list.length <= 1) return false;
        return list[0][1] === list[1][1];
      });
      for (const prefixedItems of prefixed) {
        const prefix = getCommonPrefix(prefixedItems);
        finishedItems.push(`${quoteMeta(prefix)}${itemsToRegexp(prefixedItems.map((i) => i.slice(prefix.length)))}`);
      }
      const suffixed = popCommonItems(items, (item) => item.length >= 1 ? item.slice(-1) : false, (list) => {
        if (list.length >= 3) return true;
        if (list.length <= 1) return false;
        return list[0].slice(-2) === list[1].slice(-2);
      });
      for (const suffixedItems of suffixed) {
        const suffix = getCommonSuffix(suffixedItems);
        finishedItems.push(`${itemsToRegexp(suffixedItems.map((i) => i.slice(0, -suffix.length)))}${quoteMeta(suffix)}`);
      }
      const conditional = [...finishedItems, ...Array.from(items, quoteMeta)];
      if (conditional.length === 1) return conditional[0];
      return `(${conditional.join("|")})`;
    };
    var compileBooleanMatcherFromLists = (positiveItems, negativeItems) => {
      if (positiveItems.length === 0) {
        return () => "false";
      }
      if (negativeItems.length === 0) {
        return () => "true";
      }
      if (positiveItems.length === 1) {
        return (value) => `${toSimpleString(positiveItems[0])} == ${value}`;
      }
      if (negativeItems.length === 1) {
        return (value) => `${toSimpleString(negativeItems[0])} != ${value}`;
      }
      const positiveRegexp = itemsToRegexp(positiveItems);
      const negativeRegexp = itemsToRegexp(negativeItems);
      if (positiveRegexp.length <= negativeRegexp.length) {
        return (value) => `/^${positiveRegexp}$/.test(${value})`;
      }
      return (value) => `!/^${negativeRegexp}$/.test(${value})`;
    };
    var compileBooleanMatcher = (map) => {
      const positiveItems = Object.keys(map).filter((i) => map[i]);
      const negativeItems = Object.keys(map).filter((i) => !map[i]);
      if (positiveItems.length === 0) {
        return false;
      }
      if (negativeItems.length === 0) {
        return true;
      }
      return compileBooleanMatcherFromLists(positiveItems, negativeItems);
    };
    module.exports = {
      ABSOLUTE_PUBLIC_PATH,
      AUTO_PUBLIC_PATH,
      BASE_URI,
      MODULE_TYPE,
      SINGLE_DOT_PATH_SEGMENT,
      compareModulesByIdentifier,
      compileBooleanMatcher,
      evalModuleCode,
      findModuleById,
      getUndoPath,
      stringifyLocal,
      stringifyRequest,
      trueFn
    };
  }
});

// node_modules/mini-css-extract-plugin/dist/index.js
var require_dist = __commonJS({
  "node_modules/mini-css-extract-plugin/dist/index.js"(exports, module) {
    var path = __require("path");
    var {
      validate
    } = __require("schema-utils");
    var {
      SyncWaterfallHook
    } = require_lib();
    var schema = require_plugin_options();
    var {
      ABSOLUTE_PUBLIC_PATH,
      AUTO_PUBLIC_PATH,
      BASE_URI,
      MODULE_TYPE,
      SINGLE_DOT_PATH_SEGMENT,
      compareModulesByIdentifier,
      compileBooleanMatcher,
      getUndoPath,
      trueFn
    } = require_utils();
    var pluginName = "mini-css-extract-plugin";
    var pluginSymbol = Symbol(pluginName);
    var DEFAULT_FILENAME = "[name].css";
    var TYPES = /* @__PURE__ */ new Set([MODULE_TYPE]);
    var CODE_GENERATION_RESULT = {
      sources: /* @__PURE__ */ new Map(),
      runtimeRequirements: /* @__PURE__ */ new Set()
    };
    var cssModuleCache = /* @__PURE__ */ new WeakMap();
    var cssDependencyCache = /* @__PURE__ */ new WeakMap();
    var registered = /* @__PURE__ */ new WeakSet();
    var compilationHooksMap = /* @__PURE__ */ new WeakMap();
    var MiniCssExtractPlugin = class _MiniCssExtractPlugin {
      /**
       * @param {Compiler["webpack"]} webpack webpack
       * @returns {CssModuleConstructor} CSS module constructor
       */
      static getCssModule(webpack) {
        if (cssModuleCache.has(webpack)) {
          return (
            /** @type {CssModuleConstructor} */
            cssModuleCache.get(webpack)
          );
        }
        class CssModule extends webpack.Module {
          /**
           * @param {CssModuleDependency} dependency css module dependency
           */
          constructor({
            context,
            identifier,
            identifierIndex,
            content,
            layer,
            supports,
            media,
            sourceMap,
            assets,
            assetsInfo
          }) {
            super(
              MODULE_TYPE,
              /** @type {string | undefined} */
              context
            );
            this.id = "";
            this._context = context;
            this._identifier = identifier;
            this._identifierIndex = identifierIndex;
            this.content = content;
            this.layer = layer;
            this.supports = supports;
            this.media = media;
            this.sourceMap = sourceMap;
            this.assets = assets;
            this.assetsInfo = assetsInfo;
            this._needBuild = true;
          }
          // no source() so webpack 4 doesn't do add stuff to the bundle
          size() {
            return this.content.length;
          }
          identifier() {
            return `css|${this._identifier}|${this._identifierIndex}|${this.layer || ""}|${this.supports || ""}|${this.media}}}`;
          }
          /**
           * @param {Parameters<Module["readableIdentifier"]>[0]} requestShortener request shortener
           * @returns {ReturnType<Module["readableIdentifier"]>} readable identifier
           */
          readableIdentifier(requestShortener) {
            return `css ${requestShortener.shorten(this._identifier)}${this._identifierIndex ? ` (${this._identifierIndex})` : ""}${this.layer ? ` (layer ${this.layer})` : ""}${this.supports ? ` (supports ${this.supports})` : ""}${this.media ? ` (media ${this.media})` : ""}`;
          }
          getSourceTypes() {
            return TYPES;
          }
          codeGeneration() {
            return CODE_GENERATION_RESULT;
          }
          nameForCondition() {
            const resource = (
              /** @type {string} */
              this._identifier.split("!").pop()
            );
            const idx = resource.indexOf("?");
            if (idx >= 0) {
              return resource.slice(0, Math.max(0, idx));
            }
            return resource;
          }
          /**
           * @param {Module} module a module
           */
          updateCacheModule(module2) {
            if (!this.content.equals(
              /** @type {CssModule} */
              module2.content
            ) || this.layer !== /** @type {CssModule} */
            module2.layer || this.supports !== /** @type {CssModule} */
            module2.supports || this.media !== /** @type {CssModule} */
            module2.media || (this.sourceMap ? !this.sourceMap.equals(
              /** @type {Uint8Array} * */
              /** @type {CssModule} */
              module2.sourceMap
            ) : false) || this.assets !== /** @type {CssModule} */
            module2.assets || this.assetsInfo !== /** @type {CssModule} */
            module2.assetsInfo) {
              this._needBuild = true;
              this.content = /** @type {CssModule} */
              module2.content;
              this.layer = /** @type {CssModule} */
              module2.layer;
              this.supports = /** @type {CssModule} */
              module2.supports;
              this.media = /** @type {CssModule} */
              module2.media;
              this.sourceMap = /** @type {CssModule} */
              module2.sourceMap;
              this.assets = /** @type {CssModule} */
              module2.assets;
              this.assetsInfo = /** @type {CssModule} */
              module2.assetsInfo;
            }
          }
          needRebuild() {
            return this._needBuild;
          }
          /**
           * @param {Parameters<Module["needBuild"]>[0]} context context info
           * @param {Parameters<Module["needBuild"]>[1]} callback callback function, returns true, if the module needs a rebuild
           */
          needBuild(context, callback) {
            callback(void 0, this._needBuild);
          }
          /**
           * @param {Parameters<Module["build"]>[0]} options options
           * @param {Parameters<Module["build"]>[1]} compilation compilation
           * @param {Parameters<Module["build"]>[2]} resolver resolver
           * @param {Parameters<Module["build"]>[3]} fileSystem file system
           * @param {Parameters<Module["build"]>[4]} callback callback
           */
          build(options, compilation, resolver, fileSystem, callback) {
            this.buildInfo = {
              assets: this.assets,
              assetsInfo: this.assetsInfo,
              cacheable: true,
              hash: (
                /** @type {string} */
                this._computeHash(
                  /** @type {string} */
                  compilation.outputOptions.hashFunction
                )
              )
            };
            this.buildMeta = {};
            this._needBuild = false;
            callback();
          }
          /**
           * @private
           * @param {string} hashFunction hash function
           * @returns {string | Buffer} hash digest
           */
          _computeHash(hashFunction) {
            const hash = webpack.util.createHash(hashFunction);
            hash.update(this.content);
            if (this.layer) {
              hash.update(this.layer);
            }
            hash.update(this.supports || "");
            hash.update(this.media || "");
            hash.update(this.sourceMap || "");
            return hash.digest("hex");
          }
          /**
           * @param {Parameters<Module["updateHash"]>[0]} hash hash
           * @param {Parameters<Module["updateHash"]>[1]} context context
           */
          updateHash(hash, context) {
            super.updateHash(hash, context);
            hash.update(
              /** @type {string} */
              /** @type {NonNullable<Module["buildInfo"]>} */
              this.buildInfo.hash
            );
          }
          /**
           * @param {Parameters<Module["serialize"]>[0]} context serializer context
           */
          serialize(context) {
            const {
              write
            } = context;
            write(this._context);
            write(this._identifier);
            write(this._identifierIndex);
            write(this.content);
            write(this.layer);
            write(this.supports);
            write(this.media);
            write(this.sourceMap);
            write(this.assets);
            write(this.assetsInfo);
            write(this._needBuild);
            super.serialize(context);
          }
          /**
           * @param {Parameters<Module["deserialize"]>[0]} context deserializer context
           */
          deserialize(context) {
            this._needBuild = context.read();
            super.deserialize(context);
          }
        }
        cssModuleCache.set(webpack, CssModule);
        webpack.util.serialization.register(CssModule, path.resolve(__dirname, "CssModule"), null, {
          serialize(instance, context) {
            instance.serialize(context);
          },
          deserialize(context) {
            const {
              read
            } = context;
            const contextModule = read();
            const identifier = read();
            const identifierIndex = read();
            const content = read();
            const layer = read();
            const supports = read();
            const media = read();
            const sourceMap = read();
            const assets = read();
            const assetsInfo = read();
            const dep = new CssModule({
              context: contextModule,
              identifier,
              identifierIndex,
              content,
              layer,
              supports,
              media,
              sourceMap,
              assets,
              assetsInfo
            });
            dep.deserialize(context);
            return dep;
          }
        });
        return CssModule;
      }
      /**
       * @param {Compiler["webpack"]} webpack webpack
       * @returns {CssDependencyConstructor} CSS dependency constructor
       */
      static getCssDependency(webpack) {
        if (cssDependencyCache.has(webpack)) {
          return (
            /** @type {CssDependencyConstructor} */
            cssDependencyCache.get(webpack)
          );
        }
        class CssDependency extends webpack.Dependency {
          /**
           * @param {CssDependencyOptions} loaderDependency loader dependency
           * @param {string | null} context context
           * @param {number} identifierIndex identifier index
           */
          constructor({
            identifier,
            content,
            layer,
            supports,
            media,
            sourceMap
          }, context, identifierIndex) {
            super();
            this.identifier = identifier;
            this.identifierIndex = identifierIndex;
            this.content = content;
            this.layer = layer;
            this.supports = supports;
            this.media = media;
            this.sourceMap = sourceMap;
            this.context = context;
            this.assets = void 0;
            this.assetsInfo = void 0;
          }
          /**
           * @returns {ReturnType<Dependency["getResourceIdentifier"]>} a resource identifier
           */
          getResourceIdentifier() {
            return `css-module-${this.identifier}-${this.identifierIndex}`;
          }
          /**
           * @returns {ReturnType<Dependency["getModuleEvaluationSideEffectsState"]>} side effect state
           */
          getModuleEvaluationSideEffectsState() {
            return webpack.ModuleGraphConnection.TRANSITIVE_ONLY;
          }
          /**
           * @param {Parameters<Dependency["serialize"]>[0]} context serializer context
           */
          serialize(context) {
            const {
              write
            } = context;
            write(this.identifier);
            write(this.content);
            write(this.layer);
            write(this.supports);
            write(this.media);
            write(this.sourceMap);
            write(this.context);
            write(this.identifierIndex);
            write(this.assets);
            write(this.assetsInfo);
            super.serialize(context);
          }
          /**
           * @param {Parameters<Dependency["deserialize"]>[0]} context deserializer context
           */
          deserialize(context) {
            super.deserialize(context);
          }
        }
        cssDependencyCache.set(webpack, CssDependency);
        webpack.util.serialization.register(CssDependency, path.resolve(__dirname, "CssDependency"), null, {
          serialize(instance, context) {
            instance.serialize(context);
          },
          deserialize(context) {
            const {
              read
            } = context;
            const dep = new CssDependency({
              identifier: read(),
              content: read(),
              layer: read(),
              supports: read(),
              media: read(),
              sourceMap: read()
            }, read(), read());
            const assets = read();
            const assetsInfo = read();
            dep.assets = assets;
            dep.assetsInfo = assetsInfo;
            dep.deserialize(context);
            return dep;
          }
        });
        return CssDependency;
      }
      /**
       * Returns all hooks for the given compilation
       * @param {Compilation} compilation the compilation
       * @returns {MiniCssExtractPluginCompilationHooks} hooks
       */
      static getCompilationHooks(compilation) {
        let hooks = compilationHooksMap.get(compilation);
        if (!hooks) {
          hooks = {
            beforeTagInsert: new SyncWaterfallHook(["source", "varNames"], "string"),
            linkPreload: new SyncWaterfallHook(["source", "chunk"]),
            linkPrefetch: new SyncWaterfallHook(["source", "chunk"])
          };
          compilationHooksMap.set(compilation, hooks);
        }
        return hooks;
      }
      /**
       * @param {PluginOptions=} options options
       */
      constructor(options = {}) {
        validate(
          /** @type {Schema} */
          schema,
          options,
          {
            baseDataPath: "options"
          }
        );
        this._sortedModulesCache = /* @__PURE__ */ new WeakMap();
        this.options = {
          ignoreOrder: false,
          // TODO remove in the next major release
          experimentalUseImportModule: void 0,
          runtime: true,
          ...options
        };
        this.runtimeOptions = {
          insert: options.insert,
          linkType: (
            // Todo in next major release set default to "false"
            typeof options.linkType === "boolean" && /** @type {boolean} */
            options.linkType === true || typeof options.linkType === "undefined" ? "text/css" : options.linkType
          ),
          attributes: options.attributes
        };
      }
      /**
       * @param {Compiler} compiler compiler
       */
      apply(compiler) {
        const normalizedFilename = this.options.filename || compiler.options.output.cssFilename || DEFAULT_FILENAME;
        let normalizedChunkFilename = this.options.chunkFilename || compiler.options.output.cssChunkFilename;
        if (!normalizedChunkFilename) {
          if (typeof normalizedFilename !== "function") {
            const hasName = (
              /** @type {string} */
              normalizedFilename.includes("[name]")
            );
            const hasId = (
              /** @type {string} */
              normalizedFilename.includes("[id]")
            );
            const hasChunkHash = (
              /** @type {string} */
              normalizedFilename.includes("[chunkhash]")
            );
            const hasContentHash = (
              /** @type {string} */
              normalizedFilename.includes("[contenthash]")
            );
            if (hasChunkHash || hasContentHash || hasName || hasId) {
              normalizedChunkFilename = normalizedFilename;
            } else {
              normalizedChunkFilename = /** @type {string} */
              normalizedFilename.replace(/(^|\/)([^/]*(?:\?|$))/, "$1[id].$2");
            }
          } else {
            normalizedChunkFilename = "[id].css";
          }
        }
        const {
          webpack
        } = compiler;
        if (this.options.experimentalUseImportModule && typeof /** @type {Compiler["options"]["experiments"] & { executeModule?: boolean }} */
        compiler.options.experiments.executeModule === "undefined") {
          compiler.options.experiments.executeModule = true;
        }
        if (!registered.has(webpack)) {
          registered.add(webpack);
          webpack.util.serialization.registerLoader(/^mini-css-extract-plugin\//, trueFn);
        }
        const {
          splitChunks
        } = compiler.options.optimization;
        if (splitChunks && /** @type {string[]} */
        splitChunks.defaultSizeTypes.includes("...")) {
          splitChunks.defaultSizeTypes.push(MODULE_TYPE);
        }
        const CssModule = _MiniCssExtractPlugin.getCssModule(webpack);
        const CssDependency = _MiniCssExtractPlugin.getCssDependency(webpack);
        const {
          NormalModule
        } = compiler.webpack;
        compiler.hooks.compilation.tap(pluginName, (compilation) => {
          const {
            loader: normalModuleHook
          } = NormalModule.getCompilationHooks(compilation);
          normalModuleHook.tap(
            pluginName,
            /**
             * @param {object} loaderContext loader context
             */
            (loaderContext) => {
              loaderContext[pluginSymbol] = {
                experimentalUseImportModule: this.options.experimentalUseImportModule
              };
            }
          );
        });
        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
          class CssModuleFactory {
            /**
             * @param {{ dependencies: Dependency[] }} dependencies
             * @param {(err?: null | Error, result?: CssModule) => void} callback
             */
            create({
              dependencies: [dependency]
            }, callback) {
              callback(void 0, new CssModule(
                /** @type {CssDependency} */
                dependency
              ));
            }
          }
          compilation.dependencyFactories.set(
            CssDependency,
            // @ts-expect-error TODO fix in the next major release and fix using `CssModuleFactory extends webpack.ModuleFactory`
            new CssModuleFactory()
          );
          class CssDependencyTemplate {
            apply() {
            }
          }
          compilation.dependencyTemplates.set(CssDependency, new CssDependencyTemplate());
          compilation.hooks.renderManifest.tap(
            pluginName,
            /**
             * @param {ReturnType<Compilation["getRenderManifest"]>} result result
             * @param {Parameters<Compilation["getRenderManifest"]>[0]} chunk chunk
             * @returns {ReturnType<Compilation["getRenderManifest"]>} a rendered manifest
             */
            (result, {
              chunk
            }) => {
              const {
                chunkGraph
              } = compilation;
              const {
                HotUpdateChunk
              } = webpack;
              if (chunk instanceof HotUpdateChunk) {
                return result;
              }
              const renderedModules = (
                /** @type {CssModule[]} */
                [...this.getChunkModules(chunk, chunkGraph)].filter((module2) => module2.type === MODULE_TYPE)
              );
              const filenameTemplate = (
                /** @type {string} */
                chunk.canBeInitial() ? normalizedFilename : normalizedChunkFilename
              );
              if (renderedModules.length > 0) {
                result.push({
                  render: () => this.renderContentAsset(compiler, compilation, chunk, renderedModules, compilation.runtimeTemplate.requestShortener, filenameTemplate, {
                    contentHashType: MODULE_TYPE,
                    chunk
                  }),
                  filenameTemplate,
                  pathOptions: {
                    chunk,
                    contentHashType: MODULE_TYPE
                  },
                  identifier: `${pluginName}.${chunk.id}`,
                  hash: chunk.contentHash[MODULE_TYPE]
                });
              }
              return result;
            }
          );
          compilation.hooks.contentHash.tap(pluginName, (chunk) => {
            const {
              outputOptions,
              chunkGraph
            } = compilation;
            const modules = this.sortModules(
              compilation,
              chunk,
              /** @type {CssModule[]} */
              chunkGraph.getChunkModulesIterableBySourceType(chunk, MODULE_TYPE),
              compilation.runtimeTemplate.requestShortener
            );
            if (modules && modules.size > 0) {
              const {
                hashFunction,
                hashDigest,
                hashDigestLength
              } = outputOptions;
              const {
                createHash
              } = compiler.webpack.util;
              const hash = createHash(
                /** @type {string} */
                hashFunction
              );
              for (const m of modules) {
                hash.update(chunkGraph.getModuleHash(m, chunk.runtime));
              }
              chunk.contentHash[MODULE_TYPE] = /** @type {string} */
              hash.digest(hashDigest).slice(0, Math.max(
                0,
                /** @type {number} */
                hashDigestLength
              ));
            }
          });
          if (!this.options.runtime) {
            return;
          }
          const {
            Template,
            RuntimeGlobals,
            RuntimeModule,
            runtime
          } = webpack;
          const getCssChunkObject = (mainChunk, compilation2) => {
            const obj = {};
            const {
              chunkGraph
            } = compilation2;
            for (const chunk of mainChunk.getAllAsyncChunks()) {
              const modules = chunkGraph.getOrderedChunkModulesIterable(chunk, compareModulesByIdentifier);
              for (const module2 of modules) {
                if (module2.type === MODULE_TYPE) {
                  obj[
                    /** @type {string} */
                    chunk.id
                  ] = 1;
                  break;
                }
              }
            }
            return obj;
          };
          function chunkHasCss(chunk, chunkGraph) {
            return Boolean(chunkGraph.getChunkModulesIterableBySourceType(chunk, "css/mini-extract"));
          }
          class CssLoadingRuntimeModule extends RuntimeModule {
            /**
             * @param {Set<string>} runtimeRequirements runtime Requirements
             * @param {RuntimeOptions} runtimeOptions runtime options
             */
            constructor(runtimeRequirements, runtimeOptions) {
              super("css loading", 10);
              this.runtimeRequirements = runtimeRequirements;
              this.runtimeOptions = runtimeOptions;
            }
            generate() {
              const {
                chunkGraph,
                chunk,
                runtimeRequirements
              } = this;
              const {
                runtimeTemplate,
                outputOptions: {
                  crossOriginLoading
                }
              } = (
                /** @type {Compilation} */
                this.compilation
              );
              const chunkMap = getCssChunkObject(
                /** @type {Chunk} */
                chunk,
                /** @type {Compilation} */
                this.compilation
              );
              const withLoading = runtimeRequirements.has(RuntimeGlobals.ensureChunkHandlers) && Object.keys(chunkMap).length > 0;
              const withHmr = runtimeRequirements.has(RuntimeGlobals.hmrDownloadUpdateHandlers);
              if (!withLoading && !withHmr) {
                return "";
              }
              const conditionMap = (
                /** @type {ChunkGraph} */
                chunkGraph.getChunkConditionMap(
                  /** @type {Chunk} */
                  chunk,
                  chunkHasCss
                )
              );
              const hasCssMatcher = compileBooleanMatcher(conditionMap);
              const withPrefetch = runtimeRequirements.has(RuntimeGlobals.prefetchChunkHandlers);
              const withPreload = runtimeRequirements.has(RuntimeGlobals.preloadChunkHandlers);
              const {
                linkPreload,
                linkPrefetch
              } = _MiniCssExtractPlugin.getCompilationHooks(compilation);
              return Template.asString(['if (typeof document === "undefined") return;', `var createStylesheet = ${runtimeTemplate.basicFunction("chunkId, fullhref, oldTag, resolve, reject", ['var linkTag = document.createElement("link");', this.runtimeOptions.attributes ? Template.asString(Object.entries(this.runtimeOptions.attributes).map((entry) => {
                const [key, value] = entry;
                return `linkTag.setAttribute(${JSON.stringify(key)}, ${JSON.stringify(value)});`;
              })) : "", 'linkTag.rel = "stylesheet";', this.runtimeOptions.linkType ? `linkTag.type = ${JSON.stringify(this.runtimeOptions.linkType)};` : "", `if (${RuntimeGlobals.scriptNonce}) {`, Template.indent(`linkTag.nonce = ${RuntimeGlobals.scriptNonce};`), "}", `var onLinkComplete = ${runtimeTemplate.basicFunction("event", ["// avoid mem leaks.", "linkTag.onerror = linkTag.onload = null;", "if (event.type === 'load') {", Template.indent(["resolve();"]), "} else {", Template.indent([
                "var errorType = event && event.type;",
                "var realHref = event && event.target && event.target.href || fullhref;",
                'var err = new Error("Loading CSS chunk " + chunkId + " failed.\\n(" + errorType + ": " + realHref + ")");',
                'err.name = "ChunkLoadError";',
                // TODO remove `code` in the future major release to align with webpack
                'err.code = "CSS_CHUNK_LOAD_FAILED";',
                "err.type = errorType;",
                "err.request = realHref;",
                "if (linkTag.parentNode) linkTag.parentNode.removeChild(linkTag)",
                "reject(err);"
              ]), "}"])}`, "linkTag.onerror = linkTag.onload = onLinkComplete;", "linkTag.href = fullhref;", crossOriginLoading ? Template.asString(["if (linkTag.href.indexOf(window.location.origin + '/') !== 0) {", Template.indent(`linkTag.crossOrigin = ${JSON.stringify(crossOriginLoading)};`), "}"]) : "", _MiniCssExtractPlugin.getCompilationHooks(compilation).beforeTagInsert.call("", {
                tag: "linkTag",
                chunkId: "chunkId",
                href: "fullhref",
                resolve: "resolve",
                reject: "reject"
              }) || "", typeof this.runtimeOptions.insert !== "undefined" ? typeof this.runtimeOptions.insert === "function" ? `(${this.runtimeOptions.insert.toString()})(linkTag)` : Template.asString([`var target = document.querySelector("${this.runtimeOptions.insert}");`, "target.parentNode.insertBefore(linkTag, target.nextSibling);"]) : Template.asString(["if (oldTag) {", Template.indent(["oldTag.parentNode.insertBefore(linkTag, oldTag.nextSibling);"]), "} else {", Template.indent(["document.head.appendChild(linkTag);"]), "}"]), "return linkTag;"])};`, `var findStylesheet = ${runtimeTemplate.basicFunction("href, fullhref", ['var existingLinkTags = document.getElementsByTagName("link");', "for(var i = 0; i < existingLinkTags.length; i++) {", Template.indent(["var tag = existingLinkTags[i];", 'var dataHref = tag.getAttribute("data-href") || tag.getAttribute("href");', 'if(tag.rel === "stylesheet" && (dataHref === href || dataHref === fullhref)) return tag;']), "}", 'var existingStyleTags = document.getElementsByTagName("style");', "for(var i = 0; i < existingStyleTags.length; i++) {", Template.indent(["var tag = existingStyleTags[i];", 'var dataHref = tag.getAttribute("data-href");', "if(dataHref === href || dataHref === fullhref) return tag;"]), "}"])};`, `var loadStylesheet = ${runtimeTemplate.basicFunction("chunkId", `return new Promise(${runtimeTemplate.basicFunction("resolve, reject", [`var href = ${RuntimeGlobals.require}.miniCssF(chunkId);`, `var fullhref = ${RuntimeGlobals.publicPath} + href;`, "if(findStylesheet(href, fullhref)) return resolve();", "createStylesheet(chunkId, fullhref, null, resolve, reject);"])});`)}`, withLoading ? Template.asString(["// object to store loaded CSS chunks", "var installedCssChunks = {", Template.indent(
                /** @type {string[]} */
                /** @type {Chunk} */
                chunk.ids.map((id) => `${JSON.stringify(id)}: 0`).join(",\n")
              ), "};", "", `${RuntimeGlobals.ensureChunkHandlers}.miniCss = ${runtimeTemplate.basicFunction("chunkId, promises", [`var cssChunks = ${JSON.stringify(chunkMap)};`, "if(installedCssChunks[chunkId]) promises.push(installedCssChunks[chunkId]);", "else if(installedCssChunks[chunkId] !== 0 && cssChunks[chunkId]) {", Template.indent([`promises.push(installedCssChunks[chunkId] = loadStylesheet(chunkId).then(${runtimeTemplate.basicFunction("", "installedCssChunks[chunkId] = 0;")}, ${runtimeTemplate.basicFunction("e", ["delete installedCssChunks[chunkId];", "throw e;"])}));`]), "}"])};`]) : "// no chunk loading", "", withHmr ? Template.asString(["var oldTags = [];", "var newTags = [];", `var applyHandler = ${runtimeTemplate.basicFunction("options", [`return { dispose: ${runtimeTemplate.basicFunction("", ["for(var i = 0; i < oldTags.length; i++) {", Template.indent(["var oldTag = oldTags[i];", "if(oldTag.parentNode) oldTag.parentNode.removeChild(oldTag);"]), "}", "oldTags.length = 0;"])}, apply: ${runtimeTemplate.basicFunction("", ['for(var i = 0; i < newTags.length; i++) newTags[i].rel = "stylesheet";', "newTags.length = 0;"])} };`])}`, `${RuntimeGlobals.hmrDownloadUpdateHandlers}.miniCss = ${runtimeTemplate.basicFunction("chunkIds, removedChunks, removedModules, promises, applyHandlers, updatedModulesList", ["applyHandlers.push(applyHandler);", `chunkIds.forEach(${runtimeTemplate.basicFunction("chunkId", [`var href = ${RuntimeGlobals.require}.miniCssF(chunkId);`, `var fullhref = ${RuntimeGlobals.publicPath} + href;`, "var oldTag = findStylesheet(href, fullhref);", "if(!oldTag) return;", `promises.push(new Promise(${runtimeTemplate.basicFunction("resolve, reject", [`var tag = createStylesheet(chunkId, fullhref, oldTag, ${runtimeTemplate.basicFunction("", ['tag.as = "style";', 'tag.rel = "preload";', "resolve();"])}, reject);`, "oldTags.push(oldTag);", "newTags.push(tag);"])}));`])});`])}`]) : "// no hmr", "", withPrefetch && withLoading && hasCssMatcher !== false ? `${RuntimeGlobals.prefetchChunkHandlers}.miniCss = ${runtimeTemplate.basicFunction("chunkId", [`if((!${RuntimeGlobals.hasOwnProperty}(installedCssChunks, chunkId) || installedCssChunks[chunkId] === undefined) && ${hasCssMatcher === true ? "true" : hasCssMatcher("chunkId")}) {`, Template.indent(["installedCssChunks[chunkId] = null;", linkPrefetch.call(
                Template.asString(["var link = document.createElement('link');", crossOriginLoading ? `link.crossOrigin = ${JSON.stringify(crossOriginLoading)};` : "", `if (${RuntimeGlobals.scriptNonce}) {`, Template.indent(`link.setAttribute("nonce", ${RuntimeGlobals.scriptNonce});`), "}", 'link.rel = "prefetch";', 'link.as = "style";', `link.href = ${RuntimeGlobals.publicPath} + ${RuntimeGlobals.require}.miniCssF(chunkId);`]),
                /** @type {Chunk} */
                chunk
              ), "document.head.appendChild(link);"]), "}"])};` : "// no prefetching", "", withPreload && withLoading && hasCssMatcher !== false ? `${RuntimeGlobals.preloadChunkHandlers}.miniCss = ${runtimeTemplate.basicFunction("chunkId", [`if((!${RuntimeGlobals.hasOwnProperty}(installedCssChunks, chunkId) || installedCssChunks[chunkId] === undefined) && ${hasCssMatcher === true ? "true" : hasCssMatcher("chunkId")}) {`, Template.indent(["installedCssChunks[chunkId] = null;", linkPreload.call(
                Template.asString(["var link = document.createElement('link');", "link.charset = 'utf-8';", `if (${RuntimeGlobals.scriptNonce}) {`, Template.indent(`link.setAttribute("nonce", ${RuntimeGlobals.scriptNonce});`), "}", 'link.rel = "preload";', 'link.as = "style";', `link.href = ${RuntimeGlobals.publicPath} + ${RuntimeGlobals.require}.miniCssF(chunkId);`, crossOriginLoading ? crossOriginLoading === "use-credentials" ? 'link.crossOrigin = "use-credentials";' : Template.asString(["if (link.href.indexOf(window.location.origin + '/') !== 0) {", Template.indent(`link.crossOrigin = ${JSON.stringify(crossOriginLoading)};`), "}"]) : ""]),
                /** @type {Chunk} */
                chunk
              ), "document.head.appendChild(link);"]), "}"])};` : "// no preloaded"]);
            }
          }
          const enabledChunks = /* @__PURE__ */ new WeakSet();
          const handler = (chunk, set) => {
            if (enabledChunks.has(chunk)) {
              return;
            }
            enabledChunks.add(chunk);
            if (typeof normalizedChunkFilename === "string" && /\[(full)?hash(:\d+)?\]/.test(normalizedChunkFilename)) {
              set.add(RuntimeGlobals.getFullHash);
            }
            set.add(RuntimeGlobals.publicPath);
            compilation.addRuntimeModule(chunk, new runtime.GetChunkFilenameRuntimeModule(
              MODULE_TYPE,
              "mini-css",
              `${RuntimeGlobals.require}.miniCssF`,
              /**
               * @param {Chunk} referencedChunk a referenced chunk
               * @returns {ReturnType<import("webpack").runtime.GetChunkFilenameRuntimeModule["getFilenameForChunk"]>} a template value
               */
              (referencedChunk) => {
                if (!referencedChunk.contentHash[MODULE_TYPE]) {
                  return false;
                }
                return referencedChunk.canBeInitial() ? (
                  /** @type {Filename} */
                  normalizedFilename
                ) : (
                  /** @type {ChunkFilename} */
                  normalizedChunkFilename
                );
              },
              set.has(RuntimeGlobals.hmrDownloadUpdateHandlers)
            ));
            compilation.addRuntimeModule(chunk, new CssLoadingRuntimeModule(set, this.runtimeOptions));
          };
          compilation.hooks.runtimeRequirementInTree.for(RuntimeGlobals.ensureChunkHandlers).tap(pluginName, handler);
          compilation.hooks.runtimeRequirementInTree.for(RuntimeGlobals.hmrDownloadUpdateHandlers).tap(pluginName, handler);
          compilation.hooks.runtimeRequirementInTree.for(RuntimeGlobals.prefetchChunkHandlers).tap(pluginName, handler);
          compilation.hooks.runtimeRequirementInTree.for(RuntimeGlobals.preloadChunkHandlers).tap(pluginName, handler);
        });
      }
      /**
       * @private
       * @param {Chunk} chunk chunk
       * @param {ChunkGraph} chunkGraph chunk graph
       * @returns {Iterable<Module>} modules
       */
      getChunkModules(chunk, chunkGraph) {
        return typeof chunkGraph !== "undefined" ? chunkGraph.getOrderedChunkModulesIterable(chunk, compareModulesByIdentifier) : chunk.modulesIterable;
      }
      /**
       * @private
       * @param {Compilation} compilation compilation
       * @param {Chunk} chunk chunk
       * @param {CssModule[]} modules modules
       * @param {Compilation["requestShortener"]} requestShortener request shortener
       * @returns {Set<CssModule>} css modules
       */
      sortModules(compilation, chunk, modules, requestShortener) {
        let usedModules = this._sortedModulesCache.get(chunk);
        if (usedModules || !modules) {
          return (
            /** @type {Set<CssModule>} */
            usedModules
          );
        }
        const modulesList = [...modules];
        const moduleDependencies = new Map(modulesList.map((m) => [
          m,
          /** @type {Set<CssModule>} */
          /* @__PURE__ */ new Set()
        ]));
        const moduleDependenciesReasons = new Map(modulesList.map((m) => [m, /* @__PURE__ */ new Map()]));
        const modulesByChunkGroup = Array.from(chunk.groupsIterable, (chunkGroup) => {
          const sortedModules = modulesList.map((module2) => ({
            module: module2,
            index: chunkGroup.getModulePostOrderIndex(module2)
          })).filter((item) => item.index !== void 0).sort((a, b) => (
            /** @type {number} */
            b.index - /** @type {number} */
            a.index
          )).map((item) => item.module);
          for (let i = 0; i < sortedModules.length; i++) {
            const set = moduleDependencies.get(sortedModules[i]);
            const reasons = (
              /** @type {Map<CssModule, Set<ChunkGroup>>} */
              moduleDependenciesReasons.get(sortedModules[i])
            );
            for (let j = i + 1; j < sortedModules.length; j++) {
              const module2 = sortedModules[j];
              set.add(module2);
              const reason = reasons.get(module2) || /** @type {Set<ChunkGroup>} */
              /* @__PURE__ */ new Set();
              reason.add(chunkGroup);
              reasons.set(module2, reason);
            }
          }
          return sortedModules;
        });
        usedModules = /* @__PURE__ */ new Set();
        const unusedModulesFilter = (m) => !/** @type {Set<CssModule>} */
        usedModules.has(m);
        while (usedModules.size < modulesList.length) {
          let success = false;
          let bestMatch;
          let bestMatchDeps;
          for (const list of modulesByChunkGroup) {
            while (list.length > 0 && usedModules.has(list[list.length - 1])) {
              list.pop();
            }
            if (list.length !== 0) {
              const module2 = list[list.length - 1];
              const deps = (
                /** @type {Set<CssModule>} */
                moduleDependencies.get(module2)
              );
              const failedDeps = [...deps].filter(unusedModulesFilter);
              if (!bestMatchDeps || bestMatchDeps.length > failedDeps.length) {
                bestMatch = list;
                bestMatchDeps = failedDeps;
              }
              if (failedDeps.length === 0) {
                usedModules.add(
                  /** @type {CssModule} */
                  list.pop()
                );
                success = true;
                break;
              }
            }
          }
          if (!success) {
            const fallbackModule = (
              /** @type {CssModule[]} */
              bestMatch.pop()
            );
            if (!this.options.ignoreOrder) {
              const reasons = moduleDependenciesReasons.get(
                /** @type {CssModule} */
                fallbackModule
              );
              compilation.warnings.push(
                /** @type {WebpackError} */
                new Error([`chunk ${chunk.name || chunk.id} [${pluginName}]`, "Conflicting order. Following module has been added:", ` * ${/** @type {CssModule} */
                fallbackModule.readableIdentifier(requestShortener)}`, "despite it was not able to fulfill desired ordering with these modules:", .../** @type {CssModule[]} */
                bestMatchDeps.map((m) => {
                  const goodReasonsMap = moduleDependenciesReasons.get(m);
                  const goodReasons = goodReasonsMap && goodReasonsMap.get(
                    /** @type {CssModule} */
                    fallbackModule
                  );
                  const failedChunkGroups = Array.from(
                    /** @type {Set<ChunkGroup>} */
                    /** @type {Map<CssModule, Set<ChunkGroup>>} */
                    reasons.get(m),
                    (cg) => cg.name
                  ).join(", ");
                  const goodChunkGroups = goodReasons && Array.from(goodReasons, (cg) => cg.name).join(", ");
                  return [` * ${m.readableIdentifier(requestShortener)}`, `   - couldn't fulfill desired order of chunk group(s) ${failedChunkGroups}`, goodChunkGroups && `   - while fulfilling desired order of chunk group(s) ${goodChunkGroups}`].filter(Boolean).join("\n");
                })].join("\n"))
              );
            }
            usedModules.add(
              /** @type {CssModule} */
              fallbackModule
            );
          }
        }
        this._sortedModulesCache.set(chunk, usedModules);
        return usedModules;
      }
      /**
       * @private
       * @param {Compiler} compiler compiler
       * @param {Compilation} compilation compilation
       * @param {Chunk} chunk chunk
       * @param {CssModule[]} modules modules
       * @param {Compiler["requestShortener"]} requestShortener request shortener
       * @param {string} filenameTemplate filename template
       * @param {Parameters<Exclude<Required<Configuration>['output']['filename'], string | undefined>>[0]} pathData path data
       * @returns {Source} source
       */
      renderContentAsset(compiler, compilation, chunk, modules, requestShortener, filenameTemplate, pathData) {
        const usedModules = this.sortModules(compilation, chunk, modules, requestShortener);
        const {
          ConcatSource,
          SourceMapSource,
          RawSource
        } = compiler.webpack.sources;
        const source = new ConcatSource();
        const externalsSource = new ConcatSource();
        for (const module2 of usedModules) {
          let content = module2.content.toString();
          const readableIdentifier = module2.readableIdentifier(requestShortener);
          const startsWithAtRuleImport = content.startsWith("@import url");
          let header;
          if (compilation.outputOptions.pathinfo) {
            const reqStr = readableIdentifier.replace(/\*\//g, "*_/");
            const reqStrStar = "*".repeat(reqStr.length);
            const headerStr = `/*!****${reqStrStar}****!*\\
  !*** ${reqStr} ***!
  \\****${reqStrStar}****/
`;
            header = new RawSource(headerStr);
          }
          if (startsWithAtRuleImport) {
            if (typeof header !== "undefined") {
              externalsSource.add(header);
            }
            if (module2.media || module2.supports || typeof module2.layer === "string") {
              let atImportExtra = "";
              const needLayer = typeof module2.layer === "string";
              if (needLayer) {
                atImportExtra += module2.layer.length > 0 ? ` layer(${module2.layer})` : " layer";
              }
              if (module2.supports) {
                atImportExtra += ` supports(${module2.supports})`;
              }
              if (module2.media) {
                atImportExtra += ` ${module2.media}`;
              }
              content = content.replace(/;|\s*$/, `${atImportExtra};`);
            }
            externalsSource.add(content);
            externalsSource.add("\n");
          } else {
            if (typeof header !== "undefined") {
              source.add(header);
            }
            if (module2.supports) {
              source.add(`@supports (${module2.supports}) {
`);
            }
            if (module2.media) {
              source.add(`@media ${module2.media} {
`);
            }
            const needLayer = typeof module2.layer === "string";
            if (needLayer) {
              source.add(`@layer${module2.layer.length > 0 ? ` ${module2.layer}` : ""} {
`);
            }
            const {
              path: filename
            } = compilation.getPathWithInfo(filenameTemplate, pathData);
            const undoPath = getUndoPath(filename, compiler.outputPath, false);
            content = content.replace(new RegExp(ABSOLUTE_PUBLIC_PATH, "g"), "");
            content = content.replace(new RegExp(SINGLE_DOT_PATH_SEGMENT, "g"), ".");
            content = content.replace(new RegExp(AUTO_PUBLIC_PATH, "g"), undoPath);
            const entryOptions = chunk.getEntryOptions();
            const baseUriReplacement = entryOptions && entryOptions.baseUri || undoPath;
            content = content.replace(new RegExp(BASE_URI, "g"), baseUriReplacement);
            if (module2.sourceMap) {
              source.add(new SourceMapSource(content, readableIdentifier, module2.sourceMap.toString()));
            } else {
              source.add(new RawSource(content));
            }
            source.add("\n");
            if (needLayer) {
              source.add("}\n");
            }
            if (module2.media) {
              source.add("}\n");
            }
            if (module2.supports) {
              source.add("}\n");
            }
          }
        }
        return new ConcatSource(externalsSource, source);
      }
    };
    MiniCssExtractPlugin.pluginName = pluginName;
    MiniCssExtractPlugin.pluginSymbol = pluginSymbol;
    MiniCssExtractPlugin.loader = __require.resolve("./loader");
    module.exports = MiniCssExtractPlugin;
  }
});

export {
  __require,
  __commonJS,
  require_utils,
  require_dist
};
