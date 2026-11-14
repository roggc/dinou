// dinou/core/storage-adapter.js
// Pluggable storage abstraction for ISR/ISG cache and static artifacts.
// Supports FileSystem (Node.js/Netlify/Docker), Cloudflare KV (Edge), and Memory.

import path from "node:path";
import fs from "node:fs";

class StorageAdapter {
  constructor() {
    this._deletedKeys = new Set();
    this._invalidatedTags = new Map();
    this.hydrateFromDisk = true;
  }

  markTagInvalidated(tag) {
    if (tag) {
      this._invalidatedTags.set(String(tag), Date.now());
    }
  }

  async markTagInvalidatedAsync(tag) {
    this.markTagInvalidated(tag);
  }

  getTagInvalidatedAt(tag) {
    return tag ? this._invalidatedTags.get(String(tag)) || 0 : 0;
  }

  async getTagInvalidatedAtAsync(tag) {
    return this.getTagInvalidatedAt(tag);
  }

  _normalizeTrackKey(key) {
    return String(key || "")
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");
  }

  _markDeleted(key) {
    const k = this._normalizeTrackKey(key);
    this._deletedKeys.add(k);
    if (k.endsWith("/index.html")) {
      this._deletedKeys.add(k.slice(0, -11));
    } else if (k === "index.html") {
      this._deletedKeys.add("");
    } else if (!k.includes(".")) {
      this._deletedKeys.add(k ? `${k}/index.html` : "index.html");
    }
    if (k.endsWith("/slot.json")) {
      this._deletedKeys.add(k.slice(0, -10) + "/slot.metadata.json");
    } else if (k.endsWith("/slot.metadata.json")) {
      this._deletedKeys.add(k.slice(0, -19) + "/slot.json");
    }
  }

  _unmarkDeleted(key) {
    const k = this._normalizeTrackKey(key);
    this._deletedKeys.delete(k);
    if (k.endsWith("/index.html")) {
      this._deletedKeys.delete(k.slice(0, -11));
    } else if (k === "index.html") {
      this._deletedKeys.delete("");
    } else if (!k.includes(".")) {
      this._deletedKeys.delete(k ? `${k}/index.html` : "index.html");
    }
    if (k.endsWith("/slot.json")) {
      this._deletedKeys.delete(k.slice(0, -10) + "/slot.metadata.json");
    } else if (k.endsWith("/slot.metadata.json")) {
      this._deletedKeys.delete(k.slice(0, -19) + "/slot.json");
    }
  }

  isDeleted(key) {
    const k = this._normalizeTrackKey(key);
    return this._deletedKeys.has(k);
  }

  async isKeyDeleted(key) {
    return this.isDeleted(key);
  }

  async get(key) {
    throw new Error("StorageAdapter.get must be implemented");
  }
  async set(key, content, metadata = null) {
    throw new Error("StorageAdapter.set must be implemented");
  }
  async has(key) {
    throw new Error("StorageAdapter.has must be implemented");
  }
  async delete(key) {
    throw new Error("StorageAdapter.delete must be implemented");
  }
}

/**
 * FileSystem storage adapter (Default for Node.js, Netlify, Docker).
 * Reads and writes directly to .dinou/dist2.
 */
class FileSystemStorage extends StorageAdapter {
  constructor(baseDir = path.resolve(process.cwd(), ".dinou/dist2")) {
    super();
    this.baseDir = baseDir;
  }

  _resolve(key) {
    let cleanKey = String(key || "")
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");
    if (!cleanKey) {
      return path.join(this.baseDir, "index.html");
    }
    const ext = path.extname(cleanKey);
    if (!ext) {
      return path.join(this.baseDir, cleanKey, "index.html");
    }
    return path.join(this.baseDir, cleanKey);
  }

  async get(key) {
    let targetPath = this._resolve(key);
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
      targetPath = path.join(targetPath, "index.html");
    }
    if (!fs.existsSync(targetPath)) return null;
    const content = fs.readFileSync(targetPath, "utf8");

    const cleanKey = String(key || "").replace(/\\/g, "/");
    const isMetaJson = cleanKey.endsWith("metadata.json") || path.basename(targetPath).endsWith("metadata.json");

    // If key itself is a metadata json file, its metadata IS its own parsed content
    if (isMetaJson) {
      let metadata = null;
      try {
        metadata = JSON.parse(content);
      } catch (e) {}
      return { content, metadata };
    }

