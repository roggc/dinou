#!/usr/bin/env node

import ensureVendorMode, {
  isUnvendorizedRequested,
} from "./core/ensure-vendor-mode.js";
if (!ensureVendorMode()) {
  await new Promise(() => { });
}

import { program } from "#commander";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFiles } from "./core/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dinouPath = __dirname;
const projectRoot = process.cwd();

const dinouRequire = createRequire(import.meta.url);
const projectRequire = createRequire(path.resolve(projectRoot, "package.json"));

function resolveToolBin(specifier) {
  try {
    return dinouRequire.resolve(specifier);
  } catch {
    return projectRequire.resolve(specifier);
  }
}

const dinouScript = (rel) => path.join(dinouPath, rel);

// Global CLI options for Dinou v9 (Dual-Mode Vendoring)
program
  .name("dinou")
  .description(
    "Full-stack React 19 framework with native RSC, progressive streaming, and dual-mode vendoring"
  )
  .version("10.0.0")
  .option(
    "-u, --unvendorized",
    "Run with standard node_modules dependencies instead of pre-bundled vendor packages"
  );

const pathKey =
  Object.keys(process.env).find((k) => k.toLowerCase() === "path") || "PATH";
const projectBin = path.join(projectRoot, "node_modules", ".bin");
const dinouBin = path.join(dinouPath, "node_modules", ".bin");
const dinouParentBin = path.resolve(dinouPath, "..", "node_modules", ".bin");
const extendedPath = [
  projectBin,
  dinouBin,
  dinouParentBin,
  process.env[pathKey],
]
  .filter(Boolean)
  .join(path.delimiter);

function buildChildEnv(extraEnv = {}) {
  const unvendorized =
    isUnvendorizedRequested(projectRoot) ||
    Boolean(program.opts?.().unvendorized);
  const baseNodeOptions = process.env.NODE_OPTIONS || "";
  const nodeOptions =
    unvendorized && !baseNodeOptions.includes("unvendorized")
      ? (baseNodeOptions ? `${baseNodeOptions} ` : "") +
      "--conditions=unvendorized"
      : baseNodeOptions;

  return {
    unvendorized,
    env: {
      ...process.env,
      [pathKey]: extendedPath,
      Path: extendedPath,
      PATH: extendedPath,
      ...(unvendorized ? { DINOU_UNVENDORIZED: "true" } : {}),
      ...(nodeOptions ? { NODE_OPTIONS: nodeOptions } : {}),
      ...extraEnv,
    },
  };
}

function jsStep(runner, scriptOrResolver, args = [], env = {}) {
  return { kind: "js", runner, scriptOrResolver, args, env };
}

function cmdStep(bin, args = [], env = {}) {
  return { kind: "cmd", bin, args, env };
}

function runSteps(steps, baseEnv = {}) {
  const isBunRuntime =
    typeof Bun !== "undefined" || Boolean(process.versions?.bun);

  for (const step of steps) {
    const mergedExtraEnv = { ...baseEnv, ...(step.env || {}) };
    const { unvendorized, env } = buildChildEnv(mergedExtraEnv);

    let bin;
    let finalArgs;

    if (step.kind === "js") {
      const targetScript =
        typeof step.scriptOrResolver === "function"
          ? step.scriptOrResolver()
          : step.scriptOrResolver;

      if (step.runner === "bun") {
        bin = isBunRuntime ? process.execPath : "bun";
      } else {
        bin = !isBunRuntime ? process.execPath : "node";
      }

      const conditionPrefix = unvendorized ? ["--conditions=unvendorized"] : [];
      finalArgs = [...conditionPrefix, targetScript, ...(step.args || [])];
    } else {
      bin =
        step.bin === "bun" && isBunRuntime ? process.execPath : step.bin;
      finalArgs = [...(step.args || [])];
    }

    let result = spawnSync(bin, finalArgs, {
      stdio: "inherit",
      cwd: projectRoot,
      env,
    });

    if (
      result.error &&
      process.platform === "win32" &&
      !path.isAbsolute(bin) &&
      (result.error.code === "ENOENT" || result.error.code === "EINVAL")
    ) {
      result = spawnSync(bin, finalArgs, {
        stdio: "inherit",
        cwd: projectRoot,
        env,
        shell: true,
      });
    }

    if (result.error) {
      console.error(
        `Error executing "${bin} ${finalArgs.join(" ")}":`,
        result.error.message
      );
      process.exit(1);
    }

    if (result.status !== 0) {
      if (result.signal) {
        process.kill(process.pid, result.signal);
      }
      process.exit(result.status ?? 1);
    }
  }
}

