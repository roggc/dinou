const fs = require("fs");
const path = require("path");

let manifest = {};
let read = false;
const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";

function getAssetFromManifest(name) {
  if (typeof globalThis !== "undefined" && globalThis.__DINOU_ASSET_MANIFEST__) {
    return "/" + (globalThis.__DINOU_ASSET_MANIFEST__[name] || name);
  }
  if (process.env.NODE_ENV === "production" && !read) {
    const manifestPath = path.resolve(process.cwd(), ".dinou/dist3/manifest.json");
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      read = true;
    }
  } else if (isWebpack && !read) {
    const manifestPath = path.resolve(process.cwd(), ".dinou/public/manifest.json");
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      read = true;
    }
  }
  return "/" + (manifest[name] || name);
}

module.exports = getAssetFromManifest;
