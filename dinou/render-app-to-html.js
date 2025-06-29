const path = require("path");
const { spawn } = require("child_process");

function renderAppToHtml(reqPath, paramsString) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "node",
      [path.resolve(__dirname, "render-html.js"), reqPath, paramsString],
      {
        env: {
          ...process.env,
        },
      }
    );

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

module.exports = renderAppToHtml;
