// dinou/bun/build.mjs
// Dual-Bundle Build script for packaging Dinou v7 for Bun (Pre-bundled AOT & Standalone).
// Pass A: RSC Engine (conditions: ["bun", "worker", "react-server"])
// Pass B: Native Streaming HTML SSR Engine (conditions: ["bun", "worker", "browser"])
// Pass C: Main Bun Orchestrator (.dinou/bun/server.js)

import fs from "node:fs";
import path from "node:path";
import esbuild from "esbuild";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { generateRouteModulesCode } = require("../core/route-generator.js");
const parseExports = require("../core/parse-exports.js");
const { useClientRegex, useServerRegex } = require("../constants.js");

const projectRoot = process.cwd();
const bunDir = path.resolve(projectRoot, ".dinou/bun");
fs.mkdirSync(bunDir, { recursive: true });

// Locate dinou root: ejected in project or in package directory
const dinouDir = fs.existsSync(path.resolve(projectRoot, "dinou"))
  ? path.resolve(projectRoot, "dinou")
  : path.resolve(__dirname, "..");
const dinouDirSlash = dinouDir.replace(/\\/g, "/");

const candidateDinouRoots = [
  dinouDir,
  path.resolve(projectRoot, "dinou"),
  path.resolve(projectRoot, "node_modules/dinou/dinou"),
  path.resolve(projectRoot, "node_modules/dinou"),
  path.resolve(__dirname, ".."),
];

const candidateLinkPaths = new Set();
const candidateRedirectPaths = new Set();

for (const r of candidateDinouRoots) {
  candidateLinkPaths.add(path.resolve(r, "core/link.jsx"));
  candidateRedirectPaths.add(path.resolve(r, "core/client-redirect.jsx"));
}

console.log("⚡ [Dinou Bun] Generating static route modules...");
const routeModulesCode = generateRouteModulesCode(projectRoot, "../..");
const routeModulesPath = path.join(bunDir, "route-modules.js");
fs.writeFileSync(routeModulesPath, routeModulesCode, "utf8");

// Check manifests from build (supports Esbuild, Rollup, and Webpack output locations)
const isWebpackBuild = process.env.DINOU_BUILD_TOOL === "webpack";

function findManifest(filename, fallbackFolder) {
  const candidates = isWebpackBuild
    ? [
        path.resolve(projectRoot, ".dinou/dist3", filename),
        path.resolve(projectRoot, ".dinou/public", filename),
        path.resolve(projectRoot, ".dinou", fallbackFolder, filename),
      ]
    : [
        path.resolve(projectRoot, ".dinou", fallbackFolder, filename),
        path.resolve(projectRoot, ".dinou/dist3", filename),
        path.resolve(projectRoot, ".dinou/public", filename),
      ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

const clientManifestPath = findManifest("react-client-manifest.json", "react_client_manifest");
const sfManifestPath = findManifest("server-functions-manifest.json", "server_functions_manifest");

let parsedClientManifest = {};
if (clientManifestPath && fs.existsSync(clientManifestPath)) {
  try {
    parsedClientManifest = JSON.parse(fs.readFileSync(clientManifestPath, "utf8"));
  } catch (e) {}
}

let parsedServerFunctionsManifest = {};
if (sfManifestPath && fs.existsSync(sfManifestPath)) {
  try {
    parsedServerFunctionsManifest = JSON.parse(fs.readFileSync(sfManifestPath, "utf8"));
  } catch (e) {}
}

// ====================================================================
// Discovery of Client Components for SSR Engine & RSC Manifest
// ====================================================================
console.log("🔍 [Dinou Bun] Discovering client components for SSR Engine...");
const srcDir = path.resolve(projectRoot, "src");

function isSupportedClientModule(filePath, content) {
  const norm = filePath.replace(/\\/g, "/");
  // User code and Dinou framework code outside node_modules are always supported
  if (!norm.includes("node_modules")) {
    return true;
  }

  if (content === undefined && fs.existsSync(filePath)) {
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch (e) {
      return false;
    }
  }

  if (typeof content !== "string") return false;

  // SystemJS bundles (contain System.register) cannot run in ESM environments without the System loader
  if (content.includes("System.register(") || content.includes("System.registerDynamic(")) {
    return false;
  }

  // Legacy UMD/AMD wrappers lacking ES module or CommonJS exports
  if (content.includes("define.amd") && !content.includes("export ") && !content.includes("module.exports")) {
    return false;
  }

  return true;
}

function findClientComponents() {
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

  const coreCandidates = [
    ...Array.from(candidateLinkPaths),
    ...Array.from(candidateRedirectPaths),
  ];
  for (const f of coreCandidates) {
    if (fs.existsSync(f)) {
      clientFiles.add(path.resolve(f));
    }
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(projectRoot, "package.json"), "utf8"));
    const deps = Object.keys(pkg.dependencies || {});
    for (const dep of deps) {
      if (dep === "react" || dep === "react-dom" || dep === "dinou") continue;
      const depDir = path.resolve(projectRoot, "node_modules", dep);
      if (fs.existsSync(depDir)) {
        walk(depDir);
      }
    }
  } catch (e) {}

  for (const k of Object.keys(parsedClientManifest)) {
    const fileUrl = k.split("#")[0];
    if (fileUrl.startsWith("file:///")) {
      try {
        const filePath = fileURLToPath(fileUrl);
        const baseName = path.basename(filePath);
        if (baseName === "client.jsx" || baseName === "client-error.jsx" || baseName === "client-webpack.jsx" || baseName === "client-error-webpack.jsx") {
          continue;
        }
        if (fs.existsSync(filePath) && isSupportedClientModule(filePath)) {
          clientFiles.add(path.resolve(filePath));
        }
      } catch (e) {}
    }
  }

  return Array.from(clientFiles);
}

