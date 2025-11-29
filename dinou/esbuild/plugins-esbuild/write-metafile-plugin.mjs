import fs from "node:fs/promises";

export default function writeMetafilePlugin() {
  return {
    name: "write-metafile",
    setup(build) {
      build.onEnd(async (result) => {
        if (result.metafile) {
          // Write the metafile to the project root
          await fs.writeFile("./meta.json", JSON.stringify(result.metafile));
          console.log("✓ Metafile written to ./meta.json");
        }
      });
    },
  };
}
