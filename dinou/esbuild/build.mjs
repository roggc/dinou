import esbuild from "esbuild";
import fs from "node:fs/promises";
import getConfigEsbuildProd from "./helpers-esbuild/get-config-esbuild-prod.mjs";
import getEsbuildEntries from "./helpers-esbuild/get-esbuild-entries.mjs";
import { fileURLToPath } from "url";
import path from "node:path";
import { updateManifestForModule } from "./helpers-esbuild/update-manifest-for-module.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outdir = "dist3";
await fs.rm(outdir, { recursive: true, force: true });
await fs.rm("react_client_manifest", { recursive: true, force: true });
await fs.rm("server_functions_manifest", { recursive: true, force: true });

const absPathToClientRedirect = path.resolve(
  __dirname,
  "../core/client-redirect.jsx"
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
};

try {
  const manifest = {};

  const [esbuildEntries, detectedCSSEntries, detectedAssetEntries] =
    await getEsbuildEntries({ manifest });

  updateManifestForModule(
    absPathToClientRedirect,
    await fs.readFile(absPathToClientRedirect, "utf8"),
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

  await esbuild.build(
    getConfigEsbuildProd({
      entryPoints,
      manifest,
      outdir,
    })
  );
} catch (err) {
  console.error("Error in build:", err);
}
