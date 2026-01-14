// core/context-proxy.js

/**
 * Creates a proxy object that intercepts response method calls
 * and sends them to the parent process (Express Handler) through IPC.
 * @returns {object} The proxy object that simulates the Express response.
 */
function createResponseProxy() {
  // const proxyId = Math.random().toString(36).substring(7);
  // console.log(`[Proxy] Created new proxy with ID: ${proxyId}`);
  // Central function to send commands to the parent process
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
    // 1. Proxy to delete cookies
    clearCookie: (name, options) => {
      sendCommand("clearCookie", [name, options]);
    },

    // 2. 👇 ADDED: Proxy to set cookies
    // This will send [name, value, options] to 'render-app-to-html.js'
    cookie: (name, value, options) => {
      // console.warn(`[Dinou] Proxying cookie set command for cookie: ${name}`);
      sendCommand("cookie", [name, value, options]);
    },

    // 3. Proxy to set headers
    setHeader: (name, value) => {
      sendCommand("setHeader", [name, value]);
    },

    // 4. Proxy to redirect
    // IMPROVEMENT: Pass the arguments as is to the parent so that it applies
    // the security logic (safeRedirect) and decides the status.
    redirect: (arg1, arg2) => {
      // arg1 can be status or url
      // arg2 is url (if arg1 is status) or undefined
      if (arg2) {
        sendCommand("redirect", [arg1, arg2]); // [status, url]
      } else {
        sendCommand("redirect", [arg1]); // [url]
      }
    },

    // 5. Proxy for status code
    status: (code) => {
      sendCommand("status", [code]);
    },
  };
}

module.exports = {
  createResponseProxy,
};
