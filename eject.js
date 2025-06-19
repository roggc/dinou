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

// don't copy the LICENSE.md file, as it is not needed in the project root
// fs.copyFileSync(
//   path.join(modulePath, "LICENSE.md"),
//   path.join(projectRoot, "dinou/LICENSE.md")
// );

const pkg = require(path.join(projectRoot, "package.json"));
pkg.scripts.dev =
  "node dinou/ssg.js && node --conditions react-server dinou/server.js";
pkg.scripts.build =
  "node dinou/ssg.js && cross-env NODE_ENV=production webpack";
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
