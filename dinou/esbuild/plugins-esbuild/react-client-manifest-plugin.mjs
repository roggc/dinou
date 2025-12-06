// plugins-esbuild/react-client-manifest-plugin.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

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
              if (!modulePath) {
                continue;
              }
              const absModulePath = path.resolve(modulePath);
              const baseFileUrl = pathToFileURL(absModulePath).href;
              if (manifest[baseFileUrl]) manifest[baseFileUrl].id = outUrl;
            }
          }

          // ---- NEW BLOCK: check if manifestPath exists ----
          // let finalManifest = {};

          // try {
          //   const existing = await fs.readFile(manifestPath, "utf8");
          //   const oldManifest = JSON.parse(existing);

          //   // "Append" -> merge old + new (new overrides old)
          //   finalManifest = { ...oldManifest, ...manifest };
          // } catch (e) {
          //   // File does not exist -> write new manifest
          //   finalManifest = manifest;
          // }

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
