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
    // 1. Route Groups: (nombre)
    const isGroup = seg.startsWith("(") && seg.endsWith(")");

    // 2. Dynamic Params: [slug], [...slug], [[...slug]]
    // Todos empiezan por '[' y terminan por ']'
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
          // 1. RECUPERAR LA RUTA REAL
          // Usamos el "hack" (metadata) que inyectamos en getSlots.
          // Esto nos da la ruta al archivo: .../src/(grupo)/@sidebar/page.tsx
          const slotFilePath = slotElement.props?.__modulePath;

          if (slotFilePath) {
            // 2. OBTENER LA CARPETA DEL SLOT
            // Quitamos el nombre del archivo para quedarnos con el directorio:
            // .../src/(grupo)/@sidebar
            const realSlotFolder = path.dirname(slotFilePath);

            // 3. BUSCAR EL ERROR.TSX EN ESA CARPETA
            // Usamos tu helper, pero ahora le pasamos la carpeta CORRECTA como 'currentPath'.
            const [slotErrorPath, slotErrorParams] =
              getFilePathAndDynamicParams(
                reqSegments,
                query, // query (irrelevante para buscar el archivo)
                realSlotFolder, // <--- LA CLAVE: Buscamos dentro de la carpeta real del slot
                "error", // Buscamos 'error' (error.tsx, error.js, etc.)
                true, // withExtension
                true, // finalDestination
                undefined, // lastFound
                reqSegments.length // TRUCO: Forzamos index al final para que busque archivo directo
              );

            if (slotErrorPath) {
              const slotErrorModule = require(slotErrorPath);
              const SlotError = slotErrorModule.default ?? slotErrorModule;

              // 🛡️ FIX: Convertir la instancia de Error a un objeto plano
              // Las propiedades 'message' y 'stack' no son enumerables en un Error nativo,
              // por lo que se pierden al serializar hacia un Client Component en SSR.
              const serializedError = {
                message: e.message || "Unknown Error",
                name: e.name,
                stack: isDevelopment ? e.stack : undefined,
              };

              updatedSlotElement = React.createElement(SlotError, {
                params: slotErrorParams, // Params resueltos (si hubiera)
                // searchParams: query,
                key: slotName,
                error: serializedError, // Pasamos el error capturado
              });
            } else {
              // Opcional: Si no hay error.tsx, podrías loguear o devolver null
              console.warn(
                `[Dinou] Slot @${slotName} falló y no tiene error.tsx`
              );
              updatedSlotElement = null;
            }
          } else {
            // Si por alguna razón no tenemos __modulePath (ej: componente estático puro sin wrapper)
            console.error(
              `[Dinou] No se pudo localizar el path del slot @${slotName}`
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
