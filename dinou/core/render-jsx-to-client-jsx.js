const {
  isPprBuildActive,
  enterSuspense,
  exitSuspense,
  registerHole,
} = require("./ppr-context.js");

// Function to check if a component is a client component
function isClientComponent(type) {
  if (!type) {
    return false;
  }
  const CLIENT_REFERENCE = Symbol.for("react.client.reference");
  return (
    (typeof type === "function" && type.$$typeof === CLIENT_REFERENCE) ||
    (typeof type === "object" && type.$$typeof === CLIENT_REFERENCE)
  );
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
    return jsx.map((child) =>
      renderJSXToClientJSX(
        child,
        child?.key ?? null
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
        jsx.type === Symbol.for("react.view_transition") ||
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
      } else if (
        typeof jsx.type === "object" &&
        jsx.type !== null &&
        jsx.type.$$typeof === Symbol.for("react.forward_ref")
      ) {
        if (isClientComponent(jsx.type)) {
          return {
            ...jsx,
            $$typeof: Symbol.for("react.transitional.element"),
            type: jsx.type,
            props: renderJSXToClientJSX(jsx.props),
            key: key ?? jsx.key,
          };
        } else {
          const returnedJsx = jsx.type.render(jsx.props, jsx.ref);
          return renderJSXToClientJSX(returnedJsx, key ?? jsx.key);
        }
      } else if (
        typeof jsx.type === "object" &&
        jsx.type !== null &&
        jsx.type.$$typeof === Symbol.for("react.memo")
      ) {
        if (isClientComponent(jsx.type)) {
          return {
            ...jsx,
            $$typeof: Symbol.for("react.transitional.element"),
            type: jsx.type,
            props: renderJSXToClientJSX(jsx.props),
            key: key ?? jsx.key,
          };
        } else {
          const innerComp = jsx.type.type;
          const returnedJsx = typeof innerComp === "function" ? innerComp(jsx.props) : null;
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
      jsx.map((child) =>
        asyncRenderJSXToClientJSX(
          child,
          child?.key ?? null
        )
      )
    );
  } else if (typeof jsx === "symbol") {
    if (jsx === Symbol.for("react.fragment")) {
      // Handle Fragment as an empty props object
      return {
        $$typeof: Symbol.for("react.transitional.element"),
        type: Symbol.for("react.fragment"),
        props: {},
        key,
      };
    }
    console.error("Unsupported symbol:", String(jsx));
    throw new Error(`Unsupported symbol: ${String(jsx)}`);
  } else if (typeof jsx === "object") {
    if (jsx.$$typeof === Symbol.for("react.transitional.element")) {
      if (jsx.type === Symbol.for("react.suspense")) {
        if (isPprBuildActive()) {
          const holeId = enterSuspense();
          try {
            const renderedChildren = await asyncRenderJSXToClientJSX(jsx.props?.children);
            exitSuspense();
            return {
              ...jsx,
              props: {
                ...jsx.props,
                children: renderedChildren,
                fallback: await asyncRenderJSXToClientJSX(jsx.props?.fallback),
              },
              key: key ?? jsx.key,
            };
          } catch (err) {
            exitSuspense();
            if (
              (err && err.$$typeof === Symbol.for("dinou.ppr.postpone")) ||
              (err && typeof err?.then === "function") ||
              (err && err?.$$typeof === Symbol.for("react.postpone"))
            ) {
              registerHole(holeId, { type: err.pprType || "suspense" });
              const renderedFallback = await asyncRenderJSXToClientJSX(jsx.props?.fallback);
              return {
                $$typeof: Symbol.for("react.transitional.element"),
                type: "div",
                props: {
                  "data-ppr-hole": holeId,
                  style: { display: "contents" },
                  children: renderedFallback,
                },
                key: key ?? jsx.key,
              };
            }
            throw err;
          }
        }
        return {
          ...jsx,
          props: await asyncRenderJSXToClientJSX(jsx.props),
          key: key ?? jsx.key,
        };
      } else if (
        jsx.type === Symbol.for("react.fragment") ||
        jsx.type === Symbol.for("react.view_transition") ||
        typeof jsx.type === "string"
      ) {
        return {
          ...jsx,
          props: await asyncRenderJSXToClientJSX(jsx.props),
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
            props: await asyncRenderJSXToClientJSX(props),
            key: key ?? jsx.key,
          };
        } else {
          // Server component: execute and process
          const returnedJsx = await Component(props);
          return await asyncRenderJSXToClientJSX(returnedJsx, key ?? jsx.key);
        }
      } else if (
        typeof jsx.type === "object" &&
        jsx.type !== null &&
        jsx.type.$$typeof === Symbol.for("react.forward_ref")
      ) {
        if (isClientComponent(jsx.type)) {
          return {
            ...jsx,
            $$typeof: Symbol.for("react.transitional.element"),
            type: jsx.type,
            props: await asyncRenderJSXToClientJSX(jsx.props),
            key: key ?? jsx.key,
          };
        } else {
          const returnedJsx = await jsx.type.render(jsx.props, jsx.ref);
          return await asyncRenderJSXToClientJSX(returnedJsx, key ?? jsx.key);
        }
      } else if (
        typeof jsx.type === "object" &&
        jsx.type !== null &&
        jsx.type.$$typeof === Symbol.for("react.memo")
      ) {
        if (isClientComponent(jsx.type)) {
          return {
            ...jsx,
            $$typeof: Symbol.for("react.transitional.element"),
            type: jsx.type,
            props: await asyncRenderJSXToClientJSX(jsx.props),
            key: key ?? jsx.key,
          };
        } else {
          const innerComp = jsx.type.type;
          const returnedJsx = typeof innerComp === "function" ? await innerComp(jsx.props) : null;
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
