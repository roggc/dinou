#!/usr/bin/env node

import fs from "node:fs";
import { program } from "commander";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dinouPath = fs.existsSync(path.resolve(__dirname, "dinou")) ? path.resolve(__dirname, "dinou") : __dirname;
const projectRoot = process.cwd();

// Global CLI options for Dinou v9 (Dual-Mode Vendoring)
program
  .name("dinou")
  .description("Full-stack React 19 framework with native RSC, progressive streaming, and dual-mode vendoring")
  .version("9.0.0")
  .option("-u, --unvendorized", "Run with standard node_modules dependencies instead of pre-bundled vendor packages");

const isUnvendorizedRequested = () =>
  process.argv.includes("-u") ||
  process.argv.includes("--unvendorized") ||
  process.env.DINOU_UNVENDORIZED === "true" ||
  process.env.DINOU_UNVENDORIZED === "1" ||
  Boolean(program.opts?.().unvendorized);

const pathKey = Object.keys(process.env).find((k) => k.toLowerCase() === "path") || "PATH";
const projectBin = path.join(projectRoot, "node_modules", ".bin");
const dinouBin = path.join(dinouPath, "node_modules", ".bin");
const extendedPath = [projectBin, dinouBin, process.env[pathKey]].filter(Boolean).join(path.delimiter);

const runCommand = (command, options = {}) => {
  try {
    const unvendorized = isUnvendorizedRequested();
    const env = {
      ...process.env,
      [pathKey]: extendedPath,
      Path: extendedPath,
      PATH: extendedPath,
      ...(unvendorized ? { DINOU_UNVENDORIZED: "true" } : {}),
      ...(options.env || {}),
    };

    let finalCommand = command;
    if (unvendorized) {
      finalCommand = finalCommand.replace(/(node\s+[^\s&|]+(?:\.js|\.mjs)?)(?!\s+-u)/g, "$1 -u");
    }

    execSync(finalCommand, { stdio: "inherit", cwd: projectRoot, ...options, env });
  } catch (error) {
    console.error(`Error executing "${command}":`, error.message);
    process.exit(1);
  }
};

// Helper paths
const p = (rel) => `"${path.join(dinouPath, rel).replaceAll("\\", "/")}"`;

// --- DEV ---

program
  .command("dev")
  .description("Start development server with Esbuild")
  .action(() => {
    runCommand(`cross-env DINOU_BUILD_TOOL=esbuild node ${p("node/dev.js")}`);
  });

program
  .command("dev:esbuild")
  .description("Start development server with Esbuild")
  .action(() => {
    runCommand(`cross-env DINOU_BUILD_TOOL=esbuild node ${p("node/dev.js")}`);
  });

program
  .command("dev:rollup")
  .description("Start development server with Rollup")
  .action(() => {
    runCommand(`cross-env DINOU_BUILD_TOOL=rollup node ${p("node/dev.js")}`);
  });

program
  .command("dev:webpack")
  .description("Start development server with Webpack")
  .action(() => {
    runCommand(`cross-env DINOU_BUILD_TOOL=webpack node ${p("node/dev.js")}`);
  });

// --- NODE (BUILD & START) ---

program
  .command("build")
  .description("Build the app for Node.js production (using esbuild)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("esbuild/build.js")} && node ${p("node/build.js")}`);
  });

program
  .command("build:node")
  .description("Build the app for Node.js production (using esbuild)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("esbuild/build.js")} && node ${p("node/build.js")}`);
  });

program
  .command("build:node:esbuild")
  .description("Build the app for Node.js with Esbuild")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("esbuild/build.js")} && node ${p("node/build.js")}`);
  });

program
  .command("build:node:rollup")
  .description("Build the app for Node.js with Rollup")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production npx rollup -c ${p("rollup/rollup.config.js")} && node ${p("node/build.js")}`);
  });

program
  .command("build:node:webpack")
  .description("Build the app for Node.js with Webpack")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production npx webpack --config ${p("webpack/webpack.config.js")} && cross-env DINOU_BUILD_TOOL=webpack node ${p("node/build.js")}`);
  });

program
  .command("start")
  .description("Start the app in production mode (Node.js)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("adapters/node.js")}`);
  });

program
  .command("start:node")
  .description("Start the app in production mode (Node.js)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("adapters/node.js")}`);
  });

program
  .command("start:node:esbuild")
  .description("Start the app in production mode (Esbuild build)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("adapters/node.js")}`);
  });

program
  .command("start:node:rollup")
  .description("Start the app in production mode (Rollup build)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("adapters/node.js")}`);
  });

program
  .command("start:node:webpack")
  .description("Start the app in production mode (Webpack build)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production DINOU_BUILD_TOOL=webpack node ${p("adapters/node.js")}`);
  });

// --- NODE (COMPILE VIA BUN) ---

