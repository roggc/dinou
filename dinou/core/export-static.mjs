// dinou/core/export-static.mjs
// Exports a standalone static website from .dinou/dist3 (assets) and .dinou/dist2 (SSG HTML)
// into an 'out/' directory, ready for Surge.sh, GitHub Pages, Cloudflare Pages (static), etc.

import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const outDir = path.resolve(projectRoot, "out");
const dist3Dir = path.resolve(projectRoot, ".dinou/dist3");
const dist2Dir = path.resolve(projectRoot, ".dinou/dist2");

console.log("📦 [Dinou Export] Preparing standalone static export...");

// 1. Clean output directory
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return 0;
  let count = 0;
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      count += copyRecursive(srcPath, destPath);
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

// 2. Copy production assets from .dinou/dist3 (JS bundles, CSS, favicons)
let assetCount = 0;
if (fs.existsSync(dist3Dir)) {
  assetCount = copyRecursive(dist3Dir, outDir);
  console.log(`   Copied ${assetCount} production asset(s) from .dinou/dist3`);
} else {
  console.warn("⚠️ [Dinou Export] Warning: .dinou/dist3 not found. Did you run a production build first?");
}

// 3. Copy pre-rendered SSG HTML pages from .dinou/dist2
let pageCount = 0;
if (fs.existsSync(dist2Dir)) {
  pageCount = copyRecursive(dist2Dir, outDir);
  console.log(`   Copied ${pageCount} static page/payload file(s) from .dinou/dist2`);
} else {
  console.warn("⚠️ [Dinou Export] Warning: .dinou/dist2 not found. Ensure your app has static routes.");
}

console.log(`\n🎉 [Dinou Export] Static site exported successfully to: ${outDir}`);
console.log("   Deploy with one of the following:");
console.log("   - Surge.sh:       npx surge out <tu-dominio>.surge.sh");
console.log("   - GitHub Pages:   npx gh-pages -d out");
console.log("   - Cloudflare:     npx wrangler pages deploy out\n");
