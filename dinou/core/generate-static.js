const path = require("path");
const { existsSync, rmSync, writeFileSync, mkdirSync } = require("fs");
const generateStaticRSCs = require("./generate-static-rscs");
const generateStaticPages = require("./generate-static-pages");
const { buildStaticPages, getStaticPaths } = require("./build-static-pages");
const { generateRouteModulesCode } = require("./route-generator.js");

async function generateStatic() {
  const distFolder2 = path.resolve(process.cwd(), ".dinou/dist2");

  if (existsSync(distFolder2)) {
    rmSync(distFolder2, { recursive: true, force: true });
    console.log("Deleted existing .dinou/dist2 folder");
  }

  // ⚡ Generate route modules for in-memory route loading in production
  try {
    const routeModulesCode = generateRouteModulesCode(process.cwd(), "..");
    const dinouDir = path.resolve(process.cwd(), ".dinou");
    if (!existsSync(dinouDir)) {
      mkdirSync(dinouDir, { recursive: true });
    }
    const routeModulesPath = path.join(dinouDir, "route-modules.js");
    writeFileSync(routeModulesPath, routeModulesCode, "utf8");
    console.log("⚡ [Dinou Build] Generated in-memory route modules at .dinou/route-modules.js");
  } catch (err) {
    console.warn("⚠️ [Dinou Build] Could not generate route modules:", err.message);
  }

  await buildStaticPages();
  const routes = getStaticPaths();
  console.log("Static paths:", routes);
  await generateStaticRSCs(routes);
  await generateStaticPages(routes);
}

module.exports = generateStatic;
