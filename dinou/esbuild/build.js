delete process.env.DINOU_DEV;
process.env.NODE_ENV = "production";

import esbuild from "esbuild";
import fs from "node:fs/promises";
import getConfigEsbuildProd from "./helpers-esbuild/get-config-esbuild-prod.js";
import getEsbuildEntries from "./helpers-esbuild/get-esbuild-entries.js";
import { fileURLToPath } from "url";
import path from "node:path";
import { updateManifestForModule } from "./helpers-esbuild/update-manifest-for-module.js";
import { generateRouteTypes } from "../core/generate-route-types.js";
import { getDinouConfig } from "../core/load-dinou-config.js";
import { loadEnvFiles } from "../core/env.js";
import ensureVendorMode, {
  isUnvendorizedRequested,
} from "../core/ensure-vendor-mode.js";
loadEnvFiles(process.cwd(), { mode: "production" });
if (!ensureVendorMode()) {
  await new Promise(() => {});
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outdir = ".dinou/dist3";
await fs.rm(outdir, { recursive: true, force: true });
await fs.rm(".dinou/dist1", { recursive: true, force: true });
await fs.rm(".dinou/netlify", { recursive: true, force: true });

const absPathToClientRedirect = path.resolve(
  __dirname,
  "../core/client-redirect.jsx"
);
const absPathToLink = path.resolve(
  __dirname,
  "../core/link.jsx"
);
const absPathToSlot = path.resolve(
  __dirname,
  "../core/slot.js"
);

const frameworkEntryPoints = {
  main: path.resolve(__dirname, "../core/client.jsx"),
  serverFunctionProxy: path.resolve(
    __dirname,
    "../core/server-function-proxy.js"
  ),
  dinouClientRedirect: absPathToClientRedirect,
  dinouLink: absPathToLink,
  dinouSlot: absPathToSlot,
};

try {
  const dinouConfig = await getDinouConfig();
  const enableReactCompiler = dinouConfig?.reactCompiler !== false;
  try {
    generateRouteTypes(process.cwd());
  } catch (e) {}
  const manifest = {};

  const [
    esbuildEntries,
    detectedCSSEntries,
    detectedAssetEntries,
    serverFiles,
  ] = await getEsbuildEntries({ manifest, dinouConfig });

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
  updateManifestForModule(
    absPathToSlot,
    await fs.readFile(absPathToSlot, "utf8"),
    true,
    manifest
  );

  const componentEntryPoints = [...esbuildEntries].reduce(
    (acc, dCE) => ({ ...acc, [dCE.outfileName]: dCE.absPath }),
    {}
  );

  const cssEntryPoints = [...detectedCSSEntries].reduce(
    (acc, dCSSE) => ({ ...acc, [dCSSE.outfileName]: dCSSE.absPath }),
    {}
  );

  const serverAssetPaths = [...detectedAssetEntries].map((dAE) => dAE.absPath);

  const entryPoints = {
    ...frameworkEntryPoints,
    ...componentEntryPoints,
    ...cssEntryPoints,
  };

  await esbuild.build(
    getConfigEsbuildProd({
      entryPoints,
      manifest,
      outdir,
      serverFiles,
      serverAssetPaths,
      dinouConfig,
      reactCompiler: enableReactCompiler,
    })
  );

  // 🏗️ Pre-render static pages (SSG) & compile Dual-Bundle Server/Netlify adapters
  const { spawnSync } = await import("node:child_process");
  const ssgArgs = [
    "--conditions=react-server",
    ...(isUnvendorizedRequested() ? ["--conditions=unvendorized"] : []),
    path.resolve(__dirname, "../core/run-ssg.js"),
  ];
  const ssgRes = spawnSync(process.execPath, ssgArgs, {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
      DINOU_BUILD_TOOL: "esbuild",
    },
  });
  if (ssgRes.status !== 0) {
    throw new Error(
      `[Dinou SSG] Static generation exited with code ${ssgRes.status ?? 1}`
    );
  }
} catch (err) {
  console.error("Error in build:", err);
  process.exit(1);
}
