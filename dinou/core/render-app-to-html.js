const path = require("path");
const { fork } = require("child_process"); // ⬅️ CHANGE 1: We use fork
const url = require("url");
const { getJSXJSON, hasJSXJSON } = require("./jsx-json");

function toFileUrl(p) {
  // Converts to file://, cross-platform
  return url.pathToFileURL(p).href;
}

const registerLoaderPath = toFileUrl(
  path.join(__dirname, "register-loader.mjs")
);
const renderHtmlPath = path.resolve(__dirname, "render-html.js");

// ----------------------------------------------------
// 💡 WHITELIST STRATEGY
// ----------------------------------------------------

// 1. Define ESSENTIAL Node.js flags that the child must have.
//    (We leave the list empty to avoid inheriting problematic flags)
const ESSENTIAL_NODE_ARGS = [];

// 2. Add the loader --import, which is the only confirmed necessity.
const loaderArg = `--import=${registerLoaderPath}`;
const childExecArgv = ESSENTIAL_NODE_ARGS.concat(loaderArg);

// ----------------------------------------------------

function renderAppToHtml(
  reqPath,
  paramsString,
  contextForChild,
  res,
  capturedStatus = null,
  isDynamic = false
) {
  const jsxJson = getJSXJSON(reqPath);
  const hasJsxJson = hasJSXJSON(reqPath);
  // We replicate the array of positional arguments passed to the script
  // [renderHtmlPath, reqPath, paramsString, cookiesString]
  const scriptArgs = [
    reqPath,
    paramsString,
    contextForChild ? JSON.stringify(contextForChild) : JSON.stringify({}),
    isDynamic ? "true" : "false",
    hasJsxJson ? "true" : "false",
    JSON.stringify(hasJsxJson ? jsxJson : {}),
  ];

  const child = fork(
    renderHtmlPath, // ⬅️ CHANGE 2: The script (path) is the first argument of fork (no need for "node")
    scriptArgs, // Positional arguments for the script (process.argv)
    {
      env: {
        NODE_ENV: process.env.NODE_ENV,
        DINOU_BUILD_TOOL: process.env.DINOU_BUILD_TOOL,
      }, // You can pass other environment variables if necessary
      // ⬅️ CHANGE 3: Apply Whitelist to execArgv, resetting inherited options
      execArgv: childExecArgv,
      // ⬅️ CHANGE 4: stdio needs 'ipc' for fork to work and for the future communication channel
      stdio: ["ignore", "pipe", "pipe", "ipc"], // stdin, stdout, stderr, ipc
    }
  );

  // 💡 on('message') Implementation (IPC Channel)
  // ----------------------------------------------------
  child.on("message", (message) => {
    if (message && message.type === "DINOU_CONTEXT_COMMAND") {
      const { command, args } = message;
      // console.log(
      //   `[Dinou] Received context command from child: ${command}`,
      //   args
      // );
      // List of supported commands for quick check
      if (
        command === "setHeader" ||
        command === "clearCookie" ||
        command === "cookie" || // ⬅️ ADDED
        command === "status" ||
        command === "redirect"
      ) {
        // ============================================================
        // SCENARIO 1: STREAMING ALREADY STARTED (Headers sent)
        // ============================================================
        if (res.headersSent) {
          // --- REDIRECT (JS Injection) ---
          if (command === "redirect") {
            const url = args.length === 1 ? args[0] : args[1];
            console.log(
              `[Dinou] Streaming active. Redirecting via JavaScript to: ${url}`
            );
            const safeUrl = JSON.stringify(url);
            res.write(`<script>window.location.href = ${safeUrl};</script>`);
            res.end();
            return;
          }

          // --- STATUS (Warning) ---
          if (command === "status") {
            console.warn(
              `[Dinou Warning] HTTP status '${args[0]}' ignored because streaming started.`
            );
            if (capturedStatus) capturedStatus.value = args[0];
            return;
          }

          // --- CLEAR COOKIE (JS Injection - Only Non-HttpOnly) ---
          if (command === "clearCookie") {
            const [name, options] = args;
            const path = options && options.path ? options.path : "/";
            console.log(
              `[Dinou] Streaming active. Clearing cookie '${name}' via JS.`
            );
            const safeName = JSON.stringify(name);
            const safePath = JSON.stringify(path);
            res.write(
              `<script>document.cookie = ${safeName} + "=; Max-Age=0; path=" + ${safePath} + ";";</script>`
            );
            return;
          }

          // --- 🍪 SET COOKIE (New - JS Injection) ---
          if (command === "cookie") {
            const [name, value, options] = args;

            // ⚠️ CRITICAL WARNING:
            // If the cookie is HttpOnly, JS cannot write it.
            if (options && options.httpOnly) {
              console.error(
                `[Dinou Error] Cannot set HttpOnly cookie '${name}' because streaming has already started. ` +
                  `Headers are sent, and document.cookie cannot write HttpOnly cookies.`
              );
              return; // We do nothing because it would fail silently in the browser
            }

            console.log(
              `[Dinou] Streaming active. Setting cookie '${name}' via JS.`
            );

            // We build the cookie string manually for JS
            // Format: name=value; path=/; max-age=...
            let cookieStr = `${name}=${encodeURIComponent(value)}`;

            if (options) {
              if (options.path) cookieStr += `; path=${options.path}`;
              if (options.domain) cookieStr += `; domain=${options.domain}`;
              if (options.maxAge) cookieStr += `; max-age=${options.maxAge}`;
              if (options.expires)
                cookieStr += `; expires=${new Date(
                  options.expires
                ).toUTCString()}`;
              if (options.secure) cookieStr += `; secure`;
              if (options.sameSite)
                cookieStr += `; samesite=${options.sameSite}`;
            }

            // console.log(`[Dinou] Cookie string to set: ${cookieStr}`);
            const safeCookieStr = JSON.stringify(cookieStr);
            res.write(`<script>document.cookie = ${safeCookieStr};</script>`);
            return;
          }

          // --- SET HEADER (Warning) ---
          if (command === "setHeader") {
            console.warn(
              `[Dinou Warning] Cannot set header '${args[0]}' because streaming started.`
            );
            return;
          }
        }
      }

      // ============================================================
      // SCENARIO 2: HEADERS NOT YET SENT (Normal Express usage)
      // ============================================================
      if (typeof res[command] === "function") {
        // Special safe redirect handling
        if (command === "redirect") {
          // 1. Normalize arguments (Status and URL)
          let status = 302; // Express Default
          let rawUrl = "";

          if (args.length === 2) {
            // Signature: redirect(status, url)
            status = args[0];
            rawUrl = args[1];
          } else {
            // Signature: redirect(url)
            rawUrl = args[0];
          }

          // 2. Security Logic (Safe Redirect)
          // We allow only relative routes starting with '/' but not '//'
          let finalUrl = "/";

          if (
            typeof rawUrl === "string" &&
            rawUrl.startsWith("/") &&
            !rawUrl.startsWith("//")
          ) {
            finalUrl = rawUrl;
          } else {
            console.warn(
              `[Dinou Security] Blocked unsafe redirect to: ${rawUrl}`
            );
            // finalUrl remains "/"
          }

          // 3. Execute safe redirect always using (status, url)
          res.redirect.apply(res, [status, finalUrl]);
          return;
        }

        // Standard execution (cookie, clearCookie, status, setHeader)
        res[command].apply(res, args);
      } else {
        console.error(`[Dinou] Unknown context command: ${command}`);
      }
    }
  });
  // ----------------------------------------------------

  // Capture child errors
  child.on("error", (err) => {
    console.error("Failed to start child process:", err);
  });

  // Listen to stderr, replicating the behavior of the original function
  child.stderr.on("data", (chunk) => {
    console.error(chunk.toString());
  });

  // ⬅️ Return identical to original, returning only the HTML stream
  return child.stdout;
}

module.exports = renderAppToHtml;
