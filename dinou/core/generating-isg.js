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

      // B. Generate HTML and RSC sequentially (RSC first, then HTML)
      const rscResult = await generateStaticRSC(reqPath);
      if (!rscResult.success) {
        console.warn(`⚠️ [ISG] RSC generation failed for ${reqPath}. Aborting.`);
        await fs.unlink(rscResult.tempPath).catch(() => {});
        return;
      }

      // Commit the RSC payload immediately so that generateStaticPage can read it
      await safeRename(rscResult.tempPath, rscResult.finalPath);

      const pageResult = await generateStaticPage(reqPath);
      if (pageResult.success) {
        await safeRename(pageResult.tempPath, pageResult.finalPath);
        updateStatus(reqPath, pageResult.status);
        isDynamicFromServer.value = false;
        console.log(`✅ [ISG] Successfully promoted ${reqPath} to static.`);
      } else {
        await fs.unlink(pageResult.tempPath).catch(() => {});
        console.warn(`⚠️ [ISG] HTML generation failed for ${reqPath}. Aborting commit.`);
      }

    } catch (e) {
      console.error(`[ISG] Critical error promoting ${reqPath}:`, e);
    } finally {
      regenerating.delete(reqPath);
    }
  })();
}

module.exports = { generatingISG };
