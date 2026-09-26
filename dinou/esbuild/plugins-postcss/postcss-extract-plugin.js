// // postcss-extract-plugin.js
const fs = require("fs");
const path = require("path");

const createPostCSSExtractPlugin = (options = {}) => {
  const { outputFile = "styles.css", shouldExtract = () => true } = options;

  let extractedCSS = "";

  // Define the PostCSS plugin to intercept and extract CSS rules
  const postcssPlugin = {
    postcssPlugin: "postcss-extract",

    OnceExit(root, { result }) {
      const filePath = result.opts.from;

      if (shouldExtract(filePath, root)) {
        extractedCSS += root.toString();
        extractedCSS += "\n";

        // Remove all CSS rules from the original file to prevent duplicate injection
        root.removeAll();
      }
    },
  };

  // Write the collected CSS contents to the final output file on disk
  const finalize = () => {
    if (!extractedCSS) return;
    const outputDir = path.dirname(outputFile);

    const shouldWriteToDisk = process.env.DINOU_WRITE_TO_DISK === "true";
    if (shouldWriteToDisk) {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(outputFile, extractedCSS);
    }

    if (typeof globalThis !== "undefined" && globalThis.__DINOU_MEM_FILES__) {
      const buf = Buffer.from(extractedCSS);
      globalThis.__DINOU_MEM_FILES__.set("styles.css", buf);
      globalThis.__DINOU_MEM_FILES__.set("/styles.css", buf);
    }

    extractedCSS = "";
  };

  return {
    plugin: postcssPlugin,
    finalize,
  };
};

module.exports = createPostCSSExtractPlugin;
