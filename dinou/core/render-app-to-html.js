const path = require("path");
const { spawn } = require("child_process");
const url = require("url");

function toFileUrl(p) {
  // Convierte a file://, cross-platform
  return url.pathToFileURL(p).href;
}

const registerLoaderPath = toFileUrl(
  path.join(__dirname, "register-loader.mjs")
);
const renderHtmlPath = path.resolve(__dirname, "render-html.js");

function renderAppToHtml(reqPath, paramsString, cookiesString = "{}") {
  const child = spawn(
    "node",
    [
      "--import",
      registerLoaderPath,
      renderHtmlPath,
      reqPath,
      paramsString,
      cookiesString,
    ],
    {
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"], // stdin, stdout, stderr
    }
  );

  // Capturamos errores del child
  child.on("error", (err) => {
    console.error("Failed to start child process:", err);
  });

  // Opcional: puedes escuchar stderr y loguear
  child.stderr.on("data", (chunk) => {
    console.error(chunk.toString());
  });

  return child.stdout; // <-- aquí devuelves un stream legible
}

module.exports = renderAppToHtml;
