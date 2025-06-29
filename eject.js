const fs = require("fs");
const path = require("path");

const dinouPath = path.resolve(__dirname, "dinou");
const modulePath = path.resolve(__dirname);
const projectRoot = process.cwd();

fs.cpSync(dinouPath, path.join(projectRoot, "dinou"), {
  recursive: true,
});

if (fs.existsSync(path.join(modulePath, "webpack.config.js"))) {
  fs.copyFileSync(
    path.join(modulePath, "webpack.config.js"),
    path.join(projectRoot, "webpack.config.js")
  );
}

if (fs.existsSync(path.join(modulePath, "postcss.config.js"))) {
  fs.copyFileSync(
    path.join(modulePath, "postcss.config.js"),
    path.join(projectRoot, "postcss.config.js")
  );
}

const pkg = require(path.join(projectRoot, "package.json"));
pkg.scripts["start:express"] = "node --conditions react-server dinou/server.js";
pkg.scripts["start:dev-server"] = "webpack serve --config webpack.config.js";
pkg.scripts.dev =
  'concurrently "npm run start:express" "npm run start:dev-server"';
pkg.scripts.build = "cross-env NODE_ENV=production webpack";
pkg.scripts.start =
  "cross-env NODE_ENV=production node --conditions react-server dinou/server.js";
delete pkg.scripts.eject;
fs.writeFileSync(
  path.join(projectRoot, "package.json"),
  JSON.stringify(pkg, null, 2)
);

console.log(
  "Eject completed. Now you can customize the files in /dinou and webpack.config.js."
);
