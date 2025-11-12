const fs = require("fs");
const path = require("path");

const dinouPath = path.resolve(__dirname, "dinou");
const projectRoot = process.cwd();

fs.cpSync(dinouPath, path.join(projectRoot, "dinou"), {
  recursive: true,
});

const pkg = require(path.join(projectRoot, "package.json"));
pkg.scripts["start:express"] =
  "node --conditions react-server --import ./dinou/core/register-loader.mjs ./dinou/core/server.js";
pkg.scripts["start:dev-server"] =
  "cross-env NODE_ENV=development rollup -c ./dinou/rollup.config.js -w";
pkg.scripts.dev =
  'concurrently "npm run start:express" "npm run start:dev-server"';
pkg.scripts.build =
  "cross-env NODE_ENV=production rollup -c ./dinou/rollup.config.js";
pkg.scripts.start =
  "cross-env NODE_ENV=production node --conditions react-server --import ./dinou/core/register-loader.mjs ./dinou/core/server.js";
delete pkg.scripts.eject;
fs.writeFileSync(
  path.join(projectRoot, "package.json"),
  JSON.stringify(pkg, null, 2)
);

console.log("Eject completed. Now you can customize the files in /dinou.");
