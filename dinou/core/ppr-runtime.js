// dinou/core/ppr-runtime.js
// Dinou Partial Prerendering (PPR) Runtime Streaming Resume Engine.
// Sends the pre-rendered shell immediately (0ms TTFB) and progressively
// streams dynamic Suspense holes as they resolve over the same HTTP connection.
// Designed for the Dual-Bundle architecture (Pass A: RSC, Pass B: SSR).

import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import React from "react";
import { renderRSCStream } from "./rsc-renderer.js";
import { getClientManifest } from "./manifest-provider.js";
import { requestStorage, setCurrentContext, getContext } from "./request-context.js";
import getJSX from "./get-jsx.js";
import { getStorageAdapter, readDist2Fallback } from "./storage-adapter.js";
import { deserializeJSX } from "./cache-slot.js";
import { getActiveLayoutChain } from "./layout-functions.js";
import {
  asyncRenderJSXToClientJSX,
  invokeWithServerHooksDispatcher,
} from "./render-jsx-to-client-jsx.js";
import {
  SKIP_STATIC_SUSPENSE_SYMBOL,
  runInRuntimeStaticSuspense,
  runInRuntimeDynamicHole,
  isLayoutRootElement,
  getLayoutRootScope,
  isPageRootElement,
  runInLayoutSegment,
  runInPageSegment,
  getActiveLayoutSegmentStore,
} from "./ppr-context.js";
import { fetchCloudflareDist2Asset } from "./static-assets.js";

function safeJsonForInlineScript(str) {
  return JSON.stringify(str)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function formatRscPushScript(kind, chunkStr) {
  const arrName = `__DINOU_RSC_${kind}__`;
  const pushFn = `__DINOU_RSC_${kind}_PUSH__`;
  const encoded = safeJsonForInlineScript(chunkStr);
  return `<script>(self.${arrName}=self.${arrName}||[]).push(${encoded});if(self.${pushFn})self.${pushFn}(${encoded});</script>`;
}

function formatRscDoneScript(kind) {
  const doneName = `__DINOU_RSC_${kind}_DONE__`;
  const closeFn = `__DINOU_RSC_${kind}_CLOSE__`;
  return `<script>self.${doneName}=true;if(self.${closeFn})self.${closeFn}();</script>`;
}

async function readShellJsonFromStorage(storage, key, platformContext, reqUrl) {
  if (!key) return null;
  if (storage) {
    try {
      const item = await storage.get(key);
      if (item && typeof item.content === "string" && item.content.trim().startsWith("{")) {
        return item.content;
      }
    } catch (e) {}
  }
  const isDeleted =
    storage &&
    (typeof storage.isKeyDeleted === "function"
      ? await storage.isKeyDeleted(key)
      : typeof storage.isDeleted === "function" && storage.isDeleted(key));
  if (isDeleted) {
    return null;
  }
  if (platformContext?.env?.ASSETS && reqUrl) {
    try {
      const assetRes = await fetchCloudflareDist2Asset(
        platformContext.env.ASSETS,
        key,
        reqUrl
      );
      if (assetRes && assetRes.status === 200) {
        const txt = await assetRes.text();
        if (txt && txt.trim().startsWith("{")) {
          if (storage) {
            try {
              await storage.set(key, txt);
            } catch (e) {}
          }
          return txt;
        }
      }
    } catch (e) {}
  }
  if (storage) {
    const dist2Item = await readDist2Fallback(storage, key);
    if (
      dist2Item &&
      typeof dist2Item.content === "string" &&
      dist2Item.content.trim().startsWith("{")
    ) {
      return dist2Item.content;
    }
  } else {
    try {
      const diskPath = path.resolve(process.cwd(), ".dinou/dist2", key);
      if (existsSync(diskPath)) {
        const txt = readFileSync(diskPath, "utf8");
        if (txt && txt.trim().startsWith("{")) {
          return txt;
        }
      }
    } catch (e) {}
  }
  return null;
}

async function readRscTextFromStorage(storage, key, platformContext, reqUrl) {
  if (!key) return null;
  if (storage) {
    try {
      const item = await storage.get(key);
      if (
        item &&
        typeof item.content === "string" &&
        item.content.length > 0 &&
        !item.content.trimStart().startsWith("<")
      ) {
        return item.content;
      }
    } catch (e) {}
  }
  const isDeleted =
    storage &&
    (typeof storage.isKeyDeleted === "function"
      ? await storage.isKeyDeleted(key)
      : typeof storage.isDeleted === "function" && storage.isDeleted(key));
  if (isDeleted) {
    return null;
  }
  if (platformContext?.env?.ASSETS && reqUrl) {
    try {
      const assetRes = await fetchCloudflareDist2Asset(
        platformContext.env.ASSETS,
        key,
        reqUrl
      );
      if (assetRes && assetRes.status === 200) {
        const txt = await assetRes.text();
        if (txt && txt.length > 0 && !txt.trimStart().startsWith("<")) {
          if (storage) {
            try {
              await storage.set(key, txt);
            } catch (e) {}
          }
          return txt;
        }
      }
    } catch (e) {}
  }
  if (storage) {
    const dist2Item = await readDist2Fallback(storage, key);
    if (
      dist2Item &&
      typeof dist2Item.content === "string" &&
      dist2Item.content.length > 0 &&
      !dist2Item.content.trimStart().startsWith("<")
    ) {
      return dist2Item.content;
    }
  } else {
    try {
      const diskPath = path.resolve(process.cwd(), ".dinou/dist2", key);
      if (existsSync(diskPath)) {
        const txt = readFileSync(diskPath, "utf8");
        if (txt && txt.length > 0 && !txt.trimStart().startsWith("<")) {
          return txt;
        }
      }
    } catch (e) {}
  }
  return null;
}

function replaceHolesWithMap(node, liveHolesMap) {
  if (
    !node ||
    typeof node !== "object" ||
    node instanceof Promise ||
    node.$$typeof === Symbol.for("react.client.reference") ||
    typeof node.then === "function" ||
    !liveHolesMap ||
    liveHolesMap.size === 0
  ) {
    return node;
  }
  if (Array.isArray(node)) {
    let changed = false;
    let result = null;
    for (let i = 0; i < node.length; i++) {
      const item = node[i];
      const updated = replaceHolesWithMap(item, liveHolesMap);
      if (updated !== item) {
        if (!changed) {
          result = node.slice(0, i);
          changed = true;
        }
      }
      if (changed) {
        result.push(updated);
      }
    }
    return changed ? result : node;
  }
  if (node.$$typeof === Symbol.for("react.transitional.element")) {
    const holeId = node.props && node.props["data-ppr-hole"];
    if (typeof holeId === "string" && liveHolesMap.has(holeId)) {
      return liveHolesMap.get(holeId);
    }
    if (node.props && typeof node.props === "object") {
      let changed = false;
      let newProps = null;
      for (const [k, v] of Object.entries(node.props)) {
        if (v && typeof v === "object") {
          const updated = replaceHolesWithMap(v, liveHolesMap);
          if (updated !== v) {
            if (!changed) {
              newProps = { ...node.props };
              changed = true;
            }
            newProps[k] = updated;
          }
        }
      }
      if (changed) {
        if (node.key != null) newProps.key = node.key;
        const children = newProps.children;
        if (Array.isArray(children)) {
          delete newProps.children;
          return React.createElement(node.type, newProps, ...children);
        }
        return React.createElement(node.type, newProps);
      }
    }
    return node;
  }
  let changed = false;
  let clone = null;
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === "object") {
      const updated = replaceHolesWithMap(v, liveHolesMap);
      if (updated !== v) {
        if (!changed) {
          clone = { ...node };
          changed = true;
        }
        clone[k] = updated;
      }
    }
  }
  return changed ? clone : node;
}

