require("dotenv/config");
const path = require("path");
const fs = require("fs");
const ReactServerWebpackPlugin = require("react-server-dom-webpack/plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const createScopedName = require("../core/createScopedName");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const manifestGeneratorPlugin = require("./plugins/manifest-generator-plugin");
const ServerFunctionsPlugin = require("./plugins/server-functions-plugin");
const webpack = require("webpack");
const { regex } = require("../core/asset-extensions");
const getCSSEntries = require("./helpers/get-webpack-entries");

const isDevelopment = process.env.NODE_ENV !== "production";
const outputDirectory = isDevelopment ? ".dinou/public" : ".dinou/dist3";

function getConfigFileIfExists() {
  const tsconfigPath = path.resolve(process.cwd(), "tsconfig.json");
  const jsconfigPath = path.resolve(process.cwd(), "jsconfig.json");

  if (fs.existsSync(tsconfigPath)) return tsconfigPath;
  if (fs.existsSync(jsconfigPath)) return jsconfigPath;

  return null;
}

const configFile = getConfigFileIfExists();

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

module.exports = async () => {
  const outputDir = path.resolve(process.cwd(), outputDirectory);

  // 🔥 CLEAN HARD
  cleanDir(outputDir);
  const [cssEntries] = await getCSSEntries();

  let clientDone = false;
  let serverDone = false;
  let ssgExecuted = false;

  function runPostBuild() {
    if (clientDone && serverDone && !ssgExecuted) {
      ssgExecuted = true;
      const fs = require("fs");
      const serverDir = path.resolve(process.cwd(), ".dinou/dist3/server");
      fs.mkdirSync(serverDir, { recursive: true });
      fs.writeFileSync(
        path.join(serverDir, "package.json"),
        JSON.stringify({ type: "module" }, null, 2)
      );
      const { execSync } = require("child_process");
      execSync(`"${process.execPath}" "${path.resolve(__dirname, "../core/run-ssg.js")}"`, {
        stdio: "inherit",
        env: { ...process.env, NODE_ENV: "production", DINOU_BUILD_TOOL: "webpack" },
      });
    }
  }
  const clientConfig = {
    performance: {
      hints: isDevelopment ? false : "warning",
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    cache: false,
    mode: isDevelopment ? "development" : "production",
    entry: {
      main: [path.resolve(__dirname, "../core/client-webpack.jsx")].filter(
        Boolean,
      ),
      error: [
        path.resolve(__dirname, "../core/client-error-webpack.jsx"),
      ].filter(Boolean),
      serverFunctionProxy: path.resolve(
        __dirname,
        "../core/server-function-proxy-webpack.js",
      ),
      dinouClientRedirect: path.resolve(
        __dirname,
        "../core/client-redirect.jsx",
      ),
      dinouLink: path.resolve(__dirname, "../core/link.jsx"),
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
      clean: isDevelopment,
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
          exclude: [/[\\/]node_modules[\\/](?!dinou)/, ...outputDirs],
          use: [
            {
              loader: "babel-loader",
              options: {
                presets: [
                  ["@babel/preset-react", { runtime: "automatic" }],
                  "@babel/preset-typescript",
                ],
                plugins: [
                  "babel-plugin-react-compiler",
                  "@babel/plugin-syntax-import-meta",
                ].filter(Boolean),
              },
            },
            {
              loader: path.resolve(
                __dirname,
                "./loaders/server-functions-loader.js",
              ),
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
              loader: "css-loader",
              options: {
                modules: {
                  getLocalIdent: (context, localIdentName, localName) => {
                    return createScopedName(localName, context.resourcePath);
                  },
                },
                importLoaders: 1,
              },
            },
            "postcss-loader",
          ],
        },
        {
          test: /\.css$/,
          exclude: /\.module\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            "css-loader",
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  config: path.resolve(__dirname, "postcss.config.js"),
                },
              },
            },
          ],
        },
        {
          test: regex,
          type: "asset/resource",
          generator: {
            filename: (pathData) => {
              const resourcePath =
                pathData.module.resourceResolveData?.path ||
                pathData.module.resource;

              const base = path.basename(
                resourcePath,
                path.extname(resourcePath),
              );
              const scoped = createScopedName(base, resourcePath);

              return `/assets/${scoped}[ext]`;
            },
            publicPath: "",
          },
        },
      ],
    },
    plugins: [
      new ReactServerWebpackPlugin({
        isServer: false,
        clientReferences: [
          {
            directory: ".",
            recursive: true,
            include: /\.(js|ts|jsx|tsx)$/,
            exclude: /[\\/](?:out|dist|\.dinou|tests|__tests__|docs)[\\/]/,
          },
        ],
      }),
      isDevelopment && {
        apply(compiler) {
          compiler.hooks.thisCompilation.tap(
            "DinouReactServerWatchPlugin",
            (compilation) => {
              const hooks = webpack.NormalModule.getCompilationHooks(compilation);
              hooks.needBuild.tap("DinouReactServerWatchPlugin", (module) => {
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
          });
        },
      },
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "public",
            to: ".",
            noErrorOnMissing: true,
          },
          {
            from: "favicons",
            to: ".",
            noErrorOnMissing: true,
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
      }),
      !isDevelopment && {
        apply(compiler) {
          compiler.hooks.done.tap("PostBuildClient", () => {
            clientDone = true;
            runPostBuild();
          });
        },
      },
    ].filter(Boolean),
    resolve: {
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      modules: ["src", "node_modules"],
      extensionAlias: {
        ".js": [".js", ".ts", ".tsx"],
        ".jsx": [".jsx", ".tsx"],
      },
      // 🎯 ADD THIS:
      alias: {
        ...(isEjected ? { dinou: localDinouPath } : {}),
      },
      fallback: {
        async_hooks: false,
        "node:async_hooks": false,
      },
      plugins: configFile
        ? [
          new TsconfigPathsPlugin({
            configFile,
            extensions: [".js", ".jsx", ".ts", ".tsx"],
          }),
        ]
        : [],
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
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/.dinou/node-dev/**",
        "**/.dinou/dist2/**",
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
          port: 3001,
          hot: false,
          liveReload: true,
          client: {
            webSocketURL: "ws://localhost:3001/ws",
            overlay: false,
          },
          devMiddleware: {
            index: false,
            writeToDisk: true,
          },
          watchFiles: [
            path.resolve(process.cwd(), "src/**/*"),
          ],
          proxy: [
            {
              context: () => true,
              target: "http://localhost:3000",
              changeOrigin: true,
            },
          ],
        },
      }
      : {}),
  };

  if (isDevelopment) {
    return clientConfig;
  }

  const serverConfig = {
    mode: "production",
    target: "node20",
    experiments: {
      outputModule: true,
    },
    entry: {
      handler: path.resolve(__dirname, "../core/handler.js"),
      netlify: path.resolve(__dirname, "../adapters/netlify.js"),
    },
    output: {
      path: path.resolve(process.cwd(), outputDirectory, "server"),
      filename: "[name].js",
      library: {
        type: "module",
      },
      chunkFormat: "module",
    },
    resolve: {
      conditionNames: ["react-server", "node", "import", "require"],
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      alias: {
        ...(isEjected ? { dinou: localDinouPath } : {}),
      },
    },
    externals: [
      "express",
      "chokidar",
      "dotenv",
      "fsevents",
      "@swc/core",
      "@babel/core",
      "esbuild",
    ],
    module: {
      exprContextCritical: false,
    },
    ignoreWarnings: [
      /Critical dependency/,
    ],
    plugins: [
      new webpack.BannerPlugin({
        banner: "import { createRequire as ___createRequire } from 'node:module'; import { fileURLToPath as ___fileURLToPath } from 'node:url'; import ___path from 'node:path'; const require = ___createRequire(import.meta.url || ___path.resolve(process.cwd(), 'package.json')); globalThis.__dinou_require__ = require; const __filename = import.meta.url ? ___fileURLToPath(import.meta.url) : ___path.resolve(process.cwd(), 'index.js'); const __dirname = ___path.dirname(__filename); process.env.NODE_ENV = process.env.NODE_ENV || 'production';",
        raw: true,
        entryOnly: false,
      }),
      {
        apply(compiler) {
          compiler.hooks.done.tap("PostBuildServer", () => {
            serverDone = true;
            runPostBuild();
          });
        },
      },
    ],
  };

  return [clientConfig, serverConfig];
};
