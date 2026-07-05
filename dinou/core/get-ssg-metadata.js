function processMetadata(effects) {
  if (!effects) return "";

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

module.exports = {
  processMetadata,
};
