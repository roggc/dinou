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
var __commonJS = (cb, mod) => function __require3() {
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

// ../node_modules/picomatch/lib/constants.js
var require_constants = __commonJS({
  "../node_modules/picomatch/lib/constants.js"(exports, module) {
    "use strict";
    var WIN_SLASH = "\\\\/";
    var WIN_NO_SLASH = `[^${WIN_SLASH}]`;
    var DEFAULT_MAX_EXTGLOB_RECURSION = 0;
    var DOT_LITERAL = "\\.";
    var PLUS_LITERAL = "\\+";
    var QMARK_LITERAL = "\\?";
    var SLASH_LITERAL = "\\/";
    var ONE_CHAR = "(?=.)";
    var QMARK = "[^/]";
    var END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
    var START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
    var DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
    var NO_DOT = `(?!${DOT_LITERAL})`;
    var NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
    var NO_DOT_SLASH = `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`;
    var NO_DOTS_SLASH = `(?!${DOTS_SLASH})`;
    var QMARK_NO_DOT = `[^.${SLASH_LITERAL}]`;
    var STAR = `${QMARK}*?`;
    var SEP = "/";
    var POSIX_CHARS = {
      DOT_LITERAL,
      PLUS_LITERAL,
      QMARK_LITERAL,
      SLASH_LITERAL,
      ONE_CHAR,
      QMARK,
      END_ANCHOR,
      DOTS_SLASH,
      NO_DOT,
      NO_DOTS,
      NO_DOT_SLASH,
      NO_DOTS_SLASH,
      QMARK_NO_DOT,
      STAR,
      START_ANCHOR,
      SEP
    };
    var WINDOWS_CHARS = {
      ...POSIX_CHARS,
      SLASH_LITERAL: `[${WIN_SLASH}]`,
      QMARK: WIN_NO_SLASH,
      STAR: `${WIN_NO_SLASH}*?`,
      DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
      NO_DOT: `(?!${DOT_LITERAL})`,
      NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
      NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
      NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
      QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
      START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
      END_ANCHOR: `(?:[${WIN_SLASH}]|$)`,
      SEP: "\\"
    };
    var POSIX_REGEX_SOURCE = {
      __proto__: null,
      alnum: "a-zA-Z0-9",
      alpha: "a-zA-Z",
      ascii: "\\x00-\\x7F",
      blank: " \\t",
      cntrl: "\\x00-\\x1F\\x7F",
      digit: "0-9",
      graph: "\\x21-\\x7E",
      lower: "a-z",
      print: "\\x20-\\x7E ",
      punct: "\\-!\"#$%&'()\\*+,./:;<=>?@[\\]^_`{|}~",
      space: " \\t\\r\\n\\v\\f",
      upper: "A-Z",
      word: "A-Za-z0-9_",
      xdigit: "A-Fa-f0-9"
    };
    module.exports = {
      DEFAULT_MAX_EXTGLOB_RECURSION,
      MAX_LENGTH: 1024 * 64,
      POSIX_REGEX_SOURCE,
      // regular expressions
      REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
      REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
      REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
      REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
      REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
      REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,
      // Replace globs with equivalent patterns to reduce parsing time.
      REPLACEMENTS: {
        __proto__: null,
        "***": "*",
        "**/**": "**",
        "**/**/**": "**"
      },
      // Digits
      CHAR_0: 48,
      /* 0 */
      CHAR_9: 57,
      /* 9 */
      // Alphabet chars.
      CHAR_UPPERCASE_A: 65,
      /* A */
      CHAR_LOWERCASE_A: 97,
      /* a */
      CHAR_UPPERCASE_Z: 90,
      /* Z */
      CHAR_LOWERCASE_Z: 122,
      /* z */
      CHAR_LEFT_PARENTHESES: 40,
      /* ( */
      CHAR_RIGHT_PARENTHESES: 41,
      /* ) */
      CHAR_ASTERISK: 42,
      /* * */
      // Non-alphabetic chars.
      CHAR_AMPERSAND: 38,
      /* & */
      CHAR_AT: 64,
      /* @ */
      CHAR_BACKWARD_SLASH: 92,
      /* \ */
      CHAR_CARRIAGE_RETURN: 13,
      /* \r */
      CHAR_CIRCUMFLEX_ACCENT: 94,
      /* ^ */
      CHAR_COLON: 58,
      /* : */
      CHAR_COMMA: 44,
      /* , */
      CHAR_DOT: 46,
      /* . */
      CHAR_DOUBLE_QUOTE: 34,
      /* " */
      CHAR_EQUAL: 61,
      /* = */
      CHAR_EXCLAMATION_MARK: 33,
      /* ! */
      CHAR_FORM_FEED: 12,
      /* \f */
      CHAR_FORWARD_SLASH: 47,
      /* / */
      CHAR_GRAVE_ACCENT: 96,
      /* ` */
      CHAR_HASH: 35,
      /* # */
      CHAR_HYPHEN_MINUS: 45,
      /* - */
      CHAR_LEFT_ANGLE_BRACKET: 60,
      /* < */
      CHAR_LEFT_CURLY_BRACE: 123,
      /* { */
      CHAR_LEFT_SQUARE_BRACKET: 91,
      /* [ */
      CHAR_LINE_FEED: 10,
      /* \n */
      CHAR_NO_BREAK_SPACE: 160,
      /* \u00A0 */
      CHAR_PERCENT: 37,
      /* % */
      CHAR_PLUS: 43,
      /* + */
      CHAR_QUESTION_MARK: 63,
      /* ? */
      CHAR_RIGHT_ANGLE_BRACKET: 62,
      /* > */
      CHAR_RIGHT_CURLY_BRACE: 125,
      /* } */
      CHAR_RIGHT_SQUARE_BRACKET: 93,
      /* ] */
      CHAR_SEMICOLON: 59,
      /* ; */
      CHAR_SINGLE_QUOTE: 39,
      /* ' */
      CHAR_SPACE: 32,
      /*   */
      CHAR_TAB: 9,
      /* \t */
      CHAR_UNDERSCORE: 95,
      /* _ */
      CHAR_VERTICAL_LINE: 124,
      /* | */
      CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279,
      /* \uFEFF */
      /**
       * Create EXTGLOB_CHARS
       */
      extglobChars(chars2) {
        return {
          "!": { type: "negate", open: "(?:(?!(?:", close: `))${chars2.STAR})` },
          "?": { type: "qmark", open: "(?:", close: ")?" },
          "+": { type: "plus", open: "(?:", close: ")+" },
          "*": { type: "star", open: "(?:", close: ")*" },
          "@": { type: "at", open: "(?:", close: ")" }
        };
      },
      /**
       * Create GLOB_CHARS
       */
      globChars(win322) {
        return win322 === true ? WINDOWS_CHARS : POSIX_CHARS;
      }
    };
  }
});

// ../node_modules/picomatch/lib/utils.js
var require_utils = __commonJS({
  "../node_modules/picomatch/lib/utils.js"(exports) {
    "use strict";
    var {
      REGEX_BACKSLASH,
      REGEX_REMOVE_BACKSLASH,
      REGEX_SPECIAL_CHARS,
      REGEX_SPECIAL_CHARS_GLOBAL
    } = require_constants();
    exports.isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
    exports.hasRegexChars = (str) => REGEX_SPECIAL_CHARS.test(str);
    exports.isRegexChar = (str) => str.length === 1 && exports.hasRegexChars(str);
    exports.escapeRegex = (str) => str.replace(REGEX_SPECIAL_CHARS_GLOBAL, "\\$1");
    exports.toPosixSlashes = (str) => str.replace(REGEX_BACKSLASH, "/");
    exports.isWindows = () => {
      if (typeof navigator !== "undefined" && navigator.platform) {
        const platform = navigator.platform.toLowerCase();
        return platform === "win32" || platform === "windows";
      }
      if (typeof process !== "undefined" && process.platform) {
        return process.platform === "win32";
      }
      return false;
    };
    exports.removeBackslashes = (str) => {
      return str.replace(REGEX_REMOVE_BACKSLASH, (match) => {
        return match === "\\" ? "" : match;
      });
    };
    exports.escapeLast = (input, char, lastIdx) => {
      const idx = input.lastIndexOf(char, lastIdx);
      if (idx === -1) return input;
      if (input[idx - 1] === "\\") return exports.escapeLast(input, char, idx - 1);
      return `${input.slice(0, idx)}\\${input.slice(idx)}`;
    };
    exports.removePrefix = (input, state = {}) => {
      let output = input;
      if (output.startsWith("./")) {
        output = output.slice(2);
        state.prefix = "./";
      }
      return output;
    };
    exports.wrapOutput = (input, state = {}, options = {}) => {
      const prepend = options.contains ? "" : "^";
      const append = options.contains ? "" : "$";
      let output = `${prepend}(?:${input})${append}`;
      if (state.negated === true) {
        output = `(?:^(?!${output}).*$)`;
      }
      return output;
    };
    exports.basename = (path, { windows } = {}) => {
      const segs = path.split(windows ? /[\\/]/ : "/");
      const last = segs[segs.length - 1];
      if (last === "") {
        return segs[segs.length - 2];
      }
      return last;
    };
  }
});

// ../node_modules/picomatch/lib/scan.js
var require_scan = __commonJS({
  "../node_modules/picomatch/lib/scan.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    var {
      CHAR_ASTERISK,
      /* * */
      CHAR_AT,
      /* @ */
      CHAR_BACKWARD_SLASH,
      /* \ */
      CHAR_COMMA,
      /* , */
      CHAR_DOT,
      /* . */
      CHAR_EXCLAMATION_MARK,
      /* ! */
      CHAR_FORWARD_SLASH,
      /* / */
      CHAR_LEFT_CURLY_BRACE,
      /* { */
      CHAR_LEFT_PARENTHESES,
      /* ( */
      CHAR_LEFT_SQUARE_BRACKET,
      /* [ */
      CHAR_PLUS,
      /* + */
      CHAR_QUESTION_MARK,
      /* ? */
      CHAR_RIGHT_CURLY_BRACE,
      /* } */
      CHAR_RIGHT_PARENTHESES,
      /* ) */
      CHAR_RIGHT_SQUARE_BRACKET
      /* ] */
    } = require_constants();
    var isPathSeparator = (code) => {
      return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
    };
    var depth = (token) => {
      if (token.isPrefix !== true) {
        token.depth = token.isGlobstar ? Infinity : 1;
      }
    };
    var scan = (input, options) => {
      const opts = options || {};
      const length = input.length - 1;
      const scanToEnd = opts.parts === true || opts.tokens === true || opts.scanToEnd === true;
      const slashes = [];
      const tokens = [];
      const parts = [];
      let str = input;
      let index = -1;
      let start = 0;
      let lastIndex = 0;
      let isBrace = false;
      let isBracket = false;
      let isGlob = false;
      let isExtglob = false;
      let isGlobstar = false;
      let braceEscaped = false;
      let backslashes = false;
      let negated = false;
      let negatedExtglob = false;
      let finished = false;
      let braces = 0;
      let prev;
      let code;
      let token = { value: "", depth: 0, isGlob: false };
      const eos = () => index >= length;
      const peek = () => str.charCodeAt(index + 1);
      const advance = () => {
        prev = code;
        return str.charCodeAt(++index);
      };
      while (index < length) {
        code = advance();
        let next;
        if (code === CHAR_BACKWARD_SLASH) {
          backslashes = token.backslashes = true;
          code = advance();
          if (code === CHAR_LEFT_CURLY_BRACE) {
            braceEscaped = true;
          }
          continue;
        }
        if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE) {
          braces++;
          while (eos() !== true && (code = advance())) {
            if (code === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              advance();
              continue;
            }
            if (code === CHAR_LEFT_CURLY_BRACE) {
              braces++;
              continue;
            }
            if (braceEscaped !== true && code === CHAR_DOT && (code = advance()) === CHAR_DOT) {
              isBrace = token.isBrace = true;
              isGlob = token.isGlob = true;
              finished = true;
              if (scanToEnd === true) {
                continue;
              }
              break;
            }
            if (braceEscaped !== true && code === CHAR_COMMA) {
              isBrace = token.isBrace = true;
              isGlob = token.isGlob = true;
              finished = true;
              if (scanToEnd === true) {
                continue;
              }
              break;
            }
            if (code === CHAR_RIGHT_CURLY_BRACE) {
              braces--;
              if (braces === 0) {
                braceEscaped = false;
                isBrace = token.isBrace = true;
                finished = true;
                break;
              }
            }
          }
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_FORWARD_SLASH) {
          slashes.push(index);
          tokens.push(token);
          token = { value: "", depth: 0, isGlob: false };
          if (finished === true) continue;
          if (prev === CHAR_DOT && index === start + 1) {
            start += 2;
            continue;
          }
          lastIndex = index + 1;
          continue;
        }
        if (opts.noext !== true) {
          const isExtglobChar = code === CHAR_PLUS || code === CHAR_AT || code === CHAR_ASTERISK || code === CHAR_QUESTION_MARK || code === CHAR_EXCLAMATION_MARK;
          if (isExtglobChar === true && peek() === CHAR_LEFT_PARENTHESES) {
            isGlob = token.isGlob = true;
            isExtglob = token.isExtglob = true;
            finished = true;
            if (code === CHAR_EXCLAMATION_MARK && index === start) {
              negatedExtglob = true;
            }
            if (scanToEnd === true) {
              let parens = 0;
              while (eos() !== true && (code = advance())) {
                if (code === CHAR_BACKWARD_SLASH) {
                  backslashes = token.backslashes = true;
                  advance();
                  continue;
                }
                if (code === CHAR_LEFT_PARENTHESES) {
                  parens++;
                  continue;
                }
                if (code === CHAR_RIGHT_PARENTHESES && --parens === 0) {
                  finished = true;
                  break;
                }
              }
              continue;
            }
            break;
          }
        }
        if (code === CHAR_ASTERISK) {
          if (prev === CHAR_ASTERISK) isGlobstar = token.isGlobstar = true;
          isGlob = token.isGlob = true;
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_QUESTION_MARK) {
          isGlob = token.isGlob = true;
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_LEFT_SQUARE_BRACKET) {
          while (eos() !== true && (next = advance())) {
            if (next === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              advance();
              continue;
            }
            if (next === CHAR_RIGHT_SQUARE_BRACKET) {
              isBracket = token.isBracket = true;
              isGlob = token.isGlob = true;
              finished = true;
              break;
            }
          }
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (opts.nonegate !== true && code === CHAR_EXCLAMATION_MARK && index === start) {
          negated = token.negated = true;
          start++;
          continue;
        }
        if (opts.noparen !== true && code === CHAR_LEFT_PARENTHESES) {
          isGlob = token.isGlob = true;
          if (scanToEnd === true) {
            let parens = 1;
            while (eos() !== true && (code = advance())) {
              if (code === CHAR_BACKWARD_SLASH) {
                backslashes = token.backslashes = true;
                advance();
                continue;
              }
              if (code === CHAR_LEFT_PARENTHESES) {
                parens++;
                continue;
              }
              if (code === CHAR_RIGHT_PARENTHESES && --parens === 0) {
                finished = true;
                break;
              }
            }
            continue;
          }
          break;
        }
        if (isGlob === true) {
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
      }
      if (opts.noext === true) {
        isExtglob = false;
        isGlob = false;
      }
      let base = str;
      let prefix = "";
      let glob = "";
      if (start > 0) {
        prefix = str.slice(0, start);
        str = str.slice(start);
        lastIndex -= start;
      }
      if (base && isGlob === true && lastIndex > 0) {
        base = str.slice(0, lastIndex);
        glob = str.slice(lastIndex);
      } else if (isGlob === true) {
        base = "";
        glob = str;
      } else {
        base = str;
      }
      if (base && base !== "" && base !== "/" && base !== str) {
        if (isPathSeparator(base.charCodeAt(base.length - 1))) {
          base = base.slice(0, -1);
        }
      }
      if (opts.unescape === true) {
        if (glob) glob = utils.removeBackslashes(glob);
        if (base && backslashes === true) {
          base = utils.removeBackslashes(base);
        }
      }
      const state = {
        prefix,
        input,
        start,
        base,
        glob,
        isBrace,
        isBracket,
        isGlob,
        isExtglob,
        isGlobstar,
        negated,
        negatedExtglob
      };
      if (opts.tokens === true) {
        state.maxDepth = 0;
        if (!isPathSeparator(code)) {
          tokens.push(token);
        }
        state.tokens = tokens;
      }
      if (opts.parts === true || opts.tokens === true) {
        let prevIndex;
        for (let idx = 0; idx < slashes.length; idx++) {
          const n3 = prevIndex !== void 0 ? prevIndex + 1 : start;
          const i = slashes[idx];
          const value2 = input.slice(n3, i);
          if (opts.tokens) {
            if (idx === 0 && start !== 0) {
              tokens[idx].isPrefix = true;
              tokens[idx].value = prefix;
            } else {
              tokens[idx].value = value2;
            }
            depth(tokens[idx]);
            state.maxDepth += tokens[idx].depth;
          }
          if (i >= start) {
            parts.push(value2);
            prevIndex = i;
          }
        }
        const n2 = prevIndex !== void 0 ? prevIndex + 1 : start;
        const value = input.slice(n2);
        parts.push(value);
        if (opts.tokens && prevIndex && prevIndex + 1 < input.length) {
          tokens[tokens.length - 1].value = value;
          depth(tokens[tokens.length - 1]);
          state.maxDepth += tokens[tokens.length - 1].depth;
        }
        state.slashes = slashes;
        state.parts = parts;
      }
      return state;
    };
    module.exports = scan;
  }
});

