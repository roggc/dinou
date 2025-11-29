const fs = require("fs");
const path = require("path");
const createScopedName = require("../../core/createScopedName.js");
const { regex } = require("../../core/asset-extensions.js");

function dinouAssetPlugin({ include = regex } = {}) {
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
