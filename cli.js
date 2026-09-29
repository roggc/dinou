#!/usr/bin/env node

const { program } = require("commander");
const { execSync } = require("child_process");
const path = require("path");

const dinouPath = path.resolve(__dirname, "dinou");
const projectRoot = process.cwd();

const runCommand = (command, options = {}) => {
  try {
    execSync(command, { stdio: "inherit", cwd: projectRoot, ...options });
  } catch (error) {
    console.error(`Error executing "${command}":`, error.message);
    process.exit(1);
  }
};

// Helper paths
const p = (rel) => path.join(dinouPath, rel);

// --- DEV ---

program
  .command("dev")
  .description("Start development server with Esbuild")
  .action(() => {
    runCommand(`cross-env DINOU_BUILD_TOOL=esbuild node ${p("node/dev.mjs")}`);
  });

program
  .command("dev:esbuild")
  .description("Start development server with Esbuild")
  .action(() => {
    runCommand(`cross-env DINOU_BUILD_TOOL=esbuild node ${p("node/dev.mjs")}`);
  });

program
  .command("dev:rollup")
  .description("Start development server with Rollup")
  .action(() => {
    runCommand(`cross-env DINOU_BUILD_TOOL=rollup node ${p("node/dev.mjs")}`);
  });

program
  .command("dev:webpack")
  .description("Start development server with Webpack")
  .action(() => {
    runCommand(`cross-env DINOU_BUILD_TOOL=webpack node ${p("node/dev.mjs")}`);
  });

// --- NODE (BUILD & START) ---

program
  .command("build")
  .description("Build the app for Node.js production (using esbuild)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("esbuild/build.mjs")} && node ${p("node/build.mjs")}`);
  });

program
  .command("build:node")
  .description("Build the app for Node.js production (using esbuild)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("esbuild/build.mjs")} && node ${p("node/build.mjs")}`);
  });

program
  .command("build:node:esbuild")
  .description("Build the app for Node.js with Esbuild")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("esbuild/build.mjs")} && node ${p("node/build.mjs")}`);
  });

program
  .command("build:node:rollup")
  .description("Build the app for Node.js with Rollup")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production npx rollup -c ${p("rollup/rollup.config.js")} && node ${p("node/build.mjs")}`);
  });

program
  .command("build:node:webpack")
  .description("Build the app for Node.js with Webpack")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production npx webpack --config ${p("webpack/webpack.config.js")} && cross-env DINOU_BUILD_TOOL=webpack node ${p("node/build.mjs")}`);
  });

program
  .command("start")
  .description("Start the app in production mode (Node.js)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("adapters/node.mjs")}`);
  });

program
  .command("start:node")
  .description("Start the app in production mode (Node.js)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("adapters/node.mjs")}`);
  });

program
  .command("start:node:esbuild")
  .description("Start the app in production mode (Esbuild build)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("adapters/node.mjs")}`);
  });

program
  .command("start:node:rollup")
  .description("Start the app in production mode (Rollup build)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("adapters/node.mjs")}`);
  });

program
  .command("start:node:webpack")
  .description("Start the app in production mode (Webpack build)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production DINOU_BUILD_TOOL=webpack node ${p("adapters/node.mjs")}`);
  });

program
  .command("start:esbuild")
  .description("Start the app in production mode (alias to start:node:esbuild)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("adapters/node.mjs")}`);
  });

program
  .command("start:rollup")
  .description("Start the app in production mode (alias to start:node:rollup)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("adapters/node.mjs")}`);
  });

program
  .command("start:webpack")
  .description("Start the app in production mode (alias to start:node:webpack)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production DINOU_BUILD_TOOL=webpack node ${p("adapters/node.mjs")}`);
  });

// --- CLOUDFLARE WORKERS ---

program
  .command("build:cloudflare")
  .description("Build the app for Cloudflare Workers (using esbuild)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("esbuild/build.mjs")} && node ${p("cloudflare/build.mjs")}`);
  });

program
  .command("build:cloudflare:esbuild")
  .description("Build the app for Cloudflare Workers with Esbuild")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("esbuild/build.mjs")} && node ${p("cloudflare/build.mjs")}`);
  });

program
  .command("build:cloudflare:rollup")
  .description("Build the app for Cloudflare Workers with Rollup")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production npx rollup -c ${p("rollup/rollup.config.js")} && node ${p("cloudflare/build.mjs")}`);
  });

