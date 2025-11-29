const extensions = [
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

const globPattern = `**/*.{${extensions.join(",")}}`;

// 🔹 regex útil para plugins tipo Rollup/PostCSS
const regex = new RegExp(`\\.(${extensions.join("|")})$`, "i");

// 🔹 versión con punto para comparaciones directas
const extensionsWithDot = extensions.map((ext) => `.${ext}`);

module.exports = { extensions, extensionsWithDot, regex, globPattern };