    // Check companion metadata if available
    let metadata = null;
    const isLayoutKey =
      cleanKey.includes("layout.rsc") ||
      cleanKey.includes("layout.metadata.json") ||
      cleanKey.includes("shell.layout.json");
    const normSlotKey = cleanKey.replace(/^\/+/, "");
    const isSlotKey = normSlotKey.startsWith("slots/") || normSlotKey.endsWith("/slot.json") || normSlotKey.endsWith("/slot.metadata.json");
    const metaFileName = isLayoutKey
      ? "layout.metadata.json"
      : isSlotKey
      ? "slot.metadata.json"
      : "metadata.json";
    const metaPath = path.join(path.dirname(targetPath), metaFileName);
    if (fs.existsSync(metaPath)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      } catch (e) {}
    }
    return { content, metadata };
  }

  async set(key, content, metadata = null) {
    this._unmarkDeleted(key);
    let targetPath = this._resolve(key);
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
      targetPath = path.join(targetPath, "index.html");
    }
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, content, "utf8");

    // Only write a companion metadata file if targetPath is NOT itself a metadata file
    const cleanKey = String(key || "").replace(/\\/g, "/");
    const isMetaJson = cleanKey.endsWith("metadata.json") || path.basename(targetPath).endsWith("metadata.json");
    if (metadata && !isMetaJson) {
      const isLayoutKey =
        cleanKey.includes("layout.rsc") ||
        cleanKey.includes("layout.metadata.json") ||
        cleanKey.includes("shell.layout.json");
      const normSlotKey = cleanKey.replace(/^\/+/, "");
      const isSlotKey = normSlotKey.startsWith("slots/") || normSlotKey.endsWith("/slot.json") || normSlotKey.endsWith("/slot.metadata.json");
      const metaFileName = isLayoutKey
        ? "layout.metadata.json"
        : isSlotKey
        ? "slot.metadata.json"
        : "metadata.json";
      const metaPath = path.join(dir, metaFileName);
      fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), "utf8");
    }
  }

  async has(key) {
    let targetPath = this._resolve(key);
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
      targetPath = path.join(targetPath, "index.html");
    }
    return fs.existsSync(targetPath);
  }

  async delete(key) {
    this._markDeleted(key);
    let targetPath = this._resolve(key);
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { force: true, recursive: true });
    }
    const normSlotKey = String(key || "").replace(/^\/+/, "").replace(/\\/g, "/");
    const isSlotKey = normSlotKey.startsWith("slots/") || normSlotKey.endsWith("/slot.json") || normSlotKey.endsWith("/slot.metadata.json");
    if (isSlotKey) {
      const dir = path.dirname(targetPath);
      if (fs.existsSync(dir)) {
        try {
          fs.rmSync(dir, { force: true, recursive: true });
        } catch (e) {}
      }
    }
  }

  async keys(prefix = "") {
    if (!fs.existsSync(this.baseDir)) return [];
    const effectivePrefix = prefix === "dinou_cache" ? "" : prefix;
    const results = [];
    const walk = (dir, rel = "") => {
      const entries = fs
        .readdirSync(dir, { withFileTypes: true })
        .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
      for (const entry of entries) {
        const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walk(path.join(dir, entry.name), entryRel);
        } else {
          const cleanRel = entryRel.replace(/\\/g, "/");
          if (!effectivePrefix || cleanRel.startsWith(effectivePrefix)) {
            results.push(cleanRel);
          }
        }
      }
    };
    walk(this.baseDir);
    return results;
  }
}

/**
 * Cloudflare KV Storage Adapter for Cloudflare Workers.
 */
class CloudflareKVStorage extends StorageAdapter {
  constructor(kvNamespace) {
    super();
    this.kv = kvNamespace;
  }

  _cleanKey(key) {
    return String(key).replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
  }

  async get(key) {
    if (!this.kv) return null;
    const cleanKey = this._cleanKey(key);
    let res = await this.kv.getWithMetadata(cleanKey, "text");
    if ((!res || res.value === null) && !cleanKey.includes(".")) {
      res = await this.kv.getWithMetadata(cleanKey ? `${cleanKey}/index.html` : "index.html", "text");
    }
    if (!res || res.value === null) return null;
    return {
      content: res.value,
      metadata: res.metadata || null,
    };
  }

