// dinou/deno/build.mjs
// Dual-Bundle Build script for packaging Dinou v7 for Deno Deploy & Edge.
// Pass A: RSC Engine (conditions: ["deno", "worker", "react-server"])
// Pass B: Native Streaming HTML SSR Engine (conditions: ["deno", "worker", "browser"])
// Pass C: Main Deno Orchestrator (main.js)

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
const denoDir = path.resolve(projectRoot, ".dinou/deno");
fs.mkdirSync(denoDir, { recursive: true });

// Locate dinou root: ejected in project or in package directory
const dinouDir = fs.existsSync(path.resolve(projectRoot, "dinou"))
  ? path.resolve(projectRoot, "dinou")
  : path.resolve(__dirname, "..");
const dinouDirSlash = dinouDir.replace(/\\/g, "/");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return 0;
  let count = 0;
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      count += copyRecursive(srcPath, destPath);
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

const dist2Dir = path.resolve(projectRoot, ".dinou/dist2");
const dist3Dir = path.resolve(projectRoot, ".dinou/dist3");
if (fs.existsSync(dist2Dir)) {
  console.log("📄 [Dinou Deno] Synchronizing pre-rendered static HTML and RSC from .dinou/dist2 to .dinou/dist3...");
  const copiedCount = copyRecursive(dist2Dir, dist3Dir);
  console.log(`   Copied ${copiedCount} pre-rendered file(s) for Deno Deploy Static Assets.`);
}

console.log("⚡ [Dinou Deno] Generating static route modules...");
const routeModulesCode = generateRouteModulesCode(projectRoot, "../..");
const routeModulesPath = path.join(denoDir, "route-modules.js");
fs.writeFileSync(routeModulesPath, routeModulesCode, "utf8");

