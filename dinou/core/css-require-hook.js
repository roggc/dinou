const fs = require("fs");
const postcss = require("postcss");
const createScopedName = require("./createScopedName");

function registerCSSRequireHook() {
  require.extensions[".css"] = function (module, filename) {
    const cssContent = fs.readFileSync(filename, "utf8");
    const jsonResult = {};

    const plugin = {
      postcssPlugin: "extract-classes",
      Rule(rule) {
        // Ignorar clases dentro de animaciones (@keyframes)
        if (rule.parent && rule.parent.name === "keyframes") {
          return;
        }

        const selector = rule.selector;
        // Regex para capturar nombres de clases válidos
        const classRegex = /\.([_a-zA-Z0-9-]+)/g;
        let match;

        while ((match = classRegex.exec(selector)) !== null) {
          const className = match[1];

          // Manejo de selectores :global y :local
          const index = match.index;
          const before = selector.slice(0, index);
          const lastGlobal = before.lastIndexOf(":global");
          const lastLocal = before.lastIndexOf(":local");

          // Si la clase está bajo el ámbito de un :global activo, no la hasheamos
          if (lastGlobal > lastLocal) {
            const afterGlobal = before.slice(lastGlobal);
            if (afterGlobal.includes("(")) {
              const openParens = afterGlobal.split("(").length - 1;
              const closeParens = afterGlobal.split(")").length - 1;
              if (openParens > closeParens) {
                jsonResult[className] = className;
                continue;
              }
            } else {
              // Ejemplo: :global .my-class (sin paréntesis)
              jsonResult[className] = className;
              continue;
            }
          }

          // Si es una clase local, generamos el hash determinista correspondiente
          if (!jsonResult[className]) {
            jsonResult[className] = createScopedName(className, filename);
          }
        }
      }
    };

    // Procesamos de forma estrictamente síncrona (PostCSS es síncrono si sus plugins lo son)
    postcss([plugin]).process(cssContent, { from: filename }).css;

    module.exports = jsonResult;
  };
}

module.exports = registerCSSRequireHook;
