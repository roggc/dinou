import reactClientManifestPlugin from "../plugins-esbuild/react-client-manifest-plugin.mjs";
import serverFunctionsPlugin from "../plugins-esbuild/server-functions-plugin.mjs";
import cssProcessorPlugin from "../plugins-esbuild/css-processor-plugin.mjs";
import esmHmrPlugin from "../react-refresh/esm-hmr-plugin.mjs";
import stableChunkNamesAndMapsPlugin from "../plugins-esbuild/stable-chunk-names-and-maps-plugin.mjs";
import assetsPlugin from "../plugins-esbuild/assets-plugin.mjs";
import skipMissingEntryPointsPlugin from "../plugins-esbuild/skip-missing-entry-points-plugin.mjs";
import { swcRedirectPlugin } from "./swc-disk-cache.mjs";
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
  hmrPort,
}) {
  let esbuildRebuildStart = 0;
  let plugins = [
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
    cssProcessorPlugin({ outdir, hmrEngine }),
    serverFunctionsPlugin({ serverFiles }),
    reactClientManifestPlugin({ manifest, onManifestUpdated }),
    assetsPlugin({ changedIds }),
    stableChunkNamesAndMapsPlugin({ changedIds }),
    esmHmrPlugin({ entryNames: ["main", "error"], changedIds, hmrEngine, hmrPort }),
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
  const staticDir = fs.existsSync("public") ? "public" : (fs.existsSync("favicons") ? "favicons" : null);
  if (staticDir && shouldWriteToDisk) {
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

  let userTsconfig = {};
  if (fs.existsSync("tsconfig.json")) {
    try {
      const raw = fs.readFileSync("tsconfig.json", "utf8");
      const clean = raw.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "").replace(/,(\s*[}\]])/g, "$1");
      userTsconfig = JSON.parse(clean);
    } catch (e) {}
  }
  const compilerOptions = userTsconfig.compilerOptions || {};
  const userPaths = compilerOptions.paths || {};

  const paths = {};
  for (const [alias, targets] of Object.entries(userPaths)) {
    const list = Array.isArray(targets) ? targets : [targets];
    const swcTargets = list.map((t) => {
      const norm = t.replace(/^\.\//, "");
      return `.dinou/swc/${norm}`;
    });
    paths[alias] = [...swcTargets, ...list];
  }
  if (!paths["@/*"]) {
    paths["@/*"] = [".dinou/swc/src/*", "src/*"];
  }
  if (!paths["~/*"]) {
    paths["~/*"] = [".dinou/swc/src/*", "src/*"];
  }

  const tsconfigRaw = {
    ...userTsconfig,
    compilerOptions: {
      ...compilerOptions,
      baseUrl: compilerOptions.baseUrl || ".",
      paths,
    },
  };

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
