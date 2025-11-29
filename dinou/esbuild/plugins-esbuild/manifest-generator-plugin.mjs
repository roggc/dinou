import fs from "node:fs/promises";
import path from "node:path";

const frameworkEntryNames = ["main", "error", "serverFunctionProxy"];

export default function manifestGeneratorPlugin(manifestData) {
  return {
    name: "manifest-generator",
    setup(build) {
      const outdir = build.initialOptions.outdir || ".";

      build.onEnd(async (result) => {
        const meta = result.metafile;
        if (!meta) {
          console.warn(
            "[manifest-generator] Missing metafile: enable `metafile: true` in esbuild config"
          );
          return;
        }

        // console.log(
        //   "[manifest-generator] Generating manifest.json...",
        //   meta.outputs
        // );
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
            const entryName = outputFile.split("/").pop().split("-").shift();
            if (!frameworkEntryNames.includes(entryName)) {
              continue;
            }
            manifestData[entryName + ".js"] = outputFile.split("/").pop(); // e.g. client-ABC123.js
          }
        }

        const manifestPath = path.join(outdir, "manifest.json");

        await fs.writeFile(
          manifestPath,
          JSON.stringify(manifestData, null, 2),
          "utf8"
        );
      });
    },
  };
}
