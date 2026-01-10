const path = require("path");
const fs = require("fs").promises;
const { existsSync, copyFileSync } = require("fs");
const generateStaticPage = require("./generate-static-page");
const { buildStaticPage } = require("./build-static-pages");
const generateStaticRSC = require("./generate-static-rsc");
const { safeRename } = require("./safe-rename");
const { updateStatus } = require("./status-manifest");
const { getJSXJSON } = require("./jsx-json");

const regenerating = new Set();

function revalidating(reqPath, isDynamicFromServer) {
  const dist2Folder = path.resolve(process.cwd(), "dist2");
  const jsxJSON = getJSXJSON(reqPath);
  if (!jsxJSON) return;

  const { revalidate, generatedAt } = jsxJSON;

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
    } catch (e) {}

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

        const [pageResult, rscResult] = await Promise.all([
          generateStaticPage(reqPath),
          generateStaticRSC(reqPath),
        ]);

        if (pageResult.success && rscResult.success) {
          await safeRename(pageResult.tempPath, pageResult.finalPath);
          await safeRename(rscResult.tempPath, rscResult.finalPath);
          updateStatus(reqPath, pageResult.status);
          isDynamicFromServer.value = false;
          console.log(
            `✅ [ISR] Successfully committed ${reqPath} (Status: ${pageResult.status})`
          );
        } else {
          console.warn(
            `⚠️ [ISR] Partial failure for ${reqPath}. Aborting commit.`
          );

          await fs.unlink(pageResult.tempPath).catch(() => {});
          await fs.unlink(rscResult.tempPath).catch(() => {});
        }
      } catch (e) {
        console.error(`[ISR] Critical error regenerating ${reqPath}:`, e);
      } finally {
        regenerating.delete(reqPath);
      }
    })();
  }
}

module.exports = { revalidating, regenerating };
