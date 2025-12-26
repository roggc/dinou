const fs = require("fs");
const path = require("path");
const { PassThrough } = require("stream");
const getSSGJSXOrJSX = require("./get-ssg-jsx-or-jsx.js");
const { renderToPipeableStream } = require("react-server-dom-webpack/server");

// 👇 Tu almacenamiento de contexto
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
    // 1. MOCK RES: Cumpliendo la interfaz ResponseProxy
    // ====================================================================
    // Aunque el contrato dice que devuelve void, internamente guardamos
    // el estado por si quieres loguear errores (ej. un redirect en build time).
    const mockRes = {
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

      // clearCookie(name: string, options?: ...): void;
      clearCookie(name, options) {
        // En SSG no hacemos nada, pero cumplimos el contrato evitando crash
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

        // Logueamos advertencia porque un redirect en SSG suele ser problemático
        console.warn(
          `⚠️ [SSG] Redirect detected in ${reqPath} -> ${url} (${status})`
        );
      },
    };

    // ====================================================================
    // 2. MOCK REQ: Cumpliendo RequestContextStore['req']
    // ====================================================================
    const mockReq = {
      query: {},
      cookies: {},
      headers: {
        "user-agent": "Dinou-SSG-Builder",
        host: "localhost",
        // Añade aquí cualquier header default que necesites
      },
      path: reqPath,
      method: "GET",
    };

    // 3. CONTEXTO COMPLETO
    const mockContext = {
      req: mockReq,
      res: mockRes,
    };

    try {
      fs.mkdirSync(path.dirname(payloadPath), { recursive: true });
      const fileStream = fs.createWriteStream(payloadPath);
      const passThrough = new PassThrough();

      // 1. Todo el ciclo de vida del stream debe estar dentro del storage
      await requestStorage.run(mockContext, async () => {
        const jsx = await getSSGJSXOrJSX(reqPath, {});
        const { pipe } = renderToPipeableStream(jsx, manifest);

        pipe(passThrough);
        passThrough.pipe(fileStream);

        // 2. IMPORTANTE: Esperamos a que el archivo se escriba TOTALMENTE
        // antes de salir del bloque 'run'.
        await new Promise((resolve, reject) => {
          fileStream.on("finish", resolve);
          fileStream.on("error", reject);
          // Opcional: manejar errores del passThrough también
          passThrough.on("error", reject);
        });
      });

      // Validación post-generación
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
