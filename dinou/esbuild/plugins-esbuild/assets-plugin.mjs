import fs from "node:fs/promises";
import path from "node:path";
import createScopedName from "../../core/createScopedName.js";
import { regex } from "../../core/asset-extensions.js";
import { getAbsPathWithExt } from "../../core/get-abs-path-with-ext.js";
import { pathToFileURL } from "node:url";

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normKey = (p) => {
  if (!p) return "";
  let s = path.resolve(p).replace(/\\/g, "/");
  if (process.platform === "win32") {
    s = s.replace(/^([a-zA-Z]):/, (_, d) => d.toLowerCase() + ":");
  }
  return s;
};

export default function assetsPlugin({ include = regex, changedIds } = {}) {
  let isInitial = true;
  let cachedRenames = new Map();

  return {
    name: "assets-plugin",
    setup(build) {
      const outdir = build.initialOptions.outdir;
      if (!outdir) {
        throw new Error("assetsPlugin requires outdir to be set");
      }

      build.initialOptions.assetNames = "assets/[name]-[hash]";

      // Handle asset loading with different namespaces
      build.onResolve({ filter: include }, (args) => {
        const resolvedAlias =
          args.kind === "entry-point"
            ? args.path
            : getAbsPathWithExt(args.path, {
                parentURL: pathToFileURL(args.importer).href,
              });

        if (args.kind === "entry-point") {
          return {
            path: resolvedAlias,
            namespace: "dinou-asset-entry",
          };
        }

        return {
          path: resolvedAlias,
          namespace: "dinou-asset",
        };
      });

      // Loader for normal assets
      build.onLoad({ filter: /.*/, namespace: "dinou-asset" }, async (args) => {
        const contents = await fs.readFile(args.path);
        return { contents, loader: "file" };
      });

      // Loader for asset entry points
      build.onLoad(
        { filter: /.*/, namespace: "dinou-asset-entry" },
        async (args) => {
          const contents = await fs.readFile(args.path);
          return { contents, loader: "file" };
        }
      );

      build.onEnd(async (result) => {
        const tAssets0 = Date.now();
        try {
          if (!result.metafile || !result.outputFiles?.length) return;

          const normalizeRel = (p) => p.replace(/\\/g, "/");
          const isIncremental = !isInitial && changedIds && changedIds.size > 0;
          const hasAssetChanged = isIncremental && Array.from(changedIds).some((id) => include.test(id));

          let renames = cachedRenames;

          // Only re-scan all asset outputs on initial build or if an asset file actually changed
          if (isInitial || hasAssetChanged) {
            renames = new Map();
            const processedSourceFiles = new Set();

            // First pass: normal assets (individual files)
            for (const [oldRelPath, info] of Object.entries(
              result.metafile.outputs
            )) {
              if (info.entryPoint || Object.keys(info.inputs).length !== 1)
                continue;

              const inputPath = Object.keys(info.inputs)[0];
              const sourceFile = inputPath
                .replace(/^dinou-asset:/, "")
                .replace(/^dinou-asset-entry:/, "");
              if (!include.test(sourceFile)) continue;

              const ext = path.extname(sourceFile);
              if (!oldRelPath.endsWith(ext)) continue;
              const base = path.basename(sourceFile, ext);
              const scoped = createScopedName(base, sourceFile);
              const newLocal = `assets/${scoped}${ext}`;
              const oldLocal = normalizeRel(path.relative(outdir, oldRelPath));

              renames.set(oldLocal, newLocal);
              processedSourceFiles.add(sourceFile);
            }

            // Pre-index outputFiles for O(1) lookup
            const outputFilesByRelPath = new Map();
            for (const f of result.outputFiles) {
              outputFilesByRelPath.set(normalizeRel(path.relative(process.cwd(), f.path)), f);
            }

            // Second pass: find assets that are inside chunks
            for (const [outputPath, info] of Object.entries(
              result.metafile.outputs
            )) {
              if (!outputPath.endsWith(".js") || info.entryPoint) continue;

              for (const inputPath of Object.keys(info.inputs)) {
                if (!inputPath.startsWith("dinou-asset:")) continue;

                const sourceFile = inputPath.replace(/^dinou-asset:/, "");
                if (
                  !include.test(sourceFile) ||
                  processedSourceFiles.has(sourceFile)
                )
                  continue;

                try {
                  const ext = path.extname(sourceFile);
                  const base = path.basename(sourceFile, ext);
                  const scoped = createScopedName(base, sourceFile);
                  const newLocal = `assets/${scoped}${ext}`;

                  const assetContent = await fs.readFile(sourceFile);

                  const newOutputFile = {
                    path: path.join(outdir, newLocal),
                    contents: assetContent,
                    get text() {
                      return new TextDecoder().decode(this.contents);
                    },
                  };

                  result.outputFiles.push(newOutputFile);
                  processedSourceFiles.add(sourceFile);

                  const chunkFile = outputFilesByRelPath.get(outputPath);

                  if (chunkFile) {
                    let chunkContent = new TextDecoder().decode(chunkFile.contents);
                    const assetComment = `// ${inputPath}`;
                    const commentIndex = chunkContent.indexOf(assetComment);

                    if (commentIndex !== -1) {
                      const nextLineStart = chunkContent.indexOf("\n", commentIndex) + 1;
                      const nextLineEnd = chunkContent.indexOf("\n", nextLineStart);
                      const assignmentLine = chunkContent.substring(nextLineStart, nextLineEnd);
                      const varMatch = assignmentLine.match(/var (\w+)_default = "([^"]+)"/);

                      if (varMatch) {
                        const varName = varMatch[1];
                        const newAssignmentLine = `var ${varName}_default = "/${newLocal}";`;
                        chunkContent =
                          chunkContent.substring(0, nextLineStart) +
                          newAssignmentLine +
                          chunkContent.substring(nextLineEnd);
                      }
                    } else {
                      const assetName = path.basename(sourceFile);
                      const escapedAssetName = escapeRegExp(assetName);
                      const pattern = new RegExp(
                        `(var \\w+_default = ")([^"]*${escapedAssetName}[^"]*)(";)`,
                        "g"
                      );

                      if (pattern.test(chunkContent)) {
                        chunkContent = chunkContent.replace(
                          pattern,
                          `$1/${newLocal}$3`
                        );
                      }
                    }

                    chunkFile.contents = new TextEncoder().encode(chunkContent);
                  }
                } catch (error) {
                  console.error(
                    `Error extracting asset ${sourceFile} from chunk:`,
                    error
                  );
                }
              }
            }

            cachedRenames = renames;
          }

          if (renames.size === 0) return;

          // Update references in JS/CSS files:
          // On incremental rebuild, only process output files belonging to changed modules!
          for (const file of result.outputFiles) {
            const relPath = normalizeRel(path.relative(process.cwd(), file.path));
            if (!relPath.endsWith(".js") && !relPath.endsWith(".css")) continue;

            if (isIncremental && !hasAssetChanged) {
              const outputInfo = result.metafile.outputs[relPath];
              const inputFiles = Object.keys(outputInfo?.inputs || {});
              const touchesChanged = inputFiles.some((m) => {
                const clean = m.replace(/^[a-zA-Z0-9_-]+:/, "");
                return changedIds.has(normKey(clean));
              });
              if (!touchesChanged) continue;
            }

            let content = new TextDecoder().decode(file.contents);
            let modified = false;
            for (const [oldLocal, newLocal] of renames) {
              if (!content.includes(oldLocal)) continue;
              const patterns = [
                [`"./${escapeRegExp(oldLocal)}"`, `"/${newLocal}"`],
                [`"${escapeRegExp(oldLocal)}"`, `"${newLocal}"`],
                [`'./${escapeRegExp(oldLocal)}'`, `'/${newLocal}'`],
                [`'${escapeRegExp(oldLocal)}'`, `'${newLocal}'`],
              ];

              for (const [oldPattern, newPattern] of patterns) {
                const reg = new RegExp(oldPattern, "g");
                if (reg.test(content)) {
                  content = content.replace(reg, newPattern);
                  modified = true;
                }
              }
            }
            if (modified) {
              file.contents = new TextEncoder().encode(content);
            }
          }

          // Update paths in outputFiles
          if (!isIncremental) {
            for (const file of result.outputFiles) {
              const relPath = normalizeRel(path.relative(process.cwd(), file.path));
              const oldLocal = normalizeRel(path.relative(outdir, relPath));
              const newLocal = renames.get(oldLocal);

              if (newLocal) {
                file.path = path.join(outdir, newLocal);
              }
            }
          }
        } finally {
          isInitial = false;
          globalThis.__DINOU_ASSETS_TIME__ = Date.now() - tAssets0;
        }
      });
    },
  };
}
