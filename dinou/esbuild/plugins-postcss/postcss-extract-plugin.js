// postcss-extract-plugin.js
import fs from "node:fs";
import path from "node:path";
import esbuild from "esbuild";
import { normalizePathCase } from "../../core/path-utils.js";

function normalizeFileKey(filePath) {
  if (!filePath || typeof filePath !== "string") return "";
  return normalizePathCase(path.resolve(filePath)).replace(/\\/g, "/");
}

const createPostCSSExtractPlugin = (options = {}) => {
  const { outputFile = "styles.css", shouldExtract = () => true } = options;

  // Per-file CSS map so incremental rebuilds never wipe unchanged stylesheets
  const extractedByFile = new Map();
  let lastFinalizedCSS = null;
  let cachedCSSBuffer = null;

  const setExtractedCss = (filePath, cssText) => {
    const key = normalizeFileKey(filePath);
    if (!key) return;
    extractedByFile.set(key, {
      filePath: path.resolve(filePath),
      css: cssText || "",
    });
  };

  const getExtractedCss = (filePath) => {
    const key = normalizeFileKey(filePath);
    return key ? extractedByFile.get(key)?.css : undefined;
  };

  // Define the PostCSS plugin to intercept and extract CSS rules
  const postcssPlugin = {
    postcssPlugin: "postcss-extract",

    OnceExit(root, { result }) {
      const filePath = result.opts.from;

      if (shouldExtract(filePath, root)) {
        const cssText = root.toString();
        if (filePath) {
          setExtractedCss(filePath, cssText);
        }

        // Remove all CSS rules from the original file to prevent duplicate injection
        root.removeAll();
      }
    },
  };

  // Write the collected CSS contents to the final output file on disk or memory
  const finalize = () => {
    const isProduction = process.env.NODE_ENV === "production";
    const parts = [];

    for (const [key, entry] of extractedByFile.entries()) {
      if (entry.filePath && !fs.existsSync(entry.filePath)) {
        extractedByFile.delete(key);
        continue;
      }
      if (entry.css) {
        parts.push(entry.css);
      }
    }

    let combinedCSS = parts.length > 0 ? parts.join("\n") + "\n" : "";

    if (isProduction && combinedCSS) {
      try {
        combinedCSS = esbuild.transformSync(combinedCSS, {
          loader: "css",
          minify: true,
        }).code;
      } catch (e) {}
    }

    const changed = lastFinalizedCSS !== null && combinedCSS !== lastFinalizedCSS;
    lastFinalizedCSS = combinedCSS;
    cachedCSSBuffer = Buffer.from(combinedCSS, "utf8");

    // 1. Ensure it's ALWAYS stored in globalThis.__DINOU_MEM_FILES__
    if (typeof globalThis !== "undefined") {
      if (!globalThis.__DINOU_MEM_FILES__) {
        globalThis.__DINOU_MEM_FILES__ = new Map();
      }
      globalThis.__DINOU_MEM_FILES__.set("styles.css", cachedCSSBuffer);
      globalThis.__DINOU_MEM_FILES__.set("/styles.css", cachedCSSBuffer);
    }

    // 2. Write to disk if in production OR if DINOU_WRITE_TO_DISK is requested in dev
    const shouldWriteToDisk =
      process.env.DINOU_WRITE_TO_DISK === "true" || isProduction;
    if (shouldWriteToDisk && (combinedCSS || fs.existsSync(outputFile))) {
      const outputDir = path.dirname(outputFile);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(outputFile, combinedCSS, "utf8");
    }

    return changed;
  };

  const addExtractedCss = (cssText, filePath) => {
    if (filePath) {
      setExtractedCss(filePath, cssText);
    }
  };

  return {
    plugin: postcssPlugin,
    finalize,
    addExtractedCss,
    setExtractedCss,
    getExtractedCss,
  };
};

export { createPostCSSExtractPlugin };
export default createPostCSSExtractPlugin;
