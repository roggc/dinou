// postcss-extract-plugin.js
const fs = require("fs");
const path = require("path");

let cachedExtractedCSS = "";
let cachedCSSBuffer = null;

const createPostCSSExtractPlugin = (options = {}) => {
  const { outputFile = "styles.css", shouldExtract = () => true } = options;

  let currentExtractedCSS = "";

  // Define the PostCSS plugin to intercept and extract CSS rules
  const postcssPlugin = {
    postcssPlugin: "postcss-extract",

    OnceExit(root, { result }) {
      const filePath = result.opts.from;

      if (shouldExtract(filePath, root)) {
        currentExtractedCSS += root.toString();
        currentExtractedCSS += "\n";

        // Remove all CSS rules from the original file to prevent duplicate injection
        root.removeAll();
      }
    },
  };

  // Write the collected CSS contents to the final output file on disk or memory
  const finalize = () => {
    if (currentExtractedCSS) {
      cachedExtractedCSS = currentExtractedCSS;
      cachedCSSBuffer = Buffer.from(cachedExtractedCSS);
      currentExtractedCSS = "";
    }

    if (!cachedCSSBuffer) return;

    // 1. Ensure it's ALWAYS stored in globalThis.__DINOU_MEM_FILES__
    if (typeof globalThis !== "undefined") {
      if (!globalThis.__DINOU_MEM_FILES__) {
        globalThis.__DINOU_MEM_FILES__ = new Map();
      }
      globalThis.__DINOU_MEM_FILES__.set("styles.css", cachedCSSBuffer);
      globalThis.__DINOU_MEM_FILES__.set("/styles.css", cachedCSSBuffer);
    }

    // 2. Only write to disk if explicitly requested
    const shouldWriteToDisk = process.env.DINOU_WRITE_TO_DISK === "true";
    if (shouldWriteToDisk && cachedExtractedCSS) {
      const outputDir = path.dirname(outputFile);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(outputFile, cachedExtractedCSS);
    }
  };

  return {
    plugin: postcssPlugin,
    finalize,
  };
};

module.exports = createPostCSSExtractPlugin;
