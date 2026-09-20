// dinou/cloudflare/shims/fs.js
function getVfs() {
  return (typeof globalThis !== "undefined" && globalThis.__DINOU_VFS__) || {};
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

export const existsSync = (p) => {
  const vfs = getVfs();
  return lookupVfs(vfs, p) !== null;
};

export const readFileSync = (p) => {
  const vfs = getVfs();
  const entry = lookupVfs(vfs, p);
  if (entry && typeof entry.content === "string") {
    return entry.content;
  }
  return "";
};

export const readdirSync = (p, options) => {
  const vfs = getVfs();
  const entry = lookupVfs(vfs, p);
  if (!entry || entry.type !== "directory" || !Array.isArray(entry.children)) {
    return [];
  }
  if (options && options.withFileTypes) {
    return entry.children.map((c) => ({
      name: c.name,
      isDirectory: () => !!c.isDirectory,
      isFile: () => !c.isDirectory,
    }));
  }
  return entry.children.map((c) => c.name);
};

export const statSync = (p) => {
  const vfs = getVfs();
  const entry = lookupVfs(vfs, p);
  const isDir = entry && entry.type === "directory";
  const isF = entry && entry.type === "file";
  return {
    isDirectory: () => !!isDir,
    isFile: () => !!isF,
  };
};

export const mkdirSync = () => {};
export const writeFileSync = () => {};
export const rmSync = () => {};

export const promises = {
  readFile: async (p) => readFileSync(p),
  writeFile: async () => {},
  readdir: async (p, opts) => readdirSync(p, opts),
  stat: async (p) => statSync(p),
  mkdir: async () => {},
  rm: async () => {},
};

export default {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  promises,
};
