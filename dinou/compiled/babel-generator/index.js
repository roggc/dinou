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

// ../node_modules/@jridgewell/sourcemap-codec/dist/sourcemap-codec.umd.js
var require_sourcemap_codec_umd = __commonJS({
  "../node_modules/@jridgewell/sourcemap-codec/dist/sourcemap-codec.umd.js"(exports, module) {
    (function(global, factory) {
      if (typeof exports === "object" && typeof module !== "undefined") {
        factory(module);
        module.exports = def(module);
      } else if (typeof define === "function" && define.amd) {
        define(["module"], function(mod) {
          factory.apply(this, arguments);
          mod.exports = def(mod);
        });
      } else {
        const mod = { exports: {} };
        factory(mod);
        global = typeof globalThis !== "undefined" ? globalThis : global || self;
        global.sourcemapCodec = def(mod);
      }
      function def(m) {
        return "default" in m.exports ? m.exports.default : m.exports;
      }
    })(exports, (function(module2) {
      "use strict";
      var __defProp = Object.defineProperty;
      var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames2 = Object.getOwnPropertyNames;
      var __hasOwnProp = Object.prototype.hasOwnProperty;
      var __export = (target, all) => {
        for (var name in all)
          __defProp(target, name, { get: all[name], enumerable: true });
      };
      var __copyProps = (to, from, except, desc) => {
        if (from && typeof from === "object" || typeof from === "function") {
          for (let key of __getOwnPropNames2(from))
            if (!__hasOwnProp.call(to, key) && key !== except)
              __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
        }
        return to;
      };
      var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
      var sourcemap_codec_exports = {};
      __export(sourcemap_codec_exports, {
        decode: () => decode,
        decodeGeneratedRanges: () => decodeGeneratedRanges,
        decodeOriginalScopes: () => decodeOriginalScopes,
        encode: () => encode,
        encodeGeneratedRanges: () => encodeGeneratedRanges,
        encodeOriginalScopes: () => encodeOriginalScopes
      });
      module2.exports = __toCommonJS(sourcemap_codec_exports);
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
      function decodeInteger(reader, relative) {
        let value = 0;
        let shift = 0;
        let integer = 0;
        do {
          const c = reader.next();
          integer = charToInt[c];
          value |= (integer & 31) << shift;
          shift += 5;
        } while (integer & 32);
        const shouldNegate = value & 1;
        value >>>= 1;
        if (shouldNegate) {
          value = -2147483648 | -value;
        }
        return relative + value;
      }
      function encodeInteger(builder, num, relative) {
        let delta = num - relative;
        delta = delta < 0 ? -delta << 1 | 1 : delta << 1;
        do {
          let clamped = delta & 31;
          delta >>>= 5;
          if (delta > 0) clamped |= 32;
          builder.write(intToChar[clamped]);
        } while (delta > 0);
        return num;
      }
      function hasMoreVlq(reader, max) {
        if (reader.pos >= max) return false;
        return reader.peek() !== comma;
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
      var StringReader = class {
        constructor(buffer) {
          this.pos = 0;
          this.buffer = buffer;
        }
        next() {
          return this.buffer.charCodeAt(this.pos++);
        }
        peek() {
          return this.buffer.charCodeAt(this.pos);
        }
        indexOf(char) {
          const { buffer, pos } = this;
          const idx = buffer.indexOf(char, pos);
          return idx === -1 ? buffer.length : idx;
        }
      };
      var EMPTY = [];
      function decodeOriginalScopes(input) {
        const { length } = input;
        const reader = new StringReader(input);
        const scopes = [];
        const stack = [];
        let line = 0;
        for (; reader.pos < length; reader.pos++) {
          line = decodeInteger(reader, line);
          const column = decodeInteger(reader, 0);
          if (!hasMoreVlq(reader, length)) {
            const last = stack.pop();
            last[2] = line;
            last[3] = column;
            continue;
          }
          const kind = decodeInteger(reader, 0);
          const fields = decodeInteger(reader, 0);
          const hasName = fields & 1;
          const scope = hasName ? [line, column, 0, 0, kind, decodeInteger(reader, 0)] : [line, column, 0, 0, kind];
          let vars = EMPTY;
          if (hasMoreVlq(reader, length)) {
            vars = [];
            do {
              const varsIndex = decodeInteger(reader, 0);
              vars.push(varsIndex);
            } while (hasMoreVlq(reader, length));
          }
          scope.vars = vars;
          scopes.push(scope);
          stack.push(scope);
        }
        return scopes;
      }
      function encodeOriginalScopes(scopes) {
        const writer = new StringWriter();
        for (let i = 0; i < scopes.length; ) {
          i = _encodeOriginalScopes(scopes, i, writer, [0]);
        }
        return writer.flush();
      }
      function _encodeOriginalScopes(scopes, index, writer, state) {
        const scope = scopes[index];
        const { 0: startLine, 1: startColumn, 2: endLine, 3: endColumn, 4: kind, vars } = scope;
        if (index > 0) writer.write(comma);
        state[0] = encodeInteger(writer, startLine, state[0]);
        encodeInteger(writer, startColumn, 0);
        encodeInteger(writer, kind, 0);
        const fields = scope.length === 6 ? 1 : 0;
        encodeInteger(writer, fields, 0);
        if (scope.length === 6) encodeInteger(writer, scope[5], 0);
        for (const v of vars) {
          encodeInteger(writer, v, 0);
        }
        for (index++; index < scopes.length; ) {
          const next = scopes[index];
          const { 0: l, 1: c } = next;
          if (l > endLine || l === endLine && c >= endColumn) {
            break;
          }
          index = _encodeOriginalScopes(scopes, index, writer, state);
        }
        writer.write(comma);
        state[0] = encodeInteger(writer, endLine, state[0]);
        encodeInteger(writer, endColumn, 0);
        return index;
      }
      function decodeGeneratedRanges(input) {
        const { length } = input;
        const reader = new StringReader(input);
        const ranges = [];
        const stack = [];
        let genLine = 0;
        let definitionSourcesIndex = 0;
        let definitionScopeIndex = 0;
        let callsiteSourcesIndex = 0;
        let callsiteLine = 0;
        let callsiteColumn = 0;
        let bindingLine = 0;
        let bindingColumn = 0;
        do {
          const semi = reader.indexOf(";");
          let genColumn = 0;
          for (; reader.pos < semi; reader.pos++) {
            genColumn = decodeInteger(reader, genColumn);
            if (!hasMoreVlq(reader, semi)) {
              const last = stack.pop();
              last[2] = genLine;
              last[3] = genColumn;
              continue;
            }
            const fields = decodeInteger(reader, 0);
            const hasDefinition = fields & 1;
            const hasCallsite = fields & 2;
            const hasScope = fields & 4;
            let callsite = null;
            let bindings = EMPTY;
            let range;
            if (hasDefinition) {
              const defSourcesIndex = decodeInteger(reader, definitionSourcesIndex);
              definitionScopeIndex = decodeInteger(
                reader,
                definitionSourcesIndex === defSourcesIndex ? definitionScopeIndex : 0
              );
              definitionSourcesIndex = defSourcesIndex;
              range = [genLine, genColumn, 0, 0, defSourcesIndex, definitionScopeIndex];
            } else {
              range = [genLine, genColumn, 0, 0];
            }
            range.isScope = !!hasScope;
            if (hasCallsite) {
              const prevCsi = callsiteSourcesIndex;
              const prevLine = callsiteLine;
              callsiteSourcesIndex = decodeInteger(reader, callsiteSourcesIndex);
              const sameSource = prevCsi === callsiteSourcesIndex;
              callsiteLine = decodeInteger(reader, sameSource ? callsiteLine : 0);
              callsiteColumn = decodeInteger(
                reader,
                sameSource && prevLine === callsiteLine ? callsiteColumn : 0
              );
              callsite = [callsiteSourcesIndex, callsiteLine, callsiteColumn];
            }
            range.callsite = callsite;
            if (hasMoreVlq(reader, semi)) {
              bindings = [];
              do {
                bindingLine = genLine;
                bindingColumn = genColumn;
                const expressionsCount = decodeInteger(reader, 0);
                let expressionRanges;
                if (expressionsCount < -1) {
                  expressionRanges = [[decodeInteger(reader, 0)]];
                  for (let i = -1; i > expressionsCount; i--) {
                    const prevBl = bindingLine;
                    bindingLine = decodeInteger(reader, bindingLine);
                    bindingColumn = decodeInteger(reader, bindingLine === prevBl ? bindingColumn : 0);
                    const expression = decodeInteger(reader, 0);
                    expressionRanges.push([expression, bindingLine, bindingColumn]);
                  }
                } else {
                  expressionRanges = [[expressionsCount]];
                }
                bindings.push(expressionRanges);
              } while (hasMoreVlq(reader, semi));
            }
            range.bindings = bindings;
            ranges.push(range);
            stack.push(range);
          }
          genLine++;
          reader.pos = semi + 1;
        } while (reader.pos < length);
        return ranges;
      }
      function encodeGeneratedRanges(ranges) {
        if (ranges.length === 0) return "";
        const writer = new StringWriter();
        for (let i = 0; i < ranges.length; ) {
          i = _encodeGeneratedRanges(ranges, i, writer, [0, 0, 0, 0, 0, 0, 0]);
        }
        return writer.flush();
      }
      function _encodeGeneratedRanges(ranges, index, writer, state) {
        const range = ranges[index];
        const {
          0: startLine,
          1: startColumn,
          2: endLine,
          3: endColumn,
          isScope,
          callsite,
          bindings
        } = range;
        if (state[0] < startLine) {
          catchupLine(writer, state[0], startLine);
          state[0] = startLine;
          state[1] = 0;
        } else if (index > 0) {
          writer.write(comma);
        }
        state[1] = encodeInteger(writer, range[1], state[1]);
        const fields = (range.length === 6 ? 1 : 0) | (callsite ? 2 : 0) | (isScope ? 4 : 0);
        encodeInteger(writer, fields, 0);
        if (range.length === 6) {
          const { 4: sourcesIndex, 5: scopesIndex } = range;
          if (sourcesIndex !== state[2]) {
            state[3] = 0;
          }
          state[2] = encodeInteger(writer, sourcesIndex, state[2]);
          state[3] = encodeInteger(writer, scopesIndex, state[3]);
        }
        if (callsite) {
          const { 0: sourcesIndex, 1: callLine, 2: callColumn } = range.callsite;
          if (sourcesIndex !== state[4]) {
            state[5] = 0;
            state[6] = 0;
          } else if (callLine !== state[5]) {
            state[6] = 0;
          }
          state[4] = encodeInteger(writer, sourcesIndex, state[4]);
          state[5] = encodeInteger(writer, callLine, state[5]);
          state[6] = encodeInteger(writer, callColumn, state[6]);
        }
        if (bindings) {
          for (const binding of bindings) {
            if (binding.length > 1) encodeInteger(writer, -binding.length, 0);
            const expression = binding[0][0];
            encodeInteger(writer, expression, 0);
            let bindingStartLine = startLine;
            let bindingStartColumn = startColumn;
            for (let i = 1; i < binding.length; i++) {
              const expRange = binding[i];
              bindingStartLine = encodeInteger(writer, expRange[1], bindingStartLine);
              bindingStartColumn = encodeInteger(writer, expRange[2], bindingStartColumn);
              encodeInteger(writer, expRange[0], 0);
            }
          }
        }
        for (index++; index < ranges.length; ) {
          const next = ranges[index];
          const { 0: l, 1: c } = next;
          if (l > endLine || l === endLine && c >= endColumn) {
            break;
          }
          index = _encodeGeneratedRanges(ranges, index, writer, state);
        }
        if (state[0] < endLine) {
          catchupLine(writer, state[0], endLine);
          state[0] = endLine;
          state[1] = 0;
        } else {
          writer.write(comma);
        }
        state[1] = encodeInteger(writer, endColumn, state[1]);
        return index;
      }
      function catchupLine(writer, lastLine, line) {
        do {
          writer.write(semicolon);
        } while (++lastLine < line);
      }
      function decode(mappings) {
        const { length } = mappings;
        const reader = new StringReader(mappings);
        const decoded = [];
        let genColumn = 0;
        let sourcesIndex = 0;
        let sourceLine = 0;
        let sourceColumn = 0;
        let namesIndex = 0;
        do {
          const semi = reader.indexOf(";");
          const line = [];
          let sorted = true;
          let lastCol = 0;
          genColumn = 0;
          while (reader.pos < semi) {
            let seg;
            genColumn = decodeInteger(reader, genColumn);
            if (genColumn < lastCol) sorted = false;
            lastCol = genColumn;
            if (hasMoreVlq(reader, semi)) {
              sourcesIndex = decodeInteger(reader, sourcesIndex);
              sourceLine = decodeInteger(reader, sourceLine);
              sourceColumn = decodeInteger(reader, sourceColumn);
              if (hasMoreVlq(reader, semi)) {
                namesIndex = decodeInteger(reader, namesIndex);
                seg = [genColumn, sourcesIndex, sourceLine, sourceColumn, namesIndex];
              } else {
                seg = [genColumn, sourcesIndex, sourceLine, sourceColumn];
              }
            } else {
              seg = [genColumn];
            }
            line.push(seg);
            reader.pos++;
          }
          if (!sorted) sort(line);
          decoded.push(line);
          reader.pos = semi + 1;
        } while (reader.pos <= length);
        return decoded;
      }
      function sort(line) {
        line.sort(sortComparator);
      }
      function sortComparator(a, b) {
        return a[0] - b[0];
      }
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
    }));
  }
});

// ../node_modules/@jridgewell/resolve-uri/dist/resolve-uri.umd.js
var require_resolve_uri_umd = __commonJS({
  "../node_modules/@jridgewell/resolve-uri/dist/resolve-uri.umd.js"(exports, module) {
    (function(global, factory) {
      typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.resolveURI = factory());
    })(exports, (function() {
      "use strict";
      const schemeRegex = /^[\w+.-]+:\/\//;
      const urlRegex = /^([\w+.-]+:)\/\/([^@/#?]*@)?([^:/#?]*)(:\d+)?(\/[^#?]*)?(\?[^#]*)?(#.*)?/;
      const fileRegex = /^file:(?:\/\/((?![a-z]:)[^/#?]*)?)?(\/?[^#?]*)(\?[^#]*)?(#.*)?/i;
      function isAbsoluteUrl(input) {
        return schemeRegex.test(input);
      }
      function isSchemeRelativeUrl(input) {
        return input.startsWith("//");
      }
      function isAbsolutePath(input) {
        return input.startsWith("/");
      }
      function isFileUrl(input) {
        return input.startsWith("file:");
      }
      function isRelative(input) {
        return /^[.?#]/.test(input);
      }
      function parseAbsoluteUrl(input) {
        const match = urlRegex.exec(input);
        return makeUrl(match[1], match[2] || "", match[3], match[4] || "", match[5] || "/", match[6] || "", match[7] || "");
      }
      function parseFileUrl(input) {
        const match = fileRegex.exec(input);
        const path = match[2];
        return makeUrl("file:", "", match[1] || "", "", isAbsolutePath(path) ? path : "/" + path, match[3] || "", match[4] || "");
      }
      function makeUrl(scheme, user, host, port, path, query, hash) {
        return {
          scheme,
          user,
          host,
          port,
          path,
          query,
          hash,
          type: 7
        };
      }
      function parseUrl(input) {
        if (isSchemeRelativeUrl(input)) {
          const url2 = parseAbsoluteUrl("http:" + input);
          url2.scheme = "";
          url2.type = 6;
          return url2;
        }
        if (isAbsolutePath(input)) {
          const url2 = parseAbsoluteUrl("http://foo.com" + input);
          url2.scheme = "";
          url2.host = "";
          url2.type = 5;
          return url2;
        }
        if (isFileUrl(input))
          return parseFileUrl(input);
        if (isAbsoluteUrl(input))
          return parseAbsoluteUrl(input);
        const url = parseAbsoluteUrl("http://foo.com/" + input);
        url.scheme = "";
        url.host = "";
        url.type = input ? input.startsWith("?") ? 3 : input.startsWith("#") ? 2 : 4 : 1;
        return url;
      }
      function stripPathFilename(path) {
        if (path.endsWith("/.."))
          return path;
        const index = path.lastIndexOf("/");
        return path.slice(0, index + 1);
      }
      function mergePaths(url, base) {
        normalizePath(base, base.type);
        if (url.path === "/") {
          url.path = base.path;
        } else {
          url.path = stripPathFilename(base.path) + url.path;
        }
      }
      function normalizePath(url, type) {
        const rel = type <= 4;
        const pieces = url.path.split("/");
        let pointer = 1;
        let positive = 0;
        let addTrailingSlash = false;
        for (let i = 1; i < pieces.length; i++) {
          const piece = pieces[i];
          if (!piece) {
            addTrailingSlash = true;
            continue;
          }
          addTrailingSlash = false;
          if (piece === ".")
            continue;
          if (piece === "..") {
            if (positive) {
              addTrailingSlash = true;
              positive--;
              pointer--;
            } else if (rel) {
              pieces[pointer++] = piece;
            }
            continue;
          }
          pieces[pointer++] = piece;
          positive++;
        }
        let path = "";
        for (let i = 1; i < pointer; i++) {
          path += "/" + pieces[i];
        }
        if (!path || addTrailingSlash && !path.endsWith("/..")) {
          path += "/";
        }
        url.path = path;
      }
      function resolve(input, base) {
        if (!input && !base)
          return "";
        const url = parseUrl(input);
        let inputType = url.type;
        if (base && inputType !== 7) {
          const baseUrl = parseUrl(base);
          const baseType = baseUrl.type;
          switch (inputType) {
            case 1:
              url.hash = baseUrl.hash;
            // fall through
            case 2:
              url.query = baseUrl.query;
            // fall through
            case 3:
            case 4:
              mergePaths(url, baseUrl);
            // fall through
            case 5:
              url.user = baseUrl.user;
              url.host = baseUrl.host;
              url.port = baseUrl.port;
            // fall through
            case 6:
              url.scheme = baseUrl.scheme;
          }
          if (baseType > inputType)
            inputType = baseType;
        }
        normalizePath(url, inputType);
        const queryHash = url.query + url.hash;
        switch (inputType) {
          // This is impossible, because of the empty checks at the start of the function.
          // case UrlType.Empty:
          case 2:
          case 3:
            return queryHash;
          case 4: {
            const path = url.path.slice(1);
            if (!path)
              return queryHash || ".";
            if (isRelative(base || input) && !isRelative(path)) {
              return "./" + path + queryHash;
            }
            return path + queryHash;
          }
          case 5:
            return url.path + queryHash;
          default:
            return url.scheme + "//" + url.user + url.host + url.port + url.path + queryHash;
        }
      }
      return resolve;
    }));
  }
});

// ../node_modules/@jridgewell/trace-mapping/dist/trace-mapping.umd.js
var require_trace_mapping_umd = __commonJS({
  "../node_modules/@jridgewell/trace-mapping/dist/trace-mapping.umd.js"(exports, module) {
    (function(global, factory) {
      if (typeof exports === "object" && typeof module !== "undefined") {
        factory(module, require_resolve_uri_umd(), require_sourcemap_codec_umd());
        module.exports = def(module);
      } else if (typeof define === "function" && define.amd) {
        define(["module", "@jridgewell/resolve-uri", "@jridgewell/sourcemap-codec"], function(mod) {
          factory.apply(this, arguments);
          mod.exports = def(mod);
        });
      } else {
        const mod = { exports: {} };
        factory(mod, global.resolveURI, global.sourcemapCodec);
        global = typeof globalThis !== "undefined" ? globalThis : global || self;
        global.traceMapping = def(mod);
      }
      function def(m) {
        return "default" in m.exports ? m.exports.default : m.exports;
      }
    })(exports, (function(module2, require_resolveURI, require_sourcemapCodec) {
      "use strict";
      var __create = Object.create;
      var __defProp = Object.defineProperty;
      var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames2 = Object.getOwnPropertyNames;
      var __getProtoOf = Object.getPrototypeOf;
      var __hasOwnProp = Object.prototype.hasOwnProperty;
      var __commonJS2 = (cb, mod) => function __require() {
        return mod || (0, cb[__getOwnPropNames2(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
      };
      var __export = (target, all) => {
        for (var name in all)
          __defProp(target, name, { get: all[name], enumerable: true });
      };
      var __copyProps = (to, from, except, desc) => {
        if (from && typeof from === "object" || typeof from === "function") {
          for (let key of __getOwnPropNames2(from))
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
      var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
      var require_sourcemap_codec = __commonJS2({
        "umd:@jridgewell/sourcemap-codec"(exports2, module22) {
          module22.exports = require_sourcemapCodec;
        }
      });
      var require_resolve_uri = __commonJS2({
        "umd:@jridgewell/resolve-uri"(exports2, module22) {
          module22.exports = require_resolveURI;
        }
      });
      var trace_mapping_exports = {};
      __export(trace_mapping_exports, {
        AnyMap: () => FlattenMap,
        FlattenMap: () => FlattenMap,
        GREATEST_LOWER_BOUND: () => GREATEST_LOWER_BOUND,
        LEAST_UPPER_BOUND: () => LEAST_UPPER_BOUND,
        TraceMap: () => TraceMap,
        allGeneratedPositionsFor: () => allGeneratedPositionsFor,
        decodedMap: () => decodedMap,
        decodedMappings: () => decodedMappings,
        eachMapping: () => eachMapping,
        encodedMap: () => encodedMap,
        encodedMappings: () => encodedMappings,
        generatedPositionFor: () => generatedPositionFor,
        isIgnored: () => isIgnored,
        originalPositionFor: () => originalPositionFor,
        presortedDecodedMap: () => presortedDecodedMap,
        sourceContentFor: () => sourceContentFor,
        traceSegment: () => traceSegment
      });
      module2.exports = __toCommonJS(trace_mapping_exports);
      var import_sourcemap_codec = __toESM(require_sourcemap_codec());
      var import_resolve_uri = __toESM(require_resolve_uri());
      function stripFilename(path) {
        if (!path) return "";
        const index = path.lastIndexOf("/");
        return path.slice(0, index + 1);
      }
      function resolver(mapUrl, sourceRoot) {
        const from = stripFilename(mapUrl);
        const prefix = sourceRoot ? sourceRoot + "/" : "";
        return (source) => (0, import_resolve_uri.default)(prefix + (source || ""), from);
      }
      var COLUMN = 0;
      var SOURCES_INDEX = 1;
      var SOURCE_LINE = 2;
      var SOURCE_COLUMN = 3;
      var NAMES_INDEX = 4;
      var REV_GENERATED_LINE = 1;
      var REV_GENERATED_COLUMN = 2;
      function maybeSort(mappings, owned) {
        const unsortedIndex = nextUnsortedSegmentLine(mappings, 0);
        if (unsortedIndex === mappings.length) return mappings;
        if (!owned) mappings = mappings.slice();
        for (let i = unsortedIndex; i < mappings.length; i = nextUnsortedSegmentLine(mappings, i + 1)) {
          mappings[i] = sortSegments(mappings[i], owned);
        }
        return mappings;
      }
      function nextUnsortedSegmentLine(mappings, start) {
        for (let i = start; i < mappings.length; i++) {
          if (!isSorted(mappings[i])) return i;
        }
        return mappings.length;
      }
      function isSorted(line) {
        for (let j = 1; j < line.length; j++) {
          if (line[j][COLUMN] < line[j - 1][COLUMN]) {
            return false;
          }
        }
        return true;
      }
      function sortSegments(line, owned) {
        if (!owned) line = line.slice();
        return line.sort(sortComparator);
      }
      function sortComparator(a, b) {
        return a[COLUMN] - b[COLUMN];
      }
      function buildBySources(decoded, memos) {
        const sources = memos.map(() => []);
        for (let i = 0; i < decoded.length; i++) {
          const line = decoded[i];
          for (let j = 0; j < line.length; j++) {
            const seg = line[j];
            if (seg.length === 1) continue;
            const sourceIndex2 = seg[SOURCES_INDEX];
            const sourceLine = seg[SOURCE_LINE];
            const sourceColumn = seg[SOURCE_COLUMN];
            const source = sources[sourceIndex2];
            const segs = source[sourceLine] || (source[sourceLine] = []);
            segs.push([sourceColumn, i, seg[COLUMN]]);
          }
        }
        for (let i = 0; i < sources.length; i++) {
          const source = sources[i];
          for (let j = 0; j < source.length; j++) {
            const line = source[j];
            if (line) line.sort(sortComparator);
          }
        }
        return sources;
      }
      var found = false;
      function binarySearch(haystack, needle, low, high) {
        while (low <= high) {
          const mid = low + (high - low >> 1);
          const cmp = haystack[mid][COLUMN] - needle;
          if (cmp === 0) {
            found = true;
            return mid;
          }
          if (cmp < 0) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
        found = false;
        return low - 1;
      }
      function upperBound(haystack, needle, index) {
        for (let i = index + 1; i < haystack.length; index = i++) {
          if (haystack[i][COLUMN] !== needle) break;
        }
        return index;
      }
      function lowerBound(haystack, needle, index) {
        for (let i = index - 1; i >= 0; index = i--) {
          if (haystack[i][COLUMN] !== needle) break;
        }
        return index;
      }
      function memoizedState() {
        return {
          lastKey: -1,
          lastNeedle: -1,
          lastIndex: -1
        };
      }
      function memoizedBinarySearch(haystack, needle, state, key) {
        const { lastKey, lastNeedle, lastIndex } = state;
        let low = 0;
        let high = haystack.length - 1;
        if (key === lastKey) {
          if (needle === lastNeedle) {
            found = lastIndex !== -1 && haystack[lastIndex][COLUMN] === needle;
            return lastIndex;
          }
          if (needle >= lastNeedle) {
            low = lastIndex === -1 ? 0 : lastIndex;
          } else {
            high = lastIndex;
          }
        }
        state.lastKey = key;
        state.lastNeedle = needle;
        return state.lastIndex = binarySearch(haystack, needle, low, high);
      }
      function parse(map) {
        return typeof map === "string" ? JSON.parse(map) : map;
      }
      var FlattenMap = function(map, mapUrl) {
        const parsed = parse(map);
        if (!("sections" in parsed)) {
          return new TraceMap(parsed, mapUrl);
        }
        const mappings = [];
        const sources = [];
        const sourcesContent = [];
        const names = [];
        const ignoreList = [];
        recurse(
          parsed,
          mapUrl,
          mappings,
          sources,
          sourcesContent,
          names,
          ignoreList,
          0,
          0,
          Infinity,
          Infinity
        );
        const joined = {
          version: 3,
          file: parsed.file,
          names,
          sources,
          sourcesContent,
          mappings,
          ignoreList
        };
        return presortedDecodedMap(joined);
      };
      function recurse(input, mapUrl, mappings, sources, sourcesContent, names, ignoreList, lineOffset, columnOffset, stopLine, stopColumn) {
        const { sections } = input;
        for (let i = 0; i < sections.length; i++) {
          const { map, offset } = sections[i];
          let sl = stopLine;
          let sc = stopColumn;
          if (i + 1 < sections.length) {
            const nextOffset = sections[i + 1].offset;
            sl = Math.min(stopLine, lineOffset + nextOffset.line);
            if (sl === stopLine) {
              sc = Math.min(stopColumn, columnOffset + nextOffset.column);
            } else if (sl < stopLine) {
              sc = columnOffset + nextOffset.column;
            }
          }
          addSection(
            map,
            mapUrl,
            mappings,
            sources,
            sourcesContent,
            names,
            ignoreList,
            lineOffset + offset.line,
            columnOffset + offset.column,
            sl,
            sc
          );
        }
      }
      function addSection(input, mapUrl, mappings, sources, sourcesContent, names, ignoreList, lineOffset, columnOffset, stopLine, stopColumn) {
        const parsed = parse(input);
        if ("sections" in parsed) return recurse(...arguments);
        const map = new TraceMap(parsed, mapUrl);
        const sourcesOffset = sources.length;
        const namesOffset = names.length;
        const decoded = decodedMappings(map);
        const { resolvedSources, sourcesContent: contents, ignoreList: ignores } = map;
        append(sources, resolvedSources);
        append(names, map.names);
        if (contents) append(sourcesContent, contents);
        else for (let i = 0; i < resolvedSources.length; i++) sourcesContent.push(null);
        if (ignores) for (let i = 0; i < ignores.length; i++) ignoreList.push(ignores[i] + sourcesOffset);
        for (let i = 0; i < decoded.length; i++) {
          const lineI = lineOffset + i;
          if (lineI > stopLine) return;
          const out = getLine(mappings, lineI);
          const cOffset = i === 0 ? columnOffset : 0;
          const line = decoded[i];
          for (let j = 0; j < line.length; j++) {
            const seg = line[j];
            const column = cOffset + seg[COLUMN];
            if (lineI === stopLine && column >= stopColumn) return;
            if (seg.length === 1) {
              out.push([column]);
              continue;
            }
            const sourcesIndex = sourcesOffset + seg[SOURCES_INDEX];
            const sourceLine = seg[SOURCE_LINE];
            const sourceColumn = seg[SOURCE_COLUMN];
            out.push(
              seg.length === 4 ? [column, sourcesIndex, sourceLine, sourceColumn] : [column, sourcesIndex, sourceLine, sourceColumn, namesOffset + seg[NAMES_INDEX]]
            );
          }
        }
      }
      function append(arr, other) {
        for (let i = 0; i < other.length; i++) arr.push(other[i]);
      }
      function getLine(arr, index) {
        for (let i = arr.length; i <= index; i++) arr[i] = [];
        return arr[index];
      }
      var LINE_GTR_ZERO = "`line` must be greater than 0 (lines start at line 1)";
      var COL_GTR_EQ_ZERO = "`column` must be greater than or equal to 0 (columns start at column 0)";
      var LEAST_UPPER_BOUND = -1;
      var GREATEST_LOWER_BOUND = 1;
      var TraceMap = class {
        constructor(map, mapUrl) {
          const isString = typeof map === "string";
          if (!isString && map._decodedMemo) return map;
          const parsed = parse(map);
          const { version, file, names, sourceRoot, sources, sourcesContent } = parsed;
          this.version = version;
          this.file = file;
          this.names = names || [];
          this.sourceRoot = sourceRoot;
          this.sources = sources;
          this.sourcesContent = sourcesContent;
          this.ignoreList = parsed.ignoreList || parsed.x_google_ignoreList || void 0;
          const resolve = resolver(mapUrl, sourceRoot);
          this.resolvedSources = sources.map(resolve);
          const { mappings } = parsed;
          if (typeof mappings === "string") {
            this._encoded = mappings;
            this._decoded = void 0;
          } else if (Array.isArray(mappings)) {
            this._encoded = void 0;
            this._decoded = maybeSort(mappings, isString);
          } else if (parsed.sections) {
            throw new Error(`TraceMap passed sectioned source map, please use FlattenMap export instead`);
          } else {
            throw new Error(`invalid source map: ${JSON.stringify(parsed)}`);
          }
          this._decodedMemo = memoizedState();
          this._bySources = void 0;
          this._bySourceMemos = void 0;
        }
      };
      function cast(map) {
        return map;
      }
      function encodedMappings(map) {
        var _a, _b;
        return (_b = (_a = cast(map))._encoded) != null ? _b : _a._encoded = (0, import_sourcemap_codec.encode)(cast(map)._decoded);
      }
      function decodedMappings(map) {
        var _a;
        return (_a = cast(map))._decoded || (_a._decoded = (0, import_sourcemap_codec.decode)(cast(map)._encoded));
      }
      function traceSegment(map, line, column) {
        const decoded = decodedMappings(map);
        if (line >= decoded.length) return null;
        const segments = decoded[line];
        const index = traceSegmentInternal(
          segments,
          cast(map)._decodedMemo,
          line,
          column,
          GREATEST_LOWER_BOUND
        );
        return index === -1 ? null : segments[index];
      }
      function originalPositionFor(map, needle) {
        let { line, column, bias } = needle;
        line--;
        if (line < 0) throw new Error(LINE_GTR_ZERO);
        if (column < 0) throw new Error(COL_GTR_EQ_ZERO);
        const decoded = decodedMappings(map);
        if (line >= decoded.length) return OMapping(null, null, null, null);
        const segments = decoded[line];
        const index = traceSegmentInternal(
          segments,
          cast(map)._decodedMemo,
          line,
          column,
          bias || GREATEST_LOWER_BOUND
        );
        if (index === -1) return OMapping(null, null, null, null);
        const segment = segments[index];
        if (segment.length === 1) return OMapping(null, null, null, null);
        const { names, resolvedSources } = map;
        return OMapping(
          resolvedSources[segment[SOURCES_INDEX]],
          segment[SOURCE_LINE] + 1,
          segment[SOURCE_COLUMN],
          segment.length === 5 ? names[segment[NAMES_INDEX]] : null
        );
      }
      function generatedPositionFor(map, needle) {
        const { source, line, column, bias } = needle;
        return generatedPosition(map, source, line, column, bias || GREATEST_LOWER_BOUND, false);
      }
      function allGeneratedPositionsFor(map, needle) {
        const { source, line, column, bias } = needle;
        return generatedPosition(map, source, line, column, bias || LEAST_UPPER_BOUND, true);
      }
      function eachMapping(map, cb) {
        const decoded = decodedMappings(map);
        const { names, resolvedSources } = map;
        for (let i = 0; i < decoded.length; i++) {
          const line = decoded[i];
          for (let j = 0; j < line.length; j++) {
            const seg = line[j];
            const generatedLine = i + 1;
            const generatedColumn = seg[0];
            let source = null;
            let originalLine = null;
            let originalColumn = null;
            let name = null;
            if (seg.length !== 1) {
              source = resolvedSources[seg[1]];
              originalLine = seg[2] + 1;
              originalColumn = seg[3];
            }
            if (seg.length === 5) name = names[seg[4]];
            cb({
              generatedLine,
              generatedColumn,
              source,
              originalLine,
              originalColumn,
              name
            });
          }
        }
      }
      function sourceIndex(map, source) {
        const { sources, resolvedSources } = map;
        let index = sources.indexOf(source);
        if (index === -1) index = resolvedSources.indexOf(source);
        return index;
      }
      function sourceContentFor(map, source) {
        const { sourcesContent } = map;
        if (sourcesContent == null) return null;
        const index = sourceIndex(map, source);
        return index === -1 ? null : sourcesContent[index];
      }
      function isIgnored(map, source) {
        const { ignoreList } = map;
        if (ignoreList == null) return false;
        const index = sourceIndex(map, source);
        return index === -1 ? false : ignoreList.includes(index);
      }
      function presortedDecodedMap(map, mapUrl) {
        const tracer = new TraceMap(clone(map, []), mapUrl);
        cast(tracer)._decoded = map.mappings;
        return tracer;
      }
      function decodedMap(map) {
        return clone(map, decodedMappings(map));
      }
      function encodedMap(map) {
        return clone(map, encodedMappings(map));
      }
      function clone(map, mappings) {
        return {
          version: map.version,
          file: map.file,
          names: map.names,
          sourceRoot: map.sourceRoot,
          sources: map.sources,
          sourcesContent: map.sourcesContent,
          mappings,
          ignoreList: map.ignoreList || map.x_google_ignoreList
        };
      }
      function OMapping(source, line, column, name) {
        return { source, line, column, name };
      }
      function GMapping(line, column) {
        return { line, column };
      }
      function traceSegmentInternal(segments, memo, line, column, bias) {
        let index = memoizedBinarySearch(segments, column, memo, line);
        if (found) {
          index = (bias === LEAST_UPPER_BOUND ? upperBound : lowerBound)(segments, column, index);
        } else if (bias === LEAST_UPPER_BOUND) index++;
        if (index === -1 || index === segments.length) return -1;
        return index;
      }
      function sliceGeneratedPositions(segments, memo, line, column, bias) {
        let min = traceSegmentInternal(segments, memo, line, column, GREATEST_LOWER_BOUND);
        if (!found && bias === LEAST_UPPER_BOUND) min++;
        if (min === -1 || min === segments.length) return [];
        const matchedColumn = found ? column : segments[min][COLUMN];
        if (!found) min = lowerBound(segments, matchedColumn, min);
        const max = upperBound(segments, matchedColumn, min);
        const result = [];
        for (; min <= max; min++) {
          const segment = segments[min];
          result.push(GMapping(segment[REV_GENERATED_LINE] + 1, segment[REV_GENERATED_COLUMN]));
        }
        return result;
      }
      function generatedPosition(map, source, line, column, bias, all) {
        var _a, _b;
        line--;
        if (line < 0) throw new Error(LINE_GTR_ZERO);
        if (column < 0) throw new Error(COL_GTR_EQ_ZERO);
        const { sources, resolvedSources } = map;
        let sourceIndex2 = sources.indexOf(source);
        if (sourceIndex2 === -1) sourceIndex2 = resolvedSources.indexOf(source);
        if (sourceIndex2 === -1) return all ? [] : GMapping(null, null);
        const bySourceMemos = (_a = cast(map))._bySourceMemos || (_a._bySourceMemos = sources.map(memoizedState));
        const generated = (_b = cast(map))._bySources || (_b._bySources = buildBySources(decodedMappings(map), bySourceMemos));
        const segments = generated[sourceIndex2][line];
        if (segments == null) return all ? [] : GMapping(null, null);
        const memo = bySourceMemos[sourceIndex2];
        if (all) return sliceGeneratedPositions(segments, memo, line, column, bias);
        const index = traceSegmentInternal(segments, memo, line, column, bias);
        if (index === -1) return GMapping(null, null);
        const segment = segments[index];
        return GMapping(segment[REV_GENERATED_LINE] + 1, segment[REV_GENERATED_COLUMN]);
      }
    }));
  }
});

// ../node_modules/@jridgewell/gen-mapping/dist/gen-mapping.umd.js
var require_gen_mapping_umd = __commonJS({
  "../node_modules/@jridgewell/gen-mapping/dist/gen-mapping.umd.js"(exports, module) {
    (function(global, factory) {
      if (typeof exports === "object" && typeof module !== "undefined") {
        factory(module, require_sourcemap_codec_umd(), require_trace_mapping_umd());
        module.exports = def(module);
      } else if (typeof define === "function" && define.amd) {
        define(["module", "@jridgewell/sourcemap-codec", "@jridgewell/trace-mapping"], function(mod) {
          factory.apply(this, arguments);
          mod.exports = def(mod);
        });
      } else {
        const mod = { exports: {} };
        factory(mod, global.sourcemapCodec, global.traceMapping);
        global = typeof globalThis !== "undefined" ? globalThis : global || self;
        global.genMapping = def(mod);
      }
      function def(m) {
        return "default" in m.exports ? m.exports.default : m.exports;
      }
    })(exports, (function(module2, require_sourcemapCodec, require_traceMapping) {
      "use strict";
      var __create = Object.create;
      var __defProp = Object.defineProperty;
      var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames2 = Object.getOwnPropertyNames;
      var __getProtoOf = Object.getPrototypeOf;
      var __hasOwnProp = Object.prototype.hasOwnProperty;
      var __commonJS2 = (cb, mod) => function __require() {
        return mod || (0, cb[__getOwnPropNames2(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
      };
      var __export = (target, all) => {
        for (var name in all)
          __defProp(target, name, { get: all[name], enumerable: true });
      };
      var __copyProps = (to, from, except, desc) => {
        if (from && typeof from === "object" || typeof from === "function") {
          for (let key of __getOwnPropNames2(from))
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
      var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
      var require_sourcemap_codec = __commonJS2({
        "umd:@jridgewell/sourcemap-codec"(exports2, module22) {
          module22.exports = require_sourcemapCodec;
        }
      });
      var require_trace_mapping = __commonJS2({
        "umd:@jridgewell/trace-mapping"(exports2, module22) {
          module22.exports = require_traceMapping;
        }
      });
      var gen_mapping_exports = {};
      __export(gen_mapping_exports, {
        GenMapping: () => GenMapping,
        addMapping: () => addMapping,
        addSegment: () => addSegment,
        allMappings: () => allMappings,
        fromMap: () => fromMap,
        maybeAddMapping: () => maybeAddMapping,
        maybeAddSegment: () => maybeAddSegment,
        setIgnore: () => setIgnore,
        setSourceContent: () => setSourceContent,
        toDecodedMap: () => toDecodedMap,
        toEncodedMap: () => toEncodedMap
      });
      module2.exports = __toCommonJS(gen_mapping_exports);
      var SetArray = class {
        constructor() {
          this._indexes = { __proto__: null };
          this.array = [];
        }
      };
      function cast(set) {
        return set;
      }
      function get(setarr, key) {
        return cast(setarr)._indexes[key];
      }
      function put(setarr, key) {
        const index = get(setarr, key);
        if (index !== void 0) return index;
        const { array, _indexes: indexes } = cast(setarr);
        const length = array.push(key);
        return indexes[key] = length - 1;
      }
      function remove(setarr, key) {
        const index = get(setarr, key);
        if (index === void 0) return;
        const { array, _indexes: indexes } = cast(setarr);
        for (let i = index + 1; i < array.length; i++) {
          const k = array[i];
          array[i - 1] = k;
          indexes[k]--;
        }
        indexes[key] = void 0;
        array.pop();
      }
      var import_sourcemap_codec = __toESM(require_sourcemap_codec());
      var import_trace_mapping = __toESM(require_trace_mapping());
      var COLUMN = 0;
      var SOURCES_INDEX = 1;
      var SOURCE_LINE = 2;
      var SOURCE_COLUMN = 3;
      var NAMES_INDEX = 4;
      var NO_NAME = -1;
      var GenMapping = class {
        constructor({ file, sourceRoot } = {}) {
          this._names = new SetArray();
          this._sources = new SetArray();
          this._sourcesContent = [];
          this._mappings = [];
          this.file = file;
          this.sourceRoot = sourceRoot;
          this._ignoreList = new SetArray();
        }
      };
      function cast2(map) {
        return map;
      }
      function addSegment(map, genLine, genColumn, source, sourceLine, sourceColumn, name, content) {
        return addSegmentInternal(
          false,
          map,
          genLine,
          genColumn,
          source,
          sourceLine,
          sourceColumn,
          name,
          content
        );
      }
      function addMapping(map, mapping) {
        return addMappingInternal(false, map, mapping);
      }
      var maybeAddSegment = (map, genLine, genColumn, source, sourceLine, sourceColumn, name, content) => {
        return addSegmentInternal(
          true,
          map,
          genLine,
          genColumn,
          source,
          sourceLine,
          sourceColumn,
          name,
          content
        );
      };
      var maybeAddMapping = (map, mapping) => {
        return addMappingInternal(true, map, mapping);
      };
      function setSourceContent(map, source, content) {
        const {
          _sources: sources,
          _sourcesContent: sourcesContent
          // _originalScopes: originalScopes,
        } = cast2(map);
        const index = put(sources, source);
        sourcesContent[index] = content;
      }
      function setIgnore(map, source, ignore = true) {
        const {
          _sources: sources,
          _sourcesContent: sourcesContent,
          _ignoreList: ignoreList
          // _originalScopes: originalScopes,
        } = cast2(map);
        const index = put(sources, source);
        if (index === sourcesContent.length) sourcesContent[index] = null;
        if (ignore) put(ignoreList, index);
        else remove(ignoreList, index);
      }
      function toDecodedMap(map) {
        const {
          _mappings: mappings,
          _sources: sources,
          _sourcesContent: sourcesContent,
          _names: names,
          _ignoreList: ignoreList
          // _originalScopes: originalScopes,
          // _generatedRanges: generatedRanges,
        } = cast2(map);
        removeEmptyFinalLines(mappings);
        return {
          version: 3,
          file: map.file || void 0,
          names: names.array,
          sourceRoot: map.sourceRoot || void 0,
          sources: sources.array,
          sourcesContent,
          mappings,
          // originalScopes,
          // generatedRanges,
          ignoreList: ignoreList.array
        };
      }
      function toEncodedMap(map) {
        const decoded = toDecodedMap(map);
        return Object.assign({}, decoded, {
          // originalScopes: decoded.originalScopes.map((os) => encodeOriginalScopes(os)),
          // generatedRanges: encodeGeneratedRanges(decoded.generatedRanges as GeneratedRange[]),
          mappings: (0, import_sourcemap_codec.encode)(decoded.mappings)
        });
      }
      function fromMap(input) {
        const map = new import_trace_mapping.TraceMap(input);
        const gen = new GenMapping({ file: map.file, sourceRoot: map.sourceRoot });
        putAll(cast2(gen)._names, map.names);
        putAll(cast2(gen)._sources, map.sources);
        cast2(gen)._sourcesContent = map.sourcesContent || map.sources.map(() => null);
        cast2(gen)._mappings = (0, import_trace_mapping.decodedMappings)(map);
        if (map.ignoreList) putAll(cast2(gen)._ignoreList, map.ignoreList);
        return gen;
      }
      function allMappings(map) {
        const out = [];
        const { _mappings: mappings, _sources: sources, _names: names } = cast2(map);
        for (let i = 0; i < mappings.length; i++) {
          const line = mappings[i];
          for (let j = 0; j < line.length; j++) {
            const seg = line[j];
            const generated = { line: i + 1, column: seg[COLUMN] };
            let source = void 0;
            let original = void 0;
            let name = void 0;
            if (seg.length !== 1) {
              source = sources.array[seg[SOURCES_INDEX]];
              original = { line: seg[SOURCE_LINE] + 1, column: seg[SOURCE_COLUMN] };
              if (seg.length === 5) name = names.array[seg[NAMES_INDEX]];
            }
            out.push({ generated, source, original, name });
          }
        }
        return out;
      }
      function addSegmentInternal(skipable, map, genLine, genColumn, source, sourceLine, sourceColumn, name, content) {
        const {
          _mappings: mappings,
          _sources: sources,
          _sourcesContent: sourcesContent,
          _names: names
          // _originalScopes: originalScopes,
        } = cast2(map);
        const line = getIndex(mappings, genLine);
        const index = getColumnIndex(line, genColumn);
        if (!source) {
          if (skipable && skipSourceless(line, index)) return;
          return insert(line, index, [genColumn]);
        }
        assert(sourceLine);
        assert(sourceColumn);
        const sourcesIndex = put(sources, source);
        const namesIndex = name ? put(names, name) : NO_NAME;
        if (sourcesIndex === sourcesContent.length) sourcesContent[sourcesIndex] = content != null ? content : null;
        if (skipable && skipSource(line, index, sourcesIndex, sourceLine, sourceColumn, namesIndex)) {
          return;
        }
        return insert(
          line,
          index,
          name ? [genColumn, sourcesIndex, sourceLine, sourceColumn, namesIndex] : [genColumn, sourcesIndex, sourceLine, sourceColumn]
        );
      }
      function assert(_val) {
      }
      function getIndex(arr, index) {
        for (let i = arr.length; i <= index; i++) {
          arr[i] = [];
        }
        return arr[index];
      }
      function getColumnIndex(line, genColumn) {
        let index = line.length;
        for (let i = index - 1; i >= 0; index = i--) {
          const current = line[i];
          if (genColumn >= current[COLUMN]) break;
        }
        return index;
      }
      function insert(array, index, value) {
        for (let i = array.length; i > index; i--) {
          array[i] = array[i - 1];
        }
        array[index] = value;
      }
      function removeEmptyFinalLines(mappings) {
        const { length } = mappings;
        let len = length;
        for (let i = len - 1; i >= 0; len = i, i--) {
          if (mappings[i].length > 0) break;
        }
        if (len < length) mappings.length = len;
      }
      function putAll(setarr, array) {
        for (let i = 0; i < array.length; i++) put(setarr, array[i]);
      }
      function skipSourceless(line, index) {
        if (index === 0) return true;
        const prev = line[index - 1];
        return prev.length === 1;
      }
      function skipSource(line, index, sourcesIndex, sourceLine, sourceColumn, namesIndex) {
        if (index === 0) return false;
        const prev = line[index - 1];
        if (prev.length === 1) return false;
        return sourcesIndex === prev[SOURCES_INDEX] && sourceLine === prev[SOURCE_LINE] && sourceColumn === prev[SOURCE_COLUMN] && namesIndex === (prev.length === 5 ? prev[NAMES_INDEX] : NO_NAME);
      }
      function addMappingInternal(skipable, map, mapping) {
        const { generated, source, original, name, content } = mapping;
        if (!source) {
          return addSegmentInternal(
            skipable,
            map,
            generated.line - 1,
            generated.column,
            null,
            null,
            null,
            null,
            null
          );
        }
        assert(original);
        return addSegmentInternal(
          skipable,
          map,
          generated.line - 1,
          generated.column,
          source,
          original.line - 1,
          original.column,
          name,
          content
        );
      }
    }));
  }
});

// ../node_modules/@babel/generator/lib/source-map.js
var require_source_map = __commonJS({
  "../node_modules/@babel/generator/lib/source-map.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    var _genMapping = require_gen_mapping_umd();
    var _traceMapping = require_trace_mapping_umd();
    var SourceMap = class {
      constructor(opts, code) {
        var _opts$sourceFileName;
        this._map = void 0;
        this._rawMappings = void 0;
        this._sourceFileName = void 0;
        this._lastGenLine = 0;
        this._lastSourceLine = 0;
        this._lastSourceColumn = 0;
        this._inputMap = null;
        const map = this._map = new _genMapping.GenMapping({
          sourceRoot: opts.sourceRoot
        });
        this._sourceFileName = (_opts$sourceFileName = opts.sourceFileName) == null ? void 0 : _opts$sourceFileName.replace(/\\/g, "/");
        this._rawMappings = void 0;
        if (opts.inputSourceMap) {
          this._inputMap = new _traceMapping.TraceMap(opts.inputSourceMap);
          const resolvedSources = this._inputMap.resolvedSources;
          if (resolvedSources.length) {
            for (let i = 0; i < resolvedSources.length; i++) {
              var _this$_inputMap$sourc;
              (0, _genMapping.setSourceContent)(map, resolvedSources[i], (_this$_inputMap$sourc = this._inputMap.sourcesContent) == null ? void 0 : _this$_inputMap$sourc[i]);
            }
          }
        }
        if (typeof code === "string" && !opts.inputSourceMap) {
          (0, _genMapping.setSourceContent)(map, this._sourceFileName, code);
        } else if (typeof code === "object") {
          for (const sourceFileName of Object.keys(code)) {
            (0, _genMapping.setSourceContent)(map, sourceFileName.replace(/\\/g, "/"), code[sourceFileName]);
          }
        }
      }
      get() {
        return (0, _genMapping.toEncodedMap)(this._map);
      }
      getDecoded() {
        return (0, _genMapping.toDecodedMap)(this._map);
      }
      getRawMappings() {
        return this._rawMappings || (this._rawMappings = (0, _genMapping.allMappings)(this._map));
      }
      mark(generated, line, column, identifierName, identifierNamePos, filename) {
        var _originalMapping;
        this._rawMappings = void 0;
        let originalMapping;
        if (line != null) {
          if (this._inputMap) {
            originalMapping = (0, _traceMapping.originalPositionFor)(this._inputMap, {
              line,
              column
            });
            if (originalMapping.name && (identifierNamePos || identifierName != null && originalMapping.column === column)) {
              identifierName = originalMapping.name;
            } else if (identifierNamePos) {
              const originalIdentifierMapping = (0, _traceMapping.originalPositionFor)(this._inputMap, identifierNamePos);
              if (originalIdentifierMapping.name) {
                identifierName = originalIdentifierMapping.name;
              }
            }
          } else {
            originalMapping = {
              name: null,
              source: (filename == null ? void 0 : filename.replace(/\\/g, "/")) || this._sourceFileName,
              line,
              column
            };
          }
        }
        (0, _genMapping.maybeAddMapping)(this._map, {
          name: identifierName,
          generated,
          source: (_originalMapping = originalMapping) == null ? void 0 : _originalMapping.source,
          original: originalMapping
        });
      }
    };
    exports.default = SourceMap;
  }
});

// ../node_modules/@babel/generator/lib/buffer.js
var require_buffer = __commonJS({
  "../node_modules/@babel/generator/lib/buffer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    var spaceIndents = [];
    for (let i = 0; i < 32; i++) {
      spaceIndents.push(" ".repeat(i * 2));
    }
    var Buffer2 = class {
      constructor(map, indentChar) {
        this._map = null;
        this._buf = "";
        this._str = "";
        this._appendCount = 0;
        this._last = 0;
        this._canMarkIdName = true;
        this._indentChar = "";
        this._queuedChar = 0;
        this._position = {
          line: 1,
          column: 0
        };
        this._sourcePosition = {
          identifierName: void 0,
          identifierNamePos: void 0,
          line: void 0,
          column: void 0,
          filename: void 0
        };
        this._map = map;
        this._indentChar = indentChar;
      }
      get() {
        const {
          _map,
          _last
        } = this;
        if (this._queuedChar !== 32) {
          this._flush();
        }
        const code = _last === 10 ? (this._buf + this._str).trimRight() : this._buf + this._str;
        if (_map === null) {
          return {
            code,
            decodedMap: void 0,
            map: null,
            rawMappings: void 0
          };
        }
        const result = {
          code,
          decodedMap: _map.getDecoded(),
          get __mergedMap() {
            return this.map;
          },
          get map() {
            const resultMap = _map.get();
            result.map = resultMap;
            return resultMap;
          },
          set map(value) {
            Object.defineProperty(result, "map", {
              value,
              writable: true
            });
          },
          get rawMappings() {
            const mappings = _map.getRawMappings();
            result.rawMappings = mappings;
            return mappings;
          },
          set rawMappings(value) {
            Object.defineProperty(result, "rawMappings", {
              value,
              writable: true
            });
          }
        };
        return result;
      }
      append(str, maybeNewline, ignoreMapping = false) {
        this._flush();
        this._append(str, maybeNewline, ignoreMapping);
      }
      appendChar(char) {
        this._flush();
        this._appendChar(char, 1, true);
      }
      queue(char) {
        this._flush();
        this._queuedChar = char;
      }
      _flush() {
        const queuedChar = this._queuedChar;
        if (queuedChar !== 0) {
          this._appendChar(queuedChar, 1, true);
          this._queuedChar = 0;
        }
      }
      _appendChar(char, repeat, useSourcePos) {
        this._last = char;
        if (char === -1) {
          const indent = repeat >= 64 ? this._indentChar.repeat(repeat) : spaceIndents[repeat / 2];
          this._str += indent;
        } else {
          this._str += repeat > 1 ? String.fromCharCode(char).repeat(repeat) : String.fromCharCode(char);
        }
        const isSpace = char === 32;
        const position = this._position;
        if (char !== 10) {
          if (this._map) {
            const sourcePos = this._sourcePosition;
            if (useSourcePos && sourcePos) {
              this._map.mark(position, sourcePos.line, sourcePos.column, isSpace ? void 0 : sourcePos.identifierName, isSpace ? void 0 : sourcePos.identifierNamePos, sourcePos.filename);
              if (!isSpace && this._canMarkIdName) {
                sourcePos.identifierName = void 0;
                sourcePos.identifierNamePos = void 0;
              }
            } else {
              this._map.mark(position);
            }
          }
          position.column += repeat;
        } else {
          position.line++;
          position.column = 0;
        }
      }
      _append(str, maybeNewline, ignoreMapping) {
        const len = str.length;
        const position = this._position;
        const sourcePos = this._sourcePosition;
        this._last = -1;
        if (++this._appendCount > 4096) {
          +this._str;
          this._buf += this._str;
          this._str = str;
          this._appendCount = 0;
        } else {
          this._str += str;
        }
        const hasMap = !ignoreMapping && this._map !== null;
        if (!maybeNewline && !hasMap) {
          position.column += len;
          return;
        }
        const {
          column,
          identifierName,
          identifierNamePos,
          filename
        } = sourcePos;
        let line = sourcePos.line;
        if ((identifierName != null || identifierNamePos != null) && this._canMarkIdName) {
          sourcePos.identifierName = void 0;
          sourcePos.identifierNamePos = void 0;
        }
        let i = str.indexOf("\n");
        let last = 0;
        if (hasMap && i !== 0) {
          this._map.mark(position, line, column, identifierName, identifierNamePos, filename);
        }
        while (i !== -1) {
          position.line++;
          position.column = 0;
          last = i + 1;
          if (last < len && line !== void 0) {
            line++;
            if (hasMap) {
              this._map.mark(position, line, 0, void 0, void 0, filename);
            }
          }
          i = str.indexOf("\n", last);
        }
        position.column += len - last;
      }
      removeLastSemicolon() {
        if (this._queuedChar === 59) {
          this._queuedChar = 0;
        }
      }
      getLastChar(checkQueue) {
        if (!checkQueue) {
          return this._last;
        }
        const queuedChar = this._queuedChar;
        return queuedChar !== 0 ? queuedChar : this._last;
      }
      getNewlineCount() {
        return this._queuedChar === 0 && this._last === 10 ? 1 : 0;
      }
      hasContent() {
        return this._last !== 0;
      }
      exactSource(loc, cb) {
        if (!this._map) {
          cb();
          return;
        }
        this.source("start", loc);
        const identifierName = loc.identifierName;
        const sourcePos = this._sourcePosition;
        if (identifierName != null) {
          this._canMarkIdName = false;
          sourcePos.identifierName = identifierName;
        }
        cb();
        if (identifierName != null) {
          this._canMarkIdName = true;
          sourcePos.identifierName = void 0;
          sourcePos.identifierNamePos = void 0;
        }
        this.source("end", loc);
      }
      source(prop, loc) {
        if (!this._map) return;
        this._normalizePosition(prop, loc, 0);
      }
      sourceWithOffset(prop, loc, columnOffset) {
        if (!this._map) return;
        this._normalizePosition(prop, loc, columnOffset);
      }
      _normalizePosition(prop, loc, columnOffset) {
        this._flush();
        const pos = loc[prop];
        if (pos) {
          this.setSourcePosition(pos.line, Math.max(pos.column + columnOffset, 0));
          this._sourcePosition.filename = loc.filename;
        }
      }
      setSourcePosition(line, column) {
        const target = this._sourcePosition;
        target.line = line;
        target.column = column;
      }
      getCurrentColumn() {
        return this._position.column + (this._queuedChar ? 1 : 0);
      }
      getCurrentLine() {
        return this._position.line;
      }
    };
    exports.default = Buffer2;
  }
});

// ../node_modules/@babel/types/lib/utils/shallowEqual.js
var require_shallowEqual = __commonJS({
  "../node_modules/@babel/types/lib/utils/shallowEqual.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = shallowEqual;
    function shallowEqual(actual, expected) {
      const keys = Object.keys(expected);
      for (const key of keys) {
        if (actual[key] !== expected[key]) {
          return false;
        }
      }
      return true;
    }
  }
});

// ../node_modules/@babel/types/lib/utils/deprecationWarning.js
var require_deprecationWarning = __commonJS({
  "../node_modules/@babel/types/lib/utils/deprecationWarning.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = deprecationWarning;
    var warnings = /* @__PURE__ */ new Set();
    function deprecationWarning(oldName, newName, prefix = "", cacheKey = oldName) {
      if (warnings.has(cacheKey)) return;
      warnings.add(cacheKey);
      const {
        internal,
        trace
      } = captureShortStackTrace(1, 2);
      if (internal) {
        return;
      }
      console.warn(`${prefix}\`${oldName}\` has been deprecated, please migrate to \`${newName}\`
${trace}`);
    }
    function captureShortStackTrace(skip, length) {
      const {
        stackTraceLimit,
        prepareStackTrace
      } = Error;
      let stackTrace;
      Error.stackTraceLimit = 1 + skip + length;
      Error.prepareStackTrace = function(err, stack) {
        stackTrace = stack;
      };
      new Error().stack;
      Error.stackTraceLimit = stackTraceLimit;
      Error.prepareStackTrace = prepareStackTrace;
      if (!stackTrace) return {
        internal: false,
        trace: ""
      };
      const shortStackTrace = stackTrace.slice(1 + skip, 1 + skip + length);
      return {
        internal: /[\\/]@babel[\\/]/.test(shortStackTrace[1].getFileName()),
        trace: shortStackTrace.map((frame) => `    at ${frame}`).join("\n")
      };
    }
  }
});

// ../node_modules/@babel/types/lib/validators/generated/index.js
var require_generated = __commonJS({
  "../node_modules/@babel/types/lib/validators/generated/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.isAccessor = isAccessor;
    exports.isAnyTypeAnnotation = isAnyTypeAnnotation;
    exports.isArgumentPlaceholder = isArgumentPlaceholder;
    exports.isArrayExpression = isArrayExpression;
    exports.isArrayPattern = isArrayPattern;
    exports.isArrayTypeAnnotation = isArrayTypeAnnotation;
    exports.isArrowFunctionExpression = isArrowFunctionExpression;
    exports.isAssignmentExpression = isAssignmentExpression;
    exports.isAssignmentPattern = isAssignmentPattern;
    exports.isAwaitExpression = isAwaitExpression;
    exports.isBigIntLiteral = isBigIntLiteral;
    exports.isBinary = isBinary;
    exports.isBinaryExpression = isBinaryExpression;
    exports.isBindExpression = isBindExpression;
    exports.isBlock = isBlock;
    exports.isBlockParent = isBlockParent;
    exports.isBlockStatement = isBlockStatement;
    exports.isBooleanLiteral = isBooleanLiteral;
    exports.isBooleanLiteralTypeAnnotation = isBooleanLiteralTypeAnnotation;
    exports.isBooleanTypeAnnotation = isBooleanTypeAnnotation;
    exports.isBreakStatement = isBreakStatement;
    exports.isCallExpression = isCallExpression;
    exports.isCatchClause = isCatchClause;
    exports.isClass = isClass;
    exports.isClassAccessorProperty = isClassAccessorProperty;
    exports.isClassBody = isClassBody;
    exports.isClassDeclaration = isClassDeclaration;
    exports.isClassExpression = isClassExpression;
    exports.isClassImplements = isClassImplements;
    exports.isClassMethod = isClassMethod;
    exports.isClassPrivateMethod = isClassPrivateMethod;
    exports.isClassPrivateProperty = isClassPrivateProperty;
    exports.isClassProperty = isClassProperty;
    exports.isCompletionStatement = isCompletionStatement;
    exports.isConditional = isConditional;
    exports.isConditionalExpression = isConditionalExpression;
    exports.isContinueStatement = isContinueStatement;
    exports.isDebuggerStatement = isDebuggerStatement;
    exports.isDecimalLiteral = isDecimalLiteral;
    exports.isDeclaration = isDeclaration;
    exports.isDeclareClass = isDeclareClass;
    exports.isDeclareExportAllDeclaration = isDeclareExportAllDeclaration;
    exports.isDeclareExportDeclaration = isDeclareExportDeclaration;
    exports.isDeclareFunction = isDeclareFunction;
    exports.isDeclareInterface = isDeclareInterface;
    exports.isDeclareModule = isDeclareModule;
    exports.isDeclareModuleExports = isDeclareModuleExports;
    exports.isDeclareOpaqueType = isDeclareOpaqueType;
    exports.isDeclareTypeAlias = isDeclareTypeAlias;
    exports.isDeclareVariable = isDeclareVariable;
    exports.isDeclaredPredicate = isDeclaredPredicate;
    exports.isDecorator = isDecorator;
    exports.isDirective = isDirective;
    exports.isDirectiveLiteral = isDirectiveLiteral;
    exports.isDoExpression = isDoExpression;
    exports.isDoWhileStatement = isDoWhileStatement;
    exports.isEmptyStatement = isEmptyStatement;
    exports.isEmptyTypeAnnotation = isEmptyTypeAnnotation;
    exports.isEnumBody = isEnumBody;
    exports.isEnumBooleanBody = isEnumBooleanBody;
    exports.isEnumBooleanMember = isEnumBooleanMember;
    exports.isEnumDeclaration = isEnumDeclaration;
    exports.isEnumDefaultedMember = isEnumDefaultedMember;
    exports.isEnumMember = isEnumMember;
    exports.isEnumNumberBody = isEnumNumberBody;
    exports.isEnumNumberMember = isEnumNumberMember;
    exports.isEnumStringBody = isEnumStringBody;
    exports.isEnumStringMember = isEnumStringMember;
    exports.isEnumSymbolBody = isEnumSymbolBody;
    exports.isExistsTypeAnnotation = isExistsTypeAnnotation;
    exports.isExportAllDeclaration = isExportAllDeclaration;
    exports.isExportDeclaration = isExportDeclaration;
    exports.isExportDefaultDeclaration = isExportDefaultDeclaration;
    exports.isExportDefaultSpecifier = isExportDefaultSpecifier;
    exports.isExportNamedDeclaration = isExportNamedDeclaration;
    exports.isExportNamespaceSpecifier = isExportNamespaceSpecifier;
    exports.isExportSpecifier = isExportSpecifier;
    exports.isExpression = isExpression;
    exports.isExpressionStatement = isExpressionStatement;
    exports.isExpressionWrapper = isExpressionWrapper;
    exports.isFile = isFile;
    exports.isFlow = isFlow;
    exports.isFlowBaseAnnotation = isFlowBaseAnnotation;
    exports.isFlowDeclaration = isFlowDeclaration;
    exports.isFlowPredicate = isFlowPredicate;
    exports.isFlowType = isFlowType;
    exports.isFor = isFor;
    exports.isForInStatement = isForInStatement;
    exports.isForOfStatement = isForOfStatement;
    exports.isForStatement = isForStatement;
    exports.isForXStatement = isForXStatement;
    exports.isFunction = isFunction;
    exports.isFunctionDeclaration = isFunctionDeclaration;
    exports.isFunctionExpression = isFunctionExpression;
    exports.isFunctionParameter = isFunctionParameter;
    exports.isFunctionParent = isFunctionParent;
    exports.isFunctionTypeAnnotation = isFunctionTypeAnnotation;
    exports.isFunctionTypeParam = isFunctionTypeParam;
    exports.isGenericTypeAnnotation = isGenericTypeAnnotation;
    exports.isIdentifier = isIdentifier;
    exports.isIfStatement = isIfStatement;
    exports.isImmutable = isImmutable;
    exports.isImport = isImport;
    exports.isImportAttribute = isImportAttribute;
    exports.isImportDeclaration = isImportDeclaration;
    exports.isImportDefaultSpecifier = isImportDefaultSpecifier;
    exports.isImportExpression = isImportExpression;
    exports.isImportNamespaceSpecifier = isImportNamespaceSpecifier;
    exports.isImportOrExportDeclaration = isImportOrExportDeclaration;
    exports.isImportSpecifier = isImportSpecifier;
    exports.isIndexedAccessType = isIndexedAccessType;
    exports.isInferredPredicate = isInferredPredicate;
    exports.isInterfaceDeclaration = isInterfaceDeclaration;
    exports.isInterfaceExtends = isInterfaceExtends;
    exports.isInterfaceTypeAnnotation = isInterfaceTypeAnnotation;
    exports.isInterpreterDirective = isInterpreterDirective;
    exports.isIntersectionTypeAnnotation = isIntersectionTypeAnnotation;
    exports.isJSX = isJSX;
    exports.isJSXAttribute = isJSXAttribute;
    exports.isJSXClosingElement = isJSXClosingElement;
    exports.isJSXClosingFragment = isJSXClosingFragment;
    exports.isJSXElement = isJSXElement;
    exports.isJSXEmptyExpression = isJSXEmptyExpression;
    exports.isJSXExpressionContainer = isJSXExpressionContainer;
    exports.isJSXFragment = isJSXFragment;
    exports.isJSXIdentifier = isJSXIdentifier;
    exports.isJSXMemberExpression = isJSXMemberExpression;
    exports.isJSXNamespacedName = isJSXNamespacedName;
    exports.isJSXOpeningElement = isJSXOpeningElement;
    exports.isJSXOpeningFragment = isJSXOpeningFragment;
    exports.isJSXSpreadAttribute = isJSXSpreadAttribute;
    exports.isJSXSpreadChild = isJSXSpreadChild;
    exports.isJSXText = isJSXText;
    exports.isLVal = isLVal;
    exports.isLabeledStatement = isLabeledStatement;
    exports.isLiteral = isLiteral;
    exports.isLogicalExpression = isLogicalExpression;
    exports.isLoop = isLoop;
    exports.isMemberExpression = isMemberExpression;
    exports.isMetaProperty = isMetaProperty;
    exports.isMethod = isMethod;
    exports.isMiscellaneous = isMiscellaneous;
    exports.isMixedTypeAnnotation = isMixedTypeAnnotation;
    exports.isModuleDeclaration = isModuleDeclaration;
    exports.isModuleExpression = isModuleExpression;
    exports.isModuleSpecifier = isModuleSpecifier;
    exports.isNewExpression = isNewExpression;
    exports.isNoop = isNoop;
    exports.isNullLiteral = isNullLiteral;
    exports.isNullLiteralTypeAnnotation = isNullLiteralTypeAnnotation;
    exports.isNullableTypeAnnotation = isNullableTypeAnnotation;
    exports.isNumberLiteral = isNumberLiteral;
    exports.isNumberLiteralTypeAnnotation = isNumberLiteralTypeAnnotation;
    exports.isNumberTypeAnnotation = isNumberTypeAnnotation;
    exports.isNumericLiteral = isNumericLiteral;
    exports.isObjectExpression = isObjectExpression;
    exports.isObjectMember = isObjectMember;
    exports.isObjectMethod = isObjectMethod;
    exports.isObjectPattern = isObjectPattern;
    exports.isObjectProperty = isObjectProperty;
    exports.isObjectTypeAnnotation = isObjectTypeAnnotation;
    exports.isObjectTypeCallProperty = isObjectTypeCallProperty;
    exports.isObjectTypeIndexer = isObjectTypeIndexer;
    exports.isObjectTypeInternalSlot = isObjectTypeInternalSlot;
    exports.isObjectTypeProperty = isObjectTypeProperty;
    exports.isObjectTypeSpreadProperty = isObjectTypeSpreadProperty;
    exports.isOpaqueType = isOpaqueType;
    exports.isOptionalCallExpression = isOptionalCallExpression;
    exports.isOptionalIndexedAccessType = isOptionalIndexedAccessType;
    exports.isOptionalMemberExpression = isOptionalMemberExpression;
    exports.isParenthesizedExpression = isParenthesizedExpression;
    exports.isPattern = isPattern;
    exports.isPatternLike = isPatternLike;
    exports.isPipelineBareFunction = isPipelineBareFunction;
    exports.isPipelinePrimaryTopicReference = isPipelinePrimaryTopicReference;
    exports.isPipelineTopicExpression = isPipelineTopicExpression;
    exports.isPlaceholder = isPlaceholder;
    exports.isPrivate = isPrivate;
    exports.isPrivateName = isPrivateName;
    exports.isProgram = isProgram;
    exports.isProperty = isProperty;
    exports.isPureish = isPureish;
    exports.isQualifiedTypeIdentifier = isQualifiedTypeIdentifier;
    exports.isRecordExpression = isRecordExpression;
    exports.isRegExpLiteral = isRegExpLiteral;
    exports.isRegexLiteral = isRegexLiteral;
    exports.isRestElement = isRestElement;
    exports.isRestProperty = isRestProperty;
    exports.isReturnStatement = isReturnStatement;
    exports.isScopable = isScopable;
    exports.isSequenceExpression = isSequenceExpression;
    exports.isSpreadElement = isSpreadElement;
    exports.isSpreadProperty = isSpreadProperty;
    exports.isStandardized = isStandardized;
    exports.isStatement = isStatement;
    exports.isStaticBlock = isStaticBlock;
    exports.isStringLiteral = isStringLiteral;
    exports.isStringLiteralTypeAnnotation = isStringLiteralTypeAnnotation;
    exports.isStringTypeAnnotation = isStringTypeAnnotation;
    exports.isSuper = isSuper;
    exports.isSwitchCase = isSwitchCase;
    exports.isSwitchStatement = isSwitchStatement;
    exports.isSymbolTypeAnnotation = isSymbolTypeAnnotation;
    exports.isTSAnyKeyword = isTSAnyKeyword;
    exports.isTSArrayType = isTSArrayType;
    exports.isTSAsExpression = isTSAsExpression;
    exports.isTSBaseType = isTSBaseType;
    exports.isTSBigIntKeyword = isTSBigIntKeyword;
    exports.isTSBooleanKeyword = isTSBooleanKeyword;
    exports.isTSCallSignatureDeclaration = isTSCallSignatureDeclaration;
    exports.isTSConditionalType = isTSConditionalType;
    exports.isTSConstructSignatureDeclaration = isTSConstructSignatureDeclaration;
    exports.isTSConstructorType = isTSConstructorType;
    exports.isTSDeclareFunction = isTSDeclareFunction;
    exports.isTSDeclareMethod = isTSDeclareMethod;
    exports.isTSEntityName = isTSEntityName;
    exports.isTSEnumBody = isTSEnumBody;
    exports.isTSEnumDeclaration = isTSEnumDeclaration;
    exports.isTSEnumMember = isTSEnumMember;
    exports.isTSExportAssignment = isTSExportAssignment;
    exports.isTSExpressionWithTypeArguments = isTSExpressionWithTypeArguments;
    exports.isTSExternalModuleReference = isTSExternalModuleReference;
    exports.isTSFunctionType = isTSFunctionType;
    exports.isTSImportEqualsDeclaration = isTSImportEqualsDeclaration;
    exports.isTSImportType = isTSImportType;
    exports.isTSIndexSignature = isTSIndexSignature;
    exports.isTSIndexedAccessType = isTSIndexedAccessType;
    exports.isTSInferType = isTSInferType;
    exports.isTSInstantiationExpression = isTSInstantiationExpression;
    exports.isTSInterfaceBody = isTSInterfaceBody;
    exports.isTSInterfaceDeclaration = isTSInterfaceDeclaration;
    exports.isTSIntersectionType = isTSIntersectionType;
    exports.isTSIntrinsicKeyword = isTSIntrinsicKeyword;
    exports.isTSLiteralType = isTSLiteralType;
    exports.isTSMappedType = isTSMappedType;
    exports.isTSMethodSignature = isTSMethodSignature;
    exports.isTSModuleBlock = isTSModuleBlock;
    exports.isTSModuleDeclaration = isTSModuleDeclaration;
    exports.isTSNamedTupleMember = isTSNamedTupleMember;
    exports.isTSNamespaceExportDeclaration = isTSNamespaceExportDeclaration;
    exports.isTSNeverKeyword = isTSNeverKeyword;
    exports.isTSNonNullExpression = isTSNonNullExpression;
    exports.isTSNullKeyword = isTSNullKeyword;
    exports.isTSNumberKeyword = isTSNumberKeyword;
    exports.isTSObjectKeyword = isTSObjectKeyword;
    exports.isTSOptionalType = isTSOptionalType;
    exports.isTSParameterProperty = isTSParameterProperty;
    exports.isTSParenthesizedType = isTSParenthesizedType;
    exports.isTSPropertySignature = isTSPropertySignature;
    exports.isTSQualifiedName = isTSQualifiedName;
    exports.isTSRestType = isTSRestType;
    exports.isTSSatisfiesExpression = isTSSatisfiesExpression;
    exports.isTSStringKeyword = isTSStringKeyword;
    exports.isTSSymbolKeyword = isTSSymbolKeyword;
    exports.isTSTemplateLiteralType = isTSTemplateLiteralType;
    exports.isTSThisType = isTSThisType;
    exports.isTSTupleType = isTSTupleType;
    exports.isTSType = isTSType;
    exports.isTSTypeAliasDeclaration = isTSTypeAliasDeclaration;
    exports.isTSTypeAnnotation = isTSTypeAnnotation;
    exports.isTSTypeAssertion = isTSTypeAssertion;
    exports.isTSTypeElement = isTSTypeElement;
    exports.isTSTypeLiteral = isTSTypeLiteral;
    exports.isTSTypeOperator = isTSTypeOperator;
    exports.isTSTypeParameter = isTSTypeParameter;
    exports.isTSTypeParameterDeclaration = isTSTypeParameterDeclaration;
    exports.isTSTypeParameterInstantiation = isTSTypeParameterInstantiation;
    exports.isTSTypePredicate = isTSTypePredicate;
    exports.isTSTypeQuery = isTSTypeQuery;
    exports.isTSTypeReference = isTSTypeReference;
    exports.isTSUndefinedKeyword = isTSUndefinedKeyword;
    exports.isTSUnionType = isTSUnionType;
    exports.isTSUnknownKeyword = isTSUnknownKeyword;
    exports.isTSVoidKeyword = isTSVoidKeyword;
    exports.isTaggedTemplateExpression = isTaggedTemplateExpression;
    exports.isTemplateElement = isTemplateElement;
    exports.isTemplateLiteral = isTemplateLiteral;
    exports.isTerminatorless = isTerminatorless;
    exports.isThisExpression = isThisExpression;
    exports.isThisTypeAnnotation = isThisTypeAnnotation;
    exports.isThrowStatement = isThrowStatement;
    exports.isTopicReference = isTopicReference;
    exports.isTryStatement = isTryStatement;
    exports.isTupleExpression = isTupleExpression;
    exports.isTupleTypeAnnotation = isTupleTypeAnnotation;
    exports.isTypeAlias = isTypeAlias;
    exports.isTypeAnnotation = isTypeAnnotation;
    exports.isTypeCastExpression = isTypeCastExpression;
    exports.isTypeParameter = isTypeParameter;
    exports.isTypeParameterDeclaration = isTypeParameterDeclaration;
    exports.isTypeParameterInstantiation = isTypeParameterInstantiation;
    exports.isTypeScript = isTypeScript;
    exports.isTypeofTypeAnnotation = isTypeofTypeAnnotation;
    exports.isUnaryExpression = isUnaryExpression;
    exports.isUnaryLike = isUnaryLike;
    exports.isUnionTypeAnnotation = isUnionTypeAnnotation;
    exports.isUpdateExpression = isUpdateExpression;
    exports.isUserWhitespacable = isUserWhitespacable;
    exports.isV8IntrinsicIdentifier = isV8IntrinsicIdentifier;
    exports.isVariableDeclaration = isVariableDeclaration;
    exports.isVariableDeclarator = isVariableDeclarator;
    exports.isVariance = isVariance;
    exports.isVoidPattern = isVoidPattern;
    exports.isVoidTypeAnnotation = isVoidTypeAnnotation;
    exports.isWhile = isWhile;
    exports.isWhileStatement = isWhileStatement;
    exports.isWithStatement = isWithStatement;
    exports.isYieldExpression = isYieldExpression;
    var _shallowEqual = require_shallowEqual();
    var _deprecationWarning = require_deprecationWarning();
    function isArrayExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "ArrayExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isAssignmentExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "AssignmentExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isBinaryExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "BinaryExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isInterpreterDirective(node, opts) {
      if (!node) return false;
      if (node.type !== "InterpreterDirective") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDirective(node, opts) {
      if (!node) return false;
      if (node.type !== "Directive") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDirectiveLiteral(node, opts) {
      if (!node) return false;
      if (node.type !== "DirectiveLiteral") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isBlockStatement(node, opts) {
      if (!node) return false;
      if (node.type !== "BlockStatement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isBreakStatement(node, opts) {
      if (!node) return false;
      if (node.type !== "BreakStatement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isCallExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "CallExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isCatchClause(node, opts) {
      if (!node) return false;
      if (node.type !== "CatchClause") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isConditionalExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "ConditionalExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isContinueStatement(node, opts) {
      if (!node) return false;
      if (node.type !== "ContinueStatement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDebuggerStatement(node, opts) {
      if (!node) return false;
      if (node.type !== "DebuggerStatement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDoWhileStatement(node, opts) {
      if (!node) return false;
      if (node.type !== "DoWhileStatement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isEmptyStatement(node, opts) {
      if (!node) return false;
      if (node.type !== "EmptyStatement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isExpressionStatement(node, opts) {
      if (!node) return false;
      if (node.type !== "ExpressionStatement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isFile(node, opts) {
      if (!node) return false;
      if (node.type !== "File") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isForInStatement(node, opts) {
      if (!node) return false;
      if (node.type !== "ForInStatement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isForStatement(node, opts) {
      if (!node) return false;
      if (node.type !== "ForStatement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isFunctionDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "FunctionDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isFunctionExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "FunctionExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isIdentifier(node, opts) {
      if (!node) return false;
      if (node.type !== "Identifier") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isIfStatement(node, opts) {
      if (!node) return false;
      if (node.type !== "IfStatement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isLabeledStatement(node, opts) {
      if (!node) return false;
      if (node.type !== "LabeledStatement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isStringLiteral(node, opts) {
      if (!node) return false;
      if (node.type !== "StringLiteral") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isNumericLiteral(node, opts) {
      if (!node) return false;
      if (node.type !== "NumericLiteral") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isNullLiteral(node, opts) {
      if (!node) return false;
      if (node.type !== "NullLiteral") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isBooleanLiteral(node, opts) {
      if (!node) return false;
      if (node.type !== "BooleanLiteral") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isRegExpLiteral(node, opts) {
      if (!node) return false;
      if (node.type !== "RegExpLiteral") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isLogicalExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "LogicalExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isMemberExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "MemberExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isNewExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "NewExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isProgram(node, opts) {
      if (!node) return false;
      if (node.type !== "Program") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isObjectExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "ObjectExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isObjectMethod(node, opts) {
      if (!node) return false;
      if (node.type !== "ObjectMethod") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isObjectProperty(node, opts) {
      if (!node) return false;
      if (node.type !== "ObjectProperty") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isRestElement(node, opts) {
      if (!node) return false;
      if (node.type !== "RestElement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isReturnStatement(node, opts) {
      if (!node) return false;
      if (node.type !== "ReturnStatement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isSequenceExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "SequenceExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isParenthesizedExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "ParenthesizedExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isSwitchCase(node, opts) {
      if (!node) return false;
      if (node.type !== "SwitchCase") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isSwitchStatement(node, opts) {
      if (!node) return false;
      if (node.type !== "SwitchStatement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isThisExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "ThisExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isThrowStatement(node, opts) {
      if (!node) return false;
      if (node.type !== "ThrowStatement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTryStatement(node, opts) {
      if (!node) return false;
      if (node.type !== "TryStatement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isUnaryExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "UnaryExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isUpdateExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "UpdateExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isVariableDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "VariableDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isVariableDeclarator(node, opts) {
      if (!node) return false;
      if (node.type !== "VariableDeclarator") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isWhileStatement(node, opts) {
      if (!node) return false;
      if (node.type !== "WhileStatement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isWithStatement(node, opts) {
      if (!node) return false;
      if (node.type !== "WithStatement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isAssignmentPattern(node, opts) {
      if (!node) return false;
      if (node.type !== "AssignmentPattern") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isArrayPattern(node, opts) {
      if (!node) return false;
      if (node.type !== "ArrayPattern") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isArrowFunctionExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "ArrowFunctionExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isClassBody(node, opts) {
      if (!node) return false;
      if (node.type !== "ClassBody") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isClassExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "ClassExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isClassDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "ClassDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isExportAllDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "ExportAllDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isExportDefaultDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "ExportDefaultDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isExportNamedDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "ExportNamedDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isExportSpecifier(node, opts) {
      if (!node) return false;
      if (node.type !== "ExportSpecifier") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isForOfStatement(node, opts) {
      if (!node) return false;
      if (node.type !== "ForOfStatement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isImportDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "ImportDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isImportDefaultSpecifier(node, opts) {
      if (!node) return false;
      if (node.type !== "ImportDefaultSpecifier") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isImportNamespaceSpecifier(node, opts) {
      if (!node) return false;
      if (node.type !== "ImportNamespaceSpecifier") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isImportSpecifier(node, opts) {
      if (!node) return false;
      if (node.type !== "ImportSpecifier") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isImportExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "ImportExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isMetaProperty(node, opts) {
      if (!node) return false;
      if (node.type !== "MetaProperty") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isClassMethod(node, opts) {
      if (!node) return false;
      if (node.type !== "ClassMethod") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isObjectPattern(node, opts) {
      if (!node) return false;
      if (node.type !== "ObjectPattern") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isSpreadElement(node, opts) {
      if (!node) return false;
      if (node.type !== "SpreadElement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isSuper(node, opts) {
      if (!node) return false;
      if (node.type !== "Super") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTaggedTemplateExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "TaggedTemplateExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTemplateElement(node, opts) {
      if (!node) return false;
      if (node.type !== "TemplateElement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTemplateLiteral(node, opts) {
      if (!node) return false;
      if (node.type !== "TemplateLiteral") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isYieldExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "YieldExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isAwaitExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "AwaitExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isImport(node, opts) {
      if (!node) return false;
      if (node.type !== "Import") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isBigIntLiteral(node, opts) {
      if (!node) return false;
      if (node.type !== "BigIntLiteral") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isExportNamespaceSpecifier(node, opts) {
      if (!node) return false;
      if (node.type !== "ExportNamespaceSpecifier") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isOptionalMemberExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "OptionalMemberExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isOptionalCallExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "OptionalCallExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isClassProperty(node, opts) {
      if (!node) return false;
      if (node.type !== "ClassProperty") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isClassAccessorProperty(node, opts) {
      if (!node) return false;
      if (node.type !== "ClassAccessorProperty") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isClassPrivateProperty(node, opts) {
      if (!node) return false;
      if (node.type !== "ClassPrivateProperty") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isClassPrivateMethod(node, opts) {
      if (!node) return false;
      if (node.type !== "ClassPrivateMethod") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isPrivateName(node, opts) {
      if (!node) return false;
      if (node.type !== "PrivateName") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isStaticBlock(node, opts) {
      if (!node) return false;
      if (node.type !== "StaticBlock") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isImportAttribute(node, opts) {
      if (!node) return false;
      if (node.type !== "ImportAttribute") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isAnyTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "AnyTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isArrayTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "ArrayTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isBooleanTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "BooleanTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isBooleanLiteralTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "BooleanLiteralTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isNullLiteralTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "NullLiteralTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isClassImplements(node, opts) {
      if (!node) return false;
      if (node.type !== "ClassImplements") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDeclareClass(node, opts) {
      if (!node) return false;
      if (node.type !== "DeclareClass") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDeclareFunction(node, opts) {
      if (!node) return false;
      if (node.type !== "DeclareFunction") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDeclareInterface(node, opts) {
      if (!node) return false;
      if (node.type !== "DeclareInterface") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDeclareModule(node, opts) {
      if (!node) return false;
      if (node.type !== "DeclareModule") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDeclareModuleExports(node, opts) {
      if (!node) return false;
      if (node.type !== "DeclareModuleExports") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDeclareTypeAlias(node, opts) {
      if (!node) return false;
      if (node.type !== "DeclareTypeAlias") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDeclareOpaqueType(node, opts) {
      if (!node) return false;
      if (node.type !== "DeclareOpaqueType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDeclareVariable(node, opts) {
      if (!node) return false;
      if (node.type !== "DeclareVariable") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDeclareExportDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "DeclareExportDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDeclareExportAllDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "DeclareExportAllDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDeclaredPredicate(node, opts) {
      if (!node) return false;
      if (node.type !== "DeclaredPredicate") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isExistsTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "ExistsTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isFunctionTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "FunctionTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isFunctionTypeParam(node, opts) {
      if (!node) return false;
      if (node.type !== "FunctionTypeParam") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isGenericTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "GenericTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isInferredPredicate(node, opts) {
      if (!node) return false;
      if (node.type !== "InferredPredicate") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isInterfaceExtends(node, opts) {
      if (!node) return false;
      if (node.type !== "InterfaceExtends") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isInterfaceDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "InterfaceDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isInterfaceTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "InterfaceTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isIntersectionTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "IntersectionTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isMixedTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "MixedTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isEmptyTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "EmptyTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isNullableTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "NullableTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isNumberLiteralTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "NumberLiteralTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isNumberTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "NumberTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isObjectTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "ObjectTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isObjectTypeInternalSlot(node, opts) {
      if (!node) return false;
      if (node.type !== "ObjectTypeInternalSlot") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isObjectTypeCallProperty(node, opts) {
      if (!node) return false;
      if (node.type !== "ObjectTypeCallProperty") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isObjectTypeIndexer(node, opts) {
      if (!node) return false;
      if (node.type !== "ObjectTypeIndexer") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isObjectTypeProperty(node, opts) {
      if (!node) return false;
      if (node.type !== "ObjectTypeProperty") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isObjectTypeSpreadProperty(node, opts) {
      if (!node) return false;
      if (node.type !== "ObjectTypeSpreadProperty") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isOpaqueType(node, opts) {
      if (!node) return false;
      if (node.type !== "OpaqueType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isQualifiedTypeIdentifier(node, opts) {
      if (!node) return false;
      if (node.type !== "QualifiedTypeIdentifier") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isStringLiteralTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "StringLiteralTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isStringTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "StringTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isSymbolTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "SymbolTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isThisTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "ThisTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTupleTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "TupleTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTypeofTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "TypeofTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTypeAlias(node, opts) {
      if (!node) return false;
      if (node.type !== "TypeAlias") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "TypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTypeCastExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "TypeCastExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTypeParameter(node, opts) {
      if (!node) return false;
      if (node.type !== "TypeParameter") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTypeParameterDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "TypeParameterDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTypeParameterInstantiation(node, opts) {
      if (!node) return false;
      if (node.type !== "TypeParameterInstantiation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isUnionTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "UnionTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isVariance(node, opts) {
      if (!node) return false;
      if (node.type !== "Variance") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isVoidTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "VoidTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isEnumDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "EnumDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isEnumBooleanBody(node, opts) {
      if (!node) return false;
      if (node.type !== "EnumBooleanBody") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isEnumNumberBody(node, opts) {
      if (!node) return false;
      if (node.type !== "EnumNumberBody") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isEnumStringBody(node, opts) {
      if (!node) return false;
      if (node.type !== "EnumStringBody") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isEnumSymbolBody(node, opts) {
      if (!node) return false;
      if (node.type !== "EnumSymbolBody") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isEnumBooleanMember(node, opts) {
      if (!node) return false;
      if (node.type !== "EnumBooleanMember") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isEnumNumberMember(node, opts) {
      if (!node) return false;
      if (node.type !== "EnumNumberMember") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isEnumStringMember(node, opts) {
      if (!node) return false;
      if (node.type !== "EnumStringMember") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isEnumDefaultedMember(node, opts) {
      if (!node) return false;
      if (node.type !== "EnumDefaultedMember") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isIndexedAccessType(node, opts) {
      if (!node) return false;
      if (node.type !== "IndexedAccessType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isOptionalIndexedAccessType(node, opts) {
      if (!node) return false;
      if (node.type !== "OptionalIndexedAccessType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isJSXAttribute(node, opts) {
      if (!node) return false;
      if (node.type !== "JSXAttribute") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isJSXClosingElement(node, opts) {
      if (!node) return false;
      if (node.type !== "JSXClosingElement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isJSXElement(node, opts) {
      if (!node) return false;
      if (node.type !== "JSXElement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isJSXEmptyExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "JSXEmptyExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isJSXExpressionContainer(node, opts) {
      if (!node) return false;
      if (node.type !== "JSXExpressionContainer") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isJSXSpreadChild(node, opts) {
      if (!node) return false;
      if (node.type !== "JSXSpreadChild") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isJSXIdentifier(node, opts) {
      if (!node) return false;
      if (node.type !== "JSXIdentifier") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isJSXMemberExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "JSXMemberExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isJSXNamespacedName(node, opts) {
      if (!node) return false;
      if (node.type !== "JSXNamespacedName") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isJSXOpeningElement(node, opts) {
      if (!node) return false;
      if (node.type !== "JSXOpeningElement") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isJSXSpreadAttribute(node, opts) {
      if (!node) return false;
      if (node.type !== "JSXSpreadAttribute") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isJSXText(node, opts) {
      if (!node) return false;
      if (node.type !== "JSXText") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isJSXFragment(node, opts) {
      if (!node) return false;
      if (node.type !== "JSXFragment") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isJSXOpeningFragment(node, opts) {
      if (!node) return false;
      if (node.type !== "JSXOpeningFragment") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isJSXClosingFragment(node, opts) {
      if (!node) return false;
      if (node.type !== "JSXClosingFragment") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isNoop(node, opts) {
      if (!node) return false;
      if (node.type !== "Noop") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isPlaceholder(node, opts) {
      if (!node) return false;
      if (node.type !== "Placeholder") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isV8IntrinsicIdentifier(node, opts) {
      if (!node) return false;
      if (node.type !== "V8IntrinsicIdentifier") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isArgumentPlaceholder(node, opts) {
      if (!node) return false;
      if (node.type !== "ArgumentPlaceholder") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isBindExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "BindExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDecorator(node, opts) {
      if (!node) return false;
      if (node.type !== "Decorator") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDoExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "DoExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isExportDefaultSpecifier(node, opts) {
      if (!node) return false;
      if (node.type !== "ExportDefaultSpecifier") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isRecordExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "RecordExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTupleExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "TupleExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDecimalLiteral(node, opts) {
      if (!node) return false;
      if (node.type !== "DecimalLiteral") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isModuleExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "ModuleExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTopicReference(node, opts) {
      if (!node) return false;
      if (node.type !== "TopicReference") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isPipelineTopicExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "PipelineTopicExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isPipelineBareFunction(node, opts) {
      if (!node) return false;
      if (node.type !== "PipelineBareFunction") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isPipelinePrimaryTopicReference(node, opts) {
      if (!node) return false;
      if (node.type !== "PipelinePrimaryTopicReference") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isVoidPattern(node, opts) {
      if (!node) return false;
      if (node.type !== "VoidPattern") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSParameterProperty(node, opts) {
      if (!node) return false;
      if (node.type !== "TSParameterProperty") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSDeclareFunction(node, opts) {
      if (!node) return false;
      if (node.type !== "TSDeclareFunction") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSDeclareMethod(node, opts) {
      if (!node) return false;
      if (node.type !== "TSDeclareMethod") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSQualifiedName(node, opts) {
      if (!node) return false;
      if (node.type !== "TSQualifiedName") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSCallSignatureDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "TSCallSignatureDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSConstructSignatureDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "TSConstructSignatureDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSPropertySignature(node, opts) {
      if (!node) return false;
      if (node.type !== "TSPropertySignature") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSMethodSignature(node, opts) {
      if (!node) return false;
      if (node.type !== "TSMethodSignature") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSIndexSignature(node, opts) {
      if (!node) return false;
      if (node.type !== "TSIndexSignature") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSAnyKeyword(node, opts) {
      if (!node) return false;
      if (node.type !== "TSAnyKeyword") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSBooleanKeyword(node, opts) {
      if (!node) return false;
      if (node.type !== "TSBooleanKeyword") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSBigIntKeyword(node, opts) {
      if (!node) return false;
      if (node.type !== "TSBigIntKeyword") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSIntrinsicKeyword(node, opts) {
      if (!node) return false;
      if (node.type !== "TSIntrinsicKeyword") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSNeverKeyword(node, opts) {
      if (!node) return false;
      if (node.type !== "TSNeverKeyword") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSNullKeyword(node, opts) {
      if (!node) return false;
      if (node.type !== "TSNullKeyword") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSNumberKeyword(node, opts) {
      if (!node) return false;
      if (node.type !== "TSNumberKeyword") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSObjectKeyword(node, opts) {
      if (!node) return false;
      if (node.type !== "TSObjectKeyword") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSStringKeyword(node, opts) {
      if (!node) return false;
      if (node.type !== "TSStringKeyword") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSSymbolKeyword(node, opts) {
      if (!node) return false;
      if (node.type !== "TSSymbolKeyword") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSUndefinedKeyword(node, opts) {
      if (!node) return false;
      if (node.type !== "TSUndefinedKeyword") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSUnknownKeyword(node, opts) {
      if (!node) return false;
      if (node.type !== "TSUnknownKeyword") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSVoidKeyword(node, opts) {
      if (!node) return false;
      if (node.type !== "TSVoidKeyword") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSThisType(node, opts) {
      if (!node) return false;
      if (node.type !== "TSThisType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSFunctionType(node, opts) {
      if (!node) return false;
      if (node.type !== "TSFunctionType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSConstructorType(node, opts) {
      if (!node) return false;
      if (node.type !== "TSConstructorType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSTypeReference(node, opts) {
      if (!node) return false;
      if (node.type !== "TSTypeReference") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSTypePredicate(node, opts) {
      if (!node) return false;
      if (node.type !== "TSTypePredicate") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSTypeQuery(node, opts) {
      if (!node) return false;
      if (node.type !== "TSTypeQuery") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSTypeLiteral(node, opts) {
      if (!node) return false;
      if (node.type !== "TSTypeLiteral") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSArrayType(node, opts) {
      if (!node) return false;
      if (node.type !== "TSArrayType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSTupleType(node, opts) {
      if (!node) return false;
      if (node.type !== "TSTupleType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSOptionalType(node, opts) {
      if (!node) return false;
      if (node.type !== "TSOptionalType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSRestType(node, opts) {
      if (!node) return false;
      if (node.type !== "TSRestType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSNamedTupleMember(node, opts) {
      if (!node) return false;
      if (node.type !== "TSNamedTupleMember") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSUnionType(node, opts) {
      if (!node) return false;
      if (node.type !== "TSUnionType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSIntersectionType(node, opts) {
      if (!node) return false;
      if (node.type !== "TSIntersectionType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSConditionalType(node, opts) {
      if (!node) return false;
      if (node.type !== "TSConditionalType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSInferType(node, opts) {
      if (!node) return false;
      if (node.type !== "TSInferType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSParenthesizedType(node, opts) {
      if (!node) return false;
      if (node.type !== "TSParenthesizedType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSTypeOperator(node, opts) {
      if (!node) return false;
      if (node.type !== "TSTypeOperator") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSIndexedAccessType(node, opts) {
      if (!node) return false;
      if (node.type !== "TSIndexedAccessType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSMappedType(node, opts) {
      if (!node) return false;
      if (node.type !== "TSMappedType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSTemplateLiteralType(node, opts) {
      if (!node) return false;
      if (node.type !== "TSTemplateLiteralType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSLiteralType(node, opts) {
      if (!node) return false;
      if (node.type !== "TSLiteralType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSExpressionWithTypeArguments(node, opts) {
      if (!node) return false;
      if (node.type !== "TSExpressionWithTypeArguments") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSInterfaceDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "TSInterfaceDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSInterfaceBody(node, opts) {
      if (!node) return false;
      if (node.type !== "TSInterfaceBody") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSTypeAliasDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "TSTypeAliasDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSInstantiationExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "TSInstantiationExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSAsExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "TSAsExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSSatisfiesExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "TSSatisfiesExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSTypeAssertion(node, opts) {
      if (!node) return false;
      if (node.type !== "TSTypeAssertion") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSEnumBody(node, opts) {
      if (!node) return false;
      if (node.type !== "TSEnumBody") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSEnumDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "TSEnumDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSEnumMember(node, opts) {
      if (!node) return false;
      if (node.type !== "TSEnumMember") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSModuleDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "TSModuleDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSModuleBlock(node, opts) {
      if (!node) return false;
      if (node.type !== "TSModuleBlock") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSImportType(node, opts) {
      if (!node) return false;
      if (node.type !== "TSImportType") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSImportEqualsDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "TSImportEqualsDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSExternalModuleReference(node, opts) {
      if (!node) return false;
      if (node.type !== "TSExternalModuleReference") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSNonNullExpression(node, opts) {
      if (!node) return false;
      if (node.type !== "TSNonNullExpression") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSExportAssignment(node, opts) {
      if (!node) return false;
      if (node.type !== "TSExportAssignment") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSNamespaceExportDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "TSNamespaceExportDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSTypeAnnotation(node, opts) {
      if (!node) return false;
      if (node.type !== "TSTypeAnnotation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSTypeParameterInstantiation(node, opts) {
      if (!node) return false;
      if (node.type !== "TSTypeParameterInstantiation") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSTypeParameterDeclaration(node, opts) {
      if (!node) return false;
      if (node.type !== "TSTypeParameterDeclaration") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSTypeParameter(node, opts) {
      if (!node) return false;
      if (node.type !== "TSTypeParameter") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isStandardized(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "ArrayExpression":
        case "AssignmentExpression":
        case "BinaryExpression":
        case "InterpreterDirective":
        case "Directive":
        case "DirectiveLiteral":
        case "BlockStatement":
        case "BreakStatement":
        case "CallExpression":
        case "CatchClause":
        case "ConditionalExpression":
        case "ContinueStatement":
        case "DebuggerStatement":
        case "DoWhileStatement":
        case "EmptyStatement":
        case "ExpressionStatement":
        case "File":
        case "ForInStatement":
        case "ForStatement":
        case "FunctionDeclaration":
        case "FunctionExpression":
        case "Identifier":
        case "IfStatement":
        case "LabeledStatement":
        case "StringLiteral":
        case "NumericLiteral":
        case "NullLiteral":
        case "BooleanLiteral":
        case "RegExpLiteral":
        case "LogicalExpression":
        case "MemberExpression":
        case "NewExpression":
        case "Program":
        case "ObjectExpression":
        case "ObjectMethod":
        case "ObjectProperty":
        case "RestElement":
        case "ReturnStatement":
        case "SequenceExpression":
        case "ParenthesizedExpression":
        case "SwitchCase":
        case "SwitchStatement":
        case "ThisExpression":
        case "ThrowStatement":
        case "TryStatement":
        case "UnaryExpression":
        case "UpdateExpression":
        case "VariableDeclaration":
        case "VariableDeclarator":
        case "WhileStatement":
        case "WithStatement":
        case "AssignmentPattern":
        case "ArrayPattern":
        case "ArrowFunctionExpression":
        case "ClassBody":
        case "ClassExpression":
        case "ClassDeclaration":
        case "ExportAllDeclaration":
        case "ExportDefaultDeclaration":
        case "ExportNamedDeclaration":
        case "ExportSpecifier":
        case "ForOfStatement":
        case "ImportDeclaration":
        case "ImportDefaultSpecifier":
        case "ImportNamespaceSpecifier":
        case "ImportSpecifier":
        case "ImportExpression":
        case "MetaProperty":
        case "ClassMethod":
        case "ObjectPattern":
        case "SpreadElement":
        case "Super":
        case "TaggedTemplateExpression":
        case "TemplateElement":
        case "TemplateLiteral":
        case "YieldExpression":
        case "AwaitExpression":
        case "Import":
        case "BigIntLiteral":
        case "ExportNamespaceSpecifier":
        case "OptionalMemberExpression":
        case "OptionalCallExpression":
        case "ClassProperty":
        case "ClassAccessorProperty":
        case "ClassPrivateProperty":
        case "ClassPrivateMethod":
        case "PrivateName":
        case "StaticBlock":
        case "ImportAttribute":
          break;
        case "Placeholder":
          switch (node.expectedNode) {
            case "Identifier":
            case "StringLiteral":
            case "BlockStatement":
            case "ClassBody":
              break;
            default:
              return false;
          }
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isExpression(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "ArrayExpression":
        case "AssignmentExpression":
        case "BinaryExpression":
        case "CallExpression":
        case "ConditionalExpression":
        case "FunctionExpression":
        case "Identifier":
        case "StringLiteral":
        case "NumericLiteral":
        case "NullLiteral":
        case "BooleanLiteral":
        case "RegExpLiteral":
        case "LogicalExpression":
        case "MemberExpression":
        case "NewExpression":
        case "ObjectExpression":
        case "SequenceExpression":
        case "ParenthesizedExpression":
        case "ThisExpression":
        case "UnaryExpression":
        case "UpdateExpression":
        case "ArrowFunctionExpression":
        case "ClassExpression":
        case "ImportExpression":
        case "MetaProperty":
        case "Super":
        case "TaggedTemplateExpression":
        case "TemplateLiteral":
        case "YieldExpression":
        case "AwaitExpression":
        case "Import":
        case "BigIntLiteral":
        case "OptionalMemberExpression":
        case "OptionalCallExpression":
        case "TypeCastExpression":
        case "JSXElement":
        case "JSXFragment":
        case "BindExpression":
        case "DoExpression":
        case "RecordExpression":
        case "TupleExpression":
        case "DecimalLiteral":
        case "ModuleExpression":
        case "TopicReference":
        case "PipelineTopicExpression":
        case "PipelineBareFunction":
        case "PipelinePrimaryTopicReference":
        case "TSInstantiationExpression":
        case "TSAsExpression":
        case "TSSatisfiesExpression":
        case "TSTypeAssertion":
        case "TSNonNullExpression":
          break;
        case "Placeholder":
          switch (node.expectedNode) {
            case "Expression":
            case "Identifier":
            case "StringLiteral":
              break;
            default:
              return false;
          }
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isBinary(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "BinaryExpression":
        case "LogicalExpression":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isScopable(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "BlockStatement":
        case "CatchClause":
        case "DoWhileStatement":
        case "ForInStatement":
        case "ForStatement":
        case "FunctionDeclaration":
        case "FunctionExpression":
        case "Program":
        case "ObjectMethod":
        case "SwitchStatement":
        case "WhileStatement":
        case "ArrowFunctionExpression":
        case "ClassExpression":
        case "ClassDeclaration":
        case "ForOfStatement":
        case "ClassMethod":
        case "ClassPrivateMethod":
        case "StaticBlock":
        case "TSModuleBlock":
          break;
        case "Placeholder":
          if (node.expectedNode === "BlockStatement") break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isBlockParent(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "BlockStatement":
        case "CatchClause":
        case "DoWhileStatement":
        case "ForInStatement":
        case "ForStatement":
        case "FunctionDeclaration":
        case "FunctionExpression":
        case "Program":
        case "ObjectMethod":
        case "SwitchStatement":
        case "WhileStatement":
        case "ArrowFunctionExpression":
        case "ForOfStatement":
        case "ClassMethod":
        case "ClassPrivateMethod":
        case "StaticBlock":
        case "TSModuleBlock":
          break;
        case "Placeholder":
          if (node.expectedNode === "BlockStatement") break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isBlock(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "BlockStatement":
        case "Program":
        case "TSModuleBlock":
          break;
        case "Placeholder":
          if (node.expectedNode === "BlockStatement") break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isStatement(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "BlockStatement":
        case "BreakStatement":
        case "ContinueStatement":
        case "DebuggerStatement":
        case "DoWhileStatement":
        case "EmptyStatement":
        case "ExpressionStatement":
        case "ForInStatement":
        case "ForStatement":
        case "FunctionDeclaration":
        case "IfStatement":
        case "LabeledStatement":
        case "ReturnStatement":
        case "SwitchStatement":
        case "ThrowStatement":
        case "TryStatement":
        case "VariableDeclaration":
        case "WhileStatement":
        case "WithStatement":
        case "ClassDeclaration":
        case "ExportAllDeclaration":
        case "ExportDefaultDeclaration":
        case "ExportNamedDeclaration":
        case "ForOfStatement":
        case "ImportDeclaration":
        case "DeclareClass":
        case "DeclareFunction":
        case "DeclareInterface":
        case "DeclareModule":
        case "DeclareModuleExports":
        case "DeclareTypeAlias":
        case "DeclareOpaqueType":
        case "DeclareVariable":
        case "DeclareExportDeclaration":
        case "DeclareExportAllDeclaration":
        case "InterfaceDeclaration":
        case "OpaqueType":
        case "TypeAlias":
        case "EnumDeclaration":
        case "TSDeclareFunction":
        case "TSInterfaceDeclaration":
        case "TSTypeAliasDeclaration":
        case "TSEnumDeclaration":
        case "TSModuleDeclaration":
        case "TSImportEqualsDeclaration":
        case "TSExportAssignment":
        case "TSNamespaceExportDeclaration":
          break;
        case "Placeholder":
          switch (node.expectedNode) {
            case "Statement":
            case "Declaration":
            case "BlockStatement":
              break;
            default:
              return false;
          }
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTerminatorless(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "BreakStatement":
        case "ContinueStatement":
        case "ReturnStatement":
        case "ThrowStatement":
        case "YieldExpression":
        case "AwaitExpression":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isCompletionStatement(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "BreakStatement":
        case "ContinueStatement":
        case "ReturnStatement":
        case "ThrowStatement":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isConditional(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "ConditionalExpression":
        case "IfStatement":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isLoop(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "DoWhileStatement":
        case "ForInStatement":
        case "ForStatement":
        case "WhileStatement":
        case "ForOfStatement":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isWhile(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "DoWhileStatement":
        case "WhileStatement":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isExpressionWrapper(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "ExpressionStatement":
        case "ParenthesizedExpression":
        case "TypeCastExpression":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isFor(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "ForInStatement":
        case "ForStatement":
        case "ForOfStatement":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isForXStatement(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "ForInStatement":
        case "ForOfStatement":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isFunction(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "FunctionDeclaration":
        case "FunctionExpression":
        case "ObjectMethod":
        case "ArrowFunctionExpression":
        case "ClassMethod":
        case "ClassPrivateMethod":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isFunctionParent(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "FunctionDeclaration":
        case "FunctionExpression":
        case "ObjectMethod":
        case "ArrowFunctionExpression":
        case "ClassMethod":
        case "ClassPrivateMethod":
        case "StaticBlock":
        case "TSModuleBlock":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isPureish(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "FunctionDeclaration":
        case "FunctionExpression":
        case "StringLiteral":
        case "NumericLiteral":
        case "NullLiteral":
        case "BooleanLiteral":
        case "RegExpLiteral":
        case "ArrowFunctionExpression":
        case "BigIntLiteral":
        case "DecimalLiteral":
          break;
        case "Placeholder":
          if (node.expectedNode === "StringLiteral") break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isDeclaration(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "FunctionDeclaration":
        case "VariableDeclaration":
        case "ClassDeclaration":
        case "ExportAllDeclaration":
        case "ExportDefaultDeclaration":
        case "ExportNamedDeclaration":
        case "ImportDeclaration":
        case "DeclareClass":
        case "DeclareFunction":
        case "DeclareInterface":
        case "DeclareModule":
        case "DeclareModuleExports":
        case "DeclareTypeAlias":
        case "DeclareOpaqueType":
        case "DeclareVariable":
        case "DeclareExportDeclaration":
        case "DeclareExportAllDeclaration":
        case "InterfaceDeclaration":
        case "OpaqueType":
        case "TypeAlias":
        case "EnumDeclaration":
        case "TSDeclareFunction":
        case "TSInterfaceDeclaration":
        case "TSTypeAliasDeclaration":
        case "TSEnumDeclaration":
        case "TSModuleDeclaration":
        case "TSImportEqualsDeclaration":
          break;
        case "Placeholder":
          if (node.expectedNode === "Declaration") break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isFunctionParameter(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "Identifier":
        case "RestElement":
        case "AssignmentPattern":
        case "ArrayPattern":
        case "ObjectPattern":
        case "VoidPattern":
          break;
        case "Placeholder":
          if (node.expectedNode === "Identifier") break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isPatternLike(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "Identifier":
        case "MemberExpression":
        case "RestElement":
        case "AssignmentPattern":
        case "ArrayPattern":
        case "ObjectPattern":
        case "VoidPattern":
        case "TSAsExpression":
        case "TSSatisfiesExpression":
        case "TSTypeAssertion":
        case "TSNonNullExpression":
          break;
        case "Placeholder":
          switch (node.expectedNode) {
            case "Pattern":
            case "Identifier":
              break;
            default:
              return false;
          }
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isLVal(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "Identifier":
        case "MemberExpression":
        case "RestElement":
        case "AssignmentPattern":
        case "ArrayPattern":
        case "ObjectPattern":
        case "TSParameterProperty":
        case "TSAsExpression":
        case "TSSatisfiesExpression":
        case "TSTypeAssertion":
        case "TSNonNullExpression":
          break;
        case "Placeholder":
          switch (node.expectedNode) {
            case "Pattern":
            case "Identifier":
              break;
            default:
              return false;
          }
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSEntityName(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "Identifier":
        case "TSQualifiedName":
          break;
        case "Placeholder":
          if (node.expectedNode === "Identifier") break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isLiteral(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "StringLiteral":
        case "NumericLiteral":
        case "NullLiteral":
        case "BooleanLiteral":
        case "RegExpLiteral":
        case "TemplateLiteral":
        case "BigIntLiteral":
        case "DecimalLiteral":
          break;
        case "Placeholder":
          if (node.expectedNode === "StringLiteral") break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isImmutable(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "StringLiteral":
        case "NumericLiteral":
        case "NullLiteral":
        case "BooleanLiteral":
        case "BigIntLiteral":
        case "JSXAttribute":
        case "JSXClosingElement":
        case "JSXElement":
        case "JSXExpressionContainer":
        case "JSXSpreadChild":
        case "JSXOpeningElement":
        case "JSXText":
        case "JSXFragment":
        case "JSXOpeningFragment":
        case "JSXClosingFragment":
        case "DecimalLiteral":
          break;
        case "Placeholder":
          if (node.expectedNode === "StringLiteral") break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isUserWhitespacable(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "ObjectMethod":
        case "ObjectProperty":
        case "ObjectTypeInternalSlot":
        case "ObjectTypeCallProperty":
        case "ObjectTypeIndexer":
        case "ObjectTypeProperty":
        case "ObjectTypeSpreadProperty":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isMethod(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "ObjectMethod":
        case "ClassMethod":
        case "ClassPrivateMethod":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isObjectMember(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "ObjectMethod":
        case "ObjectProperty":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isProperty(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "ObjectProperty":
        case "ClassProperty":
        case "ClassAccessorProperty":
        case "ClassPrivateProperty":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isUnaryLike(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "UnaryExpression":
        case "SpreadElement":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isPattern(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "AssignmentPattern":
        case "ArrayPattern":
        case "ObjectPattern":
        case "VoidPattern":
          break;
        case "Placeholder":
          if (node.expectedNode === "Pattern") break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isClass(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "ClassExpression":
        case "ClassDeclaration":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isImportOrExportDeclaration(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "ExportAllDeclaration":
        case "ExportDefaultDeclaration":
        case "ExportNamedDeclaration":
        case "ImportDeclaration":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isExportDeclaration(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "ExportAllDeclaration":
        case "ExportDefaultDeclaration":
        case "ExportNamedDeclaration":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isModuleSpecifier(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "ExportSpecifier":
        case "ImportDefaultSpecifier":
        case "ImportNamespaceSpecifier":
        case "ImportSpecifier":
        case "ExportNamespaceSpecifier":
        case "ExportDefaultSpecifier":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isAccessor(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "ClassAccessorProperty":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isPrivate(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "ClassPrivateProperty":
        case "ClassPrivateMethod":
        case "PrivateName":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isFlow(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "AnyTypeAnnotation":
        case "ArrayTypeAnnotation":
        case "BooleanTypeAnnotation":
        case "BooleanLiteralTypeAnnotation":
        case "NullLiteralTypeAnnotation":
        case "ClassImplements":
        case "DeclareClass":
        case "DeclareFunction":
        case "DeclareInterface":
        case "DeclareModule":
        case "DeclareModuleExports":
        case "DeclareTypeAlias":
        case "DeclareOpaqueType":
        case "DeclareVariable":
        case "DeclareExportDeclaration":
        case "DeclareExportAllDeclaration":
        case "DeclaredPredicate":
        case "ExistsTypeAnnotation":
        case "FunctionTypeAnnotation":
        case "FunctionTypeParam":
        case "GenericTypeAnnotation":
        case "InferredPredicate":
        case "InterfaceExtends":
        case "InterfaceDeclaration":
        case "InterfaceTypeAnnotation":
        case "IntersectionTypeAnnotation":
        case "MixedTypeAnnotation":
        case "EmptyTypeAnnotation":
        case "NullableTypeAnnotation":
        case "NumberLiteralTypeAnnotation":
        case "NumberTypeAnnotation":
        case "ObjectTypeAnnotation":
        case "ObjectTypeInternalSlot":
        case "ObjectTypeCallProperty":
        case "ObjectTypeIndexer":
        case "ObjectTypeProperty":
        case "ObjectTypeSpreadProperty":
        case "OpaqueType":
        case "QualifiedTypeIdentifier":
        case "StringLiteralTypeAnnotation":
        case "StringTypeAnnotation":
        case "SymbolTypeAnnotation":
        case "ThisTypeAnnotation":
        case "TupleTypeAnnotation":
        case "TypeofTypeAnnotation":
        case "TypeAlias":
        case "TypeAnnotation":
        case "TypeCastExpression":
        case "TypeParameter":
        case "TypeParameterDeclaration":
        case "TypeParameterInstantiation":
        case "UnionTypeAnnotation":
        case "Variance":
        case "VoidTypeAnnotation":
        case "EnumDeclaration":
        case "EnumBooleanBody":
        case "EnumNumberBody":
        case "EnumStringBody":
        case "EnumSymbolBody":
        case "EnumBooleanMember":
        case "EnumNumberMember":
        case "EnumStringMember":
        case "EnumDefaultedMember":
        case "IndexedAccessType":
        case "OptionalIndexedAccessType":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isFlowType(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "AnyTypeAnnotation":
        case "ArrayTypeAnnotation":
        case "BooleanTypeAnnotation":
        case "BooleanLiteralTypeAnnotation":
        case "NullLiteralTypeAnnotation":
        case "ExistsTypeAnnotation":
        case "FunctionTypeAnnotation":
        case "GenericTypeAnnotation":
        case "InterfaceTypeAnnotation":
        case "IntersectionTypeAnnotation":
        case "MixedTypeAnnotation":
        case "EmptyTypeAnnotation":
        case "NullableTypeAnnotation":
        case "NumberLiteralTypeAnnotation":
        case "NumberTypeAnnotation":
        case "ObjectTypeAnnotation":
        case "StringLiteralTypeAnnotation":
        case "StringTypeAnnotation":
        case "SymbolTypeAnnotation":
        case "ThisTypeAnnotation":
        case "TupleTypeAnnotation":
        case "TypeofTypeAnnotation":
        case "UnionTypeAnnotation":
        case "VoidTypeAnnotation":
        case "IndexedAccessType":
        case "OptionalIndexedAccessType":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isFlowBaseAnnotation(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "AnyTypeAnnotation":
        case "BooleanTypeAnnotation":
        case "NullLiteralTypeAnnotation":
        case "MixedTypeAnnotation":
        case "EmptyTypeAnnotation":
        case "NumberTypeAnnotation":
        case "StringTypeAnnotation":
        case "SymbolTypeAnnotation":
        case "ThisTypeAnnotation":
        case "VoidTypeAnnotation":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isFlowDeclaration(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "DeclareClass":
        case "DeclareFunction":
        case "DeclareInterface":
        case "DeclareModule":
        case "DeclareModuleExports":
        case "DeclareTypeAlias":
        case "DeclareOpaqueType":
        case "DeclareVariable":
        case "DeclareExportDeclaration":
        case "DeclareExportAllDeclaration":
        case "InterfaceDeclaration":
        case "OpaqueType":
        case "TypeAlias":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isFlowPredicate(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "DeclaredPredicate":
        case "InferredPredicate":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isEnumBody(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "EnumBooleanBody":
        case "EnumNumberBody":
        case "EnumStringBody":
        case "EnumSymbolBody":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isEnumMember(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "EnumBooleanMember":
        case "EnumNumberMember":
        case "EnumStringMember":
        case "EnumDefaultedMember":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isJSX(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "JSXAttribute":
        case "JSXClosingElement":
        case "JSXElement":
        case "JSXEmptyExpression":
        case "JSXExpressionContainer":
        case "JSXSpreadChild":
        case "JSXIdentifier":
        case "JSXMemberExpression":
        case "JSXNamespacedName":
        case "JSXOpeningElement":
        case "JSXSpreadAttribute":
        case "JSXText":
        case "JSXFragment":
        case "JSXOpeningFragment":
        case "JSXClosingFragment":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isMiscellaneous(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "Noop":
        case "Placeholder":
        case "V8IntrinsicIdentifier":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTypeScript(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "TSParameterProperty":
        case "TSDeclareFunction":
        case "TSDeclareMethod":
        case "TSQualifiedName":
        case "TSCallSignatureDeclaration":
        case "TSConstructSignatureDeclaration":
        case "TSPropertySignature":
        case "TSMethodSignature":
        case "TSIndexSignature":
        case "TSAnyKeyword":
        case "TSBooleanKeyword":
        case "TSBigIntKeyword":
        case "TSIntrinsicKeyword":
        case "TSNeverKeyword":
        case "TSNullKeyword":
        case "TSNumberKeyword":
        case "TSObjectKeyword":
        case "TSStringKeyword":
        case "TSSymbolKeyword":
        case "TSUndefinedKeyword":
        case "TSUnknownKeyword":
        case "TSVoidKeyword":
        case "TSThisType":
        case "TSFunctionType":
        case "TSConstructorType":
        case "TSTypeReference":
        case "TSTypePredicate":
        case "TSTypeQuery":
        case "TSTypeLiteral":
        case "TSArrayType":
        case "TSTupleType":
        case "TSOptionalType":
        case "TSRestType":
        case "TSNamedTupleMember":
        case "TSUnionType":
        case "TSIntersectionType":
        case "TSConditionalType":
        case "TSInferType":
        case "TSParenthesizedType":
        case "TSTypeOperator":
        case "TSIndexedAccessType":
        case "TSMappedType":
        case "TSTemplateLiteralType":
        case "TSLiteralType":
        case "TSExpressionWithTypeArguments":
        case "TSInterfaceDeclaration":
        case "TSInterfaceBody":
        case "TSTypeAliasDeclaration":
        case "TSInstantiationExpression":
        case "TSAsExpression":
        case "TSSatisfiesExpression":
        case "TSTypeAssertion":
        case "TSEnumBody":
        case "TSEnumDeclaration":
        case "TSEnumMember":
        case "TSModuleDeclaration":
        case "TSModuleBlock":
        case "TSImportType":
        case "TSImportEqualsDeclaration":
        case "TSExternalModuleReference":
        case "TSNonNullExpression":
        case "TSExportAssignment":
        case "TSNamespaceExportDeclaration":
        case "TSTypeAnnotation":
        case "TSTypeParameterInstantiation":
        case "TSTypeParameterDeclaration":
        case "TSTypeParameter":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSTypeElement(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "TSCallSignatureDeclaration":
        case "TSConstructSignatureDeclaration":
        case "TSPropertySignature":
        case "TSMethodSignature":
        case "TSIndexSignature":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSType(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "TSAnyKeyword":
        case "TSBooleanKeyword":
        case "TSBigIntKeyword":
        case "TSIntrinsicKeyword":
        case "TSNeverKeyword":
        case "TSNullKeyword":
        case "TSNumberKeyword":
        case "TSObjectKeyword":
        case "TSStringKeyword":
        case "TSSymbolKeyword":
        case "TSUndefinedKeyword":
        case "TSUnknownKeyword":
        case "TSVoidKeyword":
        case "TSThisType":
        case "TSFunctionType":
        case "TSConstructorType":
        case "TSTypeReference":
        case "TSTypePredicate":
        case "TSTypeQuery":
        case "TSTypeLiteral":
        case "TSArrayType":
        case "TSTupleType":
        case "TSOptionalType":
        case "TSRestType":
        case "TSUnionType":
        case "TSIntersectionType":
        case "TSConditionalType":
        case "TSInferType":
        case "TSParenthesizedType":
        case "TSTypeOperator":
        case "TSIndexedAccessType":
        case "TSMappedType":
        case "TSTemplateLiteralType":
        case "TSLiteralType":
        case "TSExpressionWithTypeArguments":
        case "TSImportType":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isTSBaseType(node, opts) {
      if (!node) return false;
      switch (node.type) {
        case "TSAnyKeyword":
        case "TSBooleanKeyword":
        case "TSBigIntKeyword":
        case "TSIntrinsicKeyword":
        case "TSNeverKeyword":
        case "TSNullKeyword":
        case "TSNumberKeyword":
        case "TSObjectKeyword":
        case "TSStringKeyword":
        case "TSSymbolKeyword":
        case "TSUndefinedKeyword":
        case "TSUnknownKeyword":
        case "TSVoidKeyword":
        case "TSThisType":
        case "TSTemplateLiteralType":
        case "TSLiteralType":
          break;
        default:
          return false;
      }
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isNumberLiteral(node, opts) {
      (0, _deprecationWarning.default)("isNumberLiteral", "isNumericLiteral");
      if (!node) return false;
      if (node.type !== "NumberLiteral") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isRegexLiteral(node, opts) {
      (0, _deprecationWarning.default)("isRegexLiteral", "isRegExpLiteral");
      if (!node) return false;
      if (node.type !== "RegexLiteral") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isRestProperty(node, opts) {
      (0, _deprecationWarning.default)("isRestProperty", "isRestElement");
      if (!node) return false;
      if (node.type !== "RestProperty") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isSpreadProperty(node, opts) {
      (0, _deprecationWarning.default)("isSpreadProperty", "isSpreadElement");
      if (!node) return false;
      if (node.type !== "SpreadProperty") return false;
      return opts == null || (0, _shallowEqual.default)(node, opts);
    }
    function isModuleDeclaration(node, opts) {
      (0, _deprecationWarning.default)("isModuleDeclaration", "isImportOrExportDeclaration");
      return isImportOrExportDeclaration(node, opts);
    }
  }
});

// ../node_modules/@babel/types/lib/validators/matchesPattern.js
var require_matchesPattern = __commonJS({
  "../node_modules/@babel/types/lib/validators/matchesPattern.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = matchesPattern;
    var _index = require_generated();
    function isMemberExpressionLike(node) {
      return (0, _index.isMemberExpression)(node) || (0, _index.isMetaProperty)(node);
    }
    function matchesPattern(member, match, allowPartial) {
      if (!isMemberExpressionLike(member)) return false;
      const parts = Array.isArray(match) ? match : match.split(".");
      const nodes = [];
      let node;
      for (node = member; isMemberExpressionLike(node); node = (_object = node.object) != null ? _object : node.meta) {
        var _object;
        nodes.push(node.property);
      }
      nodes.push(node);
      if (nodes.length < parts.length) return false;
      if (!allowPartial && nodes.length > parts.length) return false;
      for (let i = 0, j = nodes.length - 1; i < parts.length; i++, j--) {
        const node2 = nodes[j];
        let value;
        if ((0, _index.isIdentifier)(node2)) {
          value = node2.name;
        } else if ((0, _index.isStringLiteral)(node2)) {
          value = node2.value;
        } else if ((0, _index.isThisExpression)(node2)) {
          value = "this";
        } else if ((0, _index.isSuper)(node2)) {
          value = "super";
        } else if ((0, _index.isPrivateName)(node2)) {
          value = "#" + node2.id.name;
        } else {
          return false;
        }
        if (parts[i] !== value) return false;
      }
      return true;
    }
  }
});

// ../node_modules/@babel/types/lib/validators/buildMatchMemberExpression.js
var require_buildMatchMemberExpression = __commonJS({
  "../node_modules/@babel/types/lib/validators/buildMatchMemberExpression.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = buildMatchMemberExpression;
    var _matchesPattern = require_matchesPattern();
    function buildMatchMemberExpression(match, allowPartial) {
      const parts = match.split(".");
      return (member) => (0, _matchesPattern.default)(member, parts, allowPartial);
    }
  }
});

// ../node_modules/@babel/types/lib/validators/react/isReactComponent.js
var require_isReactComponent = __commonJS({
  "../node_modules/@babel/types/lib/validators/react/isReactComponent.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    var _buildMatchMemberExpression = require_buildMatchMemberExpression();
    var isReactComponent = (0, _buildMatchMemberExpression.default)("React.Component");
    var _default = exports.default = isReactComponent;
  }
});

// ../node_modules/@babel/types/lib/validators/react/isCompatTag.js
var require_isCompatTag = __commonJS({
  "../node_modules/@babel/types/lib/validators/react/isCompatTag.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isCompatTag;
    function isCompatTag(tagName) {
      return !!tagName && /^[a-z]/.test(tagName);
    }
  }
});

// ../node_modules/@babel/types/lib/validators/isType.js
var require_isType = __commonJS({
  "../node_modules/@babel/types/lib/validators/isType.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isType;
    var _index = require_definitions();
    function isType(nodeType, targetType) {
      if (nodeType === targetType) return true;
      if (nodeType == null) return false;
      if (_index.ALIAS_KEYS[targetType]) return false;
      const aliases = _index.FLIPPED_ALIAS_KEYS[targetType];
      if (aliases != null && aliases.includes(nodeType)) return true;
      return false;
    }
  }
});

// ../node_modules/@babel/types/lib/validators/isPlaceholderType.js
var require_isPlaceholderType = __commonJS({
  "../node_modules/@babel/types/lib/validators/isPlaceholderType.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isPlaceholderType;
    var _index = require_definitions();
    function isPlaceholderType(placeholderType, targetType) {
      if (placeholderType === targetType) return true;
      const aliases = _index.PLACEHOLDERS_ALIAS[placeholderType];
      if (aliases != null && aliases.includes(targetType)) return true;
      return false;
    }
  }
});

// ../node_modules/@babel/types/lib/validators/is.js
var require_is = __commonJS({
  "../node_modules/@babel/types/lib/validators/is.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = is;
    var _shallowEqual = require_shallowEqual();
    var _isType = require_isType();
    var _isPlaceholderType = require_isPlaceholderType();
    var _index = require_definitions();
    function is(type, node, opts) {
      if (!node) return false;
      const matches = (0, _isType.default)(node.type, type);
      if (!matches) {
        if (!opts && node.type === "Placeholder" && type in _index.FLIPPED_ALIAS_KEYS) {
          return (0, _isPlaceholderType.default)(node.expectedNode, type);
        }
        return false;
      }
      if (opts === void 0) {
        return true;
      } else {
        return (0, _shallowEqual.default)(node, opts);
      }
    }
  }
});

// ../node_modules/@babel/helper-validator-identifier/lib/identifier.js
var require_identifier = __commonJS({
  "../node_modules/@babel/helper-validator-identifier/lib/identifier.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.isIdentifierChar = isIdentifierChar;
    exports.isIdentifierName = isIdentifierName;
    exports.isIdentifierStart = isIdentifierStart;
    var nonASCIIidentifierStartChars = "\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088F\u08A0-\u08C9\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C5C\u0C5D\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDC-\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u1711\u171F-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4C\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C8A\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7DC\uA7F1-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC";
    var nonASCIIidentifierChars = "\xB7\u0300-\u036F\u0387\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u0669\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u06F0-\u06F9\u0711\u0730-\u074A\u07A6-\u07B0\u07C0-\u07C9\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u0897-\u089F\u08CA-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0966-\u096F\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09E6-\u09EF\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A66-\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AE6-\u0AEF\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B55-\u0B57\u0B62\u0B63\u0B66-\u0B6F\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0BE6-\u0BEF\u0C00-\u0C04\u0C3C\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0CE6-\u0CEF\u0CF3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D66-\u0D6F\u0D81-\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0E50-\u0E59\u0EB1\u0EB4-\u0EBC\u0EC8-\u0ECE\u0ED0-\u0ED9\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1040-\u1049\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F-\u109D\u135D-\u135F\u1369-\u1371\u1712-\u1715\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u17E0-\u17E9\u180B-\u180D\u180F-\u1819\u18A9\u1920-\u192B\u1930-\u193B\u1946-\u194F\u19D0-\u19DA\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AB0-\u1ABD\u1ABF-\u1ADD\u1AE0-\u1AEB\u1B00-\u1B04\u1B34-\u1B44\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BB0-\u1BB9\u1BE6-\u1BF3\u1C24-\u1C37\u1C40-\u1C49\u1C50-\u1C59\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DFF\u200C\u200D\u203F\u2040\u2054\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\u30FB\uA620-\uA629\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA82C\uA880\uA881\uA8B4-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F1\uA8FF-\uA909\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9D0-\uA9D9\uA9E5\uA9F0-\uA9F9\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA50-\uAA59\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uABF0-\uABF9\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFF10-\uFF19\uFF3F\uFF65";
    var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
    var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");
    nonASCIIidentifierStartChars = nonASCIIidentifierChars = null;
    var astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 14, 29, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 19, 35, 5, 35, 5, 39, 9, 51, 13, 10, 2, 14, 2, 6, 2, 1, 2, 10, 2, 14, 2, 6, 2, 1, 4, 51, 13, 310, 10, 21, 11, 7, 25, 5, 2, 41, 2, 8, 70, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 66, 18, 2, 1, 11, 21, 11, 25, 7, 25, 39, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 28, 43, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 56, 50, 14, 50, 14, 35, 39, 27, 10, 22, 251, 41, 7, 1, 17, 5, 57, 28, 11, 0, 9, 21, 43, 17, 47, 20, 28, 22, 13, 52, 58, 1, 3, 0, 14, 44, 33, 24, 27, 35, 30, 0, 3, 0, 9, 34, 4, 0, 13, 47, 15, 3, 22, 0, 2, 0, 36, 17, 2, 24, 20, 1, 64, 6, 2, 0, 2, 3, 2, 14, 2, 9, 8, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 19, 0, 13, 4, 31, 9, 2, 0, 3, 0, 2, 37, 2, 0, 26, 0, 2, 0, 45, 52, 19, 3, 21, 2, 31, 47, 21, 1, 2, 0, 185, 46, 42, 3, 37, 47, 21, 0, 60, 42, 14, 0, 72, 26, 38, 6, 186, 43, 117, 63, 32, 7, 3, 0, 3, 7, 2, 1, 2, 23, 16, 0, 2, 0, 95, 7, 3, 38, 17, 0, 2, 0, 29, 0, 11, 39, 8, 0, 22, 0, 12, 45, 20, 0, 19, 72, 200, 32, 32, 8, 2, 36, 18, 0, 50, 29, 113, 6, 2, 1, 2, 37, 22, 0, 26, 5, 2, 1, 2, 31, 15, 0, 24, 43, 261, 18, 16, 0, 2, 12, 2, 33, 125, 0, 80, 921, 103, 110, 18, 195, 2637, 96, 16, 1071, 18, 5, 26, 3994, 6, 582, 6842, 29, 1763, 568, 8, 30, 18, 78, 18, 29, 19, 47, 17, 3, 32, 20, 6, 18, 433, 44, 212, 63, 33, 24, 3, 24, 45, 74, 6, 0, 67, 12, 65, 1, 2, 0, 15, 4, 10, 7381, 42, 31, 98, 114, 8702, 3, 2, 6, 2, 1, 2, 290, 16, 0, 30, 2, 3, 0, 15, 3, 9, 395, 2309, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 1845, 30, 7, 5, 262, 61, 147, 44, 11, 6, 17, 0, 322, 29, 19, 43, 485, 27, 229, 29, 3, 0, 208, 30, 2, 2, 2, 1, 2, 6, 3, 4, 10, 1, 225, 6, 2, 3, 2, 1, 2, 14, 2, 196, 60, 67, 8, 0, 1205, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42719, 33, 4381, 3, 5773, 3, 7472, 16, 621, 2467, 541, 1507, 4938, 6, 8489];
    var astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 574, 3, 9, 9, 7, 9, 32, 4, 318, 1, 78, 5, 71, 10, 50, 3, 123, 2, 54, 14, 32, 10, 3, 1, 11, 3, 46, 10, 8, 0, 46, 9, 7, 2, 37, 13, 2, 9, 6, 1, 45, 0, 13, 2, 49, 13, 9, 3, 2, 11, 83, 11, 7, 0, 3, 0, 158, 11, 6, 9, 7, 3, 56, 1, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 68, 8, 2, 0, 3, 0, 2, 3, 2, 4, 2, 0, 15, 1, 83, 17, 10, 9, 5, 0, 82, 19, 13, 9, 214, 6, 3, 8, 28, 1, 83, 16, 16, 9, 82, 12, 9, 9, 7, 19, 58, 14, 5, 9, 243, 14, 166, 9, 71, 5, 2, 1, 3, 3, 2, 0, 2, 1, 13, 9, 120, 6, 3, 6, 4, 0, 29, 9, 41, 6, 2, 3, 9, 0, 10, 10, 47, 15, 199, 7, 137, 9, 54, 7, 2, 7, 17, 9, 57, 21, 2, 13, 123, 5, 4, 0, 2, 1, 2, 6, 2, 0, 9, 9, 49, 4, 2, 1, 2, 4, 9, 9, 55, 9, 266, 3, 10, 1, 2, 0, 49, 6, 4, 4, 14, 10, 5350, 0, 7, 14, 11465, 27, 2343, 9, 87, 9, 39, 4, 60, 6, 26, 9, 535, 9, 470, 0, 2, 54, 8, 3, 82, 0, 12, 1, 19628, 1, 4178, 9, 519, 45, 3, 22, 543, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 513, 54, 5, 49, 9, 0, 15, 0, 23, 4, 2, 14, 1361, 6, 2, 16, 3, 6, 2, 1, 2, 4, 101, 0, 161, 6, 10, 9, 357, 0, 62, 13, 499, 13, 245, 1, 2, 9, 233, 0, 3, 0, 8, 1, 6, 0, 475, 6, 110, 6, 6, 9, 4759, 9, 787719, 239];
    function isInAstralSet(code, set) {
      let pos = 65536;
      for (let i = 0, length = set.length; i < length; i += 2) {
        pos += set[i];
        if (pos > code) return false;
        pos += set[i + 1];
        if (pos >= code) return true;
      }
      return false;
    }
    function isIdentifierStart(code) {
      if (code < 65) return code === 36;
      if (code <= 90) return true;
      if (code < 97) return code === 95;
      if (code <= 122) return true;
      if (code <= 65535) {
        return code >= 170 && nonASCIIidentifierStart.test(String.fromCharCode(code));
      }
      return isInAstralSet(code, astralIdentifierStartCodes);
    }
    function isIdentifierChar(code) {
      if (code < 48) return code === 36;
      if (code < 58) return true;
      if (code < 65) return false;
      if (code <= 90) return true;
      if (code < 97) return code === 95;
      if (code <= 122) return true;
      if (code <= 65535) {
        return code >= 170 && nonASCIIidentifier.test(String.fromCharCode(code));
      }
      return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
    }
    function isIdentifierName(name) {
      let isFirst = true;
      for (let i = 0; i < name.length; i++) {
        let cp = name.charCodeAt(i);
        if ((cp & 64512) === 55296 && i + 1 < name.length) {
          const trail = name.charCodeAt(++i);
          if ((trail & 64512) === 56320) {
            cp = 65536 + ((cp & 1023) << 10) + (trail & 1023);
          }
        }
        if (isFirst) {
          isFirst = false;
          if (!isIdentifierStart(cp)) {
            return false;
          }
        } else if (!isIdentifierChar(cp)) {
          return false;
        }
      }
      return !isFirst;
    }
  }
});

// ../node_modules/@babel/helper-validator-identifier/lib/keyword.js
var require_keyword = __commonJS({
  "../node_modules/@babel/helper-validator-identifier/lib/keyword.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.isKeyword = isKeyword;
    exports.isReservedWord = isReservedWord;
    exports.isStrictBindOnlyReservedWord = isStrictBindOnlyReservedWord;
    exports.isStrictBindReservedWord = isStrictBindReservedWord;
    exports.isStrictReservedWord = isStrictReservedWord;
    var reservedWords = {
      keyword: ["break", "case", "catch", "continue", "debugger", "default", "do", "else", "finally", "for", "function", "if", "return", "switch", "throw", "try", "var", "const", "while", "with", "new", "this", "super", "class", "extends", "export", "import", "null", "true", "false", "in", "instanceof", "typeof", "void", "delete"],
      strict: ["implements", "interface", "let", "package", "private", "protected", "public", "static", "yield"],
      strictBind: ["eval", "arguments"]
    };
    var keywords = new Set(reservedWords.keyword);
    var reservedWordsStrictSet = new Set(reservedWords.strict);
    var reservedWordsStrictBindSet = new Set(reservedWords.strictBind);
    function isReservedWord(word, inModule) {
      return inModule && word === "await" || word === "enum";
    }
    function isStrictReservedWord(word, inModule) {
      return isReservedWord(word, inModule) || reservedWordsStrictSet.has(word);
    }
    function isStrictBindOnlyReservedWord(word) {
      return reservedWordsStrictBindSet.has(word);
    }
    function isStrictBindReservedWord(word, inModule) {
      return isStrictReservedWord(word, inModule) || isStrictBindOnlyReservedWord(word);
    }
    function isKeyword(word) {
      return keywords.has(word);
    }
  }
});

// ../node_modules/@babel/helper-validator-identifier/lib/index.js
var require_lib = __commonJS({
  "../node_modules/@babel/helper-validator-identifier/lib/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "isIdentifierChar", {
      enumerable: true,
      get: function() {
        return _identifier.isIdentifierChar;
      }
    });
    Object.defineProperty(exports, "isIdentifierName", {
      enumerable: true,
      get: function() {
        return _identifier.isIdentifierName;
      }
    });
    Object.defineProperty(exports, "isIdentifierStart", {
      enumerable: true,
      get: function() {
        return _identifier.isIdentifierStart;
      }
    });
    Object.defineProperty(exports, "isKeyword", {
      enumerable: true,
      get: function() {
        return _keyword.isKeyword;
      }
    });
    Object.defineProperty(exports, "isReservedWord", {
      enumerable: true,
      get: function() {
        return _keyword.isReservedWord;
      }
    });
    Object.defineProperty(exports, "isStrictBindOnlyReservedWord", {
      enumerable: true,
      get: function() {
        return _keyword.isStrictBindOnlyReservedWord;
      }
    });
    Object.defineProperty(exports, "isStrictBindReservedWord", {
      enumerable: true,
      get: function() {
        return _keyword.isStrictBindReservedWord;
      }
    });
    Object.defineProperty(exports, "isStrictReservedWord", {
      enumerable: true,
      get: function() {
        return _keyword.isStrictReservedWord;
      }
    });
    var _identifier = require_identifier();
    var _keyword = require_keyword();
  }
});

// ../node_modules/@babel/types/lib/validators/isValidIdentifier.js
var require_isValidIdentifier = __commonJS({
  "../node_modules/@babel/types/lib/validators/isValidIdentifier.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isValidIdentifier;
    var _helperValidatorIdentifier = require_lib();
    function isValidIdentifier(name, reserved = true) {
      if (typeof name !== "string") return false;
      if (reserved) {
        if ((0, _helperValidatorIdentifier.isKeyword)(name) || (0, _helperValidatorIdentifier.isStrictReservedWord)(name, true)) {
          return false;
        }
      }
      return (0, _helperValidatorIdentifier.isIdentifierName)(name);
    }
  }
});

// ../node_modules/@babel/helper-string-parser/lib/index.js
var require_lib2 = __commonJS({
  "../node_modules/@babel/helper-string-parser/lib/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.readCodePoint = readCodePoint;
    exports.readInt = readInt;
    exports.readStringContents = readStringContents;
    var _isDigit = function isDigit(code) {
      return code >= 48 && code <= 57;
    };
    var forbiddenNumericSeparatorSiblings = {
      decBinOct: /* @__PURE__ */ new Set([46, 66, 69, 79, 95, 98, 101, 111, 43, 45]),
      hex: /* @__PURE__ */ new Set([46, 88, 95, 120])
    };
    var isAllowedNumericSeparatorSibling = {
      bin: (ch) => ch === 48 || ch === 49,
      oct: (ch) => ch >= 48 && ch <= 55,
      dec: (ch) => ch >= 48 && ch <= 57,
      hex: (ch) => ch >= 48 && ch <= 57 || ch >= 65 && ch <= 70 || ch >= 97 && ch <= 102
    };
    function readStringContents(type, input, pos, lineStart, curLine, errors) {
      const initialPos = pos;
      const initialLineStart = lineStart;
      const initialCurLine = curLine;
      let out = "";
      let firstInvalidLoc = null;
      let chunkStart = pos;
      const {
        length
      } = input;
      for (; ; ) {
        if (pos >= length) {
          errors.unterminated(initialPos, initialLineStart, initialCurLine);
          out += input.slice(chunkStart, pos);
          break;
        }
        const ch = input.charCodeAt(pos);
        if (isStringEnd(type, ch, input, pos)) {
          out += input.slice(chunkStart, pos);
          break;
        }
        if (ch === 92) {
          out += input.slice(chunkStart, pos);
          const res = readEscapedChar(input, pos, lineStart, curLine, type === "template", errors);
          if (res.ch === null && !firstInvalidLoc) {
            firstInvalidLoc = {
              pos,
              lineStart,
              curLine
            };
          } else {
            out += res.ch;
          }
          ({
            pos,
            lineStart,
            curLine
          } = res);
          chunkStart = pos;
        } else if (ch === 8232 || ch === 8233) {
          ++pos;
          ++curLine;
          lineStart = pos;
        } else if (ch === 10 || ch === 13) {
          if (type === "template") {
            out += input.slice(chunkStart, pos) + "\n";
            ++pos;
            if (ch === 13 && input.charCodeAt(pos) === 10) {
              ++pos;
            }
            ++curLine;
            chunkStart = lineStart = pos;
          } else {
            errors.unterminated(initialPos, initialLineStart, initialCurLine);
          }
        } else {
          ++pos;
        }
      }
      return {
        pos,
        str: out,
        firstInvalidLoc,
        lineStart,
        curLine,
        containsInvalid: !!firstInvalidLoc
      };
    }
    function isStringEnd(type, ch, input, pos) {
      if (type === "template") {
        return ch === 96 || ch === 36 && input.charCodeAt(pos + 1) === 123;
      }
      return ch === (type === "double" ? 34 : 39);
    }
    function readEscapedChar(input, pos, lineStart, curLine, inTemplate, errors) {
      const throwOnInvalid = !inTemplate;
      pos++;
      const res = (ch2) => ({
        pos,
        ch: ch2,
        lineStart,
        curLine
      });
      const ch = input.charCodeAt(pos++);
      switch (ch) {
        case 110:
          return res("\n");
        case 114:
          return res("\r");
        case 120: {
          let code;
          ({
            code,
            pos
          } = readHexChar(input, pos, lineStart, curLine, 2, false, throwOnInvalid, errors));
          return res(code === null ? null : String.fromCharCode(code));
        }
        case 117: {
          let code;
          ({
            code,
            pos
          } = readCodePoint(input, pos, lineStart, curLine, throwOnInvalid, errors));
          return res(code === null ? null : String.fromCodePoint(code));
        }
        case 116:
          return res("	");
        case 98:
          return res("\b");
        case 118:
          return res("\v");
        case 102:
          return res("\f");
        case 13:
          if (input.charCodeAt(pos) === 10) {
            ++pos;
          }
        case 10:
          lineStart = pos;
          ++curLine;
        case 8232:
        case 8233:
          return res("");
        case 56:
        case 57:
          if (inTemplate) {
            return res(null);
          } else {
            errors.strictNumericEscape(pos - 1, lineStart, curLine);
          }
        default:
          if (ch >= 48 && ch <= 55) {
            const startPos = pos - 1;
            const match = /^[0-7]+/.exec(input.slice(startPos, pos + 2));
            let octalStr = match[0];
            let octal = parseInt(octalStr, 8);
            if (octal > 255) {
              octalStr = octalStr.slice(0, -1);
              octal = parseInt(octalStr, 8);
            }
            pos += octalStr.length - 1;
            const next = input.charCodeAt(pos);
            if (octalStr !== "0" || next === 56 || next === 57) {
              if (inTemplate) {
                return res(null);
              } else {
                errors.strictNumericEscape(startPos, lineStart, curLine);
              }
            }
            return res(String.fromCharCode(octal));
          }
          return res(String.fromCharCode(ch));
      }
    }
    function readHexChar(input, pos, lineStart, curLine, len, forceLen, throwOnInvalid, errors) {
      const initialPos = pos;
      let n;
      ({
        n,
        pos
      } = readInt(input, pos, lineStart, curLine, 16, len, forceLen, false, errors, !throwOnInvalid));
      if (n === null) {
        if (throwOnInvalid) {
          errors.invalidEscapeSequence(initialPos, lineStart, curLine);
        } else {
          pos = initialPos - 1;
        }
      }
      return {
        code: n,
        pos
      };
    }
    function readInt(input, pos, lineStart, curLine, radix, len, forceLen, allowNumSeparator, errors, bailOnError) {
      const start = pos;
      const forbiddenSiblings = radix === 16 ? forbiddenNumericSeparatorSiblings.hex : forbiddenNumericSeparatorSiblings.decBinOct;
      const isAllowedSibling = radix === 16 ? isAllowedNumericSeparatorSibling.hex : radix === 10 ? isAllowedNumericSeparatorSibling.dec : radix === 8 ? isAllowedNumericSeparatorSibling.oct : isAllowedNumericSeparatorSibling.bin;
      let invalid = false;
      let total = 0;
      for (let i = 0, e = len == null ? Infinity : len; i < e; ++i) {
        const code = input.charCodeAt(pos);
        let val;
        if (code === 95 && allowNumSeparator !== "bail") {
          const prev = input.charCodeAt(pos - 1);
          const next = input.charCodeAt(pos + 1);
          if (!allowNumSeparator) {
            if (bailOnError) return {
              n: null,
              pos
            };
            errors.numericSeparatorInEscapeSequence(pos, lineStart, curLine);
          } else if (Number.isNaN(next) || !isAllowedSibling(next) || forbiddenSiblings.has(prev)) {
            if (bailOnError) return {
              n: null,
              pos
            };
            errors.unexpectedNumericSeparator(pos, lineStart, curLine);
          }
          ++pos;
          continue;
        }
        if (code >= 97) {
          val = code - 97 + 10;
        } else if (code >= 65) {
          val = code - 65 + 10;
        } else if (_isDigit(code)) {
          val = code - 48;
        } else {
          val = Infinity;
        }
        if (val >= radix) {
          if (val <= 9 && bailOnError) {
            return {
              n: null,
              pos
            };
          } else if (val <= 9 && errors.invalidDigit(pos, lineStart, curLine, radix)) {
            val = 0;
          } else if (forceLen) {
            val = 0;
            invalid = true;
          } else {
            break;
          }
        }
        ++pos;
        total = total * radix + val;
      }
      if (pos === start || len != null && pos - start !== len || invalid) {
        return {
          n: null,
          pos
        };
      }
      return {
        n: total,
        pos
      };
    }
    function readCodePoint(input, pos, lineStart, curLine, throwOnInvalid, errors) {
      const ch = input.charCodeAt(pos);
      let code;
      if (ch === 123) {
        ++pos;
        ({
          code,
          pos
        } = readHexChar(input, pos, lineStart, curLine, input.indexOf("}", pos) - pos, true, throwOnInvalid, errors));
        ++pos;
        if (code !== null && code > 1114111) {
          if (throwOnInvalid) {
            errors.invalidCodePoint(pos, lineStart, curLine);
          } else {
            return {
              code: null,
              pos
            };
          }
        }
      } else {
        ({
          code,
          pos
        } = readHexChar(input, pos, lineStart, curLine, 4, false, throwOnInvalid, errors));
      }
      return {
        code,
        pos
      };
    }
  }
});

// ../node_modules/@babel/types/lib/constants/index.js
var require_constants = __commonJS({
  "../node_modules/@babel/types/lib/constants/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.UPDATE_OPERATORS = exports.UNARY_OPERATORS = exports.STRING_UNARY_OPERATORS = exports.STATEMENT_OR_BLOCK_KEYS = exports.NUMBER_UNARY_OPERATORS = exports.NUMBER_BINARY_OPERATORS = exports.LOGICAL_OPERATORS = exports.INHERIT_KEYS = exports.FOR_INIT_KEYS = exports.FLATTENABLE_KEYS = exports.EQUALITY_BINARY_OPERATORS = exports.COMPARISON_BINARY_OPERATORS = exports.COMMENT_KEYS = exports.BOOLEAN_UNARY_OPERATORS = exports.BOOLEAN_NUMBER_BINARY_OPERATORS = exports.BOOLEAN_BINARY_OPERATORS = exports.BINARY_OPERATORS = exports.ASSIGNMENT_OPERATORS = void 0;
    var STATEMENT_OR_BLOCK_KEYS = exports.STATEMENT_OR_BLOCK_KEYS = ["consequent", "body", "alternate"];
    var FLATTENABLE_KEYS = exports.FLATTENABLE_KEYS = ["body", "expressions"];
    var FOR_INIT_KEYS = exports.FOR_INIT_KEYS = ["left", "init"];
    var COMMENT_KEYS = exports.COMMENT_KEYS = ["leadingComments", "trailingComments", "innerComments"];
    var LOGICAL_OPERATORS = exports.LOGICAL_OPERATORS = ["||", "&&", "??"];
    var UPDATE_OPERATORS = exports.UPDATE_OPERATORS = ["++", "--"];
    var BOOLEAN_NUMBER_BINARY_OPERATORS = exports.BOOLEAN_NUMBER_BINARY_OPERATORS = [">", "<", ">=", "<="];
    var EQUALITY_BINARY_OPERATORS = exports.EQUALITY_BINARY_OPERATORS = ["==", "===", "!=", "!=="];
    var COMPARISON_BINARY_OPERATORS = exports.COMPARISON_BINARY_OPERATORS = [...EQUALITY_BINARY_OPERATORS, "in", "instanceof"];
    var BOOLEAN_BINARY_OPERATORS = exports.BOOLEAN_BINARY_OPERATORS = [...COMPARISON_BINARY_OPERATORS, ...BOOLEAN_NUMBER_BINARY_OPERATORS];
    var NUMBER_BINARY_OPERATORS = exports.NUMBER_BINARY_OPERATORS = ["-", "/", "%", "*", "**", "&", "|", ">>", ">>>", "<<", "^"];
    var BINARY_OPERATORS = exports.BINARY_OPERATORS = ["+", ...NUMBER_BINARY_OPERATORS, ...BOOLEAN_BINARY_OPERATORS, "|>"];
    var ASSIGNMENT_OPERATORS = exports.ASSIGNMENT_OPERATORS = ["=", "+=", ...NUMBER_BINARY_OPERATORS.map((op) => op + "="), ...LOGICAL_OPERATORS.map((op) => op + "=")];
    var BOOLEAN_UNARY_OPERATORS = exports.BOOLEAN_UNARY_OPERATORS = ["delete", "!"];
    var NUMBER_UNARY_OPERATORS = exports.NUMBER_UNARY_OPERATORS = ["+", "-", "~"];
    var STRING_UNARY_OPERATORS = exports.STRING_UNARY_OPERATORS = ["typeof"];
    var UNARY_OPERATORS = exports.UNARY_OPERATORS = ["void", "throw", ...BOOLEAN_UNARY_OPERATORS, ...NUMBER_UNARY_OPERATORS, ...STRING_UNARY_OPERATORS];
    var INHERIT_KEYS = exports.INHERIT_KEYS = {
      optional: ["typeAnnotation", "typeParameters", "returnType"],
      force: ["start", "loc", "end"]
    };
    exports.BLOCK_SCOPED_SYMBOL = /* @__PURE__ */ Symbol.for("var used to be block scoped");
    exports.NOT_LOCAL_BINDING = /* @__PURE__ */ Symbol.for("should not be considered a local binding");
  }
});

// ../node_modules/@babel/types/lib/definitions/utils.js
var require_utils = __commonJS({
  "../node_modules/@babel/types/lib/definitions/utils.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.allExpandedTypes = exports.VISITOR_KEYS = exports.NODE_UNION_SHAPES__PRIVATE = exports.NODE_PARENT_VALIDATIONS = exports.NODE_FIELDS = exports.FLIPPED_ALIAS_KEYS = exports.DEPRECATED_KEYS = exports.BUILDER_KEYS = exports.ALIAS_KEYS = void 0;
    exports.arrayOf = arrayOf;
    exports.arrayOfType = arrayOfType;
    exports.assertEach = assertEach;
    exports.assertNodeOrValueType = assertNodeOrValueType;
    exports.assertNodeType = assertNodeType;
    exports.assertOneOf = assertOneOf;
    exports.assertOptionalChainStart = assertOptionalChainStart;
    exports.assertShape = assertShape;
    exports.assertValueType = assertValueType;
    exports.chain = chain;
    exports.default = defineType;
    exports.defineAliasedType = defineAliasedType;
    exports.validate = validate;
    exports.validateArrayOfType = validateArrayOfType;
    exports.validateOptional = validateOptional;
    exports.validateOptionalType = validateOptionalType;
    exports.validateType = validateType;
    var _is = require_is();
    var _validate = require_validate();
    var VISITOR_KEYS = exports.VISITOR_KEYS = {};
    var ALIAS_KEYS = exports.ALIAS_KEYS = {};
    var FLIPPED_ALIAS_KEYS = exports.FLIPPED_ALIAS_KEYS = {};
    var NODE_FIELDS = exports.NODE_FIELDS = {};
    var BUILDER_KEYS = exports.BUILDER_KEYS = {};
    var DEPRECATED_KEYS = exports.DEPRECATED_KEYS = {};
    var NODE_PARENT_VALIDATIONS = exports.NODE_PARENT_VALIDATIONS = {};
    var NODE_UNION_SHAPES__PRIVATE = exports.NODE_UNION_SHAPES__PRIVATE = {};
    function getType(val) {
      if (Array.isArray(val)) {
        return "array";
      } else if (val === null) {
        return "null";
      } else {
        return typeof val;
      }
    }
    function validate(validate2) {
      return {
        validate: validate2
      };
    }
    function validateType(...typeNames) {
      return validate(assertNodeType(...typeNames));
    }
    function validateOptional(validate2) {
      return {
        validate: validate2,
        optional: true
      };
    }
    function validateOptionalType(...typeNames) {
      return {
        validate: assertNodeType(...typeNames),
        optional: true
      };
    }
    function arrayOf(elementType) {
      return chain(assertValueType("array"), assertEach(elementType));
    }
    function arrayOfType(...typeNames) {
      return arrayOf(assertNodeType(...typeNames));
    }
    function validateArrayOfType(...typeNames) {
      return validate(arrayOfType(...typeNames));
    }
    function assertEach(callback) {
      const childValidator = process.env.BABEL_TYPES_8_BREAKING ? _validate.validateChild : () => {
      };
      function validator(node, key, val) {
        if (!Array.isArray(val)) return;
        let i = 0;
        const subKey = {
          toString() {
            return `${key}[${i}]`;
          }
        };
        for (; i < val.length; i++) {
          const v = val[i];
          callback(node, subKey, v);
          childValidator(node, subKey, v);
        }
      }
      validator.each = callback;
      return validator;
    }
    function assertOneOf(...values) {
      function validate2(node, key, val) {
        if (!values.includes(val)) {
          throw new TypeError(`Property ${key} expected value to be one of ${JSON.stringify(values)} but got ${JSON.stringify(val)}`);
        }
      }
      validate2.oneOf = values;
      return validate2;
    }
    var allExpandedTypes = exports.allExpandedTypes = [];
    function assertNodeType(...types) {
      const expandedTypes = /* @__PURE__ */ new Set();
      allExpandedTypes.push({
        types,
        set: expandedTypes
      });
      function validate2(node, key, val) {
        const valType = val == null ? void 0 : val.type;
        if (valType != null) {
          if (expandedTypes.has(valType)) {
            (0, _validate.validateChild)(node, key, val);
            return;
          }
          if (valType === "Placeholder") {
            for (const type of types) {
              if ((0, _is.default)(type, val)) {
                (0, _validate.validateChild)(node, key, val);
                return;
              }
            }
          }
        }
        throw new TypeError(`Property ${key} of ${node.type} expected node to be of a type ${JSON.stringify(types)} but instead got ${JSON.stringify(valType)}`);
      }
      validate2.oneOfNodeTypes = types;
      return validate2;
    }
    function assertNodeOrValueType(...types) {
      function validate2(node, key, val) {
        const primitiveType = getType(val);
        for (const type of types) {
          if (primitiveType === type || (0, _is.default)(type, val)) {
            (0, _validate.validateChild)(node, key, val);
            return;
          }
        }
        throw new TypeError(`Property ${key} of ${node.type} expected node to be of a type ${JSON.stringify(types)} but instead got ${JSON.stringify(val == null ? void 0 : val.type)}`);
      }
      validate2.oneOfNodeOrValueTypes = types;
      return validate2;
    }
    function assertValueType(type) {
      function validate2(node, key, val) {
        if (getType(val) === type) {
          return;
        }
        throw new TypeError(`Property ${key} expected type of ${type} but got ${getType(val)}`);
      }
      validate2.type = type;
      return validate2;
    }
    function assertShape(shape) {
      const keys = Object.keys(shape);
      function validate2(node, key, val) {
        const errors = [];
        for (const property of keys) {
          try {
            (0, _validate.validateField)(node, property, val[property], shape[property]);
          } catch (error) {
            if (error instanceof TypeError) {
              errors.push(error.message);
              continue;
            }
            throw error;
          }
        }
        if (errors.length) {
          throw new TypeError(`Property ${key} of ${node.type} expected to have the following:
${errors.join("\n")}`);
        }
      }
      validate2.shapeOf = shape;
      return validate2;
    }
    function assertOptionalChainStart() {
      function validate2(node) {
        var _current;
        let current = node;
        while (node) {
          const {
            type
          } = current;
          if (type === "OptionalCallExpression") {
            if (current.optional) return;
            current = current.callee;
            continue;
          }
          if (type === "OptionalMemberExpression") {
            if (current.optional) return;
            current = current.object;
            continue;
          }
          break;
        }
        throw new TypeError(`Non-optional ${node.type} must chain from an optional OptionalMemberExpression or OptionalCallExpression. Found chain from ${(_current = current) == null ? void 0 : _current.type}`);
      }
      return validate2;
    }
    function chain(...fns) {
      function validate2(...args) {
        for (const fn of fns) {
          fn(...args);
        }
      }
      validate2.chainOf = fns;
      if (fns.length >= 2 && "type" in fns[0] && fns[0].type === "array" && !("each" in fns[1])) {
        throw new Error(`An assertValueType("array") validator can only be followed by an assertEach(...) validator.`);
      }
      return validate2;
    }
    var validTypeOpts = /* @__PURE__ */ new Set(["aliases", "builder", "deprecatedAlias", "fields", "inherits", "visitor", "validate", "unionShape"]);
    var validFieldKeys = /* @__PURE__ */ new Set(["default", "optional", "deprecated", "validate"]);
    var store = {};
    function defineAliasedType(...aliases) {
      return (type, opts = {}) => {
        let defined = opts.aliases;
        if (!defined) {
          var _store$opts$inherits$;
          if (opts.inherits) defined = (_store$opts$inherits$ = store[opts.inherits].aliases) == null ? void 0 : _store$opts$inherits$.slice();
          defined != null ? defined : defined = [];
          opts.aliases = defined;
        }
        const additional = aliases.filter((a) => !defined.includes(a));
        defined.unshift(...additional);
        defineType(type, opts);
      };
    }
    function defineType(type, opts = {}) {
      const inherits = opts.inherits && store[opts.inherits] || {};
      let fields = opts.fields;
      if (!fields) {
        fields = {};
        if (inherits.fields) {
          const keys = Object.getOwnPropertyNames(inherits.fields);
          for (const key of keys) {
            const field = inherits.fields[key];
            const def = field.default;
            if (Array.isArray(def) ? def.length > 0 : def && typeof def === "object") {
              throw new Error("field defaults can only be primitives or empty arrays currently");
            }
            fields[key] = {
              default: Array.isArray(def) ? [] : def,
              optional: field.optional,
              deprecated: field.deprecated,
              validate: field.validate
            };
          }
        }
      }
      const visitor = opts.visitor || inherits.visitor || [];
      const aliases = opts.aliases || inherits.aliases || [];
      const builder = opts.builder || inherits.builder || opts.visitor || [];
      for (const k of Object.keys(opts)) {
        if (!validTypeOpts.has(k)) {
          throw new Error(`Unknown type option "${k}" on ${type}`);
        }
      }
      if (opts.deprecatedAlias) {
        DEPRECATED_KEYS[opts.deprecatedAlias] = type;
      }
      for (const key of visitor.concat(builder)) {
        fields[key] = fields[key] || {};
      }
      for (const key of Object.keys(fields)) {
        const field = fields[key];
        if (field.default !== void 0 && !builder.includes(key)) {
          field.optional = true;
        }
        if (field.default === void 0) {
          field.default = null;
        } else if (!field.validate && field.default != null) {
          field.validate = assertValueType(getType(field.default));
        }
        for (const k of Object.keys(field)) {
          if (!validFieldKeys.has(k)) {
            throw new Error(`Unknown field key "${k}" on ${type}.${key}`);
          }
        }
      }
      VISITOR_KEYS[type] = opts.visitor = visitor;
      BUILDER_KEYS[type] = opts.builder = builder;
      NODE_FIELDS[type] = opts.fields = fields;
      ALIAS_KEYS[type] = opts.aliases = aliases;
      aliases.forEach((alias) => {
        FLIPPED_ALIAS_KEYS[alias] = FLIPPED_ALIAS_KEYS[alias] || [];
        FLIPPED_ALIAS_KEYS[alias].push(type);
      });
      if (opts.validate) {
        NODE_PARENT_VALIDATIONS[type] = opts.validate;
      }
      if (opts.unionShape) {
        NODE_UNION_SHAPES__PRIVATE[type] = opts.unionShape;
      }
      store[type] = opts;
    }
  }
});

// ../node_modules/@babel/types/lib/definitions/core.js
var require_core = __commonJS({
  "../node_modules/@babel/types/lib/definitions/core.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.patternLikeCommon = exports.importAttributes = exports.functionTypeAnnotationCommon = exports.functionDeclarationCommon = exports.functionCommon = exports.classMethodOrPropertyUnionShapeCommon = exports.classMethodOrPropertyCommon = exports.classMethodOrDeclareMethodCommon = void 0;
    var _is = require_is();
    var _isValidIdentifier = require_isValidIdentifier();
    var _helperValidatorIdentifier = require_lib();
    var _helperStringParser = require_lib2();
    var _index = require_constants();
    var _utils = require_utils();
    var classMethodOrPropertyUnionShapeCommon = (allowPrivateName = false) => ({
      unionShape: {
        discriminator: "computed",
        shapes: [{
          name: "computed",
          value: [true],
          properties: {
            key: {
              validate: (0, _utils.assertNodeType)("Expression")
            }
          }
        }, {
          name: "nonComputed",
          value: [false],
          properties: {
            key: {
              validate: allowPrivateName ? (0, _utils.assertNodeType)("Identifier", "StringLiteral", "NumericLiteral", "BigIntLiteral", "PrivateName") : (0, _utils.assertNodeType)("Identifier", "StringLiteral", "NumericLiteral", "BigIntLiteral")
            }
          }
        }]
      }
    });
    exports.classMethodOrPropertyUnionShapeCommon = classMethodOrPropertyUnionShapeCommon;
    var defineType = (0, _utils.defineAliasedType)("Standardized");
    defineType("ArrayExpression", {
      fields: {
        elements: {
          validate: (0, _utils.arrayOf)((0, _utils.assertNodeOrValueType)("null", "Expression", "SpreadElement")),
          default: !process.env.BABEL_TYPES_8_BREAKING ? [] : void 0
        }
      },
      visitor: ["elements"],
      aliases: ["Expression"]
    });
    defineType("AssignmentExpression", {
      fields: {
        operator: {
          validate: !process.env.BABEL_TYPES_8_BREAKING ? (0, _utils.assertValueType)("string") : Object.assign((function() {
            const identifier = (0, _utils.assertOneOf)(..._index.ASSIGNMENT_OPERATORS);
            const pattern = (0, _utils.assertOneOf)("=");
            return function(node, key, val) {
              const validator = (0, _is.default)("Pattern", node.left) ? pattern : identifier;
              validator(node, key, val);
            };
          })(), {
            oneOf: _index.ASSIGNMENT_OPERATORS
          })
        },
        left: {
          validate: !process.env.BABEL_TYPES_8_BREAKING ? (0, _utils.assertNodeType)("LVal", "OptionalMemberExpression") : (0, _utils.assertNodeType)("Identifier", "MemberExpression", "OptionalMemberExpression", "ArrayPattern", "ObjectPattern", "TSAsExpression", "TSSatisfiesExpression", "TSTypeAssertion", "TSNonNullExpression")
        },
        right: {
          validate: (0, _utils.assertNodeType)("Expression")
        }
      },
      builder: ["operator", "left", "right"],
      visitor: ["left", "right"],
      aliases: ["Expression"]
    });
    defineType("BinaryExpression", {
      builder: ["operator", "left", "right"],
      fields: {
        operator: {
          validate: (0, _utils.assertOneOf)(..._index.BINARY_OPERATORS)
        },
        left: {
          validate: (function() {
            const expression = (0, _utils.assertNodeType)("Expression");
            const inOp = (0, _utils.assertNodeType)("Expression", "PrivateName");
            const validator = Object.assign(function(node, key, val) {
              const validator2 = node.operator === "in" ? inOp : expression;
              validator2(node, key, val);
            }, {
              oneOfNodeTypes: ["Expression", "PrivateName"]
            });
            return validator;
          })()
        },
        right: {
          validate: (0, _utils.assertNodeType)("Expression")
        }
      },
      visitor: ["left", "right"],
      aliases: ["Binary", "Expression"]
    });
    defineType("InterpreterDirective", {
      builder: ["value"],
      fields: {
        value: {
          validate: (0, _utils.assertValueType)("string")
        }
      }
    });
    defineType("Directive", {
      visitor: ["value"],
      fields: {
        value: {
          validate: (0, _utils.assertNodeType)("DirectiveLiteral")
        }
      }
    });
    defineType("DirectiveLiteral", {
      builder: ["value"],
      fields: {
        value: {
          validate: (0, _utils.assertValueType)("string")
        }
      }
    });
    defineType("BlockStatement", {
      builder: ["body", "directives"],
      visitor: ["directives", "body"],
      fields: {
        directives: {
          validate: (0, _utils.arrayOfType)("Directive"),
          default: []
        },
        body: (0, _utils.validateArrayOfType)("Statement")
      },
      aliases: ["Scopable", "BlockParent", "Block", "Statement"]
    });
    defineType("BreakStatement", {
      visitor: ["label"],
      fields: {
        label: {
          validate: (0, _utils.assertNodeType)("Identifier"),
          optional: true
        }
      },
      aliases: ["Statement", "Terminatorless", "CompletionStatement"]
    });
    defineType("CallExpression", {
      visitor: ["callee", "typeParameters", "typeArguments", "arguments"],
      builder: ["callee", "arguments"],
      aliases: ["Expression"],
      fields: Object.assign({
        callee: {
          validate: (0, _utils.assertNodeType)("Expression", "Super", "V8IntrinsicIdentifier")
        },
        arguments: (0, _utils.validateArrayOfType)("Expression", "SpreadElement", "ArgumentPlaceholder"),
        typeArguments: {
          validate: (0, _utils.assertNodeType)("TypeParameterInstantiation"),
          optional: true
        }
      }, process.env.BABEL_TYPES_8_BREAKING ? {} : {
        optional: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        },
        typeParameters: {
          validate: (0, _utils.assertNodeType)("TSTypeParameterInstantiation"),
          optional: true
        }
      })
    });
    defineType("CatchClause", {
      visitor: ["param", "body"],
      fields: {
        param: {
          validate: (0, _utils.assertNodeType)("Identifier", "ArrayPattern", "ObjectPattern"),
          optional: true
        },
        body: {
          validate: (0, _utils.assertNodeType)("BlockStatement")
        }
      },
      aliases: ["Scopable", "BlockParent"]
    });
    defineType("ConditionalExpression", {
      visitor: ["test", "consequent", "alternate"],
      fields: {
        test: {
          validate: (0, _utils.assertNodeType)("Expression")
        },
        consequent: {
          validate: (0, _utils.assertNodeType)("Expression")
        },
        alternate: {
          validate: (0, _utils.assertNodeType)("Expression")
        }
      },
      aliases: ["Expression", "Conditional"]
    });
    defineType("ContinueStatement", {
      visitor: ["label"],
      fields: {
        label: {
          validate: (0, _utils.assertNodeType)("Identifier"),
          optional: true
        }
      },
      aliases: ["Statement", "Terminatorless", "CompletionStatement"]
    });
    defineType("DebuggerStatement", {
      aliases: ["Statement"]
    });
    defineType("DoWhileStatement", {
      builder: ["test", "body"],
      visitor: ["body", "test"],
      fields: {
        test: {
          validate: (0, _utils.assertNodeType)("Expression")
        },
        body: {
          validate: (0, _utils.assertNodeType)("Statement")
        }
      },
      aliases: ["Statement", "BlockParent", "Loop", "While", "Scopable"]
    });
    defineType("EmptyStatement", {
      aliases: ["Statement"]
    });
    defineType("ExpressionStatement", {
      visitor: ["expression"],
      fields: {
        expression: {
          validate: (0, _utils.assertNodeType)("Expression")
        }
      },
      aliases: ["Statement", "ExpressionWrapper"]
    });
    defineType("File", {
      builder: ["program", "comments", "tokens"],
      visitor: ["program"],
      fields: {
        program: {
          validate: (0, _utils.assertNodeType)("Program")
        },
        comments: {
          validate: !process.env.BABEL_TYPES_8_BREAKING ? Object.assign(() => {
          }, {
            each: {
              oneOfNodeTypes: ["CommentBlock", "CommentLine"]
            }
          }) : (0, _utils.assertEach)((0, _utils.assertNodeType)("CommentBlock", "CommentLine")),
          optional: true
        },
        tokens: {
          validate: (0, _utils.assertEach)(Object.assign(() => {
          }, {
            type: "any"
          })),
          optional: true
        }
      }
    });
    defineType("ForInStatement", {
      visitor: ["left", "right", "body"],
      aliases: ["Scopable", "Statement", "For", "BlockParent", "Loop", "ForXStatement"],
      fields: {
        left: {
          validate: !process.env.BABEL_TYPES_8_BREAKING ? (0, _utils.assertNodeType)("VariableDeclaration", "LVal") : (0, _utils.assertNodeType)("VariableDeclaration", "Identifier", "MemberExpression", "ArrayPattern", "ObjectPattern", "TSAsExpression", "TSSatisfiesExpression", "TSTypeAssertion", "TSNonNullExpression")
        },
        right: {
          validate: (0, _utils.assertNodeType)("Expression")
        },
        body: {
          validate: (0, _utils.assertNodeType)("Statement")
        }
      }
    });
    defineType("ForStatement", {
      visitor: ["init", "test", "update", "body"],
      aliases: ["Scopable", "Statement", "For", "BlockParent", "Loop"],
      fields: {
        init: {
          validate: (0, _utils.assertNodeType)("VariableDeclaration", "Expression"),
          optional: true
        },
        test: {
          validate: (0, _utils.assertNodeType)("Expression"),
          optional: true
        },
        update: {
          validate: (0, _utils.assertNodeType)("Expression"),
          optional: true
        },
        body: {
          validate: (0, _utils.assertNodeType)("Statement")
        }
      }
    });
    var functionCommon = () => ({
      params: (0, _utils.validateArrayOfType)("FunctionParameter"),
      generator: {
        default: false
      },
      async: {
        default: false
      }
    });
    exports.functionCommon = functionCommon;
    var functionTypeAnnotationCommon = () => ({
      returnType: {
        validate: (0, _utils.assertNodeType)("TypeAnnotation", "TSTypeAnnotation", "Noop"),
        optional: true
      },
      typeParameters: {
        validate: (0, _utils.assertNodeType)("TypeParameterDeclaration", "TSTypeParameterDeclaration", "Noop"),
        optional: true
      }
    });
    exports.functionTypeAnnotationCommon = functionTypeAnnotationCommon;
    var functionDeclarationCommon = () => Object.assign({}, functionCommon(), {
      declare: {
        validate: (0, _utils.assertValueType)("boolean"),
        optional: true
      },
      id: {
        validate: (0, _utils.assertNodeType)("Identifier"),
        optional: true
      }
    });
    exports.functionDeclarationCommon = functionDeclarationCommon;
    defineType("FunctionDeclaration", {
      builder: ["id", "params", "body", "generator", "async"],
      visitor: ["id", "typeParameters", "params", "predicate", "returnType", "body"],
      fields: Object.assign({}, functionDeclarationCommon(), functionTypeAnnotationCommon(), {
        body: {
          validate: (0, _utils.assertNodeType)("BlockStatement")
        },
        predicate: {
          validate: (0, _utils.assertNodeType)("DeclaredPredicate", "InferredPredicate"),
          optional: true
        }
      }),
      aliases: ["Scopable", "Function", "BlockParent", "FunctionParent", "Statement", "Pureish", "Declaration"],
      validate: !process.env.BABEL_TYPES_8_BREAKING ? void 0 : (function() {
        const identifier = (0, _utils.assertNodeType)("Identifier");
        return function(parent, key, node) {
          if (!(0, _is.default)("ExportDefaultDeclaration", parent)) {
            identifier(node, "id", node.id);
          }
        };
      })()
    });
    defineType("FunctionExpression", {
      inherits: "FunctionDeclaration",
      aliases: ["Scopable", "Function", "BlockParent", "FunctionParent", "Expression", "Pureish"],
      fields: Object.assign({}, functionCommon(), functionTypeAnnotationCommon(), {
        id: {
          validate: (0, _utils.assertNodeType)("Identifier"),
          optional: true
        },
        body: {
          validate: (0, _utils.assertNodeType)("BlockStatement")
        },
        predicate: {
          validate: (0, _utils.assertNodeType)("DeclaredPredicate", "InferredPredicate"),
          optional: true
        }
      })
    });
    var patternLikeCommon = () => ({
      typeAnnotation: {
        validate: (0, _utils.assertNodeType)("TypeAnnotation", "TSTypeAnnotation", "Noop"),
        optional: true
      },
      optional: {
        validate: (0, _utils.assertValueType)("boolean"),
        optional: true
      },
      decorators: {
        validate: (0, _utils.arrayOfType)("Decorator"),
        optional: true
      }
    });
    exports.patternLikeCommon = patternLikeCommon;
    defineType("Identifier", {
      builder: ["name"],
      visitor: ["typeAnnotation", "decorators"],
      aliases: ["Expression", "FunctionParameter", "PatternLike", "LVal", "TSEntityName"],
      fields: Object.assign({}, patternLikeCommon(), {
        name: {
          validate: process.env.BABEL_TYPES_8_BREAKING ? (0, _utils.chain)((0, _utils.assertValueType)("string"), Object.assign(function(node, key, val) {
            if (!(0, _isValidIdentifier.default)(val, false)) {
              throw new TypeError(`"${val}" is not a valid identifier name`);
            }
          }, {
            type: "string"
          })) : (0, _utils.assertValueType)("string")
        }
      }),
      validate: process.env.BABEL_TYPES_8_BREAKING ? function(parent, key, node) {
        const match = /\.(\w+)$/.exec(key.toString());
        if (!match) return;
        const [, parentKey] = match;
        const nonComp = {
          computed: false
        };
        if (parentKey === "property") {
          if ((0, _is.default)("MemberExpression", parent, nonComp)) return;
          if ((0, _is.default)("OptionalMemberExpression", parent, nonComp)) return;
        } else if (parentKey === "key") {
          if ((0, _is.default)("Property", parent, nonComp)) return;
          if ((0, _is.default)("Method", parent, nonComp)) return;
        } else if (parentKey === "exported") {
          if ((0, _is.default)("ExportSpecifier", parent)) return;
        } else if (parentKey === "imported") {
          if ((0, _is.default)("ImportSpecifier", parent, {
            imported: node
          })) return;
        } else if (parentKey === "meta") {
          if ((0, _is.default)("MetaProperty", parent, {
            meta: node
          })) return;
        }
        if (((0, _helperValidatorIdentifier.isKeyword)(node.name) || (0, _helperValidatorIdentifier.isReservedWord)(node.name, false)) && node.name !== "this") {
          throw new TypeError(`"${node.name}" is not a valid identifier`);
        }
      } : void 0
    });
    defineType("IfStatement", {
      visitor: ["test", "consequent", "alternate"],
      aliases: ["Statement", "Conditional"],
      fields: {
        test: {
          validate: (0, _utils.assertNodeType)("Expression")
        },
        consequent: {
          validate: (0, _utils.assertNodeType)("Statement")
        },
        alternate: {
          optional: true,
          validate: (0, _utils.assertNodeType)("Statement")
        }
      }
    });
    defineType("LabeledStatement", {
      visitor: ["label", "body"],
      aliases: ["Statement"],
      fields: {
        label: {
          validate: (0, _utils.assertNodeType)("Identifier")
        },
        body: {
          validate: (0, _utils.assertNodeType)("Statement")
        }
      }
    });
    defineType("StringLiteral", {
      builder: ["value"],
      fields: {
        value: {
          validate: (0, _utils.assertValueType)("string")
        }
      },
      aliases: ["Expression", "Pureish", "Literal", "Immutable"]
    });
    defineType("NumericLiteral", {
      builder: ["value"],
      deprecatedAlias: "NumberLiteral",
      fields: {
        value: {
          validate: (0, _utils.chain)((0, _utils.assertValueType)("number"), Object.assign(function(node, key, val) {
            if (1 / val < 0 || !Number.isFinite(val)) {
              const error = new Error(`NumericLiterals must be non-negative finite numbers. You can use t.valueToNode(${val}) instead.`);
            }
          }, {
            type: "number"
          }))
        }
      },
      aliases: ["Expression", "Pureish", "Literal", "Immutable"]
    });
    defineType("NullLiteral", {
      aliases: ["Expression", "Pureish", "Literal", "Immutable"]
    });
    defineType("BooleanLiteral", {
      builder: ["value"],
      fields: {
        value: {
          validate: (0, _utils.assertValueType)("boolean")
        }
      },
      aliases: ["Expression", "Pureish", "Literal", "Immutable"]
    });
    defineType("RegExpLiteral", {
      builder: ["pattern", "flags"],
      deprecatedAlias: "RegexLiteral",
      aliases: ["Expression", "Pureish", "Literal"],
      fields: {
        pattern: {
          validate: (0, _utils.assertValueType)("string")
        },
        flags: {
          validate: process.env.BABEL_TYPES_8_BREAKING ? (0, _utils.chain)((0, _utils.assertValueType)("string"), Object.assign(function(node, key, val) {
            const invalid = /[^dgimsuvy]/.exec(val);
            if (invalid) {
              throw new TypeError(`"${invalid[0]}" is not a valid RegExp flag`);
            }
          }, {
            type: "string"
          })) : (0, _utils.assertValueType)("string"),
          default: ""
        }
      }
    });
    defineType("LogicalExpression", {
      builder: ["operator", "left", "right"],
      visitor: ["left", "right"],
      aliases: ["Binary", "Expression"],
      fields: {
        operator: {
          validate: (0, _utils.assertOneOf)(..._index.LOGICAL_OPERATORS)
        },
        left: {
          validate: (0, _utils.assertNodeType)("Expression")
        },
        right: {
          validate: (0, _utils.assertNodeType)("Expression")
        }
      }
    });
    defineType("MemberExpression", {
      builder: ["object", "property", "computed", ...!process.env.BABEL_TYPES_8_BREAKING ? ["optional"] : []],
      visitor: ["object", "property"],
      aliases: ["Expression", "LVal", "PatternLike"],
      unionShape: {
        discriminator: "computed",
        shapes: [{
          name: "computed",
          value: [true],
          properties: {
            property: {
              validate: (0, _utils.assertNodeType)("Expression")
            }
          }
        }, {
          name: "nonComputed",
          value: [false],
          properties: {
            property: {
              validate: (0, _utils.assertNodeType)("Identifier", "PrivateName")
            }
          }
        }]
      },
      fields: Object.assign({
        object: {
          validate: (0, _utils.assertNodeType)("Expression", "Super")
        },
        property: {
          validate: (function() {
            const normal = (0, _utils.assertNodeType)("Identifier", "PrivateName");
            const computed = (0, _utils.assertNodeType)("Expression");
            const validator = function(node, key, val) {
              const validator2 = node.computed ? computed : normal;
              validator2(node, key, val);
            };
            validator.oneOfNodeTypes = ["Expression", "Identifier", "PrivateName"];
            return validator;
          })()
        },
        computed: {
          default: false
        }
      }, !process.env.BABEL_TYPES_8_BREAKING ? {
        optional: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        }
      } : {})
    });
    defineType("NewExpression", {
      inherits: "CallExpression",
      fields: {
        callee: {
          validate: (0, _utils.assertNodeType)("Expression")
        },
        arguments: (0, _utils.validateArrayOfType)("Expression", "SpreadElement", "ArgumentPlaceholder"),
        typeArguments: {
          validate: (0, _utils.assertNodeType)("TypeParameterInstantiation", "TSTypeParameterInstantiation"),
          optional: true
        }
      }
    });
    defineType("Program", {
      visitor: ["directives", "body"],
      builder: ["body", "directives", "sourceType", "interpreter"],
      fields: {
        sourceType: {
          validate: (0, _utils.assertOneOf)("script", "module"),
          default: "script"
        },
        interpreter: {
          validate: (0, _utils.assertNodeType)("InterpreterDirective"),
          default: null,
          optional: true
        },
        directives: {
          validate: (0, _utils.arrayOfType)("Directive"),
          default: []
        },
        body: (0, _utils.validateArrayOfType)("Statement")
      },
      aliases: ["Scopable", "BlockParent", "Block"]
    });
    defineType("ObjectExpression", {
      visitor: ["properties"],
      aliases: ["Expression"],
      fields: {
        properties: (0, _utils.validateArrayOfType)("ObjectMethod", "ObjectProperty", "SpreadElement")
      }
    });
    defineType("ObjectMethod", Object.assign({
      builder: ["kind", "key", "params", "body", "computed", "generator", "async"],
      visitor: ["decorators", "key", "typeParameters", "params", "returnType", "body"]
    }, classMethodOrPropertyUnionShapeCommon(), {
      fields: Object.assign({}, functionCommon(), functionTypeAnnotationCommon(), {
        kind: Object.assign({
          validate: (0, _utils.assertOneOf)("method", "get", "set")
        }, !process.env.BABEL_TYPES_8_BREAKING ? {
          default: "method"
        } : {}),
        computed: {
          default: false
        },
        key: {
          validate: (function() {
            const normal = (0, _utils.assertNodeType)("Identifier", "StringLiteral", "NumericLiteral", "BigIntLiteral");
            const computed = (0, _utils.assertNodeType)("Expression");
            const validator = function(node, key, val) {
              const validator2 = node.computed ? computed : normal;
              validator2(node, key, val);
            };
            validator.oneOfNodeTypes = ["Expression", "Identifier", "StringLiteral", "NumericLiteral", "BigIntLiteral"];
            return validator;
          })()
        },
        decorators: {
          validate: (0, _utils.arrayOfType)("Decorator"),
          optional: true
        },
        body: {
          validate: (0, _utils.assertNodeType)("BlockStatement")
        }
      }),
      aliases: ["UserWhitespacable", "Function", "Scopable", "BlockParent", "FunctionParent", "Method", "ObjectMember"]
    }));
    defineType("ObjectProperty", {
      builder: ["key", "value", "computed", "shorthand", ...!process.env.BABEL_TYPES_8_BREAKING ? ["decorators"] : []],
      unionShape: {
        discriminator: "computed",
        shapes: [{
          name: "computed",
          value: [true],
          properties: {
            key: {
              validate: (0, _utils.assertNodeType)("Expression")
            }
          }
        }, {
          name: "nonComputed",
          value: [false],
          properties: {
            key: {
              validate: (0, _utils.assertNodeType)("Identifier", "StringLiteral", "NumericLiteral", "BigIntLiteral", "DecimalLiteral", "PrivateName")
            }
          }
        }]
      },
      fields: {
        computed: {
          default: false
        },
        key: {
          validate: (function() {
            const normal = (0, _utils.assertNodeType)("Identifier", "StringLiteral", "NumericLiteral", "BigIntLiteral", "DecimalLiteral", "PrivateName");
            const computed = (0, _utils.assertNodeType)("Expression");
            const validator = Object.assign(function(node, key, val) {
              const validator2 = node.computed ? computed : normal;
              validator2(node, key, val);
            }, {
              oneOfNodeTypes: ["Expression", "Identifier", "StringLiteral", "NumericLiteral", "BigIntLiteral", "DecimalLiteral", "PrivateName"]
            });
            return validator;
          })()
        },
        value: {
          validate: (0, _utils.assertNodeType)("Expression", "PatternLike")
        },
        shorthand: {
          validate: process.env.BABEL_TYPES_8_BREAKING ? (0, _utils.chain)((0, _utils.assertValueType)("boolean"), Object.assign(function(node, key, shorthand) {
            if (!shorthand) return;
            if (node.computed) {
              throw new TypeError("Property shorthand of ObjectProperty cannot be true if computed is true");
            }
            if (!(0, _is.default)("Identifier", node.key)) {
              throw new TypeError("Property shorthand of ObjectProperty cannot be true if key is not an Identifier");
            }
          }, {
            type: "boolean"
          })) : (0, _utils.assertValueType)("boolean"),
          default: false
        },
        decorators: {
          validate: (0, _utils.arrayOfType)("Decorator"),
          optional: true
        }
      },
      visitor: ["decorators", "key", "value"],
      aliases: ["UserWhitespacable", "Property", "ObjectMember"],
      validate: !process.env.BABEL_TYPES_8_BREAKING ? void 0 : (function() {
        const pattern = (0, _utils.assertNodeType)("Identifier", "Pattern", "TSAsExpression", "TSSatisfiesExpression", "TSNonNullExpression", "TSTypeAssertion");
        const expression = (0, _utils.assertNodeType)("Expression");
        return function(parent, key, node) {
          const validator = (0, _is.default)("ObjectPattern", parent) ? pattern : expression;
          validator(node, "value", node.value);
        };
      })()
    });
    defineType("RestElement", {
      visitor: ["argument", "typeAnnotation"],
      builder: ["argument"],
      aliases: ["FunctionParameter", "PatternLike", "LVal"],
      deprecatedAlias: "RestProperty",
      fields: Object.assign({}, patternLikeCommon(), {
        argument: {
          validate: !process.env.BABEL_TYPES_8_BREAKING ? (0, _utils.assertNodeType)("Identifier", "ArrayPattern", "ObjectPattern", "MemberExpression", "TSAsExpression", "TSSatisfiesExpression", "TSTypeAssertion", "TSNonNullExpression", "RestElement", "AssignmentPattern") : (0, _utils.assertNodeType)("Identifier", "ArrayPattern", "ObjectPattern", "MemberExpression", "TSAsExpression", "TSSatisfiesExpression", "TSTypeAssertion", "TSNonNullExpression")
        }
      }),
      validate: process.env.BABEL_TYPES_8_BREAKING ? function(parent, key) {
        const match = /(\w+)\[(\d+)\]/.exec(key.toString());
        if (!match) throw new Error("Internal Babel error: malformed key.");
        const [, listKey, index] = match;
        if (parent[listKey].length > +index + 1) {
          throw new TypeError(`RestElement must be last element of ${listKey}`);
        }
      } : void 0
    });
    defineType("ReturnStatement", {
      visitor: ["argument"],
      aliases: ["Statement", "Terminatorless", "CompletionStatement"],
      fields: {
        argument: {
          validate: (0, _utils.assertNodeType)("Expression"),
          optional: true
        }
      }
    });
    defineType("SequenceExpression", {
      visitor: ["expressions"],
      fields: {
        expressions: (0, _utils.validateArrayOfType)("Expression")
      },
      aliases: ["Expression"]
    });
    defineType("ParenthesizedExpression", {
      visitor: ["expression"],
      aliases: ["Expression", "ExpressionWrapper"],
      fields: {
        expression: {
          validate: (0, _utils.assertNodeType)("Expression")
        }
      }
    });
    defineType("SwitchCase", {
      visitor: ["test", "consequent"],
      fields: {
        test: {
          validate: (0, _utils.assertNodeType)("Expression"),
          optional: true
        },
        consequent: (0, _utils.validateArrayOfType)("Statement")
      }
    });
    defineType("SwitchStatement", {
      visitor: ["discriminant", "cases"],
      aliases: ["Statement", "BlockParent", "Scopable"],
      fields: {
        discriminant: {
          validate: (0, _utils.assertNodeType)("Expression")
        },
        cases: (0, _utils.validateArrayOfType)("SwitchCase")
      }
    });
    defineType("ThisExpression", {
      aliases: ["Expression"]
    });
    defineType("ThrowStatement", {
      visitor: ["argument"],
      aliases: ["Statement", "Terminatorless", "CompletionStatement"],
      fields: {
        argument: {
          validate: (0, _utils.assertNodeType)("Expression")
        }
      }
    });
    defineType("TryStatement", {
      visitor: ["block", "handler", "finalizer"],
      aliases: ["Statement"],
      fields: {
        block: {
          validate: process.env.BABEL_TYPES_8_BREAKING ? (0, _utils.chain)((0, _utils.assertNodeType)("BlockStatement"), Object.assign(function(node) {
            if (!node.handler && !node.finalizer) {
              throw new TypeError("TryStatement expects either a handler or finalizer, or both");
            }
          }, {
            oneOfNodeTypes: ["BlockStatement"]
          })) : (0, _utils.assertNodeType)("BlockStatement")
        },
        handler: {
          optional: true,
          validate: (0, _utils.assertNodeType)("CatchClause")
        },
        finalizer: {
          optional: true,
          validate: (0, _utils.assertNodeType)("BlockStatement")
        }
      }
    });
    defineType("UnaryExpression", {
      builder: ["operator", "argument", "prefix"],
      fields: {
        prefix: {
          default: true
        },
        argument: {
          validate: (0, _utils.assertNodeType)("Expression")
        },
        operator: {
          validate: (0, _utils.assertOneOf)(..._index.UNARY_OPERATORS)
        }
      },
      visitor: ["argument"],
      aliases: ["UnaryLike", "Expression"]
    });
    defineType("UpdateExpression", {
      builder: ["operator", "argument", "prefix"],
      fields: {
        prefix: {
          default: false
        },
        argument: {
          validate: !process.env.BABEL_TYPES_8_BREAKING ? (0, _utils.assertNodeType)("Expression") : (0, _utils.assertNodeType)("Identifier", "MemberExpression")
        },
        operator: {
          validate: (0, _utils.assertOneOf)(..._index.UPDATE_OPERATORS)
        }
      },
      visitor: ["argument"],
      aliases: ["Expression"]
    });
    defineType("VariableDeclaration", {
      builder: ["kind", "declarations"],
      visitor: ["declarations"],
      aliases: ["Statement", "Declaration"],
      fields: {
        declare: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        },
        kind: {
          validate: (0, _utils.assertOneOf)("var", "let", "const", "using", "await using")
        },
        declarations: (0, _utils.validateArrayOfType)("VariableDeclarator")
      },
      validate: process.env.BABEL_TYPES_8_BREAKING ? (() => {
        const withoutInit = (0, _utils.assertNodeType)("Identifier", "Placeholder");
        const constOrLetOrVar = (0, _utils.assertNodeType)("Identifier", "ArrayPattern", "ObjectPattern", "Placeholder");
        const usingOrAwaitUsing = (0, _utils.assertNodeType)("Identifier", "VoidPattern", "Placeholder");
        return function(parent, key, node) {
          const {
            kind,
            declarations
          } = node;
          const parentIsForX = (0, _is.default)("ForXStatement", parent, {
            left: node
          });
          if (parentIsForX) {
            if (declarations.length !== 1) {
              throw new TypeError(`Exactly one VariableDeclarator is required in the VariableDeclaration of a ${parent.type}`);
            }
          }
          for (const decl of declarations) {
            if (kind === "const" || kind === "let" || kind === "var") {
              if (!parentIsForX && !decl.init) {
                withoutInit(decl, "id", decl.id);
              } else {
                constOrLetOrVar(decl, "id", decl.id);
              }
            } else {
              usingOrAwaitUsing(decl, "id", decl.id);
            }
          }
        };
      })() : void 0
    });
    defineType("VariableDeclarator", {
      visitor: ["id", "init"],
      fields: {
        id: {
          validate: !process.env.BABEL_TYPES_8_BREAKING ? (0, _utils.assertNodeType)("LVal", "VoidPattern") : (0, _utils.assertNodeType)("Identifier", "ArrayPattern", "ObjectPattern", "VoidPattern")
        },
        definite: {
          optional: true,
          validate: (0, _utils.assertValueType)("boolean")
        },
        init: {
          optional: true,
          validate: (0, _utils.assertNodeType)("Expression")
        }
      }
    });
    defineType("WhileStatement", {
      visitor: ["test", "body"],
      aliases: ["Statement", "BlockParent", "Loop", "While", "Scopable"],
      fields: {
        test: {
          validate: (0, _utils.assertNodeType)("Expression")
        },
        body: {
          validate: (0, _utils.assertNodeType)("Statement")
        }
      }
    });
    defineType("WithStatement", {
      visitor: ["object", "body"],
      aliases: ["Statement"],
      fields: {
        object: {
          validate: (0, _utils.assertNodeType)("Expression")
        },
        body: {
          validate: (0, _utils.assertNodeType)("Statement")
        }
      }
    });
    defineType("AssignmentPattern", {
      visitor: ["left", "right", "decorators"],
      builder: ["left", "right"],
      aliases: ["FunctionParameter", "Pattern", "PatternLike", "LVal"],
      fields: Object.assign({}, patternLikeCommon(), {
        left: {
          validate: (0, _utils.assertNodeType)("Identifier", "ObjectPattern", "ArrayPattern", "MemberExpression", "TSAsExpression", "TSSatisfiesExpression", "TSTypeAssertion", "TSNonNullExpression")
        },
        right: {
          validate: (0, _utils.assertNodeType)("Expression")
        },
        decorators: {
          validate: (0, _utils.arrayOfType)("Decorator"),
          optional: true
        }
      })
    });
    defineType("ArrayPattern", {
      visitor: ["elements", "typeAnnotation"],
      builder: ["elements"],
      aliases: ["FunctionParameter", "Pattern", "PatternLike", "LVal"],
      fields: Object.assign({}, patternLikeCommon(), {
        elements: {
          validate: (0, _utils.chain)((0, _utils.assertValueType)("array"), (0, _utils.assertEach)((0, _utils.assertNodeOrValueType)("null", "PatternLike")))
        }
      })
    });
    defineType("ArrowFunctionExpression", {
      builder: ["params", "body", "async"],
      visitor: ["typeParameters", "params", "predicate", "returnType", "body"],
      aliases: ["Scopable", "Function", "BlockParent", "FunctionParent", "Expression", "Pureish"],
      fields: Object.assign({}, functionCommon(), functionTypeAnnotationCommon(), {
        expression: {
          validate: (0, _utils.assertValueType)("boolean")
        },
        body: {
          validate: (0, _utils.assertNodeType)("BlockStatement", "Expression")
        },
        predicate: {
          validate: (0, _utils.assertNodeType)("DeclaredPredicate", "InferredPredicate"),
          optional: true
        }
      })
    });
    defineType("ClassBody", {
      visitor: ["body"],
      fields: {
        body: (0, _utils.validateArrayOfType)("ClassMethod", "ClassPrivateMethod", "ClassProperty", "ClassPrivateProperty", "ClassAccessorProperty", "TSDeclareMethod", "TSIndexSignature", "StaticBlock")
      }
    });
    defineType("ClassExpression", {
      builder: ["id", "superClass", "body", "decorators"],
      visitor: ["decorators", "id", "typeParameters", "superClass", "superTypeParameters", "mixins", "implements", "body"],
      aliases: ["Scopable", "Class", "Expression"],
      fields: {
        id: {
          validate: (0, _utils.assertNodeType)("Identifier"),
          optional: true
        },
        typeParameters: {
          validate: (0, _utils.assertNodeType)("TypeParameterDeclaration", "TSTypeParameterDeclaration", "Noop"),
          optional: true
        },
        body: {
          validate: (0, _utils.assertNodeType)("ClassBody")
        },
        superClass: {
          optional: true,
          validate: (0, _utils.assertNodeType)("Expression")
        },
        ["superTypeParameters"]: {
          validate: (0, _utils.assertNodeType)("TypeParameterInstantiation", "TSTypeParameterInstantiation"),
          optional: true
        },
        implements: {
          validate: (0, _utils.arrayOfType)("TSExpressionWithTypeArguments", "ClassImplements"),
          optional: true
        },
        decorators: {
          validate: (0, _utils.arrayOfType)("Decorator"),
          optional: true
        },
        mixins: {
          validate: (0, _utils.assertNodeType)("InterfaceExtends"),
          optional: true
        }
      }
    });
    defineType("ClassDeclaration", {
      inherits: "ClassExpression",
      aliases: ["Scopable", "Class", "Statement", "Declaration"],
      fields: {
        id: {
          validate: (0, _utils.assertNodeType)("Identifier"),
          optional: true
        },
        typeParameters: {
          validate: (0, _utils.assertNodeType)("TypeParameterDeclaration", "TSTypeParameterDeclaration", "Noop"),
          optional: true
        },
        body: {
          validate: (0, _utils.assertNodeType)("ClassBody")
        },
        superClass: {
          optional: true,
          validate: (0, _utils.assertNodeType)("Expression")
        },
        ["superTypeParameters"]: {
          validate: (0, _utils.assertNodeType)("TypeParameterInstantiation", "TSTypeParameterInstantiation"),
          optional: true
        },
        implements: {
          validate: (0, _utils.arrayOfType)("TSExpressionWithTypeArguments", "ClassImplements"),
          optional: true
        },
        decorators: {
          validate: (0, _utils.arrayOfType)("Decorator"),
          optional: true
        },
        mixins: {
          validate: (0, _utils.assertNodeType)("InterfaceExtends"),
          optional: true
        },
        declare: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        },
        abstract: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        }
      },
      validate: !process.env.BABEL_TYPES_8_BREAKING ? void 0 : (function() {
        const identifier = (0, _utils.assertNodeType)("Identifier");
        return function(parent, key, node) {
          if (!(0, _is.default)("ExportDefaultDeclaration", parent)) {
            identifier(node, "id", node.id);
          }
        };
      })()
    });
    var importAttributes = exports.importAttributes = {
      attributes: {
        optional: true,
        validate: (0, _utils.arrayOfType)("ImportAttribute")
      }
    };
    importAttributes.assertions = {
      deprecated: true,
      optional: true,
      validate: (0, _utils.arrayOfType)("ImportAttribute")
    };
    defineType("ExportAllDeclaration", {
      builder: ["source", "attributes"],
      visitor: ["source", "attributes", "assertions"],
      aliases: ["Statement", "Declaration", "ImportOrExportDeclaration", "ExportDeclaration"],
      fields: Object.assign({
        source: {
          validate: (0, _utils.assertNodeType)("StringLiteral")
        },
        exportKind: (0, _utils.validateOptional)((0, _utils.assertOneOf)("type", "value"))
      }, importAttributes)
    });
    defineType("ExportDefaultDeclaration", {
      visitor: ["declaration"],
      aliases: ["Statement", "Declaration", "ImportOrExportDeclaration", "ExportDeclaration"],
      fields: {
        declaration: (0, _utils.validateType)("TSDeclareFunction", "FunctionDeclaration", "ClassDeclaration", "Expression"),
        exportKind: (0, _utils.validateOptional)((0, _utils.assertOneOf)("value"))
      }
    });
    defineType("ExportNamedDeclaration", {
      builder: ["declaration", "specifiers", "source", "attributes"],
      visitor: ["declaration", "specifiers", "source", "attributes", "assertions"],
      aliases: ["Statement", "Declaration", "ImportOrExportDeclaration", "ExportDeclaration"],
      fields: Object.assign({
        declaration: {
          optional: true,
          validate: process.env.BABEL_TYPES_8_BREAKING ? (0, _utils.chain)((0, _utils.assertNodeType)("Declaration"), Object.assign(function(node, key, val) {
            if (val && node.specifiers.length) {
              throw new TypeError("Only declaration or specifiers is allowed on ExportNamedDeclaration");
            }
            if (val && node.source) {
              throw new TypeError("Cannot export a declaration from a source");
            }
          }, {
            oneOfNodeTypes: ["Declaration"]
          })) : (0, _utils.assertNodeType)("Declaration")
        }
      }, importAttributes, {
        specifiers: {
          default: [],
          validate: (0, _utils.arrayOf)((function() {
            const sourced = (0, _utils.assertNodeType)("ExportSpecifier", "ExportDefaultSpecifier", "ExportNamespaceSpecifier");
            const sourceless = (0, _utils.assertNodeType)("ExportSpecifier");
            if (!process.env.BABEL_TYPES_8_BREAKING) return sourced;
            return Object.assign(function(node, key, val) {
              const validator = node.source ? sourced : sourceless;
              validator(node, key, val);
            }, {
              oneOfNodeTypes: ["ExportSpecifier", "ExportDefaultSpecifier", "ExportNamespaceSpecifier"]
            });
          })())
        },
        source: {
          validate: (0, _utils.assertNodeType)("StringLiteral"),
          optional: true
        },
        exportKind: (0, _utils.validateOptional)((0, _utils.assertOneOf)("type", "value"))
      })
    });
    defineType("ExportSpecifier", {
      visitor: ["local", "exported"],
      aliases: ["ModuleSpecifier"],
      fields: {
        local: {
          validate: (0, _utils.assertNodeType)("Identifier")
        },
        exported: {
          validate: (0, _utils.assertNodeType)("Identifier", "StringLiteral")
        },
        exportKind: {
          validate: (0, _utils.assertOneOf)("type", "value"),
          optional: true
        }
      }
    });
    defineType("ForOfStatement", {
      visitor: ["left", "right", "body"],
      builder: ["left", "right", "body", "await"],
      aliases: ["Scopable", "Statement", "For", "BlockParent", "Loop", "ForXStatement"],
      fields: {
        left: {
          validate: (function() {
            if (!process.env.BABEL_TYPES_8_BREAKING) {
              return (0, _utils.assertNodeType)("VariableDeclaration", "LVal");
            }
            const declaration = (0, _utils.assertNodeType)("VariableDeclaration");
            const lval = (0, _utils.assertNodeType)("Identifier", "MemberExpression", "ArrayPattern", "ObjectPattern", "TSAsExpression", "TSSatisfiesExpression", "TSTypeAssertion", "TSNonNullExpression");
            return Object.assign(function(node, key, val) {
              if ((0, _is.default)("VariableDeclaration", val)) {
                declaration(node, key, val);
              } else {
                lval(node, key, val);
              }
            }, {
              oneOfNodeTypes: ["VariableDeclaration", "Identifier", "MemberExpression", "ArrayPattern", "ObjectPattern", "TSAsExpression", "TSSatisfiesExpression", "TSTypeAssertion", "TSNonNullExpression"]
            });
          })()
        },
        right: {
          validate: (0, _utils.assertNodeType)("Expression")
        },
        body: {
          validate: (0, _utils.assertNodeType)("Statement")
        },
        await: {
          default: false
        }
      }
    });
    defineType("ImportDeclaration", {
      builder: ["specifiers", "source", "attributes"],
      visitor: ["specifiers", "source", "attributes", "assertions"],
      aliases: ["Statement", "Declaration", "ImportOrExportDeclaration"],
      fields: Object.assign({}, importAttributes, {
        module: {
          optional: true,
          validate: (0, _utils.assertValueType)("boolean")
        },
        phase: {
          default: null,
          validate: (0, _utils.assertOneOf)("source", "defer")
        },
        specifiers: (0, _utils.validateArrayOfType)("ImportSpecifier", "ImportDefaultSpecifier", "ImportNamespaceSpecifier"),
        source: {
          validate: (0, _utils.assertNodeType)("StringLiteral")
        },
        importKind: {
          validate: (0, _utils.assertOneOf)("type", "typeof", "value"),
          optional: true
        }
      })
    });
    defineType("ImportDefaultSpecifier", {
      visitor: ["local"],
      aliases: ["ModuleSpecifier"],
      fields: {
        local: {
          validate: (0, _utils.assertNodeType)("Identifier")
        }
      }
    });
    defineType("ImportNamespaceSpecifier", {
      visitor: ["local"],
      aliases: ["ModuleSpecifier"],
      fields: {
        local: {
          validate: (0, _utils.assertNodeType)("Identifier")
        }
      }
    });
    defineType("ImportSpecifier", {
      visitor: ["imported", "local"],
      builder: ["local", "imported"],
      aliases: ["ModuleSpecifier"],
      fields: {
        local: {
          validate: (0, _utils.assertNodeType)("Identifier")
        },
        imported: {
          validate: (0, _utils.assertNodeType)("Identifier", "StringLiteral")
        },
        importKind: {
          validate: (0, _utils.assertOneOf)("type", "typeof", "value"),
          optional: true
        }
      }
    });
    defineType("ImportExpression", {
      visitor: ["source", "options"],
      aliases: ["Expression"],
      fields: {
        phase: {
          default: null,
          validate: (0, _utils.assertOneOf)("source", "defer")
        },
        source: {
          validate: (0, _utils.assertNodeType)("Expression")
        },
        options: {
          validate: (0, _utils.assertNodeType)("Expression"),
          optional: true
        }
      }
    });
    defineType("MetaProperty", {
      visitor: ["meta", "property"],
      aliases: ["Expression"],
      fields: {
        meta: {
          validate: process.env.BABEL_TYPES_8_BREAKING ? (0, _utils.chain)((0, _utils.assertNodeType)("Identifier"), Object.assign(function(node, key, val) {
            let property;
            switch (val.name) {
              case "function":
                property = "sent";
                break;
              case "new":
                property = "target";
                break;
              case "import":
                property = "meta";
                break;
            }
            if (!(0, _is.default)("Identifier", node.property, {
              name: property
            })) {
              throw new TypeError("Unrecognised MetaProperty");
            }
          }, {
            oneOfNodeTypes: ["Identifier"]
          })) : (0, _utils.assertNodeType)("Identifier")
        },
        property: {
          validate: (0, _utils.assertNodeType)("Identifier")
        }
      }
    });
    var classMethodOrPropertyCommon = () => ({
      abstract: {
        validate: (0, _utils.assertValueType)("boolean"),
        optional: true
      },
      accessibility: {
        validate: (0, _utils.assertOneOf)("public", "private", "protected"),
        optional: true
      },
      static: {
        default: false
      },
      override: {
        default: false
      },
      computed: {
        default: false
      },
      optional: {
        validate: (0, _utils.assertValueType)("boolean"),
        optional: true
      },
      key: {
        validate: (0, _utils.chain)((function() {
          const normal = (0, _utils.assertNodeType)("Identifier", "StringLiteral", "NumericLiteral", "BigIntLiteral");
          const computed = (0, _utils.assertNodeType)("Expression");
          return function(node, key, val) {
            const validator = node.computed ? computed : normal;
            validator(node, key, val);
          };
        })(), (0, _utils.assertNodeType)("Identifier", "StringLiteral", "NumericLiteral", "BigIntLiteral", "Expression"))
      }
    });
    exports.classMethodOrPropertyCommon = classMethodOrPropertyCommon;
    var classMethodOrDeclareMethodCommon = () => Object.assign({}, functionCommon(), classMethodOrPropertyCommon(), {
      params: (0, _utils.validateArrayOfType)("FunctionParameter", "TSParameterProperty"),
      kind: {
        validate: (0, _utils.assertOneOf)("get", "set", "method", "constructor"),
        default: "method"
      },
      access: {
        validate: (0, _utils.chain)((0, _utils.assertValueType)("string"), (0, _utils.assertOneOf)("public", "private", "protected")),
        optional: true
      },
      decorators: {
        validate: (0, _utils.arrayOfType)("Decorator"),
        optional: true
      }
    });
    exports.classMethodOrDeclareMethodCommon = classMethodOrDeclareMethodCommon;
    defineType("ClassMethod", Object.assign({
      aliases: ["Function", "Scopable", "BlockParent", "FunctionParent", "Method"],
      builder: ["kind", "key", "params", "body", "computed", "static", "generator", "async"],
      visitor: ["decorators", "key", "typeParameters", "params", "returnType", "body"]
    }, classMethodOrPropertyUnionShapeCommon(), {
      fields: Object.assign({}, classMethodOrDeclareMethodCommon(), functionTypeAnnotationCommon(), {
        body: {
          validate: (0, _utils.assertNodeType)("BlockStatement")
        }
      })
    }));
    defineType("ObjectPattern", {
      visitor: ["decorators", "properties", "typeAnnotation"],
      builder: ["properties"],
      aliases: ["FunctionParameter", "Pattern", "PatternLike", "LVal"],
      fields: Object.assign({}, patternLikeCommon(), {
        properties: (0, _utils.validateArrayOfType)("RestElement", "ObjectProperty")
      })
    });
    defineType("SpreadElement", {
      visitor: ["argument"],
      aliases: ["UnaryLike"],
      deprecatedAlias: "SpreadProperty",
      fields: {
        argument: {
          validate: (0, _utils.assertNodeType)("Expression")
        }
      }
    });
    defineType("Super", {
      aliases: ["Expression"]
    });
    defineType("TaggedTemplateExpression", {
      visitor: ["tag", "typeParameters", "quasi"],
      builder: ["tag", "quasi"],
      aliases: ["Expression"],
      fields: {
        tag: {
          validate: (0, _utils.assertNodeType)("Expression")
        },
        quasi: {
          validate: (0, _utils.assertNodeType)("TemplateLiteral")
        },
        ["typeParameters"]: {
          validate: (0, _utils.assertNodeType)("TypeParameterInstantiation", "TSTypeParameterInstantiation"),
          optional: true
        }
      }
    });
    defineType("TemplateElement", {
      builder: ["value", "tail"],
      fields: {
        value: {
          validate: (0, _utils.chain)((0, _utils.assertShape)({
            raw: {
              validate: (0, _utils.assertValueType)("string")
            },
            cooked: {
              validate: (0, _utils.assertValueType)("string"),
              optional: true
            }
          }), function templateElementCookedValidator(node) {
            const raw = node.value.raw;
            let unterminatedCalled = false;
            const error = () => {
              throw new Error("Internal @babel/types error.");
            };
            const {
              str,
              firstInvalidLoc
            } = (0, _helperStringParser.readStringContents)("template", raw, 0, 0, 0, {
              unterminated() {
                unterminatedCalled = true;
              },
              strictNumericEscape: error,
              invalidEscapeSequence: error,
              numericSeparatorInEscapeSequence: error,
              unexpectedNumericSeparator: error,
              invalidDigit: error,
              invalidCodePoint: error
            });
            if (!unterminatedCalled) throw new Error("Invalid raw");
            node.value.cooked = firstInvalidLoc ? null : str;
          })
        },
        tail: {
          default: false
        }
      }
    });
    defineType("TemplateLiteral", {
      visitor: ["quasis", "expressions"],
      aliases: ["Expression", "Literal"],
      fields: {
        quasis: (0, _utils.validateArrayOfType)("TemplateElement"),
        expressions: {
          validate: (0, _utils.chain)((0, _utils.assertValueType)("array"), (0, _utils.assertEach)((0, _utils.assertNodeType)("Expression", "TSType")), function(node, key, val) {
            if (node.quasis.length !== val.length + 1) {
              throw new TypeError(`Number of ${node.type} quasis should be exactly one more than the number of expressions.
Expected ${val.length + 1} quasis but got ${node.quasis.length}`);
            }
          })
        }
      }
    });
    defineType("YieldExpression", {
      builder: ["argument", "delegate"],
      visitor: ["argument"],
      aliases: ["Expression", "Terminatorless"],
      fields: {
        delegate: {
          validate: process.env.BABEL_TYPES_8_BREAKING ? (0, _utils.chain)((0, _utils.assertValueType)("boolean"), Object.assign(function(node, key, val) {
            if (val && !node.argument) {
              throw new TypeError("Property delegate of YieldExpression cannot be true if there is no argument");
            }
          }, {
            type: "boolean"
          })) : (0, _utils.assertValueType)("boolean"),
          default: false
        },
        argument: {
          optional: true,
          validate: (0, _utils.assertNodeType)("Expression")
        }
      }
    });
    defineType("AwaitExpression", {
      builder: ["argument"],
      visitor: ["argument"],
      aliases: ["Expression", "Terminatorless"],
      fields: {
        argument: {
          validate: (0, _utils.assertNodeType)("Expression")
        }
      }
    });
    defineType("Import", {
      aliases: ["Expression"]
    });
    defineType("BigIntLiteral", {
      builder: ["value"],
      fields: {
        value: {
          validate: (0, _utils.assertValueType)("string")
        }
      },
      aliases: ["Expression", "Pureish", "Literal", "Immutable"]
    });
    defineType("ExportNamespaceSpecifier", {
      visitor: ["exported"],
      aliases: ["ModuleSpecifier"],
      fields: {
        exported: {
          validate: (0, _utils.assertNodeType)("Identifier")
        }
      }
    });
    defineType("OptionalMemberExpression", {
      builder: ["object", "property", "computed", "optional"],
      visitor: ["object", "property"],
      aliases: ["Expression"],
      fields: {
        object: {
          validate: (0, _utils.assertNodeType)("Expression")
        },
        property: {
          validate: (function() {
            const normal = (0, _utils.assertNodeType)("Identifier");
            const computed = (0, _utils.assertNodeType)("Expression");
            const validator = Object.assign(function(node, key, val) {
              const validator2 = node.computed ? computed : normal;
              validator2(node, key, val);
            }, {
              oneOfNodeTypes: ["Expression", "Identifier"]
            });
            return validator;
          })()
        },
        computed: {
          default: false
        },
        optional: {
          validate: !process.env.BABEL_TYPES_8_BREAKING ? (0, _utils.assertValueType)("boolean") : (0, _utils.chain)((0, _utils.assertValueType)("boolean"), (0, _utils.assertOptionalChainStart)())
        }
      }
    });
    defineType("OptionalCallExpression", {
      visitor: ["callee", "typeParameters", "typeArguments", "arguments"],
      builder: ["callee", "arguments", "optional"],
      aliases: ["Expression"],
      fields: Object.assign({
        callee: {
          validate: (0, _utils.assertNodeType)("Expression")
        },
        arguments: (0, _utils.validateArrayOfType)("Expression", "SpreadElement", "ArgumentPlaceholder"),
        optional: {
          validate: !process.env.BABEL_TYPES_8_BREAKING ? (0, _utils.assertValueType)("boolean") : (0, _utils.chain)((0, _utils.assertValueType)("boolean"), (0, _utils.assertOptionalChainStart)())
        },
        typeArguments: {
          validate: (0, _utils.assertNodeType)("TypeParameterInstantiation"),
          optional: true
        }
      }, {
        typeParameters: {
          validate: (0, _utils.assertNodeType)("TSTypeParameterInstantiation"),
          optional: true
        }
      })
    });
    defineType("ClassProperty", Object.assign({
      visitor: ["decorators", "variance", "key", "typeAnnotation", "value"],
      builder: ["key", "value", "typeAnnotation", "decorators", "computed", "static"],
      aliases: ["Property"]
    }, classMethodOrPropertyUnionShapeCommon(), {
      fields: Object.assign({}, classMethodOrPropertyCommon(), {
        value: {
          validate: (0, _utils.assertNodeType)("Expression"),
          optional: true
        },
        definite: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        },
        typeAnnotation: {
          validate: (0, _utils.assertNodeType)("TypeAnnotation", "TSTypeAnnotation", "Noop"),
          optional: true
        },
        decorators: {
          validate: (0, _utils.arrayOfType)("Decorator"),
          optional: true
        },
        readonly: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        },
        declare: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        },
        variance: {
          validate: (0, _utils.assertNodeType)("Variance"),
          optional: true
        }
      })
    }));
    defineType("ClassAccessorProperty", Object.assign({
      visitor: ["decorators", "key", "typeAnnotation", "value"],
      builder: ["key", "value", "typeAnnotation", "decorators", "computed", "static"],
      aliases: ["Property", "Accessor"]
    }, classMethodOrPropertyUnionShapeCommon(true), {
      fields: Object.assign({}, classMethodOrPropertyCommon(), {
        key: {
          validate: (0, _utils.chain)((function() {
            const normal = (0, _utils.assertNodeType)("Identifier", "StringLiteral", "NumericLiteral", "BigIntLiteral", "PrivateName");
            const computed = (0, _utils.assertNodeType)("Expression");
            return function(node, key, val) {
              const validator = node.computed ? computed : normal;
              validator(node, key, val);
            };
          })(), (0, _utils.assertNodeType)("Identifier", "StringLiteral", "NumericLiteral", "BigIntLiteral", "Expression", "PrivateName"))
        },
        value: {
          validate: (0, _utils.assertNodeType)("Expression"),
          optional: true
        },
        definite: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        },
        typeAnnotation: {
          validate: (0, _utils.assertNodeType)("TypeAnnotation", "TSTypeAnnotation", "Noop"),
          optional: true
        },
        decorators: {
          validate: (0, _utils.arrayOfType)("Decorator"),
          optional: true
        },
        readonly: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        },
        declare: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        },
        variance: {
          validate: (0, _utils.assertNodeType)("Variance"),
          optional: true
        }
      })
    }));
    defineType("ClassPrivateProperty", {
      visitor: ["decorators", "variance", "key", "typeAnnotation", "value"],
      builder: ["key", "value", "decorators", "static"],
      aliases: ["Property", "Private"],
      fields: {
        key: {
          validate: (0, _utils.assertNodeType)("PrivateName")
        },
        value: {
          validate: (0, _utils.assertNodeType)("Expression"),
          optional: true
        },
        typeAnnotation: {
          validate: (0, _utils.assertNodeType)("TypeAnnotation", "TSTypeAnnotation", "Noop"),
          optional: true
        },
        decorators: {
          validate: (0, _utils.arrayOfType)("Decorator"),
          optional: true
        },
        static: {
          validate: (0, _utils.assertValueType)("boolean"),
          default: false
        },
        readonly: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        },
        optional: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        },
        definite: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        },
        variance: {
          validate: (0, _utils.assertNodeType)("Variance"),
          optional: true
        }
      }
    });
    defineType("ClassPrivateMethod", {
      builder: ["kind", "key", "params", "body", "static"],
      visitor: ["decorators", "key", "typeParameters", "params", "returnType", "body"],
      aliases: ["Function", "Scopable", "BlockParent", "FunctionParent", "Method", "Private"],
      fields: Object.assign({}, classMethodOrDeclareMethodCommon(), functionTypeAnnotationCommon(), {
        kind: {
          validate: (0, _utils.assertOneOf)("get", "set", "method"),
          default: "method"
        },
        key: {
          validate: (0, _utils.assertNodeType)("PrivateName")
        },
        body: {
          validate: (0, _utils.assertNodeType)("BlockStatement")
        }
      })
    });
    defineType("PrivateName", {
      visitor: ["id"],
      aliases: ["Private"],
      fields: {
        id: {
          validate: (0, _utils.assertNodeType)("Identifier")
        }
      }
    });
    defineType("StaticBlock", {
      visitor: ["body"],
      fields: {
        body: (0, _utils.validateArrayOfType)("Statement")
      },
      aliases: ["Scopable", "BlockParent", "FunctionParent"]
    });
    defineType("ImportAttribute", {
      visitor: ["key", "value"],
      fields: {
        key: {
          validate: (0, _utils.assertNodeType)("Identifier", "StringLiteral")
        },
        value: {
          validate: (0, _utils.assertNodeType)("StringLiteral")
        }
      }
    });
  }
});

// ../node_modules/@babel/types/lib/definitions/flow.js
var require_flow = __commonJS({
  "../node_modules/@babel/types/lib/definitions/flow.js"() {
    "use strict";
    var _core = require_core();
    var _utils = require_utils();
    var defineType = (0, _utils.defineAliasedType)("Flow");
    var defineInterfaceishType = (name) => {
      const isDeclareClass = name === "DeclareClass";
      defineType(name, {
        builder: ["id", "typeParameters", "extends", "body"],
        visitor: ["id", "typeParameters", "extends", ...isDeclareClass ? ["mixins", "implements"] : [], "body"],
        aliases: ["FlowDeclaration", "Statement", "Declaration"],
        fields: Object.assign({
          id: (0, _utils.validateType)("Identifier"),
          typeParameters: (0, _utils.validateOptionalType)("TypeParameterDeclaration"),
          extends: (0, _utils.validateOptional)((0, _utils.arrayOfType)("InterfaceExtends"))
        }, isDeclareClass ? {
          mixins: (0, _utils.validateOptional)((0, _utils.arrayOfType)("InterfaceExtends")),
          implements: (0, _utils.validateOptional)((0, _utils.arrayOfType)("ClassImplements"))
        } : {}, {
          body: (0, _utils.validateType)("ObjectTypeAnnotation")
        })
      });
    };
    defineType("AnyTypeAnnotation", {
      aliases: ["FlowType", "FlowBaseAnnotation"]
    });
    defineType("ArrayTypeAnnotation", {
      visitor: ["elementType"],
      aliases: ["FlowType"],
      fields: {
        elementType: (0, _utils.validateType)("FlowType")
      }
    });
    defineType("BooleanTypeAnnotation", {
      aliases: ["FlowType", "FlowBaseAnnotation"]
    });
    defineType("BooleanLiteralTypeAnnotation", {
      builder: ["value"],
      aliases: ["FlowType"],
      fields: {
        value: (0, _utils.validate)((0, _utils.assertValueType)("boolean"))
      }
    });
    defineType("NullLiteralTypeAnnotation", {
      aliases: ["FlowType", "FlowBaseAnnotation"]
    });
    defineType("ClassImplements", {
      visitor: ["id", "typeParameters"],
      fields: {
        id: (0, _utils.validateType)("Identifier"),
        typeParameters: (0, _utils.validateOptionalType)("TypeParameterInstantiation")
      }
    });
    defineInterfaceishType("DeclareClass");
    defineType("DeclareFunction", {
      builder: ["id"],
      visitor: ["id", "predicate"],
      aliases: ["FlowDeclaration", "Statement", "Declaration"],
      fields: {
        id: (0, _utils.validateType)("Identifier"),
        predicate: (0, _utils.validateOptionalType)("DeclaredPredicate")
      }
    });
    defineInterfaceishType("DeclareInterface");
    defineType("DeclareModule", {
      builder: ["id", "body", "kind"],
      visitor: ["id", "body"],
      aliases: ["FlowDeclaration", "Statement", "Declaration"],
      fields: {
        id: (0, _utils.validateType)("Identifier", "StringLiteral"),
        body: (0, _utils.validateType)("BlockStatement"),
        kind: (0, _utils.validateOptional)((0, _utils.assertOneOf)("CommonJS", "ES"))
      }
    });
    defineType("DeclareModuleExports", {
      visitor: ["typeAnnotation"],
      aliases: ["FlowDeclaration", "Statement", "Declaration"],
      fields: {
        typeAnnotation: (0, _utils.validateType)("TypeAnnotation")
      }
    });
    defineType("DeclareTypeAlias", {
      visitor: ["id", "typeParameters", "right"],
      aliases: ["FlowDeclaration", "Statement", "Declaration"],
      fields: {
        id: (0, _utils.validateType)("Identifier"),
        typeParameters: (0, _utils.validateOptionalType)("TypeParameterDeclaration"),
        right: (0, _utils.validateType)("FlowType")
      }
    });
    defineType("DeclareOpaqueType", {
      visitor: ["id", "typeParameters", "supertype"],
      aliases: ["FlowDeclaration", "Statement", "Declaration"],
      fields: {
        id: (0, _utils.validateType)("Identifier"),
        typeParameters: (0, _utils.validateOptionalType)("TypeParameterDeclaration"),
        supertype: (0, _utils.validateOptionalType)("FlowType"),
        impltype: (0, _utils.validateOptionalType)("FlowType")
      }
    });
    defineType("DeclareVariable", {
      visitor: ["id"],
      aliases: ["FlowDeclaration", "Statement", "Declaration"],
      fields: {
        id: (0, _utils.validateType)("Identifier")
      }
    });
    defineType("DeclareExportDeclaration", {
      visitor: ["declaration", "specifiers", "source", "attributes"],
      aliases: ["FlowDeclaration", "Statement", "Declaration"],
      fields: Object.assign({
        declaration: (0, _utils.validateOptionalType)("Flow"),
        specifiers: (0, _utils.validateOptional)((0, _utils.arrayOfType)("ExportSpecifier", "ExportNamespaceSpecifier")),
        source: (0, _utils.validateOptionalType)("StringLiteral"),
        default: (0, _utils.validateOptional)((0, _utils.assertValueType)("boolean"))
      }, _core.importAttributes)
    });
    defineType("DeclareExportAllDeclaration", {
      visitor: ["source", "attributes"],
      aliases: ["FlowDeclaration", "Statement", "Declaration"],
      fields: Object.assign({
        source: (0, _utils.validateType)("StringLiteral"),
        exportKind: (0, _utils.validateOptional)((0, _utils.assertOneOf)("type", "value"))
      }, _core.importAttributes)
    });
    defineType("DeclaredPredicate", {
      visitor: ["value"],
      aliases: ["FlowPredicate"],
      fields: {
        value: (0, _utils.validateType)("Flow")
      }
    });
    defineType("ExistsTypeAnnotation", {
      aliases: ["FlowType"]
    });
    defineType("FunctionTypeAnnotation", {
      builder: ["typeParameters", "params", "rest", "returnType"],
      visitor: ["typeParameters", "this", "params", "rest", "returnType"],
      aliases: ["FlowType"],
      fields: {
        typeParameters: (0, _utils.validateOptionalType)("TypeParameterDeclaration"),
        params: (0, _utils.validateArrayOfType)("FunctionTypeParam"),
        rest: (0, _utils.validateOptionalType)("FunctionTypeParam"),
        this: (0, _utils.validateOptionalType)("FunctionTypeParam"),
        returnType: (0, _utils.validateType)("FlowType")
      }
    });
    defineType("FunctionTypeParam", {
      visitor: ["name", "typeAnnotation"],
      fields: {
        name: (0, _utils.validateOptionalType)("Identifier"),
        typeAnnotation: (0, _utils.validateType)("FlowType"),
        optional: (0, _utils.validateOptional)((0, _utils.assertValueType)("boolean"))
      }
    });
    defineType("GenericTypeAnnotation", {
      visitor: ["id", "typeParameters"],
      aliases: ["FlowType"],
      fields: {
        id: (0, _utils.validateType)("Identifier", "QualifiedTypeIdentifier"),
        typeParameters: (0, _utils.validateOptionalType)("TypeParameterInstantiation")
      }
    });
    defineType("InferredPredicate", {
      aliases: ["FlowPredicate"]
    });
    defineType("InterfaceExtends", {
      visitor: ["id", "typeParameters"],
      fields: {
        id: (0, _utils.validateType)("Identifier", "QualifiedTypeIdentifier"),
        typeParameters: (0, _utils.validateOptionalType)("TypeParameterInstantiation")
      }
    });
    defineInterfaceishType("InterfaceDeclaration");
    defineType("InterfaceTypeAnnotation", {
      visitor: ["extends", "body"],
      aliases: ["FlowType"],
      fields: {
        extends: (0, _utils.validateOptional)((0, _utils.arrayOfType)("InterfaceExtends")),
        body: (0, _utils.validateType)("ObjectTypeAnnotation")
      }
    });
    defineType("IntersectionTypeAnnotation", {
      visitor: ["types"],
      aliases: ["FlowType"],
      fields: {
        types: (0, _utils.validate)((0, _utils.arrayOfType)("FlowType"))
      }
    });
    defineType("MixedTypeAnnotation", {
      aliases: ["FlowType", "FlowBaseAnnotation"]
    });
    defineType("EmptyTypeAnnotation", {
      aliases: ["FlowType", "FlowBaseAnnotation"]
    });
    defineType("NullableTypeAnnotation", {
      visitor: ["typeAnnotation"],
      aliases: ["FlowType"],
      fields: {
        typeAnnotation: (0, _utils.validateType)("FlowType")
      }
    });
    defineType("NumberLiteralTypeAnnotation", {
      builder: ["value"],
      aliases: ["FlowType"],
      fields: {
        value: (0, _utils.validate)((0, _utils.assertValueType)("number"))
      }
    });
    defineType("NumberTypeAnnotation", {
      aliases: ["FlowType", "FlowBaseAnnotation"]
    });
    defineType("ObjectTypeAnnotation", {
      visitor: ["properties", "indexers", "callProperties", "internalSlots"],
      aliases: ["FlowType"],
      builder: ["properties", "indexers", "callProperties", "internalSlots", "exact"],
      fields: {
        properties: (0, _utils.validate)((0, _utils.arrayOfType)("ObjectTypeProperty", "ObjectTypeSpreadProperty")),
        indexers: {
          validate: (0, _utils.arrayOfType)("ObjectTypeIndexer"),
          optional: true,
          default: []
        },
        callProperties: {
          validate: (0, _utils.arrayOfType)("ObjectTypeCallProperty"),
          optional: true,
          default: []
        },
        internalSlots: {
          validate: (0, _utils.arrayOfType)("ObjectTypeInternalSlot"),
          optional: true,
          default: []
        },
        exact: {
          validate: (0, _utils.assertValueType)("boolean"),
          default: false
        },
        inexact: (0, _utils.validateOptional)((0, _utils.assertValueType)("boolean"))
      }
    });
    defineType("ObjectTypeInternalSlot", {
      visitor: ["id", "value"],
      builder: ["id", "value", "optional", "static", "method"],
      aliases: ["UserWhitespacable"],
      fields: {
        id: (0, _utils.validateType)("Identifier"),
        value: (0, _utils.validateType)("FlowType"),
        optional: (0, _utils.validate)((0, _utils.assertValueType)("boolean")),
        static: (0, _utils.validate)((0, _utils.assertValueType)("boolean")),
        method: (0, _utils.validate)((0, _utils.assertValueType)("boolean"))
      }
    });
    defineType("ObjectTypeCallProperty", {
      visitor: ["value"],
      aliases: ["UserWhitespacable"],
      fields: {
        value: (0, _utils.validateType)("FlowType"),
        static: (0, _utils.validate)((0, _utils.assertValueType)("boolean"))
      }
    });
    defineType("ObjectTypeIndexer", {
      visitor: ["variance", "id", "key", "value"],
      builder: ["id", "key", "value", "variance"],
      aliases: ["UserWhitespacable"],
      fields: {
        id: (0, _utils.validateOptionalType)("Identifier"),
        key: (0, _utils.validateType)("FlowType"),
        value: (0, _utils.validateType)("FlowType"),
        static: (0, _utils.validate)((0, _utils.assertValueType)("boolean")),
        variance: (0, _utils.validateOptionalType)("Variance")
      }
    });
    defineType("ObjectTypeProperty", {
      visitor: ["key", "value", "variance"],
      aliases: ["UserWhitespacable"],
      fields: {
        key: (0, _utils.validateType)("Identifier", "StringLiteral"),
        value: (0, _utils.validateType)("FlowType"),
        kind: (0, _utils.validate)((0, _utils.assertOneOf)("init", "get", "set")),
        static: (0, _utils.validate)((0, _utils.assertValueType)("boolean")),
        proto: (0, _utils.validate)((0, _utils.assertValueType)("boolean")),
        optional: (0, _utils.validate)((0, _utils.assertValueType)("boolean")),
        variance: (0, _utils.validateOptionalType)("Variance"),
        method: (0, _utils.validate)((0, _utils.assertValueType)("boolean"))
      }
    });
    defineType("ObjectTypeSpreadProperty", {
      visitor: ["argument"],
      aliases: ["UserWhitespacable"],
      fields: {
        argument: (0, _utils.validateType)("FlowType")
      }
    });
    defineType("OpaqueType", {
      visitor: ["id", "typeParameters", "supertype", "impltype"],
      aliases: ["FlowDeclaration", "Statement", "Declaration"],
      fields: {
        id: (0, _utils.validateType)("Identifier"),
        typeParameters: (0, _utils.validateOptionalType)("TypeParameterDeclaration"),
        supertype: (0, _utils.validateOptionalType)("FlowType"),
        impltype: (0, _utils.validateType)("FlowType")
      }
    });
    defineType("QualifiedTypeIdentifier", {
      visitor: ["qualification", "id"],
      builder: ["id", "qualification"],
      fields: {
        id: (0, _utils.validateType)("Identifier"),
        qualification: (0, _utils.validateType)("Identifier", "QualifiedTypeIdentifier")
      }
    });
    defineType("StringLiteralTypeAnnotation", {
      builder: ["value"],
      aliases: ["FlowType"],
      fields: {
        value: (0, _utils.validate)((0, _utils.assertValueType)("string"))
      }
    });
    defineType("StringTypeAnnotation", {
      aliases: ["FlowType", "FlowBaseAnnotation"]
    });
    defineType("SymbolTypeAnnotation", {
      aliases: ["FlowType", "FlowBaseAnnotation"]
    });
    defineType("ThisTypeAnnotation", {
      aliases: ["FlowType", "FlowBaseAnnotation"]
    });
    defineType("TupleTypeAnnotation", {
      visitor: ["types"],
      aliases: ["FlowType"],
      fields: {
        types: (0, _utils.validate)((0, _utils.arrayOfType)("FlowType"))
      }
    });
    defineType("TypeofTypeAnnotation", {
      visitor: ["argument"],
      aliases: ["FlowType"],
      fields: {
        argument: (0, _utils.validateType)("FlowType")
      }
    });
    defineType("TypeAlias", {
      visitor: ["id", "typeParameters", "right"],
      aliases: ["FlowDeclaration", "Statement", "Declaration"],
      fields: {
        id: (0, _utils.validateType)("Identifier"),
        typeParameters: (0, _utils.validateOptionalType)("TypeParameterDeclaration"),
        right: (0, _utils.validateType)("FlowType")
      }
    });
    defineType("TypeAnnotation", {
      visitor: ["typeAnnotation"],
      fields: {
        typeAnnotation: (0, _utils.validateType)("FlowType")
      }
    });
    defineType("TypeCastExpression", {
      visitor: ["expression", "typeAnnotation"],
      aliases: ["ExpressionWrapper", "Expression"],
      fields: {
        expression: (0, _utils.validateType)("Expression"),
        typeAnnotation: (0, _utils.validateType)("TypeAnnotation")
      }
    });
    defineType("TypeParameter", {
      visitor: ["bound", "default", "variance"],
      fields: {
        name: (0, _utils.validate)((0, _utils.assertValueType)("string")),
        bound: (0, _utils.validateOptionalType)("TypeAnnotation"),
        default: (0, _utils.validateOptionalType)("FlowType"),
        variance: (0, _utils.validateOptionalType)("Variance")
      }
    });
    defineType("TypeParameterDeclaration", {
      visitor: ["params"],
      fields: {
        params: (0, _utils.validate)((0, _utils.arrayOfType)("TypeParameter"))
      }
    });
    defineType("TypeParameterInstantiation", {
      visitor: ["params"],
      fields: {
        params: (0, _utils.validate)((0, _utils.arrayOfType)("FlowType"))
      }
    });
    defineType("UnionTypeAnnotation", {
      visitor: ["types"],
      aliases: ["FlowType"],
      fields: {
        types: (0, _utils.validate)((0, _utils.arrayOfType)("FlowType"))
      }
    });
    defineType("Variance", {
      builder: ["kind"],
      fields: {
        kind: (0, _utils.validate)((0, _utils.assertOneOf)("minus", "plus"))
      }
    });
    defineType("VoidTypeAnnotation", {
      aliases: ["FlowType", "FlowBaseAnnotation"]
    });
    defineType("EnumDeclaration", {
      aliases: ["Statement", "Declaration"],
      visitor: ["id", "body"],
      fields: {
        id: (0, _utils.validateType)("Identifier"),
        body: (0, _utils.validateType)("EnumBooleanBody", "EnumNumberBody", "EnumStringBody", "EnumSymbolBody")
      }
    });
    defineType("EnumBooleanBody", {
      aliases: ["EnumBody"],
      visitor: ["members"],
      fields: {
        explicitType: (0, _utils.validate)((0, _utils.assertValueType)("boolean")),
        members: (0, _utils.validateArrayOfType)("EnumBooleanMember"),
        hasUnknownMembers: (0, _utils.validate)((0, _utils.assertValueType)("boolean"))
      }
    });
    defineType("EnumNumberBody", {
      aliases: ["EnumBody"],
      visitor: ["members"],
      fields: {
        explicitType: (0, _utils.validate)((0, _utils.assertValueType)("boolean")),
        members: (0, _utils.validateArrayOfType)("EnumNumberMember"),
        hasUnknownMembers: (0, _utils.validate)((0, _utils.assertValueType)("boolean"))
      }
    });
    defineType("EnumStringBody", {
      aliases: ["EnumBody"],
      visitor: ["members"],
      fields: {
        explicitType: (0, _utils.validate)((0, _utils.assertValueType)("boolean")),
        members: (0, _utils.validateArrayOfType)("EnumStringMember", "EnumDefaultedMember"),
        hasUnknownMembers: (0, _utils.validate)((0, _utils.assertValueType)("boolean"))
      }
    });
    defineType("EnumSymbolBody", {
      aliases: ["EnumBody"],
      visitor: ["members"],
      fields: {
        members: (0, _utils.validateArrayOfType)("EnumDefaultedMember"),
        hasUnknownMembers: (0, _utils.validate)((0, _utils.assertValueType)("boolean"))
      }
    });
    defineType("EnumBooleanMember", {
      aliases: ["EnumMember"],
      builder: ["id"],
      visitor: ["id", "init"],
      fields: {
        id: (0, _utils.validateType)("Identifier"),
        init: (0, _utils.validateType)("BooleanLiteral")
      }
    });
    defineType("EnumNumberMember", {
      aliases: ["EnumMember"],
      visitor: ["id", "init"],
      fields: {
        id: (0, _utils.validateType)("Identifier"),
        init: (0, _utils.validateType)("NumericLiteral")
      }
    });
    defineType("EnumStringMember", {
      aliases: ["EnumMember"],
      visitor: ["id", "init"],
      fields: {
        id: (0, _utils.validateType)("Identifier"),
        init: (0, _utils.validateType)("StringLiteral")
      }
    });
    defineType("EnumDefaultedMember", {
      aliases: ["EnumMember"],
      visitor: ["id"],
      fields: {
        id: (0, _utils.validateType)("Identifier")
      }
    });
    defineType("IndexedAccessType", {
      visitor: ["objectType", "indexType"],
      aliases: ["FlowType"],
      fields: {
        objectType: (0, _utils.validateType)("FlowType"),
        indexType: (0, _utils.validateType)("FlowType")
      }
    });
    defineType("OptionalIndexedAccessType", {
      visitor: ["objectType", "indexType"],
      aliases: ["FlowType"],
      fields: {
        objectType: (0, _utils.validateType)("FlowType"),
        indexType: (0, _utils.validateType)("FlowType"),
        optional: (0, _utils.validate)((0, _utils.assertValueType)("boolean"))
      }
    });
  }
});

// ../node_modules/@babel/types/lib/definitions/jsx.js
var require_jsx = __commonJS({
  "../node_modules/@babel/types/lib/definitions/jsx.js"() {
    "use strict";
    var _utils = require_utils();
    var defineType = (0, _utils.defineAliasedType)("JSX");
    defineType("JSXAttribute", {
      visitor: ["name", "value"],
      aliases: ["Immutable"],
      fields: {
        name: {
          validate: (0, _utils.assertNodeType)("JSXIdentifier", "JSXNamespacedName")
        },
        value: {
          optional: true,
          validate: (0, _utils.assertNodeType)("JSXElement", "JSXFragment", "StringLiteral", "JSXExpressionContainer")
        }
      }
    });
    defineType("JSXClosingElement", {
      visitor: ["name"],
      aliases: ["Immutable"],
      fields: {
        name: {
          validate: (0, _utils.assertNodeType)("JSXIdentifier", "JSXMemberExpression", "JSXNamespacedName")
        }
      }
    });
    defineType("JSXElement", {
      builder: ["openingElement", "closingElement", "children", "selfClosing"],
      visitor: ["openingElement", "children", "closingElement"],
      aliases: ["Immutable", "Expression"],
      fields: Object.assign({
        openingElement: {
          validate: (0, _utils.assertNodeType)("JSXOpeningElement")
        },
        closingElement: {
          optional: true,
          validate: (0, _utils.assertNodeType)("JSXClosingElement")
        },
        children: (0, _utils.validateArrayOfType)("JSXText", "JSXExpressionContainer", "JSXSpreadChild", "JSXElement", "JSXFragment")
      }, {
        selfClosing: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        }
      })
    });
    defineType("JSXEmptyExpression", {});
    defineType("JSXExpressionContainer", {
      visitor: ["expression"],
      aliases: ["Immutable"],
      fields: {
        expression: {
          validate: (0, _utils.assertNodeType)("Expression", "JSXEmptyExpression")
        }
      }
    });
    defineType("JSXSpreadChild", {
      visitor: ["expression"],
      aliases: ["Immutable"],
      fields: {
        expression: {
          validate: (0, _utils.assertNodeType)("Expression")
        }
      }
    });
    defineType("JSXIdentifier", {
      builder: ["name"],
      fields: {
        name: {
          validate: (0, _utils.assertValueType)("string")
        }
      }
    });
    defineType("JSXMemberExpression", {
      visitor: ["object", "property"],
      fields: {
        object: {
          validate: (0, _utils.assertNodeType)("JSXMemberExpression", "JSXIdentifier")
        },
        property: {
          validate: (0, _utils.assertNodeType)("JSXIdentifier")
        }
      }
    });
    defineType("JSXNamespacedName", {
      visitor: ["namespace", "name"],
      fields: {
        namespace: {
          validate: (0, _utils.assertNodeType)("JSXIdentifier")
        },
        name: {
          validate: (0, _utils.assertNodeType)("JSXIdentifier")
        }
      }
    });
    defineType("JSXOpeningElement", {
      builder: ["name", "attributes", "selfClosing"],
      visitor: ["name", "typeParameters", "typeArguments", "attributes"],
      aliases: ["Immutable"],
      fields: Object.assign({
        name: {
          validate: (0, _utils.assertNodeType)("JSXIdentifier", "JSXMemberExpression", "JSXNamespacedName")
        },
        selfClosing: {
          default: false
        },
        attributes: (0, _utils.validateArrayOfType)("JSXAttribute", "JSXSpreadAttribute"),
        typeArguments: {
          validate: (0, _utils.assertNodeType)("TypeParameterInstantiation"),
          optional: true
        }
      }, {
        typeParameters: {
          validate: (0, _utils.assertNodeType)("TSTypeParameterInstantiation"),
          optional: true
        }
      })
    });
    defineType("JSXSpreadAttribute", {
      visitor: ["argument"],
      fields: {
        argument: {
          validate: (0, _utils.assertNodeType)("Expression")
        }
      }
    });
    defineType("JSXText", {
      aliases: ["Immutable"],
      builder: ["value"],
      fields: {
        value: {
          validate: (0, _utils.assertValueType)("string")
        }
      }
    });
    defineType("JSXFragment", {
      builder: ["openingFragment", "closingFragment", "children"],
      visitor: ["openingFragment", "children", "closingFragment"],
      aliases: ["Immutable", "Expression"],
      fields: {
        openingFragment: {
          validate: (0, _utils.assertNodeType)("JSXOpeningFragment")
        },
        closingFragment: {
          validate: (0, _utils.assertNodeType)("JSXClosingFragment")
        },
        children: (0, _utils.validateArrayOfType)("JSXText", "JSXExpressionContainer", "JSXSpreadChild", "JSXElement", "JSXFragment")
      }
    });
    defineType("JSXOpeningFragment", {
      aliases: ["Immutable"]
    });
    defineType("JSXClosingFragment", {
      aliases: ["Immutable"]
    });
  }
});

// ../node_modules/@babel/types/lib/definitions/placeholders.js
var require_placeholders = __commonJS({
  "../node_modules/@babel/types/lib/definitions/placeholders.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.PLACEHOLDERS_FLIPPED_ALIAS = exports.PLACEHOLDERS_ALIAS = exports.PLACEHOLDERS = void 0;
    var _utils = require_utils();
    var PLACEHOLDERS = exports.PLACEHOLDERS = ["Identifier", "StringLiteral", "Expression", "Statement", "Declaration", "BlockStatement", "ClassBody", "Pattern"];
    var PLACEHOLDERS_ALIAS = exports.PLACEHOLDERS_ALIAS = {
      Declaration: ["Statement"],
      Pattern: ["PatternLike", "LVal"]
    };
    for (const type of PLACEHOLDERS) {
      const alias = _utils.ALIAS_KEYS[type];
      if (alias != null && alias.length) PLACEHOLDERS_ALIAS[type] = alias;
    }
    var PLACEHOLDERS_FLIPPED_ALIAS = exports.PLACEHOLDERS_FLIPPED_ALIAS = {};
    Object.keys(PLACEHOLDERS_ALIAS).forEach((type) => {
      PLACEHOLDERS_ALIAS[type].forEach((alias) => {
        if (!hasOwnProperty.call(PLACEHOLDERS_FLIPPED_ALIAS, alias)) {
          PLACEHOLDERS_FLIPPED_ALIAS[alias] = [];
        }
        PLACEHOLDERS_FLIPPED_ALIAS[alias].push(type);
      });
    });
  }
});

// ../node_modules/@babel/types/lib/definitions/misc.js
var require_misc = __commonJS({
  "../node_modules/@babel/types/lib/definitions/misc.js"() {
    "use strict";
    var _utils = require_utils();
    var _placeholders = require_placeholders();
    var _core = require_core();
    var defineType = (0, _utils.defineAliasedType)("Miscellaneous");
    defineType("Noop", {
      visitor: []
    });
    defineType("Placeholder", {
      visitor: [],
      builder: ["expectedNode", "name"],
      fields: Object.assign({
        name: {
          validate: (0, _utils.assertNodeType)("Identifier")
        },
        expectedNode: {
          validate: (0, _utils.assertOneOf)(..._placeholders.PLACEHOLDERS)
        }
      }, (0, _core.patternLikeCommon)())
    });
    defineType("V8IntrinsicIdentifier", {
      builder: ["name"],
      fields: {
        name: {
          validate: (0, _utils.assertValueType)("string")
        }
      }
    });
  }
});

// ../node_modules/@babel/types/lib/definitions/experimental.js
var require_experimental = __commonJS({
  "../node_modules/@babel/types/lib/definitions/experimental.js"() {
    "use strict";
    var _utils = require_utils();
    (0, _utils.default)("ArgumentPlaceholder", {});
    (0, _utils.default)("BindExpression", {
      visitor: ["object", "callee"],
      aliases: ["Expression"],
      fields: !process.env.BABEL_TYPES_8_BREAKING ? {
        object: {
          validate: Object.assign(() => {
          }, {
            oneOfNodeTypes: ["Expression"]
          })
        },
        callee: {
          validate: Object.assign(() => {
          }, {
            oneOfNodeTypes: ["Expression"]
          })
        }
      } : {
        object: {
          validate: (0, _utils.assertNodeType)("Expression")
        },
        callee: {
          validate: (0, _utils.assertNodeType)("Expression")
        }
      }
    });
    (0, _utils.default)("Decorator", {
      visitor: ["expression"],
      fields: {
        expression: {
          validate: (0, _utils.assertNodeType)("Expression")
        }
      }
    });
    (0, _utils.default)("DoExpression", {
      visitor: ["body"],
      builder: ["body", "async"],
      aliases: ["Expression"],
      fields: {
        body: {
          validate: (0, _utils.assertNodeType)("BlockStatement")
        },
        async: {
          validate: (0, _utils.assertValueType)("boolean"),
          default: false
        }
      }
    });
    (0, _utils.default)("ExportDefaultSpecifier", {
      visitor: ["exported"],
      aliases: ["ModuleSpecifier"],
      fields: {
        exported: {
          validate: (0, _utils.assertNodeType)("Identifier")
        }
      }
    });
    (0, _utils.default)("RecordExpression", {
      visitor: ["properties"],
      aliases: ["Expression"],
      fields: {
        properties: (0, _utils.validateArrayOfType)("ObjectProperty", "SpreadElement")
      }
    });
    (0, _utils.default)("TupleExpression", {
      fields: {
        elements: {
          validate: (0, _utils.arrayOfType)("Expression", "SpreadElement"),
          default: []
        }
      },
      visitor: ["elements"],
      aliases: ["Expression"]
    });
    (0, _utils.default)("DecimalLiteral", {
      builder: ["value"],
      fields: {
        value: {
          validate: (0, _utils.assertValueType)("string")
        }
      },
      aliases: ["Expression", "Pureish", "Literal", "Immutable"]
    });
    (0, _utils.default)("ModuleExpression", {
      visitor: ["body"],
      fields: {
        body: {
          validate: (0, _utils.assertNodeType)("Program")
        }
      },
      aliases: ["Expression"]
    });
    (0, _utils.default)("TopicReference", {
      aliases: ["Expression"]
    });
    (0, _utils.default)("PipelineTopicExpression", {
      builder: ["expression"],
      visitor: ["expression"],
      fields: {
        expression: {
          validate: (0, _utils.assertNodeType)("Expression")
        }
      },
      aliases: ["Expression"]
    });
    (0, _utils.default)("PipelineBareFunction", {
      builder: ["callee"],
      visitor: ["callee"],
      fields: {
        callee: {
          validate: (0, _utils.assertNodeType)("Expression")
        }
      },
      aliases: ["Expression"]
    });
    (0, _utils.default)("PipelinePrimaryTopicReference", {
      aliases: ["Expression"]
    });
    (0, _utils.default)("VoidPattern", {
      aliases: ["Pattern", "PatternLike", "FunctionParameter"]
    });
  }
});

// ../node_modules/@babel/types/lib/definitions/typescript.js
var require_typescript = __commonJS({
  "../node_modules/@babel/types/lib/definitions/typescript.js"() {
    "use strict";
    var _utils = require_utils();
    var _core = require_core();
    var _is = require_is();
    var defineType = (0, _utils.defineAliasedType)("TypeScript");
    var bool = (0, _utils.assertValueType)("boolean");
    var tSFunctionTypeAnnotationCommon = () => ({
      returnType: {
        validate: (0, _utils.assertNodeType)("TSTypeAnnotation", "Noop"),
        optional: true
      },
      typeParameters: {
        validate: (0, _utils.assertNodeType)("TSTypeParameterDeclaration", "Noop"),
        optional: true
      }
    });
    defineType("TSParameterProperty", {
      aliases: ["LVal"],
      builder: ["parameter"],
      visitor: ["decorators", "parameter"],
      fields: {
        accessibility: {
          validate: (0, _utils.assertOneOf)("public", "private", "protected"),
          optional: true
        },
        readonly: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        },
        parameter: {
          validate: (0, _utils.assertNodeType)("Identifier", "AssignmentPattern")
        },
        override: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        },
        decorators: {
          validate: (0, _utils.arrayOfType)("Decorator"),
          optional: true
        }
      }
    });
    defineType("TSDeclareFunction", {
      aliases: ["Statement", "Declaration"],
      visitor: ["id", "typeParameters", "params", "returnType"],
      fields: Object.assign({}, (0, _core.functionDeclarationCommon)(), tSFunctionTypeAnnotationCommon())
    });
    defineType("TSDeclareMethod", Object.assign({
      visitor: ["decorators", "key", "typeParameters", "params", "returnType"]
    }, (0, _core.classMethodOrPropertyUnionShapeCommon)(), {
      fields: Object.assign({}, (0, _core.classMethodOrDeclareMethodCommon)(), tSFunctionTypeAnnotationCommon())
    }));
    defineType("TSQualifiedName", {
      aliases: ["TSEntityName"],
      visitor: ["left", "right"],
      fields: {
        left: (0, _utils.validateType)("TSEntityName"),
        right: (0, _utils.validateType)("Identifier")
      }
    });
    var signatureDeclarationCommon = () => ({
      typeParameters: (0, _utils.validateOptionalType)("TSTypeParameterDeclaration"),
      ["parameters"]: (0, _utils.validateArrayOfType)("ArrayPattern", "Identifier", "ObjectPattern", "RestElement"),
      ["typeAnnotation"]: (0, _utils.validateOptionalType)("TSTypeAnnotation")
    });
    var callConstructSignatureDeclaration = {
      aliases: ["TSTypeElement"],
      visitor: ["typeParameters", "parameters", "typeAnnotation"],
      fields: signatureDeclarationCommon()
    };
    defineType("TSCallSignatureDeclaration", callConstructSignatureDeclaration);
    defineType("TSConstructSignatureDeclaration", callConstructSignatureDeclaration);
    var namedTypeElementCommon = () => ({
      key: (0, _utils.validateType)("Expression"),
      computed: {
        default: false
      },
      optional: (0, _utils.validateOptional)(bool)
    });
    defineType("TSPropertySignature", {
      aliases: ["TSTypeElement"],
      visitor: ["key", "typeAnnotation"],
      fields: Object.assign({}, namedTypeElementCommon(), {
        readonly: (0, _utils.validateOptional)(bool),
        typeAnnotation: (0, _utils.validateOptionalType)("TSTypeAnnotation"),
        kind: {
          optional: true,
          validate: (0, _utils.assertOneOf)("get", "set")
        }
      })
    });
    defineType("TSMethodSignature", {
      aliases: ["TSTypeElement"],
      visitor: ["key", "typeParameters", "parameters", "typeAnnotation"],
      fields: Object.assign({}, signatureDeclarationCommon(), namedTypeElementCommon(), {
        kind: {
          validate: (0, _utils.assertOneOf)("method", "get", "set")
        }
      })
    });
    defineType("TSIndexSignature", {
      aliases: ["TSTypeElement"],
      visitor: ["parameters", "typeAnnotation"],
      fields: {
        readonly: (0, _utils.validateOptional)(bool),
        static: (0, _utils.validateOptional)(bool),
        parameters: (0, _utils.validateArrayOfType)("Identifier"),
        typeAnnotation: (0, _utils.validateOptionalType)("TSTypeAnnotation")
      }
    });
    var tsKeywordTypes = ["TSAnyKeyword", "TSBooleanKeyword", "TSBigIntKeyword", "TSIntrinsicKeyword", "TSNeverKeyword", "TSNullKeyword", "TSNumberKeyword", "TSObjectKeyword", "TSStringKeyword", "TSSymbolKeyword", "TSUndefinedKeyword", "TSUnknownKeyword", "TSVoidKeyword"];
    for (const type of tsKeywordTypes) {
      defineType(type, {
        aliases: ["TSType", "TSBaseType"],
        visitor: [],
        fields: {}
      });
    }
    defineType("TSThisType", {
      aliases: ["TSType", "TSBaseType"],
      visitor: [],
      fields: {}
    });
    var fnOrCtrBase = {
      aliases: ["TSType"],
      visitor: ["typeParameters", "parameters", "typeAnnotation"]
    };
    defineType("TSFunctionType", Object.assign({}, fnOrCtrBase, {
      fields: signatureDeclarationCommon()
    }));
    defineType("TSConstructorType", Object.assign({}, fnOrCtrBase, {
      fields: Object.assign({}, signatureDeclarationCommon(), {
        abstract: (0, _utils.validateOptional)(bool)
      })
    }));
    defineType("TSTypeReference", {
      aliases: ["TSType"],
      visitor: ["typeName", "typeParameters"],
      fields: {
        typeName: (0, _utils.validateType)("TSEntityName"),
        ["typeParameters"]: (0, _utils.validateOptionalType)("TSTypeParameterInstantiation")
      }
    });
    defineType("TSTypePredicate", {
      aliases: ["TSType"],
      visitor: ["parameterName", "typeAnnotation"],
      builder: ["parameterName", "typeAnnotation", "asserts"],
      fields: {
        parameterName: (0, _utils.validateType)("Identifier", "TSThisType"),
        typeAnnotation: (0, _utils.validateOptionalType)("TSTypeAnnotation"),
        asserts: (0, _utils.validateOptional)(bool)
      }
    });
    defineType("TSTypeQuery", {
      aliases: ["TSType"],
      visitor: ["exprName", "typeParameters"],
      fields: {
        exprName: (0, _utils.validateType)("TSEntityName", "TSImportType"),
        ["typeParameters"]: (0, _utils.validateOptionalType)("TSTypeParameterInstantiation")
      }
    });
    defineType("TSTypeLiteral", {
      aliases: ["TSType"],
      visitor: ["members"],
      fields: {
        members: (0, _utils.validateArrayOfType)("TSTypeElement")
      }
    });
    defineType("TSArrayType", {
      aliases: ["TSType"],
      visitor: ["elementType"],
      fields: {
        elementType: (0, _utils.validateType)("TSType")
      }
    });
    defineType("TSTupleType", {
      aliases: ["TSType"],
      visitor: ["elementTypes"],
      fields: {
        elementTypes: (0, _utils.validateArrayOfType)("TSType", "TSNamedTupleMember")
      }
    });
    defineType("TSOptionalType", {
      aliases: ["TSType"],
      visitor: ["typeAnnotation"],
      fields: {
        typeAnnotation: (0, _utils.validateType)("TSType")
      }
    });
    defineType("TSRestType", {
      aliases: ["TSType"],
      visitor: ["typeAnnotation"],
      fields: {
        typeAnnotation: (0, _utils.validateType)("TSType")
      }
    });
    defineType("TSNamedTupleMember", {
      visitor: ["label", "elementType"],
      builder: ["label", "elementType", "optional"],
      fields: {
        label: (0, _utils.validateType)("Identifier"),
        optional: {
          validate: bool,
          default: false
        },
        elementType: (0, _utils.validateType)("TSType")
      }
    });
    var unionOrIntersection = {
      aliases: ["TSType"],
      visitor: ["types"],
      fields: {
        types: (0, _utils.validateArrayOfType)("TSType")
      }
    };
    defineType("TSUnionType", unionOrIntersection);
    defineType("TSIntersectionType", unionOrIntersection);
    defineType("TSConditionalType", {
      aliases: ["TSType"],
      visitor: ["checkType", "extendsType", "trueType", "falseType"],
      fields: {
        checkType: (0, _utils.validateType)("TSType"),
        extendsType: (0, _utils.validateType)("TSType"),
        trueType: (0, _utils.validateType)("TSType"),
        falseType: (0, _utils.validateType)("TSType")
      }
    });
    defineType("TSInferType", {
      aliases: ["TSType"],
      visitor: ["typeParameter"],
      fields: {
        typeParameter: (0, _utils.validateType)("TSTypeParameter")
      }
    });
    defineType("TSParenthesizedType", {
      aliases: ["TSType"],
      visitor: ["typeAnnotation"],
      fields: {
        typeAnnotation: (0, _utils.validateType)("TSType")
      }
    });
    defineType("TSTypeOperator", {
      aliases: ["TSType"],
      visitor: ["typeAnnotation"],
      builder: ["typeAnnotation", "operator"],
      fields: {
        operator: {
          validate: (0, _utils.assertValueType)("string"),
          default: "keyof"
        },
        typeAnnotation: (0, _utils.validateType)("TSType")
      }
    });
    defineType("TSIndexedAccessType", {
      aliases: ["TSType"],
      visitor: ["objectType", "indexType"],
      fields: {
        objectType: (0, _utils.validateType)("TSType"),
        indexType: (0, _utils.validateType)("TSType")
      }
    });
    defineType("TSMappedType", {
      aliases: ["TSType"],
      visitor: ["typeParameter", "nameType", "typeAnnotation"],
      builder: ["typeParameter", "typeAnnotation", "nameType"],
      fields: Object.assign({}, {
        typeParameter: (0, _utils.validateType)("TSTypeParameter")
      }, {
        readonly: (0, _utils.validateOptional)((0, _utils.assertOneOf)(true, false, "+", "-")),
        optional: (0, _utils.validateOptional)((0, _utils.assertOneOf)(true, false, "+", "-")),
        typeAnnotation: (0, _utils.validateOptionalType)("TSType"),
        nameType: (0, _utils.validateOptionalType)("TSType")
      })
    });
    defineType("TSTemplateLiteralType", {
      aliases: ["TSType", "TSBaseType"],
      visitor: ["quasis", "types"],
      fields: {
        quasis: (0, _utils.validateArrayOfType)("TemplateElement"),
        types: {
          validate: (0, _utils.chain)((0, _utils.assertValueType)("array"), (0, _utils.assertEach)((0, _utils.assertNodeType)("TSType")), function(node, key, val) {
            if (node.quasis.length !== val.length + 1) {
              throw new TypeError(`Number of ${node.type} quasis should be exactly one more than the number of types.
Expected ${val.length + 1} quasis but got ${node.quasis.length}`);
            }
          })
        }
      }
    });
    defineType("TSLiteralType", {
      aliases: ["TSType", "TSBaseType"],
      visitor: ["literal"],
      fields: {
        literal: {
          validate: (function() {
            const unaryExpression = (0, _utils.assertNodeType)("NumericLiteral", "BigIntLiteral");
            const unaryOperator = (0, _utils.assertOneOf)("-");
            const literal = (0, _utils.assertNodeType)("NumericLiteral", "StringLiteral", "BooleanLiteral", "BigIntLiteral", "TemplateLiteral");
            const validator = function validator2(parent, key, node) {
              if ((0, _is.default)("UnaryExpression", node)) {
                unaryOperator(node, "operator", node.operator);
                unaryExpression(node, "argument", node.argument);
              } else {
                literal(parent, key, node);
              }
            };
            validator.oneOfNodeTypes = ["NumericLiteral", "StringLiteral", "BooleanLiteral", "BigIntLiteral", "TemplateLiteral", "UnaryExpression"];
            return validator;
          })()
        }
      }
    });
    defineType("TSExpressionWithTypeArguments", {
      aliases: ["TSType"],
      visitor: ["expression", "typeParameters"],
      fields: {
        expression: (0, _utils.validateType)("TSEntityName"),
        typeParameters: (0, _utils.validateOptionalType)("TSTypeParameterInstantiation")
      }
    });
    defineType("TSInterfaceDeclaration", {
      aliases: ["Statement", "Declaration"],
      visitor: ["id", "typeParameters", "extends", "body"],
      fields: {
        declare: (0, _utils.validateOptional)(bool),
        id: (0, _utils.validateType)("Identifier"),
        typeParameters: (0, _utils.validateOptionalType)("TSTypeParameterDeclaration"),
        extends: (0, _utils.validateOptional)((0, _utils.arrayOfType)("TSExpressionWithTypeArguments")),
        body: (0, _utils.validateType)("TSInterfaceBody")
      }
    });
    defineType("TSInterfaceBody", {
      visitor: ["body"],
      fields: {
        body: (0, _utils.validateArrayOfType)("TSTypeElement")
      }
    });
    defineType("TSTypeAliasDeclaration", {
      aliases: ["Statement", "Declaration"],
      visitor: ["id", "typeParameters", "typeAnnotation"],
      fields: {
        declare: (0, _utils.validateOptional)(bool),
        id: (0, _utils.validateType)("Identifier"),
        typeParameters: (0, _utils.validateOptionalType)("TSTypeParameterDeclaration"),
        typeAnnotation: (0, _utils.validateType)("TSType")
      }
    });
    defineType("TSInstantiationExpression", {
      aliases: ["Expression"],
      visitor: ["expression", "typeParameters"],
      fields: {
        expression: (0, _utils.validateType)("Expression"),
        ["typeParameters"]: (0, _utils.validateOptionalType)("TSTypeParameterInstantiation")
      }
    });
    var TSTypeExpression = {
      aliases: ["Expression", "LVal", "PatternLike"],
      visitor: ["expression", "typeAnnotation"],
      fields: {
        expression: (0, _utils.validateType)("Expression"),
        typeAnnotation: (0, _utils.validateType)("TSType")
      }
    };
    defineType("TSAsExpression", TSTypeExpression);
    defineType("TSSatisfiesExpression", TSTypeExpression);
    defineType("TSTypeAssertion", {
      aliases: ["Expression", "LVal", "PatternLike"],
      visitor: ["typeAnnotation", "expression"],
      fields: {
        typeAnnotation: (0, _utils.validateType)("TSType"),
        expression: (0, _utils.validateType)("Expression")
      }
    });
    defineType("TSEnumBody", {
      visitor: ["members"],
      fields: {
        members: (0, _utils.validateArrayOfType)("TSEnumMember")
      }
    });
    defineType("TSEnumDeclaration", {
      aliases: ["Statement", "Declaration"],
      visitor: ["id", "members"],
      fields: {
        declare: (0, _utils.validateOptional)(bool),
        const: (0, _utils.validateOptional)(bool),
        id: (0, _utils.validateType)("Identifier"),
        members: (0, _utils.validateArrayOfType)("TSEnumMember"),
        initializer: (0, _utils.validateOptionalType)("Expression"),
        body: (0, _utils.validateOptionalType)("TSEnumBody")
      }
    });
    defineType("TSEnumMember", {
      visitor: ["id", "initializer"],
      fields: {
        id: (0, _utils.validateType)("Identifier", "StringLiteral"),
        initializer: (0, _utils.validateOptionalType)("Expression")
      }
    });
    defineType("TSModuleDeclaration", {
      aliases: ["Statement", "Declaration"],
      visitor: ["id", "body"],
      fields: Object.assign({
        kind: {
          validate: (0, _utils.assertOneOf)("global", "module", "namespace")
        },
        declare: (0, _utils.validateOptional)(bool)
      }, {
        global: (0, _utils.validateOptional)(bool)
      }, {
        id: (0, _utils.validateType)("Identifier", "StringLiteral"),
        body: (0, _utils.validateType)("TSModuleBlock", "TSModuleDeclaration")
      })
    });
    defineType("TSModuleBlock", {
      aliases: ["Scopable", "Block", "BlockParent", "FunctionParent"],
      visitor: ["body"],
      fields: {
        body: (0, _utils.validateArrayOfType)("Statement")
      }
    });
    defineType("TSImportType", {
      aliases: ["TSType"],
      builder: ["argument", "qualifier", "typeParameters"],
      visitor: ["argument", "options", "qualifier", "typeParameters"],
      fields: Object.assign({}, {
        argument: (0, _utils.validateType)("StringLiteral")
      }, {
        qualifier: (0, _utils.validateOptionalType)("TSEntityName")
      }, {
        typeParameters: (0, _utils.validateOptionalType)("TSTypeParameterInstantiation")
      }, {
        options: {
          validate: (0, _utils.assertNodeType)("ObjectExpression"),
          optional: true
        }
      })
    });
    defineType("TSImportEqualsDeclaration", {
      aliases: ["Statement", "Declaration"],
      visitor: ["id", "moduleReference"],
      fields: Object.assign({}, {
        isExport: (0, _utils.validate)(bool)
      }, {
        id: (0, _utils.validateType)("Identifier"),
        moduleReference: (0, _utils.validateType)("TSEntityName", "TSExternalModuleReference"),
        importKind: {
          validate: (0, _utils.assertOneOf)("type", "value"),
          optional: true
        }
      })
    });
    defineType("TSExternalModuleReference", {
      visitor: ["expression"],
      fields: {
        expression: (0, _utils.validateType)("StringLiteral")
      }
    });
    defineType("TSNonNullExpression", {
      aliases: ["Expression", "LVal", "PatternLike"],
      visitor: ["expression"],
      fields: {
        expression: (0, _utils.validateType)("Expression")
      }
    });
    defineType("TSExportAssignment", {
      aliases: ["Statement"],
      visitor: ["expression"],
      fields: {
        expression: (0, _utils.validateType)("Expression")
      }
    });
    defineType("TSNamespaceExportDeclaration", {
      aliases: ["Statement"],
      visitor: ["id"],
      fields: {
        id: (0, _utils.validateType)("Identifier")
      }
    });
    defineType("TSTypeAnnotation", {
      visitor: ["typeAnnotation"],
      fields: {
        typeAnnotation: {
          validate: (0, _utils.assertNodeType)("TSType")
        }
      }
    });
    defineType("TSTypeParameterInstantiation", {
      visitor: ["params"],
      fields: {
        params: (0, _utils.validateArrayOfType)("TSType")
      }
    });
    defineType("TSTypeParameterDeclaration", {
      visitor: ["params"],
      fields: {
        params: (0, _utils.validateArrayOfType)("TSTypeParameter")
      }
    });
    defineType("TSTypeParameter", {
      builder: ["constraint", "default", "name"],
      visitor: ["constraint", "default"],
      fields: {
        name: {
          validate: (0, _utils.assertValueType)("string")
        },
        in: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        },
        out: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        },
        const: {
          validate: (0, _utils.assertValueType)("boolean"),
          optional: true
        },
        constraint: {
          validate: (0, _utils.assertNodeType)("TSType"),
          optional: true
        },
        default: {
          validate: (0, _utils.assertNodeType)("TSType"),
          optional: true
        }
      }
    });
  }
});

// ../node_modules/@babel/types/lib/definitions/deprecated-aliases.js
var require_deprecated_aliases = __commonJS({
  "../node_modules/@babel/types/lib/definitions/deprecated-aliases.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.DEPRECATED_ALIASES = void 0;
    var DEPRECATED_ALIASES = exports.DEPRECATED_ALIASES = {
      ModuleDeclaration: "ImportOrExportDeclaration"
    };
  }
});

// ../node_modules/@babel/types/lib/definitions/index.js
var require_definitions = __commonJS({
  "../node_modules/@babel/types/lib/definitions/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "ALIAS_KEYS", {
      enumerable: true,
      get: function() {
        return _utils.ALIAS_KEYS;
      }
    });
    Object.defineProperty(exports, "BUILDER_KEYS", {
      enumerable: true,
      get: function() {
        return _utils.BUILDER_KEYS;
      }
    });
    Object.defineProperty(exports, "DEPRECATED_ALIASES", {
      enumerable: true,
      get: function() {
        return _deprecatedAliases.DEPRECATED_ALIASES;
      }
    });
    Object.defineProperty(exports, "DEPRECATED_KEYS", {
      enumerable: true,
      get: function() {
        return _utils.DEPRECATED_KEYS;
      }
    });
    Object.defineProperty(exports, "FLIPPED_ALIAS_KEYS", {
      enumerable: true,
      get: function() {
        return _utils.FLIPPED_ALIAS_KEYS;
      }
    });
    Object.defineProperty(exports, "NODE_FIELDS", {
      enumerable: true,
      get: function() {
        return _utils.NODE_FIELDS;
      }
    });
    Object.defineProperty(exports, "NODE_PARENT_VALIDATIONS", {
      enumerable: true,
      get: function() {
        return _utils.NODE_PARENT_VALIDATIONS;
      }
    });
    Object.defineProperty(exports, "NODE_UNION_SHAPES__PRIVATE", {
      enumerable: true,
      get: function() {
        return _utils.NODE_UNION_SHAPES__PRIVATE;
      }
    });
    Object.defineProperty(exports, "PLACEHOLDERS", {
      enumerable: true,
      get: function() {
        return _placeholders.PLACEHOLDERS;
      }
    });
    Object.defineProperty(exports, "PLACEHOLDERS_ALIAS", {
      enumerable: true,
      get: function() {
        return _placeholders.PLACEHOLDERS_ALIAS;
      }
    });
    Object.defineProperty(exports, "PLACEHOLDERS_FLIPPED_ALIAS", {
      enumerable: true,
      get: function() {
        return _placeholders.PLACEHOLDERS_FLIPPED_ALIAS;
      }
    });
    exports.TYPES = void 0;
    Object.defineProperty(exports, "VISITOR_KEYS", {
      enumerable: true,
      get: function() {
        return _utils.VISITOR_KEYS;
      }
    });
    require_core();
    require_flow();
    require_jsx();
    require_misc();
    require_experimental();
    require_typescript();
    var _utils = require_utils();
    var _placeholders = require_placeholders();
    var _deprecatedAliases = require_deprecated_aliases();
    Object.keys(_deprecatedAliases.DEPRECATED_ALIASES).forEach((deprecatedAlias) => {
      _utils.FLIPPED_ALIAS_KEYS[deprecatedAlias] = _utils.FLIPPED_ALIAS_KEYS[_deprecatedAliases.DEPRECATED_ALIASES[deprecatedAlias]];
    });
    for (const {
      types,
      set
    } of _utils.allExpandedTypes) {
      for (const type of types) {
        const aliases = _utils.FLIPPED_ALIAS_KEYS[type];
        if (aliases) {
          aliases.forEach(set.add, set);
        } else {
          set.add(type);
        }
      }
    }
    var TYPES = exports.TYPES = [].concat(Object.keys(_utils.VISITOR_KEYS), Object.keys(_utils.FLIPPED_ALIAS_KEYS), Object.keys(_utils.DEPRECATED_KEYS));
  }
});

// ../node_modules/@babel/types/lib/validators/validate.js
var require_validate = __commonJS({
  "../node_modules/@babel/types/lib/validators/validate.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = validate;
    exports.validateChild = validateChild;
    exports.validateField = validateField;
    exports.validateInternal = validateInternal;
    var _index = require_definitions();
    function validate(node, key, val) {
      if (!node) return;
      const fields = _index.NODE_FIELDS[node.type];
      if (!fields) return;
      const field = fields[key];
      validateField(node, key, val, field);
      validateChild(node, key, val);
    }
    function validateInternal(field, node, key, val, maybeNode) {
      if (!(field != null && field.validate)) return;
      if (field.optional && val == null) return;
      field.validate(node, key, val);
      if (maybeNode) {
        var _NODE_PARENT_VALIDATI;
        const type = val.type;
        if (type == null) return;
        (_NODE_PARENT_VALIDATI = _index.NODE_PARENT_VALIDATIONS[type]) == null || _NODE_PARENT_VALIDATI.call(_index.NODE_PARENT_VALIDATIONS, node, key, val);
      }
    }
    function validateField(node, key, val, field) {
      if (!(field != null && field.validate)) return;
      if (field.optional && val == null) return;
      field.validate(node, key, val);
    }
    function validateChild(node, key, val) {
      var _NODE_PARENT_VALIDATI2;
      const type = val == null ? void 0 : val.type;
      if (type == null) return;
      (_NODE_PARENT_VALIDATI2 = _index.NODE_PARENT_VALIDATIONS[type]) == null || _NODE_PARENT_VALIDATI2.call(_index.NODE_PARENT_VALIDATIONS, node, key, val);
    }
  }
});

// ../node_modules/@babel/types/lib/builders/generated/lowercase.js
var require_lowercase = __commonJS({
  "../node_modules/@babel/types/lib/builders/generated/lowercase.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.anyTypeAnnotation = anyTypeAnnotation;
    exports.argumentPlaceholder = argumentPlaceholder;
    exports.arrayExpression = arrayExpression;
    exports.arrayPattern = arrayPattern;
    exports.arrayTypeAnnotation = arrayTypeAnnotation;
    exports.arrowFunctionExpression = arrowFunctionExpression;
    exports.assignmentExpression = assignmentExpression;
    exports.assignmentPattern = assignmentPattern;
    exports.awaitExpression = awaitExpression;
    exports.bigIntLiteral = bigIntLiteral;
    exports.binaryExpression = binaryExpression;
    exports.bindExpression = bindExpression;
    exports.blockStatement = blockStatement;
    exports.booleanLiteral = booleanLiteral;
    exports.booleanLiteralTypeAnnotation = booleanLiteralTypeAnnotation;
    exports.booleanTypeAnnotation = booleanTypeAnnotation;
    exports.breakStatement = breakStatement;
    exports.callExpression = callExpression;
    exports.catchClause = catchClause;
    exports.classAccessorProperty = classAccessorProperty;
    exports.classBody = classBody;
    exports.classDeclaration = classDeclaration;
    exports.classExpression = classExpression;
    exports.classImplements = classImplements;
    exports.classMethod = classMethod;
    exports.classPrivateMethod = classPrivateMethod;
    exports.classPrivateProperty = classPrivateProperty;
    exports.classProperty = classProperty;
    exports.conditionalExpression = conditionalExpression;
    exports.continueStatement = continueStatement;
    exports.debuggerStatement = debuggerStatement;
    exports.decimalLiteral = decimalLiteral;
    exports.declareClass = declareClass;
    exports.declareExportAllDeclaration = declareExportAllDeclaration;
    exports.declareExportDeclaration = declareExportDeclaration;
    exports.declareFunction = declareFunction;
    exports.declareInterface = declareInterface;
    exports.declareModule = declareModule;
    exports.declareModuleExports = declareModuleExports;
    exports.declareOpaqueType = declareOpaqueType;
    exports.declareTypeAlias = declareTypeAlias;
    exports.declareVariable = declareVariable;
    exports.declaredPredicate = declaredPredicate;
    exports.decorator = decorator;
    exports.directive = directive;
    exports.directiveLiteral = directiveLiteral;
    exports.doExpression = doExpression;
    exports.doWhileStatement = doWhileStatement;
    exports.emptyStatement = emptyStatement;
    exports.emptyTypeAnnotation = emptyTypeAnnotation;
    exports.enumBooleanBody = enumBooleanBody;
    exports.enumBooleanMember = enumBooleanMember;
    exports.enumDeclaration = enumDeclaration;
    exports.enumDefaultedMember = enumDefaultedMember;
    exports.enumNumberBody = enumNumberBody;
    exports.enumNumberMember = enumNumberMember;
    exports.enumStringBody = enumStringBody;
    exports.enumStringMember = enumStringMember;
    exports.enumSymbolBody = enumSymbolBody;
    exports.existsTypeAnnotation = existsTypeAnnotation;
    exports.exportAllDeclaration = exportAllDeclaration;
    exports.exportDefaultDeclaration = exportDefaultDeclaration;
    exports.exportDefaultSpecifier = exportDefaultSpecifier;
    exports.exportNamedDeclaration = exportNamedDeclaration;
    exports.exportNamespaceSpecifier = exportNamespaceSpecifier;
    exports.exportSpecifier = exportSpecifier;
    exports.expressionStatement = expressionStatement;
    exports.file = file;
    exports.forInStatement = forInStatement;
    exports.forOfStatement = forOfStatement;
    exports.forStatement = forStatement;
    exports.functionDeclaration = functionDeclaration;
    exports.functionExpression = functionExpression;
    exports.functionTypeAnnotation = functionTypeAnnotation;
    exports.functionTypeParam = functionTypeParam;
    exports.genericTypeAnnotation = genericTypeAnnotation;
    exports.identifier = identifier;
    exports.ifStatement = ifStatement;
    exports.import = _import;
    exports.importAttribute = importAttribute;
    exports.importDeclaration = importDeclaration;
    exports.importDefaultSpecifier = importDefaultSpecifier;
    exports.importExpression = importExpression;
    exports.importNamespaceSpecifier = importNamespaceSpecifier;
    exports.importSpecifier = importSpecifier;
    exports.indexedAccessType = indexedAccessType;
    exports.inferredPredicate = inferredPredicate;
    exports.interfaceDeclaration = interfaceDeclaration;
    exports.interfaceExtends = interfaceExtends;
    exports.interfaceTypeAnnotation = interfaceTypeAnnotation;
    exports.interpreterDirective = interpreterDirective;
    exports.intersectionTypeAnnotation = intersectionTypeAnnotation;
    exports.jSXAttribute = exports.jsxAttribute = jsxAttribute;
    exports.jSXClosingElement = exports.jsxClosingElement = jsxClosingElement;
    exports.jSXClosingFragment = exports.jsxClosingFragment = jsxClosingFragment;
    exports.jSXElement = exports.jsxElement = jsxElement;
    exports.jSXEmptyExpression = exports.jsxEmptyExpression = jsxEmptyExpression;
    exports.jSXExpressionContainer = exports.jsxExpressionContainer = jsxExpressionContainer;
    exports.jSXFragment = exports.jsxFragment = jsxFragment;
    exports.jSXIdentifier = exports.jsxIdentifier = jsxIdentifier;
    exports.jSXMemberExpression = exports.jsxMemberExpression = jsxMemberExpression;
    exports.jSXNamespacedName = exports.jsxNamespacedName = jsxNamespacedName;
    exports.jSXOpeningElement = exports.jsxOpeningElement = jsxOpeningElement;
    exports.jSXOpeningFragment = exports.jsxOpeningFragment = jsxOpeningFragment;
    exports.jSXSpreadAttribute = exports.jsxSpreadAttribute = jsxSpreadAttribute;
    exports.jSXSpreadChild = exports.jsxSpreadChild = jsxSpreadChild;
    exports.jSXText = exports.jsxText = jsxText;
    exports.labeledStatement = labeledStatement;
    exports.logicalExpression = logicalExpression;
    exports.memberExpression = memberExpression;
    exports.metaProperty = metaProperty;
    exports.mixedTypeAnnotation = mixedTypeAnnotation;
    exports.moduleExpression = moduleExpression;
    exports.newExpression = newExpression;
    exports.noop = noop;
    exports.nullLiteral = nullLiteral;
    exports.nullLiteralTypeAnnotation = nullLiteralTypeAnnotation;
    exports.nullableTypeAnnotation = nullableTypeAnnotation;
    exports.numberLiteral = NumberLiteral;
    exports.numberLiteralTypeAnnotation = numberLiteralTypeAnnotation;
    exports.numberTypeAnnotation = numberTypeAnnotation;
    exports.numericLiteral = numericLiteral;
    exports.objectExpression = objectExpression;
    exports.objectMethod = objectMethod;
    exports.objectPattern = objectPattern;
    exports.objectProperty = objectProperty;
    exports.objectTypeAnnotation = objectTypeAnnotation;
    exports.objectTypeCallProperty = objectTypeCallProperty;
    exports.objectTypeIndexer = objectTypeIndexer;
    exports.objectTypeInternalSlot = objectTypeInternalSlot;
    exports.objectTypeProperty = objectTypeProperty;
    exports.objectTypeSpreadProperty = objectTypeSpreadProperty;
    exports.opaqueType = opaqueType;
    exports.optionalCallExpression = optionalCallExpression;
    exports.optionalIndexedAccessType = optionalIndexedAccessType;
    exports.optionalMemberExpression = optionalMemberExpression;
    exports.parenthesizedExpression = parenthesizedExpression;
    exports.pipelineBareFunction = pipelineBareFunction;
    exports.pipelinePrimaryTopicReference = pipelinePrimaryTopicReference;
    exports.pipelineTopicExpression = pipelineTopicExpression;
    exports.placeholder = placeholder;
    exports.privateName = privateName;
    exports.program = program;
    exports.qualifiedTypeIdentifier = qualifiedTypeIdentifier;
    exports.recordExpression = recordExpression;
    exports.regExpLiteral = regExpLiteral;
    exports.regexLiteral = RegexLiteral;
    exports.restElement = restElement;
    exports.restProperty = RestProperty;
    exports.returnStatement = returnStatement;
    exports.sequenceExpression = sequenceExpression;
    exports.spreadElement = spreadElement;
    exports.spreadProperty = SpreadProperty;
    exports.staticBlock = staticBlock;
    exports.stringLiteral = stringLiteral;
    exports.stringLiteralTypeAnnotation = stringLiteralTypeAnnotation;
    exports.stringTypeAnnotation = stringTypeAnnotation;
    exports.super = _super;
    exports.switchCase = switchCase;
    exports.switchStatement = switchStatement;
    exports.symbolTypeAnnotation = symbolTypeAnnotation;
    exports.taggedTemplateExpression = taggedTemplateExpression;
    exports.templateElement = templateElement;
    exports.templateLiteral = templateLiteral;
    exports.thisExpression = thisExpression;
    exports.thisTypeAnnotation = thisTypeAnnotation;
    exports.throwStatement = throwStatement;
    exports.topicReference = topicReference;
    exports.tryStatement = tryStatement;
    exports.tSAnyKeyword = exports.tsAnyKeyword = tsAnyKeyword;
    exports.tSArrayType = exports.tsArrayType = tsArrayType;
    exports.tSAsExpression = exports.tsAsExpression = tsAsExpression;
    exports.tSBigIntKeyword = exports.tsBigIntKeyword = tsBigIntKeyword;
    exports.tSBooleanKeyword = exports.tsBooleanKeyword = tsBooleanKeyword;
    exports.tSCallSignatureDeclaration = exports.tsCallSignatureDeclaration = tsCallSignatureDeclaration;
    exports.tSConditionalType = exports.tsConditionalType = tsConditionalType;
    exports.tSConstructSignatureDeclaration = exports.tsConstructSignatureDeclaration = tsConstructSignatureDeclaration;
    exports.tSConstructorType = exports.tsConstructorType = tsConstructorType;
    exports.tSDeclareFunction = exports.tsDeclareFunction = tsDeclareFunction;
    exports.tSDeclareMethod = exports.tsDeclareMethod = tsDeclareMethod;
    exports.tSEnumBody = exports.tsEnumBody = tsEnumBody;
    exports.tSEnumDeclaration = exports.tsEnumDeclaration = tsEnumDeclaration;
    exports.tSEnumMember = exports.tsEnumMember = tsEnumMember;
    exports.tSExportAssignment = exports.tsExportAssignment = tsExportAssignment;
    exports.tSExpressionWithTypeArguments = exports.tsExpressionWithTypeArguments = tsExpressionWithTypeArguments;
    exports.tSExternalModuleReference = exports.tsExternalModuleReference = tsExternalModuleReference;
    exports.tSFunctionType = exports.tsFunctionType = tsFunctionType;
    exports.tSImportEqualsDeclaration = exports.tsImportEqualsDeclaration = tsImportEqualsDeclaration;
    exports.tSImportType = exports.tsImportType = tsImportType;
    exports.tSIndexSignature = exports.tsIndexSignature = tsIndexSignature;
    exports.tSIndexedAccessType = exports.tsIndexedAccessType = tsIndexedAccessType;
    exports.tSInferType = exports.tsInferType = tsInferType;
    exports.tSInstantiationExpression = exports.tsInstantiationExpression = tsInstantiationExpression;
    exports.tSInterfaceBody = exports.tsInterfaceBody = tsInterfaceBody;
    exports.tSInterfaceDeclaration = exports.tsInterfaceDeclaration = tsInterfaceDeclaration;
    exports.tSIntersectionType = exports.tsIntersectionType = tsIntersectionType;
    exports.tSIntrinsicKeyword = exports.tsIntrinsicKeyword = tsIntrinsicKeyword;
    exports.tSLiteralType = exports.tsLiteralType = tsLiteralType;
    exports.tSMappedType = exports.tsMappedType = tsMappedType;
    exports.tSMethodSignature = exports.tsMethodSignature = tsMethodSignature;
    exports.tSModuleBlock = exports.tsModuleBlock = tsModuleBlock;
    exports.tSModuleDeclaration = exports.tsModuleDeclaration = tsModuleDeclaration;
    exports.tSNamedTupleMember = exports.tsNamedTupleMember = tsNamedTupleMember;
    exports.tSNamespaceExportDeclaration = exports.tsNamespaceExportDeclaration = tsNamespaceExportDeclaration;
    exports.tSNeverKeyword = exports.tsNeverKeyword = tsNeverKeyword;
    exports.tSNonNullExpression = exports.tsNonNullExpression = tsNonNullExpression;
    exports.tSNullKeyword = exports.tsNullKeyword = tsNullKeyword;
    exports.tSNumberKeyword = exports.tsNumberKeyword = tsNumberKeyword;
    exports.tSObjectKeyword = exports.tsObjectKeyword = tsObjectKeyword;
    exports.tSOptionalType = exports.tsOptionalType = tsOptionalType;
    exports.tSParameterProperty = exports.tsParameterProperty = tsParameterProperty;
    exports.tSParenthesizedType = exports.tsParenthesizedType = tsParenthesizedType;
    exports.tSPropertySignature = exports.tsPropertySignature = tsPropertySignature;
    exports.tSQualifiedName = exports.tsQualifiedName = tsQualifiedName;
    exports.tSRestType = exports.tsRestType = tsRestType;
    exports.tSSatisfiesExpression = exports.tsSatisfiesExpression = tsSatisfiesExpression;
    exports.tSStringKeyword = exports.tsStringKeyword = tsStringKeyword;
    exports.tSSymbolKeyword = exports.tsSymbolKeyword = tsSymbolKeyword;
    exports.tSTemplateLiteralType = exports.tsTemplateLiteralType = tsTemplateLiteralType;
    exports.tSThisType = exports.tsThisType = tsThisType;
    exports.tSTupleType = exports.tsTupleType = tsTupleType;
    exports.tSTypeAliasDeclaration = exports.tsTypeAliasDeclaration = tsTypeAliasDeclaration;
    exports.tSTypeAnnotation = exports.tsTypeAnnotation = tsTypeAnnotation;
    exports.tSTypeAssertion = exports.tsTypeAssertion = tsTypeAssertion;
    exports.tSTypeLiteral = exports.tsTypeLiteral = tsTypeLiteral;
    exports.tSTypeOperator = exports.tsTypeOperator = tsTypeOperator;
    exports.tSTypeParameter = exports.tsTypeParameter = tsTypeParameter;
    exports.tSTypeParameterDeclaration = exports.tsTypeParameterDeclaration = tsTypeParameterDeclaration;
    exports.tSTypeParameterInstantiation = exports.tsTypeParameterInstantiation = tsTypeParameterInstantiation;
    exports.tSTypePredicate = exports.tsTypePredicate = tsTypePredicate;
    exports.tSTypeQuery = exports.tsTypeQuery = tsTypeQuery;
    exports.tSTypeReference = exports.tsTypeReference = tsTypeReference;
    exports.tSUndefinedKeyword = exports.tsUndefinedKeyword = tsUndefinedKeyword;
    exports.tSUnionType = exports.tsUnionType = tsUnionType;
    exports.tSUnknownKeyword = exports.tsUnknownKeyword = tsUnknownKeyword;
    exports.tSVoidKeyword = exports.tsVoidKeyword = tsVoidKeyword;
    exports.tupleExpression = tupleExpression;
    exports.tupleTypeAnnotation = tupleTypeAnnotation;
    exports.typeAlias = typeAlias;
    exports.typeAnnotation = typeAnnotation;
    exports.typeCastExpression = typeCastExpression;
    exports.typeParameter = typeParameter;
    exports.typeParameterDeclaration = typeParameterDeclaration;
    exports.typeParameterInstantiation = typeParameterInstantiation;
    exports.typeofTypeAnnotation = typeofTypeAnnotation;
    exports.unaryExpression = unaryExpression;
    exports.unionTypeAnnotation = unionTypeAnnotation;
    exports.updateExpression = updateExpression;
    exports.v8IntrinsicIdentifier = v8IntrinsicIdentifier;
    exports.variableDeclaration = variableDeclaration;
    exports.variableDeclarator = variableDeclarator;
    exports.variance = variance;
    exports.voidPattern = voidPattern;
    exports.voidTypeAnnotation = voidTypeAnnotation;
    exports.whileStatement = whileStatement;
    exports.withStatement = withStatement;
    exports.yieldExpression = yieldExpression;
    var _validate = require_validate();
    var _deprecationWarning = require_deprecationWarning();
    var utils = require_utils();
    var {
      validateInternal: validate
    } = _validate;
    var {
      NODE_FIELDS
    } = utils;
    function bigIntLiteral(value) {
      if (typeof value === "bigint") {
        value = value.toString();
      }
      const node = {
        type: "BigIntLiteral",
        value
      };
      const defs = NODE_FIELDS.BigIntLiteral;
      validate(defs.value, node, "value", value);
      return node;
    }
    function arrayExpression(elements = []) {
      const node = {
        type: "ArrayExpression",
        elements
      };
      const defs = NODE_FIELDS.ArrayExpression;
      validate(defs.elements, node, "elements", elements, 1);
      return node;
    }
    function assignmentExpression(operator, left, right) {
      const node = {
        type: "AssignmentExpression",
        operator,
        left,
        right
      };
      const defs = NODE_FIELDS.AssignmentExpression;
      validate(defs.operator, node, "operator", operator);
      validate(defs.left, node, "left", left, 1);
      validate(defs.right, node, "right", right, 1);
      return node;
    }
    function binaryExpression(operator, left, right) {
      const node = {
        type: "BinaryExpression",
        operator,
        left,
        right
      };
      const defs = NODE_FIELDS.BinaryExpression;
      validate(defs.operator, node, "operator", operator);
      validate(defs.left, node, "left", left, 1);
      validate(defs.right, node, "right", right, 1);
      return node;
    }
    function interpreterDirective(value) {
      const node = {
        type: "InterpreterDirective",
        value
      };
      const defs = NODE_FIELDS.InterpreterDirective;
      validate(defs.value, node, "value", value);
      return node;
    }
    function directive(value) {
      const node = {
        type: "Directive",
        value
      };
      const defs = NODE_FIELDS.Directive;
      validate(defs.value, node, "value", value, 1);
      return node;
    }
    function directiveLiteral(value) {
      const node = {
        type: "DirectiveLiteral",
        value
      };
      const defs = NODE_FIELDS.DirectiveLiteral;
      validate(defs.value, node, "value", value);
      return node;
    }
    function blockStatement(body, directives = []) {
      const node = {
        type: "BlockStatement",
        body,
        directives
      };
      const defs = NODE_FIELDS.BlockStatement;
      validate(defs.body, node, "body", body, 1);
      validate(defs.directives, node, "directives", directives, 1);
      return node;
    }
    function breakStatement(label = null) {
      const node = {
        type: "BreakStatement",
        label
      };
      const defs = NODE_FIELDS.BreakStatement;
      validate(defs.label, node, "label", label, 1);
      return node;
    }
    function callExpression(callee, _arguments) {
      const node = {
        type: "CallExpression",
        callee,
        arguments: _arguments
      };
      const defs = NODE_FIELDS.CallExpression;
      validate(defs.callee, node, "callee", callee, 1);
      validate(defs.arguments, node, "arguments", _arguments, 1);
      return node;
    }
    function catchClause(param = null, body) {
      const node = {
        type: "CatchClause",
        param,
        body
      };
      const defs = NODE_FIELDS.CatchClause;
      validate(defs.param, node, "param", param, 1);
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function conditionalExpression(test, consequent, alternate) {
      const node = {
        type: "ConditionalExpression",
        test,
        consequent,
        alternate
      };
      const defs = NODE_FIELDS.ConditionalExpression;
      validate(defs.test, node, "test", test, 1);
      validate(defs.consequent, node, "consequent", consequent, 1);
      validate(defs.alternate, node, "alternate", alternate, 1);
      return node;
    }
    function continueStatement(label = null) {
      const node = {
        type: "ContinueStatement",
        label
      };
      const defs = NODE_FIELDS.ContinueStatement;
      validate(defs.label, node, "label", label, 1);
      return node;
    }
    function debuggerStatement() {
      return {
        type: "DebuggerStatement"
      };
    }
    function doWhileStatement(test, body) {
      const node = {
        type: "DoWhileStatement",
        test,
        body
      };
      const defs = NODE_FIELDS.DoWhileStatement;
      validate(defs.test, node, "test", test, 1);
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function emptyStatement() {
      return {
        type: "EmptyStatement"
      };
    }
    function expressionStatement(expression) {
      const node = {
        type: "ExpressionStatement",
        expression
      };
      const defs = NODE_FIELDS.ExpressionStatement;
      validate(defs.expression, node, "expression", expression, 1);
      return node;
    }
    function file(program2, comments = null, tokens = null) {
      const node = {
        type: "File",
        program: program2,
        comments,
        tokens
      };
      const defs = NODE_FIELDS.File;
      validate(defs.program, node, "program", program2, 1);
      validate(defs.comments, node, "comments", comments, 1);
      validate(defs.tokens, node, "tokens", tokens);
      return node;
    }
    function forInStatement(left, right, body) {
      const node = {
        type: "ForInStatement",
        left,
        right,
        body
      };
      const defs = NODE_FIELDS.ForInStatement;
      validate(defs.left, node, "left", left, 1);
      validate(defs.right, node, "right", right, 1);
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function forStatement(init = null, test = null, update = null, body) {
      const node = {
        type: "ForStatement",
        init,
        test,
        update,
        body
      };
      const defs = NODE_FIELDS.ForStatement;
      validate(defs.init, node, "init", init, 1);
      validate(defs.test, node, "test", test, 1);
      validate(defs.update, node, "update", update, 1);
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function functionDeclaration(id = null, params, body, generator = false, async = false) {
      const node = {
        type: "FunctionDeclaration",
        id,
        params,
        body,
        generator,
        async
      };
      const defs = NODE_FIELDS.FunctionDeclaration;
      validate(defs.id, node, "id", id, 1);
      validate(defs.params, node, "params", params, 1);
      validate(defs.body, node, "body", body, 1);
      validate(defs.generator, node, "generator", generator);
      validate(defs.async, node, "async", async);
      return node;
    }
    function functionExpression(id = null, params, body, generator = false, async = false) {
      const node = {
        type: "FunctionExpression",
        id,
        params,
        body,
        generator,
        async
      };
      const defs = NODE_FIELDS.FunctionExpression;
      validate(defs.id, node, "id", id, 1);
      validate(defs.params, node, "params", params, 1);
      validate(defs.body, node, "body", body, 1);
      validate(defs.generator, node, "generator", generator);
      validate(defs.async, node, "async", async);
      return node;
    }
    function identifier(name) {
      const node = {
        type: "Identifier",
        name
      };
      const defs = NODE_FIELDS.Identifier;
      validate(defs.name, node, "name", name);
      return node;
    }
    function ifStatement(test, consequent, alternate = null) {
      const node = {
        type: "IfStatement",
        test,
        consequent,
        alternate
      };
      const defs = NODE_FIELDS.IfStatement;
      validate(defs.test, node, "test", test, 1);
      validate(defs.consequent, node, "consequent", consequent, 1);
      validate(defs.alternate, node, "alternate", alternate, 1);
      return node;
    }
    function labeledStatement(label, body) {
      const node = {
        type: "LabeledStatement",
        label,
        body
      };
      const defs = NODE_FIELDS.LabeledStatement;
      validate(defs.label, node, "label", label, 1);
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function stringLiteral(value) {
      const node = {
        type: "StringLiteral",
        value
      };
      const defs = NODE_FIELDS.StringLiteral;
      validate(defs.value, node, "value", value);
      return node;
    }
    function numericLiteral(value) {
      const node = {
        type: "NumericLiteral",
        value
      };
      const defs = NODE_FIELDS.NumericLiteral;
      validate(defs.value, node, "value", value);
      return node;
    }
    function nullLiteral() {
      return {
        type: "NullLiteral"
      };
    }
    function booleanLiteral(value) {
      const node = {
        type: "BooleanLiteral",
        value
      };
      const defs = NODE_FIELDS.BooleanLiteral;
      validate(defs.value, node, "value", value);
      return node;
    }
    function regExpLiteral(pattern, flags = "") {
      const node = {
        type: "RegExpLiteral",
        pattern,
        flags
      };
      const defs = NODE_FIELDS.RegExpLiteral;
      validate(defs.pattern, node, "pattern", pattern);
      validate(defs.flags, node, "flags", flags);
      return node;
    }
    function logicalExpression(operator, left, right) {
      const node = {
        type: "LogicalExpression",
        operator,
        left,
        right
      };
      const defs = NODE_FIELDS.LogicalExpression;
      validate(defs.operator, node, "operator", operator);
      validate(defs.left, node, "left", left, 1);
      validate(defs.right, node, "right", right, 1);
      return node;
    }
    function memberExpression(object, property, computed = false, optional = null) {
      const node = {
        type: "MemberExpression",
        object,
        property,
        computed,
        optional
      };
      const defs = NODE_FIELDS.MemberExpression;
      validate(defs.object, node, "object", object, 1);
      validate(defs.property, node, "property", property, 1);
      validate(defs.computed, node, "computed", computed);
      validate(defs.optional, node, "optional", optional);
      return node;
    }
    function newExpression(callee, _arguments) {
      const node = {
        type: "NewExpression",
        callee,
        arguments: _arguments,
        typeParameters: null
      };
      const defs = NODE_FIELDS.NewExpression;
      validate(defs.callee, node, "callee", callee, 1);
      validate(defs.arguments, node, "arguments", _arguments, 1);
      return node;
    }
    function program(body, directives = [], sourceType = "script", interpreter = null) {
      const node = {
        type: "Program",
        body,
        directives,
        sourceType,
        interpreter
      };
      const defs = NODE_FIELDS.Program;
      validate(defs.body, node, "body", body, 1);
      validate(defs.directives, node, "directives", directives, 1);
      validate(defs.sourceType, node, "sourceType", sourceType);
      validate(defs.interpreter, node, "interpreter", interpreter, 1);
      return node;
    }
    function objectExpression(properties) {
      const node = {
        type: "ObjectExpression",
        properties
      };
      const defs = NODE_FIELDS.ObjectExpression;
      validate(defs.properties, node, "properties", properties, 1);
      return node;
    }
    function objectMethod(kind = "method", key, params, body, computed = false, generator = false, async = false) {
      const node = {
        type: "ObjectMethod",
        kind,
        key,
        params,
        body,
        computed,
        generator,
        async
      };
      const defs = NODE_FIELDS.ObjectMethod;
      validate(defs.kind, node, "kind", kind);
      validate(defs.key, node, "key", key, 1);
      validate(defs.params, node, "params", params, 1);
      validate(defs.body, node, "body", body, 1);
      validate(defs.computed, node, "computed", computed);
      validate(defs.generator, node, "generator", generator);
      validate(defs.async, node, "async", async);
      return node;
    }
    function objectProperty(key, value, computed = false, shorthand = false, decorators = null) {
      const node = {
        type: "ObjectProperty",
        key,
        value,
        computed,
        shorthand,
        decorators
      };
      const defs = NODE_FIELDS.ObjectProperty;
      validate(defs.key, node, "key", key, 1);
      validate(defs.value, node, "value", value, 1);
      validate(defs.computed, node, "computed", computed);
      validate(defs.shorthand, node, "shorthand", shorthand);
      validate(defs.decorators, node, "decorators", decorators, 1);
      return node;
    }
    function restElement(argument) {
      const node = {
        type: "RestElement",
        argument
      };
      const defs = NODE_FIELDS.RestElement;
      validate(defs.argument, node, "argument", argument, 1);
      return node;
    }
    function returnStatement(argument = null) {
      const node = {
        type: "ReturnStatement",
        argument
      };
      const defs = NODE_FIELDS.ReturnStatement;
      validate(defs.argument, node, "argument", argument, 1);
      return node;
    }
    function sequenceExpression(expressions) {
      const node = {
        type: "SequenceExpression",
        expressions
      };
      const defs = NODE_FIELDS.SequenceExpression;
      validate(defs.expressions, node, "expressions", expressions, 1);
      return node;
    }
    function parenthesizedExpression(expression) {
      const node = {
        type: "ParenthesizedExpression",
        expression
      };
      const defs = NODE_FIELDS.ParenthesizedExpression;
      validate(defs.expression, node, "expression", expression, 1);
      return node;
    }
    function switchCase(test = null, consequent) {
      const node = {
        type: "SwitchCase",
        test,
        consequent
      };
      const defs = NODE_FIELDS.SwitchCase;
      validate(defs.test, node, "test", test, 1);
      validate(defs.consequent, node, "consequent", consequent, 1);
      return node;
    }
    function switchStatement(discriminant, cases) {
      const node = {
        type: "SwitchStatement",
        discriminant,
        cases
      };
      const defs = NODE_FIELDS.SwitchStatement;
      validate(defs.discriminant, node, "discriminant", discriminant, 1);
      validate(defs.cases, node, "cases", cases, 1);
      return node;
    }
    function thisExpression() {
      return {
        type: "ThisExpression"
      };
    }
    function throwStatement(argument) {
      const node = {
        type: "ThrowStatement",
        argument
      };
      const defs = NODE_FIELDS.ThrowStatement;
      validate(defs.argument, node, "argument", argument, 1);
      return node;
    }
    function tryStatement(block, handler = null, finalizer = null) {
      const node = {
        type: "TryStatement",
        block,
        handler,
        finalizer
      };
      const defs = NODE_FIELDS.TryStatement;
      validate(defs.block, node, "block", block, 1);
      validate(defs.handler, node, "handler", handler, 1);
      validate(defs.finalizer, node, "finalizer", finalizer, 1);
      return node;
    }
    function unaryExpression(operator, argument, prefix = true) {
      const node = {
        type: "UnaryExpression",
        operator,
        argument,
        prefix
      };
      const defs = NODE_FIELDS.UnaryExpression;
      validate(defs.operator, node, "operator", operator);
      validate(defs.argument, node, "argument", argument, 1);
      validate(defs.prefix, node, "prefix", prefix);
      return node;
    }
    function updateExpression(operator, argument, prefix = false) {
      const node = {
        type: "UpdateExpression",
        operator,
        argument,
        prefix
      };
      const defs = NODE_FIELDS.UpdateExpression;
      validate(defs.operator, node, "operator", operator);
      validate(defs.argument, node, "argument", argument, 1);
      validate(defs.prefix, node, "prefix", prefix);
      return node;
    }
    function variableDeclaration(kind, declarations) {
      const node = {
        type: "VariableDeclaration",
        kind,
        declarations
      };
      const defs = NODE_FIELDS.VariableDeclaration;
      validate(defs.kind, node, "kind", kind);
      validate(defs.declarations, node, "declarations", declarations, 1);
      return node;
    }
    function variableDeclarator(id, init = null) {
      const node = {
        type: "VariableDeclarator",
        id,
        init
      };
      const defs = NODE_FIELDS.VariableDeclarator;
      validate(defs.id, node, "id", id, 1);
      validate(defs.init, node, "init", init, 1);
      return node;
    }
    function whileStatement(test, body) {
      const node = {
        type: "WhileStatement",
        test,
        body
      };
      const defs = NODE_FIELDS.WhileStatement;
      validate(defs.test, node, "test", test, 1);
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function withStatement(object, body) {
      const node = {
        type: "WithStatement",
        object,
        body
      };
      const defs = NODE_FIELDS.WithStatement;
      validate(defs.object, node, "object", object, 1);
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function assignmentPattern(left, right) {
      const node = {
        type: "AssignmentPattern",
        left,
        right
      };
      const defs = NODE_FIELDS.AssignmentPattern;
      validate(defs.left, node, "left", left, 1);
      validate(defs.right, node, "right", right, 1);
      return node;
    }
    function arrayPattern(elements) {
      const node = {
        type: "ArrayPattern",
        elements
      };
      const defs = NODE_FIELDS.ArrayPattern;
      validate(defs.elements, node, "elements", elements, 1);
      return node;
    }
    function arrowFunctionExpression(params, body, async = false) {
      const node = {
        type: "ArrowFunctionExpression",
        params,
        body,
        async,
        expression: null
      };
      const defs = NODE_FIELDS.ArrowFunctionExpression;
      validate(defs.params, node, "params", params, 1);
      validate(defs.body, node, "body", body, 1);
      validate(defs.async, node, "async", async);
      return node;
    }
    function classBody(body) {
      const node = {
        type: "ClassBody",
        body
      };
      const defs = NODE_FIELDS.ClassBody;
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function classExpression(id = null, superClass = null, body, decorators = null) {
      const node = {
        type: "ClassExpression",
        id,
        superClass,
        body,
        decorators
      };
      const defs = NODE_FIELDS.ClassExpression;
      validate(defs.id, node, "id", id, 1);
      validate(defs.superClass, node, "superClass", superClass, 1);
      validate(defs.body, node, "body", body, 1);
      validate(defs.decorators, node, "decorators", decorators, 1);
      return node;
    }
    function classDeclaration(id = null, superClass = null, body, decorators = null) {
      const node = {
        type: "ClassDeclaration",
        id,
        superClass,
        body,
        decorators
      };
      const defs = NODE_FIELDS.ClassDeclaration;
      validate(defs.id, node, "id", id, 1);
      validate(defs.superClass, node, "superClass", superClass, 1);
      validate(defs.body, node, "body", body, 1);
      validate(defs.decorators, node, "decorators", decorators, 1);
      return node;
    }
    function exportAllDeclaration(source, attributes = null) {
      const node = {
        type: "ExportAllDeclaration",
        source,
        attributes
      };
      const defs = NODE_FIELDS.ExportAllDeclaration;
      validate(defs.source, node, "source", source, 1);
      validate(defs.attributes, node, "attributes", attributes, 1);
      return node;
    }
    function exportDefaultDeclaration(declaration) {
      const node = {
        type: "ExportDefaultDeclaration",
        declaration
      };
      const defs = NODE_FIELDS.ExportDefaultDeclaration;
      validate(defs.declaration, node, "declaration", declaration, 1);
      return node;
    }
    function exportNamedDeclaration(declaration = null, specifiers = [], source = null, attributes = null) {
      const node = {
        type: "ExportNamedDeclaration",
        declaration,
        specifiers,
        source,
        attributes
      };
      const defs = NODE_FIELDS.ExportNamedDeclaration;
      validate(defs.declaration, node, "declaration", declaration, 1);
      validate(defs.specifiers, node, "specifiers", specifiers, 1);
      validate(defs.source, node, "source", source, 1);
      validate(defs.attributes, node, "attributes", attributes, 1);
      return node;
    }
    function exportSpecifier(local, exported) {
      const node = {
        type: "ExportSpecifier",
        local,
        exported
      };
      const defs = NODE_FIELDS.ExportSpecifier;
      validate(defs.local, node, "local", local, 1);
      validate(defs.exported, node, "exported", exported, 1);
      return node;
    }
    function forOfStatement(left, right, body, _await = false) {
      const node = {
        type: "ForOfStatement",
        left,
        right,
        body,
        await: _await
      };
      const defs = NODE_FIELDS.ForOfStatement;
      validate(defs.left, node, "left", left, 1);
      validate(defs.right, node, "right", right, 1);
      validate(defs.body, node, "body", body, 1);
      validate(defs.await, node, "await", _await);
      return node;
    }
    function importDeclaration(specifiers, source, attributes = null) {
      const node = {
        type: "ImportDeclaration",
        specifiers,
        source,
        attributes
      };
      const defs = NODE_FIELDS.ImportDeclaration;
      validate(defs.specifiers, node, "specifiers", specifiers, 1);
      validate(defs.source, node, "source", source, 1);
      validate(defs.attributes, node, "attributes", attributes, 1);
      return node;
    }
    function importDefaultSpecifier(local) {
      const node = {
        type: "ImportDefaultSpecifier",
        local
      };
      const defs = NODE_FIELDS.ImportDefaultSpecifier;
      validate(defs.local, node, "local", local, 1);
      return node;
    }
    function importNamespaceSpecifier(local) {
      const node = {
        type: "ImportNamespaceSpecifier",
        local
      };
      const defs = NODE_FIELDS.ImportNamespaceSpecifier;
      validate(defs.local, node, "local", local, 1);
      return node;
    }
    function importSpecifier(local, imported) {
      const node = {
        type: "ImportSpecifier",
        local,
        imported
      };
      const defs = NODE_FIELDS.ImportSpecifier;
      validate(defs.local, node, "local", local, 1);
      validate(defs.imported, node, "imported", imported, 1);
      return node;
    }
    function importExpression(source, options = null) {
      const node = {
        type: "ImportExpression",
        source,
        options
      };
      const defs = NODE_FIELDS.ImportExpression;
      validate(defs.source, node, "source", source, 1);
      validate(defs.options, node, "options", options, 1);
      return node;
    }
    function metaProperty(meta, property) {
      const node = {
        type: "MetaProperty",
        meta,
        property
      };
      const defs = NODE_FIELDS.MetaProperty;
      validate(defs.meta, node, "meta", meta, 1);
      validate(defs.property, node, "property", property, 1);
      return node;
    }
    function classMethod(kind = "method", key, params, body, computed = false, _static = false, generator = false, async = false) {
      const node = {
        type: "ClassMethod",
        kind,
        key,
        params,
        body,
        computed,
        static: _static,
        generator,
        async
      };
      const defs = NODE_FIELDS.ClassMethod;
      validate(defs.kind, node, "kind", kind);
      validate(defs.key, node, "key", key, 1);
      validate(defs.params, node, "params", params, 1);
      validate(defs.body, node, "body", body, 1);
      validate(defs.computed, node, "computed", computed);
      validate(defs.static, node, "static", _static);
      validate(defs.generator, node, "generator", generator);
      validate(defs.async, node, "async", async);
      return node;
    }
    function objectPattern(properties) {
      const node = {
        type: "ObjectPattern",
        properties
      };
      const defs = NODE_FIELDS.ObjectPattern;
      validate(defs.properties, node, "properties", properties, 1);
      return node;
    }
    function spreadElement(argument) {
      const node = {
        type: "SpreadElement",
        argument
      };
      const defs = NODE_FIELDS.SpreadElement;
      validate(defs.argument, node, "argument", argument, 1);
      return node;
    }
    function _super() {
      return {
        type: "Super"
      };
    }
    function taggedTemplateExpression(tag, quasi) {
      const node = {
        type: "TaggedTemplateExpression",
        tag,
        quasi
      };
      const defs = NODE_FIELDS.TaggedTemplateExpression;
      validate(defs.tag, node, "tag", tag, 1);
      validate(defs.quasi, node, "quasi", quasi, 1);
      return node;
    }
    function templateElement(value, tail = false) {
      const node = {
        type: "TemplateElement",
        value,
        tail
      };
      const defs = NODE_FIELDS.TemplateElement;
      validate(defs.value, node, "value", value);
      validate(defs.tail, node, "tail", tail);
      return node;
    }
    function templateLiteral(quasis, expressions) {
      const node = {
        type: "TemplateLiteral",
        quasis,
        expressions
      };
      const defs = NODE_FIELDS.TemplateLiteral;
      validate(defs.quasis, node, "quasis", quasis, 1);
      validate(defs.expressions, node, "expressions", expressions, 1);
      return node;
    }
    function yieldExpression(argument = null, delegate = false) {
      const node = {
        type: "YieldExpression",
        argument,
        delegate
      };
      const defs = NODE_FIELDS.YieldExpression;
      validate(defs.argument, node, "argument", argument, 1);
      validate(defs.delegate, node, "delegate", delegate);
      return node;
    }
    function awaitExpression(argument) {
      const node = {
        type: "AwaitExpression",
        argument
      };
      const defs = NODE_FIELDS.AwaitExpression;
      validate(defs.argument, node, "argument", argument, 1);
      return node;
    }
    function _import() {
      return {
        type: "Import"
      };
    }
    function exportNamespaceSpecifier(exported) {
      const node = {
        type: "ExportNamespaceSpecifier",
        exported
      };
      const defs = NODE_FIELDS.ExportNamespaceSpecifier;
      validate(defs.exported, node, "exported", exported, 1);
      return node;
    }
    function optionalMemberExpression(object, property, computed = false, optional) {
      const node = {
        type: "OptionalMemberExpression",
        object,
        property,
        computed,
        optional
      };
      const defs = NODE_FIELDS.OptionalMemberExpression;
      validate(defs.object, node, "object", object, 1);
      validate(defs.property, node, "property", property, 1);
      validate(defs.computed, node, "computed", computed);
      validate(defs.optional, node, "optional", optional);
      return node;
    }
    function optionalCallExpression(callee, _arguments, optional) {
      const node = {
        type: "OptionalCallExpression",
        callee,
        arguments: _arguments,
        optional
      };
      const defs = NODE_FIELDS.OptionalCallExpression;
      validate(defs.callee, node, "callee", callee, 1);
      validate(defs.arguments, node, "arguments", _arguments, 1);
      validate(defs.optional, node, "optional", optional);
      return node;
    }
    function classProperty(key, value = null, typeAnnotation2 = null, decorators = null, computed = false, _static = false) {
      const node = {
        type: "ClassProperty",
        key,
        value,
        typeAnnotation: typeAnnotation2,
        decorators,
        computed,
        static: _static
      };
      const defs = NODE_FIELDS.ClassProperty;
      validate(defs.key, node, "key", key, 1);
      validate(defs.value, node, "value", value, 1);
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      validate(defs.decorators, node, "decorators", decorators, 1);
      validate(defs.computed, node, "computed", computed);
      validate(defs.static, node, "static", _static);
      return node;
    }
    function classAccessorProperty(key, value = null, typeAnnotation2 = null, decorators = null, computed = false, _static = false) {
      const node = {
        type: "ClassAccessorProperty",
        key,
        value,
        typeAnnotation: typeAnnotation2,
        decorators,
        computed,
        static: _static
      };
      const defs = NODE_FIELDS.ClassAccessorProperty;
      validate(defs.key, node, "key", key, 1);
      validate(defs.value, node, "value", value, 1);
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      validate(defs.decorators, node, "decorators", decorators, 1);
      validate(defs.computed, node, "computed", computed);
      validate(defs.static, node, "static", _static);
      return node;
    }
    function classPrivateProperty(key, value = null, decorators = null, _static = false) {
      const node = {
        type: "ClassPrivateProperty",
        key,
        value,
        decorators,
        static: _static
      };
      const defs = NODE_FIELDS.ClassPrivateProperty;
      validate(defs.key, node, "key", key, 1);
      validate(defs.value, node, "value", value, 1);
      validate(defs.decorators, node, "decorators", decorators, 1);
      validate(defs.static, node, "static", _static);
      return node;
    }
    function classPrivateMethod(kind = "method", key, params, body, _static = false) {
      const node = {
        type: "ClassPrivateMethod",
        kind,
        key,
        params,
        body,
        static: _static
      };
      const defs = NODE_FIELDS.ClassPrivateMethod;
      validate(defs.kind, node, "kind", kind);
      validate(defs.key, node, "key", key, 1);
      validate(defs.params, node, "params", params, 1);
      validate(defs.body, node, "body", body, 1);
      validate(defs.static, node, "static", _static);
      return node;
    }
    function privateName(id) {
      const node = {
        type: "PrivateName",
        id
      };
      const defs = NODE_FIELDS.PrivateName;
      validate(defs.id, node, "id", id, 1);
      return node;
    }
    function staticBlock(body) {
      const node = {
        type: "StaticBlock",
        body
      };
      const defs = NODE_FIELDS.StaticBlock;
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function importAttribute(key, value) {
      const node = {
        type: "ImportAttribute",
        key,
        value
      };
      const defs = NODE_FIELDS.ImportAttribute;
      validate(defs.key, node, "key", key, 1);
      validate(defs.value, node, "value", value, 1);
      return node;
    }
    function anyTypeAnnotation() {
      return {
        type: "AnyTypeAnnotation"
      };
    }
    function arrayTypeAnnotation(elementType) {
      const node = {
        type: "ArrayTypeAnnotation",
        elementType
      };
      const defs = NODE_FIELDS.ArrayTypeAnnotation;
      validate(defs.elementType, node, "elementType", elementType, 1);
      return node;
    }
    function booleanTypeAnnotation() {
      return {
        type: "BooleanTypeAnnotation"
      };
    }
    function booleanLiteralTypeAnnotation(value) {
      const node = {
        type: "BooleanLiteralTypeAnnotation",
        value
      };
      const defs = NODE_FIELDS.BooleanLiteralTypeAnnotation;
      validate(defs.value, node, "value", value);
      return node;
    }
    function nullLiteralTypeAnnotation() {
      return {
        type: "NullLiteralTypeAnnotation"
      };
    }
    function classImplements(id, typeParameters = null) {
      const node = {
        type: "ClassImplements",
        id,
        typeParameters
      };
      const defs = NODE_FIELDS.ClassImplements;
      validate(defs.id, node, "id", id, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      return node;
    }
    function declareClass(id, typeParameters = null, _extends = null, body) {
      const node = {
        type: "DeclareClass",
        id,
        typeParameters,
        extends: _extends,
        body
      };
      const defs = NODE_FIELDS.DeclareClass;
      validate(defs.id, node, "id", id, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      validate(defs.extends, node, "extends", _extends, 1);
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function declareFunction(id) {
      const node = {
        type: "DeclareFunction",
        id
      };
      const defs = NODE_FIELDS.DeclareFunction;
      validate(defs.id, node, "id", id, 1);
      return node;
    }
    function declareInterface(id, typeParameters = null, _extends = null, body) {
      const node = {
        type: "DeclareInterface",
        id,
        typeParameters,
        extends: _extends,
        body
      };
      const defs = NODE_FIELDS.DeclareInterface;
      validate(defs.id, node, "id", id, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      validate(defs.extends, node, "extends", _extends, 1);
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function declareModule(id, body, kind = null) {
      const node = {
        type: "DeclareModule",
        id,
        body,
        kind
      };
      const defs = NODE_FIELDS.DeclareModule;
      validate(defs.id, node, "id", id, 1);
      validate(defs.body, node, "body", body, 1);
      validate(defs.kind, node, "kind", kind);
      return node;
    }
    function declareModuleExports(typeAnnotation2) {
      const node = {
        type: "DeclareModuleExports",
        typeAnnotation: typeAnnotation2
      };
      const defs = NODE_FIELDS.DeclareModuleExports;
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function declareTypeAlias(id, typeParameters = null, right) {
      const node = {
        type: "DeclareTypeAlias",
        id,
        typeParameters,
        right
      };
      const defs = NODE_FIELDS.DeclareTypeAlias;
      validate(defs.id, node, "id", id, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      validate(defs.right, node, "right", right, 1);
      return node;
    }
    function declareOpaqueType(id, typeParameters = null, supertype = null) {
      const node = {
        type: "DeclareOpaqueType",
        id,
        typeParameters,
        supertype
      };
      const defs = NODE_FIELDS.DeclareOpaqueType;
      validate(defs.id, node, "id", id, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      validate(defs.supertype, node, "supertype", supertype, 1);
      return node;
    }
    function declareVariable(id) {
      const node = {
        type: "DeclareVariable",
        id
      };
      const defs = NODE_FIELDS.DeclareVariable;
      validate(defs.id, node, "id", id, 1);
      return node;
    }
    function declareExportDeclaration(declaration = null, specifiers = null, source = null, attributes = null) {
      const node = {
        type: "DeclareExportDeclaration",
        declaration,
        specifiers,
        source,
        attributes
      };
      const defs = NODE_FIELDS.DeclareExportDeclaration;
      validate(defs.declaration, node, "declaration", declaration, 1);
      validate(defs.specifiers, node, "specifiers", specifiers, 1);
      validate(defs.source, node, "source", source, 1);
      validate(defs.attributes, node, "attributes", attributes, 1);
      return node;
    }
    function declareExportAllDeclaration(source, attributes = null) {
      const node = {
        type: "DeclareExportAllDeclaration",
        source,
        attributes
      };
      const defs = NODE_FIELDS.DeclareExportAllDeclaration;
      validate(defs.source, node, "source", source, 1);
      validate(defs.attributes, node, "attributes", attributes, 1);
      return node;
    }
    function declaredPredicate(value) {
      const node = {
        type: "DeclaredPredicate",
        value
      };
      const defs = NODE_FIELDS.DeclaredPredicate;
      validate(defs.value, node, "value", value, 1);
      return node;
    }
    function existsTypeAnnotation() {
      return {
        type: "ExistsTypeAnnotation"
      };
    }
    function functionTypeAnnotation(typeParameters = null, params, rest = null, returnType) {
      const node = {
        type: "FunctionTypeAnnotation",
        typeParameters,
        params,
        rest,
        returnType
      };
      const defs = NODE_FIELDS.FunctionTypeAnnotation;
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      validate(defs.params, node, "params", params, 1);
      validate(defs.rest, node, "rest", rest, 1);
      validate(defs.returnType, node, "returnType", returnType, 1);
      return node;
    }
    function functionTypeParam(name = null, typeAnnotation2) {
      const node = {
        type: "FunctionTypeParam",
        name,
        typeAnnotation: typeAnnotation2
      };
      const defs = NODE_FIELDS.FunctionTypeParam;
      validate(defs.name, node, "name", name, 1);
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function genericTypeAnnotation(id, typeParameters = null) {
      const node = {
        type: "GenericTypeAnnotation",
        id,
        typeParameters
      };
      const defs = NODE_FIELDS.GenericTypeAnnotation;
      validate(defs.id, node, "id", id, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      return node;
    }
    function inferredPredicate() {
      return {
        type: "InferredPredicate"
      };
    }
    function interfaceExtends(id, typeParameters = null) {
      const node = {
        type: "InterfaceExtends",
        id,
        typeParameters
      };
      const defs = NODE_FIELDS.InterfaceExtends;
      validate(defs.id, node, "id", id, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      return node;
    }
    function interfaceDeclaration(id, typeParameters = null, _extends = null, body) {
      const node = {
        type: "InterfaceDeclaration",
        id,
        typeParameters,
        extends: _extends,
        body
      };
      const defs = NODE_FIELDS.InterfaceDeclaration;
      validate(defs.id, node, "id", id, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      validate(defs.extends, node, "extends", _extends, 1);
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function interfaceTypeAnnotation(_extends = null, body) {
      const node = {
        type: "InterfaceTypeAnnotation",
        extends: _extends,
        body
      };
      const defs = NODE_FIELDS.InterfaceTypeAnnotation;
      validate(defs.extends, node, "extends", _extends, 1);
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function intersectionTypeAnnotation(types) {
      const node = {
        type: "IntersectionTypeAnnotation",
        types
      };
      const defs = NODE_FIELDS.IntersectionTypeAnnotation;
      validate(defs.types, node, "types", types, 1);
      return node;
    }
    function mixedTypeAnnotation() {
      return {
        type: "MixedTypeAnnotation"
      };
    }
    function emptyTypeAnnotation() {
      return {
        type: "EmptyTypeAnnotation"
      };
    }
    function nullableTypeAnnotation(typeAnnotation2) {
      const node = {
        type: "NullableTypeAnnotation",
        typeAnnotation: typeAnnotation2
      };
      const defs = NODE_FIELDS.NullableTypeAnnotation;
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function numberLiteralTypeAnnotation(value) {
      const node = {
        type: "NumberLiteralTypeAnnotation",
        value
      };
      const defs = NODE_FIELDS.NumberLiteralTypeAnnotation;
      validate(defs.value, node, "value", value);
      return node;
    }
    function numberTypeAnnotation() {
      return {
        type: "NumberTypeAnnotation"
      };
    }
    function objectTypeAnnotation(properties, indexers = [], callProperties = [], internalSlots = [], exact = false) {
      const node = {
        type: "ObjectTypeAnnotation",
        properties,
        indexers,
        callProperties,
        internalSlots,
        exact
      };
      const defs = NODE_FIELDS.ObjectTypeAnnotation;
      validate(defs.properties, node, "properties", properties, 1);
      validate(defs.indexers, node, "indexers", indexers, 1);
      validate(defs.callProperties, node, "callProperties", callProperties, 1);
      validate(defs.internalSlots, node, "internalSlots", internalSlots, 1);
      validate(defs.exact, node, "exact", exact);
      return node;
    }
    function objectTypeInternalSlot(id, value, optional, _static, method) {
      const node = {
        type: "ObjectTypeInternalSlot",
        id,
        value,
        optional,
        static: _static,
        method
      };
      const defs = NODE_FIELDS.ObjectTypeInternalSlot;
      validate(defs.id, node, "id", id, 1);
      validate(defs.value, node, "value", value, 1);
      validate(defs.optional, node, "optional", optional);
      validate(defs.static, node, "static", _static);
      validate(defs.method, node, "method", method);
      return node;
    }
    function objectTypeCallProperty(value) {
      const node = {
        type: "ObjectTypeCallProperty",
        value,
        static: null
      };
      const defs = NODE_FIELDS.ObjectTypeCallProperty;
      validate(defs.value, node, "value", value, 1);
      return node;
    }
    function objectTypeIndexer(id = null, key, value, variance2 = null) {
      const node = {
        type: "ObjectTypeIndexer",
        id,
        key,
        value,
        variance: variance2,
        static: null
      };
      const defs = NODE_FIELDS.ObjectTypeIndexer;
      validate(defs.id, node, "id", id, 1);
      validate(defs.key, node, "key", key, 1);
      validate(defs.value, node, "value", value, 1);
      validate(defs.variance, node, "variance", variance2, 1);
      return node;
    }
    function objectTypeProperty(key, value, variance2 = null) {
      const node = {
        type: "ObjectTypeProperty",
        key,
        value,
        variance: variance2,
        kind: null,
        method: null,
        optional: null,
        proto: null,
        static: null
      };
      const defs = NODE_FIELDS.ObjectTypeProperty;
      validate(defs.key, node, "key", key, 1);
      validate(defs.value, node, "value", value, 1);
      validate(defs.variance, node, "variance", variance2, 1);
      return node;
    }
    function objectTypeSpreadProperty(argument) {
      const node = {
        type: "ObjectTypeSpreadProperty",
        argument
      };
      const defs = NODE_FIELDS.ObjectTypeSpreadProperty;
      validate(defs.argument, node, "argument", argument, 1);
      return node;
    }
    function opaqueType(id, typeParameters = null, supertype = null, impltype) {
      const node = {
        type: "OpaqueType",
        id,
        typeParameters,
        supertype,
        impltype
      };
      const defs = NODE_FIELDS.OpaqueType;
      validate(defs.id, node, "id", id, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      validate(defs.supertype, node, "supertype", supertype, 1);
      validate(defs.impltype, node, "impltype", impltype, 1);
      return node;
    }
    function qualifiedTypeIdentifier(id, qualification) {
      const node = {
        type: "QualifiedTypeIdentifier",
        id,
        qualification
      };
      const defs = NODE_FIELDS.QualifiedTypeIdentifier;
      validate(defs.id, node, "id", id, 1);
      validate(defs.qualification, node, "qualification", qualification, 1);
      return node;
    }
    function stringLiteralTypeAnnotation(value) {
      const node = {
        type: "StringLiteralTypeAnnotation",
        value
      };
      const defs = NODE_FIELDS.StringLiteralTypeAnnotation;
      validate(defs.value, node, "value", value);
      return node;
    }
    function stringTypeAnnotation() {
      return {
        type: "StringTypeAnnotation"
      };
    }
    function symbolTypeAnnotation() {
      return {
        type: "SymbolTypeAnnotation"
      };
    }
    function thisTypeAnnotation() {
      return {
        type: "ThisTypeAnnotation"
      };
    }
    function tupleTypeAnnotation(types) {
      const node = {
        type: "TupleTypeAnnotation",
        types
      };
      const defs = NODE_FIELDS.TupleTypeAnnotation;
      validate(defs.types, node, "types", types, 1);
      return node;
    }
    function typeofTypeAnnotation(argument) {
      const node = {
        type: "TypeofTypeAnnotation",
        argument
      };
      const defs = NODE_FIELDS.TypeofTypeAnnotation;
      validate(defs.argument, node, "argument", argument, 1);
      return node;
    }
    function typeAlias(id, typeParameters = null, right) {
      const node = {
        type: "TypeAlias",
        id,
        typeParameters,
        right
      };
      const defs = NODE_FIELDS.TypeAlias;
      validate(defs.id, node, "id", id, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      validate(defs.right, node, "right", right, 1);
      return node;
    }
    function typeAnnotation(typeAnnotation2) {
      const node = {
        type: "TypeAnnotation",
        typeAnnotation: typeAnnotation2
      };
      const defs = NODE_FIELDS.TypeAnnotation;
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function typeCastExpression(expression, typeAnnotation2) {
      const node = {
        type: "TypeCastExpression",
        expression,
        typeAnnotation: typeAnnotation2
      };
      const defs = NODE_FIELDS.TypeCastExpression;
      validate(defs.expression, node, "expression", expression, 1);
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function typeParameter(bound = null, _default = null, variance2 = null) {
      const node = {
        type: "TypeParameter",
        bound,
        default: _default,
        variance: variance2,
        name: null
      };
      const defs = NODE_FIELDS.TypeParameter;
      validate(defs.bound, node, "bound", bound, 1);
      validate(defs.default, node, "default", _default, 1);
      validate(defs.variance, node, "variance", variance2, 1);
      return node;
    }
    function typeParameterDeclaration(params) {
      const node = {
        type: "TypeParameterDeclaration",
        params
      };
      const defs = NODE_FIELDS.TypeParameterDeclaration;
      validate(defs.params, node, "params", params, 1);
      return node;
    }
    function typeParameterInstantiation(params) {
      const node = {
        type: "TypeParameterInstantiation",
        params
      };
      const defs = NODE_FIELDS.TypeParameterInstantiation;
      validate(defs.params, node, "params", params, 1);
      return node;
    }
    function unionTypeAnnotation(types) {
      const node = {
        type: "UnionTypeAnnotation",
        types
      };
      const defs = NODE_FIELDS.UnionTypeAnnotation;
      validate(defs.types, node, "types", types, 1);
      return node;
    }
    function variance(kind) {
      const node = {
        type: "Variance",
        kind
      };
      const defs = NODE_FIELDS.Variance;
      validate(defs.kind, node, "kind", kind);
      return node;
    }
    function voidTypeAnnotation() {
      return {
        type: "VoidTypeAnnotation"
      };
    }
    function enumDeclaration(id, body) {
      const node = {
        type: "EnumDeclaration",
        id,
        body
      };
      const defs = NODE_FIELDS.EnumDeclaration;
      validate(defs.id, node, "id", id, 1);
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function enumBooleanBody(members) {
      const node = {
        type: "EnumBooleanBody",
        members,
        explicitType: null,
        hasUnknownMembers: null
      };
      const defs = NODE_FIELDS.EnumBooleanBody;
      validate(defs.members, node, "members", members, 1);
      return node;
    }
    function enumNumberBody(members) {
      const node = {
        type: "EnumNumberBody",
        members,
        explicitType: null,
        hasUnknownMembers: null
      };
      const defs = NODE_FIELDS.EnumNumberBody;
      validate(defs.members, node, "members", members, 1);
      return node;
    }
    function enumStringBody(members) {
      const node = {
        type: "EnumStringBody",
        members,
        explicitType: null,
        hasUnknownMembers: null
      };
      const defs = NODE_FIELDS.EnumStringBody;
      validate(defs.members, node, "members", members, 1);
      return node;
    }
    function enumSymbolBody(members) {
      const node = {
        type: "EnumSymbolBody",
        members,
        hasUnknownMembers: null
      };
      const defs = NODE_FIELDS.EnumSymbolBody;
      validate(defs.members, node, "members", members, 1);
      return node;
    }
    function enumBooleanMember(id) {
      const node = {
        type: "EnumBooleanMember",
        id,
        init: null
      };
      const defs = NODE_FIELDS.EnumBooleanMember;
      validate(defs.id, node, "id", id, 1);
      return node;
    }
    function enumNumberMember(id, init) {
      const node = {
        type: "EnumNumberMember",
        id,
        init
      };
      const defs = NODE_FIELDS.EnumNumberMember;
      validate(defs.id, node, "id", id, 1);
      validate(defs.init, node, "init", init, 1);
      return node;
    }
    function enumStringMember(id, init) {
      const node = {
        type: "EnumStringMember",
        id,
        init
      };
      const defs = NODE_FIELDS.EnumStringMember;
      validate(defs.id, node, "id", id, 1);
      validate(defs.init, node, "init", init, 1);
      return node;
    }
    function enumDefaultedMember(id) {
      const node = {
        type: "EnumDefaultedMember",
        id
      };
      const defs = NODE_FIELDS.EnumDefaultedMember;
      validate(defs.id, node, "id", id, 1);
      return node;
    }
    function indexedAccessType(objectType, indexType) {
      const node = {
        type: "IndexedAccessType",
        objectType,
        indexType
      };
      const defs = NODE_FIELDS.IndexedAccessType;
      validate(defs.objectType, node, "objectType", objectType, 1);
      validate(defs.indexType, node, "indexType", indexType, 1);
      return node;
    }
    function optionalIndexedAccessType(objectType, indexType) {
      const node = {
        type: "OptionalIndexedAccessType",
        objectType,
        indexType,
        optional: null
      };
      const defs = NODE_FIELDS.OptionalIndexedAccessType;
      validate(defs.objectType, node, "objectType", objectType, 1);
      validate(defs.indexType, node, "indexType", indexType, 1);
      return node;
    }
    function jsxAttribute(name, value = null) {
      const node = {
        type: "JSXAttribute",
        name,
        value
      };
      const defs = NODE_FIELDS.JSXAttribute;
      validate(defs.name, node, "name", name, 1);
      validate(defs.value, node, "value", value, 1);
      return node;
    }
    function jsxClosingElement(name) {
      const node = {
        type: "JSXClosingElement",
        name
      };
      const defs = NODE_FIELDS.JSXClosingElement;
      validate(defs.name, node, "name", name, 1);
      return node;
    }
    function jsxElement(openingElement, closingElement = null, children, selfClosing = null) {
      const node = {
        type: "JSXElement",
        openingElement,
        closingElement,
        children,
        selfClosing
      };
      const defs = NODE_FIELDS.JSXElement;
      validate(defs.openingElement, node, "openingElement", openingElement, 1);
      validate(defs.closingElement, node, "closingElement", closingElement, 1);
      validate(defs.children, node, "children", children, 1);
      validate(defs.selfClosing, node, "selfClosing", selfClosing);
      return node;
    }
    function jsxEmptyExpression() {
      return {
        type: "JSXEmptyExpression"
      };
    }
    function jsxExpressionContainer(expression) {
      const node = {
        type: "JSXExpressionContainer",
        expression
      };
      const defs = NODE_FIELDS.JSXExpressionContainer;
      validate(defs.expression, node, "expression", expression, 1);
      return node;
    }
    function jsxSpreadChild(expression) {
      const node = {
        type: "JSXSpreadChild",
        expression
      };
      const defs = NODE_FIELDS.JSXSpreadChild;
      validate(defs.expression, node, "expression", expression, 1);
      return node;
    }
    function jsxIdentifier(name) {
      const node = {
        type: "JSXIdentifier",
        name
      };
      const defs = NODE_FIELDS.JSXIdentifier;
      validate(defs.name, node, "name", name);
      return node;
    }
    function jsxMemberExpression(object, property) {
      const node = {
        type: "JSXMemberExpression",
        object,
        property
      };
      const defs = NODE_FIELDS.JSXMemberExpression;
      validate(defs.object, node, "object", object, 1);
      validate(defs.property, node, "property", property, 1);
      return node;
    }
    function jsxNamespacedName(namespace, name) {
      const node = {
        type: "JSXNamespacedName",
        namespace,
        name
      };
      const defs = NODE_FIELDS.JSXNamespacedName;
      validate(defs.namespace, node, "namespace", namespace, 1);
      validate(defs.name, node, "name", name, 1);
      return node;
    }
    function jsxOpeningElement(name, attributes, selfClosing = false) {
      const node = {
        type: "JSXOpeningElement",
        name,
        attributes,
        selfClosing
      };
      const defs = NODE_FIELDS.JSXOpeningElement;
      validate(defs.name, node, "name", name, 1);
      validate(defs.attributes, node, "attributes", attributes, 1);
      validate(defs.selfClosing, node, "selfClosing", selfClosing);
      return node;
    }
    function jsxSpreadAttribute(argument) {
      const node = {
        type: "JSXSpreadAttribute",
        argument
      };
      const defs = NODE_FIELDS.JSXSpreadAttribute;
      validate(defs.argument, node, "argument", argument, 1);
      return node;
    }
    function jsxText(value) {
      const node = {
        type: "JSXText",
        value
      };
      const defs = NODE_FIELDS.JSXText;
      validate(defs.value, node, "value", value);
      return node;
    }
    function jsxFragment(openingFragment, closingFragment, children) {
      const node = {
        type: "JSXFragment",
        openingFragment,
        closingFragment,
        children
      };
      const defs = NODE_FIELDS.JSXFragment;
      validate(defs.openingFragment, node, "openingFragment", openingFragment, 1);
      validate(defs.closingFragment, node, "closingFragment", closingFragment, 1);
      validate(defs.children, node, "children", children, 1);
      return node;
    }
    function jsxOpeningFragment() {
      return {
        type: "JSXOpeningFragment"
      };
    }
    function jsxClosingFragment() {
      return {
        type: "JSXClosingFragment"
      };
    }
    function noop() {
      return {
        type: "Noop"
      };
    }
    function placeholder(expectedNode, name) {
      const node = {
        type: "Placeholder",
        expectedNode,
        name
      };
      const defs = NODE_FIELDS.Placeholder;
      validate(defs.expectedNode, node, "expectedNode", expectedNode);
      validate(defs.name, node, "name", name, 1);
      return node;
    }
    function v8IntrinsicIdentifier(name) {
      const node = {
        type: "V8IntrinsicIdentifier",
        name
      };
      const defs = NODE_FIELDS.V8IntrinsicIdentifier;
      validate(defs.name, node, "name", name);
      return node;
    }
    function argumentPlaceholder() {
      return {
        type: "ArgumentPlaceholder"
      };
    }
    function bindExpression(object, callee) {
      const node = {
        type: "BindExpression",
        object,
        callee
      };
      const defs = NODE_FIELDS.BindExpression;
      validate(defs.object, node, "object", object, 1);
      validate(defs.callee, node, "callee", callee, 1);
      return node;
    }
    function decorator(expression) {
      const node = {
        type: "Decorator",
        expression
      };
      const defs = NODE_FIELDS.Decorator;
      validate(defs.expression, node, "expression", expression, 1);
      return node;
    }
    function doExpression(body, async = false) {
      const node = {
        type: "DoExpression",
        body,
        async
      };
      const defs = NODE_FIELDS.DoExpression;
      validate(defs.body, node, "body", body, 1);
      validate(defs.async, node, "async", async);
      return node;
    }
    function exportDefaultSpecifier(exported) {
      const node = {
        type: "ExportDefaultSpecifier",
        exported
      };
      const defs = NODE_FIELDS.ExportDefaultSpecifier;
      validate(defs.exported, node, "exported", exported, 1);
      return node;
    }
    function recordExpression(properties) {
      const node = {
        type: "RecordExpression",
        properties
      };
      const defs = NODE_FIELDS.RecordExpression;
      validate(defs.properties, node, "properties", properties, 1);
      return node;
    }
    function tupleExpression(elements = []) {
      const node = {
        type: "TupleExpression",
        elements
      };
      const defs = NODE_FIELDS.TupleExpression;
      validate(defs.elements, node, "elements", elements, 1);
      return node;
    }
    function decimalLiteral(value) {
      const node = {
        type: "DecimalLiteral",
        value
      };
      const defs = NODE_FIELDS.DecimalLiteral;
      validate(defs.value, node, "value", value);
      return node;
    }
    function moduleExpression(body) {
      const node = {
        type: "ModuleExpression",
        body
      };
      const defs = NODE_FIELDS.ModuleExpression;
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function topicReference() {
      return {
        type: "TopicReference"
      };
    }
    function pipelineTopicExpression(expression) {
      const node = {
        type: "PipelineTopicExpression",
        expression
      };
      const defs = NODE_FIELDS.PipelineTopicExpression;
      validate(defs.expression, node, "expression", expression, 1);
      return node;
    }
    function pipelineBareFunction(callee) {
      const node = {
        type: "PipelineBareFunction",
        callee
      };
      const defs = NODE_FIELDS.PipelineBareFunction;
      validate(defs.callee, node, "callee", callee, 1);
      return node;
    }
    function pipelinePrimaryTopicReference() {
      return {
        type: "PipelinePrimaryTopicReference"
      };
    }
    function voidPattern() {
      return {
        type: "VoidPattern"
      };
    }
    function tsParameterProperty(parameter) {
      const node = {
        type: "TSParameterProperty",
        parameter
      };
      const defs = NODE_FIELDS.TSParameterProperty;
      validate(defs.parameter, node, "parameter", parameter, 1);
      return node;
    }
    function tsDeclareFunction(id = null, typeParameters = null, params, returnType = null) {
      const node = {
        type: "TSDeclareFunction",
        id,
        typeParameters,
        params,
        returnType
      };
      const defs = NODE_FIELDS.TSDeclareFunction;
      validate(defs.id, node, "id", id, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      validate(defs.params, node, "params", params, 1);
      validate(defs.returnType, node, "returnType", returnType, 1);
      return node;
    }
    function tsDeclareMethod(decorators = null, key, typeParameters = null, params, returnType = null) {
      const node = {
        type: "TSDeclareMethod",
        decorators,
        key,
        typeParameters,
        params,
        returnType
      };
      const defs = NODE_FIELDS.TSDeclareMethod;
      validate(defs.decorators, node, "decorators", decorators, 1);
      validate(defs.key, node, "key", key, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      validate(defs.params, node, "params", params, 1);
      validate(defs.returnType, node, "returnType", returnType, 1);
      return node;
    }
    function tsQualifiedName(left, right) {
      const node = {
        type: "TSQualifiedName",
        left,
        right
      };
      const defs = NODE_FIELDS.TSQualifiedName;
      validate(defs.left, node, "left", left, 1);
      validate(defs.right, node, "right", right, 1);
      return node;
    }
    function tsCallSignatureDeclaration(typeParameters = null, parameters, typeAnnotation2 = null) {
      const node = {
        type: "TSCallSignatureDeclaration",
        typeParameters,
        parameters,
        typeAnnotation: typeAnnotation2
      };
      const defs = NODE_FIELDS.TSCallSignatureDeclaration;
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      validate(defs.parameters, node, "parameters", parameters, 1);
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function tsConstructSignatureDeclaration(typeParameters = null, parameters, typeAnnotation2 = null) {
      const node = {
        type: "TSConstructSignatureDeclaration",
        typeParameters,
        parameters,
        typeAnnotation: typeAnnotation2
      };
      const defs = NODE_FIELDS.TSConstructSignatureDeclaration;
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      validate(defs.parameters, node, "parameters", parameters, 1);
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function tsPropertySignature(key, typeAnnotation2 = null) {
      const node = {
        type: "TSPropertySignature",
        key,
        typeAnnotation: typeAnnotation2
      };
      const defs = NODE_FIELDS.TSPropertySignature;
      validate(defs.key, node, "key", key, 1);
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function tsMethodSignature(key, typeParameters = null, parameters, typeAnnotation2 = null) {
      const node = {
        type: "TSMethodSignature",
        key,
        typeParameters,
        parameters,
        typeAnnotation: typeAnnotation2,
        kind: null
      };
      const defs = NODE_FIELDS.TSMethodSignature;
      validate(defs.key, node, "key", key, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      validate(defs.parameters, node, "parameters", parameters, 1);
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function tsIndexSignature(parameters, typeAnnotation2 = null) {
      const node = {
        type: "TSIndexSignature",
        parameters,
        typeAnnotation: typeAnnotation2
      };
      const defs = NODE_FIELDS.TSIndexSignature;
      validate(defs.parameters, node, "parameters", parameters, 1);
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function tsAnyKeyword() {
      return {
        type: "TSAnyKeyword"
      };
    }
    function tsBooleanKeyword() {
      return {
        type: "TSBooleanKeyword"
      };
    }
    function tsBigIntKeyword() {
      return {
        type: "TSBigIntKeyword"
      };
    }
    function tsIntrinsicKeyword() {
      return {
        type: "TSIntrinsicKeyword"
      };
    }
    function tsNeverKeyword() {
      return {
        type: "TSNeverKeyword"
      };
    }
    function tsNullKeyword() {
      return {
        type: "TSNullKeyword"
      };
    }
    function tsNumberKeyword() {
      return {
        type: "TSNumberKeyword"
      };
    }
    function tsObjectKeyword() {
      return {
        type: "TSObjectKeyword"
      };
    }
    function tsStringKeyword() {
      return {
        type: "TSStringKeyword"
      };
    }
    function tsSymbolKeyword() {
      return {
        type: "TSSymbolKeyword"
      };
    }
    function tsUndefinedKeyword() {
      return {
        type: "TSUndefinedKeyword"
      };
    }
    function tsUnknownKeyword() {
      return {
        type: "TSUnknownKeyword"
      };
    }
    function tsVoidKeyword() {
      return {
        type: "TSVoidKeyword"
      };
    }
    function tsThisType() {
      return {
        type: "TSThisType"
      };
    }
    function tsFunctionType(typeParameters = null, parameters, typeAnnotation2 = null) {
      const node = {
        type: "TSFunctionType",
        typeParameters,
        parameters,
        typeAnnotation: typeAnnotation2
      };
      const defs = NODE_FIELDS.TSFunctionType;
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      validate(defs.parameters, node, "parameters", parameters, 1);
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function tsConstructorType(typeParameters = null, parameters, typeAnnotation2 = null) {
      const node = {
        type: "TSConstructorType",
        typeParameters,
        parameters,
        typeAnnotation: typeAnnotation2
      };
      const defs = NODE_FIELDS.TSConstructorType;
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      validate(defs.parameters, node, "parameters", parameters, 1);
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function tsTypeReference(typeName, typeParameters = null) {
      const node = {
        type: "TSTypeReference",
        typeName,
        typeParameters
      };
      const defs = NODE_FIELDS.TSTypeReference;
      validate(defs.typeName, node, "typeName", typeName, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      return node;
    }
    function tsTypePredicate(parameterName, typeAnnotation2 = null, asserts = null) {
      const node = {
        type: "TSTypePredicate",
        parameterName,
        typeAnnotation: typeAnnotation2,
        asserts
      };
      const defs = NODE_FIELDS.TSTypePredicate;
      validate(defs.parameterName, node, "parameterName", parameterName, 1);
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      validate(defs.asserts, node, "asserts", asserts);
      return node;
    }
    function tsTypeQuery(exprName, typeParameters = null) {
      const node = {
        type: "TSTypeQuery",
        exprName,
        typeParameters
      };
      const defs = NODE_FIELDS.TSTypeQuery;
      validate(defs.exprName, node, "exprName", exprName, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      return node;
    }
    function tsTypeLiteral(members) {
      const node = {
        type: "TSTypeLiteral",
        members
      };
      const defs = NODE_FIELDS.TSTypeLiteral;
      validate(defs.members, node, "members", members, 1);
      return node;
    }
    function tsArrayType(elementType) {
      const node = {
        type: "TSArrayType",
        elementType
      };
      const defs = NODE_FIELDS.TSArrayType;
      validate(defs.elementType, node, "elementType", elementType, 1);
      return node;
    }
    function tsTupleType(elementTypes) {
      const node = {
        type: "TSTupleType",
        elementTypes
      };
      const defs = NODE_FIELDS.TSTupleType;
      validate(defs.elementTypes, node, "elementTypes", elementTypes, 1);
      return node;
    }
    function tsOptionalType(typeAnnotation2) {
      const node = {
        type: "TSOptionalType",
        typeAnnotation: typeAnnotation2
      };
      const defs = NODE_FIELDS.TSOptionalType;
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function tsRestType(typeAnnotation2) {
      const node = {
        type: "TSRestType",
        typeAnnotation: typeAnnotation2
      };
      const defs = NODE_FIELDS.TSRestType;
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function tsNamedTupleMember(label, elementType, optional = false) {
      const node = {
        type: "TSNamedTupleMember",
        label,
        elementType,
        optional
      };
      const defs = NODE_FIELDS.TSNamedTupleMember;
      validate(defs.label, node, "label", label, 1);
      validate(defs.elementType, node, "elementType", elementType, 1);
      validate(defs.optional, node, "optional", optional);
      return node;
    }
    function tsUnionType(types) {
      const node = {
        type: "TSUnionType",
        types
      };
      const defs = NODE_FIELDS.TSUnionType;
      validate(defs.types, node, "types", types, 1);
      return node;
    }
    function tsIntersectionType(types) {
      const node = {
        type: "TSIntersectionType",
        types
      };
      const defs = NODE_FIELDS.TSIntersectionType;
      validate(defs.types, node, "types", types, 1);
      return node;
    }
    function tsConditionalType(checkType, extendsType, trueType, falseType) {
      const node = {
        type: "TSConditionalType",
        checkType,
        extendsType,
        trueType,
        falseType
      };
      const defs = NODE_FIELDS.TSConditionalType;
      validate(defs.checkType, node, "checkType", checkType, 1);
      validate(defs.extendsType, node, "extendsType", extendsType, 1);
      validate(defs.trueType, node, "trueType", trueType, 1);
      validate(defs.falseType, node, "falseType", falseType, 1);
      return node;
    }
    function tsInferType(typeParameter2) {
      const node = {
        type: "TSInferType",
        typeParameter: typeParameter2
      };
      const defs = NODE_FIELDS.TSInferType;
      validate(defs.typeParameter, node, "typeParameter", typeParameter2, 1);
      return node;
    }
    function tsParenthesizedType(typeAnnotation2) {
      const node = {
        type: "TSParenthesizedType",
        typeAnnotation: typeAnnotation2
      };
      const defs = NODE_FIELDS.TSParenthesizedType;
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function tsTypeOperator(typeAnnotation2, operator = "keyof") {
      const node = {
        type: "TSTypeOperator",
        typeAnnotation: typeAnnotation2,
        operator
      };
      const defs = NODE_FIELDS.TSTypeOperator;
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      validate(defs.operator, node, "operator", operator);
      return node;
    }
    function tsIndexedAccessType(objectType, indexType) {
      const node = {
        type: "TSIndexedAccessType",
        objectType,
        indexType
      };
      const defs = NODE_FIELDS.TSIndexedAccessType;
      validate(defs.objectType, node, "objectType", objectType, 1);
      validate(defs.indexType, node, "indexType", indexType, 1);
      return node;
    }
    function tsMappedType(typeParameter2, typeAnnotation2 = null, nameType = null) {
      const node = {
        type: "TSMappedType",
        typeParameter: typeParameter2,
        typeAnnotation: typeAnnotation2,
        nameType
      };
      const defs = NODE_FIELDS.TSMappedType;
      validate(defs.typeParameter, node, "typeParameter", typeParameter2, 1);
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      validate(defs.nameType, node, "nameType", nameType, 1);
      return node;
    }
    function tsTemplateLiteralType(quasis, types) {
      const node = {
        type: "TSTemplateLiteralType",
        quasis,
        types
      };
      const defs = NODE_FIELDS.TSTemplateLiteralType;
      validate(defs.quasis, node, "quasis", quasis, 1);
      validate(defs.types, node, "types", types, 1);
      return node;
    }
    function tsLiteralType(literal) {
      const node = {
        type: "TSLiteralType",
        literal
      };
      const defs = NODE_FIELDS.TSLiteralType;
      validate(defs.literal, node, "literal", literal, 1);
      return node;
    }
    function tsExpressionWithTypeArguments(expression, typeParameters = null) {
      const node = {
        type: "TSExpressionWithTypeArguments",
        expression,
        typeParameters
      };
      const defs = NODE_FIELDS.TSExpressionWithTypeArguments;
      validate(defs.expression, node, "expression", expression, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      return node;
    }
    function tsInterfaceDeclaration(id, typeParameters = null, _extends = null, body) {
      const node = {
        type: "TSInterfaceDeclaration",
        id,
        typeParameters,
        extends: _extends,
        body
      };
      const defs = NODE_FIELDS.TSInterfaceDeclaration;
      validate(defs.id, node, "id", id, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      validate(defs.extends, node, "extends", _extends, 1);
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function tsInterfaceBody(body) {
      const node = {
        type: "TSInterfaceBody",
        body
      };
      const defs = NODE_FIELDS.TSInterfaceBody;
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function tsTypeAliasDeclaration(id, typeParameters = null, typeAnnotation2) {
      const node = {
        type: "TSTypeAliasDeclaration",
        id,
        typeParameters,
        typeAnnotation: typeAnnotation2
      };
      const defs = NODE_FIELDS.TSTypeAliasDeclaration;
      validate(defs.id, node, "id", id, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function tsInstantiationExpression(expression, typeParameters = null) {
      const node = {
        type: "TSInstantiationExpression",
        expression,
        typeParameters
      };
      const defs = NODE_FIELDS.TSInstantiationExpression;
      validate(defs.expression, node, "expression", expression, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      return node;
    }
    function tsAsExpression(expression, typeAnnotation2) {
      const node = {
        type: "TSAsExpression",
        expression,
        typeAnnotation: typeAnnotation2
      };
      const defs = NODE_FIELDS.TSAsExpression;
      validate(defs.expression, node, "expression", expression, 1);
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function tsSatisfiesExpression(expression, typeAnnotation2) {
      const node = {
        type: "TSSatisfiesExpression",
        expression,
        typeAnnotation: typeAnnotation2
      };
      const defs = NODE_FIELDS.TSSatisfiesExpression;
      validate(defs.expression, node, "expression", expression, 1);
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function tsTypeAssertion(typeAnnotation2, expression) {
      const node = {
        type: "TSTypeAssertion",
        typeAnnotation: typeAnnotation2,
        expression
      };
      const defs = NODE_FIELDS.TSTypeAssertion;
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      validate(defs.expression, node, "expression", expression, 1);
      return node;
    }
    function tsEnumBody(members) {
      const node = {
        type: "TSEnumBody",
        members
      };
      const defs = NODE_FIELDS.TSEnumBody;
      validate(defs.members, node, "members", members, 1);
      return node;
    }
    function tsEnumDeclaration(id, members) {
      const node = {
        type: "TSEnumDeclaration",
        id,
        members
      };
      const defs = NODE_FIELDS.TSEnumDeclaration;
      validate(defs.id, node, "id", id, 1);
      validate(defs.members, node, "members", members, 1);
      return node;
    }
    function tsEnumMember(id, initializer = null) {
      const node = {
        type: "TSEnumMember",
        id,
        initializer
      };
      const defs = NODE_FIELDS.TSEnumMember;
      validate(defs.id, node, "id", id, 1);
      validate(defs.initializer, node, "initializer", initializer, 1);
      return node;
    }
    function tsModuleDeclaration(id, body) {
      const node = {
        type: "TSModuleDeclaration",
        id,
        body,
        kind: null
      };
      const defs = NODE_FIELDS.TSModuleDeclaration;
      validate(defs.id, node, "id", id, 1);
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function tsModuleBlock(body) {
      const node = {
        type: "TSModuleBlock",
        body
      };
      const defs = NODE_FIELDS.TSModuleBlock;
      validate(defs.body, node, "body", body, 1);
      return node;
    }
    function tsImportType(argument, qualifier = null, typeParameters = null) {
      const node = {
        type: "TSImportType",
        argument,
        qualifier,
        typeParameters
      };
      const defs = NODE_FIELDS.TSImportType;
      validate(defs.argument, node, "argument", argument, 1);
      validate(defs.qualifier, node, "qualifier", qualifier, 1);
      validate(defs.typeParameters, node, "typeParameters", typeParameters, 1);
      return node;
    }
    function tsImportEqualsDeclaration(id, moduleReference) {
      const node = {
        type: "TSImportEqualsDeclaration",
        id,
        moduleReference,
        isExport: null
      };
      const defs = NODE_FIELDS.TSImportEqualsDeclaration;
      validate(defs.id, node, "id", id, 1);
      validate(defs.moduleReference, node, "moduleReference", moduleReference, 1);
      return node;
    }
    function tsExternalModuleReference(expression) {
      const node = {
        type: "TSExternalModuleReference",
        expression
      };
      const defs = NODE_FIELDS.TSExternalModuleReference;
      validate(defs.expression, node, "expression", expression, 1);
      return node;
    }
    function tsNonNullExpression(expression) {
      const node = {
        type: "TSNonNullExpression",
        expression
      };
      const defs = NODE_FIELDS.TSNonNullExpression;
      validate(defs.expression, node, "expression", expression, 1);
      return node;
    }
    function tsExportAssignment(expression) {
      const node = {
        type: "TSExportAssignment",
        expression
      };
      const defs = NODE_FIELDS.TSExportAssignment;
      validate(defs.expression, node, "expression", expression, 1);
      return node;
    }
    function tsNamespaceExportDeclaration(id) {
      const node = {
        type: "TSNamespaceExportDeclaration",
        id
      };
      const defs = NODE_FIELDS.TSNamespaceExportDeclaration;
      validate(defs.id, node, "id", id, 1);
      return node;
    }
    function tsTypeAnnotation(typeAnnotation2) {
      const node = {
        type: "TSTypeAnnotation",
        typeAnnotation: typeAnnotation2
      };
      const defs = NODE_FIELDS.TSTypeAnnotation;
      validate(defs.typeAnnotation, node, "typeAnnotation", typeAnnotation2, 1);
      return node;
    }
    function tsTypeParameterInstantiation(params) {
      const node = {
        type: "TSTypeParameterInstantiation",
        params
      };
      const defs = NODE_FIELDS.TSTypeParameterInstantiation;
      validate(defs.params, node, "params", params, 1);
      return node;
    }
    function tsTypeParameterDeclaration(params) {
      const node = {
        type: "TSTypeParameterDeclaration",
        params
      };
      const defs = NODE_FIELDS.TSTypeParameterDeclaration;
      validate(defs.params, node, "params", params, 1);
      return node;
    }
    function tsTypeParameter(constraint = null, _default = null, name) {
      const node = {
        type: "TSTypeParameter",
        constraint,
        default: _default,
        name
      };
      const defs = NODE_FIELDS.TSTypeParameter;
      validate(defs.constraint, node, "constraint", constraint, 1);
      validate(defs.default, node, "default", _default, 1);
      validate(defs.name, node, "name", name);
      return node;
    }
    function NumberLiteral(value) {
      (0, _deprecationWarning.default)("NumberLiteral", "NumericLiteral", "The node type ");
      return numericLiteral(value);
    }
    function RegexLiteral(pattern, flags = "") {
      (0, _deprecationWarning.default)("RegexLiteral", "RegExpLiteral", "The node type ");
      return regExpLiteral(pattern, flags);
    }
    function RestProperty(argument) {
      (0, _deprecationWarning.default)("RestProperty", "RestElement", "The node type ");
      return restElement(argument);
    }
    function SpreadProperty(argument) {
      (0, _deprecationWarning.default)("SpreadProperty", "SpreadElement", "The node type ");
      return spreadElement(argument);
    }
  }
});

// ../node_modules/@babel/types/lib/builders/generated/uppercase.js
var require_uppercase = __commonJS({
  "../node_modules/@babel/types/lib/builders/generated/uppercase.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.JSXIdentifier = exports.JSXFragment = exports.JSXExpressionContainer = exports.JSXEmptyExpression = exports.JSXElement = exports.JSXClosingFragment = exports.JSXClosingElement = exports.JSXAttribute = exports.IntersectionTypeAnnotation = exports.InterpreterDirective = exports.InterfaceTypeAnnotation = exports.InterfaceExtends = exports.InterfaceDeclaration = exports.InferredPredicate = exports.IndexedAccessType = exports.ImportSpecifier = exports.ImportNamespaceSpecifier = exports.ImportExpression = exports.ImportDefaultSpecifier = exports.ImportDeclaration = exports.ImportAttribute = exports.Import = exports.IfStatement = exports.Identifier = exports.GenericTypeAnnotation = exports.FunctionTypeParam = exports.FunctionTypeAnnotation = exports.FunctionExpression = exports.FunctionDeclaration = exports.ForStatement = exports.ForOfStatement = exports.ForInStatement = exports.File = exports.ExpressionStatement = exports.ExportSpecifier = exports.ExportNamespaceSpecifier = exports.ExportNamedDeclaration = exports.ExportDefaultSpecifier = exports.ExportDefaultDeclaration = exports.ExportAllDeclaration = exports.ExistsTypeAnnotation = exports.EnumSymbolBody = exports.EnumStringMember = exports.EnumStringBody = exports.EnumNumberMember = exports.EnumNumberBody = exports.EnumDefaultedMember = exports.EnumDeclaration = exports.EnumBooleanMember = exports.EnumBooleanBody = exports.EmptyTypeAnnotation = exports.EmptyStatement = exports.DoWhileStatement = exports.DoExpression = exports.DirectiveLiteral = exports.Directive = exports.Decorator = exports.DeclaredPredicate = exports.DeclareVariable = exports.DeclareTypeAlias = exports.DeclareOpaqueType = exports.DeclareModuleExports = exports.DeclareModule = exports.DeclareInterface = exports.DeclareFunction = exports.DeclareExportDeclaration = exports.DeclareExportAllDeclaration = exports.DeclareClass = exports.DecimalLiteral = exports.DebuggerStatement = exports.ContinueStatement = exports.ConditionalExpression = exports.ClassProperty = exports.ClassPrivateProperty = exports.ClassPrivateMethod = exports.ClassMethod = exports.ClassImplements = exports.ClassExpression = exports.ClassDeclaration = exports.ClassBody = exports.ClassAccessorProperty = exports.CatchClause = exports.CallExpression = exports.BreakStatement = exports.BooleanTypeAnnotation = exports.BooleanLiteralTypeAnnotation = exports.BooleanLiteral = exports.BlockStatement = exports.BindExpression = exports.BinaryExpression = exports.BigIntLiteral = exports.AwaitExpression = exports.AssignmentPattern = exports.AssignmentExpression = exports.ArrowFunctionExpression = exports.ArrayTypeAnnotation = exports.ArrayPattern = exports.ArrayExpression = exports.ArgumentPlaceholder = exports.AnyTypeAnnotation = void 0;
    exports.TSNumberKeyword = exports.TSNullKeyword = exports.TSNonNullExpression = exports.TSNeverKeyword = exports.TSNamespaceExportDeclaration = exports.TSNamedTupleMember = exports.TSModuleDeclaration = exports.TSModuleBlock = exports.TSMethodSignature = exports.TSMappedType = exports.TSLiteralType = exports.TSIntrinsicKeyword = exports.TSIntersectionType = exports.TSInterfaceDeclaration = exports.TSInterfaceBody = exports.TSInstantiationExpression = exports.TSInferType = exports.TSIndexedAccessType = exports.TSIndexSignature = exports.TSImportType = exports.TSImportEqualsDeclaration = exports.TSFunctionType = exports.TSExternalModuleReference = exports.TSExpressionWithTypeArguments = exports.TSExportAssignment = exports.TSEnumMember = exports.TSEnumDeclaration = exports.TSEnumBody = exports.TSDeclareMethod = exports.TSDeclareFunction = exports.TSConstructorType = exports.TSConstructSignatureDeclaration = exports.TSConditionalType = exports.TSCallSignatureDeclaration = exports.TSBooleanKeyword = exports.TSBigIntKeyword = exports.TSAsExpression = exports.TSArrayType = exports.TSAnyKeyword = exports.SymbolTypeAnnotation = exports.SwitchStatement = exports.SwitchCase = exports.Super = exports.StringTypeAnnotation = exports.StringLiteralTypeAnnotation = exports.StringLiteral = exports.StaticBlock = exports.SpreadProperty = exports.SpreadElement = exports.SequenceExpression = exports.ReturnStatement = exports.RestProperty = exports.RestElement = exports.RegexLiteral = exports.RegExpLiteral = exports.RecordExpression = exports.QualifiedTypeIdentifier = exports.Program = exports.PrivateName = exports.Placeholder = exports.PipelineTopicExpression = exports.PipelinePrimaryTopicReference = exports.PipelineBareFunction = exports.ParenthesizedExpression = exports.OptionalMemberExpression = exports.OptionalIndexedAccessType = exports.OptionalCallExpression = exports.OpaqueType = exports.ObjectTypeSpreadProperty = exports.ObjectTypeProperty = exports.ObjectTypeInternalSlot = exports.ObjectTypeIndexer = exports.ObjectTypeCallProperty = exports.ObjectTypeAnnotation = exports.ObjectProperty = exports.ObjectPattern = exports.ObjectMethod = exports.ObjectExpression = exports.NumericLiteral = exports.NumberTypeAnnotation = exports.NumberLiteralTypeAnnotation = exports.NumberLiteral = exports.NullableTypeAnnotation = exports.NullLiteralTypeAnnotation = exports.NullLiteral = exports.Noop = exports.NewExpression = exports.ModuleExpression = exports.MixedTypeAnnotation = exports.MetaProperty = exports.MemberExpression = exports.LogicalExpression = exports.LabeledStatement = exports.JSXText = exports.JSXSpreadChild = exports.JSXSpreadAttribute = exports.JSXOpeningFragment = exports.JSXOpeningElement = exports.JSXNamespacedName = exports.JSXMemberExpression = void 0;
    exports.YieldExpression = exports.WithStatement = exports.WhileStatement = exports.VoidTypeAnnotation = exports.VoidPattern = exports.Variance = exports.VariableDeclarator = exports.VariableDeclaration = exports.V8IntrinsicIdentifier = exports.UpdateExpression = exports.UnionTypeAnnotation = exports.UnaryExpression = exports.TypeofTypeAnnotation = exports.TypeParameterInstantiation = exports.TypeParameterDeclaration = exports.TypeParameter = exports.TypeCastExpression = exports.TypeAnnotation = exports.TypeAlias = exports.TupleTypeAnnotation = exports.TupleExpression = exports.TryStatement = exports.TopicReference = exports.ThrowStatement = exports.ThisTypeAnnotation = exports.ThisExpression = exports.TemplateLiteral = exports.TemplateElement = exports.TaggedTemplateExpression = exports.TSVoidKeyword = exports.TSUnknownKeyword = exports.TSUnionType = exports.TSUndefinedKeyword = exports.TSTypeReference = exports.TSTypeQuery = exports.TSTypePredicate = exports.TSTypeParameterInstantiation = exports.TSTypeParameterDeclaration = exports.TSTypeParameter = exports.TSTypeOperator = exports.TSTypeLiteral = exports.TSTypeAssertion = exports.TSTypeAnnotation = exports.TSTypeAliasDeclaration = exports.TSTupleType = exports.TSThisType = exports.TSTemplateLiteralType = exports.TSSymbolKeyword = exports.TSStringKeyword = exports.TSSatisfiesExpression = exports.TSRestType = exports.TSQualifiedName = exports.TSPropertySignature = exports.TSParenthesizedType = exports.TSParameterProperty = exports.TSOptionalType = exports.TSObjectKeyword = void 0;
    var b = require_lowercase();
    var _deprecationWarning = require_deprecationWarning();
    function alias(lowercase) {
      return b[lowercase];
    }
    var ArrayExpression = exports.ArrayExpression = alias("arrayExpression");
    var AssignmentExpression = exports.AssignmentExpression = alias("assignmentExpression");
    var BinaryExpression = exports.BinaryExpression = alias("binaryExpression");
    var InterpreterDirective = exports.InterpreterDirective = alias("interpreterDirective");
    var Directive = exports.Directive = alias("directive");
    var DirectiveLiteral = exports.DirectiveLiteral = alias("directiveLiteral");
    var BlockStatement = exports.BlockStatement = alias("blockStatement");
    var BreakStatement = exports.BreakStatement = alias("breakStatement");
    var CallExpression = exports.CallExpression = alias("callExpression");
    var CatchClause = exports.CatchClause = alias("catchClause");
    var ConditionalExpression = exports.ConditionalExpression = alias("conditionalExpression");
    var ContinueStatement = exports.ContinueStatement = alias("continueStatement");
    var DebuggerStatement = exports.DebuggerStatement = alias("debuggerStatement");
    var DoWhileStatement = exports.DoWhileStatement = alias("doWhileStatement");
    var EmptyStatement = exports.EmptyStatement = alias("emptyStatement");
    var ExpressionStatement = exports.ExpressionStatement = alias("expressionStatement");
    var File = exports.File = alias("file");
    var ForInStatement = exports.ForInStatement = alias("forInStatement");
    var ForStatement = exports.ForStatement = alias("forStatement");
    var FunctionDeclaration = exports.FunctionDeclaration = alias("functionDeclaration");
    var FunctionExpression = exports.FunctionExpression = alias("functionExpression");
    var Identifier = exports.Identifier = alias("identifier");
    var IfStatement = exports.IfStatement = alias("ifStatement");
    var LabeledStatement = exports.LabeledStatement = alias("labeledStatement");
    var StringLiteral = exports.StringLiteral = alias("stringLiteral");
    var NumericLiteral = exports.NumericLiteral = alias("numericLiteral");
    var NullLiteral = exports.NullLiteral = alias("nullLiteral");
    var BooleanLiteral = exports.BooleanLiteral = alias("booleanLiteral");
    var RegExpLiteral = exports.RegExpLiteral = alias("regExpLiteral");
    var LogicalExpression = exports.LogicalExpression = alias("logicalExpression");
    var MemberExpression = exports.MemberExpression = alias("memberExpression");
    var NewExpression = exports.NewExpression = alias("newExpression");
    var Program = exports.Program = alias("program");
    var ObjectExpression = exports.ObjectExpression = alias("objectExpression");
    var ObjectMethod = exports.ObjectMethod = alias("objectMethod");
    var ObjectProperty = exports.ObjectProperty = alias("objectProperty");
    var RestElement = exports.RestElement = alias("restElement");
    var ReturnStatement = exports.ReturnStatement = alias("returnStatement");
    var SequenceExpression = exports.SequenceExpression = alias("sequenceExpression");
    var ParenthesizedExpression = exports.ParenthesizedExpression = alias("parenthesizedExpression");
    var SwitchCase = exports.SwitchCase = alias("switchCase");
    var SwitchStatement = exports.SwitchStatement = alias("switchStatement");
    var ThisExpression = exports.ThisExpression = alias("thisExpression");
    var ThrowStatement = exports.ThrowStatement = alias("throwStatement");
    var TryStatement = exports.TryStatement = alias("tryStatement");
    var UnaryExpression = exports.UnaryExpression = alias("unaryExpression");
    var UpdateExpression = exports.UpdateExpression = alias("updateExpression");
    var VariableDeclaration = exports.VariableDeclaration = alias("variableDeclaration");
    var VariableDeclarator = exports.VariableDeclarator = alias("variableDeclarator");
    var WhileStatement = exports.WhileStatement = alias("whileStatement");
    var WithStatement = exports.WithStatement = alias("withStatement");
    var AssignmentPattern = exports.AssignmentPattern = alias("assignmentPattern");
    var ArrayPattern = exports.ArrayPattern = alias("arrayPattern");
    var ArrowFunctionExpression = exports.ArrowFunctionExpression = alias("arrowFunctionExpression");
    var ClassBody = exports.ClassBody = alias("classBody");
    var ClassExpression = exports.ClassExpression = alias("classExpression");
    var ClassDeclaration = exports.ClassDeclaration = alias("classDeclaration");
    var ExportAllDeclaration = exports.ExportAllDeclaration = alias("exportAllDeclaration");
    var ExportDefaultDeclaration = exports.ExportDefaultDeclaration = alias("exportDefaultDeclaration");
    var ExportNamedDeclaration = exports.ExportNamedDeclaration = alias("exportNamedDeclaration");
    var ExportSpecifier = exports.ExportSpecifier = alias("exportSpecifier");
    var ForOfStatement = exports.ForOfStatement = alias("forOfStatement");
    var ImportDeclaration = exports.ImportDeclaration = alias("importDeclaration");
    var ImportDefaultSpecifier = exports.ImportDefaultSpecifier = alias("importDefaultSpecifier");
    var ImportNamespaceSpecifier = exports.ImportNamespaceSpecifier = alias("importNamespaceSpecifier");
    var ImportSpecifier = exports.ImportSpecifier = alias("importSpecifier");
    var ImportExpression = exports.ImportExpression = alias("importExpression");
    var MetaProperty = exports.MetaProperty = alias("metaProperty");
    var ClassMethod = exports.ClassMethod = alias("classMethod");
    var ObjectPattern = exports.ObjectPattern = alias("objectPattern");
    var SpreadElement = exports.SpreadElement = alias("spreadElement");
    var Super = exports.Super = alias("super");
    var TaggedTemplateExpression = exports.TaggedTemplateExpression = alias("taggedTemplateExpression");
    var TemplateElement = exports.TemplateElement = alias("templateElement");
    var TemplateLiteral = exports.TemplateLiteral = alias("templateLiteral");
    var YieldExpression = exports.YieldExpression = alias("yieldExpression");
    var AwaitExpression = exports.AwaitExpression = alias("awaitExpression");
    var Import = exports.Import = alias("import");
    var BigIntLiteral = exports.BigIntLiteral = alias("bigIntLiteral");
    var ExportNamespaceSpecifier = exports.ExportNamespaceSpecifier = alias("exportNamespaceSpecifier");
    var OptionalMemberExpression = exports.OptionalMemberExpression = alias("optionalMemberExpression");
    var OptionalCallExpression = exports.OptionalCallExpression = alias("optionalCallExpression");
    var ClassProperty = exports.ClassProperty = alias("classProperty");
    var ClassAccessorProperty = exports.ClassAccessorProperty = alias("classAccessorProperty");
    var ClassPrivateProperty = exports.ClassPrivateProperty = alias("classPrivateProperty");
    var ClassPrivateMethod = exports.ClassPrivateMethod = alias("classPrivateMethod");
    var PrivateName = exports.PrivateName = alias("privateName");
    var StaticBlock = exports.StaticBlock = alias("staticBlock");
    var ImportAttribute = exports.ImportAttribute = alias("importAttribute");
    var AnyTypeAnnotation = exports.AnyTypeAnnotation = alias("anyTypeAnnotation");
    var ArrayTypeAnnotation = exports.ArrayTypeAnnotation = alias("arrayTypeAnnotation");
    var BooleanTypeAnnotation = exports.BooleanTypeAnnotation = alias("booleanTypeAnnotation");
    var BooleanLiteralTypeAnnotation = exports.BooleanLiteralTypeAnnotation = alias("booleanLiteralTypeAnnotation");
    var NullLiteralTypeAnnotation = exports.NullLiteralTypeAnnotation = alias("nullLiteralTypeAnnotation");
    var ClassImplements = exports.ClassImplements = alias("classImplements");
    var DeclareClass = exports.DeclareClass = alias("declareClass");
    var DeclareFunction = exports.DeclareFunction = alias("declareFunction");
    var DeclareInterface = exports.DeclareInterface = alias("declareInterface");
    var DeclareModule = exports.DeclareModule = alias("declareModule");
    var DeclareModuleExports = exports.DeclareModuleExports = alias("declareModuleExports");
    var DeclareTypeAlias = exports.DeclareTypeAlias = alias("declareTypeAlias");
    var DeclareOpaqueType = exports.DeclareOpaqueType = alias("declareOpaqueType");
    var DeclareVariable = exports.DeclareVariable = alias("declareVariable");
    var DeclareExportDeclaration = exports.DeclareExportDeclaration = alias("declareExportDeclaration");
    var DeclareExportAllDeclaration = exports.DeclareExportAllDeclaration = alias("declareExportAllDeclaration");
    var DeclaredPredicate = exports.DeclaredPredicate = alias("declaredPredicate");
    var ExistsTypeAnnotation = exports.ExistsTypeAnnotation = alias("existsTypeAnnotation");
    var FunctionTypeAnnotation = exports.FunctionTypeAnnotation = alias("functionTypeAnnotation");
    var FunctionTypeParam = exports.FunctionTypeParam = alias("functionTypeParam");
    var GenericTypeAnnotation = exports.GenericTypeAnnotation = alias("genericTypeAnnotation");
    var InferredPredicate = exports.InferredPredicate = alias("inferredPredicate");
    var InterfaceExtends = exports.InterfaceExtends = alias("interfaceExtends");
    var InterfaceDeclaration = exports.InterfaceDeclaration = alias("interfaceDeclaration");
    var InterfaceTypeAnnotation = exports.InterfaceTypeAnnotation = alias("interfaceTypeAnnotation");
    var IntersectionTypeAnnotation = exports.IntersectionTypeAnnotation = alias("intersectionTypeAnnotation");
    var MixedTypeAnnotation = exports.MixedTypeAnnotation = alias("mixedTypeAnnotation");
    var EmptyTypeAnnotation = exports.EmptyTypeAnnotation = alias("emptyTypeAnnotation");
    var NullableTypeAnnotation = exports.NullableTypeAnnotation = alias("nullableTypeAnnotation");
    var NumberLiteralTypeAnnotation = exports.NumberLiteralTypeAnnotation = alias("numberLiteralTypeAnnotation");
    var NumberTypeAnnotation = exports.NumberTypeAnnotation = alias("numberTypeAnnotation");
    var ObjectTypeAnnotation = exports.ObjectTypeAnnotation = alias("objectTypeAnnotation");
    var ObjectTypeInternalSlot = exports.ObjectTypeInternalSlot = alias("objectTypeInternalSlot");
    var ObjectTypeCallProperty = exports.ObjectTypeCallProperty = alias("objectTypeCallProperty");
    var ObjectTypeIndexer = exports.ObjectTypeIndexer = alias("objectTypeIndexer");
    var ObjectTypeProperty = exports.ObjectTypeProperty = alias("objectTypeProperty");
    var ObjectTypeSpreadProperty = exports.ObjectTypeSpreadProperty = alias("objectTypeSpreadProperty");
    var OpaqueType = exports.OpaqueType = alias("opaqueType");
    var QualifiedTypeIdentifier = exports.QualifiedTypeIdentifier = alias("qualifiedTypeIdentifier");
    var StringLiteralTypeAnnotation = exports.StringLiteralTypeAnnotation = alias("stringLiteralTypeAnnotation");
    var StringTypeAnnotation = exports.StringTypeAnnotation = alias("stringTypeAnnotation");
    var SymbolTypeAnnotation = exports.SymbolTypeAnnotation = alias("symbolTypeAnnotation");
    var ThisTypeAnnotation = exports.ThisTypeAnnotation = alias("thisTypeAnnotation");
    var TupleTypeAnnotation = exports.TupleTypeAnnotation = alias("tupleTypeAnnotation");
    var TypeofTypeAnnotation = exports.TypeofTypeAnnotation = alias("typeofTypeAnnotation");
    var TypeAlias = exports.TypeAlias = alias("typeAlias");
    var TypeAnnotation = exports.TypeAnnotation = alias("typeAnnotation");
    var TypeCastExpression = exports.TypeCastExpression = alias("typeCastExpression");
    var TypeParameter = exports.TypeParameter = alias("typeParameter");
    var TypeParameterDeclaration = exports.TypeParameterDeclaration = alias("typeParameterDeclaration");
    var TypeParameterInstantiation = exports.TypeParameterInstantiation = alias("typeParameterInstantiation");
    var UnionTypeAnnotation = exports.UnionTypeAnnotation = alias("unionTypeAnnotation");
    var Variance = exports.Variance = alias("variance");
    var VoidTypeAnnotation = exports.VoidTypeAnnotation = alias("voidTypeAnnotation");
    var EnumDeclaration = exports.EnumDeclaration = alias("enumDeclaration");
    var EnumBooleanBody = exports.EnumBooleanBody = alias("enumBooleanBody");
    var EnumNumberBody = exports.EnumNumberBody = alias("enumNumberBody");
    var EnumStringBody = exports.EnumStringBody = alias("enumStringBody");
    var EnumSymbolBody = exports.EnumSymbolBody = alias("enumSymbolBody");
    var EnumBooleanMember = exports.EnumBooleanMember = alias("enumBooleanMember");
    var EnumNumberMember = exports.EnumNumberMember = alias("enumNumberMember");
    var EnumStringMember = exports.EnumStringMember = alias("enumStringMember");
    var EnumDefaultedMember = exports.EnumDefaultedMember = alias("enumDefaultedMember");
    var IndexedAccessType = exports.IndexedAccessType = alias("indexedAccessType");
    var OptionalIndexedAccessType = exports.OptionalIndexedAccessType = alias("optionalIndexedAccessType");
    var JSXAttribute = exports.JSXAttribute = alias("jsxAttribute");
    var JSXClosingElement = exports.JSXClosingElement = alias("jsxClosingElement");
    var JSXElement = exports.JSXElement = alias("jsxElement");
    var JSXEmptyExpression = exports.JSXEmptyExpression = alias("jsxEmptyExpression");
    var JSXExpressionContainer = exports.JSXExpressionContainer = alias("jsxExpressionContainer");
    var JSXSpreadChild = exports.JSXSpreadChild = alias("jsxSpreadChild");
    var JSXIdentifier = exports.JSXIdentifier = alias("jsxIdentifier");
    var JSXMemberExpression = exports.JSXMemberExpression = alias("jsxMemberExpression");
    var JSXNamespacedName = exports.JSXNamespacedName = alias("jsxNamespacedName");
    var JSXOpeningElement = exports.JSXOpeningElement = alias("jsxOpeningElement");
    var JSXSpreadAttribute = exports.JSXSpreadAttribute = alias("jsxSpreadAttribute");
    var JSXText = exports.JSXText = alias("jsxText");
    var JSXFragment = exports.JSXFragment = alias("jsxFragment");
    var JSXOpeningFragment = exports.JSXOpeningFragment = alias("jsxOpeningFragment");
    var JSXClosingFragment = exports.JSXClosingFragment = alias("jsxClosingFragment");
    var Noop = exports.Noop = alias("noop");
    var Placeholder = exports.Placeholder = alias("placeholder");
    var V8IntrinsicIdentifier = exports.V8IntrinsicIdentifier = alias("v8IntrinsicIdentifier");
    var ArgumentPlaceholder = exports.ArgumentPlaceholder = alias("argumentPlaceholder");
    var BindExpression = exports.BindExpression = alias("bindExpression");
    var Decorator = exports.Decorator = alias("decorator");
    var DoExpression = exports.DoExpression = alias("doExpression");
    var ExportDefaultSpecifier = exports.ExportDefaultSpecifier = alias("exportDefaultSpecifier");
    var RecordExpression = exports.RecordExpression = alias("recordExpression");
    var TupleExpression = exports.TupleExpression = alias("tupleExpression");
    var DecimalLiteral = exports.DecimalLiteral = alias("decimalLiteral");
    var ModuleExpression = exports.ModuleExpression = alias("moduleExpression");
    var TopicReference = exports.TopicReference = alias("topicReference");
    var PipelineTopicExpression = exports.PipelineTopicExpression = alias("pipelineTopicExpression");
    var PipelineBareFunction = exports.PipelineBareFunction = alias("pipelineBareFunction");
    var PipelinePrimaryTopicReference = exports.PipelinePrimaryTopicReference = alias("pipelinePrimaryTopicReference");
    var VoidPattern = exports.VoidPattern = alias("voidPattern");
    var TSParameterProperty = exports.TSParameterProperty = alias("tsParameterProperty");
    var TSDeclareFunction = exports.TSDeclareFunction = alias("tsDeclareFunction");
    var TSDeclareMethod = exports.TSDeclareMethod = alias("tsDeclareMethod");
    var TSQualifiedName = exports.TSQualifiedName = alias("tsQualifiedName");
    var TSCallSignatureDeclaration = exports.TSCallSignatureDeclaration = alias("tsCallSignatureDeclaration");
    var TSConstructSignatureDeclaration = exports.TSConstructSignatureDeclaration = alias("tsConstructSignatureDeclaration");
    var TSPropertySignature = exports.TSPropertySignature = alias("tsPropertySignature");
    var TSMethodSignature = exports.TSMethodSignature = alias("tsMethodSignature");
    var TSIndexSignature = exports.TSIndexSignature = alias("tsIndexSignature");
    var TSAnyKeyword = exports.TSAnyKeyword = alias("tsAnyKeyword");
    var TSBooleanKeyword = exports.TSBooleanKeyword = alias("tsBooleanKeyword");
    var TSBigIntKeyword = exports.TSBigIntKeyword = alias("tsBigIntKeyword");
    var TSIntrinsicKeyword = exports.TSIntrinsicKeyword = alias("tsIntrinsicKeyword");
    var TSNeverKeyword = exports.TSNeverKeyword = alias("tsNeverKeyword");
    var TSNullKeyword = exports.TSNullKeyword = alias("tsNullKeyword");
    var TSNumberKeyword = exports.TSNumberKeyword = alias("tsNumberKeyword");
    var TSObjectKeyword = exports.TSObjectKeyword = alias("tsObjectKeyword");
    var TSStringKeyword = exports.TSStringKeyword = alias("tsStringKeyword");
    var TSSymbolKeyword = exports.TSSymbolKeyword = alias("tsSymbolKeyword");
    var TSUndefinedKeyword = exports.TSUndefinedKeyword = alias("tsUndefinedKeyword");
    var TSUnknownKeyword = exports.TSUnknownKeyword = alias("tsUnknownKeyword");
    var TSVoidKeyword = exports.TSVoidKeyword = alias("tsVoidKeyword");
    var TSThisType = exports.TSThisType = alias("tsThisType");
    var TSFunctionType = exports.TSFunctionType = alias("tsFunctionType");
    var TSConstructorType = exports.TSConstructorType = alias("tsConstructorType");
    var TSTypeReference = exports.TSTypeReference = alias("tsTypeReference");
    var TSTypePredicate = exports.TSTypePredicate = alias("tsTypePredicate");
    var TSTypeQuery = exports.TSTypeQuery = alias("tsTypeQuery");
    var TSTypeLiteral = exports.TSTypeLiteral = alias("tsTypeLiteral");
    var TSArrayType = exports.TSArrayType = alias("tsArrayType");
    var TSTupleType = exports.TSTupleType = alias("tsTupleType");
    var TSOptionalType = exports.TSOptionalType = alias("tsOptionalType");
    var TSRestType = exports.TSRestType = alias("tsRestType");
    var TSNamedTupleMember = exports.TSNamedTupleMember = alias("tsNamedTupleMember");
    var TSUnionType = exports.TSUnionType = alias("tsUnionType");
    var TSIntersectionType = exports.TSIntersectionType = alias("tsIntersectionType");
    var TSConditionalType = exports.TSConditionalType = alias("tsConditionalType");
    var TSInferType = exports.TSInferType = alias("tsInferType");
    var TSParenthesizedType = exports.TSParenthesizedType = alias("tsParenthesizedType");
    var TSTypeOperator = exports.TSTypeOperator = alias("tsTypeOperator");
    var TSIndexedAccessType = exports.TSIndexedAccessType = alias("tsIndexedAccessType");
    var TSMappedType = exports.TSMappedType = alias("tsMappedType");
    var TSTemplateLiteralType = exports.TSTemplateLiteralType = alias("tsTemplateLiteralType");
    var TSLiteralType = exports.TSLiteralType = alias("tsLiteralType");
    var TSExpressionWithTypeArguments = exports.TSExpressionWithTypeArguments = alias("tsExpressionWithTypeArguments");
    var TSInterfaceDeclaration = exports.TSInterfaceDeclaration = alias("tsInterfaceDeclaration");
    var TSInterfaceBody = exports.TSInterfaceBody = alias("tsInterfaceBody");
    var TSTypeAliasDeclaration = exports.TSTypeAliasDeclaration = alias("tsTypeAliasDeclaration");
    var TSInstantiationExpression = exports.TSInstantiationExpression = alias("tsInstantiationExpression");
    var TSAsExpression = exports.TSAsExpression = alias("tsAsExpression");
    var TSSatisfiesExpression = exports.TSSatisfiesExpression = alias("tsSatisfiesExpression");
    var TSTypeAssertion = exports.TSTypeAssertion = alias("tsTypeAssertion");
    var TSEnumBody = exports.TSEnumBody = alias("tsEnumBody");
    var TSEnumDeclaration = exports.TSEnumDeclaration = alias("tsEnumDeclaration");
    var TSEnumMember = exports.TSEnumMember = alias("tsEnumMember");
    var TSModuleDeclaration = exports.TSModuleDeclaration = alias("tsModuleDeclaration");
    var TSModuleBlock = exports.TSModuleBlock = alias("tsModuleBlock");
    var TSImportType = exports.TSImportType = alias("tsImportType");
    var TSImportEqualsDeclaration = exports.TSImportEqualsDeclaration = alias("tsImportEqualsDeclaration");
    var TSExternalModuleReference = exports.TSExternalModuleReference = alias("tsExternalModuleReference");
    var TSNonNullExpression = exports.TSNonNullExpression = alias("tsNonNullExpression");
    var TSExportAssignment = exports.TSExportAssignment = alias("tsExportAssignment");
    var TSNamespaceExportDeclaration = exports.TSNamespaceExportDeclaration = alias("tsNamespaceExportDeclaration");
    var TSTypeAnnotation = exports.TSTypeAnnotation = alias("tsTypeAnnotation");
    var TSTypeParameterInstantiation = exports.TSTypeParameterInstantiation = alias("tsTypeParameterInstantiation");
    var TSTypeParameterDeclaration = exports.TSTypeParameterDeclaration = alias("tsTypeParameterDeclaration");
    var TSTypeParameter = exports.TSTypeParameter = alias("tsTypeParameter");
    var NumberLiteral = exports.NumberLiteral = b.numberLiteral;
    var RegexLiteral = exports.RegexLiteral = b.regexLiteral;
    var RestProperty = exports.RestProperty = b.restProperty;
    var SpreadProperty = exports.SpreadProperty = b.spreadProperty;
  }
});

// ../node_modules/@babel/types/lib/builders/generated/index.js
var require_generated2 = __commonJS({
  "../node_modules/@babel/types/lib/builders/generated/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var _lowercase = require_lowercase();
    Object.keys(_lowercase).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (key in exports && exports[key] === _lowercase[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _lowercase[key];
        }
      });
    });
    var _uppercase = require_uppercase();
    Object.keys(_uppercase).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (key in exports && exports[key] === _uppercase[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _uppercase[key];
        }
      });
    });
  }
});

// ../node_modules/@babel/types/lib/utils/react/cleanJSXElementLiteralChild.js
var require_cleanJSXElementLiteralChild = __commonJS({
  "../node_modules/@babel/types/lib/utils/react/cleanJSXElementLiteralChild.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = cleanJSXElementLiteralChild;
    var _index = require_generated2();
    var _index2 = require_lib3();
    function cleanJSXElementLiteralChild(child, args) {
      const lines = child.value.split(/\r\n|\n|\r/);
      let lastNonEmptyLine = 0;
      for (let i = 0; i < lines.length; i++) {
        if (/[^ \t]/.exec(lines[i])) {
          lastNonEmptyLine = i;
        }
      }
      let str = "";
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isFirstLine = i === 0;
        const isLastLine = i === lines.length - 1;
        const isLastNonEmptyLine = i === lastNonEmptyLine;
        let trimmedLine = line.replace(/\t/g, " ");
        if (!isFirstLine) {
          trimmedLine = trimmedLine.replace(/^ +/, "");
        }
        if (!isLastLine) {
          trimmedLine = trimmedLine.replace(/ +$/, "");
        }
        if (trimmedLine) {
          if (!isLastNonEmptyLine) {
            trimmedLine += " ";
          }
          str += trimmedLine;
        }
      }
      if (str) args.push((0, _index2.inherits)((0, _index.stringLiteral)(str), child));
    }
  }
});

// ../node_modules/@babel/types/lib/builders/react/buildChildren.js
var require_buildChildren = __commonJS({
  "../node_modules/@babel/types/lib/builders/react/buildChildren.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = buildChildren;
    var _index = require_generated();
    var _cleanJSXElementLiteralChild = require_cleanJSXElementLiteralChild();
    function buildChildren(node) {
      const elements = [];
      for (let i = 0; i < node.children.length; i++) {
        let child = node.children[i];
        if ((0, _index.isJSXText)(child)) {
          (0, _cleanJSXElementLiteralChild.default)(child, elements);
          continue;
        }
        if ((0, _index.isJSXExpressionContainer)(child)) child = child.expression;
        if ((0, _index.isJSXEmptyExpression)(child)) continue;
        elements.push(child);
      }
      return elements;
    }
  }
});

// ../node_modules/@babel/types/lib/validators/isNode.js
var require_isNode = __commonJS({
  "../node_modules/@babel/types/lib/validators/isNode.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isNode;
    var _index = require_definitions();
    function isNode(node) {
      return !!(node && _index.VISITOR_KEYS[node.type]);
    }
  }
});

// ../node_modules/@babel/types/lib/asserts/assertNode.js
var require_assertNode = __commonJS({
  "../node_modules/@babel/types/lib/asserts/assertNode.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = assertNode;
    var _isNode = require_isNode();
    function assertNode(node) {
      if (!(0, _isNode.default)(node)) {
        var _node$type;
        const type = (_node$type = node == null ? void 0 : node.type) != null ? _node$type : JSON.stringify(node);
        throw new TypeError(`Not a valid node of type "${type}"`);
      }
    }
  }
});

// ../node_modules/@babel/types/lib/asserts/generated/index.js
var require_generated3 = __commonJS({
  "../node_modules/@babel/types/lib/asserts/generated/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.assertAccessor = assertAccessor;
    exports.assertAnyTypeAnnotation = assertAnyTypeAnnotation;
    exports.assertArgumentPlaceholder = assertArgumentPlaceholder;
    exports.assertArrayExpression = assertArrayExpression;
    exports.assertArrayPattern = assertArrayPattern;
    exports.assertArrayTypeAnnotation = assertArrayTypeAnnotation;
    exports.assertArrowFunctionExpression = assertArrowFunctionExpression;
    exports.assertAssignmentExpression = assertAssignmentExpression;
    exports.assertAssignmentPattern = assertAssignmentPattern;
    exports.assertAwaitExpression = assertAwaitExpression;
    exports.assertBigIntLiteral = assertBigIntLiteral;
    exports.assertBinary = assertBinary;
    exports.assertBinaryExpression = assertBinaryExpression;
    exports.assertBindExpression = assertBindExpression;
    exports.assertBlock = assertBlock;
    exports.assertBlockParent = assertBlockParent;
    exports.assertBlockStatement = assertBlockStatement;
    exports.assertBooleanLiteral = assertBooleanLiteral;
    exports.assertBooleanLiteralTypeAnnotation = assertBooleanLiteralTypeAnnotation;
    exports.assertBooleanTypeAnnotation = assertBooleanTypeAnnotation;
    exports.assertBreakStatement = assertBreakStatement;
    exports.assertCallExpression = assertCallExpression;
    exports.assertCatchClause = assertCatchClause;
    exports.assertClass = assertClass;
    exports.assertClassAccessorProperty = assertClassAccessorProperty;
    exports.assertClassBody = assertClassBody;
    exports.assertClassDeclaration = assertClassDeclaration;
    exports.assertClassExpression = assertClassExpression;
    exports.assertClassImplements = assertClassImplements;
    exports.assertClassMethod = assertClassMethod;
    exports.assertClassPrivateMethod = assertClassPrivateMethod;
    exports.assertClassPrivateProperty = assertClassPrivateProperty;
    exports.assertClassProperty = assertClassProperty;
    exports.assertCompletionStatement = assertCompletionStatement;
    exports.assertConditional = assertConditional;
    exports.assertConditionalExpression = assertConditionalExpression;
    exports.assertContinueStatement = assertContinueStatement;
    exports.assertDebuggerStatement = assertDebuggerStatement;
    exports.assertDecimalLiteral = assertDecimalLiteral;
    exports.assertDeclaration = assertDeclaration;
    exports.assertDeclareClass = assertDeclareClass;
    exports.assertDeclareExportAllDeclaration = assertDeclareExportAllDeclaration;
    exports.assertDeclareExportDeclaration = assertDeclareExportDeclaration;
    exports.assertDeclareFunction = assertDeclareFunction;
    exports.assertDeclareInterface = assertDeclareInterface;
    exports.assertDeclareModule = assertDeclareModule;
    exports.assertDeclareModuleExports = assertDeclareModuleExports;
    exports.assertDeclareOpaqueType = assertDeclareOpaqueType;
    exports.assertDeclareTypeAlias = assertDeclareTypeAlias;
    exports.assertDeclareVariable = assertDeclareVariable;
    exports.assertDeclaredPredicate = assertDeclaredPredicate;
    exports.assertDecorator = assertDecorator;
    exports.assertDirective = assertDirective;
    exports.assertDirectiveLiteral = assertDirectiveLiteral;
    exports.assertDoExpression = assertDoExpression;
    exports.assertDoWhileStatement = assertDoWhileStatement;
    exports.assertEmptyStatement = assertEmptyStatement;
    exports.assertEmptyTypeAnnotation = assertEmptyTypeAnnotation;
    exports.assertEnumBody = assertEnumBody;
    exports.assertEnumBooleanBody = assertEnumBooleanBody;
    exports.assertEnumBooleanMember = assertEnumBooleanMember;
    exports.assertEnumDeclaration = assertEnumDeclaration;
    exports.assertEnumDefaultedMember = assertEnumDefaultedMember;
    exports.assertEnumMember = assertEnumMember;
    exports.assertEnumNumberBody = assertEnumNumberBody;
    exports.assertEnumNumberMember = assertEnumNumberMember;
    exports.assertEnumStringBody = assertEnumStringBody;
    exports.assertEnumStringMember = assertEnumStringMember;
    exports.assertEnumSymbolBody = assertEnumSymbolBody;
    exports.assertExistsTypeAnnotation = assertExistsTypeAnnotation;
    exports.assertExportAllDeclaration = assertExportAllDeclaration;
    exports.assertExportDeclaration = assertExportDeclaration;
    exports.assertExportDefaultDeclaration = assertExportDefaultDeclaration;
    exports.assertExportDefaultSpecifier = assertExportDefaultSpecifier;
    exports.assertExportNamedDeclaration = assertExportNamedDeclaration;
    exports.assertExportNamespaceSpecifier = assertExportNamespaceSpecifier;
    exports.assertExportSpecifier = assertExportSpecifier;
    exports.assertExpression = assertExpression;
    exports.assertExpressionStatement = assertExpressionStatement;
    exports.assertExpressionWrapper = assertExpressionWrapper;
    exports.assertFile = assertFile;
    exports.assertFlow = assertFlow;
    exports.assertFlowBaseAnnotation = assertFlowBaseAnnotation;
    exports.assertFlowDeclaration = assertFlowDeclaration;
    exports.assertFlowPredicate = assertFlowPredicate;
    exports.assertFlowType = assertFlowType;
    exports.assertFor = assertFor;
    exports.assertForInStatement = assertForInStatement;
    exports.assertForOfStatement = assertForOfStatement;
    exports.assertForStatement = assertForStatement;
    exports.assertForXStatement = assertForXStatement;
    exports.assertFunction = assertFunction;
    exports.assertFunctionDeclaration = assertFunctionDeclaration;
    exports.assertFunctionExpression = assertFunctionExpression;
    exports.assertFunctionParameter = assertFunctionParameter;
    exports.assertFunctionParent = assertFunctionParent;
    exports.assertFunctionTypeAnnotation = assertFunctionTypeAnnotation;
    exports.assertFunctionTypeParam = assertFunctionTypeParam;
    exports.assertGenericTypeAnnotation = assertGenericTypeAnnotation;
    exports.assertIdentifier = assertIdentifier;
    exports.assertIfStatement = assertIfStatement;
    exports.assertImmutable = assertImmutable;
    exports.assertImport = assertImport;
    exports.assertImportAttribute = assertImportAttribute;
    exports.assertImportDeclaration = assertImportDeclaration;
    exports.assertImportDefaultSpecifier = assertImportDefaultSpecifier;
    exports.assertImportExpression = assertImportExpression;
    exports.assertImportNamespaceSpecifier = assertImportNamespaceSpecifier;
    exports.assertImportOrExportDeclaration = assertImportOrExportDeclaration;
    exports.assertImportSpecifier = assertImportSpecifier;
    exports.assertIndexedAccessType = assertIndexedAccessType;
    exports.assertInferredPredicate = assertInferredPredicate;
    exports.assertInterfaceDeclaration = assertInterfaceDeclaration;
    exports.assertInterfaceExtends = assertInterfaceExtends;
    exports.assertInterfaceTypeAnnotation = assertInterfaceTypeAnnotation;
    exports.assertInterpreterDirective = assertInterpreterDirective;
    exports.assertIntersectionTypeAnnotation = assertIntersectionTypeAnnotation;
    exports.assertJSX = assertJSX;
    exports.assertJSXAttribute = assertJSXAttribute;
    exports.assertJSXClosingElement = assertJSXClosingElement;
    exports.assertJSXClosingFragment = assertJSXClosingFragment;
    exports.assertJSXElement = assertJSXElement;
    exports.assertJSXEmptyExpression = assertJSXEmptyExpression;
    exports.assertJSXExpressionContainer = assertJSXExpressionContainer;
    exports.assertJSXFragment = assertJSXFragment;
    exports.assertJSXIdentifier = assertJSXIdentifier;
    exports.assertJSXMemberExpression = assertJSXMemberExpression;
    exports.assertJSXNamespacedName = assertJSXNamespacedName;
    exports.assertJSXOpeningElement = assertJSXOpeningElement;
    exports.assertJSXOpeningFragment = assertJSXOpeningFragment;
    exports.assertJSXSpreadAttribute = assertJSXSpreadAttribute;
    exports.assertJSXSpreadChild = assertJSXSpreadChild;
    exports.assertJSXText = assertJSXText;
    exports.assertLVal = assertLVal;
    exports.assertLabeledStatement = assertLabeledStatement;
    exports.assertLiteral = assertLiteral;
    exports.assertLogicalExpression = assertLogicalExpression;
    exports.assertLoop = assertLoop;
    exports.assertMemberExpression = assertMemberExpression;
    exports.assertMetaProperty = assertMetaProperty;
    exports.assertMethod = assertMethod;
    exports.assertMiscellaneous = assertMiscellaneous;
    exports.assertMixedTypeAnnotation = assertMixedTypeAnnotation;
    exports.assertModuleDeclaration = assertModuleDeclaration;
    exports.assertModuleExpression = assertModuleExpression;
    exports.assertModuleSpecifier = assertModuleSpecifier;
    exports.assertNewExpression = assertNewExpression;
    exports.assertNoop = assertNoop;
    exports.assertNullLiteral = assertNullLiteral;
    exports.assertNullLiteralTypeAnnotation = assertNullLiteralTypeAnnotation;
    exports.assertNullableTypeAnnotation = assertNullableTypeAnnotation;
    exports.assertNumberLiteral = assertNumberLiteral;
    exports.assertNumberLiteralTypeAnnotation = assertNumberLiteralTypeAnnotation;
    exports.assertNumberTypeAnnotation = assertNumberTypeAnnotation;
    exports.assertNumericLiteral = assertNumericLiteral;
    exports.assertObjectExpression = assertObjectExpression;
    exports.assertObjectMember = assertObjectMember;
    exports.assertObjectMethod = assertObjectMethod;
    exports.assertObjectPattern = assertObjectPattern;
    exports.assertObjectProperty = assertObjectProperty;
    exports.assertObjectTypeAnnotation = assertObjectTypeAnnotation;
    exports.assertObjectTypeCallProperty = assertObjectTypeCallProperty;
    exports.assertObjectTypeIndexer = assertObjectTypeIndexer;
    exports.assertObjectTypeInternalSlot = assertObjectTypeInternalSlot;
    exports.assertObjectTypeProperty = assertObjectTypeProperty;
    exports.assertObjectTypeSpreadProperty = assertObjectTypeSpreadProperty;
    exports.assertOpaqueType = assertOpaqueType;
    exports.assertOptionalCallExpression = assertOptionalCallExpression;
    exports.assertOptionalIndexedAccessType = assertOptionalIndexedAccessType;
    exports.assertOptionalMemberExpression = assertOptionalMemberExpression;
    exports.assertParenthesizedExpression = assertParenthesizedExpression;
    exports.assertPattern = assertPattern;
    exports.assertPatternLike = assertPatternLike;
    exports.assertPipelineBareFunction = assertPipelineBareFunction;
    exports.assertPipelinePrimaryTopicReference = assertPipelinePrimaryTopicReference;
    exports.assertPipelineTopicExpression = assertPipelineTopicExpression;
    exports.assertPlaceholder = assertPlaceholder;
    exports.assertPrivate = assertPrivate;
    exports.assertPrivateName = assertPrivateName;
    exports.assertProgram = assertProgram;
    exports.assertProperty = assertProperty;
    exports.assertPureish = assertPureish;
    exports.assertQualifiedTypeIdentifier = assertQualifiedTypeIdentifier;
    exports.assertRecordExpression = assertRecordExpression;
    exports.assertRegExpLiteral = assertRegExpLiteral;
    exports.assertRegexLiteral = assertRegexLiteral;
    exports.assertRestElement = assertRestElement;
    exports.assertRestProperty = assertRestProperty;
    exports.assertReturnStatement = assertReturnStatement;
    exports.assertScopable = assertScopable;
    exports.assertSequenceExpression = assertSequenceExpression;
    exports.assertSpreadElement = assertSpreadElement;
    exports.assertSpreadProperty = assertSpreadProperty;
    exports.assertStandardized = assertStandardized;
    exports.assertStatement = assertStatement;
    exports.assertStaticBlock = assertStaticBlock;
    exports.assertStringLiteral = assertStringLiteral;
    exports.assertStringLiteralTypeAnnotation = assertStringLiteralTypeAnnotation;
    exports.assertStringTypeAnnotation = assertStringTypeAnnotation;
    exports.assertSuper = assertSuper;
    exports.assertSwitchCase = assertSwitchCase;
    exports.assertSwitchStatement = assertSwitchStatement;
    exports.assertSymbolTypeAnnotation = assertSymbolTypeAnnotation;
    exports.assertTSAnyKeyword = assertTSAnyKeyword;
    exports.assertTSArrayType = assertTSArrayType;
    exports.assertTSAsExpression = assertTSAsExpression;
    exports.assertTSBaseType = assertTSBaseType;
    exports.assertTSBigIntKeyword = assertTSBigIntKeyword;
    exports.assertTSBooleanKeyword = assertTSBooleanKeyword;
    exports.assertTSCallSignatureDeclaration = assertTSCallSignatureDeclaration;
    exports.assertTSConditionalType = assertTSConditionalType;
    exports.assertTSConstructSignatureDeclaration = assertTSConstructSignatureDeclaration;
    exports.assertTSConstructorType = assertTSConstructorType;
    exports.assertTSDeclareFunction = assertTSDeclareFunction;
    exports.assertTSDeclareMethod = assertTSDeclareMethod;
    exports.assertTSEntityName = assertTSEntityName;
    exports.assertTSEnumBody = assertTSEnumBody;
    exports.assertTSEnumDeclaration = assertTSEnumDeclaration;
    exports.assertTSEnumMember = assertTSEnumMember;
    exports.assertTSExportAssignment = assertTSExportAssignment;
    exports.assertTSExpressionWithTypeArguments = assertTSExpressionWithTypeArguments;
    exports.assertTSExternalModuleReference = assertTSExternalModuleReference;
    exports.assertTSFunctionType = assertTSFunctionType;
    exports.assertTSImportEqualsDeclaration = assertTSImportEqualsDeclaration;
    exports.assertTSImportType = assertTSImportType;
    exports.assertTSIndexSignature = assertTSIndexSignature;
    exports.assertTSIndexedAccessType = assertTSIndexedAccessType;
    exports.assertTSInferType = assertTSInferType;
    exports.assertTSInstantiationExpression = assertTSInstantiationExpression;
    exports.assertTSInterfaceBody = assertTSInterfaceBody;
    exports.assertTSInterfaceDeclaration = assertTSInterfaceDeclaration;
    exports.assertTSIntersectionType = assertTSIntersectionType;
    exports.assertTSIntrinsicKeyword = assertTSIntrinsicKeyword;
    exports.assertTSLiteralType = assertTSLiteralType;
    exports.assertTSMappedType = assertTSMappedType;
    exports.assertTSMethodSignature = assertTSMethodSignature;
    exports.assertTSModuleBlock = assertTSModuleBlock;
    exports.assertTSModuleDeclaration = assertTSModuleDeclaration;
    exports.assertTSNamedTupleMember = assertTSNamedTupleMember;
    exports.assertTSNamespaceExportDeclaration = assertTSNamespaceExportDeclaration;
    exports.assertTSNeverKeyword = assertTSNeverKeyword;
    exports.assertTSNonNullExpression = assertTSNonNullExpression;
    exports.assertTSNullKeyword = assertTSNullKeyword;
    exports.assertTSNumberKeyword = assertTSNumberKeyword;
    exports.assertTSObjectKeyword = assertTSObjectKeyword;
    exports.assertTSOptionalType = assertTSOptionalType;
    exports.assertTSParameterProperty = assertTSParameterProperty;
    exports.assertTSParenthesizedType = assertTSParenthesizedType;
    exports.assertTSPropertySignature = assertTSPropertySignature;
    exports.assertTSQualifiedName = assertTSQualifiedName;
    exports.assertTSRestType = assertTSRestType;
    exports.assertTSSatisfiesExpression = assertTSSatisfiesExpression;
    exports.assertTSStringKeyword = assertTSStringKeyword;
    exports.assertTSSymbolKeyword = assertTSSymbolKeyword;
    exports.assertTSTemplateLiteralType = assertTSTemplateLiteralType;
    exports.assertTSThisType = assertTSThisType;
    exports.assertTSTupleType = assertTSTupleType;
    exports.assertTSType = assertTSType;
    exports.assertTSTypeAliasDeclaration = assertTSTypeAliasDeclaration;
    exports.assertTSTypeAnnotation = assertTSTypeAnnotation;
    exports.assertTSTypeAssertion = assertTSTypeAssertion;
    exports.assertTSTypeElement = assertTSTypeElement;
    exports.assertTSTypeLiteral = assertTSTypeLiteral;
    exports.assertTSTypeOperator = assertTSTypeOperator;
    exports.assertTSTypeParameter = assertTSTypeParameter;
    exports.assertTSTypeParameterDeclaration = assertTSTypeParameterDeclaration;
    exports.assertTSTypeParameterInstantiation = assertTSTypeParameterInstantiation;
    exports.assertTSTypePredicate = assertTSTypePredicate;
    exports.assertTSTypeQuery = assertTSTypeQuery;
    exports.assertTSTypeReference = assertTSTypeReference;
    exports.assertTSUndefinedKeyword = assertTSUndefinedKeyword;
    exports.assertTSUnionType = assertTSUnionType;
    exports.assertTSUnknownKeyword = assertTSUnknownKeyword;
    exports.assertTSVoidKeyword = assertTSVoidKeyword;
    exports.assertTaggedTemplateExpression = assertTaggedTemplateExpression;
    exports.assertTemplateElement = assertTemplateElement;
    exports.assertTemplateLiteral = assertTemplateLiteral;
    exports.assertTerminatorless = assertTerminatorless;
    exports.assertThisExpression = assertThisExpression;
    exports.assertThisTypeAnnotation = assertThisTypeAnnotation;
    exports.assertThrowStatement = assertThrowStatement;
    exports.assertTopicReference = assertTopicReference;
    exports.assertTryStatement = assertTryStatement;
    exports.assertTupleExpression = assertTupleExpression;
    exports.assertTupleTypeAnnotation = assertTupleTypeAnnotation;
    exports.assertTypeAlias = assertTypeAlias;
    exports.assertTypeAnnotation = assertTypeAnnotation;
    exports.assertTypeCastExpression = assertTypeCastExpression;
    exports.assertTypeParameter = assertTypeParameter;
    exports.assertTypeParameterDeclaration = assertTypeParameterDeclaration;
    exports.assertTypeParameterInstantiation = assertTypeParameterInstantiation;
    exports.assertTypeScript = assertTypeScript;
    exports.assertTypeofTypeAnnotation = assertTypeofTypeAnnotation;
    exports.assertUnaryExpression = assertUnaryExpression;
    exports.assertUnaryLike = assertUnaryLike;
    exports.assertUnionTypeAnnotation = assertUnionTypeAnnotation;
    exports.assertUpdateExpression = assertUpdateExpression;
    exports.assertUserWhitespacable = assertUserWhitespacable;
    exports.assertV8IntrinsicIdentifier = assertV8IntrinsicIdentifier;
    exports.assertVariableDeclaration = assertVariableDeclaration;
    exports.assertVariableDeclarator = assertVariableDeclarator;
    exports.assertVariance = assertVariance;
    exports.assertVoidPattern = assertVoidPattern;
    exports.assertVoidTypeAnnotation = assertVoidTypeAnnotation;
    exports.assertWhile = assertWhile;
    exports.assertWhileStatement = assertWhileStatement;
    exports.assertWithStatement = assertWithStatement;
    exports.assertYieldExpression = assertYieldExpression;
    var _is = require_is();
    var _deprecationWarning = require_deprecationWarning();
    function assert(type, node, opts) {
      if (!(0, _is.default)(type, node, opts)) {
        throw new Error(`Expected type "${type}" with option ${JSON.stringify(opts)}, but instead got "${node.type}".`);
      }
    }
    function assertArrayExpression(node, opts) {
      assert("ArrayExpression", node, opts);
    }
    function assertAssignmentExpression(node, opts) {
      assert("AssignmentExpression", node, opts);
    }
    function assertBinaryExpression(node, opts) {
      assert("BinaryExpression", node, opts);
    }
    function assertInterpreterDirective(node, opts) {
      assert("InterpreterDirective", node, opts);
    }
    function assertDirective(node, opts) {
      assert("Directive", node, opts);
    }
    function assertDirectiveLiteral(node, opts) {
      assert("DirectiveLiteral", node, opts);
    }
    function assertBlockStatement(node, opts) {
      assert("BlockStatement", node, opts);
    }
    function assertBreakStatement(node, opts) {
      assert("BreakStatement", node, opts);
    }
    function assertCallExpression(node, opts) {
      assert("CallExpression", node, opts);
    }
    function assertCatchClause(node, opts) {
      assert("CatchClause", node, opts);
    }
    function assertConditionalExpression(node, opts) {
      assert("ConditionalExpression", node, opts);
    }
    function assertContinueStatement(node, opts) {
      assert("ContinueStatement", node, opts);
    }
    function assertDebuggerStatement(node, opts) {
      assert("DebuggerStatement", node, opts);
    }
    function assertDoWhileStatement(node, opts) {
      assert("DoWhileStatement", node, opts);
    }
    function assertEmptyStatement(node, opts) {
      assert("EmptyStatement", node, opts);
    }
    function assertExpressionStatement(node, opts) {
      assert("ExpressionStatement", node, opts);
    }
    function assertFile(node, opts) {
      assert("File", node, opts);
    }
    function assertForInStatement(node, opts) {
      assert("ForInStatement", node, opts);
    }
    function assertForStatement(node, opts) {
      assert("ForStatement", node, opts);
    }
    function assertFunctionDeclaration(node, opts) {
      assert("FunctionDeclaration", node, opts);
    }
    function assertFunctionExpression(node, opts) {
      assert("FunctionExpression", node, opts);
    }
    function assertIdentifier(node, opts) {
      assert("Identifier", node, opts);
    }
    function assertIfStatement(node, opts) {
      assert("IfStatement", node, opts);
    }
    function assertLabeledStatement(node, opts) {
      assert("LabeledStatement", node, opts);
    }
    function assertStringLiteral(node, opts) {
      assert("StringLiteral", node, opts);
    }
    function assertNumericLiteral(node, opts) {
      assert("NumericLiteral", node, opts);
    }
    function assertNullLiteral(node, opts) {
      assert("NullLiteral", node, opts);
    }
    function assertBooleanLiteral(node, opts) {
      assert("BooleanLiteral", node, opts);
    }
    function assertRegExpLiteral(node, opts) {
      assert("RegExpLiteral", node, opts);
    }
    function assertLogicalExpression(node, opts) {
      assert("LogicalExpression", node, opts);
    }
    function assertMemberExpression(node, opts) {
      assert("MemberExpression", node, opts);
    }
    function assertNewExpression(node, opts) {
      assert("NewExpression", node, opts);
    }
    function assertProgram(node, opts) {
      assert("Program", node, opts);
    }
    function assertObjectExpression(node, opts) {
      assert("ObjectExpression", node, opts);
    }
    function assertObjectMethod(node, opts) {
      assert("ObjectMethod", node, opts);
    }
    function assertObjectProperty(node, opts) {
      assert("ObjectProperty", node, opts);
    }
    function assertRestElement(node, opts) {
      assert("RestElement", node, opts);
    }
    function assertReturnStatement(node, opts) {
      assert("ReturnStatement", node, opts);
    }
    function assertSequenceExpression(node, opts) {
      assert("SequenceExpression", node, opts);
    }
    function assertParenthesizedExpression(node, opts) {
      assert("ParenthesizedExpression", node, opts);
    }
    function assertSwitchCase(node, opts) {
      assert("SwitchCase", node, opts);
    }
    function assertSwitchStatement(node, opts) {
      assert("SwitchStatement", node, opts);
    }
    function assertThisExpression(node, opts) {
      assert("ThisExpression", node, opts);
    }
    function assertThrowStatement(node, opts) {
      assert("ThrowStatement", node, opts);
    }
    function assertTryStatement(node, opts) {
      assert("TryStatement", node, opts);
    }
    function assertUnaryExpression(node, opts) {
      assert("UnaryExpression", node, opts);
    }
    function assertUpdateExpression(node, opts) {
      assert("UpdateExpression", node, opts);
    }
    function assertVariableDeclaration(node, opts) {
      assert("VariableDeclaration", node, opts);
    }
    function assertVariableDeclarator(node, opts) {
      assert("VariableDeclarator", node, opts);
    }
    function assertWhileStatement(node, opts) {
      assert("WhileStatement", node, opts);
    }
    function assertWithStatement(node, opts) {
      assert("WithStatement", node, opts);
    }
    function assertAssignmentPattern(node, opts) {
      assert("AssignmentPattern", node, opts);
    }
    function assertArrayPattern(node, opts) {
      assert("ArrayPattern", node, opts);
    }
    function assertArrowFunctionExpression(node, opts) {
      assert("ArrowFunctionExpression", node, opts);
    }
    function assertClassBody(node, opts) {
      assert("ClassBody", node, opts);
    }
    function assertClassExpression(node, opts) {
      assert("ClassExpression", node, opts);
    }
    function assertClassDeclaration(node, opts) {
      assert("ClassDeclaration", node, opts);
    }
    function assertExportAllDeclaration(node, opts) {
      assert("ExportAllDeclaration", node, opts);
    }
    function assertExportDefaultDeclaration(node, opts) {
      assert("ExportDefaultDeclaration", node, opts);
    }
    function assertExportNamedDeclaration(node, opts) {
      assert("ExportNamedDeclaration", node, opts);
    }
    function assertExportSpecifier(node, opts) {
      assert("ExportSpecifier", node, opts);
    }
    function assertForOfStatement(node, opts) {
      assert("ForOfStatement", node, opts);
    }
    function assertImportDeclaration(node, opts) {
      assert("ImportDeclaration", node, opts);
    }
    function assertImportDefaultSpecifier(node, opts) {
      assert("ImportDefaultSpecifier", node, opts);
    }
    function assertImportNamespaceSpecifier(node, opts) {
      assert("ImportNamespaceSpecifier", node, opts);
    }
    function assertImportSpecifier(node, opts) {
      assert("ImportSpecifier", node, opts);
    }
    function assertImportExpression(node, opts) {
      assert("ImportExpression", node, opts);
    }
    function assertMetaProperty(node, opts) {
      assert("MetaProperty", node, opts);
    }
    function assertClassMethod(node, opts) {
      assert("ClassMethod", node, opts);
    }
    function assertObjectPattern(node, opts) {
      assert("ObjectPattern", node, opts);
    }
    function assertSpreadElement(node, opts) {
      assert("SpreadElement", node, opts);
    }
    function assertSuper(node, opts) {
      assert("Super", node, opts);
    }
    function assertTaggedTemplateExpression(node, opts) {
      assert("TaggedTemplateExpression", node, opts);
    }
    function assertTemplateElement(node, opts) {
      assert("TemplateElement", node, opts);
    }
    function assertTemplateLiteral(node, opts) {
      assert("TemplateLiteral", node, opts);
    }
    function assertYieldExpression(node, opts) {
      assert("YieldExpression", node, opts);
    }
    function assertAwaitExpression(node, opts) {
      assert("AwaitExpression", node, opts);
    }
    function assertImport(node, opts) {
      assert("Import", node, opts);
    }
    function assertBigIntLiteral(node, opts) {
      assert("BigIntLiteral", node, opts);
    }
    function assertExportNamespaceSpecifier(node, opts) {
      assert("ExportNamespaceSpecifier", node, opts);
    }
    function assertOptionalMemberExpression(node, opts) {
      assert("OptionalMemberExpression", node, opts);
    }
    function assertOptionalCallExpression(node, opts) {
      assert("OptionalCallExpression", node, opts);
    }
    function assertClassProperty(node, opts) {
      assert("ClassProperty", node, opts);
    }
    function assertClassAccessorProperty(node, opts) {
      assert("ClassAccessorProperty", node, opts);
    }
    function assertClassPrivateProperty(node, opts) {
      assert("ClassPrivateProperty", node, opts);
    }
    function assertClassPrivateMethod(node, opts) {
      assert("ClassPrivateMethod", node, opts);
    }
    function assertPrivateName(node, opts) {
      assert("PrivateName", node, opts);
    }
    function assertStaticBlock(node, opts) {
      assert("StaticBlock", node, opts);
    }
    function assertImportAttribute(node, opts) {
      assert("ImportAttribute", node, opts);
    }
    function assertAnyTypeAnnotation(node, opts) {
      assert("AnyTypeAnnotation", node, opts);
    }
    function assertArrayTypeAnnotation(node, opts) {
      assert("ArrayTypeAnnotation", node, opts);
    }
    function assertBooleanTypeAnnotation(node, opts) {
      assert("BooleanTypeAnnotation", node, opts);
    }
    function assertBooleanLiteralTypeAnnotation(node, opts) {
      assert("BooleanLiteralTypeAnnotation", node, opts);
    }
    function assertNullLiteralTypeAnnotation(node, opts) {
      assert("NullLiteralTypeAnnotation", node, opts);
    }
    function assertClassImplements(node, opts) {
      assert("ClassImplements", node, opts);
    }
    function assertDeclareClass(node, opts) {
      assert("DeclareClass", node, opts);
    }
    function assertDeclareFunction(node, opts) {
      assert("DeclareFunction", node, opts);
    }
    function assertDeclareInterface(node, opts) {
      assert("DeclareInterface", node, opts);
    }
    function assertDeclareModule(node, opts) {
      assert("DeclareModule", node, opts);
    }
    function assertDeclareModuleExports(node, opts) {
      assert("DeclareModuleExports", node, opts);
    }
    function assertDeclareTypeAlias(node, opts) {
      assert("DeclareTypeAlias", node, opts);
    }
    function assertDeclareOpaqueType(node, opts) {
      assert("DeclareOpaqueType", node, opts);
    }
    function assertDeclareVariable(node, opts) {
      assert("DeclareVariable", node, opts);
    }
    function assertDeclareExportDeclaration(node, opts) {
      assert("DeclareExportDeclaration", node, opts);
    }
    function assertDeclareExportAllDeclaration(node, opts) {
      assert("DeclareExportAllDeclaration", node, opts);
    }
    function assertDeclaredPredicate(node, opts) {
      assert("DeclaredPredicate", node, opts);
    }
    function assertExistsTypeAnnotation(node, opts) {
      assert("ExistsTypeAnnotation", node, opts);
    }
    function assertFunctionTypeAnnotation(node, opts) {
      assert("FunctionTypeAnnotation", node, opts);
    }
    function assertFunctionTypeParam(node, opts) {
      assert("FunctionTypeParam", node, opts);
    }
    function assertGenericTypeAnnotation(node, opts) {
      assert("GenericTypeAnnotation", node, opts);
    }
    function assertInferredPredicate(node, opts) {
      assert("InferredPredicate", node, opts);
    }
    function assertInterfaceExtends(node, opts) {
      assert("InterfaceExtends", node, opts);
    }
    function assertInterfaceDeclaration(node, opts) {
      assert("InterfaceDeclaration", node, opts);
    }
    function assertInterfaceTypeAnnotation(node, opts) {
      assert("InterfaceTypeAnnotation", node, opts);
    }
    function assertIntersectionTypeAnnotation(node, opts) {
      assert("IntersectionTypeAnnotation", node, opts);
    }
    function assertMixedTypeAnnotation(node, opts) {
      assert("MixedTypeAnnotation", node, opts);
    }
    function assertEmptyTypeAnnotation(node, opts) {
      assert("EmptyTypeAnnotation", node, opts);
    }
    function assertNullableTypeAnnotation(node, opts) {
      assert("NullableTypeAnnotation", node, opts);
    }
    function assertNumberLiteralTypeAnnotation(node, opts) {
      assert("NumberLiteralTypeAnnotation", node, opts);
    }
    function assertNumberTypeAnnotation(node, opts) {
      assert("NumberTypeAnnotation", node, opts);
    }
    function assertObjectTypeAnnotation(node, opts) {
      assert("ObjectTypeAnnotation", node, opts);
    }
    function assertObjectTypeInternalSlot(node, opts) {
      assert("ObjectTypeInternalSlot", node, opts);
    }
    function assertObjectTypeCallProperty(node, opts) {
      assert("ObjectTypeCallProperty", node, opts);
    }
    function assertObjectTypeIndexer(node, opts) {
      assert("ObjectTypeIndexer", node, opts);
    }
    function assertObjectTypeProperty(node, opts) {
      assert("ObjectTypeProperty", node, opts);
    }
    function assertObjectTypeSpreadProperty(node, opts) {
      assert("ObjectTypeSpreadProperty", node, opts);
    }
    function assertOpaqueType(node, opts) {
      assert("OpaqueType", node, opts);
    }
    function assertQualifiedTypeIdentifier(node, opts) {
      assert("QualifiedTypeIdentifier", node, opts);
    }
    function assertStringLiteralTypeAnnotation(node, opts) {
      assert("StringLiteralTypeAnnotation", node, opts);
    }
    function assertStringTypeAnnotation(node, opts) {
      assert("StringTypeAnnotation", node, opts);
    }
    function assertSymbolTypeAnnotation(node, opts) {
      assert("SymbolTypeAnnotation", node, opts);
    }
    function assertThisTypeAnnotation(node, opts) {
      assert("ThisTypeAnnotation", node, opts);
    }
    function assertTupleTypeAnnotation(node, opts) {
      assert("TupleTypeAnnotation", node, opts);
    }
    function assertTypeofTypeAnnotation(node, opts) {
      assert("TypeofTypeAnnotation", node, opts);
    }
    function assertTypeAlias(node, opts) {
      assert("TypeAlias", node, opts);
    }
    function assertTypeAnnotation(node, opts) {
      assert("TypeAnnotation", node, opts);
    }
    function assertTypeCastExpression(node, opts) {
      assert("TypeCastExpression", node, opts);
    }
    function assertTypeParameter(node, opts) {
      assert("TypeParameter", node, opts);
    }
    function assertTypeParameterDeclaration(node, opts) {
      assert("TypeParameterDeclaration", node, opts);
    }
    function assertTypeParameterInstantiation(node, opts) {
      assert("TypeParameterInstantiation", node, opts);
    }
    function assertUnionTypeAnnotation(node, opts) {
      assert("UnionTypeAnnotation", node, opts);
    }
    function assertVariance(node, opts) {
      assert("Variance", node, opts);
    }
    function assertVoidTypeAnnotation(node, opts) {
      assert("VoidTypeAnnotation", node, opts);
    }
    function assertEnumDeclaration(node, opts) {
      assert("EnumDeclaration", node, opts);
    }
    function assertEnumBooleanBody(node, opts) {
      assert("EnumBooleanBody", node, opts);
    }
    function assertEnumNumberBody(node, opts) {
      assert("EnumNumberBody", node, opts);
    }
    function assertEnumStringBody(node, opts) {
      assert("EnumStringBody", node, opts);
    }
    function assertEnumSymbolBody(node, opts) {
      assert("EnumSymbolBody", node, opts);
    }
    function assertEnumBooleanMember(node, opts) {
      assert("EnumBooleanMember", node, opts);
    }
    function assertEnumNumberMember(node, opts) {
      assert("EnumNumberMember", node, opts);
    }
    function assertEnumStringMember(node, opts) {
      assert("EnumStringMember", node, opts);
    }
    function assertEnumDefaultedMember(node, opts) {
      assert("EnumDefaultedMember", node, opts);
    }
    function assertIndexedAccessType(node, opts) {
      assert("IndexedAccessType", node, opts);
    }
    function assertOptionalIndexedAccessType(node, opts) {
      assert("OptionalIndexedAccessType", node, opts);
    }
    function assertJSXAttribute(node, opts) {
      assert("JSXAttribute", node, opts);
    }
    function assertJSXClosingElement(node, opts) {
      assert("JSXClosingElement", node, opts);
    }
    function assertJSXElement(node, opts) {
      assert("JSXElement", node, opts);
    }
    function assertJSXEmptyExpression(node, opts) {
      assert("JSXEmptyExpression", node, opts);
    }
    function assertJSXExpressionContainer(node, opts) {
      assert("JSXExpressionContainer", node, opts);
    }
    function assertJSXSpreadChild(node, opts) {
      assert("JSXSpreadChild", node, opts);
    }
    function assertJSXIdentifier(node, opts) {
      assert("JSXIdentifier", node, opts);
    }
    function assertJSXMemberExpression(node, opts) {
      assert("JSXMemberExpression", node, opts);
    }
    function assertJSXNamespacedName(node, opts) {
      assert("JSXNamespacedName", node, opts);
    }
    function assertJSXOpeningElement(node, opts) {
      assert("JSXOpeningElement", node, opts);
    }
    function assertJSXSpreadAttribute(node, opts) {
      assert("JSXSpreadAttribute", node, opts);
    }
    function assertJSXText(node, opts) {
      assert("JSXText", node, opts);
    }
    function assertJSXFragment(node, opts) {
      assert("JSXFragment", node, opts);
    }
    function assertJSXOpeningFragment(node, opts) {
      assert("JSXOpeningFragment", node, opts);
    }
    function assertJSXClosingFragment(node, opts) {
      assert("JSXClosingFragment", node, opts);
    }
    function assertNoop(node, opts) {
      assert("Noop", node, opts);
    }
    function assertPlaceholder(node, opts) {
      assert("Placeholder", node, opts);
    }
    function assertV8IntrinsicIdentifier(node, opts) {
      assert("V8IntrinsicIdentifier", node, opts);
    }
    function assertArgumentPlaceholder(node, opts) {
      assert("ArgumentPlaceholder", node, opts);
    }
    function assertBindExpression(node, opts) {
      assert("BindExpression", node, opts);
    }
    function assertDecorator(node, opts) {
      assert("Decorator", node, opts);
    }
    function assertDoExpression(node, opts) {
      assert("DoExpression", node, opts);
    }
    function assertExportDefaultSpecifier(node, opts) {
      assert("ExportDefaultSpecifier", node, opts);
    }
    function assertRecordExpression(node, opts) {
      assert("RecordExpression", node, opts);
    }
    function assertTupleExpression(node, opts) {
      assert("TupleExpression", node, opts);
    }
    function assertDecimalLiteral(node, opts) {
      assert("DecimalLiteral", node, opts);
    }
    function assertModuleExpression(node, opts) {
      assert("ModuleExpression", node, opts);
    }
    function assertTopicReference(node, opts) {
      assert("TopicReference", node, opts);
    }
    function assertPipelineTopicExpression(node, opts) {
      assert("PipelineTopicExpression", node, opts);
    }
    function assertPipelineBareFunction(node, opts) {
      assert("PipelineBareFunction", node, opts);
    }
    function assertPipelinePrimaryTopicReference(node, opts) {
      assert("PipelinePrimaryTopicReference", node, opts);
    }
    function assertVoidPattern(node, opts) {
      assert("VoidPattern", node, opts);
    }
    function assertTSParameterProperty(node, opts) {
      assert("TSParameterProperty", node, opts);
    }
    function assertTSDeclareFunction(node, opts) {
      assert("TSDeclareFunction", node, opts);
    }
    function assertTSDeclareMethod(node, opts) {
      assert("TSDeclareMethod", node, opts);
    }
    function assertTSQualifiedName(node, opts) {
      assert("TSQualifiedName", node, opts);
    }
    function assertTSCallSignatureDeclaration(node, opts) {
      assert("TSCallSignatureDeclaration", node, opts);
    }
    function assertTSConstructSignatureDeclaration(node, opts) {
      assert("TSConstructSignatureDeclaration", node, opts);
    }
    function assertTSPropertySignature(node, opts) {
      assert("TSPropertySignature", node, opts);
    }
    function assertTSMethodSignature(node, opts) {
      assert("TSMethodSignature", node, opts);
    }
    function assertTSIndexSignature(node, opts) {
      assert("TSIndexSignature", node, opts);
    }
    function assertTSAnyKeyword(node, opts) {
      assert("TSAnyKeyword", node, opts);
    }
    function assertTSBooleanKeyword(node, opts) {
      assert("TSBooleanKeyword", node, opts);
    }
    function assertTSBigIntKeyword(node, opts) {
      assert("TSBigIntKeyword", node, opts);
    }
    function assertTSIntrinsicKeyword(node, opts) {
      assert("TSIntrinsicKeyword", node, opts);
    }
    function assertTSNeverKeyword(node, opts) {
      assert("TSNeverKeyword", node, opts);
    }
    function assertTSNullKeyword(node, opts) {
      assert("TSNullKeyword", node, opts);
    }
    function assertTSNumberKeyword(node, opts) {
      assert("TSNumberKeyword", node, opts);
    }
    function assertTSObjectKeyword(node, opts) {
      assert("TSObjectKeyword", node, opts);
    }
    function assertTSStringKeyword(node, opts) {
      assert("TSStringKeyword", node, opts);
    }
    function assertTSSymbolKeyword(node, opts) {
      assert("TSSymbolKeyword", node, opts);
    }
    function assertTSUndefinedKeyword(node, opts) {
      assert("TSUndefinedKeyword", node, opts);
    }
    function assertTSUnknownKeyword(node, opts) {
      assert("TSUnknownKeyword", node, opts);
    }
    function assertTSVoidKeyword(node, opts) {
      assert("TSVoidKeyword", node, opts);
    }
    function assertTSThisType(node, opts) {
      assert("TSThisType", node, opts);
    }
    function assertTSFunctionType(node, opts) {
      assert("TSFunctionType", node, opts);
    }
    function assertTSConstructorType(node, opts) {
      assert("TSConstructorType", node, opts);
    }
    function assertTSTypeReference(node, opts) {
      assert("TSTypeReference", node, opts);
    }
    function assertTSTypePredicate(node, opts) {
      assert("TSTypePredicate", node, opts);
    }
    function assertTSTypeQuery(node, opts) {
      assert("TSTypeQuery", node, opts);
    }
    function assertTSTypeLiteral(node, opts) {
      assert("TSTypeLiteral", node, opts);
    }
    function assertTSArrayType(node, opts) {
      assert("TSArrayType", node, opts);
    }
    function assertTSTupleType(node, opts) {
      assert("TSTupleType", node, opts);
    }
    function assertTSOptionalType(node, opts) {
      assert("TSOptionalType", node, opts);
    }
    function assertTSRestType(node, opts) {
      assert("TSRestType", node, opts);
    }
    function assertTSNamedTupleMember(node, opts) {
      assert("TSNamedTupleMember", node, opts);
    }
    function assertTSUnionType(node, opts) {
      assert("TSUnionType", node, opts);
    }
    function assertTSIntersectionType(node, opts) {
      assert("TSIntersectionType", node, opts);
    }
    function assertTSConditionalType(node, opts) {
      assert("TSConditionalType", node, opts);
    }
    function assertTSInferType(node, opts) {
      assert("TSInferType", node, opts);
    }
    function assertTSParenthesizedType(node, opts) {
      assert("TSParenthesizedType", node, opts);
    }
    function assertTSTypeOperator(node, opts) {
      assert("TSTypeOperator", node, opts);
    }
    function assertTSIndexedAccessType(node, opts) {
      assert("TSIndexedAccessType", node, opts);
    }
    function assertTSMappedType(node, opts) {
      assert("TSMappedType", node, opts);
    }
    function assertTSTemplateLiteralType(node, opts) {
      assert("TSTemplateLiteralType", node, opts);
    }
    function assertTSLiteralType(node, opts) {
      assert("TSLiteralType", node, opts);
    }
    function assertTSExpressionWithTypeArguments(node, opts) {
      assert("TSExpressionWithTypeArguments", node, opts);
    }
    function assertTSInterfaceDeclaration(node, opts) {
      assert("TSInterfaceDeclaration", node, opts);
    }
    function assertTSInterfaceBody(node, opts) {
      assert("TSInterfaceBody", node, opts);
    }
    function assertTSTypeAliasDeclaration(node, opts) {
      assert("TSTypeAliasDeclaration", node, opts);
    }
    function assertTSInstantiationExpression(node, opts) {
      assert("TSInstantiationExpression", node, opts);
    }
    function assertTSAsExpression(node, opts) {
      assert("TSAsExpression", node, opts);
    }
    function assertTSSatisfiesExpression(node, opts) {
      assert("TSSatisfiesExpression", node, opts);
    }
    function assertTSTypeAssertion(node, opts) {
      assert("TSTypeAssertion", node, opts);
    }
    function assertTSEnumBody(node, opts) {
      assert("TSEnumBody", node, opts);
    }
    function assertTSEnumDeclaration(node, opts) {
      assert("TSEnumDeclaration", node, opts);
    }
    function assertTSEnumMember(node, opts) {
      assert("TSEnumMember", node, opts);
    }
    function assertTSModuleDeclaration(node, opts) {
      assert("TSModuleDeclaration", node, opts);
    }
    function assertTSModuleBlock(node, opts) {
      assert("TSModuleBlock", node, opts);
    }
    function assertTSImportType(node, opts) {
      assert("TSImportType", node, opts);
    }
    function assertTSImportEqualsDeclaration(node, opts) {
      assert("TSImportEqualsDeclaration", node, opts);
    }
    function assertTSExternalModuleReference(node, opts) {
      assert("TSExternalModuleReference", node, opts);
    }
    function assertTSNonNullExpression(node, opts) {
      assert("TSNonNullExpression", node, opts);
    }
    function assertTSExportAssignment(node, opts) {
      assert("TSExportAssignment", node, opts);
    }
    function assertTSNamespaceExportDeclaration(node, opts) {
      assert("TSNamespaceExportDeclaration", node, opts);
    }
    function assertTSTypeAnnotation(node, opts) {
      assert("TSTypeAnnotation", node, opts);
    }
    function assertTSTypeParameterInstantiation(node, opts) {
      assert("TSTypeParameterInstantiation", node, opts);
    }
    function assertTSTypeParameterDeclaration(node, opts) {
      assert("TSTypeParameterDeclaration", node, opts);
    }
    function assertTSTypeParameter(node, opts) {
      assert("TSTypeParameter", node, opts);
    }
    function assertStandardized(node, opts) {
      assert("Standardized", node, opts);
    }
    function assertExpression(node, opts) {
      assert("Expression", node, opts);
    }
    function assertBinary(node, opts) {
      assert("Binary", node, opts);
    }
    function assertScopable(node, opts) {
      assert("Scopable", node, opts);
    }
    function assertBlockParent(node, opts) {
      assert("BlockParent", node, opts);
    }
    function assertBlock(node, opts) {
      assert("Block", node, opts);
    }
    function assertStatement(node, opts) {
      assert("Statement", node, opts);
    }
    function assertTerminatorless(node, opts) {
      assert("Terminatorless", node, opts);
    }
    function assertCompletionStatement(node, opts) {
      assert("CompletionStatement", node, opts);
    }
    function assertConditional(node, opts) {
      assert("Conditional", node, opts);
    }
    function assertLoop(node, opts) {
      assert("Loop", node, opts);
    }
    function assertWhile(node, opts) {
      assert("While", node, opts);
    }
    function assertExpressionWrapper(node, opts) {
      assert("ExpressionWrapper", node, opts);
    }
    function assertFor(node, opts) {
      assert("For", node, opts);
    }
    function assertForXStatement(node, opts) {
      assert("ForXStatement", node, opts);
    }
    function assertFunction(node, opts) {
      assert("Function", node, opts);
    }
    function assertFunctionParent(node, opts) {
      assert("FunctionParent", node, opts);
    }
    function assertPureish(node, opts) {
      assert("Pureish", node, opts);
    }
    function assertDeclaration(node, opts) {
      assert("Declaration", node, opts);
    }
    function assertFunctionParameter(node, opts) {
      assert("FunctionParameter", node, opts);
    }
    function assertPatternLike(node, opts) {
      assert("PatternLike", node, opts);
    }
    function assertLVal(node, opts) {
      assert("LVal", node, opts);
    }
    function assertTSEntityName(node, opts) {
      assert("TSEntityName", node, opts);
    }
    function assertLiteral(node, opts) {
      assert("Literal", node, opts);
    }
    function assertImmutable(node, opts) {
      assert("Immutable", node, opts);
    }
    function assertUserWhitespacable(node, opts) {
      assert("UserWhitespacable", node, opts);
    }
    function assertMethod(node, opts) {
      assert("Method", node, opts);
    }
    function assertObjectMember(node, opts) {
      assert("ObjectMember", node, opts);
    }
    function assertProperty(node, opts) {
      assert("Property", node, opts);
    }
    function assertUnaryLike(node, opts) {
      assert("UnaryLike", node, opts);
    }
    function assertPattern(node, opts) {
      assert("Pattern", node, opts);
    }
    function assertClass(node, opts) {
      assert("Class", node, opts);
    }
    function assertImportOrExportDeclaration(node, opts) {
      assert("ImportOrExportDeclaration", node, opts);
    }
    function assertExportDeclaration(node, opts) {
      assert("ExportDeclaration", node, opts);
    }
    function assertModuleSpecifier(node, opts) {
      assert("ModuleSpecifier", node, opts);
    }
    function assertAccessor(node, opts) {
      assert("Accessor", node, opts);
    }
    function assertPrivate(node, opts) {
      assert("Private", node, opts);
    }
    function assertFlow(node, opts) {
      assert("Flow", node, opts);
    }
    function assertFlowType(node, opts) {
      assert("FlowType", node, opts);
    }
    function assertFlowBaseAnnotation(node, opts) {
      assert("FlowBaseAnnotation", node, opts);
    }
    function assertFlowDeclaration(node, opts) {
      assert("FlowDeclaration", node, opts);
    }
    function assertFlowPredicate(node, opts) {
      assert("FlowPredicate", node, opts);
    }
    function assertEnumBody(node, opts) {
      assert("EnumBody", node, opts);
    }
    function assertEnumMember(node, opts) {
      assert("EnumMember", node, opts);
    }
    function assertJSX(node, opts) {
      assert("JSX", node, opts);
    }
    function assertMiscellaneous(node, opts) {
      assert("Miscellaneous", node, opts);
    }
    function assertTypeScript(node, opts) {
      assert("TypeScript", node, opts);
    }
    function assertTSTypeElement(node, opts) {
      assert("TSTypeElement", node, opts);
    }
    function assertTSType(node, opts) {
      assert("TSType", node, opts);
    }
    function assertTSBaseType(node, opts) {
      assert("TSBaseType", node, opts);
    }
    function assertNumberLiteral(node, opts) {
      (0, _deprecationWarning.default)("assertNumberLiteral", "assertNumericLiteral");
      assert("NumberLiteral", node, opts);
    }
    function assertRegexLiteral(node, opts) {
      (0, _deprecationWarning.default)("assertRegexLiteral", "assertRegExpLiteral");
      assert("RegexLiteral", node, opts);
    }
    function assertRestProperty(node, opts) {
      (0, _deprecationWarning.default)("assertRestProperty", "assertRestElement");
      assert("RestProperty", node, opts);
    }
    function assertSpreadProperty(node, opts) {
      (0, _deprecationWarning.default)("assertSpreadProperty", "assertSpreadElement");
      assert("SpreadProperty", node, opts);
    }
    function assertModuleDeclaration(node, opts) {
      (0, _deprecationWarning.default)("assertModuleDeclaration", "assertImportOrExportDeclaration");
      assert("ModuleDeclaration", node, opts);
    }
  }
});

// ../node_modules/@babel/types/lib/builders/flow/createTypeAnnotationBasedOnTypeof.js
var require_createTypeAnnotationBasedOnTypeof = __commonJS({
  "../node_modules/@babel/types/lib/builders/flow/createTypeAnnotationBasedOnTypeof.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    var _index = require_generated2();
    var _default = exports.default = createTypeAnnotationBasedOnTypeof;
    function createTypeAnnotationBasedOnTypeof(type) {
      switch (type) {
        case "string":
          return (0, _index.stringTypeAnnotation)();
        case "number":
          return (0, _index.numberTypeAnnotation)();
        case "undefined":
          return (0, _index.voidTypeAnnotation)();
        case "boolean":
          return (0, _index.booleanTypeAnnotation)();
        case "function":
          return (0, _index.genericTypeAnnotation)((0, _index.identifier)("Function"));
        case "object":
          return (0, _index.genericTypeAnnotation)((0, _index.identifier)("Object"));
        case "symbol":
          return (0, _index.genericTypeAnnotation)((0, _index.identifier)("Symbol"));
        case "bigint":
          return (0, _index.anyTypeAnnotation)();
      }
      throw new Error("Invalid typeof value: " + type);
    }
  }
});

// ../node_modules/@babel/types/lib/modifications/flow/removeTypeDuplicates.js
var require_removeTypeDuplicates = __commonJS({
  "../node_modules/@babel/types/lib/modifications/flow/removeTypeDuplicates.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = removeTypeDuplicates;
    var _index = require_generated();
    function getQualifiedName(node) {
      return (0, _index.isIdentifier)(node) ? node.name : `${node.id.name}.${getQualifiedName(node.qualification)}`;
    }
    function removeTypeDuplicates(nodesIn) {
      const nodes = Array.from(nodesIn);
      const generics = /* @__PURE__ */ new Map();
      const bases = /* @__PURE__ */ new Map();
      const typeGroups = /* @__PURE__ */ new Set();
      const types = [];
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!node) continue;
        if (types.includes(node)) {
          continue;
        }
        if ((0, _index.isAnyTypeAnnotation)(node)) {
          return [node];
        }
        if ((0, _index.isFlowBaseAnnotation)(node)) {
          bases.set(node.type, node);
          continue;
        }
        if ((0, _index.isUnionTypeAnnotation)(node)) {
          if (!typeGroups.has(node.types)) {
            nodes.push(...node.types);
            typeGroups.add(node.types);
          }
          continue;
        }
        if ((0, _index.isGenericTypeAnnotation)(node)) {
          const name = getQualifiedName(node.id);
          if (generics.has(name)) {
            let existing = generics.get(name);
            if (existing.typeParameters) {
              if (node.typeParameters) {
                existing.typeParameters.params.push(...node.typeParameters.params);
                existing.typeParameters.params = removeTypeDuplicates(existing.typeParameters.params);
              }
            } else {
              existing = node.typeParameters;
            }
          } else {
            generics.set(name, node);
          }
          continue;
        }
        types.push(node);
      }
      for (const [, baseType] of bases) {
        types.push(baseType);
      }
      for (const [, genericName] of generics) {
        types.push(genericName);
      }
      return types;
    }
  }
});

// ../node_modules/@babel/types/lib/builders/flow/createFlowUnionType.js
var require_createFlowUnionType = __commonJS({
  "../node_modules/@babel/types/lib/builders/flow/createFlowUnionType.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = createFlowUnionType;
    var _index = require_generated2();
    var _removeTypeDuplicates = require_removeTypeDuplicates();
    function createFlowUnionType(types) {
      const flattened = (0, _removeTypeDuplicates.default)(types);
      if (flattened.length === 1) {
        return flattened[0];
      } else {
        return (0, _index.unionTypeAnnotation)(flattened);
      }
    }
  }
});

// ../node_modules/@babel/types/lib/modifications/typescript/removeTypeDuplicates.js
var require_removeTypeDuplicates2 = __commonJS({
  "../node_modules/@babel/types/lib/modifications/typescript/removeTypeDuplicates.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = removeTypeDuplicates;
    var _index = require_generated();
    function getQualifiedName(node) {
      return (0, _index.isIdentifier)(node) ? node.name : (0, _index.isThisExpression)(node) ? "this" : `${node.right.name}.${getQualifiedName(node.left)}`;
    }
    function removeTypeDuplicates(nodesIn) {
      const nodes = Array.from(nodesIn);
      const generics = /* @__PURE__ */ new Map();
      const bases = /* @__PURE__ */ new Map();
      const typeGroups = /* @__PURE__ */ new Set();
      const types = [];
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!node) continue;
        if (types.includes(node)) {
          continue;
        }
        if ((0, _index.isTSAnyKeyword)(node)) {
          return [node];
        }
        if ((0, _index.isTSBaseType)(node)) {
          bases.set(node.type, node);
          continue;
        }
        if ((0, _index.isTSUnionType)(node)) {
          if (!typeGroups.has(node.types)) {
            nodes.push(...node.types);
            typeGroups.add(node.types);
          }
          continue;
        }
        const typeArgumentsKey = "typeParameters";
        if ((0, _index.isTSTypeReference)(node) && node[typeArgumentsKey]) {
          const typeArguments = node[typeArgumentsKey];
          const name = getQualifiedName(node.typeName);
          if (generics.has(name)) {
            let existing = generics.get(name);
            const existingTypeArguments = existing[typeArgumentsKey];
            if (existingTypeArguments) {
              existingTypeArguments.params.push(...typeArguments.params);
              existingTypeArguments.params = removeTypeDuplicates(existingTypeArguments.params);
            } else {
              existing = typeArguments;
            }
          } else {
            generics.set(name, node);
          }
          continue;
        }
        types.push(node);
      }
      for (const [, baseType] of bases) {
        types.push(baseType);
      }
      for (const [, genericName] of generics) {
        types.push(genericName);
      }
      return types;
    }
  }
});

// ../node_modules/@babel/types/lib/builders/typescript/createTSUnionType.js
var require_createTSUnionType = __commonJS({
  "../node_modules/@babel/types/lib/builders/typescript/createTSUnionType.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = createTSUnionType;
    var _index = require_generated2();
    var _removeTypeDuplicates = require_removeTypeDuplicates2();
    var _index2 = require_generated();
    function createTSUnionType(typeAnnotations) {
      const types = typeAnnotations.map((type) => {
        return (0, _index2.isTSTypeAnnotation)(type) ? type.typeAnnotation : type;
      });
      const flattened = (0, _removeTypeDuplicates.default)(types);
      if (flattened.length === 1) {
        return flattened[0];
      } else {
        return (0, _index.tsUnionType)(flattened);
      }
    }
  }
});

// ../node_modules/@babel/types/lib/builders/productions.js
var require_productions = __commonJS({
  "../node_modules/@babel/types/lib/builders/productions.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.buildUndefinedNode = buildUndefinedNode;
    var _index = require_generated2();
    function buildUndefinedNode() {
      return (0, _index.unaryExpression)("void", (0, _index.numericLiteral)(0), true);
    }
  }
});

// ../node_modules/@babel/types/lib/clone/cloneNode.js
var require_cloneNode = __commonJS({
  "../node_modules/@babel/types/lib/clone/cloneNode.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = cloneNode;
    var _index = require_definitions();
    var _index2 = require_generated();
    var {
      hasOwn
    } = {
      hasOwn: Function.call.bind(Object.prototype.hasOwnProperty)
    };
    function cloneIfNode(obj, deep, withoutLoc, commentsCache) {
      if (obj && typeof obj.type === "string") {
        return cloneNodeInternal(obj, deep, withoutLoc, commentsCache);
      }
      return obj;
    }
    function cloneIfNodeOrArray(obj, deep, withoutLoc, commentsCache) {
      if (Array.isArray(obj)) {
        return obj.map((node) => cloneIfNode(node, deep, withoutLoc, commentsCache));
      }
      return cloneIfNode(obj, deep, withoutLoc, commentsCache);
    }
    function cloneNode(node, deep = true, withoutLoc = false) {
      return cloneNodeInternal(node, deep, withoutLoc, /* @__PURE__ */ new Map());
    }
    function cloneNodeInternal(node, deep = true, withoutLoc = false, commentsCache) {
      if (!node) return node;
      const {
        type
      } = node;
      const newNode = {
        type: node.type
      };
      if ((0, _index2.isIdentifier)(node)) {
        newNode.name = node.name;
        if (hasOwn(node, "optional") && typeof node.optional === "boolean") {
          newNode.optional = node.optional;
        }
        if (hasOwn(node, "typeAnnotation")) {
          newNode.typeAnnotation = deep ? cloneIfNodeOrArray(node.typeAnnotation, true, withoutLoc, commentsCache) : node.typeAnnotation;
        }
        if (hasOwn(node, "decorators")) {
          newNode.decorators = deep ? cloneIfNodeOrArray(node.decorators, true, withoutLoc, commentsCache) : node.decorators;
        }
      } else if (!hasOwn(_index.NODE_FIELDS, type)) {
        throw new Error(`Unknown node type: "${type}"`);
      } else {
        for (const field of Object.keys(_index.NODE_FIELDS[type])) {
          if (hasOwn(node, field)) {
            if (deep) {
              newNode[field] = (0, _index2.isFile)(node) && field === "comments" ? maybeCloneComments(node.comments, deep, withoutLoc, commentsCache) : cloneIfNodeOrArray(node[field], true, withoutLoc, commentsCache);
            } else {
              newNode[field] = node[field];
            }
          }
        }
      }
      if (hasOwn(node, "loc")) {
        if (withoutLoc) {
          newNode.loc = null;
        } else {
          newNode.loc = node.loc;
        }
      }
      if (hasOwn(node, "leadingComments")) {
        newNode.leadingComments = maybeCloneComments(node.leadingComments, deep, withoutLoc, commentsCache);
      }
      if (hasOwn(node, "innerComments")) {
        newNode.innerComments = maybeCloneComments(node.innerComments, deep, withoutLoc, commentsCache);
      }
      if (hasOwn(node, "trailingComments")) {
        newNode.trailingComments = maybeCloneComments(node.trailingComments, deep, withoutLoc, commentsCache);
      }
      if (hasOwn(node, "extra")) {
        newNode.extra = Object.assign({}, node.extra);
      }
      return newNode;
    }
    function maybeCloneComments(comments, deep, withoutLoc, commentsCache) {
      if (!comments || !deep) {
        return comments;
      }
      return comments.map((comment) => {
        const cache = commentsCache.get(comment);
        if (cache) return cache;
        const {
          type,
          value,
          loc
        } = comment;
        const ret = {
          type,
          value,
          loc
        };
        if (withoutLoc) {
          ret.loc = null;
        }
        commentsCache.set(comment, ret);
        return ret;
      });
    }
  }
});

// ../node_modules/@babel/types/lib/clone/clone.js
var require_clone = __commonJS({
  "../node_modules/@babel/types/lib/clone/clone.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = clone;
    var _cloneNode = require_cloneNode();
    function clone(node) {
      return (0, _cloneNode.default)(node, false);
    }
  }
});

// ../node_modules/@babel/types/lib/clone/cloneDeep.js
var require_cloneDeep = __commonJS({
  "../node_modules/@babel/types/lib/clone/cloneDeep.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = cloneDeep;
    var _cloneNode = require_cloneNode();
    function cloneDeep(node) {
      return (0, _cloneNode.default)(node);
    }
  }
});

// ../node_modules/@babel/types/lib/clone/cloneDeepWithoutLoc.js
var require_cloneDeepWithoutLoc = __commonJS({
  "../node_modules/@babel/types/lib/clone/cloneDeepWithoutLoc.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = cloneDeepWithoutLoc;
    var _cloneNode = require_cloneNode();
    function cloneDeepWithoutLoc(node) {
      return (0, _cloneNode.default)(node, true, true);
    }
  }
});

// ../node_modules/@babel/types/lib/clone/cloneWithoutLoc.js
var require_cloneWithoutLoc = __commonJS({
  "../node_modules/@babel/types/lib/clone/cloneWithoutLoc.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = cloneWithoutLoc;
    var _cloneNode = require_cloneNode();
    function cloneWithoutLoc(node) {
      return (0, _cloneNode.default)(node, false, true);
    }
  }
});

// ../node_modules/@babel/types/lib/comments/addComments.js
var require_addComments = __commonJS({
  "../node_modules/@babel/types/lib/comments/addComments.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = addComments;
    function addComments(node, type, comments) {
      if (!comments || !node) return node;
      const key = `${type}Comments`;
      if (node[key]) {
        if (type === "leading") {
          node[key] = comments.concat(node[key]);
        } else {
          node[key].push(...comments);
        }
      } else {
        node[key] = comments;
      }
      return node;
    }
  }
});

// ../node_modules/@babel/types/lib/comments/addComment.js
var require_addComment = __commonJS({
  "../node_modules/@babel/types/lib/comments/addComment.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = addComment;
    var _addComments = require_addComments();
    function addComment(node, type, content, line) {
      return (0, _addComments.default)(node, type, [{
        type: line ? "CommentLine" : "CommentBlock",
        value: content
      }]);
    }
  }
});

// ../node_modules/@babel/types/lib/utils/inherit.js
var require_inherit = __commonJS({
  "../node_modules/@babel/types/lib/utils/inherit.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = inherit;
    function inherit(key, child, parent) {
      if (child && parent) {
        child[key] = Array.from(new Set([].concat(child[key], parent[key]).filter(Boolean)));
      }
    }
  }
});

// ../node_modules/@babel/types/lib/comments/inheritInnerComments.js
var require_inheritInnerComments = __commonJS({
  "../node_modules/@babel/types/lib/comments/inheritInnerComments.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = inheritInnerComments;
    var _inherit = require_inherit();
    function inheritInnerComments(child, parent) {
      (0, _inherit.default)("innerComments", child, parent);
    }
  }
});

// ../node_modules/@babel/types/lib/comments/inheritLeadingComments.js
var require_inheritLeadingComments = __commonJS({
  "../node_modules/@babel/types/lib/comments/inheritLeadingComments.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = inheritLeadingComments;
    var _inherit = require_inherit();
    function inheritLeadingComments(child, parent) {
      (0, _inherit.default)("leadingComments", child, parent);
    }
  }
});

// ../node_modules/@babel/types/lib/comments/inheritTrailingComments.js
var require_inheritTrailingComments = __commonJS({
  "../node_modules/@babel/types/lib/comments/inheritTrailingComments.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = inheritTrailingComments;
    var _inherit = require_inherit();
    function inheritTrailingComments(child, parent) {
      (0, _inherit.default)("trailingComments", child, parent);
    }
  }
});

// ../node_modules/@babel/types/lib/comments/inheritsComments.js
var require_inheritsComments = __commonJS({
  "../node_modules/@babel/types/lib/comments/inheritsComments.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = inheritsComments;
    var _inheritTrailingComments = require_inheritTrailingComments();
    var _inheritLeadingComments = require_inheritLeadingComments();
    var _inheritInnerComments = require_inheritInnerComments();
    function inheritsComments(child, parent) {
      (0, _inheritTrailingComments.default)(child, parent);
      (0, _inheritLeadingComments.default)(child, parent);
      (0, _inheritInnerComments.default)(child, parent);
      return child;
    }
  }
});

// ../node_modules/@babel/types/lib/comments/removeComments.js
var require_removeComments = __commonJS({
  "../node_modules/@babel/types/lib/comments/removeComments.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = removeComments;
    var _index = require_constants();
    function removeComments(node) {
      _index.COMMENT_KEYS.forEach((key) => {
        node[key] = null;
      });
      return node;
    }
  }
});

// ../node_modules/@babel/types/lib/constants/generated/index.js
var require_generated4 = __commonJS({
  "../node_modules/@babel/types/lib/constants/generated/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.WHILE_TYPES = exports.USERWHITESPACABLE_TYPES = exports.UNARYLIKE_TYPES = exports.TYPESCRIPT_TYPES = exports.TSTYPE_TYPES = exports.TSTYPEELEMENT_TYPES = exports.TSENTITYNAME_TYPES = exports.TSBASETYPE_TYPES = exports.TERMINATORLESS_TYPES = exports.STATEMENT_TYPES = exports.STANDARDIZED_TYPES = exports.SCOPABLE_TYPES = exports.PUREISH_TYPES = exports.PROPERTY_TYPES = exports.PRIVATE_TYPES = exports.PATTERN_TYPES = exports.PATTERNLIKE_TYPES = exports.OBJECTMEMBER_TYPES = exports.MODULESPECIFIER_TYPES = exports.MODULEDECLARATION_TYPES = exports.MISCELLANEOUS_TYPES = exports.METHOD_TYPES = exports.LVAL_TYPES = exports.LOOP_TYPES = exports.LITERAL_TYPES = exports.JSX_TYPES = exports.IMPORTOREXPORTDECLARATION_TYPES = exports.IMMUTABLE_TYPES = exports.FUNCTION_TYPES = exports.FUNCTIONPARENT_TYPES = exports.FUNCTIONPARAMETER_TYPES = exports.FOR_TYPES = exports.FORXSTATEMENT_TYPES = exports.FLOW_TYPES = exports.FLOWTYPE_TYPES = exports.FLOWPREDICATE_TYPES = exports.FLOWDECLARATION_TYPES = exports.FLOWBASEANNOTATION_TYPES = exports.EXPRESSION_TYPES = exports.EXPRESSIONWRAPPER_TYPES = exports.EXPORTDECLARATION_TYPES = exports.ENUMMEMBER_TYPES = exports.ENUMBODY_TYPES = exports.DECLARATION_TYPES = exports.CONDITIONAL_TYPES = exports.COMPLETIONSTATEMENT_TYPES = exports.CLASS_TYPES = exports.BLOCK_TYPES = exports.BLOCKPARENT_TYPES = exports.BINARY_TYPES = exports.ACCESSOR_TYPES = void 0;
    var _index = require_definitions();
    var STANDARDIZED_TYPES = exports.STANDARDIZED_TYPES = _index.FLIPPED_ALIAS_KEYS["Standardized"];
    var EXPRESSION_TYPES = exports.EXPRESSION_TYPES = _index.FLIPPED_ALIAS_KEYS["Expression"];
    var BINARY_TYPES = exports.BINARY_TYPES = _index.FLIPPED_ALIAS_KEYS["Binary"];
    var SCOPABLE_TYPES = exports.SCOPABLE_TYPES = _index.FLIPPED_ALIAS_KEYS["Scopable"];
    var BLOCKPARENT_TYPES = exports.BLOCKPARENT_TYPES = _index.FLIPPED_ALIAS_KEYS["BlockParent"];
    var BLOCK_TYPES = exports.BLOCK_TYPES = _index.FLIPPED_ALIAS_KEYS["Block"];
    var STATEMENT_TYPES = exports.STATEMENT_TYPES = _index.FLIPPED_ALIAS_KEYS["Statement"];
    var TERMINATORLESS_TYPES = exports.TERMINATORLESS_TYPES = _index.FLIPPED_ALIAS_KEYS["Terminatorless"];
    var COMPLETIONSTATEMENT_TYPES = exports.COMPLETIONSTATEMENT_TYPES = _index.FLIPPED_ALIAS_KEYS["CompletionStatement"];
    var CONDITIONAL_TYPES = exports.CONDITIONAL_TYPES = _index.FLIPPED_ALIAS_KEYS["Conditional"];
    var LOOP_TYPES = exports.LOOP_TYPES = _index.FLIPPED_ALIAS_KEYS["Loop"];
    var WHILE_TYPES = exports.WHILE_TYPES = _index.FLIPPED_ALIAS_KEYS["While"];
    var EXPRESSIONWRAPPER_TYPES = exports.EXPRESSIONWRAPPER_TYPES = _index.FLIPPED_ALIAS_KEYS["ExpressionWrapper"];
    var FOR_TYPES = exports.FOR_TYPES = _index.FLIPPED_ALIAS_KEYS["For"];
    var FORXSTATEMENT_TYPES = exports.FORXSTATEMENT_TYPES = _index.FLIPPED_ALIAS_KEYS["ForXStatement"];
    var FUNCTION_TYPES = exports.FUNCTION_TYPES = _index.FLIPPED_ALIAS_KEYS["Function"];
    var FUNCTIONPARENT_TYPES = exports.FUNCTIONPARENT_TYPES = _index.FLIPPED_ALIAS_KEYS["FunctionParent"];
    var PUREISH_TYPES = exports.PUREISH_TYPES = _index.FLIPPED_ALIAS_KEYS["Pureish"];
    var DECLARATION_TYPES = exports.DECLARATION_TYPES = _index.FLIPPED_ALIAS_KEYS["Declaration"];
    var FUNCTIONPARAMETER_TYPES = exports.FUNCTIONPARAMETER_TYPES = _index.FLIPPED_ALIAS_KEYS["FunctionParameter"];
    var PATTERNLIKE_TYPES = exports.PATTERNLIKE_TYPES = _index.FLIPPED_ALIAS_KEYS["PatternLike"];
    var LVAL_TYPES = exports.LVAL_TYPES = _index.FLIPPED_ALIAS_KEYS["LVal"];
    var TSENTITYNAME_TYPES = exports.TSENTITYNAME_TYPES = _index.FLIPPED_ALIAS_KEYS["TSEntityName"];
    var LITERAL_TYPES = exports.LITERAL_TYPES = _index.FLIPPED_ALIAS_KEYS["Literal"];
    var IMMUTABLE_TYPES = exports.IMMUTABLE_TYPES = _index.FLIPPED_ALIAS_KEYS["Immutable"];
    var USERWHITESPACABLE_TYPES = exports.USERWHITESPACABLE_TYPES = _index.FLIPPED_ALIAS_KEYS["UserWhitespacable"];
    var METHOD_TYPES = exports.METHOD_TYPES = _index.FLIPPED_ALIAS_KEYS["Method"];
    var OBJECTMEMBER_TYPES = exports.OBJECTMEMBER_TYPES = _index.FLIPPED_ALIAS_KEYS["ObjectMember"];
    var PROPERTY_TYPES = exports.PROPERTY_TYPES = _index.FLIPPED_ALIAS_KEYS["Property"];
    var UNARYLIKE_TYPES = exports.UNARYLIKE_TYPES = _index.FLIPPED_ALIAS_KEYS["UnaryLike"];
    var PATTERN_TYPES = exports.PATTERN_TYPES = _index.FLIPPED_ALIAS_KEYS["Pattern"];
    var CLASS_TYPES = exports.CLASS_TYPES = _index.FLIPPED_ALIAS_KEYS["Class"];
    var IMPORTOREXPORTDECLARATION_TYPES = exports.IMPORTOREXPORTDECLARATION_TYPES = _index.FLIPPED_ALIAS_KEYS["ImportOrExportDeclaration"];
    var EXPORTDECLARATION_TYPES = exports.EXPORTDECLARATION_TYPES = _index.FLIPPED_ALIAS_KEYS["ExportDeclaration"];
    var MODULESPECIFIER_TYPES = exports.MODULESPECIFIER_TYPES = _index.FLIPPED_ALIAS_KEYS["ModuleSpecifier"];
    var ACCESSOR_TYPES = exports.ACCESSOR_TYPES = _index.FLIPPED_ALIAS_KEYS["Accessor"];
    var PRIVATE_TYPES = exports.PRIVATE_TYPES = _index.FLIPPED_ALIAS_KEYS["Private"];
    var FLOW_TYPES = exports.FLOW_TYPES = _index.FLIPPED_ALIAS_KEYS["Flow"];
    var FLOWTYPE_TYPES = exports.FLOWTYPE_TYPES = _index.FLIPPED_ALIAS_KEYS["FlowType"];
    var FLOWBASEANNOTATION_TYPES = exports.FLOWBASEANNOTATION_TYPES = _index.FLIPPED_ALIAS_KEYS["FlowBaseAnnotation"];
    var FLOWDECLARATION_TYPES = exports.FLOWDECLARATION_TYPES = _index.FLIPPED_ALIAS_KEYS["FlowDeclaration"];
    var FLOWPREDICATE_TYPES = exports.FLOWPREDICATE_TYPES = _index.FLIPPED_ALIAS_KEYS["FlowPredicate"];
    var ENUMBODY_TYPES = exports.ENUMBODY_TYPES = _index.FLIPPED_ALIAS_KEYS["EnumBody"];
    var ENUMMEMBER_TYPES = exports.ENUMMEMBER_TYPES = _index.FLIPPED_ALIAS_KEYS["EnumMember"];
    var JSX_TYPES = exports.JSX_TYPES = _index.FLIPPED_ALIAS_KEYS["JSX"];
    var MISCELLANEOUS_TYPES = exports.MISCELLANEOUS_TYPES = _index.FLIPPED_ALIAS_KEYS["Miscellaneous"];
    var TYPESCRIPT_TYPES = exports.TYPESCRIPT_TYPES = _index.FLIPPED_ALIAS_KEYS["TypeScript"];
    var TSTYPEELEMENT_TYPES = exports.TSTYPEELEMENT_TYPES = _index.FLIPPED_ALIAS_KEYS["TSTypeElement"];
    var TSTYPE_TYPES = exports.TSTYPE_TYPES = _index.FLIPPED_ALIAS_KEYS["TSType"];
    var TSBASETYPE_TYPES = exports.TSBASETYPE_TYPES = _index.FLIPPED_ALIAS_KEYS["TSBaseType"];
    var MODULEDECLARATION_TYPES = exports.MODULEDECLARATION_TYPES = IMPORTOREXPORTDECLARATION_TYPES;
  }
});

// ../node_modules/@babel/types/lib/converters/toBlock.js
var require_toBlock = __commonJS({
  "../node_modules/@babel/types/lib/converters/toBlock.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = toBlock;
    var _index = require_generated();
    var _index2 = require_generated2();
    function toBlock(node, parent) {
      if ((0, _index.isBlockStatement)(node)) {
        return node;
      }
      let blockNodes = [];
      if ((0, _index.isEmptyStatement)(node)) {
        blockNodes = [];
      } else {
        if (!(0, _index.isStatement)(node)) {
          if ((0, _index.isFunction)(parent)) {
            node = (0, _index2.returnStatement)(node);
          } else {
            node = (0, _index2.expressionStatement)(node);
          }
        }
        blockNodes = [node];
      }
      return (0, _index2.blockStatement)(blockNodes);
    }
  }
});

// ../node_modules/@babel/types/lib/converters/ensureBlock.js
var require_ensureBlock = __commonJS({
  "../node_modules/@babel/types/lib/converters/ensureBlock.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = ensureBlock;
    var _toBlock = require_toBlock();
    function ensureBlock(node, key = "body") {
      const result = (0, _toBlock.default)(node[key], node);
      node[key] = result;
      return result;
    }
  }
});

// ../node_modules/@babel/types/lib/converters/toIdentifier.js
var require_toIdentifier = __commonJS({
  "../node_modules/@babel/types/lib/converters/toIdentifier.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = toIdentifier;
    var _isValidIdentifier = require_isValidIdentifier();
    var _helperValidatorIdentifier = require_lib();
    function toIdentifier(input) {
      input = input + "";
      let name = "";
      for (const c of input) {
        name += (0, _helperValidatorIdentifier.isIdentifierChar)(c.codePointAt(0)) ? c : "-";
      }
      name = name.replace(/^[-0-9]+/, "");
      name = name.replace(/[-\s]+(.)?/g, function(match, c) {
        return c ? c.toUpperCase() : "";
      });
      if (!(0, _isValidIdentifier.default)(name)) {
        name = `_${name}`;
      }
      return name || "_";
    }
  }
});

// ../node_modules/@babel/types/lib/converters/toBindingIdentifierName.js
var require_toBindingIdentifierName = __commonJS({
  "../node_modules/@babel/types/lib/converters/toBindingIdentifierName.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = toBindingIdentifierName;
    var _toIdentifier = require_toIdentifier();
    function toBindingIdentifierName(name) {
      name = (0, _toIdentifier.default)(name);
      if (name === "eval" || name === "arguments") name = "_" + name;
      return name;
    }
  }
});

// ../node_modules/@babel/types/lib/converters/toComputedKey.js
var require_toComputedKey = __commonJS({
  "../node_modules/@babel/types/lib/converters/toComputedKey.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = toComputedKey;
    var _index = require_generated();
    var _index2 = require_generated2();
    function toComputedKey(node, key = node.key || node.property) {
      if (!node.computed && (0, _index.isIdentifier)(key)) key = (0, _index2.stringLiteral)(key.name);
      return key;
    }
  }
});

// ../node_modules/@babel/types/lib/converters/toExpression.js
var require_toExpression = __commonJS({
  "../node_modules/@babel/types/lib/converters/toExpression.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    var _index = require_generated();
    var _default = exports.default = toExpression;
    function toExpression(node) {
      if ((0, _index.isExpressionStatement)(node)) {
        node = node.expression;
      }
      if ((0, _index.isExpression)(node)) {
        return node;
      }
      if ((0, _index.isClass)(node)) {
        node.type = "ClassExpression";
        node.abstract = false;
      } else if ((0, _index.isFunction)(node)) {
        node.type = "FunctionExpression";
      }
      if (!(0, _index.isExpression)(node)) {
        throw new Error(`cannot turn ${node.type} to an expression`);
      }
      return node;
    }
  }
});

// ../node_modules/@babel/types/lib/traverse/traverseFast.js
var require_traverseFast = __commonJS({
  "../node_modules/@babel/types/lib/traverse/traverseFast.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = traverseFast;
    var _index = require_definitions();
    var _skip = /* @__PURE__ */ Symbol();
    var _stop = /* @__PURE__ */ Symbol();
    function traverseFast(node, enter, opts) {
      if (!node) return false;
      const keys = _index.VISITOR_KEYS[node.type];
      if (!keys) return false;
      opts = opts || {};
      const ret = enter(node, opts);
      if (ret !== void 0) {
        switch (ret) {
          case _skip:
            return false;
          case _stop:
            return true;
        }
      }
      for (const key of keys) {
        const subNode = node[key];
        if (!subNode) continue;
        if (Array.isArray(subNode)) {
          for (const node2 of subNode) {
            if (traverseFast(node2, enter, opts)) return true;
          }
        } else {
          if (traverseFast(subNode, enter, opts)) return true;
        }
      }
      return false;
    }
    traverseFast.skip = _skip;
    traverseFast.stop = _stop;
  }
});

// ../node_modules/@babel/types/lib/modifications/removeProperties.js
var require_removeProperties = __commonJS({
  "../node_modules/@babel/types/lib/modifications/removeProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = removeProperties;
    var _index = require_constants();
    var CLEAR_KEYS = ["tokens", "start", "end", "loc", "raw", "rawValue"];
    var CLEAR_KEYS_PLUS_COMMENTS = [..._index.COMMENT_KEYS, "comments", ...CLEAR_KEYS];
    function removeProperties(node, opts = {}) {
      const map = opts.preserveComments ? CLEAR_KEYS : CLEAR_KEYS_PLUS_COMMENTS;
      for (const key of map) {
        if (node[key] != null) node[key] = void 0;
      }
      for (const key of Object.keys(node)) {
        if (key.startsWith("_") && node[key] != null) node[key] = void 0;
      }
      const symbols = Object.getOwnPropertySymbols(node);
      for (const sym of symbols) {
        node[sym] = null;
      }
    }
  }
});

// ../node_modules/@babel/types/lib/modifications/removePropertiesDeep.js
var require_removePropertiesDeep = __commonJS({
  "../node_modules/@babel/types/lib/modifications/removePropertiesDeep.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = removePropertiesDeep;
    var _traverseFast = require_traverseFast();
    var _removeProperties = require_removeProperties();
    function removePropertiesDeep(tree, opts) {
      (0, _traverseFast.default)(tree, _removeProperties.default, opts);
      return tree;
    }
  }
});

// ../node_modules/@babel/types/lib/converters/toKeyAlias.js
var require_toKeyAlias = __commonJS({
  "../node_modules/@babel/types/lib/converters/toKeyAlias.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = toKeyAlias;
    var _index = require_generated();
    var _cloneNode = require_cloneNode();
    var _removePropertiesDeep = require_removePropertiesDeep();
    function toKeyAlias(node, key = node.key) {
      let alias;
      if (node.kind === "method") {
        return toKeyAlias.increment() + "";
      } else if ((0, _index.isIdentifier)(key)) {
        alias = key.name;
      } else if ((0, _index.isStringLiteral)(key)) {
        alias = JSON.stringify(key.value);
      } else {
        alias = JSON.stringify((0, _removePropertiesDeep.default)((0, _cloneNode.default)(key)));
      }
      if (node.computed) {
        alias = `[${alias}]`;
      }
      if (node.static) {
        alias = `static:${alias}`;
      }
      return alias;
    }
    toKeyAlias.uid = 0;
    toKeyAlias.increment = function() {
      if (toKeyAlias.uid >= Number.MAX_SAFE_INTEGER) {
        return toKeyAlias.uid = 0;
      } else {
        return toKeyAlias.uid++;
      }
    };
  }
});

// ../node_modules/@babel/types/lib/converters/toStatement.js
var require_toStatement = __commonJS({
  "../node_modules/@babel/types/lib/converters/toStatement.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    var _index = require_generated();
    var _index2 = require_generated2();
    var _default = exports.default = toStatement;
    function toStatement(node, ignore) {
      if ((0, _index.isStatement)(node)) {
        return node;
      }
      let mustHaveId = false;
      let newType;
      if ((0, _index.isClass)(node)) {
        mustHaveId = true;
        newType = "ClassDeclaration";
      } else if ((0, _index.isFunction)(node)) {
        mustHaveId = true;
        newType = "FunctionDeclaration";
      } else if ((0, _index.isAssignmentExpression)(node)) {
        return (0, _index2.expressionStatement)(node);
      }
      if (mustHaveId && !node.id) {
        newType = false;
      }
      if (!newType) {
        if (ignore) {
          return false;
        } else {
          throw new Error(`cannot turn ${node.type} to a statement`);
        }
      }
      node.type = newType;
      return node;
    }
  }
});

// ../node_modules/@babel/types/lib/converters/valueToNode.js
var require_valueToNode = __commonJS({
  "../node_modules/@babel/types/lib/converters/valueToNode.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    var _isValidIdentifier = require_isValidIdentifier();
    var _index = require_generated2();
    var _default = exports.default = valueToNode;
    var objectToString = Function.call.bind(Object.prototype.toString);
    function isRegExp(value) {
      return objectToString(value) === "[object RegExp]";
    }
    function isPlainObject(value) {
      if (typeof value !== "object" || value === null || Object.prototype.toString.call(value) !== "[object Object]") {
        return false;
      }
      const proto = Object.getPrototypeOf(value);
      return proto === null || Object.getPrototypeOf(proto) === null;
    }
    function valueToNode(value) {
      if (value === void 0) {
        return (0, _index.identifier)("undefined");
      }
      if (value === true || value === false) {
        return (0, _index.booleanLiteral)(value);
      }
      if (value === null) {
        return (0, _index.nullLiteral)();
      }
      if (typeof value === "string") {
        return (0, _index.stringLiteral)(value);
      }
      if (typeof value === "number") {
        let result;
        if (Number.isFinite(value)) {
          result = (0, _index.numericLiteral)(Math.abs(value));
        } else {
          let numerator;
          if (Number.isNaN(value)) {
            numerator = (0, _index.numericLiteral)(0);
          } else {
            numerator = (0, _index.numericLiteral)(1);
          }
          result = (0, _index.binaryExpression)("/", numerator, (0, _index.numericLiteral)(0));
        }
        if (value < 0 || Object.is(value, -0)) {
          result = (0, _index.unaryExpression)("-", result);
        }
        return result;
      }
      if (typeof value === "bigint") {
        if (value < 0) {
          return (0, _index.unaryExpression)("-", (0, _index.bigIntLiteral)(-value));
        } else {
          return (0, _index.bigIntLiteral)(value);
        }
      }
      if (isRegExp(value)) {
        const pattern = value.source;
        const flags = /\/([a-z]*)$/.exec(value.toString())[1];
        return (0, _index.regExpLiteral)(pattern, flags);
      }
      if (Array.isArray(value)) {
        return (0, _index.arrayExpression)(value.map(valueToNode));
      }
      if (isPlainObject(value)) {
        const props = [];
        for (const key of Object.keys(value)) {
          let nodeKey, computed = false;
          if ((0, _isValidIdentifier.default)(key)) {
            if (key === "__proto__") {
              computed = true;
              nodeKey = (0, _index.stringLiteral)(key);
            } else {
              nodeKey = (0, _index.identifier)(key);
            }
          } else {
            nodeKey = (0, _index.stringLiteral)(key);
          }
          props.push((0, _index.objectProperty)(nodeKey, valueToNode(value[key]), computed));
        }
        return (0, _index.objectExpression)(props);
      }
      throw new Error("don't know how to turn this value into a node");
    }
  }
});

// ../node_modules/@babel/types/lib/modifications/appendToMemberExpression.js
var require_appendToMemberExpression = __commonJS({
  "../node_modules/@babel/types/lib/modifications/appendToMemberExpression.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = appendToMemberExpression;
    var _index = require_generated2();
    function appendToMemberExpression(member, append, computed = false) {
      member.object = (0, _index.memberExpression)(member.object, member.property, member.computed);
      member.property = append;
      member.computed = !!computed;
      return member;
    }
  }
});

// ../node_modules/@babel/types/lib/modifications/inherits.js
var require_inherits = __commonJS({
  "../node_modules/@babel/types/lib/modifications/inherits.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = inherits;
    var _index = require_constants();
    var _inheritsComments = require_inheritsComments();
    function inherits(child, parent) {
      if (!child || !parent) return child;
      for (const key of _index.INHERIT_KEYS.optional) {
        if (child[key] == null) {
          child[key] = parent[key];
        }
      }
      for (const key of Object.keys(parent)) {
        if (key.startsWith("_") && key !== "__clone") {
          child[key] = parent[key];
        }
      }
      for (const key of _index.INHERIT_KEYS.force) {
        child[key] = parent[key];
      }
      (0, _inheritsComments.default)(child, parent);
      return child;
    }
  }
});

// ../node_modules/@babel/types/lib/modifications/prependToMemberExpression.js
var require_prependToMemberExpression = __commonJS({
  "../node_modules/@babel/types/lib/modifications/prependToMemberExpression.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = prependToMemberExpression;
    var _index = require_generated2();
    var _index2 = require_lib3();
    function prependToMemberExpression(member, prepend) {
      if ((0, _index2.isSuper)(member.object)) {
        throw new Error("Cannot prepend node to super property access (`super.foo`).");
      }
      member.object = (0, _index.memberExpression)(prepend, member.object);
      return member;
    }
  }
});

// ../node_modules/@babel/types/lib/retrievers/getAssignmentIdentifiers.js
var require_getAssignmentIdentifiers = __commonJS({
  "../node_modules/@babel/types/lib/retrievers/getAssignmentIdentifiers.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = getAssignmentIdentifiers;
    function getAssignmentIdentifiers(node) {
      const search = [].concat(node);
      const ids = /* @__PURE__ */ Object.create(null);
      while (search.length) {
        const id = search.pop();
        if (!id) continue;
        switch (id.type) {
          case "ArrayPattern":
            search.push(...id.elements);
            break;
          case "AssignmentExpression":
          case "AssignmentPattern":
          case "ForInStatement":
          case "ForOfStatement":
            search.push(id.left);
            break;
          case "ObjectPattern":
            search.push(...id.properties);
            break;
          case "ObjectProperty":
            search.push(id.value);
            break;
          case "RestElement":
          case "UpdateExpression":
            search.push(id.argument);
            break;
          case "UnaryExpression":
            if (id.operator === "delete") {
              search.push(id.argument);
            }
            break;
          case "Identifier":
            ids[id.name] = id;
            break;
          default:
            break;
        }
      }
      return ids;
    }
  }
});

// ../node_modules/@babel/types/lib/retrievers/getBindingIdentifiers.js
var require_getBindingIdentifiers = __commonJS({
  "../node_modules/@babel/types/lib/retrievers/getBindingIdentifiers.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = getBindingIdentifiers;
    var _index = require_generated();
    function getBindingIdentifiers(node, duplicates, outerOnly, newBindingsOnly) {
      const search = [].concat(node);
      const ids = /* @__PURE__ */ Object.create(null);
      while (search.length) {
        const id = search.shift();
        if (!id) continue;
        if (newBindingsOnly && ((0, _index.isAssignmentExpression)(id) || (0, _index.isUnaryExpression)(id) || (0, _index.isUpdateExpression)(id))) {
          continue;
        }
        if ((0, _index.isIdentifier)(id)) {
          if (duplicates) {
            const _ids = ids[id.name] = ids[id.name] || [];
            _ids.push(id);
          } else {
            ids[id.name] = id;
          }
          continue;
        }
        if ((0, _index.isExportDeclaration)(id) && !(0, _index.isExportAllDeclaration)(id)) {
          if ((0, _index.isDeclaration)(id.declaration)) {
            search.push(id.declaration);
          }
          continue;
        }
        if (outerOnly) {
          if ((0, _index.isFunctionDeclaration)(id)) {
            search.push(id.id);
            continue;
          }
          if ((0, _index.isFunctionExpression)(id)) {
            continue;
          }
        }
        const keys2 = getBindingIdentifiers.keys[id.type];
        if (keys2) {
          for (let i = 0; i < keys2.length; i++) {
            const key = keys2[i];
            const nodes = id[key];
            if (nodes) {
              if (Array.isArray(nodes)) {
                search.push(...nodes);
              } else {
                search.push(nodes);
              }
            }
          }
        }
      }
      return ids;
    }
    var keys = {
      DeclareClass: ["id"],
      DeclareFunction: ["id"],
      DeclareModule: ["id"],
      DeclareVariable: ["id"],
      DeclareInterface: ["id"],
      DeclareTypeAlias: ["id"],
      DeclareOpaqueType: ["id"],
      InterfaceDeclaration: ["id"],
      TypeAlias: ["id"],
      OpaqueType: ["id"],
      CatchClause: ["param"],
      LabeledStatement: ["label"],
      UnaryExpression: ["argument"],
      AssignmentExpression: ["left"],
      ImportSpecifier: ["local"],
      ImportNamespaceSpecifier: ["local"],
      ImportDefaultSpecifier: ["local"],
      ImportDeclaration: ["specifiers"],
      TSImportEqualsDeclaration: ["id"],
      ExportSpecifier: ["exported"],
      ExportNamespaceSpecifier: ["exported"],
      ExportDefaultSpecifier: ["exported"],
      FunctionDeclaration: ["id", "params"],
      FunctionExpression: ["id", "params"],
      ArrowFunctionExpression: ["params"],
      ObjectMethod: ["params"],
      ClassMethod: ["params"],
      ClassPrivateMethod: ["params"],
      ForInStatement: ["left"],
      ForOfStatement: ["left"],
      ClassDeclaration: ["id"],
      ClassExpression: ["id"],
      RestElement: ["argument"],
      UpdateExpression: ["argument"],
      ObjectProperty: ["value"],
      AssignmentPattern: ["left"],
      ArrayPattern: ["elements"],
      ObjectPattern: ["properties"],
      VariableDeclaration: ["declarations"],
      VariableDeclarator: ["id"]
    };
    getBindingIdentifiers.keys = keys;
  }
});

// ../node_modules/@babel/types/lib/retrievers/getOuterBindingIdentifiers.js
var require_getOuterBindingIdentifiers = __commonJS({
  "../node_modules/@babel/types/lib/retrievers/getOuterBindingIdentifiers.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    var _getBindingIdentifiers = require_getBindingIdentifiers();
    var _default = exports.default = getOuterBindingIdentifiers;
    function getOuterBindingIdentifiers(node, duplicates) {
      return (0, _getBindingIdentifiers.default)(node, duplicates, true);
    }
  }
});

// ../node_modules/@babel/types/lib/retrievers/getFunctionName.js
var require_getFunctionName = __commonJS({
  "../node_modules/@babel/types/lib/retrievers/getFunctionName.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = getFunctionName;
    var _index = require_generated();
    function getNameFromLiteralId(id) {
      if ((0, _index.isNullLiteral)(id)) {
        return "null";
      }
      if ((0, _index.isRegExpLiteral)(id)) {
        return `/${id.pattern}/${id.flags}`;
      }
      if ((0, _index.isTemplateLiteral)(id)) {
        return id.quasis.map((quasi) => quasi.value.raw).join("");
      }
      if (id.value !== void 0) {
        return String(id.value);
      }
      return null;
    }
    function getObjectMemberKey(node) {
      if (!node.computed || (0, _index.isLiteral)(node.key)) {
        return node.key;
      }
    }
    function getFunctionName(node, parent) {
      if ("id" in node && node.id) {
        return {
          name: node.id.name,
          originalNode: node.id
        };
      }
      let prefix = "";
      let id;
      if ((0, _index.isObjectProperty)(parent, {
        value: node
      })) {
        id = getObjectMemberKey(parent);
      } else if ((0, _index.isObjectMethod)(node) || (0, _index.isClassMethod)(node)) {
        id = getObjectMemberKey(node);
        if (node.kind === "get") prefix = "get ";
        else if (node.kind === "set") prefix = "set ";
      } else if ((0, _index.isVariableDeclarator)(parent, {
        init: node
      })) {
        id = parent.id;
      } else if ((0, _index.isAssignmentExpression)(parent, {
        operator: "=",
        right: node
      })) {
        id = parent.left;
      }
      if (!id) return null;
      const name = (0, _index.isLiteral)(id) ? getNameFromLiteralId(id) : (0, _index.isIdentifier)(id) ? id.name : (0, _index.isPrivateName)(id) ? id.id.name : null;
      if (name == null) return null;
      return {
        name: prefix + name,
        originalNode: id
      };
    }
  }
});

// ../node_modules/@babel/types/lib/traverse/traverse.js
var require_traverse = __commonJS({
  "../node_modules/@babel/types/lib/traverse/traverse.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = traverse;
    var _index = require_definitions();
    function traverse(node, handlers, state) {
      if (typeof handlers === "function") {
        handlers = {
          enter: handlers
        };
      }
      const {
        enter,
        exit
      } = handlers;
      traverseSimpleImpl(node, enter, exit, state, []);
    }
    function traverseSimpleImpl(node, enter, exit, state, ancestors) {
      const keys = _index.VISITOR_KEYS[node.type];
      if (!keys) return;
      if (enter) enter(node, ancestors, state);
      for (const key of keys) {
        const subNode = node[key];
        if (Array.isArray(subNode)) {
          for (let i = 0; i < subNode.length; i++) {
            const child = subNode[i];
            if (!child) continue;
            ancestors.push({
              node,
              key,
              index: i
            });
            traverseSimpleImpl(child, enter, exit, state, ancestors);
            ancestors.pop();
          }
        } else if (subNode) {
          ancestors.push({
            node,
            key
          });
          traverseSimpleImpl(subNode, enter, exit, state, ancestors);
          ancestors.pop();
        }
      }
      if (exit) exit(node, ancestors, state);
    }
  }
});

// ../node_modules/@babel/types/lib/validators/isBinding.js
var require_isBinding = __commonJS({
  "../node_modules/@babel/types/lib/validators/isBinding.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isBinding;
    var _getBindingIdentifiers = require_getBindingIdentifiers();
    function isBinding(node, parent, grandparent) {
      if (grandparent && node.type === "Identifier" && parent.type === "ObjectProperty" && grandparent.type === "ObjectExpression") {
        return false;
      }
      const keys = _getBindingIdentifiers.default.keys[parent.type];
      if (keys) {
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const val = parent[key];
          if (Array.isArray(val)) {
            if (val.includes(node)) return true;
          } else {
            if (val === node) return true;
          }
        }
      }
      return false;
    }
  }
});

// ../node_modules/@babel/types/lib/validators/isLet.js
var require_isLet = __commonJS({
  "../node_modules/@babel/types/lib/validators/isLet.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isLet;
    var _index = require_generated();
    var BLOCK_SCOPED_SYMBOL = /* @__PURE__ */ Symbol.for("var used to be block scoped");
    function isLet(node) {
      return (0, _index.isVariableDeclaration)(node) && (node.kind !== "var" || node[BLOCK_SCOPED_SYMBOL]);
    }
  }
});

// ../node_modules/@babel/types/lib/validators/isBlockScoped.js
var require_isBlockScoped = __commonJS({
  "../node_modules/@babel/types/lib/validators/isBlockScoped.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isBlockScoped;
    var _index = require_generated();
    var _isLet = require_isLet();
    function isBlockScoped(node) {
      return (0, _index.isFunctionDeclaration)(node) || (0, _index.isClassDeclaration)(node) || (0, _isLet.default)(node);
    }
  }
});

// ../node_modules/@babel/types/lib/validators/isImmutable.js
var require_isImmutable = __commonJS({
  "../node_modules/@babel/types/lib/validators/isImmutable.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isImmutable;
    var _isType = require_isType();
    var _index = require_generated();
    function isImmutable(node) {
      if ((0, _isType.default)(node.type, "Immutable")) return true;
      if ((0, _index.isIdentifier)(node)) {
        if (node.name === "undefined") {
          return true;
        } else {
          return false;
        }
      }
      return false;
    }
  }
});

// ../node_modules/@babel/types/lib/validators/isNodesEquivalent.js
var require_isNodesEquivalent = __commonJS({
  "../node_modules/@babel/types/lib/validators/isNodesEquivalent.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isNodesEquivalent;
    var _index = require_definitions();
    function isNodesEquivalent(a, b) {
      if (typeof a !== "object" || typeof b !== "object" || a == null || b == null) {
        return a === b;
      }
      if (a.type !== b.type) {
        return false;
      }
      const fields = Object.keys(_index.NODE_FIELDS[a.type] || a.type);
      const visitorKeys = _index.VISITOR_KEYS[a.type];
      for (const field of fields) {
        const val_a = a[field];
        const val_b = b[field];
        if (typeof val_a !== typeof val_b) {
          return false;
        }
        if (val_a == null && val_b == null) {
          continue;
        } else if (val_a == null || val_b == null) {
          return false;
        }
        if (Array.isArray(val_a)) {
          if (!Array.isArray(val_b)) {
            return false;
          }
          if (val_a.length !== val_b.length) {
            return false;
          }
          for (let i = 0; i < val_a.length; i++) {
            if (!isNodesEquivalent(val_a[i], val_b[i])) {
              return false;
            }
          }
          continue;
        }
        if (typeof val_a === "object" && !(visitorKeys != null && visitorKeys.includes(field))) {
          for (const key of Object.keys(val_a)) {
            if (val_a[key] !== val_b[key]) {
              return false;
            }
          }
          continue;
        }
        if (!isNodesEquivalent(val_a, val_b)) {
          return false;
        }
      }
      return true;
    }
  }
});

// ../node_modules/@babel/types/lib/validators/isReferenced.js
var require_isReferenced = __commonJS({
  "../node_modules/@babel/types/lib/validators/isReferenced.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isReferenced;
    function isReferenced(node, parent, grandparent) {
      switch (parent.type) {
        case "MemberExpression":
        case "OptionalMemberExpression":
          if (parent.property === node) {
            return !!parent.computed;
          }
          return parent.object === node;
        case "JSXMemberExpression":
          return parent.object === node;
        case "VariableDeclarator":
          return parent.init === node;
        case "ArrowFunctionExpression":
          return parent.body === node;
        case "PrivateName":
          return false;
        case "ClassMethod":
        case "ClassPrivateMethod":
        case "ObjectMethod":
          if (parent.key === node) {
            return !!parent.computed;
          }
          return false;
        case "ObjectProperty":
          if (parent.key === node) {
            return !!parent.computed;
          }
          return (grandparent == null ? void 0 : grandparent.type) !== "ObjectPattern";
        case "ClassProperty":
        case "ClassAccessorProperty":
          if (parent.key === node) {
            return !!parent.computed;
          }
          return true;
        case "ClassPrivateProperty":
          return parent.key !== node;
        case "ClassDeclaration":
        case "ClassExpression":
          return parent.superClass === node;
        case "AssignmentExpression":
          return parent.right === node;
        case "AssignmentPattern":
          return parent.right === node;
        case "LabeledStatement":
          return false;
        case "CatchClause":
          return false;
        case "RestElement":
          return false;
        case "BreakStatement":
        case "ContinueStatement":
          return false;
        case "FunctionDeclaration":
        case "FunctionExpression":
          return false;
        case "ExportNamespaceSpecifier":
        case "ExportDefaultSpecifier":
          return false;
        case "ExportSpecifier":
          if (grandparent != null && grandparent.source) {
            return false;
          }
          return parent.local === node;
        case "ImportDefaultSpecifier":
        case "ImportNamespaceSpecifier":
        case "ImportSpecifier":
          return false;
        case "ImportAttribute":
          return false;
        case "JSXAttribute":
          return false;
        case "ObjectPattern":
        case "ArrayPattern":
          return false;
        case "MetaProperty":
          return false;
        case "ObjectTypeProperty":
          return parent.key !== node;
        case "TSEnumMember":
          return parent.id !== node;
        case "TSPropertySignature":
          if (parent.key === node) {
            return !!parent.computed;
          }
          return true;
      }
      return true;
    }
  }
});

// ../node_modules/@babel/types/lib/validators/isScope.js
var require_isScope = __commonJS({
  "../node_modules/@babel/types/lib/validators/isScope.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isScope;
    var _index = require_generated();
    function isScope(node, parent) {
      if ((0, _index.isBlockStatement)(node) && ((0, _index.isFunction)(parent) || (0, _index.isCatchClause)(parent))) {
        return false;
      }
      if ((0, _index.isPattern)(node) && ((0, _index.isFunction)(parent) || (0, _index.isCatchClause)(parent))) {
        return true;
      }
      return (0, _index.isScopable)(node);
    }
  }
});

// ../node_modules/@babel/types/lib/validators/isSpecifierDefault.js
var require_isSpecifierDefault = __commonJS({
  "../node_modules/@babel/types/lib/validators/isSpecifierDefault.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isSpecifierDefault;
    var _index = require_generated();
    function isSpecifierDefault(specifier) {
      return (0, _index.isImportDefaultSpecifier)(specifier) || (0, _index.isIdentifier)(specifier.imported || specifier.exported, {
        name: "default"
      });
    }
  }
});

// ../node_modules/@babel/types/lib/validators/isValidES3Identifier.js
var require_isValidES3Identifier = __commonJS({
  "../node_modules/@babel/types/lib/validators/isValidES3Identifier.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isValidES3Identifier;
    var _isValidIdentifier = require_isValidIdentifier();
    var RESERVED_WORDS_ES3_ONLY = /* @__PURE__ */ new Set(["abstract", "boolean", "byte", "char", "double", "enum", "final", "float", "goto", "implements", "int", "interface", "long", "native", "package", "private", "protected", "public", "short", "static", "synchronized", "throws", "transient", "volatile"]);
    function isValidES3Identifier(name) {
      return (0, _isValidIdentifier.default)(name) && !RESERVED_WORDS_ES3_ONLY.has(name);
    }
  }
});

// ../node_modules/@babel/types/lib/validators/isVar.js
var require_isVar = __commonJS({
  "../node_modules/@babel/types/lib/validators/isVar.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = isVar;
    var _index = require_generated();
    var BLOCK_SCOPED_SYMBOL = /* @__PURE__ */ Symbol.for("var used to be block scoped");
    function isVar(node) {
      return (0, _index.isVariableDeclaration)(node, {
        kind: "var"
      }) && !node[BLOCK_SCOPED_SYMBOL];
    }
  }
});

// ../node_modules/@babel/types/lib/converters/gatherSequenceExpressions.js
var require_gatherSequenceExpressions = __commonJS({
  "../node_modules/@babel/types/lib/converters/gatherSequenceExpressions.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = gatherSequenceExpressions;
    var _getBindingIdentifiers = require_getBindingIdentifiers();
    var _index = require_generated();
    var _index2 = require_generated2();
    var _productions = require_productions();
    var _cloneNode = require_cloneNode();
    function gatherSequenceExpressions(nodes, declars) {
      const exprs = [];
      let ensureLastUndefined = true;
      for (const node of nodes) {
        if (!(0, _index.isEmptyStatement)(node)) {
          ensureLastUndefined = false;
        }
        if ((0, _index.isExpression)(node)) {
          exprs.push(node);
        } else if ((0, _index.isExpressionStatement)(node)) {
          exprs.push(node.expression);
        } else if ((0, _index.isVariableDeclaration)(node)) {
          if (node.kind !== "var") return;
          for (const declar of node.declarations) {
            const bindings = (0, _getBindingIdentifiers.default)(declar);
            for (const key of Object.keys(bindings)) {
              declars.push({
                kind: node.kind,
                id: (0, _cloneNode.default)(bindings[key])
              });
            }
            if (declar.init) {
              exprs.push((0, _index2.assignmentExpression)("=", declar.id, declar.init));
            }
          }
          ensureLastUndefined = true;
        } else if ((0, _index.isIfStatement)(node)) {
          const consequent = node.consequent ? gatherSequenceExpressions([node.consequent], declars) : (0, _productions.buildUndefinedNode)();
          const alternate = node.alternate ? gatherSequenceExpressions([node.alternate], declars) : (0, _productions.buildUndefinedNode)();
          if (!consequent || !alternate) return;
          exprs.push((0, _index2.conditionalExpression)(node.test, consequent, alternate));
        } else if ((0, _index.isBlockStatement)(node)) {
          const body = gatherSequenceExpressions(node.body, declars);
          if (!body) return;
          exprs.push(body);
        } else if ((0, _index.isEmptyStatement)(node)) {
          if (nodes.indexOf(node) === 0) {
            ensureLastUndefined = true;
          }
        } else {
          return;
        }
      }
      if (ensureLastUndefined) {
        exprs.push((0, _productions.buildUndefinedNode)());
      }
      if (exprs.length === 1) {
        return exprs[0];
      } else {
        return (0, _index2.sequenceExpression)(exprs);
      }
    }
  }
});

// ../node_modules/@babel/types/lib/converters/toSequenceExpression.js
var require_toSequenceExpression = __commonJS({
  "../node_modules/@babel/types/lib/converters/toSequenceExpression.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = toSequenceExpression;
    var _gatherSequenceExpressions = require_gatherSequenceExpressions();
    function toSequenceExpression(nodes, scope) {
      if (!(nodes != null && nodes.length)) return;
      const declars = [];
      const result = (0, _gatherSequenceExpressions.default)(nodes, declars);
      if (!result) return;
      for (const declar of declars) {
        scope.push(declar);
      }
      return result;
    }
  }
});

// ../node_modules/@babel/types/lib/index.js
var require_lib3 = __commonJS({
  "../node_modules/@babel/types/lib/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var _exportNames = {
      react: true,
      assertNode: true,
      createTypeAnnotationBasedOnTypeof: true,
      createUnionTypeAnnotation: true,
      createFlowUnionType: true,
      createTSUnionType: true,
      cloneNode: true,
      clone: true,
      cloneDeep: true,
      cloneDeepWithoutLoc: true,
      cloneWithoutLoc: true,
      addComment: true,
      addComments: true,
      inheritInnerComments: true,
      inheritLeadingComments: true,
      inheritsComments: true,
      inheritTrailingComments: true,
      removeComments: true,
      ensureBlock: true,
      toBindingIdentifierName: true,
      toBlock: true,
      toComputedKey: true,
      toExpression: true,
      toIdentifier: true,
      toKeyAlias: true,
      toStatement: true,
      valueToNode: true,
      appendToMemberExpression: true,
      inherits: true,
      prependToMemberExpression: true,
      removeProperties: true,
      removePropertiesDeep: true,
      removeTypeDuplicates: true,
      getAssignmentIdentifiers: true,
      getBindingIdentifiers: true,
      getOuterBindingIdentifiers: true,
      getFunctionName: true,
      traverse: true,
      traverseFast: true,
      shallowEqual: true,
      is: true,
      isBinding: true,
      isBlockScoped: true,
      isImmutable: true,
      isLet: true,
      isNode: true,
      isNodesEquivalent: true,
      isPlaceholderType: true,
      isReferenced: true,
      isScope: true,
      isSpecifierDefault: true,
      isType: true,
      isValidES3Identifier: true,
      isValidIdentifier: true,
      isVar: true,
      matchesPattern: true,
      validate: true,
      buildMatchMemberExpression: true,
      __internal__deprecationWarning: true
    };
    Object.defineProperty(exports, "__internal__deprecationWarning", {
      enumerable: true,
      get: function() {
        return _deprecationWarning.default;
      }
    });
    Object.defineProperty(exports, "addComment", {
      enumerable: true,
      get: function() {
        return _addComment.default;
      }
    });
    Object.defineProperty(exports, "addComments", {
      enumerable: true,
      get: function() {
        return _addComments.default;
      }
    });
    Object.defineProperty(exports, "appendToMemberExpression", {
      enumerable: true,
      get: function() {
        return _appendToMemberExpression.default;
      }
    });
    Object.defineProperty(exports, "assertNode", {
      enumerable: true,
      get: function() {
        return _assertNode.default;
      }
    });
    Object.defineProperty(exports, "buildMatchMemberExpression", {
      enumerable: true,
      get: function() {
        return _buildMatchMemberExpression.default;
      }
    });
    Object.defineProperty(exports, "clone", {
      enumerable: true,
      get: function() {
        return _clone.default;
      }
    });
    Object.defineProperty(exports, "cloneDeep", {
      enumerable: true,
      get: function() {
        return _cloneDeep.default;
      }
    });
    Object.defineProperty(exports, "cloneDeepWithoutLoc", {
      enumerable: true,
      get: function() {
        return _cloneDeepWithoutLoc.default;
      }
    });
    Object.defineProperty(exports, "cloneNode", {
      enumerable: true,
      get: function() {
        return _cloneNode.default;
      }
    });
    Object.defineProperty(exports, "cloneWithoutLoc", {
      enumerable: true,
      get: function() {
        return _cloneWithoutLoc.default;
      }
    });
    Object.defineProperty(exports, "createFlowUnionType", {
      enumerable: true,
      get: function() {
        return _createFlowUnionType.default;
      }
    });
    Object.defineProperty(exports, "createTSUnionType", {
      enumerable: true,
      get: function() {
        return _createTSUnionType.default;
      }
    });
    Object.defineProperty(exports, "createTypeAnnotationBasedOnTypeof", {
      enumerable: true,
      get: function() {
        return _createTypeAnnotationBasedOnTypeof.default;
      }
    });
    Object.defineProperty(exports, "createUnionTypeAnnotation", {
      enumerable: true,
      get: function() {
        return _createFlowUnionType.default;
      }
    });
    Object.defineProperty(exports, "ensureBlock", {
      enumerable: true,
      get: function() {
        return _ensureBlock.default;
      }
    });
    Object.defineProperty(exports, "getAssignmentIdentifiers", {
      enumerable: true,
      get: function() {
        return _getAssignmentIdentifiers.default;
      }
    });
    Object.defineProperty(exports, "getBindingIdentifiers", {
      enumerable: true,
      get: function() {
        return _getBindingIdentifiers.default;
      }
    });
    Object.defineProperty(exports, "getFunctionName", {
      enumerable: true,
      get: function() {
        return _getFunctionName.default;
      }
    });
    Object.defineProperty(exports, "getOuterBindingIdentifiers", {
      enumerable: true,
      get: function() {
        return _getOuterBindingIdentifiers.default;
      }
    });
    Object.defineProperty(exports, "inheritInnerComments", {
      enumerable: true,
      get: function() {
        return _inheritInnerComments.default;
      }
    });
    Object.defineProperty(exports, "inheritLeadingComments", {
      enumerable: true,
      get: function() {
        return _inheritLeadingComments.default;
      }
    });
    Object.defineProperty(exports, "inheritTrailingComments", {
      enumerable: true,
      get: function() {
        return _inheritTrailingComments.default;
      }
    });
    Object.defineProperty(exports, "inherits", {
      enumerable: true,
      get: function() {
        return _inherits.default;
      }
    });
    Object.defineProperty(exports, "inheritsComments", {
      enumerable: true,
      get: function() {
        return _inheritsComments.default;
      }
    });
    Object.defineProperty(exports, "is", {
      enumerable: true,
      get: function() {
        return _is.default;
      }
    });
    Object.defineProperty(exports, "isBinding", {
      enumerable: true,
      get: function() {
        return _isBinding.default;
      }
    });
    Object.defineProperty(exports, "isBlockScoped", {
      enumerable: true,
      get: function() {
        return _isBlockScoped.default;
      }
    });
    Object.defineProperty(exports, "isImmutable", {
      enumerable: true,
      get: function() {
        return _isImmutable.default;
      }
    });
    Object.defineProperty(exports, "isLet", {
      enumerable: true,
      get: function() {
        return _isLet.default;
      }
    });
    Object.defineProperty(exports, "isNode", {
      enumerable: true,
      get: function() {
        return _isNode.default;
      }
    });
    Object.defineProperty(exports, "isNodesEquivalent", {
      enumerable: true,
      get: function() {
        return _isNodesEquivalent.default;
      }
    });
    Object.defineProperty(exports, "isPlaceholderType", {
      enumerable: true,
      get: function() {
        return _isPlaceholderType.default;
      }
    });
    Object.defineProperty(exports, "isReferenced", {
      enumerable: true,
      get: function() {
        return _isReferenced.default;
      }
    });
    Object.defineProperty(exports, "isScope", {
      enumerable: true,
      get: function() {
        return _isScope.default;
      }
    });
    Object.defineProperty(exports, "isSpecifierDefault", {
      enumerable: true,
      get: function() {
        return _isSpecifierDefault.default;
      }
    });
    Object.defineProperty(exports, "isType", {
      enumerable: true,
      get: function() {
        return _isType.default;
      }
    });
    Object.defineProperty(exports, "isValidES3Identifier", {
      enumerable: true,
      get: function() {
        return _isValidES3Identifier.default;
      }
    });
    Object.defineProperty(exports, "isValidIdentifier", {
      enumerable: true,
      get: function() {
        return _isValidIdentifier.default;
      }
    });
    Object.defineProperty(exports, "isVar", {
      enumerable: true,
      get: function() {
        return _isVar.default;
      }
    });
    Object.defineProperty(exports, "matchesPattern", {
      enumerable: true,
      get: function() {
        return _matchesPattern.default;
      }
    });
    Object.defineProperty(exports, "prependToMemberExpression", {
      enumerable: true,
      get: function() {
        return _prependToMemberExpression.default;
      }
    });
    exports.react = void 0;
    Object.defineProperty(exports, "removeComments", {
      enumerable: true,
      get: function() {
        return _removeComments.default;
      }
    });
    Object.defineProperty(exports, "removeProperties", {
      enumerable: true,
      get: function() {
        return _removeProperties.default;
      }
    });
    Object.defineProperty(exports, "removePropertiesDeep", {
      enumerable: true,
      get: function() {
        return _removePropertiesDeep.default;
      }
    });
    Object.defineProperty(exports, "removeTypeDuplicates", {
      enumerable: true,
      get: function() {
        return _removeTypeDuplicates.default;
      }
    });
    Object.defineProperty(exports, "shallowEqual", {
      enumerable: true,
      get: function() {
        return _shallowEqual.default;
      }
    });
    Object.defineProperty(exports, "toBindingIdentifierName", {
      enumerable: true,
      get: function() {
        return _toBindingIdentifierName.default;
      }
    });
    Object.defineProperty(exports, "toBlock", {
      enumerable: true,
      get: function() {
        return _toBlock.default;
      }
    });
    Object.defineProperty(exports, "toComputedKey", {
      enumerable: true,
      get: function() {
        return _toComputedKey.default;
      }
    });
    Object.defineProperty(exports, "toExpression", {
      enumerable: true,
      get: function() {
        return _toExpression.default;
      }
    });
    Object.defineProperty(exports, "toIdentifier", {
      enumerable: true,
      get: function() {
        return _toIdentifier.default;
      }
    });
    Object.defineProperty(exports, "toKeyAlias", {
      enumerable: true,
      get: function() {
        return _toKeyAlias.default;
      }
    });
    Object.defineProperty(exports, "toStatement", {
      enumerable: true,
      get: function() {
        return _toStatement.default;
      }
    });
    Object.defineProperty(exports, "traverse", {
      enumerable: true,
      get: function() {
        return _traverse.default;
      }
    });
    Object.defineProperty(exports, "traverseFast", {
      enumerable: true,
      get: function() {
        return _traverseFast.default;
      }
    });
    Object.defineProperty(exports, "validate", {
      enumerable: true,
      get: function() {
        return _validate.default;
      }
    });
    Object.defineProperty(exports, "valueToNode", {
      enumerable: true,
      get: function() {
        return _valueToNode.default;
      }
    });
    var _isReactComponent = require_isReactComponent();
    var _isCompatTag = require_isCompatTag();
    var _buildChildren = require_buildChildren();
    var _assertNode = require_assertNode();
    var _index = require_generated3();
    Object.keys(_index).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
      if (key in exports && exports[key] === _index[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _index[key];
        }
      });
    });
    var _createTypeAnnotationBasedOnTypeof = require_createTypeAnnotationBasedOnTypeof();
    var _createFlowUnionType = require_createFlowUnionType();
    var _createTSUnionType = require_createTSUnionType();
    var _productions = require_productions();
    Object.keys(_productions).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
      if (key in exports && exports[key] === _productions[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _productions[key];
        }
      });
    });
    var _index2 = require_generated2();
    Object.keys(_index2).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
      if (key in exports && exports[key] === _index2[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _index2[key];
        }
      });
    });
    var _cloneNode = require_cloneNode();
    var _clone = require_clone();
    var _cloneDeep = require_cloneDeep();
    var _cloneDeepWithoutLoc = require_cloneDeepWithoutLoc();
    var _cloneWithoutLoc = require_cloneWithoutLoc();
    var _addComment = require_addComment();
    var _addComments = require_addComments();
    var _inheritInnerComments = require_inheritInnerComments();
    var _inheritLeadingComments = require_inheritLeadingComments();
    var _inheritsComments = require_inheritsComments();
    var _inheritTrailingComments = require_inheritTrailingComments();
    var _removeComments = require_removeComments();
    var _index3 = require_generated4();
    Object.keys(_index3).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
      if (key in exports && exports[key] === _index3[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _index3[key];
        }
      });
    });
    var _index4 = require_constants();
    Object.keys(_index4).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
      if (key in exports && exports[key] === _index4[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _index4[key];
        }
      });
    });
    var _ensureBlock = require_ensureBlock();
    var _toBindingIdentifierName = require_toBindingIdentifierName();
    var _toBlock = require_toBlock();
    var _toComputedKey = require_toComputedKey();
    var _toExpression = require_toExpression();
    var _toIdentifier = require_toIdentifier();
    var _toKeyAlias = require_toKeyAlias();
    var _toStatement = require_toStatement();
    var _valueToNode = require_valueToNode();
    var _index5 = require_definitions();
    Object.keys(_index5).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
      if (key in exports && exports[key] === _index5[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _index5[key];
        }
      });
    });
    var _appendToMemberExpression = require_appendToMemberExpression();
    var _inherits = require_inherits();
    var _prependToMemberExpression = require_prependToMemberExpression();
    var _removeProperties = require_removeProperties();
    var _removePropertiesDeep = require_removePropertiesDeep();
    var _removeTypeDuplicates = require_removeTypeDuplicates();
    var _getAssignmentIdentifiers = require_getAssignmentIdentifiers();
    var _getBindingIdentifiers = require_getBindingIdentifiers();
    var _getOuterBindingIdentifiers = require_getOuterBindingIdentifiers();
    var _getFunctionName = require_getFunctionName();
    var _traverse = require_traverse();
    Object.keys(_traverse).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
      if (key in exports && exports[key] === _traverse[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _traverse[key];
        }
      });
    });
    var _traverseFast = require_traverseFast();
    var _shallowEqual = require_shallowEqual();
    var _is = require_is();
    var _isBinding = require_isBinding();
    var _isBlockScoped = require_isBlockScoped();
    var _isImmutable = require_isImmutable();
    var _isLet = require_isLet();
    var _isNode = require_isNode();
    var _isNodesEquivalent = require_isNodesEquivalent();
    var _isPlaceholderType = require_isPlaceholderType();
    var _isReferenced = require_isReferenced();
    var _isScope = require_isScope();
    var _isSpecifierDefault = require_isSpecifierDefault();
    var _isType = require_isType();
    var _isValidES3Identifier = require_isValidES3Identifier();
    var _isValidIdentifier = require_isValidIdentifier();
    var _isVar = require_isVar();
    var _matchesPattern = require_matchesPattern();
    var _validate = require_validate();
    var _buildMatchMemberExpression = require_buildMatchMemberExpression();
    var _index6 = require_generated();
    Object.keys(_index6).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
      if (key in exports && exports[key] === _index6[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _index6[key];
        }
      });
    });
    var _deprecationWarning = require_deprecationWarning();
    var _toSequenceExpression = require_toSequenceExpression();
    var react = exports.react = {
      isReactComponent: _isReactComponent.default,
      isCompatTag: _isCompatTag.default,
      buildChildren: _buildChildren.default
    };
    exports.toSequenceExpression = _toSequenceExpression.default;
    if (process.env.BABEL_TYPES_8_BREAKING) {
      console.warn("BABEL_TYPES_8_BREAKING is not supported anymore. Use the latest Babel 8.0.0 pre-release instead!");
    }
  }
});

// ../node_modules/@babel/generator/lib/node/parentheses.js
var require_parentheses = __commonJS({
  "../node_modules/@babel/generator/lib/node/parentheses.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.AssignmentExpression = AssignmentExpression;
    exports.BinaryExpression = BinaryExpression;
    exports.ClassExpression = ClassExpression;
    exports.ArrowFunctionExpression = exports.ConditionalExpression = ConditionalExpression;
    exports.DoExpression = DoExpression;
    exports.FunctionExpression = FunctionExpression;
    exports.FunctionTypeAnnotation = FunctionTypeAnnotation;
    exports.Identifier = Identifier;
    exports.LogicalExpression = LogicalExpression;
    exports.NullableTypeAnnotation = NullableTypeAnnotation;
    exports.ObjectExpression = ObjectExpression;
    exports.OptionalIndexedAccessType = OptionalIndexedAccessType;
    exports.OptionalCallExpression = exports.OptionalMemberExpression = OptionalMemberExpression;
    exports.SequenceExpression = SequenceExpression;
    exports.TSSatisfiesExpression = exports.TSAsExpression = TSAsExpression;
    exports.TSConditionalType = TSConditionalType;
    exports.TSConstructorType = exports.TSFunctionType = TSFunctionType;
    exports.TSInferType = TSInferType;
    exports.TSInstantiationExpression = TSInstantiationExpression;
    exports.TSIntersectionType = TSIntersectionType;
    exports.SpreadElement = exports.UnaryExpression = exports.TSTypeAssertion = UnaryLike;
    exports.TSTypeOperator = TSTypeOperator;
    exports.TSUnionType = TSUnionType;
    exports.IntersectionTypeAnnotation = exports.UnionTypeAnnotation = UnionTypeAnnotation;
    exports.UpdateExpression = UpdateExpression;
    exports.AwaitExpression = exports.YieldExpression = YieldExpression;
    var _t = require_lib3();
    var _index = require_node();
    var {
      isMemberExpression,
      isOptionalMemberExpression,
      isYieldExpression,
      isStatement
    } = _t;
    var PRECEDENCE = /* @__PURE__ */ new Map([["||", 0], ["??", 1], ["&&", 2], ["|", 3], ["^", 4], ["&", 5], ["==", 6], ["===", 6], ["!=", 6], ["!==", 6], ["<", 7], [">", 7], ["<=", 7], [">=", 7], ["in", 7], ["instanceof", 7], [">>", 8], ["<<", 8], [">>>", 8], ["+", 9], ["-", 9], ["*", 10], ["/", 10], ["%", 10], ["**", 11]]);
    function isTSTypeExpression(nodeId) {
      return nodeId === 156 || nodeId === 201 || nodeId === 209;
    }
    var isClassExtendsClause = (node, parent, parentId) => {
      return (parentId === 21 || parentId === 22) && parent.superClass === node;
    };
    var hasPostfixPart = (node, parent, parentId) => {
      switch (parentId) {
        case 108:
        case 132:
          return parent.object === node;
        case 17:
        case 130:
        case 112:
          return parent.callee === node;
        case 222:
          return parent.tag === node;
        case 191:
          return true;
      }
      return false;
    };
    function NullableTypeAnnotation(node, parent, parentId) {
      return parentId === 4;
    }
    function FunctionTypeAnnotation(node, parent, parentId, tokenContext) {
      return parentId === 239 || parentId === 90 || parentId === 4 || (tokenContext & _index.TokenContext.arrowFlowReturnType) > 0;
    }
    function UpdateExpression(node, parent, parentId) {
      return hasPostfixPart(node, parent, parentId) || isClassExtendsClause(node, parent, parentId);
    }
    function needsParenBeforeExpressionBrace(tokenContext) {
      return (tokenContext & (_index.TokenContext.expressionStatement | _index.TokenContext.arrowBody)) > 0;
    }
    function ObjectExpression(node, parent, parentId, tokenContext) {
      return needsParenBeforeExpressionBrace(tokenContext);
    }
    function DoExpression(node, parent, parentId, tokenContext) {
      return (tokenContext & _index.TokenContext.expressionStatement) > 0 && !node.async;
    }
    function BinaryLike(node, parent, parentId, nodeType) {
      if (isClassExtendsClause(node, parent, parentId)) {
        return true;
      }
      if (hasPostfixPart(node, parent, parentId) || parentId === 238 || parentId === 145 || parentId === 8) {
        return true;
      }
      let parentPos;
      switch (parentId) {
        case 10:
        case 107:
          parentPos = PRECEDENCE.get(parent.operator);
          break;
        case 156:
        case 201:
          parentPos = 7;
      }
      if (parentPos !== void 0) {
        const nodePos = nodeType === 2 ? 7 : PRECEDENCE.get(node.operator);
        if (parentPos > nodePos) return true;
        if (parentPos === nodePos && parentId === 10 && (nodePos === 11 ? parent.left === node : parent.right === node)) {
          return true;
        }
        if (nodeType === 1 && parentId === 107 && (nodePos === 1 && parentPos !== 1 || parentPos === 1 && nodePos !== 1)) {
          return true;
        }
      }
      return false;
    }
    function UnionTypeAnnotation(node, parent, parentId) {
      switch (parentId) {
        case 4:
        case 115:
        case 90:
        case 239:
          return true;
      }
      return false;
    }
    function OptionalIndexedAccessType(node, parent, parentId) {
      return parentId === 84 && parent.objectType === node;
    }
    function TSAsExpression(node, parent, parentId) {
      if ((parentId === 6 || parentId === 7) && parent.left === node) {
        return true;
      }
      if (parentId === 10 && (parent.operator === "|" || parent.operator === "&") && node === parent.left) {
        return true;
      }
      return BinaryLike(node, parent, parentId, 2);
    }
    function TSConditionalType(node, parent, parentId) {
      switch (parentId) {
        case 155:
        case 195:
        case 211:
        case 212:
          return true;
        case 175:
          return parent.objectType === node;
        case 181:
        case 219:
          return parent.types[0] === node;
        case 161:
          return parent.checkType === node || parent.extendsType === node;
      }
      return false;
    }
    function TSUnionType(node, parent, parentId) {
      switch (parentId) {
        case 181:
        case 211:
        case 155:
        case 195:
          return true;
        case 175:
          return parent.objectType === node;
      }
      return false;
    }
    function TSIntersectionType(node, parent, parentId) {
      return parentId === 211 || TSTypeOperator(node, parent, parentId);
    }
    function TSInferType(node, parent, parentId) {
      if (TSTypeOperator(node, parent, parentId)) {
        return true;
      }
      if ((parentId === 181 || parentId === 219) && node.typeParameter.constraint && parent.types[0] === node) {
        return true;
      }
      return false;
    }
    function TSTypeOperator(node, parent, parentId) {
      switch (parentId) {
        case 155:
        case 195:
          return true;
        case 175:
          if (parent.objectType === node) {
            return true;
          }
      }
      return false;
    }
    function TSInstantiationExpression(node, parent, parentId) {
      switch (parentId) {
        case 17:
        case 130:
        case 112:
        case 177:
          return parent.typeParameters != null;
      }
      return false;
    }
    function TSFunctionType(node, parent, parentId) {
      if (TSUnionType(node, parent, parentId)) return true;
      return parentId === 219 || parentId === 161 && (parent.checkType === node || parent.extendsType === node);
    }
    function BinaryExpression(node, parent, parentId, tokenContext) {
      if (BinaryLike(node, parent, parentId, 0)) return true;
      return (tokenContext & _index.TokenContext.forInOrInitHeadAccumulate) > 0 && node.operator === "in";
    }
    function LogicalExpression(node, parent, parentId) {
      return BinaryLike(node, parent, parentId, 1);
    }
    function SequenceExpression(node, parent, parentId) {
      if (parentId === 144 || parentId === 133 || parentId === 108 && parent.property === node || parentId === 132 && parent.property === node || parentId === 224) {
        return false;
      }
      if (parentId === 21) {
        return true;
      }
      if (parentId === 68) {
        return parent.right === node;
      }
      if (parentId === 60) {
        return true;
      }
      return !isStatement(parent);
    }
    function YieldExpression(node, parent, parentId) {
      return parentId === 10 || parentId === 107 || parentId === 238 || parentId === 145 || hasPostfixPart(node, parent, parentId) || parentId === 8 && isYieldExpression(node) || parentId === 28 && node === parent.test || isClassExtendsClause(node, parent, parentId) || isTSTypeExpression(parentId);
    }
    function ClassExpression(node, parent, parentId, tokenContext) {
      return (tokenContext & (_index.TokenContext.expressionStatement | _index.TokenContext.exportDefault)) > 0;
    }
    function UnaryLike(node, parent, parentId) {
      return hasPostfixPart(node, parent, parentId) || parentId === 10 && parent.operator === "**" && parent.left === node || isClassExtendsClause(node, parent, parentId);
    }
    function FunctionExpression(node, parent, parentId, tokenContext) {
      return (tokenContext & (_index.TokenContext.expressionStatement | _index.TokenContext.exportDefault)) > 0;
    }
    function ConditionalExpression(node, parent, parentId) {
      switch (parentId) {
        case 238:
        case 145:
        case 10:
        case 107:
        case 8:
          return true;
        case 28:
          if (parent.test === node) {
            return true;
          }
      }
      if (isTSTypeExpression(parentId)) {
        return true;
      }
      return UnaryLike(node, parent, parentId);
    }
    function OptionalMemberExpression(node, parent, parentId) {
      switch (parentId) {
        case 17:
          return parent.callee === node;
        case 108:
          return parent.object === node;
      }
      return false;
    }
    function AssignmentExpression(node, parent, parentId, tokenContext) {
      if (needsParenBeforeExpressionBrace(tokenContext) && node.left.type === "ObjectPattern") {
        return true;
      }
      return ConditionalExpression(node, parent, parentId);
    }
    function Identifier(node, parent, parentId, tokenContext, getRawIdentifier) {
      var _node$extra;
      if (getRawIdentifier && getRawIdentifier(node) !== node.name) {
        return false;
      }
      if (parentId === 6 && (_node$extra = node.extra) != null && _node$extra.parenthesized && parent.left === node) {
        const rightType = parent.right.type;
        if ((rightType === "FunctionExpression" || rightType === "ClassExpression") && parent.right.id == null) {
          return true;
        }
      }
      if (tokenContext & _index.TokenContext.forOfHead || (parentId === 108 || parentId === 132) && tokenContext & (_index.TokenContext.expressionStatement | _index.TokenContext.forInitHead | _index.TokenContext.forInHead)) {
        if (node.name === "let") {
          const isFollowedByBracket = isMemberExpression(parent, {
            object: node,
            computed: true
          }) || isOptionalMemberExpression(parent, {
            object: node,
            computed: true,
            optional: false
          });
          if (isFollowedByBracket && tokenContext & (_index.TokenContext.expressionStatement | _index.TokenContext.forInitHead | _index.TokenContext.forInHead)) {
            return true;
          }
          return (tokenContext & _index.TokenContext.forOfHead) > 0;
        }
      }
      return parentId === 68 && parent.left === node && node.name === "async" && !parent.await;
    }
  }
});

// ../node_modules/@babel/generator/lib/generators/template-literals.js
var require_template_literals = __commonJS({
  "../node_modules/@babel/generator/lib/generators/template-literals.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.TaggedTemplateExpression = TaggedTemplateExpression;
    exports.TemplateElement = TemplateElement;
    exports.TemplateLiteral = TemplateLiteral;
    exports._printTemplate = _printTemplate;
    function TaggedTemplateExpression(node) {
      this.print(node.tag);
      this.print(node.typeParameters);
      this.print(node.quasi);
    }
    function TemplateElement() {
      throw new Error("TemplateElement printing is handled in TemplateLiteral");
    }
    function _printTemplate(node, substitutions) {
      const quasis = node.quasis;
      let partRaw = "`";
      for (let i = 0; i < quasis.length - 1; i++) {
        partRaw += quasis[i].value.raw;
        this.token(partRaw + "${", true);
        this.print(substitutions[i]);
        partRaw = "}";
        if (this.tokenMap) {
          const token = this.tokenMap.findMatching(node, "}", i);
          if (token) this._catchUpTo(token.loc.start);
        }
      }
      partRaw += quasis[quasis.length - 1].value.raw;
      this.token(partRaw + "`", true);
    }
    function TemplateLiteral(node) {
      _printTemplate.call(this, node, node.expressions);
    }
  }
});

// ../node_modules/@babel/generator/lib/generators/expressions.js
var require_expressions = __commonJS({
  "../node_modules/@babel/generator/lib/generators/expressions.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.LogicalExpression = exports.AssignmentExpression = AssignmentExpression;
    exports.AssignmentPattern = AssignmentPattern;
    exports.AwaitExpression = AwaitExpression;
    exports.BinaryExpression = BinaryExpression;
    exports.BindExpression = BindExpression;
    exports.CallExpression = CallExpression;
    exports.ConditionalExpression = ConditionalExpression;
    exports.Decorator = Decorator;
    exports.DoExpression = DoExpression;
    exports.EmptyStatement = EmptyStatement;
    exports.ExpressionStatement = ExpressionStatement;
    exports.Import = Import;
    exports.MemberExpression = MemberExpression;
    exports.MetaProperty = MetaProperty;
    exports.ModuleExpression = ModuleExpression;
    exports.NewExpression = NewExpression;
    exports.OptionalCallExpression = OptionalCallExpression;
    exports.OptionalMemberExpression = OptionalMemberExpression;
    exports.ParenthesizedExpression = ParenthesizedExpression;
    exports.PrivateName = PrivateName;
    exports.SequenceExpression = SequenceExpression;
    exports.Super = Super;
    exports.ThisExpression = ThisExpression;
    exports.UnaryExpression = UnaryExpression;
    exports.UpdateExpression = UpdateExpression;
    exports.V8IntrinsicIdentifier = V8IntrinsicIdentifier;
    exports.YieldExpression = YieldExpression;
    exports._shouldPrintDecoratorsBeforeExport = _shouldPrintDecoratorsBeforeExport;
    var _t = require_lib3();
    var _index = require_node();
    var {
      isCallExpression,
      isLiteral,
      isMemberExpression,
      isNewExpression,
      isPattern
    } = _t;
    function UnaryExpression(node) {
      const {
        operator
      } = node;
      const firstChar = operator.charCodeAt(0);
      if (firstChar >= 97 && firstChar <= 122) {
        this.word(operator);
        this.space();
      } else {
        this.tokenChar(firstChar);
      }
      this.print(node.argument);
    }
    function DoExpression(node) {
      if (node.async) {
        this.word("async", true);
        this.space();
      }
      this.word("do");
      this.space();
      this.print(node.body);
    }
    function ParenthesizedExpression(node) {
      this.tokenChar(40);
      const oldNoLineTerminatorAfterNode = this.enterDelimited();
      this.print(node.expression, void 0, true);
      this._noLineTerminatorAfterNode = oldNoLineTerminatorAfterNode;
      this.rightParens(node);
    }
    function UpdateExpression(node) {
      if (node.prefix) {
        this.token(node.operator, false, 0, true);
        this.print(node.argument);
      } else {
        this.print(node.argument, true);
        this.token(node.operator, false, 0, true);
      }
    }
    function ConditionalExpression(node) {
      this.print(node.test);
      this.space();
      this.tokenChar(63);
      this.space();
      this.print(node.consequent);
      this.space();
      this.tokenChar(58);
      this.space();
      this.print(node.alternate);
    }
    function NewExpression(node, parent) {
      this.word("new");
      this.space();
      this.print(node.callee);
      if (this.format.minified && node.arguments.length === 0 && !node.optional && !isCallExpression(parent, {
        callee: node
      }) && !isMemberExpression(parent) && !isNewExpression(parent)) {
        return;
      }
      this.print(node.typeArguments);
      this.print(node.typeParameters);
      if (node.optional) {
        this.token("?.");
      }
      if (node.arguments.length === 0 && this.tokenMap && !this.tokenMap.endMatches(node, ")")) {
        return;
      }
      this.tokenChar(40);
      const oldNoLineTerminatorAfterNode = this.enterDelimited();
      this.printList(node.arguments, this.shouldPrintTrailingComma(")"), void 0, void 0, void 0, true);
      this._noLineTerminatorAfterNode = oldNoLineTerminatorAfterNode;
      this.rightParens(node);
    }
    function SequenceExpression(node) {
      this.printList(node.expressions);
    }
    function ThisExpression() {
      this.word("this");
    }
    function Super() {
      this.word("super");
    }
    function _shouldPrintDecoratorsBeforeExport(node) {
      if (typeof this.format.decoratorsBeforeExport === "boolean") {
        return this.format.decoratorsBeforeExport;
      }
      return typeof node.start === "number" && node.start === node.declaration.start;
    }
    function Decorator(node) {
      this.tokenChar(64);
      const {
        expression
      } = node;
      this.print(expression);
      this.newline();
    }
    function OptionalMemberExpression(node) {
      let {
        computed
      } = node;
      const {
        optional,
        property
      } = node;
      this.print(node.object);
      if (!computed && isMemberExpression(property)) {
        throw new TypeError("Got a MemberExpression for MemberExpression property");
      }
      if (isLiteral(property) && typeof property.value === "number") {
        computed = true;
      }
      if (optional) {
        this.token("?.");
      }
      if (computed) {
        this.tokenChar(91);
        this.print(property);
        this.tokenChar(93);
      } else {
        if (!optional) {
          this.tokenChar(46);
        }
        this.print(property);
      }
    }
    function OptionalCallExpression(node) {
      this.print(node.callee);
      this.print(node.typeParameters);
      if (node.optional) {
        this.token("?.");
      }
      this.print(node.typeArguments);
      this.tokenChar(40);
      const oldNoLineTerminatorAfterNode = this.enterDelimited();
      this.printList(node.arguments, void 0, void 0, void 0, void 0, true);
      this._noLineTerminatorAfterNode = oldNoLineTerminatorAfterNode;
      this.rightParens(node);
    }
    function CallExpression(node) {
      this.print(node.callee);
      this.print(node.typeArguments);
      this.print(node.typeParameters);
      this.tokenChar(40);
      const oldNoLineTerminatorAfterNode = this.enterDelimited();
      this.printList(node.arguments, this.shouldPrintTrailingComma(")"), void 0, void 0, void 0, true);
      this._noLineTerminatorAfterNode = oldNoLineTerminatorAfterNode;
      this.rightParens(node);
    }
    function Import() {
      this.word("import");
    }
    function AwaitExpression(node) {
      this.word("await");
      this.space();
      this.print(node.argument);
    }
    function YieldExpression(node) {
      if (node.delegate) {
        this.word("yield", true);
        this.tokenChar(42);
        if (node.argument) {
          this.space();
          this.print(node.argument);
        }
      } else if (node.argument) {
        this.word("yield", true);
        this.space();
        this.print(node.argument);
      } else {
        this.word("yield");
      }
    }
    function EmptyStatement() {
      this.semicolon(true);
    }
    function ExpressionStatement(node) {
      this.tokenContext |= _index.TokenContext.expressionStatement;
      this.print(node.expression);
      this.semicolon();
    }
    function AssignmentPattern(node) {
      this.print(node.left);
      if (node.left.type === "Identifier" || isPattern(node.left)) {
        if (node.left.optional) this.tokenChar(63);
        this.print(node.left.typeAnnotation);
      }
      this.space();
      this.tokenChar(61);
      this.space();
      this.print(node.right);
    }
    function AssignmentExpression(node) {
      this.print(node.left);
      this.space();
      this.token(node.operator, false, 0, true);
      this.space();
      this.print(node.right);
    }
    function BinaryExpression(node) {
      this.print(node.left);
      this.space();
      const {
        operator
      } = node;
      if (operator.charCodeAt(0) === 105) {
        this.word(operator);
      } else {
        this.token(operator, false, 0, true);
        this.setLastChar(operator.charCodeAt(operator.length - 1));
      }
      this.space();
      this.print(node.right);
    }
    function BindExpression(node) {
      this.print(node.object);
      this.token("::");
      this.print(node.callee);
    }
    function MemberExpression(node) {
      this.print(node.object);
      if (!node.computed && isMemberExpression(node.property)) {
        throw new TypeError("Got a MemberExpression for MemberExpression property");
      }
      let computed = node.computed;
      if (isLiteral(node.property) && typeof node.property.value === "number") {
        computed = true;
      }
      if (computed) {
        const oldNoLineTerminatorAfterNode = this.enterDelimited();
        this.tokenChar(91);
        this.print(node.property, void 0, true);
        this.tokenChar(93);
        this._noLineTerminatorAfterNode = oldNoLineTerminatorAfterNode;
      } else {
        this.tokenChar(46);
        this.print(node.property);
      }
    }
    function MetaProperty(node) {
      this.print(node.meta);
      this.tokenChar(46);
      this.print(node.property);
    }
    function PrivateName(node) {
      this.tokenChar(35);
      this.print(node.id);
    }
    function V8IntrinsicIdentifier(node) {
      this.tokenChar(37);
      this.word(node.name);
    }
    function ModuleExpression(node) {
      this.word("module", true);
      this.space();
      this.tokenChar(123);
      this.indent();
      const {
        body
      } = node;
      if (body.body.length || body.directives.length) {
        this.newline();
      }
      this.print(body);
      this.dedent();
      this.rightBrace(node);
    }
  }
});

// ../node_modules/@babel/generator/lib/generators/statements.js
var require_statements = __commonJS({
  "../node_modules/@babel/generator/lib/generators/statements.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.BreakStatement = BreakStatement;
    exports.CatchClause = CatchClause;
    exports.ContinueStatement = ContinueStatement;
    exports.DebuggerStatement = DebuggerStatement;
    exports.DoWhileStatement = DoWhileStatement;
    exports.ForInStatement = ForInStatement;
    exports.ForOfStatement = ForOfStatement;
    exports.ForStatement = ForStatement;
    exports.IfStatement = IfStatement;
    exports.LabeledStatement = LabeledStatement;
    exports.ReturnStatement = ReturnStatement;
    exports.SwitchCase = SwitchCase;
    exports.SwitchStatement = SwitchStatement;
    exports.ThrowStatement = ThrowStatement;
    exports.TryStatement = TryStatement;
    exports.VariableDeclaration = VariableDeclaration;
    exports.VariableDeclarator = VariableDeclarator;
    exports.WhileStatement = WhileStatement;
    exports.WithStatement = WithStatement;
    var _t = require_lib3();
    var _index = require_node();
    var {
      isFor,
      isIfStatement,
      isStatement
    } = _t;
    function WithStatement(node) {
      this.word("with");
      this.space();
      this.tokenChar(40);
      this.print(node.object);
      this.tokenChar(41);
      this.printBlock(node.body);
    }
    function IfStatement(node) {
      this.word("if");
      this.space();
      this.tokenChar(40);
      this.print(node.test);
      this.tokenChar(41);
      this.space();
      const needsBlock = node.alternate && isIfStatement(getLastStatement(node.consequent));
      if (needsBlock) {
        this.tokenChar(123);
        this.newline();
        this.indent();
      }
      this.printAndIndentOnComments(node.consequent);
      if (needsBlock) {
        this.dedent();
        this.newline();
        this.tokenChar(125);
      }
      if (node.alternate) {
        if (this.endsWith(125)) this.space();
        this.word("else");
        this.space();
        this.printAndIndentOnComments(node.alternate);
      }
    }
    function getLastStatement(statement) {
      const {
        body
      } = statement;
      if (isStatement(body) === false) {
        return statement;
      }
      return getLastStatement(body);
    }
    function ForStatement(node) {
      this.word("for");
      this.space();
      this.tokenChar(40);
      this.tokenContext |= _index.TokenContext.forInitHead | _index.TokenContext.forInOrInitHeadAccumulate;
      this.print(node.init);
      this.tokenContext = _index.TokenContext.normal;
      this.tokenChar(59);
      if (node.test) {
        this.space();
        this.print(node.test);
      }
      this.tokenChar(59, 1);
      if (node.update) {
        this.space();
        this.print(node.update);
      }
      this.tokenChar(41);
      this.printBlock(node.body);
    }
    function WhileStatement(node) {
      this.word("while");
      this.space();
      this.tokenChar(40);
      this.print(node.test);
      this.tokenChar(41);
      this.printBlock(node.body);
    }
    function ForInStatement(node) {
      this.word("for");
      this.space();
      this.noIndentInnerCommentsHere();
      this.tokenChar(40);
      this.tokenContext |= _index.TokenContext.forInHead | _index.TokenContext.forInOrInitHeadAccumulate;
      this.print(node.left);
      this.tokenContext = _index.TokenContext.normal;
      this.space();
      this.word("in");
      this.space();
      this.print(node.right);
      this.tokenChar(41);
      this.printBlock(node.body);
    }
    function ForOfStatement(node) {
      this.word("for");
      this.space();
      if (node.await) {
        this.word("await");
        this.space();
      }
      this.noIndentInnerCommentsHere();
      this.tokenChar(40);
      this.tokenContext |= _index.TokenContext.forOfHead;
      this.print(node.left);
      this.space();
      this.word("of");
      this.space();
      this.print(node.right);
      this.tokenChar(41);
      this.printBlock(node.body);
    }
    function DoWhileStatement(node) {
      this.word("do");
      this.space();
      this.print(node.body);
      this.space();
      this.word("while");
      this.space();
      this.tokenChar(40);
      this.print(node.test);
      this.tokenChar(41);
      this.semicolon();
    }
    function printStatementAfterKeyword(printer, node) {
      if (node) {
        printer.space();
        printer.printTerminatorless(node);
      }
      printer.semicolon();
    }
    function BreakStatement(node) {
      this.word("break");
      printStatementAfterKeyword(this, node.label);
    }
    function ContinueStatement(node) {
      this.word("continue");
      printStatementAfterKeyword(this, node.label);
    }
    function ReturnStatement(node) {
      this.word("return");
      printStatementAfterKeyword(this, node.argument);
    }
    function ThrowStatement(node) {
      this.word("throw");
      printStatementAfterKeyword(this, node.argument);
    }
    function LabeledStatement(node) {
      this.print(node.label);
      this.tokenChar(58);
      this.space();
      this.print(node.body);
    }
    function TryStatement(node) {
      this.word("try");
      this.space();
      this.print(node.block);
      this.space();
      if (node.handlers) {
        this.print(node.handlers[0]);
      } else {
        this.print(node.handler);
      }
      if (node.finalizer) {
        this.space();
        this.word("finally");
        this.space();
        this.print(node.finalizer);
      }
    }
    function CatchClause(node) {
      this.word("catch");
      this.space();
      if (node.param) {
        this.tokenChar(40);
        this.print(node.param);
        this.print(node.param.typeAnnotation);
        this.tokenChar(41);
        this.space();
      }
      this.print(node.body);
    }
    function SwitchStatement(node) {
      this.word("switch");
      this.space();
      this.tokenChar(40);
      this.print(node.discriminant);
      this.tokenChar(41);
      this.space();
      this.tokenChar(123);
      this.printSequence(node.cases, true);
      this.rightBrace(node);
    }
    function SwitchCase(node) {
      if (node.test) {
        this.word("case");
        this.space();
        this.print(node.test);
        this.tokenChar(58);
      } else {
        this.word("default");
        this.tokenChar(58);
      }
      if (node.consequent.length) {
        this.newline();
        this.printSequence(node.consequent, true);
      }
    }
    function DebuggerStatement() {
      this.word("debugger");
      this.semicolon();
    }
    function commaSeparatorWithNewline(occurrenceCount) {
      this.tokenChar(44, occurrenceCount);
      this.newline();
    }
    function VariableDeclaration(node, parent) {
      if (node.declare) {
        this.word("declare");
        this.space();
      }
      const {
        kind
      } = node;
      switch (kind) {
        case "await using":
          this.word("await");
          this.space();
        case "using":
          this.word("using", true);
          break;
        default:
          this.word(kind);
      }
      this.space();
      let hasInits = false;
      if (!isFor(parent)) {
        for (const declar of node.declarations) {
          if (declar.init) {
            hasInits = true;
            break;
          }
        }
      }
      this.printList(node.declarations, void 0, void 0, node.declarations.length > 1, hasInits ? commaSeparatorWithNewline : void 0);
      if (parent != null) {
        switch (parent.type) {
          case "ForStatement":
            if (parent.init === node) {
              return;
            }
            break;
          case "ForInStatement":
          case "ForOfStatement":
            if (parent.left === node) {
              return;
            }
        }
      }
      this.semicolon();
    }
    function VariableDeclarator(node) {
      this.print(node.id);
      if (node.definite) this.tokenChar(33);
      this.print(node.id.typeAnnotation);
      if (node.init) {
        this.space();
        this.tokenChar(61);
        this.space();
        this.print(node.init);
      }
    }
  }
});

// ../node_modules/@babel/generator/lib/generators/methods.js
var require_methods = __commonJS({
  "../node_modules/@babel/generator/lib/generators/methods.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ArrowFunctionExpression = ArrowFunctionExpression;
    exports.FunctionDeclaration = exports.FunctionExpression = FunctionExpression;
    exports._functionHead = _functionHead;
    exports._methodHead = _methodHead;
    exports._param = _param;
    exports._parameters = _parameters;
    exports._params = _params;
    exports._predicate = _predicate;
    exports._shouldPrintArrowParamsParens = _shouldPrintArrowParamsParens;
    var _t = require_lib3();
    var _index = require_node();
    var {
      isIdentifier
    } = _t;
    function _params(node, noLineTerminator, idNode, parentNode) {
      this.print(node.typeParameters);
      if (idNode !== void 0 || parentNode !== void 0) {
        const nameInfo = _getFuncIdName.call(this, idNode, parentNode);
        if (nameInfo) {
          this.sourceIdentifierName(nameInfo.name, nameInfo.pos);
        }
      }
      this.tokenChar(40);
      _parameters.call(this, node.params, 41);
      this.print(node.returnType, noLineTerminator);
      this._noLineTerminator = noLineTerminator;
    }
    function _parameters(parameters, endToken) {
      const oldNoLineTerminatorAfterNode = this.enterDelimited();
      const trailingComma = this.shouldPrintTrailingComma(endToken);
      const paramLength = parameters.length;
      for (let i = 0; i < paramLength; i++) {
        _param.call(this, parameters[i]);
        if (trailingComma || i < paramLength - 1) {
          this.tokenChar(44, i);
          this.space();
        }
      }
      this.tokenChar(endToken);
      this._noLineTerminatorAfterNode = oldNoLineTerminatorAfterNode;
    }
    function _param(parameter) {
      this.printJoin(parameter.decorators, void 0, void 0, void 0, void 0, true);
      this.print(parameter, void 0, true);
      if (parameter.optional) {
        this.tokenChar(63);
      }
      this.print(parameter.typeAnnotation, void 0, true);
    }
    function _methodHead(node) {
      const kind = node.kind;
      const key = node.key;
      if (kind === "get" || kind === "set") {
        this.word(kind);
        this.space();
      }
      if (node.async) {
        this.word("async", true);
        this.space();
      }
      if (kind === "method" || kind === "init") {
        if (node.generator) {
          this.tokenChar(42);
        }
      }
      if (node.computed) {
        this.tokenChar(91);
        this.print(key);
        this.tokenChar(93);
      } else {
        this.print(key);
      }
      if (node.optional) {
        this.tokenChar(63);
      }
      if (this._buf._map) {
        _params.call(this, node, false, node.computed && node.key.type !== "StringLiteral" ? void 0 : node.key);
      } else {
        _params.call(this, node, false);
      }
    }
    function _predicate(node, noLineTerminatorAfter) {
      if (node.predicate) {
        if (!node.returnType) {
          this.tokenChar(58);
        }
        this.space();
        this.print(node.predicate, noLineTerminatorAfter);
      }
    }
    function _functionHead(node, parent, hasPredicate) {
      if (node.async) {
        this.word("async");
        if (!this.format.preserveFormat) {
          this._innerCommentsState = 0;
        }
        this.space();
      }
      this.word("function");
      if (node.generator) {
        if (!this.format.preserveFormat) {
          this._innerCommentsState = 0;
        }
        this.tokenChar(42);
      }
      this.space();
      if (node.id) {
        this.print(node.id);
      }
      if (this._buf._map) {
        _params.call(this, node, false, node.id, parent);
      } else {
        _params.call(this, node, false);
      }
      if (hasPredicate) {
        _predicate.call(this, node);
      }
    }
    function FunctionExpression(node, parent) {
      _functionHead.call(this, node, parent, true);
      this.space();
      this.print(node.body);
    }
    function ArrowFunctionExpression(node, parent) {
      if (node.async) {
        this.word("async", true);
        this.space();
      }
      if (_shouldPrintArrowParamsParens.call(this, node)) {
        _params.call(this, node, true, void 0, this._buf._map ? parent : void 0);
      } else {
        this.print(node.params[0], true);
      }
      _predicate.call(this, node, true);
      this.space();
      this.printInnerComments();
      this.token("=>");
      this.space();
      this.tokenContext |= _index.TokenContext.arrowBody;
      this.print(node.body);
    }
    function _shouldPrintArrowParamsParens(node) {
      var _firstParam$leadingCo, _firstParam$trailingC;
      if (node.params.length !== 1) return true;
      if (node.typeParameters || node.returnType || node.predicate) {
        return true;
      }
      const firstParam = node.params[0];
      if (!isIdentifier(firstParam) || firstParam.typeAnnotation || firstParam.optional || (_firstParam$leadingCo = firstParam.leadingComments) != null && _firstParam$leadingCo.length || (_firstParam$trailingC = firstParam.trailingComments) != null && _firstParam$trailingC.length) {
        return true;
      }
      if (this.tokenMap) {
        if (node.loc == null) return true;
        if (this.tokenMap.findMatching(node, "(") !== null) return true;
        const arrowToken = this.tokenMap.findMatching(node, "=>");
        if ((arrowToken == null ? void 0 : arrowToken.loc) == null) return true;
        return arrowToken.loc.start.line !== node.loc.start.line;
      }
      if (this.format.retainLines) return true;
      return false;
    }
    function _getFuncIdName(idNode, parent) {
      let id = idNode;
      if (!id && parent) {
        const parentType = parent.type;
        if (parentType === "VariableDeclarator") {
          id = parent.id;
        } else if (parentType === "AssignmentExpression" || parentType === "AssignmentPattern") {
          id = parent.left;
        } else if (parentType === "ObjectProperty" || parentType === "ClassProperty") {
          if (!parent.computed || parent.key.type === "StringLiteral") {
            id = parent.key;
          }
        } else if (parentType === "ClassPrivateProperty" || parentType === "ClassAccessorProperty") {
          id = parent.key;
        }
      }
      if (!id) return;
      let nameInfo;
      if (id.type === "Identifier") {
        var _id$loc, _id$loc2;
        nameInfo = {
          pos: (_id$loc = id.loc) == null ? void 0 : _id$loc.start,
          name: ((_id$loc2 = id.loc) == null ? void 0 : _id$loc2.identifierName) || id.name
        };
      } else if (id.type === "PrivateName") {
        var _id$loc3;
        nameInfo = {
          pos: (_id$loc3 = id.loc) == null ? void 0 : _id$loc3.start,
          name: "#" + id.id.name
        };
      } else if (id.type === "StringLiteral") {
        var _id$loc4;
        nameInfo = {
          pos: (_id$loc4 = id.loc) == null ? void 0 : _id$loc4.start,
          name: id.value
        };
      }
      return nameInfo;
    }
  }
});

// ../node_modules/@babel/generator/lib/generators/typescript.js
var require_typescript2 = __commonJS({
  "../node_modules/@babel/generator/lib/generators/typescript.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.TSAnyKeyword = TSAnyKeyword;
    exports.TSArrayType = TSArrayType;
    exports.TSAsExpression = TSAsExpression;
    exports.TSBigIntKeyword = TSBigIntKeyword;
    exports.TSBooleanKeyword = TSBooleanKeyword;
    exports.TSCallSignatureDeclaration = TSCallSignatureDeclaration;
    exports.TSInterfaceHeritage = exports.TSClassImplements = TSClassImplements;
    exports.TSConditionalType = TSConditionalType;
    exports.TSConstructSignatureDeclaration = TSConstructSignatureDeclaration;
    exports.TSConstructorType = TSConstructorType;
    exports.TSDeclareFunction = TSDeclareFunction;
    exports.TSDeclareMethod = TSDeclareMethod;
    exports.TSEnumBody = TSEnumBody;
    exports.TSEnumDeclaration = TSEnumDeclaration;
    exports.TSEnumMember = TSEnumMember;
    exports.TSExportAssignment = TSExportAssignment;
    exports.TSExternalModuleReference = TSExternalModuleReference;
    exports.TSFunctionType = TSFunctionType;
    exports.TSImportEqualsDeclaration = TSImportEqualsDeclaration;
    exports.TSImportType = TSImportType;
    exports.TSIndexSignature = TSIndexSignature;
    exports.TSIndexedAccessType = TSIndexedAccessType;
    exports.TSInferType = TSInferType;
    exports.TSInstantiationExpression = TSInstantiationExpression;
    exports.TSInterfaceBody = TSInterfaceBody;
    exports.TSInterfaceDeclaration = TSInterfaceDeclaration;
    exports.TSIntersectionType = TSIntersectionType;
    exports.TSIntrinsicKeyword = TSIntrinsicKeyword;
    exports.TSLiteralType = TSLiteralType;
    exports.TSMappedType = TSMappedType;
    exports.TSMethodSignature = TSMethodSignature;
    exports.TSModuleBlock = TSModuleBlock;
    exports.TSModuleDeclaration = TSModuleDeclaration;
    exports.TSNamedTupleMember = TSNamedTupleMember;
    exports.TSNamespaceExportDeclaration = TSNamespaceExportDeclaration;
    exports.TSNeverKeyword = TSNeverKeyword;
    exports.TSNonNullExpression = TSNonNullExpression;
    exports.TSNullKeyword = TSNullKeyword;
    exports.TSNumberKeyword = TSNumberKeyword;
    exports.TSObjectKeyword = TSObjectKeyword;
    exports.TSOptionalType = TSOptionalType;
    exports.TSParameterProperty = TSParameterProperty;
    exports.TSParenthesizedType = TSParenthesizedType;
    exports.TSPropertySignature = TSPropertySignature;
    exports.TSQualifiedName = TSQualifiedName;
    exports.TSRestType = TSRestType;
    exports.TSSatisfiesExpression = TSSatisfiesExpression;
    exports.TSStringKeyword = TSStringKeyword;
    exports.TSSymbolKeyword = TSSymbolKeyword;
    exports.TSTemplateLiteralType = TSTemplateLiteralType;
    exports.TSThisType = TSThisType;
    exports.TSTupleType = TSTupleType;
    exports.TSTypeAliasDeclaration = TSTypeAliasDeclaration;
    exports.TSTypeAnnotation = TSTypeAnnotation;
    exports.TSTypeAssertion = TSTypeAssertion;
    exports.TSTypeLiteral = TSTypeLiteral;
    exports.TSTypeOperator = TSTypeOperator;
    exports.TSTypeParameter = TSTypeParameter;
    exports.TSTypeParameterDeclaration = exports.TSTypeParameterInstantiation = TSTypeParameterInstantiation;
    exports.TSTypePredicate = TSTypePredicate;
    exports.TSTypeQuery = TSTypeQuery;
    exports.TSTypeReference = TSTypeReference;
    exports.TSUndefinedKeyword = TSUndefinedKeyword;
    exports.TSUnionType = TSUnionType;
    exports.TSUnknownKeyword = TSUnknownKeyword;
    exports.TSVoidKeyword = TSVoidKeyword;
    exports._tsPrintClassMemberModifiers = _tsPrintClassMemberModifiers;
    var _methods = require_methods();
    var _classes = require_classes();
    var _templateLiterals = require_template_literals();
    function TSTypeAnnotation(node, parent) {
      this.token((parent.type === "TSFunctionType" || parent.type === "TSConstructorType") && parent.typeAnnotation === node ? "=>" : ":");
      this.space();
      if (node.optional) this.tokenChar(63);
      this.print(node.typeAnnotation);
    }
    function TSTypeParameterInstantiation(node, parent) {
      this.tokenChar(60);
      let printTrailingSeparator = parent.type === "ArrowFunctionExpression" && node.params.length === 1;
      if (this.tokenMap && node.start != null && node.end != null) {
        printTrailingSeparator && (printTrailingSeparator = !!this.tokenMap.find(node, (t) => this.tokenMap.matchesOriginal(t, ",")));
        printTrailingSeparator || (printTrailingSeparator = this.shouldPrintTrailingComma(">"));
      }
      this.printList(node.params, printTrailingSeparator);
      this.tokenChar(62);
    }
    function TSTypeParameter(node) {
      if (node.const) {
        this.word("const");
        this.space();
      }
      if (node.in) {
        this.word("in");
        this.space();
      }
      if (node.out) {
        this.word("out");
        this.space();
      }
      this.word(node.name);
      if (node.constraint) {
        this.space();
        this.word("extends");
        this.space();
        this.print(node.constraint);
      }
      if (node.default) {
        this.space();
        this.tokenChar(61);
        this.space();
        this.print(node.default);
      }
    }
    function TSParameterProperty(node) {
      if (node.accessibility) {
        this.word(node.accessibility);
        this.space();
      }
      if (node.readonly) {
        this.word("readonly");
        this.space();
      }
      _methods._param.call(this, node.parameter);
    }
    function TSDeclareFunction(node, parent) {
      if (node.declare) {
        this.word("declare");
        this.space();
      }
      _methods._functionHead.call(this, node, parent, false);
      this.semicolon();
    }
    function TSDeclareMethod(node) {
      _classes._classMethodHead.call(this, node);
      this.semicolon();
    }
    function TSQualifiedName(node) {
      this.print(node.left);
      this.tokenChar(46);
      this.print(node.right);
    }
    function TSCallSignatureDeclaration(node) {
      tsPrintSignatureDeclarationBase.call(this, node);
      maybePrintTrailingCommaOrSemicolon(this, node);
    }
    function maybePrintTrailingCommaOrSemicolon(printer, node) {
      if (!printer.tokenMap || !node.start || !node.end) {
        printer.semicolon();
        return;
      }
      if (printer.tokenMap.endMatches(node, ",")) {
        printer.token(",");
      } else if (printer.tokenMap.endMatches(node, ";")) {
        printer.semicolon();
      }
    }
    function TSConstructSignatureDeclaration(node) {
      this.word("new");
      this.space();
      tsPrintSignatureDeclarationBase.call(this, node);
      maybePrintTrailingCommaOrSemicolon(this, node);
    }
    function TSPropertySignature(node) {
      const {
        readonly
      } = node;
      if (readonly) {
        this.word("readonly");
        this.space();
      }
      tsPrintPropertyOrMethodName.call(this, node);
      this.print(node.typeAnnotation);
      maybePrintTrailingCommaOrSemicolon(this, node);
    }
    function tsPrintPropertyOrMethodName(node) {
      if (node.computed) {
        this.tokenChar(91);
      }
      this.print(node.key);
      if (node.computed) {
        this.tokenChar(93);
      }
      if (node.optional) {
        this.tokenChar(63);
      }
    }
    function TSMethodSignature(node) {
      const {
        kind
      } = node;
      if (kind === "set" || kind === "get") {
        this.word(kind);
        this.space();
      }
      tsPrintPropertyOrMethodName.call(this, node);
      tsPrintSignatureDeclarationBase.call(this, node);
      maybePrintTrailingCommaOrSemicolon(this, node);
    }
    function TSIndexSignature(node) {
      const {
        readonly,
        static: isStatic
      } = node;
      if (isStatic) {
        this.word("static");
        this.space();
      }
      if (readonly) {
        this.word("readonly");
        this.space();
      }
      this.tokenChar(91);
      _methods._parameters.call(this, node.parameters, 93);
      this.print(node.typeAnnotation);
      maybePrintTrailingCommaOrSemicolon(this, node);
    }
    function TSAnyKeyword() {
      this.word("any");
    }
    function TSBigIntKeyword() {
      this.word("bigint");
    }
    function TSUnknownKeyword() {
      this.word("unknown");
    }
    function TSNumberKeyword() {
      this.word("number");
    }
    function TSObjectKeyword() {
      this.word("object");
    }
    function TSBooleanKeyword() {
      this.word("boolean");
    }
    function TSStringKeyword() {
      this.word("string");
    }
    function TSSymbolKeyword() {
      this.word("symbol");
    }
    function TSVoidKeyword() {
      this.word("void");
    }
    function TSUndefinedKeyword() {
      this.word("undefined");
    }
    function TSNullKeyword() {
      this.word("null");
    }
    function TSNeverKeyword() {
      this.word("never");
    }
    function TSIntrinsicKeyword() {
      this.word("intrinsic");
    }
    function TSThisType() {
      this.word("this");
    }
    function TSFunctionType(node) {
      tsPrintFunctionOrConstructorType.call(this, node);
    }
    function TSConstructorType(node) {
      if (node.abstract) {
        this.word("abstract");
        this.space();
      }
      this.word("new");
      this.space();
      tsPrintFunctionOrConstructorType.call(this, node);
    }
    function tsPrintFunctionOrConstructorType(node) {
      const {
        typeParameters
      } = node;
      const parameters = node.parameters;
      this.print(typeParameters);
      this.tokenChar(40);
      _methods._parameters.call(this, parameters, 41);
      this.space();
      const returnType = node.typeAnnotation;
      this.print(returnType);
    }
    function TSTypeReference(node) {
      const typeArguments = node.typeParameters;
      this.print(node.typeName, !!typeArguments);
      this.print(typeArguments);
    }
    function TSTypePredicate(node) {
      if (node.asserts) {
        this.word("asserts");
        this.space();
      }
      this.print(node.parameterName);
      if (node.typeAnnotation) {
        this.space();
        this.word("is");
        this.space();
        this.print(node.typeAnnotation.typeAnnotation);
      }
    }
    function TSTypeQuery(node) {
      this.word("typeof");
      this.space();
      this.print(node.exprName);
      const typeArguments = node.typeParameters;
      if (typeArguments) {
        this.print(typeArguments);
      }
    }
    function TSTypeLiteral(node) {
      printBraced(this, node, () => this.printJoin(node.members, true, true, void 0, void 0, true));
    }
    function TSArrayType(node) {
      this.print(node.elementType, true);
      this.tokenChar(91);
      this.tokenChar(93);
    }
    function TSTupleType(node) {
      this.tokenChar(91);
      this.printList(node.elementTypes, this.shouldPrintTrailingComma("]"));
      this.tokenChar(93);
    }
    function TSOptionalType(node) {
      this.print(node.typeAnnotation);
      this.tokenChar(63);
    }
    function TSRestType(node) {
      this.token("...");
      this.print(node.typeAnnotation);
    }
    function TSNamedTupleMember(node) {
      this.print(node.label);
      if (node.optional) this.tokenChar(63);
      this.tokenChar(58);
      this.space();
      this.print(node.elementType);
    }
    function TSUnionType(node) {
      tsPrintUnionOrIntersectionType(this, node, "|");
    }
    function TSIntersectionType(node) {
      tsPrintUnionOrIntersectionType(this, node, "&");
    }
    function tsPrintUnionOrIntersectionType(printer, node, sep) {
      var _printer$tokenMap;
      let hasLeadingToken = 0;
      if ((_printer$tokenMap = printer.tokenMap) != null && _printer$tokenMap.startMatches(node, sep)) {
        hasLeadingToken = 1;
        printer.token(sep);
      }
      printer.printJoin(node.types, void 0, void 0, function(i) {
        this.space();
        this.token(sep, void 0, i + hasLeadingToken);
        this.space();
      });
    }
    function TSConditionalType(node) {
      this.print(node.checkType);
      this.space();
      this.word("extends");
      this.space();
      this.print(node.extendsType);
      this.space();
      this.tokenChar(63);
      this.space();
      this.print(node.trueType);
      this.space();
      this.tokenChar(58);
      this.space();
      this.print(node.falseType);
    }
    function TSInferType(node) {
      this.word("infer");
      this.print(node.typeParameter);
    }
    function TSParenthesizedType(node) {
      this.tokenChar(40);
      this.print(node.typeAnnotation);
      this.tokenChar(41);
    }
    function TSTypeOperator(node) {
      this.word(node.operator);
      this.space();
      this.print(node.typeAnnotation);
    }
    function TSIndexedAccessType(node) {
      this.print(node.objectType, true);
      this.tokenChar(91);
      this.print(node.indexType);
      this.tokenChar(93);
    }
    function TSMappedType(node) {
      const {
        nameType,
        optional,
        readonly,
        typeAnnotation
      } = node;
      this.tokenChar(123);
      const oldNoLineTerminatorAfterNode = this.enterDelimited();
      this.space();
      if (readonly) {
        tokenIfPlusMinus(this, readonly);
        this.word("readonly");
        this.space();
      }
      this.tokenChar(91);
      this.word(node.typeParameter.name);
      this.space();
      this.word("in");
      this.space();
      this.print(node.typeParameter.constraint, void 0, true);
      if (nameType) {
        this.space();
        this.word("as");
        this.space();
        this.print(nameType, void 0, true);
      }
      this.tokenChar(93);
      if (optional) {
        tokenIfPlusMinus(this, optional);
        this.tokenChar(63);
      }
      if (typeAnnotation) {
        this.tokenChar(58);
        this.space();
        this.print(typeAnnotation, void 0, true);
      }
      this.space();
      this._noLineTerminatorAfterNode = oldNoLineTerminatorAfterNode;
      this.tokenChar(125);
    }
    function tokenIfPlusMinus(self2, tok) {
      if (tok !== true) {
        self2.token(tok);
      }
    }
    function TSTemplateLiteralType(node) {
      _templateLiterals._printTemplate.call(this, node, node.types);
    }
    function TSLiteralType(node) {
      this.print(node.literal);
    }
    function TSClassImplements(node) {
      this.print(node.expression);
      this.print(node.typeArguments);
    }
    function TSInterfaceDeclaration(node) {
      const {
        declare,
        id,
        typeParameters,
        extends: extendz,
        body
      } = node;
      if (declare) {
        this.word("declare");
        this.space();
      }
      this.word("interface");
      this.space();
      this.print(id);
      this.print(typeParameters);
      if (extendz != null && extendz.length) {
        this.space();
        this.word("extends");
        this.space();
        this.printList(extendz);
      }
      this.space();
      this.print(body);
    }
    function TSInterfaceBody(node) {
      printBraced(this, node, () => this.printJoin(node.body, true, true, void 0, void 0, true));
    }
    function TSTypeAliasDeclaration(node) {
      const {
        declare,
        id,
        typeParameters,
        typeAnnotation
      } = node;
      if (declare) {
        this.word("declare");
        this.space();
      }
      this.word("type");
      this.space();
      this.print(id);
      this.print(typeParameters);
      this.space();
      this.tokenChar(61);
      this.space();
      this.print(typeAnnotation);
      this.semicolon();
    }
    function TSAsExpression(node) {
      const {
        expression,
        typeAnnotation
      } = node;
      this.print(expression, true);
      this.space();
      this.word("as");
      this.space();
      this.print(typeAnnotation);
    }
    function TSSatisfiesExpression(node) {
      const {
        expression,
        typeAnnotation
      } = node;
      this.print(expression, true);
      this.space();
      this.word("satisfies");
      this.space();
      this.print(typeAnnotation);
    }
    function TSTypeAssertion(node) {
      const {
        typeAnnotation,
        expression
      } = node;
      this.tokenChar(60);
      this.print(typeAnnotation);
      this.tokenChar(62);
      this.space();
      this.print(expression);
    }
    function TSInstantiationExpression(node) {
      this.print(node.expression);
      this.print(node.typeParameters);
    }
    function TSEnumDeclaration(node) {
      const {
        declare,
        const: isConst,
        id
      } = node;
      if (declare) {
        this.word("declare");
        this.space();
      }
      if (isConst) {
        this.word("const");
        this.space();
      }
      this.word("enum");
      this.space();
      this.print(id);
      this.space();
      TSEnumBody.call(this, node);
    }
    function TSEnumBody(node) {
      printBraced(this, node, () => {
        var _this$shouldPrintTrai;
        return this.printList(node.members, (_this$shouldPrintTrai = this.shouldPrintTrailingComma("}")) != null ? _this$shouldPrintTrai : true, true, true, void 0, true);
      });
    }
    function TSEnumMember(node) {
      const {
        id,
        initializer
      } = node;
      this.print(id);
      if (initializer) {
        this.space();
        this.tokenChar(61);
        this.space();
        this.print(initializer);
      }
    }
    function TSModuleDeclaration(node) {
      const {
        declare,
        id,
        kind
      } = node;
      if (declare) {
        this.word("declare");
        this.space();
      }
      if (!node.global) {
        this.word(kind != null ? kind : id.type === "Identifier" ? "namespace" : "module");
        this.space();
      }
      this.print(id);
      if (!node.body) {
        this.semicolon();
        return;
      }
      let body = node.body;
      while (body.type === "TSModuleDeclaration") {
        this.tokenChar(46);
        this.print(body.id);
        body = body.body;
      }
      this.space();
      this.print(body);
    }
    function TSModuleBlock(node) {
      printBraced(this, node, () => this.printSequence(node.body, true, true));
    }
    function TSImportType(node) {
      const {
        qualifier,
        options
      } = node;
      this.word("import");
      this.tokenChar(40);
      this.print(node.argument);
      if (options) {
        this.tokenChar(44);
        this.print(options);
      }
      this.tokenChar(41);
      if (qualifier) {
        this.tokenChar(46);
        this.print(qualifier);
      }
      const typeArguments = node.typeParameters;
      if (typeArguments) {
        this.print(typeArguments);
      }
    }
    function TSImportEqualsDeclaration(node) {
      const {
        id,
        moduleReference
      } = node;
      if (node.isExport) {
        this.word("export");
        this.space();
      }
      this.word("import");
      this.space();
      this.print(id);
      this.space();
      this.tokenChar(61);
      this.space();
      this.print(moduleReference);
      this.semicolon();
    }
    function TSExternalModuleReference(node) {
      this.token("require(");
      this.print(node.expression);
      this.tokenChar(41);
    }
    function TSNonNullExpression(node) {
      this.print(node.expression);
      this.tokenChar(33);
      this.setLastChar(33);
    }
    function TSExportAssignment(node) {
      this.word("export");
      this.space();
      this.tokenChar(61);
      this.space();
      this.print(node.expression);
      this.semicolon();
    }
    function TSNamespaceExportDeclaration(node) {
      this.word("export");
      this.space();
      this.word("as");
      this.space();
      this.word("namespace");
      this.space();
      this.print(node.id);
      this.semicolon();
    }
    function tsPrintSignatureDeclarationBase(node) {
      const {
        typeParameters
      } = node;
      const parameters = node.parameters;
      this.print(typeParameters);
      this.tokenChar(40);
      _methods._parameters.call(this, parameters, 41);
      const returnType = node.typeAnnotation;
      this.print(returnType);
    }
    function _tsPrintClassMemberModifiers(node) {
      const isPrivateField = node.type === "ClassPrivateProperty";
      const isPublicField = node.type === "ClassAccessorProperty" || node.type === "ClassProperty";
      printModifiersList(this, node, [isPublicField && node.declare && "declare", !isPrivateField && node.accessibility]);
      if (node.static) {
        this.word("static");
        this.space();
      }
      printModifiersList(this, node, [!isPrivateField && node.abstract && "abstract", !isPrivateField && node.override && "override", (isPublicField || isPrivateField) && node.readonly && "readonly"]);
    }
    function printBraced(printer, node, cb) {
      printer.token("{");
      const oldNoLineTerminatorAfterNode = printer.enterDelimited();
      cb();
      printer._noLineTerminatorAfterNode = oldNoLineTerminatorAfterNode;
      printer.rightBrace(node);
    }
    function printModifiersList(printer, node, modifiers) {
      var _printer$tokenMap2;
      const modifiersSet = /* @__PURE__ */ new Set();
      for (const modifier of modifiers) {
        if (modifier) modifiersSet.add(modifier);
      }
      (_printer$tokenMap2 = printer.tokenMap) == null || _printer$tokenMap2.find(node, (tok) => {
        if (modifiersSet.has(tok.value)) {
          printer.token(tok.value);
          printer.space();
          modifiersSet.delete(tok.value);
          return modifiersSet.size === 0;
        }
        return false;
      });
      for (const modifier of modifiersSet) {
        printer.word(modifier);
        printer.space();
      }
    }
  }
});

// ../node_modules/@babel/generator/lib/generators/modules.js
var require_modules = __commonJS({
  "../node_modules/@babel/generator/lib/generators/modules.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ExportAllDeclaration = ExportAllDeclaration;
    exports.ExportDefaultDeclaration = ExportDefaultDeclaration;
    exports.ExportDefaultSpecifier = ExportDefaultSpecifier;
    exports.ExportNamedDeclaration = ExportNamedDeclaration;
    exports.ExportNamespaceSpecifier = ExportNamespaceSpecifier;
    exports.ExportSpecifier = ExportSpecifier;
    exports.ImportAttribute = ImportAttribute;
    exports.ImportDeclaration = ImportDeclaration;
    exports.ImportDefaultSpecifier = ImportDefaultSpecifier;
    exports.ImportExpression = ImportExpression;
    exports.ImportNamespaceSpecifier = ImportNamespaceSpecifier;
    exports.ImportSpecifier = ImportSpecifier;
    exports._printAttributes = _printAttributes;
    var _t = require_lib3();
    var _index = require_node();
    var _expressions = require_expressions();
    var {
      isClassDeclaration,
      isExportDefaultSpecifier,
      isExportNamespaceSpecifier,
      isImportDefaultSpecifier,
      isImportNamespaceSpecifier,
      isStatement
    } = _t;
    function ImportSpecifier(node) {
      if (node.importKind === "type" || node.importKind === "typeof") {
        this.word(node.importKind);
        this.space();
      }
      this.print(node.imported);
      if (node.local && node.local.name !== node.imported.name) {
        this.space();
        this.word("as");
        this.space();
        this.print(node.local);
      }
    }
    function ImportDefaultSpecifier(node) {
      this.print(node.local);
    }
    function ExportDefaultSpecifier(node) {
      this.print(node.exported);
    }
    function ExportSpecifier(node) {
      if (node.exportKind === "type") {
        this.word("type");
        this.space();
      }
      this.print(node.local);
      if (node.exported && node.local.name !== node.exported.name) {
        this.space();
        this.word("as");
        this.space();
        this.print(node.exported);
      }
    }
    function ExportNamespaceSpecifier(node) {
      this.tokenChar(42);
      this.space();
      this.word("as");
      this.space();
      this.print(node.exported);
    }
    var warningShown = false;
    function _printAttributes(node, hasPreviousBrace) {
      var _node$extra;
      const {
        attributes
      } = node;
      var {
        assertions
      } = node;
      const {
        importAttributesKeyword
      } = this.format;
      if (attributes && !importAttributesKeyword && node.extra && (node.extra.deprecatedAssertSyntax || node.extra.deprecatedWithLegacySyntax) && !warningShown) {
        warningShown = true;
        console.warn(`You are using import attributes, without specifying the desired output syntax.
Please specify the "importAttributesKeyword" generator option, whose value can be one of:
 - "with"        : \`import { a } from "b" with { type: "json" };\`
 - "assert"      : \`import { a } from "b" assert { type: "json" };\`
 - "with-legacy" : \`import { a } from "b" with type: "json";\`
`);
      }
      const useAssertKeyword = importAttributesKeyword === "assert" || !importAttributesKeyword && assertions;
      this.word(useAssertKeyword ? "assert" : "with");
      this.space();
      if (!useAssertKeyword && (importAttributesKeyword === "with-legacy" || !importAttributesKeyword && (_node$extra = node.extra) != null && _node$extra.deprecatedWithLegacySyntax)) {
        this.printList(attributes || assertions);
        return;
      }
      const occurrenceCount = hasPreviousBrace ? 1 : 0;
      this.token("{", void 0, occurrenceCount);
      this.space();
      this.printList(attributes || assertions, this.shouldPrintTrailingComma("}"));
      this.space();
      this.token("}", void 0, occurrenceCount);
    }
    function ExportAllDeclaration(node) {
      var _node$attributes, _node$assertions;
      this.word("export");
      this.space();
      if (node.exportKind === "type") {
        this.word("type");
        this.space();
      }
      this.tokenChar(42);
      this.space();
      this.word("from");
      this.space();
      if ((_node$attributes = node.attributes) != null && _node$attributes.length || (_node$assertions = node.assertions) != null && _node$assertions.length) {
        this.print(node.source, true);
        this.space();
        _printAttributes.call(this, node, false);
      } else {
        this.print(node.source);
      }
      this.semicolon();
    }
    function maybePrintDecoratorsBeforeExport(printer, node) {
      if (isClassDeclaration(node.declaration) && _expressions._shouldPrintDecoratorsBeforeExport.call(printer, node)) {
        printer.printJoin(node.declaration.decorators);
      }
    }
    function ExportNamedDeclaration(node) {
      maybePrintDecoratorsBeforeExport(this, node);
      this.word("export");
      this.space();
      if (node.declaration) {
        const declar = node.declaration;
        this.print(declar);
        if (!isStatement(declar)) this.semicolon();
      } else {
        if (node.exportKind === "type") {
          this.word("type");
          this.space();
        }
        const specifiers = node.specifiers.slice(0);
        let hasSpecial = false;
        for (; ; ) {
          const first = specifiers[0];
          if (isExportDefaultSpecifier(first) || isExportNamespaceSpecifier(first)) {
            hasSpecial = true;
            this.print(specifiers.shift());
            if (specifiers.length) {
              this.tokenChar(44);
              this.space();
            }
          } else {
            break;
          }
        }
        let hasBrace = false;
        if (specifiers.length || !specifiers.length && !hasSpecial) {
          hasBrace = true;
          this.tokenChar(123);
          if (specifiers.length) {
            this.space();
            this.printList(specifiers, this.shouldPrintTrailingComma("}"));
            this.space();
          }
          this.tokenChar(125);
        }
        if (node.source) {
          var _node$attributes2, _node$assertions2;
          this.space();
          this.word("from");
          this.space();
          if ((_node$attributes2 = node.attributes) != null && _node$attributes2.length || (_node$assertions2 = node.assertions) != null && _node$assertions2.length) {
            this.print(node.source, true);
            this.space();
            _printAttributes.call(this, node, hasBrace);
          } else {
            this.print(node.source);
          }
        }
        this.semicolon();
      }
    }
    function ExportDefaultDeclaration(node) {
      maybePrintDecoratorsBeforeExport(this, node);
      this.word("export");
      this.noIndentInnerCommentsHere();
      this.space();
      this.word("default");
      this.space();
      this.tokenContext |= _index.TokenContext.exportDefault;
      const declar = node.declaration;
      this.print(declar);
      if (!isStatement(declar)) this.semicolon();
    }
    function ImportDeclaration(node) {
      var _node$attributes3, _node$assertions3;
      this.word("import");
      this.space();
      const isTypeKind = node.importKind === "type" || node.importKind === "typeof";
      if (isTypeKind) {
        this.noIndentInnerCommentsHere();
        this.word(node.importKind);
        this.space();
      } else if (node.module) {
        this.noIndentInnerCommentsHere();
        this.word("module");
        this.space();
      } else if (node.phase) {
        this.noIndentInnerCommentsHere();
        this.word(node.phase);
        this.space();
      }
      const specifiers = node.specifiers.slice(0);
      const hasSpecifiers = !!specifiers.length;
      while (hasSpecifiers) {
        const first = specifiers[0];
        if (isImportDefaultSpecifier(first) || isImportNamespaceSpecifier(first)) {
          this.print(specifiers.shift());
          if (specifiers.length) {
            this.tokenChar(44);
            this.space();
          }
        } else {
          break;
        }
      }
      let hasBrace = false;
      if (specifiers.length) {
        hasBrace = true;
        this.tokenChar(123);
        this.space();
        this.printList(specifiers, this.shouldPrintTrailingComma("}"));
        this.space();
        this.tokenChar(125);
      } else if (isTypeKind && !hasSpecifiers) {
        hasBrace = true;
        this.tokenChar(123);
        this.tokenChar(125);
      }
      if (hasSpecifiers || isTypeKind) {
        this.space();
        this.word("from");
        this.space();
      }
      if ((_node$attributes3 = node.attributes) != null && _node$attributes3.length || (_node$assertions3 = node.assertions) != null && _node$assertions3.length) {
        this.print(node.source, true);
        this.space();
        _printAttributes.call(this, node, hasBrace);
      } else {
        this.print(node.source);
      }
      this.semicolon();
    }
    function ImportAttribute(node) {
      this.print(node.key);
      this.tokenChar(58);
      this.space();
      this.print(node.value);
    }
    function ImportNamespaceSpecifier(node) {
      this.tokenChar(42);
      this.space();
      this.word("as");
      this.space();
      this.print(node.local);
    }
    function ImportExpression(node) {
      this.word("import");
      if (node.phase) {
        this.tokenChar(46);
        this.word(node.phase);
      }
      this.tokenChar(40);
      const shouldPrintTrailingComma = this.shouldPrintTrailingComma(")");
      this.print(node.source);
      if (node.options != null) {
        this.tokenChar(44);
        this.space();
        this.print(node.options);
      }
      if (shouldPrintTrailingComma) {
        this.tokenChar(44);
      }
      this.rightParens(node);
    }
  }
});

// ../node_modules/jsesc/jsesc.js
var require_jsesc = __commonJS({
  "../node_modules/jsesc/jsesc.js"(exports, module) {
    "use strict";
    var object = {};
    var hasOwnProperty2 = object.hasOwnProperty;
    var forOwn = (object2, callback) => {
      for (const key in object2) {
        if (hasOwnProperty2.call(object2, key)) {
          callback(key, object2[key]);
        }
      }
    };
    var extend = (destination, source) => {
      if (!source) {
        return destination;
      }
      forOwn(source, (key, value) => {
        destination[key] = value;
      });
      return destination;
    };
    var forEach = (array, callback) => {
      const length = array.length;
      let index = -1;
      while (++index < length) {
        callback(array[index]);
      }
    };
    var fourHexEscape = (hex) => {
      return "\\u" + ("0000" + hex).slice(-4);
    };
    var hexadecimal = (code, lowercase) => {
      let hexadecimal2 = code.toString(16);
      if (lowercase) return hexadecimal2;
      return hexadecimal2.toUpperCase();
    };
    var toString = object.toString;
    var isArray = Array.isArray;
    var isBuffer = (value) => {
      return typeof Buffer === "function" && Buffer.isBuffer(value);
    };
    var isObject = (value) => {
      return toString.call(value) == "[object Object]";
    };
    var isString = (value) => {
      return typeof value == "string" || toString.call(value) == "[object String]";
    };
    var isNumber = (value) => {
      return typeof value == "number" || toString.call(value) == "[object Number]";
    };
    var isBigInt = (value) => {
      return typeof value == "bigint";
    };
    var isFunction = (value) => {
      return typeof value == "function";
    };
    var isMap = (value) => {
      return toString.call(value) == "[object Map]";
    };
    var isSet = (value) => {
      return toString.call(value) == "[object Set]";
    };
    var singleEscapes = {
      "\\": "\\\\",
      "\b": "\\b",
      "\f": "\\f",
      "\n": "\\n",
      "\r": "\\r",
      "	": "\\t"
      // `\v` is omitted intentionally, because in IE < 9, '\v' == 'v'.
      // '\v': '\\x0B'
    };
    var regexSingleEscape = /[\\\b\f\n\r\t]/;
    var regexDigit = /[0-9]/;
    var regexWhitespace = /[\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;
    var escapeEverythingRegex = /([\uD800-\uDBFF][\uDC00-\uDFFF])|([\uD800-\uDFFF])|(['"`])|[^]/g;
    var escapeNonAsciiRegex = /([\uD800-\uDBFF][\uDC00-\uDFFF])|([\uD800-\uDFFF])|(['"`])|[^ !#-&\(-\[\]-_a-~]/g;
    var jsesc = (argument, options) => {
      const increaseIndentation = () => {
        oldIndent = indent;
        ++options.indentLevel;
        indent = options.indent.repeat(options.indentLevel);
      };
      const defaults = {
        "escapeEverything": false,
        "minimal": false,
        "isScriptContext": false,
        "quotes": "single",
        "wrap": false,
        "es6": false,
        "json": false,
        "compact": true,
        "lowercaseHex": false,
        "numbers": "decimal",
        "indent": "	",
        "indentLevel": 0,
        "__inline1__": false,
        "__inline2__": false
      };
      const json = options && options.json;
      if (json) {
        defaults.quotes = "double";
        defaults.wrap = true;
      }
      options = extend(defaults, options);
      if (options.quotes != "single" && options.quotes != "double" && options.quotes != "backtick") {
        options.quotes = "single";
      }
      const quote = options.quotes == "double" ? '"' : options.quotes == "backtick" ? "`" : "'";
      const compact = options.compact;
      const lowercaseHex = options.lowercaseHex;
      let indent = options.indent.repeat(options.indentLevel);
      let oldIndent = "";
      const inline1 = options.__inline1__;
      const inline2 = options.__inline2__;
      const newLine = compact ? "" : "\n";
      let result;
      let isEmpty = true;
      const useBinNumbers = options.numbers == "binary";
      const useOctNumbers = options.numbers == "octal";
      const useDecNumbers = options.numbers == "decimal";
      const useHexNumbers = options.numbers == "hexadecimal";
      if (json && argument && isFunction(argument.toJSON)) {
        argument = argument.toJSON();
      }
      if (!isString(argument)) {
        if (isMap(argument)) {
          if (argument.size == 0) {
            return "new Map()";
          }
          if (!compact) {
            options.__inline1__ = true;
            options.__inline2__ = false;
          }
          return "new Map(" + jsesc(Array.from(argument), options) + ")";
        }
        if (isSet(argument)) {
          if (argument.size == 0) {
            return "new Set()";
          }
          return "new Set(" + jsesc(Array.from(argument), options) + ")";
        }
        if (isBuffer(argument)) {
          if (argument.length == 0) {
            return "Buffer.from([])";
          }
          return "Buffer.from(" + jsesc(Array.from(argument), options) + ")";
        }
        if (isArray(argument)) {
          result = [];
          options.wrap = true;
          if (inline1) {
            options.__inline1__ = false;
            options.__inline2__ = true;
          }
          if (!inline2) {
            increaseIndentation();
          }
          forEach(argument, (value) => {
            isEmpty = false;
            if (inline2) {
              options.__inline2__ = false;
            }
            result.push(
              (compact || inline2 ? "" : indent) + jsesc(value, options)
            );
          });
          if (isEmpty) {
            return "[]";
          }
          if (inline2) {
            return "[" + result.join(", ") + "]";
          }
          return "[" + newLine + result.join("," + newLine) + newLine + (compact ? "" : oldIndent) + "]";
        } else if (isNumber(argument) || isBigInt(argument)) {
          if (json) {
            return JSON.stringify(Number(argument));
          }
          let result2;
          if (useDecNumbers) {
            result2 = String(argument);
          } else if (useHexNumbers) {
            let hexadecimal2 = argument.toString(16);
            if (!lowercaseHex) {
              hexadecimal2 = hexadecimal2.toUpperCase();
            }
            result2 = "0x" + hexadecimal2;
          } else if (useBinNumbers) {
            result2 = "0b" + argument.toString(2);
          } else if (useOctNumbers) {
            result2 = "0o" + argument.toString(8);
          }
          if (isBigInt(argument)) {
            return result2 + "n";
          }
          return result2;
        } else if (isBigInt(argument)) {
          if (json) {
            return JSON.stringify(Number(argument));
          }
          return argument + "n";
        } else if (!isObject(argument)) {
          if (json) {
            return JSON.stringify(argument) || "null";
          }
          return String(argument);
        } else {
          result = [];
          options.wrap = true;
          increaseIndentation();
          forOwn(argument, (key, value) => {
            isEmpty = false;
            result.push(
              (compact ? "" : indent) + jsesc(key, options) + ":" + (compact ? "" : " ") + jsesc(value, options)
            );
          });
          if (isEmpty) {
            return "{}";
          }
          return "{" + newLine + result.join("," + newLine) + newLine + (compact ? "" : oldIndent) + "}";
        }
      }
      const regex = options.escapeEverything ? escapeEverythingRegex : escapeNonAsciiRegex;
      result = argument.replace(regex, (char, pair, lone, quoteChar, index, string) => {
        if (pair) {
          if (options.minimal) return pair;
          const first = pair.charCodeAt(0);
          const second = pair.charCodeAt(1);
          if (options.es6) {
            const codePoint = (first - 55296) * 1024 + second - 56320 + 65536;
            const hex2 = hexadecimal(codePoint, lowercaseHex);
            return "\\u{" + hex2 + "}";
          }
          return fourHexEscape(hexadecimal(first, lowercaseHex)) + fourHexEscape(hexadecimal(second, lowercaseHex));
        }
        if (lone) {
          return fourHexEscape(hexadecimal(lone.charCodeAt(0), lowercaseHex));
        }
        if (char == "\0" && !json && !regexDigit.test(string.charAt(index + 1))) {
          return "\\0";
        }
        if (quoteChar) {
          if (quoteChar == quote || options.escapeEverything) {
            return "\\" + quoteChar;
          }
          return quoteChar;
        }
        if (regexSingleEscape.test(char)) {
          return singleEscapes[char];
        }
        if (options.minimal && !regexWhitespace.test(char)) {
          return char;
        }
        const hex = hexadecimal(char.charCodeAt(0), lowercaseHex);
        if (json || hex.length > 2) {
          return fourHexEscape(hex);
        }
        return "\\x" + ("00" + hex).slice(-2);
      });
      if (quote == "`") {
        result = result.replace(/\$\{/g, "\\${");
      }
      if (options.isScriptContext) {
        result = result.replace(/<\/(script|style)/gi, "<\\/$1").replace(/<!--/g, json ? "\\u003C!--" : "\\x3C!--");
      }
      if (options.wrap) {
        result = quote + result + quote;
      }
      return result;
    };
    jsesc.version = "3.0.2";
    module.exports = jsesc;
  }
});

// ../node_modules/@babel/generator/lib/generators/types.js
var require_types = __commonJS({
  "../node_modules/@babel/generator/lib/generators/types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ArgumentPlaceholder = ArgumentPlaceholder;
    exports.ArrayPattern = exports.ArrayExpression = ArrayExpression;
    exports.BigIntLiteral = BigIntLiteral;
    exports.BooleanLiteral = BooleanLiteral;
    exports.Identifier = Identifier;
    exports.NullLiteral = NullLiteral;
    exports.NumericLiteral = NumericLiteral;
    exports.ObjectPattern = exports.ObjectExpression = ObjectExpression;
    exports.ObjectMethod = ObjectMethod;
    exports.ObjectProperty = ObjectProperty;
    exports.PipelineBareFunction = PipelineBareFunction;
    exports.PipelinePrimaryTopicReference = PipelinePrimaryTopicReference;
    exports.PipelineTopicExpression = PipelineTopicExpression;
    exports.RegExpLiteral = RegExpLiteral;
    exports.SpreadElement = exports.RestElement = RestElement;
    exports.StringLiteral = StringLiteral;
    exports.TopicReference = TopicReference;
    exports.VoidPattern = VoidPattern;
    exports._getRawIdentifier = _getRawIdentifier;
    var _t = require_lib3();
    var _jsesc = require_jsesc();
    var _methods = require_methods();
    var {
      isAssignmentPattern,
      isIdentifier
    } = _t;
    var lastRawIdentResult = "";
    function _getRawIdentifier(node) {
      const {
        name
      } = node;
      const token = this.tokenMap.find(node, (tok) => tok.value === name);
      if (token) {
        lastRawIdentResult = this._originalCode.slice(token.start, token.end);
        return lastRawIdentResult;
      }
      return lastRawIdentResult = node.name;
    }
    function Identifier(node) {
      if (this._buf._map) {
        var _node$loc;
        this.sourceIdentifierName(((_node$loc = node.loc) == null ? void 0 : _node$loc.identifierName) || node.name);
      }
      this.word(this.tokenMap ? lastRawIdentResult : node.name);
    }
    function ArgumentPlaceholder() {
      this.tokenChar(63);
    }
    function RestElement(node) {
      this.token("...");
      this.print(node.argument);
    }
    function ObjectExpression(node) {
      const props = node.properties;
      this.tokenChar(123);
      if (props.length) {
        const oldNoLineTerminatorAfterNode = this.enterDelimited();
        this.space();
        this.printList(props, this.shouldPrintTrailingComma("}"), true, true, void 0, true);
        this.space();
        this._noLineTerminatorAfterNode = oldNoLineTerminatorAfterNode;
      }
      this.rightBrace(node);
    }
    function ObjectMethod(node) {
      this.printJoin(node.decorators);
      _methods._methodHead.call(this, node);
      this.space();
      this.print(node.body);
    }
    function ObjectProperty(node) {
      this.printJoin(node.decorators);
      if (node.computed) {
        this.tokenChar(91);
        this.print(node.key);
        this.tokenChar(93);
      } else {
        if (isAssignmentPattern(node.value) && isIdentifier(node.key) && node.key.name === node.value.left.name) {
          this.print(node.value);
          return;
        }
        this.print(node.key);
        if (node.shorthand && isIdentifier(node.key) && isIdentifier(node.value) && node.key.name === node.value.name) {
          return;
        }
      }
      this.tokenChar(58);
      this.space();
      this.print(node.value);
    }
    function ArrayExpression(node) {
      const elems = node.elements;
      const len = elems.length;
      this.tokenChar(91);
      const oldNoLineTerminatorAfterNode = this.enterDelimited();
      for (let i = 0; i < elems.length; i++) {
        const elem = elems[i];
        if (elem) {
          if (i > 0) this.space();
          this.print(elem, void 0, true);
          if (i < len - 1 || this.shouldPrintTrailingComma("]")) {
            this.tokenChar(44, i);
          }
        } else {
          this.tokenChar(44, i);
        }
      }
      this._noLineTerminatorAfterNode = oldNoLineTerminatorAfterNode;
      this.tokenChar(93);
    }
    function RegExpLiteral(node) {
      this.word(`/${node.pattern}/${node.flags}`, false);
    }
    function BooleanLiteral(node) {
      this.word(node.value ? "true" : "false");
    }
    function NullLiteral() {
      this.word("null");
    }
    function NumericLiteral(node) {
      const raw = this.getPossibleRaw(node);
      const opts = this.format.jsescOption;
      const value = node.value;
      const str = value + "";
      if (opts.numbers) {
        this.number(_jsesc(value, opts), value);
      } else if (raw == null) {
        this.number(str, value);
      } else if (this.format.minified) {
        this.number(raw.length < str.length ? raw : str, value);
      } else {
        this.number(raw, value);
      }
    }
    function StringLiteral(node) {
      const raw = this.getPossibleRaw(node);
      if (!this.format.minified && raw !== void 0) {
        this.token(raw);
        return;
      }
      const val = _jsesc(node.value, this.format.jsescOption);
      this.token(val);
    }
    function BigIntLiteral(node) {
      const raw = this.getPossibleRaw(node);
      if (!this.format.minified && raw !== void 0) {
        this.word(raw);
        return;
      }
      this.word(node.value + "n");
    }
    var validTopicTokenSet = /* @__PURE__ */ new Set(["^^", "@@", "^", "%", "#"]);
    function TopicReference() {
      const {
        topicToken
      } = this.format;
      if (validTopicTokenSet.has(topicToken)) {
        this.token(topicToken);
      } else {
        const givenTopicTokenJSON = JSON.stringify(topicToken);
        const validTopics = Array.from(validTopicTokenSet, (v) => JSON.stringify(v));
        throw new Error(`The "topicToken" generator option must be one of ${validTopics.join(", ")} (${givenTopicTokenJSON} received instead).`);
      }
    }
    function PipelineTopicExpression(node) {
      this.print(node.expression);
    }
    function PipelineBareFunction(node) {
      this.print(node.callee);
    }
    function PipelinePrimaryTopicReference() {
      this.tokenChar(35);
    }
    function VoidPattern() {
      this.word("void");
    }
  }
});

// ../node_modules/@babel/generator/lib/generators/flow.js
var require_flow2 = __commonJS({
  "../node_modules/@babel/generator/lib/generators/flow.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.AnyTypeAnnotation = AnyTypeAnnotation;
    exports.ArrayTypeAnnotation = ArrayTypeAnnotation;
    exports.BooleanLiteralTypeAnnotation = BooleanLiteralTypeAnnotation;
    exports.BooleanTypeAnnotation = BooleanTypeAnnotation;
    exports.DeclareClass = DeclareClass;
    exports.DeclareExportAllDeclaration = DeclareExportAllDeclaration;
    exports.DeclareExportDeclaration = DeclareExportDeclaration;
    exports.DeclareFunction = DeclareFunction;
    exports.DeclareInterface = DeclareInterface;
    exports.DeclareModule = DeclareModule;
    exports.DeclareModuleExports = DeclareModuleExports;
    exports.DeclareOpaqueType = DeclareOpaqueType;
    exports.DeclareTypeAlias = DeclareTypeAlias;
    exports.DeclareVariable = DeclareVariable;
    exports.DeclaredPredicate = DeclaredPredicate;
    exports.EmptyTypeAnnotation = EmptyTypeAnnotation;
    exports.EnumBooleanBody = EnumBooleanBody;
    exports.EnumBooleanMember = EnumBooleanMember;
    exports.EnumDeclaration = EnumDeclaration;
    exports.EnumDefaultedMember = EnumDefaultedMember;
    exports.EnumNumberBody = EnumNumberBody;
    exports.EnumNumberMember = EnumNumberMember;
    exports.EnumStringBody = EnumStringBody;
    exports.EnumStringMember = EnumStringMember;
    exports.EnumSymbolBody = EnumSymbolBody;
    exports.ExistsTypeAnnotation = ExistsTypeAnnotation;
    exports.FunctionTypeAnnotation = FunctionTypeAnnotation;
    exports.FunctionTypeParam = FunctionTypeParam;
    exports.IndexedAccessType = IndexedAccessType;
    exports.InferredPredicate = InferredPredicate;
    exports.InterfaceDeclaration = InterfaceDeclaration;
    exports.GenericTypeAnnotation = exports.ClassImplements = exports.InterfaceExtends = InterfaceExtends;
    exports.InterfaceTypeAnnotation = InterfaceTypeAnnotation;
    exports.IntersectionTypeAnnotation = IntersectionTypeAnnotation;
    exports.MixedTypeAnnotation = MixedTypeAnnotation;
    exports.NullLiteralTypeAnnotation = NullLiteralTypeAnnotation;
    exports.NullableTypeAnnotation = NullableTypeAnnotation;
    Object.defineProperty(exports, "NumberLiteralTypeAnnotation", {
      enumerable: true,
      get: function() {
        return _types2.NumericLiteral;
      }
    });
    exports.NumberTypeAnnotation = NumberTypeAnnotation;
    exports.ObjectTypeAnnotation = ObjectTypeAnnotation;
    exports.ObjectTypeCallProperty = ObjectTypeCallProperty;
    exports.ObjectTypeIndexer = ObjectTypeIndexer;
    exports.ObjectTypeInternalSlot = ObjectTypeInternalSlot;
    exports.ObjectTypeProperty = ObjectTypeProperty;
    exports.ObjectTypeSpreadProperty = ObjectTypeSpreadProperty;
    exports.OpaqueType = OpaqueType;
    exports.OptionalIndexedAccessType = OptionalIndexedAccessType;
    exports.QualifiedTypeIdentifier = QualifiedTypeIdentifier;
    Object.defineProperty(exports, "StringLiteralTypeAnnotation", {
      enumerable: true,
      get: function() {
        return _types2.StringLiteral;
      }
    });
    exports.StringTypeAnnotation = StringTypeAnnotation;
    exports.SymbolTypeAnnotation = SymbolTypeAnnotation;
    exports.ThisTypeAnnotation = ThisTypeAnnotation;
    exports.TupleTypeAnnotation = TupleTypeAnnotation;
    exports.TypeAlias = TypeAlias;
    exports.TypeAnnotation = TypeAnnotation;
    exports.TypeCastExpression = TypeCastExpression;
    exports.TypeParameter = TypeParameter;
    exports.TypeParameterDeclaration = exports.TypeParameterInstantiation = TypeParameterInstantiation;
    exports.TypeofTypeAnnotation = TypeofTypeAnnotation;
    exports.UnionTypeAnnotation = UnionTypeAnnotation;
    exports.Variance = Variance;
    exports.VoidTypeAnnotation = VoidTypeAnnotation;
    exports._interfaceish = _interfaceish;
    exports._variance = _variance;
    var _t = require_lib3();
    var _modules = require_modules();
    var _index = require_node();
    var _types2 = require_types();
    var {
      isDeclareExportDeclaration,
      isStatement
    } = _t;
    function AnyTypeAnnotation() {
      this.word("any");
    }
    function ArrayTypeAnnotation(node) {
      this.print(node.elementType, true);
      this.tokenChar(91);
      this.tokenChar(93);
    }
    function BooleanTypeAnnotation() {
      this.word("boolean");
    }
    function BooleanLiteralTypeAnnotation(node) {
      this.word(node.value ? "true" : "false");
    }
    function NullLiteralTypeAnnotation() {
      this.word("null");
    }
    function DeclareClass(node, parent) {
      if (!isDeclareExportDeclaration(parent)) {
        this.word("declare");
        this.space();
      }
      this.word("class");
      this.space();
      _interfaceish.call(this, node);
    }
    function DeclareFunction(node, parent) {
      if (!isDeclareExportDeclaration(parent)) {
        this.word("declare");
        this.space();
      }
      this.word("function");
      this.space();
      this.print(node.id);
      this.print(node.id.typeAnnotation.typeAnnotation);
      if (node.predicate) {
        this.space();
        this.print(node.predicate);
      }
      this.semicolon();
    }
    function InferredPredicate() {
      this.tokenChar(37);
      this.word("checks");
    }
    function DeclaredPredicate(node) {
      this.tokenChar(37);
      this.word("checks");
      this.tokenChar(40);
      this.print(node.value);
      this.tokenChar(41);
    }
    function DeclareInterface(node) {
      this.word("declare");
      this.space();
      InterfaceDeclaration.call(this, node);
    }
    function DeclareModule(node) {
      this.word("declare");
      this.space();
      this.word("module");
      this.space();
      this.print(node.id);
      this.space();
      this.print(node.body);
    }
    function DeclareModuleExports(node) {
      this.word("declare");
      this.space();
      this.word("module");
      this.tokenChar(46);
      this.word("exports");
      this.print(node.typeAnnotation);
    }
    function DeclareTypeAlias(node) {
      this.word("declare");
      this.space();
      TypeAlias.call(this, node);
    }
    function DeclareOpaqueType(node, parent) {
      if (!isDeclareExportDeclaration(parent)) {
        this.word("declare");
        this.space();
      }
      OpaqueType.call(this, node);
    }
    function DeclareVariable(node, parent) {
      if (!isDeclareExportDeclaration(parent)) {
        this.word("declare");
        this.space();
      }
      this.word("var");
      this.space();
      this.print(node.id);
      this.print(node.id.typeAnnotation);
      this.semicolon();
    }
    function DeclareExportDeclaration(node) {
      this.word("declare");
      this.space();
      this.word("export");
      this.space();
      if (node.default) {
        this.word("default");
        this.space();
      }
      FlowExportDeclaration.call(this, node);
    }
    function DeclareExportAllDeclaration(node) {
      this.word("declare");
      this.space();
      _modules.ExportAllDeclaration.call(this, node);
    }
    function EnumDeclaration(node) {
      const {
        id,
        body
      } = node;
      this.word("enum");
      this.space();
      this.print(id);
      this.print(body);
    }
    function enumExplicitType(context, name, hasExplicitType) {
      if (hasExplicitType) {
        context.space();
        context.word("of");
        context.space();
        context.word(name);
      }
      context.space();
    }
    function enumBody(context, node) {
      const {
        members
      } = node;
      context.token("{");
      context.indent();
      context.newline();
      for (const member of members) {
        context.print(member);
        context.newline();
      }
      if (node.hasUnknownMembers) {
        context.token("...");
        context.newline();
      }
      context.dedent();
      context.token("}");
    }
    function EnumBooleanBody(node) {
      const {
        explicitType
      } = node;
      enumExplicitType(this, "boolean", explicitType);
      enumBody(this, node);
    }
    function EnumNumberBody(node) {
      const {
        explicitType
      } = node;
      enumExplicitType(this, "number", explicitType);
      enumBody(this, node);
    }
    function EnumStringBody(node) {
      const {
        explicitType
      } = node;
      enumExplicitType(this, "string", explicitType);
      enumBody(this, node);
    }
    function EnumSymbolBody(node) {
      enumExplicitType(this, "symbol", true);
      enumBody(this, node);
    }
    function EnumDefaultedMember(node) {
      const {
        id
      } = node;
      this.print(id);
      this.tokenChar(44);
    }
    function enumInitializedMember(context, node) {
      context.print(node.id);
      context.space();
      context.token("=");
      context.space();
      context.print(node.init);
      context.token(",");
    }
    function EnumBooleanMember(node) {
      enumInitializedMember(this, node);
    }
    function EnumNumberMember(node) {
      enumInitializedMember(this, node);
    }
    function EnumStringMember(node) {
      enumInitializedMember(this, node);
    }
    function FlowExportDeclaration(node) {
      if (node.declaration) {
        const declar = node.declaration;
        this.print(declar);
        if (!isStatement(declar)) this.semicolon();
      } else {
        this.tokenChar(123);
        if (node.specifiers.length) {
          this.space();
          this.printList(node.specifiers);
          this.space();
        }
        this.tokenChar(125);
        if (node.source) {
          this.space();
          this.word("from");
          this.space();
          this.print(node.source);
        }
        this.semicolon();
      }
    }
    function ExistsTypeAnnotation() {
      this.tokenChar(42);
    }
    function FunctionTypeAnnotation(node, parent) {
      this.print(node.typeParameters);
      this.tokenChar(40);
      if (node.this) {
        this.word("this");
        this.tokenChar(58);
        this.space();
        this.print(node.this.typeAnnotation);
        if (node.params.length || node.rest) {
          this.tokenChar(44);
          this.space();
        }
      }
      this.printList(node.params);
      if (node.rest) {
        if (node.params.length) {
          this.tokenChar(44);
          this.space();
        }
        this.token("...");
        this.print(node.rest);
      }
      this.tokenChar(41);
      const type = parent == null ? void 0 : parent.type;
      if (type != null && (type === "ObjectTypeCallProperty" || type === "ObjectTypeInternalSlot" || type === "DeclareFunction" || type === "ObjectTypeProperty" && parent.method)) {
        this.tokenChar(58);
      } else {
        this.space();
        this.token("=>");
      }
      this.space();
      this.print(node.returnType);
    }
    function FunctionTypeParam(node) {
      this.print(node.name);
      if (node.optional) this.tokenChar(63);
      if (node.name) {
        this.tokenChar(58);
        this.space();
      }
      this.print(node.typeAnnotation);
    }
    function InterfaceExtends(node) {
      this.print(node.id);
      this.print(node.typeParameters, true);
    }
    function _interfaceish(node) {
      var _node$extends;
      this.print(node.id);
      this.print(node.typeParameters);
      if ((_node$extends = node.extends) != null && _node$extends.length) {
        this.space();
        this.word("extends");
        this.space();
        this.printList(node.extends);
      }
      if (node.type === "DeclareClass") {
        var _node$mixins, _node$implements;
        if ((_node$mixins = node.mixins) != null && _node$mixins.length) {
          this.space();
          this.word("mixins");
          this.space();
          this.printList(node.mixins);
        }
        if ((_node$implements = node.implements) != null && _node$implements.length) {
          this.space();
          this.word("implements");
          this.space();
          this.printList(node.implements);
        }
      }
      this.space();
      this.print(node.body);
    }
    function _variance(node) {
      var _node$variance;
      const kind = (_node$variance = node.variance) == null ? void 0 : _node$variance.kind;
      if (kind != null) {
        if (kind === "plus") {
          this.tokenChar(43);
        } else if (kind === "minus") {
          this.tokenChar(45);
        }
      }
    }
    function InterfaceDeclaration(node) {
      this.word("interface");
      this.space();
      _interfaceish.call(this, node);
    }
    function andSeparator(occurrenceCount) {
      this.space();
      this.token("&", false, occurrenceCount);
      this.space();
    }
    function InterfaceTypeAnnotation(node) {
      var _node$extends2;
      this.word("interface");
      if ((_node$extends2 = node.extends) != null && _node$extends2.length) {
        this.space();
        this.word("extends");
        this.space();
        this.printList(node.extends);
      }
      this.space();
      this.print(node.body);
    }
    function IntersectionTypeAnnotation(node) {
      this.printJoin(node.types, void 0, void 0, andSeparator);
    }
    function MixedTypeAnnotation() {
      this.word("mixed");
    }
    function EmptyTypeAnnotation() {
      this.word("empty");
    }
    function NullableTypeAnnotation(node) {
      this.tokenChar(63);
      this.print(node.typeAnnotation);
    }
    function NumberTypeAnnotation() {
      this.word("number");
    }
    function StringTypeAnnotation() {
      this.word("string");
    }
    function ThisTypeAnnotation() {
      this.word("this");
    }
    function TupleTypeAnnotation(node) {
      this.tokenChar(91);
      this.printList(node.types);
      this.tokenChar(93);
    }
    function TypeofTypeAnnotation(node) {
      this.word("typeof");
      this.space();
      this.print(node.argument);
    }
    function TypeAlias(node) {
      this.word("type");
      this.space();
      this.print(node.id);
      this.print(node.typeParameters);
      this.space();
      this.tokenChar(61);
      this.space();
      this.print(node.right);
      this.semicolon();
    }
    function TypeAnnotation(node, parent) {
      this.tokenChar(58);
      this.space();
      if (parent.type === "ArrowFunctionExpression") {
        this.tokenContext |= _index.TokenContext.arrowFlowReturnType;
      } else if (node.optional) {
        this.tokenChar(63);
      }
      this.print(node.typeAnnotation);
    }
    function TypeParameterInstantiation(node) {
      this.tokenChar(60);
      this.printList(node.params);
      this.tokenChar(62);
    }
    function TypeParameter(node) {
      _variance.call(this, node);
      this.word(node.name);
      if (node.bound) {
        this.print(node.bound);
      }
      if (node.default) {
        this.space();
        this.tokenChar(61);
        this.space();
        this.print(node.default);
      }
    }
    function OpaqueType(node) {
      this.word("opaque");
      this.space();
      this.word("type");
      this.space();
      this.print(node.id);
      this.print(node.typeParameters);
      if (node.supertype) {
        this.tokenChar(58);
        this.space();
        this.print(node.supertype);
      }
      if (node.impltype) {
        this.space();
        this.tokenChar(61);
        this.space();
        this.print(node.impltype);
      }
      this.semicolon();
    }
    function ObjectTypeAnnotation(node) {
      if (node.exact) {
        this.token("{|");
      } else {
        this.tokenChar(123);
      }
      const props = [...node.properties, ...node.callProperties || [], ...node.indexers || [], ...node.internalSlots || []];
      if (props.length) {
        this.newline();
        this.space();
        this.printJoin(props, true, true, () => {
          if (props.length !== 1 || node.inexact) {
            this.tokenChar(44);
            this.space();
          }
        }, true);
        this.space();
      }
      if (node.inexact) {
        this.indent();
        this.token("...");
        if (props.length) {
          this.newline();
        }
        this.dedent();
      }
      if (node.exact) {
        this.token("|}");
      } else {
        this.tokenChar(125);
      }
    }
    function ObjectTypeInternalSlot(node) {
      if (node.static) {
        this.word("static");
        this.space();
      }
      this.tokenChar(91);
      this.tokenChar(91);
      this.print(node.id);
      this.tokenChar(93);
      this.tokenChar(93);
      if (node.optional) this.tokenChar(63);
      if (!node.method) {
        this.tokenChar(58);
        this.space();
      }
      this.print(node.value);
    }
    function ObjectTypeCallProperty(node) {
      if (node.static) {
        this.word("static");
        this.space();
      }
      this.print(node.value);
    }
    function ObjectTypeIndexer(node) {
      if (node.static) {
        this.word("static");
        this.space();
      }
      _variance.call(this, node);
      this.tokenChar(91);
      if (node.id) {
        this.print(node.id);
        this.tokenChar(58);
        this.space();
      }
      this.print(node.key);
      this.tokenChar(93);
      this.tokenChar(58);
      this.space();
      this.print(node.value);
    }
    function ObjectTypeProperty(node) {
      if (node.proto) {
        this.word("proto");
        this.space();
      }
      if (node.static) {
        this.word("static");
        this.space();
      }
      if (node.kind === "get" || node.kind === "set") {
        this.word(node.kind);
        this.space();
      }
      _variance.call(this, node);
      this.print(node.key);
      if (node.optional) this.tokenChar(63);
      if (!node.method) {
        this.tokenChar(58);
        this.space();
      }
      this.print(node.value);
    }
    function ObjectTypeSpreadProperty(node) {
      this.token("...");
      this.print(node.argument);
    }
    function QualifiedTypeIdentifier(node) {
      this.print(node.qualification);
      this.tokenChar(46);
      this.print(node.id);
    }
    function SymbolTypeAnnotation() {
      this.word("symbol");
    }
    function orSeparator(occurrenceCount) {
      this.space();
      this.token("|", false, occurrenceCount);
      this.space();
    }
    function UnionTypeAnnotation(node) {
      this.printJoin(node.types, void 0, void 0, orSeparator);
    }
    function TypeCastExpression(node) {
      this.tokenChar(40);
      this.print(node.expression);
      this.print(node.typeAnnotation);
      this.tokenChar(41);
    }
    function Variance(node) {
      if (node.kind === "plus") {
        this.tokenChar(43);
      } else {
        this.tokenChar(45);
      }
    }
    function VoidTypeAnnotation() {
      this.word("void");
    }
    function IndexedAccessType(node) {
      this.print(node.objectType, true);
      this.tokenChar(91);
      this.print(node.indexType);
      this.tokenChar(93);
    }
    function OptionalIndexedAccessType(node) {
      this.print(node.objectType);
      if (node.optional) {
        this.token("?.");
      }
      this.tokenChar(91);
      this.print(node.indexType);
      this.tokenChar(93);
    }
  }
});

// ../node_modules/@babel/generator/lib/generators/classes.js
var require_classes = __commonJS({
  "../node_modules/@babel/generator/lib/generators/classes.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ClassAccessorProperty = ClassAccessorProperty;
    exports.ClassBody = ClassBody;
    exports.ClassExpression = exports.ClassDeclaration = ClassDeclaration;
    exports.ClassMethod = ClassMethod;
    exports.ClassPrivateMethod = ClassPrivateMethod;
    exports.ClassPrivateProperty = ClassPrivateProperty;
    exports.ClassProperty = ClassProperty;
    exports.StaticBlock = StaticBlock;
    exports._classMethodHead = _classMethodHead;
    var _t = require_lib3();
    var _expressions = require_expressions();
    var _typescript = require_typescript2();
    var _flow = require_flow2();
    var _methods = require_methods();
    var {
      isExportDefaultDeclaration,
      isExportNamedDeclaration
    } = _t;
    function ClassDeclaration(node, parent) {
      const inExport = isExportDefaultDeclaration(parent) || isExportNamedDeclaration(parent);
      if (!inExport || !_expressions._shouldPrintDecoratorsBeforeExport.call(this, parent)) {
        this.printJoin(node.decorators);
      }
      if (node.declare) {
        this.word("declare");
        this.space();
      }
      if (node.abstract) {
        this.word("abstract");
        this.space();
      }
      this.word("class");
      if (node.id) {
        this.space();
        this.print(node.id);
      }
      this.print(node.typeParameters);
      if (node.superClass) {
        this.space();
        this.word("extends");
        this.space();
        this.print(node.superClass);
        this.print(node.superTypeParameters);
      }
      if (node.implements) {
        this.space();
        this.word("implements");
        this.space();
        this.printList(node.implements);
      }
      this.space();
      this.print(node.body);
    }
    function ClassBody(node) {
      this.tokenChar(123);
      if (node.body.length === 0) {
        this.tokenChar(125);
      } else {
        const separator = classBodyEmptySemicolonsPrinter(this, node);
        separator == null || separator(-1);
        const oldNoLineTerminatorAfterNode = this.enterDelimited();
        this.printJoin(node.body, true, true, separator, true, true);
        this._noLineTerminatorAfterNode = oldNoLineTerminatorAfterNode;
        if (!this.endsWith(10)) this.newline();
        this.rightBrace(node);
      }
    }
    function classBodyEmptySemicolonsPrinter(printer, node) {
      if (!printer.tokenMap || node.start == null || node.end == null) {
        return null;
      }
      const indexes = printer.tokenMap.getIndexes(node);
      if (!indexes) return null;
      let k = 1;
      let occurrenceCount = 0;
      let nextLocIndex = 0;
      const advanceNextLocIndex = () => {
        while (nextLocIndex < node.body.length && node.body[nextLocIndex].start == null) {
          nextLocIndex++;
        }
      };
      advanceNextLocIndex();
      return (i) => {
        if (nextLocIndex <= i) {
          nextLocIndex = i + 1;
          advanceNextLocIndex();
        }
        const end = nextLocIndex === node.body.length ? node.end : node.body[nextLocIndex].start;
        let tok;
        while (k < indexes.length && printer.tokenMap.matchesOriginal(tok = printer._tokens[indexes[k]], ";") && tok.start < end) {
          printer.tokenChar(59, occurrenceCount++);
          k++;
        }
      };
    }
    function ClassProperty(node) {
      this.printJoin(node.decorators);
      if (!node.static && !this.format.preserveFormat) {
        var _node$key$loc;
        const endLine = (_node$key$loc = node.key.loc) == null || (_node$key$loc = _node$key$loc.end) == null ? void 0 : _node$key$loc.line;
        if (endLine) this.catchUp(endLine);
      }
      _typescript._tsPrintClassMemberModifiers.call(this, node);
      if (node.computed) {
        this.tokenChar(91);
        this.print(node.key);
        this.tokenChar(93);
      } else {
        _flow._variance.call(this, node);
        this.print(node.key);
      }
      if (node.optional) {
        this.tokenChar(63);
      }
      if (node.definite) {
        this.tokenChar(33);
      }
      this.print(node.typeAnnotation);
      if (node.value) {
        this.space();
        this.tokenChar(61);
        this.space();
        this.print(node.value);
      }
      this.semicolon();
    }
    function ClassAccessorProperty(node) {
      var _node$key$loc2;
      this.printJoin(node.decorators);
      const endLine = (_node$key$loc2 = node.key.loc) == null || (_node$key$loc2 = _node$key$loc2.end) == null ? void 0 : _node$key$loc2.line;
      if (endLine) this.catchUp(endLine);
      _typescript._tsPrintClassMemberModifiers.call(this, node);
      this.word("accessor", true);
      this.space();
      if (node.computed) {
        this.tokenChar(91);
        this.print(node.key);
        this.tokenChar(93);
      } else {
        _flow._variance.call(this, node);
        this.print(node.key);
      }
      if (node.optional) {
        this.tokenChar(63);
      }
      if (node.definite) {
        this.tokenChar(33);
      }
      this.print(node.typeAnnotation);
      if (node.value) {
        this.space();
        this.tokenChar(61);
        this.space();
        this.print(node.value);
      }
      this.semicolon();
    }
    function ClassPrivateProperty(node) {
      this.printJoin(node.decorators);
      _typescript._tsPrintClassMemberModifiers.call(this, node);
      this.print(node.key);
      if (node.optional) {
        this.tokenChar(63);
      }
      if (node.definite) {
        this.tokenChar(33);
      }
      this.print(node.typeAnnotation);
      if (node.value) {
        this.space();
        this.tokenChar(61);
        this.space();
        this.print(node.value);
      }
      this.semicolon();
    }
    function ClassMethod(node) {
      _classMethodHead.call(this, node);
      this.space();
      this.print(node.body);
    }
    function ClassPrivateMethod(node) {
      _classMethodHead.call(this, node);
      this.space();
      this.print(node.body);
    }
    function _classMethodHead(node) {
      this.printJoin(node.decorators);
      if (!this.format.preserveFormat) {
        var _node$key$loc3;
        const endLine = (_node$key$loc3 = node.key.loc) == null || (_node$key$loc3 = _node$key$loc3.end) == null ? void 0 : _node$key$loc3.line;
        if (endLine) this.catchUp(endLine);
      }
      _typescript._tsPrintClassMemberModifiers.call(this, node);
      _methods._methodHead.call(this, node);
    }
    function StaticBlock(node) {
      this.word("static");
      this.space();
      this.tokenChar(123);
      if (node.body.length === 0) {
        this.tokenChar(125);
      } else {
        this.newline();
        this.printSequence(node.body, true);
        this.rightBrace(node);
      }
    }
  }
});

// ../node_modules/@babel/generator/lib/generators/base.js
var require_base = __commonJS({
  "../node_modules/@babel/generator/lib/generators/base.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.BlockStatement = BlockStatement;
    exports.Directive = Directive;
    exports.DirectiveLiteral = DirectiveLiteral;
    exports.File = File;
    exports.InterpreterDirective = InterpreterDirective;
    exports.Placeholder = Placeholder;
    exports.Program = Program;
    function File(node) {
      if (node.program) {
        this.print(node.program.interpreter);
      }
      this.print(node.program);
    }
    function Program(node) {
      var _node$directives;
      this.printInnerComments(false);
      const directivesLen = (_node$directives = node.directives) == null ? void 0 : _node$directives.length;
      if (directivesLen) {
        var _node$directives$trai;
        const newline = node.body.length ? 2 : 1;
        this.printSequence(node.directives, void 0, void 0, newline);
        if (!((_node$directives$trai = node.directives[directivesLen - 1].trailingComments) != null && _node$directives$trai.length)) {
          this.newline(newline);
        }
      }
      this.printSequence(node.body);
    }
    function BlockStatement(node) {
      var _node$directives2;
      this.tokenChar(123);
      const oldNoLineTerminatorAfterNode = this.enterDelimited();
      const directivesLen = (_node$directives2 = node.directives) == null ? void 0 : _node$directives2.length;
      if (directivesLen) {
        var _node$directives$trai2;
        const newline = node.body.length ? 2 : 1;
        this.printSequence(node.directives, true, true, newline);
        if (!((_node$directives$trai2 = node.directives[directivesLen - 1].trailingComments) != null && _node$directives$trai2.length)) {
          this.newline(newline);
        }
      }
      this.printSequence(node.body, true, true);
      this._noLineTerminatorAfterNode = oldNoLineTerminatorAfterNode;
      this.rightBrace(node);
    }
    function Directive(node) {
      this.print(node.value);
      this.semicolon();
    }
    var unescapedSingleQuoteRE = /(?:^|[^\\])(?:\\\\)*'/;
    var unescapedDoubleQuoteRE = /(?:^|[^\\])(?:\\\\)*"/;
    function DirectiveLiteral(node) {
      const raw = this.getPossibleRaw(node);
      if (!this.format.minified && raw !== void 0) {
        this.token(raw);
        return;
      }
      const {
        value
      } = node;
      if (!unescapedDoubleQuoteRE.test(value)) {
        this.token(`"${value}"`);
      } else if (!unescapedSingleQuoteRE.test(value)) {
        this.token(`'${value}'`);
      } else {
        throw new Error("Malformed AST: it is not possible to print a directive containing both unescaped single and double quotes.");
      }
    }
    function InterpreterDirective(node) {
      this.token(`#!${node.value}`);
      this._newline();
    }
    function Placeholder(node) {
      this.token("%%");
      this.print(node.name);
      this.token("%%");
      if (node.expectedNode === "Statement") {
        this.semicolon();
      }
    }
  }
});

// ../node_modules/@babel/generator/lib/generators/jsx.js
var require_jsx2 = __commonJS({
  "../node_modules/@babel/generator/lib/generators/jsx.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.JSXAttribute = JSXAttribute;
    exports.JSXClosingElement = JSXClosingElement;
    exports.JSXClosingFragment = JSXClosingFragment;
    exports.JSXElement = JSXElement;
    exports.JSXEmptyExpression = JSXEmptyExpression;
    exports.JSXExpressionContainer = JSXExpressionContainer;
    exports.JSXFragment = JSXFragment;
    exports.JSXIdentifier = JSXIdentifier;
    exports.JSXMemberExpression = JSXMemberExpression;
    exports.JSXNamespacedName = JSXNamespacedName;
    exports.JSXOpeningElement = JSXOpeningElement;
    exports.JSXOpeningFragment = JSXOpeningFragment;
    exports.JSXSpreadAttribute = JSXSpreadAttribute;
    exports.JSXSpreadChild = JSXSpreadChild;
    exports.JSXText = JSXText;
    function JSXAttribute(node) {
      this.print(node.name);
      if (node.value) {
        this.tokenChar(61);
        this.print(node.value);
      }
    }
    function JSXIdentifier(node) {
      this.word(node.name);
    }
    function JSXNamespacedName(node) {
      this.print(node.namespace);
      this.tokenChar(58);
      this.print(node.name);
    }
    function JSXMemberExpression(node) {
      this.print(node.object);
      this.tokenChar(46);
      this.print(node.property);
    }
    function JSXSpreadAttribute(node) {
      this.tokenChar(123);
      this.token("...");
      this.print(node.argument);
      this.rightBrace(node);
    }
    function JSXExpressionContainer(node) {
      this.tokenChar(123);
      this.print(node.expression);
      this.rightBrace(node);
    }
    function JSXSpreadChild(node) {
      this.tokenChar(123);
      this.token("...");
      this.print(node.expression);
      this.rightBrace(node);
    }
    function JSXText(node) {
      const raw = this.getPossibleRaw(node);
      if (raw !== void 0) {
        this.token(raw, true);
      } else {
        this.token(node.value, true);
      }
    }
    function JSXElement(node) {
      const open = node.openingElement;
      this.print(open);
      if (open.selfClosing) return;
      this.indent();
      for (const child of node.children) {
        this.print(child);
      }
      this.dedent();
      this.print(node.closingElement);
    }
    function spaceSeparator() {
      this.space();
    }
    function JSXOpeningElement(node) {
      this.tokenChar(60);
      this.print(node.name);
      if (node.typeArguments) {
        this.print(node.typeArguments);
      }
      this.print(node.typeParameters);
      if (node.attributes.length > 0) {
        this.space();
        this.printJoin(node.attributes, void 0, void 0, spaceSeparator);
      }
      if (node.selfClosing) {
        this.space();
        this.tokenChar(47);
      }
      this.tokenChar(62);
    }
    function JSXClosingElement(node) {
      this.tokenChar(60);
      this.tokenChar(47);
      this.print(node.name);
      this.tokenChar(62);
    }
    function JSXEmptyExpression() {
      this.printInnerComments();
    }
    function JSXFragment(node) {
      this.print(node.openingFragment);
      this.indent();
      for (const child of node.children) {
        this.print(child);
      }
      this.dedent();
      this.print(node.closingFragment);
    }
    function JSXOpeningFragment() {
      this.tokenChar(60);
      this.tokenChar(62);
    }
    function JSXClosingFragment() {
      this.token("</");
      this.tokenChar(62);
    }
  }
});

// ../node_modules/@babel/generator/lib/generators/index.js
var require_generators = __commonJS({
  "../node_modules/@babel/generator/lib/generators/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var _templateLiterals = require_template_literals();
    Object.keys(_templateLiterals).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (key in exports && exports[key] === _templateLiterals[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _templateLiterals[key];
        }
      });
    });
    var _expressions = require_expressions();
    Object.keys(_expressions).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (key in exports && exports[key] === _expressions[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _expressions[key];
        }
      });
    });
    var _statements = require_statements();
    Object.keys(_statements).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (key in exports && exports[key] === _statements[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _statements[key];
        }
      });
    });
    var _classes = require_classes();
    Object.keys(_classes).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (key in exports && exports[key] === _classes[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _classes[key];
        }
      });
    });
    var _methods = require_methods();
    Object.keys(_methods).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (key in exports && exports[key] === _methods[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _methods[key];
        }
      });
    });
    var _modules = require_modules();
    Object.keys(_modules).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (key in exports && exports[key] === _modules[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _modules[key];
        }
      });
    });
    var _types = require_types();
    Object.keys(_types).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (key in exports && exports[key] === _types[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _types[key];
        }
      });
    });
    var _flow = require_flow2();
    Object.keys(_flow).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (key in exports && exports[key] === _flow[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _flow[key];
        }
      });
    });
    var _base = require_base();
    Object.keys(_base).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (key in exports && exports[key] === _base[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _base[key];
        }
      });
    });
    var _jsx = require_jsx2();
    Object.keys(_jsx).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (key in exports && exports[key] === _jsx[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _jsx[key];
        }
      });
    });
    var _typescript = require_typescript2();
    Object.keys(_typescript).forEach(function(key) {
      if (key === "default" || key === "__esModule") return;
      if (key in exports && exports[key] === _typescript[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function() {
          return _typescript[key];
        }
      });
    });
  }
});

// ../node_modules/@babel/generator/lib/generators/deprecated.js
var require_deprecated = __commonJS({
  "../node_modules/@babel/generator/lib/generators/deprecated.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.DecimalLiteral = DecimalLiteral;
    exports.Noop = Noop;
    exports.RecordExpression = RecordExpression;
    exports.TSExpressionWithTypeArguments = TSExpressionWithTypeArguments;
    exports.TupleExpression = TupleExpression;
    function Noop() {
    }
    function TSExpressionWithTypeArguments(node) {
      this.print(node.expression);
      this.print(node.typeParameters);
    }
    function DecimalLiteral(node) {
      const raw = this.getPossibleRaw(node);
      if (!this.format.minified && raw !== void 0) {
        this.word(raw);
        return;
      }
      this.word(node.value + "m");
    }
    function RecordExpression(node) {
      const props = node.properties;
      let startToken;
      let endToken;
      if (this.format.recordAndTupleSyntaxType === "bar") {
        startToken = "{|";
        endToken = "|}";
      } else if (this.format.recordAndTupleSyntaxType !== "hash" && this.format.recordAndTupleSyntaxType != null) {
        throw new Error(`The "recordAndTupleSyntaxType" generator option must be "bar" or "hash" (${JSON.stringify(this.format.recordAndTupleSyntaxType)} received).`);
      } else {
        startToken = "#{";
        endToken = "}";
      }
      this.token(startToken);
      if (props.length) {
        this.space();
        this.printList(props, this.shouldPrintTrailingComma(endToken), true, true);
        this.space();
      }
      this.token(endToken);
    }
    function TupleExpression(node) {
      const elems = node.elements;
      const len = elems.length;
      let startToken;
      let endToken;
      if (this.format.recordAndTupleSyntaxType === "bar") {
        startToken = "[|";
        endToken = "|]";
      } else if (this.format.recordAndTupleSyntaxType === "hash") {
        startToken = "#[";
        endToken = "]";
      } else {
        throw new Error(`${this.format.recordAndTupleSyntaxType} is not a valid recordAndTuple syntax type`);
      }
      this.token(startToken);
      for (let i = 0; i < elems.length; i++) {
        const elem = elems[i];
        if (elem) {
          if (i > 0) this.space();
          this.print(elem);
          if (i < len - 1 || this.shouldPrintTrailingComma(endToken)) {
            this.token(",", false, i);
          }
        }
      }
      this.token(endToken);
    }
  }
});

// ../node_modules/@babel/generator/lib/nodes.js
var require_nodes = __commonJS({
  "../node_modules/@babel/generator/lib/nodes.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.generatorInfosMap = void 0;
    var generatorFunctions = require_generators();
    var deprecatedGeneratorFunctions = require_deprecated();
    var generatorInfosMap = exports.generatorInfosMap = /* @__PURE__ */ new Map();
    var index = 0;
    for (const key of Object.keys(generatorFunctions).sort()) {
      if (key.startsWith("_")) continue;
      generatorInfosMap.set(key, [generatorFunctions[key], index++, void 0]);
    }
    for (const key of Object.keys(deprecatedGeneratorFunctions)) {
      generatorInfosMap.set(key, [deprecatedGeneratorFunctions[key], index++, void 0]);
    }
  }
});

// ../node_modules/@babel/generator/lib/node/index.js
var require_node = __commonJS({
  "../node_modules/@babel/generator/lib/node/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.TokenContext = void 0;
    exports.isLastChild = isLastChild;
    exports.parentNeedsParens = parentNeedsParens;
    var parens = require_parentheses();
    var _t = require_lib3();
    var _nodes = require_nodes();
    var {
      VISITOR_KEYS
    } = _t;
    var TokenContext = exports.TokenContext = {
      normal: 0,
      expressionStatement: 1,
      arrowBody: 2,
      exportDefault: 4,
      arrowFlowReturnType: 8,
      forInitHead: 16,
      forInHead: 32,
      forOfHead: 64,
      forInOrInitHeadAccumulate: 128,
      forInOrInitHeadAccumulatePassThroughMask: 128
    };
    for (const type of Object.keys(parens)) {
      const func = parens[type];
      if (_nodes.generatorInfosMap.has(type)) {
        _nodes.generatorInfosMap.get(type)[2] = func;
      }
    }
    function newCalleeNeedsParens(node) {
      let current = node;
      while (true) {
        switch (current.type) {
          case "CallExpression":
          case "ImportExpression":
          case "OptionalCallExpression":
          case "OptionalMemberExpression":
            return true;
          case "MemberExpression":
            current = current.object;
            break;
          case "TaggedTemplateExpression":
            current = current.tag;
            break;
          case "TSNonNullExpression":
            current = current.expression;
            break;
          default:
            return false;
        }
      }
    }
    function parentNeedsParens(node, parent, parentId) {
      switch (parentId) {
        case 112:
          if (parent.callee === node) {
            return newCalleeNeedsParens(node);
          }
          break;
        case 42:
          return !isDecoratorMemberExpression(node) && !(node.type === "CallExpression" && isDecoratorMemberExpression(node.callee)) && node.type !== "ParenthesizedExpression";
      }
      return false;
    }
    function isDecoratorMemberExpression(node) {
      switch (node.type) {
        case "Identifier":
          return true;
        case "MemberExpression":
          return !node.computed && node.property.type === "Identifier" && isDecoratorMemberExpression(node.object);
        default:
          return false;
      }
    }
    function isLastChild(parent, child) {
      const visitorKeys = VISITOR_KEYS[parent.type];
      for (let i = visitorKeys.length - 1; i >= 0; i--) {
        const val = parent[visitorKeys[i]];
        if (val === child) {
          return true;
        } else if (Array.isArray(val)) {
          let j = val.length - 1;
          while (j >= 0 && val[j] === null) j--;
          return j >= 0 && val[j] === child;
        } else if (val) {
          return false;
        }
      }
      return false;
    }
  }
});

// ../node_modules/@babel/generator/lib/token-map.js
var require_token_map = __commonJS({
  "../node_modules/@babel/generator/lib/token-map.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.TokenMap = void 0;
    var _t = require_lib3();
    var {
      traverseFast,
      VISITOR_KEYS
    } = _t;
    var TokenMap = class {
      constructor(ast, tokens, source) {
        this._tokens = void 0;
        this._source = void 0;
        this._nodesToTokenIndexes = /* @__PURE__ */ new Map();
        this._nodesOccurrencesCountCache = /* @__PURE__ */ new Map();
        this._tokensCache = /* @__PURE__ */ new Map();
        this._tokens = tokens;
        this._source = source;
        traverseFast(ast, (node) => {
          const indexes = this._getTokensIndexesOfNode(node);
          if (indexes.length > 0) this._nodesToTokenIndexes.set(node, indexes);
        });
        this._tokensCache.clear();
      }
      has(node) {
        return this._nodesToTokenIndexes.has(node);
      }
      getIndexes(node) {
        return this._nodesToTokenIndexes.get(node);
      }
      find(node, condition) {
        const indexes = this._nodesToTokenIndexes.get(node);
        if (indexes) {
          for (let k = 0; k < indexes.length; k++) {
            const index = indexes[k];
            const tok = this._tokens[index];
            if (condition(tok, index)) return tok;
          }
        }
        return null;
      }
      findLastIndex(node, condition) {
        const indexes = this._nodesToTokenIndexes.get(node);
        if (indexes) {
          for (let k = indexes.length - 1; k >= 0; k--) {
            const index = indexes[k];
            const tok = this._tokens[index];
            if (condition(tok, index)) return index;
          }
        }
        return -1;
      }
      findMatching(node, test, occurrenceCount = 0) {
        const indexes = this._nodesToTokenIndexes.get(node);
        if (indexes) {
          if (typeof test === "number") {
            test = String.fromCharCode(test);
          }
          let i = 0;
          const count = occurrenceCount;
          if (count > 1) {
            const cache = this._nodesOccurrencesCountCache.get(node);
            if ((cache == null ? void 0 : cache.test) === test && cache.count < count) {
              i = cache.i + 1;
              occurrenceCount -= cache.count + 1;
            }
          }
          for (; i < indexes.length; i++) {
            const tok = this._tokens[indexes[i]];
            if (this.matchesOriginal(tok, test)) {
              if (occurrenceCount === 0) {
                if (count > 0) {
                  this._nodesOccurrencesCountCache.set(node, {
                    test,
                    count,
                    i
                  });
                }
                return tok;
              }
              occurrenceCount--;
            }
          }
        }
        return null;
      }
      matchesOriginal(token, test) {
        if (token.end - token.start !== test.length) return false;
        if (token.value != null) return token.value === test;
        return this._source.startsWith(test, token.start);
      }
      startMatches(node, test) {
        const indexes = this._nodesToTokenIndexes.get(node);
        if (!indexes) return false;
        const tok = this._tokens[indexes[0]];
        if (tok.start !== node.start) return false;
        return this.matchesOriginal(tok, test);
      }
      endMatches(node, test) {
        const indexes = this._nodesToTokenIndexes.get(node);
        if (!indexes) return false;
        const tok = this._tokens[indexes[indexes.length - 1]];
        if (tok.end !== node.end) return false;
        return this.matchesOriginal(tok, test);
      }
      _getTokensIndexesOfNode(node) {
        var _node$declaration;
        if (node.start == null || node.end == null) return [];
        const {
          first,
          last
        } = this._findTokensOfNode(node, 0, this._tokens.length - 1);
        let low = first;
        const children = childrenIterator(node);
        if ((node.type === "ExportNamedDeclaration" || node.type === "ExportDefaultDeclaration") && ((_node$declaration = node.declaration) == null ? void 0 : _node$declaration.type) === "ClassDeclaration") {
          children.next();
        }
        const indexes = [];
        for (const child of children) {
          if (child == null) continue;
          if (child.start == null || child.end == null) continue;
          const childTok = this._findTokensOfNode(child, low, last);
          const high = childTok.first;
          for (let k = low; k < high; k++) indexes.push(k);
          low = childTok.last + 1;
        }
        for (let k = low; k <= last; k++) indexes.push(k);
        return indexes;
      }
      _findTokensOfNode(node, low, high) {
        const cached = this._tokensCache.get(node);
        if (cached) return cached;
        const first = this._findFirstTokenOfNode(node.start, low, high);
        const last = this._findLastTokenOfNode(node.end, first, high);
        this._tokensCache.set(node, {
          first,
          last
        });
        return {
          first,
          last
        };
      }
      _findFirstTokenOfNode(start, low, high) {
        while (low <= high) {
          const mid = high + low >> 1;
          if (start < this._tokens[mid].start) {
            high = mid - 1;
          } else if (start > this._tokens[mid].start) {
            low = mid + 1;
          } else {
            return mid;
          }
        }
        return low;
      }
      _findLastTokenOfNode(end, low, high) {
        while (low <= high) {
          const mid = high + low >> 1;
          if (end < this._tokens[mid].end) {
            high = mid - 1;
          } else if (end > this._tokens[mid].end) {
            low = mid + 1;
          } else {
            return mid;
          }
        }
        return high;
      }
    };
    exports.TokenMap = TokenMap;
    function* childrenIterator(node) {
      if (node.type === "TemplateLiteral") {
        yield node.quasis[0];
        for (let i = 1; i < node.quasis.length; i++) {
          yield node.expressions[i - 1];
          yield node.quasis[i];
        }
        return;
      }
      const keys = VISITOR_KEYS[node.type];
      for (const key of keys) {
        const child = node[key];
        if (!child) continue;
        if (Array.isArray(child)) {
          yield* child;
        } else {
          yield child;
        }
      }
    }
  }
});

// ../node_modules/@babel/generator/lib/printer.js
var require_printer = __commonJS({
  "../node_modules/@babel/generator/lib/printer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    var _buffer = require_buffer();
    var _index = require_node();
    var _nodes = require_nodes();
    var _t = require_lib3();
    var _tokenMap = require_token_map();
    var _types2 = require_types();
    var {
      isExpression,
      isFunction,
      isStatement,
      isClassBody,
      isTSInterfaceBody,
      isTSEnumMember
    } = _t;
    var SCIENTIFIC_NOTATION = /e/i;
    var ZERO_DECIMAL_INTEGER = /\.0+$/;
    var HAS_NEWLINE = /[\n\r\u2028\u2029]/;
    var HAS_NEWLINE_OR_BlOCK_COMMENT_END = /[\n\r\u2028\u2029]|\*\//;
    function commentIsNewline(c) {
      return c.type === "CommentLine" || HAS_NEWLINE.test(c.value);
    }
    var Printer = class {
      constructor(format, map, tokens = null, originalCode = null) {
        this.tokenContext = _index.TokenContext.normal;
        this._tokens = null;
        this._originalCode = null;
        this._currentNode = null;
        this._currentTypeId = null;
        this._indent = 0;
        this._indentRepeat = 0;
        this._insideAux = false;
        this._noLineTerminator = false;
        this._noLineTerminatorAfterNode = null;
        this._printAuxAfterOnNextUserNode = false;
        this._printedComments = /* @__PURE__ */ new Set();
        this._lastCommentLine = 0;
        this._innerCommentsState = 0;
        this._flags = 0;
        this.tokenMap = null;
        this._boundGetRawIdentifier = null;
        this._printSemicolonBeforeNextNode = -1;
        this._printSemicolonBeforeNextToken = -1;
        this.format = format;
        this._tokens = tokens;
        this._originalCode = originalCode;
        this._indentRepeat = format.indent.style.length;
        this._inputMap = (map == null ? void 0 : map._inputMap) || null;
        this._buf = new _buffer.default(map, format.indent.style[0]);
        const {
          preserveFormat,
          compact,
          concise,
          retainLines,
          retainFunctionParens
        } = format;
        if (preserveFormat) {
          this._flags |= 1;
        }
        if (compact) {
          this._flags |= 2;
        }
        if (concise) {
          this._flags |= 4;
        }
        if (retainLines) {
          this._flags |= 8;
        }
        if (retainFunctionParens) {
          this._flags |= 16;
        }
        if (format.auxiliaryCommentBefore || format.auxiliaryCommentAfter) {
          this._flags |= 32;
        }
      }
      enterDelimited() {
        const oldNoLineTerminatorAfterNode = this._noLineTerminatorAfterNode;
        if (oldNoLineTerminatorAfterNode !== null) {
          this._noLineTerminatorAfterNode = null;
        }
        return oldNoLineTerminatorAfterNode;
      }
      generate(ast) {
        if (this.format.preserveFormat) {
          this.tokenMap = new _tokenMap.TokenMap(ast, this._tokens, this._originalCode);
          this._boundGetRawIdentifier = _types2._getRawIdentifier.bind(this);
        }
        this.print(ast);
        this._maybeAddAuxComment();
        return this._buf.get();
      }
      indent(flags = this._flags) {
        if (flags & (1 | 2 | 4)) {
          return;
        }
        this._indent += this._indentRepeat;
      }
      dedent(flags = this._flags) {
        if (flags & (1 | 2 | 4)) {
          return;
        }
        this._indent -= this._indentRepeat;
      }
      semicolon(force = false) {
        const flags = this._flags;
        if (flags & 32) {
          this._maybeAddAuxComment();
        }
        if (flags & 1) {
          const node = this._currentNode;
          if (node.start != null && node.end != null) {
            if (!this.tokenMap.endMatches(node, ";")) {
              this._printSemicolonBeforeNextNode = this._buf.getCurrentLine();
              return;
            }
            const indexes = this.tokenMap.getIndexes(this._currentNode);
            this._catchUpTo(this._tokens[indexes[indexes.length - 1]].loc.start);
          }
        }
        if (force) {
          this._appendChar(59);
        } else {
          this._queue(59);
        }
        this._noLineTerminator = false;
      }
      rightBrace(node) {
        if (this.format.minified) {
          this._buf.removeLastSemicolon();
        }
        this.sourceWithOffset("end", node.loc, -1);
        this.tokenChar(125);
      }
      rightParens(node) {
        this.sourceWithOffset("end", node.loc, -1);
        this.tokenChar(41);
      }
      space(force = false) {
        if (this._flags & (1 | 2)) {
          return;
        }
        if (force) {
          this._space();
        } else {
          const lastCp = this.getLastChar(true);
          if (lastCp !== 0 && lastCp !== 32 && lastCp !== 10) {
            this._space();
          }
        }
      }
      word(str, noLineTerminatorAfter = false) {
        this.tokenContext &= _index.TokenContext.forInOrInitHeadAccumulatePassThroughMask;
        this._maybePrintInnerComments(str);
        const flags = this._flags;
        if (flags & 32) {
          this._maybeAddAuxComment();
        }
        if (flags & 1) this._catchUpToCurrentToken(str);
        const lastChar = this.getLastChar();
        if (lastChar === -2 || lastChar === -3 || lastChar === 47 && str.charCodeAt(0) === 47) {
          this._space();
        }
        this._append(str, false);
        this.setLastChar(-3);
        this._noLineTerminator = noLineTerminatorAfter;
      }
      number(str, number) {
        function isNonDecimalLiteral(str2) {
          if (str2.length > 2 && str2.charCodeAt(0) === 48) {
            const secondChar = str2.charCodeAt(1);
            return secondChar === 98 || secondChar === 111 || secondChar === 120;
          }
          return false;
        }
        this.word(str);
        if (Number.isInteger(number) && !isNonDecimalLiteral(str) && !SCIENTIFIC_NOTATION.test(str) && !ZERO_DECIMAL_INTEGER.test(str) && str.charCodeAt(str.length - 1) !== 46) {
          this.setLastChar(-2);
        }
      }
      token(str, maybeNewline = false, occurrenceCount = 0, mayNeedSpace = false) {
        this.tokenContext &= _index.TokenContext.forInOrInitHeadAccumulatePassThroughMask;
        this._maybePrintInnerComments(str, occurrenceCount);
        const flags = this._flags;
        if (flags & 32) {
          this._maybeAddAuxComment();
        }
        if (flags & 1) {
          this._catchUpToCurrentToken(str, occurrenceCount);
        }
        if (mayNeedSpace) {
          const strFirst = str.charCodeAt(0);
          if ((strFirst === 45 && str === "--" || strFirst === 61) && this.getLastChar() === 33 || strFirst === 43 && this.getLastChar() === 43 || strFirst === 45 && this.getLastChar() === 45 || strFirst === 46 && this.getLastChar() === -2) {
            this._space();
          }
        }
        this._append(str, maybeNewline);
        this._noLineTerminator = false;
      }
      tokenChar(char, occurrenceCount = 0) {
        this.tokenContext &= _index.TokenContext.forInOrInitHeadAccumulatePassThroughMask;
        this._maybePrintInnerComments(char, occurrenceCount);
        const flags = this._flags;
        if (flags & 32) {
          this._maybeAddAuxComment();
        }
        if (flags & 1) {
          this._catchUpToCurrentToken(char, occurrenceCount);
        }
        if (char === 43 && this.getLastChar() === 43 || char === 45 && this.getLastChar() === 45 || char === 46 && this.getLastChar() === -2) {
          this._space();
        }
        this._appendChar(char);
        this._noLineTerminator = false;
      }
      newline(i = 1, flags = this._flags) {
        if (i <= 0) return;
        if (flags & (8 | 2)) {
          return;
        }
        if (flags & 4) {
          this.space();
          return;
        }
        if (i > 2) i = 2;
        i -= this._buf.getNewlineCount();
        for (let j = 0; j < i; j++) {
          this._newline();
        }
      }
      endsWith(char) {
        return this.getLastChar(true) === char;
      }
      getLastChar(checkQueue) {
        return this._buf.getLastChar(checkQueue);
      }
      setLastChar(char) {
        this._buf._last = char;
      }
      exactSource(loc, cb) {
        if (!loc) {
          cb();
          return;
        }
        this._catchUp("start", loc);
        this._buf.exactSource(loc, cb);
      }
      source(prop, loc) {
        if (!loc) return;
        this._catchUp(prop, loc);
        this._buf.source(prop, loc);
      }
      sourceWithOffset(prop, loc, columnOffset) {
        if (!loc || this.format.preserveFormat) return;
        this._catchUp(prop, loc);
        this._buf.sourceWithOffset(prop, loc, columnOffset);
      }
      sourceIdentifierName(identifierName, pos) {
        if (!this._buf._canMarkIdName) return;
        const sourcePosition = this._buf._sourcePosition;
        sourcePosition.identifierNamePos = pos;
        sourcePosition.identifierName = identifierName;
      }
      _space() {
        this._queue(32);
      }
      _newline() {
        if (this._buf._queuedChar === 32) this._buf._queuedChar = 0;
        this._appendChar(10, true);
      }
      _catchUpToCurrentToken(str, occurrenceCount = 0) {
        const token = this.tokenMap.findMatching(this._currentNode, str, occurrenceCount);
        if (token) this._catchUpTo(token.loc.start);
        if (this._printSemicolonBeforeNextToken !== -1 && this._printSemicolonBeforeNextToken === this._buf.getCurrentLine()) {
          this._appendChar(59, true);
        }
        this._printSemicolonBeforeNextToken = -1;
        this._printSemicolonBeforeNextNode = -1;
      }
      _append(str, maybeNewline) {
        this._maybeIndent();
        this._buf.append(str, maybeNewline);
      }
      _appendChar(char, noIndent) {
        if (!noIndent) {
          this._maybeIndent();
        }
        this._buf.appendChar(char);
      }
      _queue(char) {
        this._buf.queue(char);
        this.setLastChar(-1);
      }
      _maybeIndent() {
        const indent = this._shouldIndent();
        if (indent > 0) {
          this._buf._appendChar(-1, indent, false);
        }
      }
      _shouldIndent() {
        return this.endsWith(10) ? this._indent : 0;
      }
      catchUp(line) {
        if (!this.format.retainLines) return;
        const count = line - this._buf.getCurrentLine();
        for (let i = 0; i < count; i++) {
          this._newline();
        }
      }
      _catchUp(prop, loc) {
        const flags = this._flags;
        if ((flags & 1) === 0) {
          if (flags & 8 && loc != null && loc[prop]) {
            this.catchUp(loc[prop].line);
          }
          return;
        }
        const pos = loc == null ? void 0 : loc[prop];
        if (pos != null) this._catchUpTo(pos);
      }
      _catchUpTo({
        line,
        column,
        index
      }) {
        const count = line - this._buf.getCurrentLine();
        if (count > 0 && this._noLineTerminator) {
          return;
        }
        for (let i = 0; i < count; i++) {
          this._newline();
        }
        const spacesCount = count > 0 ? column : column - this._buf.getCurrentColumn();
        if (spacesCount > 0) {
          const spaces = this._originalCode ? this._originalCode.slice(index - spacesCount, index).replace(/[^\t\x0B\f \xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF]/gu, " ") : " ".repeat(spacesCount);
          this._buf.append(spaces, false, true);
          this._buf.setSourcePosition(line, column);
          this.setLastChar(32);
        }
      }
      printTerminatorless(node) {
        this._noLineTerminator = true;
        this.print(node);
      }
      print(node, noLineTerminatorAfter = false, resetTokenContext = false, trailingCommentsLineOffset) {
        var _node$leadingComments, _node$leadingComments2;
        if (!node) return;
        this._innerCommentsState = 0;
        const {
          type,
          loc,
          extra
        } = node;
        const flags = this._flags;
        let changedFlags = false;
        if (node._compact) {
          this._flags |= 4;
          changedFlags = true;
        }
        const nodeInfo = _nodes.generatorInfosMap.get(type);
        if (nodeInfo === void 0) {
          throw new ReferenceError(`unknown node of type ${JSON.stringify(type)} with constructor ${JSON.stringify(node.constructor.name)}`);
        }
        const [printMethod, nodeId, needsParens] = nodeInfo;
        const parent = this._currentNode;
        const parentId = this._currentTypeId;
        this._currentNode = node;
        this._currentTypeId = nodeId;
        if (flags & 1) {
          this._printSemicolonBeforeNextToken = this._printSemicolonBeforeNextNode;
        }
        let oldInAux;
        if (flags & 32) {
          oldInAux = this._insideAux;
          this._insideAux = loc == null;
          this._maybeAddAuxComment(this._insideAux && !oldInAux);
        }
        let oldTokenContext = 0;
        if (resetTokenContext) {
          oldTokenContext = this.tokenContext;
          if (oldTokenContext & _index.TokenContext.forInOrInitHeadAccumulate) {
            this.tokenContext = 0;
          } else {
            oldTokenContext = 0;
          }
        }
        const parenthesized = extra != null && extra.parenthesized;
        let shouldPrintParens = parenthesized && flags & 1 || parenthesized && flags & 16 && nodeId === 71 || parent && ((0, _index.parentNeedsParens)(node, parent, parentId) || needsParens != null && needsParens(node, parent, parentId, this.tokenContext, flags & 1 ? this._boundGetRawIdentifier : void 0));
        if (!shouldPrintParens && parenthesized && (_node$leadingComments = node.leadingComments) != null && _node$leadingComments.length && node.leadingComments[0].type === "CommentBlock") {
          switch (parentId) {
            case 65:
            case 243:
            case 6:
            case 143:
              break;
            case 17:
            case 130:
            case 112:
              if (parent.callee !== node) break;
            default:
              shouldPrintParens = true;
          }
        }
        let indentParenthesized = false;
        if (!shouldPrintParens && this._noLineTerminator && ((_node$leadingComments2 = node.leadingComments) != null && _node$leadingComments2.some(commentIsNewline) || flags & 8 && loc && loc.start.line > this._buf.getCurrentLine())) {
          shouldPrintParens = true;
          indentParenthesized = true;
        }
        let oldNoLineTerminatorAfterNode;
        if (!shouldPrintParens) {
          noLineTerminatorAfter || (noLineTerminatorAfter = !!parent && this._noLineTerminatorAfterNode === parent && (0, _index.isLastChild)(parent, node));
          if (noLineTerminatorAfter) {
            var _node$trailingComment;
            if ((_node$trailingComment = node.trailingComments) != null && _node$trailingComment.some(commentIsNewline)) {
              if (isExpression(node)) shouldPrintParens = true;
            } else {
              oldNoLineTerminatorAfterNode = this._noLineTerminatorAfterNode;
              this._noLineTerminatorAfterNode = node;
            }
          }
        }
        if (shouldPrintParens) {
          this.tokenChar(40);
          if (indentParenthesized) this.indent();
          this._innerCommentsState = 0;
          if (!resetTokenContext) {
            oldTokenContext = this.tokenContext;
          }
          if (oldTokenContext & _index.TokenContext.forInOrInitHeadAccumulate) {
            this.tokenContext = 0;
          }
          oldNoLineTerminatorAfterNode = this._noLineTerminatorAfterNode;
          this._noLineTerminatorAfterNode = null;
        }
        this._printLeadingComments(node, parent);
        this.exactSource(nodeId === 139 || nodeId === 66 ? null : loc, printMethod.bind(this, node, parent));
        if (shouldPrintParens) {
          this._printTrailingComments(node, parent);
          if (indentParenthesized) {
            this.dedent();
            this.newline();
          }
          this.tokenChar(41);
          this._noLineTerminator = noLineTerminatorAfter;
        } else if (noLineTerminatorAfter && !this._noLineTerminator) {
          this._noLineTerminator = true;
          this._printTrailingComments(node, parent);
        } else {
          this._printTrailingComments(node, parent, trailingCommentsLineOffset);
        }
        if (oldTokenContext) this.tokenContext = oldTokenContext;
        this._currentNode = parent;
        this._currentTypeId = parentId;
        if (changedFlags) {
          this._flags = flags;
        }
        if (flags & 32) {
          this._insideAux = oldInAux;
        }
        if (oldNoLineTerminatorAfterNode != null) {
          this._noLineTerminatorAfterNode = oldNoLineTerminatorAfterNode;
        }
        this._innerCommentsState = 0;
      }
      _maybeAddAuxComment(enteredPositionlessNode) {
        if (enteredPositionlessNode) this._printAuxBeforeComment();
        if (!this._insideAux) this._printAuxAfterComment();
      }
      _printAuxBeforeComment() {
        if (this._printAuxAfterOnNextUserNode) return;
        this._printAuxAfterOnNextUserNode = true;
        const comment = this.format.auxiliaryCommentBefore;
        if (comment) {
          this._printComment({
            type: "CommentBlock",
            value: comment
          }, 0);
        }
      }
      _printAuxAfterComment() {
        if (!this._printAuxAfterOnNextUserNode) return;
        this._printAuxAfterOnNextUserNode = false;
        const comment = this.format.auxiliaryCommentAfter;
        if (comment) {
          this._printComment({
            type: "CommentBlock",
            value: comment
          }, 0);
        }
      }
      getPossibleRaw(node) {
        const extra = node.extra;
        if ((extra == null ? void 0 : extra.raw) != null && extra.rawValue != null && node.value === extra.rawValue) {
          return extra.raw;
        }
      }
      printJoin(nodes, statement, indent, separator, printTrailingSeparator, resetTokenContext, trailingCommentsLineOffset) {
        if (!(nodes != null && nodes.length)) return;
        const flags = this._flags;
        if (indent == null && flags & 8) {
          var _nodes$0$loc;
          const startLine = (_nodes$0$loc = nodes[0].loc) == null ? void 0 : _nodes$0$loc.start.line;
          if (startLine != null && startLine !== this._buf.getCurrentLine()) {
            indent = true;
          }
        }
        if (indent) this.indent(flags);
        const len = nodes.length;
        for (let i = 0; i < len; i++) {
          const node = nodes[i];
          if (!node) continue;
          if (statement && i === 0 && this._buf.hasContent()) {
            this.newline(1, flags);
          }
          this.print(node, false, resetTokenContext, trailingCommentsLineOffset || 0);
          if (separator != null) {
            if (i < len - 1) separator.call(this, i, false);
            else if (printTrailingSeparator) separator.call(this, i, true);
          }
          if (statement) {
            if (i + 1 === len) {
              this.newline(1, flags);
            } else {
              const lastCommentLine = this._lastCommentLine;
              if (lastCommentLine > 0) {
                var _nodes$loc;
                const offset = (((_nodes$loc = nodes[i + 1].loc) == null ? void 0 : _nodes$loc.start.line) || 0) - lastCommentLine;
                if (offset >= 0) {
                  this.newline(offset || 1, flags);
                  continue;
                }
              }
              this.newline(1, flags);
            }
          }
        }
        if (indent) this.dedent(flags);
      }
      printAndIndentOnComments(node) {
        const indent = node.leadingComments && node.leadingComments.length > 0;
        if (indent) this.indent();
        this.print(node);
        if (indent) this.dedent();
      }
      printBlock(body) {
        if (body.type !== "EmptyStatement") {
          this.space();
        }
        this.print(body);
      }
      _printTrailingComments(node, parent, lineOffset) {
        const {
          innerComments,
          trailingComments
        } = node;
        if (innerComments != null && innerComments.length) {
          this._printComments(2, innerComments, node, parent, lineOffset);
        }
        if (trailingComments != null && trailingComments.length) {
          this._printComments(2, trailingComments, node, parent, lineOffset);
        } else {
          this._lastCommentLine = 0;
        }
      }
      _printLeadingComments(node, parent) {
        const comments = node.leadingComments;
        if (!(comments != null && comments.length)) return;
        this._printComments(0, comments, node, parent);
      }
      _maybePrintInnerComments(nextTokenStr, nextTokenOccurrenceCount) {
        var _this$tokenMap;
        const state = this._innerCommentsState;
        switch (state & 3) {
          case 0:
            this._innerCommentsState = 1 | 4;
            return;
          case 1:
            this.printInnerComments((state & 4) > 0, (_this$tokenMap = this.tokenMap) == null ? void 0 : _this$tokenMap.findMatching(this._currentNode, nextTokenStr, nextTokenOccurrenceCount));
        }
      }
      printInnerComments(indent = true, nextToken) {
        const node = this._currentNode;
        const comments = node.innerComments;
        if (!(comments != null && comments.length)) {
          this._innerCommentsState = 2;
          return;
        }
        const hasSpace = this.endsWith(32);
        if (indent) this.indent();
        switch (this._printComments(1, comments, node, void 0, void 0, nextToken)) {
          case 2:
            this._innerCommentsState = 2;
          case 1:
            if (hasSpace) this.space();
        }
        if (indent) this.dedent();
      }
      noIndentInnerCommentsHere() {
        this._innerCommentsState &= ~4;
      }
      printSequence(nodes, indent, resetTokenContext, trailingCommentsLineOffset) {
        this.printJoin(nodes, true, indent != null ? indent : false, void 0, void 0, resetTokenContext, trailingCommentsLineOffset);
      }
      printList(items, printTrailingSeparator, statement, indent, separator, resetTokenContext) {
        this.printJoin(items, statement, indent, separator != null ? separator : commaSeparator, printTrailingSeparator, resetTokenContext);
      }
      shouldPrintTrailingComma(listEnd) {
        if (!this.tokenMap) return null;
        const listEndIndex = this.tokenMap.findLastIndex(this._currentNode, (token) => this.tokenMap.matchesOriginal(token, typeof listEnd === "number" ? String.fromCharCode(listEnd) : listEnd));
        if (listEndIndex <= 0) return null;
        return this.tokenMap.matchesOriginal(this._tokens[listEndIndex - 1], ",");
      }
      _shouldPrintComment(comment, nextToken) {
        if (comment.ignore) return 0;
        if (this._printedComments.has(comment)) return 0;
        if (this._noLineTerminator && HAS_NEWLINE_OR_BlOCK_COMMENT_END.test(comment.value)) {
          return 2;
        }
        if (nextToken && this.tokenMap) {
          const commentTok = this.tokenMap.find(this._currentNode, (token) => token.value === comment.value);
          if (commentTok && commentTok.start > nextToken.start) {
            return 2;
          }
        }
        this._printedComments.add(comment);
        if (!this.format.shouldPrintComment(comment.value)) {
          return 0;
        }
        return 1;
      }
      _printComment(comment, skipNewLines) {
        const noLineTerminator = this._noLineTerminator;
        const isBlockComment = comment.type === "CommentBlock";
        const printNewLines = isBlockComment && skipNewLines !== 1 && !noLineTerminator;
        if (printNewLines && this._buf.hasContent() && skipNewLines !== 2) {
          this.newline(1);
        }
        switch (this.getLastChar(true)) {
          case 47:
            this._space();
          case 91:
          case 123:
          case 40:
            break;
          default:
            this.space();
        }
        let val;
        if (isBlockComment) {
          val = `/*${comment.value}*/`;
          if (this.format.indent.adjustMultilineComment) {
            var _comment$loc;
            const offset = (_comment$loc = comment.loc) == null ? void 0 : _comment$loc.start.column;
            if (offset) {
              const newlineRegex = new RegExp("\\n\\s{1," + offset + "}", "g");
              val = val.replace(newlineRegex, "\n");
            }
            if (this._flags & 4) {
              val = val.replace(/\n(?!$)/g, `
`);
            } else {
              let indentSize = this.format.retainLines ? 0 : this._buf.getCurrentColumn();
              if (this._shouldIndent() || this.format.retainLines) {
                indentSize += this._indent;
              }
              val = val.replace(/\n(?!$)/g, `
${" ".repeat(indentSize)}`);
            }
          }
        } else if (!noLineTerminator) {
          val = `//${comment.value}`;
        } else {
          val = `/*${comment.value}*/`;
        }
        this.source("start", comment.loc);
        this._append(val, isBlockComment);
        if (!isBlockComment && !noLineTerminator) {
          this._newline();
        }
        if (printNewLines && skipNewLines !== 3) {
          this.newline(1);
        }
      }
      _printComments(type, comments, node, parent, lineOffset = 0, nextToken) {
        const nodeLoc = node.loc;
        const len = comments.length;
        let hasLoc = !!nodeLoc;
        const nodeStartLine = hasLoc ? nodeLoc.start.line : 0;
        const nodeEndLine = hasLoc ? nodeLoc.end.line : 0;
        let lastLine = 0;
        let leadingCommentNewline = 0;
        const {
          _noLineTerminator,
          _flags
        } = this;
        for (let i = 0; i < len; i++) {
          const comment = comments[i];
          const shouldPrint = this._shouldPrintComment(comment, nextToken);
          if (shouldPrint === 2) {
            return i === 0 ? 0 : 1;
          }
          if (hasLoc && comment.loc && shouldPrint === 1) {
            const commentStartLine = comment.loc.start.line;
            const commentEndLine = comment.loc.end.line;
            if (type === 0) {
              let offset = 0;
              if (i === 0) {
                if (this._buf.hasContent() && (comment.type === "CommentLine" || commentStartLine !== commentEndLine)) {
                  offset = leadingCommentNewline = 1;
                }
              } else {
                offset = commentStartLine - lastLine;
              }
              lastLine = commentEndLine;
              if (offset > 0 && !_noLineTerminator) {
                this.newline(offset, _flags);
              }
              this._printComment(comment, 1);
              if (i + 1 === len) {
                const count = Math.max(nodeStartLine - lastLine, leadingCommentNewline);
                if (count > 0 && !_noLineTerminator) {
                  this.newline(count, _flags);
                }
                lastLine = nodeStartLine;
              }
            } else if (type === 1) {
              const offset = commentStartLine - (i === 0 ? nodeStartLine : lastLine);
              lastLine = commentEndLine;
              if (offset > 0 && !_noLineTerminator) {
                this.newline(offset, _flags);
              }
              this._printComment(comment, 1);
              if (i + 1 === len) {
                const count = Math.min(1, nodeEndLine - lastLine);
                if (count > 0 && !_noLineTerminator) {
                  this.newline(count, _flags);
                }
                lastLine = nodeEndLine;
              }
            } else {
              const offset = commentStartLine - (i === 0 ? nodeEndLine - lineOffset : lastLine);
              lastLine = commentEndLine;
              if (offset > 0 && !_noLineTerminator) {
                this.newline(offset, _flags);
              }
              this._printComment(comment, 1);
            }
          } else {
            hasLoc = false;
            if (shouldPrint !== 1) {
              continue;
            }
            if (len === 1) {
              const singleLine = comment.loc ? comment.loc.start.line === comment.loc.end.line : !HAS_NEWLINE.test(comment.value);
              const shouldSkipNewline = singleLine && !isStatement(node) && !isClassBody(parent) && !isTSInterfaceBody(parent) && !isTSEnumMember(node);
              if (type === 0) {
                this._printComment(comment, shouldSkipNewline && node.type !== "ObjectExpression" || singleLine && isFunction(parent) && parent.body === node ? 1 : 0);
              } else if (shouldSkipNewline && type === 2) {
                this._printComment(comment, 1);
              } else {
                this._printComment(comment, 0);
              }
            } else if (type === 1 && !(node.type === "ObjectExpression" && node.properties.length > 1) && node.type !== "ClassBody" && node.type !== "TSInterfaceBody") {
              this._printComment(comment, i === 0 ? 2 : i === len - 1 ? 3 : 0);
            } else {
              this._printComment(comment, 0);
            }
          }
        }
        if (type === 2 && hasLoc && lastLine) {
          this._lastCommentLine = lastLine;
        }
        return 2;
      }
    };
    var _default = exports.default = Printer;
    function commaSeparator(occurrenceCount, last) {
      this.tokenChar(44, occurrenceCount);
      if (!last) this.space();
    }
  }
});

// ../node_modules/@babel/generator/lib/index.js
var require_lib4 = __commonJS({
  "../node_modules/@babel/generator/lib/index.js"(exports) {
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    exports.generate = generate;
    var _sourceMap = require_source_map();
    var _printer = require_printer();
    function normalizeOptions(code, opts, ast) {
      var _opts$recordAndTupleS;
      if (opts.experimental_preserveFormat) {
        if (typeof code !== "string") {
          throw new Error("`experimental_preserveFormat` requires the original `code` to be passed to @babel/generator as a string");
        }
        if (!opts.retainLines) {
          throw new Error("`experimental_preserveFormat` requires `retainLines` to be set to `true`");
        }
        if (opts.compact && opts.compact !== "auto") {
          throw new Error("`experimental_preserveFormat` is not compatible with the `compact` option");
        }
        if (opts.minified) {
          throw new Error("`experimental_preserveFormat` is not compatible with the `minified` option");
        }
        if (opts.jsescOption) {
          throw new Error("`experimental_preserveFormat` is not compatible with the `jsescOption` option");
        }
        if (!Array.isArray(ast.tokens)) {
          throw new Error("`experimental_preserveFormat` requires the AST to have attached the token of the input code. Make sure to enable the `tokens: true` parser option.");
        }
      }
      const format = {
        auxiliaryCommentBefore: opts.auxiliaryCommentBefore,
        auxiliaryCommentAfter: opts.auxiliaryCommentAfter,
        shouldPrintComment: opts.shouldPrintComment,
        preserveFormat: opts.experimental_preserveFormat,
        retainLines: opts.retainLines,
        retainFunctionParens: opts.retainFunctionParens,
        comments: opts.comments == null || opts.comments,
        compact: opts.compact,
        minified: opts.minified,
        concise: opts.concise,
        indent: {
          adjustMultilineComment: true,
          style: "  "
        },
        jsescOption: Object.assign({
          quotes: "double",
          wrap: true,
          minimal: false
        }, opts.jsescOption),
        topicToken: opts.topicToken
      };
      format.decoratorsBeforeExport = opts.decoratorsBeforeExport;
      format.jsescOption.json = opts.jsonCompatibleStrings;
      format.recordAndTupleSyntaxType = (_opts$recordAndTupleS = opts.recordAndTupleSyntaxType) != null ? _opts$recordAndTupleS : "hash";
      format.importAttributesKeyword = opts.importAttributesKeyword;
      if (format.minified) {
        format.compact = true;
        format.shouldPrintComment = format.shouldPrintComment || (() => format.comments);
      } else {
        format.shouldPrintComment = format.shouldPrintComment || ((value) => format.comments || value.includes("@license") || value.includes("@preserve"));
      }
      if (format.compact === "auto") {
        format.compact = typeof code === "string" && code.length > 5e5;
        if (format.compact) {
          console.error(`[BABEL] Note: The code generator has deoptimised the styling of ${opts.filename} as it exceeds the max of ${"500KB"}.`);
        }
      }
      if (format.compact || format.preserveFormat) {
        format.indent.adjustMultilineComment = false;
      }
      const {
        auxiliaryCommentBefore,
        auxiliaryCommentAfter,
        shouldPrintComment
      } = format;
      if (auxiliaryCommentBefore && !shouldPrintComment(auxiliaryCommentBefore)) {
        format.auxiliaryCommentBefore = void 0;
      }
      if (auxiliaryCommentAfter && !shouldPrintComment(auxiliaryCommentAfter)) {
        format.auxiliaryCommentAfter = void 0;
      }
      return format;
    }
    exports.CodeGenerator = class CodeGenerator {
      constructor(ast, opts = {}, code) {
        this._ast = void 0;
        this._format = void 0;
        this._map = void 0;
        this._ast = ast;
        this._format = normalizeOptions(code, opts, ast);
        this._map = opts.sourceMaps ? new _sourceMap.default(opts, code) : null;
      }
      generate() {
        const printer = new _printer.default(this._format, this._map);
        return printer.generate(this._ast);
      }
    };
    function generate(ast, opts = {}, code) {
      const format = normalizeOptions(code, opts, ast);
      const map = opts.sourceMaps ? new _sourceMap.default(opts, code) : null;
      const printer = new _printer.default(format, map, ast.tokens, typeof code === "string" ? code : null);
      return printer.generate(ast);
    }
    var _default = exports.default = generate;
  }
});
export default require_lib4();
