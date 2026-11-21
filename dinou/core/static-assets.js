import path from "node:path";
import { isDotEnvFileName } from "./runtime-env.js";

export const STATIC_MIME_TYPES = Object.freeze({
  // Scripts, WASM & Source Maps
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".cjs": "application/javascript; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".wasm": "application/wasm",

  // Styles, Documents, SEO & Web Manifests
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".rss": "application/rss+xml; charset=utf-8",
  ".atom": "application/atom+xml; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".ics": "text/calendar; charset=utf-8",
  ".vtt": "text/vtt; charset=utf-8",

  // Images & Icons
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",
  ".apng": "image/apng",
  ".hdr": "image/vnd.radiance",

  // Fonts
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",

  // Documents, 3D Models & Archives
  ".pdf": "application/pdf",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".zip": "application/zip",
  ".gz": "application/gzip",

  // Video & Audio
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".mjpeg": "video/x-motion-jpeg",
  ".mjpg": "video/x-motion-jpeg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".opus": "audio/opus",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
});

export const PUBLIC_STATIC_EXT_REGEX =
  /\.(?:js|mjs|cjs|css|map|wasm|png|jpg|jpeg|gif|svg|ico|webp|avif|bmp|apng|hdr|woff|woff2|ttf|eot|otf|txt|xml|rss|atom|json|webmanifest|html|htm|pdf|glb|gltf|csv|md|ics|vtt|mp4|webm|ogv|mov|avi|mkv|mjpeg|mjpg|mp3|wav|ogg|opus|m4a|aac|flac|zip|gz)$/i;

const IMMUTABLE_CHUNK_REGEX =
  /^[^/]+-(?:[A-Z0-9]{8}|[a-f0-9]{16,32}|(?=[A-Za-z0-9_-]{8}\.)(?=[A-Za-z0-9_-]*[A-Z0-9])[A-Za-z0-9_-]{8})\.(?:js|mjs|cjs|css)(?:\.map)?$/;

// Reserved internal subdirectory inside `.dinou/cloudflare/assets/` where
// `dinou build:cloudflare` places pre-rendered `.dinou/dist2` SSG/ISR/PPR/Slot
// cache files so `.dinou/dist3` stays 100% pure and never collides with `public/`.
export const CLOUDFLARE_DIST2_NAMESPACE = "__dinou_dist2";

const DIST2_EXPORTABLE_BASENAMES = new Set([
  "index.html",
  "page.rsc",
  "layout.rsc",
]);

export const STATIC_EXPORT_SCRIPT =
  "<script>window.__DINOU_STATIC_EXPORT__=true;</script>";

/**
 * Resolves the HTTP Content-Type header for a static file path or URL pathname.
 * Handles extensionless RFC / Universal Links files such as `apple-app-site-association`.
 */
export function getStaticContentType(pathnameOrFilePath) {
  if (!pathnameOrFilePath || typeof pathnameOrFilePath !== "string") {
    return "application/octet-stream";
  }
  const normalized = pathnameOrFilePath.replace(/\\/g, "/");
  const baseLower = (normalized.split("/").pop() || "").toLowerCase();
  if (baseLower === "apple-app-site-association") {
    return "application/json; charset=utf-8";
  }
  const dotIdx = baseLower.lastIndexOf(".");
  if (dotIdx === -1) {
    return "application/octet-stream";
  }
  const ext = baseLower.slice(dotIdx);
  return STATIC_MIME_TYPES[ext] || "application/octet-stream";
}

/**
 * Returns true when an incoming URL pathname targets the reserved internal
 * `/__dinou_dist2/*` namespace inside Cloudflare's `env.ASSETS` directory.
 */
export function isReservedCloudflareDist2RequestPath(pathname) {
  if (!pathname || typeof pathname !== "string") return false;
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {}
  const firstSeg =
    decoded.replace(/\\/g, "/").replace(/^\/+/, "").split("/")[0] || "";
  return firstSeg.toLowerCase() === CLOUDFLARE_DIST2_NAMESPACE;
}

/**
 * Returns true when a normalized POSIX path refers to an OS metadata file or
 * Dinou's reserved internal `/__dinou_dist2/*` Cloudflare asset namespace,
 * ensuring it is never served publicly.
 */
