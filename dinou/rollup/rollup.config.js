import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";
import postcss from "#rollup-plugin-postcss";
import {
  createBasePostCssPlugins,
  getRegisteredCssUrlAssets,
} from "../core/postcss-pipeline.js";
import babelModule from "#rollup/plugin-babel";
import resolveModule from "#rollup/plugin-node-resolve";
import commonjs from "#rollup/plugin-commonjs";
import { copyStaticDirectoriesToOutdir } from "../core/copy-static-dirs.js";
import reactClientManifest from "./rollup-plugins/rollup-plugin-react-client-manifest.js";
import createScopedName from "../core/createScopedName.js";
import replace from "#rollup/plugin-replace";
import json from "#rollup/plugin-json";
import reactRefreshWrapModules from "./react-refresh/react-refresh-wrap-modules.js";
import { esmHmrPlugin } from "./react-refresh/rollup-plugin-esm-hmr.js";
import dinouAssetPlugin from "./rollup-plugins/dinou-asset-plugin.js";
import tsconfigPaths from "#rollup-plugin-tsconfig-paths";
import serverFunctionsPlugin from "./rollup-plugins/rollup-plugin-server-functions.js";
import { regex } from "../core/asset-extensions.js";
import manifestGeneratorPlugin from "./rollup-plugins/manifest-generator-plugin.js";
import rollupMemoryPlugin from "./rollup-plugins/rollup-plugin-memory.js";
import rollupSwcPlugin from "./rollup-plugins/rollup-plugin-swc.js";
import { generateRouteTypes } from "../core/generate-route-types.js";
import { rollupContextualDinouPlugin } from "../core/resolve-contextual-dinou.js";
import { getDinouConfig } from "../core/load-dinou-config.js";
import presetReactModule from "#babel/preset-react";
import presetTypescriptModule from "#babel/preset-typescript";
import pluginSyntaxImportMetaModule from "#babel/plugin-syntax-import-meta";
import pluginReactCompilerModule from "#babel-plugin-react-compiler";

const unwrapBabel = (mod) => mod?.default ?? mod;
const presetReact = unwrapBabel(presetReactModule);
const presetTypescript = unwrapBabel(presetTypescriptModule);
const pluginSyntaxImportMeta = unwrapBabel(pluginSyntaxImportMetaModule);
const pluginReactCompiler = unwrapBabel(pluginReactCompilerModule);
const babel = babelModule?.default || babelModule;
const resolve = resolveModule?.default || resolveModule;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const localDinouPath = path.resolve(process.cwd(), "dinou");
const isEjected = fs.existsSync(localDinouPath);

console.log(
  isEjected
    ? "🚀 [Dinou] Ejected Mode detected (Using local code)"
    : "📦 [Dinou] Library Mode detected (Using node_modules)",
);

