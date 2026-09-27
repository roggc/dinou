// dinou/node/terminal-status.mjs
// Lightweight terminal status & animated spinner for Dinou Development Server.
// Zero external dependencies. Fully TTY-aware and safe for CI/Playwright.

import readline from "node:readline";

export const isTTY = Boolean(
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

export function getTerminalCols() {
  if (process.stdout.isTTY) {
    if (typeof process.stdout._refreshSize === "function") {
      try {
        process.stdout._refreshSize();
      } catch (e) {}
    }
    if (typeof process.stdout.getWindowSize === "function") {
      try {
        const [w] = process.stdout.getWindowSize();
        if (w > 0) return w;
      } catch (e) {}
    }
    return process.stdout.columns || 80;
  }
  return 80;
}

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
  const cols = getTerminalCols();
  if (cols <= 0) return;
  if (cols < 8) {
    const frame = FRAMES[frameIdx];
    originalStdoutWrite(`\r\x1b[2K${frame}\x1b[K\x1b[J`);
    return;
  }
  const maxTextLen = Math.max(1, cols - 6);
  let text = currentText;
  if (text.length > maxTextLen) {
    text = text.slice(0, Math.max(1, maxTextLen - 3)) + "...";
  }
  const frame = FRAMES[frameIdx];
  const line = `\r\x1b[2K  ${C_CYAN}${C_BOLD}${frame}${C_RESET} ${text}\x1b[K\x1b[J`;
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
  active = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (isTTY) {
    originalStdoutWrite("\r\x1b[2K\x1b[J\r");
  }
}

let buildFrameIdx = 0;
let buildTimer = null;
let currentBuildText = "";
let isBuildActive = false;

function smartTruncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  const m = text.match(/^(\[SSG\].*?:\s+)(.*)$/);
  if (m) {
    const prefix = m[1];
    const route = m[2];
    const avail = maxLen - prefix.length;
    if (avail > 10) {
      const half = Math.floor((avail - 3) / 2);
      return prefix + route.slice(0, half) + "..." + route.slice(route.length - (avail - 3 - half));
    }
  }
  if (maxLen <= 3) {
    return text.slice(0, maxLen);
  }
  return text.slice(0, maxLen - 3) + "...";
}

let lastBuildLineLen = 0;
let lastBuildCols = 0;

function renderBuildProgress() {
  if (!isBuildActive || !isTTY) return;
  const cols = getTerminalCols();
  if (cols <= 0) return;

  // Ultra-narrow terminal (< 8 cols): render just the spinner frame to guarantee 0 wrapping
  if (cols < 8) {
    const frame = FRAMES[buildFrameIdx];
    buildFrameIdx = (buildFrameIdx + 1) % FRAMES.length;
    lastBuildLineLen = 1;
    lastBuildCols = cols;
    process.stdout.write(`\r\x1b[2K${frame}\x1b[K\x1b[J`);
    return;
  }

  // If terminal narrowed since last render, the previous line reflowed across multiple physical rows.
  // Move up linesOccupied - 1 rows and clear each one to stay on a single line!
  if (lastBuildLineLen > 0 && lastBuildCols > cols) {
    const linesOccupied = Math.min(3, Math.ceil(lastBuildLineLen / Math.max(1, cols)));
    if (linesOccupied > 1) {
      for (let i = 0; i < linesOccupied - 1; i++) {
        process.stdout.write("\x1b[1A\r\x1b[2K");
      }
    }
  }

  // Dynamically adapt to full terminal width with a 2-column margin against auto-wrap
  const maxLineLen = Math.max(4, cols - 2);
  const maxTextLen = Math.max(1, maxLineLen - 4);

  const safeText = smartTruncate(currentBuildText, maxTextLen);

  const frame = FRAMES[buildFrameIdx];
  buildFrameIdx = (buildFrameIdx + 1) % FRAMES.length;

  lastBuildLineLen = safeText.length + 4;
  lastBuildCols = cols;

  // \r (carriage return) + \x1b[2K (clear line) + text + \x1b[K (clear trailing) + \x1b[J (clear all lines below)
  process.stdout.write(`\r\x1b[2K  ${C_CYAN}${C_BOLD}${frame}${C_RESET} ${safeText}\x1b[K\x1b[J`);
}

export function updateBuildProgress(text) {
  if (!isTTY) return;
  currentBuildText = text;
  if (!isBuildActive) {
    isBuildActive = true;
    buildFrameIdx = 0;
    lastBuildLineLen = 0;
    lastBuildCols = 0;
    // Hide cursor for smooth, flicker-free rendering
    process.stdout.write("\x1b[?25l");
    renderBuildProgress();
    if (!buildTimer) {
      buildTimer = setInterval(renderBuildProgress, 80);
      if (buildTimer.unref) buildTimer.unref();
    }
  }
}

