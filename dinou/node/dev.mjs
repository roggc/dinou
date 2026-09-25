// dinou/node/dev.mjs
// Incremental Dual-Bundle Development Server for Dinou.
// Eliminates child_process.fork() by compiling Pass A (RSC) and Pass B (SSR)
// using esbuild.context() in memory, running a single unified streaming process.

import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Readable } from "node:stream";

const projectRoot = process.cwd();
const require = createRequire(path.resolve(projectRoot, "package.json"));
const esbuild = require("esbuild");
const chokidar = require("chokidar");

// Protect file descriptor operations against transient EMFILE spikes on Windows
try {
  const gracefulFs = require("graceful-fs");
  gracefulFs.gracefulify(fs);
} catch (e) {}

async function dynamicImportWithRetry(fileUrl, maxRetries = 6, delayMs = 60) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await import(fileUrl);
    } catch (err) {
      if ((err.code === "EMFILE" || err.code === "EBUSY" || err.code === "EPERM") && i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

process.env.NODE_ENV = "development";
process.env.DINOU_DEV = "true";
process.env.DINOU_RUNTIME = "node-bundle";
if (typeof globalThis !== "undefined") {
  globalThis.__DINOU_DEV__ = true;
  globalThis.__DINOU_RUNTIME__ = "node-bundle";
}

const isWebpackBuild = process.env.DINOU_BUILD_TOOL === "webpack";
const devDir = path.resolve(projectRoot, ".dinou/node-dev");
fs.mkdirSync(devDir, { recursive: true });

// Locate Dinou core directory
const dinouDir = fs.existsSync(path.resolve(projectRoot, "dinou"))
  ? path.resolve(projectRoot, "dinou")
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dinouDirSlash = dinouDir.replace(/\\/g, "/");

const { generateRouteModulesCode } = require(path.join(dinouDir, "core/route-generator.js"));
const parseExports = require(path.join(dinouDir, "core/parse-exports.js"));
const { useClientRegex, useServerRegex } = require(path.join(dinouDir, "constants.js"));
const { nodeToWebRequest, sendWebResponseToNode } = require(path.join(dinouDir, "core/http-adapter.js"));
const { setStorageAdapter, FileSystemStorage, MemoryStorage } = require(path.join(dinouDir, "core/storage-adapter.js"));
const createScopedName = require(path.join(dinouDir, "core/createScopedName.js"));
const { regex: assetRegex } = require(path.join(dinouDir, "core/asset-extensions.js"));

// Initialize Dinou Storage
try {
  const dist2Dir = path.resolve(projectRoot, ".dinou/dist2");
  setStorageAdapter(new FileSystemStorage(dist2Dir));
} catch (e) {
  setStorageAdapter(new MemoryStorage());
}

// Candidate Link and Redirect paths
const candidateDinouRoots = [
  dinouDir,
  path.resolve(projectRoot, "dinou"),
  path.resolve(projectRoot, "node_modules/dinou/dinou"),
  path.resolve(projectRoot, "node_modules/dinou"),
];
const candidateLinkPaths = new Set();
const candidateRedirectPaths = new Set();
for (const r of candidateDinouRoots) {
  candidateLinkPaths.add(path.resolve(r, "core/link.jsx"));
  candidateRedirectPaths.add(path.resolve(r, "core/client-redirect.jsx"));
}

function generateAllUrlVariants(absPath) {
  const norm = absPath.replace(/\\/g, "/");
  const fileUrl = pathToFileURL(absPath).href;
  const urls = new Set([fileUrl]);
  urls.add(fileUrl.replace(/file:\/\/\/([a-zA-Z]):/, (m, d) => 'file:///' + d.toLowerCase() + ':'));
  urls.add(fileUrl.replace(/file:\/\/\/([a-zA-Z]):/, (m, d) => 'file:///' + d.toUpperCase() + ':'));
  urls.add("file:///" + norm);
  urls.add("file://" + norm);
  return Array.from(urls);
}

const srcDir = path.resolve(projectRoot, "src");

function isSupportedClientModule(filePath, content) {
  const norm = filePath.replace(/\\/g, "/");
  if (!norm.includes("node_modules")) return true;
  if (content === undefined && fs.existsSync(filePath)) {
    try { content = fs.readFileSync(filePath, "utf8"); } catch (e) { return false; }
  }
  if (typeof content !== "string") return false;
  if (content.includes("System.register(") || content.includes("System.registerDynamic(")) return false;
  if (content.includes("define.amd") && !content.includes("export ") && !content.includes("module.exports")) return false;
  return true;
}

function findClientComponents(parsedClientManifest = {}) {
  const clientFiles = new Set();
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "tests" || entry.name === "test" || entry.name === "__tests__" || entry.name === "docs") continue;
        walk(full);
      } else if (/\.[jt]sx?$/.test(entry.name)) {
        try {
          const content = fs.readFileSync(full, "utf8");
          if (useClientRegex.test(content.trim()) && isSupportedClientModule(full, content)) {
            clientFiles.add(path.resolve(full));
          }
        } catch (e) {}
      }
    }
  }
  walk(srcDir);

  for (const f of [...candidateLinkPaths, ...candidateRedirectPaths]) {
    if (fs.existsSync(f)) clientFiles.add(path.resolve(f));
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(projectRoot, "package.json"), "utf8"));
    for (const dep of Object.keys(pkg.dependencies || {})) {
      if (dep === "react" || dep === "react-dom" || dep === "dinou") continue;
      const depDir = path.resolve(projectRoot, "node_modules", dep);
      if (fs.existsSync(depDir)) walk(depDir);
    }
  } catch (e) {}

  for (const k of Object.keys(parsedClientManifest)) {
    const fileUrl = k.split("#")[0];
    if (fileUrl.startsWith("file:///")) {
      try {
        const filePath = fileURLToPath(fileUrl);
        const norm = filePath.replace(/\\/g, "/");
        if (norm.includes("/out/") || norm.includes("/dist/") || norm.includes("/.dinou/")) continue;
        const base = path.basename(filePath);
        if (
          base === "client.jsx" ||
          base === "client-error.jsx" ||
          base === "client-webpack.jsx" ||
          base === "client-error-webpack.jsx" ||
          base.startsWith("react-refresh") ||
          base === "runtime.js" ||
          filePath.includes("react-refresh")
        ) continue;
        if (fs.existsSync(filePath) && isSupportedClientModule(filePath)) {
          clientFiles.add(path.resolve(filePath));
        }
      } catch (e) {}
    }
  }

  return Array.from(clientFiles);
}

