// dinou/core/env.js
// Server & build-time .env* hierarchy loader, live dev hot-reloader,
// TypeScript .env key scanner, and DINOU_PUBLIC_* bundler replacement builder.

import fs from "node:fs";
import path from "node:path";
import { DINOU_PUBLIC_PREFIX, isDotEnvFileName } from "./runtime-env.js";

const ENV_LOADER_STATE_KEY = Symbol.for("dinou.env.loaderState");

function getLoaderStateMap() {
  if (typeof globalThis === "undefined") return new Map();
  if (!globalThis[ENV_LOADER_STATE_KEY]) {
    globalThis[ENV_LOADER_STATE_KEY] = new Map();
  }
  return globalThis[ENV_LOADER_STATE_KEY];
}

const LINE_KEY_REGEX = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.]*)\s*=\s*(.*)$/;
const VALID_TS_ENV_IDENT_REGEX = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const RESERVED_PROCESS_ENV_KEYS = new Set(["NODE_ENV", "TZ"]);

function unescapeDoubleQuotedValue(raw) {
  return raw.replace(/\\([nrt"'\\])/g, (_match, ch) => {
    switch (ch) {
      case "n":
        return "\n";
      case "r":
        return "\r";
      case "t":
        return "\t";
      case '"':
        return '"';
      case "'":
        return "'";
      case "\\":
        return "\\";
      default:
        return ch;
    }
  });
}

function findClosingQuoteIndex(str, quoteChar, allowEscapes) {
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (allowEscapes && ch === "\\") {
      i++;
      continue;
    }
    if (ch === quoteChar) {
      return i;
    }
  }
  return -1;
}

function stripUnquotedInlineComment(val) {
  for (let i = 0; i < val.length; i++) {
    if (val[i] === "#" && (i === 0 || /\s/.test(val[i - 1]))) {
      return val.slice(0, i).trim();
    }
  }
  return val.trim();
}

/**
 * Parses `.env` file contents compatibly with `dotenv@16` (UTF-8 BOM, comments,
 * optional `export `, single/double/backtick quotes, multiline strings, escapes).
 *
 * @param {string} rawContent
 * @returns {Record<string, string>}
 */
export function parseDotEnv(rawContent) {
  const result = {};
  if (typeof rawContent !== "string" || rawContent.length === 0) {
    return result;
  }

  const normalized = rawContent
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = LINE_KEY_REGEX.exec(line);
    if (!match) {
      continue;
    }

    const key = match[1];
    const rest = match[2] ?? "";

    if (rest.length === 0) {
      result[key] = "";
      continue;
    }

    const firstChar = rest[0];
    if (firstChar === '"' || firstChar === "'" || firstChar === "`") {
      const allowEscapes = firstChar === '"' || firstChar === "`";
      let afterOpen = rest.slice(1);
      let closeIdx = findClosingQuoteIndex(afterOpen, firstChar, allowEscapes);

      if (closeIdx !== -1) {
        const inner = afterOpen.slice(0, closeIdx);
        result[key] =
          firstChar === '"' ? unescapeDoubleQuotedValue(inner) : inner;
        continue;
      }

      // Multiline quoted value
      const chunks = [afterOpen];
      while (lineIdx + 1 < lines.length) {
        lineIdx++;
        const nextLine = lines[lineIdx];
        const nextClose = findClosingQuoteIndex(
          nextLine,
          firstChar,
          allowEscapes
        );
        if (nextClose !== -1) {
          chunks.push(nextLine.slice(0, nextClose));
          break;
        }
        chunks.push(nextLine);
      }
      const joined = chunks.join("\n");
      result[key] =
        firstChar === '"' ? unescapeDoubleQuotedValue(joined) : joined;
      continue;
    }

    result[key] = stripUnquotedInlineComment(rest);
  }

  return result;
}

