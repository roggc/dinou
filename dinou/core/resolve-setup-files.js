// dinou/core/resolve-setup-files.js
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import {
  resolveCandidateFile,
  resolveTsconfigAlias,
} from "./tsconfig-aliases.js";

export const ROOT_SETUP_CANDIDATES = [
  "dinou.setup.mjs",
  "dinou.setup.js",
  "dinou.setup.ts",
];

/**
 * Resolves a single setup file specifier (absolute path, relative path,
 * extensionless path, tsconfig/jsconfig path alias, or npm package subpath)
 * to an existing absolute file path on disk.
 *
 * @param {string} specifier
 * @param {string} projectRoot
 * @returns {string | null}
 */
export function resolveSingleSetupFile(specifier, projectRoot) {
  if (typeof specifier !== "string") return null;
  const trimmed = specifier.trim();
  if (!trimmed) return null;

  const root = path.resolve(projectRoot || process.cwd());

  if (path.isAbsolute(trimmed)) {
    const absCandidate = resolveCandidateFile(trimmed);
    if (absCandidate) return absCandidate;
    return fs.existsSync(trimmed) ? trimmed : null;
  }

  if (trimmed.startsWith("./") || trimmed.startsWith("../")) {
    const relCandidate = resolveCandidateFile(path.resolve(root, trimmed));
    if (relCandidate) return relCandidate;
  }

  const viaAlias = resolveTsconfigAlias(trimmed, { projectRoot: root });
  if (viaAlias) {
    return viaAlias;
  }

  const fromRootCandidate = resolveCandidateFile(path.resolve(root, trimmed));
  if (fromRootCandidate) {
    return fromRootCandidate;
  }

  try {
    const req = createRequire(path.join(root, "package.json"));
    const pkgResolved = req.resolve(trimmed);
    if (pkgResolved && fs.existsSync(pkgResolved)) {
      return pkgResolved;
    }
  } catch (e) {}

  return null;
}

/**
 * Resolves setup files according to Dinou's configuration hierarchy:
 * 1. Plugin setup files (`plugin.setupFiles`) always execute first, in plugin registration order.
 * 2. User setup files:
 *    - If `config.setupFiles` is explicitly provided in `dinou.config.*`, it is the sole source of truth
 *      (e.g. `setupFiles: []` disables the root `dinou.setup.*` convention).
 *    - Otherwise, falls back to checking the project root for `dinou.setup.mjs`, `dinou.setup.js`, or `dinou.setup.ts`.
 *
 * Supports relative paths, extensionless paths, `tsconfig.json`/`jsconfig.json` path aliases (`@/*`),
 * and npm package subpaths.
 *
 * @param {string} projectRoot
 * @param {object} config - Dinou config object
 * @returns {string[]} Deduplicated array of absolute file paths to inject/execute
 */
function resolveSetupFiles(projectRoot, config = {}) {
  const root = path.resolve(projectRoot || process.cwd());
  const pluginSetupFiles = [];

  if (config && config.plugins && Array.isArray(config.plugins)) {
    for (const plugin of config.plugins) {
      if (plugin && Array.isArray(plugin.setupFiles)) {
        for (const file of plugin.setupFiles) {
          const resolved = resolveSingleSetupFile(file, root);
          if (resolved) {
            pluginSetupFiles.push(resolved);
          } else {
            console.warn(
              `⚠️ [Dinou] Plugin "${plugin.name || "unnamed"}" specified setup file not found: ${file}`
            );
          }
        }
      }
    }
  }

  const userSetupFiles = [];
  if (config && Array.isArray(config.setupFiles)) {
    for (const file of config.setupFiles) {
      const resolved = resolveSingleSetupFile(file, root);
      if (resolved) {
        userSetupFiles.push(resolved);
      } else {
        console.warn(`⚠️ [Dinou] Configured setupFile not found: ${file}`);
      }
    }
  } else {
    for (const name of ROOT_SETUP_CANDIDATES) {
      const fullPath = path.resolve(root, name);
      if (fs.existsSync(fullPath)) {
        userSetupFiles.push(fullPath);
        break;
      }
    }
  }

  return [...new Set([...pluginSetupFiles, ...userSetupFiles])];
}

export { resolveSetupFiles };
export default {
  resolveSetupFiles,
  resolveSingleSetupFile,
  ROOT_SETUP_CANDIDATES,
};
