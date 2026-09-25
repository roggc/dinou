// dinou/node/terminal-status.mjs
// Lightweight terminal status & animated spinner for Dinou Development Server.
// Zero external dependencies. Fully TTY-aware and safe for CI/Playwright.

const isTTY = Boolean(
  process.stdout.isTTY && !process.env.CI && process.env.TERM !== "dumb"
);

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const C_RESET = "\x1b[0m";
const C_BOLD = "\x1b[1m";
const C_DIM = "\x1b[90m";
const C_CYAN = "\x1b[36m";
const C_GREEN = "\x1b[32m";
const C_YELLOW = "\x1b[33m";
const C_MAGENTA = "\x1b[35m";

let active = false;
let frameIdx = 0;
let currentText = "";
let timer = null;
let isWatching = false;

// Intercept stdout/stderr writes so normal logs don't collide with the spinner line
let hooked = false;
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

function hookStreams() {
  if (hooked || !isTTY) return;
  hooked = true;

  process.stdout.write = function (chunk, encoding, callback) {
    if (active) {
      originalStdoutWrite("\r\x1b[2K");
    }
    const result = originalStdoutWrite(chunk, encoding, callback);
    if (active) {
      render();
    }
    return result;
  };

  process.stderr.write = function (chunk, encoding, callback) {
    if (active) {
      originalStdoutWrite("\r\x1b[2K");
    }
    const result = originalStderrWrite(chunk, encoding, callback);
    if (active) {
      render();
    }
    return result;
  };
}

function render() {
  if (!active || !isTTY) return;
  const frame = FRAMES[frameIdx];
  const line = `\r\x1b[2K  ${C_CYAN}${C_BOLD}${frame}${C_RESET} ${currentText}`;
  originalStdoutWrite(line);
}

export function startSpinner(text) {
  if (!isTTY) return;
  hookStreams();
  currentText = text;
  active = true;
  frameIdx = 0;
  if (!timer) {
    timer = setInterval(() => {
      frameIdx = (frameIdx + 1) % FRAMES.length;
      render();
    }, 80);
    timer.unref();
  }
  render();
}

export function updateSpinner(text) {
  currentText = text;
  if (isTTY && active) {
    render();
  }
}

export function stopSpinner() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (active && isTTY) {
    originalStdoutWrite("\r\x1b[2K");
  }
  active = false;
}

export function logSuccess(text) {
  stopSpinner();
  console.log(`  ${C_GREEN}✓${C_RESET} ${text}`);
  if (isWatching) {
    showIdleStatus();
  }
}

export function logInfo(text) {
  stopSpinner();
  console.log(`  ${C_CYAN}ℹ${C_RESET} ${text}`);
  if (isWatching) {
    showIdleStatus();
  }
}

export function showIdleStatus() {
  if (!isTTY) return;
  startSpinner(`${C_DIM}watching for file changes...${C_RESET}`);
}

export function printReadyBanner({ port, tool, durationMs }) {
  stopSpinner();
  isWatching = true;

  const durationStr = durationMs ? `${durationMs}ms` : "";
  const timeBadge = durationStr ? ` ${C_DIM}in ${C_BOLD}${durationStr}${C_RESET}` : "";

  console.log("");
  console.log(`  ${C_CYAN}${C_BOLD}▲ Dinou v7${C_RESET} ${C_GREEN}(Dual-Bundle, 0-fork)${C_RESET}${timeBadge}`);
  console.log("");
  console.log(`  ${C_GREEN}➜${C_RESET}  ${C_BOLD}Local:${C_RESET}   ${C_CYAN}http://localhost:${port}/${C_RESET}`);
  console.log(`  ${C_GREEN}➜${C_RESET}  ${C_BOLD}Bundler:${C_RESET} ${tool}`);
  console.log(`  ${C_GREEN}➜${C_RESET}  ${C_BOLD}Mode:${C_RESET}    development`);
  console.log("");

  showIdleStatus();
}

export default {
  startSpinner,
  updateSpinner,
  stopSpinner,
  logSuccess,
  logInfo,
  showIdleStatus,
  printReadyBanner,
};
