import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { spawn, spawnSync } from "node:child_process";

export const DINOU_CLI_COMMANDS = [
  "dev",
  "build",
  "start",
  "dev:esbuild",
  "dev:rollup",
  "dev:webpack",
  "build:node",
  "build:node:esbuild",
  "build:node:rollup",
  "build:node:webpack",
  "build:node:compile",
  "build:node:compile:esbuild",
  "build:node:compile:rollup",
  "build:node:compile:webpack",
  "build:node:compile:linux",
  "build:node:compile:linux:esbuild",
  "build:node:compile:linux:rollup",
  "build:node:compile:linux:webpack",
  "build:node:compile:linux_arm",
  "build:node:compile:linux_arm:esbuild",
  "build:node:compile:linux_arm:rollup",
  "build:node:compile:linux_arm:webpack",
  "build:node:compile:mac",
  "build:node:compile:mac:esbuild",
  "build:node:compile:mac:rollup",
  "build:node:compile:mac:webpack",
  "build:node:compile:win",
  "build:node:compile:win:esbuild",
  "build:node:compile:win:rollup",
  "build:node:compile:win:webpack",
  "build:node:pure",
  "build:node:pure:esbuild",
  "build:node:pure:rollup",
  "build:node:pure:webpack",
  "build:node:pure:compile",
  "build:node:pure:compile:esbuild",
  "build:node:pure:compile:rollup",
  "build:node:pure:compile:webpack",
  "build:node:pure:compile:linux",
  "build:node:pure:compile:linux:esbuild",
  "build:node:pure:compile:linux:rollup",
  "build:node:pure:compile:linux:webpack",
  "build:node:pure:compile:linux_arm",
  "build:node:pure:compile:linux_arm:esbuild",
  "build:node:pure:compile:linux_arm:rollup",
  "build:node:pure:compile:linux_arm:webpack",
  "build:node:pure:compile:mac",
  "build:node:pure:compile:mac:esbuild",
  "build:node:pure:compile:mac:rollup",
  "build:node:pure:compile:mac:webpack",
  "build:node:pure:compile:win",
  "build:node:pure:compile:win:esbuild",
  "build:node:pure:compile:win:rollup",
  "build:node:pure:compile:win:webpack",
  "start:node",
  "start:node:esbuild",
  "start:node:rollup",
  "start:node:webpack",
  "build:netlify",
  "build:netlify:esbuild",
  "build:netlify:rollup",
  "build:netlify:webpack",
  "build:cloudflare",
  "build:cloudflare:esbuild",
  "build:cloudflare:rollup",
  "build:cloudflare:webpack",
  "build:deno",
  "build:deno:esbuild",
  "build:deno:rollup",
  "build:deno:webpack",
  "build:deno:compile",
  "build:deno:compile:esbuild",
  "build:deno:compile:rollup",
  "build:deno:compile:webpack",
  "build:deno:compile:linux",
  "build:deno:compile:linux:esbuild",
  "build:deno:compile:linux:rollup",
  "build:deno:compile:linux:webpack",
  "build:deno:compile:linux_arm",
  "build:deno:compile:linux_arm:esbuild",
  "build:deno:compile:linux_arm:rollup",
  "build:deno:compile:linux_arm:webpack",
  "build:deno:compile:mac",
  "build:deno:compile:mac:esbuild",
  "build:deno:compile:mac:rollup",
  "build:deno:compile:mac:webpack",
  "build:deno:compile:win",
  "build:deno:compile:win:esbuild",
  "build:deno:compile:win:rollup",
  "build:deno:compile:win:webpack",
  "start:deno",
  "build:bun",
  "build:bun:esbuild",
  "build:bun:rollup",
  "build:bun:webpack",
  "build:bun:compile",
  "build:bun:compile:esbuild",
  "build:bun:compile:rollup",
  "build:bun:compile:webpack",
  "build:bun:compile:linux",
  "build:bun:compile:linux:esbuild",
  "build:bun:compile:linux:rollup",
  "build:bun:compile:linux:webpack",
  "build:bun:compile:linux_arm",
  "build:bun:compile:linux_arm:esbuild",
  "build:bun:compile:linux_arm:rollup",
  "build:bun:compile:linux_arm:webpack",
  "build:bun:compile:mac",
  "build:bun:compile:mac:esbuild",
  "build:bun:compile:mac:rollup",
  "build:bun:compile:mac:webpack",
  "build:bun:compile:win",
  "build:bun:compile:win:esbuild",
  "build:bun:compile:win:rollup",
  "build:bun:compile:win:webpack",
  "build:bun:pure",
  "build:bun:pure:esbuild",
  "build:bun:pure:rollup",
  "build:bun:pure:webpack",
  "build:bun:pure:compile",
  "build:bun:pure:compile:esbuild",
  "build:bun:pure:compile:rollup",
  "build:bun:pure:compile:webpack",
  "build:bun:pure:compile:linux",
  "build:bun:pure:compile:linux:esbuild",
  "build:bun:pure:compile:linux:rollup",
  "build:bun:pure:compile:linux:webpack",
  "build:bun:pure:compile:linux_arm",
  "build:bun:pure:compile:linux_arm:esbuild",
  "build:bun:pure:compile:linux_arm:rollup",
  "build:bun:pure:compile:linux_arm:webpack",
  "build:bun:pure:compile:mac",
  "build:bun:pure:compile:mac:esbuild",
  "build:bun:pure:compile:mac:rollup",
  "build:bun:pure:compile:mac:webpack",
  "build:bun:pure:compile:win",
  "build:bun:pure:compile:win:esbuild",
  "build:bun:pure:compile:win:rollup",
  "build:bun:pure:compile:win:webpack",
  "start:bun",
  "start:bun:esbuild",
  "start:bun:rollup",
  "start:bun:webpack",
  "export-static",
  "export-static:esbuild",
  "export-static:rollup",
  "export-static:webpack",
  "typegen",
];

