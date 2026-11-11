import path from "node:path";
import { existsSync, readdirSync } from "./vfs.js";

function safeDecode(val) {
  try {
    return !!val ? decodeURIComponent(val) : val;
  } catch (e) {
    return val;
  }
}

function sortDirEntries(entries) {
  return [...entries].sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0
  );
}

function isGroupDir(name) {
  return name.startsWith("(") && name.endsWith(")");
}

function isOptionalCatchAllDir(name) {
  return name.startsWith("[[...") && name.endsWith("]]");
}

function isCatchAllDir(name) {
  return !isOptionalCatchAllDir(name) && name.startsWith("[...") && name.endsWith("]");
}

function isOptionalSingleDynamicDir(name) {
  return !isOptionalCatchAllDir(name) && name.startsWith("[[") && name.endsWith("]]");
}

function isSingleDynamicDir(name) {
  return (
    !isCatchAllDir(name) &&
    !isOptionalSingleDynamicDir(name) &&
    !isOptionalCatchAllDir(name) &&
    name.startsWith("[") &&
    name.endsWith("]")
  );
}

function findCandidateFile(dirPath, fileName, withExtension, possibleExtensions) {
  if (withExtension) {
    for (const ext of possibleExtensions) {
      const candidatePath = path.join(dirPath, `${fileName}${ext}`);
      if (existsSync(candidatePath)) {
        return candidatePath;
      }
    }
    return undefined;
  }
  const candidatePath = path.join(dirPath, fileName);
  return existsSync(candidatePath) ? candidatePath : undefined;
}

function collectGroupChains(dir, prefixGroups = []) {
  const entries = sortDirEntries(readdirSync(dir, { withFileTypes: true }));
  const dirEntries = entries.filter(
    (e) => e.isDirectory() && !e.name.startsWith("_") && !e.name.startsWith("@")
  );
  const chains = [{ targetDir: dir, groupDirs: prefixGroups, dirEntries }];
  for (const entry of dirEntries) {
    if (isGroupDir(entry.name)) {
      const groupPath = path.join(dir, entry.name);
      chains.push(...collectGroupChains(groupPath, [...prefixGroups, groupPath]));
    }
  }
  return chains;
}

function getSlots(currentPath, reqSegments, query, dParams = {}) {
  let slots = {};

  const entries = sortDirEntries(readdirSync(currentPath, { withFileTypes: true }));

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith("_")) continue;

    if (entry.name.startsWith("@")) {
      const [slotPath, slotParams] = getFilePathAndDynamicParams(
        reqSegments,
        query,
        path.join(currentPath, entry.name),
        "page",
        true,
        true,
        undefined,
        reqSegments.length,
        dParams
      );

      if (slotPath) {
        const slotName = entry.name.slice(1);
        slots[slotName] = {
          slotPath,
          slotParams,
        };
      }
    } else if (isGroupDir(entry.name)) {
      const groupPath = path.join(currentPath, entry.name);

      const nestedSlots = getSlots(groupPath, reqSegments, query, dParams);

      slots = { ...slots, ...nestedSlots };
    }
  }

  return slots;
}

