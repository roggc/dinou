import fs from "node:fs/promises";
import path from "node:path";
import createScopedName from "../../core/createScopedName.js";
import { regex } from "../../core/asset-extensions.js";
import { getAbsPathWithExt } from "../../core/get-abs-path-with-ext.js";
import { pathToFileURL } from "node:url";

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default function assetsPlugin({ include = regex } = {}) {
  return {
    name: "assets-plugin",
    setup(build) {
      const outdir = build.initialOptions.outdir;
      if (!outdir) {
        throw new Error("assetsPlugin requires outdir to be set");
      }

      build.initialOptions.assetNames = "assets/[name]-[hash]";

      // Manejar la carga de assets con namespaces diferentes
      build.onResolve({ filter: include }, (args) => {
        // console.log("[assets-plugin] onResolve", args);
        const resolvedAlias =
          args.kind === "entry-point"
            ? args.path
            : getAbsPathWithExt(args.path, {
                parentURL: pathToFileURL(args.importer).href,
              });

        // CRUCIAL: Namespace diferente para entry points
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

      // Loader para assets normales
      build.onLoad({ filter: /.*/, namespace: "dinou-asset" }, async (args) => {
        const contents = await fs.readFile(args.path);
        return { contents, loader: "file" };
      });

      // Loader para assets entry points
      build.onLoad(
        { filter: /.*/, namespace: "dinou-asset-entry" },
        async (args) => {
          const contents = await fs.readFile(args.path);
          return { contents, loader: "file" };
        }
      );

      build.onEnd(async (result) => {
        if (!result.metafile || !result.outputFiles?.length) return;

        const renames = new Map();
        const normalizeRel = (p) => p.replace(/\\/g, "/");
        const processedSourceFiles = new Set();

        // Primera pasada: assets normales (archivos individuales)
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

        // Segunda pasada: buscar assets que están dentro de chunks
        for (const [outputPath, info] of Object.entries(
          result.metafile.outputs
        )) {
          // Solo buscar en chunks JavaScript
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

              // Leer el asset original
              const assetContent = await fs.readFile(sourceFile);

              // Crear un nuevo output file para este asset
              const newOutputFile = {
                path: path.join(outdir, newLocal),
                contents: assetContent,
                get text() {
                  return new TextDecoder().decode(this.contents);
                },
              };

              result.outputFiles.push(newOutputFile);
              processedSourceFiles.add(sourceFile);

              // console.log(
              //   `Extracted asset from chunk: ${sourceFile} → ${newLocal}`
              // );

              // Buscar el chunk que contiene este asset
              const chunkFile = result.outputFiles.find(
                (f) =>
                  normalizeRel(path.relative(process.cwd(), f.path)) ===
                  outputPath
              );

              if (chunkFile) {
                let chunkContent = new TextDecoder().decode(chunkFile.contents);

                // ENFOQUE MÁS PRECISO: Buscar el comentario específico de este asset
                const assetComment = `// ${inputPath}`;
                const commentIndex = chunkContent.indexOf(assetComment);

                if (commentIndex !== -1) {
                  // Encontrar la línea siguiente que contiene la asignación de variable
                  const nextLineStart =
                    chunkContent.indexOf("\n", commentIndex) + 1;
                  const nextLineEnd = chunkContent.indexOf("\n", nextLineStart);
                  const assignmentLine = chunkContent.substring(
                    nextLineStart,
                    nextLineEnd
                  );

                  // Extraer el nombre de la variable (ej: "dinou_default")
                  const varMatch = assignmentLine.match(
                    /var (\w+)_default = "([^"]+)"/
                  );

                  if (varMatch) {
                    const varName = varMatch[1];
                    const oldPath = varMatch[2];

                    // Reemplazar SOLO esta asignación específica
                    const newAssignmentLine = `var ${varName}_default = "/${newLocal}";`;
                    chunkContent =
                      chunkContent.substring(0, nextLineStart) +
                      newAssignmentLine +
                      chunkContent.substring(nextLineEnd);

                    // console.log(
                    //   `Updated reference in chunk: ${oldPath} → /${newLocal}`
                    // );
                  }
                } else {
                  // Fallback: buscar por el nombre de archivo en la ruta
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

        // Actualizar referencias en archivos JS/CSS (código existente)
        for (const file of result.outputFiles) {
          const relPath = normalizeRel(path.relative(process.cwd(), file.path));
          if (!relPath.endsWith(".js") && !relPath.endsWith(".css")) continue;

          let content = new TextDecoder().decode(file.contents);
          for (const [oldLocal, newLocal] of renames) {
            const patterns = [
              [`"./${escapeRegExp(oldLocal)}"`, `"/${newLocal}"`],
              [`"${escapeRegExp(oldLocal)}"`, `"${newLocal}"`],
              [`'./${escapeRegExp(oldLocal)}'`, `'/${newLocal}'`],
              [`'${escapeRegExp(oldLocal)}'`, `'${newLocal}'`],
            ];

            for (const [oldPattern, newPattern] of patterns) {
              content = content.replace(
                new RegExp(oldPattern, "g"),
                newPattern
              );
            }
          }
          file.contents = new TextEncoder().encode(content);
        }

        // Actualizar paths (código existente)
        for (const file of result.outputFiles) {
          const relPath = normalizeRel(path.relative(process.cwd(), file.path));
          const oldLocal = normalizeRel(path.relative(outdir, relPath));
          const newLocal = renames.get(oldLocal);

          if (newLocal) {
            file.path = path.join(outdir, newLocal);
          }
        }
      });
    },
  };
}
