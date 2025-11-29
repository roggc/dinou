export function isReactRefreshBoundary(RefreshRuntime, moduleExports) {
  if (RefreshRuntime.isLikelyComponentType(moduleExports)) {
    return true;
  }
  if (moduleExports == null || typeof moduleExports !== "object") {
    return false;
  }

  let hasExports = false;
  let areAllExportsComponents = true;
  for (const key in moduleExports) {
    if (key === "__esModule") continue;

    hasExports = true;
    const desc = Object.getOwnPropertyDescriptor(moduleExports, key);
    if (desc && desc.get) return false;

    const exportValue = moduleExports[key];
    if (!RefreshRuntime.isLikelyComponentType(exportValue)) {
      areAllExportsComponents = false;
    }
  }

  return hasExports && areAllExportsComponents;
}
