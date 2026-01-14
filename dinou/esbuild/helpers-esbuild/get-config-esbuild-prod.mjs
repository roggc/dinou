import { TsconfigPathsPlugin } from "@esbuild-plugins/tsconfig-paths";
import reactClientManifestPlugin from "../plugins-esbuild/react-client-manifest-plugin.mjs";
import serverFunctionsPlugin from "../plugins-esbuild/server-functions-plugin.mjs";
import cssProcessorPlugin from "../plugins-esbuild/css-processor-plugin.mjs";
import assetsPlugin from "../plugins-esbuild/assets-plugin.mjs";
import copyStaticFiles from "esbuild-copy-static-files";
import manifestGeneratorPlugin from "../plugins-esbuild/manifest-generator-plugin.mjs";
import writePlugin from "../plugins-esbuild/write-plugin.mjs";
import { existsSync } from "node:fs";

const manifestData = {};

export default function getConfigEsbuildProd({
  entryPoints,
  outdir = "dist3",
  manifest = {},
}) {
  let plugins = [
    TsconfigPathsPlugin({}),
    cssProcessorPlugin({ outdir }),
    reactClientManifestPlugin({
      manifest,
      manifestPath: `react_client_manifest/react-client-manifest.json`,
    }),
    assetsPlugin(),
    manifestGeneratorPlugin(manifestData),
    serverFunctionsPlugin(manifestData),
    writePlugin(),
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
    sourcemap: false,
    chunkNames: "[name]-[hash]",
    entryNames: "[name]-[hash]",
    jsx: "automatic",
    target: "es2022",
    write: false,
    conditions: ["style"],
    metafile: true,
    logLevel: "warning",
    minify: true,
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
