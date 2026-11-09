import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { existsSync } from "./vfs.js";
import React from "react";
import {
  getFilePathAndDynamicParams,
} from "./get-file-path-and-dynamic-params.js";
import importModule from "./import-module.js";
import {
  asyncRenderJSXToClientJSX,
  replaceLayoutChildrenPlaceholder,
} from "./render-jsx-to-client-jsx.js";
import { getLayoutProps, resolveLayoutChainPpr } from "./layout-functions.js";
import { resolveModulePpr } from "./resolve-module-ppr.js";
import { DinouPageSlot as RawDinouPageSlot } from "./slot.js";
import { getErrorJSX } from "./get-error-jsx.js";
import {
  markPageRootElement,
  markLayoutRootElement,
  createLayoutChildrenPlaceholder,
  runInPageSegment,
  runInLayoutSegment,
  isPprBuildActive,
  getPprStore,
} from "./ppr-context.js";
import { getContext } from "./request-context.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const currentDir = path.dirname(fileURLToPath(import.meta.url));

function createDinouPageSlotElement() {
  let DinouPageSlot = RawDinouPageSlot;
  if (
    typeof DinouPageSlot === "function" &&
    DinouPageSlot.$$typeof !== Symbol.for("react.client.reference")
  ) {
    const slotPath = path.resolve(currentDir, "slot.js");
    const fileUrl = pathToFileURL(slotPath).href;
    let regFn = null;
    try {
      const pkg = require("react-server-dom-webpack/server");
      regFn = pkg.registerClientReference;
    } catch (e) {}
    if (!regFn) {
      try {
        const pkg = require("@roggc/react-server-dom-esm/server.node");
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
  return React.createElement(DinouPageSlot);
}

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

  const { layoutPprMap, defaultPpr } = await resolveLayoutChainPpr(
    reqSegments,
    query || {},
    srcFolder,
    { ignoreNoLayout: options?.segment === "layout" },
  );

  // 1. Segmented handling for Layout: If only the layout is requested
  if (options && options.segment === "layout") {
    jsx = createDinouPageSlotElement();
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
        jsx = markPageRootElement(
          React.createElement(
            "div",
            null,
            `Page not found: no "page" file found for "${normalizedReqPath}"`,
          ),
          Boolean(defaultPpr),
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
        let explicitNotFoundPpr = null;
        if (pageFunctionsPath) {
          const pageFunctionsModule = await importModule(pageFunctionsPath);
          explicitNotFoundPpr = await resolveModulePpr(pageFunctionsModule);
          const defaultExport = pageFunctionsModule.default?.default ? pageFunctionsModule.default.default : pageFunctionsModule.default;
          const getProps = pageFunctionsModule.getProps || defaultExport?.getProps;
          pageFunctionsProps = await getProps?.(dParams ?? {});
          props = { ...props, ...(pageFunctionsProps ?? {}) };
        }
        const notFoundEffectivePpr =
          explicitNotFoundPpr !== null
            ? explicitNotFoundPpr
            : Boolean(defaultPpr);

        jsx = markPageRootElement(
          React.createElement(Page, props),
          notFoundEffectivePpr,
        );
        const noLayoutNotFoundPath = path.join(
          notFoundDir,
          `no_layout_not_found`,
        );
        if (existsSync(noLayoutNotFoundPath)) {
          if (
            !isPprBuildActive() &&
            !getPprStore() &&
            !getContext()?._isPprRuntimeResume &&
            !options?.skipLayoutProbe
          ) {
            jsx = await runInPageSegment(() => asyncRenderJSXToClientJSX(jsx));
            const ctx = getContext();
            if (ctx) {
              ctx._resolvedPageClientJsx = jsx;
              ctx._resolvedLayoutClientJsx = null;
              ctx._hasResolvedSegments = true;
            }
          }
          return jsx;
        }
      }
    } else {
      if (isNotFound) isNotFound.value = false;

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
      let pageFunctionsModule = null;
      let explicitPagePpr = null;
      if (pageFunctionsPath) {
        pageFunctionsModule = await importModule(pageFunctionsPath);
        explicitPagePpr = await resolveModulePpr(pageFunctionsModule);
      }
      if (
        explicitPagePpr === null &&
        typeof globalThis !== "undefined" &&
        globalThis.__DINOU_ROUTE_METADATA__
      ) {
        const normKey = (pageFunctionsPath || pagePath || "").replace(
          /\\/g,
          "/",
        );
        for (const [k, meta] of Object.entries(
          globalThis.__DINOU_ROUTE_METADATA__,
        )) {
          if (
            meta.ppr !== undefined &&
            (normKey === k || normKey.endsWith("/" + k) || normKey.endsWith(k))
          ) {
            explicitPagePpr = Boolean(meta.ppr);
            break;
          }
        }
      }
      const pageEffectivePpr =
        explicitPagePpr !== null ? explicitPagePpr : Boolean(defaultPpr);

      if (getContext()?._isPprRuntimeResume && !pageEffectivePpr) {
        if (options && options.segment === "page") {
          return null;
        }
        jsx = markPageRootElement(null, false);
      } else {
        const pageModule = await importModule(pagePath);
        const Page = pageModule.default ?? pageModule;

        let props = {
          params: dynamicParams,
        };

        if (pageFunctionsModule) {
          const defaultExport = pageFunctionsModule.default?.default
            ? pageFunctionsModule.default.default
            : pageFunctionsModule.default;
          const getProps =
            pageFunctionsModule.getProps || defaultExport?.getProps;
          pageFunctionsProps = await getProps?.(dynamicParams);
          props = { ...props, ...(pageFunctionsProps ?? {}) };
        }

        jsx = markPageRootElement(
          React.createElement(Page, props),
          pageEffectivePpr,
        );
      }
    }

    if (
      !isPprBuildActive() &&
      !getPprStore() &&
      !getContext()?._isPprRuntimeResume &&
      !options?.skipLayoutProbe
    ) {
      jsx = await runInPageSegment(() => asyncRenderJSXToClientJSX(jsx));
      const ctx = getContext();
      if (ctx) {
        ctx._resolvedPageClientJsx = jsx;
      }
    }

    // 2. Segmented handling for Page: If only the page is requested, return without layouts
    if (options && options.segment === "page") {
      return jsx;
    }
  }

  if (
    options?.segment !== "layout" &&
    getFilePathAndDynamicParams(
      reqSegments,
      query,
      srcFolder,
      "no_layout",
      false,
    )[0]
  ) {
    const ctx = getContext();
    if (ctx && !options?.segment) {
      ctx._resolvedLayoutClientJsx = null;
      ctx._hasResolvedSegments = true;
    }
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
    const layoutSegmentStore = { active: true, idCount: 0, holeCount: 0 };
    let layoutOnlyJsx = !options?.segment && layouts.length > 0 ? createDinouPageSlotElement() : null;
    let layoutRenderFailed = false;
    for (const [layoutPath, dParams, slots] of layouts.reverse()) {
      const layoutFolderPath = path.dirname(layoutPath);
      const resetLayoutPath = getFilePathAndDynamicParams(
        [],
        {},
        layoutFolderPath,
        "reset_layout",
        false,
      )[0];
      const normLayoutPath = layoutPath.replace(/\\/g, "/");
      const layoutEffectivePpr = layoutPprMap.has(normLayoutPath)
        ? Boolean(layoutPprMap.get(normLayoutPath))
        : Boolean(defaultPpr);

      if (getContext()?._isPprRuntimeResume && !layoutEffectivePpr) {
        if (resetLayoutPath) {
          break;
        }
        index++;
        continue;
      }

      const layoutModule = await importModule(layoutPath);
      const Layout = layoutModule.default ?? layoutModule;
      const updatedSlots = {};
      for (const [slotName, slotValue] of Object.entries(slots)) {
        let updatedSlotElement;
        const slotFilePath = slotValue?.slotPath || slotValue?.props?.__modulePath;
        const slotParams = slotValue?.slotParams || slotValue?.props?.params || {};
        const prevSlotIdCount = layoutSegmentStore.idCount;
        const prevSlotHoleCount = layoutSegmentStore.holeCount;
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
          elementToRender = markLayoutRootElement(
            elementToRender,
            layoutEffectivePpr,
          );
          const resolvedSlot = await runInLayoutSegment(
            () => asyncRenderJSXToClientJSX(elementToRender),
            layoutSegmentStore
          );
          updatedSlotElement =
            isPprBuildActive() || Boolean(getPprStore())
              ? elementToRender
              : resolvedSlot;
        } catch (e) {
          layoutSegmentStore.idCount = prevSlotIdCount;
          layoutSegmentStore.holeCount = prevSlotHoleCount;
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
      if (options?.skipLayoutProbe) {
        jsx = markLayoutRootElement(
          React.createElement(Layout, props, jsx),
          layoutEffectivePpr,
        );
        layoutOnlyJsx = null;
      } else if (isPprBuildActive() || Boolean(getPprStore())) {
        try {
          const testElement = markLayoutRootElement(
            React.createElement(Layout, props, null),
            layoutEffectivePpr,
          );
          await runInLayoutSegment(() => asyncRenderJSXToClientJSX(testElement));
          jsx = markLayoutRootElement(
            React.createElement(Layout, props, jsx),
            layoutEffectivePpr,
          );
          layoutOnlyJsx = null;
        } catch (layoutErr) {
          layoutRenderFailed = true;
          layoutOnlyJsx = null;
          console.warn(
            `[Dinou] Layout ${layoutPath} failed during render, isolating layout error:`,
            layoutErr?.message || layoutErr
          );
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
      } else {
        const prevLayoutIdCount = layoutSegmentStore.idCount;
        const prevLayoutHoleCount = layoutSegmentStore.holeCount;
        try {
          const placeholder = createLayoutChildrenPlaceholder();
          const testElement = markLayoutRootElement(
            React.createElement(Layout, props, placeholder),
            layoutEffectivePpr,
          );
          const resolvedLayout = await runInLayoutSegment(
            () => asyncRenderJSXToClientJSX(testElement),
            layoutSegmentStore
          );
          jsx = replaceLayoutChildrenPlaceholder(resolvedLayout, jsx, placeholder);
          if (layoutOnlyJsx && !layoutRenderFailed) {
            layoutOnlyJsx = replaceLayoutChildrenPlaceholder(resolvedLayout, layoutOnlyJsx, placeholder);
          }
        } catch (layoutErr) {
          layoutRenderFailed = true;
          layoutOnlyJsx = null;
          layoutSegmentStore.idCount = prevLayoutIdCount;
          layoutSegmentStore.holeCount = prevLayoutHoleCount;
          console.warn(
            `[Dinou] Layout ${layoutPath} failed during render, isolating layout error:`,
            layoutErr?.message || layoutErr
          );
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
      }
      if (resetLayoutPath) {
        break;
      }
      index++;
    }
    if (!options?.segment) {
      const ctx = getContext();
      if (ctx) {
        if (!layoutRenderFailed) {
          ctx._resolvedLayoutClientJsx = layouts.length > 0 ? layoutOnlyJsx : null;
          ctx._hasResolvedSegments = Boolean(layouts.length === 0 || layoutOnlyJsx);
        } else {
          ctx._resolvedLayoutClientJsx = null;
          ctx._hasResolvedSegments = false;
        }
      }
    }
  } else if (!options?.segment) {
    const ctx = getContext();
    if (ctx) {
      ctx._resolvedLayoutClientJsx = null;
      ctx._hasResolvedSegments = true;
    }
  }

  return jsx;
}

export { getJSX };
export default getJSX;
