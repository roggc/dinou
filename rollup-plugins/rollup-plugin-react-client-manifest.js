const { readFileSync, writeFileSync, mkdirSync } = require("fs");
const path = require("path");
const { dirname } = require("path");
const glob = require("fast-glob");
const { pathToFileURL } = require("url");

function reactClientManifestPlugin({
  srcDir = path.resolve("src"),
  manifestPath = "public/react-client-manifest.json",
} = {}) {
  const manifest = {};
  const clientModules = new Set();

  return {
    name: "react-client-manifest",

    async buildStart() {
      const files = await glob(["**/*.{js,jsx,ts,tsx}"], {
        cwd: srcDir,
        absolute: true,
      });

      for (const absPath of files) {
        const code = readFileSync(absPath, "utf8");

        // Detects 'use client' directive at the top of the file
        if (!/^(['"])use client\1/.test(code.trim())) continue;

        const fileUrl = pathToFileURL(absPath).href;
        const relPath =
          "./" + path.relative(process.cwd(), absPath).replace(/\\/g, "/");

        manifest[fileUrl] = {
          id: relPath,
          chunks: "default",
          name: "default",
        };

        clientModules.add(absPath);

        // 👇 Emits this module as a separate chunk entry
        this.emitFile({
          type: "chunk",
          id: absPath,
          name: path.basename(absPath, path.extname(absPath)), // ex: 'counter'
        });
      }
    },

    generateBundle(outputOptions, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== "chunk") continue;

        for (const modulePath of Object.keys(chunk.modules)) {
          const absModulePath = path.resolve(modulePath);
          const fileUrl = pathToFileURL(absModulePath).href;

          if (manifest[fileUrl]) {
            // manifest[fileUrl].chunks.push(fileName);
            manifest[fileUrl].id = "/" + fileName;
          }
        }
      }

      const serialized = JSON.stringify(manifest, null, 2);
      mkdirSync(dirname(manifestPath), { recursive: true });
      writeFileSync(manifestPath, serialized);
      // console.log(`✅ react-client-manifest.json written to ${manifestPath}`);
    },
  };
}

module.exports = reactClientManifestPlugin;
