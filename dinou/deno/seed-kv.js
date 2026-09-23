// dinou/deno/seed-kv.js
// Pre-seeds Deno KV database (Local SQLite or Remote Deno Deploy KV) with static SSG pages.

import * as path from "node:path";
import * as fs from "node:fs";

const cwd = typeof Deno !== "undefined" && typeof Deno.cwd === "function" ? Deno.cwd() : process.cwd();
const kvUrl = typeof Deno !== "undefined" ? Deno.env.get("DENO_KV_URL") : process.env.DENO_KV_URL;
const dist2Dir = path.resolve(cwd, ".dinou/dist2");

if (!fs.existsSync(dist2Dir)) {
  console.log("ℹ️  [Deno KV Seed] No static files found at .dinou/dist2. Skipping KV pre-seed.");
  if (typeof Deno !== "undefined") Deno.exit(0);
}

let kv;
if (kvUrl) {
  console.log(`🌐 [Deno KV Seed] Connecting to remote Deno KV: ${kvUrl}...`);
  kv = await Deno.openKv(kvUrl);
} else {
  const defaultDbPath = path.resolve(cwd, ".dinou/kv.db");
  const kvPath = (typeof Deno !== "undefined" ? Deno.env.get("DENO_KV_PATH") : process.env.DENO_KV_PATH) || defaultDbPath;
  fs.mkdirSync(path.dirname(kvPath), { recursive: true });
  try {
    if (fs.existsSync(kvPath)) fs.unlinkSync(kvPath);
    if (fs.existsSync(kvPath + "-wal")) fs.unlinkSync(kvPath + "-wal");
    if (fs.existsSync(kvPath + "-shm")) fs.unlinkSync(kvPath + "-shm");
  } catch (e) {}
  console.log(`💾 [Deno KV Seed] Pre-seeding local Deno KV at ${kvPath}...`);
  kv = await Deno.openKv(kvPath);
}

const KV_CHUNK_SIZE = 16384;

async function setKvCache(kvInstance, key, content, metadata = null) {
  if (typeof content === "string" && content.length > KV_CHUNK_SIZE) {
    const totalChunks = Math.ceil(content.length / KV_CHUNK_SIZE);
    const atomic = kvInstance.atomic();
    atomic.set(["dinou_cache", key], {
      chunked: true,
      totalChunks,
      metadata,
    });
    for (let i = 0; i < totalChunks; i++) {
      const chunk = content.slice(i * KV_CHUNK_SIZE, (i + 1) * KV_CHUNK_SIZE);
      atomic.set(["dinou_cache_chunk", key, i], chunk);
    }
    await atomic.commit();
  } else {
    await kvInstance.set(["dinou_cache", key], {
      chunked: false,
      content,
      metadata,
    });
  }
}

let seededCount = 0;

async function processDir(dir, relPrefix = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
    const cleanRelPath = relPath.replace(/\\/g, "/");

    if (entry.isDirectory()) {
      await processDir(fullPath, cleanRelPath);
    } else if (entry.name === "index.html") {
      const html = fs.readFileSync(fullPath, "utf8");
      let metadata = null;
      const metaPath = path.join(dir, "metadata.json");
      if (fs.existsSync(metaPath)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metaPath, "utf8"));
        } catch (e) {}
      }

      await setKvCache(kv, cleanRelPath, html, metadata);
      seededCount++;
      console.log(`   ✅ Cached HTML: ${cleanRelPath}`);

      if (cleanRelPath.endsWith("/index.html")) {
        const folderKey = cleanRelPath.slice(0, -11);
        await setKvCache(kv, folderKey, html, metadata);
      } else if (cleanRelPath === "index.html") {
        await setKvCache(kv, "", html, metadata);
      }
    } else if (entry.name === "metadata.json") {
      const metaContent = fs.readFileSync(fullPath, "utf8");
      let metadata = null;
      try {
        metadata = JSON.parse(metaContent);
      } catch (e) {}
      await setKvCache(kv, cleanRelPath, metaContent, metadata);
      seededCount++;
      console.log(`   ✅ Cached Meta: ${cleanRelPath}`);
    } else if (entry.name === "rsc.rsc") {
      const rsc = fs.readFileSync(fullPath, "utf8");
      await setKvCache(kv, cleanRelPath, rsc, null);
      seededCount++;
      console.log(`   ✅ Cached RSC:  ${cleanRelPath}`);
    }
  }
}

await processDir(dist2Dir);
await kv.close();
console.log(`🎉 [Deno KV Seed] Finished successfully! ${seededCount} file(s) cached in KV.\n`);
