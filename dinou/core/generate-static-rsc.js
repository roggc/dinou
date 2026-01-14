const fs = require("fs");
const path = require("path");
const { PassThrough } = require("stream");
const getSSGJSXOrJSX = require("./get-ssg-jsx-or-jsx.js");
const { renderToPipeableStream } = require("react-server-dom-webpack/server");
const { requestStorage } = require("./request-context.js");

const OUT_DIR = path.resolve("dist2");
const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";

async function generateStaticRSC(reqPath) {
  const finalReqPath = reqPath.endsWith("/") ? reqPath : reqPath + "/";

  // 1. PATHS: Final and Temporary
  const payloadPath = path.join(OUT_DIR, finalReqPath, "rsc.rsc");
  const tempPayloadPath = payloadPath + ".tmp"; // 👈 We write here

  // 👇 2. MOCK RES (Complete and Robust Version)
  const mockRes = {
    _statusCode: 200,
    _headers: {},
    _redirectUrl: null, // ✅ We recover this property
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

    // ✅ YOUR ORIGINAL LOGIC (The correct one)
    redirect(arg1, arg2) {
      let status = 302;
      let url = "";

      // Overload handling: redirect(url) vs redirect(status, url)
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
            ? "dist3/react-client-manifest.json"
            : "react_client_manifest/react-client-manifest.json"
        ),
        "utf8"
      )
    );

    fs.mkdirSync(path.dirname(payloadPath), { recursive: true });

    // 2. WRITE TO TEMPORARY
    const fileStream = fs.createWriteStream(tempPayloadPath);
    const passThrough = new PassThrough();

    await requestStorage.run(mockContext, async () => {
      const jsx = await getSSGJSXOrJSX(finalReqPath, {});
      const { pipe } = renderToPipeableStream(jsx, manifest);
      pipe(passThrough);
      passThrough.pipe(fileStream);

      await new Promise((resolve, reject) => {
        fileStream.on("finish", resolve);
        fileStream.on("error", reject);
        passThrough.on("error", reject);
      });
    });

    // 3. RETURN RESULT (We DO NOT rename here)
    const success = mockRes._statusCode !== 500;

    return {
      success,
      type: "rsc",
      reqPath: finalReqPath,
      tempPath: tempPayloadPath,
      finalPath: payloadPath,
      status: mockRes._statusCode,
    };
  } catch (error) {
    console.error("❌ Error generating RSC payload:", error);
    // Emergency cleanup
    if (fs.existsSync(tempPayloadPath)) fs.unlinkSync(tempPayloadPath);
    return { success: false, tempPath: tempPayloadPath };
  }
}

module.exports = generateStaticRSC;
