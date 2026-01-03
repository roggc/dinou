const path = require("path");
const React = require("react");
const importModule = require("./import-module");

async function deserializeReactElement(serialized) {
  // 1. Guard Clause: Si no parece un objeto serializado válido, devuélvelo tal cual
  if (
    !serialized ||
    typeof serialized !== "object" ||
    !("props" in serialized) // Solo exigimos props como mínimo
  ) {
    return serialized;
  }

  const { type, modulePath, props, name, isPackage } = serialized;
  let Component = type; // Por defecto es el tipo (string o undefined)

  // Variable LOCAL
  let isInvalidComponent = false;

  if (modulePath) {
    try {
      const mod = await importModule(
        isPackage ? modulePath : path.resolve(process.cwd(), modulePath)
      );

      if (name && name !== "default" && mod[name]) {
        Component = mod[name];
      } else {
        Component = mod.default ?? mod;
      }
    } catch (err) {
      console.error(`Error loading module ${modulePath}:`, err);
      // Fallback seguro: Fragment para que no rompa el árbol
      Component = React.Fragment;
    }
  } else if (type === "__clientComponent__") {
    isInvalidComponent = true;
  } else if (type === "Suspense") {
    Component = React.Suspense;
  } else if (type === "Fragment") {
    Component = React.Fragment;
  }

  // 🛡️ PROTECCIÓN FINAL: Si Component es undefined (porque faltaba 'type' en el JSON),
  // lo convertimos en un Fragmento vacío para evitar el crash de React.
  if (!Component) {
    // console.warn("Elemento sin tipo detectado, usando Fragment:", serialized);
    Component = React.Fragment;
  }

  if (isInvalidComponent) {
    return undefined;
  }

  // Deserialize props recursivamente
  const deserializedProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === "children") {
      deserializedProps[key] = Array.isArray(value)
        ? await Promise.all(
            value.map((child) => deserializeReactElement(child))
          )
        : value
        ? await deserializeReactElement(value)
        : null;
    } else if (
      value &&
      typeof value === "object" &&
      // 🟢 CAMBIO CRÍTICO: Detectamos el objeto aunque le falte el type
      "props" in value &&
      "modulePath" in value
    ) {
      deserializedProps[key] = await deserializeReactElement(value);
    } else {
      deserializedProps[key] = value;
    }
  }

  return React.createElement(Component, deserializedProps);
}

async function getSSGJSX(jsxJson) {
  if (!jsxJson) return;
  const { jsx } = jsxJson;
  const deserializedJSX = await deserializeReactElement(jsx);
  return deserializedJSX;
}

module.exports = getSSGJSX;
