const path = require("path");
const fs = require("fs").promises;
const { existsSync, copyFileSync } = require("fs");
const generateStaticPage = require("./generate-static-page");
const { buildStaticPage } = require("./build-static-pages");
const generateStaticRSC = require("./generate-static-rsc");
const { safeRename } = require("./safe-rename");
const { updateStatus } = require("./status-manifest");

const { getContext } = require("./request-context");
const { resolveRelativeUrl } = require("./url-resolver");

async function walkMetadataFiles(dir, fileList = []) {
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        await walkMetadataFiles(filePath, fileList);
      } else if (file === "metadata.json") {
        fileList.push(filePath);
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
      const referer = ctx.req.headers?.referer;
      if (referer) {
        try {
          currentPathname = new URL(referer).pathname;
        } catch (e) {}
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

  const dist2Folder = path.resolve(process.cwd(), "dist2");
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
    await buildStaticPage(cleanPath, isDynamic);
    if (isDynamic.value) {
      console.log(`[Revalidate] Bailout detected for ${cleanPath}. Switching to dynamic (skipping static write).`);
      return;
    }

    const rscResult = await generateStaticRSC(cleanPath);
    if (!rscResult.success) {
      console.warn(`⚠️ [Revalidate] RSC generation failed for ${cleanPath}.`);
      if (rscResult.tempPath && existsSync(rscResult.tempPath)) {
        await fs.unlink(rscResult.tempPath).catch(() => {});
      }
      return;
    }

    await safeRename(rscResult.tempPath, rscResult.finalPath);

    const pageResult = await generateStaticPage(cleanPath);
    if (pageResult.success) {
      await safeRename(pageResult.tempPath, pageResult.finalPath);
      updateStatus(cleanPath, pageResult.status);
      console.log(`✅ [Revalidate] Successfully revalidated ${cleanPath} (Status: ${pageResult.status})`);
    } else {
      console.warn(`⚠️ [Revalidate] HTML generation failed for ${cleanPath}.`);
      if (pageResult.tempPath && existsSync(pageResult.tempPath)) {
        await fs.unlink(pageResult.tempPath).catch(() => {});
      }
    }
  } catch (e) {
    console.error(`[Revalidate] Critical error revalidating ${cleanPath}:`, e);
    throw e;
  }
}

async function revalidateTag(tag) {
  console.log(`[Revalidate] Starting on-demand revalidation for tag: "${tag}"...`);
  const dist2Folder = path.resolve(process.cwd(), "dist2");
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