/**
 * Returns the ordered `.env*` file names from highest priority to lowest priority
 * for a given `mode` (`development`, `production`, `test`, etc.).
 *
 * Precedence (after real OS / CLI environment variables):
 * 1. `.env.<mode>.local`
 * 2. `.env.local` (skipped when `mode === "test"`)
 * 3. `.env.<mode>`
 * 4. `.env`
 */
export function getEnvFileHierarchy(mode) {
  const resolvedMode =
    String(
      mode ||
        (typeof process !== "undefined" && process.env?.NODE_ENV) ||
        "development"
    ).trim() || "development";

  const candidates = [
    `.env.${resolvedMode}.local`,
    ...(resolvedMode !== "test" ? [".env.local"] : []),
    `.env.${resolvedMode}`,
    ".env",
  ];

  return Array.from(new Set(candidates));
}

/**
 * Reads and merges `.env*` files from `projectRoot` without mutating `process.env`.
 */
export function readEnvFilesMap(projectRoot = ".", options = {}) {
  const cwd = path.resolve(
    projectRoot ||
      (typeof process !== "undefined" && typeof process.cwd === "function"
        ? process.cwd()
        : ".")
  );
  const mode =
    String(
      options.mode ||
        (typeof process !== "undefined" && process.env?.NODE_ENV) ||
        "development"
    ).trim() || "development";

  const hierarchy = getEnvFileHierarchy(mode);
  const mergedValues = {};
  const loadedFiles = [];

  for (const fileName of hierarchy) {
    const filePath = path.join(cwd, fileName);
    try {
      if (!fs.existsSync(filePath)) continue;
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = parseDotEnv(raw);
      loadedFiles.push(fileName);
      for (const [k, v] of Object.entries(parsed)) {
        if (!(k in mergedValues)) {
          mergedValues[k] = v;
        }
      }
    } catch {}
  }

  return {
    cwd,
    mode,
    loadedFiles,
    values: mergedValues,
  };
}

/**
 * Collects currently active `DINOU_PUBLIC_*` environment variables from `process.env`
 * and `Deno.env` (if running under Deno).
 */
export function getPublicEnvVars() {
  const pub = {};

  if (
    typeof Deno !== "undefined" &&
    Deno &&
    Deno.env &&
    typeof Deno.env.toObject === "function"
  ) {
    try {
      const denoVars = Deno.env.toObject();
      for (const key of Object.keys(denoVars).sort()) {
        if (key.startsWith(DINOU_PUBLIC_PREFIX) && denoVars[key] !== undefined) {
          pub[key] = String(denoVars[key]);
        }
      }
    } catch {}
  }

  if (
    typeof process !== "undefined" &&
    process &&
    process.env &&
    typeof process.env === "object"
  ) {
    for (const key of Object.keys(process.env).sort()) {
      if (
        key.startsWith(DINOU_PUBLIC_PREFIX) &&
        process.env[key] !== undefined
      ) {
        pub[key] = String(process.env[key]);
      }
    }
  }

  return pub;
}

/**
 * Loads the `.env*` hierarchy from `projectRoot` into `process.env` (and `Deno.env`
 * when available), never overriding real OS/CLI environment variables already set
 * before Dinou started. Supports `{ reload: true }` for hot-reloading `.env*` edits
 * during `dinou dev`.
 */
