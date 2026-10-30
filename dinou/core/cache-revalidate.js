import path from "node:path";
import fs from "node:fs/promises";
import { existsSync, copyFileSync } from "node:fs";
import { getContext, requestStorage } from "./request-context.js";
import { resolveRelativeUrl } from "./url-resolver.js";
import { getStorageAdapter } from "./storage-adapter.js";
import { isEdgeRuntime, renderRSCStream } from "./rsc-renderer.js";
import getJSX from "./get-jsx.js";
import { getFilePathAndDynamicParams } from "./get-file-path-and-dynamic-params.js";
import { getActiveLayoutChain } from "./layout-functions.js";

async function walkMetadataFiles(dir, fileList = []) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walkMetadataFiles(entryPath, fileList);
      } else if (
        entry.name === "metadata.json" ||
        entry.name === "layout.metadata.json" ||
        entry.name === "slot.metadata.json"
      ) {
        fileList.push(entryPath);
      }
    }
  } catch (err) {
    // Ignore read errors for individual folders/files
  }
  return fileList;
}

function normalizeRevalidatePath(reqPath) {
  let targetPath = reqPath;

  if (targetPath && !targetPath.startsWith("/") && !targetPath.includes("://")) {
    const ctx = getContext();
    let currentPathname = "/";
    if (ctx && ctx.req) {
      const headerPath =
        ctx.req.headers?.["x-dinou-current-path"] ||
        ctx.req.headers?.["X-Dinou-Current-Path"];
      const referer = ctx.req.headers?.referer;
      if (headerPath) {
        currentPathname = headerPath;
      } else if (referer) {
        try {
          currentPathname = new URL(referer).pathname;
        } catch (e) { }
      } else {
        currentPathname = ctx.req.path || "/";
      }
    }
    targetPath = resolveRelativeUrl(targetPath, currentPathname);
  }

  let cleanPath = targetPath;
  if (!cleanPath.startsWith("/")) {
    cleanPath = "/" + cleanPath;
  }
  if (cleanPath !== "/" && cleanPath.endsWith("/")) {
    cleanPath = cleanPath.slice(0, -1);
  }
  return cleanPath;
}

