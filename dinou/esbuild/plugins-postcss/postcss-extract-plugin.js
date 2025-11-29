// // postcss-extract-plugin.js
const fs = require("fs");
const path = require("path");

const createPostCSSExtractPlugin = (options = {}) => {
  const { outputFile = "styles.css", shouldExtract = () => true } = options;

  let extractedCSS = "";

  // El plugin de PostCSS propiamente dicho
  const postcssPlugin = {
    postcssPlugin: "postcss-extract",

    OnceExit(root, { result }) {
      const filePath = result.opts.from;

      if (shouldExtract(filePath, root)) {
        extractedCSS += root.toString();
        extractedCSS += "\n";

        // Limpia el CSS original
        root.removeAll();
      }
    },
  };

  // Función para finalizar
  const finalize = () => {
    if (!extractedCSS) return;
    const outputDir = path.dirname(outputFile);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputFile, extractedCSS);

    extractedCSS = "";
  };

  return {
    plugin: postcssPlugin,
    finalize,
  };
};

module.exports = createPostCSSExtractPlugin;