export function loadEnvFiles(projectRoot, options = {}) {
  const resolvedRoot = path.resolve(
    projectRoot ||
      (typeof process !== "undefined" && typeof process.cwd === "function"
        ? process.cwd()
        : ".")
  );
  const mode =
    String(
      options.mode ||
        (typeof process !== "undefined" && process.env?.NODE_ENV) ||
        "development"
    ).trim() || "development";

  const stateMap = getLoaderStateMap();
  const prevState = stateMap.get(resolvedRoot);

  if (prevState && prevState.mode === mode && !options.reload) {
    return {
      cwd: resolvedRoot,
      mode,
      loadedFiles: prevState.loadedFiles,
      values: prevState.values,
      publicEnv: getPublicEnvVars(),
      changed: false,
      publicEnvChanged: false,
    };
  }

  // If reloading or switching mode in the same process, remove keys previously injected from .env*
  if (prevState) {
    if (
      typeof process !== "undefined" &&
      process &&
      process.env &&
      prevState.injectedKeys
    ) {
      for (const key of prevState.injectedKeys) {
        try {
          delete process.env[key];
        } catch {}
      }
    }
    if (
      typeof Deno !== "undefined" &&
      Deno &&
      Deno.env &&
      typeof Deno.env.delete === "function" &&
      prevState.injectedDenoKeys
    ) {
      for (const key of prevState.injectedDenoKeys) {
        try {
          Deno.env.delete(key);
        } catch {}
      }
    }
  }

  const { loadedFiles, values } = readEnvFilesMap(resolvedRoot, { mode });
  const injectedKeys = new Set();
  const injectedDenoKeys = new Set();

  for (const [key, val] of Object.entries(values)) {
    if (
      typeof process !== "undefined" &&
      process &&
      process.env &&
      process.env[key] === undefined
    ) {
      try {
        process.env[key] = val;
        injectedKeys.add(key);
      } catch {}
    }

    if (
      typeof Deno !== "undefined" &&
      Deno &&
      Deno.env &&
      typeof Deno.env.get === "function" &&
      typeof Deno.env.set === "function"
    ) {
      try {
        if (Deno.env.get(key) === undefined) {
          Deno.env.set(key, val);
          injectedDenoKeys.add(key);
        }
      } catch {}
    }
  }

  const publicEnv = getPublicEnvVars();
  const publicSnapshot = JSON.stringify(publicEnv);
  const allSnapshot = JSON.stringify(values);

  const changed = prevState ? prevState.allSnapshot !== allSnapshot : true;
  const publicEnvChanged = prevState
    ? prevState.publicSnapshot !== publicSnapshot
    : Object.keys(publicEnv).length > 0;

  stateMap.set(resolvedRoot, {
    mode,
    loadedFiles,
    values,
    injectedKeys,
    injectedDenoKeys,
    publicSnapshot,
    allSnapshot,
  });

  return {
    cwd: resolvedRoot,
    mode,
    loadedFiles,
    values,
    publicEnv,
    changed,
    publicEnvChanged,
  };
}

/**
 * Scans `.env*` and `.env.example` files in `projectRoot` and returns ONLY valid
 * TypeScript identifier key names (never values) for `.dinou/types/routes.d.ts`.
 */
export function collectDeclaredEnvKeys(projectRoot = ".") {
  const cwd = path.resolve(
    projectRoot ||
      (typeof process !== "undefined" && typeof process.cwd === "function"
        ? process.cwd()
        : ".")
  );
  const keys = new Set();

  try {
    if (!fs.existsSync(cwd)) return [];
    const entries = fs.readdirSync(cwd, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!isDotEnvFileName(entry.name)) continue;
      try {
        const raw = fs.readFileSync(path.join(cwd, entry.name), "utf8");
        const parsed = parseDotEnv(raw);
        for (const key of Object.keys(parsed)) {
          if (
            VALID_TS_ENV_IDENT_REGEX.test(key) &&
            !RESERVED_PROCESS_ENV_KEYS.has(key)
          ) {
            keys.add(key);
          }
        }
      } catch {}
    }
  } catch {}

  return Array.from(keys).sort();
}

/**
 * Builds the sanitized public environment dictionary `{ NODE_ENV, ...DINOU_PUBLIC_*, ...extra }`
 * safe for Client Components and SSR Pass B (`ssr-engine`).
 */
