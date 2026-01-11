const path = require("path");
const { existsSync, readdirSync, mkdirSync, rmSync } = require("fs");
const React = require("react");
const { asyncRenderJSXToClientJSX } = require("./render-jsx-to-client-jsx");
const {
  getFilePathAndDynamicParams,
} = require("./get-file-path-and-dynamic-params");
const importModule = require("./import-module");
const { requestStorage } = require("./request-context.js");
const { setJSXJSON } = require("./jsx-json.js");

function safeDecode(val) {
  try {
    return !!val ? decodeURIComponent(val) : val;
  } catch (e) {
    return val; // If decoding fails, return the original
  }
}

/**
 * Creates a spy that detects access to properties and marks the page as dynamic.
 * @param {Object} target - The real object (cookies, headers, query...)
 * @param {string} label - Name for the log (e.g., "Headers", "Cookies")
 * @param {Function} onBailout - Callback to execute when access is detected
 */
function createBailoutProxy(target, label, onBailout) {
  // If there is no target, use an empty object to avoid crashes,
  // but ideally pass whatever you have.
  const safeTarget = target || {};

  return new Proxy(safeTarget, {
    get(t, prop, receiver) {
      // Ignore internal Node/Console symbols
      if (
        typeof prop === "symbol" ||
        prop === "inspect" ||
        prop === "valueOf" ||
        prop === "toString" // Sometimes useful to ignore
      ) {
        return Reflect.get(t, prop, receiver);
      }

      // 🚨 ALARM: Access detected
      console.log(
        `[StaticBailout] Access to ${label} detected: "${String(prop)}".`
      );

      // Execute logic to mark as dynamic
      onBailout();

      // IMPORTANT: Return the real value of the original object
      return Reflect.get(t, prop, receiver);
    },

    ownKeys(t) {
      console.log(`[StaticBailout] Iteration of ${label} detected.`);
      onBailout();
      return Reflect.ownKeys(t);
    },

    // Optional: Detect if they try to ask "prop in headers"
    has(t, prop) {
      console.log(
        `[StaticBailout] Existence check (IN) in ${label}: "${String(prop)}".`
      );
      onBailout();
      return Reflect.has(t, prop);
    },
  });
}

