require("./register-paths");
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
const addHook = require("./asset-require-hook.js");
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

const { renderToPipeableStream } = require("react-dom/server");
const { getJSX, getSSGJSX } = require("./get-jsx");
const { renderJSXToClientJSX } = require("./render-jsx-to-client-jsx");

// Render the app to a stream
async function renderToStream() {
  try {
    const reqPath = process.argv[2];
    const query = JSON.parse(process.argv[3]);

    const jsx = Object.keys(query).length
      ? renderJSXToClientJSX(await getJSX(reqPath, query))
      : getSSGJSX(reqPath) ??
        renderJSXToClientJSX(await getJSX(reqPath, query));

    const stream = renderToPipeableStream(jsx, {
      onError(error) {
        console.error("Render error:", error);
        process.stderr.write(JSON.stringify({ error: error.message }));
        process.exit(1);
      },
      onShellReady() {
        stream.pipe(process.stdout);
      },
      bootstrapScripts: ["/main.js"],
    });
  } catch (error) {
    process.stderr.write(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}

process.on("uncaughtException", (error) => {
  process.stderr.write(JSON.stringify({ error: error.message }));
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  process.stderr.write(
    JSON.stringify({ error: reason.message || "Unhandled promise rejection" })
  );
  process.exit(1);
});

renderToStream();
