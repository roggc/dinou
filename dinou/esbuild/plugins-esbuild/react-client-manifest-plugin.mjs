// plugins-esbuild/react-client-manifest-plugin.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import parseExports from "../../core/parse-exports.js";
import { useClientRegex } from "../../constants.js";

export default function reactClientManifestPlugin({
  manifestPath = "react_client_manifest/react-client-manifest.json",
  manifest = {},
} = {}) {
  return {
    name: "react-client-manifest",
    setup(build) {
      build.onEnd(async (result) => {
        try {
          const meta = result.metafile;
          if (meta && meta.outputs) {
            for (const [outFile, outInfo] of Object.entries(meta.outputs)) {
              const fileName = outFile.replace(/\\/g, "/").split(/[/\\]/).pop();
              const outUrl = "/" + fileName;
              const modulePath = outInfo.entryPoint;
              if (!modulePath || modulePath.startsWith("dinou-asset-entry:")) {
                continue;
              }
              const absModulePath = path.resolve(modulePath);
              const baseFileUrl = pathToFileURL(absModulePath).href;
              const code = readFileSync(absModulePath, "utf8");
              const isClientModule = useClientRegex.test(code.trim());
              if (!isClientModule) {
                // console.log(
                //   `[react-client-manifest]   Skipping non-client module: ${baseFileUrl}`
                // );
                continue;
              }
              const exports = parseExports(code);
              for (const expName of exports) {
                const manifestKey =
                  expName === "default"
                    ? baseFileUrl
                    : `${baseFileUrl}#${expName}`;
                if (manifest[manifestKey]) {
                  manifest[manifestKey].id = outUrl;
                }
              }
            }
          }

          // Ensure directory exists
          await fs.mkdir(path.dirname(manifestPath), { recursive: true });

          // Write merged manifest
          await fs.writeFile(
            manifestPath,
            JSON.stringify(manifest, null, 2),
            "utf8"
          );
        } catch (err) {
          console.warn("[react-client-manifest] onEnd error:", err.message);
        }
      });
    }, // end setup
  };
}
