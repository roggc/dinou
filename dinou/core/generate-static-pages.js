// generate-static-pages.js
const path = require("path");
const { mkdirSync, createWriteStream } = require("fs");
const fs = require("fs").promises;
const renderAppToHtml = require("./render-app-to-html.js");
const { getStaticMetadata } = require("./build-static-pages.js");
const { processMetadata } = require("./get-ssg-metadata.js");
const { updateStatus } = require("./status-manifest.js");

const OUT_DIR = path.resolve("dist2");

async function generateStaticPages(routes) {
  for (const route of routes) {
    const reqPath = route.endsWith("/") ? route : route + "/";
    const htmlPath = path.join(OUT_DIR, reqPath, "index.html");

    const query = {};
    const paramsString = JSON.stringify(query);
    const capturedStatus = {};
    const contextForChild = {
      req: {
        query,
        cookies: {},
        headers: {
          "user-agent": "Dinou-SSG-Builder",
          host: "localhost",
          "x-forwarded-proto": "http",
        },
        path: reqPath,
        method: "GET",
      },
    };

    try {
      mkdirSync(path.dirname(htmlPath), { recursive: true });
      const fileStream = createWriteStream(htmlPath);
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
          if (htmlStream) {
            htmlStream.unpipe(fileStream);
          }
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

      htmlStream = renderAppToHtml(
        reqPath,
        paramsString,
        contextForChild,
        mockRes,
        capturedStatus
      );

      const metadata = getStaticMetadata(reqPath);
      let sideEffectScripts = "";
      if (metadata && metadata.effects) {
        sideEffectScripts = processMetadata(metadata.effects);
      }

      await new Promise((resolve, reject) => {
        if (sideEffectScripts) {
          fileStream.write(sideEffectScripts);
        }
        htmlStream.pipe(fileStream, { end: false });

        htmlStream.on("end", () => {
          if (!fileStream.writableEnded) fileStream.end();
          updateStatus(reqPath, capturedStatus.value);
          resolve();
        });

        htmlStream.on("error", (err) => {
          if (err.code === "ERR_STREAM_WRITE_AFTER_END") {
            resolve();
          } else {
            reject(err);
          }
        });

        fileStream.on("error", reject);
      });

      if (metadata) {
        const metadataPath = path.join(OUT_DIR, reqPath, "metadata.json");
        await fs.writeFile(
          metadataPath,
          JSON.stringify({
            revalidate: metadata.revalidate,
            generatedAt: Date.now(),
            effects: metadata.effects,
          }, null, 2),
          "utf8"
        );
      }

      console.log("✅ Generated HTML:", reqPath);
    } catch (error) {
      if (error.code === "ERR_STREAM_WRITE_AFTER_END") {
        console.log("⚠️ Ignored write-after-end race condition for:", reqPath);
      } else {
        console.error("❌ Error rendering:", reqPath);
        console.error(error.message);
      }
    }
  }

  console.log("🟢 Static page generation complete.");
}

module.exports = generateStaticPages;
