// manifest-generator-plugin.js
import fs from "node:fs";
import path from "node:path";

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
          stage: Compilation.PROCESS_ASSETS_STAGE_ANALYSE,
        },
        () => {
          this.manifestData = {};
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

          if (typeof globalThis !== "undefined") {
            globalThis.__DINOU_RAW_ASSET_MANIFEST__ = { ...this.manifestData };
          }

          const isDev =
            process.env.NODE_ENV !== "production" ||
            process.env.DINOU_DEV === "true";
          const shouldWriteToDisk =
            process.env.DINOU_WRITE_TO_DISK === "false"
              ? false
              : process.env.DINOU_WRITE_TO_DISK === "true" || !isDev;

          if (shouldWriteToDisk) {
            const targetDir = path.resolve(
              process.cwd(),
              isDev ? ".dinou/node-dev" : ".dinou/dist1"
            );
            fs.mkdirSync(targetDir, { recursive: true });
            fs.writeFileSync(
              path.join(targetDir, "manifest.json"),
              JSON.stringify(this.manifestData, null, 2),
              "utf8"
            );
          }
        }
      );
    });
  }
}

const instance = new ManifestGeneratorPlugin();
export { ManifestGeneratorPlugin, instance };
export default instance;
