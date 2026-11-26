import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

const REGENERATING_SET_KEY = Symbol.for("dinou.regenerating.set");
if (!globalThis[REGENERATING_SET_KEY]) {
  globalThis[REGENERATING_SET_KEY] = new Set();
}
const regenerating = globalThis[REGENERATING_SET_KEY];

const INFLIGHT_GENERATIONS_KEY = Symbol.for("dinou.inflight.generations");
if (!globalThis[INFLIGHT_GENERATIONS_KEY]) {
  globalThis[INFLIGHT_GENERATIONS_KEY] = new Map();
}
const inFlightGenerations = globalThis[INFLIGHT_GENERATIONS_KEY];

function revalidating(reqPath, isDynamicFromServer) {
  const cleanPath = String(reqPath || "/")
    .split("?")[0]
    .split("#")[0]
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  const normReqPath = cleanPath ? "/" + cleanPath : "/";

  if (regenerating.has(normReqPath) || regenerating.has(reqPath)) {
    return Promise.resolve(false);
  }

  return (async () => {
    try {
      const { getStorageAdapter, readDist2Fallback } = await import(
        "./storage-adapter.js"
      );
      const { getActiveLayoutChain } = await import("./layout-functions.js");
      const { inspectSlotsFreshness } = await import("./cache-slot.js");

      const storage = getStorageAdapter();
      const dist2Folder = path.resolve(process.cwd(), ".dinou/dist2");
      const readJsonMeta = async (key) => {
        try {
          const item =
            (await storage.get(key)) || (await readDist2Fallback(storage, key));
          if (item && typeof item.content === "string" && item.content.trim()) {
            return JSON.parse(item.content);
          }
          if (item && item.metadata && typeof item.metadata === "object") {
            return item.metadata;
          }
        } catch (e) {}
        try {
          const diskPath = path.join(dist2Folder, key);
          if (existsSync(diskPath)) {
            return JSON.parse(await fs.readFile(diskPath, "utf8"));
          }
        } catch (e) {}
        return null;
      };

      const reqSegments = cleanPath ? cleanPath.split("/").filter(Boolean) : [];
      const srcFolder = path.resolve(process.cwd(), "src");
      let activeChain = [];
      try {
        activeChain = getActiveLayoutChain(reqSegments, {}, srcFolder);
      } catch (e) {}

      // 1. Check active ancestor layouts (ancestor-first) for TTL or <DinouCacheSlot> expiry
      const layoutPlans = [];
      let ancestorUpdated = false;
      for (let i = activeChain.length - 1; i >= 0; i--) {
        const entry = activeChain[i];
        const lMetaKey = entry.cleanLayoutKey
          ? `${entry.cleanLayoutKey}/layout.metadata.json`
          : "layout.metadata.json";
        const lMeta = await readJsonMeta(lMetaKey);
        if (!lMeta || lMeta.dynamic) continue;

        const ownGen = Number(
          lMeta.ownGeneratedAt || lMeta.layoutGeneratedAt || lMeta.generatedAt || 0
        );
        const genAt = Number(lMeta.generatedAt || 0);
        const lReval = lMeta.revalidate;
        const isLayoutTtlExpired =
          typeof lReval === "number" &&
          lReval >= 1 &&
          ownGen > 0 &&
          Date.now() > ownGen + lReval * 1000;
        const slotTags = Array.from(
          new Set([
            ...(Array.isArray(lMeta.ownSlotTags) ? lMeta.ownSlotTags : []),
            ...(Array.isArray(lMeta.slotTags) ? lMeta.slotTags : []),
          ])
        );
        const slotFresh =
          !isLayoutTtlExpired && slotTags.length > 0
            ? await inspectSlotsFreshness(slotTags, genAt)
            : { hasExpired: false, hasNewer: false };
        const isSlotDirty = slotFresh.hasExpired || slotFresh.hasNewer;

        if (isLayoutTtlExpired || isSlotDirty || ancestorUpdated) {
          layoutPlans.push({
            layoutRoutePath: entry.layoutRoutePath,
            onlyIfExpired: isLayoutTtlExpired && !isSlotDirty && !ancestorUpdated,
            onlyRefreshSlots: !isLayoutTtlExpired && !ancestorUpdated && isSlotDirty,
            recomposeOnly: !isLayoutTtlExpired && !isSlotDirty && ancestorUpdated,
          });
          ancestorUpdated = true;
        }
      }

      // 2. Check page metadata.json (honoring pageRevalidate/pageGeneratedAt & slotTags)
      const metaKey = cleanPath ? `${cleanPath}/metadata.json` : "metadata.json";
      const metadata = await readJsonMeta(metaKey);
      const pageReval =
        metadata &&
        metadata.pageRevalidate !== undefined &&
        metadata.pageRevalidate !== null
          ? metadata.pageRevalidate
          : metadata?.revalidate;
      const pageGen = Number(
        metadata?.pageGeneratedAt || metadata?.generatedAt || 0
      );
      const isPageExpired =
        typeof pageReval === "number" &&
        pageReval >= 1 &&
        pageGen > 0 &&
        Date.now() > pageGen + pageReval * 1000;
      const pageSlotTags = Array.isArray(metadata?.slotTags)
        ? metadata.slotTags
        : [];
      const pageSlotFresh =
        !isPageExpired && pageSlotTags.length > 0
          ? await inspectSlotsFreshness(
              pageSlotTags,
              Number(metadata?.pageSlotsGeneratedAt || metadata?.generatedAt || 0)
            )
          : { hasExpired: false, hasNewer: false };
      const isPageSlotDirty = pageSlotFresh.hasExpired || pageSlotFresh.hasNewer;

      if (layoutPlans.length === 0 && !isPageExpired && !isPageSlotDirty) {
        return false;
      }

      if (regenerating.has(normReqPath) || regenerating.has(reqPath)) {
        return false;
      }

      regenerating.add(normReqPath);
      if (reqPath !== normReqPath) {
        regenerating.add(reqPath);
      }

      try {
        let rscEngineMod = null;
        if (typeof globalThis !== "undefined") {
          if (typeof globalThis.__DINOU_RENDER_HTML_STREAM__ !== "function") {
            const ssrEnginePath = path.resolve(
              process.cwd(),
              ".dinou/node/ssr-engine.mjs"
            );
            if (existsSync(ssrEnginePath)) {
              try {
                const ssrMod = await import(pathToFileURL(ssrEnginePath).href);
                if (typeof ssrMod?.renderHtml === "function") {
                  globalThis.__DINOU_RENDER_HTML_STREAM__ = ssrMod.renderHtml;
                }
              } catch (e) {}
            }
          }
          if (!globalThis.__DINOU_ROUTE_MAP__) {
            const rscEnginePath = path.resolve(
              process.cwd(),
              ".dinou/node/rsc-engine.mjs"
            );
            if (existsSync(rscEnginePath)) {
              try {
                rscEngineMod = await import(pathToFileURL(rscEnginePath).href);
              } catch (e) {}
            }
          }
        }

        const revalMod =
          rscEngineMod &&
          typeof rscEngineMod.revalidatePage === "function" &&
          typeof rscEngineMod.revalidateLayout === "function"
            ? rscEngineMod
            : await import("./cache-revalidate.js");

        for (const plan of layoutPlans) {
          await revalMod.revalidateLayout(plan.layoutRoutePath, {
            onlyIfExpired: plan.onlyIfExpired,
            onlyRefreshSlots: plan.onlyRefreshSlots,
            recomposeOnly: plan.recomposeOnly,
          });
        }

        if (isPageExpired || isPageSlotDirty) {
          await revalMod.revalidatePage(normReqPath, {
            onlyIfExpired: isPageExpired && !isPageSlotDirty,
            onlyRefreshSlots: !isPageExpired && isPageSlotDirty,
          });
        }

        if (isDynamicFromServer && typeof isDynamicFromServer === "object") {
          const dynMap =
            typeof globalThis !== "undefined"
              ? globalThis[Symbol.for("dinou.isDynamic.map")]
              : null;
          const reqPathWithSlash = normReqPath.endsWith("/")
            ? normReqPath
            : normReqPath + "/";
          const entry = dynMap?.get(reqPathWithSlash) || dynMap?.get(normReqPath);
          if (entry) {
            isDynamicFromServer.value = Boolean(entry.value);
          }
        }

        return true;
      } catch (e) {
        console.error(`[ISR] Critical error regenerating ${normReqPath}:`, e);
        return false;
      } finally {
        regenerating.delete(normReqPath);
        if (reqPath !== normReqPath) {
          regenerating.delete(reqPath);
        }
      }
    } catch (err) {
      return false;
    }
  })();
}

export { revalidating, regenerating, inFlightGenerations };
export default { revalidating, regenerating, inFlightGenerations };
