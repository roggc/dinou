// dinou/core/runtime-env.js
// Runtime-agnostic environment helpers with zero Node filesystem/path imports.
// Safe across Node.js, Bun, Deno, Cloudflare Workers (workerd), and Browser bundles.

export const DINOU_PUBLIC_PREFIX = "DINOU_PUBLIC_";

const unifiedEnvCache = typeof WeakMap !== "undefined" ? new WeakMap() : null;
let defaultServerEnvProxy = null;

/**
 * Returns true if a file basename is `.env` or `.env.*` (case-insensitive).
 */
export function isDotEnvFileName(name) {
  if (!name || typeof name !== "string") return false;
  const clean = name.replace(/\\/g, "/").split("/").pop() || "";
  const lower = clean.toLowerCase();
  return lower === ".env" || lower.startsWith(".env.");
}

/**
 * Safely URL-decodes up to two layers so percent-encoded probes such as
 * `/%2eenv`, `/.%65nv`, or `/%252eenv` cannot bypass the Anti-Bot Shield.
 */
function safeDecodePathnameCandidates(pathname) {
  if (!pathname || typeof pathname !== "string") return [];
  const candidates = new Set([pathname]);
  let current = pathname;
  for (let i = 0; i < 2; i++) {
    try {
      const next = decodeURIComponent(current);
      if (next === current) break;
      candidates.add(next);
      current = next;
    } catch {
      break;
    }
  }
  return Array.from(candidates);
}

const BOT_DOT_ENV_SEGMENT_REGEX = /(?:^|\/)\.env(?:\.[a-z0-9_-]+)*(?:\/|$)/i;
const BOT_TRAILING_ENV_EXT_REGEX = /\.env$/i;

/**
 * Returns true when an incoming HTTP URL pathname probes `.env` or `.env.*` files
 * (including nested `/api/.env.local`, `/backup.env`, or URL-encoded `/%2eenv`),
 * without matching legitimate routes such as `/docs/env` or `/docs/env-vars`.
 */