const clientComponents = findClientComponents();
console.log(`   Found ${clientComponents.length} client component(s) for Native SSR.`);

let manifestInlines = "";
const normalizedManifest = { ...parsedClientManifest };
for (const [k, v] of Object.entries(parsedClientManifest)) {
  if (k.startsWith("file:///c:/")) {
    normalizedManifest["file:///C:/" + k.slice(11)] = v;
  } else if (k.startsWith("file:///C:/")) {
    normalizedManifest["file:///c:/" + k.slice(11)] = v;
  }
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

let linkChunkId = null;
let redirectChunkId = null;
let linkEntry = null;
let redirectEntry = null;

for (const [k, v] of Object.entries(parsedClientManifest)) {
  if (k.includes("/core/link.jsx") || k.includes("dinouLink")) {
    if (v && v.id) {
      linkChunkId = v.id;
      linkEntry = v;
    }
  }
  if (k.includes("/core/client-redirect.jsx") || k.includes("dinouClientRedirect")) {
    if (v && v.id) {
      redirectChunkId = v.id;
      redirectEntry = v;
    }
  }
}

if (linkChunkId) {
  const linkChunks = isWebpackBuild
    ? (linkEntry?.chunks || [linkChunkId])
    : "Link";
  const linkDefaultChunks = isWebpackBuild
    ? (linkEntry?.chunks || [linkChunkId])
    : "default";

  for (const lp of candidateLinkPaths) {
    for (const url of generateAllUrlVariants(lp)) {
      normalizedManifest[`${url}#Link`] = { id: linkChunkId, chunks: linkChunks, name: "Link" };
      normalizedManifest[`${url}#default`] = { id: linkChunkId, chunks: linkDefaultChunks, name: "default" };
      normalizedManifest[url] = { id: linkChunkId, chunks: linkDefaultChunks, name: "default" };
    }
  }
}

if (redirectChunkId) {
  const redirectChunks = isWebpackBuild
    ? (redirectEntry?.chunks || [redirectChunkId])
    : "ClientRedirect";
  const redirectDefaultChunks = isWebpackBuild
    ? (redirectEntry?.chunks || [redirectChunkId])
    : "default";

  for (const rp of candidateRedirectPaths) {
    for (const url of generateAllUrlVariants(rp)) {
      normalizedManifest[`${url}#ClientRedirect`] = { id: redirectChunkId, chunks: redirectChunks, name: "ClientRedirect" };
      normalizedManifest[`${url}#default`] = { id: redirectChunkId, chunks: redirectDefaultChunks, name: "default" };
      normalizedManifest[url] = { id: redirectChunkId, chunks: redirectDefaultChunks, name: "default" };
    }
  }
}

for (const comp of clientComponents) {
  const fileUrl = pathToFileURL(comp).href;
  const fileUrlLower = fileUrl.replace(/file:\/\/\/([a-zA-Z]):/, (m, d) => 'file:///' + d.toLowerCase() + ':');
  const fileUrlUpper = fileUrl.replace(/file:\/\/\/([a-zA-Z]):/, (m, d) => 'file:///' + d.toUpperCase() + ':');
  const compResolved = path.resolve(comp);
  const isCoreLink = candidateLinkPaths.has(compResolved);
  const isCoreRedirect = candidateRedirectPaths.has(compResolved);

  if (!normalizedManifest[fileUrlLower]) {
    if (isCoreLink && linkChunkId) {
      normalizedManifest[fileUrlLower] = {
        id: linkChunkId,
        chunks: isWebpackBuild ? (linkEntry?.chunks || [linkChunkId]) : "default",
        name: "default",
      };
    } else if (isCoreRedirect && redirectChunkId) {
      normalizedManifest[fileUrlLower] = {
        id: redirectChunkId,
        chunks: isWebpackBuild ? (redirectEntry?.chunks || [redirectChunkId]) : "default",
        name: "default",
      };
    } else {
      normalizedManifest[fileUrlLower] = { id: fileUrlLower, chunks: [], name: "*" };
    }
  }
  if (!normalizedManifest[fileUrlUpper]) {
    if (isCoreLink && linkChunkId) {
      normalizedManifest[fileUrlUpper] = {
        id: linkChunkId,
        chunks: isWebpackBuild ? (linkEntry?.chunks || [linkChunkId]) : "default",
        name: "default",
      };
    } else if (isCoreRedirect && redirectChunkId) {
      normalizedManifest[fileUrlUpper] = {
        id: redirectChunkId,
        chunks: isWebpackBuild ? (redirectEntry?.chunks || [redirectChunkId]) : "default",
        name: "default",
      };
    } else {
      normalizedManifest[fileUrlUpper] = { id: fileUrlLower, chunks: [], name: "*" };
    }
  }
}

manifestInlines += `\nglobalThis.__DINOU_CLIENT_MANIFEST__ = ${JSON.stringify(normalizedManifest)};\n`;

if (sfManifestPath && fs.existsSync(sfManifestPath)) {
  const content = fs.readFileSync(sfManifestPath, "utf8");
  manifestInlines += `\nglobalThis.__DINOU_SERVER_FUNCTIONS_MANIFEST__ = ${content};\n`;
} else {
  manifestInlines += `\nglobalThis.__DINOU_SERVER_FUNCTIONS_MANIFEST__ = {};\n`;
}

const assetManifestPath = findManifest("manifest.json", "dist3");
if (assetManifestPath && fs.existsSync(assetManifestPath)) {
  const content = fs.readFileSync(assetManifestPath, "utf8");
  manifestInlines += `\nglobalThis.__DINOU_ASSET_MANIFEST__ = ${content};\n`;
} else {
  manifestInlines += `\nglobalThis.__DINOU_ASSET_MANIFEST__ = {};\n`;
}

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
    if (hashIdx !== -1) {
      specifier = specifier.slice(0, hashIdx);
    }
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
      for (const u of generateAllUrlVariants(lp)) {
        imports[u] = linkChunkId;
      }
    }
  }
  if (redirectChunkId) {
    imports["dinou/core/client-redirect.jsx"] = redirectChunkId;
    imports["dinou/core/client-redirect"] = redirectChunkId;
    imports["/dinou/core/client-redirect.jsx"] = redirectChunkId;
    imports["./dinou/core/client-redirect.jsx"] = redirectChunkId;
    for (const rp of candidateRedirectPaths) {
      for (const u of generateAllUrlVariants(rp)) {
        imports[u] = redirectChunkId;
      }
    }
  }

  importMapHtml = `<script type="importmap">{"imports":${JSON.stringify(imports)}}</script>`;
}

