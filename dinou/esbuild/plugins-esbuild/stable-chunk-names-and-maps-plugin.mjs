import path from "node:path";

export default function stableChunkNamesAndMapsPlugin({ dev = true } = {}) {
  return {
    name: "stable-chunk-names",
    setup(build) {
      build.onEnd(async (result) => {
        if (!result.metafile || !result.outputFiles?.length) return;
        const outdir = build.initialOptions.outdir;
        if (!outdir) return;

        const renames = new Map(); // oldFilename → newFilename (e.g., 'chunk-ABC.js' → 'chunk-stable.js')
        const normalizeRel = (p) => p.replace(/\\/g, "/");
        // Primero, renombrar chunks
        for (const [oldRelPath, info] of Object.entries(
          result.metafile.outputs
        )) {
          if (info.entryPoint || !oldRelPath.endsWith(".js")) continue;
          const inputs = Object.keys(info.inputs);
          const sourceFile = inputs.find(
            (f) => f.startsWith("src/") && /\.(js|jsx|ts|tsx)$/.test(f)
          );
          if (!sourceFile) continue;
          // Nombre estable basado en el archivo fuente (siempre igual)
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
            finalName = `${stableName}.js`; // 100% estable en dev
          } else {
            const hash = oldRelPath.match(/-([A-Z0-9]+)\./)?.[1] || "";
            finalName = `${stableName}-${hash}.js`;
          }
          const finalRelPath = `chunk-${finalName}`;
          const oldLocal = path.basename(oldRelPath);
          renames.set(oldLocal, finalRelPath);
        }
        // Segundo, renombrar maps correspondientes a los chunks
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
        // Paso 3: Actualizar referencias en importers (imports en .js)
        const outputs = result.metafile.outputs;
        const escapeRegExp = (string) =>
          string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        for (const relPath in outputs) {
          const output = outputs[relPath];
          if (!output.imports || !relPath.endsWith(".js")) continue;
          const importerFile = result.outputFiles.find(
            (f) =>
              normalizeRel(path.relative(process.cwd(), f.path)) === relPath
          );
          if (!importerFile) continue;
          let content = new TextDecoder().decode(importerFile.contents);
          for (const imp of output.imports) {
            const importedRelPath = imp.path;
            const oldImportedLocal = path.basename(importedRelPath);
            const newImportedLocal = renames.get(oldImportedLocal);
            if (!newImportedLocal) continue;
            // Reemplazar para double quotes con ./
            const oldDouble = `"./${escapeRegExp(oldImportedLocal)}"`;
            const newDouble = `"./${newImportedLocal}"`;
            content = content.replace(new RegExp(oldDouble, "g"), newDouble);
            // Reemplazar para double quotes sin ./
            const oldDoubleNoDot = `"${escapeRegExp(oldImportedLocal)}"`;
            const newDoubleNoDot = `"${newImportedLocal}"`;
            content = content.replace(
              new RegExp(oldDoubleNoDot, "g"),
              newDoubleNoDot
            );
            // Reemplazar para single quotes con ./
            const oldSingle = `'./${escapeRegExp(oldImportedLocal)}'`;
            const newSingle = `'./${newImportedLocal}'`;
            content = content.replace(new RegExp(oldSingle, "g"), newSingle);
            // Reemplazar para single quotes sin ./
            const oldSingleNoDot = `'${escapeRegExp(oldImportedLocal)}'`;
            const newSingleNoDot = `'${newImportedLocal}'`;
            content = content.replace(
              new RegExp(oldSingleNoDot, "g"),
              newSingleNoDot
            );
          }
          importerFile.contents = new TextEncoder().encode(content);
        }
        // Nuevo: Actualizar sourceMappingURL en los .js que se renombran
        for (const file of result.outputFiles) {
          if (!file.path.endsWith(".js")) continue;
          const oldRelPath = normalizeRel(
            path.relative(process.cwd(), file.path)
          );
          const oldLocal = path.basename(oldRelPath);
          if (!renames.has(oldLocal)) continue;
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
        // Actualizar paths en outputFiles para chunks y maps
        for (const file of result.outputFiles) {
          const relPath = normalizeRel(path.relative(process.cwd(), file.path));
          const oldLocal = path.basename(relPath);
          const newLocal = renames.get(oldLocal);
          if (newLocal) {
            file.path = path.join(path.dirname(file.path), newLocal);
          }
        }
        // Actualizar metafile para consistencia
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
      });
    },
  };
}
