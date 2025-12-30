import { TsconfigPathsPlugin } from "@esbuild-plugins/tsconfig-paths";
import reactClientManifestPlugin from "../plugins-esbuild/react-client-manifest-plugin.mjs";
import serverFunctionsPlugin from "../plugins-esbuild/server-functions-plugin.mjs";
import cssProcessorPlugin from "../plugins-esbuild/css-processor-plugin.mjs";
import esmHmrPlugin from "../react-refresh/esm-hmr-plugin.mjs";
import stableChunkNamesAndMapsPlugin from "../plugins-esbuild/stable-chunk-names-and-maps-plugin.mjs";
import assetsPlugin from "../plugins-esbuild/assets-plugin.mjs";
import skipMissingEntryPointsPlugin from "../plugins-esbuild/skip-missing-entry-points-plugin.mjs";
import copyStaticFiles from "esbuild-copy-static-files";
import { existsSync } from "node:fs";

export default function getConfigEsbuild({
  entryPoints,
  outdir = "public",
  manifest = {},
  changedIds,
  hmrEngine,
}) {
  let plugins = [
    skipMissingEntryPointsPlugin(),
    TsconfigPathsPlugin({}),
    cssProcessorPlugin(),
    reactClientManifestPlugin({ manifest }),
    assetsPlugin(),
    stableChunkNamesAndMapsPlugin(),
    serverFunctionsPlugin(),
    esmHmrPlugin({ entryNames: ["main", "error"], changedIds, hmrEngine }),
  ];

  if (existsSync("favicons")) {
    plugins = [
      copyStaticFiles({
        src: "favicons",
        dest: outdir,
      }),
      ...plugins,
    ];
  }

  return {
    entryPoints,
    outdir,
    format: "esm",
    bundle: true,
    splitting: true,
    sourcemap: true,
    jsx: "automatic",
    target: "es2022",
    write: false,
    conditions: ["style"],
    metafile: true,
    logLevel: "warning",
    define: {
      "process.env.NODE_ENV": JSON.stringify("development"),
    },
    external: [
      "/__SERVER_FUNCTION_PROXY__",
      "/serverFunctionProxy.js",
      "/__hmr_client__.js",
      "/react-refresh-entry.js",
      // "dinou",
    ],
    plugins,
  };
}
