/**
 * esm-hmr/client.js
 * A client-side implementation of the ESM-HMR spec, for reference.
 */

function debug(...args) {
  console.log("[ESM-HMR]", ...args);
}

function reload() {
  location.reload(true);
}

let SOCKET_MESSAGE_QUEUE = [];

function _sendSocketMessage(msg) {
  socket.send(JSON.stringify(msg));
}

function sendSocketMessage(msg) {
  if (socket.readyState !== socket.OPEN) {
    SOCKET_MESSAGE_QUEUE.push(msg);
  } else {
    _sendSocketMessage(msg);
  }
}

const socketURL =
  window.HMR_WEBSOCKET_URL ||
  (location.protocol === "http:" ? "ws://" : "wss://") + location.host + "/";
const socket = new WebSocket(socketURL, "esm-hmr");

socket.addEventListener("open", () => {
  SOCKET_MESSAGE_QUEUE.forEach(_sendSocketMessage);
  SOCKET_MESSAGE_QUEUE = [];
});

const REGISTERED_MODULES = {};

class HotModuleState {
  constructor(id) {
    this.id = id;
    this.data = {};
    this.isLocked = false;
    this.isDeclined = false;
    this.isAccepted = false;
    this.acceptCallbacks = [];
    this.disposeCallbacks = [];
  }

  lock() {
    this.isLocked = true;
  }

  dispose(callback) {
    this.disposeCallbacks.push(callback);
  }

  invalidate() {
    reload();
  }

  decline() {
    this.isDeclined = true;
  }

  accept(_deps = [], callback = true) {
    if (this.isLocked) {
      return;
    }
    if (!this.isAccepted) {
      sendSocketMessage({ id: this.id, type: "hotAccept" });
      this.isAccepted = true;
    }
    if (!Array.isArray(_deps)) {
      callback = _deps || callback;
      _deps = [];
    }
    if (callback === true) {
      callback = () => {};
    }
    const deps = _deps.map((dep) => {
      const ext = dep.split(".").pop();
      if (!ext) {
        dep += ".js";
      } else if (ext !== "js") {
        dep += ".proxy.js";
      }
      return new URL(dep, `${window.location.origin}${this.id}`).pathname;
    });
    this.acceptCallbacks.push({
      deps,
      callback,
    });
  }
}

export function createHotContext(id) {
  const normId = id.startsWith("/") ? id : "/" + id;
  const existing = REGISTERED_MODULES[normId] || REGISTERED_MODULES[id];
  if (existing) {
    existing.lock();
    return existing;
  }
  const state = new HotModuleState(normId);
  REGISTERED_MODULES[normId] = state;
  REGISTERED_MODULES[id] = state;
  return state;
}

async function applyUpdate(id) {
  const normId = id.startsWith("/") ? id : "/" + id;
  const state = REGISTERED_MODULES[normId] || REGISTERED_MODULES[id];
  if (!state || state.isDeclined) {
    return false;
  }

  const acceptCallbacks = state.acceptCallbacks;
  const disposeCallbacks = state.disposeCallbacks;
  state.disposeCallbacks = [];
  state.data = {};

  disposeCallbacks.forEach((callback) => callback());

  const updateID = Date.now();

  for (const { deps, callback: acceptCallback } of acceptCallbacks) {
    const [module, ...depModules] = await Promise.all([
      import(normId + `?mtime=${updateID}`),
      ...deps.map((d) => {
        const depId = d.startsWith("/") ? d : "/" + d;
        return import(depId + `?mtime=${updateID}`);
      }),
    ]);
    acceptCallback({ module, deps: depModules });
  }

  return true;
}

socket.addEventListener("message", ({ data: _data }) => {
  if (!_data) return;

  const data = JSON.parse(_data);

  if (data.type === "reload") {
    reload();
    return;
  }

  if (
    data.type === "style-update" ||
    (data.type === "update" && data.url && (data.url.endsWith(".css") || data.url.includes("styles.css")))
  ) {
    const targetUrl = data.url ? data.url.split("?")[0] : "";
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    for (const link of links) {
      const rawHref = link.getAttribute("href");
      if (!rawHref) continue;
      const cleanHref = rawHref.split("?")[0];
      if (!targetUrl || cleanHref.endsWith(targetUrl) || targetUrl.endsWith(cleanHref) || cleanHref.includes("styles.css")) {
        const nextUrl = new URL(link.href, window.location.origin);
        nextUrl.searchParams.set("t", String(Date.now()));
        link.href = nextUrl.href;
      }
    }
    return;
  }

  if (data.type !== "update") {
    return;
  }

  applyUpdate(data.url)
    .then((ok) => {
      if (!ok) {
        reload();
      }
    })
    .catch((err) => {
      console.error(err);
      reload();
    });
});

debug("listening for file changes...");
