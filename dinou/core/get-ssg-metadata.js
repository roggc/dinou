const path = require("path");
const { existsSync, readFileSync } = require("fs");

function processMetadata(metadata) {
  if (!metadata || !metadata.effects) return "";

  const { effects } = metadata;
  let scriptContent = "";

  // 1. Procesar Cookies
  if (effects.cookies && effects.cookies.length > 0) {
    effects.cookies.forEach((ck) => {
      const name = JSON.stringify(ck.name);
      const value = JSON.stringify(ck.value || "");
      const path = JSON.stringify(ck.options?.path || "/");

      if (ck.isClear) {
        // Opción clearCookie
        scriptContent += `document.cookie = ${name} + "=; Max-Age=0; path=" + ${path} + ";";`;
      } else {
        // Opción setCookie
        scriptContent += `document.cookie = ${name} + "=" + ${value} + "; path=" + ${path} + ";";`;
      }
    });
  }

  // 2. Procesar Redirección
  if (effects.redirect) {
    scriptContent += `window.location.href = "${effects.redirect}";`;
  }

  if (!scriptContent) return "";

  // Envolvemos en un IIFE para evitar contaminar el scope global
  return `<script>(function(){ ${scriptContent} })();</script>`;
}

function getSSGMetadata(reqPath) {
  const distFolder = path.resolve(process.cwd(), "dist");
  const jsonPath = path.join(distFolder, reqPath, "index.json");
  if (existsSync(jsonPath)) {
    const { metadata } = JSON.parse(readFileSync(jsonPath, "utf8"));
    const script = processMetadata(metadata);
    return script;
  }
}

module.exports = getSSGMetadata;
