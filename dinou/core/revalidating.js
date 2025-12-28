const path = require("path");
const { existsSync, readFileSync, copyFileSync } = require("fs");
const generateStaticPage = require("./generate-static-page");
const { buildStaticPage } = require("./build-static-pages");
const generateStaticRSC = require("./generate-static-rsc");

const regenerating = new Set();

function revalidating(reqPath) {
  const distFolder = path.resolve(process.cwd(), "dist");
  const dist2Folder = path.resolve(process.cwd(), "dist2");
  const jsonPath = path.join(distFolder, reqPath, "index.json");

  if (!existsSync(jsonPath)) return;

  const { revalidate, generatedAt } = JSON.parse(
    readFileSync(jsonPath, "utf8")
  );

  const isExpired =
    typeof revalidate === "number" &&
    revalidate > 0 &&
    Date.now() > generatedAt + revalidate;

  if (isExpired && !regenerating.has(reqPath)) {
    copyFileSync(
      path.join(dist2Folder, reqPath, "index.html"),
      path.join(dist2Folder, reqPath, "index._old.html")
    );
    copyFileSync(
      path.join(dist2Folder, reqPath, "rsc.rsc"),
      path.join(dist2Folder, reqPath, "rsc._old.rsc")
    );
    regenerating.add(reqPath);
    (async () => {
      try {
        // 1. Primero construimos el JSON (Base de datos de la página)
        await buildStaticPage(reqPath);

        // 2. Una vez tenemos el JSON, generamos el HTML y el RSC en paralelo 🚀
        await Promise.all([
          generateStaticPage(reqPath),
          generateStaticRSC(reqPath),
        ]);
        console.log(`[ISR] Successfully regenerated: ${reqPath}`);
      } catch (e) {
        console.error(`[ISR] Error regenerating ${reqPath}:`, err);
      } finally {
        regenerating.delete(reqPath);
      }
    })();
  }
}

module.exports = { revalidating, regenerating };
