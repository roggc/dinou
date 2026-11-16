import { readFileSync } from "fs";
import path from "node:path";
import glob from "fast-glob";
import { pathToFileURL } from "node:url";
import parser from "#babel/parser";
import traverse from "#babel/traverse";
import crypto from "node:crypto";
import {
  getAssetExtensionsInfo,
  resolveAssetImport,
} from "../../core/asset-extensions.js";
import {
  getAbsPathWithExt,
  resolveStyleImportFromCode,
} from "../../core/get-abs-path-with-ext.js";
import normalizePath from "./normalize-path.js";
import { useClientRegex, useServerRegex } from "../../constants.js";
import { hasServerFunctions } from "../../core/transform-server-functions.js";
import { updateManifestForModule } from "./update-manifest-for-module.js";

function hashFilePath(absPath) {
  return crypto.createHash("sha1").update(normalizePath(absPath)).digest("hex").slice(0, 8);
}

export default async function getEsbuildEntries({
  srcDir = path.resolve("src"),
  assetInclude = null,
  dinouConfig = null,
  manifest = {},
} = {}) {
  const projectRoot = path.dirname(path.resolve(srcDir));
  const extInfo = getAssetExtensionsInfo(dinouConfig, projectRoot);
  const activeAssetInclude = assetInclude || extInfo.regex;
  const activeAssetGlobPattern = extInfo.globPattern;

  const clientEntryMap = new Map();
  const cssEntryMap = new Map();
  const assetEntryMap = new Map();
  const serverModules = new Set();
  const serverFunctions = new Set();

  // ---------- Helpers (ported mostly verbatim) ----------
  async function getImportsAndAssetsAndCsss(
    code,
    baseFilePath,
    visited = new Set(),
    isTopLevelClientComponent = false,
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
    const traverseFn = typeof traverse === "function" ? traverse : (traverse.default || traverse);
    traverseFn(ast, {
      ImportDeclaration(nodePath) {
        importNodes.push(nodePath);
      },
    });

    for (const nodePath of importNodes) {
      const source = nodePath.node.source.value;

      // Resolve local/aliased imports, bare stylesheet imports, or bare asset imports from node_modules
      const absImportPathWithExt =
        getAbsPathWithExt(source, {
          parentURL: pathToFileURL(baseFilePath).href,
        }) ||
        resolveStyleImportFromCode(source, baseFilePath) ||
        resolveAssetImport(source, {
          importer: baseFilePath,
          projectRoot,
          assetRegex: activeAssetInclude,
        });

      if (!absImportPathWithExt) {
        // unresolved - skip
        continue;
      }

      if (
        absImportPathWithExt.endsWith(".css") ||
        absImportPathWithExt.endsWith(".scss") ||
        absImportPathWithExt.endsWith(".less")
      ) {
        csss.add(absImportPathWithExt);
        continue;
      }

      if (activeAssetInclude.test(absImportPathWithExt)) {
        assets.add(absImportPathWithExt);
        continue;
      }

      // If it is a JSON file, add it to imports without parsing with Babel
      if (absImportPathWithExt.endsWith(".json")) {
        imports.add(absImportPathWithExt);
        continue;
      }

      // Read the file ONLY once
      let importedCode;
      try {
        importedCode = readFileSync(absImportPathWithExt, "utf8");
      } catch (err) {
        console.warn(
          `[get-esbuild-entries] Could not read import: ${absImportPathWithExt}`,
          err.message,
        );
        continue;
      }

      if (!isTopLevelClientComponent) {
        // Verify if it is a client component
        const isImportedFileClient = useClientRegex.test(importedCode.trim());

        // If it is a client component, DO NOT process recursively
        if (isImportedFileClient) {
          continue; // Do not recursively process client components
        }

        const isImportedFileServer = useServerRegex.test(importedCode.trim());
        if (isImportedFileServer) {
          serverFunctions.add(normalizePath(absImportPathWithExt));
          continue;
        } else if (hasServerFunctions(importedCode)) {
          serverFunctions.add(normalizePath(absImportPathWithExt));
        }
      } else {
        const isImportedFileServer = useServerRegex.test(importedCode.trim());

        if (isImportedFileServer) {
          serverFunctions.add(normalizePath(absImportPathWithExt));
          continue;
        } else if (hasServerFunctions(importedCode)) {
          serverFunctions.add(normalizePath(absImportPathWithExt));
        }
      }

      imports.add(absImportPathWithExt);

      // Process imports recursively for non-client modules
      try {
        const nested = await getImportsAndAssetsAndCsss(
          importedCode,
          absImportPathWithExt,
          visited,
          isTopLevelClientComponent,
        );
        nested.imports.forEach((p) => imports.add(p));
        nested.assets.forEach((p) => assets.add(p));
        nested.csss.forEach((p) => csss.add(p));
      } catch (err) {
        console.warn(
          `[get-esbuild-entries] Could not process imports of: ${absImportPathWithExt}`,
          err.message,
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
    return (
      fileName.startsWith("page.") ||
      fileName.startsWith("layout.") ||
      fileName.startsWith("error.") ||
      fileName.startsWith("not_found.") ||
      fileName.startsWith("page_functions.") ||
      fileName.startsWith("layout_functions.")
    );
  }


  const files = await glob(["**/*.{js,jsx,ts,tsx}"], {
    cwd: srcDir,
    absolute: true,
    ignore: ["_*/**", "**/_*/**"],
  });

  // Gather client modules and update manifest entries
  let fileScanCount = 0;
  for (const absPath of files) {
    if (++fileScanCount % 5 === 0) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    const code = readFileSync(absPath, "utf8");
    const isClientModule = useClientRegex.test(code.trim());
    const normalizedPath = normalizePath(absPath);

    if (isClientModule) {
      const name = path.basename(absPath, path.extname(absPath));

      updateManifestForModule(absPath, code, true, manifest);
      clientEntryMap.set(normalizedPath.toLowerCase(), {
        absPath: normalizedPath,
        name,
      });
      try {
        await getImportsAndAssetsAndCsss(code, absPath, new Set(), true);
      } catch (err) {}
    } else if (isPageOrLayout(absPath)) {
      serverModules.add(normalizedPath);
      if (hasServerFunctions(code)) {
        serverFunctions.add(normalizedPath);
      }
      try {
        const { imports, assets, csss } = await getImportsAndAssetsAndCsss(
          code,
          absPath,
        );

        for (const cssPath of csss) {
          const normCss = normalizePath(cssPath);
          cssEntryMap.set(normCss.toLowerCase(), {
            absPath: normCss,
            name: path.basename(cssPath, path.extname(cssPath)),
          });
        }

        assets.forEach((assetPath) => {
          const normAsset = normalizePath(assetPath);
          assetEntryMap.set(normAsset.toLowerCase(), {
            absPath: normAsset,
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

  const assets = await glob([activeAssetGlobPattern], {
    cwd: srcDir,
    absolute: true,
    ignore: ["_*/**", "**/_*/**"],
  });

  for (const absPath of assets) {
    const normAsset = normalizePath(absPath);
    assetEntryMap.set(normAsset.toLowerCase(), {
      absPath: normAsset,
      name: path.basename(absPath, path.extname(absPath)),
    });
  }

  const detectedClientEntries = new Set(clientEntryMap.values());
  const detectedCSSEntries = new Set(cssEntryMap.values());
  const detectedAssetEntries = new Set(assetEntryMap.values());

  for (const dCE of detectedClientEntries) {
    const hash = hashFilePath(dCE.absPath);
    const outfileName = `${dCE.name}-${hash}`;
    dCE.outfile = `${outfileName}.js`;
    dCE.outfileName = outfileName;
    if (manifest) {
      const fileUrl = pathToFileURL(dCE.absPath).href;
      const lowerFileUrl = fileUrl.toLowerCase();
      for (const key in manifest) {
        const kBase = key.split("#")[0].toLowerCase();
        if (kBase === lowerFileUrl) {
          manifest[key].id = "/" + dCE.outfile;
        }
      }
    }
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
    Array.from(serverFunctions),
  ];
}
