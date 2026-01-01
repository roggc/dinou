// dinou/core/promote-to-static.js
const fs = require("fs").promises;
const generateStaticPage = require("./generate-static-page");
const generateStaticRSC = require("./generate-static-rsc");
const { buildStaticPage } = require("./build-static-pages");
const { regenerating } = require("./revalidating"); // Compartimos el Set de bloqueos
const { updateStatusManifest } = require("./revalidating"); // Reutilizamos el helper

function generatingISG(reqPath) {
  // 1. Protección de Concurrencia
  if (regenerating.has(reqPath)) return;
  regenerating.add(reqPath);

  (async () => {
    try {
      console.log(`[ISG] Promoting new page to static: ${reqPath}...`);
      const isDynamic = {};
      // A. Construir Datos (con chequeo de dynamic)
      await buildStaticPage(reqPath, isDynamic);

      if (isDynamic.value) {
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
        // Renombrar .tmp -> Final
        await fs.rename(pageResult.tempPath, pageResult.finalPath);
        await fs.rename(rscResult.tempPath, rscResult.finalPath);

        // Actualizar Manifiesto
        await updateStatusManifest(reqPath, pageResult.status);

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