const DINOU_CLI_COMMANDS_SET = new Set(DINOU_CLI_COMMANDS);
const STANDALONE_DINOU_BIN_RE = /(?<![./\\@-])\b(?:npx\s+)?dinou\b(?![/\\.-])/g;
const EJECTED_DINOU_CLI_RE = /\bnode\s+(?:\.[\\/])?dinou[\\/]cli\.js\b/g;
const WIN_LOCK_ERROR_CODES = new Set(["EPERM", "EBUSY", "ENOTEMPTY", "EACCES"]);

function scheduleDeferredRemoveOnWindows(targetDir) {
  try {
    const script =
      "const fs=require('node:fs');const dir=process.argv[1];" +
      "setTimeout(()=>{try{fs.rmSync(dir,{recursive:true,force:true,maxRetries:20,retryDelay:250});}catch{}},400);";
    const child = spawn(process.execPath, ["-e", script, targetDir], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

function removeDinouDirSafely(targetDir, { allowDeferredFallback = false } = {}) {
  try {
    fs.rmSync(targetDir, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 150,
    });
    return { removed: true, deferred: false, error: null };
  } catch (err) {
    const isWinLock =
      process.platform === "win32" &&
      err &&
      typeof err.code === "string" &&
      WIN_LOCK_ERROR_CODES.has(err.code);

    if (allowDeferredFallback && isWinLock) {
      const deferred = scheduleDeferredRemoveOnWindows(targetDir);
      return { removed: false, deferred, error: err };
    }

    if (allowDeferredFallback) {
      return { removed: false, deferred: false, error: err };
    }

    throw err;
  }
}

export function detectPackageManager(projectRoot = process.cwd()) {
  const userAgent = process.env.npm_config_user_agent;
  if (userAgent) {
    if (userAgent.startsWith("yarn")) return "yarn";
    if (userAgent.startsWith("pnpm")) return "pnpm";
    if (userAgent.startsWith("bun")) return "bun";
    if (userAgent.startsWith("npm")) return "npm";
  }

  if (fs.existsSync(path.join(projectRoot, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(projectRoot, "pnpm-lock.yaml"))) return "pnpm";
  if (
    fs.existsSync(path.join(projectRoot, "bun.lockb")) ||
    fs.existsSync(path.join(projectRoot, "bun.lock"))
  ) {
    return "bun";
  }
  if (fs.existsSync(path.join(projectRoot, "package-lock.json"))) return "npm";

  return "npm";
}

function quoteShellArg(arg) {
  const str = String(arg);
  if (!/[\s"&|<>^()]/.test(str)) return str;
  return `"${str.replace(/"/g, '\\"')}"`;
}

export function runPackageManager(pm, args, cwd) {
  let result = spawnSync(pm, args, {
    stdio: "inherit",
    cwd,
    env: process.env,
  });

  if (
    result.error &&
    process.platform === "win32" &&
    (result.error.code === "ENOENT" || result.error.code === "EINVAL")
  ) {
    const cmdLine = [pm, ...args.map(quoteShellArg)].join(" ");
    result = spawnSync(cmdLine, {
      stdio: "inherit",
      cwd,
      env: process.env,
      shell: true,
    });
  }

  return result;
}

function isProtocolOrTarballSpec(spec) {
  if (!spec || typeof spec !== "string") return false;
  return (
    spec.startsWith("file:") ||
    spec.startsWith("link:") ||
    spec.startsWith("workspace:") ||
    spec.startsWith("http:") ||
    spec.startsWith("https:") ||
    spec.startsWith("git+") ||
    spec.startsWith("github:") ||
    spec.endsWith(".tgz")
  );
}

/**
 * Rewrites `package.json` in place for Ejected Mode:
 * - Only rewrites Dinou scripts that already existed in `pkg.scripts`
 *   (comparing against `DINOU_CLI_COMMANDS` as well as custom scripts invoking `dinou`),
 *   preserving all non-Dinou scripts (`lint`, `test`, `clean`, etc.) untouched.
 * - Removes `"eject"` and adds `"build:vendors"` + `"uneject"`.
 * - Removes `devDependencies.dinou` if present and sets `dependencies.dinou = "file:./dinou"`.
 */
export function rewritePackageJsonForEject(pkg) {
  pkg.scripts = pkg.scripts || {};
  delete pkg.scripts.eject;

  for (const [name, value] of Object.entries(pkg.scripts)) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();

    if (DINOU_CLI_COMMANDS_SET.has(name)) {
      if (
        trimmed === `dinou ${name}` ||
        trimmed === `npx dinou ${name}` ||
        trimmed === `node dinou/cli.js ${name}` ||
        trimmed === `node ./dinou/cli.js ${name}` ||
        (name === "dev" && (trimmed === "dinou" || trimmed === "npx dinou"))
      ) {
        pkg.scripts[name] = `node dinou/cli.js ${name}`;
      } else if (STANDALONE_DINOU_BIN_RE.test(value)) {
        STANDALONE_DINOU_BIN_RE.lastIndex = 0;
        pkg.scripts[name] = value.replace(
          STANDALONE_DINOU_BIN_RE,
          "node dinou/cli.js"
        );
      }
      STANDALONE_DINOU_BIN_RE.lastIndex = 0;
      continue;
    }

    if (STANDALONE_DINOU_BIN_RE.test(value)) {
      STANDALONE_DINOU_BIN_RE.lastIndex = 0;
      pkg.scripts[name] = value.replace(
        STANDALONE_DINOU_BIN_RE,
        "node dinou/cli.js"
      );
    }
    STANDALONE_DINOU_BIN_RE.lastIndex = 0;
  }

  pkg.scripts["build:vendors"] = "node dinou/cli.js build:vendors";
  pkg.scripts.uneject = "node dinou/cli.js uneject";

  pkg.dependencies = pkg.dependencies || {};
  if (pkg.devDependencies && "dinou" in pkg.devDependencies) {
    delete pkg.devDependencies.dinou;
    if (Object.keys(pkg.devDependencies).length === 0) {
      delete pkg.devDependencies;
    }
  }
  pkg.dependencies.dinou = "file:./dinou";

  return pkg;
}

/**
 * Core implementation of `dinou eject`, parameterized by `sourceDinouDir` so:
 * 1. Upstream `<pkgRoot>/eject.js` is a thin wrapper passing `path.resolve(__dirname, "dinou")`.
 * 2. Ejected test workspaces (such as `dinou-e2e`, which contain `./dinou` without a root `eject.js`)
 *    can test 100% of the eject implementation directly from `./dinou/core/uneject.js`.
 *
 * @param {object} [options]
 * @param {string} options.sourceDinouDir Path to the source `dinou/` framework directory to copy from.
 * @param {string} [options.projectRoot=process.cwd()] Target project root directory.
 * @param {boolean} [options.force=false] Overwrite an existing `./dinou` directory.
 * @param {boolean} [options.skipInstall=false] Skip running `<pm> install` after updating `package.json`.
 */
export function runEject(options = {}) {
  const projectRoot = path.resolve(options.projectRoot || process.cwd());
  const sourceDinouDir = path.resolve(
    options.sourceDinouDir || path.resolve(projectRoot, "node_modules", "dinou", "dinou")
  );
  const targetDinouDir = path.resolve(projectRoot, "dinou");
  const pkgPath = path.resolve(projectRoot, "package.json");
  const force = Boolean(options.force);
  const skipInstall =
    Boolean(options.skipInstall) || process.env.DINOU_SKIP_INSTALL === "true";

  if (!fs.existsSync(sourceDinouDir)) {
    throw new Error(
      `[Dinou Eject] Source framework directory not found at ${sourceDinouDir}`
    );
  }

  if (!fs.existsSync(pkgPath)) {
    throw new Error(
      `[Dinou Eject] package.json not found in project root (${projectRoot})`
    );
  }

  const normSource = sourceDinouDir.replace(/\\/g, "/").toLowerCase();
  const normTarget = targetDinouDir.replace(/\\/g, "/").toLowerCase();
  if (normSource === normTarget) {
    console.log(
      "ℹ️  [Dinou Eject] Project is already running from ./dinou. Skipping to protect local customizations."
    );
    return { skipped: true };
  }

  if (fs.existsSync(targetDinouDir) && !force) {
    console.log(
      'ℹ️  [Dinou Eject] Directory ./dinou already exists. Skipping to prevent overwriting local customizations (pass --force to overwrite, or run "npm run uneject" first).'
    );
    return { skipped: true };
  }

  console.log("🚀 Starting Dinou eject process...");

  if (fs.existsSync(targetDinouDir) && force) {
    removeDinouDirSafely(targetDinouDir, { allowDeferredFallback: false });
  }

  fs.cpSync(sourceDinouDir, targetDinouDir, {
    recursive: true,
    filter: (src) => {
      const base = path.basename(src);
      return base !== "node_modules" && base !== ".DS_Store";
    },
  });

  const cliDest = path.join(targetDinouDir, "cli.js");
  if (fs.existsSync(cliDest)) {
    try {
      fs.chmodSync(cliDest, 0o755);
    } catch { }
  }
  console.log("📁 Copied Dinou framework source into ./dinou");

  const originalPkgContent = fs.readFileSync(pkgPath, "utf8");
  const pkg = JSON.parse(originalPkgContent);
  rewritePackageJsonForEject(pkg);

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  console.log(
    '✅ Updated package.json scripts (preserved custom scripts + added "build:vendors" and "uneject")'
  );

  if (!skipInstall) {
    const pm = detectPackageManager(projectRoot);
    console.log(`📦 Package manager detected: ${pm}`);
    console.log(`🔄 Executing '${pm} install' to link ./dinou dependencies...`);

    const res = runPackageManager(pm, ["install"], projectRoot);
    if (res.error || res.status !== 0) {
      const msg = res.error
        ? res.error.message
        : `exited with code ${res.status ?? 1}`;
      console.warn(
        `⚠️  [Dinou Eject] '${pm} install' did not complete cleanly (${msg}). Run '${pm} install' manually to finish linking ./dinou.`
      );
      return { skipped: false, installFailed: true };
    }
  }

  console.log(
    '🎉 Eject completed successfully! Edit ./dinou freely, or run "npm run uneject" anytime to revert.'
  );
  return { skipped: false, installFailed: false };
}

/**
 * Rewrites `package.json` in place for Uneject Mode (reverting back to `node_modules/dinou`).
 */
export function rewritePackageJsonForUneject(pkg, options = {}) {
  const rawSpec =
    typeof options.spec === "string" && options.spec.trim()
      ? options.spec.trim()
      : "latest";
  const skipInstall = Boolean(options.skipInstall);

  pkg.scripts = pkg.scripts || {};

  delete pkg.scripts.uneject;
  if (
    !options.hadBuildVendors &&
    (pkg.scripts["build:vendors"] === "node dinou/cli.js build:vendors" ||
      pkg.scripts["build:vendors"] === "node ./dinou/cli.js build:vendors" ||
      pkg.scripts["build:vendors"] === "dinou build:vendors")
  ) {
    delete pkg.scripts["build:vendors"];
  }

  for (const [key, val] of Object.entries(pkg.scripts)) {
    if (typeof val === "string") {
      pkg.scripts[key] = val.replace(EJECTED_DINOU_CLI_RE, "dinou");
    }
  }

  pkg.scripts.eject = "dinou eject";

  pkg.dependencies = pkg.dependencies || {};
  if (pkg.devDependencies && "dinou" in pkg.devDependencies) {
    delete pkg.devDependencies.dinou;
    if (Object.keys(pkg.devDependencies).length === 0) {
      delete pkg.devDependencies;
    }
  }

  const directSpec = isProtocolOrTarballSpec(rawSpec);
  const normalizedSpec =
    directSpec && rawSpec.endsWith(".tgz") && !rawSpec.includes(":")
      ? `file:${rawSpec}`
      : rawSpec;

  if (directSpec || skipInstall) {
    pkg.dependencies.dinou = normalizedSpec;
  } else {
    delete pkg.dependencies.dinou;
  }

  return { pkg, directSpec, normalizedSpec };
}

/**
 * Prompts the user on stdin/stdout to confirm a destructive action (`(y/N)`).
 * Defaults to `false` on Enter, `"n"`, EOF, or `Ctrl+C` / `Ctrl+D`.
 */
export function promptConfirmation(question) {
  return new Promise((resolve) => {
    if (process.stdin.destroyed || process.stdin.readableEnded) {
      process.stdout.write(question + "\n");
      return resolve(false);
    }

    let answered = false;
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      answered = true;
      rl.close();
      const normalized = String(answer || "").trim().toLowerCase();
      resolve(normalized === "y" || normalized === "yes");
    });

    rl.on("close", () => {
      if (!answered) {
        process.stdout.write("\n");
        resolve(false);
      }
    });
  });
}

/**
 * Reverts an ejected Dinou project back to using the `dinou` package from `node_modules`.
 *
 * @param {object} [options]
 * @param {string} [options.spec="latest"] Version tag, semver range, or `file:...` tarball path.
 * @param {boolean} [options.yes=false] Skip interactive `(y/N)` confirmation prompt.
 * @param {boolean} [options.skipInstall=false] Update `package.json` & remove `./dinou` without running package manager install.
 * @param {boolean} [options.keepDinouDir=false] Keep `./dinou` directory on disk instead of deleting it.
 * @param {string} [options.projectRoot=process.cwd()] Target project root directory.
 * @param {boolean} [options.hadBuildVendors=false] Preserve `build:vendors` if explicitly requested.
 * @param {boolean} [options.throwOnError=false] Throw an Error instead of calling `process.exit(1)` on install failure.
 */
export async function uneject(options = {}) {
  const projectRoot = path.resolve(options.projectRoot || process.cwd());
  const skipConfirm =
    Boolean(options.yes) || process.env.DINOU_YES === "true";
  const skipInstall =
    Boolean(options.skipInstall) || process.env.DINOU_SKIP_INSTALL === "true";
  const keepDinouDir = Boolean(options.keepDinouDir);

  const pkgPath = path.join(projectRoot, "package.json");
  if (!fs.existsSync(pkgPath)) {
    throw new Error(`[Dinou Uneject] package.json not found in ${projectRoot}`);
  }

  const localDinouDir = path.join(projectRoot, "dinou");

  if (!skipConfirm) {
    const promptMsg =
      !keepDinouDir && fs.existsSync(localDinouDir)
        ? "⚠️  Are you sure you want to uneject? This will permanently delete your local ./dinou directory. (y/N): "
        : "⚠️  Are you sure you want to uneject and restore package.json scripts? (y/N): ";
    const confirmed = await promptConfirmation(promptMsg);
    if (!confirmed) {
      console.log(
        "🚫 Uneject cancelled. Your local ./dinou directory was not modified."
      );
      return { cancelled: true };
    }
  }

  const originalPkgContent = fs.readFileSync(pkgPath, "utf8");
  const pkg = JSON.parse(originalPkgContent);

  console.log("🔄 Starting Dinou uneject process...");

  const { directSpec, normalizedSpec } = rewritePackageJsonForUneject(pkg, {
    ...options,
    skipInstall,
  });

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  console.log("✅ Restored package.json scripts to standard Dinou CLI commands");

  if (!skipInstall) {
    const pm = detectPackageManager(projectRoot);
    console.log(`📦 Package manager detected: ${pm}`);

    const pmArgs = directSpec
      ? ["install"]
      : pm === "npm"
        ? ["install", `dinou@${normalizedSpec}`]
        : ["add", `dinou@${normalizedSpec}`];

    console.log(`🔄 Executing '${pm} ${pmArgs.join(" ")}'...`);
    const res = runPackageManager(pm, pmArgs, projectRoot);

    if (res.error || res.status !== 0) {
      fs.writeFileSync(pkgPath, originalPkgContent, "utf8");
      const msg = res.error
        ? res.error.message
        : `exited with code ${res.status ?? 1}`;
      console.error(
        `❌ [Dinou Uneject] Package installation failed (${msg}). Rolled back package.json and kept ./dinou intact.`
      );
      if (options.throwOnError) {
        throw new Error(`[Dinou Uneject] Package installation failed: ${msg}`);
      }
      process.exit(1);
    }
    console.log("✅ Installed dinou package in node_modules");
  }

  let dinouDirRemaining = false;
  if (!keepDinouDir && fs.existsSync(localDinouDir)) {
    const rmResult = removeDinouDirSafely(localDinouDir, {
      allowDeferredFallback: true,
    });
    if (rmResult.removed) {
      console.log("🗑️  Removed local ./dinou directory");
    } else {
      dinouDirRemaining = true;
      const code = rmResult.error?.code || "ERROR";
      if (rmResult.deferred) {
        console.warn(
          `⚠️  [Dinou Uneject] ./dinou is currently locked (${code}). Scheduled automatic cleanup after exit — if ./dinou still remains (e.g. held by an open dev server or IDE), you can safely delete it manually.`
        );
      } else {
        console.warn(
          `⚠️  [Dinou Uneject] Could not delete ./dinou automatically (${code}: ${rmResult.error?.message || "locked"}). package.json and node_modules/dinou were updated successfully — please delete ./dinou manually.`
        );
      }
    }
  }

  console.log(
    "🎉 Uneject completed successfully! Dinou is now running from node_modules/dinou."
  );
  return {
    cancelled: false,
    ...(dinouDirRemaining ? { dinouDirRemaining: true } : {}),
  };
}

export default uneject;