export function isInternalDinouAssetPath(relPosixPath) {
  if (!relPosixPath || typeof relPosixPath !== "string") return true;
  const clean = relPosixPath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!clean) return true;

  const segments = clean.split("/").filter(Boolean);
  if (segments.length === 0) return true;

  if (segments[0].toLowerCase() === CLOUDFLARE_DIST2_NAMESPACE) {
    return true;
  }

  const baseLower = segments[segments.length - 1].toLowerCase();
  if (
    baseLower === ".ds_store" ||
    baseLower === "thumbs.db" ||
    isDotEnvFileName(baseLower)
  ) {
    return true;
  }

  if (segments.some((seg) => isDotEnvFileName(seg))) {
    return true;
  }

  return false;
}

/**
 * Safely URL-decodes and validates an incoming HTTP URL `pathname` for public static
 * asset lookup. Rejects malformed `%` encodings, null bytes, backslash separators,
 * `.` / `..` traversal segments, hidden dotfiles (except RFC 8615 `/.well-known/*`),
 * and internal Dinou engine artifacts.
 *
 * @returns {string | null} Clean relative POSIX path (without leading `/`), or `null` if disallowed.
 */
export function normalizePublicRequestPath(pathname) {
  if (
    !pathname ||
    typeof pathname !== "string" ||
    !pathname.startsWith("/") ||
    pathname === "/" ||
    pathname.includes("\0")
  ) {
    return null;
  }

  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  if (decoded.includes("\0") || decoded.includes("\\")) {
    return null;
  }

  const rawSegments = decoded.split("/");
  if (rawSegments.some((seg) => seg === "." || seg === "..")) {
    return null;
  }

  const segments = rawSegments.filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  // Block hidden dotfiles & dot-directories except RFC 8615 /.well-known/<file>
  const hasDotSegment = segments.some((seg) => seg.startsWith("."));
  if (hasDotSegment) {
    const isValidWellKnown =
      segments[0] === ".well-known" &&
      segments.length >= 2 &&
      segments.slice(1).every((seg) => !seg.startsWith("."));
    if (!isValidWellKnown) {
      return null;
    }
  }

  const relPosixPath = segments.join("/");
  if (isInternalDinouAssetPath(relPosixPath)) {
    return null;
  }

  return relPosixPath;
}

/**
 * Resolves a validated relative POSIX path inside `baseDir` and verifies strict
 * filesystem containment so no path can escape `baseDir`.
 *
 * @returns {string | null} Absolute filesystem path inside `baseDir`, or `null` if unsafe.
 */
export function resolveConfinedStaticFile(baseDir, relPosixPath) {
  if (
    !baseDir ||
    !relPosixPath ||
    typeof relPosixPath !== "string" ||
    relPosixPath.includes("\0") ||
    relPosixPath.includes("\\")
  ) {
    return null;
  }
  const segments = relPosixPath.split("/").filter(Boolean);
  if (segments.length === 0 || segments.some((seg) => seg === "." || seg === "..")) {
    return null;
  }

  const rootDir = path.resolve(baseDir);
  const rootPrefix = rootDir.endsWith(path.sep) ? rootDir : rootDir + path.sep;
  const resolved = path.resolve(rootDir, ...segments);
  if (!resolved.startsWith(rootPrefix)) {
    return null;
  }
  return resolved;
}

/**
 * Determines whether a relative asset path in `.dinou/dist3` is content-hashed
 * (safe for 1-year `immutable` caching) vs unhashed (`public/` files, `styles.css`).
 */
export function isImmutableAssetPath(relPosixPath) {
  if (!relPosixPath || typeof relPosixPath !== "string") return false;
  const clean = relPosixPath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!clean) return false;
  return clean.startsWith("assets/") || IMMUTABLE_CHUNK_REGEX.test(clean);
}

/**
 * Returns the production `Cache-Control` header value for a static asset.
 * Content-hashed bundler chunks and `/assets/*` receive `immutable`, whereas
 * unhashed `public/` files (`/robots.txt`, `/sitemap.xml`, `/favicon.ico`, etc.)
 * and unhashed stylesheets receive `public, max-age=0, must-revalidate`.
 */
