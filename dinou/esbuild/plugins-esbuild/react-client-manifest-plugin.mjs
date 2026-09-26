// plugins-esbuild/react-client-manifest-plugin.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import parseExports from "../../core/parse-exports.js";
import { useClientRegex } from "../../constants.js";

export default function reactClientManifestPlugin({
  manifestPath = ".dinou/react_client_manifest/react-client-manifest.json",
  manifest = {},
  onManifestUpdated,
} = {}) {
  return {
    name: "react-client-manifest",
    setup(build) {
      build.onEnd(async (result) => {
        const tRcm0 = Date.now();
        let manifestChanged = false;
        try {
          const meta = result.metafile;
          if (meta && meta.outputs) {
            // Group manifest keys by base file URL for O(1) matching
            const manifestPrefixMap = new Map();
            for (const key of Object.keys(manifest)) {
              const base = key.split("#")[0];
              let list = manifestPrefixMap.get(base);
              if (!list) {
                list = [];
                manifestPrefixMap.set(base, list);
              }
              list.push(key);
            }

            for (const [outFile, outInfo] of Object.entries(meta.outputs)) {
              const fileName = outFile.replace(/\\/g, "/").split(/[/\\]/).pop();
              const outUrl = "/" + fileName;
              const modulePath = outInfo.entryPoint;
              if (!modulePath || modulePath.startsWith("dinou-asset-entry:")) {
                continue;
              }
              const absModulePath = path.resolve(modulePath);
              const baseFileUrl = pathToFileURL(absModulePath).href;

              const relatedKeys = manifestPrefixMap.get(baseFileUrl);
              if (relatedKeys) {
                for (const key of relatedKeys) {
                  manifest[key].id = outUrl;
                }
              }
            }
          }

          // Ensure directory exists
          await fs.mkdir(path.dirname(manifestPath), { recursive: true });

          // Write merged manifest only if changed
          const serialized = JSON.stringify(manifest, null, 2);
          try {
            const old = await fs.readFile(manifestPath, "utf8");
            if (old !== serialized) manifestChanged = true;
          } catch (e) {
            manifestChanged = true;
          }

          if (manifestChanged) {
            await fs.writeFile(
              manifestPath,
              serialized,
              "utf8"
            );
          }
        } catch (err) {
          console.warn("[react-client-manifest] onEnd error:", err.message);
        } finally {
          globalThis.__DINOU_RCM_TIME__ = Date.now() - tRcm0;
        }

        if (manifestChanged && onManifestUpdated) {
          await onManifestUpdated();
        }
      });
    }, // end setup
  };
}
