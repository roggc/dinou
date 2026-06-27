// manifest-generator-plugin.js
class ManifestGeneratorPlugin {
  constructor() {
    this.manifestData = {}; // same as in Rollup
  }

  apply(compiler) {
    const pluginName = "ManifestGeneratorPlugin";

    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      const { Compilation } = compiler.webpack;

      // Run when all assets are ready
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          stage: Compilation.PROCESS_ASSETS_STAGE_REPORT,
        },
        (assets) => {
          // Traverse chunks to generate manifest
          for (const chunk of compilation.chunks) {
            if (!chunk.name) continue; // only chunks with a name

            for (const file of chunk.files) {
              if (file.endsWith(".js")) {
                const cleanName = chunk.name + ".js"; // same as Rollup
                this.manifestData[cleanName] = file; // hashed JS file
              }
            }
          }

          // Emit manifest.json
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
