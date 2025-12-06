const { readFileSync } = require("fs");
const path = require("node:path");
const glob = require("fast-glob");
const { pathToFileURL } = require("node:url");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse");
const crypto = require("node:crypto");
const { regex: assetRegex } = require("../../core/asset-extensions.js");
const { getAbsPathWithExt } = require("../../core/get-abs-path-with-ext.js");

const normalizePath = (p) => p.split(path.sep).join(path.posix.sep);

function hashFilePath(absPath) {
  return crypto.createHash("sha1").update(absPath).digest("hex").slice(0, 8);
}

async function getCSSEntries({
  srcDir = path.resolve("src"),
  assetInclude = assetRegex,
  manifest = {},
} = {}) {
  // const detectedClientEntries = new Set();
  const detectedCSSEntries = new Set();
  // const detectedAssetEntries = new Set();
  // const serverModules = new Set();

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
        const isImportedFileClient = /^(['"])use client\1/.test(
          importedCode.trim()
        );

        // Si es client component, NO procesar recursivamente
        if (isImportedFileClient) {
          continue; // No procesar recursivamente client components
        }
      } else {
        const isImportedFileServer = /^(['"])use server\1/.test(
          importedCode.trim()
        );

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
    const isClientModule = /^(['"])use client\1/.test(code.trim());
    const normalizedPath = normalizePath(absPath);

    if (isClientModule) {
    } else if (isPageOrLayout(absPath)) {
      if (!isAsyncDefaultExport(code)) {
        console.warn(
          `[react-client-manifest] The file ${normalizedPath} is a page or layout without "use client" directive, but its default export is not an async function.`
        );
      }
      // serverModules.add({
      //   absPath: normalizedPath,
      //   name: path.basename(normalizedPath, path.extname(normalizedPath)),
      // });
      try {
        const { csss } = await getImportsAndAssetsAndCsss(code, absPath);

        if (csss.length > 0) {
          detectedCSSEntries.add(
            ...csss.map((cssPath) => ({
              absPath: normalizePath(cssPath),
              name: path.basename(cssPath, path.extname(cssPath)),
            }))
          );
        }

        // const serverComponentRegex = /\.(js|jsx|ts|tsx)$/i;
        // imports.forEach((imp) => {
        //   if (serverComponentRegex.test(imp) && !imp.includes("node_modules")) {
        //     serverModules.add({
        //       absPath: normalizePath(imp),
        //       name: path.basename(imp, path.extname(imp)),
        //     });
        //   }
        // });
      } catch (err) {
        /* ignore */
      }
    }
  } // end for files

  for (const dCSSE of detectedCSSEntries) {
    const hash = hashFilePath(dCSSE.absPath);
    const outfileName = `${dCSSE.name}-${hash}`;
    dCSSE.outfile = `${outfileName}.js`;
    dCSSE.outfileName = outfileName;
  }
  // console.log("serverModules", serverModules);
  // for (const sM of serverModules) {
  //   const hash = hashFilePath(sM.absPath);
  //   const outfileName = `${sM.name}-${hash}`;
  //   sM.outfile = `${outfileName}.js`;
  //   sM.outfileName = outfileName;
  // }

  // console.log("detectedCssEntries", detectedCSSEntries);
  return [detectedCSSEntries];
}

module.exports = getCSSEntries;
