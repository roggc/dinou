// dinou/core/ppr-runtime.js
// Dinou Partial Prerendering (PPR) Runtime Streaming Resume Engine.
// Sends the pre-rendered shell immediately (0ms TTFB) and progressively
// streams dynamic Suspense holes as they resolve over the same HTTP connection.
// Designed for the Dual-Bundle architecture (Pass A: RSC, Pass B: SSR).

const React = require("react");
const { renderRSCStream } = require("./rsc-renderer.js");
const { getClientManifest } = require("./manifest-provider.js");
const { requestStorage, setCurrentContext } = require("./request-context.js");
const getJSX = require("./get-jsx.js");

/**
 * Traverses a React JSX element tree to find Suspense boundaries,
 * evaluates their dynamic children, and streams replacement chunks.
 *
 * @param {object} node - Root JSX node (layout + page)
 * @param {Array<string|object>} expectedHoles - Holes registered at build time
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
  isDevelopment = false
) {
  let holeIndex = 0;
  const holePromises = [];

  const knownHoleIds = new Set(
    (expectedHoles || []).map((h) => (typeof h === "object" ? h.id : h))
  );

  const clientManifest = getClientManifest();

function isClientComponent(type) {
  if (!type) return false;
  return (
    type.$$typeof === Symbol.for("react.client.reference") ||
    Boolean(type.$$id) ||
    Boolean(type.filepath)
  );
}

  async function traverse(current) {
    if (!current) return;

    // Handle Client Component: do NOT execute, only traverse children
    if (isClientComponent(current?.type) || current?.$$typeof === Symbol.for("react.client.reference")) {
      if (current?.props?.children) {
        await traverse(current.props.children);
      }
      return;
    }

    // Handle React Server Component function
    if (typeof current?.type === "function") {
      try {
        const evaluated = await current.type(current.props || {});
        await traverse(evaluated);
      } catch (err) {
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
      try {
        const rendered = current.type.render(current.props || {}, current.ref);
        await traverse(rendered);
      } catch (err) {
        console.error("[Dinou PPR] Error evaluating forward_ref in hole traversal:", err);
      }
      return;
    }

    // Handle React.Suspense
    if (
      current?.type === Symbol.for("react.suspense") ||
      current?.type === React.Suspense
    ) {
      holeIndex++;
      const currentHoleId = `ppr-hole-${holeIndex}`;

      // Check if this boundary was registered as a dynamic hole
      const shouldStream =
        knownHoleIds.size === 0 || knownHoleIds.has(currentHoleId);

      if (shouldStream) {
        const children = current.props?.children;
        const promise = (async () => {
          try {
            let html = "";
            if (platformContext && platformContext.renderHtmlStream) {
              const rscStream = renderRSCStream(children, clientManifest, { runtime: "edge" });
              const htmlStream = await platformContext.renderHtmlStream(rscStream, {
                bootstrapModules: [],
              });
              html = await new Response(htmlStream).text();
            }

            const chunk = `\n<template id="ppr-content-${currentHoleId}">${html}</template>\n<script>(function(){var c=document.getElementById("ppr-content-${currentHoleId}");if(!c)return;var b=document.getElementById("B:${holeIndex - 1}");var t=document.querySelector('[data-ppr-hole="${currentHoleId}"]')||(b?b.nextElementSibling:null);try{if(t){t.replaceWith(c.content?c.content:...c.childNodes);}}finally{c.remove();}})();</script>\n`;
            await writer.write(encoder.encode(chunk));
          } catch (holeErr) {
            console.error(`[Dinou PPR] Error resolving dynamic hole ${currentHoleId}:`, holeErr);
            const errMsg = isDevelopment
              ? (holeErr?.message || "Unknown dynamic error")
              : "Error loading dynamic content";
            const errChunk = `\n<template id="ppr-content-${currentHoleId}"><div style="color:#e11d48;padding:8px 12px;background:#fff1f2;border:1px solid #fecdd3;border-radius:6px;font-size:0.875rem;font-family:system-ui,sans-serif;">[PPR Error: ${errMsg}]</div></template>\n<script>(function(){var c=document.getElementById("ppr-content-${currentHoleId}");if(!c)return;var b=document.getElementById("B:${holeIndex - 1}");var t=document.querySelector('[data-ppr-hole="${currentHoleId}"]')||(b?b.nextElementSibling:null);try{if(t){t.replaceWith(c.content?c.content:...c.childNodes);}}finally{c.remove();}})();</script>\n`;
            await writer.write(encoder.encode(errChunk));
          }
        })();
        holePromises.push(promise);
      }
      return;
    }

    // Handle Arrays (children)
    if (Array.isArray(current)) {
      for (const item of current) {
        await traverse(item);
      }
      return;
    }

    // Traverse children props
    if (current?.props?.children) {
      await traverse(current.props.children);
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
  }

  // Separate shell into prelude (up to </body>) and postlude
  const lowerHtml = shellHtml.toLowerCase();
  const bodyCloseIndex = lowerHtml.lastIndexOf("</body>");
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

      const dynamicState = { value: true };
      const context = createRequestContext(simReq, bridge, platformContext, dynamicState);
      if (typeof copyCustomContextProperties === "function") {
        copyCustomContextProperties(rootContext, context);
      }
      if (typeof setCurrentContext === "function") {
        setCurrentContext(context);
      }

      await requestStorage.run(context, async () => {
        const isNotFound = { value: false };
        const jsx = await getJSX(
          reqPath,
          queryObj,
          isNotFound,
          isDevelopment,
          false
        );

        const holes = metadata?.holes || [];
        await streamDynamicHoles(
          jsx,
          holes,
          writer,
          encoder,
          platformContext,
          isDevelopment
        );
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

module.exports = {
  streamDynamicHoles,
  handlePprResume,
};