// Manifest paths and helpers
function findManifest(filename, fallbackFolder) {
  const candidates = isWebpackBuild
    ? [
        path.resolve(projectRoot, ".dinou/public", filename),
        path.resolve(projectRoot, ".dinou", fallbackFolder, filename),
      ]
    : [
        path.resolve(projectRoot, ".dinou", fallbackFolder, filename),
        path.resolve(projectRoot, ".dinou/public", filename),
      ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function readJsonSafe(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    const text = fs.readFileSync(filePath, "utf8").trim();
    if (text.length > 2) return JSON.parse(text);
  } catch (e) {}
  return null;
}

let parsedClientManifest = {};
let parsedServerFunctionsManifest = {};
let parsedAssetManifest = {};
let clientComponents = [];
const knownClientFiles = new Set();
const knownServerFiles = new Set();

function updateManifestsState() {
  const cPath = findManifest("react-client-manifest.json", "react_client_manifest");
  const sfPath = findManifest("server-functions-manifest.json", "server_functions_manifest");
  const aPath = findManifest("manifest.json", "public");

  const rawClient = readJsonSafe(cPath);
  if (rawClient) {
    const cleanClient = {};
    for (const [k, v] of Object.entries(rawClient)) {
      const normK = k.replace(/\\/g, "/");
      const normId = (v?.id || "").replace(/\\/g, "/");
      if (
        normK.includes("/out/") ||
        normK.includes("/dist/") ||
        normK.includes("/.dinou/") ||
        normId.includes("/out/") ||
        normId.includes("/dist/") ||
        normId.includes("/.dinou/")
      ) {
        continue;
      }
      cleanClient[k] = v;
    }
    parsedClientManifest = cleanClient;
  }

  const rawSf = readJsonSafe(sfPath);
  if (rawSf) {
    parsedServerFunctionsManifest = rawSf;
  }

  const rawAsset = readJsonSafe(aPath);
  if (rawAsset) {
    parsedAssetManifest = rawAsset;
  }

  // Normalize client manifest
  const normalized = { ...parsedClientManifest };
  for (const [k, v] of Object.entries(parsedClientManifest)) {
    if (k.startsWith("file:///c:/")) {
      normalized["file:///C:/" + k.slice(11)] = v;
    } else if (k.startsWith("file:///C:/")) {
      normalized["file:///c:/" + k.slice(11)] = v;
    }
    const hashIdx = k.indexOf("#");
    if (hashIdx === -1) {
      const defKey = k + "#default";
      const defEntry = { ...v, name: "default" };
      normalized[defKey] = defEntry;
      if (k.startsWith("file:///c:/")) {
        normalized["file:///C:/" + k.slice(11) + "#default"] = defEntry;
      } else if (k.startsWith("file:///C:/")) {
        normalized["file:///c:/" + k.slice(11) + "#default"] = defEntry;
      }
    } else {
      const expName = k.slice(hashIdx + 1);
      const expEntry = { ...v, name: expName };
      normalized[k] = expEntry;
      const baseKey = k.slice(0, hashIdx);
      if (!normalized[baseKey]) normalized[baseKey] = v;
      if (baseKey.startsWith("file:///c:/")) {
        normalized["file:///C:/" + baseKey.slice(11)] = v;
        normalized["file:///C:/" + baseKey.slice(11) + "#" + expName] = expEntry;
      } else if (baseKey.startsWith("file:///C:/")) {
        normalized["file:///c:/" + baseKey.slice(11)] = v;
        normalized["file:///c:/" + baseKey.slice(11) + "#" + expName] = expEntry;
      }
    }
  }

  let linkChunkId = null;
  let redirectChunkId = null;
  let linkEntry = null;
  let redirectEntry = null;
  for (const [k, v] of Object.entries(parsedClientManifest)) {
    const norm = k.replace(/\\/g, "/");
    if (norm.includes("/out/") || norm.includes("/dist/") || norm.includes("/.dinou/")) continue;
    if (k.includes("/core/link.jsx") || k.includes("dinouLink")) {
      if (v?.id) { linkChunkId = v.id; linkEntry = v; }
    }
    if (k.includes("/core/client-redirect.jsx") || k.includes("dinouClientRedirect")) {
      if (v?.id) { redirectChunkId = v.id; redirectEntry = v; }
    }
  }

  if (linkChunkId) {
    const linkChunks = isWebpackBuild ? (linkEntry?.chunks || [linkChunkId]) : "Link";
    const linkDefaultChunks = isWebpackBuild ? (linkEntry?.chunks || [linkChunkId]) : "default";
    for (const lp of candidateLinkPaths) {
      for (const url of generateAllUrlVariants(lp)) {
        normalized[`${url}#Link`] = { id: linkChunkId, chunks: linkChunks, name: "Link" };
        normalized[`${url}#default`] = { id: linkChunkId, chunks: linkDefaultChunks, name: "default" };
        normalized[url] = { id: linkChunkId, chunks: linkDefaultChunks, name: "default" };
      }
    }
  }

  if (redirectChunkId) {
    const redirectChunks = isWebpackBuild ? (redirectEntry?.chunks || [redirectChunkId]) : "ClientRedirect";
    const redirectDefaultChunks = isWebpackBuild ? (redirectEntry?.chunks || [redirectChunkId]) : "default";
    for (const rp of candidateRedirectPaths) {
      for (const url of generateAllUrlVariants(rp)) {
        normalized[`${url}#ClientRedirect`] = { id: redirectChunkId, chunks: redirectChunks, name: "ClientRedirect" };
        normalized[`${url}#default`] = { id: redirectChunkId, chunks: redirectDefaultChunks, name: "default" };
        normalized[url] = { id: redirectChunkId, chunks: redirectDefaultChunks, name: "default" };
      }
    }
  }

  clientComponents = findClientComponents(parsedClientManifest);
  knownClientFiles.clear();
  for (const comp of clientComponents) {
    knownClientFiles.add(path.resolve(comp));
    const urlVariants = generateAllUrlVariants(comp);
    let fileExports = [];
    try {
      const content = fs.readFileSync(comp, "utf8");
      fileExports = parseExports(content);
    } catch (e) {}
    if (!fileExports.includes("default")) {
      fileExports.push("default");
    }

    // Check if parsedClientManifest already has an entry for this component
    let matchedEntry = null;
    for (const u of urlVariants) {
      if (parsedClientManifest[u]) { matchedEntry = parsedClientManifest[u]; break; }
      if (parsedClientManifest[`${u}#default`]) { matchedEntry = parsedClientManifest[`${u}#default`]; break; }
    }

    const compId = matchedEntry?.id || pathToFileURL(comp).href;
    const compChunks = matchedEntry?.chunks || [];

    for (const u of urlVariants) {
      if (!normalized[u]) {
        normalized[u] = { id: compId, chunks: compChunks, name: "*" };
      }
      for (const exp of fileExports) {
        const hashKey = `${u}#${exp}`;
        if (!normalized[hashKey] || normalized[hashKey].name === "*") {
          normalized[hashKey] = { id: compId, chunks: compChunks, name: exp };
        }
      }
    }
  }

  knownServerFiles.clear();
  for (const f of Object.keys(parsedServerFunctionsManifest)) {
    knownServerFiles.add(path.resolve(projectRoot, f));
  }

  if (Object.keys(normalized).length > 0) {
    globalThis.__DINOU_CLIENT_MANIFEST__ = normalized;
  }
  globalThis.__DINOU_SERVER_FUNCTIONS_MANIFEST__ = parsedServerFunctionsManifest;
  globalThis.__DINOU_ASSET_MANIFEST__ = parsedAssetManifest;

  // Import map generation for non-Webpack (esbuild / rollup)
  let importMapHtml = "";
  if (!isWebpackBuild && Object.keys(parsedClientManifest).length > 0) {
    const imports = {};
    const moduleBasePath = pathToFileURL(projectRoot).href + "/";
    for (const [key, val] of Object.entries(parsedClientManifest)) {
      let specifier = key;
      if (specifier.startsWith(moduleBasePath)) {
        specifier = specifier.slice(moduleBasePath.length);
      }
      const hashIdx = specifier.indexOf("#");
      if (hashIdx !== -1) specifier = specifier.slice(0, hashIdx);
      imports[specifier] = val.id;

      const srcIdx = key.indexOf("/src/");
      if (srcIdx !== -1) {
        const srcRel = "src/" + key.slice(srcIdx + 5).split("#")[0];
        imports[srcRel] = val.id;
        imports["/" + srcRel] = val.id;
        imports["./" + srcRel] = val.id;
      }
      const dinouIdx = key.lastIndexOf("/dinou/");
      if (dinouIdx !== -1) {
        const dinouRel = "dinou/" + key.slice(dinouIdx + 7).split("#")[0];
        imports[dinouRel] = val.id;
        imports["/" + dinouRel] = val.id;
        imports["./" + dinouRel] = val.id;
      }
    }
    if (linkChunkId) {
      imports["dinou/core/link.jsx"] = linkChunkId;
      imports["dinou/core/link"] = linkChunkId;
      imports["/dinou/core/link.jsx"] = linkChunkId;
      imports["./dinou/core/link.jsx"] = linkChunkId;
      for (const lp of candidateLinkPaths) {
        for (const u of generateAllUrlVariants(lp)) imports[u] = linkChunkId;
      }
    }
    if (redirectChunkId) {
      imports["dinou/core/client-redirect.jsx"] = redirectChunkId;
      imports["dinou/core/client-redirect"] = redirectChunkId;
      imports["/dinou/core/client-redirect.jsx"] = redirectChunkId;
      imports["./dinou/core/client-redirect.jsx"] = redirectChunkId;
      for (const rp of candidateRedirectPaths) {
        for (const u of generateAllUrlVariants(rp)) imports[u] = redirectChunkId;
      }
    }
    importMapHtml = `<script type="importmap">{"imports":${JSON.stringify(imports)}}</script>`;
  }
  globalThis.__DINOU_IMPORT_MAP_HTML__ = importMapHtml;

  return { linkChunkId, redirectChunkId };
}

// Initial manifest scan
const { linkChunkId, redirectChunkId } = updateManifestsState();

// Generate route modules and entry files
function generateEntryFiles() {
  const routeModulesCode = generateRouteModulesCode(projectRoot, "../..");
  fs.writeFileSync(path.join(devDir, "route-modules.mjs"), routeModulesCode, "utf8");

  const envSetupContent = `// Auto-generated Dev Environment Setup
if (typeof globalThis.__webpack_require__ === 'undefined') {
  globalThis.__webpack_require__ = function(id) {
    if (globalThis.__webpack_modules__ && globalThis.__webpack_modules__[id]) {
      return globalThis.__webpack_modules__[id];
    }
    return {};
  };
}
if (typeof globalThis.__webpack_require__.u === 'undefined') {
  globalThis.__webpack_require__.u = function(chunkId) { return '' + chunkId + '.js'; };
}
if (typeof globalThis.__webpack_chunk_load__ === 'undefined') {
  globalThis.__webpack_chunk_load__ = () => Promise.resolve();
}
`;
  fs.writeFileSync(path.join(devDir, "env-setup.mjs"), envSetupContent, "utf8");

  // SSR Client Manifest
  let ssrManifestCode = `// Auto-generated client modules registry for Dev SSR\n`;
  clientComponents.forEach((compPath, index) => {
    const normPath = compPath.replace(/\\/g, "/");
    ssrManifestCode += `import * as mod_${index} from ${JSON.stringify(normPath)};\n`;
  });

  const serverFunctionFiles = Object.keys(parsedServerFunctionsManifest);
  serverFunctionFiles.forEach((relPath, index) => {
    const absPath = path.resolve(projectRoot, relPath).replace(/\\/g, "/");
    ssrManifestCode += `import * as sf_${index} from ${JSON.stringify(absPath)};\n`;
  });

  ssrManifestCode += `\nexport const clientModules = {\n`;
  const emittedClientModules = new Set();
  function addClientModule(key, valueExpr) {
    if (!emittedClientModules.has(key)) {
      emittedClientModules.add(key);
      ssrManifestCode += `  ${JSON.stringify(key)}: ${valueExpr},\n`;
    }
  }

  clientComponents.forEach((compPath, index) => {
    const fileUrl = pathToFileURL(compPath).href;
    const altFileUrl = fileUrl.replace(/file:\/\/\/([a-zA-Z]):/, (m, d) => 'file:///' + (d === d.toLowerCase() ? d.toUpperCase() : d.toLowerCase()) + ':');
    addClientModule(fileUrl, `mod_${index}`);
    if (altFileUrl !== fileUrl) addClientModule(altFileUrl, `mod_${index}`);
  });

  for (const [k, v] of Object.entries(parsedClientManifest)) {
    const fileUrl = k.split("#")[0];
    const compIndex = clientComponents.findIndex(
      (c) => pathToFileURL(c).href === fileUrl || pathToFileURL(c).href.toLowerCase() === fileUrl.toLowerCase()
    );
    if (compIndex !== -1 && v?.id) {
      addClientModule(v.id, `mod_${compIndex}`);
    }
  }

  if (linkChunkId) {
    const linkCompIndex = clientComponents.findIndex((c) => candidateLinkPaths.has(path.resolve(c)));
    if (linkCompIndex !== -1) {
      addClientModule(linkChunkId, `mod_${linkCompIndex}`);
      for (const lp of candidateLinkPaths) {
        for (const u of generateAllUrlVariants(lp)) addClientModule(u, `mod_${linkCompIndex}`);
      }
    }
  }

  if (redirectChunkId) {
    const redirectCompIndex = clientComponents.findIndex((c) => candidateRedirectPaths.has(path.resolve(c)));
    if (redirectCompIndex !== -1) {
      addClientModule(redirectChunkId, `mod_${redirectCompIndex}`);
      for (const rp of candidateRedirectPaths) {
        for (const u of generateAllUrlVariants(rp)) addClientModule(u, `mod_${redirectCompIndex}`);
      }
    }
  }

  serverFunctionFiles.forEach((relPath, index) => {
    const normRel = relPath.replace(/\\/g, "/");
    const relFileUrl = "file:///" + normRel;
    const absPath = path.resolve(projectRoot, relPath);
    const fullFileUrl = pathToFileURL(absPath).href;
    const altFullFileUrl = fullFileUrl.replace(/file:\/\/\/([a-zA-Z]):/, (m, d) => 'file:///' + (d === d.toLowerCase() ? d.toUpperCase() : d.toLowerCase()) + ':');
    addClientModule(relFileUrl, `sf_${index}`);
    addClientModule(fullFileUrl, `sf_${index}`);
    if (altFullFileUrl !== fullFileUrl) addClientModule(altFullFileUrl, `sf_${index}`);
  });
  ssrManifestCode += `};\n\n`;

  ssrManifestCode += `export const ssrConsumerManifest = {\n  moduleMap: {\n`;
  const emittedModuleMap = new Set();
  function addModuleMap(key, valueObjStr) {
    if (!emittedModuleMap.has(key)) {
      emittedModuleMap.add(key);
      ssrManifestCode += `    ${JSON.stringify(key)}: ${valueObjStr},\n`;
    }
  }

  clientComponents.forEach((compPath) => {
    const fileUrl = pathToFileURL(compPath).href;
    const altFileUrl = fileUrl.replace(/file:\/\/\/([a-zA-Z]):/, (m, d) => 'file:///' + (d === d.toLowerCase() ? d.toUpperCase() : d.toLowerCase()) + ':');
    addModuleMap(fileUrl, `{ "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } }`);
    if (altFileUrl !== fileUrl) addModuleMap(altFileUrl, `{ "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } }`);
  });

  for (const [k, v] of Object.entries(parsedClientManifest)) {
    const fileUrl = k.split("#")[0];
    if (v?.id) {
      addModuleMap(v.id, `{ "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } }`);
    }
  }

  if (linkChunkId) {
    const linkCompIndex = clientComponents.findIndex((c) => candidateLinkPaths.has(path.resolve(c)));
    if (linkCompIndex !== -1) {
      const fileUrl = pathToFileURL(clientComponents[linkCompIndex]).href;
      addModuleMap(linkChunkId, `{ "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } }`);
      for (const lp of candidateLinkPaths) {
        for (const u of generateAllUrlVariants(lp)) addModuleMap(u, `{ "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } }`);
      }
    }
  }

  if (redirectChunkId) {
    const redirectCompIndex = clientComponents.findIndex((c) => candidateRedirectPaths.has(path.resolve(c)));
    if (redirectCompIndex !== -1) {
      const fileUrl = pathToFileURL(clientComponents[redirectCompIndex]).href;
      addModuleMap(redirectChunkId, `{ "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } }`);
      for (const rp of candidateRedirectPaths) {
        for (const u of generateAllUrlVariants(rp)) addModuleMap(u, `{ "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } }`);
      }
    }
  }
  ssrManifestCode += `  },\n  serverModuleMap: {\n`;

  const emittedServerModuleMap = new Set();
  function addServerModuleMap(key, valueObjStr) {
    if (!emittedServerModuleMap.has(key)) {
      emittedServerModuleMap.add(key);
      ssrManifestCode += `    ${JSON.stringify(key)}: ${valueObjStr},\n`;
    }
  }

  serverFunctionFiles.forEach((relPath) => {
    const normRel = relPath.replace(/\\/g, "/");
    const relFileUrl = "file:///" + normRel;
    const absPath = path.resolve(projectRoot, relPath);
    const fullFileUrl = pathToFileURL(absPath).href;
    const altFullFileUrl = fullFileUrl.replace(/file:\/\/\/([a-zA-Z]):/, (m, d) => 'file:///' + (d === d.toLowerCase() ? d.toUpperCase() : d.toLowerCase()) + ':');
    addServerModuleMap(relFileUrl, `{ id: ${JSON.stringify(relFileUrl)}, chunks: [], name: "*" }`);
    addServerModuleMap(fullFileUrl, `{ id: ${JSON.stringify(relFileUrl)}, chunks: [], name: "*" }`);
    if (altFullFileUrl !== fullFileUrl) addServerModuleMap(altFullFileUrl, `{ id: ${JSON.stringify(relFileUrl)}, chunks: [], name: "*" }`);

    const fns = parsedServerFunctionsManifest[relPath] || [];
    for (const fn of fns) {
      addServerModuleMap(relFileUrl + "#" + fn, `{ id: ${JSON.stringify(relFileUrl)}, chunks: [], name: ${JSON.stringify(fn)} }`);
      addServerModuleMap(fullFileUrl + "#" + fn, `{ id: ${JSON.stringify(relFileUrl)}, chunks: [], name: ${JSON.stringify(fn)} }`);
      if (altFullFileUrl !== fullFileUrl) addServerModuleMap(altFullFileUrl + "#" + fn, `{ id: ${JSON.stringify(relFileUrl)}, chunks: [], name: ${JSON.stringify(fn)} }`);
    }
  });
  ssrManifestCode += `  },\n  moduleLoading: null,\n};\n`;
  fs.writeFileSync(path.join(devDir, "ssr-client-manifest.mjs"), ssrManifestCode, "utf8");

  // RSC Engine Entry
  const rscEntryContent = `// Auto-generated RSC Engine entry for Dev (Dual-Bundle)
import "./env-setup.mjs";
import "./route-modules.mjs";
export { handleRequest } from "${dinouDirSlash}/core/handler.js";
`;
  fs.writeFileSync(path.join(devDir, "rsc-entry.mjs"), rscEntryContent, "utf8");

  // SSR Engine Entry
  const ssrEntryContent = `// Auto-generated SSR Engine entry for Dev (Dual-Bundle)
import { renderRscStreamToHtmlStream } from "${dinouDirSlash}/core/edge-ssr.js";
import { clientModules, ssrConsumerManifest } from "./ssr-client-manifest.mjs";

const wrapModule = (mod) => {
  if (!mod || typeof mod !== "object") return mod;
  if (mod.__esModule) return mod;
  return new Proxy(mod, {
    get(target, prop, receiver) {
      if (prop === "__esModule") return true;
      return Reflect.get(target, prop, receiver);
    }
  });
};

globalThis.__webpack_require__ = (id) => {
  let mod = clientModules[id];
  if (!mod) {
    const alt = id.startsWith("file:///c:/")
      ? id.replace("file:///c:/", "file:///C:/")
      : id.startsWith("file:///C:/")
      ? id.replace("file:///C:/", "file:///c:/")
      : id;
    mod = clientModules[alt];
  }
  if (mod) return wrapModule(mod);
  console.error("[SSR Engine Dev] Module not found in __webpack_require__:", id);
  return {};
};
globalThis.__webpack_require__.u = (chunkId) => "" + chunkId + ".js";
globalThis.__webpack_chunk_load__ = () => Promise.resolve();

export async function renderHtml(rscStream, options = {}) {
  return renderRscStreamToHtmlStream(rscStream, ssrConsumerManifest, options);
}
`;
  fs.writeFileSync(path.join(devDir, "ssr-entry.mjs"), ssrEntryContent, "utf8");
}

generateEntryFiles();

// Exports Cache for fast parsing
const exportsCache = new Map();
function getCachedExports(filePath, code) {
  let entry = exportsCache.get(filePath);
  if (!entry || entry.code !== code) {
    entry = { code, exports: parseExports(code) };
    exportsCache.set(filePath, entry);
  }
  return entry.exports;
}

// Plugins
const clientReferencesPlugin = {
  name: "dinou-client-references",
  setup(build) {
    build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
      if (args.path.includes("node_modules")) {
        if (
          args.path.includes("react-server-dom") ||
          args.path.includes("@roggc/react-server-dom-esm") ||
          args.path.includes("node_modules/react/") ||
          args.path.includes("node_modules\\react\\") ||
          args.path.includes("node_modules/react-dom/") ||
          args.path.includes("node_modules\\react-dom\\")
        ) {
          return null;
        }
      }
      const normalizedPath = args.path.replace(/\\/g, "/");
      if (normalizedPath.includes("dinou/core/navigation")) return null;

      let code;
      try { code = fs.readFileSync(args.path, "utf8"); } catch (e) { return null; }
      if (!isSupportedClientModule(args.path, code)) return null;
      if (!useClientRegex.test(code.trim())) return null;

      const exports = getCachedExports(args.path, code);
      const absPath = path.resolve(args.path);
      const fileUrl = pathToFileURL(absPath).href;

      let proxyCode = `import { createClientModuleProxy } from "react-server-dom-webpack/server.edge";\n`;
      proxyCode += `const proxy = createClientModuleProxy(${JSON.stringify(fileUrl)});\n`;
      for (const name of exports) {
        if (name === "default") {
          proxyCode += `export default proxy.default;\n`;
        } else {
          proxyCode += `export const ${name} = proxy[${JSON.stringify(name)}];\n`;
        }
      }
      if (!exports.includes("default")) {
        proxyCode += `export default proxy.default;\n`;
      }
      return { contents: proxyCode, loader: "js" };
    });
  },
};

