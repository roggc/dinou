import babel from "@babel/core";
import fs from "node:fs/promises";
import path from "node:path";
const norm = (p) => path.resolve(p).replace(/\\/g, "/");
export default function babelReactCompilerPlugin() {
  return {
    name: "babel-react-compiler-bridge",
    setup(build) {
      const entryPoints = build.initialOptions.entryPoints;
      // Interceptamos archivos JS/TS/JSX/TSX
      // OJO: Filtramos node_modules para no ralentizar procesando librerías externas
      build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
        // Doble chequeo de seguridad para evitar node_modules
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

          // Transformamos el código con Babel + React Compiler
          const result = await babel.transformAsync(source, {
            filename,
            presets: [
              // Necesitamos decirle a Babel que entienda React y TS antes de compilar
              ["@babel/preset-react", { runtime: "automatic" }],
              "@babel/preset-typescript",
            ],
            plugins: [
              "babel-plugin-react-compiler", // 👈 LA JOYA DE LA CORONA
            ],
            sourceMaps: true, // Vital para que los sourcemaps de esbuild funcionen
            configFile: false, // Ignoramos babel.config.js globales para ir al grano
          });

          // Si por alguna razón Babel no devuelve código, dejamos a esbuild actuar
          if (!result || !result.code) return;

          return {
            contents: result.code,
            loader: "js", // Babel devuelve JS estándar
          };
        } catch (error) {
          // Si falla Babel, mostramos error bonito para no romper el build silenciosamente
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