// Check manifests from build (supports Esbuild, Rollup, and Webpack output locations)
function findManifest(filename, fallbackFolder) {
  const candidates = [
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
console.log("🔍 [Dinou Deno] Discovering client components for SSR Engine...");
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
    path.resolve(dinouDir, "core/client-redirect.jsx"),
    path.resolve(dinouDir, "core/link.jsx"),
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

for (const comp of clientComponents) {
  const fileUrl = pathToFileURL(comp).href;
  const fileUrlLower = fileUrl.replace(/file:\/\/\/([a-zA-Z]):/, (m, d) => 'file:///' + d.toLowerCase() + ':');
  const fileUrlUpper = fileUrl.replace(/file:\/\/\/([a-zA-Z]):/, (m, d) => 'file:///' + d.toUpperCase() + ':');
  if (!normalizedManifest[fileUrlLower]) {
    normalizedManifest[fileUrlLower] = { id: fileUrlLower, chunks: [], name: "*" };
  }
  if (!normalizedManifest[fileUrlUpper]) {
    normalizedManifest[fileUrlUpper] = { id: fileUrlLower, chunks: [], name: "*" };
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
const isWebpackBuild = process.env.DINOU_BUILD_TOOL === "webpack";
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
    const dinouIdx = key.indexOf("/dinou/");
    if (dinouIdx !== -1) {
      const dinouRel = "dinou/" + key.slice(dinouIdx + 7).split("#")[0];
      imports[dinouRel] = val.id;
      imports["/" + dinouRel] = val.id;
      imports["./" + dinouRel] = val.id;
    }
  }

  importMapHtml = `<script type="importmap">{"imports":${JSON.stringify(imports)}}</script>`;
}

manifestInlines += `\nglobalThis.__DINOU_IMPORT_MAP_HTML__ = ${JSON.stringify(importMapHtml)};\n`;

console.log("⚡ [Dinou Deno] Building in-memory VFS for Edge routing...");
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
${manifestInlines}
globalThis.__DINOU_VFS__ = ${JSON.stringify(vfsSnapshot)};
`;
const envSetupPath = path.join(denoDir, "env-setup.js");
fs.writeFileSync(envSetupPath, envSetupContent, "utf8");

// Generate ssr-client-manifest.js
let ssrManifestCode = `// Auto-generated client modules registry for Native Edge SSR\n`;
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
clientComponents.forEach((compPath, index) => {
  const fileUrl = pathToFileURL(compPath).href;
  const altFileUrl = fileUrl.replace(/file:\/\/\/([a-zA-Z]):/, (m, d) => 'file:///' + (d === d.toLowerCase() ? d.toUpperCase() : d.toLowerCase()) + ':');
  ssrManifestCode += `  ${JSON.stringify(fileUrl)}: mod_${index},\n`;
  if (altFileUrl !== fileUrl) {
    ssrManifestCode += `  ${JSON.stringify(altFileUrl)}: mod_${index},\n`;
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
    ssrManifestCode += `  ${JSON.stringify(v.id)}: mod_${compIndex},\n`;
  }
}

serverFunctionFiles.forEach((relPath, index) => {
  const normRel = relPath.replace(/\\/g, "/");
  const relFileUrl = "file:///" + normRel;
  const absPath = path.resolve(projectRoot, relPath);
  const fullFileUrl = pathToFileURL(absPath).href;
  const altFullFileUrl = fullFileUrl.replace(/file:\/\/\/([a-zA-Z]):/, (m, d) => 'file:///' + (d === d.toLowerCase() ? d.toUpperCase() : d.toLowerCase()) + ':');

  ssrManifestCode += `  ${JSON.stringify(relFileUrl)}: sf_${index},\n`;
  ssrManifestCode += `  ${JSON.stringify(fullFileUrl)}: sf_${index},\n`;
  if (altFullFileUrl !== fullFileUrl) {
    ssrManifestCode += `  ${JSON.stringify(altFullFileUrl)}: sf_${index},\n`;
  }
});
ssrManifestCode += `};\n\n`;

ssrManifestCode += `export const ssrConsumerManifest = {\n  moduleMap: {\n`;
clientComponents.forEach((compPath) => {
  const fileUrl = pathToFileURL(compPath).href;
  const altFileUrl = fileUrl.replace(/file:\/\/\/([a-zA-Z]):/, (m, d) => 'file:///' + (d === d.toLowerCase() ? d.toUpperCase() : d.toLowerCase()) + ':');
  ssrManifestCode += `    ${JSON.stringify(fileUrl)}: { "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } },\n`;
  if (altFileUrl !== fileUrl) {
    ssrManifestCode += `    ${JSON.stringify(altFileUrl)}: { "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } },\n`;
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
    ssrManifestCode += `    ${JSON.stringify(v.id)}: { "*": { id: ${JSON.stringify(fileUrl)}, chunks: [], name: "*" } },\n`;
  }
}
ssrManifestCode += `  },\n  serverModuleMap: {\n`;

serverFunctionFiles.forEach((relPath) => {
  const normRel = relPath.replace(/\\/g, "/");
  const relFileUrl = "file:///" + normRel;
  const absPath = path.resolve(projectRoot, relPath);
  const fullFileUrl = pathToFileURL(absPath).href;
  const altFullFileUrl = fullFileUrl.replace(/file:\/\/\/([a-zA-Z]):/, (m, d) => 'file:///' + (d === d.toLowerCase() ? d.toUpperCase() : d.toLowerCase()) + ':');

  ssrManifestCode += `    ${JSON.stringify(relFileUrl)}: { id: ${JSON.stringify(relFileUrl)}, chunks: [], name: "*" },\n`;
  ssrManifestCode += `    ${JSON.stringify(fullFileUrl)}: { id: ${JSON.stringify(relFileUrl)}, chunks: [], name: "*" },\n`;
  if (altFullFileUrl !== fullFileUrl) {
    ssrManifestCode += `    ${JSON.stringify(altFullFileUrl)}: { id: ${JSON.stringify(relFileUrl)}, chunks: [], name: "*" },\n`;
  }

  const fns = parsedServerFunctionsManifest[relPath] || [];
  for (const fn of fns) {
    ssrManifestCode += `    ${JSON.stringify(relFileUrl + "#" + fn)}: { id: ${JSON.stringify(relFileUrl)}, chunks: [], name: ${JSON.stringify(fn)} },\n`;
    ssrManifestCode += `    ${JSON.stringify(fullFileUrl + "#" + fn)}: { id: ${JSON.stringify(relFileUrl)}, chunks: [], name: ${JSON.stringify(fn)} },\n`;
    if (altFullFileUrl !== fullFileUrl) {
      ssrManifestCode += `    ${JSON.stringify(altFullFileUrl + "#" + fn)}: { id: ${JSON.stringify(relFileUrl)}, chunks: [], name: ${JSON.stringify(fn)} },\n`;
    }
  }
});

ssrManifestCode += `  },\n  moduleLoading: null,\n};\n`;

const ssrClientManifestPath = path.join(denoDir, "ssr-client-manifest.js");
fs.writeFileSync(ssrClientManifestPath, ssrManifestCode, "utf8");

// ====================================================================
// Entry Files Generation
// ====================================================================
// 1. RSC Engine Entry
const rscEntryContent = `// Auto-generated RSC Engine entry for Deno Deploy / Edge
import "./env-setup.js";
import "./route-modules.js";
export { handleRequest } from "${dinouDirSlash}/core/handler.js";
`;
const rscEntryPath = path.join(denoDir, "rsc-entry.js");
fs.writeFileSync(rscEntryPath, rscEntryContent, "utf8");

// 2. SSR Engine Entry
const ssrEntryContent = `// Auto-generated SSR Engine entry for Deno Deploy / Edge
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
globalThis.__webpack_chunk_load__ = () => Promise.resolve();

export async function renderHtml(rscStream, options = {}) {
  return renderRscStreamToHtmlStream(rscStream, ssrConsumerManifest, options);
}
`;
const ssrEntryPath = path.join(denoDir, "ssr-entry.js");
fs.writeFileSync(ssrEntryPath, ssrEntryContent, "utf8");

// 3. Deno Orchestrator Entry
const denoEntryContent = `// Auto-generated main entry for Deno Deploy / Edge (Dual-Bundle)
import { handleRequest } from "./rsc-engine.js";
import { renderHtml } from "./ssr-engine.js";
import {
  getStorageAdapter,
  setStorageAdapter,
  DenoKVStorage,
  MemoryStorage,
} from "${dinouDirSlash}/core/storage-adapter.js";
import * as path from "node:path";
import * as fs from "node:fs";

if (typeof globalThis !== "undefined") {
  globalThis.__DINOU_RUNTIME__ = "deno-edge";
}

let storageInitialized = false;

export async function fetch(req) {
  if (!storageInitialized) {
    if (typeof Deno !== "undefined" && typeof Deno.openKv === "function") {
      try {
        setStorageAdapter(new DenoKVStorage());
      } catch (e) {
        setStorageAdapter(new MemoryStorage());
      }
    } else {
      setStorageAdapter(new MemoryStorage());
    }
    storageInitialized = true;
  }

  const url = new URL(req.url);
  const pathname = url.pathname;

  // Static assets delivery (if running with local disk access)
  if (pathname !== "/" && typeof Deno !== "undefined" && typeof Deno.readFile === "function") {
    try {
      const cwd = typeof Deno.cwd === "function" ? Deno.cwd() : process.cwd();
      const dist3Dir = path.resolve(cwd, ".dinou/dist3");
      const filePath = path.join(dist3Dir, pathname);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const content = await Deno.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const headers = {};
        if (ext === ".js" || ext === ".mjs") headers["content-type"] = "application/javascript; charset=utf-8";
        else if (ext === ".css") headers["content-type"] = "text/css; charset=utf-8";
        else if (ext === ".json") headers["content-type"] = "application/json";
        else if (ext === ".svg") headers["content-type"] = "image/svg+xml";
        else if (ext === ".png") headers["content-type"] = "image/png";
        else if (ext === ".ico") headers["content-type"] = "image/x-icon";
        return new Response(content, { headers });
      }
    } catch (e) {
      // Fallback to Dinou handler
    }
  }

  return handleRequest(req, {
    runtime: "deno-edge",
    renderHtmlStream: renderHtml,
  });
}

if (typeof Deno !== "undefined" && typeof Deno.serve === "function") {
  const port = Number(Deno.env.get("PORT") || 8000);
  Deno.serve({ port }, fetch);
}

export default { fetch };
`;
const denoEntryPath = path.join(denoDir, "deno-entry.js");
fs.writeFileSync(denoEntryPath, denoEntryContent, "utf8");

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
  "npm:*",
  "jsr:*",
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
const require = ___createRequire(import.meta.url || 'file:///main.js');
const __dirname = '';
const __filename = '';
globalThis.__dinou_require__ = require;
if (typeof globalThis.AsyncLocalStorage === 'undefined' && typeof ___AsyncLocalStorage !== 'undefined') {
  globalThis.AsyncLocalStorage = ___AsyncLocalStorage;
}`,
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

const rscOutfile = path.join(denoDir, "rsc-engine.js");
const ssrOutfile = path.join(denoDir, "ssr-engine.js");
const finalOutfile = path.join(denoDir, "main.js");

try {
  // Pass A: RSC Engine
  console.log("🚀 [Dinou Deno] Bundling Pass A: RSC Engine (conditions: react-server)...");
  await esbuild.build({
    entryPoints: [rscEntryPath],
    outfile: rscOutfile,
    bundle: true,
    format: "esm",
    target: "es2022",
    platform: "neutral",
    mainFields: ["module", "main"],
    conditions: ["deno", "worker", "react-server"],
    external: externalList,
    plugins: [clientReferencesPlugin, serverReferencesPlugin],
    alias: commonAlias,
    loader: commonLoader,
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.DINOU_RUNTIME": '"deno-edge"',
    },
    logLevel: "warning",
  });

  // Pass B: SSR Engine
  console.log("🚀 [Dinou Deno] Bundling Pass B: Native SSR Engine (conditions: browser)...");
  await esbuild.build({
    entryPoints: [ssrEntryPath],
    outfile: ssrOutfile,
    bundle: true,
    format: "esm",
    target: "es2022",
    platform: "neutral",
    mainFields: ["module", "main"],
    conditions: ["deno", "worker", "browser"],
    external: externalList,
    plugins: [serverReferencesPluginSsr],
    alias: commonAlias,
    loader: commonLoader,
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.DINOU_RUNTIME": '"deno-edge"',
    },
    logLevel: "warning",
  });

  // Pass C: Final Deno Orchestrator
  console.log("🚀 [Dinou Deno] Bundling Pass C: Deno Orchestrator...");
  await esbuild.build({
    entryPoints: [denoEntryPath],
    outfile: finalOutfile,
    bundle: true,
    format: "esm",
    target: "es2022",
    platform: "neutral",
    mainFields: ["module", "main"],
    conditions: ["deno", "worker", "browser"],
    external: externalList,
    banner,
    alias: commonAlias,
    loader: commonLoader,
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.DINOU_RUNTIME": '"deno-edge"',
    },
    logLevel: "warning",
  });

  console.log(`\n🎉 [Dinou Deno] Dual-Bundle build successful!`);
  console.log(`   Output file: ${finalOutfile}`);
  console.log(`   Deploy with: deployctl deploy --project=<your-project> ${finalOutfile}\n`);
} catch (err) {
  console.error("❌ [Dinou Deno] Build failed:", err);
  process.exit(1);
}