export function isBotEnvProbePath(pathname) {
  const candidates = safeDecodePathnameCandidates(pathname);
  for (const candidate of candidates) {
    const normalized = candidate.replace(/\\/g, "/");
    if (
      BOT_DOT_ENV_SEGMENT_REGEX.test(normalized) ||
      BOT_TRAILING_ENV_EXT_REGEX.test(normalized)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Mirrors plain-text string variables from an Edge/Cloudflare `env` object onto
 * `process.env` when `process.env` is available (e.g. `nodejs_compat`) and the key
 * is not yet populated, preserving live resource bindings untouched.
 */
export function syncEdgeEnvToProcessEnv(platformEnv) {
  if (
    typeof window !== "undefined" ||
    !platformEnv ||
    typeof platformEnv !== "object"
  ) {
    return;
  }
  if (
    typeof process === "undefined" ||
    !process ||
    !process.env ||
    typeof process.env !== "object"
  ) {
    return;
  }
  const procEnv = process.env;
  try {
    for (const key of Object.keys(platformEnv)) {
      const val = platformEnv[key];
      if (typeof val === "string" && procEnv[key] === undefined) {
        try {
          procEnv[key] = val;
        } catch {}
      }
    }
  } catch {}
}

function readFallbackServerEnvValue(prop) {
  if (typeof window !== "undefined" || typeof prop !== "string") {
    return undefined;
  }

  const globalEdgeEnv =
    typeof globalThis !== "undefined" ? globalThis.__DINOU_ENV__ : null;
  if (
    globalEdgeEnv &&
    typeof globalEdgeEnv === "object" &&
    prop in globalEdgeEnv &&
    globalEdgeEnv[prop] !== undefined
  ) {
    return globalEdgeEnv[prop];
  }

  if (
    typeof process !== "undefined" &&
    process &&
    process.env &&
    typeof process.env === "object" &&
    prop in process.env &&
    process.env[prop] !== undefined
  ) {
    return process.env[prop];
  }

  if (
    typeof Deno !== "undefined" &&
    Deno &&
    Deno.env &&
    typeof Deno.env.get === "function"
  ) {
    try {
      const val = Deno.env.get(prop);
      if (val !== undefined) return val;
    } catch {}
  }

  return undefined;
}

function collectFallbackServerEnvKeys() {
  const keys = new Set();
  if (typeof window !== "undefined") return keys;

  const globalEdgeEnv =
    typeof globalThis !== "undefined" ? globalThis.__DINOU_ENV__ : null;
  if (globalEdgeEnv && typeof globalEdgeEnv === "object") {
    try {
      for (const k of Object.keys(globalEdgeEnv)) keys.add(k);
    } catch {}
  }

  if (
    typeof process !== "undefined" &&
    process &&
    process.env &&
    typeof process.env === "object"
  ) {
    try {
      for (const k of Object.keys(process.env)) keys.add(k);
    } catch {}
  }

  if (
    typeof Deno !== "undefined" &&
    Deno &&
    Deno.env &&
    typeof Deno.env.toObject === "function"
  ) {
    try {
      for (const k of Object.keys(Deno.env.toObject())) keys.add(k);
    } catch {}
  }

  return keys;
}

function buildUnifiedEnvProxy(baseTarget) {
  const target = baseTarget && typeof baseTarget === "object" ? baseTarget : {};
  return new Proxy(target, {
    get(t, prop) {
      if (typeof prop === "symbol") {
        return Reflect.get(t, prop, t);
      }
      if (prop in t && t[prop] !== undefined) {
        return Reflect.get(t, prop, t);
      }
      return readFallbackServerEnvValue(prop);
    },
    has(t, prop) {
      if (typeof prop === "symbol") {
        return Reflect.has(t, prop);
      }
      if (prop in t) {
        return true;
      }
      return readFallbackServerEnvValue(prop) !== undefined;
    },
    ownKeys(t) {
      const merged = new Set(Reflect.ownKeys(t));
      for (const k of collectFallbackServerEnvKeys()) {
        merged.add(k);
      }
      return Array.from(merged);
    },
    getOwnPropertyDescriptor(t, prop) {
      if (
        typeof prop === "symbol" ||
        Object.prototype.hasOwnProperty.call(t, prop)
      ) {
        return Object.getOwnPropertyDescriptor(t, prop);
      }
      const val = readFallbackServerEnvValue(prop);
      if (val !== undefined) {
        return {
          configurable: true,
          enumerable: true,
          writable: false,
          value: val,
        };
      }
      return undefined;
    },
  });
}

/**
 * Creates a zero-copy unified server `env` view for `getContext().env` and `req.env`
 * across Cloudflare Workers (preserving live KV, D1, R2, and ASSETS bindings),
 * Node.js, Bun, Deno, Netlify, and SSG/ISR contexts.
 */
export function createUnifiedEnv(platformEnv) {
  if (typeof window !== "undefined") {
    return {};
  }

  const hasCustomTarget =
    platformEnv &&
    typeof platformEnv === "object" &&
    Object.keys(platformEnv).length > 0;

  if (!hasCustomTarget) {
    if (!defaultServerEnvProxy) {
      defaultServerEnvProxy = buildUnifiedEnvProxy({});
    }
    return defaultServerEnvProxy;
  }

  if (unifiedEnvCache) {
    const cached = unifiedEnvCache.get(platformEnv);
    if (cached) return cached;
    const created = buildUnifiedEnvProxy(platformEnv);
    unifiedEnvCache.set(platformEnv, created);
    return created;
  }

  return buildUnifiedEnvProxy(platformEnv);
}

export default {
  DINOU_PUBLIC_PREFIX,
  isDotEnvFileName,
  isBotEnvProbePath,
  syncEdgeEnvToProcessEnv,
  createUnifiedEnv,
};

