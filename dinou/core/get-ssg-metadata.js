const { getJSXJSON, hasJSXJSON } = require("./jsx-json");

function processMetadata(metadata) {
  if (!metadata || !metadata.effects) return "";

  const { effects } = metadata;
  let scriptContent = "";

  if (effects.cookies && effects.cookies.length > 0) {
    effects.cookies.forEach((ck) => {
      const name = JSON.stringify(ck.name);
      const value = JSON.stringify(ck.value || "");
      const path = JSON.stringify(ck.options?.path || "/");

      if (ck.isClear) {
        scriptContent += `document.cookie = ${name} + "=; Max-Age=0; path=" + ${path} + ";";`;
      } else {
        scriptContent += `document.cookie = ${name} + "=" + ${value} + "; path=" + ${path} + ";";`;
      }
    });
  }

  if (effects.redirect) {
    scriptContent += `window.location.href = "${effects.redirect}";`;
  }

  if (!scriptContent) return "";

  return `<script>(function(){ ${scriptContent} })();</script>`;
}

function getSSGMetadata(reqPath) {
  if (!hasJSXJSON(reqPath)) return;
  const { metadata } = getJSXJSON(reqPath);
  const script = processMetadata(metadata);
  return script;
}

module.exports = getSSGMetadata;
