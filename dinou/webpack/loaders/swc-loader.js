// dinou/webpack/loaders/swc-loader.js
// Ultra-fast SWC transpilation loader for Webpack.
// Replaces heavy Babel pipeline in development and eliminates multi-second rebuild latencies.

const path = require("path");

let swc = null;
try {
  swc = require("@swc/core");
} catch (e) {
  // Handled on first invocation
}

module.exports = function (source, inputSourceMap) {
  if (this.cacheable) this.cacheable(true);

  if (!swc) {
    try {
      swc = require("@swc/core");
    } catch (e) {
      throw new Error(
        "[@swc/core] not found. Please ensure @swc/core is installed to use swc-loader."
      );
    }
  }

  const callback = this.async();
  const options = this.getOptions ? this.getOptions() : {};
  const isDev =
    options.isDevelopment !== undefined
      ? options.isDevelopment
      : process.env.NODE_ENV !== "production";

  const resourcePath = this.resourcePath;
  const isTs = /\.tsx?$/i.test(resourcePath);
  const isJsx = /\.[jt]sx$/i.test(resourcePath);

  swc
    .transform(source, {
      filename: resourcePath,
      sourceMaps: this.sourceMap ? true : false,
      inputSourceMap:
        typeof inputSourceMap === "string"
          ? inputSourceMap
          : inputSourceMap
            ? JSON.stringify(inputSourceMap)
            : undefined,
      jsc: {
        parser: isTs
          ? { syntax: "typescript", tsx: isJsx, dynamicImport: true }
          : { syntax: "ecmascript", jsx: true, dynamicImport: true },
        target: "es2022",
        transform: {
          react: {
            runtime: "automatic",
            development: isDev,
            refresh: false,
          },
        },
      },
    })
    .then((output) => {
      let map = undefined;
      if (output.map) {
        try {
          map = JSON.parse(output.map);
        } catch (e) {
          map = output.map;
        }
      }
      callback(null, output.code, map);
    })
    .catch((err) => {
      callback(err);
    });
};
