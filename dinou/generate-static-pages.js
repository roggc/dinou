const path = require("path");
const { mkdirSync, createWriteStream } = require("fs");
const renderAppToHtml = require("./render-app-to-html.js");

const OUT_DIR = path.resolve("dist2");

async function generateStaticPages(routes) {
  for (const route of routes) {
    const reqPath = route.endsWith("/") ? route : route + "/";
    const htmlPath = path.join(OUT_DIR, reqPath, "index.html");
    const query = {};
    const paramsString = JSON.stringify(query);

    try {
      const htmlStream = await renderAppToHtml(reqPath, paramsString);

      mkdirSync(path.dirname(htmlPath), { recursive: true });
      const fileStream = createWriteStream(htmlPath);

      await new Promise((resolve, reject) => {
        htmlStream.pipe(fileStream);
        htmlStream.on("end", resolve);
        htmlStream.on("error", reject);
        fileStream.on("error", reject);
      });

      console.log("✅ Generated:", reqPath);
    } catch (error) {
      console.error("❌ Error rendering:", reqPath);
      console.error(error.message);
    }
  }

  console.log("🟢 Static page generation complete.");
}

module.exports = generateStaticPages;
