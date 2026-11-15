import fs from "node:fs";
import path from "node:path";
import rawPostcss from "#postcss";
import rawPostcssImport from "#postcss-import";
import rawTailwindcss from "#tailwindcss/postcss";
import rawAutoprefixer from "#autoprefixer";
import rawPostCssModules from "#postcss-modules";
import createScopedName from "./createScopedName.js";
import { getAbsPathWithExt, resolveCssImportSpecifier } from "./get-abs-path-with-ext.js";

const unwrap = (mod) => (typeof mod === "function" ? mod : mod?.default || mod);

export const postcss = unwrap(rawPostcss);
export const postcssImport = unwrap(rawPostcssImport);
export const tailwindcss = unwrap(rawTailwindcss);
export const autoprefixer = unwrap(rawAutoprefixer);
export const postCssModules = unwrap(rawPostCssModules);

const URL_FUNCTION_REGEX = /url\(\s*(?:"([^"]+)"|'([^']+)'|([^)"'\s]+))\s*\)/gi;

function isExternalOrPublicCssUrl(rawUrl) {
  if (!rawUrl) return true;
  const trimmed = rawUrl.trim();
  if (
    !trimmed ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("http:") ||
    trimmed.startsWith("https:") ||
    trimmed.startsWith("//")
  ) {
    return true;
  }
  return false;
}

function resolveCssAssetUrlPath(cleanUrlPath, declDir) {
  const viaAliasOrRel = getAbsPathWithExt(cleanUrlPath, { parentDir: declDir });
  if (viaAliasOrRel && fs.existsSync(viaAliasOrRel) && fs.statSync(viaAliasOrRel).isFile()) {
    return viaAliasOrRel;
  }
  const candidate = path.resolve(declDir, cleanUrlPath);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }
  return null;
}

export function getRegisteredCssUrlAssets() {
  if (typeof globalThis === "undefined") return new Map();
  if (!globalThis.__DINOU_CSS_URL_ASSETS__) {
    globalThis.__DINOU_CSS_URL_ASSETS__ = new Map();
  }
  return globalThis.__DINOU_CSS_URL_ASSETS__;
}

export function createHoistCssImportsPlugin() {
  return {
    postcssPlugin: "dinou-hoist-css-imports",
    Once(root) {
      if (!root?.nodes || root.nodes.length < 2) return;
      const tailwindHeaderAtRules = new Set([
        "reference",
        "config",
        "plugin",
        "source",
      ]);
      let seenTailwindHeader = false;
      const importsToHoist = [];
      let firstTailwindHeaderNode = null;

      for (const node of root.nodes) {
        if (node.type === "comment") continue;
        if (node.type === "atrule") {
          const name = node.name.toLowerCase();
          if (name === "charset") continue;
          if (name === "layer" && (!node.nodes || node.nodes.length === 0)) {
            continue;
          }
          if (tailwindHeaderAtRules.has(name)) {
            if (!firstTailwindHeaderNode) firstTailwindHeaderNode = node;
            seenTailwindHeader = true;
            continue;
          }
          if (name === "import") {
            if (seenTailwindHeader) {
              importsToHoist.push(node);
            }
            continue;
          }
        }
        break;
      }

      if (firstTailwindHeaderNode && importsToHoist.length > 0) {
        for (const impNode of importsToHoist) {
          impNode.remove();
          root.insertBefore(firstTailwindHeaderNode, impNode);
        }
      }
    },
  };
}
createHoistCssImportsPlugin.postcss = true;