export default async function () {
  try {
    generateRouteTypes(process.cwd());
  } catch (e) {}
  const isDevelopment = process.env.NODE_ENV !== "production";
  const outputDirectory = isDevelopment ? ".dinou/public" : ".dinou/dist3";
  const shouldWriteToDisk = process.env.DINOU_WRITE_TO_DISK === "true" || !isDevelopment;
  const serverFiles = new Set();
  const dinouConfig = await getDinouConfig();
  const enableReactCompiler = dinouConfig?.reactCompiler !== false;
  const delModule = await import("#rollup-plugin-delete");
  const del = delModule?.default || delModule;
  const clientConfig = {
    input: isDevelopment
      ? {
        runtime: path.resolve(
          __dirname,
          "react-refresh/react-refresh-runtime.js",
        ),
        refresh: path.resolve(
          __dirname,
          "react-refresh/react-refresh-entry.js",
        ),
        main: path.resolve(__dirname, "../core/client.jsx"),
        serverFunctionProxy: path.resolve(
          __dirname,
          "../core/server-function-proxy.js",
        ),
        dinouClientRedirect: path.resolve(
          __dirname,
          "../core/client-redirect.jsx",
        ),
        dinouLink: path.resolve(
          __dirname,
          "../core/link.jsx",
        ),
        dinouSlot: path.resolve(
          __dirname,
          "../core/slot.js",
        ),
      }
      : {
        main: path.resolve(__dirname, "../core/client.jsx"),
        serverFunctionProxy: path.resolve(
          __dirname,
          "../core/server-function-proxy.js",
        ),
        dinouClientRedirect: path.resolve(
          __dirname,
          "../core/client-redirect.jsx",
        ),
        dinouLink: path.resolve(
          __dirname,
          "../core/link.jsx",
        ),
        dinouSlot: path.resolve(
          __dirname,
          "../core/slot.js",
        ),
      },
    output: {
      dir: outputDirectory,
      format: "esm",
      entryFileNames: isDevelopment ? "[name].js" : "[name]-[hash].js",
      chunkFileNames: (chunkInfo) => {
        if (!isDevelopment) return "[name]-[hash].js";
        const moduleIds =
          chunkInfo.moduleIds || Object.keys(chunkInfo.modules || {});
        if (moduleIds.length === 0) return "[name].js";
        const isVendor = moduleIds.every(
          (id) =>
            id.includes("node_modules") ||
            id.includes("\0") ||
            id.includes("commonjsHelpers")
        );
        if (isVendor) {
          return "[name]-[hash].js";
        }
        return "[name].js";
      },
      // 🛑 THE MAGIC SOLUTION 👇
      // Defaults to 'true' in some cases.
      // By setting it to 'false', you force Rollup to use the original exported
      // variable name instead of 'C', 'a', 'b', etc.
      minifyInternalExports: false,
    },
    // 🛑 ADD THIS MAGIC LINE
    // Tells Rollup: "Keep entry point signatures (export names) intact"
    preserveEntrySignatures: "strict",
    perf: isDevelopment,
    treeshake: isDevelopment ? false : true,
    external: [
      "/refresh.js",
      "/__hmr_client__.js",
      "/__SERVER_FUNCTION_PROXY__",
    ],
    plugins: [
      shouldWriteToDisk &&
        del({
          targets: [
            `${outputDirectory}/*`,
            ...(isDevelopment
              ? [
                  ".dinou/node-dev/react-client-manifest.json",
                  ".dinou/node-dev/server-functions-manifest.json",
                  ".dinou/node-dev/manifest.json",
                ]
              : [".dinou/dist1/*"]),
          ],
          runOnce: true,
          hook: "buildStart",
        }),
      rollupContextualDinouPlugin({ projectRoot: process.cwd() }),
      tsconfigPaths(),
      replace({
        preventAssignment: true,
        "process.env.NODE_ENV": JSON.stringify(
          isDevelopment ? "development" : "production",
        ),
      }),
      json(),
      resolve({
        extensions: [".mjs", ".js", ".jsx", ".ts", ".tsx", ".json", ".css"],
        exportConditions: ["style"],
        browser: true,
        preferBuiltins: false,
      }),
      commonjs({
        include: isEjected ? [/node_modules/, /dinou/] : /node_modules/,
      }),
      dinouAssetPlugin({
        include: regex,
      }),
      isDevelopment
        ? rollupSwcPlugin()
        : babel({
            babelHelpers: "bundled",
            configFile: false,
            babelrc: false,
            extensions: [".js", ".jsx", ".ts", ".tsx"],
            presets: [
              [presetReact, { runtime: "automatic" }],
              presetTypescript,
            ],
            plugins: [
              enableReactCompiler && pluginReactCompiler,
              pluginSyntaxImportMeta,
            ].filter(Boolean),
            exclude: /node_modules[\\/](?!dinou|react-refresh)/,
          }),
      postcss({
        modules: {
          generateScopedName: (name, filename) =>
            createScopedName(name, filename),
        },
        extract: "styles.css",
        minimize: !isDevelopment,
        plugins: createBasePostCssPlugins(),
        config: false,
      }),
      {
        name: "dinou-rollup-css-assets-and-minify",
        buildStart() {
          getRegisteredCssUrlAssets().clear();
        },
        generateBundle(_options, bundle) {
          for (const [assetFileName, absAssetPath] of getRegisteredCssUrlAssets().entries()) {
            if (!bundle[assetFileName] && fs.existsSync(absAssetPath)) {
              try {
                this.emitFile({
                  type: "asset",
                  fileName: assetFileName,
                  source: fs.readFileSync(absAssetPath),
                });
              } catch (e) {}
            }
          }
          if (!isDevelopment && bundle["styles.css"]?.type === "asset") {
            try {
              const rawCss = Buffer.isBuffer(bundle["styles.css"].source)
                ? bundle["styles.css"].source.toString("utf8")
                : String(bundle["styles.css"].source || "");
              if (rawCss) {
                bundle["styles.css"].source = esbuild.transformSync(rawCss, {
                  loader: "css",
                  minify: true,
                }).code;
              }
            } catch (e) {}
          }
        },
      },
      shouldWriteToDisk && {
        name: "dinou-copy-static",
        writeBundle() {
          copyStaticDirectoriesToOutdir(process.cwd(), outputDirectory);
        },
      },
      reactClientManifest({
        manifestPath: path.join(
          isDevelopment ? ".dinou/node-dev" : ".dinou/dist1",
          "react-client-manifest.json",
        ),
        serverFiles,
      }),
      isDevelopment && reactRefreshWrapModules(),
      isDevelopment && esmHmrPlugin(),
      !isDevelopment && manifestGeneratorPlugin(),
      serverFunctionsPlugin({ serverFiles }),
      isDevelopment && rollupMemoryPlugin(),
    ].filter(Boolean),
    watch: {
      buildDelay: 100,
      exclude: [
        /[\\/]node_modules[\\/]/,
        /[\\/]\.git[\\/]/,
        /[\\/]\.dinou[\\/]/,
        /[\\/]test-results[\\/]/,
        /[\\/]playwright-report[\\/]/,
        "**/node_modules/**",
        "**/.git/**",
        "**/.dinou/**",
        "**/test-results/**",
        "**/playwright-report/**",
      ],
    },
    onwarn(warning, warn) {
      if (warning.code === "CIRCULAR_DEPENDENCY" || warning.code === "THIS_IS_UNDEFINED") {
        return;
      }
      // Ignore eval warning if it comes from our request-context file
      if (warning.code === "EVAL") {
        // Optional: If you want to be very specific and only allow it in that file:
        if (warning.loc && warning.loc.file.includes("request-context.js")) {
          return;
        }
      }
      if (
        warning.message.includes(
          'Module level directives cause errors when bundled, "use client"',
        ) ||
        warning.message.includes(
          'Module level directives cause errors when bundled, "use server"',
        )
      ) {
        return;
      }
      warn(warning);
    },
  };

  if (isDevelopment) {
    return clientConfig;
  }

  const serverConfig = {
    input: {
      handler: path.resolve(__dirname, "../core/handler.js"),
      netlify: path.resolve(__dirname, "../adapters/netlify.js"),
    },
    output: {
      dir: path.resolve(process.cwd(), ".dinou/dist1/server"),
      format: "esm",
      entryFileNames: "[name].js",
      chunkFileNames: "[name]-[hash].js",
      sourcemap: true,
      banner: "import { createRequire as ___createRequire } from 'node:module'; import { fileURLToPath as ___fileURLToPath } from 'node:url'; import ___path from 'node:path'; const require = ___createRequire(import.meta.url || ___path.resolve(process.cwd(), 'package.json')); globalThis.__dinou_require__ = require; const __filename = import.meta.url ? ___fileURLToPath(import.meta.url) : ___path.resolve(process.cwd(), 'index.js'); const __dirname = ___path.dirname(__filename); process.env.NODE_ENV = process.env.NODE_ENV || 'production';",
    },
    external: [
      "express",
      "chokidar",
      "dotenv",
      "fsevents",
      "@swc/core",
      "@babel/core",
      "esbuild",
    ],
    plugins: [
      replace({
        preventAssignment: true,
        "process.env.NODE_ENV": JSON.stringify("production"),
      }),
      json(),
      rollupContextualDinouPlugin({ projectRoot: process.cwd() }),
      resolve({
        exportConditions: ["react-server", "node", "import"],
        preferBuiltins: true,
        browser: false,
      }),
      commonjs({
        ignoreDynamicRequires: true,
      }),
      {
        name: "post-build-server",
        closeBundle() {
          const serverDir = path.resolve(process.cwd(), ".dinou/dist1/server");
          fs.mkdirSync(serverDir, { recursive: true });
          fs.writeFileSync(
            path.join(serverDir, "package.json"),
            JSON.stringify({ type: "module" }, null, 2)
          );
          execSync(`"${process.execPath}" --conditions=react-server "${path.resolve(__dirname, "../core/run-ssg.js")}"`, {
            stdio: "inherit",
            env: { ...process.env, NODE_ENV: "production" },
          });
        },
      },
    ],
    onwarn(warning, warn) {
      if (warning.code === "CIRCULAR_DEPENDENCY" || warning.code === "EVAL" || warning.code === "MODULE_LEVEL_DIRECTIVE") {
        return;
      }
      warn(warning);
    },
  };

  return [clientConfig, serverConfig];
};
