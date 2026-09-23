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
      } else if (entry.name === "metadata.json") {
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
    const rscKey = cleanPathKey ? `${cleanPathKey}/rsc.rsc` : "rsc.rsc";

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

async function revalidateTag(tag) {
  console.log(`[Revalidate] Starting on-demand revalidation for tag: "${tag}"...`);

  if (isEdgeRuntime()) {
    const storage = getStorageAdapter();
    if (typeof storage.keys === "function") {
      const allKeys = await storage.keys();
      const targetPaths = new Set();
      for (const key of allKeys) {
        if (key.endsWith("metadata.json")) {
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
      await Promise.all(Array.from(targetPaths).map((p) => revalidatePath(p)));
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
        // Calculate the request path
        const relative = path.relative(dist2Folder, path.dirname(fileOfMeta));
        const reqPath = "/" + relative.replace(/\\/g, "/");
        revalidatePromises.push(revalidatePath(reqPath));
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
};
