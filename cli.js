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

program
  .command("dev")
  .description("Starts")
  .action(() => {
    console.log("Starting...");
    const startExpress = `node --conditions react-server --import ${
      pathToFileURL(path.join(corePath, "register-loader.mjs")).href
    } ${path.join(corePath, "server.js")}`;
    const startDevServer = `node ${path.join(dinouPath, "esbuild/dev.mjs")}`;
    runCommand(`npx concurrently "${startExpress}" "${startDevServer}"`);
  });

program
  .command("build")
  .description("Builds the app for production")
  .action(() => {
    console.log("Building the app...");
    const esbuildPath = path.join(dinouPath, "esbuild/build.mjs");
    runCommand(`cross-env NODE_ENV=production node ${esbuildPath}`);
  });

program
  .command("start")
  .description("Start the app in production mode")
  .action(() => {
    console.log("Starting the app...");
    runCommand(
      `cross-env NODE_ENV=production node --conditions react-server --import ${
        pathToFileURL(path.join(corePath, "register-loader.mjs")).href
      } ${path.join(corePath, "server.js")}`
    );
  });

program
  .command("dev:esbuild")
  .description("Starts")
  .action(() => {
    console.log("Starting...");
    const startExpress = `node --conditions react-server --import ${
      pathToFileURL(path.join(corePath, "register-loader.mjs")).href
    } ${path.join(corePath, "server.js")}`;
    const startDevServer = `node ${path.join(dinouPath, "esbuild/dev.mjs")}`;
    runCommand(`npx concurrently "${startExpress}" "${startDevServer}"`);
  });

program
  .command("build:esbuild")
  .description("Builds the app for production")
  .action(() => {
    console.log("Building the app...");
    const esbuildPath = path.join(dinouPath, "esbuild/build.mjs");
    runCommand(`cross-env NODE_ENV=production node ${esbuildPath}`);
  });

program
  .command("start:esbuild")
  .description("Start the app in production mode")
  .action(() => {
    console.log("Starting the app...");
    runCommand(
      `cross-env NODE_ENV=production node --conditions react-server --import ${
        pathToFileURL(path.join(corePath, "register-loader.mjs")).href
      } ${path.join(corePath, "server.js")}`
    );
  });

program
  .command("dev:rollup")
  .description("Starts")
  .action(() => {
    console.log("Starting...");
    const startExpress = `node --conditions react-server --import ${
      pathToFileURL(path.join(corePath, "register-loader.mjs")).href
    } ${path.join(corePath, "server.js")}`;
    const startDevServer = `rollup -c ${path.join(
      dinouPath,
      "rollup/rollup.config.js"
    )} -w`;
    runCommand(`npx concurrently "${startExpress}" "${startDevServer}"`);
  });

program
  .command("build:rollup")
  .description("Builds the app for production")
  .action(() => {
    console.log("Building the app...");
    const configPath = path.join(dinouPath, "rollup/rollup.config.js");
    runCommand(`cross-env NODE_ENV=production npx rollup -c ${configPath}`);
  });

program
  .command("start:rollup")
  .description("Start the app in production mode")
  .action(() => {
    console.log("Starting the app...");
    runCommand(
      `cross-env NODE_ENV=production node --conditions react-server --import ${
        pathToFileURL(path.join(corePath, "register-loader.mjs")).href
      } ${path.join(corePath, "server.js")}`
    );
  });

program
  .command("dev:webpack")
  .description("Starts")
  .action(() => {
    console.log("Starting...");
    const startExpress = `cross-env DINOU_BUILD_TOOL=webpack node --conditions react-server --import ${
      pathToFileURL(path.join(corePath, "register-loader.mjs")).href
    } ${path.join(corePath, "server.js")}`;
    const startDevServer = `webpack serve --config ${path.join(
      dinouPath,
      "webpack/webpack.config.js"
    )}`;
    runCommand(`npx concurrently "${startExpress}" "${startDevServer}"`);
  });

program
  .command("build:webpack")
  .description("Builds the app for production")
  .action(() => {
    console.log("Building the app...");
    const configPath = path.join(dinouPath, "webpack/webpack.config.js");
    runCommand(
      `cross-env NODE_ENV=production npx webpack --config ${configPath}`
    );
  });

program
  .command("start:webpack")
  .description("Start the app in production mode")
  .action(() => {
    console.log("Starting the app...");
    runCommand(
      `cross-env NODE_ENV=production DINOU_BUILD_TOOL=webpack node --conditions react-server --import ${
        pathToFileURL(path.join(corePath, "register-loader.mjs")).href
      } ${path.join(corePath, "server.js")}`
    );
  });

program
  .command("eject")
  .description("Copy the framework to the root of the project")
  .action(() => {
    console.log("Executing eject...");
    require("./eject");
  });

program.parse(process.argv);
