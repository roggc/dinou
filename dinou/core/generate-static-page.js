// generate-static-page.js
const path = require("path");
const { mkdirSync, createWriteStream } = require("fs");
const renderAppToHtml = require("./render-app-to-html.js");

const OUT_DIR = path.resolve("dist2");

async function generateStaticPage(reqPath) {
  // Normalización
  const finalReqPath = reqPath.endsWith("/") ? reqPath : reqPath + "/";
  const htmlPath = path.join(OUT_DIR, finalReqPath, "index.html");

  // Datos simulados
  const query = {};
  const paramsString = JSON.stringify(query);

  // 1. MOCK REQUEST (Contexto necesario para SSR)
  const contextForChild = {
    req: {
      query: query,
      cookies: {},
      headers: {
        "user-agent": "Dinou-ISR-Revalidator", // Útil para debug
        host: "localhost",
        "x-forwarded-proto": "http",
      },
      path: finalReqPath,
      method: "GET",
    },
  };

  try {
    // Preparar escritura
    mkdirSync(path.dirname(htmlPath), { recursive: true });
    const fileStream = createWriteStream(htmlPath);
    let htmlStream = null;

    // 2. MOCK RESPONSE (Simulación de Express + Fix Webpack)
    const mockRes = {
      headersSent: true, // Forzamos modo script injection para redirects

      write: (chunk) => {
        if (!fileStream.writableEnded) fileStream.write(chunk);
      },

      end: (chunk) => {
        if (chunk && !fileStream.writableEnded) fileStream.write(chunk);

        // 🔥 FIX WEBPACK: Cortar la conexión inmediatamente si decidimos terminar
        // (Ej: por un redirect)
        if (htmlStream) {
          htmlStream.unpipe(fileStream);
        }

        if (!fileStream.writableEnded) fileStream.end();
      },

      status: (code) => {
        if (code !== 200)
          console.warn(
            `[ISR Warning] Status ${code} ignored for ${finalReqPath}`
          );
      },
      setHeader: () => {},
      clearCookie: () => {},
      redirect: () => {}, // Nunca se ejecuta porque headersSent es true
    };

    // 3. Ejecutar Renderizado
    htmlStream = renderAppToHtml(
      finalReqPath,
      paramsString,
      "{}",
      contextForChild, // ✅ Mock Req
      mockRes // ✅ Mock Res
    );

    await new Promise((resolve, reject) => {
      // Conectar tubería manualmente
      htmlStream.pipe(fileStream, { end: false });

      htmlStream.on("end", () => {
        if (!fileStream.writableEnded) fileStream.end();
        resolve();
      });

      htmlStream.on("error", (err) => {
        // Ignorar error de carrera de Webpack si ocurre
        if (err.code === "ERR_STREAM_WRITE_AFTER_END") {
          resolve();
        } else {
          reject(err);
        }
      });

      fileStream.on("error", reject);
    });

    console.log("✅ Generated HTML (ISR):", finalReqPath);
  } catch (error) {
    if (error.code === "ERR_STREAM_WRITE_AFTER_END") {
      console.log(
        "⚠️ Ignored write-after-end race condition for:",
        finalReqPath
      );
    } else {
      console.error("❌ Error rendering HTML for:", finalReqPath);
      console.error(error.message);
    }
  }
}

module.exports = generateStaticPage;
