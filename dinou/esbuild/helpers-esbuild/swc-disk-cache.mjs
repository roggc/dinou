import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import glob from "fast-glob";
import { transform } from "@swc/core";
import { useServerRegex } from "../../constants.js";
import { extensions as assetExtensions } from "../../core/asset-extensions.js";

const styleExtensions = ["css", "scss", "less", "sass"];
const fontExtensions = ["woff", "woff2", "ttf", "eot", "otf"];
const redirectExtensions = [...styleExtensions, ...assetExtensions, ...fontExtensions];
const redirectFilter = new RegExp(`\\.(${redirectExtensions.join("|")})$`, "i");

const normPath = (p) => {
  if (!p) return "";
  let s = path.resolve(p).replace(/\\/g, "/");
  if (process.platform === "win32") {
    s = s.replace(/^([a-zA-Z]):/, (_, d) => d.toLowerCase() + ":");
  }
  return s;
};

export function getMirrorPath(srcPath, projectRoot = process.cwd()) {
  if (!srcPath) return "";
  const norm = normPath(srcPath);
  const rootNorm = normPath(projectRoot);
  if (!norm.startsWith(rootNorm)) return srcPath;
  const rel = norm.slice(rootNorm.length + 1);
  const targetRel = rel.replace(/\.[jt]sx?$/, ".js");
  return path.resolve(projectRoot, ".dinou/swc", targetRel);
}

export function getOriginalPath(mirrorPath, projectRoot = process.cwd()) {
  if (!mirrorPath) return "";
  const norm = normPath(mirrorPath);
  const rootNorm = normPath(projectRoot);
  const swcPrefix = `${rootNorm}/.dinou/swc/`;
  if (!norm.startsWith(swcPrefix)) return mirrorPath;
  const rel = norm.slice(swcPrefix.length);
  const base = path.resolve(projectRoot, rel.replace(/\.js$/, ""));
  for (const ext of [".tsx", ".ts", ".jsx", ".js"]) {
    const candidate = base + ext;
    if (fsSync.existsSync(candidate)) return candidate;
  }
  return base + ".tsx";
}

export async function transformToDisk(srcPath, projectRoot = process.cwd()) {
  const normSrc = path.resolve(srcPath);
  if (!fsSync.existsSync(normSrc)) return null;

  const raw = await fs.readFile(normSrc, "utf8");
  // Skip server functions - handled by serverFunctionsPlugin proxy
  if (useServerRegex.test(raw)) {
    return null;
  }

  const targetPath = getMirrorPath(normSrc, projectRoot);

  try {
    const { code } = await transform(raw, {
      filename: normSrc,
      sourceMaps: "inline",
      jsc: {
        parser: { syntax: "typescript", tsx: true, dynamicImport: true },
        target: "es2022",
        transform: {
          react: {
            refresh: true,
            development: true,
            runtime: "automatic",
          },
        },
      },
    });
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, code, "utf8");
    return targetPath;
  } catch (err) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, raw, "utf8");
    return targetPath;
  }
}

export async function syncAllSwcFiles(srcDir = path.resolve("src"), projectRoot = process.cwd()) {
  const files = await glob(["**/*.{js,jsx,ts,tsx}"], { cwd: srcDir, absolute: true });
  const tasks = [];

  for (const f of files) {
    let raw = "";
    try {
      raw = fsSync.readFileSync(f, "utf8");
    } catch (e) {
      continue;
    }
    // Skip server functions
    if (useServerRegex.test(raw)) {
      continue;
    }

    const targetPath = getMirrorPath(f, projectRoot);
    let needCompile = true;
    try {
      if (fsSync.existsSync(targetPath)) {
        const srcStat = fsSync.statSync(f);
        const tgtStat = fsSync.statSync(targetPath);
        if (tgtStat.mtimeMs >= srcStat.mtimeMs) {
          needCompile = false;
        }
      }
    } catch (e) {}

    if (needCompile) {
      tasks.push(transformToDisk(f, projectRoot));
    }
  }

  if (tasks.length > 0) {
    await Promise.all(tasks);
  }
}

export function swcRedirectPlugin({ projectRoot = process.cwd() } = {}) {
  const swcDir = path.resolve(projectRoot, ".dinou/swc");
  const resolveCache = new Map();

  let redirTime = 0;
  let redirCalls = 0;
  let redirHits = 0;

  const candidateExtensions = [
    "",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    "/index.js",
    "/index.jsx",
    "/index.ts",
    "/index.tsx",
  ];

  return {
    name: "swc-disk-cache-redirect",
    setup(build) {
      build.onStart(() => {
        resolveCache.clear();
        redirTime = 0;
        redirCalls = 0;
        redirHits = 0;
      });

      // Redirect CSS, assets, and server functions / source files imported from inside .dinou/swc back to src/
      build.onResolve(
        { filter: /.*/ },
        (args) => {
          const importer = args.importer || "";
          if (!importer.includes(".dinou/swc") && !importer.includes(".dinou\\swc")) {
            return null;
          }

          // Only process relative imports or assets
          const isRelative = args.path.startsWith(".");
          const isAsset = redirectFilter.test(args.path);
          if (!isRelative && !isAsset) {
            return null;
          }

          const tStart = Date.now();
          redirCalls++;

          const cacheKey = importer + "::" + args.path;
          if (resolveCache.has(cacheKey)) {
            redirHits++;
            redirTime += Date.now() - tStart;
            return resolveCache.get(cacheKey);
          }

          // 1. Check if it exists directly in .dinou/swc
          const candidateBase = path.resolve(path.dirname(importer), args.path);
          if (fsSync.existsSync(candidateBase) && !fsSync.statSync(candidateBase).isDirectory()) {
            resolveCache.set(cacheKey, null);
            redirTime += Date.now() - tStart;
            return null;
          }

          for (const ext of [".js", ".jsx", ".ts", ".tsx", "/index.js", "/index.jsx"]) {
            const candidate = candidateBase + ext;
            if (fsSync.existsSync(candidate) && !fsSync.statSync(candidate).isDirectory()) {
              resolveCache.set(cacheKey, null);
              redirTime += Date.now() - tStart;
              return null;
            }
          }

          // 2. Otherwise redirect to original in src/
          const relFromSwc = path.relative(swcDir, path.dirname(importer));
          const originalDir = path.join(projectRoot, relFromSwc);
          const targetBase = path.resolve(originalDir, args.path);

          for (const ext of candidateExtensions) {
            const target = targetBase + ext;
            if (fsSync.existsSync(target) && !fsSync.statSync(target).isDirectory()) {
              const res = { path: target };
              resolveCache.set(cacheKey, res);
              redirTime += Date.now() - tStart;
              return res;
            }
          }

          resolveCache.set(cacheKey, null);
          redirTime += Date.now() - tStart;
          return null;
        }
      );

      build.onEnd(() => {
        globalThis.__DINOU_REDIRECT_TIME__ = redirTime;
        globalThis.__DINOU_REDIRECT_CALLS__ = redirCalls;
        globalThis.__DINOU_REDIRECT_HITS__ = redirHits;
      });
    },
  };
}
