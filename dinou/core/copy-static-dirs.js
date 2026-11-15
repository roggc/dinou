import fs from "node:fs";
import path from "node:path";

const IGNORED_OS_BASENAMES = new Set([".ds_store", "thumbs.db"]);

function shouldCopyStaticEntry(srcPath) {
  const baseLower = path.basename(srcPath).toLowerCase();
  return !IGNORED_OS_BASENAMES.has(baseLower);
}

/**
 * Recursively copies the project's `public/` directory into `outdir`, preserving
 * nested subdirectories and dotfiles (such as `public/.well-known/*` or `public/.nojekyll`).
 */
export function copyStaticDirectoriesToOutdir(projectRoot, outdir) {
  const rootDir = path.resolve(projectRoot || process.cwd());
  const srcDir = path.resolve(rootDir, "public");
  if (!fs.existsSync(srcDir)) return false;

  try {
    if (!fs.statSync(srcDir).isDirectory()) return false;
    const destDir = path.resolve(rootDir, outdir);
    fs.mkdirSync(destDir, { recursive: true });
    fs.cpSync(srcDir, destDir, {
      recursive: true,
      force: true,
      dereference: true,
      preserveTimestamps: true,
      filter: shouldCopyStaticEntry,
    });
    return true;
  } catch (e) {
    return false;
  }
}

export default copyStaticDirectoriesToOutdir;
