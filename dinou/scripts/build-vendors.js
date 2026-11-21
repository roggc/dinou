import esbuild from "esbuild";
import path from "node:path";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DINOU_ROOT = path.resolve(__dirname, "..");
const PROJECT_ROOT = process.cwd();
const COMPILED_DIR = path.join(DINOU_ROOT, "compiled");

const nmDinouDir = path.resolve(PROJECT_ROOT, "node_modules", "dinou");
let realNmDinouDir = null;
if (fsSync.existsSync(nmDinouDir)) {
  try {
    realNmDinouDir = fsSync.realpathSync(nmDinouDir);
  } catch {}
}

const CANDIDATE_ROOTS = Array.from(
  new Set(
    [
      PROJECT_ROOT,
      DINOU_ROOT,
      nmDinouDir,
      realNmDinouDir,
      path.resolve(DINOU_ROOT, ".."),
    ].filter(Boolean)
  )
);

const NODE_PATHS = Array.from(
  new Set(
    [
      ...CANDIDATE_ROOTS.map((r) => path.join(r, "node_modules")),
      realNmDinouDir &&
      path.basename(path.dirname(realNmDinouDir)) === "node_modules"
        ? path.dirname(realNmDinouDir)
        : null,
    ].filter((dir) => dir && fsSync.existsSync(dir))
  )
);

const candidateRequires = CANDIDATE_ROOTS.map((rootDir) => {
  const pkgJson = path.join(rootDir, "package.json");
  if (fsSync.existsSync(pkgJson)) {
    return createRequire(pkgJson);
  }
  return null;
}).filter(Boolean);
candidateRequires.push(createRequire(import.meta.url));

function resolveVendorModule(specifier) {
  for (const req of candidateRequires) {
    try {
      return req.resolve(specifier);
    } catch {}
  }
  throw new Error(
    `Unable to resolve "${specifier}" from project root (${PROJECT_ROOT}) or Dinou root (${DINOU_ROOT}). Install it first (e.g. npm install -D ${specifier}).`
  );
}

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
  { name: "rollup-plugin-delete", entry: "rollup-plugin-delete" },
  { name: "rollup-plugin-postcss", entry: "rollup-plugin-postcss" },

  // --- Webpack Loaders & Plugins ---
  { name: "babel-loader", entry: "babel-loader" },
  {
    name: "css-loader",
    entry: "css-loader",
    postProcess: async (vendorOutdir) => {
      const indexFile = path.join(vendorOutdir, "index.js");
      let indexContent = await fs.readFile(indexFile, "utf8");
      indexContent = indexContent.replaceAll(
        '"../runtime/getUrl.js"',
        '"./runtime/getUrl.js"'
      );
      await fs.writeFile(indexFile, indexContent, "utf8");

      const cssLoaderEntry = resolveVendorModule("css-loader");
      const srcRuntimeDir = path.join(path.dirname(cssLoaderEntry), "runtime");
      const destRuntimeDir = path.join(vendorOutdir, "runtime");
      await fs.cp(srcRuntimeDir, destRuntimeDir, { recursive: true });
      await fs.writeFile(
        path.join(destRuntimeDir, "package.json"),
        JSON.stringify({ type: "commonjs" }, null, 2),
        "utf8"
      );
    }
  },
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

      const mcepEntry = resolveVendorModule("mini-css-extract-plugin");
      const srcHmrDir = path.join(path.dirname(mcepEntry), "hmr");
      const destHmrDir = path.join(vendorOutdir, "hmr");
      await fs.cp(srcHmrDir, destHmrDir, { recursive: true });
      await fs.writeFile(
        path.join(destHmrDir, "package.json"),
        JSON.stringify({ type: "commonjs" }, null, 2),
        "utf8"
      );
    },
    external: ["webpack", "schema-utils"]
  },
  { name: "copy-webpack-plugin", entry: "copy-webpack-plugin" },

  // --- CLI & Core Utilities ---
  { name: "commander", entry: "commander" },
  { name: "ws", entry: "ws" },
  { name: "chokidar", entry: "chokidar" },
  { name: "fast-glob", entry: "fast-glob" },
  { name: "resolve", entry: "resolve" }
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
  console.log("🦖 [Dinou] Compiling vendor dependencies with esbuild...\n");
  const startTime = Date.now();
  await fs.mkdir(COMPILED_DIR, { recursive: true });

  const activeVendorNames = new Set(VENDORS.map((v) => v.name));
  const existingEntries = await fs.readdir(COMPILED_DIR, { withFileTypes: true });
  for (const entry of existingEntries) {
    if (entry.isDirectory() && !activeVendorNames.has(entry.name)) {
      await fs.rm(path.join(COMPILED_DIR, entry.name), {
        recursive: true,
        force: true,
      });
      console.log(`  🧹 Removed obsolete vendor directory: ${entry.name}`);
    }
  }

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
        await esbuild.build({
          absWorkingDir: PROJECT_ROOT,
          nodePaths: NODE_PATHS,
          stdin: {
            contents: vendor.wrapper,
            resolveDir: PROJECT_ROOT,
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
        const resolvedEntries = Object.fromEntries(
          Object.entries(vendor.entries).map(([key, spec]) => [
            key,
            resolveVendorModule(spec),
          ])
        );
        await esbuild.build({
          absWorkingDir: PROJECT_ROOT,
          nodePaths: NODE_PATHS,
          entryPoints: resolvedEntries,
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
        const resolvedEntry = resolveVendorModule(vendor.entry);
        await esbuild.build({
          absWorkingDir: PROJECT_ROOT,
          nodePaths: NODE_PATHS,
          entryPoints: [resolvedEntry],
          bundle: true,
          platform: "node",
          target: "node18",
          format: "esm",
          outfile: path.join(vendorOutdir, "index.js"),
          banner: { js: BANNER_JS },
          external: externals
        });
        if (vendor.postProcess) {
          await vendor.postProcess(vendorOutdir);
        }
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
