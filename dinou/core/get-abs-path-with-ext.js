import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import resolveModule from "#resolve";

const resolve = resolveModule?.default || resolveModule;
import {
  inferProjectRootFromDir,
  resolveCandidateFile,
  resolveTsconfigAlias,
  stripJsonCommentsAndTrailingCommas,
} from "./tsconfig-aliases.js";

export { stripJsonCommentsAndTrailingCommas };

const STYLESHEET_FILE_RE = /\.(css|scss|sass|less)$/i;

function getParentDirectory(context) {
  if (context?.parentDir) {
    return path.resolve(context.parentDir);
  }
  const parentURL = context?.parentURL;
  if (!parentURL) return process.cwd();
  const cleanParentURL = parentURL.split("?")[0];
  const fsPath = fileURLToPath(cleanParentURL);
  try {
    if (fs.existsSync(fsPath) && fs.statSync(fsPath).isDirectory()) {
      return fsPath;
    }
  } catch (e) {}
  return path.dirname(fsPath);
}

export function getAbsPathWithExt(specifier, context) {
  const cleanSpecifier = specifier
    ? specifier.split("?")[0].split("#")[0]
    : specifier;
  if (!cleanSpecifier) return null;

  const parentDir = getParentDirectory(context);
  const projectRoot = inferProjectRootFromDir(parentDir, context?.cwd || null);
  const preferStyles = Boolean(context?.preferStyles);
  const extensions = context?.extensions || null;

  if (cleanSpecifier.startsWith("./") || cleanSpecifier.startsWith("../")) {
    const absPath = path.resolve(parentDir, cleanSpecifier);
    return resolveCandidateFile(absPath, { extensions, preferStyles });
  }

  const viaAlias = resolveTsconfigAlias(cleanSpecifier, {
    projectRoot,
    extensions,
    preferStyles,
  });
  if (viaAlias) {
    return viaAlias;
  }

  return null;
}

function resolveStyleExportsTarget(expVal) {
  if (!expVal) return null;
  if (typeof expVal === "string") return expVal;
  if (typeof expVal === "object") {
    for (const key of ["style", "css", "import", "default"]) {
      if (expVal[key]) {
        const nested = resolveStyleExportsTarget(expVal[key]);
        if (nested) return nested;
      }
    }
  }
  return null;
}

function resolveBareStyleFromNodeModules(cleanSpecifier, basedir) {
  if (
    !cleanSpecifier ||
    cleanSpecifier.startsWith(".") ||
    cleanSpecifier.startsWith("/") ||
    cleanSpecifier.startsWith("\\") ||
    path.isAbsolute(cleanSpecifier)
  ) {
    return null;
  }

  // 1. Try package.json exports ("style" condition) / "style" field lookup
  const parts = cleanSpecifier.startsWith("@")
    ? cleanSpecifier.split("/").slice(0, 2)
    : [cleanSpecifier.split("/")[0]];
  const pkgName = parts.join("/");
  const subpath = cleanSpecifier.slice(pkgName.length) || ".";
  const normalizedSubpath = subpath === "." ? "." : `.${subpath}`;

  try {
    const req = createRequire(
      path.join(basedir || process.cwd(), "__dinou_resolve__.js")
    );
    let pkgJsonPath = null;
    try {
      pkgJsonPath = req.resolve(`${pkgName}/package.json`);
    } catch (e) {
      let cur = path.resolve(basedir || process.cwd());
      while (true) {
        const candidate = path.join(cur, "node_modules", pkgName, "package.json");
        if (fs.existsSync(candidate)) {
          pkgJsonPath = candidate;
          break;
        }
        const parent = path.dirname(cur);
        if (parent === cur) break;
        cur = parent;
      }
    }

    if (pkgJsonPath && fs.existsSync(pkgJsonPath)) {
      const pkgDir = path.dirname(pkgJsonPath);
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
      if (pkgJson.exports) {
        const exportEntry =
          normalizedSubpath === "."
            ? pkgJson.exports["."] || pkgJson.exports
            : pkgJson.exports[normalizedSubpath];
        const targetRel = resolveStyleExportsTarget(exportEntry);
        if (targetRel) {
          const candidate = path.resolve(pkgDir, targetRel);
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return candidate;
          }
        }
      }
      if (normalizedSubpath === "." && typeof pkgJson.style === "string") {
        const candidate = path.resolve(pkgDir, pkgJson.style);
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return candidate;
        }
      }
      if (normalizedSubpath !== ".") {
        const directCandidate = resolveCandidateFile(
          path.resolve(pkgDir, normalizedSubpath),
          { preferStyles: true }
        );
        if (directCandidate && STYLESHEET_FILE_RE.test(directCandidate)) {
          return directCandidate;
        }
      }
    }
  } catch (e) {}

  // 2. Fallback to resolve.sync with .css extension support
  try {
    return resolve.sync(cleanSpecifier, {
      basedir: basedir || process.cwd(),
      extensions: [".css", ".scss", ".sass", ".less"],
      packageFilter(pkg) {
        if (pkg.style && !pkg.main) {
          pkg.main = pkg.style;
        }
        return pkg;
      },
    });
  } catch (e) {
    return null;
  }
}

