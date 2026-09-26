import path from "node:path";

const normKey = (p) => {
  if (!p) return "";
  let s = path.resolve(p).replace(/\\/g, "/");
  if (process.platform === "win32") {
    s = s.replace(/^([a-zA-Z]):/, (_, d) => d.toLowerCase() + ":");
  }
  return s;
};

export default function stableChunkNamesAndMapsPlugin({ dev = true, changedIds } = {}) {
  let isInitial = true;

  return {
    name: "stable-chunk-names",
    setup(build) {
      build.onEnd(async (result) => {
        const tStable0 = Date.now();
        try {
          if (!result.metafile || !result.outputFiles?.length) return;
          const outdir = build.initialOptions.outdir;
          if (!outdir) return;

          const normalizeRel = (p) => p.replace(/\\/g, "/");
          const isIncremental = !isInitial && changedIds && changedIds.size > 0;
          const renames = new Map(); // oldFilename → newFilename (e.g., 'chunk-ABC.js' → 'chunk-stable.js')

          // First, rename chunks
          for (const [oldRelPath, info] of Object.entries(
            result.metafile.outputs
          )) {
            if (info.entryPoint || !oldRelPath.endsWith(".js")) continue;
            const inputs = Object.keys(info.inputs);
            const sourceFile = inputs.find(
              (f) => f.startsWith("src/") && /\.(js|jsx|ts|tsx)$/.test(f)
            );
            if (!sourceFile) continue;
            // Stable name based on the source file (always the same)
            const rel = path.relative("src", sourceFile);
            const normalizedRel = rel.replace(/\\/g, "/");
            const dir = path.dirname(normalizedRel);
            const base = path.basename(
              normalizedRel,
              path.extname(normalizedRel)
            );
            const stableName =
              dir === "." ? base : `${dir.replace(/\//g, "-")}-${base}`;
            let finalName;
            if (dev) {
              finalName = `${stableName}.js`; // 100% stable in dev
            } else {
              const hash = oldRelPath.match(/-([A-Z0-9]+)\./)?.[1] || "";
              finalName = `${stableName}-${hash}.js`;
            }
            const finalRelPath = `chunk-${finalName}`;
            const oldLocal = path.basename(oldRelPath);
            renames.set(oldLocal, finalRelPath);
          }
          // Second, rename maps corresponding to the chunks
          for (const [oldRelPath, info] of Object.entries(
            result.metafile.outputs
          )) {
            if (!oldRelPath.endsWith(".js.map")) continue;
            const jsRelPath = oldRelPath.replace(".map", "");
            const jsLocal = path.basename(jsRelPath);
            if (renames.has(jsLocal)) {
              const newJsLocal = renames.get(jsLocal);
              const newMapLocal = newJsLocal.replace(/\.js$/, ".js.map");
              const oldMapLocal = path.basename(oldRelPath);
              renames.set(oldMapLocal, newMapLocal);
            }
          }

          if (renames.size === 0) return;

          // Step 3: Update references in importers (imports in .js)
          const outputs = result.metafile.outputs;
          const escapeRegExp = (string) =>
            string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

          // Pre-index outputFiles for O(1) lookup
          const outputFilesMap = new Map();
          for (const f of result.outputFiles) {
            outputFilesMap.set(normalizeRel(path.relative(process.cwd(), f.path)), f);
          }

          for (const relPath in outputs) {
            const output = outputs[relPath];
            if (!output.imports || !relPath.endsWith(".js")) continue;

            if (isIncremental) {
              const inputFiles = Object.keys(output.inputs || {});
              const touchesChanged = inputFiles.some((m) => {
                const clean = m.replace(/^[a-zA-Z0-9_-]+:/, "");
                return changedIds.has(normKey(clean));
              });
              if (!touchesChanged) continue;
            }

            // Only decode and regex-replace if this output imports any renamed chunk
            const hasRenamedChunk = output.imports.some((imp) => renames.has(path.basename(imp.path)));
            if (!hasRenamedChunk) continue;

            const importerFile = outputFilesMap.get(relPath);
            if (!importerFile) continue;
            let content = new TextDecoder().decode(importerFile.contents);
            for (const imp of output.imports) {
              const importedRelPath = imp.path;
              const oldImportedLocal = path.basename(importedRelPath);
              const newImportedLocal = renames.get(oldImportedLocal);
              if (!newImportedLocal) continue;
              // Replace for double quotes with ./
              const oldDouble = `"./${escapeRegExp(oldImportedLocal)}"`;
              const newDouble = `"./${newImportedLocal}"`;
              content = content.replace(new RegExp(oldDouble, "g"), newDouble);
              // Replace for double quotes without ./
              const oldDoubleNoDot = `"${escapeRegExp(oldImportedLocal)}"`;
              const newDoubleNoDot = `"${newImportedLocal}"`;
              content = content.replace(
                new RegExp(oldDoubleNoDot, "g"),
                newDoubleNoDot
              );
              // Replace for single quotes with ./
              const oldSingle = `'./${escapeRegExp(oldImportedLocal)}'`;
              const newSingle = `'./${newImportedLocal}'`;
              content = content.replace(new RegExp(oldSingle, "g"), newSingle);
              // Replace for single quotes without ./
              const oldSingleNoDot = `'${escapeRegExp(oldImportedLocal)}'`;
              const newSingleNoDot = `'${newImportedLocal}'`;
              content = content.replace(
                new RegExp(oldSingleNoDot, "g"),
                newSingleNoDot
              );
            }
            importerFile.contents = new TextEncoder().encode(content);
          }

          // Step 4: Update sourceMappingURL in the .js files being renamed
          for (const file of result.outputFiles) {
            if (!file.path.endsWith(".js")) continue;
            const oldRelPath = normalizeRel(
              path.relative(process.cwd(), file.path)
            );
            const oldLocal = path.basename(oldRelPath);
            if (!renames.has(oldLocal)) continue;

            if (isIncremental) {
              const output = outputs[oldRelPath];
              const inputFiles = Object.keys(output?.inputs || {});
              const touchesChanged = inputFiles.some((m) => {
                const clean = m.replace(/^[a-zA-Z0-9_-]+:/, "");
                return changedIds.has(normKey(clean));
              });
              if (!touchesChanged) continue;
            }

            const newLocal = renames.get(oldLocal);
            const oldMapLocal = oldLocal.replace(/\.js$/, ".js.map");
            const newMapLocal = newLocal.replace(/\.js$/, ".js.map");
            let content = new TextDecoder().decode(file.contents);
            const escOld = escapeRegExp(oldMapLocal);
            const escNew = newMapLocal;
            content = content.replace(
              new RegExp(`sourceMappingURL=${escOld}`, "g"),
              `sourceMappingURL=${escNew}`
            );
            content = content.replace(
              new RegExp(`sourceMappingURL=\\./${escOld}`, "g"),
              `sourceMappingURL=./${escNew}`
            );
            file.contents = new TextEncoder().encode(content);
          }

          // Step 5: Update paths in outputFiles for chunks and maps
          for (const file of result.outputFiles) {
            const relPath = normalizeRel(path.relative(process.cwd(), file.path));
            const oldLocal = path.basename(relPath);
            const newLocal = renames.get(oldLocal);
            if (newLocal) {
              file.path = path.join(path.dirname(file.path), newLocal);
            }
          }

          // Step 6: Update metafile for consistency (only on initial build)
          if (!isIncremental) {
            const newOutputs = {};
            for (const oldRelPath in outputs) {
              const oldLocal = path.basename(oldRelPath);
              const newLocal = renames.get(oldLocal);
              const newRelPath = newLocal
                ? normalizeRel(path.join(path.dirname(oldRelPath), newLocal))
                : oldRelPath;
              newOutputs[newRelPath] = outputs[oldRelPath];
              if (newOutputs[newRelPath].imports) {
                for (let i = 0; i < newOutputs[newRelPath].imports.length; i++) {
                  const imp = newOutputs[newRelPath].imports[i];
                  const oldImpLocal = path.basename(imp.path);
                  const newImpLocal = renames.get(oldImpLocal) || oldImpLocal;
                  imp.path = normalizeRel(
                    path.join(path.dirname(imp.path), newImpLocal)
                  );
                }
              }
            }
            result.metafile.outputs = newOutputs;
          }
        } finally {
          isInitial = false;
          globalThis.__DINOU_STABLE_TIME__ = Date.now() - tStable0;
        }
      });
    },
  };
}