const runProdSteps = (steps, extraEnv = {}) =>
  runSteps(steps, { NODE_ENV: "production", ...extraEnv });

function bundlerStep(bundler, runner = "node") {
  if (bundler === "rollup") {
    return jsStep(
      runner,
      () => resolveToolBin("rollup/dist/bin/rollup"),
      ["-c", dinouScript("rollup/rollup.config.js")],
      { NODE_ENV: "production", DINOU_BUILD_TOOL: "rollup" }
    );
  }
  if (bundler === "webpack") {
    return jsStep(
      runner,
      () => resolveToolBin("webpack-cli/bin/cli.js"),
      ["--config", dinouScript("webpack/webpack.config.js")],
      { NODE_ENV: "production", DINOU_BUILD_TOOL: "webpack" }
    );
  }
  return jsStep(runner, dinouScript("esbuild/build.js"), [], {
    NODE_ENV: "production",
    DINOU_BUILD_TOOL: "esbuild",
  });
}

// --- DEV ---

program
  .command("dev")
  .description("Start development server with Esbuild")
  .action(() => {
    runSteps([
      jsStep("node", dinouScript("node/dev.js"), [], {
        DINOU_BUILD_TOOL: "esbuild",
      }),
    ]);
  });

program
  .command("dev:esbuild")
  .description("Start development server with Esbuild")
  .action(() => {
    runSteps([
      jsStep("node", dinouScript("node/dev.js"), [], {
        DINOU_BUILD_TOOL: "esbuild",
      }),
    ]);
  });

program
  .command("dev:rollup")
  .description("Start development server with Rollup")
  .action(() => {
    runSteps([
      jsStep("node", dinouScript("node/dev.js"), [], {
        DINOU_BUILD_TOOL: "rollup",
      }),
    ]);
  });

program
  .command("dev:webpack")
  .description("Start development server with Webpack")
  .action(() => {
    runSteps([
      jsStep("node", dinouScript("node/dev.js"), [], {
        DINOU_BUILD_TOOL: "webpack",
      }),
    ]);
  });

// --- NODE (BUILD & START) ---

const buildNodeSteps = (bundler, runner = "node") => [
  bundlerStep(bundler, runner),
  jsStep(runner, dinouScript("node/build.js"), [], {
    NODE_ENV: "production",
    DINOU_BUILD_TOOL: bundler,
  }),
];

program
  .command("build")
  .description("Build the app for Node.js production (using esbuild)")
  .action(() => {
    runProdSteps(buildNodeSteps("esbuild", "node"));
  });

program
  .command("build:node")
  .description("Build the app for Node.js production (using esbuild)")
  .action(() => {
    runProdSteps(buildNodeSteps("esbuild", "node"));
  });

program
  .command("build:node:esbuild")
  .description("Build the app for Node.js with Esbuild")
  .action(() => {
    runProdSteps(buildNodeSteps("esbuild", "node"));
  });

program
  .command("build:node:rollup")
  .description("Build the app for Node.js with Rollup")
  .action(() => {
    runProdSteps(buildNodeSteps("rollup", "node"));
  });

program
  .command("build:node:webpack")
  .description("Build the app for Node.js with Webpack")
  .action(() => {
    runProdSteps(buildNodeSteps("webpack", "node"));
  });

