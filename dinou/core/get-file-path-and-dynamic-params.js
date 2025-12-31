const path = require("path");
const { existsSync, readdirSync } = require("fs");
const React = require("react");

function safeDecode(val) {
  try {
    return val ? decodeURIComponent(val) : vale;
  } catch (e) {
    return val; // Si falla la decodificación, devolvemos el original
  }
}

function getSlots(currentPath, reqSegments, query) {
  const slots = {};
  const slotFolders = readdirSync(currentPath, {
    withFileTypes: true,
  }).filter((entry) => entry.isDirectory() && entry.name.startsWith("@"));
  for (const slot of slotFolders) {
    const [slotPath, slotParams] = getFilePathAndDynamicParams(
      reqSegments,
      query,
      path.join(currentPath, slot.name),
      "page",
      true,
      true,
      undefined,
      reqSegments.length
    );
    if (slotPath) {
      const slotModule = require(slotPath);
      const Slot = slotModule.default ?? slotModule;
      const slotName = slot.name.slice(1);
      slots[slotName] = React.createElement(Slot, {
        params: slotParams,
        query,
        key: slotName,
      });
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
          }
        }
      }
      if (!accumulative) return finalDestination ? [] : [lastFound, dParams];
      return accumulate;
    }
  }
  const staticPath = path.join(currentPath, reqSegments[index]);
  if (existsSync(staticPath)) {
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
