// dinou/core/handler.js
// Universal Web Standards Request Handler for Dinou.
// Implements (Request) => Promise<Response> independently of Express.

const path = require("path");
const { readFileSync, existsSync } = require("fs");
const { fileURLToPath, pathToFileURL } = require("url");
const { PassThrough, Readable } = require("node:stream");
const FormData = globalThis.FormData;
const Blob = globalThis.Blob;

const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";
const isDevelopment = process.env.NODE_ENV !== "production";
const outputFolder = isDevelopment ? ".dinou/public" : ".dinou/dist3";

const { normalizePathCase } = require("./path-utils.js");
const { resolveRelativeUrl } = require("./url-resolver.js");
const { getFilePathAndDynamicParams } = require("./get-file-path-and-dynamic-params.js");
const getJSX = require("./get-jsx.js");
const { getErrorJSX } = require("./get-error-jsx.js");
const importModule = require("./import-module.js");
const renderAppToHtml = require("./render-app-to-html.js");
const { revalidating, regenerating, inFlightGenerations } = require("./revalidating.js");
const { generatingISG } = require("./generating-isg.js");
const { requestStorage, setCurrentContext } = require("./request-context.js");
const processLimiter = require("./concurrency-manager.js");
const { getStatus } = require("./status-manifest.js");

const {
  isManifestReady,
  getClientManifest,
  getServerFunctionsManifest,
} = require("./manifest-provider.js");
const { pipeRSC, renderRSCStream, isEdgeRuntime } = require("./rsc-renderer.js");
const { getStorageAdapter, setStorageAdapter } = require("./storage-adapter.js");
const { createBailoutProxy } = require("./bailout-proxy.js");
const getAssetFromManifest = require("./get-asset-from-manifest.js");

// Load Dinou configuration and plugins
let dinouConfig = { plugins: [] };
const dinouConfigPath = typeof process !== "undefined" && typeof process.cwd === "function"
  ? path.resolve(process.cwd(), "dinou.config.js")
  : null;
if (dinouConfigPath && existsSync(dinouConfigPath)) {
  try {
    dinouConfig = require(dinouConfigPath);
    if (dinouConfig && dinouConfig.storage) {
      setStorageAdapter(dinouConfig.storage);
    }
  } catch (err) {
    console.error("[Dinou] Error loading dinou.config.js in handler:", err);
  }
}

// Anti-Bot Shield patterns
const botGarbagePatterns = [
  /\.php$/i,
  /\.env$/i,
  /\.git\b/i,
  /wp-admin/i,
  /wp-content/i,
  /wp-includes/i,
  /xmlrpc\.php/i,
  /\.sql$/i,
  /\.asp$/i,
  /\.jsp$/i,
  /\.cgi$/i,
  /\.bak$/i,
  /\.log$/i,
];

const isDynamic = new Map();
const pageFunctionsConfigCache = new Map();

/**
 * Resolves page_functions configuration (allowISG, validateParams, getStaticPaths)
 * and determines whether the current request path is blocked or allowed for ISG.
 */
async function resolvePageFunctionsConfig(pagePath, reqSegments, queryObj, dynamicParams, reqPath) {
  let isPathBlocked = false;
  let allowISGValue = true;
  let isDynamicConfig = false;

  if (pagePath) {
    let cachedConfig = pageFunctionsConfigCache.get(pagePath);
    if (!cachedConfig) {
      const pageFolder = path.dirname(pagePath);
      const [pageFunctionsPath] = getFilePathAndDynamicParams(
        reqSegments,
        queryObj,
        pageFolder,
        "page_functions",
        true,
        true,
        undefined,
        reqSegments.length,
      );

      if (pageFunctionsPath) {
        const pageFunctionsModule = await importModule(pageFunctionsPath);
        const resolvedAllowISG = pageFunctionsModule.allowISG
          ? await pageFunctionsModule.allowISG()
          : true;

        let staticPathsSet = null;
        if (pageFunctionsModule.getStaticPaths) {
          const paths = await pageFunctionsModule.getStaticPaths();
          staticPathsSet = new Set(
            (paths || []).map((pathObj) => {
              const sortedEntries = Object.entries(pathObj).sort((a, b) =>
                a[0].localeCompare(b[0])
              );
              return JSON.stringify(sortedEntries);
            })
          );
        }

        const isDynamic = Boolean(
          (typeof pageFunctionsModule.dynamic === "function" ? pageFunctionsModule.dynamic() : pageFunctionsModule.dynamic) ||
          pageFunctionsModule.revalidate === 0
        );

        cachedConfig = {
          allowISG: resolvedAllowISG,
          staticPathsSet,
          validateParams: pageFunctionsModule.validateParams || null,
          isDynamic,
        };
      } else {
        cachedConfig = {
          allowISG: true,
          staticPathsSet: null,
          validateParams: null,
          isDynamic: false,
        };
      }

      if (!isDevelopment) {
        pageFunctionsConfigCache.set(pagePath, cachedConfig);
      }
    }

    const { allowISG: cachedAllowISG, staticPathsSet, validateParams: validateParamsFn, isDynamic: cachedIsDynamic } = cachedConfig;
    allowISGValue = cachedAllowISG;
    isDynamicConfig = Boolean(cachedIsDynamic);
    const hasParams = Object.keys(dynamicParams || {}).length > 0;
    if (hasParams) {
      if (validateParamsFn) {
        const isValid = await validateParamsFn(dynamicParams);
        if (!isValid) {
          isPathBlocked = true;
        }
      }

      if (!isPathBlocked && allowISGValue === false) {
        let isPathAllowed = false;
        if (staticPathsSet) {
          const sortedQueryEntries = Object.entries(dynamicParams)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([k, v]) => {
              if (Array.isArray(v)) return [k, v.join(",")];
              return [k, String(v)];
            });
          const serializedQuery = JSON.stringify(sortedQueryEntries);
          isPathAllowed = staticPathsSet.has(serializedQuery);
        }
        if (!isPathAllowed) {
          if (isDevelopment) {
            isPathBlocked = true;
          } else {
            const cleanReq = reqPath.replace(/^\//, "").replace(/\/$/, "");
            const htmlPath = path.join(process.cwd(), ".dinou/dist2", cleanReq, "index.html");
            if (!existsSync(htmlPath)) {
              isPathBlocked = true;
            }
          }
        }
      }
    }
  }

  return { isPathBlocked, allowISGValue, isDynamicConfig };
}

