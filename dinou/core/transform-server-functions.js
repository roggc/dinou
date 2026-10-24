import parser from "@babel/parser";
import traverseModule from "@babel/traverse";
import generateModule from "@babel/generator";
import * as t from "@babel/types";
import { useServerRegex } from "../constants.js";
import parseExports from "./parse-exports.js";

const traverse = traverseModule?.default || traverseModule;
const generate = generateModule?.default || generateModule;

/**
 * Fast string check to determine if the source code could contain any "use server" directive.
 * @param {string} code
 * @returns {boolean}
 */
export function hasServerFunctions(code) {
  if (typeof code !== "string") return false;
  return code.includes("use server");
}

/**
 * Check if the file starts with a module-level "use server" directive.
 * @param {string} code
 * @returns {boolean}
 */
export function isModuleLevelUseServer(code) {
  if (!hasServerFunctions(code)) return false;
  return useServerRegex.test(code.trim());
}

/**
 * Checks if a function's block statement body contains a "use server" directive.
 * @param {object} body
 * @returns {boolean}
 */
function hasUseServerDirective(body) {
  if (!body || body.type !== "BlockStatement") return false;
  if (body.directives && body.directives.some((d) => d.value && d.value.value === "use server")) {
    return true;
  }
  if (
    body.body &&
    body.body[0] &&
    body.body[0].type === "ExpressionStatement" &&
    body.body[0].expression &&
    body.body[0].expression.type === "StringLiteral" &&
    body.body[0].expression.value === "use server"
  ) {
    return true;
  }
  return false;
}

/**
 * Helper to check if childScope is equal to or nested within parentScope.
 */
function isInsideScope(childScope, parentScope) {
  let cur = childScope;
  while (cur) {
    if (cur === parentScope) return true;
    cur = cur.parent;
  }
  return false;
}

/**
 * Transforms function-level "use server" directives:
 * 1. Hoists inline/nested server functions to module top level and binds captured closure variables.
 * 2. Ensures top-level functions with "use server" in their body are exported so they can be referenced and invoked.
 * 3. Returns the transformed code and the list of exported server function names.
 *
 * @param {string} code Source code
 * @param {string} [filename="file.tsx"]
 * @returns {{ transformed: boolean, isModuleLevel: boolean, code: string, actions: string[] }}
 */
