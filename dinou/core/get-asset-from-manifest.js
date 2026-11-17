import fs from "node:fs";
import path from "node:path";

let manifest = {};
let read = false;
const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";

export function getAssetFromManifest(name) {
  const isDev =
    process.env.DINOU_DEV === "true" ||
    (typeof globalThis !== "undefined" && Boolean(globalThis.__DINOU_DEV__));
  const devEpoch =
    isDev && typeof globalThis !== "undefined"
      ? Number(globalThis.__DINOU_DEV_BUNDLE_EPOCH__ || 0)
      : 0;
  const withEpoch = (assetUrl) =>
    devEpoch > 0 && assetUrl.endsWith(".js")
      ? `${assetUrl}?v=${devEpoch}`
      : assetUrl;

  if (typeof globalThis !== "undefined" && globalThis.__DINOU_ASSET_MANIFEST__) {
    return withEpoch("/" + (globalThis.__DINOU_ASSET_MANIFEST__[name] || name));
  }
  if (process.env.NODE_ENV === "production" && !isDev && !read) {
    const manifestPath = path.resolve(process.cwd(), ".dinou/dist1/manifest.json");
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      read = true;
    }
  } else if (isWebpack && isDev) {
    if (typeof globalThis !== "undefined" && globalThis.__DINOU_RAW_ASSET_MANIFEST__) {
      return withEpoch("/" + (globalThis.__DINOU_RAW_ASSET_MANIFEST__[name] || name));
    }
    const manifestPath = path.resolve(process.cwd(), ".dinou/node-dev/manifest.json");
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    }
  }
  return withEpoch("/" + (manifest[name] || name));
}

export default getAssetFromManifest;
