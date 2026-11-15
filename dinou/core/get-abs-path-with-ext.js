import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import resolve from "resolve";

export function stripJsonCommentsAndTrailingCommas(raw) {
  if (typeof raw !== "string") return "";
  const withoutComments = raw.replace(
    /"(?:\\.|[^"\\])*"|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,
    (match) => (match.startsWith('"') ? match : "")
  );
  return withoutComments.replace(/,(\s*[}\]])/g, "$1");
}

let cachedAliasState = {
  cwd: null,
  configFile: null,
  mtimeMs: -1,
  map: new Map(),
};

// Reads tsconfig/jsconfig (tolerating JSONC comments & trailing commas) and builds a map of alias -> targetBase
function getTsconfigAliases() {
  const cwd = process.cwd();
  const tsconfigPath = path.resolve(cwd, "tsconfig.json");
  const jsconfigPath = path.resolve(cwd, "jsconfig.json");
  const configFile = fs.existsSync(tsconfigPath)
    ? tsconfigPath
    : fs.existsSync(jsconfigPath)
      ? jsconfigPath
      : null;

  if (!configFile) {
    cachedAliasState = { cwd, configFile: null, mtimeMs: -1, map: new Map() };
    return cachedAliasState.map;
  }

  let mtimeMs = 0;
  try {
    mtimeMs = fs.statSync(configFile).mtimeMs;
  } catch (e) {
    return new Map();
  }

  if (
    cachedAliasState.cwd === cwd &&
    cachedAliasState.configFile === configFile &&
    cachedAliasState.mtimeMs === mtimeMs
  ) {
    return cachedAliasState.map;
  }

  let config;
  try {
    const cleaned = stripJsonCommentsAndTrailingCommas(
      fs.readFileSync(configFile, "utf8")
    );
    config = JSON.parse(cleaned);
  } catch (err) {
    cachedAliasState = { cwd, configFile, mtimeMs, map: new Map() };
    return cachedAliasState.map;
  }

  const paths = (config.compilerOptions && config.compilerOptions.paths) || {};
  const baseUrl =
    (config.compilerOptions && config.compilerOptions.baseUrl) || ".";
  const absoluteBase = path.resolve(cwd, baseUrl);

  const map = new Map();

  for (const key of Object.keys(paths)) {
    const targets = paths[key];
    if (!targets || !targets.length) continue;

    // Normalize: the first target is the one we will use
    const target = Array.isArray(targets) ? targets[0] : targets;
    if (typeof target !== "string") continue;

    // Support patterns with /* at the end: "@/*" -> "src/*"
    const keyIsWildcard = key.endsWith("/*");
    const targetIsWildcard = target.endsWith("/*");

    const alias = keyIsWildcard ? key.slice(0, -1) : key; // "@/"
    const targetBase = targetIsWildcard ? target.slice(0, -1) : target; // "src" or "../lib"

    // Resolve targetBase relative to baseUrl if it is not absolute
    const resolvedTargetBase = path.resolve(absoluteBase, targetBase);

    map.set(alias, {
      resolvedTargetBase,
      keyIsWildcard,
      targetIsWildcard,
    });
  }

  cachedAliasState = { cwd, configFile, mtimeMs, map };
  return map;
}

// Add extensions if they do not exist
function tryExtensions(filePath) {
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return filePath;
  }
  const exts = [".js", ".mjs", ".ts", ".jsx", ".tsx", ".css", ".json"];
  for (const ext of exts) {
    const f = filePath + ext;
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  }
  // If it is a folder, try index.*
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    for (const ext of exts) {
      const f = path.join(filePath, "index" + ext);
      if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
    }
  }
  return null;
}

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
  const cleanSpecifier = specifier ? specifier.split("?")[0].split("#")[0] : specifier;
  if (!cleanSpecifier) return null;

  const aliasMap = getTsconfigAliases();
  if (aliasMap.size > 0) {
    for (const [alias, info] of aliasMap.entries()) {
      if (info.keyIsWildcard ? cleanSpecifier.startsWith(alias) : cleanSpecifier === alias) {
        const absPath = info.keyIsWildcard
          ? path.resolve(info.resolvedTargetBase, cleanSpecifier.slice(alias.length))
          : info.resolvedTargetBase;
        return tryExtensions(absPath);
      }
    }
  }

  if (cleanSpecifier.startsWith("./") || cleanSpecifier.startsWith("../")) {
    const parentDir = getParentDirectory(context);
    const absPath = path.resolve(parentDir, cleanSpecifier);
    return tryExtensions(absPath);
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
    const req = createRequire(path.join(basedir || process.cwd(), "__dinou_resolve__.js"));
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
        const directCandidate = tryExtensions(path.resolve(pkgDir, normalizedSubpath));
        if (directCandidate) return directCandidate;
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

export function resolveCssImportSpecifier(specifier, basedir) {
  const cleanSpecifier = specifier ? specifier.split("?")[0].split("#")[0] : specifier;
  if (!cleanSpecifier) return specifier;

  const resolvedAliasOrRel = getAbsPathWithExt(cleanSpecifier, {
    parentDir: basedir || process.cwd(),
  });
  if (resolvedAliasOrRel) {
    return resolvedAliasOrRel;
  }

  // Relative CSS import without leading ./ (allowed inside CSS @import "tokens.css")
  if (!cleanSpecifier.startsWith("/")) {
    const localCandidate = tryExtensions(path.resolve(basedir || process.cwd(), cleanSpecifier));
    if (localCandidate) {
      return localCandidate;
    }
  }

  const bareResolved = resolveBareStyleFromNodeModules(cleanSpecifier, basedir || process.cwd());
  if (bareResolved) {
    return bareResolved;
  }

  throw new Error(
    `[Dinou CSS] Cannot resolve CSS @import "${specifier}" from "${basedir || process.cwd()}"`
  );
}

export function resolveStyleImportFromCode(specifier, importerFilePath) {
  const cleanSpecifier = specifier ? specifier.split("?")[0].split("#")[0] : specifier;
  if (!cleanSpecifier) return null;

  const localOrAlias = getAbsPathWithExt(cleanSpecifier, {
    parentURL: pathToFileURL(importerFilePath).href,
  });
  if (localOrAlias) {
    return localOrAlias;
  }

  // Only resolve bare node_modules specifiers when they target stylesheets
  const looksLikeStylesheet =
    /\.(css|scss|sass|less)$/i.test(cleanSpecifier) ||
    /(?:^|\/)(?:styles?|css)(?:$|\/)/i.test(cleanSpecifier);
  if (!looksLikeStylesheet) {
    return null;
  }

  const resolved = resolveBareStyleFromNodeModules(
    cleanSpecifier,
    path.dirname(importerFilePath)
  );
  if (resolved && /\.(css|scss|sass|less)$/i.test(resolved)) {
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
