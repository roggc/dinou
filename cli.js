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

program
  .command("dev")
  .description("Starts the server")
  .action(() => {
    console.log("Starting the server...");
    runCommand(`node ${path.join(dinouPath, "ssg.js")}`);
    runCommand(
      `node --conditions react-server ${path.join(dinouPath, "server.js")}`
    );
  });

program
  .command("build")
  .description("Builds the app for production")
  .action(() => {
    console.log("Building the app...");
    runCommand(`node ${path.join(dinouPath, "ssg.js")}`);
    const configPath = path.join(__dirname, "webpack.config.js");
    runCommand(
      `cross-env NODE_ENV=production npx webpack --config ${configPath}`
    );
  });

program
  .command("start")
  .description("Start the app in production mode")
  .action(() => {
    console.log("Starting the app...");
    runCommand(
      `cross-env NODE_ENV=production node --conditions react-server ${path.join(
        dinouPath,
        "server.js"
      )}`
    );
  });

program
  .command("eject")
  .description("Copy the framework config to the root of the project")
  .action(() => {
    console.log("Executing eject...");
    require("./eject");
  });

program.parse(process.argv);
