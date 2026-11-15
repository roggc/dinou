import fs from "node:fs/promises";
import path from "node:path";

const frameworkEntryNames = ["main", "error", "serverFunctionProxy"];

export default function manifestGeneratorPlugin(manifestData) {
  return {
    name: "manifest-generator",
    setup(build) {
      build.onEnd(async (result) => {
        const meta = result.metafile;
        if (!meta) {
          console.warn(
            "[manifest-generator] Missing metafile: enable `metafile: true` in esbuild config"
          );
          return;
        }

        for (const [outputFile, info] of Object.entries(meta.outputs)) {
          const entryPoint = info.entryPoint;
          if (entryPoint) {
            if (
              !entryPoint.endsWith(".js") &&
              !entryPoint.endsWith(".jsx") &&
              !entryPoint.endsWith(".ts") &&
              !entryPoint.endsWith(".tsx") &&
              !entryPoint.endsWith(".mjs")
            ) {
              continue;
            }
            const normOut = outputFile.replace(/\\/g, "/");
            const fileName = normOut.split("/").pop();
            const entryName = fileName.split("-").shift();
            if (!frameworkEntryNames.includes(entryName)) {
              continue;
            }
            manifestData[entryName + ".js"] = fileName; // e.g. serverFunctionProxy-ABC123.js
          }
        }

        try {
          const dist1Dir = path.resolve(process.cwd(), ".dinou/dist1");

          await fs.mkdir(dist1Dir, { recursive: true });

          await fs.writeFile(
            path.join(dist1Dir, "manifest.json"),
            JSON.stringify(manifestData, null, 2),
            "utf8"
          );
        } catch (e) {
          console.log("Error writing file: ", e.message);
        }
      });
    },
  };
}