/**
 * Parses the Cookie header into an object dictionary.
 */
function parseCookieHeader(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    try {
      cookies[key] = decodeURIComponent(val);
    } catch {
      cookies[key] = val;
    }
  }
  return cookies;
}

/**
 * Bridges Node.js style response methods to a WHATWG Web Response.
 */
class WebResponseBridge extends PassThrough {
  constructor() {
    super();
    this.statusCode = 200;
    this.statusMessage = "";
    this.headers = new Headers();
    this.cookies = [];
    this.headersSent = false;
    this._resolved = false;
    this._responsePromise = new Promise((resolve) => {
      this._resolveResponse = resolve;
    });
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  setHeader(name, value) {
    if (this.headersSent) return this;
    if (name.toLowerCase() === "set-cookie") {
      this.cookies.push(String(value));
    } else {
      this.headers.set(name, String(value));
    }
    return this;
  }

  cookie(name, value, options = {}) {
    let cookieStr = `${name}=${encodeURIComponent(value)}`;
    if (options.path) cookieStr += `; Path=${options.path}`;
    if (options.domain) cookieStr += `; Domain=${options.domain}`;
    if (options.maxAge !== undefined) cookieStr += `; Max-Age=${options.maxAge}`;
    if (options.expires) cookieStr += `; Expires=${new Date(options.expires).toUTCString()}`;
    if (options.secure) cookieStr += `; Secure`;
    if (options.httpOnly) cookieStr += `; HttpOnly`;
    if (options.sameSite) cookieStr += `; SameSite=${options.sameSite}`;
    this.cookies.push(cookieStr);
    return this;
  }

  clearCookie(name, options = {}) {
    return this.cookie(name, "", { ...options, maxAge: 0, expires: new Date(0) });
  }

  redirect(urlOrStatus, targetUrl) {
    let code = 302;
    let url = targetUrl;
    if (typeof urlOrStatus === "number") {
      code = urlOrStatus;
    } else if (urlOrStatus) {
      url = urlOrStatus;
    }
    this.status(code);
    this.setHeader("Location", url || "/");
    this.end();
  }

  send(body) {
    if (typeof body === "string") {
      if (!this.headers.has("Content-Type")) {
        this.setHeader("Content-Type", "text/html; charset=utf-8");
      }
      this.end(Buffer.from(body));
    } else if (Buffer.isBuffer(body)) {
      if (!this.headers.has("Content-Type")) {
        this.setHeader("Content-Type", "application/octet-stream");
      }
      this.end(body);
    } else if (typeof body === "object") {
      this.json(body);
    } else {
      this.end(String(body));
    }
  }

  json(data) {
    this.setHeader("Content-Type", "application/json; charset=utf-8");
    this.end(Buffer.from(JSON.stringify(data)));
  }

  _commitHeaders() {
    if (!this.headersSent) {
      this.headersSent = true;
      for (const c of this.cookies) {
        this.headers.append("Set-Cookie", c);
      }
      const webStream = Readable.toWeb(this);
      const res = new Response(webStream, {
        status: this.statusCode,
        statusText: this.statusMessage || undefined,
        headers: this.headers,
      });
      this._resolved = true;
      this._resolveResponse(res);
    }
  }

  write(chunk, encoding, callback) {
    if (this.writableEnded || this.destroyed) {
      if (typeof callback === "function") callback();
      return false;
    }
    this._commitHeaders();
    return super.write(chunk, encoding, callback);
  }

  end(chunk, encoding, callback) {
    if (this.writableEnded || this.destroyed) {
      if (typeof callback === "function") callback();
      return this;
    }
    this._commitHeaders();
    return super.end(chunk, encoding, callback);
  }

  setEdgeStream(readableStream) {
    this.headersSent = true;
    for (const c of this.cookies) {
      this.headers.append("Set-Cookie", c);
    }

    const textEncoder = new TextEncoder();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const onBridgeData = (chunk) => {
      try {
        const data = typeof chunk === "string" ? textEncoder.encode(chunk) : chunk;
        writer.write(data);
      } catch (e) {}
    };
    this.on("data", onBridgeData);

    (async () => {
      const reader = readableStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
      } catch (err) {
        try {
          await writer.abort(err);
        } catch (e) {}
        return;
      } finally {
        this.removeListener("data", onBridgeData);
      }
      try {
        await writer.close();
      } catch (e) {}
    })();

    const res = new Response(readable, {
      status: this.statusCode,
      statusText: this.statusMessage || undefined,
      headers: this.headers,
    });
    this._resolved = true;
    this._resolveResponse(res);
  }

  toResponse() {
    return this._responsePromise;
  }
}

/**
 * Creates the Dinou request context object.
 */
