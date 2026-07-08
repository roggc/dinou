const path = require("path");
const fs = require("fs").promises;
const { existsSync, copyFileSync } = require("fs");
const generateStaticPage = require("./generate-static-page");
const { buildStaticPage } = require("./build-static-pages");
const generateStaticRSC = require("./generate-static-rsc");
const { safeRename } = require("./safe-rename");
const { updateStatus } = require("./status-manifest");

const regenerating = new Set();

function revalidating(reqPath, isDynamicFromServer) {
  const dist2Folder = path.resolve(process.cwd(), "dist2");
  const metadataPath = path.join(dist2Folder, reqPath, "metadata.json");

  if (regenerating.has(reqPath)) return;

  fs.readFile(metadataPath, "utf8")
    .then((content) => {
      const metadata = JSON.parse(content);
      const { revalidate, generatedAt } = metadata;

      const isExpired =
        typeof revalidate === "number" &&
        revalidate > 0 &&
        Date.now() > generatedAt + revalidate;

      if (isExpired && !regenerating.has(reqPath)) {
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
          console.error("[ISR] copyFileSync error:", e);
        }

        regenerating.add(reqPath);

        (async () => {
          try {
            console.log(`[ISR] Starting regeneration for ${reqPath}...`);
        const isDynamic = {};
        await buildStaticPage(reqPath, isDynamic);
        if (isDynamic.value) {
          isDynamicFromServer.value = true;
          console.log(
            `[ISR] Bailout detected for ${reqPath}. Switching to Dynamic.`
          );

          return;
        }

        const rscResult = await generateStaticRSC(reqPath);
        if (!rscResult.success) {
          console.warn(`⚠️ [ISR] RSC generation failed for ${reqPath}. Aborting.`);
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
          console.log(
            `✅ [ISR] Successfully committed ${reqPath} (Status: ${pageResult.status})`
          );
        } else {
          console.warn(
            `⚠️ [ISR] HTML generation failed for ${reqPath}. Aborting commit.`
          );
          await fs.unlink(pageResult.tempPath).catch(() => {});
        }
      } catch (e) {
        console.error(`[ISR] Critical error regenerating ${reqPath}:`, e);
      } finally {
        regenerating.delete(reqPath);
      }
    })();
  }
  }).catch((err) => {});
}

module.exports = { revalidating, regenerating };
