import { spawn } from "node:child_process";

export function ensureVendorMode() {
  const argv = process.argv;
  const isUnvendorizedRequested =
    argv.includes("-u") ||
    argv.includes("--unvendorized") ||
    process.env.DINOU_UNVENDORIZED === "true" ||
    process.env.DINOU_UNVENDORIZED === "1";

  const isAlreadyActive =
    process.execArgv.some((a) => a.includes("unvendorized")) ||
    (process.env.NODE_OPTIONS && process.env.NODE_OPTIONS.includes("unvendorized"));

  if (isUnvendorizedRequested && !isAlreadyActive) {
    const nodeOptions = (process.env.NODE_OPTIONS ? process.env.NODE_OPTIONS + " " : "") + "--conditions=unvendorized";
    const child = spawn(process.execPath, argv.slice(1), {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_OPTIONS: nodeOptions,
        DINOU_UNVENDORIZED: "true",
      },
    });

    child.on("exit", (code, signal) => {
      if (signal) process.kill(process.pid, signal);
      else process.exit(code ?? 0);
    });

    return false;
  }

  return true;
}

export default ensureVendorMode;
