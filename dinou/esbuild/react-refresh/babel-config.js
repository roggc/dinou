import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

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

export { babelConfig };
export default babelConfig;
