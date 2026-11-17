import fs from "node:fs";
import path from "node:path";
import { builtinModules, createRequire } from "node:module";
import { BUILTIN_ASSET_REGEX as DEFAULT_ASSET_REGEX } from "./builtin-asset-extensions.js";

const NODE_BUILTINS = new Set([
  ...builtinModules,
  ...builtinModules.map((b) => (b.startsWith("node:") ? b.slice(5) : `node:${b}`)),
]);

export const DEFAULT_ALIAS_CODE_EXTENSIONS = [
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".json",
  ".css",
  ".scss",
  ".sass",
  ".less",
];

export const DEFAULT_ALIAS_STYLE_EXTENSIONS = [
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
];

const EXTENSION_SUBSTITUTIONS = {
  ".js": [".ts", ".tsx", ".jsx"],
  ".jsx": [".tsx"],
  ".mjs": [".mts"],
  ".cjs": [".cts"],
};

const aliasCacheByRoot = new Map();

export function stripJsonCommentsAndTrailingCommas(raw) {
  if (typeof raw !== "string") return "";
  const noBom = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const withoutComments = noBom.replace(
    /"(?:\\.|[^"\\])*"|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,
    (match) => (match.startsWith('"') ? match : "")
  );
  return withoutComments.replace(/,(\s*[}\]])/g, "$1");
}