manifestInlines += `\nglobalThis.__DINOU_IMPORT_MAP_HTML__ = ${JSON.stringify(importMapHtml)};\n`;

console.log("⚡ [Dinou Bun] Building in-memory VFS for routing...");
const vfsSnapshot = {};
function walkVfs(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const children = [];
  for (const entry of entries) {
    const isDir = entry.isDirectory();
    children.push({ name: entry.name, isDirectory: isDir });
    const fullPath = path.join(dir, entry.name);
    const relFromSrc = path.relative(srcDir, fullPath).replace(/\\/g, "/");
    const edgePath = "/src/" + relFromSrc;
    const slashPath = fullPath.replace(/\\/g, "/");
    if (isDir) {
      walkVfs(fullPath);
    } else {
      vfsSnapshot[edgePath] = { type: "file" };
      vfsSnapshot[slashPath] = { type: "file" };
      if (slashPath.length > 2 && slashPath[1] === ":") {
        vfsSnapshot[slashPath.slice(2)] = { type: "file" };
      }
      vfsSnapshot["src/" + relFromSrc] = { type: "file" };
    }
  }
  const dirRel = path.relative(srcDir, dir).replace(/\\/g, "/");
  const edgeDir = dirRel ? "/src/" + dirRel : "/src";
  const dirSlash = dir.replace(/\\/g, "/");
  vfsSnapshot[edgeDir] = { type: "directory", children };
  vfsSnapshot[dirSlash] = { type: "directory", children };
  if (dirSlash.length > 2 && dirSlash[1] === ":") {
    vfsSnapshot[dirSlash.slice(2)] = { type: "directory", children };
  }
  vfsSnapshot[dirRel ? "src/" + dirRel : "src"] = { type: "directory", children };
}
walkVfs(srcDir);

