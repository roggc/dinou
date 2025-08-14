const WebSocket = require("ws");
// const path = require("node:path");
// function normalizeId(id) {
//   return path.resolve(id).replace(/\\/g, "/");
// }

/**
 * @typedef {Object} Dependency
 * @property {Set<string>} dependents
 * @property {Set<string>} dependencies
 * @property {boolean} isHmrEnabled
 * @property {boolean} isHmrAccepted
 * @property {boolean} needsReplacement
 */
const map = new Map();
const set = new Set();
class EsmHmrEngine {
  constructor(options = {}) {
    this.clients = set;
    // console.log("[HMR] Initializing EsmHmrEngine");
    this.dependencyTree = map;
    // console.log("options.server", !!options.server);
    const wss = options.server
      ? new WebSocket.Server({ noServer: true })
      : new WebSocket.Server({ port: 3001 });

    if (options.server) {
      options.server.on("upgrade", (req, socket, head) => {
        if (req.headers["sec-websocket-protocol"] !== "esm-hmr") {
          return;
        }
        wss.handleUpgrade(req, socket, head, (client) => {
          wss.emit("connection", client, req);
        });
      });
    }

    wss.on("connection", (client) => {
      this.connectClient(client);
      this.registerListener(client);
    });
  }

  registerListener(client) {
    client.on("message", (data) => {
      const message = JSON.parse(data.toString());
      // console.log("[HMR] Received message:", message.type, message.id);
      if (message.type === "hotAccept") {
        const entry = this.getEntry(message.id, true);
        // console.log("entry", entry);
        // console.log("[HMR] Accepting module", message.id);
        entry.isHmrAccepted = true;
        // console.log("[HMR] Updated entry:", entry);
        // console.log("[HMR] Current dependency tree:", this.dependencyTree);
      }
    });
  }

  createEntry(sourceUrl) {
    const newEntry = {
      dependencies: new Set(),
      dependents: new Set(),
      needsReplacement: false,
      isHmrEnabled: false,
      isHmrAccepted: false,
    };
    // console.log("[HMR] Creating new entry for - in createEntry", sourceUrl);
    this.dependencyTree.set(sourceUrl, newEntry);
    return newEntry;
  }

  getEntry(sourceUrl, createIfNotFound = false) {
    // console.log("this.dependencyTree", this.dependencyTree);
    // sourceUrl = normalizeId(sourceUrl);
    // console.log("[HMR] getEntry", sourceUrl);
    const result = this.dependencyTree.get(sourceUrl);
    // console.log("[HMR] getEntry", sourceUrl, result);
    if (result) return result;
    // console.log("[HMR] Creating new entry for", sourceUrl);
    if (createIfNotFound) return this.createEntry(sourceUrl);
    return null;
  }

  setEntry(sourceUrl, imports, isHmrEnabled = false) {
    const result = this.getEntry(sourceUrl, true);
    const outdatedDependencies = new Set(result.dependencies);
    result.isHmrEnabled = isHmrEnabled;

    for (const importUrl of imports) {
      this.addRelationship(sourceUrl, importUrl);
      outdatedDependencies.delete(importUrl);
    }

    for (const importUrl of outdatedDependencies) {
      this.removeRelationship(sourceUrl, importUrl);
    }
  }

  removeRelationship(sourceUrl, importUrl) {
    const importResult = this.getEntry(importUrl);
    if (importResult) importResult.dependents.delete(sourceUrl);
    const sourceResult = this.getEntry(sourceUrl);
    if (sourceResult) sourceResult.dependencies.delete(importUrl);
  }

  addRelationship(sourceUrl, importUrl) {
    if (importUrl !== sourceUrl) {
      const importResult = this.getEntry(importUrl, true);
      importResult.dependents.add(sourceUrl);
      const sourceResult = this.getEntry(sourceUrl, true);
      sourceResult.dependencies.add(importUrl);
    }
  }

  markEntryForReplacement(entry, state) {
    entry.needsReplacement = state;
  }

  broadcastMessage(data) {
    // console.log("[HMR] Broadcasting message:", data);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // console.log("[HMR] Sending message to client:", data);
        client.send(JSON.stringify(data));
      } else {
        // console.log("[HMR] Client not open, disconnecting:", client);
        this.disconnectClient(client);
      }
    });
  }

  connectClient(client) {
    this.clients.add(client);
  }

  disconnectClient(client) {
    client.terminate();
    this.clients.delete(client);
  }

  disconnectAllClients() {
    for (const client of this.clients) {
      this.disconnectClient(client);
    }
  }
}

module.exports = {
  EsmHmrEngine,
};
