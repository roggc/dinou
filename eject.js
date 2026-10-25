import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dinouPath = path.resolve(__dirname, "dinou");
const projectRoot = process.cwd();


export function eject() {
  console.log("🚀 Starting Dinou ejecting process...");

fs.cpSync(dinouPath, path.join(projectRoot, "dinou"), {
  recursive: true,
});
console.log("✅ Files copied to ./dinou");

const cliSource = path.resolve(__dirname, "cli.js");
const cliDest = path.join(projectRoot, "dinou", "cli.js");
if (fs.existsSync(cliSource)) {
  fs.copyFileSync(cliSource, cliDest);
  try {
    fs.chmodSync(cliDest, 0o755);
  } catch {}
  console.log("✅ CLI copied to ./dinou/cli.js");
}

const pkgPath = path.join(projectRoot, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

pkg.scripts = pkg.scripts || {};

const commandNames = [
  "dev",
  "build",
  "start",
  "dev:esbuild",
  "dev:rollup",
  "dev:webpack",
  "build:node",
  "build:node:esbuild",
  "build:node:rollup",
  "build:node:webpack",
  "build:node:compile",
  "build:node:compile:esbuild",
  "build:node:compile:rollup",
  "build:node:compile:webpack",
  "build:node:compile:linux",
  "build:node:compile:linux:esbuild",
  "build:node:compile:linux:rollup",
  "build:node:compile:linux:webpack",
  "build:node:compile:linux_arm",
  "build:node:compile:linux_arm:esbuild",
  "build:node:compile:linux_arm:rollup",
  "build:node:compile:linux_arm:webpack",
  "build:node:compile:mac",
  "build:node:compile:mac:esbuild",
  "build:node:compile:mac:rollup",
  "build:node:compile:mac:webpack",
  "build:node:compile:win",
  "build:node:compile:win:esbuild",
  "build:node:compile:win:rollup",
  "build:node:compile:win:webpack",
  "build:node:pure",
  "build:node:pure:esbuild",
  "build:node:pure:rollup",
  "build:node:pure:webpack",
  "build:node:pure:compile",
  "build:node:pure:compile:esbuild",
  "build:node:pure:compile:rollup",
  "build:node:pure:compile:webpack",
  "build:node:pure:compile:linux",
  "build:node:pure:compile:linux:esbuild",
  "build:node:pure:compile:linux:rollup",
  "build:node:pure:compile:linux:webpack",
  "build:node:pure:compile:linux_arm",
  "build:node:pure:compile:linux_arm:esbuild",
  "build:node:pure:compile:linux_arm:rollup",
  "build:node:pure:compile:linux_arm:webpack",
  "build:node:pure:compile:mac",
  "build:node:pure:compile:mac:esbuild",
  "build:node:pure:compile:mac:rollup",
  "build:node:pure:compile:mac:webpack",
  "build:node:pure:compile:win",
  "build:node:pure:compile:win:esbuild",
  "build:node:pure:compile:win:rollup",
  "build:node:pure:compile:win:webpack",
  "start:node",
  "start:node:esbuild",
  "start:node:rollup",
  "start:node:webpack",
  "build:cloudflare",
  "build:cloudflare:esbuild",
  "build:cloudflare:rollup",
  "build:cloudflare:webpack",
  "build:deno",
  "build:deno:esbuild",
  "build:deno:rollup",
  "build:deno:webpack",
  "build:deno:compile",
  "build:deno:compile:esbuild",
  "build:deno:compile:rollup",
  "build:deno:compile:webpack",
  "build:deno:compile:linux",
  "build:deno:compile:linux:esbuild",
  "build:deno:compile:linux:rollup",
  "build:deno:compile:linux:webpack",
  "build:deno:compile:linux_arm",
  "build:deno:compile:linux_arm:esbuild",
  "build:deno:compile:linux_arm:rollup",
  "build:deno:compile:linux_arm:webpack",
  "build:deno:compile:mac",
  "build:deno:compile:mac:esbuild",
  "build:deno:compile:mac:rollup",
  "build:deno:compile:mac:webpack",
  "build:deno:compile:win",
  "build:deno:compile:win:esbuild",
  "build:deno:compile:win:rollup",
  "build:deno:compile:win:webpack",
  "start:deno",
  "build:bun",
  "build:bun:esbuild",
  "build:bun:rollup",
  "build:bun:webpack",
  "build:bun:compile",
  "build:bun:compile:esbuild",
  "build:bun:compile:rollup",
  "build:bun:compile:webpack",
  "build:bun:compile:linux",
  "build:bun:compile:linux:esbuild",
  "build:bun:compile:linux:rollup",
  "build:bun:compile:linux:webpack",
  "build:bun:compile:linux_arm",
  "build:bun:compile:linux_arm:esbuild",
  "build:bun:compile:linux_arm:rollup",
  "build:bun:compile:linux_arm:webpack",
  "build:bun:compile:mac",
  "build:bun:compile:mac:esbuild",
  "build:bun:compile:mac:rollup",
  "build:bun:compile:mac:webpack",
  "build:bun:compile:win",
  "build:bun:compile:win:esbuild",
  "build:bun:compile:win:rollup",
  "build:bun:compile:win:webpack",
  "build:bun:pure",
  "build:bun:pure:esbuild",
  "build:bun:pure:rollup",
  "build:bun:pure:webpack",
  "build:bun:pure:compile",
  "build:bun:pure:compile:esbuild",
  "build:bun:pure:compile:rollup",
  "build:bun:pure:compile:webpack",
  "build:bun:pure:compile:linux",
  "build:bun:pure:compile:linux:esbuild",
  "build:bun:pure:compile:linux:rollup",
  "build:bun:pure:compile:linux:webpack",
  "build:bun:pure:compile:linux_arm",
  "build:bun:pure:compile:linux_arm:esbuild",
  "build:bun:pure:compile:linux_arm:rollup",
  "build:bun:pure:compile:linux_arm:webpack",
  "build:bun:pure:compile:mac",
  "build:bun:pure:compile:mac:esbuild",
  "build:bun:pure:compile:mac:rollup",
  "build:bun:pure:compile:mac:webpack",
  "build:bun:pure:compile:win",
  "build:bun:pure:compile:win:esbuild",
  "build:bun:pure:compile:win:rollup",
  "build:bun:pure:compile:win:webpack",
  "start:bun",
  "start:bun:esbuild",
  "start:bun:rollup",
  "start:bun:webpack",
  "export-static",
  "export-static:esbuild",
  "export-static:rollup",
  "export-static:webpack",
  "build:vendors"
];

const ejectedScripts = Object.fromEntries(
  commandNames.map((name) => [name, `node dinou/cli.js ${name}`])
);

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
  if (fs.existsSync(path.join(projectRoot, "bun.lockb")) || fs.existsSync(path.join(projectRoot, "bun.lock"))) return "bun";
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
}

export default eject;
