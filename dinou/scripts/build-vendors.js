import esbuild from "esbuild";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DINOU_ROOT = path.resolve(__dirname, "..");
const COMPILED_DIR = path.join(DINOU_ROOT, "compiled");

const BANNER_JS = `
import { createRequire as __dinou_createRequire } from "node:module";
import { fileURLToPath as __dinou_fileURLToPath } from "node:url";
import __dinou_path from "node:path";
const require = __dinou_createRequire(import.meta.url);
const __filename = __dinou_fileURLToPath(import.meta.url);
const __dirname = __dinou_path.dirname(__filename);
`.trim();

const VENDORS = [
  // --- Babel Ecosystem ---
  { name: "babel-parser", entry: "@babel/parser" },
  { name: "babel-traverse", entry: "@babel/traverse" },
  { name: "babel-core", entry: "@babel/core" },
  { name: "babel-generator", entry: "@babel/generator" },
  { name: "babel-types", entry: "@babel/types" },
  { name: "babel-preset-react", entry: "@babel/preset-react" },
  { name: "babel-preset-typescript", entry: "@babel/preset-typescript" },
  { name: "babel-plugin-syntax-import-meta", entry: "@babel/plugin-syntax-import-meta" },
  { name: "babel-plugin-react-compiler", entry: "babel-plugin-react-compiler" },

  // --- PostCSS & CSS Ecosystem ---
  { name: "postcss", entry: "postcss" },
  { name: "postcss-import", entry: "postcss-import" },
  { name: "postcss-modules", entry: "postcss-modules" },
  { name: "autoprefixer", entry: "autoprefixer" },
  { name: "generic-names", entry: "generic-names" },
  {
    name: "tailwindcss-postcss",
    entry: "@tailwindcss/postcss",
    external: ["@tailwindcss/oxide*", "lightningcss*", "*.node"]
  },

  // --- Rollup Plugins ---
  { name: "rollup-plugin-babel", entry: "@rollup/plugin-babel" },
  { name: "rollup-plugin-commonjs", entry: "@rollup/plugin-commonjs" },
  { name: "rollup-plugin-json", entry: "@rollup/plugin-json" },
  { name: "rollup-plugin-node-resolve", entry: "@rollup/plugin-node-resolve" },
  { name: "rollup-plugin-replace", entry: "@rollup/plugin-replace" },
  { name: "rollup-plugin-copy", entry: "rollup-plugin-copy" },
  { name: "rollup-plugin-delete", entry: "rollup-plugin-delete" },
  { name: "rollup-plugin-postcss", entry: "rollup-plugin-postcss" },
  {
    name: "rollup-plugin-tsconfig-paths",
    entry: "rollup-plugin-tsconfig-paths",
    external: ["typescript"]
  },

  // --- Webpack Loaders & Plugins ---
  { name: "babel-loader", entry: "babel-loader" },
  { name: "css-loader", entry: "css-loader" },
  {
    name: "mini-css-extract-plugin",
    entries: {
      index: "mini-css-extract-plugin",
      loader: "mini-css-extract-plugin/dist/loader.js"
    },
    splitting: true,
    postProcess: async (vendorOutdir) => {
      const loaderFile = path.join(vendorOutdir, "loader.js");
      let content = await fs.readFile(loaderFile, "utf8");
      content = content.replace(
        "export default require_loader();",
        "const _loader = require_loader();\nexport default _loader;\nexport const pitch = _loader.pitch;\nexport const hotLoader = _loader.hotLoader;\n"
      );
      await fs.writeFile(loaderFile, content, "utf8");
    },
    external: ["webpack", "schema-utils"]
  },
  { name: "copy-webpack-plugin", entry: "copy-webpack-plugin" },
  {
    name: "tsconfig-paths-webpack-plugin",
    entry: "tsconfig-paths-webpack-plugin",
    external: ["enhanced-resolve*", "typescript"]
  },

  // --- CLI & Utilities ---
  { name: "commander", entry: "commander" },
  { name: "dotenv", entry: "dotenv" },
  { name: "cross-env", entry: "cross-env" },
  { name: "ws", entry: "ws" },
  { name: "chokidar", entry: "chokidar" },
  { name: "esbuild-copy-static-files", entry: "esbuild-copy-static-files" },
  {
    name: "esbuild-tsconfig-paths",
    wrapper: `
      import pkg from "@esbuild-plugins/tsconfig-paths";
      const actual = pkg?.default || pkg;
      export const TsconfigPathsPlugin = actual.TsconfigPathsPlugin || actual;
      export default actual;
    `,
    external: ["typescript"]
  }
];