const serverReferencesPlugin = {
  name: "dinou-server-references",
  setup(build) {
    build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
      if (args.path.includes("node_modules")) return null;
      let code;
      try { code = fs.readFileSync(args.path, "utf8"); } catch (e) { return null; }
      if (!useServerRegex.test(code.trim())) return null;

      const exports = getCachedExports(args.path, code);
      const absPath = path.resolve(args.path);
      const relPath = path.relative(projectRoot, absPath).replace(/\\/g, "/");
      const relativeFileUrl = "file:///" + relPath;

      let transformed = code + "\n\n";
      transformed += `import { registerServerReference } from "react-server-dom-webpack/server.edge";\n`;
      for (const name of exports) {
        if (name !== "default") {
          transformed += `registerServerReference(${name}, ${JSON.stringify(relativeFileUrl)}, ${JSON.stringify(name)});\n`;
        }
      }
      const ext = path.extname(args.path);
      return { contents: transformed, loader: ext === ".ts" ? "ts" : ext === ".tsx" ? "tsx" : ext === ".jsx" ? "jsx" : "js" };
    });
  },
};

const serverReferencesPluginSsr = {
  name: "dinou-server-references-ssr",
  setup(build) {
    build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
      if (args.path.includes("node_modules")) return null;
      let code;
      try { code = fs.readFileSync(args.path, "utf8"); } catch (e) { return null; }
      if (!useServerRegex.test(code.trim())) return null;

      const exports = getCachedExports(args.path, code);
      const absPath = path.resolve(args.path);
      const relPath = path.relative(projectRoot, absPath).replace(/\\/g, "/");
      const relativeFileUrl = "file:///" + relPath;

      let transformed = code + "\n\n";
      transformed += `import { registerServerReference } from "react-server-dom-webpack/client.edge";\n`;
      for (const name of exports) {
        if (name !== "default") {
          transformed += `registerServerReference(${name}, ${JSON.stringify(relativeFileUrl + "#" + name)});\n`;
          transformed += `registerServerReference(${name}, ${JSON.stringify(pathToFileURL(absPath).href + "#" + name)});\n`;
        }
      }
      const ext = path.extname(args.path);
      return { contents: transformed, loader: ext === ".ts" ? "ts" : ext === ".tsx" ? "tsx" : ext === ".jsx" ? "jsx" : "js" };
    });
  },
};

