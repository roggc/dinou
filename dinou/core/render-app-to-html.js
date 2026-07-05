const path = require("path");
const { fork } = require("child_process");
const url = require("url");
const fs = require("fs");
const getJSX = require("./get-jsx.js");
const { requestStorage } = require("./request-context.js");

const isDevelopment = process.env.NODE_ENV !== "production";
const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";

const { renderToPipeableStream } = isWebpack
  ? require("react-server-dom-webpack/server")
  : require("@roggc/react-server-dom-esm/server");

const manifestPath = path.resolve(
  process.cwd(),
  isWebpack
    ? (isDevelopment ? "public/react-client-manifest.json" : "dist3/react-client-manifest.json")
    : "react_client_manifest/react-client-manifest.json"
);

let cachedManifest = null;
function getManifest() {
  if (!isDevelopment && cachedManifest) return cachedManifest;
  try {
    const content = fs.readFileSync(manifestPath, "utf8");
    const parsed = JSON.parse(content);
    if (parsed && Object.keys(parsed).length > 0) {
      cachedManifest = parsed;
    }
    return cachedManifest || parsed;
  } catch (e) {
    if (cachedManifest) {
      console.warn("Using cached client manifest due to read error:", e.message);
      return cachedManifest;
    }
    console.error("Error reading client manifest:", e);
    return {};
  }
}

function toFileUrl(p) {
  return url.pathToFileURL(p).href;
}

const registerLoaderPath = toFileUrl(
  path.join(__dirname, "register-loader.mjs"),
);
const renderHtmlPath = path.resolve(__dirname, "render-html.js");

const ESSENTIAL_NODE_ARGS = [];
const loaderArg = `--import=${registerLoaderPath}`;
const childExecArgv = ESSENTIAL_NODE_ARGS.concat(loaderArg);

const { resolveRelativeUrl } = require("./url-resolver");

