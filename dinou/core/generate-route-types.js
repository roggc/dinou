// dinou/core/generate-route-types.js
const fs = require("fs");
const path = require("path");

const PAGE_EXTENSIONS = [".tsx", ".jsx", ".ts", ".js"];

/**
 * Recursively scans directory to collect all page routes according to Dinou conventions.
 * - Ignores folders starting with '_' (private folders)
 * - Ignores folders starting with '@' (parallel route slots)
 * - Transparently handles route groups '(group)' by stripping them from URL paths
 * - Tracks dynamic parameters: [id], [...slug], [[slug]], [[...slug]]
 */
function collectRoutes(dir, segments = [], routes = []) {
  if (!fs.existsSync(dir)) return routes;

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return routes;
  }

  // Check if this folder has a page file
  const hasPage = entries.some(
    (e) => !e.isDirectory() && PAGE_EXTENSIONS.some((ext) => e.name === `page${ext}`)
  );

  if (hasPage) {
    const routePath = segments.length === 0 ? "/" : "/" + segments.join("/");
    routes.push({
      path: routePath,
      segments: [...segments],
    });
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const name = entry.name;
    // Ignore private folders (_*) and parallel route slots (@*)
    if (name.startsWith("_") || name.startsWith("@")) continue;

    // Route groups: (group) - do not add to URL path
    if (name.startsWith("(") && name.endsWith(")")) {
      collectRoutes(path.join(dir, name), segments, routes);
      continue;
    }

    collectRoutes(path.join(dir, name), [...segments, name], routes);
  }

  return routes;
}

/**
 * Generates TypeScript type definitions for all discovered routes.
 */
function generateRouteDefinitions(routes) {
  const staticRoutes = new Set();
  const dynamicTemplateRoutes = new Set();
  const routeParamsMap = {};

  for (const route of routes) {
    const segments = route.segments;
    const isDynamic = segments.some((s) => s.startsWith("[") && s.endsWith("]"));

    // Calculate parameter types for Level 2
    const params = {};
    for (const seg of segments) {
      if (seg.startsWith("[[...") && seg.endsWith("]]")) {
        const paramName = seg.slice(5, -2);
        params[paramName] = "string[] | undefined";
      } else if (seg.startsWith("[[") && seg.endsWith("]]")) {
        const paramName = seg.slice(2, -2);
        params[paramName] = "string | undefined";
      } else if (seg.startsWith("[...") && seg.endsWith("]")) {
        const paramName = seg.slice(4, -1);
        params[paramName] = "string[]";
      } else if (seg.startsWith("[") && seg.endsWith("]")) {
        const paramName = seg.slice(1, -1);
        params[paramName] = "string";
      }
    }
    routeParamsMap[route.path] = params;

    if (!isDynamic) {
      staticRoutes.add(route.path);
    } else {
      // Build template literal type for Level 1 autocomplete & validation
      const transformedSegments = segments.map((seg) => {
        if (seg.startsWith("[[...") && seg.endsWith("]]")) {
          return "${string}";
        } else if (seg.startsWith("[[") && seg.endsWith("]]")) {
          return "${string | number}";
        } else if (seg.startsWith("[...") && seg.endsWith("]")) {
          return "${string}";
        } else if (seg.startsWith("[") && seg.endsWith("]")) {
          return "${string | number}";
        }
        return seg;
      });

      dynamicTemplateRoutes.add("`/" + transformedSegments.join("/") + "`");

      // For optional segments ([[foo]] or [[...foo]]), progressively peel off trailing optional
      // segments to register all valid intermediate route variants (including the base static route).
      let cur = [...segments];
      while (cur.length > 0 && cur[cur.length - 1].startsWith("[[") && cur[cur.length - 1].endsWith("]]")) {
        cur.pop();
        if (cur.length === 0) {
          staticRoutes.add("/");
        } else if (!cur.some((s) => s.startsWith("[") && s.endsWith("]"))) {
          staticRoutes.add("/" + cur.join("/"));
        } else {
          const transformed = cur.map((seg) => {
            if (seg.startsWith("[[...") && seg.endsWith("]]")) return "${string}";
            if (seg.startsWith("[[") && seg.endsWith("]]")) return "${string | number}";
            if (seg.startsWith("[...") && seg.endsWith("]")) return "${string}";
            if (seg.startsWith("[") && seg.endsWith("]")) return "${string | number}";
            return seg;
          });
          dynamicTemplateRoutes.add("`/" + transformed.join("/") + "`");
        }
      }
    }
  }

  return {
    staticRoutes: Array.from(staticRoutes).sort(),
    dynamicRoutes: Array.from(dynamicTemplateRoutes).sort(),
    routeParamsMap,
  };
}

