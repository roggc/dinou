const fs = require("fs");
const path = require("path");
const createScopedName = require("../dinou/createScopedName.js");

function dinouAssetPlugin({
  include = /\.(png|jpe?g|gif|svg|webp|avif|ico|mp4|webm|ogg|mov|avi|mkv|mp3|wav|flac|m4a|aac|mjpeg|mjpg)$/i,
} = {}) {
  return {
    name: "dinou-asset-plugin",
    async load(id) {
      if (!include.test(id)) return null;

      const source = await fs.promises.readFile(id);

      const base = path.basename(id, path.extname(id));
      const scoped = createScopedName(base, id);
      const ext = path.extname(id);

      const fileName = `assets/${scoped}${ext}`;

      this.emitFile({
        type: "asset",
        fileName,
        source,
      });

      return `export default '/assets/${scoped}${ext}';`;
    },
  };
}

module.exports = dinouAssetPlugin;
