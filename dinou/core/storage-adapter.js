// dinou/core/storage-adapter.js
// Pluggable storage abstraction for ISR/ISG cache and static artifacts.
// Supports FileSystem (Node.js/Netlify/Docker), Cloudflare KV (Edge), and Memory.

const path = require("path");
const fs = require("fs");

class StorageAdapter {
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
      .replace(/^\/+/, "")
      .replace(/\\/g, "/")
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

    // Check companion metadata if available
    let metadata = null;
    const metaPath = path.join(path.dirname(targetPath), "metadata.json");
    if (fs.existsSync(metaPath)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      } catch (e) {}
    }
    return { content, metadata };
  }

  async set(key, content, metadata = null) {
    let targetPath = this._resolve(key);
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
      targetPath = path.join(targetPath, "index.html");
    }
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, content, "utf8");

    if (metadata) {
      const metaPath = path.join(dir, "metadata.json");
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
    let targetPath = this._resolve(key);
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { force: true, recursive: true });
    }
  }

  async keys(prefix = "") {
    if (!fs.existsSync(this.baseDir)) return [];
    const results = [];
    const walk = (dir, rel = "") => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walk(path.join(dir, entry.name), entryRel);
        } else {
          if (!prefix || entryRel.startsWith(prefix)) {
            results.push(entryRel);
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
    return String(key).replace(/^\/+/, "").replace(/\\/g, "/").replace(/\/+$/, "");
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
    if (!this.kv) return;
    const cleanKey = this._cleanKey(key);
    const options = metadata ? { metadata } : undefined;
    await this.kv.put(cleanKey, content, options);
    if (cleanKey.endsWith("/index.html")) {
      const folderKey = cleanKey.slice(0, -11);
      await this.kv.put(folderKey, content, options);
    }
  }

  async has(key) {
    if (!this.kv) return false;
    const cleanKey = this._cleanKey(key);
    const val = await this.kv.get(cleanKey);
    return val !== null;
  }

  async delete(key) {
    if (!this.kv) return;
    const cleanKey = this._cleanKey(key);
    await this.kv.delete(cleanKey);
  }

  async keys(prefix = "") {
    if (!this.kv || typeof this.kv.list !== "function") return [];
    try {
      const options = prefix ? { prefix } : undefined;
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
  constructor() {
    super();
    this.store = new Map();
  }

  _cleanKey(key) {
    return String(key).replace(/^\/+/, "").replace(/\\/g, "/").replace(/\/+$/, "");
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
    const cleanKey = this._cleanKey(key);
    this.store.set(cleanKey, { content, metadata });
    if (cleanKey.endsWith("/index.html")) {
      const folderKey = cleanKey.slice(0, -11);
      this.store.set(folderKey, { content, metadata });
    }
  }

  async has(key) {
    const cleanKey = this._cleanKey(key);
    return this.store.has(cleanKey) || this.store.has(cleanKey ? `${cleanKey}/index.html` : "index.html");
  }

  async delete(key) {
    const cleanKey = this._cleanKey(key);
    this.store.delete(cleanKey);
    this.store.delete(cleanKey ? `${cleanKey}/index.html` : "index.html");
  }

  keys() {
    return Array.from(this.store.keys());
  }
}

/**
 * Redis storage adapter for multi-server / clustered deployments.
 * Shares ISR / ISG cache across multiple Node instances.
 */
class RedisStorage extends StorageAdapter {
  constructor(redisClient, prefix = "dinou:cache:") {
    super();
    this.redis = redisClient;
    this.prefix = prefix;
  }

  _k(key) {
    return this.prefix + key.replace(/^\/+/, "").replace(/\\/g, "/");
  }

  async get(key) {
    if (!this.redis) return null;
    const raw = await this.redis.get(this._k(key));
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return { content: raw, metadata: null };
    }
  }

  async set(key, content, metadata = null) {
    if (!this.redis) return;
    const value = JSON.stringify({ content, metadata });
    await this.redis.set(this._k(key), value);
  }

  async has(key) {
    if (!this.redis) return false;
    return (await this.redis.exists(this._k(key))) === 1;
  }

  async delete(key) {
    if (!this.redis) return;
    await this.redis.del(this._k(key));
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
    return String(key).replace(/^\/+/, "").replace(/\\/g, "/");
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
    }
  }

  async keys(prefix = "dinou_cache") {
    const kv = await this._getKV();
    if (!kv) return [];
    try {
      const entries = kv.list({ prefix: [prefix] });
      const result = [];
      for await (const entry of entries) {
        if (entry.key && entry.key.length >= 2 && typeof entry.key[1] === "string") {
          result.push(entry.key[1]);
        }
      }
      return result;
    } catch (e) {
      return [];
    }
  }
}

let activeStorageAdapter = null;

function getStorageAdapter() {
  if (!activeStorageAdapter) {
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
        activeStorageAdapter = new DenoKVStorage();
      } else {
        activeStorageAdapter = new MemoryStorage();
      }
    } else {
      activeStorageAdapter = new FileSystemStorage();
    }
  }
  return activeStorageAdapter;
}

function setStorageAdapter(adapter) {
  activeStorageAdapter = adapter;
}

module.exports = {
  StorageAdapter,
  FileSystemStorage,
  CloudflareKVStorage,
  DenoKVStorage,
  MemoryStorage,
  RedisStorage,
  getStorageAdapter,
  setStorageAdapter,
};
