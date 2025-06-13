const path = require("path");
const {
  existsSync,
  readdirSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} = require("fs");
const React = require("react");
const { asyncRenderJSXToClientJSX } = require("./render-jsx-to-client-jsx");
const {
  getFilePathAndDynamicParams,
} = require("./get-file-path-and-dynamic-params");

async function buildStaticPages() {
  const srcFolder = path.resolve(process.cwd(), "src");
  const distFolder = path.resolve(process.cwd(), "dist");

  if (existsSync(distFolder)) {
    rmSync(distFolder, { recursive: true, force: true });
    console.log("Deleted existing dist folder");
  }

  if (!existsSync(distFolder)) {
    mkdirSync(distFolder, { recursive: true });
  }

  function collectPages(currentPath, segments = []) {
    const entries = readdirSync(currentPath, { withFileTypes: true });
    const pages = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name.startsWith("(") && entry.name.endsWith(")")) {
          pages.push(
            ...collectPages(path.join(currentPath, entry.name), segments)
          );
        } else if (
          entry.name.startsWith("[[...") &&
          entry.name.endsWith("]]")
        ) {
          // Optional catch-all
          const paramName = entry.name.slice(5, -2);
          const dynamicPath = path.join(currentPath, entry.name);
          const [pagePath] = getFilePathAndDynamicParams(
            segments,
            {},
            dynamicPath,
            "page",
            true,
            true,
            undefined,
            segments.length
          );
          const [pageFunctionsPath] = getFilePathAndDynamicParams(
            segments,
            {},
            dynamicPath,
            "page_functions",
            true,
            true,
            undefined,
            segments.length
          );
          let dynamic;
          let getStaticPaths;
          if (pageFunctionsPath) {
            const module = require(pageFunctionsPath);
            getStaticPaths = module.getStaticPaths;
            dynamic = module.dynamic;
          }
          if (pagePath && !dynamic?.()) {
            console.log(
              `Found optional catch-all route: ${
                segments.join("/") ?? ""
              }/[${paramName}]`
            );
            try {
              if (getStaticPaths) {
                const paths = getStaticPaths();
                for (const path of paths) {
                  pages.push({
                    path: dynamicPath,
                    segments: [...segments, ...path],
                    params: { [paramName]: path },
                  });
                }
              }
            } catch (err) {
              console.error(`Error loading ${pagePath}:`, err);
            }
          }
        } else if (entry.name.startsWith("[...") && entry.name.endsWith("]")) {
          const paramName = entry.name.slice(4, -1);
          const dynamicPath = path.join(currentPath, entry.name);
          const [pagePath] = getFilePathAndDynamicParams(
            segments,
            {},
            dynamicPath,
            "page",
            true,
            true,
            undefined,
            segments.length
          );
          const [pageFunctionsPath] = getFilePathAndDynamicParams(
            segments,
            {},
            dynamicPath,
            "page_functions",
            true,
            true,
            undefined,
            segments.length
          );
          let dynamic;
          let getStaticPaths;
          if (pageFunctionsPath) {
            const module = require(pageFunctionsPath);
            getStaticPaths = module.getStaticPaths;
            dynamic = module.dynamic;
          }
          if (pagePath && !dynamic?.()) {
            console.log(
              `Found catch-all route: ${
                segments.join("/") ?? ""
              }/[${paramName}]`
            );
            try {
              if (getStaticPaths) {
                const paths = getStaticPaths();
                for (const path of paths) {
                  pages.push({
                    path: dynamicPath,
                    segments: [...segments, ...path],
                    params: { [paramName]: path },
                  });
                }
              }
            } catch (err) {
              console.error(`Error loading ${pagePath}:`, err);
            }
          }
        } else if (entry.name.startsWith("[[") && entry.name.endsWith("]]")) {
          // Optional dynamic param
          const paramName = entry.name.slice(2, -2);
          const dynamicPath = path.join(currentPath, entry.name);
          const [pagePath] = getFilePathAndDynamicParams(
            segments,
            {},
            dynamicPath,
            "page",
            true,
            true,
            undefined,
            segments.length
          );
          const [pageFunctionsPath] = getFilePathAndDynamicParams(
            segments,
            {},
            dynamicPath,
            "page_functions",
            true,
            true,
            undefined,
            segments.length
          );
          let dynamic;
          let getStaticPaths;
          if (pageFunctionsPath) {
            const module = require(pageFunctionsPath);
            getStaticPaths = module.getStaticPaths;
            dynamic = module.dynamic;
          }
          if (pagePath && !dynamic?.()) {
            console.log(
              `Found optional dynamic route: ${
                segments.join("/") ?? ""
              }/[${paramName}]`
            );
            try {
              if (getStaticPaths) {
                const paths = getStaticPaths();
                for (const path of paths) {
                  pages.push({
                    path: dynamicPath,
                    segments: [...segments, path],
                    params: { [paramName]: path },
                  });
                }
              }
            } catch (err) {
              console.error(`Error loading ${pagePath}:`, err);
            }
          }
        } else if (entry.name.startsWith("[") && entry.name.endsWith("]")) {
          const paramName = entry.name.slice(1, -1);
          const dynamicPath = path.join(currentPath, entry.name);
          const [pagePath] = getFilePathAndDynamicParams(
            segments,
            {},
            dynamicPath,
            "page",
            true,
            true,
            undefined,
            segments.length
          );
          const [pageFunctionsPath] = getFilePathAndDynamicParams(
            segments,
            {},
            dynamicPath,
            "page_functions",
            true,
            true,
            undefined,
            segments.length
          );
          let dynamic;
          let getStaticPaths;
          if (pageFunctionsPath) {
            const module = require(pageFunctionsPath);
            getStaticPaths = module.getStaticPaths;
            dynamic = module.dynamic;
          }
          if (pagePath && !dynamic?.()) {
            console.log(
              `Found dynamic route: ${segments.join("/") ?? ""}/[${paramName}]`
            );
            try {
              if (getStaticPaths) {
                const paths = getStaticPaths();
                for (const path of paths) {
                  pages.push({
                    path: dynamicPath,
                    segments: [...segments, path],
                    params: { [paramName]: path },
                  });
                }
              }
            } catch (err) {
              console.error(`Error loading ${pagePath}:`, err);
            }
          }
        } else if (!entry.name.startsWith("@")) {
          pages.push(
            ...collectPages(path.join(currentPath, entry.name), [
              ...segments,
              entry.name,
            ])
          );
        }
      }
    }

    const [pagePath, dParams] = getFilePathAndDynamicParams(
      segments,
      {},
      currentPath,
      "page",
      true,
      true,
      undefined,
      segments.length
    );
    const [pageFunctionsPath] = getFilePathAndDynamicParams(
      segments,
      {},
      currentPath,
      "page_functions",
      true,
      true,
      undefined,
      segments.length
    );
    let dynamic;
    if (pageFunctionsPath) {
      const module = require(pageFunctionsPath);
      dynamic = module.dynamic;
    }
    if (pagePath && !dynamic?.()) {
      pages.push({ path: currentPath, segments, params: dParams });
      console.log(`Found static route: ${segments.join("/") || "/"}`);
    }

    return pages;
  }

  const pages = collectPages(srcFolder);

  for await (const { path: folderPath, segments, params } of pages) {
    try {
      const [pagePath] = getFilePathAndDynamicParams(
        segments,
        {},
        folderPath,
        "page",
        true,
        true,
        undefined,
        segments.length
      );
      const pageModule = require(pagePath);
      const Page = pageModule.default ?? pageModule;
      // Set displayName for better serialization
      // if (!Page.displayName) Page.displayName = "Page";

      let props = { params, query: {} };

      const [pageFunctionsPath] = getFilePathAndDynamicParams(
        segments,
        {},
        folderPath,
        "page_functions",
        true,
        true,
        undefined,
        segments.length
      );

      let pageFunctionsProps;

      if (pageFunctionsPath) {
        const pageFunctionsModule = require(pageFunctionsPath);
        const getProps = pageFunctionsModule.getProps;
        pageFunctionsProps = await getProps?.(params);
        props = { ...props, ...(pageFunctionsProps?.page ?? {}) };
      }

      let jsx = React.createElement(Page, props);
      jsx = { ...jsx, __modulePath: pagePath };

      const noLayoutPath = path.join(folderPath, "no_layout");
      if (!existsSync(noLayoutPath)) {
        const layouts = getFilePathAndDynamicParams(
          segments,
          {},
          srcFolder,
          "layout",
          true,
          false,
          undefined,
          0,
          {},
          true
        );

        if (layouts && Array.isArray(layouts)) {
          let index = 0;
          for (const [layoutPath, dParams, slots] of layouts.reverse()) {
            const layoutModule = require(layoutPath);
            const Layout = layoutModule.default ?? layoutModule;
            // if (!Layout.displayName) Layout.displayName = "Layout";
            const updatedSlots = {};
            for (const [slotName, slotElement] of Object.entries(slots)) {
              const slotFolder = path.join(
                layoutPath.split("\\").slice(0, -1).join("\\"),
                `@${slotName}`
              );
              const [slotPath] = getFilePathAndDynamicParams(
                segments,
                {},
                slotFolder,
                "page",
                true,
                true,
                undefined,
                segments.length
              );
              const updatedSlotElement = {
                ...slotElement,
                __modulePath: slotPath ?? null,
              };
              updatedSlots[slotName] = updatedSlotElement;
            }
            let props = { params: dParams, query: {}, ...updatedSlots };
            if (index === layouts.length - 1) {
              props = { ...props, ...(pageFunctionsProps?.layout ?? {}) };
            }
            jsx = React.createElement(Layout, props, jsx);
            jsx = { ...jsx, __modulePath: layoutPath };
            index++;
          }
        }
      }

      jsx = await asyncRenderJSXToClientJSX(jsx);

      const outputPath = path.join(distFolder, segments.join("/"));
      mkdirSync(outputPath, { recursive: true });

      const jsonPath = path.join(outputPath, "index.json");

      writeFileSync(jsonPath, JSON.stringify(serializeReactElement(jsx)));

      console.log(
        `Generated static page at ${path.relative(process.cwd(), jsonPath)}`
      );
    } catch (err) {
      console.error(`Error building page ${segments.join("/")}:`, err);
      continue;
    }
  }

  console.log(`Static site generated with ${pages.length} pages`);
}

