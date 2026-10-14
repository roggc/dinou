const fs = require("fs");
const path = require("path");

const isDevelopment =
  process.env.DINOU_DEV === "true" ||
  (typeof globalThis !== "undefined" && Boolean(globalThis.__DINOU_DEV__)) ||
  process.env.NODE_ENV !== "production";
const localVfs = {};

function getVfs() {
  if (typeof globalThis !== "undefined" && globalThis.__DINOU_VFS__) {
    return globalThis.__DINOU_VFS__;
  }
  return localVfs;
}

function normalizeKey(p) {
  if (!p) return "";
  let s = String(p).replace(/\\/g, "/");
  if (s.length > 2 && s[1] === ":") s = s.slice(2);
  return s;
}

function buildVfs(dir, baseDir = dir) {
  const vfs = getVfs();
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const children = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const isDirectory = entry.isDirectory();
    children.push({
      name: entry.name,
      isDirectory
    });
    const slashPath = fullPath.replace(/\\/g, "/");
    const relFromSrc = path.relative(baseDir, fullPath).replace(/\\/g, "/");
    if (isDirectory) {
      buildVfs(fullPath, baseDir);
    } else {
      vfs[normalizeKey(fullPath)] = { type: "file" };
      vfs[slashPath] = { type: "file" };
      vfs["src/" + relFromSrc] = { type: "file" };
      vfs["/src/" + relFromSrc] = { type: "file" };
    }
  }

  const slashDir = dir.replace(/\\/g, "/");
  const relDir = path.relative(baseDir, dir).replace(/\\/g, "/");
  const entry = { type: "directory", children };
  vfs[normalizeKey(dir)] = entry;
  vfs[slashDir] = entry;
  vfs[relDir ? "src/" + relDir : "src"] = entry;
  vfs[relDir ? "/src/" + relDir : "/src"] = entry;
}

if (!isDevelopment) {
  try {
    const srcDir = path.resolve(process.cwd(), "src");
    if (Object.keys(getVfs()).length === 0 && fs.existsSync && fs.existsSync(srcDir)) {
      buildVfs(srcDir, srcDir);
    }
  } catch (e) {}
}

function lookupVfs(vfs, p) {
  if (!vfs || !p) return null;
  if (vfs[p]) return vfs[p];

  const s = String(p).split("\\").join("/");
  if (vfs[s]) return vfs[s];

  if (s.length > 2 && s[1] === ":") {
    const noDrive = s.slice(2);
    if (vfs[noDrive]) return vfs[noDrive];
  }

  const idx = s.indexOf("/src");
  if (idx !== -1) {
    const fromSlash = s.slice(idx);
    if (vfs[fromSlash]) return vfs[fromSlash];
    const noSlash = fromSlash.slice(1);
    if (vfs[noSlash]) return vfs[noSlash];
  } else if (s.startsWith("src/") || s === "src") {
    if (vfs[s]) return vfs[s];
    if (vfs["/" + s]) return vfs["/" + s];
  }

  const trimmed = s.replace(/^\/+/, "");
  if (vfs[trimmed]) return vfs[trimmed];
  if (vfs["/" + trimmed]) return vfs["/" + trimmed];

  return null;
}

function existsSync(filePath) {
  const vfs = getVfs();
  if (lookupVfs(vfs, filePath) !== null) {
    return true;
  }
  try {
    if (typeof fs.existsSync === "function" && fs.existsSync(filePath)) {
      return true;
    }
  } catch (e) {}
  return false;
}

function readdirSync(dirPath, options) {
  const vfs = getVfs();
  const entry = lookupVfs(vfs, dirPath);

  if (entry && entry.type === "directory" && Array.isArray(entry.children)) {
    if (options && options.withFileTypes) {
      return entry.children.map(child => ({
        name: child.name,
        isDirectory: () => child.isDirectory,
        isFile: () => !child.isDirectory
      }));
    }
    return entry.children.map(child => child.name);
  }

  try {
    if (typeof fs.readdirSync === "function") {
      const res = fs.readdirSync(dirPath, options);
      if (res) return res;
    }
  } catch (e) {}
  return [];
}

module.exports = {
  existsSync,
  readdirSync,
  buildVfs,
  getVfs,
};
