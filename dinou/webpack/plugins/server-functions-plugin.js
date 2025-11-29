// ServerFunctionsPlugin.js
class ServerFunctionsPlugin {
  constructor({ manifest }) {
    this.manifest = manifest;
  }

  apply(compiler) {
    const pluginName = "ServerFunctionsPlugin";

    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE,
        },
        (assets) => {
          const proxyPath =
            "/" +
            (this.manifest["serverFunctionProxy.js"] ||
              "serverFunctionProxy.js");

          for (const filename of Object.keys(assets)) {
            let source = assets[filename].source();
            if (typeof source !== "string") continue;

            if (!source.includes("__SERVER_FUNCTION_PROXY__")) continue;

            const replaced = source.replace(
              /__SERVER_FUNCTION_PROXY__/g,
              proxyPath
            );

            compilation.updateAsset(filename, (old) => ({
              source: () => replaced,
              size: () => replaced.length,
            }));
          }
        }
      );
    });
  }
}

module.exports = ServerFunctionsPlugin;
