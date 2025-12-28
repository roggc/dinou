// babel-plugin-register-imports.js
const { getAbsPathWithExt } = require("./get-abs-path-with-ext.js");
const { pathToFileURL } = require("url");

module.exports = function ({ types: t }) {
  return {
    visitor: {
      ImportDeclaration(pathNode, state) {
        const sourceValue = pathNode.node.source.value;
        const currentFile = state.file.opts.filename;

        // Intentamos obtener la ruta absoluta
        const resolvedPath = getAbsPathWithExt(sourceValue, {
          parentURL: pathToFileURL(currentFile).href,
        });

        // Si resolvedPath es null, significa que es una librería de node_modules
        // (porque tu helper devuelve null si no empieza por . o alias)
        const pathOrPackage = resolvedPath || sourceValue;
        const isPackage = !resolvedPath;

        const specifiers = pathNode.node.specifiers;
        const injections = [];

        specifiers.forEach((spec) => {
          if (t.isImportSpecifier(spec) || t.isImportDefaultSpecifier(spec)) {
            const localIdentifier = spec.local.name;

            injections.push(
              t.expressionStatement(
                t.callExpression(
                  t.identifier("global.__DINOU_REGISTER_MODULE"),
                  [
                    t.identifier(localIdentifier),
                    t.stringLiteral(pathOrPackage),
                    t.booleanLiteral(isPackage),
                  ]
                )
              )
            );
          }
        });

        if (injections.length > 0) {
          pathNode.insertAfter(injections);
        }
      },
    },
  };
};