program
  .command("start")
  .description("Start the app in production mode (Node.js)")
  .action(() => {
    runProdSteps([jsStep("node", dinouScript("adapters/node.js"))]);
  });

program
  .command("start:node")
  .description("Start the app in production mode (Node.js)")
  .action(() => {
    runProdSteps([jsStep("node", dinouScript("adapters/node.js"))]);
  });

program
  .command("start:node:esbuild")
  .description("Start the app in production mode (Esbuild build)")
  .action(() => {
    runProdSteps([
      jsStep("node", dinouScript("adapters/node.js"), [], {
        DINOU_BUILD_TOOL: "esbuild",
      }),
    ]);
  });

program
  .command("start:node:rollup")
  .description("Start the app in production mode (Rollup build)")
  .action(() => {
    runProdSteps([
      jsStep("node", dinouScript("adapters/node.js"), [], {
        DINOU_BUILD_TOOL: "rollup",
      }),
    ]);
  });

program
  .command("start:node:webpack")
  .description("Start the app in production mode (Webpack build)")
  .action(() => {
    runProdSteps([
      jsStep("node", dinouScript("adapters/node.js"), [], {
        DINOU_BUILD_TOOL: "webpack",
      }),
    ]);
  });

// --- NODE (COMPILE VIA BUN) ---

const nodeTargets = [
  { name: "", args: [], outfile: "dist/server" },
  {
    name: ":linux",
    args: ["--target=bun-linux-x64"],
    outfile: "dist/server-linux",
  },
  {
    name: ":linux_arm",
    args: ["--target=bun-linux-arm64"],
    outfile: "dist/server-linux-arm",
  },
  {
    name: ":mac",
    args: ["--target=bun-darwin-arm64"],
    outfile: "dist/server-mac",
  },
  {
    name: ":win",
    args: ["--target=bun-windows-x64"],
    outfile: "dist/server-win",
  },
];

for (const t of nodeTargets) {
  for (const b of ["esbuild", "rollup", "webpack"]) {
    const cmdNames =
      b === "esbuild"
        ? [
          `build:node:compile${t.name}`,
          `build:node:compile${t.name}:esbuild`,
        ]
        : [`build:node:compile${t.name}:${b}`];
    for (const cmdName of cmdNames) {
      program
        .command(cmdName)
        .description(
          `Compile standalone Node.js server executable with Bun (${t.name || "host"}, ${b})`
        )
        .action(() => {
          runProdSteps([
            ...buildNodeSteps(b, "node"),
            cmdStep("bun", [
              "build",
              "--compile",
              ...t.args,
              ".dinou/node/server.mjs",
              "--outfile",
              t.outfile,
            ]),
          ]);
        });
    }
  }
}

// --- NODE (PURE BUN RUNNER & COMPILE) ---

program
  .command("build:node:pure")
  .description("Build the app for Node.js with 100% Bun (using esbuild)")
  .action(() => {
    runProdSteps(buildNodeSteps("esbuild", "bun"));
  });

program
  .command("build:node:pure:esbuild")
  .description("Build the app for Node.js with 100% Bun (Esbuild)")
  .action(() => {
    runProdSteps(buildNodeSteps("esbuild", "bun"));
  });

program
  .command("build:node:pure:rollup")
  .description("Build the app for Node.js with 100% Bun (Rollup)")
  .action(() => {
    runProdSteps(buildNodeSteps("rollup", "bun"));
  });

program
  .command("build:node:pure:webpack")
  .description("Build the app for Node.js with 100% Bun (Webpack)")
  .action(() => {
    runProdSteps(buildNodeSteps("webpack", "bun"));
  });