function createPprHoleErrorElement(holeErr, isDevelopment = false) {
  const rawErrMsg = isDevelopment
    ? holeErr?.message || "Unknown dynamic error"
    : "Error loading dynamic content";
  return React.createElement(
    "div",
    {
      "data-dinou-ppr-error": "true",
      style: {
        color: "#e11d48",
        padding: "8px 12px",
        background: "#fff1f2",
        border: "1px solid #fecdd3",
        borderRadius: "6px",
        fontSize: "0.875rem",
        fontFamily: "system-ui,sans-serif",
      },
    },
    `[PPR Error: ${rawErrMsg}]`
  );
}

async function PprDynamicHoleBoundary({ holeId, children }) {
  try {
    return await runInRuntimeDynamicHole(
      () => asyncRenderJSXToClientJSX(children),
      holeId
    );
  } catch (holeErr) {
    if (holeErr && holeErr.$$type === "dinou-internal-redirect") {
      getContext()?.res?.redirect?.(holeErr.url || "/");
      return null;
    }
    console.error(`[Dinou PPR] Error resolving dynamic hole ${holeId}:`, holeErr);
    try {
      getContext()?.res?.setHeader?.("x-dinou-has-error", "true");
    } catch (_) {}
    const isDev =
      process.env.DINOU_DEV === "true" || process.env.NODE_ENV !== "production";
    return createPprHoleErrorElement(holeErr, isDev);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isClientComponentRef(type) {
  if (!type) return false;
  return (
    type.$$typeof === Symbol.for("react.client.reference") ||
    Boolean(type.$$id) ||
    Boolean(type.filepath)
  );
}

/**
 * Builds a minimal ancestor-path skeleton from the cached layout/page shell tree down to
 * a single PPR dynamic hole, preserving exact React 19 sibling array lengths, unnamed
 * `<ViewTransition>` wrappers, and ancestor user Client Components (which may call `useId()`).
 * Rendering this skeleton produces the bit-for-bit identical React 19 `useId()` TreeId
 * that client `hydrateRoot` computes for the full composed document, preventing both
 * duplicate `useId()` collisions across multiple PPR holes and React `#418` hydration errors.
 */
function buildPprHoleSkeleton(node, targetHoleId, replacementEl, pageTree = null) {
  if (!node || typeof node !== "object") {
    return { found: false, node: null };
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const res = buildPprHoleSkeleton(node[i], targetHoleId, replacementEl, pageTree);
      if (res.found) {
        const pruned = new Array(node.length).fill(null);
        pruned[i] = res.node;
        return { found: true, node: pruned };
      }
    }
    return { found: false, node: null };
  }
  if (node.$$typeof === Symbol.for("react.transitional.element")) {
    if (node.props && node.props["data-ppr-hole"] === targetHoleId) {
      return { found: true, node: replacementEl };
    }
    if (isClientComponentRef(node.type)) {
      const refId = String(node.type?.$$id || node.type?.name || "");
      if (refId.endsWith("#DinouPageSlot") || refId === "DinouPageSlot") {
        if (pageTree != null) {
          const res = buildPprHoleSkeleton(pageTree, targetHoleId, replacementEl, null);
          if (res.found) {
            return { found: true, node: React.createElement(React.Fragment, null, res.node) };
          }
        }
        return { found: false, node: null };
      }
      if (refId.endsWith("#DinouCacheSlotBoundary") || refId === "DinouCacheSlotBoundary") {
        const res = buildPprHoleSkeleton(node.props?.children, targetHoleId, replacementEl, pageTree);
        if (res.found) {
          return { found: true, node: React.createElement(React.Fragment, null, res.node) };
        }
        return { found: false, node: null };
      }
      if (node.props && typeof node.props === "object") {
        for (const [propKey, propVal] of Object.entries(node.props)) {
          if (propVal && typeof propVal === "object") {
            const res = buildPprHoleSkeleton(propVal, targetHoleId, replacementEl, pageTree);
            if (res.found) {
              const clonedProps = { ...node.props, [propKey]: res.node };
              if (node.key != null) clonedProps.key = node.key;
              return { found: true, node: React.createElement(node.type, clonedProps) };
            }
          }
        }
      }
      return { found: false, node: null };
    }
    if (
      typeof node.type === "string" ||
      node.type === Symbol.for("react.fragment") ||
      node.type === Symbol.for("react.suspense")
    ) {
      const res = buildPprHoleSkeleton(node.props?.children, targetHoleId, replacementEl, pageTree);
      if (res.found) {
        return { found: true, node: React.createElement(React.Fragment, null, res.node) };
      }
      return { found: false, node: null };
    }
    if (node.type === Symbol.for("react.view_transition")) {
      const res = buildPprHoleSkeleton(node.props?.children, targetHoleId, replacementEl, pageTree);
      if (res.found) {
        return {
          found: true,
          node: React.createElement(
            node.type,
            node.props?.name != null ? { name: node.props.name } : null,
            res.node
          ),
        };
      }
      return { found: false, node: null };
    }
  }
  return { found: false, node: null };
}

const HOIST_ATTR_PATTERN = '(?:"[^"]*"|\'[^\']*\'|[^>"\'])*';
const LEADING_HOIST_TOKEN_RE = new RegExp(
  `^(?:(\\s+)|(<title\\b${HOIST_ATTR_PATTERN}>[\\s\\S]*?<\\/title>)|(<meta\\b${HOIST_ATTR_PATTERN}\\/?>)|(<link\\b${HOIST_ATTR_PATTERN}\\/?>)|(<style\\b${HOIST_ATTR_PATTERN}\\bdata-precedence=${HOIST_ATTR_PATTERN}>[\\s\\S]*?<\\/style>))`,
  "i"
);

/**
 * Separates React 19 hoisted document metadata (<title>, <meta>, <link>, and
 * precedence-scoped <style>) emitted at the beginning of a streamed HTML fragment
 * from the remaining body markup. Preserves non-hoisted tags (e.g. <meta itemProp>)
 * and React Suspense boundary comments (<!--$-->) intact in `restHtml`.
 */
function extractLeadingHoistedHeadHtml(rawHtml) {
  if (typeof rawHtml !== "string" || !rawHtml) {
    return { headHtml: "", restHtml: rawHtml || "" };
  }
  let idx = 0;
  let lastHeadEnd = 0;
  const len = rawHtml.length;
  const headParts = [];
  while (idx < len) {
    const m = LEADING_HOIST_TOKEN_RE.exec(rawHtml.slice(idx));
    if (!m) break;
    idx += m[0].length;
    if (m[2] || m[3] || m[4] || m[5]) {
      headParts.push(m[0]);
      lastHeadEnd = idx;
    }
  }
  if (headParts.length === 0) {
    return { headHtml: "", restHtml: rawHtml };
  }
  return {
    headHtml: headParts.join(""),
    restHtml: rawHtml.slice(lastHeadEnd),
  };
}

function extractPprHoleHtml(rawHtml, holeId) {
  if (typeof rawHtml !== "string") return null;
  const openTag = `<dinou-ppr-extract data-h="${holeId}">`;
  const closeTag = "</dinou-ppr-extract>";
  const startIdx = rawHtml.indexOf(openTag);
  const endIdx = rawHtml.lastIndexOf(closeTag);
  if (startIdx !== -1 && endIdx > startIdx) {
    const prefix = rawHtml.slice(0, startIdx);
    const { headHtml } = extractLeadingHoistedHeadHtml(prefix);
    const bodyHtml = rawHtml.slice(startIdx + openTag.length, endIdx);
    return { bodyHtml, headHtml };
  }
  return null;
}

function buildPprHoleChunk(holeId, boundaryIndex, bodyHtml, headHtml) {
  const headTpl = headHtml
    ? `<template id="ppr-head-${holeId}">${headHtml}</template>\n`
    : "";
  const headScript = headHtml
    ? `var h=document.getElementById("ppr-head-${holeId}");if(h&&document.head){try{var ns=Array.from((h.content||h).childNodes);for(var i=0;i<ns.length;i++){var n=ns[i];if(!n||n.nodeType!==1)continue;var tn=n.tagName;if(tn==="TITLE"){var exT=document.head.querySelector("title");if(!exT){document.head.appendChild(n);}else if(exT.textContent!==n.textContent){exT.textContent=n.textContent;}continue;}var dup=false;var ex=document.head.querySelectorAll(tn.toLowerCase());for(var j=0;j<ex.length;j++){var e=ex[j];if(e.attributes.length!==n.attributes.length)continue;var same=true;for(var k=0;k<n.attributes.length;k++){var a=n.attributes[k];if(e.getAttribute(a.name)!==a.value){same=false;break;}}if(same){dup=true;break;}}if(!dup)document.head.appendChild(n);}}finally{h.remove();}}`
    : "";
  return `\n${headTpl}<template id="ppr-content-${holeId}"><!--$-->${bodyHtml}<!--/$--></template>\n<script>(function(){${headScript}var c=document.getElementById("ppr-content-${holeId}");if(!c)return;var b=document.getElementById("B:${boundaryIndex}");var t=document.querySelector('[data-ppr-hole="${holeId}"]')||(b?b.nextElementSibling:null);try{if(t){if(c.content){t.replaceWith(c.content);}else{t.replaceWith.apply(t,Array.from(c.childNodes));}}}finally{c.remove();}})();</script>\n`;
}

/**
 * Splices live dynamic <Suspense> subtrees from a live page evaluation into a
 * cached PPR static shell client-JSX tree (deserialized from shell.page.json),
 * keeping the static shell of the page 100% immutable across /____rsc_page____
 * refreshes and soft-navigations while evaluating dynamic holes fresh.
 */
async function spliceDynamicHolesIntoShell(
  cachedShellTree,
  livePageNodeOrFn,
  startHoleIndex = 0
) {
  const knownHoleIds = new Set();
  const staticParentHoleIds = new Set();
  function collectKnownHoles(node) {
    if (!node || typeof node !== "object" || node instanceof Promise || node.$$typeof === Symbol.for("react.client.reference") || typeof node.then === "function") return;
    if (Array.isArray(node)) {
      for (const item of node) collectKnownHoles(item);
      return;
    }
    if (node.$$typeof === Symbol.for("react.transitional.element")) {
      if (node.props && typeof node.props["data-ppr-hole"] === "string") {
        knownHoleIds.add(node.props["data-ppr-hole"]);
      }
      if (node.props && typeof node.props["data-ppr-static-parent"] === "string") {
        staticParentHoleIds.add(node.props["data-ppr-static-parent"]);
      }
      if (node.props && typeof node.props === "object") {
        for (const val of Object.values(node.props)) {
          if (val && typeof val === "object") collectKnownHoles(val);
        }
      }
    } else {
      for (const val of Object.values(node)) {
        if (val && typeof val === "object") collectKnownHoles(val);
      }
    }
  }

  collectKnownHoles(cachedShellTree);
  if (knownHoleIds.size === 0) {
    return cachedShellTree;
  }

  const livePageNode =
    typeof livePageNodeOrFn === "function"
      ? await livePageNodeOrFn()
      : livePageNodeOrFn;

  let holeIndex = Number(startHoleIndex) || 0;
  const liveHolesMap = new Map();

  async function traverseProps(props, inClientProps = false) {
    if (!props || typeof props !== "object") return;
    for (const [, value] of Object.entries(props)) {
      if (liveHolesMap.size >= knownHoleIds.size) return;
      if (value && (typeof value === "object" || typeof value === "function")) {
        await traverse(value, inClientProps);
      }
    }
  }

  async function traverse(current, inClientProps = false) {
    if (!current || liveHolesMap.size >= knownHoleIds.size) return;
    if (Array.isArray(current)) {
      for (const item of current) {
        if (liveHolesMap.size >= knownHoleIds.size) return;
        await traverse(item, inClientProps);
      }
      return;
    }
    if (
      isClientComponentRef(current?.type) ||
      current?.$$typeof === Symbol.for("react.client.reference")
    ) {
      await traverseProps(current?.props, true);
      return;
    }
    if (
      current instanceof Promise ||
      ((typeof current === "object" || typeof current === "function") &&
        typeof current?.then === "function")
    ) {
      if (inClientProps) {
        return;
      }
      try {
        const resolved = await current;
        await traverse(resolved, false);
      } catch (err) {
        if (err && err.$$typeof === SKIP_STATIC_SUSPENSE_SYMBOL) {
          return;
        }
        console.error("[Dinou PPR] Error awaiting JSX promise in hole splice:", err);
      }
      return;
    }
    if (typeof current !== "object") {
      return;
    }
    if (typeof current?.type === "function") {
      try {
        const evaluated = await invokeWithServerHooksDispatcher(() =>
          current.type(current.props || {})
        );
        await traverse(evaluated, false);
      } catch (err) {
        if (err && err.$$typeof === SKIP_STATIC_SUSPENSE_SYMBOL) {
          return;
        }
        console.error("[Dinou PPR] Error evaluating component in hole splice:", err);
      }
      return;
    }
    if (
      typeof current?.type === "object" &&
      current.type !== null &&
      current.type.$$typeof === Symbol.for("react.forward_ref")
    ) {
      if (isClientComponentRef(current.type)) {
        await traverseProps(current.props, true);
        return;
      }
      try {
        const rendered = await invokeWithServerHooksDispatcher(() =>
          current.type.render(current.props || {}, current.ref)
        );
        await traverse(rendered, false);
      } catch (err) {
        if (err && err.$$typeof === SKIP_STATIC_SUSPENSE_SYMBOL) {
          return;
        }
        console.error("[Dinou PPR] Error evaluating forward_ref in hole splice:", err);
      }
      return;
    }
    if (
      typeof current?.type === "object" &&
      current.type !== null &&
      current.type.$$typeof === Symbol.for("react.memo")
    ) {
      if (isClientComponentRef(current.type)) {
        await traverseProps(current.props, true);
        return;
      }
      try {
        const innerComp = current.type.type;
        let rendered = null;
        if (typeof innerComp === "function") {
          rendered = await invokeWithServerHooksDispatcher(() =>
            innerComp(current.props || {})
          );
        } else if (
          typeof innerComp === "object" &&
          innerComp !== null &&
          innerComp.$$typeof === Symbol.for("react.forward_ref") &&
          typeof innerComp.render === "function"
        ) {
          rendered = await invokeWithServerHooksDispatcher(() =>
            innerComp.render(current.props || {}, current.ref)
          );
        }
        await traverse(rendered, false);
      } catch (err) {
        if (err && err.$$typeof === SKIP_STATIC_SUSPENSE_SYMBOL) {
          return;
        }
        console.error("[Dinou PPR] Error evaluating memo in hole splice:", err);
      }
      return;
    }
    if (
      current?.type === Symbol.for("react.suspense") ||
      current?.type === React.Suspense
    ) {
      holeIndex++;
      const currentHoleId = `ppr-hole-${holeIndex}`;
      if (knownHoleIds.has(currentHoleId)) {
        const wrappedHole = React.createElement(
          React.Suspense,
          {
            ...(current.props || {}),
            ...(current.key != null ? { key: current.key } : {}),
            children: React.createElement(PprDynamicHoleBoundary, {
              holeId: currentHoleId,
              children: current.props?.children,
            }),
          }
        );
        liveHolesMap.set(currentHoleId, wrappedHole);
        return;
      }
      const runStaticScope = staticParentHoleIds.has(currentHoleId)
        ? runInRuntimeDynamicHole
        : runInRuntimeStaticSuspense;
      await runStaticScope(async () => {
        if (current.props?.children) {
          await traverse(current.props.children, false);
        }
        if (current.props?.fallback) {
          await traverse(current.props.fallback, false);
        }
      });
      return;
    }
    if (current?.$$typeof === Symbol.for("react.transitional.element")) {
      await traverseProps(current.props, false);
    } else {
      await traverseProps(current, inClientProps);
    }
  }

  await traverse(livePageNode);

  return replaceHolesWithMap(cachedShellTree, liveHolesMap);
}

/**
 * Traverses a React JSX element tree to find Suspense boundaries,
 * evaluates their dynamic children, and streams replacement chunks.
 *
 * @param {object} node - Root JSX node (layout + page)
 * @param {Array<string|object>|null} expectedHoles - Holes registered at build time
 * @param {WritableStreamDefaultWriter} writer - Response stream writer
 * @param {TextEncoder} encoder - Text encoder
 * @param {object} platformContext - Dinou platform context (containing renderHtmlStream)
 * @param {boolean} isDevelopment - Dev mode flag
 */
async function streamDynamicHoles(
  node,
  expectedHoles,
  writer,
  encoder,
  platformContext,
  isDevelopment = false,
  staticParentHoles = null,
  resolvedHolesOut = null,
  streamCtrl = null,
  shellContext = null
) {
  let holeIndex = 0;
  const holePromises = [];

  const isAborted =
    streamCtrl && typeof streamCtrl.isAborted === "function"
      ? streamCtrl.isAborted
      : () => false;
  const safeWrite =
    streamCtrl && typeof streamCtrl.safeWrite === "function"
      ? streamCtrl.safeWrite
      : async (chunkStr) => {
          try {
            await writer.write(encoder.encode(chunkStr));
            return true;
          } catch (_) {
            return false;
          }
        };

  const hasExplicitHoles = Array.isArray(expectedHoles);
  const knownHoleIds = new Set(
    (expectedHoles || []).map((h) => (typeof h === "object" ? h.id : h))
  );
  if (hasExplicitHoles && knownHoleIds.size === 0) {
    return;
  }

  const clientManifest = getClientManifest();

  async function traverseProps(props, inClientProps = false) {
    if (!props || typeof props !== "object") return;
    for (const [, value] of Object.entries(props)) {
      if (hasExplicitHoles && holePromises.length >= knownHoleIds.size) return;
      if (value && (typeof value === "object" || typeof value === "function")) {
        await traverse(value, inClientProps);
      }
    }
  }

  async function traverse(current, inClientProps = false) {
    if (!current || (hasExplicitHoles && holePromises.length >= knownHoleIds.size)) return;

    // Handle Arrays (children)
    if (Array.isArray(current)) {
      for (const item of current) {
        if (hasExplicitHoles && holePromises.length >= knownHoleIds.size) return;
        await traverse(item, inClientProps);
      }
      return;
    }

    // Handle Client Component: do NOT execute, only traverse props in deterministic order
    if (
      isClientComponentRef(current?.type) ||
      current?.$$typeof === Symbol.for("react.client.reference")
    ) {
      await traverseProps(current?.props, true);
      return;
    }

    if (
      current instanceof Promise ||
      ((typeof current === "object" || typeof current === "function") &&
        typeof current?.then === "function")
    ) {
      if (inClientProps) {
        return;
      }
      try {
        const resolved = await current;
        await traverse(resolved, false);
      } catch (err) {
        if (err && err.$$typeof === SKIP_STATIC_SUSPENSE_SYMBOL) {
          return;
        }
        console.error("[Dinou PPR] Error awaiting JSX promise in hole traversal:", err);
      }
      return;
    }

    if (typeof current !== "object") {
      return;
    }

    // Handle React Server Component function
    if (typeof current?.type === "function") {
      const runEval = async () => {
        try {
          const evaluated = await invokeWithServerHooksDispatcher(() =>
            current.type(current.props || {})
          );
          await traverse(evaluated, false);
        } catch (err) {
          if (err && err.$$typeof === SKIP_STATIC_SUSPENSE_SYMBOL) {
            return;
          }
          console.error("[Dinou PPR] Error evaluating component in hole traversal:", err);
        }
      };
      if (isPageRootElement(current)) {
        await runInPageSegment(runEval);
        return;
      }
      if (isLayoutRootElement(current)) {
        const layoutScope = getLayoutRootScope(current);
        const prevStore = getActiveLayoutSegmentStore();
        const layoutStore =
          layoutScope && (!prevStore || prevStore.scopePrefix !== layoutScope)
            ? { active: true, idCount: 0, holeCount: 0, scopePrefix: layoutScope }
            : null;
        await runInLayoutSegment(runEval, layoutStore);
        return;
      }
      await runEval();
      return;
    }

    // Handle React.forward_ref
    if (
      typeof current?.type === "object" &&
      current.type !== null &&
      current.type.$$typeof === Symbol.for("react.forward_ref")
    ) {
      if (isClientComponentRef(current.type)) {
        await traverseProps(current.props, true);
        return;
      }
      try {
        const rendered = await invokeWithServerHooksDispatcher(() =>
          current.type.render(current.props || {}, current.ref)
        );
        await traverse(rendered, false);
      } catch (err) {
        if (err && err.$$typeof === SKIP_STATIC_SUSPENSE_SYMBOL) {
          return;
        }
        console.error("[Dinou PPR] Error evaluating forward_ref in hole traversal:", err);
      }
      return;
    }

    // Handle React.memo
    if (
      typeof current?.type === "object" &&
      current.type !== null &&
      current.type.$$typeof === Symbol.for("react.memo")
    ) {
      if (isClientComponentRef(current.type)) {
        await traverseProps(current.props, true);
        return;
      }
      try {
        const innerComp = current.type.type;
        let rendered = null;
        if (typeof innerComp === "function") {
          rendered = await invokeWithServerHooksDispatcher(() =>
            innerComp(current.props || {})
          );
        } else if (
          typeof innerComp === "object" &&
          innerComp !== null &&
          innerComp.$$typeof === Symbol.for("react.forward_ref") &&
          typeof innerComp.render === "function"
        ) {
          rendered = await invokeWithServerHooksDispatcher(() =>
            innerComp.render(current.props || {}, current.ref)
          );
        }
        await traverse(rendered, false);
      } catch (err) {
        if (err && err.$$typeof === SKIP_STATIC_SUSPENSE_SYMBOL) {
          return;
        }
        console.error("[Dinou PPR] Error evaluating memo in hole traversal:", err);
      }
      return;
    }

    // Handle React.Suspense
    if (
      current?.type === Symbol.for("react.suspense") ||
      current?.type === React.Suspense
    ) {
      holeIndex++;
      const currentBoundaryIndex = holeIndex - 1;
      const currentHoleId = `ppr-hole-${holeIndex}`;

      // Check if this boundary was registered as a dynamic hole at build time
      const shouldStream = hasExplicitHoles
        ? knownHoleIds.has(currentHoleId)
        : true;

      if (shouldStream) {
        const children = current.props?.children;
        const suspenseProps = current.props || {};
        const suspenseKey = current.key;
        const promise = runInRuntimeDynamicHole(() => (async () => {
          if (isAborted()) return;
          let chunkToWrite = null;
          try {
            let html = "";
            let headHtml = "";
            const resolvedChildren = await asyncRenderJSXToClientJSX(children);
            if (isAborted()) return;
            if (resolvedHolesOut && typeof resolvedHolesOut.set === "function") {
              resolvedHolesOut.set(
                currentHoleId,
                React.createElement(
                  React.Suspense,
                  {
                    ...suspenseProps,
                    ...(suspenseKey != null ? { key: suspenseKey } : {}),
                    children: resolvedChildren,
                  }
                )
              );
            }
            if (platformContext && platformContext.renderHtmlStream) {
              let renderedViaSkeleton = false;
              if (shellContext && (shellContext.layoutTree || shellContext.pageTree)) {
                try {
                  const extractEl = React.createElement(
                    "dinou-ppr-extract",
                    { "data-h": currentHoleId },
                    resolvedChildren
                  );
                  const skelRes = shellContext.layoutTree
                    ? buildPprHoleSkeleton(
                        shellContext.layoutTree,
                        currentHoleId,
                        extractEl,
                        shellContext.pageTree
                      )
                    : buildPprHoleSkeleton(
                        shellContext.pageTree,
                        currentHoleId,
                        extractEl,
                        null
                      );
                  if (skelRes.found) {
                    const skelRscStream = renderRSCStream(skelRes.node, clientManifest, {
                      runtime: "edge",
                    });
                    const skelHtmlStream = await platformContext.renderHtmlStream(skelRscStream, {
                      bootstrapModules: [],
                      importMapHtml: "",
                    });
                    if (isAborted()) return;
                    const rawSkelHtml = await new Response(skelHtmlStream).text();
                    const extracted = extractPprHoleHtml(rawSkelHtml, currentHoleId);
                    if (extracted !== null) {
                      html = extracted.bodyHtml;
                      headHtml = extracted.headHtml;
                      renderedViaSkeleton = true;
                    }
                  }
                } catch (_) {}
              }
              if (!renderedViaSkeleton) {
                const rscStream = renderRSCStream(resolvedChildren, clientManifest, { runtime: "edge" });
                const htmlStream = await platformContext.renderHtmlStream(rscStream, {
                  bootstrapModules: [], importMapHtml: "",
                });
                if (isAborted()) return;
                const rawHoleHtml = await new Response(htmlStream).text();
                const split = extractLeadingHoistedHeadHtml(rawHoleHtml);
                html = split.restHtml;
                headHtml = split.headHtml;
              }
            }
            if (isAborted()) return;
            chunkToWrite = buildPprHoleChunk(
              currentHoleId,
              currentBoundaryIndex,
              html,
              headHtml
            );
          } catch (holeErr) {
            if (isAborted()) return;
            if (holeErr && holeErr.$$type === "dinou-internal-redirect") {
              getContext()?.res?.redirect?.(holeErr.url || "/");
              return;
            }
            console.error(`[Dinou PPR] Error resolving dynamic hole ${currentHoleId}:`, holeErr);
            const errElement = createPprHoleErrorElement(holeErr, isDevelopment);
            if (resolvedHolesOut && typeof resolvedHolesOut.set === "function") {
              resolvedHolesOut.set(
                currentHoleId,
                React.createElement(React.Suspense, {
                  ...suspenseProps,
                  ...(suspenseKey != null ? { key: suspenseKey } : {}),
                  children: errElement,
                })
              );
            }
            let errHtml = "";
            if (platformContext && platformContext.renderHtmlStream && !isAborted()) {
              try {
                const errRscStream = renderRSCStream(errElement, clientManifest, {
                  runtime: "edge",
                });
                const errHtmlStream = await platformContext.renderHtmlStream(errRscStream, {
                  bootstrapModules: [],
                  importMapHtml: "",
                });
                errHtml = await new Response(errHtmlStream).text();
              } catch (_) {}
            }
            if (!errHtml) {
              const rawErrMsg = isDevelopment
                ? holeErr?.message || "Unknown dynamic error"
                : "Error loading dynamic content";
              const errMsg = escapeHtml(rawErrMsg);
              errHtml = `<div style="color:#e11d48;padding:8px 12px;background:#fff1f2;border:1px solid #fecdd3;border-radius:6px;font-size:0.875rem;font-family:system-ui,sans-serif">[PPR Error: ${errMsg}]</div>`;
            }
            chunkToWrite = `\n<template id="ppr-content-${currentHoleId}"><!--$-->${errHtml}<!--/$--></template>\n<script>(function(){var c=document.getElementById("ppr-content-${currentHoleId}");if(!c)return;var b=document.getElementById("B:${currentBoundaryIndex}");var t=document.querySelector('[data-ppr-hole="${currentHoleId}"]')||(b?b.nextElementSibling:null);try{if(t){if(c.content){t.replaceWith(c.content);}else{t.replaceWith.apply(t,Array.from(c.childNodes));}}}finally{c.remove();}})();</script>\n`;
          }
          if (chunkToWrite && !isAborted()) {
            await safeWrite(chunkToWrite);
          }
        })(), currentHoleId);
        holePromises.push(promise);
        return;
      }

      // Static <Suspense> boundary: do not re-stream it, but traverse its children & fallback
      // in the same order as asyncRenderJSXToClientJSX so nested dynamic <Suspense> holes are
      // discovered and holeIndex remains synchronized.
      const runStaticScope =
        staticParentHoles && staticParentHoles.has(currentHoleId)
          ? runInRuntimeDynamicHole
          : runInRuntimeStaticSuspense;
      await runStaticScope(async () => {
        if (current.props?.children) {
          await traverse(current.props.children, false);
        }
        if (current.props?.fallback) {
          await traverse(current.props.fallback, false);
        }
      });
      return;
    }

    // Traverse host element / Fragment props or plain props object
    if (current?.$$typeof === Symbol.for("react.transitional.element")) {
      await traverseProps(current.props, false);
    } else {
      await traverseProps(current, inClientProps);
    }
  }

  await traverse(node);
  await Promise.allSettled(holePromises);
}

/**
 * Handles PPR Runtime Streaming Resume.
 * Immediately flushes shellPrelude to the client, then resolves dynamic holes in parallel.
 */
async function handlePprResume({
  reqPath,
  queryObj,
  simReq,
  bridge,
  platformContext,
  rootContext,
  cachedItem,
  metadata,
  isDevelopment,
  getDiscoveredLayouts,
  getDiscoveredLayoutsJson,
  createRequestContext,
  copyCustomContextProperties,
  preloadedPageShellJson,
  preloadedLayoutShellJson,
  preloadedPageRsc,
  preloadedLayoutRsc,
  activeLayoutChain,
}) {
  const buildPprResponseHeaders = () => {
    const headers = new Headers(bridge?.headers);
    if (Array.isArray(bridge?.cookies)) {
      for (const c of bridge.cookies) {
        headers.append("Set-Cookie", c);
      }
    }
    headers.set("Content-Type", "text/html; charset=utf-8");
    const existingCacheControl = headers.get("Cache-Control");
    if (!existingCacheControl) {
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate, no-transform");
    } else if (!/\bno-transform\b/i.test(existingCacheControl)) {
      headers.set("Cache-Control", `${existingCacheControl}, no-transform`);
    }
    if (!headers.has("Content-Encoding")) {
      headers.set("Content-Encoding", "identity");
    }
    if (!headers.has("X-Accel-Buffering")) {
      headers.set("X-Accel-Buffering", "no");
    }
    return headers;
  };

  // RFC 9110 §9.3.2: HEAD on warm Pure PPR returns matching status & headers
  // with an empty body and MUST NOT spawn TransformStream or execute dynamic holes.
  if (String(simReq?.method || "").toUpperCase() === "HEAD") {
    const headers = buildPprResponseHeaders();
    return new Response(null, {
      status: bridge?._explicitStatusSet
        ? bridge.statusCode
        : metadata?.status || 200,
      headers,
    });
  }

  let shellHtml = cachedItem.content;
  if (typeof shellHtml === "string") {
    if (!shellHtml.includes("window.__DINOU_LAYOUTS__")) {
      const layoutsJson =
        typeof getDiscoveredLayoutsJson === "function"
          ? getDiscoveredLayoutsJson()
          : JSON.stringify(typeof getDiscoveredLayouts === "function" ? getDiscoveredLayouts() : {});
      shellHtml = shellHtml.replace(
        "</head>",
        `<script>window.__DINOU_LAYOUTS__=${layoutsJson};</script></head>`
      );
    }
    shellHtml = shellHtml.replace(
      /window\.__DINOU_USE_STATIC__\s*=\s*true;?/g,
      "window.__DINOU_USE_STATIC__ = false; window.__DINOU_PPR__ = true;"
    );
    if (!shellHtml.includes("window.__DINOU_PPR__")) {
      shellHtml = shellHtml.replace(
        "</head>",
        `<script>window.__DINOU_USE_STATIC__ = false; window.__DINOU_PPR__ = true;</script></head>`
      );
    }
    if (!shellHtml.includes("window.__DINOU_PPR_RESUME__")) {
      if (/window\.__DINOU_PPR__\s*=\s*true;?/.test(shellHtml)) {
        shellHtml = shellHtml.replace(
          /window\.__DINOU_PPR__\s*=\s*true;?/,
          "window.__DINOU_PPR__ = true; window.__DINOU_PPR_RESUME__ = true;"
        );
      } else if (shellHtml.includes("</head>")) {
        shellHtml = shellHtml.replace(
          "</head>",
          `<script>window.__DINOU_PPR_RESUME__ = true;</script></head>`
        );
      } else {
        shellHtml = `<script>window.__DINOU_PPR_RESUME__ = true;</script>${shellHtml}`;
      }
    }
  }

  // Separate shell into prelude (up to </body>) and postlude
  const lowerHtml = shellHtml.toLowerCase();
  const mainScriptMatch = typeof shellHtml === "string" ? shellHtml.match(/<script\b[^>]*\bsrc="\/(?:runtime|main)[^"]*"[^>]*><\/script>/i) : null;
  const rawBodyCloseIndex = lowerHtml.lastIndexOf("</body>");
  const bodyCloseIndex = mainScriptMatch && typeof mainScriptMatch.index === "number" && (rawBodyCloseIndex === -1 || mainScriptMatch.index < rawBodyCloseIndex) ? mainScriptMatch.index : rawBodyCloseIndex;
  let shellPrelude =
    bodyCloseIndex !== -1 ? shellHtml.slice(0, bodyCloseIndex) : shellHtml;
  let shellPostlude =
    bodyCloseIndex !== -1 ? shellHtml.slice(bodyCloseIndex) : "</body></html>";

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const abortState = { aborted: false };
  writer.closed.catch(() => {
    abortState.aborted = true;
  });
  const isAborted = () => abortState.aborted;
  const safeWrite = async (str) => {
    if (abortState.aborted) return false;
    try {
      await writer.write(encoder.encode(str));
      return true;
    } catch (_) {
      abortState.aborted = true;
      return false;
    }
  };
  const streamCtrl = { isAborted, safeWrite };

  // Stream dynamic holes in parallel with the prelude
  let didEmitRedirect = false;
  const resumePromise = (async () => {
    try {
      // 1. Immediately flush static shell prelude (0ms TTFB)
      if (bridge) {
        bridge.headersSent = true;
      }
      if (!(await safeWrite(shellPrelude))) return;

      const storage = getStorageAdapter();
      const cleanRel = (reqPath || "").replace(/^\/+/, "").replace(/\/+$/, "");
      const reqSegments = cleanRel ? cleanRel.split("/").filter(Boolean) : [];
      const srcFolder = path.resolve(process.cwd(), "src");
      let activeChain = Array.isArray(activeLayoutChain) ? activeLayoutChain : [];
      if (!Array.isArray(activeLayoutChain)) {
        try {
          activeChain = getActiveLayoutChain(reqSegments, queryObj || {}, srcFolder);
        } catch (e) {}
      }
      const hasActiveLayout = activeChain.length > 0;
      const leafLayoutKey = hasActiveLayout ? activeChain[0].cleanLayoutKey : null;
      const shellPageKey = cleanRel ? `${cleanRel}/shell.page.json` : "shell.page.json";
      const pageRscKey = cleanRel ? `${cleanRel}/page.rsc` : "page.rsc";
      const shellLayoutKey = hasActiveLayout
        ? leafLayoutKey
          ? `${leafLayoutKey}/shell.layout.json`
          : "shell.layout.json"
        : null;
      const layoutRscKey = hasActiveLayout
        ? leafLayoutKey
          ? `${leafLayoutKey}/layout.rsc`
          : "layout.rsc"
        : null;
      const reqOriginUrl = simReq?.url
        ? `http://${simReq.headers?.host || "localhost:3000"}${simReq.url}`
        : null;

      let holes = Array.isArray(metadata?.holes) ? metadata.holes : null;
      if ((!holes || holes.length === 0) && typeof shellPrelude === "string") {
        const extracted = [
          ...shellPrelude.matchAll(/data-ppr-hole="(ppr-hole-\d+)"/g),
        ].map((m) => m[1]);
        if (extracted.length > 0 || Array.isArray(metadata?.holes)) {
          holes = extracted;
        }
      }
      const hasDynamicHoles = !Array.isArray(holes) || holes.length > 0;

      // Fast path for 0-hole PPR routes: if pre-rendered page.rsc & layout.rsc are available,
      // skip reading/deserializing shell.*.json and skip renderRSCStream() completely.
      let resolvedPreloadedPageRsc = preloadedPageRsc;
      let resolvedPreloadedLayoutRsc = preloadedLayoutRsc;
      if (!hasDynamicHoles) {
        const [fetchedPageRsc, fetchedLayoutRsc] = await Promise.all([
          resolvedPreloadedPageRsc !== undefined
            ? Promise.resolve(resolvedPreloadedPageRsc)
            : readRscTextFromStorage(storage, pageRscKey, platformContext, reqOriginUrl),
          hasActiveLayout
            ? resolvedPreloadedLayoutRsc !== undefined
              ? Promise.resolve(resolvedPreloadedLayoutRsc)
              : readRscTextFromStorage(storage, layoutRscKey, platformContext, reqOriginUrl)
            : Promise.resolve(""),
        ]);
        resolvedPreloadedPageRsc = fetchedPageRsc;
        resolvedPreloadedLayoutRsc = fetchedLayoutRsc;
      }
      const hasZeroHolePreloadedRsc =
        !hasDynamicHoles &&
        Boolean(resolvedPreloadedPageRsc) &&
        (!hasActiveLayout || Boolean(resolvedPreloadedLayoutRsc));

      let pageShellJson = null;
      let layoutShellJson = null;
      if (!hasZeroHolePreloadedRsc) {
        [pageShellJson, layoutShellJson] = await Promise.all([
          preloadedPageShellJson !== undefined
            ? Promise.resolve(preloadedPageShellJson)
            : readShellJsonFromStorage(storage, shellPageKey, platformContext, reqOriginUrl),
          hasActiveLayout
            ? preloadedLayoutShellJson !== undefined
              ? Promise.resolve(preloadedLayoutShellJson)
              : readShellJsonFromStorage(storage, shellLayoutKey, platformContext, reqOriginUrl)
            : Promise.resolve(null),
        ]);
      }

      const dynamicState = { value: true };
      const context = createRequestContext(simReq, bridge, platformContext, dynamicState);
      context._isPprRuntimeResume = true;
      if (typeof copyCustomContextProperties === "function") {
        copyCustomContextProperties(rootContext, context);
      }
      if (typeof setCurrentContext === "function") {
        setCurrentContext(context);
      }

      const resolvedHolesMap = new Map();
      let cachedPageTreeForResume = null;
      let cachedLayoutTreeForResume = null;
      if (!hasZeroHolePreloadedRsc) {
        if (pageShellJson) {
          try {
            cachedPageTreeForResume = deserializeJSX(pageShellJson);
          } catch (_) {}
        }
        if (hasActiveLayout && layoutShellJson) {
          try {
            cachedLayoutTreeForResume = deserializeJSX(layoutShellJson);
          } catch (_) {}
        }
      }
      const shellContextForHoles =
        cachedPageTreeForResume || cachedLayoutTreeForResume
          ? {
              layoutTree: cachedLayoutTreeForResume,
              pageTree: cachedPageTreeForResume,
            }
          : null;

      await requestStorage.run(context, async () => {
        if (hasDynamicHoles) {
          const isNotFound = { value: false };
          const jsx = await getJSX(
            reqPath,
            queryObj,
            isNotFound,
            isDevelopment,
            false,
            { skipLayoutProbe: true }
          );

          const staticParentHoles =
            typeof shellPrelude === "string"
              ? new Set(
                  [
                    ...shellPrelude.matchAll(
                      /data-ppr-static-parent="(ppr-hole-\d+)"/g
                    ),
                  ].map((m) => m[1])
                )
              : null;

          await streamDynamicHoles(
            jsx,
            holes,
            writer,
            encoder,
            platformContext,
            isDevelopment,
            staticParentHoles,
            resolvedHolesMap,
            streamCtrl,
            shellContextForHoles
          );
        }

        if (isAborted()) {
          return;
        }

        if (bridge && bridge._injectedScripts) {
          const ok = await safeWrite(`\n${bridge._injectedScripts}\n`);
          bridge._injectedScripts = "";
          if (!ok) return;
        }

        if (context._hasRedirected && context._redirectLocation) {
          const safeTarget = safeJsonForInlineScript(context._redirectLocation);
          const redirectScript = `\n<script>(function(){try{window.__DINOU_STATIC_EXPORT_UNLOADING__=true;window.location.replace(${safeTarget});}catch(_){window.__DINOU_STATIC_EXPORT_UNLOADING__=true;window.location.href=${safeTarget};}})();</script>\n`;
          didEmitRedirect = true;
          await safeWrite(redirectScript);
          return;
        }

        if (
          !isAborted() &&
          (hasZeroHolePreloadedRsc ||
            (pageShellJson && (!hasActiveLayout || layoutShellJson)))
        ) {
          try {
            let layoutRscText = "";
            let pageRscText = "";
            if (hasZeroHolePreloadedRsc) {
              layoutRscText = hasActiveLayout ? resolvedPreloadedLayoutRsc : "";
              pageRscText = resolvedPreloadedPageRsc;
            } else {
              const clientManifest = getClientManifest();
              const pageHasShellHoles =
                typeof pageShellJson === "string" &&
                pageShellJson.includes('"data-ppr-hole"');
              let pageRscPromise = null;
              if (!pageHasShellHoles) {
                const cachedPageRsc =
                  resolvedPreloadedPageRsc !== undefined
                    ? resolvedPreloadedPageRsc
                    : await readRscTextFromStorage(
                        storage,
                        pageRscKey,
                        platformContext,
                        reqOriginUrl
                      );
                if (cachedPageRsc) {
                  pageRscPromise = Promise.resolve(cachedPageRsc);
                }
              }
              if (!pageRscPromise) {
                const cachedPageTree =
                  cachedPageTreeForResume || deserializeJSX(pageShellJson);
                const splicedPageTree = replaceHolesWithMap(
                  cachedPageTree,
                  resolvedHolesMap
                );
                const pageRscStream = renderRSCStream(
                  splicedPageTree,
                  clientManifest,
                  {
                    runtime: "edge",
                  }
                );
                pageRscPromise = new Response(pageRscStream).text();
              }

              let layoutRscPromise = Promise.resolve("");
              if (hasActiveLayout && layoutShellJson) {
                const layoutHasShellHoles =
                  typeof layoutShellJson === "string" &&
                  layoutShellJson.includes('"data-ppr-hole"');
                let reusedLayoutRsc = null;
                if (!layoutHasShellHoles) {
                  reusedLayoutRsc =
                    resolvedPreloadedLayoutRsc !== undefined
                      ? resolvedPreloadedLayoutRsc
                      : await readRscTextFromStorage(
                          storage,
                          layoutRscKey,
                          platformContext,
                          reqOriginUrl
                        );
                }
                if (reusedLayoutRsc) {
                  layoutRscPromise = Promise.resolve(reusedLayoutRsc);
                } else {
                  const cachedLayoutTree =
                    cachedLayoutTreeForResume || deserializeJSX(layoutShellJson);
                  const splicedLayoutTree = replaceHolesWithMap(
                    cachedLayoutTree,
                    resolvedHolesMap
                  );
                  const layoutRscStream = renderRSCStream(
                    splicedLayoutTree,
                    clientManifest,
                    { runtime: "edge" }
                  );
                  layoutRscPromise = new Response(layoutRscStream).text();
                }
              }
              [layoutRscText, pageRscText] = await Promise.all([
                layoutRscPromise,
                pageRscPromise,
              ]);
            }
            if (!isAborted() && pageRscText && (!hasActiveLayout || layoutRscText)) {
              const pprPageCacheMode = hasDynamicHoles ? "ppr" : "static";
              let rscScripts =
                `\n<script>window.__DINOU_INLINE_RSC__=true;window.__DINOU_PAGE_CACHE_MODE__="${pprPageCacheMode}";window.__DINOU_RSC_P__=window.__DINOU_RSC_P__||[];window.__DINOU_RSC_L__=window.__DINOU_RSC_L__||[];</script>`;
              if (hasActiveLayout && layoutRscText) {
                rscScripts +=
                  formatRscPushScript("L", layoutRscText) + formatRscDoneScript("L");
              }
              rscScripts +=
                formatRscPushScript("P", pageRscText) + formatRscDoneScript("P") + "\n";
              await safeWrite(rscScripts);
            }
          } catch (inlineRscErr) {
            if (!isAborted() && process.env.DINOU_DEBUG) {
              console.warn("[Dinou PPR] Inline RSC emission error:", inlineRscErr);
            }
          }
        }
      });
    } catch (streamErr) {
      if (!abortState.aborted) {
        console.error("[Dinou PPR] Runtime streaming resume error:", streamErr);
      }
    } finally {
      if (!abortState.aborted) {
        const finalPostlude = didEmitRedirect
          ? shellPostlude.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "") ||
            "</body></html>"
          : shellPostlude;
        await safeWrite(finalPostlude);
        try {
          await writer.close();
        } catch (_) {}
      }
      try {
        writer.releaseLock();
      } catch (_) {}
    }
  })();

  if (
    platformContext &&
    platformContext.ctx &&
    typeof platformContext.ctx.waitUntil === "function"
  ) {
    platformContext.ctx.waitUntil(resumePromise);
  }

  const headers = buildPprResponseHeaders();

  return new Response(readable, {
    status: bridge._explicitStatusSet
      ? bridge.statusCode
      : metadata?.status || 200,
    headers,
    encodeBody: "manual",
  });
}

export {
  streamDynamicHoles,
  handlePprResume,
  spliceDynamicHolesIntoShell,
  readShellJsonFromStorage,
  readRscTextFromStorage,
  replaceHolesWithMap,
};
export default {
  streamDynamicHoles,
  handlePprResume,
  spliceDynamicHolesIntoShell,
  readShellJsonFromStorage,
  readRscTextFromStorage,
  replaceHolesWithMap,
};
