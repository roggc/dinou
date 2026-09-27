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
  }

  const { updateBuildProgress, clearBuildProgress, isTTY } = await import("../node/terminal-status.mjs");

  // 1. Compile or ensure Dual-Bundle engines (Pass A & Pass B)
  updateBuildProgress("[SSG] Compiling Dual-Engine for static generation...");
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
  updateBuildProgress("[SSG] Discovering static routes...");
  await rscModule.buildStaticPages((info) => {
    if (info.phase === "discovering") {
      updateBuildProgress(`[SSG] (${info.current}/${info.total}) Discovering: ${info.route}`);
    } else if (info.phase === "crawling") {
      updateBuildProgress(`[SSG] Crawling: ${info.route}`);
    }
  });
  const routes = rscModule.getStaticPaths();

  if (!isTTY) {
    console.log(`⚡ [SSG] Pre-rendering ${routes.length} static route(s) with in-memory Dual-Engine...`);
  }

  // 5. Pre-render all routes using identical Dual-Bundle ISG engine
  let renderedCount = 0;
  let currentIndex = 0;
  for (const route of routes) {
    currentIndex++;
    const reqPath = route.startsWith("/") ? route : "/" + route;
    updateBuildProgress(`[SSG] (${currentIndex}/${routes.length}) Pre-rendering: ${reqPath}`);
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
        if (process.env.DINOU_DEBUG) {
          console.warn(`⚠️ [SSG] Route ${reqPath} returned status ${res.status}`);
        }
      }
    } catch (err) {
      console.error(`❌ [SSG] Error pre-rendering ${reqPath}:`, err);
    }
  }

  clearBuildProgress();
  console.log(`✓ [SSG] Pre-rendered ${renderedCount} static route(s) and RSC payload(s) to .dinou/dist2`);
}

module.exports = generateStatic;