export function resolveCssImportSpecifier(specifier, basedir, customCwd = null) {
  const cleanSpecifier = specifier
    ? specifier.split("?")[0].split("#")[0]
    : specifier;
  if (!cleanSpecifier) return specifier;

  const resolvedAliasOrRel = getAbsPathWithExt(cleanSpecifier, {
    parentDir: basedir || process.cwd(),
    cwd: customCwd || null,
    preferStyles: true,
  });
  if (resolvedAliasOrRel) {
    return resolvedAliasOrRel;
  }

  // Relative CSS import without leading ./ (allowed inside CSS @import "tokens.css")
  if (!cleanSpecifier.startsWith("/")) {
    const localCandidate = resolveCandidateFile(
      path.resolve(basedir || process.cwd(), cleanSpecifier),
      { preferStyles: true }
    );
    if (localCandidate) {
      return localCandidate;
    }
  }

  const bareResolved = resolveBareStyleFromNodeModules(
    cleanSpecifier,
    basedir || process.cwd()
  );
  if (bareResolved) {
    return bareResolved;
  }

  throw new Error(
    `[Dinou CSS] Cannot resolve CSS @import "${specifier}" from "${basedir || process.cwd()}"`
  );
}

export function resolveStyleImportFromCode(
  specifier,
  importerFilePath,
  customCwd = null
) {
  const cleanSpecifier = specifier
    ? specifier.split("?")[0].split("#")[0]
    : specifier;
  if (!cleanSpecifier) return null;

  const localOrAlias = getAbsPathWithExt(cleanSpecifier, {
    parentURL: pathToFileURL(importerFilePath).href,
    cwd: customCwd || null,
    preferStyles: true,
  });
  if (localOrAlias && STYLESHEET_FILE_RE.test(localOrAlias)) {
    return localOrAlias;
  }

  // Only resolve bare node_modules specifiers when they target stylesheets
  const looksLikeStylesheet =
    STYLESHEET_FILE_RE.test(cleanSpecifier) ||
    /(?:^|\/)(?:styles?|css)(?:$|\/)/i.test(cleanSpecifier);
  if (!looksLikeStylesheet) {
    return null;
  }

  const resolved = resolveBareStyleFromNodeModules(
    cleanSpecifier,
    path.dirname(importerFilePath)
  );
  if (resolved && STYLESHEET_FILE_RE.test(resolved)) {
    return resolved;
  }
  return null;
}

export default {
  getAbsPathWithExt,
  resolveCssImportSpecifier,
  resolveStyleImportFromCode,
  stripJsonCommentsAndTrailingCommas,
};
