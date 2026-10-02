const path = require("path");
const fs = require("fs").promises;
const { existsSync, copyFileSync } = require("fs");
let _generateStaticPage = null;
function getGenerateStaticPage() {
  if (!_generateStaticPage) _generateStaticPage = require("./generate-static-page");
  return _generateStaticPage;
}
let _buildStaticPage = null;
function getBuildStaticPage() {
  if (!_buildStaticPage) _buildStaticPage = require("./build-static-pages").buildStaticPage;
  return _buildStaticPage;
}
let _generateStaticRSC = null;
function getGenerateStaticRSC() {
  if (!_generateStaticRSC) _generateStaticRSC = require("./generate-static-rsc");
  return _generateStaticRSC;
}
let _safeRename = null;
function getSafeRename() {
  if (!_safeRename) _safeRename = require("./safe-rename").safeRename;
  return _safeRename;
}
let _updateStatus = null;
function getUpdateStatus() {
  if (!_updateStatus) _updateStatus = require("./status-manifest").updateStatus;
  return _updateStatus;
}
const { getContext } = require("./request-context");
const { resolveRelativeUrl } = require("./url-resolver");
const { getStorageAdapter } = require("./storage-adapter");
const { isEdgeRuntime } = require("./rsc-renderer");

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

async function revalidatePath(reqPath) {
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

  if (isEdgeRuntime()) {
    const storage = getStorageAdapter();
    const cleanPathKey = cleanPath.replace(/^\/+/, "").replace(/\/+$/, "");
    const htmlKey = cleanPathKey ? `${cleanPathKey}/index.html` : "index.html";
    const metaKey = cleanPathKey ? `${cleanPathKey}/metadata.json` : "metadata.json";
    const rscKey = cleanPathKey ? `${cleanPathKey}/page.rsc` : "page.rsc";
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

    const prevGenTime = (currentMeta && currentMeta.generatedAt) || 0;
    const now = Date.now();
    const newGenTime = now <= prevGenTime ? prevGenTime + 100 : now;
    currentMeta.generatedAt = newGenTime;

    let newHtml = cached ? cached.content : "";
    if (newHtml) {
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
    } catch (e) {}

    console.log(`✅ [Edge Revalidate] Successfully revalidated ${cleanPath} (generatedAt: ${newGenTime})`);
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
    if (existsSync(path.join(dist2Folder, reqPathWithSlash, "layout.rsc"))) {
      copyFileSync(
        path.join(dist2Folder, reqPathWithSlash, "layout.rsc"),
        path.join(dist2Folder, reqPathWithSlash, "layout._old.rsc")
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

  console.log(`[Revalidate] Starting on-demand revalidation for ${cleanPath}...`);
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

    try {
      const layoutFinalPath = path.join(dist2Folder, reqPathWithSlash, "layout.rsc");
      const layoutOldPath = path.join(dist2Folder, reqPathWithSlash, "layout._old.rsc");
      if (existsSync(layoutFinalPath) || existsSync(layoutOldPath)) {
        const layoutRscResult = await getGenerateStaticRSC()(cleanPath, { segment: "layout" });
        if (layoutRscResult && layoutRscResult.success) {
          await getSafeRename()(layoutRscResult.tempPath, layoutRscResult.finalPath);
        }
      }
    } catch (e) {
      // Ignore layout revalidation error if no layout exists for this segment
    }

    const pageResult = await getGenerateStaticPage()(cleanPath);
    if (pageResult.success) {
      await getSafeRename()(pageResult.tempPath, pageResult.finalPath);
      getUpdateStatus()(cleanPath, pageResult.status);
      console.log(`✅ [Revalidate] Successfully revalidated ${cleanPath} (Status: ${pageResult.status})`);
    } else {
      console.warn(`⚠️ [Revalidate] HTML generation failed for ${cleanPath}.`);
      if (pageResult.tempPath && existsSync(pageResult.tempPath)) {
        await fs.unlink(pageResult.tempPath).catch(() => { });
      }
    }
  } catch (e) {
    console.warn(`⚠️ [Revalidate] Failed to revalidate ${cleanPath}:`, e.message || e);
  }
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
    const layoutMetaKey = cleanPathKey ? `${cleanPathKey}/layout.metadata.json` : "layout.metadata.json";

    let cached = await storage.get(layoutRscKey);
    let currentMeta = (cached && cached.metadata) || {};
    try {
      const metaItem = await storage.get(layoutMetaKey);
      if (metaItem && metaItem.content) {
        currentMeta = JSON.parse(metaItem.content);
      }
    } catch (e) {}

    const prevGenTime = (currentMeta && currentMeta.generatedAt) || 0;
    const now = Date.now();
    const newGenTime = now <= prevGenTime ? prevGenTime + 100 : now;
    currentMeta.generatedAt = newGenTime;

    await storage.set(layoutMetaKey, JSON.stringify(currentMeta), currentMeta);
    if (cached && cached.content) {
      await storage.set(layoutRscKey, cached.content, currentMeta);
    }
    console.log(`✅ [Edge Revalidate] Successfully revalidated layout ${targetPath} (generatedAt: ${newGenTime})`);
    return;
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
    }
  } catch (err) {
    console.warn(`⚠️ [Revalidate] Failed to revalidate layout ${targetPath}:`, err.message || err);
  }
}

