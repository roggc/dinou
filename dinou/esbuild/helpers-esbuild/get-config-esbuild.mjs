import reactClientManifestPlugin from "../plugins-esbuild/react-client-manifest-plugin.mjs";
import serverFunctionsPlugin from "../plugins-esbuild/server-functions-plugin.mjs";
import cssProcessorPlugin from "../plugins-esbuild/css-processor-plugin.mjs";
import esmHmrPlugin from "../react-refresh/esm-hmr-plugin.mjs";
import stableChunkNamesAndMapsPlugin from "../plugins-esbuild/stable-chunk-names-and-maps-plugin.mjs";
import assetsPlugin from "../plugins-esbuild/assets-plugin.mjs";
import skipMissingEntryPointsPlugin from "../plugins-esbuild/skip-missing-entry-points-plugin.mjs";
import fs from "node:fs";
import path from "node:path";

export default function getConfigEsbuild({
  entryPoints,
  outdir = ".dinou/public",
  manifest = {},
  changedIds,
  hmrEngine,
  serverFiles,
  onManifestUpdated,
  onBuildStart,
  onBuildEnd,
}) {
  let plugins = [
    ...(onBuildStart
      ? [
          {
            name: "build-start-notifier",
            setup(build) {
              build.onStart(() => {
                onBuildStart();
              });
            },
          },
        ]
      : []),
    skipMissingEntryPointsPlugin(),
    cssProcessorPlugin({ outdir, hmrEngine }),
    serverFunctionsPlugin({ serverFiles }),
    reactClientManifestPlugin({ manifest, onManifestUpdated }),
    assetsPlugin({ changedIds }),
    stableChunkNamesAndMapsPlugin({ changedIds }),
    esmHmrPlugin({ entryNames: ["main", "error"], changedIds, hmrEngine }),
    ...(onBuildEnd
      ? [
          {
            name: "build-end-notifier",
            setup(build) {
              build.onEnd(async (result) => {
                await onBuildEnd(result);
              });
            },
          },
        ]
      : []),
  ];

  const staticDir = fs.existsSync("public") ? "public" : (fs.existsSync("favicons") ? "favicons" : null);
  if (staticDir) {
    let staticCopied = false;
    plugins = [
      {
        name: "copy-static-files-once",
        setup(build) {
          build.onEnd(() => {
            if (staticCopied) return;
            staticCopied = true;
            try {
              fs.cpSync(staticDir, outdir, { recursive: true, force: true });
            } catch (e) {}
          });
        },
      },
      ...plugins,
    ];
  }

  const tsconfigPath = fs.existsSync("tsconfig.json") ? path.resolve("tsconfig.json") : undefined;

  return {
    entryPoints,
    outdir,
    format: "esm",
    bundle: true,
    splitting: true,
    sourcemap: true,
    tsconfig: tsconfigPath,
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
    ],
    plugins,
  };
}
