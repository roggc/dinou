// dinou/node/build.mjs
// Dual-Bundle Build script for packaging Dinou v7 for Node.js (Pre-bundled AOT Standalone).
// Pass A & Pass B: Handled via bundleDualEngine
// Pass C: Main Node Orchestrator (.dinou/node/server.js)

import fs from "node:fs";
import path from "node:path";
import esbuild from "esbuild";
import { fileURLToPath } from "node:url";
import { bundleDualEngine } from "./bundle-dual-engine.mjs";

const projectRoot = process.cwd();
const nodeDir = path.resolve(projectRoot, ".dinou/node");
fs.mkdirSync(nodeDir, { recursive: true });

try {
  console.log("⚡ [Dinou Node] Compiling Pass A (RSC) and Pass B (SSR) via Dual-Engine Compiler...");
  const engineResult = await bundleDualEngine({
    isDev: false,
    projectRoot,
    outDir: ".dinou/node",
  });

  const { dinouDirSlash, externalList, banner, commonAlias, commonLoader, isWebpackBuild } = engineResult;

  // Pass C: Node Orchestrator Entry
  const nodeEntryContent = `// Auto-generated main entry for Node.js (Dual-Bundle)
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import { handleRequest } from "./rsc-engine.mjs";
import { renderHtml } from "./ssr-engine.mjs";
import {
  setStorageAdapter,
  FileSystemStorage,
  MemoryStorage,
} from "${dinouDirSlash}/core/storage-adapter.js";
import {
  nodeToWebRequest,
  sendWebResponseToNode,
} from "${dinouDirSlash}/core/http-adapter.js";

if (typeof globalThis !== "undefined") {
  globalThis.__DINOU_RUNTIME__ = "node-bundle";
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

const cwd = typeof process !== "undefined" && typeof process.cwd === "function" ? process.cwd() : ".";
const dist3Dir = path.resolve(cwd, ".dinou/dist3");

export async function fetch(req) {
  initStorage();

  const url = new URL(req.url);
  const pathname = url.pathname;

  // Static assets delivery (Zero-copy with Node streams)
  if (pathname !== "/") {
    const filePath = path.join(dist3Dir, pathname);
    if (fs.existsSync(filePath)) {
      try {
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          const nodeStream = fs.createReadStream(filePath);
          const webStream = Readable.toWeb(nodeStream);
          const ext = path.extname(filePath).toLowerCase();
          const contentType = MIME_TYPES[ext] || "application/octet-stream";
          return new Response(webStream, {
            headers: {
              "content-type": contentType,
              "content-length": String(stat.size),
              "cache-control": "public, max-age=31536000, immutable",
            },
          });
        }
      } catch (e) {}
    }
  }

  return handleRequest(req, {
    runtime: "node-bundle",
    renderHtmlStream: renderHtml,
  });
}

const PORT = Number(process.env.PORT || 3000);

export function startServer(port = PORT, host = "0.0.0.0") {
  const server = http.createServer(async (req, res) => {
    try {
      const webReq = nodeToWebRequest(req);
      const webRes = await fetch(webReq);
      await sendWebResponseToNode(webRes, res);
    } catch (err) {
      console.error("[Dinou Node Server] Request error:", err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("content-type", "text/plain; charset=utf-8");
        res.end("Internal Server Error");
      }
    }
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, () => {
      console.log(\`🚀 Dinou (Node.js AOT Dual-Bundle) server running on http://localhost:\${port}\`);
      resolve(server);
    });
  });
}

export default {
  port: PORT,
  fetch,
  startServer,
};

const isMain = typeof process !== "undefined" &&
  process.argv[1] &&
  (path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url)));

if (isMain) {
  startServer(PORT);
}
`;
  const nodeEntryPath = path.join(nodeDir, "node-entry.mjs");
  fs.writeFileSync(nodeEntryPath, nodeEntryContent, "utf8");

  // Pass C: Final Node Orchestrator
  const finalOutfile = path.join(nodeDir, "server.mjs");
  console.log("🚀 [Dinou Node] Bundling Pass C: Node Orchestrator (server.mjs)...");
  await esbuild.build({
    entryPoints: [nodeEntryPath],
    outfile: finalOutfile,
    bundle: true,
    format: "esm",
    target: "node20",
    platform: "node",
    mainFields: ["module", "main"],
    conditions: ["node", "worker", "browser"],
    external: [...externalList, "./rsc-engine.mjs", "./ssr-engine.mjs"],
    banner,
    alias: commonAlias,
    loader: commonLoader,
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.DINOU_RUNTIME": '"node-bundle"',
      "process.env.DINOU_BUILD_TOOL": JSON.stringify(isWebpackBuild ? "webpack" : (process.env.DINOU_BUILD_TOOL || "esbuild")),
    },
    logLevel: "warning",
  });

  console.log(`\n🎉 [Dinou Node] Pre-bundled AOT build successful!`);
  console.log(`   Output file: ${finalOutfile}`);
  console.log(`   Run with: node ${finalOutfile}\n`);
} catch (err) {
  console.error("❌ [Dinou Node] Build failed:", err);
  process.exit(1);
}