function normalizeCacheRootKey(dirPath) {
  const resolved = path.resolve(dirPath || process.cwd()).replace(/\\/g, "/");
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function getFileMtimeMs(filePath) {
  try {
    const st = fs.statSync(filePath);
    return st.isFile() ? st.mtimeMs : -1;
  } catch (e) {
    return -1;
  }
}

function isExistingFile(filePath) {
  if (!filePath) return false;
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch (e) {
    return false;
  }
}

function isExistingDirectory(dirPath) {
  if (!dirPath) return false;
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (e) {
    return false;
  }
}

function expandConfigDirToken(value, configDir) {
  if (typeof value !== "string" || !value.includes("${configDir}")) {
    return value;
  }
  return value.replace(/\$\{configDir\}/g, configDir);
}

function resolveExtendedConfigPath(fromConfigFile, extendsSpecifier) {
  if (!extendsSpecifier || typeof extendsSpecifier !== "string") return null;
  const fromDir = path.dirname(fromConfigFile);
  const expanded = expandConfigDirToken(extendsSpecifier.trim(), fromDir);
  if (!expanded) return null;

  const tryLocalPath = (rawTarget) => {
    const abs = path.resolve(fromDir, rawTarget);
    if (isExistingFile(abs)) return abs;
    if (!abs.endsWith(".json") && isExistingFile(abs + ".json")) {
      return abs + ".json";
    }
    if (isExistingDirectory(abs)) {
      const nested = path.join(abs, "tsconfig.json");
      if (isExistingFile(nested)) return nested;
    }
    return null;
  };

  if (
    expanded.startsWith("./") ||
    expanded.startsWith("../") ||
    expanded.startsWith("/") ||
    expanded.startsWith("\\") ||
    path.isAbsolute(expanded)
  ) {
    return tryLocalPath(expanded);
  }

  // Package preset inside node_modules (e.g. "@tsconfig/node20/tsconfig.json", "@tsconfig/node20" via package.json#tsconfig, or "@acme/tsconfig/base")
  try {
    const req = createRequire(fromConfigFile);
    try {
      const pkgJsonPath = req.resolve(`${expanded}/package.json`);
      if (isExistingFile(pkgJsonPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
        if (pkgJson && typeof pkgJson.tsconfig === "string" && pkgJson.tsconfig.trim()) {
          const tsconfigEntry = path.resolve(
            path.dirname(pkgJsonPath),
            pkgJson.tsconfig.trim()
          );
          if (isExistingFile(tsconfigEntry)) return tsconfigEntry;
        }
      }
    } catch (e) {}
    for (const candidate of [
      expanded,
      expanded.endsWith(".json") ? null : `${expanded}.json`,
      `${expanded}/tsconfig.json`,
    ]) {
      if (!candidate) continue;
      try {
        const resolved = req.resolve(candidate);
        if (isExistingFile(resolved)) return path.resolve(resolved);
      } catch (e) {}
    }
  } catch (e) {}

  // Fallback relative lookup (TypeScript also allows relative-like extends in edge cases)
  return tryLocalPath(expanded);
}

function loadConfigChainRecursive(configFilePath, visited, trackedFiles) {
  const absConfigPath = path.resolve(configFilePath);
  const visitKey = normalizeCacheRootKey(absConfigPath);
  if (visited.has(visitKey)) {
    return {
      compilerOptions: {},
      hasExplicitBaseUrl: false,
      absoluteBaseUrl: null,
      rawPaths: null,
      pathsBaseDir: null,
    };
  }
  visited.add(visitKey);

  const mtimeMs = getFileMtimeMs(absConfigPath);
  trackedFiles.push({ path: absConfigPath, mtimeMs });
  if (mtimeMs < 0) {
    return {
      compilerOptions: {},
      hasExplicitBaseUrl: false,
      absoluteBaseUrl: null,
      rawPaths: null,
      pathsBaseDir: null,
    };
  }

  let parsed = {};
  try {
    const raw = fs.readFileSync(absConfigPath, "utf8");
    parsed = JSON.parse(stripJsonCommentsAndTrailingCommas(raw)) || {};
  } catch (e) {
    return {
      compilerOptions: {},
      hasExplicitBaseUrl: false,
      absoluteBaseUrl: null,
      rawPaths: null,
      pathsBaseDir: null,
    };
  }

  let mergedCompilerOptions = {};
  let hasExplicitBaseUrl = false;
  let absoluteBaseUrl = null;
  let rawPaths = null;
  let pathsBaseDir = null;

  const extendsField = parsed.extends;
  if (extendsField) {
    const extendsList = Array.isArray(extendsField)
      ? extendsField
      : [extendsField];
    for (const extItem of extendsList) {
      const parentPath = resolveExtendedConfigPath(absConfigPath, extItem);
      if (!parentPath) continue;
      const parentRes = loadConfigChainRecursive(
        parentPath,
        visited,
        trackedFiles
      );
      mergedCompilerOptions = {
        ...mergedCompilerOptions,
        ...parentRes.compilerOptions,
      };
      if (parentRes.hasExplicitBaseUrl && parentRes.absoluteBaseUrl) {
        hasExplicitBaseUrl = true;
        absoluteBaseUrl = parentRes.absoluteBaseUrl;
      }
      if (parentRes.rawPaths) {
        rawPaths = parentRes.rawPaths;
        pathsBaseDir = parentRes.pathsBaseDir;
      }
    }
  }

  const configDir = path.dirname(absConfigPath);
  const ownCompilerOptions =
    parsed.compilerOptions && typeof parsed.compilerOptions === "object"
      ? parsed.compilerOptions
      : {};

  mergedCompilerOptions = {
    ...mergedCompilerOptions,
    ...ownCompilerOptions,
  };

  if (typeof ownCompilerOptions.baseUrl === "string" && ownCompilerOptions.baseUrl.trim() !== "") {
    const expandedBase = expandConfigDirToken(
      ownCompilerOptions.baseUrl.trim(),
      configDir
    );
    hasExplicitBaseUrl = true;
    absoluteBaseUrl = path.resolve(configDir, expandedBase);
  }

  if (ownCompilerOptions.paths && typeof ownCompilerOptions.paths === "object") {
    const expandedPaths = {};
    for (const [pattern, rawTargets] of Object.entries(ownCompilerOptions.paths)) {
      const targetList = Array.isArray(rawTargets) ? rawTargets : [rawTargets];
      expandedPaths[pattern] = targetList
        .filter((t) => typeof t === "string" && t.length > 0)
        .map((t) => expandConfigDirToken(t, configDir));
    }
    rawPaths = expandedPaths;
    pathsBaseDir = configDir;
  }

  return {
    compilerOptions: mergedCompilerOptions,
    hasExplicitBaseUrl,
    absoluteBaseUrl,
    rawPaths,
    pathsBaseDir,
  };
}

function findRootConfigFile(rootAbs) {
  const tsconfigPath = path.resolve(rootAbs, "tsconfig.json");
  if (isExistingFile(tsconfigPath)) return tsconfigPath;
  const jsconfigPath = path.resolve(rootAbs, "jsconfig.json");
  if (isExistingFile(jsconfigPath)) return jsconfigPath;
  return null;
}

function isCachedEntryFresh(entry, rootAbs) {
  if (!entry) return false;
  const currentRootConfig = findRootConfigFile(rootAbs);
  if ((currentRootConfig || null) !== (entry.configFile || null)) {
    return false;
  }
  for (const tracked of entry.configFiles) {
    if (getFileMtimeMs(tracked.path) !== tracked.mtimeMs) {
      return false;
    }
  }
  return true;
}

function compileAliasRules({
  rootAbs,
  rawPaths,
  effectiveBaseDir,
  hasExplicitBaseUrl,
  absoluteBaseUrl,
}) {
  const userRules = [];
  const pathsObj = rawPaths && typeof rawPaths === "object" ? rawPaths : {};
  let order = 0;

  for (const [pattern, rawTargets] of Object.entries(pathsObj)) {
    if (!pattern || typeof pattern !== "string") continue;
    const targets = (Array.isArray(rawTargets) ? rawTargets : [rawTargets]).filter(
      (t) => typeof t === "string" && t.length > 0
    );
    if (targets.length === 0) continue;

    const starIdx = pattern.indexOf("*");
    if (starIdx === -1) {
      userRules.push({
        pattern,
        isWildcard: false,
        prefix: pattern,
        suffix: "",
        targets,
        baseDir: effectiveBaseDir,
        isFallback: false,
        isBaseUrlFallback: false,
        order: order++,
      });
    } else {
      const prefix = pattern.slice(0, starIdx);
      const suffix = pattern.slice(starIdx + 1);
      userRules.push({
        pattern,
        isWildcard: true,
        prefix,
        suffix,
        targets,
        baseDir: effectiveBaseDir,
        isFallback: false,
        isBaseUrlFallback: false,
        order: order++,
      });
    }
  }

  // TypeScript `paths` specificity sort:
  // 1. Exact matches (no `*`) always take priority over wildcard patterns.
  // 2. Wildcard patterns with longer `prefix` win (`@ui/icons/*` before `@ui/*` before `@/*`).
  // 3. Tie-break on longer `suffix`, then declaration order.
  userRules.sort((a, b) => {
    if (a.isWildcard !== b.isWildcard) {
      return a.isWildcard ? 1 : -1;
    }
    if (!a.isWildcard) {
      return a.order - b.order;
    }
    if (b.prefix.length !== a.prefix.length) {
      return b.prefix.length - a.prefix.length;
    }
    if (b.suffix.length !== a.suffix.length) {
      return b.suffix.length - a.suffix.length;
    }
    return a.order - b.order;
  });

  const fallbackRules = [];

  // Zero-config Dinou fallbacks (`@/*` and `~/*` -> `<projectRoot>/src/*`) when not explicitly mapped
  if (!Object.prototype.hasOwnProperty.call(pathsObj, "@/*")) {
    fallbackRules.push({
      pattern: "@/*",
      isWildcard: true,
      prefix: "@/",
      suffix: "",
      targets: ["src/*"],
      baseDir: rootAbs,
      isFallback: true,
      isBaseUrlFallback: false,
      order: order++,
    });
  }
  if (!Object.prototype.hasOwnProperty.call(pathsObj, "~/*")) {
    fallbackRules.push({
      pattern: "~/*",
      isWildcard: true,
      prefix: "~/",
      suffix: "",
      targets: ["src/*"],
      baseDir: rootAbs,
      isFallback: true,
      isBaseUrlFallback: false,
      order: order++,
    });
  }

  // Explicit `baseUrl` non-relative lookup (e.g. `"baseUrl": "./src"` with `import "lib/math"`)
  if (hasExplicitBaseUrl && absoluteBaseUrl && !Object.prototype.hasOwnProperty.call(pathsObj, "*")) {
    fallbackRules.push({
      pattern: "*",
      isWildcard: true,
      prefix: "",
      suffix: "",
      targets: ["*"],
      baseDir: absoluteBaseUrl,
      isFallback: true,
      isBaseUrlFallback: true,
      order: order++,
    });
  }

  return [...userRules, ...fallbackRules];
}

export function clearTsconfigAliasCache(projectRoot = null) {
  if (!projectRoot) {
    aliasCacheByRoot.clear();
    return;
  }
  aliasCacheByRoot.delete(normalizeCacheRootKey(projectRoot));
}

export function inferProjectRootFromDir(startDir, explicitCwd = null) {
  if (explicitCwd) {
    return path.resolve(explicitCwd);
  }
  const cwdAbs = path.resolve(process.cwd());
  if (!startDir) {
    return cwdAbs;
  }

  const startAbs = path.resolve(startDir);
  const normCwd = normalizeCacheRootKey(cwdAbs);
  const normStart = normalizeCacheRootKey(startAbs);
  if (normStart === normCwd || normStart.startsWith(normCwd + "/")) {
    // Walk up from startAbs stopping at cwdAbs in case a nested fixture root exists in tests,
    // otherwise default to cwdAbs.
    let cur = startAbs;
    while (true) {
      if (findRootConfigFile(cur)) {
        return cur;
      }
      if (normalizeCacheRootKey(cur) === normCwd) {
        return cwdAbs;
      }
      const parent = path.dirname(cur);
      if (parent === cur) break;
      cur = parent;
    }
    return cwdAbs;
  }

  let cur = startAbs;
  while (true) {
    if (findRootConfigFile(cur)) {
      return cur;
    }
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return cwdAbs;
}

export function loadTsconfigAliasInfo(projectRoot = process.cwd()) {
  const rootAbs = path.resolve(projectRoot || process.cwd());
  const cacheKey = normalizeCacheRootKey(rootAbs);
  const cached = aliasCacheByRoot.get(cacheKey);
  if (isCachedEntryFresh(cached, rootAbs)) {
    return cached;
  }

  const rootConfig = findRootConfigFile(rootAbs);
  const trackedFiles = [];
  let compilerOptions = {};
  let hasExplicitBaseUrl = false;
  let absoluteBaseUrl = null;
  let rawPaths = null;
  let pathsBaseDir = null;

  if (rootConfig) {
    const loaded = loadConfigChainRecursive(
      rootConfig,
      new Set(),
      trackedFiles
    );
    compilerOptions = loaded.compilerOptions;
    hasExplicitBaseUrl = loaded.hasExplicitBaseUrl;
    absoluteBaseUrl = loaded.absoluteBaseUrl;
    rawPaths = loaded.rawPaths;
    pathsBaseDir = loaded.pathsBaseDir;
  }

  const effectiveBaseDir = absoluteBaseUrl || pathsBaseDir || rootAbs;
  const rules = compileAliasRules({
    rootAbs,
    rawPaths,
    effectiveBaseDir,
    hasExplicitBaseUrl,
    absoluteBaseUrl,
  });

  const entry = {
    projectRoot: rootAbs,
    configFile: rootConfig,
    configFiles: trackedFiles,
    compilerOptions,
    hasExplicitBaseUrl,
    absoluteBaseUrl,
    effectiveBaseDir,
    rawPaths: rawPaths || {},
    rules,
  };

  aliasCacheByRoot.set(cacheKey, entry);
  return entry;
}

export function getWatchedTsconfigFiles(projectRoot = process.cwd()) {
  const info = loadTsconfigAliasInfo(projectRoot);
  return info.configFiles.map((cf) => cf.path);
}

export function getSanitizedEsbuildTsconfigRaw(projectRoot = process.cwd()) {
  const info = loadTsconfigAliasInfo(projectRoot);
  const sanitizedOptions = {};
  const allowedKeys = [
    "experimentalDecorators",
    "emitDecoratorMetadata",
    "useDefineForClassFields",
    "verbatimModuleSyntax",
    "importsNotUsedAsValues",
    "preserveValueImports",
    "jsxFactory",
    "jsxFragmentFactory",
    "jsxImportSource",
    "target",
    "strict",
  ];
  for (const key of allowedKeys) {
    if (info.compilerOptions && info.compilerOptions[key] !== undefined) {
      sanitizedOptions[key] = info.compilerOptions[key];
    }
  }
  return { compilerOptions: sanitizedOptions };
}

export function resolveCandidateFile(
  absCandidate,
  { extensions = null, preferStyles = false } = {}
) {
  if (!absCandidate) return null;

  // 1. Exact file match (covers explicit .tsx, .ts, .css, .module.css, .json, .svg, .webp, custom assets, etc.)
  if (isExistingFile(absCandidate)) {
    return absCandidate;
  }

  // 2. TypeScript ESM extension substitution (.js -> .ts / .tsx / .jsx, .mjs -> .mts, .cjs -> .cts)
  const rawExt = path.extname(absCandidate).toLowerCase();
  const substExts = EXTENSION_SUBSTITUTIONS[rawExt];
  if (substExts) {
    const stem = absCandidate.slice(0, -rawExt.length);
    for (const altExt of substExts) {
      const altPath = stem + altExt;
      if (isExistingFile(altPath)) {
        return altPath;
      }
    }
  }

  // 3. Extensionless probing
  const activeExts =
    extensions ||
    (preferStyles ? DEFAULT_ALIAS_STYLE_EXTENSIONS : DEFAULT_ALIAS_CODE_EXTENSIONS);

  for (const ext of activeExts) {
    const candidate = absCandidate + ext;
    if (isExistingFile(candidate)) {
      return candidate;
    }
  }

  // 4. Directory resolution (index.* or local package.json main/module/style)
  if (isExistingDirectory(absCandidate)) {
    const pkgJsonPath = path.join(absCandidate, "package.json");
    if (isExistingFile(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
        const fields = preferStyles
          ? ["style", "main"]
          : ["module", "main"];
        for (const field of fields) {
          if (typeof pkg[field] === "string" && pkg[field].trim() !== "") {
            const pkgEntry = resolveCandidateFile(
              path.resolve(absCandidate, pkg[field]),
              { extensions: activeExts, preferStyles }
            );
            if (pkgEntry) return pkgEntry;
          }
        }
      } catch (e) {}
    }

    for (const ext of activeExts) {
      const indexCandidate = path.join(absCandidate, "index" + ext);
      if (isExistingFile(indexCandidate)) {
        return indexCandidate;
      }
    }
  }

  return null;
}

function isDisallowedAliasSpecifier(cleanSpec) {
  if (!cleanSpec || typeof cleanSpec !== "string") return true;
  if (
    cleanSpec.startsWith("./") ||
    cleanSpec.startsWith("../") ||
    cleanSpec.startsWith(".\\") ||
    cleanSpec.startsWith("..\\") ||
    cleanSpec.startsWith("/") ||
    cleanSpec.startsWith("\\") ||
    cleanSpec.startsWith("\0") ||
    cleanSpec.startsWith("virtual:") ||
    cleanSpec.startsWith("node:") ||
    cleanSpec.startsWith("http:") ||
    cleanSpec.startsWith("https:") ||
    cleanSpec.startsWith("data:") ||
    cleanSpec === "." ||
    cleanSpec === ".." ||
    cleanSpec === "dinou" ||
    cleanSpec.startsWith("dinou/") ||
    path.isAbsolute(cleanSpec)
  ) {
    return true;
  }
  return false;
}

function matchRuleToSpecifier(rule, cleanSpec) {
  if (!rule.isWildcard) {
    return cleanSpec === rule.pattern ? "" : null;
  }
  if (rule.isBaseUrlFallback) {
    if (
      NODE_BUILTINS.has(cleanSpec) ||
      cleanSpec === "react" ||
      cleanSpec.startsWith("react/") ||
      cleanSpec === "react-dom" ||
      cleanSpec.startsWith("react-dom/") ||
      cleanSpec === "react-server-dom-webpack" ||
      cleanSpec.startsWith("react-server-dom-webpack/") ||
      cleanSpec === "@roggc/react-server-dom-esm" ||
      cleanSpec.startsWith("@roggc/react-server-dom-esm/")
    ) {
      return null;
    }
  }
  if (cleanSpec.length < rule.prefix.length + rule.suffix.length) {
    return null;
  }
  if (!cleanSpec.startsWith(rule.prefix)) {
    return null;
  }
  if (rule.suffix !== "" && !cleanSpec.endsWith(rule.suffix)) {
    return null;
  }
  return cleanSpec.slice(
    rule.prefix.length,
    cleanSpec.length - rule.suffix.length
  );
}

function expandRuleTargets(rule, matchedStar) {
  const candidates = [];
  for (const targetPattern of rule.targets) {
    const substituted =
      rule.isWildcard && targetPattern.includes("*")
        ? targetPattern.replace(/\*/g, () => matchedStar)
        : targetPattern;
    candidates.push(path.resolve(rule.baseDir, substituted));
  }
  return candidates;
}

export function getAliasCandidatePaths(
  specifier,
  projectRoot = process.cwd(),
  { includeBaseUrlFallback = false } = {}
) {
  if (!specifier || typeof specifier !== "string") return [];
  const cleanSpec = specifier.split("?")[0].split("#")[0];
  if (isDisallowedAliasSpecifier(cleanSpec)) return [];

  const info = loadTsconfigAliasInfo(projectRoot);
  const candidates = [];
  for (const rule of info.rules) {
    if (rule.isBaseUrlFallback && !includeBaseUrlFallback) continue;
    const matchedStar = matchRuleToSpecifier(rule, cleanSpec);
    if (matchedStar === null) continue;
    for (const absCandidate of expandRuleTargets(rule, matchedStar)) {
      candidates.push(absCandidate);
    }
  }
  return candidates;
}

export function matchesExplicitUserAlias(
  specifier,
  projectRoot = process.cwd()
) {
  if (!specifier || typeof specifier !== "string") return false;
  const cleanSpec = specifier.split("?")[0].split("#")[0];
  if (isDisallowedAliasSpecifier(cleanSpec)) return false;

  const info = loadTsconfigAliasInfo(projectRoot);
  for (const rule of info.rules) {
    if (rule.isBaseUrlFallback) continue;
    // Avoid treating catch-all "*" user pattern as non-npm without disk check
    if (rule.pattern === "*") continue;
    if (matchRuleToSpecifier(rule, cleanSpec) !== null) {
      return true;
    }
  }
  return false;
}

export function resolveTsconfigAlias(
  specifier,
  {
    projectRoot = process.cwd(),
    extensions = null,
    preferStyles = false,
  } = {}
) {
  if (!specifier || typeof specifier !== "string") return null;
  const cleanSpec = specifier.split("?")[0].split("#")[0];
  if (isDisallowedAliasSpecifier(cleanSpec)) return null;

  const info = loadTsconfigAliasInfo(projectRoot);
  for (const rule of info.rules) {
    const matchedStar = matchRuleToSpecifier(rule, cleanSpec);
    if (matchedStar === null) continue;

    const expandedCandidates = expandRuleTargets(rule, matchedStar);
    for (const absCandidate of expandedCandidates) {
      const resolved = resolveCandidateFile(absCandidate, {
        extensions,
        preferStyles,
      });
      if (resolved) {
        return resolved;
      }
    }
  }

  return null;
}

function mapResolvedToSwcMirrorIfPresent(resolvedPath, rootAbs) {
  if (!resolvedPath || !/\.[jt]sx?$/i.test(resolvedPath)) {
    return resolvedPath;
  }
  const normResolved = normalizeCacheRootKey(resolvedPath);
  const normRoot = normalizeCacheRootKey(rootAbs);
  if (!normResolved.startsWith(normRoot + "/")) {
    return resolvedPath;
  }
  const rel = path.relative(rootAbs, resolvedPath).replace(/\\/g, "/");
  if (rel.startsWith(".dinou/") || rel.startsWith("node_modules/")) {
    return resolvedPath;
  }
  const mirrorRel = rel.replace(/\.[jt]sx?$/i, ".js");
  const mirrorAbs = path.resolve(rootAbs, ".dinou", "swc", mirrorRel);
  if (isExistingFile(mirrorAbs)) {
    return mirrorAbs;
  }
  return resolvedPath;
}

export function esbuildTsconfigAliasesPlugin({
  projectRoot = process.cwd(),
  assetRegex = null,
  getAssetRegex = null,
  preferSwcMirror = false,
  skipAssets = true,
} = {}) {
  const rootDir = path.resolve(projectRoot || process.cwd());

  return {
    name: "dinou-tsconfig-aliases",
    setup(build) {
      let activeAssetRegex = assetRegex || DEFAULT_ASSET_REGEX;
      build.onStart(() => {
        if (typeof getAssetRegex === "function") {
          try {
            activeAssetRegex = getAssetRegex() || DEFAULT_ASSET_REGEX;
          } catch (e) {
            activeAssetRegex = assetRegex || DEFAULT_ASSET_REGEX;
          }
        }
      });

      build.onResolve({ filter: /^[^.\/\\]/ }, (args) => {
        if (args.kind === "entry-point") return null;
        if (args.pluginData?.skipDinouTsconfigAliases) return null;

        const cleanSpec = args.path ? args.path.split("?")[0].split("#")[0] : "";
        if (isDisallowedAliasSpecifier(cleanSpec)) return null;

        if (skipAssets && activeAssetRegex && activeAssetRegex.test(cleanSpec)) {
          return null;
        }

        const resolved = resolveTsconfigAlias(cleanSpec, {
          projectRoot: rootDir,
        });
        if (!resolved) {
          return null;
        }

        if (skipAssets && activeAssetRegex && activeAssetRegex.test(resolved)) {
          return null;
        }

        const finalPath = preferSwcMirror
          ? mapResolvedToSwcMirrorIfPresent(resolved, rootDir)
          : resolved;

        const isDev =
          process.env.DINOU_DEV === "true" ||
          process.env.NODE_ENV !== "production";
        if (isDev) {
          const watchFiles = getWatchedTsconfigFiles(rootDir);
          if (watchFiles.length > 0) {
            return { path: finalPath, watchFiles };
          }
        }

        return { path: finalPath };
      });
    },
  };
}

export function rollupTsconfigAliasesPlugin({
  projectRoot = process.cwd(),
  assetRegex = null,
  skipAssets = true,
} = {}) {
  const rootDir = path.resolve(projectRoot || process.cwd());
  const activeAssetRegex = assetRegex || DEFAULT_ASSET_REGEX;

  return {
    name: "dinou-tsconfig-aliases",
    resolveId(source, _importer, options) {
      if (options?.isEntry) return null;
      if (!source || typeof source !== "string") return null;

      const cleanSpec = source.split("?")[0].split("#")[0];
      if (isDisallowedAliasSpecifier(cleanSpec)) return null;

      if (skipAssets && activeAssetRegex && activeAssetRegex.test(cleanSpec)) {
        return null;
      }

      if (typeof this?.addWatchFile === "function") {
        for (const cf of getWatchedTsconfigFiles(rootDir)) {
          this.addWatchFile(cf);
        }
      }

      const resolved = resolveTsconfigAlias(cleanSpec, {
        projectRoot: rootDir,
      });
      if (!resolved) return null;

      if (skipAssets && activeAssetRegex && activeAssetRegex.test(resolved)) {
        return null;
      }

      return resolved;
    },
  };
}

export function createWebpackTsconfigAliasesResolvePlugin({
  projectRoot = process.cwd(),
} = {}) {
  const rootDir = path.resolve(projectRoot || process.cwd());

  return {
    apply(resolver) {
      if (!resolver || typeof resolver.ensureHook !== "function") return;
      const target = resolver.ensureHook("resolve");
      resolver
        .getHook("described-resolve")
        .tapAsync(
          "DinouTsconfigAliasesResolvePlugin",
          (request, resolveContext, callback) => {
            const rawReq = request?.request;
            if (!rawReq || typeof rawReq !== "string") {
              return callback();
            }
            const cleanSpec = rawReq.split("?")[0].split("#")[0];
            if (isDisallowedAliasSpecifier(cleanSpec)) {
              return callback();
            }

            const info = loadTsconfigAliasInfo(rootDir);
            if (
              resolveContext?.fileDependencies &&
              typeof resolveContext.fileDependencies.add === "function"
            ) {
              for (const cf of info.configFiles) {
                resolveContext.fileDependencies.add(cf.path);
              }
            }

            const resolved = resolveTsconfigAlias(cleanSpec, {
              projectRoot: rootDir,
            });
            if (!resolved) {
              return callback();
            }

            const qIdx = rawReq.search(/[?#]/);
            const suffix = qIdx === -1 ? "" : rawReq.slice(qIdx);
            const nextRequest = {
              ...request,
              request: resolved + suffix,
            };

            return resolver.doResolve(
              target,
              nextRequest,
              `resolved tsconfig alias ${rawReq} -> ${resolved}`,
              resolveContext,
              callback
            );
          }
        );
    },
  };
}

export default {
  DEFAULT_ALIAS_CODE_EXTENSIONS,
  DEFAULT_ALIAS_STYLE_EXTENSIONS,
  stripJsonCommentsAndTrailingCommas,
  clearTsconfigAliasCache,
  inferProjectRootFromDir,
  loadTsconfigAliasInfo,
  getWatchedTsconfigFiles,
  getSanitizedEsbuildTsconfigRaw,
  resolveCandidateFile,
  getAliasCandidatePaths,
  matchesExplicitUserAlias,
  resolveTsconfigAlias,
  esbuildTsconfigAliasesPlugin,
  rollupTsconfigAliasesPlugin,
  createWebpackTsconfigAliasesResolvePlugin,
};
