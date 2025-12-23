import { readFileSync } from "fs";
import path from "node:path";
import glob from "fast-glob";
import { pathToFileURL } from "node:url";
import parser from "@babel/parser";
import traverse from "@babel/traverse";
import crypto from "node:crypto";
import {
  regex as assetRegex,
  globPattern as assetGlobPattern,
} from "../../core/asset-extensions.js";
import { getAbsPathWithExt } from "../../core/get-abs-path-with-ext.js";
import normalizePath from "./normalize-path.mjs";
import { useClientRegex, useServerRegex } from "../../constants.js";
import parseExports from "../../core/parse-exports.js";

function hashFilePath(absPath) {
  return crypto.createHash("sha1").update(absPath).digest("hex").slice(0, 8);
}

export default async function getEsbuildEntries({
  srcDir = path.resolve("src"),
  assetInclude = assetRegex,
  manifest = {},
} = {}) {
  const detectedClientEntries = new Set();
  const detectedCSSEntries = new Set();
  const detectedAssetEntries = new Set();
  const serverModules = new Set();

  // ---------- Helpers (ported mostly verbatim) ----------

  function updateManifestForModule(absPath, code, isClientModule) {
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

  async function getImportsAndAssetsAndCsss(
    code,
    baseFilePath,
    visited = new Set(),
    isTopLevelClientComponent = false
  ) {
    if (visited.has(baseFilePath)) {
      return { imports: [], assets: [], csss: [] };
    }
    visited.add(baseFilePath);

    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
    const imports = new Set();
    const assets = new Set();
    const csss = new Set();

    const importNodes = [];
    traverse.default(ast, {
      ImportDeclaration(nodePath) {
        importNodes.push(nodePath);
      },
    });

    for (const nodePath of importNodes) {
      const source = nodePath.node.source.value;

      // Resolve the import to absolute path (with extension) using your helper
      const absImportPathWithExt = getAbsPathWithExt(source, {
        parentURL: pathToFileURL(baseFilePath).href,
      });

      if (!absImportPathWithExt) {
        // unresolved - skip
        continue;
      }

      // Leer el archivo UNA sola vez
      let importedCode;
      try {
        importedCode = readFileSync(absImportPathWithExt, "utf8");
      } catch (err) {
        console.warn(
          `[get-esbuild-entries] Could not read import: ${absImportPathWithExt}`,
          err.message
        );
        continue;
      }

      if (!isTopLevelClientComponent) {
        // Verificar si es un client component
        const isImportedFileClient = useClientRegex.test(importedCode.trim());

        // Si es client component, NO procesar recursivamente
        if (isImportedFileClient) {
          continue; // No procesar recursivamente client components
        }
      } else {
        const isImportedFileServer = useServerRegex.test(importedCode.trim());

        if (isImportedFileServer) {
          continue;
        }
      }

      // Para módulos no-client, procesar normalmente
      if (
        absImportPathWithExt.endsWith(".css") ||
        absImportPathWithExt.endsWith(".scss") ||
        absImportPathWithExt.endsWith(".less")
      ) {
        csss.add(absImportPathWithExt);
        continue;
      }

      if (assetInclude.test(absImportPathWithExt)) {
        assets.add(absImportPathWithExt);
        continue;
      }

      imports.add(absImportPathWithExt);

      // Procesar imports recursivamente para módulos no-client
      try {
        const nested = await getImportsAndAssetsAndCsss(
          importedCode,
          absImportPathWithExt,
          visited,
          isTopLevelClientComponent
        );
        nested.imports.forEach((p) => imports.add(p));
        nested.assets.forEach((p) => assets.add(p));
        nested.csss.forEach((p) => csss.add(p));
      } catch (err) {
        console.warn(
          `[get-esbuild-entries] Could not process imports of: ${absImportPathWithExt}`,
          err.message
        );
      }
    }

    return {
      imports: Array.from(imports),
      assets: Array.from(assets),
      csss: Array.from(csss),
    };
  }

  function isPageOrLayout(absPath) {
    const fileName = path.basename(absPath);
    return fileName.startsWith("page.") || fileName.startsWith("layout.");
  }

  function isAsyncDefaultExport(code) {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });

    let isAsync = false;

    traverse.default(ast, {
      ExportDefaultDeclaration(path) {
        let decl = path.node.declaration;

        if (decl.type === "Identifier") {
          const binding = path.scope.getBinding(decl.name);
          if (binding && binding.path) {
            decl = binding.path.node;
            if (decl.type === "VariableDeclarator") {
              decl = decl.init;
            }
          }
        }

        if (
          decl &&
          (decl.type === "FunctionDeclaration" ||
            decl.type === "ArrowFunctionExpression" ||
            decl.type === "FunctionExpression")
        ) {
          isAsync = decl.async;
        }
      },
    });

    return isAsync;
  }

  const files = await glob(["**/*.{js,jsx,ts,tsx}"], {
    cwd: srcDir,
    absolute: true,
  });

  // Gather client modules and update manifest entries
  for (const absPath of files) {
    const code = readFileSync(absPath, "utf8");
    const isClientModule = useClientRegex.test(code.trim());
    const normalizedPath = normalizePath(absPath);

    if (isClientModule) {
      const name = path.basename(absPath, path.extname(absPath));

      updateManifestForModule(absPath, code, true);
      detectedClientEntries.add({
        absPath: normalizedPath,
        name,
      });
      const { imports } = await getImportsAndAssetsAndCsss(
        code,
        absPath,
        new Set(),
        true
      );
      const clientComponentRegex = /\.(js|jsx|ts|tsx)$/i;
      imports.forEach((imp) => {
        if (clientComponentRegex.test(imp) && !imp.includes("node_modules")) {
          const name = path.basename(imp, path.extname(imp));
          detectedClientEntries.add({
            absPath: normalizePath(imp),
            name,
          });
        }
      });
    } else if (isPageOrLayout(absPath)) {
      if (!isAsyncDefaultExport(code)) {
        console.warn(
          `[react-client-manifest] The file ${normalizedPath} is a page or layout without "use client" directive, but its default export is not an async function.`
        );
      }
      serverModules.add(normalizedPath);
      try {
        const { imports, assets, csss } = await getImportsAndAssetsAndCsss(
          code,
          absPath
        );

        if (csss.length > 0) {
          detectedCSSEntries.add(
            ...csss.map((cssPath) => ({
              absPath: normalizePath(cssPath),
              name: path.basename(cssPath, path.extname(cssPath)),
            }))
          );
        }

        assets.forEach((assetPath) => {
          detectedAssetEntries.add({
            absPath: normalizePath(assetPath),
            name: path.basename(assetPath, path.extname(assetPath)),
          });
        });

        const serverComponentRegex = /\.(js|jsx|ts|tsx)$/i;
        imports.forEach((imp) => {
          if (serverComponentRegex.test(imp) && !imp.includes("node_modules")) {
            serverModules.add(normalizePath(imp));
          }
        });
      } catch (err) {
        /* ignore */
      }
    }
  } // end for files

  const csss = await glob(["**/*.css"], {
    cwd: srcDir,
    absolute: true,
  });
  // console.log("detected css entries from glob:", csss);

  for (const absPath of csss) {
    detectedCSSEntries.add({
      absPath: normalizePath(absPath),
      name: path.basename(absPath, path.extname(absPath)),
    });
  }
  // console.log("final detectedCSSEntries:", detectedCSSEntries);

  const assets = await glob([assetGlobPattern], {
    cwd: srcDir,
    absolute: true,
  });

  for (const absPath of assets) {
    detectedAssetEntries.add({
      absPath: normalizePath(absPath),
      name: path.basename(absPath, path.extname(absPath)),
    });
  }

  for (const dCE of detectedClientEntries) {
    const hash = hashFilePath(dCE.absPath);
    const outfileName = `${dCE.name}-${hash}`;
    dCE.outfile = `${outfileName}.js`;
    dCE.outfileName = outfileName;
  }

  for (const dCSSE of detectedCSSEntries) {
    const hash = hashFilePath(dCSSE.absPath);
    const outfileName = `${dCSSE.name}-${hash}`;
    dCSSE.outfile = `${outfileName}.js`;
    dCSSE.outfileName = outfileName;
  }

  for (const dAE of detectedAssetEntries) {
    const hash = hashFilePath(dAE.absPath);
    const outfileName = `${dAE.name}-${hash}`;
    dAE.outfile = `${outfileName}.js`;
    dAE.outfileName = outfileName;
  }

  return [
    detectedClientEntries,
    detectedCSSEntries,
    detectedAssetEntries,
    Array.from(serverModules),
  ];
}