for (const t of nodeTargets) {
  for (const b of ["esbuild", "rollup", "webpack"]) {
    const cmdNames =
      b === "esbuild"
        ? [
          `build:node:pure:compile${t.name}`,
          `build:node:pure:compile${t.name}:esbuild`,
        ]
        : [`build:node:pure:compile${t.name}:${b}`];
    for (const cmdName of cmdNames) {
      program
        .command(cmdName)
        .description(
          `Compile standalone Node.js server executable with 100% Bun (${t.name || "host"}, ${b})`
        )
        .action(() => {
          runProdSteps([
            ...buildNodeSteps(b, "bun"),
            cmdStep("bun", [
              "build",
              "--compile",
              ...t.args,
              ".dinou/node/server.mjs",
              "--outfile",
              t.outfile,
            ]),
          ]);
        });
    }
  }
}

// --- NETLIFY FUNCTIONS V2 ---

const buildNetlifySteps = (bundler) => [bundlerStep(bundler, "node")];

program
  .command("build:netlify")
  .description("Build the app for Netlify Serverless Functions v2 (using esbuild)")
  .action(() => {
    runProdSteps(buildNetlifySteps("esbuild"));
  });

program
  .command("build:netlify:esbuild")
  .description("Build the app for Netlify Serverless Functions v2 with Esbuild")
  .action(() => {
    runProdSteps(buildNetlifySteps("esbuild"));
  });

program
  .command("build:netlify:rollup")
  .description("Build the app for Netlify Serverless Functions v2 with Rollup")
  .action(() => {
    runProdSteps(buildNetlifySteps("rollup"));
  });

program
  .command("build:netlify:webpack")
  .description("Build the app for Netlify Serverless Functions v2 with Webpack")
  .action(() => {
    runProdSteps(buildNetlifySteps("webpack"));
  });

// --- CLOUDFLARE WORKERS ---

const buildCloudflareSteps = (bundler) => [
  bundlerStep(bundler, "node"),
  jsStep("node", dinouScript("cloudflare/build.js"), [], {
    NODE_ENV: "production",
    DINOU_BUILD_TOOL: bundler,
  }),
];

program
  .command("build:cloudflare")
  .description("Build the app for Cloudflare Workers (using esbuild)")
  .action(() => {
    runProdSteps(buildCloudflareSteps("esbuild"));
  });

program
  .command("build:cloudflare:esbuild")
  .description("Build the app for Cloudflare Workers with Esbuild")
  .action(() => {
    runProdSteps(buildCloudflareSteps("esbuild"));
  });

program
  .command("build:cloudflare:rollup")
  .description("Build the app for Cloudflare Workers with Rollup")
  .action(() => {
    runProdSteps(buildCloudflareSteps("rollup"));
  });

program
  .command("build:cloudflare:webpack")
  .description("Build the app for Cloudflare Workers with Webpack")
  .action(() => {
    runProdSteps(buildCloudflareSteps("webpack"));
  });

// --- DENO DEPLOY / EDGE ---

const buildDenoSteps = (bundler) => [
  bundlerStep(bundler, "node"),
  jsStep("node", dinouScript("deno/build.js"), [], {
    NODE_ENV: "production",
    DINOU_BUILD_TOOL: bundler,
  }),
  cmdStep(
    "deno",
    [
      "run",
      "--unstable-kv",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      dinouScript("deno/seed-kv.js"),
    ],
    { NODE_ENV: "production", DINOU_BUILD_TOOL: bundler }
  ),
];

program
  .command("build:deno")
  .description("Build the app for Deno Deploy / Edge (using esbuild)")
  .action(() => {
    runProdSteps(buildDenoSteps("esbuild"));
  });

program
  .command("build:deno:esbuild")
  .description("Build the app for Deno Deploy with Esbuild")
  .action(() => {
    runProdSteps(buildDenoSteps("esbuild"));
  });

program
  .command("build:deno:rollup")
  .description("Build the app for Deno Deploy with Rollup")
  .action(() => {
    runProdSteps(buildDenoSteps("rollup"));
  });

program
  .command("build:deno:webpack")
  .description("Build the app for Deno Deploy with Webpack")
  .action(() => {
    runProdSteps(buildDenoSteps("webpack"));
  });

