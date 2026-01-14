const path = require("path");
const { existsSync } = require("fs");
const React = require("react");
const {
  getFilePathAndDynamicParams,
} = require("./get-file-path-and-dynamic-params");
const importModule = require("./import-module");
const { asyncRenderJSXToClientJSX } = require("./render-jsx-to-client-jsx");

async function getErrorJSX(reqPath, query, error, isDevelopment = false) {
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
        const candidatePath = path.join(folderPath, `error${ext}`);
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
      "error"
    );
    pagePath = filePath;
    dynamicParams = dParams ?? {};
  }

  let jsx;

  if (!pagePath) {
    const [errorPath, dParams] = getFilePathAndDynamicParams(
      reqSegments,
      query,
      srcFolder,
      "error",
      true,
      false
    );
    if (errorPath) {
      pagePath = errorPath;
      dynamicParams = dParams ?? {};
    }
  }

  if (pagePath) {
    const pageModule = await importModule(pagePath);
    const Page = pageModule.default ?? pageModule;
    jsx = React.createElement(Page, {
      params: dynamicParams ?? {},
      // searchParams: query,
      error,
    });

    const noLayoutErrorPath = path.join(
      path.dirname(pagePath),
      `no_layout_error`
    );
    if (existsSync(noLayoutErrorPath)) {
      return jsx;
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
        const Layout = layoutModule.default ?? layoutModule;
        const updatedSlots = {};
        for (const [slotName, slotElement] of Object.entries(slots)) {
          let updatedSlotElement;
          try {
            await asyncRenderJSXToClientJSX(slotElement);
            updatedSlotElement = slotElement;
          } catch (e) {
            // 1. RECOVER THE REAL PATH
            // We use the "hack" (metadata) that we inject in getSlots.
            // This gives us the path to the file: .../src/(group)/@sidebar/page.tsx
            const slotFilePath = slotElement.props?.__modulePath;

            if (slotFilePath) {
              // 2. GET THE SLOT FOLDER
              // Remove the file name to stay with the directory:
              // .../src/(group)/@sidebar
              const realSlotFolder = path.dirname(slotFilePath);

              // 3. SEARCH FOR ERROR.TSX IN THAT FOLDER
              // We use your helper, but now we pass the CORRECT folder as 'currentPath'.
              const [slotErrorPath, slotErrorParams] =
                getFilePathAndDynamicParams(
                  reqSegments,
                  query, // query (irrelevant for searching the file)
                  realSlotFolder, // <--- THE KEY: We search inside the real folder of the slot
                  "error", // We search for 'error' (error.tsx, error.js, etc.)
                  true, // withExtension
                  true, // finalDestination
                  undefined, // lastFound
                  reqSegments.length // TRICK: We force index at the end so that it searches for direct file
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
                  params: slotErrorParams, // Resolved params (if any)
                  // searchParams: query,
                  key: slotName,
                  error: serializedError, // We pass the captured error
                });
              } else {
                // Optional: If there is no error.tsx, you could log or return null
                console.warn(
                  `[Dinou] Slot @${slotName} failed and does not have error.tsx`
                );
                updatedSlotElement = null;
              }
            } else {
              // If for some reason we do not have __modulePath (e.g., pure static component without wrapper)
              console.error(
                `[Dinou] Could not locate the path of the slot @${slotName}`
              );
              updatedSlotElement = null;
            }
          } finally {
            updatedSlots[slotName] = updatedSlotElement;
          }
        }
        let props = {
          params: dParams,
          /* searchParams: query,*/ ...updatedSlots,
        };
        jsx = React.createElement(Layout, props, jsx);
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

  return jsx;
}

module.exports = {
  getErrorJSX,
};
