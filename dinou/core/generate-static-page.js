// dinou/core/generate-static-page.js
// Generates static HTML for a given path using the in-memory Dual-Bundle streaming engine.
// Completely eliminates child_process.fork() and render-app-to-html.js.

const path = require("path");
const fs = require("fs").promises;
const { existsSync, mkdirSync } = require("fs");
const { pathToFileURL } = require("url");

const OUT_DIR = path.resolve(".dinou/dist2");

async function generateStaticPage(reqPath) {
  const finalReqPath = reqPath.endsWith("/") ? reqPath : reqPath + "/";
  const htmlPath = path.join(OUT_DIR, finalReqPath, "index.html");
  const tempHtmlPath = path.join(OUT_DIR, finalReqPath, `index.html.${Date.now()}-${Math.random()}.tmp`);

  try {
    mkdirSync(path.dirname(htmlPath), { recursive: true });

    const rscEnginePath = path.resolve(process.cwd(), ".dinou/node/rsc-engine.mjs");
    const ssrEnginePath = path.resolve(process.cwd(), ".dinou/node/ssr-engine.mjs");

    let rscModule = null;
    let ssrModule = null;
    if (existsSync(rscEnginePath) && existsSync(ssrEnginePath)) {
      rscModule = await import(pathToFileURL(rscEnginePath).href);
      ssrModule = await import(pathToFileURL(ssrEnginePath).href);
    }

    if (rscModule && ssrModule) {
      const webReq = new Request(`http://localhost${finalReqPath}`);
      const res = await rscModule.handleRequest(webReq, {
        runtime: "node-bundle",
        renderHtmlStream: ssrModule.renderHtml,
        isSSG: true,
      });

      const text = await res.text();
      await fs.writeFile(tempHtmlPath, text, "utf8");

      return {
        success: res.status !== 500 && text.length > 0,
        type: "html",
        reqPath: finalReqPath,
        tempPath: tempHtmlPath,
        finalPath: htmlPath,
        status: res.status || 200,
      };
    }

    return { success: false, tempPath: tempHtmlPath };
  } catch (error) {
    await fs.unlink(tempHtmlPath).catch(() => {});
    return { success: false, tempPath: tempHtmlPath };
  }
}

module.exports = generateStaticPage;