  async set(key, content, metadata = null) {
    this._unmarkDeleted(key);
    if (!this.kv) return;
    const cleanKey = this._cleanKey(key);
    const options = metadata ? { metadata } : undefined;
    await this.kv.put(cleanKey, content, options);
    if (cleanKey.endsWith("/index.html")) {
      const folderKey = cleanKey.slice(0, -11);
      await this.kv.put(folderKey, content, options);
    } else if (cleanKey === "index.html") {
      await this.kv.put("", content, options);
    }
  }

  async has(key) {
    if (!this.kv) return false;
    const cleanKey = this._cleanKey(key);
    const val = await this.kv.get(cleanKey);
    return val !== null;
  }

  async delete(key) {
    this._markDeleted(key);
    if (!this.kv) return;
    const cleanKey = this._cleanKey(key);
    await this.kv.delete(cleanKey);
    if (cleanKey.endsWith("/index.html")) {
      await this.kv.delete(cleanKey.slice(0, -11));
    } else if (cleanKey === "index.html") {
      await this.kv.delete("");
    } else if (!cleanKey.includes(".")) {
      await this.kv.delete(cleanKey ? `${cleanKey}/index.html` : "index.html");
    }
    if (cleanKey.endsWith("/slot.json")) {
      await this.kv.delete(cleanKey.slice(0, -10) + "/slot.metadata.json");
    } else if (cleanKey.endsWith("/slot.metadata.json")) {
      await this.kv.delete(cleanKey.slice(0, -19) + "/slot.json");
    }
  }

  async keys(prefix = "") {
    if (!this.kv || typeof this.kv.list !== "function") return [];
    try {
      const effectivePrefix = prefix === "dinou_cache" ? "" : prefix;
      const options = effectivePrefix ? { prefix: effectivePrefix } : undefined;
      const res = await this.kv.list(options);
      return res && res.keys ? res.keys.map((k) => k.name) : [];
    } catch (e) {
      return [];
    }
  }
}

/**
 * In-memory storage adapter.
 */
class MemoryStorage extends StorageAdapter {
  constructor(options = {}) {
    super();
    this.store = new Map();
    this.hydrateFromDisk = Boolean(options && options.hydrateFromDisk);
  }

  _cleanKey(key) {
    return String(key || "").replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
  }

  async get(key) {
    const cleanKey = this._cleanKey(key);
    let item = this.store.get(cleanKey);
    if (!item && !cleanKey.includes(".")) {
      item = this.store.get(cleanKey ? `${cleanKey}/index.html` : "index.html");
    }
    if (!item) return null;
    return { content: item.content, metadata: item.metadata };
  }

  async set(key, content, metadata = null) {
    this._unmarkDeleted(key);
    const cleanKey = this._cleanKey(key);
    this.store.set(cleanKey, { content, metadata });
    if (cleanKey.endsWith("/index.html")) {
      const folderKey = cleanKey.slice(0, -11);
      this.store.set(folderKey, { content, metadata });
    } else if (cleanKey === "index.html") {
      this.store.set("", { content, metadata });
    }
  }

  async has(key) {
    const cleanKey = this._cleanKey(key);
    return this.store.has(cleanKey) || this.store.has(cleanKey ? `${cleanKey}/index.html` : "index.html");
  }

  async delete(key) {
    this._markDeleted(key);
    const cleanKey = this._cleanKey(key);
    this.store.delete(cleanKey);
    if (cleanKey.endsWith("/index.html")) {
      this.store.delete(cleanKey.slice(0, -11));
    } else if (cleanKey === "index.html") {
      this.store.delete("");
    } else if (!cleanKey.includes(".")) {
      this.store.delete(cleanKey ? `${cleanKey}/index.html` : "index.html");
    }
    if (cleanKey.endsWith("/slot.json")) {
      this.store.delete(cleanKey.slice(0, -10) + "/slot.metadata.json");
    } else if (cleanKey.endsWith("/slot.metadata.json")) {
      this.store.delete(cleanKey.slice(0, -19) + "/slot.json");
    }
  }

  keys(prefix = "") {
    const all = Array.from(this.store.keys());
    if (!prefix || prefix === "dinou_cache") return all;
    return all.filter((k) => k.startsWith(prefix));
  }
}

