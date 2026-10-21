import fs from "node:fs/promises";
import path from "node:path";
import { existsSync, copyFileSync } from "node:fs";
import { regenerating } from "./revalidating.js";
import { safeRename } from "./safe-rename.js";
import { updateStatus } from "./status-manifest.js";

export function generatingISG(reqPath, isDynamicFromServer) {
  const dist2Folder = path.resolve(process.cwd(), ".dinou/dist2");
  // 1. Concurrency Protection
  if (regenerating.has(reqPath)) return;
  try {
    if (existsSync(path.join(dist2Folder, reqPath, "index.html")))
      copyFileSync(
        path.join(dist2Folder, reqPath, "index.html"),
        path.join(dist2Folder, reqPath, "index._old.html")
      );
    if (existsSync(path.join(dist2Folder, reqPath, "page.rsc")))
      copyFileSync(
        path.join(dist2Folder, reqPath, "page.rsc"),
        path.join(dist2Folder, reqPath, "page._old.rsc")
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
      const { buildStaticPage } = await import("./build-static-pages.js");
      const { default: generateStaticRSC } = await import("./generate-static-rsc.js");
      const { default: generateStaticPage } = await import("./generate-static-page.js");

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
        await fs.unlink(rscResult.tempPath).catch(() => { });
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
        await fs.unlink(pageResult.tempPath).catch(() => { });
        console.warn(`⚠️ [ISG] HTML generation failed for ${reqPath}. Aborting commit.`);
      }

    } catch (e) {
      console.error(`[ISG] Critical error promoting ${reqPath}:`, e);
    } finally {
      regenerating.delete(reqPath);
    }
  })();
}

export default { generatingISG };
