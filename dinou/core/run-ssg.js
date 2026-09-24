// dinou/core/run-ssg.js
// Standalone Static Site Generation (SSG) runner for Dinou.
process.env.NODE_ENV = "production";
process.env.DINOU_RUNTIME = "node-bundle";

const generateStatic = require("./generate-static.js");

async function runSSG() {
  console.log("🏗️  [SSG] Pre-rendering static pages and RSC payloads with Dual-Engine...");
  await generateStatic();
  console.log("✅ [SSG] Static generation finished successfully.");
}

if (require.main === module) {
  runSSG().catch((err) => {
    console.error("❌ [SSG] Static generation failed:", err);
    process.exit(1);
  });
}

module.exports = { runSSG };