/**
 * Redis storage adapter for multi-server / clustered deployments.
 * Shares ISR / ISG cache and invalidation tombstones across multiple Node/Bun instances.
 */
class RedisStorage extends StorageAdapter {
  constructor(redisClient, prefixOrOptions = "dinou:cache:") {
    super();
    this.redis = redisClient;
    this.prefix =
      typeof prefixOrOptions === "string"
        ? prefixOrOptions
        : prefixOrOptions && typeof prefixOrOptions.prefix === "string"
        ? prefixOrOptions.prefix
        : "dinou:cache:";
    if (
      prefixOrOptions &&
      typeof prefixOrOptions === "object" &&
      typeof prefixOrOptions.hydrateFromDisk === "boolean"
    ) {
      this.hydrateFromDisk = prefixOrOptions.hydrateFromDisk;
    }
  }

  _cleanKey(key) {
    return String(key || "")
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");
  }

  _k(cleanKey) {
    return this.prefix + cleanKey;
  }

  _tombstoneKey(cleanKey) {
    return `${this.prefix}__tombstone__:${cleanKey}`;
  }

  _tagInvKey(tag) {
    return `${this.prefix}__tag_inv__:${String(tag)}`;
  }

  _companionKeys(cleanKey) {
    const companions = [];
    if (cleanKey.endsWith("/index.html")) {
      companions.push(cleanKey.slice(0, -11));
    } else if (cleanKey === "index.html") {
      companions.push("");
    } else if (!cleanKey.includes(".")) {
      companions.push(cleanKey ? `${cleanKey}/index.html` : "index.html");
    }
    if (cleanKey.endsWith("/slot.json")) {
      companions.push(cleanKey.slice(0, -10) + "/slot.metadata.json");
    } else if (cleanKey.endsWith("/slot.metadata.json")) {
      companions.push(cleanKey.slice(0, -19) + "/slot.json");
    }
    return companions;
  }

  markTagInvalidated(tag) {
    super.markTagInvalidated(tag);
    if (tag && this.redis && typeof this.redis.set === "function") {
      const ts = String(this.getTagInvalidatedAt(tag) || Date.now());
      Promise.resolve(this.redis.set(this._tagInvKey(tag), ts)).catch(() => {});
    }
  }

  async markTagInvalidatedAsync(tag) {
    super.markTagInvalidated(tag);
    if (tag && this.redis && typeof this.redis.set === "function") {
      const ts = String(this.getTagInvalidatedAt(tag) || Date.now());
      try {
        await this.redis.set(this._tagInvKey(tag), ts);
      } catch (e) {}
    }
  }

  async getTagInvalidatedAtAsync(tag) {
    const localTs = this.getTagInvalidatedAt(tag);
    if (!tag || !this.redis || typeof this.redis.get !== "function") {
      return localTs;
    }
    try {
      const remoteRaw = await this.redis.get(this._tagInvKey(tag));
      const remoteTs = remoteRaw ? Number(remoteRaw) || 0 : 0;
      return Math.max(localTs, remoteTs);
    } catch (e) {
      return localTs;
    }
  }

  async isKeyDeleted(key) {
    if (this.isDeleted(key)) return true;
    if (!this.redis) return false;
    const cleanKey = this._cleanKey(key);
    try {
      if (typeof this.redis.exists === "function") {
        const ex = await this.redis.exists(this._tombstoneKey(cleanKey));
        return Boolean(ex && Number(ex) > 0);
      }
      if (typeof this.redis.get === "function") {
        const val = await this.redis.get(this._tombstoneKey(cleanKey));
        return val !== null && val !== undefined;
      }
    } catch (e) {}
    return false;
  }

