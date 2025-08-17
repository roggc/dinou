const path = require("path");
const postcss = require("rollup-plugin-postcss");
const babel = require("@rollup/plugin-babel").default;
const resolve = require("@rollup/plugin-node-resolve").default;
const commonjs = require("@rollup/plugin-commonjs");
const copy = require("rollup-plugin-copy");
const reactClientManifest = require("./rollup-plugins/rollup-plugin-react-client-manifest.js");
const createScopedName = require("./dinou/createScopedName.js");
const replace = require("@rollup/plugin-replace");
const json = require("@rollup/plugin-json");
const reactRefreshWrapModules = require("./react-refresh/react-refresh-wrap-modules.js");
const { esmHmrPlugin } = require("./react-refresh/rollup-plugin-esm-hmr.js");
const dinouAssetPlugin = require("./rollup-plugins/dinou-asset-plugin.js");
const tsconfigPaths = require("rollup-plugin-tsconfig-paths");

const isDevelopment = process.env.NODE_ENV !== "production";
const outputDirectory = isDevelopment ? "public" : "dist3";

module.exports = async function () {
  const del = (await import("rollup-plugin-delete")).default;
  return {
    input: isDevelopment
      ? {
          runtime: path.resolve(
            __dirname,
            "react-refresh/react-refresh-runtime.js"
          ),
          refresh: path.resolve(
            __dirname,
            "react-refresh/react-refresh-entry.js"
          ),
          main: path.resolve(__dirname, "dinou/client.jsx"),
          error: path.resolve(__dirname, "dinou/client-error.jsx"),
        }
      : {
          main: path.resolve(__dirname, "dinou/client.jsx"),
          error: path.resolve(__dirname, "dinou/client-error.jsx"),
        },
    output: {
      dir: outputDirectory,
      format: "esm",
      entryFileNames: "[name].js",
      chunkFileNames: "[name].js",
    },
    external: ["/refresh.js", "/__hmr_client__.js"],
    plugins: [
      del({
        targets: `${outputDirectory}/*`,
        runOnce: true,
        hook: "buildStart",
      }),
      tsconfigPaths(),
      replace({
        preventAssignment: true,
        "process.env.NODE_ENV": JSON.stringify(
          isDevelopment ? "development" : "production"
        ),
      }),
      json(),
      resolve({
        extensions: [".js", ".jsx", ".ts", ".tsx"],
        browser: true,
        preferBuiltins: false,
      }),
      commonjs({
        include: /node_modules/,
        transformMixedEsModules: true,
      }),
      dinouAssetPlugin({
        include:
          /\.(png|jpe?g|gif|svg|webp|avif|ico|mp4|webm|ogg|mov|avi|mkv|mp3|wav|flac|m4a|aac|mjpeg|mjpg)$/i,
      }),
      babel({
        babelHelpers: "bundled",
        extensions: [".js", ".jsx", ".ts", ".tsx"],
        presets: [
          ["@babel/preset-react", { runtime: "automatic" }],
          "@babel/preset-typescript",
        ],
        plugins: [
          isDevelopment && require.resolve("react-refresh/babel"),
          "@babel/plugin-syntax-import-meta",
        ].filter(Boolean),
        exclude: /node_modules[\\/](?!dinou|react-refresh)/,
      }),
      postcss({
        modules: {
          generateScopedName: (name, filename) =>
            createScopedName(name, filename),
        },
        extract: "styles.css",
        minimize: !isDevelopment,
        config: {
          path: path.resolve(__dirname, "postcss.config.js"),
        },
      }),
      copy({
        targets: [{ src: "favicons/*", dest: outputDirectory }],
        flatten: true,
      }),
      reactClientManifest({
        manifestPath: path.join(outputDirectory, "react-client-manifest.json"),
      }),
      isDevelopment && reactRefreshWrapModules(),
      isDevelopment && esmHmrPlugin(),
    ].filter(Boolean),
    watch: {
      exclude: ["public/**"],
    },
    onwarn(warning, warn) {
      if (
        warning.message.includes(
          'Module level directives cause errors when bundled, "use client"'
        )
      ) {
        return;
      }
      warn(warning);
    },
  };
};
