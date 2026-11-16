import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { normalizePathCase } from "./path-utils.js";
import {
  getAbsPathWithExt,
  stripJsonCommentsAndTrailingCommas,
} from "./get-abs-path-with-ext.js";

export const extensions = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "webp",
  "avif",
  "ico",
  "mp4",
  "webm",
  "ogg",
  "mov",
  "avi",
  "mkv",
  "mp3",
  "wav",
  "flac",
  "m4a",
  "aac",
  "mjpeg",
  "mjpg",
  "woff",
  "woff2",
  "ttf",
  "otf",
  "eot",
];

const DEFAULT_EXTENSIONS_SET = new Set(extensions);

const escapeRegExp = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const globPattern = `**/*.{${extensions.join(",")}}`;

// Regex useful for Rollup/Webpack/PostCSS/Esbuild asset matching
export const regex = new RegExp(`\\.(${extensions.map(escapeRegExp).join("|")})$`, "i");

// Version with leading dot for direct comparisons
export const extensionsWithDot = extensions.map((ext) => `.${ext}`);

const syncConfigExtCache = new Map();
const assetHashCache = new Map();

export function normalizeAssetExtension(rawExt) {
  if (typeof rawExt !== "string") return null;
  const cleaned = rawExt.trim().replace(/^\.+/, "").toLowerCase();
  if (!cleaned || !/^[a-z0-9][a-z0-9.+-]*$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

export function normalizeAssetExtensionsList(rawList) {
  if (!Array.isArray(rawList)) return [];
  const result = [];
  const seen = new Set();
  for (const item of rawList) {
    const norm = normalizeAssetExtension(item);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      result.push(norm);
    }
  }
  return result;
}

/**
 * Synchronously inspects `globalThis.__DINOU_CONFIG__` or `dinou.config.{ts,mjs,js,cjs}`
 * to extract user-configured `assetExtensions` when synchronous tools (like `generateRouteTypes`) run.
 */
export function readCustomAssetExtensionsSync(projectRoot = process.cwd()) {
  const rootDir = path.resolve(projectRoot || process.cwd());
  if (
    typeof globalThis !== "undefined" &&
    globalThis.__DINOU_CONFIG__ &&
    globalThis.__DINOU_CONFIG_CWD__ === rootDir &&
    Array.isArray(globalThis.__DINOU_CONFIG__.assetExtensions)
  ) {
    return normalizeAssetExtensionsList(
      globalThis.__DINOU_CONFIG__.assetExtensions
    ).filter((ext) => !DEFAULT_EXTENSIONS_SET.has(ext));
  }

  for (const filename of [
    "dinou.config.ts",
    "dinou.config.mjs",
    "dinou.config.js",
    "dinou.config.cjs",
  ]) {
    const cfgPath = path.join(rootDir, filename);
    if (!fs.existsSync(cfgPath)) continue;
    try {
      const stat = fs.statSync(cfgPath);
      const cached = syncConfigExtCache.get(cfgPath);
      if (cached && cached.mtimeMs === stat.mtimeMs) {
        return cached.customExtensions;
      }
      const raw = fs.readFileSync(cfgPath, "utf8");
      const stripped = stripJsonCommentsAndTrailingCommas(raw);
      const match = stripped.match(/\bassetExtensions\s*:\s*\[([\s\S]*?)\]/);
      const parsed = [];
      if (match && match[1]) {
        const strLiterals = match[1].matchAll(/(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/g);
        for (const lit of strLiterals) {
          const val = lit[1] ?? lit[2] ?? lit[3];
          if (val) parsed.push(val);
        }
      }
      const customExtensions = normalizeAssetExtensionsList(parsed).filter(
        (ext) => !DEFAULT_EXTENSIONS_SET.has(ext)
      );
      syncConfigExtCache.set(cfgPath, {
        mtimeMs: stat.mtimeMs,
        customExtensions,
      });
      return customExtensions;
    } catch (e) {
      return [];
    }
  }
  return [];
}

/**
 * Builds the merged set of built-in + custom `assetExtensions` (from `dinou.config.*`),
 * returning `{ extensions, customExtensions, extensionsWithDot, globPattern, regex, resolveFilterRegex }`.
 */
export function getAssetExtensionsInfo(
  dinouConfigOrList = null,
  projectRoot = process.cwd()
) {
  let rawCustom = [];
  if (Array.isArray(dinouConfigOrList)) {
    rawCustom = dinouConfigOrList;
  } else if (
    dinouConfigOrList &&
    typeof dinouConfigOrList === "object" &&
    Array.isArray(dinouConfigOrList.assetExtensions)
  ) {
    rawCustom = dinouConfigOrList.assetExtensions;
  } else {
    rawCustom = readCustomAssetExtensionsSync(projectRoot);
  }

  const normalizedCustom = normalizeAssetExtensionsList(rawCustom);
  const customExtensions = normalizedCustom.filter(
    (ext) => !DEFAULT_EXTENSIONS_SET.has(ext)
  );
  const merged =
    customExtensions.length > 0
      ? [...extensions, ...customExtensions]
      : extensions;

  const escapedAlternation = merged.map(escapeRegExp).join("|");
  return {
    extensions: merged,
    customExtensions,
    extensionsWithDot: merged.map((ext) => `.${ext}`),
    globPattern:
      merged.length === 1
        ? `**/*.${merged[0]}`
        : `**/*.{${merged.join(",")}}`,
    regex: new RegExp(`\\.(${escapedAlternation})$`, "i"),
    resolveFilterRegex: new RegExp(
      `\\.(${escapedAlternation})(?:[?#].*)?$`,
      "i"
    ),
  };
}

function normalizePosixCasePath(p) {
  return normalizePathCase(path.resolve(p)).replace(/\\/g, "/");
}

function sanitizeAssetBaseName(rawBase) {
  const cleaned = String(rawBase || "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "asset";
}

/**
 * Computes a deterministic, OS-independent, content-and-path-addressed asset descriptor:
 * - `fileName`: `"assets/<name>-<8hex>.<ext>"`
 * - `publicUrl`: `"/assets/<name>-<8hex>.<ext>"`
 * - `hash`: 8-character SHA-256 hex digest of `relPosixPath + "\0" + fileBytes`
 *
 * Cached in memory by `(normAbsPath, normProjectRoot, mtimeMs, size)` so repeated lookups
 * across client, CSS, and server passes are O(1) while automatically invalidating on edits in `dinou dev`.
 */
export function getAssetInfo(
  absFilePath,
  projectRoot = process.cwd(),
  { includeBuffer = false, buffer = null } = {}
) {
  const absPath = path.resolve(absFilePath);
  const normAbs = normalizePosixCasePath(absPath);
  const normRoot = normalizePosixCasePath(projectRoot || process.cwd());
  const relForHash = path.posix.relative(normRoot, normAbs) || path.posix.basename(normAbs);

  let stat = null;
  try {
    stat = fs.statSync(absPath);
  } catch (e) {}

  if (stat && stat.isFile() && !buffer) {
    const cached = assetHashCache.get(normAbs);
    if (
      cached &&
      cached.normRoot === normRoot &&
      cached.mtimeMs === stat.mtimeMs &&
      cached.size === stat.size
    ) {
      if (!includeBuffer) {
        return {
          hash: cached.hash,
          fileName: cached.fileName,
          publicUrl: cached.publicUrl,
        };
      }
      const freshBuf = fs.readFileSync(absPath);
      return {
        hash: cached.hash,
        fileName: cached.fileName,
        publicUrl: cached.publicUrl,
        buffer: freshBuf,
      };
    }
  }

  let fileBuf = buffer;
  if (!fileBuf && stat && stat.isFile()) {
    try {
      fileBuf = fs.readFileSync(absPath);
    } catch (e) {
      fileBuf = null;
    }
  }

  const hasher = crypto.createHash("sha256").update(relForHash);
  if (fileBuf) {
    hasher.update("\0").update(fileBuf);
  }
  const hash = hasher.digest("hex").slice(0, 8);

  const rawExt = path.extname(absPath);
  const ext = rawExt.toLowerCase();
  const safeBase = sanitizeAssetBaseName(path.basename(absPath, rawExt));
  const fileName = `assets/${safeBase}-${hash}${ext}`;
  const publicUrl = `/${fileName}`;

  if (stat && stat.isFile()) {
    assetHashCache.set(normAbs, {
      normRoot,
      mtimeMs: stat.mtimeMs,
      size: stat.size,
      hash,
      fileName,
      publicUrl,
    });
  }

  return includeBuffer
    ? { hash, fileName, publicUrl, buffer: fileBuf }
    : { hash, fileName, publicUrl };
}

export function getAssetFileName(absFilePath, projectRoot = process.cwd()) {
  return getAssetInfo(absFilePath, projectRoot).fileName;
}

export function getAssetPublicUrl(absFilePath, projectRoot = process.cwd()) {
  return getAssetInfo(absFilePath, projectRoot).publicUrl;
}

function mapSwcMirrorDirToOriginal(dirPath, projectRoot) {
  if (!dirPath) return path.resolve(projectRoot);
  const resolvedDir = path.resolve(dirPath);
  const swcRoot = path.resolve(projectRoot, ".dinou", "swc");
  const normDir = normalizePosixCasePath(resolvedDir);
  const normSwc = normalizePosixCasePath(swcRoot);
  if (normDir === normSwc) {
    return path.resolve(projectRoot);
  }
  if (normDir.startsWith(normSwc + "/")) {
    const rel = path.relative(swcRoot, resolvedDir);
    return path.resolve(projectRoot, rel);
  }
  return resolvedDir;
}

function isExistingFile(filePath) {
  if (!filePath) return false;
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch (e) {
    return false;
  }
}

/**
 * Resolves an asset import specifier (relative, `tsconfig.json`/`jsconfig.json` path alias,
 * `.dinou/swc` mirrored client component import, `@/` fallback, or `node_modules` package asset)
 * to an absolute filesystem path.
 */
export function resolveAssetImport(
  specifier,
  {
    importer = "",
    resolveDir = "",
    projectRoot = process.cwd(),
    assetRegex = null,
  } = {}
) {
  if (!specifier || typeof specifier !== "string") return null;
  const cleanSpec = specifier.split("?")[0].split("#")[0];
  if (!cleanSpec) return null;

  const rootDir = path.resolve(projectRoot || process.cwd());
  const activeRegex =
    assetRegex || getAssetExtensionsInfo(null, rootDir).regex;
  if (!activeRegex.test(cleanSpec)) {
    return null;
  }

  if (path.isAbsolute(cleanSpec) && isExistingFile(cleanSpec)) {
    return path.resolve(cleanSpec);
  }

  const rawImporterDir = importer
    ? path.dirname(importer)
    : resolveDir || rootDir;
  const effectiveImporterDir = mapSwcMirrorDirToOriginal(rawImporterDir, rootDir);

  // 1. Resolve via tsconfig.json / jsconfig.json path aliases or ./ ../ relative paths
  const viaAliasOrRel = getAbsPathWithExt(cleanSpec, {
    parentDir: effectiveImporterDir,
    cwd: rootDir,
  });
  if (isExistingFile(viaAliasOrRel)) {
    return path.resolve(viaAliasOrRel);
  }

  // 2. Default `@/` -> `<projectRoot>/src/` fallback when no tsconfig/jsconfig alias matched
  if (cleanSpec.startsWith("@/")) {
    const fallbackAt = path.resolve(rootDir, "src", cleanSpec.slice(2));
    if (isExistingFile(fallbackAt)) {
      return fallbackAt;
    }
  }
  if (cleanSpec.startsWith("~/")) {
    const fallbackTilde = path.resolve(rootDir, "src", cleanSpec.slice(2));
    if (isExistingFile(fallbackTilde)) {
      return fallbackTilde;
    }
  }

  // 3. Direct relative resolution against effectiveImporterDir
  if (cleanSpec.startsWith("./") || cleanSpec.startsWith("../")) {
    const relCandidate = path.resolve(effectiveImporterDir, cleanSpec);
    if (isExistingFile(relCandidate)) {
      return relCandidate;
    }
    return null;
  }

  // 4. Bare package asset specifier from node_modules (e.g. "@fontsource/inter/files/inter.woff2")
  if (!cleanSpec.startsWith("/")) {
    try {
      const req = createRequire(
        path.join(effectiveImporterDir, "__dinou_asset_resolve__.js")
      );
      const resolvedPkgAsset = req.resolve(cleanSpec);
      if (isExistingFile(resolvedPkgAsset)) {
        return path.resolve(resolvedPkgAsset);
      }
    } catch (e) {
      let cur = effectiveImporterDir;
      while (true) {
        const directPkgPath = path.join(cur, "node_modules", cleanSpec);
        if (isExistingFile(directPkgPath)) {
          return path.resolve(directPkgPath);
        }
        const parent = path.dirname(cur);
        if (parent === cur) break;
        cur = parent;
      }
    }
  }

  return null;
}

/**
 * Shared Esbuild plugin for RSC, SSR, and Edge/Server orchestrator passes across
 * Node.js, Cloudflare Workers, Bun, and Deno. Resolves asset imports to the exact
 * same `/assets/<name>-<hash>.<ext>` URL emitted by Dinou's client bundlers.
 */
export function createServerAssetPlugin({
  projectRoot = process.cwd(),
  dinouConfig = null,
  assetRegex = null,
  emitToDevMemory = false,
} = {}) {
  const rootDir = path.resolve(projectRoot || process.cwd());
  const lastEmittedKeyBySource = new Map();

  return {
    name: "dinou-server-asset-plugin",
    setup(build) {
      const extInfo = getAssetExtensionsInfo(dinouConfig, rootDir);
      const cleanRegex = assetRegex || extInfo.regex;
      const filterRegex = assetRegex
        ? new RegExp(
            assetRegex.source.replace(/\\\$$|\$$/, "(?:[?#].*)?$"),
            assetRegex.flags.includes("i") ? "i" : `${assetRegex.flags}i`
          )
        : extInfo.resolveFilterRegex;

      build.onResolve({ filter: filterRegex }, (args) => {
        const resolved = resolveAssetImport(args.path, {
          importer: args.importer,
          resolveDir: args.resolveDir,
          projectRoot: rootDir,
          assetRegex: cleanRegex,
        });
        if (!resolved) return null;
        return { path: resolved, namespace: "dinou-server-asset" };
      });

      build.onLoad({ filter: /.*/, namespace: "dinou-server-asset" }, (args) => {
        const info = getAssetInfo(args.path, rootDir, {
          includeBuffer: emitToDevMemory,
        });

        if (emitToDevMemory && info.buffer) {
          const sourceKey = normalizePosixCasePath(args.path);
          const prevFileName = lastEmittedKeyBySource.get(sourceKey);
          if (
            prevFileName &&
            prevFileName !== info.fileName &&
            typeof globalThis !== "undefined" &&
            globalThis.__DINOU_MEM_FILES__
          ) {
            globalThis.__DINOU_MEM_FILES__.delete(prevFileName);
            globalThis.__DINOU_MEM_FILES__.delete("/" + prevFileName);
            globalThis.__DINOU_MEM_FILES__.delete(path.basename(prevFileName));
          }
          lastEmittedKeyBySource.set(sourceKey, info.fileName);

          if (typeof globalThis !== "undefined") {
            if (!globalThis.__DINOU_MEM_FILES__) {
              globalThis.__DINOU_MEM_FILES__ = new Map();
            }
            globalThis.__DINOU_MEM_FILES__.set(info.fileName, info.buffer);
            globalThis.__DINOU_MEM_FILES__.set("/" + info.fileName, info.buffer);
            globalThis.__DINOU_MEM_FILES__.set(
              path.basename(info.fileName),
              info.buffer
            );
          }

          if (process.env.DINOU_WRITE_TO_DISK === "true") {
            try {
              const outAssetPath = path.resolve(
                rootDir,
                ".dinou/public",
                info.fileName
              );
              fs.mkdirSync(path.dirname(outAssetPath), { recursive: true });
              fs.writeFileSync(outAssetPath, info.buffer);
            } catch (e) {}
          }
        }

        return {
          contents: `export default ${JSON.stringify(info.publicUrl)};`,
          loader: "js",
          watchFiles: [args.path],
        };
      });
    },
  };
}

export default {
  extensions,
  extensionsWithDot,
  regex,
  globPattern,
  normalizeAssetExtension,
  normalizeAssetExtensionsList,
  readCustomAssetExtensionsSync,
  getAssetExtensionsInfo,
  getAssetInfo,
  getAssetFileName,
  getAssetPublicUrl,
  resolveAssetImport,
  createServerAssetPlugin,
};
