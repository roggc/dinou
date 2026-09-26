import esbuild from "esbuild";
import fs from "node:fs/promises";
import getConfigEsbuild from "./helpers-esbuild/get-config-esbuild.mjs";
import getEsbuildEntries from "./helpers-esbuild/get-esbuild-entries.mjs";
import path from "node:path";
import normalizePath from "./helpers-esbuild/normalize-path.mjs";
import { fileURLToPath } from "url";
import { updateManifestForModule } from "./helpers-esbuild/update-manifest-for-module.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startEsbuildDev(options = {}) {
  const onRebuilt = options.onRebuilt || (() => {});
  const onBuildStart = options.onBuildStart || (() => {});
  const onBuildEnd = options.onBuildEnd || (() => {});
  const outdir = ".dinou/public";
  await fs.rm(outdir, { recursive: true, force: true });
  await fs.rm(".dinou/react_client_manifest", { recursive: true, force: true });
  await fs.rm(".dinou/server_functions_manifest", { recursive: true, force: true });

  let currentCtx = null; // Track the active esbuild context
  let activeBuildResolve = null;
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
  async function createEsbuildContext(waitForBuild = false) {
    try {
      if (currentCtx) {
        await currentCtx.dispose();
        currentCtx = null;
      }

      let buildPromise = null;
      if (waitForBuild) {
        buildPromise = new Promise((res) => {
          activeBuildResolve = res;
        });
      }

      currentCtx = await esbuild.context(
        getConfigEsbuild({
          entryPoints,
          manifest,
          changedIds,
          hmrEngine,
          serverFiles: currentServerFiles,
          onManifestUpdated: async () => {
            await onRebuilt();
          },
          onBuildStart: () => {
            onBuildStart();
          },
          onBuildEnd: async (result) => {
            await onBuildEnd(result);
            if (activeBuildResolve) {
              const res = activeBuildResolve;
              activeBuildResolve = null;
              res();
            }
          },
        })
      );

      await currentCtx.watch();
      if (buildPromise) {
        await buildPromise;
      }
    } catch (err) {
      console.error("Error recreating context:", err);
      if (activeBuildResolve) {
        const res = activeBuildResolve;
        activeBuildResolve = null;
        res();
      }
    }
  }

  const normKey = (p) => {
    if (!p) return "";
    let s = path.resolve(p).replace(/\\/g, "/");
    if (process.platform === "win32") {
      s = s.replace(/^([a-zA-Z]):/, (_, d) => d.toLowerCase() + ":");
    }
    return s;
  };

  // Initial build
  const tBabel0 = Date.now();
  await updateEntriesAndComponents();
  const clientEntriesBabel = Date.now() - tBabel0;

  const tClientBuild0 = Date.now();
  await createEsbuildContext(true);
  const clientBuild = Date.now() - tClientBuild0;

  return {
    broadcast: (msg) => {
      hmrEngine.value?.broadcastMessage?.(msg);
    },
    notifyFileChanged: (filePath) => {
      if (filePath) {
        changedIds.add(normKey(filePath));
        if (currentCtx) {
          currentCtx.rebuild().catch(() => {});
        }
      }
    },
    restart: async () => {
      console.log("⚡ [Esbuild Dev] Recreating client bundle due to directive change...");
      await updateEntriesAndComponents();
      await createEsbuildContext(true);
    },
    close: async () => {
      try {
        if (currentCtx) await currentCtx.dispose();
        if (hmrEngine.value?.server?.close) {
          try { hmrEngine.value.server.close(); } catch (e) {}
        }
      } catch (e) {}
    },
    timings: {
      clientEntriesBabel,
      clientBuild,
      postCss: globalThis.__DINOU_POSTCSS_TIME__ || 0,
      postCssCount: globalThis.__DINOU_POSTCSS_COUNT__ || 0,
      swc: globalThis.__DINOU_SWC_TIME__ || 0,
      swcCount: globalThis.__DINOU_SWC_COUNT__ || 0,
      sf: globalThis.__DINOU_SF_TIME__ || 0,
      sfCount: globalThis.__DINOU_SF_COUNT__ || 0,
      rcm: globalThis.__DINOU_RCM_TIME__ || 0,
      stable: globalThis.__DINOU_STABLE_TIME__ || 0,
      writeDisk: globalThis.__DINOU_WRITE_TIME__ || 0,
    },
  };
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  startEsbuildDev();
}