export function transformServerFunctions(code, filename = "file.tsx") {
  if (!hasServerFunctions(code)) {
    return { transformed: false, isModuleLevel: false, code, actions: [] };
  }

  if (isModuleLevelUseServer(code)) {
    const exports = parseExports(code);
    return {
      transformed: false,
      isModuleLevel: true,
      code,
      actions: exports,
    };
  }

  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: "module",
      plugins: [
        "jsx",
        "typescript",
        "asyncGenerators",
        "classProperties",
        "classPrivateProperties",
        "classPrivateMethods",
        "dynamicImport",
        "exportDefaultFrom",
        "exportNamespaceFrom",
        "nullishCoalescingOperator",
        "numericSeparator",
        "objectRestSpread",
        "optionalCatchBinding",
        "optionalChaining",
        "topLevelAwait",
      ],
    });
  } catch (err) {
    console.warn(`[transformServerFunctions] Babel parse error in ${filename}:`, err.message);
    return { transformed: false, isModuleLevel: false, code, actions: [] };
  }

  const actions = [];
  const hoistedNodes = [];
  let actionCounter = 0;

  traverse(ast, {
    Function(path) {
      const body = path.node.body;
      if (!hasUseServerDirective(body)) return;

      const isTopLevel = path.getFunctionParent() === null;
      let fnName = path.node.id ? path.node.id.name : null;
      if (!fnName) {
        if (path.parentPath.isVariableDeclarator() && path.parentPath.node.id.type === "Identifier") {
          fnName = path.parentPath.node.id.name;
        } else if (path.parentPath.isJSXAttribute() && path.parentPath.node.name.type === "JSXIdentifier") {
          fnName = path.parentPath.node.name.name;
        } else {
          fnName = "action";
        }
      }

      // Helper to strip "use server" from function body
      const cleanDirectivesAndStatements = () => {
        body.body = body.body.filter((stmt) => {
          return !(
            stmt.type === "ExpressionStatement" &&
            stmt.expression.type === "StringLiteral" &&
            stmt.expression.value === "use server"
          );
        });
        if (body.directives) {
          body.directives = body.directives.filter(
            (d) => !d.value || d.value.value !== "use server"
          );
        }
      };

      if (isTopLevel) {
        cleanDirectivesAndStatements();
        actions.push(fnName);

        if (path.isFunctionDeclaration()) {
          if (!path.parentPath.isExportNamedDeclaration()) {
            path.replaceWith(t.exportNamedDeclaration(path.node));
          }
        } else if (path.parentPath.isVariableDeclarator()) {
          const varDecl = path.parentPath.parentPath;
          if (varDecl && varDecl.isVariableDeclaration() && !varDecl.parentPath.isExportNamedDeclaration()) {
            varDecl.replaceWith(t.exportNamedDeclaration(varDecl.node));
          }
        }

        path.skip();
        return;
      }

      // Case B: Nested / Inline function capturing closure variables
      const hoistedName = `$$dinou_action_${fnName}_${actionCounter++}`;

      // Identify free / captured variables from outer scopes
      const captured = new Set();
      path.traverse({
        Identifier(identPath) {
          if (!identPath.isReferencedIdentifier()) return;
          const name = identPath.node.name;
          const binding = identPath.scope.getBinding(name);
          if (binding) {
            // Local variables declared inside the function or child blocks are not captured
            if (isInsideScope(binding.scope, path.scope)) return;
            // Variables declared at top-level Program scope (imports, module constants) are already accessible
            if (binding.scope.block.type === "Program") return;
            captured.add(name);
          }
        },
      });

      const capturedVars = Array.from(captured);
      const hoistedParams = [
        ...capturedVars.map((v) => t.identifier(v)),
        ...path.node.params,
      ];

      // Clean the "use server" directive from the hoisted function body
      const cleanBodyStatements = body.body.filter((stmt) => {
        return !(
          stmt.type === "ExpressionStatement" &&
          stmt.expression.type === "StringLiteral" &&
          stmt.expression.value === "use server"
        );
      });
      const cleanDirectives = (body.directives || []).filter(
        (d) => !d.value || d.value.value !== "use server"
      );

      const hoistedFn = t.exportNamedDeclaration(
        t.functionDeclaration(
          t.identifier(hoistedName),
          hoistedParams,
          t.blockStatement(cleanBodyStatements, cleanDirectives),
          path.node.generator,
          true /* async */
        )
      );

      hoistedNodes.push(hoistedFn);
      actions.push(hoistedName);

      // Replace the inline function with a .bind() call attaching captured variables
      const bindCall = t.callExpression(
        t.memberExpression(t.identifier(hoistedName), t.identifier("bind")),
        [t.nullLiteral(), ...capturedVars.map((v) => t.identifier(v))]
      );

      if (path.isFunctionDeclaration()) {
        path.replaceWith(
          t.variableDeclaration("const", [
            t.variableDeclarator(t.identifier(fnName), bindCall),
          ])
        );
      } else {
        path.replaceWith(bindCall);
      }

      path.skip();
    },
  });

  if (actions.length === 0) {
    return { transformed: false, isModuleLevel: false, code, actions: [] };
  }

  // Insert hoisted function declarations right after the last import statement in the program
  const program = ast.program;
  let lastImportIdx = -1;
  for (let i = 0; i < program.body.length; i++) {
    if (program.body[i].type === "ImportDeclaration") {
      lastImportIdx = i;
    }
  }

  if (hoistedNodes.length > 0) {
    program.body.splice(lastImportIdx + 1, 0, ...hoistedNodes);
  }

  const output = generate(ast, { retainLines: false });
  return {
    transformed: true,
    isModuleLevel: false,
    code: output.code,
    actions,
  };
}

/**
 * Extracts action export names from code (handles both module-level and function-level).
 * @param {string} code
 * @param {string} [filename="file.tsx"]
 * @returns {string[]}
 */
export function extractServerFunctions(code, filename = "file.tsx") {
  if (!hasServerFunctions(code)) return [];
  if (isModuleLevelUseServer(code)) {
    return parseExports(code);
  }
  const result = transformServerFunctions(code, filename);
  return result.actions || [];
}

export default {
  hasServerFunctions,
  isModuleLevelUseServer,
  transformServerFunctions,
  extractServerFunctions,
};
