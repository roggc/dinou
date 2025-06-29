const path = require("path");
const { existsSync, readFileSync } = require("fs");
const generateStaticPage = require("./generate-static-page");
const { buildStaticPage } = require("./build-static-pages");
const generateStaticRSC = require("./generate-static-rsc");

const regenerating = new Set();

function revalidating(reqPath) {
  const distFolder = path.resolve(process.cwd(), "dist");
  const jsonPath = path.join(distFolder, reqPath, "index.json");
  if (existsSync(jsonPath)) {
    const { revalidate, generatedAt } = JSON.parse(
      readFileSync(jsonPath, "utf8")
    );
    if (
      typeof revalidate === "number" &&
      revalidate > 0 &&
      Date.now() > generatedAt + revalidate &&
      !regenerating.has(reqPath)
    ) {
      buildStaticPage(reqPath)
        .then(() =>
          generateStaticPage(reqPath).then(() => generateStaticRSC(reqPath))
        )
        .catch(console.error)
        .finally(() => regenerating.delete(reqPath));
    }
  }
}

module.exports = revalidating;
