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
        // Ignore classes inside animations (@keyframes)
        if (rule.parent && rule.parent.name === "keyframes") {
          return;
        }

        const selector = rule.selector;
        // Regex to capture valid class names
        const classRegex = /\.([_a-zA-Z0-9-]+)/g;
        let match;

        while ((match = classRegex.exec(selector)) !== null) {
          const className = match[1];

          // Handle :global and :local selectors
          const index = match.index;
          const before = selector.slice(0, index);
          const lastGlobal = before.lastIndexOf(":global");
          const lastLocal = before.lastIndexOf(":local");

          // If the class is under an active :global scope, do not hash it
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
              // Example: :global .my-class (without parentheses)
              jsonResult[className] = className;
              continue;
            }
          }

          // If it is a local class, generate the corresponding deterministic hash
          if (!jsonResult[className]) {
            jsonResult[className] = createScopedName(className, filename);
          }
        }
      }
    };

    // Process strictly synchronously (PostCSS is synchronous if its plugins are)
    postcss([plugin]).process(cssContent, { from: filename }).css;

    module.exports = jsonResult;
  };
}

module.exports = registerCSSRequireHook;
