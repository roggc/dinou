const path = require("path");
const { existsSync, readFileSync } = require("fs");
const React = require("react");
const importModule = require("./import-module");

async function deserializeReactElement(
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
        const module = await importModule(
          path.resolve(process.cwd(), modulePath)
        );
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

async function getSSGJSX(reqPath) {
  const distFolder = path.resolve(process.cwd(), "dist");
  const jsonPath = path.join(distFolder, reqPath, "index.json");
  if (existsSync(jsonPath)) {
    const { jsx } = JSON.parse(readFileSync(jsonPath, "utf8"));
    const deserializedJSX = await deserializeReactElement(jsx);
    return deserializedJSX;
  }
}

module.exports = getSSGJSX;
