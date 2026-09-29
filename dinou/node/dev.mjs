// dinou/node/dev.mjs
// Incremental Dual-Bundle Development Server for Dinou.
// Eliminates child_process.fork() by compiling Pass A (RSC) and Pass B (SSR)
// using esbuild.context() in memory, running a single unified streaming process.

process.env.DINOU_DEV = "true";
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Readable } from "node:stream";
import {
  startSpinner,
  updateSpinner,
  stopSpinner,
  logSuccess,
  logInfo,
  showIdleStatus,
  printReadyBanner,
} from "./terminal-status.mjs";
import { resolveDevPorts } from "./port-selector.mjs";

// Resolve dev HTTP and HMR ports before initiating background compilation
const { port: PORT, hmrPort: HMR_PORT } = await resolveDevPorts();

const devStartTime = Date.now();
const devTimings = {};
startSpinner("Initializing Incremental Dual-Bundle Engine (No fork)...");

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
const {
  isSupportedClientModule,
  scanProjectDependenciesForClientComponents,
  scanProjectDependenciesForClientComponentsAsync,
} = require(path.join(dinouDir, "core/scan-dependency-components.js"));

const yieldToEventLoop = () => new Promise((resolve) => setImmediate(resolve));

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


async function findClientComponents(parsedClientManifest = {}) {
  const clientFiles = new Set();
  async function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (/\.[jt]sx?$/.test(entry.name)) {
        try {
          const content = fs.readFileSync(full, "utf8");
          if (useClientRegex.test(content.trim()) && isSupportedClientModule(full, content)) {
            clientFiles.add(path.resolve(full));
          }
        } catch (e) {}
      }
    }
    await yieldToEventLoop();
  }
  await walk(srcDir);

  for (const f of [...candidateLinkPaths, ...candidateRedirectPaths]) {
    if (fs.existsSync(f)) clientFiles.add(path.resolve(f));
  }

  if (typeof scanProjectDependenciesForClientComponentsAsync === "function") {
    await scanProjectDependenciesForClientComponentsAsync(projectRoot, clientFiles, useClientRegex);
  } else {
    scanProjectDependenciesForClientComponents(projectRoot, clientFiles, useClientRegex);
  }
  await yieldToEventLoop();

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
let linkChunkId = null;
let redirectChunkId = null;
const knownClientFiles = new Set();
const knownServerFiles = new Set();
const compExportsCache = new Map();

function getCachedFileExports(filePath) {
  try {
    const stat = fs.statSync(filePath);
    const cached = compExportsCache.get(filePath);
    if (cached && cached.mtime === stat.mtimeMs) {
      return cached.exports;
    }
    const content = fs.readFileSync(filePath, "utf8");
    const exports = parseExports(content);
    if (!exports.includes("default")) {
      exports.push("default");
    }
    compExportsCache.set(filePath, { mtime: stat.mtimeMs, exports });
    return exports;
  } catch (e) {
    return ["default"];
  }
}

