// dinou/core/promote-to-static.js
const fs = require("fs").promises;
const path = require("path");
const { existsSync, copyFileSync } = require("fs");
const generateStaticPage = require("./generate-static-page");
const generateStaticRSC = require("./generate-static-rsc");
const { buildStaticPage } = require("./build-static-pages");
const { regenerating } = require("./revalidating"); // We share the Set of locks
const { safeRename } = require("./safe-rename");
const { updateStatus } = require("./status-manifest");

function generatingISG(reqPath, isDynamicFromServer) {
  const dist2Folder = path.resolve(process.cwd(), "dist2");
  // 1. Concurrency Protection
  if (regenerating.has(reqPath)) return;
  try {
    if (existsSync(path.join(dist2Folder, reqPath, "index.html")))
      copyFileSync(
        path.join(dist2Folder, reqPath, "index.html"),
        path.join(dist2Folder, reqPath, "index._old.html")
      );
    if (existsSync(path.join(dist2Folder, reqPath, "rsc.rsc")))
      copyFileSync(
        path.join(dist2Folder, reqPath, "rsc.rsc"),
        path.join(dist2Folder, reqPath, "rsc._old.rsc")
      );
  } catch (e) {
    /* Ignore copy errors */
  }
  regenerating.add(reqPath);

  (async () => {
    try {
      console.log(`[ISG] Promoting new page to static: ${reqPath}...`);
      const isDynamic = {};
      // A. Build Data (with dynamic check)
      await buildStaticPage(reqPath, isDynamic);

      if (isDynamic.value) {
        isDynamicFromServer.value = true;
        console.log(`[ISG] Skipped ${reqPath}: is dynamic`);
        return; // 👋 We exit without doing anything, the page is dynamic
      }

      // B. Generate HTML and RSC (Same as ISR)
      const [pageResult, rscResult] = await Promise.all([
        generateStaticPage(reqPath),
        generateStaticRSC(reqPath),
      ]);

      // C. Transactional Commit
      if (pageResult.success && rscResult.success) {
        await safeRename(pageResult.tempPath, pageResult.finalPath);

        // 2. Rename RSC (.tmp -> .rsc)
        // HERE is where the EPERM used to fail
        await safeRename(rscResult.tempPath, rscResult.finalPath);
        // // Rename .tmp -> Final
        // await fs.rename(pageResult.tempPath, pageResult.finalPath);
        // await fs.rename(rscResult.tempPath, rscResult.finalPath);

        // Update Manifest
        updateStatus(reqPath, pageResult.status);
        isDynamicFromServer.value = false;
        console.log(`✅ [ISG] Successfully promoted ${reqPath} to static.`);
      } else {
        // Cleanup if failed
        await fs.unlink(pageResult.tempPath).catch(() => {});
        await fs.unlink(rscResult.tempPath).catch(() => {});
        console.warn(`⚠️ [ISG] Failed to generate HTML/RSC for ${reqPath}`);
      }
    } catch (e) {
      console.error(`[ISG] Critical error promoting ${reqPath}:`, e);
    } finally {
      regenerating.delete(reqPath);
    }
  })();
}

module.exports = { generatingISG };
