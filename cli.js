#!/usr/bin/env node

const { program } = require("commander");
const { execSync } = require("child_process");
const path = require("path");
const { pathToFileURL } = require("url");

const dinouPath = path.resolve(__dirname, "dinou");
const corePath = path.resolve(dinouPath, "core");
const projectRoot = process.cwd();

const runCommand = (command, options = {}) => {
  try {
    execSync(command, { stdio: "inherit", cwd: projectRoot, ...options });
  } catch (error) {
    console.error(`Error executing "${command}":`, error.message);
    process.exit(1);
  }
};

// --- DEV ---

program
  .command("dev")
  .description("Start development server with Esbuild")
  .action(() => {
    console.log("Starting development server with Esbuild...");
    const startExpress = `node --conditions react-server --import ${pathToFileURL(path.join(corePath, "register-loader.mjs")).href
      } ${path.join(corePath, "server.js")}`;
    const startDevServer = `node ${path.join(dinouPath, "esbuild/dev.mjs")}`;
    runCommand(`npx concurrently "${startExpress}" "${startDevServer}"`);
  });

program
  .command("dev:esbuild")
  .description("Start development server with Esbuild")
  .action(() => {
    console.log("Starting development server with Esbuild...");
    const startExpress = `node --conditions react-server --import ${pathToFileURL(path.join(corePath, "register-loader.mjs")).href
      } ${path.join(corePath, "server.js")}`;
    const startDevServer = `node ${path.join(dinouPath, "esbuild/dev.mjs")}`;
    runCommand(`npx concurrently "${startExpress}" "${startDevServer}"`);
  });

program
  .command("dev:rollup")
  .description("Start development server with Rollup")
  .action(() => {
    console.log("Starting development server with Rollup...");
    const startExpress = `node --conditions react-server --import ${pathToFileURL(path.join(corePath, "register-loader.mjs")).href
      } ${path.join(corePath, "server.js")}`;
    const startDevServer = `rollup -c ${path.join(
      dinouPath,
      "rollup/rollup.config.js"
    )} -w`;
    runCommand(`npx concurrently "${startExpress}" "${startDevServer}"`);
  });

program
  .command("dev:webpack")
  .description("Start development server with Webpack")
  .action(() => {
    console.log("Starting development server with Webpack...");
    const startExpress = `cross-env DINOU_BUILD_TOOL=webpack node --conditions react-server --import ${pathToFileURL(path.join(corePath, "register-loader.mjs")).href
      } ${path.join(corePath, "server.js")}`;
    const startDevServer = `webpack serve --config ${path.join(
      dinouPath,
      "webpack/webpack.config.js"
    )}`;
    runCommand(`npx concurrently "${startExpress}" "${startDevServer}"`);
  });

// --- BUILD ---

program
  .command("build")
  .description("Build the app for production (using esbuild)")
  .action(() => {
    console.log("Building the app...");
    const esbuildPath = path.join(dinouPath, "esbuild/build.mjs");
    runCommand(`cross-env NODE_ENV=production node ${esbuildPath}`);
  });

program
  .command("build:esbuild")
  .description("Build the app for production with Esbuild")
  .action(() => {
    console.log("Building the app with Esbuild...");
    const esbuildPath = path.join(dinouPath, "esbuild/build.mjs");
    runCommand(`cross-env NODE_ENV=production node ${esbuildPath}`);
  });

program
  .command("build:rollup")
  .description("Build the app for production with Rollup")
  .action(() => {
    console.log("Building the app with Rollup...");
    const configPath = path.join(dinouPath, "rollup/rollup.config.js");
    runCommand(`cross-env NODE_ENV=production npx rollup -c ${configPath}`);
  });

program
  .command("build:webpack")
  .description("Build the app for production with Webpack")
  .action(() => {
    console.log("Building the app with Webpack...");
    const configPath = path.join(dinouPath, "webpack/webpack.config.js");
    runCommand(
      `cross-env NODE_ENV=production npx webpack --config ${configPath}`
    );
  });

// --- START (NODE) ---

program
  .command("start")
  .description("Start the app in production mode (Node.js)")
  .action(() => {
    console.log("Starting the app in production mode...");
    runCommand(
      `cross-env NODE_ENV=production node ${path.join(corePath, "server.js")}`
    );
  });

program
  .command("start:esbuild")
  .description("Start the app in production mode (Esbuild build)")
  .action(() => {
    console.log("Starting the app in production mode...");
    runCommand(
      `cross-env NODE_ENV=production node ${path.join(corePath, "server.js")}`
    );
  });

program
  .command("start:rollup")
  .description("Start the app in production mode (Rollup build)")
  .action(() => {
    console.log("Starting the app in production mode...");
    runCommand(
      `cross-env NODE_ENV=production node ${path.join(corePath, "server.js")}`
    );
  });

program
  .command("start:webpack")
  .description("Start the app in production mode (Webpack build)")
  .action(() => {
    console.log("Starting the app in production mode with Webpack...");
    runCommand(
      `cross-env NODE_ENV=production DINOU_BUILD_TOOL=webpack node ${path.join(corePath, "server.js")}`
    );
  });

// --- START (BUN & DENO) ---

program
  .command("start:bun")
  .description("Start the app in production mode with Bun")
  .action(() => {
    console.log("Starting the app with Bun...");
    runCommand(`bun ${path.join(dinouPath, "adapters/bun.js")}`);
  });

program
  .command("start:deno")
  .description("Start the app in production mode with Deno")
  .action(() => {
    console.log("Starting the app with Deno...");
    runCommand(
      `deno run --allow-net --allow-read --allow-env ${path.join(dinouPath, "adapters/deno.js")}`
    );
  });

// --- BUILD (CLOUDFLARE WORKERS) ---

