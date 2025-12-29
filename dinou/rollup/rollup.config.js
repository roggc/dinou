const path = require("path");
const fs = require("fs");
const postcss = require("rollup-plugin-postcss");
const babel = require("@rollup/plugin-babel").default;
const resolve = require("@rollup/plugin-node-resolve").default;
const commonjs = require("@rollup/plugin-commonjs");
const copy = require("rollup-plugin-copy");
const reactClientManifest = require("./rollup-plugins/rollup-plugin-react-client-manifest.js");
const createScopedName = require("../core/createScopedName.js");
const replace = require("@rollup/plugin-replace");
const json = require("@rollup/plugin-json");
const reactRefreshWrapModules = require("./react-refresh/react-refresh-wrap-modules.js");
const { esmHmrPlugin } = require("./react-refresh/rollup-plugin-esm-hmr.js");
const dinouAssetPlugin = require("./rollup-plugins/dinou-asset-plugin.js");
const tsconfigPaths = require("rollup-plugin-tsconfig-paths");
const serverFunctionsPlugin = require("./rollup-plugins/rollup-plugin-server-functions");
const { regex } = require("../core/asset-extensions.js");
const manifestGeneratorPlugin = require("./rollup-plugins/manifest-generator-plugin.js");

const isDevelopment = process.env.NODE_ENV !== "production";
const outputDirectory = isDevelopment ? "public" : "dist3";

const localDinouPath = path.resolve(process.cwd(), "dinou/index.js");
// const localNavigationPath = path.resolve(
//   process.cwd(),
//   "dinou/core/navigation.js"
// );
const isEjected = fs.existsSync(localDinouPath);

console.log(
  isEjected
    ? "🚀 [Dinou] Modo Eyectado detectado (Usando código local)"
    : "📦 [Dinou] Modo Librería detectado (Usando node_modules)"
);

// ----------------------------------------------------------------------
// 🛠️ MICRO-PLUGIN DE ALIAS (Cero Dependencias)
// ----------------------------------------------------------------------
function localDinouAlias() {
  return {
    name: "local-dinou-alias",
    resolveId(source) {
      // Si importan "dinou", devolvemos la ruta absoluta local
      if (source === "dinou") {
        return localDinouPath;
      }
      // // Si importan "dinou/navigation", devolvemos la ruta absoluta local
      // if (source === "dinou/navigation") {
      //   return localNavigationPath;
      // }
      return null; // Si no es dinou, dejamos que otros plugins resuelvan
    },
  };
}

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
          main: path.resolve(__dirname, "../core/client.jsx"),
          error: path.resolve(__dirname, "../core/client-error.jsx"),
          serverFunctionProxy: path.resolve(
            __dirname,
            "../core/server-function-proxy.js"
          ),
          dinouClientRedirect: path.resolve(
            __dirname,
            "../core/client-redirect.jsx"
          ),
        }
      : {
          main: path.resolve(__dirname, "../core/client.jsx"),
          error: path.resolve(__dirname, "../core/client-error.jsx"),
          serverFunctionProxy: path.resolve(
            __dirname,
            "../core/server-function-proxy.js"
          ),
          dinouClientRedirect: path.resolve(
            __dirname,
            "../core/client-redirect.jsx"
          ),
        },
    output: {
      dir: outputDirectory,
      format: "esm",
      entryFileNames: isDevelopment ? "[name].js" : "[name]-[hash].js",
      chunkFileNames: isDevelopment ? "[name].js" : "[name]-[hash].js",
      // 🛑 LA SOLUCIÓN MAGICA 👇
      // Por defecto es 'true' en algunos casos.
      // Al ponerlo en 'false', obligas a Rollup a usar el nombre original
      // de la variable exportada en lugar de 'C', 'a', 'b', etc.
      minifyInternalExports: false,
    },
    // 🛑 AÑADE ESTA LÍNEA MÁGICA
    // Le dice a Rollup: "Mantén las firmas (nombres de exportación) de los entry points intactas"
    preserveEntrySignatures: "exports-only",
    external: [
      "/refresh.js",
      "/__hmr_client__.js",
      "/__SERVER_FUNCTION_PROXY__",
      // "dinou",
    ],
    plugins: [
      isEjected && localDinouAlias(),
      del({
        targets: [
          `${outputDirectory}/*`,
          "react_client_manifest/*",
          "server_functions_manifest/*",
        ],
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
        include: isEjected ? [/node_modules/, /dinou/] : /node_modules/,
        transformMixedEsModules: true,
      }),
      dinouAssetPlugin({
        include: regex,
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
        targets: [
          {
            src: "favicons/*",
            dest: outputDirectory,
          },
        ],
        flatten: true,
      }),
      reactClientManifest({
        manifestPath: path.join(
          "react_client_manifest",
          "react-client-manifest.json"
        ),
      }),
      isDevelopment && reactRefreshWrapModules(),
      isDevelopment && esmHmrPlugin(),
      !isDevelopment && manifestGeneratorPlugin(),
      serverFunctionsPlugin(),
    ].filter(Boolean),
    watch: {
      exclude: ["public/**", "react_client_manifest/**"],
    },
    onwarn(warning, warn) {
      // Ignorar warning de eval si viene de nuestro archivo request-context
      if (warning.code === "EVAL") {
        // Opcional: Si quieres ser muy específico y solo permitirlo en ese archivo:
        if (warning.loc && warning.loc.file.includes("request-context.js")) {
          return;
        }
        // Si quieres matarlo siempre que aparezca (más seguro para evitar ruido):
        // return;
      }
      if (
        warning.message.includes(
          'Module level directives cause errors when bundled, "use client"'
        ) ||
        warning.message.includes(
          'Module level directives cause errors when bundled, "use server"'
        )
      ) {
        return;
      }
      warn(warning);
    },
  };
};
