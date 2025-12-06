const fs = require("fs");
const path = require("path");
const { PassThrough } = require("stream");
const getSSGJSXOrJSX = require("./get-ssg-jsx-or-jsx.js");
const { renderToPipeableStream } = require("react-server-dom-webpack/server");

const OUT_DIR = path.resolve("dist2");
const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";

async function generateStaticRSCs(routes) {
  const manifest = JSON.parse(
    fs.readFileSync(
      path.resolve(
        isWebpack
          ? "dist3/react-client-manifest.json"
          : "react_client_manifest/react-client-manifest.json"
      ),
      "utf8"
    )
  );

  for (const route of routes) {
    const reqPath = route.endsWith("/") ? route : route + "/";
    const payloadPath = path.join(OUT_DIR, reqPath, "rsc.rsc");

    try {
      // console.log("🔄 Generating RSC payload for:", reqPath);
      const jsx = await getSSGJSXOrJSX(reqPath, {});
      // console.log("✅ JSX retrieved for:", reqPath);
      fs.mkdirSync(path.dirname(payloadPath), { recursive: true });

      const fileStream = fs.createWriteStream(payloadPath);
      const passThrough = new PassThrough();

      const { pipe } = renderToPipeableStream(jsx, manifest);
      pipe(passThrough);
      passThrough.pipe(fileStream);

      await new Promise((resolve, reject) => {
        fileStream.on("finish", resolve);
        fileStream.on("error", reject);
      });

      console.log("✅ Generated RSC payload:", reqPath);
    } catch (error) {
      console.error("❌ Error generating RSC payload for:", reqPath, error);
    }
  }

  console.log("🟢 Static RSC payload generation complete.");
}

module.exports = generateStaticRSCs;