  async _readRaw(cleanKey) {
    const raw = await this.redis.get(this._k(cleanKey));
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return { content: raw, metadata: null };
    }
  }

  async get(key) {
    if (!this.redis) return null;
    const cleanKey = this._cleanKey(key);
    let item = await this._readRaw(cleanKey);
    if (!item && !cleanKey.includes(".")) {
      item = await this._readRaw(cleanKey ? `${cleanKey}/index.html` : "index.html");
    }
    return item;
  }

  async set(key, content, metadata = null) {
    this._unmarkDeleted(key);
    if (!this.redis) return;
    const cleanKey = this._cleanKey(key);
    const value = JSON.stringify({ content, metadata });
    await this.redis.set(this._k(cleanKey), value);
    const tombstonesToClear = [this._tombstoneKey(cleanKey)];
    if (cleanKey.endsWith("/index.html")) {
      const folderKey = cleanKey.slice(0, -11);
      await this.redis.set(this._k(folderKey), value);
      tombstonesToClear.push(this._tombstoneKey(folderKey));
    } else if (cleanKey === "index.html") {
      await this.redis.set(this._k(""), value);
      tombstonesToClear.push(this._tombstoneKey(""));
    } else if (!cleanKey.includes(".")) {
      tombstonesToClear.push(
        this._tombstoneKey(cleanKey ? `${cleanKey}/index.html` : "index.html")
      );
    }
    if (cleanKey.endsWith("/slot.json")) {
      tombstonesToClear.push(this._tombstoneKey(cleanKey.slice(0, -10) + "/slot.metadata.json"));
    } else if (cleanKey.endsWith("/slot.metadata.json")) {
      tombstonesToClear.push(this._tombstoneKey(cleanKey.slice(0, -19) + "/slot.json"));
    }
    if (typeof this.redis.del === "function") {
      await Promise.all(
        tombstonesToClear.map((tk) => Promise.resolve(this.redis.del(tk)).catch(() => {}))
      );
    }
  }

  async has(key) {
    if (!this.redis) return false;
    const cleanKey = this._cleanKey(key);
    const existsDirect = await this.redis.exists(this._k(cleanKey));
    if (existsDirect && Number(existsDirect) > 0) return true;
    if (!cleanKey.includes(".")) {
      const fallback = cleanKey ? `${cleanKey}/index.html` : "index.html";
      const existsFallback = await this.redis.exists(this._k(fallback));
      return Boolean(existsFallback && Number(existsFallback) > 0);
    }
    return false;
  }

  async delete(key) {
    this._markDeleted(key);
    if (!this.redis) return;
    const cleanKey = this._cleanKey(key);
    const targets = [cleanKey, ...this._companionKeys(cleanKey)];
    await Promise.all(
      targets.map(async (tk) => {
        try {
          await this.redis.del(this._k(tk));
        } catch (e) {}
        try {
          if (typeof this.redis.set === "function") {
            await this.redis.set(this._tombstoneKey(tk), String(Date.now()));
          }
        } catch (e) {}
      })
    );
  }

  async keys(prefix = "") {
    if (!this.redis) return [];
    const normPrefix =
      !prefix || prefix === "dinou_cache"
        ? ""
        : String(prefix).replace(/\\/g, "/").replace(/^\/+/, "");
    const matchPattern = `${this.prefix}${normPrefix}*`;
    const rawKeys = [];

    try {
      if (typeof this.redis.scanIterator === "function") {
        for await (const item of this.redis.scanIterator({
          MATCH: matchPattern,
          COUNT: 100,
        })) {
          if (Array.isArray(item)) rawKeys.push(...item);
          else if (typeof item === "string") rawKeys.push(item);
        }
      } else if (typeof this.redis.scanStream === "function") {
        for await (const batch of this.redis.scanStream({
          match: matchPattern,
          count: 100,
        })) {
          if (Array.isArray(batch)) rawKeys.push(...batch);
          else if (typeof batch === "string") rawKeys.push(batch);
        }
      } else if (typeof this.redis.keys === "function") {
        const list = await this.redis.keys(matchPattern);
        if (Array.isArray(list)) rawKeys.push(...list);
      } else if (typeof this.redis.scan === "function") {
        let cursor = "0";
        do {
          let scanRes;
          try {
            scanRes = await this.redis.scan(cursor, "MATCH", matchPattern, "COUNT", 100);
          } catch (e) {
            scanRes = await this.redis.scan(Number(cursor) || 0, {
              MATCH: matchPattern,
              COUNT: 100,
            });
          }
          if (Array.isArray(scanRes)) {
            cursor = String(scanRes[0]);
            if (Array.isArray(scanRes[1])) rawKeys.push(...scanRes[1]);
          } else if (scanRes && typeof scanRes === "object") {
            cursor = String(scanRes.cursor);
            if (Array.isArray(scanRes.keys)) rawKeys.push(...scanRes.keys);
          } else {
            break;
          }
        } while (cursor !== "0");
      }
    } catch (e) {
      return [];
    }

    const result = new Set();
    for (const fullKey of rawKeys) {
      if (typeof fullKey !== "string" || !fullKey.startsWith(this.prefix)) continue;
      const stripped = fullKey.slice(this.prefix.length);
      if (
        stripped.startsWith("__tombstone__:") ||
        stripped.startsWith("__tag_inv__:")
      ) {
        continue;
      }
      if (!normPrefix || stripped.startsWith(normPrefix)) {
        result.add(stripped);
      }
    }
    return Array.from(result);
  }
}

