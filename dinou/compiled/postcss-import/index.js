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

// ../node_modules/postcss-import/lib/format-import-prelude.js
var require_format_import_prelude = __commonJS({
  "../node_modules/postcss-import/lib/format-import-prelude.js"(exports, module) {
    "use strict";
    module.exports = function formatImportPrelude(layer, media, supports) {
      const parts = [];
      if (typeof layer !== "undefined") {
        let layerParams = "layer";
        if (layer) {
          layerParams = `layer(${layer})`;
        }
        parts.push(layerParams);
      }
      if (typeof supports !== "undefined") {
        parts.push(`supports(${supports})`);
      }
      if (typeof media !== "undefined") {
        parts.push(media);
      }
      return parts.join(" ");
    };
  }
});

// ../node_modules/postcss-import/lib/base64-encoded-import.js
var require_base64_encoded_import = __commonJS({
  "../node_modules/postcss-import/lib/base64-encoded-import.js"(exports, module) {
    "use strict";
    var formatImportPrelude = require_format_import_prelude();
    module.exports = function base64EncodedConditionalImport(prelude, conditions) {
      if (!conditions?.length) return prelude;
      conditions.reverse();
      const first = conditions.pop();
      let params = `${prelude} ${formatImportPrelude(
        first.layer,
        first.media,
        first.supports
      )}`;
      for (const condition of conditions) {
        params = `'data:text/css;base64,${Buffer.from(`@import ${params}`).toString(
          "base64"
        )}' ${formatImportPrelude(
          condition.layer,
          condition.media,
          condition.supports
        )}`;
      }
      return params;
    };
  }
});

// ../node_modules/postcss-import/lib/apply-conditions.js
var require_apply_conditions = __commonJS({
  "../node_modules/postcss-import/lib/apply-conditions.js"(exports, module) {
    "use strict";
    var base64EncodedConditionalImport = require_base64_encoded_import();
    module.exports = function applyConditions(bundle, atRule) {
      const firstImportStatementIndex = bundle.findIndex(
        (stmt) => stmt.type === "import"
      );
      const lastImportStatementIndex = bundle.findLastIndex(
        (stmt) => stmt.type === "import"
      );
      bundle.forEach((stmt, index) => {
        if (stmt.type === "charset" || stmt.type === "warning") {
          return;
        }
        if (stmt.type === "layer" && (index < lastImportStatementIndex && stmt.conditions?.length || index > firstImportStatementIndex && index < lastImportStatementIndex)) {
          stmt.type = "import";
          stmt.node = stmt.node.clone({
            name: "import",
            params: base64EncodedConditionalImport(
              `'data:text/css;base64,${Buffer.from(stmt.node.toString()).toString(
                "base64"
              )}'`,
              stmt.conditions
            )
          });
          return;
        }
        if (!stmt.conditions?.length) {
          return;
        }
        if (stmt.type === "import") {
          stmt.node.params = base64EncodedConditionalImport(
            stmt.fullUri,
            stmt.conditions
          );
          return;
        }
        let nodes;
        let parent;
        if (stmt.type === "layer") {
          nodes = [stmt.node];
          parent = stmt.node.parent;
        } else {
          nodes = stmt.nodes;
          parent = nodes[0].parent;
        }
        const atRules = [];
        for (const condition of stmt.conditions) {
          if (typeof condition.media !== "undefined") {
            const mediaNode = atRule({
              name: "media",
              params: condition.media,
              source: parent.source
            });
            atRules.push(mediaNode);
          }
          if (typeof condition.supports !== "undefined") {
            const supportsNode = atRule({
              name: "supports",
              params: `(${condition.supports})`,
              source: parent.source
            });
            atRules.push(supportsNode);
          }
          if (typeof condition.layer !== "undefined") {
            const layerNode = atRule({
              name: "layer",
              params: condition.layer,
              source: parent.source
            });
            atRules.push(layerNode);
          }
        }
        const outerAtRule = atRules.shift();
        const innerAtRule = atRules.reduce((previous, next) => {
          previous.append(next);
          return next;
        }, outerAtRule);
        parent.insertBefore(nodes[0], outerAtRule);
        nodes.forEach((node) => {
          node.parent = void 0;
        });
        nodes[0].raws.before = nodes[0].raws.before || "\n";
        innerAtRule.append(nodes);
        stmt.type = "nodes";
        stmt.nodes = [outerAtRule];
        delete stmt.node;
      });
    };
  }
});

// ../node_modules/postcss-import/lib/apply-raws.js
var require_apply_raws = __commonJS({
  "../node_modules/postcss-import/lib/apply-raws.js"(exports, module) {
    "use strict";
    module.exports = function applyRaws(bundle) {
      bundle.forEach((stmt, index) => {
        if (index === 0) return;
        if (stmt.type === "nodes") delete stmt.nodes[0].raws.before;
        else if (stmt.parent) delete stmt.node.raws.before;
      });
    };
  }
});

// ../node_modules/postcss-import/lib/apply-styles.js
var require_apply_styles = __commonJS({
  "../node_modules/postcss-import/lib/apply-styles.js"(exports, module) {
    "use strict";
    module.exports = function applyStyles(bundle, styles) {
      styles.nodes = [];
      bundle.forEach((stmt) => {
        if (["charset", "import", "layer"].includes(stmt.type)) {
          stmt.node.parent = void 0;
          styles.append(stmt.node);
        } else if (stmt.type === "nodes") {
          stmt.nodes.forEach((node) => {
            node.parent = void 0;
            styles.append(node);
          });
        }
      });
    };
  }
});

// ../node_modules/read-cache/index.js
var require_read_cache = __commonJS({
  "../node_modules/read-cache/index.js"(exports, module) {
    var fs = __require("fs");
    var path = __require("path");
    var resolve = path.resolve;
    function stat(path2) {
      return new Promise(function(resolve2, reject) {
        fs.stat(path2, function(err, stats) {
          if (err) {
            reject(err);
            return;
          }
          resolve2(stats);
        });
      });
    }
    function readFile(path2) {
      return new Promise(function(resolve2, reject) {
        fs.readFile(path2, function(err, data) {
          if (err) {
            reject(err);
            return;
          }
          resolve2(data);
        });
      });
    }
    var cache = /* @__PURE__ */ Object.create(null);
    function convert(content, encoding) {
      if (Buffer.isEncoding(encoding)) {
        return content.toString(encoding);
      }
      return content;
    }
    module.exports = function(path2, encoding) {
      path2 = resolve(path2);
      return stat(path2).then(function(stats) {
        var item = cache[path2];
        if (item && item.mtime.getTime() === stats.mtime.getTime()) {
          return convert(item.content, encoding);
        }
        return readFile(path2).then(function(data) {
          cache[path2] = {
            mtime: stats.mtime,
            content: data
          };
          return convert(data, encoding);
        });
      }).catch(function(err) {
        cache[path2] = null;
        return Promise.reject(err);
      });
    };
    module.exports.sync = function(path2, encoding) {
      path2 = resolve(path2);
      try {
        var stats = fs.statSync(path2);
        var item = cache[path2];
        if (item && item.mtime.getTime() === stats.mtime.getTime()) {
          return convert(item.content, encoding);
        }
        var data = fs.readFileSync(path2);
        cache[path2] = {
          mtime: stats.mtime,
          content: data
        };
        return convert(data, encoding);
      } catch (err) {
        cache[path2] = null;
        throw err;
      }
    };
    module.exports.get = function(path2, encoding) {
      path2 = resolve(path2);
      if (cache[path2]) {
        return convert(cache[path2].content, encoding);
      }
      return null;
    };
    module.exports.clear = function() {
      cache = /* @__PURE__ */ Object.create(null);
    };
  }
});

// ../node_modules/postcss-import/lib/data-url.js
var require_data_url = __commonJS({
  "../node_modules/postcss-import/lib/data-url.js"(exports, module) {
    "use strict";
    var anyDataURLRegexp = /^data:text\/css(?:;(base64|plain))?,/i;
    var base64DataURLRegexp = /^data:text\/css;base64,/i;
    var plainDataURLRegexp = /^data:text\/css;plain,/i;
    function isValid(url) {
      return anyDataURLRegexp.test(url);
    }
    function contents(url) {
      if (base64DataURLRegexp.test(url)) {
        return Buffer.from(url.slice(21), "base64").toString();
      }
      if (plainDataURLRegexp.test(url)) {
        return decodeURIComponent(url.slice(20));
      }
      return decodeURIComponent(url.slice(14));
    }
    module.exports = {
      isValid,
      contents
    };
  }
});

// ../node_modules/postcss-import/lib/load-content.js
var require_load_content = __commonJS({
  "../node_modules/postcss-import/lib/load-content.js"(exports, module) {
    "use strict";
    var readCache = require_read_cache();
    var dataURL = require_data_url();
    module.exports = function loadContent(filename) {
      if (dataURL.isValid(filename)) {
        return dataURL.contents(filename);
      }
      return readCache(filename, "utf-8");
    };
  }
});

