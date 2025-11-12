const path = require("path");
const { existsSync } = require("fs");
const React = require("react");
const {
  getFilePathAndDynamicParams,
} = require("./get-file-path-and-dynamic-params");
const importModule = require("./import-module");

async function getErrorJSX(reqPath, query, error) {
  const srcFolder = path.resolve(process.cwd(), "src");
  const reqSegments = reqPath.split("/").filter(Boolean);
  const folderPath = path.join(srcFolder, ...reqSegments);
  let pagePath;
  if (existsSync(folderPath)) {
    for (const ext of [".tsx", ".ts", ".jsx", ".js"]) {
      const candidatePath = path.join(folderPath, `error${ext}`);
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
      query,
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
        let props = { params: dParams, query, ...slots };
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
