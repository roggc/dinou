import module from "node:module";

// Compatibility shim for Webpack 5.112+ internal file reorganization with react-server-dom-webpack
const originalResolveFilename = module._resolveFilename;
if (originalResolveFilename) {
  module._resolveFilename = function (request, parent, isMain, options) {
    if (request === "webpack/lib/dependencies/ModuleDependency") {
      try {
        return originalResolveFilename.call(this, request, parent, isMain, options);
      } catch {
        return originalResolveFilename.call(
          this,
          "webpack/lib/dependencies/core/ModuleDependency",
          parent,
          isMain,
          options
        );
      }
    }
    if (request === "webpack/lib/Template") {
      try {
        return originalResolveFilename.call(this, request, parent, isMain, options);
      } catch {
        return originalResolveFilename.call(
          this,
          "webpack/lib/template/Template",
          parent,
          isMain,
          options
        );
      }
    }
    return originalResolveFilename.call(this, request, parent, isMain, options);
  };
}