async function revalidatePage(reqPath) {
  const cleanPath = normalizeRevalidatePath(reqPath);

  if (isEdgeRuntime()) {
    const storage = getStorageAdapter();
    const cleanPathKey = cleanPath.replace(/^\/+/, "").replace(/\/+$/, "");
    const htmlKey = cleanPathKey ? `${cleanPathKey}/index.html` : "index.html";
    const oldHtmlKey = cleanPathKey ? `${cleanPathKey}/index._old.html` : "index._old.html";
    const metaKey = cleanPathKey ? `${cleanPathKey}/metadata.json` : "metadata.json";
    const rscKey = cleanPathKey ? `${cleanPathKey}/page.rsc` : "page.rsc";
    const oldRscKey = cleanPathKey ? `${cleanPathKey}/page._old.rsc` : "page._old.rsc";
    const legacyRscKey = cleanPathKey ? `${cleanPathKey}/rsc.rsc` : "rsc.rsc";

    let cached = await storage.get(htmlKey);
    if (!cached && cleanPathKey) {
      cached = await storage.get(cleanPathKey);
    }
    let currentMeta = (cached && cached.metadata) || {};
    try {
      const metaItem = await storage.get(metaKey);
      if (metaItem && metaItem.content) {
        currentMeta = JSON.parse(metaItem.content);
      }
    } catch (e) {}

    try {
      if (cached && cached.content) {
        await storage.set(oldHtmlKey, cached.content);
      }
      const existingPageRsc = await storage.get(rscKey);
      if (existingPageRsc && existingPageRsc.content) {
        await storage.set(oldRscKey, existingPageRsc.content);
      }
    } catch (e) {}

    const reqPathWithSlash = cleanPath.endsWith("/") ? cleanPath : cleanPath + "/";
    const reqSegments = cleanPath.split("/").filter(Boolean);
    const srcFolder = path.resolve(process.cwd(), "src");
    const [pagePath] = getFilePathAndDynamicParams(reqSegments, {}, srcFolder);

    let activeLayoutRscText = "";
    let maxActiveLayoutGenTime = 0;
    try {
      if (!currentMeta.ppr) {
        const activeChain = getActiveLayoutChain(reqSegments, {}, srcFolder);
        if (activeChain.length > 0) {
          for (const entry of activeChain) {
            const lMetaKey = entry.cleanLayoutKey
              ? `${entry.cleanLayoutKey}/layout.metadata.json`
              : "layout.metadata.json";
            const lItem = await storage.get(lMetaKey);
            let lGen = Number(lItem?.metadata?.generatedAt || 0);
            if (!lGen && lItem?.content) {
              try {
                lGen = Number(JSON.parse(lItem.content)?.generatedAt || 0);
              } catch (e) {}
            }
            entry.generatedAt = lGen;
            if (lGen > maxActiveLayoutGenTime) {
              maxActiveLayoutGenTime = lGen;
            }
          }
          const leafLayout = activeChain[0];
          if (activeChain.length > 1 && maxActiveLayoutGenTime > (leafLayout.generatedAt || 0)) {
            await revalidateLayout(leafLayout.layoutRoutePath);
          }
          const leafRscKey = leafLayout.cleanLayoutKey
            ? `${leafLayout.cleanLayoutKey}/layout.rsc`
            : "layout.rsc";
          const leafRscItem = await storage.get(leafRscKey);
          if (leafRscItem && leafRscItem.content && !leafRscItem.content.trimStart().startsWith("<")) {
            activeLayoutRscText = leafRscItem.content;
          }
        }
      }
    } catch (e) {}

    const prevGenTime = Math.max((currentMeta && currentMeta.generatedAt) || 0, maxActiveLayoutGenTime);
    const now = Date.now();
    const newGenTime = now <= prevGenTime ? prevGenTime + 100 : now;
    currentMeta.generatedAt = newGenTime;

    let newHtml = cached ? cached.content : "";
    let renderedRsc = "";
    let renderedFullRsc = "";
    let composedFromCachedLayout = false;

    if (pagePath) {
      const revalContext = {
        req: {
          query: {},
          cookies: {},
          headers: {
            "user-agent": "Dinou-ISR-Revalidator",
            host: "localhost",
            "x-forwarded-proto": "http",
          },
          path: reqPathWithSlash,
          method: "GET",
        },
        res: {
          status() {},
          setHeader() {},
          cookie() {},
          clearCookie() {},
          redirect() {},
        },
      };
      const clientManifest =
        (typeof globalThis !== "undefined" && globalThis.__DINOU_CLIENT_MANIFEST__) || {};

      try {
        await requestStorage.run(revalContext, async () => {
          const isNotFound = {};
          const pageJsx = await getJSX(reqPathWithSlash, {}, isNotFound, false, false, {
            segment: "page",
          });
          if (pageJsx && !isNotFound.value) {
            const pageStream = renderRSCStream(pageJsx, clientManifest, { runtime: "edge" });
            renderedRsc = await new Response(pageStream).text();
          }

          const renderHtmlStream =
            typeof globalThis !== "undefined" && globalThis.__DINOU_RENDER_HTML_STREAM__;
          const knownLayouts =
            (typeof globalThis !== "undefined" && globalThis.__DINOU_LAYOUTS__) || [];
          const bootstrapScriptContent = `window.__DINOU_LAYOUTS__ = ${JSON.stringify(knownLayouts)};\nwindow.__DINOU_USE_STATIC__ = true;\nwindow.__DINOU_BUILD_ID__ = "${newGenTime}";\n`;
          const assetManifest =
            (typeof globalThis !== "undefined" && globalThis.__DINOU_ASSET_MANIFEST__) || {};
          const rawMain = assetManifest["main.js"] || "/main.js";
          const clientEntry = rawMain.startsWith("/") ? rawMain : "/" + rawMain;

          if (activeLayoutRscText && renderedRsc && typeof renderHtmlStream === "function") {
            try {
              const encoder = new TextEncoder();
              const toStream = (str) =>
                new ReadableStream({
                  start(controller) {
                    controller.enqueue(encoder.encode(str));
                    controller.close();
                  },
                });
              const htmlStream = await renderHtmlStream(toStream(activeLayoutRscText), {
                pageRscStream: toStream(renderedRsc),
                bootstrapModules: [clientEntry],
                bootstrapScriptContent,
                waitForAll: true,
              });
              const htmlText = await new Response(htmlStream).text();
              if (htmlText) {
                newHtml = htmlText;
                composedFromCachedLayout = true;
              }
            } catch (composeErr) {
              if (process.env.DINOU_DEBUG) {
                console.warn(`⚠️ [Edge Revalidate] Layout+Page composition fallback for ${cleanPath}:`, composeErr?.message || composeErr);
              }
            }
          }

          if (!composedFromCachedLayout) {
            const fullJsx = await getJSX(reqPathWithSlash, {}, isNotFound, false, false);
            if (fullJsx && !isNotFound.value) {
              const fullRscStream = renderRSCStream(fullJsx, clientManifest, { runtime: "edge" });
              if (typeof renderHtmlStream === "function") {
                const [streamForSsr, streamForRsc] = fullRscStream.tee();
                const [rscText, htmlStream] = await Promise.all([
                  new Response(streamForRsc).text(),
                  renderHtmlStream(streamForSsr, {
                    bootstrapModules: [clientEntry],
                    bootstrapScriptContent,
                    waitForAll: true,
                  }),
                ]);
                renderedFullRsc = rscText;
                const htmlText = await new Response(htmlStream).text();
                if (htmlText) {
                  newHtml = htmlText;
                }
              } else {
                renderedFullRsc = await new Response(fullRscStream).text();
              }
            }
          }
        });
      } catch (e) {
        console.warn(`⚠️ [Edge Revalidate] Render fallback for ${cleanPath}:`, e?.message || e);
      }
    }

    if (newHtml && (!renderedFullRsc && !composedFromCachedLayout || now <= prevGenTime)) {
      newHtml = newHtml.replace(
        /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
        new Date(newGenTime).toISOString()
      );
    }
    await storage.set(htmlKey, newHtml, currentMeta);
    if (cleanPathKey) {
      await storage.set(cleanPathKey, newHtml, currentMeta);
    }
    await storage.set(metaKey, JSON.stringify(currentMeta));

    try {
      if (renderedRsc) {
        const finalRsc =
          now <= prevGenTime
            ? renderedRsc.replace(
                /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
                new Date(newGenTime).toISOString()
              )
            : renderedRsc;
        await storage.set(rscKey, finalRsc);
        if (renderedFullRsc) {
          const finalFullRsc =
            now <= prevGenTime
              ? renderedFullRsc.replace(
                  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
                  new Date(newGenTime).toISOString()
                )
              : renderedFullRsc;
          await storage.set(legacyRscKey, finalFullRsc);
        }
      } else {
        let cachedRsc = await storage.get(rscKey);
        if (!cachedRsc) {
          cachedRsc = await storage.get(legacyRscKey);
        }
        if (cachedRsc && cachedRsc.content) {
          const newRsc = cachedRsc.content.replace(
            /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
            new Date(newGenTime).toISOString()
          );
          await storage.set(rscKey, newRsc);
        }
      }
    } catch (e) {}

    console.log(`✅ [Edge Revalidate] Successfully revalidated page ${cleanPath} (generatedAt: ${newGenTime})`);
    return;
  }

  const dist2Folder = path.resolve(process.cwd(), ".dinou/dist2");
  const reqPathWithSlash = cleanPath.endsWith("/") ? cleanPath : cleanPath + "/";

  // Check if there is an existing page to copy to _old
  try {
    if (existsSync(path.join(dist2Folder, reqPathWithSlash, "index.html"))) {
      copyFileSync(
        path.join(dist2Folder, reqPathWithSlash, "index.html"),
        path.join(dist2Folder, reqPathWithSlash, "index._old.html")
      );
    }
    if (existsSync(path.join(dist2Folder, reqPathWithSlash, "page.rsc"))) {
      copyFileSync(
        path.join(dist2Folder, reqPathWithSlash, "page.rsc"),
        path.join(dist2Folder, reqPathWithSlash, "page._old.rsc")
      );
    }
    if (existsSync(path.join(dist2Folder, reqPathWithSlash, "rsc.rsc"))) {
      copyFileSync(
        path.join(dist2Folder, reqPathWithSlash, "rsc.rsc"),
        path.join(dist2Folder, reqPathWithSlash, "rsc._old.rsc")
      );
    }
  } catch (e) {
    // Ignore copy errors
  }

  console.log(`[Revalidate] Starting on-demand page revalidation for ${cleanPath}...`);
  try {
    const isDynamic = {};
    await getBuildStaticPage()(cleanPath, isDynamic);
    if (isDynamic.value) {
      console.log(`[Revalidate] Bailout detected for ${cleanPath}. Switching to dynamic (skipping static write).`);
      return;
    }

    const rscResult = await getGenerateStaticRSC()(cleanPath);
    if (!rscResult.success) {
      console.warn(`⚠️ [Revalidate] RSC generation failed for ${cleanPath}.`);
      if (rscResult.tempPath && existsSync(rscResult.tempPath)) {
        await fs.unlink(rscResult.tempPath).catch(() => { });
      }
      return;
    }

    await getSafeRename()(rscResult.tempPath, rscResult.finalPath);

    const pageResult = await getGenerateStaticPage()(cleanPath);
    if (pageResult.success) {
      await getSafeRename()(pageResult.tempPath, pageResult.finalPath);
      getUpdateStatus()(cleanPath, pageResult.status);
      console.log(`✅ [Revalidate] Successfully revalidated page ${cleanPath} (Status: ${pageResult.status})`);
    } else {
      console.warn(`⚠️ [Revalidate] HTML generation failed for ${cleanPath}.`);
      if (pageResult.tempPath && existsSync(pageResult.tempPath)) {
        await fs.unlink(pageResult.tempPath).catch(() => { });
      }
    }
  } catch (e) {
    console.warn(`⚠️ [Revalidate] Failed to revalidate page ${cleanPath}:`, e.message || e);
  }
}

