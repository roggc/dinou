const path = require("path");
const { existsSync, rmSync } = require("fs");
const generateStaticRSCs = require("./generate-static-rscs");
const generateStaticPages = require("./generate-static-pages");
const getStaticPaths = require("./get-static-paths");
const { buildStaticPages } = require("./build-static-pages");

async function generateStatic() {
  const distFolder2 = path.resolve(process.cwd(), "dist2");

  if (existsSync(distFolder2)) {
    rmSync(distFolder2, { recursive: true, force: true });
    console.log("Deleted existing dist2 folder");
  }

  await buildStaticPages();
  const routes = await getStaticPaths();
  console.log("Static paths:", routes);
  await generateStaticPages(routes);
  await generateStaticRSCs(routes);
}

module.exports = generateStatic;
