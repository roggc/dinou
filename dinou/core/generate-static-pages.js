// generate-static-pages.js
const path = require("path");
const { mkdirSync, createWriteStream } = require("fs");
const renderAppToHtml = require("./render-app-to-html.js");
const getSSGMetadata = require("./get-ssg-metadata.js");
const { updateStatus } = require("./status-manifest.js");

const OUT_DIR = path.resolve("dist2");

async function generateStaticPages(routes) {
  for (const route of routes) {
    // Normalization of the route
    const reqPath = route.endsWith("/") ? route : route + "/";
    const htmlPath = path.join(OUT_DIR, reqPath, "index.html");

    // Prepare Query params (empty by default in SSG, unless your router supports it)
    const query = {};
    const paramsString = JSON.stringify(query);
    const capturedStatus = {};
    // ---------------------------------------------------------
    // 1. CREATE MOCK REQUEST (Solution to your second question)
    // ---------------------------------------------------------
    const contextForChild = {
      req: {
        query,
        cookies: {}, // No cookies at build time
        headers: {
          "user-agent": "Dinou-SSG-Builder",
          host: "localhost", // Safe default value
          "x-forwarded-proto": "http",
        },
        path: reqPath, // 💡 Vital for active menu logic, etc.
        method: "GET",
      },
      // We do not pass 'res' here, the child ignores it, we pass the mockRes as an argument
    };

    try {
      mkdirSync(path.dirname(htmlPath), { recursive: true });
      const fileStream = createWriteStream(htmlPath);
      let htmlStream = null; // Declare outside to use in the closure

      // ---------------------------------------------------------
      // 2. CREATE MOCK RESPONSE (With Fix for Webpack)
      // ---------------------------------------------------------
      const mockRes = {
        headersSent: true, // Force "streaming/script injection" mode
        _cookies: [], // Optional: for debug

        // 👇 ADD THIS METHOD
        cookie(name, value, options) {
          // In SSG we don't do anything real, but we save a record if you want to debug
          // console.log(`[SSG] Cookie set ignored: ${name}=${value}`);
          this._cookies.push({ name, value, options });
        },

        write: (chunk) => {
          if (!fileStream.writableEnded) fileStream.write(chunk);
        },

        end: (chunk) => {
          // If they send us a last chunk (e.g., </script>)
          if (chunk && !fileStream.writableEnded) fileStream.write(chunk);

          // 🔥 WEBPACK "WRITE AFTER END" FIX:
          // Disconnect the child's stream immediately.
          // If Webpack sends garbage afterwards, it won't reach the fileStream.
          if (htmlStream) {
            htmlStream.unpipe(fileStream);
            // Optional: Pause or destroy the child's stream to free memory
            // htmlStream.destroy();
          }

          // Officially close the file
          if (!fileStream.writableEnded) fileStream.end();
        },

        status: (code) => {
          if (code !== 200)
            console.warn(`[SSG] Status ${code} ignored for ${reqPath}`);
          capturedStatus.value = code;
        },
        setHeader: () => {},
        clearCookie: () => {},
        redirect: () => {},
      };

      // 3. Execute Render
      htmlStream = renderAppToHtml(
        reqPath,
        paramsString,
        contextForChild, // ✅ Pass the MockReq
        mockRes,
        capturedStatus
      );

      const sideEffectScripts = getSSGMetadata(reqPath);
      await new Promise((resolve, reject) => {
        // 🟢 SCRIPT INJECTION
        if (sideEffectScripts) {
          fileStream.write(sideEffectScripts);
        }
        // Connect standard output to the file
        htmlStream.pipe(fileStream, { end: false }); // end: false gives us manual control in the mockRes

        // Event handling
        htmlStream.on("end", () => {
          if (!fileStream.writableEnded) fileStream.end();
          updateStatus(reqPath, capturedStatus.value);
          resolve();
        });

        htmlStream.on("error", (err) => {
          // If the error is "write after end" and we already closed, ignore it (it's noise)
          if (err.code === "ERR_STREAM_WRITE_AFTER_END") {
            resolve();
          } else {
            reject(err);
          }
        });

        fileStream.on("error", reject);
      });

      console.log("✅ Generated HTML:", reqPath);
    } catch (error) {
      // Extra safety filter in case the error bubbles up here
      if (error.code === "ERR_STREAM_WRITE_AFTER_END") {
        console.log("⚠️ Ignored write-after-end race condition for:", reqPath);
      } else {
        console.error("❌ Error rendering:", reqPath);
        console.error(error.message);
      }
    }
  }

  console.log("🟢 Static page generation complete.");
}

module.exports = generateStaticPages;
