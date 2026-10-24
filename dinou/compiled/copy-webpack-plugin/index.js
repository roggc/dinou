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

// ../node_modules/schema-utils/dist/util/memorize.js
var require_memorize = __commonJS({
  "../node_modules/schema-utils/dist/util/memorize.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    var memoize = (fn) => {
      let cache = false;
      let result;
      return () => {
        if (cache) {
          return result;
        }
        result = fn();
        cache = true;
        fn = void 0;
        return result;
      };
    };
    var _default = exports.default = memoize;
  }
});

// ../node_modules/schema-utils/dist/util/Range.js
var require_Range = __commonJS({
  "../node_modules/schema-utils/dist/util/Range.js"(exports, module) {
    "use strict";
    var Range = class _Range {
      /**
       * @param {"left" | "right"} side side
       * @param {boolean} exclusive exclusive
       * @returns {">" | ">=" | "<" | "<="} operator
       */
      static getOperator(side, exclusive) {
        if (side === "left") {
          return exclusive ? ">" : ">=";
        }
        return exclusive ? "<" : "<=";
      }
      /**
       * @param {number} value value
       * @param {boolean} logic is not logic applied
       * @param {boolean} exclusive is range exclusive
       * @returns {string} formatted right
       */
      static formatRight(value, logic, exclusive) {
        if (logic === false) {
          return _Range.formatLeft(value, !logic, !exclusive);
        }
        return `should be ${_Range.getOperator("right", exclusive)} ${value}`;
      }
      /**
       * @param {number} value value
       * @param {boolean} logic is not logic applied
       * @param {boolean} exclusive is range exclusive
       * @returns {string} formatted left
       */
      static formatLeft(value, logic, exclusive) {
        if (logic === false) {
          return _Range.formatRight(value, !logic, !exclusive);
        }
        return `should be ${_Range.getOperator("left", exclusive)} ${value}`;
      }
      /**
       * @param {number} start left side value
       * @param {number} end right side value
       * @param {boolean} startExclusive is range exclusive from left side
       * @param {boolean} endExclusive is range exclusive from right side
       * @param {boolean} logic is not logic applied
       * @returns {string} formatted range
       */
      static formatRange(start, end, startExclusive, endExclusive, logic) {
        let result = "should be";
        result += ` ${_Range.getOperator(logic ? "left" : "right", logic ? startExclusive : !startExclusive)} ${start} `;
        result += logic ? "and" : "or";
        result += ` ${_Range.getOperator(logic ? "right" : "left", logic ? endExclusive : !endExclusive)} ${end}`;
        return result;
      }
      /**
       * @param {RangeValue[]} values values
       * @param {boolean} logic is not logic applied
       * @returns {RangeValue} computed value and it's exclusive flag
       */
      static getRangeValue(values, logic) {
        let minMax = logic ? Infinity : -Infinity;
        let j = -1;
        const predicate = logic ? (
          /** @type {RangeValueCallback} */
          ([value]) => value <= minMax
        ) : (
          /** @type {RangeValueCallback} */
          ([value]) => value >= minMax
        );
        for (let i = 0; i < values.length; i++) {
          if (predicate(values[i])) {
            [minMax] = values[i];
            j = i;
          }
        }
        if (j > -1) {
          return values[j];
        }
        return [Infinity, true];
      }
      constructor() {
        this._left = [];
        this._right = [];
      }
      /**
       * @param {number} value value
       * @param {boolean=} exclusive true when exclusive, otherwise false
       */
      left(value, exclusive = false) {
        this._left.push([value, exclusive]);
      }
      /**
       * @param {number} value value
       * @param {boolean=} exclusive true when exclusive, otherwise false
       */
      right(value, exclusive = false) {
        this._right.push([value, exclusive]);
      }
      /**
       * @param {boolean} logic is not logic applied
       * @returns {string} "smart" range string representation
       */
      format(logic = true) {
        const [start, leftExclusive] = _Range.getRangeValue(this._left, logic);
        const [end, rightExclusive] = _Range.getRangeValue(this._right, !logic);
        if (!Number.isFinite(start) && !Number.isFinite(end)) {
          return "";
        }
        const realStart = leftExclusive ? start + 1 : start;
        const realEnd = rightExclusive ? end - 1 : end;
        if (realStart === realEnd) {
          return `should be ${logic ? "" : "!"}= ${realStart}`;
        }
        if (Number.isFinite(start) && !Number.isFinite(end)) {
          return _Range.formatLeft(start, logic, leftExclusive);
        }
        if (!Number.isFinite(start) && Number.isFinite(end)) {
          return _Range.formatRight(end, logic, rightExclusive);
        }
        return _Range.formatRange(start, end, leftExclusive, rightExclusive, logic);
      }
    };
    module.exports = Range;
  }
});

// ../node_modules/schema-utils/dist/util/humanize.js
var require_humanize = __commonJS({
  "../node_modules/schema-utils/dist/util/humanize.js"(exports, module) {
    "use strict";
    var CAMEL_CASE_REGEXP = /([^A-Z])([A-Z])/g;
    var LEADING_UNDERSCORE_REGEXP = /^_/;
    module.exports = function humanize(str) {
      if (str.length < 2) {
        return str;
      }
      if (str.includes("-")) {
        return str.split("-").join(" ").toLowerCase();
      }
      const withoutLeadingUnderscore = str.replace(LEADING_UNDERSCORE_REGEXP, "");
      if (withoutLeadingUnderscore.includes("_")) {
        return withoutLeadingUnderscore.split("_").join(" ").toLowerCase();
      }
      return withoutLeadingUnderscore.replace(CAMEL_CASE_REGEXP, "$1 $2").toLowerCase();
    };
  }
});

// ../node_modules/schema-utils/dist/util/hints.js
var require_hints = __commonJS({
  "../node_modules/schema-utils/dist/util/hints.js"(exports, module) {
    "use strict";
    var Range = require_Range();
    var humanize = require_humanize();
    var STRING_TYPE_REGEXP = /string$/;
    var FORMAT_NAME_REGEXP = /^[A-Za-z][A-Za-z\d]*(?:[-_][A-Za-z\d]+)*$/;
    module.exports.numberHints = function numberHints(schema, logic) {
      const hints = [schema.type === "integer" ? "integer" : "number"];
      const range = new Range();
      if (typeof schema.minimum === "number") {
        range.left(schema.minimum);
      }
      if (typeof schema.exclusiveMinimum === "number") {
        range.left(schema.exclusiveMinimum, true);
      }
      if (typeof schema.maximum === "number") {
        range.right(schema.maximum);
      }
      if (typeof schema.exclusiveMaximum === "number") {
        range.right(schema.exclusiveMaximum, true);
      }
      const rangeFormat = range.format(logic);
      if (rangeFormat) {
        hints.push(rangeFormat);
      }
      if (typeof schema.multipleOf === "number") {
        hints.push(`should${logic ? "" : " not"} be multiple of ${schema.multipleOf}`);
      }
      return hints;
    };
    module.exports.stringHints = function stringHints(schema, logic) {
      const hints = [];
      let type = "string";
      let formatName = "";
      const currentSchema = {
        ...schema
      };
      if (!logic) {
        const tmpLength = currentSchema.minLength;
        const tmpFormat = currentSchema.formatMinimum;
        currentSchema.minLength = currentSchema.maxLength;
        currentSchema.maxLength = tmpLength;
        currentSchema.formatMinimum = currentSchema.formatMaximum;
        currentSchema.formatMaximum = tmpFormat;
      }
      if (typeof currentSchema.absolutePath === "boolean") {
        type = currentSchema.absolutePath ? "absolute path string" : "relative path string";
      }
      if (typeof currentSchema.minLength === "number") {
        if (currentSchema.minLength === 1) {
          type = "non-empty string";
        } else {
          const length = Math.max(currentSchema.minLength - 1, 0);
          hints.push(`should be longer than ${length} character${length > 1 ? "s" : ""}`);
        }
      }
      if (typeof currentSchema.maxLength === "number") {
        if (currentSchema.maxLength === 0) {
          type = "empty string";
        } else {
          const length = currentSchema.maxLength + 1;
          hints.push(`should be shorter than ${length} character${length > 1 ? "s" : ""}`);
        }
      }
      if (currentSchema.pattern) {
        hints.push(`should${logic ? "" : " not"} match pattern ${JSON.stringify(currentSchema.pattern)}`);
      }
      if (currentSchema.format) {
        if (logic && FORMAT_NAME_REGEXP.test(currentSchema.format)) {
          formatName = humanize(currentSchema.format);
        } else {
          hints.push(`should${logic ? "" : " not"} match format ${JSON.stringify(currentSchema.format)}`);
        }
      }
      if (currentSchema.formatMinimum) {
        hints.push(`should be ${currentSchema.formatExclusiveMinimum ? ">" : ">="} ${JSON.stringify(currentSchema.formatMinimum)}`);
      }
      if (currentSchema.formatMaximum) {
        hints.push(`should be ${currentSchema.formatExclusiveMaximum ? "<" : "<="} ${JSON.stringify(currentSchema.formatMaximum)}`);
      }
      return [formatName ? type.replace(STRING_TYPE_REGEXP, `${formatName} string`) : type, ...hints];
    };
  }
});

// ../node_modules/schema-utils/dist/ValidationError.js
var require_ValidationError = __commonJS({
  "../node_modules/schema-utils/dist/ValidationError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    var _memorize = _interopRequireDefault(require_memorize());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var SPECIFICITY = {
      type: 1,
      not: 1,
      oneOf: 1,
      anyOf: 1,
      if: 1,
      enum: 1,
      const: 1,
      instanceof: 1,
      required: 2,
      pattern: 2,
      patternRequired: 2,
      format: 2,
      formatMinimum: 2,
      formatMaximum: 2,
      minimum: 2,
      exclusiveMinimum: 2,
      maximum: 2,
      exclusiveMaximum: 2,
      multipleOf: 2,
      uniqueItems: 2,
      contains: 2,
      minLength: 2,
      maxLength: 2,
      minItems: 2,
      maxItems: 2,
      minProperties: 2,
      maxProperties: 2,
      dependencies: 2,
      propertyNames: 2,
      additionalItems: 2,
      additionalProperties: 2,
      absolutePath: 2
    };
    var IS_NUMERIC = /^-?\d+$/;
    function isNumeric(value) {
      return IS_NUMERIC.test(value);
    }
    function filterMax(array, fn) {
      const evaluatedMax = array.reduce((max, item) => Math.max(max, fn(item)), 0);
      return array.filter((item) => fn(item) === evaluatedMax);
    }
    function filterDuplicateChildren(children, format) {
      if (children.length < 2) {
        return children;
      }
      const seen = /* @__PURE__ */ new Set();
      const newChildren = [];
      for (const child of children) {
        const message = format(child);
        if (seen.has(message)) {
          continue;
        }
        seen.add(message);
        newChildren.push(child);
      }
      return newChildren;
    }
    function filterChildren(children) {
      let newChildren = children;
      newChildren = filterMax(
        newChildren,
        /**
         * @param {SchemaUtilErrorObject} error error object
         * @returns {number} result
         */
        (error) => error.instancePath ? error.instancePath.length : 0
      );
      newChildren = filterMax(
        newChildren,
        /**
         * @param {SchemaUtilErrorObject} error error object
         * @returns {number} result
         */
        (error) => SPECIFICITY[
          /** @type {keyof typeof SPECIFICITY} */
          error.keyword
        ] || 2
      );
      return newChildren;
    }
    function extractRefs(error) {
      const {
        schema
      } = error;
      if (!Array.isArray(schema)) {
        return [];
      }
      return schema.map(({
        $ref
      }) => $ref).filter(Boolean);
    }
    function findAllChildren(children, schemaPaths, end = children.length) {
      let i = end - 1;
      const predicate = (
        /**
         * @param {string} schemaPath schema path
         * @returns {boolean} predicate
         */
        (schemaPath) => children[i].schemaPath.indexOf(schemaPath) !== 0
      );
      while (i > -1 && !schemaPaths.every(predicate)) {
        if (children[i].keyword === "anyOf" || children[i].keyword === "oneOf") {
          const refs = extractRefs(children[i]);
          const childrenStart = findAllChildren(children, [...refs, children[i].schemaPath], i);
          i = childrenStart - 1;
        } else {
          i -= 1;
        }
      }
      return i + 1;
    }
    function groupChildrenByFirstChild(children) {
      const result = [];
      let i = children.length - 1;
      while (i > 0) {
        const child = children[i];
        if (child.keyword === "anyOf" || child.keyword === "oneOf") {
          const refs = extractRefs(child);
          const childrenStart = findAllChildren(children, [...refs, child.schemaPath], i);
          if (childrenStart !== i) {
            result.push({
              ...child,
              children: children.slice(childrenStart, i)
            });
            i = childrenStart;
          } else {
            result.push(child);
          }
        } else {
          result.push(child);
        }
        i -= 1;
      }
      if (i === 0) {
        result.push(children[i]);
      }
      return result.reverse();
    }
    function indent(str, prefix) {
      const firstNewLine = str.indexOf("\n");
      if (firstNewLine === -1 || firstNewLine === str.length - 1) {
        return str;
      }
      const separator = `
${prefix}`;
      return str.charCodeAt(str.length - 1) === 10 ? `${str.slice(0, -1).split("\n").join(separator)}
` : str.split("\n").join(separator);
    }
    var MAX_LISTED_ERRORS = 100;
    function formatErrorList(errors, bullet, format) {
      const listed = Math.min(errors.length, MAX_LISTED_ERRORS);
      const lines = [];
      for (let i = 0; i < listed; i++) {
        lines.push(`${bullet}${indent(format(errors[i]), "   ")}`);
      }
      const rest = errors.length - listed;
      if (rest > 0) {
        lines.push(`${bullet}and ${rest} more error${rest > 1 ? "s" : ""}`);
      }
      return lines.join("\n");
    }
    function hasNotInSchema(schema) {
      return Boolean(schema.not);
    }
    function findFirstTypedSchema(schema) {
      if (hasNotInSchema(schema)) {
        return findFirstTypedSchema(schema.not);
      }
      return schema;
    }
    function likeNumber(schema) {
      return schema.type === "number" || typeof schema.minimum !== "undefined" || typeof schema.exclusiveMinimum !== "undefined" || typeof schema.maximum !== "undefined" || typeof schema.exclusiveMaximum !== "undefined" || typeof schema.multipleOf !== "undefined";
    }
    function likeInteger(schema) {
      return schema.type === "integer" || typeof schema.minimum !== "undefined" || typeof schema.exclusiveMinimum !== "undefined" || typeof schema.maximum !== "undefined" || typeof schema.exclusiveMaximum !== "undefined" || typeof schema.multipleOf !== "undefined";
    }
    function likeString(schema) {
      return schema.type === "string" || typeof schema.minLength !== "undefined" || typeof schema.maxLength !== "undefined" || typeof schema.pattern !== "undefined" || typeof schema.format !== "undefined" || typeof schema.formatMinimum !== "undefined" || typeof schema.formatMaximum !== "undefined";
    }
    function likeNull(schema) {
      return schema.type === "null";
    }
    function likeBoolean(schema) {
      return schema.type === "boolean";
    }
    function canApplyNot(schema) {
      const typedSchema = findFirstTypedSchema(schema);
      return likeNumber(typedSchema) || likeInteger(typedSchema) || likeString(typedSchema) || likeNull(typedSchema) || likeBoolean(typedSchema);
    }
    function isObject(maybeObj) {
      return typeof maybeObj === "object" && !Array.isArray(maybeObj) && maybeObj !== null;
    }
    function likeArray(schema) {
      return schema.type === "array" || typeof schema.minItems === "number" || typeof schema.maxItems === "number" || typeof schema.uniqueItems !== "undefined" || typeof schema.items !== "undefined" || typeof schema.additionalItems !== "undefined" || typeof schema.contains !== "undefined";
    }
    function likeObject(schema) {
      return schema.type === "object" || typeof schema.minProperties !== "undefined" || typeof schema.maxProperties !== "undefined" || typeof schema.required !== "undefined" || typeof schema.properties !== "undefined" || typeof schema.patternProperties !== "undefined" || typeof schema.additionalProperties !== "undefined" || typeof schema.dependencies !== "undefined" || typeof schema.propertyNames !== "undefined" || typeof schema.patternRequired !== "undefined";
    }
    function getArticle(type) {
      if (/^[aeiou]/i.test(type)) {
        return "an";
      }
      return "a";
    }
    var TYPE_CONSTRAINTS_REGEXP = /\s*\([^()]*\)$/;
    var COMPOSITE_TYPE_REGEXP = /[{}[\]()|\n]/;
    var MAX_LEAF_TYPE_LENGTH = 24;
    var MAX_TYPED_STRUCTURE_LENGTH = 120;
    function getLeafTypeName(type) {
      const name = type.replace(TYPE_CONSTRAINTS_REGEXP, "");
      return name.length > 0 && name.length <= MAX_LEAF_TYPE_LENGTH && !COMPOSITE_TYPE_REGEXP.test(name) ? name : "";
    }
    function getSchemaNonTypes(schema) {
      if (!schema) {
        return "";
      }
      if (!schema.type) {
        if (likeNumber(schema) || likeInteger(schema)) {
          return " | should be any non-number";
        }
        if (likeString(schema)) {
          return " | should be any non-string";
        }
        if (likeArray(schema)) {
          return " | should be any non-array";
        }
        if (likeObject(schema)) {
          return " | should be any non-object";
        }
      }
      return "";
    }
    function formatHints(hints) {
      return hints.length > 0 ? `(${hints.join(", ")})` : "";
    }
    var getUtilHints = (0, _memorize.default)(() => require_hints());
    function getHints(schema, logic) {
      if (likeNumber(schema) || likeInteger(schema)) {
        const util = getUtilHints();
        return util.numberHints(schema, logic);
      } else if (likeString(schema)) {
        const util = getUtilHints();
        return util.stringHints(schema, logic);
      }
      return [];
    }
    var ValidationError = class extends Error {
      /**
       * @param {SchemaUtilErrorObject[]} errors array of error objects
       * @param {Schema} schema schema
       * @param {ValidationErrorConfiguration} configuration configuration
       */
      constructor(errors, schema, configuration = {}) {
        super();
        this.name = "ValidationError";
        this.errors = errors;
        this.schema = schema;
        let headerNameFromSchema;
        let baseDataPathFromSchema;
        if (schema.title && (!configuration.name || !configuration.baseDataPath)) {
          const splittedTitleFromSchema = schema.title.match(/^(.+) (.+)$/);
          if (splittedTitleFromSchema) {
            if (!configuration.name) {
              [, headerNameFromSchema] = splittedTitleFromSchema;
            }
            if (!configuration.baseDataPath) {
              [, , baseDataPathFromSchema] = splittedTitleFromSchema;
            }
          }
        }
        this.headerName = configuration.name || headerNameFromSchema || "Object";
        this.baseDataPath = configuration.baseDataPath || baseDataPathFromSchema || "configuration";
        this.postFormatter = configuration.postFormatter || null;
        const header = `Invalid ${this.baseDataPath} object. ${this.headerName} has been initialized using ${getArticle(this.baseDataPath)} ${this.baseDataPath} object that does not match the API schema.
`;
        this.message = `${header}${this.formatValidationErrors(errors)}`;
      }
      /**
       * @param {string} path path
       * @returns {Schema} schema
       */
      getSchemaPart(path) {
        const newPath = path.split("/");
        let schemaPart = this.schema;
        for (let i = 1; i < newPath.length; i++) {
          const inner = schemaPart[
            /** @type {keyof Schema} */
            newPath[i]
          ];
          if (!inner) {
            break;
          }
          schemaPart = inner;
        }
        return schemaPart;
      }
      /**
       * @param {Schema} schema schema
       * @param {boolean} logic logic
       * @param {object[]} prevSchemas prev schemas
       * @returns {string} formatted schema
       */
      formatSchema(schema, logic = true, prevSchemas = []) {
        let newLogic = logic;
        const formatInnerSchema = (
          /**
           * @param {Schema} innerSchema inner schema
           * @param {boolean=} addSelf true when need to add self
           * @returns {string} formatted schema
           */
          (innerSchema, addSelf) => {
            if (!addSelf) {
              return this.formatSchema(innerSchema, newLogic, prevSchemas);
            }
            if (prevSchemas.includes(innerSchema)) {
              return "(recursive)";
            }
            return this.formatSchema(innerSchema, newLogic, [...prevSchemas, schema]);
          }
        );
        if (hasNotInSchema(schema) && !likeObject(schema)) {
          if (canApplyNot(schema.not)) {
            newLogic = !logic;
            return formatInnerSchema(schema.not);
          }
          const needApplyLogicHere = !schema.not.not;
          const prefix = logic ? "" : "non ";
          newLogic = !logic;
          return needApplyLogicHere ? prefix + formatInnerSchema(schema.not) : formatInnerSchema(schema.not);
        }
        if (
          /** @type {Schema & { instanceof: string | string[] }} */
          schema.instanceof
        ) {
          const {
            instanceof: value
          } = (
            /** @type {Schema & { instanceof: string | string[] }} */
            schema
          );
          const values = !Array.isArray(value) ? [value] : value;
          return values.map(
            /**
             * @param {string} item item
             * @returns {string} result
             */
            (item) => item === "Function" ? "function" : item
          ).join(" | ");
        }
        if (schema.enum) {
          const enumValues = (
            /** @type {EXPECTED_ANY[]} */
            schema.enum.map((item) => {
              if (item === null && schema.undefinedAsNull) {
                return `${JSON.stringify(item)} | undefined`;
              }
              return JSON.stringify(item);
            }).join(" | ")
          );
          return `${enumValues}`;
        }
        if (typeof schema.const !== "undefined") {
          return JSON.stringify(schema.const);
        }
        if (schema.oneOf) {
          return (
            /** @type {Schema[]} */
            schema.oneOf.map((item) => formatInnerSchema(item, true)).join(" | ")
          );
        }
        if (schema.anyOf) {
          return (
            /** @type {Schema[]} */
            schema.anyOf.map((item) => formatInnerSchema(item, true)).join(" | ")
          );
        }
        if (schema.allOf) {
          return (
            /** @type {Schema[]} */
            schema.allOf.map((item) => formatInnerSchema(item, true)).join(" & ")
          );
        }
        if (
          /** @type {JSONSchema7} */
          schema.if
        ) {
          const {
            if: ifValue,
            then: thenValue,
            else: elseValue
          } = (
            /** @type {JSONSchema7} */
            schema
          );
          return `${ifValue ? `if ${ifValue === true ? "true" : formatInnerSchema(ifValue)}` : ""}${thenValue ? ` then ${thenValue === true ? "true" : formatInnerSchema(thenValue)}` : ""}${elseValue ? ` else ${elseValue === true ? "true" : formatInnerSchema(elseValue)}` : ""}`;
        }
        if (schema.$ref) {
          return formatInnerSchema(this.getSchemaPart(schema.$ref), true);
        }
        if (likeNumber(schema) || likeInteger(schema)) {
          const [type, ...hints] = getHints(schema, logic);
          const str = `${type}${hints.length > 0 ? ` ${formatHints(hints)}` : ""}`;
          return logic ? str : hints.length > 0 ? `non-${type} | ${str}` : `non-${type}`;
        }
        if (likeString(schema)) {
          const [type, ...hints] = getHints(schema, logic);
          const str = `${type}${hints.length > 0 ? ` ${formatHints(hints)}` : ""}`;
          return logic ? str : str === "string" ? "non-string" : `non-string | ${str}`;
        }
        if (likeBoolean(schema)) {
          return `${logic ? "" : "non-"}boolean`;
        }
        if (likeArray(schema)) {
          newLogic = true;
          const hints = [];
          if (typeof schema.minItems === "number") {
            hints.push(`should not have fewer than ${schema.minItems} item${schema.minItems > 1 ? "s" : ""}`);
          }
          if (typeof schema.maxItems === "number") {
            hints.push(`should not have more than ${schema.maxItems} item${schema.maxItems > 1 ? "s" : ""}`);
          }
          if (schema.uniqueItems) {
            hints.push("should not have duplicate items");
          }
          const hasAdditionalItems = typeof schema.additionalItems === "undefined" || Boolean(schema.additionalItems);
          let items = "";
          if (schema.items) {
            if (Array.isArray(schema.items) && schema.items.length > 0) {
              items = `${/** @type {Schema[]} */
              schema.items.map((item) => formatInnerSchema(item)).join(", ")}`;
              if (hasAdditionalItems && schema.additionalItems && isObject(schema.additionalItems) && Object.keys(schema.additionalItems).length > 0) {
                hints.push(`additional items should be ${schema.additionalItems === true ? "added" : formatInnerSchema(schema.additionalItems)}`);
              }
            } else if (schema.items && Object.keys(schema.items).length > 0 && schema.items !== true) {
              items = `${formatInnerSchema(schema.items)}`;
            } else {
              items = "any";
            }
          } else {
            items = "any";
          }
          if (schema.contains && Object.keys(schema.contains).length > 0) {
            hints.push(`should contains at least one ${this.formatSchema(schema.contains)} item`);
          }
          return `[${items}${hasAdditionalItems ? ", ..." : ""}]${hints.length > 0 ? ` (${hints.join(", ")})` : ""}`;
        }
        if (likeObject(schema)) {
          newLogic = true;
          const hints = [];
          if (typeof schema.minProperties === "number") {
            hints.push(`should not have fewer than ${schema.minProperties} ${schema.minProperties > 1 ? "properties" : "property"}`);
          }
          if (typeof schema.maxProperties === "number") {
            hints.push(`should not have more than ${schema.maxProperties} ${schema.minProperties && schema.minProperties > 1 ? "properties" : "property"}`);
          }
          if (schema.patternProperties && Object.keys(schema.patternProperties).length > 0) {
            const patternProperties = Object.keys(schema.patternProperties);
            hints.push(`additional property names should match pattern${patternProperties.length > 1 ? "s" : ""} ${patternProperties.map((pattern) => JSON.stringify(pattern)).join(" | ")}`);
          }
          const properties = schema.properties ? Object.keys(schema.properties) : [];
          const required = (
            /** @type {string[]} */
            schema.required ? schema.required : []
          );
          const allProperties = [.../* @__PURE__ */ new Set(
            /** @type {string[]} */
            [...required, ...properties]
          )];
          const namedProperties = allProperties.map((property) => {
            const name = `${property}${required.includes(property) ? "" : "?"}`;
            const propertySchema = schema.properties ? schema.properties[property] : void 0;
            const type = propertySchema && propertySchema !== true ? getLeafTypeName(formatInnerSchema(propertySchema, true)) : "";
            return {
              name,
              type
            };
          });
          const otherProperties = typeof schema.additionalProperties === "undefined" || Boolean(schema.additionalProperties) ? schema.additionalProperties && isObject(schema.additionalProperties) && schema.additionalProperties !== true ? [`<key>: ${formatInnerSchema(schema.additionalProperties)}`] : ["\u2026"] : [];
          const typedStructure = [...namedProperties.map(({
            name,
            type
          }) => `${name}${type ? `: ${type}` : ""}`), ...otherProperties].join(", ");
          const objectStructure = typedStructure.length <= MAX_TYPED_STRUCTURE_LENGTH ? typedStructure : [...namedProperties.map(({
            name
          }) => name), ...otherProperties].join(", ");
          const {
            dependencies,
            propertyNames,
            patternRequired
          } = (
            /** @type {Schema & { patternRequired?: string[] }} */
            schema
          );
          if (dependencies) {
            for (const dependencyName of Object.keys(dependencies)) {
              const dependency = dependencies[dependencyName];
              if (Array.isArray(dependency)) {
                hints.push(`should have ${dependency.length > 1 ? "properties" : "property"} ${dependency.map((dep) => `'${dep}'`).join(", ")} when property '${dependencyName}' is present`);
              } else {
                hints.push(`should be valid according to the schema ${typeof dependency === "boolean" ? `${dependency}` : formatInnerSchema(dependency)} when property '${dependencyName}' is present`);
              }
            }
          }
          if (propertyNames && Object.keys(propertyNames).length > 0) {
            hints.push(`each property name should match format ${JSON.stringify(schema.propertyNames.format)}`);
          }
          if (patternRequired && patternRequired.length > 0) {
            hints.push(`should have property matching pattern ${patternRequired.map(
              /**
               * @param {string} item item
               * @returns {string} stringified item
               */
              (item) => JSON.stringify(item)
            )}`);
          }
          return `object {${objectStructure ? ` ${objectStructure} ` : ""}}${hints.length > 0 ? ` (${hints.join(", ")})` : ""}`;
        }
        if (likeNull(schema)) {
          return `${logic ? "" : "non-"}null`;
        }
        if (Array.isArray(schema.type)) {
          return `${schema.type.join(" | ")}`;
        }
        return JSON.stringify(schema, null, 2);
      }
      /**
       * @param {Schema=} schemaPart schema part
       * @param {(boolean | string[])=} additionalPath additional path
       * @param {boolean=} needDot true when need dot
       * @param {boolean=} logic logic
       * @returns {string} schema part text
       */
      getSchemaPartText(schemaPart, additionalPath, needDot = false, logic = true) {
        if (!schemaPart) {
          return "";
        }
        if (Array.isArray(additionalPath)) {
          for (let i = 0; i < additionalPath.length; i++) {
            const inner = schemaPart[
              /** @type {keyof Schema} */
              additionalPath[i]
            ];
            if (inner) {
              schemaPart = inner;
            } else {
              break;
            }
          }
        }
        while (schemaPart.$ref) {
          schemaPart = this.getSchemaPart(schemaPart.$ref);
        }
        let schemaText = `${this.formatSchema(schemaPart, logic)}${needDot ? "." : ""}`;
        if (schemaPart.description) {
          schemaText += `
-> ${schemaPart.description}`;
        }
        if (schemaPart.link) {
          schemaText += `
-> Read more at ${schemaPart.link}`;
        }
        return schemaText;
      }
      /**
       * @param {Schema=} schemaPart schema part
       * @returns {string} schema part description
       */
      getSchemaPartDescription(schemaPart) {
        if (!schemaPart) {
          return "";
        }
        while (schemaPart.$ref) {
          schemaPart = this.getSchemaPart(schemaPart.$ref);
        }
        let schemaText = "";
        if (schemaPart.description) {
          schemaText += `
-> ${schemaPart.description}`;
        }
        if (schemaPart.link) {
          schemaText += `
-> Read more at ${schemaPart.link}`;
        }
        return schemaText;
      }
      /**
       * @param {SchemaUtilErrorObject} error error object
       * @returns {string} formatted error object
       */
      formatValidationError(error) {
        const {
          keyword,
          instancePath: errorInstancePath
        } = error;
        let instancePath = this.baseDataPath;
        for (const part of errorInstancePath.split("/")) {
          if (part.length === 0) {
            continue;
          }
          if (isNumeric(part)) {
            instancePath += `[${part}]`;
          } else if (part.charCodeAt(0) === 91) {
            instancePath += part;
          } else {
            instancePath += `.${part}`;
          }
        }
        switch (keyword) {
          case "type": {
            const {
              parentSchema,
              params
            } = error;
            switch (params.type) {
              case "number":
                return `${instancePath} should be a ${this.getSchemaPartText(parentSchema, false, true)}`;
              case "integer":
                return `${instancePath} should be an ${this.getSchemaPartText(parentSchema, false, true)}`;
              case "string": {
                const stringType = this.getSchemaPartText(parentSchema, false, true);
                return `${instancePath} should be ${getArticle(stringType)} ${stringType}`;
              }
              case "boolean":
                return `${instancePath} should be a ${this.getSchemaPartText(parentSchema, false, true)}`;
              case "array":
                return `${instancePath} should be an array:
${this.getSchemaPartText(parentSchema)}`;
              case "object":
                return `${instancePath} should be an object:
${this.getSchemaPartText(parentSchema)}`;
              case "null":
                return `${instancePath} should be a ${this.getSchemaPartText(parentSchema, false, true)}`;
              default:
                return `${instancePath} should be:
${this.getSchemaPartText(parentSchema)}`;
            }
          }
          case "instanceof": {
            const {
              parentSchema
            } = error;
            return `${instancePath} should be an instance of ${this.getSchemaPartText(parentSchema, false, true)}`;
          }
          case "pattern": {
            const {
              params,
              parentSchema
            } = error;
            const {
              pattern
            } = params;
            return `${instancePath} should match pattern ${JSON.stringify(pattern)}${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
          }
          case "format": {
            const {
              params,
              parentSchema
            } = error;
            const {
              format
            } = params;
            return `${instancePath} should match format ${JSON.stringify(format)}${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
          }
          case "formatMinimum":
          case "formatExclusiveMinimum":
          case "formatMaximum":
          case "formatExclusiveMaximum": {
            const {
              params,
              parentSchema
            } = error;
            const {
              comparison,
              limit
            } = params;
            return `${instancePath} should be ${comparison} ${JSON.stringify(limit)}${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
          }
          case "minimum":
          case "maximum":
          case "exclusiveMinimum":
          case "exclusiveMaximum": {
            const {
              parentSchema,
              params
            } = error;
            const {
              comparison,
              limit
            } = params;
            const [, ...hints] = getHints(
              /** @type {Schema} */
              parentSchema,
              true
            );
            if (hints.length === 0) {
              hints.push(`should be ${comparison} ${limit}`);
            }
            return `${instancePath} ${hints.join(" ")}${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
          }
          case "multipleOf": {
            const {
              params,
              parentSchema
            } = error;
            const {
              multipleOf
            } = params;
            return `${instancePath} should be multiple of ${multipleOf}${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
          }
          case "patternRequired": {
            const {
              params,
              parentSchema
            } = error;
            const {
              missingPattern
            } = params;
            return `${instancePath} should have property matching pattern ${JSON.stringify(missingPattern)}${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
          }
          case "minLength": {
            const {
              params,
              parentSchema
            } = error;
            const {
              limit
            } = params;
            if (limit === 1) {
              return `${instancePath} should be a non-empty string${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
            }
            const length = limit - 1;
            return `${instancePath} should be longer than ${length} character${length > 1 ? "s" : ""}${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
          }
          case "minItems": {
            const {
              params,
              parentSchema
            } = error;
            const {
              limit
            } = params;
            if (limit === 1) {
              return `${instancePath} should be a non-empty array${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
            }
            return `${instancePath} should not have fewer than ${limit} items${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
          }
          case "minProperties": {
            const {
              params,
              parentSchema
            } = error;
            const {
              limit
            } = params;
            if (limit === 1) {
              return `${instancePath} should be a non-empty object${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
            }
            return `${instancePath} should not have fewer than ${limit} properties${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
          }
          case "maxLength": {
            const {
              params,
              parentSchema
            } = error;
            const {
              limit
            } = params;
            const max = limit + 1;
            return `${instancePath} should be shorter than ${max} character${max > 1 ? "s" : ""}${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
          }
          case "maxItems": {
            const {
              params,
              parentSchema
            } = error;
            const {
              limit
            } = params;
            return `${instancePath} should not have more than ${limit} items${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
          }
          case "maxProperties": {
            const {
              params,
              parentSchema
            } = error;
            const {
              limit
            } = params;
            return `${instancePath} should not have more than ${limit} properties${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
          }
          case "uniqueItems": {
            const {
              params,
              parentSchema
            } = error;
            const {
              i
            } = params;
            return `${instancePath} should not contain the item '${/** @type {{ data: EXPECTED_ANY[] }} * */
            error.data[i]}' twice${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
          }
          case "additionalItems": {
            const {
              params,
              parentSchema
            } = error;
            const {
              limit
            } = params;
            return `${instancePath} should not have more than ${limit} items${getSchemaNonTypes(parentSchema)}. These items are valid:
${this.getSchemaPartText(parentSchema)}`;
          }
          case "contains": {
            const {
              parentSchema
            } = error;
            return `${instancePath} should contains at least one ${this.getSchemaPartText(parentSchema, ["contains"])} item${getSchemaNonTypes(parentSchema)}.`;
          }
          case "required": {
            const {
              parentSchema,
              params
            } = error;
            const missingProperty = params.missingProperty.replace(/^\./, "");
            const hasProperty = parentSchema && Boolean(
              /** @type {Schema} */
              parentSchema.properties && /** @type {Schema} */
              parentSchema.properties[missingProperty]
            );
            return `${instancePath} misses the property '${missingProperty}'${getSchemaNonTypes(parentSchema)}.${hasProperty ? ` Should be:
${this.getSchemaPartText(parentSchema, ["properties", missingProperty])}` : this.getSchemaPartDescription(parentSchema)}`;
          }
          case "additionalProperties": {
            const {
              params,
              parentSchema
            } = error;
            const {
              additionalProperty
            } = params;
            return `${instancePath} has an unknown property '${additionalProperty}'${getSchemaNonTypes(parentSchema)}. These properties are valid:
${this.getSchemaPartText(parentSchema)}`;
          }
          case "dependencies": {
            const {
              params,
              parentSchema
            } = error;
            const {
              property,
              deps
            } = params;
            const dependencies = deps.split(",").map(
              /**
               * @param {string} dep dependency
               * @returns {string} normalized dependency
               */
              (dep) => `'${dep.trim()}'`
            ).join(", ");
            return `${instancePath} should have properties ${dependencies} when property '${property}' is present${getSchemaNonTypes(parentSchema)}.${this.getSchemaPartDescription(parentSchema)}`;
          }
          case "propertyNames": {
            const {
              params,
              parentSchema,
              schema
            } = error;
            const {
              propertyName
            } = params;
            return `${instancePath} property name '${propertyName}' is invalid${getSchemaNonTypes(parentSchema)}. Property names should be match format ${JSON.stringify(schema.format)}.${this.getSchemaPartDescription(parentSchema)}`;
          }
          case "enum": {
            const {
              parentSchema
            } = error;
            if (parentSchema && /** @type {Schema} */
            parentSchema.enum && /** @type {Schema} */
            parentSchema.enum.length === 1) {
              return `${instancePath} should be ${this.getSchemaPartText(parentSchema, false, true)}`;
            }
            return `${instancePath} should be one of these:
${this.getSchemaPartText(parentSchema)}`;
          }
          case "const": {
            const {
              parentSchema
            } = error;
            return `${instancePath} should be equal to constant ${this.getSchemaPartText(parentSchema, false, true)}`;
          }
          case "not": {
            const postfix = likeObject(
              /** @type {Schema} */
              error.parentSchema
            ) ? `
${this.getSchemaPartText(error.parentSchema)}` : "";
            const schemaOutput = this.getSchemaPartText(error.schema, false, false, false);
            if (canApplyNot(error.schema)) {
              return `${instancePath} should be any ${schemaOutput}${postfix}.`;
            }
            const {
              schema,
              parentSchema
            } = error;
            return `${instancePath} should not be ${this.getSchemaPartText(schema, false, true)}${parentSchema && likeObject(parentSchema) ? `
${this.getSchemaPartText(parentSchema)}` : ""}`;
          }
          case "oneOf":
          case "anyOf": {
            const {
              parentSchema,
              children
            } = error;
            if (children && children.length > 0) {
              if (error.schema.length === 1) {
                const lastChild = children[children.length - 1];
                const remainingChildren = children.slice(0, -1);
                return this.formatValidationError({
                  ...lastChild,
                  children: remainingChildren,
                  parentSchema: {
                    ...parentSchema,
                    ...lastChild.parentSchema
                  }
                });
              }
              let filteredChildren = filterDuplicateChildren(filterChildren(children), (nestedError) => this.formatValidationError(nestedError));
              if (filteredChildren.length === 1) {
                return this.formatValidationError(filteredChildren[0]);
              }
              filteredChildren = groupChildrenByFirstChild(filteredChildren);
              return `${instancePath} should be one of these:
${this.getSchemaPartText(parentSchema)}
Details:
${formatErrorList(filteredChildren, " * ", (nestedError) => this.formatValidationError(nestedError))}`;
            }
            return `${instancePath} should be one of these:
${this.getSchemaPartText(parentSchema)}`;
          }
          case "if": {
            const {
              params,
              parentSchema
            } = error;
            const {
              failingKeyword
            } = params;
            return `${instancePath} should match "${failingKeyword}" schema:
${this.getSchemaPartText(parentSchema, [failingKeyword])}`;
          }
          case "absolutePath": {
            const {
              message,
              parentSchema
            } = error;
            return `${instancePath}: ${message}${this.getSchemaPartDescription(parentSchema)}`;
          }
          /* istanbul ignore next */
          default: {
            const {
              message,
              parentSchema
            } = error;
            const ErrorInJSON = JSON.stringify(error, null, 2);
            return `${instancePath} ${message} (${ErrorInJSON}).
${this.getSchemaPartText(parentSchema, false)}`;
          }
        }
      }
      /**
       * @param {SchemaUtilErrorObject[]} errors errors
       * @returns {string} formatted errors
       */
      formatValidationErrors(errors) {
        return formatErrorList(errors, " - ", (error) => {
          const formattedError = this.formatValidationError(error);
          return this.postFormatter ? this.postFormatter(formattedError, error) : formattedError;
        });
      }
    };
    var _default = exports.default = ValidationError;
  }
});

// ../node_modules/ajv/dist/compile/codegen/code.js
var require_code = __commonJS({
  "../node_modules/ajv/dist/compile/codegen/code.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.regexpCode = exports.getEsmExportName = exports.getProperty = exports.safeStringify = exports.stringify = exports.strConcat = exports.addCodeArg = exports.str = exports._ = exports.nil = exports._Code = exports.Name = exports.IDENTIFIER = exports._CodeOrName = void 0;
    var _CodeOrName = class {
    };
    exports._CodeOrName = _CodeOrName;
    exports.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
    var Name = class extends _CodeOrName {
      constructor(s) {
        super();
        if (!exports.IDENTIFIER.test(s))
          throw new Error("CodeGen: name must be a valid identifier");
        this.str = s;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        return false;
      }
      get names() {
        return { [this.str]: 1 };
      }
    };
    exports.Name = Name;
    var _Code = class extends _CodeOrName {
      constructor(code) {
        super();
        this._items = typeof code === "string" ? [code] : code;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        if (this._items.length > 1)
          return false;
        const item = this._items[0];
        return item === "" || item === '""';
      }
      get str() {
        var _a;
        return (_a = this._str) !== null && _a !== void 0 ? _a : this._str = this._items.reduce((s, c) => `${s}${c}`, "");
      }
      get names() {
        var _a;
        return (_a = this._names) !== null && _a !== void 0 ? _a : this._names = this._items.reduce((names, c) => {
          if (c instanceof Name)
            names[c.str] = (names[c.str] || 0) + 1;
          return names;
        }, {});
      }
    };
    exports._Code = _Code;
    exports.nil = new _Code("");
    function _(strs, ...args) {
      const code = [strs[0]];
      let i = 0;
      while (i < args.length) {
        addCodeArg(code, args[i]);
        code.push(strs[++i]);
      }
      return new _Code(code);
    }
    exports._ = _;
    var plus = new _Code("+");
    function str(strs, ...args) {
      const expr = [safeStringify(strs[0])];
      let i = 0;
      while (i < args.length) {
        expr.push(plus);
        addCodeArg(expr, args[i]);
        expr.push(plus, safeStringify(strs[++i]));
      }
      optimize(expr);
      return new _Code(expr);
    }
    exports.str = str;
    function addCodeArg(code, arg) {
      if (arg instanceof _Code)
        code.push(...arg._items);
      else if (arg instanceof Name)
        code.push(arg);
      else
        code.push(interpolate(arg));
    }
    exports.addCodeArg = addCodeArg;
    function optimize(expr) {
      let i = 1;
      while (i < expr.length - 1) {
        if (expr[i] === plus) {
          const res = mergeExprItems(expr[i - 1], expr[i + 1]);
          if (res !== void 0) {
            expr.splice(i - 1, 3, res);
            continue;
          }
          expr[i++] = "+";
        }
        i++;
      }
    }
    function mergeExprItems(a, b) {
      if (b === '""')
        return a;
      if (a === '""')
        return b;
      if (typeof a == "string") {
        if (b instanceof Name || a[a.length - 1] !== '"')
          return;
        if (typeof b != "string")
          return `${a.slice(0, -1)}${b}"`;
        if (b[0] === '"')
          return a.slice(0, -1) + b.slice(1);
        return;
      }
      if (typeof b == "string" && b[0] === '"' && !(a instanceof Name))
        return `"${a}${b.slice(1)}`;
      return;
    }
    function strConcat(c1, c2) {
      return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str`${c1}${c2}`;
    }
    exports.strConcat = strConcat;
    function interpolate(x) {
      return typeof x == "number" || typeof x == "boolean" || x === null ? x : safeStringify(Array.isArray(x) ? x.join(",") : x);
    }
    function stringify(x) {
      return new _Code(safeStringify(x));
    }
    exports.stringify = stringify;
    function safeStringify(x) {
      return JSON.stringify(x).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    }
    exports.safeStringify = safeStringify;
    function getProperty(key) {
      return typeof key == "string" && exports.IDENTIFIER.test(key) ? new _Code(`.${key}`) : _`[${key}]`;
    }
    exports.getProperty = getProperty;
    function getEsmExportName(key) {
      if (typeof key == "string" && exports.IDENTIFIER.test(key)) {
        return new _Code(`${key}`);
      }
      throw new Error(`CodeGen: invalid export name: ${key}, use explicit $id name mapping`);
    }
    exports.getEsmExportName = getEsmExportName;
    function regexpCode(rx) {
      return new _Code(rx.toString());
    }
    exports.regexpCode = regexpCode;
  }
});

// ../node_modules/ajv/dist/compile/codegen/scope.js
var require_scope = __commonJS({
  "../node_modules/ajv/dist/compile/codegen/scope.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ValueScope = exports.ValueScopeName = exports.Scope = exports.varKinds = exports.UsedValueState = void 0;
    var code_1 = require_code();
    var ValueError = class extends Error {
      constructor(name) {
        super(`CodeGen: "code" for ${name} not defined`);
        this.value = name.value;
      }
    };
    var UsedValueState;
    (function(UsedValueState2) {
      UsedValueState2[UsedValueState2["Started"] = 0] = "Started";
      UsedValueState2[UsedValueState2["Completed"] = 1] = "Completed";
    })(UsedValueState || (exports.UsedValueState = UsedValueState = {}));
    exports.varKinds = {
      const: new code_1.Name("const"),
      let: new code_1.Name("let"),
      var: new code_1.Name("var")
    };
    var Scope = class {
      constructor({ prefixes, parent } = {}) {
        this._names = {};
        this._prefixes = prefixes;
        this._parent = parent;
      }
      toName(nameOrPrefix) {
        return nameOrPrefix instanceof code_1.Name ? nameOrPrefix : this.name(nameOrPrefix);
      }
      name(prefix) {
        return new code_1.Name(this._newName(prefix));
      }
      _newName(prefix) {
        const ng = this._names[prefix] || this._nameGroup(prefix);
        return `${prefix}${ng.index++}`;
      }
      _nameGroup(prefix) {
        var _a, _b;
        if (((_b = (_a = this._parent) === null || _a === void 0 ? void 0 : _a._prefixes) === null || _b === void 0 ? void 0 : _b.has(prefix)) || this._prefixes && !this._prefixes.has(prefix)) {
          throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`);
        }
        return this._names[prefix] = { prefix, index: 0 };
      }
    };
    exports.Scope = Scope;
    var ValueScopeName = class extends code_1.Name {
      constructor(prefix, nameStr) {
        super(nameStr);
        this.prefix = prefix;
      }
      setValue(value, { property, itemIndex }) {
        this.value = value;
        this.scopePath = (0, code_1._)`.${new code_1.Name(property)}[${itemIndex}]`;
      }
    };
    exports.ValueScopeName = ValueScopeName;
    var line = (0, code_1._)`\n`;
    var ValueScope = class extends Scope {
      constructor(opts) {
        super(opts);
        this._values = {};
        this._scope = opts.scope;
        this.opts = { ...opts, _n: opts.lines ? line : code_1.nil };
      }
      get() {
        return this._scope;
      }
      name(prefix) {
        return new ValueScopeName(prefix, this._newName(prefix));
      }
      value(nameOrPrefix, value) {
        var _a;
        if (value.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const name = this.toName(nameOrPrefix);
        const { prefix } = name;
        const valueKey = (_a = value.key) !== null && _a !== void 0 ? _a : value.ref;
        let vs = this._values[prefix];
        if (vs) {
          const _name = vs.get(valueKey);
          if (_name)
            return _name;
        } else {
          vs = this._values[prefix] = /* @__PURE__ */ new Map();
        }
        vs.set(valueKey, name);
        const s = this._scope[prefix] || (this._scope[prefix] = []);
        const itemIndex = s.length;
        s[itemIndex] = value.ref;
        name.setValue(value, { property: prefix, itemIndex });
        return name;
      }
      getValue(prefix, keyOrRef) {
        const vs = this._values[prefix];
        if (!vs)
          return;
        return vs.get(keyOrRef);
      }
      scopeRefs(scopeName, values = this._values) {
        return this._reduceValues(values, (name) => {
          if (name.scopePath === void 0)
            throw new Error(`CodeGen: name "${name}" has no value`);
          return (0, code_1._)`${scopeName}${name.scopePath}`;
        });
      }
      scopeCode(values = this._values, usedValues, getCode) {
        return this._reduceValues(values, (name) => {
          if (name.value === void 0)
            throw new Error(`CodeGen: name "${name}" has no value`);
          return name.value.code;
        }, usedValues, getCode);
      }
      _reduceValues(values, valueCode, usedValues = {}, getCode) {
        let code = code_1.nil;
        for (const prefix in values) {
          const vs = values[prefix];
          if (!vs)
            continue;
          const nameSet = usedValues[prefix] = usedValues[prefix] || /* @__PURE__ */ new Map();
          vs.forEach((name) => {
            if (nameSet.has(name))
              return;
            nameSet.set(name, UsedValueState.Started);
            let c = valueCode(name);
            if (c) {
              const def = this.opts.es5 ? exports.varKinds.var : exports.varKinds.const;
              code = (0, code_1._)`${code}${def} ${name} = ${c};${this.opts._n}`;
            } else if (c = getCode === null || getCode === void 0 ? void 0 : getCode(name)) {
              code = (0, code_1._)`${code}${c}${this.opts._n}`;
            } else {
              throw new ValueError(name);
            }
            nameSet.set(name, UsedValueState.Completed);
          });
        }
        return code;
      }
    };
    exports.ValueScope = ValueScope;
  }
});

// ../node_modules/ajv/dist/compile/codegen/index.js
var require_codegen = __commonJS({
  "../node_modules/ajv/dist/compile/codegen/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.or = exports.and = exports.not = exports.CodeGen = exports.operators = exports.varKinds = exports.ValueScopeName = exports.ValueScope = exports.Scope = exports.Name = exports.regexpCode = exports.stringify = exports.getProperty = exports.nil = exports.strConcat = exports.str = exports._ = void 0;
    var code_1 = require_code();
    var scope_1 = require_scope();
    var code_2 = require_code();
    Object.defineProperty(exports, "_", { enumerable: true, get: function() {
      return code_2._;
    } });
    Object.defineProperty(exports, "str", { enumerable: true, get: function() {
      return code_2.str;
    } });
    Object.defineProperty(exports, "strConcat", { enumerable: true, get: function() {
      return code_2.strConcat;
    } });
    Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
      return code_2.nil;
    } });
    Object.defineProperty(exports, "getProperty", { enumerable: true, get: function() {
      return code_2.getProperty;
    } });
    Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
      return code_2.stringify;
    } });
    Object.defineProperty(exports, "regexpCode", { enumerable: true, get: function() {
      return code_2.regexpCode;
    } });
    Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
      return code_2.Name;
    } });
    var scope_2 = require_scope();
    Object.defineProperty(exports, "Scope", { enumerable: true, get: function() {
      return scope_2.Scope;
    } });
    Object.defineProperty(exports, "ValueScope", { enumerable: true, get: function() {
      return scope_2.ValueScope;
    } });
    Object.defineProperty(exports, "ValueScopeName", { enumerable: true, get: function() {
      return scope_2.ValueScopeName;
    } });
    Object.defineProperty(exports, "varKinds", { enumerable: true, get: function() {
      return scope_2.varKinds;
    } });
    exports.operators = {
      GT: new code_1._Code(">"),
      GTE: new code_1._Code(">="),
      LT: new code_1._Code("<"),
      LTE: new code_1._Code("<="),
      EQ: new code_1._Code("==="),
      NEQ: new code_1._Code("!=="),
      NOT: new code_1._Code("!"),
      OR: new code_1._Code("||"),
      AND: new code_1._Code("&&"),
      ADD: new code_1._Code("+")
    };
    var Node = class {
      optimizeNodes() {
        return this;
      }
      optimizeNames(_names, _constants) {
        return this;
      }
    };
    var Def = class extends Node {
      constructor(varKind, name, rhs) {
        super();
        this.varKind = varKind;
        this.name = name;
        this.rhs = rhs;
      }
      render({ es5, _n }) {
        const varKind = es5 ? scope_1.varKinds.var : this.varKind;
        const rhs = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${varKind} ${this.name}${rhs};` + _n;
      }
      optimizeNames(names, constants) {
        if (!names[this.name.str])
          return;
        if (this.rhs)
          this.rhs = optimizeExpr(this.rhs, names, constants);
        return this;
      }
      get names() {
        return this.rhs instanceof code_1._CodeOrName ? this.rhs.names : {};
      }
    };
    var Assign = class extends Node {
      constructor(lhs, rhs, sideEffects) {
        super();
        this.lhs = lhs;
        this.rhs = rhs;
        this.sideEffects = sideEffects;
      }
      render({ _n }) {
        return `${this.lhs} = ${this.rhs};` + _n;
      }
      optimizeNames(names, constants) {
        if (this.lhs instanceof code_1.Name && !names[this.lhs.str] && !this.sideEffects)
          return;
        this.rhs = optimizeExpr(this.rhs, names, constants);
        return this;
      }
      get names() {
        const names = this.lhs instanceof code_1.Name ? {} : { ...this.lhs.names };
        return addExprNames(names, this.rhs);
      }
    };
    var AssignOp = class extends Assign {
      constructor(lhs, op, rhs, sideEffects) {
        super(lhs, rhs, sideEffects);
        this.op = op;
      }
      render({ _n }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + _n;
      }
    };
    var Label = class extends Node {
      constructor(label) {
        super();
        this.label = label;
        this.names = {};
      }
      render({ _n }) {
        return `${this.label}:` + _n;
      }
    };
    var Break = class extends Node {
      constructor(label) {
        super();
        this.label = label;
        this.names = {};
      }
      render({ _n }) {
        const label = this.label ? ` ${this.label}` : "";
        return `break${label};` + _n;
      }
    };
    var Throw = class extends Node {
      constructor(error) {
        super();
        this.error = error;
      }
      render({ _n }) {
        return `throw ${this.error};` + _n;
      }
      get names() {
        return this.error.names;
      }
    };
    var AnyCode = class extends Node {
      constructor(code) {
        super();
        this.code = code;
      }
      render({ _n }) {
        return `${this.code};` + _n;
      }
      optimizeNodes() {
        return `${this.code}` ? this : void 0;
      }
      optimizeNames(names, constants) {
        this.code = optimizeExpr(this.code, names, constants);
        return this;
      }
      get names() {
        return this.code instanceof code_1._CodeOrName ? this.code.names : {};
      }
    };
    var ParentNode = class extends Node {
      constructor(nodes = []) {
        super();
        this.nodes = nodes;
      }
      render(opts) {
        return this.nodes.reduce((code, n) => code + n.render(opts), "");
      }
      optimizeNodes() {
        const { nodes } = this;
        let i = nodes.length;
        while (i--) {
          const n = nodes[i].optimizeNodes();
          if (Array.isArray(n))
            nodes.splice(i, 1, ...n);
          else if (n)
            nodes[i] = n;
          else
            nodes.splice(i, 1);
        }
        return nodes.length > 0 ? this : void 0;
      }
      optimizeNames(names, constants) {
        const { nodes } = this;
        let i = nodes.length;
        while (i--) {
          const n = nodes[i];
          if (n.optimizeNames(names, constants))
            continue;
          subtractNames(names, n.names);
          nodes.splice(i, 1);
        }
        return nodes.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((names, n) => addNames(names, n.names), {});
      }
    };
    var BlockNode = class extends ParentNode {
      render(opts) {
        return "{" + opts._n + super.render(opts) + "}" + opts._n;
      }
    };
    var Root = class extends ParentNode {
    };
    var Else = class extends BlockNode {
    };
    Else.kind = "else";
    var If = class _If extends BlockNode {
      constructor(condition, nodes) {
        super(nodes);
        this.condition = condition;
      }
      render(opts) {
        let code = `if(${this.condition})` + super.render(opts);
        if (this.else)
          code += "else " + this.else.render(opts);
        return code;
      }
      optimizeNodes() {
        super.optimizeNodes();
        const cond = this.condition;
        if (cond === true)
          return this.nodes;
        let e = this.else;
        if (e) {
          const ns = e.optimizeNodes();
          e = this.else = Array.isArray(ns) ? new Else(ns) : ns;
        }
        if (e) {
          if (cond === false)
            return e instanceof _If ? e : e.nodes;
          if (this.nodes.length)
            return this;
          return new _If(not(cond), e instanceof _If ? [e] : e.nodes);
        }
        if (cond === false || !this.nodes.length)
          return void 0;
        return this;
      }
      optimizeNames(names, constants) {
        var _a;
        this.else = (_a = this.else) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants);
        if (!(super.optimizeNames(names, constants) || this.else))
          return;
        this.condition = optimizeExpr(this.condition, names, constants);
        return this;
      }
      get names() {
        const names = super.names;
        addExprNames(names, this.condition);
        if (this.else)
          addNames(names, this.else.names);
        return names;
      }
    };
    If.kind = "if";
    var For = class extends BlockNode {
    };
    For.kind = "for";
    var ForLoop = class extends For {
      constructor(iteration) {
        super();
        this.iteration = iteration;
      }
      render(opts) {
        return `for(${this.iteration})` + super.render(opts);
      }
      optimizeNames(names, constants) {
        if (!super.optimizeNames(names, constants))
          return;
        this.iteration = optimizeExpr(this.iteration, names, constants);
        return this;
      }
      get names() {
        return addNames(super.names, this.iteration.names);
      }
    };
    var ForRange = class extends For {
      constructor(varKind, name, from, to) {
        super();
        this.varKind = varKind;
        this.name = name;
        this.from = from;
        this.to = to;
      }
      render(opts) {
        const varKind = opts.es5 ? scope_1.varKinds.var : this.varKind;
        const { name, from, to } = this;
        return `for(${varKind} ${name}=${from}; ${name}<${to}; ${name}++)` + super.render(opts);
      }
      get names() {
        const names = addExprNames(super.names, this.from);
        return addExprNames(names, this.to);
      }
    };
    var ForIter = class extends For {
      constructor(loop, varKind, name, iterable) {
        super();
        this.loop = loop;
        this.varKind = varKind;
        this.name = name;
        this.iterable = iterable;
      }
      render(opts) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(opts);
      }
      optimizeNames(names, constants) {
        if (!super.optimizeNames(names, constants))
          return;
        this.iterable = optimizeExpr(this.iterable, names, constants);
        return this;
      }
      get names() {
        return addNames(super.names, this.iterable.names);
      }
    };
    var Func = class extends BlockNode {
      constructor(name, args, async) {
        super();
        this.name = name;
        this.args = args;
        this.async = async;
      }
      render(opts) {
        const _async = this.async ? "async " : "";
        return `${_async}function ${this.name}(${this.args})` + super.render(opts);
      }
    };
    Func.kind = "func";
    var Return = class extends ParentNode {
      render(opts) {
        return "return " + super.render(opts);
      }
    };
    Return.kind = "return";
    var Try = class extends BlockNode {
      render(opts) {
        let code = "try" + super.render(opts);
        if (this.catch)
          code += this.catch.render(opts);
        if (this.finally)
          code += this.finally.render(opts);
        return code;
      }
      optimizeNodes() {
        var _a, _b;
        super.optimizeNodes();
        (_a = this.catch) === null || _a === void 0 ? void 0 : _a.optimizeNodes();
        (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNodes();
        return this;
      }
      optimizeNames(names, constants) {
        var _a, _b;
        super.optimizeNames(names, constants);
        (_a = this.catch) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants);
        (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNames(names, constants);
        return this;
      }
      get names() {
        const names = super.names;
        if (this.catch)
          addNames(names, this.catch.names);
        if (this.finally)
          addNames(names, this.finally.names);
        return names;
      }
    };
    var Catch = class extends BlockNode {
      constructor(error) {
        super();
        this.error = error;
      }
      render(opts) {
        return `catch(${this.error})` + super.render(opts);
      }
    };
    Catch.kind = "catch";
    var Finally = class extends BlockNode {
      render(opts) {
        return "finally" + super.render(opts);
      }
    };
    Finally.kind = "finally";
    var CodeGen = class {
      constructor(extScope, opts = {}) {
        this._values = {};
        this._blockStarts = [];
        this._constants = {};
        this.opts = { ...opts, _n: opts.lines ? "\n" : "" };
        this._extScope = extScope;
        this._scope = new scope_1.Scope({ parent: extScope });
        this._nodes = [new Root()];
      }
      toString() {
        return this._root.render(this.opts);
      }
      // returns unique name in the internal scope
      name(prefix) {
        return this._scope.name(prefix);
      }
      // reserves unique name in the external scope
      scopeName(prefix) {
        return this._extScope.name(prefix);
      }
      // reserves unique name in the external scope and assigns value to it
      scopeValue(prefixOrName, value) {
        const name = this._extScope.value(prefixOrName, value);
        const vs = this._values[name.prefix] || (this._values[name.prefix] = /* @__PURE__ */ new Set());
        vs.add(name);
        return name;
      }
      getScopeValue(prefix, keyOrRef) {
        return this._extScope.getValue(prefix, keyOrRef);
      }
      // return code that assigns values in the external scope to the names that are used internally
      // (same names that were returned by gen.scopeName or gen.scopeValue)
      scopeRefs(scopeName) {
        return this._extScope.scopeRefs(scopeName, this._values);
      }
      scopeCode() {
        return this._extScope.scopeCode(this._values);
      }
      _def(varKind, nameOrPrefix, rhs, constant) {
        const name = this._scope.toName(nameOrPrefix);
        if (rhs !== void 0 && constant)
          this._constants[name.str] = rhs;
        this._leafNode(new Def(varKind, name, rhs));
        return name;
      }
      // `const` declaration (`var` in es5 mode)
      const(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.const, nameOrPrefix, rhs, _constant);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.let, nameOrPrefix, rhs, _constant);
      }
      // `var` declaration with optional assignment
      var(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.var, nameOrPrefix, rhs, _constant);
      }
      // assignment code
      assign(lhs, rhs, sideEffects) {
        return this._leafNode(new Assign(lhs, rhs, sideEffects));
      }
      // `+=` code
      add(lhs, rhs) {
        return this._leafNode(new AssignOp(lhs, exports.operators.ADD, rhs));
      }
      // appends passed SafeExpr to code or executes Block
      code(c) {
        if (typeof c == "function")
          c();
        else if (c !== code_1.nil)
          this._leafNode(new AnyCode(c));
        return this;
      }
      // returns code for object literal for the passed argument list of key-value pairs
      object(...keyValues) {
        const code = ["{"];
        for (const [key, value] of keyValues) {
          if (code.length > 1)
            code.push(",");
          code.push(key);
          if (key !== value || this.opts.es5) {
            code.push(":");
            (0, code_1.addCodeArg)(code, value);
          }
        }
        code.push("}");
        return new code_1._Code(code);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(condition, thenBody, elseBody) {
        this._blockNode(new If(condition));
        if (thenBody && elseBody) {
          this.code(thenBody).else().code(elseBody).endIf();
        } else if (thenBody) {
          this.code(thenBody).endIf();
        } else if (elseBody) {
          throw new Error('CodeGen: "else" body without "then" body');
        }
        return this;
      }
      // `else if` clause - invalid without `if` or after `else` clauses
      elseIf(condition) {
        return this._elseNode(new If(condition));
      }
      // `else` clause - only valid after `if` or `else if` clauses
      else() {
        return this._elseNode(new Else());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(If, Else);
      }
      _for(node, forBody) {
        this._blockNode(node);
        if (forBody)
          this.code(forBody).endFor();
        return this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(iteration, forBody) {
        return this._for(new ForLoop(iteration), forBody);
      }
      // `for` statement for a range of values
      forRange(nameOrPrefix, from, to, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.let) {
        const name = this._scope.toName(nameOrPrefix);
        return this._for(new ForRange(varKind, name, from, to), () => forBody(name));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(nameOrPrefix, iterable, forBody, varKind = scope_1.varKinds.const) {
        const name = this._scope.toName(nameOrPrefix);
        if (this.opts.es5) {
          const arr = iterable instanceof code_1.Name ? iterable : this.var("_arr", iterable);
          return this.forRange("_i", 0, (0, code_1._)`${arr}.length`, (i) => {
            this.var(name, (0, code_1._)`${arr}[${i}]`);
            forBody(name);
          });
        }
        return this._for(new ForIter("of", varKind, name, iterable), () => forBody(name));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(nameOrPrefix, obj, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.const) {
        if (this.opts.ownProperties) {
          return this.forOf(nameOrPrefix, (0, code_1._)`Object.keys(${obj})`, forBody);
        }
        const name = this._scope.toName(nameOrPrefix);
        return this._for(new ForIter("in", varKind, name, obj), () => forBody(name));
      }
      // end `for` loop
      endFor() {
        return this._endBlockNode(For);
      }
      // `label` statement
      label(label) {
        return this._leafNode(new Label(label));
      }
      // `break` statement
      break(label) {
        return this._leafNode(new Break(label));
      }
      // `return` statement
      return(value) {
        const node = new Return();
        this._blockNode(node);
        this.code(value);
        if (node.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(Return);
      }
      // `try` statement
      try(tryBody, catchCode, finallyCode) {
        if (!catchCode && !finallyCode)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const node = new Try();
        this._blockNode(node);
        this.code(tryBody);
        if (catchCode) {
          const error = this.name("e");
          this._currNode = node.catch = new Catch(error);
          catchCode(error);
        }
        if (finallyCode) {
          this._currNode = node.finally = new Finally();
          this.code(finallyCode);
        }
        return this._endBlockNode(Catch, Finally);
      }
      // `throw` statement
      throw(error) {
        return this._leafNode(new Throw(error));
      }
      // start self-balancing block
      block(body, nodeCount) {
        this._blockStarts.push(this._nodes.length);
        if (body)
          this.code(body).endBlock(nodeCount);
        return this;
      }
      // end the current self-balancing block
      endBlock(nodeCount) {
        const len = this._blockStarts.pop();
        if (len === void 0)
          throw new Error("CodeGen: not in self-balancing block");
        const toClose = this._nodes.length - len;
        if (toClose < 0 || nodeCount !== void 0 && toClose !== nodeCount) {
          throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`);
        }
        this._nodes.length = len;
        return this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(name, args = code_1.nil, async, funcBody) {
        this._blockNode(new Func(name, args, async));
        if (funcBody)
          this.code(funcBody).endFunc();
        return this;
      }
      // end function definition
      endFunc() {
        return this._endBlockNode(Func);
      }
      optimize(n = 1) {
        while (n-- > 0) {
          this._root.optimizeNodes();
          this._root.optimizeNames(this._root.names, this._constants);
        }
      }
      _leafNode(node) {
        this._currNode.nodes.push(node);
        return this;
      }
      _blockNode(node) {
        this._currNode.nodes.push(node);
        this._nodes.push(node);
      }
      _endBlockNode(N1, N2) {
        const n = this._currNode;
        if (n instanceof N1 || N2 && n instanceof N2) {
          this._nodes.pop();
          return this;
        }
        throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`);
      }
      _elseNode(node) {
        const n = this._currNode;
        if (!(n instanceof If)) {
          throw new Error('CodeGen: "else" without "if"');
        }
        this._currNode = n.else = node;
        return this;
      }
      get _root() {
        return this._nodes[0];
      }
      get _currNode() {
        const ns = this._nodes;
        return ns[ns.length - 1];
      }
      set _currNode(node) {
        const ns = this._nodes;
        ns[ns.length - 1] = node;
      }
    };
    exports.CodeGen = CodeGen;
    function addNames(names, from) {
      for (const n in from)
        names[n] = (names[n] || 0) + (from[n] || 0);
      return names;
    }
    function addExprNames(names, from) {
      return from instanceof code_1._CodeOrName ? addNames(names, from.names) : names;
    }
    function optimizeExpr(expr, names, constants) {
      if (expr instanceof code_1.Name)
        return replaceName(expr);
      if (!canOptimize(expr))
        return expr;
      return new code_1._Code(expr._items.reduce((items, c) => {
        if (c instanceof code_1.Name)
          c = replaceName(c);
        if (c instanceof code_1._Code)
          items.push(...c._items);
        else
          items.push(c);
        return items;
      }, []));
      function replaceName(n) {
        const c = constants[n.str];
        if (c === void 0 || names[n.str] !== 1)
          return n;
        delete names[n.str];
        return c;
      }
      function canOptimize(e) {
        return e instanceof code_1._Code && e._items.some((c) => c instanceof code_1.Name && names[c.str] === 1 && constants[c.str] !== void 0);
      }
    }
    function subtractNames(names, from) {
      for (const n in from)
        names[n] = (names[n] || 0) - (from[n] || 0);
    }
    function not(x) {
      return typeof x == "boolean" || typeof x == "number" || x === null ? !x : (0, code_1._)`!${par(x)}`;
    }
    exports.not = not;
    var andCode = mappend(exports.operators.AND);
    function and(...args) {
      return args.reduce(andCode);
    }
    exports.and = and;
    var orCode = mappend(exports.operators.OR);
    function or(...args) {
      return args.reduce(orCode);
    }
    exports.or = or;
    function mappend(op) {
      return (x, y) => x === code_1.nil ? y : y === code_1.nil ? x : (0, code_1._)`${par(x)} ${op} ${par(y)}`;
    }
    function par(x) {
      return x instanceof code_1.Name ? x : (0, code_1._)`(${x})`;
    }
  }
});

// ../node_modules/ajv/dist/compile/util.js
var require_util = __commonJS({
  "../node_modules/ajv/dist/compile/util.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.checkStrictMode = exports.getErrorPath = exports.Type = exports.useFunc = exports.setEvaluated = exports.evaluatedPropsToName = exports.mergeEvaluated = exports.eachItem = exports.unescapeJsonPointer = exports.escapeJsonPointer = exports.escapeFragment = exports.unescapeFragment = exports.schemaRefOrVal = exports.schemaHasRulesButRef = exports.schemaHasRules = exports.checkUnknownRules = exports.alwaysValidSchema = exports.toHash = void 0;
    var codegen_1 = require_codegen();
    var code_1 = require_code();
    function toHash(arr) {
      const hash = {};
      for (const item of arr)
        hash[item] = true;
      return hash;
    }
    exports.toHash = toHash;
    function alwaysValidSchema(it, schema) {
      if (typeof schema == "boolean")
        return schema;
      if (Object.keys(schema).length === 0)
        return true;
      checkUnknownRules(it, schema);
      return !schemaHasRules(schema, it.self.RULES.all);
    }
    exports.alwaysValidSchema = alwaysValidSchema;
    function checkUnknownRules(it, schema = it.schema) {
      const { opts, self } = it;
      if (!opts.strictSchema)
        return;
      if (typeof schema === "boolean")
        return;
      const rules = self.RULES.keywords;
      for (const key in schema) {
        if (!rules[key])
          checkStrictMode(it, `unknown keyword: "${key}"`);
      }
    }
    exports.checkUnknownRules = checkUnknownRules;
    function schemaHasRules(schema, rules) {
      if (typeof schema == "boolean")
        return !schema;
      for (const key in schema)
        if (rules[key])
          return true;
      return false;
    }
    exports.schemaHasRules = schemaHasRules;
    function schemaHasRulesButRef(schema, RULES) {
      if (typeof schema == "boolean")
        return !schema;
      for (const key in schema)
        if (key !== "$ref" && RULES.all[key])
          return true;
      return false;
    }
    exports.schemaHasRulesButRef = schemaHasRulesButRef;
    function schemaRefOrVal({ topSchemaRef, schemaPath }, schema, keyword, $data) {
      if (!$data) {
        if (typeof schema == "number" || typeof schema == "boolean")
          return schema;
        if (typeof schema == "string")
          return (0, codegen_1._)`${schema}`;
      }
      return (0, codegen_1._)`${topSchemaRef}${schemaPath}${(0, codegen_1.getProperty)(keyword)}`;
    }
    exports.schemaRefOrVal = schemaRefOrVal;
    function unescapeFragment(str) {
      return unescapeJsonPointer(decodeURIComponent(str));
    }
    exports.unescapeFragment = unescapeFragment;
    function escapeFragment(str) {
      return encodeURIComponent(escapeJsonPointer(str));
    }
    exports.escapeFragment = escapeFragment;
    function escapeJsonPointer(str) {
      if (typeof str == "number")
        return `${str}`;
      return str.replace(/~/g, "~0").replace(/\//g, "~1");
    }
    exports.escapeJsonPointer = escapeJsonPointer;
    function unescapeJsonPointer(str) {
      return str.replace(/~1/g, "/").replace(/~0/g, "~");
    }
    exports.unescapeJsonPointer = unescapeJsonPointer;
    function eachItem(xs, f) {
      if (Array.isArray(xs)) {
        for (const x of xs)
          f(x);
      } else {
        f(xs);
      }
    }
    exports.eachItem = eachItem;
    function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues, resultToName }) {
      return (gen, from, to, toName) => {
        const res = to === void 0 ? from : to instanceof codegen_1.Name ? (from instanceof codegen_1.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to) : from instanceof codegen_1.Name ? (mergeToName(gen, to, from), from) : mergeValues(from, to);
        return toName === codegen_1.Name && !(res instanceof codegen_1.Name) ? resultToName(gen, res) : res;
      };
    }
    exports.mergeEvaluated = {
      props: makeMergeEvaluated({
        mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => {
          gen.if((0, codegen_1._)`${from} === true`, () => gen.assign(to, true), () => gen.assign(to, (0, codegen_1._)`${to} || {}`).code((0, codegen_1._)`Object.assign(${to}, ${from})`));
        }),
        mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => {
          if (from === true) {
            gen.assign(to, true);
          } else {
            gen.assign(to, (0, codegen_1._)`${to} || {}`);
            setEvaluated(gen, to, from);
          }
        }),
        mergeValues: (from, to) => from === true ? true : { ...from, ...to },
        resultToName: evaluatedPropsToName
      }),
      items: makeMergeEvaluated({
        mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => gen.assign(to, (0, codegen_1._)`${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)),
        mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => gen.assign(to, from === true ? true : (0, codegen_1._)`${to} > ${from} ? ${to} : ${from}`)),
        mergeValues: (from, to) => from === true ? true : Math.max(from, to),
        resultToName: (gen, items) => gen.var("items", items)
      })
    };
    function evaluatedPropsToName(gen, ps) {
      if (ps === true)
        return gen.var("props", true);
      const props = gen.var("props", (0, codegen_1._)`{}`);
      if (ps !== void 0)
        setEvaluated(gen, props, ps);
      return props;
    }
    exports.evaluatedPropsToName = evaluatedPropsToName;
    function setEvaluated(gen, props, ps) {
      Object.keys(ps).forEach((p) => gen.assign((0, codegen_1._)`${props}${(0, codegen_1.getProperty)(p)}`, true));
    }
    exports.setEvaluated = setEvaluated;
    var snippets = {};
    function useFunc(gen, f) {
      return gen.scopeValue("func", {
        ref: f,
        code: snippets[f.code] || (snippets[f.code] = new code_1._Code(f.code))
      });
    }
    exports.useFunc = useFunc;
    var Type;
    (function(Type2) {
      Type2[Type2["Num"] = 0] = "Num";
      Type2[Type2["Str"] = 1] = "Str";
    })(Type || (exports.Type = Type = {}));
    function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
      if (dataProp instanceof codegen_1.Name) {
        const isNumber = dataPropType === Type.Num;
        return jsPropertySyntax ? isNumber ? (0, codegen_1._)`"[" + ${dataProp} + "]"` : (0, codegen_1._)`"['" + ${dataProp} + "']"` : isNumber ? (0, codegen_1._)`"/" + ${dataProp}` : (0, codegen_1._)`"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
      }
      return jsPropertySyntax ? (0, codegen_1.getProperty)(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
    }
    exports.getErrorPath = getErrorPath;
    function checkStrictMode(it, msg, mode = it.opts.strictSchema) {
      if (!mode)
        return;
      msg = `strict mode: ${msg}`;
      if (mode === true)
        throw new Error(msg);
      it.self.logger.warn(msg);
    }
    exports.checkStrictMode = checkStrictMode;
  }
});

// ../node_modules/ajv/dist/compile/names.js
var require_names = __commonJS({
  "../node_modules/ajv/dist/compile/names.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var names = {
      // validation function arguments
      data: new codegen_1.Name("data"),
      // data passed to validation function
      // args passed from referencing schema
      valCxt: new codegen_1.Name("valCxt"),
      // validation/data context - should not be used directly, it is destructured to the names below
      instancePath: new codegen_1.Name("instancePath"),
      parentData: new codegen_1.Name("parentData"),
      parentDataProperty: new codegen_1.Name("parentDataProperty"),
      rootData: new codegen_1.Name("rootData"),
      // root data - same as the data passed to the first/top validation function
      dynamicAnchors: new codegen_1.Name("dynamicAnchors"),
      // used to support recursiveRef and dynamicRef
      // function scoped variables
      vErrors: new codegen_1.Name("vErrors"),
      // null or array of validation errors
      errors: new codegen_1.Name("errors"),
      // counter of validation errors
      this: new codegen_1.Name("this"),
      // "globals"
      self: new codegen_1.Name("self"),
      scope: new codegen_1.Name("scope"),
      // JTD serialize/parse name for JSON string and position
      json: new codegen_1.Name("json"),
      jsonPos: new codegen_1.Name("jsonPos"),
      jsonLen: new codegen_1.Name("jsonLen"),
      jsonPart: new codegen_1.Name("jsonPart")
    };
    exports.default = names;
  }
});

// ../node_modules/ajv/dist/compile/errors.js
var require_errors = __commonJS({
  "../node_modules/ajv/dist/compile/errors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extendErrors = exports.resetErrorsCount = exports.reportExtraError = exports.reportError = exports.keyword$DataError = exports.keywordError = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var names_1 = require_names();
    exports.keywordError = {
      message: ({ keyword }) => (0, codegen_1.str)`must pass "${keyword}" keyword validation`
    };
    exports.keyword$DataError = {
      message: ({ keyword, schemaType }) => schemaType ? (0, codegen_1.str)`"${keyword}" keyword must be ${schemaType} ($data)` : (0, codegen_1.str)`"${keyword}" keyword is invalid ($data)`
    };
    function reportError(cxt, error = exports.keywordError, errorPaths, overrideAllErrors) {
      const { it } = cxt;
      const { gen, compositeRule, allErrors } = it;
      const errObj = errorObjectCode(cxt, error, errorPaths);
      if (overrideAllErrors !== null && overrideAllErrors !== void 0 ? overrideAllErrors : compositeRule || allErrors) {
        addError(gen, errObj);
      } else {
        returnErrors(it, (0, codegen_1._)`[${errObj}]`);
      }
    }
    exports.reportError = reportError;
    function reportExtraError(cxt, error = exports.keywordError, errorPaths) {
      const { it } = cxt;
      const { gen, compositeRule, allErrors } = it;
      const errObj = errorObjectCode(cxt, error, errorPaths);
      addError(gen, errObj);
      if (!(compositeRule || allErrors)) {
        returnErrors(it, names_1.default.vErrors);
      }
    }
    exports.reportExtraError = reportExtraError;
    function resetErrorsCount(gen, errsCount) {
      gen.assign(names_1.default.errors, errsCount);
      gen.if((0, codegen_1._)`${names_1.default.vErrors} !== null`, () => gen.if(errsCount, () => gen.assign((0, codegen_1._)`${names_1.default.vErrors}.length`, errsCount), () => gen.assign(names_1.default.vErrors, null)));
    }
    exports.resetErrorsCount = resetErrorsCount;
    function extendErrors({ gen, keyword, schemaValue, data, errsCount, it }) {
      if (errsCount === void 0)
        throw new Error("ajv implementation error");
      const err = gen.name("err");
      gen.forRange("i", errsCount, names_1.default.errors, (i) => {
        gen.const(err, (0, codegen_1._)`${names_1.default.vErrors}[${i}]`);
        gen.if((0, codegen_1._)`${err}.instancePath === undefined`, () => gen.assign((0, codegen_1._)`${err}.instancePath`, (0, codegen_1.strConcat)(names_1.default.instancePath, it.errorPath)));
        gen.assign((0, codegen_1._)`${err}.schemaPath`, (0, codegen_1.str)`${it.errSchemaPath}/${keyword}`);
        if (it.opts.verbose) {
          gen.assign((0, codegen_1._)`${err}.schema`, schemaValue);
          gen.assign((0, codegen_1._)`${err}.data`, data);
        }
      });
    }
    exports.extendErrors = extendErrors;
    function addError(gen, errObj) {
      const err = gen.const("err", errObj);
      gen.if((0, codegen_1._)`${names_1.default.vErrors} === null`, () => gen.assign(names_1.default.vErrors, (0, codegen_1._)`[${err}]`), (0, codegen_1._)`${names_1.default.vErrors}.push(${err})`);
      gen.code((0, codegen_1._)`${names_1.default.errors}++`);
    }
    function returnErrors(it, errs) {
      const { gen, validateName, schemaEnv } = it;
      if (schemaEnv.$async) {
        gen.throw((0, codegen_1._)`new ${it.ValidationError}(${errs})`);
      } else {
        gen.assign((0, codegen_1._)`${validateName}.errors`, errs);
        gen.return(false);
      }
    }
    var E = {
      keyword: new codegen_1.Name("keyword"),
      schemaPath: new codegen_1.Name("schemaPath"),
      // also used in JTD errors
      params: new codegen_1.Name("params"),
      propertyName: new codegen_1.Name("propertyName"),
      message: new codegen_1.Name("message"),
      schema: new codegen_1.Name("schema"),
      parentSchema: new codegen_1.Name("parentSchema")
    };
    function errorObjectCode(cxt, error, errorPaths) {
      const { createErrors } = cxt.it;
      if (createErrors === false)
        return (0, codegen_1._)`{}`;
      return errorObject(cxt, error, errorPaths);
    }
    function errorObject(cxt, error, errorPaths = {}) {
      const { gen, it } = cxt;
      const keyValues = [
        errorInstancePath(it, errorPaths),
        errorSchemaPath(cxt, errorPaths)
      ];
      extraErrorProps(cxt, error, keyValues);
      return gen.object(...keyValues);
    }
    function errorInstancePath({ errorPath }, { instancePath }) {
      const instPath = instancePath ? (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(instancePath, util_1.Type.Str)}` : errorPath;
      return [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, instPath)];
    }
    function errorSchemaPath({ keyword, it: { errSchemaPath } }, { schemaPath, parentSchema }) {
      let schPath = parentSchema ? errSchemaPath : (0, codegen_1.str)`${errSchemaPath}/${keyword}`;
      if (schemaPath) {
        schPath = (0, codegen_1.str)`${schPath}${(0, util_1.getErrorPath)(schemaPath, util_1.Type.Str)}`;
      }
      return [E.schemaPath, schPath];
    }
    function extraErrorProps(cxt, { params, message }, keyValues) {
      const { keyword, data, schemaValue, it } = cxt;
      const { opts, propertyName, topSchemaRef, schemaPath } = it;
      keyValues.push([E.keyword, keyword], [E.params, typeof params == "function" ? params(cxt) : params || (0, codegen_1._)`{}`]);
      if (opts.messages) {
        keyValues.push([E.message, typeof message == "function" ? message(cxt) : message]);
      }
      if (opts.verbose) {
        keyValues.push([E.schema, schemaValue], [E.parentSchema, (0, codegen_1._)`${topSchemaRef}${schemaPath}`], [names_1.default.data, data]);
      }
      if (propertyName)
        keyValues.push([E.propertyName, propertyName]);
    }
  }
});

// ../node_modules/ajv/dist/compile/validate/boolSchema.js
var require_boolSchema = __commonJS({
  "../node_modules/ajv/dist/compile/validate/boolSchema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.boolOrEmptySchema = exports.topBoolOrEmptySchema = void 0;
    var errors_1 = require_errors();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var boolError = {
      message: "boolean schema is false"
    };
    function topBoolOrEmptySchema(it) {
      const { gen, schema, validateName } = it;
      if (schema === false) {
        falseSchemaError(it, false);
      } else if (typeof schema == "object" && schema.$async === true) {
        gen.return(names_1.default.data);
      } else {
        gen.assign((0, codegen_1._)`${validateName}.errors`, null);
        gen.return(true);
      }
    }
    exports.topBoolOrEmptySchema = topBoolOrEmptySchema;
    function boolOrEmptySchema(it, valid) {
      const { gen, schema } = it;
      if (schema === false) {
        gen.var(valid, false);
        falseSchemaError(it);
      } else {
        gen.var(valid, true);
      }
    }
    exports.boolOrEmptySchema = boolOrEmptySchema;
    function falseSchemaError(it, overrideAllErrors) {
      const { gen, data } = it;
      const cxt = {
        gen,
        keyword: "false schema",
        data,
        schema: false,
        schemaCode: false,
        schemaValue: false,
        params: {},
        it
      };
      (0, errors_1.reportError)(cxt, boolError, void 0, overrideAllErrors);
    }
  }
});

// ../node_modules/ajv/dist/compile/rules.js
var require_rules = __commonJS({
  "../node_modules/ajv/dist/compile/rules.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getRules = exports.isJSONType = void 0;
    var _jsonTypes = ["string", "number", "integer", "boolean", "null", "object", "array"];
    var jsonTypes = new Set(_jsonTypes);
    function isJSONType(x) {
      return typeof x == "string" && jsonTypes.has(x);
    }
    exports.isJSONType = isJSONType;
    function getRules() {
      const groups = {
        number: { type: "number", rules: [] },
        string: { type: "string", rules: [] },
        array: { type: "array", rules: [] },
        object: { type: "object", rules: [] }
      };
      return {
        types: { ...groups, integer: true, boolean: true, null: true },
        rules: [{ rules: [] }, groups.number, groups.string, groups.array, groups.object],
        post: { rules: [] },
        all: {},
        keywords: {}
      };
    }
    exports.getRules = getRules;
  }
});

// ../node_modules/ajv/dist/compile/validate/applicability.js
var require_applicability = __commonJS({
  "../node_modules/ajv/dist/compile/validate/applicability.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.shouldUseRule = exports.shouldUseGroup = exports.schemaHasRulesForType = void 0;
    function schemaHasRulesForType({ schema, self }, type) {
      const group = self.RULES.types[type];
      return group && group !== true && shouldUseGroup(schema, group);
    }
    exports.schemaHasRulesForType = schemaHasRulesForType;
    function shouldUseGroup(schema, group) {
      return group.rules.some((rule) => shouldUseRule(schema, rule));
    }
    exports.shouldUseGroup = shouldUseGroup;
    function shouldUseRule(schema, rule) {
      var _a;
      return schema[rule.keyword] !== void 0 || ((_a = rule.definition.implements) === null || _a === void 0 ? void 0 : _a.some((kwd) => schema[kwd] !== void 0));
    }
    exports.shouldUseRule = shouldUseRule;
  }
});

// ../node_modules/ajv/dist/compile/validate/dataType.js
var require_dataType = __commonJS({
  "../node_modules/ajv/dist/compile/validate/dataType.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reportTypeError = exports.checkDataTypes = exports.checkDataType = exports.coerceAndCheckDataType = exports.getJSONTypes = exports.getSchemaTypes = exports.DataType = void 0;
    var rules_1 = require_rules();
    var applicability_1 = require_applicability();
    var errors_1 = require_errors();
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var DataType;
    (function(DataType2) {
      DataType2[DataType2["Correct"] = 0] = "Correct";
      DataType2[DataType2["Wrong"] = 1] = "Wrong";
    })(DataType || (exports.DataType = DataType = {}));
    function getSchemaTypes(schema) {
      const types = getJSONTypes(schema.type);
      const hasNull = types.includes("null");
      if (hasNull) {
        if (schema.nullable === false)
          throw new Error("type: null contradicts nullable: false");
      } else {
        if (!types.length && schema.nullable !== void 0) {
          throw new Error('"nullable" cannot be used without "type"');
        }
        if (schema.nullable === true)
          types.push("null");
      }
      return types;
    }
    exports.getSchemaTypes = getSchemaTypes;
    function getJSONTypes(ts) {
      const types = Array.isArray(ts) ? ts : ts ? [ts] : [];
      if (types.every(rules_1.isJSONType))
        return types;
      throw new Error("type must be JSONType or JSONType[]: " + types.join(","));
    }
    exports.getJSONTypes = getJSONTypes;
    function coerceAndCheckDataType(it, types) {
      const { gen, data, opts } = it;
      const coerceTo = coerceToTypes(types, opts.coerceTypes);
      const checkTypes = types.length > 0 && !(coerceTo.length === 0 && types.length === 1 && (0, applicability_1.schemaHasRulesForType)(it, types[0]));
      if (checkTypes) {
        const wrongType = checkDataTypes(types, data, opts.strictNumbers, DataType.Wrong);
        gen.if(wrongType, () => {
          if (coerceTo.length)
            coerceData(it, types, coerceTo);
          else
            reportTypeError(it);
        });
      }
      return checkTypes;
    }
    exports.coerceAndCheckDataType = coerceAndCheckDataType;
    var COERCIBLE = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
    function coerceToTypes(types, coerceTypes) {
      return coerceTypes ? types.filter((t) => COERCIBLE.has(t) || coerceTypes === "array" && t === "array") : [];
    }
    function coerceData(it, types, coerceTo) {
      const { gen, data, opts } = it;
      const dataType = gen.let("dataType", (0, codegen_1._)`typeof ${data}`);
      const coerced = gen.let("coerced", (0, codegen_1._)`undefined`);
      if (opts.coerceTypes === "array") {
        gen.if((0, codegen_1._)`${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () => gen.assign(data, (0, codegen_1._)`${data}[0]`).assign(dataType, (0, codegen_1._)`typeof ${data}`).if(checkDataTypes(types, data, opts.strictNumbers), () => gen.assign(coerced, data)));
      }
      gen.if((0, codegen_1._)`${coerced} !== undefined`);
      for (const t of coerceTo) {
        if (COERCIBLE.has(t) || t === "array" && opts.coerceTypes === "array") {
          coerceSpecificType(t);
        }
      }
      gen.else();
      reportTypeError(it);
      gen.endIf();
      gen.if((0, codegen_1._)`${coerced} !== undefined`, () => {
        gen.assign(data, coerced);
        assignParentData(it, coerced);
      });
      function coerceSpecificType(t) {
        switch (t) {
          case "string":
            gen.elseIf((0, codegen_1._)`${dataType} == "number" || ${dataType} == "boolean"`).assign(coerced, (0, codegen_1._)`"" + ${data}`).elseIf((0, codegen_1._)`${data} === null`).assign(coerced, (0, codegen_1._)`""`);
            return;
          case "number":
            gen.elseIf((0, codegen_1._)`${dataType} == "boolean" || ${data} === null
              || (${dataType} == "string" && ${data} && ${data} == +${data})`).assign(coerced, (0, codegen_1._)`+${data}`);
            return;
          case "integer":
            gen.elseIf((0, codegen_1._)`${dataType} === "boolean" || ${data} === null
              || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`).assign(coerced, (0, codegen_1._)`+${data}`);
            return;
          case "boolean":
            gen.elseIf((0, codegen_1._)`${data} === "false" || ${data} === 0 || ${data} === null`).assign(coerced, false).elseIf((0, codegen_1._)`${data} === "true" || ${data} === 1`).assign(coerced, true);
            return;
          case "null":
            gen.elseIf((0, codegen_1._)`${data} === "" || ${data} === 0 || ${data} === false`);
            gen.assign(coerced, null);
            return;
          case "array":
            gen.elseIf((0, codegen_1._)`${dataType} === "string" || ${dataType} === "number"
              || ${dataType} === "boolean" || ${data} === null`).assign(coerced, (0, codegen_1._)`[${data}]`);
        }
      }
    }
    function assignParentData({ gen, parentData, parentDataProperty }, expr) {
      gen.if((0, codegen_1._)`${parentData} !== undefined`, () => gen.assign((0, codegen_1._)`${parentData}[${parentDataProperty}]`, expr));
    }
    function checkDataType(dataType, data, strictNums, correct = DataType.Correct) {
      const EQ = correct === DataType.Correct ? codegen_1.operators.EQ : codegen_1.operators.NEQ;
      let cond;
      switch (dataType) {
        case "null":
          return (0, codegen_1._)`${data} ${EQ} null`;
        case "array":
          cond = (0, codegen_1._)`Array.isArray(${data})`;
          break;
        case "object":
          cond = (0, codegen_1._)`${data} && typeof ${data} == "object" && !Array.isArray(${data})`;
          break;
        case "integer":
          cond = numCond((0, codegen_1._)`!(${data} % 1) && !isNaN(${data})`);
          break;
        case "number":
          cond = numCond();
          break;
        default:
          return (0, codegen_1._)`typeof ${data} ${EQ} ${dataType}`;
      }
      return correct === DataType.Correct ? cond : (0, codegen_1.not)(cond);
      function numCond(_cond = codegen_1.nil) {
        return (0, codegen_1.and)((0, codegen_1._)`typeof ${data} == "number"`, _cond, strictNums ? (0, codegen_1._)`isFinite(${data})` : codegen_1.nil);
      }
    }
    exports.checkDataType = checkDataType;
    function checkDataTypes(dataTypes, data, strictNums, correct) {
      if (dataTypes.length === 1) {
        return checkDataType(dataTypes[0], data, strictNums, correct);
      }
      let cond;
      const types = (0, util_1.toHash)(dataTypes);
      if (types.array && types.object) {
        const notObj = (0, codegen_1._)`typeof ${data} != "object"`;
        cond = types.null ? notObj : (0, codegen_1._)`!${data} || ${notObj}`;
        delete types.null;
        delete types.array;
        delete types.object;
      } else {
        cond = codegen_1.nil;
      }
      if (types.number)
        delete types.integer;
      for (const t in types)
        cond = (0, codegen_1.and)(cond, checkDataType(t, data, strictNums, correct));
      return cond;
    }
    exports.checkDataTypes = checkDataTypes;
    var typeError = {
      message: ({ schema }) => `must be ${schema}`,
      params: ({ schema, schemaValue }) => typeof schema == "string" ? (0, codegen_1._)`{type: ${schema}}` : (0, codegen_1._)`{type: ${schemaValue}}`
    };
    function reportTypeError(it) {
      const cxt = getTypeErrorContext(it);
      (0, errors_1.reportError)(cxt, typeError);
    }
    exports.reportTypeError = reportTypeError;
    function getTypeErrorContext(it) {
      const { gen, data, schema } = it;
      const schemaCode = (0, util_1.schemaRefOrVal)(it, schema, "type");
      return {
        gen,
        keyword: "type",
        data,
        schema: schema.type,
        schemaCode,
        schemaValue: schemaCode,
        parentSchema: schema,
        params: {},
        it
      };
    }
  }
});

// ../node_modules/ajv/dist/compile/validate/defaults.js
var require_defaults = __commonJS({
  "../node_modules/ajv/dist/compile/validate/defaults.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assignDefaults = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    function assignDefaults(it, ty) {
      const { properties, items } = it.schema;
      if (ty === "object" && properties) {
        for (const key in properties) {
          assignDefault(it, key, properties[key].default);
        }
      } else if (ty === "array" && Array.isArray(items)) {
        items.forEach((sch, i) => assignDefault(it, i, sch.default));
      }
    }
    exports.assignDefaults = assignDefaults;
    function assignDefault(it, prop, defaultValue) {
      const { gen, compositeRule, data, opts } = it;
      if (defaultValue === void 0)
        return;
      const childData = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(prop)}`;
      if (compositeRule) {
        (0, util_1.checkStrictMode)(it, `default is ignored for: ${childData}`);
        return;
      }
      let condition = (0, codegen_1._)`${childData} === undefined`;
      if (opts.useDefaults === "empty") {
        condition = (0, codegen_1._)`${condition} || ${childData} === null || ${childData} === ""`;
      }
      gen.if(condition, (0, codegen_1._)`${childData} = ${(0, codegen_1.stringify)(defaultValue)}`);
    }
  }
});

// ../node_modules/ajv/dist/vocabularies/code.js
var require_code2 = __commonJS({
  "../node_modules/ajv/dist/vocabularies/code.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateUnion = exports.validateArray = exports.usePattern = exports.callValidateCode = exports.schemaProperties = exports.allSchemaProperties = exports.noPropertyInData = exports.propertyInData = exports.isOwnProperty = exports.hasPropFunc = exports.reportMissingProp = exports.checkMissingProp = exports.checkReportMissingProp = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var names_1 = require_names();
    var util_2 = require_util();
    function checkReportMissingProp(cxt, prop) {
      const { gen, data, it } = cxt;
      gen.if(noPropertyInData(gen, data, prop, it.opts.ownProperties), () => {
        cxt.setParams({ missingProperty: (0, codegen_1._)`${prop}` }, true);
        cxt.error();
      });
    }
    exports.checkReportMissingProp = checkReportMissingProp;
    function checkMissingProp({ gen, data, it: { opts } }, properties, missing) {
      return (0, codegen_1.or)(...properties.map((prop) => (0, codegen_1.and)(noPropertyInData(gen, data, prop, opts.ownProperties), (0, codegen_1._)`${missing} = ${prop}`)));
    }
    exports.checkMissingProp = checkMissingProp;
    function reportMissingProp(cxt, missing) {
      cxt.setParams({ missingProperty: missing }, true);
      cxt.error();
    }
    exports.reportMissingProp = reportMissingProp;
    function hasPropFunc(gen) {
      return gen.scopeValue("func", {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        ref: Object.prototype.hasOwnProperty,
        code: (0, codegen_1._)`Object.prototype.hasOwnProperty`
      });
    }
    exports.hasPropFunc = hasPropFunc;
    function isOwnProperty(gen, data, property) {
      return (0, codegen_1._)`${hasPropFunc(gen)}.call(${data}, ${property})`;
    }
    exports.isOwnProperty = isOwnProperty;
    function propertyInData(gen, data, property, ownProperties) {
      const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} !== undefined`;
      return ownProperties ? (0, codegen_1._)`${cond} && ${isOwnProperty(gen, data, property)}` : cond;
    }
    exports.propertyInData = propertyInData;
    function noPropertyInData(gen, data, property, ownProperties) {
      const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} === undefined`;
      return ownProperties ? (0, codegen_1.or)(cond, (0, codegen_1.not)(isOwnProperty(gen, data, property))) : cond;
    }
    exports.noPropertyInData = noPropertyInData;
    function allSchemaProperties(schemaMap) {
      return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
    }
    exports.allSchemaProperties = allSchemaProperties;
    function schemaProperties(it, schemaMap) {
      return allSchemaProperties(schemaMap).filter((p) => !(0, util_1.alwaysValidSchema)(it, schemaMap[p]));
    }
    exports.schemaProperties = schemaProperties;
    function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
      const dataAndSchema = passSchema ? (0, codegen_1._)`${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data;
      const valCxt = [
        [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, errorPath)],
        [names_1.default.parentData, it.parentData],
        [names_1.default.parentDataProperty, it.parentDataProperty],
        [names_1.default.rootData, names_1.default.rootData]
      ];
      if (it.opts.dynamicRef)
        valCxt.push([names_1.default.dynamicAnchors, names_1.default.dynamicAnchors]);
      const args = (0, codegen_1._)`${dataAndSchema}, ${gen.object(...valCxt)}`;
      return context !== codegen_1.nil ? (0, codegen_1._)`${func}.call(${context}, ${args})` : (0, codegen_1._)`${func}(${args})`;
    }
    exports.callValidateCode = callValidateCode;
    var newRegExp = (0, codegen_1._)`new RegExp`;
    function usePattern({ gen, it: { opts } }, pattern) {
      const u = opts.unicodeRegExp ? "u" : "";
      const { regExp } = opts.code;
      const rx = regExp(pattern, u);
      return gen.scopeValue("pattern", {
        key: rx.toString(),
        ref: rx,
        code: (0, codegen_1._)`${regExp.code === "new RegExp" ? newRegExp : (0, util_2.useFunc)(gen, regExp)}(${pattern}, ${u})`
      });
    }
    exports.usePattern = usePattern;
    function validateArray(cxt) {
      const { gen, data, keyword, it } = cxt;
      const valid = gen.name("valid");
      if (it.allErrors) {
        const validArr = gen.let("valid", true);
        validateItems(() => gen.assign(validArr, false));
        return validArr;
      }
      gen.var(valid, true);
      validateItems(() => gen.break());
      return valid;
      function validateItems(notValid) {
        const len = gen.const("len", (0, codegen_1._)`${data}.length`);
        gen.forRange("i", 0, len, (i) => {
          cxt.subschema({
            keyword,
            dataProp: i,
            dataPropType: util_1.Type.Num
          }, valid);
          gen.if((0, codegen_1.not)(valid), notValid);
        });
      }
    }
    exports.validateArray = validateArray;
    function validateUnion(cxt) {
      const { gen, schema, keyword, it } = cxt;
      if (!Array.isArray(schema))
        throw new Error("ajv implementation error");
      const alwaysValid = schema.some((sch) => (0, util_1.alwaysValidSchema)(it, sch));
      if (alwaysValid && !it.opts.unevaluated)
        return;
      const valid = gen.let("valid", false);
      const schValid = gen.name("_valid");
      gen.block(() => schema.forEach((_sch, i) => {
        const schCxt = cxt.subschema({
          keyword,
          schemaProp: i,
          compositeRule: true
        }, schValid);
        gen.assign(valid, (0, codegen_1._)`${valid} || ${schValid}`);
        const merged = cxt.mergeValidEvaluated(schCxt, schValid);
        if (!merged)
          gen.if((0, codegen_1.not)(valid));
      }));
      cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
    }
    exports.validateUnion = validateUnion;
  }
});

// ../node_modules/ajv/dist/compile/validate/keyword.js
var require_keyword = __commonJS({
  "../node_modules/ajv/dist/compile/validate/keyword.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateKeywordUsage = exports.validSchemaType = exports.funcKeywordCode = exports.macroKeywordCode = void 0;
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var code_1 = require_code2();
    var errors_1 = require_errors();
    function macroKeywordCode(cxt, def) {
      const { gen, keyword, schema, parentSchema, it } = cxt;
      const macroSchema = def.macro.call(it.self, schema, parentSchema, it);
      const schemaRef = useKeyword(gen, keyword, macroSchema);
      if (it.opts.validateSchema !== false)
        it.self.validateSchema(macroSchema, true);
      const valid = gen.name("valid");
      cxt.subschema({
        schema: macroSchema,
        schemaPath: codegen_1.nil,
        errSchemaPath: `${it.errSchemaPath}/${keyword}`,
        topSchemaRef: schemaRef,
        compositeRule: true
      }, valid);
      cxt.pass(valid, () => cxt.error(true));
    }
    exports.macroKeywordCode = macroKeywordCode;
    function funcKeywordCode(cxt, def) {
      var _a;
      const { gen, keyword, schema, parentSchema, $data, it } = cxt;
      checkAsyncKeyword(it, def);
      const validate = !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate;
      const validateRef = useKeyword(gen, keyword, validate);
      const valid = gen.let("valid");
      cxt.block$data(valid, validateKeyword);
      cxt.ok((_a = def.valid) !== null && _a !== void 0 ? _a : valid);
      function validateKeyword() {
        if (def.errors === false) {
          assignValid();
          if (def.modifying)
            modifyData(cxt);
          reportErrs(() => cxt.error());
        } else {
          const ruleErrs = def.async ? validateAsync() : validateSync();
          if (def.modifying)
            modifyData(cxt);
          reportErrs(() => addErrs(cxt, ruleErrs));
        }
      }
      function validateAsync() {
        const ruleErrs = gen.let("ruleErrs", null);
        gen.try(() => assignValid((0, codegen_1._)`await `), (e) => gen.assign(valid, false).if((0, codegen_1._)`${e} instanceof ${it.ValidationError}`, () => gen.assign(ruleErrs, (0, codegen_1._)`${e}.errors`), () => gen.throw(e)));
        return ruleErrs;
      }
      function validateSync() {
        const validateErrs = (0, codegen_1._)`${validateRef}.errors`;
        gen.assign(validateErrs, null);
        assignValid(codegen_1.nil);
        return validateErrs;
      }
      function assignValid(_await = def.async ? (0, codegen_1._)`await ` : codegen_1.nil) {
        const passCxt = it.opts.passContext ? names_1.default.this : names_1.default.self;
        const passSchema = !("compile" in def && !$data || def.schema === false);
        gen.assign(valid, (0, codegen_1._)`${_await}${(0, code_1.callValidateCode)(cxt, validateRef, passCxt, passSchema)}`, def.modifying);
      }
      function reportErrs(errors) {
        var _a2;
        gen.if((0, codegen_1.not)((_a2 = def.valid) !== null && _a2 !== void 0 ? _a2 : valid), errors);
      }
    }
    exports.funcKeywordCode = funcKeywordCode;
    function modifyData(cxt) {
      const { gen, data, it } = cxt;
      gen.if(it.parentData, () => gen.assign(data, (0, codegen_1._)`${it.parentData}[${it.parentDataProperty}]`));
    }
    function addErrs(cxt, errs) {
      const { gen } = cxt;
      gen.if((0, codegen_1._)`Array.isArray(${errs})`, () => {
        gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`).assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
        (0, errors_1.extendErrors)(cxt);
      }, () => cxt.error());
    }
    function checkAsyncKeyword({ schemaEnv }, def) {
      if (def.async && !schemaEnv.$async)
        throw new Error("async keyword in sync schema");
    }
    function useKeyword(gen, keyword, result) {
      if (result === void 0)
        throw new Error(`keyword "${keyword}" failed to compile`);
      return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : { ref: result, code: (0, codegen_1.stringify)(result) });
    }
    function validSchemaType(schema, schemaType, allowUndefined = false) {
      return !schemaType.length || schemaType.some((st) => st === "array" ? Array.isArray(schema) : st === "object" ? schema && typeof schema == "object" && !Array.isArray(schema) : typeof schema == st || allowUndefined && typeof schema == "undefined");
    }
    exports.validSchemaType = validSchemaType;
    function validateKeywordUsage({ schema, opts, self, errSchemaPath }, def, keyword) {
      if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) {
        throw new Error("ajv implementation error");
      }
      const deps = def.dependencies;
      if (deps === null || deps === void 0 ? void 0 : deps.some((kwd) => !Object.prototype.hasOwnProperty.call(schema, kwd))) {
        throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`);
      }
      if (def.validateSchema) {
        const valid = def.validateSchema(schema[keyword]);
        if (!valid) {
          const msg = `keyword "${keyword}" value is invalid at path "${errSchemaPath}": ` + self.errorsText(def.validateSchema.errors);
          if (opts.validateSchema === "log")
            self.logger.error(msg);
          else
            throw new Error(msg);
        }
      }
    }
    exports.validateKeywordUsage = validateKeywordUsage;
  }
});

// ../node_modules/ajv/dist/compile/validate/subschema.js
var require_subschema = __commonJS({
  "../node_modules/ajv/dist/compile/validate/subschema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extendSubschemaMode = exports.extendSubschemaData = exports.getSubschema = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    function getSubschema(it, { keyword, schemaProp, schema, schemaPath, errSchemaPath, topSchemaRef }) {
      if (keyword !== void 0 && schema !== void 0) {
        throw new Error('both "keyword" and "schema" passed, only one allowed');
      }
      if (keyword !== void 0) {
        const sch = it.schema[keyword];
        return schemaProp === void 0 ? {
          schema: sch,
          schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}`,
          errSchemaPath: `${it.errSchemaPath}/${keyword}`
        } : {
          schema: sch[schemaProp],
          schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}${(0, codegen_1.getProperty)(schemaProp)}`,
          errSchemaPath: `${it.errSchemaPath}/${keyword}/${(0, util_1.escapeFragment)(schemaProp)}`
        };
      }
      if (schema !== void 0) {
        if (schemaPath === void 0 || errSchemaPath === void 0 || topSchemaRef === void 0) {
          throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
        }
        return {
          schema,
          schemaPath,
          topSchemaRef,
          errSchemaPath
        };
      }
      throw new Error('either "keyword" or "schema" must be passed');
    }
    exports.getSubschema = getSubschema;
    function extendSubschemaData(subschema, it, { dataProp, dataPropType: dpType, data, dataTypes, propertyName }) {
      if (data !== void 0 && dataProp !== void 0) {
        throw new Error('both "data" and "dataProp" passed, only one allowed');
      }
      const { gen } = it;
      if (dataProp !== void 0) {
        const { errorPath, dataPathArr, opts } = it;
        const nextData = gen.let("data", (0, codegen_1._)`${it.data}${(0, codegen_1.getProperty)(dataProp)}`, true);
        dataContextProps(nextData);
        subschema.errorPath = (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(dataProp, dpType, opts.jsPropertySyntax)}`;
        subschema.parentDataProperty = (0, codegen_1._)`${dataProp}`;
        subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty];
      }
      if (data !== void 0) {
        const nextData = data instanceof codegen_1.Name ? data : gen.let("data", data, true);
        dataContextProps(nextData);
        if (propertyName !== void 0)
          subschema.propertyName = propertyName;
      }
      if (dataTypes)
        subschema.dataTypes = dataTypes;
      function dataContextProps(_nextData) {
        subschema.data = _nextData;
        subschema.dataLevel = it.dataLevel + 1;
        subschema.dataTypes = [];
        it.definedProperties = /* @__PURE__ */ new Set();
        subschema.parentData = it.data;
        subschema.dataNames = [...it.dataNames, _nextData];
      }
    }
    exports.extendSubschemaData = extendSubschemaData;
    function extendSubschemaMode(subschema, { jtdDiscriminator, jtdMetadata, compositeRule, createErrors, allErrors }) {
      if (compositeRule !== void 0)
        subschema.compositeRule = compositeRule;
      if (createErrors !== void 0)
        subschema.createErrors = createErrors;
      if (allErrors !== void 0)
        subschema.allErrors = allErrors;
      subschema.jtdDiscriminator = jtdDiscriminator;
      subschema.jtdMetadata = jtdMetadata;
    }
    exports.extendSubschemaMode = extendSubschemaMode;
  }
});

// ../node_modules/fast-deep-equal/index.js
var require_fast_deep_equal = __commonJS({
  "../node_modules/fast-deep-equal/index.js"(exports, module) {
    "use strict";
    module.exports = function equal(a, b) {
      if (a === b) return true;
      if (a && b && typeof a == "object" && typeof b == "object") {
        if (a.constructor !== b.constructor) return false;
        var length, i, keys;
        if (Array.isArray(a)) {
          length = a.length;
          if (length != b.length) return false;
          for (i = length; i-- !== 0; )
            if (!equal(a[i], b[i])) return false;
          return true;
        }
        if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
        if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
        if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
        keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length) return false;
        for (i = length; i-- !== 0; )
          if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
        for (i = length; i-- !== 0; ) {
          var key = keys[i];
          if (!equal(a[key], b[key])) return false;
        }
        return true;
      }
      return a !== a && b !== b;
    };
  }
});

// ../node_modules/json-schema-traverse/index.js
var require_json_schema_traverse = __commonJS({
  "../node_modules/json-schema-traverse/index.js"(exports, module) {
    "use strict";
    var traverse = module.exports = function(schema, opts, cb) {
      if (typeof opts == "function") {
        cb = opts;
        opts = {};
      }
      cb = opts.cb || cb;
      var pre = typeof cb == "function" ? cb : cb.pre || function() {
      };
      var post = cb.post || function() {
      };
      _traverse(opts, pre, post, schema, "", schema);
    };
    traverse.keywords = {
      additionalItems: true,
      items: true,
      contains: true,
      additionalProperties: true,
      propertyNames: true,
      not: true,
      if: true,
      then: true,
      else: true
    };
    traverse.arrayKeywords = {
      items: true,
      allOf: true,
      anyOf: true,
      oneOf: true
    };
    traverse.propsKeywords = {
      $defs: true,
      definitions: true,
      properties: true,
      patternProperties: true,
      dependencies: true
    };
    traverse.skipKeywords = {
      default: true,
      enum: true,
      const: true,
      required: true,
      maximum: true,
      minimum: true,
      exclusiveMaximum: true,
      exclusiveMinimum: true,
      multipleOf: true,
      maxLength: true,
      minLength: true,
      pattern: true,
      format: true,
      maxItems: true,
      minItems: true,
      uniqueItems: true,
      maxProperties: true,
      minProperties: true
    };
    function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
      if (schema && typeof schema == "object" && !Array.isArray(schema)) {
        pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
        for (var key in schema) {
          var sch = schema[key];
          if (Array.isArray(sch)) {
            if (key in traverse.arrayKeywords) {
              for (var i = 0; i < sch.length; i++)
                _traverse(opts, pre, post, sch[i], jsonPtr + "/" + key + "/" + i, rootSchema, jsonPtr, key, schema, i);
            }
          } else if (key in traverse.propsKeywords) {
            if (sch && typeof sch == "object") {
              for (var prop in sch)
                _traverse(opts, pre, post, sch[prop], jsonPtr + "/" + key + "/" + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
            }
          } else if (key in traverse.keywords || opts.allKeys && !(key in traverse.skipKeywords)) {
            _traverse(opts, pre, post, sch, jsonPtr + "/" + key, rootSchema, jsonPtr, key, schema);
          }
        }
        post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
      }
    }
    function escapeJsonPtr(str) {
      return str.replace(/~/g, "~0").replace(/\//g, "~1");
    }
  }
});

// ../node_modules/ajv/dist/compile/resolve.js
var require_resolve = __commonJS({
  "../node_modules/ajv/dist/compile/resolve.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSchemaRefs = exports.resolveUrl = exports.normalizeId = exports._getFullPath = exports.getFullPath = exports.inlineRef = void 0;
    var util_1 = require_util();
    var equal = require_fast_deep_equal();
    var traverse = require_json_schema_traverse();
    var SIMPLE_INLINED = /* @__PURE__ */ new Set([
      "type",
      "format",
      "pattern",
      "maxLength",
      "minLength",
      "maxProperties",
      "minProperties",
      "maxItems",
      "minItems",
      "maximum",
      "minimum",
      "uniqueItems",
      "multipleOf",
      "required",
      "enum",
      "const"
    ]);
    function inlineRef(schema, limit = true) {
      if (typeof schema == "boolean")
        return true;
      if (limit === true)
        return !hasRef(schema);
      if (!limit)
        return false;
      return countKeys(schema) <= limit;
    }
    exports.inlineRef = inlineRef;
    var REF_KEYWORDS = /* @__PURE__ */ new Set([
      "$ref",
      "$recursiveRef",
      "$recursiveAnchor",
      "$dynamicRef",
      "$dynamicAnchor"
    ]);
    function hasRef(schema) {
      for (const key in schema) {
        if (REF_KEYWORDS.has(key))
          return true;
        const sch = schema[key];
        if (Array.isArray(sch) && sch.some(hasRef))
          return true;
        if (typeof sch == "object" && hasRef(sch))
          return true;
      }
      return false;
    }
    function countKeys(schema) {
      let count = 0;
      for (const key in schema) {
        if (key === "$ref")
          return Infinity;
        count++;
        if (SIMPLE_INLINED.has(key))
          continue;
        if (typeof schema[key] == "object") {
          (0, util_1.eachItem)(schema[key], (sch) => count += countKeys(sch));
        }
        if (count === Infinity)
          return Infinity;
      }
      return count;
    }
    function getFullPath(resolver, id = "", normalize) {
      if (normalize !== false)
        id = normalizeId(id);
      const p = resolver.parse(id);
      return _getFullPath(resolver, p);
    }
    exports.getFullPath = getFullPath;
    function _getFullPath(resolver, p) {
      const serialized = resolver.serialize(p);
      return serialized.split("#")[0] + "#";
    }
    exports._getFullPath = _getFullPath;
    var TRAILING_SLASH_HASH = /#\/?$/;
    function normalizeId(id) {
      return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
    }
    exports.normalizeId = normalizeId;
    function resolveUrl(resolver, baseId, id) {
      id = normalizeId(id);
      return resolver.resolve(baseId, id);
    }
    exports.resolveUrl = resolveUrl;
    var ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
    function getSchemaRefs(schema, baseId) {
      if (typeof schema == "boolean")
        return {};
      const { schemaId, uriResolver } = this.opts;
      const schId = normalizeId(schema[schemaId] || baseId);
      const baseIds = { "": schId };
      const pathPrefix = getFullPath(uriResolver, schId, false);
      const localRefs = {};
      const schemaRefs = /* @__PURE__ */ new Set();
      traverse(schema, { allKeys: true }, (sch, jsonPtr, _, parentJsonPtr) => {
        if (parentJsonPtr === void 0)
          return;
        const fullPath = pathPrefix + jsonPtr;
        let innerBaseId = baseIds[parentJsonPtr];
        if (typeof sch[schemaId] == "string")
          innerBaseId = addRef.call(this, sch[schemaId]);
        addAnchor.call(this, sch.$anchor);
        addAnchor.call(this, sch.$dynamicAnchor);
        baseIds[jsonPtr] = innerBaseId;
        function addRef(ref) {
          const _resolve = this.opts.uriResolver.resolve;
          ref = normalizeId(innerBaseId ? _resolve(innerBaseId, ref) : ref);
          if (schemaRefs.has(ref))
            throw ambiguos(ref);
          schemaRefs.add(ref);
          let schOrRef = this.refs[ref];
          if (typeof schOrRef == "string")
            schOrRef = this.refs[schOrRef];
          if (typeof schOrRef == "object") {
            checkAmbiguosRef(sch, schOrRef.schema, ref);
          } else if (ref !== normalizeId(fullPath)) {
            if (ref[0] === "#") {
              checkAmbiguosRef(sch, localRefs[ref], ref);
              localRefs[ref] = sch;
            } else {
              this.refs[ref] = fullPath;
            }
          }
          return ref;
        }
        function addAnchor(anchor) {
          if (typeof anchor == "string") {
            if (!ANCHOR.test(anchor))
              throw new Error(`invalid anchor "${anchor}"`);
            addRef.call(this, `#${anchor}`);
          }
        }
      });
      return localRefs;
      function checkAmbiguosRef(sch1, sch2, ref) {
        if (sch2 !== void 0 && !equal(sch1, sch2))
          throw ambiguos(ref);
      }
      function ambiguos(ref) {
        return new Error(`reference "${ref}" resolves to more than one schema`);
      }
    }
    exports.getSchemaRefs = getSchemaRefs;
  }
});

// ../node_modules/ajv/dist/compile/validate/index.js
var require_validate = __commonJS({
  "../node_modules/ajv/dist/compile/validate/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getData = exports.KeywordCxt = exports.validateFunctionCode = void 0;
    var boolSchema_1 = require_boolSchema();
    var dataType_1 = require_dataType();
    var applicability_1 = require_applicability();
    var dataType_2 = require_dataType();
    var defaults_1 = require_defaults();
    var keyword_1 = require_keyword();
    var subschema_1 = require_subschema();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var resolve_1 = require_resolve();
    var util_1 = require_util();
    var errors_1 = require_errors();
    function validateFunctionCode(it) {
      if (isSchemaObj(it)) {
        checkKeywords(it);
        if (schemaCxtHasRules(it)) {
          topSchemaObjCode(it);
          return;
        }
      }
      validateFunction(it, () => (0, boolSchema_1.topBoolOrEmptySchema)(it));
    }
    exports.validateFunctionCode = validateFunctionCode;
    function validateFunction({ gen, validateName, schema, schemaEnv, opts }, body) {
      if (opts.code.es5) {
        gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${names_1.default.valCxt}`, schemaEnv.$async, () => {
          gen.code((0, codegen_1._)`"use strict"; ${funcSourceUrl(schema, opts)}`);
          destructureValCxtES5(gen, opts);
          gen.code(body);
        });
      } else {
        gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () => gen.code(funcSourceUrl(schema, opts)).code(body));
      }
    }
    function destructureValCxt(opts) {
      return (0, codegen_1._)`{${names_1.default.instancePath}="", ${names_1.default.parentData}, ${names_1.default.parentDataProperty}, ${names_1.default.rootData}=${names_1.default.data}${opts.dynamicRef ? (0, codegen_1._)`, ${names_1.default.dynamicAnchors}={}` : codegen_1.nil}}={}`;
    }
    function destructureValCxtES5(gen, opts) {
      gen.if(names_1.default.valCxt, () => {
        gen.var(names_1.default.instancePath, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.instancePath}`);
        gen.var(names_1.default.parentData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentData}`);
        gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentDataProperty}`);
        gen.var(names_1.default.rootData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.rootData}`);
        if (opts.dynamicRef)
          gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.dynamicAnchors}`);
      }, () => {
        gen.var(names_1.default.instancePath, (0, codegen_1._)`""`);
        gen.var(names_1.default.parentData, (0, codegen_1._)`undefined`);
        gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`undefined`);
        gen.var(names_1.default.rootData, names_1.default.data);
        if (opts.dynamicRef)
          gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`{}`);
      });
    }
    function topSchemaObjCode(it) {
      const { schema, opts, gen } = it;
      validateFunction(it, () => {
        if (opts.$comment && schema.$comment)
          commentKeyword(it);
        checkNoDefault(it);
        gen.let(names_1.default.vErrors, null);
        gen.let(names_1.default.errors, 0);
        if (opts.unevaluated)
          resetEvaluated(it);
        typeAndKeywords(it);
        returnResults(it);
      });
      return;
    }
    function resetEvaluated(it) {
      const { gen, validateName } = it;
      it.evaluated = gen.const("evaluated", (0, codegen_1._)`${validateName}.evaluated`);
      gen.if((0, codegen_1._)`${it.evaluated}.dynamicProps`, () => gen.assign((0, codegen_1._)`${it.evaluated}.props`, (0, codegen_1._)`undefined`));
      gen.if((0, codegen_1._)`${it.evaluated}.dynamicItems`, () => gen.assign((0, codegen_1._)`${it.evaluated}.items`, (0, codegen_1._)`undefined`));
    }
    function funcSourceUrl(schema, opts) {
      const schId = typeof schema == "object" && schema[opts.schemaId];
      return schId && (opts.code.source || opts.code.process) ? (0, codegen_1._)`/*# sourceURL=${schId} */` : codegen_1.nil;
    }
    function subschemaCode(it, valid) {
      if (isSchemaObj(it)) {
        checkKeywords(it);
        if (schemaCxtHasRules(it)) {
          subSchemaObjCode(it, valid);
          return;
        }
      }
      (0, boolSchema_1.boolOrEmptySchema)(it, valid);
    }
    function schemaCxtHasRules({ schema, self }) {
      if (typeof schema == "boolean")
        return !schema;
      for (const key in schema)
        if (self.RULES.all[key])
          return true;
      return false;
    }
    function isSchemaObj(it) {
      return typeof it.schema != "boolean";
    }
    function subSchemaObjCode(it, valid) {
      const { schema, gen, opts } = it;
      if (opts.$comment && schema.$comment)
        commentKeyword(it);
      updateContext(it);
      checkAsyncSchema(it);
      const errsCount = gen.const("_errs", names_1.default.errors);
      typeAndKeywords(it, errsCount);
      gen.var(valid, (0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
    }
    function checkKeywords(it) {
      (0, util_1.checkUnknownRules)(it);
      checkRefsAndKeywords(it);
    }
    function typeAndKeywords(it, errsCount) {
      if (it.opts.jtd)
        return schemaKeywords(it, [], false, errsCount);
      const types = (0, dataType_1.getSchemaTypes)(it.schema);
      const checkedTypes = (0, dataType_1.coerceAndCheckDataType)(it, types);
      schemaKeywords(it, types, !checkedTypes, errsCount);
    }
    function checkRefsAndKeywords(it) {
      const { schema, errSchemaPath, opts, self } = it;
      if (schema.$ref && opts.ignoreKeywordsWithRef && (0, util_1.schemaHasRulesButRef)(schema, self.RULES)) {
        self.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`);
      }
    }
    function checkNoDefault(it) {
      const { schema, opts } = it;
      if (schema.default !== void 0 && opts.useDefaults && opts.strictSchema) {
        (0, util_1.checkStrictMode)(it, "default is ignored in the schema root");
      }
    }
    function updateContext(it) {
      const schId = it.schema[it.opts.schemaId];
      if (schId)
        it.baseId = (0, resolve_1.resolveUrl)(it.opts.uriResolver, it.baseId, schId);
    }
    function checkAsyncSchema(it) {
      if (it.schema.$async && !it.schemaEnv.$async)
        throw new Error("async schema in sync schema");
    }
    function commentKeyword({ gen, schemaEnv, schema, errSchemaPath, opts }) {
      const msg = schema.$comment;
      if (opts.$comment === true) {
        gen.code((0, codegen_1._)`${names_1.default.self}.logger.log(${msg})`);
      } else if (typeof opts.$comment == "function") {
        const schemaPath = (0, codegen_1.str)`${errSchemaPath}/$comment`;
        const rootName = gen.scopeValue("root", { ref: schemaEnv.root });
        gen.code((0, codegen_1._)`${names_1.default.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`);
      }
    }
    function returnResults(it) {
      const { gen, schemaEnv, validateName, ValidationError, opts } = it;
      if (schemaEnv.$async) {
        gen.if((0, codegen_1._)`${names_1.default.errors} === 0`, () => gen.return(names_1.default.data), () => gen.throw((0, codegen_1._)`new ${ValidationError}(${names_1.default.vErrors})`));
      } else {
        gen.assign((0, codegen_1._)`${validateName}.errors`, names_1.default.vErrors);
        if (opts.unevaluated)
          assignEvaluated(it);
        gen.return((0, codegen_1._)`${names_1.default.errors} === 0`);
      }
    }
    function assignEvaluated({ gen, evaluated, props, items }) {
      if (props instanceof codegen_1.Name)
        gen.assign((0, codegen_1._)`${evaluated}.props`, props);
      if (items instanceof codegen_1.Name)
        gen.assign((0, codegen_1._)`${evaluated}.items`, items);
    }
    function schemaKeywords(it, types, typeErrors, errsCount) {
      const { gen, schema, data, allErrors, opts, self } = it;
      const { RULES } = self;
      if (schema.$ref && (opts.ignoreKeywordsWithRef || !(0, util_1.schemaHasRulesButRef)(schema, RULES))) {
        gen.block(() => keywordCode(it, "$ref", RULES.all.$ref.definition));
        return;
      }
      if (!opts.jtd)
        checkStrictTypes(it, types);
      gen.block(() => {
        for (const group of RULES.rules)
          groupKeywords(group);
        groupKeywords(RULES.post);
      });
      function groupKeywords(group) {
        if (!(0, applicability_1.shouldUseGroup)(schema, group))
          return;
        if (group.type) {
          gen.if((0, dataType_2.checkDataType)(group.type, data, opts.strictNumbers));
          iterateKeywords(it, group);
          if (types.length === 1 && types[0] === group.type && typeErrors) {
            gen.else();
            (0, dataType_2.reportTypeError)(it);
          }
          gen.endIf();
        } else {
          iterateKeywords(it, group);
        }
        if (!allErrors)
          gen.if((0, codegen_1._)`${names_1.default.errors} === ${errsCount || 0}`);
      }
    }
    function iterateKeywords(it, group) {
      const { gen, schema, opts: { useDefaults } } = it;
      if (useDefaults)
        (0, defaults_1.assignDefaults)(it, group.type);
      gen.block(() => {
        for (const rule of group.rules) {
          if ((0, applicability_1.shouldUseRule)(schema, rule)) {
            keywordCode(it, rule.keyword, rule.definition, group.type);
          }
        }
      });
    }
    function checkStrictTypes(it, types) {
      if (it.schemaEnv.meta || !it.opts.strictTypes)
        return;
      checkContextTypes(it, types);
      if (!it.opts.allowUnionTypes)
        checkMultipleTypes(it, types);
      checkKeywordTypes(it, it.dataTypes);
    }
    function checkContextTypes(it, types) {
      if (!types.length)
        return;
      if (!it.dataTypes.length) {
        it.dataTypes = types;
        return;
      }
      types.forEach((t) => {
        if (!includesType(it.dataTypes, t)) {
          strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`);
        }
      });
      narrowSchemaTypes(it, types);
    }
    function checkMultipleTypes(it, ts) {
      if (ts.length > 1 && !(ts.length === 2 && ts.includes("null"))) {
        strictTypesError(it, "use allowUnionTypes to allow union type keyword");
      }
    }
    function checkKeywordTypes(it, ts) {
      const rules = it.self.RULES.all;
      for (const keyword in rules) {
        const rule = rules[keyword];
        if (typeof rule == "object" && (0, applicability_1.shouldUseRule)(it.schema, rule)) {
          const { type } = rule.definition;
          if (type.length && !type.some((t) => hasApplicableType(ts, t))) {
            strictTypesError(it, `missing type "${type.join(",")}" for keyword "${keyword}"`);
          }
        }
      }
    }
    function hasApplicableType(schTs, kwdT) {
      return schTs.includes(kwdT) || kwdT === "number" && schTs.includes("integer");
    }
    function includesType(ts, t) {
      return ts.includes(t) || t === "integer" && ts.includes("number");
    }
    function narrowSchemaTypes(it, withTypes) {
      const ts = [];
      for (const t of it.dataTypes) {
        if (includesType(withTypes, t))
          ts.push(t);
        else if (withTypes.includes("integer") && t === "number")
          ts.push("integer");
      }
      it.dataTypes = ts;
    }
    function strictTypesError(it, msg) {
      const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
      msg += ` at "${schemaPath}" (strictTypes)`;
      (0, util_1.checkStrictMode)(it, msg, it.opts.strictTypes);
    }
    var KeywordCxt = class {
      constructor(it, def, keyword) {
        (0, keyword_1.validateKeywordUsage)(it, def, keyword);
        this.gen = it.gen;
        this.allErrors = it.allErrors;
        this.keyword = keyword;
        this.data = it.data;
        this.schema = it.schema[keyword];
        this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data;
        this.schemaValue = (0, util_1.schemaRefOrVal)(it, this.schema, keyword, this.$data);
        this.schemaType = def.schemaType;
        this.parentSchema = it.schema;
        this.params = {};
        this.it = it;
        this.def = def;
        if (this.$data) {
          this.schemaCode = it.gen.const("vSchema", getData(this.$data, it));
        } else {
          this.schemaCode = this.schemaValue;
          if (!(0, keyword_1.validSchemaType)(this.schema, def.schemaType, def.allowUndefined)) {
            throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`);
          }
        }
        if ("code" in def ? def.trackErrors : def.errors !== false) {
          this.errsCount = it.gen.const("_errs", names_1.default.errors);
        }
      }
      result(condition, successAction, failAction) {
        this.failResult((0, codegen_1.not)(condition), successAction, failAction);
      }
      failResult(condition, successAction, failAction) {
        this.gen.if(condition);
        if (failAction)
          failAction();
        else
          this.error();
        if (successAction) {
          this.gen.else();
          successAction();
          if (this.allErrors)
            this.gen.endIf();
        } else {
          if (this.allErrors)
            this.gen.endIf();
          else
            this.gen.else();
        }
      }
      pass(condition, failAction) {
        this.failResult((0, codegen_1.not)(condition), void 0, failAction);
      }
      fail(condition) {
        if (condition === void 0) {
          this.error();
          if (!this.allErrors)
            this.gen.if(false);
          return;
        }
        this.gen.if(condition);
        this.error();
        if (this.allErrors)
          this.gen.endIf();
        else
          this.gen.else();
      }
      fail$data(condition) {
        if (!this.$data)
          return this.fail(condition);
        const { schemaCode } = this;
        this.fail((0, codegen_1._)`${schemaCode} !== undefined && (${(0, codegen_1.or)(this.invalid$data(), condition)})`);
      }
      error(append, errorParams, errorPaths) {
        if (errorParams) {
          this.setParams(errorParams);
          this._error(append, errorPaths);
          this.setParams({});
          return;
        }
        this._error(append, errorPaths);
      }
      _error(append, errorPaths) {
        ;
        (append ? errors_1.reportExtraError : errors_1.reportError)(this, this.def.error, errorPaths);
      }
      $dataError() {
        (0, errors_1.reportError)(this, this.def.$dataError || errors_1.keyword$DataError);
      }
      reset() {
        if (this.errsCount === void 0)
          throw new Error('add "trackErrors" to keyword definition');
        (0, errors_1.resetErrorsCount)(this.gen, this.errsCount);
      }
      ok(cond) {
        if (!this.allErrors)
          this.gen.if(cond);
      }
      setParams(obj, assign) {
        if (assign)
          Object.assign(this.params, obj);
        else
          this.params = obj;
      }
      block$data(valid, codeBlock, $dataValid = codegen_1.nil) {
        this.gen.block(() => {
          this.check$data(valid, $dataValid);
          codeBlock();
        });
      }
      check$data(valid = codegen_1.nil, $dataValid = codegen_1.nil) {
        if (!this.$data)
          return;
        const { gen, schemaCode, schemaType, def } = this;
        gen.if((0, codegen_1.or)((0, codegen_1._)`${schemaCode} === undefined`, $dataValid));
        if (valid !== codegen_1.nil)
          gen.assign(valid, true);
        if (schemaType.length || def.validateSchema) {
          gen.elseIf(this.invalid$data());
          this.$dataError();
          if (valid !== codegen_1.nil)
            gen.assign(valid, false);
        }
        gen.else();
      }
      invalid$data() {
        const { gen, schemaCode, schemaType, def, it } = this;
        return (0, codegen_1.or)(wrong$DataType(), invalid$DataSchema());
        function wrong$DataType() {
          if (schemaType.length) {
            if (!(schemaCode instanceof codegen_1.Name))
              throw new Error("ajv implementation error");
            const st = Array.isArray(schemaType) ? schemaType : [schemaType];
            return (0, codegen_1._)`${(0, dataType_2.checkDataTypes)(st, schemaCode, it.opts.strictNumbers, dataType_2.DataType.Wrong)}`;
          }
          return codegen_1.nil;
        }
        function invalid$DataSchema() {
          if (def.validateSchema) {
            const validateSchemaRef = gen.scopeValue("validate$data", { ref: def.validateSchema });
            return (0, codegen_1._)`!${validateSchemaRef}(${schemaCode})`;
          }
          return codegen_1.nil;
        }
      }
      subschema(appl, valid) {
        const subschema = (0, subschema_1.getSubschema)(this.it, appl);
        (0, subschema_1.extendSubschemaData)(subschema, this.it, appl);
        (0, subschema_1.extendSubschemaMode)(subschema, appl);
        const nextContext = { ...this.it, ...subschema, items: void 0, props: void 0 };
        subschemaCode(nextContext, valid);
        return nextContext;
      }
      mergeEvaluated(schemaCxt, toName) {
        const { it, gen } = this;
        if (!it.opts.unevaluated)
          return;
        if (it.props !== true && schemaCxt.props !== void 0) {
          it.props = util_1.mergeEvaluated.props(gen, schemaCxt.props, it.props, toName);
        }
        if (it.items !== true && schemaCxt.items !== void 0) {
          it.items = util_1.mergeEvaluated.items(gen, schemaCxt.items, it.items, toName);
        }
      }
      mergeValidEvaluated(schemaCxt, valid) {
        const { it, gen } = this;
        if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
          gen.if(valid, () => this.mergeEvaluated(schemaCxt, codegen_1.Name));
          return true;
        }
      }
    };
    exports.KeywordCxt = KeywordCxt;
    function keywordCode(it, keyword, def, ruleType) {
      const cxt = new KeywordCxt(it, def, keyword);
      if ("code" in def) {
        def.code(cxt, ruleType);
      } else if (cxt.$data && def.validate) {
        (0, keyword_1.funcKeywordCode)(cxt, def);
      } else if ("macro" in def) {
        (0, keyword_1.macroKeywordCode)(cxt, def);
      } else if (def.compile || def.validate) {
        (0, keyword_1.funcKeywordCode)(cxt, def);
      }
    }
    var JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
    var RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
    function getData($data, { dataLevel, dataNames, dataPathArr }) {
      let jsonPointer;
      let data;
      if ($data === "")
        return names_1.default.rootData;
      if ($data[0] === "/") {
        if (!JSON_POINTER.test($data))
          throw new Error(`Invalid JSON-pointer: ${$data}`);
        jsonPointer = $data;
        data = names_1.default.rootData;
      } else {
        const matches = RELATIVE_JSON_POINTER.exec($data);
        if (!matches)
          throw new Error(`Invalid JSON-pointer: ${$data}`);
        const up = +matches[1];
        jsonPointer = matches[2];
        if (jsonPointer === "#") {
          if (up >= dataLevel)
            throw new Error(errorMsg("property/index", up));
          return dataPathArr[dataLevel - up];
        }
        if (up > dataLevel)
          throw new Error(errorMsg("data", up));
        data = dataNames[dataLevel - up];
        if (!jsonPointer)
          return data;
      }
      let expr = data;
      const segments = jsonPointer.split("/");
      for (const segment of segments) {
        if (segment) {
          data = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)((0, util_1.unescapeJsonPointer)(segment))}`;
          expr = (0, codegen_1._)`${expr} && ${data}`;
        }
      }
      return expr;
      function errorMsg(pointerType, up) {
        return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`;
      }
    }
    exports.getData = getData;
  }
});

// ../node_modules/ajv/dist/runtime/validation_error.js
var require_validation_error = __commonJS({
  "../node_modules/ajv/dist/runtime/validation_error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ValidationError = class extends Error {
      constructor(errors) {
        super("validation failed");
        this.errors = errors;
        this.ajv = this.validation = true;
      }
    };
    exports.default = ValidationError;
  }
});

// ../node_modules/ajv/dist/compile/ref_error.js
var require_ref_error = __commonJS({
  "../node_modules/ajv/dist/compile/ref_error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var resolve_1 = require_resolve();
    var MissingRefError = class extends Error {
      constructor(resolver, baseId, ref, msg) {
        super(msg || `can't resolve reference ${ref} from id ${baseId}`);
        this.missingRef = (0, resolve_1.resolveUrl)(resolver, baseId, ref);
        this.missingSchema = (0, resolve_1.normalizeId)((0, resolve_1.getFullPath)(resolver, this.missingRef));
      }
    };
    exports.default = MissingRefError;
  }
});

// ../node_modules/ajv/dist/compile/index.js
var require_compile = __commonJS({
  "../node_modules/ajv/dist/compile/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveSchema = exports.getCompilingSchema = exports.resolveRef = exports.compileSchema = exports.SchemaEnv = void 0;
    var codegen_1 = require_codegen();
    var validation_error_1 = require_validation_error();
    var names_1 = require_names();
    var resolve_1 = require_resolve();
    var util_1 = require_util();
    var validate_1 = require_validate();
    var SchemaEnv = class {
      constructor(env) {
        var _a;
        this.refs = {};
        this.dynamicAnchors = {};
        let schema;
        if (typeof env.schema == "object")
          schema = env.schema;
        this.schema = env.schema;
        this.schemaId = env.schemaId;
        this.root = env.root || this;
        this.baseId = (_a = env.baseId) !== null && _a !== void 0 ? _a : (0, resolve_1.normalizeId)(schema === null || schema === void 0 ? void 0 : schema[env.schemaId || "$id"]);
        this.schemaPath = env.schemaPath;
        this.localRefs = env.localRefs;
        this.meta = env.meta;
        this.$async = schema === null || schema === void 0 ? void 0 : schema.$async;
        this.refs = {};
      }
    };
    exports.SchemaEnv = SchemaEnv;
    function compileSchema(sch) {
      const _sch = getCompilingSchema.call(this, sch);
      if (_sch)
        return _sch;
      const rootId = (0, resolve_1.getFullPath)(this.opts.uriResolver, sch.root.baseId);
      const { es5, lines } = this.opts.code;
      const { ownProperties } = this.opts;
      const gen = new codegen_1.CodeGen(this.scope, { es5, lines, ownProperties });
      let _ValidationError;
      if (sch.$async) {
        _ValidationError = gen.scopeValue("Error", {
          ref: validation_error_1.default,
          code: (0, codegen_1._)`require("ajv/dist/runtime/validation_error").default`
        });
      }
      const validateName = gen.scopeName("validate");
      sch.validateName = validateName;
      const schemaCxt = {
        gen,
        allErrors: this.opts.allErrors,
        data: names_1.default.data,
        parentData: names_1.default.parentData,
        parentDataProperty: names_1.default.parentDataProperty,
        dataNames: [names_1.default.data],
        dataPathArr: [codegen_1.nil],
        // TODO can its length be used as dataLevel if nil is removed?
        dataLevel: 0,
        dataTypes: [],
        definedProperties: /* @__PURE__ */ new Set(),
        topSchemaRef: gen.scopeValue("schema", this.opts.code.source === true ? { ref: sch.schema, code: (0, codegen_1.stringify)(sch.schema) } : { ref: sch.schema }),
        validateName,
        ValidationError: _ValidationError,
        schema: sch.schema,
        schemaEnv: sch,
        rootId,
        baseId: sch.baseId || rootId,
        schemaPath: codegen_1.nil,
        errSchemaPath: sch.schemaPath || (this.opts.jtd ? "" : "#"),
        errorPath: (0, codegen_1._)`""`,
        opts: this.opts,
        self: this
      };
      let sourceCode;
      try {
        this._compilations.add(sch);
        (0, validate_1.validateFunctionCode)(schemaCxt);
        gen.optimize(this.opts.code.optimize);
        const validateCode = gen.toString();
        sourceCode = `${gen.scopeRefs(names_1.default.scope)}return ${validateCode}`;
        if (this.opts.code.process)
          sourceCode = this.opts.code.process(sourceCode, sch);
        const makeValidate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode);
        const validate = makeValidate(this, this.scope.get());
        this.scope.value(validateName, { ref: validate });
        validate.errors = null;
        validate.schema = sch.schema;
        validate.schemaEnv = sch;
        if (sch.$async)
          validate.$async = true;
        if (this.opts.code.source === true) {
          validate.source = { validateName, validateCode, scopeValues: gen._values };
        }
        if (this.opts.unevaluated) {
          const { props, items } = schemaCxt;
          validate.evaluated = {
            props: props instanceof codegen_1.Name ? void 0 : props,
            items: items instanceof codegen_1.Name ? void 0 : items,
            dynamicProps: props instanceof codegen_1.Name,
            dynamicItems: items instanceof codegen_1.Name
          };
          if (validate.source)
            validate.source.evaluated = (0, codegen_1.stringify)(validate.evaluated);
        }
        sch.validate = validate;
        return sch;
      } catch (e) {
        delete sch.validate;
        delete sch.validateName;
        if (sourceCode)
          this.logger.error("Error compiling schema, function code:", sourceCode);
        throw e;
      } finally {
        this._compilations.delete(sch);
      }
    }
    exports.compileSchema = compileSchema;
    function resolveRef(root, baseId, ref) {
      var _a;
      ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, ref);
      const schOrFunc = root.refs[ref];
      if (schOrFunc)
        return schOrFunc;
      let _sch = resolve.call(this, root, ref);
      if (_sch === void 0) {
        const schema = (_a = root.localRefs) === null || _a === void 0 ? void 0 : _a[ref];
        const { schemaId } = this.opts;
        if (schema)
          _sch = new SchemaEnv({ schema, schemaId, root, baseId });
      }
      if (_sch === void 0)
        return;
      return root.refs[ref] = inlineOrCompile.call(this, _sch);
    }
    exports.resolveRef = resolveRef;
    function inlineOrCompile(sch) {
      if ((0, resolve_1.inlineRef)(sch.schema, this.opts.inlineRefs))
        return sch.schema;
      return sch.validate ? sch : compileSchema.call(this, sch);
    }
    function getCompilingSchema(schEnv) {
      for (const sch of this._compilations) {
        if (sameSchemaEnv(sch, schEnv))
          return sch;
      }
    }
    exports.getCompilingSchema = getCompilingSchema;
    function sameSchemaEnv(s1, s2) {
      return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId;
    }
    function resolve(root, ref) {
      let sch;
      while (typeof (sch = this.refs[ref]) == "string")
        ref = sch;
      return sch || this.schemas[ref] || resolveSchema.call(this, root, ref);
    }
    function resolveSchema(root, ref) {
      const p = this.opts.uriResolver.parse(ref);
      const refPath = (0, resolve_1._getFullPath)(this.opts.uriResolver, p);
      let baseId = (0, resolve_1.getFullPath)(this.opts.uriResolver, root.baseId, void 0);
      if (Object.keys(root.schema).length > 0 && refPath === baseId) {
        return getJsonPointer.call(this, p, root);
      }
      const id = (0, resolve_1.normalizeId)(refPath);
      const schOrRef = this.refs[id] || this.schemas[id];
      if (typeof schOrRef == "string") {
        const sch = resolveSchema.call(this, root, schOrRef);
        if (typeof (sch === null || sch === void 0 ? void 0 : sch.schema) !== "object")
          return;
        return getJsonPointer.call(this, p, sch);
      }
      if (typeof (schOrRef === null || schOrRef === void 0 ? void 0 : schOrRef.schema) !== "object")
        return;
      if (!schOrRef.validate)
        compileSchema.call(this, schOrRef);
      if (id === (0, resolve_1.normalizeId)(ref)) {
        const { schema } = schOrRef;
        const { schemaId } = this.opts;
        const schId = schema[schemaId];
        if (schId)
          baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
        return new SchemaEnv({ schema, schemaId, root, baseId });
      }
      return getJsonPointer.call(this, p, schOrRef);
    }
    exports.resolveSchema = resolveSchema;
    var PREVENT_SCOPE_CHANGE = /* @__PURE__ */ new Set([
      "properties",
      "patternProperties",
      "enum",
      "dependencies",
      "definitions"
    ]);
    function getJsonPointer(parsedRef, { baseId, schema, root }) {
      var _a;
      if (((_a = parsedRef.fragment) === null || _a === void 0 ? void 0 : _a[0]) !== "/")
        return;
      for (const part of parsedRef.fragment.slice(1).split("/")) {
        if (typeof schema === "boolean")
          return;
        const partSchema = schema[(0, util_1.unescapeFragment)(part)];
        if (partSchema === void 0)
          return;
        schema = partSchema;
        const schId = typeof schema === "object" && schema[this.opts.schemaId];
        if (!PREVENT_SCOPE_CHANGE.has(part) && schId) {
          baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
        }
      }
      let env;
      if (typeof schema != "boolean" && schema.$ref && !(0, util_1.schemaHasRulesButRef)(schema, this.RULES)) {
        const $ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schema.$ref);
        env = resolveSchema.call(this, root, $ref);
      }
      const { schemaId } = this.opts;
      env = env || new SchemaEnv({ schema, schemaId, root, baseId });
      if (env.schema !== env.root.schema)
        return env;
      return void 0;
    }
  }
});

// ../node_modules/ajv/dist/refs/data.json
var require_data = __commonJS({
  "../node_modules/ajv/dist/refs/data.json"(exports, module) {
    module.exports = {
      $id: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
      description: "Meta-schema for $data reference (JSON AnySchema extension proposal)",
      type: "object",
      required: ["$data"],
      properties: {
        $data: {
          type: "string",
          anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }]
        }
      },
      additionalProperties: false
    };
  }
});

// ../node_modules/fast-uri/lib/utils.js
var require_utils = __commonJS({
  "../node_modules/fast-uri/lib/utils.js"(exports, module) {
    "use strict";
    var isUUID = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu);
    var isIPv4 = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
    var isPort = RegExp.prototype.test.bind(/^\d*$/u);
    var isHexPair = RegExp.prototype.test.bind(/^[\da-f]{2}$/iu);
    var isUnreserved = RegExp.prototype.test.bind(/^[\da-z\-._~]$/iu);
    var isPathCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:@/]$/u);
    var isQueryFragmentCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:@/?]$/u);
    var isUserinfoCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:]$/u);
    var BYTE_HEX = new Array(256);
    {
      const HEX_DIGITS = "0123456789ABCDEF";
      for (let i = 0; i < 256; i++) {
        BYTE_HEX[i] = "%" + HEX_DIGITS[i >> 4] + HEX_DIGITS[i & 15];
      }
    }
    function percentEncodeNonAscii(cp) {
      if (cp < 2048) {
        return BYTE_HEX[192 | cp >> 6] + BYTE_HEX[128 | cp & 63];
      }
      if (cp < 65536) {
        return BYTE_HEX[224 | cp >> 12] + BYTE_HEX[128 | cp >> 6 & 63] + BYTE_HEX[128 | cp & 63];
      }
      return BYTE_HEX[240 | cp >> 18] + BYTE_HEX[128 | cp >> 12 & 63] + BYTE_HEX[128 | cp >> 6 & 63] + BYTE_HEX[128 | cp & 63];
    }
    function stringArrayToHexStripped(input) {
      let acc = "";
      let code = 0;
      let i = 0;
      for (i = 0; i < input.length; i++) {
        code = input[i].charCodeAt(0);
        if (code === 48) {
          continue;
        }
        if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
          return "";
        }
        acc += input[i];
        break;
      }
      for (i += 1; i < input.length; i++) {
        code = input[i].charCodeAt(0);
        if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
          return "";
        }
        acc += input[i];
      }
      return acc;
    }
    var isHextet = RegExp.prototype.test.bind(/^[\dA-Fa-f]{1,4}$/);
    var isIPvFuture = RegExp.prototype.test.bind(/^[vV][\dA-Fa-f]+\.[A-Za-z\d\-._~!$&'()*+,;=:]+$/);
    var isZoneCharacter = RegExp.prototype.test.bind(/^[A-Za-z\d\-._~]$/);
    var nonSimpleDomain = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
    function isZoneIdentifier(zone) {
      if (zone.length === 0) return false;
      for (let i = 0; i < zone.length; i++) {
        if (isZoneCharacter(zone[i])) continue;
        if (zone[i] === "%" && i + 2 < zone.length && isHexPair(zone.slice(i + 1, i + 3))) {
          i += 2;
          continue;
        }
        return false;
      }
      return true;
    }
    function compressIPv6ZeroRun(hextets) {
      let bestStart = -1;
      let bestLength = 0;
      let runStart = -1;
      let runLength = 0;
      for (let i = 0; i < hextets.length; i++) {
        if (hextets[i] === "0") {
          if (runStart === -1) runStart = i;
          runLength++;
          if (runLength > bestLength) {
            bestLength = runLength;
            bestStart = runStart;
          }
        } else {
          runStart = -1;
          runLength = 0;
        }
      }
      if (bestLength < 2) return hextets.join(":");
      const head = hextets.slice(0, bestStart).join(":");
      const tail = hextets.slice(bestStart + bestLength).join(":");
      return head + "::" + tail;
    }
    function normalizeIPv6Address(input) {
      const compression = input.indexOf("::");
      if (compression !== -1 && input.indexOf("::", compression + 1) !== -1) return void 0;
      const left = compression === -1 ? input.split(":") : input.slice(0, compression).split(":");
      const right = compression === -1 ? [] : input.slice(compression + 2).split(":");
      if (compression !== -1) {
        if (left.length === 1 && left[0] === "") left.length = 0;
        if (right.length === 1 && right[0] === "") right.length = 0;
      }
      const parts = left.concat(right);
      let hextetCount = 0;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part === "") return void 0;
        if (part.indexOf(".") !== -1) {
          if (i !== parts.length - 1 || compression !== -1 && right.length === 0 || !isIPv4(part)) return void 0;
          hextetCount += 2;
          continue;
        }
        if (!isHextet(part)) return void 0;
        parts[i] = parseInt(part, 16).toString(16);
        hextetCount++;
      }
      if (compression === -1) {
        if (hextetCount !== 8) return void 0;
        return compressIPv6ZeroRun(parts);
      }
      if (hextetCount >= 8) return void 0;
      const expanded = parts.slice(0, left.length);
      for (let i = hextetCount; i < 8; i++) expanded.push("0");
      for (let i = left.length; i < parts.length; i++) expanded.push(parts[i]);
      return compressIPv6ZeroRun(expanded);
    }
    function normalizeIPv6(host) {
      const bracketed = host[0] === "[" && host[host.length - 1] === "]";
      const hasBracket = host[0] === "[" || host[host.length - 1] === "]";
      if (hasBracket && !bracketed) return { host, isIPV6: false, error: true };
      let input = bracketed ? host.slice(1, -1) : host;
      if (bracketed && isIPvFuture(input)) {
        input = input.toLowerCase();
        return { host: `[${input}]`, escapedHost: input, isIPV6: false, isIPVFuture: true };
      }
      if (findToken(input, ":") < 2) {
        return { host, isIPV6: false, error: bracketed };
      }
      let zoneIdentifier = "";
      const zoneSeparator = input.indexOf("%");
      if (zoneSeparator !== -1) {
        const separatorLength = input.slice(zoneSeparator, zoneSeparator + 3).toLowerCase() === "%25" ? 3 : 1;
        zoneIdentifier = input.slice(zoneSeparator + separatorLength);
        if (!isZoneIdentifier(zoneIdentifier)) return { host, isIPV6: false, error: true };
        input = input.slice(0, zoneSeparator);
      }
      const address = normalizeIPv6Address(input);
      if (address === void 0) return { host, isIPV6: false, error: true };
      return {
        host: address + (zoneIdentifier ? "%" + zoneIdentifier : ""),
        escapedHost: address + (zoneIdentifier ? "%25" + zoneIdentifier : ""),
        isIPV6: true
      };
    }
    function findToken(str, token) {
      let ind = 0;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === token) ind++;
      }
      return ind;
    }
    function removeDotSegments(path) {
      let input = path;
      const output = [];
      let nextSlash = -1;
      let len = 0;
      while (len = input.length) {
        if (len === 1) {
          if (input === ".") {
            break;
          } else if (input === "/") {
            output.push("/");
            break;
          } else {
            output.push(input);
            break;
          }
        } else if (len === 2) {
          if (input[0] === ".") {
            if (input[1] === ".") {
              break;
            } else if (input[1] === "/") {
              input = input.slice(2);
              continue;
            }
          } else if (input[0] === "/") {
            if (input[1] === "." || input[1] === "/") {
              output.push("/");
              break;
            }
          }
        } else if (len === 3) {
          if (input === "/..") {
            if (output.length !== 0) {
              output.pop();
            }
            output.push("/");
            break;
          }
        }
        if (input[0] === ".") {
          if (input[1] === ".") {
            if (input[2] === "/") {
              input = input.slice(3);
              continue;
            }
          } else if (input[1] === "/") {
            input = input.slice(2);
            continue;
          }
        } else if (input[0] === "/") {
          if (input[1] === ".") {
            if (input[2] === "/") {
              input = input.slice(2);
              continue;
            } else if (input[2] === ".") {
              if (input[3] === "/") {
                input = input.slice(3);
                if (output.length !== 0) {
                  output.pop();
                }
                continue;
              }
            }
          }
        }
        if ((nextSlash = input.indexOf("/", 1)) === -1) {
          output.push(input);
          break;
        } else {
          output.push(input.slice(0, nextSlash));
          input = input.slice(nextSlash);
        }
      }
      return output.join("");
    }
    var HOST_DELIMS = { "@": "%40", "/": "%2F", "?": "%3F", "#": "%23", ":": "%3A" };
    var HOST_DELIM_RE = /[@/?#:]/g;
    var HOST_DELIM_NO_COLON_RE = /[@/?#]/g;
    function reescapeHostDelimiters(host, isIP) {
      const re = isIP ? HOST_DELIM_NO_COLON_RE : HOST_DELIM_RE;
      re.lastIndex = 0;
      return host.replace(re, (ch) => HOST_DELIMS[ch]);
    }
    function normalizePercentEncoding(input, decodeUnreserved = false) {
      if (input.indexOf("%") === -1) {
        return input;
      }
      let output = "";
      for (let i = 0; i < input.length; i++) {
        if (input[i] === "%" && i + 2 < input.length) {
          const hex = input.slice(i + 1, i + 3);
          if (isHexPair(hex)) {
            const normalizedHex = hex.toUpperCase();
            const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
            if (decodeUnreserved && isUnreserved(decoded)) {
              output += decoded;
            } else {
              output += "%" + normalizedHex;
            }
            i += 2;
            continue;
          }
        }
        output += input[i];
      }
      return output;
    }
    function normalizePathEncoding(input) {
      let output = "";
      for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (ch === "%" && i + 2 < input.length) {
          const hex = input.slice(i + 1, i + 3);
          if (isHexPair(hex)) {
            const normalizedHex = hex.toUpperCase();
            const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
            if (decoded !== "." && isUnreserved(decoded)) {
              output += decoded;
            } else {
              output += "%" + normalizedHex;
            }
            i += 2;
            continue;
          }
        }
        if (isPathCharacter(ch)) {
          output += ch;
        } else {
          const code = input.charCodeAt(i);
          if (code < 128) {
            output += isEscapeSafe(code) ? ch : BYTE_HEX[code];
          } else if (code < 55296 || code > 57343) {
            output += percentEncodeNonAscii(code);
          } else if (code <= 56319 && i + 1 < input.length) {
            const low = input.charCodeAt(i + 1);
            if (low >= 56320 && low <= 57343) {
              output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320));
              i++;
            } else {
              output += percentEncodeNonAscii(65533);
            }
          } else {
            output += percentEncodeNonAscii(65533);
          }
        }
      }
      return output;
    }
    function serializePathEncoding(input, pathNoScheme = false) {
      let output = "";
      let firstSegment = pathNoScheme && input[0] !== "/";
      for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (ch === "%" && i + 2 < input.length) {
          const hex = input.slice(i + 1, i + 3);
          if (isHexPair(hex)) {
            output += "%" + hex.toUpperCase();
            i += 2;
            continue;
          }
        }
        if (ch === "/") {
          firstSegment = false;
        }
        if (isPathCharacter(ch) && (ch !== ":" || !firstSegment)) {
          output += ch;
        } else {
          const code = input.charCodeAt(i);
          if (code < 128) {
            output += BYTE_HEX[code];
          } else if (code < 55296 || code > 57343) {
            output += percentEncodeNonAscii(code);
          } else if (code <= 56319 && i + 1 < input.length) {
            const low = input.charCodeAt(i + 1);
            if (low >= 56320 && low <= 57343) {
              output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320));
              i++;
            } else {
              output += percentEncodeNonAscii(65533);
            }
          } else {
            output += percentEncodeNonAscii(65533);
          }
        }
      }
      return output;
    }
    function encodeComponent(input, isAllowed) {
      let output = "";
      for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (ch === "%" && i + 2 < input.length) {
          const hex = input.slice(i + 1, i + 3);
          if (isHexPair(hex)) {
            output += "%" + hex.toUpperCase();
            i += 2;
            continue;
          }
        }
        if (isAllowed(ch)) {
          output += ch;
        } else {
          const code = input.charCodeAt(i);
          if (code < 128) {
            output += BYTE_HEX[code];
          } else if (code < 55296 || code > 57343) {
            output += percentEncodeNonAscii(code);
          } else if (code <= 56319 && i + 1 < input.length) {
            const low = input.charCodeAt(i + 1);
            if (low >= 56320 && low <= 57343) {
              output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320));
              i++;
            } else {
              output += percentEncodeNonAscii(65533);
            }
          } else {
            output += percentEncodeNonAscii(65533);
          }
        }
      }
      return output;
    }
    function encodeUserinfo(input) {
      return encodeComponent(input, isUserinfoCharacter);
    }
    function encodeQuery(input) {
      return encodeComponent(input, isQueryFragmentCharacter);
    }
    function encodeFragment(input) {
      return encodeComponent(input, isQueryFragmentCharacter);
    }
    function isEscapeSafe(cp) {
      return cp >= 48 && cp <= 57 || cp >= 65 && cp <= 90 || cp >= 97 && cp <= 122 || cp === 42 || cp === 43 || cp === 45 || cp === 46 || cp === 47 || cp === 64 || cp === 95;
    }
    function normalizeQueryFragmentEncoding(input) {
      let output = "";
      for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (ch === "%" && i + 2 < input.length) {
          const hex = input.slice(i + 1, i + 3);
          if (isHexPair(hex)) {
            const normalizedHex = hex.toUpperCase();
            const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
            if (isUnreserved(decoded)) {
              output += decoded;
            } else {
              output += "%" + normalizedHex;
            }
            i += 2;
            continue;
          }
        }
        if (isQueryFragmentCharacter(ch)) {
          output += ch;
        } else {
          const code = input.charCodeAt(i);
          if (code < 128) {
            output += isEscapeSafe(code) ? ch : BYTE_HEX[code];
          } else if (code < 55296 || code > 57343) {
            output += percentEncodeNonAscii(code);
          } else if (code <= 56319 && i + 1 < input.length) {
            const low = input.charCodeAt(i + 1);
            if (low >= 56320 && low <= 57343) {
              output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320));
              i++;
            } else {
              output += percentEncodeNonAscii(65533);
            }
          } else {
            output += percentEncodeNonAscii(65533);
          }
        }
      }
      return output;
    }
    function escapePreservingEscapes(input) {
      let output = "";
      for (let i = 0; i < input.length; i++) {
        if (input[i] === "%" && i + 2 < input.length) {
          const hex = input.slice(i + 1, i + 3);
          if (isHexPair(hex)) {
            output += "%" + hex.toUpperCase();
            i += 2;
            continue;
          }
        }
        output += escape(input[i]);
      }
      return output;
    }
    function recomposeAuthority(component) {
      const uriTokens = [];
      if (component.userinfo !== void 0) {
        uriTokens.push(encodeUserinfo(component.userinfo));
        uriTokens.push("@");
      }
      if (component.host !== void 0) {
        let host = component.host;
        if (!isIPv4(host)) {
          let ipV6res = normalizeIPv6(host);
          if (ipV6res.isIPV6 !== true && ipV6res.isIPVFuture !== true) {
            host = normalizePercentEncoding(host, true);
            ipV6res = normalizeIPv6(host);
          }
          if (ipV6res.isIPV6 === true || ipV6res.isIPVFuture === true) {
            host = `[${ipV6res.escapedHost}]`;
          } else {
            host = reescapeHostDelimiters(host, false);
          }
        }
        uriTokens.push(host);
      }
      if (typeof component.port === "number" || typeof component.port === "string") {
        const port = String(component.port);
        if (!isPort(port)) {
          throw new TypeError("URI port is malformed.");
        }
        uriTokens.push(":");
        uriTokens.push(port);
      }
      return uriTokens.length ? uriTokens.join("") : void 0;
    }
    module.exports = {
      nonSimpleDomain,
      recomposeAuthority,
      reescapeHostDelimiters,
      normalizePercentEncoding,
      normalizePathEncoding,
      serializePathEncoding,
      normalizeQueryFragmentEncoding,
      encodeUserinfo,
      encodeQuery,
      encodeFragment,
      escapePreservingEscapes,
      removeDotSegments,
      isIPv4,
      isUUID,
      normalizeIPv6,
      stringArrayToHexStripped
    };
  }
});

// ../node_modules/fast-uri/lib/schemes.js
var require_schemes = __commonJS({
  "../node_modules/fast-uri/lib/schemes.js"(exports, module) {
    "use strict";
    var { isUUID } = require_utils();
    var URN_REG = /^([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-./:;=@]|%[\da-f]{2})+)$/iu;
    var supportedSchemeNames = (
      /** @type {const} */
      [
        "http",
        "https",
        "ws",
        "wss",
        "urn",
        "urn:uuid"
      ]
    );
    function isValidSchemeName(name) {
      return supportedSchemeNames.indexOf(
        /** @type {*} */
        name
      ) !== -1;
    }
    function wsIsSecure(wsComponent) {
      if (wsComponent.secure === true) {
        return true;
      } else if (wsComponent.secure === false) {
        return false;
      } else if (wsComponent.scheme) {
        return wsComponent.scheme.length === 3 && (wsComponent.scheme[0] === "w" || wsComponent.scheme[0] === "W") && (wsComponent.scheme[1] === "s" || wsComponent.scheme[1] === "S") && (wsComponent.scheme[2] === "s" || wsComponent.scheme[2] === "S");
      } else {
        return false;
      }
    }
    function httpParse(component) {
      if (!component.host) {
        component.error = component.error || "HTTP URIs must have a host.";
      }
      return component;
    }
    function httpSerialize(component) {
      const secure = String(component.scheme).toLowerCase() === "https";
      if (component.port === (secure ? 443 : 80) || component.port === "") {
        component.port = void 0;
      }
      if (!component.path) {
        component.path = "/";
      }
      return component;
    }
    function wsParse(wsComponent) {
      wsComponent.secure = wsIsSecure(wsComponent);
      wsComponent.resourceName = (wsComponent.path || "/") + (wsComponent.query ? "?" + wsComponent.query : "");
      wsComponent.path = void 0;
      wsComponent.query = void 0;
      return wsComponent;
    }
    function wsSerialize(wsComponent) {
      if (wsComponent.port === (wsIsSecure(wsComponent) ? 443 : 80) || wsComponent.port === "") {
        wsComponent.port = void 0;
      }
      if (typeof wsComponent.secure === "boolean") {
        wsComponent.scheme = wsComponent.secure ? "wss" : "ws";
        wsComponent.secure = void 0;
      }
      if (wsComponent.resourceName) {
        const queryIndex = wsComponent.resourceName.indexOf("?");
        const path = queryIndex === -1 ? wsComponent.resourceName : wsComponent.resourceName.slice(0, queryIndex);
        wsComponent.path = path && path !== "/" ? path : void 0;
        wsComponent.query = queryIndex === -1 ? void 0 : wsComponent.resourceName.slice(queryIndex + 1);
        wsComponent.resourceName = void 0;
      }
      wsComponent.fragment = void 0;
      return wsComponent;
    }
    function urnParse(urnComponent, options) {
      if (!urnComponent.path) {
        urnComponent.error = "URN can not be parsed";
        return urnComponent;
      }
      const matches = urnComponent.path.match(URN_REG);
      if (matches && matches[0] === urnComponent.path) {
        const scheme = options.scheme || urnComponent.scheme || "urn";
        urnComponent.nid = matches[1].toLowerCase();
        urnComponent.nss = matches[2];
        const urnScheme = `${scheme}:${options.nid || urnComponent.nid}`;
        const schemeHandler = getSchemeHandler(urnScheme);
        urnComponent.path = void 0;
        if (schemeHandler) {
          urnComponent = schemeHandler.parse(urnComponent, options);
        }
      } else {
        urnComponent.error = urnComponent.error || "URN can not be parsed.";
      }
      return urnComponent;
    }
    function urnSerialize(urnComponent, options) {
      if (urnComponent.nid === void 0) {
        throw new Error("URN without nid cannot be serialized");
      }
      const scheme = options.scheme || urnComponent.scheme || "urn";
      const nid = urnComponent.nid.toLowerCase();
      const urnScheme = `${scheme}:${options.nid || nid}`;
      const schemeHandler = getSchemeHandler(urnScheme);
      if (schemeHandler) {
        urnComponent = schemeHandler.serialize(urnComponent, options);
      }
      const uriComponent = urnComponent;
      const nss = urnComponent.nss;
      uriComponent.path = `${nid || options.nid}:${nss}`;
      options.skipEscape = true;
      return uriComponent;
    }
    function urnuuidParse(urnComponent, options) {
      const uuidComponent = urnComponent;
      uuidComponent.uuid = uuidComponent.nss;
      uuidComponent.nss = void 0;
      if (!options.tolerant && (!uuidComponent.uuid || !isUUID(uuidComponent.uuid))) {
        uuidComponent.error = uuidComponent.error || "UUID is not valid.";
      }
      return uuidComponent;
    }
    function urnuuidSerialize(uuidComponent) {
      const urnComponent = uuidComponent;
      urnComponent.nss = (uuidComponent.uuid || "").toLowerCase();
      return urnComponent;
    }
    var http = (
      /** @type {SchemeHandler} */
      {
        scheme: "http",
        domainHost: true,
        parse: httpParse,
        serialize: httpSerialize
      }
    );
    var https = (
      /** @type {SchemeHandler} */
      {
        scheme: "https",
        domainHost: http.domainHost,
        parse: httpParse,
        serialize: httpSerialize
      }
    );
    var ws = (
      /** @type {SchemeHandler} */
      {
        scheme: "ws",
        domainHost: true,
        parse: wsParse,
        serialize: wsSerialize
      }
    );
    var wss = (
      /** @type {SchemeHandler} */
      {
        scheme: "wss",
        domainHost: ws.domainHost,
        parse: ws.parse,
        serialize: ws.serialize
      }
    );
    var urn = (
      /** @type {SchemeHandler} */
      {
        scheme: "urn",
        parse: urnParse,
        serialize: urnSerialize,
        skipNormalize: true
      }
    );
    var urnuuid = (
      /** @type {SchemeHandler} */
      {
        scheme: "urn:uuid",
        parse: urnuuidParse,
        serialize: urnuuidSerialize,
        skipNormalize: true
      }
    );
    var SCHEMES = (
      /** @type {Record<SchemeName, SchemeHandler>} */
      {
        http,
        https,
        ws,
        wss,
        urn,
        "urn:uuid": urnuuid
      }
    );
    Object.setPrototypeOf(SCHEMES, null);
    function getSchemeHandler(scheme) {
      return scheme && (SCHEMES[
        /** @type {SchemeName} */
        scheme
      ] || SCHEMES[
        /** @type {SchemeName} */
        scheme.toLowerCase()
      ]) || void 0;
    }
    module.exports = {
      wsIsSecure,
      SCHEMES,
      isValidSchemeName,
      getSchemeHandler
    };
  }
});

// ../node_modules/fast-uri/index.js
var require_fast_uri = __commonJS({
  "../node_modules/fast-uri/index.js"(exports, module) {
    "use strict";
    var { normalizeIPv6, removeDotSegments, recomposeAuthority, normalizePercentEncoding, normalizePathEncoding, serializePathEncoding, normalizeQueryFragmentEncoding, encodeQuery, encodeFragment, reescapeHostDelimiters, isIPv4, nonSimpleDomain } = require_utils();
    var { SCHEMES, getSchemeHandler } = require_schemes();
    var VALID_SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*$/u;
    var MALFORMED_SCHEME_ERROR = "URI scheme is malformed.";
    function decodeValidScheme(scheme) {
      const decodedScheme = unescape(String(scheme));
      if (!VALID_SCHEME.test(decodedScheme)) {
        throw new TypeError(MALFORMED_SCHEME_ERROR);
      }
      return decodedScheme;
    }
    function normalize(uri, options) {
      if (typeof uri === "string") {
        uri = /** @type {T} */
        normalizeString(uri, options);
      } else if (typeof uri === "object") {
        uri = /** @type {T} */
        parse(serialize(uri, options), options);
      }
      return uri;
    }
    function resolve(baseURI, relativeURI, options) {
      const schemelessOptions = options ? Object.assign({ scheme: "null" }, options) : { scheme: "null" };
      const {
        parsed: baseParsed,
        malformedAuthorityOrPort: baseMalformed,
        malformedPercentEncoding: baseMalformedPercentEncoding,
        malformedSchemeSpecific: baseMalformedSchemeSpecific,
        malformedHost: baseMalformedHost,
        malformedScheme: baseMalformedScheme
      } = parseWithStatus(baseURI, schemelessOptions);
      const {
        parsed: relativeParsed,
        malformedAuthorityOrPort: relativeMalformed,
        malformedPercentEncoding: relativeMalformedPercentEncoding,
        malformedSchemeSpecific: relativeMalformedSchemeSpecific,
        malformedHost: relativeMalformedHost,
        malformedScheme: relativeMalformedScheme
      } = parseWithStatus(relativeURI, schemelessOptions);
      if (baseMalformed || relativeMalformed || baseMalformedPercentEncoding || relativeMalformedPercentEncoding || baseMalformedSchemeSpecific || relativeMalformedSchemeSpecific || baseMalformedHost || relativeMalformedHost || baseMalformedScheme || relativeMalformedScheme) {
        throw new Error(baseParsed.error || relativeParsed.error || "URI is malformed.");
      }
      const resolved = resolveComponent(baseParsed, relativeParsed, schemelessOptions, true);
      const resolvedSchemeHandler = getSchemeHandler(options && options.scheme || resolved.scheme);
      const resolvedHost = resolved.host;
      const resolvedHostIsIP = resolvedHost !== void 0 && resolvedHost !== "" && (isIPv4(resolvedHost) || normalizeIPv6(resolvedHost).isIPV6);
      canonicalizeHost(resolved, options || {}, resolvedSchemeHandler, resolvedHostIsIP);
      const encodedASCIIHost = resolvedHost && resolvedHost.indexOf("%") !== -1 && !new RegExp("\\P{ASCII}", "u").test(resolvedHost);
      if (resolved.error && !encodedASCIIHost) {
        throw new Error(resolved.error);
      }
      schemelessOptions.skipEscape = true;
      return serialize(resolved, schemelessOptions);
    }
    function resolveComponent(base, relative, options, skipNormalization) {
      const target = {};
      if (!skipNormalization) {
        base = parse(serialize(base, options), options);
        relative = parse(serialize(relative, options), options);
      }
      options = options || {};
      if (!options.tolerant && relative.scheme) {
        target.scheme = relative.scheme;
        target.userinfo = relative.userinfo;
        target.host = relative.host;
        target.port = relative.port;
        target.path = removeDotSegments(relative.path || "");
        target.query = relative.query;
      } else {
        if (relative.userinfo !== void 0 || relative.host !== void 0 || relative.port !== void 0) {
          target.userinfo = relative.userinfo;
          target.host = relative.host;
          target.port = relative.port;
          target.path = removeDotSegments(relative.path || "");
          target.query = relative.query;
        } else {
          if (!relative.path) {
            target.path = base.path;
            if (relative.query !== void 0) {
              target.query = relative.query;
            } else {
              target.query = base.query;
            }
          } else {
            if (relative.path[0] === "/") {
              target.path = removeDotSegments(relative.path);
            } else {
              if ((base.userinfo !== void 0 || base.host !== void 0 || base.port !== void 0) && !base.path) {
                target.path = "/" + relative.path;
              } else if (!base.path) {
                target.path = relative.path;
              } else {
                target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
              }
              target.path = removeDotSegments(target.path);
            }
            target.query = relative.query;
          }
          target.userinfo = base.userinfo;
          target.host = base.host;
          target.port = base.port;
        }
        target.scheme = base.scheme;
      }
      target.fragment = relative.fragment;
      return target;
    }
    function equal(uriA, uriB, options) {
      const normalizedA = normalizeComparableURI(uriA, options);
      const normalizedB = normalizeComparableURI(uriB, options);
      return normalizedA !== void 0 && normalizedB !== void 0 && normalizedA === normalizedB;
    }
    function serialize(cmpts, opts) {
      const component = {
        host: cmpts.host,
        scheme: cmpts.scheme,
        userinfo: cmpts.userinfo,
        port: cmpts.port,
        path: cmpts.path,
        query: cmpts.query,
        nid: cmpts.nid,
        nss: cmpts.nss,
        uuid: cmpts.uuid,
        fragment: cmpts.fragment,
        reference: cmpts.reference,
        resourceName: cmpts.resourceName,
        secure: cmpts.secure,
        error: ""
      };
      const options = Object.assign({}, opts);
      const uriTokens = [];
      if (component.scheme) {
        component.scheme = decodeValidScheme(component.scheme);
      }
      const schemeHandler = getSchemeHandler(options.scheme || component.scheme);
      if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(component, options);
      const hasAuthority = component.userinfo !== void 0 || component.host !== void 0 || component.port !== void 0;
      const pathNoScheme = !options.skipEscape && component.scheme === void 0 && !hasAuthority;
      if (component.path !== void 0) {
        if (!options.skipEscape) {
          component.path = serializePathEncoding(component.path, pathNoScheme);
        } else {
          component.path = normalizePercentEncoding(component.path);
        }
      }
      if (options.reference !== "suffix" && component.scheme) {
        component.scheme = decodeValidScheme(component.scheme);
        uriTokens.push(component.scheme, ":");
      }
      const authority = recomposeAuthority(component);
      if (authority !== void 0) {
        if (options.reference !== "suffix") {
          uriTokens.push("//");
        }
        uriTokens.push(authority);
        if (component.path && component.path[0] !== "/") {
          uriTokens.push("/");
        }
      }
      if (component.path !== void 0) {
        let s = component.path;
        if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
          s = removeDotSegments(s);
        }
        if (pathNoScheme) {
          s = serializePathEncoding(s, true);
        }
        if (authority === void 0 && s[0] === "/" && s[1] === "/") {
          s = "/%2F" + s.slice(2);
        }
        uriTokens.push(s);
      }
      if (component.query !== void 0) {
        uriTokens.push("?", encodeQuery(component.query));
      }
      if (component.fragment !== void 0) {
        uriTokens.push("#", encodeFragment(component.fragment));
      }
      return uriTokens.join("");
    }
    var URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
    var AUTHORITY_PREFIX = /^(?:[^#/:?]+:)?\/\/([^/?#]*)/;
    var AUTHORITY_INTRODUCER_REGION = /^(?:[^#/:?]+:)?([/\\\t\n\r]*)/;
    function getParseError(parsed, matches) {
      if (matches[2] !== void 0 && parsed.path && parsed.path[0] !== "/") {
        return 'URI path must start with "/" when authority is present.';
      }
      if (typeof parsed.port === "number" && (parsed.port < 0 || parsed.port > 65535)) {
        return "URI port is malformed.";
      }
      return void 0;
    }
    function hasMalformedPercentEncoding(component) {
      if (component === void 0) return false;
      let percent = component.indexOf("%");
      while (percent !== -1) {
        if (percent + 2 >= component.length || !/^[\da-f]{2}$/iu.test(component.slice(percent + 1, percent + 3))) {
          return true;
        }
        percent = component.indexOf("%", percent + 3);
      }
      return false;
    }
    function isIPLiteral(host) {
      return host[0] === "[" && host[host.length - 1] === "]";
    }
    function hasMalformedComponentPercentEncoding(matches) {
      const host = matches[4];
      return hasMalformedPercentEncoding(matches[3]) || host !== void 0 && !isIPLiteral(host) && hasMalformedPercentEncoding(host) || hasMalformedPercentEncoding(matches[6]) || hasMalformedPercentEncoding(matches[7]) || hasMalformedPercentEncoding(matches[8]);
    }
    function canonicalizeHost(parsed, options, schemeHandler, isIP) {
      if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport) && parsed.host && !isIPLiteral(parsed.host) && (options.domainHost || schemeHandler && schemeHandler.domainHost) && isIP === false && nonSimpleDomain(parsed.host)) {
        try {
          parsed.host = new URL("http://" + parsed.host).hostname;
        } catch (e) {
          parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e;
          return true;
        }
      }
      return false;
    }
    function parseWithStatus(uri, opts) {
      const options = Object.assign({}, opts);
      const parsed = {
        scheme: void 0,
        userinfo: void 0,
        host: "",
        port: void 0,
        path: "",
        query: void 0,
        fragment: void 0
      };
      let malformedAuthorityOrPort = false;
      let malformedPercentEncoding = false;
      let malformedSchemeSpecific = false;
      let malformedHost = false;
      let malformedIPLiteral = false;
      let malformedScheme = false;
      let isIP = false;
      if (options.reference === "suffix") {
        if (options.scheme) {
          uri = options.scheme + ":" + uri;
        } else {
          uri = "//" + uri;
        }
      }
      const authorityMatch = uri.match(AUTHORITY_PREFIX);
      if (authorityMatch !== null && authorityMatch[1].indexOf("\\") !== -1) {
        parsed.error = "URI authority must not contain a literal backslash.";
        malformedAuthorityOrPort = true;
      }
      const introducerMatch = uri.match(AUTHORITY_INTRODUCER_REGION);
      if (introducerMatch !== null) {
        const region = introducerMatch[1];
        const normalizedRegion = region.replace(/[\t\n\r]/g, "");
        if (normalizedRegion.length >= 2) {
          if (normalizedRegion.slice(0, 2) !== "//") {
            parsed.error = parsed.error || "URI authority must not contain a literal backslash.";
            malformedAuthorityOrPort = true;
          } else if (region.length !== normalizedRegion.length) {
            parsed.error = parsed.error || "URI authority introducer must not contain whitespace.";
            malformedAuthorityOrPort = true;
          }
        }
      }
      const matches = uri.match(URI_PARSE);
      if (matches) {
        parsed.scheme = matches[1];
        parsed.userinfo = matches[3];
        parsed.host = matches[4];
        parsed.port = parseInt(matches[5], 10);
        parsed.path = matches[6] || "";
        parsed.query = matches[7];
        parsed.fragment = matches[8];
        if (parsed.scheme !== void 0) {
          const decodedScheme = unescape(parsed.scheme);
          if (VALID_SCHEME.test(decodedScheme)) {
            parsed.scheme = decodedScheme.toLowerCase();
          } else {
            parsed.error = parsed.error || MALFORMED_SCHEME_ERROR;
            malformedScheme = true;
          }
        }
        malformedPercentEncoding = hasMalformedComponentPercentEncoding(matches);
        if (malformedPercentEncoding) {
          parsed.error = parsed.error || "URI contains malformed percent-encoding.";
        }
        if (isNaN(parsed.port)) {
          parsed.port = matches[5];
        }
        const parseError = getParseError(parsed, matches);
        if (parseError !== void 0) {
          parsed.error = parsed.error || parseError;
          malformedAuthorityOrPort = true;
        }
        if (parsed.host) {
          const ipv4result = isIPv4(parsed.host);
          if (ipv4result === false) {
            const bracketedIPLiteral = isIPLiteral(parsed.host);
            const hasIPLiteralBracket = parsed.host.indexOf("[") !== -1 || parsed.host.indexOf("]") !== -1;
            const ipv6result = normalizeIPv6(parsed.host);
            isIP = ipv6result.isIPV6 || ipv6result.isIPVFuture === true;
            malformedIPLiteral = hasIPLiteralBracket && (!bracketedIPLiteral || ipv6result.error === true);
            parsed.host = isIP ? ipv6result.host : ipv6result.host.toLowerCase();
            if (malformedIPLiteral) {
              parsed.error = parsed.error || "URI host is malformed.";
              malformedAuthorityOrPort = true;
            }
          } else {
            isIP = true;
          }
        }
        if (parsed.scheme === void 0 && parsed.userinfo === void 0 && parsed.host === void 0 && parsed.port === void 0 && parsed.query === void 0 && !parsed.path) {
          parsed.reference = "same-document";
        } else if (parsed.scheme === void 0) {
          parsed.reference = "relative";
        } else if (parsed.fragment === void 0) {
          parsed.reference = "absolute";
        } else {
          parsed.reference = "uri";
        }
        if (options.reference && options.reference !== "suffix" && options.reference !== parsed.reference) {
          parsed.error = parsed.error || "URI is not a " + options.reference + " reference.";
        }
        const schemeHandler = getSchemeHandler(options.scheme || parsed.scheme);
        if (!malformedIPLiteral) {
          malformedHost = canonicalizeHost(parsed, options, schemeHandler, isIP);
        }
        if (uri.indexOf("%") !== -1 && parsed.host !== void 0 && !malformedIPLiteral) {
          let host = isIP ? parsed.host : normalizePercentEncoding(parsed.host, true);
          if (!isIP) {
            host = normalizePercentEncoding(host.toLowerCase());
          }
          parsed.host = reescapeHostDelimiters(host, isIP);
        }
        if (!schemeHandler || schemeHandler && !schemeHandler.skipNormalize) {
          if (parsed.path) {
            parsed.path = normalizePathEncoding(parsed.path);
          }
          if (parsed.query) {
            parsed.query = normalizeQueryFragmentEncoding(parsed.query);
          }
          if (parsed.fragment) {
            parsed.fragment = normalizeQueryFragmentEncoding(parsed.fragment);
          }
        }
        if (schemeHandler && schemeHandler.parse) {
          schemeHandler.parse(parsed, options);
          if (schemeHandler === SCHEMES.urn && parsed.nid === void 0) {
            malformedSchemeSpecific = true;
          }
        }
      } else {
        parsed.error = parsed.error || "URI can not be parsed.";
      }
      return { parsed, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme };
    }
    function parse(uri, opts) {
      return parseWithStatus(uri, opts).parsed;
    }
    function normalizeString(uri, opts) {
      return normalizeStringWithStatus(uri, opts).normalized;
    }
    function normalizeStringWithStatus(uri, opts) {
      const { parsed, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme } = parseWithStatus(uri, opts);
      return {
        normalized: malformedAuthorityOrPort || malformedPercentEncoding || malformedSchemeSpecific || malformedHost || malformedScheme ? uri : serialize(parsed, opts),
        malformedAuthorityOrPort,
        malformedPercentEncoding,
        malformedSchemeSpecific,
        malformedHost,
        malformedScheme
      };
    }
    function normalizeComparableURI(uri, opts) {
      if (typeof uri !== "string" && typeof uri !== "object") {
        return void 0;
      }
      let value;
      try {
        value = typeof uri === "string" ? uri : serialize(uri, opts);
      } catch {
        return void 0;
      }
      const { normalized, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme } = normalizeStringWithStatus(value, opts);
      return malformedAuthorityOrPort || malformedPercentEncoding || malformedSchemeSpecific || malformedHost || malformedScheme ? void 0 : normalized;
    }
    var fastUri = {
      SCHEMES,
      normalize,
      resolve,
      resolveComponent,
      equal,
      serialize,
      parse
    };
    module.exports = fastUri;
    module.exports.default = fastUri;
    module.exports.fastUri = fastUri;
  }
});

// ../node_modules/ajv/dist/runtime/uri.js
var require_uri = __commonJS({
  "../node_modules/ajv/dist/runtime/uri.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var uri = require_fast_uri();
    uri.code = 'require("ajv/dist/runtime/uri").default';
    exports.default = uri;
  }
});

// ../node_modules/ajv/dist/core.js
var require_core = __commonJS({
  "../node_modules/ajv/dist/core.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = void 0;
    var validate_1 = require_validate();
    Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
      return validate_1.KeywordCxt;
    } });
    var codegen_1 = require_codegen();
    Object.defineProperty(exports, "_", { enumerable: true, get: function() {
      return codegen_1._;
    } });
    Object.defineProperty(exports, "str", { enumerable: true, get: function() {
      return codegen_1.str;
    } });
    Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
      return codegen_1.stringify;
    } });
    Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
      return codegen_1.nil;
    } });
    Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
      return codegen_1.Name;
    } });
    Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
      return codegen_1.CodeGen;
    } });
    var validation_error_1 = require_validation_error();
    var ref_error_1 = require_ref_error();
    var rules_1 = require_rules();
    var compile_1 = require_compile();
    var codegen_2 = require_codegen();
    var resolve_1 = require_resolve();
    var dataType_1 = require_dataType();
    var util_1 = require_util();
    var $dataRefSchema = require_data();
    var uri_1 = require_uri();
    var defaultRegExp = (str, flags) => new RegExp(str, flags);
    defaultRegExp.code = "new RegExp";
    var META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes"];
    var EXT_SCOPE_NAMES = /* @__PURE__ */ new Set([
      "validate",
      "serialize",
      "parse",
      "wrapper",
      "root",
      "schema",
      "keyword",
      "pattern",
      "formats",
      "validate$data",
      "func",
      "obj",
      "Error"
    ]);
    var removedOptions = {
      errorDataPath: "",
      format: "`validateFormats: false` can be used instead.",
      nullable: '"nullable" keyword is supported by default.',
      jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
      extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
      missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
      processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
      sourceCode: "Use option `code: {source: true}`",
      strictDefaults: "It is default now, see option `strict`.",
      strictKeywords: "It is default now, see option `strict`.",
      uniqueItems: '"uniqueItems" keyword is always validated.',
      unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
      cache: "Map is used as cache, schema object as key.",
      serialize: "Map is used as cache, schema object as key.",
      ajvErrors: "It is default now."
    };
    var deprecatedOptions = {
      ignoreKeywordsWithRef: "",
      jsPropertySyntax: "",
      unicode: '"minLength"/"maxLength" account for unicode characters by default.'
    };
    var MAX_EXPRESSION = 200;
    function requiredOptions(o) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
      const s = o.strict;
      const _optz = (_a = o.code) === null || _a === void 0 ? void 0 : _a.optimize;
      const optimize = _optz === true || _optz === void 0 ? 1 : _optz || 0;
      const regExp = (_c = (_b = o.code) === null || _b === void 0 ? void 0 : _b.regExp) !== null && _c !== void 0 ? _c : defaultRegExp;
      const uriResolver = (_d = o.uriResolver) !== null && _d !== void 0 ? _d : uri_1.default;
      return {
        strictSchema: (_f = (_e = o.strictSchema) !== null && _e !== void 0 ? _e : s) !== null && _f !== void 0 ? _f : true,
        strictNumbers: (_h = (_g = o.strictNumbers) !== null && _g !== void 0 ? _g : s) !== null && _h !== void 0 ? _h : true,
        strictTypes: (_k = (_j = o.strictTypes) !== null && _j !== void 0 ? _j : s) !== null && _k !== void 0 ? _k : "log",
        strictTuples: (_m = (_l = o.strictTuples) !== null && _l !== void 0 ? _l : s) !== null && _m !== void 0 ? _m : "log",
        strictRequired: (_p = (_o = o.strictRequired) !== null && _o !== void 0 ? _o : s) !== null && _p !== void 0 ? _p : false,
        code: o.code ? { ...o.code, optimize, regExp } : { optimize, regExp },
        loopRequired: (_q = o.loopRequired) !== null && _q !== void 0 ? _q : MAX_EXPRESSION,
        loopEnum: (_r = o.loopEnum) !== null && _r !== void 0 ? _r : MAX_EXPRESSION,
        meta: (_s = o.meta) !== null && _s !== void 0 ? _s : true,
        messages: (_t = o.messages) !== null && _t !== void 0 ? _t : true,
        inlineRefs: (_u = o.inlineRefs) !== null && _u !== void 0 ? _u : true,
        schemaId: (_v = o.schemaId) !== null && _v !== void 0 ? _v : "$id",
        addUsedSchema: (_w = o.addUsedSchema) !== null && _w !== void 0 ? _w : true,
        validateSchema: (_x = o.validateSchema) !== null && _x !== void 0 ? _x : true,
        validateFormats: (_y = o.validateFormats) !== null && _y !== void 0 ? _y : true,
        unicodeRegExp: (_z = o.unicodeRegExp) !== null && _z !== void 0 ? _z : true,
        int32range: (_0 = o.int32range) !== null && _0 !== void 0 ? _0 : true,
        uriResolver
      };
    }
    var Ajv = class {
      constructor(opts = {}) {
        this.schemas = {};
        this.refs = {};
        this.formats = /* @__PURE__ */ Object.create(null);
        this._compilations = /* @__PURE__ */ new Set();
        this._loading = {};
        this._cache = /* @__PURE__ */ new Map();
        opts = this.opts = { ...opts, ...requiredOptions(opts) };
        const { es5, lines } = this.opts.code;
        this.scope = new codegen_2.ValueScope({ scope: {}, prefixes: EXT_SCOPE_NAMES, es5, lines });
        this.logger = getLogger(opts.logger);
        const formatOpt = opts.validateFormats;
        opts.validateFormats = false;
        this.RULES = (0, rules_1.getRules)();
        checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED");
        checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn");
        this._metaOpts = getMetaSchemaOptions.call(this);
        if (opts.formats)
          addInitialFormats.call(this);
        this._addVocabularies();
        this._addDefaultMetaSchema();
        if (opts.keywords)
          addInitialKeywords.call(this, opts.keywords);
        if (typeof opts.meta == "object")
          this.addMetaSchema(opts.meta);
        addInitialSchemas.call(this);
        opts.validateFormats = formatOpt;
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        const { $data, meta, schemaId } = this.opts;
        let _dataRefSchema = $dataRefSchema;
        if (schemaId === "id") {
          _dataRefSchema = { ...$dataRefSchema };
          _dataRefSchema.id = _dataRefSchema.$id;
          delete _dataRefSchema.$id;
        }
        if (meta && $data)
          this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], false);
      }
      defaultMeta() {
        const { meta, schemaId } = this.opts;
        return this.opts.defaultMeta = typeof meta == "object" ? meta[schemaId] || meta : void 0;
      }
      validate(schemaKeyRef, data) {
        let v;
        if (typeof schemaKeyRef == "string") {
          v = this.getSchema(schemaKeyRef);
          if (!v)
            throw new Error(`no schema with key or ref "${schemaKeyRef}"`);
        } else {
          v = this.compile(schemaKeyRef);
        }
        const valid = v(data);
        if (!("$async" in v))
          this.errors = v.errors;
        return valid;
      }
      compile(schema, _meta) {
        const sch = this._addSchema(schema, _meta);
        return sch.validate || this._compileSchemaEnv(sch);
      }
      compileAsync(schema, meta) {
        if (typeof this.opts.loadSchema != "function") {
          throw new Error("options.loadSchema should be a function");
        }
        const { loadSchema } = this.opts;
        return runCompileAsync.call(this, schema, meta);
        async function runCompileAsync(_schema, _meta) {
          await loadMetaSchema.call(this, _schema.$schema);
          const sch = this._addSchema(_schema, _meta);
          return sch.validate || _compileAsync.call(this, sch);
        }
        async function loadMetaSchema($ref) {
          if ($ref && !this.getSchema($ref)) {
            await runCompileAsync.call(this, { $ref }, true);
          }
        }
        async function _compileAsync(sch) {
          try {
            return this._compileSchemaEnv(sch);
          } catch (e) {
            if (!(e instanceof ref_error_1.default))
              throw e;
            checkLoaded.call(this, e);
            await loadMissingSchema.call(this, e.missingSchema);
            return _compileAsync.call(this, sch);
          }
        }
        function checkLoaded({ missingSchema: ref, missingRef }) {
          if (this.refs[ref]) {
            throw new Error(`AnySchema ${ref} is loaded but ${missingRef} cannot be resolved`);
          }
        }
        async function loadMissingSchema(ref) {
          const _schema = await _loadSchema.call(this, ref);
          if (!this.refs[ref])
            await loadMetaSchema.call(this, _schema.$schema);
          if (!this.refs[ref])
            this.addSchema(_schema, ref, meta);
        }
        async function _loadSchema(ref) {
          const p = this._loading[ref];
          if (p)
            return p;
          try {
            return await (this._loading[ref] = loadSchema(ref));
          } finally {
            delete this._loading[ref];
          }
        }
      }
      // Adds schema to the instance
      addSchema(schema, key, _meta, _validateSchema = this.opts.validateSchema) {
        if (Array.isArray(schema)) {
          for (const sch of schema)
            this.addSchema(sch, void 0, _meta, _validateSchema);
          return this;
        }
        let id;
        if (typeof schema === "object") {
          const { schemaId } = this.opts;
          id = schema[schemaId];
          if (id !== void 0 && typeof id != "string") {
            throw new Error(`schema ${schemaId} must be string`);
          }
        }
        key = (0, resolve_1.normalizeId)(key || id);
        this._checkUnique(key);
        this.schemas[key] = this._addSchema(schema, _meta, key, _validateSchema, true);
        return this;
      }
      // Add schema that will be used to validate other schemas
      // options in META_IGNORE_OPTIONS are alway set to false
      addMetaSchema(schema, key, _validateSchema = this.opts.validateSchema) {
        this.addSchema(schema, key, true, _validateSchema);
        return this;
      }
      //  Validate schema against its meta-schema
      validateSchema(schema, throwOrLogError) {
        if (typeof schema == "boolean")
          return true;
        let $schema;
        $schema = schema.$schema;
        if ($schema !== void 0 && typeof $schema != "string") {
          throw new Error("$schema must be a string");
        }
        $schema = $schema || this.opts.defaultMeta || this.defaultMeta();
        if (!$schema) {
          this.logger.warn("meta-schema not available");
          this.errors = null;
          return true;
        }
        const valid = this.validate($schema, schema);
        if (!valid && throwOrLogError) {
          const message = "schema is invalid: " + this.errorsText();
          if (this.opts.validateSchema === "log")
            this.logger.error(message);
          else
            throw new Error(message);
        }
        return valid;
      }
      // Get compiled schema by `key` or `ref`.
      // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
      getSchema(keyRef) {
        let sch;
        while (typeof (sch = getSchEnv.call(this, keyRef)) == "string")
          keyRef = sch;
        if (sch === void 0) {
          const { schemaId } = this.opts;
          const root = new compile_1.SchemaEnv({ schema: {}, schemaId });
          sch = compile_1.resolveSchema.call(this, root, keyRef);
          if (!sch)
            return;
          this.refs[keyRef] = sch;
        }
        return sch.validate || this._compileSchemaEnv(sch);
      }
      // Remove cached schema(s).
      // If no parameter is passed all schemas but meta-schemas are removed.
      // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
      // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
      removeSchema(schemaKeyRef) {
        if (schemaKeyRef instanceof RegExp) {
          this._removeAllSchemas(this.schemas, schemaKeyRef);
          this._removeAllSchemas(this.refs, schemaKeyRef);
          return this;
        }
        switch (typeof schemaKeyRef) {
          case "undefined":
            this._removeAllSchemas(this.schemas);
            this._removeAllSchemas(this.refs);
            this._cache.clear();
            return this;
          case "string": {
            const sch = getSchEnv.call(this, schemaKeyRef);
            if (typeof sch == "object")
              this._cache.delete(sch.schema);
            delete this.schemas[schemaKeyRef];
            delete this.refs[schemaKeyRef];
            return this;
          }
          case "object": {
            const cacheKey = schemaKeyRef;
            this._cache.delete(cacheKey);
            let id = schemaKeyRef[this.opts.schemaId];
            if (id) {
              id = (0, resolve_1.normalizeId)(id);
              delete this.schemas[id];
              delete this.refs[id];
            }
            return this;
          }
          default:
            throw new Error("ajv.removeSchema: invalid parameter");
        }
      }
      // add "vocabulary" - a collection of keywords
      addVocabulary(definitions) {
        for (const def of definitions)
          this.addKeyword(def);
        return this;
      }
      addKeyword(kwdOrDef, def) {
        let keyword;
        if (typeof kwdOrDef == "string") {
          keyword = kwdOrDef;
          if (typeof def == "object") {
            this.logger.warn("these parameters are deprecated, see docs for addKeyword");
            def.keyword = keyword;
          }
        } else if (typeof kwdOrDef == "object" && def === void 0) {
          def = kwdOrDef;
          keyword = def.keyword;
          if (Array.isArray(keyword) && !keyword.length) {
            throw new Error("addKeywords: keyword must be string or non-empty array");
          }
        } else {
          throw new Error("invalid addKeywords parameters");
        }
        checkKeyword.call(this, keyword, def);
        if (!def) {
          (0, util_1.eachItem)(keyword, (kwd) => addRule.call(this, kwd));
          return this;
        }
        keywordMetaschema.call(this, def);
        const definition = {
          ...def,
          type: (0, dataType_1.getJSONTypes)(def.type),
          schemaType: (0, dataType_1.getJSONTypes)(def.schemaType)
        };
        (0, util_1.eachItem)(keyword, definition.type.length === 0 ? (k) => addRule.call(this, k, definition) : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t)));
        return this;
      }
      getKeyword(keyword) {
        const rule = this.RULES.all[keyword];
        return typeof rule == "object" ? rule.definition : !!rule;
      }
      // Remove keyword
      removeKeyword(keyword) {
        const { RULES } = this;
        delete RULES.keywords[keyword];
        delete RULES.all[keyword];
        for (const group of RULES.rules) {
          const i = group.rules.findIndex((rule) => rule.keyword === keyword);
          if (i >= 0)
            group.rules.splice(i, 1);
        }
        return this;
      }
      // Add format
      addFormat(name, format) {
        if (typeof format == "string")
          format = new RegExp(format);
        this.formats[name] = format;
        return this;
      }
      errorsText(errors = this.errors, { separator = ", ", dataVar = "data" } = {}) {
        if (!errors || errors.length === 0)
          return "No errors";
        return errors.map((e) => `${dataVar}${e.instancePath} ${e.message}`).reduce((text, msg) => text + separator + msg);
      }
      $dataMetaSchema(metaSchema, keywordsJsonPointers) {
        const rules = this.RULES.all;
        metaSchema = JSON.parse(JSON.stringify(metaSchema));
        for (const jsonPointer of keywordsJsonPointers) {
          const segments = jsonPointer.split("/").slice(1);
          let keywords = metaSchema;
          for (const seg of segments)
            keywords = keywords[seg];
          for (const key in rules) {
            const rule = rules[key];
            if (typeof rule != "object")
              continue;
            const { $data } = rule.definition;
            const schema = keywords[key];
            if ($data && schema)
              keywords[key] = schemaOrData(schema);
          }
        }
        return metaSchema;
      }
      _removeAllSchemas(schemas, regex) {
        for (const keyRef in schemas) {
          const sch = schemas[keyRef];
          if (!regex || regex.test(keyRef)) {
            if (typeof sch == "string") {
              delete schemas[keyRef];
            } else if (sch && !sch.meta) {
              this._cache.delete(sch.schema);
              delete schemas[keyRef];
            }
          }
        }
      }
      _addSchema(schema, meta, baseId, validateSchema = this.opts.validateSchema, addSchema = this.opts.addUsedSchema) {
        let id;
        const { schemaId } = this.opts;
        if (typeof schema == "object") {
          id = schema[schemaId];
        } else {
          if (this.opts.jtd)
            throw new Error("schema must be object");
          else if (typeof schema != "boolean")
            throw new Error("schema must be object or boolean");
        }
        let sch = this._cache.get(schema);
        if (sch !== void 0)
          return sch;
        baseId = (0, resolve_1.normalizeId)(id || baseId);
        const localRefs = resolve_1.getSchemaRefs.call(this, schema, baseId);
        sch = new compile_1.SchemaEnv({ schema, schemaId, meta, baseId, localRefs });
        this._cache.set(sch.schema, sch);
        if (addSchema && !baseId.startsWith("#")) {
          if (baseId)
            this._checkUnique(baseId);
          this.refs[baseId] = sch;
        }
        if (validateSchema)
          this.validateSchema(schema, true);
        return sch;
      }
      _checkUnique(id) {
        if (this.schemas[id] || this.refs[id]) {
          throw new Error(`schema with key or id "${id}" already exists`);
        }
      }
      _compileSchemaEnv(sch) {
        if (sch.meta)
          this._compileMetaSchema(sch);
        else
          compile_1.compileSchema.call(this, sch);
        if (!sch.validate)
          throw new Error("ajv implementation error");
        return sch.validate;
      }
      _compileMetaSchema(sch) {
        const currentOpts = this.opts;
        this.opts = this._metaOpts;
        try {
          compile_1.compileSchema.call(this, sch);
        } finally {
          this.opts = currentOpts;
        }
      }
    };
    Ajv.ValidationError = validation_error_1.default;
    Ajv.MissingRefError = ref_error_1.default;
    exports.default = Ajv;
    function checkOptions(checkOpts, options, msg, log = "error") {
      for (const key in checkOpts) {
        const opt = key;
        if (opt in options)
          this.logger[log](`${msg}: option ${key}. ${checkOpts[opt]}`);
      }
    }
    function getSchEnv(keyRef) {
      keyRef = (0, resolve_1.normalizeId)(keyRef);
      return this.schemas[keyRef] || this.refs[keyRef];
    }
    function addInitialSchemas() {
      const optsSchemas = this.opts.schemas;
      if (!optsSchemas)
        return;
      if (Array.isArray(optsSchemas))
        this.addSchema(optsSchemas);
      else
        for (const key in optsSchemas)
          this.addSchema(optsSchemas[key], key);
    }
    function addInitialFormats() {
      for (const name in this.opts.formats) {
        const format = this.opts.formats[name];
        if (format)
          this.addFormat(name, format);
      }
    }
    function addInitialKeywords(defs) {
      if (Array.isArray(defs)) {
        this.addVocabulary(defs);
        return;
      }
      this.logger.warn("keywords option as map is deprecated, pass array");
      for (const keyword in defs) {
        const def = defs[keyword];
        if (!def.keyword)
          def.keyword = keyword;
        this.addKeyword(def);
      }
    }
    function getMetaSchemaOptions() {
      const metaOpts = { ...this.opts };
      for (const opt of META_IGNORE_OPTIONS)
        delete metaOpts[opt];
      return metaOpts;
    }
    var noLogs = { log() {
    }, warn() {
    }, error() {
    } };
    function getLogger(logger) {
      if (logger === false)
        return noLogs;
      if (logger === void 0)
        return console;
      if (logger.log && logger.warn && logger.error)
        return logger;
      throw new Error("logger must implement log, warn and error methods");
    }
    var KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i;
    function checkKeyword(keyword, def) {
      const { RULES } = this;
      (0, util_1.eachItem)(keyword, (kwd) => {
        if (RULES.keywords[kwd])
          throw new Error(`Keyword ${kwd} is already defined`);
        if (!KEYWORD_NAME.test(kwd))
          throw new Error(`Keyword ${kwd} has invalid name`);
      });
      if (!def)
        return;
      if (def.$data && !("code" in def || "validate" in def)) {
        throw new Error('$data keyword must have "code" or "validate" function');
      }
    }
    function addRule(keyword, definition, dataType) {
      var _a;
      const post = definition === null || definition === void 0 ? void 0 : definition.post;
      if (dataType && post)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES } = this;
      let ruleGroup = post ? RULES.post : RULES.rules.find(({ type: t }) => t === dataType);
      if (!ruleGroup) {
        ruleGroup = { type: dataType, rules: [] };
        RULES.rules.push(ruleGroup);
      }
      RULES.keywords[keyword] = true;
      if (!definition)
        return;
      const rule = {
        keyword,
        definition: {
          ...definition,
          type: (0, dataType_1.getJSONTypes)(definition.type),
          schemaType: (0, dataType_1.getJSONTypes)(definition.schemaType)
        }
      };
      if (definition.before)
        addBeforeRule.call(this, ruleGroup, rule, definition.before);
      else
        ruleGroup.rules.push(rule);
      RULES.all[keyword] = rule;
      (_a = definition.implements) === null || _a === void 0 ? void 0 : _a.forEach((kwd) => this.addKeyword(kwd));
    }
    function addBeforeRule(ruleGroup, rule, before) {
      const i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before);
      if (i >= 0) {
        ruleGroup.rules.splice(i, 0, rule);
      } else {
        ruleGroup.rules.push(rule);
        this.logger.warn(`rule ${before} is not defined`);
      }
    }
    function keywordMetaschema(def) {
      let { metaSchema } = def;
      if (metaSchema === void 0)
        return;
      if (def.$data && this.opts.$data)
        metaSchema = schemaOrData(metaSchema);
      def.validateSchema = this.compile(metaSchema, true);
    }
    var $dataRef = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function schemaOrData(schema) {
      return { anyOf: [schema, $dataRef] };
    }
  }
});

// ../node_modules/ajv/dist/vocabularies/core/id.js
var require_id = __commonJS({
  "../node_modules/ajv/dist/vocabularies/core/id.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var def = {
      keyword: "id",
      code() {
        throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/core/ref.js
var require_ref = __commonJS({
  "../node_modules/ajv/dist/vocabularies/core/ref.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.callRef = exports.getValidate = void 0;
    var ref_error_1 = require_ref_error();
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var compile_1 = require_compile();
    var util_1 = require_util();
    var def = {
      keyword: "$ref",
      schemaType: "string",
      code(cxt) {
        const { gen, schema: $ref, it } = cxt;
        const { baseId, schemaEnv: env, validateName, opts, self } = it;
        const { root } = env;
        if (($ref === "#" || $ref === "#/") && baseId === root.baseId)
          return callRootRef();
        const schOrEnv = compile_1.resolveRef.call(self, root, baseId, $ref);
        if (schOrEnv === void 0)
          throw new ref_error_1.default(it.opts.uriResolver, baseId, $ref);
        if (schOrEnv instanceof compile_1.SchemaEnv)
          return callValidate(schOrEnv);
        return inlineRefSchema(schOrEnv);
        function callRootRef() {
          if (env === root)
            return callRef(cxt, validateName, env, env.$async);
          const rootName = gen.scopeValue("root", { ref: root });
          return callRef(cxt, (0, codegen_1._)`${rootName}.validate`, root, root.$async);
        }
        function callValidate(sch) {
          const v = getValidate(cxt, sch);
          callRef(cxt, v, sch, sch.$async);
        }
        function inlineRefSchema(sch) {
          const schName = gen.scopeValue("schema", opts.code.source === true ? { ref: sch, code: (0, codegen_1.stringify)(sch) } : { ref: sch });
          const valid = gen.name("valid");
          const schCxt = cxt.subschema({
            schema: sch,
            dataTypes: [],
            schemaPath: codegen_1.nil,
            topSchemaRef: schName,
            errSchemaPath: $ref
          }, valid);
          cxt.mergeEvaluated(schCxt);
          cxt.ok(valid);
        }
      }
    };
    function getValidate(cxt, sch) {
      const { gen } = cxt;
      return sch.validate ? gen.scopeValue("validate", { ref: sch.validate }) : (0, codegen_1._)`${gen.scopeValue("wrapper", { ref: sch })}.validate`;
    }
    exports.getValidate = getValidate;
    function callRef(cxt, v, sch, $async) {
      const { gen, it } = cxt;
      const { allErrors, schemaEnv: env, opts } = it;
      const passCxt = opts.passContext ? names_1.default.this : codegen_1.nil;
      if ($async)
        callAsyncRef();
      else
        callSyncRef();
      function callAsyncRef() {
        if (!env.$async)
          throw new Error("async schema referenced by sync schema");
        const valid = gen.let("valid");
        gen.try(() => {
          gen.code((0, codegen_1._)`await ${(0, code_1.callValidateCode)(cxt, v, passCxt)}`);
          addEvaluatedFrom(v);
          if (!allErrors)
            gen.assign(valid, true);
        }, (e) => {
          gen.if((0, codegen_1._)`!(${e} instanceof ${it.ValidationError})`, () => gen.throw(e));
          addErrorsFrom(e);
          if (!allErrors)
            gen.assign(valid, false);
        });
        cxt.ok(valid);
      }
      function callSyncRef() {
        cxt.result((0, code_1.callValidateCode)(cxt, v, passCxt), () => addEvaluatedFrom(v), () => addErrorsFrom(v));
      }
      function addErrorsFrom(source) {
        const errs = (0, codegen_1._)`${source}.errors`;
        gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`);
        gen.assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
      }
      function addEvaluatedFrom(source) {
        var _a;
        if (!it.opts.unevaluated)
          return;
        const schEvaluated = (_a = sch === null || sch === void 0 ? void 0 : sch.validate) === null || _a === void 0 ? void 0 : _a.evaluated;
        if (it.props !== true) {
          if (schEvaluated && !schEvaluated.dynamicProps) {
            if (schEvaluated.props !== void 0) {
              it.props = util_1.mergeEvaluated.props(gen, schEvaluated.props, it.props);
            }
          } else {
            const props = gen.var("props", (0, codegen_1._)`${source}.evaluated.props`);
            it.props = util_1.mergeEvaluated.props(gen, props, it.props, codegen_1.Name);
          }
        }
        if (it.items !== true) {
          if (schEvaluated && !schEvaluated.dynamicItems) {
            if (schEvaluated.items !== void 0) {
              it.items = util_1.mergeEvaluated.items(gen, schEvaluated.items, it.items);
            }
          } else {
            const items = gen.var("items", (0, codegen_1._)`${source}.evaluated.items`);
            it.items = util_1.mergeEvaluated.items(gen, items, it.items, codegen_1.Name);
          }
        }
      }
    }
    exports.callRef = callRef;
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/core/index.js
var require_core2 = __commonJS({
  "../node_modules/ajv/dist/vocabularies/core/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var id_1 = require_id();
    var ref_1 = require_ref();
    var core = [
      "$schema",
      "$id",
      "$defs",
      "$vocabulary",
      { keyword: "$comment" },
      "definitions",
      id_1.default,
      ref_1.default
    ];
    exports.default = core;
  }
});

// ../node_modules/ajv/dist/vocabularies/validation/limitNumber.js
var require_limitNumber = __commonJS({
  "../node_modules/ajv/dist/vocabularies/validation/limitNumber.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var ops = codegen_1.operators;
    var KWDs = {
      maximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
      minimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
      exclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
      exclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
    };
    var error = {
      message: ({ keyword, schemaCode }) => (0, codegen_1.str)`must be ${KWDs[keyword].okStr} ${schemaCode}`,
      params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
    };
    var def = {
      keyword: Object.keys(KWDs),
      type: "number",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        cxt.fail$data((0, codegen_1._)`${data} ${KWDs[keyword].fail} ${schemaCode} || isNaN(${data})`);
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/validation/multipleOf.js
var require_multipleOf = __commonJS({
  "../node_modules/ajv/dist/vocabularies/validation/multipleOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error = {
      message: ({ schemaCode }) => (0, codegen_1.str)`must be multiple of ${schemaCode}`,
      params: ({ schemaCode }) => (0, codegen_1._)`{multipleOf: ${schemaCode}}`
    };
    var def = {
      keyword: "multipleOf",
      type: "number",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, schemaCode, it } = cxt;
        const prec = it.opts.multipleOfPrecision;
        const res = gen.let("res");
        const invalid = prec ? (0, codegen_1._)`Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}` : (0, codegen_1._)`${res} !== parseInt(${res})`;
        cxt.fail$data((0, codegen_1._)`(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS({
  "../node_modules/ajv/dist/runtime/ucs2length.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ucs2length(str) {
      const len = str.length;
      let length = 0;
      let pos = 0;
      let value;
      while (pos < len) {
        length++;
        value = str.charCodeAt(pos++);
        if (value >= 55296 && value <= 56319 && pos < len) {
          value = str.charCodeAt(pos);
          if ((value & 64512) === 56320)
            pos++;
        }
      }
      return length;
    }
    exports.default = ucs2length;
    ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
  }
});

// ../node_modules/ajv/dist/vocabularies/validation/limitLength.js
var require_limitLength = __commonJS({
  "../node_modules/ajv/dist/vocabularies/validation/limitLength.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var ucs2length_1 = require_ucs2length();
    var error = {
      message({ keyword, schemaCode }) {
        const comp = keyword === "maxLength" ? "more" : "fewer";
        return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} characters`;
      },
      params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
    };
    var def = {
      keyword: ["maxLength", "minLength"],
      type: "string",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { keyword, data, schemaCode, it } = cxt;
        const op = keyword === "maxLength" ? codegen_1.operators.GT : codegen_1.operators.LT;
        const len = it.opts.unicode === false ? (0, codegen_1._)`${data}.length` : (0, codegen_1._)`${(0, util_1.useFunc)(cxt.gen, ucs2length_1.default)}(${data})`;
        cxt.fail$data((0, codegen_1._)`${len} ${op} ${schemaCode}`);
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/validation/pattern.js
var require_pattern = __commonJS({
  "../node_modules/ajv/dist/vocabularies/validation/pattern.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var util_1 = require_util();
    var codegen_1 = require_codegen();
    var error = {
      message: ({ schemaCode }) => (0, codegen_1.str)`must match pattern "${schemaCode}"`,
      params: ({ schemaCode }) => (0, codegen_1._)`{pattern: ${schemaCode}}`
    };
    var def = {
      keyword: "pattern",
      type: "string",
      schemaType: "string",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, $data, schema, schemaCode, it } = cxt;
        const u = it.opts.unicodeRegExp ? "u" : "";
        if ($data) {
          const { regExp } = it.opts.code;
          const regExpCode = regExp.code === "new RegExp" ? (0, codegen_1._)`new RegExp` : (0, util_1.useFunc)(gen, regExp);
          const valid = gen.let("valid");
          gen.try(() => gen.assign(valid, (0, codegen_1._)`${regExpCode}(${schemaCode}, ${u}).test(${data})`), () => gen.assign(valid, false));
          cxt.fail$data((0, codegen_1._)`!${valid}`);
        } else {
          const regExp = (0, code_1.usePattern)(cxt, schema);
          cxt.fail$data((0, codegen_1._)`!${regExp}.test(${data})`);
        }
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/validation/limitProperties.js
var require_limitProperties = __commonJS({
  "../node_modules/ajv/dist/vocabularies/validation/limitProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error = {
      message({ keyword, schemaCode }) {
        const comp = keyword === "maxProperties" ? "more" : "fewer";
        return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} properties`;
      },
      params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
    };
    var def = {
      keyword: ["maxProperties", "minProperties"],
      type: "object",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        const op = keyword === "maxProperties" ? codegen_1.operators.GT : codegen_1.operators.LT;
        cxt.fail$data((0, codegen_1._)`Object.keys(${data}).length ${op} ${schemaCode}`);
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/validation/required.js
var require_required = __commonJS({
  "../node_modules/ajv/dist/vocabularies/validation/required.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: ({ params: { missingProperty } }) => (0, codegen_1.str)`must have required property '${missingProperty}'`,
      params: ({ params: { missingProperty } }) => (0, codegen_1._)`{missingProperty: ${missingProperty}}`
    };
    var def = {
      keyword: "required",
      type: "object",
      schemaType: "array",
      $data: true,
      error,
      code(cxt) {
        const { gen, schema, schemaCode, data, $data, it } = cxt;
        const { opts } = it;
        if (!$data && schema.length === 0)
          return;
        const useLoop = schema.length >= opts.loopRequired;
        if (it.allErrors)
          allErrorsMode();
        else
          exitOnErrorMode();
        if (opts.strictRequired) {
          const props = cxt.parentSchema.properties;
          const { definedProperties } = cxt.it;
          for (const requiredKey of schema) {
            if ((props === null || props === void 0 ? void 0 : props[requiredKey]) === void 0 && !definedProperties.has(requiredKey)) {
              const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
              const msg = `required property "${requiredKey}" is not defined at "${schemaPath}" (strictRequired)`;
              (0, util_1.checkStrictMode)(it, msg, it.opts.strictRequired);
            }
          }
        }
        function allErrorsMode() {
          if (useLoop || $data) {
            cxt.block$data(codegen_1.nil, loopAllRequired);
          } else {
            for (const prop of schema) {
              (0, code_1.checkReportMissingProp)(cxt, prop);
            }
          }
        }
        function exitOnErrorMode() {
          const missing = gen.let("missing");
          if (useLoop || $data) {
            const valid = gen.let("valid", true);
            cxt.block$data(valid, () => loopUntilMissing(missing, valid));
            cxt.ok(valid);
          } else {
            gen.if((0, code_1.checkMissingProp)(cxt, schema, missing));
            (0, code_1.reportMissingProp)(cxt, missing);
            gen.else();
          }
        }
        function loopAllRequired() {
          gen.forOf("prop", schemaCode, (prop) => {
            cxt.setParams({ missingProperty: prop });
            gen.if((0, code_1.noPropertyInData)(gen, data, prop, opts.ownProperties), () => cxt.error());
          });
        }
        function loopUntilMissing(missing, valid) {
          cxt.setParams({ missingProperty: missing });
          gen.forOf(missing, schemaCode, () => {
            gen.assign(valid, (0, code_1.propertyInData)(gen, data, missing, opts.ownProperties));
            gen.if((0, codegen_1.not)(valid), () => {
              cxt.error();
              gen.break();
            });
          }, codegen_1.nil);
        }
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/validation/limitItems.js
var require_limitItems = __commonJS({
  "../node_modules/ajv/dist/vocabularies/validation/limitItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error = {
      message({ keyword, schemaCode }) {
        const comp = keyword === "maxItems" ? "more" : "fewer";
        return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} items`;
      },
      params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
    };
    var def = {
      keyword: ["maxItems", "minItems"],
      type: "array",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        const op = keyword === "maxItems" ? codegen_1.operators.GT : codegen_1.operators.LT;
        cxt.fail$data((0, codegen_1._)`${data}.length ${op} ${schemaCode}`);
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/runtime/equal.js
var require_equal = __commonJS({
  "../node_modules/ajv/dist/runtime/equal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var equal = require_fast_deep_equal();
    equal.code = 'require("ajv/dist/runtime/equal").default';
    exports.default = equal;
  }
});

// ../node_modules/ajv/dist/vocabularies/validation/uniqueItems.js
var require_uniqueItems = __commonJS({
  "../node_modules/ajv/dist/vocabularies/validation/uniqueItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var dataType_1 = require_dataType();
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var equal_1 = require_equal();
    var error = {
      message: ({ params: { i, j } }) => (0, codegen_1.str)`must NOT have duplicate items (items ## ${j} and ${i} are identical)`,
      params: ({ params: { i, j } }) => (0, codegen_1._)`{i: ${i}, j: ${j}}`
    };
    var def = {
      keyword: "uniqueItems",
      type: "array",
      schemaType: "boolean",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, $data, schema, parentSchema, schemaCode, it } = cxt;
        if (!$data && !schema)
          return;
        const valid = gen.let("valid");
        const itemTypes = parentSchema.items ? (0, dataType_1.getSchemaTypes)(parentSchema.items) : [];
        cxt.block$data(valid, validateUniqueItems, (0, codegen_1._)`${schemaCode} === false`);
        cxt.ok(valid);
        function validateUniqueItems() {
          const i = gen.let("i", (0, codegen_1._)`${data}.length`);
          const j = gen.let("j");
          cxt.setParams({ i, j });
          gen.assign(valid, true);
          gen.if((0, codegen_1._)`${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j));
        }
        function canOptimize() {
          return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array");
        }
        function loopN(i, j) {
          const item = gen.name("item");
          const wrongType = (0, dataType_1.checkDataTypes)(itemTypes, item, it.opts.strictNumbers, dataType_1.DataType.Wrong);
          const indices = gen.const("indices", (0, codegen_1._)`{}`);
          gen.for((0, codegen_1._)`;${i}--;`, () => {
            gen.let(item, (0, codegen_1._)`${data}[${i}]`);
            gen.if(wrongType, (0, codegen_1._)`continue`);
            if (itemTypes.length > 1)
              gen.if((0, codegen_1._)`typeof ${item} == "string"`, (0, codegen_1._)`${item} += "_"`);
            gen.if((0, codegen_1._)`typeof ${indices}[${item}] == "number"`, () => {
              gen.assign(j, (0, codegen_1._)`${indices}[${item}]`);
              cxt.error();
              gen.assign(valid, false).break();
            }).code((0, codegen_1._)`${indices}[${item}] = ${i}`);
          });
        }
        function loopN2(i, j) {
          const eql = (0, util_1.useFunc)(gen, equal_1.default);
          const outer = gen.name("outer");
          gen.label(outer).for((0, codegen_1._)`;${i}--;`, () => gen.for((0, codegen_1._)`${j} = ${i}; ${j}--;`, () => gen.if((0, codegen_1._)`${eql}(${data}[${i}], ${data}[${j}])`, () => {
            cxt.error();
            gen.assign(valid, false).break(outer);
          })));
        }
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/validation/const.js
var require_const = __commonJS({
  "../node_modules/ajv/dist/vocabularies/validation/const.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var equal_1 = require_equal();
    var error = {
      message: "must be equal to constant",
      params: ({ schemaCode }) => (0, codegen_1._)`{allowedValue: ${schemaCode}}`
    };
    var def = {
      keyword: "const",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, $data, schemaCode, schema } = cxt;
        if ($data || schema && typeof schema == "object") {
          cxt.fail$data((0, codegen_1._)`!${(0, util_1.useFunc)(gen, equal_1.default)}(${data}, ${schemaCode})`);
        } else {
          cxt.fail((0, codegen_1._)`${schema} !== ${data}`);
        }
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/validation/enum.js
var require_enum = __commonJS({
  "../node_modules/ajv/dist/vocabularies/validation/enum.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var equal_1 = require_equal();
    var error = {
      message: "must be equal to one of the allowed values",
      params: ({ schemaCode }) => (0, codegen_1._)`{allowedValues: ${schemaCode}}`
    };
    var def = {
      keyword: "enum",
      schemaType: "array",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, $data, schema, schemaCode, it } = cxt;
        if (!$data && schema.length === 0)
          throw new Error("enum must have non-empty array");
        const useLoop = schema.length >= it.opts.loopEnum;
        let eql;
        const getEql = () => eql !== null && eql !== void 0 ? eql : eql = (0, util_1.useFunc)(gen, equal_1.default);
        let valid;
        if (useLoop || $data) {
          valid = gen.let("valid");
          cxt.block$data(valid, loopEnum);
        } else {
          if (!Array.isArray(schema))
            throw new Error("ajv implementation error");
          const vSchema = gen.const("vSchema", schemaCode);
          valid = (0, codegen_1.or)(...schema.map((_x, i) => equalCode(vSchema, i)));
        }
        cxt.pass(valid);
        function loopEnum() {
          gen.assign(valid, false);
          gen.forOf("v", schemaCode, (v) => gen.if((0, codegen_1._)`${getEql()}(${data}, ${v})`, () => gen.assign(valid, true).break()));
        }
        function equalCode(vSchema, i) {
          const sch = schema[i];
          return typeof sch === "object" && sch !== null ? (0, codegen_1._)`${getEql()}(${data}, ${vSchema}[${i}])` : (0, codegen_1._)`${data} === ${sch}`;
        }
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/validation/index.js
var require_validation = __commonJS({
  "../node_modules/ajv/dist/vocabularies/validation/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var limitNumber_1 = require_limitNumber();
    var multipleOf_1 = require_multipleOf();
    var limitLength_1 = require_limitLength();
    var pattern_1 = require_pattern();
    var limitProperties_1 = require_limitProperties();
    var required_1 = require_required();
    var limitItems_1 = require_limitItems();
    var uniqueItems_1 = require_uniqueItems();
    var const_1 = require_const();
    var enum_1 = require_enum();
    var validation = [
      // number
      limitNumber_1.default,
      multipleOf_1.default,
      // string
      limitLength_1.default,
      pattern_1.default,
      // object
      limitProperties_1.default,
      required_1.default,
      // array
      limitItems_1.default,
      uniqueItems_1.default,
      // any
      { keyword: "type", schemaType: ["string", "array"] },
      { keyword: "nullable", schemaType: "boolean" },
      const_1.default,
      enum_1.default
    ];
    exports.default = validation;
  }
});

// ../node_modules/ajv/dist/vocabularies/applicator/additionalItems.js
var require_additionalItems = __commonJS({
  "../node_modules/ajv/dist/vocabularies/applicator/additionalItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateAdditionalItems = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
      params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
    };
    var def = {
      keyword: "additionalItems",
      type: "array",
      schemaType: ["boolean", "object"],
      before: "uniqueItems",
      error,
      code(cxt) {
        const { parentSchema, it } = cxt;
        const { items } = parentSchema;
        if (!Array.isArray(items)) {
          (0, util_1.checkStrictMode)(it, '"additionalItems" is ignored when "items" is not an array of schemas');
          return;
        }
        validateAdditionalItems(cxt, items);
      }
    };
    function validateAdditionalItems(cxt, items) {
      const { gen, schema, data, keyword, it } = cxt;
      it.items = true;
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      if (schema === false) {
        cxt.setParams({ len: items.length });
        cxt.pass((0, codegen_1._)`${len} <= ${items.length}`);
      } else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
        const valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items.length}`);
        gen.if((0, codegen_1.not)(valid), () => validateItems(valid));
        cxt.ok(valid);
      }
      function validateItems(valid) {
        gen.forRange("i", items.length, len, (i) => {
          cxt.subschema({ keyword, dataProp: i, dataPropType: util_1.Type.Num }, valid);
          if (!it.allErrors)
            gen.if((0, codegen_1.not)(valid), () => gen.break());
        });
      }
    }
    exports.validateAdditionalItems = validateAdditionalItems;
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/applicator/items.js
var require_items = __commonJS({
  "../node_modules/ajv/dist/vocabularies/applicator/items.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateTuple = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var code_1 = require_code2();
    var def = {
      keyword: "items",
      type: "array",
      schemaType: ["object", "array", "boolean"],
      before: "uniqueItems",
      code(cxt) {
        const { schema, it } = cxt;
        if (Array.isArray(schema))
          return validateTuple(cxt, "additionalItems", schema);
        it.items = true;
        if ((0, util_1.alwaysValidSchema)(it, schema))
          return;
        cxt.ok((0, code_1.validateArray)(cxt));
      }
    };
    function validateTuple(cxt, extraItems, schArr = cxt.schema) {
      const { gen, parentSchema, data, keyword, it } = cxt;
      checkStrictTuple(parentSchema);
      if (it.opts.unevaluated && schArr.length && it.items !== true) {
        it.items = util_1.mergeEvaluated.items(gen, schArr.length, it.items);
      }
      const valid = gen.name("valid");
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      schArr.forEach((sch, i) => {
        if ((0, util_1.alwaysValidSchema)(it, sch))
          return;
        gen.if((0, codegen_1._)`${len} > ${i}`, () => cxt.subschema({
          keyword,
          schemaProp: i,
          dataProp: i
        }, valid));
        cxt.ok(valid);
      });
      function checkStrictTuple(sch) {
        const { opts, errSchemaPath } = it;
        const l = schArr.length;
        const fullTuple = l === sch.minItems && (l === sch.maxItems || sch[extraItems] === false);
        if (opts.strictTuples && !fullTuple) {
          const msg = `"${keyword}" is ${l}-tuple, but minItems or maxItems/${extraItems} are not specified or different at path "${errSchemaPath}"`;
          (0, util_1.checkStrictMode)(it, msg, opts.strictTuples);
        }
      }
    }
    exports.validateTuple = validateTuple;
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/applicator/prefixItems.js
var require_prefixItems = __commonJS({
  "../node_modules/ajv/dist/vocabularies/applicator/prefixItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var items_1 = require_items();
    var def = {
      keyword: "prefixItems",
      type: "array",
      schemaType: ["array"],
      before: "uniqueItems",
      code: (cxt) => (0, items_1.validateTuple)(cxt, "items")
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/applicator/items2020.js
var require_items2020 = __commonJS({
  "../node_modules/ajv/dist/vocabularies/applicator/items2020.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var code_1 = require_code2();
    var additionalItems_1 = require_additionalItems();
    var error = {
      message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
      params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
    };
    var def = {
      keyword: "items",
      type: "array",
      schemaType: ["object", "boolean"],
      before: "uniqueItems",
      error,
      code(cxt) {
        const { schema, parentSchema, it } = cxt;
        const { prefixItems } = parentSchema;
        it.items = true;
        if ((0, util_1.alwaysValidSchema)(it, schema))
          return;
        if (prefixItems)
          (0, additionalItems_1.validateAdditionalItems)(cxt, prefixItems);
        else
          cxt.ok((0, code_1.validateArray)(cxt));
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/applicator/contains.js
var require_contains = __commonJS({
  "../node_modules/ajv/dist/vocabularies/applicator/contains.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: ({ params: { min, max } }) => max === void 0 ? (0, codegen_1.str)`must contain at least ${min} valid item(s)` : (0, codegen_1.str)`must contain at least ${min} and no more than ${max} valid item(s)`,
      params: ({ params: { min, max } }) => max === void 0 ? (0, codegen_1._)`{minContains: ${min}}` : (0, codegen_1._)`{minContains: ${min}, maxContains: ${max}}`
    };
    var def = {
      keyword: "contains",
      type: "array",
      schemaType: ["object", "boolean"],
      before: "uniqueItems",
      trackErrors: true,
      error,
      code(cxt) {
        const { gen, schema, parentSchema, data, it } = cxt;
        let min;
        let max;
        const { minContains, maxContains } = parentSchema;
        if (it.opts.next) {
          min = minContains === void 0 ? 1 : minContains;
          max = maxContains;
        } else {
          min = 1;
        }
        const len = gen.const("len", (0, codegen_1._)`${data}.length`);
        cxt.setParams({ min, max });
        if (max === void 0 && min === 0) {
          (0, util_1.checkStrictMode)(it, `"minContains" == 0 without "maxContains": "contains" keyword ignored`);
          return;
        }
        if (max !== void 0 && min > max) {
          (0, util_1.checkStrictMode)(it, `"minContains" > "maxContains" is always invalid`);
          cxt.fail();
          return;
        }
        if ((0, util_1.alwaysValidSchema)(it, schema)) {
          let cond = (0, codegen_1._)`${len} >= ${min}`;
          if (max !== void 0)
            cond = (0, codegen_1._)`${cond} && ${len} <= ${max}`;
          cxt.pass(cond);
          return;
        }
        it.items = true;
        const valid = gen.name("valid");
        if (max === void 0 && min === 1) {
          validateItems(valid, () => gen.if(valid, () => gen.break()));
        } else if (min === 0) {
          gen.let(valid, true);
          if (max !== void 0)
            gen.if((0, codegen_1._)`${data}.length > 0`, validateItemsWithCount);
        } else {
          gen.let(valid, false);
          validateItemsWithCount();
        }
        cxt.result(valid, () => cxt.reset());
        function validateItemsWithCount() {
          const schValid = gen.name("_valid");
          const count = gen.let("count", 0);
          validateItems(schValid, () => gen.if(schValid, () => checkLimits(count)));
        }
        function validateItems(_valid, block) {
          gen.forRange("i", 0, len, (i) => {
            cxt.subschema({
              keyword: "contains",
              dataProp: i,
              dataPropType: util_1.Type.Num,
              compositeRule: true
            }, _valid);
            block();
          });
        }
        function checkLimits(count) {
          gen.code((0, codegen_1._)`${count}++`);
          if (max === void 0) {
            gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true).break());
          } else {
            gen.if((0, codegen_1._)`${count} > ${max}`, () => gen.assign(valid, false).break());
            if (min === 1)
              gen.assign(valid, true);
            else
              gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true));
          }
        }
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/applicator/dependencies.js
var require_dependencies = __commonJS({
  "../node_modules/ajv/dist/vocabularies/applicator/dependencies.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateSchemaDeps = exports.validatePropertyDeps = exports.error = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var code_1 = require_code2();
    exports.error = {
      message: ({ params: { property, depsCount, deps } }) => {
        const property_ies = depsCount === 1 ? "property" : "properties";
        return (0, codegen_1.str)`must have ${property_ies} ${deps} when property ${property} is present`;
      },
      params: ({ params: { property, depsCount, deps, missingProperty } }) => (0, codegen_1._)`{property: ${property},
    missingProperty: ${missingProperty},
    depsCount: ${depsCount},
    deps: ${deps}}`
      // TODO change to reference
    };
    var def = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: exports.error,
      code(cxt) {
        const [propDeps, schDeps] = splitDependencies(cxt);
        validatePropertyDeps(cxt, propDeps);
        validateSchemaDeps(cxt, schDeps);
      }
    };
    function splitDependencies({ schema }) {
      const propertyDeps = {};
      const schemaDeps = {};
      for (const key in schema) {
        if (key === "__proto__")
          continue;
        const deps = Array.isArray(schema[key]) ? propertyDeps : schemaDeps;
        deps[key] = schema[key];
      }
      return [propertyDeps, schemaDeps];
    }
    function validatePropertyDeps(cxt, propertyDeps = cxt.schema) {
      const { gen, data, it } = cxt;
      if (Object.keys(propertyDeps).length === 0)
        return;
      const missing = gen.let("missing");
      for (const prop in propertyDeps) {
        const deps = propertyDeps[prop];
        if (deps.length === 0)
          continue;
        const hasProperty = (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties);
        cxt.setParams({
          property: prop,
          depsCount: deps.length,
          deps: deps.join(", ")
        });
        if (it.allErrors) {
          gen.if(hasProperty, () => {
            for (const depProp of deps) {
              (0, code_1.checkReportMissingProp)(cxt, depProp);
            }
          });
        } else {
          gen.if((0, codegen_1._)`${hasProperty} && (${(0, code_1.checkMissingProp)(cxt, deps, missing)})`);
          (0, code_1.reportMissingProp)(cxt, missing);
          gen.else();
        }
      }
    }
    exports.validatePropertyDeps = validatePropertyDeps;
    function validateSchemaDeps(cxt, schemaDeps = cxt.schema) {
      const { gen, data, keyword, it } = cxt;
      const valid = gen.name("valid");
      for (const prop in schemaDeps) {
        if ((0, util_1.alwaysValidSchema)(it, schemaDeps[prop]))
          continue;
        gen.if(
          (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties),
          () => {
            const schCxt = cxt.subschema({ keyword, schemaProp: prop }, valid);
            cxt.mergeValidEvaluated(schCxt, valid);
          },
          () => gen.var(valid, true)
          // TODO var
        );
        cxt.ok(valid);
      }
    }
    exports.validateSchemaDeps = validateSchemaDeps;
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/applicator/propertyNames.js
var require_propertyNames = __commonJS({
  "../node_modules/ajv/dist/vocabularies/applicator/propertyNames.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: "property name must be valid",
      params: ({ params }) => (0, codegen_1._)`{propertyName: ${params.propertyName}}`
    };
    var def = {
      keyword: "propertyNames",
      type: "object",
      schemaType: ["object", "boolean"],
      error,
      code(cxt) {
        const { gen, schema, data, it } = cxt;
        if ((0, util_1.alwaysValidSchema)(it, schema))
          return;
        const valid = gen.name("valid");
        gen.forIn("key", data, (key) => {
          cxt.setParams({ propertyName: key });
          cxt.subschema({
            keyword: "propertyNames",
            data: key,
            dataTypes: ["string"],
            propertyName: key,
            compositeRule: true
          }, valid);
          gen.if((0, codegen_1.not)(valid), () => {
            cxt.error(true);
            if (!it.allErrors)
              gen.break();
          });
        });
        cxt.ok(valid);
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js
var require_additionalProperties = __commonJS({
  "../node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var util_1 = require_util();
    var error = {
      message: "must NOT have additional properties",
      params: ({ params }) => (0, codegen_1._)`{additionalProperty: ${params.additionalProperty}}`
    };
    var def = {
      keyword: "additionalProperties",
      type: ["object"],
      schemaType: ["boolean", "object"],
      allowUndefined: true,
      trackErrors: true,
      error,
      code(cxt) {
        const { gen, schema, parentSchema, data, errsCount, it } = cxt;
        if (!errsCount)
          throw new Error("ajv implementation error");
        const { allErrors, opts } = it;
        it.props = true;
        if (opts.removeAdditional !== "all" && (0, util_1.alwaysValidSchema)(it, schema))
          return;
        const props = (0, code_1.allSchemaProperties)(parentSchema.properties);
        const patProps = (0, code_1.allSchemaProperties)(parentSchema.patternProperties);
        checkAdditionalProperties();
        cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
        function checkAdditionalProperties() {
          gen.forIn("key", data, (key) => {
            if (!props.length && !patProps.length)
              additionalPropertyCode(key);
            else
              gen.if(isAdditional(key), () => additionalPropertyCode(key));
          });
        }
        function isAdditional(key) {
          let definedProp;
          if (props.length > 8) {
            const propsSchema = (0, util_1.schemaRefOrVal)(it, parentSchema.properties, "properties");
            definedProp = (0, code_1.isOwnProperty)(gen, propsSchema, key);
          } else if (props.length) {
            definedProp = (0, codegen_1.or)(...props.map((p) => (0, codegen_1._)`${key} === ${p}`));
          } else {
            definedProp = codegen_1.nil;
          }
          if (patProps.length) {
            definedProp = (0, codegen_1.or)(definedProp, ...patProps.map((p) => (0, codegen_1._)`${(0, code_1.usePattern)(cxt, p)}.test(${key})`));
          }
          return (0, codegen_1.not)(definedProp);
        }
        function deleteAdditional(key) {
          gen.code((0, codegen_1._)`delete ${data}[${key}]`);
        }
        function additionalPropertyCode(key) {
          if (opts.removeAdditional === "all" || opts.removeAdditional && schema === false) {
            deleteAdditional(key);
            return;
          }
          if (schema === false) {
            cxt.setParams({ additionalProperty: key });
            cxt.error();
            if (!allErrors)
              gen.break();
            return;
          }
          if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
            const valid = gen.name("valid");
            if (opts.removeAdditional === "failing") {
              applyAdditionalSchema(key, valid, false);
              gen.if((0, codegen_1.not)(valid), () => {
                cxt.reset();
                deleteAdditional(key);
              });
            } else {
              applyAdditionalSchema(key, valid);
              if (!allErrors)
                gen.if((0, codegen_1.not)(valid), () => gen.break());
            }
          }
        }
        function applyAdditionalSchema(key, valid, errors) {
          const subschema = {
            keyword: "additionalProperties",
            dataProp: key,
            dataPropType: util_1.Type.Str
          };
          if (errors === false) {
            Object.assign(subschema, {
              compositeRule: true,
              createErrors: false,
              allErrors: false
            });
          }
          cxt.subschema(subschema, valid);
        }
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/applicator/properties.js
var require_properties = __commonJS({
  "../node_modules/ajv/dist/vocabularies/applicator/properties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var validate_1 = require_validate();
    var code_1 = require_code2();
    var util_1 = require_util();
    var additionalProperties_1 = require_additionalProperties();
    var def = {
      keyword: "properties",
      type: "object",
      schemaType: "object",
      code(cxt) {
        const { gen, schema, parentSchema, data, it } = cxt;
        if (it.opts.removeAdditional === "all" && parentSchema.additionalProperties === void 0) {
          additionalProperties_1.default.code(new validate_1.KeywordCxt(it, additionalProperties_1.default, "additionalProperties"));
        }
        const allProps = (0, code_1.allSchemaProperties)(schema);
        for (const prop of allProps) {
          it.definedProperties.add(prop);
        }
        if (it.opts.unevaluated && allProps.length && it.props !== true) {
          it.props = util_1.mergeEvaluated.props(gen, (0, util_1.toHash)(allProps), it.props);
        }
        const properties = allProps.filter((p) => !(0, util_1.alwaysValidSchema)(it, schema[p]));
        if (properties.length === 0)
          return;
        const valid = gen.name("valid");
        for (const prop of properties) {
          if (hasDefault(prop)) {
            applyPropertySchema(prop);
          } else {
            gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties));
            applyPropertySchema(prop);
            if (!it.allErrors)
              gen.else().var(valid, true);
            gen.endIf();
          }
          cxt.it.definedProperties.add(prop);
          cxt.ok(valid);
        }
        function hasDefault(prop) {
          return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== void 0;
        }
        function applyPropertySchema(prop) {
          cxt.subschema({
            keyword: "properties",
            schemaProp: prop,
            dataProp: prop
          }, valid);
        }
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/applicator/patternProperties.js
var require_patternProperties = __commonJS({
  "../node_modules/ajv/dist/vocabularies/applicator/patternProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var util_2 = require_util();
    var def = {
      keyword: "patternProperties",
      type: "object",
      schemaType: "object",
      code(cxt) {
        const { gen, schema, data, parentSchema, it } = cxt;
        const { opts } = it;
        const patterns = (0, code_1.allSchemaProperties)(schema);
        const alwaysValidPatterns = patterns.filter((p) => (0, util_1.alwaysValidSchema)(it, schema[p]));
        if (patterns.length === 0 || alwaysValidPatterns.length === patterns.length && (!it.opts.unevaluated || it.props === true)) {
          return;
        }
        const checkProperties = opts.strictSchema && !opts.allowMatchingProperties && parentSchema.properties;
        const valid = gen.name("valid");
        if (it.props !== true && !(it.props instanceof codegen_1.Name)) {
          it.props = (0, util_2.evaluatedPropsToName)(gen, it.props);
        }
        const { props } = it;
        validatePatternProperties();
        function validatePatternProperties() {
          for (const pat of patterns) {
            if (checkProperties)
              checkMatchingProperties(pat);
            if (it.allErrors) {
              validateProperties(pat);
            } else {
              gen.var(valid, true);
              validateProperties(pat);
              gen.if(valid);
            }
          }
        }
        function checkMatchingProperties(pat) {
          for (const prop in checkProperties) {
            if (new RegExp(pat).test(prop)) {
              (0, util_1.checkStrictMode)(it, `property ${prop} matches pattern ${pat} (use allowMatchingProperties)`);
            }
          }
        }
        function validateProperties(pat) {
          gen.forIn("key", data, (key) => {
            gen.if((0, codegen_1._)`${(0, code_1.usePattern)(cxt, pat)}.test(${key})`, () => {
              const alwaysValid = alwaysValidPatterns.includes(pat);
              if (!alwaysValid) {
                cxt.subschema({
                  keyword: "patternProperties",
                  schemaProp: pat,
                  dataProp: key,
                  dataPropType: util_2.Type.Str
                }, valid);
              }
              if (it.opts.unevaluated && props !== true) {
                gen.assign((0, codegen_1._)`${props}[${key}]`, true);
              } else if (!alwaysValid && !it.allErrors) {
                gen.if((0, codegen_1.not)(valid), () => gen.break());
              }
            });
          });
        }
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/applicator/not.js
var require_not = __commonJS({
  "../node_modules/ajv/dist/vocabularies/applicator/not.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util();
    var def = {
      keyword: "not",
      schemaType: ["object", "boolean"],
      trackErrors: true,
      code(cxt) {
        const { gen, schema, it } = cxt;
        if ((0, util_1.alwaysValidSchema)(it, schema)) {
          cxt.fail();
          return;
        }
        const valid = gen.name("valid");
        cxt.subschema({
          keyword: "not",
          compositeRule: true,
          createErrors: false,
          allErrors: false
        }, valid);
        cxt.failResult(valid, () => cxt.reset(), () => cxt.error());
      },
      error: { message: "must NOT be valid" }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/applicator/anyOf.js
var require_anyOf = __commonJS({
  "../node_modules/ajv/dist/vocabularies/applicator/anyOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var def = {
      keyword: "anyOf",
      schemaType: "array",
      trackErrors: true,
      code: code_1.validateUnion,
      error: { message: "must match a schema in anyOf" }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/applicator/oneOf.js
var require_oneOf = __commonJS({
  "../node_modules/ajv/dist/vocabularies/applicator/oneOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: "must match exactly one schema in oneOf",
      params: ({ params }) => (0, codegen_1._)`{passingSchemas: ${params.passing}}`
    };
    var def = {
      keyword: "oneOf",
      schemaType: "array",
      trackErrors: true,
      error,
      code(cxt) {
        const { gen, schema, parentSchema, it } = cxt;
        if (!Array.isArray(schema))
          throw new Error("ajv implementation error");
        if (it.opts.discriminator && parentSchema.discriminator)
          return;
        const schArr = schema;
        const valid = gen.let("valid", false);
        const passing = gen.let("passing", null);
        const schValid = gen.name("_valid");
        cxt.setParams({ passing });
        gen.block(validateOneOf);
        cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
        function validateOneOf() {
          schArr.forEach((sch, i) => {
            let schCxt;
            if ((0, util_1.alwaysValidSchema)(it, sch)) {
              gen.var(schValid, true);
            } else {
              schCxt = cxt.subschema({
                keyword: "oneOf",
                schemaProp: i,
                compositeRule: true
              }, schValid);
            }
            if (i > 0) {
              gen.if((0, codegen_1._)`${schValid} && ${valid}`).assign(valid, false).assign(passing, (0, codegen_1._)`[${passing}, ${i}]`).else();
            }
            gen.if(schValid, () => {
              gen.assign(valid, true);
              gen.assign(passing, i);
              if (schCxt)
                cxt.mergeEvaluated(schCxt, codegen_1.Name);
            });
          });
        }
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/applicator/allOf.js
var require_allOf = __commonJS({
  "../node_modules/ajv/dist/vocabularies/applicator/allOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util();
    var def = {
      keyword: "allOf",
      schemaType: "array",
      code(cxt) {
        const { gen, schema, it } = cxt;
        if (!Array.isArray(schema))
          throw new Error("ajv implementation error");
        const valid = gen.name("valid");
        schema.forEach((sch, i) => {
          if ((0, util_1.alwaysValidSchema)(it, sch))
            return;
          const schCxt = cxt.subschema({ keyword: "allOf", schemaProp: i }, valid);
          cxt.ok(valid);
          cxt.mergeEvaluated(schCxt);
        });
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/applicator/if.js
var require_if = __commonJS({
  "../node_modules/ajv/dist/vocabularies/applicator/if.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error = {
      message: ({ params }) => (0, codegen_1.str)`must match "${params.ifClause}" schema`,
      params: ({ params }) => (0, codegen_1._)`{failingKeyword: ${params.ifClause}}`
    };
    var def = {
      keyword: "if",
      schemaType: ["object", "boolean"],
      trackErrors: true,
      error,
      code(cxt) {
        const { gen, parentSchema, it } = cxt;
        if (parentSchema.then === void 0 && parentSchema.else === void 0) {
          (0, util_1.checkStrictMode)(it, '"if" without "then" and "else" is ignored');
        }
        const hasThen = hasSchema(it, "then");
        const hasElse = hasSchema(it, "else");
        if (!hasThen && !hasElse)
          return;
        const valid = gen.let("valid", true);
        const schValid = gen.name("_valid");
        validateIf();
        cxt.reset();
        if (hasThen && hasElse) {
          const ifClause = gen.let("ifClause");
          cxt.setParams({ ifClause });
          gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
        } else if (hasThen) {
          gen.if(schValid, validateClause("then"));
        } else {
          gen.if((0, codegen_1.not)(schValid), validateClause("else"));
        }
        cxt.pass(valid, () => cxt.error(true));
        function validateIf() {
          const schCxt = cxt.subschema({
            keyword: "if",
            compositeRule: true,
            createErrors: false,
            allErrors: false
          }, schValid);
          cxt.mergeEvaluated(schCxt);
        }
        function validateClause(keyword, ifClause) {
          return () => {
            const schCxt = cxt.subschema({ keyword }, schValid);
            gen.assign(valid, schValid);
            cxt.mergeValidEvaluated(schCxt, valid);
            if (ifClause)
              gen.assign(ifClause, (0, codegen_1._)`${keyword}`);
            else
              cxt.setParams({ ifClause: keyword });
          };
        }
      }
    };
    function hasSchema(it, keyword) {
      const schema = it.schema[keyword];
      return schema !== void 0 && !(0, util_1.alwaysValidSchema)(it, schema);
    }
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/applicator/thenElse.js
var require_thenElse = __commonJS({
  "../node_modules/ajv/dist/vocabularies/applicator/thenElse.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util();
    var def = {
      keyword: ["then", "else"],
      schemaType: ["object", "boolean"],
      code({ keyword, parentSchema, it }) {
        if (parentSchema.if === void 0)
          (0, util_1.checkStrictMode)(it, `"${keyword}" without "if" is ignored`);
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/applicator/index.js
var require_applicator = __commonJS({
  "../node_modules/ajv/dist/vocabularies/applicator/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var additionalItems_1 = require_additionalItems();
    var prefixItems_1 = require_prefixItems();
    var items_1 = require_items();
    var items2020_1 = require_items2020();
    var contains_1 = require_contains();
    var dependencies_1 = require_dependencies();
    var propertyNames_1 = require_propertyNames();
    var additionalProperties_1 = require_additionalProperties();
    var properties_1 = require_properties();
    var patternProperties_1 = require_patternProperties();
    var not_1 = require_not();
    var anyOf_1 = require_anyOf();
    var oneOf_1 = require_oneOf();
    var allOf_1 = require_allOf();
    var if_1 = require_if();
    var thenElse_1 = require_thenElse();
    function getApplicator(draft2020 = false) {
      const applicator = [
        // any
        not_1.default,
        anyOf_1.default,
        oneOf_1.default,
        allOf_1.default,
        if_1.default,
        thenElse_1.default,
        // object
        propertyNames_1.default,
        additionalProperties_1.default,
        dependencies_1.default,
        properties_1.default,
        patternProperties_1.default
      ];
      if (draft2020)
        applicator.push(prefixItems_1.default, items2020_1.default);
      else
        applicator.push(additionalItems_1.default, items_1.default);
      applicator.push(contains_1.default);
      return applicator;
    }
    exports.default = getApplicator;
  }
});

// ../node_modules/ajv/dist/vocabularies/format/format.js
var require_format = __commonJS({
  "../node_modules/ajv/dist/vocabularies/format/format.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error = {
      message: ({ schemaCode }) => (0, codegen_1.str)`must match format "${schemaCode}"`,
      params: ({ schemaCode }) => (0, codegen_1._)`{format: ${schemaCode}}`
    };
    var def = {
      keyword: "format",
      type: ["number", "string"],
      schemaType: "string",
      $data: true,
      error,
      code(cxt, ruleType) {
        const { gen, data, $data, schema, schemaCode, it } = cxt;
        const { opts, errSchemaPath, schemaEnv, self } = it;
        if (!opts.validateFormats)
          return;
        if ($data)
          validate$DataFormat();
        else
          validateFormat();
        function validate$DataFormat() {
          const fmts = gen.scopeValue("formats", {
            ref: self.formats,
            code: opts.code.formats
          });
          const fDef = gen.const("fDef", (0, codegen_1._)`${fmts}[${schemaCode}]`);
          const fType = gen.let("fType");
          const format = gen.let("format");
          gen.if((0, codegen_1._)`typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`, () => gen.assign(fType, (0, codegen_1._)`${fDef}.type || "string"`).assign(format, (0, codegen_1._)`${fDef}.validate`), () => gen.assign(fType, (0, codegen_1._)`"string"`).assign(format, fDef));
          cxt.fail$data((0, codegen_1.or)(unknownFmt(), invalidFmt()));
          function unknownFmt() {
            if (opts.strictSchema === false)
              return codegen_1.nil;
            return (0, codegen_1._)`${schemaCode} && !${format}`;
          }
          function invalidFmt() {
            const callFormat = schemaEnv.$async ? (0, codegen_1._)`(${fDef}.async ? await ${format}(${data}) : ${format}(${data}))` : (0, codegen_1._)`${format}(${data})`;
            const validData = (0, codegen_1._)`(typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data}))`;
            return (0, codegen_1._)`${format} && ${format} !== true && ${fType} === ${ruleType} && !${validData}`;
          }
        }
        function validateFormat() {
          const formatDef = self.formats[schema];
          if (!formatDef) {
            unknownFormat();
            return;
          }
          if (formatDef === true)
            return;
          const [fmtType, format, fmtRef] = getFormat(formatDef);
          if (fmtType === ruleType)
            cxt.pass(validCondition());
          function unknownFormat() {
            if (opts.strictSchema === false) {
              self.logger.warn(unknownMsg());
              return;
            }
            throw new Error(unknownMsg());
            function unknownMsg() {
              return `unknown format "${schema}" ignored in schema at path "${errSchemaPath}"`;
            }
          }
          function getFormat(fmtDef) {
            const code = fmtDef instanceof RegExp ? (0, codegen_1.regexpCode)(fmtDef) : opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(schema)}` : void 0;
            const fmt = gen.scopeValue("formats", { key: schema, ref: fmtDef, code });
            if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) {
              return [fmtDef.type || "string", fmtDef.validate, (0, codegen_1._)`${fmt}.validate`];
            }
            return ["string", fmtDef, fmt];
          }
          function validCondition() {
            if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
              if (!schemaEnv.$async)
                throw new Error("async format in sync schema");
              return (0, codegen_1._)`await ${fmtRef}(${data})`;
            }
            return typeof format == "function" ? (0, codegen_1._)`${fmtRef}(${data})` : (0, codegen_1._)`${fmtRef}.test(${data})`;
          }
        }
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/vocabularies/format/index.js
var require_format2 = __commonJS({
  "../node_modules/ajv/dist/vocabularies/format/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var format_1 = require_format();
    var format = [format_1.default];
    exports.default = format;
  }
});

// ../node_modules/ajv/dist/vocabularies/metadata.js
var require_metadata = __commonJS({
  "../node_modules/ajv/dist/vocabularies/metadata.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.contentVocabulary = exports.metadataVocabulary = void 0;
    exports.metadataVocabulary = [
      "title",
      "description",
      "default",
      "deprecated",
      "readOnly",
      "writeOnly",
      "examples"
    ];
    exports.contentVocabulary = [
      "contentMediaType",
      "contentEncoding",
      "contentSchema"
    ];
  }
});

// ../node_modules/ajv/dist/vocabularies/draft7.js
var require_draft7 = __commonJS({
  "../node_modules/ajv/dist/vocabularies/draft7.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var core_1 = require_core2();
    var validation_1 = require_validation();
    var applicator_1 = require_applicator();
    var format_1 = require_format2();
    var metadata_1 = require_metadata();
    var draft7Vocabularies = [
      core_1.default,
      validation_1.default,
      (0, applicator_1.default)(),
      format_1.default,
      metadata_1.metadataVocabulary,
      metadata_1.contentVocabulary
    ];
    exports.default = draft7Vocabularies;
  }
});

// ../node_modules/ajv/dist/vocabularies/discriminator/types.js
var require_types = __commonJS({
  "../node_modules/ajv/dist/vocabularies/discriminator/types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiscrError = void 0;
    var DiscrError;
    (function(DiscrError2) {
      DiscrError2["Tag"] = "tag";
      DiscrError2["Mapping"] = "mapping";
    })(DiscrError || (exports.DiscrError = DiscrError = {}));
  }
});

// ../node_modules/ajv/dist/vocabularies/discriminator/index.js
var require_discriminator = __commonJS({
  "../node_modules/ajv/dist/vocabularies/discriminator/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var types_1 = require_types();
    var compile_1 = require_compile();
    var ref_error_1 = require_ref_error();
    var util_1 = require_util();
    var error = {
      message: ({ params: { discrError, tagName } }) => discrError === types_1.DiscrError.Tag ? `tag "${tagName}" must be string` : `value of tag "${tagName}" must be in oneOf`,
      params: ({ params: { discrError, tag, tagName } }) => (0, codegen_1._)`{error: ${discrError}, tag: ${tagName}, tagValue: ${tag}}`
    };
    var def = {
      keyword: "discriminator",
      type: "object",
      schemaType: "object",
      error,
      code(cxt) {
        const { gen, data, schema, parentSchema, it } = cxt;
        const { oneOf } = parentSchema;
        if (!it.opts.discriminator) {
          throw new Error("discriminator: requires discriminator option");
        }
        const tagName = schema.propertyName;
        if (typeof tagName != "string")
          throw new Error("discriminator: requires propertyName");
        if (schema.mapping)
          throw new Error("discriminator: mapping is not supported");
        if (!oneOf)
          throw new Error("discriminator: requires oneOf keyword");
        const valid = gen.let("valid", false);
        const tag = gen.const("tag", (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(tagName)}`);
        gen.if((0, codegen_1._)`typeof ${tag} == "string"`, () => validateMapping(), () => cxt.error(false, { discrError: types_1.DiscrError.Tag, tag, tagName }));
        cxt.ok(valid);
        function validateMapping() {
          const mapping = getMapping();
          gen.if(false);
          for (const tagValue in mapping) {
            gen.elseIf((0, codegen_1._)`${tag} === ${tagValue}`);
            gen.assign(valid, applyTagSchema(mapping[tagValue]));
          }
          gen.else();
          cxt.error(false, { discrError: types_1.DiscrError.Mapping, tag, tagName });
          gen.endIf();
        }
        function applyTagSchema(schemaProp) {
          const _valid = gen.name("valid");
          const schCxt = cxt.subschema({ keyword: "oneOf", schemaProp }, _valid);
          cxt.mergeEvaluated(schCxt, codegen_1.Name);
          return _valid;
        }
        function getMapping() {
          var _a;
          const oneOfMapping = {};
          const topRequired = hasRequired(parentSchema);
          let tagRequired = true;
          for (let i = 0; i < oneOf.length; i++) {
            let sch = oneOf[i];
            if ((sch === null || sch === void 0 ? void 0 : sch.$ref) && !(0, util_1.schemaHasRulesButRef)(sch, it.self.RULES)) {
              const ref = sch.$ref;
              sch = compile_1.resolveRef.call(it.self, it.schemaEnv.root, it.baseId, ref);
              if (sch instanceof compile_1.SchemaEnv)
                sch = sch.schema;
              if (sch === void 0)
                throw new ref_error_1.default(it.opts.uriResolver, it.baseId, ref);
            }
            const propSch = (_a = sch === null || sch === void 0 ? void 0 : sch.properties) === null || _a === void 0 ? void 0 : _a[tagName];
            if (typeof propSch != "object") {
              throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${tagName}"`);
            }
            tagRequired = tagRequired && (topRequired || hasRequired(sch));
            addMappings(propSch, i);
          }
          if (!tagRequired)
            throw new Error(`discriminator: "${tagName}" must be required`);
          return oneOfMapping;
          function hasRequired({ required }) {
            return Array.isArray(required) && required.includes(tagName);
          }
          function addMappings(sch, i) {
            if (sch.const) {
              addMapping(sch.const, i);
            } else if (sch.enum) {
              for (const tagValue of sch.enum) {
                addMapping(tagValue, i);
              }
            } else {
              throw new Error(`discriminator: "properties/${tagName}" must have "const" or "enum"`);
            }
          }
          function addMapping(tagValue, i) {
            if (typeof tagValue != "string" || tagValue in oneOfMapping) {
              throw new Error(`discriminator: "${tagName}" values must be unique strings`);
            }
            oneOfMapping[tagValue] = i;
          }
        }
      }
    };
    exports.default = def;
  }
});

// ../node_modules/ajv/dist/refs/json-schema-draft-07.json
var require_json_schema_draft_07 = __commonJS({
  "../node_modules/ajv/dist/refs/json-schema-draft-07.json"(exports, module) {
    module.exports = {
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "http://json-schema.org/draft-07/schema#",
      title: "Core schema meta-schema",
      definitions: {
        schemaArray: {
          type: "array",
          minItems: 1,
          items: { $ref: "#" }
        },
        nonNegativeInteger: {
          type: "integer",
          minimum: 0
        },
        nonNegativeIntegerDefault0: {
          allOf: [{ $ref: "#/definitions/nonNegativeInteger" }, { default: 0 }]
        },
        simpleTypes: {
          enum: ["array", "boolean", "integer", "null", "number", "object", "string"]
        },
        stringArray: {
          type: "array",
          items: { type: "string" },
          uniqueItems: true,
          default: []
        }
      },
      type: ["object", "boolean"],
      properties: {
        $id: {
          type: "string",
          format: "uri-reference"
        },
        $schema: {
          type: "string",
          format: "uri"
        },
        $ref: {
          type: "string",
          format: "uri-reference"
        },
        $comment: {
          type: "string"
        },
        title: {
          type: "string"
        },
        description: {
          type: "string"
        },
        default: true,
        readOnly: {
          type: "boolean",
          default: false
        },
        examples: {
          type: "array",
          items: true
        },
        multipleOf: {
          type: "number",
          exclusiveMinimum: 0
        },
        maximum: {
          type: "number"
        },
        exclusiveMaximum: {
          type: "number"
        },
        minimum: {
          type: "number"
        },
        exclusiveMinimum: {
          type: "number"
        },
        maxLength: { $ref: "#/definitions/nonNegativeInteger" },
        minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
        pattern: {
          type: "string",
          format: "regex"
        },
        additionalItems: { $ref: "#" },
        items: {
          anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }],
          default: true
        },
        maxItems: { $ref: "#/definitions/nonNegativeInteger" },
        minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
        uniqueItems: {
          type: "boolean",
          default: false
        },
        contains: { $ref: "#" },
        maxProperties: { $ref: "#/definitions/nonNegativeInteger" },
        minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
        required: { $ref: "#/definitions/stringArray" },
        additionalProperties: { $ref: "#" },
        definitions: {
          type: "object",
          additionalProperties: { $ref: "#" },
          default: {}
        },
        properties: {
          type: "object",
          additionalProperties: { $ref: "#" },
          default: {}
        },
        patternProperties: {
          type: "object",
          additionalProperties: { $ref: "#" },
          propertyNames: { format: "regex" },
          default: {}
        },
        dependencies: {
          type: "object",
          additionalProperties: {
            anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }]
          }
        },
        propertyNames: { $ref: "#" },
        const: true,
        enum: {
          type: "array",
          items: true,
          minItems: 1,
          uniqueItems: true
        },
        type: {
          anyOf: [
            { $ref: "#/definitions/simpleTypes" },
            {
              type: "array",
              items: { $ref: "#/definitions/simpleTypes" },
              minItems: 1,
              uniqueItems: true
            }
          ]
        },
        format: { type: "string" },
        contentMediaType: { type: "string" },
        contentEncoding: { type: "string" },
        if: { $ref: "#" },
        then: { $ref: "#" },
        else: { $ref: "#" },
        allOf: { $ref: "#/definitions/schemaArray" },
        anyOf: { $ref: "#/definitions/schemaArray" },
        oneOf: { $ref: "#/definitions/schemaArray" },
        not: { $ref: "#" }
      },
      default: true
    };
  }
});

// ../node_modules/ajv/dist/ajv.js
var require_ajv = __commonJS({
  "../node_modules/ajv/dist/ajv.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv = void 0;
    var core_1 = require_core();
    var draft7_1 = require_draft7();
    var discriminator_1 = require_discriminator();
    var draft7MetaSchema = require_json_schema_draft_07();
    var META_SUPPORT_DATA = ["/properties"];
    var META_SCHEMA_ID = "http://json-schema.org/draft-07/schema";
    var Ajv = class extends core_1.default {
      _addVocabularies() {
        super._addVocabularies();
        draft7_1.default.forEach((v) => this.addVocabulary(v));
        if (this.opts.discriminator)
          this.addKeyword(discriminator_1.default);
      }
      _addDefaultMetaSchema() {
        super._addDefaultMetaSchema();
        if (!this.opts.meta)
          return;
        const metaSchema = this.opts.$data ? this.$dataMetaSchema(draft7MetaSchema, META_SUPPORT_DATA) : draft7MetaSchema;
        this.addMetaSchema(metaSchema, META_SCHEMA_ID, false);
        this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
      }
      defaultMeta() {
        return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : void 0);
      }
    };
    exports.Ajv = Ajv;
    module.exports = exports = Ajv;
    module.exports.Ajv = Ajv;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Ajv;
    var validate_1 = require_validate();
    Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
      return validate_1.KeywordCxt;
    } });
    var codegen_1 = require_codegen();
    Object.defineProperty(exports, "_", { enumerable: true, get: function() {
      return codegen_1._;
    } });
    Object.defineProperty(exports, "str", { enumerable: true, get: function() {
      return codegen_1.str;
    } });
    Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
      return codegen_1.stringify;
    } });
    Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
      return codegen_1.nil;
    } });
    Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
      return codegen_1.Name;
    } });
    Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
      return codegen_1.CodeGen;
    } });
    var validation_error_1 = require_validation_error();
    Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function() {
      return validation_error_1.default;
    } });
    var ref_error_1 = require_ref_error();
    Object.defineProperty(exports, "MissingRefError", { enumerable: true, get: function() {
      return ref_error_1.default;
    } });
  }
});

// ../node_modules/ajv-keywords/dist/definitions/typeof.js
var require_typeof = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/typeof.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var TYPES = ["undefined", "string", "number", "object", "function", "boolean", "symbol"];
    function getDef() {
      return {
        keyword: "typeof",
        schemaType: ["string", "array"],
        code(cxt) {
          const { data, schema, schemaValue } = cxt;
          cxt.fail(typeof schema == "string" ? (0, codegen_1._)`typeof ${data} != ${schema}` : (0, codegen_1._)`${schemaValue}.indexOf(typeof ${data}) < 0`);
        },
        metaSchema: {
          anyOf: [
            { type: "string", enum: TYPES },
            { type: "array", items: { type: "string", enum: TYPES } }
          ]
        }
      };
    }
    exports.default = getDef;
    module.exports = getDef;
  }
});

// ../node_modules/ajv-keywords/dist/keywords/typeof.js
var require_typeof2 = __commonJS({
  "../node_modules/ajv-keywords/dist/keywords/typeof.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var typeof_1 = __importDefault(require_typeof());
    var typeofPlugin = (ajv) => ajv.addKeyword((0, typeof_1.default)());
    exports.default = typeofPlugin;
    module.exports = typeofPlugin;
  }
});

// ../node_modules/ajv-keywords/dist/definitions/instanceof.js
var require_instanceof = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/instanceof.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CONSTRUCTORS = {
      Object,
      Array,
      Function,
      Number,
      String,
      Date,
      RegExp
    };
    if (typeof Buffer != "undefined")
      CONSTRUCTORS.Buffer = Buffer;
    if (typeof Promise != "undefined")
      CONSTRUCTORS.Promise = Promise;
    var getDef = Object.assign(_getDef, { CONSTRUCTORS });
    function _getDef() {
      return {
        keyword: "instanceof",
        schemaType: ["string", "array"],
        compile(schema) {
          if (typeof schema == "string") {
            const C = getConstructor(schema);
            return (data) => data instanceof C;
          }
          if (Array.isArray(schema)) {
            const constructors = schema.map(getConstructor);
            return (data) => {
              for (const C of constructors) {
                if (data instanceof C)
                  return true;
              }
              return false;
            };
          }
          throw new Error("ajv implementation error");
        },
        metaSchema: {
          anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }]
        }
      };
    }
    function getConstructor(c) {
      const C = CONSTRUCTORS[c];
      if (C)
        return C;
      throw new Error(`invalid "instanceof" keyword value ${c}`);
    }
    exports.default = getDef;
    module.exports = getDef;
  }
});

// ../node_modules/ajv-keywords/dist/keywords/instanceof.js
var require_instanceof2 = __commonJS({
  "../node_modules/ajv-keywords/dist/keywords/instanceof.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var instanceof_1 = __importDefault(require_instanceof());
    var instanceofPlugin = (ajv) => ajv.addKeyword((0, instanceof_1.default)());
    exports.default = instanceofPlugin;
    module.exports = instanceofPlugin;
  }
});

// ../node_modules/ajv-keywords/dist/definitions/_range.js
var require_range = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/_range.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getRangeDef(keyword) {
      return () => ({
        keyword,
        type: "number",
        schemaType: "array",
        macro: function([min, max]) {
          validateRangeSchema(min, max);
          return keyword === "range" ? { minimum: min, maximum: max } : { exclusiveMinimum: min, exclusiveMaximum: max };
        },
        metaSchema: {
          type: "array",
          minItems: 2,
          maxItems: 2,
          items: { type: "number" }
        }
      });
      function validateRangeSchema(min, max) {
        if (min > max || keyword === "exclusiveRange" && min === max) {
          throw new Error("There are no numbers in range");
        }
      }
    }
    exports.default = getRangeDef;
  }
});

// ../node_modules/ajv-keywords/dist/definitions/range.js
var require_range2 = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/range.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var _range_1 = __importDefault(require_range());
    var getDef = (0, _range_1.default)("range");
    exports.default = getDef;
    module.exports = getDef;
  }
});

// ../node_modules/ajv-keywords/dist/keywords/range.js
var require_range3 = __commonJS({
  "../node_modules/ajv-keywords/dist/keywords/range.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var range_1 = __importDefault(require_range2());
    var range = (ajv) => ajv.addKeyword((0, range_1.default)());
    exports.default = range;
    module.exports = range;
  }
});

// ../node_modules/ajv-keywords/dist/definitions/exclusiveRange.js
var require_exclusiveRange = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/exclusiveRange.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var _range_1 = __importDefault(require_range());
    var getDef = (0, _range_1.default)("exclusiveRange");
    exports.default = getDef;
    module.exports = getDef;
  }
});

// ../node_modules/ajv-keywords/dist/keywords/exclusiveRange.js
var require_exclusiveRange2 = __commonJS({
  "../node_modules/ajv-keywords/dist/keywords/exclusiveRange.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var exclusiveRange_1 = __importDefault(require_exclusiveRange());
    var exclusiveRange = (ajv) => ajv.addKeyword((0, exclusiveRange_1.default)());
    exports.default = exclusiveRange;
    module.exports = exclusiveRange;
  }
});

// ../node_modules/ajv-keywords/dist/definitions/_util.js
var require_util2 = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/_util.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.usePattern = exports.metaSchemaRef = void 0;
    var codegen_1 = require_codegen();
    var META_SCHEMA_ID = "http://json-schema.org/schema";
    function metaSchemaRef({ defaultMeta } = {}) {
      return defaultMeta === false ? {} : { $ref: defaultMeta || META_SCHEMA_ID };
    }
    exports.metaSchemaRef = metaSchemaRef;
    function usePattern({ gen, it: { opts } }, pattern, flags = opts.unicodeRegExp ? "u" : "") {
      const rx = new RegExp(pattern, flags);
      return gen.scopeValue("pattern", {
        key: rx.toString(),
        ref: rx,
        code: (0, codegen_1._)`new RegExp(${pattern}, ${flags})`
      });
    }
    exports.usePattern = usePattern;
  }
});

// ../node_modules/ajv-keywords/dist/definitions/regexp.js
var require_regexp = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/regexp.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var _util_1 = require_util2();
    var regexpMetaSchema = {
      type: "object",
      properties: {
        pattern: { type: "string" },
        flags: { type: "string", nullable: true }
      },
      required: ["pattern"],
      additionalProperties: false
    };
    var metaRegexp = /^\/(.*)\/([gimuy]*)$/;
    function getDef() {
      return {
        keyword: "regexp",
        type: "string",
        schemaType: ["string", "object"],
        code(cxt) {
          const { data, schema } = cxt;
          const regx = getRegExp(schema);
          cxt.pass((0, codegen_1._)`${regx}.test(${data})`);
          function getRegExp(sch) {
            if (typeof sch == "object")
              return (0, _util_1.usePattern)(cxt, sch.pattern, sch.flags);
            const rx = metaRegexp.exec(sch);
            if (rx)
              return (0, _util_1.usePattern)(cxt, rx[1], rx[2]);
            throw new Error("cannot parse string into RegExp");
          }
        },
        metaSchema: {
          anyOf: [{ type: "string" }, regexpMetaSchema]
        }
      };
    }
    exports.default = getDef;
    module.exports = getDef;
  }
});

// ../node_modules/ajv-keywords/dist/keywords/regexp.js
var require_regexp2 = __commonJS({
  "../node_modules/ajv-keywords/dist/keywords/regexp.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var regexp_1 = __importDefault(require_regexp());
    var regexp = (ajv) => ajv.addKeyword((0, regexp_1.default)());
    exports.default = regexp;
    module.exports = regexp;
  }
});

// ../node_modules/ajv-keywords/dist/definitions/transform.js
var require_transform = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/transform.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var transform = {
      trimStart: (s) => s.trimStart(),
      trimEnd: (s) => s.trimEnd(),
      trimLeft: (s) => s.trimStart(),
      trimRight: (s) => s.trimEnd(),
      trim: (s) => s.trim(),
      toLowerCase: (s) => s.toLowerCase(),
      toUpperCase: (s) => s.toUpperCase(),
      toEnumCase: (s, cfg) => (cfg === null || cfg === void 0 ? void 0 : cfg.hash[configKey(s)]) || s
    };
    var getDef = Object.assign(_getDef, { transform });
    function _getDef() {
      return {
        keyword: "transform",
        schemaType: "array",
        before: "enum",
        code(cxt) {
          const { gen, data, schema, parentSchema, it } = cxt;
          const { parentData, parentDataProperty } = it;
          const tNames = schema;
          if (!tNames.length)
            return;
          let cfg;
          if (tNames.includes("toEnumCase")) {
            const config = getEnumCaseCfg(parentSchema);
            cfg = gen.scopeValue("obj", { ref: config, code: (0, codegen_1.stringify)(config) });
          }
          gen.if((0, codegen_1._)`typeof ${data} == "string" && ${parentData} !== undefined`, () => {
            gen.assign(data, transformExpr(tNames.slice()));
            gen.assign((0, codegen_1._)`${parentData}[${parentDataProperty}]`, data);
          });
          function transformExpr(ts) {
            if (!ts.length)
              return data;
            const t = ts.pop();
            if (!(t in transform))
              throw new Error(`transform: unknown transformation ${t}`);
            const func = gen.scopeValue("func", {
              ref: transform[t],
              code: (0, codegen_1._)`require("ajv-keywords/dist/definitions/transform").transform${(0, codegen_1.getProperty)(t)}`
            });
            const arg = transformExpr(ts);
            return cfg && t === "toEnumCase" ? (0, codegen_1._)`${func}(${arg}, ${cfg})` : (0, codegen_1._)`${func}(${arg})`;
          }
        },
        metaSchema: {
          type: "array",
          items: { type: "string", enum: Object.keys(transform) }
        }
      };
    }
    function getEnumCaseCfg(parentSchema) {
      const cfg = { hash: {} };
      if (!parentSchema.enum)
        throw new Error('transform: "toEnumCase" requires "enum"');
      for (const v of parentSchema.enum) {
        if (typeof v !== "string")
          continue;
        const k = configKey(v);
        if (cfg.hash[k]) {
          throw new Error('transform: "toEnumCase" requires all lowercased "enum" values to be unique');
        }
        cfg.hash[k] = v;
      }
      return cfg;
    }
    function configKey(s) {
      return s.toLowerCase();
    }
    exports.default = getDef;
    module.exports = getDef;
  }
});

// ../node_modules/ajv-keywords/dist/keywords/transform.js
var require_transform2 = __commonJS({
  "../node_modules/ajv-keywords/dist/keywords/transform.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var transform_1 = __importDefault(require_transform());
    var transform = (ajv) => ajv.addKeyword((0, transform_1.default)());
    exports.default = transform;
    module.exports = transform;
  }
});

// ../node_modules/ajv-keywords/dist/definitions/uniqueItemProperties.js
var require_uniqueItemProperties = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/uniqueItemProperties.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var equal = require_fast_deep_equal();
    var SCALAR_TYPES = ["number", "integer", "string", "boolean", "null"];
    function getDef() {
      return {
        keyword: "uniqueItemProperties",
        type: "array",
        schemaType: "array",
        compile(keys, parentSchema) {
          const scalar = getScalarKeys(keys, parentSchema);
          return (data) => {
            if (data.length <= 1)
              return true;
            for (let k = 0; k < keys.length; k++) {
              const key = keys[k];
              if (scalar[k]) {
                const hash = {};
                for (const x of data) {
                  if (!x || typeof x != "object")
                    continue;
                  let p = x[key];
                  if (p && typeof p == "object")
                    continue;
                  if (typeof p == "string")
                    p = '"' + p;
                  if (hash[p])
                    return false;
                  hash[p] = true;
                }
              } else {
                for (let i = data.length; i--; ) {
                  const x = data[i];
                  if (!x || typeof x != "object")
                    continue;
                  for (let j = i; j--; ) {
                    const y = data[j];
                    if (y && typeof y == "object" && equal(x[key], y[key]))
                      return false;
                  }
                }
              }
            }
            return true;
          };
        },
        metaSchema: {
          type: "array",
          items: { type: "string" }
        }
      };
    }
    exports.default = getDef;
    function getScalarKeys(keys, schema) {
      return keys.map((key) => {
        var _a, _b, _c;
        const t = (_c = (_b = (_a = schema.items) === null || _a === void 0 ? void 0 : _a.properties) === null || _b === void 0 ? void 0 : _b[key]) === null || _c === void 0 ? void 0 : _c.type;
        return Array.isArray(t) ? !t.includes("object") && !t.includes("array") : SCALAR_TYPES.includes(t);
      });
    }
    module.exports = getDef;
  }
});

// ../node_modules/ajv-keywords/dist/keywords/uniqueItemProperties.js
var require_uniqueItemProperties2 = __commonJS({
  "../node_modules/ajv-keywords/dist/keywords/uniqueItemProperties.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var uniqueItemProperties_1 = __importDefault(require_uniqueItemProperties());
    var uniqueItemProperties = (ajv) => ajv.addKeyword((0, uniqueItemProperties_1.default)());
    exports.default = uniqueItemProperties;
    module.exports = uniqueItemProperties;
  }
});

// ../node_modules/ajv-keywords/dist/definitions/allRequired.js
var require_allRequired = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/allRequired.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getDef() {
      return {
        keyword: "allRequired",
        type: "object",
        schemaType: "boolean",
        macro(schema, parentSchema) {
          if (!schema)
            return true;
          const required = Object.keys(parentSchema.properties);
          if (required.length === 0)
            return true;
          return { required };
        },
        dependencies: ["properties"]
      };
    }
    exports.default = getDef;
    module.exports = getDef;
  }
});

// ../node_modules/ajv-keywords/dist/keywords/allRequired.js
var require_allRequired2 = __commonJS({
  "../node_modules/ajv-keywords/dist/keywords/allRequired.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var allRequired_1 = __importDefault(require_allRequired());
    var allRequired = (ajv) => ajv.addKeyword((0, allRequired_1.default)());
    exports.default = allRequired;
    module.exports = allRequired;
  }
});

// ../node_modules/ajv-keywords/dist/definitions/_required.js
var require_required2 = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/_required.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getRequiredDef(keyword) {
      return () => ({
        keyword,
        type: "object",
        schemaType: "array",
        macro(schema) {
          if (schema.length === 0)
            return true;
          if (schema.length === 1)
            return { required: schema };
          const comb = keyword === "anyRequired" ? "anyOf" : "oneOf";
          return { [comb]: schema.map((p) => ({ required: [p] })) };
        },
        metaSchema: {
          type: "array",
          items: { type: "string" }
        }
      });
    }
    exports.default = getRequiredDef;
  }
});

// ../node_modules/ajv-keywords/dist/definitions/anyRequired.js
var require_anyRequired = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/anyRequired.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var _required_1 = __importDefault(require_required2());
    var getDef = (0, _required_1.default)("anyRequired");
    exports.default = getDef;
    module.exports = getDef;
  }
});

// ../node_modules/ajv-keywords/dist/keywords/anyRequired.js
var require_anyRequired2 = __commonJS({
  "../node_modules/ajv-keywords/dist/keywords/anyRequired.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var anyRequired_1 = __importDefault(require_anyRequired());
    var anyRequired = (ajv) => ajv.addKeyword((0, anyRequired_1.default)());
    exports.default = anyRequired;
    module.exports = anyRequired;
  }
});

// ../node_modules/ajv-keywords/dist/definitions/oneRequired.js
var require_oneRequired = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/oneRequired.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var _required_1 = __importDefault(require_required2());
    var getDef = (0, _required_1.default)("oneRequired");
    exports.default = getDef;
    module.exports = getDef;
  }
});

// ../node_modules/ajv-keywords/dist/keywords/oneRequired.js
var require_oneRequired2 = __commonJS({
  "../node_modules/ajv-keywords/dist/keywords/oneRequired.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var oneRequired_1 = __importDefault(require_oneRequired());
    var oneRequired = (ajv) => ajv.addKeyword((0, oneRequired_1.default)());
    exports.default = oneRequired;
    module.exports = oneRequired;
  }
});

// ../node_modules/ajv-keywords/dist/definitions/patternRequired.js
var require_patternRequired = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/patternRequired.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var _util_1 = require_util2();
    var error = {
      message: ({ params: { missingPattern } }) => (0, codegen_1.str)`should have property matching pattern '${missingPattern}'`,
      params: ({ params: { missingPattern } }) => (0, codegen_1._)`{missingPattern: ${missingPattern}}`
    };
    function getDef() {
      return {
        keyword: "patternRequired",
        type: "object",
        schemaType: "array",
        error,
        code(cxt) {
          const { gen, schema, data } = cxt;
          if (schema.length === 0)
            return;
          const valid = gen.let("valid", true);
          for (const pat of schema)
            validateProperties(pat);
          function validateProperties(pattern) {
            const matched = gen.let("matched", false);
            gen.forIn("key", data, (key) => {
              gen.assign(matched, (0, codegen_1._)`${(0, _util_1.usePattern)(cxt, pattern)}.test(${key})`);
              gen.if(matched, () => gen.break());
            });
            cxt.setParams({ missingPattern: pattern });
            gen.assign(valid, (0, codegen_1.and)(valid, matched));
            cxt.pass(valid);
          }
        },
        metaSchema: {
          type: "array",
          items: { type: "string", format: "regex" },
          uniqueItems: true
        }
      };
    }
    exports.default = getDef;
    module.exports = getDef;
  }
});

// ../node_modules/ajv-keywords/dist/keywords/patternRequired.js
var require_patternRequired2 = __commonJS({
  "../node_modules/ajv-keywords/dist/keywords/patternRequired.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var patternRequired_1 = __importDefault(require_patternRequired());
    var patternRequired = (ajv) => ajv.addKeyword((0, patternRequired_1.default)());
    exports.default = patternRequired;
    module.exports = patternRequired;
  }
});

// ../node_modules/ajv-keywords/dist/definitions/prohibited.js
var require_prohibited = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/prohibited.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getDef() {
      return {
        keyword: "prohibited",
        type: "object",
        schemaType: "array",
        macro: function(schema) {
          if (schema.length === 0)
            return true;
          if (schema.length === 1)
            return { not: { required: schema } };
          return { not: { anyOf: schema.map((p) => ({ required: [p] })) } };
        },
        metaSchema: {
          type: "array",
          items: { type: "string" }
        }
      };
    }
    exports.default = getDef;
    module.exports = getDef;
  }
});

// ../node_modules/ajv-keywords/dist/keywords/prohibited.js
var require_prohibited2 = __commonJS({
  "../node_modules/ajv-keywords/dist/keywords/prohibited.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var prohibited_1 = __importDefault(require_prohibited());
    var prohibited = (ajv) => ajv.addKeyword((0, prohibited_1.default)());
    exports.default = prohibited;
    module.exports = prohibited;
  }
});

// ../node_modules/ajv-keywords/dist/definitions/deepProperties.js
var require_deepProperties = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/deepProperties.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _util_1 = require_util2();
    function getDef(opts) {
      return {
        keyword: "deepProperties",
        type: "object",
        schemaType: "object",
        macro: function(schema) {
          const allOf = [];
          for (const pointer in schema)
            allOf.push(getSchema(pointer, schema[pointer]));
          return { allOf };
        },
        metaSchema: {
          type: "object",
          propertyNames: { type: "string", format: "json-pointer" },
          additionalProperties: (0, _util_1.metaSchemaRef)(opts)
        }
      };
    }
    exports.default = getDef;
    function getSchema(jsonPointer, schema) {
      const segments = jsonPointer.split("/");
      const rootSchema = {};
      let pointerSchema = rootSchema;
      for (let i = 1; i < segments.length; i++) {
        let segment = segments[i];
        const isLast = i === segments.length - 1;
        segment = unescapeJsonPointer(segment);
        const properties = pointerSchema.properties = {};
        let items;
        if (/[0-9]+/.test(segment)) {
          let count = +segment;
          items = pointerSchema.items = [];
          pointerSchema.type = ["object", "array"];
          while (count--)
            items.push({});
        } else {
          pointerSchema.type = "object";
        }
        pointerSchema = isLast ? schema : {};
        properties[segment] = pointerSchema;
        if (items)
          items.push(pointerSchema);
      }
      return rootSchema;
    }
    function unescapeJsonPointer(str) {
      return str.replace(/~1/g, "/").replace(/~0/g, "~");
    }
    module.exports = getDef;
  }
});

// ../node_modules/ajv-keywords/dist/keywords/deepProperties.js
var require_deepProperties2 = __commonJS({
  "../node_modules/ajv-keywords/dist/keywords/deepProperties.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var deepProperties_1 = __importDefault(require_deepProperties());
    var deepProperties = (ajv, opts) => ajv.addKeyword((0, deepProperties_1.default)(opts));
    exports.default = deepProperties;
    module.exports = deepProperties;
  }
});

// ../node_modules/ajv-keywords/dist/definitions/deepRequired.js
var require_deepRequired = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/deepRequired.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    function getDef() {
      return {
        keyword: "deepRequired",
        type: "object",
        schemaType: "array",
        code(ctx) {
          const { schema, data } = ctx;
          const props = schema.map((jp) => (0, codegen_1._)`(${getData(jp)}) === undefined`);
          ctx.fail((0, codegen_1.or)(...props));
          function getData(jsonPointer) {
            if (jsonPointer === "")
              throw new Error("empty JSON pointer not allowed");
            const segments = jsonPointer.split("/");
            let x = data;
            const xs = segments.map((s, i) => i ? x = (0, codegen_1._)`${x}${(0, codegen_1.getProperty)(unescapeJPSegment(s))}` : x);
            return (0, codegen_1.and)(...xs);
          }
        },
        metaSchema: {
          type: "array",
          items: { type: "string", format: "json-pointer" }
        }
      };
    }
    exports.default = getDef;
    function unescapeJPSegment(s) {
      return s.replace(/~1/g, "/").replace(/~0/g, "~");
    }
    module.exports = getDef;
  }
});

// ../node_modules/ajv-keywords/dist/keywords/deepRequired.js
var require_deepRequired2 = __commonJS({
  "../node_modules/ajv-keywords/dist/keywords/deepRequired.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var deepRequired_1 = __importDefault(require_deepRequired());
    var deepRequired = (ajv) => ajv.addKeyword((0, deepRequired_1.default)());
    exports.default = deepRequired;
    module.exports = deepRequired;
  }
});

// ../node_modules/ajv-keywords/dist/definitions/dynamicDefaults.js
var require_dynamicDefaults = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/dynamicDefaults.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var sequences = {};
    var DEFAULTS = {
      timestamp: () => () => Date.now(),
      datetime: () => () => (/* @__PURE__ */ new Date()).toISOString(),
      date: () => () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      time: () => () => (/* @__PURE__ */ new Date()).toISOString().slice(11),
      random: () => () => Math.random(),
      randomint: (args) => {
        var _a;
        const max = (_a = args === null || args === void 0 ? void 0 : args.max) !== null && _a !== void 0 ? _a : 2;
        return () => Math.floor(Math.random() * max);
      },
      seq: (args) => {
        var _a;
        const name = (_a = args === null || args === void 0 ? void 0 : args.name) !== null && _a !== void 0 ? _a : "";
        sequences[name] || (sequences[name] = 0);
        return () => sequences[name]++;
      }
    };
    var getDef = Object.assign(_getDef, { DEFAULTS });
    function _getDef() {
      return {
        keyword: "dynamicDefaults",
        type: "object",
        schemaType: ["string", "object"],
        modifying: true,
        valid: true,
        compile(schema, _parentSchema, it) {
          if (!it.opts.useDefaults || it.compositeRule)
            return () => true;
          const fs = {};
          for (const key in schema)
            fs[key] = getDefault(schema[key]);
          const empty = it.opts.useDefaults === "empty";
          return (data) => {
            for (const prop in schema) {
              if (data[prop] === void 0 || empty && (data[prop] === null || data[prop] === "")) {
                data[prop] = fs[prop]();
              }
            }
            return true;
          };
        },
        metaSchema: {
          type: "object",
          additionalProperties: {
            anyOf: [
              { type: "string" },
              {
                type: "object",
                additionalProperties: false,
                required: ["func", "args"],
                properties: {
                  func: { type: "string" },
                  args: { type: "object" }
                }
              }
            ]
          }
        }
      };
    }
    function getDefault(d) {
      return typeof d == "object" ? getObjDefault(d) : getStrDefault(d);
    }
    function getObjDefault({ func, args }) {
      const def = DEFAULTS[func];
      assertDefined(func, def);
      return def(args);
    }
    function getStrDefault(d = "") {
      const def = DEFAULTS[d];
      assertDefined(d, def);
      return def();
    }
    function assertDefined(name, def) {
      if (!def)
        throw new Error(`invalid "dynamicDefaults" keyword property value: ${name}`);
    }
    exports.default = getDef;
    module.exports = getDef;
  }
});

// ../node_modules/ajv-keywords/dist/keywords/dynamicDefaults.js
var require_dynamicDefaults2 = __commonJS({
  "../node_modules/ajv-keywords/dist/keywords/dynamicDefaults.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var dynamicDefaults_1 = __importDefault(require_dynamicDefaults());
    var dynamicDefaults = (ajv) => ajv.addKeyword((0, dynamicDefaults_1.default)());
    exports.default = dynamicDefaults;
    module.exports = dynamicDefaults;
  }
});

// ../node_modules/ajv-keywords/dist/definitions/select.js
var require_select = __commonJS({
  "../node_modules/ajv-keywords/dist/definitions/select.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var _util_1 = require_util2();
    var error = {
      message: ({ params: { schemaProp } }) => schemaProp ? (0, codegen_1.str)`should match case "${schemaProp}" schema` : (0, codegen_1.str)`should match default case schema`,
      params: ({ params: { schemaProp } }) => schemaProp ? (0, codegen_1._)`{failingCase: ${schemaProp}}` : (0, codegen_1._)`{failingDefault: true}`
    };
    function getDef(opts) {
      const metaSchema = (0, _util_1.metaSchemaRef)(opts);
      return [
        {
          keyword: "select",
          schemaType: ["string", "number", "boolean", "null"],
          $data: true,
          error,
          dependencies: ["selectCases"],
          code(cxt) {
            const { gen, schemaCode, parentSchema } = cxt;
            cxt.block$data(codegen_1.nil, () => {
              const valid = gen.let("valid", true);
              const schValid = gen.name("_valid");
              const value = gen.const("value", (0, codegen_1._)`${schemaCode} === null ? "null" : ${schemaCode}`);
              gen.if(false);
              for (const schemaProp in parentSchema.selectCases) {
                cxt.setParams({ schemaProp });
                gen.elseIf((0, codegen_1._)`"" + ${value} == ${schemaProp}`);
                const schCxt = cxt.subschema({ keyword: "selectCases", schemaProp }, schValid);
                cxt.mergeEvaluated(schCxt, codegen_1.Name);
                gen.assign(valid, schValid);
              }
              gen.else();
              if (parentSchema.selectDefault !== void 0) {
                cxt.setParams({ schemaProp: void 0 });
                const schCxt = cxt.subschema({ keyword: "selectDefault" }, schValid);
                cxt.mergeEvaluated(schCxt, codegen_1.Name);
                gen.assign(valid, schValid);
              }
              gen.endIf();
              cxt.pass(valid);
            });
          }
        },
        {
          keyword: "selectCases",
          dependencies: ["select"],
          metaSchema: {
            type: "object",
            additionalProperties: metaSchema
          }
        },
        {
          keyword: "selectDefault",
          dependencies: ["select", "selectCases"],
          metaSchema
        }
      ];
    }
    exports.default = getDef;
    module.exports = getDef;
  }
});

// ../node_modules/ajv-keywords/dist/keywords/select.js
var require_select2 = __commonJS({
  "../node_modules/ajv-keywords/dist/keywords/select.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var select_1 = __importDefault(require_select());
    var select = (ajv, opts) => {
      (0, select_1.default)(opts).forEach((d) => ajv.addKeyword(d));
      return ajv;
    };
    exports.default = select;
    module.exports = select;
  }
});

// ../node_modules/ajv-keywords/dist/keywords/index.js
var require_keywords = __commonJS({
  "../node_modules/ajv-keywords/dist/keywords/index.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var typeof_1 = __importDefault(require_typeof2());
    var instanceof_1 = __importDefault(require_instanceof2());
    var range_1 = __importDefault(require_range3());
    var exclusiveRange_1 = __importDefault(require_exclusiveRange2());
    var regexp_1 = __importDefault(require_regexp2());
    var transform_1 = __importDefault(require_transform2());
    var uniqueItemProperties_1 = __importDefault(require_uniqueItemProperties2());
    var allRequired_1 = __importDefault(require_allRequired2());
    var anyRequired_1 = __importDefault(require_anyRequired2());
    var oneRequired_1 = __importDefault(require_oneRequired2());
    var patternRequired_1 = __importDefault(require_patternRequired2());
    var prohibited_1 = __importDefault(require_prohibited2());
    var deepProperties_1 = __importDefault(require_deepProperties2());
    var deepRequired_1 = __importDefault(require_deepRequired2());
    var dynamicDefaults_1 = __importDefault(require_dynamicDefaults2());
    var select_1 = __importDefault(require_select2());
    var ajvKeywords = {
      typeof: typeof_1.default,
      instanceof: instanceof_1.default,
      range: range_1.default,
      exclusiveRange: exclusiveRange_1.default,
      regexp: regexp_1.default,
      transform: transform_1.default,
      uniqueItemProperties: uniqueItemProperties_1.default,
      allRequired: allRequired_1.default,
      anyRequired: anyRequired_1.default,
      oneRequired: oneRequired_1.default,
      patternRequired: patternRequired_1.default,
      prohibited: prohibited_1.default,
      deepProperties: deepProperties_1.default,
      deepRequired: deepRequired_1.default,
      dynamicDefaults: dynamicDefaults_1.default,
      select: select_1.default
    };
    exports.default = ajvKeywords;
    module.exports = ajvKeywords;
  }
});

// ../node_modules/ajv-keywords/dist/index.js
var require_dist = __commonJS({
  "../node_modules/ajv-keywords/dist/index.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var keywords_1 = __importDefault(require_keywords());
    var ajvKeywords = (ajv, keyword) => {
      if (Array.isArray(keyword)) {
        for (const k of keyword)
          get(k)(ajv);
        return ajv;
      }
      if (keyword) {
        get(keyword)(ajv);
        return ajv;
      }
      for (keyword in keywords_1.default)
        get(keyword)(ajv);
      return ajv;
    };
    ajvKeywords.get = get;
    function get(keyword) {
      const defFunc = keywords_1.default[keyword];
      if (!defFunc)
        throw new Error("Unknown keyword " + keyword);
      return defFunc;
    }
    exports.default = ajvKeywords;
    module.exports = ajvKeywords;
    module.exports.default = ajvKeywords;
  }
});

// ../node_modules/ajv-formats/dist/formats.js
var require_formats = __commonJS({
  "../node_modules/ajv-formats/dist/formats.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.formatNames = exports.fastFormats = exports.fullFormats = void 0;
    function fmtDef(validate, compare) {
      return { validate, compare };
    }
    exports.fullFormats = {
      // date: http://tools.ietf.org/html/rfc3339#section-5.6
      date: fmtDef(date, compareDate),
      // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
      time: fmtDef(getTime(true), compareTime),
      "date-time": fmtDef(getDateTime(true), compareDateTime),
      "iso-time": fmtDef(getTime(), compareIsoTime),
      "iso-date-time": fmtDef(getDateTime(), compareIsoDateTime),
      // duration: https://tools.ietf.org/html/rfc3339#appendix-A
      duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
      uri,
      "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
      // uri-template: https://tools.ietf.org/html/rfc6570
      "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
      // For the source: https://gist.github.com/dperini/729294
      // For test cases: https://mathiasbynens.be/demo/url-regex
      url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
      email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
      hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
      // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
      ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
      ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
      regex,
      // uuid: http://tools.ietf.org/html/rfc4122
      uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
      // JSON-pointer: https://tools.ietf.org/html/rfc6901
      // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
      "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
      "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
      // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
      "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
      // the following formats are used by the openapi specification: https://spec.openapis.org/oas/v3.0.0#data-types
      // byte: https://github.com/miguelmota/is-base64
      byte,
      // signed 32 bit integer
      int32: { type: "number", validate: validateInt32 },
      // signed 64 bit integer
      int64: { type: "number", validate: validateInt64 },
      // C-type float
      float: { type: "number", validate: validateNumber },
      // C-type double
      double: { type: "number", validate: validateNumber },
      // hint to the UI to hide input strings
      password: true,
      // unchecked string payload
      binary: true
    };
    exports.fastFormats = {
      ...exports.fullFormats,
      date: fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, compareDate),
      time: fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareTime),
      "date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareDateTime),
      "iso-time": fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoTime),
      "iso-date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoDateTime),
      // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
      uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
      "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
      // email (sources from jsen validator):
      // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
      // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'wilful violation')
      email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
    };
    exports.formatNames = Object.keys(exports.fullFormats);
    function isLeapYear(year) {
      return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }
    var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
    var DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function date(str) {
      const matches = DATE.exec(str);
      if (!matches)
        return false;
      const year = +matches[1];
      const month = +matches[2];
      const day = +matches[3];
      return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
    }
    function compareDate(d1, d2) {
      if (!(d1 && d2))
        return void 0;
      if (d1 > d2)
        return 1;
      if (d1 < d2)
        return -1;
      return 0;
    }
    var TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
    function getTime(strictTimeZone) {
      return function time(str) {
        const matches = TIME.exec(str);
        if (!matches)
          return false;
        const hr = +matches[1];
        const min = +matches[2];
        const sec = +matches[3];
        const tz = matches[4];
        const tzSign = matches[5] === "-" ? -1 : 1;
        const tzH = +(matches[6] || 0);
        const tzM = +(matches[7] || 0);
        if (tzH > 23 || tzM > 59 || strictTimeZone && !tz)
          return false;
        if (hr <= 23 && min <= 59 && sec < 60)
          return true;
        const utcMin = min - tzM * tzSign;
        const utcHr = hr - tzH * tzSign - (utcMin < 0 ? 1 : 0);
        return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61;
      };
    }
    function compareTime(s1, s2) {
      if (!(s1 && s2))
        return void 0;
      const t1 = (/* @__PURE__ */ new Date("2020-01-01T" + s1)).valueOf();
      const t2 = (/* @__PURE__ */ new Date("2020-01-01T" + s2)).valueOf();
      if (!(t1 && t2))
        return void 0;
      return t1 - t2;
    }
    function compareIsoTime(t1, t2) {
      if (!(t1 && t2))
        return void 0;
      const a1 = TIME.exec(t1);
      const a2 = TIME.exec(t2);
      if (!(a1 && a2))
        return void 0;
      t1 = a1[1] + a1[2] + a1[3];
      t2 = a2[1] + a2[2] + a2[3];
      if (t1 > t2)
        return 1;
      if (t1 < t2)
        return -1;
      return 0;
    }
    var DATE_TIME_SEPARATOR = /t|\s/i;
    function getDateTime(strictTimeZone) {
      const time = getTime(strictTimeZone);
      return function date_time(str) {
        const dateTime = str.split(DATE_TIME_SEPARATOR);
        return dateTime.length === 2 && date(dateTime[0]) && time(dateTime[1]);
      };
    }
    function compareDateTime(dt1, dt2) {
      if (!(dt1 && dt2))
        return void 0;
      const d1 = new Date(dt1).valueOf();
      const d2 = new Date(dt2).valueOf();
      if (!(d1 && d2))
        return void 0;
      return d1 - d2;
    }
    function compareIsoDateTime(dt1, dt2) {
      if (!(dt1 && dt2))
        return void 0;
      const [d1, t1] = dt1.split(DATE_TIME_SEPARATOR);
      const [d2, t2] = dt2.split(DATE_TIME_SEPARATOR);
      const res = compareDate(d1, d2);
      if (res === void 0)
        return void 0;
      return res || compareTime(t1, t2);
    }
    var NOT_URI_FRAGMENT = /\/|:/;
    var URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    function uri(str) {
      return NOT_URI_FRAGMENT.test(str) && URI.test(str);
    }
    var BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
    function byte(str) {
      BYTE.lastIndex = 0;
      return BYTE.test(str);
    }
    var MIN_INT32 = -(2 ** 31);
    var MAX_INT32 = 2 ** 31 - 1;
    function validateInt32(value) {
      return Number.isInteger(value) && value <= MAX_INT32 && value >= MIN_INT32;
    }
    function validateInt64(value) {
      return Number.isInteger(value);
    }
    function validateNumber() {
      return true;
    }
    var Z_ANCHOR = /[^\\]\\Z/;
    function regex(str) {
      if (Z_ANCHOR.test(str))
        return false;
      try {
        new RegExp(str);
        return true;
      } catch (e) {
        return false;
      }
    }
  }
});

// ../node_modules/ajv-formats/dist/limit.js
var require_limit = __commonJS({
  "../node_modules/ajv-formats/dist/limit.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.formatLimitDefinition = void 0;
    var ajv_1 = require_ajv();
    var codegen_1 = require_codegen();
    var ops = codegen_1.operators;
    var KWDs = {
      formatMaximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
      formatMinimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
      formatExclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
      formatExclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
    };
    var error = {
      message: ({ keyword, schemaCode }) => (0, codegen_1.str)`should be ${KWDs[keyword].okStr} ${schemaCode}`,
      params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
    };
    exports.formatLimitDefinition = {
      keyword: Object.keys(KWDs),
      type: "string",
      schemaType: "string",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, schemaCode, keyword, it } = cxt;
        const { opts, self } = it;
        if (!opts.validateFormats)
          return;
        const fCxt = new ajv_1.KeywordCxt(it, self.RULES.all.format.definition, "format");
        if (fCxt.$data)
          validate$DataFormat();
        else
          validateFormat();
        function validate$DataFormat() {
          const fmts = gen.scopeValue("formats", {
            ref: self.formats,
            code: opts.code.formats
          });
          const fmt = gen.const("fmt", (0, codegen_1._)`${fmts}[${fCxt.schemaCode}]`);
          cxt.fail$data((0, codegen_1.or)((0, codegen_1._)`typeof ${fmt} != "object"`, (0, codegen_1._)`${fmt} instanceof RegExp`, (0, codegen_1._)`typeof ${fmt}.compare != "function"`, compareCode(fmt)));
        }
        function validateFormat() {
          const format = fCxt.schema;
          const fmtDef = self.formats[format];
          if (!fmtDef || fmtDef === true)
            return;
          if (typeof fmtDef != "object" || fmtDef instanceof RegExp || typeof fmtDef.compare != "function") {
            throw new Error(`"${keyword}": format "${format}" does not define "compare" function`);
          }
          const fmt = gen.scopeValue("formats", {
            key: format,
            ref: fmtDef,
            code: opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(format)}` : void 0
          });
          cxt.fail$data(compareCode(fmt));
        }
        function compareCode(fmt) {
          return (0, codegen_1._)`${fmt}.compare(${data}, ${schemaCode}) ${KWDs[keyword].fail} 0`;
        }
      },
      dependencies: ["format"]
    };
    var formatLimitPlugin = (ajv) => {
      ajv.addKeyword(exports.formatLimitDefinition);
      return ajv;
    };
    exports.default = formatLimitPlugin;
  }
});

// ../node_modules/ajv-formats/dist/index.js
var require_dist2 = __commonJS({
  "../node_modules/ajv-formats/dist/index.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var formats_1 = require_formats();
    var limit_1 = require_limit();
    var codegen_1 = require_codegen();
    var fullName = new codegen_1.Name("fullFormats");
    var fastName = new codegen_1.Name("fastFormats");
    var formatsPlugin = (ajv, opts = { keywords: true }) => {
      if (Array.isArray(opts)) {
        addFormats(ajv, opts, formats_1.fullFormats, fullName);
        return ajv;
      }
      const [formats, exportName] = opts.mode === "fast" ? [formats_1.fastFormats, fastName] : [formats_1.fullFormats, fullName];
      const list = opts.formats || formats_1.formatNames;
      addFormats(ajv, list, formats, exportName);
      if (opts.keywords)
        (0, limit_1.default)(ajv);
      return ajv;
    };
    formatsPlugin.get = (name, mode = "full") => {
      const formats = mode === "fast" ? formats_1.fastFormats : formats_1.fullFormats;
      const f = formats[name];
      if (!f)
        throw new Error(`Unknown format "${name}"`);
      return f;
    };
    function addFormats(ajv, list, fs, exportName) {
      var _a;
      var _b;
      (_a = (_b = ajv.opts.code).formats) !== null && _a !== void 0 ? _a : _b.formats = (0, codegen_1._)`require("ajv-formats/dist/formats").${exportName}`;
      for (const f of list)
        ajv.addFormat(f, fs[f]);
    }
    module.exports = exports = formatsPlugin;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = formatsPlugin;
  }
});

// ../node_modules/schema-utils/dist/keywords/absolutePath.js
var require_absolutePath = __commonJS({
  "../node_modules/schema-utils/dist/keywords/absolutePath.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    function errorMessage(message, schema, data) {
      return {
        dataPath: void 0,
        // @ts-expect-error
        schemaPath: void 0,
        keyword: "absolutePath",
        params: {
          absolutePath: data
        },
        message,
        parentSchema: schema
      };
    }
    function getErrorFor(shouldBeAbsolute, schema, data) {
      const message = shouldBeAbsolute ? `The provided value ${JSON.stringify(data)} is not an absolute path!` : `A relative path is expected. However, the provided value ${JSON.stringify(data)} is an absolute path!`;
      return errorMessage(message, schema, data);
    }
    function addAbsolutePathKeyword(ajv) {
      ajv.addKeyword({
        keyword: "absolutePath",
        type: "string",
        errors: true,
        /**
         * @param {boolean} schema schema
         * @param {AnySchemaObject} parentSchema parent schema
         * @returns {SchemaValidateFunction} validate function
         */
        compile(schema, parentSchema) {
          const callback = (data) => {
            let passes = true;
            const isExclamationMarkPresent = data.includes("!");
            if (isExclamationMarkPresent) {
              callback.errors = [errorMessage(`The provided value ${JSON.stringify(data)} contains exclamation mark (!) which is not allowed because it's reserved for loader syntax.`, parentSchema, data)];
              passes = false;
            }
            const isCorrectAbsolutePath = schema === /^(?:file:(?=\/))?(?:[A-Za-z]:(\\|\/)|\\\\|\/)/i.test(data);
            if (!isCorrectAbsolutePath) {
              callback.errors = [getErrorFor(schema, parentSchema, data)];
              passes = false;
            }
            return passes;
          };
          callback.errors = [];
          return callback;
        }
      });
      return ajv;
    }
    var _default = exports.default = addAbsolutePathKeyword;
  }
});

// ../node_modules/schema-utils/dist/keywords/limit.js
var require_limit2 = __commonJS({
  "../node_modules/schema-utils/dist/keywords/limit.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    function addLimitKeyword(ajv) {
      const {
        KeywordCxt,
        Name,
        _,
        nil,
        str
      } = require_ajv();
      function par(nameOrCode) {
        return nameOrCode instanceof Name ? nameOrCode : _`(${nameOrCode})`;
      }
      function mappend(op) {
        return (xValue, yValue) => xValue === nil ? yValue : yValue === nil ? xValue : _`${par(xValue)} ${op} ${par(yValue)}`;
      }
      const orCode = mappend(_`||`);
      function or(...args) {
        return args.reduce(orCode);
      }
      function getProperty(key) {
        return _`[${key}]`;
      }
      const keywords = {
        formatMaximum: {
          okStr: "<=",
          ok: _`<=`,
          fail: _`>`
        },
        formatMinimum: {
          okStr: ">=",
          ok: _`>=`,
          fail: _`<`
        },
        formatExclusiveMaximum: {
          okStr: "<",
          ok: _`<`,
          fail: _`>=`
        },
        formatExclusiveMinimum: {
          okStr: ">",
          ok: _`>`,
          fail: _`<=`
        }
      };
      const error = {
        message: ({
          keyword,
          schemaCode
        }) => str`should be ${keywords[
          /** @type {keyof typeof keywords} */
          keyword
        ].okStr} ${schemaCode}`,
        params: ({
          keyword,
          schemaCode
        }) => _`{comparison: ${keywords[
          /** @type {keyof typeof keywords} */
          keyword
        ].okStr}, limit: ${schemaCode}}`
      };
      for (const keyword of Object.keys(keywords)) {
        ajv.addKeyword({
          keyword,
          type: "string",
          schemaType: keyword.startsWith("formatExclusive") ? ["string", "boolean"] : ["string", "number"],
          $data: true,
          error,
          code(cxt) {
            const {
              gen,
              data,
              schemaCode,
              keyword: keyword2,
              it
            } = cxt;
            const {
              opts,
              self
            } = it;
            if (!opts.validateFormats) return;
            const fCxt = new KeywordCxt(
              it,
              // eslint-disable-next-line jsdoc/reject-any-type
              /** @type {any} */
              self.RULES.all.format.definition,
              "format"
            );
            function compareCode(fmt) {
              return _`${fmt}.compare(${data}, ${schemaCode}) ${keywords[
                /** @type {keyof typeof keywords} */
                keyword2
              ].fail} 0`;
            }
            function validate$DataFormat() {
              const fmts = gen.scopeValue("formats", {
                ref: self.formats,
                code: opts.code.formats
              });
              const fmt = gen.const("fmt", _`${fmts}[${fCxt.schemaCode}]`);
              cxt.fail$data(or(_`typeof ${fmt} != "object"`, _`${fmt} instanceof RegExp`, _`typeof ${fmt}.compare != "function"`, compareCode(fmt)));
            }
            function validateFormat() {
              const format = fCxt.schema;
              const fmtDef = self.formats[format];
              if (!fmtDef || fmtDef === true) {
                return;
              }
              if (typeof fmtDef !== "object" || fmtDef instanceof RegExp || typeof fmtDef.compare !== "function") {
                throw new Error(`"${keyword2}": format "${format}" does not define "compare" function`);
              }
              const fmt = gen.scopeValue("formats", {
                key: format,
                ref: fmtDef,
                code: opts.code.formats ? _`${opts.code.formats}${getProperty(format)}` : void 0
              });
              cxt.fail$data(compareCode(fmt));
            }
            if (fCxt.$data) {
              validate$DataFormat();
            } else {
              validateFormat();
            }
          },
          dependencies: ["format"]
        });
      }
      return ajv;
    }
    var _default = exports.default = addLimitKeyword;
  }
});

// ../node_modules/schema-utils/dist/keywords/undefinedAsNull.js
var require_undefinedAsNull = __commonJS({
  "../node_modules/schema-utils/dist/keywords/undefinedAsNull.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    function addUndefinedAsNullKeyword(ajv) {
      ajv.addKeyword({
        keyword: "undefinedAsNull",
        before: "enum",
        modifying: true,
        /** @type {SchemaValidateFunction} */
        validate(kwVal, data, metadata, dataCxt) {
          if (kwVal && dataCxt && metadata && typeof metadata.enum !== "undefined") {
            const idx = dataCxt.parentDataProperty;
            if (typeof dataCxt.parentData[idx] === "undefined") {
              dataCxt.parentData[dataCxt.parentDataProperty] = null;
            }
          }
          return true;
        }
      });
      return ajv;
    }
    var _default = exports.default = addUndefinedAsNullKeyword;
  }
});

// ../node_modules/schema-utils/dist/validate.js
var require_validate2 = __commonJS({
  "../node_modules/schema-utils/dist/validate.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "ValidationError", {
      enumerable: true,
      get: function() {
        return _ValidationError.default;
      }
    });
    exports.disableValidation = disableValidation;
    exports.enableValidation = enableValidation;
    exports.needValidate = needValidate;
    exports.validate = validate;
    var _ValidationError = _interopRequireDefault(require_ValidationError());
    var _memorize = _interopRequireDefault(require_memorize());
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : { default: e };
    }
    var getAjv = (0, _memorize.default)(() => {
      const Ajv = require_ajv().default;
      const ajvKeywords = require_dist().default;
      const addFormats = require_dist2().default;
      const ajv = new Ajv({
        strict: false,
        allErrors: true,
        verbose: true,
        $data: true
      });
      ajvKeywords(ajv, ["instanceof", "patternRequired"]);
      addFormats(ajv, {
        keywords: false
      });
      const addAbsolutePathKeyword = require_absolutePath().default;
      addAbsolutePathKeyword(ajv);
      const addLimitKeyword = require_limit2().default;
      addLimitKeyword(ajv);
      const addUndefinedAsNullKeyword = require_undefinedAsNull().default;
      addUndefinedAsNullKeyword(ajv);
      return ajv;
    });
    function applyPrefix(error, idx) {
      error.instancePath = `[${idx}]${error.instancePath}`;
      if (error.children) {
        for (const err of error.children) applyPrefix(err, idx);
      }
      return error;
    }
    var IS_TRUTHY = /^(?:y|yes|true|1|on)$/i;
    var IS_FALSY = /^(?:n|no|false|0|off)$/i;
    function skipValidationFromEnv() {
      const value = process && process.env ? process.env.SKIP_VALIDATION : void 0;
      if (value) {
        const trimmedValue = value.trim();
        if (IS_TRUTHY.test(trimmedValue)) {
          return true;
        }
        if (IS_FALSY.test(trimmedValue)) {
          return false;
        }
      }
      return false;
    }
    var SKIP_VALIDATION_KEY = /* @__PURE__ */ Symbol.for("schema-utils/skipValidation");
    var globalObject = (
      /** @type {Record<symbol, SkipValidationState | undefined>} */
      /** @type {unknown} */
      // eslint-disable-next-line no-undef
      typeof globalThis === "undefined" ? global : globalThis
    );
    var sharedState = globalObject[SKIP_VALIDATION_KEY] || (globalObject[SKIP_VALIDATION_KEY] = {
      skip: false
    });
    sharedState.skip = skipValidationFromEnv();
    function enableValidation() {
      sharedState.skip = false;
      if (process && process.env) {
        process.env.SKIP_VALIDATION = "n";
      }
    }
    function disableValidation() {
      sharedState.skip = true;
      if (process && process.env) {
        process.env.SKIP_VALIDATION = "y";
      }
    }
    function needValidate() {
      return !sharedState.skip;
    }
    function createErrorPathNode() {
      return {
        indexes: [],
        children: void 0,
        size: 0
      };
    }
    function parseInstancePath(instancePath) {
      return instancePath === "" ? [] : instancePath.slice(1).split("/");
    }
    function compareNumbers(a, b) {
      return a - b;
    }
    function replaceErrorPath(root, segments, index) {
      const ancestors = [];
      const indexes = [];
      let node = root;
      let depth = 0;
      for (const segment of segments) {
        ancestors[depth] = node;
        depth += 1;
        let {
          children
        } = node;
        if (!children) {
          children = /* @__PURE__ */ new Map();
          node.children = children;
        }
        let child = children.get(segment);
        if (!child) {
          child = createErrorPathNode();
          children.set(segment, child);
        }
        node = child;
      }
      if (node.size > 0) {
        const stack = [node];
        while (stack.length > 0) {
          const current = (
            /** @type {ErrorPathNode} */
            stack.pop()
          );
          for (const collected of current.indexes) {
            indexes.push(collected);
          }
          if (current.children) {
            for (const child of current.children.values()) {
              stack.push(child);
            }
          }
        }
        node.children = void 0;
        indexes.sort(compareNumbers);
      }
      node.indexes = [index];
      const delta = 1 - node.size;
      node.size = 1;
      for (let i = 0; i < depth; i++) {
        ancestors[i].size += delta;
      }
      return indexes;
    }
    function absorbError(children, oldError) {
      let newChildren = children;
      if (oldError.children) {
        if (newChildren.length === 0) {
          newChildren = oldError.children;
        } else {
          for (const child of oldError.children) {
            newChildren.push(child);
          }
        }
      }
      oldError.children = void 0;
      newChildren.push(oldError);
      return newChildren;
    }
    function isAtOrBelow(instancePath, ancestorPath) {
      if (instancePath.length === ancestorPath.length) {
        return instancePath === ancestorPath;
      }
      return instancePath.length > ancestorPath.length && // the next character has to be a separator, otherwise it is a sibling with a longer name
      instancePath.charCodeAt(ancestorPath.length) === 47 && instancePath.startsWith(ancestorPath);
    }
    var MAX_SCANNED_ERRORS = 24;
    function scanErrors(errors) {
      const newErrors = [];
      for (const error of errors) {
        const {
          instancePath
        } = error;
        let children = [];
        let kept = 0;
        for (let i = 0; i < newErrors.length; i++) {
          const oldError = newErrors[i];
          if (!isAtOrBelow(oldError.instancePath, instancePath)) {
            newErrors[kept] = oldError;
            kept += 1;
            continue;
          }
          children = absorbError(children, oldError);
        }
        newErrors.length = kept;
        if (children.length) {
          error.children = children;
        }
        newErrors.push(error);
      }
      return newErrors;
    }
    function filterErrors(errors) {
      if (errors.length <= MAX_SCANNED_ERRORS) {
        return scanErrors(
          /** @type {SchemaUtilErrorObject[]} */
          errors
        );
      }
      const newErrors = [];
      const root = createErrorPathNode();
      let lastInstancePath;
      let segments = [];
      for (
        const error of
        /** @type {SchemaUtilErrorObject[]} */
        errors
      ) {
        const {
          instancePath
        } = error;
        if (instancePath !== lastInstancePath) {
          lastInstancePath = instancePath;
          segments = parseInstancePath(instancePath);
        }
        let children = [];
        for (const index of replaceErrorPath(root, segments, newErrors.length)) {
          const oldError = (
            /** @type {SchemaUtilErrorObject} */
            newErrors[index]
          );
          newErrors[index] = void 0;
          children = absorbError(children, oldError);
        }
        if (children.length) {
          error.children = children;
        }
        newErrors.push(error);
      }
      return (
        /** @type {SchemaUtilErrorObject[]} */
        newErrors.filter((error) => typeof error !== "undefined")
      );
    }
    function validateObject(schema, options) {
      const compiledSchema = getAjv().compile(schema);
      const valid = compiledSchema(options);
      if (valid) return [];
      return compiledSchema.errors ? filterErrors(compiledSchema.errors) : [];
    }
    function validate(schema, options, configuration, check) {
      if (!needValidate()) {
        return;
      }
      if (check && (Array.isArray(options) ? options.every((item) => check(item)) : check(options))) {
        return;
      }
      let errors = [];
      if (Array.isArray(options)) {
        for (let i = 0; i <= options.length - 1; i++) {
          for (const error of validateObject(schema, options[i])) {
            errors.push(applyPrefix(error, i));
          }
        }
      } else {
        errors = validateObject(schema, options);
      }
      if (errors.length > 0) {
        throw new _ValidationError.default(errors, schema, configuration);
      }
    }
  }
});

// ../node_modules/ajv/dist/standalone/index.js
var require_standalone = __commonJS({
  "../node_modules/ajv/dist/standalone/index.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var scope_1 = require_scope();
    var code_1 = require_code();
    function standaloneCode(ajv, refsOrFunc) {
      if (!ajv.opts.code.source) {
        throw new Error("moduleCode: ajv instance must have code.source option");
      }
      const { _n } = ajv.scope.opts;
      return typeof refsOrFunc == "function" ? funcExportCode(refsOrFunc.source) : refsOrFunc !== void 0 ? multiExportsCode(refsOrFunc, getValidate) : multiExportsCode(ajv.schemas, (sch) => sch.meta ? void 0 : ajv.compile(sch.schema));
      function getValidate(id) {
        const v = ajv.getSchema(id);
        if (!v)
          throw new Error(`moduleCode: no schema with id ${id}`);
        return v;
      }
      function funcExportCode(source) {
        const usedValues = {};
        const n = source === null || source === void 0 ? void 0 : source.validateName;
        const vCode = validateCode(usedValues, source);
        if (ajv.opts.code.esm) {
          return `"use strict";${_n}export const validate = ${n};${_n}export default ${n};${_n}${vCode}`;
        }
        return `"use strict";${_n}module.exports = ${n};${_n}module.exports.default = ${n};${_n}${vCode}`;
      }
      function multiExportsCode(schemas, getValidateFunc) {
        var _a;
        const usedValues = {};
        let code = (0, code_1._)`"use strict";`;
        for (const name in schemas) {
          const v = getValidateFunc(schemas[name]);
          if (v) {
            const vCode = validateCode(usedValues, v.source);
            const exportSyntax = ajv.opts.code.esm ? (0, code_1._)`export const ${(0, code_1.getEsmExportName)(name)}` : (0, code_1._)`exports${(0, code_1.getProperty)(name)}`;
            code = (0, code_1._)`${code}${_n}${exportSyntax} = ${(_a = v.source) === null || _a === void 0 ? void 0 : _a.validateName};${_n}${vCode}`;
          }
        }
        return `${code}`;
      }
      function validateCode(usedValues, s) {
        if (!s)
          throw new Error('moduleCode: function does not have "source" property');
        if (usedState(s.validateName) === scope_1.UsedValueState.Completed)
          return code_1.nil;
        setUsedState(s.validateName, scope_1.UsedValueState.Started);
        const scopeCode = ajv.scope.scopeCode(s.scopeValues, usedValues, refValidateCode);
        const code = new code_1._Code(`${scopeCode}${_n}${s.validateCode}`);
        return s.evaluated ? (0, code_1._)`${code}${s.validateName}.evaluated = ${s.evaluated};${_n}` : code;
        function refValidateCode(n) {
          var _a;
          const vRef = (_a = n.value) === null || _a === void 0 ? void 0 : _a.ref;
          if (n.prefix === "validate" && typeof vRef == "function") {
            const v = vRef;
            return validateCode(usedValues, v.source);
          } else if ((n.prefix === "root" || n.prefix === "wrapper") && typeof vRef == "object") {
            const { validate, validateName } = vRef;
            if (!validateName)
              throw new Error("ajv internal error");
            const def = ajv.opts.code.es5 ? scope_1.varKinds.var : scope_1.varKinds.const;
            const wrapper = (0, code_1._)`${def} ${n} = {validate: ${validateName}};`;
            if (usedState(validateName) === scope_1.UsedValueState.Started)
              return wrapper;
            const vCode = validateCode(usedValues, validate === null || validate === void 0 ? void 0 : validate.source);
            return (0, code_1._)`${wrapper}${_n}${vCode}`;
          }
          return void 0;
        }
        function usedState(name) {
          var _a;
          return (_a = usedValues[name.prefix]) === null || _a === void 0 ? void 0 : _a.get(name);
        }
        function setUsedState(name, state) {
          const { prefix } = name;
          const names = usedValues[prefix] = usedValues[prefix] || /* @__PURE__ */ new Map();
          names.set(name, state);
        }
      }
    }
    module.exports = exports = standaloneCode;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = standaloneCode;
  }
});

// ../node_modules/schema-utils/dist/precompile.js
var require_precompile = __commonJS({
  "../node_modules/schema-utils/dist/precompile.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;
    var RUNTIME = "schema-utils/dist/runtime";
    var RUNTIME_BINDING = "schemaUtilsRuntime";
    var RUNTIME_MODULE = `${RUNTIME}.js`;
    function addKeywords(ajv, hoist) {
      const {
        Name,
        _
      } = require_ajv();
      const CONSTRUCTORS = ["Object", "Array", "Function", "Number", "String", "Date", "RegExp", "Buffer", "Promise"];
      ajv.addKeyword({
        keyword: "instanceof",
        schemaType: ["string", "array"],
        /**
         * @param {KeywordCxt} cxt context
         */
        code(cxt) {
          const {
            data,
            schema
          } = cxt;
          const names = Array.isArray(schema) ? schema : [schema];
          for (const name of names) {
            if (!CONSTRUCTORS.includes(name)) {
              throw new Error(`invalid "instanceof" keyword value ${name}`);
            }
          }
          cxt.fail(names.map((name) => _`!(${data} instanceof ${new Name(name)})`).reduce((a, b) => _`${a} && ${b}`));
        }
      });
      ajv.addKeyword({
        keyword: "absolutePath",
        type: "string",
        schemaType: "boolean",
        /**
         * @param {KeywordCxt} cxt context
         */
        code(cxt) {
          const {
            data,
            gen,
            schema
          } = cxt;
          const absolutePathRegExp = hoist ? gen.scopeValue("pattern", {
            key: "absolutePath",
            ref: /^(?:file:(?=\/))?(?:[A-Za-z]:(\\|\/)|\\\\|\/)/i,
            code: _`/^(?:file:(?=\\/))?(?:[A-Za-z]:(\\\\|\\/)|\\\\\\\\|\\/)/i`
          }) : _`/^(?:file:(?=\\/))?(?:[A-Za-z]:(\\\\|\\/)|\\\\\\\\|\\/)/i`;
          cxt.fail(_`${data}.includes("!") || ${absolutePathRegExp}.test(${data}) !== ${schema}`);
        }
      });
      ajv.addKeyword({
        keyword: "undefinedAsNull",
        before: "enum",
        modifying: true,
        /**
         * @param {KeywordCxt} cxt context
         */
        code(cxt) {
          const {
            gen,
            data,
            schema,
            parentSchema,
            it
          } = cxt;
          if (!schema || typeof parentSchema.enum === "undefined" || it.parentData === void 0 || it.parentDataProperty === void 0) {
            return;
          }
          const condition = it.dataLevel === 0 ? _`${data} === undefined && ${it.parentData} !== undefined` : _`${data} === undefined`;
          gen.if(condition, () => {
            gen.assign(_`${/** @type {import("ajv").Name} */
            it.parentData}[${it.parentDataProperty}]`, null);
            gen.assign(data, null);
          });
        }
      });
    }
    var INLINE_HELPERS = {
      equal: () => require_equal().default,
      ucs2length: () => require_ucs2length().default
    };
    function useRuntime(code, esm, inline) {
      return code.replace(/require\("ajv\/dist\/runtime\/(\w+)"\)\.default/g, (match, name) => {
        if (!["equal", "ucs2length", "uri"].includes(name)) {
          throw new Error(`Unsupported "ajv" runtime helper "${name}"`);
        }
        if (inline && name !== "uri") {
          return `(${INLINE_HELPERS[
            /** @type {"equal" | "ucs2length"} */
            name
          ]().toString()})`;
        }
        return esm ? `${RUNTIME_BINDING}.${name}` : `require(${JSON.stringify(RUNTIME)}).${name}`;
      });
    }
    var SCHEMA_KEYWORDS = ["additionalItems", "additionalProperties", "contains", "else", "if", "items", "not", "propertyNames", "then"];
    var SCHEMA_ARRAY_KEYWORDS = ["allOf", "anyOf", "items", "oneOf"];
    var SCHEMA_MAP_KEYWORDS = ["$defs", "definitions", "dependencies", "patternProperties", "properties"];
    var STRUCTURE_KEYWORDS = ["$id", "$schema", "$defs", "definitions"];
    function stripAnnotations(schema, keywords) {
      if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
        return schema;
      }
      const result = {};
      for (const key of Object.keys(schema)) {
        if (!keywords.has(key)) continue;
        const value = schema[key];
        if (SCHEMA_ARRAY_KEYWORDS.includes(key) && Array.isArray(value)) {
          result[key] = value.map((item) => stripAnnotations(item, keywords));
        } else if (SCHEMA_KEYWORDS.includes(key)) {
          result[key] = stripAnnotations(value, keywords);
        } else if (SCHEMA_MAP_KEYWORDS.includes(key) && value && typeof value === "object") {
          const map = {};
          for (const name of Object.keys(value)) {
            map[name] = Array.isArray(value[name]) ? value[name] : stripAnnotations(value[name], keywords);
          }
          result[key] = map;
        } else {
          result[key] = value;
        }
      }
      return result;
    }
    async function loadFileSchema(uri) {
      if (!uri.startsWith("file:")) {
        throw new Error(`Cannot load the schema "${uri}", pass a \`loadSchema\` option to load it`);
      }
      const {
        readFileSync
      } = __require("fs");
      const {
        fileURLToPath
      } = __require("url");
      return JSON.parse(readFileSync(fileURLToPath(uri), "utf8"));
    }
    async function minify(code, esm) {
      let minifier;
      const nodeRequire = typeof __non_webpack_require__ === "function" ? __non_webpack_require__ : void 0;
      const self = module;
      try {
        minifier = await (nodeRequire || self.require.bind(self))("webpack").javascript.syntax.printer.load();
      } catch (err) {
        throw new Error("Install webpack 5.112.0 or later to minify a precompiled check", {
          cause: err
        });
      }
      const stripped = code.replace(/(=\s*\[?)\{instancePath(?::instancePath\b[^{}]*?)?,schemaPath:"(?:[^"\\]|\\.)*",keyword:"\w+",/g, "$1{");
      const result = await minifier.minify(stripped, {
        compress: {
          passes: 3
        },
        mangle: true,
        ecma: 2015,
        module: esm,
        toplevel: true
      });
      return (
        /** @type {string} */
        result.code
      );
    }
    async function precompile(schema, options = {}) {
      const Ajv = require_ajv().default;
      const standaloneCode = require_standalone().default;
      const ajvKeywords = require_dist().default;
      const addFormats = require_dist2().default;
      const {
        Name,
        _
      } = require_ajv();
      const esm = Boolean(options.esm);
      const ajv = new Ajv({
        strict: false,
        $data: true,
        messages: false,
        code: {
          source: true,
          optimize: true,
          esm,
          formats: esm ? _`${new Name(RUNTIME_BINDING)}.formats` : _`require(${RUNTIME}).formats`
        }
      });
      ajvKeywords(ajv, ["patternRequired"]);
      addFormats(ajv, {
        keywords: false
      });
      const addLimitKeyword = require_limit2().default;
      addLimitKeyword(ajv);
      addKeywords(ajv, Boolean(options.minify));
      const keywords = /* @__PURE__ */ new Set([...Object.keys(ajv.RULES.all), ...STRUCTURE_KEYWORDS]);
      const loadSchema = options.loadSchema || loadFileSchema;
      const loaded = [];
      ajv.opts.loadSchema = async (uri) => {
        loaded.push(uri);
        return stripAnnotations(await loadSchema(uri), keywords);
      };
      const validate = await ajv.compileAsync(stripAnnotations(schema, keywords));
      let code = useRuntime(standaloneCode(ajv, validate), esm, Boolean(options.minify));
      const {
        $id
      } = (
        /** @type {AnySchemaObject} */
        schema
      );
      if (typeof $id === "string" && $id.startsWith("file:")) {
        const {
          fileURLToPath
        } = __require("url");
        const path = __require("path");
        const dir = path.dirname(fileURLToPath($id));
        const urls = [$id, ...loaded].filter((url) => url.startsWith("file:")).sort((a, b) => b.length - a.length);
        for (const url of urls) {
          code = code.split(url).join(path.relative(dir, fileURLToPath(url)).replace(/\\/g, "/"));
        }
      }
      if (esm && code.includes(`${RUNTIME_BINDING}.`)) {
        code = `import ${RUNTIME_BINDING} from ${JSON.stringify(RUNTIME_MODULE)};
${code}`;
      }
      if (options.minify) {
        code = await minify(code, esm);
      }
      return `/* eslint-disable */
// @ts-nocheck
/*
 * This file was automatically generated by "schema-utils".
 * DO NOT MODIFY BY HAND.
 */
${code}`;
    }
    var _default = exports.default = precompile;
  }
});

// ../node_modules/schema-utils/dist/index.js
var require_dist3 = __commonJS({
  "../node_modules/schema-utils/dist/index.js"(exports, module) {
    "use strict";
    var {
      ValidationError,
      disableValidation,
      enableValidation,
      needValidate,
      validate
    } = require_validate2();
    var precompile = (...args) => require_precompile().default(...args);
    module.exports = {
      ValidationError,
      disableValidation,
      enableValidation,
      needValidate,
      precompile,
      validate
    };
  }
});

// ../node_modules/copy-webpack-plugin/package.json
var require_package = __commonJS({
  "../node_modules/copy-webpack-plugin/package.json"(exports, module) {
    module.exports = {
      name: "copy-webpack-plugin",
      version: "14.0.0",
      description: "Copy files && directories with webpack",
      keywords: [
        "webpack",
        "plugin",
        "transfer",
        "move",
        "copy"
      ],
      homepage: "https://github.com/webpack/copy-webpack-plugin",
      bugs: "https://github.com/webpack/copy-webpack-plugin/issues",
      repository: "webpack/copy-webpack-plugin",
      funding: {
        type: "opencollective",
        url: "https://opencollective.com/webpack"
      },
      license: "MIT",
      author: "Len Boyette",
      main: "dist/index.js",
      types: "types/index.d.ts",
      files: [
        "dist",
        "types"
      ],
      scripts: {
        start: "npm run build -- -w",
        clean: "del-cli dist types",
        prebuild: "npm run clean",
        "build:types": 'tsc --declaration --emitDeclarationOnly --outDir types --rootDir src && prettier "types/**/*.ts" --write',
        "build:code": "cross-env NODE_ENV=production babel src -d dist --copy-files",
        build: 'npm-run-all -p "build:**"',
        commitlint: "commitlint --from=main",
        security: "npm audit --production",
        "lint:prettier": "prettier --cache --list-different .",
        "lint:code": "eslint --cache .",
        "lint:spelling": 'cspell --cache --no-must-find-files --quiet "**/*.*"',
        "lint:types": "tsc --pretty --noEmit",
        lint: 'npm-run-all -l -p "lint:**"',
        "fix:code": "npm run lint:code -- --fix",
        fmt: "npm run lint:prettier -- --write",
        fix: "npm run fix:code && npm run fmt",
        "test:only": "cross-env NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js",
        "test:watch": "npm run test:only -- --watch",
        "test:coverage": 'npm run test:only -- --collectCoverageFrom="src/**/*.js" --coverage',
        pretest: "npm run lint",
        test: "npm run test:coverage",
        prepare: "husky && npm run build",
        release: "standard-version"
      },
      dependencies: {
        "glob-parent": "^6.0.1",
        "normalize-path": "^3.0.0",
        "schema-utils": "^4.2.0",
        "serialize-javascript": "^7.0.3",
        tinyglobby: "^0.2.12"
      },
      devDependencies: {
        "@babel/cli": "^7.24.6",
        "@babel/core": "^7.25.2",
        "@babel/preset-env": "^7.25.3",
        "@commitlint/cli": "^20.3.1",
        "@commitlint/config-conventional": "^20.3.1",
        "@types/glob-parent": "^5.1.3",
        "@types/node": "^22.13.5",
        "@types/normalize-path": "^3.0.2",
        "@types/picomatch": "^4.0.2",
        "@types/serialize-javascript": "^5.0.4",
        "babel-jest": "^30.0.0",
        "cross-env": "^7.0.3",
        cspell: "^9.6.2",
        "del-cli": "^7.0.0",
        eslint: "^9.31.0",
        "eslint-config-webpack": "^4.4.2",
        "eslint-plugin-jest": "^29.0.1",
        "file-loader": "^6.2.0",
        husky: "^9.1.4",
        "is-gzip": "^2.0.0",
        jest: "^30.0.0",
        "lint-staged": "^16.2.7",
        memfs: "^4.11.1",
        "npm-run-all": "^4.1.5",
        prettier: "^3.2.5",
        "standard-version": "^9.3.1",
        typescript: "^5.4.5",
        webpack: "^5.91.0"
      },
      peerDependencies: {
        webpack: "^5.1.0"
      },
      engines: {
        node: ">= 20.9.0"
      }
    };
  }
});

// ../node_modules/copy-webpack-plugin/dist/options.json
var require_options = __commonJS({
  "../node_modules/copy-webpack-plugin/dist/options.json"(exports, module) {
    module.exports = {
      definitions: {
        ObjectPattern: {
          type: "object",
          additionalProperties: false,
          properties: {
            from: {
              type: "string",
              description: "Glob or path from where we copy files.",
              link: "https://github.com/webpack/copy-webpack-plugin#from",
              minLength: 1
            },
            to: {
              anyOf: [
                {
                  type: "string"
                },
                {
                  instanceof: "Function"
                }
              ],
              description: "Output path.",
              link: "https://github.com/webpack/copy-webpack-plugin#to"
            },
            context: {
              type: "string",
              description: "A path that determines how to interpret the 'from' path.",
              link: "https://github.com/webpack/copy-webpack-plugin#context"
            },
            globOptions: {
              type: "object",
              description: "Allows to configure the glob pattern matching library used by the plugin.",
              link: "https://github.com/webpack/copy-webpack-plugin#globoptions"
            },
            filter: {
              instanceof: "Function",
              description: "Allows to filter copied assets.",
              link: "https://github.com/webpack/copy-webpack-plugin#filter"
            },
            transformAll: {
              instanceof: "Function",
              description: "Allows you to modify the contents of multiple files and save the result to one file.",
              link: "https://github.com/webpack/copy-webpack-plugin#transformall"
            },
            toType: {
              enum: ["dir", "file", "template"],
              description: "Determinate what is to option - directory, file or template.",
              link: "https://github.com/webpack/copy-webpack-plugin#totype"
            },
            force: {
              type: "boolean",
              description: "Overwrites files already in 'compilation.assets' (usually added by other plugins/loaders).",
              link: "https://github.com/webpack/copy-webpack-plugin#force"
            },
            priority: {
              type: "number",
              description: "Allows to specify the priority of copying files with the same destination name.",
              link: "https://github.com/webpack/copy-webpack-plugin#priority"
            },
            info: {
              anyOf: [
                {
                  type: "object"
                },
                {
                  instanceof: "Function"
                }
              ],
              description: "Allows to add assets info.",
              link: "https://github.com/webpack/copy-webpack-plugin#info"
            },
            transform: {
              description: "Allows to modify the file contents.",
              link: "https://github.com/webpack/copy-webpack-plugin#transform",
              anyOf: [
                {
                  instanceof: "Function"
                },
                {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    transformer: {
                      instanceof: "Function",
                      description: "Allows to modify the file contents.",
                      link: "https://github.com/webpack/copy-webpack-plugin#transformer"
                    },
                    cache: {
                      description: "Enables/disables and configure caching.",
                      link: "https://github.com/webpack/copy-webpack-plugin#cache",
                      anyOf: [
                        {
                          type: "boolean"
                        },
                        {
                          type: "object",
                          additionalProperties: false,
                          properties: {
                            keys: {
                              anyOf: [
                                {
                                  type: "object",
                                  additionalProperties: true
                                },
                                {
                                  instanceof: "Function"
                                }
                              ]
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              ]
            },
            noErrorOnMissing: {
              type: "boolean",
              description: "Doesn't generate an error on missing file(s).",
              link: "https://github.com/webpack/copy-webpack-plugin#noerroronmissing"
            }
          },
          required: ["from"]
        },
        StringPattern: {
          type: "string",
          minLength: 1
        }
      },
      type: "object",
      additionalProperties: false,
      properties: {
        patterns: {
          type: "array",
          minItems: 1,
          items: {
            anyOf: [
              {
                $ref: "#/definitions/StringPattern"
              },
              {
                $ref: "#/definitions/ObjectPattern"
              }
            ]
          }
        },
        options: {
          type: "object",
          additionalProperties: false,
          properties: {
            concurrency: {
              type: "number",
              description: "Limits the number of simultaneous requests to fs.",
              link: "https://github.com/webpack/copy-webpack-plugin#concurrency"
            }
          }
        }
      },
      required: ["patterns"]
    };
  }
});

// ../node_modules/copy-webpack-plugin/dist/utils.js
var require_utils2 = __commonJS({
  "../node_modules/copy-webpack-plugin/dist/utils.js"(exports, module) {
    "use strict";
    function stat(inputFileSystem, path) {
      return new Promise((resolve, reject) => {
        inputFileSystem.stat(
          path,
          /**
           * @param {null | undefined | NodeJS.ErrnoException} err an error that occurred while trying to get the stats.
           * @param {undefined | Stats} stats the stats of the file or directory, if available.
           */
          (err, stats) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(stats);
          }
        );
      });
    }
    function readFile(inputFileSystem, path) {
      return new Promise((resolve, reject) => {
        inputFileSystem.readFile(
          path,
          /**
           * @param {null | undefined | NodeJS.ErrnoException} err /an error that occurred while trying to read the file.
           * @param {undefined | string | Buffer} data the content of the file, if available.
           */
          (err, data) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(
              /** @type {string | Buffer} */
              data
            );
          }
        );
      });
    }
    var notSettled = /* @__PURE__ */ Symbol("not-settled");
    function throttleAll(limit, tasks) {
      if (!Number.isInteger(limit) || limit < 1) {
        throw new TypeError(`Expected \`limit\` to be a finite number > 0, got \`${limit}\` (${typeof limit})`);
      }
      if (!Array.isArray(tasks) || !tasks.every((task) => typeof task === "function")) {
        throw new TypeError("Expected `tasks` to be a list of functions returning a promise");
      }
      return new Promise((resolve, reject) => {
        const result = Array.from({
          length: tasks.length
        }).fill(notSettled);
        const entries = tasks.entries();
        const next = () => {
          const {
            done,
            value
          } = entries.next();
          if (done) {
            const isLast = !result.includes(notSettled);
            if (isLast) {
              resolve(
                /** @type {T[]} */
                result
              );
            }
            return;
          }
          const [index, task] = value;
          const onFulfilled = (taskResult) => {
            result[index] = taskResult;
            next();
          };
          task().then(onFulfilled, reject);
        };
        for (let i = 0; i < limit; i++) {
          next();
        }
      });
    }
    function memoize(fn) {
      let cache = false;
      let result;
      return () => {
        if (cache) {
          return result;
        }
        result = /** @type {T} */
        /** @type {() => unknown} */
        fn();
        cache = true;
        fn = void 0;
        return result;
      };
    }
    module.exports = {
      memoize,
      readFile,
      stat,
      throttleAll
    };
  }
});

// ../node_modules/normalize-path/index.js
var require_normalize_path = __commonJS({
  "../node_modules/normalize-path/index.js"(exports, module) {
    module.exports = function(path, stripTrailing) {
      if (typeof path !== "string") {
        throw new TypeError("expected path to be a string");
      }
      if (path === "\\" || path === "/") return "/";
      var len = path.length;
      if (len <= 1) return path;
      var prefix = "";
      if (len > 4 && path[3] === "\\") {
        var ch = path[2];
        if ((ch === "?" || ch === ".") && path.slice(0, 2) === "\\\\") {
          path = path.slice(2);
          prefix = "//";
        }
      }
      var segs = path.split(/[/\\]+/);
      if (stripTrailing !== false && segs[segs.length - 1] === "") {
        segs.pop();
      }
      return prefix + segs.join("/");
    };
  }
});

// ../node_modules/is-extglob/index.js
var require_is_extglob = __commonJS({
  "../node_modules/is-extglob/index.js"(exports, module) {
    module.exports = function isExtglob(str) {
      if (typeof str !== "string" || str === "") {
        return false;
      }
      var match;
      while (match = /(\\).|([@?!+*]\(.*\))/g.exec(str)) {
        if (match[2]) return true;
        str = str.slice(match.index + match[0].length);
      }
      return false;
    };
  }
});

// ../node_modules/is-glob/index.js
var require_is_glob = __commonJS({
  "../node_modules/is-glob/index.js"(exports, module) {
    var isExtglob = require_is_extglob();
    var chars = { "{": "}", "(": ")", "[": "]" };
    var strictCheck = function(str) {
      if (str[0] === "!") {
        return true;
      }
      var index = 0;
      var pipeIndex = -2;
      var closeSquareIndex = -2;
      var closeCurlyIndex = -2;
      var closeParenIndex = -2;
      var backSlashIndex = -2;
      while (index < str.length) {
        if (str[index] === "*") {
          return true;
        }
        if (str[index + 1] === "?" && /[\].+)]/.test(str[index])) {
          return true;
        }
        if (closeSquareIndex !== -1 && str[index] === "[" && str[index + 1] !== "]") {
          if (closeSquareIndex < index) {
            closeSquareIndex = str.indexOf("]", index);
          }
          if (closeSquareIndex > index) {
            if (backSlashIndex === -1 || backSlashIndex > closeSquareIndex) {
              return true;
            }
            backSlashIndex = str.indexOf("\\", index);
            if (backSlashIndex === -1 || backSlashIndex > closeSquareIndex) {
              return true;
            }
          }
        }
        if (closeCurlyIndex !== -1 && str[index] === "{" && str[index + 1] !== "}") {
          closeCurlyIndex = str.indexOf("}", index);
          if (closeCurlyIndex > index) {
            backSlashIndex = str.indexOf("\\", index);
            if (backSlashIndex === -1 || backSlashIndex > closeCurlyIndex) {
              return true;
            }
          }
        }
        if (closeParenIndex !== -1 && str[index] === "(" && str[index + 1] === "?" && /[:!=]/.test(str[index + 2]) && str[index + 3] !== ")") {
          closeParenIndex = str.indexOf(")", index);
          if (closeParenIndex > index) {
            backSlashIndex = str.indexOf("\\", index);
            if (backSlashIndex === -1 || backSlashIndex > closeParenIndex) {
              return true;
            }
          }
        }
        if (pipeIndex !== -1 && str[index] === "(" && str[index + 1] !== "|") {
          if (pipeIndex < index) {
            pipeIndex = str.indexOf("|", index);
          }
          if (pipeIndex !== -1 && str[pipeIndex + 1] !== ")") {
            closeParenIndex = str.indexOf(")", pipeIndex);
            if (closeParenIndex > pipeIndex) {
              backSlashIndex = str.indexOf("\\", pipeIndex);
              if (backSlashIndex === -1 || backSlashIndex > closeParenIndex) {
                return true;
              }
            }
          }
        }
        if (str[index] === "\\") {
          var open = str[index + 1];
          index += 2;
          var close = chars[open];
          if (close) {
            var n = str.indexOf(close, index);
            if (n !== -1) {
              index = n + 1;
            }
          }
          if (str[index] === "!") {
            return true;
          }
        } else {
          index++;
        }
      }
      return false;
    };
    var relaxedCheck = function(str) {
      if (str[0] === "!") {
        return true;
      }
      var index = 0;
      while (index < str.length) {
        if (/[*?{}()[\]]/.test(str[index])) {
          return true;
        }
        if (str[index] === "\\") {
          var open = str[index + 1];
          index += 2;
          var close = chars[open];
          if (close) {
            var n = str.indexOf(close, index);
            if (n !== -1) {
              index = n + 1;
            }
          }
          if (str[index] === "!") {
            return true;
          }
        } else {
          index++;
        }
      }
      return false;
    };
    module.exports = function isGlob(str, options) {
      if (typeof str !== "string" || str === "") {
        return false;
      }
      if (isExtglob(str)) {
        return true;
      }
      var check = strictCheck;
      if (options && options.strict === false) {
        check = relaxedCheck;
      }
      return check(str);
    };
  }
});

// ../node_modules/glob-parent/index.js
var require_glob_parent = __commonJS({
  "../node_modules/glob-parent/index.js"(exports, module) {
    "use strict";
    var isGlob = require_is_glob();
    var pathPosixDirname = __require("path").posix.dirname;
    var isWin32 = __require("os").platform() === "win32";
    var slash = "/";
    var backslash = /\\/g;
    var escaped = /\\([!*?|[\](){}])/g;
    module.exports = function globParent(str, opts) {
      var options = Object.assign({ flipBackslashes: true }, opts);
      if (options.flipBackslashes && isWin32 && str.indexOf(slash) < 0) {
        str = str.replace(backslash, slash);
      }
      if (isEnclosure(str)) {
        str += slash;
      }
      str += "a";
      do {
        str = pathPosixDirname(str);
      } while (isGlobby(str));
      return str.replace(escaped, "$1");
    };
    function isEnclosure(str) {
      var lastChar = str.slice(-1);
      var enclosureStart;
      switch (lastChar) {
        case "}":
          enclosureStart = "{";
          break;
        case "]":
          enclosureStart = "[";
          break;
        default:
          return false;
      }
      var foundIndex = str.indexOf(enclosureStart);
      if (foundIndex < 0) {
        return false;
      }
      return str.slice(foundIndex + 1, -1).includes(slash);
    }
    function isGlobby(str) {
      if (/\([^()]+$/.test(str)) {
        return true;
      }
      if (str[0] === "{" || str[0] === "[") {
        return true;
      }
      if (/[^\\][{[]/.test(str)) {
        return true;
      }
      return isGlob(str);
    }
  }
});

// ../node_modules/copy-webpack-plugin/node_modules/serialize-javascript/index.js
var require_serialize_javascript = __commonJS({
  "../node_modules/copy-webpack-plugin/node_modules/serialize-javascript/index.js"(exports, module) {
    "use strict";
    var UID_LENGTH = 16;
    var UID = generateUID();
    var PLACE_HOLDER_REGEXP = new RegExp('(\\\\)?"@__(F|R|D|M|S|A|U|I|B|L)-' + UID + '-(\\d+)__@"', "g");
    var IS_NATIVE_CODE_REGEXP = /\{\s*\[native code\]\s*\}/g;
    var IS_PURE_FUNCTION = /function.*?\(/;
    var IS_ARROW_FUNCTION = /.*?=>.*?/;
    var UNSAFE_CHARS_REGEXP = /[<>\/\u2028\u2029]/g;
    var SCRIPT_CLOSE_REGEXP = /<\/script[^>]*>/gi;
    var RESERVED_SYMBOLS = ["*", "async"];
    var ESCAPED_CHARS = {
      "<": "\\u003C",
      ">": "\\u003E",
      "/": "\\u002F",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029"
    };
    function escapeUnsafeChars(unsafeChar) {
      return ESCAPED_CHARS[unsafeChar];
    }
    function escapeFunctionBody(str) {
      str = str.replace(SCRIPT_CLOSE_REGEXP, function(match) {
        return match.replace(/</g, "\\u003C").replace(/\//g, "\\u002F").replace(/>/g, "\\u003E");
      });
      str = str.replace(/\u2028/g, "\\u2028");
      str = str.replace(/\u2029/g, "\\u2029");
      return str;
    }
    function generateUID() {
      var bytes = crypto.getRandomValues(new Uint8Array(UID_LENGTH));
      var result = "";
      for (var i = 0; i < UID_LENGTH; ++i) {
        result += bytes[i].toString(16);
      }
      return result;
    }
    function deleteFunctions(obj) {
      var functionKeys = [];
      for (var key in obj) {
        if (typeof obj[key] === "function") {
          functionKeys.push(key);
        }
      }
      for (var i = 0; i < functionKeys.length; i++) {
        delete obj[functionKeys[i]];
      }
    }
    module.exports = function serialize(obj, options) {
      options || (options = {});
      if (typeof options === "number" || typeof options === "string") {
        options = { space: options };
      }
      var functions = [];
      var regexps = [];
      var dates = [];
      var maps = [];
      var sets = [];
      var arrays = [];
      var undefs = [];
      var infinities = [];
      var bigInts = [];
      var urls = [];
      function replacer(key, value) {
        if (options.ignoreFunction) {
          deleteFunctions(value);
        }
        if (!value && value !== void 0 && value !== BigInt(0)) {
          return value;
        }
        var origValue = this[key];
        var type = typeof origValue;
        if (type === "object") {
          if (origValue instanceof RegExp) {
            return "@__R-" + UID + "-" + (regexps.push(origValue) - 1) + "__@";
          }
          if (origValue instanceof Date) {
            return "@__D-" + UID + "-" + (dates.push(origValue) - 1) + "__@";
          }
          if (origValue instanceof Map) {
            return "@__M-" + UID + "-" + (maps.push(origValue) - 1) + "__@";
          }
          if (origValue instanceof Set) {
            return "@__S-" + UID + "-" + (sets.push(origValue) - 1) + "__@";
          }
          if (Array.isArray(origValue)) {
            var isSparse = Object.keys(origValue).length !== origValue.length;
            if (isSparse) {
              return "@__A-" + UID + "-" + (arrays.push(origValue) - 1) + "__@";
            }
          }
          if (origValue instanceof URL) {
            return "@__L-" + UID + "-" + (urls.push(origValue) - 1) + "__@";
          }
        }
        if (type === "function") {
          return "@__F-" + UID + "-" + (functions.push(origValue) - 1) + "__@";
        }
        if (type === "undefined") {
          return "@__U-" + UID + "-" + (undefs.push(origValue) - 1) + "__@";
        }
        if (type === "number" && !isNaN(origValue) && !isFinite(origValue)) {
          return "@__I-" + UID + "-" + (infinities.push(origValue) - 1) + "__@";
        }
        if (type === "bigint") {
          return "@__B-" + UID + "-" + (bigInts.push(origValue) - 1) + "__@";
        }
        return value;
      }
      function serializeFunc(fn, options2) {
        var serializedFn = fn.toString();
        if (IS_NATIVE_CODE_REGEXP.test(serializedFn)) {
          throw new TypeError("Serializing native function: " + fn.name);
        }
        if (options2 && options2.unsafe !== true) {
          serializedFn = escapeFunctionBody(serializedFn);
        }
        if (IS_PURE_FUNCTION.test(serializedFn)) {
          return serializedFn;
        }
        if (IS_ARROW_FUNCTION.test(serializedFn)) {
          return serializedFn;
        }
        var argsStartsAt = serializedFn.indexOf("(");
        var def = serializedFn.substr(0, argsStartsAt).trim().split(" ").filter(function(val) {
          return val.length > 0;
        });
        var nonReservedSymbols = def.filter(function(val) {
          return RESERVED_SYMBOLS.indexOf(val) === -1;
        });
        if (nonReservedSymbols.length > 0) {
          return (def.indexOf("async") > -1 ? "async " : "") + "function" + (def.join("").indexOf("*") > -1 ? "*" : "") + serializedFn.substr(argsStartsAt);
        }
        return serializedFn;
      }
      if (options.ignoreFunction && typeof obj === "function") {
        obj = void 0;
      }
      if (obj === void 0) {
        return String(obj);
      }
      var str;
      if (options.isJSON && !options.space) {
        str = JSON.stringify(obj);
      } else {
        str = JSON.stringify(obj, options.isJSON ? null : replacer, options.space);
      }
      if (typeof str !== "string") {
        return String(str);
      }
      if (options.unsafe !== true) {
        str = str.replace(UNSAFE_CHARS_REGEXP, escapeUnsafeChars);
      }
      if (functions.length === 0 && regexps.length === 0 && dates.length === 0 && maps.length === 0 && sets.length === 0 && arrays.length === 0 && undefs.length === 0 && infinities.length === 0 && bigInts.length === 0 && urls.length === 0) {
        return str;
      }
      return str.replace(PLACE_HOLDER_REGEXP, function(match, backSlash, type, valueIndex) {
        if (backSlash) {
          return match;
        }
        if (type === "D") {
          var isoStr = String(dates[valueIndex].toISOString());
          if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(isoStr)) {
            throw new TypeError("Invalid Date ISO string");
          }
          return 'new Date("' + isoStr + '")';
        }
        if (type === "R") {
          var flags = String(regexps[valueIndex].flags).replace(/[^gimsuydv]/g, "");
          return "new RegExp(" + serialize(regexps[valueIndex].source) + ', "' + flags + '")';
        }
        if (type === "M") {
          return "new Map(" + serialize(Array.from(maps[valueIndex].entries()), options) + ")";
        }
        if (type === "S") {
          return "new Set(" + serialize(Array.from(sets[valueIndex].values()), options) + ")";
        }
        if (type === "A") {
          return "Array.prototype.slice.call(" + serialize(Object.assign({ length: arrays[valueIndex].length }, arrays[valueIndex]), options) + ")";
        }
        if (type === "U") {
          return "undefined";
        }
        if (type === "I") {
          return infinities[valueIndex];
        }
        if (type === "B") {
          return 'BigInt("' + bigInts[valueIndex] + '")';
        }
        if (type === "L") {
          var urlStr = urls[valueIndex].toString();
          if (typeof urlStr !== "string") {
            throw new TypeError("URL.toString() must return a string");
          }
          return "new URL(" + serialize(urlStr, options) + ")";
        }
        var fn = functions[valueIndex];
        return serializeFunc(fn, options);
      });
    };
  }
});

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
      extglobChars(chars) {
        return {
          "!": { type: "negate", open: "(?:(?!(?:", close: `))${chars.STAR})` },
          "?": { type: "qmark", open: "(?:", close: ")?" },
          "+": { type: "plus", open: "(?:", close: ")+" },
          "*": { type: "star", open: "(?:", close: ")*" },
          "@": { type: "at", open: "(?:", close: ")" }
        };
      },
      /**
       * Create GLOB_CHARS
       */
      globChars(win32) {
        return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
      }
    };
  }
});

// ../node_modules/picomatch/lib/utils.js
var require_utils3 = __commonJS({
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
    var utils = require_utils3();
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
          const n2 = prevIndex !== void 0 ? prevIndex + 1 : start;
          const i = slashes[idx];
          const value2 = input.slice(n2, i);
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
        const n = prevIndex !== void 0 ? prevIndex + 1 : start;
        const value = input.slice(n);
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
    var utils = require_utils3();
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
    var buildCharClassStar = (chars) => {
      const source = chars.length === 1 ? utils.escapeRegex(chars[0]) : `[${chars.map((ch) => utils.escapeRegex(ch)).join("")}]`;
      return `${source}*`;
    };
    var getStarExtglobSequenceChars = (pattern) => {
      let index = 0;
      const chars = [];
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
        chars.push(branch);
        index += match.end + 1;
      }
      if (chars.length < 1) {
        return;
      }
      return chars;
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
        const chars = getStarExtglobSequenceChars(branch);
        if (chars) {
          sawStarSequence = true;
          safeChars.push(...chars);
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
      const peek = state.peek = (n = 1) => input[state.index + n];
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
        let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m, esc, chars, first, rest, index) => {
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
            return QMARK.repeat(chars.length);
          }
          if (first === ".") {
            return DOT_LITERAL.repeat(chars.length);
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
                const posix = POSIX_REGEX_SOURCE[rest2];
                if (posix) {
                  prev.value = pre + posix;
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
    var utils = require_utils3();
    var constants = require_constants();
    var isObject = (val) => val && typeof val === "object" && !Array.isArray(val);
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
      const isState = isObject(glob) && glob.tokens && glob.input;
      if (glob === "" || typeof glob !== "string" && !isState) {
        throw new TypeError("Expected pattern to be a non-empty string");
      }
      const opts = options || {};
      const posix = opts.windows;
      const regex = isState ? picomatch.compileRe(glob, options) : picomatch.makeRe(glob, options, false, true);
      const state = regex.state;
      delete regex.state;
      let isIgnored = () => false;
      if (opts.ignore) {
        const ignoreOpts = { ...options, ignore: null, onMatch: null, onResult: null };
        isIgnored = picomatch(opts.ignore, ignoreOpts, returnState);
      }
      const matcher = (input, returnObject = false) => {
        const { isMatch, match, output } = picomatch.test(input, regex, options, { glob, posix });
        const result = { glob, state, regex, posix, input, output, match, isMatch };
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
    picomatch.test = (input, regex, options, { glob, posix } = {}) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected input to be a string");
      }
      if (input === "") {
        return { isMatch: false, output: "" };
      }
      const opts = options || {};
      const format = opts.format || (posix ? utils.toPosixSlashes : null);
      let match = input === glob;
      let output = match && format ? format(input) : input;
      if (match === false) {
        output = format ? format(input) : input;
        match = output === glob;
      }
      if (match === false || opts.capture === true) {
        if (opts.matchBase === true || opts.basename === true) {
          match = picomatch.matchBase(input, regex, options, posix);
        } else {
          match = regex.exec(output);
        }
      }
      return { isMatch: Boolean(match), match, output };
    };
    picomatch.matchBase = (input, glob, options, posix = options && options.windows) => {
      const regex = glob instanceof RegExp ? glob : picomatch.makeRe(glob, options);
      return regex.test(utils.basename(input, { windows: posix }));
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
    var utils = require_utils3();
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

// ../node_modules/fdir/dist/index.cjs
var require_dist4 = __commonJS({
  "../node_modules/fdir/dist/index.cjs"(exports) {
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames2(from), i = 0, n = keys.length, key; i < n; i++) {
        key = keys[i];
        if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
          get: ((k) => from[k]).bind(null, key),
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
      }
      return to;
    };
    var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
      value: mod,
      enumerable: true
    }) : target, mod));
    var path = __toESM(__require("path"));
    var fs = __toESM(__require("fs"));
    function cleanPath(path$1) {
      let normalized = (0, path.normalize)(path$1);
      if (normalized.length > 1 && normalized[normalized.length - 1] === path.sep) normalized = normalized.substring(0, normalized.length - 1);
      return normalized;
    }
    var SLASHES_REGEX = /[\\/]/g;
    function convertSlashes(path$1, separator) {
      return path$1.replace(SLASHES_REGEX, separator);
    }
    var WINDOWS_ROOT_DIR_REGEX = /^[a-z]:[\\/]$/i;
    function isRootDirectory(path$1) {
      return path$1 === "/" || WINDOWS_ROOT_DIR_REGEX.test(path$1);
    }
    function normalizePath(path$1, options) {
      const { resolvePaths, normalizePath: normalizePath$1, pathSeparator } = options;
      const pathNeedsCleaning = process.platform === "win32" && path$1.includes("/") || path$1.startsWith(".");
      if (resolvePaths) path$1 = (0, path.resolve)(path$1);
      if (normalizePath$1 || pathNeedsCleaning) path$1 = cleanPath(path$1);
      if (path$1 === ".") return "";
      const needsSeperator = path$1[path$1.length - 1] !== pathSeparator;
      return convertSlashes(needsSeperator ? path$1 + pathSeparator : path$1, pathSeparator);
    }
    function joinPathWithBasePath(filename, directoryPath) {
      return directoryPath + filename;
    }
    function joinPathWithRelativePath(root, options) {
      return function(filename, directoryPath) {
        const sameRoot = directoryPath.startsWith(root);
        if (sameRoot) return directoryPath.slice(root.length) + filename;
        else return convertSlashes((0, path.relative)(root, directoryPath), options.pathSeparator) + options.pathSeparator + filename;
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
      const path$1 = directoryPath || ".";
      if (filters.every((filter) => filter(path$1, true))) paths.push(path$1);
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
    var resolveSymlinksAsync = function(path$1, state, callback$1) {
      const { queue, fs: fs$1, options: { suppressErrors } } = state;
      queue.enqueue();
      fs$1.realpath(path$1, (error, resolvedPath) => {
        if (error) return queue.dequeue(suppressErrors ? null : error, state);
        fs$1.stat(resolvedPath, (error$1, stat) => {
          if (error$1) return queue.dequeue(suppressErrors ? null : error$1, state);
          if (stat.isDirectory() && isRecursive(path$1, resolvedPath, state)) return queue.dequeue(null, state);
          callback$1(stat, resolvedPath);
          queue.dequeue(null, state);
        });
      });
    };
    var resolveSymlinks = function(path$1, state, callback$1) {
      const { queue, fs: fs$1, options: { suppressErrors } } = state;
      queue.enqueue();
      try {
        const resolvedPath = fs$1.realpathSync(path$1);
        const stat = fs$1.statSync(resolvedPath);
        if (stat.isDirectory() && isRecursive(path$1, resolvedPath, state)) return;
        callback$1(stat, resolvedPath);
      } catch (e) {
        if (!suppressErrors) throw e;
      }
    };
    function build$2(options, isSynchronous) {
      if (!options.resolveSymlinks || options.excludeSymlinks) return null;
      return isSynchronous ? resolveSymlinks : resolveSymlinksAsync;
    }
    function isRecursive(path$1, resolved, state) {
      if (state.options.useRealPaths) return isRecursiveUsingRealPaths(resolved, state);
      let parent = (0, path.dirname)(path$1);
      let depth = 1;
      while (parent !== state.root && depth < 2) {
        const resolvedPath = state.symlinks.get(parent);
        const isSameRoot = !!resolvedPath && (resolvedPath === resolved || resolvedPath.startsWith(resolved) || resolved.startsWith(resolvedPath));
        if (isSameRoot) depth++;
        else parent = (0, path.dirname)(parent);
      }
      state.symlinks.set(path$1, resolved);
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
      const { fs: fs$1 } = state;
      state.visited.push(crawlPath);
      state.counts.directories++;
      fs$1.readdir(crawlPath || ".", readdirOpts, (error, entries = []) => {
        callback$1(entries, directoryPath, currentDepth);
        state.queue.dequeue(state.options.suppressErrors ? null : error, state);
      });
    };
    var walkSync = (state, crawlPath, directoryPath, currentDepth, callback$1) => {
      const { fs: fs$1 } = state;
      if (currentDepth < 0) return;
      state.visited.push(crawlPath);
      state.counts.directories++;
      let entries = [];
      try {
        entries = fs$1.readdirSync(crawlPath || ".", readdirOpts);
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
        this.root = normalizePath(root, options);
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
          fs: options.fs || fs
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
            let path$1 = joinDirectoryPath(entry.name, directoryPath, this.state.options.pathSeparator);
            if (exclude && exclude(entry.name, path$1)) continue;
            this.pushDirectory(path$1, paths, filters);
            this.walkDirectory(this.state, path$1, path$1, depth - 1, this.walk);
          } else if (this.resolveSymlink && entry.isSymbolicLink()) {
            let path$1 = joinPathWithBasePath(entry.name, directoryPath);
            this.resolveSymlink(path$1, this.state, (stat, resolvedPath) => {
              if (stat.isDirectory()) {
                resolvedPath = normalizePath(resolvedPath, this.state.options);
                if (exclude && exclude(entry.name, useRealPaths ? resolvedPath : path$1 + pathSeparator)) return;
                this.walkDirectory(this.state, resolvedPath, useRealPaths ? resolvedPath : path$1 + pathSeparator, depth - 1, this.walk);
              } else {
                resolvedPath = useRealPaths ? resolvedPath : path$1;
                const filename = (0, path.basename)(resolvedPath);
                const directoryPath$1 = normalizePath((0, path.dirname)(resolvedPath), this.state.options);
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
    var pm = null;
    try {
      __require.resolve("picomatch");
      pm = require_picomatch2();
    } catch {
    }
    var Builder = class {
      globCache = {};
      options = {
        maxDepth: Infinity,
        suppressErrors: true,
        pathSeparator: path.sep,
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
        const globFn = this.globFunction || pm;
        if (!globFn) throw new Error("Please specify a glob function to use glob matching.");
        var isMatch = this.globCache[patterns.join("\0")];
        if (!isMatch) {
          isMatch = globFn(patterns, ...options);
          this.globCache[patterns.join("\0")] = isMatch;
        }
        this.options.filters.push((path$1) => isMatch(path$1));
        return this;
      }
    };
    exports.fdir = Builder;
  }
});

// ../node_modules/tinyglobby/dist/index.cjs
var require_dist5 = __commonJS({
  "../node_modules/tinyglobby/dist/index.cjs"(exports) {
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames2(from), i = 0, n = keys.length, key; i < n; i++) {
        key = keys[i];
        if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
          get: ((k) => from[k]).bind(null, key),
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
      }
      return to;
    };
    var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
      value: mod,
      enumerable: true
    }) : target, mod));
    var fs = __require("fs");
    fs = __toESM(fs);
    var path = __require("path");
    path = __toESM(path);
    var url = __require("url");
    url = __toESM(url);
    var fdir = require_dist4();
    fdir = __toESM(fdir);
    var picomatch = require_picomatch2();
    picomatch = __toESM(picomatch);
    var isReadonlyArray = Array.isArray;
    var isWin = process.platform === "win32";
    var ONLY_PARENT_DIRECTORIES = /^(\/?\.\.)+$/;
    function getPartialMatcher(patterns, options = {}) {
      const patternsCount = patterns.length;
      const patternsParts = Array(patternsCount);
      const matchers = Array(patternsCount);
      const globstarEnabled = !options.noglobstar;
      for (let i = 0; i < patternsCount; i++) {
        const parts = splitPattern(patterns[i]);
        patternsParts[i] = parts;
        const partsCount = parts.length;
        const partMatchers = Array(partsCount);
        for (let j = 0; j < partsCount; j++) partMatchers[j] = (0, picomatch.default)(parts[j], options);
        matchers[i] = partMatchers;
      }
      return (input) => {
        const inputParts = input.split("/");
        if (inputParts[0] === ".." && ONLY_PARENT_DIRECTORIES.test(input)) return true;
        for (let i = 0; i < patterns.length; i++) {
          const patternParts = patternsParts[i];
          const matcher = matchers[i];
          const inputPatternCount = inputParts.length;
          const minParts = Math.min(inputPatternCount, patternParts.length);
          let j = 0;
          while (j < minParts) {
            const part = patternParts[j];
            if (part.includes("/")) return true;
            const match = matcher[j](inputParts[j]);
            if (!match) break;
            if (globstarEnabled && part === "**") return true;
            j++;
          }
          if (j === inputPatternCount) return true;
        }
        return false;
      };
    }
    var WIN32_ROOT_DIR = /^[A-Z]:\/$/i;
    var isRoot = isWin ? (p) => WIN32_ROOT_DIR.test(p) : (p) => p === "/";
    function buildFormat(cwd, root, absolute) {
      if (cwd === root || root.startsWith(`${cwd}/`)) {
        if (absolute) {
          const start = isRoot(cwd) ? cwd.length : cwd.length + 1;
          return (p, isDir) => p.slice(start, isDir ? -1 : void 0) || ".";
        }
        const prefix = root.slice(cwd.length + 1);
        if (prefix) return (p, isDir) => {
          if (p === ".") return prefix;
          const result = `${prefix}/${p}`;
          return isDir ? result.slice(0, -1) : result;
        };
        return (p, isDir) => isDir && p !== "." ? p.slice(0, -1) : p;
      }
      if (absolute) return (p) => path.posix.relative(cwd, p) || ".";
      return (p) => path.posix.relative(cwd, `${root}/${p}`) || ".";
    }
    function buildRelative(cwd, root) {
      if (root.startsWith(`${cwd}/`)) {
        const prefix = root.slice(cwd.length + 1);
        return (p) => `${prefix}/${p}`;
      }
      return (p) => {
        const result = path.posix.relative(cwd, `${root}/${p}`);
        if (p.endsWith("/") && result !== "") return `${result}/`;
        return result || ".";
      };
    }
    var splitPatternOptions = { parts: true };
    function splitPattern(path$2) {
      var _result$parts;
      const result = picomatch.default.scan(path$2, splitPatternOptions);
      return ((_result$parts = result.parts) === null || _result$parts === void 0 ? void 0 : _result$parts.length) ? result.parts : [path$2];
    }
    var ESCAPED_WIN32_BACKSLASHES = /\\(?![()[\]{}!+@])/g;
    function convertPosixPathToPattern(path$2) {
      return escapePosixPath(path$2);
    }
    function convertWin32PathToPattern(path$2) {
      return escapeWin32Path(path$2).replace(ESCAPED_WIN32_BACKSLASHES, "/");
    }
    var convertPathToPattern = isWin ? convertWin32PathToPattern : convertPosixPathToPattern;
    var POSIX_UNESCAPED_GLOB_SYMBOLS = /(?<!\\)([()[\]{}*?|]|^!|[!+@](?=\()|\\(?![()[\]{}!*+?@|]))/g;
    var WIN32_UNESCAPED_GLOB_SYMBOLS = /(?<!\\)([()[\]{}]|^!|[!+@](?=\())/g;
    var escapePosixPath = (path$2) => path$2.replace(POSIX_UNESCAPED_GLOB_SYMBOLS, "\\$&");
    var escapeWin32Path = (path$2) => path$2.replace(WIN32_UNESCAPED_GLOB_SYMBOLS, "\\$&");
    var escapePath = isWin ? escapeWin32Path : escapePosixPath;
    function isDynamicPattern(pattern, options) {
      if ((options === null || options === void 0 ? void 0 : options.caseSensitiveMatch) === false) return true;
      const scan = picomatch.default.scan(pattern);
      return scan.isGlob || scan.negated;
    }
    function log(...tasks) {
      console.log(`[tinyglobby ${(/* @__PURE__ */ new Date()).toLocaleTimeString("es")}]`, ...tasks);
    }
    var PARENT_DIRECTORY = /^(\/?\.\.)+/;
    var ESCAPING_BACKSLASHES = /\\(?=[()[\]{}!*+?@|])/g;
    var BACKSLASHES = /\\/g;
    function normalizePattern(pattern, expandDirectories, cwd, props, isIgnore) {
      let result = pattern;
      if (pattern.endsWith("/")) result = pattern.slice(0, -1);
      if (!result.endsWith("*") && expandDirectories) result += "/**";
      const escapedCwd = escapePath(cwd);
      if (path.default.isAbsolute(result.replace(ESCAPING_BACKSLASHES, ""))) result = path.posix.relative(escapedCwd, result);
      else result = path.posix.normalize(result);
      const parentDirectoryMatch = PARENT_DIRECTORY.exec(result);
      const parts = splitPattern(result);
      if (parentDirectoryMatch === null || parentDirectoryMatch === void 0 ? void 0 : parentDirectoryMatch[0]) {
        const n = (parentDirectoryMatch[0].length + 1) / 3;
        let i = 0;
        const cwdParts = escapedCwd.split("/");
        while (i < n && parts[i + n] === cwdParts[cwdParts.length + i - n]) {
          result = result.slice(0, (n - i - 1) * 3) + result.slice((n - i) * 3 + parts[i + n].length + 1) || ".";
          i++;
        }
        const potentialRoot = path.posix.join(cwd, parentDirectoryMatch[0].slice(i * 3));
        if (!potentialRoot.startsWith(".") && props.root.length > potentialRoot.length) {
          props.root = potentialRoot;
          props.depthOffset = -n + i;
        }
      }
      if (!isIgnore && props.depthOffset >= 0) {
        var _props$commonPath;
        (_props$commonPath = props.commonPath) !== null && _props$commonPath !== void 0 || (props.commonPath = parts);
        const newCommonPath = [];
        const length = Math.min(props.commonPath.length, parts.length);
        for (let i = 0; i < length; i++) {
          const part = parts[i];
          if (part === "**" && !parts[i + 1]) {
            newCommonPath.pop();
            break;
          }
          if (part !== props.commonPath[i] || isDynamicPattern(part) || i === parts.length - 1) break;
          newCommonPath.push(part);
        }
        props.depthOffset = newCommonPath.length;
        props.commonPath = newCommonPath;
        props.root = newCommonPath.length > 0 ? path.posix.join(cwd, ...newCommonPath) : cwd;
      }
      return result;
    }
    function processPatterns({ patterns = ["**/*"], ignore = [], expandDirectories = true }, cwd, props) {
      if (typeof patterns === "string") patterns = [patterns];
      if (typeof ignore === "string") ignore = [ignore];
      const matchPatterns = [];
      const ignorePatterns = [];
      for (const pattern of ignore) {
        if (!pattern) continue;
        if (pattern[0] !== "!" || pattern[1] === "(") ignorePatterns.push(normalizePattern(pattern, expandDirectories, cwd, props, true));
      }
      for (const pattern of patterns) {
        if (!pattern) continue;
        if (pattern[0] !== "!" || pattern[1] === "(") matchPatterns.push(normalizePattern(pattern, expandDirectories, cwd, props, false));
        else if (pattern[1] !== "!" || pattern[2] === "(") ignorePatterns.push(normalizePattern(pattern.slice(1), expandDirectories, cwd, props, true));
      }
      return {
        match: matchPatterns,
        ignore: ignorePatterns
      };
    }
    function formatPaths(paths, relative) {
      for (let i = paths.length - 1; i >= 0; i--) {
        const path$2 = paths[i];
        paths[i] = relative(path$2);
      }
      return paths;
    }
    function normalizeCwd(cwd) {
      if (!cwd) return process.cwd().replace(BACKSLASHES, "/");
      if (cwd instanceof URL) return (0, url.fileURLToPath)(cwd).replace(BACKSLASHES, "/");
      return path.default.resolve(cwd).replace(BACKSLASHES, "/");
    }
    function getCrawler(patterns, inputOptions = {}) {
      const options = process.env.TINYGLOBBY_DEBUG ? {
        ...inputOptions,
        debug: true
      } : inputOptions;
      const cwd = normalizeCwd(options.cwd);
      if (options.debug) log("globbing with:", {
        patterns,
        options,
        cwd
      });
      if (Array.isArray(patterns) && patterns.length === 0) return [{
        sync: () => [],
        withPromise: async () => []
      }, false];
      const props = {
        root: cwd,
        commonPath: null,
        depthOffset: 0
      };
      const processed = processPatterns({
        ...options,
        patterns
      }, cwd, props);
      if (options.debug) log("internal processing patterns:", processed);
      const matchOptions = {
        dot: options.dot,
        nobrace: options.braceExpansion === false,
        nocase: options.caseSensitiveMatch === false,
        noextglob: options.extglob === false,
        noglobstar: options.globstar === false,
        posix: true
      };
      const matcher = (0, picomatch.default)(processed.match, {
        ...matchOptions,
        ignore: processed.ignore
      });
      const ignore = (0, picomatch.default)(processed.ignore, matchOptions);
      const partialMatcher = getPartialMatcher(processed.match, matchOptions);
      const format = buildFormat(cwd, props.root, options.absolute);
      const formatExclude = options.absolute ? format : buildFormat(cwd, props.root, true);
      const fdirOptions = {
        filters: [options.debug ? (p, isDirectory) => {
          const path$2 = format(p, isDirectory);
          const matches = matcher(path$2);
          if (matches) log(`matched ${path$2}`);
          return matches;
        } : (p, isDirectory) => matcher(format(p, isDirectory))],
        exclude: options.debug ? (_, p) => {
          const relativePath = formatExclude(p, true);
          const skipped = relativePath !== "." && !partialMatcher(relativePath) || ignore(relativePath);
          if (skipped) log(`skipped ${p}`);
          else log(`crawling ${p}`);
          return skipped;
        } : (_, p) => {
          const relativePath = formatExclude(p, true);
          return relativePath !== "." && !partialMatcher(relativePath) || ignore(relativePath);
        },
        fs: options.fs ? {
          readdir: options.fs.readdir || fs.default.readdir,
          readdirSync: options.fs.readdirSync || fs.default.readdirSync,
          realpath: options.fs.realpath || fs.default.realpath,
          realpathSync: options.fs.realpathSync || fs.default.realpathSync,
          stat: options.fs.stat || fs.default.stat,
          statSync: options.fs.statSync || fs.default.statSync
        } : void 0,
        pathSeparator: "/",
        relativePaths: true,
        resolveSymlinks: true,
        signal: options.signal
      };
      if (options.deep !== void 0) fdirOptions.maxDepth = Math.round(options.deep - props.depthOffset);
      if (options.absolute) {
        fdirOptions.relativePaths = false;
        fdirOptions.resolvePaths = true;
        fdirOptions.includeBasePath = true;
      }
      if (options.followSymbolicLinks === false) {
        fdirOptions.resolveSymlinks = false;
        fdirOptions.excludeSymlinks = true;
      }
      if (options.onlyDirectories) {
        fdirOptions.excludeFiles = true;
        fdirOptions.includeDirs = true;
      } else if (options.onlyFiles === false) fdirOptions.includeDirs = true;
      props.root = props.root.replace(BACKSLASHES, "");
      const root = props.root;
      if (options.debug) log("internal properties:", props);
      const relative = cwd !== root && !options.absolute && buildRelative(cwd, props.root);
      return [new fdir.fdir(fdirOptions).crawl(root), relative];
    }
    async function glob(patternsOrOptions, options) {
      if (patternsOrOptions && (options === null || options === void 0 ? void 0 : options.patterns)) throw new Error("Cannot pass patterns as both an argument and an option");
      const isModern = isReadonlyArray(patternsOrOptions) || typeof patternsOrOptions === "string";
      const opts = isModern ? options : patternsOrOptions;
      const patterns = isModern ? patternsOrOptions : patternsOrOptions.patterns;
      const [crawler, relative] = getCrawler(patterns, opts);
      if (!relative) return crawler.withPromise();
      return formatPaths(await crawler.withPromise(), relative);
    }
    function globSync(patternsOrOptions, options) {
      if (patternsOrOptions && (options === null || options === void 0 ? void 0 : options.patterns)) throw new Error("Cannot pass patterns as both an argument and an option");
      const isModern = isReadonlyArray(patternsOrOptions) || typeof patternsOrOptions === "string";
      const opts = isModern ? options : patternsOrOptions;
      const patterns = isModern ? patternsOrOptions : patternsOrOptions.patterns;
      const [crawler, relative] = getCrawler(patterns, opts);
      if (!relative) return crawler.sync();
      return formatPaths(crawler.sync(), relative);
    }
    exports.convertPathToPattern = convertPathToPattern;
    exports.escapePath = escapePath;
    exports.glob = glob;
    exports.globSync = globSync;
    exports.isDynamicPattern = isDynamicPattern;
  }
});

// ../node_modules/copy-webpack-plugin/dist/index.js
var require_dist6 = __commonJS({
  "../node_modules/copy-webpack-plugin/dist/index.js"(exports, module) {
    var path = __require("node:path");
    var {
      validate
    } = require_dist3();
    var {
      version
    } = require_package();
    var schema = require_options();
    var {
      memoize,
      readFile,
      stat,
      throttleAll
    } = require_utils2();
    var template = /\[\\*([\w:]+)\\*\]/i;
    var getNormalizePath = memoize(() => require_normalize_path());
    var getGlobParent = memoize(() => require_glob_parent());
    var getSerializeJavascript = memoize(() => require_serialize_javascript());
    var getTinyGlobby = memoize(() => require_dist5());
    var PLUGIN_NAME = "CopyPlugin";
    var CopyPlugin = class _CopyPlugin {
      /**
       * @param {PluginOptions=} options options for the plugin
       */
      constructor(options = {
        patterns: []
      }) {
        validate(
          /** @type {Schema} */
          schema,
          options,
          {
            name: "Copy Plugin",
            baseDataPath: "options"
          }
        );
        this.patterns = options.patterns;
        this.options = options.options || {};
      }
      /**
       * @private
       * @param {Compilation} compilation the compilation
       * @param {number} startTime the start time of the snapshot creation
       * @param {string} dependency the dependency for which the snapshot is created
       * @returns {Promise<Snapshot | undefined>} creates a snapshot for the given dependency
       */
      static async createSnapshot(compilation, startTime, dependency) {
        return new Promise((resolve, reject) => {
          compilation.fileSystemInfo.createSnapshot(startTime, [dependency], null, null, null, (error, snapshot) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(
              /** @type {Snapshot} */
              snapshot
            );
          });
        });
      }
      /**
       * @private
       * @param {Compilation} compilation the compilation
       * @param {Snapshot} snapshot /the snapshot to check
       * @returns {Promise<boolean | undefined>} checks if the snapshot is valid
       */
      static async checkSnapshotValid(compilation, snapshot) {
        return new Promise((resolve, reject) => {
          compilation.fileSystemInfo.checkSnapshotValid(snapshot, (error, isValid) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(isValid);
          });
        });
      }
      /**
       * @private
       * @param {Compiler} compiler the compiler
       * @param {Compilation} compilation the compilation
       * @param {Buffer} source the source content to hash
       * @returns {string} returns the content hash of the source
       */
      static getContentHash(compiler, compilation, source) {
        const {
          outputOptions
        } = compilation;
        const {
          hashDigest,
          hashDigestLength,
          hashFunction,
          hashSalt
        } = outputOptions;
        const hash = compiler.webpack.util.createHash(
          /** @type {string} */
          hashFunction
        );
        if (hashSalt) {
          hash.update(hashSalt);
        }
        hash.update(source);
        const fullContentHash = hash.digest(hashDigest);
        return fullContentHash.toString().slice(0, hashDigestLength);
      }
      /**
       * @private
       * @param {Compilation} compilation the compilation
       * @param {"file" | "dir" | "glob"} typeOfFrom the type of from
       * @param {string} absoluteFrom the source content to hash
       * @param {InputFileSystem | null} inputFileSystem input file system
       * @param {WebpackLogger} logger the logger to use for logging
       * @returns {Promise<void>}
       */
      static async addCompilationDependency(compilation, typeOfFrom, absoluteFrom, inputFileSystem, logger) {
        switch (typeOfFrom) {
          case "dir":
            compilation.contextDependencies.add(absoluteFrom);
            logger.debug(`added '${absoluteFrom}' as a context dependency`);
            break;
          case "file":
            compilation.fileDependencies.add(absoluteFrom);
            logger.debug(`added '${absoluteFrom}' as a file dependency`);
            break;
          case "glob":
          default: {
            const contextDependency = getTinyGlobby().isDynamicPattern(absoluteFrom) ? path.normalize(getGlobParent()(absoluteFrom)) : path.normalize(absoluteFrom);
            let stats;
            if (inputFileSystem) {
              try {
                stats = await stat(inputFileSystem, contextDependency);
              } catch {
              }
            }
            if (inputFileSystem && !stats) {
              compilation.missingDependencies.add(contextDependency);
              logger.debug(`added '${contextDependency}' as a missing dependency`);
            } else {
              compilation.contextDependencies.add(contextDependency);
              logger.debug(`added '${contextDependency}' as a context dependency`);
            }
          }
        }
      }
      /**
       * @private
       * @param {typeof import("tinyglobby").glob} globby the globby function to use for globbing
       * @param {Compiler} compiler the compiler
       * @param {Compilation} compilation the compilation
       * @param {WebpackLogger} logger the logger to use for logging
       * @param {CacheFacade} cache the cache facade to use for caching
       * @param {number} concurrency /maximum number of concurrent operations
       * @param {ObjectPattern & { context: string }} pattern the pattern to process
       * @param {number} index the index of the pattern in the patterns array
       * @returns {Promise<(CopiedResult | undefined)[] | undefined>} processes the pattern and returns an array of copied results
       */
      static async glob(globby, compiler, compilation, logger, cache, concurrency, pattern, index) {
        const {
          RawSource
        } = compiler.webpack.sources;
        logger.log(`starting to process a pattern from '${pattern.from}' using '${pattern.context}' context`);
        const absoluteFrom = path.isAbsolute(pattern.from) ? path.normalize(pattern.from) : path.resolve(pattern.context, pattern.from);
        logger.debug(`getting stats for '${absoluteFrom}'...`);
        const {
          inputFileSystem
        } = (
          /** @type {Compiler & { inputFileSystem: InputFileSystem }} */
          compiler
        );
        let stats;
        try {
          stats = await stat(inputFileSystem, absoluteFrom);
        } catch {
        }
        let typeOfFrom;
        if (stats) {
          if (stats.isDirectory()) {
            typeOfFrom = "dir";
            logger.debug(`determined '${absoluteFrom}' is a directory`);
          } else if (stats.isFile()) {
            typeOfFrom = "file";
            logger.debug(`determined '${absoluteFrom}' is a file`);
          } else {
            typeOfFrom = "glob";
            logger.debug(`determined '${absoluteFrom}' is unknown`);
          }
        } else {
          typeOfFrom = "glob";
          logger.debug(`determined '${absoluteFrom}' is a glob`);
        }
        const globOptions = {
          absolute: true,
          followSymbolicLinks: true,
          ...pattern.globOptions,
          cwd: pattern.context,
          onlyFiles: true
        };
        globOptions.fs = inputFileSystem;
        let glob;
        switch (typeOfFrom) {
          case "dir":
            pattern.context = absoluteFrom;
            glob = path.posix.join(getTinyGlobby().escapePath(getNormalizePath()(absoluteFrom)), "**/*");
            if (typeof globOptions.dot === "undefined") {
              globOptions.dot = true;
            }
            break;
          case "file":
            pattern.context = path.dirname(absoluteFrom);
            glob = getTinyGlobby().escapePath(getNormalizePath()(absoluteFrom));
            if (typeof globOptions.dot === "undefined") {
              globOptions.dot = true;
            }
            break;
          case "glob":
          default: {
            glob = path.isAbsolute(pattern.from) ? pattern.from : path.posix.join(getTinyGlobby().escapePath(getNormalizePath()(pattern.context)), pattern.from);
          }
        }
        logger.log(`begin globbing '${glob}'...`);
        let globEntries;
        try {
          globEntries = await globby(glob, globOptions);
        } catch (error) {
          compilation.errors.push(
            /** @type {Error} */
            error
          );
          return;
        }
        if (globEntries.length === 0) {
          await _CopyPlugin.addCompilationDependency(compilation, typeOfFrom, absoluteFrom, inputFileSystem, logger);
          if (pattern.noErrorOnMissing) {
            logger.log(`finished to process a pattern from '${pattern.from}' using '${pattern.context}' context to '${pattern.to}'`);
            return;
          }
          compilation.errors.push(new Error(`unable to locate '${glob}' glob`));
          return;
        }
        await _CopyPlugin.addCompilationDependency(compilation, typeOfFrom, absoluteFrom, null, logger);
        let copiedResult;
        try {
          copiedResult = await throttleAll(concurrency, globEntries.map((globEntry) => async () => {
            if (pattern.filter) {
              let isFiltered;
              try {
                isFiltered = await pattern.filter(globEntry);
              } catch (error) {
                compilation.errors.push(
                  /** @type {Error} */
                  error
                );
                return;
              }
              if (!isFiltered) {
                logger.log(`skip '${globEntry}', because it was filtered`);
                return;
              }
            }
            const absoluteFilename = path.normalize(globEntry);
            logger.debug(`found '${absoluteFilename}'`);
            const to = typeof pattern.to === "function" ? await pattern.to({
              context: pattern.context,
              absoluteFilename
            }) : path.normalize(typeof pattern.to !== "undefined" ? pattern.to : "");
            const toType = pattern.toType || (template.test(to) ? "template" : path.extname(to) === "" || to.slice(-1) === path.sep ? "dir" : "file");
            logger.log(`'to' option '${to}' determinated as '${toType}'`);
            const relativeFilename = path.relative(pattern.context, absoluteFilename);
            let filename = toType === "dir" ? path.join(to, relativeFilename) : to;
            if (path.isAbsolute(filename)) {
              filename = path.relative(
                /** @type {string} */
                compiler.options.output.path,
                filename
              );
            }
            logger.log(`determined that '${absoluteFilename}' should write to '${filename}'`);
            const sourceFilename = getNormalizePath()(path.relative(compiler.context, absoluteFilename));
            if (typeOfFrom === "dir" || typeOfFrom === "glob") {
              compilation.fileDependencies.add(absoluteFilename);
              logger.debug(`added '${absoluteFilename}' as a file dependency`);
            }
            let cacheEntry;
            logger.debug(`getting cache for '${absoluteFilename}'...`);
            try {
              cacheEntry = await cache.getPromise(`${sourceFilename}|${index}`, null);
            } catch (error) {
              compilation.errors.push(
                /** @type {Error} */
                error
              );
              return;
            }
            let source;
            if (cacheEntry) {
              logger.debug(`found cache for '${absoluteFilename}'...`);
              let isValidSnapshot;
              logger.debug(`checking snapshot on valid for '${absoluteFilename}'...`);
              try {
                isValidSnapshot = await _CopyPlugin.checkSnapshotValid(compilation, cacheEntry.snapshot);
              } catch (error) {
                compilation.errors.push(
                  /** @type {Error} */
                  error
                );
                return;
              }
              if (isValidSnapshot) {
                logger.debug(`snapshot for '${absoluteFilename}' is valid`);
                ({
                  source
                } = cacheEntry);
              } else {
                logger.debug(`snapshot for '${absoluteFilename}' is invalid`);
              }
            } else {
              logger.debug(`missed cache for '${absoluteFilename}'`);
            }
            if (!source) {
              const startTime = Date.now();
              logger.debug(`reading '${absoluteFilename}'...`);
              let data;
              try {
                data = await readFile(inputFileSystem, absoluteFilename);
              } catch (error) {
                compilation.errors.push(
                  /** @type {Error} */
                  error
                );
                return;
              }
              logger.debug(`read '${absoluteFilename}'`);
              source = new RawSource(data);
              let snapshot;
              logger.debug(`creating snapshot for '${absoluteFilename}'...`);
              try {
                snapshot = await _CopyPlugin.createSnapshot(compilation, startTime, absoluteFilename);
              } catch (error) {
                compilation.errors.push(
                  /** @type {Error} */
                  error
                );
                return;
              }
              if (snapshot) {
                logger.debug(`created snapshot for '${absoluteFilename}'`);
                logger.debug(`storing cache for '${absoluteFilename}'...`);
                try {
                  await cache.storePromise(`${sourceFilename}|${index}`, null, {
                    source,
                    snapshot
                  });
                } catch (error) {
                  compilation.errors.push(
                    /** @type {Error} */
                    error
                  );
                  return;
                }
                logger.debug(`stored cache for '${absoluteFilename}'`);
              }
            }
            if (pattern.transform) {
              const transformObj = typeof pattern.transform === "function" ? {
                transformer: pattern.transform
              } : pattern.transform;
              if (transformObj.transformer) {
                logger.log(`transforming content for '${absoluteFilename}'...`);
                const buffer = source.buffer();
                if (transformObj.cache) {
                  const hasher = compiler.webpack.util.createHash(
                    /** @type {string} */
                    compilation.outputOptions.hashFunction
                  );
                  const defaultCacheKeys = {
                    version,
                    sourceFilename,
                    transform: transformObj.transformer,
                    contentHash: hasher.update(buffer).digest("hex"),
                    index
                  };
                  const cacheKeys = `transform|${getSerializeJavascript()(typeof transformObj.cache === "boolean" ? defaultCacheKeys : typeof transformObj.cache.keys === "function" ? await transformObj.cache.keys(defaultCacheKeys, absoluteFilename) : {
                    ...defaultCacheKeys,
                    ...transformObj.cache.keys
                  })}`;
                  logger.debug(`getting transformation cache for '${absoluteFilename}'...`);
                  const cacheItem = cache.getItemCache(cacheKeys, cache.getLazyHashedEtag(source));
                  source = await cacheItem.getPromise();
                  logger.debug(source ? `found transformation cache for '${absoluteFilename}'` : `no transformation cache for '${absoluteFilename}'`);
                  if (!source) {
                    const transformed = await transformObj.transformer(buffer, absoluteFilename);
                    source = new RawSource(transformed);
                    logger.debug(`caching transformation for '${absoluteFilename}'...`);
                    await cacheItem.storePromise(source);
                    logger.debug(`cached transformation for '${absoluteFilename}'`);
                  }
                } else {
                  source = new RawSource(await transformObj.transformer(buffer, absoluteFilename));
                }
              }
            }
            let info = typeof pattern.info === "undefined" ? {} : typeof pattern.info === "function" ? pattern.info({
              absoluteFilename,
              sourceFilename,
              filename,
              toType
            }) || {} : pattern.info || {};
            if (toType === "template") {
              logger.log(`interpolating template '${filename}' for '${sourceFilename}'...`);
              const contentHash = _CopyPlugin.getContentHash(compiler, compilation, source.buffer());
              const ext = path.extname(sourceFilename);
              const base = path.basename(sourceFilename);
              const name = base.slice(0, base.length - ext.length);
              const data = {
                filename: getNormalizePath()(relativeFilename),
                contentHash,
                chunk: {
                  name,
                  id: (
                    /** @type {string} */
                    sourceFilename
                  ),
                  hash: contentHash
                }
              };
              const {
                path: interpolatedFilename,
                info: assetInfo
              } = compilation.getPathWithInfo(getNormalizePath()(filename), data);
              info = {
                ...info,
                ...assetInfo
              };
              filename = interpolatedFilename;
              logger.log(`interpolated template '${filename}' for '${sourceFilename}'`);
            } else {
              filename = getNormalizePath()(filename);
            }
            return {
              sourceFilename,
              absoluteFilename,
              filename,
              source,
              info,
              force: pattern.force
            };
          }));
        } catch (error) {
          compilation.errors.push(
            /** @type {Error} */
            error
          );
          return;
        }
        if (copiedResult.length === 0) {
          if (pattern.noErrorOnMissing) {
            logger.log(`finished to process a pattern from '${pattern.from}' using '${pattern.context}' context to '${pattern.to}'`);
            return;
          }
          compilation.errors.push(new Error(`Unable to locate '${glob}' glob after filtering paths`));
          return;
        }
        logger.log(`finished to process a pattern from '${pattern.from}' using '${pattern.context}' context`);
        return copiedResult;
      }
      /**
       * @param {Compiler} compiler the compiler
       */
      apply(compiler) {
        const pluginName = this.constructor.name;
        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
          const logger = compilation.getLogger("copy-webpack-plugin");
          const cache = compilation.getCache("CopyWebpackPlugin");
          let globby;
          compilation.hooks.processAssets.tapAsync({
            name: PLUGIN_NAME,
            stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
          }, async (unusedAssets, callback) => {
            if (typeof globby === "undefined") {
              try {
                globby = await getTinyGlobby().glob;
              } catch (error) {
                callback(
                  /** @type {Error} */
                  error
                );
                return;
              }
            }
            logger.log("starting to add additional assets...");
            const concurrency = this.options.concurrency || 100;
            const copiedResultMap = /* @__PURE__ */ new Map();
            await throttleAll(
              // Should be enough, it might be worth considering an option for this, but in real configurations it usually doesn't exceed this value
              // https://github.com/webpack/copy-webpack-plugin/issues/627
              2,
              this.patterns.map((item, index) => async () => {
                const pattern = typeof item === "string" ? {
                  from: item
                } : {
                  ...item
                };
                const context = typeof pattern.context === "undefined" ? compiler.context : path.isAbsolute(pattern.context) ? pattern.context : path.join(compiler.context, pattern.context);
                pattern.context = context;
                let copiedResult2;
                try {
                  copiedResult2 = await _CopyPlugin.glob(
                    globby,
                    compiler,
                    compilation,
                    logger,
                    cache,
                    concurrency,
                    /** @type {ObjectPattern & { context: string }} */
                    pattern,
                    index
                  );
                } catch (error) {
                  compilation.errors.push(
                    /** @type {Error} */
                    error
                  );
                  return;
                }
                if (!copiedResult2) {
                  return;
                }
                let filteredCopiedResult = copiedResult2.filter(
                  /**
                   * @param {CopiedResult | undefined} result The result to filter
                   * @returns {result is CopiedResult} True if the result is defined
                   */
                  (result) => result !== void 0
                );
                if (typeof pattern.transformAll !== "undefined") {
                  if (typeof pattern.to === "undefined") {
                    compilation.errors.push(new Error(`Invalid "pattern.to" for the "pattern.from": "${pattern.from}" and "pattern.transformAll" function. The "to" option must be specified.`));
                    return;
                  }
                  filteredCopiedResult.sort((a, b) => a.absoluteFilename > b.absoluteFilename ? 1 : a.absoluteFilename < b.absoluteFilename ? -1 : 0);
                  const mergedEtag = filteredCopiedResult.length === 1 ? cache.getLazyHashedEtag(filteredCopiedResult[0].source) : filteredCopiedResult.reduce(
                    /**
                     * @param {Etag} accumulator merged Etag accumulator
                     * @param {CopiedResult} asset /copied asset to merge Etag with
                     * @param {number} i index of the asset in the array
                     * @returns {Etag} merged Etag
                     */
                    // @ts-expect-error - webpack cache types are incomplete
                    (accumulator, asset, i) => {
                      accumulator = cache.mergeEtags(i === 1 ? cache.getLazyHashedEtag(
                        /** @type {CopiedResult} */
                        accumulator.source
                      ) : accumulator, cache.getLazyHashedEtag(asset.source));
                      return accumulator;
                    }
                  );
                  const cacheItem = cache.getItemCache(`transformAll|${getSerializeJavascript()({
                    version,
                    from: pattern.from,
                    to: pattern.to,
                    transformAll: pattern.transformAll
                  })}`, mergedEtag);
                  let transformedAsset = await cacheItem.getPromise();
                  if (!transformedAsset) {
                    transformedAsset = {
                      filename: pattern.to
                    };
                    try {
                      transformedAsset.data = await pattern.transformAll(filteredCopiedResult.map((asset) => ({
                        data: asset.source.buffer(),
                        sourceFilename: asset.sourceFilename,
                        absoluteFilename: asset.absoluteFilename
                      })));
                    } catch (error) {
                      compilation.errors.push(
                        /** @type {Error} */
                        error
                      );
                      return;
                    }
                    const filename = typeof pattern.to === "function" ? await pattern.to({
                      context
                    }) : pattern.to;
                    if (template.test(filename)) {
                      const contentHash = _CopyPlugin.getContentHash(compiler, compilation, transformedAsset.data);
                      const {
                        path: interpolatedFilename,
                        info: assetInfo
                      } = compilation.getPathWithInfo(getNormalizePath()(filename), {
                        contentHash,
                        chunk: {
                          id: "unknown-copied-asset",
                          hash: contentHash
                        }
                      });
                      transformedAsset.filename = interpolatedFilename;
                      transformedAsset.info = assetInfo;
                    }
                    const {
                      RawSource
                    } = compiler.webpack.sources;
                    transformedAsset.source = new RawSource(transformedAsset.data);
                    transformedAsset.force = pattern.force;
                    await cacheItem.storePromise(transformedAsset);
                  }
                  filteredCopiedResult = [transformedAsset];
                }
                const priority = pattern.priority || 0;
                if (!copiedResultMap.has(priority)) {
                  copiedResultMap.set(priority, /* @__PURE__ */ new Map());
                }
                copiedResultMap.get(priority).set(index, filteredCopiedResult);
              })
            );
            const copiedResult = [...copiedResultMap.entries()].toSorted((a, b) => a[0] - b[0]);
            for (const result of copiedResult.reduce(
              (acc, val) => {
                const sortedByIndex = [...val[1]].toSorted((a, b) => a[0] - b[0]);
                for (const [, item] of sortedByIndex) {
                  acc = [...acc, ...item];
                }
                return acc;
              },
              /** @type {CopiedResult[]} */
              []
            ).filter(Boolean)) {
              const {
                absoluteFilename,
                sourceFilename,
                filename,
                source,
                force
              } = result;
              const existingAsset = compilation.getAsset(filename);
              if (existingAsset) {
                if (force) {
                  const info2 = {
                    copied: true,
                    sourceFilename
                  };
                  logger.log(`force updating '${filename}' from '${absoluteFilename}' to compilation assets, because it already exists...`);
                  compilation.updateAsset(filename, source, {
                    ...info2,
                    ...result.info
                  });
                  logger.log(`force updated '${filename}' from '${absoluteFilename}' to compilation assets, because it already exists`);
                  continue;
                }
                logger.log(`skip adding '${filename}' from '${absoluteFilename}' to compilation assets, because it already exists`);
                continue;
              }
              const info = {
                copied: true,
                sourceFilename
              };
              logger.log(`writing '${filename}' from '${absoluteFilename}' to compilation assets...`);
              compilation.emitAsset(filename, source, {
                ...info,
                ...result.info
              });
              logger.log(`written '${filename}' from '${absoluteFilename}' to compilation assets`);
            }
            logger.log("finished to adding additional assets");
            callback();
          });
          if (compilation.hooks.statsPrinter) {
            compilation.hooks.statsPrinter.tap(pluginName, (stats) => {
              stats.hooks.print.for("asset.info.copied").tap(PLUGIN_NAME, (copied, {
                green,
                formatFlag
              }) => copied ? (
                /** @type {(text: string) => string} */
                green(
                  /** @type {(flag: string) => string} */
                  formatFlag("copied")
                )
              ) : "");
            });
          }
        });
      }
    };
    module.exports = CopyPlugin;
  }
});
export default require_dist6();
/*! Bundled license information:

normalize-path/index.js:
  (*!
   * normalize-path <https://github.com/jonschlinkert/normalize-path>
   *
   * Copyright (c) 2014-2018, Jon Schlinkert.
   * Released under the MIT License.
   *)

is-extglob/index.js:
  (*!
   * is-extglob <https://github.com/jonschlinkert/is-extglob>
   *
   * Copyright (c) 2014-2016, Jon Schlinkert.
   * Licensed under the MIT License.
   *)

is-glob/index.js:
  (*!
   * is-glob <https://github.com/jonschlinkert/is-glob>
   *
   * Copyright (c) 2014-2017, Jon Schlinkert.
   * Released under the MIT License.
   *)
*/
