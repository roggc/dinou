require("dotenv/config");
const path = require("path");
const fs = require("fs");
const ReactServerWebpackPlugin = require("react-server-dom-webpack/plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const createScopedName = require("../core/createScopedName");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
// const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const manifestGeneratorPlugin = require("./plugins/manifest-generator-plugin");
const ServerFunctionsPlugin = require("./plugins/server-functions-plugin");
const webpack = require("webpack");
const { regex } = require("../core/asset-extensions");
const getCSSEntries = require("./helpers/get-webpack-entries");

const isDevelopment = process.env.NODE_ENV !== "production";
const outputDirectory = isDevelopment ? "public" : "dist3";

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
  path.resolve(projectRoot, "public"),
  path.resolve(projectRoot, "dist3"),
];

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

module.exports = async () => {
  const outputDir = path.resolve(process.cwd(), outputDirectory);

  // 🔥 CLEAN HARD
  cleanDir(outputDir);
  const [cssEntries] = await getCSSEntries();
  return {
    performance: {
      hints: isDevelopment ? false : "warning",
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
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
      filename: "[name]-[contenthash].js",
      publicPath: "/",
      clean: true,
      library: {
        type: "module",
      },
      environment: {
        module: true,
      },
      // module: true,
      chunkFormat: "module", // Ensures non-entry chunks (like serverFunctionProxy) output as ESM
      // // Optional: If webpack renames to .mjs, force .js
      // chunkFilename: "[name]-[contenthash].js",
    },
    module: {
      // noParse: [/[\\/]dist3[\\/]/, /[\\/]public[\\/]/],
      rules: [
        {
          test: /\.[jt]sx?$/,
          // include: [
          //   path.resolve(process.cwd(), "src"),
          //   isEjected && path.resolve(process.cwd(), "dinou"),
          //   path.resolve(__dirname, "../core"),
          // ].filter(Boolean),
          exclude: [/node_modules\/(?!dinou)/, ...outputDirs],
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
                  // isDevelopment && require.resolve("react-refresh/babel"),
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
      // isDevelopment && new ReactRefreshWebpackPlugin({ overlay: false }),
      new ReactServerWebpackPlugin({ isServer: false }),
      new CopyWebpackPlugin({
        patterns: [
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
      plugins: configFile
        ? [
            new TsconfigPathsPlugin({
              configFile,
              extensions: [".js", ".jsx", ".ts", ".tsx"],
            }),
          ]
        : [],
    },
    // externals: {
    //   dinou: "dinou",
    // },
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
      ignored: outputDirs.map((dir) => `${dir}/**`),
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
            devMiddleware: {
              index: false,
              writeToDisk: true,
            },
            proxy: [
              {
                context: () => true,
                target: "http://localhost:3000",
                changeOrigin: true,
              },
            ],
            client: false,
          },
        }
      : {}),
  };
};
