const { readFileSync, writeFileSync, mkdirSync, existsSync } = require("fs");
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
    watchChange(id) {
      // console.log(`File changed: ${id}`);
      if (
        !id.endsWith(".tsx") &&
        !id.endsWith(".jsx") &&
        !id.endsWith(".js") &&
        !id.endsWith(".ts")
      )
        return;
      if (!existsSync(id)) {
        const fileUrl = pathToFileURL(id).href;
        delete manifest[fileUrl];
        clientModules.delete(id);
        return;
      }
      const code = readFileSync(id, "utf8");

      const fileUrl = pathToFileURL(id).href;

      if (/^(['"])use client\1/.test(code.trim())) {
        const relPath =
          "./" + path.relative(process.cwd(), id).replace(/\\/g, "/");
        manifest[fileUrl] = {
          id: relPath,
          chunks: "default",
          name: "default",
        };
        clientModules.add(id);
        this.addWatchFile(id); // Make sure Rollup watches it
      } else {
        // If it was client but is no longer, remove it
        delete manifest[fileUrl];
        clientModules.delete(id);
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
