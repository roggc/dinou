import esbuild from "esbuild";
import fs from "node:fs/promises";
import getConfigEsbuild from "./helpers-esbuild/get-config-esbuild.mjs";
import getEsbuildEntries from "./helpers-esbuild/get-esbuild-entries.mjs";
import chokidar from "chokidar";
import path from "node:path";
import { regex as assetRegex } from "../core/asset-extensions.js";
import normalizePath from "./helpers-esbuild/normalize-path.mjs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outdir = "public";
await fs.rm(outdir, { recursive: true, force: true });

let currentCtx = null; // Track the active esbuild context
let debounceTimer = null; // For debouncing recreations
let clientComponentsPaths = [];

const frameworkEntryPoints = {
  main: path.resolve(__dirname, "../core/client.jsx"),
  error: path.resolve(__dirname, "../core/client-error.jsx"),
  serverFunctionProxy: path.resolve(
    __dirname,
    "../core/server-function-proxy.js"
  ),
  runtime: path.resolve(__dirname, "react-refresh/react-refresh-runtime.mjs"),
  "react-refresh-entry": path.resolve(
    __dirname,
    "react-refresh/react-refresh-entry.js"
  ),
};

const changedIds = new Set();
const hmrEngine = { value: null };

const watcher = chokidar.watch("src", {
  ignoreInitial: true,
  ignored: /node_modules|dist/,
});

const codeCssRegex = /.(js|jsx|ts|tsx|css|scss|less)$/i;

// Function to (re)create esbuild context with current entries
async function createEsbuildContext() {
  try {
    if (currentCtx) {
      await currentCtx.dispose(); // Clean up old context
      console.log("Disposed old esbuild context");
    }

    await fs.rm(outdir, { recursive: true, force: true });

    const manifest = {};
    const [esbuildEntries, detectedCSSEntries, detectedAssetEntries] =
      await getEsbuildEntries({ manifest });

    const componentEntryPoints = [...esbuildEntries].reduce(
      (acc, dCE) => ({ ...acc, [dCE.outfileName]: dCE.absPath }),
      {}
    );

    clientComponentsPaths = Object.values(componentEntryPoints);

    const cssEntryPoints = [...detectedCSSEntries].reduce(
      (acc, dCSSE) => ({ ...acc, [dCSSE.outfileName]: dCSSE.absPath }),
      {}
    );

    const assetEntryPoints = [...detectedAssetEntries].reduce(
      (acc, dAE) => ({ ...acc, [dAE.outfileName]: dAE.absPath }),
      {}
    );

    const entryPoints = {
      ...frameworkEntryPoints,
      ...componentEntryPoints,
      ...cssEntryPoints,
      ...assetEntryPoints,
    };

    currentCtx = await esbuild.context(
      getConfigEsbuild({
        entryPoints,
        manifest,
        changedIds,
        hmrEngine,
      })
    );

    await currentCtx.watch();
    // console.log("✓ Watching (changes will trigger rebuild)");
  } catch (err) {
    console.error("Error recreating context:", err);
  }
}

// Initial setup on ready
watcher.on("ready", async () => {
  await createEsbuildContext();
});

const debounceRecreate = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    await createEsbuildContext();
  }, 300); // 300ms debounce — adjust as needed
};

const debounceRecreateAndReload = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    await createEsbuildContext();
    hmrEngine.value.broadcastMessage({ type: "reload" });
  }, 300);
};

watcher.on("add", (file) => {
  const ext = path.extname(file);
  if (codeCssRegex.test(ext) || assetRegex.test(ext)) {
    // console.log(`New relevant file detected: ${file}. Recreating context...`);
    debounceRecreateAndReload(file);
  }
});

watcher.on("unlink", async (file) => {
  const ext = path.extname(file);
  if (codeCssRegex.test(ext) || assetRegex.test(ext)) {
    // console.log(`File deleted: ${file}. Recreating context...`);
    if (currentCtx) {
      await currentCtx.dispose();
      currentCtx = null;
    }
    debounceRecreate(file);
  }
});

watcher.on("addDir", (dir) => {
  // console.log(`New directory: ${dir}. Recreating context...`);
  debounceRecreateAndReload(dir);
});

watcher.on("unlinkDir", async (dir) => {
  // console.log(`Directory deleted: ${dir}. Recreating context...`);
  if (currentCtx) {
    await currentCtx.dispose();
    currentCtx = null;
  }
  debounceRecreate(dir);
});

watcher.on("change", (file) => {
  const resolvedFile = normalizePath(path.resolve(file));
  // Check if changed file is a client component
  const isClientModule = clientComponentsPaths.includes(resolvedFile);
  if (isClientModule) {
    changedIds.add(resolvedFile);
    return;
  }
  // Server module, css module, or other file changed
  debounceRecreateAndReload();
});
