// dinou/core/resolve-contextual-dinou.js
import fs from "node:fs";
import path from "node:path";

const CONTEXTUAL_DINOU_FILTER = /^\.\.?[\\/](?:.*[\\/])?dinou(?:\.js)?(?:[?#].*)?$/;

function normCompare(p) {
  const resolved = path.resolve(p).replace(/\\/g, "/");
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

/**
 * Resolves a route-contextual `"./dinou"` (or `"../dinou"`) import from inside `src/`
 * to the generated `.dinou/routes/<relDir>/dinou.js` module, mirroring TypeScript's
 * `rootDirs: ["src", ".dinou/routes"]` behavior:
 * - Maps `.dinou/swc/src/...` dev disk-cache importers back to `src/...`
 * - Defers to any physical `dinou.{ts,tsx,js,jsx,mjs}` or `dinou/index.*` file in `src/`
 * - Returns `null` for non-route folders (e.g. `src/components/`) where no `dinou.js` is generated
 */
export function resolveContextualDinouImport(
  specifier,
  importerDir,
  projectRoot = process.cwd()
) {
  if (
    !specifier ||
    typeof specifier !== "string" ||
    !importerDir ||
    typeof importerDir !== "string"
  ) {
    return null;
  }

  if (
    !specifier.startsWith("./") &&
    !specifier.startsWith("../") &&
    !specifier.startsWith(".\\") &&
    !specifier.startsWith("..\\")
  ) {
    return null;
  }

  const cleanSpec = specifier.split("?")[0].split("#")[0].replace(/\\/g, "/");
  if (
    cleanSpec !== "./dinou" &&
    cleanSpec !== "./dinou.js" &&
    !cleanSpec.endsWith("/dinou") &&
    !cleanSpec.endsWith("/dinou.js")
  ) {
    return null;
  }

  const rootAbs = path.resolve(projectRoot);
  const swcRoot = path.resolve(rootAbs, ".dinou/swc");
  const normSwcRoot = normCompare(swcRoot);

  let effectiveImporterDir = path.resolve(importerDir);
  const normImporterDir = normCompare(effectiveImporterDir);
  if (
    normImporterDir === normSwcRoot ||
    normImporterDir.startsWith(normSwcRoot + "/")
  ) {
    const relFromSwc = path.relative(swcRoot, effectiveImporterDir);
    effectiveImporterDir = path.resolve(rootAbs, relFromSwc);
  }

  const srcDir = path.resolve(rootAbs, "src");
  const normSrcDir = normCompare(srcDir);
  const normEffectiveDir = normCompare(effectiveImporterDir);
  if (
    normEffectiveDir !== normSrcDir &&
    !normEffectiveDir.startsWith(normSrcDir + "/")
  ) {
    return null;
  }

  const specNoExt = cleanSpec.endsWith(".js")
    ? cleanSpec.slice(0, -3)
    : cleanSpec;
  const targetBase = path.resolve(effectiveImporterDir, specNoExt);
  if (path.basename(targetBase) !== "dinou") {
    return null;
  }

  const targetDir = path.dirname(targetBase);
  const normTargetDir = normCompare(targetDir);
  if (
    normTargetDir !== normSrcDir &&
    !normTargetDir.startsWith(normSrcDir + "/")
  ) {
    return null;
  }

  // Defer to user-created files in src/ (matching TypeScript rootDirs priority)
  const shadowCandidates = [
    targetBase + ".ts",
    targetBase + ".tsx",
    targetBase + ".js",
    targetBase + ".jsx",
    targetBase + ".mjs",
    path.join(targetBase, "index.ts"),
    path.join(targetBase, "index.tsx"),
    path.join(targetBase, "index.js"),
    path.join(targetBase, "index.jsx"),
    path.join(targetBase, "index.mjs"),
  ];
  for (const candidate of shadowCandidates) {
    try {
      if (fs.existsSync(candidate) && !fs.statSync(candidate).isDirectory()) {
        return null;
      }
    } catch (e) {}
  }

  const relDir = path.relative(srcDir, targetDir);
  const generatedFile = path.resolve(rootAbs, ".dinou/routes", relDir, "dinou.js");
  if (fs.existsSync(generatedFile)) {
    return generatedFile;
  }

  return null;
}

export function esbuildContextualDinouPlugin({
  projectRoot = process.cwd(),
} = {}) {
  return {
    name: "dinou-contextual-module",
    setup(build) {
      build.onResolve({ filter: CONTEXTUAL_DINOU_FILTER }, (args) => {
        const importerDir = args.importer
          ? path.dirname(args.importer)
          : args.resolveDir;
        const resolved = resolveContextualDinouImport(
          args.path,
          importerDir,
          projectRoot
        );
        if (resolved) {
          return { path: resolved };
        }
        return null;
      });
    },
  };
}

export function rollupContextualDinouPlugin({
  projectRoot = process.cwd(),
} = {}) {
  return {
    name: "dinou-contextual-module",
    resolveId(source, importer) {
      if (!importer || importer.startsWith("\0")) return null;
      if (!CONTEXTUAL_DINOU_FILTER.test(source)) return null;
      const cleanImporter = importer.split("?")[0].split("#")[0];
      const resolved = resolveContextualDinouImport(
        source,
        path.dirname(cleanImporter),
        projectRoot
      );
      return resolved || null;
    },
  };
}

export function webpackContextualDinouPlugin({
  projectRoot = process.cwd(),
} = {}) {
  return {
    apply(compiler) {
      compiler.hooks.normalModuleFactory.tap(
        "DinouContextualModulePlugin",
        (nmf) => {
          nmf.hooks.beforeResolve.tap(
            "DinouContextualModulePlugin",
            (resolveData) => {
              if (!resolveData || !resolveData.request || !resolveData.context) {
                return;
              }
              if (!CONTEXTUAL_DINOU_FILTER.test(resolveData.request)) {
                return;
              }
              const resolved = resolveContextualDinouImport(
                resolveData.request,
                resolveData.context,
                projectRoot
              );
              if (resolved) {
                resolveData.request = resolved;
              }
            }
          );
        }
      );
    },
  };
}

export default {
  resolveContextualDinouImport,
  esbuildContextualDinouPlugin,
  rollupContextualDinouPlugin,
  webpackContextualDinouPlugin,
};

