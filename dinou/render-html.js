const { register } = require("esbuild-register/dist/node");
register({
  target: "esnext",
  format: "cjs",
  extensions: [".js", ".jsx", ".ts", ".tsx"],
});
const createScopedName = require("./createScopedName");
require("css-modules-require-hook")({
  generateScopedName: createScopedName,
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

try {
  renderToStream();
} catch (error) {
  process.stderr.write(JSON.stringify({ error: error.message }));
  process.exit(1);
}
