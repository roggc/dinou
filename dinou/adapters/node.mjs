// dinou/adapters/node.mjs
// Native Node.js Pre-Bundled Adapter for Dinou v7.
// Serves the standalone pre-bundled server from .dinou/node/server.mjs.

import * as path from "node:path";
import * as fs from "node:fs";
import { pathToFileURL } from "node:url";

const cwd = typeof process !== "undefined" && typeof process.cwd === "function" ? process.cwd() : ".";
const bundlePath = path.resolve(cwd, ".dinou/node/server.mjs");

if (!fs.existsSync(bundlePath)) {
  console.error("❌ [Dinou Node Adapter] .dinou/node/server.mjs not found. Please run 'npm run build:node' first.");
  process.exit(1);
}

const serverModule = await import(pathToFileURL(bundlePath).href);
const PORT = Number(process.env.PORT || 3000);

if (typeof serverModule.startServer === "function") {
  await serverModule.startServer(PORT);
} else if (serverModule.default && typeof serverModule.default.startServer === "function") {
  await serverModule.default.startServer(PORT);
}

export default serverModule.default || serverModule;
