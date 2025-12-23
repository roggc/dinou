require("dotenv/config");
require("./register-paths");
const webpackRegister = require("react-server-dom-webpack/node-register");
const path = require("path");
const { readFileSync, existsSync, createReadStream } = require("fs");
const { renderToPipeableStream } = require("react-server-dom-webpack/server");
const express = require("express");
const getSSGJSXOrJSX = require("./get-ssg-jsx-or-jsx.js");
const { getErrorJSX } = require("./get-error-jsx.js");
const addHook = require("./asset-require-hook.js");
const { extensions } = require("./asset-extensions.js");
webpackRegister();
const babelRegister = require("@babel/register");
babelRegister({
  ignore: [/[\\\/](build|server|node_modules)[\\\/]/],
  presets: [
    ["@babel/preset-react", { runtime: "automatic" }],
    "@babel/preset-typescript",
  ],
  plugins: ["@babel/transform-modules-commonjs"],
  extensions: [".js", ".jsx", ".ts", ".tsx"],
});
const createScopedName = require("./createScopedName");
require("css-modules-require-hook")({
  generateScopedName: createScopedName,
});
addHook({
  extensions,
  name: function (localName, filepath) {
    const result = createScopedName(localName, filepath);
    return result + ".[ext]";
  },
  publicPath: "/assets/",
});
const importModule = require("./import-module");
const generateStatic = require("./generate-static.js");
const renderAppToHtml = require("./render-app-to-html.js");
const revalidating = require("./revalidating.js");
const isDevelopment = process.env.NODE_ENV !== "production";
const outputFolder = isDevelopment ? "public" : "dist3";
const chokidar = require("chokidar");
const { fileURLToPath } = require("url");
const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";
const parseExports = require("./parse-exports.js");
const { requestStorage } = require("./request-context.js");
const { useServerRegex } = require("../constants.js");
const processLimiter = require("./concurrency-manager.js");
if (isDevelopment) {
  const manifestPath = path.resolve(
    process.cwd(),
    isWebpack
      ? `${outputFolder}/react-client-manifest.json`
      : `react_client_manifest/react-client-manifest.json`
  );
  const manifestFolderPath = path.resolve(
    process.cwd(),
    isWebpack ? outputFolder : "react_client_manifest"
  );

  let manifestWatcher = null;

  function startManifestWatcher() {
    let currentManifest = {};
    let isInitial = true;
    // Si ya existe un watcher viejo, ciérralo primero
    if (manifestWatcher) {
      try {
        manifestWatcher.close();
      } catch (e) {
        console.warn("Failed closing old watcher:", e);
      }
    }

    // console.log("[Watcher] Starting watcher");

    manifestWatcher = chokidar.watch(manifestFolderPath, {
      persistent: true,
      ignored: /node_modules/,
    });

    async function loadManifestWithRetry({
      manifestPath,
      maxRetries = 10,
      delayMs = 100,
    } = {}) {
      let attempts = 0;
      while (attempts < maxRetries) {
        try {
          // console.log(`Attempting to load manifest (try ${attempts + 1})...`);
          return JSON.parse(readFileSync(manifestPath, "utf8"));
        } catch (err) {
          if (err.code !== "ENOENT") {
            throw err; // Rethrow if it's not a file not found error
          }
          attempts++;
          if (attempts >= maxRetries) {
            throw err; // Rethrow after max retries
          }
          // Wait for the specified delay before retrying
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    function getParents(resolvedPath) {
      const parents = [];
      Object.values(require.cache).forEach((mod) => {
        if (
          mod.children &&
          mod.children.some((child) => child.id === resolvedPath)
        ) {
          parents.push(mod.id);
        }
      });
      return parents;
    }

    function clearRequireCache(modulePath, visited = new Set()) {
      try {
        const resolved = require.resolve(modulePath);
        if (visited.has(resolved)) return;
        visited.add(resolved);

        if (require.cache[resolved]) {
          delete require.cache[resolved];
          // console.log(`[Server HMR] Cleared cache for ${resolved}`);

          const parents = getParents(resolved);
          for (const parent of parents) {
            // Optional: Skip if parent not in src/ (safety)
            if (parent.startsWith(path.resolve(process.cwd(), "src"))) {
              clearRequireCache(parent, visited);
            }
          }
        }
      } catch (err) {
        console.warn(
          `[Server HMR] Could not resolve or clear ${modulePath}: ${err.message}`
        );
      }
    }

    let manifestTimeout;

    function readJSONWithRetry(pathToRead, retries = 4, delay = 10) {
      for (let i = 0; i < retries; i++) {
        try {
          const text = readFileSync(pathToRead, "utf8");
          if (!text.trim()) throw new Error("Empty JSON");
          return JSON.parse(text);
        } catch (err) {
          if (i === retries - 1) throw err;
          // tiny sleep
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
        }
      }
    }

    function handleManifestUpdate(newManifest) {
      // console.log("handle manifest update", newManifest, currentManifest);
      for (const key in currentManifest) {
        if (!(key in newManifest)) {
          const absPath = fileURLToPath(key);
          clearRequireCache(absPath);
          // console.log(`Cleared cache for ${absPath} (client -> server)`);
        }
      }

      // Handle added entries: server -> client switch
      for (const key in newManifest) {
        if (!(key in currentManifest)) {
          const absPath = fileURLToPath(key);
          clearRequireCache(absPath);
          // console.log(`Cleared cache for ${absPath} (server -> client)`);
        }
      }

      currentManifest = newManifest;
    }

    async function onManifestChange(chokidarPath, stats, delayMs = 100) {
      if (isWebpack && chokidarPath !== manifestPath) return;
      if (Object.keys(currentManifest).length === 0 && isInitial) {
        try {
          currentManifest = await loadManifestWithRetry({
            manifestPath,
            delayMs,
          });
          // console.log("Loaded initial manifest for HMR.", currentManifest);
          isInitial = false;
        } catch (err) {
          console.error("Failed to load initial manifest after retries:", err);
        }
        return;
      }
      try {
        // console.log("change event");
        clearTimeout(manifestTimeout);

        manifestTimeout = setTimeout(() => {
          try {
            const newManifest = readJSONWithRetry(manifestPath);
            handleManifestUpdate(newManifest);
          } catch (err) {
            console.error("Manifest not ready:", err.message);
          }
        }, 50);
      } catch (err) {
        console.error("Error handling manifest change:", err);
      }
    }

    manifestWatcher.on("add", onManifestChange);
    manifestWatcher.on("unlinkDir", startManifestWatcher);
    manifestWatcher.on("unlink", () => {
      isInitial = true;
      currentManifest = {};
    });
    // manifestWatcher.on("all", (event) => console.log("event", event));
    manifestWatcher.on("change", onManifestChange);
  }
  startManifestWatcher();
}
let serverFunctionsManifest = null;
// const devCache = new Map(); // Para dev: Map<absolutePath, Set<exports>>

if (!isDevelopment) {
  // En prod/build: cargar manifest generado
  const manifestPath = path.resolve(
    process.cwd(),
    isWebpack
      ? `${outputFolder}/server-functions-manifest.json`
      : `server_functions_manifest/server-functions-manifest.json`
  ); // Ajusta 'dist/' a tu outdir
  if (existsSync(manifestPath)) {
    serverFunctionsManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    // Convertir arrays a Sets para lookups rápidos
    for (const key in serverFunctionsManifest) {
      serverFunctionsManifest[key] = new Set(serverFunctionsManifest[key]);
    }
    console.log("[server] Loaded server functions manifest");
  } else {
    console.error("[server] Manifest not found - falling back to file reads");
  }
}
const cookieParser = require("cookie-parser");
const appUseCookieParser = cookieParser();
const app = express();
app.use(appUseCookieParser);
app.use(express.json());

function getContext(req, res) {
  // Helper para ejecutar métodos de res de forma segura
  const safeResCall = (methodName, ...args) => {
    if (res.headersSent) {
      // console.log(
      //   `[Dinou] res.${methodName} called but headers already sent. Ignoring.`
      // );
      // console.warn(
      //   `[Dinou Warning] RSC Stream activo. Ignorando res.${methodName}() para evitar crash.`
      // );
      return; // Salimos silenciosamente
    }
    if (methodName === "redirect") {
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
    // Ejecutamos manteniendo el contexto 'this' con bind/apply
    return res[methodName].apply(res, args);
  };

  const context = {
    req: {
      cookies: { ...req.cookies },
      headers: {
        "user-agent": req.headers["user-agent"],
        cookie: req.headers["cookie"],
        referer: req.headers["referer"],
        host: req.headers["host"],
      },
      query: { ...req.query },
      path: req.path,
      method: req.method,
    },
    res: {
      // 1. STATUS
      status: (code) => safeResCall("status", code),

      // 2. SET HEADER
      setHeader: (name, value) => safeResCall("setHeader", name, value),

      // 3. CLEAR COOKIE
      // Nota: Si headersSent es true, la cookie NO se borrará en esta petición RSC.
      // Si es vital borrarla, deberías manejarlo en el Client Component o en una API route aparte.
      clearCookie: (name, options) => safeResCall("clearCookie", name, options),

      // 4. REDIRECT (Tu wrapper inteligente existente)
      redirect: (...args) => safeResCall("redirect", ...args),
      // redirect: (...args) => {
      //   if (res.headersSent) {
      //     // No hacemos nada en el objeto res.
      //     // Confiamos en que tu Server Function devolverá <ClientRedirect />
      //     return;
      //   }
      //   res.redirect.apply(res, args);
      // },
    },
  };
  return context;
}

function getContextForServerFunctionEndpoint(req, res) {
  const context = {
    req: {
      cookies: { ...req.cookies },
      headers: {
        "user-agent": req.headers["user-agent"],
        cookie: req.headers["cookie"],
        referer: req.headers["referer"],
        host: req.headers["host"],
      },
      query: { ...req.query },
      path: req.path,
      method: req.method,
    },
    res: {
      redirect: (urlOrStatus, url) => {
        const targetUrl = url || urlOrStatus;
        // Lanzamos un objeto especial que el endpoint interceptará
        throw {
          $$type: "dinou-internal-redirect",
          url: targetUrl,
        };
      },
      status: (code) => {
        res.status(code);
      },
      setHeader: (n, v) => {
        res.setHeader(n, v);
      },
      clearCookie: (name, options) => {
        const path = options?.path || "/";

        if (!res.headersSent) {
          res.setHeader("Content-Type", "text/x-component");
        }

        // 🛡️ SOLUCIÓN SEGURA:
        // 1. Usamos JSON.stringify para que 'name' sea una string válida de JS (ej: "miCookie")
        // 2. Usamos JSON.stringify para 'path' también (seguridad total)
        // 3. NO ponemos comillas extra alrededor de ${...} en el template string
        // 4. Usamos el operador '+' de JavaScript dentro del script para unir las piezas

        const safeName = JSON.stringify(name); // Devuelve: "dinou-cookie"
        const safePath = JSON.stringify(path); // Devuelve: "/"

        res.write(
          `<script>document.cookie = ${safeName} + "=; Max-Age=0; path=" + ${safePath} + ";";</script>`
        );
      },
    },
  };
  return context;
}

app.use(express.static(path.resolve(process.cwd(), outputFolder)));

app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json({
    name: "Dinou DevTools",
    description: "Dinou DevTools for Chrome",
    version: "1.0.0",
    devtools_page: `/${outputFolder}/devtools.html`,
  });
});

let cachedClientManifest = null;
if (!isDevelopment) {
  // Carga inicial
  cachedClientManifest = JSON.parse(
    readFileSync(
      path.resolve(
        process.cwd(),
        isWebpack
          ? `${outputFolder}/react-client-manifest.json`
          : `react_client_manifest/react-client-manifest.json`
      ),
      "utf8"
    )
  );
}

app.get(/^\/____rsc_payload____\/.*\/?$/, async (req, res) => {
  try {
    const reqPath = (
      req.path.endsWith("/") ? req.path : req.path + "/"
    ).replace("/____rsc_payload____", "");

    if (!isDevelopment && Object.keys({ ...req.query }).length === 0) {
      // const payloadPath = path.join("dist2", reqPath, "rsc.rsc");
      const payloadPath = path.resolve(
        "dist2",
        reqPath.replace(/^\//, ""),
        "rsc.rsc"
      );
      const distDir = path.resolve("dist2");

      if (!payloadPath.startsWith(distDir)) {
        return res.status(403).end();
      }
      if (existsSync(payloadPath)) {
        res.setHeader("Content-Type", "application/octet-stream");
        const readStream = createReadStream(payloadPath);
        readStream.on("error", (err) => {
          console.error("Error reading RSC file:", err);
          res.status(500).end();
        });
        return readStream.pipe(res);
      }
    }
    const context = getContext(req, res);
    const pipe = await requestStorage.run(context, async () => {
      const jsx = await getSSGJSXOrJSX(
        reqPath,
        { ...req.query },
        { ...req.cookies },
        isDevelopment
      );
      const manifest = isDevelopment
        ? JSON.parse(
            readFileSync(
              path.resolve(
                process.cwd(),
                isWebpack
                  ? `${outputFolder}/react-client-manifest.json`
                  : `react_client_manifest/react-client-manifest.json`
              ),
              "utf8"
            )
          )
        : cachedClientManifest;

      const { pipe } = renderToPipeableStream(jsx, manifest);
      return pipe;
    });
    pipe(res);
  } catch (error) {
    console.error("Error rendering RSC:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post(/^\/____rsc_payload_error____\/.*\/?$/, async (req, res) => {
  try {
    const reqPath = (
      req.path.endsWith("/") ? req.path : req.path + "/"
    ).replace("/____rsc_payload_error____", "");
    const jsx = await getErrorJSX(reqPath, { ...req.query }, req.body.error);
    const manifest = isDevelopment
      ? JSON.parse(
          readFileSync(
            path.resolve(
              process.cwd(),
              isWebpack
                ? `${outputFolder}/react-client-manifest.json`
                : `react_client_manifest/react-client-manifest.json`
            ),
            "utf8"
          )
        )
      : cachedClientManifest;
    const { pipe } = renderToPipeableStream(jsx, manifest);
    pipe(res);
  } catch (error) {
    console.error("Error rendering RSC:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get(/^\/.*\/?$/, (req, res) => {
  try {
    const reqPath = req.path.endsWith("/") ? req.path : req.path + "/";

    if (!isDevelopment && Object.keys({ ...req.query }).length === 0) {
      revalidating(reqPath);
      const htmlPath = path.join("dist2", reqPath, "index.html");

      if (existsSync(htmlPath)) {
        res.setHeader("Content-Type", "text/html");
        return createReadStream(htmlPath).pipe(res);
      }
    }

    const contextForChild = {
      req: {
        // Solo serializa lo necesario para getContext().req
        query: { ...req.query },
        cookies: { ...req.cookies },
        headers: {
          "user-agent": req.headers["user-agent"],
          cookie: req.headers["cookie"],
          referer: req.headers["referer"],
          host: req.headers["host"],
        },
        path: req.path,
        method: req.method,
      },
      // No incluyas res aquí
    };
    processLimiter
      .run(async () => {
        const appHtmlStream = renderAppToHtml(
          reqPath,
          JSON.stringify({ ...req.query }),
          JSON.stringify({ ...req.cookies }),
          contextForChild,
          res
        );

        res.setHeader("Content-Type", "text/html");
        appHtmlStream.pipe(res);

        // 💡 TRUCO: Queremos liberar el slot de concurrencia SOLO cuando
        // el stream haya terminado de enviarse o haya error.
        await new Promise((resolve) => {
          appHtmlStream.on("end", resolve);
          appHtmlStream.on("error", (error) => {
            console.error("Stream error:", error);
            resolve();
            res.status(500).send("Internal Server Error");
          }); // Liberamos aunque falle
          res.on("close", resolve); // Si el usuario cierra la pestaña
        });
      })
      .catch((err) => {
        console.error("Error en SSR limitado:", err);
        if (!res.headersSent) res.status(500).send("Server Busy or Error");
      });
  } catch (error) {
    console.error("Error rendering React app:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Helper function para verificar origen
function isOriginAllowed(req) {
  // 1. En entornos server-to-server o tools, a veces no hay Origin.
  // Si decides que es obligatorio, devuelve false aquí.
  // Pero navegadores modernos SIEMPRE envían Origin en POST.
  const origin = req.headers.origin;

  // Si no hay origin (ej: llamada curl o server-side fetch sin headers),
  // tú decides si ser estricto o permisivo.
  if (!origin) return false; // Cambia a true si quieres permitir sin origin.

  try {
    // Parseamos para ignorar protocolo (http/https) y puerto si difieren sutilmente
    const originHost = new URL(origin).host;
    const serverHost = req.headers.host;

    // Comparamos el host (dominio:puerto)
    return originHost === serverHost;
  } catch (e) {
    return false; // Si la URL del origin es inválida, rechazar.
  }
}

app.post("/____server_function____", async (req, res) => {
  try {
    // 1. Verificar Origin (Prevenir llamadas desde otros dominios)
    const origin = req.headers.origin;
    const host = req.headers.host;

    // Nota: En local a veces origin es undefined o null, permitirlo en dev si es necesario
    if (!isDevelopment && origin && !origin.includes(host)) {
      return res.status(403).json({ error: "Invalid Origin" });
    }

    // 2. Verificar Header Personalizado (Defensa CSRF robusta)
    // Asegúrate de que tu cliente (server-function-proxy.js) envíe este header
    if (req.headers["x-server-function-call"] !== "1") {
      return res.status(403).json({ error: "Missing security header" });
    }

    // 2. Check del Origin (NUEVO)
    if (!isDevelopment && !isOriginAllowed(req)) {
      console.error(
        `[Security] Blocked request from origin: ${req.headers.origin}`
      );
      return res.status(403).json({ error: "Origin not allowed" });
    }
    const { id, args } = req.body;

    // Validación básica de inputs: id debe ser string, args un array
    if (typeof id !== "string" || !Array.isArray(args)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const [fileUrl, exportName] = id.split("#");

    // Validar fileUrl: debe empezar con 'file://' y no contener caracteres sospechosos
    if (!fileUrl.startsWith("file://")) {
      return res.status(400).json({ error: "Invalid file URL format" });
    }

    // Extraer relativePath y normalizarlo (elimina 'file://' y posibles '/')
    let relativePath = fileUrl.replace(/^file:\/\/\/?/, "").trim();
    if (relativePath.startsWith("/") || relativePath.includes("..")) {
      return res
        .status(400)
        .json({ error: "Invalid path: no absolute or traversal allowed" });
    }
    // console.log("relPath", relativePath);
    // Restringir a carpeta 'src/': prepend 'src/' si no está, y resolver absolutePath
    if (!relativePath.startsWith("src/") && !relativePath.startsWith("src\\")) {
      relativePath = path.join("src", relativePath);
    }
    const absolutePath = path.resolve(process.cwd(), relativePath);

    // Verificar que absolutePath esté estrictamente dentro de 'src/'
    const srcDir = path.resolve(process.cwd(), "src");
    if (!absolutePath.startsWith(srcDir + path.sep)) {
      return res
        .status(403)
        .json({ error: "Access denied: file outside src directory" });
    }
    // console.log("absPath", absolutePath);
    // Verificar que el archivo exista
    if (!existsSync(absolutePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    let allowedExports;
    if (serverFunctionsManifest) {
      // Prod: usar manifest (relativePath ya está normalizado)
      allowedExports = serverFunctionsManifest[relativePath];
    } else {
      // Dev: usar cache o verificar archivo
      // allowedExports = devCache.get(absolutePath);
      // if (!allowedExports) {
      const fileContent = readFileSync(absolutePath, "utf8"); // Solo lee una vez
      if (!useServerRegex.test(fileContent)) {
        return res
          .status(403)
          .json({ error: "Not a valid server function file" });
      }
      // Parsear exports (necesitas implementar parseExports en server si no lo tienes)
      const exports = parseExports(fileContent); // Asume que mueves parseExports a un util compartido
      allowedExports = new Set(exports);
      // devCache.set(absolutePath, allowedExports);
      // }
    }

    // Validar exportName contra allowedExports
    if (
      !exportName ||
      (exportName !== "default" && !allowedExports.has(exportName))
    ) {
      return res.status(400).json({ error: "Invalid export name" });
    }

    // Proceder con la importación (usando tu importModule)
    const mod = await importModule(absolutePath);

    // Validar exportName: solo permitir 'default' u otros si defines una whitelist
    if (!exportName || (exportName !== "default" && !mod[exportName])) {
      return res.status(400).json({ error: "Invalid export name" });
    }
    const fn = exportName === "default" ? mod.default : mod[exportName];

    if (typeof fn !== "function") {
      return res.status(400).json({ error: "Export is not a function" });
    }

    await processLimiter.run(async () => {
      const context = getContextForServerFunctionEndpoint(req, res);

      let result;
      try {
        result = await requestStorage.run(context, async () => {
          return await fn(...args);
        });
      } catch (err) {
        // 💡 INTERCEPTAMOS LA REDIRECCIÓN
        if (err && err.$$type === "dinou-internal-redirect") {
          // 1. Saneamos la URL siempre
          const safeUrl = JSON.stringify(err.url);
          const script = `<script>window.location.href = ${safeUrl};</script>`;

          if (!res.headersSent) {
            // ESCENARIO A: Limpio (Content-Type html)
            res.setHeader("Content-Type", "text/html");
            return res.send(script); // res.send hace end() y return detiene la función
          } else {
            // ESCENARIO B: Sucio/Stream activo (Content-Type ya fijado por clearCookie)
            // Escribimos el script en el stream existente
            res.write(script);

            // ⚠️ IMPORTANTE:
            // 1. Cerramos la respuesta, ya que redireccionamos y no habrá RSC payload.
            res.end();

            // 2. DETENEMOS la ejecución para que no siga hacia res.json() abajo.
            return;
          }
        }
        throw err; // Si es otro error, lo lanzamos al catch externo
      }

      if (!res.headersSent) res.setHeader("Content-Type", "text/x-component");
      const manifestPath = path.resolve(
        process.cwd(),
        isWebpack
          ? `${outputFolder}/react-client-manifest.json`
          : `react_client_manifest/react-client-manifest.json`
      );
      // Verificar que el manifest exista para evitar errores
      if (!existsSync(manifestPath)) {
        return res.status(500).json({ error: "Manifest not found" });
      }
      const manifest = isDevelopment
        ? JSON.parse(readFileSync(manifestPath, "utf8"))
        : cachedClientManifest;
      const { pipe } = renderToPipeableStream(result, manifest);
      pipe(res);
    });
  } catch (err) {
    console.error(`Server function error [${req.body?.id}]:`, err);
    // En producción, no envíes err.message completo para evitar leaks
    res.status(500).json({ error: "Internal server error" });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, async () => {
  if (!isDevelopment) {
    await generateStatic();
  } else {
    console.log("⚙️ Rendering dynamically in dev mode");
  }
  console.log(`Listening on port ${port}`);
});
