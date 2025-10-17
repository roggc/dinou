const path = require("path");
const { spawn } = require("child_process");
const url = require("url");

function toFileUrl(p) {
  // Convierte a file://, cross-platform
  return url.pathToFileURL(p).href;
}

// function renderAppToHtml(reqPath, paramsString, cookiesString = "{}") {
//   return new Promise((resolve, reject) => {
//     const child = spawn(
//       "node",
//       [
//         "--loader",
//         path.resolve(__dirname, "babel-esm-loader.js"),
//         path.resolve(__dirname, "render-html.js"),
//         reqPath,
//         paramsString,
//         cookiesString,
//       ],
//       {
//         env: {
//           ...process.env,
//         },
//       }
//     );

//     let errorOutput = "";
//     child.stderr.on("data", (data) => {
//       errorOutput += data.toString();
//     });

//     child.on("error", (error) => {
//       reject(new Error(`Failed to start child process: ${error.message}`));
//     });

//     child.on("spawn", () => {
//       resolve(child.stdout);
//     });

//     child.on("close", (code) => {
//       if (code !== 0) {
//         try {
//           const errorResult = JSON.parse(errorOutput);
//           reject(new Error(errorResult.error || errorOutput));
//         } catch {
//           reject(new Error(`Child process failed: ${errorOutput}`));
//         }
//       }
//     });
//   });
// }

// const loaderPath = toFileUrl(path.join(__dirname, "babel-esm-loader.js"));
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