async function buildStaticPages() {
  const srcFolder = path.resolve(process.cwd(), "src");
  const distFolder = path.resolve(process.cwd(), "dist");

  if (existsSync(distFolder)) {
    rmSync(distFolder, { recursive: true, force: true });
    console.log("Deleted existing dist folder");
  }

  if (!existsSync(distFolder)) {
    mkdirSync(distFolder, { recursive: true });
  }

  async function collectPages(
    currentPath,
    segments = [],
    params = {},
    dynamicStructure = [],
    doNotPushAtEnd = false
  ) {
    const entries = readdirSync(currentPath, { withFileTypes: true });
    const pages = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name.startsWith("(") && entry.name.endsWith(")")) {
          pages.push(
            ...(await collectPages(
              path.join(currentPath, entry.name),
              segments,
              params,
              dynamicStructure,
              doNotPushAtEnd
            ))
          );
        } else if (
          entry.name.startsWith("[[...") &&
          entry.name.endsWith("]]")
        ) {
          const paramName = entry.name.slice(5, -2);
          const dynamicPath = path.join(currentPath, entry.name);
          const [pagePath] = getFilePathAndDynamicParams(
            segments,
            {},
            dynamicPath,
            "page",
            true,
            true,
            undefined,
            segments.length
          );
          const [pageFunctionsPath] = getFilePathAndDynamicParams(
            segments,
            {},
            dynamicPath,
            "page_functions",
            true,
            true,
            undefined,
            segments.length
          );

          let dynamic, getStaticPaths;
          if (pageFunctionsPath) {
            const module = await importModule(pageFunctionsPath);
            getStaticPaths = module.getStaticPaths;
            dynamic = module.dynamic;
          }
          const isLocalPage =
            pagePath && path.dirname(pagePath) === dynamicPath;
          if (isLocalPage && !dynamic?.()) {
            console.log(
              `Found optional catch-all route: ${
                segments.join("/") ?? ""
              }/[[...${paramName}]]`
            );
            try {
              if (getStaticPaths) {
                const paths = await getStaticPaths();
                for (const pathItem of paths) {
                  // 1. Preparation of Structure and Extraction
                  const currentStructure = [...dynamicStructure, paramName];
                  const isObject =
                    typeof pathItem === "object" &&
                    pathItem !== null &&
                    !Array.isArray(pathItem);

                  let rawSegments;

                  if (isObject) {
                    rawSegments = currentStructure.map((key) => {
                      // A. Handling of Static Bridges
                      const isKeyObject =
                        typeof key === "object" && key !== null;
                      if (isKeyObject) {
                        return key.STATIC_PARAM_NAME;
                      }

                      // B. Value Extraction
                      const val = pathItem[key];

                      // IMPORTANT: For the Gap Check we need to keep 'undefined' or 'null'
                      // explicitly in the array, do not convert it to [] yet.
                      // If it is [] empty, we leave it as is so that .flat() removes it (does not count as gap).
                      return val;
                    });
                  } else {
                    // If not object, it is the direct value of the current parameter
                    rawSegments = [pathItem];
                  }

                  // Flatten. Note: undefined is kept in the array. [] disappears.
                  const flatSegments = rawSegments.flat();

                  // 🛡️ 2. GAP CHECK (Detection of prohibited gaps)
                  // Prohibited: [undefined, "something"]
                  // Permitted: ["something", undefined] or [undefined, undefined]
                  const hasGap = flatSegments.some((seg, index) => {
                    const isUndefined =
                      seg === undefined || seg === null || seg === "";
                    if (!isUndefined) return false;

                    // If this is undefined, we check if there is something defined to the right
                    const remaining = flatSegments.slice(index + 1);
                    return remaining.some(
                      (s) => s !== undefined && s !== null && s !== ""
                    );
                  });

                  if (hasGap) {
                    continue; // Invalid route (intermediate gap)
                  }

                  // 🛡️ 3. URL CLEANING
                  // Remove undefineds for the physical URL
                  const validSegmentsToAdd = flatSegments.filter(
                    (s) => s !== undefined && s !== null && s !== ""
                  );

                  // 🛡️ 4. PARAMS PREPARATION & NORMALIZATION
                  const paramsToAdd = isObject
                    ? { ...pathItem } // Clone to avoid mutation
                    : { [paramName]: pathItem };

                  // Specific normalization for Catch-all: undefined -> []
                  const currentVal = paramsToAdd[paramName];
                  if (
                    currentVal === undefined ||
                    currentVal === null ||
                    currentVal === ""
                  ) {
                    paramsToAdd[paramName] = [];
                  } else if (!Array.isArray(currentVal)) {
                    paramsToAdd[paramName] = [currentVal];
                  }

                  pages.push(
                    ...(await collectPages(
                      dynamicPath,
                      [...segments, ...validSegmentsToAdd],
                      { ...params, ...paramsToAdd }
                    ))
                  );
                }
              }
            } catch (err) {
              console.error(`Error loading ${pagePath}:`, err);
            }
          } else {
            // ⚠️ IMPORTANT: Update the history in the recursion
            pages.push(
              ...(await collectPages(
                dynamicPath,
                segments,
                params,
                [...dynamicStructure, paramName],
                true
              ))
            );
          }
        } else if (entry.name.startsWith("[...") && entry.name.endsWith("]")) {
          const paramName = entry.name.slice(4, -1);
          const dynamicPath = path.join(currentPath, entry.name);
          const [pagePath] = getFilePathAndDynamicParams(
            segments,
            {},
            dynamicPath,
            "page",
            true,
            true,
            undefined,
            segments.length
          );
          const [pageFunctionsPath] = getFilePathAndDynamicParams(
            segments,
            {},
            dynamicPath,
            "page_functions",
            true,
            true,
            undefined,
            segments.length
          );

          let dynamic, getStaticPaths;
          if (pageFunctionsPath) {
            const module = await importModule(pageFunctionsPath);
            getStaticPaths = module.getStaticPaths;
            dynamic = module.dynamic;
          }
          const isLocalPage =
            pagePath && path.dirname(pagePath) === dynamicPath;
          if (isLocalPage && !dynamic?.()) {
            console.log(
              `Found catch-all route: ${
                segments.join("/") ?? ""
              }/[...${paramName}]`
            );
            try {
              if (getStaticPaths) {
                const paths = await getStaticPaths();
                for (const pathItem of paths) {
                  const currentStructure = [...dynamicStructure, paramName];
                  const isObject =
                    typeof pathItem === "object" &&
                    pathItem !== null &&
                    !Array.isArray(pathItem);

                  let segmentsToAdd;
                  if (isObject) {
                    let notValidRoute = false;
                    segmentsToAdd = currentStructure.map((key, i, arr) => {
                      const isObject = typeof key === "object" && key !== null;
                      if (isObject) {
                        return key.STATIC_PARAM_NAME;
                      }
                      const val = pathItem[key];

                      // 🛡️ FIX 1: Relaxed validation.
                      // We only throw error if the CURRENT parameter (which is mandatory catch-all) is missing.
                      // If parent keys are missing (key !== paramName), we allow undefined (assume optional).
                      if (
                        (val === undefined || val === null || val === "") &&
                        i < arr.length - 1
                      ) {
                        notValidRoute = true;
                      }
                      // throw new Error(
                      //   `[Dinou] The mandatory catch-all parameter '${paramName}' is undefined in ${dynamicPath}.`
                      // );
                      return val;
                    });
                    if (notValidRoute) continue;
                  } else {
                    segmentsToAdd = [pathItem];
                  }

                  // 🛡️ FIX 2: Segment filtering.
                  // Flatten (.flat) to handle the catch-all array and filter undefineds from parents.
                  const validSegmentsToAdd = segmentsToAdd.flat();
                  // .filter((s) => s !== undefined && s !== null && s !== "");

                  const paramsToAdd = isObject
                    ? pathItem
                    : { [paramName]: pathItem };

                  pages.push(
                    ...(await collectPages(
                      dynamicPath,
                      [...segments, ...validSegmentsToAdd], // Use the filtered version
                      { ...params, ...paramsToAdd }
                    ))
                  );
                }
              }
            } catch (err) {
              console.error(`Error loading ${pagePath}:`, err);
            }
          } else {
            // ⚠️ IMPORTANT: Update the history
            pages.push(
              ...(await collectPages(
                dynamicPath,
                segments,
                params,
                [...dynamicStructure, paramName],
                true
              ))
            );
          }
        } else if (entry.name.startsWith("[[") && entry.name.endsWith("]]")) {
          const paramName = entry.name.slice(2, -2);
          const dynamicPath = path.join(currentPath, entry.name);
          const [pagePath] = getFilePathAndDynamicParams(
            segments,
            {},
            dynamicPath,
            "page",
            true,
            true,
            undefined,
            segments.length
          );
          const [pageFunctionsPath] = getFilePathAndDynamicParams(
            segments,
            {},
            dynamicPath,
            "page_functions",
            true,
            true,
            undefined,
            segments.length
          );

          let dynamic, getStaticPaths;
          if (pageFunctionsPath) {
            const module = await importModule(pageFunctionsPath);
            getStaticPaths = module.getStaticPaths;
            dynamic = module.dynamic;
          }
          const isLocalPage =
            pagePath && path.dirname(pagePath) === dynamicPath;
          if (isLocalPage && !dynamic?.()) {
            console.log(
              `Found optional dynamic route: ${
                segments.join("/") ?? ""
              }/[[${paramName}]]`
            );
            try {
              if (getStaticPaths) {
                const paths = await getStaticPaths();
                for (const pathItem of paths) {
                  // 1. Preparation of Structure and Extraction
                  const currentStructure = [...dynamicStructure, paramName];
                  const isObject =
                    typeof pathItem === "object" && pathItem !== null; // Single param should not be array, but for safety.

                  let rawSegments;

                  if (isObject) {
                    rawSegments = currentStructure.map((key) => {
                      // A. Handling of Static Bridges
                      const isKeyObject =
                        typeof key === "object" && key !== null;
                      if (isKeyObject) {
                        return key.STATIC_PARAM_NAME;
                      }

                      // B. Value Extraction
                      // Return the value as is (undefined stays as undefined for the check)
                      return pathItem[key];
                    });
                  } else {
                    rawSegments = [pathItem];
                  }

                  // Flatten (in case there is some weird nested array, although in single it shouldn't)
                  const flatSegments = rawSegments.flat();

                  // 🛡️ 2. GAP CHECK (Detection of prohibited gaps)
                  // Allows /inventory/[[a]]/[[b]] to generate /inventory if a and b are undefined
                  const hasGap = flatSegments.some((seg, index) => {
                    const isUndefined =
                      seg === undefined || seg === null || seg === "";
                    if (!isUndefined) return false;

                    // Check to the right
                    const remaining = flatSegments.slice(index + 1);
                    return remaining.some(
                      (s) => s !== undefined && s !== null && s !== ""
                    );
                  });

                  if (hasGap) {
                    continue; // Invalid route
                  }

                  // 🛡️ 3. URL CLEANING
                  const validSegmentsToAdd = flatSegments.filter(
                    (s) => s !== undefined && s !== null && s !== ""
                  );

                  // 🛡️ 4. PARAMS PREPARATION
                  // Here we DO NOT normalize to [], because it is a single parameter.
                  // undefined stays as undefined.
                  const paramsToAdd = isObject
                    ? pathItem
                    : { [paramName]: pathItem };

                  pages.push(
                    ...(await collectPages(
                      dynamicPath,
                      [...segments, ...validSegmentsToAdd],
                      { ...params, ...paramsToAdd }
                    ))
                  );
                }
              }
            } catch (err) {
              console.error(`Error loading ${pagePath}:`, err);
            }
          } else {
            // ⚠️ IMPORTANT: Update the history
            pages.push(
              ...(await collectPages(
                dynamicPath,
                segments,
                params,
                [...dynamicStructure, paramName],
                true
              ))
            );
          }
        } else if (entry.name.startsWith("[") && entry.name.endsWith("]")) {
          const paramName = entry.name.slice(1, -1);
          const dynamicPath = path.join(currentPath, entry.name);
          const [pagePath] = getFilePathAndDynamicParams(
            segments,
            {},
            dynamicPath,
            "page",
            true,
            true,
            undefined,
            segments.length
          );
          const [pageFunctionsPath] = getFilePathAndDynamicParams(
            segments,
            {},
            dynamicPath,
            "page_functions",
            true,
            true,
            undefined,
            segments.length
          );
          let dynamic;
          let getStaticPaths;
          if (pageFunctionsPath) {
            const module = await importModule(pageFunctionsPath);
            getStaticPaths = module.getStaticPaths;
            dynamic = module.dynamic;
          }
          const isLocalPage =
            pagePath && path.dirname(pagePath) === dynamicPath;
          if (isLocalPage && !dynamic?.()) {
            console.log(
              `Found dynamic route: ${segments.join("/") ?? ""}/[${paramName}]`
            );
            try {
              if (getStaticPaths) {
                const paths = await getStaticPaths();
                for (const pathItem of paths) {
                  const currentStructure = [...dynamicStructure, paramName];
                  const isObject =
                    typeof pathItem === "object" && pathItem !== null;

                  let segmentsToAdd;

                  if (isObject) {
                    let notValidRoute = false;
                    segmentsToAdd = currentStructure.map((key, i, arr) => {
                      const isObject = typeof key === "object" && key !== null;
                      if (isObject) {
                        return key.STATIC_PARAM_NAME;
                      }
                      const val = pathItem[key];

                      // 🛡️ CHANGE: We only throw error if the CURRENT parameter (which is mandatory) is missing.
                      // If a parent parameter is missing (key !== paramName), we assume it could be optional.
                      if (
                        (val === undefined || val === null || val === "") &&
                        i < arr.length - 1
                      ) {
                        notValidRoute = true;
                        // throw new Error(
                        //   `[Dinou] The mandatory parameter '${paramName}' is undefined in ${dynamicPath}.`
                        // );
                      }
                      return val;
                    });
                    if (notValidRoute) continue;
                  } else {
                    segmentsToAdd = [pathItem];
                  }

                  // 🛡️ CHANGE: We filter undefineds here too, because a parent could be optional
                  const validSegmentsToAdd = segmentsToAdd.flat();
                  // .filter((s) => s !== undefined && s !== null && s !== "");

                  const paramsToAdd = isObject
                    ? pathItem
                    : { [paramName]: pathItem };

                  pages.push(
                    ...(await collectPages(
                      dynamicPath,
                      [...segments, ...validSegmentsToAdd], // Use the filtered version
                      { ...params, ...paramsToAdd }
                    ))
                  );
                }
              }
            } catch (err) {
              console.error(`Error loading ${pagePath}:`, err);
            }
          } else {
            pages.push(
              ...(await collectPages(
                dynamicPath,
                segments,
                params,
                [...dynamicStructure, paramName],
                true
              ))
            );
          }
        } else if (!entry.name.startsWith("@")) {
          if (dynamicStructure.length > 0) {
            const dynamicPath = path.join(currentPath, entry.name);
            const [pagePath] = getFilePathAndDynamicParams(
              segments,
              {},
              dynamicPath,
              "page",
              true,
              true,
              undefined,
              segments.length
            );
            const [pageFunctionsPath] = getFilePathAndDynamicParams(
              segments,
              {},
              dynamicPath,
              "page_functions",
              true,
              true,
              undefined,
              segments.length
            );
            let dynamic;
            let getStaticPaths;
            if (pageFunctionsPath) {
              const module = await importModule(pageFunctionsPath);
              getStaticPaths = module.getStaticPaths;
              dynamic = module.dynamic;
            }
            const isLocalPage =
              pagePath && path.dirname(pagePath) === dynamicPath;
            if (isLocalPage && !dynamic?.()) {
              try {
                if (getStaticPaths) {
                  const paths = await getStaticPaths();
                  for (const pathItem of paths) {
                    const currentStructure = dynamicStructure;
                    const isObject =
                      typeof pathItem === "object" && pathItem !== null;

                    let segmentsToAdd;

                    if (isObject) {
                      let notValidRoute = false;
                      segmentsToAdd = currentStructure.map((key, i, arr) => {
                        const isObject =
                          typeof key === "object" && key !== null;
                        if (isObject) {
                          return key.STATIC_PARAM_NAME;
                        }
                        const val = pathItem[key];

                        // 🛡️ CHANGE: We only throw error if the CURRENT parameter (which is mandatory) is missing.
                        // If a parent parameter is missing (key !== paramName), we assume it could be optional.
                        if (
                          (val === undefined || val === null || val === "") &&
                          i < arr.length - 1
                        ) {
                          notValidRoute = true;
                          // throw new Error(
                          //   `[Dinou] The mandatory parameter '${paramName}' is undefined in ${dynamicPath}.`
                          // );
                        }
                        return val;
                      });
                      if (notValidRoute) continue;
                    } else {
                      segmentsToAdd = [pathItem];
                    }

                    // 🛡️ CHANGE: We filter undefineds here too, because a parent could be optional
                    const validSegmentsToAdd = segmentsToAdd.flat();
                    // .filter((s) => s !== undefined && s !== null && s !== "");

                    const paramsToAdd = isObject
                      ? pathItem
                      : { [paramName]: pathItem };

                    pages.push(
                      ...(await collectPages(
                        dynamicPath,
                        [...segments, ...validSegmentsToAdd, entry.name], // Use the filtered version
                        { ...params, ...paramsToAdd }
                      ))
                    );
                  }
                }
              } catch (err) {
                console.error(`Error loading ${pagePath}:`, err);
              }
            } else {
              pages.push(
                ...(await collectPages(
                  path.join(currentPath, entry.name),
                  segments,
                  params,
                  [...dynamicStructure, { STATIC_PARAM_NAME: entry.name }],
                  true
                ))
              );
            }
          } else {
            pages.push(
              ...(await collectPages(
                path.join(currentPath, entry.name),
                [...segments, entry.name],
                params,
                dynamicStructure,
                false
              ))
            );
          }
        }
      }
    }

    const [pagePath, dParams] = getFilePathAndDynamicParams(
      segments,
      {},
      currentPath,
      "page",
      true,
      true,
      undefined,
      segments.length,
      params
    );
    const [pageFunctionsPath] = getFilePathAndDynamicParams(
      segments,
      {},
      currentPath,
      "page_functions",
      true,
      true,
      undefined,
      segments.length
    );
    let dynamic;
    if (pageFunctionsPath) {
      const module = await importModule(pageFunctionsPath);
      dynamic = module.dynamic;
    }

    if (pagePath && !dynamic?.() && !doNotPushAtEnd) {
      pages.push({
        path: currentPath,
        segments,
        params: dParams,
      });
      console.log(`Found static route: ${segments.join("/") || "/"}`);
    }

    return pages;
  }

  const pages = await collectPages(srcFolder);

  for (const { path: folderPath, segments, params } of pages) {
    try {
      const [pagePath] = getFilePathAndDynamicParams(
        segments,
        {},
        folderPath,
        "page",
        true,
        true,
        undefined,
        segments.length
      );
      const pageModule = await importModule(pagePath);
      const Page = pageModule.default ?? pageModule;
      // Set displayName for better serialization
      // if (!Page.displayName) Page.displayName = "Page";

      let props = { params /* searchParams: {}*/ };

      const [pageFunctionsPath] = getFilePathAndDynamicParams(
        segments,
        {},
        folderPath,
        "page_functions",
        true,
        true,
        undefined,
        segments.length
      );

      let pageFunctionsProps;
      let revalidate;

      if (pageFunctionsPath) {
        const pageFunctionsModule = await importModule(pageFunctionsPath);
        const getProps = pageFunctionsModule.getProps;
        revalidate = pageFunctionsModule.revalidate;
        pageFunctionsProps = await getProps?.(params);
        props = { ...props, ...(pageFunctionsProps?.page ?? {}) };
      }

      let jsx = React.createElement(Page, props);
      jsx = { ...jsx, __modulePath: pagePath };

      const noLayoutPath = path.join(folderPath, "no_layout");
      if (!existsSync(noLayoutPath)) {
        const layouts = getFilePathAndDynamicParams(
          segments,
          {},
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
            // if (!Layout.displayName) Layout.displayName = "Layout";
            const updatedSlots = {};
            for (const [slotName, slotElement] of Object.entries(slots)) {
              const alreadyFoundPath = slotElement.props?.__modulePath;

              updatedSlots[slotName] = {
                ...slotElement,
                __modulePath: alreadyFoundPath ?? null,
              };
            }
            let props = {
              params: dParams,
              /*searchParams: {},*/ ...updatedSlots,
            };
            if (index === layouts.length - 1) {
              props = { ...props, ...(pageFunctionsProps?.layout ?? {}) };
            }
            jsx = React.createElement(Layout, props, jsx);
            jsx = { ...jsx, __modulePath: layoutPath };
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
      const segmentsJoin = segments.join("/");
      const reqPath = segments.length ? "/" + segmentsJoin + "/" : "/";
      // ====================================================================
      // 1. MOCK RES: Fulfilling ResponseProxy interface
      // ====================================================================
      // Although contract says it returns void, internally we save
      // the state in case you want to log errors (ex: a redirect in build time).
      const mockRes = {
        _statusCode: 200,
        _headers: {},
        _redirectUrl: null,
        _cookies: [], // Optional: for debug

        // 👇 ADD THIS METHOD
        cookie(name, value, options) {
          // In SSG we do nothing real, but keep a record if you want to debug
          // console.log(`[SSG] Cookie set ignored: ${name}=${value}`);
          this._cookies.push({ name, value, options, isClear: false });
        },

        clearCookie(name, options) {
          this._cookies.push({ name, value: "", options, isClear: true });
        },

        // setHeader(name: string, value: string | ReadonlyArray<string>): void;
        setHeader(name, value) {
          this._headers[name.toLowerCase()] = value;
        },

        // status(code: number): void;
        status(code) {
          this._statusCode = code;
        },

        // redirect(status: number, url: string): void;
        // redirect(url: string): void;
        redirect(arg1, arg2) {
          let status = 302;
          let url = "";

          if (typeof arg1 === "number") {
            status = arg1;
            url = arg2;
          } else {
            url = arg1;
          }

          this._statusCode = status;
          this._redirectUrl = url;

          // Log warning because a redirect in SSG is usually problematic
          console.warn(
            `⚠️ [SSG] Redirect detected in ${reqPath} -> ${url} (${status})`
          );
        },
      };

      let isStatic = true;
      const markAsDynamic = () => {
        isStatic = false;
      };

      // 1. Cookies Spy
      const cookiesProxy = createBailoutProxy({}, "Cookies", markAsDynamic);

      // 2. Headers Spy
      // Note: req.headers usually comes from arguments or mocks
      const headersProxy = createBailoutProxy({}, "Headers", markAsDynamic);

      // 3. (Optional) Query/SearchParams Spy
      // If user reads ?id=5, it shouldn't be static either (usually)
      const queryProxy = createBailoutProxy({}, "Query", markAsDynamic);
      // {
      //           "user-agent": "Dinou-SSG-Builder",
      //           host: "localhost",
      //           // Add any default header you need here
      //         }
      // ====================================================================
      // 2. MOCK REQ: Fulfilling RequestContextStore['req']
      // ====================================================================
      const mockReq = {
        query: queryProxy,
        cookies: cookiesProxy,
        headers: headersProxy,
        path: reqPath,
        method: "GET",
      };

      // 3. FULL CONTEXT
      const mockContext = {
        req: mockReq,
        res: mockRes,
      };

      jsx = await requestStorage.run(mockContext, async () => {
        return await asyncRenderJSXToClientJSX(jsx);
      });

      if (!isStatic) {
        // ❌ DO NOT save file.
        // Will behave as pure SSR at runtime.
        console.log(
          `Skipping static generation for ${segments.join(
            "/"
          )} due to dynamic usage.`
        );
        continue;
      }

      // const outputPath = path.join(distFolder, segments.join("/"));
      // mkdirSync(outputPath, { recursive: true });

      // const jsonPath = path.join(outputPath, "index.json");

      const sideEffects = {
        redirect: mockRes._redirectUrl,
        cookies: mockRes._cookies,
      };

      setJSXJSON(reqPath, {
        jsx: serializeReactElement(jsx),
        revalidate: revalidate?.(),
        generatedAt: Date.now(),
        metadata: { effects: sideEffects },
      });
      console.log(`Serialized JSX for page at ${reqPath}`);
    } catch (err) {
      console.error(`Error building page ${segments.join("/")}:`, err);
      continue;
    }
  }

  console.log(`Static site generated with ${pages.length} pages`);
}

async function buildStaticPage(reqPath, isDynamic = null) {
  const srcFolder = path.resolve(process.cwd(), "src");

  try {
    const segments = reqPath.split("/").filter(Boolean);
    let folderPath = srcFolder;
    let dynamicParams = {};

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const isRouterSyntaxInSegment =
        segment &&
        ((segment.startsWith("(") && segment.endsWith(")")) ||
          (segment.startsWith("[") && segment.endsWith("]")) ||
          segment.startsWith("@"));
      const currentPath = path.join(folderPath, segment);
      if (existsSync(currentPath) && !isRouterSyntaxInSegment) {
        folderPath = currentPath;
        continue;
      }

      const entries = readdirSync(folderPath, { withFileTypes: true });
      const dynamicEntry = entries.find(
        (entry) =>
          entry.isDirectory() &&
          ((entry.name.startsWith("[") && entry.name.endsWith("]")) ||
            (entry.name.startsWith("[[") && entry.name.endsWith("]]")))
      );

      if (dynamicEntry) {
        folderPath = path.join(folderPath, dynamicEntry.name);
        const paramName = dynamicEntry.name
          .replace(/^\[\[?|\]\]?$/g, "")
          .replace("...", "");
        if (dynamicEntry.name.includes("...")) {
          dynamicParams[paramName] = segments.slice(i).map(safeDecode);
          break;
        } else {
          dynamicParams[paramName] = safeDecode(segment);
        }
      } else {
        throw new Error(`No matching route found for ${reqPath}`);
      }
    }

    const [pagePath, dParams] = getFilePathAndDynamicParams(
      segments,
      {},
      folderPath,
      "page",
      true,
      true,
      undefined,
      segments.length,
      dynamicParams
    );
    if (!pagePath) throw new Error(`No page found for ${reqPath}`);

    const pageModule = await importModule(pagePath);
    const Page = pageModule.default ?? pageModule;

    let props = { params: dParams /*searchParams: {}*/ };
    const [pageFunctionsPath] = getFilePathAndDynamicParams(
      segments,
      {},
      folderPath,
      "page_functions",
      true,
      true,
      undefined,
      segments.length
    );

    let pageFunctionsProps;
    let revalidate;
    if (pageFunctionsPath) {
      const pageFunctionsModule = await importModule(pageFunctionsPath);
      const getProps = pageFunctionsModule.getProps;
      if (isDynamic && (isDynamic.value = pageFunctionsModule.dynamic?.()))
        return;
      revalidate = pageFunctionsModule.revalidate;
      pageFunctionsProps = await getProps?.(dParams);
      props = { ...props, ...(pageFunctionsProps?.page ?? {}) };
    }

    let jsx = React.createElement(Page, props);
    jsx = { ...jsx, __modulePath: pagePath };

    const noLayoutPath = path.join(folderPath, "no_layout");
    if (!existsSync(noLayoutPath)) {
      const layouts = getFilePathAndDynamicParams(
        segments,
        {},
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
            const alreadyFoundPath = slotElement.props?.__modulePath;

            updatedSlots[slotName] = {
              ...slotElement,
              __modulePath: alreadyFoundPath ?? null,
            };
          }
          let layoutProps = {
            params: dParams,
            // searchParams: {},
            ...updatedSlots,
          };
          if (index === layouts.length - 1) {
            layoutProps = {
              ...layoutProps,
              ...(pageFunctionsProps?.layout ?? {}),
            };
          }
          jsx = React.createElement(Layout, layoutProps, jsx);
          jsx = { ...jsx, __modulePath: layoutPath };
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

    // ====================================================================
    // 1. MOCK RES: Fulfilling the ResponseProxy interface
    // ====================================================================
    // Although the contract says it returns void, internally we save
    // the state in case you want to log errors (e.g., a redirect at build time).
    const mockRes = {
      _statusCode: 200,
      _headers: {},
      _redirectUrl: null,
      _cookies: [], // Optional: for debug

      // 👇 ADD THIS METHOD
      cookie(name, value, options) {
        // In SSG we don't do anything real, but we save a record if you want to debug
        // console.log(`[SSG] Cookie set ignored: ${name}=${value}`);
        this._cookies.push({ name, value, options, isClear: false });
      },

      clearCookie(name, options) {
        this._cookies.push({ name, value: "", options, isClear: true });
      },

      // setHeader(name: string, value: string | ReadonlyArray<string>): void;
      setHeader(name, value) {
        this._headers[name.toLowerCase()] = value;
      },

      // status(code: number): void;
      status(code) {
        this._statusCode = code;
      },

      // redirect(status: number, url: string): void;
      // redirect(url: string): void;
      redirect(arg1, arg2) {
        let status = 302;
        let url = "";

        if (typeof arg1 === "number") {
          status = arg1;
          url = arg2;
        } else {
          url = arg1;
        }

        this._statusCode = status;
        this._redirectUrl = url;

        // We log a warning because a redirect in SSG is usually problematic
        console.warn(
          `⚠️ [SSG] Redirect detected in ${reqPath} -> ${url} (${status})`
        );
      },
    };

    let isStatic = true;
    const markAsDynamic = () => {
      isStatic = false;
    };

    // 1. Spy on Cookies
    const cookiesProxy = createBailoutProxy({}, "Cookies", markAsDynamic);

    // 2. Spy on Headers
    // Note: req.headers usually come from the arguments or mocks
    const headersProxy = createBailoutProxy({}, "Headers", markAsDynamic);

    // 3. (Optional) Spy on Query/SearchParams
    // If the user reads ?id=5, it shouldn't be static either (normally)
    const queryProxy = createBailoutProxy({}, "Query", markAsDynamic);
    //  {
    //         "user-agent": "Dinou-SSG-Builder",
    //         host: "localhost",
    //         // Add here any default header you need
    //       }
    // ====================================================================
    // 2. MOCK REQ: Fulfilling RequestContextStore['req']
    // ====================================================================
    const mockReq = {
      query: queryProxy,
      cookies: cookiesProxy,
      headers: headersProxy,
      path: reqPath,
      method: "GET",
    };

    // 3. COMPLETE CONTEXT
    const mockContext = {
      req: mockReq,
      res: mockRes,
    };

    jsx = await requestStorage.run(mockContext, async () => {
      return await asyncRenderJSXToClientJSX(jsx);
    });

    if (!isStatic) {
      // ❌ DO NOT save file.
      // It will behave as pure SSR at runtime.
      console.log(
        `Skipping static generation for ${segments.join(
          "/"
        )} due to dynamic usage.`
      );
      if (isDynamic) {
        isDynamic.value = true;
      }
      return;
    }

    const sideEffects = {
      redirect: mockRes._redirectUrl,
      cookies: mockRes._cookies,
    };

    setJSXJSON(reqPath, {
      jsx: serializeReactElement(jsx),
      revalidate: revalidate?.(),
      generatedAt: Date.now(),
      metadata: { effects: sideEffects },
    });

    console.warn(`Generated serialized jsx at page: ${reqPath}`);
  } catch (error) {
    console.error(`Error building page ${reqPath}:`, error);
    throw error;
  }
}

function filterProps(props_) {
  if (React.isValidElement(props_)) {
    return serializeReactElement(props_);
  }
  if (Array.isArray(props_)) {
    return props_.map((item) => filterProps(item));
  }
  if (props_ && typeof props_ === "object") {
    const props = {};
    for (const [key, value] of Object.entries(props_)) {
      if (!key.startsWith("_")) {
        props[key] = filterProps(value);
      }
    }
    return props;
  }
  return props_;
}

function serializeReactElement(element) {
  if (React.isValidElement(element)) {
    let type;
    let modulePath = null;
    let componentName = null;
    let isPackage = false;

    if (typeof element.type === "string") {
      type = element.type;
    } else if (element.type === Symbol.for("react.fragment")) {
      type = "Fragment";
    } else if (element.type === Symbol.for("react.suspense")) {
      type = "Suspense";
    } else {
      modulePath = element.__modulePath;
      if (modulePath) {
        type = "__clientComponent__";
      }
      try {
        componentName = element.type.displayName || element.type.name;
      } catch (e) {}

      if (!modulePath && global.__DINOU_MODULE_MAP) {
        const meta = global.__DINOU_MODULE_MAP.get(element.type);
        modulePath = meta?.id;
        isPackage = meta?.isPackage;
        if (!isPackage && modulePath) {
          type = "__clientComponent__";
        }
      }
    }

    return {
      type,
      name: componentName,
      isPackage,
      modulePath: isPackage
        ? modulePath
        : modulePath
        ? path.relative(process.cwd(), modulePath).split(path.sep).join("/")
        : null,
      props: {
        ...filterProps(element.props),
        children: Array.isArray(element.props.children)
          ? element.props.children.map((child) => serializeReactElement(child))
          : element.props.children
          ? serializeReactElement(element.props.children)
          : undefined,
      },
    };
  }
  return element;
}

module.exports = {
  buildStaticPages,
  buildStaticPage,
};
