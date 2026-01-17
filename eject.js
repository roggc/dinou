const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const dinouPath = path.resolve(__dirname, "dinou");
const projectRoot = process.cwd();

console.log("🚀 Starting Dinou ejecting process...");

fs.cpSync(dinouPath, path.join(projectRoot, "dinou"), {
  recursive: true,
});
console.log("✅ Files copyed to ./dinou");

const pkgPath = path.join(projectRoot, "package.json");
const pkg = require(pkgPath);

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

if (!pkg.dependencies) {
  pkg.dependencies = {};
}

pkg.dependencies["dinou"] = "file:./dinou";

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent;

  if (userAgent) {
    if (userAgent.startsWith("yarn")) return "yarn";
    if (userAgent.startsWith("pnpm")) return "pnpm";
    if (userAgent.startsWith("bun")) return "bun";
    if (userAgent.startsWith("npm")) return "npm";
  }

  if (fs.existsSync(path.join(projectRoot, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(projectRoot, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(projectRoot, "bun.lockb"))) return "bun";
  if (fs.existsSync(path.join(projectRoot, "package-lock.json"))) return "npm";

  return "npm";
}

const pm = detectPackageManager();
console.log(`🕵️  Package manager detected: ${pm}`);

// const installCommand = pm === "yarn" ? "yarn" : `${pm} install`;
const installCommand = `${pm} install`;

console.log(`📦 Executing '${installCommand}' to link dependencies...`);

try {
  execSync(installCommand, { stdio: "inherit", cwd: projectRoot });
  console.log("✅ Dependencies updated successfully");
} catch (error) {
  console.error(
    `❌ Error on executing ${installCommand}. Please, install dependencies manually`,
  );
}

console.log(
  "🎉 Eject completed successfully! Dinou is now running from local source.",
);
