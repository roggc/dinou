// file: register-loader.js
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register(
  pathToFileURL("./dinou/babel-esm-loader.js").href,
  pathToFileURL("./")
);
