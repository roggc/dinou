// dinou/core/http-adapter.js
// Bidirectional adapter between Node.js HTTP (IncomingMessage/ServerResponse)
// and WHATWG Web Standards (Request/Response/ReadableStream).

const { Readable } = require("node:stream");

/**
 * Converts a Node.js IncomingMessage / Express Request into a standard Web Request.
 * @param {import('express').Request | import('http').IncomingMessage} req 
 * @returns {Request}
 */
function nodeToWebRequest(req) {
  const protocol = req.headers["x-forwarded-proto"] || (req.socket?.encrypted ? "https" : "http");
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const url = new URL(req.originalUrl || req.url || "/", `${protocol}://${host}`).href;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }

  const method = req.method || "GET";
  const isBodyAllowed = method !== "GET" && method !== "HEAD";

  let body = null;
  if (isBodyAllowed) {
    if (req.body && typeof req.body === "object" && !(req.body instanceof Buffer)) {
      const contentType = req.headers["content-type"] || "";
      if (contentType.includes("application/json")) {
        body = JSON.stringify(req.body);
      } else {
        body = JSON.stringify(req.body);
      }
    } else if (Buffer.isBuffer(req.body) || typeof req.body === "string") {
      body = req.body;
    } else if (typeof req.on === "function") {
      // If body hasn't been consumed yet, wrap Node stream into Web ReadableStream
      body = Readable.toWeb(req);
    }
  }

  const init = {
    method,
    headers,
    body: isBodyAllowed ? body : null,
  };

  // Node.js fetch / undici requires duplex: 'half' when streaming request bodies
  if (body && typeof body.getReader === "function") {
    init.duplex = "half";
  }

  return new Request(url, init);
}

/**
 * Sends a standard Web Response into a Node.js ServerResponse / Express Response.
 * @param {Response} webResponse 
 * @param {import('express').Response | import('http').ServerResponse} res 
 */
async function sendWebResponseToNode(webResponse, res) {
  res.statusCode = webResponse.status;
  if (webResponse.statusText) {
    res.statusMessage = webResponse.statusText;
  }

  // Handle cookies (multiple Set-Cookie headers)
  if (typeof webResponse.headers.getSetCookie === "function") {
    const cookies = webResponse.headers.getSetCookie();
    if (cookies && cookies.length > 0) {
      res.setHeader("Set-Cookie", cookies);
    }
  }

  for (const [key, value] of webResponse.headers.entries()) {
    if (key.toLowerCase() === "set-cookie") {
      if (typeof webResponse.headers.getSetCookie !== "function") {
        res.setHeader("Set-Cookie", value);
      }
    } else {
      res.setHeader(key, value);
    }
  }

  if (!webResponse.body) {
    return res.end();
  }

  if (typeof webResponse.body.getReader === "function") {
    const nodeStream = Readable.fromWeb(webResponse.body);
    nodeStream.on("error", (err) => {
      console.error("[http-adapter] Error in response stream:", err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      } else {
        res.destroy(err);
      }
    });
    nodeStream.pipe(res);
  } else {
    const arrayBuffer = await webResponse.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));
  }
}

module.exports = {
  nodeToWebRequest,
  sendWebResponseToNode,
};
