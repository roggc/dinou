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
const { revalidating, regenerating } = require("./revalidating.js");
const { generatingISG } = require("./generating-isg.js");
const { requestStorage } = require("./request-context.js");
const processLimiter = require("./concurrency-manager.js");
const { getStatus } = require("./status-manifest.js");

const {
  isManifestReady,
  getClientManifest,
  getServerFunctionsManifest,
} = require("./manifest-provider.js");
const { pipeRSC, isEdgeRuntime } = require("./rsc-renderer.js");
const { getStorageAdapter, setStorageAdapter } = require("./storage-adapter.js");

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

        cachedConfig = {
          allowISG: resolvedAllowISG,
          staticPathsSet,
          validateParams: pageFunctionsModule.validateParams || null,
        };
      } else {
        cachedConfig = {
          allowISG: true,
          staticPathsSet: null,
          validateParams: null,
        };
      }

      if (!isDevelopment) {
        pageFunctionsConfigCache.set(pagePath, cachedConfig);
      }
    }

    const { allowISG: cachedAllowISG, staticPathsSet, validateParams: validateParamsFn } = cachedConfig;
    allowISGValue = cachedAllowISG;
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

  return { isPathBlocked, allowISGValue };
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
    if (options.maxAge) cookieStr += `; Max-Age=${options.maxAge}`;
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
    const res = new Response(readableStream, {
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
function createRequestContext(simReq, resBridge, platformContext = {}) {
  let hasRedirected = false;

  const safeResCall = (methodName, ...args) => {
    if (hasRedirected) return;
    if (resBridge.headersSent) {
      if (methodName === "redirect" && simReq.path.includes("____rsc_payload")) {
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

    if (!isDevelopment && (!dynamicState.value || isStatic)) {
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

    const context = createRequestContext(simReq, bridge, platformContext);
    const isNotFound = {};

    await requestStorage.run(context, async () => {
      try {
        const jsx = await getJSX(cleanPath, queryObj, isNotFound, isDevelopment, isPathBlocked);
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

  const { isPathBlocked, allowISGValue } = await resolvePageFunctionsConfig(
    pagePath,
    reqSegments,
    queryObj,
    dynamicParams,
    reqPath,
  );

  // Serve static pre-rendered HTML if available in production
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

  // Dynamic SSR Render
  if (isEdgeRuntime(platformContext)) {
    return new Response("Not Found", { status: 404 });
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

