require("dotenv/config");
require("./register-paths");
const webpackRegister = require("react-server-dom-webpack/node-register");
const path = require("path");
const { readFileSync } = require("fs");
const { renderToPipeableStream } = require("react-server-dom-webpack/server");
const express = require("express");
const { spawn } = require("child_process");
const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const webpackConfig = require(path.resolve(__dirname, "../webpack.config.js"));
const { getSSGJSXOrJSX } = require("./get-jsx.js");
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

const app = express();
const isDevelopment = process.env.NODE_ENV !== "production";

if (isDevelopment) {
  const compiler = webpack(webpackConfig);
  app.use(
    webpackDevMiddleware(compiler, {
      publicPath: webpackConfig.output.publicPath,
      writeToDisk: true,
    })
  );
  app.use(webpackHotMiddleware(compiler));
}

app.use(express.static(path.resolve(process.cwd(), "____public____")));

app.get(/^\/____rsc_payload____\/.*\/?$/, async (req, res) => {
  try {
    const reqPath = (
      req.path.endsWith("/") ? req.path : req.path + "/"
    ).replace("/____rsc_payload____", "");
    jsx = await getSSGJSXOrJSX(reqPath, { ...req.query });
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

// Render HTML via child process, returning a stream
function renderAppToHtml(reqPath, paramsString) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [
      path.resolve(__dirname, "render-html.js"),
      reqPath,
      paramsString,
    ]);

    let errorOutput = "";
    child.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    child.on("error", (error) => {
      reject(new Error(`Failed to start child process: ${error.message}`));
    });

    child.on("spawn", () => {
      resolve(child.stdout);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        try {
          const errorResult = JSON.parse(errorOutput);
          reject(new Error(errorResult.error || errorOutput));
        } catch {
          reject(new Error(`Child process failed: ${errorOutput}`));
        }
      }
    });
  });
}

app.get(/^\/.*\/?$/, async (req, res) => {
  try {
    const reqPath = req.path.endsWith("/") ? req.path : req.path + "/";
    // Get the stream from the child process
    const appHtmlStream = await renderAppToHtml(
      reqPath,
      JSON.stringify({ ...req.query })
    );
    // Set headers for the response
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

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
