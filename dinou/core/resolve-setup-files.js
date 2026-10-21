// dinou/core/resolve-setup-files.js
import fs from "node:fs";
import path from "node:path";

/**
 * Resolves setup files according to Dinou's configuration hierarchy:
 * 1. Plugin setup files (plugin.setupFiles) always execute first.
 * 2. User setup files:
 *    - If config.setupFiles is explicitly provided in dinou.config.mjs, it is the sole source of truth.
 *    - Otherwise, falls back to checking the project root for dinou.setup.mjs, dinou.setup.js, or dinou.setup.ts.
 *
 * @param {string} projectRoot
 * @param {object} config - Dinou config object
 * @returns {string[]} Array of absolute file paths to inject/execute
 */
function resolveSetupFiles(projectRoot, config = {}) {
  const pluginSetupFiles = [];
  if (config.plugins && Array.isArray(config.plugins)) {
    for (const plugin of config.plugins) {
      if (plugin && Array.isArray(plugin.setupFiles)) {
        for (const file of plugin.setupFiles) {
          const resolved = path.isAbsolute(file)
            ? file
            : path.resolve(projectRoot, file);
          if (fs.existsSync(resolved)) {
            pluginSetupFiles.push(resolved);
          } else {
            console.warn(
              `⚠️ [Dinou] Plugin "${plugin.name || "unnamed"}" specified setup file not found: ${file}`,
            );
          }
        }
      }
    }
  }

  let userSetupFiles = [];
  if (Array.isArray(config.setupFiles)) {
    // Explicit configuration takes precedence over convention
    for (const file of config.setupFiles) {
      const resolved = path.isAbsolute(file)
        ? file
        : path.resolve(projectRoot, file);
      if (fs.existsSync(resolved)) {
        userSetupFiles.push(resolved);
      } else {
        console.warn(`⚠️ [Dinou] Configured setupFile not found: ${file}`);
      }
    }
  } else {
    // Convention: check ONLY project root
    const rootCandidates = [
      "dinou.setup.mjs",
      "dinou.setup.js",
      "dinou.setup.ts",
    ];
    for (const name of rootCandidates) {
      const fullPath = path.resolve(projectRoot, name);
      if (fs.existsSync(fullPath)) {
        userSetupFiles.push(fullPath);
        break; // Only pick the highest priority extension match
      }
    }
  }

  return [...new Set([...pluginSetupFiles, ...userSetupFiles])];
}

export { resolveSetupFiles };
export default { resolveSetupFiles };