export function clearBuildProgress() {
  if (!isTTY) return;
  isBuildActive = false;
  lastBuildLineLen = 0;
  lastBuildCols = 0;
  if (buildTimer) {
    clearInterval(buildTimer);
    buildTimer = null;
  }
  // Clear the line, clear any lines below, and restore cursor visibility
  process.stdout.write("\r\x1b[2K\x1b[J\x1b[?25h");
}

// Debounce terminal resize events so mouse dragging does not flood stdout
let resizeTimer = null;
if (typeof process.stdout.on === "function") {
  process.stdout.on("resize", () => {
    if (isBuildActive && isTTY) {
      if (!resizeTimer) {
        resizeTimer = setTimeout(() => {
          resizeTimer = null;
          renderBuildProgress();
        }, 40);
        if (resizeTimer.unref) resizeTimer.unref();
      }
    }
  });
}

// Ensure cursor is always restored on process exit
process.on("exit", () => {
  if (isTTY) {
    try {
      process.stdout.write("\x1b[?25h");
    } catch (e) {}
  }
});

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

export function printReadyBanner({ port, tool, durationMs, timings }) {
  stopSpinner();
  isWatching = true;

  const durationStr = durationMs ? `${durationMs}ms` : "";
  const timeBadge = durationStr ? ` ${C_DIM}in ${C_BOLD}${durationStr}${C_RESET}` : "";

  console.log("");
  console.log(`  ${C_CYAN}${C_BOLD}🦖 Dinou v7${C_RESET} ${C_GREEN}(Dual-Bundle, 0-fork)${C_RESET}${timeBadge}`);
  console.log("");
  console.log(`  ${C_GREEN}➜${C_RESET}  ${C_BOLD}Local:${C_RESET}   ${C_CYAN}http://localhost:${port}/${C_RESET}`);
  console.log(`  ${C_GREEN}➜${C_RESET}  ${C_BOLD}Bundler:${C_RESET} ${tool}`);
  const isDebug =
    process.env.DINOU_DEBUG === "true" ||
    process.env.DINOU_DEBUG === "1" ||
    process.env.DEBUG === "true" ||
    process.env.DEBUG === "1";

  if (timings && isDebug) {
    console.log("");
    console.log(`  ${C_BOLD}⚡ Startup Breakdown:${C_RESET}`);
    if (timings.discovery != null) {
      console.log(`    ${C_DIM}├─ Discovery & Routing:${C_RESET}       ${C_CYAN}${timings.discovery}ms${C_RESET}`);
    }
    if (timings.engineBuild != null) {
      console.log(`    ${C_DIM}├─ Dual-Engine (RSC+SSR):${C_RESET}     ${C_CYAN}${timings.engineBuild}ms${C_RESET}`);
    }
    if (timings.engineImport != null) {
      console.log(`    ${C_DIM}├─ Engine V8 Evaluation:${C_RESET}     ${C_CYAN}${timings.engineImport}ms${C_RESET}`);
    }
    if (timings.clientEntriesBabel != null) {
      console.log(`    ${C_DIM}├─ Client Babel AST Scan:${C_RESET}    ${C_CYAN}${timings.clientEntriesBabel}ms${C_RESET}`);
    }
    if (timings.clientBuild != null) {
      console.log(`    ${C_DIM}├─ Client Bundling (esbuild):${C_RESET} ${C_CYAN}${timings.clientBuild}ms${C_RESET}`);
      const subParts = [];
      if (timings.postCss) subParts.push(`PostCSS: ${timings.postCss}ms (${timings.postCssCount || 0} css)`);
      if (timings.swc) subParts.push(`SWC Refresh: ${timings.swc}ms (${timings.swcCount || 0} files)`);
      if (timings.sf) subParts.push(`Server Actions: ${timings.sf}ms (${timings.sfCount || 0} files)`);
      if (timings.rcm) subParts.push(`Client Manifest: ${timings.rcm}ms`);
      if (timings.stable) subParts.push(`Stable Chunks: ${timings.stable}ms`);
      if (timings.writeDisk != null) {
        if (timings.writeDisk === 0) {
          subParts.push("Memory: 0ms (disk skipped)");
        } else {
          subParts.push(`Disk Write: ${timings.writeDisk}ms`);
        }
      }
      if (subParts.length > 0) {
        console.log(`    ${C_DIM}│  └─ [${subParts.join(" | ")}]${C_RESET}`);
      }
    } else if (timings.clientBundlerTotal != null) {
      console.log(`    ${C_DIM}├─ Client Bundler Total:${C_RESET}     ${C_CYAN}${timings.clientBundlerTotal}ms${C_RESET}`);
    }
    console.log(`    ${C_DIM}└─ Total Startup Time:${C_RESET}       ${C_GREEN}${C_BOLD}${durationMs}ms${C_RESET}`);
  }

  console.log("");
  showIdleStatus();
}

export default {
  startSpinner,
  updateSpinner,
  stopSpinner,
  updateBuildProgress,
  clearBuildProgress,
  logSuccess,
  logInfo,
  showIdleStatus,
  printReadyBanner,
};
