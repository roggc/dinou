// dinou/core/resolve-contextual-dinou.js
import fs from "node:fs";
import path from "node:path";

const CONTEXTUAL_DINOU_FILTER = /^\.\.?[\\/](?:.*[\\/])?dinou(?:\.js)?(?:[?#].*)?$/;
const UNDERSCORE_SEGMENT_HINT_RE = /(?:^|[\\/])_[^\\/]+(?:[\\/]|$)/;

/**
 * Glob ignore patterns for `fast-glob` calls rooted at `src/`.
 * Excludes any directory prefixed with `_` (both top-level `src/_foo/**` and nested `src/docs/_foo/**`).
 */
export const UNDERSCORE_GLOB_IGNORE = ["_*/**", "**/_*/**"];

function normCompare(p) {
  const resolved = path.resolve(p).replace(/\\/g, "/");
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function mapSwcToProjectPath(absPath, rootAbs) {
  const swcRoot = path.resolve(rootAbs, ".dinou/swc");
  const normSwcRoot = normCompare(swcRoot);
  const normTarget = normCompare(absPath);
  if (normTarget === normSwcRoot || normTarget.startsWith(normSwcRoot + "/")) {
    const relFromSwc = path.relative(swcRoot, absPath);
    return path.resolve(rootAbs, relFromSwc);
  }
  return absPath;
}

/**
 * Returns `true` if `fileOrDirPath` lies inside a `_`-prefixed directory under `src/`.
 * Maps `.dinou/swc/src/...` paths back to `src/...` automatically.
 */
export function isUnderscoreEscapedSrcPath(
  fileOrDirPath,
  projectRoot = process.cwd(),
  { isDirectory = false } = {}
) {
  if (!fileOrDirPath || typeof fileOrDirPath !== "string") return false;
  const rootAbs = path.resolve(projectRoot);
  const srcDir = path.resolve(rootAbs, "src");
  const mapped = mapSwcToProjectPath(path.resolve(fileOrDirPath), rootAbs);

  const normSrc = normCompare(srcDir);
  const normMapped = normCompare(mapped);
  if (normMapped !== normSrc && !normMapped.startsWith(normSrc + "/")) {
    return false;
  }

  const rel = path.relative(srcDir, mapped).replace(/\\/g, "/");
  if (!rel || rel.startsWith("..")) return false;
  const parts = rel.split("/").filter(Boolean);
  const dirParts = isDirectory ? parts : parts.slice(0, -1);
  return dirParts.some((seg) => seg.startsWith("_"));
}

/**
 * Checks whether an active module in `src/` (outside `_*` directories) is attempting
 * to import from a `_`-prefixed directory inside `src/` (e.g. `./_components/Card` or `@/blog/_actions/save`).
 * Returns a descriptive error string when forbidden, or `null` when allowed.
 */
export function checkForbiddenUnderscoreImport(
  specifier,
  importerPathOrDir,
  projectRoot = process.cwd(),
  { importerIsFile = false } = {}
) {
  if (
    !specifier ||
    typeof specifier !== "string" ||
    !importerPathOrDir ||
    typeof importerPathOrDir !== "string"
  ) {
    return null;
  }

  const cleanSpec = specifier.split("?")[0].split("#")[0].replace(/\\/g, "/");
  if (!UNDERSCORE_SEGMENT_HINT_RE.test(cleanSpec)) {
    return null;
  }

  const cleanImporterRaw = importerPathOrDir.split("?")[0].split("#")[0];
  if (cleanImporterRaw.includes("node_modules")) {
    return null;
  }

  const rootAbs = path.resolve(projectRoot);
  const srcDir = path.resolve(rootAbs, "src");
  const normSrcDir = normCompare(srcDir);

  const mappedImporter = mapSwcToProjectPath(path.resolve(cleanImporterRaw), rootAbs);
  const effectiveImporterDir = importerIsFile
    ? path.dirname(mappedImporter)
    : mappedImporter;
  const normEffectiveDir = normCompare(effectiveImporterDir);

  if (
    normEffectiveDir !== normSrcDir &&
    !normEffectiveDir.startsWith(normSrcDir + "/")
  ) {
    return null;
  }

  // Imports originating from inside an already-escaped `_` directory are not flagged here.
  if (
    isUnderscoreEscapedSrcPath(effectiveImporterDir, rootAbs, {
      isDirectory: true,
    })
  ) {
    return null;
  }

  let candidateTarget = null;
  if (cleanSpec.startsWith("./") || cleanSpec.startsWith("../")) {
    candidateTarget = path.resolve(effectiveImporterDir, cleanSpec);
  } else if (cleanSpec.startsWith("@/") || cleanSpec.startsWith("~/")) {
    candidateTarget = path.resolve(srcDir, cleanSpec.slice(2));
  } else if (cleanSpec.startsWith("src/")) {
    candidateTarget = path.resolve(rootAbs, cleanSpec);
  } else {
    return null;
  }

  const normCandidate = normCompare(candidateTarget);
  if (
    normCandidate !== normSrcDir &&
    !normCandidate.startsWith(normSrcDir + "/")
  ) {
    return null;
  }

  const relTarget = path.relative(srcDir, candidateTarget).replace(/\\/g, "/");
  if (!relTarget || relTarget.startsWith("..")) {
    return null;
  }

  const parts = relTarget.split("/").filter(Boolean);
  let escapedIdx = parts.slice(0, -1).findIndex((seg) => seg.startsWith("_"));

  if (escapedIdx === -1 && parts.length > 0 && parts[parts.length - 1].startsWith("_")) {
    try {
      if (
        fs.existsSync(candidateTarget) &&
        fs.statSync(candidateTarget).isDirectory()
      ) {
        escapedIdx = parts.length - 1;
      }
    } catch (e) {}
  }

  if (escapedIdx === -1) {
    return null;
  }

  const escapedFolderRel = "src/" + parts.slice(0, escapedIdx + 1).join("/");
  const importerRel = path
    .relative(rootAbs, mappedImporter)
    .replace(/\\/g, "/");

  return (
    `Cannot import "${specifier}" from "${importerRel}": directories prefixed with "_" ("${escapedFolderRel}") ` +
    `are ignored by Dinou's router and bundlers. For active components, hooks, or actions, remove the leading "_" from the folder name.`
  );
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
  const effectiveImporterDir = mapSwcToProjectPath(
    path.resolve(importerDir),
    rootAbs
  );

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
      build.onResolve({ filter: UNDERSCORE_SEGMENT_HINT_RE }, (args) => {
        const importer = args.importer || args.resolveDir;
        const importerIsFile = Boolean(args.importer);
        const forbidden = checkForbiddenUnderscoreImport(
          args.path,
          importer,
          projectRoot,
          { importerIsFile }
        );
        if (forbidden) {
          return { errors: [{ text: forbidden }] };
        }
        return null;
      });

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
      const cleanImporter = importer.split("?")[0].split("#")[0];
      const forbidden = checkForbiddenUnderscoreImport(
        source,
        cleanImporter,
        projectRoot,
        { importerIsFile: true }
      );
      if (forbidden) {
        this.error(forbidden);
      }
      if (!CONTEXTUAL_DINOU_FILTER.test(source)) return null;
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
          nmf.hooks.beforeResolve.tapAsync(
            "DinouContextualModulePlugin",
            (resolveData, callback) => {
              if (!resolveData || !resolveData.request || !resolveData.context) {
                return callback();
              }
              const importerFile =
                resolveData.contextInfo?.issuer || resolveData.context;
              const importerIsFile = Boolean(resolveData.contextInfo?.issuer);
              const forbidden = checkForbiddenUnderscoreImport(
                resolveData.request,
                importerFile,
                projectRoot,
                { importerIsFile }
              );
              if (forbidden) {
                return callback(new Error(forbidden));
              }
              if (CONTEXTUAL_DINOU_FILTER.test(resolveData.request)) {
                const resolved = resolveContextualDinouImport(
                  resolveData.request,
                  resolveData.context,
                  projectRoot
                );
                if (resolved) {
                  resolveData.request = resolved;
                }
              }
              return callback();
            }
          );
        }
      );
    },
  };
}

export default {
  UNDERSCORE_GLOB_IGNORE,
  isUnderscoreEscapedSrcPath,
  checkForbiddenUnderscoreImport,
  resolveContextualDinouImport,
  esbuildContextualDinouPlugin,
  rollupContextualDinouPlugin,
  webpackContextualDinouPlugin,
};
