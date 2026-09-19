// dinou/deno/build.mjs
// Build script for packaging Dinou v7 for Deno Deploy & Edge.

import fs from "node:fs";
import path from "node:path";
import esbuild from "esbuild";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { generateRouteModulesCode } = require("../core/route-generator.js");

const projectRoot = process.cwd();
const denoDir = path.resolve(projectRoot, ".dinou/deno");
fs.mkdirSync(denoDir, { recursive: true });

console.log("⚡ [Dinou Deno Edge] Generating static route modules...");
const routeModulesCode = generateRouteModulesCode(projectRoot, "../..");
const routeModulesPath = path.join(denoDir, "route-modules.js");
fs.writeFileSync(routeModulesPath, routeModulesCode, "utf8");

console.log("📦 [Dinou Deno Edge] Preparing Deno Deploy entry point...");

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

let manifestInlines = "";
if (clientManifestPath) {
  const content = fs.readFileSync(clientManifestPath, "utf8");
  manifestInlines += `\nglobalThis.__DINOU_CLIENT_MANIFEST__ = ${content};\n`;
} else {
  manifestInlines += `\nglobalThis.__DINOU_CLIENT_MANIFEST__ = {};\n`;
}

if (sfManifestPath) {
  const content = fs.readFileSync(sfManifestPath, "utf8");
  manifestInlines += `\nglobalThis.__DINOU_SERVER_FUNCTIONS_MANIFEST__ = ${content};\n`;
} else {
  manifestInlines += `\nglobalThis.__DINOU_SERVER_FUNCTIONS_MANIFEST__ = {};\n`;
}

const denoEntryContent = `// Auto-generated entry for Deno Deploy / Edge
import "./route-modules.js";
${manifestInlines}
import { handleRequest } from "../../dinou/core/handler.js";
import { setStorageAdapter, DenoKVStorage } from "../../dinou/core/storage-adapter.js";

// Auto-configure Deno KV Storage for ISR on Edge
if (typeof Deno !== "undefined" && typeof Deno.openKv === "function") {
  setStorageAdapter(new DenoKVStorage());
}

export async function fetch(req) {
  return handleRequest(req, { runtime: "deno-edge" });
}

if (typeof Deno !== "undefined" && typeof Deno.serve === "function") {
  const port = Number(Deno.env.get("PORT") || 8000);
  Deno.serve({ port }, fetch);
}

export default { fetch };
`;

const denoEntryPath = path.join(denoDir, "deno-entry.js");
fs.writeFileSync(denoEntryPath, denoEntryContent, "utf8");

console.log("🚀 [Dinou Deno Edge] Bundling edge application with esbuild...");

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

const outfile = path.join(denoDir, "main.js");

try {
  await esbuild.build({
    entryPoints: [denoEntryPath],
    outfile,
    bundle: true,
    format: "esm",
    target: "es2022",
    platform: "neutral",
    mainFields: ["module", "main"],
    conditions: ["deno", "worker", "react-server", "browser"],
    external: externalList,
    alias: {
      "@": path.resolve(projectRoot, "src"),
      dinou: path.resolve(projectRoot, "dinou"),
    },
    loader: {
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
    },
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.DINOU_RUNTIME": '"deno-edge"',
    },
    logLevel: "info",
  });

  console.log(`\n🎉 [Dinou Deno Edge] Build successful!`);
  console.log(`   Output file: ${outfile}`);
  console.log(`   Deploy with: deployctl deploy --project=<your-project> ${outfile}\n`);
} catch (err) {
  console.error("❌ [Dinou Deno Edge] Build failed:", err);
  process.exit(1);
}