program
  .command("start:deno")
  .description("Start the app in production mode with Deno")
  .action(() => {
    runProdSteps([
      cmdStep("deno", [
        "run",
        "--unstable-kv",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "--allow-sys",
        dinouScript("adapters/deno.js"),
      ]),
    ]);
  });

const denoTargets = [
  { name: "", args: [], outfile: "dist/deno-server" },
  {
    name: ":linux",
    args: ["--target", "x86_64-unknown-linux-gnu"],
    outfile: "dist/deno-server-linux",
  },
  {
    name: ":linux_arm",
    args: ["--target", "aarch64-unknown-linux-gnu"],
    outfile: "dist/deno-server-linux-arm",
  },
  {
    name: ":mac",
    args: ["--target", "aarch64-apple-darwin"],
    outfile: "dist/deno-server-mac",
  },
  {
    name: ":win",
    args: ["--target", "x86_64-pc-windows-msvc"],
    outfile: "dist/deno-server-win",
  },
];

for (const t of denoTargets) {
  for (const b of ["esbuild", "rollup", "webpack"]) {
    const cmdNames =
      b === "esbuild"
        ? [
          `build:deno:compile${t.name}`,
          `build:deno:compile${t.name}:esbuild`,
        ]
        : [`build:deno:compile${t.name}:${b}`];
    for (const cmdName of cmdNames) {
      program
        .command(cmdName)
        .description(
          `Compile standalone Deno executable (${t.name || "host"}, ${b})`
        )
        .action(() => {
          runProdSteps([
            ...buildDenoSteps(b),
            cmdStep("deno", [
              "compile",
              ...t.args,
              "--unstable-kv",
              "--no-check",
              "--no-config",
              "--allow-net",
              "--allow-read",
              "--allow-write",
              "--allow-env",
              "--allow-sys",
              "--output",
              t.outfile,
              ".dinou/deno/main.js",
            ]),
          ]);
        });
    }
  }
}

// --- BUN (STANDARD & PURE) ---

const buildBunSteps = (bundler, runner = "node") => [
  bundlerStep(bundler, runner),
  jsStep(runner, dinouScript("bun/build.js"), [], {
    NODE_ENV: "production",
    DINOU_BUILD_TOOL: bundler,
  }),
];

program
  .command("build:bun")
  .description("Build the app for Bun (using esbuild)")
  .action(() => {
    runProdSteps(buildBunSteps("esbuild", "node"));
  });

program
  .command("build:bun:esbuild")
  .description("Build the app for Bun with Esbuild")
  .action(() => {
    runProdSteps(buildBunSteps("esbuild", "node"));
  });

program
  .command("build:bun:rollup")
  .description("Build the app for Bun with Rollup")
  .action(() => {
    runProdSteps(buildBunSteps("rollup", "node"));
  });

program
  .command("build:bun:webpack")
  .description("Build the app for Bun with Webpack")
  .action(() => {
    runProdSteps(buildBunSteps("webpack", "node"));
  });

program
  .command("start:bun")
  .description("Start the app in production mode with Bun")
  .action(() => {
    runProdSteps([jsStep("bun", dinouScript("adapters/bun.js"))]);
  });

program
  .command("start:bun:esbuild")
  .description("Start the app in production mode with Bun (Esbuild)")
  .action(() => {
    runProdSteps([
      jsStep("bun", dinouScript("adapters/bun.js"), [], {
        DINOU_BUILD_TOOL: "esbuild",
      }),
    ]);
  });

program
  .command("start:bun:rollup")
  .description("Start the app in production mode with Bun (Rollup)")
  .action(() => {
    runProdSteps([
      jsStep("bun", dinouScript("adapters/bun.js"), [], {
        DINOU_BUILD_TOOL: "rollup",
      }),
    ]);
  });