const nodeBuiltins = [
  "assert", "async_hooks", "buffer", "child_process", "cluster", "console",
  "constants", "crypto", "dgram", "diagnostics_channel", "dns", "domain",
  "events", "fs", "fs/promises", "http", "http2", "https", "inspector",
  "module", "net", "os", "path", "path/posix", "path/win32", "perf_hooks",
  "process", "punycode", "querystring", "readline", "repl", "stream",
  "stream/consumers", "stream/promises", "stream/web", "string_decoder",
  "timers", "timers/promises", "tls", "trace_events", "tty", "url",
  "util", "util/types", "v8", "vm", "wasi", "worker_threads", "zlib"
];
const externalList = [...nodeBuiltins, ...nodeBuiltins.map((b) => "node:" + b)];

const commonAlias = {
  "@": path.resolve(projectRoot, "src"),
  dinou: dinouDir,
};
const commonLoader = {
  ".js": "jsx", ".jsx": "jsx", ".ts": "ts", ".tsx": "tsx",
  ".json": "json", ".css": "empty",
};

const serverAssetPlugin = {
  name: "dinou-server-asset-plugin",
  setup(build) {
    build.onResolve({ filter: assetRegex }, (args) => {
      let resolvedPath;
      if (args.path.startsWith("@/")) {
        resolvedPath = path.resolve(projectRoot, "src", args.path.slice(2));
      } else if (path.isAbsolute(args.path)) {
        resolvedPath = args.path;
      } else {
        resolvedPath = path.resolve(args.resolveDir, args.path);
      }
      return { path: resolvedPath, namespace: "dinou-server-asset" };
    });

    build.onLoad({ filter: /.*/, namespace: "dinou-server-asset" }, (args) => {
      const ext = path.extname(args.path);
      const base = path.basename(args.path, ext);
      const scoped = createScopedName(base, args.path);
      const assetUrl = `/assets/${scoped}${ext}`;

      try {
        const outAssetDir = path.resolve(projectRoot, ".dinou/public/assets");
        const outAssetPath = path.join(outAssetDir, `${scoped}${ext}`);
        if (!fs.existsSync(outAssetPath)) {
          fs.mkdirSync(outAssetDir, { recursive: true });
          fs.copyFileSync(args.path, outAssetPath);
        }
      } catch (e) {}

      return {
        contents: `export default ${JSON.stringify(assetUrl)};`,
        loader: "js",
      };
    });
  },
};

