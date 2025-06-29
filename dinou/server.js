require("dotenv/config");
require("./register-paths");
const webpackRegister = require("react-server-dom-webpack/node-register");
const path = require("path");
const {
  readFileSync,
  existsSync,
  // mkdirSync,
  // createWriteStream,
  createReadStream,
} = require("fs");
const { renderToPipeableStream } = require("react-server-dom-webpack/server");
const express = require("express");
const getSSGJSXOrJSX = require("./get-ssg-jsx-or-jsx.js");
const { getErrorJSX } = require("./get-error-jsx.js");
const addHook = require("./asset-require-hook.js");
webpackRegister();
const babelRegister = require("@babel/register");
babelRegister({
  ignore: [/[\\\/](build|server|node_modules)[\\\/]/],
  presets: [
    ["@babel/preset-react", { runtime: "automatic" }],
    "@babel/preset-typescript",
  ],
  plugins: ["@babel/transform-modules-commonjs"],
  extensions: [".js", ".jsx", ".ts", ".tsx"],
});
const createScopedName = require("./createScopedName");
require("css-modules-require-hook")({
  generateScopedName: createScopedName,
});
addHook({
  extensions: ["png", "jpg", "jpeg", "gif", "svg", "webp"],
  name: function (localName, filepath) {
    const result = createScopedName(localName, filepath);
    return result + ".[ext]";
  },
  publicPath: "images/",
});
// const { PassThrough } = require("stream");
const generateStatic = require("./generate-static.js");
const renderAppToHtml = require("./render-app-to-html.js");
const revalidating = require("./revalidating.js");
const isDevelopment = process.env.NODE_ENV !== "production";
const app = express();

app.use(express.json());

app.use(express.static(path.resolve(process.cwd(), "____public____")));

app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json({
    name: "Dinou DevTools",
    description: "Dinou DevTools for Chrome",
    version: "1.0.0",
    devtools_page: "/____public____/devtools.html",
  });
});

app.get(/^\/____rsc_payload____\/.*\/?$/, async (req, res) => {
  try {
    const reqPath = (
      req.path.endsWith("/") ? req.path : req.path + "/"
    ).replace("/____rsc_payload____", "");

    if (!isDevelopment) {
      const payloadPath = path.join("dist2", reqPath, "rsc.rsc");
      if (existsSync(payloadPath)) {
        // console.log(`[RSC] Serving existing payload for ${reqPath}`);
        res.setHeader("Content-Type", "application/octet-stream");
        const readStream = createReadStream(payloadPath);
        readStream.on("error", (err) => {
          console.error("Error reading RSC file:", err);
          res.status(500).end();
        });
        return readStream.pipe(res);
      }
    }

    // console.log(`[RSC] Payload not found, generating new one for ${reqPath}`);

    const jsx = await getSSGJSXOrJSX(reqPath, { ...req.query });

    const manifest = JSON.parse(
      readFileSync(
        path.resolve("____public____/react-client-manifest.json"),
        "utf8"
      )
    );

    // mkdirSync(path.dirname(payloadPath), { recursive: true });
    // const fileWriteStream = createWriteStream(payloadPath);

    const { pipe } = renderToPipeableStream(jsx, manifest);
    pipe(res);

    // Pipe both to response and file
    // const passThrough = new PassThrough();
    // pipe(passThrough);
    // passThrough.pipe(res);
    // passThrough.pipe(fileWriteStream);
  } catch (error) {
    console.error("Error rendering RSC:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post(/^\/____rsc_payload_error____\/.*\/?$/, async (req, res) => {
  try {
    const reqPath = (
      req.path.endsWith("/") ? req.path : req.path + "/"
    ).replace("/____rsc_payload_error____", "");
    const jsx = await getErrorJSX(reqPath, { ...req.query }, req.body.error);
    const manifest = readFileSync(
      path.resolve(process.cwd(), "____public____/react-client-manifest.json"),
      "utf8"
    );
    const moduleMap = JSON.parse(manifest);
    const { pipe } = renderToPipeableStream(jsx, moduleMap);
    pipe(res);
  } catch (error) {
    console.error("Error rendering RSC:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get(/^\/.*\/?$/, async (req, res) => {
  try {
    const reqPath = req.path.endsWith("/") ? req.path : req.path + "/";
    const htmlPath = path.join("dist2", reqPath, "index.html");

    if (!isDevelopment) {
      revalidating(reqPath);

      if (existsSync(htmlPath)) {
        // console.log("Serving cached HTML:", htmlPath);
        res.setHeader("Content-Type", "text/html");
        return createReadStream(htmlPath).pipe(res);
      }
    }

    const appHtmlStream = await renderAppToHtml(
      reqPath,
      JSON.stringify({ ...req.query })
    );

    // mkdirSync(path.dirname(htmlPath), { recursive: true });

    // const fileStream = createWriteStream(htmlPath);
    res.setHeader("Content-Type", "text/html");
    appHtmlStream.pipe(res);
    // appHtmlStream.pipe(fileStream);

    appHtmlStream.on("error", (error) => {
      console.error("Stream error:", error);
      res.status(500).send("Internal Server Error");
    });

    // fileStream.on("error", (error) => {
    //   console.error("File write error:", error);
    // });
  } catch (error) {
    console.error("Error rendering React app:", error);
    res.status(500).send("Internal Server Error");
  }
});

const port = process.env.PORT || 3000;

app.listen(port, async () => {
  if (!isDevelopment) {
    await generateStatic();
  } else {
    console.log("⚙️ Rendering dynamically in dev mode");
  }
  console.log(`Listening on port ${port}`);
});
