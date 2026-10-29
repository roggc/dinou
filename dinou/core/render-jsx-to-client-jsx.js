import React from "react";
import {
  isPprBuildActive,
  runInSuspense,
  registerHole,
} from "./ppr-context.js";

function cloneWithDevProps(jsx, newProps, resolvedKey, overrideType) {
  const cloned = {
    ...jsx,
    $$typeof: Symbol.for("react.transitional.element"),
    type: overrideType !== undefined ? overrideType : jsx.type,
    props: newProps,
    key: resolvedKey,
  };
  if ("_owner" in jsx) cloned._owner = jsx._owner;
  if ("_store" in jsx && jsx._store) {
    cloned._store = {};
    Object.defineProperty(cloned._store, "validated", {
      configurable: false,
      enumerable: false,
      writable: true,
      value: jsx._store.validated ?? 1,
    });
  }
  for (const devProp of ["ref", "_debugInfo", "_debugStack", "_debugTask"]) {
    const desc = Object.getOwnPropertyDescriptor(jsx, devProp);
    if (desc) {
      Object.defineProperty(cloned, devProp, desc);
    }
  }
  return cloned;
}

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
    if (isPprBuildActive()) {
      const results = [];
      for (const child of jsx) {
        results.push(await asyncRenderJSXToClientJSX(child, child?.key ?? null));
      }
      return results;
    }
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
      return React.createElement(React.Fragment, key != null ? { key } : null);
    }
    console.error("Unsupported symbol:", String(jsx));
    throw new Error(`Unsupported symbol: ${String(jsx)}`);
  } else if (typeof jsx === "object") {
    if (jsx.$$typeof === Symbol.for("react.transitional.element")) {
      if (jsx.type === Symbol.for("react.suspense")) {
        if (isPprBuildActive()) {
          return await runInSuspense(async (holeId) => {
            try {
              const renderedChildren = await asyncRenderJSXToClientJSX(jsx.props?.children);
              return cloneWithDevProps(
                jsx,
                {
                  ...jsx.props,
                  children: renderedChildren,
                  fallback: await asyncRenderJSXToClientJSX(jsx.props?.fallback),
                },
                key ?? jsx.key
              );
            } catch (err) {
              if (
                (err && err.$$typeof === Symbol.for("dinou.ppr.postpone")) ||
                (err && typeof err?.then === "function") ||
                (err && err?.$$typeof === Symbol.for("react.postpone"))
              ) {
                registerHole(holeId, { type: err.pprType || "suspense" });
                const renderedFallback = await asyncRenderJSXToClientJSX(jsx.props?.fallback);
                return cloneWithDevProps(
                  jsx,
                  {
                    "data-ppr-hole": holeId,
                    style: { display: "contents" },
                    children: renderedFallback,
                  },
                  key ?? jsx.key,
                  "div"
                );
              }
              throw err;
            }
          });
        }
        return cloneWithDevProps(
          jsx,
          await asyncRenderJSXToClientJSX(jsx.props),
          key ?? jsx.key
        );
      } else if (
        jsx.type === Symbol.for("react.fragment") ||
        jsx.type === Symbol.for("react.view_transition") ||
        typeof jsx.type === "string"
      ) {
        return cloneWithDevProps(
          jsx,
          await asyncRenderJSXToClientJSX(jsx.props),
          key ?? jsx.key
        );
      } else if (typeof jsx.type === "function") {
        const Component = jsx.type;
        const props = jsx.props;
        if (isClientComponent(Component)) {
          return cloneWithDevProps(
            jsx,
            await asyncRenderJSXToClientJSX(props),
            key ?? jsx.key,
            Component
          );
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
          return cloneWithDevProps(
            jsx,
            await asyncRenderJSXToClientJSX(jsx.props),
            key ?? jsx.key,
            jsx.type
          );
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
          return cloneWithDevProps(
            jsx,
            await asyncRenderJSXToClientJSX(jsx.props),
            key ?? jsx.key,
            jsx.type
          );
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
      if (isPprBuildActive()) {
        const entries = [];
        for (const [propName, value] of Object.entries(jsx)) {
          entries.push([propName, await asyncRenderJSXToClientJSX(value)]);
        }
        return Object.fromEntries(entries);
      }
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

export {
  asyncRenderJSXToClientJSX,
};
export default {
  asyncRenderJSXToClientJSX,
};