const banner = {
  js: `import { createRequire as ___createRequire } from 'node:module';
import { AsyncLocalStorage as ___AsyncLocalStorage } from 'node:async_hooks';
const require = ___createRequire(import.meta.url || 'file:///server.js');
const __dirname = '';
const __filename = '';
globalThis.__dinou_require__ = require;
globalThis.__DINOU_DEV__ = true;
if (typeof globalThis.AsyncLocalStorage === 'undefined' && typeof ___AsyncLocalStorage !== 'undefined') {
  globalThis.AsyncLocalStorage = ___AsyncLocalStorage;
}
if (typeof globalThis.__webpack_require__ === 'undefined') {
  globalThis.__webpack_require__ = function(id) {
    if (globalThis.__webpack_modules__ && globalThis.__webpack_modules__[id]) {
      return globalThis.__webpack_modules__[id];
    }
    return {};
  };
}
if (typeof globalThis.__webpack_require__.u === 'undefined') {
  globalThis.__webpack_require__.u = function(chunkId) { return '' + chunkId + '.js'; };
}
if (typeof globalThis.__webpack_chunk_load__ === 'undefined') {
  globalThis.__webpack_chunk_load__ = () => Promise.resolve();
}
var __webpack_require__ = function(id) {
  return globalThis.__webpack_require__ ? globalThis.__webpack_require__(id) : {};
};
__webpack_require__.u = function(chunkId) {
  return (globalThis.__webpack_require__ && globalThis.__webpack_require__.u)
    ? globalThis.__webpack_require__.u(chunkId)
    : '' + chunkId + '.js';
};
var __webpack_chunk_load__ = function(chunkId) {
  return globalThis.__webpack_chunk_load__ ? globalThis.__webpack_chunk_load__(chunkId) : Promise.resolve();
};
`,
};