const nodeTargets = [
  { name: "", flags: "", outfile: "dist/server" },
  { name: ":linux", flags: "--target=bun-linux-x64 ", outfile: "dist/server-linux" },
  { name: ":linux_arm", flags: "--target=bun-linux-arm64 ", outfile: "dist/server-linux-arm" },
  { name: ":mac", flags: "--target=bun-darwin-arm64 ", outfile: "dist/server-mac" },
  { name: ":win", flags: "--target=bun-windows-x64 ", outfile: "dist/server-win" },
];

const runNodeBuild = (bundler) => {
  const bundlerCmd = bundler === "rollup"
    ? `cross-env NODE_ENV=production npx rollup -c ${p("rollup/rollup.config.js")}`
    : bundler === "webpack"
      ? `cross-env NODE_ENV=production npx webpack --config ${p("webpack/webpack.config.js")}`
      : `cross-env NODE_ENV=production node ${p("esbuild/build.js")}`;

  const envPrefix = bundler === "webpack" ? "cross-env DINOU_BUILD_TOOL=webpack " : "";
  return `${bundlerCmd} && ${envPrefix}node ${p("node/build.js")}`;
};

for (const t of nodeTargets) {
  for (const b of ["esbuild", "rollup", "webpack"]) {
    const cmdNames = b === "esbuild"
      ? [`build:node:compile${t.name}`, `build:node:compile${t.name}:esbuild`]
      : [`build:node:compile${t.name}:${b}`];
    for (const cmdName of cmdNames) {
      program
        .command(cmdName)
        .description(`Compile standalone Node.js server executable with Bun (${t.name || "host"}, ${b})`)
        .action(() => {
          runCommand(`${runNodeBuild(b)} && bun build --compile ${t.flags}.dinou/node/server.mjs --outfile ${t.outfile}`);
        });
    }
  }
}

// --- NODE (PURE BUN RUNNER COMPILE) ---

const runNodePureBuild = (bundler) => {
  if (bundler === "rollup") {
    return `cross-env NODE_ENV=production npx rollup -c ${p("rollup/rollup.config.js")} && bun ${p("node/build.js")}`;
  }
  if (bundler === "webpack") {
    return `cross-env NODE_ENV=production npx webpack --config ${p("webpack/webpack.config.js")} && cross-env DINOU_BUILD_TOOL=webpack bun ${p("node/build.js")}`;
  }
  return `cross-env NODE_ENV=production bun ${p("esbuild/build.js")} && bun ${p("node/build.js")}`;
};

program
  .command("build:node:pure")
  .description("Build the app for Node.js with 100% Bun (using esbuild)")
  .action(() => { runCommand(runNodePureBuild("esbuild")); });

program
  .command("build:node:pure:esbuild")
  .description("Build the app for Node.js with 100% Bun (Esbuild)")
  .action(() => { runCommand(runNodePureBuild("esbuild")); });

program
  .command("build:node:pure:rollup")
  .description("Build the app for Node.js with 100% Bun (Rollup)")
  .action(() => { runCommand(runNodePureBuild("rollup")); });

program
  .command("build:node:pure:webpack")
  .description("Build the app for Node.js with 100% Bun (Webpack)")
  .action(() => { runCommand(runNodePureBuild("webpack")); });

for (const t of nodeTargets) {
  for (const b of ["esbuild", "rollup", "webpack"]) {
    const cmdNames = b === "esbuild"
      ? [`build:node:pure:compile${t.name}`, `build:node:pure:compile${t.name}:esbuild`]
      : [`build:node:pure:compile${t.name}:${b}`];
    for (const cmdName of cmdNames) {
      program
        .command(cmdName)
        .description(`Compile standalone Node.js server executable with 100% Bun (${t.name || "host"}, ${b})`)
        .action(() => {
          runCommand(`${runNodePureBuild(b)} && bun build --compile ${t.flags}.dinou/node/server.mjs --outfile ${t.outfile}`);
        });
    }
  }
}

// --- CLOUDFLARE WORKERS ---

program
  .command("build:cloudflare")
  .description("Build the app for Cloudflare Workers (using esbuild)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("esbuild/build.js")} && node ${p("cloudflare/build.js")}`);
  });

program
  .command("build:cloudflare:esbuild")
  .description("Build the app for Cloudflare Workers with Esbuild")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("esbuild/build.js")} && node ${p("cloudflare/build.js")}`);
  });

program
  .command("build:cloudflare:rollup")
  .description("Build the app for Cloudflare Workers with Rollup")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production npx rollup -c ${p("rollup/rollup.config.js")} && node ${p("cloudflare/build.js")}`);
  });

