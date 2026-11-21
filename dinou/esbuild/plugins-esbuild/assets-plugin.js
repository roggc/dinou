import fs from "node:fs";
import path from "node:path";
import {
  getAssetExtensionsInfo,
  getAssetInfo,
  resolveAssetImport,
} from "../../core/asset-extensions.js";

const normKey = (p) => {
  if (!p) return "";
  let s = path.resolve(p).replace(/\\/g, "/");
  if (process.platform === "win32") {
    s = s.replace(/^([a-zA-Z]):/, (_, d) => d.toLowerCase() + ":");
  }
  return s;
};

export default function assetsPlugin({
  include = null,
  dinouConfig = null,
  projectRoot = process.cwd(),
  serverAssetPaths = [],
  changedIds,
} = {}) {
  const rootDir = path.resolve(projectRoot || process.cwd());
  const emittedAssetsBySource = new Map();

  function recordEmittedAsset(absSourcePath) {
    if (!absSourcePath || !fs.existsSync(absSourcePath)) return null;
    const info = getAssetInfo(absSourcePath, rootDir, { includeBuffer: true });
    if (!info.buffer) return info;

    const sourceKey = normKey(absSourcePath);
    const prev = emittedAssetsBySource.get(sourceKey);
    if (
      prev &&
      prev.fileName !== info.fileName &&
      typeof globalThis !== "undefined" &&
      globalThis.__DINOU_MEM_FILES__
    ) {
      globalThis.__DINOU_MEM_FILES__.delete(prev.fileName);
      globalThis.__DINOU_MEM_FILES__.delete("/" + prev.fileName);
      globalThis.__DINOU_MEM_FILES__.delete(path.basename(prev.fileName));
    }

    emittedAssetsBySource.set(sourceKey, {
      sourcePath: path.resolve(absSourcePath),
      fileName: info.fileName,
      contents: info.buffer,
    });
    return info;
  }

  return {
    name: "assets-plugin",
    setup(build) {
      const outdir = build.initialOptions.outdir;
      if (!outdir) {
        throw new Error("assetsPlugin requires outdir to be set");
      }

      build.initialOptions.assetNames = "assets/[name]-[hash]";

      const extInfo = getAssetExtensionsInfo(dinouConfig, rootDir);
      const cleanRegex = include || extInfo.regex;
      const filterRegex = include
        ? new RegExp(
            include.source.replace(/\\\$$|\$$/, "(?:[?#].*)?$"),
            include.flags.includes("i") ? "i" : `${include.flags}i`
          )
        : extInfo.resolveFilterRegex;

      build.onResolve({ filter: filterRegex }, async (args) => {
        if (args.pluginData?.inAssetPlugin) return null;

        let resolvedPath =
          args.kind === "entry-point"
            ? path.resolve(rootDir, args.path)
            : resolveAssetImport(args.path, {
                importer: args.importer,
                resolveDir: args.resolveDir,
                projectRoot: rootDir,
                assetRegex: cleanRegex,
              });

        if (!resolvedPath) {
          try {
            const res = await build.resolve(args.path, {
              resolveDir: args.resolveDir,
              kind: args.kind,
              pluginData: { inAssetPlugin: true },
            });
            if (res && res.path) {
              resolvedPath = res.path;
            }
          } catch (e) {}
        }

        if (!resolvedPath) return null;

        if (args.kind === "entry-point") {
          return {
            path: resolvedPath,
            namespace: "dinou-asset-entry",
          };
        }

        return {
          path: resolvedPath,
          namespace: "dinou-asset",
        };
      });

      const loadAssetModule = async (args) => {
        const info = recordEmittedAsset(args.path);
        const publicUrl =
          info?.publicUrl || getAssetInfo(args.path, rootDir).publicUrl;
        return {
          contents: `export default ${JSON.stringify(publicUrl)};`,
          loader: "js",
          watchFiles: [args.path],
        };
      };

      build.onLoad({ filter: /.*/, namespace: "dinou-asset" }, loadAssetModule);
      build.onLoad(
        { filter: /.*/, namespace: "dinou-asset-entry" },
        loadAssetModule
      );

      build.onEnd(async (result) => {
        const tAssets0 = Date.now();
        try {
          if (!result || !Array.isArray(result.outputFiles)) return;

          if (Array.isArray(serverAssetPaths) && serverAssetPaths.length > 0) {
            for (const serverAssetPath of serverAssetPaths) {
              recordEmittedAsset(serverAssetPath);
            }
          }

          if (changedIds && changedIds.size > 0) {
            for (const changedPath of changedIds) {
              if (cleanRegex.test(changedPath) && fs.existsSync(changedPath)) {
                recordEmittedAsset(changedPath);
              }
            }
          }

          const existingDestKeys = new Set(
            result.outputFiles.map((f) => normKey(f.path))
          );

          for (const [sourceKey, asset] of emittedAssetsBySource.entries()) {
            if (!fs.existsSync(asset.sourcePath)) {
              emittedAssetsBySource.delete(sourceKey);
              continue;
            }
            const destPath = path.resolve(outdir, asset.fileName);
            const destKey = normKey(destPath);
            if (existingDestKeys.has(destKey)) continue;
            existingDestKeys.add(destKey);

            const contents = asset.contents;
            result.outputFiles.push({
              path: destPath,
              contents,
              get text() {
                return new TextDecoder().decode(this.contents);
              },
            });
          }
        } finally {
          globalThis.__DINOU_ASSETS_TIME__ = Date.now() - tAssets0;
        }
      });
    },
  };
}
