import reactClientManifestPlugin from "../plugins-esbuild/react-client-manifest-plugin.js";
import serverFunctionsPlugin from "../plugins-esbuild/server-functions-plugin.js";
import cssProcessorPlugin from "../plugins-esbuild/css-processor-plugin.js";
import esmHmrPlugin from "../react-refresh/esm-hmr-plugin.js";
import stableChunkNamesAndMapsPlugin from "../plugins-esbuild/stable-chunk-names-and-maps-plugin.js";
import assetsPlugin from "../plugins-esbuild/assets-plugin.js";
import skipMissingEntryPointsPlugin from "../plugins-esbuild/skip-missing-entry-points-plugin.js";
import { swcRedirectPlugin } from "./swc-disk-cache.js";
import { esbuildContextualDinouPlugin } from "../../core/resolve-contextual-dinou.js";
import { copyStaticDirectoriesToOutdir } from "../../core/copy-static-dirs.js";
import { getEsbuildPublicEnvDefines } from "../../core/env.js";
import { getAssetExtensionsInfo } from "../../core/asset-extensions.js";
import {
  esbuildTsconfigAliasesPlugin,
  getSanitizedEsbuildTsconfigRaw,
} from "../../core/tsconfig-aliases.js";
import fs from "node:fs";

export default function getConfigEsbuild({
  entryPoints,
  outdir = ".dinou/public",
  manifest = {},
  changedIds,
  cssModuleClassChanges,
  hmrEngine,
  cssRefreshRef,
  serverFiles,
  serverAssetPaths = [],
  dinouConfig = null,
  onManifestUpdated,
  onBuildStart,
  onBuildEnd,
  hmrPort,
}) {
  const sharedCssModuleClassChanges = cssModuleClassChanges || new Set();
  let esbuildRebuildStart = 0;
  let plugins = [
    esbuildContextualDinouPlugin({ projectRoot: process.cwd() }),
    esbuildTsconfigAliasesPlugin({
      projectRoot: process.cwd(),
      getAssetRegex: () =>
        getAssetExtensionsInfo(dinouConfig, process.cwd()).regex,
      preferSwcMirror: true,
    }),
    swcRedirectPlugin({ projectRoot: process.cwd() }),
    ...(onBuildStart
      ? [
          {
            name: "build-start-notifier",
            setup(build) {
              build.onStart(() => {
                esbuildRebuildStart = Date.now();
                onBuildStart();
              });
              build.onEnd(() => {
                globalThis.__ESBUILD_PURE_TIME__ = Date.now() - esbuildRebuildStart;
              });
            },
          },
        ]
      : []),
    skipMissingEntryPointsPlugin(),
    cssProcessorPlugin({
      outdir,
      hmrEngine,
      changedIds,
      cssRefreshRef,
      cssModuleClassChanges: sharedCssModuleClassChanges,
    }),
    serverFunctionsPlugin({ serverFiles }),
    reactClientManifestPlugin({
      manifest,
      manifestPath: ".dinou/node-dev/react-client-manifest.json",
      onManifestUpdated,
    }),
    assetsPlugin({
      changedIds,
      serverAssetPaths,
      dinouConfig,
      projectRoot: process.cwd(),
    }),
    stableChunkNamesAndMapsPlugin({ changedIds }),
    esmHmrPlugin({
      entryNames: ["main", "error"],
      changedIds,
      cssModuleClassChanges: sharedCssModuleClassChanges,
      hmrEngine,
      hmrPort,
    }),
    ...(onBuildEnd
      ? [
          {
            name: "build-end-notifier",
            setup(build) {
              build.onEnd(async (result) => {
                if (esbuildRebuildStart > 0) {
                  globalThis.__ESBUILD_CORE_TIME__ = Date.now() - esbuildRebuildStart;
                }
                await onBuildEnd(result);
              });
            },
          },
        ]
      : []),
  ];

  const shouldWriteToDisk = process.env.DINOU_WRITE_TO_DISK === "true";
  if (fs.existsSync("public") && shouldWriteToDisk) {
    let staticCopied = false;
    plugins = [
      ...plugins,
      {
        name: "copy-static-files-once",
        setup(build) {
          build.onEnd(() => {
            if (staticCopied) return;
            staticCopied = true;
            copyStaticDirectoriesToOutdir(process.cwd(), outdir);
          });
        },
      },
    ];
  }

  const tsconfigRaw = getSanitizedEsbuildTsconfigRaw(process.cwd());

  const isDev = process.env.NODE_ENV !== "production";

  return {
    entryPoints,
    outdir,
    format: "esm",
    bundle: true,
    splitting: true,
    sourcemap: !isDev,
    treeShaking: !isDev,
    tsconfigRaw,
    jsx: "automatic",
    target: "es2022",
    write: false,
    conditions: ["style"],
    metafile: true,
    logLevel: "warning",
    define: getEsbuildPublicEnvDefines({ mode: "development" }),
    external: [
      "/__SERVER_FUNCTION_PROXY__",
      "/serverFunctionProxy.js",
      "/__hmr_client__.js",
      "/runtime.js",
      "/react-refresh-entry.js",
    ],
    plugins,
  };
}
