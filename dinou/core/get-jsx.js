const path = require("path");
const { pathToFileURL } = require("url");
const { existsSync } = require("./vfs");
const React = require("react");
const {
  getFilePathAndDynamicParams,
} = require("./get-file-path-and-dynamic-params");
const importModule = require("./import-module");
const { asyncRenderJSXToClientJSX } = require("./render-jsx-to-client-jsx");
const { getLayoutProps } = require("./layout-functions");

async function getJSX(
  reqPath,
  query,
  isNotFound = null,
  isDevelopment = false,
  forceNotFound = false,
  options = {},
) {
  const srcFolder = path.resolve(process.cwd(), "src");
  const reqSegments = reqPath.split("/").filter(Boolean);
  const normalizedReqPath =
    "/" + reqSegments.join("/") + (reqSegments.length > 0 ? "/" : "");

  let jsx;
  let pageFunctionsProps;

  // 1. Manejo segmentado para Layout: Si se solicita solo el layout
  if (options && options.segment === "layout") {
    let { DinouPageSlot } = require("./slot.js");
    if (
      typeof DinouPageSlot === "function" &&
      DinouPageSlot.$$typeof !== Symbol.for("react.client.reference")
    ) {
      const slotPath = path.resolve(__dirname, "slot.js");
      const fileUrl = pathToFileURL(slotPath).href;
      let regFn = null;
      try {
        const pkg = require("react-server-dom-webpack/server");
        regFn = pkg.registerClientReference;
      } catch (e) {}
      if (!regFn) {
        try {
          const pkg = require("@roggc/react-server-dom-esm/server.node.js");
          regFn = pkg.registerClientReference;
        } catch (e) {}
      }
      if (regFn) {
        DinouPageSlot = regFn(DinouPageSlot, fileUrl, "DinouPageSlot");
      } else {
        Object.defineProperties(DinouPageSlot, {
          $$typeof: { value: Symbol.for("react.client.reference") },
          $$id: { value: fileUrl + "#DinouPageSlot" },
        });
      }
    }
    jsx = React.createElement(DinouPageSlot);
  } else {
    const hasRouterSyntax = reqSegments.some((seg) => {
      const isGroup = seg.startsWith("(") && seg.endsWith(")");

      const isDynamic = seg.startsWith("[") && seg.endsWith("]");
      const isSlot = seg.startsWith("@");
      const isPrivate = seg.startsWith("_");

      return isGroup || isDynamic || isSlot || isPrivate;
    });

    let pagePath;
    let folderPath = "";
    if (!hasRouterSyntax) {
      folderPath = path.join(srcFolder, ...reqSegments);
      if (existsSync(folderPath)) {
        for (const ext of [".tsx", ".ts", ".jsx", ".js"]) {
          const candidatePath = path.join(folderPath, `page${ext}`);
          if (existsSync(candidatePath)) {
            pagePath = candidatePath;
            break;
          }
        }
      }
    }
    let dynamicParams = {};

    if (!pagePath) {
      const [filePath, dParams] = getFilePathAndDynamicParams(
        reqSegments,
        query,
        srcFolder,
      );
      pagePath = filePath;
      dynamicParams = dParams ?? {};
    }

    if (!pagePath || forceNotFound) {
      if (isNotFound) isNotFound.value = true;
      const [notFoundPath, dParams] = getFilePathAndDynamicParams(
        reqSegments,
        query,
        srcFolder,
        "not_found",
        true,
        false,
      );
      if (!notFoundPath) {
        jsx = React.createElement(
          "div",
          null,
          `Page not found: no "page" file found for "${normalizedReqPath}"`,
        );
      } else {
        const pageModule = await importModule(notFoundPath);
        const Page = pageModule.default ?? pageModule;
        let props = {
          params: dParams ?? {},
        };
        const notFoundDir = path.dirname(notFoundPath);

        const [pageFunctionsPath] = getFilePathAndDynamicParams(
          reqSegments,
          query,
          notFoundDir,
          "page_functions",
          true,
          true,
          undefined,
          reqSegments.length,
        );
        if (pageFunctionsPath) {
          const pageFunctionsModule = await importModule(pageFunctionsPath);
          const getProps = pageFunctionsModule.getProps;
          pageFunctionsProps = await getProps?.(dParams ?? {});
          props = { ...props, ...(pageFunctionsProps ?? {}) };
        }

        jsx = React.createElement(Page, props);
        const noLayoutNotFoundPath = path.join(
          notFoundDir,
          `no_layout_not_found`,
        );
        if (existsSync(noLayoutNotFoundPath)) {
          return jsx;
        }
      }
    } else {
      if (isNotFound) isNotFound.value = false;
      const pageModule = await importModule(pagePath);
      const Page = pageModule.default ?? pageModule;

      let props = {
        params: dynamicParams,
      };

      const pageFolder = path.dirname(pagePath);
      const [pageFunctionsPath] = getFilePathAndDynamicParams(
        reqSegments,
        query,
        pageFolder,
        "page_functions",
        true,
        true,
        undefined,
        reqSegments.length,
      );
      if (pageFunctionsPath) {
        const pageFunctionsModule = await importModule(pageFunctionsPath);
        const getProps = pageFunctionsModule.getProps;
        pageFunctionsProps = await getProps?.(dynamicParams);
        props = { ...props, ...(pageFunctionsProps ?? {}) };
      }

      jsx = React.createElement(Page, props);
    }

    // 2. Manejo segmentado para Página: Si se solicita solo la página, retornar sin layouts
    if (options && options.segment === "page") {
      return jsx;
    }
  }

  if (
    getFilePathAndDynamicParams(
      reqSegments,
      query,
      srcFolder,
      "no_layout",
      false,
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
    true,
  );

  if (layouts && Array.isArray(layouts)) {
    let index = 0;
    for (const [layoutPath, dParams, slots] of layouts.reverse()) {
      const layoutModule = await importModule(layoutPath);
      const layoutFolderPath = path.dirname(layoutPath);
      const resetLayoutPath = getFilePathAndDynamicParams(
        [],
        {},
        layoutFolderPath,
        "reset_layout",
        false,
      )[0];
      const Layout = layoutModule.default ?? layoutModule;
      const updatedSlots = {};
      for (const [slotName, slotValue] of Object.entries(slots)) {
        let updatedSlotElement;
        const slotFilePath = slotValue?.slotPath || slotValue?.props?.__modulePath;
        const slotParams = slotValue?.slotParams || slotValue?.props?.params || {};
        try {
          let elementToRender;
          if (slotValue && slotValue.slotPath) {
            const slotModule = await importModule(slotValue.slotPath);
            const Slot = slotModule.default ?? slotModule;
            elementToRender = React.createElement(Slot, {
              params: slotParams,
              key: slotName,
              __modulePath: slotValue.slotPath,
            });
          } else {
            elementToRender = slotValue;
          }
          await asyncRenderJSXToClientJSX(elementToRender);
          updatedSlotElement = elementToRender;
        } catch (e) {
          if (slotFilePath) {
            const realSlotFolder = path.dirname(slotFilePath);

            const [slotErrorPath, slotErrorParams] =
              getFilePathAndDynamicParams(
                reqSegments,
                query,
                realSlotFolder,
                "error",
                true, // withExtension
                true, // finalDestination
                undefined, // lastFound
                reqSegments.length,
              );

            if (slotErrorPath) {
              const slotErrorModule = await importModule(slotErrorPath);
              const SlotError = slotErrorModule.default ?? slotErrorModule;

              const serializedError = {
                message: e.message || "Unknown Error",
                name: e.name,
                stack: isDevelopment ? e.stack : undefined,
              };

              updatedSlotElement = React.createElement(SlotError, {
                params: slotErrorParams,
                key: slotName,
                error: serializedError,
              });
            } else {
              console.warn(
                `[Dinou] Slot @${slotName} failed and does not have error.tsx`,
              );
              updatedSlotElement = null;
            }
          } else {
            console.error(
              `[Dinou] Could not locate the path of the slot @${slotName}`,
            );
            updatedSlotElement = null;
          }
        } finally {
          updatedSlots[slotName] = updatedSlotElement;
        }
      }
      const layoutProps = await getLayoutProps(layoutPath, dParams);
      let props = { params: dParams, ...updatedSlots, ...(layoutProps ?? {}) };
      try {
        const testElement = React.createElement(Layout, props, null);
        await asyncRenderJSXToClientJSX(testElement);
        jsx = React.createElement(Layout, props, jsx);
      } catch (layoutErr) {
        console.warn(
          `[Dinou] Layout ${layoutPath} failed during render, isolating layout error:`,
          layoutErr?.message || layoutErr
        );
        const { getErrorJSX } = require("./get-error-jsx");
        const serializedError = {
          message: layoutErr.message || "Unknown Error",
          name: layoutErr.name || "Error",
          stack: isDevelopment ? layoutErr.stack : undefined,
        };
        jsx = await getErrorJSX(
          reqPath,
          query,
          serializedError,
          isDevelopment,
          { segment: "page" }
        );
      }
      if (resetLayoutPath) {
        break;
      }
      index++;
    }
  }

  return jsx;
}

module.exports = getJSX;
