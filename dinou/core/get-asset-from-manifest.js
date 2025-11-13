const fs = require("fs");
const path = require("path");

let manifest = {};
let read = false;

function getAssetFromManifest(name) {
  if (process.env.NODE_ENV === "production" && !read) {
    const manifestPath = path.resolve(process.cwd(), "dist3/manifest.json");
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      read = true;
    }
  }
  return "/" + (manifest[name] || name);
}

module.exports = getAssetFromManifest;