function createParentResponseWrapper(reqPath, res, child) {
  let hasRedirected = false;

  const safeRedirect = (targetUrl) => {
    if (hasRedirected) return;
    hasRedirected = true;

    const resolvedUrl = resolveRelativeUrl(targetUrl, reqPath);
    let finalUrl = "/";
    if (
      typeof resolvedUrl === "string" &&
      resolvedUrl.startsWith("/") &&
      !resolvedUrl.startsWith("//")
    ) {
      finalUrl = resolvedUrl;
    } else {
      console.warn(
        `[Dinou Security] Blocked unsafe redirect to: ${targetUrl}`,
      );
    }

    if (res.headersSent) {
      console.log(
        `[Dinou] Streaming active. Redirecting via JavaScript to: ${finalUrl}`,
      );
      const safeUrl = JSON.stringify(finalUrl);
      res.write(`<script>window.location.href = ${safeUrl};</script>`);
      res.end();
      child.stdout.unpipe(res);
      child.kill();
    } else {
      res.redirect(302, finalUrl);
      child.stdout.unpipe(res);
      child.kill();
    }
  };

  return {
    setHeader: (name, value) => {
      if (res.headersSent) {
        console.warn(
          `[Dinou Warning] Cannot set header '${name}' because streaming started.`,
        );
      } else {
        res.setHeader(name, value);
      }
    },
    cookie: (name, value, options) => {
      if (res.headersSent) {
        if (options && options.httpOnly) {
          console.error(
            `[Dinou Error] Cannot set HttpOnly cookie '${name}' because streaming has already started.`,
          );
          return;
        }
        console.log(
          `[Dinou] Streaming active. Setting cookie '${name}' via JS.`,
        );
        let cookieStr = `${name}=${encodeURIComponent(value)}`;
        if (options) {
          if (options.path) cookieStr += `; path=${options.path}`;
          if (options.domain) cookieStr += `; domain=${options.domain}`;
          if (options.maxAge) cookieStr += `; max-age=${options.maxAge}`;
          if (options.expires)
            cookieStr += `; expires=${new Date(options.expires).toUTCString()}`;
          if (options.secure) cookieStr += `; secure`;
          if (options.sameSite)
            cookieStr += `; samesite=${options.sameSite}`;
        }
        const safeCookieStr = JSON.stringify(cookieStr);
        res.write(`<script>document.cookie = ${safeCookieStr};</script>`);
      } else {
        res.cookie(name, value, options);
      }
    },
    clearCookie: (name, options) => {
      if (res.headersSent) {
        console.log(
          `[Dinou] Streaming active. Clearing cookie '${name}' via JS.`,
        );
        let cookieStr = `${name}=; Max-Age=0`;
        const path = options?.path || "/";
        cookieStr += `; path=${path}`;
        if (options) {
          if (options.domain) cookieStr += `; domain=${options.domain}`;
          if (options.secure) cookieStr += `; secure`;
          if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`;
        }
        cookieStr += ";";
        const safeCookieStr = JSON.stringify(cookieStr);
        res.write(`<script>document.cookie = ${safeCookieStr};</script>`);
      } else {
        res.clearCookie(name, options);
      }
    },
    redirect: (arg1, arg2) => {
      const url = arg2 || arg1;
      safeRedirect(url);
    },
    status: (code) => {
      if (res.headersSent) {
        console.warn(
          `[Dinou Warning] HTTP status '${code}' ignored because streaming started.`,
        );
      } else {
        res.status(code);
      }
    },
  };
}

function renderAppToHtml(
  reqPath,
  paramsString,
  contextForChild,
  res,
  capturedStatus = null,
  isDynamic = false,
  forceNotFound = false,
) {
  const child = fork(
    renderHtmlPath,
    [
      reqPath,
      paramsString,
      contextForChild ? JSON.stringify(contextForChild) : JSON.stringify({}),
      isDynamic ? "true" : "false",
    ],
    {
      execArgv: childExecArgv,
      stdio: ["ignore", "pipe", "pipe", "ipc", "pipe"], // fd 4 is the RSC stream pipe
    },
  );

  const query = JSON.parse(paramsString || "{}");
  const rscPath = path.resolve(process.cwd(), "dist2", reqPath.replace(/^\//, ""), "rsc.rsc");
  const hasStaticRsc = !isDynamic && fs.existsSync(rscPath);

  if (hasStaticRsc) {
    try {
      const rscBuffer = fs.readFileSync(rscPath);
      child.stdio[4].write(rscBuffer);
      child.stdio[4].end();
    } catch (err) {
      console.error(`[Dinou] Failed to read static RSC from ${rscPath}:`, err.message);
      if (child.stdio[4]) child.stdio[4].destroy();
    }
  } else {
    // Dynamic SSR render: render RSC in parent and pipe to fd 4
    const isNotFound = {};
    const parentRes = createParentResponseWrapper(reqPath, res, child);
    const context = {
      req: contextForChild ? contextForChild.req : {},
      res: parentRes,
    };
    requestStorage.run(context, () => {
      getJSX(reqPath, query, isNotFound, isDevelopment, forceNotFound)
        .then((jsx) => {
          if (isNotFound.value) {
            parentRes.status(404);
          }
          const manifest = getManifest();
          const { pipe } = isWebpack
            ? renderToPipeableStream(jsx, manifest)
            : renderToPipeableStream(jsx, url.pathToFileURL(process.cwd()).href + "/");
          pipe(child.stdio[4]);
        })
        .catch((err) => {
          console.error("Error rendering JSX in parent renderAppToHtml:", err);
          if (child.stdio[4]) child.stdio[4].destroy();
        });
    });
  }

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
            const rawUrl = args.length === 1 ? args[0] : args[1];
            const resolvedUrl = resolveRelativeUrl(rawUrl, reqPath);
            console.log(
              `[Dinou] Streaming active. Redirecting via JavaScript to: ${resolvedUrl}`,
            );
            let finalUrl = "/";
            if (
              typeof resolvedUrl === "string" &&
              resolvedUrl.startsWith("/") &&
              !resolvedUrl.startsWith("//")
            ) {
              finalUrl = resolvedUrl;
            } else {
              console.warn(
                `[Dinou Security] Blocked unsafe streaming redirect to: ${rawUrl}`,
              );
            }
            const safeUrl = JSON.stringify(finalUrl);
            res.write(`<script>window.location.href = ${safeUrl};</script>`);
            res.end();
            child.stdout.unpipe(res);
            child.kill();
            return;
          }

          // --- STATUS (Warning) ---
          if (command === "status") {
            console.warn(
              `[Dinou Warning] HTTP status '${args[0]}' ignored because streaming started.`,
            );
            if (capturedStatus) capturedStatus.value = args[0];
            return;
          }

          // --- CLEAR COOKIE (JS Injection - Only Non-HttpOnly) ---
          if (command === "clearCookie") {
            const [name, options] = args;
            console.log(
              `[Dinou] Streaming active. Clearing cookie '${name}' via JS.`,
            );
            let cookieStr = `${name}=; Max-Age=0`;
            const path = options?.path || "/";
            cookieStr += `; path=${path}`;
            if (options) {
              if (options.domain) cookieStr += `; domain=${options.domain}`;
              if (options.secure) cookieStr += `; secure`;
              if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`;
            }
            cookieStr += ";";
            const safeCookieStr = JSON.stringify(cookieStr);
            res.write(
              `<script>document.cookie = ${safeCookieStr};</script>`,
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
                `Headers are sent, and document.cookie cannot write HttpOnly cookies.`,
              );
              return; // We do nothing because it would fail silently in the browser
            }

            console.log(
              `[Dinou] Streaming active. Setting cookie '${name}' via JS.`,
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
                  options.expires,
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
              `[Dinou Warning] Cannot set header '${args[0]}' because streaming started.`,
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

          // Resolve relative URL relative to reqPath
          const resolvedUrl = resolveRelativeUrl(rawUrl, reqPath);

          // 2. Security Logic (Safe Redirect)
          // We allow only relative routes starting with '/' but not '//'
          let finalUrl = "/";

          if (
            typeof resolvedUrl === "string" &&
            resolvedUrl.startsWith("/") &&
            !resolvedUrl.startsWith("//")
          ) {
            finalUrl = resolvedUrl;
          } else {
            console.warn(
              `[Dinou Security] Blocked unsafe redirect to: ${rawUrl}`,
            );
            // finalUrl remains "/"
          }

          // 3. Execute safe redirect always using (status, url)
          res.redirect.apply(res, [status, finalUrl]);
          child.stdout.unpipe(res);
          child.kill();
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
