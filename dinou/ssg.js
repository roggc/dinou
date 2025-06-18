const { register } = require("esbuild-register/dist/node");
const { buildStaticPages } = require("./build-static-pages");

register({
  target: "esnext",
  format: "cjs",
  extensions: [".js", ".jsx", ".ts", ".tsx"],
});

const createScopedName = require("./createScopedName");

require("css-modules-require-hook")({
  generateScopedName: createScopedName,
});

(async () => await buildStaticPages())();
