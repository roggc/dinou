import parser from "#babel/parser";
import traverseModule from "#babel/traverse";
import generateModule from "#babel/generator";
import * as tModule from "#babel/types";
import { useServerRegex } from "../constants.js";
import parseExports from "./parse-exports.js";

const traverse = traverseModule?.default || traverseModule;
const generate = generateModule?.default || generateModule;
const t = tModule?.default || tModule;

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

const BABEL_PARSER_PLUGINS = [
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
];

function getExportedSpecifierName(exported) {
  if (!exported) return null;
  if (exported.type === "Identifier") return exported.name;
  if (exported.type === "StringLiteral") return exported.value;
  return null;
}

/**
 * Resolves (and if anonymous/expression, binds) a local module-scope identifier
 * for a module's `default` export so `registerServerReference` can reference it.
 */
function ensureModuleDefaultIdentifier(code, filename) {
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: "module",
      plugins: BABEL_PARSER_PLUGINS,
    });
  } catch (err) {
    console.warn(`[transformServerFunctions] Babel parse error in ${filename}:`, err.message);
    return { didMutate: false, code, defaultExportIdentifier: null };
  }

  let defaultExportIdentifier = null;
  let didMutate = false;
  const body = ast.program.body;

  for (let i = 0; i < body.length; i++) {
    const stmt = body[i];
    if (stmt.type === "ExportDefaultDeclaration") {
      const decl = stmt.declaration;
      if (decl.type === "FunctionDeclaration" || decl.type === "ClassDeclaration") {
        if (decl.id && decl.id.name) {
          defaultExportIdentifier = decl.id.name;
        } else {
          decl.id = t.identifier("$$dinou_default_action");
          defaultExportIdentifier = "$$dinou_default_action";
          didMutate = true;
        }
      } else if (decl.type === "Identifier") {
        defaultExportIdentifier = decl.name;
      } else {
        const defaultId = "$$dinou_default_action";
        defaultExportIdentifier = defaultId;
        body.splice(
          i,
          1,
          t.variableDeclaration("const", [
            t.variableDeclarator(t.identifier(defaultId), decl),
          ]),
          t.exportDefaultDeclaration(t.identifier(defaultId))
        );
        didMutate = true;
      }
      break;
    } else if (stmt.type === "ExportNamedDeclaration" && Array.isArray(stmt.specifiers)) {
      const defaultSpec = stmt.specifiers.find(
        (s) => s.type === "ExportSpecifier" && getExportedSpecifierName(s.exported) === "default"
      );
      if (defaultSpec) {
        if (!stmt.source && defaultSpec.local && defaultSpec.local.type === "Identifier") {
          defaultExportIdentifier = defaultSpec.local.name;
        } else if (stmt.source && defaultSpec.local) {
          const defaultId = "$$dinou_default_action";
          defaultExportIdentifier = defaultId;
          body.unshift(
            t.importDeclaration(
              [t.importSpecifier(t.identifier(defaultId), t.cloneNode(defaultSpec.local))],
              t.cloneNode(stmt.source)
            )
          );
          didMutate = true;
        }
        break;
      }
    }
  }

  if (didMutate) {
    const output = generate(ast, { retainLines: false });
    return { didMutate: true, code: output.code, defaultExportIdentifier };
  }
  return { didMutate: false, code, defaultExportIdentifier };
}

/**
 * Transforms function-level "use server" directives:
 * 1. Hoists inline/nested server functions to module top level and binds captured closure variables.
 * 2. Ensures top-level functions with "use server" in their body are exported so they can be referenced and invoked.
 * 3. Returns the transformed code, the list of exported server function names, and defaultExportIdentifier when "default" is an action.
 *
 * @param {string} code Source code
 * @param {string} [filename="file.tsx"]
 * @returns {{ transformed: boolean, isModuleLevel: boolean, code: string, actions: string[], defaultExportIdentifier: string | null }}
 */
export function transformServerFunctions(code, filename = "file.tsx") {
  if (!hasServerFunctions(code)) {
    return { transformed: false, isModuleLevel: false, code, actions: [], defaultExportIdentifier: null };
  }

  if (isModuleLevelUseServer(code)) {
    const exports = parseExports(code);
    if (exports.includes("default")) {
      const resolved = ensureModuleDefaultIdentifier(code, filename);
      return {
        transformed: resolved.didMutate,
        isModuleLevel: true,
        code: resolved.code,
        actions: exports,
        defaultExportIdentifier: resolved.defaultExportIdentifier,
      };
    }
    return {
      transformed: false,
      isModuleLevel: true,
      code,
      actions: exports,
      defaultExportIdentifier: null,
    };
  }

  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: "module",
      plugins: BABEL_PARSER_PLUGINS,
    });
  } catch (err) {
    console.warn(`[transformServerFunctions] Babel parse error in ${filename}:`, err.message);
    return { transformed: false, isModuleLevel: false, code, actions: [], defaultExportIdentifier: null };
  }

  const actions = [];
  const hoistedNodes = [];
  let defaultExportIdentifier = null;
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

        if (path.parentPath.isExportDefaultDeclaration()) {
          if (!actions.includes("default")) {
            actions.push("default");
          }
          if (path.isFunctionDeclaration()) {
            if (!path.node.id) {
              path.node.id = t.identifier("$$dinou_default_action");
            }
            defaultExportIdentifier = path.node.id.name;
          } else {
            const defaultId = "$$dinou_default_action";
            defaultExportIdentifier = defaultId;
            path.parentPath.replaceWithMultiple([
              t.variableDeclaration("const", [
                t.variableDeclarator(t.identifier(defaultId), path.node),
              ]),
              t.exportDefaultDeclaration(t.identifier(defaultId)),
            ]);
          }
          path.skip();
          return;
        }

        if (!actions.includes(fnName)) {
          actions.push(fnName);
        }

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
    return { transformed: false, isModuleLevel: false, code, actions: [], defaultExportIdentifier: null };
  }

  // Insert hoisted function declarations right after the last import statement in the program
  const program = ast.program;
  if (!defaultExportIdentifier) {
    for (const stmt of program.body) {
      if (stmt.type === "ExportDefaultDeclaration" && stmt.declaration.type === "Identifier") {
        if (actions.includes(stmt.declaration.name)) {
          defaultExportIdentifier = stmt.declaration.name;
          if (!actions.includes("default")) actions.push("default");
        }
        break;
      } else if (
        stmt.type === "ExportNamedDeclaration" &&
        !stmt.source &&
        Array.isArray(stmt.specifiers)
      ) {
        const defaultSpec = stmt.specifiers.find(
          (s) => s.type === "ExportSpecifier" && getExportedSpecifierName(s.exported) === "default"
        );
        if (
          defaultSpec &&
          defaultSpec.local &&
          defaultSpec.local.type === "Identifier" &&
          actions.includes(defaultSpec.local.name)
        ) {
          defaultExportIdentifier = defaultSpec.local.name;
          if (!actions.includes("default")) actions.push("default");
          break;
        }
      }
    }
  }

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
    defaultExportIdentifier,
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
