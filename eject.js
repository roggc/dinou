const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const dinouPath = path.resolve(__dirname, "dinou");
const projectRoot = process.cwd();

console.log("🚀 Starting Dinou ejecting process...");

fs.cpSync(dinouPath, path.join(projectRoot, "dinou"), {
  recursive: true,
});
console.log("✅ Files copied to ./dinou");

const pkgPath = path.join(projectRoot, "package.json");
const pkg = require(pkgPath);

pkg.scripts = pkg.scripts || {};

const ejectedScripts = {
  dev: "npm run dev:esbuild",
  build: "npm run build:node",
  start: "npm run start:node",
  "dev:esbuild": "cross-env DINOU_BUILD_TOOL=esbuild node dinou/node/dev.mjs",
  "dev:rollup": "cross-env DINOU_BUILD_TOOL=rollup node dinou/node/dev.mjs",
  "dev:webpack": "cross-env DINOU_BUILD_TOOL=webpack node dinou/node/dev.mjs",
  "build:node": "npm run build:client:esbuild && node ./dinou/node/build.mjs",
  "build:node:esbuild": "npm run build:node",
  "build:node:rollup": "npm run build:client:rollup && node ./dinou/node/build.mjs",
  "build:node:webpack": "npm run build:client:webpack && cross-env DINOU_BUILD_TOOL=webpack node ./dinou/node/build.mjs",
  "start:node": "cross-env NODE_ENV=production node dinou/adapters/node.mjs",
  "start:node:esbuild": "npm run start:node",
  "start:node:rollup": "npm run start:node",
  "start:node:webpack": "cross-env NODE_ENV=production DINOU_BUILD_TOOL=webpack node dinou/adapters/node.mjs",
  "build:cloudflare": "npm run build:client:esbuild && node ./dinou/cloudflare/build.mjs",
  "build:cloudflare:esbuild": "npm run build:cloudflare",
  "build:cloudflare:rollup": "npm run build:client:rollup && node ./dinou/cloudflare/build.mjs",
  "build:cloudflare:webpack": "npm run build:client:webpack && cross-env DINOU_BUILD_TOOL=webpack node ./dinou/cloudflare/build.mjs",
  "build:deno": "npm run build:client:esbuild && node ./dinou/deno/build.mjs && deno run --unstable-kv --allow-net --allow-read --allow-write --allow-env dinou/deno/seed-kv.js",
  "build:deno:esbuild": "npm run build:deno",
  "build:deno:rollup": "npm run build:client:rollup && node ./dinou/deno/build.mjs && deno run --unstable-kv --allow-net --allow-read --allow-write --allow-env dinou/deno/seed-kv.js",
  "build:deno:webpack": "npm run build:client:webpack && cross-env DINOU_BUILD_TOOL=webpack node ./dinou/deno/build.mjs && deno run --unstable-kv --allow-net --allow-read --allow-write --allow-env dinou/deno/seed-kv.js",
  "build:deno:compile": "npm run build:deno:compile:esbuild",
  "build:deno:compile:esbuild": "npm run build:deno:esbuild && deno compile --no-check --no-config --allow-net --allow-read --allow-write --allow-env --allow-sys --output dist/deno-server .dinou/deno/main.js",
  "build:deno:compile:rollup": "npm run build:deno:rollup && deno compile --no-check --no-config --allow-net --allow-read --allow-write --allow-env --allow-sys --output dist/deno-server .dinou/deno/main.js",
  "build:deno:compile:webpack": "npm run build:deno:webpack && deno compile --no-check --no-config --allow-net --allow-read --allow-write --allow-env --allow-sys --output dist/deno-server .dinou/deno/main.js",
  "build:deno:compile:linux": "npm run build:deno:compile:linux:esbuild",
  "build:deno:compile:linux:esbuild": "npm run build:deno:esbuild && deno compile --target x86_64-unknown-linux-gnu --no-check --no-config --allow-net --allow-read --allow-write --allow-env --allow-sys --output dist/deno-server-linux .dinou/deno/main.js",
  "build:deno:compile:linux:rollup": "npm run build:deno:rollup && deno compile --target x86_64-unknown-linux-gnu --no-check --no-config --allow-net --allow-read --allow-write --allow-env --allow-sys --output dist/deno-server-linux .dinou/deno/main.js",
  "build:deno:compile:linux:webpack": "npm run build:deno:webpack && deno compile --target x86_64-unknown-linux-gnu --no-check --no-config --allow-net --allow-read --allow-write --allow-env --allow-sys --output dist/deno-server-linux .dinou/deno/main.js",
  "build:deno:compile:linux_arm": "npm run build:deno:compile:linux_arm:esbuild",
  "build:deno:compile:linux_arm:esbuild": "npm run build:deno:esbuild && deno compile --target aarch64-unknown-linux-gnu --no-check --no-config --allow-net --allow-read --allow-write --allow-env --allow-sys --output dist/deno-server-linux-arm .dinou/deno/main.js",
  "build:deno:compile:linux_arm:rollup": "npm run build:deno:rollup && deno compile --target aarch64-unknown-linux-gnu --no-check --no-config --allow-net --allow-read --allow-write --allow-env --allow-sys --output dist/deno-server-linux-arm .dinou/deno/main.js",
  "build:deno:compile:linux_arm:webpack": "npm run build:deno:webpack && deno compile --target aarch64-unknown-linux-gnu --no-check --no-config --allow-net --allow-read --allow-write --allow-env --allow-sys --output dist/deno-server-linux-arm .dinou/deno/main.js",
  "build:deno:compile:mac": "npm run build:deno:compile:mac:esbuild",
  "build:deno:compile:mac:esbuild": "npm run build:deno:esbuild && deno compile --target aarch64-apple-darwin --no-check --no-config --allow-net --allow-read --allow-write --allow-env --allow-sys --output dist/deno-server-mac .dinou/deno/main.js",
  "build:deno:compile:mac:rollup": "npm run build:deno:rollup && deno compile --target aarch64-apple-darwin --no-check --no-config --allow-net --allow-read --allow-write --allow-env --allow-sys --output dist/deno-server-mac .dinou/deno/main.js",
  "build:deno:compile:mac:webpack": "npm run build:deno:webpack && deno compile --target aarch64-apple-darwin --no-check --no-config --allow-net --allow-read --allow-write --allow-env --allow-sys --output dist/deno-server-mac .dinou/deno/main.js",
  "build:deno:compile:win": "npm run build:deno:compile:win:esbuild",
  "build:deno:compile:win:esbuild": "npm run build:deno:esbuild && deno compile --target x86_64-pc-windows-msvc --no-check --no-config --allow-net --allow-read --allow-write --allow-env --allow-sys --output dist/deno-server-win .dinou/deno/main.js",
  "build:deno:compile:win:rollup": "npm run build:deno:rollup && deno compile --target x86_64-pc-windows-msvc --no-check --no-config --allow-net --allow-read --allow-write --allow-env --allow-sys --output dist/deno-server-win .dinou/deno/main.js",
  "build:deno:compile:win:webpack": "npm run build:deno:webpack && deno compile --target x86_64-pc-windows-msvc --no-check --no-config --allow-net --allow-read --allow-write --allow-env --allow-sys --output dist/deno-server-win .dinou/deno/main.js",
  "start:deno": "deno run --unstable-kv --allow-net --allow-read --allow-write --allow-env --allow-sys dinou/adapters/deno.js",
  "build:bun": "npm run build:client:esbuild && node ./dinou/bun/build.mjs",
  "build:bun:esbuild": "npm run build:bun",
  "build:bun:rollup": "npm run build:client:rollup && node ./dinou/bun/build.mjs",
  "build:bun:webpack": "npm run build:client:webpack && cross-env DINOU_BUILD_TOOL=webpack node ./dinou/bun/build.mjs",
  "build:bun:compile": "npm run build:bun:compile:esbuild",
  "build:bun:compile:esbuild": "npm run build:bun:esbuild && bun build --compile .dinou/bun/server.js --outfile dist/server",
  "build:bun:compile:rollup": "npm run build:bun:rollup && bun build --compile .dinou/bun/server.js --outfile dist/server",
  "build:bun:compile:webpack": "npm run build:bun:webpack && bun build --compile .dinou/bun/server.js --outfile dist/server",
  "build:bun:compile:linux": "npm run build:bun:compile:linux:esbuild",
  "build:bun:compile:linux:esbuild": "npm run build:bun:esbuild && bun build --compile --target=bun-linux-x64 .dinou/bun/server.js --outfile dist/server-linux",
  "build:bun:compile:linux:rollup": "npm run build:bun:rollup && bun build --compile --target=bun-linux-x64 .dinou/bun/server.js --outfile dist/server-linux",
  "build:bun:compile:linux:webpack": "npm run build:bun:webpack && bun build --compile --target=bun-linux-x64 .dinou/bun/server.js --outfile dist/server-linux",
  "build:bun:compile:linux_arm": "npm run build:bun:compile:linux_arm:esbuild",
  "build:bun:compile:linux_arm:esbuild": "npm run build:bun:esbuild && bun build --compile --target=bun-linux-arm64 .dinou/bun/server.js --outfile dist/server-linux-arm",
  "build:bun:compile:linux_arm:rollup": "npm run build:bun:rollup && bun build --compile --target=bun-linux-arm64 .dinou/bun/server.js --outfile dist/server-linux-arm",
  "build:bun:compile:linux_arm:webpack": "npm run build:bun:webpack && bun build --compile --target=bun-linux-arm64 .dinou/bun/server.js --outfile dist/server-linux-arm",
  "build:bun:compile:mac": "npm run build:bun:compile:mac:esbuild",
  "build:bun:compile:mac:esbuild": "npm run build:bun:esbuild && bun build --compile --target=bun-darwin-arm64 .dinou/bun/server.js --outfile dist/server-mac",
  "build:bun:compile:mac:rollup": "npm run build:bun:rollup && bun build --compile --target=bun-darwin-arm64 .dinou/bun/server.js --outfile dist/server-mac",
  "build:bun:compile:mac:webpack": "npm run build:bun:webpack && bun build --compile --target=bun-darwin-arm64 .dinou/bun/server.js --outfile dist/server-mac",
  "build:bun:compile:win": "npm run build:bun:compile:win:esbuild",
  "build:bun:compile:win:esbuild": "npm run build:bun:esbuild && bun build --compile --target=bun-windows-x64 .dinou/bun/server.js --outfile dist/server-win",
  "build:bun:compile:win:rollup": "npm run build:bun:rollup && bun build --compile --target=bun-windows-x64 .dinou/bun/server.js --outfile dist/server-win",
  "build:bun:compile:win:webpack": "npm run build:bun:webpack && bun build --compile --target=bun-windows-x64 .dinou/bun/server.js --outfile dist/server-win",
  "build:bun:pure": "npm run build:bun:pure:esbuild",
  "build:bun:pure:esbuild": "cross-env NODE_ENV=production bun dinou/esbuild/build.mjs && bun ./dinou/bun/build.mjs",
  "build:bun:pure:rollup": "cross-env NODE_ENV=production rollup -c ./dinou/rollup/rollup.config.js && bun ./dinou/bun/build.mjs",
  "build:bun:pure:webpack": "cross-env NODE_ENV=production webpack --config dinou/webpack/webpack.config.js && cross-env DINOU_BUILD_TOOL=webpack bun ./dinou/bun/build.mjs",
  "build:bun:pure:compile": "npm run build:bun:pure:compile:esbuild",
  "build:bun:pure:compile:esbuild": "npm run build:bun:pure:esbuild && bun build --compile .dinou/bun/server.js --outfile dist/server",
  "build:bun:pure:compile:rollup": "npm run build:bun:pure:rollup && bun build --compile .dinou/bun/server.js --outfile dist/server",
  "build:bun:pure:compile:webpack": "npm run build:bun:pure:webpack && bun build --compile .dinou/bun/server.js --outfile dist/server",
  "build:bun:pure:compile:linux": "npm run build:bun:pure:compile:linux:esbuild",
  "build:bun:pure:compile:linux:esbuild": "npm run build:bun:pure:esbuild && bun build --compile --target=bun-linux-x64 .dinou/bun/server.js --outfile dist/server-linux",
  "build:bun:pure:compile:linux:rollup": "npm run build:bun:pure:rollup && bun build --compile --target=bun-linux-x64 .dinou/bun/server.js --outfile dist/server-linux",
  "build:bun:pure:compile:linux:webpack": "npm run build:bun:pure:webpack && bun build --compile --target=bun-linux-x64 .dinou/bun/server.js --outfile dist/server-linux",
  "build:bun:pure:compile:linux_arm": "npm run build:bun:pure:compile:linux_arm:esbuild",
  "build:bun:pure:compile:linux_arm:esbuild": "npm run build:bun:pure:esbuild && bun build --compile --target=bun-linux-arm64 .dinou/bun/server.js --outfile dist/server-linux-arm",
  "build:bun:pure:compile:linux_arm:rollup": "npm run build:bun:pure:rollup && bun build --compile --target=bun-linux-arm64 .dinou/bun/server.js --outfile dist/server-linux-arm",
  "build:bun:pure:compile:linux_arm:webpack": "npm run build:bun:pure:webpack && bun build --compile --target=bun-linux-arm64 .dinou/bun/server.js --outfile dist/server-linux-arm",
  "build:bun:pure:compile:mac": "npm run build:bun:pure:compile:mac:esbuild",
  "build:bun:pure:compile:mac:esbuild": "npm run build:bun:pure:esbuild && bun build --compile --target=bun-darwin-arm64 .dinou/bun/server.js --outfile dist/server-mac",
  "build:bun:pure:compile:mac:rollup": "npm run build:bun:pure:rollup && bun build --compile --target=bun-darwin-arm64 .dinou/bun/server.js --outfile dist/server-mac",
  "build:bun:pure:compile:mac:webpack": "npm run build:bun:pure:webpack && bun build --compile --target=bun-darwin-arm64 .dinou/bun/server.js --outfile dist/server-mac",
  "build:bun:pure:compile:win": "npm run build:bun:pure:compile:win:esbuild",
  "build:bun:pure:compile:win:esbuild": "npm run build:bun:pure:esbuild && bun build --compile --target=bun-windows-x64 .dinou/bun/server.js --outfile dist/server-win",
  "build:bun:pure:compile:win:rollup": "npm run build:bun:pure:rollup && bun build --compile --target=bun-windows-x64 .dinou/bun/server.js --outfile dist/server-win",
  "build:bun:pure:compile:win:webpack": "npm run build:bun:pure:webpack && bun build --compile --target=bun-windows-x64 .dinou/bun/server.js --outfile dist/server-win",
  "start:bun": "cross-env NODE_ENV=production bun dinou/adapters/bun.js",
  "start:bun:esbuild": "npm run start:bun",
  "start:bun:rollup": "npm run start:bun",
  "start:bun:webpack": "cross-env NODE_ENV=production DINOU_BUILD_TOOL=webpack bun dinou/adapters/bun.js",
  "export-static": "npm run export-static:esbuild",
  "export-static:esbuild": "npm run build:client:esbuild && node ./dinou/core/export-static.mjs",
  "export-static:rollup": "npm run build:client:rollup && node ./dinou/core/export-static.mjs",
  "export-static:webpack": "npm run build:client:webpack && node ./dinou/core/export-static.mjs",
  "build:client:esbuild": "cross-env NODE_ENV=production node dinou/esbuild/build.mjs",
  "build:client:rollup": "cross-env NODE_ENV=production rollup -c ./dinou/rollup/rollup.config.js",
  "build:client:webpack": "cross-env NODE_ENV=production webpack --config dinou/webpack/webpack.config.js",
};

Object.assign(pkg.scripts, ejectedScripts);

delete pkg.scripts.eject;

if (!pkg.dependencies) {
  pkg.dependencies = {};
}

pkg.dependencies["dinou"] = "file:./dinou";

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

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
console.log(`📦 Package manager detected: ${pm}`);

const installCommand = `${pm} install`;

console.log(`🔄 Executing '${installCommand}' to link dependencies...`);

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
