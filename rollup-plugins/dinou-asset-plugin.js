// near the top of rollup.config.js
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

      // lee fichero (Buffer)
      const source = await fs.promises.readFile(id);

      // calcula nombre scoped (reemplaza base + ruta por lo que espera tu createScopedName)
      const base = path.basename(id, path.extname(id));
      const scoped = createScopedName(base, id);
      const ext = path.extname(id);

      // aquí defines el fileName final en output
      const fileName = `assets/${scoped}${ext}`;

      // emite asset y consigue ref
      const referenceId = this.emitFile({
        type: "asset",
        fileName,
        source,
      });

      // devuelve módulo JS que exporta la URL del asset
      // Rollup reemplazará import.meta.ROLLUP_FILE_URL_<ref> con la URL final
      // return `export default import.meta.ROLLUP_FILE_URL_${referenceId};`;
      return `export default '/assets/${scoped}${ext}';`;
    },
  };
}

module.exports = dinouAssetPlugin;