export function getStaticCacheControl(relPosixPath) {
  return isImmutableAssetPath(relPosixPath)
    ? "public, max-age=31536000, immutable"
    : "public, max-age=0, must-revalidate";
}

/**
 * Determines whether an incoming Edge/Cloudflare Worker request URL `pathname`
 * should be served from the static `env.ASSETS` binding before invoking Dinou's
 * RSC/SSR `handleRequest` pipeline.
 */
export function isPublicStaticAssetRequest(pathname) {
  const relPath = normalizePublicRequestPath(pathname);
  if (!relPath) return false;

  return (
    relPath.startsWith("assets/") ||
    relPath.startsWith("_dinou/") ||
    relPath.startsWith(".well-known/") ||
    PUBLIC_STATIC_EXT_REGEX.test(relPath)
  );
}

/**
 * Filter predicate when copying public static assets from `.dinou/dist3` into
 * `out/` (`dinou export-static`) or `.dinou/cloudflare/assets/` (`dinou build:cloudflare`).
 * Excludes OS metadata junk and the reserved `__dinou_dist2` namespace while
 * preserving all `public/` files (including `.well-known/*` and `.nojekyll`) and client chunks.
 */
export function shouldExportDist3Entry(relPosixPath) {
  if (!relPosixPath || typeof relPosixPath !== "string") return false;
  const clean = relPosixPath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!clean) return false;

  const segments = clean.split("/").filter(Boolean);
  if (segments.length === 0) return false;

  if (segments[0].toLowerCase() === CLOUDFLARE_DIST2_NAMESPACE) {
    return false;
  }

  const baseLower = segments[segments.length - 1].toLowerCase();
  if (
    baseLower === ".ds_store" ||
    baseLower === "thumbs.db" ||
    isDotEnvFileName(baseLower)
  ) {
    return false;
  }

  if (segments.some((seg) => isDotEnvFileName(seg))) {
    return false;
  }

  return true;
}

/**
 * Filter predicate for `dinou export-static` (`export-static.js`) when copying
 * pre-rendered SSG files from `.dinou/dist2` into `out/`.
 * Strictly allowlists `index.html`, `page.rsc`, and `layout.rsc` (outside the
 * internal `slots/` cache namespace) so internal ISR/PPR/Slot metadata JSONs,
 * `shell.*` templates, `rsc.rsc`, `status-manifest.json`, and `._old.` files
 * are never published to static hosts.
 */
export function shouldExportDist2File(relPosixPath) {
  if (!relPosixPath || typeof relPosixPath !== "string") return false;
  const clean = relPosixPath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!clean) return false;

  const segments = clean.split("/").filter(Boolean);
  if (segments.length === 0) return false;

  if (segments[0].toLowerCase() === "slots") {
    return false;
  }

  const baseLower = segments[segments.length - 1].toLowerCase();
  return DIST2_EXPORTABLE_BASENAMES.has(baseLower);
}

/**
 * Reads an internal `.dinou/dist2` SSG/ISR/PPR/Slot artifact from Cloudflare's
 * `env.ASSETS` binding under the isolated `/__dinou_dist2/<key>` namespace.
 * Handles Cloudflare Static Assets HTML canonicalization for `index.html` keys.
 */
export async function fetchCloudflareDist2Asset(
  assetsBinding,
  key,
  baseUrl = "http://localhost"
) {
  if (!assetsBinding || typeof assetsBinding.fetch !== "function" || !key) {
    return null;
  }
  const cleanKey = String(key).replace(/\\/g, "/").replace(/^\/+/, "");
  if (!cleanKey) return null;

  const namespacedKey = `${CLOUDFLARE_DIST2_NAMESPACE}/${cleanKey}`;
  const lowerKey = cleanKey.toLowerCase();
  const isIndexHtml =
    lowerKey === "index.html" || lowerKey.endsWith("/index.html");

  if (!isIndexHtml) {
    const res = await assetsBinding.fetch(
      new Request(new URL(`/${namespacedKey}`, baseUrl))
    );
    return res && res.status === 200 ? res : null;
  }

  const dirRel = cleanKey.slice(0, -"index.html".length).replace(/\/+$/, "");
  const dirNamespace = dirRel
    ? `/${CLOUDFLARE_DIST2_NAMESPACE}/${dirRel}`
    : `/${CLOUDFLARE_DIST2_NAMESPACE}`;
  const candidates = [`${dirNamespace}/`, `/${namespacedKey}`, dirNamespace];

  for (const candidatePath of candidates) {
    const res = await assetsBinding.fetch(
      new Request(new URL(candidatePath, baseUrl))
    );
    if (res && res.status === 200) {
      return res;
    }
  }
  return null;
}

