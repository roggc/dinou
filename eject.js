const fs = require("fs");
const path = require("path");

const dinouPath = path.resolve(__dirname, "dinou");
const reactRefreshPath = path.resolve(__dirname, "react-refresh");
const rollupPluginsPath = path.resolve(__dirname, "rollup-plugins");
const modulePath = path.resolve(__dirname);
const projectRoot = process.cwd();

fs.cpSync(dinouPath, path.join(projectRoot, "dinou"), {
  recursive: true,
});

fs.cpSync(reactRefreshPath, path.join(projectRoot, "react-refresh"), {
  recursive: true,
});

fs.cpSync(rollupPluginsPath, path.join(projectRoot, "rollup-plugins"), {
  recursive: true,
});

if (fs.existsSync(path.join(modulePath, "rollup.config.js"))) {
  fs.copyFileSync(
    path.join(modulePath, "rollup.config.js"),
    path.join(projectRoot, "rollup.config.js")
  );
}

if (fs.existsSync(path.join(modulePath, "postcss.config.js"))) {
  fs.copyFileSync(
    path.join(modulePath, "postcss.config.js"),
    path.join(projectRoot, "postcss.config.js")
  );
}

const pkg = require(path.join(projectRoot, "package.json"));
pkg.scripts["start:express"] =
  "node --conditions react-server --import dinou/register-loader.mjs dinou/server.js";
pkg.scripts["start:dev-server"] = "cross-env NODE_ENV=development rollup -c -w";
pkg.scripts.dev =
  'concurrently "npm run start:express" "npm run start:dev-server"';
pkg.scripts.build = "cross-env NODE_ENV=production rollup -c";
pkg.scripts.start =
  "cross-env NODE_ENV=production node --conditions react-server --import dinou/register-loader.mjs dinou/server.js";
delete pkg.scripts.eject;
fs.writeFileSync(
  path.join(projectRoot, "package.json"),
  JSON.stringify(pkg, null, 2)
);

console.log(
  "Eject completed. Now you can customize the files in /dinou and rollup.config.js."
);
