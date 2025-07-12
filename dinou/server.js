require("dotenv/config");
require("./register-paths");
const webpackRegister = require("react-server-dom-webpack/node-register");
const path = require("path");
const { readFileSync, existsSync, createReadStream } = require("fs");
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
  extensions: [
    "png",
    "jpg",
    "jpeg",
    "gif",
    "svg",
    "webp",
    "avif",
    "ico",
    "mp4",
    "webm",
    "ogg",
    "mov",
    "avi",
    "mkv",
    "mp3",
    "wav",
    "flac",
    "m4a",
    "aac",
    "mjpeg",
    "mjpg",
  ],
  name: function (localName, filepath) {
    const result = createScopedName(localName, filepath);
    return result + ".[ext]";
  },
  publicPath: "/assets/",
});
const generateStatic = require("./generate-static.js");
const renderAppToHtml = require("./render-app-to-html.js");
const revalidating = require("./revalidating.js");
const isDevelopment = process.env.NODE_ENV !== "production";
const webpackFolder = isDevelopment ? "____public____" : "dist3";
const app = express();

app.use(express.json());

app.use(express.static(path.resolve(process.cwd(), webpackFolder)));

app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json({
    name: "Dinou DevTools",
    description: "Dinou DevTools for Chrome",
    version: "1.0.0",
    devtools_page: `/${webpackFolder}/devtools.html`,
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
        res.setHeader("Content-Type", "application/octet-stream");
        const readStream = createReadStream(payloadPath);
        readStream.on("error", (err) => {
          console.error("Error reading RSC file:", err);
          res.status(500).end();
        });
        return readStream.pipe(res);
      }
    }

    const jsx = await getSSGJSXOrJSX(reqPath, { ...req.query }, isDevelopment);

    const manifest = JSON.parse(
      readFileSync(
        path.resolve(`${webpackFolder}/react-client-manifest.json`),
        "utf8"
      )
    );

    const { pipe } = renderToPipeableStream(jsx, manifest);
    pipe(res);
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
      path.resolve(
        process.cwd(),
        `${webpackFolder}/react-client-manifest.json`
      ),
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

    if (!isDevelopment) {
      revalidating(reqPath);
      const htmlPath = path.join("dist2", reqPath, "index.html");

      if (existsSync(htmlPath)) {
        res.setHeader("Content-Type", "text/html");
        return createReadStream(htmlPath).pipe(res);
      }
    }

    const appHtmlStream = await renderAppToHtml(
      reqPath,
      JSON.stringify({ ...req.query })
    );

    res.setHeader("Content-Type", "text/html");
    appHtmlStream.pipe(res);

    appHtmlStream.on("error", (error) => {
      console.error("Stream error:", error);
      res.status(500).send("Internal Server Error");
    });
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
