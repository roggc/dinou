import reactClientManifestPlugin from "../plugins-esbuild/react-client-manifest-plugin.js";
import serverFunctionsPlugin from "../plugins-esbuild/server-functions-plugin.js";
import cssProcessorPlugin from "../plugins-esbuild/css-processor-plugin.js";
import assetsPlugin from "../plugins-esbuild/assets-plugin.js";
import manifestGeneratorPlugin from "../plugins-esbuild/manifest-generator-plugin.js";
import writePlugin from "../plugins-esbuild/write-plugin.js";
import babelReactCompilerPlugin from "../plugins-esbuild/babel-react-compiler-plugin.js";
import { esbuildContextualDinouPlugin } from "../../core/resolve-contextual-dinou.js";
import { copyStaticDirectoriesToOutdir } from "../../core/copy-static-dirs.js";
import { getEsbuildPublicEnvDefines } from "../../core/env.js";
import { getAssetExtensionsInfo } from "../../core/asset-extensions.js";
import {
  esbuildTsconfigAliasesPlugin,
  getSanitizedEsbuildTsconfigRaw,
} from "../../core/tsconfig-aliases.js";
import { existsSync } from "node:fs";

export default function getConfigEsbuildProd({
  entryPoints,
  outdir = ".dinou/dist3",
  manifest = {},
  serverFiles,
  serverAssetPaths = [],
  dinouConfig = null,
  reactCompiler = true,
}) {
  const manifestData = {};
  const projectRoot = process.cwd();
  const parsedTsconfig = getSanitizedEsbuildTsconfigRaw(projectRoot);
  const { regex: activeAssetRegex } = getAssetExtensionsInfo(
    dinouConfig,
    projectRoot
  );
  let plugins = [
    esbuildContextualDinouPlugin({ projectRoot }),
    esbuildTsconfigAliasesPlugin({
      projectRoot,
      assetRegex: activeAssetRegex,
    }),
    cssProcessorPlugin({ outdir }),
    reactClientManifestPlugin({
      manifest,
      manifestPath: `.dinou/dist1/react-client-manifest.json`,
    }),
    assetsPlugin({
      dinouConfig,
      serverAssetPaths,
      projectRoot,
    }),
    manifestGeneratorPlugin(manifestData),
    serverFunctionsPlugin({ manifestData, serverFiles }),
    reactCompiler && babelReactCompilerPlugin({ serverFiles }),
    writePlugin(),
  ].filter(Boolean);

  if (existsSync("public")) {
    plugins = [
      ...plugins,
      {
        name: "copy-static-files",
        setup(build) {
          build.onEnd(() => {
            copyStaticDirectoriesToOutdir(projectRoot, outdir);
          });
        },
      },
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
    tsconfigRaw: parsedTsconfig,
    jsx: "automatic",
    target: "es2022",
    write: false,
    conditions: ["style"],
    metafile: true,
    logLevel: "warning",
    minify: true,
    define: getEsbuildPublicEnvDefines({ mode: "production" }),
    external: [
      "/__SERVER_FUNCTION_PROXY__",
      "/serverFunctionProxy.js",
      "/__hmr_client__.js",
      "/react-refresh-entry.js",
    ],
    plugins,
  };
}
