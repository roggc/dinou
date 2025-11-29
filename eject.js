const fs = require("fs");
const path = require("path");

const dinouPath = path.resolve(__dirname, "dinou");
const projectRoot = process.cwd();

fs.cpSync(dinouPath, path.join(projectRoot, "dinou"), {
  recursive: true,
});

const pkg = require(path.join(projectRoot, "package.json"));
pkg.scripts["dev:express"] =
  "node --conditions react-server --import ./dinou/core/register-loader.mjs ./dinou/core/server.js";
pkg.scripts["dev_rollup"] = "rollup -c ./dinou/rollup/rollup.config.js -w";
pkg.scripts["dev:rollup"] =
  'concurrently "npm run dev:express" "npm run dev_rollup"';
pkg.scripts["dev_esbuild"] = "node dinou/esbuild/dev.mjs";
pkg.scripts["dev:esbuild"] =
  'concurrently "npm run dev:express" "npm run dev_esbuild"';
pkg.scripts["dev_webpack"] =
  "webpack serve --config dinou/webpack/webpack.config.js";
pkg.scripts["dev:express:webpack"] =
  "cross-env DINOU_BUILD_TOOL=webpack node --conditions react-server --import ./dinou/core/register-loader.mjs ./dinou/core/server.js";
pkg.scripts["dev:webpack"] =
  'concurrently "npm run dev:express:webpack" "npm run dev_webpack"';
pkg.scripts.dev = "npm run dev:esbuild";
pkg.scripts["build:esbuild"] =
  "cross-env NODE_ENV=production node dinou/esbuild/build.mjs";
pkg.scripts["build:rollup"] =
  "cross-env NODE_ENV=production rollup -c ./dinou/rollup/rollup.config.js";
pkg.scripts["build:webpack"] =
  "cross-env NODE_ENV=production webpack --config dinou/webpack/webpack.config.js";
pkg.scripts.build = "npm run build:esbuild";
pkg.scripts["start:esbuild"] =
  "cross-env NODE_ENV=production node --conditions react-server --import ./dinou/core/register-loader.mjs ./dinou/core/server.js";
pkg.scripts["start:rollup"] =
  "cross-env NODE_ENV=production node --conditions react-server --import ./dinou/core/register-loader.mjs ./dinou/core/server.js";
pkg.scripts["start:webpack"] =
  "cross-env NODE_ENV=production DINOU_BUILD_TOOL=webpack node --conditions react-server --import ./dinou/core/register-loader.mjs ./dinou/core/server.js";
pkg.scripts.start = "npm run start:esbuild";
delete pkg.scripts.eject;
fs.writeFileSync(
  path.join(projectRoot, "package.json"),
  JSON.stringify(pkg, null, 2)
);

console.log("Eject completed. Now you can customize the files in /dinou.");
