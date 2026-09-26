import fs from "node:fs/promises";
import path from "node:path";
import { regex } from "../../core/asset-extensions.js";

function areBuffersEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.byteLength !== b.byteLength) return false;
  return Buffer.from(a.buffer, a.byteOffset, a.byteLength).equals(
    Buffer.from(b.buffer, b.byteOffset, b.byteLength)
  );
}

const writtenCache = new Map();
const createdDirs = new Set();

export default async function write(result) {
  if (!result.metafile) {
    return;
  }
  const skipSet = new Set();
  const normalizeRel = (p) => p.replace(/\\/g, "/");
  const cssRegex = /\.(css|scss|less)$/i;
  for (const [relPath, info] of Object.entries(result.metafile.outputs)) {
    if (!info.entryPoint) continue;
    let entryPointNormalized = info.entryPoint;
    if (entryPointNormalized.startsWith("dinou-asset:")) {
      entryPointNormalized = entryPointNormalized.replace("dinou-asset:", "");
    }
    const inputKeys = Object.keys(info.inputs);
    // Logic for assets
    if (
      regex.test(entryPointNormalized) &&
      inputKeys.length === 1 &&
      inputKeys[0] === info.entryPoint
    ) {
      // Skip the useless .js file
      const normalizedPath = normalizeRel(relPath);
      skipSet.add(normalizedPath);
      // Skip the corresponding .map file if it exists
      const mapRelPath = relPath.replace(/\.js$/, ".js.map");
      if (result.metafile.outputs[mapRelPath]) {
        skipSet.add(normalizeRel(mapRelPath));
      }
    }
    // Logic for CSS
    if (
      cssRegex.test(info.entryPoint) &&
      ((inputKeys.length === 1 && inputKeys[0] === info.entryPoint) ||
        inputKeys.length === 0)
    ) {
      // Skip the useless .js file
      const normalizedPath = normalizeRel(relPath);
      skipSet.add(normalizedPath);
      // Skip the corresponding .map file if it exists
      const mapRelPath = relPath + ".map";
      if (result.metafile.outputs[mapRelPath]) {
        skipSet.add(normalizeRel(mapRelPath));
      }
    }
  }
  // 1. Populate in-memory files cache for zero-disk latency serving
  globalThis.__DINOU_MEM_FILES__ = globalThis.__DINOU_MEM_FILES__ || new Map();
  const publicDir = path.resolve(process.cwd(), ".dinou/public");
  for (const file of result.outputFiles) {
    const fileRelPath = normalizeRel(path.relative(process.cwd(), file.path));
    if (skipSet.has(fileRelPath)) continue;
    const cleanPublicRel = normalizeRel(path.relative(publicDir, file.path));
    const buf = Buffer.isBuffer(file.contents) ? file.contents : Buffer.from(file.contents);
    globalThis.__DINOU_MEM_FILES__.set(cleanPublicRel, buf);
    globalThis.__DINOU_MEM_FILES__.set("/" + cleanPublicRel, buf);
    const base = path.basename(cleanPublicRel);
    if (!globalThis.__DINOU_MEM_FILES__.has(base)) {
      globalThis.__DINOU_MEM_FILES__.set(base, buf);
    }
  }

  const isDebug =
    process.env.DINOU_DEBUG === "true" ||
    process.env.DINOU_DEBUG === "1" ||
    process.env.DEBUG === "true" ||
    process.env.DEBUG === "1";
  const timelineTime = () => new Date().toTimeString().slice(0, 8) + "." + String(Date.now() % 1000).padStart(3, "0");
  const timelineRel = () => globalThis.__TIMELINE_T0__ ? `[+${Date.now() - globalThis.__TIMELINE_T0__}ms]` : ``;

  const isDev = process.env.DINOU_DEV === "true" || process.env.NODE_ENV === "development";
  const shouldWriteToDisk = process.env.DINOU_WRITE_TO_DISK === "true" || !isDev;

  if (!shouldWriteToDisk) {
    globalThis.__DINOU_WRITE_TIME__ = 0;
    if (isDebug) {
      console.log(`⏱️ [TIMELINE ${timelineTime()}] ${timelineRel()} write.mjs: in-memory cache ready (${result.outputFiles.length} file(s)), disk write skipped (0ms)`);
    }
    console.log(`✓ Build completed`);
    return;
  }

  const filesToWrite = [];
  for (const file of result.outputFiles) {
    const fileRelPath = normalizeRel(path.relative(process.cwd(), file.path));
    if (skipSet.has(fileRelPath)) {
      continue;
    }
    const cached = writtenCache.get(file.path);
    if (cached && areBuffersEqual(cached, file.contents)) {
      continue;
    }
    filesToWrite.push(file);
  }

  if (filesToWrite.length === 0) {
    if (isDebug) {
      console.log(`⏱️ [TIMELINE ${timelineTime()}] ${timelineRel()} write.mjs: 0 files changed, disk write skipped (0ms)`);
    }
    return;
  }

  const tWrite0 = Date.now();
  if (isDebug) {
    console.log(`⏱️ [TIMELINE ${timelineTime()}] ${timelineRel()} write.mjs: writing ${filesToWrite.length} file(s) to disk...`);
  }
  const uniqueDirs = new Set();
  for (const f of filesToWrite) {
    const dir = path.dirname(f.path);
    if (!createdDirs.has(dir)) {
      uniqueDirs.add(dir);
      createdDirs.add(dir);
    }
  }
  if (uniqueDirs.size > 0) {
    await Promise.all(
      Array.from(uniqueDirs).map((d) => fs.mkdir(d, { recursive: true }))
    );
  }
  await Promise.all(
    filesToWrite.map(async (file) => {
      await fs.writeFile(file.path, file.contents);
      writtenCache.set(file.path, file.contents);
    })
  );
  globalThis.__DINOU_WRITE_TIME__ = Date.now() - tWrite0;

  if (isDebug) {
    console.log(`⏱️ [TIMELINE ${timelineTime()}] ${timelineRel()} write.mjs: wrote ${filesToWrite.length} file(s) in ${Date.now() - tWrite0}ms`);
  }
  console.log(`✓ Build completed`);
}
