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

        try {
          const outDir = path.resolve(process.cwd(), outdir);

          await fs.mkdir(outDir, { recursive: true });

          await fs.writeFile(
            path.join(outDir, "manifest.json"),
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