program
  .command("start:bun:webpack")
  .description("Start the app in production mode with Bun (Webpack)")
  .action(() => {
    runProdSteps([
      jsStep("bun", dinouScript("adapters/bun.js"), [], {
        DINOU_BUILD_TOOL: "webpack",
      }),
    ]);
  });

const bunTargets = [
  { name: "", args: [], outfile: "dist/server" },
  {
    name: ":linux",
    args: ["--target=bun-linux-x64"],
    outfile: "dist/server-linux",
  },
  {
    name: ":linux_arm",
    args: ["--target=bun-linux-arm64"],
    outfile: "dist/server-linux-arm",
  },
  {
    name: ":mac",
    args: ["--target=bun-darwin-arm64"],
    outfile: "dist/server-mac",
  },
  {
    name: ":win",
    args: ["--target=bun-windows-x64"],
    outfile: "dist/server-win",
  },
];

for (const t of bunTargets) {
  for (const b of ["esbuild", "rollup", "webpack"]) {
    const cmdNames =
      b === "esbuild"
        ? [
          `build:bun:compile${t.name}`,
          `build:bun:compile${t.name}:esbuild`,
        ]
        : [`build:bun:compile${t.name}:${b}`];
    for (const cmdName of cmdNames) {
      program
        .command(cmdName)
        .description(
          `Compile standalone Bun executable (${t.name || "host"}, ${b})`
        )
        .action(() => {
          runProdSteps([
            ...buildBunSteps(b, "node"),
            cmdStep("bun", [
              "build",
              "--compile",
              ...t.args,
              ".dinou/bun/server.js",
              "--outfile",
              t.outfile,
            ]),
          ]);
        });
    }
  }
}

program
  .command("build:bun:pure")
  .description("Build the app with 100% Bun (using esbuild)")
  .action(() => {
    runProdSteps(buildBunSteps("esbuild", "bun"));
  });

program
  .command("build:bun:pure:esbuild")
  .description("Build the app with 100% Bun (Esbuild)")
  .action(() => {
    runProdSteps(buildBunSteps("esbuild", "bun"));
  });

program
  .command("build:bun:pure:rollup")
  .description("Build the app with 100% Bun (Rollup)")
  .action(() => {
    runProdSteps(buildBunSteps("rollup", "bun"));
  });

program
  .command("build:bun:pure:webpack")
  .description("Build the app with 100% Bun (Webpack)")
  .action(() => {
    runProdSteps(buildBunSteps("webpack", "bun"));
  });

for (const t of bunTargets) {
  for (const b of ["esbuild", "rollup", "webpack"]) {
    const cmdNames =
      b === "esbuild"
        ? [
          `build:bun:pure:compile${t.name}`,
          `build:bun:pure:compile${t.name}:esbuild`,
        ]
        : [`build:bun:pure:compile${t.name}:${b}`];
    for (const cmdName of cmdNames) {
      program
        .command(cmdName)
        .description(
          `Compile standalone Bun Pure executable (${t.name || "host"}, ${b})`
        )
        .action(() => {
          runProdSteps([
            ...buildBunSteps(b, "bun"),
            cmdStep("bun", [
              "build",
              "--compile",
              ...t.args,
              ".dinou/bun/server.js",
              "--outfile",
              t.outfile,
            ]),
          ]);
        });
    }
  }
}

// --- EXPORT STATIC ---

const exportStaticSteps = (bundler) => [
  bundlerStep(bundler, "node"),
  jsStep("node", dinouScript("core/export-static.js"), [], {
    NODE_ENV: "production",
    DINOU_BUILD_TOOL: bundler,
  }),
];

program
  .command("export-static")
  .description("Export standalone static website (using esbuild)")
  .action(() => {
    runProdSteps(exportStaticSteps("esbuild"));
  });

program
  .command("export-static:esbuild")
  .description("Export standalone static website with Esbuild")
  .action(() => {
    runProdSteps(exportStaticSteps("esbuild"));
  });