async function updateManifestsState(options = {}) {
  const forceRescan = options.forceRescan || false;
  const cPath = findManifest("react-client-manifest.json", "react_client_manifest");
  const sfPath = findManifest("server-functions-manifest.json", "server_functions_manifest");
  const aPath = findManifest("manifest.json", "public");

  const rawClient = globalThis.__DINOU_RAW_CLIENT_MANIFEST__ || readJsonSafe(cPath);
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

  const rawSf = globalThis.__DINOU_RAW_SERVER_FUNCTIONS_MANIFEST__ || readJsonSafe(sfPath);
  if (rawSf) {
    parsedServerFunctionsManifest = rawSf;
  }

  const rawAsset = globalThis.__DINOU_RAW_ASSET_MANIFEST__ || readJsonSafe(aPath);
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

  let resolvedLinkChunkId = null;
  let resolvedRedirectChunkId = null;
  let linkEntry = null;
  let redirectEntry = null;
  for (const [k, v] of Object.entries(parsedClientManifest)) {
    const norm = k.replace(/\\/g, "/");
    if (norm.includes("/out/") || norm.includes("/dist/") || norm.includes("/.dinou/")) continue;
    if (k.includes("/core/link.jsx") || k.includes("dinouLink")) {
      if (v?.id) { resolvedLinkChunkId = v.id; linkEntry = v; }
    }
    if (k.includes("/core/client-redirect.jsx") || k.includes("dinouClientRedirect")) {
      if (v?.id) { resolvedRedirectChunkId = v.id; redirectEntry = v; }
    }
  }
  linkChunkId = resolvedLinkChunkId;
  redirectChunkId = resolvedRedirectChunkId;

  if (!isWebpackBuild) {
    if (!redirectChunkId || redirectChunkId.includes("node_modules")) {
      redirectChunkId = "/dinouClientRedirect.js";
    }
    if (!linkChunkId || linkChunkId.includes("node_modules")) {
      linkChunkId = "/dinouLink.js";
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

  // Detect if parsedClientManifest introduces any brand new client components not in knownClientFiles
  let hasNewClientFiles = false;
  if (!forceRescan && clientComponents.length > 0) {
    for (const k of Object.keys(parsedClientManifest)) {
      const fileUrl = k.split("#")[0];
      if (fileUrl.startsWith("file:///")) {
        try {
          const fp = fileURLToPath(fileUrl);
          if (!knownClientFiles.has(path.resolve(fp)) && fs.existsSync(fp)) {
            hasNewClientFiles = true;
            break;
          }
        } catch (e) {}
      }
    }
  }

  let componentsChanged = false;
  if (forceRescan || clientComponents.length === 0 || hasNewClientFiles) {
    const prevSet = new Set(clientComponents.map((c) => path.resolve(c)));
    clientComponents = await findClientComponents(parsedClientManifest);
    knownClientFiles.clear();
    let compScanIdx = 0;
    for (const comp of clientComponents) {
      const resolved = path.resolve(comp);
      knownClientFiles.add(resolved);
      if (!prevSet.has(resolved)) {
        componentsChanged = true;
      }
      const urlVariants = generateAllUrlVariants(comp);
      const fileExports = getCachedFileExports(comp);

      if (++compScanIdx % 5 === 0) {
        await yieldToEventLoop();
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
    if (prevSet.size !== clientComponents.length) {
      componentsChanged = true;
    }
  } else {
    // Fast path: update normalized mapping for known client components without re-reading files or parsing AST
    for (const comp of clientComponents) {
      const urlVariants = generateAllUrlVariants(comp);
      const fileExports = getCachedFileExports(comp);
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
        } else {
          normalized[u].id = compId;
          normalized[u].chunks = compChunks;
        }
        for (const exp of fileExports) {
          const hashKey = `${u}#${exp}`;
          if (!normalized[hashKey] || normalized[hashKey].name === "*") {
            normalized[hashKey] = { id: compId, chunks: compChunks, name: exp };
          } else {
            normalized[hashKey].id = compId;
            normalized[hashKey].chunks = compChunks;
          }
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

  // Dynamic SSR module map and chunk reverse mapping for 0-rebuild dev SSR
  const dynamicSsrModuleMap = {};
  const chunkToFile = {};

  const registerModuleMapEntry = (chunkId, fileUrl, expName) => {
    if (!chunkId || !fileUrl) return;
    const ids = [chunkId];
    if (chunkId.startsWith("/")) ids.push(chunkId.slice(1));
    else ids.push("/" + chunkId);

    // Canonicalize fileUrl to 3 slashes (standard file URL)
    let canonicalUrl = fileUrl;
    if (canonicalUrl.startsWith("file://") && !canonicalUrl.startsWith("file:///")) {
      canonicalUrl = "file:///" + canonicalUrl.slice(7);
    }

    const urls = [canonicalUrl];
    if (canonicalUrl.startsWith("file:///c:/")) urls.push("file:///C:/" + canonicalUrl.slice(11));
    else if (canonicalUrl.startsWith("file:///C:/")) urls.push("file:///c:/" + canonicalUrl.slice(11));

    // Also include 2-slash variants
    const twoSlashUrls = urls.map((u) => "file://" + u.slice(8));
    const allUrls = [...urls, ...twoSlashUrls];

    for (const id of ids) {
      if (!dynamicSsrModuleMap[id]) {
        dynamicSsrModuleMap[id] = { "*": { id: canonicalUrl, chunks: [], name: "*" } };
      }
      if (expName) {
        dynamicSsrModuleMap[id][expName] = { id: canonicalUrl, chunks: [], name: expName };
      }
      chunkToFile[id] = canonicalUrl;
    }

    for (const u of allUrls) {
      if (!dynamicSsrModuleMap[u]) {
        dynamicSsrModuleMap[u] = { "*": { id: canonicalUrl, chunks: [], name: "*" } };
      }
      if (expName) {
        dynamicSsrModuleMap[u][expName] = { id: canonicalUrl, chunks: [], name: expName };
      }
      chunkToFile[u] = canonicalUrl;
    }
  };

  for (const [k, v] of Object.entries(parsedClientManifest)) {
    const fileUrl = k.split("#")[0];
    const expName = k.includes("#") ? k.split("#")[1] : null;
    if (v?.id) {
      registerModuleMapEntry(v.id, fileUrl, expName);
    }
  }

  for (const [k, v] of Object.entries(normalized)) {
    const fileUrl = k.split("#")[0];
    const expName = k.includes("#") ? k.split("#")[1] : null;
    if (v?.id && v.id.endsWith(".js")) {
      registerModuleMapEntry(v.id, fileUrl, expName);
    }
  }

  if (linkChunkId) {
    const linkCompIndex = clientComponents.findIndex((c) => candidateLinkPaths.has(path.resolve(c)));
    if (linkCompIndex !== -1) {
      const fileUrl = pathToFileURL(clientComponents[linkCompIndex]).href;
      registerModuleMapEntry(linkChunkId, fileUrl, "Link");
      registerModuleMapEntry(linkChunkId, fileUrl, "default");
    }
  }

  if (redirectChunkId) {
    const redirectCompIndex = clientComponents.findIndex((c) => candidateRedirectPaths.has(path.resolve(c)));
    if (redirectCompIndex !== -1) {
      const fileUrl = pathToFileURL(clientComponents[redirectCompIndex]).href;
      registerModuleMapEntry(redirectChunkId, fileUrl, "ClientRedirect");
      registerModuleMapEntry(redirectChunkId, fileUrl, "default");
    }
  }

  globalThis.__DINOU_DYNAMIC_SSR_MODULE_MAP__ = dynamicSsrModuleMap;
  globalThis.__DINOU_SSR_CHUNK_TO_FILE__ = chunkToFile;

  return { linkChunkId, redirectChunkId, componentsChanged };
}

// Initial manifest scan
await updateManifestsState({ forceRescan: true });

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
    for (const u of generateAllUrlVariants(compPath)) {
      addClientModule(u, `mod_${index}`);
    }
  });

  for (const [k, v] of Object.entries(parsedClientManifest)) {
    const fileUrl = k.split("#")[0];
    const compIndex = clientComponents.findIndex(
      (c) => pathToFileURL(c).href === fileUrl || pathToFileURL(c).href.toLowerCase() === fileUrl.toLowerCase()
    );
    if (compIndex !== -1) {
      if (v?.id) {
        addClientModule(v.id, `mod_${compIndex}`);
        if (v.id.startsWith("/")) addClientModule(v.id.slice(1), `mod_${compIndex}`);
        else addClientModule("/" + v.id, `mod_${compIndex}`);
      }
      addClientModule(fileUrl, `mod_${compIndex}`);
      if (fileUrl.startsWith("file://") && !fileUrl.startsWith("file:///")) {
        addClientModule("file:///" + fileUrl.slice(7), `mod_${compIndex}`);
      } else if (fileUrl.startsWith("file:///")) {
        addClientModule("file://" + fileUrl.slice(8), `mod_${compIndex}`);
      }
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
    for (const u of generateAllUrlVariants(compPath)) {
      addModuleMap(u, `{ "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } }`);
    }
  });

  for (const [k, v] of Object.entries(parsedClientManifest)) {
    const fileUrl = k.split("#")[0];
    if (v?.id) {
      addModuleMap(v.id, `{ "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } }`);
      if (v.id.startsWith("/")) {
        addModuleMap(v.id.slice(1), `{ "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } }`);
      } else {
        addModuleMap("/" + v.id, `{ "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } }`);
      }
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

const lowerMap = new Map();
globalThis.__webpack_require__ = (id) => {
  let mod = clientModules[id];
  if (!mod && typeof id === "string") {
    if (lowerMap.size === 0) {
      for (const k of Object.keys(clientModules)) {
        lowerMap.set(k.toLowerCase(), clientModules[k]);
        if (k.startsWith("file:///")) {
          lowerMap.set(("file://" + k.slice(8)).toLowerCase(), clientModules[k]);
        } else if (k.startsWith("file://")) {
          lowerMap.set(("file:///" + k.slice(7)).toLowerCase(), clientModules[k]);
        }
      }
    }
    mod = lowerMap.get(id.toLowerCase());
    if (!mod) {
      if (id.startsWith("file://") && !id.startsWith("file:///")) {
        const threeSlash = "file:///" + id.slice(7);
        mod = clientModules[threeSlash] || lowerMap.get(threeSlash.toLowerCase());
      } else if (id.startsWith("file:///")) {
        const twoSlash = "file://" + id.slice(8);
        mod = clientModules[twoSlash] || lowerMap.get(twoSlash.toLowerCase());
      }
    }
  }
  if (!mod && typeof id === "string") {
    const chunkMap = globalThis.__DINOU_SSR_CHUNK_TO_FILE__;
    let fileUrl = chunkMap?.[id] || chunkMap?.[id.startsWith("/") ? id.slice(1) : "/" + id];
    if (!fileUrl && id.startsWith("file://")) {
      const altId = id.startsWith("file:///") ? "file://" + id.slice(8) : "file:///" + id.slice(7);
      fileUrl = chunkMap?.[altId];
    }
    if (!fileUrl) {
      const clientManifest = globalThis.__DINOU_CLIENT_MANIFEST__ || globalThis.__DINOU_RAW_CLIENT_MANIFEST__;
      if (clientManifest) {
        const cleanId = id.startsWith("/") ? id.slice(1) : id;
        for (const [k, v] of Object.entries(clientManifest)) {
          if (!v?.id) continue;
          const cleanVId = v.id.startsWith("/") ? v.id.slice(1) : v.id;
          if (v.id === id || cleanVId === cleanId || ("/" + cleanVId) === id) {
            fileUrl = k.split("#")[0];
            break;
          }
        }
      }
    }
    if (fileUrl) {
      mod = clientModules[fileUrl] || lowerMap.get(fileUrl.toLowerCase());
      if (!mod) {
        if (fileUrl.startsWith("file://") && !fileUrl.startsWith("file:///")) {
          const threeSlash = "file:///" + fileUrl.slice(7);
          mod = clientModules[threeSlash] || lowerMap.get(threeSlash.toLowerCase());
        } else if (fileUrl.startsWith("file:///")) {
          const twoSlash = "file://" + fileUrl.slice(8);
          mod = clientModules[twoSlash] || lowerMap.get(twoSlash.toLowerCase());
        }
      }
    }
  }
  if (mod) return wrapModule(mod);
  console.error("[SSR Engine Dev] Module not found in __webpack_require__:", id);
  return {};
};
globalThis.__webpack_require__.u = (chunkId) => "" + chunkId + ".js";
globalThis.__webpack_chunk_load__ = () => Promise.resolve();

const dynamicModuleMap = new Proxy(ssrConsumerManifest.moduleMap || {}, {
  get(target, prop) {
    if (typeof prop !== "string") return target[prop];
    if (prop === "__isDinouProxy") return true;
    if (prop in target) return target[prop];

    const dynamicMap = globalThis.__DINOU_DYNAMIC_SSR_MODULE_MAP__;
    if (dynamicMap) {
      if (prop in dynamicMap) {
        target[prop] = dynamicMap[prop];
        return dynamicMap[prop];
      }
      const altProp = prop.startsWith("/") ? prop.slice(1) : "/" + prop;
      if (altProp in dynamicMap) {
        target[prop] = dynamicMap[altProp];
        return dynamicMap[altProp];
      }
      if (prop.startsWith("file://")) {
        const slashAlt = prop.startsWith("file:///") ? "file://" + prop.slice(8) : "file:///" + prop.slice(7);
        if (slashAlt in dynamicMap) {
          target[prop] = dynamicMap[slashAlt];
          return dynamicMap[slashAlt];
        }
      }
    }

    const clientManifest = globalThis.__DINOU_CLIENT_MANIFEST__ || globalThis.__DINOU_RAW_CLIENT_MANIFEST__;
    if (clientManifest) {
      const cleanProp = prop.startsWith("/") ? prop.slice(1) : prop;
      for (const [k, v] of Object.entries(clientManifest)) {
        if (!v?.id) continue;
        const cleanVId = v.id.startsWith("/") ? v.id.slice(1) : v.id;
        if (v.id === prop || cleanVId === cleanProp || ("/" + cleanVId) === prop) {
          const fileUrl = k.split("#")[0];
          const canonicalUrl = fileUrl.startsWith("file://") && !fileUrl.startsWith("file:///") ? "file:///" + fileUrl.slice(7) : fileUrl;
          const entry = { "*": { id: canonicalUrl, chunks: [], name: "*" } };
          target[prop] = entry;
          return entry;
        }
      }
    }

    if (prop.startsWith("file://")) {
      const canonicalProp = prop.startsWith("file:///") ? prop : "file:///" + prop.slice(7);
      const entry = { "*": { id: canonicalProp, chunks: [], name: "*" } };
      target[prop] = entry;
      return entry;
    }

    return target[prop];
  },
  has(target, prop) {
    if (prop === "__isDinouProxy") return true;
    if (prop in target) return true;
    const dynamicMap = globalThis.__DINOU_DYNAMIC_SSR_MODULE_MAP__;
    if (dynamicMap && (prop in dynamicMap || (prop.startsWith("/") ? prop.slice(1) : "/" + prop) in dynamicMap)) return true;
    return false;
  }
});

export async function renderHtml(rscStream, options = {}) {
  const manifest = {
    ...ssrConsumerManifest,
    moduleMap: dynamicModuleMap,
  };
  return renderRscStreamToHtmlStream(rscStream, manifest, options);
}
`;
  fs.writeFileSync(path.join(devDir, "ssr-entry.mjs"), ssrEntryContent, "utf8");
}

generateEntryFiles();
await yieldToEventLoop();

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

// Transform & File Content Cache for Server Plugins (mtimeMs based)
const fileTransformCache = new Map();

function getCachedFileTransform(filePath, type, transformFn) {
  try {
    const stats = fs.statSync(filePath);
    const key = `${filePath}::${type}`;
    const cached = fileTransformCache.get(key);
    if (cached && cached.mtime === stats.mtimeMs) {
      return cached.result;
    }
    const result = transformFn();
    fileTransformCache.set(key, { mtime: stats.mtimeMs, result });
    return result;
  } catch (e) {
    return transformFn();
  }
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

      return getCachedFileTransform(args.path, "client-proxy", () => {
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
    });
  },
};

const serverReferencesPlugin = {
  name: "dinou-server-references",
  setup(build) {
    build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
      if (args.path.includes("node_modules")) return null;

      return getCachedFileTransform(args.path, "server-ref-rsc", () => {
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
    });
  },
};

const serverReferencesPluginSsr = {
  name: "dinou-server-references-ssr",
  setup(build) {
    build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
      if (args.path.includes("node_modules")) return null;

      return getCachedFileTransform(args.path, "server-ref-ssr", () => {
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
  "dinou/config": path.resolve(dinouDir, "core/config.js"),
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
      const assetKey = `assets/${scoped}${ext}`;

      try {
        const fileBuf = fs.readFileSync(args.path);
        if (typeof globalThis !== "undefined") {
          if (!globalThis.__DINOU_MEM_FILES__) {
            globalThis.__DINOU_MEM_FILES__ = new Map();
          }
          globalThis.__DINOU_MEM_FILES__.set(assetKey, fileBuf);
          globalThis.__DINOU_MEM_FILES__.set("/" + assetKey, fileBuf);
          globalThis.__DINOU_MEM_FILES__.set(`${scoped}${ext}`, fileBuf);
        }

        if (process.env.DINOU_WRITE_TO_DISK === "true") {
          const outAssetDir = path.resolve(projectRoot, ".dinou/public/assets");
          const outAssetPath = path.join(outAssetDir, `${scoped}${ext}`);
          if (!fs.existsSync(outAssetPath)) {
            fs.mkdirSync(outAssetDir, { recursive: true });
            fs.writeFileSync(outAssetPath, fileBuf);
          }
        }
      } catch (e) {}

      return {
        contents: `export default ${JSON.stringify(assetUrl)};`,
        loader: "js",
      };
    });
  },
};

const resolvePkgCache = new Map();

function createDevExternalPackagesPlugin(isRsc = true) {
  return {
    name: `dinou-dev-external-packages-${isRsc ? "rsc" : "ssr"}`,
    setup(build) {
      build.onResolve({ filter: /^[^.\/]|^\.[^.\/]/ }, async (args) => {
        // 1. Windows or Unix absolute paths
        if (path.isAbsolute(args.path) || /^[a-zA-Z]:[\\\/]/.test(args.path)) {
          return null;
        }
        // 2. Relative paths or leading slashes
        if (args.path.startsWith(".") || args.path.startsWith("/") || args.path.startsWith("\\")) {
          return null;
        }
        // 3. Virtual modules
        if (args.path.startsWith("\0") || args.path.startsWith("virtual:")) {
          return null;
        }
        // 4. Aliases
        if (args.path.startsWith("@/") || args.path === "@") {
          return null;
        }
        if (args.path === "dinou" || args.path.startsWith("dinou/")) {
          return null;
        }
        // 5. In RSC (ctxA), React packages must remain bundled to preserve react-server condition.
        // In SSR (ctxB), React packages MUST be external so client components and the renderer share the same React singleton!
        if (isRsc) {
          if (
            args.path === "react" ||
            args.path.startsWith("react/") ||
            args.path === "react-dom" ||
            args.path.startsWith("react-dom/") ||
            args.path === "react-server-dom-webpack" ||
            args.path.startsWith("react-server-dom-webpack/") ||
            args.path === "@roggc/react-server-dom-esm" ||
            args.path.startsWith("@roggc/react-server-dom-esm/")
          ) {
            return null;
          }
        }
        // 6. CSS / Stylesheets (handled by esbuild empty loader)
        if (/\.(css|scss|sass|less)$/i.test(args.path)) {
          return null;
        }
        // 7. Client components from node_modules:
        // In RSC (ctxA), client components need to be intercepted by clientReferencesPlugin to create the proxy.
        if (isRsc) {
          try {
            const cacheKey = `${args.path}::${args.resolveDir || projectRoot}`;
            let resolved = resolvePkgCache.get(cacheKey);
            if (resolved === undefined) {
              try {
                resolved = require.resolve(args.path, { paths: [args.resolveDir || projectRoot] });
              } catch (e) {
                resolved = null;
              }
              resolvePkgCache.set(cacheKey, resolved);
            }
            if (resolved && knownClientFiles && knownClientFiles.has(path.resolve(resolved))) {
              return null;
            }
          } catch (e) {}
        }

        return { path: args.path, external: true };
      });
    },
  };
}

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
devTimings.discovery = Date.now() - devStartTime;
updateSpinner("Initializing Incremental Dual-Bundle Engine (No fork)...");
const rscOutfile = path.join(devDir, "rsc-engine.mjs");
const ssrOutfile = path.join(devDir, "ssr-engine.mjs");

const ctxA = await esbuild.context({
  entryPoints: { "rsc-engine": path.join(devDir, "rsc-entry.mjs") },
  outdir: devDir,
  splitting: true,
  outExtension: { ".js": ".mjs" },
  chunkNames: "chunks/rsc/[name]-[hash]",
  bundle: true,
  format: "esm",
  target: "node20",
  platform: "node",
  mainFields: ["module", "main"],
  conditions: ["node", "worker", "react-server"],
  external: externalList,
  banner,
  plugins: [clientReferencesPlugin, serverReferencesPlugin, serverAssetPlugin, createDevExternalPackagesPlugin(true)],
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
  entryPoints: { "ssr-engine": path.join(devDir, "ssr-entry.mjs") },
  outdir: devDir,
  splitting: true,
  outExtension: { ".js": ".mjs" },
  chunkNames: "chunks/ssr/[name]-[hash]",
  bundle: true,
  format: "esm",
  target: "node20",
  platform: "node",
  mainFields: ["module", "main"],
  conditions: ["node", "worker", "browser"],
  external: externalList,
  banner,
  plugins: [serverReferencesPluginSsr, serverAssetPlugin, createDevExternalPackagesPlugin(false)],
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
let ssrModulePromise = null;
let engineVersion = 1;
let activeRebuildPromise = null;
let activeSsrSyncPromise = null;
let initialEngineBuildPromise = null;
let ssrSyncTimeout = null;

function scheduleSsrSync(delay = 2500) {
  if (ssrSyncTimeout) clearTimeout(ssrSyncTimeout);
  ssrSyncTimeout = setTimeout(() => {
    ssrSyncTimeout = null;
    const ssrSync = (async () => {
      try {
        const tB = Date.now();
        await ctxB.rebuild();
        logTimeline(`ctxB (SSR Engine) rebuilt in ${Date.now() - tB}ms`);
        const v = "?v=" + Date.now();
        ssrModule = await dynamicImportWithRetry(pathToFileURL(ssrOutfile).href + v);
        logTimeline(`SSR module imported into V8 runtime`);
      } catch (err) {
        console.error("❌ [SSR Engine Rebuild Error]:", err);
      }
    })();
    activeSsrSyncPromise = ssrSync;
    ssrSync.finally(() => {
      if (activeSsrSyncPromise === ssrSync) activeSsrSyncPromise = null;
    });
  }, delay);
}

function getSsrModule() {
  if (ssrSyncTimeout) {
    clearTimeout(ssrSyncTimeout);
    ssrSyncTimeout = null;
    const v = "?v=" + Date.now();
    ssrModulePromise = (async () => {
      await ctxB.rebuild();
      const mod = await dynamicImportWithRetry(pathToFileURL(ssrOutfile).href + v);
      ssrModule = mod;
      return mod;
    })();
    return ssrModulePromise;
  }
  if (ssrModule) return Promise.resolve(ssrModule);
  if (!ssrModulePromise) {
    const v = "?v=" + engineVersion;
    ssrModulePromise = dynamicImportWithRetry(pathToFileURL(ssrOutfile).href + v).then((mod) => {
      ssrModule = mod;
      return mod;
    });
  }
  return ssrModulePromise;
}

async function doInitialBuild() {
  const tBuild0 = Date.now();
  await Promise.all([ctxA.rebuild(), ctxB.rebuild()]);
  devTimings.engineBuild = Date.now() - tBuild0;
  await yieldToEventLoop();

  const tImport0 = Date.now();
  const v = "?v=" + engineVersion;
  rscModule = await dynamicImportWithRetry(pathToFileURL(rscOutfile).href + v);
  await yieldToEventLoop();
  devTimings.engineImport = Date.now() - tImport0;

  if (process.env.DINOU_STANDALONE_SERVER === "true") {
    ssrModule = await dynamicImportWithRetry(pathToFileURL(ssrOutfile).href + v);
    ssrModulePromise = Promise.resolve(ssrModule);
    updateSpinner("Dual-Bundle engine compiled. Starting server...");
  }
}

if (process.env.DINOU_STANDALONE_SERVER === "true") {
  await doInitialBuild();
} else {
  // Launch Dual-Bundle engine compilation and import concurrently in the background while client bundler runs
  initialEngineBuildPromise = doInitialBuild().catch((err) => {
    console.error("❌ [Dinou Dev] Initial Dual-Bundle engine build error:", err);
  });
  updateSpinner("Starting in-process client bundler...");
}

const isDebug =
  process.env.DINOU_DEBUG === "true" ||
  process.env.DINOU_DEBUG === "1" ||
  process.env.DEBUG === "true" ||
  process.env.DEBUG === "1";

globalThis.__TIMELINE_T0__ = 0;
const timelineTime = () => new Date().toTimeString().slice(0, 8) + "." + String(Date.now() % 1000).padStart(3, "0");
const timelineRel = () => globalThis.__TIMELINE_T0__ ? `[+${Date.now() - globalThis.__TIMELINE_T0__}ms]` : `[+0ms]`;
const logTimeline = (msg) => {
  if (isDebug) {
    console.log(`⏱️ [TIMELINE ${timelineTime()}] ${timelineRel()} ${msg}`);
  }
};

// Client bundler handle & broadcast helper
let clientBundlerHandle = null;
let clientBundlerPromise = null;

let activeClientBuildPromise = null;
let activeClientBuildResolve = null;
let clientBuildStartTime = 0;

function notifyClientBuildStart() {
  clientBuildStartTime = Date.now();
  logTimeline(`Client Bundler build started...`);
  if (!activeClientBuildPromise) {
    activeClientBuildPromise = new Promise((resolve) => {
      activeClientBuildResolve = resolve;
    });
  }
}

let lastClientBuildDetails = "";

function notifyClientBuildEnd() {
  const elapsed = Date.now() - clientBuildStartTime;
  const tool = (isWebpackBuild ? "webpack" : (process.env.DINOU_BUILD_TOOL || "esbuild")).toLowerCase();

  if (tool === "esbuild") {
    const core = globalThis.__ESBUILD_CORE_TIME__ || 0;
    const swc = globalThis.__DINOU_SWC_TIME__ || 0;
    const swcCount = globalThis.__DINOU_SWC_COUNT__ || 0;
    const assetsTime = globalThis.__DINOU_ASSETS_TIME__ || 0;
    const stable = globalThis.__DINOU_STABLE_TIME__ || 0;
    const wrap = globalThis.__DINOU_WRAP_TIME__ || 0;
    const writeTotal = globalThis.__DINOU_WRITE_TOTAL__ || 0;
    const broadcast = globalThis.__DINOU_BROADCAST_TIME__ || 0;
    const rcm = globalThis.__DINOU_RCM_TIME__ || 0;
    const details = [];
    if (core > 0) details.push(`core: ${core}ms`);
    if (swcCount > 0) details.push(`SWC: ${swc}ms (${swcCount} files)`);
    if (assetsTime > 0) details.push(`Assets: ${assetsTime}ms`);
    if (stable > 0) details.push(`Stable: ${stable}ms`);
    if (wrap > 0) details.push(`Wrap: ${wrap}ms`);
    if (writeTotal > 0) details.push(`Write: ${writeTotal}ms`);
    if (broadcast > 0) details.push(`Bcast: ${broadcast}ms`);
    if (rcm > 0) details.push(`RCM: ${rcm}ms`);
    const detailsStr = details.length > 0 ? ` [${details.join(" | ")}]` : "";
    lastClientBuildDetails = detailsStr;
    delete globalThis.__DINOU_SWC_TIME__;
    delete globalThis.__DINOU_SWC_COUNT__;
    logTimeline(`Client Bundler (esbuild) build finished in ${elapsed}ms${detailsStr}`);
  } else if (tool === "rollup") {
    const manifestTime = globalThis.__DINOU_ROLLUP_MANIFEST_TIME__ || 0;
    const details = [];
    if (manifestTime > 0) details.push(`Manifest AST: ${manifestTime}ms`);
    if (globalThis.__DINOU_ROLLUP_TIMINGS__) {
      for (const t of globalThis.__DINOU_ROLLUP_TIMINGS__.slice(0, 5)) {
        const cleanName = t.name
          .replace(/^[#-]+\s*/, "")
          .replace(/plugin\s+\d+\s*\((.+?)\)/, "$1");
        details.push(`${cleanName}: ${t.ms}ms`);
      }
    }
    const detailsStr = details.length > 0 ? ` [${details.join(" | ")}]` : "";
    logTimeline(`Client Bundler (Rollup) build finished in ${elapsed}ms${detailsStr}`);
  } else {
    logTimeline(`Client Bundler (${tool}) build finished in ${elapsed}ms`);
  }

  if (activeClientBuildResolve) {
    activeClientBuildResolve();
    activeClientBuildResolve = null;
  }
  activeClientBuildPromise = null;
}

async function broadcastToClients(msg) {
  try {
    const handle = clientBundlerHandle || (await clientBundlerPromise);
    handle?.broadcast?.(msg);
  } catch (e) {}
}

// Trigger an incremental rebuild
let isRebuilding = false;
let pendingRebuildTask = null;

async function doRebuild(filePath = "", eventType = "change") {
  const t0 = Date.now();
  try {
    const isStructureChange = eventType === "add" || eventType === "unlink";
    const absFilePath = filePath ? path.resolve(filePath) : "";
    const baseName = absFilePath ? path.basename(absFilePath) : "source";
    logTimeline(`doRebuild executing for ${baseName}`);
    startSpinner(`Recompiling changes in ${baseName}...`);

    const normLower = absFilePath.toLowerCase();
    const isCssFile = normLower.endsWith(".css") || normLower.endsWith(".scss") || normLower.endsWith(".less");
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

    let clientRebuildPromise = null;
    const isClientRelevant = isClientFile || wasClientFile || clientDirectiveChanged || isCssFile;
    if (clientBundlerHandle?.notifyFileChanged && absFilePath && isClientRelevant) {
      clientRebuildPromise = clientBundlerHandle.notifyFileChanged(absFilePath);
    }

    const needsClientBundlerRestart = clientDirectiveChanged || (isStructureChange && isCssFile);

    if (needsClientBundlerRestart && clientBundlerHandle?.restart) {
      updateSpinner(`${clientDirectiveChanged ? "Directive change" : "CSS change"} in ${baseName}. Recreating bundle...`);
      await clientBundlerHandle.restart();
      await broadcastToClients({ type: "reload" });
      logSuccess(`Recreated bundle for ${baseName} in ${Date.now() - t0}ms`);
      return;
    }

    const needsStructureRebuild = isStructureChange || clientDirectiveChanged || serverDirectiveChanged;

    if (needsStructureRebuild) {
      await updateManifestsState({ forceRescan: true });
      generateEntryFiles();
      await Promise.all([ctxA.rebuild(), ctxB.rebuild()]);
      engineVersion = Date.now();
      const v = "?v=" + engineVersion;
      rscModule = await dynamicImportWithRetry(pathToFileURL(rscOutfile).href + v);
      ssrModule = await dynamicImportWithRetry(pathToFileURL(ssrOutfile).href + v);
      logTimeline(`SSR module imported into V8 runtime`);
      logSuccess(`Rebuilt in ${Date.now() - t0}ms (${eventType} ${baseName})`);
      if (activeClientBuildPromise) {
        await activeClientBuildPromise;
      }
      if (!isCssFile) {
        await broadcastToClients({ type: "reload" });
      }
    } else if (isClientFile) {
      if (clientRebuildPromise) {
        await clientRebuildPromise;
      } else if (activeClientBuildPromise) {
        await activeClientBuildPromise;
      }
      const buildDetails = lastClientBuildDetails || "";
      lastClientBuildDetails = "";
      logSuccess(`Rebuilt in ${Date.now() - t0}ms (${eventType} ${baseName})${buildDetails}`);
      // Rebuild SSR engine asynchronously in the background with debounce so client HMR is instant
      scheduleSsrSync(2500);
    } else {
      await ctxA.rebuild();
      engineVersion = Date.now();
      const v = "?v=" + engineVersion;
      rscModule = await dynamicImportWithRetry(pathToFileURL(rscOutfile).href + v);
      logSuccess(`Rebuilt in ${Date.now() - t0}ms (${eventType} ${baseName})`);
      if (activeClientBuildPromise) {
        await activeClientBuildPromise;
      }
      if (!isCssFile) {
        await broadcastToClients({ type: "rsc-update", path: absFilePath || filePath });
      }
    }
  } catch (err) {
    stopSpinner();
    console.error("❌ [Dinou Dev] Rebuild error:", err);
    showIdleStatus();
  }
}

// Trigger an incremental rebuild with automatic task coalescing
async function triggerRebuild(filePath = "", eventType = "change") {
  if (isRebuilding) {
    pendingRebuildTask = { filePath, eventType };
    return activeRebuildPromise;
  }

  isRebuilding = true;
  activeRebuildPromise = (async () => {
    try {
      let task = { filePath, eventType };
      while (task) {
        pendingRebuildTask = null;
        await doRebuild(task.filePath, task.eventType);
        task = pendingRebuildTask;
      }
    } finally {
      isRebuilding = false;
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
  awaitWriteFinish: {
    stabilityThreshold: 20,
    pollInterval: 10,
  },
});

srcWatcher.on("all", (event, fullPath) => {
  globalThis.__TIMELINE_T0__ = Date.now();
  logTimeline(`File change detected: ${event} ${path.basename(fullPath)}`);
  pendingSrcPath = fullPath;
  pendingSrcEvent = event;
  if (srcDebounce) clearTimeout(srcDebounce);
  srcDebounce = setTimeout(() => {
    srcDebounce = null;
    logTimeline(`Debounce timer fired, triggering rebuild...`);
    triggerRebuild(pendingSrcPath, pendingSrcEvent);
  }, 15);
});

// Watch manifest folder for client bundler output
const manifestFolder = isWebpackBuild
  ? path.resolve(projectRoot, ".dinou/public")
  : path.resolve(projectRoot, ".dinou/react_client_manifest");

let clientManifestReady = false;

function checkClientFilesPresent() {
  if (globalThis.__DINOU_MEM_FILES__ && globalThis.__DINOU_MEM_FILES__.has("main.js")) {
    return true;
  }
  const cPath = findManifest("react-client-manifest.json", "react_client_manifest");
  if (!globalThis.__DINOU_RAW_CLIENT_MANIFEST__ && !readJsonSafe(cPath)) return false;
  if (isWebpackBuild) {
    if (globalThis.__DINOU_RAW_ASSET_MANIFEST__) return true;
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
let pendingManifestSync = false;

async function onManifestUpdated() {
  if (manifestSyncPromise) {
    pendingManifestSync = true;
    return manifestSyncPromise;
  }

  manifestSyncPromise = (async () => {
    try {
      do {
        pendingManifestSync = false;

        // If initial background build of Dual-Bundle engine is still in flight, wait for it
        if (initialEngineBuildPromise) {
          updateSpinner("Finalizing Dual-Bundle engine...");
          await initialEngineBuildPromise;
          initialEngineBuildPromise = null;
        }

        const { componentsChanged } = await updateManifestsState({ forceRescan: false });

        // If engines were already compiled and client component list hasn't changed,
        // we take the instant in-memory fast path (<1ms) with zero rebuild or V8 re-eval!
        if (rscModule && !componentsChanged) {
          clientManifestReady = true;
          break;
        }

        updateSpinner("Synchronizing Dual-Bundle engine with client build...");
        generateEntryFiles();
        await yieldToEventLoop();

        const tEngine0 = Date.now();
        await Promise.all([ctxA.rebuild(), ctxB.rebuild()]);
        if (devTimings.engineBuild == null) {
          devTimings.engineBuild = Date.now() - tEngine0;
        }
        engineVersion = Date.now();
        const v = "?v=" + engineVersion;
        await yieldToEventLoop();

        const tImport0 = Date.now();
        rscModule = await dynamicImportWithRetry(pathToFileURL(rscOutfile).href + v);
        await yieldToEventLoop();
        ssrModule = null;
        ssrModulePromise = null;
        getSsrModule().catch(() => {});

        if (devTimings.engineImport == null) {
          devTimings.engineImport = Date.now() - tImport0;
        }
        clientManifestReady = true;
      } while (pendingManifestSync);
    } catch (err) {
      console.error("❌ [Dinou Dev] Error synchronizing with client manifest:", err);
    } finally {
      manifestSyncPromise = null;
      showIdleStatus();
    }
  })();

  return manifestSyncPromise;
}

const dotDinouDir = path.resolve(projectRoot, ".dinou");
if (!fs.existsSync(dotDinouDir)) {
  fs.mkdirSync(dotDinouDir, { recursive: true });
}

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
  return (
    clientManifestReady &&
    !manifestSyncPromise &&
    !initialEngineBuildPromise &&
    !!rscModule &&
    checkClientFilesPresent()
  );
}

async function startClientBundler(tool) {
  const normTool = (tool || "esbuild").toLowerCase();
  updateSpinner(`Starting in-process client bundler (${normTool})...`);

  if (normTool === "esbuild") {
    const { startEsbuildDev } = await import(
      pathToFileURL(path.resolve(dinouDir, "esbuild/dev.mjs")).href
    );
    return await startEsbuildDev({
      onRebuilt: () => onManifestUpdated(),
      onBuildStart: notifyClientBuildStart,
      onBuildEnd: notifyClientBuildEnd,
    });
  }

  if (normTool === "rollup") {
    const { watch } = require("rollup");
    const getRollupConfig = require(path.resolve(dinouDir, "rollup/rollup.config.js"));
    const { getHmrEngine, closeHmrServer, notifyFileChanged } = require(path.resolve(dinouDir, "rollup/react-refresh/rollup-plugin-esm-hmr.js"));
    const reactClientManifestPlugin = require(path.resolve(dinouDir, "rollup/rollup-plugins/rollup-plugin-react-client-manifest.js"));
    reactClientManifestPlugin.setOnManifestUpdated?.(() => onManifestUpdated());

    let currentWatcher = null;
    let nextRollupBuildPromise = null;
    let nextRollupBuildResolve = null;
    let rollupBuildSafetyTimeout = null;

    function getOrCreateNextRollupBuildPromise() {
      if (!nextRollupBuildPromise) {
        nextRollupBuildPromise = new Promise((resolve) => {
          nextRollupBuildResolve = resolve;
        });
        // Safety timeout: if Rollup does not trigger or finish within 800ms (e.g. unchanged or ignored file), resolve
        rollupBuildSafetyTimeout = setTimeout(() => {
          if (!activeClientBuildPromise && nextRollupBuildResolve) {
            const r = nextRollupBuildResolve;
            nextRollupBuildResolve = null;
            nextRollupBuildPromise = null;
            r();
          }
        }, 800);
      }
      return nextRollupBuildPromise;
    }

    async function startRollupWatcher() {
      if (currentWatcher) {
        try { await currentWatcher.close(); } catch (e) {}
        currentWatcher = null;
      }
      if (typeof globalThis !== "undefined") {
        if (globalThis.__DINOU_MEM_FILES__) {
          globalThis.__DINOU_MEM_FILES__.clear();
        }
        delete globalThis.__DINOU_RAW_CLIENT_MANIFEST__;
        delete globalThis.__DINOU_RAW_SERVER_FUNCTIONS_MANIFEST__;
        delete globalThis.__DINOU_RAW_ASSET_MANIFEST__;
      }
      const rollupConfig = await getRollupConfig();
      currentWatcher = watch(rollupConfig);

      currentWatcher.on("change", (id, change) => {
        if (process.env.DINOU_DEBUG) {
          logTimeline(`[Rollup Watcher] File changed: ${id} (${change?.event || "change"})`);
        }
      });

      return new Promise((resolve) => {
        let initialResolved = false;
        currentWatcher.on("event", (event) => {
          if (event.code === "BUNDLE_START") {
            if (rollupBuildSafetyTimeout) {
              clearTimeout(rollupBuildSafetyTimeout);
              rollupBuildSafetyTimeout = null;
            }
            updateSpinner("Bundling client with Rollup...");
            notifyClientBuildStart();
            getOrCreateNextRollupBuildPromise();
          } else if (event.code === "BUNDLE_END") {
            if (rollupBuildSafetyTimeout) {
              clearTimeout(rollupBuildSafetyTimeout);
              rollupBuildSafetyTimeout = null;
            }
            logSuccess(`Client bundle completed in ${event.duration}ms`);
            if (event.result?.getTimings) {
              const rawTimings = event.result.getTimings();
              const pluginTimes = [];
              for (const [key, val] of Object.entries(rawTimings)) {
                if (Array.isArray(val) && val[0] > 100) {
                  pluginTimes.push({ name: key, ms: Math.round(val[0]) });
                }
              }
              pluginTimes.sort((a, b) => b.ms - a.ms);
              globalThis.__DINOU_ROLLUP_TIMINGS__ = pluginTimes;
            }
            notifyClientBuildEnd();
            if (nextRollupBuildResolve) {
              const r = nextRollupBuildResolve;
              nextRollupBuildResolve = null;
              nextRollupBuildPromise = null;
              r();
            }
            if (!initialResolved) {
              onManifestUpdated();
              initialResolved = true;
              resolve();
            }
          } else if (event.code === "ERROR") {
            if (rollupBuildSafetyTimeout) {
              clearTimeout(rollupBuildSafetyTimeout);
              rollupBuildSafetyTimeout = null;
            }
            console.error("❌ [Rollup Dev Error]:", event.error);
            notifyClientBuildEnd();
            if (nextRollupBuildResolve) {
              const r = nextRollupBuildResolve;
              nextRollupBuildResolve = null;
              nextRollupBuildPromise = null;
              r();
            }
            if (!initialResolved) {
              initialResolved = true;
              resolve();
            }
          }
        });
      });
    }

    await startRollupWatcher();

    return {
      notifyFileChanged: (filePath) => {
        notifyFileChanged?.(filePath);
        return getOrCreateNextRollupBuildPromise();
      },
      broadcast: (msg) => {
        getHmrEngine()?.broadcastMessage?.(msg);
      },
      restart: async () => {
        console.log("⚡ [Rollup Dev] Recreating client bundle due to directive change...");
        await startRollupWatcher();
        await onManifestUpdated();
      },
      close: async () => {
        try {
          if (currentWatcher) await currentWatcher.close();
          closeHmrServer?.();
        } catch (e) {}
      },
    };
  }

  if (normTool === "webpack") {
    if (typeof globalThis !== "undefined") {
      if (globalThis.__DINOU_MEM_FILES__) {
        globalThis.__DINOU_MEM_FILES__.clear();
      }
      delete globalThis.__DINOU_RAW_CLIENT_MANIFEST__;
      delete globalThis.__DINOU_RAW_SERVER_FUNCTIONS_MANIFEST__;
      delete globalThis.__DINOU_RAW_ASSET_MANIFEST__;
    }
    const webpack = require("webpack");
    const WebpackDevServer = require("webpack-dev-server");
    const getWebpackConfig = require(path.resolve(dinouDir, "webpack/webpack.config.js"));
    const webpackConfig = await getWebpackConfig();
    const compiler = webpack(webpackConfig);

    let devServer = null;
    let buildWaitPromise = null;
    let buildWaitResolve = null;

    function startBuildWait() {
      notifyClientBuildStart();
      if (!buildWaitPromise) {
        buildWaitPromise = new Promise((resolve) => {
          buildWaitResolve = resolve;
        });
      }
    }

    function endBuildWait() {
      notifyClientBuildEnd();
      if (buildWaitResolve) {
        const resolve = buildWaitResolve;
        buildWaitResolve = null;
        buildWaitPromise = null;
        resolve();
      }
    }

    compiler.hooks.invalid.tap("DinouBuildStart", () => {
      startBuildWait();
    });

    compiler.hooks.watchRun.tap("DinouBuildStart", () => {
      startBuildWait();
    });

    return new Promise((resolve, reject) => {
      let initialResolved = false;

      compiler.hooks.done.tapPromise("DinouClientSync", async (stats) => {
        try {
          await onManifestUpdated();
        } finally {
          endBuildWait();
        }
        if (!initialResolved) {
          initialResolved = true;
          resolve({
            broadcast: (msg) => {
              if (devServer?.sendMessage && devServer?.sockets) {
                devServer.sendMessage(devServer.sockets, "ok");
              }
            },
            restart: async () => {
              console.log("⚡ [Webpack Dev] Waiting for client bundle compilation due to directive change...");
              for (let i = 0; i < 10 && !buildWaitPromise && !activeClientBuildPromise; i++) {
                await new Promise((r) => setTimeout(r, 25));
              }
              if (buildWaitPromise) {
                await buildWaitPromise;
              } else if (activeClientBuildPromise) {
                await activeClientBuildPromise;
              }
              await onManifestUpdated();
            },
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
const server = http.createServer(async (req, res) => {
  try {
    if (clientBundlerPromise) {
      await clientBundlerPromise;
    }
    if (initialEngineBuildPromise) {
      await initialEngineBuildPromise;
    }
    if (activeClientBuildPromise) {
      await activeClientBuildPromise;
    }
    // If a source change is pending debounce, process it
    if (srcDebounce) {
      clearTimeout(srcDebounce);
      srcDebounce = null;
      await triggerRebuild(pendingSrcPath, pendingSrcEvent);
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

    // 2. Static files delivery from memory, .dinou/public, or public/
    if (pathname !== "/") {
      const cleanPath = pathname.startsWith("/") ? pathname.slice(1) : pathname;
      const mappedPath = (parsedAssetManifest && parsedAssetManifest[cleanPath]) || cleanPath;
      const ext = path.extname(cleanPath).toLowerCase();

      // 2.a In-memory fast path for client bundles and assets generated in dev
      if (globalThis.__DINOU_MEM_FILES__) {
        let memBuf =
          globalThis.__DINOU_MEM_FILES__.get(cleanPath) ||
          globalThis.__DINOU_MEM_FILES__.get(mappedPath) ||
          globalThis.__DINOU_MEM_FILES__.get("/" + cleanPath);

        // Active Route Bundling: On-demand compilation of requested client bundle
        if (!memBuf && cleanPath.endsWith(".js") && clientBundlerHandle?.ensureActiveRoute) {
          const base = path.basename(cleanPath, ".js");
          const activated = await clientBundlerHandle.ensureActiveRoute(base);
          if (activated) {
            memBuf =
              globalThis.__DINOU_MEM_FILES__.get(cleanPath) ||
              globalThis.__DINOU_MEM_FILES__.get(mappedPath) ||
              globalThis.__DINOU_MEM_FILES__.get("/" + cleanPath);
          }
        }

        if (memBuf) {
          const fileExt = path.extname(cleanPath).toLowerCase();
          const contentType = MIME_TYPES[fileExt] || "application/octet-stream";
          res.statusCode = 200;
          res.setHeader("content-type", contentType);
          res.setHeader("content-length", String(memBuf.length));
          res.setHeader("cache-control", "no-store, no-cache, must-revalidate");
          res.end(memBuf);
          return;
        }
      }

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
    if (activeRebuildPromise) {
      await activeRebuildPromise;
    }
    if (manifestSyncPromise) {
      await manifestSyncPromise;
    }
    if (activeSsrSyncPromise) {
      await activeSsrSyncPromise;
    }

    // Active Route Bundling: Proactively activate requested route in dev
    const routePath = pathname.replace(/^\/____rsc_payload____/, "");
    if (clientBundlerHandle?.ensureActiveRoute && routePath && routePath !== "/") {
      try {
        await clientBundlerHandle.ensureActiveRoute(routePath);
      } catch (e) {}
    }

    const webReq = nodeToWebRequest(req);
    const ssr = await getSsrModule();
    const webRes = await rscModule.handleRequest(webReq, {
      runtime: "node-bundle",
      renderHtmlStream: ssr.renderHtml,
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
  const buildTool = isWebpackBuild ? "webpack" : (process.env.DINOU_BUILD_TOOL || "esbuild");

  if (process.env.DINOU_STANDALONE_SERVER !== "true") {
    updateSpinner(`Bundling client with ${buildTool}...`);
    try {
      const tClient0 = Date.now();
      clientBundlerPromise = startClientBundler(buildTool);
      clientBundlerHandle = await clientBundlerPromise;
      devTimings.clientBundlerTotal = Date.now() - tClient0;
      if (clientBundlerHandle?.timings) {
        devTimings.clientEntriesBabel = clientBundlerHandle.timings.clientEntriesBabel;
        devTimings.clientBuild = clientBundlerHandle.timings.clientBuild;
        devTimings.postCss = clientBundlerHandle.timings.postCss;
        devTimings.postCssCount = clientBundlerHandle.timings.postCssCount;
        devTimings.swc = clientBundlerHandle.timings.swc;
        devTimings.swcCount = clientBundlerHandle.timings.swcCount;
        devTimings.sf = clientBundlerHandle.timings.sf;
        devTimings.sfCount = clientBundlerHandle.timings.sfCount;
        devTimings.rcm = clientBundlerHandle.timings.rcm;
        devTimings.stable = clientBundlerHandle.timings.stable;
        devTimings.writeDisk = clientBundlerHandle.timings.writeDisk;
      }
      if (manifestSyncPromise) {
        await manifestSyncPromise;
      }
      if (initialEngineBuildPromise) {
        await initialEngineBuildPromise;
      }
      printReadyBanner({
        port: PORT,
        tool: isWebpackBuild ? "Webpack" : buildTool,
        durationMs: Date.now() - devStartTime,
        timings: devTimings,
      });
      getSsrModule().catch(() => {});
    } catch (err) {
      stopSpinner();
      console.error("❌ [Dinou Dev] Failed to start client bundler:", err);
    } finally {
      clientBundlerPromise = null;
    }
  } else {
    printReadyBanner({
      port: PORT,
      tool: isWebpackBuild ? "Webpack" : (process.env.DINOU_BUILD_TOOL || "esbuild"),
      durationMs: Date.now() - devStartTime,
      timings: devTimings,
    });
    getSsrModule().catch(() => {});
  }
});

// Clean exit on termination
let isCleaningUp = false;
async function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  stopSpinner();
  try {
    srcWatcher.close();
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
