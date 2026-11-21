import fs from "node:fs";
import path from "node:path";

export function sortEntriesByName(entries) {
  return [...entries].sort((a, b) => {
    const na = typeof a === "string" ? a : a.name;
    const nb = typeof b === "string" ? b : b.name;
    return na < nb ? -1 : na > nb ? 1 : 0;
  });
}

function stripGroups(rel) {
  return rel
    .split("/")
    .filter(Boolean)
    .filter((s) => !(s.startsWith("(") && s.endsWith(")")));
}

function getSegmentTier(seg) {
  if (seg.startsWith("[[...") && seg.endsWith("]]")) return 5;
  if (seg.startsWith("[...") && seg.endsWith("]")) return 4;
  if (seg.startsWith("[[") && seg.endsWith("]]")) return 3;
  if (seg.startsWith("[") && seg.endsWith("]")) return 2;
  return 1;
}

function compareRouteSegments(aSegs, bSegs) {
  const minLen = Math.min(aSegs.length, bSegs.length);
  for (let i = 0; i < minLen; i++) {
    const ta = getSegmentTier(aSegs[i]);
    const tb = getSegmentTier(bSegs[i]);
    if (ta !== tb) return ta - tb;
    if (ta === 1 && aSegs[i] !== bSegs[i]) {
      return aSegs[i] < bSegs[i] ? -1 : 1;
    }
  }
  if (aSegs.length !== bSegs.length) {
    return bSegs.length - aSegs.length;
  }
  const ja = aSegs.join("/");
  const jb = bSegs.join("/");
  return ja < jb ? -1 : ja > jb ? 1 : 0;
}

export function discoverLayoutsFromFileRelPaths(rawPaths) {
  const normalized = [];
  for (const raw of rawPaths) {
    if (!raw || typeof raw !== "string") continue;
    const clean = raw
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/^src\/+/, "");
    if (clean) normalized.push(clean);
  }
  normalized.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const discovered = [];
  const layoutDirs = new Set();
  const noLayoutDirs = new Set();
  const pageDirs = new Set();

  for (const relFile of normalized) {
    const parts = relFile.split("/").filter(Boolean);
    if (parts.length === 0) continue;
    const fileName = parts[parts.length - 1];
    const dirParts = parts.slice(0, -1);
    const dirRel = dirParts.join("/");

    const isSlotOrPrivate = dirParts.some(
      (seg) => seg.startsWith("@") || seg.startsWith("_")
    );

    if (/^layout\.(?:[jt]sx?|mjs)$/.test(fileName)) {
      if (!isSlotOrPrivate && !layoutDirs.has(dirRel)) {
        layoutDirs.add(dirRel);
        discovered.push(dirRel);
      }
    } else if (fileName === "no_layout") {
      if (!isSlotOrPrivate && !noLayoutDirs.has(dirRel)) {
        noLayoutDirs.add(dirRel);
        discovered.push("!" + dirRel);
      }
    } else if (/^page\.(?:[jt]sx?|mjs)$/.test(fileName)) {
      if (!isSlotOrPrivate) {
        pageDirs.add(dirRel);
      }
    }
  }

  const pageRules = [];
  for (const pageDir of pageDirs) {
    const cleanPageSegs = stripGroups(pageDir);
    let hasNoLayoutAtDestination = noLayoutDirs.has(pageDir);
    if (!hasNoLayoutAtDestination && pageDir) {
      let checkDir = pageDir;
      while (checkDir) {
        const lastSlash = checkDir.lastIndexOf("/");
        const lastSeg =
          lastSlash === -1 ? checkDir : checkDir.slice(lastSlash + 1);
        if (!(lastSeg.startsWith("(") && lastSeg.endsWith(")"))) break;
        checkDir = lastSlash === -1 ? "" : checkDir.slice(0, lastSlash);
        if (noLayoutDirs.has(checkDir)) {
          hasNoLayoutAtDestination = true;
          break;
        }
      }
    }

    let spec = "-1";
    if (!hasNoLayoutAtDestination) {
      let curr = pageDir;
      while (true) {
        if (layoutDirs.has(curr)) {
          const cleanLayoutSegs = stripGroups(curr);
          const hasCatchAll = cleanLayoutSegs.some(
            (s) =>
              (s.startsWith("[...") && s.endsWith("]")) ||
              (s.startsWith("[[...") && s.endsWith("]]"))
          );
          if (hasCatchAll) {
            const trailing = Math.max(
              0,
              cleanPageSegs.length - cleanLayoutSegs.length
            );
            spec = `*-${trailing}`;
          } else {
            spec = String(cleanLayoutSegs.length);
          }
          break;
        }
        if (curr === "") break;
        const slashIdx = curr.lastIndexOf("/");
        curr = slashIdx === -1 ? "" : curr.slice(0, slashIdx);
      }
    }

    pageRules.push({
      cleanPageSegs,
      rawPageDir: pageDir,
      pattern: cleanPageSegs.join("/"),
      spec,
    });
  }

  pageRules.sort((a, b) => {
    const cmp = compareRouteSegments(a.cleanPageSegs, b.cleanPageSegs);
    if (cmp !== 0) return cmp;
    return a.rawPageDir < b.rawPageDir
      ? -1
      : a.rawPageDir > b.rawPageDir
        ? 1
        : 0;
  });

  const seenPatterns = new Set();
  for (const rule of pageRules) {
    if (seenPatterns.has(rule.pattern)) continue;
    seenPatterns.add(rule.pattern);
    discovered.push(`=${rule.pattern}:${rule.spec}`);
  }

  return discovered;
}

export function discoverLayoutsFromFs(srcDir, fsImpl = fs) {
  const relFiles = [];
  function walk(dir, rel = "") {
    if (!fsImpl.existsSync(dir)) return;
    let entries;
    try {
      entries = sortEntriesByName(
        fsImpl.readdirSync(dir, { withFileTypes: true })
      );
    } catch {
      return;
    }
    for (const entry of entries) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (entry.name.startsWith("_") || entry.name.startsWith("@")) continue;
        walk(path.join(dir, entry.name), childRel);
      } else if (
        /^layout\.(?:[jt]sx?|mjs)$/.test(entry.name) ||
        /^page\.(?:[jt]sx?|mjs)$/.test(entry.name) ||
        entry.name === "no_layout"
      ) {
        relFiles.push(childRel);
      }
    }
  }
  walk(srcDir);
  return discoverLayoutsFromFileRelPaths(relFiles);
}

export default {
  sortEntriesByName,
  discoverLayoutsFromFileRelPaths,
  discoverLayoutsFromFs,
};

