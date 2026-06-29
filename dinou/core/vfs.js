const fs = require("fs");
const path = require("path");

const isDevelopment = process.env.NODE_ENV !== "production";
const vfs = {};

function buildVfs(dir) {
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
    if (isDirectory) {
      buildVfs(fullPath);
    } else {
      vfs[fullPath] = { type: "file" };
    }
  }

  vfs[dir] = {
    type: "directory",
    children
  };
}

if (!isDevelopment) {
  const srcDir = path.resolve(process.cwd(), "src");
  buildVfs(srcDir);
}

function existsSync(filePath) {
  if (isDevelopment) {
    return fs.existsSync(filePath);
  }
  const normalized = path.resolve(filePath);
  return !!vfs[normalized];
}

function readdirSync(dirPath, options) {
  if (isDevelopment) {
    return fs.readdirSync(dirPath, options);
  }
  const normalized = path.resolve(dirPath);
  const entry = vfs[normalized];
  if (!entry || entry.type !== "directory") {
    throw new Error(`ENOTDIR: not a directory, readdir '${dirPath}'`);
  }

  if (options && options.withFileTypes) {
    return entry.children.map(child => ({
      name: child.name,
      isDirectory: () => child.isDirectory,
      isFile: () => !child.isDirectory
    }));
  }
  return entry.children.map(child => child.name);
}

module.exports = {
  existsSync,
  readdirSync
};