/**
 * Parses an incoming RFC 9110 `Range: bytes=<start>-<end>` HTTP header against `totalSize`.
 * Supports standard `bytes=start-end`, open-ended `bytes=start-`, and suffix `bytes=-length`
 * ranges required by HTML5 `<video>` and `<audio>` scrubbing and Safari media playback.
 *
 * @returns {null | { unsatisfiable: true, contentRange: string } | { unsatisfiable: false, start: number, end: number, length: number, contentRange: string }}
 */
export function parseHttpByteRange(rangeHeader, totalSize) {
  if (
    !rangeHeader ||
    typeof rangeHeader !== "string" ||
    typeof totalSize !== "number" ||
    !Number.isFinite(totalSize) ||
    totalSize < 0
  ) {
    return null;
  }

  const trimmed = rangeHeader.trim();
  if (!trimmed.toLowerCase().startsWith("bytes=")) {
    return null;
  }

  const spec = trimmed.slice(6).trim();
  // Ignore multipart multi-range requests (`bytes=0-50, 100-150`) and serve full 200 per RFC 9110
  if (!spec || spec.includes(",")) {
    return null;
  }

  const dashIdx = spec.indexOf("-");
  if (dashIdx === -1) {
    return null;
  }

  const startStr = spec.slice(0, dashIdx).trim();
  const endStr = spec.slice(dashIdx + 1).trim();

  if (totalSize === 0) {
    return {
      unsatisfiable: true,
      contentRange: "bytes */0",
    };
  }

  let start;
  let end;

  if (startStr === "") {
    // Suffix byte-range-spec: `bytes=-500` (last 500 bytes)
    if (!/^\d+$/.test(endStr)) return null;
    const suffixLength = Number(endStr);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
      return {
        unsatisfiable: true,
        contentRange: `bytes */${totalSize}`,
      };
    }
    start = Math.max(0, totalSize - suffixLength);
    end = totalSize - 1;
  } else {
    if (!/^\d+$/.test(startStr)) return null;
    start = Number(startStr);
    if (!Number.isSafeInteger(start) || start >= totalSize) {
      return {
        unsatisfiable: true,
        contentRange: `bytes */${totalSize}`,
      };
    }
    if (endStr === "") {
      end = totalSize - 1;
    } else {
      if (!/^\d+$/.test(endStr)) return null;
      const parsedEnd = Number(endStr);
      if (!Number.isSafeInteger(parsedEnd) || parsedEnd < start) {
        return {
          unsatisfiable: true,
          contentRange: `bytes */${totalSize}`,
        };
      }
      end = Math.min(parsedEnd, totalSize - 1);
    }
  }

  return {
    unsatisfiable: false,
    start,
    end,
    length: end - start + 1,
    contentRange: `bytes ${start}-${end}/${totalSize}`,
  };
}

/**
 * Injects `<script>window.__DINOU_STATIC_EXPORT__=true;</script>` into exported
 * `index.html` documents so Dinou's client router resolves `/<route>/page.rsc`
 * and `/<layout>/layout.rsc` directly from static hosting instead of hitting
 * server-only `/____rsc_*` endpoints.
 */
export function injectStaticExportFlag(html) {
  if (typeof html !== "string" || html.includes("__DINOU_STATIC_EXPORT__")) {
    return html;
  }
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, (match) => `${STATIC_EXPORT_SCRIPT}${match}`);
  }
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, (match) => `${STATIC_EXPORT_SCRIPT}${match}`);
  }
  return `${STATIC_EXPORT_SCRIPT}${html}`;
}