function matchRouteTree(
  reqSegments,
  query,
  currentPath,
  fileName,
  withExtension,
  finalDestination,
  lastFound,
  index,
  dParams,
  accumulative,
  accumulate,
  isFound,
  possibleExtensions,
  lineage,
  maxDepthRef
) {
  if (index > maxDepthRef.value) {
    maxDepthRef.value = index;
  }
  lineage.push({ dir: currentPath, dParams, index });

  let foundInCurrentPath;
  if (index > reqSegments.length - 1 || !finalDestination) {
    const candidatePath = findCandidateFile(
      currentPath,
      fileName,
      withExtension,
      possibleExtensions
    );
    if (candidatePath) {
      if (index > reqSegments.length - 1) {
        isFound.value = true;
        if (!accumulative) return [candidatePath, dParams];
        const slots = getSlots(currentPath, reqSegments, query, dParams);
        accumulate.push([candidatePath, dParams, slots]);
        if (finalDestination) return accumulate;
      } else {
        if (accumulative) {
          const slots = getSlots(currentPath, reqSegments, query, dParams);
          accumulate.push([candidatePath, dParams, slots]);
        } else {
          foundInCurrentPath = candidatePath;
        }
      }
    }

    if (index > reqSegments.length - 1) {
      const entries = sortDirEntries(
        readdirSync(currentPath, { withFileTypes: true })
      ).filter(
        (e) =>
          e.isDirectory() && !e.name.startsWith("_") && !e.name.startsWith("@")
      );

      let fallbackParams;

      // 1. Zero-segment route groups: (group)
      for (const entry of entries) {
        if (!isGroupDir(entry.name)) continue;
        const groupPath = path.join(currentPath, entry.name);
        const branchAccumulate = [...accumulate];
        const branchLineage = [...lineage];
        const branchIsFound = { value: false };
        const branchMaxDepth = { value: maxDepthRef.value };
        const result = matchRouteTree(
          reqSegments,
          query,
          groupPath,
          fileName,
          withExtension,
          finalDestination,
          foundInCurrentPath ?? lastFound,
          index,
          dParams,
          accumulative,
          branchAccumulate,
          branchIsFound,
          possibleExtensions,
          branchLineage,
          branchMaxDepth
        );
        if (branchIsFound.value) {
          isFound.value = true;
          accumulate.splice(0, accumulate.length, ...branchAccumulate);
          lineage.splice(0, lineage.length, ...branchLineage);
          return accumulative ? accumulate : result;
        }
      }

      // 2. Optional single dynamic segment: [[param]]
      for (const entry of entries) {
        if (!isOptionalSingleDynamicDir(entry.name)) continue;
        const paramName = entry.name.slice(2, -2);
        const paramValue =
          index < reqSegments.length
            ? safeDecode(reqSegments[index])
            : undefined;
        const newParams = {
          ...dParams,
          [paramName]: paramValue,
        };
        if (!fallbackParams) fallbackParams = newParams;
        const dynamicPath = path.join(currentPath, entry.name);
        const directCandidate = findCandidateFile(
          dynamicPath,
          fileName,
          withExtension,
          possibleExtensions
        );
        if (directCandidate) {
          isFound.value = true;
          lineage.push({ dir: dynamicPath, dParams: newParams, index });
          if (accumulative) {
            const slots = getSlots(dynamicPath, reqSegments, query, newParams);
            accumulate.push([directCandidate, newParams, slots]);
            return accumulate;
          }
          return [directCandidate, newParams];
        }

        const branchAccumulate = [...accumulate];
        const branchLineage = [...lineage];
        const branchIsFound = { value: false };
        const branchMaxDepth = { value: maxDepthRef.value };
        const result = matchRouteTree(
          reqSegments,
          query,
          dynamicPath,
          fileName,
          withExtension,
          finalDestination,
          foundInCurrentPath ?? lastFound,
          index + 1,
          dParams,
          accumulative,
          branchAccumulate,
          branchIsFound,
          possibleExtensions,
          branchLineage,
          branchMaxDepth
        );
        if (branchIsFound.value) {
          isFound.value = true;
          accumulate.splice(0, accumulate.length, ...branchAccumulate);
          lineage.splice(0, lineage.length, ...branchLineage);
          return accumulative ? accumulate : result;
        }
      }

      // 3. Optional catch-all segment: [[...param]]
      for (const entry of entries) {
        if (!isOptionalCatchAllDir(entry.name)) continue;
        const paramName = entry.name.slice(5, -2);
        const paramValue =
          index < reqSegments.length
            ? reqSegments.slice(index).map(safeDecode)
            : [];
        const newParams = {
          ...dParams,
          [paramName]: paramValue,
        };
        if (!fallbackParams) fallbackParams = newParams;
        const dynamicPath = path.join(currentPath, entry.name);
        const branchAccumulate = [...accumulate];
        const branchLineage = [...lineage];
        const branchIsFound = { value: false };
        const branchMaxDepth = { value: maxDepthRef.value };
        const result = matchRouteTree(
          reqSegments,
          query,
          dynamicPath,
          fileName,
          withExtension,
          finalDestination,
          foundInCurrentPath ?? lastFound,
          index,
          newParams,
          accumulative,
          branchAccumulate,
          branchIsFound,
          possibleExtensions,
          branchLineage,
          branchMaxDepth
        );
        if (branchIsFound.value) {
          isFound.value = true;
          accumulate.splice(0, accumulate.length, ...branchAccumulate);
          lineage.splice(0, lineage.length, ...branchLineage);
          return accumulative ? accumulate : result;
        }
      }

      if (!accumulative) {
        return finalDestination
          ? []
          : [foundInCurrentPath ?? lastFound, fallbackParams ?? dParams];
      }
      return accumulate;
    }
  }

  const seg = reqSegments[index];
  const isRouterSyntaxInSegment =
    seg &&
    ((seg.startsWith("(") && seg.endsWith(")")) ||
      (seg.startsWith("[") && seg.endsWith("]")) ||
      seg.startsWith("@") ||
      seg.startsWith("_"));

  const baseLastFound = finalDestination
    ? lastFound
    : (foundInCurrentPath ?? lastFound);
  const chains = collectGroupChains(currentPath);
  let bestFallback = null;

  function runCandidateBranch(
    nextPath,
    nextIndex,
    nextParams,
    groupDirs,
    capDepthAt = null
  ) {
    const chainAccumulate = [...accumulate];
    let chainLastFound = baseLastFound;
    const chainLineage = [...lineage];

    for (const gDir of groupDirs) {
      chainLineage.push({ dir: gDir, dParams, index });
      if (!finalDestination) {
        const gCand = findCandidateFile(
          gDir,
          fileName,
          withExtension,
          possibleExtensions
        );
        if (gCand) {
          if (accumulative) {
            const slots = getSlots(gDir, reqSegments, query, dParams);
            chainAccumulate.push([gCand, dParams, slots]);
          } else {
            chainLastFound = gCand;
          }
        }
      }
    }

    const branchIsFound = { value: false };
    const branchMaxDepth = { value: maxDepthRef.value };
    const result = matchRouteTree(
      reqSegments,
      query,
      nextPath,
      fileName,
      withExtension,
      finalDestination,
      chainLastFound,
      nextIndex,
      nextParams,
      accumulative,
      chainAccumulate,
      branchIsFound,
      possibleExtensions,
      chainLineage,
      branchMaxDepth
    );

    if (branchIsFound.value) {
      isFound.value = true;
      accumulate.splice(0, accumulate.length, ...chainAccumulate);
      lineage.splice(0, lineage.length, ...chainLineage);
      maxDepthRef.value = branchMaxDepth.value;
      return { matched: true, value: accumulative ? accumulate : result };
    }

    if (!finalDestination) {
      const effectiveDepth =
        capDepthAt !== null
          ? Math.min(branchMaxDepth.value, capDepthAt)
          : branchMaxDepth.value;
      if (!bestFallback || effectiveDepth > bestFallback.depth) {
        bestFallback = {
          depth: effectiveDepth,
          result,
          branchAccumulate: chainAccumulate,
        };
      }
    }

    return { matched: false };
  }

  // Tier 1: Static directory match (directly or inside route groups)
  if (!isRouterSyntaxInSegment) {
    for (const { targetDir, groupDirs, dirEntries } of chains) {
      const hasStaticSubdir = dirEntries.some(
        (e) =>
          e.name === seg &&
          !isGroupDir(e.name) &&
          !isSingleDynamicDir(e.name) &&
          !isOptionalSingleDynamicDir(e.name) &&
          !isCatchAllDir(e.name) &&
          !isOptionalCatchAllDir(e.name)
      );
      if (!hasStaticSubdir) continue;
      const staticPath = path.join(targetDir, seg);
      const attempt = runCandidateBranch(
        staticPath,
        index + 1,
        dParams,
        groupDirs
      );
      if (attempt.matched) return attempt.value;
    }
  }

  // Tier 2: Required single dynamic segment [param]
  for (const { targetDir, groupDirs, dirEntries } of chains) {
    for (const entry of dirEntries) {
      if (!isSingleDynamicDir(entry.name)) continue;
      const paramName = entry.name.slice(1, -1);
      const paramValue = safeDecode(seg);
      const newParams = {
        ...dParams,
        [paramName]: paramValue,
      };
      const attempt = runCandidateBranch(
        path.join(targetDir, entry.name),
        index + 1,
        newParams,
        groupDirs
      );
      if (attempt.matched) return attempt.value;
    }
  }

  // Tier 3: Optional single dynamic segment [[param]]
  for (const { targetDir, groupDirs, dirEntries } of chains) {
    for (const entry of dirEntries) {
      if (!isOptionalSingleDynamicDir(entry.name)) continue;
      const paramName = entry.name.slice(2, -2);
      const paramValue = safeDecode(seg);
      const newParams = {
        ...dParams,
        [paramName]: paramValue,
      };
      const attempt = runCandidateBranch(
        path.join(targetDir, entry.name),
        index + 1,
        newParams,
        groupDirs
      );
      if (attempt.matched) return attempt.value;
    }
  }

  // Tier 4: Required catch-all segment [...param]
  for (const { targetDir, groupDirs, dirEntries } of chains) {
    for (const entry of dirEntries) {
      if (!isCatchAllDir(entry.name)) continue;
      const paramName = entry.name.slice(4, -1);
      const paramValue = reqSegments.slice(index).map(safeDecode);
      const newParams = {
        ...dParams,
        [paramName]: paramValue,
      };
      const attempt = runCandidateBranch(
        path.join(targetDir, entry.name),
        reqSegments.length,
        newParams,
        groupDirs,
        index + 1
      );
      if (attempt.matched) return attempt.value;
    }
  }

  // Tier 5: Optional catch-all segment [[...param]]
  for (const { targetDir, groupDirs, dirEntries } of chains) {
    for (const entry of dirEntries) {
      if (!isOptionalCatchAllDir(entry.name)) continue;
      const paramName = entry.name.slice(5, -2);
      const paramValue = reqSegments.slice(index).map(safeDecode);
      const newParams = {
        ...dParams,
        [paramName]: paramValue,
      };
      const attempt = runCandidateBranch(
        path.join(targetDir, entry.name),
        reqSegments.length,
        newParams,
        groupDirs,
        index + 1
      );
      if (attempt.matched) return attempt.value;
    }
  }

  if (!finalDestination && bestFallback) {
    maxDepthRef.value = bestFallback.depth;
    if (accumulative) {
      accumulate.splice(
        0,
        accumulate.length,
        ...bestFallback.branchAccumulate
      );
      return accumulate;
    }
    return bestFallback.result;
  }

  if (!accumulative) {
    return finalDestination ? [] : [baseLastFound, dParams];
  }
  return accumulate;
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
  possibleExtensions = [".tsx", ".ts", ".jsx", ".js", ".mjs"]
) {
  const normCurrentPath = String(currentPath).replace(/\\/g, "/");
  const isCompanionLookup =
    index === 0 &&
    !normCurrentPath.includes("/@") &&
    (fileName === "layout" ||
      fileName === "no_layout" ||
      fileName === "error" ||
      fileName === "not_found");

  if (isCompanionLookup) {
    const pageLineage = [];
    const pageIsFound = { value: false };
    matchRouteTree(
      reqSegments,
      query,
      currentPath,
      "page",
      true,
      true,
      undefined,
      0,
      dParams,
      false,
      [],
      pageIsFound,
      [".tsx", ".ts", ".jsx", ".js", ".mjs"],
      pageLineage,
      { value: 0 }
    );

    if (pageIsFound.value && pageLineage.length > 0) {
      if (accumulative) {
        for (const step of pageLineage) {
          const candidatePath = findCandidateFile(
            step.dir,
            fileName,
            withExtension,
            possibleExtensions
          );
          if (candidatePath) {
            isFound.value = true;
            const slots = getSlots(step.dir, reqSegments, query, step.dParams);
            accumulate.push([candidatePath, step.dParams, slots]);
          }
        }
        return accumulate;
      }

      if (finalDestination) {
        for (let i = pageLineage.length - 1; i >= 0; i--) {
          if (pageLineage[i].index < reqSegments.length) break;
          const candidatePath = findCandidateFile(
            pageLineage[i].dir,
            fileName,
            withExtension,
            possibleExtensions
          );
          if (candidatePath) {
            isFound.value = true;
            return [candidatePath, pageLineage[i].dParams];
          }
        }
        return [];
      }

      for (let i = pageLineage.length - 1; i >= 0; i--) {
        const candidatePath = findCandidateFile(
          pageLineage[i].dir,
          fileName,
          withExtension,
          possibleExtensions
        );
        if (candidatePath) {
          isFound.value = true;
          return [candidatePath, pageLineage[i].dParams];
        }
      }
      const leafParams = pageLineage[pageLineage.length - 1].dParams;
      return [lastFound, leafParams];
    }
  }

  return matchRouteTree(
    reqSegments,
    query,
    currentPath,
    fileName,
    withExtension,
    finalDestination,
    lastFound,
    index,
    dParams,
    accumulative,
    accumulate,
    isFound,
    possibleExtensions,
    [],
    { value: index }
  );
}

export {
  getFilePathAndDynamicParams,
};
export default {
  getFilePathAndDynamicParams,
};
