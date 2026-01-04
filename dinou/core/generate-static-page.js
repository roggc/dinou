const path = require("path");
const { mkdirSync, createWriteStream } = require("fs");
const fs = require("fs").promises;
const renderAppToHtml = require("./render-app-to-html.js");
const getSSGMetadata = require("./get-ssg-metadata.js");

const OUT_DIR = path.resolve("dist2");

async function generateStaticPage(reqPath) {
  const finalReqPath = reqPath.endsWith("/") ? reqPath : reqPath + "/";
  const htmlPath = path.join(OUT_DIR, finalReqPath, "index.html");
  const tempHtmlPath = path.join(OUT_DIR, finalReqPath, "index.html.tmp");

  const query = {};
  const paramsString = JSON.stringify(query);
  const capturedStatus = {};

  const contextForChild = {
    req: {
      query,
      cookies: {},
      headers: {
        "user-agent": "Dinou-ISR-Revalidator",
        host: "localhost",
        "x-forwarded-proto": "http",
      },
      path: finalReqPath,
      method: "GET",
    },
  };

  try {
    mkdirSync(path.dirname(htmlPath), { recursive: true });
    const fileStream = createWriteStream(tempHtmlPath);
    let htmlStream = null;

    const mockRes = {
      headersSent: true,
      _cookies: [],
      cookie(name, value, options) {
        this._cookies.push({ name, value, options });
      },
      write: (chunk) => {
        if (!fileStream.writableEnded) fileStream.write(chunk);
      },
      end: (chunk) => {
        if (chunk && !fileStream.writableEnded) fileStream.write(chunk);
        if (htmlStream) htmlStream.unpipe(fileStream);
        if (!fileStream.writableEnded) fileStream.end();
      },
      status: (code) => {
        capturedStatus.value = code;
      },
      setHeader: () => {},
      clearCookie: () => {},
      redirect: () => {},
    };

    htmlStream = renderAppToHtml(
      finalReqPath,
      paramsString,
      "{}",
      contextForChild,
      mockRes,
      capturedStatus
    );

    const sideEffectScripts = getSSGMetadata(reqPath);

    await new Promise((resolve, reject) => {
      if (sideEffectScripts) fileStream.write(sideEffectScripts);
      htmlStream.pipe(fileStream, { end: false });
      htmlStream.on("end", () => {
        if (!fileStream.writableEnded) fileStream.end();
        resolve();
      });
      htmlStream.on("error", (err) => {
        fileStream.end();
        if (err.code === "ERR_STREAM_WRITE_AFTER_END") resolve();
        else reject(err);
      });
      fileStream.on("error", reject);
    });

    // 🛡️ NO RENOMBRAMOS NI ACTUALIZAMOS MANIFIESTO AQUÍ
    // Solo devolvemos el reporte al orquestador
    const status = capturedStatus.value || 200;
    const success = status !== 500;

    return {
      success,
      type: "html",
      reqPath: finalReqPath,
      tempPath: tempHtmlPath,
      finalPath: htmlPath,
      status: status,
    };
  } catch (error) {
    // En caso de excepción, intentamos limpiar pero delegamos error
    await fs.unlink(tempHtmlPath).catch(() => {});
    return { success: false, tempPath: tempHtmlPath };
  }
}

module.exports = generateStaticPage;
