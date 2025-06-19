const { register } = require("esbuild-register/dist/node");
const { buildStaticPages } = require("./build-static-pages");
const addHook = require("./asset-require-hook.js");
register({
  target: "esnext",
  format: "cjs",
  extensions: [".js", ".jsx", ".ts", ".tsx"],
});
const createScopedName = require("./createScopedName");
require("css-modules-require-hook")({
  generateScopedName: createScopedName,
});
addHook({
  extensions: ["png", "jpg", "jpeg", "gif", "svg", "webp"],
  name: function (localName, filepath) {
    const result = createScopedName(localName, filepath);
    return result + ".[ext]";
  },
  publicPath: "images/",
});

(async () => await buildStaticPages())();