/**
 * Generates the .dinou/types/routes.d.ts file and ensures dinou-env.d.ts references it.
 * @param {string} projectRoot Root directory of the project (default process.cwd())
 */
function generateRouteTypes(projectRoot = process.cwd()) {
  const srcDir = path.resolve(projectRoot, "src");
  if (!fs.existsSync(srcDir)) return;

  const routes = collectRoutes(srcDir);
  const { staticRoutes, dynamicRoutes, routeParamsMap } = generateRouteDefinitions(routes);

  const staticUnion = staticRoutes.length > 0
    ? staticRoutes.map((r) => `  | ${JSON.stringify(r)}`).join("\n")
    : "  | string";

  const dynamicUnion = dynamicRoutes.length > 0
    ? dynamicRoutes.map((r) => `  | ${r}`).join("\n")
    : "  | never";

  const paramsEntries = Object.entries(routeParamsMap)
    .map(([rPath, pObj]) => {
      const keys = Object.keys(pObj);
      if (keys.length === 0) {
        return `    ${JSON.stringify(rPath)}: Record<string, never>;`;
      }
      const props = keys
        .map((k) => {
          const isOptional = pObj[k].includes("undefined");
          const cleanType = pObj[k].replace(" | undefined", "");
          return `${k}${isOptional ? "?" : ""}: ${cleanType}`;
        })
        .join("; ");
      return `    ${JSON.stringify(rPath)}: { ${props} };`;
    })
    .join("\n");

  const content = `// This file is auto-generated by Dinou. Do not edit directly.
import "dinou";

declare module "dinou" {
  export type DinouStaticRoutes =
${staticUnion};

  export type DinouDynamicRoutes =
${dynamicUnion};

  export type DinouInternalRoute = DinouStaticRoutes | DinouDynamicRoutes;

  export type DinouRelativeOrExternalRoute =
    | \`http://\${string}\`
    | \`https://\${string}\`
    | \`mailto:\${string}\`
    | \`tel:\${string}\`
    | \`./\${string}\`
    | \`../\${string}\`
    | \`#\${string}\`
    | \`?\${string}\`;

  export type DinouGeneratedRoute =
    | DinouInternalRoute
    | \`\${DinouInternalRoute}?\${string}\`
    | \`\${DinouInternalRoute}#\${string}\`
    | DinouRelativeOrExternalRoute;

  export interface DinouRouteParamsMap {
${paramsEntries}
  }

  namespace DinouRouter {
    interface Register {
      route: DinouGeneratedRoute;
      params: DinouRouteParamsMap;
    }
  }
}
`;

  // Write .dinou/types/routes.d.ts
  const typesDir = path.resolve(projectRoot, ".dinou/types");
  try {
    fs.mkdirSync(typesDir, { recursive: true });
    const targetFile = path.join(typesDir, "routes.d.ts");
    const currentContent = fs.existsSync(targetFile) ? fs.readFileSync(targetFile, "utf8") : "";
    if (currentContent !== content) {
      fs.writeFileSync(targetFile, content, "utf8");
    }
  } catch (e) {
    if (process.env.DINOU_DEBUG) {
      console.warn("[Dinou] Could not write .dinou/types/routes.d.ts:", e.message);
    }
  }

  // Ensure dinou-env.d.ts references .dinou/types/routes.d.ts
  const envFile = path.resolve(projectRoot, "dinou-env.d.ts");
  try {
    if (fs.existsSync(envFile)) {
      let envContent = fs.readFileSync(envFile, "utf8");
      const refLine = '/// <reference path="./.dinou/types/routes.d.ts" />';
      if (!envContent.includes(refLine)) {
        envContent = envContent.trimEnd() + "\n" + refLine + "\n";
        fs.writeFileSync(envFile, envContent, "utf8");
      }
    }
  } catch (e) {}

  return {
    staticCount: staticRoutes.length,
    dynamicCount: dynamicRoutes.length,
    totalRoutes: routes.length,
  };
}

module.exports = {
  collectRoutes,
  generateRouteDefinitions,
  generateRouteTypes,
};
