const path = require("path");

function reactRefreshScopedIdBabelPlugin() {
  return {
    name: "react-refresh-scoped-id",
    post(file) {
      const rawFile = file.opts && file.opts.filename ? file.opts.filename : "";
      if (!rawFile) return;
      const rel = path.relative(process.cwd(), rawFile).replace(/\\/g, "/");

      for (let i = 0; i < file.path.node.body.length; i++) {
        const stmt = file.path.node.body[i];
        if (
          stmt.type === "ExpressionStatement" &&
          stmt.expression &&
          stmt.expression.type === "CallExpression" &&
          stmt.expression.callee &&
          stmt.expression.callee.name === "$RefreshReg$" &&
          stmt.expression.arguments &&
          stmt.expression.arguments.length >= 2
        ) {
          const idArg = stmt.expression.arguments[1];
          if (idArg && idArg.type === "StringLiteral" && !idArg.value.includes("#")) {
            idArg.value = rel + "#" + idArg.value;
          }
        }
      }
    },
  };
}

module.exports = reactRefreshScopedIdBabelPlugin;
