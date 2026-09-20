// dinou/deno/build.mjs
// Build script for packaging Dinou v7 for Deno Deploy & Edge.

import fs from "node:fs";
import path from "node:path";
import esbuild from "esbuild";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { generateRouteModulesCode } = require("../core/route-generator.js");
const parseExports = require("../core/parse-exports.js");
const { useClientRegex } = require("../constants.js");

const projectRoot = process.cwd();
const denoDir = path.resolve(projectRoot, ".dinou/deno");
fs.mkdirSync(denoDir, { recursive: true });

// Locate dinou root: ejected in project or in package directory
const dinouDir = fs.existsSync(path.resolve(projectRoot, "dinou"))
  ? path.resolve(projectRoot, "dinou")
  : path.resolve(__dirname, "..");
const handlerPath = path.resolve(dinouDir, "core/handler.js").replace(/\\/g, "/");
const storagePath = path.resolve(dinouDir, "core/storage-adapter.js").replace(/\\/g, "/");

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
  const rawManifest = JSON.parse(fs.readFileSync(clientManifestPath, "utf8"));
  const normalizedManifest = { ...rawManifest };
  for (const [k, v] of Object.entries(rawManifest)) {
    if (k.startsWith("file:///c:/")) {
      normalizedManifest["file:///C:/" + k.slice(11)] = v;
    } else if (k.startsWith("file:///C:/")) {
      normalizedManifest["file:///c:/" + k.slice(11)] = v;
    }
  }
  manifestInlines += `\nglobalThis.__DINOU_CLIENT_MANIFEST__ = ${JSON.stringify(normalizedManifest)};\n`;
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
import { handleRequest } from "${handlerPath}";
import { setStorageAdapter, DenoKVStorage } from "${storagePath}";

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

const clientReferencesPlugin = {
  name: "dinou-client-references",
  setup(build) {
    build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
      if (args.path.includes("node_modules")) return null;
      const normalizedPath = args.path.replace(/\\/g, "/");
      if (normalizedPath.includes("dinou/core/navigation")) return null;

      let code;
      try {
        code = fs.readFileSync(args.path, "utf8");
      } catch (e) {
        return null;
      }

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
    plugins: [clientReferencesPlugin],
    banner: {
      js: "import { createRequire as ___createRequire } from 'node:module'; const require = ___createRequire(import.meta.url || 'file:///deno-entry.js'); const __dirname = ''; const __filename = ''; globalThis.__dinou_require__ = require;",
    },
    alias: {
      "@": path.resolve(projectRoot, "src"),
      dinou: dinouDir,
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
