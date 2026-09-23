// dinou/adapters/bun-plugin.js
// Runtime plugin for native Bun adapter in Dinou.
// Intercepts "use client" components so they are treated as Client References in React Server Components,
// and provides shims for React 19 JSX runtime in Bun.

import { plugin } from "bun";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { Readable } from "node:stream";

if (typeof globalThis !== "undefined") {
  globalThis.__DINOU_RUNTIME__ = "bun";
}
process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Bun WebStreams adapter fix:
// Prevent unhandled "TypeError: Invalid state: Controller is already closed"
// when node streams write after stream completion or reader cancellation.
if (Readable && typeof Readable.toWeb === "function") {
  const originalToWeb = Readable.toWeb;
  Readable.toWeb = function safeToWeb(nodeStream) {
    if (!nodeStream || typeof nodeStream.on !== "function") {
      return originalToWeb.call(Readable, nodeStream);
    }
    let isClosed = false;
    let isEnded = false;
    return new ReadableStream({
      start(controller) {
        function onData(chunk) {
          if (isClosed || isEnded) return;
          try {
            controller.enqueue(chunk);
            if (controller.desiredSize !== null && controller.desiredSize <= 0) {
              if (typeof nodeStream.pause === "function") nodeStream.pause();
            }
          } catch (e) {
            isClosed = true;
            cleanup();
          }
        }
        function onDrain() {
          if (isClosed || isEnded) return;
          if (typeof nodeStream.resume === "function") nodeStream.resume();
        }
        function onEnd() {
          if (isClosed || isEnded) return;
          isEnded = true;
          cleanup();
          try {
            controller.close();
          } catch (e) {}
        }
        function onError(err) {
          if (isClosed || isEnded) return;
          isClosed = true;
          cleanup();
          try {
            controller.error(err);
          } catch (e) {}
        }
        function cleanup() {
          if (typeof nodeStream.removeListener === "function") {
            nodeStream.removeListener("data", onData);
            nodeStream.removeListener("drain", onDrain);
            nodeStream.removeListener("end", onEnd);
            nodeStream.removeListener("error", onError);
            nodeStream.removeListener("close", onEnd);
          }
        }
        nodeStream.on("data", onData);
        nodeStream.on("drain", onDrain);
        nodeStream.on("end", onEnd);
        nodeStream.on("error", onError);
        nodeStream.on("close", onEnd);
      },
      pull(controller) {
        if (!isClosed && !isEnded && typeof nodeStream.resume === "function") {
          nodeStream.resume();
        }
      },
      cancel(reason) {
        isClosed = true;
        if (typeof nodeStream.destroy === "function") {
          nodeStream.destroy();
        }
      }
    });
  };
}

const require = createRequire(import.meta.url);
let parseExports;
try {
  parseExports = require("../core/parse-exports.js");
} catch (e) {
  parseExports = () => ["default"];
}

const useClientRegex =
  /^\s*(?:(?:\/\/[^\n]*\n\s*)|(?:\/\*[\s\S]*?\*\/\s*))*['"]use client['"]/;

function getLoader(filePath) {
  const ext = path.extname(filePath);
  if (ext === ".tsx") return "tsx";
  if (ext === ".ts") return "ts";
  if (ext === ".jsx") return "jsx";
  return "js";
}

plugin({
  name: "dinou-bun-jsx-runtime-shim",
  setup(build) {
    build.onLoad({ filter: /jsx-(?:dev-)?runtime\.react-server\.js$/ }, (args) => {
      const isDev = args.path.includes("jsx-dev-runtime");
      const isProd = process.env.NODE_ENV === "production";
      const file = isDev
        ? "./cjs/react-jsx-dev-runtime.react-server.development.js"
        : (isProd ? "./cjs/react-jsx-runtime.react-server.production.js" : "./cjs/react-jsx-runtime.react-server.development.js");
      return {
        contents: `
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const mod = require(${JSON.stringify(file)});
export const jsx = mod.jsx;
export const jsxs = mod.jsxs;
export const Fragment = mod.Fragment;
export const jsxDEV = mod.jsxDEV;
export default mod;
`,
        loader: "js",
      };
    });
  },
});

plugin({
  name: "dinou-bun-react-server-shim",
  setup(build) {
    build.onLoad({ filter: /react\.react-server\.js$/ }, () => {
      const isProd = process.env.NODE_ENV === "production";
      const modPath = isProd
        ? "./cjs/react.react-server.production.js"
        : "./cjs/react.react-server.development.js";
      const clientModPath = isProd
        ? "./cjs/react.production.js"
        : "./cjs/react.development.js";

      // Dynamically discover all exports from installed React package
      let dynamicExports = "";
      try {
        const reactPkg = require.resolve("react/package.json");
        const reactDir = path.dirname(reactPkg);
        const serverMod = require(path.join(reactDir, modPath));
        const clientMod = require(path.join(reactDir, clientModPath));
        const allKeys = Array.from(new Set([...Object.keys(serverMod), ...Object.keys(clientMod)]));
        dynamicExports = allKeys
          .filter((k) => k !== "default" && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k))
          .map((k) => `export const ${k} = mod.${k} !== undefined ? mod.${k} : clientMod.${k};`)
          .join("\n");
      } catch (e) {}

      return {
        contents: `
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const mod = require(${JSON.stringify(modPath)});
const clientMod = require(${JSON.stringify(clientModPath)});

${dynamicExports}

export default {
  ...clientMod,
  ...mod,
};
`,
        loader: "js",
      };
    });
  },
});

