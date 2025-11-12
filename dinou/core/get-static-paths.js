const { readdirSync } = require("fs");
const path = require("path");

const DIST_DIR = path.resolve("dist");

async function getStaticPaths() {
  const paths = [];

  function walk(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name === "index.json") {
        const relativeDir = path.relative(DIST_DIR, path.dirname(fullPath));
        const route =
          "/" +
          (relativeDir === "" ? "" : relativeDir + "/").replace(/\\/g, "/");
        paths.push(route);
      }
    }
  }

  walk(DIST_DIR);

  return paths;
}

module.exports = getStaticPaths;
