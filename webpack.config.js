require("dotenv/config");
const path = require("path");
const fs = require("fs");
const ReactServerWebpackPlugin = require("react-server-dom-webpack/plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const createScopedName = require("./dinou/createScopedName");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const { exec } = require("child_process");
const WebpackShellPluginNext = require("webpack-shell-plugin-next");

const isDevelopment = process.env.NODE_ENV !== "production";

function getConfigFileIfExists() {
  const tsconfigPath = path.resolve(process.cwd(), "tsconfig.json");
  const jsconfigPath = path.resolve(process.cwd(), "jsconfig.json");

  if (fs.existsSync(tsconfigPath)) return tsconfigPath;
  if (fs.existsSync(jsconfigPath)) return jsconfigPath;

  return null;
}

const configFile = getConfigFileIfExists();

class RunAfterEmitPlugin {
  constructor(command) {
    this.command = command;
  }

  apply(compiler) {
    compiler.hooks.done.tap("RunAfterEmitPlugin", (stats) => {
      if (stats.hasErrors()) {
        console.log(
          "❌ Webpack build had errors. Skipping post-build command."
        );
        return;
      }

      console.log(
        "✅ Webpack build completed successfully. Running post-build command..."
      );
      const child = exec(this.command);
      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);
    });
  }
}

module.exports = {
  mode: isDevelopment ? "development" : "production",
  entry: {
    main: [path.resolve(__dirname, "./dinou/client.jsx")].filter(Boolean),
    error: [path.resolve(__dirname, "./dinou/client-error.jsx")].filter(
      Boolean
    ),
  },
  output: {
    path: path.resolve(process.cwd(), "./____public____"),
    filename: "[name].js",
    publicPath: "/",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              ["@babel/preset-react", { runtime: "automatic" }],
              "@babel/preset-typescript",
            ],
            plugins: [
              "@babel/plugin-transform-modules-commonjs",
              "@babel/plugin-syntax-import-meta",
            ],
          },
        },
        exclude: [/node_modules\/(?!dinou)/],
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
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
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

            return `images/${scoped}[ext]`;
          },
          publicPath: "",
        },
      },
    ],
  },
  plugins: [
    // isDevelopment &&
    //   new RunAfterEmitPlugin(
    //     `node --conditions react-server ${path.join(
    //       __dirname,
    //       "dinou/server.js"
    //     )}`
    //   ),
    // isDevelopment &&
    //   new WebpackShellPluginNext({
    //     onBuildEnd: {
    //       scripts: [
    //         `node --conditions react-server ${path.join(
    //           __dirname,
    //           "dinou/server.js"
    //         )}`,
    //       ],
    //       blocking: false,
    //       parallel: false,
    //       dev: true,
    //       safe: true,
    //       logging: true,
    //     },
    //   }),
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
  ].filter(Boolean),
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
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
    splitChunks: {
      cacheGroups: {
        styles: {
          name: "styles",
          type: "css/mini-extract",
          chunks: "all",
          enforce: true,
        },
      },
    },
  },
  watchOptions: {
    ignored: /____public____/,
  },
  ...(isDevelopment
    ? {
        devServer: {
          port: 3001,
          hot: true,
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
        },
      }
    : {}),
};
