const fs = require("fs");
const path = require("path");
const { PassThrough } = require("stream");
const getSSGJSXOrJSX = require("./get-ssg-jsx-or-jsx.js");
const { renderToPipeableStream } = require("react-server-dom-webpack/server");

// 👇 Your context storage
const { requestStorage } = require("./request-context.js");

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

    // ====================================================================
    // 1. MOCK RES: Fulfilling the ResponseProxy interface
    // ====================================================================
    // Although the contract says it returns void, internally we save
    // the state in case you want to log errors (e.g., a redirect at build time).
    const mockRes = {
      _statusCode: 200,
      _headers: {},
      _redirectUrl: null,
      _cookies: [], // Optional: for debug

      // 👇 ADD THIS METHOD
      cookie(name, value, options) {
        // In SSG we don't do anything real, but we save a record if you want to debug
        // console.log(`[SSG] Cookie set ignored: ${name}=${value}`);
        this._cookies.push({ name, value, options });
      },

      // clearCookie(name: string, options?: ...): void;
      clearCookie(name, options) {
        // In SSG we don't do anything, but we fulfill the contract avoiding crash
      },

      // setHeader(name: string, value: string | ReadonlyArray<string>): void;
      setHeader(name, value) {
        this._headers[name.toLowerCase()] = value;
      },

      // status(code: number): void;
      status(code) {
        this._statusCode = code;
      },

      // redirect(status: number, url: string): void;
      // redirect(url: string): void;
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

        // We log a warning because a redirect in SSG is usually problematic
        console.warn(
          `⚠️ [SSG] Redirect detected in ${reqPath} -> ${url} (${status})`
        );
      },
    };

    // ====================================================================
    // 2. MOCK REQ: Fulfilling RequestContextStore['req']
    // ====================================================================
    const mockReq = {
      query: {},
      cookies: {},
      headers: {
        "user-agent": "Dinou-SSG-Builder",
        host: "localhost",
        // Add here any default header you need
      },
      path: reqPath,
      method: "GET",
    };

    // 3. COMPLETE CONTEXT
    const mockContext = {
      req: mockReq,
      res: mockRes,
    };

    try {
      fs.mkdirSync(path.dirname(payloadPath), { recursive: true });
      const fileStream = fs.createWriteStream(payloadPath);
      const passThrough = new PassThrough();

      // 1. The entire lifecycle of the stream must be inside the storage
      await requestStorage.run(mockContext, async () => {
        const jsx = await getSSGJSXOrJSX(reqPath, {});
        const { pipe } = renderToPipeableStream(jsx, manifest);

        pipe(passThrough);
        passThrough.pipe(fileStream);

        // 2. IMPORTANT: We wait for the file to be written COMPLETELY
        // before exiting the 'run' block.
        await new Promise((resolve, reject) => {
          fileStream.on("finish", resolve);
          fileStream.on("error", reject);
          // Optional: handle errors from passThrough as well
          passThrough.on("error", reject);
        });
      });

      // Post-generation validation
      if (mockRes._statusCode !== 200) {
        console.log(
          `⚠️ Generated RSC for ${reqPath} but logic set status to ${mockRes._statusCode}`
        );
      } else {
        console.log("✅ Generated RSC payload:", reqPath);
      }
    } catch (error) {
      console.error("❌ Error generating RSC payload for:", reqPath, error);
    }
  }

  console.log("🟢 Static RSC payload generation complete.");
}

module.exports = generateStaticRSCs;