async function revalidateTag(tag) {
  console.log(`[Revalidate] Starting on-demand revalidation for tag: "${tag}"...`);

  if (isEdgeRuntime()) {
    const storage = getStorageAdapter();
    if (typeof storage.keys === "function") {
      const allKeys = await storage.keys();
      const targetPaths = new Set();
      const targetLayoutPaths = new Set();
      const targetSlotKeys = new Set();
      for (const key of allKeys) {
        if (key.includes("slot")) {
          try {
            const item = await storage.get(key);
            let meta = item?.metadata;
            if (!meta && item?.content) {
              try { meta = JSON.parse(item.content); } catch (e) {}
            }
            if (meta && Array.isArray(meta.tags) && meta.tags.includes(tag)) {
              targetSlotKeys.add(key);
            }
          } catch (e) {}
        } else if (key.endsWith("layout.metadata.json") || key.endsWith("layout.rsc")) {
          try {
            const item = await storage.get(key);
            let meta = item?.metadata;
            if (!meta && item?.content) {
              try { meta = JSON.parse(item.content); } catch (e) {}
            }
            if (meta && Array.isArray(meta.tags) && meta.tags.includes(tag)) {
              const cleanKey = key.replace(/\/(?:layout\.metadata\.json|layout\.rsc)$/, "").replace(/^(?:layout\.metadata\.json|layout\.rsc)$/, "");
              targetLayoutPaths.add("/" + cleanKey);
            }
          } catch (e) {}
        } else if (key.endsWith("metadata.json")) {
          try {
            const item = await storage.get(key);
            let meta = item?.metadata;
            if (!meta && item?.content) {
              try { meta = JSON.parse(item.content); } catch (e) {}
            }
            if (meta && Array.isArray(meta.tags) && meta.tags.includes(tag)) {
              const cleanKey = key.replace(/\/metadata\.json$/, "").replace(/^metadata\.json$/, "");
              targetPaths.add("/" + cleanKey);
            }
          } catch (e) {}
        } else if (key.endsWith("index.html")) {
          try {
            const item = await storage.get(key);
            const meta = item?.metadata;
            if (meta && Array.isArray(meta.tags) && meta.tags.includes(tag)) {
              const cleanKey = key.replace(/\/index\.html$/, "").replace(/^index\.html$/, "");
              targetPaths.add("/" + cleanKey);
            }
          } catch (e) {}
        }
      }
      await Promise.all([
        ...Array.from(targetPaths).map((p) => revalidatePath(p)),
        ...Array.from(targetLayoutPaths).map((p) => revalidateLayout(p)),
        ...Array.from(targetSlotKeys).map((k) => storage.delete(k)),
      ]);
    }
    return;
  }

  const dist2Folder = path.resolve(process.cwd(), ".dinou/dist2");
  if (!existsSync(dist2Folder)) return;

  const metadataFiles = await walkMetadataFiles(dist2Folder);
  const revalidatePromises = [];

  for (const fileOfMeta of metadataFiles) {
    try {
      const content = await fs.readFile(fileOfMeta, "utf8");
      const metadata = JSON.parse(content);
      if (metadata && Array.isArray(metadata.tags) && metadata.tags.includes(tag)) {
        if (path.basename(fileOfMeta) === "slot.metadata.json") {
          const slotFolder = path.dirname(fileOfMeta);
          console.log(`✅ [Revalidate] Invalidating cache slot directory: ${slotFolder}`);
          revalidatePromises.push(
            fs.rm(slotFolder, { recursive: true, force: true }).catch(() => {})
          );
        } else if (path.basename(fileOfMeta) === "layout.metadata.json") {
          const relative = path.relative(dist2Folder, path.dirname(fileOfMeta));
          const reqPath = "/" + relative.replace(/\\/g, "/");
          revalidatePromises.push(revalidateLayout(reqPath));
        } else {
          const relative = path.relative(dist2Folder, path.dirname(fileOfMeta));
          const reqPath = "/" + relative.replace(/\\/g, "/");
          revalidatePromises.push(revalidatePath(reqPath));
        }
      }
    } catch (err) {
      console.error(`[Revalidate] Error reading tags from ${fileOfMeta}:`, err);
    }
  }

  await Promise.all(revalidatePromises);
}

module.exports = {
  revalidatePath,
  revalidateTag,
  revalidateLayout,
};