/**
 * Deno KV Storage Adapter for Deno Deploy & Edge.
 */
class DenoKVStorage extends StorageAdapter {
  constructor(kvInstance = null) {
    super();
    this.kv = kvInstance;
  }

  async _getKV() {
    if (!this.kv) {
      if (typeof Deno !== "undefined" && typeof Deno.openKv === "function") {
        const kvUrl = Deno.env.get("DENO_KV_URL");
        if (kvUrl) {
          this.kv = await Deno.openKv(kvUrl);
        } else if (Deno.env.get("DENO_DEPLOYMENT_ID")) {
          this.kv = await Deno.openKv();
        } else {
          const cwd = typeof Deno.cwd === "function" ? Deno.cwd() : process.cwd();
          const kvPath = Deno.env.get("DENO_KV_PATH") || path.resolve(cwd, ".dinou/kv.db");
          this.kv = await Deno.openKv(kvPath);
        }
      }
    }
    return this.kv;
  }

  _cleanKey(key) {
    return String(key).replace(/\\/g, "/").replace(/^\/+/, "");
  }

  async get(key) {
    const kv = await this._getKV();
    if (!kv) return null;
    const cleanKey = this._cleanKey(key);
    let matchedKey = cleanKey;
    let res = await kv.get(["dinou_cache", cleanKey]);
    if ((!res || res.value === null) && !cleanKey.includes(".")) {
      matchedKey = cleanKey ? `${cleanKey}/index.html` : "index.html";
      res = await kv.get(["dinou_cache", matchedKey]);
    }
    if (!res || res.value === null) return null;
    const val = res.value;
    if (val && val.chunked) {
      const chunkPromises = [];
      for (let i = 0; i < val.totalChunks; i++) {
        chunkPromises.push(kv.get(["dinou_cache_chunk", matchedKey, i]));
      }
      const chunkResults = await Promise.all(chunkPromises);
      let fullContent = "";
      for (const chunkRes of chunkResults) {
        if (chunkRes && typeof chunkRes.value === "string") {
          fullContent += chunkRes.value;
        }
      }
      return {
        content: fullContent,
        metadata: val.metadata || null,
      };
    }
    return {
      content: typeof val === "string" ? val : (val && val.content !== undefined ? val.content : ""),
      metadata: val && typeof val === "object" && val.metadata ? val.metadata : null,
    };
  }

  async set(key, content, metadata = null) {
    this._unmarkDeleted(key);
    const kv = await this._getKV();
    if (!kv) return;
    const cleanKey = this._cleanKey(key);
    const KV_CHUNK_SIZE = 16384;

    const writeKey = async (targetKey) => {
      if (typeof content === "string" && content.length > KV_CHUNK_SIZE) {
        const totalChunks = Math.ceil(content.length / KV_CHUNK_SIZE);
        const atomic = kv.atomic();
        atomic.set(["dinou_cache", targetKey], {
          chunked: true,
          totalChunks,
          metadata,
        });
        for (let i = 0; i < totalChunks; i++) {
          const chunk = content.slice(i * KV_CHUNK_SIZE, (i + 1) * KV_CHUNK_SIZE);
          atomic.set(["dinou_cache_chunk", targetKey, i], chunk);
        }
        await atomic.commit();
      } else {
        await kv.set(["dinou_cache", targetKey], {
          chunked: false,
          content,
          metadata,
        });
      }
    };

    await writeKey(cleanKey);

    if (cleanKey.endsWith("/index.html")) {
      const folderKey = cleanKey.slice(0, -11);
      await writeKey(folderKey);
    } else if (cleanKey === "index.html") {
      await writeKey("");
    }
  }

  async has(key) {
    const kv = await this._getKV();
    if (!kv) return false;
    const cleanKey = this._cleanKey(key);
    const res = await kv.get(["dinou_cache", cleanKey]);
    if (res && res.value !== null) return true;
    if (!cleanKey.includes(".")) {
      const fallbackRes = await kv.get(["dinou_cache", cleanKey ? `${cleanKey}/index.html` : "index.html"]);
      return fallbackRes && fallbackRes.value !== null;
    }
    return false;
  }

