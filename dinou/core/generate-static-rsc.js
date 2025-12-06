const fs = require("fs");
const path = require("path");
const { PassThrough } = require("stream");
const getSSGJSXOrJSX = require("./get-ssg-jsx-or-jsx.js");
const { renderToPipeableStream } = require("react-server-dom-webpack/server");

const OUT_DIR = path.resolve("dist2");
const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";

async function generateStaticRSC(reqPath) {
  const finalReqPath = reqPath.endsWith("/") ? reqPath : reqPath + "/";
  const payloadPath = path.join(OUT_DIR, finalReqPath, "rsc.rsc");

  try {
    // console.log("🔄 Generating RSC payload for:", finalReqPath);
    const jsx = await getSSGJSXOrJSX(finalReqPath, {});
    // console.log("✅ JSX retrieved for:", finalReqPath);

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

    console.log("✅ Generated RSC payload:", finalReqPath);
  } catch (error) {
    console.error("❌ Error generating RSC payload for:", finalReqPath, error);
  }
}

module.exports = generateStaticRSC;