// Create esbuild contexts
console.log("⚡ [Dinou Dev] Initializing Incremental Dual-Bundle Engine (No fork)...");
const rscOutfile = path.join(devDir, "rsc-engine.mjs");
const ssrOutfile = path.join(devDir, "ssr-engine.mjs");

const ctxA = await esbuild.context({
  entryPoints: [path.join(devDir, "rsc-entry.mjs")],
  outfile: rscOutfile,
  bundle: true,
  format: "esm",
  target: "node20",
  platform: "node",
  mainFields: ["module", "main"],
  conditions: ["node", "worker", "react-server"],
  external: externalList,
  banner,
  plugins: [clientReferencesPlugin, serverReferencesPlugin, serverAssetPlugin],
  alias: commonAlias,
  loader: commonLoader,
  jsx: "automatic",
  define: {
    "process.env.NODE_ENV": '"development"',
    "process.env.DINOU_DEV": '"true"',
    "process.env.DINOU_RUNTIME": '"node-bundle"',
    "process.env.DINOU_BUILD_TOOL": JSON.stringify(isWebpackBuild ? "webpack" : (process.env.DINOU_BUILD_TOOL || "esbuild")),
  },
  logLevel: "warning",
});

const ctxB = await esbuild.context({
  entryPoints: [path.join(devDir, "ssr-entry.mjs")],
  outfile: ssrOutfile,
  bundle: true,
  format: "esm",
  target: "node20",
  platform: "node",
  mainFields: ["module", "main"],
  conditions: ["node", "worker", "browser"],
  external: externalList,
  banner,
  plugins: [serverReferencesPluginSsr, serverAssetPlugin],
  alias: commonAlias,
  loader: commonLoader,
  jsx: "automatic",
  define: {
    "process.env.NODE_ENV": '"development"',
    "process.env.DINOU_DEV": '"true"',
    "process.env.DINOU_RUNTIME": '"node-bundle"',
    "process.env.DINOU_BUILD_TOOL": JSON.stringify(isWebpackBuild ? "webpack" : (process.env.DINOU_BUILD_TOOL || "esbuild")),
  },
  logLevel: "warning",
});

let rscModule = null;
let ssrModule = null;
let engineVersion = 1;
let activeRebuildPromise = null;

async function doInitialBuild() {
  const t0 = Date.now();
  await Promise.all([ctxA.rebuild(), ctxB.rebuild()]);
  const v = "?v=" + engineVersion;
  rscModule = await dynamicImportWithRetry(pathToFileURL(rscOutfile).href + v);
  ssrModule = await dynamicImportWithRetry(pathToFileURL(ssrOutfile).href + v);
  console.log(`✅ [Dinou Dev] Initial build completed in ${Date.now() - t0}ms`);
}

await doInitialBuild();

// Client bundler handle & broadcast helper
let clientBundlerHandle = null;
let clientBundlerPromise = null;

async function broadcastToClients(msg) {
  try {
    const handle = clientBundlerHandle || (await clientBundlerPromise);
    handle?.broadcast?.(msg);
  } catch (e) {}
}

// Trigger an incremental rebuild
async function triggerRebuild(filePath = "", eventType = "change") {
  if (activeRebuildPromise) {
    try { await activeRebuildPromise; } catch (e) {}
  }

  activeRebuildPromise = (async () => {
    const t0 = Date.now();
    try {
      const isStructureChange = eventType === "add" || eventType === "unlink";
      const absFilePath = filePath ? path.resolve(filePath) : "";
      const isCssFile = absFilePath.endsWith(".css") || absFilePath.endsWith(".scss");
      let isClientFile = false;
      let isServerFile = false;

      if (absFilePath && fs.existsSync(absFilePath)) {
        try {
          const content = fs.readFileSync(absFilePath, "utf8");
          isClientFile = useClientRegex.test(content.trim());
          isServerFile = useServerRegex.test(content.trim());
        } catch (e) {}
      }

      const wasClientFile = absFilePath ? knownClientFiles.has(absFilePath) : false;
      const clientDirectiveChanged = isClientFile !== wasClientFile;

      const wasServerFile = absFilePath ? knownServerFiles.has(absFilePath) : false;
      const serverDirectiveChanged = isServerFile !== wasServerFile;

      const needsStructureRebuild = isStructureChange || clientDirectiveChanged || serverDirectiveChanged;

      if (needsStructureRebuild) {
        updateManifestsState();
        generateEntryFiles();
        await Promise.all([ctxA.rebuild(), ctxB.rebuild()]);
      } else if (isClientFile) {
        await Promise.all([ctxA.rebuild(), ctxB.rebuild()]);
      } else {
        await ctxA.rebuild();
      }

      engineVersion = Date.now();
      const v = "?v=" + engineVersion;
      rscModule = await dynamicImportWithRetry(pathToFileURL(rscOutfile).href + v);
      if (needsStructureRebuild || isClientFile) {
        ssrModule = await dynamicImportWithRetry(pathToFileURL(ssrOutfile).href + v);
      }
      console.log(`⚡ [Dinou Dev] Rebuild finished in ${Date.now() - t0}ms (${eventType} ${path.basename(filePath) || "source"})`);
      if (!isClientFile && !isCssFile) {
        await broadcastToClients({ type: "reload" });
      }
    } catch (err) {
      console.error("❌ [Dinou Dev] Rebuild error:", err);
    } finally {
      activeRebuildPromise = null;
    }
  })();

  return activeRebuildPromise;
}