program
  .command("build:cloudflare:webpack")
  .description("Build the app for Cloudflare Workers with Webpack")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production npx webpack --config ${p("webpack/webpack.config.js")} && cross-env DINOU_BUILD_TOOL=webpack node ${p("cloudflare/build.js")}`);
  });

// --- DENO DEPLOY / EDGE ---

const runDenoBuild = (bundler) => {
  const bundlerCmd = bundler === "rollup"
    ? `cross-env NODE_ENV=production npx rollup -c ${p("rollup/rollup.config.js")}`
    : bundler === "webpack"
      ? `cross-env NODE_ENV=production npx webpack --config ${p("webpack/webpack.config.js")}`
      : `cross-env NODE_ENV=production node ${p("esbuild/build.js")}`;

  const envPrefix = bundler === "webpack" ? "cross-env DINOU_BUILD_TOOL=webpack " : "";
  return `${bundlerCmd} && ${envPrefix}node ${p("deno/build.js")} && deno run --unstable-kv --allow-net --allow-read --allow-write --allow-env ${p("deno/seed-kv.js")}`;
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
    const cmdNames = b === "esbuild"
      ? [`build:deno:compile${t.name}`, `build:deno:compile${t.name}:esbuild`]
      : [`build:deno:compile${t.name}:${b}`];
    for (const cmdName of cmdNames) {
      program
        .command(cmdName)
        .description(`Compile standalone Deno executable (${t.name || "host"}, ${b})`)
        .action(() => {
          runCommand(`${runDenoBuild(b)} && deno compile ${t.flags}--no-check --no-config --allow-net --allow-read --allow-write --allow-env --allow-sys --output ${t.outfile} .dinou/deno/main.js`);
        });
    }
  }
}

// --- BUN (STANDARD) ---

const runBunBuild = (bundler) => {
  const bundlerCmd = bundler === "rollup"
    ? `cross-env NODE_ENV=production npx rollup -c ${p("rollup/rollup.config.js")}`
    : bundler === "webpack"
      ? `cross-env NODE_ENV=production npx webpack --config ${p("webpack/webpack.config.js")}`
      : `cross-env NODE_ENV=production node ${p("esbuild/build.js")}`;

  const envPrefix = bundler === "webpack" ? "cross-env DINOU_BUILD_TOOL=webpack " : "";
  return `${bundlerCmd} && ${envPrefix}node ${p("bun/build.js")}`;
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
    const cmdNames = b === "esbuild"
      ? [`build:bun:compile${t.name}`, `build:bun:compile${t.name}:esbuild`]
      : [`build:bun:compile${t.name}:${b}`];
    for (const cmdName of cmdNames) {
      program
        .command(cmdName)
        .description(`Compile standalone Bun executable (${t.name || "host"}, ${b})`)
        .action(() => {
          runCommand(`${runBunBuild(b)} && bun build --compile ${t.flags}.dinou/bun/server.js --outfile ${t.outfile}`);
        });
    }
  }
}

// --- BUN (PURE) ---

const runBunPureBuild = (bundler) => {
  if (bundler === "rollup") {
    return `cross-env NODE_ENV=production npx rollup -c ${p("rollup/rollup.config.js")} && bun ${p("bun/build.js")}`;
  }
  if (bundler === "webpack") {
    return `cross-env NODE_ENV=production npx webpack --config ${p("webpack/webpack.config.js")} && cross-env DINOU_BUILD_TOOL=webpack bun ${p("bun/build.js")}`;
  }
  return `cross-env NODE_ENV=production bun ${p("esbuild/build.js")} && bun ${p("bun/build.js")}`;
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
    const cmdNames = b === "esbuild"
      ? [`build:bun:pure:compile${t.name}`, `build:bun:pure:compile${t.name}:esbuild`]
      : [`build:bun:pure:compile${t.name}:${b}`];
    for (const cmdName of cmdNames) {
      program
        .command(cmdName)
        .description(`Compile standalone Bun Pure executable (${t.name || "host"}, ${b})`)
        .action(() => {
          runCommand(`${runBunPureBuild(b)} && bun build --compile ${t.flags}.dinou/bun/server.js --outfile ${t.outfile}`);
        });
    }
  }
}

// --- EXPORT STATIC ---

program
  .command("export-static")
  .description("Export standalone static website (using esbuild)")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("esbuild/build.js")} && node ${p("core/export-static.js")}`);
  });

program
  .command("export-static:esbuild")
  .description("Export standalone static website with Esbuild")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production node ${p("esbuild/build.js")} && node ${p("core/export-static.js")}`);
  });

program
  .command("export-static:rollup")
  .description("Export standalone static website with Rollup")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production npx rollup -c ${p("rollup/rollup.config.js")} && node ${p("core/export-static.js")}`);
  });

program
  .command("export-static:webpack")
  .description("Export standalone static website with Webpack")
  .action(() => {
    runCommand(`cross-env NODE_ENV=production npx webpack --config ${p("webpack/webpack.config.js")} && node ${p("core/export-static.js")}`);
  });


// --- VENDORS ---

program
  .command("build:vendors")
  .description("Bundle dependencies into dinou/compiled vendors")
  .action(() => {
    runCommand(`node ${p("scripts/build-vendors.js")}`);
  });

// --- EJECT ---

program
  .command("eject")
  .description("Copy the framework to the root of the project")
  .action(async () => {
    console.log("Executing eject...");
    const { eject } = await import("./eject.js");
    eject();
  });

program.parse(process.argv);
