const fs = require("fs");
const path = require("path");
const { transformAsync } = require("@babel/core");
const { fileURLToPath, pathToFileURL } = require("url");
const createScopedName = require("./createScopedName");
const { extensionsWithDot } = require("./asset-extensions.js");
const { getAbsPathWithExt } = require("./get-abs-path-with-ext.js");

const Module = require("module");
const originalResolveFilename = Module._resolveFilename;
const isWebpack = process.env.DINOU_BUILD_TOOL === "webpack";

let reactServerPath, reactDomServerPath, reactJsxRuntimePath, reactJsxDevRuntimePath;

if (!isWebpack) {
  const reactPkgJson = require.resolve("react/package.json");
  reactServerPath = path.join(path.dirname(reactPkgJson), "react.react-server.js");
  reactJsxRuntimePath = path.join(path.dirname(reactPkgJson), "jsx-runtime.react-server.js");
  reactJsxDevRuntimePath = path.join(path.dirname(reactPkgJson), "jsx-dev-runtime.react-server.js");

  const reactDomPkgJson = require.resolve("react-dom/package.json");
  reactDomServerPath = path.join(path.dirname(reactDomPkgJson), "react-dom.react-server.js");
}

Module._resolveFilename = function (request, parent, isMain, options) {
  if (!isWebpack) {
    if (request === "react") {
      return reactServerPath;
    } else if (request === "react-dom") {
      return reactDomServerPath;
    } else if (request === "react/jsx-runtime") {
      return reactJsxRuntimePath;
    } else if (request === "react/jsx-dev-runtime") {
      return reactJsxDevRuntimePath;
    }
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require("./css-require-hook.js")();

exports.resolve = async function resolve(specifier, context, defaultResolve) {
  const absPathWithExt = getAbsPathWithExt(specifier, context);
  if (absPathWithExt) {
    const url = pathToFileURL(absPathWithExt).href;

    return {
      url,
      shortCircuit: true,
    };
  }

  // Fallback to default resolver
  return defaultResolve(specifier, context, defaultResolve);
};

exports.load = async function load(url, context, defaultLoad) {
  // --- 🟢 Handle non-JS assets (png, jpg, etc.)
  const assetExts = extensionsWithDot;
  const ext = path.extname(url.split("?")[0]); // remove search params if any

  if (assetExts.includes(ext)) {
    // Return a tiny stub that mimics what asset-require-hook would do
    const filepath = fileURLToPath(url);
    const localName = path.basename(filepath, ext);
    const hashedName = createScopedName(localName, filepath);
    const virtualExport = `export default "/assets/${hashedName}${ext}";`;

    return {
      format: "module",
      source: virtualExport,
      shortCircuit: true,
      url,
    };
  }

  if (ext === ".css") {
    const mod = require(fileURLToPath(url));
    const source = `export default ${JSON.stringify(mod)};`;
    return { format: "module", source, shortCircuit: true, url };
  }

  const cleanUrl = url.split("?")[0];
  if (/\.(jsx|tsx|ts|js)$/.test(cleanUrl)) {
    let filename;
    try {
      filename = fileURLToPath(
        cleanUrl.startsWith("file://") ? cleanUrl : pathToFileURL(cleanUrl).href
      );
    } catch (e) {
      throw e;
    }
    const rel = path.relative(process.cwd(), filename);
    const source = fs.readFileSync(filename, "utf-8");
    const urlToReturn = pathToFileURL(filename).href;

    const useClientRegex =
      /^\s*(?:(?:\/\/[^\n]*\n\s*)|(?:\/\*[\s\S]*?\*\/\s*))*['"]use client['"]/;
    const hasUseClient = useClientRegex.test(source);

    const esmSyntaxRegex = /^(?:import|export)\b/m;
    const hasESMSyntax = esmSyntaxRegex.test(source);

    if (ext === ".js" && !rel.startsWith("src" + path.sep) && !hasESMSyntax) {
      return defaultLoad(url, context, defaultLoad);
    }

    const isReactServer = process.execArgv.some(arg => arg.includes("react-server"));
    if (isReactServer && hasUseClient) {
      const parseExports = require("./parse-exports.js");
      const exports = parseExports(source);
      let newSrc = "";
      if (isWebpack) {
        newSrc += 'import { registerClientReference } from "react-server-dom-webpack/server";\n';
      } else {
        const packageJsonPath = require.resolve("@roggc/react-server-dom-esm/package.json");
        const serverNodePath = path.join(path.dirname(packageJsonPath), "server.node.js");
        const serverNodeUrl = pathToFileURL(serverNodePath).href;
        newSrc += `import pkg from ${JSON.stringify(serverNodeUrl)};\n`;
        newSrc += 'const {registerClientReference} = pkg;\n';
      }
      for (const name of exports) {
        if (name === 'default') {
          newSrc += 'export default ';
          newSrc += 'registerClientReference(function() {';
          newSrc += 'throw new Error(' + JSON.stringify("Attempted to call the default export of " + urlToReturn + " from the server but it's on the client.") + ');';
          newSrc += '},';
          newSrc += JSON.stringify(urlToReturn) + ',';
          newSrc += JSON.stringify(name) + ');\n';
        } else {
          newSrc += 'export const ' + name + ' = ';
          newSrc += 'registerClientReference(function() {';
          newSrc += 'throw new Error(' + JSON.stringify("Attempted to call " + name + "() from the server but " + name + " is on the client.") + ');';
          newSrc += '},';
          newSrc += JSON.stringify(urlToReturn) + ',';
          newSrc += JSON.stringify(name) + ');\n';
        }
      }
      return {
        format: "module",
        source: newSrc,
        shortCircuit: true,
        url: urlToReturn,
      };
    }

    const { useServerRegex } = require("../constants.js");
    const hasUseServer = useServerRegex.test(source);

    if (isReactServer && hasUseServer) {
      const parseExports = require("./parse-exports.js");
      const exports = parseExports(source);

      const { code } = await transformAsync(source, {
        filename,
        presets: [
          ["@babel/preset-react", { runtime: "automatic" }],
          "@babel/preset-typescript",
        ],
        sourceMaps: "inline",
        ast: false,
      });

      let newSrc = code + "\n\n";

      if (!isWebpack) {
        const packageJsonPath = require.resolve("@roggc/react-server-dom-esm/package.json");
        const serverNodePath = path.join(path.dirname(packageJsonPath), "server.node.js");
        const serverNodeUrl = pathToFileURL(serverNodePath).href;
        newSrc += `import pkgServer from ${JSON.stringify(serverNodeUrl)};\n`;
        newSrc += 'const {registerServerReference} = pkgServer;\n';
      }

      const relativeFileUrl = "file:///" + rel.replace(/\\/g, "/");
      for (const name of exports) {
        if (name !== 'default') {
          newSrc += `registerServerReference(${name}, ${JSON.stringify(relativeFileUrl)}, ${JSON.stringify(name)});\n`;
        }
      }

      return {
        format: "module",
        source: newSrc,
        shortCircuit: true,
        url: urlToReturn,
      };
    }

    if (ext === ".js") {
      return {
        format: "module",
        source,
        shortCircuit: true,
        url,
      };
    }

    const { code } = await transformAsync(source, {
      filename,
      presets: [
        ["@babel/preset-react", { runtime: "automatic" }],
        "@babel/preset-typescript",
      ],
      sourceMaps: "inline",
      ast: false,
    });

    // const urlToReturn = pathToFileURL(filename).href;

    return {
      format: "module",
      source: code,
      shortCircuit: true,
      url: urlToReturn,
    };
  }

  if (url) {
    return defaultLoad(url, context, defaultLoad);
  }
};
