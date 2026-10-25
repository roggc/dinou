import { createRequire as __dinou_createRequire } from "node:module";
import { fileURLToPath as __dinou_fileURLToPath } from "node:url";
import __dinou_path from "node:path";
const require = __dinou_createRequire(import.meta.url);
const __filename = __dinou_fileURLToPath(import.meta.url);
const __dirname = __dinou_path.dirname(__filename);
import {
  __commonJS,
  __require,
  require_dist,
  require_utils
} from "./chunk-YYEJWYXE.js";

// ../node_modules/mini-css-extract-plugin/dist/loader-options.json
var require_loader_options = __commonJS({
  "../node_modules/mini-css-extract-plugin/dist/loader-options.json"(exports, module) {
    module.exports = {
      title: "Mini CSS Extract Plugin Loader options",
      type: "object",
      additionalProperties: false,
      properties: {
        publicPath: {
          anyOf: [
            {
              type: "string"
            },
            {
              instanceof: "Function"
            }
          ],
          description: "Specifies a custom public path for the external resources like images, files, etc inside CSS.",
          link: "https://github.com/webpack/mini-css-extract-plugin#publicpath"
        },
        emit: {
          type: "boolean",
          description: "If true, emits a file (writes a file to the filesystem). If false, the plugin will extract the CSS but will not emit the file",
          link: "https://github.com/webpack/mini-css-extract-plugin#emit"
        },
        esModule: {
          type: "boolean",
          description: "Generates JS modules that use the ES modules syntax.",
          link: "https://github.com/webpack/mini-css-extract-plugin#esmodule"
        },
        layer: {
          type: "string"
        },
        defaultExport: {
          type: "boolean",
          description: "Duplicate the named export with CSS modules locals to the default export (only when `esModules: true` for css-loader).",
          link: "https://github.com/webpack/mini-css-extract-plugin#defaultexports"
        }
      }
    };
  }
});

