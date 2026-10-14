const fs = require("fs");
const path = require("path");
const { PassThrough } = require("stream");
const url = require("url");
const getJSX = require("./get-jsx.js");
let _renderToPipeableStream = null;
function getRenderToPipeableStream() {
  if (!_renderToPipeableStream) {
    const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";
    const mod = isWebpack
      ? require("react-server-dom-webpack/server")
      : require("@roggc/react-server-dom-esm/server");
    _renderToPipeableStream = mod.renderToPipeableStream;
  }
  return _renderToPipeableStream;
}
const { requestStorage } = require("./request-context.js");

const OUT_DIR = path.resolve(".dinou/dist2");
const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";

async function generateStaticRSC(reqPath, options = {}) {
  const finalReqPath = reqPath.endsWith("/") ? reqPath : reqPath + "/";
  const segment = options.segment || "page";
  const fileName = segment === "layout" ? "layout.rsc" : "page.rsc";

  const payloadPath = path.join(OUT_DIR, finalReqPath, fileName);
  const tempPayloadPath = path.join(
    OUT_DIR,
    finalReqPath,
    `${fileName}.${Date.now()}-${Math.random()}.tmp`
  );

  // 👇 2. MOCK RES (Complete and Robust Version)
  const mockRes = {
    _statusCode: 200,
    _headers: {},
    _redirectUrl: null,
    _cookies: [],

    cookie(name, value, options) {
      this._cookies.push({ name, value, options });
    },

    clearCookie(name, options) {
      // No-op
    },

    setHeader(name, value) {
      this._headers[name.toLowerCase()] = value;
    },

    status(code) {
      this._statusCode = code;
    },

    redirect(arg1, arg2) {
      let status = 302;
      let url = "";

      if (typeof arg1 === "number") {
        status = arg1;
        url = arg2;
      } else {
        url = arg1;
      }

      this._statusCode = status;
      this._redirectUrl = url;

      console.warn(
        `⚠️ [ISR] Redirect detected during RSC generation of ${reqPath} -> ${url} (${status})`
      );
    },
  };

  const mockContext = {
    req: {
      query: {},
      cookies: {},
      headers: {
        "user-agent": "Dinou-ISR-Revalidator",
        host: "localhost",
        "x-forwarded-proto": "http",
      },
      path: finalReqPath,
      method: "GET",
    },
    res: mockRes,
  };

  try {
    const manifest = JSON.parse(
      fs.readFileSync(
        path.resolve(
          isWebpack
            ? ".dinou/dist3/react-client-manifest.json"
            : ".dinou/react_client_manifest/react-client-manifest.json"
        ),
        "utf8"
      )
    );

    fs.mkdirSync(path.dirname(payloadPath), { recursive: true });

    // 2. WRITE TO TEMPORARY
    const fileStream = fs.createWriteStream(tempPayloadPath);
    const passThrough = new PassThrough();

    await requestStorage.run(mockContext, async () => {
      const jsx = await getJSX(finalReqPath, {}, null, false, false, {
        segment,
        layoutPath: options.layoutPath,
      });
      const renderToPipeableStream = getRenderToPipeableStream();
      const { pipe } = isWebpack
        ? renderToPipeableStream(jsx, manifest)
        : renderToPipeableStream(jsx, url.pathToFileURL(process.cwd()).href + "/");
      pipe(passThrough);
      passThrough.pipe(fileStream);

      await new Promise((resolve, reject) => {
        fileStream.on("finish", resolve);
        fileStream.on("error", reject);
        passThrough.on("error", reject);
      });
    });

    // 3. RETURN RESULT (We DO NOT rename here, atomic rename handled by caller)
    const success = mockRes._statusCode !== 500;

    return {
      success,
      type: "rsc",
      segment,
      fileName,
      reqPath: finalReqPath,
      tempPath: tempPayloadPath,
      finalPath: payloadPath,
      status: mockRes._statusCode,
    };
  } catch (error) {
    console.error(`❌ Error generating ${fileName} payload:`, error);
    // Emergency cleanup
    if (fs.existsSync(tempPayloadPath)) fs.unlinkSync(tempPayloadPath);
    return { success: false, segment, fileName, tempPath: tempPayloadPath };
  }
}

async function generateStaticPageRSC(reqPath, options = {}) {
  return generateStaticRSC(reqPath, { ...options, segment: "page" });
}

async function generateStaticLayoutRSC(layoutFolderPath, layoutFilePath, options = {}) {
  return generateStaticRSC(layoutFolderPath, {
    ...options,
    segment: "layout",
    layoutPath: layoutFilePath,
  });
}

module.exports = generateStaticRSC;
module.exports.generateStaticRSC = generateStaticRSC;
module.exports.generateStaticPageRSC = generateStaticPageRSC;
module.exports.generateStaticLayoutRSC = generateStaticLayoutRSC;
