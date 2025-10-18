const path = require("path");
const {
  existsSync,
  readdirSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} = require("fs");
const fs = require("fs").promises;
const React = require("react");
const { asyncRenderJSXToClientJSX } = require("./render-jsx-to-client-jsx");
const {
  getFilePathAndDynamicParams,
} = require("./get-file-path-and-dynamic-params");
const importModule = require("./import-module");

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

  async function collectPages(currentPath, segments = [], params = {}) {
    const entries = readdirSync(currentPath, { withFileTypes: true });
    const pages = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name.startsWith("(") && entry.name.endsWith(")")) {
          pages.push(
            ...(await collectPages(
              path.join(currentPath, entry.name),
              segments
            ))
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
            const module = await importModule(pageFunctionsPath);
            getStaticPaths = module.getStaticPaths;
            dynamic = module.dynamic;
          }
          if (pagePath && !dynamic?.()) {
            console.log(
              `Found optional catch-all route: ${
                segments.join("/") ?? ""
              }/[[...${paramName}]]`
            );
            try {
              if (getStaticPaths) {
                const paths = getStaticPaths();
                for (const path of paths) {
                  pages.push(
                    ...(await collectPages(
                      dynamicPath,
                      [...segments, ...path],
                      {
                        ...params,
                        [paramName]: path,
                      }
                    ))
                  );
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
            const module = await importModule(pageFunctionsPath);
            getStaticPaths = module.getStaticPaths;
            dynamic = module.dynamic;
          }
          if (pagePath && !dynamic?.()) {
            console.log(
              `Found catch-all route: ${
                segments.join("/") ?? ""
              }/[...${paramName}]`
            );
            try {
              if (getStaticPaths) {
                const paths = getStaticPaths();
                for (const path of paths) {
                  pages.push(
                    ...(await collectPages(
                      dynamicPath,
                      [...segments, ...path],
                      {
                        ...params,
                        [paramName]: path,
                      }
                    ))
                  );
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
            const module = await importModule(pageFunctionsPath);
            getStaticPaths = module.getStaticPaths;
            dynamic = module.dynamic;
          }
          if (pagePath && !dynamic?.()) {
            console.log(
              `Found optional dynamic route: ${
                segments.join("/") ?? ""
              }/[[${paramName}]]`
            );
            try {
              if (getStaticPaths) {
                const paths = getStaticPaths();
                for (const path of paths) {
                  pages.push(
                    ...(await collectPages(dynamicPath, [...segments, path], {
                      ...params,
                      [paramName]: path,
                    }))
                  );
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
            const module = await importModule(pageFunctionsPath);
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
                  pages.push(
                    ...(await collectPages(dynamicPath, [...segments, path], {
                      ...params,
                      [paramName]: path,
                    }))
                  );
                }
              }
            } catch (err) {
              console.error(`Error loading ${pagePath}:`, err);
            }
          }
        } else if (!entry.name.startsWith("@")) {
          pages.push(
            ...(await collectPages(
              path.join(currentPath, entry.name),
              [...segments, entry.name],
              params
            ))
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
      segments.length,
      params
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
      const module = await importModule(pageFunctionsPath);
      dynamic = module.dynamic;
    }
    if (pagePath && !dynamic?.()) {
      pages.push({ path: currentPath, segments, params: dParams });
      console.log(`Found static route: ${segments.join("/") || "/"}`);
    }

    return pages;
  }

  const pages = await collectPages(srcFolder);

  for (const { path: folderPath, segments, params } of pages) {
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
      const pageModule = await importModule(pagePath);
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
      let revalidate;

      if (pageFunctionsPath) {
        const pageFunctionsModule = await importModule(pageFunctionsPath);
        const getProps = pageFunctionsModule.getProps;
        revalidate = pageFunctionsModule.revalidate;
        pageFunctionsProps = await getProps?.(params, {}, {});
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
            const layoutModule = await importModule(layoutPath);
            const Layout = layoutModule.default ?? layoutModule;
            // if (!Layout.displayName) Layout.displayName = "Layout";
            const updatedSlots = {};
            for (const [slotName, slotElement] of Object.entries(slots)) {
              const slotFolder = path.join(
                path.dirname(layoutPath),
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
            const layoutFolderPath = path.dirname(layoutPath);
            if (
              getFilePathAndDynamicParams(
                [],
                {},
                layoutFolderPath,
                "reset_layout",
                false
              )[0]
            ) {
              break;
            }
            index++;
          }
        }
      }

      jsx = await asyncRenderJSXToClientJSX(jsx);

      const outputPath = path.join(distFolder, segments.join("/"));
      mkdirSync(outputPath, { recursive: true });

      const jsonPath = path.join(outputPath, "index.json");

      writeFileSync(
        jsonPath,
        JSON.stringify({
          jsx: serializeReactElement(jsx),
          revalidate: revalidate?.(),
          generatedAt: Date.now(),
        })
      );

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

async function buildStaticPage(reqPath) {
  const srcFolder = path.resolve(process.cwd(), "src");
  const distFolder = path.resolve(process.cwd(), "dist");
  const outputPath = path.join(distFolder, reqPath);
  const jsonPath = path.join(outputPath, "index.json");

  try {
    const segments = reqPath.split("/").filter(Boolean);
    let folderPath = srcFolder;
    let dynamicParams = {};

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const currentPath = path.join(folderPath, segment);
      if (existsSync(currentPath)) {
        folderPath = currentPath;
        continue;
      }

      const entries = readdirSync(folderPath, { withFileTypes: true });
      const dynamicEntry = entries.find(
        (entry) =>
          entry.isDirectory() &&
          ((entry.name.startsWith("[") && entry.name.endsWith("]")) ||
            (entry.name.startsWith("[[") && entry.name.endsWith("]]")))
      );

      if (dynamicEntry) {
        folderPath = path.join(folderPath, dynamicEntry.name);
        const paramName = dynamicEntry.name
          .replace(/^\[\[?|\]\]?$/g, "")
          .replace("...", "");
        if (dynamicEntry.name.includes("...")) {
          dynamicParams[paramName] = segments.slice(i);
          break;
        } else {
          dynamicParams[paramName] = segment;
        }
      } else {
        throw new Error(`No matching route found for ${reqPath}`);
      }
    }

    const [pagePath, dParams] = getFilePathAndDynamicParams(
      segments,
      {},
      folderPath,
      "page",
      true,
      true,
      undefined,
      segments.length,
      dynamicParams
    );
    if (!pagePath) throw new Error(`No page found for ${reqPath}`);

    const pageModule = await importModule(pagePath);
    const Page = pageModule.default ?? pageModule;

    let props = { params: dParams, query: {} };
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
    let revalidate;
    if (pageFunctionsPath) {
      const pageFunctionsModule = await importModule(pageFunctionsPath);
      const getProps = pageFunctionsModule.getProps;
      revalidate = pageFunctionsModule.revalidate;
      pageFunctionsProps = await getProps?.(dParams, {}, {});
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
          const layoutModule = await importModule(layoutPath);
          const Layout = layoutModule.default ?? layoutModule;
          const updatedSlots = {};
          for (const [slotName, slotElement] of Object.entries(slots)) {
            const slotFolder = path.join(
              path.dirname(layoutPath),
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
            updatedSlots[slotName] = {
              ...slotElement,
              __modulePath: slotPath ?? null,
            };
          }
          let layoutProps = { params: dParams, query: {}, ...updatedSlots };
          if (index === layouts.length - 1) {
            layoutProps = {
              ...layoutProps,
              ...(pageFunctionsProps?.layout ?? {}),
            };
          }
          jsx = React.createElement(Layout, layoutProps, jsx);
          jsx = { ...jsx, __modulePath: layoutPath };
          const layoutFolderPath = path.dirname(layoutPath);
          if (
            getFilePathAndDynamicParams(
              [],
              {},
              layoutFolderPath,
              "reset_layout",
              false
            )[0]
          ) {
            break;
          }
          index++;
        }
      }
    }

    jsx = await asyncRenderJSXToClientJSX(jsx);

    await fs.mkdir(outputPath, { recursive: true });
    await fs.writeFile(
      jsonPath,
      JSON.stringify({
        jsx: serializeReactElement(jsx),
        revalidate: revalidate?.(),
        generatedAt: Date.now(),
      })
    );

    console.warn(`Generated static page: ${reqPath}`);
  } catch (error) {
    console.error(`Error building page ${reqPath}:`, error);
    throw error;
  }
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
  buildStaticPage,
};
