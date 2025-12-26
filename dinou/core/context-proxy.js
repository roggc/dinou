// core/context-proxy.js

/**
 * Crea un objeto proxy que intercepta las llamadas a métodos de respuesta
 * y las envía al proceso padre (Express Handler) a través de IPC.
 * @returns {object} El objeto proxy que simula la respuesta de Express.
 */
function createResponseProxy() {
  // const proxyId = Math.random().toString(36).substring(7);
  // console.log(`[Proxy] Creado nuevo proxy con ID: ${proxyId}`);
  // Función central para enviar comandos al proceso padre
  function sendCommand(command, args) {
    // console.log(`[Dinou] Sending context command to parent: ${command}`, args);
    if (typeof process.send === "function") {
      process.send({
        type: "DINOU_CONTEXT_COMMAND",
        command,
        args,
      });
    } else {
      console.warn(
        `[Dinou] Attempted to run context command "${command}" outside of a child process.`
      );
    }
  }

  return {
    // _proxyId: proxyId,
    // 1. Proxy para eliminar cookies
    clearCookie: (name, options) => {
      sendCommand("clearCookie", [name, options]);
    },

    // 2. 👇 AÑADIDO: Proxy para establecer cookies
    // Esto enviará [name, value, options] al 'render-app-to-html.js'
    cookie: (name, value, options) => {
      // console.warn(`[Dinou] Proxying cookie set command for cookie: ${name}`);
      sendCommand("cookie", [name, value, options]);
    },

    // 3. Proxy para establecer encabezados
    setHeader: (name, value) => {
      sendCommand("setHeader", [name, value]);
    },

    // 4. Proxy para redirigir
    // MEJORA: Pasamos los argumentos tal cual al padre para que él aplique
    // la lógica de seguridad (safeRedirect) y decida el status.
    redirect: (arg1, arg2) => {
      // arg1 puede ser status o url
      // arg2 es url (si arg1 es status) o undefined
      if (arg2) {
        sendCommand("redirect", [arg1, arg2]); // [status, url]
      } else {
        sendCommand("redirect", [arg1]); // [url]
      }
    },

    // 5. Proxy para status code
    status: (code) => {
      sendCommand("status", [code]);
    },
  };
}

module.exports = {
  createResponseProxy,
};
