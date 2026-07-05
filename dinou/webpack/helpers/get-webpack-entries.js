const { readFileSync } = require("fs");
const path = require("node:path");
const glob = require("fast-glob");
const { pathToFileURL } = require("node:url");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse");
const crypto = require("node:crypto");
const { regex: assetRegex } = require("../../core/asset-extensions.js");
const { getAbsPathWithExt } = require("../../core/get-abs-path-with-ext.js");
const { useClientRegex, useServerRegex } = require("../../constants.js");

const normalizePath = (p) => p.split(path.sep).join(path.posix.sep);

function hashFilePath(absPath) {
  return crypto.createHash("sha1").update(absPath).digest("hex").slice(0, 8);
}

async function getCSSEntries({
  srcDir = path.resolve("src"),
  assetInclude = assetRegex,
  manifest = {},
} = {}) {
  const detectedClientEntries = new Set();
  const detectedCSSEntries = new Set();

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
      } else {
        const isImportedFileServer = useServerRegex.test(importedCode.trim());

        if (isImportedFileServer) {
          continue;
        }
      }

      // For non-client modules, process normally
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
    return fileName.startsWith("page.") || fileName.startsWith("layout.");
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

      detectedClientEntries.add({
        absPath: normalizedPath,
        name,
      });
      const { imports } = await getImportsAndAssetsAndCsss(
        code,
        absPath,
        new Set(),
        true,
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
      try {
        const { csss } = await getImportsAndAssetsAndCsss(code, absPath);

        if (csss.length > 0) {
          detectedCSSEntries.add(
            ...csss.map((cssPath) => ({
              absPath: normalizePath(cssPath),
              name: path.basename(cssPath, path.extname(cssPath)),
            })),
          );
        }
      } catch (err) {
        /* ignore */
      }
    }
  } // end for files

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

  return [detectedCSSEntries, detectedClientEntries];
}

module.exports = getCSSEntries;
