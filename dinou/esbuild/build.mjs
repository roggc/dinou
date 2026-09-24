import esbuild from "esbuild";
import fs from "node:fs/promises";
import getConfigEsbuildProd from "./helpers-esbuild/get-config-esbuild-prod.mjs";
import getEsbuildEntries from "./helpers-esbuild/get-esbuild-entries.mjs";
import { fileURLToPath } from "url";
import path from "node:path";
import { updateManifestForModule } from "./helpers-esbuild/update-manifest-for-module.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outdir = ".dinou/dist3";
await fs.rm(outdir, { recursive: true, force: true });
await fs.rm(".dinou/react_client_manifest", { recursive: true, force: true });
await fs.rm(".dinou/server_functions_manifest", { recursive: true, force: true });

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
  updateManifestForModule(
    absPathToLink,
    await fs.readFile(absPathToLink, "utf8"),
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

  // 🚀 Server & Adapter Pre-bundling with react-server condition
  console.log("[esbuild] Pre-bundling server handler and adapters with conditions: ['react-server']...");
  await esbuild.build({
    entryPoints: {
      handler: path.resolve(__dirname, "../core/handler.js"),
      netlify: path.resolve(__dirname, "../adapters/netlify.js"),
    },
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    conditions: ["react-server", "node", "import"],
    outdir: ".dinou/dist3/server",
    external: [
      "express",
      "chokidar",
      "dotenv",
      "fsevents",
      "@swc/core",
      "@babel/core",
      "esbuild",
    ],
    banner: {
      js: "import { createRequire as ___createRequire } from 'node:module'; import { fileURLToPath as ___fileURLToPath } from 'node:url'; import ___path from 'node:path'; const require = ___createRequire(import.meta.url || ___path.resolve(process.cwd(), 'package.json')); const __filename = import.meta.url ? ___fileURLToPath(import.meta.url) : ___path.resolve(process.cwd(), 'index.js'); const __dirname = ___path.dirname(__filename); process.env.NODE_ENV = process.env.NODE_ENV || 'production';",
    },
    sourcemap: true,
  });
  await fs.writeFile(
    path.resolve(process.cwd(), ".dinou/dist3/server/package.json"),
    JSON.stringify({ type: "module" }, null, 2)
  );
  console.log("[esbuild] Server bundles created at .dinou/dist3/server/");

  // 🏗️ Pre-render static pages (SSG) at build time
  const { execSync } = await import("node:child_process");
  execSync(`"${process.execPath}" "${path.resolve(__dirname, "../core/run-ssg.js")}"`, {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
  });
} catch (err) {
  console.error("Error in build:", err);
  process.exit(1);
}