// ../node_modules/mini-css-extract-plugin/dist/loader.js
var require_loader = __commonJS({
  "../node_modules/mini-css-extract-plugin/dist/loader.js"(exports, module) {
    var path = __require("path");
    var schema = require_loader_options();
    var {
      ABSOLUTE_PUBLIC_PATH,
      AUTO_PUBLIC_PATH,
      BASE_URI,
      SINGLE_DOT_PATH_SEGMENT,
      evalModuleCode,
      findModuleById,
      stringifyLocal,
      stringifyRequest
    } = require_utils();
    var MiniCssExtractPlugin = require_dist();
    function hotLoader(code, context) {
      const localsJsonString = JSON.stringify(JSON.stringify(context.locals));
      return `${code}
    if(module.hot) {
      (function() {
        var localsJsonString = ${localsJsonString};
        // ${Date.now()}
        var cssReload = require(${stringifyRequest(context.loaderContext, path.join(__dirname, "hmr/hotModuleReplacement.js"))})(module.id, ${JSON.stringify(context.options)});
        // only invalidate when locals change
        if (
          module.hot.data &&
          module.hot.data.value &&
          module.hot.data.value !== localsJsonString
        ) {
          module.hot.invalidate();
        } else {
          module.hot.accept();
        }
        module.hot.dispose(function(data) {
          data.value = localsJsonString;
          cssReload();
        });
      })();
    }
  `;
    }
    function pitch(request) {
      if (this._compiler && this._compiler.options && this._compiler.options.experiments && this._compiler.options.experiments.css && this._module && (this._module.type === "css" || this._module.type === "css/auto" || this._module.type === "css/global" || this._module.type === "css/module")) {
        this.emitWarning(new Error('You can\'t use `experiments.css` (`experiments.futureDefaults` enable built-in CSS support by default) and `mini-css-extract-plugin` together, please set `experiments.css` to `false` or set `{ type: "javascript/auto" }` for rules with `mini-css-extract-plugin` in your webpack config (now `mini-css-extract-plugin` does nothing).'));
        return;
      }
      const options = this.getOptions(
        /** @type {Schema} */
        schema
      );
      const emit = typeof options.emit !== "undefined" ? options.emit : true;
      const callback = this.async();
      const optionsFromPlugin = (
        // @ts-expect-error
        this[MiniCssExtractPlugin.pluginSymbol]
      );
      if (!optionsFromPlugin) {
        callback(new Error("You forgot to add 'mini-css-extract-plugin' plugin (i.e. `{ plugins: [new MiniCssExtractPlugin()] }`), please read https://github.com/webpack/mini-css-extract-plugin#getting-started"));
        return;
      }
      const {
        webpack
      } = (
        /** @type {Compiler} */
        this._compiler
      );
      const handleExports = (originalExports, compilation, assets, assetsInfo) => {
        let locals;
        let namedExport;
        const esModule = typeof options.esModule !== "undefined" ? options.esModule : true;
        const addDependencies = (dependencies) => {
          if (!Array.isArray(dependencies) && dependencies != null) {
            throw new Error(`Exported value was not extracted as an array: ${JSON.stringify(dependencies)}`);
          }
          const identifierCountMap = /* @__PURE__ */ new Map();
          let lastDep;
          for (const dependency of dependencies) {
            if (!/** @type {Dependency} */
            dependency.identifier || !emit) {
              continue;
            }
            const count = identifierCountMap.get(
              /** @type {Dependency} */
              dependency.identifier
            ) || 0;
            const CssDependency = MiniCssExtractPlugin.getCssDependency(webpack);
            this._module.addDependency(lastDep = new CssDependency(
              /** @type {Dependency} */
              dependency,
              /** @type {Dependency} */
              dependency.context,
              count
            ));
            identifierCountMap.set(
              /** @type {Dependency} */
              dependency.identifier,
              count + 1
            );
          }
          if (lastDep && assets) {
            lastDep.assets = assets;
            lastDep.assetsInfo = assetsInfo;
          }
        };
        try {
          const exports2 = originalExports.__esModule ? originalExports.default : originalExports;
          namedExport = originalExports.__esModule && (!originalExports.default || !("locals" in originalExports.default));
          if (namedExport) {
            for (const key of Object.keys(originalExports)) {
              if (key !== "default") {
                if (!locals) {
                  locals = {};
                }
                locals[key] = originalExports[key];
              }
            }
          } else {
            locals = exports2 && exports2.locals;
          }
          let dependencies;
          if (!Array.isArray(exports2)) {
            dependencies = [[null, exports2]];
          } else {
            dependencies = exports2.map(([id, content, media, sourceMap, supports, layer]) => {
              let identifier = id;
              let context;
              if (compilation) {
                const module2 = (
                  /** @type {Module} */
                  findModuleById(compilation, id)
                );
                identifier = module2.identifier();
                ({
                  context
                } = module2);
              } else {
                context = this.rootContext;
              }
              return {
                identifier,
                context,
                content: Buffer.from(content),
                media,
                supports,
                layer,
                sourceMap: sourceMap ? Buffer.from(JSON.stringify(sourceMap)) : void 0
              };
            });
          }
          addDependencies(dependencies);
        } catch (err) {
          callback(
            /** @type {Error} */
            err
          );
          return;
        }
        const result = (function makeResult() {
          const defaultExport = typeof options.defaultExport !== "undefined" ? options.defaultExport : false;
          if (locals) {
            if (namedExport) {
              const identifiers = [...(function* generateIdentifiers() {
                let identifierId = 0;
                for (const key of Object.keys(locals)) {
                  identifierId += 1;
                  yield [`_${identifierId.toString(16)}`, key];
                }
              })()];
              const localsString = identifiers.map(([id, key]) => `
var ${id} = ${stringifyLocal(
                /** @type {Locals} */
                locals[key]
              )};`).join("");
              const exportsString = `export { ${identifiers.map(([id, key]) => `${id} as ${JSON.stringify(key)}`).join(", ")} }`;
              return defaultExport ? `${localsString}
${exportsString}
export default { ${identifiers.map(([id, key]) => `${JSON.stringify(key)}: ${id}`).join(", ")} }
` : `${localsString}
${exportsString}
`;
            }
            return `
${esModule ? "export default" : "module.exports = "} ${JSON.stringify(locals)};`;
          } else if (esModule) {
            return defaultExport ? "\nexport {};export default {};" : "\nexport {};";
          }
          return "";
        })();
        let resultSource = `// extracted by ${MiniCssExtractPlugin.pluginName}`;
        resultSource += this.hot && emit ? hotLoader(result, {
          loaderContext: this,
          options,
          locals
        }) : result;
        callback(null, resultSource);
      };
      let {
        publicPath
      } = (
        /** @type {Compilation} */
        this._compilation.outputOptions
      );
      if (typeof options.publicPath === "string") {
        publicPath = options.publicPath;
      } else if (typeof options.publicPath === "function") {
        publicPath = options.publicPath(this.resourcePath, this.rootContext);
      }
      if (publicPath === "auto") {
        publicPath = AUTO_PUBLIC_PATH;
      }
      if (typeof optionsFromPlugin.experimentalUseImportModule === "undefined" && typeof this.importModule === "function" || optionsFromPlugin.experimentalUseImportModule) {
        if (!this.importModule) {
          callback(new Error("You are using 'experimentalUseImportModule' but 'this.importModule' is not available in loader context. You need to have at least webpack 5.33.2."));
          return;
        }
        let publicPathForExtract;
        if (typeof publicPath === "string") {
          const isAbsolutePublicPath = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/.test(publicPath);
          publicPathForExtract = isAbsolutePublicPath ? publicPath : `${ABSOLUTE_PUBLIC_PATH}${publicPath.replace(/\./g, SINGLE_DOT_PATH_SEGMENT)}`;
        } else {
          publicPathForExtract = publicPath;
        }
        this.importModule(
          `${this._module && this._module.matchResource ? this._module.matchResource : this.resourcePath}.webpack[javascript/auto]!=!!!${request}`,
          {
            layer: options.layer,
            publicPath: (
              /** @type {string} */
              publicPathForExtract
            ),
            baseUri: `${BASE_URI}/`
          },
          /**
           * @param {Error | null | undefined} error error
           * @param {object} exports exports
           */
          (error, exports2) => {
            if (error) {
              callback(error);
              return;
            }
            handleExports(exports2);
          }
        );
        return;
      }
      const loaders = this.loaders.slice(this.loaderIndex + 1);
      this.addDependency(this.resourcePath);
      const childFilename = "*";
      const outputOptions = {
        filename: childFilename,
        publicPath
      };
      const childCompiler = (
        /** @type {Compilation} */
        this._compilation.createChildCompiler(`${MiniCssExtractPlugin.pluginName} ${request}`, outputOptions)
      );
      childCompiler.options.module = {
        ...childCompiler.options.module
      };
      childCompiler.options.module.parser = {
        ...childCompiler.options.module.parser
      };
      childCompiler.options.module.parser.javascript = {
        ...childCompiler.options.module.parser.javascript,
        url: "relative"
      };
      const {
        NodeTemplatePlugin
      } = webpack.node;
      const {
        NodeTargetPlugin
      } = webpack.node;
      new NodeTemplatePlugin().apply(childCompiler);
      new NodeTargetPlugin().apply(childCompiler);
      const {
        EntryOptionPlugin
      } = webpack;
      const {
        library: {
          EnableLibraryPlugin
        }
      } = webpack;
      new EnableLibraryPlugin("commonjs2").apply(childCompiler);
      EntryOptionPlugin.applyEntryOption(childCompiler, this.context, {
        child: {
          library: {
            type: "commonjs2"
          },
          import: [`!!${request}`]
        }
      });
      const {
        LimitChunkCountPlugin
      } = webpack.optimize;
      new LimitChunkCountPlugin({
        maxChunks: 1
      }).apply(childCompiler);
      const {
        NormalModule
      } = webpack;
      childCompiler.hooks.thisCompilation.tap(
        `${MiniCssExtractPlugin.pluginName} loader`,
        /**
         * @param {Compilation} compilation compilation
         */
        (compilation) => {
          const normalModuleHook = NormalModule.getCompilationHooks(compilation).loader;
          normalModuleHook.tap(`${MiniCssExtractPlugin.pluginName} loader`, (loaderContext, module2) => {
            if (module2.request === request) {
              module2.loaders = loaders.map((loader2) => ({
                type: null,
                loader: loader2.path,
                options: loader2.options,
                ident: loader2.ident
              }));
            }
          });
        }
      );
      let source;
      childCompiler.hooks.compilation.tap(
        MiniCssExtractPlugin.pluginName,
        /**
         * @param {Compilation} compilation compilation
         */
        (compilation) => {
          compilation.hooks.processAssets.tap(MiniCssExtractPlugin.pluginName, () => {
            source = compilation.assets[childFilename] && compilation.assets[childFilename].source();
            for (const chunk of compilation.chunks) {
              for (const file of chunk.files) {
                compilation.deleteAsset(file);
              }
            }
          });
        }
      );
      childCompiler.runAsChild((error, entries, compilation_) => {
        if (error) {
          callback(error);
          return;
        }
        const compilation = (
          /** @type {Compilation} */
          compilation_
        );
        if (compilation.errors.length > 0) {
          callback(compilation.errors[0]);
          return;
        }
        const assets = /* @__PURE__ */ Object.create(null);
        const assetsInfo = /* @__PURE__ */ new Map();
        for (const asset of compilation.getAssets()) {
          assets[asset.name] = asset.source;
          assetsInfo.set(asset.name, asset.info);
        }
        for (const dep of compilation.fileDependencies) {
          this.addDependency(dep);
        }
        for (const dep of compilation.contextDependencies) {
          this.addContextDependency(dep);
        }
        if (!source) {
          callback(new Error("Didn't get a result from child compiler"));
          return;
        }
        let originalExports;
        try {
          originalExports = evalModuleCode(this, source, request);
        } catch (err) {
          callback(
            /** @type {Error} */
            err
          );
          return;
        }
        handleExports(originalExports, compilation, assets, assetsInfo);
      });
    }
    function loader(content) {
      if (this._compiler && this._compiler.options && this._compiler.options.experiments && this._compiler.options.experiments.css && this._module && (this._module.type === "css" || this._module.type === "css/auto" || this._module.type === "css/global" || this._module.type === "css/module")) {
        return content;
      }
    }
    module.exports = loader;
    module.exports.hotLoader = hotLoader;
    module.exports.pitch = pitch;
  }
});
const _loader = require_loader();
export default _loader;
export const pitch = _loader.pitch;
export const hotLoader = _loader.hotLoader;

