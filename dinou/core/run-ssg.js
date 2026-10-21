// dinou/core/run-ssg.js
// Standalone Static Site Generation (SSG) runner for Dinou.
process.env.NODE_ENV = "production";
process.env.DINOU_RUNTIME = "node-bundle";

import { fileURLToPath } from "node:url";
import generateStatic from "./generate-static.js";

export async function runSSG() {
  await generateStatic();
}

const isMainModule =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  runSSG().catch((err) => {
    console.error("❌ [SSG] Static generation failed:", err);
    process.exit(1);
  });
}

export default { runSSG };