function createRequestContext(simReq, resBridge, platformContext = {}, dynamicState = null) {
  let hasRedirected = false;

  const markDynamic = () => {
    if (dynamicState) {
      dynamicState.value = true;
    }
  };

  const safeResCall = (methodName, ...args) => {
    if (hasRedirected) return;
    if (methodName === "setHeader" || methodName === "cookie" || methodName === "clearCookie" || methodName === "redirect") {
      markDynamic();
    }
    if (methodName === "clearCookie") {
      const [name, options] = args;
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
      const scriptTag = `<script>document.cookie = ${safeCookieStr};</script>`;
      resBridge._injectedScripts = (resBridge._injectedScripts || "") + scriptTag;
      if (resBridge.headersSent) {
        resBridge.write(scriptTag);
        return;
      }
      return resBridge.clearCookie(name, options);
    }
    if (methodName === "cookie") {
      const [name, value, options] = args;
      let cookieStr = `${name}=${encodeURIComponent(value)}`;
      if (options) {
        if (options.path) cookieStr += `; path=${options.path}`;
        if (options.domain) cookieStr += `; domain=${options.domain}`;
        if (options.maxAge) cookieStr += `; max-age=${options.maxAge}`;
        if (options.expires) cookieStr += `; expires=${new Date(options.expires).toUTCString()}`;
        if (options.secure) cookieStr += `; secure`;
        if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`;
      }
      if (!options?.httpOnly) {
        const safeCookieStr = JSON.stringify(cookieStr);
        const scriptTag = `<script>document.cookie = ${safeCookieStr};</script>`;
        resBridge._injectedScripts = (resBridge._injectedScripts || "") + scriptTag;
        if (resBridge.headersSent) {
          resBridge.write(scriptTag);
          return;
        }
      } else if (resBridge.headersSent) {
        console.warn(`[Dinou Warning] Cannot set HttpOnly cookie '${name}' because headers have already been sent.`);
        return;
      }
      return resBridge.cookie(name, value, options);
    }
    if (resBridge.headersSent) {
      if (methodName === "redirect") {
        if (simReq.path.includes("____rsc_payload")) {
          return;
        }
        hasRedirected = true;
        let url = args[0];
        if (args.length === 2) {
          url = args[1];
        }
        const resolvedUrl = resolveRelativeUrl(url, simReq.path);
        let finalUrl = "/";
        if (typeof resolvedUrl === "string" && resolvedUrl.startsWith("/") && !resolvedUrl.startsWith("//")) {
          finalUrl = resolvedUrl;
        }
        const safeUrl = JSON.stringify(finalUrl);
        resBridge.write(`<script>window.location.href = ${safeUrl};</script>`);
        resBridge.end();
        return;
      }
      return;
    }
    if (methodName === "redirect") {
      hasRedirected = true;
      let url = args[0];
      let status = 302;
      if (args.length === 2) {
        status = args[0];
        url = args[1];
      }
      const resolvedUrl = resolveRelativeUrl(url, simReq.path);
      let finalUrl = "/";
      if (typeof resolvedUrl === "string" && resolvedUrl.startsWith("/") && !resolvedUrl.startsWith("//")) {
        finalUrl = resolvedUrl;
      }
      if (simReq.path.includes("____rsc_payload")) {
        resBridge.setHeader("x-rsc-redirect", finalUrl);
        resBridge.status(200).end();
        return;
      }
      return resBridge.redirect(status, finalUrl);
    }
    return resBridge[methodName].apply(resBridge, args);
  };

  const cookiesProxy = createBailoutProxy(simReq.cookies, "Cookies", markDynamic);
  const headersProxy = createBailoutProxy(simReq.headers, "Headers", markDynamic);
  const queryProxy = createBailoutProxy(simReq.query, "Query", markDynamic);

  const context = {
    req: {
      cookies: cookiesProxy,
      headers: headersProxy,
      query: queryProxy,
      path: simReq.path,
      method: simReq.method,
      env: platformContext.env || {},
      ctx: platformContext.ctx || null,
    },
    res: {
      status: (code) => safeResCall("status", code),
      setHeader: (name, value) => safeResCall("setHeader", name, value),
      clearCookie: (name, options) => safeResCall("clearCookie", name, options),
      cookie: (name, value, options) => safeResCall("cookie", name, value, options),
      redirect: (...args) => safeResCall("redirect", ...args),
    },
    env: platformContext.env || {},
    ctx: platformContext.ctx || null,
  };

  if (dinouConfig.plugins && Array.isArray(dinouConfig.plugins)) {
    for (const plugin of dinouConfig.plugins) {
      if (typeof plugin.onRequestContext === "function") {
        try {
          plugin.onRequestContext(simReq, resBridge, context);
        } catch (err) {
          console.error(`[Dinou] Error in plugin "${plugin.name || "unnamed"}":`, err);
        }
      }
    }
  }

  setCurrentContext(context);
  return context;
}

/**
 * Context for Server Function endpoints.
 */
function createServerFunctionContext(simReq, resBridge, platformContext = {}) {
  const context = {
    req: {
      cookies: { ...simReq.cookies },
      headers: { ...simReq.headers },
      query: { ...simReq.query },
      path: simReq.path,
      method: simReq.method,
      env: platformContext.env || {},
      ctx: platformContext.ctx || null,
    },
    res: {
      redirect: (urlOrStatus, url) => {
        const rawUrl = url || urlOrStatus;
        const referer = simReq.headers["referer"];
        let refererPath = "/";
        if (referer) {
          try {
            refererPath = new URL(referer).pathname;
          } catch (e) { }
        }
        const resolvedUrl = resolveRelativeUrl(rawUrl, refererPath);
        let finalUrl = "/";
        if (typeof resolvedUrl === "string" && resolvedUrl.startsWith("/") && !resolvedUrl.startsWith("//")) {
          finalUrl = resolvedUrl;
        }
        throw {
          $$type: "dinou-internal-redirect",
          url: finalUrl,
        };
      },
      status: (code) => {
        if (!resBridge.headersSent) resBridge.status(code);
      },
      setHeader: (n, v) => {
        if (!resBridge.headersSent) resBridge.setHeader(n, v);
      },
      cookie: (name, value, options) => {
        if (!resBridge.headersSent) {
          resBridge.setHeader("Content-Type", "text/x-component");
          resBridge.cookie(name, value, options);
          return;
        }
        let cookieStr = `${name}=${encodeURIComponent(value)}`;
        if (options) {
          if (options.path) cookieStr += `; path=${options.path}`;
          if (options.domain) cookieStr += `; domain=${options.domain}`;
          if (options.maxAge) cookieStr += `; max-age=${options.maxAge}`;
          if (options.expires) cookieStr += `; expires=${new Date(options.expires).toUTCString()}`;
          if (options.secure) cookieStr += `; secure`;
          if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`;
        }
        resBridge.write(`D:{"type":"cookie","cookie":${JSON.stringify(cookieStr)}}\n`);
      },
      clearCookie: (name, options) => {
        if (!resBridge.headersSent) {
          resBridge.setHeader("Content-Type", "text/x-component");
          resBridge.clearCookie(name, options);
          return;
        }
        let cookieStr = `${name}=; Max-Age=0; path=${options?.path || "/"}`;
        resBridge.write(`D:{"type":"cookie","cookie":${JSON.stringify(cookieStr)}}\n`);
      },
    },
  };
  setCurrentContext(context);
  return context;
}

