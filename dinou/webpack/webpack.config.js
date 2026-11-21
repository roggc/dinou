import { loadReactServerWebpackPlugin } from "./helpers/patch-webpack-internals.js";
import {
  loadEnvFiles,
  getWebpackPublicEnvDefines,
} from "../core/env.js";
import { isUnvendorizedRequested } from "../core/ensure-vendor-mode.js";
import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import CopyWebpackPlugin from "#copy-webpack-plugin";
import MiniCssExtractPlugin from "#mini-css-extract-plugin";
import presetReactModule from "#babel/preset-react";
import presetTypescriptModule from "#babel/preset-typescript";
import pluginSyntaxImportMetaModule from "#babel/plugin-syntax-import-meta";
import pluginReactCompilerModule from "#babel-plugin-react-compiler";
import esbuild from "esbuild";
import createScopedName from "../core/createScopedName.js";
import {
  createBasePostCssPlugins,
  getRegisteredCssUrlAssets,
} from "../core/postcss-pipeline.js";
import {
  hasPublicStylesCss,
  warnPublicStylesCssCollision,
} from "../core/copy-static-dirs.js";
import { getDinouConfig } from "../core/load-dinou-config.js";
import {
  createWebpackTsconfigAliasesResolvePlugin,
  getWatchedTsconfigFiles,
} from "../core/tsconfig-aliases.js";
import manifestGeneratorPlugin from "./plugins/manifest-generator-plugin.js";
import ServerFunctionsPlugin from "./plugins/server-functions-plugin.js";
import WebpackMemoryPlugin from "./plugins/webpack-memory-plugin.js";
import webpack from "webpack";
import {
  getAssetExtensionsInfo,
  getAssetFileName,
  resolveAssetImport,
} from "../core/asset-extensions.js";
import getCSSEntries from "./helpers/get-webpack-entries.js";
import {
  scanProjectDependenciesForClientComponents,
  scanProjectDependenciesForClientComponentsAsync,
} from "../core/scan-dependency-components.js";
import { useClientRegex } from "../constants.js";
import { generateRouteTypes } from "../core/generate-route-types.js";
import {
  createWebpackUnderscoreDirExclude,
  webpackContextualDinouPlugin,
} from "../core/resolve-contextual-dinou.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDevelopment = process.env.NODE_ENV !== "production";
loadEnvFiles(process.cwd(), {
  mode: isDevelopment ? "development" : "production",
});
const outputDirectory = isDevelopment ? ".dinou/public" : ".dinou/dist3";

const localDinouPath = path.resolve(process.cwd(), "dinou");
const isEjected = fs.existsSync(localDinouPath);

console.log(
  isEjected
    ? "🚀 [Dinou] Ejected Mode detected (Webpack: Using local code)"
    : "📦 [Dinou] Library Mode detected (Webpack: Using node_modules)",
);

const projectRoot = process.cwd();

const outputDirs = [
  path.resolve(projectRoot, ".dinou/public"),
  path.resolve(projectRoot, ".dinou/node-dev"),
  path.resolve(projectRoot, ".dinou/dist1"),
  path.resolve(projectRoot, ".dinou/dist3"),
  path.resolve(projectRoot, "out"),
  path.resolve(projectRoot, "dist"),
];

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    } catch (e) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (err) { }
    }
  }
}

