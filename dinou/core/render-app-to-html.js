const path = require("path");
const { fork } = require("child_process"); // ⬅️ CAMBIO 1: Usamos fork
const url = require("url");

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
  cookiesString = "{}",
  contextForChild,
  res
) {
  // Replicamos el array de argumentos posicionales que se pasaban al script
  // [renderHtmlPath, reqPath, paramsString, cookiesString]
  const scriptArgs = [
    reqPath,
    paramsString,
    cookiesString,
    contextForChild ? JSON.stringify(contextForChild) : JSON.stringify({}),
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

      // // Caso Especial: Redirección
      // if (command === "redirect") {
      //   // args puede ser [url] o [status, url]
      //   // Normalizamos para obtener la URL
      //   const url = args.length === 1 ? args[0] : args[1];

      //   // 💡 AQUÍ ESTÁ LA MAGIA
      //   if (res.headersSent) {
      //     // ESCENARIO A: El streaming ya empezó (headers enviados).
      //     // No podemos usar HTTP 302. Inyectamos JS en el stream.
      //     console.log(
      //       `[Dinou] Streaming activo. Redirigiendo vía JS a: ${url}`
      //     );

      //     // Escribimos directamente en el stream de respuesta
      //     res.write(`<script>window.location.href = "${url}";</script>`);
      //     res.end(); // Cerramos la respuesta

      //     // Opcional: Matar al proceso hijo para ahorrar recursos ya que nos vamos
      //     // child.kill();
      //     return;
      //   }
      //   // else {
      //   //   // ESCENARIO B: Aún no se ha enviado nada.
      //   //   // Usamos la redirección HTTP nativa de Express.
      //   //   console.log(
      //   //     `[Dinou] Headers limpios. Redirigiendo vía HTTP a: ${url}`
      //   //   );
      //   //   if (typeof res.redirect === "function") {
      //   //     res.redirect(...args);
      //   //   }
      //   // }
      //   // return; // Salimos para no ejecutar el bloque genérico de abajo
      // }

      if (
        command === "setHeader" ||
        command === "clearCookie" ||
        command === "status" ||
        command === "redirect"
      ) {
        // SI EL STREAMING YA EMPEZÓ (Headers enviados)
        if (res.headersSent) {
          if (command === "redirect") {
            // args puede ser [url] o [status, url]
            // Normalizamos para obtener la URL
            const url = args.length === 1 ? args[0] : args[1];

            // 💡 AQUÍ ESTÁ LA MAGIA
            // ESCENARIO A: El streaming ya empezó (headers enviados).
            // No podemos usar HTTP 302. Inyectamos JS en el stream.
            console.log(
              `[Dinou] Streaming active. Redirecting via JavaScript to: ${url}`
            );

            const safeUrl = JSON.stringify(url);

            // 2. Inyectar SIN añadir comillas extra alrededor de ${safeUrl}
            res.write(`<script>window.location.href = ${safeUrl};</script>`);
            res.end(); // Cerramos la respuesta

            // Opcional: Matar al proceso hijo para ahorrar recursos ya que nos vamos
            // child.kill();
            return;
          }

          // 🛑 COMANDO STATUS (NO HAY MAGIA)
          if (command === "status") {
            console.warn(
              `[Dinou Warning] The HTTP status code '${args[0]}' cannot be set because streaming has already started. The status code will remain 200 OK.`
            );
            // Si la intención era un error, la UI debe renderizar la página de error.
            return;
          }
          // 🍪 MAGIA PARA CLEAR COOKIE
          if (command === "clearCookie") {
            const [name, options] = args;
            const path = options && options.path ? options.path : "/";

            console.log(
              `[Dinou] Streaming active. Deleting cookie '${name}' via JavaScript.`
            );

            // Inyectamos script para borrar la cookie (poniendo fecha en el pasado)
            // Nota: Esto solo funciona si la cookie NO es HttpOnly.
            const safeName = JSON.stringify(name); // Devuelve: "dinou-cookie"
            const safePath = JSON.stringify(path); // Devuelve: "/"

            res.write(
              `<script>document.cookie = ${safeName} + "=; Max-Age=0; path=" + ${safePath} + ";";</script>`
            );
            return;
          }

          // ❌ SET HEADER (Sin solución)
          if (command === "setHeader") {
            console.warn(
              `[Dinou Warning] Cannot set header '${args[0]}' because streaming has already started.`
            );
            return;
          }
        }
      }

      // Ejecutar el comando real de Express usando el 'res' pasado
      if (typeof res[command] === "function") {
        if (command === "redirect") {
          function safeRedirect(url) {
            if (url.startsWith("/") && !url.startsWith("//")) {
              // Es segura (relativa)
              res.redirect.apply(res, [url]);
            } else {
              // Es externa o peligrosa, forzar home o validar dominio
              res.redirect.apply(res, ["/"]);
            }
          }
          return safeRedirect(args[0]);
        }
        res[command].apply(res, args);
      } else {
        console.error(
          `[Dinou] Unknown context command or not supported by proxy: ${command}`
        );
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
