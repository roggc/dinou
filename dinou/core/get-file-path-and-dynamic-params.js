const path = require("path");
const { existsSync, readdirSync } = require("fs");
const React = require("react");

function safeDecode(val) {
  try {
    return !!val ? decodeURIComponent(val) : val;
  } catch (e) {
    return val; // Si falla la decodificación, devolvemos el original
  }
}

function getSlots(currentPath, reqSegments, query) {
  let slots = {};

  // Leemos todo el directorio actual
  const entries = readdirSync(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    // Solo nos interesan directorios
    if (!entry.isDirectory()) continue;

    // ---------------------------------------------------------
    // CASO 1: Encontramos un Slot directo (@sidebar)
    // ---------------------------------------------------------
    if (entry.name.startsWith("@")) {
      // Usamos tu lógica actual para resolver la página dentro del slot
      const [slotPath, slotParams] = getFilePathAndDynamicParams(
        reqSegments,
        query,
        path.join(currentPath, entry.name), // Path físico: .../layout/@sidebar
        "page",
        true,
        true,
        undefined,
        reqSegments.length // Mantenemos tu lógica de ir directo al final
      );

      if (slotPath) {
        const slotModule = require(slotPath);
        const Slot = slotModule.default ?? slotModule;
        const slotName = entry.name.slice(1);

        // Guardamos el slot encontrado
        slots[slotName] = React.createElement(Slot, {
          params: slotParams,
          searchParams: query,
          key: slotName,
          // Añadimos esto para tus hacks de Server Components si los necesitas
          __modulePath: slotPath ?? null,
        });
      }
    }

    // ---------------------------------------------------------
    // CASO 2: Encontramos un Route Group ((marketing))
    // ---------------------------------------------------------
    // Aquí está la magia: Si es un grupo, entramos recursivamente
    else if (entry.name.startsWith("(") && entry.name.endsWith(")")) {
      const groupPath = path.join(currentPath, entry.name);

      // 🔄 RECURSIÓN: Buscamos slots dentro del grupo
      const nestedSlots = getSlots(groupPath, reqSegments, query);

      // Fusionamos los slots encontrados dentro del grupo con los actuales.
      // Nota: Si hay colisión (mismo slot fuera y dentro), gana el último procesado.
      // Normalmente object.assign sobreescribe, dando prioridad a lo "último" encontrado.
      slots = { ...slots, ...nestedSlots };
    }
  }

  return slots;
}