// Watch src/ with chokidar
let srcDebounce = null;
let pendingSrcPath = "";
let pendingSrcEvent = "";

const srcWatcher = chokidar.watch(srcDir, {
  ignoreInitial: true,
  ignored: [/node_modules/, /\.git/],
});

srcWatcher.on("all", (event, fullPath) => {
  pendingSrcPath = fullPath;
  pendingSrcEvent = event;
  if (srcDebounce) clearTimeout(srcDebounce);
  srcDebounce = setTimeout(() => {
    srcDebounce = null;
    triggerRebuild(fullPath, event);
  }, 40);
});

// Watch manifest folder for client bundler output
const manifestFolder = isWebpackBuild
  ? path.resolve(projectRoot, ".dinou/public")
  : path.resolve(projectRoot, ".dinou/react_client_manifest");

let clientManifestReady = false;

function checkClientFilesPresent() {
  const cPath = findManifest("react-client-manifest.json", "react_client_manifest");
  if (!readJsonSafe(cPath)) return false;
  if (isWebpackBuild) {
    const mPath = path.resolve(projectRoot, ".dinou/public/manifest.json");
    return fs.existsSync(mPath);
  }
  const mainPath = path.resolve(projectRoot, ".dinou/public/main.js");
  return fs.existsSync(mainPath);
}

// Initial readiness check
if (checkClientFilesPresent()) {
  clientManifestReady = true;
}

let manifestSyncPromise = null;

let lastManifestSyncTime = 0;

async function onManifestUpdated() {
  const now = Date.now();
  if (now - lastManifestSyncTime < 150) {
    return manifestSyncPromise;
  }
  lastManifestSyncTime = now;

  if (manifestSyncPromise) {
    try { await manifestSyncPromise; } catch (e) {}
  }

  manifestSyncPromise = (async () => {
    try {
      console.log("⚡ [Dinou Dev] Client manifest change detected. Synchronizing Dual-Bundle engine...");
      updateManifestsState();
      generateEntryFiles();
      await Promise.all([ctxA.rebuild(), ctxB.rebuild()]);
      engineVersion = Date.now();
      const v = "?v=" + engineVersion;
      rscModule = await dynamicImportWithRetry(pathToFileURL(rscOutfile).href + v);
      ssrModule = await dynamicImportWithRetry(pathToFileURL(ssrOutfile).href + v);
      clientManifestReady = true;
      console.log("✅ [Dinou Dev] Dual-Bundle engine successfully synchronized with client build!");
    } catch (err) {
      console.error("❌ [Dinou Dev] Error synchronizing with client manifest:", err);
    } finally {
      manifestSyncPromise = null;
    }
  })();

  return manifestSyncPromise;
}

let manifestDebounce = null;
const dotDinouDir = path.resolve(projectRoot, ".dinou");
if (!fs.existsSync(dotDinouDir)) {
  fs.mkdirSync(dotDinouDir, { recursive: true });
}
const manifestWatcher = chokidar.watch(dotDinouDir, {
  ignoreInitial: true,
  ignored: [/node_modules/, /[\\/]\.dinou[\\/](public|dist|dist2|node-dev|dev-)/],
  depth: 3,
});

manifestWatcher.on("all", (event, fullPath) => {
  if (isWebpackBuild) {
    // In Webpack mode, compiler.hooks.done handles manifest synchronization cleanly
    return;
  }
  if (
    fullPath.endsWith("react-client-manifest.json") ||
    fullPath.endsWith("server-functions-manifest.json") ||
    fullPath.endsWith("manifest.json")
  ) {
    if (manifestDebounce) clearTimeout(manifestDebounce);
    manifestDebounce = setTimeout(() => {
      manifestDebounce = null;
      onManifestUpdated();
    }, 40);
  }
});