export function getPublicEnvObject(options = {}) {
  const mode =
    String(
      options.mode ||
        (typeof process !== "undefined" && process.env?.NODE_ENV) ||
        "development"
    ).trim() || "development";

  const publicVars = getPublicEnvVars();
  const obj = {
    NODE_ENV: mode,
    ...publicVars,
  };

  if (options.extra && typeof options.extra === "object") {
    for (const [k, v] of Object.entries(options.extra)) {
      if (v !== undefined) {
        obj[k] = String(v);
      }
    }
  }

  return obj;
}

/**
 * Generates Esbuild `define` entries for Client bundles and Dual-Engine passes.
 * - When `defineProcessEnvObject !== false` (Client bundles & Pass B SSR), also defines
 *   `"process.env"` to the sanitized `publicEnvObject` so non-public `process.env.*`
 *   evaluates safely to `undefined` without leaking server secrets or throwing `ReferenceError`.
 * - When `defineProcessEnvObject === false` (Pass A RSC server bundles), only defines
 *   `NODE_ENV`, `DINOU_PUBLIC_*`, and `extra` keys while keeping `process.env` live for secrets.
 */
export function getEsbuildPublicEnvDefines(options = {}) {
  const defineProcessEnvObject = options.defineProcessEnvObject !== false;
  const pubObj = getPublicEnvObject(options);
  const defines = {};

  for (const key of Object.keys(pubObj).sort()) {
    defines[`process.env.${key}`] = JSON.stringify(pubObj[key]);
  }

  if (defineProcessEnvObject) {
    defines["process.env"] = JSON.stringify(pubObj);
  }

  return defines;
}

/**
 * Generates Rollup `@rollup/plugin-replace` maps:
 * - `exactValues`: replaces `process.env.NODE_ENV` and `process.env.DINOU_PUBLIC_*`
 * - `objectValues`: replaces remaining standalone/member `process.env` expressions
 *   using `delimiters: ["(?<!\\.)\\b", "\\b"]` so `process.env.SECRET` evaluates to `undefined`.
 */
export function getRollupPublicEnvReplacements(options = {}) {
  const pubObj = getPublicEnvObject(options);
  const exactValues = {};
  for (const key of Object.keys(pubObj).sort()) {
    exactValues[`process.env.${key}`] = JSON.stringify(pubObj[key]);
  }
  return {
    exactValues,
    objectValues: {
      "process.env": `(${JSON.stringify(pubObj)})`,
    },
  };
}

/**
 * Generates Webpack `DefinePlugin` definitions for Client bundles (both dev and prod).
 * Wraps `"process.env"` in parentheses `({...})` so statement-position expressions
 * (e.g. `process.env[key] = val` analyzed by Webpack's production `ConcatenatedModule`
 * parser) parse as valid parenthesized object expressions rather than block statements.
 */
export function getWebpackPublicEnvDefines(options = {}) {
  const defines = getEsbuildPublicEnvDefines({
    ...options,
    defineProcessEnvObject: true,
  });
  if (defines["process.env"]) {
    defines["process.env"] = `(${defines["process.env"]})`;
  }
  return defines;
}

/**
 * Returns true when `filePath` is a `.env` or `.env.*` file in the root directory.
 */
export function isWatchedDotEnvFile(filePath, projectRoot = ".") {
  if (!filePath || typeof filePath !== "string") return false;
  const absFile = path.resolve(filePath);
  const absRoot = path.resolve(projectRoot);
  if (path.dirname(absFile).toLowerCase() !== absRoot.toLowerCase()) {
    return false;
  }
  return isDotEnvFileName(path.basename(absFile));
}

export default {
  DINOU_PUBLIC_PREFIX,
  isDotEnvFileName,
  parseDotEnv,
  getEnvFileHierarchy,
  readEnvFilesMap,
  getPublicEnvVars,
  loadEnvFiles,
  collectDeclaredEnvKeys,
  getPublicEnvObject,
  getEsbuildPublicEnvDefines,
  getRollupPublicEnvReplacements,
  getWebpackPublicEnvDefines,
  isWatchedDotEnvFile,
};