// ../node_modules/postcss-value-parser/lib/parse.js
var require_parse = __commonJS({
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
var require_stringify = __commonJS({
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
    var parse = require_parse();
    var walk = require_walk();
    var stringify = require_stringify();
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

// ../node_modules/postcss-import/lib/parse-statements.js
var require_parse_statements = __commonJS({
  "../node_modules/postcss-import/lib/parse-statements.js"(exports, module) {
    "use strict";
    var valueParser = require_lib();
    var { stringify } = valueParser;
    module.exports = function parseStatements(result, styles, conditions, from) {
      const statements = [];
      let nodes = [];
      let encounteredNonImportNodes = false;
      styles.each((node) => {
        let stmt;
        if (node.type === "atrule") {
          if (node.name === "import")
            stmt = parseImport(result, node, conditions, from);
          else if (node.name === "charset")
            stmt = parseCharset(result, node, conditions, from);
          else if (node.name === "layer" && !encounteredNonImportNodes && !node.nodes)
            stmt = parseLayer(result, node, conditions, from);
        } else if (node.type !== "comment") {
          encounteredNonImportNodes = true;
        }
        if (stmt) {
          if (nodes.length) {
            statements.push({
              type: "nodes",
              nodes,
              conditions: [...conditions],
              from
            });
            nodes = [];
          }
          statements.push(stmt);
        } else nodes.push(node);
      });
      if (nodes.length) {
        statements.push({
          type: "nodes",
          nodes,
          conditions: [...conditions],
          from
        });
      }
      return statements;
    };
    function parseCharset(result, atRule, conditions, from) {
      if (atRule.prev()) {
        return result.warn("@charset must precede all other statements", {
          node: atRule
        });
      }
      return {
        type: "charset",
        node: atRule,
        conditions: [...conditions],
        from
      };
    }
    function parseImport(result, atRule, conditions, from) {
      let prev = atRule.prev();
      if (prev) {
        do {
          if (prev.type === "comment" || prev.type === "atrule" && prev.name === "import") {
            prev = prev.prev();
            continue;
          }
          break;
        } while (prev);
      }
      if (prev) {
        do {
          if (prev.type === "comment" || prev.type === "atrule" && (prev.name === "charset" || prev.name === "layer" && !prev.nodes)) {
            prev = prev.prev();
            continue;
          }
          return result.warn(
            "@import statements must precede all other statements (besides @charset or empty @layer) and be consecutive",
            { node: atRule }
          );
        } while (prev);
      }
      if (atRule.nodes) {
        return result.warn(
          "It looks like you didn't end your @import statement correctly. Child nodes are attached to it.",
          { node: atRule }
        );
      }
      const params = valueParser(atRule.params).nodes;
      const stmt = {
        type: "import",
        uri: "",
        fullUri: "",
        node: atRule,
        conditions: [...conditions],
        from
      };
      let layer;
      let media;
      let supports;
      for (let i = 0; i < params.length; i++) {
        const node = params[i];
        if (node.type === "space" || node.type === "comment") continue;
        if (node.type === "string") {
          if (stmt.uri) {
            return result.warn(`Multiple url's in '${atRule.toString()}'`, {
              node: atRule
            });
          }
          if (!node.value) {
            return result.warn(`Unable to find uri in '${atRule.toString()}'`, {
              node: atRule
            });
          }
          stmt.uri = node.value;
          stmt.fullUri = stringify(node);
          continue;
        }
        if (node.type === "function" && /^url$/i.test(node.value)) {
          if (stmt.uri) {
            return result.warn(`Multiple url's in '${atRule.toString()}'`, {
              node: atRule
            });
          }
          if (!node.nodes?.[0]?.value) {
            return result.warn(`Unable to find uri in '${atRule.toString()}'`, {
              node: atRule
            });
          }
          stmt.uri = node.nodes[0].value;
          stmt.fullUri = stringify(node);
          continue;
        }
        if (!stmt.uri) {
          return result.warn(`Unable to find uri in '${atRule.toString()}'`, {
            node: atRule
          });
        }
        if ((node.type === "word" || node.type === "function") && /^layer$/i.test(node.value)) {
          if (typeof layer !== "undefined") {
            return result.warn(`Multiple layers in '${atRule.toString()}'`, {
              node: atRule
            });
          }
          if (typeof supports !== "undefined") {
            return result.warn(
              `layers must be defined before support conditions in '${atRule.toString()}'`,
              {
                node: atRule
              }
            );
          }
          if (node.nodes) {
            layer = stringify(node.nodes);
          } else {
            layer = "";
          }
          continue;
        }
        if (node.type === "function" && /^supports$/i.test(node.value)) {
          if (typeof supports !== "undefined") {
            return result.warn(
              `Multiple support conditions in '${atRule.toString()}'`,
              {
                node: atRule
              }
            );
          }
          supports = stringify(node.nodes);
          continue;
        }
        media = stringify(params.slice(i));
        break;
      }
      if (!stmt.uri) {
        return result.warn(`Unable to find uri in '${atRule.toString()}'`, {
          node: atRule
        });
      }
      if (typeof media !== "undefined" || typeof layer !== "undefined" || typeof supports !== "undefined") {
        stmt.conditions.push({
          layer,
          media,
          supports
        });
      }
      return stmt;
    }
    function parseLayer(result, atRule, conditions, from) {
      return {
        type: "layer",
        node: atRule,
        conditions: [...conditions],
        from
      };
    }
  }
});

// ../node_modules/postcss-import/lib/process-content.js
var require_process_content = __commonJS({
  "../node_modules/postcss-import/lib/process-content.js"(exports, module) {
    "use strict";
    var path = __require("path");
    var sugarss;
    module.exports = function processContent(result, content, filename, options, postcss) {
      const { plugins } = options;
      const ext = path.extname(filename);
      const parserList = [];
      if (ext === ".sss") {
        if (!sugarss) {
          try {
            sugarss = __require("sugarss");
          } catch {
          }
        }
        if (sugarss)
          return runPostcss(postcss, content, filename, plugins, [sugarss]);
      }
      if (result.opts.syntax?.parse) {
        parserList.push(result.opts.syntax.parse);
      }
      if (result.opts.parser) parserList.push(result.opts.parser);
      parserList.push(null);
      return runPostcss(postcss, content, filename, plugins, parserList);
    };
    function runPostcss(postcss, content, filename, plugins, parsers, index) {
      if (!index) index = 0;
      return postcss(plugins).process(content, {
        from: filename,
        parser: parsers[index]
      }).catch((err) => {
        index++;
        if (index === parsers.length) throw err;
        return runPostcss(postcss, content, filename, plugins, parsers, index);
      });
    }
  }
});

// ../node_modules/resolve/lib/homedir.js
var require_homedir = __commonJS({
  "../node_modules/resolve/lib/homedir.js"(exports, module) {
    "use strict";
    var os = __require("os");
    module.exports = os.homedir || function homedir() {
      var home = process.env.HOME;
      var user = process.env.LOGNAME || process.env.USER || process.env.LNAME || process.env.USERNAME;
      if (process.platform === "win32") {
        return process.env.USERPROFILE || process.env.HOMEDRIVE + process.env.HOMEPATH || home || null;
      }
      if (process.platform === "darwin") {
        return home || (user ? "/Users/" + user : null);
      }
      if (process.platform === "linux") {
        return home || (process.getuid() === 0 ? "/root" : user ? "/home/" + user : null);
      }
      return home || null;
    };
  }
});

// ../node_modules/resolve/lib/caller.js
var require_caller = __commonJS({
  "../node_modules/resolve/lib/caller.js"(exports, module) {
    module.exports = function() {
      var origPrepareStackTrace = Error.prepareStackTrace;
      Error.prepareStackTrace = function(_, stack2) {
        return stack2;
      };
      var stack = new Error().stack;
      Error.prepareStackTrace = origPrepareStackTrace;
      return stack[2].getFileName();
    };
  }
});

// ../node_modules/path-parse/index.js
var require_path_parse = __commonJS({
  "../node_modules/path-parse/index.js"(exports, module) {
    "use strict";
    var isWindows = process.platform === "win32";
    var splitWindowsRe = /^(((?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?[\\\/]?)(?:[^\\\/]*[\\\/])*)((\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))[\\\/]*$/;
    var win32 = {};
    function win32SplitPath(filename) {
      return splitWindowsRe.exec(filename).slice(1);
    }
    win32.parse = function(pathString) {
      if (typeof pathString !== "string") {
        throw new TypeError(
          "Parameter 'pathString' must be a string, not " + typeof pathString
        );
      }
      var allParts = win32SplitPath(pathString);
      if (!allParts || allParts.length !== 5) {
        throw new TypeError("Invalid path '" + pathString + "'");
      }
      return {
        root: allParts[1],
        dir: allParts[0] === allParts[1] ? allParts[0] : allParts[0].slice(0, -1),
        base: allParts[2],
        ext: allParts[4],
        name: allParts[3]
      };
    };
    var splitPathRe = /^((\/?)(?:[^\/]*\/)*)((\.{1,2}|[^\/]+?|)(\.[^.\/]*|))[\/]*$/;
    var posix = {};
    function posixSplitPath(filename) {
      return splitPathRe.exec(filename).slice(1);
    }
    posix.parse = function(pathString) {
      if (typeof pathString !== "string") {
        throw new TypeError(
          "Parameter 'pathString' must be a string, not " + typeof pathString
        );
      }
      var allParts = posixSplitPath(pathString);
      if (!allParts || allParts.length !== 5) {
        throw new TypeError("Invalid path '" + pathString + "'");
      }
      return {
        root: allParts[1],
        dir: allParts[0].slice(0, -1),
        base: allParts[2],
        ext: allParts[4],
        name: allParts[3]
      };
    };
    if (isWindows)
      module.exports = win32.parse;
    else
      module.exports = posix.parse;
    module.exports.posix = posix.parse;
    module.exports.win32 = win32.parse;
  }
});

// ../node_modules/resolve/lib/node-modules-paths.js
var require_node_modules_paths = __commonJS({
  "../node_modules/resolve/lib/node-modules-paths.js"(exports, module) {
    var path = __require("path");
    var parse = path.parse || require_path_parse();
    var driveLetterRegex = /^([A-Za-z]:)/;
    var uncPathRegex = /^\\\\/;
    var getNodeModulesDirs = function getNodeModulesDirs2(absoluteStart, modules) {
      var prefix = "/";
      if (driveLetterRegex.test(absoluteStart)) {
        prefix = "";
      } else if (uncPathRegex.test(absoluteStart)) {
        prefix = "\\\\";
      }
      var paths = [absoluteStart];
      var parsed = parse(absoluteStart);
      while (parsed.dir !== paths[paths.length - 1]) {
        paths.push(parsed.dir);
        parsed = parse(parsed.dir);
      }
      return paths.reduce(function(dirs, aPath) {
        return dirs.concat(modules.map(function(moduleDir) {
          return path.resolve(prefix, aPath, moduleDir);
        }));
      }, []);
    };
    module.exports = function nodeModulesPaths(start, opts, request) {
      var modules = opts && opts.moduleDirectory ? [].concat(opts.moduleDirectory) : ["node_modules"];
      if (opts && typeof opts.paths === "function") {
        return opts.paths(
          request,
          start,
          function() {
            return getNodeModulesDirs(start, modules);
          },
          opts
        );
      }
      var dirs = getNodeModulesDirs(start, modules);
      return opts && opts.paths ? dirs.concat(opts.paths) : dirs;
    };
  }
});

// ../node_modules/resolve/lib/normalize-options.js
var require_normalize_options = __commonJS({
  "../node_modules/resolve/lib/normalize-options.js"(exports, module) {
    module.exports = function(x, opts) {
      return opts || {};
    };
  }
});

// ../node_modules/function-bind/implementation.js
var require_implementation = __commonJS({
  "../node_modules/function-bind/implementation.js"(exports, module) {
    "use strict";
    var ERROR_MESSAGE = "Function.prototype.bind called on incompatible ";
    var toStr = Object.prototype.toString;
    var max = Math.max;
    var funcType = "[object Function]";
    var concatty = function concatty2(a, b) {
      var arr = [];
      for (var i = 0; i < a.length; i += 1) {
        arr[i] = a[i];
      }
      for (var j = 0; j < b.length; j += 1) {
        arr[j + a.length] = b[j];
      }
      return arr;
    };
    var slicy = function slicy2(arrLike, offset) {
      var arr = [];
      for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) {
        arr[j] = arrLike[i];
      }
      return arr;
    };
    var joiny = function(arr, joiner) {
      var str = "";
      for (var i = 0; i < arr.length; i += 1) {
        str += arr[i];
        if (i + 1 < arr.length) {
          str += joiner;
        }
      }
      return str;
    };
    module.exports = function bind(that) {
      var target = this;
      if (typeof target !== "function" || toStr.apply(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
      }
      var args = slicy(arguments, 1);
      var bound;
      var binder = function() {
        if (this instanceof bound) {
          var result = target.apply(
            this,
            concatty(args, arguments)
          );
          if (Object(result) === result) {
            return result;
          }
          return this;
        }
        return target.apply(
          that,
          concatty(args, arguments)
        );
      };
      var boundLength = max(0, target.length - args.length);
      var boundArgs = [];
      for (var i = 0; i < boundLength; i++) {
        boundArgs[i] = "$" + i;
      }
      bound = Function("binder", "return function (" + joiny(boundArgs, ",") + "){ return binder.apply(this,arguments); }")(binder);
      if (target.prototype) {
        var Empty = function Empty2() {
        };
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
      }
      return bound;
    };
  }
});

// ../node_modules/function-bind/index.js
var require_function_bind = __commonJS({
  "../node_modules/function-bind/index.js"(exports, module) {
    "use strict";
    var implementation = require_implementation();
    module.exports = Function.prototype.bind || implementation;
  }
});

// ../node_modules/hasown/index.js
var require_hasown = __commonJS({
  "../node_modules/hasown/index.js"(exports, module) {
    "use strict";
    var call = Function.prototype.call;
    var $hasOwn = Object.prototype.hasOwnProperty;
    var bind = require_function_bind();
    module.exports = bind.call(call, $hasOwn);
  }
});

// ../node_modules/is-core-module/core.json
var require_core = __commonJS({
  "../node_modules/is-core-module/core.json"(exports, module) {
    module.exports = {
      assert: true,
      "node:assert": [">= 14.18 && < 15", ">= 16"],
      "assert/strict": ">= 15",
      "node:assert/strict": ">= 16",
      async_hooks: ">= 8",
      "node:async_hooks": [">= 14.18 && < 15", ">= 16"],
      buffer_ieee754: ">= 0.5 && < 0.9.7",
      buffer: true,
      "node:buffer": [">= 14.18 && < 15", ">= 16"],
      child_process: true,
      "node:child_process": [">= 14.18 && < 15", ">= 16"],
      cluster: ">= 0.5",
      "node:cluster": [">= 14.18 && < 15", ">= 16"],
      console: true,
      "node:console": [">= 14.18 && < 15", ">= 16"],
      constants: true,
      "node:constants": [">= 14.18 && < 15", ">= 16"],
      crypto: true,
      "node:crypto": [">= 14.18 && < 15", ">= 16"],
      _debug_agent: ">= 1 && < 8",
      _debugger: "< 8",
      dgram: true,
      "node:dgram": [">= 14.18 && < 15", ">= 16"],
      diagnostics_channel: [">= 14.17 && < 15", ">= 15.1"],
      "node:diagnostics_channel": [">= 14.18 && < 15", ">= 16"],
      dns: true,
      "node:dns": [">= 14.18 && < 15", ">= 16"],
      "dns/promises": ">= 15",
      "node:dns/promises": ">= 16",
      domain: ">= 0.7.12",
      "node:domain": [">= 14.18 && < 15", ">= 16"],
      events: true,
      "node:events": [">= 14.18 && < 15", ">= 16"],
      freelist: "< 6",
      fs: true,
      "node:fs": [">= 14.18 && < 15", ">= 16"],
      "fs/promises": [">= 10 && < 10.1", ">= 14"],
      "node:fs/promises": [">= 14.18 && < 15", ">= 16"],
      _http_agent: ">= 0.11.1",
      "node:_http_agent": [">= 14.18 && < 15", ">= 16"],
      _http_client: ">= 0.11.1",
      "node:_http_client": [">= 14.18 && < 15", ">= 16"],
      _http_common: ">= 0.11.1",
      "node:_http_common": [">= 14.18 && < 15", ">= 16"],
      _http_incoming: ">= 0.11.1",
      "node:_http_incoming": [">= 14.18 && < 15", ">= 16"],
      _http_outgoing: ">= 0.11.1",
      "node:_http_outgoing": [">= 14.18 && < 15", ">= 16"],
      _http_server: ">= 0.11.1",
      "node:_http_server": [">= 14.18 && < 15", ">= 16"],
      http: true,
      "node:http": [">= 14.18 && < 15", ">= 16"],
      http2: ">= 8.8",
      "node:http2": [">= 14.18 && < 15", ">= 16"],
      https: true,
      "node:https": [">= 14.18 && < 15", ">= 16"],
      inspector: ">= 8",
      "node:inspector": [">= 14.18 && < 15", ">= 16"],
      "inspector/promises": [">= 19"],
      "node:inspector/promises": [">= 19"],
      _linklist: "< 8",
      module: true,
      "node:module": [">= 14.18 && < 15", ">= 16"],
      net: true,
      "node:net": [">= 14.18 && < 15", ">= 16"],
      "node-inspect/lib/_inspect": ">= 7.6 && < 12",
      "node-inspect/lib/internal/inspect_client": ">= 7.6 && < 12",
      "node-inspect/lib/internal/inspect_repl": ">= 7.6 && < 12",
      os: true,
      "node:os": [">= 14.18 && < 15", ">= 16"],
      path: true,
      "node:path": [">= 14.18 && < 15", ">= 16"],
      "path/posix": ">= 15.3",
      "node:path/posix": ">= 16",
      "path/win32": ">= 15.3",
      "node:path/win32": ">= 16",
      perf_hooks: ">= 8.5",
      "node:perf_hooks": [">= 14.18 && < 15", ">= 16"],
      process: ">= 1",
      "node:process": [">= 14.18 && < 15", ">= 16"],
      punycode: ">= 0.5",
      "node:punycode": [">= 14.18 && < 15", ">= 16"],
      querystring: true,
      "node:querystring": [">= 14.18 && < 15", ">= 16"],
      readline: true,
      "node:readline": [">= 14.18 && < 15", ">= 16"],
      "readline/promises": ">= 17",
      "node:readline/promises": ">= 17",
      repl: true,
      "node:repl": [">= 14.18 && < 15", ">= 16"],
      "node:sea": [">= 20.12 && < 21", ">= 21.7"],
      smalloc: ">= 0.11.5 && < 3",
      "node:sqlite": [">= 22.13 && < 23", ">= 23.4"],
      _stream_duplex: ">= 0.9.4",
      "node:_stream_duplex": [">= 14.18 && < 15", ">= 16"],
      _stream_transform: ">= 0.9.4",
      "node:_stream_transform": [">= 14.18 && < 15", ">= 16"],
      _stream_wrap: ">= 1.4.1",
      "node:_stream_wrap": [">= 14.18 && < 15", ">= 16"],
      _stream_passthrough: ">= 0.9.4",
      "node:_stream_passthrough": [">= 14.18 && < 15", ">= 16"],
      _stream_readable: ">= 0.9.4",
      "node:_stream_readable": [">= 14.18 && < 15", ">= 16"],
      _stream_writable: ">= 0.9.4",
      "node:_stream_writable": [">= 14.18 && < 15", ">= 16"],
      stream: true,
      "node:stream": [">= 14.18 && < 15", ">= 16"],
      "stream/consumers": ">= 16.7",
      "node:stream/consumers": ">= 16.7",
      "stream/promises": ">= 15",
      "node:stream/promises": ">= 16",
      "stream/web": ">= 16.5",
      "node:stream/web": ">= 16.5",
      string_decoder: true,
      "node:string_decoder": [">= 14.18 && < 15", ">= 16"],
      sys: [">= 0.4 && < 0.7", ">= 0.8"],
      "node:sys": [">= 14.18 && < 15", ">= 16"],
      "test/reporters": ">= 19.9 && < 20.2",
      "node:test/reporters": [">= 18.17 && < 19", ">= 19.9", ">= 20"],
      "test/mock_loader": ">= 22.3 && < 22.7",
      "node:test/mock_loader": ">= 22.3 && < 22.7",
      "node:test": [">= 16.17 && < 17", ">= 18"],
      timers: true,
      "node:timers": [">= 14.18 && < 15", ">= 16"],
      "timers/promises": ">= 15",
      "node:timers/promises": ">= 16",
      _tls_common: ">= 0.11.13",
      "node:_tls_common": [">= 14.18 && < 15", ">= 16"],
      _tls_legacy: ">= 0.11.3 && < 10",
      _tls_wrap: ">= 0.11.3",
      "node:_tls_wrap": [">= 14.18 && < 15", ">= 16"],
      tls: true,
      "node:tls": [">= 14.18 && < 15", ">= 16"],
      trace_events: ">= 10",
      "node:trace_events": [">= 14.18 && < 15", ">= 16"],
      tty: true,
      "node:tty": [">= 14.18 && < 15", ">= 16"],
      url: true,
      "node:url": [">= 14.18 && < 15", ">= 16"],
      util: true,
      "node:util": [">= 14.18 && < 15", ">= 16"],
      "util/types": ">= 15.3",
      "node:util/types": ">= 16",
      "v8/tools/arguments": ">= 10 && < 12",
      "v8/tools/codemap": [">= 4.4 && < 5", ">= 5.2 && < 12"],
      "v8/tools/consarray": [">= 4.4 && < 5", ">= 5.2 && < 12"],
      "v8/tools/csvparser": [">= 4.4 && < 5", ">= 5.2 && < 12"],
      "v8/tools/logreader": [">= 4.4 && < 5", ">= 5.2 && < 12"],
      "v8/tools/profile_view": [">= 4.4 && < 5", ">= 5.2 && < 12"],
      "v8/tools/splaytree": [">= 4.4 && < 5", ">= 5.2 && < 12"],
      v8: ">= 1",
      "node:v8": [">= 14.18 && < 15", ">= 16"],
      vm: true,
      "node:vm": [">= 14.18 && < 15", ">= 16"],
      wasi: [">= 13.4 && < 13.5", ">= 18.17 && < 19", ">= 20"],
      "node:wasi": [">= 18.17 && < 19", ">= 20"],
      worker_threads: ">= 11.7",
      "node:worker_threads": [">= 14.18 && < 15", ">= 16"],
      zlib: ">= 0.5",
      "node:zlib": [">= 14.18 && < 15", ">= 16"]
    };
  }
});

// ../node_modules/is-core-module/index.js
var require_is_core_module = __commonJS({
  "../node_modules/is-core-module/index.js"(exports, module) {
    "use strict";
    var hasOwn = require_hasown();
    function specifierIncluded(current, specifier) {
      var nodeParts = current.split(".");
      var parts = specifier.split(" ");
      var op = parts.length > 1 ? parts[0] : "=";
      var versionParts = (parts.length > 1 ? parts[1] : parts[0]).split(".");
      for (var i = 0; i < 3; ++i) {
        var cur = parseInt(nodeParts[i] || 0, 10);
        var ver = parseInt(versionParts[i] || 0, 10);
        if (cur === ver) {
          continue;
        }
        if (op === "<") {
          return cur < ver;
        }
        if (op === ">=") {
          return cur >= ver;
        }
        return false;
      }
      return op === ">=";
    }
    function matchesRange(current, range) {
      var specifiers = range.split(/ ?&& ?/);
      if (specifiers.length === 0) {
        return false;
      }
      for (var i = 0; i < specifiers.length; ++i) {
        if (!specifierIncluded(current, specifiers[i])) {
          return false;
        }
      }
      return true;
    }
    function versionIncluded(nodeVersion, specifierValue) {
      if (typeof specifierValue === "boolean") {
        return specifierValue;
      }
      var current = typeof nodeVersion === "undefined" ? process.versions && process.versions.node : nodeVersion;
      if (typeof current !== "string") {
        throw new TypeError(typeof nodeVersion === "undefined" ? "Unable to determine current node version" : "If provided, a valid node version is required");
      }
      if (specifierValue && typeof specifierValue === "object") {
        for (var i = 0; i < specifierValue.length; ++i) {
          if (matchesRange(current, specifierValue[i])) {
            return true;
          }
        }
        return false;
      }
      return matchesRange(current, specifierValue);
    }
    var data = require_core();
    module.exports = function isCore(x, nodeVersion) {
      return hasOwn(data, x) && versionIncluded(nodeVersion, data[x]);
    };
  }
});

// ../node_modules/resolve/lib/async.js
var require_async = __commonJS({
  "../node_modules/resolve/lib/async.js"(exports, module) {
    var fs = __require("fs");
    var getHomedir = require_homedir();
    var path = __require("path");
    var caller = require_caller();
    var nodeModulesPaths = require_node_modules_paths();
    var normalizeOptions = require_normalize_options();
    var isCore = require_is_core_module();
    var realpathFS = process.platform !== "win32" && fs.realpath && typeof fs.realpath.native === "function" ? fs.realpath.native : fs.realpath;
    var relativePathRegex = /^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/;
    var windowsDriveRegex = /^\w:[/\\]*$/;
    var nodeModulesRegex = /[/\\]node_modules[/\\]*$/;
    var homedir = getHomedir();
    var defaultPaths = function() {
      return [
        path.join(homedir, ".node_modules"),
        path.join(homedir, ".node_libraries")
      ];
    };
    var defaultIsFile = function isFile(file, cb) {
      fs.stat(file, function(err, stat) {
        if (!err) {
          return cb(null, stat.isFile() || stat.isFIFO());
        }
        if (err.code === "ENOENT" || err.code === "ENOTDIR") return cb(null, false);
        return cb(err);
      });
    };
    var defaultIsDir = function isDirectory(dir, cb) {
      fs.stat(dir, function(err, stat) {
        if (!err) {
          return cb(null, stat.isDirectory());
        }
        if (err.code === "ENOENT" || err.code === "ENOTDIR") return cb(null, false);
        return cb(err);
      });
    };
    var defaultRealpath = function realpath(x, cb) {
      realpathFS(x, function(realpathErr, realPath) {
        if (realpathErr && realpathErr.code !== "ENOENT") cb(realpathErr);
        else cb(null, realpathErr ? x : realPath);
      });
    };
    var maybeRealpath = function maybeRealpath2(realpath, x, opts, cb) {
      if (opts && opts.preserveSymlinks === false) {
        realpath(x, cb);
      } else {
        cb(null, x);
      }
    };
    var defaultReadPackage = function defaultReadPackage2(readFile, pkgfile, cb) {
      readFile(pkgfile, function(readFileErr, body) {
        if (readFileErr) cb(readFileErr);
        else {
          try {
            var pkg = JSON.parse(body);
            cb(null, pkg);
          } catch (jsonErr) {
            cb(null);
          }
        }
      });
    };
    var getPackageCandidates = function getPackageCandidates2(x, start, opts) {
      var dirs = nodeModulesPaths(start, opts, x);
      for (var i = 0; i < dirs.length; i++) {
        dirs[i] = path.join(dirs[i], x);
      }
      return dirs;
    };
    module.exports = function resolve(x, options, callback) {
      var cb = callback;
      var opts = options;
      if (typeof options === "function") {
        cb = opts;
        opts = {};
      }
      if (typeof x !== "string") {
        var err = new TypeError("Path must be a string.");
        return process.nextTick(function() {
          cb(err);
        });
      }
      opts = normalizeOptions(x, opts);
      var isFile = opts.isFile || defaultIsFile;
      var isDirectory = opts.isDirectory || defaultIsDir;
      var readFile = opts.readFile || fs.readFile;
      var realpath = opts.realpath || defaultRealpath;
      var readPackage = opts.readPackage || defaultReadPackage;
      if (opts.readFile && opts.readPackage) {
        var conflictErr = new TypeError("`readFile` and `readPackage` are mutually exclusive.");
        return process.nextTick(function() {
          cb(conflictErr);
        });
      }
      var packageIterator = opts.packageIterator;
      var extensions = opts.extensions || [".js"];
      var includeCoreModules = opts.includeCoreModules !== false;
      var basedir = opts.basedir || path.dirname(caller());
      var parent = opts.filename || basedir;
      opts.paths = opts.paths || defaultPaths();
      var absoluteStart = path.resolve(basedir);
      maybeRealpath(
        realpath,
        absoluteStart,
        opts,
        function(err2, realStart) {
          if (err2) cb(err2);
          else init(realStart);
        }
      );
      var res;
      function init(basedir2) {
        if (relativePathRegex.test(x)) {
          res = path.resolve(basedir2, x);
          if (x === "." || x === ".." || x.slice(-1) === "/") res += "/";
          if (x.slice(-1) === "/" && res === basedir2) {
            loadAsDirectory(res, opts.package, onfile);
          } else loadAsFile(res, opts.package, onfile);
        } else if (includeCoreModules && isCore(x)) {
          return cb(null, x);
        } else loadNodeModules(x, basedir2, function(err2, n, pkg) {
          if (err2) cb(err2);
          else if (n) {
            return maybeRealpath(realpath, n, opts, function(err3, realN) {
              if (err3) {
                cb(err3);
              } else {
                cb(null, realN, pkg);
              }
            });
          } else {
            var moduleError = new Error("Cannot find module '" + x + "' from '" + parent + "'");
            moduleError.code = "MODULE_NOT_FOUND";
            cb(moduleError);
          }
        });
      }
      function onfile(err2, m, pkg) {
        if (err2) cb(err2);
        else if (m) cb(null, m, pkg);
        else loadAsDirectory(res, function(err3, d, pkg2) {
          if (err3) cb(err3);
          else if (d) {
            maybeRealpath(realpath, d, opts, function(err4, realD) {
              if (err4) {
                cb(err4);
              } else {
                cb(null, realD, pkg2);
              }
            });
          } else {
            var moduleError = new Error("Cannot find module '" + x + "' from '" + parent + "'");
            moduleError.code = "MODULE_NOT_FOUND";
            cb(moduleError);
          }
        });
      }
      function loadAsFile(x2, thePackage, callback2) {
        var loadAsFilePackage = thePackage;
        var cb2 = callback2;
        if (typeof loadAsFilePackage === "function") {
          cb2 = loadAsFilePackage;
          loadAsFilePackage = void 0;
        }
        var exts = [""].concat(extensions);
        load(exts, x2, loadAsFilePackage);
        function load(exts2, x3, loadPackage) {
          if (exts2.length === 0) return cb2(null, void 0, loadPackage);
          var file = x3 + exts2[0];
          var pkg = loadPackage;
          if (pkg) onpkg(null, pkg);
          else loadpkg(path.dirname(file), onpkg);
          function onpkg(err2, pkg_, dir) {
            pkg = pkg_;
            if (err2) return cb2(err2);
            if (dir && pkg && opts.pathFilter) {
              var rfile = path.relative(dir, file);
              var rel = rfile.slice(0, rfile.length - exts2[0].length);
              var r = opts.pathFilter(pkg, x3, rel);
              if (r) return load(
                [""].concat(extensions.slice()),
                path.resolve(dir, r),
                pkg
              );
            }
            isFile(file, onex);
          }
          function onex(err2, ex) {
            if (err2) return cb2(err2);
            if (ex) return cb2(null, file, pkg);
            load(exts2.slice(1), x3, pkg);
          }
        }
      }
      function loadpkg(dir, cb2) {
        if (dir === "" || dir === "/") return cb2(null);
        if (process.platform === "win32" && windowsDriveRegex.test(dir)) {
          return cb2(null);
        }
        if (nodeModulesRegex.test(dir)) return cb2(null);
        maybeRealpath(realpath, dir, opts, function(unwrapErr, pkgdir) {
          if (unwrapErr) return loadpkg(path.dirname(dir), cb2);
          var pkgfile = path.join(pkgdir, "package.json");
          isFile(pkgfile, function(err2, ex) {
            if (!ex) return loadpkg(path.dirname(dir), cb2);
            readPackage(readFile, pkgfile, function(err3, pkgParam) {
              if (err3) cb2(err3);
              var pkg = pkgParam;
              if (pkg && opts.packageFilter) {
                pkg = opts.packageFilter(pkg, pkgfile);
              }
              cb2(null, pkg, dir);
            });
          });
        });
      }
      function loadAsDirectory(x2, loadAsDirectoryPackage, callback2) {
        var cb2 = callback2;
        var fpkg = loadAsDirectoryPackage;
        if (typeof fpkg === "function") {
          cb2 = fpkg;
          fpkg = opts.package;
        }
        maybeRealpath(realpath, x2, opts, function(unwrapErr, pkgdir) {
          if (unwrapErr) return cb2(unwrapErr);
          var pkgfile = path.join(pkgdir, "package.json");
          isFile(pkgfile, function(err2, ex) {
            if (err2) return cb2(err2);
            if (!ex) return loadAsFile(path.join(x2, "index"), fpkg, cb2);
            readPackage(readFile, pkgfile, function(err3, pkgParam) {
              if (err3) return cb2(err3);
              var pkg = pkgParam;
              if (pkg && opts.packageFilter) {
                pkg = opts.packageFilter(pkg, pkgfile);
              }
              if (pkg && pkg.main) {
                if (typeof pkg.main !== "string") {
                  var mainError = new TypeError("package \u201C" + pkg.name + "\u201D `main` must be a string");
                  mainError.code = "INVALID_PACKAGE_MAIN";
                  return cb2(mainError);
                }
                if (pkg.main === "." || pkg.main === "./") {
                  pkg.main = "index";
                }
                loadAsFile(path.resolve(x2, pkg.main), pkg, function(err4, m, pkg2) {
                  if (err4) return cb2(err4);
                  if (m) return cb2(null, m, pkg2);
                  if (!pkg2) return loadAsFile(path.join(x2, "index"), pkg2, cb2);
                  var dir = path.resolve(x2, pkg2.main);
                  loadAsDirectory(dir, pkg2, function(err5, n, pkg3) {
                    if (err5) return cb2(err5);
                    if (n) return cb2(null, n, pkg3);
                    loadAsFile(path.join(x2, "index"), pkg3, cb2);
                  });
                });
                return;
              }
              loadAsFile(path.join(x2, "/index"), pkg, cb2);
            });
          });
        });
      }
      function processDirs(cb2, dirs) {
        if (dirs.length === 0) return cb2(null, void 0);
        var dir = dirs[0];
        isDirectory(path.dirname(dir), isdir);
        function isdir(err2, isdir2) {
          if (err2) return cb2(err2);
          if (!isdir2) return processDirs(cb2, dirs.slice(1));
          loadAsFile(dir, opts.package, onfile2);
        }
        function onfile2(err2, m, pkg) {
          if (err2) return cb2(err2);
          if (m) return cb2(null, m, pkg);
          loadAsDirectory(dir, opts.package, ondir);
        }
        function ondir(err2, n, pkg) {
          if (err2) return cb2(err2);
          if (n) return cb2(null, n, pkg);
          processDirs(cb2, dirs.slice(1));
        }
      }
      function loadNodeModules(x2, start, cb2) {
        var thunk = function() {
          return getPackageCandidates(x2, start, opts);
        };
        processDirs(
          cb2,
          packageIterator ? packageIterator(x2, start, thunk, opts) : thunk()
        );
      }
    };
  }
});

// ../node_modules/resolve/lib/core.json
var require_core2 = __commonJS({
  "../node_modules/resolve/lib/core.json"(exports, module) {
    module.exports = {
      assert: true,
      "node:assert": [">= 14.18 && < 15", ">= 16"],
      "assert/strict": ">= 15",
      "node:assert/strict": ">= 16",
      async_hooks: ">= 8",
      "node:async_hooks": [">= 14.18 && < 15", ">= 16"],
      buffer_ieee754: ">= 0.5 && < 0.9.7",
      buffer: true,
      "node:buffer": [">= 14.18 && < 15", ">= 16"],
      child_process: true,
      "node:child_process": [">= 14.18 && < 15", ">= 16"],
      cluster: ">= 0.5",
      "node:cluster": [">= 14.18 && < 15", ">= 16"],
      console: true,
      "node:console": [">= 14.18 && < 15", ">= 16"],
      constants: true,
      "node:constants": [">= 14.18 && < 15", ">= 16"],
      crypto: true,
      "node:crypto": [">= 14.18 && < 15", ">= 16"],
      _debug_agent: ">= 1 && < 8",
      _debugger: "< 8",
      dgram: true,
      "node:dgram": [">= 14.18 && < 15", ">= 16"],
      diagnostics_channel: [">= 14.17 && < 15", ">= 15.1"],
      "node:diagnostics_channel": [">= 14.18 && < 15", ">= 16"],
      dns: true,
      "node:dns": [">= 14.18 && < 15", ">= 16"],
      "dns/promises": ">= 15",
      "node:dns/promises": ">= 16",
      domain: ">= 0.7.12",
      "node:domain": [">= 14.18 && < 15", ">= 16"],
      events: true,
      "node:events": [">= 14.18 && < 15", ">= 16"],
      freelist: "< 6",
      fs: true,
      "node:fs": [">= 14.18 && < 15", ">= 16"],
      "fs/promises": [">= 10 && < 10.1", ">= 14"],
      "node:fs/promises": [">= 14.18 && < 15", ">= 16"],
      _http_agent: ">= 0.11.1",
      "node:_http_agent": [">= 14.18 && < 15", ">= 16"],
      _http_client: ">= 0.11.1",
      "node:_http_client": [">= 14.18 && < 15", ">= 16"],
      _http_common: ">= 0.11.1",
      "node:_http_common": [">= 14.18 && < 15", ">= 16"],
      _http_incoming: ">= 0.11.1",
      "node:_http_incoming": [">= 14.18 && < 15", ">= 16"],
      _http_outgoing: ">= 0.11.1",
      "node:_http_outgoing": [">= 14.18 && < 15", ">= 16"],
      _http_server: ">= 0.11.1",
      "node:_http_server": [">= 14.18 && < 15", ">= 16"],
      http: true,
      "node:http": [">= 14.18 && < 15", ">= 16"],
      http2: ">= 8.8",
      "node:http2": [">= 14.18 && < 15", ">= 16"],
      https: true,
      "node:https": [">= 14.18 && < 15", ">= 16"],
      inspector: ">= 8",
      "node:inspector": [">= 14.18 && < 15", ">= 16"],
      "inspector/promises": [">= 19"],
      "node:inspector/promises": [">= 19"],
      _linklist: "< 8",
      module: true,
      "node:module": [">= 14.18 && < 15", ">= 16"],
      net: true,
      "node:net": [">= 14.18 && < 15", ">= 16"],
      "node-inspect/lib/_inspect": ">= 7.6 && < 12",
      "node-inspect/lib/internal/inspect_client": ">= 7.6 && < 12",
      "node-inspect/lib/internal/inspect_repl": ">= 7.6 && < 12",
      os: true,
      "node:os": [">= 14.18 && < 15", ">= 16"],
      path: true,
      "node:path": [">= 14.18 && < 15", ">= 16"],
      "path/posix": ">= 15.3",
      "node:path/posix": ">= 16",
      "path/win32": ">= 15.3",
      "node:path/win32": ">= 16",
      perf_hooks: ">= 8.5",
      "node:perf_hooks": [">= 14.18 && < 15", ">= 16"],
      process: ">= 1",
      "node:process": [">= 14.18 && < 15", ">= 16"],
      punycode: ">= 0.5",
      "node:punycode": [">= 14.18 && < 15", ">= 16"],
      querystring: true,
      "node:querystring": [">= 14.18 && < 15", ">= 16"],
      readline: true,
      "node:readline": [">= 14.18 && < 15", ">= 16"],
      "readline/promises": ">= 17",
      "node:readline/promises": ">= 17",
      repl: true,
      "node:repl": [">= 14.18 && < 15", ">= 16"],
      "node:sea": [">= 20.12 && < 21", ">= 21.7"],
      smalloc: ">= 0.11.5 && < 3",
      "node:sqlite": [">= 22.13 && < 23", ">= 23.4"],
      _stream_duplex: ">= 0.9.4",
      "node:_stream_duplex": [">= 14.18 && < 15", ">= 16"],
      _stream_transform: ">= 0.9.4",
      "node:_stream_transform": [">= 14.18 && < 15", ">= 16"],
      _stream_wrap: ">= 1.4.1",
      "node:_stream_wrap": [">= 14.18 && < 15", ">= 16"],
      _stream_passthrough: ">= 0.9.4",
      "node:_stream_passthrough": [">= 14.18 && < 15", ">= 16"],
      _stream_readable: ">= 0.9.4",
      "node:_stream_readable": [">= 14.18 && < 15", ">= 16"],
      _stream_writable: ">= 0.9.4",
      "node:_stream_writable": [">= 14.18 && < 15", ">= 16"],
      stream: true,
      "node:stream": [">= 14.18 && < 15", ">= 16"],
      "stream/consumers": ">= 16.7",
      "node:stream/consumers": ">= 16.7",
      "stream/promises": ">= 15",
      "node:stream/promises": ">= 16",
      "stream/web": ">= 16.5",
      "node:stream/web": ">= 16.5",
      string_decoder: true,
      "node:string_decoder": [">= 14.18 && < 15", ">= 16"],
      sys: [">= 0.4 && < 0.7", ">= 0.8"],
      "node:sys": [">= 14.18 && < 15", ">= 16"],
      "test/reporters": ">= 19.9 && < 20.2",
      "node:test/reporters": [">= 18.17 && < 19", ">= 19.9", ">= 20"],
      "test/mock_loader": ">= 22.3 && < 22.7",
      "node:test/mock_loader": ">= 22.3 && < 22.7",
      "node:test": [">= 16.17 && < 17", ">= 18"],
      timers: true,
      "node:timers": [">= 14.18 && < 15", ">= 16"],
      "timers/promises": ">= 15",
      "node:timers/promises": ">= 16",
      _tls_common: ">= 0.11.13",
      "node:_tls_common": [">= 14.18 && < 15", ">= 16"],
      _tls_legacy: ">= 0.11.3 && < 10",
      _tls_wrap: ">= 0.11.3",
      "node:_tls_wrap": [">= 14.18 && < 15", ">= 16"],
      tls: true,
      "node:tls": [">= 14.18 && < 15", ">= 16"],
      trace_events: ">= 10",
      "node:trace_events": [">= 14.18 && < 15", ">= 16"],
      tty: true,
      "node:tty": [">= 14.18 && < 15", ">= 16"],
      url: true,
      "node:url": [">= 14.18 && < 15", ">= 16"],
      util: true,
      "node:util": [">= 14.18 && < 15", ">= 16"],
      "util/types": ">= 15.3",
      "node:util/types": ">= 16",
      "v8/tools/arguments": ">= 10 && < 12",
      "v8/tools/codemap": [">= 4.4 && < 5", ">= 5.2 && < 12"],
      "v8/tools/consarray": [">= 4.4 && < 5", ">= 5.2 && < 12"],
      "v8/tools/csvparser": [">= 4.4 && < 5", ">= 5.2 && < 12"],
      "v8/tools/logreader": [">= 4.4 && < 5", ">= 5.2 && < 12"],
      "v8/tools/profile_view": [">= 4.4 && < 5", ">= 5.2 && < 12"],
      "v8/tools/splaytree": [">= 4.4 && < 5", ">= 5.2 && < 12"],
      v8: ">= 1",
      "node:v8": [">= 14.18 && < 15", ">= 16"],
      vm: true,
      "node:vm": [">= 14.18 && < 15", ">= 16"],
      wasi: [">= 13.4 && < 13.5", ">= 18.17 && < 19", ">= 20"],
      "node:wasi": [">= 18.17 && < 19", ">= 20"],
      worker_threads: ">= 11.7",
      "node:worker_threads": [">= 14.18 && < 15", ">= 16"],
      zlib: ">= 0.5",
      "node:zlib": [">= 14.18 && < 15", ">= 16"]
    };
  }
});

// ../node_modules/resolve/lib/core.js
var require_core3 = __commonJS({
  "../node_modules/resolve/lib/core.js"(exports, module) {
    "use strict";
    var isCoreModule = require_is_core_module();
    var data = require_core2();
    var core = {};
    for (mod in data) {
      if (Object.prototype.hasOwnProperty.call(data, mod)) {
        core[mod] = isCoreModule(mod);
      }
    }
    var mod;
    module.exports = core;
  }
});

// ../node_modules/resolve/lib/is-core.js
var require_is_core = __commonJS({
  "../node_modules/resolve/lib/is-core.js"(exports, module) {
    var isCoreModule = require_is_core_module();
    module.exports = function isCore(x) {
      return isCoreModule(x);
    };
  }
});

// ../node_modules/resolve/lib/sync.js
var require_sync = __commonJS({
  "../node_modules/resolve/lib/sync.js"(exports, module) {
    var isCore = require_is_core_module();
    var fs = __require("fs");
    var path = __require("path");
    var getHomedir = require_homedir();
    var caller = require_caller();
    var nodeModulesPaths = require_node_modules_paths();
    var normalizeOptions = require_normalize_options();
    var realpathFS = process.platform !== "win32" && fs.realpathSync && typeof fs.realpathSync.native === "function" ? fs.realpathSync.native : fs.realpathSync;
    var relativePathRegex = /^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/;
    var windowsDriveRegex = /^\w:[/\\]*$/;
    var nodeModulesRegex = /[/\\]node_modules[/\\]*$/;
    var homedir = getHomedir();
    var defaultPaths = function() {
      return [
        path.join(homedir, ".node_modules"),
        path.join(homedir, ".node_libraries")
      ];
    };
    var defaultIsFile = function isFile(file) {
      try {
        var stat = fs.statSync(file, { throwIfNoEntry: false });
      } catch (e) {
        if (e && (e.code === "ENOENT" || e.code === "ENOTDIR")) return false;
        throw e;
      }
      return !!stat && (stat.isFile() || stat.isFIFO());
    };
    var defaultIsDir = function isDirectory(dir) {
      try {
        var stat = fs.statSync(dir, { throwIfNoEntry: false });
      } catch (e) {
        if (e && (e.code === "ENOENT" || e.code === "ENOTDIR")) return false;
        throw e;
      }
      return !!stat && stat.isDirectory();
    };
    var defaultRealpathSync = function realpathSync(x) {
      try {
        return realpathFS(x);
      } catch (realpathErr) {
        if (realpathErr.code !== "ENOENT") {
          throw realpathErr;
        }
      }
      return x;
    };
    var maybeRealpathSync = function maybeRealpathSync2(realpathSync, x, opts) {
      if (opts && opts.preserveSymlinks === false) {
        return realpathSync(x);
      }
      return x;
    };
    var defaultReadPackageSync = function defaultReadPackageSync2(readFileSync, pkgfile) {
      var body = readFileSync(pkgfile);
      try {
        var pkg = JSON.parse(body);
        return pkg;
      } catch (jsonErr) {
      }
    };
    var getPackageCandidates = function getPackageCandidates2(x, start, opts) {
      var dirs = nodeModulesPaths(start, opts, x);
      for (var i = 0; i < dirs.length; i++) {
        dirs[i] = path.join(dirs[i], x);
      }
      return dirs;
    };
    module.exports = function resolveSync(x, options) {
      if (typeof x !== "string") {
        throw new TypeError("Path must be a string.");
      }
      var opts = normalizeOptions(x, options);
      var isFile = opts.isFile || defaultIsFile;
      var readFileSync = opts.readFileSync || fs.readFileSync;
      var isDirectory = opts.isDirectory || defaultIsDir;
      var realpathSync = opts.realpathSync || defaultRealpathSync;
      var readPackageSync = opts.readPackageSync || defaultReadPackageSync;
      if (opts.readFileSync && opts.readPackageSync) {
        throw new TypeError("`readFileSync` and `readPackageSync` are mutually exclusive.");
      }
      var packageIterator = opts.packageIterator;
      var extensions = opts.extensions || [".js"];
      var includeCoreModules = opts.includeCoreModules !== false;
      var basedir = opts.basedir || path.dirname(caller());
      var parent = opts.filename || basedir;
      opts.paths = opts.paths || defaultPaths();
      var absoluteStart = maybeRealpathSync(realpathSync, path.resolve(basedir), opts);
      if (relativePathRegex.test(x)) {
        var res = path.resolve(absoluteStart, x);
        if (x === "." || x === ".." || x.slice(-1) === "/") res += "/";
        var m = loadAsFileSync(res) || loadAsDirectorySync(res);
        if (m) return maybeRealpathSync(realpathSync, m, opts);
      } else if (includeCoreModules && isCore(x)) {
        return x;
      } else {
        var n = loadNodeModulesSync(x, absoluteStart);
        if (n) return maybeRealpathSync(realpathSync, n, opts);
      }
      var err = new Error("Cannot find module '" + x + "' from '" + parent + "'");
      err.code = "MODULE_NOT_FOUND";
      throw err;
      function loadAsFileSync(x2) {
        var pkg = loadpkg(path.dirname(x2));
        if (pkg && pkg.dir && pkg.pkg && opts.pathFilter) {
          var rfile = path.relative(pkg.dir, x2);
          var r = opts.pathFilter(pkg.pkg, x2, rfile);
          if (r) {
            x2 = path.resolve(pkg.dir, r);
          }
        }
        if (isFile(x2)) {
          return x2;
        }
        for (var i = 0; i < extensions.length; i++) {
          var file = x2 + extensions[i];
          if (isFile(file)) {
            return file;
          }
        }
      }
      function loadpkg(dir) {
        if (dir === "" || dir === "/") return;
        if (process.platform === "win32" && windowsDriveRegex.test(dir)) {
          return;
        }
        if (nodeModulesRegex.test(dir)) return;
        var pkgfile = path.join(maybeRealpathSync(realpathSync, dir, opts), "package.json");
        if (!isFile(pkgfile)) {
          return loadpkg(path.dirname(dir));
        }
        var pkg = readPackageSync(readFileSync, pkgfile);
        if (pkg && opts.packageFilter) {
          pkg = opts.packageFilter(
            pkg,
            /*pkgfile,*/
            dir
          );
        }
        return { pkg, dir };
      }
      function loadAsDirectorySync(x2) {
        var pkgfile = path.join(maybeRealpathSync(realpathSync, x2, opts), "/package.json");
        if (isFile(pkgfile)) {
          try {
            var pkg = readPackageSync(readFileSync, pkgfile);
          } catch (e) {
          }
          if (pkg && opts.packageFilter) {
            pkg = opts.packageFilter(
              pkg,
              /*pkgfile,*/
              x2
            );
          }
          if (pkg && pkg.main) {
            if (typeof pkg.main !== "string") {
              var mainError = new TypeError("package \u201C" + pkg.name + "\u201D `main` must be a string");
              mainError.code = "INVALID_PACKAGE_MAIN";
              throw mainError;
            }
            if (pkg.main === "." || pkg.main === "./") {
              pkg.main = "index";
            }
            try {
              var m2 = loadAsFileSync(path.resolve(x2, pkg.main));
              if (m2) return m2;
              var n2 = loadAsDirectorySync(path.resolve(x2, pkg.main));
              if (n2) return n2;
            } catch (e) {
            }
          }
        }
        return loadAsFileSync(path.join(x2, "/index"));
      }
      function loadNodeModulesSync(x2, start) {
        var thunk = function() {
          return getPackageCandidates(x2, start, opts);
        };
        var dirs = packageIterator ? packageIterator(x2, start, thunk, opts) : thunk();
        for (var i = 0; i < dirs.length; i++) {
          var dir = dirs[i];
          if (isDirectory(path.dirname(dir))) {
            var m2 = loadAsFileSync(dir);
            if (m2) return m2;
            var n2 = loadAsDirectorySync(dir);
            if (n2) return n2;
          }
        }
      }
    };
  }
});

// ../node_modules/resolve/index.js
var require_resolve = __commonJS({
  "../node_modules/resolve/index.js"(exports, module) {
    var async = require_async();
    async.core = require_core3();
    async.isCore = require_is_core();
    async.sync = require_sync();
    module.exports = async;
  }
});

// ../node_modules/postcss-import/lib/resolve-id.js
var require_resolve_id = __commonJS({
  "../node_modules/postcss-import/lib/resolve-id.js"(exports, module) {
    "use strict";
    var resolve = require_resolve();
    var moduleDirectories = ["web_modules", "node_modules"];
    function resolveModule(id, opts) {
      return new Promise((res, rej) => {
        resolve(id, opts, (err, path) => err ? rej(err) : res(path));
      });
    }
    module.exports = function resolveId(id, base, options, node) {
      const paths = options.path;
      const resolveOpts = {
        basedir: base,
        moduleDirectory: moduleDirectories.concat(options.addModulesDirectories),
        paths,
        extensions: [".css"],
        packageFilter: function processPackage(pkg) {
          if (pkg.style) pkg.main = pkg.style;
          else if (!pkg.main || !/\.css$/.test(pkg.main)) pkg.main = "index.css";
          return pkg;
        },
        preserveSymlinks: false
      };
      return resolveModule(`./${id}`, resolveOpts).catch(() => resolveModule(id, resolveOpts)).catch(() => {
        if (paths.indexOf(base) === -1) paths.unshift(base);
        throw node.error(
          `Failed to find '${id}'
  in [
    ${paths.join(",\n    ")}
  ]`
        );
      });
    };
  }
});

// ../node_modules/postcss-import/lib/parse-styles.js
var require_parse_styles = __commonJS({
  "../node_modules/postcss-import/lib/parse-styles.js"(exports, module) {
    "use strict";
    var path = __require("path");
    var dataURL = require_data_url();
    var parseStatements = require_parse_statements();
    var processContent = require_process_content();
    var resolveId = require_resolve_id();
    var formatImportPrelude = require_format_import_prelude();
    async function parseStyles(result, styles, options, state, conditions, from, postcss) {
      const statements = parseStatements(result, styles, conditions, from);
      for (const stmt of statements) {
        if (stmt.type !== "import" || !isProcessableURL(stmt.uri)) {
          continue;
        }
        if (options.filter && !options.filter(stmt.uri)) {
          continue;
        }
        await resolveImportId(result, stmt, options, state, postcss);
      }
      let charset;
      const beforeBundle = [];
      const bundle = [];
      function handleCharset(stmt) {
        if (!charset) charset = stmt;
        else if (stmt.node.params.toLowerCase() !== charset.node.params.toLowerCase()) {
          throw stmt.node.error(
            `Incompatible @charset statements:
  ${stmt.node.params} specified in ${stmt.node.source.input.file}
  ${charset.node.params} specified in ${charset.node.source.input.file}`
          );
        }
      }
      statements.forEach((stmt) => {
        if (stmt.type === "charset") handleCharset(stmt);
        else if (stmt.type === "import") {
          if (stmt.children) {
            stmt.children.forEach((child, index) => {
              if (child.type === "import") beforeBundle.push(child);
              else if (child.type === "layer") beforeBundle.push(child);
              else if (child.type === "charset") handleCharset(child);
              else bundle.push(child);
              if (index === 0) child.parent = stmt;
            });
          } else beforeBundle.push(stmt);
        } else if (stmt.type === "layer") {
          beforeBundle.push(stmt);
        } else if (stmt.type === "nodes") {
          bundle.push(stmt);
        }
      });
      return charset ? [charset, ...beforeBundle.concat(bundle)] : beforeBundle.concat(bundle);
    }
    async function resolveImportId(result, stmt, options, state, postcss) {
      if (dataURL.isValid(stmt.uri)) {
        stmt.children = await loadImportContent(
          result,
          stmt,
          stmt.uri,
          options,
          state,
          postcss
        );
        return;
      } else if (dataURL.isValid(stmt.from.slice(-1))) {
        throw stmt.node.error(
          `Unable to import '${stmt.uri}' from a stylesheet that is embedded in a data url`
        );
      }
      const atRule = stmt.node;
      let sourceFile;
      if (atRule.source?.input?.file) {
        sourceFile = atRule.source.input.file;
      }
      const base = sourceFile ? path.dirname(atRule.source.input.file) : options.root;
      const paths = [await options.resolve(stmt.uri, base, options, atRule)].flat();
      const resolved = await Promise.all(
        paths.map((file) => {
          return !path.isAbsolute(file) ? resolveId(file, base, options, atRule) : file;
        })
      );
      resolved.forEach((file) => {
        result.messages.push({
          type: "dependency",
          plugin: "postcss-import",
          file,
          parent: sourceFile
        });
      });
      const importedContent = await Promise.all(
        resolved.map((file) => {
          return loadImportContent(result, stmt, file, options, state, postcss);
        })
      );
      stmt.children = importedContent.flat().filter((x) => !!x);
    }
    async function loadImportContent(result, stmt, filename, options, state, postcss) {
      const atRule = stmt.node;
      const { conditions, from } = stmt;
      const stmtDuplicateCheckKey = conditions.map(
        (condition) => formatImportPrelude(condition.layer, condition.media, condition.supports)
      ).join(":");
      if (options.skipDuplicates) {
        if (state.importedFiles[filename]?.[stmtDuplicateCheckKey]) {
          return;
        }
        if (!state.importedFiles[filename]) {
          state.importedFiles[filename] = {};
        }
        state.importedFiles[filename][stmtDuplicateCheckKey] = true;
      }
      if (from.includes(filename)) {
        return;
      }
      const content = await options.load(filename, options);
      if (content.trim() === "" && options.warnOnEmpty) {
        result.warn(`${filename} is empty`, { node: atRule });
        return;
      }
      if (options.skipDuplicates && state.hashFiles[content]?.[stmtDuplicateCheckKey]) {
        return;
      }
      const importedResult = await processContent(
        result,
        content,
        filename,
        options,
        postcss
      );
      const styles = importedResult.root;
      result.messages = result.messages.concat(importedResult.messages);
      if (options.skipDuplicates) {
        const hasImport = styles.some((child) => {
          return child.type === "atrule" && child.name === "import";
        });
        if (!hasImport) {
          if (!state.hashFiles[content]) {
            state.hashFiles[content] = {};
          }
          state.hashFiles[content][stmtDuplicateCheckKey] = true;
        }
      }
      return parseStyles(
        result,
        styles,
        options,
        state,
        conditions,
        [...from, filename],
        postcss
      );
    }
    function isProcessableURL(uri) {
      if (/^(?:[a-z]+:)?\/\//i.test(uri)) {
        return false;
      }
      try {
        const url = new URL(uri, "https://example.com");
        if (url.search) {
          return false;
        }
      } catch {
      }
      return true;
    }
    module.exports = parseStyles;
  }
});

// ../node_modules/postcss-import/index.js
var require_postcss_import = __commonJS({
  "../node_modules/postcss-import/index.js"(exports, module) {
    var path = __require("path");
    var applyConditions = require_apply_conditions();
    var applyRaws = require_apply_raws();
    var applyStyles = require_apply_styles();
    var loadContent = require_load_content();
    var parseStyles = require_parse_styles();
    var resolveId = require_resolve_id();
    function AtImport(options) {
      options = {
        root: process.cwd(),
        path: [],
        skipDuplicates: true,
        resolve: resolveId,
        load: loadContent,
        plugins: [],
        addModulesDirectories: [],
        warnOnEmpty: true,
        ...options
      };
      options.root = path.resolve(options.root);
      if (typeof options.path === "string") options.path = [options.path];
      if (!Array.isArray(options.path)) options.path = [];
      options.path = options.path.map((p) => path.resolve(options.root, p));
      return {
        postcssPlugin: "postcss-import",
        async Once(styles, { result, atRule, postcss }) {
          const state = {
            importedFiles: {},
            hashFiles: {}
          };
          if (styles.source?.input?.file) {
            state.importedFiles[styles.source.input.file] = {};
          }
          if (options.plugins && !Array.isArray(options.plugins)) {
            throw new Error("plugins option must be an array");
          }
          const bundle = await parseStyles(
            result,
            styles,
            options,
            state,
            [],
            [],
            postcss
          );
          applyRaws(bundle);
          applyConditions(bundle, atRule);
          applyStyles(bundle, styles);
        }
      };
    }
    AtImport.postcss = true;
    module.exports = AtImport;
  }
});
export default require_postcss_import();
