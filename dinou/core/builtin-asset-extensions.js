// dinou/core/builtin-asset-extensions.js
// Canonical, zero-dependency single source of truth for Dinou's built-in static
// media, vector, audio/video, and font asset extensions.

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

export const BUILTIN_ASSET_EXTENSIONS = extensions;

export const DEFAULT_EXTENSIONS_SET = new Set(extensions);

const escapeRegExp = (str) =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const globPattern = `**/*.{${extensions.join(",")}}`;

// Regex useful for Rollup/Webpack/PostCSS/Esbuild asset matching
export const regex = new RegExp(
  `\\.(${extensions.map(escapeRegExp).join("|")})$`,
  "i"
);

export const BUILTIN_ASSET_REGEX = regex;

// Version with leading dot for direct comparisons
export const extensionsWithDot = extensions.map((ext) => `.${ext}`);

export default {
  extensions,
  BUILTIN_ASSET_EXTENSIONS,
  DEFAULT_EXTENSIONS_SET,
  globPattern,
  regex,
  BUILTIN_ASSET_REGEX,
  extensionsWithDot,
};

