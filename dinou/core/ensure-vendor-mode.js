import { spawn } from "node:child_process";
import { readEnvFilesMap } from "./env.js";

export function hasUnvendorizedInArgs(args = []) {
  for (let i = 0; i < args.length; i++) {
    const arg = String(args[i] || "");
    if (
      arg === "--conditions=unvendorized" ||
      arg === "-C=unvendorized" ||
      (arg.startsWith("--conditions=") &&
        arg.slice("--conditions=".length).split(",").includes("unvendorized")) ||
      (arg.startsWith("-C=") &&
        arg.slice("-C=".length).split(",").includes("unvendorized"))
    ) {
      return true;
    }
    if ((arg === "--conditions" || arg === "-C") && args[i + 1]) {
      if (String(args[i + 1]).split(",").includes("unvendorized")) {
        return true;
      }
    }
  }
  return false;
}

export function isUnvendorizedRequested(
  projectRoot = process.cwd(),
  argv = process.argv
) {
  if (
    argv.includes("-u") ||
    argv.includes("--unvendorized") ||
    process.env.DINOU_UNVENDORIZED === "true" ||
    process.env.DINOU_UNVENDORIZED === "1" ||
    hasUnvendorizedInArgs(process.execArgv)
  ) {
    return true;
  }
  try {
    const dotEnvMap = readEnvFilesMap(projectRoot).values;
    return (
      dotEnvMap.DINOU_UNVENDORIZED === "true" ||
      dotEnvMap.DINOU_UNVENDORIZED === "1"
    );
  } catch {
    return false;
  }
}

export function isUnvendorizedConditionActive() {
  const isBunRuntime =
    typeof Bun !== "undefined" || Boolean(process.versions?.bun);
  if (hasUnvendorizedInArgs(process.execArgv)) {
    return true;
  }
  if (!isBunRuntime && process.env.NODE_OPTIONS) {
    return /(?:^|\s)(?:--conditions[=\s]|-C[=\s])[^\s]*\bunvendorized\b/.test(
      process.env.NODE_OPTIONS
    );
  }
  return false;
}

export function ensureVendorMode() {
  if (isUnvendorizedRequested() && !isUnvendorizedConditionActive()) {
    const baseNodeOptions = process.env.NODE_OPTIONS || "";
    const nodeOptions = baseNodeOptions.includes("unvendorized")
      ? baseNodeOptions
      : (baseNodeOptions ? `${baseNodeOptions} ` : "") +
        "--conditions=unvendorized";

    const child = spawn(
      process.execPath,
      [...process.execArgv, "--conditions=unvendorized", ...process.argv.slice(1)],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          NODE_OPTIONS: nodeOptions,
          DINOU_UNVENDORIZED: "true",
        },
      }
    );

    child.on("exit", (code, signal) => {
      if (signal) process.kill(process.pid, signal);
      else process.exit(code ?? 0);
    });

    return false;
  }

  return true;
}

export default ensureVendorMode;
