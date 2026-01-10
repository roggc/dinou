const path = require("path");
const { existsSync } = require("fs");
const React = require("react");
const {
  getFilePathAndDynamicParams,
} = require("./get-file-path-and-dynamic-params");
const importModule = require("./import-module");
const { asyncRenderJSXToClientJSX } = require("./render-jsx-to-client-jsx");

async function getJSX(
  reqPath,
  query,
  isNotFound = null,
  isDevelopment = false
) {
  const srcFolder = path.resolve(process.cwd(), "src");
  const reqSegments = reqPath.split("/").filter(Boolean);
  const hasRouterSyntax = reqSegments.some((seg) => {
    const isGroup = seg.startsWith("(") && seg.endsWith(")");

    const isDynamic = seg.startsWith("[") && seg.endsWith("]");
    const isSlot = seg.startsWith("@");

    return isGroup || isDynamic || isSlot;
  });

  let pagePath;
  if (!hasRouterSyntax) {
    const folderPath = path.join(srcFolder, ...reqSegments);
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
      srcFolder
    );
    pagePath = filePath;
    dynamicParams = dParams ?? {};
  }

  let jsx;
  let pageFunctionsProps;

  if (!pagePath) {
    if (isNotFound) isNotFound.value = true;
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
      const pageModule = await importModule(notFoundPath);
      const Page = pageModule.default ?? pageModule;
      jsx = React.createElement(Page, {
        params: dParams ?? {},
        // searchParams: query,
      });

      const notFoundDir = path.dirname(notFoundPath);
      const noLayoutNotFoundPath = path.join(
        notFoundDir,
        `no_layout_not_found`
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
      // searchParams: query,
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
      reqSegments.length
    );
    if (pageFunctionsPath) {
      const pageFunctionsModule = await importModule(pageFunctionsPath);
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
      const layoutModule = await importModule(layoutPath);
      const layoutFolderPath = path.dirname(layoutPath);
      const resetLayoutPath = getFilePathAndDynamicParams(
        [],
        {},
        layoutFolderPath,
        "reset_layout",
        false
      )[0];
      const Layout = layoutModule.default ?? layoutModule;
      const updatedSlots = {};
      for (const [slotName, slotElement] of Object.entries(slots)) {
        let updatedSlotElement;
        try {
          await asyncRenderJSXToClientJSX(slotElement);
          updatedSlotElement = slotElement;
        } catch (e) {
          const slotFilePath = slotElement.props?.__modulePath;

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
                reqSegments.length
              );

            if (slotErrorPath) {
              const slotErrorModule = require(slotErrorPath);
              const SlotError = slotErrorModule.default ?? slotErrorModule;

              const serializedError = {
                message: e.message || "Unknown Error",
                name: e.name,
                stack: isDevelopment ? e.stack : undefined,
              };

              updatedSlotElement = React.createElement(SlotError, {
                params: slotErrorParams,
                // searchParams: query,
                key: slotName,
                error: serializedError,
              });
            } else {
              console.warn(
                `[Dinou] Slot @${slotName} failed and does not have error.tsx`
              );
              updatedSlotElement = null;
            }
          } else {
            console.error(
              `[Dinou] Could not locate the path of the slot @${slotName}`
            );
            updatedSlotElement = null;
          }
        } finally {
          updatedSlots[slotName] = updatedSlotElement;
        }
      }
      let props = { params: dParams, /*searchParams: query,*/ ...updatedSlots };
      if (index === layouts.length - 1 || resetLayoutPath) {
        props = { ...props, ...(pageFunctionsProps?.layout ?? {}) };
      }
      jsx = React.createElement(Layout, props, jsx);
      if (resetLayoutPath) {
        break;
      }
      index++;
    }
  }

  return jsx;
}

module.exports = getJSX;
