require("dotenv/config");
const path = require("path");
const fs = require("fs");
const ReactServerWebpackPlugin = require("react-server-dom-webpack/plugin");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const isDevelopment = process.env.NODE_ENV !== "production";
const stylesPath = path.resolve(process.cwd(), "./src/styles.css");
const stylesDefaultPath = path.resolve(__dirname, "./dinou/styles.css");

module.exports = {
  mode: isDevelopment ? "development" : "production",
  entry: {
    main: [
      isDevelopment && "webpack-hot-middleware/client?reload=true",
      path.resolve(__dirname, "./dinou/client.jsx"),
    ].filter(Boolean),
    ...(fs.existsSync(stylesPath)
      ? { styles: stylesPath }
      : { styles: stylesDefaultPath }),
  },
  output: {
    path: path.resolve(process.cwd(), "./public"),
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
        exclude: [/node_modules\/(?!dinou)/, /dist/],
      },
      {
        test: /\.css$/,
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
    ],
  },
  plugins: [
    isDevelopment && new webpack.HotModuleReplacementPlugin(),
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
  },
};
