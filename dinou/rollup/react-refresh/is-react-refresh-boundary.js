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
    if (
      key === "__esModule" ||
      key === "metadata" ||
      key === "revalidate" ||
      key === "dynamic" ||
      key === "dynamicParams" ||
      key === "fetchCache" ||
      key === "preferredRegion" ||
      key === "runtime" ||
      key === "maxDuration" ||
      key === "generateStaticParams" ||
      key === "generateMetadata" ||
      key === "frontmatter" ||
      key === "toc" ||
      key === "headings"
    ) {
      continue;
    }

    hasExports = true;
    let exportValue;
    try {
      exportValue = moduleExports[key];
    } catch (e) {
      return false;
    }
    if (!RefreshRuntime.isLikelyComponentType(exportValue)) {
      areAllExportsComponents = false;
    }
  }

  return hasExports && areAllExportsComponents;
}
