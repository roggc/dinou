require("dotenv/config");
const path = require("path");
const ReactServerWebpackPlugin = require("react-server-dom-webpack/plugin");
const webpack = require("webpack");

const isDevelopment = process.env.NODE_ENV !== "production";

module.exports = {
  mode: isDevelopment ? "development" : "production",
  entry: [
    isDevelopment && "webpack-hot-middleware/client?reload=true",
    path.resolve(__dirname, "./dinou/client.jsx"),
  ].filter(Boolean),
  output: {
    path: path.resolve(process.cwd(), "./public"),
    filename: "main.js",
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
        include: [
          path.resolve(process.cwd(), "src"),
          path.resolve(__dirname, "dinou"),
        ],
        exclude: [/node_modules\/(?!dinou)/, /dist/],
      },
    ],
  },
  plugins: [
    isDevelopment && new webpack.HotModuleReplacementPlugin(),
    new ReactServerWebpackPlugin({ isServer: false }),
  ].filter(Boolean),
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
};