const GLOBAL_EXTERNALS = [
  "webpack",
  "rollup",
  "esbuild",
  "@swc/core",
  "react",
  "react-dom"
];

async function buildVendors() {
  console.log("🦖 [Dinou v9] Compiling vendor dependencies with esbuild...\n");
  const startTime = Date.now();
  await fs.mkdir(COMPILED_DIR, { recursive: true });

  const manifest = {};
  let successCount = 0;
  let failCount = 0;

  for (const vendor of VENDORS) {
    const t0 = Date.now();
    const vendorOutdir = path.join(COMPILED_DIR, vendor.name);
    await fs.rm(vendorOutdir, { recursive: true, force: true });
    await fs.mkdir(vendorOutdir, { recursive: true });

    const externals = Array.from(
      new Set([...GLOBAL_EXTERNALS, ...(vendor.external || [])])
    );

    try {
      if (vendor.wrapper) {
        // Custom wrapper for synthesized named exports
        await esbuild.build({
          stdin: {
            contents: vendor.wrapper,
            resolveDir: DINOU_ROOT,
            sourcefile: `${vendor.name}-wrapper.js`
          },
          bundle: true,
          platform: "node",
          target: "node18",
          format: "esm",
          outfile: path.join(vendorOutdir, "index.js"),
          banner: { js: BANNER_JS },
          external: externals
        });
      } else if (vendor.entries) {
        // Multi-entrypoint vendor (e.g. mini-css-extract-plugin with loader.js)
        await esbuild.build({
          entryPoints: vendor.entries,
          bundle: true,
          platform: "node",
          target: "node18",
          format: "esm",
          outdir: vendorOutdir,
          banner: { js: BANNER_JS },
          external: externals,
          splitting: Boolean(vendor.splitting)
        });
        if (vendor.postProcess) {
          await vendor.postProcess(vendorOutdir);
        }
      } else {
        // Single entrypoint vendor
        await esbuild.build({
          entryPoints: [vendor.entry],
          bundle: true,
          platform: "node",
          target: "node18",
          format: "esm",
          outfile: path.join(vendorOutdir, "index.js"),
          banner: { js: BANNER_JS },
          external: externals
        });
      }

      const elapsed = Date.now() - t0;
      const indexStat = await fs.stat(path.join(vendorOutdir, "index.js"));
      const sizeKb = (indexStat.size / 1024).toFixed(1);

      console.log(`  ✓ ${vendor.name.padEnd(32)} ${elapsed.toString().padStart(4)}ms  (${sizeKb.padStart(6)} KB)`);
      manifest[vendor.name] = {
        entry: vendor.entry || vendor.entries,
        sizeKb: parseFloat(sizeKb),
        builtAt: new Date().toISOString()
      };
      successCount++;
    } catch (err) {
      console.error(`  ✗ ${vendor.name} FAILED:`, err.message);
      failCount++;
    }
  }

  // Write manifest
  await fs.writeFile(
    path.join(COMPILED_DIR, "vendors-manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✨ Finished compiling ${successCount} vendors in ${totalTime}s (failed: ${failCount})`);
  console.log(`📁 Artifacts generated in: ${COMPILED_DIR}\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

buildVendors().catch((err) => {
  console.error("Fatal error compiling vendors:", err);
  process.exit(1);
});
