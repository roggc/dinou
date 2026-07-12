const path = require("path");
const { mkdirSync, createWriteStream, existsSync } = require("fs");
const fs = require("fs").promises;
const renderAppToHtml = require("./render-app-to-html.js");
const { getStaticMetadata } = require("./build-static-pages.js");
const { processMetadata } = require("./get-ssg-metadata.js");

const OUT_DIR = path.resolve("dist2");

async function generateStaticPage(reqPath) {
  const finalReqPath = reqPath.endsWith("/") ? reqPath : reqPath + "/";
  const htmlPath = path.join(OUT_DIR, finalReqPath, "index.html");
  const tempHtmlPath = path.join(OUT_DIR, finalReqPath, `index.html.${Date.now()}-${Math.random()}.tmp`);

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
      contextForChild,
      mockRes,
      capturedStatus
    );

    const metadata = getStaticMetadata(finalReqPath);
    let sideEffectScripts = "";
    if (metadata && metadata.effects) {
      sideEffectScripts = processMetadata(metadata.effects);
    }

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

    if (metadata) {
      const metadataPath = path.join(OUT_DIR, finalReqPath, "metadata.json");
      await fs.writeFile(
        metadataPath,
        JSON.stringify({
          revalidate: metadata.revalidate,
          generatedAt: Date.now(),
          effects: metadata.effects,
          tags: metadata.tags || [],
        }, null, 2),
        "utf8"
      );
    }

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
    await fs.unlink(tempHtmlPath).catch(() => {});
    return { success: false, tempPath: tempHtmlPath };
  }
}

module.exports = generateStaticPage;
