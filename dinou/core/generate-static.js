// dinou/core/generate-static.js
// Unified Static Site Generation runner using the in-memory Dual-Bundle Engine.
// Guarantees 100% parity with runtime Incremental Static Generation (ISG).

const path = require("path");
const { existsSync, rmSync } = require("fs");
const { pathToFileURL } = require("url");
const { setStorageAdapter, FileSystemStorage } = require("./storage-adapter.js");

async function generateStatic() {
  const distFolder2 = path.resolve(process.cwd(), ".dinou/dist2");

  if (existsSync(distFolder2)) {
    rmSync(distFolder2, { recursive: true, force: true });
    console.log("Deleted existing .dinou/dist2 folder");
  }

  // 1. Compile or ensure Dual-Bundle engines (Pass A & Pass B)
  console.log("⚡ [SSG] Compiling in-memory Dual-Engine for static generation...");
  const { bundleDualEngine } = await import("../node/bundle-dual-engine.mjs");
  const { rscEnginePath, ssrEnginePath } = await bundleDualEngine({
    isDev: false,
    projectRoot: process.cwd(),
    outDir: ".dinou/node",
  });

  // 2. Initialize FileSystemStorage for writing .dinou/dist2
  setStorageAdapter(new FileSystemStorage(distFolder2));

  // 3. Load compiled engines
  const rscModule = await import(pathToFileURL(rscEnginePath).href);
  const ssrModule = await import(pathToFileURL(ssrEnginePath).href);

  // 4. Discover static routes
  console.log("🔍 [SSG] Discovering static routes...");
  await rscModule.buildStaticPages();
  const routes = rscModule.getStaticPaths();
  console.log(`⚡ [SSG] Discovered ${routes.length} static path(s) to pre-render.`);

  // 5. Pre-render all routes using identical Dual-Bundle ISG engine
  let renderedCount = 0;
  for (const route of routes) {
    const reqPath = route.startsWith("/") ? route : "/" + route;
    try {
      const webReq = new Request(`http://localhost${reqPath}`);
      const res = await rscModule.handleRequest(webReq, {
        runtime: "node-bundle",
        renderHtmlStream: ssrModule.renderHtml,
        isSSG: true,
      });
      if (res.status === 200) {
        renderedCount++;
      } else {
        console.warn(`⚠️ [SSG] Route ${reqPath} returned status ${res.status}`);
      }
    } catch (err) {
      console.error(`❌ [SSG] Error pre-rendering ${reqPath}:`, err);
    }
  }

  console.log(`\n🎉 [SSG] Successfully pre-rendered ${renderedCount} static page(s) and RSC payload(s) to .dinou/dist2.`);
}

module.exports = generateStatic;
