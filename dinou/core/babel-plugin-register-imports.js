// babel-plugin-register-imports.js
const { getAbsPathWithExt } = require("./get-abs-path-with-ext.js");
const { pathToFileURL } = require("url");

module.exports = function ({ types: t }) {
  return {
    visitor: {
      ImportDeclaration(pathNode, state) {
        const sourceValue = pathNode.node.source.value;
        const currentFile = state.file.opts.filename;

        // We try to get the absolute path
        const resolvedPath = getAbsPathWithExt(sourceValue, {
          parentURL: pathToFileURL(currentFile).href,
        });

        // If resolvedPath is null, it means it is a node_modules library
        // (because your helper returns null if it doesn't start with . or alias)
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