program
  .command("build:cloudflare:webpack")
  .description("Build the app for Cloudflare Workers with Webpack")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production npx webpack --config ${p("webpack/webpack.config.js")} && cross-env DINOU_BUILD_TOOL=webpack node ${p("cloudflare/build.mjs")}`);
  });

// --- DENO DEPLOY / EDGE ---

const runDenoBuild = (bundler) => {
  const bundlerCmd = bundler === "rollup"
    ? `cross-env NODE_ENV=production npx rollup -c ${p("rollup/rollup.config.js")}`
    : bundler === "webpack"
    ? `cross-env NODE_ENV=production npx webpack --config ${p("webpack/webpack.config.js")}`
    : `cross-env NODE_ENV=production node ${p("esbuild/build.mjs")}`;

  const envPrefix = bundler === "webpack" ? "cross-env DINOU_BUILD_TOOL=webpack " : "";
  return `${bundlerCmd} && ${envPrefix}node ${p("deno/build.mjs")} && deno run --unstable-kv --allow-net --allow-read --allow-write --allow-env ${p("deno/seed-kv.js")}`;
};

program
  .command("build:deno")
  .description("Build the app for Deno Deploy / Edge (using esbuild)")
  .action(() => { runCommand(runDenoBuild("esbuild")); });

program
  .command("build:deno:esbuild")
  .description("Build the app for Deno Deploy with Esbuild")
  .action(() => { runCommand(runDenoBuild("esbuild")); });

program
  .command("build:deno:rollup")
  .description("Build the app for Deno Deploy with Rollup")
  .action(() => { runCommand(runDenoBuild("rollup")); });

program
  .command("build:deno:webpack")
  .description("Build the app for Deno Deploy with Webpack")
  .action(() => { runCommand(runDenoBuild("webpack")); });

program
  .command("start:deno")
  .description("Start the app in production mode with Deno")
  .action(() => {
    runCommand(`deno run --unstable-kv --allow-net --allow-read --allow-write --allow-env --allow-sys ${p("adapters/deno.js")}`);
  });

// Deno compile commands
const denoTargets = [
  { name: "", flags: "", outfile: "dist/deno-server" },
  { name: ":linux", flags: "--target x86_64-unknown-linux-gnu ", outfile: "dist/deno-server-linux" },
  { name: ":linux_arm", flags: "--target aarch64-unknown-linux-gnu ", outfile: "dist/deno-server-linux-arm" },
  { name: ":mac", flags: "--target aarch64-apple-darwin ", outfile: "dist/deno-server-mac" },
  { name: ":win", flags: "--target x86_64-pc-windows-msvc ", outfile: "dist/deno-server-win" },
];

for (const t of denoTargets) {
  for (const b of ["esbuild", "rollup", "webpack"]) {
    const cmdName = `build:deno:compile${t.name}${b === "esbuild" && !t.name ? "" : ":" + b}`;
    program
      .command(cmdName)
      .description(`Compile standalone Deno executable (${t.name || "host"}, ${b})`)
      .action(() => {
        runCommand(`${runDenoBuild(b)} && deno compile ${t.flags}--no-check --no-config --allow-net --allow-read --allow-write --allow-env --allow-sys --output ${t.outfile} .dinou/deno/main.js`);
      });
  }
}

// --- BUN (STANDARD) ---

const runBunBuild = (bundler) => {
  const bundlerCmd = bundler === "rollup"
    ? `cross-env NODE_ENV=production npx rollup -c ${p("rollup/rollup.config.js")}`
    : bundler === "webpack"
    ? `cross-env NODE_ENV=production npx webpack --config ${p("webpack/webpack.config.js")}`
    : `cross-env NODE_ENV=production node ${p("esbuild/build.mjs")}`;

  const envPrefix = bundler === "webpack" ? "cross-env DINOU_BUILD_TOOL=webpack " : "";
  return `${bundlerCmd} && ${envPrefix}node ${p("bun/build.mjs")}`;
};

program
  .command("build:bun")
  .description("Build the app for Bun (using esbuild)")
  .action(() => { runCommand(runBunBuild("esbuild")); });

program
  .command("build:bun:esbuild")
  .description("Build the app for Bun with Esbuild")
  .action(() => { runCommand(runBunBuild("esbuild")); });

program
  .command("build:bun:rollup")
  .description("Build the app for Bun with Rollup")
  .action(() => { runCommand(runBunBuild("rollup")); });

program
  .command("build:bun:webpack")
  .description("Build the app for Bun with Webpack")
  .action(() => { runCommand(runBunBuild("webpack")); });

program
  .command("start:bun")
  .description("Start the app in production mode with Bun")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production bun ${p("adapters/bun.js")}`);
  });