// ../node_modules/picomatch/lib/parse.js
var require_parse = __commonJS({
  "../node_modules/picomatch/lib/parse.js"(exports, module) {
    "use strict";
    var constants = require_constants();
    var utils = require_utils();
    var {
      MAX_LENGTH,
      POSIX_REGEX_SOURCE,
      REGEX_NON_SPECIAL_CHARS,
      REGEX_SPECIAL_CHARS_BACKREF,
      REPLACEMENTS
    } = constants;
    var expandRange = (args, options) => {
      if (typeof options.expandRange === "function") {
        return options.expandRange(...args, options);
      }
      args.sort();
      const value = `[${args.join("-")}]`;
      try {
        new RegExp(value);
      } catch (ex) {
        return args.map((v) => utils.escapeRegex(v)).join("..");
      }
      return value;
    };
    var syntaxError = (type, char) => {
      return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
    };
    var splitTopLevel = (input) => {
      const parts = [];
      let bracket = 0;
      let paren = 0;
      let quote = 0;
      let value = "";
      let escaped = false;
      for (const ch of input) {
        if (escaped === true) {
          value += ch;
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          value += ch;
          escaped = true;
          continue;
        }
        if (ch === '"') {
          quote = quote === 1 ? 0 : 1;
          value += ch;
          continue;
        }
        if (quote === 0) {
          if (ch === "[") {
            bracket++;
          } else if (ch === "]" && bracket > 0) {
            bracket--;
          } else if (bracket === 0) {
            if (ch === "(") {
              paren++;
            } else if (ch === ")" && paren > 0) {
              paren--;
            } else if (ch === "|" && paren === 0) {
              parts.push(value);
              value = "";
              continue;
            }
          }
        }
        value += ch;
      }
      parts.push(value);
      return parts;
    };
    var isPlainBranch = (branch) => {
      let escaped = false;
      for (const ch of branch) {
        if (escaped === true) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (/[?*+@!()[\]{}]/.test(ch)) {
          return false;
        }
      }
      return true;
    };
    var normalizeSimpleBranch = (branch) => {
      let value = branch.trim();
      let changed = true;
      while (changed === true) {
        changed = false;
        if (/^@\([^\\()[\]{}|]+\)$/.test(value)) {
          value = value.slice(2, -1);
          changed = true;
        }
      }
      if (!isPlainBranch(value)) {
        return;
      }
      return value.replace(/\\(.)/g, "$1");
    };
    var hasRepeatedCharPrefixOverlap = (branches) => {
      const values = branches.map(normalizeSimpleBranch).filter(Boolean);
      for (let i = 0; i < values.length; i++) {
        for (let j = i + 1; j < values.length; j++) {
          const a = values[i];
          const b = values[j];
          const char = a[0];
          if (!char || a !== char.repeat(a.length) || b !== char.repeat(b.length)) {
            continue;
          }
          if (a === b || a.startsWith(b) || b.startsWith(a)) {
            return true;
          }
        }
      }
      return false;
    };
    var parseRepeatedExtglob = (pattern, requireEnd = true) => {
      if (pattern[0] !== "+" && pattern[0] !== "*" || pattern[1] !== "(") {
        return;
      }
      let bracket = 0;
      let paren = 0;
      let quote = 0;
      let escaped = false;
      for (let i = 1; i < pattern.length; i++) {
        const ch = pattern[i];
        if (escaped === true) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (ch === '"') {
          quote = quote === 1 ? 0 : 1;
          continue;
        }
        if (quote === 1) {
          continue;
        }
        if (ch === "[") {
          bracket++;
          continue;
        }
        if (ch === "]" && bracket > 0) {
          bracket--;
          continue;
        }
        if (bracket > 0) {
          continue;
        }
        if (ch === "(") {
          paren++;
          continue;
        }
        if (ch === ")") {
          paren--;
          if (paren === 0) {
            if (requireEnd === true && i !== pattern.length - 1) {
              return;
            }
            return {
              type: pattern[0],
              body: pattern.slice(2, i),
              end: i
            };
          }
        }
      }
    };
    var buildCharClassStar = (chars2) => {
      const source = chars2.length === 1 ? utils.escapeRegex(chars2[0]) : `[${chars2.map((ch) => utils.escapeRegex(ch)).join("")}]`;
      return `${source}*`;
    };
    var getStarExtglobSequenceChars = (pattern) => {
      let index = 0;
      const chars2 = [];
      while (index < pattern.length) {
        const match = parseRepeatedExtglob(pattern.slice(index), false);
        if (!match || match.type !== "*") {
          return;
        }
        const branches = splitTopLevel(match.body).map((branch2) => branch2.trim());
        if (branches.length !== 1) {
          return;
        }
        const branch = normalizeSimpleBranch(branches[0]);
        if (!branch || branch.length !== 1) {
          return;
        }
        chars2.push(branch);
        index += match.end + 1;
      }
      if (chars2.length < 1) {
        return;
      }
      return chars2;
    };
    var repeatedExtglobRecursion = (pattern) => {
      let depth = 0;
      let value = pattern.trim();
      let match = parseRepeatedExtglob(value);
      while (match) {
        depth++;
        value = match.body.trim();
        match = parseRepeatedExtglob(value);
      }
      return depth;
    };
    var analyzeRepeatedExtglob = (body, options) => {
      if (options.maxExtglobRecursion === false) {
        return { risky: false };
      }
      const max = typeof options.maxExtglobRecursion === "number" ? options.maxExtglobRecursion : constants.DEFAULT_MAX_EXTGLOB_RECURSION;
      const branches = splitTopLevel(body).map((branch) => branch.trim());
      if (branches.length > 1) {
        if (branches.some((branch) => branch === "") || branches.some((branch) => /^[*?]+$/.test(branch)) || hasRepeatedCharPrefixOverlap(branches)) {
          return { risky: true };
        }
      }
      const safeChars = [];
      let sawStarSequence = false;
      let combinable = true;
      for (const branch of branches) {
        const chars2 = getStarExtglobSequenceChars(branch);
        if (chars2) {
          sawStarSequence = true;
          safeChars.push(...chars2);
          continue;
        }
        const literal = normalizeSimpleBranch(branch);
        if (literal && literal.length === 1) {
          safeChars.push(literal);
          continue;
        }
        combinable = false;
        if (repeatedExtglobRecursion(branch) > max) {
          return { risky: true };
        }
      }
      if (sawStarSequence) {
        return combinable ? { risky: true, safeOutput: buildCharClassStar([...new Set(safeChars)]) } : { risky: true };
      }
      return { risky: false };
    };
    var parse = (input, options) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected a string");
      }
      input = REPLACEMENTS[input] || input;
      const opts = { ...options };
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      let len = input.length;
      if (len > max) {
        throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
      }
      const bos = { type: "bos", value: "", output: opts.prepend || "" };
      const tokens = [bos];
      const capture = opts.capture ? "" : "?:";
      const PLATFORM_CHARS = constants.globChars(opts.windows);
      const EXTGLOB_CHARS = constants.extglobChars(PLATFORM_CHARS);
      const {
        DOT_LITERAL,
        PLUS_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOT_SLASH,
        NO_DOTS_SLASH,
        QMARK,
        QMARK_NO_DOT,
        STAR,
        START_ANCHOR
      } = PLATFORM_CHARS;
      const globstar = (opts2) => {
        return `(${capture}(?:(?!${START_ANCHOR}${opts2.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
      };
      const nodot = opts.dot ? "" : NO_DOT;
      const qmarkNoDot = opts.dot ? QMARK : QMARK_NO_DOT;
      let star = opts.bash === true ? globstar(opts) : STAR;
      if (opts.capture) {
        star = `(${star})`;
      }
      if (typeof opts.noext === "boolean") {
        opts.noextglob = opts.noext;
      }
      const state = {
        input,
        index: -1,
        start: 0,
        dot: opts.dot === true,
        consumed: "",
        output: "",
        prefix: "",
        backtrack: false,
        negated: false,
        brackets: 0,
        braces: 0,
        parens: 0,
        quotes: 0,
        globstar: false,
        tokens
      };
      input = utils.removePrefix(input, state);
      len = input.length;
      const extglobs = [];
      const braces = [];
      const stack = [];
      let prev = bos;
      let value;
      const eos = () => state.index === len - 1;
      const peek = state.peek = (n2 = 1) => input[state.index + n2];
      const advance = state.advance = () => input[++state.index] || "";
      const remaining = () => input.slice(state.index + 1);
      const consume = (value2 = "", num = 0) => {
        state.consumed += value2;
        state.index += num;
      };
      const append = (token) => {
        state.output += token.output != null ? token.output : token.value;
        consume(token.value);
      };
      const negate = () => {
        let count = 1;
        while (peek() === "!" && (peek(2) !== "(" || peek(3) === "?")) {
          advance();
          state.start++;
          count++;
        }
        if (count % 2 === 0) {
          return false;
        }
        state.negated = true;
        state.start++;
        return true;
      };
      const increment = (type) => {
        state[type]++;
        stack.push(type);
      };
      const decrement = (type) => {
        state[type]--;
        stack.pop();
      };
      const push = (tok) => {
        if (prev.type === "globstar") {
          const isBrace = state.braces > 0 && (tok.type === "comma" || tok.type === "brace");
          const isExtglob = tok.extglob === true || extglobs.length && (tok.type === "pipe" || tok.type === "paren");
          if (tok.type !== "slash" && tok.type !== "paren" && !isBrace && !isExtglob) {
            state.output = state.output.slice(0, -prev.output.length);
            prev.type = "star";
            prev.value = "*";
            prev.output = star;
            state.output += prev.output;
          }
        }
        if (extglobs.length && tok.type !== "paren") {
          extglobs[extglobs.length - 1].inner += tok.value;
        }
        if (tok.value || tok.output) append(tok);
        if (prev && prev.type === "text" && tok.type === "text") {
          prev.output = (prev.output || prev.value) + tok.value;
          prev.value += tok.value;
          return;
        }
        tok.prev = prev;
        tokens.push(tok);
        prev = tok;
      };
      const extglobOpen = (type, value2) => {
        const token = { ...EXTGLOB_CHARS[value2], conditions: 1, inner: "" };
        token.prev = prev;
        token.parens = state.parens;
        token.output = state.output;
        token.startIndex = state.index;
        token.tokensIndex = tokens.length;
        const output = (opts.capture ? "(" : "") + token.open;
        increment("parens");
        push({ type, value: value2, output: state.output ? "" : ONE_CHAR });
        push({ type: "paren", extglob: true, value: advance(), output });
        extglobs.push(token);
      };
      const extglobClose = (token) => {
        const literal = input.slice(token.startIndex, state.index + 1);
        const body = input.slice(token.startIndex + 2, state.index);
        const analysis = analyzeRepeatedExtglob(body, opts);
        if ((token.type === "plus" || token.type === "star") && analysis.risky) {
          const safeOutput = analysis.safeOutput ? (token.output ? "" : ONE_CHAR) + (opts.capture ? `(${analysis.safeOutput})` : analysis.safeOutput) : void 0;
          const open = tokens[token.tokensIndex];
          open.type = "text";
          open.value = literal;
          open.output = safeOutput || utils.escapeRegex(literal);
          for (let i = token.tokensIndex + 1; i < tokens.length; i++) {
            tokens[i].value = "";
            tokens[i].output = "";
            delete tokens[i].suffix;
          }
          state.output = token.output + open.output;
          state.backtrack = true;
          push({ type: "paren", extglob: true, value, output: "" });
          decrement("parens");
          return;
        }
        let output = token.close + (opts.capture ? ")" : "");
        let rest;
        if (token.type === "negate") {
          let extglobStar = star;
          if (token.inner && token.inner.length > 1 && token.inner.includes("/")) {
            extglobStar = globstar(opts);
          }
          if (extglobStar !== star || eos() || /^\)+$/.test(remaining())) {
            output = token.close = `)$))${extglobStar}`;
          }
          if (token.inner.includes("*") && (rest = remaining()) && /^\.[^\\/.]+$/.test(rest)) {
            const expression = parse(rest, { ...options, fastpaths: false }).output;
            output = token.close = `)${expression})${extglobStar})`;
          }
          if (token.prev.type === "bos") {
            state.negatedExtglob = true;
          }
        }
        push({ type: "paren", extglob: true, value, output });
        decrement("parens");
      };
      if (opts.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
        let backslashes = false;
        let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m, esc, chars2, first, rest, index) => {
          if (first === "\\") {
            backslashes = true;
            return m;
          }
          if (first === "?") {
            if (esc) {
              return esc + first + (rest ? QMARK.repeat(rest.length) : "");
            }
            if (index === 0) {
              return qmarkNoDot + (rest ? QMARK.repeat(rest.length) : "");
            }
            return QMARK.repeat(chars2.length);
          }
          if (first === ".") {
            return DOT_LITERAL.repeat(chars2.length);
          }
          if (first === "*") {
            if (esc) {
              return esc + first + (rest ? star : "");
            }
            return star;
          }
          return esc ? m : `\\${m}`;
        });
        if (backslashes === true) {
          if (opts.unescape === true) {
            output = output.replace(/\\/g, "");
          } else {
            output = output.replace(/\\+/g, (m) => {
              return m.length % 2 === 0 ? "\\\\" : m ? "\\" : "";
            });
          }
        }
        if (output === input && opts.contains === true) {
          state.output = input;
          return state;
        }
        state.output = utils.wrapOutput(output, state, options);
        return state;
      }
      while (!eos()) {
        value = advance();
        if (value === "\0") {
          continue;
        }
        if (value === "\\") {
          const next = peek();
          if (next === "/" && opts.bash !== true) {
            continue;
          }
          if (next === "." || next === ";") {
            continue;
          }
          if (!next) {
            value += "\\";
            push({ type: "text", value });
            continue;
          }
          const match = /^\\+/.exec(remaining());
          let slashes = 0;
          if (match && match[0].length > 2) {
            slashes = match[0].length;
            state.index += slashes;
            if (slashes % 2 !== 0) {
              value += "\\";
            }
          }
          if (opts.unescape === true) {
            value = advance();
          } else {
            value += advance();
          }
          if (state.brackets === 0) {
            push({ type: "text", value });
            continue;
          }
        }
        if (state.brackets > 0 && (value !== "]" || prev.value === "[" || prev.value === "[^")) {
          if (opts.posix !== false && value === ":") {
            const inner = prev.value.slice(1);
            if (inner.includes("[")) {
              prev.posix = true;
              if (inner.includes(":")) {
                const idx = prev.value.lastIndexOf("[");
                const pre = prev.value.slice(0, idx);
                const rest2 = prev.value.slice(idx + 2);
                const posix2 = POSIX_REGEX_SOURCE[rest2];
                if (posix2) {
                  prev.value = pre + posix2;
                  state.backtrack = true;
                  advance();
                  if (!bos.output && tokens.indexOf(prev) === 1) {
                    bos.output = ONE_CHAR;
                  }
                  continue;
                }
              }
            }
          }
          if (value === "[" && peek() !== ":" || value === "-" && peek() === "]") {
            value = `\\${value}`;
          }
          if (value === "]" && (prev.value === "[" || prev.value === "[^")) {
            value = `\\${value}`;
          }
          if (opts.posix === true && value === "!" && prev.value === "[") {
            value = "^";
          }
          prev.value += value;
          append({ value });
          continue;
        }
        if (state.quotes === 1 && value !== '"') {
          value = utils.escapeRegex(value);
          prev.value += value;
          append({ value });
          continue;
        }
        if (value === '"') {
          state.quotes = state.quotes === 1 ? 0 : 1;
          if (opts.keepQuotes === true) {
            push({ type: "text", value });
          }
          continue;
        }
        if (value === "(") {
          increment("parens");
          push({ type: "paren", value });
          continue;
        }
        if (value === ")") {
          if (state.parens === 0 && opts.strictBrackets === true) {
            throw new SyntaxError(syntaxError("opening", "("));
          }
          const extglob = extglobs[extglobs.length - 1];
          if (extglob && state.parens === extglob.parens + 1) {
            extglobClose(extglobs.pop());
            continue;
          }
          push({ type: "paren", value, output: state.parens ? ")" : "\\)" });
          decrement("parens");
          continue;
        }
        if (value === "[") {
          if (opts.nobracket === true || !remaining().includes("]")) {
            if (opts.nobracket !== true && opts.strictBrackets === true) {
              throw new SyntaxError(syntaxError("closing", "]"));
            }
            value = `\\${value}`;
          } else {
            increment("brackets");
          }
          push({ type: "bracket", value });
          continue;
        }
        if (value === "]") {
          if (opts.nobracket === true || prev && prev.type === "bracket" && prev.value.length === 1) {
            push({ type: "text", value, output: `\\${value}` });
            continue;
          }
          if (state.brackets === 0) {
            if (opts.strictBrackets === true) {
              throw new SyntaxError(syntaxError("opening", "["));
            }
            push({ type: "text", value, output: `\\${value}` });
            continue;
          }
          decrement("brackets");
          const prevValue = prev.value.slice(1);
          if (prev.posix !== true && prevValue[0] === "^" && !prevValue.includes("/")) {
            value = `/${value}`;
          }
          prev.value += value;
          append({ value });
          if (opts.literalBrackets === false || utils.hasRegexChars(prevValue)) {
            continue;
          }
          const escaped = utils.escapeRegex(prev.value);
          state.output = state.output.slice(0, -prev.value.length);
          if (opts.literalBrackets === true) {
            state.output += escaped;
            prev.value = escaped;
            continue;
          }
          prev.value = `(${capture}${escaped}|${prev.value})`;
          state.output += prev.value;
          continue;
        }
        if (value === "{" && opts.nobrace !== true) {
          increment("braces");
          const open = {
            type: "brace",
            value,
            output: "(",
            outputIndex: state.output.length,
            tokensIndex: state.tokens.length
          };
          braces.push(open);
          push(open);
          continue;
        }
        if (value === "}") {
          const brace = braces[braces.length - 1];
          if (opts.nobrace === true || !brace) {
            push({ type: "text", value, output: value });
            continue;
          }
          let output = ")";
          if (brace.dots === true) {
            const arr = tokens.slice();
            const range = [];
            for (let i = arr.length - 1; i >= 0; i--) {
              tokens.pop();
              if (arr[i].type === "brace") {
                break;
              }
              if (arr[i].type !== "dots") {
                range.unshift(arr[i].value);
              }
            }
            output = expandRange(range, opts);
            state.backtrack = true;
          }
          if (brace.comma !== true && brace.dots !== true) {
            const out = state.output.slice(0, brace.outputIndex);
            const toks = state.tokens.slice(brace.tokensIndex);
            brace.value = brace.output = "\\{";
            value = output = "\\}";
            state.output = out;
            for (const t of toks) {
              state.output += t.output || t.value;
            }
          }
          push({ type: "brace", value, output });
          decrement("braces");
          braces.pop();
          continue;
        }
        if (value === "|") {
          if (extglobs.length > 0) {
            extglobs[extglobs.length - 1].conditions++;
          }
          push({ type: "text", value });
          continue;
        }
        if (value === ",") {
          let output = value;
          const brace = braces[braces.length - 1];
          if (brace && stack[stack.length - 1] === "braces") {
            brace.comma = true;
            output = "|";
          }
          push({ type: "comma", value, output });
          continue;
        }
        if (value === "/") {
          if (prev.type === "dot" && state.index === state.start + 1) {
            state.start = state.index + 1;
            state.consumed = "";
            state.output = "";
            tokens.pop();
            prev = bos;
            continue;
          }
          push({ type: "slash", value, output: SLASH_LITERAL });
          continue;
        }
        if (value === ".") {
          if (state.braces > 0 && prev.type === "dot") {
            if (prev.value === ".") prev.output = DOT_LITERAL;
            const brace = braces[braces.length - 1];
            prev.type = "dots";
            prev.output += value;
            prev.value += value;
            brace.dots = true;
            continue;
          }
          if (state.braces + state.parens === 0 && prev.type !== "bos" && prev.type !== "slash") {
            push({ type: "text", value, output: DOT_LITERAL });
            continue;
          }
          push({ type: "dot", value, output: DOT_LITERAL });
          continue;
        }
        if (value === "?") {
          const isGroup = prev && prev.value === "(";
          if (!isGroup && opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            extglobOpen("qmark", value);
            continue;
          }
          if (prev && prev.type === "paren") {
            const next = peek();
            let output = value;
            if (prev.value === "(" && !/[!=<:]/.test(next) || next === "<" && !/<([!=]|\w+>)/.test(remaining())) {
              output = `\\${value}`;
            }
            push({ type: "text", value, output });
            continue;
          }
          if (opts.dot !== true && (prev.type === "slash" || prev.type === "bos")) {
            push({ type: "qmark", value, output: QMARK_NO_DOT });
            continue;
          }
          push({ type: "qmark", value, output: QMARK });
          continue;
        }
        if (value === "!") {
          if (opts.noextglob !== true && peek() === "(") {
            if (peek(2) !== "?" || !/[!=<:]/.test(peek(3))) {
              extglobOpen("negate", value);
              continue;
            }
          }
          if (opts.nonegate !== true && state.index === 0) {
            negate();
            continue;
          }
        }
        if (value === "+") {
          if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            extglobOpen("plus", value);
            continue;
          }
          if (prev && prev.value === "(" || opts.regex === false) {
            push({ type: "plus", value, output: PLUS_LITERAL });
            continue;
          }
          if (prev && (prev.type === "bracket" || prev.type === "paren" || prev.type === "brace") || state.parens > 0) {
            push({ type: "plus", value });
            continue;
          }
          push({ type: "plus", value: PLUS_LITERAL });
          continue;
        }
        if (value === "@") {
          if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            push({ type: "at", extglob: true, value, output: "" });
            continue;
          }
          push({ type: "text", value });
          continue;
        }
        if (value !== "*") {
          if (value === "$" || value === "^") {
            value = `\\${value}`;
          }
          const match = REGEX_NON_SPECIAL_CHARS.exec(remaining());
          if (match) {
            value += match[0];
            state.index += match[0].length;
          }
          push({ type: "text", value });
          continue;
        }
        if (prev && (prev.type === "globstar" || prev.star === true)) {
          prev.type = "star";
          prev.star = true;
          prev.value += value;
          prev.output = star;
          state.backtrack = true;
          state.globstar = true;
          consume(value);
          continue;
        }
        let rest = remaining();
        if (opts.noextglob !== true && /^\([^?]/.test(rest)) {
          extglobOpen("star", value);
          continue;
        }
        if (prev.type === "star") {
          if (opts.noglobstar === true) {
            consume(value);
            continue;
          }
          const prior = prev.prev;
          const before = prior.prev;
          const isStart = prior.type === "slash" || prior.type === "bos";
          const afterStar = before && (before.type === "star" || before.type === "globstar");
          if (opts.bash === true && (!isStart || rest[0] && rest[0] !== "/")) {
            push({ type: "star", value, output: "" });
            continue;
          }
          const isBrace = state.braces > 0 && (prior.type === "comma" || prior.type === "brace");
          const isExtglob = extglobs.length && (prior.type === "pipe" || prior.type === "paren");
          if (!isStart && prior.type !== "paren" && !isBrace && !isExtglob) {
            push({ type: "star", value, output: "" });
            continue;
          }
          while (rest.slice(0, 3) === "/**") {
            const after = input[state.index + 4];
            if (after && after !== "/") {
              break;
            }
            rest = rest.slice(3);
            consume("/**", 3);
          }
          const isEnd = eos() || state.parens > 0 && rest === ")".repeat(state.parens) && !extglobs.some((extglob) => extglob.type === "negate");
          if (prior.type === "bos" && eos()) {
            prev.type = "globstar";
            prev.value += value;
            prev.output = globstar(opts);
            state.output = prev.output;
            state.globstar = true;
            consume(value);
            continue;
          }
          if (prior.type === "slash" && prior.prev.type !== "bos" && !afterStar && isEnd) {
            state.output = state.output.slice(0, -(prior.output + prev.output).length);
            prior.output = `(?:${prior.output}`;
            prev.type = "globstar";
            prev.output = globstar(opts) + (opts.strictSlashes ? ")" : "|$)");
            prev.value += value;
            state.globstar = true;
            state.output += prior.output + prev.output;
            consume(value);
            continue;
          }
          if (prior.type === "slash" && prior.prev.type !== "bos" && rest[0] === "/") {
            const end = rest[1] !== void 0 ? "|$" : "";
            state.output = state.output.slice(0, -(prior.output + prev.output).length);
            prior.output = `(?:${prior.output}`;
            prev.type = "globstar";
            prev.output = `${globstar(opts)}${SLASH_LITERAL}|${SLASH_LITERAL}${end})`;
            prev.value += value;
            state.output += prior.output + prev.output;
            state.globstar = true;
            consume(value + advance());
            push({ type: "slash", value: "/", output: "" });
            continue;
          }
          if (prior.type === "bos" && rest[0] === "/") {
            prev.type = "globstar";
            prev.value += value;
            prev.output = `(?:^|${SLASH_LITERAL}|${globstar(opts)}${SLASH_LITERAL})`;
            state.output = prev.output;
            state.globstar = true;
            consume(value + advance());
            push({ type: "slash", value: "/", output: "" });
            continue;
          }
          state.output = state.output.slice(0, -prev.output.length);
          prev.type = "globstar";
          prev.output = globstar(opts);
          prev.value += value;
          state.output += prev.output;
          state.globstar = true;
          consume(value);
          continue;
        }
        const token = { type: "star", value, output: star };
        if (opts.bash === true) {
          token.output = ".*?";
          if (prev.type === "bos" || prev.type === "slash") {
            token.output = nodot + token.output;
          }
          push(token);
          continue;
        }
        if (prev && (prev.type === "bracket" || prev.type === "paren") && opts.regex === true) {
          token.output = value;
          push(token);
          continue;
        }
        if (state.index === state.start || prev.type === "slash" || prev.type === "dot") {
          if (prev.type === "dot") {
            state.output += NO_DOT_SLASH;
            prev.output += NO_DOT_SLASH;
          } else if (opts.dot === true) {
            state.output += NO_DOTS_SLASH;
            prev.output += NO_DOTS_SLASH;
          } else {
            state.output += nodot;
            prev.output += nodot;
          }
          if (peek() !== "*") {
            state.output += ONE_CHAR;
            prev.output += ONE_CHAR;
          }
        }
        push(token);
      }
      while (state.brackets > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "]"));
        state.output = utils.escapeLast(state.output, "[");
        decrement("brackets");
      }
      while (state.parens > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", ")"));
        state.output = utils.escapeLast(state.output, "(");
        decrement("parens");
      }
      while (state.braces > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "}"));
        state.output = utils.escapeLast(state.output, "{");
        decrement("braces");
      }
      if (opts.strictSlashes !== true && (prev.type === "star" || prev.type === "bracket")) {
        push({ type: "maybe_slash", value: "", output: `${SLASH_LITERAL}?` });
      }
      if (state.backtrack === true) {
        state.output = "";
        for (const token of state.tokens) {
          state.output += token.output != null ? token.output : token.value;
          if (token.suffix) {
            state.output += token.suffix;
          }
        }
      }
      return state;
    };
    parse.fastpaths = (input, options) => {
      const opts = { ...options };
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      const len = input.length;
      if (len > max) {
        throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
      }
      input = REPLACEMENTS[input] || input;
      const {
        DOT_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOTS,
        NO_DOTS_SLASH,
        STAR,
        START_ANCHOR
      } = constants.globChars(opts.windows);
      const nodot = opts.dot ? NO_DOTS : NO_DOT;
      const slashDot = opts.dot ? NO_DOTS_SLASH : NO_DOT;
      const capture = opts.capture ? "" : "?:";
      const state = { negated: false, prefix: "" };
      let star = opts.bash === true ? ".*?" : STAR;
      if (opts.capture) {
        star = `(${star})`;
      }
      const globstar = (opts2) => {
        if (opts2.noglobstar === true) return star;
        return `(${capture}(?:(?!${START_ANCHOR}${opts2.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
      };
      const create = (str) => {
        switch (str) {
          case "*":
            return `${nodot}${ONE_CHAR}${star}`;
          case ".*":
            return `${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "*.*":
            return `${nodot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "*/*":
            return `${nodot}${star}${SLASH_LITERAL}${ONE_CHAR}${slashDot}${star}`;
          case "**":
            return nodot + globstar(opts);
          case "**/*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${ONE_CHAR}${star}`;
          case "**/*.*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "**/.*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${DOT_LITERAL}${ONE_CHAR}${star}`;
          default: {
            const match = /^(.*?)\.(\w+)$/.exec(str);
            if (!match) return;
            const source2 = create(match[1]);
            if (!source2) return;
            return source2 + DOT_LITERAL + match[2];
          }
        }
      };
      const output = utils.removePrefix(input, state);
      let source = create(output);
      if (source && opts.strictSlashes !== true) {
        source += `${SLASH_LITERAL}?`;
      }
      return source;
    };
    module.exports = parse;
  }
});

// ../node_modules/picomatch/lib/picomatch.js
var require_picomatch = __commonJS({
  "../node_modules/picomatch/lib/picomatch.js"(exports, module) {
    "use strict";
    var scan = require_scan();
    var parse = require_parse();
    var utils = require_utils();
    var constants = require_constants();
    var isObject2 = (val) => val && typeof val === "object" && !Array.isArray(val);
    var picomatch = (glob, options, returnState = false) => {
      if (Array.isArray(glob)) {
        const fns = glob.map((input) => picomatch(input, options, returnState));
        const arrayMatcher = (str) => {
          for (const isMatch of fns) {
            const state2 = isMatch(str);
            if (state2) return state2;
          }
          return false;
        };
        return arrayMatcher;
      }
      const isState = isObject2(glob) && glob.tokens && glob.input;
      if (glob === "" || typeof glob !== "string" && !isState) {
        throw new TypeError("Expected pattern to be a non-empty string");
      }
      const opts = options || {};
      const posix2 = opts.windows;
      const regex = isState ? picomatch.compileRe(glob, options) : picomatch.makeRe(glob, options, false, true);
      const state = regex.state;
      delete regex.state;
      let isIgnored = () => false;
      if (opts.ignore) {
        const ignoreOpts = { ...options, ignore: null, onMatch: null, onResult: null };
        isIgnored = picomatch(opts.ignore, ignoreOpts, returnState);
      }
      const matcher = (input, returnObject = false) => {
        const { isMatch, match, output } = picomatch.test(input, regex, options, { glob, posix: posix2 });
        const result = { glob, state, regex, posix: posix2, input, output, match, isMatch };
        if (typeof opts.onResult === "function") {
          opts.onResult(result);
        }
        if (isMatch === false) {
          result.isMatch = false;
          return returnObject ? result : false;
        }
        if (isIgnored(input)) {
          if (typeof opts.onIgnore === "function") {
            opts.onIgnore(result);
          }
          result.isMatch = false;
          return returnObject ? result : false;
        }
        if (typeof opts.onMatch === "function") {
          opts.onMatch(result);
        }
        return returnObject ? result : true;
      };
      if (returnState) {
        matcher.state = state;
      }
      return matcher;
    };
    picomatch.test = (input, regex, options, { glob, posix: posix2 } = {}) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected input to be a string");
      }
      if (input === "") {
        return { isMatch: false, output: "" };
      }
      const opts = options || {};
      const format = opts.format || (posix2 ? utils.toPosixSlashes : null);
      let match = input === glob;
      let output = match && format ? format(input) : input;
      if (match === false) {
        output = format ? format(input) : input;
        match = output === glob;
      }
      if (match === false || opts.capture === true) {
        if (opts.matchBase === true || opts.basename === true) {
          match = picomatch.matchBase(input, regex, options, posix2);
        } else {
          match = regex.exec(output);
        }
      }
      return { isMatch: Boolean(match), match, output };
    };
    picomatch.matchBase = (input, glob, options, posix2 = options && options.windows) => {
      const regex = glob instanceof RegExp ? glob : picomatch.makeRe(glob, options);
      return regex.test(utils.basename(input, { windows: posix2 }));
    };
    picomatch.isMatch = (str, patterns, options) => picomatch(patterns, options)(str);
    picomatch.parse = (pattern, options) => {
      if (Array.isArray(pattern)) return pattern.map((p) => picomatch.parse(p, options));
      return parse(pattern, { ...options, fastpaths: false });
    };
    picomatch.scan = (input, options) => scan(input, options);
    picomatch.compileRe = (state, options, returnOutput = false, returnState = false) => {
      if (returnOutput === true) {
        return state.output;
      }
      const opts = options || {};
      const prepend = opts.contains ? "" : "^";
      const append = opts.contains ? "" : "$";
      let source = `${prepend}(?:${state.output})${append}`;
      if (state && state.negated === true) {
        source = `^(?!${source}).*$`;
      }
      const regex = picomatch.toRegex(source, options);
      if (returnState === true) {
        regex.state = state;
      }
      return regex;
    };
    picomatch.makeRe = (input, options = {}, returnOutput = false, returnState = false) => {
      if (!input || typeof input !== "string") {
        throw new TypeError("Expected a non-empty string");
      }
      let parsed = { negated: false, fastpaths: true };
      if (options.fastpaths !== false && (input[0] === "." || input[0] === "*")) {
        parsed.output = parse.fastpaths(input, options);
      }
      if (!parsed.output) {
        parsed = parse(input, options);
      }
      return picomatch.compileRe(parsed, options, returnOutput, returnState);
    };
    picomatch.toRegex = (source, options) => {
      try {
        const opts = options || {};
        return new RegExp(source, opts.flags || (opts.nocase ? "i" : ""));
      } catch (err) {
        if (options && options.debug === true) throw err;
        return /$^/;
      }
    };
    picomatch.constants = constants;
    module.exports = picomatch;
  }
});

// ../node_modules/picomatch/index.js
var require_picomatch2 = __commonJS({
  "../node_modules/picomatch/index.js"(exports, module) {
    "use strict";
    var pico = require_picomatch();
    var utils = require_utils();
    function picomatch(glob, options, returnState = false) {
      if (options && (options.windows === null || options.windows === void 0)) {
        options = { ...options, windows: utils.isWindows() };
      }
      return pico(glob, options, returnState);
    }
    Object.assign(picomatch, pico);
    module.exports = picomatch;
  }
});

// ../node_modules/commondir/index.js
var require_commondir = __commonJS({
  "../node_modules/commondir/index.js"(exports, module) {
    var path = __require("path");
    module.exports = function(basedir, relfiles) {
      if (relfiles) {
        var files = relfiles.map(function(r) {
          return path.resolve(basedir, r);
        });
      } else {
        var files = basedir;
      }
      var res = files.slice(1).reduce(function(ps, file) {
        if (!file.match(/^([A-Za-z]:)?\/|\\/)) {
          throw new Error("relative path without a basedir");
        }
        var xs = file.split(/\/+|\\+/);
        for (var i = 0; ps[i] === xs[i] && i < Math.min(ps.length, xs.length); i++) ;
        return ps.slice(0, i);
      }, files[0].split(/\/+|\\+/));
      return res.length > 1 ? res.join("/") : "/";
    };
  }
});

// ../node_modules/is-reference/dist/is-reference.js
var require_is_reference = __commonJS({
  "../node_modules/is-reference/dist/is-reference.js"(exports, module) {
    (function(global, factory) {
      typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = global || self, global.isReference = factory());
    })(exports, (function() {
      "use strict";
      function isReference2(node, parent) {
        if (node.type === "MemberExpression") {
          return !node.computed && isReference2(node.object, node);
        }
        if (node.type === "Identifier") {
          if (!parent)
            return true;
          switch (parent.type) {
            // disregard `bar` in `foo.bar`
            case "MemberExpression":
              return parent.computed || node === parent.object;
            // disregard the `foo` in `class {foo(){}}` but keep it in `class {[foo](){}}`
            case "MethodDefinition":
              return parent.computed;
            // disregard the `foo` in `class {foo=bar}` but keep it in `class {[foo]=bar}` and `class {bar=foo}`
            case "FieldDefinition":
              return parent.computed || node === parent.value;
            // disregard the `bar` in `{ bar: foo }`, but keep it in `{ [bar]: foo }`
            case "Property":
              return parent.computed || node === parent.value;
            // disregard the `bar` in `export { foo as bar }` or
            // the foo in `import { foo as bar }`
            case "ExportSpecifier":
            case "ImportSpecifier":
              return node === parent.local;
            // disregard the `foo` in `foo: while (...) { ... break foo; ... continue foo;}`
            case "LabeledStatement":
            case "BreakStatement":
            case "ContinueStatement":
              return false;
            default:
              return true;
          }
        }
        return false;
      }
      return isReference2;
    }));
  }
});

// ../node_modules/@rollup/plugin-commonjs/dist/es/index.js
import { basename as basename2, extname as extname2, dirname as dirname2, relative as relative2, resolve as resolve3, join, sep as sep2 } from "path";

// ../node_modules/@rollup/pluginutils/dist/es/index.js
import { extname, win32, posix, isAbsolute, resolve } from "path";

// ../node_modules/estree-walker/dist/esm/estree-walker.js
var WalkerBase = class {
  constructor() {
    this.should_skip = false;
    this.should_remove = false;
    this.replacement = null;
    this.context = {
      skip: () => this.should_skip = true,
      remove: () => this.should_remove = true,
      replace: (node) => this.replacement = node
    };
  }
  /**
   *
   * @param {any} parent
   * @param {string} prop
   * @param {number} index
   * @param {BaseNode} node
   */
  replace(parent, prop, index, node) {
    if (parent) {
      if (index !== null) {
        parent[prop][index] = node;
      } else {
        parent[prop] = node;
      }
    }
  }
  /**
   *
   * @param {any} parent
   * @param {string} prop
   * @param {number} index
   */
  remove(parent, prop, index) {
    if (parent) {
      if (index !== null) {
        parent[prop].splice(index, 1);
      } else {
        delete parent[prop];
      }
    }
  }
};
var SyncWalker = class extends WalkerBase {
  /**
   *
   * @param {SyncHandler} enter
   * @param {SyncHandler} leave
   */
  constructor(enter, leave) {
    super();
    this.enter = enter;
    this.leave = leave;
  }
  /**
   *
   * @param {BaseNode} node
   * @param {BaseNode} parent
   * @param {string} [prop]
   * @param {number} [index]
   * @returns {BaseNode}
   */
  visit(node, parent, prop, index) {
    if (node) {
      if (this.enter) {
        const _should_skip = this.should_skip;
        const _should_remove = this.should_remove;
        const _replacement = this.replacement;
        this.should_skip = false;
        this.should_remove = false;
        this.replacement = null;
        this.enter.call(this.context, node, parent, prop, index);
        if (this.replacement) {
          node = this.replacement;
          this.replace(parent, prop, index, node);
        }
        if (this.should_remove) {
          this.remove(parent, prop, index);
        }
        const skipped = this.should_skip;
        const removed = this.should_remove;
        this.should_skip = _should_skip;
        this.should_remove = _should_remove;
        this.replacement = _replacement;
        if (skipped) return node;
        if (removed) return null;
      }
      for (const key in node) {
        const value = node[key];
        if (typeof value !== "object") {
          continue;
        } else if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i += 1) {
            if (value[i] !== null && typeof value[i].type === "string") {
              if (!this.visit(value[i], node, key, i)) {
                i--;
              }
            }
          }
        } else if (value !== null && typeof value.type === "string") {
          this.visit(value, node, key, null);
        }
      }
      if (this.leave) {
        const _replacement = this.replacement;
        const _should_remove = this.should_remove;
        this.replacement = null;
        this.should_remove = false;
        this.leave.call(this.context, node, parent, prop, index);
        if (this.replacement) {
          node = this.replacement;
          this.replace(parent, prop, index, node);
        }
        if (this.should_remove) {
          this.remove(parent, prop, index);
        }
        const removed = this.should_remove;
        this.replacement = _replacement;
        this.should_remove = _should_remove;
        if (removed) return null;
      }
    }
    return node;
  }
};
function walk(ast, { enter, leave }) {
  const instance = new SyncWalker(enter, leave);
  return instance.visit(ast, null);
}

// ../node_modules/@rollup/pluginutils/dist/es/index.js
var import_picomatch = __toESM(require_picomatch2(), 1);
var extractors = {
  ArrayPattern(names, param) {
    for (const element of param.elements) {
      if (element)
        extractors[element.type](names, element);
    }
  },
  AssignmentPattern(names, param) {
    extractors[param.left.type](names, param.left);
  },
  Identifier(names, param) {
    names.push(param.name);
  },
  MemberExpression() {
  },
  ObjectPattern(names, param) {
    for (const prop of param.properties) {
      if (prop.type === "RestElement") {
        extractors.RestElement(names, prop);
      } else {
        extractors[prop.value.type](names, prop.value);
      }
    }
  },
  RestElement(names, param) {
    extractors[param.argument.type](names, param.argument);
  }
};
var extractAssignedNames = function extractAssignedNames2(param) {
  const names = [];
  extractors[param.type](names, param);
  return names;
};
var blockDeclarations = {
  const: true,
  let: true
};
var Scope = class {
  constructor(options = {}) {
    this.parent = options.parent;
    this.isBlockScope = !!options.block;
    this.declarations = /* @__PURE__ */ Object.create(null);
    if (options.params) {
      options.params.forEach((param) => {
        extractAssignedNames(param).forEach((name) => {
          this.declarations[name] = true;
        });
      });
    }
  }
  addDeclaration(node, isBlockDeclaration, isVar) {
    if (!isBlockDeclaration && this.isBlockScope) {
      this.parent.addDeclaration(node, isBlockDeclaration, isVar);
    } else if (node.id) {
      extractAssignedNames(node.id).forEach((name) => {
        this.declarations[name] = true;
      });
    }
  }
  contains(name) {
    return this.declarations[name] || (this.parent ? this.parent.contains(name) : false);
  }
};
var attachScopes = function attachScopes2(ast, propertyName = "scope") {
  let scope = new Scope();
  walk(ast, {
    enter(n2, parent) {
      const node = n2;
      if (/(?:Function|Class)Declaration/.test(node.type)) {
        scope.addDeclaration(node, false, false);
      }
      if (node.type === "VariableDeclaration") {
        const { kind } = node;
        const isBlockDeclaration = blockDeclarations[kind];
        node.declarations.forEach((declaration) => {
          scope.addDeclaration(declaration, isBlockDeclaration, true);
        });
      }
      let newScope;
      if (node.type.includes("Function")) {
        const func = node;
        newScope = new Scope({
          parent: scope,
          block: false,
          params: func.params
        });
        if (func.type === "FunctionExpression" && func.id) {
          newScope.addDeclaration(func, false, false);
        }
      }
      if (/For(?:In|Of)?Statement/.test(node.type)) {
        newScope = new Scope({
          parent: scope,
          block: true
        });
      }
      if (node.type === "BlockStatement" && !parent.type.includes("Function")) {
        newScope = new Scope({
          parent: scope,
          block: true
        });
      }
      if (node.type === "CatchClause") {
        newScope = new Scope({
          parent: scope,
          params: node.param ? [node.param] : [],
          block: true
        });
      }
      if (newScope) {
        Object.defineProperty(node, propertyName, {
          value: newScope,
          configurable: true
        });
        scope = newScope;
      }
    },
    leave(n2) {
      const node = n2;
      if (node[propertyName])
        scope = scope.parent;
    }
  });
  return scope;
};
function isArray(arg) {
  return Array.isArray(arg);
}
function ensureArray(thing) {
  if (isArray(thing))
    return thing;
  if (thing == null)
    return [];
  return [thing];
}
var normalizePathRegExp = new RegExp(`\\${win32.sep}`, "g");
var normalizePath = function normalizePath2(filename) {
  return filename.replace(normalizePathRegExp, posix.sep);
};
function getMatcherString(id, resolutionBase) {
  if (resolutionBase === false || isAbsolute(id) || id.startsWith("**")) {
    return normalizePath(id);
  }
  const basePath = normalizePath(resolve(resolutionBase || "")).replace(/[-^$*+?.()|[\]{}]/g, "\\$&");
  return posix.join(basePath, normalizePath(id));
}
var createFilter = function createFilter2(include, exclude, options) {
  const resolutionBase = options && options.resolve;
  const getMatcher = (id) => id instanceof RegExp ? id : {
    test: (what) => {
      const pattern = getMatcherString(id, resolutionBase);
      const fn = (0, import_picomatch.default)(pattern, { dot: true });
      const result = fn(what);
      return result;
    }
  };
  const includeMatchers = ensureArray(include).map(getMatcher);
  const excludeMatchers = ensureArray(exclude).map(getMatcher);
  if (!includeMatchers.length && !excludeMatchers.length)
    return (id) => typeof id === "string" && !id.includes("\0");
  return function result(id) {
    if (typeof id !== "string")
      return false;
    if (id.includes("\0"))
      return false;
    const pathId = normalizePath(id);
    for (let i = 0; i < excludeMatchers.length; ++i) {
      const matcher = excludeMatchers[i];
      if (matcher instanceof RegExp) {
        matcher.lastIndex = 0;
      }
      if (matcher.test(pathId))
        return false;
    }
    for (let i = 0; i < includeMatchers.length; ++i) {
      const matcher = includeMatchers[i];
      if (matcher instanceof RegExp) {
        matcher.lastIndex = 0;
      }
      if (matcher.test(pathId))
        return true;
    }
    return !includeMatchers.length;
  };
};
var reservedWords = "break case class catch const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield enum await implements package protected static interface private public";
var builtins = "arguments Infinity NaN undefined null true false eval uneval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent encodeURI encodeURIComponent escape unescape Object Function Boolean Symbol Error EvalError InternalError RangeError ReferenceError SyntaxError TypeError URIError Number Math Date String RegExp Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array Map Set WeakMap WeakSet SIMD ArrayBuffer DataView JSON Promise Generator GeneratorFunction Reflect Proxy Intl";
var forbiddenIdentifiers = new Set(`${reservedWords} ${builtins}`.split(" "));
forbiddenIdentifiers.add("");
var makeLegalIdentifier = function makeLegalIdentifier2(str) {
  let identifier = str.replace(/-(\w)/g, (_, letter) => letter.toUpperCase()).replace(/[^$_a-zA-Z0-9]/g, "_");
  if (/\d/.test(identifier[0]) || forbiddenIdentifiers.has(identifier)) {
    identifier = `_${identifier}`;
  }
  return identifier || "_";
};
var hasStringIsWellFormed = "isWellFormed" in String.prototype;

// ../node_modules/@rollup/plugin-commonjs/dist/es/index.js
var import_commondir = __toESM(require_commondir(), 1);
import { existsSync, readFileSync, statSync } from "fs";

// ../node_modules/fdir/dist/index.mjs
import { createRequire } from "module";
import { basename, dirname, normalize, relative, resolve as resolve2, sep } from "path";
import * as nativeFs from "fs";
var __require2 = /* @__PURE__ */ createRequire(import.meta.url);
function cleanPath(path) {
  let normalized = normalize(path);
  if (normalized.length > 1 && normalized[normalized.length - 1] === sep) normalized = normalized.substring(0, normalized.length - 1);
  return normalized;
}
var SLASHES_REGEX = /[\\/]/g;
function convertSlashes(path, separator) {
  return path.replace(SLASHES_REGEX, separator);
}
var WINDOWS_ROOT_DIR_REGEX = /^[a-z]:[\\/]$/i;
function isRootDirectory(path) {
  return path === "/" || WINDOWS_ROOT_DIR_REGEX.test(path);
}
function normalizePath3(path, options) {
  const { resolvePaths, normalizePath: normalizePath$1, pathSeparator } = options;
  const pathNeedsCleaning = process.platform === "win32" && path.includes("/") || path.startsWith(".");
  if (resolvePaths) path = resolve2(path);
  if (normalizePath$1 || pathNeedsCleaning) path = cleanPath(path);
  if (path === ".") return "";
  const needsSeperator = path[path.length - 1] !== pathSeparator;
  return convertSlashes(needsSeperator ? path + pathSeparator : path, pathSeparator);
}
function joinPathWithBasePath(filename, directoryPath) {
  return directoryPath + filename;
}
function joinPathWithRelativePath(root, options) {
  return function(filename, directoryPath) {
    const sameRoot = directoryPath.startsWith(root);
    if (sameRoot) return directoryPath.slice(root.length) + filename;
    else return convertSlashes(relative(root, directoryPath), options.pathSeparator) + options.pathSeparator + filename;
  };
}
function joinPath(filename) {
  return filename;
}
function joinDirectoryPath(filename, directoryPath, separator) {
  return directoryPath + filename + separator;
}
function build$7(root, options) {
  const { relativePaths, includeBasePath } = options;
  return relativePaths && root ? joinPathWithRelativePath(root, options) : includeBasePath ? joinPathWithBasePath : joinPath;
}
function pushDirectoryWithRelativePath(root) {
  return function(directoryPath, paths) {
    paths.push(directoryPath.substring(root.length) || ".");
  };
}
function pushDirectoryFilterWithRelativePath(root) {
  return function(directoryPath, paths, filters) {
    const relativePath = directoryPath.substring(root.length) || ".";
    if (filters.every((filter) => filter(relativePath, true))) paths.push(relativePath);
  };
}
var pushDirectory = (directoryPath, paths) => {
  paths.push(directoryPath || ".");
};
var pushDirectoryFilter = (directoryPath, paths, filters) => {
  const path = directoryPath || ".";
  if (filters.every((filter) => filter(path, true))) paths.push(path);
};
var empty$2 = () => {
};
function build$6(root, options) {
  const { includeDirs, filters, relativePaths } = options;
  if (!includeDirs) return empty$2;
  if (relativePaths) return filters && filters.length ? pushDirectoryFilterWithRelativePath(root) : pushDirectoryWithRelativePath(root);
  return filters && filters.length ? pushDirectoryFilter : pushDirectory;
}
var pushFileFilterAndCount = (filename, _paths, counts, filters) => {
  if (filters.every((filter) => filter(filename, false))) counts.files++;
};
var pushFileFilter = (filename, paths, _counts, filters) => {
  if (filters.every((filter) => filter(filename, false))) paths.push(filename);
};
var pushFileCount = (_filename, _paths, counts, _filters) => {
  counts.files++;
};
var pushFile = (filename, paths) => {
  paths.push(filename);
};
var empty$1 = () => {
};
function build$5(options) {
  const { excludeFiles, filters, onlyCounts } = options;
  if (excludeFiles) return empty$1;
  if (filters && filters.length) return onlyCounts ? pushFileFilterAndCount : pushFileFilter;
  else if (onlyCounts) return pushFileCount;
  else return pushFile;
}
var getArray = (paths) => {
  return paths;
};
var getArrayGroup = () => {
  return [""].slice(0, 0);
};
function build$4(options) {
  return options.group ? getArrayGroup : getArray;
}
var groupFiles = (groups, directory, files) => {
  groups.push({
    directory,
    files,
    dir: directory
  });
};
var empty = () => {
};
function build$3(options) {
  return options.group ? groupFiles : empty;
}
var resolveSymlinksAsync = function(path, state, callback$1) {
  const { queue, fs, options: { suppressErrors } } = state;
  queue.enqueue();
  fs.realpath(path, (error, resolvedPath) => {
    if (error) return queue.dequeue(suppressErrors ? null : error, state);
    fs.stat(resolvedPath, (error$1, stat) => {
      if (error$1) return queue.dequeue(suppressErrors ? null : error$1, state);
      if (stat.isDirectory() && isRecursive(path, resolvedPath, state)) return queue.dequeue(null, state);
      callback$1(stat, resolvedPath);
      queue.dequeue(null, state);
    });
  });
};
var resolveSymlinks = function(path, state, callback$1) {
  const { queue, fs, options: { suppressErrors } } = state;
  queue.enqueue();
  try {
    const resolvedPath = fs.realpathSync(path);
    const stat = fs.statSync(resolvedPath);
    if (stat.isDirectory() && isRecursive(path, resolvedPath, state)) return;
    callback$1(stat, resolvedPath);
  } catch (e) {
    if (!suppressErrors) throw e;
  }
};
function build$2(options, isSynchronous) {
  if (!options.resolveSymlinks || options.excludeSymlinks) return null;
  return isSynchronous ? resolveSymlinks : resolveSymlinksAsync;
}
function isRecursive(path, resolved, state) {
  if (state.options.useRealPaths) return isRecursiveUsingRealPaths(resolved, state);
  let parent = dirname(path);
  let depth = 1;
  while (parent !== state.root && depth < 2) {
    const resolvedPath = state.symlinks.get(parent);
    const isSameRoot = !!resolvedPath && (resolvedPath === resolved || resolvedPath.startsWith(resolved) || resolved.startsWith(resolvedPath));
    if (isSameRoot) depth++;
    else parent = dirname(parent);
  }
  state.symlinks.set(path, resolved);
  return depth > 1;
}
function isRecursiveUsingRealPaths(resolved, state) {
  return state.visited.includes(resolved + state.options.pathSeparator);
}
var onlyCountsSync = (state) => {
  return state.counts;
};
var groupsSync = (state) => {
  return state.groups;
};
var defaultSync = (state) => {
  return state.paths;
};
var limitFilesSync = (state) => {
  return state.paths.slice(0, state.options.maxFiles);
};
var onlyCountsAsync = (state, error, callback$1) => {
  report(error, callback$1, state.counts, state.options.suppressErrors);
  return null;
};
var defaultAsync = (state, error, callback$1) => {
  report(error, callback$1, state.paths, state.options.suppressErrors);
  return null;
};
var limitFilesAsync = (state, error, callback$1) => {
  report(error, callback$1, state.paths.slice(0, state.options.maxFiles), state.options.suppressErrors);
  return null;
};
var groupsAsync = (state, error, callback$1) => {
  report(error, callback$1, state.groups, state.options.suppressErrors);
  return null;
};
function report(error, callback$1, output, suppressErrors) {
  if (error && !suppressErrors) callback$1(error, output);
  else callback$1(null, output);
}
function build$1(options, isSynchronous) {
  const { onlyCounts, group, maxFiles } = options;
  if (onlyCounts) return isSynchronous ? onlyCountsSync : onlyCountsAsync;
  else if (group) return isSynchronous ? groupsSync : groupsAsync;
  else if (maxFiles) return isSynchronous ? limitFilesSync : limitFilesAsync;
  else return isSynchronous ? defaultSync : defaultAsync;
}
var readdirOpts = { withFileTypes: true };
var walkAsync = (state, crawlPath, directoryPath, currentDepth, callback$1) => {
  state.queue.enqueue();
  if (currentDepth < 0) return state.queue.dequeue(null, state);
  const { fs } = state;
  state.visited.push(crawlPath);
  state.counts.directories++;
  fs.readdir(crawlPath || ".", readdirOpts, (error, entries = []) => {
    callback$1(entries, directoryPath, currentDepth);
    state.queue.dequeue(state.options.suppressErrors ? null : error, state);
  });
};
var walkSync = (state, crawlPath, directoryPath, currentDepth, callback$1) => {
  const { fs } = state;
  if (currentDepth < 0) return;
  state.visited.push(crawlPath);
  state.counts.directories++;
  let entries = [];
  try {
    entries = fs.readdirSync(crawlPath || ".", readdirOpts);
  } catch (e) {
    if (!state.options.suppressErrors) throw e;
  }
  callback$1(entries, directoryPath, currentDepth);
};
function build(isSynchronous) {
  return isSynchronous ? walkSync : walkAsync;
}
var Queue = class {
  count = 0;
  constructor(onQueueEmpty) {
    this.onQueueEmpty = onQueueEmpty;
  }
  enqueue() {
    this.count++;
    return this.count;
  }
  dequeue(error, output) {
    if (this.onQueueEmpty && (--this.count <= 0 || error)) {
      this.onQueueEmpty(error, output);
      if (error) {
        output.controller.abort();
        this.onQueueEmpty = void 0;
      }
    }
  }
};
var Counter = class {
  _files = 0;
  _directories = 0;
  set files(num) {
    this._files = num;
  }
  get files() {
    return this._files;
  }
  set directories(num) {
    this._directories = num;
  }
  get directories() {
    return this._directories;
  }
  /**
  * @deprecated use `directories` instead
  */
  /* c8 ignore next 3 */
  get dirs() {
    return this._directories;
  }
};
var Aborter = class {
  aborted = false;
  abort() {
    this.aborted = true;
  }
};
var Walker = class {
  root;
  isSynchronous;
  state;
  joinPath;
  pushDirectory;
  pushFile;
  getArray;
  groupFiles;
  resolveSymlink;
  walkDirectory;
  callbackInvoker;
  constructor(root, options, callback$1) {
    this.isSynchronous = !callback$1;
    this.callbackInvoker = build$1(options, this.isSynchronous);
    this.root = normalizePath3(root, options);
    this.state = {
      root: isRootDirectory(this.root) ? this.root : this.root.slice(0, -1),
      paths: [""].slice(0, 0),
      groups: [],
      counts: new Counter(),
      options,
      queue: new Queue((error, state) => this.callbackInvoker(state, error, callback$1)),
      symlinks: /* @__PURE__ */ new Map(),
      visited: [""].slice(0, 0),
      controller: new Aborter(),
      fs: options.fs || nativeFs
    };
    this.joinPath = build$7(this.root, options);
    this.pushDirectory = build$6(this.root, options);
    this.pushFile = build$5(options);
    this.getArray = build$4(options);
    this.groupFiles = build$3(options);
    this.resolveSymlink = build$2(options, this.isSynchronous);
    this.walkDirectory = build(this.isSynchronous);
  }
  start() {
    this.pushDirectory(this.root, this.state.paths, this.state.options.filters);
    this.walkDirectory(this.state, this.root, this.root, this.state.options.maxDepth, this.walk);
    return this.isSynchronous ? this.callbackInvoker(this.state, null) : null;
  }
  walk = (entries, directoryPath, depth) => {
    const { paths, options: { filters, resolveSymlinks: resolveSymlinks$1, excludeSymlinks, exclude, maxFiles, signal, useRealPaths, pathSeparator }, controller } = this.state;
    if (controller.aborted || signal && signal.aborted || maxFiles && paths.length > maxFiles) return;
    const files = this.getArray(this.state.paths);
    for (let i = 0; i < entries.length; ++i) {
      const entry = entries[i];
      if (entry.isFile() || entry.isSymbolicLink() && !resolveSymlinks$1 && !excludeSymlinks) {
        const filename = this.joinPath(entry.name, directoryPath);
        this.pushFile(filename, files, this.state.counts, filters);
      } else if (entry.isDirectory()) {
        let path = joinDirectoryPath(entry.name, directoryPath, this.state.options.pathSeparator);
        if (exclude && exclude(entry.name, path)) continue;
        this.pushDirectory(path, paths, filters);
        this.walkDirectory(this.state, path, path, depth - 1, this.walk);
      } else if (this.resolveSymlink && entry.isSymbolicLink()) {
        let path = joinPathWithBasePath(entry.name, directoryPath);
        this.resolveSymlink(path, this.state, (stat, resolvedPath) => {
          if (stat.isDirectory()) {
            resolvedPath = normalizePath3(resolvedPath, this.state.options);
            if (exclude && exclude(entry.name, useRealPaths ? resolvedPath : path + pathSeparator)) return;
            this.walkDirectory(this.state, resolvedPath, useRealPaths ? resolvedPath : path + pathSeparator, depth - 1, this.walk);
          } else {
            resolvedPath = useRealPaths ? resolvedPath : path;
            const filename = basename(resolvedPath);
            const directoryPath$1 = normalizePath3(dirname(resolvedPath), this.state.options);
            resolvedPath = this.joinPath(filename, directoryPath$1);
            this.pushFile(resolvedPath, files, this.state.counts, filters);
          }
        });
      }
    }
    this.groupFiles(this.state.groups, directoryPath, files);
  };
};
function promise(root, options) {
  return new Promise((resolve$1, reject) => {
    callback(root, options, (err, output) => {
      if (err) return reject(err);
      resolve$1(output);
    });
  });
}
function callback(root, options, callback$1) {
  let walker = new Walker(root, options, callback$1);
  walker.start();
}
function sync(root, options) {
  const walker = new Walker(root, options);
  return walker.start();
}
var APIBuilder = class {
  constructor(root, options) {
    this.root = root;
    this.options = options;
  }
  withPromise() {
    return promise(this.root, this.options);
  }
  withCallback(cb) {
    callback(this.root, this.options, cb);
  }
  sync() {
    return sync(this.root, this.options);
  }
};
var pm2 = null;
try {
  __require2.resolve("picomatch");
  pm2 = __require2("picomatch");
} catch {
}
var Builder = class {
  globCache = {};
  options = {
    maxDepth: Infinity,
    suppressErrors: true,
    pathSeparator: sep,
    filters: []
  };
  globFunction;
  constructor(options) {
    this.options = {
      ...this.options,
      ...options
    };
    this.globFunction = this.options.globFunction;
  }
  group() {
    this.options.group = true;
    return this;
  }
  withPathSeparator(separator) {
    this.options.pathSeparator = separator;
    return this;
  }
  withBasePath() {
    this.options.includeBasePath = true;
    return this;
  }
  withRelativePaths() {
    this.options.relativePaths = true;
    return this;
  }
  withDirs() {
    this.options.includeDirs = true;
    return this;
  }
  withMaxDepth(depth) {
    this.options.maxDepth = depth;
    return this;
  }
  withMaxFiles(limit) {
    this.options.maxFiles = limit;
    return this;
  }
  withFullPaths() {
    this.options.resolvePaths = true;
    this.options.includeBasePath = true;
    return this;
  }
  withErrors() {
    this.options.suppressErrors = false;
    return this;
  }
  withSymlinks({ resolvePaths = true } = {}) {
    this.options.resolveSymlinks = true;
    this.options.useRealPaths = resolvePaths;
    return this.withFullPaths();
  }
  withAbortSignal(signal) {
    this.options.signal = signal;
    return this;
  }
  normalize() {
    this.options.normalizePath = true;
    return this;
  }
  filter(predicate) {
    this.options.filters.push(predicate);
    return this;
  }
  onlyDirs() {
    this.options.excludeFiles = true;
    this.options.includeDirs = true;
    return this;
  }
  exclude(predicate) {
    this.options.exclude = predicate;
    return this;
  }
  onlyCounts() {
    this.options.onlyCounts = true;
    return this;
  }
  crawl(root) {
    return new APIBuilder(root || ".", this.options);
  }
  withGlobFunction(fn) {
    this.globFunction = fn;
    return this;
  }
  /**
  * @deprecated Pass options using the constructor instead:
  * ```ts
  * new fdir(options).crawl("/path/to/root");
  * ```
  * This method will be removed in v7.0
  */
  /* c8 ignore next 4 */
  crawlWithOptions(root, options) {
    this.options = {
      ...this.options,
      ...options
    };
    return new APIBuilder(root || ".", this.options);
  }
  glob(...patterns) {
    if (this.globFunction) return this.globWithOptions(patterns);
    return this.globWithOptions(patterns, ...[{ dot: true }]);
  }
  globWithOptions(patterns, ...options) {
    const globFn = this.globFunction || pm2;
    if (!globFn) throw new Error("Please specify a glob function to use glob matching.");
    var isMatch = this.globCache[patterns.join("\0")];
    if (!isMatch) {
      isMatch = globFn(patterns, ...options);
      this.globCache[patterns.join("\0")] = isMatch;
    }
    this.options.filters.push((path) => isMatch(path));
    return this;
  }
};

// ../node_modules/@jridgewell/sourcemap-codec/dist/sourcemap-codec.mjs
var comma = ",".charCodeAt(0);
var semicolon = ";".charCodeAt(0);
var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var intToChar = new Uint8Array(64);
var charToInt = new Uint8Array(128);
for (let i = 0; i < chars.length; i++) {
  const c = chars.charCodeAt(i);
  intToChar[i] = c;
  charToInt[c] = i;
}
function encodeInteger(builder, num, relative3) {
  let delta = num - relative3;
  delta = delta < 0 ? -delta << 1 | 1 : delta << 1;
  do {
    let clamped = delta & 31;
    delta >>>= 5;
    if (delta > 0) clamped |= 32;
    builder.write(intToChar[clamped]);
  } while (delta > 0);
  return num;
}
var bufLength = 1024 * 16;
var td = typeof TextDecoder !== "undefined" ? /* @__PURE__ */ new TextDecoder() : typeof Buffer !== "undefined" ? {
  decode(buf) {
    const out = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
    return out.toString();
  }
} : {
  decode(buf) {
    let out = "";
    for (let i = 0; i < buf.length; i++) {
      out += String.fromCharCode(buf[i]);
    }
    return out;
  }
};
var StringWriter = class {
  constructor() {
    this.pos = 0;
    this.out = "";
    this.buffer = new Uint8Array(bufLength);
  }
  write(v) {
    const { buffer } = this;
    buffer[this.pos++] = v;
    if (this.pos === bufLength) {
      this.out += td.decode(buffer);
      this.pos = 0;
    }
  }
  flush() {
    const { buffer, out, pos } = this;
    return pos > 0 ? out + td.decode(buffer.subarray(0, pos)) : out;
  }
};
function encode(decoded) {
  const writer = new StringWriter();
  let sourcesIndex = 0;
  let sourceLine = 0;
  let sourceColumn = 0;
  let namesIndex = 0;
  for (let i = 0; i < decoded.length; i++) {
    const line = decoded[i];
    if (i > 0) writer.write(semicolon);
    if (line.length === 0) continue;
    let genColumn = 0;
    for (let j = 0; j < line.length; j++) {
      const segment = line[j];
      if (j > 0) writer.write(comma);
      genColumn = encodeInteger(writer, segment[0], genColumn);
      if (segment.length === 1) continue;
      sourcesIndex = encodeInteger(writer, segment[1], sourcesIndex);
      sourceLine = encodeInteger(writer, segment[2], sourceLine);
      sourceColumn = encodeInteger(writer, segment[3], sourceColumn);
      if (segment.length === 4) continue;
      namesIndex = encodeInteger(writer, segment[4], namesIndex);
    }
  }
  return writer.flush();
}

// ../node_modules/magic-string/dist/magic-string.es.mjs
var BitSet = class _BitSet {
  constructor(arg) {
    this.bits = arg instanceof _BitSet ? arg.bits.slice() : [];
  }
  add(n2) {
    this.bits[n2 >> 5] |= 1 << (n2 & 31);
  }
  has(n2) {
    return !!(this.bits[n2 >> 5] & 1 << (n2 & 31));
  }
};
var Chunk = class _Chunk {
  constructor(start, end, content) {
    this.start = start;
    this.end = end;
    this.original = content;
    this.intro = "";
    this.outro = "";
    this.content = content;
    this.storeName = false;
    this.edited = false;
    {
      this.previous = null;
      this.next = null;
    }
  }
  appendLeft(content) {
    this.outro += content;
  }
  appendRight(content) {
    this.intro = this.intro + content;
  }
  clone() {
    const chunk = new _Chunk(this.start, this.end, this.original);
    chunk.intro = this.intro;
    chunk.outro = this.outro;
    chunk.content = this.content;
    chunk.storeName = this.storeName;
    chunk.edited = this.edited;
    return chunk;
  }
  contains(index) {
    return this.start < index && index < this.end;
  }
  eachNext(fn) {
    let chunk = this;
    while (chunk) {
      fn(chunk);
      chunk = chunk.next;
    }
  }
  eachPrevious(fn) {
    let chunk = this;
    while (chunk) {
      fn(chunk);
      chunk = chunk.previous;
    }
  }
  edit(content, storeName, contentOnly) {
    this.content = content;
    if (!contentOnly) {
      this.intro = "";
      this.outro = "";
    }
    this.storeName = storeName;
    this.edited = true;
    return this;
  }
  prependLeft(content) {
    this.outro = content + this.outro;
  }
  prependRight(content) {
    this.intro = content + this.intro;
  }
  reset() {
    this.intro = "";
    this.outro = "";
    if (this.edited) {
      this.content = this.original;
      this.storeName = false;
      this.edited = false;
    }
  }
  split(index) {
    const sliceIndex = index - this.start;
    const originalBefore = this.original.slice(0, sliceIndex);
    const originalAfter = this.original.slice(sliceIndex);
    this.original = originalBefore;
    const newChunk = new _Chunk(index, this.end, originalAfter);
    newChunk.outro = this.outro;
    this.outro = "";
    this.end = index;
    if (this.edited) {
      newChunk.edit("", false);
      this.content = "";
    } else {
      this.content = originalBefore;
    }
    newChunk.next = this.next;
    if (newChunk.next) newChunk.next.previous = newChunk;
    newChunk.previous = this;
    this.next = newChunk;
    return newChunk;
  }
  toString() {
    return this.intro + this.content + this.outro;
  }
  trimEnd(rx) {
    this.outro = this.outro.replace(rx, "");
    if (this.outro.length) return true;
    const trimmed = this.content.replace(rx, "");
    if (trimmed.length) {
      if (trimmed !== this.content) {
        this.split(this.start + trimmed.length).edit("", void 0, true);
        if (this.edited) {
          this.edit(trimmed, this.storeName, true);
        }
      }
      return true;
    } else {
      this.edit("", void 0, true);
      this.intro = this.intro.replace(rx, "");
      if (this.intro.length) return true;
    }
  }
  trimStart(rx) {
    this.intro = this.intro.replace(rx, "");
    if (this.intro.length) return true;
    const trimmed = this.content.replace(rx, "");
    if (trimmed.length) {
      if (trimmed !== this.content) {
        const newChunk = this.split(this.end - trimmed.length);
        if (this.edited) {
          newChunk.edit(trimmed, this.storeName, true);
        }
        this.edit("", void 0, true);
      }
      return true;
    } else {
      this.edit("", void 0, true);
      this.outro = this.outro.replace(rx, "");
      if (this.outro.length) return true;
    }
  }
};
function getBtoa() {
  if (typeof globalThis !== "undefined" && typeof globalThis.btoa === "function") {
    return (str) => globalThis.btoa(unescape(encodeURIComponent(str)));
  } else if (typeof Buffer === "function") {
    return (str) => Buffer.from(str, "utf-8").toString("base64");
  } else {
    return () => {
      throw new Error("Unsupported environment: `window.btoa` or `Buffer` should be supported.");
    };
  }
}
var btoa = /* @__PURE__ */ getBtoa();
var SourceMap = class {
  constructor(properties) {
    this.version = 3;
    this.file = properties.file;
    this.sources = properties.sources;
    this.sourcesContent = properties.sourcesContent;
    this.names = properties.names;
    this.mappings = encode(properties.mappings);
    if (typeof properties.x_google_ignoreList !== "undefined") {
      this.x_google_ignoreList = properties.x_google_ignoreList;
    }
    if (typeof properties.debugId !== "undefined") {
      this.debugId = properties.debugId;
    }
  }
  toString() {
    return JSON.stringify(this);
  }
  toUrl() {
    return "data:application/json;charset=utf-8;base64," + btoa(this.toString());
  }
};
function guessIndent(code) {
  const lines = code.split("\n");
  const tabbed = lines.filter((line) => /^\t+/.test(line));
  const spaced = lines.filter((line) => /^ {2,}/.test(line));
  if (tabbed.length === 0 && spaced.length === 0) {
    return null;
  }
  if (tabbed.length >= spaced.length) {
    return "	";
  }
  const min = spaced.reduce((previous, current) => {
    const numSpaces = /^ +/.exec(current)[0].length;
    return Math.min(numSpaces, previous);
  }, Infinity);
  return new Array(min + 1).join(" ");
}
function getRelativePath(from, to) {
  const fromParts = from.split(/[/\\]/);
  const toParts = to.split(/[/\\]/);
  fromParts.pop();
  while (fromParts[0] === toParts[0]) {
    fromParts.shift();
    toParts.shift();
  }
  if (fromParts.length) {
    let i = fromParts.length;
    while (i--) fromParts[i] = "..";
  }
  return fromParts.concat(toParts).join("/");
}
var toString = Object.prototype.toString;
function isObject(thing) {
  return toString.call(thing) === "[object Object]";
}
function getLocator(source) {
  const originalLines = source.split("\n");
  const lineOffsets = [];
  for (let i = 0, pos = 0; i < originalLines.length; i++) {
    lineOffsets.push(pos);
    pos += originalLines[i].length + 1;
  }
  return function locate(index) {
    let i = 0;
    let j = lineOffsets.length;
    while (i < j) {
      const m = i + j >> 1;
      if (index < lineOffsets[m]) {
        j = m;
      } else {
        i = m + 1;
      }
    }
    const line = i - 1;
    const column = index - lineOffsets[line];
    return { line, column };
  };
}
var wordRegex = /\w/;
var Mappings = class {
  constructor(hires) {
    this.hires = hires;
    this.generatedCodeLine = 0;
    this.generatedCodeColumn = 0;
    this.raw = [];
    this.rawSegments = this.raw[this.generatedCodeLine] = [];
    this.pending = null;
  }
  addEdit(sourceIndex, content, loc, nameIndex) {
    if (content.length) {
      const contentLengthMinusOne = content.length - 1;
      let contentLineEnd = content.indexOf("\n", 0);
      let previousContentLineEnd = -1;
      while (contentLineEnd >= 0 && contentLengthMinusOne > contentLineEnd) {
        const segment2 = [this.generatedCodeColumn, sourceIndex, loc.line, loc.column];
        if (nameIndex >= 0) {
          segment2.push(nameIndex);
        }
        this.rawSegments.push(segment2);
        this.generatedCodeLine += 1;
        this.raw[this.generatedCodeLine] = this.rawSegments = [];
        this.generatedCodeColumn = 0;
        previousContentLineEnd = contentLineEnd;
        contentLineEnd = content.indexOf("\n", contentLineEnd + 1);
      }
      const segment = [this.generatedCodeColumn, sourceIndex, loc.line, loc.column];
      if (nameIndex >= 0) {
        segment.push(nameIndex);
      }
      this.rawSegments.push(segment);
      this.advance(content.slice(previousContentLineEnd + 1));
    } else if (this.pending) {
      this.rawSegments.push(this.pending);
      this.advance(content);
    }
    this.pending = null;
  }
  addUneditedChunk(sourceIndex, chunk, original, loc, sourcemapLocations) {
    let originalCharIndex = chunk.start;
    let first = true;
    let charInHiresBoundary = false;
    while (originalCharIndex < chunk.end) {
      if (original[originalCharIndex] === "\n") {
        loc.line += 1;
        loc.column = 0;
        this.generatedCodeLine += 1;
        this.raw[this.generatedCodeLine] = this.rawSegments = [];
        this.generatedCodeColumn = 0;
        first = true;
        charInHiresBoundary = false;
      } else {
        if (this.hires || first || sourcemapLocations.has(originalCharIndex)) {
          const segment = [this.generatedCodeColumn, sourceIndex, loc.line, loc.column];
          if (this.hires === "boundary") {
            if (wordRegex.test(original[originalCharIndex])) {
              if (!charInHiresBoundary) {
                this.rawSegments.push(segment);
                charInHiresBoundary = true;
              }
            } else {
              this.rawSegments.push(segment);
              charInHiresBoundary = false;
            }
          } else {
            this.rawSegments.push(segment);
          }
        }
        loc.column += 1;
        this.generatedCodeColumn += 1;
        first = false;
      }
      originalCharIndex += 1;
    }
    this.pending = null;
  }
  advance(str) {
    if (!str) return;
    const lines = str.split("\n");
    if (lines.length > 1) {
      for (let i = 0; i < lines.length - 1; i++) {
        this.generatedCodeLine++;
        this.raw[this.generatedCodeLine] = this.rawSegments = [];
      }
      this.generatedCodeColumn = 0;
    }
    this.generatedCodeColumn += lines[lines.length - 1].length;
  }
};
var n = "\n";
var warned = {
  insertLeft: false,
  insertRight: false,
  storeName: false
};
var MagicString = class _MagicString {
  constructor(string, options = {}) {
    const chunk = new Chunk(0, string.length, string);
    Object.defineProperties(this, {
      original: { writable: true, value: string },
      outro: { writable: true, value: "" },
      intro: { writable: true, value: "" },
      firstChunk: { writable: true, value: chunk },
      lastChunk: { writable: true, value: chunk },
      lastSearchedChunk: { writable: true, value: chunk },
      byStart: { writable: true, value: {} },
      byEnd: { writable: true, value: {} },
      filename: { writable: true, value: options.filename },
      indentExclusionRanges: { writable: true, value: options.indentExclusionRanges },
      sourcemapLocations: { writable: true, value: new BitSet() },
      storedNames: { writable: true, value: {} },
      indentStr: { writable: true, value: void 0 },
      ignoreList: { writable: true, value: options.ignoreList },
      offset: { writable: true, value: options.offset || 0 }
    });
    this.byStart[0] = chunk;
    this.byEnd[string.length] = chunk;
  }
  addSourcemapLocation(char) {
    this.sourcemapLocations.add(char);
  }
  append(content) {
    if (typeof content !== "string") throw new TypeError("outro content must be a string");
    this.outro += content;
    return this;
  }
  appendLeft(index, content) {
    index = index + this.offset;
    if (typeof content !== "string") throw new TypeError("inserted content must be a string");
    this._split(index);
    const chunk = this.byEnd[index];
    if (chunk) {
      chunk.appendLeft(content);
    } else {
      this.intro += content;
    }
    return this;
  }
  appendRight(index, content) {
    index = index + this.offset;
    if (typeof content !== "string") throw new TypeError("inserted content must be a string");
    this._split(index);
    const chunk = this.byStart[index];
    if (chunk) {
      chunk.appendRight(content);
    } else {
      this.outro += content;
    }
    return this;
  }
  clone() {
    const cloned = new _MagicString(this.original, { filename: this.filename, offset: this.offset });
    let originalChunk = this.firstChunk;
    let clonedChunk = cloned.firstChunk = cloned.lastSearchedChunk = originalChunk.clone();
    while (originalChunk) {
      cloned.byStart[clonedChunk.start] = clonedChunk;
      cloned.byEnd[clonedChunk.end] = clonedChunk;
      const nextOriginalChunk = originalChunk.next;
      const nextClonedChunk = nextOriginalChunk && nextOriginalChunk.clone();
      if (nextClonedChunk) {
        clonedChunk.next = nextClonedChunk;
        nextClonedChunk.previous = clonedChunk;
        clonedChunk = nextClonedChunk;
      }
      originalChunk = nextOriginalChunk;
    }
    cloned.lastChunk = clonedChunk;
    if (this.indentExclusionRanges) {
      cloned.indentExclusionRanges = this.indentExclusionRanges.slice();
    }
    cloned.sourcemapLocations = new BitSet(this.sourcemapLocations);
    cloned.intro = this.intro;
    cloned.outro = this.outro;
    return cloned;
  }
  generateDecodedMap(options) {
    options = options || {};
    const sourceIndex = 0;
    const names = Object.keys(this.storedNames);
    const mappings = new Mappings(options.hires);
    const locate = getLocator(this.original);
    if (this.intro) {
      mappings.advance(this.intro);
    }
    this.firstChunk.eachNext((chunk) => {
      const loc = locate(chunk.start);
      if (chunk.intro.length) mappings.advance(chunk.intro);
      if (chunk.edited) {
        mappings.addEdit(
          sourceIndex,
          chunk.content,
          loc,
          chunk.storeName ? names.indexOf(chunk.original) : -1
        );
      } else {
        mappings.addUneditedChunk(sourceIndex, chunk, this.original, loc, this.sourcemapLocations);
      }
      if (chunk.outro.length) mappings.advance(chunk.outro);
    });
    if (this.outro) {
      mappings.advance(this.outro);
    }
    return {
      file: options.file ? options.file.split(/[/\\]/).pop() : void 0,
      sources: [
        options.source ? getRelativePath(options.file || "", options.source) : options.file || ""
      ],
      sourcesContent: options.includeContent ? [this.original] : void 0,
      names,
      mappings: mappings.raw,
      x_google_ignoreList: this.ignoreList ? [sourceIndex] : void 0
    };
  }
  generateMap(options) {
    return new SourceMap(this.generateDecodedMap(options));
  }
  _ensureindentStr() {
    if (this.indentStr === void 0) {
      this.indentStr = guessIndent(this.original);
    }
  }
  _getRawIndentString() {
    this._ensureindentStr();
    return this.indentStr;
  }
  getIndentString() {
    this._ensureindentStr();
    return this.indentStr === null ? "	" : this.indentStr;
  }
  indent(indentStr, options) {
    const pattern = /^[^\r\n]/gm;
    if (isObject(indentStr)) {
      options = indentStr;
      indentStr = void 0;
    }
    if (indentStr === void 0) {
      this._ensureindentStr();
      indentStr = this.indentStr || "	";
    }
    if (indentStr === "") return this;
    options = options || {};
    const isExcluded = {};
    if (options.exclude) {
      const exclusions = typeof options.exclude[0] === "number" ? [options.exclude] : options.exclude;
      exclusions.forEach((exclusion) => {
        for (let i = exclusion[0]; i < exclusion[1]; i += 1) {
          isExcluded[i] = true;
        }
      });
    }
    let shouldIndentNextCharacter = options.indentStart !== false;
    const replacer = (match) => {
      if (shouldIndentNextCharacter) return `${indentStr}${match}`;
      shouldIndentNextCharacter = true;
      return match;
    };
    this.intro = this.intro.replace(pattern, replacer);
    let charIndex = 0;
    let chunk = this.firstChunk;
    while (chunk) {
      const end = chunk.end;
      if (chunk.edited) {
        if (!isExcluded[charIndex]) {
          chunk.content = chunk.content.replace(pattern, replacer);
          if (chunk.content.length) {
            shouldIndentNextCharacter = chunk.content[chunk.content.length - 1] === "\n";
          }
        }
      } else {
        charIndex = chunk.start;
        while (charIndex < end) {
          if (!isExcluded[charIndex]) {
            const char = this.original[charIndex];
            if (char === "\n") {
              shouldIndentNextCharacter = true;
            } else if (char !== "\r" && shouldIndentNextCharacter) {
              shouldIndentNextCharacter = false;
              if (charIndex === chunk.start) {
                chunk.prependRight(indentStr);
              } else {
                this._splitChunk(chunk, charIndex);
                chunk = chunk.next;
                chunk.prependRight(indentStr);
              }
            }
          }
          charIndex += 1;
        }
      }
      charIndex = chunk.end;
      chunk = chunk.next;
    }
    this.outro = this.outro.replace(pattern, replacer);
    return this;
  }
  insert() {
    throw new Error(
      "magicString.insert(...) is deprecated. Use prependRight(...) or appendLeft(...)"
    );
  }
  insertLeft(index, content) {
    if (!warned.insertLeft) {
      console.warn(
        "magicString.insertLeft(...) is deprecated. Use magicString.appendLeft(...) instead"
      );
      warned.insertLeft = true;
    }
    return this.appendLeft(index, content);
  }
  insertRight(index, content) {
    if (!warned.insertRight) {
      console.warn(
        "magicString.insertRight(...) is deprecated. Use magicString.prependRight(...) instead"
      );
      warned.insertRight = true;
    }
    return this.prependRight(index, content);
  }
  move(start, end, index) {
    start = start + this.offset;
    end = end + this.offset;
    index = index + this.offset;
    if (index >= start && index <= end) throw new Error("Cannot move a selection inside itself");
    this._split(start);
    this._split(end);
    this._split(index);
    const first = this.byStart[start];
    const last = this.byEnd[end];
    const oldLeft = first.previous;
    const oldRight = last.next;
    const newRight = this.byStart[index];
    if (!newRight && last === this.lastChunk) return this;
    const newLeft = newRight ? newRight.previous : this.lastChunk;
    if (oldLeft) oldLeft.next = oldRight;
    if (oldRight) oldRight.previous = oldLeft;
    if (newLeft) newLeft.next = first;
    if (newRight) newRight.previous = last;
    if (!first.previous) this.firstChunk = last.next;
    if (!last.next) {
      this.lastChunk = first.previous;
      this.lastChunk.next = null;
    }
    first.previous = newLeft;
    last.next = newRight || null;
    if (!newLeft) this.firstChunk = first;
    if (!newRight) this.lastChunk = last;
    return this;
  }
  overwrite(start, end, content, options) {
    options = options || {};
    return this.update(start, end, content, { ...options, overwrite: !options.contentOnly });
  }
  update(start, end, content, options) {
    start = start + this.offset;
    end = end + this.offset;
    if (typeof content !== "string") throw new TypeError("replacement content must be a string");
    if (this.original.length !== 0) {
      while (start < 0) start += this.original.length;
      while (end < 0) end += this.original.length;
    }
    if (end > this.original.length) throw new Error("end is out of bounds");
    if (start === end)
      throw new Error(
        "Cannot overwrite a zero-length range \u2013 use appendLeft or prependRight instead"
      );
    this._split(start);
    this._split(end);
    if (options === true) {
      if (!warned.storeName) {
        console.warn(
          "The final argument to magicString.overwrite(...) should be an options object. See https://github.com/rich-harris/magic-string"
        );
        warned.storeName = true;
      }
      options = { storeName: true };
    }
    const storeName = options !== void 0 ? options.storeName : false;
    const overwrite = options !== void 0 ? options.overwrite : false;
    if (storeName) {
      const original = this.original.slice(start, end);
      Object.defineProperty(this.storedNames, original, {
        writable: true,
        value: true,
        enumerable: true
      });
    }
    const first = this.byStart[start];
    const last = this.byEnd[end];
    if (first) {
      let chunk = first;
      while (chunk !== last) {
        if (chunk.next !== this.byStart[chunk.end]) {
          throw new Error("Cannot overwrite across a split point");
        }
        chunk = chunk.next;
        chunk.edit("", false);
      }
      first.edit(content, storeName, !overwrite);
    } else {
      const newChunk = new Chunk(start, end, "").edit(content, storeName);
      last.next = newChunk;
      newChunk.previous = last;
    }
    return this;
  }
  prepend(content) {
    if (typeof content !== "string") throw new TypeError("outro content must be a string");
    this.intro = content + this.intro;
    return this;
  }
  prependLeft(index, content) {
    index = index + this.offset;
    if (typeof content !== "string") throw new TypeError("inserted content must be a string");
    this._split(index);
    const chunk = this.byEnd[index];
    if (chunk) {
      chunk.prependLeft(content);
    } else {
      this.intro = content + this.intro;
    }
    return this;
  }
  prependRight(index, content) {
    index = index + this.offset;
    if (typeof content !== "string") throw new TypeError("inserted content must be a string");
    this._split(index);
    const chunk = this.byStart[index];
    if (chunk) {
      chunk.prependRight(content);
    } else {
      this.outro = content + this.outro;
    }
    return this;
  }
  remove(start, end) {
    start = start + this.offset;
    end = end + this.offset;
    if (this.original.length !== 0) {
      while (start < 0) start += this.original.length;
      while (end < 0) end += this.original.length;
    }
    if (start === end) return this;
    if (start < 0 || end > this.original.length) throw new Error("Character is out of bounds");
    if (start > end) throw new Error("end must be greater than start");
    this._split(start);
    this._split(end);
    let chunk = this.byStart[start];
    while (chunk) {
      chunk.intro = "";
      chunk.outro = "";
      chunk.edit("");
      chunk = end > chunk.end ? this.byStart[chunk.end] : null;
    }
    return this;
  }
  reset(start, end) {
    start = start + this.offset;
    end = end + this.offset;
    if (this.original.length !== 0) {
      while (start < 0) start += this.original.length;
      while (end < 0) end += this.original.length;
    }
    if (start === end) return this;
    if (start < 0 || end > this.original.length) throw new Error("Character is out of bounds");
    if (start > end) throw new Error("end must be greater than start");
    this._split(start);
    this._split(end);
    let chunk = this.byStart[start];
    while (chunk) {
      chunk.reset();
      chunk = end > chunk.end ? this.byStart[chunk.end] : null;
    }
    return this;
  }
  lastChar() {
    if (this.outro.length) return this.outro[this.outro.length - 1];
    let chunk = this.lastChunk;
    do {
      if (chunk.outro.length) return chunk.outro[chunk.outro.length - 1];
      if (chunk.content.length) return chunk.content[chunk.content.length - 1];
      if (chunk.intro.length) return chunk.intro[chunk.intro.length - 1];
    } while (chunk = chunk.previous);
    if (this.intro.length) return this.intro[this.intro.length - 1];
    return "";
  }
  lastLine() {
    let lineIndex = this.outro.lastIndexOf(n);
    if (lineIndex !== -1) return this.outro.substr(lineIndex + 1);
    let lineStr = this.outro;
    let chunk = this.lastChunk;
    do {
      if (chunk.outro.length > 0) {
        lineIndex = chunk.outro.lastIndexOf(n);
        if (lineIndex !== -1) return chunk.outro.substr(lineIndex + 1) + lineStr;
        lineStr = chunk.outro + lineStr;
      }
      if (chunk.content.length > 0) {
        lineIndex = chunk.content.lastIndexOf(n);
        if (lineIndex !== -1) return chunk.content.substr(lineIndex + 1) + lineStr;
        lineStr = chunk.content + lineStr;
      }
      if (chunk.intro.length > 0) {
        lineIndex = chunk.intro.lastIndexOf(n);
        if (lineIndex !== -1) return chunk.intro.substr(lineIndex + 1) + lineStr;
        lineStr = chunk.intro + lineStr;
      }
    } while (chunk = chunk.previous);
    lineIndex = this.intro.lastIndexOf(n);
    if (lineIndex !== -1) return this.intro.substr(lineIndex + 1) + lineStr;
    return this.intro + lineStr;
  }
  slice(start = 0, end = this.original.length - this.offset) {
    start = start + this.offset;
    end = end + this.offset;
    if (this.original.length !== 0) {
      while (start < 0) start += this.original.length;
      while (end < 0) end += this.original.length;
    }
    let result = "";
    let chunk = this.firstChunk;
    while (chunk && (chunk.start > start || chunk.end <= start)) {
      if (chunk.start < end && chunk.end >= end) {
        return result;
      }
      chunk = chunk.next;
    }
    if (chunk && chunk.edited && chunk.start !== start)
      throw new Error(`Cannot use replaced character ${start} as slice start anchor.`);
    const startChunk = chunk;
    while (chunk) {
      if (chunk.intro && (startChunk !== chunk || chunk.start === start)) {
        result += chunk.intro;
      }
      const containsEnd = chunk.start < end && chunk.end >= end;
      if (containsEnd && chunk.edited && chunk.end !== end)
        throw new Error(`Cannot use replaced character ${end} as slice end anchor.`);
      const sliceStart = startChunk === chunk ? start - chunk.start : 0;
      const sliceEnd = containsEnd ? chunk.content.length + end - chunk.end : chunk.content.length;
      result += chunk.content.slice(sliceStart, sliceEnd);
      if (chunk.outro && (!containsEnd || chunk.end === end)) {
        result += chunk.outro;
      }
      if (containsEnd) {
        break;
      }
      chunk = chunk.next;
    }
    return result;
  }
  // TODO deprecate this? not really very useful
  snip(start, end) {
    const clone = this.clone();
    clone.remove(0, start);
    clone.remove(end, clone.original.length);
    return clone;
  }
  _split(index) {
    if (this.byStart[index] || this.byEnd[index]) return;
    let chunk = this.lastSearchedChunk;
    let previousChunk = chunk;
    const searchForward = index > chunk.end;
    while (chunk) {
      if (chunk.contains(index)) return this._splitChunk(chunk, index);
      chunk = searchForward ? this.byStart[chunk.end] : this.byEnd[chunk.start];
      if (chunk === previousChunk) return;
      previousChunk = chunk;
    }
  }
  _splitChunk(chunk, index) {
    if (chunk.edited && chunk.content.length) {
      const loc = getLocator(this.original)(index);
      throw new Error(
        `Cannot split a chunk that has already been edited (${loc.line}:${loc.column} \u2013 "${chunk.original}")`
      );
    }
    const newChunk = chunk.split(index);
    this.byEnd[index] = chunk;
    this.byStart[index] = newChunk;
    this.byEnd[newChunk.end] = newChunk;
    if (chunk === this.lastChunk) this.lastChunk = newChunk;
    this.lastSearchedChunk = chunk;
    return true;
  }
  toString() {
    let str = this.intro;
    let chunk = this.firstChunk;
    while (chunk) {
      str += chunk.toString();
      chunk = chunk.next;
    }
    return str + this.outro;
  }
  isEmpty() {
    let chunk = this.firstChunk;
    do {
      if (chunk.intro.length && chunk.intro.trim() || chunk.content.length && chunk.content.trim() || chunk.outro.length && chunk.outro.trim())
        return false;
    } while (chunk = chunk.next);
    return true;
  }
  length() {
    let chunk = this.firstChunk;
    let length = 0;
    do {
      length += chunk.intro.length + chunk.content.length + chunk.outro.length;
    } while (chunk = chunk.next);
    return length;
  }
  trimLines() {
    return this.trim("[\\r\\n]");
  }
  trim(charType) {
    return this.trimStart(charType).trimEnd(charType);
  }
  trimEndAborted(charType) {
    const rx = new RegExp((charType || "\\s") + "+$");
    this.outro = this.outro.replace(rx, "");
    if (this.outro.length) return true;
    let chunk = this.lastChunk;
    do {
      const end = chunk.end;
      const aborted = chunk.trimEnd(rx);
      if (chunk.end !== end) {
        if (this.lastChunk === chunk) {
          this.lastChunk = chunk.next;
        }
        this.byEnd[chunk.end] = chunk;
        this.byStart[chunk.next.start] = chunk.next;
        this.byEnd[chunk.next.end] = chunk.next;
      }
      if (aborted) return true;
      chunk = chunk.previous;
    } while (chunk);
    return false;
  }
  trimEnd(charType) {
    this.trimEndAborted(charType);
    return this;
  }
  trimStartAborted(charType) {
    const rx = new RegExp("^" + (charType || "\\s") + "+");
    this.intro = this.intro.replace(rx, "");
    if (this.intro.length) return true;
    let chunk = this.firstChunk;
    do {
      const end = chunk.end;
      const aborted = chunk.trimStart(rx);
      if (chunk.end !== end) {
        if (chunk === this.lastChunk) this.lastChunk = chunk.next;
        this.byEnd[chunk.end] = chunk;
        this.byStart[chunk.next.start] = chunk.next;
        this.byEnd[chunk.next.end] = chunk.next;
      }
      if (aborted) return true;
      chunk = chunk.next;
    } while (chunk);
    return false;
  }
  trimStart(charType) {
    this.trimStartAborted(charType);
    return this;
  }
  hasChanged() {
    return this.original !== this.toString();
  }
  _replaceRegexp(searchValue, replacement) {
    function getReplacement(match, str) {
      if (typeof replacement === "string") {
        return replacement.replace(/\$(\$|&|\d+)/g, (_, i) => {
          if (i === "$") return "$";
          if (i === "&") return match[0];
          const num = +i;
          if (num < match.length) return match[+i];
          return `$${i}`;
        });
      } else {
        return replacement(...match, match.index, str, match.groups);
      }
    }
    function matchAll(re, str) {
      let match;
      const matches = [];
      while (match = re.exec(str)) {
        matches.push(match);
      }
      return matches;
    }
    if (searchValue.global) {
      const matches = matchAll(searchValue, this.original);
      matches.forEach((match) => {
        if (match.index != null) {
          const replacement2 = getReplacement(match, this.original);
          if (replacement2 !== match[0]) {
            this.overwrite(match.index, match.index + match[0].length, replacement2);
          }
        }
      });
    } else {
      const match = this.original.match(searchValue);
      if (match && match.index != null) {
        const replacement2 = getReplacement(match, this.original);
        if (replacement2 !== match[0]) {
          this.overwrite(match.index, match.index + match[0].length, replacement2);
        }
      }
    }
    return this;
  }
  _replaceString(string, replacement) {
    const { original } = this;
    const index = original.indexOf(string);
    if (index !== -1) {
      if (typeof replacement === "function") {
        replacement = replacement(string, index, original);
      }
      if (string !== replacement) {
        this.overwrite(index, index + string.length, replacement);
      }
    }
    return this;
  }
  replace(searchValue, replacement) {
    if (typeof searchValue === "string") {
      return this._replaceString(searchValue, replacement);
    }
    return this._replaceRegexp(searchValue, replacement);
  }
  _replaceAllString(string, replacement) {
    const { original } = this;
    const stringLength = string.length;
    for (let index = original.indexOf(string); index !== -1; index = original.indexOf(string, index + stringLength)) {
      const previous = original.slice(index, index + stringLength);
      let _replacement = replacement;
      if (typeof replacement === "function") {
        _replacement = replacement(previous, index, original);
      }
      if (previous !== _replacement) this.overwrite(index, index + stringLength, _replacement);
    }
    return this;
  }
  replaceAll(searchValue, replacement) {
    if (typeof searchValue === "string") {
      return this._replaceAllString(searchValue, replacement);
    }
    if (!searchValue.global) {
      throw new TypeError(
        "MagicString.prototype.replaceAll called with a non-global RegExp argument"
      );
    }
    return this._replaceRegexp(searchValue, replacement);
  }
};

// ../node_modules/@rollup/plugin-commonjs/dist/es/index.js
var import_is_reference = __toESM(require_is_reference(), 1);
var version = "28.0.9";
var peerDependencies = {
  rollup: "^2.68.0||^3.0.0||^4.0.0"
};
function tryParse(parse, code, id) {
  try {
    return parse(code, { allowReturnOutsideFunction: true });
  } catch (err) {
    err.message += ` in ${id}`;
    throw err;
  }
}
var firstpassGlobal = /\b(?:require|module|exports|global)\b/;
var firstpassNoGlobal = /\b(?:require|module|exports)\b/;
function hasCjsKeywords(code, ignoreGlobal) {
  const firstpass = ignoreGlobal ? firstpassNoGlobal : firstpassGlobal;
  return firstpass.test(code);
}
function analyzeTopLevelStatements(parse, code, id) {
  const ast = tryParse(parse, code, id);
  let isEsModule = false;
  let hasDefaultExport = false;
  let hasNamedExports = false;
  for (const node of ast.body) {
    switch (node.type) {
      case "ExportDefaultDeclaration":
        isEsModule = true;
        hasDefaultExport = true;
        break;
      case "ExportNamedDeclaration":
        isEsModule = true;
        if (node.declaration) {
          hasNamedExports = true;
        } else {
          for (const specifier of node.specifiers) {
            if (specifier.exported.name === "default") {
              hasDefaultExport = true;
            } else {
              hasNamedExports = true;
            }
          }
        }
        break;
      case "ExportAllDeclaration":
        isEsModule = true;
        if (node.exported && node.exported.name === "default") {
          hasDefaultExport = true;
        } else {
          hasNamedExports = true;
        }
        break;
      case "ImportDeclaration":
        isEsModule = true;
        break;
    }
  }
  return { isEsModule, hasDefaultExport, hasNamedExports, ast };
}
function deconflict(scopes, globals, identifier) {
  let i = 1;
  let deconflicted = makeLegalIdentifier(identifier);
  const hasConflicts = () => scopes.some((scope) => scope.contains(deconflicted)) || globals.has(deconflicted);
  while (hasConflicts()) {
    deconflicted = makeLegalIdentifier(`${identifier}_${i}`);
    i += 1;
  }
  for (const scope of scopes) {
    scope.declarations[deconflicted] = true;
  }
  return deconflicted;
}
function getName(id) {
  const name = makeLegalIdentifier(basename2(id, extname2(id)));
  if (name !== "index") {
    return name;
  }
  return makeLegalIdentifier(basename2(dirname2(id)));
}
function normalizePathSlashes(path) {
  return path.replace(/\\/g, "/");
}
var getVirtualPathForDynamicRequirePath = (path, commonDir) => `/${normalizePathSlashes(relative2(commonDir, path))}`;
function capitalize(name) {
  return name[0].toUpperCase() + name.slice(1);
}
function getStrictRequiresFilter({ strictRequires }) {
  switch (strictRequires) {
    // eslint-disable-next-line no-undefined
    case void 0:
    case true:
      return { strictRequiresFilter: () => true, detectCyclesAndConditional: false };
    case "auto":
    case "debug":
    case null:
      return { strictRequiresFilter: () => false, detectCyclesAndConditional: true };
    case false:
      return { strictRequiresFilter: () => false, detectCyclesAndConditional: false };
    default:
      if (typeof strictRequires === "string" || Array.isArray(strictRequires)) {
        return {
          strictRequiresFilter: createFilter(strictRequires),
          detectCyclesAndConditional: false
        };
      }
      throw new Error('Unexpected value for "strictRequires" option.');
  }
}
function getPackageEntryPoint(dirPath) {
  let entryPoint = "index.js";
  try {
    if (existsSync(join(dirPath, "package.json"))) {
      entryPoint = JSON.parse(readFileSync(join(dirPath, "package.json"), { encoding: "utf8" })).main || entryPoint;
    }
  } catch (ignored) {
  }
  return entryPoint;
}
function isDirectory(path) {
  try {
    if (statSync(path).isDirectory()) return true;
  } catch (ignored) {
  }
  return false;
}
function getDynamicRequireModules(patterns, dynamicRequireRoot) {
  const dynamicRequireModules = /* @__PURE__ */ new Map();
  const dirNames = /* @__PURE__ */ new Set();
  for (const pattern of !patterns || Array.isArray(patterns) ? patterns || [] : [patterns]) {
    const isNegated = pattern.startsWith("!");
    const modifyMap = (targetPath, resolvedPath) => isNegated ? dynamicRequireModules.delete(targetPath) : dynamicRequireModules.set(targetPath, resolvedPath);
    for (const path of new Builder().withBasePath().withDirs().glob(isNegated ? pattern.substr(1) : pattern).crawl(relative2(".", dynamicRequireRoot)).sync().sort((a, b) => a.localeCompare(b, "en"))) {
      const resolvedPath = resolve3(path);
      const requirePath = normalizePathSlashes(resolvedPath);
      if (isDirectory(resolvedPath)) {
        dirNames.add(resolvedPath);
        const modulePath = resolve3(join(resolvedPath, getPackageEntryPoint(path)));
        modifyMap(requirePath, modulePath);
        modifyMap(normalizePathSlashes(modulePath), modulePath);
      } else {
        dirNames.add(dirname2(resolvedPath));
        modifyMap(requirePath, resolvedPath);
      }
    }
  }
  return {
    commonDir: dirNames.size ? (0, import_commondir.default)([...dirNames, dynamicRequireRoot]) : null,
    dynamicRequireModules
  };
}
var FAILED_REQUIRE_ERROR = `throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');`;
var COMMONJS_REQUIRE_EXPORT = "commonjsRequire";
var CREATE_COMMONJS_REQUIRE_EXPORT = "createCommonjsRequire";
function getDynamicModuleRegistry(isDynamicRequireModulesEnabled, dynamicRequireModules, commonDir, ignoreDynamicRequires) {
  if (!isDynamicRequireModulesEnabled) {
    return `export function ${COMMONJS_REQUIRE_EXPORT}(path) {
	${FAILED_REQUIRE_ERROR}
}`;
  }
  const dynamicModuleImports = [...dynamicRequireModules.values()].map(
    (id, index) => `import ${id.endsWith(".json") ? `json${index}` : `{ __require as require${index} }`} from ${JSON.stringify(id)};`
  ).join("\n");
  const dynamicModuleProps = [...dynamicRequireModules.keys()].map(
    (id, index) => `		${JSON.stringify(getVirtualPathForDynamicRequirePath(id, commonDir))}: ${id.endsWith(".json") ? `function () { return json${index}; }` : `require${index}`}`
  ).join(",\n");
  return `${dynamicModuleImports}

var dynamicModules;

function getDynamicModules() {
	return dynamicModules || (dynamicModules = {
${dynamicModuleProps}
	});
}

export function ${CREATE_COMMONJS_REQUIRE_EXPORT}(originalModuleDir) {
	function handleRequire(path) {
		var resolvedPath = commonjsResolve(path, originalModuleDir);
		if (resolvedPath !== null) {
			return getDynamicModules()[resolvedPath]();
		}
		${ignoreDynamicRequires ? "return require(path);" : FAILED_REQUIRE_ERROR}
	}
	handleRequire.resolve = function (path) {
		var resolvedPath = commonjsResolve(path, originalModuleDir);
		if (resolvedPath !== null) {
			return resolvedPath;
		}
		return require.resolve(path);
	}
	return handleRequire;
}

function commonjsResolve (path, originalModuleDir) {
	var shouldTryNodeModules = isPossibleNodeModulesPath(path);
	path = normalize(path);
	var relPath;
	if (path[0] === '/') {
		originalModuleDir = '';
	}
	var modules = getDynamicModules();
	var checkedExtensions = ['', '.js', '.json'];
	while (true) {
		if (!shouldTryNodeModules) {
			relPath = normalize(originalModuleDir + '/' + path);
		} else {
			relPath = normalize(originalModuleDir + '/node_modules/' + path);
		}

		if (relPath.endsWith('/..')) {
			break; // Travelled too far up, avoid infinite loop
		}

		for (var extensionIndex = 0; extensionIndex < checkedExtensions.length; extensionIndex++) {
			var resolvedPath = relPath + checkedExtensions[extensionIndex];
			if (modules[resolvedPath]) {
				return resolvedPath;
			}
		}
		if (!shouldTryNodeModules) break;
		var nextDir = normalize(originalModuleDir + '/..');
		if (nextDir === originalModuleDir) break;
		originalModuleDir = nextDir;
	}
	return null;
}

function isPossibleNodeModulesPath (modulePath) {
	var c0 = modulePath[0];
	if (c0 === '/' || c0 === '\\\\') return false;
	var c1 = modulePath[1], c2 = modulePath[2];
	if ((c0 === '.' && (!c1 || c1 === '/' || c1 === '\\\\')) ||
		(c0 === '.' && c1 === '.' && (!c2 || c2 === '/' || c2 === '\\\\'))) return false;
	if (c1 === ':' && (c2 === '/' || c2 === '\\\\')) return false;
	return true;
}

function normalize (path) {
	path = path.replace(/\\\\/g, '/');
	var parts = path.split('/');
	var slashed = parts[0] === '';
	for (var i = 1; i < parts.length; i++) {
		if (parts[i] === '.' || parts[i] === '') {
			parts.splice(i--, 1);
		}
	}
	for (var i = 1; i < parts.length; i++) {
		if (parts[i] !== '..') continue;
		if (i > 0 && parts[i - 1] !== '..' && parts[i - 1] !== '.') {
			parts.splice(--i, 2);
			i--;
		}
	}
	path = parts.join('/');
	if (slashed && path[0] !== '/') path = '/' + path;
	else if (path.length === 0) path = '.';
	return path;
}`;
}
var isWrappedId = (id, suffix) => id.endsWith(suffix);
var wrapId = (id, suffix) => `\0${id}${suffix}`;
var unwrapId = (wrappedId, suffix) => wrappedId.slice(1, -suffix.length);
var PROXY_SUFFIX = "?commonjs-proxy";
var WRAPPED_SUFFIX = "?commonjs-wrapped";
var EXTERNAL_SUFFIX = "?commonjs-external";
var EXPORTS_SUFFIX = "?commonjs-exports";
var MODULE_SUFFIX = "?commonjs-module";
var ENTRY_SUFFIX = "?commonjs-entry";
var ES_IMPORT_SUFFIX = "?commonjs-es-import";
var DYNAMIC_MODULES_ID = "\0commonjs-dynamic-modules";
var HELPERS_ID = "\0commonjsHelpers.js";
var IS_WRAPPED_COMMONJS = "withRequireFunction";
var HELPERS = `
export var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

export function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

export function getDefaultExportFromNamespaceIfPresent (n) {
	return n && Object.prototype.hasOwnProperty.call(n, 'default') ? n['default'] : n;
}

export function getDefaultExportFromNamespaceIfNotNamed (n) {
	return n && Object.prototype.hasOwnProperty.call(n, 'default') && Object.keys(n).length === 1 ? n['default'] : n;
}

export function getAugmentedNamespace(n) {
  if (Object.prototype.hasOwnProperty.call(n, '__esModule')) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			var isInstance = false;
      try {
        isInstance = this instanceof a;
      } catch {}
			if (isInstance) {
        return Reflect.construct(f, arguments, this.constructor);
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}
`;
function getHelpersModule() {
  return HELPERS;
}
function getUnknownRequireProxy(id, requireReturnsDefault) {
  if (requireReturnsDefault === true || id.endsWith(".json")) {
    return `export { default } from ${JSON.stringify(id)};`;
  }
  const name = getName(id);
  const exported = requireReturnsDefault === "auto" ? `import { getDefaultExportFromNamespaceIfNotNamed } from "${HELPERS_ID}"; export default /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(${name});` : requireReturnsDefault === "preferred" ? `import { getDefaultExportFromNamespaceIfPresent } from "${HELPERS_ID}"; export default /*@__PURE__*/getDefaultExportFromNamespaceIfPresent(${name});` : !requireReturnsDefault ? `import { getAugmentedNamespace } from "${HELPERS_ID}"; export default /*@__PURE__*/getAugmentedNamespace(${name});` : `export default ${name};`;
  return `import * as ${name} from ${JSON.stringify(id)}; ${exported}`;
}
async function getStaticRequireProxy(id, requireReturnsDefault, loadModule) {
  const name = getName(id);
  const {
    meta: { commonjs: commonjsMeta }
  } = await loadModule({ id });
  if (!commonjsMeta) {
    return getUnknownRequireProxy(id, requireReturnsDefault);
  }
  if (commonjsMeta.isCommonJS) {
    return `export { __moduleExports as default } from ${JSON.stringify(id)};`;
  }
  if (!requireReturnsDefault) {
    return `import { getAugmentedNamespace } from "${HELPERS_ID}"; import * as ${name} from ${JSON.stringify(
      id
    )}; export default /*@__PURE__*/getAugmentedNamespace(${name});`;
  }
  if (requireReturnsDefault !== true && (requireReturnsDefault === "namespace" || !commonjsMeta.hasDefaultExport || requireReturnsDefault === "auto" && commonjsMeta.hasNamedExports)) {
    return `import * as ${name} from ${JSON.stringify(id)}; export default ${name};`;
  }
  return `export { default } from ${JSON.stringify(id)};`;
}
function getEntryProxy(id, defaultIsModuleExports, getModuleInfo, shebang) {
  const {
    meta: { commonjs: commonjsMeta },
    hasDefaultExport
  } = getModuleInfo(id);
  if (!commonjsMeta || commonjsMeta.isCommonJS !== IS_WRAPPED_COMMONJS) {
    const stringifiedId = JSON.stringify(id);
    let code = `export * from ${stringifiedId};`;
    if (hasDefaultExport) {
      code += `export { default } from ${stringifiedId};`;
    }
    return shebang + code;
  }
  const result = getEsImportProxy(id, defaultIsModuleExports, true);
  return {
    ...result,
    code: shebang + result.code
  };
}
function getEsImportProxy(id, defaultIsModuleExports, moduleSideEffects) {
  const name = getName(id);
  const exportsName = `${name}Exports`;
  const requireModule = `require${capitalize(name)}`;
  let code = `import { getDefaultExportFromCjs } from "${HELPERS_ID}";
import { __require as ${requireModule} } from ${JSON.stringify(id)};
var ${exportsName} = ${moduleSideEffects ? "" : "/*@__PURE__*/ "}${requireModule}();
export { ${exportsName} as __moduleExports };`;
  if (defaultIsModuleExports === true) {
    code += `
export { ${exportsName} as default };`;
  } else if (defaultIsModuleExports === false) {
    code += `
export default ${exportsName}.default;`;
  } else {
    code += `
export default /*@__PURE__*/getDefaultExportFromCjs(${exportsName});`;
  }
  return {
    code,
    syntheticNamedExports: "__moduleExports"
  };
}
function getExternalBuiltinRequireProxy(id) {
  const stringifiedId = JSON.stringify(id);
  return `import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export function __require() { return require(${stringifiedId}); }`;
}
function getCandidatesForExtension(resolved, extension) {
  return [resolved + extension, `${resolved}${sep2}index${extension}`];
}
function getCandidates(resolved, extensions) {
  return extensions.reduce(
    (paths, extension) => paths.concat(getCandidatesForExtension(resolved, extension)),
    [resolved]
  );
}
function resolveExtensions(importee, importer, extensions) {
  if (importee[0] !== "." || !importer) return void 0;
  const resolved = resolve3(dirname2(importer), importee);
  const candidates = getCandidates(resolved, extensions);
  for (let i = 0; i < candidates.length; i += 1) {
    try {
      const stats = statSync(candidates[i]);
      if (stats.isFile()) return { id: candidates[i] };
    } catch (err) {
    }
  }
  return void 0;
}
function getResolveId(extensions, isPossibleCjsId) {
  const currentlyResolving = /* @__PURE__ */ new Map();
  return {
    /**
     * This is a Maps of importers to Sets of require sources being resolved at
     * the moment by resolveRequireSourcesAndUpdateMeta
     */
    currentlyResolving,
    async resolveId(importee, importer, resolveOptions) {
      const customOptions = resolveOptions.custom;
      if (customOptions?.["node-resolve"]?.isRequire) {
        return null;
      }
      const currentlyResolvingForParent = currentlyResolving.get(importer);
      if (currentlyResolvingForParent && currentlyResolvingForParent.has(importee)) {
        this.warn({
          code: "THIS_RESOLVE_WITHOUT_OPTIONS",
          message: 'It appears a plugin has implemented a "resolveId" hook that uses "this.resolve" without forwarding the third "options" parameter of "resolveId". This is problematic as it can lead to wrong module resolutions especially for the node-resolve plugin and in certain cases cause early exit errors for the commonjs plugin.\nIn rare cases, this warning can appear if the same file is both imported and required from the same mixed ES/CommonJS module, in which case it can be ignored.',
          url: "https://rollupjs.org/guide/en/#resolveid"
        });
        return null;
      }
      if (isWrappedId(importee, WRAPPED_SUFFIX)) {
        return unwrapId(importee, WRAPPED_SUFFIX);
      }
      if (importee.endsWith(ENTRY_SUFFIX) || isWrappedId(importee, MODULE_SUFFIX) || isWrappedId(importee, EXPORTS_SUFFIX) || isWrappedId(importee, PROXY_SUFFIX) || isWrappedId(importee, ES_IMPORT_SUFFIX) || isWrappedId(importee, EXTERNAL_SUFFIX) || importee.startsWith(HELPERS_ID) || importee === DYNAMIC_MODULES_ID) {
        return importee;
      }
      if (importer) {
        if (importer === DYNAMIC_MODULES_ID || // Proxies are only importing resolved ids, no need to resolve again
        isWrappedId(importer, PROXY_SUFFIX) || isWrappedId(importer, ES_IMPORT_SUFFIX) || importer.endsWith(ENTRY_SUFFIX)) {
          return importee;
        }
        if (isWrappedId(importer, EXTERNAL_SUFFIX)) {
          if (!await this.resolve(
            importee,
            importer,
            Object.assign({ skipSelf: true }, resolveOptions)
          )) {
            return null;
          }
          return { id: importee, external: true };
        }
      }
      if (importee.startsWith("\0")) {
        return null;
      }
      const resolved = await this.resolve(
        importee,
        importer,
        Object.assign({ skipSelf: true }, resolveOptions)
      ) || resolveExtensions(importee, importer, extensions);
      if (!resolved || resolved.external || resolved.id.endsWith(ENTRY_SUFFIX) || isWrappedId(resolved.id, ES_IMPORT_SUFFIX) || !isPossibleCjsId(resolved.id)) {
        return resolved;
      }
      const moduleInfo = await this.load(resolved);
      const {
        meta: { commonjs: commonjsMeta }
      } = moduleInfo;
      if (commonjsMeta) {
        const { isCommonJS } = commonjsMeta;
        if (isCommonJS) {
          if (resolveOptions.isEntry) {
            moduleInfo.moduleSideEffects = true;
            return resolved.id + ENTRY_SUFFIX;
          }
          if (isCommonJS === IS_WRAPPED_COMMONJS) {
            return { id: wrapId(resolved.id, ES_IMPORT_SUFFIX), meta: { commonjs: { resolved } } };
          }
        }
      }
      return resolved;
    }
  };
}
function getRequireResolver(extensions, detectCyclesAndConditional, currentlyResolving) {
  const knownCjsModuleTypes = /* @__PURE__ */ Object.create(null);
  const requiredIds = /* @__PURE__ */ Object.create(null);
  const unconditionallyRequiredIds = /* @__PURE__ */ Object.create(null);
  const dependencies = /* @__PURE__ */ Object.create(null);
  const getDependencies = (id) => dependencies[id] || (dependencies[id] = /* @__PURE__ */ new Set());
  const isCyclic = (id) => {
    const dependenciesToCheck = new Set(getDependencies(id));
    for (const dependency of dependenciesToCheck) {
      if (dependency === id) {
        return true;
      }
      for (const childDependency of getDependencies(dependency)) {
        dependenciesToCheck.add(childDependency);
      }
    }
    return false;
  };
  const fullyAnalyzedModules = /* @__PURE__ */ Object.create(null);
  const getTypeForFullyAnalyzedModule = (id) => {
    const knownType = knownCjsModuleTypes[id];
    if (knownType !== true || !detectCyclesAndConditional || fullyAnalyzedModules[id]) {
      return knownType;
    }
    if (isCyclic(id)) {
      return knownCjsModuleTypes[id] = IS_WRAPPED_COMMONJS;
    }
    return knownType;
  };
  const setInitialParentType = (id, initialCommonJSType) => {
    if (fullyAnalyzedModules[id]) {
      return;
    }
    knownCjsModuleTypes[id] = initialCommonJSType;
    if (detectCyclesAndConditional && knownCjsModuleTypes[id] === true && requiredIds[id] && !unconditionallyRequiredIds[id]) {
      knownCjsModuleTypes[id] = IS_WRAPPED_COMMONJS;
    }
  };
  const analyzeRequiredModule = async (parentId, resolved, isConditional, loadModule) => {
    const childId = resolved.id;
    requiredIds[childId] = true;
    if (!(isConditional || knownCjsModuleTypes[parentId] === IS_WRAPPED_COMMONJS)) {
      unconditionallyRequiredIds[childId] = true;
    }
    getDependencies(parentId).add(childId);
    if (!isCyclic(childId)) {
      await loadModule(resolved);
    }
  };
  const getTypeForImportedModule = async (resolved, loadModule) => {
    if (resolved.id in knownCjsModuleTypes) {
      return knownCjsModuleTypes[resolved.id];
    }
    const {
      meta: { commonjs: commonjs2 }
    } = await loadModule(resolved);
    return commonjs2 && commonjs2.isCommonJS || false;
  };
  return {
    getWrappedIds: () => Object.keys(knownCjsModuleTypes).filter(
      (id) => knownCjsModuleTypes[id] === IS_WRAPPED_COMMONJS
    ),
    isRequiredId: (id) => requiredIds[id],
    async shouldTransformCachedModule({
      id: parentId,
      resolvedSources,
      meta: { commonjs: parentMeta }
    }) {
      if (!(parentMeta && parentMeta.isCommonJS)) knownCjsModuleTypes[parentId] = false;
      if (isWrappedId(parentId, ES_IMPORT_SUFFIX)) return false;
      const parentRequires = parentMeta && parentMeta.requires;
      if (parentRequires) {
        setInitialParentType(parentId, parentMeta.initialCommonJSType);
        await Promise.all(
          parentRequires.map(
            ({ resolved, isConditional }) => analyzeRequiredModule(parentId, resolved, isConditional, this.load)
          )
        );
        if (getTypeForFullyAnalyzedModule(parentId) !== parentMeta.isCommonJS) {
          return true;
        }
        for (const {
          resolved: { id }
        } of parentRequires) {
          if (getTypeForFullyAnalyzedModule(id) !== parentMeta.isRequiredCommonJS[id]) {
            return true;
          }
        }
        fullyAnalyzedModules[parentId] = true;
        for (const {
          resolved: { id }
        } of parentRequires) {
          fullyAnalyzedModules[id] = true;
        }
      }
      const parentRequireSet = new Set((parentRequires || []).map(({ resolved: { id } }) => id));
      return (await Promise.all(
        Object.keys(resolvedSources).map((source) => resolvedSources[source]).filter(({ id, external }) => !(external || parentRequireSet.has(id))).map(async (resolved) => {
          if (isWrappedId(resolved.id, ES_IMPORT_SUFFIX)) {
            return await getTypeForImportedModule(
              (await this.load(resolved)).meta.commonjs.resolved,
              this.load
            ) !== IS_WRAPPED_COMMONJS;
          }
          return await getTypeForImportedModule(resolved, this.load) === IS_WRAPPED_COMMONJS;
        })
      )).some((shouldTransform) => shouldTransform);
    },
    /* eslint-disable no-param-reassign */
    resolveRequireSourcesAndUpdateMeta: (rollupContext) => async (parentId, isParentCommonJS, parentMeta, sources) => {
      parentMeta.initialCommonJSType = isParentCommonJS;
      parentMeta.requires = [];
      parentMeta.isRequiredCommonJS = /* @__PURE__ */ Object.create(null);
      setInitialParentType(parentId, isParentCommonJS);
      const currentlyResolvingForParent = currentlyResolving.get(parentId) || /* @__PURE__ */ new Set();
      currentlyResolving.set(parentId, currentlyResolvingForParent);
      const requireTargets = await Promise.all(
        sources.map(async ({ source, isConditional }) => {
          if (source.startsWith("\0")) {
            return { id: source, allowProxy: false };
          }
          currentlyResolvingForParent.add(source);
          const resolved = await rollupContext.resolve(source, parentId, {
            skipSelf: false,
            custom: { "node-resolve": { isRequire: true } }
          }) || resolveExtensions(source, parentId, extensions);
          currentlyResolvingForParent.delete(source);
          if (!resolved) {
            return { id: wrapId(source, EXTERNAL_SUFFIX), allowProxy: false };
          }
          const childId = resolved.id;
          if (resolved.external) {
            return { id: wrapId(childId, EXTERNAL_SUFFIX), allowProxy: false };
          }
          parentMeta.requires.push({ resolved, isConditional });
          await analyzeRequiredModule(parentId, resolved, isConditional, rollupContext.load);
          return { id: childId, allowProxy: true };
        })
      );
      parentMeta.isCommonJS = getTypeForFullyAnalyzedModule(parentId);
      fullyAnalyzedModules[parentId] = true;
      return requireTargets.map(({ id: dependencyId, allowProxy }, index) => {
        let isCommonJS = parentMeta.isRequiredCommonJS[dependencyId] = getTypeForFullyAnalyzedModule(dependencyId);
        const isExternalWrapped = isWrappedId(dependencyId, EXTERNAL_SUFFIX);
        let resolvedDependencyId = dependencyId;
        if (parentMeta.isCommonJS === IS_WRAPPED_COMMONJS && !allowProxy && isExternalWrapped) {
          const actualExternalId = unwrapId(dependencyId, EXTERNAL_SUFFIX);
          if (actualExternalId.startsWith("node:")) {
            isCommonJS = IS_WRAPPED_COMMONJS;
            parentMeta.isRequiredCommonJS[dependencyId] = isCommonJS;
          }
        } else if (isExternalWrapped && !allowProxy) {
          const actualExternalId = unwrapId(dependencyId, EXTERNAL_SUFFIX);
          if (actualExternalId.startsWith("node:")) {
            resolvedDependencyId = actualExternalId;
          }
        }
        const isWrappedCommonJS = isCommonJS === IS_WRAPPED_COMMONJS;
        fullyAnalyzedModules[dependencyId] = true;
        const moduleInfo = isWrappedCommonJS && !isExternalWrapped ? rollupContext.getModuleInfo(dependencyId) : null;
        const wrappedModuleSideEffects = !isWrappedCommonJS ? false : moduleInfo?.moduleSideEffects ?? true;
        return {
          wrappedModuleSideEffects,
          source: sources[index].source,
          id: allowProxy ? wrapId(resolvedDependencyId, isWrappedCommonJS ? WRAPPED_SUFFIX : PROXY_SUFFIX) : resolvedDependencyId,
          isCommonJS
        };
      });
    },
    isCurrentlyResolving(source, parentId) {
      const currentlyResolvingForParent = currentlyResolving.get(parentId);
      return currentlyResolvingForParent && currentlyResolvingForParent.has(source);
    }
  };
}
function validateVersion(actualVersion, peerDependencyVersion, name) {
  const versionRegexp = /\^(\d+\.\d+\.\d+)/g;
  let minMajor = Infinity;
  let minMinor = Infinity;
  let minPatch = Infinity;
  let foundVersion;
  while (foundVersion = versionRegexp.exec(peerDependencyVersion)) {
    const [foundMajor, foundMinor, foundPatch] = foundVersion[1].split(".").map(Number);
    if (foundMajor < minMajor) {
      minMajor = foundMajor;
      minMinor = foundMinor;
      minPatch = foundPatch;
    }
  }
  if (!actualVersion) {
    throw new Error(
      `Insufficient ${name} version: "@rollup/plugin-commonjs" requires at least ${name}@${minMajor}.${minMinor}.${minPatch}.`
    );
  }
  const [major, minor, patch] = actualVersion.split(".").map(Number);
  if (major < minMajor || major === minMajor && (minor < minMinor || minor === minMinor && patch < minPatch)) {
    throw new Error(
      `Insufficient ${name} version: "@rollup/plugin-commonjs" requires at least ${name}@${minMajor}.${minMinor}.${minPatch} but found ${name}@${actualVersion}.`
    );
  }
}
var operators = {
  "==": (x) => equals(x.left, x.right, false),
  "!=": (x) => not(operators["=="](x)),
  "===": (x) => equals(x.left, x.right, true),
  "!==": (x) => not(operators["==="](x)),
  "!": (x) => isFalsy(x.argument),
  "&&": (x) => isTruthy(x.left) && isTruthy(x.right),
  "||": (x) => isTruthy(x.left) || isTruthy(x.right)
};
function not(value) {
  return value === null ? value : !value;
}
function equals(a, b, strict) {
  if (a.type !== b.type) return null;
  if (a.type === "Literal") return strict ? a.value === b.value : a.value == b.value;
  return null;
}
function isTruthy(node) {
  if (!node) return false;
  if (node.type === "Literal") return !!node.value;
  if (node.type === "ParenthesizedExpression") return isTruthy(node.expression);
  if (node.operator in operators) return operators[node.operator](node);
  return null;
}
function isFalsy(node) {
  return not(isTruthy(node));
}
function getKeypath(node) {
  const parts = [];
  while (node.type === "MemberExpression") {
    if (node.computed) return null;
    parts.unshift(node.property.name);
    node = node.object;
  }
  if (node.type !== "Identifier") return null;
  const { name } = node;
  parts.unshift(name);
  return { name, keypath: parts.join(".") };
}
var KEY_COMPILED_ESM = "__esModule";
function getDefineCompiledEsmType(node) {
  const definedPropertyWithExports = getDefinePropertyCallName(node, "exports");
  const definedProperty = definedPropertyWithExports || getDefinePropertyCallName(node, "module.exports");
  if (definedProperty && definedProperty.key === KEY_COMPILED_ESM) {
    return isTruthy(definedProperty.value) ? definedPropertyWithExports ? "exports" : "module" : false;
  }
  return false;
}
function getDefinePropertyCallName(node, targetName) {
  const {
    callee: { object, property }
  } = node;
  if (!object || object.type !== "Identifier" || object.name !== "Object") return;
  if (!property || property.type !== "Identifier" || property.name !== "defineProperty") return;
  if (node.arguments.length !== 3) return;
  const targetNames = targetName.split(".");
  const [target, key, value] = node.arguments;
  if (targetNames.length === 1) {
    if (target.type !== "Identifier" || target.name !== targetNames[0]) {
      return;
    }
  }
  if (targetNames.length === 2) {
    if (target.type !== "MemberExpression" || target.object.name !== targetNames[0] || target.property.name !== targetNames[1]) {
      return;
    }
  }
  if (value.type !== "ObjectExpression" || !value.properties) return;
  const valueProperty = value.properties.find((p) => p.key && p.key.name === "value");
  if (!valueProperty || !valueProperty.value) return;
  return { key: key.value, value: valueProperty.value };
}
function isShorthandProperty(parent) {
  return parent && parent.type === "Property" && parent.shorthand;
}
function wrapCode(magicString, uses, moduleName, exportsName, indentExclusionRanges) {
  const args = [];
  const passedArgs = [];
  if (uses.module) {
    args.push("module");
    passedArgs.push(moduleName);
  }
  if (uses.exports) {
    args.push("exports");
    passedArgs.push(uses.module ? `${moduleName}.exports` : exportsName);
  }
  magicString.trim().indent("	", { exclude: indentExclusionRanges }).prepend(`(function (${args.join(", ")}) {
`).append(` 
} (${passedArgs.join(", ")}));`);
}
function rewriteExportsAndGetExportsBlock(magicString, moduleName, exportsName, exportedExportsName, wrapped, moduleExportsAssignments, firstTopLevelModuleExportsAssignment, exportsAssignmentsByName, topLevelAssignments, defineCompiledEsmExpressions, deconflictedExportNames, code, HELPERS_NAME, exportMode, defaultIsModuleExports, usesRequireWrapper, requireName) {
  const exports = [];
  const exportDeclarations = [];
  if (usesRequireWrapper) {
    getExportsWhenUsingRequireWrapper(
      magicString,
      wrapped,
      exportMode,
      exports,
      moduleExportsAssignments,
      exportsAssignmentsByName,
      moduleName,
      exportsName,
      requireName,
      defineCompiledEsmExpressions
    );
  } else if (exportMode === "replace") {
    getExportsForReplacedModuleExports(
      magicString,
      exports,
      exportDeclarations,
      moduleExportsAssignments,
      firstTopLevelModuleExportsAssignment,
      exportsName,
      defaultIsModuleExports,
      HELPERS_NAME
    );
  } else {
    if (exportMode === "module") {
      exportDeclarations.push(`var ${exportedExportsName} = ${moduleName}.exports`);
      exports.push(`${exportedExportsName} as __moduleExports`);
    } else {
      exports.push(`${exportsName} as __moduleExports`);
    }
    if (wrapped) {
      exportDeclarations.push(
        getDefaultExportDeclaration(exportedExportsName, defaultIsModuleExports, HELPERS_NAME)
      );
    } else {
      getExports(
        magicString,
        exports,
        exportDeclarations,
        moduleExportsAssignments,
        exportsAssignmentsByName,
        deconflictedExportNames,
        topLevelAssignments,
        moduleName,
        exportsName,
        exportedExportsName,
        defineCompiledEsmExpressions,
        HELPERS_NAME,
        defaultIsModuleExports,
        exportMode
      );
    }
  }
  if (exports.length) {
    exportDeclarations.push(`export { ${exports.join(", ")} }`);
  }
  return `

${exportDeclarations.join(";\n")};`;
}
function getExportsWhenUsingRequireWrapper(magicString, wrapped, exportMode, exports, moduleExportsAssignments, exportsAssignmentsByName, moduleName, exportsName, requireName, defineCompiledEsmExpressions) {
  exports.push(`${requireName} as __require`);
  if (wrapped) return;
  if (exportMode === "replace") {
    rewriteModuleExportsAssignments(magicString, moduleExportsAssignments, exportsName);
  } else {
    rewriteModuleExportsAssignments(magicString, moduleExportsAssignments, `${moduleName}.exports`);
    for (const [exportName, { nodes }] of exportsAssignmentsByName) {
      for (const { node, type } of nodes) {
        magicString.overwrite(
          node.start,
          node.left.end,
          `${exportMode === "module" && type === "module" ? `${moduleName}.exports` : exportsName}.${exportName}`
        );
      }
    }
    replaceDefineCompiledEsmExpressionsAndGetIfRestorable(
      defineCompiledEsmExpressions,
      magicString,
      exportMode,
      moduleName,
      exportsName
    );
  }
}
function getExportsForReplacedModuleExports(magicString, exports, exportDeclarations, moduleExportsAssignments, firstTopLevelModuleExportsAssignment, exportsName, defaultIsModuleExports, HELPERS_NAME) {
  for (const { left } of moduleExportsAssignments) {
    magicString.overwrite(left.start, left.end, exportsName);
  }
  magicString.prependRight(firstTopLevelModuleExportsAssignment.left.start, "var ");
  exports.push(`${exportsName} as __moduleExports`);
  exportDeclarations.push(
    getDefaultExportDeclaration(exportsName, defaultIsModuleExports, HELPERS_NAME)
  );
}
function getDefaultExportDeclaration(exportedExportsName, defaultIsModuleExports, HELPERS_NAME) {
  return `export default ${defaultIsModuleExports === true ? exportedExportsName : defaultIsModuleExports === false ? `${exportedExportsName}.default` : `/*@__PURE__*/${HELPERS_NAME}.getDefaultExportFromCjs(${exportedExportsName})`}`;
}
function getExports(magicString, exports, exportDeclarations, moduleExportsAssignments, exportsAssignmentsByName, deconflictedExportNames, topLevelAssignments, moduleName, exportsName, exportedExportsName, defineCompiledEsmExpressions, HELPERS_NAME, defaultIsModuleExports, exportMode) {
  let deconflictedDefaultExportName;
  for (const { left } of moduleExportsAssignments) {
    magicString.overwrite(left.start, left.end, `${moduleName}.exports`);
  }
  for (const [exportName, { nodes }] of exportsAssignmentsByName) {
    const deconflicted = deconflictedExportNames[exportName];
    let needsDeclaration = true;
    for (const { node, type } of nodes) {
      let replacement = `${deconflicted} = ${exportMode === "module" && type === "module" ? `${moduleName}.exports` : exportsName}.${exportName}`;
      if (needsDeclaration && topLevelAssignments.has(node)) {
        replacement = `var ${replacement}`;
        needsDeclaration = false;
      }
      magicString.overwrite(node.start, node.left.end, replacement);
    }
    if (needsDeclaration) {
      magicString.prepend(`var ${deconflicted};
`);
    }
    if (exportName === "default") {
      deconflictedDefaultExportName = deconflicted;
    } else {
      exports.push(exportName === deconflicted ? exportName : `${deconflicted} as ${exportName}`);
    }
  }
  const isRestorableCompiledEsm = replaceDefineCompiledEsmExpressionsAndGetIfRestorable(
    defineCompiledEsmExpressions,
    magicString,
    exportMode,
    moduleName,
    exportsName
  );
  if (defaultIsModuleExports === false || defaultIsModuleExports === "auto" && isRestorableCompiledEsm && moduleExportsAssignments.length === 0) {
    exports.push(`${deconflictedDefaultExportName || exportedExportsName} as default`);
  } else if (defaultIsModuleExports === true || !isRestorableCompiledEsm && moduleExportsAssignments.length === 0) {
    exports.push(`${exportedExportsName} as default`);
  } else {
    exportDeclarations.push(
      getDefaultExportDeclaration(exportedExportsName, defaultIsModuleExports, HELPERS_NAME)
    );
  }
}
function rewriteModuleExportsAssignments(magicString, moduleExportsAssignments, exportsName) {
  for (const { left } of moduleExportsAssignments) {
    magicString.overwrite(left.start, left.end, exportsName);
  }
}
function replaceDefineCompiledEsmExpressionsAndGetIfRestorable(defineCompiledEsmExpressions, magicString, exportMode, moduleName, exportsName) {
  let isRestorableCompiledEsm = false;
  for (const { node, type } of defineCompiledEsmExpressions) {
    isRestorableCompiledEsm = true;
    const moduleExportsExpression = node.type === "CallExpression" ? node.arguments[0] : node.left.object;
    magicString.overwrite(
      moduleExportsExpression.start,
      moduleExportsExpression.end,
      exportMode === "module" && type === "module" ? `${moduleName}.exports` : exportsName
    );
  }
  return isRestorableCompiledEsm;
}
function isRequireExpression(node, scope) {
  if (!node) return false;
  if (node.type !== "CallExpression") return false;
  if (node.arguments.length === 0) return false;
  return isRequire(node.callee, scope);
}
function isRequire(node, scope) {
  return node.type === "Identifier" && node.name === "require" && !scope.contains("require") || node.type === "MemberExpression" && isModuleRequire(node, scope);
}
function isModuleRequire({ object, property }, scope) {
  return object.type === "Identifier" && object.name === "module" && property.type === "Identifier" && property.name === "require" && !scope.contains("module");
}
function hasDynamicArguments(node) {
  return node.arguments.length > 1 || node.arguments[0].type !== "Literal" && (node.arguments[0].type !== "TemplateLiteral" || node.arguments[0].expressions.length > 0);
}
var reservedMethod = { resolve: true, cache: true, main: true };
function isNodeRequirePropertyAccess(parent) {
  return parent && parent.property && reservedMethod[parent.property.name];
}
function getRequireStringArg(node) {
  return node.arguments[0].type === "Literal" ? node.arguments[0].value : node.arguments[0].quasis[0].value.cooked;
}
function getRequireHandlers() {
  const requireExpressions = [];
  function addRequireExpression(sourceId, node, scope, usesReturnValue, isInsideTryBlock, isInsideConditional, toBeRemoved) {
    requireExpressions.push({
      sourceId,
      node,
      scope,
      usesReturnValue,
      isInsideTryBlock,
      isInsideConditional,
      toBeRemoved
    });
  }
  async function rewriteRequireExpressionsAndGetImportBlock(magicString, topLevelDeclarations, reassignedNames, helpersName, dynamicRequireName, moduleName, exportsName, id, exportMode, resolveRequireSourcesAndUpdateMeta, needsRequireWrapper, isEsModule, isDynamicRequireModulesEnabled, getIgnoreTryCatchRequireStatementMode, commonjsMeta) {
    const imports = [];
    imports.push(`import * as ${helpersName} from "${HELPERS_ID}"`);
    if (dynamicRequireName) {
      imports.push(
        `import { ${isDynamicRequireModulesEnabled ? CREATE_COMMONJS_REQUIRE_EXPORT : COMMONJS_REQUIRE_EXPORT} as ${dynamicRequireName} } from "${DYNAMIC_MODULES_ID}"`
      );
    }
    if (exportMode === "module") {
      imports.push(
        `import { __module as ${moduleName} } from ${JSON.stringify(wrapId(id, MODULE_SUFFIX))}`,
        `var ${exportsName} = ${moduleName}.exports`
      );
    } else if (exportMode === "exports") {
      imports.push(
        `import { __exports as ${exportsName} } from ${JSON.stringify(wrapId(id, EXPORTS_SUFFIX))}`
      );
    }
    const requiresBySource = collectSources(requireExpressions);
    const requireTargets = await resolveRequireSourcesAndUpdateMeta(
      id,
      needsRequireWrapper ? IS_WRAPPED_COMMONJS : !isEsModule,
      commonjsMeta,
      Object.keys(requiresBySource).map((source) => {
        return {
          source,
          isConditional: requiresBySource[source].every((require2) => require2.isInsideConditional)
        };
      })
    );
    processRequireExpressions(
      imports,
      requireTargets,
      requiresBySource,
      getIgnoreTryCatchRequireStatementMode,
      magicString
    );
    return imports.length ? `${imports.join(";\n")};

` : "";
  }
  return {
    addRequireExpression,
    rewriteRequireExpressionsAndGetImportBlock
  };
}
function collectSources(requireExpressions) {
  const requiresBySource = /* @__PURE__ */ Object.create(null);
  for (const requireExpression of requireExpressions) {
    const { sourceId } = requireExpression;
    if (!requiresBySource[sourceId]) {
      requiresBySource[sourceId] = [];
    }
    const requires = requiresBySource[sourceId];
    requires.push(requireExpression);
  }
  return requiresBySource;
}
function processRequireExpressions(imports, requireTargets, requiresBySource, getIgnoreTryCatchRequireStatementMode, magicString) {
  const generateRequireName = getGenerateRequireName();
  for (const { source, id: resolvedId, isCommonJS, wrappedModuleSideEffects } of requireTargets) {
    const requires = requiresBySource[source];
    const name = generateRequireName(requires);
    let usesRequired = false;
    let needsImport = false;
    for (const { node, usesReturnValue, toBeRemoved, isInsideTryBlock } of requires) {
      const { canConvertRequire, shouldRemoveRequire } = isInsideTryBlock && isWrappedId(resolvedId, EXTERNAL_SUFFIX) ? getIgnoreTryCatchRequireStatementMode(source) : { canConvertRequire: true, shouldRemoveRequire: false };
      if (shouldRemoveRequire) {
        if (usesReturnValue) {
          magicString.overwrite(node.start, node.end, "undefined");
        } else {
          magicString.remove(toBeRemoved.start, toBeRemoved.end);
        }
      } else if (canConvertRequire) {
        needsImport = true;
        if (isCommonJS === IS_WRAPPED_COMMONJS) {
          magicString.overwrite(
            node.start,
            node.end,
            `${wrappedModuleSideEffects ? "" : "/*@__PURE__*/ "}${name}()`
          );
        } else if (usesReturnValue) {
          usesRequired = true;
          magicString.overwrite(node.start, node.end, name);
        } else {
          magicString.remove(toBeRemoved.start, toBeRemoved.end);
        }
      }
    }
    if (needsImport) {
      if (isCommonJS === IS_WRAPPED_COMMONJS) {
        imports.push(`import { __require as ${name} } from ${JSON.stringify(resolvedId)}`);
      } else {
        imports.push(`import ${usesRequired ? `${name} from ` : ""}${JSON.stringify(resolvedId)}`);
      }
    }
  }
}
function getGenerateRequireName() {
  let uid = 0;
  return (requires) => {
    let name;
    const hasNameConflict = ({ scope }) => scope.contains(name);
    do {
      name = `require$$${uid}`;
      uid += 1;
    } while (requires.some(hasNameConflict));
    return name;
  };
}
var exportsPattern = /^(?:module\.)?exports(?:\.([a-zA-Z_$][a-zA-Z_$0-9]*))?$/;
var functionType = /^(?:FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/;
async function transformCommonjs(parse, code, id, isEsModule, ignoreGlobal, ignoreRequire, ignoreDynamicRequires, getIgnoreTryCatchRequireStatementMode, sourceMap, isDynamicRequireModulesEnabled, dynamicRequireModules, commonDir, astCache, defaultIsModuleExports, needsRequireWrapper, resolveRequireSourcesAndUpdateMeta, isRequired, checkDynamicRequire, commonjsMeta) {
  const ast = astCache || tryParse(parse, code, id);
  const magicString = new MagicString(code);
  const uses = {
    module: false,
    exports: false,
    global: false,
    require: false
  };
  const virtualDynamicRequirePath = isDynamicRequireModulesEnabled && getVirtualPathForDynamicRequirePath(dirname2(id), commonDir);
  let scope = attachScopes(ast, "scope");
  let lexicalDepth = 0;
  let programDepth = 0;
  let classBodyDepth = 0;
  let currentTryBlockEnd = null;
  let shouldWrap = false;
  const globals = /* @__PURE__ */ new Set();
  let currentConditionalNodeEnd = null;
  const conditionalNodes = /* @__PURE__ */ new Set();
  const { addRequireExpression, rewriteRequireExpressionsAndGetImportBlock } = getRequireHandlers();
  const reassignedNames = /* @__PURE__ */ new Set();
  const topLevelDeclarations = [];
  const skippedNodes = /* @__PURE__ */ new Set();
  const moduleAccessScopes = /* @__PURE__ */ new Set([scope]);
  const exportsAccessScopes = /* @__PURE__ */ new Set([scope]);
  const moduleExportsAssignments = [];
  let firstTopLevelModuleExportsAssignment = null;
  const exportsAssignmentsByName = /* @__PURE__ */ new Map();
  const topLevelAssignments = /* @__PURE__ */ new Set();
  const topLevelDefineCompiledEsmExpressions = [];
  const replacedGlobal = [];
  const replacedThis = [];
  const replacedDynamicRequires = [];
  const importedVariables = /* @__PURE__ */ new Set();
  const indentExclusionRanges = [];
  walk(ast, {
    enter(node, parent) {
      if (skippedNodes.has(node)) {
        this.skip();
        return;
      }
      if (currentTryBlockEnd !== null && node.start > currentTryBlockEnd) {
        currentTryBlockEnd = null;
      }
      if (currentConditionalNodeEnd !== null && node.start > currentConditionalNodeEnd) {
        currentConditionalNodeEnd = null;
      }
      if (currentConditionalNodeEnd === null && conditionalNodes.has(node)) {
        currentConditionalNodeEnd = node.end;
      }
      programDepth += 1;
      if (node.scope) ({ scope } = node);
      if (functionType.test(node.type)) lexicalDepth += 1;
      if (sourceMap) {
        magicString.addSourcemapLocation(node.start);
        magicString.addSourcemapLocation(node.end);
      }
      switch (node.type) {
        case "AssignmentExpression":
          if (node.left.type === "MemberExpression") {
            const flattened = getKeypath(node.left);
            if (!flattened || scope.contains(flattened.name)) return;
            const exportsPatternMatch = exportsPattern.exec(flattened.keypath);
            if (!exportsPatternMatch || flattened.keypath === "exports") return;
            const [, exportName] = exportsPatternMatch;
            uses[flattened.name] = true;
            if (flattened.keypath === "module.exports") {
              moduleExportsAssignments.push(node);
              if (programDepth > 3) {
                moduleAccessScopes.add(scope);
              } else if (!firstTopLevelModuleExportsAssignment) {
                firstTopLevelModuleExportsAssignment = node;
              }
            } else if (exportName === KEY_COMPILED_ESM) {
              if (programDepth > 3) {
                shouldWrap = true;
              } else {
                topLevelDefineCompiledEsmExpressions.push({ node, type: flattened.name });
              }
            } else {
              const exportsAssignments = exportsAssignmentsByName.get(exportName) || {
                nodes: [],
                scopes: /* @__PURE__ */ new Set()
              };
              exportsAssignments.nodes.push({ node, type: flattened.name });
              exportsAssignments.scopes.add(scope);
              exportsAccessScopes.add(scope);
              exportsAssignmentsByName.set(exportName, exportsAssignments);
              if (programDepth <= 3) {
                topLevelAssignments.add(node);
              }
            }
            skippedNodes.add(node.left);
          } else {
            for (const name of extractAssignedNames(node.left)) {
              reassignedNames.add(name);
            }
          }
          return;
        case "CallExpression": {
          const defineCompiledEsmType = getDefineCompiledEsmType(node);
          if (defineCompiledEsmType) {
            if (programDepth === 3 && parent.type === "ExpressionStatement") {
              skippedNodes.add(node.arguments[0]);
              topLevelDefineCompiledEsmExpressions.push({ node, type: defineCompiledEsmType });
            } else {
              shouldWrap = true;
            }
            return;
          }
          if (isDynamicRequireModulesEnabled && node.callee.object && isRequire(node.callee.object, scope) && node.callee.property.name === "resolve") {
            checkDynamicRequire(node.start);
            uses.require = true;
            const requireNode = node.callee.object;
            replacedDynamicRequires.push(requireNode);
            skippedNodes.add(node.callee);
            return;
          }
          if (!isRequireExpression(node, scope)) {
            const keypath = getKeypath(node.callee);
            if (keypath && importedVariables.has(keypath.name)) {
              currentConditionalNodeEnd = Infinity;
            }
            return;
          }
          skippedNodes.add(node.callee);
          uses.require = true;
          if (hasDynamicArguments(node)) {
            if (isDynamicRequireModulesEnabled) {
              checkDynamicRequire(node.start);
            }
            if (!ignoreDynamicRequires) {
              replacedDynamicRequires.push(node.callee);
            }
            return;
          }
          const requireStringArg = getRequireStringArg(node);
          if (!ignoreRequire(requireStringArg)) {
            const usesReturnValue = parent.type !== "ExpressionStatement";
            const toBeRemoved = parent.type === "ExpressionStatement" && (!currentConditionalNodeEnd || // We should completely remove requires directly in a try-catch
            // so that Rollup can remove up the try-catch
            currentTryBlockEnd !== null && currentTryBlockEnd < currentConditionalNodeEnd) ? parent : node;
            addRequireExpression(
              requireStringArg,
              node,
              scope,
              usesReturnValue,
              currentTryBlockEnd !== null,
              currentConditionalNodeEnd !== null,
              toBeRemoved
            );
            if (parent.type === "VariableDeclarator" && parent.id.type === "Identifier") {
              for (const name of extractAssignedNames(parent.id)) {
                importedVariables.add(name);
              }
            }
          }
          return;
        }
        case "ClassBody":
          classBodyDepth += 1;
          return;
        case "ConditionalExpression":
        case "IfStatement":
          if (isFalsy(node.test)) {
            skippedNodes.add(node.consequent);
          } else if (isTruthy(node.test)) {
            if (node.alternate) {
              skippedNodes.add(node.alternate);
            }
          } else {
            conditionalNodes.add(node.consequent);
            if (node.alternate) {
              conditionalNodes.add(node.alternate);
            }
          }
          return;
        case "ArrowFunctionExpression":
        case "FunctionDeclaration":
        case "FunctionExpression":
          if (currentConditionalNodeEnd === null && !(parent.type === "CallExpression" && parent.callee === node)) {
            currentConditionalNodeEnd = node.end;
          }
          return;
        case "Identifier": {
          const { name } = node;
          if (!(0, import_is_reference.default)(node, parent) || scope.contains(name) || parent.type === "PropertyDefinition" && parent.key === node)
            return;
          switch (name) {
            case "require":
              uses.require = true;
              if (isNodeRequirePropertyAccess(parent)) {
                return;
              }
              if (!ignoreDynamicRequires) {
                if (isShorthandProperty(parent)) {
                  skippedNodes.add(parent.value);
                  magicString.prependRight(node.start, "require: ");
                }
                replacedDynamicRequires.push(node);
              }
              return;
            case "module":
            case "exports":
              shouldWrap = true;
              uses[name] = true;
              return;
            case "global":
              uses.global = true;
              if (!ignoreGlobal) {
                replacedGlobal.push(node);
              }
              return;
            case "define":
              magicString.overwrite(node.start, node.end, "undefined", {
                storeName: true
              });
              return;
            default:
              globals.add(name);
              return;
          }
        }
        case "LogicalExpression":
          if (node.operator === "&&") {
            if (isFalsy(node.left)) {
              skippedNodes.add(node.right);
            } else if (!isTruthy(node.left)) {
              conditionalNodes.add(node.right);
            }
          } else if (node.operator === "||") {
            if (isTruthy(node.left)) {
              skippedNodes.add(node.right);
            } else if (!isFalsy(node.left)) {
              conditionalNodes.add(node.right);
            }
          }
          return;
        case "MemberExpression":
          if (!isDynamicRequireModulesEnabled && isModuleRequire(node, scope)) {
            uses.require = true;
            replacedDynamicRequires.push(node);
            skippedNodes.add(node.object);
            skippedNodes.add(node.property);
          }
          return;
        case "ReturnStatement":
          if (lexicalDepth === 0) {
            shouldWrap = true;
          }
          return;
        case "ThisExpression":
          if (lexicalDepth === 0 && !classBodyDepth) {
            uses.global = true;
            if (!ignoreGlobal) {
              replacedThis.push(node);
            }
          }
          return;
        case "TryStatement":
          if (currentTryBlockEnd === null) {
            currentTryBlockEnd = node.block.end;
          }
          if (currentConditionalNodeEnd === null) {
            currentConditionalNodeEnd = node.end;
          }
          return;
        case "UnaryExpression":
          if (node.operator === "typeof") {
            const flattened = getKeypath(node.argument);
            if (!flattened) return;
            if (scope.contains(flattened.name)) return;
            if (!isEsModule && (flattened.keypath === "module.exports" || flattened.keypath === "module" || flattened.keypath === "exports")) {
              magicString.overwrite(node.start, node.end, `'object'`, {
                storeName: false
              });
            }
          }
          return;
        case "VariableDeclaration":
          if (!scope.parent) {
            topLevelDeclarations.push(node);
          }
          return;
        case "TemplateElement":
          if (node.value.raw.includes("\n")) {
            indentExclusionRanges.push([node.start, node.end]);
          }
      }
    },
    leave(node) {
      programDepth -= 1;
      if (node.scope) scope = scope.parent;
      if (functionType.test(node.type)) lexicalDepth -= 1;
      if (node.type === "ClassBody") classBodyDepth -= 1;
    }
  });
  const nameBase = getName(id);
  const exportsName = deconflict([...exportsAccessScopes], globals, nameBase);
  const moduleName = deconflict([...moduleAccessScopes], globals, `${nameBase}Module`);
  const requireName = deconflict([scope], globals, `require${capitalize(nameBase)}`);
  const isRequiredName = deconflict([scope], globals, `hasRequired${capitalize(nameBase)}`);
  const helpersName = deconflict([scope], globals, "commonjsHelpers");
  const dynamicRequireName = replacedDynamicRequires.length > 0 && deconflict(
    [scope],
    globals,
    isDynamicRequireModulesEnabled ? CREATE_COMMONJS_REQUIRE_EXPORT : COMMONJS_REQUIRE_EXPORT
  );
  const deconflictedExportNames = /* @__PURE__ */ Object.create(null);
  for (const [exportName, { scopes }] of exportsAssignmentsByName) {
    deconflictedExportNames[exportName] = deconflict([...scopes], globals, exportName);
  }
  for (const node of replacedGlobal) {
    magicString.overwrite(node.start, node.end, `${helpersName}.commonjsGlobal`, {
      storeName: true
    });
  }
  for (const node of replacedThis) {
    magicString.overwrite(node.start, node.end, exportsName, {
      storeName: true
    });
  }
  for (const node of replacedDynamicRequires) {
    magicString.overwrite(
      node.start,
      node.end,
      isDynamicRequireModulesEnabled ? `${dynamicRequireName}(${JSON.stringify(virtualDynamicRequirePath)})` : dynamicRequireName,
      {
        contentOnly: true,
        storeName: true
      }
    );
  }
  shouldWrap = !isEsModule && (shouldWrap || uses.exports && moduleExportsAssignments.length > 0);
  if (!(shouldWrap || isRequired || needsRequireWrapper || uses.module || uses.exports || uses.require || topLevelDefineCompiledEsmExpressions.length > 0) && (ignoreGlobal || !uses.global)) {
    return { meta: { commonjs: { isCommonJS: false } } };
  }
  let leadingComment = "";
  if (code.startsWith("/*")) {
    const commentEnd = code.indexOf("*/", 2) + 2;
    leadingComment = `${code.slice(0, commentEnd)}
`;
    magicString.remove(0, commentEnd).trim();
  }
  let shebang = "";
  if (code.startsWith("#!")) {
    const shebangEndPosition = code.indexOf("\n") + 1;
    shebang = code.slice(0, shebangEndPosition);
    magicString.remove(0, shebangEndPosition).trim();
  }
  const exportMode = isEsModule ? "none" : shouldWrap ? uses.module ? "module" : "exports" : firstTopLevelModuleExportsAssignment ? exportsAssignmentsByName.size === 0 && topLevelDefineCompiledEsmExpressions.length === 0 ? "replace" : "module" : moduleExportsAssignments.length === 0 ? "exports" : "module";
  const exportedExportsName = exportMode === "module" ? deconflict([], globals, `${nameBase}Exports`) : exportsName;
  const importBlock = await rewriteRequireExpressionsAndGetImportBlock(
    magicString,
    topLevelDeclarations,
    reassignedNames,
    helpersName,
    dynamicRequireName,
    moduleName,
    exportsName,
    id,
    exportMode,
    resolveRequireSourcesAndUpdateMeta,
    needsRequireWrapper,
    isEsModule,
    isDynamicRequireModulesEnabled,
    getIgnoreTryCatchRequireStatementMode,
    commonjsMeta
  );
  const usesRequireWrapper = commonjsMeta.isCommonJS === IS_WRAPPED_COMMONJS;
  const exportBlock = isEsModule ? "" : rewriteExportsAndGetExportsBlock(
    magicString,
    moduleName,
    exportsName,
    exportedExportsName,
    shouldWrap,
    moduleExportsAssignments,
    firstTopLevelModuleExportsAssignment,
    exportsAssignmentsByName,
    topLevelAssignments,
    topLevelDefineCompiledEsmExpressions,
    deconflictedExportNames,
    code,
    helpersName,
    exportMode,
    defaultIsModuleExports,
    usesRequireWrapper,
    requireName
  );
  if (shouldWrap) {
    wrapCode(magicString, uses, moduleName, exportsName, indentExclusionRanges);
  }
  if (usesRequireWrapper) {
    magicString.trim().indent("	", {
      exclude: indentExclusionRanges
    });
    const exported = exportMode === "module" ? `${moduleName}.exports` : exportsName;
    magicString.prepend(
      `var ${isRequiredName};

function ${requireName} () {
	if (${isRequiredName}) return ${exported};
	${isRequiredName} = 1;
`
    ).append(`
	return ${exported};
}`);
    if (exportMode === "replace") {
      magicString.prepend(`var ${exportsName};
`);
    }
  }
  magicString.trim().prepend(shebang + leadingComment + importBlock).append(exportBlock);
  return {
    code: magicString.toString(),
    map: sourceMap ? magicString.generateMap() : null,
    syntheticNamedExports: isEsModule || usesRequireWrapper ? false : "__moduleExports",
    meta: { commonjs: { ...commonjsMeta, shebang } }
  };
}
var PLUGIN_NAME = "commonjs";
function commonjs(options = {}) {
  const {
    ignoreGlobal,
    ignoreDynamicRequires,
    requireReturnsDefault: requireReturnsDefaultOption,
    defaultIsModuleExports: defaultIsModuleExportsOption,
    esmExternals
  } = options;
  const extensions = options.extensions || [".js"];
  const filter = createFilter(options.include, options.exclude);
  const isPossibleCjsId = (id) => {
    const extName = extname2(id);
    return extName === ".cjs" || extensions.includes(extName) && filter(id);
  };
  const { strictRequiresFilter, detectCyclesAndConditional } = getStrictRequiresFilter(options);
  const getRequireReturnsDefault = typeof requireReturnsDefaultOption === "function" ? requireReturnsDefaultOption : () => requireReturnsDefaultOption;
  let esmExternalIds;
  const isEsmExternal = typeof esmExternals === "function" ? esmExternals : Array.isArray(esmExternals) ? (esmExternalIds = new Set(esmExternals), (id) => esmExternalIds.has(id)) : () => esmExternals;
  const getDefaultIsModuleExports = typeof defaultIsModuleExportsOption === "function" ? defaultIsModuleExportsOption : () => typeof defaultIsModuleExportsOption === "boolean" ? defaultIsModuleExportsOption : "auto";
  const dynamicRequireRoot = typeof options.dynamicRequireRoot === "string" ? resolve3(options.dynamicRequireRoot) : process.cwd();
  const { commonDir, dynamicRequireModules } = getDynamicRequireModules(
    options.dynamicRequireTargets,
    dynamicRequireRoot
  );
  const isDynamicRequireModulesEnabled = dynamicRequireModules.size > 0;
  const ignoreRequire = typeof options.ignore === "function" ? options.ignore : Array.isArray(options.ignore) ? (id) => options.ignore.includes(id) : () => false;
  const getIgnoreTryCatchRequireStatementMode = (id) => {
    const mode = typeof options.ignoreTryCatch === "function" ? options.ignoreTryCatch(id) : Array.isArray(options.ignoreTryCatch) ? options.ignoreTryCatch.includes(id) : typeof options.ignoreTryCatch !== "undefined" ? options.ignoreTryCatch : true;
    return {
      canConvertRequire: mode !== "remove" && mode !== true,
      shouldRemoveRequire: mode === "remove"
    };
  };
  const { currentlyResolving, resolveId } = getResolveId(extensions, isPossibleCjsId);
  const sourceMap = options.sourceMap !== false;
  let requireResolver;
  function transformAndCheckExports(code, id) {
    const normalizedId = normalizePathSlashes(id);
    const { isEsModule, hasDefaultExport, hasNamedExports, ast } = analyzeTopLevelStatements(
      this.parse,
      code,
      id
    );
    const commonjsMeta = this.getModuleInfo(id).meta.commonjs || {};
    if (hasDefaultExport) {
      commonjsMeta.hasDefaultExport = true;
    }
    if (hasNamedExports) {
      commonjsMeta.hasNamedExports = true;
    }
    if (!dynamicRequireModules.has(normalizedId) && (!(hasCjsKeywords(code, ignoreGlobal) || requireResolver.isRequiredId(id)) || isEsModule && !options.transformMixedEsModules)) {
      commonjsMeta.isCommonJS = false;
      return { meta: { commonjs: commonjsMeta } };
    }
    const needsRequireWrapper = !isEsModule && (dynamicRequireModules.has(normalizedId) || strictRequiresFilter(id));
    const checkDynamicRequire = (position) => {
      const normalizedDynamicRequireRoot = normalizePathSlashes(dynamicRequireRoot);
      if (normalizedId.indexOf(normalizedDynamicRequireRoot) !== 0) {
        this.error(
          {
            code: "DYNAMIC_REQUIRE_OUTSIDE_ROOT",
            normalizedId,
            normalizedDynamicRequireRoot,
            message: `"${normalizedId}" contains dynamic require statements but it is not within the current dynamicRequireRoot "${normalizedDynamicRequireRoot}". You should set dynamicRequireRoot to "${dirname2(
              normalizedId
            )}" or one of its parent directories.`
          },
          position
        );
      }
    };
    return transformCommonjs(
      this.parse,
      code,
      id,
      isEsModule,
      ignoreGlobal || isEsModule,
      ignoreRequire,
      ignoreDynamicRequires && !isDynamicRequireModulesEnabled,
      getIgnoreTryCatchRequireStatementMode,
      sourceMap,
      isDynamicRequireModulesEnabled,
      dynamicRequireModules,
      commonDir,
      ast,
      getDefaultIsModuleExports(id),
      needsRequireWrapper,
      requireResolver.resolveRequireSourcesAndUpdateMeta(this),
      requireResolver.isRequiredId(id),
      checkDynamicRequire,
      commonjsMeta
    );
  }
  return {
    name: PLUGIN_NAME,
    version,
    options(rawOptions) {
      const plugins = Array.isArray(rawOptions.plugins) ? [...rawOptions.plugins] : rawOptions.plugins ? [rawOptions.plugins] : [];
      plugins.unshift({
        name: "commonjs--resolver",
        resolveId
      });
      return { ...rawOptions, plugins };
    },
    buildStart({ plugins }) {
      validateVersion(this.meta.rollupVersion, peerDependencies.rollup, "rollup");
      const nodeResolve = plugins.find(({ name }) => name === "node-resolve");
      if (nodeResolve) {
        validateVersion(nodeResolve.version, "^13.0.6", "@rollup/plugin-node-resolve");
      }
      if (options.namedExports != null) {
        this.warn(
          'The namedExports option from "@rollup/plugin-commonjs" is deprecated. Named exports are now handled automatically.'
        );
      }
      requireResolver = getRequireResolver(
        extensions,
        detectCyclesAndConditional,
        currentlyResolving
      );
    },
    buildEnd() {
      if (options.strictRequires === "debug") {
        const wrappedIds = requireResolver.getWrappedIds();
        if (wrappedIds.length) {
          this.warn({
            code: "WRAPPED_IDS",
            ids: wrappedIds,
            message: `The commonjs plugin automatically wrapped the following files:
[
${wrappedIds.map((id) => `	${JSON.stringify(relative2(process.cwd(), id))}`).join(",\n")}
]`
          });
        } else {
          this.warn({
            code: "WRAPPED_IDS",
            ids: wrappedIds,
            message: "The commonjs plugin did not wrap any files."
          });
        }
      }
    },
    async load(id) {
      if (id === HELPERS_ID) {
        return getHelpersModule();
      }
      if (isWrappedId(id, MODULE_SUFFIX)) {
        const name = getName(unwrapId(id, MODULE_SUFFIX));
        return {
          code: `var ${name} = {exports: {}}; export {${name} as __module}`,
          meta: { commonjs: { isCommonJS: false } }
        };
      }
      if (isWrappedId(id, EXPORTS_SUFFIX)) {
        const name = getName(unwrapId(id, EXPORTS_SUFFIX));
        return {
          code: `var ${name} = {}; export {${name} as __exports}`,
          meta: { commonjs: { isCommonJS: false } }
        };
      }
      if (isWrappedId(id, EXTERNAL_SUFFIX)) {
        const actualId = unwrapId(id, EXTERNAL_SUFFIX);
        if (actualId.startsWith("node:")) {
          return getExternalBuiltinRequireProxy(actualId);
        }
        return getUnknownRequireProxy(
          actualId,
          isEsmExternal(actualId) ? getRequireReturnsDefault(actualId) : true
        );
      }
      if (id.endsWith(ENTRY_SUFFIX)) {
        const acutalId = id.slice(0, -ENTRY_SUFFIX.length);
        const {
          meta: { commonjs: commonjsMeta }
        } = this.getModuleInfo(acutalId);
        const shebang = commonjsMeta?.shebang ?? "";
        return getEntryProxy(
          acutalId,
          getDefaultIsModuleExports(acutalId),
          this.getModuleInfo,
          shebang
        );
      }
      if (isWrappedId(id, ES_IMPORT_SUFFIX)) {
        const actualId = unwrapId(id, ES_IMPORT_SUFFIX);
        return getEsImportProxy(
          actualId,
          getDefaultIsModuleExports(actualId),
          (await this.load({ id: actualId })).moduleSideEffects
        );
      }
      if (id === DYNAMIC_MODULES_ID) {
        return getDynamicModuleRegistry(
          isDynamicRequireModulesEnabled,
          dynamicRequireModules,
          commonDir,
          ignoreDynamicRequires
        );
      }
      if (isWrappedId(id, PROXY_SUFFIX)) {
        const actualId = unwrapId(id, PROXY_SUFFIX);
        return getStaticRequireProxy(actualId, getRequireReturnsDefault(actualId), this.load);
      }
      return null;
    },
    shouldTransformCachedModule(...args) {
      return requireResolver.shouldTransformCachedModule.call(this, ...args);
    },
    transform(code, id) {
      if (!isPossibleCjsId(id)) return null;
      try {
        return transformAndCheckExports.call(this, code, id);
      } catch (err) {
        return this.error(err, err.pos);
      }
    }
  };
}
export {
  commonjs as default
};