  async delete(key) {
    this._markDeleted(key);
    const kv = await this._getKV();
    if (!kv) return;
    const cleanKey = this._cleanKey(key);

    const delKey = async (targetKey) => {
      const res = await kv.get(["dinou_cache", targetKey]);
      if (res && res.value && res.value.chunked) {
        const atomic = kv.atomic();
        for (let i = 0; i < res.value.totalChunks; i++) {
          atomic.delete(["dinou_cache_chunk", targetKey, i]);
        }
        atomic.delete(["dinou_cache", targetKey]);
        await atomic.commit();
      } else {
        await kv.delete(["dinou_cache", targetKey]);
      }
    };

    await delKey(cleanKey);

    if (cleanKey.endsWith("/index.html")) {
      const folderKey = cleanKey.slice(0, -11);
      await delKey(folderKey);
    } else if (cleanKey === "index.html") {
      await delKey("");
    } else if (!cleanKey.includes(".")) {
      await delKey(cleanKey ? `${cleanKey}/index.html` : "index.html");
    }

    if (cleanKey.endsWith("/slot.json")) {
      await delKey(cleanKey.slice(0, -10) + "/slot.metadata.json");
    } else if (cleanKey.endsWith("/slot.metadata.json")) {
      await delKey(cleanKey.slice(0, -19) + "/slot.json");
    }
  }

  async keys(prefix = "") {
    const kv = await this._getKV();
    if (!kv) return [];
    try {
      const entries = kv.list({ prefix: ["dinou_cache"] });
      const result = [];
      for await (const entry of entries) {
        if (entry.key && entry.key.length >= 2 && typeof entry.key[1] === "string") {
          const k = entry.key[1];
          if (!prefix || prefix === "dinou_cache" || k.startsWith(prefix)) {
            result.push(k);
          }
        }
      }
      return result;
    } catch (e) {
      return [];
    }
  }
}

const DINOU_STORAGE_KEY = Symbol.for("dinou.storage.adapter");

function getStorageAdapter() {
  if (globalThis[DINOU_STORAGE_KEY]) {
    return globalThis[DINOU_STORAGE_KEY];
  }
  let adapter = null;
  const runtime =
    (typeof globalThis !== "undefined" && globalThis.__DINOU_RUNTIME__) ||
    (typeof process !== "undefined" && process.env && process.env.DINOU_RUNTIME) ||
    "";

  const isEdge =
    runtime === "edge" ||
    runtime === "deno-edge" ||
    (typeof runtime === "string" && runtime.includes("edge")) ||
    (typeof Deno !== "undefined" && !runtime.includes("node"));

  if (isEdge) {
    if (typeof Deno !== "undefined" && typeof Deno.openKv === "function") {
      adapter = new DenoKVStorage();
    } else {
      adapter = new MemoryStorage();
    }
  } else {
    adapter = new FileSystemStorage();
  }
  globalThis[DINOU_STORAGE_KEY] = adapter;
  return adapter;
}

function setStorageAdapter(adapter) {
  globalThis[DINOU_STORAGE_KEY] = adapter;
}

function hasExplicitStorageAdapter() {
  return Boolean(globalThis[DINOU_STORAGE_KEY]);
}

/**
 * Hydrates a missing build-time static artifact from local `.dinou/dist2` into
 * non-FileSystem distributed/KV adapters (such as RedisStorage or DenoKVStorage)
 * when `storage.hydrateFromDisk !== false` and the key has not been deleted/invalidated.
 */