program
  .command("start:bun:esbuild")
  .description("Start the app in production mode with Bun (Esbuild)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production bun ${p("adapters/bun.js")}`);
  });

program
  .command("start:bun:rollup")
  .description("Start the app in production mode with Bun (Rollup)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production bun ${p("adapters/bun.js")}`);
  });

program
  .command("start:bun:webpack")
  .description("Start the app in production mode with Bun (Webpack)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production DINOU_BUILD_TOOL=webpack bun ${p("adapters/bun.js")}`);
  });

const bunTargets = [
  { name: "", flags: "", outfile: "dist/server" },
  { name: ":linux", flags: "--target=bun-linux-x64 ", outfile: "dist/server-linux" },
  { name: ":linux_arm", flags: "--target=bun-linux-arm64 ", outfile: "dist/server-linux-arm" },
  { name: ":mac", flags: "--target=bun-darwin-arm64 ", outfile: "dist/server-mac" },
  { name: ":win", flags: "--target=bun-windows-x64 ", outfile: "dist/server-win" },
];

for (const t of bunTargets) {
  for (const b of ["esbuild", "rollup", "webpack"]) {
    const cmdName = `build:bun:compile${t.name}${b === "esbuild" && !t.name ? "" : ":" + b}`;
    program
      .command(cmdName)
      .description(`Compile standalone Bun executable (${t.name || "host"}, ${b})`)
      .action(() => {
        runCommand(`${runBunBuild(b)} && bun build --compile ${t.flags}.dinou/bun/server.js --outfile ${t.outfile}`);
      });
  }
}

// --- BUN (PURE) ---

const runBunPureBuild = (bundler) => {
  if (bundler === "rollup") {
    return `cross-env NODE_ENV=production npx rollup -c ${p("rollup/rollup.config.js")} && bun ${p("bun/build.mjs")}`;
  }
  if (bundler === "webpack") {
    return `cross-env NODE_ENV=production npx webpack --config ${p("webpack/webpack.config.js")} && cross-env DINOU_BUILD_TOOL=webpack bun ${p("bun/build.mjs")}`;
  }
  return `cross-env NODE_ENV=production bun ${p("esbuild/build.mjs")} && bun ${p("bun/build.mjs")}`;
};

program
  .command("build:bun:pure")
  .description("Build the app with 100% Bun (using esbuild)")
  .action(() => { runCommand(runBunPureBuild("esbuild")); });

program
  .command("build:bun:pure:esbuild")
  .description("Build the app with 100% Bun (Esbuild)")
  .action(() => { runCommand(runBunPureBuild("esbuild")); });

program
  .command("build:bun:pure:rollup")
  .description("Build the app with 100% Bun (Rollup)")
  .action(() => { runCommand(runBunPureBuild("rollup")); });

program
  .command("build:bun:pure:webpack")
  .description("Build the app with 100% Bun (Webpack)")
  .action(() => { runCommand(runBunPureBuild("webpack")); });

for (const t of bunTargets) {
  for (const b of ["esbuild", "rollup", "webpack"]) {
    const cmdName = `build:bun:pure:compile${t.name}${b === "esbuild" && !t.name ? "" : ":" + b}`;
    program
      .command(cmdName)
      .description(`Compile standalone Bun Pure executable (${t.name || "host"}, ${b})`)
      .action(() => {
        runCommand(`${runBunPureBuild(b)} && bun build --compile ${t.flags}.dinou/bun/server.js --outfile ${t.outfile}`);
      });
  }
}

// --- EXPORT STATIC ---

program
  .command("export-static")
  .description("Export standalone static website (using esbuild)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("esbuild/build.mjs")} && node ${p("core/export-static.mjs")}`);
  });

program
  .command("export-static:esbuild")
  .description("Export standalone static website with Esbuild")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("esbuild/build.mjs")} && node ${p("core/export-static.mjs")}`);
  });

program
  .command("export-static:rollup")
  .description("Export standalone static website with Rollup")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production npx rollup -c ${p("rollup/rollup.config.js")} && node ${p("core/export-static.mjs")}`);
  });

program
  .command("export-static:webpack")
  .description("Export standalone static website with Webpack")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production npx webpack --config ${p("webpack/webpack.config.js")} && node ${p("core/export-static.mjs")}`);
  });

// --- EJECT ---

program
  .command("eject")
  .description("Copy the framework to the root of the project")
  .action(() => {
    console.log("Executing eject...");
    require("./eject");
  });

program.parse(process.argv);
