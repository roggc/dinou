const path = require("path");
const { fork } = require("child_process"); // ⬅️ CAMBIO 1: Usamos fork
const url = require("url");
const { getJSXJSON, hasJSXJSON } = require("./jsx-json");

function toFileUrl(p) {
  // Convierte a file://, cross-platform
  return url.pathToFileURL(p).href;
}

const registerLoaderPath = toFileUrl(
  path.join(__dirname, "register-loader.mjs")
);
const renderHtmlPath = path.resolve(__dirname, "render-html.js");

// ----------------------------------------------------
// 💡 ESTRATEGIA DE LISTA BLANCA (WHITELIST)
// ----------------------------------------------------

// 1. Definimos los flags ESENCIALES de Node.js que el hijo debe tener.
//    (Dejamos la lista vacía para no heredar flags problemáticos)
const ESSENTIAL_NODE_ARGS = [];

// 2. Añadimos el --import del loader, que es la única necesidad confirmada.
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
  // Replicamos el array de argumentos posicionales que se pasaban al script
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
    renderHtmlPath, // ⬅️ CAMBIO 2: El script (path) es el primer argumento de fork (sin necesidad de "node")
    scriptArgs, // Argumentos posicionales para el script (process.argv)
    {
      env: {
        NODE_ENV: process.env.NODE_ENV,
        DINOU_BUILD_TOOL: process.env.DINOU_BUILD_TOOL,
      }, // Puedes pasar otras variables de entorno si es necesario
      // ⬅️ CAMBIO 3: Aplicamos la Lista Blanca a execArgv, reseteando las opciones heredadas
      execArgv: childExecArgv,
      // ⬅️ CAMBIO 4: stdio necesita 'ipc' para que fork funcione y para el canal de comunicación futuro
      stdio: ["ignore", "pipe", "pipe", "ipc"], // stdin, stdout, stderr, ipc
    }
  );

  // 💡 Implementación de on('message') (Canal IPC)
  // ----------------------------------------------------
  child.on("message", (message) => {
    if (message && message.type === "DINOU_CONTEXT_COMMAND") {
      const { command, args } = message;
      // console.log(
      //   `[Dinou] Received context command from child: ${command}`,
      //   args
      // );
      // Lista de comandos soportados para chequeo rápido
      if (
        command === "setHeader" ||
        command === "clearCookie" ||
        command === "cookie" || // ⬅️ AÑADIDO
        command === "status" ||
        command === "redirect"
      ) {
        // ============================================================
        // ESCENARIO 1: EL STREAMING YA EMPEZÓ (Headers enviados)
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

          // --- CLEAR COOKIE (JS Injection - Solo Non-HttpOnly) ---
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

          // --- 🍪 SET COOKIE (Nuevo - JS Injection) ---
          if (command === "cookie") {
            const [name, value, options] = args;

            // ⚠️ ADVERTENCIA CRÍTICA:
            // Si la cookie es HttpOnly, JS no puede escribirla.
            if (options && options.httpOnly) {
              console.error(
                `[Dinou Error] Cannot set HttpOnly cookie '${name}' because streaming has already started. ` +
                  `Headers are sent, and document.cookie cannot write HttpOnly cookies.`
              );
              return; // No hacemos nada porque fallaría silenciosamente en el navegador
            }

            console.log(
              `[Dinou] Streaming active. Setting cookie '${name}' via JS.`
            );

            // Construimos el string de la cookie manualmente para JS
            // Formato: name=value; path=/; max-age=...
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
      // ESCENARIO 2: HEADERS AÚN NO ENVIADOS (Uso normal de Express)
      // ============================================================
      if (typeof res[command] === "function") {
        // Manejo especial de redirect seguro
        if (command === "redirect") {
          // 1. Normalizar argumentos (Status y URL)
          let status = 302; // Default de Express
          let rawUrl = "";

          if (args.length === 2) {
            // Firma: redirect(status, url)
            status = args[0];
            rawUrl = args[1];
          } else {
            // Firma: redirect(url)
            rawUrl = args[0];
          }

          // 2. Lógica de Seguridad (Safe Redirect)
          // Permitimos solo rutas relativas que empiezan por '/' pero no por '//'
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
            // finalUrl se queda en "/"
          }

          // 3. Ejecutar redirect seguro usando siempre (status, url)
          res.redirect.apply(res, [status, finalUrl]);
          return;
        }

        // Ejecución estándar (cookie, clearCookie, status, setHeader)
        res[command].apply(res, args);
      } else {
        console.error(`[Dinou] Unknown context command: ${command}`);
      }
    }
  });
  // ----------------------------------------------------

  // Capturamos errores del child
  child.on("error", (err) => {
    console.error("Failed to start child process:", err);
  });

  // Escuchamos stderr, replicando el comportamiento de la función original
  child.stderr.on("data", (chunk) => {
    console.error(chunk.toString());
  });

  // ⬅️ Retorno idéntico al original, devolviendo solo el stream de HTML
  return child.stdout;
}

module.exports = renderAppToHtml;
