import parseExports from "../../core/parse-exports.js";
import { pathToFileURL } from "node:url";
import path from "node:path";

export function updateManifestForModule(
  absPath,
  code,
  isClientModule,
  manifest
) {
  const fileUrl = pathToFileURL(absPath).href;
  const relPath =
    "./" + path.relative(process.cwd(), absPath).replace(/\\/g, "/");

  // Remove previous entries for this fileUrl prefix
  for (const key in manifest) {
    if (key.startsWith(fileUrl)) {
      delete manifest[key];
    }
  }

  if (isClientModule) {
    const exports = parseExports(code);
    for (const expName of exports) {
      const manifestKey =
        expName === "default" ? fileUrl : `${fileUrl}#${expName}`;
      manifest[manifestKey] = {
        id: relPath,
        chunks: expName,
        name: expName,
      };
    }
  }
}
