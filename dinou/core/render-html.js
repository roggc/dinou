require("./register-paths");
require("./register-hooks.js");
const babelPluginRegisterImports = require("./babel-plugin-register-imports.js");
const babelRegister = require("@babel/register");
babelRegister({
  ignore: [/node_modules[\\/](?!dinou)/],
  presets: [
    ["@babel/preset-react", { runtime: "automatic" }],
    "@babel/preset-typescript",
  ],
  plugins: [babelPluginRegisterImports, "@babel/transform-modules-commonjs"],
  extensions: [".js", ".jsx", ".ts", ".tsx"],
});
const addHook = require("./asset-require-hook.js");
const { extensions } = require("./asset-extensions.js");
const createScopedName = require("./createScopedName");
require("css-modules-require-hook")({
  generateScopedName: createScopedName,
});
addHook({
  extensions,
  name: function (localName, filepath) {
    const result = createScopedName(localName, filepath);
    return result + ".[ext]";
  },
  publicPath: "/assets/",
});
const getAssetFromManifest = require("./get-asset-from-manifest.js");
const { renderToPipeableStream } = require("react-dom/server");
const getJSX = require("./get-jsx");
const getSSGJSX = require("./get-ssg-jsx.js");
const { getErrorJSX } = require("./get-error-jsx");
const { renderJSXToClientJSX } = require("./render-jsx-to-client-jsx");
const isDevelopment = process.env.NODE_ENV !== "production";
const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";
const { requestStorage } = require("./request-context.js");
const { createResponseProxy } = require("./context-proxy.js");

function formatErrorHtml(error) {
  const message = error.message || "Unknown error";
  const stack = error.stack
    ? error.stack.replace(/\n/g, "<br>").replace(/\s/g, "&nbsp;")
    : "No stack trace available";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f8f8f8;
          color: #333;
        }
        .error-container {
          max-width: 800px;
          margin: 0 auto;
          background-color: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .error-title {
          color: #d32f2f;
          font-size: 24px;
          margin-bottom: 10px;
        }
        .error-message {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .error-stack {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          font-family: Consolas, monospace;
          font-size: 14px;
          overflow-x: auto;
        }
        .error-footer {
          margin-top: 20px;
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="error-container">
        <h1 class="error-title">An Error Occurred</h1>
        <p class="error-message">${message}</p>
        <div class="error-stack">${stack}</div>
      </div>
    </body>
    </html>
  `;
}

function formatErrorHtmlProduction(error) {
  const escapedMessage = JSON.stringify(`Render error: ${error.message}`);
  const escapedStack = JSON.stringify(error.stack || "");

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body>
        <script>
          console.error(${escapedMessage} + "\\n" + ${escapedStack});
        </script>
      </body>
    </html>
  `;
}

function writeErrorOutput(error, isProd) {
  process.stdout.write(
    isProd ? formatErrorHtmlProduction(error) : formatErrorHtml(error),
  );
  process.stderr.write(
    JSON.stringify({ error: error.message, stack: error.stack }),
  );
}

async function renderToStream(
  reqPath,
  query,
  serializedBox,
  isDynamic,
  hasJsxJson,
  jsxJson,
) {
  const context = {
    req: serializedBox.req,
    res: createResponseProxy(),
  };
  await requestStorage.run(context, async () => {
    try {
      const isNotFound = {};
      const jsx =
        /*Object.keys(query).length ||*/ isDevelopment ||
        isDynamic ||
        !hasJsxJson
          ? renderJSXToClientJSX(
              await getJSX(reqPath, query, isNotFound, isDevelopment),
            )
          : ((await getSSGJSX(jsxJson)) ??
            renderJSXToClientJSX(
              await getJSX(reqPath, query, isNotFound, isDevelopment),
            ));
      if (isNotFound.value) {
        context.res.status(404);
      }
      const stream = renderToPipeableStream(jsx, {
        onError(error) {
          process.nextTick(async () => {
            if (stream && !stream.destroyed) {
              try {
                stream.unpipe(process.stdout);
                stream.destroy();
              } catch {}
            }
            const isProd = process.env.NODE_ENV === "production";

            try {
              const errorJSX = await getErrorJSX(
                reqPath,
                query,
                error,
                isDevelopment,
              );

              if (!context.res.headersSent) context.res.status(500);

              if (errorJSX === undefined) {
                writeErrorOutput(error, isProd);
                process.exit(1);
              }

              const errorStream = renderToPipeableStream(errorJSX, {
                onShellReady() {
                  errorStream.pipe(process.stdout);
                },
                onError(err) {
                  console.error("Error rendering error JSX:", err);
                  writeErrorOutput(error, isProd);
                  process.exit(1);
                },
                // bootstrapModules: [getAssetFromManifest("error.js")],
                bootstrapModules: isDevelopment
                  ? [
                      getAssetFromManifest("error.js"),
                      isWebpack
                        ? undefined
                        : getAssetFromManifest("runtime.js"),
                    ].filter(Boolean)
                  : [getAssetFromManifest("error.js")],
                bootstrapScriptContent: `window.__DINOU_ERROR_MESSAGE__=${JSON.stringify(
                  error.message || "Unknown error",
                )};window.__DINOU_ERROR_NAME__=${JSON.stringify(error.name)};${
                  isDevelopment
                    ? `window.__DINOU_ERROR_STACK__=${JSON.stringify(
                        error.stack || "No stack trace available",
                      )};`
                    : ""
                }${
                  isDevelopment
                    ? `window.HMR_WEBSOCKET_URL="ws://localhost:3001";`
                    : ""
                }`,
              });
            } catch (err) {
              console.error("Render error (no error.tsx?):", err);
              writeErrorOutput(error, isProd);
              process.exit(1);
            }
          });
        },
        onShellReady() {
          stream.pipe(process.stdout);
        },
        bootstrapModules: isDevelopment
          ? [
              getAssetFromManifest("main.js"),
              isWebpack ? undefined : getAssetFromManifest("runtime.js"),
            ].filter(Boolean)
          : [getAssetFromManifest("main.js")],
        ...(isDevelopment
          ? {
              bootstrapScriptContent: `window.HMR_WEBSOCKET_URL="ws://localhost:3001";`,
            }
          : {}),
      });
    } catch (error) {
      if (context && context.res && typeof context.res.status === "function") {
        if (!context.res.headersSent) context.res.status(500);
      }
      process.stdout.write(formatErrorHtml(error));
      process.stderr.write(
        JSON.stringify({
          error: error.message,
          stack: error.stack,
        }),
      );
      process.exit(1);
    }
  });
}

const reqPath = process.argv[2] || "/";
const query = JSON.parse(process.argv[3] || "{}");
const serializedBox = JSON.parse(process.argv[4] || "{}");
const isDynamic = process.argv[5] === "true";
const hasJsxJson = process.argv[6] === "true";
const jsxJson = JSON.parse(process.argv[7] || "{}");

process.on("uncaughtException", (error) => {
  process.stdout.write(formatErrorHtml(error));
  process.stderr.write(
    JSON.stringify({
      error: error.message,
      stack: error.stack,
    }),
  );
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  process.stdout.write(formatErrorHtml(error));
  process.stderr.write(
    JSON.stringify({
      error: error.message,
      stack: error.stack,
    }),
  );
  process.exit(1);
});

renderToStream(
  reqPath,
  query,
  serializedBox,
  isDynamic,
  hasJsxJson,
  jsxJson,
).catch((err) => {
  console.error("❌ Fatal error starting render stream:", err);
  process.exit(1);
});
