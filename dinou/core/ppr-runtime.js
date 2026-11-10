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
import { requestStorage, setCurrentContext } from "./request-context.js";
import getJSX from "./get-jsx.js";
import { getStorageAdapter } from "./storage-adapter.js";
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
} from "./ppr-context.js";

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
  try {
    const diskPath = path.resolve(process.cwd(), ".dinou/dist2", key);
    if (existsSync(diskPath)) {
      const txt = readFileSync(diskPath, "utf8");
      if (txt && txt.trim().startsWith("{")) {
        return txt;
      }
    }
  } catch (e) {}
  if (platformContext?.env?.ASSETS && reqUrl) {
    try {
      const assetRes = await platformContext.env.ASSETS.fetch(new Request(new URL(`/${key}`, reqUrl)));
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
  return null;
}

function replaceHolesWithMap(node, liveHolesMap) {
  if (
    !node ||
    typeof node !== "object" ||
    node instanceof Promise ||
    node.$$typeof === Symbol.for("react.client.reference") ||
    typeof node.then === "function"
  ) {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map((item) => replaceHolesWithMap(item, liveHolesMap));
  }
  if (node.$$typeof === Symbol.for("react.transitional.element")) {
    const holeId = node.props && node.props["data-ppr-hole"];
    if (typeof holeId === "string" && liveHolesMap.has(holeId)) {
      return liveHolesMap.get(holeId);
    }
    if (node.props && typeof node.props === "object") {
      let changed = false;
      const newProps = { ...node.props };
      for (const [k, v] of Object.entries(node.props)) {
        if (v && typeof v === "object") {
          const updated = replaceHolesWithMap(v, liveHolesMap);
          if (updated !== v) {
            newProps[k] = updated;
            changed = true;
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
  const clone = { ...node };
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === "object") {
      const updated = replaceHolesWithMap(v, liveHolesMap);
      if (updated !== v) {
        clone[k] = updated;
        changed = true;
      }
    }
  }
  return changed ? clone : node;
}

async function PprDynamicHoleBoundary({ holeId, children }) {
  return await runInRuntimeDynamicHole(
    () => asyncRenderJSXToClientJSX(children),
    holeId
  );
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

  async function traverseProps(props) {
    if (!props || typeof props !== "object") return;
    for (const [, value] of Object.entries(props)) {
      if (value && typeof value === "object") {
        await traverse(value);
      }
    }
  }

  async function traverse(current) {
    if (!current || liveHolesMap.size >= knownHoleIds.size) return;
    if (Array.isArray(current)) {
      for (const item of current) {
        if (liveHolesMap.size >= knownHoleIds.size) return;
        await traverse(item);
      }
      return;
    }
    if (typeof current !== "object" || current instanceof Promise) {
      return;
    }
    if (
      isClientComponentRef(current?.type) ||
      current?.$$typeof === Symbol.for("react.client.reference")
    ) {
      await traverseProps(current?.props);
      return;
    }
    if (typeof current?.type === "function") {
      try {
        const evaluated = await invokeWithServerHooksDispatcher(() =>
          current.type(current.props || {})
        );
        await traverse(evaluated);
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
        await traverseProps(current.props);
        return;
      }
      try {
        const rendered = await invokeWithServerHooksDispatcher(() =>
          current.type.render(current.props || {}, current.ref)
        );
        await traverse(rendered);
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
        await traverseProps(current.props);
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
        await traverse(rendered);
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
          await traverse(current.props.children);
        }
        if (current.props?.fallback) {
          await traverse(current.props.fallback);
        }
      });
      return;
    }
    if (current?.$$typeof === Symbol.for("react.transitional.element")) {
      await traverseProps(current.props);
    } else {
      await traverseProps(current);
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
  resolvedHolesOut = null
) {
  let holeIndex = 0;
  const holePromises = [];

  const hasExplicitHoles = Array.isArray(expectedHoles);
  const knownHoleIds = new Set(
    (expectedHoles || []).map((h) => (typeof h === "object" ? h.id : h))
  );
  if (hasExplicitHoles && knownHoleIds.size === 0) {
    return;
  }

  const clientManifest = getClientManifest();

  async function traverseProps(props) {
    if (!props || typeof props !== "object") return;
    for (const [, value] of Object.entries(props)) {
      if (hasExplicitHoles && holePromises.length >= knownHoleIds.size) return;
      if (value && typeof value === "object") {
        await traverse(value);
      }
    }
  }

  async function traverse(current) {
    if (!current || (hasExplicitHoles && holePromises.length >= knownHoleIds.size)) return;

    // Handle Arrays (children)
    if (Array.isArray(current)) {
      for (const item of current) {
        if (hasExplicitHoles && holePromises.length >= knownHoleIds.size) return;
        await traverse(item);
      }
      return;
    }

    if (typeof current !== "object" || current instanceof Promise) {
      return;
    }

    // Handle Client Component: do NOT execute, only traverse props in deterministic order
    if (
      isClientComponentRef(current?.type) ||
      current?.$$typeof === Symbol.for("react.client.reference")
    ) {
      await traverseProps(current?.props);
      return;
    }

    // Handle React Server Component function
    if (typeof current?.type === "function") {
      try {
        const evaluated = await invokeWithServerHooksDispatcher(() =>
          current.type(current.props || {})
        );
        await traverse(evaluated);
      } catch (err) {
        if (err && err.$$typeof === SKIP_STATIC_SUSPENSE_SYMBOL) {
          return;
        }
        console.error("[Dinou PPR] Error evaluating component in hole traversal:", err);
      }
      return;
    }

    // Handle React.forward_ref
    if (
      typeof current?.type === "object" &&
      current.type !== null &&
      current.type.$$typeof === Symbol.for("react.forward_ref")
    ) {
      if (isClientComponentRef(current.type)) {
        await traverseProps(current.props);
        return;
      }
      try {
        const rendered = await invokeWithServerHooksDispatcher(() =>
          current.type.render(current.props || {}, current.ref)
        );
        await traverse(rendered);
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
        await traverseProps(current.props);
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
        await traverse(rendered);
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
          try {
            let html = "";
            const resolvedChildren = await asyncRenderJSXToClientJSX(children);
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
              const rscStream = renderRSCStream(resolvedChildren, clientManifest, { runtime: "edge" });
              const htmlStream = await platformContext.renderHtmlStream(rscStream, {
                bootstrapModules: [], importMapHtml: "",
              });
              html = await new Response(htmlStream).text();
            }

            const chunk = `\n<template id="ppr-content-${currentHoleId}"><!--$-->${html}<!--/$--></template>\n<script>(function(){var c=document.getElementById("ppr-content-${currentHoleId}");if(!c)return;var b=document.getElementById("B:${currentBoundaryIndex}");var t=document.querySelector('[data-ppr-hole="${currentHoleId}"]')||(b?b.nextElementSibling:null);try{if(t){if(c.content){t.replaceWith(c.content);}else{t.replaceWith.apply(t,Array.from(c.childNodes));}}}finally{c.remove();}})();</script>\n`;
            await writer.write(encoder.encode(chunk));
          } catch (holeErr) {
            if (resolvedHolesOut) resolvedHolesOut._hadError = true;
            console.error(`[Dinou PPR] Error resolving dynamic hole ${currentHoleId}:`, holeErr);
            const rawErrMsg = isDevelopment
              ? (holeErr?.message || "Unknown dynamic error")
              : "Error loading dynamic content";
            const errMsg = escapeHtml(rawErrMsg);
            const errChunk = `\n<template id="ppr-content-${currentHoleId}"><div style="color:#e11d48;padding:8px 12px;background:#fff1f2;border:1px solid #fecdd3;border-radius:6px;font-size:0.875rem;font-family:system-ui,sans-serif;">[PPR Error: ${errMsg}]</div></template>\n<script>(function(){var c=document.getElementById("ppr-content-${currentHoleId}");if(!c)return;var b=document.getElementById("B:${currentBoundaryIndex}");var t=document.querySelector('[data-ppr-hole="${currentHoleId}"]')||(b?b.nextElementSibling:null);try{if(t){if(c.content){t.replaceWith(c.content);}else{t.replaceWith.apply(t,Array.from(c.childNodes));}}}finally{c.remove();}})();</script>\n`;
            await writer.write(encoder.encode(errChunk));
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
          await traverse(current.props.children);
        }
        if (current.props?.fallback) {
          await traverse(current.props.fallback);
        }
      });
      return;
    }

    // Traverse host element / Fragment props or plain props object
    if (current?.$$typeof === Symbol.for("react.transitional.element")) {
      await traverseProps(current.props);
    } else {
      await traverseProps(current);
    }
  }

  await traverse(node);
  await Promise.all(holePromises);
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
  createRequestContext,
  copyCustomContextProperties,
}) {
  let shellHtml = cachedItem.content;
  if (typeof shellHtml === "string") {
    if (!shellHtml.includes("window.__DINOU_LAYOUTS__")) {
      const knownLayouts = typeof getDiscoveredLayouts === "function" ? getDiscoveredLayouts() : {};
      shellHtml = shellHtml.replace(
        "</head>",
        `<script>window.__DINOU_LAYOUTS__=${JSON.stringify(knownLayouts)};</script></head>`
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

  // Stream dynamic holes in parallel with the prelude
  const resumePromise = (async () => {
    try {
      // 1. Immediately flush static shell prelude (0ms TTFB)
      await writer.write(encoder.encode(shellPrelude));

      const storage = getStorageAdapter();
      const cleanRel = (reqPath || "").replace(/^\/+/, "").replace(/\/+$/, "");
      const reqSegments = cleanRel ? cleanRel.split("/").filter(Boolean) : [];
      const srcFolder = path.resolve(process.cwd(), "src");
      let activeChain = [];
      try {
        activeChain = getActiveLayoutChain(reqSegments, queryObj || {}, srcFolder);
      } catch (e) {}
      const hasActiveLayout = activeChain.length > 0;
      const leafLayoutKey = hasActiveLayout ? activeChain[0].cleanLayoutKey : null;
      const shellPageKey = cleanRel ? `${cleanRel}/shell.page.json` : "shell.page.json";
      const shellLayoutKey = hasActiveLayout
        ? leafLayoutKey
          ? `${leafLayoutKey}/shell.layout.json`
          : "shell.layout.json"
        : null;
      const reqOriginUrl = simReq?.url
        ? `http://${simReq.headers?.host || "localhost:3000"}${simReq.url}`
        : null;
      const [pageShellJson, layoutShellJson] = await Promise.all([
        readShellJsonFromStorage(storage, shellPageKey, platformContext, reqOriginUrl),
        hasActiveLayout
          ? readShellJsonFromStorage(storage, shellLayoutKey, platformContext, reqOriginUrl)
          : Promise.resolve(null),
      ]);

      let holes = Array.isArray(metadata?.holes) ? metadata.holes : null;
      if ((!holes || holes.length === 0) && typeof shellPrelude === "string") {
        const extracted = [
          ...shellPrelude.matchAll(/data-ppr-hole="(ppr-hole-\d+)"/g),
        ].map((m) => m[1]);
        if (extracted.length > 0 || Array.isArray(metadata?.holes)) {
          holes = extracted;
        }
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

      await requestStorage.run(context, async () => {
        if (!Array.isArray(holes) || holes.length > 0) {
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
            resolvedHolesMap
          );
        }

        if (
          !resolvedHolesMap._hadError &&
          pageShellJson &&
          (!hasActiveLayout || layoutShellJson)
        ) {
          try {
            const clientManifest = getClientManifest();
            const cachedPageTree = deserializeJSX(pageShellJson);
            const splicedPageTree = replaceHolesWithMap(cachedPageTree, resolvedHolesMap);
            const pageRscStream = renderRSCStream(splicedPageTree, clientManifest, {
              runtime: "edge",
            });
            let layoutRscPromise = Promise.resolve("");
            if (hasActiveLayout && layoutShellJson) {
              const cachedLayoutTree = deserializeJSX(layoutShellJson);
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
            const [layoutRscText, pageRscText] = await Promise.all([
              layoutRscPromise,
              new Response(pageRscStream).text(),
            ]);
            if (pageRscText && (!hasActiveLayout || layoutRscText)) {
              let rscScripts =
                "\n<script>window.__DINOU_INLINE_RSC__=true;window.__DINOU_RSC_P__=window.__DINOU_RSC_P__||[];window.__DINOU_RSC_L__=window.__DINOU_RSC_L__||[];</script>";
              if (hasActiveLayout && layoutRscText) {
                rscScripts +=
                  formatRscPushScript("L", layoutRscText) + formatRscDoneScript("L");
              }
              rscScripts +=
                formatRscPushScript("P", pageRscText) + formatRscDoneScript("P") + "\n";
              await writer.write(encoder.encode(rscScripts));
            }
          } catch (inlineRscErr) {
            if (process.env.DINOU_DEBUG) {
              console.warn("[Dinou PPR] Inline RSC emission error:", inlineRscErr);
            }
          }
        }
      });
    } catch (streamErr) {
      console.error("[Dinou PPR] Runtime streaming resume error:", streamErr);
    } finally {
      try {
        await writer.write(encoder.encode(shellPostlude));
        await writer.close();
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

  const headers = new Headers(bridge.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

  return new Response(readable, {
    status: metadata?.status || 200,
    headers,
  });
}

export {
  streamDynamicHoles,
  handlePprResume,
  spliceDynamicHolesIntoShell,
};
export default {
  streamDynamicHoles,
  handlePprResume,
  spliceDynamicHolesIntoShell,
};
