// dinou/core/generate-static.js
// Unified Static Site Generation runner using the in-memory Dual-Bundle Engine.
// Guarantees 100% parity with runtime Incremental Static Generation (ISG).

import path from "node:path";
import { existsSync, rmSync, mkdirSync, renameSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { setStorageAdapter, FileSystemStorage } from "./storage-adapter.js";
import {
  generateStaticPageRSC,
  generateStaticLayoutRSC,
} from "./generate-static-rsc.js";
import { resolveLayoutFunctionsConfig } from "./layout-functions.js";

async function generateStatic() {
  const distFolder2 = path.resolve(process.cwd(), ".dinou/dist2");

  if (existsSync(distFolder2)) {
    rmSync(distFolder2, { recursive: true, force: true });
  }

  const { updateBuildProgress, clearBuildProgress, isTTY } = await import(
    "../node/terminal-status.js"
  );

  // 1. Compile or ensure Dual-Bundle engines (Pass A & Pass B)
  updateBuildProgress("[SSG] Compiling Dual-Engine for static generation...");
  const { bundleDualEngine } = await import("../node/bundle-dual-engine.js");
  const { rscEnginePath, ssrEnginePath } = await bundleDualEngine({
    isDev: false,
    projectRoot: process.cwd(),
    outDir: ".dinou/node",
  });

  // 2. Initialize FileSystemStorage for writing .dinou/dist2
  const storage = new FileSystemStorage(distFolder2);
  setStorageAdapter(storage);

  // 3. Load compiled engines
  const rscModule = await import(pathToFileURL(rscEnginePath).href);
  const ssrModule = await import(pathToFileURL(ssrEnginePath).href);

  // 4. Discover static routes and layouts
  updateBuildProgress("[SSG] Discovering static routes and layouts...");
  await rscModule.buildStaticPages((info) => {
    if (info.phase === "discovering") {
      updateBuildProgress(
        `[SSG] (${info.current}/${info.total}) Discovering: ${info.route}`
      );
    } else if (info.phase === "crawling") {
      updateBuildProgress(`[SSG] Crawling: ${info.route}`);
    }
  });

  const routes = rscModule.getStaticPaths();
  const layouts =
    typeof rscModule.getStaticLayouts === "function"
      ? rscModule.getStaticLayouts()
      : [];

  // 4b. Pre-render all static layout segments (layout.rsc)
  if (layouts.length > 0) {
    if (!isTTY) {
      console.log(`⚡ [SSG] Pre-rendering ${layouts.length} static layout(s)...`);
    }
    for (const layoutInfo of layouts) {
      const layoutReqPath = layoutInfo.routePath.startsWith("/")
        ? layoutInfo.routePath
        : "/" + layoutInfo.routePath;
      updateBuildProgress(`[SSG] Compiling layout: ${layoutReqPath}`);
      try {
        const layoutReq = new Request(`http://localhost/____rsc_layout____${layoutReqPath}`);
        const layoutRes = await rscModule.handleRequest(layoutReq, {
          runtime: "node-bundle",
          isSSG: true,
        });
        if (
          layoutRes.status === 200 &&
          !layoutRes.headers.has("x-rsc-redirect") &&
          !layoutRes.headers.has("location")
        ) {
          const layoutRscText = await layoutRes.text();
          if (layoutRscText && layoutRscText.trim().length > 0) {
            const cleanLayoutPath = layoutReqPath.replace(/^\/+/, "").replace(/\/+$/, "");
            const layoutRscKey = cleanLayoutPath ? `${cleanLayoutPath}/layout.rsc` : "layout.rsc";

            let layoutMeta = {
              status: 200,
              generatedAt: Date.now(),
              revalidate: undefined,
              tags: [],
            };
            try {
              const layoutConfig = await resolveLayoutFunctionsConfig(
                layoutInfo.layoutPath,
                layoutInfo.params || {}
              );
              layoutMeta.revalidate = layoutConfig.revalidate;
              layoutMeta.tags = layoutConfig.tags || [];
              if (layoutConfig.ppr !== null && layoutConfig.ppr !== undefined) {
                layoutMeta.ppr = Boolean(layoutConfig.ppr);
              }
            } catch (e) {}

            try {
              const slotTagsHeader = layoutRes.headers.get("x-dinou-slot-tags");
              if (slotTagsHeader) {
                const parsedSlotTags = JSON.parse(slotTagsHeader);
                if (Array.isArray(parsedSlotTags) && parsedSlotTags.length > 0) {
                  layoutMeta.slotTags = parsedSlotTags;
                }
              }
              const holesHeader = layoutRes.headers.get("x-dinou-ppr-holes");
              if (holesHeader) {
                const parsedHoles = JSON.parse(holesHeader);
                if (Array.isArray(parsedHoles) && parsedHoles.length > 0) {
                  layoutMeta.holes = parsedHoles;
                }
              }
              const suspenseCountHeader = layoutRes.headers.get("x-dinou-suspense-count");
              if (suspenseCountHeader !== null) {
                layoutMeta.suspenseCount = Number(suspenseCountHeader) || 0;
              }
              if (layoutRes.headers.get("x-dinou-dynamic") === "true") {
                layoutMeta.dynamic = true;
              }
            } catch (e) {}

            await storage.set(layoutRscKey, layoutRscText, layoutMeta);
          }
        } else if (
          !layoutRes.headers.has("x-rsc-redirect") &&
          !layoutRes.headers.has("location")
        ) {
          const layoutResult = await generateStaticLayoutRSC(
            layoutReqPath,
            layoutInfo.layoutPath
          );
          if (
            layoutResult &&
            layoutResult.tempPath &&
            layoutResult.finalPath &&
            existsSync(layoutResult.tempPath)
          ) {
            mkdirSync(path.dirname(layoutResult.finalPath), { recursive: true });
            renameSync(layoutResult.tempPath, layoutResult.finalPath);
          }
        }
      } catch (layoutErr) {
        console.error(
          `❌ [SSG] Error compiling layout ${layoutReqPath}:`,
          layoutErr
        );
      }
    }
  }

  if (!isTTY) {
    console.log(
      `⚡ [SSG] Pre-rendering ${routes.length} static route(s) with in-memory Dual-Engine...`
    );
  }

  // 5. Pre-render all routes using Dual-Bundle engine (index.html + page.rsc)
  let renderedCount = 0;
  let currentIndex = 0;
  for (const route of routes) {
    currentIndex++;
    const reqPath = route.startsWith("/") ? route : "/" + route;
    updateBuildProgress(
      `[SSG] (${currentIndex}/${routes.length}) Pre-rendering: ${reqPath}`
    );
    try {
      // A. Pre-render full HTML (index.html) and metadata (metadata.json)
      const webReq = new Request(`http://localhost${reqPath}`);
      const res = await rscModule.handleRequest(webReq, {
        runtime: "node-bundle",
        renderHtmlStream: ssrModule.renderHtml,
        isSSG: true,
      });

      const routeMeta = typeof rscModule.getStaticMetadata === "function" ? rscModule.getStaticMetadata(reqPath) : null;
      const isRoutePpr = Boolean(routeMeta?.ppr);
      const cleanPagePath = reqPath.replace(/^\/+/, "").replace(/\/+$/, "");

      if (res.status === 200) {
        renderedCount++;
        if (isRoutePpr) {
          const indexHtmlKey = cleanPagePath ? `${cleanPagePath}/index.html` : "index.html";
          const shellHtmlKey = cleanPagePath ? `${cleanPagePath}/shell.html` : "shell.html";
          const metaKey = cleanPagePath ? `${cleanPagePath}/metadata.json` : "metadata.json";

          const htmlItem = await storage.get(indexHtmlKey);
          const effectiveHoles =
            Array.isArray(htmlItem?.metadata?.holes) && htmlItem.metadata.holes.length > 0
              ? htmlItem.metadata.holes
              : routeMeta.holes || [];
          if (htmlItem) {
            await storage.set(shellHtmlKey, htmlItem.content, {
              ...(htmlItem.metadata || {}),
              ppr: true,
              holes: effectiveHoles,
            });
          }
          const metaItem = await storage.get(metaKey);
          let metaObj = {};
          try {
            metaObj = metaItem ? JSON.parse(metaItem.content || "{}") : {};
          } catch (e) {}
          metaObj.ppr = true;
          metaObj.holes =
            Array.isArray(metaObj.holes) && metaObj.holes.length > 0
              ? metaObj.holes
              : effectiveHoles;
          await storage.set(metaKey, JSON.stringify(metaObj));
        }
      } else {
        if (process.env.DINOU_DEBUG) {
          console.warn(`⚠️ [SSG] Route ${reqPath} returned status ${res.status}`);
        }
      }

      // B. Pre-render isolated page RSC segment (page.rsc) if not already persisted in Step 5A
      const pageRscKey = cleanPagePath ? `${cleanPagePath}/page.rsc` : "page.rsc";
      const existingPageRsc = await storage.get(pageRscKey);
      if (!existingPageRsc || !existingPageRsc.content) {
        try {
          const pageReq = new Request(`http://localhost/____rsc_page____${reqPath}`);
          const pageRes = await rscModule.handleRequest(pageReq, {
            runtime: "node-bundle",
            isSSG: true,
          });
          if (
            pageRes.status === 200 &&
            !pageRes.headers.has("x-rsc-redirect") &&
            !pageRes.headers.has("location")
          ) {
            const pageRscText = await pageRes.text();
            if (pageRscText && pageRscText.trim().length > 0) {
              await storage.set(pageRscKey, pageRscText);
              if (isRoutePpr) {
                const shellRscKey = cleanPagePath ? `${cleanPagePath}/shell.rsc` : "shell.rsc";
                await storage.set(shellRscKey, pageRscText);
              }
            }
          } else if (
            res.status === 200 &&
            !pageRes.headers.has("x-rsc-redirect") &&
            !pageRes.headers.has("location")
          ) {
            const pageResult = await generateStaticPageRSC(reqPath);
            if (
              pageResult &&
              pageResult.tempPath &&
              pageResult.finalPath &&
              existsSync(pageResult.tempPath)
            ) {
              mkdirSync(path.dirname(pageResult.finalPath), { recursive: true });
              renameSync(pageResult.tempPath, pageResult.finalPath);
            }
          }
        } catch (pageErr) {
          const pageResult = await generateStaticPageRSC(reqPath);
          if (
            pageResult &&
            pageResult.tempPath &&
            pageResult.finalPath &&
            existsSync(pageResult.tempPath)
          ) {
            mkdirSync(path.dirname(pageResult.finalPath), { recursive: true });
            renameSync(pageResult.tempPath, pageResult.finalPath);
          }
        }
      }
    } catch (err) {
      console.error(`❌ [SSG] Error pre-rendering ${reqPath}:`, err);
    }
  }

  clearBuildProgress();
  console.log(
    `✓ [SSG] Pre-rendered ${renderedCount} page(s) and ${layouts.length} layout(s) to .dinou/dist2`
  );
}

export { generateStatic };
export default generateStatic;
