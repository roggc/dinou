// dinou/core/export-static.js
// Exports a standalone static website from .dinou/dist3 (assets) and .dinou/dist2 (SSG HTML + segmented RSC)
// into an 'out/' directory, ready for Surge.sh, GitHub Pages, Cloudflare Pages (static), etc.

import fs from "node:fs";
import path from "node:path";
import {
  shouldExportDist3Entry,
  shouldExportDist2File,
  injectStaticExportFlag,
} from "./static-assets.js";

const projectRoot = process.cwd();
const outDir = path.resolve(projectRoot, "out");
const dist3Dir = path.resolve(projectRoot, ".dinou/dist3");
const dist2Dir = path.resolve(projectRoot, ".dinou/dist2");

const bundlerName = process.env.DINOU_BUILD_TOOL || "esbuild";
console.log(`\n🦖 Dinou (Static Export • ${bundlerName})`);

// 1. Clean output directory
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

function copyRecursive(src, dest, filterFile = null, transformFile = null, relPrefix = "") {
  if (!fs.existsSync(src)) return 0;
  let count = 0;
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const relPosix = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      count += copyRecursive(srcPath, destPath, filterFile, transformFile, relPosix);
    } else {
      if (filterFile && !filterFile(relPosix)) {
        continue;
      }
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      if (transformFile) {
        const transformed = transformFile(srcPath, relPosix);
        if (typeof transformed === "string") {
          fs.writeFileSync(destPath, transformed, "utf8");
          count++;
          continue;
        }
      }
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

// 2. Copy production assets from .dinou/dist3 (JS bundles, CSS, public/)
let assetCount = 0;
if (fs.existsSync(dist3Dir)) {
  assetCount = copyRecursive(dist3Dir, outDir, shouldExportDist3Entry);
  console.log(`  📦 Copied ${assetCount} production asset(s) from .dinou/dist3`);
} else {
  console.warn("⚠️ [Dinou Export] Warning: .dinou/dist3 not found. Did you run a production build first?");
}

// 3. Copy pre-rendered SSG HTML pages + segmented RSC payloads (index.html, page.rsc, layout.rsc) from .dinou/dist2
let pageCount = 0;
if (fs.existsSync(dist2Dir)) {
  pageCount = copyRecursive(
    dist2Dir,
    outDir,
    shouldExportDist2File,
    (srcPath, relPosix) => {
      if (relPosix.toLowerCase().endsWith("index.html")) {
        return injectStaticExportFlag(fs.readFileSync(srcPath, "utf8"));
      }
      return null;
    }
  );
  console.log(`  📄 Copied ${pageCount} static page/payload file(s) from .dinou/dist2`);
} else {
  console.warn("⚠️ [Dinou Export] Warning: .dinou/dist2 not found. Ensure your app has static routes.");
}

const relOut = path.relative(projectRoot, outDir) || "out";
console.log(`\n✓ Standalone static site exported to: ${relOut}/`);
console.log("  👉 Deploy with:");
console.log("     • Surge.sh:       npx surge out <your-domain>.surge.sh");
console.log("     • GitHub Pages:   npx gh-pages -d out");
console.log("     • Cloudflare:     npx wrangler pages deploy out\n");
