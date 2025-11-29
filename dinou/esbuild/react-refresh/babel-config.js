const babelConfig = {
  presets: [
    ["@babel/preset-react", { runtime: "automatic" }],
    "@babel/preset-typescript",
  ],
  plugins: [
    require.resolve("react-refresh/babel"),
    "@babel/plugin-syntax-import-meta",
  ],
  exclude: /node_modules[\\/](?!dinou|react-refresh)/,
};

module.exports.babelConfig = babelConfig;
