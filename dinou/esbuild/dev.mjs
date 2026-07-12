import esbuild from "esbuild";
import fs from "node:fs/promises";
import getConfigEsbuild from "./helpers-esbuild/get-config-esbuild.mjs";
import getEsbuildEntries from "./helpers-esbuild/get-esbuild-entries.mjs";
import chokidar from "chokidar";
import path from "node:path";
import { regex as assetRegex } from "../core/asset-extensions.js";
import normalizePath from "./helpers-esbuild/normalize-path.mjs";
import { fileURLToPath, pathToFileURL } from "url";
import { updateManifestForModule } from "./helpers-esbuild/update-manifest-for-module.mjs";
import { useServerRegex } from "../constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outdir = "public";
await fs.rm(outdir, { recursive: true, force: true });
await fs.rm("react_client_manifest", { recursive: true, force: true });
await fs.rm("server_functions_manifest", { recursive: true, force: true });

let currentCtx = null; // Track the active esbuild context
let debounceTimer = null; // For debouncing recreations
let clientComponentsPaths = [];
let currentServerFiles = new Set();
const absPathToClientRedirect = path.resolve(
  __dirname,
  "../core/client-redirect.jsx"
);
const absPathToLink = path.resolve(
  __dirname,
  "../core/link.jsx"
);

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
  dinouClientRedirect: absPathToClientRedirect,
  dinouLink: absPathToLink,
};

const changedIds = new Set();
const hmrEngine = { value: null };

const watcher = chokidar.watch("src", {
  ignoreInitial: true,
  ignored: /node_modules|dist/,
});

const codeCssRegex = /.(js|jsx|ts|tsx|css|scss|less)$/i;

let manifest = {};
let entryPoints = {};

async function updateEntriesAndComponents() {
  manifest = {};
  const [
    esbuildEntries,
    detectedCSSEntries,
    detectedAssetEntries,
    serverFiles,
  ] = await getEsbuildEntries({ manifest });

  updateManifestForModule(
    absPathToClientRedirect,
    await fs.readFile(absPathToClientRedirect, "utf8"),
    true,
    manifest
  );
  updateManifestForModule(
    absPathToLink,
    await fs.readFile(absPathToLink, "utf8"),
    true,
    manifest
  );

  currentServerFiles = new Set(
    serverFiles.map((f) => normalizePath(path.resolve(f)))
  );

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

  entryPoints = {
    ...frameworkEntryPoints,
    ...componentEntryPoints,
    ...cssEntryPoints,
    ...assetEntryPoints,
  };
}

// Function to (re)create esbuild context with current entries
async function createEsbuildContext() {
  try {
    if (currentCtx) {
      await currentCtx.dispose(); // Clean up old context
      // console.log("Disposed old esbuild context");
    }

    await fs.rm(outdir, { recursive: true, force: true });
    // console.log("manifest before creating context:", manifest);
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
  await updateEntriesAndComponents();
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

let reloadTimer = null;
const debounceReload = () => {
  if (reloadTimer) clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    if (hmrEngine.value) {
      hmrEngine.value.broadcastMessage({ type: "reload" });
    }
  }, 100);
};

watcher.on("add", async (file) => {
  const ext = path.extname(file);
  if (codeCssRegex.test(ext) || assetRegex.test(ext)) {
    // console.log(`New relevant file detected: ${file}. Recreating context...`);
    await updateEntriesAndComponents();
    debounceRecreateAndReload();
  }
});

watcher.on("unlink", async (file) => {
  const ext = path.extname(file);
  if (codeCssRegex.test(ext) || assetRegex.test(ext)) {
    // console.log(`File deleted: ${file}. Recreating context...`);
    await updateEntriesAndComponents();
    if (currentCtx) {
      await currentCtx.dispose();
      currentCtx = null;
    }
    debounceRecreate();
  }
});

watcher.on("addDir", async () => {
  // console.log(`New directory: ${dir}. Recreating context...`);
  await updateEntriesAndComponents();
  debounceRecreateAndReload();
});

watcher.on("unlinkDir", async () => {
  // console.log(`Directory deleted: ${dir}. Recreating context...`);
  await updateEntriesAndComponents();
  if (currentCtx) {
    await currentCtx.dispose();
    currentCtx = null;
  }
  debounceRecreate();
});

function existsInManifest(resolvedFile, manifest) {
  const manifestKey = pathToFileURL(resolvedFile).href;
  // console.log("Checking manifest for key:", manifestKey);
  for (const key of Object.keys(manifest)) {
    if (key === manifestKey) {
      return true;
    }
  }
  return false;
}

watcher.on("change", async (file) => {
  const resolvedFile = normalizePath(path.resolve(file));
  const oldManifest = { ...manifest };
  const oldEntryKeys = JSON.stringify(Object.keys(entryPoints).sort());

  await updateEntriesAndComponents();

  const newEntryKeys = JSON.stringify(Object.keys(entryPoints).sort());
  const entryPointsChanged = oldEntryKeys !== newEntryKeys;

  // Check if changed file is a client component
  const isClientModule = clientComponentsPaths.includes(resolvedFile);
  const isServerModule = currentServerFiles.has(resolvedFile);
  // console.log(
  //   `File changed: ${resolvedFile} | Client Module: ${isClientModule} | Server Module: ${isServerModule}`
  // );
  // console.log("currentServerFiles:", currentServerFiles);

  if (
    isClientModule &&
    !isServerModule &&
    existsInManifest(resolvedFile, oldManifest)
  ) {
    changedIds.add(resolvedFile);
    return;
  }

  // If it's a Server Action module ("use server"), do not reload the browser
  const fileContent = await fs.readFile(resolvedFile, "utf8").catch(() => "");
  const isServerAction = useServerRegex.test(fileContent.trim());
  if (isServerAction) {
    return;
  }

  // Only recreate context and reload if entry points actually changed or it's a CSS file
  if (entryPointsChanged || file.endsWith(".css") || file.endsWith(".scss")) {
    debounceRecreateAndReload();
  } else {
    debounceReload();
  }
});