program
  .command("export-static:rollup")
  .description("Export standalone static website with Rollup")
  .action(() => {
    runProdSteps(exportStaticSteps("rollup"));
  });

program
  .command("export-static:webpack")
  .description("Export standalone static website with Webpack")
  .action(() => {
    runProdSteps(exportStaticSteps("webpack"));
  });

// --- VENDORS ---

program
  .command("build:vendors")
  .description("Bundle dependencies into dinou/compiled vendors")
  .action(() => {
    runSteps([jsStep("node", dinouScript("scripts/build-vendors.js"))]);
  });

// --- TYPEGEN ---

program
  .command("typegen")
  .description(
    "Generate .dinou/types/routes.d.ts and .dinou/routes/**/dinou.{js,d.ts} from src/"
  )
  .action(async () => {
    loadEnvFiles(projectRoot);
    const { generateRouteTypes } = await import("./core/generate-route-types.js");
    const stats = generateRouteTypes(projectRoot);
    if (stats) {
      console.log(
        `🦖 [Dinou] Generated .dinou/types/routes.d.ts & contextual "./dinou" modules (${stats.totalRoutes} routes, ${stats.layoutCount} layouts, ${stats.slotCount} slots, ${stats.contextualDirCount} route dirs)`
      );
    }
  });

// --- EJECT / UNEJECT ---

program
  .command("eject")
  .description("Copy the framework into ./dinou at the root of the project")
  .option(
    "-f, --force",
    "Overwrite an existing ./dinou directory when running from node_modules"
  )
  .option(
    "--skip-install",
    "Skip running package manager install after updating package.json"
  )
  .action(async (opts) => {
    const localDinouDir = path.resolve(projectRoot, "dinou");
    const normCurrent = path
      .resolve(dinouPath)
      .replace(/\\/g, "/")
      .toLowerCase();
    const normTarget = localDinouDir.replace(/\\/g, "/").toLowerCase();

    if (normCurrent === normTarget) {
      console.log(
        'ℹ️  [Dinou Eject] This project is already ejected in ./dinou. Skipping to prevent overwriting your local framework customizations. (Run "npm run uneject" to revert to node_modules/dinou.)'
      );
      return;
    }

    if (fs.existsSync(localDinouDir) && !opts.force) {
      console.log(
        'ℹ️  [Dinou Eject] Directory ./dinou already exists. Skipping to prevent overwriting local changes (pass --force from node_modules/dinou to overwrite, or run "npm run uneject" first).'
      );
      return;
    }

    let ejectMod;
    try {
      ejectMod = await import("../eject.js");
    } catch (err) {
      if (
        err &&
        (err.code === "ERR_MODULE_NOT_FOUND" ||
          err.code === "MODULE_NOT_FOUND")
      ) {
        console.log(
          'ℹ️  [Dinou Eject] This project is already running in Ejected Mode (./dinou). Skipping eject to protect local changes. (Run "npm run uneject" to revert to node_modules/dinou.)'
        );
        return;
      }
      throw err;
    }

    console.log("Executing eject...");
    ejectMod.eject({
      force: Boolean(opts.force),
      skipInstall: Boolean(opts.skipInstall),
      projectRoot,
    });
  });

program
  .command("uneject [version]")
  .description(
    "Revert an ejected ./dinou directory back to the node_modules dinou package"
  )
  .option("-y, --yes", "Skip interactive confirmation prompt")
  .option(
    "--skip-install",
    "Update package.json and remove ./dinou without running package manager install"
  )
  .option(
    "--keep-dinou",
    "Keep the local ./dinou directory on disk instead of deleting it"
  )
  .action(async (version, opts) => {
    const { uneject } = await import("./core/uneject.js");
    await uneject({
      spec: version || "latest",
      yes: Boolean(opts.yes),
      skipInstall: Boolean(opts.skipInstall),
      keepDinouDir: Boolean(opts.keepDinou),
      projectRoot,
    });
  });

program.parse(process.argv);
