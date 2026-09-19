// dinou/cloudflare/build.mjs
// Build script for packaging Dinou v7 for Cloudflare Workers.

import fs from "node:fs";
import path from "node:path";
import esbuild from "esbuild";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { generateRouteModulesCode } = require("../core/route-generator.js");

const projectRoot = process.cwd();
const cloudflareDir = path.resolve(projectRoot, ".dinou/cloudflare");
fs.mkdirSync(cloudflareDir, { recursive: true });

console.log("⚡ [Dinou Cloudflare] Generating static route modules...");
const routeModulesCode = generateRouteModulesCode(projectRoot, "../..");
const routeModulesPath = path.join(cloudflareDir, "route-modules.js");
fs.writeFileSync(routeModulesPath, routeModulesCode, "utf8");

console.log("📦 [Dinou Cloudflare] Preparing worker entry point...");

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

const workerEntryContent = `// Auto-generated worker entry for Cloudflare Workers
import "./route-modules.js";
${manifestInlines}
import worker from "../../dinou/adapters/cloudflare.js";

export default worker;
`;

const workerEntryPath = path.join(cloudflareDir, "worker-entry.js");
fs.writeFileSync(workerEntryPath, workerEntryContent, "utf8");

console.log("🚀 [Dinou Cloudflare] Bundling worker with esbuild...");

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
  "cloudflare:*",
  ...nodeBuiltins,
  ...nodeBuiltins.map((b) => "node:" + b),
];

const outfile = path.join(cloudflareDir, "worker.js");

try {
  await esbuild.build({
    entryPoints: [workerEntryPath],
    outfile,
    bundle: true,
    format: "esm",
    target: "es2022",
    platform: "neutral",
    mainFields: ["module", "main"],
    conditions: ["workerd", "worker", "react-server", "browser"],
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
      "process.env.DINOU_RUNTIME": '"edge"',
    },
    logLevel: "info",
  });

  console.log(`✅ [Dinou Cloudflare] Worker bundled successfully: ${outfile}`);
  console.log("👉 Deploy to Cloudflare using: npx wrangler deploy");
} catch (err) {
  console.error("❌ [Dinou Cloudflare] Worker bundling failed:", err);
  process.exit(1);
}
