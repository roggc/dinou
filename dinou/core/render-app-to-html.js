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
      env: { ...process.env },
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

      // Ejecutar el comando real de Express usando el 'res' pasado
      if (typeof res[command] === "function") {
        res[command](...args);
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