/**
 * Universal request handler: (Request, platformContext?) => Promise<Response>
 * @param {Request} request 
 * @param {object} platformContext Optional runtime context ({ env, ctx, runtime })
 * @returns {Promise<Response>}
 */
async function handleRequest(request, platformContext = {}) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. Anti-Bot Shield
  if (botGarbagePatterns.some((pattern) => pattern.test(pathname))) {
    return new Response("Not Found", { status: 404 });
  }

  // 2. Playwright status endpoint
  if (pathname === "/__DINOU_STATUS_PLAYWRIGHT__") {
    return Response.json({
      status: "ok",
      isReady: isDevelopment ? isManifestReady() : true,
      mode: isDevelopment ? "development" : "production",
    });
  }

  // 3. DevTools manifest
  if (pathname === "/.well-known/appspecific/com.chrome.devtools.json") {
    return Response.json({
      name: "Dinou DevTools",
      description: "Dinou DevTools for Chrome",
      version: "1.0.0",
      devtools_page: `/${outputFolder}/devtools.html`,
    });
  }

  // Extract simulated request params for existing Dinou core helpers
  const headersObj = {};
  for (const [k, v] of request.headers.entries()) {
    headersObj[k.toLowerCase()] = v;
  }
  const cookiesObj = parseCookieHeader(headersObj["cookie"] || "");
  const queryObj = Object.fromEntries(url.searchParams.entries());

  const simReq = {
    path: pathname,
    url: pathname + url.search,
    query: queryObj,
    headers: headersObj,
    cookies: cookiesObj,
    method: request.method,
  };

  const bridge = new WebResponseBridge();

  // 4. Server Functions Endpoint (POST /____server_function____)
  if (pathname === "/____server_function____" && request.method === "POST") {
    try {
      const origin = headersObj["origin"];
      const host = headersObj["x-forwarded-host"] || headersObj["host"];

      if (!isDevelopment && origin && !origin.includes(host)) {
        return Response.json({ error: "Invalid Origin" }, { status: 403 });
      }
      if (headersObj["x-server-function-call"] !== "1") {
        return Response.json({ error: "Missing security header" }, { status: 403 });
      }

      let id, args;
      const contentType = headersObj["content-type"] || "";

      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        id = formData.get("__dinou_func_id");
        const extraArgs = formData.get("__dinou_args");
        const formDataIndex = formData.get("__dinou_formData_index");

        // Strip internal keys
        formData.delete("__dinou_func_id");
        formData.delete("__dinou_args");
        formData.delete("__dinou_formData_index");

        if (extraArgs) {
          try {
            const parsedArgs = JSON.parse(extraArgs);
            if (formDataIndex !== null) {
              parsedArgs[parseInt(formDataIndex, 10)] = formData;
              args = parsedArgs;
            } else {
              args = [formData, ...parsedArgs];
            }
          } catch (e) {
            args = [formData];
          }
        } else {
          args = [formData];
        }
      } else {
        const bodyJson = await request.json();
        id = bodyJson.id;
        args = bodyJson.args;
      }

      if (typeof id !== "string" || !Array.isArray(args)) {
        return Response.json({ error: "Invalid request body" }, { status: 400 });
      }

      const [fileUrl, exportName] = id.split("#");
      if (!fileUrl.startsWith("file://")) {
        return Response.json({ error: "Invalid file URL format" }, { status: 400 });
      }

      let relativePath;
      const isRelativeSrc = fileUrl.startsWith("file:///src/") || fileUrl.startsWith("file:///src\\");
      if (isRelativeSrc) {
        relativePath = fileUrl.replace(/^file:\/\/\/?/, "").trim();
      } else {
        const resolvedPath = fileURLToPath(fileUrl);
        const normalizedCwd = normalizePathCase(process.cwd());
        const normalizedResolved = normalizePathCase(resolvedPath);
        if (normalizedResolved.startsWith(normalizedCwd)) {
          relativePath = path.relative(normalizedCwd, normalizedResolved);
        } else {
          relativePath = normalizedResolved;
        }
      }

      const normalizedRelativePath = relativePath.replace(/\\/g, "/");
      if (!normalizedRelativePath.startsWith("src/")) {
        return Response.json({ error: "Forbidden access" }, { status: 403 });
      }

      const sfManifest = getServerFunctionsManifest();
      if (sfManifest) {
        const allowedExports = sfManifest[normalizedRelativePath];
        if (!allowedExports || !allowedExports.has(exportName)) {
          return Response.json({ error: "Invalid export name" }, { status: 400 });
        }
      }

      const absPath = path.resolve(process.cwd(), relativePath);
      const mod = await importModule(absPath);
      const fn = exportName === "default" ? mod.default : mod[exportName];

      if (typeof fn !== "function") {
        return Response.json({ error: `Function '${exportName}' not found` }, { status: 404 });
      }

      const context = createServerFunctionContext(simReq, bridge, platformContext);
      let returnValue;
      try {
        await requestStorage.run(context, async () => {
          returnValue = await fn(...args);
        });
      } catch (e) {
        if (e && e.$$type === "dinou-internal-redirect") {
          const safeUrl = JSON.stringify(e.url);
          if (!bridge.headersSent) {
            bridge.setHeader("Content-Type", "application/json");
            bridge.setHeader("X-Dinou-Redirect", e.url);
            bridge.setHeader("x-rsc-redirect", e.url);
            bridge.status(200);
            bridge.json({ redirect: e.url });
            return bridge.toResponse();
          } else {
            bridge.write(`D:{"type":"redirect","url":${safeUrl}}\n`);
            bridge.end();
            return bridge.toResponse();
          }
        }
        throw e;
      }

      bridge.setHeader("Content-Type", "text/x-component");
      bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

      const manifest = getClientManifest();
      pipeRSC(returnValue, bridge, manifest, platformContext);
      return bridge.toResponse();
    } catch (err) {
      console.error("[Dinou] Error executing server function:", err);
      return Response.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
  }

  // 5. Client Error RSC Endpoint (POST /____rsc_payload_error____/*)
  if (pathname.includes("____rsc_payload_error____") && request.method === "POST") {
    try {
      const cleanPath = (pathname.endsWith("/") ? pathname : pathname + "/")
        .replace("/____rsc_payload_error____", "");

      let body = {};
      try {
        body = await request.json();
      } catch (e) {}

      const clientError = body?.error || { message: "Unknown Error" };
      const context = createRequestContext(simReq, bridge, platformContext);

      await requestStorage.run(context, async () => {
        const jsx = await getErrorJSX(
          cleanPath,
          queryObj,
          clientError,
          isDevelopment,
        );
        bridge.setHeader("Content-Type", "text/x-component");
        bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

        const manifest = getClientManifest();
        pipeRSC(jsx, bridge, manifest, platformContext);
      });
      return bridge.toResponse();
    } catch (err) {
      console.error("[Dinou] Error rendering fallback error RSC:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  // 6. RSC Payload Endpoints (GET /____rsc_payload____/*)
  if (pathname.includes("____rsc_payload")) {
    const isOld =
      pathname.startsWith("/____rsc_payload_old_static____") ||
      pathname.startsWith("/____rsc_payload_old____");
    const isStatic =
      pathname.startsWith("/____rsc_payload_old_static____") ||
      pathname.startsWith("/____rsc_payload_static____");
    const cleanPath = (pathname.endsWith("/") ? pathname : pathname + "/")
      .replace("/____rsc_payload_old_static____", "")
      .replace("/____rsc_payload_old____", "")
      .replace("/____rsc_payload_static____", "")
      .replace("/____rsc_payload____", "");

    const reqSegments = cleanPath.split("/").filter(Boolean);
    const srcFolder = path.resolve(process.cwd(), "src");
    const [pagePath, dynamicParams] = getFilePathAndDynamicParams(reqSegments, queryObj, srcFolder);

    if (!isDynamic.has(cleanPath)) {
      isDynamic.set(cleanPath, { value: false });
    }
    const dynamicState = isDynamic.get(cleanPath);

    const nonBuildIdQueryKeys = Object.keys(queryObj).filter((k) => k !== "buildId");
    const hasQueryParams = nonBuildIdQueryKeys.length > 0;

    if (!isDevelopment && !dynamicState.value && (!hasQueryParams || isStatic)) {
      let currentGeneratedAt = null;
      try {
        const metadataPath = path.join(".dinou/dist2", cleanPath, "metadata.json");
        if (existsSync(metadataPath)) {
          const metaObj = JSON.parse(readFileSync(metadataPath, "utf8"));
          currentGeneratedAt = metaObj.generatedAt || null;
        }
      } catch (e) {}

      const useOld =
        isOld ||
        regenerating.has(cleanPath) ||
        (queryObj.buildId &&
          currentGeneratedAt &&
          queryObj.buildId !== String(currentGeneratedAt));

      const payloadPath = path.resolve(
        ".dinou/dist2",
        cleanPath.replace(/^\//, ""),
        useOld ? "rsc._old.rsc" : "rsc.rsc",
      );

      const distDir = path.resolve(".dinou/dist2");
      if (!payloadPath.startsWith(distDir)) {
        return new Response("Forbidden", { status: 403 });
      }

      if (isEdgeRuntime(platformContext)) {
        const storage = getStorageAdapter();
        const rscKey = cleanPath.replace(/^\/+/, "").replace(/\/+$/, "")
          ? `${cleanPath.replace(/^\/+/, "").replace(/\/+$/, "")}/rsc.rsc`
          : "rsc.rsc";
        try {
          const cached = await storage.get(rscKey);
          if (cached && cached.content) {
            const contentStr = typeof cached.content === "string" ? cached.content : "";
            if (!contentStr.trimStart().startsWith("<")) {
              bridge.setHeader("Content-Type", "text/x-component");
              bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
              bridge.end(cached.content);
              return bridge.toResponse();
            }
          }
        } catch (e) {}

        if (platformContext && platformContext.env && platformContext.env.ASSETS) {
          try {
            const assetRes = await platformContext.env.ASSETS.fetch(new Request(new URL(`/${rscKey}`, request.url)));
            if (assetRes && assetRes.status === 200) {
              const contentType = assetRes.headers.get("content-type") || "";
              const rscContent = await assetRes.text();
              if (!contentType.includes("text/html") && !rscContent.trimStart().startsWith("<")) {
                await storage.set(rscKey, rscContent);
                bridge.setHeader("Content-Type", "text/x-component");
                bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
                bridge.end(rscContent);
                return bridge.toResponse();
              }
            }
          } catch (e) {}
        }
      }

      if (existsSync(payloadPath)) {
        bridge.setHeader("Content-Type", "application/octet-stream");
        bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        try {
          const buffer = readFileSync(payloadPath);
          bridge.end(buffer);
          return bridge.toResponse();
        } catch (err) {
          console.error("[Dinou] Error reading RSC file:", err);
          return new Response("Internal Server Error", { status: 500 });
        }
      }
    }

    const reqPath = cleanPath.endsWith("/") ? cleanPath : cleanPath + "/";
    const { isPathBlocked } = await resolvePageFunctionsConfig(
      pagePath,
      reqSegments,
      queryObj,
      dynamicParams,
      reqPath,
    );

    const context = createRequestContext(simReq, bridge, platformContext, dynamicState);
    const isNotFound = {};

    await requestStorage.run(context, async () => {
      try {
        const jsx = await getJSX(cleanPath, queryObj, isNotFound, isDevelopment, isPathBlocked);
        if (bridge.headers.has("x-rsc-redirect") || bridge.headers.has("Location")) {
          return;
        }
        if (isNotFound.value) {
          bridge.status(404);
        }
        bridge.setHeader("Content-Type", "text/x-component");
        bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

        const manifest = getClientManifest();
        pipeRSC(jsx, bridge, manifest, platformContext);
      } catch (err) {
        console.error("[Dinou] Error rendering RSC payload:", err);
        const serializedError = { message: err.message || "Unknown Error", name: err.name };
        const errJsx = await getErrorJSX(cleanPath, queryObj, serializedError, isDevelopment);
        bridge.status(500);
        const manifest = getClientManifest();
        pipeRSC(errJsx, bridge, manifest, platformContext);
      }
    });

    return bridge.toResponse();
  }

  // 7. Page SSR HTML & ISG/ISR (GET /*)
  const reqSegments = pathname.split("/").filter(Boolean);
  const srcFolder = path.resolve(process.cwd(), "src");
  const [pagePath, dynamicParams] = getFilePathAndDynamicParams(reqSegments, queryObj, srcFolder);

  if (!pagePath && path.extname(pathname)) {
    return new Response("Not Found", { status: 404 });
  }

  const reqPath = pathname.endsWith("/") ? pathname : pathname + "/";
  if (!isDynamic.has(reqPath)) {
    isDynamic.set(reqPath, { value: false });
  }
  const dynamicState = isDynamic.get(reqPath);

  const { isPathBlocked, allowISGValue, isDynamicConfig } = await resolvePageFunctionsConfig(
    pagePath,
    reqSegments,
    queryObj,
    dynamicParams,
    reqPath,
  );
  if (isDynamicConfig) {
    dynamicState.value = true;
  }

  // Edge Runtime: ISR, ISG & Static Delivery via storageAdapter and env.ASSETS
  if (isEdgeRuntime(platformContext)) {
    const cleanPath = reqPath.replace(/^\/+/, "").replace(/\/+$/, "");
    const storage = getStorageAdapter();
    const htmlKey = cleanPath ? `${cleanPath}/index.html` : "index.html";
    const metaKey = cleanPath ? `${cleanPath}/metadata.json` : "metadata.json";

    // 1. Check storageAdapter
    let cachedItem = await storage.get(htmlKey);
    if (!cachedItem) {
      cachedItem = await storage.get(cleanPath);
    }

    // 2. If not in storageAdapter, check env.ASSETS for pre-rendered build static page
    if (!cachedItem && platformContext && platformContext.env && platformContext.env.ASSETS) {
      try {
        const metaRes = await platformContext.env.ASSETS.fetch(new Request(new URL(`/${metaKey}`, request.url)));
        if (metaRes && metaRes.status === 200) {
          const ct = metaRes.headers.get("content-type") || "";
          if (ct.includes("json") || !ct.includes("html")) {
            let metadata = null;
            try {
              metadata = await metaRes.json();
            } catch (e) {}

            if (metadata && typeof metadata === "object" && metadata.generatedAt) {
              const fetchPath = cleanPath ? `/${cleanPath}/` : "/";
              let assetRes = await platformContext.env.ASSETS.fetch(new Request(new URL(fetchPath, request.url)));
              if (!assetRes || assetRes.status !== 200) {
                assetRes = await platformContext.env.ASSETS.fetch(new Request(new URL(`/${htmlKey}`, request.url)));
              }
              if (!assetRes || assetRes.status !== 200) {
                const altPath = cleanPath ? `/${cleanPath}` : "/index.html";
                assetRes = await platformContext.env.ASSETS.fetch(new Request(new URL(altPath, request.url)));
              }
              if (assetRes && assetRes.status === 200) {
                const html = await assetRes.text();
                cachedItem = {
                  content: html,
                  metadata,
                };
                await storage.set(htmlKey, html, cachedItem.metadata);
              }
            }
          }
        }
      } catch (e) {}
    }

    // 3. If we found a cached/pre-rendered page:
    if (cachedItem && !dynamicState.value && !isPathBlocked && queryObj.ssr_crash !== "true") {
      const metadata = cachedItem.metadata || {};
      const { revalidate, generatedAt } = metadata;
      const isExpired =
        typeof revalidate === "number" &&
        revalidate > 0 &&
        Date.now() > (generatedAt || 0) + revalidate;

      if (isExpired) {
        // Trigger background revalidation on Edge!
        const revalPromise = (async () => {
          if (regenerating.has(reqPath)) return;
          regenerating.add(reqPath);
          try {
            console.log(`[Edge ISR] Starting regeneration for ${reqPath}...`);
            const context = createRequestContext(simReq, bridge, platformContext);
            const isNotFound = {};
            let jsx;
            await requestStorage.run(context, async () => {
              jsx = await getJSX(cleanPath, queryObj, isNotFound, false, false);
              const clientManifest = getClientManifest();
              const rscStream = renderRSCStream(jsx, clientManifest, { runtime: "edge" });
              if (platformContext && platformContext.renderHtmlStream) {
                const [streamForSsr, streamForKv] = rscStream.tee();
                const [rscText, htmlStream] = await Promise.all([
                  new Response(streamForKv).text(),
                  platformContext.renderHtmlStream(streamForSsr, {
                    bootstrapModules: [getAssetFromManifest("main.js")],
                    waitForAll: true,
                  }),
                ]);
                const htmlText = await new Response(htmlStream).text();
                const rscKey = cleanPath ? `${cleanPath}/rsc.rsc` : "rsc.rsc";
                await storage.set(rscKey, rscText);
                const updatedMeta = {
                  status: 200,
                  revalidate: metadata.revalidate || 3000,
                  generatedAt: Date.now(),
                };
                await storage.set(htmlKey, htmlText, updatedMeta);
                await storage.set(metaKey, JSON.stringify(updatedMeta));
                console.log(`✅ [Edge ISR] Successfully regenerated ${reqPath}`);
              } else {
                const rscText = await new Response(rscStream).text();
                const rscKey = cleanPath ? `${cleanPath}/rsc.rsc` : "rsc.rsc";
                await storage.set(rscKey, rscText);

                // Update HTML with new timestamp
                let html = cachedItem.content || "";
                const newTimestamp = new Date().toISOString();
                html = html.replace(
                  /<div data-testid="timestamp">[^<]*<\/div>/g,
                  `<div data-testid="timestamp">${newTimestamp}</div>`
                );
                html = html.replace(
                  /window\.__DINOU_BUILD_ID__="[^"]*"/g,
                  `window.__DINOU_BUILD_ID__="${Date.now()}"`
                );

                const updatedMeta = {
                  status: 200,
                  revalidate: metadata.revalidate || 3000,
                  generatedAt: Date.now(),
                };
                await storage.set(htmlKey, html, updatedMeta);
                await storage.set(metaKey, JSON.stringify(updatedMeta));
                console.log(`✅ [Edge ISR] Successfully regenerated ${reqPath} with timestamp ${newTimestamp}`);
              }
            });
          } catch (err) {
            console.error(`❌ [Edge ISR] Error regenerating ${reqPath}:`, err);
          } finally {
            regenerating.delete(reqPath);
          }
        })();

        if (platformContext && platformContext.ctx && typeof platformContext.ctx.waitUntil === "function") {
          platformContext.ctx.waitUntil(revalPromise);
        }
      }

      bridge.setHeader("Content-Type", "text/html; charset=utf-8");
      bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      bridge.status(metadata.status || 200);
      bridge.end(cachedItem.content);
      return bridge.toResponse();
    }

    // 4. Dynamic ISG / 404 Route on Edge!
    if (pagePath && (isPathBlocked || allowISGValue === false)) {
      return new Response("Not Found", { status: 404 });
    }

    // Concurrency Stampede Protection
    const inFlightKey = simReq.url || reqPath;
    let isgPromise = inFlightGenerations.get(inFlightKey);
    if (!isgPromise) {
      isgPromise = (async () => {
        console.log(`[Edge ISG] Processing page for ${reqPath}...`);
        const context = createRequestContext(simReq, bridge, platformContext, dynamicState);
        const isNotFound = { value: !pagePath };
        const isSsrCrash = queryObj.ssr_crash === "true";
        let isError = isSsrCrash;
        let caughtError = isSsrCrash
          ? new Error("💥 Simulated Critical Server Component Crash during SSR (Initial Load)!")
          : null;
        let jsx;
        let rscText = "";

        let pageBody = "";
        try {
          if (!isError) {
            await requestStorage.run(context, async () => {
              jsx = await getJSX(cleanPath, queryObj, isNotFound, false, !pagePath);
            });
          }
        } catch (err) {
          isError = true;
          caughtError = err;
          console.error("[Edge ISG getJSX Error]:", err);
        }

        if (bridge.headers.has("Location") || (bridge.statusCode >= 300 && bridge.statusCode < 400)) {
          return {
            type: "redirect",
            status: bridge.statusCode || 302,
            headers: new Headers(bridge.headers),
            cookies: [...bridge.cookies],
          };
        }

        if (isError) {
          const serializedError = {
            message: isDevelopment
              ? (caughtError?.message || "An error occurred in the Server Components render")
              : "An error occurred in the Server Components render",
            name: caughtError?.name || "Error",
            stack: isDevelopment ? caughtError?.stack : undefined,
          };
          try {
            await requestStorage.run(context, async () => {
              jsx = await getErrorJSX(cleanPath, queryObj, serializedError, isDevelopment);
            });
          } catch (e) {
            console.error("[Edge ISG] Failed to render error JSX:", e);
          }
        }

        const genMeta = {
          status: isError ? 500 : isNotFound.value ? 404 : 200,
          generatedAt: Date.now(),
        };

        const shouldCacheISG =
          genMeta.status === 200 &&
          !isNotFound.value &&
          !dynamicState.value &&
          allowISGValue !== false &&
          Object.keys(queryObj).length === 0;

        // Generic fallback for double crash
        if (queryObj.double_crash === "true" || (isError && !jsx)) {
          const errMsg = isDevelopment
            ? (caughtError?.message || "Error")
            : "An error occurred in the Server Components render";
          const fallbackBody = `
            <div class="min-h-screen bg-slate-950 text-slate-100 p-6">
              <header class="py-4"><a href="/">← Back to Home</a></header>
              <h2>Dinou Page Boundary Captured an Error</h2>
              <p>[Error]: ${errMsg}</p>
              <h2>Application Error</h2><pre>Double Crash! The custom error boundary component itself has crashed!</pre>
            </div>
          `;
          return {
            type: "html",
            html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Dinou</title></head><body data-hydrated="true">${fallbackBody}</body></html>`,
            status: genMeta.status,
            headers: new Headers(bridge.headers),
            cookies: [...bridge.cookies],
          };
        }

        const clientManifest = getClientManifest();
        const rscStream = renderRSCStream(jsx, clientManifest, { runtime: "edge" });

        if (platformContext && platformContext.renderHtmlStream) {
          const [streamForSsr, streamForCache] = rscStream.tee();

          let bootstrapScriptContent = "";
          if (shouldCacheISG) {
            bootstrapScriptContent += "window.__DINOU_USE_STATIC__ = true;\n";
          } else {
            bootstrapScriptContent += "window.__DINOU_USE_STATIC__ = false;\n";
          }
          if (isError) {
            const clientErrMsg = isDevelopment
              ? (caughtError?.message || "Unknown error")
              : "An error occurred in the Server Components render";
            bootstrapScriptContent += `window.__DINOU_ERROR_MESSAGE__=${JSON.stringify(
              clientErrMsg
            )};window.__DINOU_ERROR_NAME__=${JSON.stringify(caughtError?.name || "Error")};\n`;
            bootstrapScriptContent += 'document.body.setAttribute("data-hydrated", "true");\n';
          }
          if (bridge._injectedScripts) {
            const clean = bridge._injectedScripts.replace(/<\/?script>/g, "");
            bootstrapScriptContent += clean + "\n";
          }

          const clientEntry = isError
            ? getAssetFromManifest("error.js")
            : getAssetFromManifest("main.js");

          const htmlStream = await platformContext.renderHtmlStream(streamForSsr, {
            bootstrapModules: [clientEntry],
            bootstrapScriptContent,
            onError(err) {
              console.error("[Edge Native SSR] Stream error:", err);
            },
          });

          if (bridge.headers.has("Location") || (bridge.statusCode >= 300 && bridge.statusCode < 400)) {
            return {
              type: "redirect",
              status: bridge.statusCode || 302,
              headers: new Headers(bridge.headers),
              cookies: [...bridge.cookies],
            };
          }

          if (shouldCacheISG) {
            const [streamForBrowser, streamForKv] = htmlStream.tee();
            const rscKey = cleanPath ? `${cleanPath}/rsc.rsc` : "rsc.rsc";
            const cacheTask = (async () => {
              try {
                const [rscPayload, fullHtml] = await Promise.all([
                  new Response(streamForCache).text(),
                  new Response(streamForKv).text(),
                ]);
                await storage.set(rscKey, rscPayload);
                await storage.set(htmlKey, fullHtml, genMeta);
                await storage.set(metaKey, JSON.stringify(genMeta));
                console.log(`✅ [Edge ISG] Successfully cached ${reqPath} to KV`);
              } catch (cacheErr) {
                console.error("[Edge ISG] Error caching to KV:", cacheErr);
              }
            })();
            if (platformContext.ctx && typeof platformContext.ctx.waitUntil === "function") {
              platformContext.ctx.waitUntil(cacheTask);
            }
            return {
              type: "stream",
              stream: streamForBrowser,
              status: genMeta.status,
              headers: new Headers(bridge.headers),
              cookies: [...bridge.cookies],
            };
          }

          return {
            type: "stream",
            stream: htmlStream,
            status: genMeta.status,
            headers: new Headers(bridge.headers),
            cookies: [...bridge.cookies],
          };
        }

        throw new Error(
          "[Dinou Edge] platformContext.renderHtmlStream is required for Edge rendering. Ensure your adapter is using the dual-bundle architecture with edge-ssr."
        );
      })();

      inFlightGenerations.set(inFlightKey, isgPromise);
    }

    try {
      const result = await isgPromise;
      if (result.type === "redirect") {
        bridge.status(result.status || 302);
        if (result.headers) {
          for (const [k, v] of result.headers.entries()) {
            bridge.setHeader(k, v);
          }
        }
        if (result.cookies) {
          for (const c of result.cookies) {
            if (!bridge.cookies.includes(c)) {
              bridge.cookies.push(c);
            }
          }
        }
        bridge.end();
        return bridge.toResponse();
      }

      if (result.headers) {
        for (const [k, v] of result.headers.entries()) {
          bridge.setHeader(k, v);
        }
      }
      if (result.cookies) {
        for (const c of result.cookies) {
          if (!bridge.cookies.includes(c)) {
            bridge.cookies.push(c);
          }
        }
      }
      bridge.setHeader("Content-Type", "text/html; charset=utf-8");
      bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      bridge.status(result.status || 200);

      if (result.type === "stream") {
        bridge.setEdgeStream(result.stream);
        return bridge.toResponse();
      }

      bridge.end(result.html);
      return bridge.toResponse();
    } finally {
      inFlightGenerations.delete(inFlightKey);
    }
  }

  // Node.js Runtime: Serve static pre-rendered HTML if available in production
  if (!isDevelopment && !dynamicState.value && pagePath && !isPathBlocked) {
    revalidating(reqPath, dynamicState);
    let htmlPathOld;
    if (regenerating.has(reqPath)) {
      htmlPathOld = path.join(".dinou/dist2", reqPath, "index._old.html");
    }
    const htmlPath = path.join(".dinou/dist2", reqPath, "index.html");
    const fileToRead = (htmlPathOld && existsSync(htmlPathOld)) ? htmlPathOld : htmlPath;

    if (existsSync(fileToRead) && !dynamicState.value) {
      bridge.setHeader("Content-Type", "text/html; charset=utf-8");
      bridge.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      let status = getStatus(reqPath);
      try {
        let htmlContent = readFileSync(fileToRead, "utf8");
        let buildId = "";
        try {
          const metadataPath = path.join(".dinou/dist2", reqPath, "metadata.json");
          if (existsSync(metadataPath)) {
            const metaObj = JSON.parse(readFileSync(metadataPath, "utf8"));
            buildId = metaObj.generatedAt || "";
            if (!status && metaObj.status) {
              status = metaObj.status;
            }
          }
        } catch (e) {}

        bridge.status(status || 200);

        let scripts = `<script>window.__DINOU_USE_STATIC__=true;</script>`;
        if (htmlPathOld && existsSync(htmlPathOld)) {
          scripts += `<script>window.__DINOU_USE_OLD_RSC__=true;</script>`;
        }
        if (buildId) {
          scripts += `<script>window.__DINOU_BUILD_ID__="${buildId}";</script>`;
        }

        htmlContent = htmlContent.replace("</head>", `${scripts}</head>`);
        bridge.end(htmlContent);
        return bridge.toResponse();
      } catch (err) {
        console.error("[Dinou] Error reading HTML file:", err);
        if (!bridge.headersSent) bridge.status(500).send("Server Error");
        return bridge.toResponse();
      }
    }
  }

  const contextForChild = {
    req: {
      query: { ...queryObj },
      cookies: { ...cookiesObj },
      headers: { ...headersObj },
      path: pathname,
      method: request.method,
    },
  };

  const isDynamicSSR = true;
  const capturedStatus = null;

  processLimiter
    .run(async () => {
      try {
        const appHtmlStream = renderAppToHtml(
          reqPath,
          JSON.stringify(queryObj),
          contextForChild,
          bridge,
          capturedStatus,
          isDynamicSSR,
          isPathBlocked,
        );

        bridge.setHeader("Content-Type", "text/html; charset=utf-8");
        appHtmlStream.pipe(bridge);

        await new Promise((resolve) => {
          appHtmlStream.on("end", () => {
            if (
              !isDevelopment &&
              bridge.statusCode === 200 &&
              request.method === "GET" &&
              pagePath &&
              !isPathBlocked &&
              allowISGValue !== false &&
              Object.keys(queryObj).length === 0
            ) {
              generatingISG(reqPath, dynamicState);
            }
            resolve();
          });
          appHtmlStream.on("error", (error) => {
            console.error("[Dinou] Stream error:", error);
            if (!bridge.headersSent) bridge.status(500).send("Internal Server Error");
            resolve();
          });
        });
      } catch (err) {
        console.error("[Dinou] Error in dynamic SSR:", err);
        if (!bridge.headersSent) {
          bridge.status(500).send("Internal Server Error");
        }
      }
    })
    .catch((err) => {
      console.error("[Dinou] Error in limited SSR:", err);
      if (!bridge.headersSent) bridge.status(500).send("Server Busy or Error");
    });

  return bridge.toResponse();
}

module.exports = {
  handleRequest,
  WebResponseBridge,
};
module.exports.default = handleRequest;

