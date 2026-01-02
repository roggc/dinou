// dinou/core/promote-to-static.js
const fs = require("fs").promises;
const path = require("path");
const { existsSync, copyFileSync } = require("fs");
const generateStaticPage = require("./generate-static-page");
const generateStaticRSC = require("./generate-static-rsc");
const { buildStaticPage } = require("./build-static-pages");
const { regenerating } = require("./revalidating"); // Compartimos el Set de bloqueos
const { updateStatusManifest } = require("./revalidating"); // Reutilizamos el helper
const { safeRename } = require("./safe-rename");

function generatingISG(reqPath, isDynamicFromServer) {
  const dist2Folder = path.resolve(process.cwd(), "dist2");
  // 1. Protección de Concurrencia
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
    /* Ignorar errores de copia */
  }
  regenerating.add(reqPath);

  (async () => {
    try {
      console.log(`[ISG] Promoting new page to static: ${reqPath}...`);
      const isDynamic = {};
      // A. Construir Datos (con chequeo de dynamic)
      await buildStaticPage(reqPath, isDynamic);

      if (isDynamic.value) {
        isDynamicFromServer.value = true;
        console.log(`[ISG] Skipped ${reqPath}: is dynamic`);
        return; // 👋 Salimos sin hacer nada, la página es dinámica
      }

      // B. Generar HTML y RSC (Igual que ISR)
      const [pageResult, rscResult] = await Promise.all([
        generateStaticPage(reqPath),
        generateStaticRSC(reqPath),
      ]);

      // C. Commit Transaccional
      if (pageResult.success && rscResult.success) {
        await safeRename(pageResult.tempPath, pageResult.finalPath);

        // 2. Renombrar RSC (.tmp -> .rsc)
        // AQUÍ es donde solía fallar el EPERM
        await safeRename(rscResult.tempPath, rscResult.finalPath);
        // // Renombrar .tmp -> Final
        // await fs.rename(pageResult.tempPath, pageResult.finalPath);
        // await fs.rename(rscResult.tempPath, rscResult.finalPath);

        // Actualizar Manifiesto
        await updateStatusManifest(reqPath, pageResult.status);
        isDynamicFromServer.value = false;
        console.log(`✅ [ISG] Successfully promoted ${reqPath} to static.`);
      } else {
        // Limpieza si falló
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
