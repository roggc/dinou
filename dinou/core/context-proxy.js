// core/context-proxy.js

/**
 * Crea un objeto proxy que intercepta las llamadas a métodos de respuesta
 * (como clearCookie) y las envía al proceso padre (Express Handler) a través de IPC.
 * @returns {object} El objeto proxy que simula la respuesta de Express.
 */
function createResponseProxy() {
  // Función central para enviar comandos al proceso padre
  function sendCommand(command, args) {
    // fork garantiza que process.send exista en el proceso hijo
    if (typeof process.send === "function") {
      process.send({
        type: "DINOU_CONTEXT_COMMAND",
        command,
        args,
      });
    } else {
      // Esto solo debería ocurrir si el componente se ejecuta fuera del entorno Dinou
      console.warn(
        `[Dinou] Attempted to run context command "${command}" outside of a child process.`
      );
    }
  }

  return {
    // 1. Proxy para eliminar/limpiar cookies
    clearCookie: (name, options) => {
      sendCommand("clearCookie", [name, options]);
    },

    // 2. Proxy para establecer encabezados (headers)
    setHeader: (name, value) => {
      sendCommand("setHeader", [name, options]);
    },

    // 3. Proxy para redirigir (opcional, pero útil para SSR)
    // Nota: Esto solo envía el comando, el proceso padre debe detener el renderizado
    redirect: (status, url) => {
      if (typeof url === "undefined") {
        url = status;
        status = 302;
      }
      // Enviamos el comando y el estado de la respuesta
      sendCommand("status", [status]);
      sendCommand("redirect", [url]);
    },
    status: (code) => {
      sendCommand("status", [code]);
    },

    // Si necesitas más funciones de respuesta (ej. set, send, etc.), añádelas aquí.
  };
}

module.exports = {
  createResponseProxy,
};
