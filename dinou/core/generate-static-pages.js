// generate-static-pages.js
const path = require("path");
const { mkdirSync, createWriteStream } = require("fs");
const { writeFile } = require("fs").promises;
const renderAppToHtml = require("./render-app-to-html.js");
const getSSGMetadata = require("./get-ssg-metadata.js");

const OUT_DIR = path.resolve("dist2");

function addToStatusManifest(status, reqPath, manifest) {
  // Lógica de Manifiesto / Guardado
  if (status == 500) {
    console.warn(
      `[SSG] Error 500 detectado en ${reqPath}. Guardando como página de error.`
    );
    // Opción A: Guardar en el manifiesto
    manifest[reqPath] = { status: 500 };
  } else if (status == 404) {
    manifest[reqPath] = { status: 404 };
  } else {
    // Status 200 normal
    manifest[reqPath] = { status: 200 };
  }
}

async function writeStatusManifest(outDir, statusManifest) {
  try {
    // 1. Definimos la ruta del archivo (ej: ./out/dinou-manifest.json)
    const manifestPath = path.join(outDir, "status-manifest.json");

    // 2. Convertimos el objeto a Texto JSON
    // null, 2 -> Sirve para que el JSON se escriba "bonito" (indentado), legible para humanos.
    const jsonContent = JSON.stringify(statusManifest, null, 2);

    // 3. Escribimos en disco
    await writeFile(manifestPath, jsonContent, "utf-8");

    console.log(`[Dinou] Manifest saved successfully at: ${manifestPath}`);
  } catch (error) {
    console.error("[Dinou] Error saving status manifest:", error);
  }
}

async function generateStaticPages(routes) {
  const statusManifest = {};
  for (const route of routes) {
    // Normalización de la ruta
    const reqPath = route.endsWith("/") ? route : route + "/";
    const htmlPath = path.join(OUT_DIR, reqPath, "index.html");

    // Preparar Query params (vacío por defecto en SSG, salvo que tu router lo soporte)
    const query = {};
    const paramsString = JSON.stringify(query);
    const capturedStatus = {};
    // ---------------------------------------------------------
    // 1. CREAR MOCK REQUEST (Solución a tu segunda pregunta)
    // ---------------------------------------------------------
    const contextForChild = {
      req: {
        query: query,
        cookies: {}, // No hay cookies en build time
        headers: {
          "user-agent": "Dinou-SSG-Builder",
          host: "localhost", // Valor seguro por defecto
          "x-forwarded-proto": "http",
        },
        path: reqPath, // 💡 Vital para lógica de menús activos, etc.
        method: "GET",
      },
      // No pasamos 'res' aquí, el child lo ignora, nosotros pasamos el mockRes como argumento
    };

    try {
      mkdirSync(path.dirname(htmlPath), { recursive: true });
      const fileStream = createWriteStream(htmlPath);
      let htmlStream = null; // Declaramos fuera para usar en el closure

      // ---------------------------------------------------------
      // 2. CREAR MOCK RESPONSE (Con Fix para Webpack)
      // ---------------------------------------------------------
      const mockRes = {
        headersSent: true, // Forzamos modo "streaming/script injection"
        _cookies: [], // Opcional: para debug

        // 👇 AÑADIR ESTE MÉTODO
        cookie(name, value, options) {
          // En SSG no hacemos nada real, pero guardamos registro si quieres debuguear
          // console.log(`[SSG] Cookie set ignored: ${name}=${value}`);
          this._cookies.push({ name, value, options });
        },

        write: (chunk) => {
          if (!fileStream.writableEnded) fileStream.write(chunk);
        },

        end: (chunk) => {
          // Si nos mandan un último chunk (ej: </script>)
          if (chunk && !fileStream.writableEnded) fileStream.write(chunk);

          // 🔥 FIX WEBPACK "WRITE AFTER END":
          // Desconectamos el stream del hijo inmediatamente.
          // Si Webpack manda basura después, no llegará al fileStream.
          if (htmlStream) {
            htmlStream.unpipe(fileStream);
            // Opcional: Pausar o destruir el stream del hijo para liberar memoria
            // htmlStream.destroy();
          }

          // Cerramos el archivo oficialmente
          if (!fileStream.writableEnded) fileStream.end();
        },

        status: (code) => {
          if (code !== 200)
            console.warn(`[SSG] Status ${code} ignored for ${reqPath}`);
          capturedStatus.value = code;
        },
        setHeader: () => {},
        clearCookie: () => {},
        redirect: () => {},
      };

      // 3. Ejecutar Render
      htmlStream = renderAppToHtml(
        reqPath,
        paramsString,
        "{}",
        contextForChild, // ✅ Pasamos el MockReq
        mockRes,
        capturedStatus
      );

      const sideEffectScripts = getSSGMetadata(reqPath);
      await new Promise((resolve, reject) => {
        // 🟢 INYECCIÓN DE SCRIPTS
        if (sideEffectScripts) {
          fileStream.write(sideEffectScripts);
        }
        // Conectamos standard output al archivo
        htmlStream.pipe(fileStream, { end: false }); // end: false nos da control manual en el mockRes

        // Manejo de eventos
        htmlStream.on("end", () => {
          if (!fileStream.writableEnded) fileStream.end();
          addToStatusManifest(capturedStatus.value, reqPath, statusManifest);
          resolve();
        });

        htmlStream.on("error", (err) => {
          // Si el error es "write after end" y ya cerramos, lo ignoramos (es ruido)
          if (err.code === "ERR_STREAM_WRITE_AFTER_END") {
            resolve();
          } else {
            reject(err);
          }
        });

        fileStream.on("error", reject);
      });

      console.log("✅ Generated HTML:", reqPath);
    } catch (error) {
      // Filtro extra de seguridad por si el error sube hasta aquí
      if (error.code === "ERR_STREAM_WRITE_AFTER_END") {
        console.log("⚠️ Ignored write-after-end race condition for:", reqPath);
      } else {
        console.error("❌ Error rendering:", reqPath);
        console.error(error.message);
      }
    }
  }

  console.log("🟢 Static page generation complete.");
  await writeStatusManifest(OUT_DIR, statusManifest);
}

module.exports = generateStaticPages;