export default async () => {
  const envMode = isDevelopment ? "development" : "production";
  loadEnvFiles(process.cwd(), { mode: envMode });
  const dinouConfig = await getDinouConfig();
  const enableReactCompiler = dinouConfig?.reactCompiler !== false;
  const { regex: activeAssetRegex } = getAssetExtensionsInfo(
    dinouConfig,
    process.cwd()
  );
  try {
    generateRouteTypes(process.cwd());
  } catch (e) {}
  const outputDir = path.resolve(process.cwd(), outputDirectory);

  const shouldWriteToDisk =
    process.env.DINOU_WRITE_TO_DISK === "true" || !isDevelopment;

  // 🔥 CLEAN HARD
  if (shouldWriteToDisk) {
    cleanDir(outputDir);
    if (!isDevelopment) {
      cleanDir(path.resolve(process.cwd(), ".dinou/dist1"));
      cleanDir(path.resolve(process.cwd(), ".dinou/netlify"));
    } else {
      const nodeDevDir = path.resolve(process.cwd(), ".dinou/node-dev");
      for (const stale of [
        "react-client-manifest.json",
        "react-ssr-manifest.json",
        "server-functions-manifest.json",
        "manifest.json",
      ]) {
        try {
          fs.rmSync(path.join(nodeDevDir, stale), { force: true });
        } catch (e) {}
      }
    }
  }
  const [cssEntries, , serverFiles, serverAssetEntries] = await getCSSEntries({
    assetInclude: activeAssetRegex,
    dinouConfig,
  });
  const ReactServerWebpackPlugin = loadReactServerWebpackPlugin();
  const dinouReq = createRequire(import.meta.url);
  const projectReq = createRequire(path.resolve(process.cwd(), "package.json"));
  const resolveLoader = (specifier) => {
    try {
      return dinouReq.resolve(specifier);
    } catch {
      return projectReq.resolve(specifier);
    }
  };
  const babelLoaderPath = resolveLoader("#babel-loader");
  const cssLoaderPath = resolveLoader("#css-loader");
  const postcssLoaderPath = resolveLoader("postcss-loader");
  const unwrapBabel = (mod) => mod?.default ?? mod;
  const presetReact = unwrapBabel(presetReactModule);
  const presetTypescript = unwrapBabel(presetTypescriptModule);
  const pluginSyntaxImportMeta = unwrapBabel(pluginSyntaxImportMetaModule);
  const pluginReactCompiler = unwrapBabel(pluginReactCompilerModule);

  const dependencyClientFiles = new Set();
  if (typeof scanProjectDependenciesForClientComponentsAsync === "function") {
    await scanProjectDependenciesForClientComponentsAsync(
      process.cwd(),
      dependencyClientFiles,
      useClientRegex
    );
  } else {
    scanProjectDependenciesForClientComponents(
      process.cwd(),
      dependencyClientFiles,
      useClientRegex
    );
  }

  let ssgExecuted = false;

  function runPostBuild() {
    if (!ssgExecuted) {
      ssgExecuted = true;
      const ssgArgs = [
        "--conditions=react-server",
        ...(isUnvendorizedRequested() ? ["--conditions=unvendorized"] : []),
        path.resolve(__dirname, "../core/run-ssg.js"),
      ];
      const ssgRes = spawnSync(process.execPath, ssgArgs, {
        stdio: "inherit",
        env: {
          ...process.env,
          NODE_ENV: "production",
          DINOU_BUILD_TOOL: "webpack",
        },
      });
      if (ssgRes.status !== 0) {
        throw new Error(`[Dinou SSG] Static generation exited with code ${ssgRes.status ?? 1}`);
      }
    }
  }
  const clientConfig = {
    performance: {
      hints: isDevelopment ? false : "warning",
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    cache: isDevelopment ? { type: "memory" } : false,
    mode: isDevelopment ? "development" : "production",
    ignoreWarnings: [
      /from "autoprefixer" plugin/,
    ],
    entry: {
      main: [path.resolve(__dirname, "../core/client-webpack.jsx")].filter(
        Boolean,
      ),
      serverFunctionProxy: path.resolve(
        __dirname,
        "../core/server-function-proxy-webpack.js",
      ),
      dinouClientRedirect: path.resolve(
        __dirname,
        "../core/client-redirect.jsx",
      ),
      dinouLink: path.resolve(__dirname, "../core/link.jsx"),
      dinouSlot: path.resolve(__dirname, "../core/slot.js"),
      ...[...cssEntries].reduce(
        (acc, cssEntry) => ({
          ...acc,
          [cssEntry.outfileName]: cssEntry.absPath,
        }),
        {},
      ),
    },
    experiments: {
      outputModule: true,
    },
    output: {
      path: path.resolve(process.cwd(), outputDirectory),
      filename: isDevelopment ? "[name].js" : "[name]-[contenthash].js",
      chunkFilename: isDevelopment ? "[name].js" : "[name]-[contenthash].js",
      publicPath: "/",
      clean: shouldWriteToDisk,
      library: {
        type: "module",
      },
      environment: {
        module: true,
      },
      chunkFormat: "module", // Ensures non-entry chunks (like serverFunctionProxy) output as ESM
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          type: "javascript/auto",
          exclude: [
            /[\\/]node_modules[\\/](?!dinou)/,
            /[\\/]dinou[\\/]compiled[\\/]/,
            ...outputDirs,
          ],
          use: [
            isDevelopment
              ? {
                  loader: path.resolve(__dirname, "./loaders/swc-loader.js"),
                  options: {
                    isDevelopment: true,
                  },
                }
              : {
                  loader: babelLoaderPath,
                  options: {
                    configFile: false,
                    babelrc: false,
                    presets: [
                      [presetReact, { runtime: "automatic" }],
                      presetTypescript,
                    ],
                    plugins: [
                      enableReactCompiler && pluginReactCompiler,
                      pluginSyntaxImportMeta,
                    ].filter(Boolean),
                  },
                },
            {
              loader: path.resolve(
                __dirname,
                "./loaders/server-functions-loader.js",
              ),
              options: {
                serverFiles,
              },
            },
          ],
        },
        {
          test: /\.module\.css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                defaultExport: true,
              },
            },
            {
              loader: cssLoaderPath,
              options: {
                url: {
                  filter: (url) => !url.startsWith("/"),
                },
                import: false,
                modules: {
                  getLocalIdent: (context, localIdentName, localName) => {
                    return createScopedName(localName, context.resourcePath);
                  },
                },
                importLoaders: 1,
              },
            },
            {
              loader: postcssLoaderPath,
              options: {
                postcssOptions: {
                  config: false,
                  plugins: createBasePostCssPlugins(),
                },
              },
            },
          ],
        },
        {
          test: /\.css$/,
          exclude: /\.module\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: cssLoaderPath,
              options: {
                url: {
                  filter: (url) => !url.startsWith("/"),
                },
                import: false,
                importLoaders: 1,
              },
            },
            {
              loader: postcssLoaderPath,
              options: {
                postcssOptions: {
                  config: false,
                  plugins: createBasePostCssPlugins(),
                },
              },
            },
          ],
        },
        {
          test: activeAssetRegex,
          type: "asset/resource",
          generator: {
            filename: (pathData) => {
              const resourcePath =
                pathData.module?.resourceResolveData?.path ||
                pathData.module?.resource ||
                pathData.filename;
              return getAssetFileName(resourcePath, process.cwd());
            },
            publicPath: "/",
          },
        },
      ],
    },
    plugins: [
      webpackContextualDinouPlugin({ projectRoot: process.cwd() }),
      {
        apply(compiler) {
          compiler.hooks.normalModuleFactory.tap(
            "DinouWebpackAssetAliasPlugin",
            (nmf) => {
              nmf.hooks.beforeResolve.tap(
                "DinouWebpackAssetAliasPlugin",
                (resolveData) => {
                  if (!resolveData || !resolveData.request) return;
                  const cleanReq = resolveData.request
                    .split("?")[0]
                    .split("#")[0];
                  if (!activeAssetRegex.test(cleanReq)) return;
                  const importer = resolveData.contextInfo?.issuer || "";
                  const resolved = resolveAssetImport(resolveData.request, {
                    importer,
                    resolveDir: resolveData.context || process.cwd(),
                    projectRoot: process.cwd(),
                    assetRegex: activeAssetRegex,
                  });
                  if (resolved) {
                    resolveData.request = resolved;
                  }
                }
              );
            }
          );
        },
      },
      new ReactServerWebpackPlugin({
        isServer: false,
        clientReferences: [
          {
            directory: "./src",
            recursive: true,
            include: /\.(js|ts|jsx|tsx)$/,
            exclude: createWebpackUnderscoreDirExclude(process.cwd()),
          },
          {
            directory: path.resolve(__dirname, "../core"),
            recursive: false,
            include: /\.(js|ts|jsx|tsx)$/,
          },
          ...Array.from(dependencyClientFiles),
        ],
      }),
      {
        apply(compiler) {
          const pluginName = "DinouRelocateRscManifestsPlugin";
          compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            const { Compilation } = compiler.webpack || webpack;
            compilation.hooks.processAssets.tap(
              {
                name: pluginName,
                stage: Compilation.PROCESS_ASSETS_STAGE_REPORT + 100,
              },
              () => {
                const clientAsset = compilation.getAsset("react-client-manifest.json");
                if (clientAsset) {
                  const rawSource = clientAsset.source.source();
                  const jsonText = Buffer.isBuffer(rawSource)
                    ? rawSource.toString("utf8")
                    : String(rawSource);
                  if (typeof globalThis !== "undefined") {
                    try {
                      globalThis.__DINOU_RAW_CLIENT_MANIFEST__ = JSON.parse(jsonText);
                    } catch (e) {}
                  }
                  if (shouldWriteToDisk) {
                    const manifestDir = path.resolve(
                      process.cwd(),
                      isDevelopment ? ".dinou/node-dev" : ".dinou/dist1"
                    );
                    fs.mkdirSync(manifestDir, { recursive: true });
                    fs.writeFileSync(
                      path.join(manifestDir, "react-client-manifest.json"),
                      jsonText,
                      "utf8"
                    );
                  }
                  compilation.deleteAsset("react-client-manifest.json");
                }

                const ssrAsset = compilation.getAsset("react-ssr-manifest.json");
                if (ssrAsset) {
                  if (shouldWriteToDisk) {
                    const rawSsr = ssrAsset.source.source();
                    const ssrText = Buffer.isBuffer(rawSsr)
                      ? rawSsr.toString("utf8")
                      : String(rawSsr);
                    const manifestDir = path.resolve(
                      process.cwd(),
                      isDevelopment ? ".dinou/node-dev" : ".dinou/dist1"
                    );
                    fs.mkdirSync(manifestDir, { recursive: true });
                    fs.writeFileSync(
                      path.join(manifestDir, "react-ssr-manifest.json"),
                      ssrText,
                      "utf8"
                    );
                  }
                  compilation.deleteAsset("react-ssr-manifest.json");
                }
              }
            );
          });
        },
      },
      isDevelopment && {
        apply(compiler) {
          compiler.hooks.thisCompilation.tap(
            "DinouReactServerWatchPlugin",
            (compilation) => {
              const NormalModule = compiler.webpack ? compiler.webpack.NormalModule : webpack.NormalModule;
              const hooks = NormalModule.getCompilationHooks(compilation);
              hooks.needBuild.tap("DinouReactServerWatchPlugin", (module) => {
                if (module.resource) {
                  const normRes = path.resolve(module.resource).replace(/\\/g, "/").toLowerCase();
                  if (globalThis.__DINOU_WEBPACK_MODIFIED_FILES__?.has(normRes)) {
                    return true;
                  }
                }
                if (
                  module.resource &&
                  (module.resource.includes("client.browser") ||
                    module.resource.includes("client-webpack"))
                ) {
                  return true;
                }
              });
            }
          );
          compiler.hooks.afterCompile.tap("DinouWatchSrcPlugin", (compilation) => {
            const srcDir = path.resolve(process.cwd(), "src");
            if (fs.existsSync(srcDir)) {
              compilation.contextDependencies.add(srcDir);
            }
            for (const cfgPath of getWatchedTsconfigFiles(process.cwd())) {
              if (fs.existsSync(cfgPath)) {
                compilation.fileDependencies.add(cfgPath);
              }
            }
          });
        },
      },
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "public",
            to: ".",
            noErrorOnMissing: true,
            globOptions: {
              dot: true,
              ignore: [
                "**/.DS_Store",
                "**/Thumbs.db",
                "**/.env",
                "**/.env.*",
              ],
            },
          },
        ],
      }),
      new MiniCssExtractPlugin({
        filename: "[name].css",
      }),
      manifestGeneratorPlugin,
      new webpack.IgnorePlugin({
        checkResource(resource, context) {
          if (!context) return false;

          return outputDirs.some((dir) => context.startsWith(dir));
        },
      }),
      new ServerFunctionsPlugin({
        manifest: manifestGeneratorPlugin.manifestData,
        serverFiles,
      }),
      new webpack.DefinePlugin(
        getWebpackPublicEnvDefines({
          mode: envMode,
          extra: isDevelopment
            ? {
                DINOU_HMR_PORT: String(
                  process.env.HMR_PORT || Number(process.env.PORT || 3000) + 1
                ),
              }
            : undefined,
        })
      ),
      {
        apply(compiler) {
          const pluginName = "DinouCssAssetsAndMinifyPlugin";
          const clearRegistry = () => {
            getRegisteredCssUrlAssets().clear();
            if (typeof globalThis !== "undefined") {
              globalThis.__DINOU_HAS_COMPILED_STYLES__ = false;
            }
          };
          compiler.hooks.run.tap(pluginName, clearRegistry);
          compiler.hooks.watchRun.tap(pluginName, clearRegistry);

          compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            compilation.hooks.processAssets.tap(
              {
                name: pluginName,
                stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
              },
              () => {
                const stylesAsset = compilation.getAsset("styles.css");
                const hasCompiledStyles = Boolean(
                  stylesAsset && !stylesAsset.info?.copied
                );
                if (typeof globalThis !== "undefined") {
                  globalThis.__DINOU_HAS_COMPILED_STYLES__ = hasCompiledStyles;
                }
                if (hasCompiledStyles) {
                  if (hasPublicStylesCss(process.cwd())) {
                    warnPublicStylesCssCollision(process.cwd());
                  }
                  for (const assetObj of compilation.getAssets()) {
                    if (
                      assetObj.info?.copied &&
                      assetObj.name.toLowerCase() === "styles.css"
                    ) {
                      compilation.deleteAsset(assetObj.name);
                    }
                  }
                }

                for (const [
                  assetFileName,
                  absAssetPath,
                ] of getRegisteredCssUrlAssets().entries()) {
                  if (fs.existsSync(absAssetPath)) {
                    compilation.fileDependencies.add(absAssetPath);
                    if (
                      !compilation.getAsset(assetFileName) &&
                      !compilation.getAsset("/" + assetFileName)
                    ) {
                      try {
                        const buf = fs.readFileSync(absAssetPath);
                        compilation.emitAsset(
                          assetFileName,
                          new webpack.sources.RawSource(buf)
                        );
                      } catch (e) {}
                    }
                  }
                }

                if (serverAssetEntries && serverAssetEntries.size > 0) {
                  for (const assetEntry of serverAssetEntries) {
                    const absAssetPath = assetEntry.absPath;
                    if (!absAssetPath || !fs.existsSync(absAssetPath)) continue;
                    compilation.fileDependencies.add(absAssetPath);
                    const assetFileName = getAssetFileName(
                      absAssetPath,
                      process.cwd()
                    );
                    if (
                      !compilation.getAsset(assetFileName) &&
                      !compilation.getAsset("/" + assetFileName)
                    ) {
                      try {
                        const buf = fs.readFileSync(absAssetPath);
                        compilation.emitAsset(
                          assetFileName,
                          new webpack.sources.RawSource(buf)
                        );
                      } catch (e) {}
                    }
                  }
                }
              }
            );

            if (!isDevelopment) {
              compilation.hooks.processAssets.tap(
                {
                  name: `${pluginName}:minify`,
                  stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
                },
                () => {
                  const cssAsset = compilation.getAsset("styles.css");
                  if (!cssAsset || cssAsset.info?.copied) return;
                  try {
                    const raw = cssAsset.source.source();
                    const rawCss = Buffer.isBuffer(raw)
                      ? raw.toString("utf8")
                      : String(raw || "");
                    if (rawCss) {
                      const minified = esbuild.transformSync(rawCss, {
                        loader: "css",
                        minify: true,
                      }).code;
                      compilation.updateAsset(
                        "styles.css",
                        new webpack.sources.RawSource(minified)
                      );
                    }
                  } catch (e) {}
                }
              );
            }
          });
        },
      },
      isDevelopment && new WebpackMemoryPlugin(),
      !isDevelopment && {
        apply(compiler) {
          compiler.hooks.done.tap("PostBuildClient", (stats) => {
            if (stats.hasErrors()) return;
            runPostBuild();
          });
        },
      },
    ].filter(Boolean),
    resolve: {
      conditionNames: ["style", "import", "module", "browser", "default"],
      extensions: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".json", ".css"],
      modules: ["src", "node_modules"],
      extensionAlias: {
        ".js": [".js", ".ts", ".tsx"],
        ".jsx": [".jsx", ".tsx"],
        ".mjs": [".mjs", ".mts"],
        ".cjs": [".cjs", ".cts"],
      },
      // 🎯 ADD THIS:
      alias: {
        ...(isEjected
          ? {
              "dinou/config": path.join(localDinouPath, "core/config.js"),
              "dinou/server": path.join(localDinouPath, "server.js"),
              dinou: localDinouPath,
            }
          : {}),
      },
      fallback: {
        async_hooks: false,
        "node:async_hooks": false,
      },
      plugins: [
        createWebpackTsconfigAliasesResolvePlugin({
          projectRoot: process.cwd(),
        }),
      ],
    },
    optimization: {
      // 2. RUNTIME CHUNK: Vital for sharing module state between entry points
      runtimeChunk: "single",

      splitChunks: {
        chunks: "all", // Applies to async and sync chunks
        cacheGroups: {
          // Specific group for React and critical libraries
          reactVendor: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-server-dom-webpack|scheduler)[\\/]/,
            name: "vendor-react",
            priority: 40, // High priority to ensure they are grouped here
            chunks: "all",
            enforce: true,
          },
          // Your styles (what you already had)
          styles: {
            name: "styles",
            type: "css/mini-extract",
            chunks: "all",
            enforce: true,
          },
          // Rest of node_modules
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            // name: "vendors",
            name: false,
            priority: 20,
            chunks: "all",
            reuseExistingChunk: true,
          },
        },
      },
    },
    watchOptions: {
      aggregateTimeout: 20,
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/.dinou/node-dev/**",
        "**/.dinou/dist2/**",
        "**/.dinou/routes/**",
        "**/.dinou/types/**",
        ...outputDirs.map((dir) => `${dir}/**`),
      ],
    },
    stats: "normal", // or 'verbose' in dev
    infrastructureLogging: {
      level: "info",
    },
    ...(isDevelopment
      ? {
        devServer: {
          port: Number(process.env.HMR_PORT || (Number(process.env.PORT || 3000) + 1)),
          hot: false,
          liveReload: process.env.DINOU_STANDALONE_SERVER === "true",
          client: {
            webSocketURL: `ws://localhost:${process.env.HMR_PORT || (Number(process.env.PORT || 3000) + 1)}/ws`,
            overlay: false,
          },
          devMiddleware: {
            index: false,
            writeToDisk: process.env.DINOU_WRITE_TO_DISK === "true",
          },
          watchFiles: [],
          proxy: [
            {
              context: () => true,
              target: `http://localhost:${process.env.PORT || 3000}`,
              changeOrigin: true,
            },
          ],
        },
      }
      : {}),
  };

  return clientConfig;
};
