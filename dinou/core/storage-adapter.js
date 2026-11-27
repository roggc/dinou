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
    this._mutationEpoch = 0;
  }

  markTagInvalidated(tag) {
    if (tag) {
      this._invalidatedTags.set(String(tag), Date.now());
      this._mutationEpoch++;
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
    this._mutationEpoch++;
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
    this._mutationEpoch++;
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
 * Shared in-memory inverted tag index across slots, layouts, and pages.
 * Tracks route tags (`tags`) separately from slot tags (`slotTags`/`ownSlotTags`)
 * so `revalidateTag(tag)` preserves exact `onlyRefreshSlots` semantics in O(1).
 */
class InvertedTagIndex {
  constructor() {
    this.tagToSlots = new Map();   // tag -> Map<recordKey, slotDirId>
    this.tagToLayouts = new Map(); // tag -> Map<recordKey, { normPath, hasRouteTag, hasSlotTag }>
    this.tagToPages = new Map();   // tag -> Map<recordKey, { normPath, hasRouteTag, hasSlotTag }>
    this.records = new Map();      // recordKey -> { kind: "slot"|"layout"|"page", tags: Set<string> }
  }

  _getBucketMap(kind) {
    if (kind === "slot") return this.tagToSlots;
    if (kind === "layout") return this.tagToLayouts;
    return this.tagToPages;
  }

  removeRecord(recordKey) {
    const key = String(recordKey || "").replace(/\\/g, "/").replace(/^\/+/, "");
    const prev = this.records.get(key);
    if (!prev) return;
    const bucketMap = this._getBucketMap(prev.kind);
    for (const tag of prev.tags) {
      const m = bucketMap.get(tag);
      if (m) {
        m.delete(key);
        if (m.size === 0) bucketMap.delete(tag);
      }
    }
    this.records.delete(key);
  }

  removeByPrefix(prefix) {
    const cleanPrefix = String(prefix || "")
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");
    if (!cleanPrefix) {
      this.clear();
      return;
    }
    const prefixSlash = `${cleanPrefix}/`;
    for (const rk of Array.from(this.records.keys())) {
      if (rk === cleanPrefix || rk.startsWith(prefixSlash)) {
        this.removeRecord(rk);
      }
    }
  }

  clear() {
    this.tagToSlots.clear();
    this.tagToLayouts.clear();
    this.tagToPages.clear();
    this.records.clear();
  }

  upsert(recordKey, meta) {
    const key = String(recordKey || "").replace(/\\/g, "/").replace(/^\/+/, "");
    this.removeRecord(key);
    if (!key) return;

    if (
      key.endsWith("/slot.metadata.json") ||
      key.startsWith("slots/") ||
      key.endsWith("/slot.json")
    ) {
      const slotIdMatch = key.match(/^slots\/([^/]+)\//);
      const slotDirId = slotIdMatch?.[1] || null;
      const canonicalId = (meta && meta.slotId) || slotDirId;
      if (!slotDirId && !canonicalId) return;
      const tags = new Set();
      if (canonicalId) tags.add(canonicalId);
      if (slotDirId) tags.add(slotDirId);
      if (meta && Array.isArray(meta.tags)) {
        for (const t of meta.tags) {
          if (t) tags.add(t);
        }
      }
      if (tags.size === 0) return;
      const effectiveDirId = slotDirId || canonicalId;
      for (const t of tags) {
        let m = this.tagToSlots.get(t);
        if (!m) {
          m = new Map();
          this.tagToSlots.set(t, m);
        }
        m.set(key, effectiveDirId);
      }
      this.records.set(key, { kind: "slot", tags });
      return;
    }

    if (!meta || typeof meta !== "object") return;

    const routeTags = new Set();
    if (Array.isArray(meta.tags)) {
      for (const t of meta.tags) {
        if (t) routeTags.add(t);
      }
    }
    const slotTags = new Set();
    if (Array.isArray(meta.slotTags)) {
      for (const t of meta.slotTags) {
        if (t) slotTags.add(t);
      }
    }
    if (Array.isArray(meta.ownSlotTags)) {
      for (const t of meta.ownSlotTags) {
        if (t) slotTags.add(t);
      }
    }
    if (routeTags.size === 0 && slotTags.size === 0) return;

    const allTags = new Set([...routeTags, ...slotTags]);

    if (key.endsWith("layout.metadata.json") || key.endsWith("layout.rsc")) {
      const cleanKey = key
        .replace(/\/(?:layout\.metadata\.json|layout\.rsc)$/, "")
        .replace(/^(?:layout\.metadata\.json|layout\.rsc)$/, "");
      const normPath = cleanKey ? (cleanKey.startsWith("/") ? cleanKey : "/" + cleanKey) : "/";
      for (const t of allTags) {
        let m = this.tagToLayouts.get(t);
        if (!m) {
          m = new Map();
          this.tagToLayouts.set(t, m);
        }
        m.set(key, {
          normPath,
          hasRouteTag: routeTags.has(t),
          hasSlotTag: slotTags.has(t),
        });
      }
      this.records.set(key, { kind: "layout", tags: allTags });
      return;
    }

    if (
      key.endsWith("metadata.json") ||
      key.endsWith("index.html") ||
      key.endsWith("shell.html")
    ) {
      const cleanKey = key
        .replace(/\/(?:metadata\.json|index\.html|shell\.html)$/, "")
        .replace(/^(?:metadata\.json|index\.html|shell\.html)$/, "");
      if (
        cleanKey.startsWith("slots/") ||
        cleanKey.endsWith("layout.rsc") ||
        cleanKey.endsWith("layout.metadata.json")
      ) {
        return;
      }
      const normPath = cleanKey ? (cleanKey.startsWith("/") ? cleanKey : "/" + cleanKey) : "/";
      for (const t of allTags) {
        let m = this.tagToPages.get(t);
        if (!m) {
          m = new Map();
          this.tagToPages.set(t, m);
        }
        m.set(key, {
          normPath,
          hasRouteTag: routeTags.has(t),
          hasSlotTag: slotTags.has(t),
        });
      }
      this.records.set(key, { kind: "page", tags: allTags });
    }
  }

  query(tag, isRecordValid = null) {
    const slotKeys = new Set();
    const layoutPaths = new Map();
    const pagePaths = new Map();

    const slotMatches = this.tagToSlots.get(tag);
    if (slotMatches) {
      for (const [rk, slotDirId] of Array.from(slotMatches.entries())) {
        if (isRecordValid && !isRecordValid(rk)) {
          this.removeRecord(rk);
          continue;
        }
        slotKeys.add(`slots/${slotDirId}/slot.json`);
        slotKeys.add(`slots/${slotDirId}/slot.metadata.json`);
      }
    }

    const layoutMatches = this.tagToLayouts.get(tag);
    if (layoutMatches) {
      for (const [rk, info] of Array.from(layoutMatches.entries())) {
        if (isRecordValid && !isRecordValid(rk)) {
          this.removeRecord(rk);
          continue;
        }
        const prev = layoutPaths.get(info.normPath);
        layoutPaths.set(info.normPath, {
          onlyRefreshSlots: prev
            ? prev.onlyRefreshSlots && !info.hasRouteTag
            : !info.hasRouteTag && info.hasSlotTag,
        });
      }
    }

    const pageMatches = this.tagToPages.get(tag);
    if (pageMatches) {
      for (const [rk, info] of Array.from(pageMatches.entries())) {
        if (isRecordValid && !isRecordValid(rk)) {
          this.removeRecord(rk);
          continue;
        }
        const prev = pagePaths.get(info.normPath);
        pagePaths.set(info.normPath, {
          onlyRefreshSlots: prev
            ? prev.onlyRefreshSlots && !info.hasRouteTag
            : !info.hasRouteTag && info.hasSlotTag,
        });
      }
    }

    return { slotKeys, layoutPaths, pagePaths };
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
    this._slotTagIndex = null;
    this._fullTagIndex = null;
  }

  invalidateTagIndex() {
    this._slotTagIndex = null;
    this._fullTagIndex = null;
  }

  _refreshFullTagIndexMtimes() {
    if (!this._fullTagIndex) return;
    const baseDirMtimeKey = this._readSlotsDirMtimeKey(this.baseDir);
    if (baseDirMtimeKey === null) {
      this._fullTagIndex = null;
      return;
    }
    this._fullTagIndex.baseDirMtimeKey = baseDirMtimeKey;
    this._fullTagIndex.slotsDirMtimeKey = this._readSlotsDirMtimeKey(
      path.join(this.baseDir, "slots")
    );
  }

  _buildFullTagIndex() {
    const baseDirMtimeKey = this._readSlotsDirMtimeKey(this.baseDir);
    if (baseDirMtimeKey === null) {
      this._fullTagIndex = null;
      return null;
    }
    const slotsDirMtimeKey = this._readSlotsDirMtimeKey(
      path.join(this.baseDir, "slots")
    );
    const index = new InvertedTagIndex();
    const walkMeta = (dir, rel = "") => {
      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch (e) {
        return;
      }
      for (const entry of entries) {
        const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walkMeta(path.join(dir, entry.name), entryRel);
        } else if (entry.name.endsWith("metadata.json")) {
          try {
            const raw = fs.readFileSync(path.join(dir, entry.name), "utf8");
            const meta = JSON.parse(raw);
            index.upsert(entryRel, meta);
          } catch (e) {
            if (entryRel.endsWith("/slot.metadata.json")) {
              index.upsert(entryRel, null);
            }
          }
        }
      }
    };
    walkMeta(this.baseDir);
    this._fullTagIndex = { baseDirMtimeKey, slotsDirMtimeKey, index };
    return this._fullTagIndex;
  }

  findTargetsByTag(tag) {
    if (!tag) {
      return {
        slotKeys: new Set(),
        layoutPaths: new Map(),
        pagePaths: new Map(),
      };
    }
    const baseDirMtimeKey = this._readSlotsDirMtimeKey(this.baseDir);
    if (baseDirMtimeKey === null) {
      this._fullTagIndex = null;
      return {
        slotKeys: new Set(),
        layoutPaths: new Map(),
        pagePaths: new Map(),
      };
    }
    const slotsDirMtimeKey = this._readSlotsDirMtimeKey(
      path.join(this.baseDir, "slots")
    );
    if (
      !this._fullTagIndex ||
      this._fullTagIndex.baseDirMtimeKey !== baseDirMtimeKey ||
      this._fullTagIndex.slotsDirMtimeKey !== slotsDirMtimeKey
    ) {
      this._buildFullTagIndex();
    }
    if (!this._fullTagIndex) {
      return {
        slotKeys: new Set(),
        layoutPaths: new Map(),
        pagePaths: new Map(),
      };
    }
    return this._fullTagIndex.index.query(tag, (rk) =>
      fs.existsSync(path.join(this.baseDir, rk))
    );
  }

  _readSlotsDirMtimeKey(slotsDir) {
    try {
      const st = fs.statSync(slotsDir, { bigint: true });
      if (st && st.mtimeNs !== undefined) return String(st.mtimeNs);
    } catch (e) {}
    try {
      return String(fs.statSync(slotsDir).mtimeMs);
    } catch (e) {
      return null;
    }
  }

  _updateSlotTagIndex(normSlotKey, metadata) {
    if (!this._slotTagIndex) return;
    const match = String(normSlotKey || "").match(/^slots\/([^/]+)\//);
    if (!match) return;
    const dirName = match[1];
    const canonicalId = (metadata && metadata.slotId) || dirName;
    const nextTags = new Set([canonicalId]);
    if (metadata && Array.isArray(metadata.tags)) {
      for (const t of metadata.tags) {
        if (t) nextTags.add(t);
      }
    }
    const { tagToSlotIds, slotTagsById, dirToCanonicalId } = this._slotTagIndex;
    const prevTags = slotTagsById.get(canonicalId);
    if (prevTags) {
      for (const oldTag of prevTags) {
        if (!nextTags.has(oldTag)) {
          const s = tagToSlotIds.get(oldTag);
          if (s) {
            s.delete(canonicalId);
            if (s.size === 0) tagToSlotIds.delete(oldTag);
          }
        }
      }
    }
    for (const tag of nextTags) {
      if (!tagToSlotIds.has(tag)) {
        tagToSlotIds.set(tag, new Set());
      }
      tagToSlotIds.get(tag).add(canonicalId);
    }
    slotTagsById.set(canonicalId, nextTags);
    dirToCanonicalId.set(dirName, canonicalId);
    const slotsDir = path.join(this.baseDir, "slots");
    const mtimeKey = this._readSlotsDirMtimeKey(slotsDir);
    if (mtimeKey !== null) {
      this._slotTagIndex.mtimeKey = mtimeKey;
    }
  }

  _removeSlotFromTagIndex(normSlotKey) {
    if (!this._slotTagIndex) return;
    const match = String(normSlotKey || "").match(/^slots\/([^/]+)\//);
    if (!match) {
      this._slotTagIndex = null;
      return;
    }
    const dirName = match[1];
    const { tagToSlotIds, slotTagsById, dirToCanonicalId } = this._slotTagIndex;
    const canonicalId = dirToCanonicalId.get(dirName) || dirName;
    dirToCanonicalId.delete(dirName);
    const prevTags = slotTagsById.get(canonicalId);
    if (prevTags) {
      for (const oldTag of prevTags) {
        const s = tagToSlotIds.get(oldTag);
        if (s) {
          s.delete(canonicalId);
          if (s.size === 0) tagToSlotIds.delete(oldTag);
        }
      }
      slotTagsById.delete(canonicalId);
    }
    const slotsDir = path.join(this.baseDir, "slots");
    const mtimeKey = this._readSlotsDirMtimeKey(slotsDir);
    if (mtimeKey !== null) {
      this._slotTagIndex.mtimeKey = mtimeKey;
    } else {
      this._slotTagIndex = null;
    }
  }

  getSlotTagIndex() {
    const slotsDir = path.join(this.baseDir, "slots");
    const mtimeKey = this._readSlotsDirMtimeKey(slotsDir);
    if (mtimeKey === null) {
      this._slotTagIndex = null;
      return new Map();
    }
    if (this._slotTagIndex && this._slotTagIndex.mtimeKey === mtimeKey) {
      return this._slotTagIndex.tagToSlotIds;
    }
    let entries;
    try {
      entries = fs.readdirSync(slotsDir, { withFileTypes: true });
    } catch (e) {
      return new Map();
    }
    const tagToSlotIds = new Map();
    const slotTagsById = new Map();
    const dirToCanonicalId = new Map();
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const slotDirName = entry.name;
      const metaPath = path.join(slotsDir, slotDirName, "slot.metadata.json");
      let meta = null;
      if (fs.existsSync(metaPath)) {
        try {
          meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
        } catch (e) {}
      }
      const canonicalId = (meta && meta.slotId) || slotDirName;
      const tagsForSlot = new Set([canonicalId]);
      if (meta && Array.isArray(meta.tags)) {
        for (const tag of meta.tags) {
          if (tag) tagsForSlot.add(tag);
        }
      }
      slotTagsById.set(canonicalId, tagsForSlot);
      dirToCanonicalId.set(slotDirName, canonicalId);
      for (const tag of tagsForSlot) {
        if (!tagToSlotIds.has(tag)) {
          tagToSlotIds.set(tag, new Set());
        }
        tagToSlotIds.get(tag).add(canonicalId);
      }
    }
    this._slotTagIndex = { mtimeKey, tagToSlotIds, slotTagsById, dirToCanonicalId };
    return tagToSlotIds;
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
    let content;
    try {
      content = fs.readFileSync(targetPath, "utf8");
    } catch (err) {
      if (err && (err.code === "EISDIR" || err.code === "EPERM")) {
        targetPath = path.join(targetPath, "index.html");
        try {
          content = fs.readFileSync(targetPath, "utf8");
        } catch (err2) {
          return null;
        }
      } else {
        return null;
      }
    }

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

    // Check companion metadata if available (single readFileSync without redundant existsSync)
    let metadata = null;
    const isLayoutKey =
      cleanKey.includes("layout.rsc") ||
      cleanKey.includes("layout._old.rsc") ||
      cleanKey.includes("layout.metadata.json") ||
      cleanKey.includes("shell.layout.json") ||
      cleanKey.includes("shell.layout.own.json") ||
      cleanKey.includes("shell.layout._old.json");
    const normSlotKey = cleanKey.replace(/^\/+/, "");
    const isSlotKey = normSlotKey.startsWith("slots/") || normSlotKey.endsWith("/slot.json") || normSlotKey.endsWith("/slot.metadata.json");
    const metaFileName = isLayoutKey
      ? "layout.metadata.json"
      : isSlotKey
      ? "slot.metadata.json"
      : "metadata.json";
    const metaPath = path.join(path.dirname(targetPath), metaFileName);
    try {
      metadata = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    } catch (e) {}
    return { content, metadata };
  }

  async getSlotMetadata(slotId) {
    if (!slotId) return null;
    const slotPath = this._resolve(`slots/${slotId}/slot.json`);
    if (!fs.existsSync(slotPath)) return null;
    const metaPath = path.join(path.dirname(slotPath), "slot.metadata.json");
    let metadata = null;
    try {
      metadata = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    } catch (e) {}
    return { exists: true, metadata };
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
    const normSlotKeyForIndex = cleanKey.replace(/^\/+/, "");
    const isSlotKeyForIndex =
      normSlotKeyForIndex.startsWith("slots/") ||
      normSlotKeyForIndex.endsWith("/slot.json") ||
      normSlotKeyForIndex.endsWith("/slot.metadata.json");
    if (metadata && !isMetaJson) {
      const isLayoutKey =
        cleanKey.includes("layout.rsc") ||
        cleanKey.includes("layout._old.rsc") ||
        cleanKey.includes("layout.metadata.json") ||
        cleanKey.includes("shell.layout.json") ||
        cleanKey.includes("shell.layout.own.json") ||
        cleanKey.includes("shell.layout._old.json");
      const metaFileName = isLayoutKey
        ? "layout.metadata.json"
        : isSlotKeyForIndex
        ? "slot.metadata.json"
        : "metadata.json";
      const metaPath = path.join(dir, metaFileName);
      fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), "utf8");
      if (isSlotKeyForIndex) {
        this._updateSlotTagIndex(normSlotKeyForIndex, metadata);
      }
      if (this._fullTagIndex) {
        const relMetaKey = path.relative(this.baseDir, metaPath).replace(/\\/g, "/");
        this._fullTagIndex.index.upsert(relMetaKey, metadata);
        this._refreshFullTagIndexMtimes();
      }
    } else if (isMetaJson) {
      let parsedMeta = null;
      try {
        parsedMeta = JSON.parse(content);
      } catch (e) {
        if (isSlotKeyForIndex) {
          this._slotTagIndex = null;
        }
      }
      if (isSlotKeyForIndex && parsedMeta) {
        this._updateSlotTagIndex(normSlotKeyForIndex, parsedMeta);
      }
      if (this._fullTagIndex) {
        const relMetaKey = path.relative(this.baseDir, targetPath).replace(/\\/g, "/");
        if (parsedMeta) {
          this._fullTagIndex.index.upsert(relMetaKey, parsedMeta);
        } else if (isSlotKeyForIndex) {
          this._fullTagIndex.index.upsert(relMetaKey, null);
        } else {
          this._fullTagIndex.index.removeRecord(relMetaKey);
        }
        this._refreshFullTagIndexMtimes();
      }
    } else if (this._fullTagIndex) {
      this._refreshFullTagIndexMtimes();
    }
  }

  async has(key) {
    const targetPath = this._resolve(key);
    try {
      const st = fs.statSync(targetPath);
      if (st.isDirectory()) {
        return fs.existsSync(path.join(targetPath, "index.html"));
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  async delete(key) {
    this._markDeleted(key);
    let targetPath = this._resolve(key);
    let wasDir = false;
    try {
      wasDir = fs.statSync(targetPath).isDirectory();
    } catch (e) {}
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
      this._removeSlotFromTagIndex(normSlotKey);
      if (this._fullTagIndex) {
        const relSlotDir = path.relative(this.baseDir, dir).replace(/\\/g, "/");
        this._fullTagIndex.index.removeByPrefix(relSlotDir);
        this._refreshFullTagIndexMtimes();
      }
    } else if (this._fullTagIndex) {
      const relTarget = path.relative(this.baseDir, targetPath).replace(/\\/g, "/");
      if (wasDir) {
        this._fullTagIndex.index.removeByPrefix(relTarget);
      } else {
        this._fullTagIndex.index.removeRecord(relTarget);
      }
      this._refreshFullTagIndexMtimes();
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

  _getKv() {
    try {
      const store =
        typeof globalThis !== "undefined"
          ? globalThis[Symbol.for("dinou.request.context.storage")]?.getStore?.()
          : null;
      const reqKv = store?.env?.DINOU_CACHE || store?.platformContext?.env?.DINOU_CACHE;
      if (reqKv) return reqKv;
    } catch (e) {}
    return this.kv;
  }

  _cleanKey(key) {
    return String(key).replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
  }

  _tombstoneKey(cleanKey) {
    return `__tombstone__:${cleanKey}`;
  }

  _tagInvKey(tag) {
    return `__tag_inv__:${String(tag)}`;
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

  _companionMetaKey(cleanKey) {
    if (cleanKey.endsWith("metadata.json")) return null;
    if (!cleanKey) return "metadata.json";
    if (!cleanKey.includes(".")) {
      return `${cleanKey}/metadata.json`;
    }
    const isLayoutKey =
      cleanKey.endsWith("layout.rsc") ||
      cleanKey.endsWith("layout._old.rsc") ||
      cleanKey.endsWith("shell.layout.json") ||
      cleanKey.endsWith("shell.layout.own.json") ||
      cleanKey.endsWith("shell.layout._old.json");
    const isSlotKey =
      cleanKey.startsWith("slots/") || cleanKey.endsWith("/slot.json");
    const dirPrefix = cleanKey.includes("/")
      ? cleanKey.slice(0, cleanKey.lastIndexOf("/"))
      : "";
    const metaFileName = isLayoutKey
      ? "layout.metadata.json"
      : isSlotKey
      ? "slot.metadata.json"
      : "metadata.json";
    return dirPrefix ? `${dirPrefix}/${metaFileName}` : metaFileName;
  }

  async _safeKvPut(kv, key, content, metadata = null) {
    if (!key) return false;
    if (!metadata) {
      await kv.put(key, content);
      return false;
    }
    let metaJson = "";
    try {
      metaJson = JSON.stringify(metadata);
    } catch (e) {
      await kv.put(key, content);
      return false;
    }
    const metaBytes =
      typeof TextEncoder !== "undefined"
        ? new TextEncoder().encode(metaJson).byteLength
        : metaJson.length;
    if (metaBytes <= 1024) {
      try {
        await kv.put(key, content, { metadata });
        return false;
      } catch (e) {
        if (!/metadata|413|1024/i.test(String(e?.message || e))) {
          throw e;
        }
      }
    }
    await kv.put(key, content);
    return true;
  }

  markTagInvalidated(tag) {
    super.markTagInvalidated(tag);
    const kv = this._getKv();
    if (tag && kv && typeof kv.put === "function") {
      const ts = String(this.getTagInvalidatedAt(tag) || Date.now());
      Promise.resolve(kv.put(this._tagInvKey(tag), ts)).catch(() => {});
    }
  }

  async markTagInvalidatedAsync(tag) {
    super.markTagInvalidated(tag);
    const kv = this._getKv();
    if (tag && kv && typeof kv.put === "function") {
      const ts = String(this.getTagInvalidatedAt(tag) || Date.now());
      try {
        await kv.put(this._tagInvKey(tag), ts);
      } catch (e) {}
    }
  }

  async getTagInvalidatedAtAsync(tag) {
    const localTs = this.getTagInvalidatedAt(tag);
    const kv = this._getKv();
    if (!tag || !kv || typeof kv.get !== "function") {
      return localTs;
    }
    try {
      const remoteRaw = await kv.get(this._tagInvKey(tag));
      const remoteTs = remoteRaw ? Number(remoteRaw) || 0 : 0;
      return Math.max(localTs, remoteTs);
    } catch (e) {
      return localTs;
    }
  }

  async isKeyDeleted(key) {
    if (this.isDeleted(key)) return true;
    const kv = this._getKv();
    if (!kv || typeof kv.get !== "function") return false;
    const cleanKey = this._cleanKey(key);
    try {
      const val = await kv.get(this._tombstoneKey(cleanKey));
      return val !== null && val !== undefined;
    } catch (e) {
      return false;
    }
  }

  async get(key) {
    const kv = this._getKv();
    if (!kv) return null;
    const cleanKey = this._cleanKey(key);
    let matchedKey = cleanKey;
    let res = null;
    if (cleanKey) {
      res = await kv.getWithMetadata(cleanKey, "text");
    }
    if ((!res || res.value === null) && !cleanKey.includes(".")) {
      matchedKey = cleanKey ? `${cleanKey}/index.html` : "index.html";
      res = await kv.getWithMetadata(matchedKey, "text");
    }
    if (!res || res.value === null) return null;
    let metadata = res.metadata || null;
    if (!metadata) {
      const compMetaKey = this._companionMetaKey(matchedKey);
      if (compMetaKey && typeof kv.get === "function") {
        try {
          const rawMeta = await kv.get(compMetaKey);
          if (rawMeta) metadata = JSON.parse(rawMeta);
        } catch (e) {}
      }
    }
    return {
      content: res.value,
      metadata,
    };
  }

  async set(key, content, metadata = null) {
    this._unmarkDeleted(key);
    const kv = this._getKv();
    if (!kv) return;
    const cleanKey = this._cleanKey(key);
    const primaryKey = cleanKey || "index.html";
    const overflowed = await this._safeKvPut(kv, primaryKey, content, metadata);
    const tombstonesToClear = [
      this._tombstoneKey(cleanKey),
      ...(primaryKey !== cleanKey ? [this._tombstoneKey(primaryKey)] : []),
      ...this._companionKeys(cleanKey).map((tk) => this._tombstoneKey(tk)),
    ];
    if (cleanKey.endsWith("/index.html")) {
      const folderKey = cleanKey.slice(0, -11);
      if (folderKey) {
        await this._safeKvPut(kv, folderKey, content, metadata);
      }
    }
    if (overflowed && metadata) {
      const compMetaKey = this._companionMetaKey(primaryKey);
      if (compMetaKey) {
        try {
          await kv.put(compMetaKey, JSON.stringify(metadata));
          tombstonesToClear.push(this._tombstoneKey(compMetaKey));
        } catch (e) {}
      }
    }
    if (typeof kv.delete === "function") {
      await Promise.all(
        tombstonesToClear.map((tk) => Promise.resolve(kv.delete(tk)).catch(() => {}))
      );
    }
  }

  async has(key) {
    const kv = this._getKv();
    if (!kv) return false;
    const cleanKey = this._cleanKey(key);
    if (cleanKey) {
      const val = await kv.get(cleanKey);
      if (val !== null) return true;
    }
    if (!cleanKey.includes(".")) {
      const fallbackVal = await kv.get(
        cleanKey ? `${cleanKey}/index.html` : "index.html"
      );
      return fallbackVal !== null;
    }
    return false;
  }

  async delete(key) {
    this._markDeleted(key);
    const kv = this._getKv();
    if (!kv) return;
    const cleanKey = this._cleanKey(key);
    const targets = [cleanKey, ...this._companionKeys(cleanKey)];
    await Promise.all(
      targets.map(async (tk) => {
        if (tk) {
          try {
            await kv.delete(tk);
          } catch (e) {}
        }
        try {
          if (typeof kv.put === "function") {
            await kv.put(this._tombstoneKey(tk), String(Date.now()));
          }
        } catch (e) {}
      })
    );
  }

  async listSlotMetadataEntries() {
    const kv = this._getKv();
    if (!kv || typeof kv.list !== "function") return null;
    try {
      const bySlot = new Map();
      let cursor = undefined;
      while (true) {
        const options = { prefix: "slots/" };
        if (cursor) options.cursor = cursor;
        const res = await kv.list(options);
        if (res && Array.isArray(res.keys)) {
          for (const k of res.keys) {
            if (!k || typeof k.name !== "string") continue;
            const key = k.name.replace(/\\/g, "/");
            const m = key.match(/^slots\/([^/]+)\/(slot\.json|slot\.metadata\.json)$/);
            if (!m) continue;
            const slotDirId = m[1];
            const prev = bySlot.get(slotDirId);
            const inlineMeta =
              k.metadata && typeof k.metadata === "object" ? k.metadata : null;
            if (!prev || (!prev.metadata && inlineMeta) || m[2] === "slot.metadata.json") {
              bySlot.set(slotDirId, {
                slotDirId,
                key,
                metadata: inlineMeta || prev?.metadata || null,
              });
            }
          }
        }
        if (!res || res.list_complete !== false || !res.cursor) {
          break;
        }
        cursor = res.cursor;
      }
      return bySlot;
    } catch (e) {
      return null;
    }
  }

  async listKeysWithMetadata(prefix = "") {
    const kv = this._getKv();
    if (!kv || typeof kv.list !== "function") return null;
    try {
      const effectivePrefix = prefix === "dinou_cache" ? "" : prefix;
      const results = new Map();
      let cursor = undefined;
      while (true) {
        const options = {};
        if (effectivePrefix) options.prefix = effectivePrefix;
        if (cursor) options.cursor = cursor;
        const res = await kv.list(
          Object.keys(options).length > 0 ? options : undefined
        );
        if (res && Array.isArray(res.keys)) {
          for (const k of res.keys) {
            if (
              k &&
              typeof k.name === "string" &&
              !k.name.startsWith("__tombstone__:") &&
              !k.name.startsWith("__tag_inv__:")
            ) {
              results.set(
                k.name,
                k.metadata && typeof k.metadata === "object" ? k.metadata : null
              );
            }
          }
        }
        if (!res || res.list_complete !== false || !res.cursor) {
          break;
        }
        cursor = res.cursor;
      }
      return results;
    } catch (e) {
      return null;
    }
  }

  async keys(prefix = "") {
    const kv = this._getKv();
    if (!kv || typeof kv.list !== "function") return [];
    try {
      const effectivePrefix = prefix === "dinou_cache" ? "" : prefix;
      const results = [];
      let cursor = undefined;
      while (true) {
        const options = {};
        if (effectivePrefix) options.prefix = effectivePrefix;
        if (cursor) options.cursor = cursor;
        const res = await kv.list(
          Object.keys(options).length > 0 ? options : undefined
        );
        if (res && Array.isArray(res.keys)) {
          for (const k of res.keys) {
            if (
              k &&
              typeof k.name === "string" &&
              !k.name.startsWith("__tombstone__:") &&
              !k.name.startsWith("__tag_inv__:")
            ) {
              results.push(k.name);
            }
          }
        }
        if (!res || res.list_complete !== false || !res.cursor) {
          break;
        }
        cursor = res.cursor;
      }
      return results;
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
    this._slotTagIndex = new Map();
    this._slotTagsById = new Map();
    this._slotDirToCanonicalId = new Map();
    this._fullTagIndex = new InvertedTagIndex();
  }

  findTargetsByTag(tag) {
    if (this.hydrateFromDisk) return null;
    if (!tag) {
      return {
        slotKeys: new Set(),
        layoutPaths: new Map(),
        pagePaths: new Map(),
      };
    }
    return this._fullTagIndex.query(tag);
  }

  _cleanKey(key) {
    return String(key || "").replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
  }

  _updateSlotTagIndex(cleanKey, content, metadata) {
    const m = cleanKey.match(/^slots\/([^/]+)\/(slot\.json|slot\.metadata\.json)$/);
    if (!m) return;
    const dirName = m[1];
    let meta = metadata;
    if (!meta && m[2] === "slot.metadata.json" && typeof content === "string") {
      try {
        meta = JSON.parse(content);
      } catch (e) {}
    }
    if (!meta && m[2] === "slot.json" && this._slotDirToCanonicalId.has(dirName)) {
      return;
    }
    const canonicalId = (meta && meta.slotId) || dirName;
    const nextTags = new Set([canonicalId]);
    if (meta && Array.isArray(meta.tags)) {
      for (const t of meta.tags) {
        if (t) nextTags.add(t);
      }
    }
    const prevTags = this._slotTagsById.get(canonicalId);
    if (prevTags) {
      for (const oldTag of prevTags) {
        if (!nextTags.has(oldTag)) {
          const s = this._slotTagIndex.get(oldTag);
          if (s) {
            s.delete(canonicalId);
            if (s.size === 0) this._slotTagIndex.delete(oldTag);
          }
        }
      }
    }
    for (const tag of nextTags) {
      if (!this._slotTagIndex.has(tag)) {
        this._slotTagIndex.set(tag, new Set());
      }
      this._slotTagIndex.get(tag).add(canonicalId);
    }
    this._slotTagsById.set(canonicalId, nextTags);
    this._slotDirToCanonicalId.set(dirName, canonicalId);
  }

  _removeSlotFromTagIndex(cleanKey) {
    const m = cleanKey.match(/^slots\/([^/]+)\/(slot\.json|slot\.metadata\.json)$/);
    if (!m) return;
    const dirName = m[1];
    const canonicalId = this._slotDirToCanonicalId.get(dirName) || dirName;
    this._slotDirToCanonicalId.delete(dirName);
    const prevTags = this._slotTagsById.get(canonicalId);
    if (prevTags) {
      for (const oldTag of prevTags) {
        const s = this._slotTagIndex.get(oldTag);
        if (s) {
          s.delete(canonicalId);
          if (s.size === 0) this._slotTagIndex.delete(oldTag);
        }
      }
      this._slotTagsById.delete(canonicalId);
    }
  }

  getSlotTagIndex() {
    return this._slotTagIndex;
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

  async getSlotMetadata(slotId) {
    if (!slotId) return null;
    const item = this.store.get(`slots/${slotId}/slot.json`);
    if (!item || !item.content) return null;
    return { exists: true, metadata: item.metadata || null };
  }

  async set(key, content, metadata = null) {
    this._unmarkDeleted(key);
    const cleanKey = this._cleanKey(key);
    this.store.set(cleanKey, { content, metadata });
    if (cleanKey.startsWith("slots/")) {
      this._updateSlotTagIndex(cleanKey, content, metadata);
    }
    let effectiveMeta = metadata && typeof metadata === "object" ? metadata : null;
    if (!effectiveMeta && cleanKey.endsWith("metadata.json") && typeof content === "string") {
      try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === "object") effectiveMeta = parsed;
      } catch (e) {}
    }
    this._fullTagIndex.upsert(cleanKey, effectiveMeta);
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
    this._fullTagIndex.removeRecord(cleanKey);
    if (cleanKey.startsWith("slots/")) {
      this._removeSlotFromTagIndex(cleanKey);
    }
    if (cleanKey.endsWith("/index.html")) {
      this.store.delete(cleanKey.slice(0, -11));
    } else if (cleanKey === "index.html") {
      this.store.delete("");
    } else if (!cleanKey.includes(".")) {
      const idxKey = cleanKey ? `${cleanKey}/index.html` : "index.html";
      this.store.delete(idxKey);
      this._fullTagIndex.removeRecord(idxKey);
    }
    if (cleanKey.endsWith("/slot.json")) {
      const metaKey = cleanKey.slice(0, -10) + "/slot.metadata.json";
      this.store.delete(metaKey);
      this._fullTagIndex.removeRecord(metaKey);
    } else if (cleanKey.endsWith("/slot.metadata.json")) {
      const slotKey = cleanKey.slice(0, -19) + "/slot.json";
      this.store.delete(slotKey);
      this._fullTagIndex.removeRecord(slotKey);
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
 * Shares ISR / ISG cache, chunked >16KB payloads, invalidation tombstones,
 * and tag invalidation timestamps across multiple Deno Deploy isolates.
 */
class DenoKVStorage extends StorageAdapter {
  constructor(kvInstance = null, options = null) {
    super();
    this.kv = kvInstance;
    if (
      options &&
      typeof options === "object" &&
      typeof options.hydrateFromDisk === "boolean"
    ) {
      this.hydrateFromDisk = options.hydrateFromDisk;
    }
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
    return String(key || "")
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");
  }

  _tombstoneKey(cleanKey) {
    return ["dinou_cache_tombstone", cleanKey];
  }

  _tagInvKey(tag) {
    return ["dinou_cache_tag_inv", String(tag)];
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
    if (!tag) return;
    const ts = String(this.getTagInvalidatedAt(tag) || Date.now());
    this._getKV()
      .then((kv) => {
        if (kv && typeof kv.set === "function") {
          return kv.set(this._tagInvKey(tag), ts);
        }
      })
      .catch(() => {});
  }

  async markTagInvalidatedAsync(tag) {
    super.markTagInvalidated(tag);
    if (!tag) return;
    const kv = await this._getKV();
    if (!kv || typeof kv.set !== "function") return;
    const ts = String(this.getTagInvalidatedAt(tag) || Date.now());
    try {
      await kv.set(this._tagInvKey(tag), ts);
    } catch (e) {}
  }

  async getTagInvalidatedAtAsync(tag) {
    const localTs = this.getTagInvalidatedAt(tag);
    if (!tag) return localTs;
    const kv = await this._getKV();
    if (!kv || typeof kv.get !== "function") return localTs;
    try {
      const res = await kv.get(this._tagInvKey(tag));
      const remoteTs =
        res && res.value !== null && res.value !== undefined
          ? Number(res.value) || 0
          : 0;
      return Math.max(localTs, remoteTs);
    } catch (e) {
      return localTs;
    }
  }

  async isKeyDeleted(key) {
    if (this.isDeleted(key)) return true;
    const kv = await this._getKV();
    if (!kv || typeof kv.get !== "function") return false;
    const cleanKey = this._cleanKey(key);
    try {
      const res = await kv.get(this._tombstoneKey(cleanKey));
      return Boolean(res && res.value !== null && res.value !== undefined);
    } catch (e) {
      return false;
    }
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
      const totalChunks = Number(val.totalChunks) || 0;
      if (totalChunks <= 0) return null;
      const chunkPromises = [];
      for (let i = 0; i < totalChunks; i++) {
        chunkPromises.push(kv.get(["dinou_cache_chunk", matchedKey, i]));
      }
      const chunkResults = await Promise.all(chunkPromises);
      let fullContent = "";
      for (const chunkRes of chunkResults) {
        if (!chunkRes || typeof chunkRes.value !== "string") {
          return null;
        }
        fullContent += chunkRes.value;
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

  async getSlotMetadata(slotId) {
    if (!slotId) return null;
    const kv = await this._getKV();
    if (!kv) return null;
    const res = await kv.get(["dinou_cache", `slots/${slotId}/slot.json`]);
    if (!res || res.value === null || res.value === undefined) return null;
    const val = res.value;
    if (val && typeof val === "object" && val.chunked) {
      return { exists: true, metadata: val.metadata || null };
    }
    const hasContent =
      typeof val === "string"
        ? val.length > 0
        : Boolean(val && typeof val.content === "string" && val.content.length > 0);
    if (!hasContent) return null;
    return {
      exists: true,
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
      let prevChunks = 0;
      try {
        const prev = await kv.get(["dinou_cache", targetKey]);
        if (prev && prev.value && prev.value.chunked) {
          prevChunks = Number(prev.value.totalChunks) || 0;
        }
      } catch (e) {}

      const isChunked = typeof content === "string" && content.length > KV_CHUNK_SIZE;
      const totalChunks = isChunked ? Math.ceil(content.length / KV_CHUNK_SIZE) : 0;

      if (typeof kv.atomic === "function") {
        const atomic = kv.atomic();
        if (isChunked) {
          atomic.set(["dinou_cache", targetKey], {
            chunked: true,
            totalChunks,
            metadata,
          });
          for (let i = 0; i < totalChunks; i++) {
            const chunk = content.slice(i * KV_CHUNK_SIZE, (i + 1) * KV_CHUNK_SIZE);
            atomic.set(["dinou_cache_chunk", targetKey, i], chunk);
          }
        } else {
          atomic.set(["dinou_cache", targetKey], {
            chunked: false,
            content,
            metadata,
          });
        }
        for (let i = totalChunks; i < prevChunks; i++) {
          atomic.delete(["dinou_cache_chunk", targetKey, i]);
        }
        atomic.delete(this._tombstoneKey(targetKey));
        await atomic.commit();
      } else {
        if (isChunked) {
          for (let i = 0; i < totalChunks; i++) {
            const chunk = content.slice(i * KV_CHUNK_SIZE, (i + 1) * KV_CHUNK_SIZE);
            await kv.set(["dinou_cache_chunk", targetKey, i], chunk);
          }
          await kv.set(["dinou_cache", targetKey], {
            chunked: true,
            totalChunks,
            metadata,
          });
        } else {
          await kv.set(["dinou_cache", targetKey], {
            chunked: false,
            content,
            metadata,
          });
        }
        for (let i = totalChunks; i < prevChunks; i++) {
          await kv.delete(["dinou_cache_chunk", targetKey, i]);
        }
        await kv.delete(this._tombstoneKey(targetKey));
      }
    };

    const writtenKeys = new Set([cleanKey]);
    await writeKey(cleanKey);

    if (cleanKey.endsWith("/index.html")) {
      const folderKey = cleanKey.slice(0, -11);
      writtenKeys.add(folderKey);
      await writeKey(folderKey);
    } else if (cleanKey === "index.html") {
      writtenKeys.add("");
      await writeKey("");
    }

    const extraTombstonesToClear = this._companionKeys(cleanKey).filter(
      (tk) => !writtenKeys.has(tk)
    );
    if (extraTombstonesToClear.length > 0 && typeof kv.delete === "function") {
      await Promise.all(
        extraTombstonesToClear.map((tk) =>
          Promise.resolve(kv.delete(this._tombstoneKey(tk))).catch(() => {})
        )
      );
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
      return Boolean(fallbackRes && fallbackRes.value !== null);
    }
    return false;
  }

  async delete(key) {
    this._markDeleted(key);
    const kv = await this._getKV();
    if (!kv) return;
    const cleanKey = this._cleanKey(key);
    const ts = String(Date.now());
    const targets = Array.from(new Set([cleanKey, ...this._companionKeys(cleanKey)]));

    const delKey = async (targetKey) => {
      let prevChunks = 0;
      try {
        const res = await kv.get(["dinou_cache", targetKey]);
        if (res && res.value && res.value.chunked) {
          prevChunks = Number(res.value.totalChunks) || 0;
        }
      } catch (e) {}

      if (typeof kv.atomic === "function") {
        const atomic = kv.atomic();
        for (let i = 0; i < prevChunks; i++) {
          atomic.delete(["dinou_cache_chunk", targetKey, i]);
        }
        atomic.delete(["dinou_cache", targetKey]);
        atomic.set(this._tombstoneKey(targetKey), ts);
        await atomic.commit();
      } else {
        for (let i = 0; i < prevChunks; i++) {
          await kv.delete(["dinou_cache_chunk", targetKey, i]);
        }
        await kv.delete(["dinou_cache", targetKey]);
        if (typeof kv.set === "function") {
          await kv.set(this._tombstoneKey(targetKey), ts);
        }
      }
    };

    await Promise.all(targets.map((tk) => delKey(tk)));
  }

  async keys(prefix = "") {
    const kv = await this._getKV();
    if (!kv) return [];
    const normPrefix =
      !prefix || prefix === "dinou_cache"
        ? ""
        : String(prefix).replace(/\\/g, "/").replace(/^\/+/, "");
    try {
      const entries = kv.list({ prefix: ["dinou_cache"] });
      const result = [];
      for await (const entry of entries) {
        if (entry.key && entry.key.length >= 2 && typeof entry.key[1] === "string") {
          const k = entry.key[1];
          if (k.startsWith("__tombstone__:") || k.startsWith("__tag_inv__:")) {
            continue;
          }
          if (!normPrefix || k.startsWith(normPrefix)) {
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
        : typeof Deno !== "undefined" && typeof Deno.cwd === "function"
          ? Deno.cwd()
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
      writeKey.endsWith("shell.page._old.json") ||
      writeKey.endsWith("shell.layout.json") ||
      writeKey.endsWith("shell.layout.own.json") ||
      writeKey.endsWith("shell.layout._old.json");

    if (!isMetaFile) {
      const generatedAt = Number(
        (writeKey.endsWith("shell.page.json") && item.metadata?.pageGeneratedAt) ||
          (writeKey.endsWith("shell.layout.own.json") &&
            (item.metadata?.ownGeneratedAt || item.metadata?.layoutGeneratedAt)) ||
          (writeKey.endsWith("shell.layout.json") && item.metadata?.layoutGeneratedAt) ||
          item.metadata?.generatedAt ||
          0
      );
      const slotIdFromKey = writeKey.match(/^slots\/([^/]+)\//)?.[1];
      const combinedTags = new Set([
        ...(Array.isArray(item.metadata?.tags) ? item.metadata.tags : []),
        ...(!isShellJson && Array.isArray(item.metadata?.slotTags)
          ? item.metadata.slotTags
          : []),
        ...(!isShellJson && Array.isArray(item.metadata?.ownSlotTags)
          ? item.metadata.ownSlotTags
          : []),
        ...(item.metadata?.slotId ? [item.metadata.slotId] : []),
        ...(slotIdFromKey ? [slotIdFromKey] : []),
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
          writeKey.endsWith("layout._old.rsc") ||
          writeKey.endsWith("shell.layout.json") ||
          writeKey.endsWith("shell.layout.own.json") ||
          writeKey.endsWith("shell.layout._old.json");
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
