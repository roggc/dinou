import babel from "@babel/core";
import fs from "node:fs/promises";
import path from "node:path";
const norm = (p) => path.resolve(p).replace(/\\/g, "/");
export default function babelReactCompilerPlugin() {
  return {
    name: "babel-react-compiler-bridge",
    setup(build) {
      const entryPoints = build.initialOptions.entryPoints;
      // Intercept JS/TS/JSX/TSX files
      // NOTE: Filter node_modules to avoid slowing down by processing external libraries
      build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
        // Double check security to avoid node_modules
        if (args.path.includes("node_modules")) return;
        const abs = path.resolve(args.path);

        const absNorm = norm(abs);
        const isAnEntryPoint = Object.values(entryPoints).some(
          (val) => norm(path.resolve(val)) === absNorm,
        );
        if (!isAnEntryPoint) {
          return;
        }
        try {
          const source = await fs.readFile(args.path, "utf8");
          const filename = args.path;

          // Transform the code with Babel + React Compiler
          const result = await babel.transformAsync(source, {
            filename,
            presets: [
              // We need to tell Babel to understand React and TS before compiling
              ["@babel/preset-react", { runtime: "automatic" }],
              "@babel/preset-typescript",
            ],
            plugins: [
              "babel-plugin-react-compiler", // 👈 The jewel in the crown
            ],
            sourceMaps: true, // Vital for esbuild sourcemaps to work
            configFile: false, // Ignore global babel.config.js to get straight to the point
          });

          // If for some reason Babel does not return code, let esbuild handle it
          if (!result || !result.code) return;

          return {
            contents: result.code,
            loader: "js", // Babel returns standard JS
          };
        } catch (error) {
          // If Babel fails, show a clean error to not break the build silently
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
