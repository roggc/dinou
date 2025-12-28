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

module.exports = async () => {
  const [cssEntries] = await getCSSEntries();
  return {
    mode: isDevelopment ? "development" : "production",
    entry: {
      main: [path.resolve(__dirname, "../core/client-webpack.jsx")].filter(
        Boolean
      ),
      error: [
        path.resolve(__dirname, "../core/client-error-webpack.jsx"),
      ].filter(Boolean),
      serverFunctionProxy: path.resolve(
        __dirname,
        "../core/server-function-proxy-webpack.js"
      ),
      ...[...cssEntries].reduce(
        (acc, cssEntry) => ({
          ...acc,
          [cssEntry.outfileName]: cssEntry.absPath,
        }),
        {}
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
      noParse: [/dist3/, /public/],
      rules: [
        // {
        //   test: /\.(js|jsx|ts|tsx)$/,
        //   include: path.resolve(process.cwd(), "dist3"),
        //   use: "null-loader",
        // },

        {
          test: /\.(js|jsx|ts|tsx)$/,
          include: [
            path.resolve(process.cwd(), "src"),
            path.resolve(__dirname, "../core"),
          ],
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                ["@babel/preset-react", { runtime: "automatic" }],
                "@babel/preset-typescript",
              ],
              plugins: [
                "@babel/plugin-syntax-import-meta",
                // isDevelopment && require.resolve("react-refresh/babel"),
              ].filter(Boolean),
            },
          },
          exclude: [
            /node_modules\/(?!dinou)/,
            path.resolve(process.cwd(), "dist3"),
            path.resolve(process.cwd(), "public"),
          ],
        },
        {
          test: /\.[jt]sx?$/,
          include: path.resolve(process.cwd(), "src"),
          use: [
            {
              loader: path.resolve(
                __dirname,
                "./loaders/server-functions-loader.js"
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
                path.extname(resourcePath)
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
      // Ignore any imports that reference the output folders
      new webpack.IgnorePlugin({ resourceRegExp: /(dist3|public)/ }),
      new ServerFunctionsPlugin({
        manifest: manifestGeneratorPlugin.manifestData,
      }),
    ].filter(Boolean),
    resolve: {
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      modules: ["src", "node_modules"],
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
      // 2. RUNTIME CHUNK: Vital para compartir el estado de los módulos entre entry points
      runtimeChunk: "single",

      splitChunks: {
        chunks: "all", // Aplica a async y sync chunks
        cacheGroups: {
          // Grupo específico para React y librerías críticas
          reactVendor: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-server-dom-webpack|scheduler)[\\/]/,
            name: "vendor-react",
            priority: 40, // Prioridad alta para asegurar que se agrupen aquí
            chunks: "all",
            enforce: true,
          },
          // Tus estilos (lo que ya tenías)
          styles: {
            name: "styles",
            type: "css/mini-extract",
            chunks: "all",
            enforce: true,
          },
          // Resto de node_modules
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: 20,
            chunks: "all",
            reuseExistingChunk: true,
          },
        },
      },
    },
    watchOptions: {
      ignored: ["public/", "dist3/"],
    },
    stats: "normal", // o 'verbose' en dev
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
