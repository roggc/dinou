import fs from "node:fs";
import path from "node:path";
import createScopedName from "./createScopedName.js";
import { normalizePathCase } from "./path-utils.js";
import {
  resolveCssImportSpecifier,
  resolveStyleImportFromCode,
} from "./get-abs-path-with-ext.js";
import {
  postcss,
  postcssImport,
  postCssModules,
  createHoistCssImportsPlugin,
} from "./postcss-pipeline.js";

const serverCssModuleCache = new Map();
const lastKnownExportJsonByFile = new Map();

function normalizeCacheKey(filePath) {
  return normalizePathCase(path.resolve(filePath)).replace(/\\/g, "/");
}

function getFileMtimeSafe(filePath) {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch (e) {
    return -1;
  }
}

function isCacheEntryFresh(entry, rootPath) {
  if (!entry) return false;
  const currentMtime = getFileMtimeSafe(rootPath);
  if (currentMtime < 0 || currentMtime !== entry.mtimeMs) return false;
  if (Array.isArray(entry.deps)) {
    for (const dep of entry.deps) {
      if (getFileMtimeSafe(dep.path) !== dep.mtimeMs) {
        return false;
      }
    }
  }
  return true;
}

export async function compileCssModuleMap(filePath) {
  const absPath = path.resolve(filePath);
  const key = normalizeCacheKey(absPath);
  const cached = serverCssModuleCache.get(key);
  if (isCacheEntryFresh(cached, absPath)) {
    return {
      map: cached.map,
      contents: cached.contents,
      watchFiles: cached.watchFiles,
    };
  }

  const mtimeMs = getFileMtimeSafe(absPath);
  const source = await fs.promises.readFile(absPath, "utf8");
  let map = {};

  const result = await postcss([
    createHoistCssImportsPlugin(),
    postcssImport({
      resolve: (id, basedir) => resolveCssImportSpecifier(id, basedir),
    }),
    postCssModules({
      generateScopedName: (name, filename) => {
        if (!filename || !/\.module\.css$/i.test(filename)) return name;
        return createScopedName(name, filename);
      },
      getJSON: (_, json) => {
        map = json || {};
      },
    }),
  ]).process(source, { from: absPath });

  const depPaths = new Set();
  if (Array.isArray(result.messages)) {
    for (const msg of result.messages) {
      if (msg && msg.type === "dependency" && msg.file) {
        depPaths.add(path.resolve(msg.file));
      }
    }
  }
  depPaths.delete(absPath);

  const deps = Array.from(depPaths).map((depPath) => ({
    path: depPath,
    mtimeMs: getFileMtimeSafe(depPath),
  }));
  const watchFiles = [absPath, ...Array.from(depPaths)];
  const mapJson = JSON.stringify(map);
  const contents = `export default ${mapJson};`;

  lastKnownExportJsonByFile.set(key, mapJson);
  serverCssModuleCache.set(key, {
    mtimeMs,
    deps,
    map,
    mapJson,
    contents,
    watchFiles,
  });

  return { map, contents, watchFiles };
}

export async function didCssModuleExportsChange(filePath) {
  const absPath = path.resolve(filePath);
  const key = normalizeCacheKey(absPath);
  const prevJson = lastKnownExportJsonByFile.get(key);
  if (!fs.existsSync(absPath)) {
    lastKnownExportJsonByFile.delete(key);
    serverCssModuleCache.delete(key);
    return prevJson !== undefined;
  }
  const { map } = await compileCssModuleMap(absPath);
  const nextJson = JSON.stringify(map);
  return prevJson === undefined || prevJson !== nextJson;
}

export function createServerCssModulesPlugin({ projectRoot = process.cwd() } = {}) {
  return {
    name: "dinou-server-css-modules",
    setup(build) {
      build.onResolve({ filter: /\.(?:css|scss|sass|less)(?:[?#].*)?$/i }, (args) => {
        if (args.pluginData?.skipDinouServerCssResolve) return null;
        const importer =
          args.importer ||
          path.join(args.resolveDir || projectRoot, "__dinou_server_css__.js");
        const resolved = resolveStyleImportFromCode(args.path, importer);
        if (resolved) {
          return { path: resolved };
        }
        return null;
      });

      build.onLoad({ filter: /\.module\.css$/i }, async (args) => {
        const { contents, watchFiles } = await compileCssModuleMap(args.path);
        return {
          contents,
          loader: "js",
          watchFiles,
        };
      });
    },
  };
}

export default createServerCssModulesPlugin;
