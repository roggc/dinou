import path from "node:path";
import {
  getAssetExtensionsInfo,
  getAssetInfo,
  resolveAssetImport,
} from "../../core/asset-extensions.js";

function dinouAssetPlugin({
  include = null,
  dinouConfig = null,
  projectRoot = process.cwd(),
  emitFiles = true,
} = {}) {
  const rootDir = path.resolve(projectRoot || process.cwd());
  let cleanRegex =
    include || getAssetExtensionsInfo(dinouConfig, rootDir).regex;
  let emittedInCurrentBuild = new Set();

  return {
    name: "dinou-asset-plugin",
    buildStart() {
      cleanRegex =
        include || getAssetExtensionsInfo(dinouConfig, rootDir).regex;
      emittedInCurrentBuild = new Set();
    },
    resolveId(source, importer) {
      if (!source || source.startsWith("\0")) return null;
      const cleanSpec = source.split("?")[0].split("#")[0];
      if (!cleanRegex.test(cleanSpec)) return null;
      const resolved = resolveAssetImport(source, {
        importer: importer || "",
        projectRoot: rootDir,
        assetRegex: cleanRegex,
      });
      return resolved || null;
    },
    async load(id) {
      if (!id || id.startsWith("\0")) return null;
      const cleanId = id.split("?")[0].split("#")[0];
      if (!cleanRegex.test(cleanId)) return null;

      this.addWatchFile(cleanId);

      const info = getAssetInfo(cleanId, rootDir, {
        includeBuffer: emitFiles,
      });

      if (emitFiles && info.buffer) {
        const sharedEmitted =
          typeof globalThis !== "undefined"
            ? globalThis.__DINOU_EMITTED_ASSETS__ ||
              (globalThis.__DINOU_EMITTED_ASSETS__ = new Set())
            : null;
        if (
          !emittedInCurrentBuild.has(info.fileName) &&
          (!sharedEmitted || !sharedEmitted.has(info.fileName))
        ) {
          emittedInCurrentBuild.add(info.fileName);
          sharedEmitted?.add(info.fileName);
          this.emitFile({
            type: "asset",
            fileName: info.fileName,
            source: info.buffer,
          });
        }
      }

      return `export default ${JSON.stringify(info.publicUrl)};`;
    },
  };
}

export { dinouAssetPlugin };
export default dinouAssetPlugin;
