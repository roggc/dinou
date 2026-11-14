import babelModule from "#babel/core";
import presetReactModule from "#babel/preset-react";
import presetTypescriptModule from "#babel/preset-typescript";
import pluginSyntaxImportMetaModule from "#babel/plugin-syntax-import-meta";
import pluginReactCompilerModule from "#babel-plugin-react-compiler";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { useClientRegex, useServerRegex } from "../../constants.js";
import { hasServerFunctions } from "../../core/transform-server-functions.js";

const unwrapBabel = (mod) => mod?.default ?? mod;
const babel = unwrapBabel(babelModule);
const presetReact = unwrapBabel(presetReactModule);
const presetTypescript = unwrapBabel(presetTypescriptModule);
const pluginSyntaxImportMeta = unwrapBabel(pluginSyntaxImportMetaModule);
const pluginReactCompiler = unwrapBabel(pluginReactCompilerModule);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const normalizeNormPath = (p) => {
  let s = path.resolve(p).replace(/\\/g, "/");
  if (process.platform === "win32") {
    s = s.replace(/^([a-zA-Z]):/, (_, d) => d.toLowerCase() + ":");
  }
  return s;
};
const dinouRootPrefix =
  normalizeNormPath(path.resolve(__dirname, "../..")) + "/";

export default function babelReactCompilerPlugin({ serverFiles = null } = {}) {
  const serverFilesSet = serverFiles
    ? new Set(Array.from(serverFiles).map((f) => normalizeNormPath(f)))
    : null;

  return {
    name: "babel-react-compiler-bridge",
    setup(build) {
      // Intercept user JS/TS/JSX/TSX modules across the entire client graph
      // (including child components and custom hooks without their own "use client" directive).
      build.onLoad({ filter: /\.[jt]sx?$/, namespace: "file" }, async (args) => {
        const normPath = args.path.replace(/\\/g, "/");
        if (
          normPath.includes("/node_modules/") ||
          normPath.includes("/.dinou/")
        ) {
          return null;
        }

        const absNorm = normalizeNormPath(args.path);
        // Skip Dinou's internal framework runtime (both in library and ejected mode)
        if (absNorm.startsWith(dinouRootPrefix)) {
          return null;
        }
        // Skip known "use server" modules so serverFunctionsPlugin handles them exclusively
        if (serverFilesSet && serverFilesSet.has(absNorm)) {
          return null;
        }

        try {
          const source = await fs.readFile(args.path, "utf8");
          const trimmed = source.trim();

          // Defense-in-depth: never run client React Compiler on "use server" modules
          if (
            !useClientRegex.test(trimmed) &&
            (useServerRegex.test(trimmed) || hasServerFunctions(source))
          ) {
            return null;
          }

          const result = await babel.transformAsync(source, {
            filename: args.path,
            presets: [
              [presetReact, { runtime: "automatic" }],
              presetTypescript,
            ],
            plugins: [
              pluginReactCompiler,
              pluginSyntaxImportMeta,
            ],
            sourceMaps: build.initialOptions.sourcemap ? "inline" : false,
            configFile: false,
            babelrc: false,
          });

          if (!result || !result.code) return null;

          return {
            contents: result.code,
            loader: "js",
            resolveDir: path.dirname(args.path),
          };
        } catch (error) {
          return {
            errors: [
              {
                text: error.message,
                detail: error,
              },
            ],
          };
        }
      });
    },
  };
}