async function revalidatePath(reqPath, options) {
  if (options !== undefined) {
    console.warn(
      `⚠️ [Dinou] The second parameter (options) in revalidatePath("${reqPath}", ...) is deprecated and ignored since v9.0.3. Zero hydration mismatch is now guaranteed automatically via lazy index.html re-composition.`
    );
  }
  const cleanPath = normalizeRevalidatePath(reqPath);

  if (isEdgeRuntime()) {
    const storage = getStorageAdapter();
    const cleanPathKey = cleanPath.replace(/^\/+/, "").replace(/\/+$/, "");
    const layoutRscKey = cleanPathKey ? `${cleanPathKey}/layout.rsc` : "layout.rsc";
    const layoutMetaKey = cleanPathKey ? `${cleanPathKey}/layout.metadata.json` : "layout.metadata.json";

    // 1. Revalidar primero el layout si existe para este segmento (para que revalidatePage componga con el layout fresco)
    const cachedLayout = await storage.get(layoutRscKey);
    const cachedLayoutMeta = await storage.get(layoutMetaKey);
    if (cachedLayout || cachedLayoutMeta) {
      await revalidateLayout(cleanPath);
    }

    // 2. Revalidar la página
    await revalidatePage(cleanPath);
    return;
  }

  const dist2Folder = path.resolve(process.cwd(), ".dinou/dist2");
  const reqPathWithSlash = cleanPath.endsWith("/") ? cleanPath : cleanPath + "/";
  const targetDir = path.join(dist2Folder, reqPathWithSlash);

  // 1. Revalidar el layout si existe en este segmento
  const layoutFinalPath = path.join(targetDir, "layout.rsc");
  const layoutOldPath = path.join(targetDir, "layout._old.rsc");
  if (existsSync(layoutFinalPath) || existsSync(layoutOldPath)) {
    await revalidateLayout(cleanPath);
  }

  // 2. Revalidar la página
  await revalidatePage(cleanPath);
}