function filterProps(props_) {
  if (React.isValidElement(props_)) {
    return serializeReactElement(props_);
  }
  if (Array.isArray(props_)) {
    return props_.map((item) => filterProps(item));
  }
  if (props_ && typeof props_ === "object") {
    const props = {};
    for (const [key, value] of Object.entries(props_)) {
      if (!key.startsWith("_")) {
        props[key] = filterProps(value);
      }
    }
    return props;
  }
  return props_;
}

function serializeReactElement(element) {
  if (React.isValidElement(element)) {
    let type;
    if (typeof element.type === "string") {
      type = element.type; // HTML elements (e.g., "html", "div")
    } else if (element.type === Symbol.for("react.fragment")) {
      type = "Fragment";
    } else if (typeof element.type === "function") {
      type = "__clientComponent__";
    } else {
      type = element.type.displayName ?? element.type.name ?? "Unknown";
    }
    const modulePath = element.__modulePath;
    return {
      type,
      modulePath: modulePath ? path.relative(process.cwd(), modulePath) : null,
      props: {
        ...filterProps(element.props),
        children: Array.isArray(element.props.children)
          ? element.props.children.map((child) => serializeReactElement(child))
          : element.props.children
          ? serializeReactElement(element.props.children)
          : undefined,
      },
    };
  }
  // Handle non-React elements (strings, numbers, null)
  return element;
}

module.exports = {
  buildStaticPages,
};
