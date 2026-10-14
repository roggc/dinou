import { existsSync } from "node:fs";

export default function skipMissingEntryPointsPlugin() {
  let checkedOnce = false;
  return {
    name: "skip-missing-entry-points",
    setup(build) {
      build.onStart(async () => {
        if (checkedOnce) return;
        checkedOnce = true;
        const entryPoints = build.initialOptions.entryPoints;
        if (!entryPoints || typeof entryPoints === "string") return;

        const missingEntries = [];
        for (const [name, path] of Object.entries(entryPoints)) {
          if (!existsSync(path)) {
            missingEntries.push({ name, path });
          }
        }

        if (missingEntries.length > 0) {
          // console.log(
          //   "Skipping build due to missing entry points:",
          //   missingEntries.map((e) => e.path)
          // );
          return {
            warnings: [
              {
                text: "Missing entry points, skipping build. Neglect following error logs if any.",
              },
            ],
          }; // Return errors to cancel build
        }
      });
    },
  };
}