async function revalidateLayout(cleanPath) {
  let targetPath = cleanPath;
  if (!targetPath.startsWith("/")) {
    targetPath = "/" + targetPath;
  }
  if (targetPath !== "/" && targetPath.endsWith("/")) {
    targetPath = targetPath.slice(0, -1);
  }

  if (isEdgeRuntime()) {
    const storage = getStorageAdapter();
    const cleanPathKey = targetPath.replace(/^\/+/, "").replace(/\/+$/, "");
    const layoutRscKey = cleanPathKey ? `${cleanPathKey}/layout.rsc` : "layout.rsc";
    const layoutOldRscKey = cleanPathKey ? `${cleanPathKey}/layout._old.rsc` : "layout._old.rsc";
    const layoutMetaKey = cleanPathKey ? `${cleanPathKey}/layout.metadata.json` : "layout.metadata.json";

    let cached = await storage.get(layoutRscKey);
    let currentMeta = (cached && cached.metadata) || {};
    try {
      const metaItem = await storage.get(layoutMetaKey);
      if (metaItem && metaItem.content) {
        currentMeta = JSON.parse(metaItem.content);
      }
    } catch (e) {}

    try {
      if (cached && cached.content) {
        await storage.set(layoutOldRscKey, cached.content);
      }
    } catch (e) {}

    const prevGenTime = (currentMeta && currentMeta.generatedAt) || 0;
    const now = Date.now();
    const newGenTime = now <= prevGenTime ? prevGenTime + 100 : now;
    currentMeta.generatedAt = newGenTime;

    const reqPathWithSlash = targetPath.endsWith("/") ? targetPath : targetPath + "/";
    let newLayoutRsc = cached && cached.content ? cached.content : "";
    try {
      const revalContext = {
        req: {
          query: {},
          cookies: {},
          headers: {
            "user-agent": "Dinou-ISR-Revalidator",
            host: "localhost",
            "x-forwarded-proto": "http",
          },
          path: reqPathWithSlash,
          method: "GET",
        },
        res: {
          status() {},
          setHeader() {},
          cookie() {},
          clearCookie() {},
          redirect() {},
        },
      };
      const clientManifest =
        (typeof globalThis !== "undefined" && globalThis.__DINOU_CLIENT_MANIFEST__) || {};
      await requestStorage.run(revalContext, async () => {
        const jsx = await getJSX(reqPathWithSlash, {}, {}, false, false, {
          segment: "layout",
        });
        if (jsx) {
          const stream = renderRSCStream(jsx, clientManifest, { runtime: "edge" });
          const rendered = await new Response(stream).text();
          if (rendered) {
            newLayoutRsc = rendered;
          }
        }
      });
    } catch (e) {
      console.warn(`⚠️ [Edge Revalidate] Layout render fallback for ${targetPath}:`, e?.message || e);
    }
    if (newLayoutRsc && now <= prevGenTime) {
      newLayoutRsc = newLayoutRsc.replace(
        /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
        new Date(newGenTime).toISOString()
      );
    }
    await storage.set(layoutMetaKey, JSON.stringify(currentMeta));
    if (newLayoutRsc) {
      await storage.set(layoutRscKey, newLayoutRsc, currentMeta);
    }
    console.log(`✅ [Edge Revalidate] Successfully revalidated layout ${targetPath} (generatedAt: ${newGenTime})`);
    return true;
  }

  const dist2Folder = path.resolve(process.cwd(), ".dinou/dist2");
  const reqPathWithSlash = targetPath.endsWith("/") ? targetPath : targetPath + "/";
  const layoutFinalPath = path.join(dist2Folder, reqPathWithSlash, "layout.rsc");
  const layoutOldPath = path.join(dist2Folder, reqPathWithSlash, "layout._old.rsc");

  if (existsSync(layoutFinalPath)) {
    try {
      copyFileSync(layoutFinalPath, layoutOldPath);
    } catch (e) {}
  }

  console.log(`[Revalidate] Starting on-demand layout revalidation for ${targetPath}...`);
  try {
    const layoutRscResult = await getGenerateStaticRSC()(targetPath, { segment: "layout" });
    if (layoutRscResult && layoutRscResult.success) {
      await getSafeRename()(layoutRscResult.tempPath, layoutRscResult.finalPath);
      console.log(`✅ [Revalidate] Successfully revalidated layout ${targetPath}`);
      return true;
    }
  } catch (err) {
    console.warn(`⚠️ [Revalidate] Failed to revalidate layout ${targetPath}:`, err.message || err);
  }
  return false;
}