const envSetupContent = `// Auto-generated environment setup
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
${manifestInlines}
globalThis.__DINOU_VFS__ = ${JSON.stringify(vfsSnapshot)};
`;
const envSetupPath = path.join(bunDir, "env-setup.js");
fs.writeFileSync(envSetupPath, envSetupContent, "utf8");

// Generate ssr-client-manifest.js
let ssrManifestCode = `// Auto-generated client modules registry for Native Bun SSR\n`;
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
  if (altFileUrl !== fileUrl) {
    addClientModule(altFileUrl, `mod_${index}`);
  }
});

for (const [k, v] of Object.entries(parsedClientManifest)) {
  const fileUrl = k.split("#")[0];
  if (fileUrl.startsWith("file:///")) {
    try {
      const filePath = fileURLToPath(fileUrl);
      if (fs.existsSync(filePath) && !isSupportedClientModule(filePath)) continue;
    } catch (e) {}
  }
  const compIndex = clientComponents.findIndex(
    (c) => pathToFileURL(c).href === fileUrl || pathToFileURL(c).href.toLowerCase() === fileUrl.toLowerCase()
  );
  if (compIndex !== -1 && v && v.id) {
    addClientModule(v.id, `mod_${compIndex}`);
  }
}

if (linkChunkId) {
  const linkCompIndex = clientComponents.findIndex((c) => candidateLinkPaths.has(path.resolve(c)));
  if (linkCompIndex !== -1) {
    addClientModule(linkChunkId, `mod_${linkCompIndex}`);
    for (const lp of candidateLinkPaths) {
      for (const u of generateAllUrlVariants(lp)) {
        addClientModule(u, `mod_${linkCompIndex}`);
      }
    }
  }
}
if (redirectChunkId) {
  const redirectCompIndex = clientComponents.findIndex((c) => candidateRedirectPaths.has(path.resolve(c)));
  if (redirectCompIndex !== -1) {
    addClientModule(redirectChunkId, `mod_${redirectCompIndex}`);
    for (const rp of candidateRedirectPaths) {
      for (const u of generateAllUrlVariants(rp)) {
        addClientModule(u, `mod_${redirectCompIndex}`);
      }
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
  if (altFullFileUrl !== fullFileUrl) {
    addClientModule(altFullFileUrl, `sf_${index}`);
  }
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
  if (altFileUrl !== fileUrl) {
    addModuleMap(altFileUrl, `{ "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } }`);
  }
});

for (const [k, v] of Object.entries(parsedClientManifest)) {
  const fileUrl = k.split("#")[0];
  if (fileUrl.startsWith("file:///")) {
    try {
      const filePath = fileURLToPath(fileUrl);
      if (fs.existsSync(filePath) && !isSupportedClientModule(filePath)) continue;
    } catch (e) {}
  }
  if (v && v.id) {
    addModuleMap(v.id, `{ "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } }`);
  }
}

if (linkChunkId) {
  const linkCompIndex = clientComponents.findIndex((c) => candidateLinkPaths.has(path.resolve(c)));
  if (linkCompIndex !== -1) {
    const fileUrl = pathToFileURL(clientComponents[linkCompIndex]).href;
    addModuleMap(linkChunkId, `{ "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } }`);
    for (const lp of candidateLinkPaths) {
      for (const u of generateAllUrlVariants(lp)) {
        addModuleMap(u, `{ "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } }`);
      }
    }
  }
}
if (redirectChunkId) {
  const redirectCompIndex = clientComponents.findIndex((c) => candidateRedirectPaths.has(path.resolve(c)));
  if (redirectCompIndex !== -1) {
    const fileUrl = pathToFileURL(clientComponents[redirectCompIndex]).href;
    addModuleMap(redirectChunkId, `{ "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } }`);
    for (const rp of candidateRedirectPaths) {
      for (const u of generateAllUrlVariants(rp)) {
        addModuleMap(u, `{ "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } }`);
      }
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
  if (altFullFileUrl !== fullFileUrl) {
    addServerModuleMap(altFullFileUrl, `{ id: ${JSON.stringify(relFileUrl)}, chunks: [], name: "*" }`);
  }

  const fns = parsedServerFunctionsManifest[relPath] || [];
  for (const fn of fns) {
    addServerModuleMap(relFileUrl + "#" + fn, `{ id: ${JSON.stringify(relFileUrl)}, chunks: [], name: ${JSON.stringify(fn)} }`);
    addServerModuleMap(fullFileUrl + "#" + fn, `{ id: ${JSON.stringify(relFileUrl)}, chunks: [], name: ${JSON.stringify(fn)} }`);
    if (altFullFileUrl !== fullFileUrl) {
      addServerModuleMap(altFullFileUrl + "#" + fn, `{ id: ${JSON.stringify(relFileUrl)}, chunks: [], name: ${JSON.stringify(fn)} }`);
    }
  }
});

ssrManifestCode += `  },\n  moduleLoading: null,\n};\n`;

const ssrClientManifestPath = path.join(bunDir, "ssr-client-manifest.js");
fs.writeFileSync(ssrClientManifestPath, ssrManifestCode, "utf8");

// ====================================================================
// Entry Files Generation
// ====================================================================
// 1. RSC Engine Entry
const rscEntryContent = `// Auto-generated RSC Engine entry for Bun (Dual-Bundle)
import "./env-setup.js";
import "./route-modules.js";
export { handleRequest } from "${dinouDirSlash}/core/handler.js";
`;
const rscEntryPath = path.join(bunDir, "rsc-entry.js");
fs.writeFileSync(rscEntryPath, rscEntryContent, "utf8");

// 2. SSR Engine Entry
const ssrEntryContent = `// Auto-generated SSR Engine entry for Bun (Dual-Bundle)
import { renderRscStreamToHtmlStream } from "${dinouDirSlash}/core/edge-ssr.js";
import { clientModules, ssrConsumerManifest } from "./ssr-client-manifest.js";

globalThis.__webpack_require__ = (id) => {
  if (clientModules[id]) return clientModules[id];
  const alt = id.startsWith("file:///c:/")
    ? id.replace("file:///c:/", "file:///C:/")
    : id.startsWith("file:///C:/")
    ? id.replace("file:///C:/", "file:///c:/")
    : id;
  if (clientModules[alt]) return clientModules[alt];
  console.error("[SSR Engine] Module not found in __webpack_require__:", id);
  return {};
};
globalThis.__webpack_require__.u = (chunkId) => "" + chunkId + ".js";
globalThis.__webpack_chunk_load__ = () => Promise.resolve();

export async function renderHtml(rscStream, options = {}) {
  return renderRscStreamToHtmlStream(rscStream, ssrConsumerManifest, options);
}
`;
const ssrEntryPath = path.join(bunDir, "ssr-entry.js");
fs.writeFileSync(ssrEntryPath, ssrEntryContent, "utf8");

// 3. Bun Orchestrator Entry
const bunEntryContent = `// Auto-generated main entry for Bun (Dual-Bundle)
import { handleRequest } from "./rsc-engine.js";
import { renderHtml } from "./ssr-engine.js";
import {
  setStorageAdapter,
  FileSystemStorage,
  MemoryStorage,
} from "${dinouDirSlash}/core/storage-adapter.js";
import * as path from "node:path";
import * as fs from "node:fs";

if (typeof globalThis !== "undefined") {
  globalThis.__DINOU_RUNTIME__ = "bun-bundle";
}

let storageInitialized = false;

function initStorage() {
  if (!storageInitialized) {
    try {
      const cwd = typeof process !== "undefined" && typeof process.cwd === "function" ? process.cwd() : ".";
      const dist2Dir = path.resolve(cwd, ".dinou/dist2");
      setStorageAdapter(new FileSystemStorage(dist2Dir));
    } catch (e) {
      setStorageAdapter(new MemoryStorage());
    }
    storageInitialized = true;
  }
}

const PORT = Number(process.env.PORT || 3000);
const cwd = typeof process !== "undefined" && typeof process.cwd === "function" ? process.cwd() : ".";
const dist3Dir = path.resolve(cwd, ".dinou/dist3");

export async function fetch(req) {
  initStorage();

  const url = new URL(req.url);
  const pathname = url.pathname;

  // Static assets delivery (Zero-copy with Bun.file)
  if (pathname !== "/") {
    const filePath = path.join(dist3Dir, pathname);
    const file = Bun.file(filePath);
    if (await file.exists()) {
      return new Response(file);
    }
  }

  return handleRequest(req, {
    runtime: "bun-bundle",
    renderHtmlStream: renderHtml,
  });
}

export default {
  port: PORT,
  fetch,
};
`;
const bunEntryPath = path.join(bunDir, "bun-entry.js");
fs.writeFileSync(bunEntryPath, bunEntryContent, "utf8");

// ====================================================================
// Build Configuration
// ====================================================================
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

const externalList = [
  "bun",
  "bun:*",
  ...nodeBuiltins,
  ...nodeBuiltins.map((b) => "node:" + b),
];

const commonAlias = {
  "@": path.resolve(projectRoot, "src"),
  dinou: dinouDir,
};

const commonLoader = {
  ".js": "jsx",
  ".jsx": "jsx",
  ".ts": "ts",
  ".tsx": "tsx",
  ".json": "json",
  ".css": "empty",
  ".svg": "dataurl",
  ".png": "dataurl",
  ".jpg": "dataurl",
  ".jpeg": "dataurl",
  ".webp": "dataurl",
  ".ico": "dataurl",
};

const banner = {
  js: `import { createRequire as ___createRequire } from 'node:module';
import { AsyncLocalStorage as ___AsyncLocalStorage } from 'node:async_hooks';
const require = ___createRequire(import.meta.url || 'file:///server.js');
const __dirname = '';
const __filename = '';
globalThis.__dinou_require__ = require;
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

// Plugins for RSC Engine
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
      try {
        code = fs.readFileSync(args.path, "utf8");
      } catch (e) {
        return null;
      }

      if (!isSupportedClientModule(args.path, code)) return null;
      if (!useClientRegex.test(code.trim())) return null;

      const exports = parseExports(code);
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

      return {
        contents: proxyCode,
        loader: "js",
      };
    });
  },
};

const serverReferencesPlugin = {
  name: "dinou-server-references",
  setup(build) {
    build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
      if (args.path.includes("node_modules")) return null;

      let code;
      try {
        code = fs.readFileSync(args.path, "utf8");
      } catch (e) {
        return null;
      }

      if (!useServerRegex.test(code.trim())) return null;

      const exports = parseExports(code);
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
      const loader = ext === ".ts" ? "ts" : ext === ".tsx" ? "tsx" : ext === ".jsx" ? "jsx" : "js";

      return {
        contents: transformed,
        loader,
      };
    });
  },
};

// Plugin for SSR Engine (Register server functions with client.edge)
const serverReferencesPluginSsr = {
  name: "dinou-server-references-ssr",
  setup(build) {
    build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
      if (args.path.includes("node_modules")) return null;

      let code;
      try {
        code = fs.readFileSync(args.path, "utf8");
      } catch (e) {
        return null;
      }

      if (!useServerRegex.test(code.trim())) return null;

      const exports = parseExports(code);
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
      const loader = ext === ".ts" ? "ts" : ext === ".tsx" ? "tsx" : ext === ".jsx" ? "jsx" : "js";

      return {
        contents: transformed,
        loader,
      };
    });
  },
};

const rscOutfile = path.join(bunDir, "rsc-engine.js");
const ssrOutfile = path.join(bunDir, "ssr-engine.js");
const finalOutfile = path.join(bunDir, "server.js");

try {
  // Pass A: RSC Engine
  console.log("🚀 [Dinou Bun] Bundling Pass A: RSC Engine (conditions: react-server)...");
  await esbuild.build({
    entryPoints: [rscEntryPath],
    outfile: rscOutfile,
    bundle: true,
    format: "esm",
    target: "es2022",
    platform: "neutral",
    mainFields: ["module", "main"],
    conditions: ["bun", "worker", "react-server"],
    external: externalList,
    plugins: [clientReferencesPlugin, serverReferencesPlugin],
    alias: commonAlias,
    loader: commonLoader,
    jsx: "automatic",
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.DINOU_RUNTIME": '"bun-bundle"',
      "process.env.DINOU_BUILD_TOOL": JSON.stringify(isWebpackBuild ? "webpack" : (process.env.DINOU_BUILD_TOOL || "esbuild")),
    },
    logLevel: "warning",
  });

  // Pass B: SSR Engine
  console.log("🚀 [Dinou Bun] Bundling Pass B: Native SSR Engine (conditions: browser)...");
  await esbuild.build({
    entryPoints: [ssrEntryPath],
    outfile: ssrOutfile,
    bundle: true,
    format: "esm",
    target: "es2022",
    platform: "neutral",
    mainFields: ["module", "main"],
    conditions: ["bun", "worker", "browser"],
    external: externalList,
    plugins: [serverReferencesPluginSsr],
    alias: commonAlias,
    loader: commonLoader,
    jsx: "automatic",
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.DINOU_RUNTIME": '"bun-bundle"',
      "process.env.DINOU_BUILD_TOOL": JSON.stringify(isWebpackBuild ? "webpack" : (process.env.DINOU_BUILD_TOOL || "esbuild")),
    },
    logLevel: "warning",
  });

  // Pass C: Final Bun Orchestrator
  console.log("🚀 [Dinou Bun] Bundling Pass C: Bun Orchestrator (server.js)...");
  await esbuild.build({
    entryPoints: [bunEntryPath],
    outfile: finalOutfile,
    bundle: true,
    format: "esm",
    target: "es2022",
    platform: "neutral",
    mainFields: ["module", "main"],
    conditions: ["bun", "worker", "browser"],
    external: externalList,
    banner,
    alias: commonAlias,
    loader: commonLoader,
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.DINOU_RUNTIME": '"bun-bundle"',
      "process.env.DINOU_BUILD_TOOL": JSON.stringify(isWebpackBuild ? "webpack" : (process.env.DINOU_BUILD_TOOL || "esbuild")),
    },
    logLevel: "warning",
  });

  console.log(`\n🎉 [Dinou Bun] Pre-bundled AOT build successful!`);
  console.log(`   Output file: ${finalOutfile}`);
  console.log(`   Run with: bun ${finalOutfile}`);
  console.log(`   Or compile standalone: bun build --compile ${finalOutfile} --outfile dist/server\n`);
} catch (err) {
  console.error("❌ [Dinou Bun] Build failed:", err);
  process.exit(1);
}