async function readDist2Fallback(storage, key, knownTags = []) {
  if (!storage || !key || storage.baseDir || storage.hydrateFromDisk === false) {
    return null;
  }
  try {
    const isDeleted =
      typeof storage.isKeyDeleted === "function"
        ? await storage.isKeyDeleted(key)
        : typeof storage.isDeleted === "function" && storage.isDeleted(key);
    if (isDeleted) {
      return null;
    }

    const cwd =
      typeof process !== "undefined" && typeof process.cwd === "function"
        ? process.cwd()
        : null;
    if (!cwd) return null;

    const dist2Dir = path.resolve(cwd, ".dinou/dist2");
    if (!fs.existsSync(dist2Dir)) return null;

    const dist2Fs = new FileSystemStorage(dist2Dir);
    const resolvedPath = path.resolve(dist2Fs._resolve(key));
    if (
      resolvedPath !== dist2Dir &&
      !resolvedPath.startsWith(dist2Dir + path.sep)
    ) {
      return null;
    }

    const item = await dist2Fs.get(key);
    if (!item || !item.content) return null;

    const normKey = String(key || "")
      .replace(/^\/+/, "")
      .replace(/\\/g, "/")
      .replace(/\/+$/, "");
    const writeKey = normKey || "index.html";
    const isMetaFile = writeKey.endsWith("metadata.json");
    const isShellJson =
      writeKey.endsWith("shell.page.json") ||
      writeKey.endsWith("shell.layout.json");

    if (!isMetaFile) {
      const generatedAt = Number(
        (writeKey.endsWith("shell.page.json") && item.metadata?.pageGeneratedAt) ||
          (writeKey.endsWith("shell.layout.json") && item.metadata?.layoutGeneratedAt) ||
          item.metadata?.generatedAt ||
          0
      );
      const combinedTags = new Set([
        ...(Array.isArray(item.metadata?.tags) ? item.metadata.tags : []),
        ...(!isShellJson && Array.isArray(item.metadata?.slotTags)
          ? item.metadata.slotTags
          : []),
        ...(Array.isArray(knownTags) ? knownTags : []),
      ]);
      if (combinedTags.size > 0) {
        for (const t of combinedTags) {
          if (!t) continue;
          const invAt =
            typeof storage.getTagInvalidatedAtAsync === "function"
              ? await storage.getTagInvalidatedAtAsync(t)
              : typeof storage.getTagInvalidatedAt === "function"
              ? storage.getTagInvalidatedAt(t)
              : 0;
          if (invAt > 0 && invAt >= generatedAt) {
            return null;
          }
        }
      }
    }

    try {
      const shouldPassMetadata =
        !isMetaFile &&
        (writeKey === "index.html" ||
          writeKey.endsWith("/index.html") ||
          writeKey.endsWith("shell.html") ||
          writeKey.endsWith("layout.rsc") ||
          writeKey.endsWith("/slot.json"));
      await storage.set(
        writeKey,
        item.content,
        shouldPassMetadata ? item.metadata || null : null
      );
      if (
        item.metadata &&
        typeof item.metadata === "object" &&
        !isMetaFile
      ) {
        const isLayoutKey =
          writeKey.endsWith("layout.rsc") ||
          writeKey.endsWith("shell.layout.json");
        const isSlotKey =
          writeKey.startsWith("slots/") || writeKey.endsWith("/slot.json");
        const dirPrefix = writeKey.includes("/")
          ? writeKey.slice(0, writeKey.lastIndexOf("/"))
          : "";
        const metaFileName = isLayoutKey
          ? "layout.metadata.json"
          : isSlotKey
          ? "slot.metadata.json"
          : "metadata.json";
        const companionMetaKey = dirPrefix
          ? `${dirPrefix}/${metaFileName}`
          : metaFileName;
        const metaDeleted =
          typeof storage.isKeyDeleted === "function"
            ? await storage.isKeyDeleted(companionMetaKey)
            : typeof storage.isDeleted === "function" &&
              storage.isDeleted(companionMetaKey);
        const alreadyHasMeta =
          typeof storage.has === "function"
            ? await storage.has(companionMetaKey)
            : false;
        if (!metaDeleted && !alreadyHasMeta) {
          await storage.set(companionMetaKey, JSON.stringify(item.metadata));
        }
      }
    } catch (e) {}

    return item;
  } catch (e) {
    return null;
  }
}

export {
  StorageAdapter,
  FileSystemStorage,
  CloudflareKVStorage,
  DenoKVStorage,
  MemoryStorage,
  RedisStorage,
  getStorageAdapter,
  setStorageAdapter,
  hasExplicitStorageAdapter,
  readDist2Fallback,
};
export default {
  StorageAdapter,
  FileSystemStorage,
  CloudflareKVStorage,
  DenoKVStorage,
  MemoryStorage,
  RedisStorage,
  getStorageAdapter,
  setStorageAdapter,
  hasExplicitStorageAdapter,
  readDist2Fallback,
};
