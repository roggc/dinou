import fs from "node:fs";
import path from "node:path";

const IGNORED_OS_BASENAMES = new Set([".ds_store", "thumbs.db"]);
const warnedCollisionRoots = new Set();

function shouldCopyStaticEntry(srcPath) {
  const baseLower = path.basename(srcPath).toLowerCase();
  return !IGNORED_OS_BASENAMES.has(baseLower);
}

export function hasPublicStylesCss(projectRoot = process.cwd()) {
  const publicDir = path.resolve(projectRoot || process.cwd(), "public");
  if (!fs.existsSync(publicDir)) return false;
  try {
    const entries = fs.readdirSync(publicDir, { withFileTypes: true });
    return entries.some(
      (entry) =>
        (entry.isFile() || entry.isSymbolicLink()) &&
        entry.name.toLowerCase() === "styles.css"
    );
  } catch (e) {
    return false;
  }
}

export function warnPublicStylesCssCollision(projectRoot = process.cwd()) {
  const rootDir = path.resolve(projectRoot || process.cwd());
  const rootKey = rootDir.toLowerCase();
  if (warnedCollisionRoots.has(rootKey)) return;
  if (!hasPublicStylesCss(rootDir)) return;
  warnedCollisionRoots.add(rootKey);
  console.warn(
    '⚠️ [Dinou] Detected "public/styles.css" alongside CSS imported in "src/". ' +
      '"/styles.css" is used by Dinou\'s compiled stylesheet bundle, so "public/styles.css" was ignored. ' +
      'Rename the file in "public/" (e.g. "public/custom.css") or import it from "src/".'
  );
}

/**
 * Recursively copies the project's `public/` directory into `outdir`, preserving
 * nested subdirectories and dotfiles (such as `public/.well-known/*` or `public/.nojekyll`).
 * If Dinou already emitted a compiled `styles.css` from `src/`, root `public/styles.css`
 * is skipped with a warning so compiled styles are never overwritten.
 */
export function copyStaticDirectoriesToOutdir(projectRoot, outdir, options = {}) {
  const rootDir = path.resolve(projectRoot || process.cwd());
  const srcDir = path.resolve(rootDir, "public");
  if (!fs.existsSync(srcDir)) return false;

  try {
    if (!fs.statSync(srcDir).isDirectory()) return false;
    const destDir = path.resolve(rootDir, outdir);
    fs.mkdirSync(destDir, { recursive: true });

    const compiledStylesExists =
      Boolean(options.hasCompiledStyles) ||
      Boolean(
        typeof globalThis !== "undefined" && globalThis.__DINOU_HAS_COMPILED_STYLES__
      ) ||
      fs.existsSync(path.join(destDir, "styles.css"));

    if (compiledStylesExists && hasPublicStylesCss(rootDir)) {
      warnPublicStylesCssCollision(rootDir);
    }

    fs.cpSync(srcDir, destDir, {
      recursive: true,
      force: true,
      dereference: true,
      preserveTimestamps: true,
      filter: (srcPath) => {
        if (!shouldCopyStaticEntry(srcPath)) return false;
        if (compiledStylesExists) {
          const rel = path.relative(srcDir, srcPath);
          if (
            rel &&
            !rel.includes(path.sep) &&
            !rel.includes("/") &&
            rel.toLowerCase() === "styles.css"
          ) {
            return false;
          }
        }
        return true;
      },
    });
    return true;
  } catch (e) {
    return false;
  }
}

export default copyStaticDirectoriesToOutdir;
