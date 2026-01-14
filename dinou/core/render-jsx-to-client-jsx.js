// Function to check if a component is a client component
function isClientComponent(type) {
  if (typeof type !== "function") {
    return false;
  }
  const isAsync =
    type instanceof Object.getPrototypeOf(async function () {}).constructor;
  if (isAsync) {
    return false;
  }
  return true;
}

function renderJSXToClientJSX(jsx, key = null) {
  if (
    typeof jsx === "string" ||
    typeof jsx === "number" ||
    typeof jsx === "boolean" ||
    typeof jsx === "function" ||
    typeof jsx === "undefined" ||
    jsx == null
  ) {
    return jsx;
  } else if (Array.isArray(jsx)) {
    return jsx.map((child, i) =>
      renderJSXToClientJSX(
        child,
        i + (typeof child?.type === "string" ? "_" + child?.type : "")
      )
    );
  } else if (typeof jsx === "symbol") {
    if (jsx === Symbol.for("react.fragment")) {
      // Handle Fragment as an empty props object
      return {
        $$typeof: Symbol.for("react.transitional.element"),
        type: Symbol.for("react.fragment"),
        props: {},
        key: key,
      };
    }
    console.error("Unsupported symbol:", String(jsx));
    throw new Error(`Unsupported symbol: ${String(jsx)}`);
  } else if (typeof jsx === "object") {
    if (jsx.$$typeof === Symbol.for("react.transitional.element")) {
      if (
        jsx.type === Symbol.for("react.fragment") ||
        jsx.type === Symbol.for("react.suspense") ||
        typeof jsx.type === "string"
      ) {
        return {
          ...jsx,
          props: renderJSXToClientJSX(jsx.props),
          key: key ?? jsx.key,
        };
      } else if (typeof jsx.type === "function") {
        const Component = jsx.type;
        const props = jsx.props;
        if (isClientComponent(Component)) {
          return {
            ...jsx,
            $$typeof: Symbol.for("react.transitional.element"),
            type: Component,
            props: renderJSXToClientJSX(props),
            key: key ?? jsx.key,
          };
        } else {
          // Server component: execute and process
          const returnedJsx = Component(props);
          return renderJSXToClientJSX(returnedJsx, key ?? jsx.key);
        }
      } else {
        console.error("Unsupported JSX type:", jsx.type);
        throw new Error("Unsupported JSX type");
      }
    } else if (jsx instanceof Promise) {
      return jsx;
    } else {
      // Process object props (e.g., { className: "foo" })
      return Object.fromEntries(
        Object.entries(jsx).map(([propName, value]) => [
          propName,
          renderJSXToClientJSX(value),
        ])
      );
    }
  } else {
    throw new Error("Not implemented");
  }
}

async function asyncRenderJSXToClientJSX(jsx, key = null) {
  if (
    typeof jsx === "string" ||
    typeof jsx === "number" ||
    typeof jsx === "boolean" ||
    typeof jsx === "function" ||
    typeof jsx === "undefined" ||
    jsx === null
  ) {
    return jsx;
  } else if (Array.isArray(jsx)) {
    return await Promise.all(
      jsx.map((child, i) =>
        asyncRenderJSXToClientJSX(
          child,
          i + (typeof child?.type === "string" ? "_" + child?.type : "")
        )
      )
    );
  } else if (typeof jsx === "symbol") {
    if (jsx === Symbol.for("react.fragment")) {
      // Handle Fragment as an empty props object
      return {
        $$typeof: Symbol.for("react.transitional.element"),
        type: Symbol.for("react.fragment"),
        props: { key },
      };
    }
    console.error("Unsupported symbol:", String(jsx));
    throw new Error(`Unsupported symbol: ${String(jsx)}`);
  } else if (typeof jsx === "object") {
    if (jsx.$$typeof === Symbol.for("react.transitional.element")) {
      if (
        jsx.type === Symbol.for("react.fragment") ||
        jsx.type === Symbol.for("react.suspense") ||
        typeof jsx.type === "string"
      ) {
        return {
          ...jsx,
          props: {
            ...(await asyncRenderJSXToClientJSX(jsx.props, key ?? jsx.key)),
            key: key ?? jsx.key,
          },
        };
      } else if (typeof jsx.type === "function") {
        const Component = jsx.type;
        const props = jsx.props;
        if (isClientComponent(Component)) {
          return {
            ...jsx,
            $$typeof: Symbol.for("react.transitional.element"),
            type: Component,
            props: {
              ...(await asyncRenderJSXToClientJSX(props, key ?? jsx.key)),
              key: key ?? jsx.key,
            },
          };
        } else {
          // Server component: execute and process
          const returnedJsx = await Component(props);
          return await asyncRenderJSXToClientJSX(returnedJsx, key ?? jsx.key);
        }
      } else {
        console.error("Unsupported JSX type:", jsx.type);
        throw new Error("Unsupported JSX type");
      }
    } else if (jsx instanceof Promise) {
      return jsx;
    } else {
      // Process object props (e.g., { className: "foo" })
      return Object.fromEntries(
        await Promise.all(
          Object.entries(jsx).map(async ([propName, value]) => [
            propName,
            await asyncRenderJSXToClientJSX(value),
          ])
        )
      );
    }
  } else {
    throw new Error("Not implemented");
  }
}

module.exports = {
  renderJSXToClientJSX,
  asyncRenderJSXToClientJSX,
};
