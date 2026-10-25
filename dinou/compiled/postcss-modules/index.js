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

// ../node_modules/postcss-modules/build/fs.js
var require_fs = __commonJS({
  "../node_modules/postcss-modules/build/fs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.getFileSystem = getFileSystem;
    exports.setFileSystem = setFileSystem;
    var fileSystem = {
      readFile: () => {
        throw Error("readFile not implemented");
      },
      writeFile: () => {
        throw Error("writeFile not implemented");
      }
    };
    function setFileSystem(fs) {
      fileSystem.readFile = fs.readFile;
      fileSystem.writeFile = fs.writeFile;
    }
    function getFileSystem() {
      return fileSystem;
    }
  }
});

// ../node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS({
  "../node_modules/picocolors/picocolors.js"(exports, module) {
    var p = process || {};
    var argv = p.argv || [];
    var env = p.env || {};
    var isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
    var formatter = (open, close, replace = open) => (input) => {
      let string = "" + input, index = string.indexOf(close, open.length);
      return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
    };
    var replaceClose = (string, close, replace, index) => {
      let result = "", cursor = 0;
      do {
        result += string.substring(cursor, index) + replace;
        cursor = index + close.length;
        index = string.indexOf(close, cursor);
      } while (~index);
      return result + string.substring(cursor);
    };
    var createColors = (enabled = isColorSupported) => {
      let f = enabled ? formatter : () => String;
      return {
        isColorSupported: enabled,
        reset: f("\x1B[0m", "\x1B[0m"),
        bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
        dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
        italic: f("\x1B[3m", "\x1B[23m"),
        underline: f("\x1B[4m", "\x1B[24m"),
        inverse: f("\x1B[7m", "\x1B[27m"),
        hidden: f("\x1B[8m", "\x1B[28m"),
        strikethrough: f("\x1B[9m", "\x1B[29m"),
        black: f("\x1B[30m", "\x1B[39m"),
        red: f("\x1B[31m", "\x1B[39m"),
        green: f("\x1B[32m", "\x1B[39m"),
        yellow: f("\x1B[33m", "\x1B[39m"),
        blue: f("\x1B[34m", "\x1B[39m"),
        magenta: f("\x1B[35m", "\x1B[39m"),
        cyan: f("\x1B[36m", "\x1B[39m"),
        white: f("\x1B[37m", "\x1B[39m"),
        gray: f("\x1B[90m", "\x1B[39m"),
        bgBlack: f("\x1B[40m", "\x1B[49m"),
        bgRed: f("\x1B[41m", "\x1B[49m"),
        bgGreen: f("\x1B[42m", "\x1B[49m"),
        bgYellow: f("\x1B[43m", "\x1B[49m"),
        bgBlue: f("\x1B[44m", "\x1B[49m"),
        bgMagenta: f("\x1B[45m", "\x1B[49m"),
        bgCyan: f("\x1B[46m", "\x1B[49m"),
        bgWhite: f("\x1B[47m", "\x1B[49m"),
        blackBright: f("\x1B[90m", "\x1B[39m"),
        redBright: f("\x1B[91m", "\x1B[39m"),
        greenBright: f("\x1B[92m", "\x1B[39m"),
        yellowBright: f("\x1B[93m", "\x1B[39m"),
        blueBright: f("\x1B[94m", "\x1B[39m"),
        magentaBright: f("\x1B[95m", "\x1B[39m"),
        cyanBright: f("\x1B[96m", "\x1B[39m"),
        whiteBright: f("\x1B[97m", "\x1B[39m"),
        bgBlackBright: f("\x1B[100m", "\x1B[49m"),
        bgRedBright: f("\x1B[101m", "\x1B[49m"),
        bgGreenBright: f("\x1B[102m", "\x1B[49m"),
        bgYellowBright: f("\x1B[103m", "\x1B[49m"),
        bgBlueBright: f("\x1B[104m", "\x1B[49m"),
        bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
        bgCyanBright: f("\x1B[106m", "\x1B[49m"),
        bgWhiteBright: f("\x1B[107m", "\x1B[49m")
      };
    };
    module.exports = createColors();
    module.exports.createColors = createColors;
  }
});

// ../node_modules/postcss/lib/tokenize.js
var require_tokenize = __commonJS({
  "../node_modules/postcss/lib/tokenize.js"(exports, module) {
    "use strict";
    var SINGLE_QUOTE = "'".charCodeAt(0);
    var DOUBLE_QUOTE = '"'.charCodeAt(0);
    var BACKSLASH = "\\".charCodeAt(0);
    var SLASH = "/".charCodeAt(0);
    var NEWLINE = "\n".charCodeAt(0);
    var SPACE = " ".charCodeAt(0);
    var FEED = "\f".charCodeAt(0);
    var TAB = "	".charCodeAt(0);
    var CR = "\r".charCodeAt(0);
    var OPEN_SQUARE = "[".charCodeAt(0);
    var CLOSE_SQUARE = "]".charCodeAt(0);
    var OPEN_PARENTHESES = "(".charCodeAt(0);
    var CLOSE_PARENTHESES = ")".charCodeAt(0);
    var OPEN_CURLY = "{".charCodeAt(0);
    var CLOSE_CURLY = "}".charCodeAt(0);
    var SEMICOLON = ";".charCodeAt(0);
    var ASTERISK = "*".charCodeAt(0);
    var COLON = ":".charCodeAt(0);
    var AT = "@".charCodeAt(0);
    var RE_AT_END = /[\t\n\f\r "#'()/;[\\\]{}]/g;
    var RE_WORD_END = /[\t\n\f\r !"#'():;@[\\\]{}]|\/(?=\*)/g;
    var RE_BAD_BRACKET = /.[\r\n"'(/\\]/;
    var RE_HEX_ESCAPE = /[\da-f]/i;
    module.exports = function tokenizer(input, options = {}) {
      let css = input.css.valueOf();
      let ignore = options.ignoreErrors;
      let code, content, escape, next, quote;
      let currentToken, escaped, escapePos, n, prev;
      let length = css.length;
      let pos = 0;
      let buffer = [];
      let returned = [];
      let lastBadParen = -1;
      function position() {
        return pos;
      }
      function unclosed(what) {
        throw input.error("Unclosed " + what, pos);
      }
      function endOfFile() {
        return returned.length === 0 && pos >= length;
      }
      function nextToken(opts) {
        if (returned.length) return returned.pop();
        if (pos >= length) return;
        let ignoreUnclosed = opts ? opts.ignoreUnclosed : false;
        code = css.charCodeAt(pos);
        switch (code) {
          case NEWLINE:
          case SPACE:
          case TAB:
          case CR:
          case FEED: {
            next = pos;
            do {
              next += 1;
              code = css.charCodeAt(next);
            } while (code === SPACE || code === NEWLINE || code === TAB || code === CR || code === FEED);
            currentToken = ["space", css.slice(pos, next)];
            pos = next - 1;
            break;
          }
          case OPEN_SQUARE:
          case CLOSE_SQUARE:
          case OPEN_CURLY:
          case CLOSE_CURLY:
          case COLON:
          case SEMICOLON:
          case CLOSE_PARENTHESES: {
            let controlChar = String.fromCharCode(code);
            currentToken = [controlChar, controlChar, pos];
            break;
          }
          case OPEN_PARENTHESES: {
            prev = buffer.length ? buffer.pop()[1] : "";
            n = css.charCodeAt(pos + 1);
            if (prev === "url" && n !== SINGLE_QUOTE && n !== DOUBLE_QUOTE && n !== SPACE && n !== NEWLINE && n !== TAB && n !== FEED && n !== CR) {
              next = pos;
              do {
                escaped = false;
                next = css.indexOf(")", next + 1);
                if (next === -1) {
                  if (ignore || ignoreUnclosed) {
                    next = pos;
                    break;
                  } else {
                    unclosed("bracket");
                  }
                }
                escapePos = next;
                while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
                  escapePos -= 1;
                  escaped = !escaped;
                }
              } while (escaped);
              currentToken = ["brackets", css.slice(pos, next + 1), pos, next];
              pos = next;
            } else if (pos <= lastBadParen) {
              currentToken = ["(", "(", pos];
            } else {
              next = css.indexOf(")", pos + 1);
              content = css.slice(pos, next + 1);
              if (next === -1 || RE_BAD_BRACKET.test(content)) {
                lastBadParen = next === -1 ? length : next;
                currentToken = ["(", "(", pos];
              } else {
                currentToken = ["brackets", content, pos, next];
                pos = next;
              }
            }
            break;
          }
          case SINGLE_QUOTE:
          case DOUBLE_QUOTE: {
            quote = code === SINGLE_QUOTE ? "'" : '"';
            next = pos;
            do {
              escaped = false;
              next = css.indexOf(quote, next + 1);
              if (next === -1) {
                if (ignore || ignoreUnclosed) {
                  next = pos + 1;
                  break;
                } else {
                  unclosed("string");
                }
              }
              escapePos = next;
              while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
                escapePos -= 1;
                escaped = !escaped;
              }
            } while (escaped);
            currentToken = ["string", css.slice(pos, next + 1), pos, next];
            pos = next;
            break;
          }
          case AT: {
            RE_AT_END.lastIndex = pos + 1;
            RE_AT_END.test(css);
            if (RE_AT_END.lastIndex === 0) {
              next = css.length - 1;
            } else {
              next = RE_AT_END.lastIndex - 2;
            }
            currentToken = ["at-word", css.slice(pos, next + 1), pos, next];
            pos = next;
            break;
          }
          case BACKSLASH: {
            next = pos;
            escape = true;
            while (css.charCodeAt(next + 1) === BACKSLASH) {
              next += 1;
              escape = !escape;
            }
            code = css.charCodeAt(next + 1);
            if (escape && code !== SLASH && code !== SPACE && code !== NEWLINE && code !== TAB && code !== CR && code !== FEED) {
              next += 1;
              if (RE_HEX_ESCAPE.test(css.charAt(next))) {
                while (RE_HEX_ESCAPE.test(css.charAt(next + 1))) {
                  next += 1;
                }
                if (css.charCodeAt(next + 1) === SPACE) {
                  next += 1;
                }
              }
            }
            currentToken = ["word", css.slice(pos, next + 1), pos, next];
            pos = next;
            break;
          }
          default: {
            if (code === SLASH && css.charCodeAt(pos + 1) === ASTERISK) {
              next = css.indexOf("*/", pos + 2) + 1;
              if (next === 0) {
                if (ignore || ignoreUnclosed) {
                  next = css.length;
                } else {
                  unclosed("comment");
                }
              }
              currentToken = ["comment", css.slice(pos, next + 1), pos, next];
              pos = next;
            } else {
              RE_WORD_END.lastIndex = pos + 1;
              RE_WORD_END.test(css);
              if (RE_WORD_END.lastIndex === 0) {
                next = css.length - 1;
              } else {
                next = RE_WORD_END.lastIndex - 2;
              }
              currentToken = ["word", css.slice(pos, next + 1), pos, next];
              buffer.push(currentToken);
              pos = next;
            }
            break;
          }
        }
        pos++;
        return currentToken;
      }
      function back(token) {
        returned.push(token);
      }
      return {
        back,
        endOfFile,
        nextToken,
        position
      };
    };
  }
});

// ../node_modules/postcss/lib/terminal-highlight.js
var require_terminal_highlight = __commonJS({
  "../node_modules/postcss/lib/terminal-highlight.js"(exports, module) {
    "use strict";
    var pico = require_picocolors();
    var tokenizer = require_tokenize();
    var Input;
    function registerInput(dependant) {
      Input = dependant;
    }
    var HIGHLIGHT_THEME = {
      ";": pico.yellow,
      ":": pico.yellow,
      "(": pico.cyan,
      ")": pico.cyan,
      "[": pico.yellow,
      "]": pico.yellow,
      "{": pico.yellow,
      "}": pico.yellow,
      "at-word": pico.cyan,
      "brackets": pico.cyan,
      "call": pico.cyan,
      "class": pico.yellow,
      "comment": pico.gray,
      "hash": pico.magenta,
      "string": pico.green
    };
    function getTokenType([type, value], processor) {
      if (type === "word") {
        if (value[0] === ".") {
          return "class";
        }
        if (value[0] === "#") {
          return "hash";
        }
      }
      if (!processor.endOfFile()) {
        let next = processor.nextToken();
        processor.back(next);
        if (next[0] === "brackets" || next[0] === "(") return "call";
      }
      return type;
    }
    function terminalHighlight(css) {
      let processor = tokenizer(new Input(css), { ignoreErrors: true });
      let result = "";
      while (!processor.endOfFile()) {
        let token = processor.nextToken();
        let color = HIGHLIGHT_THEME[getTokenType(token, processor)];
        if (color) {
          result += token[1].split(/\r?\n/).map((i) => color(i)).join("\n");
        } else {
          result += token[1];
        }
      }
      return result;
    }
    terminalHighlight.registerInput = registerInput;
    module.exports = terminalHighlight;
  }
});

// ../node_modules/postcss/lib/css-syntax-error.js
var require_css_syntax_error = __commonJS({
  "../node_modules/postcss/lib/css-syntax-error.js"(exports, module) {
    "use strict";
    var pico = require_picocolors();
    var terminalHighlight = require_terminal_highlight();
    var CssSyntaxError = class _CssSyntaxError extends Error {
      constructor(message, line, column, source, file, plugin) {
        super(message);
        this.name = "CssSyntaxError";
        this.reason = message;
        if (file) {
          this.file = file;
        }
        if (source) {
          this.source = source;
        }
        if (plugin) {
          this.plugin = plugin;
        }
        if (typeof line !== "undefined" && typeof column !== "undefined") {
          if (typeof line === "number") {
            this.line = line;
            this.column = column;
          } else {
            this.line = line.line;
            this.column = line.column;
            this.endLine = column.line;
            this.endColumn = column.column;
          }
        }
        this.setMessage();
        if (Error.captureStackTrace) {
          Error.captureStackTrace(this, _CssSyntaxError);
        }
      }
      setMessage() {
        this.message = this.plugin ? this.plugin + ": " : "";
        this.message += this.file ? this.file : "<css input>";
        if (typeof this.line !== "undefined") {
          this.message += ":" + this.line + ":" + this.column;
        }
        this.message += ": " + this.reason;
      }
      showSourceCode(color) {
        if (!this.source) return "";
        let css = this.source;
        if (color == null) color = pico.isColorSupported;
        let aside = (text) => text;
        let mark = (text) => text;
        let highlight = (text) => text;
        if (color) {
          let { bold, gray, red } = pico.createColors(true);
          mark = (text) => bold(red(text));
          aside = (text) => gray(text);
          if (terminalHighlight) {
            highlight = (text) => terminalHighlight(text);
          }
        }
        let lines = css.split(/\r?\n/);
        let start = Math.max(this.line - 3, 0);
        let end = Math.min(this.line + 2, lines.length);
        let maxWidth = String(end).length;
        return lines.slice(start, end).map((line, index) => {
          let number = start + 1 + index;
          let gutter = " " + (" " + number).slice(-maxWidth) + " | ";
          if (number === this.line) {
            if (line.length > 160) {
              let padding = 20;
              let subLineStart = Math.max(0, this.column - padding);
              let subLineEnd = Math.max(
                this.column + padding,
                this.endColumn + padding
              );
              let subLine = line.slice(subLineStart, subLineEnd);
              let spacing2 = aside(gutter.replace(/\d/g, " ")) + line.slice(0, Math.min(this.column - 1, padding - 1)).replace(/[^\t]/g, " ");
              return mark(">") + aside(gutter) + highlight(subLine) + "\n " + spacing2 + mark("^");
            }
            let spacing = aside(gutter.replace(/\d/g, " ")) + line.slice(0, this.column - 1).replace(/[^\t]/g, " ");
            return mark(">") + aside(gutter) + highlight(line) + "\n " + spacing + mark("^");
          }
          return " " + aside(gutter) + highlight(line);
        }).join("\n");
      }
      toString() {
        let code = this.showSourceCode();
        if (code) {
          code = "\n\n" + code + "\n";
        }
        return this.name + ": " + this.message + code;
      }
    };
    module.exports = CssSyntaxError;
    CssSyntaxError.default = CssSyntaxError;
  }
});

// ../node_modules/postcss/lib/stringifier.js
var require_stringifier = __commonJS({
  "../node_modules/postcss/lib/stringifier.js"(exports, module) {
    "use strict";
    var AT_NAME_END = /[\t\n\f\r "#'()/;[\\\]{}]/;
    var DEFAULT_RAW = {
      after: "\n",
      beforeClose: "\n",
      beforeComment: "\n",
      beforeDecl: "\n",
      beforeOpen: " ",
      beforeRule: "\n",
      colon: ": ",
      commentLeft: " ",
      commentRight: " ",
      emptyBody: "",
      indent: "    ",
      semicolon: false
    };
    function capitalize(str) {
      return str[0].toUpperCase() + str.slice(1);
    }
    function atruleStart(str, node) {
      let name = "@" + node.name;
      let params = node.params ? str.rawValue(node, "params") : "";
      let afterName = node.raws.afterName;
      if (typeof afterName === "undefined") {
        afterName = params ? " " : "";
      } else if (afterName === "" && params && !AT_NAME_END.test(params[0])) {
        afterName = " ";
      }
      return name + afterName + params;
    }
    function isCustomProperty(node) {
      if (!node.prop.startsWith("--")) return false;
      let before = node.raws.before;
      return typeof before === "undefined" || !/[^\s;]$/.test(before);
    }
    function pushBody(str, stack, node) {
      let nodes = node.nodes;
      let last = nodes.length - 1;
      while (last > 0) {
        if (nodes[last].type !== "comment") break;
        last -= 1;
      }
      let semicolon = str.raw(node, "semicolon");
      let isDocument = node.type === "document";
      for (let i = nodes.length - 1; i >= 0; i--) {
        let child = nodes[i];
        let childSemicolon = last !== i || semicolon;
        if (!childSemicolon && i < nodes.length - 1 && (child.type === "atrule" && !child.nodes || child.type === "decl" && isCustomProperty(child))) {
          childSemicolon = true;
        }
        stack.push({
          document: isDocument,
          node: child,
          semicolon: childSemicolon
        });
      }
    }
    function pushBlock(str, stack, node, start) {
      let between = str.raw(node, "between", "beforeOpen");
      str.builder(start + between + "{", node, "start");
      let hasNodes = node.nodes && node.nodes.length;
      let close = () => {
        let after = hasNodes ? str.raw(node, "after") : str.raw(node, "after", "emptyBody");
        if (after) str.builder(after);
        str.builder("}", node, "end");
        if (node.type === "rule" && node.raws.ownSemicolon) {
          str.builder(node.raws.ownSemicolon, node, "end");
        }
      };
      if (hasNodes) {
        stack.push(close);
        pushBody(str, stack, node);
      } else {
        close();
      }
    }
    var Stringifier = class _Stringifier {
      constructor(builder) {
        this.builder = builder;
      }
      atrule(node, semicolon) {
        let start = atruleStart(this, node);
        if (node.nodes) {
          this.block(node, start);
        } else {
          let end = (node.raws.between || "") + (semicolon ? ";" : "");
          this.builder(start + end, node);
        }
      }
      beforeAfter(node, detect) {
        let value;
        if (node.type === "decl") {
          value = this.raw(node, null, "beforeDecl");
        } else if (node.type === "comment") {
          value = this.raw(node, null, "beforeComment");
        } else if (detect === "before") {
          value = this.raw(node, null, "beforeRule");
        } else {
          value = this.raw(node, null, "beforeClose");
        }
        let buf = node.parent;
        let depth = 0;
        while (buf && buf.type !== "root") {
          depth += 1;
          buf = buf.parent;
        }
        if (value.includes("\n")) {
          let indent = this.raw(node, null, "indent");
          if (indent.length) {
            for (let step = 0; step < depth; step++) value += indent;
          }
        }
        return value;
      }
      block(node, start) {
        let between = this.raw(node, "between", "beforeOpen");
        this.builder(start + between + "{", node, "start");
        let after;
        if (node.nodes && node.nodes.length) {
          this.body(node);
          after = this.raw(node, "after");
        } else {
          after = this.raw(node, "after", "emptyBody");
        }
        if (after) this.builder(after);
        this.builder("}", node, "end");
      }
      body(node) {
        let proto = _Stringifier.prototype;
        let expandable = ["atrule", "block", "body", "rule", "stringify"].every(
          (method) => this[method] === proto[method]
        );
        let stack = [];
        pushBody(this, stack, node);
        while (stack.length > 0) {
          let entry = stack.pop();
          if (typeof entry === "function") {
            entry();
            continue;
          }
          let child = entry.node;
          let before = this.raw(child, "before");
          if (before) {
            this.builder(before);
          }
          if (expandable && child.type === "rule") {
            pushBlock(this, stack, child, this.rawValue(child, "selector"));
          } else if (expandable && child.type === "atrule" && child.nodes) {
            pushBlock(this, stack, child, atruleStart(this, child));
          } else {
            this.stringify(child, entry.semicolon);
          }
        }
      }
      comment(node) {
        let left = this.raw(node, "left", "commentLeft");
        let right = this.raw(node, "right", "commentRight");
        this.builder("/*" + left + node.text + right + "*/", node);
      }
      decl(node, semicolon) {
        let raws = node.raws;
        let between = this.raw(node, "between", "colon");
        let string = node.prop + between + this.rawValue(node, "value");
        if (node.important) {
          string += raws.important || " !important";
        }
        if (semicolon) string += ";";
        this.builder(string, node);
      }
      document(node) {
        this.body(node);
      }
      raw(node, own, detect) {
        let value;
        if (!detect) detect = own;
        if (own) {
          value = node.raws[own];
          if (typeof value !== "undefined") return value;
        }
        let parent = node.parent;
        if (detect === "before") {
          if (!parent || parent.type === "root" && parent.first === node) {
            return "";
          }
          if (parent && parent.type === "document") {
            return "";
          }
        }
        if (!parent) return DEFAULT_RAW[detect];
        let root = node.root();
        let cache = root.rawCache || (root.rawCache = {});
        if (typeof cache[detect] !== "undefined") {
          return cache[detect];
        }
        if (detect === "before" || detect === "after") {
          return this.beforeAfter(node, detect);
        } else {
          let method = "raw" + capitalize(detect);
          if (this[method]) {
            value = this[method](root, node);
          } else {
            root.walk((i) => {
              value = i.raws[own];
              if (typeof value !== "undefined") return false;
            });
          }
        }
        if (typeof value === "undefined") value = DEFAULT_RAW[detect];
        cache[detect] = value;
        return value;
      }
      rawBeforeClose(root) {
        let value;
        root.walk((i) => {
          if (i.nodes && i.nodes.length > 0) {
            if (typeof i.raws.after !== "undefined") {
              value = i.raws.after;
              if (value.includes("\n")) {
                value = value.replace(/[^\n]+$/, "");
              }
              return false;
            }
          }
        });
        if (value) value = value.replace(/\S/g, "");
        return value;
      }
      rawBeforeComment(root, node) {
        let value;
        root.walkComments((i) => {
          if (typeof i.raws.before !== "undefined") {
            value = i.raws.before;
            if (value.includes("\n")) {
              value = value.replace(/[^\n]+$/, "");
            }
            return false;
          }
        });
        if (typeof value === "undefined") {
          value = this.raw(node, null, "beforeDecl");
        } else if (value) {
          value = value.replace(/\S/g, "");
        }
        return value;
      }
      rawBeforeDecl(root, node) {
        let value;
        root.walkDecls((i) => {
          if (typeof i.raws.before !== "undefined") {
            value = i.raws.before;
            if (value.includes("\n")) {
              value = value.replace(/[^\n]+$/, "");
            }
            return false;
          }
        });
        if (typeof value === "undefined") {
          value = this.raw(node, null, "beforeRule");
        } else if (value) {
          value = value.replace(/\S/g, "");
        }
        return value;
      }
      rawBeforeOpen(root) {
        let value;
        root.walk((i) => {
          if (i.type !== "decl") {
            value = i.raws.between;
            if (typeof value !== "undefined") return false;
          }
        });
        return value;
      }
      rawBeforeRule(root) {
        let value;
        root.walk((i) => {
          if (i.nodes && (i.parent !== root || root.first !== i)) {
            if (typeof i.raws.before !== "undefined") {
              value = i.raws.before;
              if (value.includes("\n")) {
                value = value.replace(/[^\n]+$/, "");
              }
              return false;
            }
          }
        });
        if (value) value = value.replace(/\S/g, "");
        return value;
      }
      rawColon(root) {
        let value;
        root.walkDecls((i) => {
          if (typeof i.raws.between !== "undefined") {
            value = i.raws.between.replace(/[^\s:]/g, "");
            return false;
          }
        });
        return value;
      }
      rawEmptyBody(root) {
        let value;
        root.walk((i) => {
          if (i.nodes && i.nodes.length === 0) {
            value = i.raws.after;
            if (typeof value !== "undefined") return false;
          }
        });
        return value;
      }
      rawIndent(root) {
        if (root.raws.indent) return root.raws.indent;
        let value;
        root.walk((i) => {
          let p = i.parent;
          if (p && p !== root && p.parent && p.parent === root) {
            if (typeof i.raws.before !== "undefined") {
              let parts = i.raws.before.split("\n");
              value = parts[parts.length - 1];
              value = value.replace(/\S/g, "");
              return false;
            }
          }
        });
        return value;
      }
      rawSemicolon(root) {
        let value;
        root.walk((i) => {
          if (i.nodes && i.nodes.length && i.last.type === "decl") {
            value = i.raws.semicolon;
            if (typeof value !== "undefined") return false;
          }
        });
        return value;
      }
      rawValue(node, prop) {
        let value = node[prop];
        let raw = node.raws[prop];
        if (raw && raw.value === value) {
          return raw.raw;
        }
        return value;
      }
      root(node) {
        let inDocument = node.parent && node.parent.type === "document";
        if (!inDocument && node.source && node.source.input.hasBOM) {
          this.builder("\uFEFF", node, "start");
        }
        this.body(node);
        if (node.raws.after) {
          this.builder(node.raws.after);
        }
      }
      rule(node) {
        this.block(node, this.rawValue(node, "selector"));
        if (node.raws.ownSemicolon) {
          this.builder(node.raws.ownSemicolon, node, "end");
        }
      }
      stringify(node, semicolon) {
        if (!this[node.type]) {
          throw new Error(
            "Unknown AST node type " + node.type + ". Maybe you need to change PostCSS stringifier."
          );
        }
        this[node.type](node, semicolon);
      }
    };
    module.exports = Stringifier;
    Stringifier.default = Stringifier;
  }
});

// ../node_modules/postcss/lib/stringify.js
var require_stringify = __commonJS({
  "../node_modules/postcss/lib/stringify.js"(exports, module) {
    "use strict";
    var Stringifier = require_stringifier();
    var STYLE_TAG = /(<)(\/?style\b)/gi;
    var COMMENT_OPEN = /(<)(!--)/g;
    function escapeHTMLInCSS(str) {
      if (!str.includes("<")) return str;
      return str.replace(STYLE_TAG, "\\3c $2").replace(COMMENT_OPEN, "\\3c $2");
    }
    function cutEscaped(chunks, css, escaped) {
      let parts = [];
      let at = 0;
      let into = 0;
      for (let i = 0; i < chunks.length; i += 3) {
        let from = into;
        let end = at + chunks[i].length;
        while (at < end) {
          if (css[at] === escaped[into]) {
            at += 1;
            into += 1;
          } else {
            at += 1;
            into += 4;
          }
        }
        parts.push(escaped.slice(from, into));
      }
      return parts;
    }
    var SafeStringifier = class extends Stringifier {
      escapeHTML(print) {
        let builder = this.builder;
        let chunks, css;
        this.builder = (str, child, type) => {
          if (chunks) {
            css += str;
            chunks.push(str, child, type);
          } else if (str.includes("<")) {
            css = str;
            chunks = [str, child, type];
          } else {
            builder(str, child, type);
          }
        };
        print();
        this.builder = builder;
        if (!chunks) return;
        let escaped = escapeHTMLInCSS(css);
        if (escaped === css) {
          for (let i = 0; i < chunks.length; i += 3) {
            builder(chunks[i], chunks[i + 1], chunks[i + 2]);
          }
        } else {
          let parts = cutEscaped(chunks, css, escaped);
          for (let i = 0; i < chunks.length; i += 3) {
            builder(parts[i / 3], chunks[i + 1], chunks[i + 2]);
          }
        }
      }
      root(node) {
        if (node.parent && node.parent.type === "document") {
          this.escapeHTML(() => this.body(node));
          if (node.raws.after) this.builder(node.raws.after);
        } else {
          this.escapeHTML(() => super.root(node));
        }
      }
    };
    function stringify(node, builder) {
      let str = new SafeStringifier(builder);
      if (node.type === "root" || node.type === "document") {
        str.stringify(node);
      } else {
        str.escapeHTML(() => str.stringify(node));
      }
    }
    module.exports = stringify;
    stringify.default = stringify;
  }
});

// ../node_modules/postcss/lib/symbols.js
var require_symbols = __commonJS({
  "../node_modules/postcss/lib/symbols.js"(exports, module) {
    "use strict";
    module.exports.isClean = /* @__PURE__ */ Symbol("isClean");
    module.exports.my = /* @__PURE__ */ Symbol("my");
  }
});

// ../node_modules/postcss/lib/node.js
var require_node = __commonJS({
  "../node_modules/postcss/lib/node.js"(exports, module) {
    "use strict";
    var CssSyntaxError = require_css_syntax_error();
    var Stringifier = require_stringifier();
    var stringify = require_stringify();
    var { isClean, my } = require_symbols();
    function cloneNode(obj, parent) {
      let cloned = new obj.constructor();
      let stack = [[obj, cloned, parent]];
      while (stack.length > 0) {
        let [source, target, targetParent] = stack.pop();
        for (let i in source) {
          if (!Object.prototype.hasOwnProperty.call(source, i)) {
            continue;
          }
          if (i === "proxyCache") continue;
          let value = source[i];
          let type = typeof value;
          if (i === "parent" && type === "object") {
            if (targetParent) target[i] = targetParent;
          } else if (i === "source") {
            target[i] = value;
          } else if (Array.isArray(value)) {
            let children = [];
            target[i] = children;
            for (let j of value) {
              let childClone = new j.constructor();
              children.push(childClone);
              stack.push([j, childClone, target]);
            }
          } else {
            if (type === "object" && value !== null) {
              let valueClone = new value.constructor();
              stack.push([value, valueClone, void 0]);
              value = valueClone;
            }
            target[i] = value;
          }
        }
      }
      return cloned;
    }
    function sourceOffset(inputCSS, position) {
      if (position && typeof position.offset !== "undefined") {
        return position.offset;
      }
      let column = 1;
      let line = 1;
      let offset = 0;
      for (let i = 0; i < inputCSS.length; i++) {
        if (line === position.line && column === position.column) {
          offset = i;
          break;
        }
        if (inputCSS[i] === "\n") {
          column = 1;
          line += 1;
        } else {
          column += 1;
        }
      }
      return offset;
    }
    var Node = class _Node {
      get proxyOf() {
        return this;
      }
      constructor(defaults = {}) {
        this.raws = {};
        this[isClean] = false;
        this[my] = true;
        for (let name of Object.keys(defaults)) {
          if (name === "__proto__") continue;
          if (name === "nodes") {
            this.nodes = [];
            for (let node of defaults[name]) {
              if (typeof node.clone === "function" && node.parent) {
                this.append(node.clone());
              } else {
                this.append(node);
              }
            }
          } else {
            this[name] = defaults[name];
          }
        }
      }
      addToError(error) {
        error.postcssNode = this;
        if (error.stack && this.source && /\n\s{4}at /.test(error.stack)) {
          let s = this.source;
          error.stack = error.stack.replace(
            /\n\s{4}at /,
            `$&${s.input.from}:${s.start.line}:${s.start.column}$&`
          );
        }
        return error;
      }
      after(add) {
        this.parent.insertAfter(this, add);
        return this;
      }
      assign(overrides = {}) {
        for (let name in overrides) {
          this[name] = overrides[name];
        }
        return this;
      }
      before(add) {
        this.parent.insertBefore(this, add);
        return this;
      }
      cleanRaws(keepBetween) {
        delete this.raws.before;
        delete this.raws.after;
        if (!keepBetween) delete this.raws.between;
      }
      clone(overrides = {}) {
        let cloned = cloneNode(this);
        for (let name in overrides) {
          cloned[name] = overrides[name];
        }
        return cloned;
      }
      cloneAfter(overrides = {}) {
        let cloned = this.clone(overrides);
        this.parent.insertAfter(this, cloned);
        return cloned;
      }
      cloneBefore(overrides = {}) {
        let cloned = this.clone(overrides);
        this.parent.insertBefore(this, cloned);
        return cloned;
      }
      error(message, opts = {}) {
        if (this.source) {
          let { end, start } = this.rangeBy(opts);
          return this.source.input.error(
            message,
            { column: start.column, line: start.line },
            { column: end.column, line: end.line },
            opts
          );
        }
        return new CssSyntaxError(message);
      }
      getProxyProcessor() {
        return {
          get(node, prop) {
            if (prop === "proxyOf") {
              return node;
            } else if (prop === "root") {
              return () => node.root().toProxy();
            } else {
              return node[prop];
            }
          },
          set(node, prop, value) {
            if (node[prop] === value) return true;
            node[prop] = value;
            if (prop === "prop" || prop === "value" || prop === "name" || prop === "params" || prop === "important" || /* c8 ignore next */
            prop === "text") {
              node.markDirty();
            }
            return true;
          }
        };
      }
      /* c8 ignore next 3 */
      markClean() {
        this[isClean] = true;
      }
      markDirty() {
        if (this[isClean]) {
          this[isClean] = false;
          let next = this;
          while (next = next.parent) {
            next[isClean] = false;
          }
        }
      }
      next() {
        if (!this.parent) return void 0;
        let index = this.parent.index(this);
        return this.parent.nodes[index + 1];
      }
      positionBy(opts = {}) {
        let inputString = "document" in this.source.input ? this.source.input.document : this.source.input.css;
        let pos = {
          column: this.source.start.column,
          line: this.source.start.line,
          offset: sourceOffset(inputString, this.source.start)
        };
        if (opts.index) {
          pos = this.positionInside(opts.index);
        } else if (opts.word) {
          let stringRepresentation = inputString.slice(
            sourceOffset(inputString, this.source.start),
            sourceOffset(inputString, this.source.end)
          );
          let index = stringRepresentation.indexOf(opts.word);
          if (index !== -1) pos = this.positionInside(index);
        }
        return pos;
      }
      positionInside(index) {
        let column = this.source.start.column;
        let line = this.source.start.line;
        let inputString = "document" in this.source.input ? this.source.input.document : this.source.input.css;
        let offset = sourceOffset(inputString, this.source.start);
        let end = offset + index;
        for (let i = offset; i < end; i++) {
          if (inputString[i] === "\n") {
            column = 1;
            line += 1;
          } else {
            column += 1;
          }
        }
        return { column, line, offset: end };
      }
      prev() {
        if (!this.parent) return void 0;
        let index = this.parent.index(this);
        return this.parent.nodes[index - 1];
      }
      rangeBy(opts = {}) {
        let inputString = "document" in this.source.input ? this.source.input.document : this.source.input.css;
        let start = {
          column: this.source.start.column,
          line: this.source.start.line,
          offset: sourceOffset(inputString, this.source.start)
        };
        let end = this.source.end ? {
          column: this.source.end.column + 1,
          line: this.source.end.line,
          offset: typeof this.source.end.offset === "number" ? (
            // `source.end.offset` is exclusive, so we don't need to add 1
            this.source.end.offset
          ) : (
            // Since line/column in this.source.end is inclusive,
            // the `sourceOffset(... , this.source.end)` returns an inclusive offset.
            // So, we add 1 to convert it to exclusive.
            sourceOffset(inputString, this.source.end) + 1
          )
        } : {
          column: start.column + 1,
          line: start.line,
          offset: start.offset + 1
        };
        if (opts.word) {
          let stringRepresentation = inputString.slice(
            sourceOffset(inputString, this.source.start),
            sourceOffset(inputString, this.source.end)
          );
          let index = stringRepresentation.indexOf(opts.word);
          if (index !== -1) {
            start = this.positionInside(index);
            end = this.positionInside(index + opts.word.length);
          }
        } else {
          if (opts.start) {
            start = {
              column: opts.start.column,
              line: opts.start.line,
              offset: sourceOffset(inputString, opts.start)
            };
          } else if (typeof opts.index === "number") {
            start = this.positionInside(opts.index);
          }
          if (opts.end) {
            end = {
              column: opts.end.column,
              line: opts.end.line,
              offset: sourceOffset(inputString, opts.end)
            };
          } else if (typeof opts.endIndex === "number") {
            end = this.positionInside(opts.endIndex);
          } else if (typeof opts.index === "number") {
            end = this.positionInside(opts.index + 1);
          }
        }
        if (end.line < start.line || end.line === start.line && end.column <= start.column) {
          end = {
            column: start.column + 1,
            line: start.line,
            offset: start.offset + 1
          };
        }
        return { end, start };
      }
      raw(prop, defaultType) {
        let str = new Stringifier();
        return str.raw(this, prop, defaultType);
      }
      remove() {
        if (this.parent) {
          this.parent.removeChild(this);
        }
        this.parent = void 0;
        return this;
      }
      replaceWith(...nodes) {
        if (this.parent) {
          let bookmark = this;
          let foundSelf = false;
          for (let node of nodes) {
            if (node === this) {
              foundSelf = true;
            } else if (foundSelf) {
              this.parent.insertAfter(bookmark, node);
              bookmark = node;
            } else {
              this.parent.insertBefore(bookmark, node);
            }
          }
          if (!foundSelf) {
            this.remove();
          }
        }
        return this;
      }
      root() {
        let result = this;
        while (result.parent && result.parent.type !== "document") {
          result = result.parent;
        }
        return result;
      }
      toJSON(_, inputs) {
        let emitInputs = inputs == null;
        inputs = inputs || /* @__PURE__ */ new Map();
        let holderOfRoot = [];
        let queue = [[this, holderOfRoot, 0]];
        for (let step = 0; step < queue.length; step++) {
          let [node, holder, key] = queue[step];
          let fixed2 = {};
          holder[key] = fixed2;
          for (let name in node) {
            if (!Object.prototype.hasOwnProperty.call(node, name)) {
              continue;
            }
            if (name === "parent" || name === "proxyCache") continue;
            let value = node[name];
            if (Array.isArray(value)) {
              let fixedArray = [];
              fixed2[name] = fixedArray;
              for (let i = 0; i < value.length; i++) {
                let item = value[i];
                if (typeof item === "object" && item.toJSON) {
                  if (item.toJSON === _Node.prototype.toJSON) {
                    queue.push([item, fixedArray, i]);
                  } else {
                    fixedArray[i] = item.toJSON(null, inputs);
                  }
                } else {
                  fixedArray[i] = item;
                }
              }
            } else if (typeof value === "object" && value.toJSON) {
              if (value.toJSON === _Node.prototype.toJSON) {
                queue.push([value, fixed2, name]);
              } else {
                fixed2[name] = value.toJSON(null, inputs);
              }
            } else if (name === "source") {
              if (value == null) continue;
              let inputId = inputs.get(value.input);
              if (inputId == null) {
                inputId = inputs.size;
                inputs.set(value.input, inputId);
              }
              fixed2[name] = {
                end: value.end,
                inputId,
                start: value.start
              };
            } else {
              fixed2[name] = value;
            }
          }
        }
        let fixed = holderOfRoot[0];
        if (emitInputs) {
          fixed.inputs = [...inputs.keys()].map((input) => input.toJSON());
        }
        return fixed;
      }
      toProxy() {
        if (!this.proxyCache) {
          this.proxyCache = new Proxy(this, this.getProxyProcessor());
        }
        return this.proxyCache;
      }
      toString(stringifier = stringify) {
        if (stringifier.stringify) stringifier = stringifier.stringify;
        let result = "";
        stringifier(this, (i) => {
          result += i;
        });
        return result;
      }
      warn(result, text, opts = {}) {
        let data = { node: this };
        for (let i in opts) data[i] = opts[i];
        return result.warn(text, data);
      }
    };
    module.exports = Node;
    Node.default = Node;
  }
});

// ../node_modules/postcss/lib/comment.js
var require_comment = __commonJS({
  "../node_modules/postcss/lib/comment.js"(exports, module) {
    "use strict";
    var Node = require_node();
    var Comment = class extends Node {
      constructor(defaults) {
        super(defaults);
        this.type = "comment";
      }
    };
    module.exports = Comment;
    Comment.default = Comment;
  }
});

// ../node_modules/postcss/lib/declaration.js
var require_declaration = __commonJS({
  "../node_modules/postcss/lib/declaration.js"(exports, module) {
    "use strict";
    var Node = require_node();
    var Declaration = class extends Node {
      get variable() {
        return this.prop.startsWith("--") || this.prop[0] === "$";
      }
      constructor(defaults) {
        if (defaults && typeof defaults.value !== "undefined" && typeof defaults.value !== "string") {
          defaults = { ...defaults, value: String(defaults.value) };
        }
        super(defaults);
        this.type = "decl";
      }
    };
    module.exports = Declaration;
    Declaration.default = Declaration;
  }
});

// ../node_modules/postcss/lib/container.js
var require_container = __commonJS({
  "../node_modules/postcss/lib/container.js"(exports, module) {
    "use strict";
    var Comment = require_comment();
    var Declaration = require_declaration();
    var Node = require_node();
    var { isClean, my } = require_symbols();
    var AtRule;
    var parse;
    var Root;
    var Rule;
    function cleanSource(nodes) {
      let stack = nodes.slice();
      while (stack.length > 0) {
        let node = stack.pop();
        delete node.source;
        if (node.nodes) {
          node.nodes = node.nodes.slice();
          for (let i of node.nodes) stack.push(i);
        }
      }
      return nodes.slice();
    }
    function markTreeDirty(node) {
      let stack = [node];
      while (stack.length > 0) {
        let next = stack.pop();
        next[isClean] = false;
        if (next.proxyOf.nodes) {
          for (let i of next.proxyOf.nodes) stack.push(i);
        }
      }
    }
    var Container = class _Container extends Node {
      get first() {
        if (!this.proxyOf.nodes) return void 0;
        return this.proxyOf.nodes[0];
      }
      get last() {
        if (!this.proxyOf.nodes) return void 0;
        return this.proxyOf.nodes[this.proxyOf.nodes.length - 1];
      }
      append(...children) {
        for (let child of children) {
          let nodes = this.normalize(child, this.last);
          for (let node of nodes) this.proxyOf.nodes.push(node);
        }
        this.markDirty();
        return this;
      }
      cleanRaws(keepBetween) {
        let stack = [this];
        while (stack.length > 0) {
          let node = stack.pop();
          if (node !== this && node.cleanRaws !== _Container.prototype.cleanRaws) {
            node.cleanRaws(keepBetween);
            continue;
          }
          Node.prototype.cleanRaws.call(node, keepBetween);
          if (node.nodes) {
            for (let child of node.nodes) stack.push(child);
          }
        }
      }
      each(callback) {
        if (!this.proxyOf.nodes) return void 0;
        let iterator = this.getIterator();
        let index, result;
        while (this.indexes[iterator] < this.proxyOf.nodes.length) {
          index = this.indexes[iterator];
          result = callback(this.proxyOf.nodes[index], index);
          if (result === false) break;
          this.indexes[iterator] += 1;
        }
        delete this.indexes[iterator];
        return result;
      }
      every(condition) {
        return this.nodes.every(condition);
      }
      getIterator() {
        if (!this.lastEach) this.lastEach = 0;
        if (!this.indexes) this.indexes = {};
        this.lastEach += 1;
        let iterator = this.lastEach;
        this.indexes[iterator] = 0;
        return iterator;
      }
      getProxyProcessor() {
        return {
          get(node, prop) {
            if (prop === "proxyOf") {
              return node;
            } else if (!node[prop]) {
              return node[prop];
            } else if (prop === "each" || typeof prop === "string" && prop.startsWith("walk")) {
              return (...args) => {
                return node[prop](
                  ...args.map((i) => {
                    if (typeof i === "function") {
                      return (child, index) => i(child.toProxy(), index);
                    } else {
                      return i;
                    }
                  })
                );
              };
            } else if (prop === "every" || prop === "some") {
              return (cb) => {
                return node[prop](
                  (child, ...other) => cb(child.toProxy(), ...other)
                );
              };
            } else if (prop === "root") {
              return () => node.root().toProxy();
            } else if (prop === "nodes") {
              return node.nodes.map((i) => i.toProxy());
            } else if (prop === "first" || prop === "last") {
              return node[prop].toProxy();
            } else {
              return node[prop];
            }
          },
          set(node, prop, value) {
            if (node[prop] === value) return true;
            node[prop] = value;
            if (prop === "name" || prop === "params" || prop === "selector") {
              node.markDirty();
            }
            return true;
          }
        };
      }
      index(child) {
        if (typeof child === "number") return child;
        if (child.proxyOf) child = child.proxyOf;
        return this.proxyOf.nodes.indexOf(child);
      }
      insertAfter(exist, add) {
        let existIndex = this.index(exist);
        let nodes = this.normalize(add, this.proxyOf.nodes[existIndex]).reverse();
        existIndex = this.index(exist);
        for (let node of nodes) this.proxyOf.nodes.splice(existIndex + 1, 0, node);
        let index;
        for (let id in this.indexes) {
          index = this.indexes[id];
          if (existIndex < index) {
            this.indexes[id] = index + nodes.length;
          }
        }
        this.markDirty();
        return this;
      }
      insertBefore(exist, add) {
        let existIndex = this.index(exist);
        let type = existIndex === 0 ? "prepend" : false;
        let nodes = this.normalize(
          add,
          this.proxyOf.nodes[existIndex],
          type
        ).reverse();
        existIndex = this.index(exist);
        for (let node of nodes) this.proxyOf.nodes.splice(existIndex, 0, node);
        let index;
        for (let id in this.indexes) {
          index = this.indexes[id];
          if (existIndex <= index) {
            this.indexes[id] = index + nodes.length;
          }
        }
        this.markDirty();
        return this;
      }
      normalize(nodes, sample) {
        if (typeof nodes === "string") {
          nodes = cleanSource(parse(nodes).nodes);
        } else if (typeof nodes === "undefined") {
          nodes = [];
        } else if (Array.isArray(nodes)) {
          nodes = nodes.slice(0);
          for (let i of nodes) {
            if (i.parent) i.parent.removeChild(i, "ignore");
          }
        } else if (nodes.type === "root" && this.type !== "document") {
          nodes = nodes.nodes.slice(0);
          for (let i of nodes) {
            if (i.parent) i.parent.removeChild(i, "ignore");
          }
        } else if (nodes.type) {
          nodes = [nodes];
        } else if (nodes.prop) {
          if (typeof nodes.value === "undefined") {
            throw new Error("Value field is missed in node creation");
          } else if (typeof nodes.value !== "string") {
            nodes.value = String(nodes.value);
          }
          nodes = [new Declaration(nodes)];
        } else if (nodes.selector || nodes.selectors) {
          nodes = [new Rule(nodes)];
        } else if (nodes.name) {
          nodes = [new AtRule(nodes)];
        } else if (nodes.text) {
          nodes = [new Comment(nodes)];
        } else {
          throw new Error("Unknown node type in node creation");
        }
        let processed = nodes.map((i) => {
          if (!i[my]) _Container.rebuild(i);
          i = i.proxyOf;
          if (i.parent) i.parent.removeChild(i);
          if (i[isClean]) markTreeDirty(i);
          if (!i.raws) i.raws = {};
          if (typeof i.raws.before === "undefined") {
            if (sample && typeof sample.raws.before !== "undefined") {
              i.raws.before = sample.raws.before.replace(/\S/g, "");
            }
          }
          i.parent = this.proxyOf;
          return i;
        });
        return processed;
      }
      prepend(...children) {
        children = children.reverse();
        for (let child of children) {
          let nodes = this.normalize(child, this.first, "prepend").reverse();
          for (let node of nodes) this.proxyOf.nodes.unshift(node);
          for (let id in this.indexes) {
            this.indexes[id] = this.indexes[id] + nodes.length;
          }
        }
        this.markDirty();
        return this;
      }
      push(child) {
        child.parent = this;
        this.proxyOf.nodes.push(child);
        return this;
      }
      removeAll() {
        for (let node of this.proxyOf.nodes) node.parent = void 0;
        this.proxyOf.nodes = [];
        this.markDirty();
        return this;
      }
      removeChild(child) {
        child = this.index(child);
        this.proxyOf.nodes[child].parent = void 0;
        this.proxyOf.nodes.splice(child, 1);
        let index;
        for (let id in this.indexes) {
          index = this.indexes[id];
          if (index >= child) {
            this.indexes[id] = index - 1;
          }
        }
        this.markDirty();
        return this;
      }
      replaceValues(pattern, opts, callback) {
        if (!callback) {
          callback = opts;
          opts = {};
        }
        this.walkDecls((decl) => {
          if (opts.props && !opts.props.includes(decl.prop)) return;
          if (opts.fast && !decl.value.includes(opts.fast)) return;
          decl.value = decl.value.replace(pattern, callback);
        });
        this.markDirty();
        return this;
      }
      some(condition) {
        return this.nodes.some(condition);
      }
      walk(callback) {
        if (!this.proxyOf.nodes) return void 0;
        let stack = [{ iterator: this.getIterator(), node: this.proxyOf }];
        while (stack.length > 0) {
          let { iterator, node } = stack[stack.length - 1];
          let index = node.indexes[iterator];
          if (index >= node.proxyOf.nodes.length) {
            delete node.indexes[iterator];
            stack.pop();
            let parent = stack[stack.length - 1];
            if (parent) parent.node.indexes[parent.iterator] += 1;
            continue;
          }
          let child = node.proxyOf.nodes[index];
          let result;
          try {
            result = callback(child, index);
          } catch (e) {
            throw child.addToError(e);
          }
          if (result === false) {
            for (let opened of stack) {
              delete opened.node.indexes[opened.iterator];
            }
            return false;
          }
          if (child.walk && child.proxyOf.nodes) {
            stack.push({ iterator: child.getIterator(), node: child });
          } else {
            node.indexes[iterator] += 1;
          }
        }
        return void 0;
      }
      walkAtRules(name, callback) {
        if (!callback) {
          callback = name;
          return this.walk((child, i) => {
            if (child.type === "atrule") {
              return callback(child, i);
            }
          });
        }
        if (name instanceof RegExp) {
          return this.walk((child, i) => {
            if (child.type === "atrule" && name.test(child.name)) {
              return callback(child, i);
            }
          });
        }
        return this.walk((child, i) => {
          if (child.type === "atrule" && child.name === name) {
            return callback(child, i);
          }
        });
      }
      walkComments(callback) {
        return this.walk((child, i) => {
          if (child.type === "comment") {
            return callback(child, i);
          }
        });
      }
      walkDecls(prop, callback) {
        if (!callback) {
          callback = prop;
          return this.walk((child, i) => {
            if (child.type === "decl") {
              return callback(child, i);
            }
          });
        }
        if (prop instanceof RegExp) {
          return this.walk((child, i) => {
            if (child.type === "decl" && prop.test(child.prop)) {
              return callback(child, i);
            }
          });
        }
        return this.walk((child, i) => {
          if (child.type === "decl" && child.prop === prop) {
            return callback(child, i);
          }
        });
      }
      walkRules(selector, callback) {
        if (!callback) {
          callback = selector;
          return this.walk((child, i) => {
            if (child.type === "rule") {
              return callback(child, i);
            }
          });
        }
        if (selector instanceof RegExp) {
          return this.walk((child, i) => {
            if (child.type === "rule" && selector.test(child.selector)) {
              return callback(child, i);
            }
          });
        }
        return this.walk((child, i) => {
          if (child.type === "rule" && child.selector === selector) {
            return callback(child, i);
          }
        });
      }
    };
    Container.registerParse = (dependant) => {
      parse = dependant;
    };
    Container.registerRule = (dependant) => {
      Rule = dependant;
    };
    Container.registerAtRule = (dependant) => {
      AtRule = dependant;
    };
    Container.registerRoot = (dependant) => {
      Root = dependant;
    };
    module.exports = Container;
    Container.default = Container;
    Container.rebuild = (node) => {
      let stack = [node];
      while (stack.length > 0) {
        let next = stack.pop();
        if (next.type === "atrule") {
          Object.setPrototypeOf(next, AtRule.prototype);
        } else if (next.type === "rule") {
          Object.setPrototypeOf(next, Rule.prototype);
        } else if (next.type === "decl") {
          Object.setPrototypeOf(next, Declaration.prototype);
        } else if (next.type === "comment") {
          Object.setPrototypeOf(next, Comment.prototype);
        } else if (next.type === "root") {
          Object.setPrototypeOf(next, Root.prototype);
        }
        next[my] = true;
        if (next.nodes) {
          for (let child of next.nodes) stack.push(child);
        }
      }
    };
  }
});

// ../node_modules/postcss/lib/at-rule.js
var require_at_rule = __commonJS({
  "../node_modules/postcss/lib/at-rule.js"(exports, module) {
    "use strict";
    var Container = require_container();
    var AtRule = class extends Container {
      constructor(defaults) {
        super(defaults);
        this.type = "atrule";
      }
      append(...children) {
        if (!this.proxyOf.nodes) this.nodes = [];
        return super.append(...children);
      }
      prepend(...children) {
        if (!this.proxyOf.nodes) this.nodes = [];
        return super.prepend(...children);
      }
    };
    module.exports = AtRule;
    AtRule.default = AtRule;
    Container.registerAtRule(AtRule);
  }
});

// ../node_modules/postcss/lib/document.js
var require_document = __commonJS({
  "../node_modules/postcss/lib/document.js"(exports, module) {
    "use strict";
    var Container = require_container();
    var LazyResult;
    var Processor;
    var Document = class extends Container {
      constructor(defaults) {
        super({ type: "document", ...defaults });
        if (!this.nodes) {
          this.nodes = [];
        }
      }
      toResult(opts = {}) {
        let lazy = new LazyResult(new Processor(), this, opts);
        return lazy.stringify();
      }
    };
    Document.registerLazyResult = (dependant) => {
      LazyResult = dependant;
    };
    Document.registerProcessor = (dependant) => {
      Processor = dependant;
    };
    module.exports = Document;
    Document.default = Document;
  }
});

// ../node_modules/nanoid/non-secure/index.cjs
var require_non_secure = __commonJS({
  "../node_modules/nanoid/non-secure/index.cjs"(exports, module) {
    var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
    var customAlphabet = (alphabet, defaultSize = 21) => {
      return (size = defaultSize) => {
        let id = "";
        let i = size | 0;
        while (i-- > 0) {
          id += alphabet[Math.random() * alphabet.length | 0];
        }
        return id;
      };
    };
    var nanoid = (size = 21) => {
      let id = "";
      let i = size | 0;
      while (i-- > 0) {
        id += urlAlphabet[Math.random() * 64 | 0];
      }
      return id;
    };
    module.exports = { nanoid, customAlphabet };
  }
});

// ../node_modules/source-map-js/lib/base64.js
var require_base64 = __commonJS({
  "../node_modules/source-map-js/lib/base64.js"(exports) {
    var intToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
    exports.encode = function(number) {
      if (0 <= number && number < intToCharMap.length) {
        return intToCharMap[number];
      }
      throw new TypeError("Must be between 0 and 63: " + number);
    };
    exports.decode = function(charCode) {
      var bigA = 65;
      var bigZ = 90;
      var littleA = 97;
      var littleZ = 122;
      var zero = 48;
      var nine = 57;
      var plus = 43;
      var slash = 47;
      var littleOffset = 26;
      var numberOffset = 52;
      if (bigA <= charCode && charCode <= bigZ) {
        return charCode - bigA;
      }
      if (littleA <= charCode && charCode <= littleZ) {
        return charCode - littleA + littleOffset;
      }
      if (zero <= charCode && charCode <= nine) {
        return charCode - zero + numberOffset;
      }
      if (charCode == plus) {
        return 62;
      }
      if (charCode == slash) {
        return 63;
      }
      return -1;
    };
  }
});

// ../node_modules/source-map-js/lib/base64-vlq.js
var require_base64_vlq = __commonJS({
  "../node_modules/source-map-js/lib/base64-vlq.js"(exports) {
    var base64 = require_base64();
    var VLQ_BASE_SHIFT = 5;
    var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
    var VLQ_BASE_MASK = VLQ_BASE - 1;
    var VLQ_CONTINUATION_BIT = VLQ_BASE;
    function toVLQSigned(aValue) {
      return aValue < 0 ? (-aValue << 1) + 1 : (aValue << 1) + 0;
    }
    function fromVLQSigned(aValue) {
      var isNegative = (aValue & 1) === 1;
      var shifted = aValue >> 1;
      return isNegative ? -shifted : shifted;
    }
    exports.encode = function base64VLQ_encode(aValue) {
      var encoded = "";
      var digit;
      var vlq = toVLQSigned(aValue);
      do {
        digit = vlq & VLQ_BASE_MASK;
        vlq >>>= VLQ_BASE_SHIFT;
        if (vlq > 0) {
          digit |= VLQ_CONTINUATION_BIT;
        }
        encoded += base64.encode(digit);
      } while (vlq > 0);
      return encoded;
    };
    exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
      var strLen = aStr.length;
      var result = 0;
      var shift = 0;
      var continuation, digit;
      do {
        if (aIndex >= strLen) {
          throw new Error("Expected more digits in base 64 VLQ value.");
        }
        digit = base64.decode(aStr.charCodeAt(aIndex++));
        if (digit === -1) {
          throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
        }
        continuation = !!(digit & VLQ_CONTINUATION_BIT);
        digit &= VLQ_BASE_MASK;
        result = result + (digit << shift);
        shift += VLQ_BASE_SHIFT;
      } while (continuation);
      aOutParam.value = fromVLQSigned(result);
      aOutParam.rest = aIndex;
    };
  }
});

// ../node_modules/source-map-js/lib/util.js
var require_util = __commonJS({
  "../node_modules/source-map-js/lib/util.js"(exports) {
    function getArg(aArgs, aName, aDefaultValue) {
      if (aName in aArgs) {
        return aArgs[aName];
      } else if (arguments.length === 3) {
        return aDefaultValue;
      } else {
        throw new Error('"' + aName + '" is a required argument.');
      }
    }
    exports.getArg = getArg;
    var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
    var dataUrlRegexp = /^data:.+\,.+$/;
    function urlParse(aUrl) {
      var match = aUrl.match(urlRegexp);
      if (!match) {
        return null;
      }
      return {
        scheme: match[1],
        auth: match[2],
        host: match[3],
        port: match[4],
        path: match[5]
      };
    }
    exports.urlParse = urlParse;
    function urlGenerate(aParsedUrl) {
      var url = "";
      if (aParsedUrl.scheme) {
        url += aParsedUrl.scheme + ":";
      }
      url += "//";
      if (aParsedUrl.auth) {
        url += aParsedUrl.auth + "@";
      }
      if (aParsedUrl.host) {
        url += aParsedUrl.host;
      }
      if (aParsedUrl.port) {
        url += ":" + aParsedUrl.port;
      }
      if (aParsedUrl.path) {
        url += aParsedUrl.path;
      }
      return url;
    }
    exports.urlGenerate = urlGenerate;
    var MAX_CACHED_INPUTS = 32;
    function lruMemoize(f) {
      var cache = [];
      return function(input) {
        for (var i = 0; i < cache.length; i++) {
          if (cache[i].input === input) {
            var temp = cache[0];
            cache[0] = cache[i];
            cache[i] = temp;
            return cache[0].result;
          }
        }
        var result = f(input);
        cache.unshift({
          input,
          result
        });
        if (cache.length > MAX_CACHED_INPUTS) {
          cache.pop();
        }
        return result;
      };
    }
    var normalize = lruMemoize(function normalize2(aPath) {
      var path = aPath;
      var url = urlParse(aPath);
      if (url) {
        if (!url.path) {
          return aPath;
        }
        path = url.path;
      }
      var isAbsolute = exports.isAbsolute(path);
      var parts = [];
      var start = 0;
      var i = 0;
      while (true) {
        start = i;
        i = path.indexOf("/", start);
        if (i === -1) {
          parts.push(path.slice(start));
          break;
        } else {
          parts.push(path.slice(start, i));
          while (i < path.length && path[i] === "/") {
            i++;
          }
        }
      }
      for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
        part = parts[i];
        if (part === ".") {
          parts.splice(i, 1);
        } else if (part === "..") {
          up++;
        } else if (up > 0) {
          if (part === "") {
            parts.splice(i + 1, up);
            up = 0;
          } else {
            parts.splice(i, 2);
            up--;
          }
        }
      }
      path = parts.join("/");
      if (path === "") {
        path = isAbsolute ? "/" : ".";
      }
      if (url) {
        url.path = path;
        return urlGenerate(url);
      }
      return path;
    });
    exports.normalize = normalize;
    function join(aRoot, aPath) {
      if (aRoot === "") {
        aRoot = ".";
      }
      if (aPath === "") {
        aPath = ".";
      }
      var aPathUrl = urlParse(aPath);
      var aRootUrl = urlParse(aRoot);
      if (aRootUrl) {
        aRoot = aRootUrl.path || "/";
      }
      if (aPathUrl && !aPathUrl.scheme) {
        if (aRootUrl) {
          aPathUrl.scheme = aRootUrl.scheme;
        }
        return urlGenerate(aPathUrl);
      }
      if (aPathUrl || aPath.match(dataUrlRegexp)) {
        return aPath;
      }
      if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
        aRootUrl.host = aPath;
        return urlGenerate(aRootUrl);
      }
      var joined = aPath.charAt(0) === "/" ? aPath : normalize(aRoot.replace(/\/+$/, "") + "/" + aPath);
      if (aRootUrl) {
        aRootUrl.path = joined;
        return urlGenerate(aRootUrl);
      }
      return joined;
    }
    exports.join = join;
    exports.isAbsolute = function(aPath) {
      return aPath.charAt(0) === "/" || urlRegexp.test(aPath);
    };
    function relative(aRoot, aPath) {
      if (aRoot === "") {
        aRoot = ".";
      }
      aRoot = aRoot.replace(/\/$/, "");
      var level = 0;
      while (aPath.indexOf(aRoot + "/") !== 0) {
        var index = aRoot.lastIndexOf("/");
        if (index < 0) {
          return aPath;
        }
        aRoot = aRoot.slice(0, index);
        if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
          return aPath;
        }
        ++level;
      }
      return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
    }
    exports.relative = relative;
    var supportsNullProto = (function() {
      var obj = /* @__PURE__ */ Object.create(null);
      return !("__proto__" in obj);
    })();
    function identity(s) {
      return s;
    }
    function toSetString(aStr) {
      if (isProtoString(aStr)) {
        return "$" + aStr;
      }
      return aStr;
    }
    exports.toSetString = supportsNullProto ? identity : toSetString;
    function fromSetString(aStr) {
      if (isProtoString(aStr)) {
        return aStr.slice(1);
      }
      return aStr;
    }
    exports.fromSetString = supportsNullProto ? identity : fromSetString;
    function isProtoString(s) {
      if (!s) {
        return false;
      }
      var length = s.length;
      if (length < 9) {
        return false;
      }
      if (s.charCodeAt(length - 1) !== 95 || s.charCodeAt(length - 2) !== 95 || s.charCodeAt(length - 3) !== 111 || s.charCodeAt(length - 4) !== 116 || s.charCodeAt(length - 5) !== 111 || s.charCodeAt(length - 6) !== 114 || s.charCodeAt(length - 7) !== 112 || s.charCodeAt(length - 8) !== 95 || s.charCodeAt(length - 9) !== 95) {
        return false;
      }
      for (var i = length - 10; i >= 0; i--) {
        if (s.charCodeAt(i) !== 36) {
          return false;
        }
      }
      return true;
    }
    function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
      var cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0 || onlyCompareOriginal) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByOriginalPositions = compareByOriginalPositions;
    function compareByOriginalPositionsNoSource(mappingA, mappingB, onlyCompareOriginal) {
      var cmp;
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0 || onlyCompareOriginal) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByOriginalPositionsNoSource = compareByOriginalPositionsNoSource;
    function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
      var cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0 || onlyCompareGenerated) {
        return cmp;
      }
      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;
    function compareByGeneratedPositionsDeflatedNoLine(mappingA, mappingB, onlyCompareGenerated) {
      var cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0 || onlyCompareGenerated) {
        return cmp;
      }
      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByGeneratedPositionsDeflatedNoLine = compareByGeneratedPositionsDeflatedNoLine;
    function strcmp(aStr1, aStr2) {
      if (aStr1 === aStr2) {
        return 0;
      }
      if (aStr1 === null) {
        return 1;
      }
      if (aStr2 === null) {
        return -1;
      }
      if (aStr1 > aStr2) {
        return 1;
      }
      return -1;
    }
    function compareByGeneratedPositionsInflated(mappingA, mappingB) {
      var cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;
    function parseSourceMapInput(str) {
      return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ""));
    }
    exports.parseSourceMapInput = parseSourceMapInput;
    function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
      sourceURL = sourceURL || "";
      if (sourceRoot) {
        if (sourceRoot[sourceRoot.length - 1] !== "/" && sourceURL[0] !== "/") {
          sourceRoot += "/";
        }
        sourceURL = sourceRoot + sourceURL;
      }
      if (sourceMapURL) {
        var parsed = urlParse(sourceMapURL);
        if (!parsed) {
          throw new Error("sourceMapURL could not be parsed");
        }
        if (parsed.path) {
          var index = parsed.path.lastIndexOf("/");
          if (index >= 0) {
            parsed.path = parsed.path.substring(0, index + 1);
          }
        }
        sourceURL = join(urlGenerate(parsed), sourceURL);
      }
      return normalize(sourceURL);
    }
    exports.computeSourceURL = computeSourceURL;
  }
});

// ../node_modules/source-map-js/lib/array-set.js
var require_array_set = __commonJS({
  "../node_modules/source-map-js/lib/array-set.js"(exports) {
    var util = require_util();
    var has = Object.prototype.hasOwnProperty;
    var hasNativeMap = typeof Map !== "undefined";
    function ArraySet() {
      this._array = [];
      this._set = hasNativeMap ? /* @__PURE__ */ new Map() : /* @__PURE__ */ Object.create(null);
    }
    ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
      var set = new ArraySet();
      for (var i = 0, len = aArray.length; i < len; i++) {
        set.add(aArray[i], aAllowDuplicates);
      }
      return set;
    };
    ArraySet.prototype.size = function ArraySet_size() {
      return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
    };
    ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
      var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
      var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
      var idx = this._array.length;
      if (!isDuplicate || aAllowDuplicates) {
        this._array.push(aStr);
      }
      if (!isDuplicate) {
        if (hasNativeMap) {
          this._set.set(aStr, idx);
        } else {
          this._set[sStr] = idx;
        }
      }
    };
    ArraySet.prototype.has = function ArraySet_has(aStr) {
      if (hasNativeMap) {
        return this._set.has(aStr);
      } else {
        var sStr = util.toSetString(aStr);
        return has.call(this._set, sStr);
      }
    };
    ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
      if (hasNativeMap) {
        var idx = this._set.get(aStr);
        if (idx >= 0) {
          return idx;
        }
      } else {
        var sStr = util.toSetString(aStr);
        if (has.call(this._set, sStr)) {
          return this._set[sStr];
        }
      }
      throw new Error('"' + aStr + '" is not in the set.');
    };
    ArraySet.prototype.at = function ArraySet_at(aIdx) {
      if (aIdx >= 0 && aIdx < this._array.length) {
        return this._array[aIdx];
      }
      throw new Error("No element indexed by " + aIdx);
    };
    ArraySet.prototype.toArray = function ArraySet_toArray() {
      return this._array.slice();
    };
    exports.ArraySet = ArraySet;
  }
});

// ../node_modules/source-map-js/lib/mapping-list.js
var require_mapping_list = __commonJS({
  "../node_modules/source-map-js/lib/mapping-list.js"(exports) {
    var util = require_util();
    function generatedPositionAfter(mappingA, mappingB) {
      var lineA = mappingA.generatedLine;
      var lineB = mappingB.generatedLine;
      var columnA = mappingA.generatedColumn;
      var columnB = mappingB.generatedColumn;
      return lineB > lineA || lineB == lineA && columnB >= columnA || util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
    }
    function MappingList() {
      this._array = [];
      this._sorted = true;
      this._last = { generatedLine: -1, generatedColumn: 0 };
    }
    MappingList.prototype.unsortedForEach = function MappingList_forEach(aCallback, aThisArg) {
      this._array.forEach(aCallback, aThisArg);
    };
    MappingList.prototype.add = function MappingList_add(aMapping) {
      if (generatedPositionAfter(this._last, aMapping)) {
        this._last = aMapping;
        this._array.push(aMapping);
      } else {
        this._sorted = false;
        this._array.push(aMapping);
      }
    };
    MappingList.prototype.toArray = function MappingList_toArray() {
      if (!this._sorted) {
        this._array.sort(util.compareByGeneratedPositionsInflated);
        this._sorted = true;
      }
      return this._array;
    };
    exports.MappingList = MappingList;
  }
});

// ../node_modules/source-map-js/lib/source-map-generator.js
var require_source_map_generator = __commonJS({
  "../node_modules/source-map-js/lib/source-map-generator.js"(exports) {
    var base64VLQ = require_base64_vlq();
    var util = require_util();
    var ArraySet = require_array_set().ArraySet;
    var MappingList = require_mapping_list().MappingList;
    function SourceMapGenerator(aArgs) {
      if (!aArgs) {
        aArgs = {};
      }
      this._file = util.getArg(aArgs, "file", null);
      this._sourceRoot = util.getArg(aArgs, "sourceRoot", null);
      this._skipValidation = util.getArg(aArgs, "skipValidation", false);
      this._ignoreInvalidMapping = util.getArg(aArgs, "ignoreInvalidMapping", false);
      this._sources = new ArraySet();
      this._names = new ArraySet();
      this._mappings = new MappingList();
      this._sourcesContents = null;
    }
    SourceMapGenerator.prototype._version = 3;
    SourceMapGenerator.fromSourceMap = function SourceMapGenerator_fromSourceMap(aSourceMapConsumer, generatorOps) {
      var sourceRoot = aSourceMapConsumer.sourceRoot;
      var generator = new SourceMapGenerator(Object.assign(generatorOps || {}, {
        file: aSourceMapConsumer.file,
        sourceRoot
      }));
      aSourceMapConsumer.eachMapping(function(mapping) {
        var newMapping = {
          generated: {
            line: mapping.generatedLine,
            column: mapping.generatedColumn
          }
        };
        if (mapping.source != null) {
          newMapping.source = mapping.source;
          if (sourceRoot != null) {
            newMapping.source = util.relative(sourceRoot, newMapping.source);
          }
          newMapping.original = {
            line: mapping.originalLine,
            column: mapping.originalColumn
          };
          if (mapping.name != null) {
            newMapping.name = mapping.name;
          }
        }
        generator.addMapping(newMapping);
      });
      aSourceMapConsumer.sources.forEach(function(sourceFile) {
        var sourceRelative = sourceFile;
        if (sourceRoot !== null) {
          sourceRelative = util.relative(sourceRoot, sourceFile);
        }
        if (!generator._sources.has(sourceRelative)) {
          generator._sources.add(sourceRelative);
        }
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          generator.setSourceContent(sourceFile, content);
        }
      });
      return generator;
    };
    SourceMapGenerator.prototype.addMapping = function SourceMapGenerator_addMapping(aArgs) {
      var generated = util.getArg(aArgs, "generated");
      var original = util.getArg(aArgs, "original", null);
      var source = util.getArg(aArgs, "source", null);
      var name = util.getArg(aArgs, "name", null);
      if (!this._skipValidation) {
        if (this._validateMapping(generated, original, source, name) === false) {
          return;
        }
      }
      if (source != null) {
        source = String(source);
        if (!this._sources.has(source)) {
          this._sources.add(source);
        }
      }
      if (name != null) {
        name = String(name);
        if (!this._names.has(name)) {
          this._names.add(name);
        }
      }
      this._mappings.add({
        generatedLine: generated.line,
        generatedColumn: generated.column,
        originalLine: original != null && original.line,
        originalColumn: original != null && original.column,
        source,
        name
      });
    };
    SourceMapGenerator.prototype.setSourceContent = function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
      var source = aSourceFile;
      if (this._sourceRoot != null) {
        source = util.relative(this._sourceRoot, source);
      }
      if (aSourceContent != null) {
        if (!this._sourcesContents) {
          this._sourcesContents = /* @__PURE__ */ Object.create(null);
        }
        this._sourcesContents[util.toSetString(source)] = aSourceContent;
      } else if (this._sourcesContents) {
        delete this._sourcesContents[util.toSetString(source)];
        if (Object.keys(this._sourcesContents).length === 0) {
          this._sourcesContents = null;
        }
      }
    };
    SourceMapGenerator.prototype.applySourceMap = function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
      var sourceFile = aSourceFile;
      if (aSourceFile == null) {
        if (aSourceMapConsumer.file == null) {
          throw new Error(
            `SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's "file" property. Both were omitted.`
          );
        }
        sourceFile = aSourceMapConsumer.file;
      }
      var sourceRoot = this._sourceRoot;
      if (sourceRoot != null) {
        sourceFile = util.relative(sourceRoot, sourceFile);
      }
      var newSources = new ArraySet();
      var newNames = new ArraySet();
      this._mappings.unsortedForEach(function(mapping) {
        if (mapping.source === sourceFile && mapping.originalLine != null) {
          var original = aSourceMapConsumer.originalPositionFor({
            line: mapping.originalLine,
            column: mapping.originalColumn
          });
          if (original.source != null) {
            mapping.source = original.source;
            if (aSourceMapPath != null) {
              mapping.source = util.join(aSourceMapPath, mapping.source);
            }
            if (sourceRoot != null) {
              mapping.source = util.relative(sourceRoot, mapping.source);
            }
            mapping.originalLine = original.line;
            mapping.originalColumn = original.column;
            if (original.name != null) {
              mapping.name = original.name;
            }
          }
        }
        var source = mapping.source;
        if (source != null && !newSources.has(source)) {
          newSources.add(source);
        }
        var name = mapping.name;
        if (name != null && !newNames.has(name)) {
          newNames.add(name);
        }
      }, this);
      this._sources = newSources;
      this._names = newNames;
      aSourceMapConsumer.sources.forEach(function(sourceFile2) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile2);
        if (content != null) {
          if (aSourceMapPath != null) {
            sourceFile2 = util.join(aSourceMapPath, sourceFile2);
          }
          if (sourceRoot != null) {
            sourceFile2 = util.relative(sourceRoot, sourceFile2);
          }
          this.setSourceContent(sourceFile2, content);
        }
      }, this);
    };
    SourceMapGenerator.prototype._validateMapping = function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource, aName) {
      if (aOriginal && typeof aOriginal.line !== "number" && typeof aOriginal.column !== "number") {
        var message = "original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.";
        if (this._ignoreInvalidMapping) {
          if (typeof console !== "undefined" && console.warn) {
            console.warn(message);
          }
          return false;
        } else {
          throw new Error(message);
        }
      }
      if (aGenerated && "line" in aGenerated && "column" in aGenerated && aGenerated.line > 0 && aGenerated.column >= 0 && !aOriginal && !aSource && !aName) {
        return;
      } else if (aGenerated && "line" in aGenerated && "column" in aGenerated && aOriginal && "line" in aOriginal && "column" in aOriginal && aGenerated.line > 0 && aGenerated.column >= 0 && aOriginal.line > 0 && aOriginal.column >= 0 && aSource) {
        return;
      } else {
        var message = "Invalid mapping: " + JSON.stringify({
          generated: aGenerated,
          source: aSource,
          original: aOriginal,
          name: aName
        });
        if (this._ignoreInvalidMapping) {
          if (typeof console !== "undefined" && console.warn) {
            console.warn(message);
          }
          return false;
        } else {
          throw new Error(message);
        }
      }
    };
    SourceMapGenerator.prototype._serializeMappings = function SourceMapGenerator_serializeMappings() {
      var previousGeneratedColumn = 0;
      var previousGeneratedLine = 1;
      var previousOriginalColumn = 0;
      var previousOriginalLine = 0;
      var previousName = 0;
      var previousSource = 0;
      var result = "";
      var next;
      var mapping;
      var nameIdx;
      var sourceIdx;
      var mappings = this._mappings.toArray();
      for (var i = 0, len = mappings.length; i < len; i++) {
        mapping = mappings[i];
        next = "";
        if (mapping.generatedLine !== previousGeneratedLine) {
          previousGeneratedColumn = 0;
          var lineDelta = mapping.generatedLine - previousGeneratedLine;
          next += lineDelta === 1 ? ";" : ";".repeat(lineDelta);
          previousGeneratedLine = mapping.generatedLine;
        } else {
          if (i > 0) {
            if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
              continue;
            }
            next += ",";
          }
        }
        next += base64VLQ.encode(mapping.generatedColumn - previousGeneratedColumn);
        previousGeneratedColumn = mapping.generatedColumn;
        if (mapping.source != null) {
          sourceIdx = this._sources.indexOf(mapping.source);
          next += base64VLQ.encode(sourceIdx - previousSource);
          previousSource = sourceIdx;
          next += base64VLQ.encode(mapping.originalLine - 1 - previousOriginalLine);
          previousOriginalLine = mapping.originalLine - 1;
          next += base64VLQ.encode(mapping.originalColumn - previousOriginalColumn);
          previousOriginalColumn = mapping.originalColumn;
          if (mapping.name != null) {
            nameIdx = this._names.indexOf(mapping.name);
            next += base64VLQ.encode(nameIdx - previousName);
            previousName = nameIdx;
          }
        }
        result += next;
      }
      return result;
    };
    SourceMapGenerator.prototype._generateSourcesContent = function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
      return aSources.map(function(source) {
        if (!this._sourcesContents) {
          return null;
        }
        if (aSourceRoot != null) {
          source = util.relative(aSourceRoot, source);
        }
        var key = util.toSetString(source);
        return Object.prototype.hasOwnProperty.call(this._sourcesContents, key) ? this._sourcesContents[key] : null;
      }, this);
    };
    SourceMapGenerator.prototype.toJSON = function SourceMapGenerator_toJSON() {
      var map = {
        version: this._version,
        sources: this._sources.toArray(),
        names: this._names.toArray(),
        mappings: this._serializeMappings()
      };
      if (this._file != null) {
        map.file = this._file;
      }
      if (this._sourceRoot != null) {
        map.sourceRoot = this._sourceRoot;
      }
      if (this._sourcesContents) {
        map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
      }
      return map;
    };
    SourceMapGenerator.prototype.toString = function SourceMapGenerator_toString() {
      return JSON.stringify(this.toJSON());
    };
    exports.SourceMapGenerator = SourceMapGenerator;
  }
});

// ../node_modules/source-map-js/lib/binary-search.js
var require_binary_search = __commonJS({
  "../node_modules/source-map-js/lib/binary-search.js"(exports) {
    exports.GREATEST_LOWER_BOUND = 1;
    exports.LEAST_UPPER_BOUND = 2;
    function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
      var mid = Math.floor((aHigh - aLow) / 2) + aLow;
      var cmp = aCompare(aNeedle, aHaystack[mid], true);
      if (cmp === 0) {
        return mid;
      } else if (cmp > 0) {
        if (aHigh - mid > 1) {
          return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
        }
        if (aBias == exports.LEAST_UPPER_BOUND) {
          return aHigh < aHaystack.length ? aHigh : -1;
        } else {
          return mid;
        }
      } else {
        if (mid - aLow > 1) {
          return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
        }
        if (aBias == exports.LEAST_UPPER_BOUND) {
          return mid;
        } else {
          return aLow < 0 ? -1 : aLow;
        }
      }
    }
    exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
      if (aHaystack.length === 0) {
        return -1;
      }
      var index = recursiveSearch(
        -1,
        aHaystack.length,
        aNeedle,
        aHaystack,
        aCompare,
        aBias || exports.GREATEST_LOWER_BOUND
      );
      if (index < 0) {
        return -1;
      }
      while (index - 1 >= 0) {
        if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
          break;
        }
        --index;
      }
      return index;
    };
  }
});

// ../node_modules/source-map-js/lib/quick-sort.js
var require_quick_sort = __commonJS({
  "../node_modules/source-map-js/lib/quick-sort.js"(exports) {
    function SortTemplate(comparator) {
      function swap(ary, x, y) {
        var temp = ary[x];
        ary[x] = ary[y];
        ary[y] = temp;
      }
      function randomIntInRange(low, high) {
        return Math.round(low + Math.random() * (high - low));
      }
      function doQuickSort(ary, comparator2, p, r) {
        if (p < r) {
          var pivotIndex = randomIntInRange(p, r);
          var i = p - 1;
          swap(ary, pivotIndex, r);
          var pivot = ary[r];
          for (var j = p; j < r; j++) {
            if (comparator2(ary[j], pivot, false) <= 0) {
              i += 1;
              swap(ary, i, j);
            }
          }
          swap(ary, i + 1, j);
          var q = i + 1;
          doQuickSort(ary, comparator2, p, q - 1);
          doQuickSort(ary, comparator2, q + 1, r);
        }
      }
      return doQuickSort;
    }
    function cloneSort(comparator) {
      let template = SortTemplate.toString();
      let templateFn = new Function(`return ${template}`)();
      return templateFn(comparator);
    }
    var isEvalAllowed = (function() {
      try {
        new Function("return 0")();
        return true;
      } catch {
        return false;
      }
    })();
    var sortCache = /* @__PURE__ */ new WeakMap();
    exports.quickSort = function(ary, comparator, start = 0) {
      let doQuickSort = isEvalAllowed ? sortCache.get(comparator) : SortTemplate(comparator);
      if (doQuickSort === void 0) {
        doQuickSort = cloneSort(comparator);
        sortCache.set(comparator, doQuickSort);
      }
      doQuickSort(ary, comparator, start, ary.length - 1);
    };
  }
});

// ../node_modules/source-map-js/lib/source-map-consumer.js
var require_source_map_consumer = __commonJS({
  "../node_modules/source-map-js/lib/source-map-consumer.js"(exports) {
    var util = require_util();
    var binarySearch = require_binary_search();
    var ArraySet = require_array_set().ArraySet;
    var base64VLQ = require_base64_vlq();
    var quickSort = require_quick_sort().quickSort;
    var MAX_SECTION_OFFSET_LINE = 1e7;
    function SourceMapConsumer(aSourceMap, aSourceMapURL) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }
      return sourceMap.sections != null ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL) : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
    }
    SourceMapConsumer.fromSourceMap = function(aSourceMap, aSourceMapURL) {
      return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
    };
    SourceMapConsumer.prototype._version = 3;
    SourceMapConsumer.prototype.__generatedMappings = null;
    Object.defineProperty(SourceMapConsumer.prototype, "_generatedMappings", {
      configurable: true,
      enumerable: true,
      get: function() {
        if (!this.__generatedMappings) {
          this._parseMappings(this._mappings, this.sourceRoot);
        }
        return this.__generatedMappings;
      }
    });
    SourceMapConsumer.prototype.__originalMappings = null;
    Object.defineProperty(SourceMapConsumer.prototype, "_originalMappings", {
      configurable: true,
      enumerable: true,
      get: function() {
        if (!this.__originalMappings) {
          this._parseMappings(this._mappings, this.sourceRoot);
        }
        return this.__originalMappings;
      }
    });
    SourceMapConsumer.prototype._charIsMappingSeparator = function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
      var c = aStr.charAt(index);
      return c === ";" || c === ",";
    };
    SourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      throw new Error("Subclasses must implement _parseMappings");
    };
    SourceMapConsumer.GENERATED_ORDER = 1;
    SourceMapConsumer.ORIGINAL_ORDER = 2;
    SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
    SourceMapConsumer.LEAST_UPPER_BOUND = 2;
    SourceMapConsumer.prototype.eachMapping = function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
      var context = aContext || null;
      var order = aOrder || SourceMapConsumer.GENERATED_ORDER;
      var mappings;
      switch (order) {
        case SourceMapConsumer.GENERATED_ORDER:
          mappings = this._generatedMappings;
          break;
        case SourceMapConsumer.ORIGINAL_ORDER:
          mappings = this._originalMappings;
          break;
        default:
          throw new Error("Unknown order of iteration.");
      }
      var sourceRoot = this.sourceRoot;
      var boundCallback = aCallback.bind(context);
      var names = this._names;
      var sources = this._sources;
      var sourceMapURL = this._sourceMapURL;
      for (var i = 0, n = mappings.length; i < n; i++) {
        var mapping = mappings[i];
        var source = mapping.source === null ? null : sources.at(mapping.source);
        if (source !== null) {
          source = util.computeSourceURL(sourceRoot, source, sourceMapURL);
        }
        boundCallback({
          source,
          generatedLine: mapping.generatedLine,
          generatedColumn: mapping.generatedColumn,
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: mapping.name === null ? null : names.at(mapping.name)
        });
      }
    };
    SourceMapConsumer.prototype.allGeneratedPositionsFor = function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
      var line = util.getArg(aArgs, "line");
      var needle = {
        source: util.getArg(aArgs, "source"),
        originalLine: line,
        originalColumn: util.getArg(aArgs, "column", 0)
      };
      needle.source = this._findSourceIndex(needle.source);
      if (needle.source < 0) {
        return [];
      }
      var mappings = [];
      var index = this._findMapping(
        needle,
        this._originalMappings,
        "originalLine",
        "originalColumn",
        util.compareByOriginalPositions,
        binarySearch.LEAST_UPPER_BOUND
      );
      if (index >= 0) {
        var mapping = this._originalMappings[index];
        if (aArgs.column === void 0) {
          var originalLine = mapping.originalLine;
          while (mapping && mapping.originalLine === originalLine) {
            mappings.push({
              line: util.getArg(mapping, "generatedLine", null),
              column: util.getArg(mapping, "generatedColumn", null),
              lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
            });
            mapping = this._originalMappings[++index];
          }
        } else {
          var originalColumn = mapping.originalColumn;
          while (mapping && mapping.originalLine === line && mapping.originalColumn == originalColumn) {
            mappings.push({
              line: util.getArg(mapping, "generatedLine", null),
              column: util.getArg(mapping, "generatedColumn", null),
              lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
            });
            mapping = this._originalMappings[++index];
          }
        }
      }
      return mappings;
    };
    exports.SourceMapConsumer = SourceMapConsumer;
    function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }
      var version = util.getArg(sourceMap, "version");
      var sources = util.getArg(sourceMap, "sources");
      var names = util.getArg(sourceMap, "names", []);
      var sourceRoot = util.getArg(sourceMap, "sourceRoot", null);
      var sourcesContent = util.getArg(sourceMap, "sourcesContent", null);
      var mappings = util.getArg(sourceMap, "mappings");
      var file = util.getArg(sourceMap, "file", null);
      if (version != this._version) {
        throw new Error("Unsupported version: " + version);
      }
      if (sourceRoot) {
        sourceRoot = util.normalize(sourceRoot);
      }
      sources = sources.map(String).map(util.normalize).map(function(source) {
        return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source) ? util.relative(sourceRoot, source) : source;
      });
      this._names = ArraySet.fromArray(names.map(String), true);
      this._sources = ArraySet.fromArray(sources, true);
      this._absoluteSources = this._sources.toArray().map(function(s) {
        return util.computeSourceURL(sourceRoot, s, aSourceMapURL);
      });
      this.sourceRoot = sourceRoot;
      this.sourcesContent = sourcesContent;
      this._mappings = mappings;
      this._sourceMapURL = aSourceMapURL;
      this.file = file;
    }
    BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
    BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;
    BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
      var relativeSource = aSource;
      if (this.sourceRoot != null) {
        relativeSource = util.relative(this.sourceRoot, relativeSource);
      }
      if (this._sources.has(relativeSource)) {
        return this._sources.indexOf(relativeSource);
      }
      var i;
      for (i = 0; i < this._absoluteSources.length; ++i) {
        if (this._absoluteSources[i] == aSource) {
          return i;
        }
      }
      return -1;
    };
    BasicSourceMapConsumer.fromSourceMap = function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
      var smc = Object.create(BasicSourceMapConsumer.prototype);
      var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
      var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
      smc.sourceRoot = aSourceMap._sourceRoot;
      smc.sourcesContent = aSourceMap._generateSourcesContent(
        smc._sources.toArray(),
        smc.sourceRoot
      );
      smc.file = aSourceMap._file;
      smc._sourceMapURL = aSourceMapURL;
      smc._absoluteSources = smc._sources.toArray().map(function(s) {
        return util.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
      });
      var generatedMappings = aSourceMap._mappings.toArray().slice();
      var destGeneratedMappings = smc.__generatedMappings = [];
      var destOriginalMappings = smc.__originalMappings = [];
      for (var i = 0, length = generatedMappings.length; i < length; i++) {
        var srcMapping = generatedMappings[i];
        var destMapping = new Mapping();
        destMapping.generatedLine = srcMapping.generatedLine;
        destMapping.generatedColumn = srcMapping.generatedColumn;
        if (srcMapping.source) {
          destMapping.source = sources.indexOf(srcMapping.source);
          destMapping.originalLine = srcMapping.originalLine;
          destMapping.originalColumn = srcMapping.originalColumn;
          if (srcMapping.name) {
            destMapping.name = names.indexOf(srcMapping.name);
          }
          destOriginalMappings.push(destMapping);
        }
        destGeneratedMappings.push(destMapping);
      }
      quickSort(smc.__originalMappings, util.compareByOriginalPositions);
      return smc;
    };
    BasicSourceMapConsumer.prototype._version = 3;
    Object.defineProperty(BasicSourceMapConsumer.prototype, "sources", {
      get: function() {
        return this._absoluteSources.slice();
      }
    });
    function Mapping() {
      this.generatedLine = 0;
      this.generatedColumn = 0;
      this.source = null;
      this.originalLine = null;
      this.originalColumn = null;
      this.name = null;
    }
    var compareGenerated = util.compareByGeneratedPositionsDeflatedNoLine;
    function sortGenerated(array, start) {
      let l = array.length;
      let n = array.length - start;
      if (n <= 1) {
        return;
      } else if (n == 2) {
        let a = array[start];
        let b = array[start + 1];
        if (compareGenerated(a, b) > 0) {
          array[start] = b;
          array[start + 1] = a;
        }
      } else if (n < 20) {
        for (let i = start; i < l; i++) {
          for (let j = i; j > start; j--) {
            let a = array[j - 1];
            let b = array[j];
            if (compareGenerated(a, b) <= 0) {
              break;
            }
            array[j - 1] = b;
            array[j] = a;
          }
        }
      } else {
        quickSort(array, compareGenerated, start);
      }
    }
    BasicSourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      var generatedLine = 1;
      var previousGeneratedColumn = 0;
      var previousOriginalLine = 0;
      var previousOriginalColumn = 0;
      var previousSource = 0;
      var previousName = 0;
      var length = aStr.length;
      var index = 0;
      var cachedSegments = {};
      var temp = {};
      var originalMappings = [];
      var generatedMappings = [];
      var mapping, str, segment, end, value;
      let subarrayStart = 0;
      while (index < length) {
        if (aStr.charAt(index) === ";") {
          generatedLine++;
          index++;
          previousGeneratedColumn = 0;
          sortGenerated(generatedMappings, subarrayStart);
          subarrayStart = generatedMappings.length;
        } else if (aStr.charAt(index) === ",") {
          index++;
        } else {
          mapping = new Mapping();
          mapping.generatedLine = generatedLine;
          for (end = index; end < length; end++) {
            if (this._charIsMappingSeparator(aStr, end)) {
              break;
            }
          }
          str = aStr.slice(index, end);
          segment = [];
          while (index < end) {
            base64VLQ.decode(aStr, index, temp);
            value = temp.value;
            index = temp.rest;
            segment.push(value);
          }
          if (segment.length === 2) {
            throw new Error("Found a source, but no line and column");
          }
          if (segment.length === 3) {
            throw new Error("Found a source and line, but no column");
          }
          mapping.generatedColumn = previousGeneratedColumn + segment[0];
          previousGeneratedColumn = mapping.generatedColumn;
          if (segment.length > 1) {
            mapping.source = previousSource + segment[1];
            previousSource += segment[1];
            mapping.originalLine = previousOriginalLine + segment[2];
            previousOriginalLine = mapping.originalLine;
            mapping.originalLine += 1;
            mapping.originalColumn = previousOriginalColumn + segment[3];
            previousOriginalColumn = mapping.originalColumn;
            if (segment.length > 4) {
              mapping.name = previousName + segment[4];
              previousName += segment[4];
            }
          }
          generatedMappings.push(mapping);
          if (typeof mapping.originalLine === "number") {
            let currentSource = mapping.source;
            while (originalMappings.length <= currentSource) {
              originalMappings.push(null);
            }
            if (originalMappings[currentSource] === null) {
              originalMappings[currentSource] = [];
            }
            originalMappings[currentSource].push(mapping);
          }
        }
      }
      sortGenerated(generatedMappings, subarrayStart);
      this.__generatedMappings = generatedMappings;
      for (var i = 0; i < originalMappings.length; i++) {
        if (originalMappings[i] != null) {
          quickSort(originalMappings[i], util.compareByOriginalPositionsNoSource);
        }
      }
      this.__originalMappings = [].concat(...originalMappings);
    };
    BasicSourceMapConsumer.prototype._findMapping = function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName, aColumnName, aComparator, aBias) {
      if (aNeedle[aLineName] <= 0) {
        throw new TypeError("Line must be greater than or equal to 1, got " + aNeedle[aLineName]);
      }
      if (aNeedle[aColumnName] < 0) {
        throw new TypeError("Column must be greater than or equal to 0, got " + aNeedle[aColumnName]);
      }
      return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
    };
    BasicSourceMapConsumer.prototype.computeColumnSpans = function SourceMapConsumer_computeColumnSpans() {
      for (var index = 0; index < this._generatedMappings.length; ++index) {
        var mapping = this._generatedMappings[index];
        if (index + 1 < this._generatedMappings.length) {
          var nextMapping = this._generatedMappings[index + 1];
          if (mapping.generatedLine === nextMapping.generatedLine) {
            mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
            continue;
          }
        }
        mapping.lastGeneratedColumn = Infinity;
      }
    };
    BasicSourceMapConsumer.prototype.originalPositionFor = function SourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util.getArg(aArgs, "line"),
        generatedColumn: util.getArg(aArgs, "column")
      };
      var index = this._findMapping(
        needle,
        this._generatedMappings,
        "generatedLine",
        "generatedColumn",
        util.compareByGeneratedPositionsDeflated,
        util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND)
      );
      if (index >= 0) {
        var mapping = this._generatedMappings[index];
        if (mapping.generatedLine === needle.generatedLine) {
          var source = util.getArg(mapping, "source", null);
          if (source !== null) {
            source = this._sources.at(source);
            source = util.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
          }
          var name = util.getArg(mapping, "name", null);
          if (name !== null) {
            name = this._names.at(name);
          }
          return {
            source,
            line: util.getArg(mapping, "originalLine", null),
            column: util.getArg(mapping, "originalColumn", null),
            name
          };
        }
      }
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    };
    BasicSourceMapConsumer.prototype.hasContentsOfAllSources = function BasicSourceMapConsumer_hasContentsOfAllSources() {
      if (!this.sourcesContent) {
        return false;
      }
      return this.sourcesContent.length >= this._sources.size() && !this.sourcesContent.some(function(sc) {
        return sc == null;
      });
    };
    BasicSourceMapConsumer.prototype.sourceContentFor = function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
      if (!this.sourcesContent) {
        return null;
      }
      var index = this._findSourceIndex(aSource);
      if (index >= 0) {
        return this.sourcesContent[index];
      }
      var relativeSource = aSource;
      if (this.sourceRoot != null) {
        relativeSource = util.relative(this.sourceRoot, relativeSource);
      }
      var url;
      if (this.sourceRoot != null && (url = util.urlParse(this.sourceRoot))) {
        var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
        if (url.scheme == "file" && this._sources.has(fileUriAbsPath)) {
          return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)];
        }
        if ((!url.path || url.path == "/") && this._sources.has("/" + relativeSource)) {
          return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
        }
      }
      if (nullOnMissing) {
        return null;
      } else {
        throw new Error('"' + relativeSource + '" is not in the SourceMap.');
      }
    };
    BasicSourceMapConsumer.prototype.generatedPositionFor = function SourceMapConsumer_generatedPositionFor(aArgs) {
      var source = util.getArg(aArgs, "source");
      source = this._findSourceIndex(source);
      if (source < 0) {
        return {
          line: null,
          column: null,
          lastColumn: null
        };
      }
      var needle = {
        source,
        originalLine: util.getArg(aArgs, "line"),
        originalColumn: util.getArg(aArgs, "column")
      };
      var index = this._findMapping(
        needle,
        this._originalMappings,
        "originalLine",
        "originalColumn",
        util.compareByOriginalPositions,
        util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND)
      );
      if (index >= 0) {
        var mapping = this._originalMappings[index];
        if (mapping.source === needle.source) {
          return {
            line: util.getArg(mapping, "generatedLine", null),
            column: util.getArg(mapping, "generatedColumn", null),
            lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
          };
        }
      }
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    };
    exports.BasicSourceMapConsumer = BasicSourceMapConsumer;
    function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }
      var version = util.getArg(sourceMap, "version");
      var sections = util.getArg(sourceMap, "sections");
      if (version != this._version) {
        throw new Error("Unsupported version: " + version);
      }
      this._sources = new ArraySet();
      this._names = new ArraySet();
      var lastOffset = {
        line: -1,
        column: 0
      };
      var maxOffsetLine = 0;
      this._sections = sections.map(function(s) {
        if (s.url) {
          throw new Error("Support for url field in sections not implemented.");
        }
        var offset = util.getArg(s, "offset");
        var offsetLine = util.getArg(offset, "line");
        var offsetColumn = util.getArg(offset, "column");
        if (!isValidOffset(offsetLine) || !isValidOffset(offsetColumn)) {
          throw new Error("Section offset line and column must be non-negative integers.");
        }
        if (offsetLine > MAX_SECTION_OFFSET_LINE) {
          throw new Error("Section offset line must not exceed " + MAX_SECTION_OFFSET_LINE + ".");
        }
        if (offsetLine < lastOffset.line || offsetLine === lastOffset.line && offsetColumn < lastOffset.column) {
          throw new Error("Section offsets must be ordered and non-overlapping.");
        }
        lastOffset = offset;
        var consumer = new SourceMapConsumer(util.getArg(s, "map"), aSourceMapURL);
        var totalOffsetLine = offsetLine + (consumer._maxOffsetLine || 0);
        if (totalOffsetLine > MAX_SECTION_OFFSET_LINE) {
          throw new Error("Section offset line must not exceed " + MAX_SECTION_OFFSET_LINE + ", including offsets of nested sections.");
        }
        if (totalOffsetLine > maxOffsetLine) {
          maxOffsetLine = totalOffsetLine;
        }
        return {
          generatedOffset: {
            // The offset fields are 0-based, but we use 1-based indices when
            // encoding/decoding from VLQ.
            generatedLine: offsetLine + 1,
            generatedColumn: offsetColumn + 1
          },
          consumer
        };
      });
      this._maxOffsetLine = maxOffsetLine;
    }
    function isValidOffset(aValue) {
      return typeof aValue === "number" && aValue >= 0 && aValue <= 9007199254740991 && // Number.MAX_SAFE_INTEGER
      Math.floor(aValue) === aValue;
    }
    IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
    IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;
    IndexedSourceMapConsumer.prototype._version = 3;
    Object.defineProperty(IndexedSourceMapConsumer.prototype, "sources", {
      get: function() {
        var sources = [];
        for (var i = 0; i < this._sections.length; i++) {
          var sectionSources = this._sections[i].consumer.sources;
          for (var j = 0; j < sectionSources.length; j++) {
            sources.push(sectionSources[j]);
          }
        }
        return sources;
      }
    });
    IndexedSourceMapConsumer.prototype.originalPositionFor = function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util.getArg(aArgs, "line"),
        generatedColumn: util.getArg(aArgs, "column")
      };
      var sectionIndex = binarySearch.search(
        needle,
        this._sections,
        function(needle2, section2) {
          var cmp = needle2.generatedLine - section2.generatedOffset.generatedLine;
          if (cmp) {
            return cmp;
          }
          return needle2.generatedColumn - section2.generatedOffset.generatedColumn;
        }
      );
      var section = this._sections[sectionIndex];
      if (!section) {
        return {
          source: null,
          line: null,
          column: null,
          name: null
        };
      }
      return section.consumer.originalPositionFor({
        line: needle.generatedLine - (section.generatedOffset.generatedLine - 1),
        column: needle.generatedColumn - (section.generatedOffset.generatedLine === needle.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
        bias: aArgs.bias
      });
    };
    IndexedSourceMapConsumer.prototype.hasContentsOfAllSources = function IndexedSourceMapConsumer_hasContentsOfAllSources() {
      return this._sections.every(function(s) {
        return s.consumer.hasContentsOfAllSources();
      });
    };
    IndexedSourceMapConsumer.prototype.sourceContentFor = function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
      for (var i = 0; i < this._sections.length; i++) {
        var section = this._sections[i];
        var content = section.consumer.sourceContentFor(aSource, true);
        if (content || content === "") {
          return content;
        }
      }
      if (nullOnMissing) {
        return null;
      } else {
        throw new Error('"' + aSource + '" is not in the SourceMap.');
      }
    };
    IndexedSourceMapConsumer.prototype.generatedPositionFor = function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
      for (var i = 0; i < this._sections.length; i++) {
        var section = this._sections[i];
        if (section.consumer._findSourceIndex(util.getArg(aArgs, "source")) === -1) {
          continue;
        }
        var generatedPosition = section.consumer.generatedPositionFor(aArgs);
        if (generatedPosition) {
          var ret = {
            line: generatedPosition.line + (section.generatedOffset.generatedLine - 1),
            column: generatedPosition.column + (section.generatedOffset.generatedLine === generatedPosition.line ? section.generatedOffset.generatedColumn - 1 : 0)
          };
          return ret;
        }
      }
      return {
        line: null,
        column: null
      };
    };
    IndexedSourceMapConsumer.prototype._parseMappings = function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      this.__generatedMappings = [];
      this.__originalMappings = [];
      for (var i = 0; i < this._sections.length; i++) {
        var section = this._sections[i];
        var sectionMappings = section.consumer._generatedMappings;
        for (var j = 0; j < sectionMappings.length; j++) {
          var mapping = sectionMappings[j];
          var source = section.consumer._sources.at(mapping.source);
          if (source !== null) {
            source = util.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL);
          }
          this._sources.add(source);
          source = this._sources.indexOf(source);
          var name = null;
          if (mapping.name) {
            name = section.consumer._names.at(mapping.name);
            this._names.add(name);
            name = this._names.indexOf(name);
          }
          var adjustedMapping = {
            source,
            generatedLine: mapping.generatedLine + (section.generatedOffset.generatedLine - 1),
            generatedColumn: mapping.generatedColumn + (section.generatedOffset.generatedLine === mapping.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
            originalLine: mapping.originalLine,
            originalColumn: mapping.originalColumn,
            name
          };
          this.__generatedMappings.push(adjustedMapping);
          if (typeof adjustedMapping.originalLine === "number") {
            this.__originalMappings.push(adjustedMapping);
          }
        }
      }
      quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
      quickSort(this.__originalMappings, util.compareByOriginalPositions);
    };
    exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;
  }
});

// ../node_modules/source-map-js/lib/source-node.js
var require_source_node = __commonJS({
  "../node_modules/source-map-js/lib/source-node.js"(exports) {
    var SourceMapGenerator = require_source_map_generator().SourceMapGenerator;
    var util = require_util();
    var REGEX_NEWLINE = /(\r?\n)/;
    var NEWLINE_CODE = 10;
    var isSourceNode = "$$$isSourceNode$$$";
    function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
      this.children = [];
      this.sourceContents = {};
      this.line = aLine == null ? null : aLine;
      this.column = aColumn == null ? null : aColumn;
      this.source = aSource == null ? null : aSource;
      this.name = aName == null ? null : aName;
      this[isSourceNode] = true;
      if (aChunks != null) this.add(aChunks);
    }
    SourceNode.fromStringWithSourceMap = function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
      var node = new SourceNode();
      var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
      var remainingLinesIndex = 0;
      var shiftNextLine = function() {
        var lineContents = getNextLine();
        var newLine = getNextLine() || "";
        return lineContents + newLine;
        function getNextLine() {
          return remainingLinesIndex < remainingLines.length ? remainingLines[remainingLinesIndex++] : void 0;
        }
      };
      var lastGeneratedLine = 1, lastGeneratedColumn = 0;
      var lastMapping = null;
      aSourceMapConsumer.eachMapping(function(mapping) {
        if (lastMapping !== null) {
          if (lastGeneratedLine < mapping.generatedLine) {
            addMappingWithCode(lastMapping, shiftNextLine());
            lastGeneratedLine++;
            lastGeneratedColumn = 0;
          } else {
            var nextLine = remainingLines[remainingLinesIndex] || "";
            var code = nextLine.substr(0, mapping.generatedColumn - lastGeneratedColumn);
            remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn - lastGeneratedColumn);
            lastGeneratedColumn = mapping.generatedColumn;
            addMappingWithCode(lastMapping, code);
            lastMapping = mapping;
            return;
          }
        }
        while (lastGeneratedLine < mapping.generatedLine) {
          if (remainingLinesIndex >= remainingLines.length) {
            lastGeneratedLine = mapping.generatedLine;
            break;
          }
          node.add(shiftNextLine());
          lastGeneratedLine++;
        }
        if (lastGeneratedColumn < mapping.generatedColumn) {
          var nextLine = remainingLines[remainingLinesIndex] || "";
          node.add(nextLine.substr(0, mapping.generatedColumn));
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
        }
        lastMapping = mapping;
      }, this);
      if (remainingLinesIndex < remainingLines.length) {
        if (lastMapping) {
          addMappingWithCode(lastMapping, shiftNextLine());
        }
        node.add(remainingLines.splice(remainingLinesIndex).join(""));
      }
      aSourceMapConsumer.sources.forEach(function(sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          if (aRelativePath != null) {
            sourceFile = util.join(aRelativePath, sourceFile);
          }
          node.setSourceContent(sourceFile, content);
        }
      });
      return node;
      function addMappingWithCode(mapping, code) {
        if (mapping === null || mapping.source === void 0) {
          node.add(code);
        } else {
          var source = aRelativePath ? util.join(aRelativePath, mapping.source) : mapping.source;
          node.add(new SourceNode(
            mapping.originalLine,
            mapping.originalColumn,
            source,
            code,
            mapping.name
          ));
        }
      }
    };
    SourceNode.prototype.add = function SourceNode_add(aChunk) {
      if (Array.isArray(aChunk)) {
        aChunk.forEach(function(chunk) {
          this.add(chunk);
        }, this);
      } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
        if (aChunk) {
          this.children.push(aChunk);
        }
      } else {
        throw new TypeError(
          "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
        );
      }
      return this;
    };
    SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
      if (Array.isArray(aChunk)) {
        for (var i = aChunk.length - 1; i >= 0; i--) {
          this.prepend(aChunk[i]);
        }
      } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
        this.children.unshift(aChunk);
      } else {
        throw new TypeError(
          "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
        );
      }
      return this;
    };
    SourceNode.prototype.walk = function SourceNode_walk(aFn) {
      var chunk;
      for (var i = 0, len = this.children.length; i < len; i++) {
        chunk = this.children[i];
        if (chunk[isSourceNode]) {
          chunk.walk(aFn);
        } else {
          if (chunk !== "") {
            aFn(chunk, {
              source: this.source,
              line: this.line,
              column: this.column,
              name: this.name
            });
          }
        }
      }
    };
    SourceNode.prototype.join = function SourceNode_join(aSep) {
      var newChildren;
      var i;
      var len = this.children.length;
      if (len > 0) {
        newChildren = [];
        for (i = 0; i < len - 1; i++) {
          newChildren.push(this.children[i]);
          newChildren.push(aSep);
        }
        newChildren.push(this.children[i]);
        this.children = newChildren;
      }
      return this;
    };
    SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
      var lastChild = this.children[this.children.length - 1];
      if (lastChild[isSourceNode]) {
        lastChild.replaceRight(aPattern, aReplacement);
      } else if (typeof lastChild === "string") {
        this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
      } else {
        this.children.push("".replace(aPattern, aReplacement));
      }
      return this;
    };
    SourceNode.prototype.setSourceContent = function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
      this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
    };
    SourceNode.prototype.walkSourceContents = function SourceNode_walkSourceContents(aFn) {
      for (var i = 0, len = this.children.length; i < len; i++) {
        if (this.children[i][isSourceNode]) {
          this.children[i].walkSourceContents(aFn);
        }
      }
      var sources = Object.keys(this.sourceContents);
      for (var i = 0, len = sources.length; i < len; i++) {
        aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
      }
    };
    SourceNode.prototype.toString = function SourceNode_toString() {
      var str = "";
      this.walk(function(chunk) {
        str += chunk;
      });
      return str;
    };
    SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
      var generated = {
        code: "",
        line: 1,
        column: 0
      };
      var map = new SourceMapGenerator(aArgs);
      var sourceMappingActive = false;
      var lastOriginalSource = null;
      var lastOriginalLine = null;
      var lastOriginalColumn = null;
      var lastOriginalName = null;
      this.walk(function(chunk, original) {
        generated.code += chunk;
        if (original.source !== null && original.line !== null && original.column !== null) {
          if (lastOriginalSource !== original.source || lastOriginalLine !== original.line || lastOriginalColumn !== original.column || lastOriginalName !== original.name) {
            map.addMapping({
              source: original.source,
              original: {
                line: original.line,
                column: original.column
              },
              generated: {
                line: generated.line,
                column: generated.column
              },
              name: original.name
            });
          }
          lastOriginalSource = original.source;
          lastOriginalLine = original.line;
          lastOriginalColumn = original.column;
          lastOriginalName = original.name;
          sourceMappingActive = true;
        } else if (sourceMappingActive) {
          map.addMapping({
            generated: {
              line: generated.line,
              column: generated.column
            }
          });
          lastOriginalSource = null;
          sourceMappingActive = false;
        }
        for (var idx = 0, length = chunk.length; idx < length; idx++) {
          if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
            generated.line++;
            generated.column = 0;
            if (idx + 1 === length) {
              lastOriginalSource = null;
              sourceMappingActive = false;
            } else if (sourceMappingActive) {
              map.addMapping({
                source: original.source,
                original: {
                  line: original.line,
                  column: original.column
                },
                generated: {
                  line: generated.line,
                  column: generated.column
                },
                name: original.name
              });
            }
          } else {
            generated.column++;
          }
        }
      });
      this.walkSourceContents(function(sourceFile, sourceContent) {
        map.setSourceContent(sourceFile, sourceContent);
      });
      return { code: generated.code, map };
    };
    exports.SourceNode = SourceNode;
  }
});

// ../node_modules/source-map-js/source-map.js
var require_source_map = __commonJS({
  "../node_modules/source-map-js/source-map.js"(exports) {
    exports.SourceMapGenerator = require_source_map_generator().SourceMapGenerator;
    exports.SourceMapConsumer = require_source_map_consumer().SourceMapConsumer;
    exports.SourceNode = require_source_node().SourceNode;
  }
});

// ../node_modules/postcss/lib/previous-map.js
var require_previous_map = __commonJS({
  "../node_modules/postcss/lib/previous-map.js"(exports, module) {
    "use strict";
    var { existsSync, readFileSync, realpathSync } = __require("fs");
    var { dirname, isAbsolute, join, relative, sep } = __require("path");
    var { SourceMapConsumer, SourceMapGenerator } = require_source_map();
    function realPath(path) {
      try {
        return realpathSync(path);
      } catch {
        return path;
      }
    }
    function fromBase64(str) {
      if (Buffer) {
        return Buffer.from(str, "base64").toString();
      } else {
        return window.atob(str);
      }
    }
    var PreviousMap = class {
      constructor(css, opts) {
        if (opts.map === false) return;
        if (opts.unsafeMap) this.unsafeMap = true;
        this.loadAnnotation(css);
        this.inline = this.startWith(this.annotation, "data:");
        let prev = opts.map ? opts.map.prev : void 0;
        let text = this.loadMap(opts.from, prev);
        if (!this.mapFile && opts.from) {
          this.mapFile = opts.from;
        }
        if (this.mapFile) this.root = dirname(this.mapFile);
        if (text) this.text = text;
      }
      consumer() {
        if (!this.consumerCache) {
          this.consumerCache = new SourceMapConsumer(this.json || this.text);
        }
        return this.consumerCache;
      }
      decodeInline(text) {
        let baseCharsetUri = /^data:application\/json;charset=utf-?8;base64,/;
        let baseUri = /^data:application\/json;base64,/;
        let charsetUri = /^data:application\/json;charset=utf-?8,/;
        let uri = /^data:application\/json,/;
        let uriMatch = text.match(charsetUri) || text.match(uri);
        if (uriMatch) {
          return decodeURIComponent(text.substr(uriMatch[0].length));
        }
        let baseUriMatch = text.match(baseCharsetUri) || text.match(baseUri);
        if (baseUriMatch) {
          return fromBase64(text.substr(baseUriMatch[0].length));
        }
        let encoding = text.slice("data:application/json;".length);
        encoding = encoding.slice(0, encoding.indexOf(","));
        throw new Error("Unsupported source map encoding " + encoding);
      }
      getAnnotationURL(sourceMapString) {
        return sourceMapString.replace(/^\/\*\s*# sourceMappingURL=/, "").trim();
      }
      isMap(map) {
        if (typeof map !== "object") return false;
        return typeof map.mappings === "string" || typeof map._mappings === "string" || Array.isArray(map.sections);
      }
      loadAnnotation(css) {
        let comments = css.match(/\/\*\s*# sourceMappingURL=/g);
        if (!comments) return;
        let start = css.lastIndexOf(comments.pop());
        let end = css.indexOf("*/", start);
        if (start > -1 && end > -1) {
          this.annotation = this.getAnnotationURL(css.substring(start, end));
        }
      }
      loadFile(path, cssFile, trusted) {
        if (!trusted && !this.unsafeMap) {
          if (!/\.map$/i.test(path)) return void 0;
          if (!cssFile) return void 0;
          let rel = relative(realPath(dirname(cssFile)), realPath(path));
          if (rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel)) {
            return void 0;
          }
        }
        this.root = dirname(path);
        if (existsSync(path)) {
          this.mapFile = path;
          return readFileSync(path, "utf-8").toString().trim();
        }
      }
      loadMap(file, prev) {
        if (prev === false) return false;
        if (prev) {
          if (typeof prev === "string") {
            return prev;
          } else if (typeof prev === "function") {
            let prevPath = prev(file);
            if (prevPath) {
              let map = this.loadFile(prevPath, file, true);
              if (!map) {
                throw new Error(
                  "Unable to load previous source map: " + prevPath.toString()
                );
              }
              return map;
            }
          } else if (prev instanceof SourceMapConsumer) {
            return SourceMapGenerator.fromSourceMap(prev).toString();
          } else if (prev instanceof SourceMapGenerator) {
            return prev.toString();
          } else if (this.isMap(prev)) {
            return JSON.stringify(prev);
          } else {
            throw new Error(
              "Unsupported previous source map format: " + prev.toString()
            );
          }
        } else if (this.inline) {
          return this.decodeInline(this.annotation);
        } else if (this.annotation) {
          let map = this.annotation;
          if (file) map = join(dirname(file), map);
          let unknown = this.loadFile(map, file, false);
          if (unknown) {
            try {
              this.json = JSON.parse(unknown.replace(/^\)]}'[^\n]*\n/, ""));
            } catch {
              return void 0;
            }
          }
          return unknown;
        }
      }
      startWith(string, start) {
        if (!string) return false;
        return string.substr(0, start.length) === start;
      }
      withContent() {
        return !!(this.consumer().sourcesContent && this.consumer().sourcesContent.length > 0);
      }
    };
    module.exports = PreviousMap;
    PreviousMap.default = PreviousMap;
  }
});

// ../node_modules/postcss/lib/input.js
var require_input = __commonJS({
  "../node_modules/postcss/lib/input.js"(exports, module) {
    "use strict";
    var { nanoid } = require_non_secure();
    var { isAbsolute, resolve } = __require("path");
    var { SourceMapConsumer, SourceMapGenerator } = require_source_map();
    var { fileURLToPath, pathToFileURL } = __require("url");
    var CssSyntaxError = require_css_syntax_error();
    var PreviousMap = require_previous_map();
    var terminalHighlight = require_terminal_highlight();
    var lineToIndexCache = /* @__PURE__ */ Symbol("lineToIndexCache");
    var sourceMapAvailable = Boolean(SourceMapConsumer && SourceMapGenerator);
    var pathAvailable = Boolean(resolve && isAbsolute);
    function getLineToIndex(input) {
      if (input[lineToIndexCache]) return input[lineToIndexCache];
      let lines = input.css.split("\n");
      let lineToIndex = new Array(lines.length);
      let prevIndex = 0;
      for (let i = 0, l = lines.length; i < l; i++) {
        lineToIndex[i] = prevIndex;
        prevIndex += lines[i].length + 1;
      }
      input[lineToIndexCache] = lineToIndex;
      return lineToIndex;
    }
    var Input = class {
      get from() {
        return this.file || this.id;
      }
      constructor(css, opts = {}) {
        if (css === null || typeof css === "undefined" || typeof css === "object" && !css.toString) {
          throw new Error(`PostCSS received ${css} instead of CSS string`);
        }
        this.css = css.toString();
        if (this.css[0] === "\uFEFF" || this.css[0] === "\uFFFE") {
          this.hasBOM = true;
          this.css = this.css.slice(1);
        } else {
          this.hasBOM = false;
        }
        this.document = this.css;
        if (opts.document) this.document = opts.document.toString();
        if (opts.from) {
          if (!pathAvailable || /^\w+:\/\//.test(opts.from) || isAbsolute(opts.from)) {
            this.file = opts.from;
          } else {
            this.file = resolve(opts.from);
          }
        }
        if (pathAvailable && sourceMapAvailable) {
          let map = new PreviousMap(this.css, opts);
          if (map.text) {
            this.map = map;
            let file = map.consumer().file;
            if (!this.file && file) this.file = this.mapResolve(file);
          }
        }
        if (!this.file) {
          this.id = "<input css " + nanoid(6) + ">";
        }
        if (this.map) this.map.file = this.from;
      }
      error(message, line, column, opts = {}) {
        let endColumn, endLine, endOffset, offset, result;
        if (line && typeof line === "object") {
          let start = line;
          let end = column;
          if (typeof start.offset === "number") {
            offset = start.offset;
            let pos = this.fromOffset(offset);
            line = pos.line;
            column = pos.col;
          } else {
            line = start.line;
            column = start.column;
            offset = this.fromLineAndColumn(line, column);
          }
          if (typeof end.offset === "number") {
            endOffset = end.offset;
            let pos = this.fromOffset(endOffset);
            endLine = pos.line;
            endColumn = pos.col;
          } else {
            endLine = end.line;
            endColumn = end.column;
            endOffset = this.fromLineAndColumn(end.line, end.column);
          }
        } else if (!column) {
          offset = line;
          let pos = this.fromOffset(offset);
          line = pos.line;
          column = pos.col;
        } else {
          offset = this.fromLineAndColumn(line, column);
        }
        let origin = this.origin(line, column, endLine, endColumn);
        if (origin) {
          result = new CssSyntaxError(
            message,
            origin.endLine === void 0 ? origin.line : { column: origin.column, line: origin.line },
            origin.endLine === void 0 ? origin.column : { column: origin.endColumn, line: origin.endLine },
            origin.source,
            origin.file,
            opts.plugin
          );
        } else {
          result = new CssSyntaxError(
            message,
            endLine === void 0 ? line : { column, line },
            endLine === void 0 ? column : { column: endColumn, line: endLine },
            this.css,
            this.file,
            opts.plugin
          );
        }
        result.input = {
          column,
          endColumn,
          endLine,
          endOffset,
          line,
          offset,
          source: this.css
        };
        if (this.file) {
          if (pathToFileURL) {
            result.input.url = pathToFileURL(this.file).toString();
          }
          result.input.file = this.file;
        }
        return result;
      }
      fromLineAndColumn(line, column) {
        let lineToIndex = getLineToIndex(this);
        let index = lineToIndex[line - 1];
        return index + column - 1;
      }
      fromOffset(offset) {
        let lineToIndex = getLineToIndex(this);
        let lastLine = lineToIndex[lineToIndex.length - 1];
        let min = 0;
        if (offset >= lastLine) {
          min = lineToIndex.length - 1;
        } else {
          let max = lineToIndex.length - 2;
          let mid;
          while (min < max) {
            mid = min + (max - min >> 1);
            if (offset < lineToIndex[mid]) {
              max = mid - 1;
            } else if (offset >= lineToIndex[mid + 1]) {
              min = mid + 1;
            } else {
              min = mid;
              break;
            }
          }
        }
        return {
          col: offset - lineToIndex[min] + 1,
          line: min + 1
        };
      }
      mapResolve(file) {
        if (/^\w+:\/\//.test(file)) {
          return file;
        }
        return resolve(this.map.consumer().sourceRoot || this.map.root || ".", file);
      }
      origin(line, column, endLine, endColumn) {
        if (!this.map) return false;
        let consumer = this.map.consumer();
        let from = consumer.originalPositionFor({ column: column - 1, line });
        if (!from.source) return false;
        let to;
        if (typeof endLine === "number") {
          let toPosition = consumer.originalPositionFor({
            column: endColumn - 1,
            line: endLine
          });
          if (toPosition.source) to = toPosition;
        }
        let fromUrl;
        if (isAbsolute(from.source)) {
          fromUrl = pathToFileURL(from.source);
        } else {
          fromUrl = new URL(
            from.source,
            this.map.consumer().sourceRoot || pathToFileURL(this.map.mapFile)
          );
        }
        let result = {
          column: from.column + 1,
          endColumn: to && to.column + 1,
          endLine: to && to.line,
          line: from.line,
          url: fromUrl.toString()
        };
        if (fromUrl.protocol === "file:") {
          if (fileURLToPath) {
            result.file = fileURLToPath(fromUrl);
          } else {
            throw new Error(`file: protocol is not available in this PostCSS build`);
          }
        }
        let source = consumer.sourceContentFor(from.source);
        if (source) result.source = source;
        return result;
      }
      toJSON() {
        let json = {};
        for (let name of ["hasBOM", "css", "file", "id"]) {
          if (this[name] != null) {
            json[name] = this[name];
          }
        }
        if (this.map) {
          json.map = { ...this.map };
          if (json.map.consumerCache) {
            json.map.consumerCache = void 0;
          }
        }
        return json;
      }
    };
    module.exports = Input;
    Input.default = Input;
    if (terminalHighlight && terminalHighlight.registerInput) {
      terminalHighlight.registerInput(Input);
    }
  }
});

// ../node_modules/postcss/lib/root.js
var require_root = __commonJS({
  "../node_modules/postcss/lib/root.js"(exports, module) {
    "use strict";
    var Container = require_container();
    var LazyResult;
    var Processor;
    var Root = class extends Container {
      constructor(defaults) {
        super(defaults);
        this.type = "root";
        if (!this.nodes) this.nodes = [];
      }
      normalize(child, sample, type) {
        let keepBefore = /* @__PURE__ */ new Set();
        for (let node of Array.isArray(child) ? child : [child]) {
          if (node && typeof node === "object" && !node.parent && node.raws && typeof node.raws.before !== "undefined") {
            keepBefore.add(node.raws);
          }
        }
        let nodes = super.normalize(child);
        if (sample) {
          if (type === "prepend") {
            if (this.nodes.length > 1) {
              sample.raws.before = this.nodes[1].raws.before;
            } else {
              delete sample.raws.before;
            }
          } else if (this.first !== sample) {
            for (let node of nodes) {
              if (!keepBefore.has(node.raws)) {
                node.raws.before = sample.raws.before;
              }
            }
          }
        }
        return nodes;
      }
      removeChild(child, ignore) {
        let index = this.index(child);
        if (!ignore && index === 0 && this.nodes.length > 1) {
          this.nodes[1].raws.before = this.nodes[index].raws.before;
        }
        return super.removeChild(child);
      }
      toResult(opts = {}) {
        let lazy = new LazyResult(new Processor(), this, opts);
        return lazy.stringify();
      }
    };
    Root.registerLazyResult = (dependant) => {
      LazyResult = dependant;
    };
    Root.registerProcessor = (dependant) => {
      Processor = dependant;
    };
    module.exports = Root;
    Root.default = Root;
    Container.registerRoot(Root);
  }
});

// ../node_modules/postcss/lib/list.js
var require_list = __commonJS({
  "../node_modules/postcss/lib/list.js"(exports, module) {
    "use strict";
    var list = {
      comma(string) {
        return list.split(string, [","], true);
      },
      space(string) {
        let spaces = [" ", "\n", "	"];
        return list.split(string, spaces);
      },
      split(string, separators, last) {
        if (typeof string !== "string") return [];
        let array = [];
        let current = "";
        let split = false;
        let func = 0;
        let inQuote = false;
        let prevQuote = "";
        let escape = false;
        let inComment = false;
        for (let i = 0; i < string.length; i++) {
          let letter = string[i];
          if (inComment) {
            current += letter;
            if (letter === "*" && string[i + 1] === "/") {
              current += "/";
              i += 1;
              inComment = false;
            }
            continue;
          }
          if (escape) {
            escape = false;
          } else if (letter === "\\") {
            escape = true;
          } else if (inQuote) {
            if (letter === prevQuote) {
              inQuote = false;
            }
          } else if (letter === '"' || letter === "'") {
            inQuote = true;
            prevQuote = letter;
          } else if (letter === "/" && string[i + 1] === "*") {
            current += "/*";
            i += 1;
            inComment = true;
            continue;
          } else if (letter === "(") {
            func += 1;
          } else if (letter === ")") {
            if (func > 0) func -= 1;
          } else if (func === 0) {
            if (separators.includes(letter)) split = true;
          }
          if (split) {
            let value2 = current.trim();
            if (last || value2 !== "") array.push(value2);
            current = "";
            split = false;
          } else {
            current += letter;
          }
        }
        let value = current.trim();
        if (last || value !== "") array.push(value);
        return array;
      }
    };
    module.exports = list;
    list.default = list;
  }
});

// ../node_modules/postcss/lib/rule.js
var require_rule = __commonJS({
  "../node_modules/postcss/lib/rule.js"(exports, module) {
    "use strict";
    var Container = require_container();
    var list = require_list();
    var Rule = class extends Container {
      get selectors() {
        return list.comma(this.selector);
      }
      set selectors(values) {
        let match = this.selector ? this.selector.match(/,\s*/) : null;
        let sep = match ? match[0] : "," + this.raw("between", "beforeOpen");
        this.selector = values.join(sep);
      }
      constructor(defaults) {
        super(defaults);
        this.type = "rule";
        if (!this.nodes) this.nodes = [];
      }
    };
    module.exports = Rule;
    Rule.default = Rule;
    Container.registerRule(Rule);
  }
});

// ../node_modules/postcss/lib/fromJSON.js
var require_fromJSON = __commonJS({
  "../node_modules/postcss/lib/fromJSON.js"(exports, module) {
    "use strict";
    var AtRule = require_at_rule();
    var Comment = require_comment();
    var Declaration = require_declaration();
    var Input = require_input();
    var PreviousMap = require_previous_map();
    var Root = require_root();
    var Rule = require_rule();
    function hydrateInputs(json, inputs) {
      if (!json.inputs) return inputs;
      return json.inputs.map((input) => {
        let inputHydrated = { ...input, __proto__: Input.prototype };
        if (inputHydrated.map) {
          inputHydrated.map = {
            ...inputHydrated.map,
            __proto__: PreviousMap.prototype
          };
        }
        return inputHydrated;
      });
    }
    function constructNode(json, inputs, children) {
      let defaults = { ...json };
      delete defaults.inputs;
      delete defaults.nodes;
      if (defaults.source) {
        let { inputId, ...source } = defaults.source;
        defaults.source = source;
        if (inputId != null) {
          defaults.source.input = inputs[inputId];
        }
      }
      let node;
      if (defaults.type === "root") {
        node = new Root(defaults);
      } else if (defaults.type === "decl") {
        node = new Declaration(defaults);
      } else if (defaults.type === "rule") {
        node = new Rule(defaults);
      } else if (defaults.type === "comment") {
        node = new Comment(defaults);
      } else if (defaults.type === "atrule") {
        node = new AtRule(defaults);
      } else {
        throw new Error("Unknown node type: " + json.type);
      }
      if (children) {
        node.nodes = children;
        for (let child of children) child.parent = node;
      }
      return node;
    }
    function fromJSON(json, inputs) {
      if (Array.isArray(json)) return json.map((n) => fromJSON(n));
      let result;
      let stack = [
        { childIndex: 0, children: [], inputs: hydrateInputs(json, inputs), json }
      ];
      while (stack.length > 0) {
        let frame = stack[stack.length - 1];
        let jsonNodes = frame.json.nodes;
        if (jsonNodes && frame.childIndex < jsonNodes.length) {
          let childJson = jsonNodes[frame.childIndex];
          frame.childIndex += 1;
          stack.push({
            childIndex: 0,
            children: [],
            inputs: hydrateInputs(childJson, frame.inputs),
            json: childJson
          });
          continue;
        }
        stack.pop();
        let node = constructNode(
          frame.json,
          frame.inputs,
          jsonNodes ? frame.children : void 0
        );
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(node);
        } else {
          result = node;
        }
      }
      return result;
    }
    module.exports = fromJSON;
    fromJSON.default = fromJSON;
  }
});

// ../node_modules/postcss/lib/map-generator.js
var require_map_generator = __commonJS({
  "../node_modules/postcss/lib/map-generator.js"(exports, module) {
    "use strict";
    var { dirname, relative, resolve, sep } = __require("path");
    var { SourceMapConsumer, SourceMapGenerator } = require_source_map();
    var { pathToFileURL } = __require("url");
    var Input = require_input();
    var sourceMapAvailable = Boolean(SourceMapConsumer && SourceMapGenerator);
    var pathAvailable = Boolean(dirname && resolve && relative && sep);
    var MapGenerator = class {
      constructor(stringify, root, opts, cssString) {
        this.stringify = stringify;
        this.mapOpts = opts.map || {};
        this.root = root;
        this.opts = opts;
        this.css = cssString;
        this.originalCSS = cssString;
        this.usesFileUrls = !this.mapOpts.from && this.mapOpts.absolute;
        this.memoizedFileURLs = /* @__PURE__ */ new Map();
        this.memoizedPaths = /* @__PURE__ */ new Map();
        this.memoizedURLs = /* @__PURE__ */ new Map();
      }
      addAnnotation() {
        let content;
        if (this.isInline()) {
          content = "data:application/json;base64," + this.toBase64(this.map.toString());
        } else if (typeof this.mapOpts.annotation === "string") {
          content = this.mapOpts.annotation;
        } else if (typeof this.mapOpts.annotation === "function") {
          content = this.mapOpts.annotation(this.opts.to, this.root);
        } else {
          content = this.outputFile() + ".map";
        }
        let eol = "\n";
        if (this.css.includes("\r\n")) eol = "\r\n";
        this.css += eol + "/*# sourceMappingURL=" + content + " */";
      }
      applyPrevMaps() {
        for (let prev of this.previous()) {
          let from = this.toUrl(this.path(prev.file));
          let root = prev.root || dirname(prev.file);
          let map;
          if (this.mapOpts.sourcesContent === false) {
            map = new SourceMapConsumer(prev.text);
            if (map.sourcesContent) {
              map.sourcesContent = null;
            }
          } else {
            map = prev.consumer();
          }
          this.map.applySourceMap(map, from, this.toUrl(this.path(root)));
        }
      }
      clearAnnotation() {
        if (this.mapOpts.annotation === false) return;
        if (this.root) {
          let node;
          for (let i = this.root.nodes.length - 1; i >= 0; i--) {
            node = this.root.nodes[i];
            if (node.type !== "comment") continue;
            if (node.text.startsWith("# sourceMappingURL=")) {
              this.root.removeChild(i);
            }
          }
        } else if (this.css) {
          let annotation = "/*# sourceMappingURL=";
          let css = "";
          let cursor = 0;
          let startIndex;
          while ((startIndex = this.css.indexOf(annotation, cursor)) !== -1) {
            let endIndex = this.css.indexOf("*/", startIndex + annotation.length);
            if (endIndex === -1) break;
            while (startIndex > cursor && this.css[startIndex - 1] === "\n") {
              startIndex--;
            }
            css += this.css.slice(cursor, startIndex);
            cursor = endIndex + 2;
          }
          if (cursor > 0) this.css = css + this.css.slice(cursor);
        }
      }
      generate() {
        this.clearAnnotation();
        if (pathAvailable && sourceMapAvailable && this.isMap()) {
          return this.generateMap();
        } else {
          let result = "";
          this.stringify(this.root, (i) => {
            result += i;
          });
          return [result];
        }
      }
      generateMap() {
        if (this.root) {
          this.generateString();
        } else if (this.previous().length === 1) {
          let prev = this.previous()[0].consumer();
          prev.file = this.outputFile();
          this.map = SourceMapGenerator.fromSourceMap(prev, {
            ignoreInvalidMapping: true
          });
        } else {
          this.map = new SourceMapGenerator({
            file: this.outputFile(),
            ignoreInvalidMapping: true
          });
          this.map.addMapping({
            generated: { column: 0, line: 1 },
            original: { column: 0, line: 1 },
            source: this.opts.from ? this.toUrl(this.path(this.opts.from)) : "<no source>"
          });
        }
        if (this.isSourcesContent()) this.setSourcesContent();
        if (this.root && this.previous().length > 0) this.applyPrevMaps();
        if (this.isAnnotation()) this.addAnnotation();
        if (this.isInline()) {
          return [this.css];
        } else {
          return [this.css, this.map];
        }
      }
      generateString() {
        this.css = "";
        this.map = new SourceMapGenerator({
          file: this.outputFile(),
          ignoreInvalidMapping: true
        });
        let line = 1;
        let column = 1;
        let noSource = "<no source>";
        let mapping = {
          generated: { column: 0, line: 0 },
          original: { column: 0, line: 0 },
          source: ""
        };
        let last, lines;
        this.stringify(this.root, (str, node, type) => {
          this.css += str;
          if (node && type !== "end") {
            mapping.generated.line = line;
            mapping.generated.column = column - 1;
            if (node.source && node.source.start) {
              mapping.source = this.sourcePath(node);
              mapping.original.line = node.source.start.line;
              mapping.original.column = node.source.start.column - 1;
              this.map.addMapping(mapping);
            } else {
              mapping.source = noSource;
              mapping.original.line = 1;
              mapping.original.column = 0;
              this.map.addMapping(mapping);
            }
          }
          lines = str.match(/\n/g);
          if (lines) {
            line += lines.length;
            last = str.lastIndexOf("\n");
            column = str.length - last;
          } else {
            column += str.length;
          }
          if (node && type !== "start") {
            let p = node.parent || { raws: {} };
            let childless = node.type === "decl" || node.type === "atrule" && !node.nodes;
            if (!childless || node !== p.last || p.raws.semicolon) {
              if (node.source && node.source.end) {
                mapping.source = this.sourcePath(node);
                mapping.original.line = node.source.end.line;
                mapping.original.column = node.source.end.column - 1;
                mapping.generated.line = line;
                mapping.generated.column = column - 2;
                this.map.addMapping(mapping);
              } else {
                mapping.source = noSource;
                mapping.original.line = 1;
                mapping.original.column = 0;
                mapping.generated.line = line;
                mapping.generated.column = column - 1;
                this.map.addMapping(mapping);
              }
            }
          }
        });
      }
      isAnnotation() {
        if (this.isInline()) {
          return true;
        }
        if (typeof this.mapOpts.annotation !== "undefined") {
          return this.mapOpts.annotation;
        }
        if (this.previous().length) {
          return this.previous().some((i) => i.annotation);
        }
        return true;
      }
      isInline() {
        if (typeof this.mapOpts.inline !== "undefined") {
          return this.mapOpts.inline;
        }
        let annotation = this.mapOpts.annotation;
        if (typeof annotation !== "undefined" && annotation !== true) {
          return false;
        }
        if (this.previous().length) {
          return this.previous().some((i) => i.inline);
        }
        return true;
      }
      isMap() {
        if (typeof this.opts.map !== "undefined") {
          return !!this.opts.map;
        }
        return this.previous().length > 0;
      }
      isSourcesContent() {
        if (typeof this.mapOpts.sourcesContent !== "undefined") {
          return this.mapOpts.sourcesContent;
        }
        if (this.previous().length) {
          return this.previous().some((i) => i.withContent());
        }
        return true;
      }
      outputFile() {
        if (this.opts.to) {
          return this.path(this.opts.to);
        } else if (this.opts.from) {
          return this.path(this.opts.from);
        } else {
          return "to.css";
        }
      }
      path(file) {
        if (this.mapOpts.absolute) return file;
        if (file.charCodeAt(0) === 60) return file;
        if (/^\w+:\/\//.test(file)) return file;
        let cached = this.memoizedPaths.get(file);
        if (cached) return cached;
        let from = this.opts.to ? dirname(this.opts.to) : ".";
        if (typeof this.mapOpts.annotation === "string") {
          from = dirname(resolve(from, this.mapOpts.annotation));
        }
        let path = relative(from, file);
        this.memoizedPaths.set(file, path);
        return path;
      }
      previous() {
        if (!this.previousMaps) {
          this.previousMaps = [];
          if (this.root) {
            this.root.walk((node) => {
              if (node.source && node.source.input.map) {
                let map = node.source.input.map;
                if (!this.previousMaps.includes(map)) {
                  this.previousMaps.push(map);
                }
              }
            });
          } else {
            let input = new Input(this.originalCSS, this.opts);
            if (input.map) this.previousMaps.push(input.map);
          }
        }
        return this.previousMaps;
      }
      setSourcesContent() {
        let already = {};
        if (this.root) {
          this.root.walk((node) => {
            if (node.source) {
              let from = node.source.input.from;
              if (from && !already[from]) {
                already[from] = true;
                let fromUrl = this.usesFileUrls ? this.toFileUrl(from) : this.toUrl(this.path(from));
                this.map.setSourceContent(fromUrl, node.source.input.css);
              }
            }
          });
        } else if (this.css) {
          let from = this.opts.from ? this.toUrl(this.path(this.opts.from)) : "<no source>";
          this.map.setSourceContent(from, this.css);
        }
      }
      sourcePath(node) {
        if (this.mapOpts.from) {
          return this.toUrl(this.mapOpts.from);
        } else if (this.usesFileUrls) {
          return this.toFileUrl(node.source.input.from);
        } else {
          return this.toUrl(this.path(node.source.input.from));
        }
      }
      toBase64(str) {
        if (Buffer) {
          return Buffer.from(str).toString("base64");
        } else {
          return window.btoa(unescape(encodeURIComponent(str)));
        }
      }
      toFileUrl(path) {
        let cached = this.memoizedFileURLs.get(path);
        if (cached) return cached;
        if (pathToFileURL) {
          let fileURL = pathToFileURL(path).toString();
          this.memoizedFileURLs.set(path, fileURL);
          return fileURL;
        } else {
          throw new Error(
            "`map.absolute` option is not available in this PostCSS build"
          );
        }
      }
      toUrl(path) {
        let cached = this.memoizedURLs.get(path);
        if (cached) return cached;
        if (sep === "\\") {
          path = path.replace(/\\/g, "/");
        }
        let url = encodeURI(path).replace(/[#?]/g, encodeURIComponent);
        this.memoizedURLs.set(path, url);
        return url;
      }
    };
    module.exports = MapGenerator;
  }
});

// ../node_modules/postcss/lib/parser.js
var require_parser = __commonJS({
  "../node_modules/postcss/lib/parser.js"(exports, module) {
    "use strict";
    var AtRule = require_at_rule();
    var Comment = require_comment();
    var Declaration = require_declaration();
    var Root = require_root();
    var Rule = require_rule();
    var tokenizer = require_tokenize();
    var SAFE_COMMENT_NEIGHBOR = {
      empty: true,
      space: true
    };
    function findLastWithPosition(tokens) {
      for (let i = tokens.length - 1; i >= 0; i--) {
        let token = tokens[i];
        let pos = token[3] || token[2];
        if (pos) return pos;
      }
    }
    function tokensToString(tokens, from, to) {
      let result = "";
      for (let i = from; i < to; i++) result += tokens[i][1];
      return result;
    }
    var Parser = class {
      constructor(input) {
        this.input = input;
        this.root = new Root();
        this.current = this.root;
        this.spaces = "";
        this.semicolon = false;
        this.createTokenizer();
        this.root.source = { input, start: { column: 1, line: 1, offset: 0 } };
      }
      atrule(token) {
        let node = new AtRule();
        node.name = token[1].slice(1);
        if (node.name === "") {
          this.unnamedAtrule(node, token);
        }
        this.init(node, token[2]);
        let type;
        let prev;
        let shift;
        let last = false;
        let open = false;
        let params = [];
        let brackets = [];
        while (!this.tokenizer.endOfFile()) {
          token = this.tokenizer.nextToken();
          type = token[0];
          if (type === "(" || type === "[") {
            brackets.push(type === "(" ? ")" : "]");
          } else if (type === "{" && brackets.length > 0) {
            brackets.push("}");
          } else if (type === brackets[brackets.length - 1]) {
            brackets.pop();
          }
          if (brackets.length === 0) {
            if (type === ";") {
              node.source.end = this.getPosition(token[2]);
              node.source.end.offset++;
              this.semicolon = true;
              break;
            } else if (type === "{") {
              open = true;
              break;
            } else if (type === "}") {
              if (params.length > 0) {
                shift = params.length - 1;
                prev = params[shift];
                while (prev && prev[0] === "space") {
                  prev = params[--shift];
                }
                if (prev) {
                  node.source.end = this.getPosition(prev[3] || prev[2]);
                  node.source.end.offset++;
                }
              }
              this.end(token);
              break;
            } else {
              params.push(token);
            }
          } else {
            params.push(token);
          }
          if (this.tokenizer.endOfFile()) {
            last = true;
            break;
          }
        }
        node.raws.between = this.spacesAndCommentsFromEnd(params);
        if (params.length) {
          node.raws.afterName = this.spacesAndCommentsFromStart(params);
          this.raw(node, "params", params);
          if (last) {
            token = params[params.length - 1];
            node.source.end = this.getPosition(token[3] || token[2]);
            node.source.end.offset++;
            this.spaces = node.raws.between;
            node.raws.between = "";
          }
        } else {
          node.raws.afterName = "";
          node.params = "";
        }
        if (open) {
          node.nodes = [];
          this.current = node;
        }
      }
      checkMissedSemicolon(tokens) {
        let colon = this.colon(tokens);
        if (colon === false) return;
        let founded = 0;
        let token;
        for (let j = colon - 1; j >= 0; j--) {
          token = tokens[j];
          if (token[0] !== "space") {
            founded += 1;
            if (founded === 2) break;
          }
        }
        throw this.input.error(
          "Missed semicolon",
          token[0] === "word" ? token[3] + 1 : token[2]
        );
      }
      colon(tokens) {
        let brackets = 0;
        let prev, token, type;
        for (let [i, element] of tokens.entries()) {
          token = element;
          type = token[0];
          if (type === "(") {
            brackets += 1;
          }
          if (type === ")") {
            brackets -= 1;
          }
          if (brackets === 0 && type === ":") {
            if (!prev) {
              this.doubleColon(token);
            } else if (prev[0] === "word" && prev[1] === "progid") {
              continue;
            } else {
              return i;
            }
          }
          prev = token;
        }
        return false;
      }
      comment(token) {
        let node = new Comment();
        this.init(node, token[2]);
        node.source.end = this.getPosition(token[3] || token[2]);
        node.source.end.offset++;
        let text = token[1].slice(2, -2);
        if (!text.trim()) {
          node.text = "";
          node.raws.left = text;
          node.raws.right = "";
        } else {
          let match = text.match(/^(\s*)([^]*\S)(\s*)$/);
          node.text = match[2];
          node.raws.left = match[1];
          node.raws.right = match[3];
        }
      }
      createTokenizer() {
        this.tokenizer = tokenizer(this.input);
      }
      decl(tokens, customProperty) {
        let node = new Declaration();
        this.init(node, tokens[0][2]);
        let last = tokens[tokens.length - 1];
        if (last[0] === ";") {
          this.semicolon = true;
          tokens.pop();
        }
        node.source.end = this.getPosition(
          last[3] || last[2] || findLastWithPosition(tokens)
        );
        node.source.end.offset++;
        let start = 0;
        while (tokens[start][0] !== "word") {
          if (start === tokens.length - 1) this.unknownWord([tokens[start]]);
          start++;
        }
        node.raws.before += tokensToString(tokens, 0, start);
        node.source.start = this.getPosition(tokens[start][2]);
        let propStart = start;
        while (start < tokens.length) {
          let type = tokens[start][0];
          if (type === ":" || type === "space" || type === "comment") {
            break;
          }
          start++;
        }
        node.prop = tokensToString(tokens, propStart, start);
        let betweenStart = start;
        let token;
        while (start < tokens.length) {
          token = tokens[start];
          start++;
          if (token[0] === ":") break;
          if (token[0] === "word" && /\w/.test(token[1])) {
            this.unknownWord([token]);
          }
        }
        node.raws.between = tokensToString(tokens, betweenStart, start);
        if (node.prop[0] === "_" || node.prop[0] === "*") {
          node.raws.before += node.prop[0];
          node.prop = node.prop.slice(1);
        }
        let firstSpacesStart = start;
        while (start < tokens.length) {
          let next = tokens[start][0];
          if (next !== "space" && next !== "comment") break;
          start++;
        }
        let firstSpaces = tokens.slice(firstSpacesStart, start);
        tokens = tokens.slice(start);
        this.precheckMissedSemicolon(tokens);
        for (let i = tokens.length - 1; i >= 0; i--) {
          token = tokens[i];
          if (token[1].toLowerCase() === "!important") {
            node.important = true;
            let string = this.stringFrom(tokens, i);
            string = this.spacesFromEnd(tokens) + string;
            if (string !== " !important") node.raws.important = string;
            break;
          } else if (token[1].toLowerCase() === "important") {
            let cache = tokens.slice(0);
            let str = "";
            for (let j = i; j > 0; j--) {
              let type = cache[j][0];
              if (str.trim().startsWith("!") && type !== "space") {
                break;
              }
              str = cache.pop()[1] + str;
            }
            if (str.trim().startsWith("!")) {
              node.important = true;
              node.raws.important = str;
              tokens = cache;
            }
          }
          if (token[0] !== "space" && token[0] !== "comment") {
            break;
          }
        }
        let hasWord = tokens.some((i) => i[0] !== "space" && i[0] !== "comment");
        if (hasWord) {
          node.raws.between += firstSpaces.map((i) => i[1]).join("");
          firstSpaces = [];
        }
        this.raw(node, "value", firstSpaces.concat(tokens), customProperty);
        if (node.value.includes(":") && !customProperty) {
          this.checkMissedSemicolon(tokens);
        }
      }
      doubleColon(token) {
        throw this.input.error(
          "Double colon",
          { offset: token[2] },
          { offset: token[2] + token[1].length }
        );
      }
      emptyRule(token) {
        let node = new Rule();
        this.init(node, token[2]);
        node.selector = "";
        node.raws.between = "";
        this.current = node;
      }
      end(token) {
        if (this.current.nodes && this.current.nodes.length) {
          this.current.raws.semicolon = this.semicolon;
        }
        this.semicolon = false;
        this.current.raws.after = (this.current.raws.after || "") + this.spaces;
        this.spaces = "";
        if (this.current.parent) {
          this.current.source.end = this.getPosition(token[2]);
          this.current.source.end.offset++;
          this.current = this.current.parent;
        } else {
          this.unexpectedClose(token);
        }
      }
      endFile() {
        if (this.current.parent) this.unclosedBlock();
        if (this.current.nodes && this.current.nodes.length) {
          this.current.raws.semicolon = this.semicolon;
        }
        this.current.raws.after = (this.current.raws.after || "") + this.spaces;
        this.root.source.end = this.getPosition(this.tokenizer.position());
      }
      freeSemicolon(token) {
        this.spaces += token[1];
        if (this.current.nodes) {
          let prev = this.current.nodes[this.current.nodes.length - 1];
          if (prev && prev.type === "rule" && !prev.raws.ownSemicolon) {
            prev.raws.ownSemicolon = this.spaces;
            this.spaces = "";
            prev.source.end = this.getPosition(token[2]);
            prev.source.end.offset++;
          }
        }
      }
      // Helpers
      getPosition(offset) {
        let pos = this.input.fromOffset(offset);
        return {
          column: pos.col,
          line: pos.line,
          offset
        };
      }
      init(node, offset) {
        this.current.push(node);
        node.source = {
          input: this.input,
          start: this.getPosition(offset)
        };
        node.raws.before = this.spaces;
        this.spaces = "";
        if (node.type !== "comment") this.semicolon = false;
      }
      other(start) {
        let end = false;
        let type = null;
        let colon = false;
        let bracket = null;
        let brackets = [];
        let customProperty = start[1].startsWith("--");
        let tokens = [];
        let token = start;
        while (token) {
          type = token[0];
          tokens.push(token);
          if (type === "(" || type === "[") {
            if (!bracket) bracket = token;
            brackets.push(type === "(" ? ")" : "]");
          } else if (customProperty && colon && type === "{") {
            if (!bracket) bracket = token;
            brackets.push("}");
          } else if (brackets.length === 0) {
            if (type === ";") {
              if (colon) {
                this.decl(tokens, customProperty);
                return;
              } else {
                break;
              }
            } else if (type === "{") {
              this.rule(tokens);
              return;
            } else if (type === "}") {
              this.tokenizer.back(tokens.pop());
              end = true;
              break;
            } else if (type === ":") {
              colon = true;
            }
          } else if (type === brackets[brackets.length - 1]) {
            brackets.pop();
            if (brackets.length === 0) bracket = null;
          }
          token = this.tokenizer.nextToken();
        }
        if (this.tokenizer.endOfFile()) end = true;
        if (brackets.length > 0) this.unclosedBracket(bracket);
        if (end && colon) {
          if (!customProperty) {
            while (tokens.length) {
              token = tokens[tokens.length - 1][0];
              if (token !== "space" && token !== "comment") break;
              this.tokenizer.back(tokens.pop());
            }
          }
          this.decl(tokens, customProperty);
        } else {
          this.unknownWord(tokens);
        }
      }
      parse() {
        let token;
        while (!this.tokenizer.endOfFile()) {
          token = this.tokenizer.nextToken();
          switch (token[0]) {
            case "space":
              this.spaces += token[1];
              break;
            case ";":
              this.freeSemicolon(token);
              break;
            case "}":
              this.end(token);
              break;
            case "comment":
              this.comment(token);
              break;
            case "at-word":
              this.atrule(token);
              break;
            case "{":
              this.emptyRule(token);
              break;
            default:
              this.other(token);
              break;
          }
        }
        this.endFile();
      }
      precheckMissedSemicolon() {
      }
      raw(node, prop, tokens, customProperty) {
        let token, type;
        let length = tokens.length;
        let value = "";
        let last = "";
        let clean = true;
        let next, prev;
        for (let i = 0; i < length; i += 1) {
          token = tokens[i];
          type = token[0];
          if (type === "space" && i === length - 1 && !customProperty) {
            clean = false;
          } else if (type === "comment") {
            prev = tokens[i - 1] ? tokens[i - 1][0] : "empty";
            next = tokens[i + 1] ? tokens[i + 1][0] : "empty";
            if (!SAFE_COMMENT_NEIGHBOR[prev] && !SAFE_COMMENT_NEIGHBOR[next]) {
              if (last === ",") {
                clean = false;
              } else {
                value += token[1];
                last = token[1].slice(-1);
              }
            } else {
              clean = false;
            }
          } else {
            value += token[1];
            last = token[1].slice(-1);
          }
        }
        if (!clean) {
          let raw = tokens.reduce((all, i) => all + i[1], "");
          node.raws[prop] = { raw, value };
        }
        node[prop] = value;
      }
      rule(tokens) {
        tokens.pop();
        let node = new Rule();
        this.init(node, tokens[0][2]);
        node.raws.between = this.spacesAndCommentsFromEnd(tokens);
        this.raw(node, "selector", tokens);
        this.current = node;
      }
      spacesAndCommentsFromEnd(tokens) {
        let lastTokenType;
        let spaces = "";
        while (tokens.length) {
          lastTokenType = tokens[tokens.length - 1][0];
          if (lastTokenType !== "space" && lastTokenType !== "comment") break;
          spaces = tokens.pop()[1] + spaces;
        }
        return spaces;
      }
      // Errors
      spacesAndCommentsFromStart(tokens) {
        let next;
        let spaces = "";
        while (tokens.length) {
          next = tokens[0][0];
          if (next !== "space" && next !== "comment") break;
          spaces += tokens.shift()[1];
        }
        return spaces;
      }
      spacesFromEnd(tokens) {
        let lastTokenType;
        let spaces = "";
        while (tokens.length) {
          lastTokenType = tokens[tokens.length - 1][0];
          if (lastTokenType !== "space") break;
          spaces = tokens.pop()[1] + spaces;
        }
        return spaces;
      }
      stringFrom(tokens, from) {
        let result = "";
        for (let i = from; i < tokens.length; i++) {
          result += tokens[i][1];
        }
        tokens.splice(from, tokens.length - from);
        return result;
      }
      unclosedBlock() {
        let pos = this.current.source.start;
        throw this.input.error("Unclosed block", pos.line, pos.column);
      }
      unclosedBracket(bracket) {
        throw this.input.error(
          "Unclosed bracket",
          { offset: bracket[2] },
          { offset: bracket[2] + 1 }
        );
      }
      unexpectedClose(token) {
        throw this.input.error(
          "Unexpected }",
          { offset: token[2] },
          { offset: token[2] + 1 }
        );
      }
      unknownWord(tokens) {
        throw this.input.error(
          "Unknown word " + tokens[0][1],
          { offset: tokens[0][2] },
          { offset: tokens[0][2] + tokens[0][1].length }
        );
      }
      unnamedAtrule(node, token) {
        throw this.input.error(
          "At-rule without name",
          { offset: token[2] },
          { offset: token[2] + token[1].length }
        );
      }
    };
    module.exports = Parser;
  }
});

// ../node_modules/postcss/lib/parse.js
var require_parse = __commonJS({
  "../node_modules/postcss/lib/parse.js"(exports, module) {
    "use strict";
    var Container = require_container();
    var Input = require_input();
    var Parser = require_parser();
    function parse(css, opts) {
      let input = new Input(css, opts);
      let parser = new Parser(input);
      try {
        parser.parse();
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          if (e.name === "CssSyntaxError" && opts && opts.from) {
            if (/\.scss$/i.test(opts.from)) {
              e.message += "\nYou tried to parse SCSS with the standard CSS parser; try again with the postcss-scss parser";
            } else if (/\.sass/i.test(opts.from)) {
              e.message += "\nYou tried to parse Sass with the standard CSS parser; try again with the postcss-sass parser";
            } else if (/\.less$/i.test(opts.from)) {
              e.message += "\nYou tried to parse Less with the standard CSS parser; try again with the postcss-less parser";
            }
          }
        }
        throw e;
      }
      return parser.root;
    }
    module.exports = parse;
    parse.default = parse;
    Container.registerParse(parse);
  }
});

// ../node_modules/postcss/lib/warning.js
var require_warning = __commonJS({
  "../node_modules/postcss/lib/warning.js"(exports, module) {
    "use strict";
    var Container = require_container();
    var { my } = require_symbols();
    var Warning = class {
      constructor(text, opts = {}) {
        this.type = "warning";
        this.text = text;
        if (opts.node && opts.node.source) {
          if (!opts.node[my]) {
            Container.rebuild(opts.node);
          }
          let range = opts.node.rangeBy(opts);
          this.line = range.start.line;
          this.column = range.start.column;
          this.endLine = range.end.line;
          this.endColumn = range.end.column;
        }
        for (let opt in opts) this[opt] = opts[opt];
      }
      toString() {
        if (this.node) {
          return this.node.error(this.text, {
            index: this.index,
            plugin: this.plugin,
            word: this.word
          }).message;
        }
        if (this.plugin) {
          return this.plugin + ": " + this.text;
        }
        return this.text;
      }
    };
    module.exports = Warning;
    Warning.default = Warning;
  }
});

// ../node_modules/postcss/lib/result.js
var require_result = __commonJS({
  "../node_modules/postcss/lib/result.js"(exports, module) {
    "use strict";
    var Warning = require_warning();
    var Result = class {
      get content() {
        return this.css;
      }
      constructor(processor, root, opts) {
        this.processor = processor;
        this.messages = [];
        this.root = root;
        this.opts = opts;
        this.css = "";
        this.map = void 0;
      }
      toString() {
        return this.css;
      }
      warn(text, opts = {}) {
        if (!opts.plugin) {
          if (this.lastPlugin && this.lastPlugin.postcssPlugin) {
            opts.plugin = this.lastPlugin.postcssPlugin;
          }
        }
        let warning = new Warning(text, opts);
        this.messages.push(warning);
        return warning;
      }
      warnings() {
        return this.messages.filter((i) => i.type === "warning");
      }
    };
    module.exports = Result;
    Result.default = Result;
  }
});

// ../node_modules/postcss/lib/warn-once.js
var require_warn_once = __commonJS({
  "../node_modules/postcss/lib/warn-once.js"(exports, module) {
    "use strict";
    var printed = {};
    module.exports = function warnOnce(message) {
      if (printed[message]) return;
      printed[message] = true;
      if (typeof console !== "undefined" && console.warn) {
        console.warn(message);
      }
    };
  }
});

// ../node_modules/postcss/lib/lazy-result.js
var require_lazy_result = __commonJS({
  "../node_modules/postcss/lib/lazy-result.js"(exports, module) {
    "use strict";
    var Container = require_container();
    var Document = require_document();
    var MapGenerator = require_map_generator();
    var parse = require_parse();
    var Result = require_result();
    var Root = require_root();
    var stringify = require_stringify();
    var { isClean, my } = require_symbols();
    var warnOnce = require_warn_once();
    var TYPE_TO_CLASS_NAME = {
      atrule: "AtRule",
      comment: "Comment",
      decl: "Declaration",
      document: "Document",
      root: "Root",
      rule: "Rule"
    };
    var PLUGIN_PROPS = {
      AtRule: true,
      AtRuleExit: true,
      Comment: true,
      CommentExit: true,
      Declaration: true,
      DeclarationExit: true,
      Document: true,
      DocumentExit: true,
      Once: true,
      OnceExit: true,
      postcssPlugin: true,
      prepare: true,
      Root: true,
      RootExit: true,
      Rule: true,
      RuleExit: true
    };
    var NOT_VISITORS = {
      Once: true,
      postcssPlugin: true,
      prepare: true
    };
    var CHILDREN = 0;
    function isPromise(obj) {
      return typeof obj === "object" && typeof obj.then === "function";
    }
    function getEvents(node) {
      let key = false;
      let type = TYPE_TO_CLASS_NAME[node.type];
      if (node.type === "decl") {
        key = node.prop.toLowerCase();
      } else if (node.type === "atrule") {
        key = node.name.toLowerCase();
      }
      if (key && node.append) {
        return [
          type,
          type + "-" + key,
          CHILDREN,
          type + "Exit",
          type + "Exit-" + key
        ];
      } else if (key) {
        return [type, type + "-" + key, type + "Exit", type + "Exit-" + key];
      } else if (node.append) {
        return [type, CHILDREN, type + "Exit"];
      } else {
        return [type, type + "Exit"];
      }
    }
    function toStack(node) {
      let events;
      if (node.type === "document") {
        events = ["Document", CHILDREN, "DocumentExit"];
      } else if (node.type === "root") {
        events = ["Root", CHILDREN, "RootExit"];
      } else {
        events = getEvents(node);
      }
      return {
        eventIndex: 0,
        events,
        iterator: 0,
        node,
        visitorIndex: 0,
        visitors: []
      };
    }
    function cleanMarks(node) {
      let stack = [node];
      while (stack.length > 0) {
        let next = stack.pop();
        next[isClean] = false;
        if (next.nodes) {
          for (let i of next.nodes) stack.push(i);
        }
      }
      return node;
    }
    var postcss = {};
    var LazyResult = class _LazyResult {
      get content() {
        return this.stringify().content;
      }
      get css() {
        return this.stringify().css;
      }
      get map() {
        return this.stringify().map;
      }
      get messages() {
        return this.sync().messages;
      }
      get opts() {
        return this.result.opts;
      }
      get processor() {
        return this.result.processor;
      }
      get root() {
        return this.sync().root;
      }
      get [Symbol.toStringTag]() {
        return "LazyResult";
      }
      constructor(processor, css, opts) {
        this.stringified = false;
        this.processed = false;
        let root;
        if (typeof css === "object" && css !== null && (css.type === "root" || css.type === "document")) {
          root = cleanMarks(css);
        } else if (css instanceof _LazyResult || css instanceof Result) {
          root = cleanMarks(css.root);
          if (css.map) {
            if (typeof opts.map === "undefined") opts.map = {};
            if (!opts.map.inline) opts.map.inline = false;
            opts.map.prev = css.map;
          }
        } else {
          let parser = parse;
          if (opts.syntax) parser = opts.syntax.parse;
          if (opts.parser) parser = opts.parser;
          if (parser.parse) parser = parser.parse;
          try {
            root = parser(css, opts);
          } catch (error) {
            this.processed = true;
            this.error = error;
          }
          if (root && !root[my]) {
            Container.rebuild(root);
          }
        }
        this.result = new Result(processor, root, opts);
        this.helpers = { ...postcss, postcss, result: this.result };
        this.plugins = this.processor.plugins.map((plugin) => {
          if (typeof plugin === "object" && plugin.prepare) {
            return { ...plugin, ...plugin.prepare(this.result) };
          } else {
            return plugin;
          }
        });
      }
      async() {
        if (this.error) return Promise.reject(this.error);
        if (this.processed) return Promise.resolve(this.result);
        if (!this.processing) {
          this.processing = this.runAsync();
        }
        return this.processing;
      }
      catch(onRejected) {
        return this.async().catch(onRejected);
      }
      finally(onFinally) {
        return this.async().then(onFinally, onFinally);
      }
      getAsyncError() {
        throw new Error("Use process(css).then(cb) to work with async plugins");
      }
      handleError(error, node) {
        let plugin = this.result.lastPlugin;
        try {
          if (node) node.addToError(error);
          this.error = error;
          if (error.name === "CssSyntaxError" && !error.plugin) {
            error.plugin = plugin.postcssPlugin;
            error.setMessage();
          } else if (plugin.postcssVersion) {
            if (process.env.NODE_ENV !== "production") {
              let pluginName = plugin.postcssPlugin;
              let pluginVer = plugin.postcssVersion;
              let runtimeVer = this.result.processor.version;
              let a = pluginVer.split(".");
              let b = runtimeVer.split(".");
              if (a[0] !== b[0] || parseInt(a[1]) > parseInt(b[1])) {
                console.error(
                  "Unknown error from PostCSS plugin. Your current PostCSS version is " + runtimeVer + ", but " + pluginName + " uses " + pluginVer + ". Perhaps this is the source of the error below."
                );
              }
            }
          }
        } catch (err) {
          if (console && console.error) console.error(err);
        }
        return error;
      }
      prepareVisitors() {
        this.listeners = {};
        let add = (plugin, type, cb) => {
          if (!this.listeners[type]) this.listeners[type] = [];
          this.listeners[type].push([plugin, cb]);
        };
        for (let plugin of this.plugins) {
          if (typeof plugin === "object") {
            for (let event in plugin) {
              if (!PLUGIN_PROPS[event] && /^[A-Z]/.test(event)) {
                throw new Error(
                  `Unknown event ${event} in ${plugin.postcssPlugin}. Try to update PostCSS (${this.processor.version} now).`
                );
              }
              if (!NOT_VISITORS[event]) {
                if (typeof plugin[event] === "object") {
                  for (let filter in plugin[event]) {
                    if (filter === "*") {
                      add(plugin, event, plugin[event][filter]);
                    } else {
                      add(
                        plugin,
                        event + "-" + filter.toLowerCase(),
                        plugin[event][filter]
                      );
                    }
                  }
                } else if (typeof plugin[event] === "function") {
                  add(plugin, event, plugin[event]);
                }
              }
            }
          }
        }
        this.hasListener = Object.keys(this.listeners).length > 0;
      }
      async runAsync() {
        this.plugin = 0;
        for (let i = 0; i < this.plugins.length; i++) {
          let plugin = this.plugins[i];
          let promise = this.runOnRoot(plugin);
          if (isPromise(promise)) {
            try {
              await promise;
            } catch (error) {
              throw this.handleError(error);
            }
          }
        }
        this.prepareVisitors();
        if (this.hasListener) {
          let root = this.result.root;
          while (!root[isClean]) {
            root[isClean] = true;
            let stack = [toStack(root)];
            while (stack.length > 0) {
              let promise = this.visitTick(stack);
              if (isPromise(promise)) {
                try {
                  await promise;
                } catch (e) {
                  let node = stack[stack.length - 1].node;
                  throw this.handleError(e, node);
                }
              }
            }
          }
          if (this.listeners.OnceExit) {
            for (let [plugin, visitor] of this.listeners.OnceExit) {
              this.result.lastPlugin = plugin;
              try {
                if (root.type === "document") {
                  let roots = root.nodes.map(
                    (subRoot) => visitor(subRoot, this.helpers)
                  );
                  await Promise.all(roots);
                } else {
                  await visitor(root, this.helpers);
                }
              } catch (e) {
                throw this.handleError(e);
              }
            }
          }
        }
        this.processed = true;
        return this.stringify();
      }
      runOnRoot(plugin) {
        this.result.lastPlugin = plugin;
        try {
          if (typeof plugin === "object" && plugin.Once) {
            if (this.result.root.type === "document") {
              let roots = this.result.root.nodes.map(
                (root) => plugin.Once(root, this.helpers)
              );
              if (isPromise(roots[0])) {
                return Promise.all(roots);
              }
              return roots;
            }
            return plugin.Once(this.result.root, this.helpers);
          } else if (typeof plugin === "function") {
            return plugin(this.result.root, this.result);
          }
        } catch (error) {
          throw this.handleError(error);
        }
      }
      stringify() {
        if (this.error) throw this.error;
        if (this.stringified) return this.result;
        this.stringified = true;
        this.sync();
        let opts = this.result.opts;
        let str = stringify;
        if (opts.syntax) str = opts.syntax.stringify;
        if (opts.stringifier) str = opts.stringifier;
        if (str.stringify) str = str.stringify;
        let rootSource = this.result.root.source;
        if (opts.map === void 0 && !(rootSource && rootSource.input && rootSource.input.map)) {
          let result = "";
          str(this.result.root, (i) => {
            result += i;
          });
          this.result.css = result;
          return this.result;
        }
        let map = new MapGenerator(str, this.result.root, this.result.opts);
        let data = map.generate();
        this.result.css = data[0];
        this.result.map = data[1];
        return this.result;
      }
      sync() {
        if (this.error) throw this.error;
        if (this.processed) return this.result;
        this.processed = true;
        if (this.processing) {
          throw this.getAsyncError();
        }
        for (let plugin of this.plugins) {
          let promise = this.runOnRoot(plugin);
          if (isPromise(promise)) {
            throw this.getAsyncError();
          }
        }
        this.prepareVisitors();
        if (this.hasListener) {
          let root = this.result.root;
          while (!root[isClean]) {
            root[isClean] = true;
            this.walkSync(root);
          }
          if (this.listeners.OnceExit) {
            if (root.type === "document") {
              for (let subRoot of root.nodes) {
                this.visitSync(this.listeners.OnceExit, subRoot);
              }
            } else {
              this.visitSync(this.listeners.OnceExit, root);
            }
          }
        }
        return this.result;
      }
      then(onFulfilled, onRejected) {
        if (process.env.NODE_ENV !== "production") {
          if (!("from" in this.opts)) {
            warnOnce(
              "Without `from` option PostCSS could generate wrong source map and will not find Browserslist config. Set it to CSS file path or to `undefined` to prevent this warning."
            );
          }
        }
        return this.async().then(onFulfilled, onRejected);
      }
      toString() {
        return this.css;
      }
      visitSync(visitors, node) {
        for (let [plugin, visitor] of visitors) {
          this.result.lastPlugin = plugin;
          let promise;
          try {
            promise = visitor(node, this.helpers);
          } catch (e) {
            throw this.handleError(e, node.proxyOf);
          }
          if (node.type !== "root" && node.type !== "document" && !node.parent) {
            return true;
          }
          if (isPromise(promise)) {
            throw this.getAsyncError();
          }
        }
      }
      visitTick(stack) {
        let visit = stack[stack.length - 1];
        let { node, visitors } = visit;
        if (node.type !== "root" && node.type !== "document" && !node.parent) {
          stack.pop();
          return;
        }
        if (visitors.length > 0 && visit.visitorIndex < visitors.length) {
          let [plugin, visitor] = visitors[visit.visitorIndex];
          visit.visitorIndex += 1;
          if (visit.visitorIndex === visitors.length) {
            visit.visitors = [];
            visit.visitorIndex = 0;
          }
          this.result.lastPlugin = plugin;
          try {
            return visitor(node.toProxy(), this.helpers);
          } catch (e) {
            throw this.handleError(e, node);
          }
        }
        if (visit.iterator !== 0) {
          let iterator = visit.iterator;
          if (visit.descending) {
            visit.descending = false;
            node.indexes[iterator] += 1;
          }
          let child;
          while (child = node.nodes[node.indexes[iterator]]) {
            if (!child[isClean]) {
              child[isClean] = true;
              visit.descending = true;
              stack.push(toStack(child));
              return;
            }
            node.indexes[iterator] += 1;
          }
          visit.iterator = 0;
          delete node.indexes[iterator];
        }
        let events = visit.events;
        while (visit.eventIndex < events.length) {
          let event = events[visit.eventIndex];
          visit.eventIndex += 1;
          if (event === CHILDREN) {
            if (node.nodes && node.nodes.length) {
              node[isClean] = true;
              visit.iterator = node.getIterator();
            }
            return;
          } else if (this.listeners[event]) {
            visit.visitors = this.listeners[event];
            return;
          }
        }
        stack.pop();
      }
      walkSync(node) {
        node[isClean] = true;
        let stack = [{ eventIndex: 0, events: getEvents(node), iterator: 0, node }];
        while (stack.length > 0) {
          let visit = stack[stack.length - 1];
          let visitNode = visit.node;
          if (visit.iterator !== 0) {
            let iterator = visit.iterator;
            if (visit.descending) {
              visit.descending = false;
              visitNode.indexes[iterator] += 1;
            }
            let child;
            let descended = false;
            while (child = visitNode.nodes[visitNode.indexes[iterator]]) {
              if (!child[isClean]) {
                child[isClean] = true;
                visit.descending = true;
                stack.push({
                  eventIndex: 0,
                  events: getEvents(child),
                  iterator: 0,
                  node: child
                });
                descended = true;
                break;
              }
              visitNode.indexes[iterator] += 1;
            }
            if (descended) continue;
            visit.iterator = 0;
            delete visitNode.indexes[iterator];
          }
          if (visit.eventIndex < visit.events.length) {
            let event = visit.events[visit.eventIndex];
            visit.eventIndex += 1;
            if (event === CHILDREN) {
              if (visitNode.nodes && visitNode.nodes.length) {
                visit.iterator = visitNode.getIterator();
              }
            } else {
              let visitors = this.listeners[event];
              if (visitors) {
                if (this.visitSync(visitors, visitNode.toProxy())) stack.pop();
              }
            }
            continue;
          }
          stack.pop();
        }
      }
      warnings() {
        return this.sync().warnings();
      }
    };
    LazyResult.registerPostcss = (dependant) => {
      postcss = dependant;
    };
    module.exports = LazyResult;
    LazyResult.default = LazyResult;
    Root.registerLazyResult(LazyResult);
    Document.registerLazyResult(LazyResult);
  }
});

// ../node_modules/postcss/lib/no-work-result.js
var require_no_work_result = __commonJS({
  "../node_modules/postcss/lib/no-work-result.js"(exports, module) {
    "use strict";
    var MapGenerator = require_map_generator();
    var parse = require_parse();
    var Result = require_result();
    var stringify = require_stringify();
    var warnOnce = require_warn_once();
    var NoWorkResult = class {
      get content() {
        return this.result.css;
      }
      get css() {
        return this.result.css;
      }
      get map() {
        return this.result.map;
      }
      get messages() {
        return [];
      }
      get opts() {
        return this.result.opts;
      }
      get processor() {
        return this.result.processor;
      }
      get root() {
        if (this._root) {
          return this._root;
        }
        let root;
        let parser = parse;
        try {
          root = parser(this._css, this._opts);
        } catch (error) {
          this.error = error;
        }
        if (this.error) {
          throw this.error;
        } else {
          this._root = root;
          return root;
        }
      }
      get [Symbol.toStringTag]() {
        return "NoWorkResult";
      }
      constructor(processor, css, opts) {
        css = css.toString();
        this.stringified = false;
        this._processor = processor;
        this._css = css;
        this._opts = opts;
        this._map = void 0;
        let str = stringify;
        this.result = new Result(this._processor, void 0, this._opts);
        this.result.css = css;
        let self2 = this;
        Object.defineProperty(this.result, "root", {
          get() {
            return self2.root;
          }
        });
        let map = new MapGenerator(str, void 0, this._opts, css);
        if (map.isMap()) {
          let [generatedCSS, generatedMap] = map.generate();
          if (generatedCSS) {
            this.result.css = generatedCSS;
          }
          if (generatedMap) {
            this.result.map = generatedMap;
          }
        } else {
          map.clearAnnotation();
          this.result.css = map.css;
        }
      }
      async() {
        if (this.error) return Promise.reject(this.error);
        return Promise.resolve(this.result);
      }
      catch(onRejected) {
        return this.async().catch(onRejected);
      }
      finally(onFinally) {
        return this.async().then(onFinally, onFinally);
      }
      sync() {
        if (this.error) throw this.error;
        return this.result;
      }
      then(onFulfilled, onRejected) {
        if (process.env.NODE_ENV !== "production") {
          if (!("from" in this._opts)) {
            warnOnce(
              "Without `from` option PostCSS could generate wrong source map and will not find Browserslist config. Set it to CSS file path or to `undefined` to prevent this warning."
            );
          }
        }
        return this.async().then(onFulfilled, onRejected);
      }
      toString() {
        return this._css;
      }
      warnings() {
        return [];
      }
    };
    module.exports = NoWorkResult;
    NoWorkResult.default = NoWorkResult;
  }
});

// ../node_modules/postcss/lib/processor.js
var require_processor = __commonJS({
  "../node_modules/postcss/lib/processor.js"(exports, module) {
    "use strict";
    var Document = require_document();
    var LazyResult = require_lazy_result();
    var NoWorkResult = require_no_work_result();
    var Root = require_root();
    var Processor = class {
      constructor(plugins = []) {
        this.version = "8.5.31";
        this.plugins = this.normalize(plugins);
      }
      normalize(plugins) {
        let normalized = [];
        for (let i of plugins) {
          if (i.postcss === true) {
            i = i();
          } else if (i.postcss) {
            i = i.postcss;
          }
          if (typeof i === "object" && Array.isArray(i.plugins)) {
            normalized = normalized.concat(i.plugins);
          } else if (typeof i === "object" && i.postcssPlugin) {
            normalized.push(i);
          } else if (typeof i === "function") {
            normalized.push(i);
          } else if (typeof i === "object" && (i.parse || i.stringify)) {
            if (process.env.NODE_ENV !== "production") {
              throw new Error(
                "PostCSS syntaxes cannot be used as plugins. Instead, please use one of the syntax/parser/stringifier options as outlined in your PostCSS runner documentation."
              );
            }
          } else {
            throw new Error(i + " is not a PostCSS plugin");
          }
        }
        return normalized;
      }
      process(css, opts = {}) {
        if (!this.plugins.length && !opts.parser && !opts.stringifier && !opts.syntax) {
          return new NoWorkResult(this, css, opts);
        } else {
          return new LazyResult(this, css, opts);
        }
      }
      use(plugin) {
        this.plugins = this.plugins.concat(this.normalize([plugin]));
        return this;
      }
    };
    module.exports = Processor;
    Processor.default = Processor;
    Root.registerProcessor(Processor);
    Document.registerProcessor(Processor);
  }
});

// ../node_modules/postcss/lib/postcss.js
var require_postcss = __commonJS({
  "../node_modules/postcss/lib/postcss.js"(exports, module) {
    "use strict";
    var AtRule = require_at_rule();
    var Comment = require_comment();
    var Container = require_container();
    var CssSyntaxError = require_css_syntax_error();
    var Declaration = require_declaration();
    var Document = require_document();
    var fromJSON = require_fromJSON();
    var Input = require_input();
    var LazyResult = require_lazy_result();
    var list = require_list();
    var Node = require_node();
    var parse = require_parse();
    var Processor = require_processor();
    var Result = require_result();
    var Root = require_root();
    var Rule = require_rule();
    var stringify = require_stringify();
    var Warning = require_warning();
    function postcss(...plugins) {
      if (plugins.length === 1 && Array.isArray(plugins[0])) {
        plugins = plugins[0];
      }
      return new Processor(plugins);
    }
    postcss.plugin = function plugin(name, initializer) {
      let warningPrinted = false;
      function creator(...args) {
        if (console && console.warn && !warningPrinted) {
          warningPrinted = true;
          console.warn(
            name + ": postcss.plugin was deprecated. Migration guide:\nhttps://evilmartians.com/chronicles/postcss-8-plugin-migration"
          );
          if (process.env.LANG && process.env.LANG.startsWith("zh")) {
            console.warn(
              name + ": \u91CC\u9762 postcss.plugin \u88AB\u5F03\u7528. \u8FC1\u79FB\u6307\u5357:\nhttps://www.w3ctech.com/topic/2226"
            );
          }
        }
        let transformer = initializer(...args);
        transformer.postcssPlugin = name;
        transformer.postcssVersion = new Processor().version;
        return transformer;
      }
      let cache;
      Object.defineProperty(creator, "postcss", {
        get() {
          if (!cache) cache = creator();
          return cache;
        }
      });
      creator.process = function(css, processOpts, pluginOpts) {
        return postcss([creator(pluginOpts)]).process(css, processOpts);
      };
      return creator;
    };
    postcss.stringify = stringify;
    postcss.parse = parse;
    postcss.fromJSON = fromJSON;
    postcss.list = list;
    postcss.comment = (defaults) => new Comment(defaults);
    postcss.atRule = (defaults) => new AtRule(defaults);
    postcss.decl = (defaults) => new Declaration(defaults);
    postcss.rule = (defaults) => new Rule(defaults);
    postcss.root = (defaults) => new Root(defaults);
    postcss.document = (defaults) => new Document(defaults);
    postcss.CssSyntaxError = CssSyntaxError;
    postcss.Declaration = Declaration;
    postcss.Container = Container;
    postcss.Processor = Processor;
    postcss.Document = Document;
    postcss.Comment = Comment;
    postcss.Warning = Warning;
    postcss.AtRule = AtRule;
    postcss.Result = Result;
    postcss.Input = Input;
    postcss.Rule = Rule;
    postcss.Root = Root;
    postcss.Node = Node;
    LazyResult.registerPostcss(postcss);
    module.exports = postcss;
    postcss.default = postcss;
  }
});

// ../node_modules/postcss-modules/build/unquote.js
var require_unquote = __commonJS({
  "../node_modules/postcss-modules/build/unquote.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = unquote;
    var reg = /['"]/;
    function unquote(str) {
      if (!str) {
        return "";
      }
      if (reg.test(str.charAt(0))) {
        str = str.substr(1);
      }
      if (reg.test(str.charAt(str.length - 1))) {
        str = str.substr(0, str.length - 1);
      }
      return str;
    }
  }
});

// ../node_modules/icss-utils/src/replaceValueSymbols.js
var require_replaceValueSymbols = __commonJS({
  "../node_modules/icss-utils/src/replaceValueSymbols.js"(exports, module) {
    var matchValueName = /[$]?[\w-]+/g;
    var replaceValueSymbols = (value, replacements) => {
      let matches;
      while (matches = matchValueName.exec(value)) {
        const replacement = replacements[matches[0]];
        if (replacement) {
          value = value.slice(0, matches.index) + replacement + value.slice(matchValueName.lastIndex);
          matchValueName.lastIndex -= matches[0].length - replacement.length;
        }
      }
      return value;
    };
    module.exports = replaceValueSymbols;
  }
});

// ../node_modules/icss-utils/src/replaceSymbols.js
var require_replaceSymbols = __commonJS({
  "../node_modules/icss-utils/src/replaceSymbols.js"(exports, module) {
    var replaceValueSymbols = require_replaceValueSymbols();
    var replaceSymbols = (css, replacements) => {
      css.walk((node) => {
        if (node.type === "decl" && node.value) {
          node.value = replaceValueSymbols(node.value.toString(), replacements);
        } else if (node.type === "rule" && node.selector) {
          node.selector = replaceValueSymbols(
            node.selector.toString(),
            replacements
          );
        } else if (node.type === "atrule" && node.params) {
          node.params = replaceValueSymbols(node.params.toString(), replacements);
        }
      });
    };
    module.exports = replaceSymbols;
  }
});

// ../node_modules/icss-utils/src/extractICSS.js
var require_extractICSS = __commonJS({
  "../node_modules/icss-utils/src/extractICSS.js"(exports, module) {
    var importPattern = /^:import\(("[^"]*"|'[^']*'|[^"']+)\)$/;
    var balancedQuotes = /^("[^"]*"|'[^']*'|[^"']+)$/;
    var getDeclsObject = (rule) => {
      const object = {};
      rule.walkDecls((decl) => {
        const before = decl.raws.before ? decl.raws.before.trim() : "";
        object[before + decl.prop] = decl.value;
      });
      return object;
    };
    var extractICSS = (css, removeRules = true, mode = "auto") => {
      const icssImports = {};
      const icssExports = {};
      function addImports(node, path) {
        const unquoted = path.replace(/'|"/g, "");
        icssImports[unquoted] = Object.assign(
          icssImports[unquoted] || {},
          getDeclsObject(node)
        );
        if (removeRules) {
          node.remove();
        }
      }
      function addExports(node) {
        Object.assign(icssExports, getDeclsObject(node));
        if (removeRules) {
          node.remove();
        }
      }
      css.each((node) => {
        if (node.type === "rule" && mode !== "at-rule") {
          if (node.selector.slice(0, 7) === ":import") {
            const matches = importPattern.exec(node.selector);
            if (matches) {
              addImports(node, matches[1]);
            }
          }
          if (node.selector === ":export") {
            addExports(node);
          }
        }
        if (node.type === "atrule" && mode !== "rule") {
          if (node.name === "icss-import") {
            const matches = balancedQuotes.exec(node.params);
            if (matches) {
              addImports(node, matches[1]);
            }
          }
          if (node.name === "icss-export") {
            addExports(node);
          }
        }
      });
      return { icssImports, icssExports };
    };
    module.exports = extractICSS;
  }
});

// ../node_modules/icss-utils/src/createICSSRules.js
var require_createICSSRules = __commonJS({
  "../node_modules/icss-utils/src/createICSSRules.js"(exports, module) {
    var createImports = (imports, postcss, mode = "rule") => {
      return Object.keys(imports).map((path) => {
        const aliases = imports[path];
        const declarations = Object.keys(aliases).map(
          (key) => postcss.decl({
            prop: key,
            value: aliases[key],
            raws: { before: "\n  " }
          })
        );
        const hasDeclarations = declarations.length > 0;
        const rule = mode === "rule" ? postcss.rule({
          selector: `:import('${path}')`,
          raws: { after: hasDeclarations ? "\n" : "" }
        }) : postcss.atRule({
          name: "icss-import",
          params: `'${path}'`,
          raws: { after: hasDeclarations ? "\n" : "" }
        });
        if (hasDeclarations) {
          rule.append(declarations);
        }
        return rule;
      });
    };
    var createExports = (exports2, postcss, mode = "rule") => {
      const declarations = Object.keys(exports2).map(
        (key) => postcss.decl({
          prop: key,
          value: exports2[key],
          raws: { before: "\n  " }
        })
      );
      if (declarations.length === 0) {
        return [];
      }
      const rule = mode === "rule" ? postcss.rule({
        selector: `:export`,
        raws: { after: "\n" }
      }) : postcss.atRule({
        name: "icss-export",
        raws: { after: "\n" }
      });
      rule.append(declarations);
      return [rule];
    };
    var createICSSRules = (imports, exports2, postcss, mode) => [
      ...createImports(imports, postcss, mode),
      ...createExports(exports2, postcss, mode)
    ];
    module.exports = createICSSRules;
  }
});

// ../node_modules/icss-utils/src/index.js
var require_src = __commonJS({
  "../node_modules/icss-utils/src/index.js"(exports, module) {
    var replaceValueSymbols = require_replaceValueSymbols();
    var replaceSymbols = require_replaceSymbols();
    var extractICSS = require_extractICSS();
    var createICSSRules = require_createICSSRules();
    module.exports = {
      replaceValueSymbols,
      replaceSymbols,
      extractICSS,
      createICSSRules
    };
  }
});

// ../node_modules/postcss-modules/build/Parser.js
var require_Parser = __commonJS({
  "../node_modules/postcss-modules/build/Parser.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    var _icssUtils = require_src();
    var importRegexp = /^:import\((.+)\)$/;
    var Parser = class {
      constructor(pathFetcher, trace) {
        this.pathFetcher = pathFetcher;
        this.plugin = this.plugin.bind(this);
        this.exportTokens = {};
        this.translations = {};
        this.trace = trace;
      }
      plugin() {
        const parser = this;
        return {
          postcssPlugin: "css-modules-parser",
          async OnceExit(css) {
            await Promise.all(parser.fetchAllImports(css));
            parser.linkImportedSymbols(css);
            return parser.extractExports(css);
          }
        };
      }
      fetchAllImports(css) {
        let imports = [];
        css.each((node) => {
          if (node.type == "rule" && node.selector.match(importRegexp)) {
            imports.push(this.fetchImport(node, css.source.input.from, imports.length));
          }
        });
        return imports;
      }
      linkImportedSymbols(css) {
        (0, _icssUtils.replaceSymbols)(css, this.translations);
      }
      extractExports(css) {
        css.each((node) => {
          if (node.type == "rule" && node.selector == ":export") this.handleExport(node);
        });
      }
      handleExport(exportNode) {
        exportNode.each((decl) => {
          if (decl.type == "decl") {
            Object.keys(this.translations).forEach((translation) => {
              decl.value = decl.value.replace(translation, this.translations[translation]);
            });
            this.exportTokens[decl.prop] = decl.value;
          }
        });
        exportNode.remove();
      }
      async fetchImport(importNode, relativeTo, depNr) {
        const file = importNode.selector.match(importRegexp)[1];
        const depTrace = this.trace + String.fromCharCode(depNr);
        const exports2 = await this.pathFetcher(file, relativeTo, depTrace);
        try {
          importNode.each((decl) => {
            if (decl.type == "decl") {
              this.translations[decl.prop] = exports2[decl.value];
            }
          });
          importNode.remove();
        } catch (err) {
          console.log(err);
        }
      }
    };
    exports.default = Parser;
  }
});

// ../node_modules/postcss-modules/build/saveJSON.js
var require_saveJSON = __commonJS({
  "../node_modules/postcss-modules/build/saveJSON.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = saveJSON;
    var _fs = require_fs();
    function saveJSON(cssFile, json) {
      return new Promise((resolve, reject) => {
        const {
          writeFile
        } = (0, _fs.getFileSystem)();
        writeFile(`${cssFile}.json`, JSON.stringify(json), (e) => e ? reject(e) : resolve(json));
      });
    }
  }
});

// ../node_modules/lodash.camelcase/index.js
var require_lodash = __commonJS({
  "../node_modules/lodash.camelcase/index.js"(exports, module) {
    var INFINITY = 1 / 0;
    var symbolTag = "[object Symbol]";
    var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;
    var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;
    var rsAstralRange = "\\ud800-\\udfff";
    var rsComboMarksRange = "\\u0300-\\u036f\\ufe20-\\ufe23";
    var rsComboSymbolsRange = "\\u20d0-\\u20f0";
    var rsDingbatRange = "\\u2700-\\u27bf";
    var rsLowerRange = "a-z\\xdf-\\xf6\\xf8-\\xff";
    var rsMathOpRange = "\\xac\\xb1\\xd7\\xf7";
    var rsNonCharRange = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf";
    var rsPunctuationRange = "\\u2000-\\u206f";
    var rsSpaceRange = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000";
    var rsUpperRange = "A-Z\\xc0-\\xd6\\xd8-\\xde";
    var rsVarRange = "\\ufe0e\\ufe0f";
    var rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;
    var rsApos = "['\u2019]";
    var rsAstral = "[" + rsAstralRange + "]";
    var rsBreak = "[" + rsBreakRange + "]";
    var rsCombo = "[" + rsComboMarksRange + rsComboSymbolsRange + "]";
    var rsDigits = "\\d+";
    var rsDingbat = "[" + rsDingbatRange + "]";
    var rsLower = "[" + rsLowerRange + "]";
    var rsMisc = "[^" + rsAstralRange + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + "]";
    var rsFitz = "\\ud83c[\\udffb-\\udfff]";
    var rsModifier = "(?:" + rsCombo + "|" + rsFitz + ")";
    var rsNonAstral = "[^" + rsAstralRange + "]";
    var rsRegional = "(?:\\ud83c[\\udde6-\\uddff]){2}";
    var rsSurrPair = "[\\ud800-\\udbff][\\udc00-\\udfff]";
    var rsUpper = "[" + rsUpperRange + "]";
    var rsZWJ = "\\u200d";
    var rsLowerMisc = "(?:" + rsLower + "|" + rsMisc + ")";
    var rsUpperMisc = "(?:" + rsUpper + "|" + rsMisc + ")";
    var rsOptLowerContr = "(?:" + rsApos + "(?:d|ll|m|re|s|t|ve))?";
    var rsOptUpperContr = "(?:" + rsApos + "(?:D|LL|M|RE|S|T|VE))?";
    var reOptMod = rsModifier + "?";
    var rsOptVar = "[" + rsVarRange + "]?";
    var rsOptJoin = "(?:" + rsZWJ + "(?:" + [rsNonAstral, rsRegional, rsSurrPair].join("|") + ")" + rsOptVar + reOptMod + ")*";
    var rsSeq = rsOptVar + reOptMod + rsOptJoin;
    var rsEmoji = "(?:" + [rsDingbat, rsRegional, rsSurrPair].join("|") + ")" + rsSeq;
    var rsSymbol = "(?:" + [rsNonAstral + rsCombo + "?", rsCombo, rsRegional, rsSurrPair, rsAstral].join("|") + ")";
    var reApos = RegExp(rsApos, "g");
    var reComboMark = RegExp(rsCombo, "g");
    var reUnicode = RegExp(rsFitz + "(?=" + rsFitz + ")|" + rsSymbol + rsSeq, "g");
    var reUnicodeWord = RegExp([
      rsUpper + "?" + rsLower + "+" + rsOptLowerContr + "(?=" + [rsBreak, rsUpper, "$"].join("|") + ")",
      rsUpperMisc + "+" + rsOptUpperContr + "(?=" + [rsBreak, rsUpper + rsLowerMisc, "$"].join("|") + ")",
      rsUpper + "?" + rsLowerMisc + "+" + rsOptLowerContr,
      rsUpper + "+" + rsOptUpperContr,
      rsDigits,
      rsEmoji
    ].join("|"), "g");
    var reHasUnicode = RegExp("[" + rsZWJ + rsAstralRange + rsComboMarksRange + rsComboSymbolsRange + rsVarRange + "]");
    var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2,}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;
    var deburredLetters = {
      // Latin-1 Supplement block.
      "\xC0": "A",
      "\xC1": "A",
      "\xC2": "A",
      "\xC3": "A",
      "\xC4": "A",
      "\xC5": "A",
      "\xE0": "a",
      "\xE1": "a",
      "\xE2": "a",
      "\xE3": "a",
      "\xE4": "a",
      "\xE5": "a",
      "\xC7": "C",
      "\xE7": "c",
      "\xD0": "D",
      "\xF0": "d",
      "\xC8": "E",
      "\xC9": "E",
      "\xCA": "E",
      "\xCB": "E",
      "\xE8": "e",
      "\xE9": "e",
      "\xEA": "e",
      "\xEB": "e",
      "\xCC": "I",
      "\xCD": "I",
      "\xCE": "I",
      "\xCF": "I",
      "\xEC": "i",
      "\xED": "i",
      "\xEE": "i",
      "\xEF": "i",
      "\xD1": "N",
      "\xF1": "n",
      "\xD2": "O",
      "\xD3": "O",
      "\xD4": "O",
      "\xD5": "O",
      "\xD6": "O",
      "\xD8": "O",
      "\xF2": "o",
      "\xF3": "o",
      "\xF4": "o",
      "\xF5": "o",
      "\xF6": "o",
      "\xF8": "o",
      "\xD9": "U",
      "\xDA": "U",
      "\xDB": "U",
      "\xDC": "U",
      "\xF9": "u",
      "\xFA": "u",
      "\xFB": "u",
      "\xFC": "u",
      "\xDD": "Y",
      "\xFD": "y",
      "\xFF": "y",
      "\xC6": "Ae",
      "\xE6": "ae",
      "\xDE": "Th",
      "\xFE": "th",
      "\xDF": "ss",
      // Latin Extended-A block.
      "\u0100": "A",
      "\u0102": "A",
      "\u0104": "A",
      "\u0101": "a",
      "\u0103": "a",
      "\u0105": "a",
      "\u0106": "C",
      "\u0108": "C",
      "\u010A": "C",
      "\u010C": "C",
      "\u0107": "c",
      "\u0109": "c",
      "\u010B": "c",
      "\u010D": "c",
      "\u010E": "D",
      "\u0110": "D",
      "\u010F": "d",
      "\u0111": "d",
      "\u0112": "E",
      "\u0114": "E",
      "\u0116": "E",
      "\u0118": "E",
      "\u011A": "E",
      "\u0113": "e",
      "\u0115": "e",
      "\u0117": "e",
      "\u0119": "e",
      "\u011B": "e",
      "\u011C": "G",
      "\u011E": "G",
      "\u0120": "G",
      "\u0122": "G",
      "\u011D": "g",
      "\u011F": "g",
      "\u0121": "g",
      "\u0123": "g",
      "\u0124": "H",
      "\u0126": "H",
      "\u0125": "h",
      "\u0127": "h",
      "\u0128": "I",
      "\u012A": "I",
      "\u012C": "I",
      "\u012E": "I",
      "\u0130": "I",
      "\u0129": "i",
      "\u012B": "i",
      "\u012D": "i",
      "\u012F": "i",
      "\u0131": "i",
      "\u0134": "J",
      "\u0135": "j",
      "\u0136": "K",
      "\u0137": "k",
      "\u0138": "k",
      "\u0139": "L",
      "\u013B": "L",
      "\u013D": "L",
      "\u013F": "L",
      "\u0141": "L",
      "\u013A": "l",
      "\u013C": "l",
      "\u013E": "l",
      "\u0140": "l",
      "\u0142": "l",
      "\u0143": "N",
      "\u0145": "N",
      "\u0147": "N",
      "\u014A": "N",
      "\u0144": "n",
      "\u0146": "n",
      "\u0148": "n",
      "\u014B": "n",
      "\u014C": "O",
      "\u014E": "O",
      "\u0150": "O",
      "\u014D": "o",
      "\u014F": "o",
      "\u0151": "o",
      "\u0154": "R",
      "\u0156": "R",
      "\u0158": "R",
      "\u0155": "r",
      "\u0157": "r",
      "\u0159": "r",
      "\u015A": "S",
      "\u015C": "S",
      "\u015E": "S",
      "\u0160": "S",
      "\u015B": "s",
      "\u015D": "s",
      "\u015F": "s",
      "\u0161": "s",
      "\u0162": "T",
      "\u0164": "T",
      "\u0166": "T",
      "\u0163": "t",
      "\u0165": "t",
      "\u0167": "t",
      "\u0168": "U",
      "\u016A": "U",
      "\u016C": "U",
      "\u016E": "U",
      "\u0170": "U",
      "\u0172": "U",
      "\u0169": "u",
      "\u016B": "u",
      "\u016D": "u",
      "\u016F": "u",
      "\u0171": "u",
      "\u0173": "u",
      "\u0174": "W",
      "\u0175": "w",
      "\u0176": "Y",
      "\u0177": "y",
      "\u0178": "Y",
      "\u0179": "Z",
      "\u017B": "Z",
      "\u017D": "Z",
      "\u017A": "z",
      "\u017C": "z",
      "\u017E": "z",
      "\u0132": "IJ",
      "\u0133": "ij",
      "\u0152": "Oe",
      "\u0153": "oe",
      "\u0149": "'n",
      "\u017F": "ss"
    };
    var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
    var freeSelf = typeof self == "object" && self && self.Object === Object && self;
    var root = freeGlobal || freeSelf || Function("return this")();
    function arrayReduce(array, iteratee, accumulator, initAccum) {
      var index = -1, length = array ? array.length : 0;
      if (initAccum && length) {
        accumulator = array[++index];
      }
      while (++index < length) {
        accumulator = iteratee(accumulator, array[index], index, array);
      }
      return accumulator;
    }
    function asciiToArray(string) {
      return string.split("");
    }
    function asciiWords(string) {
      return string.match(reAsciiWord) || [];
    }
    function basePropertyOf(object) {
      return function(key) {
        return object == null ? void 0 : object[key];
      };
    }
    var deburrLetter = basePropertyOf(deburredLetters);
    function hasUnicode(string) {
      return reHasUnicode.test(string);
    }
    function hasUnicodeWord(string) {
      return reHasUnicodeWord.test(string);
    }
    function stringToArray(string) {
      return hasUnicode(string) ? unicodeToArray(string) : asciiToArray(string);
    }
    function unicodeToArray(string) {
      return string.match(reUnicode) || [];
    }
    function unicodeWords(string) {
      return string.match(reUnicodeWord) || [];
    }
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    var Symbol2 = root.Symbol;
    var symbolProto = Symbol2 ? Symbol2.prototype : void 0;
    var symbolToString = symbolProto ? symbolProto.toString : void 0;
    function baseSlice(array, start, end) {
      var index = -1, length = array.length;
      if (start < 0) {
        start = -start > length ? 0 : length + start;
      }
      end = end > length ? length : end;
      if (end < 0) {
        end += length;
      }
      length = start > end ? 0 : end - start >>> 0;
      start >>>= 0;
      var result = Array(length);
      while (++index < length) {
        result[index] = array[index + start];
      }
      return result;
    }
    function baseToString(value) {
      if (typeof value == "string") {
        return value;
      }
      if (isSymbol(value)) {
        return symbolToString ? symbolToString.call(value) : "";
      }
      var result = value + "";
      return result == "0" && 1 / value == -INFINITY ? "-0" : result;
    }
    function castSlice(array, start, end) {
      var length = array.length;
      end = end === void 0 ? length : end;
      return !start && end >= length ? array : baseSlice(array, start, end);
    }
    function createCaseFirst(methodName) {
      return function(string) {
        string = toString(string);
        var strSymbols = hasUnicode(string) ? stringToArray(string) : void 0;
        var chr = strSymbols ? strSymbols[0] : string.charAt(0);
        var trailing = strSymbols ? castSlice(strSymbols, 1).join("") : string.slice(1);
        return chr[methodName]() + trailing;
      };
    }
    function createCompounder(callback) {
      return function(string) {
        return arrayReduce(words(deburr(string).replace(reApos, "")), callback, "");
      };
    }
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
    }
    function toString(value) {
      return value == null ? "" : baseToString(value);
    }
    var camelCase = createCompounder(function(result, word, index) {
      word = word.toLowerCase();
      return result + (index ? capitalize(word) : word);
    });
    function capitalize(string) {
      return upperFirst(toString(string).toLowerCase());
    }
    function deburr(string) {
      string = toString(string);
      return string && string.replace(reLatin, deburrLetter).replace(reComboMark, "");
    }
    var upperFirst = createCaseFirst("toUpperCase");
    function words(string, pattern, guard) {
      string = toString(string);
      pattern = guard ? void 0 : pattern;
      if (pattern === void 0) {
        return hasUnicodeWord(string) ? unicodeWords(string) : asciiWords(string);
      }
      return string.match(pattern) || [];
    }
    module.exports = camelCase;
  }
});

// ../node_modules/postcss-modules/build/localsConvention.js
var require_localsConvention = __commonJS({
  "../node_modules/postcss-modules/build/localsConvention.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.makeLocalsConventionReducer = makeLocalsConventionReducer;
    var _lodash = _interopRequireDefault(require_lodash());
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function dashesCamelCase(string) {
      return string.replace(/-+(\w)/g, (_, firstLetter) => firstLetter.toUpperCase());
    }
    function makeLocalsConventionReducer(localsConvention, inputFile) {
      const isFunc = typeof localsConvention === "function";
      return (tokens, [className, value]) => {
        if (isFunc) {
          const convention = localsConvention(className, value, inputFile);
          tokens[convention] = value;
          return tokens;
        }
        switch (localsConvention) {
          case "camelCase":
            tokens[className] = value;
            tokens[(0, _lodash.default)(className)] = value;
            break;
          case "camelCaseOnly":
            tokens[(0, _lodash.default)(className)] = value;
            break;
          case "dashes":
            tokens[className] = value;
            tokens[dashesCamelCase(className)] = value;
            break;
          case "dashesOnly":
            tokens[dashesCamelCase(className)] = value;
            break;
        }
        return tokens;
      };
    }
  }
});

// ../node_modules/postcss-modules/build/FileSystemLoader.js
var require_FileSystemLoader = __commonJS({
  "../node_modules/postcss-modules/build/FileSystemLoader.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    var _postcss = _interopRequireDefault(require_postcss());
    var _path = _interopRequireDefault(__require("path"));
    var _Parser = _interopRequireDefault(require_Parser());
    var _fs = require_fs();
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var Core = class _Core {
      constructor(plugins) {
        this.plugins = plugins || _Core.defaultPlugins;
      }
      async load(sourceString, sourcePath, trace, pathFetcher) {
        const parser = new _Parser.default(pathFetcher, trace);
        const plugins = this.plugins.concat([parser.plugin()]);
        const result = await (0, _postcss.default)(plugins).process(sourceString, {
          from: sourcePath
        });
        return {
          injectableSource: result.css,
          exportTokens: parser.exportTokens
        };
      }
    };
    var traceKeySorter = (a, b) => {
      if (a.length < b.length) {
        return a < b.substring(0, a.length) ? -1 : 1;
      }
      if (a.length > b.length) {
        return a.substring(0, b.length) <= b ? -1 : 1;
      }
      return a < b ? -1 : 1;
    };
    var FileSystemLoader = class {
      constructor(root, plugins, fileResolve) {
        if (root === "/" && process.platform === "win32") {
          const cwdDrive = process.cwd().slice(0, 3);
          if (!/^[A-Za-z]:\\$/.test(cwdDrive)) {
            throw new Error(`Failed to obtain root from "${process.cwd()}".`);
          }
          root = cwdDrive;
        }
        this.root = root;
        this.fileResolve = fileResolve;
        this.sources = {};
        this.traces = {};
        this.importNr = 0;
        this.core = new Core(plugins);
        this.tokensByFile = {};
        this.fs = (0, _fs.getFileSystem)();
      }
      async fetch(_newPath, relativeTo, _trace) {
        const newPath = _newPath.replace(/^["']|["']$/g, "");
        const trace = _trace || String.fromCharCode(this.importNr++);
        const useFileResolve = typeof this.fileResolve === "function";
        const fileResolvedPath = useFileResolve ? await this.fileResolve(newPath, relativeTo) : await Promise.resolve();
        if (fileResolvedPath && !_path.default.isAbsolute(fileResolvedPath)) {
          throw new Error('The returned path from the "fileResolve" option must be absolute.');
        }
        const relativeDir = _path.default.dirname(relativeTo);
        const rootRelativePath = fileResolvedPath || _path.default.resolve(relativeDir, newPath);
        let fileRelativePath = fileResolvedPath || _path.default.resolve(_path.default.resolve(this.root, relativeDir), newPath);
        if (!useFileResolve && newPath[0] !== "." && !_path.default.isAbsolute(newPath)) {
          try {
            fileRelativePath = __require.resolve(newPath);
          } catch (e) {
          }
        }
        const tokens = this.tokensByFile[fileRelativePath];
        if (tokens) return tokens;
        return new Promise((resolve, reject) => {
          this.fs.readFile(fileRelativePath, "utf-8", async (err, source) => {
            if (err) reject(err);
            const {
              injectableSource,
              exportTokens
            } = await this.core.load(source, rootRelativePath, trace, this.fetch.bind(this));
            this.sources[fileRelativePath] = injectableSource;
            this.traces[trace] = fileRelativePath;
            this.tokensByFile[fileRelativePath] = exportTokens;
            resolve(exportTokens);
          });
        });
      }
      get finalSource() {
        const traces = this.traces;
        const sources = this.sources;
        let written = /* @__PURE__ */ new Set();
        return Object.keys(traces).sort(traceKeySorter).map((key) => {
          const filename = traces[key];
          if (written.has(filename)) {
            return null;
          }
          written.add(filename);
          return sources[filename];
        }).join("");
      }
    };
    exports.default = FileSystemLoader;
  }
});

// ../node_modules/postcss-modules-extract-imports/src/topologicalSort.js
var require_topologicalSort = __commonJS({
  "../node_modules/postcss-modules-extract-imports/src/topologicalSort.js"(exports, module) {
    var PERMANENT_MARKER = 2;
    var TEMPORARY_MARKER = 1;
    function createError(node, graph) {
      const er = new Error("Nondeterministic import's order");
      const related = graph[node];
      const relatedNode = related.find(
        (relatedNode2) => graph[relatedNode2].indexOf(node) > -1
      );
      er.nodes = [node, relatedNode];
      return er;
    }
    function walkGraph(node, graph, state, result, strict) {
      if (state[node] === PERMANENT_MARKER) {
        return;
      }
      if (state[node] === TEMPORARY_MARKER) {
        if (strict) {
          return createError(node, graph);
        }
        return;
      }
      state[node] = TEMPORARY_MARKER;
      const children = graph[node];
      const length = children.length;
      for (let i = 0; i < length; ++i) {
        const error = walkGraph(children[i], graph, state, result, strict);
        if (error instanceof Error) {
          return error;
        }
      }
      state[node] = PERMANENT_MARKER;
      result.push(node);
    }
    function topologicalSort(graph, strict) {
      const result = [];
      const state = {};
      const nodes = Object.keys(graph);
      const length = nodes.length;
      for (let i = 0; i < length; ++i) {
        const er = walkGraph(nodes[i], graph, state, result, strict);
        if (er instanceof Error) {
          return er;
        }
      }
      return result;
    }
    module.exports = topologicalSort;
  }
});

// ../node_modules/postcss-modules-extract-imports/src/index.js
var require_src2 = __commonJS({
  "../node_modules/postcss-modules-extract-imports/src/index.js"(exports, module) {
    var topologicalSort = require_topologicalSort();
    var matchImports = /^(.+?)\s+from\s+(?:"([^"]+)"|'([^']+)'|(global))$/;
    var icssImport = /^:import\((?:"([^"]+)"|'([^']+)')\)/;
    var VISITED_MARKER = 1;
    function addImportToGraph(importId, parentId, graph, visited) {
      const siblingsId = parentId + "_siblings";
      const visitedId = parentId + "_" + importId;
      if (visited[visitedId] !== VISITED_MARKER) {
        if (!Array.isArray(visited[siblingsId])) {
          visited[siblingsId] = [];
        }
        const siblings = visited[siblingsId];
        if (Array.isArray(graph[importId])) {
          graph[importId] = graph[importId].concat(siblings);
        } else {
          graph[importId] = siblings.slice();
        }
        visited[visitedId] = VISITED_MARKER;
        siblings.push(importId);
      }
    }
    module.exports = (options = {}) => {
      let importIndex = 0;
      const createImportedName = typeof options.createImportedName !== "function" ? (importName) => `i__imported_${importName.replace(/\W/g, "_")}_${importIndex++}` : options.createImportedName;
      const failOnWrongOrder = options.failOnWrongOrder;
      return {
        postcssPlugin: "postcss-modules-extract-imports",
        prepare() {
          const graph = {};
          const visited = {};
          const existingImports = {};
          const importDecls = {};
          const imports = {};
          return {
            Once(root, postcss) {
              root.walkRules((rule) => {
                const matches = icssImport.exec(rule.selector);
                if (matches) {
                  const [
                    ,
                    /*match*/
                    doubleQuotePath,
                    singleQuotePath
                  ] = matches;
                  const importPath = doubleQuotePath || singleQuotePath;
                  addImportToGraph(importPath, "root", graph, visited);
                  existingImports[importPath] = rule;
                }
              });
              root.walkDecls(/^composes$/, (declaration) => {
                const multiple = declaration.value.split(",");
                const values = [];
                multiple.forEach((value) => {
                  const matches = value.trim().match(matchImports);
                  if (!matches) {
                    values.push(value);
                    return;
                  }
                  let tmpSymbols;
                  let [
                    ,
                    /*match*/
                    symbols,
                    doubleQuotePath,
                    singleQuotePath,
                    global2
                  ] = matches;
                  if (global2) {
                    tmpSymbols = symbols.split(/\s+/).map((s) => `global(${s})`);
                  } else {
                    const importPath = doubleQuotePath || singleQuotePath;
                    let parent = declaration.parent;
                    let parentIndexes = "";
                    while (parent.type !== "root") {
                      parentIndexes = parent.parent.index(parent) + "_" + parentIndexes;
                      parent = parent.parent;
                    }
                    const { selector } = declaration.parent;
                    const parentRule = `_${parentIndexes}${selector}`;
                    addImportToGraph(importPath, parentRule, graph, visited);
                    importDecls[importPath] = declaration;
                    imports[importPath] = imports[importPath] || {};
                    tmpSymbols = symbols.split(/\s+/).map((s) => {
                      if (!imports[importPath][s]) {
                        imports[importPath][s] = createImportedName(s, importPath);
                      }
                      return imports[importPath][s];
                    });
                  }
                  values.push(tmpSymbols.join(" "));
                });
                declaration.value = values.join(", ");
              });
              const importsOrder = topologicalSort(graph, failOnWrongOrder);
              if (importsOrder instanceof Error) {
                const importPath = importsOrder.nodes.find(
                  (importPath2) => (
                    // eslint-disable-next-line no-prototype-builtins
                    importDecls.hasOwnProperty(importPath2)
                  )
                );
                const decl = importDecls[importPath];
                throw decl.error(
                  "Failed to resolve order of composed modules " + importsOrder.nodes.map((importPath2) => "`" + importPath2 + "`").join(", ") + ".",
                  {
                    plugin: "postcss-modules-extract-imports",
                    word: "composes"
                  }
                );
              }
              let lastImportRule;
              importsOrder.forEach((path) => {
                const importedSymbols = imports[path];
                let rule = existingImports[path];
                if (!rule && importedSymbols) {
                  rule = postcss.rule({
                    selector: `:import("${path}")`,
                    raws: { after: "\n" }
                  });
                  if (lastImportRule) {
                    root.insertAfter(lastImportRule, rule);
                  } else {
                    root.prepend(rule);
                  }
                }
                lastImportRule = rule;
                if (!importedSymbols) {
                  return;
                }
                Object.keys(importedSymbols).forEach((importedSymbol) => {
                  rule.append(
                    postcss.decl({
                      value: importedSymbol,
                      prop: importedSymbols[importedSymbol],
                      raws: { before: "\n  " }
                    })
                  );
                });
              });
            }
          };
        }
      };
    };
    module.exports.postcss = true;
  }
});

// ../node_modules/loader-utils/lib/hash/wasm-hash.js
var require_wasm_hash = __commonJS({
  "../node_modules/loader-utils/lib/hash/wasm-hash.js"(exports, module) {
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

// ../node_modules/loader-utils/lib/hash/xxhash64.js
var require_xxhash64 = __commonJS({
  "../node_modules/loader-utils/lib/hash/xxhash64.js"(exports, module) {
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

// ../node_modules/loader-utils/lib/hash/BatchedHash.js
var require_BatchedHash = __commonJS({
  "../node_modules/loader-utils/lib/hash/BatchedHash.js"(exports, module) {
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

// ../node_modules/loader-utils/lib/hash/md4.js
var require_md4 = __commonJS({
  "../node_modules/loader-utils/lib/hash/md4.js"(exports, module) {
    "use strict";
    var create = require_wasm_hash();
    var md4 = new WebAssembly.Module(
      Buffer.from(
        // 2150 bytes
        "AGFzbQEAAAABCAJgAX8AYAAAAwUEAQAAAAUDAQABBhoFfwFBAAt/AUEAC38BQQALfwFBAAt/AUEACwciBARpbml0AAAGdXBkYXRlAAIFZmluYWwAAwZtZW1vcnkCAAqFEAQmAEGBxpS6BiQBQYnXtv5+JAJB/rnrxXkkA0H2qMmBASQEQQAkAAvMCgEYfyMBIQojAiEGIwMhByMEIQgDQCAAIAVLBEAgBSgCCCINIAcgBiAFKAIEIgsgCCAHIAUoAgAiDCAKIAggBiAHIAhzcXNqakEDdyIDIAYgB3Nxc2pqQQd3IgEgAyAGc3FzampBC3chAiAFKAIUIg8gASACIAUoAhAiCSADIAEgBSgCDCIOIAYgAyACIAEgA3Nxc2pqQRN3IgQgASACc3FzampBA3ciAyACIARzcXNqakEHdyEBIAUoAiAiEiADIAEgBSgCHCIRIAQgAyAFKAIYIhAgAiAEIAEgAyAEc3FzampBC3ciAiABIANzcXNqakETdyIEIAEgAnNxc2pqQQN3IQMgBSgCLCIVIAQgAyAFKAIoIhQgAiAEIAUoAiQiEyABIAIgAyACIARzcXNqakEHdyIBIAMgBHNxc2pqQQt3IgIgASADc3FzampBE3chBCAPIBAgCSAVIBQgEyAFKAI4IhYgAiAEIAUoAjQiFyABIAIgBSgCMCIYIAMgASAEIAEgAnNxc2pqQQN3IgEgAiAEc3FzampBB3ciAiABIARzcXNqakELdyIDIAkgAiAMIAEgBSgCPCIJIAQgASADIAEgAnNxc2pqQRN3IgEgAiADcnEgAiADcXJqakGZ84nUBWpBA3ciAiABIANycSABIANxcmpqQZnzidQFakEFdyIEIAEgAnJxIAEgAnFyaiASakGZ84nUBWpBCXciAyAPIAQgCyACIBggASADIAIgBHJxIAIgBHFyampBmfOJ1AVqQQ13IgEgAyAEcnEgAyAEcXJqakGZ84nUBWpBA3ciAiABIANycSABIANxcmpqQZnzidQFakEFdyIEIAEgAnJxIAEgAnFyampBmfOJ1AVqQQl3IgMgECAEIAIgFyABIAMgAiAEcnEgAiAEcXJqakGZ84nUBWpBDXciASADIARycSADIARxcmogDWpBmfOJ1AVqQQN3IgIgASADcnEgASADcXJqakGZ84nUBWpBBXciBCABIAJycSABIAJxcmpqQZnzidQFakEJdyIDIBEgBCAOIAIgFiABIAMgAiAEcnEgAiAEcXJqakGZ84nUBWpBDXciASADIARycSADIARxcmpqQZnzidQFakEDdyICIAEgA3JxIAEgA3FyampBmfOJ1AVqQQV3IgQgASACcnEgASACcXJqakGZ84nUBWpBCXciAyAMIAIgAyAJIAEgAyACIARycSACIARxcmpqQZnzidQFakENdyIBcyAEc2pqQaHX5/YGakEDdyICIAQgASACcyADc2ogEmpBodfn9gZqQQl3IgRzIAFzampBodfn9gZqQQt3IgMgAiADIBggASADIARzIAJzampBodfn9gZqQQ93IgFzIARzaiANakGh1+f2BmpBA3ciAiAUIAQgASACcyADc2pqQaHX5/YGakEJdyIEcyABc2pqQaHX5/YGakELdyIDIAsgAiADIBYgASADIARzIAJzampBodfn9gZqQQ93IgFzIARzampBodfn9gZqQQN3IgIgEyAEIAEgAnMgA3NqakGh1+f2BmpBCXciBHMgAXNqakGh1+f2BmpBC3chAyAKIA4gAiADIBcgASADIARzIAJzampBodfn9gZqQQ93IgFzIARzampBodfn9gZqQQN3IgJqIQogBiAJIAEgESADIAIgFSAEIAEgAnMgA3NqakGh1+f2BmpBCXciBHMgAXNqakGh1+f2BmpBC3ciAyAEcyACc2pqQaHX5/YGakEPd2ohBiADIAdqIQcgBCAIaiEIIAVBQGshBQwBCwsgCiQBIAYkAiAHJAMgCCQECw0AIAAQASMAIABqJAAL/wQCA38BfiMAIABqrUIDhiEEIABByABqQUBxIgJBCGshAyAAIgFBAWohACABQYABOgAAA0AgACACSUEAIABBB3EbBEAgAEEAOgAAIABBAWohAAwBCwsDQCAAIAJJBEAgAEIANwMAIABBCGohAAwBCwsgAyAENwMAIAIQAUEAIwGtIgRC//8DgyAEQoCA/P8Pg0IQhoQiBEL/gYCA8B+DIARCgP6DgIDgP4NCCIaEIgRCj4C8gPCBwAeDQgiGIARC8IHAh4CegPgAg0IEiIQiBEKGjJiw4MCBgwZ8QgSIQoGChIiQoMCAAYNCJ34gBEKw4MCBg4aMmDCEfDcDAEEIIwKtIgRC//8DgyAEQoCA/P8Pg0IQhoQiBEL/gYCA8B+DIARCgP6DgIDgP4NCCIaEIgRCj4C8gPCBwAeDQgiGIARC8IHAh4CegPgAg0IEiIQiBEKGjJiw4MCBgwZ8QgSIQoGChIiQoMCAAYNCJ34gBEKw4MCBg4aMmDCEfDcDAEEQIwOtIgRC//8DgyAEQoCA/P8Pg0IQhoQiBEL/gYCA8B+DIARCgP6DgIDgP4NCCIaEIgRCj4C8gPCBwAeDQgiGIARC8IHAh4CegPgAg0IEiIQiBEKGjJiw4MCBgwZ8QgSIQoGChIiQoMCAAYNCJ34gBEKw4MCBg4aMmDCEfDcDAEEYIwStIgRC//8DgyAEQoCA/P8Pg0IQhoQiBEL/gYCA8B+DIARCgP6DgIDgP4NCCIaEIgRCj4C8gPCBwAeDQgiGIARC8IHAh4CegPgAg0IEiIQiBEKGjJiw4MCBgwZ8QgSIQoGChIiQoMCAAYNCJ34gBEKw4MCBg4aMmDCEfDcDAAs=",
        "base64"
      )
    );
    module.exports = create.bind(null, md4, [], 64, 32);
  }
});

// ../node_modules/loader-utils/lib/hash/BulkUpdateDecorator.js
var require_BulkUpdateDecorator = __commonJS({
  "../node_modules/loader-utils/lib/hash/BulkUpdateDecorator.js"(exports, module) {
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

// ../node_modules/loader-utils/lib/getHashDigest.js
var require_getHashDigest = __commonJS({
  "../node_modules/loader-utils/lib/getHashDigest.js"(exports, module) {
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

// ../node_modules/loader-utils/lib/interpolateName.js
var require_interpolateName = __commonJS({
  "../node_modules/loader-utils/lib/interpolateName.js"(exports, module) {
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

// ../node_modules/generic-names/index.js
var require_generic_names = __commonJS({
  "../node_modules/generic-names/index.js"(exports, module) {
    "use strict";
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

// ../node_modules/postcss-selector-parser/dist/util/unesc.js
var require_unesc = __commonJS({
  "../node_modules/postcss-selector-parser/dist/util/unesc.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = unesc;
    function gobbleHex(str) {
      var lower = str.toLowerCase();
      var hex = "";
      var spaceTerminated = false;
      for (var i = 0; i < 6 && lower[i] !== void 0; i++) {
        var code = lower.charCodeAt(i);
        var valid = code >= 97 && code <= 102 || code >= 48 && code <= 57;
        spaceTerminated = code === 32;
        if (!valid) {
          break;
        }
        hex += lower[i];
      }
      if (hex.length === 0) {
        return void 0;
      }
      var codePoint = parseInt(hex, 16);
      var isSurrogate = codePoint >= 55296 && codePoint <= 57343;
      if (isSurrogate || codePoint === 0 || codePoint > 1114111) {
        return ["\uFFFD", hex.length + (spaceTerminated ? 1 : 0)];
      }
      return [String.fromCodePoint(codePoint), hex.length + (spaceTerminated ? 1 : 0)];
    }
    var CONTAINS_ESCAPE = /\\/;
    function unesc(str) {
      var needToProcess = CONTAINS_ESCAPE.test(str);
      if (!needToProcess) {
        return str;
      }
      var ret = "";
      for (var i = 0; i < str.length; i++) {
        if (str[i] === "\\") {
          var gobbled = gobbleHex(str.slice(i + 1, i + 7));
          if (gobbled !== void 0) {
            ret += gobbled[0];
            i += gobbled[1];
            continue;
          }
          if (str[i + 1] === "\\") {
            ret += "\\";
            i++;
            continue;
          }
          if (str.length === i + 1) {
            ret += str[i];
          }
          continue;
        }
        ret += str[i];
      }
      return ret;
    }
  }
});

// ../node_modules/postcss-selector-parser/dist/util/getProp.js
var require_getProp = __commonJS({
  "../node_modules/postcss-selector-parser/dist/util/getProp.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = getProp;
    function getProp(obj) {
      var props = [];
      for (var _i = 1; _i < arguments.length; _i++) {
        props[_i - 1] = arguments[_i];
      }
      while (props.length > 0) {
        var prop = props.shift();
        if (!obj[prop]) {
          return void 0;
        }
        obj = obj[prop];
      }
      return obj;
    }
  }
});

// ../node_modules/postcss-selector-parser/dist/util/ensureObject.js
var require_ensureObject = __commonJS({
  "../node_modules/postcss-selector-parser/dist/util/ensureObject.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = ensureObject;
    function ensureObject(obj) {
      var props = [];
      for (var _i = 1; _i < arguments.length; _i++) {
        props[_i - 1] = arguments[_i];
      }
      while (props.length > 0) {
        var prop = props.shift();
        if (!obj[prop]) {
          obj[prop] = {};
        }
        obj = obj[prop];
      }
    }
  }
});

// ../node_modules/postcss-selector-parser/dist/util/stripComments.js
var require_stripComments = __commonJS({
  "../node_modules/postcss-selector-parser/dist/util/stripComments.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = stripComments;
    function stripComments(str) {
      var s = "";
      var commentStart = str.indexOf("/*");
      var lastEnd = 0;
      while (commentStart >= 0) {
        s = s + str.slice(lastEnd, commentStart);
        var commentEnd = str.indexOf("*/", commentStart + 2);
        if (commentEnd < 0) {
          return s;
        }
        lastEnd = commentEnd + 2;
        commentStart = str.indexOf("/*", lastEnd);
      }
      s = s + str.slice(lastEnd);
      return s;
    }
  }
});

// ../node_modules/postcss-selector-parser/dist/util/maxNestingDepth.js
var require_maxNestingDepth = __commonJS({
  "../node_modules/postcss-selector-parser/dist/util/maxNestingDepth.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MAX_NESTING_DEPTH = void 0;
    exports.default = resolveMaxNestingDepth;
    exports.MAX_NESTING_DEPTH = 256;
    function resolveMaxNestingDepth(value) {
      return Number.isSafeInteger(value) && value >= 0 ? value : exports.MAX_NESTING_DEPTH;
    }
  }
});

// ../node_modules/postcss-selector-parser/dist/util/index.js
var require_util2 = __commonJS({
  "../node_modules/postcss-selector-parser/dist/util/index.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MAX_NESTING_DEPTH = exports.resolveMaxNestingDepth = exports.stripComments = exports.ensureObject = exports.getProp = exports.unesc = void 0;
    var unesc_1 = require_unesc();
    Object.defineProperty(exports, "unesc", { enumerable: true, get: function() {
      return __importDefault(unesc_1).default;
    } });
    var getProp_1 = require_getProp();
    Object.defineProperty(exports, "getProp", { enumerable: true, get: function() {
      return __importDefault(getProp_1).default;
    } });
    var ensureObject_1 = require_ensureObject();
    Object.defineProperty(exports, "ensureObject", { enumerable: true, get: function() {
      return __importDefault(ensureObject_1).default;
    } });
    var stripComments_1 = require_stripComments();
    Object.defineProperty(exports, "stripComments", { enumerable: true, get: function() {
      return __importDefault(stripComments_1).default;
    } });
    var maxNestingDepth_1 = require_maxNestingDepth();
    Object.defineProperty(exports, "resolveMaxNestingDepth", { enumerable: true, get: function() {
      return __importDefault(maxNestingDepth_1).default;
    } });
    Object.defineProperty(exports, "MAX_NESTING_DEPTH", { enumerable: true, get: function() {
      return maxNestingDepth_1.MAX_NESTING_DEPTH;
    } });
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/node.js
var require_node2 = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/node.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util2();
    var cloneNode = function(obj, parent, depth) {
      if (depth === void 0) {
        depth = 0;
      }
      if (depth > util_1.MAX_NESTING_DEPTH) {
        throw new Error("Cannot clone selector: nesting depth exceeds the maximum of ".concat(util_1.MAX_NESTING_DEPTH, "."));
      }
      if (typeof obj !== "object" || obj === null) {
        return obj;
      }
      var cloned = new obj.constructor();
      for (var i in obj) {
        if (!obj.hasOwnProperty(i)) {
          continue;
        }
        var value = obj[i];
        var type = typeof value;
        if (i === "parent" && type === "object") {
          if (parent) {
            cloned[i] = parent;
          }
        } else if (value instanceof Array) {
          cloned[i] = value.map(function(j) {
            return cloneNode(j, cloned, depth + 1);
          });
        } else {
          cloned[i] = cloneNode(value, cloned, depth + 1);
        }
      }
      return cloned;
    };
    var Node = (
      /** @class */
      (function() {
        function Node2(opts) {
          if (opts === void 0) {
            opts = {};
          }
          Object.assign(this, opts);
          this.spaces = this.spaces || {};
          this.spaces.before = this.spaces.before || "";
          this.spaces.after = this.spaces.after || "";
        }
        Node2.prototype.remove = function() {
          if (this.parent) {
            this.parent.removeChild(this);
          }
          this.parent = void 0;
          return this;
        };
        Node2.prototype.replaceWith = function() {
          if (this.parent) {
            for (var index in arguments) {
              this.parent.insertBefore(this, arguments[index]);
            }
            this.remove();
          }
          return this;
        };
        Node2.prototype.next = function() {
          return this.parent.at(this.parent.index(this) + 1);
        };
        Node2.prototype.prev = function() {
          return this.parent.at(this.parent.index(this) - 1);
        };
        Node2.prototype.clone = function(overrides) {
          if (overrides === void 0) {
            overrides = {};
          }
          var cloned = cloneNode(this);
          for (var name in overrides) {
            cloned[name] = overrides[name];
          }
          return cloned;
        };
        Node2.prototype.appendToPropertyAndEscape = function(name, value, valueEscaped) {
          if (!this.raws) {
            this.raws = {};
          }
          var originalValue = this[name];
          var originalEscaped = this.raws[name];
          this[name] = originalValue + value;
          if (originalEscaped || valueEscaped !== value) {
            this.raws[name] = (originalEscaped || originalValue) + valueEscaped;
          } else {
            delete this.raws[name];
          }
        };
        Node2.prototype.setPropertyAndEscape = function(name, value, valueEscaped) {
          if (!this.raws) {
            this.raws = {};
          }
          this[name] = value;
          this.raws[name] = valueEscaped;
        };
        Node2.prototype.setPropertyWithoutEscape = function(name, value) {
          this[name] = value;
          if (this.raws) {
            delete this.raws[name];
          }
        };
        Node2.prototype.isAtPosition = function(line, column) {
          if (this.source && this.source.start && this.source.end) {
            if (this.source.start.line > line) {
              return false;
            }
            if (this.source.end.line < line) {
              return false;
            }
            if (this.source.start.line === line && this.source.start.column > column) {
              return false;
            }
            if (this.source.end.line === line && this.source.end.column < column) {
              return false;
            }
            return true;
          }
          return void 0;
        };
        Node2.prototype.stringifyProperty = function(name) {
          return this.raws && this.raws[name] || this[name];
        };
        Object.defineProperty(Node2.prototype, "rawSpaceBefore", {
          get: function() {
            var rawSpace = this.raws && this.raws.spaces && this.raws.spaces.before;
            if (rawSpace === void 0) {
              rawSpace = this.spaces && this.spaces.before;
            }
            return rawSpace || "";
          },
          set: function(raw) {
            (0, util_1.ensureObject)(this, "raws", "spaces");
            this.raws.spaces.before = raw;
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(Node2.prototype, "rawSpaceAfter", {
          get: function() {
            var rawSpace = this.raws && this.raws.spaces && this.raws.spaces.after;
            if (rawSpace === void 0) {
              rawSpace = this.spaces.after;
            }
            return rawSpace || "";
          },
          set: function(raw) {
            (0, util_1.ensureObject)(this, "raws", "spaces");
            this.raws.spaces.after = raw;
          },
          enumerable: false,
          configurable: true
        });
        Node2.prototype.valueToString = function() {
          return String(this.stringifyProperty("value"));
        };
        Node2.prototype.toString = function() {
          return [this.rawSpaceBefore, this.valueToString(), this.rawSpaceAfter].join("");
        };
        Node2.prototype._stringify = function() {
          return this.toString();
        };
        return Node2;
      })()
    );
    exports.default = Node;
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/types.js
var require_types = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UNIVERSAL = exports.ATTRIBUTE = exports.CLASS = exports.COMBINATOR = exports.COMMENT = exports.ID = exports.NESTING = exports.PSEUDO = exports.ROOT = exports.SELECTOR = exports.STRING = exports.TAG = void 0;
    exports.TAG = "tag";
    exports.STRING = "string";
    exports.SELECTOR = "selector";
    exports.ROOT = "root";
    exports.PSEUDO = "pseudo";
    exports.NESTING = "nesting";
    exports.ID = "id";
    exports.COMMENT = "comment";
    exports.COMBINATOR = "combinator";
    exports.CLASS = "class";
    exports.ATTRIBUTE = "attribute";
    exports.UNIVERSAL = "universal";
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/container.js
var require_container2 = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/container.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    var __values = exports && exports.__values || function(o) {
      var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
      if (m) return m.call(o);
      if (o && typeof o.length === "number") return {
        next: function() {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
        }
      };
      throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from, pack) {
      if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
      return to.concat(ar || Array.prototype.slice.call(from));
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util2();
    var node_1 = __importDefault(require_node2());
    var types = __importStar(require_types());
    var Container = (
      /** @class */
      (function(_super) {
        __extends(Container2, _super);
        function Container2(opts) {
          var _this = _super.call(this, opts) || this;
          if (!_this.nodes) {
            _this.nodes = [];
          }
          return _this;
        }
        Container2.prototype.append = function(selector) {
          selector.parent = this;
          this.nodes.push(selector);
          return this;
        };
        Container2.prototype.prepend = function(selector) {
          selector.parent = this;
          this.nodes.unshift(selector);
          for (var id in this.indexes) {
            this.indexes[id]++;
          }
          return this;
        };
        Container2.prototype.at = function(index) {
          return this.nodes[index];
        };
        Container2.prototype.index = function(child) {
          if (typeof child === "number") {
            return child;
          }
          return this.nodes.indexOf(child);
        };
        Object.defineProperty(Container2.prototype, "first", {
          get: function() {
            return this.at(0);
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(Container2.prototype, "last", {
          get: function() {
            return this.at(this.length - 1);
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(Container2.prototype, "length", {
          get: function() {
            return this.nodes.length;
          },
          enumerable: false,
          configurable: true
        });
        Container2.prototype.removeChild = function(child) {
          child = this.index(child);
          this.at(child).parent = void 0;
          this.nodes.splice(child, 1);
          var index;
          for (var id in this.indexes) {
            index = this.indexes[id];
            if (index >= child) {
              this.indexes[id] = index - 1;
            }
          }
          return this;
        };
        Container2.prototype.removeAll = function() {
          var e_1, _a;
          try {
            for (var _b = __values(this.nodes), _c = _b.next(); !_c.done; _c = _b.next()) {
              var node = _c.value;
              node.parent = void 0;
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
          this.nodes = [];
          return this;
        };
        Container2.prototype.empty = function() {
          return this.removeAll();
        };
        Container2.prototype.insertAfter = function(oldNode, newNode) {
          var _a;
          newNode.parent = this;
          var oldIndex = this.index(oldNode);
          var resetNode = [];
          for (var i = 2; i < arguments.length; i++) {
            resetNode.push(arguments[i]);
          }
          (_a = this.nodes).splice.apply(_a, __spreadArray([oldIndex + 1, 0, newNode], __read(resetNode), false));
          newNode.parent = this;
          var index;
          for (var id in this.indexes) {
            index = this.indexes[id];
            if (oldIndex < index) {
              this.indexes[id] = index + arguments.length - 1;
            }
          }
          return this;
        };
        Container2.prototype.insertBefore = function(oldNode, newNode) {
          var _a;
          newNode.parent = this;
          var oldIndex = this.index(oldNode);
          var resetNode = [];
          for (var i = 2; i < arguments.length; i++) {
            resetNode.push(arguments[i]);
          }
          (_a = this.nodes).splice.apply(_a, __spreadArray([oldIndex, 0, newNode], __read(resetNode), false));
          newNode.parent = this;
          var index;
          for (var id in this.indexes) {
            index = this.indexes[id];
            if (index >= oldIndex) {
              this.indexes[id] = index + arguments.length - 1;
            }
          }
          return this;
        };
        Container2.prototype._findChildAtPosition = function(line, col) {
          var found = void 0;
          this.each(function(node) {
            if (node.atPosition) {
              var foundChild = node.atPosition(line, col);
              if (foundChild) {
                found = foundChild;
                return false;
              }
            } else if (node.isAtPosition(line, col)) {
              found = node;
              return false;
            }
          });
          return found;
        };
        Container2.prototype.atPosition = function(line, col) {
          if (this.isAtPosition(line, col)) {
            return this._findChildAtPosition(line, col) || this;
          } else {
            return void 0;
          }
        };
        Container2.prototype._inferEndPosition = function() {
          if (this.last && this.last.source && this.last.source.end) {
            this.source = this.source || {};
            this.source.end = this.source.end || {};
            Object.assign(this.source.end, this.last.source.end);
          }
        };
        Container2.prototype.each = function(callback) {
          if (!this.lastEach) {
            this.lastEach = 0;
          }
          if (!this.indexes) {
            this.indexes = {};
          }
          this.lastEach++;
          var id = this.lastEach;
          this.indexes[id] = 0;
          if (!this.length) {
            return void 0;
          }
          var index, result;
          while (this.indexes[id] < this.length) {
            index = this.indexes[id];
            result = callback(this.at(index), index);
            if (result === false) {
              break;
            }
            this.indexes[id] += 1;
          }
          delete this.indexes[id];
          if (result === false) {
            return false;
          }
        };
        Container2.prototype.walk = function(callback, depth) {
          if (depth === void 0) {
            depth = 0;
          }
          if (depth > util_1.MAX_NESTING_DEPTH) {
            throw new Error("Cannot walk selector: nesting depth exceeds the maximum of ".concat(util_1.MAX_NESTING_DEPTH, "."));
          }
          return this.each(function(node, i) {
            var result = callback(node, i);
            if (result !== false && node.length) {
              result = node.walk(callback, depth + 1);
            }
            if (result === false) {
              return false;
            }
          });
        };
        Container2.prototype.walkAttributes = function(callback) {
          var _this = this;
          return this.walk(function(selector) {
            if (selector.type === types.ATTRIBUTE) {
              return callback.call(_this, selector);
            }
          });
        };
        Container2.prototype.walkClasses = function(callback) {
          var _this = this;
          return this.walk(function(selector) {
            if (selector.type === types.CLASS) {
              return callback.call(_this, selector);
            }
          });
        };
        Container2.prototype.walkCombinators = function(callback) {
          var _this = this;
          return this.walk(function(selector) {
            if (selector.type === types.COMBINATOR) {
              return callback.call(_this, selector);
            }
          });
        };
        Container2.prototype.walkComments = function(callback) {
          var _this = this;
          return this.walk(function(selector) {
            if (selector.type === types.COMMENT) {
              return callback.call(_this, selector);
            }
          });
        };
        Container2.prototype.walkIds = function(callback) {
          var _this = this;
          return this.walk(function(selector) {
            if (selector.type === types.ID) {
              return callback.call(_this, selector);
            }
          });
        };
        Container2.prototype.walkNesting = function(callback) {
          var _this = this;
          return this.walk(function(selector) {
            if (selector.type === types.NESTING) {
              return callback.call(_this, selector);
            }
          });
        };
        Container2.prototype.walkPseudos = function(callback) {
          var _this = this;
          return this.walk(function(selector) {
            if (selector.type === types.PSEUDO) {
              return callback.call(_this, selector);
            }
          });
        };
        Container2.prototype.walkTags = function(callback) {
          var _this = this;
          return this.walk(function(selector) {
            if (selector.type === types.TAG) {
              return callback.call(_this, selector);
            }
          });
        };
        Container2.prototype.walkUniversals = function(callback) {
          var _this = this;
          return this.walk(function(selector) {
            if (selector.type === types.UNIVERSAL) {
              return callback.call(_this, selector);
            }
          });
        };
        Container2.prototype.split = function(callback) {
          var _this = this;
          var current = [];
          return this.reduce(function(memo, node, index) {
            var split = callback.call(_this, node);
            current.push(node);
            if (split) {
              memo.push(current);
              current = [];
            } else if (index === _this.length - 1) {
              memo.push(current);
            }
            return memo;
          }, []);
        };
        Container2.prototype.map = function(callback) {
          return this.nodes.map(callback);
        };
        Container2.prototype.reduce = function(callback, memo) {
          return this.nodes.reduce(callback, memo);
        };
        Container2.prototype.every = function(callback) {
          return this.nodes.every(callback);
        };
        Container2.prototype.some = function(callback) {
          return this.nodes.some(callback);
        };
        Container2.prototype.filter = function(callback) {
          return this.nodes.filter(callback);
        };
        Container2.prototype.sort = function(callback) {
          return this.nodes.sort(callback);
        };
        Container2.prototype.toString = function(options) {
          if (options === void 0) {
            options = {};
          }
          return this._stringify(options, 0, (0, util_1.resolveMaxNestingDepth)(options.maxNestingDepth));
        };
        Container2.prototype._stringify = function(options, depth, max) {
          var _this = this;
          return this.map(function(child) {
            return _this._stringifyChild(child, options, depth, max);
          }).join("");
        };
        Container2.prototype._stringifyChild = function(child, options, depth, max) {
          return typeof child._stringify === "function" ? child._stringify(options, depth, max) : String(child);
        };
        return Container2;
      })(node_1.default)
    );
    exports.default = Container;
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/root.js
var require_root2 = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/root.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var container_1 = __importDefault(require_container2());
    var types_1 = require_types();
    var Root = (
      /** @class */
      (function(_super) {
        __extends(Root2, _super);
        function Root2(opts) {
          var _this = _super.call(this, opts) || this;
          _this.type = types_1.ROOT;
          return _this;
        }
        Root2.prototype._stringify = function(options, depth, max) {
          var _this = this;
          var str = this.reduce(function(memo, selector) {
            memo.push(_this._stringifyChild(selector, options, depth, max));
            return memo;
          }, []).join(",");
          return this.trailingComma ? str + "," : str;
        };
        Root2.prototype.error = function(message, options) {
          if (this._error) {
            return this._error(message, options);
          } else {
            return new Error(message);
          }
        };
        Object.defineProperty(Root2.prototype, "errorGenerator", {
          set: function(handler) {
            this._error = handler;
          },
          enumerable: false,
          configurable: true
        });
        return Root2;
      })(container_1.default)
    );
    exports.default = Root;
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/selector.js
var require_selector = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/selector.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var container_1 = __importDefault(require_container2());
    var types_1 = require_types();
    var Selector = (
      /** @class */
      (function(_super) {
        __extends(Selector2, _super);
        function Selector2(opts) {
          var _this = _super.call(this, opts) || this;
          _this.type = types_1.SELECTOR;
          return _this;
        }
        return Selector2;
      })(container_1.default)
    );
    exports.default = Selector;
  }
});

// ../node_modules/cssesc/cssesc.js
var require_cssesc = __commonJS({
  "../node_modules/cssesc/cssesc.js"(exports, module) {
    "use strict";
    var object = {};
    var hasOwnProperty = object.hasOwnProperty;
    var merge = function merge2(options, defaults) {
      if (!options) {
        return defaults;
      }
      var result = {};
      for (var key in defaults) {
        result[key] = hasOwnProperty.call(options, key) ? options[key] : defaults[key];
      }
      return result;
    };
    var regexAnySingleEscape = /[ -,\.\/:-@\[-\^`\{-~]/;
    var regexSingleEscape = /[ -,\.\/:-@\[\]\^`\{-~]/;
    var regexExcessiveSpaces = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g;
    var cssesc = function cssesc2(string, options) {
      options = merge(options, cssesc2.options);
      if (options.quotes != "single" && options.quotes != "double") {
        options.quotes = "single";
      }
      var quote = options.quotes == "double" ? '"' : "'";
      var isIdentifier = options.isIdentifier;
      var firstChar = string.charAt(0);
      var output = "";
      var counter = 0;
      var length = string.length;
      while (counter < length) {
        var character = string.charAt(counter++);
        var codePoint = character.charCodeAt();
        var value = void 0;
        if (codePoint < 32 || codePoint > 126) {
          if (codePoint >= 55296 && codePoint <= 56319 && counter < length) {
            var extra = string.charCodeAt(counter++);
            if ((extra & 64512) == 56320) {
              codePoint = ((codePoint & 1023) << 10) + (extra & 1023) + 65536;
            } else {
              counter--;
            }
          }
          value = "\\" + codePoint.toString(16).toUpperCase() + " ";
        } else {
          if (options.escapeEverything) {
            if (regexAnySingleEscape.test(character)) {
              value = "\\" + character;
            } else {
              value = "\\" + codePoint.toString(16).toUpperCase() + " ";
            }
          } else if (/[\t\n\f\r\x0B]/.test(character)) {
            value = "\\" + codePoint.toString(16).toUpperCase() + " ";
          } else if (character == "\\" || !isIdentifier && (character == '"' && quote == character || character == "'" && quote == character) || isIdentifier && regexSingleEscape.test(character)) {
            value = "\\" + character;
          } else {
            value = character;
          }
        }
        output += value;
      }
      if (isIdentifier) {
        if (/^-[-\d]/.test(output)) {
          output = "\\-" + output.slice(1);
        } else if (/\d/.test(firstChar)) {
          output = "\\3" + firstChar + " " + output.slice(1);
        }
      }
      output = output.replace(regexExcessiveSpaces, function($0, $1, $2) {
        if ($1 && $1.length % 2) {
          return $0;
        }
        return ($1 || "") + $2;
      });
      if (!isIdentifier && options.wrap) {
        return quote + output + quote;
      }
      return output;
    };
    cssesc.options = {
      "escapeEverything": false,
      "isIdentifier": false,
      "quotes": "single",
      "wrap": false
    };
    cssesc.version = "3.0.0";
    module.exports = cssesc;
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/className.js
var require_className = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/className.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var cssesc_1 = __importDefault(require_cssesc());
    var util_1 = require_util2();
    var node_1 = __importDefault(require_node2());
    var types_1 = require_types();
    var ClassName = (
      /** @class */
      (function(_super) {
        __extends(ClassName2, _super);
        function ClassName2(opts) {
          var _this = _super.call(this, opts) || this;
          _this.type = types_1.CLASS;
          _this._constructed = true;
          return _this;
        }
        Object.defineProperty(ClassName2.prototype, "value", {
          get: function() {
            return this._value;
          },
          set: function(v) {
            if (this._constructed) {
              var escaped = (0, cssesc_1.default)(v, { isIdentifier: true });
              if (escaped !== v) {
                (0, util_1.ensureObject)(this, "raws");
                this.raws.value = escaped;
              } else if (this.raws) {
                delete this.raws.value;
              }
            }
            this._value = v;
          },
          enumerable: false,
          configurable: true
        });
        ClassName2.prototype.valueToString = function() {
          return "." + _super.prototype.valueToString.call(this);
        };
        return ClassName2;
      })(node_1.default)
    );
    exports.default = ClassName;
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/comment.js
var require_comment2 = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/comment.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var node_1 = __importDefault(require_node2());
    var types_1 = require_types();
    var Comment = (
      /** @class */
      (function(_super) {
        __extends(Comment2, _super);
        function Comment2(opts) {
          var _this = _super.call(this, opts) || this;
          _this.type = types_1.COMMENT;
          return _this;
        }
        return Comment2;
      })(node_1.default)
    );
    exports.default = Comment;
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/id.js
var require_id = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/id.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var node_1 = __importDefault(require_node2());
    var types_1 = require_types();
    var ID = (
      /** @class */
      (function(_super) {
        __extends(ID2, _super);
        function ID2(opts) {
          var _this = _super.call(this, opts) || this;
          _this.type = types_1.ID;
          return _this;
        }
        ID2.prototype.valueToString = function() {
          return "#" + _super.prototype.valueToString.call(this);
        };
        return ID2;
      })(node_1.default)
    );
    exports.default = ID;
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/namespace.js
var require_namespace = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/namespace.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var cssesc_1 = __importDefault(require_cssesc());
    var util_1 = require_util2();
    var node_1 = __importDefault(require_node2());
    var Namespace = (
      /** @class */
      (function(_super) {
        __extends(Namespace2, _super);
        function Namespace2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(Namespace2.prototype, "namespace", {
          get: function() {
            return this._namespace;
          },
          set: function(namespace) {
            if (namespace === true || namespace === "*" || namespace === "&") {
              this._namespace = namespace;
              if (this.raws) {
                delete this.raws.namespace;
              }
              return;
            }
            var escaped = (0, cssesc_1.default)(namespace, { isIdentifier: true });
            this._namespace = namespace;
            if (escaped !== namespace) {
              (0, util_1.ensureObject)(this, "raws");
              this.raws.namespace = escaped;
            } else if (this.raws) {
              delete this.raws.namespace;
            }
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(Namespace2.prototype, "ns", {
          get: function() {
            return this._namespace;
          },
          set: function(namespace) {
            this.namespace = namespace;
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(Namespace2.prototype, "namespaceString", {
          get: function() {
            if (this.namespace) {
              var ns = this.stringifyProperty("namespace");
              if (ns === true) {
                return "";
              } else {
                return ns;
              }
            } else {
              return "";
            }
          },
          enumerable: false,
          configurable: true
        });
        Namespace2.prototype.qualifiedName = function(value) {
          if (this.namespace) {
            return "".concat(this.namespaceString, "|").concat(value);
          } else {
            return value;
          }
        };
        Namespace2.prototype.valueToString = function() {
          return this.qualifiedName(_super.prototype.valueToString.call(this));
        };
        return Namespace2;
      })(node_1.default)
    );
    exports.default = Namespace;
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/tag.js
var require_tag = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/tag.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var namespace_1 = __importDefault(require_namespace());
    var types_1 = require_types();
    var Tag = (
      /** @class */
      (function(_super) {
        __extends(Tag2, _super);
        function Tag2(opts) {
          var _this = _super.call(this, opts) || this;
          _this.type = types_1.TAG;
          return _this;
        }
        return Tag2;
      })(namespace_1.default)
    );
    exports.default = Tag;
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/string.js
var require_string = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/string.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String2(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var node_1 = __importDefault(require_node2());
    var types_1 = require_types();
    var String2 = (
      /** @class */
      (function(_super) {
        __extends(String3, _super);
        function String3(opts) {
          var _this = _super.call(this, opts) || this;
          _this.type = types_1.STRING;
          return _this;
        }
        return String3;
      })(node_1.default)
    );
    exports.default = String2;
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/pseudo.js
var require_pseudo = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/pseudo.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var container_1 = __importDefault(require_container2());
    var types_1 = require_types();
    var Pseudo = (
      /** @class */
      (function(_super) {
        __extends(Pseudo2, _super);
        function Pseudo2(opts) {
          var _this = _super.call(this, opts) || this;
          _this.type = types_1.PSEUDO;
          return _this;
        }
        Pseudo2.prototype._stringify = function(options, depth, max) {
          var _this = this;
          if (depth >= max) {
            throw new Error("Cannot serialize selector: nesting depth exceeds the maximum of ".concat(max, "."));
          }
          var params = this.length ? "(" + this.map(function(child) {
            return _this._stringifyChild(child, options, depth + 1, max);
          }).join(",") + ")" : "";
          return [this.rawSpaceBefore, this.stringifyProperty("value"), params, this.rawSpaceAfter].join("");
        };
        return Pseudo2;
      })(container_1.default)
    );
    exports.default = Pseudo;
  }
});

// ../node_modules/util-deprecate/node.js
var require_node3 = __commonJS({
  "../node_modules/util-deprecate/node.js"(exports, module) {
    module.exports = __require("util").deprecate;
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/attribute.js
var require_attribute = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/attribute.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.unescapeValue = unescapeValue;
    var cssesc_1 = __importDefault(require_cssesc());
    var unesc_1 = __importDefault(require_unesc());
    var namespace_1 = __importDefault(require_namespace());
    var types_1 = require_types();
    var deprecate = require_node3();
    var WRAPPED_IN_QUOTES = /^('|")([^]*)\1$/;
    var warnOfDeprecatedValueAssignment = deprecate(function() {
    }, "Assigning an attribute a value containing characters that might need to be escaped is deprecated. Call attribute.setValue() instead.");
    var warnOfDeprecatedQuotedAssignment = deprecate(function() {
    }, "Assigning attr.quoted is deprecated and has no effect. Assign to attr.quoteMark instead.");
    var warnOfDeprecatedConstructor = deprecate(function() {
    }, "Constructing an Attribute selector with a value without specifying quoteMark is deprecated. Note: The value should be unescaped now.");
    function unescapeValue(value) {
      var deprecatedUsage = false;
      var quoteMark = null;
      var unescaped = value;
      var m = unescaped.match(WRAPPED_IN_QUOTES);
      if (m) {
        quoteMark = m[1];
        unescaped = m[2];
      }
      unescaped = (0, unesc_1.default)(unescaped);
      if (unescaped !== value) {
        deprecatedUsage = true;
      }
      return {
        deprecatedUsage,
        unescaped,
        quoteMark
      };
    }
    function handleDeprecatedContructorOpts(opts) {
      if (opts.quoteMark !== void 0) {
        return opts;
      }
      if (opts.value === void 0) {
        return opts;
      }
      warnOfDeprecatedConstructor();
      var _a2 = unescapeValue(opts.value), quoteMark = _a2.quoteMark, unescaped = _a2.unescaped;
      if (!opts.raws) {
        opts.raws = {};
      }
      if (opts.raws.value === void 0) {
        opts.raws.value = opts.value;
      }
      opts.value = unescaped;
      opts.quoteMark = quoteMark;
      return opts;
    }
    var Attribute = (
      /** @class */
      (function(_super) {
        __extends(Attribute2, _super);
        function Attribute2(opts) {
          if (opts === void 0) {
            opts = {};
          }
          var _this = _super.call(this, handleDeprecatedContructorOpts(opts)) || this;
          _this.type = types_1.ATTRIBUTE;
          _this.raws = _this.raws || {};
          Object.defineProperty(_this.raws, "unquoted", {
            get: deprecate(function() {
              return _this.value;
            }, "attr.raws.unquoted is deprecated. Call attr.value instead."),
            set: deprecate(function() {
              return _this.value;
            }, "Setting attr.raws.unquoted is deprecated and has no effect. attr.value is unescaped by default now.")
          });
          _this._constructed = true;
          return _this;
        }
        Attribute2.prototype.getQuotedValue = function(options) {
          if (options === void 0) {
            options = {};
          }
          var quoteMark = this._determineQuoteMark(options);
          var cssescopts = CSSESC_QUOTE_OPTIONS[quoteMark];
          var escaped = (0, cssesc_1.default)(this._value, cssescopts);
          return escaped;
        };
        Attribute2.prototype._determineQuoteMark = function(options) {
          return options.smart ? this.smartQuoteMark(options) : this.preferredQuoteMark(options);
        };
        Attribute2.prototype.setValue = function(value, options) {
          if (options === void 0) {
            options = {};
          }
          this._value = value;
          this._quoteMark = this._determineQuoteMark(options);
          this._syncRawValue();
        };
        Attribute2.prototype.smartQuoteMark = function(options) {
          var v = this.value;
          var numSingleQuotes = v.replace(/[^']/g, "").length;
          var numDoubleQuotes = v.replace(/[^"]/g, "").length;
          if (numSingleQuotes + numDoubleQuotes === 0) {
            var escaped = (0, cssesc_1.default)(v, { isIdentifier: true });
            if (escaped === v) {
              return Attribute2.NO_QUOTE;
            } else {
              var pref = this.preferredQuoteMark(options);
              if (pref === Attribute2.NO_QUOTE) {
                var quote = this.quoteMark || options.quoteMark || Attribute2.DOUBLE_QUOTE;
                var opts = CSSESC_QUOTE_OPTIONS[quote];
                var quoteValue = (0, cssesc_1.default)(v, opts);
                if (quoteValue.length < escaped.length) {
                  return quote;
                }
              }
              return pref;
            }
          } else if (numDoubleQuotes === numSingleQuotes) {
            return this.preferredQuoteMark(options);
          } else if (numDoubleQuotes < numSingleQuotes) {
            return Attribute2.DOUBLE_QUOTE;
          } else {
            return Attribute2.SINGLE_QUOTE;
          }
        };
        Attribute2.prototype.preferredQuoteMark = function(options) {
          var quoteMark = options.preferCurrentQuoteMark ? this.quoteMark : options.quoteMark;
          if (quoteMark === void 0) {
            quoteMark = options.preferCurrentQuoteMark ? options.quoteMark : this.quoteMark;
          }
          if (quoteMark === void 0) {
            quoteMark = Attribute2.DOUBLE_QUOTE;
          }
          return quoteMark;
        };
        Object.defineProperty(Attribute2.prototype, "quoted", {
          get: function() {
            var qm = this.quoteMark;
            return qm === "'" || qm === '"';
          },
          set: function(value) {
            warnOfDeprecatedQuotedAssignment();
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(Attribute2.prototype, "quoteMark", {
          /**
           * returns a single (`'`) or double (`"`) quote character if the value is quoted.
           * returns `null` if the value is not quoted.
           * returns `undefined` if the quotation state is unknown (this can happen when
           * the attribute is constructed without specifying a quote mark.)
           */
          get: function() {
            return this._quoteMark;
          },
          /**
           * Set the quote mark to be used by this attribute's value.
           * If the quote mark changes, the raw (escaped) value at `attr.raws.value` of the attribute
           * value is updated accordingly.
           *
           * @param {"'" | '"' | null} quoteMark The quote mark or `null` if the value should be unquoted.
           */
          set: function(quoteMark) {
            if (!this._constructed) {
              this._quoteMark = quoteMark;
              return;
            }
            if (this._quoteMark !== quoteMark) {
              this._quoteMark = quoteMark;
              this._syncRawValue();
            }
          },
          enumerable: false,
          configurable: true
        });
        Attribute2.prototype._syncRawValue = function() {
          var rawValue = (0, cssesc_1.default)(this._value, CSSESC_QUOTE_OPTIONS[this.quoteMark]);
          if (rawValue === this._value) {
            if (this.raws) {
              delete this.raws.value;
            }
          } else {
            this.raws.value = rawValue;
          }
        };
        Object.defineProperty(Attribute2.prototype, "qualifiedAttribute", {
          get: function() {
            return this.qualifiedName(this.raws.attribute || this.attribute);
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(Attribute2.prototype, "insensitiveFlag", {
          get: function() {
            return this.insensitive ? "i" : "";
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(Attribute2.prototype, "value", {
          get: function() {
            return this._value;
          },
          /**
           * Before 3.0, the value had to be set to an escaped value including any wrapped
           * quote marks. In 3.0, the semantics of `Attribute.value` changed so that the value
           * is unescaped during parsing and any quote marks are removed.
           *
           * Because the ambiguity of this semantic change, if you set `attr.value = newValue`,
           * a deprecation warning is raised when the new value contains any characters that would
           * require escaping (including if it contains wrapped quotes).
           *
           * Instead, you should call `attr.setValue(newValue, opts)` and pass options that describe
           * how the new value is quoted.
           */
          set: function(v) {
            if (this._constructed) {
              var _a2 = unescapeValue(v), deprecatedUsage = _a2.deprecatedUsage, unescaped = _a2.unescaped, quoteMark = _a2.quoteMark;
              if (deprecatedUsage) {
                warnOfDeprecatedValueAssignment();
              }
              if (unescaped === this._value && quoteMark === this._quoteMark) {
                return;
              }
              this._value = unescaped;
              this._quoteMark = quoteMark;
              this._syncRawValue();
            } else {
              this._value = v;
            }
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(Attribute2.prototype, "insensitive", {
          get: function() {
            return this._insensitive;
          },
          /**
           * Set the case insensitive flag.
           * If the case insensitive flag changes, the raw (escaped) value at `attr.raws.insensitiveFlag`
           * of the attribute is updated accordingly.
           *
           * @param {true | false} insensitive true if the attribute should match case-insensitively.
           */
          set: function(insensitive) {
            if (!insensitive) {
              this._insensitive = false;
              if (this.raws && (this.raws.insensitiveFlag === "I" || this.raws.insensitiveFlag === "i")) {
                this.raws.insensitiveFlag = void 0;
              }
            }
            this._insensitive = insensitive;
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(Attribute2.prototype, "attribute", {
          get: function() {
            return this._attribute;
          },
          set: function(name) {
            this._handleEscapes("attribute", name);
            this._attribute = name;
          },
          enumerable: false,
          configurable: true
        });
        Attribute2.prototype._handleEscapes = function(prop, value) {
          if (this._constructed) {
            var escaped = (0, cssesc_1.default)(value, { isIdentifier: true });
            if (escaped !== value) {
              this.raws[prop] = escaped;
            } else {
              delete this.raws[prop];
            }
          }
        };
        Attribute2.prototype._spacesFor = function(name) {
          var attrSpaces = { before: "", after: "" };
          var spaces = this.spaces[name] || {};
          var rawSpaces = this.raws.spaces && this.raws.spaces[name] || {};
          return Object.assign(attrSpaces, spaces, rawSpaces);
        };
        Attribute2.prototype._stringFor = function(name, spaceName, concat) {
          if (spaceName === void 0) {
            spaceName = name;
          }
          if (concat === void 0) {
            concat = defaultAttrConcat;
          }
          var attrSpaces = this._spacesFor(spaceName);
          return concat(this.stringifyProperty(name), attrSpaces);
        };
        Attribute2.prototype.offsetOf = function(name) {
          var count = 1;
          var attributeSpaces = this._spacesFor("attribute");
          count += attributeSpaces.before.length;
          if (name === "namespace" || name === "ns") {
            return this.namespace ? count : -1;
          }
          if (name === "attributeNS") {
            return count;
          }
          count += this.namespaceString.length;
          if (this.namespace) {
            count += 1;
          }
          if (name === "attribute") {
            return count;
          }
          count += this.stringifyProperty("attribute").length;
          count += attributeSpaces.after.length;
          var operatorSpaces = this._spacesFor("operator");
          count += operatorSpaces.before.length;
          var operator = this.stringifyProperty("operator");
          if (name === "operator") {
            return operator ? count : -1;
          }
          count += operator.length;
          count += operatorSpaces.after.length;
          var valueSpaces = this._spacesFor("value");
          count += valueSpaces.before.length;
          var value = this.stringifyProperty("value");
          if (name === "value") {
            return value ? count : -1;
          }
          count += value.length;
          count += valueSpaces.after.length;
          var insensitiveSpaces = this._spacesFor("insensitive");
          count += insensitiveSpaces.before.length;
          if (name === "insensitive") {
            return this.insensitive ? count : -1;
          }
          return -1;
        };
        Attribute2.prototype.toString = function() {
          var _this = this;
          var selector = [this.rawSpaceBefore, "["];
          selector.push(this._stringFor("qualifiedAttribute", "attribute"));
          if (this.operator && (this.value || this.value === "")) {
            selector.push(this._stringFor("operator"));
            selector.push(this._stringFor("value"));
            selector.push(this._stringFor("insensitiveFlag", "insensitive", function(attrValue, attrSpaces) {
              if (attrValue.length > 0 && !_this.quoted && attrSpaces.before.length === 0 && !(_this.spaces.value && _this.spaces.value.after)) {
                attrSpaces.before = " ";
              }
              return defaultAttrConcat(attrValue, attrSpaces);
            }));
          }
          selector.push("]");
          selector.push(this.rawSpaceAfter);
          return selector.join("");
        };
        Attribute2.NO_QUOTE = null;
        Attribute2.SINGLE_QUOTE = "'";
        Attribute2.DOUBLE_QUOTE = '"';
        return Attribute2;
      })(namespace_1.default)
    );
    exports.default = Attribute;
    var CSSESC_QUOTE_OPTIONS = (_a = {
      "'": { quotes: "single", wrap: true },
      '"': { quotes: "double", wrap: true }
    }, _a[null] = { isIdentifier: true }, _a);
    function defaultAttrConcat(attrValue, attrSpaces) {
      return "".concat(attrSpaces.before).concat(attrValue).concat(attrSpaces.after);
    }
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/universal.js
var require_universal = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/universal.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var namespace_1 = __importDefault(require_namespace());
    var types_1 = require_types();
    var Universal = (
      /** @class */
      (function(_super) {
        __extends(Universal2, _super);
        function Universal2(opts) {
          var _this = _super.call(this, opts) || this;
          _this.type = types_1.UNIVERSAL;
          _this.value = "*";
          return _this;
        }
        return Universal2;
      })(namespace_1.default)
    );
    exports.default = Universal;
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/combinator.js
var require_combinator = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/combinator.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var node_1 = __importDefault(require_node2());
    var types_1 = require_types();
    var Combinator = (
      /** @class */
      (function(_super) {
        __extends(Combinator2, _super);
        function Combinator2(opts) {
          var _this = _super.call(this, opts) || this;
          _this.type = types_1.COMBINATOR;
          return _this;
        }
        return Combinator2;
      })(node_1.default)
    );
    exports.default = Combinator;
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/nesting.js
var require_nesting = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/nesting.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var node_1 = __importDefault(require_node2());
    var types_1 = require_types();
    var Nesting = (
      /** @class */
      (function(_super) {
        __extends(Nesting2, _super);
        function Nesting2(opts) {
          var _this = _super.call(this, opts) || this;
          _this.type = types_1.NESTING;
          _this.value = "&";
          return _this;
        }
        return Nesting2;
      })(node_1.default)
    );
    exports.default = Nesting;
  }
});

// ../node_modules/postcss-selector-parser/dist/sortAscending.js
var require_sortAscending = __commonJS({
  "../node_modules/postcss-selector-parser/dist/sortAscending.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = sortAscending;
    function sortAscending(list) {
      return list.sort(function(a, b) {
        return a - b;
      });
    }
  }
});

// ../node_modules/postcss-selector-parser/dist/tokenTypes.js
var require_tokenTypes = __commonJS({
  "../node_modules/postcss-selector-parser/dist/tokenTypes.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.combinator = exports.word = exports.comment = exports.str = exports.tab = exports.newline = exports.feed = exports.cr = exports.backslash = exports.bang = exports.slash = exports.doubleQuote = exports.singleQuote = exports.space = exports.greaterThan = exports.pipe = exports.equals = exports.plus = exports.caret = exports.tilde = exports.dollar = exports.closeSquare = exports.openSquare = exports.closeParenthesis = exports.openParenthesis = exports.semicolon = exports.colon = exports.comma = exports.at = exports.asterisk = exports.ampersand = void 0;
    exports.ampersand = 38;
    exports.asterisk = 42;
    exports.at = 64;
    exports.comma = 44;
    exports.colon = 58;
    exports.semicolon = 59;
    exports.openParenthesis = 40;
    exports.closeParenthesis = 41;
    exports.openSquare = 91;
    exports.closeSquare = 93;
    exports.dollar = 36;
    exports.tilde = 126;
    exports.caret = 94;
    exports.plus = 43;
    exports.equals = 61;
    exports.pipe = 124;
    exports.greaterThan = 62;
    exports.space = 32;
    exports.singleQuote = 39;
    exports.doubleQuote = 34;
    exports.slash = 47;
    exports.bang = 33;
    exports.backslash = 92;
    exports.cr = 13;
    exports.feed = 12;
    exports.newline = 10;
    exports.tab = 9;
    exports.str = exports.singleQuote;
    exports.comment = -1;
    exports.word = -2;
    exports.combinator = -3;
  }
});

// ../node_modules/postcss-selector-parser/dist/tokenize.js
var require_tokenize2 = __commonJS({
  "../node_modules/postcss-selector-parser/dist/tokenize.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i2 = 0; i2 < k.length; i2++) if (k[i2] !== "default") __createBinding(result, mod, k[i2]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    var _a;
    var _b;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FIELDS = void 0;
    exports.default = tokenize;
    var t = __importStar(require_tokenTypes());
    var unescapable = (_a = {}, _a[t.tab] = true, _a[t.newline] = true, _a[t.cr] = true, _a[t.feed] = true, _a);
    var wordDelimiters = (_b = {}, _b[t.space] = true, _b[t.tab] = true, _b[t.newline] = true, _b[t.cr] = true, _b[t.feed] = true, _b[t.ampersand] = true, _b[t.asterisk] = true, _b[t.bang] = true, _b[t.comma] = true, _b[t.colon] = true, _b[t.semicolon] = true, _b[t.openParenthesis] = true, _b[t.closeParenthesis] = true, _b[t.openSquare] = true, _b[t.closeSquare] = true, _b[t.singleQuote] = true, _b[t.doubleQuote] = true, _b[t.plus] = true, _b[t.pipe] = true, _b[t.tilde] = true, _b[t.greaterThan] = true, _b[t.equals] = true, _b[t.dollar] = true, _b[t.caret] = true, _b[t.slash] = true, _b);
    var hex = {};
    var hexChars = "0123456789abcdefABCDEF";
    for (i = 0; i < hexChars.length; i++) {
      hex[hexChars.charCodeAt(i)] = true;
    }
    var i;
    function consumeWord(css, start) {
      var next = start;
      var code;
      do {
        code = css.charCodeAt(next);
        if (wordDelimiters[code]) {
          return next - 1;
        } else if (code === t.backslash) {
          next = consumeEscape(css, next) + 1;
        } else {
          next++;
        }
      } while (next < css.length);
      return next - 1;
    }
    function consumeEscape(css, start) {
      var next = start;
      var code = css.charCodeAt(next + 1);
      if (unescapable[code]) {
      } else if (hex[code]) {
        var hexDigits = 0;
        do {
          next++;
          hexDigits++;
          code = css.charCodeAt(next + 1);
        } while (hex[code] && hexDigits < 6);
        if (hexDigits < 6 && code === t.space) {
          next++;
        }
      } else {
        next++;
      }
      return next;
    }
    exports.FIELDS = {
      TYPE: 0,
      START_LINE: 1,
      START_COL: 2,
      END_LINE: 3,
      END_COL: 4,
      START_POS: 5,
      END_POS: 6
    };
    function tokenize(input) {
      var tokens = [];
      var css = input.css.valueOf();
      var length = css.length;
      var offset = -1;
      var line = 1;
      var start = 0;
      var end = 0;
      var code, content, endColumn, endLine, escaped, escapePos, last, lines, next, nextLine, nextOffset, quote, tokenType;
      function unclosed(what, fix) {
        if (input.safe) {
          css += fix;
          next = css.length - 1;
        } else {
          throw input.error("Unclosed " + what, line, start - offset, start);
        }
      }
      while (start < length) {
        code = css.charCodeAt(start);
        if (code === t.newline) {
          offset = start;
          line += 1;
        }
        switch (code) {
          case t.space:
          case t.tab:
          case t.newline:
          case t.cr:
          case t.feed:
            next = start;
            do {
              next += 1;
              code = css.charCodeAt(next);
              if (code === t.newline) {
                offset = next;
                line += 1;
              }
            } while (code === t.space || code === t.newline || code === t.tab || code === t.cr || code === t.feed);
            tokenType = t.space;
            endLine = line;
            endColumn = next - offset - 1;
            end = next;
            break;
          case t.plus:
          case t.greaterThan:
          case t.tilde:
          case t.pipe:
            next = start;
            do {
              next += 1;
              code = css.charCodeAt(next);
            } while (code === t.plus || code === t.greaterThan || code === t.tilde || code === t.pipe);
            tokenType = t.combinator;
            endLine = line;
            endColumn = start - offset;
            end = next;
            break;
          // Consume these characters as single tokens.
          case t.asterisk:
          case t.ampersand:
          case t.bang:
          case t.comma:
          case t.equals:
          case t.dollar:
          case t.caret:
          case t.openSquare:
          case t.closeSquare:
          case t.colon:
          case t.semicolon:
          case t.openParenthesis:
          case t.closeParenthesis:
            next = start;
            tokenType = code;
            endLine = line;
            endColumn = start - offset;
            end = next + 1;
            break;
          case t.singleQuote:
          case t.doubleQuote:
            quote = code === t.singleQuote ? "'" : '"';
            next = start;
            do {
              escaped = false;
              next = css.indexOf(quote, next + 1);
              if (next === -1) {
                unclosed("quote", quote);
              }
              escapePos = next;
              while (css.charCodeAt(escapePos - 1) === t.backslash) {
                escapePos -= 1;
                escaped = !escaped;
              }
            } while (escaped);
            tokenType = t.str;
            endLine = line;
            endColumn = start - offset;
            end = next + 1;
            break;
          default:
            if (code === t.slash && css.charCodeAt(start + 1) === t.asterisk) {
              next = css.indexOf("*/", start + 2) + 1;
              if (next === 0) {
                unclosed("comment", "*/");
              }
              content = css.slice(start, next + 1);
              lines = content.split("\n");
              last = lines.length - 1;
              if (last > 0) {
                nextLine = line + last;
                nextOffset = next - lines[last].length;
              } else {
                nextLine = line;
                nextOffset = offset;
              }
              tokenType = t.comment;
              line = nextLine;
              endLine = nextLine;
              endColumn = next - nextOffset;
            } else if (code === t.slash) {
              next = start;
              tokenType = code;
              endLine = line;
              endColumn = start - offset;
              end = next + 1;
            } else {
              next = consumeWord(css, start);
              tokenType = t.word;
              endLine = line;
              endColumn = next - offset;
            }
            end = next + 1;
            break;
        }
        tokens.push([
          tokenType,
          // [0] Token type
          line,
          // [1] Starting line
          start - offset,
          // [2] Starting column
          endLine,
          // [3] Ending line
          endColumn,
          // [4] Ending column
          start,
          // [5] Start position / Source index
          end
          // [6] End position
        ]);
        if (nextOffset) {
          offset = nextOffset;
          nextOffset = null;
        }
        start = end;
      }
      return tokens;
    }
  }
});

// ../node_modules/postcss-selector-parser/dist/parser.js
var require_parser2 = __commonJS({
  "../node_modules/postcss-selector-parser/dist/parser.js"(exports) {
    "use strict";
    var __assign = exports && exports.__assign || function() {
      __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    var __read = exports && exports.__read || function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from, pack) {
      if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
      return to.concat(ar || Array.prototype.slice.call(from));
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    var _a;
    var _b;
    Object.defineProperty(exports, "__esModule", { value: true });
    var root_1 = __importDefault(require_root2());
    var selector_1 = __importDefault(require_selector());
    var className_1 = __importDefault(require_className());
    var comment_1 = __importDefault(require_comment2());
    var id_1 = __importDefault(require_id());
    var tag_1 = __importDefault(require_tag());
    var string_1 = __importDefault(require_string());
    var pseudo_1 = __importDefault(require_pseudo());
    var attribute_1 = __importStar(require_attribute());
    var universal_1 = __importDefault(require_universal());
    var combinator_1 = __importDefault(require_combinator());
    var nesting_1 = __importDefault(require_nesting());
    var sortAscending_1 = __importDefault(require_sortAscending());
    var tokenize_1 = __importStar(require_tokenize2());
    var tokens = __importStar(require_tokenTypes());
    var types = __importStar(require_types());
    var util_1 = require_util2();
    var WHITESPACE_TOKENS = (_a = {}, _a[tokens.space] = true, _a[tokens.cr] = true, _a[tokens.feed] = true, _a[tokens.newline] = true, _a[tokens.tab] = true, _a);
    var WHITESPACE_EQUIV_TOKENS = __assign(__assign({}, WHITESPACE_TOKENS), (_b = {}, _b[tokens.comment] = true, _b));
    function tokenStart(token) {
      return {
        line: token[tokenize_1.FIELDS.START_LINE],
        column: token[tokenize_1.FIELDS.START_COL]
      };
    }
    function tokenEnd(token) {
      return {
        line: token[tokenize_1.FIELDS.END_LINE],
        column: token[tokenize_1.FIELDS.END_COL]
      };
    }
    function getSource(startLine, startColumn, endLine, endColumn) {
      return {
        start: {
          line: startLine,
          column: startColumn
        },
        end: {
          line: endLine,
          column: endColumn
        }
      };
    }
    function getTokenSource(token) {
      return getSource(token[tokenize_1.FIELDS.START_LINE], token[tokenize_1.FIELDS.START_COL], token[tokenize_1.FIELDS.END_LINE], token[tokenize_1.FIELDS.END_COL]);
    }
    function getTokenSourceSpan(startToken, endToken) {
      if (!startToken) {
        return void 0;
      }
      return getSource(startToken[tokenize_1.FIELDS.START_LINE], startToken[tokenize_1.FIELDS.START_COL], endToken[tokenize_1.FIELDS.END_LINE], endToken[tokenize_1.FIELDS.END_COL]);
    }
    function unescapeProp(node, prop) {
      var value = node[prop];
      if (typeof value !== "string") {
        return;
      }
      if (value.indexOf("\\") !== -1) {
        (0, util_1.ensureObject)(node, "raws");
        node[prop] = (0, util_1.unesc)(value);
        if (node.raws[prop] === void 0) {
          node.raws[prop] = value;
        }
      }
      return node;
    }
    function indexesOf(array, item) {
      var i = -1;
      var indexes = [];
      while ((i = array.indexOf(item, i + 1)) !== -1) {
        indexes.push(i);
      }
      return indexes;
    }
    function uniqs() {
      return Array.from(new Set(Array.prototype.concat.apply([], arguments)));
    }
    var Parser = (
      /** @class */
      (function() {
        function Parser2(rule, options) {
          if (options === void 0) {
            options = {};
          }
          this.rule = rule;
          this.options = Object.assign({ lossy: false, safe: false }, options);
          this.position = 0;
          this.nestingDepth = 0;
          this.maxNestingDepth = (0, util_1.resolveMaxNestingDepth)(this.options.maxNestingDepth);
          this.css = typeof this.rule === "string" ? this.rule : this.rule.selector;
          this.tokens = (0, tokenize_1.default)({
            css: this.css,
            error: this._errorGenerator(),
            safe: this.options.safe
          });
          var rootSource = getTokenSourceSpan(this.tokens[0], this.tokens[this.tokens.length - 1]);
          this.root = new root_1.default({ source: rootSource });
          this.root.errorGenerator = this._errorGenerator();
          var selector = new selector_1.default({
            source: { start: { line: 1, column: 1 } },
            sourceIndex: 0
          });
          this.root.append(selector);
          this.current = selector;
          this.loop();
        }
        Parser2.prototype._errorGenerator = function() {
          var _this = this;
          return function(message, errorOptions) {
            if (typeof _this.rule === "string") {
              return new Error(message);
            }
            return _this.rule.error(message, errorOptions);
          };
        };
        Parser2.prototype.attribute = function() {
          var attr = [];
          var startingToken = this.currToken;
          this.position++;
          while (this.position < this.tokens.length && this.currToken[tokenize_1.FIELDS.TYPE] !== tokens.closeSquare) {
            attr.push(this.currToken);
            this.position++;
          }
          if (!this.currToken) {
            return this.expected("closing square bracket", startingToken[tokenize_1.FIELDS.START_POS]);
          }
          if (this.currToken[tokenize_1.FIELDS.TYPE] !== tokens.closeSquare) {
            return this.expected("closing square bracket", this.currToken[tokenize_1.FIELDS.START_POS]);
          }
          var len = attr.length;
          var node = {
            source: getSource(startingToken[1], startingToken[2], this.currToken[3], this.currToken[4]),
            sourceIndex: startingToken[tokenize_1.FIELDS.START_POS]
          };
          if (len === 1 && !~[tokens.word].indexOf(attr[0][tokenize_1.FIELDS.TYPE])) {
            return this.expected("attribute", attr[0][tokenize_1.FIELDS.START_POS]);
          }
          var pos = 0;
          var spaceBefore = "";
          var commentBefore = "";
          var lastAdded = null;
          var spaceAfterMeaningfulToken = false;
          while (pos < len) {
            var token = attr[pos];
            var content = this.content(token);
            var next = attr[pos + 1];
            switch (token[tokenize_1.FIELDS.TYPE]) {
              case tokens.space:
                spaceAfterMeaningfulToken = true;
                if (this.options.lossy) {
                  break;
                }
                if (lastAdded) {
                  (0, util_1.ensureObject)(node, "spaces", lastAdded);
                  var prevContent = node.spaces[lastAdded].after || "";
                  node.spaces[lastAdded].after = prevContent + content;
                  var existingComment = (0, util_1.getProp)(node, "raws", "spaces", lastAdded, "after") || null;
                  if (existingComment) {
                    node.raws.spaces[lastAdded].after = existingComment + content;
                  }
                } else {
                  spaceBefore = spaceBefore + content;
                  commentBefore = commentBefore + content;
                }
                break;
              case tokens.asterisk:
                if (next[tokenize_1.FIELDS.TYPE] === tokens.equals) {
                  node.operator = content;
                  lastAdded = "operator";
                } else if ((!node.namespace || lastAdded === "namespace" && !spaceAfterMeaningfulToken) && next) {
                  if (spaceBefore) {
                    (0, util_1.ensureObject)(node, "spaces", "attribute");
                    node.spaces.attribute.before = spaceBefore;
                    spaceBefore = "";
                  }
                  if (commentBefore) {
                    (0, util_1.ensureObject)(node, "raws", "spaces", "attribute");
                    node.raws.spaces.attribute.before = commentBefore;
                    commentBefore = "";
                  }
                  node.namespace = (node.namespace || "") + content;
                  var rawValue = (0, util_1.getProp)(node, "raws", "namespace") || null;
                  if (rawValue) {
                    node.raws.namespace += content;
                  }
                  lastAdded = "namespace";
                }
                spaceAfterMeaningfulToken = false;
                break;
              case tokens.dollar:
                if (lastAdded === "value") {
                  var oldRawValue = (0, util_1.getProp)(node, "raws", "value");
                  node.value += "$";
                  if (oldRawValue) {
                    node.raws.value = oldRawValue + "$";
                  }
                  break;
                }
              // Falls through
              case tokens.caret:
                if (next[tokenize_1.FIELDS.TYPE] === tokens.equals) {
                  node.operator = content;
                  lastAdded = "operator";
                }
                spaceAfterMeaningfulToken = false;
                break;
              case tokens.combinator:
                if (content === "~" && next[tokenize_1.FIELDS.TYPE] === tokens.equals) {
                  node.operator = content;
                  lastAdded = "operator";
                }
                if (content !== "|") {
                  spaceAfterMeaningfulToken = false;
                  break;
                }
                if (next[tokenize_1.FIELDS.TYPE] === tokens.equals) {
                  node.operator = content;
                  lastAdded = "operator";
                } else if (!node.namespace && !node.attribute) {
                  node.namespace = true;
                }
                spaceAfterMeaningfulToken = false;
                break;
              case tokens.word:
                if (next && this.content(next) === "|" && attr[pos + 2] && attr[pos + 2][tokenize_1.FIELDS.TYPE] !== tokens.equals && // this look-ahead probably fails with comment nodes involved.
                !node.operator && !node.namespace) {
                  node.namespace = content;
                  lastAdded = "namespace";
                } else if (!node.attribute || lastAdded === "attribute" && !spaceAfterMeaningfulToken) {
                  if (spaceBefore) {
                    (0, util_1.ensureObject)(node, "spaces", "attribute");
                    node.spaces.attribute.before = spaceBefore;
                    spaceBefore = "";
                  }
                  if (commentBefore) {
                    (0, util_1.ensureObject)(node, "raws", "spaces", "attribute");
                    node.raws.spaces.attribute.before = commentBefore;
                    commentBefore = "";
                  }
                  node.attribute = (node.attribute || "") + content;
                  var rawValue = (0, util_1.getProp)(node, "raws", "attribute") || null;
                  if (rawValue) {
                    node.raws.attribute += content;
                  }
                  lastAdded = "attribute";
                } else if (!node.value && node.value !== "" || lastAdded === "value" && !(spaceAfterMeaningfulToken || node.quoteMark)) {
                  var unescaped_1 = (0, util_1.unesc)(content);
                  var oldRawValue = (0, util_1.getProp)(node, "raws", "value") || "";
                  var oldValue = node.value || "";
                  node.value = oldValue + unescaped_1;
                  node.quoteMark = null;
                  if (unescaped_1 !== content || oldRawValue) {
                    (0, util_1.ensureObject)(node, "raws");
                    node.raws.value = (oldRawValue || oldValue) + content;
                  }
                  lastAdded = "value";
                } else {
                  var insensitive = content === "i" || content === "I";
                  if ((node.value || node.value === "") && (node.quoteMark || spaceAfterMeaningfulToken)) {
                    node.insensitive = insensitive;
                    if (!insensitive || content === "I") {
                      (0, util_1.ensureObject)(node, "raws");
                      node.raws.insensitiveFlag = content;
                    }
                    lastAdded = "insensitive";
                    if (spaceBefore) {
                      (0, util_1.ensureObject)(node, "spaces", "insensitive");
                      node.spaces.insensitive.before = spaceBefore;
                      spaceBefore = "";
                    }
                    if (commentBefore) {
                      (0, util_1.ensureObject)(node, "raws", "spaces", "insensitive");
                      node.raws.spaces.insensitive.before = commentBefore;
                      commentBefore = "";
                    }
                  } else if (node.value || node.value === "") {
                    lastAdded = "value";
                    node.value += content;
                    if (node.raws.value) {
                      node.raws.value += content;
                    }
                  }
                }
                spaceAfterMeaningfulToken = false;
                break;
              case tokens.str:
                if (!node.attribute || !node.operator) {
                  return this.error("Expected an attribute followed by an operator preceding the string.", {
                    index: token[tokenize_1.FIELDS.START_POS]
                  });
                }
                var _a2 = (0, attribute_1.unescapeValue)(content), unescaped = _a2.unescaped, quoteMark = _a2.quoteMark;
                node.value = unescaped;
                node.quoteMark = quoteMark;
                lastAdded = "value";
                (0, util_1.ensureObject)(node, "raws");
                node.raws.value = content;
                spaceAfterMeaningfulToken = false;
                break;
              case tokens.equals:
                if (!node.attribute) {
                  return this.expected("attribute", token[tokenize_1.FIELDS.START_POS], content);
                }
                if (node.value) {
                  return this.error('Unexpected "=" found; an operator was already defined.', {
                    index: token[tokenize_1.FIELDS.START_POS]
                  });
                }
                node.operator = node.operator ? node.operator + content : content;
                lastAdded = "operator";
                spaceAfterMeaningfulToken = false;
                break;
              case tokens.comment:
                if (lastAdded) {
                  if (spaceAfterMeaningfulToken || next && next[tokenize_1.FIELDS.TYPE] === tokens.space || lastAdded === "insensitive") {
                    var lastComment = (0, util_1.getProp)(node, "spaces", lastAdded, "after") || "";
                    var rawLastComment = (0, util_1.getProp)(node, "raws", "spaces", lastAdded, "after") || lastComment;
                    (0, util_1.ensureObject)(node, "raws", "spaces", lastAdded);
                    node.raws.spaces[lastAdded].after = rawLastComment + content;
                  } else {
                    var lastValue = node[lastAdded] || "";
                    var rawLastValue = (0, util_1.getProp)(node, "raws", lastAdded) || lastValue;
                    (0, util_1.ensureObject)(node, "raws");
                    node.raws[lastAdded] = rawLastValue + content;
                  }
                } else {
                  commentBefore = commentBefore + content;
                }
                break;
              default:
                return this.error('Unexpected "'.concat(content, '" found.'), { index: token[tokenize_1.FIELDS.START_POS] });
            }
            pos++;
          }
          unescapeProp(node, "attribute");
          unescapeProp(node, "namespace");
          this.newNode(new attribute_1.default(node));
          this.position++;
        };
        Parser2.prototype.parseWhitespaceEquivalentTokens = function(stopPosition) {
          if (stopPosition < 0) {
            stopPosition = this.tokens.length;
          }
          var startPosition = this.position;
          var nodes = [];
          var space = "";
          var lastComment = void 0;
          do {
            if (WHITESPACE_TOKENS[this.currToken[tokenize_1.FIELDS.TYPE]]) {
              if (!this.options.lossy) {
                space += this.content();
              }
            } else if (this.currToken[tokenize_1.FIELDS.TYPE] === tokens.comment) {
              var spaces = {};
              if (space) {
                spaces.before = space;
                space = "";
              }
              lastComment = new comment_1.default({
                value: this.content(),
                source: getTokenSource(this.currToken),
                sourceIndex: this.currToken[tokenize_1.FIELDS.START_POS],
                spaces
              });
              nodes.push(lastComment);
            }
          } while (++this.position < stopPosition);
          if (space) {
            if (lastComment) {
              lastComment.spaces.after = space;
            } else if (!this.options.lossy) {
              var firstToken = this.tokens[startPosition];
              var lastToken = this.tokens[this.position - 1];
              nodes.push(new string_1.default({
                value: "",
                source: getSource(firstToken[tokenize_1.FIELDS.START_LINE], firstToken[tokenize_1.FIELDS.START_COL], lastToken[tokenize_1.FIELDS.END_LINE], lastToken[tokenize_1.FIELDS.END_COL]),
                sourceIndex: firstToken[tokenize_1.FIELDS.START_POS],
                spaces: { before: space, after: "" }
              }));
            }
          }
          return nodes;
        };
        Parser2.prototype.convertWhitespaceNodesToSpace = function(nodes, requiredSpace) {
          var _this = this;
          if (requiredSpace === void 0) {
            requiredSpace = false;
          }
          var space = "";
          var rawSpace = "";
          nodes.forEach(function(n) {
            var spaceBefore = _this.lossySpace(n.spaces.before, requiredSpace);
            var rawSpaceBefore = _this.lossySpace(n.rawSpaceBefore, requiredSpace);
            space += spaceBefore + _this.lossySpace(n.spaces.after, requiredSpace && spaceBefore.length === 0);
            rawSpace += spaceBefore + n.value + _this.lossySpace(n.rawSpaceAfter, requiredSpace && rawSpaceBefore.length === 0);
          });
          if (rawSpace === space) {
            rawSpace = void 0;
          }
          var result = { space, rawSpace };
          return result;
        };
        Parser2.prototype.isNamedCombinator = function(position) {
          if (position === void 0) {
            position = this.position;
          }
          return this.tokens[position + 0] && this.tokens[position + 0][tokenize_1.FIELDS.TYPE] === tokens.slash && this.tokens[position + 1] && this.tokens[position + 1][tokenize_1.FIELDS.TYPE] === tokens.word && this.tokens[position + 2] && this.tokens[position + 2][tokenize_1.FIELDS.TYPE] === tokens.slash;
        };
        Parser2.prototype.namedCombinator = function() {
          if (this.isNamedCombinator()) {
            var nameRaw = this.content(this.tokens[this.position + 1]);
            var name = (0, util_1.unesc)(nameRaw).toLowerCase();
            var raws = {};
            if (name !== nameRaw) {
              raws.value = "/".concat(nameRaw, "/");
            }
            var node = new combinator_1.default({
              value: "/".concat(name, "/"),
              source: getSource(this.currToken[tokenize_1.FIELDS.START_LINE], this.currToken[tokenize_1.FIELDS.START_COL], this.tokens[this.position + 2][tokenize_1.FIELDS.END_LINE], this.tokens[this.position + 2][tokenize_1.FIELDS.END_COL]),
              sourceIndex: this.currToken[tokenize_1.FIELDS.START_POS],
              raws
            });
            this.position = this.position + 3;
            return node;
          } else {
            this.unexpected();
          }
        };
        Parser2.prototype.combinator = function() {
          var _this = this;
          if (this.content() === "|") {
            return this.namespace();
          }
          var nextSigTokenPos = this.locateNextMeaningfulToken(this.position);
          if (nextSigTokenPos < 0 || this.tokens[nextSigTokenPos][tokenize_1.FIELDS.TYPE] === tokens.comma || this.tokens[nextSigTokenPos][tokenize_1.FIELDS.TYPE] === tokens.closeParenthesis) {
            var nodes = this.parseWhitespaceEquivalentTokens(nextSigTokenPos);
            if (nodes.length > 0) {
              var last = this.current.last;
              if (last) {
                var _a2 = this.convertWhitespaceNodesToSpace(nodes), space = _a2.space, rawSpace = _a2.rawSpace;
                if (rawSpace !== void 0) {
                  last.rawSpaceAfter += rawSpace;
                }
                last.spaces.after += space;
              } else {
                nodes.forEach(function(n) {
                  return _this.newNode(n);
                });
              }
            }
            return;
          }
          var firstToken = this.currToken;
          var spaceOrDescendantSelectorNodes = void 0;
          if (nextSigTokenPos > this.position) {
            spaceOrDescendantSelectorNodes = this.parseWhitespaceEquivalentTokens(nextSigTokenPos);
          }
          var node;
          if (this.isNamedCombinator()) {
            node = this.namedCombinator();
          } else if (this.currToken[tokenize_1.FIELDS.TYPE] === tokens.combinator) {
            node = new combinator_1.default({
              value: this.content(),
              source: getTokenSource(this.currToken),
              sourceIndex: this.currToken[tokenize_1.FIELDS.START_POS]
            });
            this.position++;
          } else if (WHITESPACE_TOKENS[this.currToken[tokenize_1.FIELDS.TYPE]]) {
          } else if (!spaceOrDescendantSelectorNodes) {
            this.unexpected();
          }
          if (node) {
            if (spaceOrDescendantSelectorNodes) {
              var _b2 = this.convertWhitespaceNodesToSpace(spaceOrDescendantSelectorNodes), space = _b2.space, rawSpace = _b2.rawSpace;
              node.spaces.before = space;
              node.rawSpaceBefore = rawSpace;
            }
          } else {
            var _c = this.convertWhitespaceNodesToSpace(spaceOrDescendantSelectorNodes, true), space = _c.space, rawSpace = _c.rawSpace;
            if (!rawSpace) {
              rawSpace = space;
            }
            var spaces = {};
            var raws = { spaces: {} };
            if (space.endsWith(" ") && rawSpace.endsWith(" ")) {
              spaces.before = space.slice(0, space.length - 1);
              raws.spaces.before = rawSpace.slice(0, rawSpace.length - 1);
            } else if (space[0] === " " && rawSpace[0] === " ") {
              spaces.after = space.slice(1);
              raws.spaces.after = rawSpace.slice(1);
            } else {
              raws.value = rawSpace;
            }
            node = new combinator_1.default({
              value: " ",
              source: getTokenSourceSpan(firstToken, this.tokens[this.position - 1]),
              sourceIndex: firstToken[tokenize_1.FIELDS.START_POS],
              spaces,
              raws
            });
          }
          if (this.currToken && this.currToken[tokenize_1.FIELDS.TYPE] === tokens.space) {
            node.spaces.after = this.optionalSpace(this.content());
            this.position++;
          }
          return this.newNode(node);
        };
        Parser2.prototype.comma = function() {
          if (this.position === this.tokens.length - 1) {
            this.root.trailingComma = true;
            this.position++;
            return;
          }
          this.current._inferEndPosition();
          var selector = new selector_1.default({
            source: {
              start: tokenStart(this.tokens[this.position + 1])
            },
            sourceIndex: this.tokens[this.position + 1][tokenize_1.FIELDS.START_POS]
          });
          this.current.parent.append(selector);
          this.current = selector;
          this.position++;
        };
        Parser2.prototype.comment = function() {
          var current = this.currToken;
          this.newNode(new comment_1.default({
            value: this.content(),
            source: getTokenSource(current),
            sourceIndex: current[tokenize_1.FIELDS.START_POS]
          }));
          this.position++;
        };
        Parser2.prototype.error = function(message, opts) {
          throw this.root.error(message, opts);
        };
        Parser2.prototype.missingBackslash = function() {
          return this.error("Expected a backslash preceding the semicolon.", {
            index: this.currToken[tokenize_1.FIELDS.START_POS]
          });
        };
        Parser2.prototype.missingParenthesis = function() {
          return this.expected("opening parenthesis", this.currToken[tokenize_1.FIELDS.START_POS]);
        };
        Parser2.prototype.missingSquareBracket = function() {
          return this.expected("opening square bracket", this.currToken[tokenize_1.FIELDS.START_POS]);
        };
        Parser2.prototype.unexpected = function() {
          return this.error("Unexpected '".concat(this.content(), "'. Escaping special characters with \\ may help."), this.currToken[tokenize_1.FIELDS.START_POS]);
        };
        Parser2.prototype.unexpectedPipe = function() {
          return this.error("Unexpected '|'.", this.currToken[tokenize_1.FIELDS.START_POS]);
        };
        Parser2.prototype.namespace = function() {
          var prev = this.prevToken;
          var before = prev && (prev[tokenize_1.FIELDS.TYPE] === tokens.word || prev[tokenize_1.FIELDS.TYPE] === tokens.asterisk || prev[tokenize_1.FIELDS.TYPE] === tokens.ampersand) ? this.content(prev) : true;
          if (!this.nextToken) {
            return this.unexpectedPipe();
          }
          if (this.nextToken[tokenize_1.FIELDS.TYPE] === tokens.word) {
            this.position++;
            return this.word(before);
          } else if (this.nextToken[tokenize_1.FIELDS.TYPE] === tokens.asterisk) {
            this.position++;
            return this.universal(before);
          }
          this.unexpectedPipe();
        };
        Parser2.prototype.nesting = function() {
          if (this.nextToken) {
            var nextContent = this.content(this.nextToken);
            if (nextContent === "|") {
              this.position++;
              return;
            }
          }
          var current = this.currToken;
          this.newNode(new nesting_1.default({
            value: this.content(),
            source: getTokenSource(current),
            sourceIndex: current[tokenize_1.FIELDS.START_POS]
          }));
          this.position++;
        };
        Parser2.prototype.parentheses = function() {
          var last = this.current.last;
          var unbalanced = 1;
          var openingToken = this.currToken;
          this.position++;
          if (last && last.type === types.PSEUDO) {
            var selector = new selector_1.default({
              source: { start: tokenStart(this.tokens[this.position]) },
              sourceIndex: this.tokens[this.position][tokenize_1.FIELDS.START_POS]
            });
            var cache = this.current;
            last.append(selector);
            this.current = selector;
            this.nestingDepth++;
            try {
              if (this.nestingDepth > this.maxNestingDepth) {
                this.error("Cannot parse selector: nesting depth exceeds the maximum of ".concat(this.maxNestingDepth, "."), { index: this.currToken[tokenize_1.FIELDS.START_POS] });
              }
              while (this.position < this.tokens.length && unbalanced) {
                if (this.currToken[tokenize_1.FIELDS.TYPE] === tokens.openParenthesis) {
                  unbalanced++;
                }
                if (this.currToken[tokenize_1.FIELDS.TYPE] === tokens.closeParenthesis) {
                  unbalanced--;
                }
                if (unbalanced) {
                  this.parse();
                } else {
                  this.current.source.end = tokenEnd(this.currToken);
                  this.current.parent.source.end = tokenEnd(this.currToken);
                  this.position++;
                }
              }
            } finally {
              this.nestingDepth--;
            }
            this.current = cache;
          } else {
            var parenStart = this.currToken;
            var parenValue = "(";
            var parenEnd = void 0;
            while (this.position < this.tokens.length && unbalanced) {
              if (this.currToken[tokenize_1.FIELDS.TYPE] === tokens.openParenthesis) {
                unbalanced++;
              }
              if (this.currToken[tokenize_1.FIELDS.TYPE] === tokens.closeParenthesis) {
                unbalanced--;
              }
              parenEnd = this.currToken;
              parenValue += this.parseParenthesisToken(this.currToken);
              this.position++;
            }
            if (last) {
              last.appendToPropertyAndEscape("value", parenValue, parenValue);
            } else {
              this.newNode(new string_1.default({
                value: parenValue,
                source: getSource(parenStart[tokenize_1.FIELDS.START_LINE], parenStart[tokenize_1.FIELDS.START_COL], parenEnd[tokenize_1.FIELDS.END_LINE], parenEnd[tokenize_1.FIELDS.END_COL]),
                sourceIndex: parenStart[tokenize_1.FIELDS.START_POS]
              }));
            }
          }
          if (unbalanced) {
            return this.expected("closing parenthesis", (this.currToken || openingToken)[tokenize_1.FIELDS.START_POS]);
          }
        };
        Parser2.prototype.pseudo = function() {
          var _this = this;
          var pseudoStr = "";
          var startingToken = this.currToken;
          while (this.currToken && this.currToken[tokenize_1.FIELDS.TYPE] === tokens.colon) {
            pseudoStr += this.content();
            this.position++;
          }
          if (!this.currToken) {
            return this.expected(["pseudo-class", "pseudo-element"], this.position - 1);
          }
          if (this.currToken[tokenize_1.FIELDS.TYPE] === tokens.word) {
            this.splitWord(false, function(first, length) {
              pseudoStr += first;
              _this.newNode(new pseudo_1.default({
                value: pseudoStr,
                source: getTokenSourceSpan(startingToken, _this.currToken),
                sourceIndex: startingToken[tokenize_1.FIELDS.START_POS]
              }));
              if (length > 1 && _this.nextToken && _this.nextToken[tokenize_1.FIELDS.TYPE] === tokens.openParenthesis) {
                _this.error("Misplaced parenthesis.", {
                  index: _this.nextToken[tokenize_1.FIELDS.START_POS]
                });
              }
            });
          } else {
            return this.expected(["pseudo-class", "pseudo-element"], this.currToken[tokenize_1.FIELDS.START_POS]);
          }
        };
        Parser2.prototype.space = function() {
          var content = this.content();
          if (this.position === 0 || this.prevToken[tokenize_1.FIELDS.TYPE] === tokens.comma || this.prevToken[tokenize_1.FIELDS.TYPE] === tokens.openParenthesis || this.current.nodes.every(function(node) {
            return node.type === "comment";
          })) {
            this.spaces = this.optionalSpace(content);
            this.position++;
          } else if (this.position === this.tokens.length - 1 || this.nextToken[tokenize_1.FIELDS.TYPE] === tokens.comma || this.nextToken[tokenize_1.FIELDS.TYPE] === tokens.closeParenthesis) {
            this.current.last.spaces.after = this.optionalSpace(content);
            this.position++;
          } else {
            this.combinator();
          }
        };
        Parser2.prototype.string = function() {
          var current = this.currToken;
          this.newNode(new string_1.default({
            value: this.content(),
            source: getTokenSource(current),
            sourceIndex: current[tokenize_1.FIELDS.START_POS]
          }));
          this.position++;
        };
        Parser2.prototype.universal = function(namespace) {
          var nextToken = this.nextToken;
          if (nextToken && this.content(nextToken) === "|") {
            this.position++;
            return this.namespace();
          }
          var current = this.currToken;
          this.newNode(new universal_1.default({
            value: this.content(),
            source: getTokenSource(current),
            sourceIndex: current[tokenize_1.FIELDS.START_POS]
          }), namespace);
          this.position++;
        };
        Parser2.prototype.splitWord = function(namespace, firstCallback) {
          var _this = this;
          var nextToken = this.nextToken;
          var word = this.content();
          while (nextToken && ~[tokens.dollar, tokens.caret, tokens.equals, tokens.word].indexOf(nextToken[tokenize_1.FIELDS.TYPE])) {
            this.position++;
            var current = this.content();
            word += current;
            if (current.lastIndexOf("\\") === current.length - 1) {
              var next = this.nextToken;
              if (next && next[tokenize_1.FIELDS.TYPE] === tokens.space) {
                word += this.requiredSpace(this.content(next));
                this.position++;
              }
            }
            nextToken = this.nextToken;
          }
          var hasClass = indexesOf(word, ".").filter(function(i) {
            var escapedDot = word[i - 1] === "\\";
            var isKeyframesPercent = /^\d+\.\d+%$/.test(word);
            return !escapedDot && !isKeyframesPercent;
          });
          var hasId = indexesOf(word, "#").filter(function(i) {
            return word[i - 1] !== "\\";
          });
          var interpolations = indexesOf(word, "#{");
          if (interpolations.length) {
            var interpolationIndexes_1 = new Set(interpolations);
            hasId = hasId.filter(function(hashIndex) {
              return !interpolationIndexes_1.has(hashIndex);
            });
          }
          var classIndexes = new Set(hasClass);
          var idIndexes = new Set(hasId);
          var indices = (0, sortAscending_1.default)(uniqs(__spreadArray(__spreadArray([0], __read(hasClass), false), __read(hasId), false)));
          indices.forEach(function(ind, i) {
            var index = indices[i + 1] || word.length;
            var value = word.slice(ind, index);
            if (i === 0 && firstCallback) {
              return firstCallback.call(_this, value, indices.length);
            }
            var node;
            var current2 = _this.currToken;
            var sourceIndex = current2[tokenize_1.FIELDS.START_POS] + indices[i];
            var source = getSource(current2[1], current2[2] + ind, current2[3], current2[2] + (index - 1));
            if (classIndexes.has(ind)) {
              var classNameOpts = {
                value: value.slice(1),
                source,
                sourceIndex
              };
              node = new className_1.default(unescapeProp(classNameOpts, "value"));
            } else if (idIndexes.has(ind)) {
              var idOpts = {
                value: value.slice(1),
                source,
                sourceIndex
              };
              node = new id_1.default(unescapeProp(idOpts, "value"));
            } else {
              var tagOpts = {
                value,
                source,
                sourceIndex
              };
              unescapeProp(tagOpts, "value");
              node = new tag_1.default(tagOpts);
            }
            _this.newNode(node, namespace);
            namespace = null;
          });
          this.position++;
        };
        Parser2.prototype.word = function(namespace) {
          var nextToken = this.nextToken;
          if (nextToken && this.content(nextToken) === "|") {
            this.position++;
            return this.namespace();
          }
          return this.splitWord(namespace);
        };
        Parser2.prototype.loop = function() {
          while (this.position < this.tokens.length) {
            this.parse(true);
          }
          this.current._inferEndPosition();
          return this.root;
        };
        Parser2.prototype.parse = function(throwOnParenthesis) {
          switch (this.currToken[tokenize_1.FIELDS.TYPE]) {
            case tokens.space:
              this.space();
              break;
            case tokens.comment:
              this.comment();
              break;
            case tokens.openParenthesis:
              this.parentheses();
              break;
            case tokens.closeParenthesis:
              if (throwOnParenthesis) {
                this.missingParenthesis();
              }
              break;
            case tokens.openSquare:
              this.attribute();
              break;
            case tokens.dollar:
            case tokens.caret:
            case tokens.equals:
            case tokens.word:
              this.word();
              break;
            case tokens.colon:
              this.pseudo();
              break;
            case tokens.comma:
              this.comma();
              break;
            case tokens.asterisk:
              this.universal();
              break;
            case tokens.ampersand:
              this.nesting();
              break;
            case tokens.slash:
            case tokens.combinator:
              this.combinator();
              break;
            case tokens.str:
              this.string();
              break;
            // These cases throw; no break needed.
            case tokens.closeSquare:
              this.missingSquareBracket();
            case tokens.semicolon:
              this.missingBackslash();
            default:
              this.unexpected();
          }
        };
        Parser2.prototype.expected = function(description, index, found) {
          if (Array.isArray(description)) {
            var last = description.pop();
            description = "".concat(description.join(", "), " or ").concat(last);
          }
          var an = /^[aeiou]/.test(description[0]) ? "an" : "a";
          if (!found) {
            return this.error("Expected ".concat(an, " ").concat(description, "."), { index });
          }
          return this.error("Expected ".concat(an, " ").concat(description, ', found "').concat(found, '" instead.'), { index });
        };
        Parser2.prototype.requiredSpace = function(space) {
          return this.options.lossy ? " " : space;
        };
        Parser2.prototype.optionalSpace = function(space) {
          return this.options.lossy ? "" : space;
        };
        Parser2.prototype.lossySpace = function(space, required) {
          if (this.options.lossy) {
            return required ? " " : "";
          } else {
            return space;
          }
        };
        Parser2.prototype.parseParenthesisToken = function(token) {
          var content = this.content(token);
          if (token[tokenize_1.FIELDS.TYPE] === tokens.space) {
            return this.requiredSpace(content);
          } else {
            return content;
          }
        };
        Parser2.prototype.newNode = function(node, namespace) {
          if (namespace) {
            if (/^ +$/.test(namespace)) {
              if (!this.options.lossy) {
                this.spaces = (this.spaces || "") + namespace;
              }
              namespace = true;
            }
            node.namespace = namespace;
            unescapeProp(node, "namespace");
          }
          if (this.spaces) {
            node.spaces.before = this.spaces;
            this.spaces = "";
          }
          return this.current.append(node);
        };
        Parser2.prototype.content = function(token) {
          if (token === void 0) {
            token = this.currToken;
          }
          return this.css.slice(token[tokenize_1.FIELDS.START_POS], token[tokenize_1.FIELDS.END_POS]);
        };
        Object.defineProperty(Parser2.prototype, "currToken", {
          get: function() {
            return this.tokens[this.position];
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(Parser2.prototype, "nextToken", {
          get: function() {
            return this.tokens[this.position + 1];
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(Parser2.prototype, "prevToken", {
          get: function() {
            return this.tokens[this.position - 1];
          },
          enumerable: false,
          configurable: true
        });
        Parser2.prototype.locateNextMeaningfulToken = function(startPosition) {
          if (startPosition === void 0) {
            startPosition = this.position + 1;
          }
          var searchPosition = startPosition;
          while (searchPosition < this.tokens.length) {
            if (WHITESPACE_EQUIV_TOKENS[this.tokens[searchPosition][tokenize_1.FIELDS.TYPE]]) {
              searchPosition++;
              continue;
            } else {
              return searchPosition;
            }
          }
          return -1;
        };
        return Parser2;
      })()
    );
    exports.default = Parser;
  }
});

// ../node_modules/postcss-selector-parser/dist/processor.js
var require_processor2 = __commonJS({
  "../node_modules/postcss-selector-parser/dist/processor.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var parser_1 = __importDefault(require_parser2());
    var Processor = (
      /** @class */
      (function() {
        function Processor2(func, options) {
          this.func = func || function noop() {
          };
          this.funcRes = null;
          this.options = options;
        }
        Processor2.prototype._shouldUpdateSelector = function(rule, options) {
          if (options === void 0) {
            options = {};
          }
          var merged = Object.assign({}, this.options, options);
          if (merged.updateSelector === false) {
            return false;
          } else {
            return typeof rule !== "string";
          }
        };
        Processor2.prototype._isLossy = function(options) {
          if (options === void 0) {
            options = {};
          }
          var merged = Object.assign({}, this.options, options);
          if (merged.lossless === false) {
            return true;
          } else {
            return false;
          }
        };
        Processor2.prototype._root = function(rule, options) {
          if (options === void 0) {
            options = {};
          }
          var parser = new parser_1.default(rule, this._parseOptions(options));
          return parser.root;
        };
        Processor2.prototype._parseOptions = function(options) {
          var merged = Object.assign({}, this.options, options);
          return {
            lossy: this._isLossy(merged),
            maxNestingDepth: merged.maxNestingDepth
          };
        };
        Processor2.prototype._stringifyOptions = function(options) {
          var merged = Object.assign({}, this.options, options);
          return {
            maxNestingDepth: merged.maxNestingDepth
          };
        };
        Processor2.prototype._run = function(rule, options) {
          var _this = this;
          if (options === void 0) {
            options = {};
          }
          return new Promise(function(resolve, reject) {
            try {
              var root_1 = _this._root(rule, options);
              Promise.resolve(_this.func(root_1)).then(function(transform) {
                var string = void 0;
                if (_this._shouldUpdateSelector(rule, options)) {
                  string = root_1.toString(_this._stringifyOptions(options));
                  rule.selector = string;
                }
                return { transform, root: root_1, string };
              }).then(resolve, reject);
            } catch (e) {
              reject(e);
              return;
            }
          });
        };
        Processor2.prototype._runSync = function(rule, options) {
          if (options === void 0) {
            options = {};
          }
          var root = this._root(rule, options);
          var transform = this.func(root);
          if (transform && typeof transform.then === "function") {
            throw new Error("Selector processor returned a promise to a synchronous call.");
          }
          var string = void 0;
          if (options.updateSelector && typeof rule !== "string") {
            string = root.toString(this._stringifyOptions(options));
            rule.selector = string;
          }
          return { transform, root, string };
        };
        Processor2.prototype.ast = function(rule, options) {
          return this._run(rule, options).then(function(result) {
            return result.root;
          });
        };
        Processor2.prototype.astSync = function(rule, options) {
          return this._runSync(rule, options).root;
        };
        Processor2.prototype.transform = function(rule, options) {
          return this._run(rule, options).then(function(result) {
            return result.transform;
          });
        };
        Processor2.prototype.transformSync = function(rule, options) {
          return this._runSync(rule, options).transform;
        };
        Processor2.prototype.process = function(rule, options) {
          var _this = this;
          return this._run(rule, options).then(function(result) {
            return result.string || result.root.toString(_this._stringifyOptions(options));
          });
        };
        Processor2.prototype.processSync = function(rule, options) {
          var result = this._runSync(rule, options);
          return result.string || result.root.toString(this._stringifyOptions(options));
        };
        return Processor2;
      })()
    );
    exports.default = Processor;
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/constructors.js
var require_constructors = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/constructors.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.universal = exports.tag = exports.string = exports.selector = exports.root = exports.pseudo = exports.nesting = exports.id = exports.comment = exports.combinator = exports.className = exports.attribute = void 0;
    var attribute_1 = __importDefault(require_attribute());
    var className_1 = __importDefault(require_className());
    var combinator_1 = __importDefault(require_combinator());
    var comment_1 = __importDefault(require_comment2());
    var id_1 = __importDefault(require_id());
    var nesting_1 = __importDefault(require_nesting());
    var pseudo_1 = __importDefault(require_pseudo());
    var root_1 = __importDefault(require_root2());
    var selector_1 = __importDefault(require_selector());
    var string_1 = __importDefault(require_string());
    var tag_1 = __importDefault(require_tag());
    var universal_1 = __importDefault(require_universal());
    var attribute = function(opts) {
      return new attribute_1.default(opts);
    };
    exports.attribute = attribute;
    var className = function(opts) {
      return new className_1.default(opts);
    };
    exports.className = className;
    var combinator = function(opts) {
      return new combinator_1.default(opts);
    };
    exports.combinator = combinator;
    var comment = function(opts) {
      return new comment_1.default(opts);
    };
    exports.comment = comment;
    var id = function(opts) {
      return new id_1.default(opts);
    };
    exports.id = id;
    var nesting = function(opts) {
      return new nesting_1.default(opts);
    };
    exports.nesting = nesting;
    var pseudo = function(opts) {
      return new pseudo_1.default(opts);
    };
    exports.pseudo = pseudo;
    var root = function(opts) {
      return new root_1.default(opts);
    };
    exports.root = root;
    var selector = function(opts) {
      return new selector_1.default(opts);
    };
    exports.selector = selector;
    var string = function(opts) {
      return new string_1.default(opts);
    };
    exports.string = string;
    var tag = function(opts) {
      return new tag_1.default(opts);
    };
    exports.tag = tag;
    var universal = function(opts) {
      return new universal_1.default(opts);
    };
    exports.universal = universal;
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/guards.js
var require_guards = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/guards.js"(exports) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isUniversal = exports.isTag = exports.isString = exports.isSelector = exports.isRoot = exports.isPseudo = exports.isNesting = exports.isIdentifier = exports.isComment = exports.isCombinator = exports.isClassName = exports.isAttribute = void 0;
    exports.isNode = isNode;
    exports.isPseudoElement = isPseudoElement;
    exports.isPseudoClass = isPseudoClass;
    exports.isContainer = isContainer;
    exports.isNamespace = isNamespace;
    var types_1 = require_types();
    var IS_TYPE = (_a = {}, _a[types_1.ATTRIBUTE] = true, _a[types_1.CLASS] = true, _a[types_1.COMBINATOR] = true, _a[types_1.COMMENT] = true, _a[types_1.ID] = true, _a[types_1.NESTING] = true, _a[types_1.PSEUDO] = true, _a[types_1.ROOT] = true, _a[types_1.SELECTOR] = true, _a[types_1.STRING] = true, _a[types_1.TAG] = true, _a[types_1.UNIVERSAL] = true, _a);
    function isNode(node) {
      return typeof node === "object" && IS_TYPE[node.type];
    }
    function isNodeType(type, node) {
      return isNode(node) && node.type === type;
    }
    exports.isAttribute = isNodeType.bind(null, types_1.ATTRIBUTE);
    exports.isClassName = isNodeType.bind(null, types_1.CLASS);
    exports.isCombinator = isNodeType.bind(null, types_1.COMBINATOR);
    exports.isComment = isNodeType.bind(null, types_1.COMMENT);
    exports.isIdentifier = isNodeType.bind(null, types_1.ID);
    exports.isNesting = isNodeType.bind(null, types_1.NESTING);
    exports.isPseudo = isNodeType.bind(null, types_1.PSEUDO);
    exports.isRoot = isNodeType.bind(null, types_1.ROOT);
    exports.isSelector = isNodeType.bind(null, types_1.SELECTOR);
    exports.isString = isNodeType.bind(null, types_1.STRING);
    exports.isTag = isNodeType.bind(null, types_1.TAG);
    exports.isUniversal = isNodeType.bind(null, types_1.UNIVERSAL);
    function isPseudoElement(node) {
      return (0, exports.isPseudo)(node) && node.value && (node.value.startsWith("::") || node.value.toLowerCase() === ":before" || node.value.toLowerCase() === ":after" || node.value.toLowerCase() === ":first-letter" || node.value.toLowerCase() === ":first-line");
    }
    function isPseudoClass(node) {
      return (0, exports.isPseudo)(node) && !isPseudoElement(node);
    }
    function isContainer(node) {
      return !!(isNode(node) && node.walk);
    }
    function isNamespace(node) {
      return (0, exports.isAttribute)(node) || (0, exports.isTag)(node);
    }
  }
});

// ../node_modules/postcss-selector-parser/dist/selectors/index.js
var require_selectors = __commonJS({
  "../node_modules/postcss-selector-parser/dist/selectors/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_types(), exports);
    __exportStar(require_constructors(), exports);
    __exportStar(require_guards(), exports);
  }
});

// ../node_modules/postcss-selector-parser/dist/index.js
var require_dist = __commonJS({
  "../node_modules/postcss-selector-parser/dist/index.js"(exports, module) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    var processor_1 = __importDefault(require_processor2());
    var selectors = __importStar(require_selectors());
    var parser = function(processor) {
      return new processor_1.default(processor);
    };
    Object.assign(parser, selectors);
    delete parser.__esModule;
    module.exports = parser;
  }
});

// ../node_modules/postcss-value-parser/lib/parse.js
var require_parse2 = __commonJS({
  "../node_modules/postcss-value-parser/lib/parse.js"(exports, module) {
    var openParentheses = "(".charCodeAt(0);
    var closeParentheses = ")".charCodeAt(0);
    var singleQuote = "'".charCodeAt(0);
    var doubleQuote = '"'.charCodeAt(0);
    var backslash = "\\".charCodeAt(0);
    var slash = "/".charCodeAt(0);
    var comma = ",".charCodeAt(0);
    var colon = ":".charCodeAt(0);
    var star = "*".charCodeAt(0);
    var uLower = "u".charCodeAt(0);
    var uUpper = "U".charCodeAt(0);
    var plus = "+".charCodeAt(0);
    var isUnicodeRange = /^[a-f0-9?-]+$/i;
    module.exports = function(input) {
      var tokens = [];
      var value = input;
      var next, quote, prev, token, escape, escapePos, whitespacePos, parenthesesOpenPos;
      var pos = 0;
      var code = value.charCodeAt(pos);
      var max = value.length;
      var stack = [{ nodes: tokens }];
      var balanced = 0;
      var parent;
      var name = "";
      var before = "";
      var after = "";
      while (pos < max) {
        if (code <= 32) {
          next = pos;
          do {
            next += 1;
            code = value.charCodeAt(next);
          } while (code <= 32);
          token = value.slice(pos, next);
          prev = tokens[tokens.length - 1];
          if (code === closeParentheses && balanced) {
            after = token;
          } else if (prev && prev.type === "div") {
            prev.after = token;
            prev.sourceEndIndex += token.length;
          } else if (code === comma || code === colon || code === slash && value.charCodeAt(next + 1) !== star && (!parent || parent && parent.type === "function" && parent.value !== "calc")) {
            before = token;
          } else {
            tokens.push({
              type: "space",
              sourceIndex: pos,
              sourceEndIndex: next,
              value: token
            });
          }
          pos = next;
        } else if (code === singleQuote || code === doubleQuote) {
          next = pos;
          quote = code === singleQuote ? "'" : '"';
          token = {
            type: "string",
            sourceIndex: pos,
            quote
          };
          do {
            escape = false;
            next = value.indexOf(quote, next + 1);
            if (~next) {
              escapePos = next;
              while (value.charCodeAt(escapePos - 1) === backslash) {
                escapePos -= 1;
                escape = !escape;
              }
            } else {
              value += quote;
              next = value.length - 1;
              token.unclosed = true;
            }
          } while (escape);
          token.value = value.slice(pos + 1, next);
          token.sourceEndIndex = token.unclosed ? next : next + 1;
          tokens.push(token);
          pos = next + 1;
          code = value.charCodeAt(pos);
        } else if (code === slash && value.charCodeAt(pos + 1) === star) {
          next = value.indexOf("*/", pos);
          token = {
            type: "comment",
            sourceIndex: pos,
            sourceEndIndex: next + 2
          };
          if (next === -1) {
            token.unclosed = true;
            next = value.length;
            token.sourceEndIndex = next;
          }
          token.value = value.slice(pos + 2, next);
          tokens.push(token);
          pos = next + 2;
          code = value.charCodeAt(pos);
        } else if ((code === slash || code === star) && parent && parent.type === "function" && parent.value === "calc") {
          token = value[pos];
          tokens.push({
            type: "word",
            sourceIndex: pos - before.length,
            sourceEndIndex: pos + token.length,
            value: token
          });
          pos += 1;
          code = value.charCodeAt(pos);
        } else if (code === slash || code === comma || code === colon) {
          token = value[pos];
          tokens.push({
            type: "div",
            sourceIndex: pos - before.length,
            sourceEndIndex: pos + token.length,
            value: token,
            before,
            after: ""
          });
          before = "";
          pos += 1;
          code = value.charCodeAt(pos);
        } else if (openParentheses === code) {
          next = pos;
          do {
            next += 1;
            code = value.charCodeAt(next);
          } while (code <= 32);
          parenthesesOpenPos = pos;
          token = {
            type: "function",
            sourceIndex: pos - name.length,
            value: name,
            before: value.slice(parenthesesOpenPos + 1, next)
          };
          pos = next;
          if (name === "url" && code !== singleQuote && code !== doubleQuote) {
            next -= 1;
            do {
              escape = false;
              next = value.indexOf(")", next + 1);
              if (~next) {
                escapePos = next;
                while (value.charCodeAt(escapePos - 1) === backslash) {
                  escapePos -= 1;
                  escape = !escape;
                }
              } else {
                value += ")";
                next = value.length - 1;
                token.unclosed = true;
              }
            } while (escape);
            whitespacePos = next;
            do {
              whitespacePos -= 1;
              code = value.charCodeAt(whitespacePos);
            } while (code <= 32);
            if (parenthesesOpenPos < whitespacePos) {
              if (pos !== whitespacePos + 1) {
                token.nodes = [
                  {
                    type: "word",
                    sourceIndex: pos,
                    sourceEndIndex: whitespacePos + 1,
                    value: value.slice(pos, whitespacePos + 1)
                  }
                ];
              } else {
                token.nodes = [];
              }
              if (token.unclosed && whitespacePos + 1 !== next) {
                token.after = "";
                token.nodes.push({
                  type: "space",
                  sourceIndex: whitespacePos + 1,
                  sourceEndIndex: next,
                  value: value.slice(whitespacePos + 1, next)
                });
              } else {
                token.after = value.slice(whitespacePos + 1, next);
                token.sourceEndIndex = next;
              }
            } else {
              token.after = "";
              token.nodes = [];
            }
            pos = next + 1;
            token.sourceEndIndex = token.unclosed ? next : pos;
            code = value.charCodeAt(pos);
            tokens.push(token);
          } else {
            balanced += 1;
            token.after = "";
            token.sourceEndIndex = pos + 1;
            tokens.push(token);
            stack.push(token);
            tokens = token.nodes = [];
            parent = token;
          }
          name = "";
        } else if (closeParentheses === code && balanced) {
          pos += 1;
          code = value.charCodeAt(pos);
          parent.after = after;
          parent.sourceEndIndex += after.length;
          after = "";
          balanced -= 1;
          stack[stack.length - 1].sourceEndIndex = pos;
          stack.pop();
          parent = stack[balanced];
          tokens = parent.nodes;
        } else {
          next = pos;
          do {
            if (code === backslash) {
              next += 1;
            }
            next += 1;
            code = value.charCodeAt(next);
          } while (next < max && !(code <= 32 || code === singleQuote || code === doubleQuote || code === comma || code === colon || code === slash || code === openParentheses || code === star && parent && parent.type === "function" && parent.value === "calc" || code === slash && parent.type === "function" && parent.value === "calc" || code === closeParentheses && balanced));
          token = value.slice(pos, next);
          if (openParentheses === code) {
            name = token;
          } else if ((uLower === token.charCodeAt(0) || uUpper === token.charCodeAt(0)) && plus === token.charCodeAt(1) && isUnicodeRange.test(token.slice(2))) {
            tokens.push({
              type: "unicode-range",
              sourceIndex: pos,
              sourceEndIndex: next,
              value: token
            });
          } else {
            tokens.push({
              type: "word",
              sourceIndex: pos,
              sourceEndIndex: next,
              value: token
            });
          }
          pos = next;
        }
      }
      for (pos = stack.length - 1; pos; pos -= 1) {
        stack[pos].unclosed = true;
        stack[pos].sourceEndIndex = value.length;
      }
      return stack[0].nodes;
    };
  }
});

// ../node_modules/postcss-value-parser/lib/walk.js
var require_walk = __commonJS({
  "../node_modules/postcss-value-parser/lib/walk.js"(exports, module) {
    module.exports = function walk(nodes, cb, bubble) {
      var i, max, node, result;
      for (i = 0, max = nodes.length; i < max; i += 1) {
        node = nodes[i];
        if (!bubble) {
          result = cb(node, i, nodes);
        }
        if (result !== false && node.type === "function" && Array.isArray(node.nodes)) {
          walk(node.nodes, cb, bubble);
        }
        if (bubble) {
          cb(node, i, nodes);
        }
      }
    };
  }
});

// ../node_modules/postcss-value-parser/lib/stringify.js
var require_stringify2 = __commonJS({
  "../node_modules/postcss-value-parser/lib/stringify.js"(exports, module) {
    function stringifyNode(node, custom) {
      var type = node.type;
      var value = node.value;
      var buf;
      var customResult;
      if (custom && (customResult = custom(node)) !== void 0) {
        return customResult;
      } else if (type === "word" || type === "space") {
        return value;
      } else if (type === "string") {
        buf = node.quote || "";
        return buf + value + (node.unclosed ? "" : buf);
      } else if (type === "comment") {
        return "/*" + value + (node.unclosed ? "" : "*/");
      } else if (type === "div") {
        return (node.before || "") + value + (node.after || "");
      } else if (Array.isArray(node.nodes)) {
        buf = stringify(node.nodes, custom);
        if (type !== "function") {
          return buf;
        }
        return value + "(" + (node.before || "") + buf + (node.after || "") + (node.unclosed ? "" : ")");
      }
      return value;
    }
    function stringify(nodes, custom) {
      var result, i;
      if (Array.isArray(nodes)) {
        result = "";
        for (i = nodes.length - 1; ~i; i -= 1) {
          result = stringifyNode(nodes[i], custom) + result;
        }
        return result;
      }
      return stringifyNode(nodes, custom);
    }
    module.exports = stringify;
  }
});

// ../node_modules/postcss-value-parser/lib/unit.js
var require_unit = __commonJS({
  "../node_modules/postcss-value-parser/lib/unit.js"(exports, module) {
    var minus = "-".charCodeAt(0);
    var plus = "+".charCodeAt(0);
    var dot = ".".charCodeAt(0);
    var exp = "e".charCodeAt(0);
    var EXP = "E".charCodeAt(0);
    function likeNumber(value) {
      var code = value.charCodeAt(0);
      var nextCode;
      if (code === plus || code === minus) {
        nextCode = value.charCodeAt(1);
        if (nextCode >= 48 && nextCode <= 57) {
          return true;
        }
        var nextNextCode = value.charCodeAt(2);
        if (nextCode === dot && nextNextCode >= 48 && nextNextCode <= 57) {
          return true;
        }
        return false;
      }
      if (code === dot) {
        nextCode = value.charCodeAt(1);
        if (nextCode >= 48 && nextCode <= 57) {
          return true;
        }
        return false;
      }
      if (code >= 48 && code <= 57) {
        return true;
      }
      return false;
    }
    module.exports = function(value) {
      var pos = 0;
      var length = value.length;
      var code;
      var nextCode;
      var nextNextCode;
      if (length === 0 || !likeNumber(value)) {
        return false;
      }
      code = value.charCodeAt(pos);
      if (code === plus || code === minus) {
        pos++;
      }
      while (pos < length) {
        code = value.charCodeAt(pos);
        if (code < 48 || code > 57) {
          break;
        }
        pos += 1;
      }
      code = value.charCodeAt(pos);
      nextCode = value.charCodeAt(pos + 1);
      if (code === dot && nextCode >= 48 && nextCode <= 57) {
        pos += 2;
        while (pos < length) {
          code = value.charCodeAt(pos);
          if (code < 48 || code > 57) {
            break;
          }
          pos += 1;
        }
      }
      code = value.charCodeAt(pos);
      nextCode = value.charCodeAt(pos + 1);
      nextNextCode = value.charCodeAt(pos + 2);
      if ((code === exp || code === EXP) && (nextCode >= 48 && nextCode <= 57 || (nextCode === plus || nextCode === minus) && nextNextCode >= 48 && nextNextCode <= 57)) {
        pos += nextCode === plus || nextCode === minus ? 3 : 2;
        while (pos < length) {
          code = value.charCodeAt(pos);
          if (code < 48 || code > 57) {
            break;
          }
          pos += 1;
        }
      }
      return {
        number: value.slice(0, pos),
        unit: value.slice(pos)
      };
    };
  }
});

// ../node_modules/postcss-value-parser/lib/index.js
var require_lib = __commonJS({
  "../node_modules/postcss-value-parser/lib/index.js"(exports, module) {
    var parse = require_parse2();
    var walk = require_walk();
    var stringify = require_stringify2();
    function ValueParser(value) {
      if (this instanceof ValueParser) {
        this.nodes = parse(value);
        return this;
      }
      return new ValueParser(value);
    }
    ValueParser.prototype.toString = function() {
      return Array.isArray(this.nodes) ? stringify(this.nodes) : "";
    };
    ValueParser.prototype.walk = function(cb, bubble) {
      walk(this.nodes, cb, bubble);
      return this;
    };
    ValueParser.unit = require_unit();
    ValueParser.walk = walk;
    ValueParser.stringify = stringify;
    module.exports = ValueParser;
  }
});

// ../node_modules/postcss-modules-local-by-default/src/index.js
var require_src3 = __commonJS({
  "../node_modules/postcss-modules-local-by-default/src/index.js"(exports, module) {
    "use strict";
    var selectorParser = require_dist();
    var valueParser = require_lib();
    var { extractICSS } = require_src();
    var IGNORE_FILE_MARKER = "cssmodules-pure-no-check";
    var IGNORE_NEXT_LINE_MARKER = "cssmodules-pure-ignore";
    var isSpacing = (node) => node.type === "combinator" && node.value === " ";
    var isPureCheckDisabled = (root) => {
      for (const node of root.nodes) {
        if (node.type !== "comment") {
          return false;
        }
        if (node.text.trim().startsWith(IGNORE_FILE_MARKER)) {
          return true;
        }
      }
      return false;
    };
    function getIgnoreComment(node) {
      if (!node.parent) {
        return;
      }
      const indexInParent = node.parent.index(node);
      for (let i = indexInParent - 1; i >= 0; i--) {
        const prevNode = node.parent.nodes[i];
        if (prevNode.type === "comment") {
          if (prevNode.text.trimStart().startsWith(IGNORE_NEXT_LINE_MARKER)) {
            return prevNode;
          }
        } else {
          break;
        }
      }
    }
    function normalizeNodeArray(nodes) {
      const array = [];
      nodes.forEach((x) => {
        if (Array.isArray(x)) {
          normalizeNodeArray(x).forEach((item) => {
            array.push(item);
          });
        } else if (x) {
          array.push(x);
        }
      });
      if (array.length > 0 && isSpacing(array[array.length - 1])) {
        array.pop();
      }
      return array;
    }
    var isPureSelectorSymbol = /* @__PURE__ */ Symbol("is-pure-selector");
    function localizeNode(rule, mode, localAliasMap) {
      const transform = (node, context) => {
        if (context.ignoreNextSpacing && !isSpacing(node)) {
          throw new Error("Missing whitespace after " + context.ignoreNextSpacing);
        }
        if (context.enforceNoSpacing && isSpacing(node)) {
          throw new Error("Missing whitespace before " + context.enforceNoSpacing);
        }
        let newNodes;
        switch (node.type) {
          case "root": {
            let resultingGlobal;
            context.hasPureGlobals = false;
            newNodes = node.nodes.map((n) => {
              const nContext = {
                global: context.global,
                lastWasSpacing: true,
                hasLocals: false,
                explicit: false
              };
              n = transform(n, nContext);
              if (typeof resultingGlobal === "undefined") {
                resultingGlobal = nContext.global;
              } else if (resultingGlobal !== nContext.global) {
                throw new Error(
                  'Inconsistent rule global/local result in rule "' + node + '" (multiple selectors must result in the same mode for the rule)'
                );
              }
              if (!nContext.hasLocals) {
                context.hasPureGlobals = true;
              }
              return n;
            });
            context.global = resultingGlobal;
            node.nodes = normalizeNodeArray(newNodes);
            break;
          }
          case "selector": {
            newNodes = node.map((childNode) => transform(childNode, context));
            node = node.clone();
            node.nodes = normalizeNodeArray(newNodes);
            break;
          }
          case "combinator": {
            if (isSpacing(node)) {
              if (context.ignoreNextSpacing) {
                context.ignoreNextSpacing = false;
                context.lastWasSpacing = false;
                context.enforceNoSpacing = false;
                return null;
              }
              context.lastWasSpacing = true;
              return node;
            }
            break;
          }
          case "pseudo": {
            let childContext;
            const isNested = !!node.length;
            const isScoped = node.value === ":local" || node.value === ":global";
            const isImportExport = node.value === ":import" || node.value === ":export";
            if (isImportExport) {
              context.hasLocals = true;
            } else if (isNested) {
              if (isScoped) {
                if (node.nodes.length === 0) {
                  throw new Error(`${node.value}() can't be empty`);
                }
                if (context.inside) {
                  throw new Error(
                    `A ${node.value} is not allowed inside of a ${context.inside}(...)`
                  );
                }
                childContext = {
                  global: node.value === ":global",
                  inside: node.value,
                  hasLocals: false,
                  explicit: true
                };
                newNodes = node.map((childNode) => transform(childNode, childContext)).reduce((acc, next) => acc.concat(next.nodes), []);
                if (newNodes.length) {
                  const { before, after } = node.spaces;
                  const first = newNodes[0];
                  const last = newNodes[newNodes.length - 1];
                  first.spaces = { before, after: first.spaces.after };
                  last.spaces = { before: last.spaces.before, after };
                }
                node = newNodes;
                break;
              } else {
                childContext = {
                  global: context.global,
                  inside: context.inside,
                  lastWasSpacing: true,
                  hasLocals: false,
                  explicit: context.explicit
                };
                newNodes = node.map((childNode) => {
                  const newContext = {
                    ...childContext,
                    enforceNoSpacing: false
                  };
                  const result = transform(childNode, newContext);
                  childContext.global = newContext.global;
                  childContext.hasLocals = newContext.hasLocals;
                  return result;
                });
                node = node.clone();
                node.nodes = normalizeNodeArray(newNodes);
                if (childContext.hasLocals) {
                  context.hasLocals = true;
                }
              }
              break;
            } else if (isScoped) {
              if (context.inside) {
                throw new Error(
                  `A ${node.value} is not allowed inside of a ${context.inside}(...)`
                );
              }
              const addBackSpacing = !!node.spaces.before;
              context.ignoreNextSpacing = context.lastWasSpacing ? node.value : false;
              context.enforceNoSpacing = context.lastWasSpacing ? false : node.value;
              context.global = node.value === ":global";
              context.explicit = true;
              return addBackSpacing ? selectorParser.combinator({ value: " " }) : null;
            }
            break;
          }
          case "id":
          case "class": {
            if (!node.value) {
              throw new Error("Invalid class or id selector syntax");
            }
            if (context.global) {
              break;
            }
            const isImportedValue = localAliasMap.has(node.value);
            const isImportedWithExplicitScope = isImportedValue && context.explicit;
            if (!isImportedValue || isImportedWithExplicitScope) {
              const innerNode = node.clone();
              innerNode.spaces = { before: "", after: "" };
              node = selectorParser.pseudo({
                value: ":local",
                nodes: [innerNode],
                spaces: node.spaces
              });
              context.hasLocals = true;
            }
            break;
          }
          case "nesting": {
            if (node.value === "&") {
              context.hasLocals = rule.parent[isPureSelectorSymbol];
            }
          }
        }
        context.lastWasSpacing = false;
        context.ignoreNextSpacing = false;
        context.enforceNoSpacing = false;
        return node;
      };
      const rootContext = {
        global: mode === "global",
        hasPureGlobals: false
      };
      rootContext.selector = selectorParser((root) => {
        transform(root, rootContext);
      }).processSync(rule, { updateSelector: false, lossless: true });
      return rootContext;
    }
    function localizeDeclNode(node, context) {
      switch (node.type) {
        case "word":
          if (context.localizeNextItem) {
            if (!context.localAliasMap.has(node.value)) {
              node.value = ":local(" + node.value + ")";
              context.localizeNextItem = false;
            }
          }
          break;
        case "function":
          if (context.options && context.options.rewriteUrl && node.value.toLowerCase() === "url") {
            node.nodes.map((nestedNode) => {
              if (nestedNode.type !== "string" && nestedNode.type !== "word") {
                return;
              }
              let newUrl = context.options.rewriteUrl(
                context.global,
                nestedNode.value
              );
              switch (nestedNode.type) {
                case "string":
                  if (nestedNode.quote === "'") {
                    newUrl = newUrl.replace(/(\\)/g, "\\$1").replace(/'/g, "\\'");
                  }
                  if (nestedNode.quote === '"') {
                    newUrl = newUrl.replace(/(\\)/g, "\\$1").replace(/"/g, '\\"');
                  }
                  break;
                case "word":
                  newUrl = newUrl.replace(/("|'|\)|\\)/g, "\\$1");
                  break;
              }
              nestedNode.value = newUrl;
            });
          }
          break;
      }
      return node;
    }
    var specialKeywords = [
      "none",
      "inherit",
      "initial",
      "revert",
      "revert-layer",
      "unset"
    ];
    function localizeDeclarationValues(localize, declaration, context) {
      const valueNodes = valueParser(declaration.value);
      valueNodes.walk((node, index, nodes) => {
        if (node.type === "function" && (node.value.toLowerCase() === "var" || node.value.toLowerCase() === "env")) {
          return false;
        }
        if (node.type === "word" && specialKeywords.includes(node.value.toLowerCase())) {
          return;
        }
        const subContext = {
          options: context.options,
          global: context.global,
          localizeNextItem: localize && !context.global,
          localAliasMap: context.localAliasMap
        };
        nodes[index] = localizeDeclNode(node, subContext);
      });
      declaration.value = valueNodes.toString();
    }
    var validIdent = /^-?([a-z\u0080-\uFFFF_]|(\\[^\r\n\f])|-(?![0-9]))((\\[^\r\n\f])|[a-z\u0080-\uFFFF_0-9-])*$/i;
    var animationKeywords = {
      // animation-direction
      $normal: 1,
      $reverse: 1,
      $alternate: 1,
      "$alternate-reverse": 1,
      // animation-fill-mode
      $forwards: 1,
      $backwards: 1,
      $both: 1,
      // animation-iteration-count
      $infinite: 1,
      // animation-play-state
      $paused: 1,
      $running: 1,
      // animation-timing-function
      $ease: 1,
      "$ease-in": 1,
      "$ease-out": 1,
      "$ease-in-out": 1,
      $linear: 1,
      "$step-end": 1,
      "$step-start": 1,
      // Special
      $none: Infinity,
      // No matter how many times you write none, it will never be an animation name
      // Global values
      $initial: Infinity,
      $inherit: Infinity,
      $unset: Infinity,
      $revert: Infinity,
      "$revert-layer": Infinity
    };
    function localizeDeclaration(declaration, context) {
      const isAnimation = /animation(-name)?$/i.test(declaration.prop);
      if (isAnimation) {
        let parsedAnimationKeywords = {};
        const valueNodes = valueParser(declaration.value).walk((node) => {
          if (node.type === "div") {
            parsedAnimationKeywords = {};
            return;
          } else if (node.type === "function" && node.value.toLowerCase() === "local" && node.nodes.length === 1) {
            node.type = "word";
            node.value = node.nodes[0].value;
            return localizeDeclNode(node, {
              options: context.options,
              global: context.global,
              localizeNextItem: true,
              localAliasMap: context.localAliasMap
            });
          } else if (node.type === "function") {
            if (node.value.toLowerCase() === "global" && node.nodes.length === 1) {
              node.type = "word";
              node.value = node.nodes[0].value;
            }
            return false;
          } else if (node.type !== "word") {
            return;
          }
          const value = node.type === "word" ? node.value.toLowerCase() : null;
          let shouldParseAnimationName = false;
          if (value && validIdent.test(value)) {
            if ("$" + value in animationKeywords) {
              parsedAnimationKeywords["$" + value] = "$" + value in parsedAnimationKeywords ? parsedAnimationKeywords["$" + value] + 1 : 0;
              shouldParseAnimationName = parsedAnimationKeywords["$" + value] >= animationKeywords["$" + value];
            } else {
              shouldParseAnimationName = true;
            }
          }
          return localizeDeclNode(node, {
            options: context.options,
            global: context.global,
            localizeNextItem: shouldParseAnimationName && !context.global,
            localAliasMap: context.localAliasMap
          });
        });
        declaration.value = valueNodes.toString();
        return;
      }
      if (/url\(/i.test(declaration.value)) {
        return localizeDeclarationValues(false, declaration, context);
      }
    }
    var isPureSelector = (context, rule) => {
      if (!rule.parent || rule.type === "root") {
        return !context.hasPureGlobals;
      }
      if (rule.type === "rule" && rule[isPureSelectorSymbol]) {
        return rule[isPureSelectorSymbol] || isPureSelector(context, rule.parent);
      }
      return !context.hasPureGlobals || isPureSelector(context, rule.parent);
    };
    var isNodeWithoutDeclarations = (rule) => {
      if (rule.nodes.length > 0) {
        return !rule.nodes.every(
          (item) => item.type === "rule" || item.type === "atrule" && !isNodeWithoutDeclarations(item)
        );
      }
      return true;
    };
    module.exports = (options = {}) => {
      if (options && options.mode && options.mode !== "global" && options.mode !== "local" && options.mode !== "pure") {
        throw new Error(
          'options.mode must be either "global", "local" or "pure" (default "local")'
        );
      }
      const pureMode = options && options.mode === "pure";
      const globalMode = options && options.mode === "global";
      return {
        postcssPlugin: "postcss-modules-local-by-default",
        prepare() {
          const localAliasMap = /* @__PURE__ */ new Map();
          return {
            Once(root) {
              const { icssImports } = extractICSS(root, false);
              const enforcePureMode = pureMode && !isPureCheckDisabled(root);
              Object.keys(icssImports).forEach((key) => {
                Object.keys(icssImports[key]).forEach((prop) => {
                  localAliasMap.set(prop, icssImports[key][prop]);
                });
              });
              root.walkAtRules((atRule) => {
                if (/keyframes$/i.test(atRule.name)) {
                  const globalMatch = /^\s*:global\s*\((.+)\)\s*$/.exec(
                    atRule.params
                  );
                  const localMatch = /^\s*:local\s*\((.+)\)\s*$/.exec(
                    atRule.params
                  );
                  let globalKeyframes = globalMode;
                  if (globalMatch) {
                    if (enforcePureMode) {
                      const ignoreComment = getIgnoreComment(atRule);
                      if (!ignoreComment) {
                        throw atRule.error(
                          "@keyframes :global(...) is not allowed in pure mode"
                        );
                      } else {
                        ignoreComment.remove();
                      }
                    }
                    atRule.params = globalMatch[1];
                    globalKeyframes = true;
                  } else if (localMatch) {
                    atRule.params = localMatch[0];
                    globalKeyframes = false;
                  } else if (atRule.params && !globalMode && !localAliasMap.has(atRule.params)) {
                    atRule.params = ":local(" + atRule.params + ")";
                  }
                  atRule.walkDecls((declaration) => {
                    localizeDeclaration(declaration, {
                      localAliasMap,
                      options,
                      global: globalKeyframes
                    });
                  });
                } else if (/scope$/i.test(atRule.name)) {
                  if (atRule.params) {
                    const ignoreComment = pureMode ? getIgnoreComment(atRule) : void 0;
                    if (ignoreComment) {
                      ignoreComment.remove();
                    }
                    atRule.params = atRule.params.split("to").map((item) => {
                      const selector = item.trim().slice(1, -1).trim();
                      const context = localizeNode(
                        selector,
                        options.mode,
                        localAliasMap
                      );
                      context.options = options;
                      context.localAliasMap = localAliasMap;
                      if (enforcePureMode && context.hasPureGlobals && !ignoreComment) {
                        throw atRule.error(
                          'Selector in at-rule"' + selector + '" is not pure (pure selectors must contain at least one local class or id)'
                        );
                      }
                      return `(${context.selector})`;
                    }).join(" to ");
                  }
                  atRule.nodes.forEach((declaration) => {
                    if (declaration.type === "decl") {
                      localizeDeclaration(declaration, {
                        localAliasMap,
                        options,
                        global: globalMode
                      });
                    }
                  });
                } else if (atRule.nodes) {
                  atRule.nodes.forEach((declaration) => {
                    if (declaration.type === "decl") {
                      localizeDeclaration(declaration, {
                        localAliasMap,
                        options,
                        global: globalMode
                      });
                    }
                  });
                }
              });
              root.walkRules((rule) => {
                if (rule.parent && rule.parent.type === "atrule" && /keyframes$/i.test(rule.parent.name)) {
                  return;
                }
                const context = localizeNode(rule, options.mode, localAliasMap);
                context.options = options;
                context.localAliasMap = localAliasMap;
                const ignoreComment = enforcePureMode ? getIgnoreComment(rule) : void 0;
                const isNotPure = enforcePureMode && !isPureSelector(context, rule);
                if (isNotPure && isNodeWithoutDeclarations(rule) && !ignoreComment) {
                  throw rule.error(
                    'Selector "' + rule.selector + '" is not pure (pure selectors must contain at least one local class or id)'
                  );
                } else if (ignoreComment) {
                  ignoreComment.remove();
                }
                if (pureMode) {
                  rule[isPureSelectorSymbol] = !isNotPure;
                }
                rule.selector = context.selector;
                if (rule.nodes) {
                  rule.nodes.forEach(
                    (declaration) => localizeDeclaration(declaration, context)
                  );
                }
              });
            }
          };
        }
      };
    };
    module.exports.postcss = true;
  }
});

// ../node_modules/postcss-modules-scope/src/index.js
var require_src4 = __commonJS({
  "../node_modules/postcss-modules-scope/src/index.js"(exports, module) {
    "use strict";
    var selectorParser = require_dist();
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function isNestedRule(rule) {
      if (!rule.parent || rule.parent.type === "root") {
        return false;
      }
      if (rule.parent.type === "rule") {
        return true;
      }
      return isNestedRule(rule.parent);
    }
    function getSingleLocalNamesForComposes(root, rule) {
      if (isNestedRule(rule)) {
        throw new Error(`composition is not allowed in nested rule 

${rule}`);
      }
      return root.nodes.map((node) => {
        if (node.type !== "selector" || node.nodes.length !== 1) {
          throw new Error(
            `composition is only allowed when selector is single :local class name not in "${root}"`
          );
        }
        node = node.nodes[0];
        if (node.type !== "pseudo" || node.value !== ":local" || node.nodes.length !== 1) {
          throw new Error(
            'composition is only allowed when selector is single :local class name not in "' + root + '", "' + node + '" is weird'
          );
        }
        node = node.first;
        if (node.type !== "selector" || node.length !== 1) {
          throw new Error(
            'composition is only allowed when selector is single :local class name not in "' + root + '", "' + node + '" is weird'
          );
        }
        node = node.first;
        if (node.type !== "class") {
          throw new Error(
            'composition is only allowed when selector is single :local class name not in "' + root + '", "' + node + '" is weird'
          );
        }
        return node.value;
      });
    }
    var whitespace = "[\\x20\\t\\r\\n\\f]";
    var unescapeRegExp = new RegExp(
      "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)",
      "ig"
    );
    function unescape2(str) {
      return str.replace(unescapeRegExp, (_, escaped, escapedWhitespace) => {
        const high = "0x" + escaped - 65536;
        return high !== high || escapedWhitespace ? escaped : high < 0 ? (
          // BMP codepoint
          String.fromCharCode(high + 65536)
        ) : (
          // Supplemental Plane codepoint (surrogate pair)
          String.fromCharCode(high >> 10 | 55296, high & 1023 | 56320)
        );
      });
    }
    var plugin = (options = {}) => {
      const generateScopedName = options && options.generateScopedName || plugin.generateScopedName;
      const generateExportEntry = options && options.generateExportEntry || plugin.generateExportEntry;
      const exportGlobals = options && options.exportGlobals;
      return {
        postcssPlugin: "postcss-modules-scope",
        Once(root, { rule }) {
          const exports2 = /* @__PURE__ */ Object.create(null);
          function exportScopedName(name, rawName, node) {
            const scopedName = generateScopedName(
              rawName ? rawName : name,
              root.source.input.from,
              root.source.input.css,
              node
            );
            const exportEntry = generateExportEntry(
              rawName ? rawName : name,
              scopedName,
              root.source.input.from,
              root.source.input.css,
              node
            );
            const { key, value } = exportEntry;
            exports2[key] = exports2[key] || [];
            if (exports2[key].indexOf(value) < 0) {
              exports2[key].push(value);
            }
            return scopedName;
          }
          function localizeNode(node) {
            switch (node.type) {
              case "selector":
                node.nodes = node.map((item) => localizeNode(item));
                return node;
              case "class":
                return selectorParser.className({
                  value: exportScopedName(
                    node.value,
                    node.raws && node.raws.value ? node.raws.value : null,
                    node
                  )
                });
              case "id": {
                return selectorParser.id({
                  value: exportScopedName(
                    node.value,
                    node.raws && node.raws.value ? node.raws.value : null,
                    node
                  )
                });
              }
              case "attribute": {
                if (node.attribute === "class" && node.operator === "=") {
                  return selectorParser.attribute({
                    attribute: node.attribute,
                    operator: node.operator,
                    quoteMark: "'",
                    value: exportScopedName(node.value, null, null)
                  });
                }
              }
            }
            throw new Error(
              `${node.type} ("${node}") is not allowed in a :local block`
            );
          }
          function traverseNode(node) {
            switch (node.type) {
              case "pseudo":
                if (node.value === ":local") {
                  if (node.nodes.length !== 1) {
                    throw new Error('Unexpected comma (",") in :local block');
                  }
                  const selector = localizeNode(node.first);
                  selector.first.spaces = node.spaces;
                  const nextNode = node.next();
                  if (nextNode && nextNode.type === "combinator" && nextNode.value === " " && /\\[A-F0-9]{1,6}$/.test(selector.last.value)) {
                    selector.last.spaces.after = " ";
                  }
                  node.replaceWith(selector);
                  return;
                }
              /* falls through */
              case "root":
              case "selector": {
                node.each((item) => traverseNode(item));
                break;
              }
              case "id":
              case "class":
                if (exportGlobals) {
                  exports2[node.value] = [node.value];
                }
                break;
            }
            return node;
          }
          const importedNames = {};
          root.walkRules(/^:import\(.+\)$/, (rule2) => {
            rule2.walkDecls((decl) => {
              importedNames[decl.prop] = true;
            });
          });
          root.walkRules((rule2) => {
            let parsedSelector = selectorParser().astSync(rule2);
            rule2.selector = traverseNode(parsedSelector.clone()).toString();
            rule2.walkDecls(/^(composes|compose-with)$/i, (decl) => {
              const localNames = getSingleLocalNamesForComposes(
                parsedSelector,
                decl.parent
              );
              const multiple = decl.value.split(",");
              multiple.forEach((value) => {
                const classes = value.trim().split(/\s+/);
                classes.forEach((className) => {
                  const global2 = /^global\(([^)]+)\)$/.exec(className);
                  if (global2) {
                    localNames.forEach((exportedName) => {
                      exports2[exportedName].push(global2[1]);
                    });
                  } else if (hasOwnProperty.call(importedNames, className)) {
                    localNames.forEach((exportedName) => {
                      exports2[exportedName].push(className);
                    });
                  } else if (hasOwnProperty.call(exports2, className)) {
                    localNames.forEach((exportedName) => {
                      exports2[className].forEach((item) => {
                        exports2[exportedName].push(item);
                      });
                    });
                  } else {
                    throw decl.error(
                      `referenced class name "${className}" in ${decl.prop} not found`
                    );
                  }
                });
              });
              decl.remove();
            });
            rule2.walkDecls((decl) => {
              if (!/:local\s*\((.+?)\)/.test(decl.value)) {
                return;
              }
              let tokens = decl.value.split(/(,|'[^']*'|"[^"]*")/);
              tokens = tokens.map((token, idx) => {
                if (idx === 0 || tokens[idx - 1] === ",") {
                  let result = token;
                  const localMatch = /:local\s*\((.+?)\)/.exec(token);
                  if (localMatch) {
                    const input = localMatch.input;
                    const matchPattern = localMatch[0];
                    const matchVal = localMatch[1];
                    const newVal = exportScopedName(matchVal);
                    result = input.replace(matchPattern, newVal);
                  } else {
                    return token;
                  }
                  return result;
                } else {
                  return token;
                }
              });
              decl.value = tokens.join("");
            });
          });
          root.walkAtRules(/keyframes$/i, (atRule) => {
            const localMatch = /^\s*:local\s*\((.+?)\)\s*$/.exec(atRule.params);
            if (!localMatch) {
              return;
            }
            atRule.params = exportScopedName(localMatch[1]);
          });
          root.walkAtRules(/scope$/i, (atRule) => {
            if (atRule.params) {
              atRule.params = atRule.params.split("to").map((item) => {
                const selector = item.trim().slice(1, -1).trim();
                const localMatch = /^\s*:local\s*\((.+?)\)\s*$/.exec(selector);
                if (!localMatch) {
                  return `(${selector})`;
                }
                let parsedSelector = selectorParser().astSync(selector);
                return `(${traverseNode(parsedSelector).toString()})`;
              }).join(" to ");
            }
          });
          const exportedNames = Object.keys(exports2);
          if (exportedNames.length > 0) {
            const exportRule = rule({ selector: ":export" });
            exportedNames.forEach(
              (exportedName) => exportRule.append({
                prop: exportedName,
                value: exports2[exportedName].join(" "),
                raws: { before: "\n  " }
              })
            );
            root.append(exportRule);
          }
        }
      };
    };
    plugin.postcss = true;
    plugin.generateScopedName = function(name, path) {
      const sanitisedPath = path.replace(/\.[^./\\]+$/, "").replace(/[\W_]+/g, "_").replace(/^_|_$/g, "");
      return `_${sanitisedPath}__${name}`.trim();
    };
    plugin.generateExportEntry = function(name, scopedName) {
      return {
        key: unescape2(name),
        value: unescape2(scopedName)
      };
    };
    module.exports = plugin;
  }
});

// ../node_modules/string-hash/index.js
var require_string_hash = __commonJS({
  "../node_modules/string-hash/index.js"(exports, module) {
    "use strict";
    function hash(str) {
      var hash2 = 5381, i = str.length;
      while (i) {
        hash2 = hash2 * 33 ^ str.charCodeAt(--i);
      }
      return hash2 >>> 0;
    }
    module.exports = hash;
  }
});

// ../node_modules/postcss-modules-values/src/index.js
var require_src5 = __commonJS({
  "../node_modules/postcss-modules-values/src/index.js"(exports, module) {
    "use strict";
    var ICSSUtils = require_src();
    var matchImports = /^(.+?|\([\s\S]+?\))\s+from\s+("[^"]*"|'[^']*'|[\w-]+)$/;
    var matchValueDefinition = /(?:\s+|^)([\w-]+):?(.*?)$/;
    var matchImport = /^([\w-]+)(?:\s+as\s+([\w-]+))?/;
    module.exports = (options) => {
      let importIndex = 0;
      const createImportedName = options && options.createImportedName || ((importName) => `i__const_${importName.replace(/\W/g, "_")}_${importIndex++}`);
      return {
        postcssPlugin: "postcss-modules-values",
        prepare(result) {
          const importAliases = [];
          const definitions = {};
          return {
            Once(root, postcss) {
              root.walkAtRules(/value/i, (atRule) => {
                const matches = atRule.params.match(matchImports);
                if (matches) {
                  let [
                    ,
                    /*match*/
                    aliases,
                    path
                  ] = matches;
                  if (definitions[path]) {
                    path = definitions[path];
                  }
                  const imports = aliases.replace(/^\(\s*([\s\S]+)\s*\)$/, "$1").split(/\s*,\s*/).map((alias) => {
                    const tokens = matchImport.exec(alias);
                    if (tokens) {
                      const [
                        ,
                        /*match*/
                        theirName,
                        myName = theirName
                      ] = tokens;
                      const importedName = createImportedName(myName);
                      definitions[myName] = importedName;
                      return { theirName, importedName };
                    } else {
                      throw new Error(`@import statement "${alias}" is invalid!`);
                    }
                  });
                  importAliases.push({ path, imports });
                  atRule.remove();
                  return;
                }
                if (atRule.params.indexOf("@value") !== -1) {
                  result.warn("Invalid value definition: " + atRule.params);
                }
                let [, key, value] = `${atRule.params}${atRule.raws.between}`.match(
                  matchValueDefinition
                );
                const normalizedValue = value.replace(/\/\*((?!\*\/).*?)\*\//g, "");
                if (normalizedValue.length === 0) {
                  result.warn("Invalid value definition: " + atRule.params);
                  atRule.remove();
                  return;
                }
                let isOnlySpace = /^\s+$/.test(normalizedValue);
                if (!isOnlySpace) {
                  value = value.trim();
                }
                definitions[key] = ICSSUtils.replaceValueSymbols(
                  value,
                  definitions
                );
                atRule.remove();
              });
              if (!Object.keys(definitions).length) {
                return;
              }
              ICSSUtils.replaceSymbols(root, definitions);
              const exportDeclarations = Object.keys(definitions).map(
                (key) => postcss.decl({
                  value: definitions[key],
                  prop: key,
                  raws: { before: "\n  " }
                })
              );
              if (exportDeclarations.length > 0) {
                const exportRule = postcss.rule({
                  selector: ":export",
                  raws: { after: "\n" }
                });
                exportRule.append(exportDeclarations);
                root.prepend(exportRule);
              }
              importAliases.reverse().forEach(({ path, imports }) => {
                const importRule = postcss.rule({
                  selector: `:import(${path})`,
                  raws: { after: "\n" }
                });
                imports.forEach(({ theirName, importedName }) => {
                  importRule.append({
                    value: theirName,
                    prop: importedName,
                    raws: { before: "\n  " }
                  });
                });
                root.prepend(importRule);
              });
            }
          };
        }
      };
    };
    module.exports.postcss = true;
  }
});

// ../node_modules/postcss-modules/build/scoping.js
var require_scoping = __commonJS({
  "../node_modules/postcss-modules/build/scoping.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.behaviours = void 0;
    exports.getDefaultPlugins = getDefaultPlugins;
    exports.getDefaultScopeBehaviour = getDefaultScopeBehaviour;
    exports.getScopedNameGenerator = getScopedNameGenerator;
    var _postcssModulesExtractImports = _interopRequireDefault(require_src2());
    var _genericNames = _interopRequireDefault(require_generic_names());
    var _postcssModulesLocalByDefault = _interopRequireDefault(require_src3());
    var _postcssModulesScope = _interopRequireDefault(require_src4());
    var _stringHash = _interopRequireDefault(require_string_hash());
    var _postcssModulesValues = _interopRequireDefault(require_src5());
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var behaviours = {
      LOCAL: "local",
      GLOBAL: "global"
    };
    exports.behaviours = behaviours;
    function getDefaultPlugins({
      behaviour,
      generateScopedName,
      exportGlobals
    }) {
      const scope = (0, _postcssModulesScope.default)({
        generateScopedName,
        exportGlobals
      });
      const plugins = {
        [behaviours.LOCAL]: [_postcssModulesValues.default, (0, _postcssModulesLocalByDefault.default)({
          mode: "local"
        }), _postcssModulesExtractImports.default, scope],
        [behaviours.GLOBAL]: [_postcssModulesValues.default, (0, _postcssModulesLocalByDefault.default)({
          mode: "global"
        }), _postcssModulesExtractImports.default, scope]
      };
      return plugins[behaviour];
    }
    function isValidBehaviour(behaviour) {
      return Object.keys(behaviours).map((key) => behaviours[key]).indexOf(behaviour) > -1;
    }
    function getDefaultScopeBehaviour(scopeBehaviour) {
      return scopeBehaviour && isValidBehaviour(scopeBehaviour) ? scopeBehaviour : behaviours.LOCAL;
    }
    function generateScopedNameDefault(name, filename, css) {
      const i = css.indexOf(`.${name}`);
      const lineNumber = css.substr(0, i).split(/[\r\n]/).length;
      const hash = (0, _stringHash.default)(css).toString(36).substr(0, 5);
      return `_${name}_${hash}_${lineNumber}`;
    }
    function getScopedNameGenerator(generateScopedName, hashPrefix) {
      const scopedNameGenerator = generateScopedName || generateScopedNameDefault;
      if (typeof scopedNameGenerator === "function") {
        return scopedNameGenerator;
      }
      return (0, _genericNames.default)(scopedNameGenerator, {
        context: process.cwd(),
        hashPrefix
      });
    }
  }
});

// ../node_modules/postcss-modules/build/pluginFactory.js
var require_pluginFactory = __commonJS({
  "../node_modules/postcss-modules/build/pluginFactory.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.makePlugin = makePlugin;
    var _postcss = _interopRequireDefault(require_postcss());
    var _unquote = _interopRequireDefault(require_unquote());
    var _Parser = _interopRequireDefault(require_Parser());
    var _saveJSON = _interopRequireDefault(require_saveJSON());
    var _localsConvention = require_localsConvention();
    var _FileSystemLoader = _interopRequireDefault(require_FileSystemLoader());
    var _scoping = require_scoping();
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var PLUGIN_NAME = "postcss-modules";
    function isGlobalModule(globalModules, inputFile) {
      return globalModules.some((regex) => inputFile.match(regex));
    }
    function getDefaultPluginsList(opts, inputFile) {
      const globalModulesList = opts.globalModulePaths || null;
      const exportGlobals = opts.exportGlobals || false;
      const defaultBehaviour = (0, _scoping.getDefaultScopeBehaviour)(opts.scopeBehaviour);
      const generateScopedName = (0, _scoping.getScopedNameGenerator)(opts.generateScopedName, opts.hashPrefix);
      if (globalModulesList && isGlobalModule(globalModulesList, inputFile)) {
        return (0, _scoping.getDefaultPlugins)({
          behaviour: _scoping.behaviours.GLOBAL,
          generateScopedName,
          exportGlobals
        });
      }
      return (0, _scoping.getDefaultPlugins)({
        behaviour: defaultBehaviour,
        generateScopedName,
        exportGlobals
      });
    }
    function getLoader(opts, plugins) {
      const root = typeof opts.root === "undefined" ? "/" : opts.root;
      return typeof opts.Loader === "function" ? new opts.Loader(root, plugins, opts.resolve) : new _FileSystemLoader.default(root, plugins, opts.resolve);
    }
    function isOurPlugin(plugin) {
      return plugin.postcssPlugin === PLUGIN_NAME;
    }
    function makePlugin(opts) {
      return {
        postcssPlugin: PLUGIN_NAME,
        async OnceExit(css, {
          result
        }) {
          const getJSON = opts.getJSON || _saveJSON.default;
          const inputFile = css.source.input.file;
          const pluginList = getDefaultPluginsList(opts, inputFile);
          const resultPluginIndex = result.processor.plugins.findIndex((plugin) => isOurPlugin(plugin));
          if (resultPluginIndex === -1) {
            throw new Error("Plugin missing from options.");
          }
          const earlierPlugins = result.processor.plugins.slice(0, resultPluginIndex);
          const loaderPlugins = [...earlierPlugins, ...pluginList];
          const loader = getLoader(opts, loaderPlugins);
          const fetcher = async (file, relativeTo, depTrace) => {
            const unquoteFile = (0, _unquote.default)(file);
            return loader.fetch.call(loader, unquoteFile, relativeTo, depTrace);
          };
          const parser = new _Parser.default(fetcher);
          await (0, _postcss.default)([...pluginList, parser.plugin()]).process(css, {
            from: inputFile
          });
          const out = loader.finalSource;
          if (out) css.prepend(out);
          if (opts.localsConvention) {
            const reducer = (0, _localsConvention.makeLocalsConventionReducer)(opts.localsConvention, inputFile);
            parser.exportTokens = Object.entries(parser.exportTokens).reduce(reducer, {});
          }
          result.messages.push({
            type: "export",
            plugin: "postcss-modules",
            exportTokens: parser.exportTokens
          });
          return getJSON(css.source.input.file, parser.exportTokens, result.opts.to);
        }
      };
    }
  }
});

// ../node_modules/postcss-modules/build/index.js
var require_build = __commonJS({
  "../node_modules/postcss-modules/build/index.js"(exports, module) {
    var _fs = __require("fs");
    var _fs2 = require_fs();
    var _pluginFactory = require_pluginFactory();
    (0, _fs2.setFileSystem)({
      readFile: _fs.readFile,
      writeFile: _fs.writeFile
    });
    module.exports = (opts = {}) => (0, _pluginFactory.makePlugin)(opts);
    module.exports.postcss = true;
  }
});
export default require_build();
/*! Bundled license information:

cssesc/cssesc.js:
  (*! https://mths.be/cssesc v3.0.0 by @mathias *)
*/
