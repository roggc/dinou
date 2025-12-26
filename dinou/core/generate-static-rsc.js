const fs = require("fs");
const path = require("path");
const { PassThrough } = require("stream");
const getSSGJSXOrJSX = require("./get-ssg-jsx-or-jsx.js");
const { renderToPipeableStream } = require("react-server-dom-webpack/server");

// 👇 1. IMPORTAR STORAGE
const { requestStorage } = require("./request-context.js");

const OUT_DIR = path.resolve("dist2");
const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";

async function generateStaticRSC(reqPath) {
  const finalReqPath = reqPath.endsWith("/") ? reqPath : reqPath + "/";
  const payloadPath = path.join(OUT_DIR, finalReqPath, "rsc.rsc");

  // 👇 2. MOCK RES ROBUSTO (Alineado estrictamente con el contrato ResponseProxy)
  const mockRes = {
    // Propiedades internas para debug o lógica futura (ocultas al contrato TS)
    _statusCode: 200,
    _headers: {},
    _redirectUrl: null,
    _cookies: [], // Opcional: para debug

    // 👇 AÑADIR ESTE MÉTODO
    cookie(name, value, options) {
      // En SSG no hacemos nada real, pero guardamos registro si quieres debuguear
      // console.log(`[SSG] Cookie set ignored: ${name}=${value}`);
      this._cookies.push({ name, value, options });
    },

    // clearCookie(name, options): void
    clearCookie(name, options) {
      // No-op en generación estática/ISR
    },

    // setHeader(name, value): void
    setHeader(name, value) {
      this._headers[name.toLowerCase()] = value;
    },

    // status(code): void (Nota: El contrato dice void, no permite chaining)
    status(code) {
      this._statusCode = code;
    },

    // redirect: Soporte de sobrecarga (status, url) o (url)
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
        `⚠️ [ISR] Redirect detected during revalidation of ${reqPath} -> ${url} (${status})`
      );
    },
  };

  // 👇 3. MOCK CONTEXT (Req limitado a lo que pide el contrato)
  const mockContext = {
    req: {
      query: {},
      cookies: {}, // ISR usualmente no tiene cookies de usuario específicas
      headers: {
        "user-agent": "Dinou-ISR-Revalidator",
        host: "localhost",
        "x-forwarded-proto": "http",
      },
      path: finalReqPath,
      method: "GET",
    },
    res: mockRes, // ✅ Mock seguro
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

    const fileStream = fs.createWriteStream(payloadPath);
    const passThrough = new PassThrough();

    // ✅ 4. EJECUCIÓN CON CONTEXTO PROTEGIDO
    await requestStorage.run(mockContext, async () => {
      const jsx = await getSSGJSXOrJSX(finalReqPath, {});

      const { pipe } = renderToPipeableStream(jsx, manifest);

      // Conectamos los pipes dentro del contexto
      pipe(passThrough);
      passThrough.pipe(fileStream);

      // ESPERAMOS a que el stream termine ANTES de que el contexto se destruya
      await new Promise((resolve, reject) => {
        fileStream.on("finish", resolve);
        fileStream.on("error", (err) => {
          console.error(`❌ ISR Error writing RSC for ${finalReqPath}:`, err);
          reject(err);
        });
        passThrough.on("error", reject);
      });
    });

    // Validación post-generación (Opcional)
    if (mockRes._statusCode !== 200) {
      console.log(
        `⚠️ ISR Revalidation for ${finalReqPath} resulted in status ${mockRes._statusCode}`
      );
    } else {
      console.log("✅ Generated RSC payload (ISR):", finalReqPath);
    }
  } catch (error) {
    console.error("❌ Error generating RSC payload for:", finalReqPath, error);
  }
}

module.exports = generateStaticRSC;
