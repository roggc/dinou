// manifest-generator-plugin.js
class ManifestGeneratorPlugin {
  constructor() {
    this.manifestData = {}; // igual que en Rollup
  }

  apply(compiler) {
    const pluginName = "ManifestGeneratorPlugin";

    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      const { Compilation } = compiler.webpack;

      // Ejecutar cuando todos los assets están listos
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          stage: Compilation.PROCESS_ASSETS_STAGE_REPORT,
        },
        (assets) => {
          // Recorrer chunks para generar manifest
          for (const chunk of compilation.chunks) {
            if (!chunk.name) continue; // solo chunks con nombre

            for (const file of chunk.files) {
              if (file.endsWith(".js")) {
                const cleanName = chunk.name + ".js"; // igual que Rollup
                this.manifestData[cleanName] = file; // hashed JS file
              }
            }
          }

          // Emitir manifest.json
          const json = JSON.stringify(this.manifestData, null, 2);

          compilation.emitAsset(
            "manifest.json",
            new compiler.webpack.sources.RawSource(json)
          );
        }
      );
    });
  }
}

module.exports = new ManifestGeneratorPlugin();
