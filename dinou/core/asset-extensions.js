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
];

export const globPattern = `**/*.{${extensions.join(",")}}`;

// 🔹 regex useful for Rollup/PostCSS type plugins
export const regex = new RegExp(`\\.(${extensions.join("|")})$`, "i");

// 🔹 version with dot for direct comparisons
export const extensionsWithDot = extensions.map((ext) => `.${ext}`);

export default { extensions, extensionsWithDot, regex, globPattern };
