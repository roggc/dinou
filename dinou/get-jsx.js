const path = require("path");
const { existsSync } = require("fs");
const React = require("react");
const {
  getFilePathAndDynamicParams,
} = require("./get-file-path-and-dynamic-params");

async function getJSX(reqPath, query) {
  const srcFolder = path.resolve(process.cwd(), "src");
  const reqSegments = reqPath.split("/").filter(Boolean);
  const folderPath = path.join(srcFolder, ...reqSegments);
  let pagePath;
  if (existsSync(folderPath)) {
    for (const ext of [".tsx", ".ts", ".jsx", ".js"]) {
      const candidatePath = path.join(folderPath, `page${ext}`);
      if (existsSync(candidatePath)) {
        pagePath = candidatePath;
      }
    }
  }
  let dynamicParams;

  if (!pagePath) {
    const [filePath, dParams] = getFilePathAndDynamicParams(
      reqSegments,
      query,
      srcFolder
    );
    pagePath = filePath;
    dynamicParams = dParams ?? {};
  }

  let jsx;
  let pageFunctionsProps;

  if (!pagePath) {
    const [notFoundPath, dParams] = getFilePathAndDynamicParams(
      reqSegments,
      query,
      srcFolder,
      "not_found",
      true,
      false
    );
    if (!notFoundPath) {
      jsx = React.createElement(
        "div",
        null,
        `Page not found: no "page" file found for "${reqPath}"`
      );
    } else {
      const pageModule = require(notFoundPath);
      const Page = pageModule.default ?? pageModule;
      jsx = React.createElement(Page, {
        params: dParams ?? {},
        query,
      });
      const noLayoutNotFoundPath = path.join(
        notFoundPath.split("\\").slice(0, -1).join("\\"),
        `no_layout_not_found`
      );
      if (existsSync(path.resolve(process.cwd(), `${noLayoutNotFoundPath}`))) {
        return jsx;
      }
    }
  } else {
    const pageModule = require(pagePath);
    const Page = pageModule.default ?? pageModule;

    let props = {
      params: dynamicParams,
      query,
    };
    const pageFolder = pagePath.split("\\").slice(0, -1).join("\\");
    const [pageFunctionsPath] = getFilePathAndDynamicParams(
      reqSegments,
      query,
      pageFolder,
      "page_functions",
      true,
      true,
      undefined,
      reqSegments.length
    );

    if (pageFunctionsPath) {
      const pageFunctionsModule = require(pageFunctionsPath);
      const getProps = pageFunctionsModule.getProps;
      pageFunctionsProps = await getProps?.(dynamicParams);
      props = { ...props, ...(pageFunctionsProps?.page ?? {}) };
    }

    jsx = React.createElement(Page, props);
  }

  if (
    getFilePathAndDynamicParams(
      reqSegments,
      query,
      srcFolder,
      "no_layout",
      false
    )[0]
  ) {
    return jsx;
  }

  const layouts = getFilePathAndDynamicParams(
    reqSegments,
    query,
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
      let props = { params: dParams, query, ...slots };
      if (index === layouts.length - 1) {
        props = { ...props, ...(pageFunctionsProps?.layout ?? {}) };
      }
      jsx = React.createElement(Layout, props, jsx);
      index++;
    }
  }

  return jsx;
}

function deserializeReactElement(
  serialized,
  returnUndefined = { value: false }
) {
  // Check if serialized is a React element object
  if (
    serialized &&
    typeof serialized === "object" &&
    "type" in serialized &&
    "props" in serialized
  ) {
    const { type, modulePath, props } = serialized;
    let Component;
    if (modulePath) {
      try {
        const module = require(path.resolve(process.cwd(), modulePath));
        Component = module.default ?? module;
      } catch (err) {
        console.error(`Error loading module ${modulePath}:`, err);
        Component = type; // Fallback
      }
    } else if (type === "__clientComponent__") {
      returnUndefined.value = true;
    } else if (typeof type === "string" && type !== "Fragment") {
      Component = type; // HTML elements (e.g., "html", "div")
    } else if (type === "Fragment") {
      Component = React.Fragment;
    } else {
      Component = type; // Fallback for unknown types
    }

    // Deserialize all props that are React elements
    const deserializedProps = {};
    for (const [key, value] of Object.entries(props)) {
      if (key === "children") {
        deserializedProps[key] = Array.isArray(value)
          ? value.map((child) =>
              deserializeReactElement(child, returnUndefined)
            )
          : value
          ? deserializeReactElement(value, returnUndefined)
          : null;
      } else if (
        value &&
        typeof value === "object" &&
        "type" in value &&
        "props" in value
      ) {
        deserializedProps[key] = deserializeReactElement(
          value,
          returnUndefined
        );
      } else {
        deserializedProps[key] = value;
      }
    }

    return returnUndefined.value
      ? undefined
      : React.createElement(Component, deserializedProps);
  }
  // Pass through non-serialized values (e.g., strings, null)
  return returnUndefined.value ? undefined : serialized;
}

function getSSGJSX(reqPath) {
  const distFolder = path.resolve(process.cwd(), "dist");
  const jsonPath = path.join(distFolder, reqPath, "index.json");
  if (existsSync(jsonPath)) {
    return deserializeReactElement(require(jsonPath));
  }
}

async function getSSGJSXOrJSX(reqPath, query) {
  return Object.keys(query).length
    ? await getJSX(reqPath, query)
    : getSSGJSX(reqPath) ?? (await getJSX(reqPath, query));
}

module.exports = {
  getSSGJSXOrJSX,
  getSSGJSX,
  getJSX,
};
