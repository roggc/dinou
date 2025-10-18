const path = require("path");
const { mkdirSync, createWriteStream } = require("fs");
const renderAppToHtml = require("./render-app-to-html.js");

const OUT_DIR = path.resolve("dist2");

async function generateStaticPage(reqPath) {
  const finalReqPath = reqPath.endsWith("/") ? reqPath : reqPath + "/";
  const htmlPath = path.join(OUT_DIR, finalReqPath, "index.html");
  const query = {};
  const paramsString = JSON.stringify(query);

  try {
    // console.log("🔄 Rendering HTML for:", finalReqPath);
    const htmlStream = renderAppToHtml(finalReqPath, paramsString);

    mkdirSync(path.dirname(htmlPath), { recursive: true });
    const fileStream = createWriteStream(htmlPath);

    await new Promise((resolve, reject) => {
      htmlStream.pipe(fileStream);
      htmlStream.on("end", resolve);
      htmlStream.on("error", reject);
      fileStream.on("error", reject);
    });

    console.log("✅ Generated HTML:", finalReqPath);
  } catch (error) {
    console.error("❌ Error rendering HTML for:", finalReqPath);
    console.error(error.message);
  }
}

module.exports = generateStaticPage;
