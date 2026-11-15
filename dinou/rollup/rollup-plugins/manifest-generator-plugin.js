import fs from "node:fs/promises";
import path from "node:path";

const manifestData = {};

function manifestGeneratorPlugin() {
  return {
    name: "manifest-generator",
    async generateBundle(options, bundle) {
      for (const key of Object.keys(manifestData)) {
        delete manifestData[key];
      }

      for (const [fileName, info] of Object.entries(bundle)) {
        if (info.type === "chunk" && info.name) {
          const cleanName = info.name + ".js";
          manifestData[cleanName] = fileName;
        }
      }

      const dist1Dir = path.resolve(process.cwd(), ".dinou/dist1");
      await fs.mkdir(dist1Dir, { recursive: true });
      await fs.writeFile(
        path.join(dist1Dir, "manifest.json"),
        JSON.stringify(manifestData, null, 2),
        "utf8"
      );
    },
  };
}

manifestGeneratorPlugin.manifestData = manifestData;

export { manifestGeneratorPlugin };
export default manifestGeneratorPlugin;