const useServerRegex =
  /^\s*(?:(?:\/\/[^\n]*\n\s*)|(?:\/\*[\s\S]*?\*\/\s*))*['"]use server['"]/;

plugin({
  name: "dinou-bun-rsc-modules",
  setup(build) {
    build.onLoad(
      { filter: /(?:[\\/]src[\\/].*|[\\/]dinou[\\/]core[\\/](?:navigation|link|client-redirect))\.[jt]sx?$/ },
      (args) => {
        let source;
        try {
          source = fs.readFileSync(args.path, "utf8");
        } catch (e) {
          return { contents: "", loader: "js" };
        }

        if (useClientRegex.test(source)) {
          let exports = [];
          try {
            exports = parseExports(source);
          } catch (e) {
            exports = ["default"];
          }

          const url = pathToFileURL(args.path).href;
          let newSrc = `import { createRequire } from "node:module";\n`;
          newSrc += `const require = createRequire(import.meta.url);\n`;
          newSrc += `const { registerClientReference } = require("@roggc/react-server-dom-esm/server.node.js");\n`;

          for (const name of exports) {
            if (name === "default") {
              newSrc += `export default registerClientReference(function() { throw new Error("Attempted to call client component from server: " + ${JSON.stringify(url)}); }, ${JSON.stringify(url)}, "default");\n`;
            } else {
              newSrc += `export const ${name} = registerClientReference(function() { throw new Error("Attempted to call client component from server: " + ${JSON.stringify(url)}); }, ${JSON.stringify(url)}, ${JSON.stringify(name)});\n`;
            }
          }

          if (!exports.includes("default")) {
            newSrc += `export default registerClientReference(function() { throw new Error("Attempted to call client component from server: " + ${JSON.stringify(url)}); }, ${JSON.stringify(url)}, "default");\n`;
          }

          return {
            contents: newSrc,
            loader: "js",
          };
        }

        if (useServerRegex.test(source)) {
          let exports = [];
          try {
            exports = parseExports(source);
          } catch (e) {
            exports = [];
          }

          const relativePath = path.relative(process.cwd(), args.path).replace(/\\/g, "/");
          const relativeFileUrl = "file:///" + (relativePath.startsWith("/") ? relativePath.slice(1) : relativePath);

          let newSrc = source + "\n\n";
          newSrc += `import { createRequire as __createRequire } from "node:module";\n`;
          newSrc += `const __require = __createRequire(import.meta.url);\n`;
          newSrc += `const { registerServerReference: __registerServerReference } = __require("@roggc/react-server-dom-esm/server.node.js");\n`;

          for (const name of exports) {
            if (name !== "default") {
              newSrc += `try { if (typeof ${name} !== "undefined") __registerServerReference(${name}, ${JSON.stringify(relativeFileUrl)}, ${JSON.stringify(name)}); } catch(e){}\n`;
            }
          }

          return {
            contents: newSrc,
            loader: getLoader(args.path),
          };
        }

        return { contents: source, loader: getLoader(args.path) };
      }
    );
  },
});