function getFilePathAndDynamicParams(
  reqSegments,
  query,
  currentPath,
  fileName = "page",
  withExtension = true,
  finalDestination = true,
  lastFound = undefined,
  index = 0,
  dParams = {},
  accumulative = false,
  accumulate = [],
  isFound = { value: false },
  possibleExtensions = [".tsx", ".ts", ".jsx", ".js"]
) {
  let foundInCurrentPath;
  if (index > reqSegments.length - 1 || !finalDestination) {
    if (withExtension) {
      for (const ext of possibleExtensions) {
        const candidatePath = path.join(currentPath, `${fileName}${ext}`);
        if (existsSync(candidatePath)) {
          if (index > reqSegments.length - 1) {
            isFound.value = true;
            if (!accumulative) return [candidatePath, dParams];
            const slots = getSlots(currentPath, reqSegments, query);
            accumulate.push([candidatePath, dParams, slots]);
            if (finalDestination) return accumulate;
          } else {
            if (accumulative) {
              const slots = getSlots(currentPath, reqSegments, query);
              accumulate.push([candidatePath, dParams, slots]);
            } else {
              foundInCurrentPath = candidatePath;
            }
          }
        }
      }
    } else {
      const candidatePath = path.join(currentPath, fileName);
      if (existsSync(candidatePath)) {
        if (index > reqSegments.length - 1) {
          isFound.value = true;
          if (!accumulative) return [candidatePath, dParams];
          const slots = getSlots(currentPath, reqSegments, query);
          accumulate.push([candidatePath, dParams, slots]);
          if (finalDestination) return accumulate;
        } else {
          if (accumulative) {
            const slots = getSlots(currentPath, reqSegments, query);
            accumulate.push([candidatePath, dParams, slots]);
          } else {
            foundInCurrentPath = candidatePath;
          }
        }
      }
    }
    if (index > reqSegments.length - 1) {
      const entries = readdirSync(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (entry.name.startsWith("[[...") && entry.name.endsWith("]]")) {
            const paramName = entry.name.slice(5, -2);
            const paramValue =
              index < reqSegments.length
                ? reqSegments.slice(index).map(safeDecode)
                : [];
            const newParams = {
              ...dParams,
              [paramName]: paramValue,
            };
            const dynamicPath = path.join(currentPath, entry.name);
            if (withExtension) {
              for (const ext of possibleExtensions) {
                const candidatePath = path.join(
                  dynamicPath,
                  `${fileName}${ext}`
                );
                if (existsSync(candidatePath)) {
                  isFound.value = true;
                  if (accumulative) {
                    const slots = getSlots(dynamicPath, reqSegments, query);
                    accumulate.push([candidatePath, newParams, slots]);
                    return accumulate;
                  }
                  return [candidatePath, newParams];
                }
              }
            } else {
              const candidatePath = path.join(dynamicPath, fileName);
              if (existsSync(candidatePath)) {
                isFound.value = true;
                if (accumulative) {
                  const slots = getSlots(dynamicPath, reqSegments, query);
                  accumulate.push([candidatePath, newParams, slots]);
                  return accumulate;
                }
                return [candidatePath, newParams];
              }
            }
            if (accumulative) return accumulate;
            return finalDestination
              ? []
              : [foundInCurrentPath ?? lastFound, newParams];
          } else if (entry.name.startsWith("[[") && entry.name.endsWith("]]")) {
            const paramName = entry.name.slice(2, -2);
            const paramValue =
              index < reqSegments.length
                ? safeDecode(reqSegments[index])
                : undefined;
            const newParams = {
              ...dParams,
              [paramName]: paramValue,
            };
            const dynamicPath = path.join(currentPath, entry.name);
            if (withExtension) {
              for (const ext of possibleExtensions) {
                const candidatePath = path.join(
                  dynamicPath,
                  `${fileName}${ext}`
                );
                if (existsSync(candidatePath)) {
                  isFound.value = true;
                  if (accumulative) {
                    const slots = getSlots(dynamicPath, reqSegments, query);
                    accumulate.push([candidatePath, newParams, slots]);
                    return accumulate;
                  }
                  return [candidatePath, newParams];
                }
              }
            } else {
              const candidatePath = path.join(dynamicPath, fileName);
              if (existsSync(candidatePath)) {
                isFound.value = true;
                if (accumulative) {
                  const slots = getSlots(dynamicPath, reqSegments, query);
                  accumulate.push([candidatePath, newParams, slots]);
                  return accumulate;
                }
                return [candidatePath, newParams];
              }
            }
            if (accumulative) return accumulate;
            return finalDestination
              ? []
              : [foundInCurrentPath ?? lastFound, newParams];
          } else if (entry.name.startsWith("(") && entry.name.endsWith(")")) {
            const groupPath = path.join(currentPath, entry.name);
            const newIsFound = { value: false };
            const result = getFilePathAndDynamicParams(
              reqSegments,
              query,
              groupPath,
              fileName,
              withExtension,
              finalDestination,
              lastFound,
              index,
              dParams,
              accumulative,
              accumulate,
              newIsFound
            );
            if (newIsFound.value) {
              isFound.value = true;
              return result;
            }
          }
        }
      }
      if (!accumulative) return finalDestination ? [] : [lastFound, dParams];
      return accumulate;
    }
  }
  const staticPath = path.join(currentPath, reqSegments[index]);
  const isRouterSyntaxInSegment =
    reqSegments[index] &&
    ((reqSegments[index].startsWith("(") && reqSegments[index].endsWith(")")) ||
      (reqSegments[index].startsWith("[") &&
        reqSegments[index].endsWith("]")) ||
      reqSegments[index].startsWith("@"));
  if (existsSync(staticPath) && !isRouterSyntaxInSegment) {
    return getFilePathAndDynamicParams(
      reqSegments,
      query,
      staticPath,
      fileName,
      withExtension,
      finalDestination,
      finalDestination ? lastFound : foundInCurrentPath ?? lastFound,
      index + 1,
      dParams,
      accumulative,
      accumulate,
      isFound
    );
  } else {
    const entries = readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name.startsWith("[[...") && entry.name.endsWith("]]")) {
          const paramName = entry.name.slice(5, -2);
          const paramValue =
            index < reqSegments.length
              ? reqSegments.slice(index).map(safeDecode)
              : [];
          const newParams = {
            ...dParams,
            [paramName]: paramValue,
          };
          const dynamicPath = path.join(currentPath, entry.name);
          if (withExtension) {
            for (const ext of possibleExtensions) {
              const candidatePath = path.join(dynamicPath, `${fileName}${ext}`);
              if (existsSync(candidatePath)) {
                isFound.value = true;
                if (accumulative) {
                  const slots = getSlots(dynamicPath, reqSegments, query);
                  accumulate.push([candidatePath, newParams, slots]);
                  return accumulate;
                }
                return [candidatePath, newParams];
              }
            }
          } else {
            const candidatePath = path.join(dynamicPath, fileName);
            if (existsSync(candidatePath)) {
              isFound.value = true;
              if (accumulative) {
                const slots = getSlots(dynamicPath, reqSegments, query);
                accumulate.push([candidatePath, newParams, slots]);
                return accumulate;
              }
              return [candidatePath, newParams];
            }
          }
          if (accumulative) return accumulate;
          return finalDestination
            ? []
            : [foundInCurrentPath ?? lastFound, newParams];
        } else if (entry.name.startsWith("[...") && entry.name.endsWith("]")) {
          const paramName = entry.name.slice(4, -1);
          const paramValue = reqSegments.slice(index).map(safeDecode);
          const newParams = {
            ...dParams,
            [paramName]: paramValue,
          };
          const dynamicPath = path.join(currentPath, entry.name);
          if (withExtension) {
            for (const ext of possibleExtensions) {
              const candidatePath = path.join(dynamicPath, `${fileName}${ext}`);
              if (existsSync(candidatePath)) {
                isFound.value = true;
                if (accumulative) {
                  const slots = getSlots(dynamicPath, reqSegments, query);
                  accumulate.push([candidatePath, newParams, slots]);
                  return accumulate;
                }
                return [candidatePath, newParams];
              }
            }
          } else {
            const candidatePath = path.join(dynamicPath, fileName);
            if (existsSync(candidatePath)) {
              isFound.value = true;
              if (accumulative) {
                const slots = getSlots(dynamicPath, reqSegments, query);
                accumulate.push([candidatePath, newParams, slots]);
                return accumulate;
              }
              return [candidatePath, newParams];
            }
          }
          if (accumulative) return accumulate;
          return finalDestination
            ? []
            : [foundInCurrentPath ?? lastFound, newParams];
        } else if (entry.name.startsWith("[[") && entry.name.endsWith("]]")) {
          const paramName = entry.name.slice(2, -2);
          const paramValue =
            index < reqSegments.length
              ? safeDecode(reqSegments[index])
              : undefined;
          const newParams = {
            ...dParams,
            [paramName]: paramValue,
          };
          const dynamicPath = path.join(currentPath, entry.name);
          return getFilePathAndDynamicParams(
            reqSegments,
            query,
            dynamicPath,
            fileName,
            withExtension,
            finalDestination,
            finalDestination ? lastFound : foundInCurrentPath ?? lastFound,
            index + 1,
            newParams,
            accumulative,
            accumulate,
            isFound
          );
        } else if (entry.name.startsWith("[") && entry.name.endsWith("]")) {
          const paramName = entry.name.slice(1, -1);
          const paramValue = safeDecode(reqSegments[index]);
          const newParams = {
            ...dParams,
            [paramName]: paramValue,
          };
          const dynamicPath = path.join(currentPath, entry.name);
          return getFilePathAndDynamicParams(
            reqSegments,
            query,
            dynamicPath,
            fileName,
            withExtension,
            finalDestination,
            finalDestination ? lastFound : foundInCurrentPath ?? lastFound,
            index + 1,
            newParams,
            accumulative,
            accumulate,
            isFound
          );
        } else if (entry.name.startsWith("(") && entry.name.endsWith(")")) {
          const groupPath = path.join(currentPath, entry.name);
          const newIsFound = { value: false };
          const result = getFilePathAndDynamicParams(
            reqSegments,
            query,
            groupPath,
            fileName,
            withExtension,
            finalDestination,
            lastFound,
            index,
            dParams,
            accumulative,
            accumulate,
            newIsFound
          );
          if (newIsFound.value) {
            isFound.value = true;
            return result;
          }
        }
      }
    }
    if (!accumulative)
      return finalDestination ? [] : [foundInCurrentPath ?? lastFound, dParams];
    return accumulate;
  }
}

module.exports = {
  getFilePathAndDynamicParams,
};
