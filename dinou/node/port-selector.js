// dinou/node/port-selector.mjs
// Interactive development port detection and fallback for Dinou.
// Ensures dual consecutive free ports (HTTP server + HMR / WebSocket server)
// across all supported bundlers (esbuild, rollup, webpack).

import net from "node:net";
import readline from "node:readline";

const C_RESET = "\x1b[0m";
const C_BOLD = "\x1b[1m";
const C_DIM = "\x1b[90m";
const C_CYAN = "\x1b[36m";
const C_GREEN = "\x1b[32m";
const C_YELLOW = "\x1b[33m";
const C_RED = "\x1b[31m";

/**
 * Checks if a TCP port is currently free on both default and IPv4 loopback.
 * @param {number} port
 * @returns {Promise<boolean>}
 */
export function isPortAvailable(port) {
  return new Promise((resolve) => {
    // 1. Try active connection to 127.0.0.1
    const client = net.connect({ port, host: "127.0.0.1" });
    client.once("connect", () => {
      client.destroy();
      resolve(false);
    });
    client.once("error", () => {
      client.destroy();
      // 2. Try listening on default host
      const s1 = net.createServer();
      s1.unref();
      s1.once("error", () => resolve(false));
      s1.once("listening", () => {
        s1.close(() => {
          // 3. Try listening specifically on 127.0.0.1
          const s2 = net.createServer();
          s2.unref();
          s2.once("error", () => resolve(false));
          s2.once("listening", () => {
            s2.close(() => resolve(true));
          });
          s2.listen(port, "127.0.0.1");
        });
      });
      s1.listen(port);
    });
  });
}

/**
 * Checks if both server port and companion HMR port are available.
 * @param {number} serverPort
 * @param {number} hmrPort
 * @returns {Promise<boolean>}
 */
export async function arePortsAvailable(serverPort, hmrPort) {
  const isServerFree = await isPortAvailable(serverPort);
  if (!isServerFree) return false;
  const isHmrFree = await isPortAvailable(hmrPort);
  return isHmrFree;
}

/**
 * Finds the next available pair of consecutive ports [P, P+1].
 * Keeps even/odd parity so HTTP servers remain on even ports.
 * @param {number} startPort
 * @returns {Promise<number>}
 */
export async function findAvailablePortPair(startPort = 3000) {
  let current = startPort;
  while (current < 65534) {
    if (await arePortsAvailable(current, current + 1)) {
      return current;
    }
    current += current % 2 === 0 ? 2 : 1;
  }
  throw new Error("No available port pair found");
}

/**
 * Prompts the user interactively in the terminal via readline.
 * @param {string} question
 * @returns {Promise<boolean>}
 */
function promptUser(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.on("SIGINT", () => {
      rl.close();
      console.log(`\n\n  ${C_RED}❌ Server startup aborted by user.${C_RESET}\n`);
      process.exit(0);
    });

    rl.question(question, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      if (trimmed === "" || trimmed === "y" || trimmed === "yes") {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

/**
 * Resolves dev server ports.
 * In development, if the target port (or HMR port) is in use:
 * - In interactive TTY: prompts the user to switch to the next consecutive free port pair.
 * - In non-interactive environments (CI, scripts): exits immediately with an error.
 * @returns {Promise<{ port: number, hmrPort: number }>}
 */
export async function resolveDevPorts() {
  const requestedPort = Number(process.env.PORT || 3000);
  const requestedHmrPort = Number(process.env.HMR_PORT || (requestedPort + 1));

  const isServerFree = await isPortAvailable(requestedPort);
  const isHmrFree = await isPortAvailable(requestedHmrPort);

  if (isServerFree && isHmrFree) {
    process.env.PORT = String(requestedPort);
    process.env.HMR_PORT = String(requestedHmrPort);
    return { port: requestedPort, hmrPort: requestedHmrPort };
  }

  const busyPort = !isServerFree ? requestedPort : requestedHmrPort;

  // Non-interactive environments (CI, pipes) cannot prompt user
  const isInteractive = Boolean(
    (process.stdout.isTTY || process.env.DINOU_FORCE_INTERACTIVE === "true") &&
    !process.env.CI &&
    process.env.TERM !== "dumb"
  );

  if (!isInteractive) {
    console.error(`\n❌ FATAL ERROR: Port ${busyPort} is already in use!\n`);
    process.exit(1);
  }

  // Find next consecutive pair (e.g. 3002 & 3003)
  const fallbackPort = await findAvailablePortPair(requestedPort + 2);
  const fallbackHmrPort = fallbackPort + 1;

  const confirmed = await promptUser(
    `\n  ${C_YELLOW}⚠️  Port ${busyPort} is in use.${C_RESET}\n  ${C_BOLD}? Would you like to use port ${fallbackPort} instead?${C_RESET} ${C_DIM}(Y/n)${C_RESET} `
  );

  if (!confirmed) {
    console.log(`\n  ${C_RED}❌ Server startup aborted by user.${C_RESET}\n`);
    process.exit(0);
  }

  console.log(`\n  ${C_GREEN}➜${C_RESET}  ${C_BOLD}Using port:${C_RESET} ${C_CYAN}${fallbackPort}${C_RESET} ${C_DIM}(HMR: ${fallbackHmrPort})${C_RESET}\n`);
  process.env.PORT = String(fallbackPort);
  process.env.HMR_PORT = String(fallbackHmrPort);
  return { port: fallbackPort, hmrPort: fallbackHmrPort };
}