const MIME_TYPES = {
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const candidateStaticDirs = [
  path.resolve(projectRoot, ".dinou/public"),
  path.resolve(projectRoot, "public"),
];

function isManifestReady() {
  return clientManifestReady && !manifestSyncPromise && checkClientFilesPresent();
}

async function startClientBundler(tool) {
  const normTool = (tool || "esbuild").toLowerCase();
  console.log(`📦 [Dinou Dev] Starting in-process client bundler (${normTool})...`);

  if (normTool === "esbuild") {
    const { startEsbuildDev } = await import(
      pathToFileURL(path.resolve(dinouDir, "esbuild/dev.mjs")).href
    );
    return await startEsbuildDev({
      onRebuilt: () => onManifestUpdated(),
    });
  }

  if (normTool === "rollup") {
    const { watch } = require("rollup");
    const getRollupConfig = require(path.resolve(dinouDir, "rollup/rollup.config.js"));
    const { getHmrEngine } = require(path.resolve(dinouDir, "rollup/react-refresh/rollup-plugin-esm-hmr.js"));
    const rollupConfig = await getRollupConfig();
    const watcher = watch(rollupConfig);

    return new Promise((resolve) => {
      let initialResolved = false;
      watcher.on("event", (event) => {
        if (event.code === "BUNDLE_START") {
          console.log("⚡ [Rollup Dev] Bundling client...");
        } else if (event.code === "BUNDLE_END") {
          console.log(`✓ [Rollup Dev] Client bundle completed in ${event.duration}ms`);
          if (!initialResolved) {
            onManifestUpdated();
            initialResolved = true;
            resolve({
              broadcast: (msg) => {
                getHmrEngine()?.broadcastMessage?.(msg);
              },
              close: async () => {
                try {
                  await watcher.close();
                } catch (e) {}
              },
            });
          }
        } else if (event.code === "ERROR") {
          console.error("❌ [Rollup Dev Error]:", event.error);
          if (!initialResolved) {
            initialResolved = true;
            resolve({
              broadcast: (msg) => {
                getHmrEngine()?.broadcastMessage?.(msg);
              },
              close: async () => {
                try {
                  await watcher.close();
                } catch (e) {}
              },
            });
          }
        }
      });
    });
  }

  if (normTool === "webpack") {
    const webpack = require("webpack");
    const WebpackDevServer = require("webpack-dev-server");
    const getWebpackConfig = require(path.resolve(dinouDir, "webpack/webpack.config.js"));
    const webpackConfig = await getWebpackConfig();
    const compiler = webpack(webpackConfig);

    return new Promise((resolve, reject) => {
      let initialResolved = false;
      let devServer = null;

      compiler.hooks.done.tap("DinouClientSync", (stats) => {
        onManifestUpdated();
        if (!initialResolved) {
          initialResolved = true;
          resolve({
            close: async () => {
              if (devServer) {
                try {
                  await devServer.stop();
                } catch (e) {}
              }
            },
          });
        }
      });

      devServer = new WebpackDevServer(webpackConfig.devServer, compiler);
      devServer.start().catch((err) => {
        console.error("❌ [Webpack Dev Server Error]:", err);
        if (!initialResolved) {
          initialResolved = true;
          reject(err);
        }
      });
    });
  }

  throw new Error(`Unsupported DINOU_BUILD_TOOL: ${tool}`);
}

// HTTP Server
const PORT = Number(process.env.PORT || 3000);

const server = http.createServer(async (req, res) => {
  try {
    if (clientBundlerPromise) {
      await clientBundlerPromise;
    }
    if (activeRebuildPromise) {
      await activeRebuildPromise;
    }
    if (srcDebounce) {
      clearTimeout(srcDebounce);
      srcDebounce = null;
      await triggerRebuild(pendingSrcPath, pendingSrcEvent);
    }
    if (activeRebuildPromise) {
      await activeRebuildPromise;
    }
    if (manifestDebounce) {
      clearTimeout(manifestDebounce);
      manifestDebounce = null;
      await onManifestUpdated();
    }
    if (manifestSyncPromise) {
      await manifestSyncPromise;
    }

    const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const fullUrl = new URL(req.url, `${protocol}://${host}`);
    const pathname = fullUrl.pathname;

    // 1. Playwright readiness check
    if (pathname === "/__DINOU_STATUS_PLAYWRIGHT__") {
      if (!clientManifestReady && checkClientFilesPresent()) {
        await onManifestUpdated();
      }
      const ready = isManifestReady();
      res.statusCode = 200;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({
        status: "ok",
        isReady: ready,
        mode: "development",
      }));
      return;
    }

    // 2. Static files delivery from .dinou/public or public/
    if (pathname !== "/") {
      const cleanPath = pathname.startsWith("/") ? pathname.slice(1) : pathname;
      const mappedPath = (parsedAssetManifest && parsedAssetManifest[cleanPath]) || cleanPath;
      const ext = path.extname(cleanPath).toLowerCase();

      let foundFilePath = null;
      for (const baseDir of candidateStaticDirs) {
        for (const targetName of [mappedPath, cleanPath]) {
          const filePath = path.join(baseDir, targetName);
          if (fs.existsSync(filePath)) {
            try {
              if (fs.statSync(filePath).isFile()) {
                foundFilePath = filePath;
                break;
              }
            } catch (e) {}
          }
        }
        if (foundFilePath) break;
      }

      // If it's a client bundle file that is currently being written or created by the bundler
      const isClientBundleFile =
        cleanPath.endsWith(".js") ||
        cleanPath.endsWith(".mjs") ||
        cleanPath.endsWith(".css") ||
        cleanPath.endsWith(".map") ||
        cleanPath.startsWith("assets/");
      if (!foundFilePath && isClientBundleFile) {
        for (let attempt = 0; attempt < 20; attempt++) {
          await new Promise((r) => setTimeout(r, 25));
          for (const baseDir of candidateStaticDirs) {
            for (const targetName of [mappedPath, cleanPath]) {
              const filePath = path.join(baseDir, targetName);
              if (fs.existsSync(filePath)) {
                try {
                  if (fs.statSync(filePath).isFile()) {
                    foundFilePath = filePath;
                    break;
                  }
                } catch (e) {}
              }
            }
            if (foundFilePath) break;
          }
          if (foundFilePath) break;
        }

        if (!foundFilePath) {
          res.statusCode = 404;
          res.setHeader("content-type", "text/plain; charset=utf-8");
          res.end("Not Found");
          return;
        }
      }

      if (foundFilePath) {
        try {
          const fileExt = path.extname(foundFilePath).toLowerCase();
          const contentType = MIME_TYPES[fileExt] || "application/octet-stream";

          // Safely read buffer into memory, retrying briefly if the bundler currently has it truncated or locked
          let buf = null;
          for (let attempt = 0; attempt < 10; attempt++) {
            try {
              buf = fs.readFileSync(foundFilePath);
              if (buf.length > 0 || (!fileExt.endsWith(".js") && !fileExt.endsWith(".css"))) {
                break;
              }
            } catch (readErr) {
              // File might be momentarily locked on Windows during write
            }
            await new Promise((r) => setTimeout(r, 25));
          }

          if (buf !== null) {
            res.statusCode = 200;
            res.setHeader("content-type", contentType);
            res.setHeader("content-length", String(buf.length));
            res.setHeader("cache-control", "no-store, no-cache, must-revalidate");
            res.end(buf);
            return;
          }
        } catch (e) {}
      }
    }

    // 3. Dynamic RSC + Native SSR Streaming
    const webReq = nodeToWebRequest(req);
    const webRes = await rscModule.handleRequest(webReq, {
      runtime: "node-bundle",
      renderHtmlStream: ssrModule.renderHtml,
    });

    if (webRes.status === 404) {
      console.log(`[DEV 404] ${req.method} ${pathname}`);
    }

    await sendWebResponseToNode(webRes, res);
  } catch (err) {
    console.error("[Dinou Dev Server] Request error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "text/plain; charset=utf-8");
      res.end("Internal Server Error: " + (err?.message || String(err)));
    }
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ FATAL ERROR: Port ${PORT} is already in use!`);
  } else {
    console.error("❌ [Dinou Dev Server Error]:", err);
  }
  process.exit(1);
});

server.listen(PORT, async () => {
  console.log(`\n🚀 Dinou Development Server (Dual-Bundle, 0 fork) ready on http://localhost:${PORT}`);
  console.log(`   Tool: ${isWebpackBuild ? "Webpack" : (process.env.DINOU_BUILD_TOOL || "esbuild")}`);
  console.log(`   Mode: Development`);
  if (isWebpackBuild) {
    console.log(`   Webpack Dev Server proxy: http://localhost:3001`);
  }

  if (process.env.DINOU_STANDALONE_SERVER !== "true") {
    const buildTool = process.env.DINOU_BUILD_TOOL || "esbuild";
    try {
      clientBundlerPromise = startClientBundler(buildTool);
      clientBundlerHandle = await clientBundlerPromise;
    } catch (err) {
      console.error("❌ [Dinou Dev] Failed to start client bundler:", err);
    } finally {
      clientBundlerPromise = null;
    }
  }
});

// Clean exit on termination
let isCleaningUp = false;
async function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  try {
    srcWatcher.close();
    manifestWatcher.close();
    if (clientBundlerHandle?.close) {
      await clientBundlerHandle.close();
    }
    server.close();
    await ctxA.dispose();
    await ctxB.dispose();
  } catch (e) {}
  process.exit(0);
}
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