async function revalidateTag(tag, options) {
  if (options !== undefined) {
    console.warn(
      `⚠️ [Dinou] The second parameter (options) in revalidateTag("${tag}", ...) is deprecated and ignored since v9.0.3. Zero hydration mismatch is now guaranteed automatically via lazy index.html re-composition.`
    );
  }
  console.log(`[Revalidate] Starting on-demand revalidation for tag: "${tag}"...`);

  const storage = getStorageAdapter();
  if (isEdgeRuntime() || (storage && typeof storage.keys === "function")) {
    if (storage && typeof storage.keys === "function") {
      const allKeys = await storage.keys();
      const targetPaths = new Set();
      const targetLayoutPaths = new Set();
      const targetSlotKeys = new Set();
      if (typeof storage.markTagInvalidated === "function") {
        storage.markTagInvalidated(tag);
      }
      globalThis[Symbol.for("dinou.slot.recent.fresh")]?.clear?.();
      const slotReg = globalThis[Symbol.for("dinou.slot.registry")];
      if (slotReg && typeof slotReg.entries === "function") {
        for (const [regId, entry] of slotReg.entries()) {
          if (regId === tag || (Array.isArray(entry?.tags) && entry.tags.includes(tag))) {
            targetSlotKeys.add(`slots/${regId}/slot.json`);
            targetSlotKeys.add(`slots/${regId}/slot.metadata.json`);
          }
        }
      }
      const targetSlotHostCleanKeys = new Set();
      const targetSlotLayoutCleanKeys = new Set();
      const isFsStorage = Boolean(storage && storage.baseDir);
      for (const rawKey of allKeys) {
        const key = String(rawKey || "").replace(/\\/g, "/");
        if (key.endsWith("/slot.metadata.json") || (!isFsStorage && (key.startsWith("slots/") || key.endsWith("/slot.json")))) {
          try {
            const item = await storage.get(key);
            let meta = item?.metadata;
            if (!meta && item?.content) {
              try { meta = JSON.parse(item.content); } catch (e) {}
            }
            if (meta && Array.isArray(meta.tags) && meta.tags.includes(tag)) {
              targetSlotKeys.add(key);
              if (key.endsWith("/slot.metadata.json")) {
                targetSlotKeys.add(key.slice(0, -"/slot.metadata.json".length) + "/slot.json");
              } else if (key.endsWith("/slot.json")) {
                targetSlotKeys.add(key.slice(0, -"/slot.json".length) + "/slot.metadata.json");
              }
            }
          } catch (e) {}
        } else if (key.endsWith("layout.metadata.json") || (!isFsStorage && key.endsWith("layout.rsc"))) {
          try {
            const item = await storage.get(key);
            let meta = item?.metadata;
            if (!meta && item?.content) {
              try { meta = JSON.parse(item.content); } catch (e) {}
            }
            if (meta && Array.isArray(meta.slotTags) && meta.slotTags.includes(tag)) {
              const cleanLayoutKey = key
                .replace(/\/(?:layout\.metadata\.json|layout\.rsc)$/, "")
                .replace(/^(?:layout\.metadata\.json|layout\.rsc)$/, "");
              targetSlotLayoutCleanKeys.add(cleanLayoutKey);
            }
            if (meta && Array.isArray(meta.tags) && meta.tags.includes(tag)) {
              const cleanKey = key
                .replace(/\/(?:layout\.metadata\.json|layout\.rsc)$/, "")
                .replace(/^(?:layout\.metadata\.json|layout\.rsc)$/, "");
              const normPath = cleanKey ? (cleanKey.startsWith("/") ? cleanKey : "/" + cleanKey) : "/";
              targetLayoutPaths.add(normPath);
            }
          } catch (e) {}
        } else if (key.endsWith("metadata.json")) {
          try {
            const item = await storage.get(key);
            let meta = item?.metadata;
            if (!meta && item?.content) {
              try { meta = JSON.parse(item.content); } catch (e) {}
            }
            if (meta && Array.isArray(meta.slotTags) && meta.slotTags.includes(tag)) {
              const cleanKey = key.replace(/\/(?:metadata\.json|index\.html)$/, "").replace(/^(?:metadata\.json|index\.html)$/, "");
              targetSlotHostCleanKeys.add(cleanKey);
            }
            if (meta && Array.isArray(meta.tags) && meta.tags.includes(tag)) {
              const cleanKey = key
                .replace(/\/metadata\.json$/, "")
                .replace(/^metadata\.json$/, "");
              const normPath = cleanKey ? (cleanKey.startsWith("/") ? cleanKey : "/" + cleanKey) : "/";
              targetPaths.add(normPath);
            }
          } catch (e) {}
        } else if (!isFsStorage && (key.endsWith("index.html") || key.endsWith("shell.html"))) {
          try {
            const item = await storage.get(key);
            const meta = item?.metadata;
            if (meta && Array.isArray(meta.slotTags) && meta.slotTags.includes(tag)) {
              const cleanKey = key
                .replace(/\/(?:metadata\.json|index\.html|shell\.html)$/, "")
                .replace(/^(?:metadata\.json|index\.html|shell\.html)$/, "");
              targetSlotHostCleanKeys.add(cleanKey);
            }
            if (meta && Array.isArray(meta.tags) && meta.tags.includes(tag)) {
              const cleanKey = key
                .replace(/\/(?:index\.html|shell\.html)$/, "")
                .replace(/^(?:index\.html|shell\.html)$/, "");
              const normPath = cleanKey ? (cleanKey.startsWith("/") ? cleanKey : "/" + cleanKey) : "/";
              targetPaths.add(normPath);
            }
          } catch (e) {}
        }
      }
      await Promise.all(Array.from(targetSlotKeys).map((k) => storage.delete(k)));
      for (const cleanLayoutKey of targetSlotLayoutCleanKeys) {
        const layoutRscKey = cleanLayoutKey ? `${cleanLayoutKey}/layout.rsc` : "layout.rsc";
        const layoutMetaKey = cleanLayoutKey ? `${cleanLayoutKey}/layout.metadata.json` : "layout.metadata.json";
        await Promise.all([
          storage.delete(layoutRscKey),
          storage.delete(layoutMetaKey),
        ]);
      }
      for (const cleanKey of targetSlotHostCleanKeys) {
        if (cleanKey.startsWith("slots/") || cleanKey.endsWith("layout.rsc") || cleanKey.endsWith("layout.metadata.json")) continue;
        const htmlKey = cleanKey ? `${cleanKey}/index.html` : "index.html";
        const shellHtmlKey = cleanKey ? `${cleanKey}/shell.html` : "shell.html";
        const metaKey = cleanKey ? `${cleanKey}/metadata.json` : "metadata.json";
        const pageRscKey = cleanKey ? `${cleanKey}/page.rsc` : "page.rsc";
        const shellRscKey = cleanKey ? `${cleanKey}/shell.rsc` : "shell.rsc";
        const rscKey = cleanKey ? `${cleanKey}/rsc.rsc` : "rsc.rsc";
        const delPromises = [
          storage.delete(htmlKey),
          storage.delete(shellHtmlKey),
          storage.delete(metaKey),
          storage.delete(pageRscKey),
          storage.delete(shellRscKey),
          storage.delete(rscKey),
        ];
        if (cleanKey) {
          delPromises.push(storage.delete(cleanKey));
        }
        await Promise.all(delPromises);
      }
      // Revalidate layouts first so any subsequent revalidatePage uses the updated layout.rsc
      await Promise.all(Array.from(targetLayoutPaths).map((p) => revalidateLayout(p)));
      await Promise.all(Array.from(targetPaths).map((p) => revalidatePage(p)));
    }
    return;
  }

  const dist2Folder = path.resolve(process.cwd(), ".dinou/dist2");
  if (!existsSync(dist2Folder)) return;

  const metadataFiles = await walkMetadataFiles(dist2Folder);
  const slotAndLayoutPromises = [];
  const targetPagePaths = [];

  for (const fileOfMeta of metadataFiles) {
    try {
      const content = await fs.readFile(fileOfMeta, "utf8");
      const metadata = JSON.parse(content);
      const hasRouteTag = Boolean(metadata && Array.isArray(metadata.tags) && metadata.tags.includes(tag));
      const hasSlotTag = Boolean(metadata && Array.isArray(metadata.slotTags) && metadata.slotTags.includes(tag));
      if (hasRouteTag || hasSlotTag) {
        if (path.basename(fileOfMeta) === "slot.metadata.json") {
          const slotFolder = path.dirname(fileOfMeta);
          console.log(`✅ [Revalidate] Invalidating cache slot directory: ${slotFolder}`);
          slotAndLayoutPromises.push(
            fs.rm(slotFolder, { recursive: true, force: true }).catch(() => {})
          );
        } else if (path.basename(fileOfMeta) === "layout.metadata.json") {
          if (hasSlotTag && !hasRouteTag) {
            const layoutFolder = path.dirname(fileOfMeta);
            slotAndLayoutPromises.push(
              Promise.all([
                fs.rm(path.join(layoutFolder, "layout.rsc"), { force: true }).catch(() => {}),
                fs.rm(path.join(layoutFolder, "layout.metadata.json"), { force: true }).catch(() => {}),
              ])
            );
          } else {
            const relative = path.relative(dist2Folder, path.dirname(fileOfMeta));
            const reqPath = "/" + relative.replace(/\\/g, "/");
            slotAndLayoutPromises.push(revalidateLayout(reqPath));
          }
        } else {
          if (hasSlotTag && !hasRouteTag) {
            const pageFolder = path.dirname(fileOfMeta);
            slotAndLayoutPromises.push(
              Promise.all([
                fs.rm(path.join(pageFolder, "index.html"), { force: true }).catch(() => {}),
                fs.rm(path.join(pageFolder, "shell.html"), { force: true }).catch(() => {}),
                fs.rm(path.join(pageFolder, "metadata.json"), { force: true }).catch(() => {}),
                fs.rm(path.join(pageFolder, "page.rsc"), { force: true }).catch(() => {}),
                fs.rm(path.join(pageFolder, "shell.rsc"), { force: true }).catch(() => {}),
                fs.rm(path.join(pageFolder, "rsc.rsc"), { force: true }).catch(() => {}),
              ])
            );
          } else {
            const relative = path.relative(dist2Folder, path.dirname(fileOfMeta));
            const reqPath = "/" + relative.replace(/\\/g, "/");
            targetPagePaths.push(reqPath);
          }
        }
      }
    } catch (err) {
      console.error(`[Revalidate] Error reading tags from ${fileOfMeta}:`, err);
    }
  }

  await Promise.all(slotAndLayoutPromises);
  await Promise.all(targetPagePaths.map((p) => revalidatePage(p)));
}

export {
  revalidatePath,
  revalidatePage,
  revalidateTag,
  revalidateLayout,
};
export default {
  revalidatePath,
  revalidatePage,
  revalidateTag,
  revalidateLayout,
};