program
  .command("build:cloudflare")
  .description("Build the app for Cloudflare Workers (using esbuild)")
  .action(() => {
    console.log("Building the app for Cloudflare Workers...");
    const esbuildPath = path.join(dinouPath, "esbuild/build.mjs");
    runCommand(`cross-env NODE_ENV=production node ${esbuildPath}`);
    const cfPath = path.join(dinouPath, "cloudflare/build.mjs");
    runCommand(`node ${cfPath}`);
  });

program
  .command("build:cloudflare:rollup")
  .description("Build the app for Cloudflare Workers with Rollup")
  .action(() => {
    console.log("Building the app for Cloudflare Workers with Rollup...");
    const configPath = path.join(dinouPath, "rollup/rollup.config.js");
    runCommand(`cross-env NODE_ENV=production npx rollup -c ${configPath}`);
    const cfPath = path.join(dinouPath, "cloudflare/build.mjs");
    runCommand(`node ${cfPath}`);
  });

program
  .command("build:cloudflare:esbuild")
  .description("Build the app for Cloudflare Workers with Esbuild")
  .action(() => {
    console.log("Building the app for Cloudflare Workers with Esbuild...");
    const esbuildPath = path.join(dinouPath, "esbuild/build.mjs");
    runCommand(`cross-env NODE_ENV=production node ${esbuildPath}`);
    const cfPath = path.join(dinouPath, "cloudflare/build.mjs");
    runCommand(`node ${cfPath}`);
  });

program
  .command("build:cloudflare:webpack")
  .description("Build the app for Cloudflare Workers with Webpack")
  .action(() => {
    console.log("Building the app for Cloudflare Workers with Webpack...");
    const configPath = path.join(dinouPath, "webpack/webpack.config.js");
    runCommand(`cross-env NODE_ENV=production npx webpack --config ${configPath}`);
    const cfPath = path.join(dinouPath, "cloudflare/build.mjs");
    runCommand(`cross-env DINOU_BUILD_TOOL=webpack node ${cfPath}`);
  });

// --- BUILD (DENO DEPLOY / EDGE) ---

program
  .command("build:deno")
  .description("Build the app for Deno Deploy / Edge (using esbuild)")
  .action(() => {
    console.log("Building the app for Deno Deploy...");
    const esbuildPath = path.join(dinouPath, "esbuild/build.mjs");
    runCommand(`cross-env NODE_ENV=production node ${esbuildPath}`);
    const denoPath = path.join(dinouPath, "deno/build.mjs");
    runCommand(`node ${denoPath}`);
  });

program
  .command("build:deno:rollup")
  .description("Build the app for Deno Deploy / Edge with Rollup")
  .action(() => {
    console.log("Building the app for Deno Deploy with Rollup...");
    const configPath = path.join(dinouPath, "rollup/rollup.config.js");
    runCommand(`cross-env NODE_ENV=production npx rollup -c ${configPath}`);
    const denoPath = path.join(dinouPath, "deno/build.mjs");
    runCommand(`node ${denoPath}`);
  });

program
  .command("build:deno:esbuild")
  .description("Build the app for Deno Deploy / Edge with Esbuild")
  .action(() => {
    console.log("Building the app for Deno Deploy with Esbuild...");
    const esbuildPath = path.join(dinouPath, "esbuild/build.mjs");
    runCommand(`cross-env NODE_ENV=production node ${esbuildPath}`);
    const denoPath = path.join(dinouPath, "deno/build.mjs");
    runCommand(`node ${denoPath}`);
  });

program
  .command("build:deno:webpack")
  .description("Build the app for Deno Deploy / Edge with Webpack")
  .action(() => {
    console.log("Building the app for Deno Deploy with Webpack...");
    const configPath = path.join(dinouPath, "webpack/webpack.config.js");
    runCommand(`cross-env NODE_ENV=production npx webpack --config ${configPath}`);
    const denoPath = path.join(dinouPath, "deno/build.mjs");
    runCommand(`cross-env DINOU_BUILD_TOOL=webpack node ${denoPath}`);
  });

// --- EXPORT STATIC ---

program
  .command("export-static")
  .description("Export standalone static website (using esbuild)")
  .action(() => {
    console.log("Exporting static website...");
    const esbuildPath = path.join(dinouPath, "esbuild/build.mjs");
    runCommand(`cross-env NODE_ENV=production node ${esbuildPath}`);
    const exportPath = path.join(corePath, "export-static.mjs");
    runCommand(`node ${exportPath}`);
  });

program
  .command("export-static:esbuild")
  .description("Export standalone static website with Esbuild")
  .action(() => {
    console.log("Exporting static website with Esbuild...");
    const esbuildPath = path.join(dinouPath, "esbuild/build.mjs");
    runCommand(`cross-env NODE_ENV=production node ${esbuildPath}`);
    const exportPath = path.join(corePath, "export-static.mjs");
    runCommand(`node ${exportPath}`);
  });

program
  .command("export-static:rollup")
  .description("Export standalone static website with Rollup")
  .action(() => {
    console.log("Exporting static website with Rollup...");
    const configPath = path.join(dinouPath, "rollup/rollup.config.js");
    runCommand(`cross-env NODE_ENV=production npx rollup -c ${configPath}`);
    const exportPath = path.join(corePath, "export-static.mjs");
    runCommand(`node ${exportPath}`);
  });

program
  .command("export-static:webpack")
  .description("Export standalone static website with Webpack")
  .action(() => {
    console.log("Exporting static website with Webpack...");
    const configPath = path.join(dinouPath, "webpack/webpack.config.js");
    runCommand(`cross-env NODE_ENV=production npx webpack --config ${configPath}`);
    const exportPath = path.join(corePath, "export-static.mjs");
    runCommand(`node ${exportPath}`);
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