function rewriteCssUrlAssets(root, result, { onAsset } = {}) {
  const fallbackFrom = result?.opts?.from
    ? path.resolve(result.opts.from)
    : path.join(process.cwd(), "src", "__styles__.css");

  root.walkDecls((decl) => {
    if (!decl.value || !decl.value.includes("url(")) return;

    const declFile = decl.source?.input?.file
      ? path.resolve(decl.source.input.file)
      : fallbackFrom;
    const declDir = path.dirname(declFile);

    URL_FUNCTION_REGEX.lastIndex = 0;
    const nextValue = decl.value.replace(
      URL_FUNCTION_REGEX,
      (fullMatch, dqUrl, sqUrl, bareUrl) => {
        const rawUrl = dqUrl ?? sqUrl ?? bareUrl ?? "";
        if (isExternalOrPublicCssUrl(rawUrl)) {
          return fullMatch;
        }

        const hashIdx = rawUrl.indexOf("#");
        const hashPart = hashIdx === -1 ? "" : rawUrl.slice(hashIdx);
        const withoutHash = hashIdx === -1 ? rawUrl : rawUrl.slice(0, hashIdx);
        const queryIdx = withoutHash.indexOf("?");
        const cleanUrlPath =
          queryIdx === -1 ? withoutHash : withoutHash.slice(0, queryIdx);

        if (!cleanUrlPath) return fullMatch;

        const resolvedPath = resolveCssAssetUrlPath(cleanUrlPath, declDir);
        if (!resolvedPath) {
          return fullMatch;
        }

        const ext = path.extname(resolvedPath);
        const base = path.basename(resolvedPath, ext);
        const scoped = createScopedName(base, resolvedPath);
        const assetFileName = `assets/${scoped}${ext}`;

        const registry = getRegisteredCssUrlAssets();
        registry.set(assetFileName, resolvedPath);

        if (typeof onAsset === "function") {
          onAsset(resolvedPath, assetFileName);
        }

        if (
          typeof globalThis !== "undefined" &&
          process.env.NODE_ENV !== "production"
        ) {
          try {
            const buf = fs.readFileSync(resolvedPath);
            if (!globalThis.__DINOU_MEM_FILES__) {
              globalThis.__DINOU_MEM_FILES__ = new Map();
            }
            globalThis.__DINOU_MEM_FILES__.set(assetFileName, buf);
            globalThis.__DINOU_MEM_FILES__.set("/" + assetFileName, buf);
            globalThis.__DINOU_MEM_FILES__.set(`${scoped}${ext}`, buf);
          } catch (e) {}
        }

        if (result && Array.isArray(result.messages)) {
          result.messages.push({
            type: "dependency",
            plugin: "dinou-postcss-url-assets",
            file: resolvedPath,
            parent: declFile,
          });
        }

        return `url("/${assetFileName}${hashPart}")`;
      }
    );

    if (nextValue !== decl.value) {
      decl.value = nextValue;
    }
  });
}

export function createPostCssUrlAssetsPlugin({
  onAsset,
  stage = "exit",
} = {}) {
  const hookName = stage === "once" ? "Once" : "OnceExit";
  return {
    postcssPlugin:
      stage === "once"
        ? "dinou-postcss-url-assets-pre"
        : "dinou-postcss-url-assets",
    [hookName](root, { result }) {
      rewriteCssUrlAssets(root, result, { onAsset });
    },
  };
}
createPostCssUrlAssetsPlugin.postcss = true;

export function createBasePostCssPlugins({ onAsset } = {}) {
  return [
    createHoistCssImportsPlugin(),
    postcssImport({
      resolve: (id, basedir) => resolveCssImportSpecifier(id, basedir),
    }),
    createPostCssUrlAssetsPlugin({ onAsset, stage: "once" }),
    tailwindcss(),
    autoprefixer(),
    createPostCssUrlAssetsPlugin({ onAsset, stage: "exit" }),
  ];
}

export function isTailwindStylesheetSource(source) {
  if (typeof source !== "string") return false;
  return /@import\s+["']tailwindcss(?:\/|["'])|@tailwind\b/.test(source);
}

export default {
  postcss,
  postcssImport,
  tailwindcss,
  autoprefixer,
  postCssModules,
  createHoistCssImportsPlugin,
  createPostCssUrlAssetsPlugin,
  createBasePostCssPlugins,
  getRegisteredCssUrlAssets,
  isTailwindStylesheetSource,
};

