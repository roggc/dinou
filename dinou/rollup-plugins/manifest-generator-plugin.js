let manifestData = {};

function manifestGeneratorPlugin() {
  return {
    name: "manifest-generator",
    generateBundle(options, bundle) {
      for (const [fileName, info] of Object.entries(bundle)) {
        if (info.type === "chunk" && info.name) {
          const cleanName = info.name + ".js";
          manifestData[cleanName] = fileName;
        }
      }

      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: JSON.stringify(manifestData, null, 2),
      });
    },
  };
}

manifestGeneratorPlugin.manifestData = manifestData;

module.exports = manifestGeneratorPlugin;
