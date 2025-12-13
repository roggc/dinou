// webpack-server-functions-plugin-simple.js
const path = require("path");
const fs = require("fs");
const manifestGeneratorPlugin = require("./manifest-generator-plugin");

class WebpackServerFunctionsPluginSimple {
  constructor() {
    this.serverFunctions = new Map();
  }

  apply(compiler) {
    const { webpack } = compiler;
    const { Compilation, sources } = webpack;

    // Recopilar archivos generados por el loader
    compiler.hooks.thisCompilation.tap(
      "WebpackServerFunctionsPluginSimple",
      (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: "WebpackServerFunctionsPluginSimple",
            stage: Compilation.PROCESS_ASSETS_STAGE_REPORT,
          },
          (assets) => {
            // 1. Reemplazar placeholder
            const manifest = manifestGeneratorPlugin.manifestData;
            const hashedPath =
              // "/" +
              manifest["serverFunctionProxy.js"] || "serverFunctionProxy.js";

            for (const [filename, asset] of Object.entries(assets)) {
              if (filename.endsWith(".js")) {
                let code = asset.source();
                if (code.includes("__SERVER_FUNCTION_PROXY__")) {
                  code = code.replace(/__SERVER_FUNCTION_PROXY__/g, hashedPath);
                  compilation.updateAsset(
                    filename,
                    new sources.RawSource(code)
                  );
                }
              }
            }

            // 2. Recopilar todos los archivos de server functions
            const serverFunctionsManifest = {};

            for (const [filename, asset] of Object.entries(assets)) {
              if (
                filename.startsWith("server-functions/") &&
                filename.endsWith(".json")
              ) {
                try {
                  const content = asset.source();
                  const entry = JSON.parse(content);
                  serverFunctionsManifest[entry.path] = entry.exports;

                  // Eliminar este archivo temporal
                  delete assets[filename];
                } catch (e) {
                  // Ignorar errores de parsing
                }
              }
            }

            // 3. Generar manifest final
            const manifestContent = JSON.stringify(
              serverFunctionsManifest,
              null,
              2
            );
            compilation.emitAsset(
              "server-functions-manifest.json",
              new sources.RawSource(manifestContent)
            );
          }
        );
      }
    );
  }
}

module.exports = WebpackServerFunctionsPluginSimple;
