# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [9.3.0] - 2026-11-07

### Added
- **Smart Cache-Aware `<Suspense>` Streaming for `<DinouCacheSlot>` in Dynamic SSR Routes**: Enabled non-blocking TTFB streaming on cache misses and zero-fallback inlining on cache hits whenever `<DinouCacheSlot>` is wrapped inside `<Suspense>` on a dynamic SSR route (`revalidate = 0` or routes accessing request-time `cookies`, `headers`, or `query` with `ppr = false`):
  - **Non-Blocking TTFB on Cold Cache Misses & After `revalidateTag()` Purges**: When a `<DinouCacheSlot>` inside an outer `<Suspense>` boundary (`isInsideRuntimeSuspenseOutsideSlot()`) misses storage cache (1st request, after `revalidateTag()`, or `revalidate={0}`), it immediately flushes the dynamic page shell and the `<Suspense>` `fallback` via `<DinouDeferredSlotStream>` without blocking `getJSX`, streaming the resolved widget (`$RC(...)`) in the same HTTP response and persisting `slot.json` for subsequent requests.
  - **Zero Fallback Flash on Warm Cache Hits & Expired TTLs (Background SWR)**: When `slot.json` is present in storage, `DinouCacheSlot` deserializes and inlines the cached subtree synchronously during `getJSX` across both `development` and `production` (`containsCacheSlot`), never emitting the `<Suspense>` `fallback` on warm hits or during non-blocking background SWR revalidations (`inStaticShell: true`).
- **Awaitable `refreshSlot(slotId, options): Promise<void>` Client API**: Updated `refreshSlot` and `useRouter().refreshSlot` across ESM, Rollup, and Webpack client runtimes (`client.jsx`, `client-webpack.jsx`, `navigation.js`, `slot.js`, and `index.d.ts`) to return a `Promise<void>` that settles once all matching `<DinouCacheSlotBoundary>` and unmounted slot refreshes complete, enabling `await refreshSlot(...)` inside `React.useTransition()` for non-destructive loading indicators while reconciling slot content in-place without unmounting to the outer `<Suspense>` `fallback`.

## [9.2.0] - 2026-11-06

### Added
- **React 19 Synchronous Server Component `useId()` & Stateless Hooks Support**: Implemented a deterministic Server Hooks dispatcher (`DinouServerHooksDispatcher`) supporting React 19's official synchronous Server Component hooks (`useId`, `use`, `useMemo`, `useCallback`, `useDebugValue`, and the React Compiler's `useMemoCache`) across all rendering modes (`dev`, Node.js AOT Dual-Bundle, Bun, Deno, Cloudflare Workers, and Netlify):
  - **5-Tier Hierarchical Scoped ID Engine (`useServerId`)**: Guarantees 100% hydration parity between full-document SSR (`GET /path`) and segmented RSC endpoints (`GET /____rsc_layout____/path`, `GET /____rsc_page____/path`, and `GET /____rsc_slot____/:id`) by scoping generated IDs to their exact execution boundary: `<DinouCacheSlot>` (`_slot_<id>_dS_<N>_`), `<Suspense>` / PPR Hole (`_hole_<id>_dS_<N>_`), Page segment (`_page_dS_<N>_`), Layout / Parallel `@slot` segment (`_layout_dS_<N>_`), and a request-level fallback (`_dS_<N>_`).
  - **Dual Dispatcher Interception**: Patched React's internal dispatcher setter (`__SERVER_INTERNALS` / `__CLIENT_INTERNALS`) so both Dinou's pre-evaluation pass (`asyncRenderJSXToClientJSX`) and `react-server-dom-webpack`'s live Flight streaming pass route `useId()` and `use()` through Dinou's context-aware dispatcher.
  - **Sibling `<Suspense>` Race-Condition Immunity**: Enforces deterministic tree-order JSX traversal (`for...of`), pre-allocates `<Suspense>` boundary IDs (`layout-hole-N`, `ppr-hole-N`, `ppr-hole-N-M`), and isolates their internal `useId()` counters via `runInRuntimeDynamicHole` (evaluating eagerly during SSG/PPR/production so `ppr = false` static routes resolve into static HTML, and streaming via `<DinouSuspenseHoleBoundary>` in `dev`), preventing timer resolution order or Flight `MAX_ROW_SIZE` chunk deferrals from shifting sibling IDs.
  - **`React.use(pendingPromise)` Replay Counter Rollback**: Snapshots and restores active scope ID counters whenever a synchronous Server Component suspends on a pending thenable via `React.use()`, ensuring re-invocations produce identical IDs without gaps.
  - **`React.memo` & `React.forwardRef` Server Component Unwrapping**: Added support for stateless server hooks inside `React.memo`, `React.forwardRef`, and nested `React.memo(React.forwardRef(...))` Server Components across both standard RSC rendering and PPR dynamic hole streaming/splicing.

### Changed
- **Single-Pass Layout & Parallel `@slot` Evaluation with Error-Isolation Rollback**: Optimized `getJSX` to evaluate each `Layout` and parallel `@slot` once inside `runInLayoutSegment` using a structural children placeholder (`createLayoutChildrenPlaceholder` / `replaceLayoutChildrenPlaceholder`), rolling back segment ID and hole counters automatically if a nested layout or `@slot` throws and falls back to `error.tsx`.

## [9.1.0] - 2026-11-05

### Added
- **`noDynamic()` Opt-Out Hook for PPR Static `<Suspense>` Boundaries (`"dinou"` & `"dinou/server"`)**: Introduced the `noDynamic()` hook (exported from both `"dinou"` and `"dinou/server"` with zero `node:*` client-bundle dependencies) to opt an enclosing `<Suspense>` boundary out of becoming a Dynamic PPR Hole on `ppr = true` routes. Calling `noDynamic()` synchronously before the first `await` of an `async` Server Component resolves the boundary at build/revalidation time into `shell.html` and short-circuits its runtime execution (`0ms`) during dynamic hole streaming unless a dynamic request API (`cookies`, `headers`, `query`) is accessed later in the subtree.
- **Background Stale-While-Revalidate (SWR) for Static Shell `<DinouCacheSlot revalidate={N}>`**: Implemented non-blocking background SWR (`onlyRefreshSlots: true`) when a Static Shell `<DinouCacheSlot revalidate={N}>` (`N >= 1`) expires on both `ppr = false` and `ppr = true` routes. Instead of blocking the incoming request's TTFB while re-rendering the expired slot, Dinou now serves the cached `index.html` / `shell.html` (and `page.rsc` / `layout.rsc`) immediately (`0ms` TTFB) and refreshes only the expired `slot.json` and host HTML/RSC artifacts asynchronously in the background.
- **Unified Server Exports in `"dinou/server"`**: Exported `getContext()` and `noDynamic()` from `"dinou/server"`, and re-exported all server, route parameter, page/layout/error prop, request context, and plugin TypeScript types (`RequestContextStore`, `ResponseProxy`, `CookieOptions`, `Query`, `Cookies`, `Headers`, `PageProps`, `LayoutProps`, `ErrorProps`, `RouteParams`, `DinouRoutePattern`, `DinouRoute`, `DinouRouter`, `CleanRoutePath`, `ExtractRouteParams`, `ExtractSegmentParam`, `DinouConfig`, `DinouPlugin`, `ServerHookContext`, `NodeMiddleware`) from `dinou/server.d.ts`.

### Changed
- **Default Dynamic Streaming for `async` Server Components Inside `<Suspense>` on PPR Routes (`ppr = true`)**: Refined the Partial Prerendering (`ppr = true`) mental model so that `<Suspense>` is the single boundary separating the Static Shell from Dynamic PPR Holes. On `ppr = true` routes, any `async` Server Component inside a `<Suspense>` boundary now automatically postpones at its first `await` during build time to become a Dynamic PPR Hole (`data-ppr-hole`), baking its `<Suspense fallback={...}>` into `shell.html` and streaming the resolved content at request time—without requiring explicit access to `req.cookies`, `req.headers`, `req.query`, or `revalidate={0}`. Outside `<Suspense>` (and on `ppr = false` routes), `async` Server Components continue to resolve at build time into the Static Shell.
- **Nesting-Order Semantics for `<Suspense>` and `<DinouCacheSlot>` in PPR Routes**: When `<Suspense>` wraps `<DinouCacheSlot>` (`<Suspense><DinouCacheSlot>...</DinouCacheSlot></Suspense>`) on a `ppr = true` route, the boundary now acts as a Cached Dynamic PPR Hole by default (unless opted out via `noDynamic()`), streaming its fallback in `shell.html` and caching `slot.json` across runtime hole streams. Conversely, when `<DinouCacheSlot>` wraps `<Suspense>` (`<DinouCacheSlot><Suspense>...</Suspense></DinouCacheSlot>`) without an outer `<Suspense>`, the slot resolves into the Static Shell (`shell.html` and `slot.json`) while preserving the inner `<Suspense>` boundary node so subsequent dynamic hole indices remain aligned.

## [9.0.3] - 2026-11-01

### Fixed
- **Direct Client Component Imports of Function-Level `"use server"` Functions**: Fixed an issue in the client bundler pipelines (`esbuild`, `rollup`, and `webpack`) where modules without a top-level `"use server"` directive that exported functions declaring `"use server"` inside their body were only matched against module-level directives. Importing such functions directly into `"use client"` components previously bundled the raw function implementation into the browser instead of generating an RPC proxy. All three client bundlers now inspect and extract function-level `"use server"` exports via `hasServerFunctions` and `extractServerFunctions`, emitting `createServerFunctionProxy` bindings while preserving granular manifest tree-shaking (excluding private and non-server helpers).
- **Live HMR Manifest Synchronization for Inline and Function-Level `"use server"` Actions**: Fixed a state desynchronization issue in development mode (`dinou/node/dev.js`, `esbuild/plugins-esbuild/server-functions-plugin.js`, `rollup/rollup-plugins/rollup-plugin-server-functions.js`, `webpack/loaders/server-functions-loader.js`, and `webpack/webpack.config.js`) where adding or modifying inline or body-level `"use server"` functions while the dev server was running could be omitted or overwritten in `__DINOU_SERVER_FUNCTIONS_MANIFEST__` during incremental client rebuilds, or trigger premature/duplicate page reloads in `dev:webpack` before client compilation completed. Server file `mtime` caches, live manifest state, `notifyFileChanged` client build awaiting (`__DINOU_WEBPACK_MODIFIED_FILES__`), and single-pass WebSocket reload broadcasting (`devServer.webSocketServer.clients`) now stay synchronized in real time across Esbuild, Rollup, and Webpack without requiring a dev server restart.
- **Partial Prerendering (PPR) Pre-Hydration Streaming Script, Deterministic Hole Indexing, and `metadata.json` Hole Preservation**:
  - Fixed a JavaScript syntax error (`c.content?c.content:...c.childNodes`) and async closure index drift (`B:${holeIndex - 1}`) in the inline DOM replacement `<script>` chunks emitted by `streamDynamicHoles` (`dinou/core/ppr-runtime.js`), ensuring streamed `<template id="ppr-content-...">` chunks immediately replace `[data-ppr-hole]` fallbacks prior to client-side RSC hydration with HTML-escaped error fallbacks.
  - Synchronized 1-based `ppr-hole-N` indexing across layouts and pages (`dinou/core/render-jsx-to-client-jsx.js`, `dinou/core/ppr-runtime.js`, `dinou/core/handler.js`, and `dinou/core/build-static-pages.js`) by calling `resetPprHoles()` prior to `getJSX()`, traversing static and nested `<Suspense>` boundaries in identical pre-order at build time and runtime, unwrapping `React.memo` / `React.forwardRef` Server Components, and traversing `"use client"` component props without invoking client references on the server.
  - Added tri-state PPR config resolution (`resolveModulePpr` in `dinou/core/resolve-module-ppr.js`) so child pages can explicitly opt out (`export const ppr = false`) when a parent layout or global config enables PPR.
  - Fixed `dinou/node/generate-static-pages.js` overwriting `metadata.json` after PPR shell extraction so `ppr: true` and registered `holes` metadata are preserved on disk, and refined `shouldCacheISG` (`ssgPprUnwrappedBailout` in `dinou/core/handler.js`) so unwrapped dynamic bailouts on PPR routes skip static shell persistence while non-PPR static pages invoking Server Functions during Pass B SSR still cache statically during `generateStatic`.
- **PPR Dynamic Boundary Detection, Scoped Bailout Isolation, and Nested Hole Deduplication**: Fixed `asyncRenderJSXToClientJSX` (`dinou/core/render-jsx-to-client-jsx.js`) and `getJSX` (`dinou/core/get-jsx.js`) so `<Suspense>` boundaries wrapping dynamic components in both pages and layouts are accurately captured as PPR holes during static shell generation without leaking dynamic bailouts across sibling static components or registering duplicate nested holes inside an already-captured parent `<Suspense>` hole.
- **PPR Client Hydration Stability and Query Parameter Forwarding**: Fixed `dinou/core/client.jsx` and `dinou/core/client-webpack.jsx` to skip redundant initial `/____rsc_page____` and `/____rsc_layout____` fetches when hydrating PPR pages (`window.__DINOU_PPR__`), preventing streamed dynamic holes from flashing back to their `<Suspense>` fallbacks during hydration, while forwarding `window.location.search` on client-side RSC refreshes so dynamic holes reading `req.query` retain their query parameters.
- **Vertical Segmentation (`<DinouCacheSlot>` & `refreshSlot`) Cold-Start Discovery, Nested Slots, Clock-TTL Expiration, In-Place Client Reconciliation, Soft-Navigation Slot Persistence, Unmounted Slot Refreshing, Out-of-Order Race Protection, Server Action Serialization, React 19 Dev Descriptor Preservation, and Edge/Deno KV Invalidation Parity**:
  - Fixed `getSlotJSX` (`dinou/core/cache-slot.js`) on cold server starts so `/____rsc_slot____/:id` evaluates the route tree (`asyncRenderJSXToClientJSX`) inside `runWithPprContext({ isPpr: true })`, coalesces concurrent cold-start pre-evaluations per route (`preEvaluatingRoutes`), isolates discovery passes per async execution context via `AsyncLocalStorage` (`slotDiscoveryStorage`), falls back to full layout+page evaluation for layout-level slots, and discovers nested slots inside cached outer slots via `entry.discover()`.
  - Fixed `<DinouCacheSlot revalidate={0}>` (`dinou/core/cache-slot.js`) to strictly bypass storage caching (`0 = no-cache`), preserved React 19 non-enumerable development descriptors (`_debugStack`, `_debugTask`, `_debugInfo`, `ref`, `_store`) when cloning elements in `asyncRenderJSXToClientJSX` (`dinou/core/render-jsx-to-client-jsx.js`) to prevent `react-server-dom-webpack` stack-trace crashes in development mode, and coerced `_store.validated` to `1` (`jsx._store.validated || 1` in `cloneWithDevProps` and `deserializeJSX` in `dinou/core/cache-slot.js`) to eliminate false-positive React 19 development `"key" prop` warnings inside `<DinouCacheSlotBoundary>`.
  - Fixed clock-based TTL expiration (`revalidate: N` with `N >= 1`) on both tagged and tagless `<DinouCacheSlot>` boundaries (`dinou/core/cache-slot.js` and `dinou/core/handler.js`): always recorded the canonical `slotId` alongside user `tags` (`[slotId, ...allTags]`) in `metadata.json` and `layout.metadata.json` `slotTags`, added `hasExpiredSlots(slotTags)` checks across both RSC (`/____rsc_layout____`, `/____rsc_page____`) and HTML/PPR (`index.html`, `shell.html`) endpoints so expired slots deterministically regenerate and trigger surgical host re-composition (`{ onlyRefreshSlots: true }`) instead of being masked by an outer host cache hit, and updated `getSlotJSX` (`/____rsc_slot____/:id`) so live `refreshSlot(slotId)` calls without `{ fresh: true }` after TTL expiration await fresh slot regeneration and re-compose the host in the background.
  - Enabled tag-based live refreshing (`refreshSlot(tag)` and `useRouter().refreshSlot(tag)`) across `DinouCacheSlotBoundary` (`dinou/core/slot.js`) and `resolveCanonicalSlotId` (`dinou/core/cache-slot.js`), and updated `DinouCacheSlotBoundary` to pair its live-refreshed override state with the server `children` reference (`{ baseChildren: children, content: resolved }` inside `React.startTransition`) backed by a session-level `slotOverrideCache`. This preserves local `useState` inside refreshed `<DinouCacheSlot>` Client Components, retains live-refreshed slot trees across round-trip soft navigations (`Page A -> Page B -> Page A`) served from `pageCache` or `layoutCache` (`0` network requests), and automatically yields to fresh server `children` whenever `router.refresh()`, `router.refresh({ layout: true })`, or `<Link fresh>` delivers a new RSC payload.
  - Added client-side tracking of mounted vs. unmounted slots (`knownClientSlots` and `mountedClientSlots` in `dinou/core/slot.js`) and `options.currentPath` forwarding in `fetchSlotRSC` (`dinou/core/client.jsx` and `dinou/core/client-webpack.jsx`) so calling `refreshSlot(idOrTag)` while a slot's `<DinouCacheSlotBoundary>` is unmounted on a sibling route refreshes the slot in the background using its origin route path and seamlessly reconciles if the boundary remounts while the fetch is in flight (`entry.notifyMounted`).
  - Added deterministic **Last-Write-Wins (LWW)** race protection for out-of-order concurrent `refreshSlot()` calls across both client (`dinou/core/slot.js`) and server (`dinou/core/cache-slot.js`): tracked a monotonic `latestReqId` (`pendingReqId`) and `pendingPromise` per slot across mounted (`handleRefresh`), unmounted (`knownClientSlots`), and remounting boundaries so slower superseded responses are discarded without overwriting `slotOverrideCache` or DOM state (even after a faster subsequent request has already settled and cleared `pendingPromise = null`); keyed server-side `inflightSlotRenders` by `options.fresh ? stampedeKey : storageKey` so distinct client `refreshSlot(id, { fresh: true })` requests (`?t=${Date.now()}-${slotSeq}&fresh=1`) execute fresh renders without coalescing onto an older slow in-flight render (while keeping identical concurrent requests deduplicated); and guarded `storage.set(storageKey, ...)` and host re-composition (`revalidatePage` / `revalidateLayout`) with a monotonic per-slot generation counter (`slotRenderGenerations` via `Symbol.for("dinou.slot.render.generation")`) so slower stale renders never overwrite newer cached slot state.
  - Added serialization and `registerServerReference` reconstruction for `"use server"` Server Action references (`Symbol.for("react.server.reference")`) passed as props to Client Components inside cached `<DinouCacheSlot>` trees (`dinou/core/cache-slot.js`).
  - Added `refreshNestedSlotsInTree` (`dinou/core/cache-slot.js`) so invalidating or refreshing an inner `<DinouCacheSlot>` nested inside a cached outer `<DinouCacheSlot>` updates the inner slot without requiring outer slot invalidation.
  - Recorded rendered slot tags (`slotTags`) in route `metadata.json` and `layout.metadata.json` (`dinou/core/handler.js` and `dinou/core/generate-static.js`), disambiguated `slots/` storage keys from route paths containing `"slot"`, optimized `revalidateTag` on `FileSystemStorage` (`dinou/core/cache-revalidate.js`) to scan only `*metadata.json` files, cleared stale `.dinou/dist2/slots` on dev server startup (`dinou/node/dev.js`), and aligned Edge/Deno KV & Cloudflare Assets slot hydration, tag invalidation (`getSlotFromStorage`, `markTagInvalidated`, and `getTagInvalidatedAt`), and `page.rsc` regeneration (`dinou/core/handler.js`, `dinou/core/cache-slot.js`, `dinou/core/cache-revalidate.js`, `dinou/core/storage-adapter.js`, `dinou/deno/seed-kv.js`, and `dinou/{deno,cloudflare,bun}/build.js`) so static and PPR host pages never miss build-time `env.ASSETS` slots on cold KV or serve stale build-time `page.rsc`, `shell.layout.json`, or `shell.html` payloads after `revalidateTag(slotTag)`.
- **Partial Prerendering (PPR) & `<DinouCacheSlot>` (Micro-ISR) Synergy, Transactional `<Suspense>` Slot Effects, and Surgical Shell vs. Hole Tag Invalidation**:
  - Added a transactional `<Suspense>` effect frame stack (`pushPprSuspenseEffects`, `popPprSuspenseEffects`, and `deferPprSuspenseEffect` in `dinou/core/ppr-context.js`, `dinou/core/render-jsx-to-client-jsx.js`, and `dinou/core/cache-slot.js`) so `<DinouCacheSlot>` boundaries evaluated inside a `<Suspense>` boundary prior to a sibling's dynamic `PprBailoutError` discard uncommitted storage writes and `slotTags` registrations when the enclosing `<Suspense>` boundary bails out into a dynamic PPR hole.
  - Prevented build-time slot cache poisoning (`dinou/core/cache-slot.js`) when dynamic request properties (`cookies`, `headers`, `query`) are read directly inside a `<DinouCacheSlot>` wrapped in `<Suspense>`, bypassing non-static-shell disk cache entries during PPR shell builds and ensuring `dinou.ppr.postpone` / `react.postpone` signals clean up `inflightSlotRenders`, skip build-time persistence, and bubble up to register the enclosing `<Suspense>` as a runtime PPR hole.
  - Prevented double `<Suspense>` traversal and `ppr-hole-N` index drift when `<DinouCacheSlot>` wraps static `<Suspense>` boundaries by marking `<DinouCacheSlotBoundary>` elements with `__clientJsxAlreadyRendered: true` via `Object.defineProperties` (`dinou/core/cache-slot.js` and `dinou/core/render-jsx-to-client-jsx.js`) while preserving React 19 non-enumerable development descriptors (`_debugStack`, `_debugTask`, `_debugInfo`).
  - Differentiated static-shell slots (`inStaticShell: true`) from dynamic-hole slots (`inStaticShell: false`) during `revalidateTag(tag)` and `{ fresh: true }` refreshes (`dinou/core/cache-slot.js`, `dinou/core/cache-revalidate.js`, and `dinou/core/handler.js`): invalidating a slot inside a dynamic PPR hole evicts only `slots/<slotId>` while keeping `shell.html` intact (`0ms TTFB` preserved), whereas invalidating or force-refreshing a slot in the static shell persists the updated `slots/<slotId>/slot.json`, releases `inflightSlotRenders` first to prevent self-await promise deadlocks, and non-destructively re-composes `page.rsc`, `shell.rsc`, `shell.html`, and `index.html` in place via `revalidatePage(..., { onlyRefreshSlots: true })` or `revalidateLayout(...)` while preserving `metadata.json` (`slotTags`, `ppr`, `holes`) and without re-executing `page.tsx` or `layout.tsx`.
  - Extended cold-start nested slot discovery (`discoverFromRegisteredSlots`) to `refreshNestedSlotsInTree` and added `inflightSlotRenders` concurrency deduplication plus query-keyed burst coalescing (`recentFreshSlotRenders` in `dinou/core/cache-slot.js` and monotonic `?t=${Date.now()}-${slotSeq}` in `dinou/core/client.jsx` / `dinou/core/client-webpack.jsx`) so concurrent `/____rsc_slot____/:id?fresh=1` stampedes against slots inside PPR routes share a single render across Node, Deno, and Cloudflare Workers.
- **Horizontal Segmentation (`layout.rsc` + `page.rsc`), Pairwise & Triple Synergy with PPR and Vertical Slots, Lazy `index.html` / `shell.html` Re-Composition, Surgical & Clock-TTL Revalidation, Hybrid Static/Dynamic Bailout Recovery, `no_layout` / `reset_layout` Hydration, and Dynamic Layout Validation**:
  - Implemented lazy `index.html`, `shell.html`, and nested `layout.rsc` re-composition across both Static and PPR routes (`getActiveLayoutChain` in `dinou/core/layout-functions.js` and `dinou/core/handler.js`, preserving runtime `DenoKVStorage` `generatedAt` timestamps over build-time `.dinou/dist2` metadata): whenever a cached static or PPR page is requested (with or without query parameters) whose active layout chain (`layout.metadata.json`) has a `generatedAt` timestamp newer than the page's `metadata.json`, Dinou automatically propagates ancestor layout updates to nested leaf `layout.rsc` payloads and re-composes `index.html` (and `shell.html` for PPR routes before `handlePprResume` streams dynamic holes) on the fly by streaming the fresh `layout.rsc` together with the existing `page.rsc` or `shell.rsc` (`renderHtmlStream(layoutRsc, { pageRscStream })`). This guarantees zero React hydration mismatch on hard reloads (`F5`) after `revalidateLayout`, `revalidateTag(layoutTag)`, or layout clock-TTL expiration in `O(1)` without re-executing `page.tsx` or `page_functions.ts` or destroying child `page.rsc` / `shell.rsc` state.
  - Decoupled layout and page ISR lifecycles across both Static (`ppr = false`) and PPR (`ppr = true`) routes (`dinou/core/cache-revalidate.js`, `dinou/core/ppr-runtime.js`, `dinou/core/layout-functions.js`, `dinou/core/generate-static.js`, and `dinou/core/handler.js`):
    - On PPR routes, `revalidatePage` calls `regeneratePprShell(..., { skipLayoutPersistence: true })` so `shell.layout.json` and `layout.rsc` are never overwritten during page revalidation, re-composing `shell.rsc` and `shell.html` from the existing cached `layout.rsc` without re-executing `layout.tsx` or `layout_functions.ts`. Conversely, `revalidateLayout` updates only `shell.layout.json` and `layout.rsc`, deferring child `shell.html` assembly to lazy re-composition on the next visit without re-executing child `page.tsx` or `page_functions.ts`.
    - Added `hasDynamicLayoutHoles(activeChain)` and persisted `hasDynamicHoles` in `layout.metadata.json` so `handlePprResume` and `/____rsc_page____` (`spliceDynamicHolesIntoShell` with `layoutHoleOffset`) skip layout evaluation entirely (`onlyPage: true`) when layouts have no dynamic `<Suspense>` holes, while dynamically evaluating `/____rsc_layout____` per request (`layoutHasDynamicHoles`) when a layout contains dynamic `<Suspense>` holes so layout holes receive live `req.cookies`, `req.headers`, and `req.query` on soft navigations.
    - Supported independent `revalidate = 0` (`no-store`) and clock-based TTL (`revalidate = N`) in `layout_functions.ts` vs. `page_functions.ts`: persisted `pageRevalidate` and `pageGeneratedAt` in `metadata.json` separately from `combinedRevalidate`, resolved route `layout_functions.ts` (`tags`, `revalidate`, `ppr`) from `index = 0` inside Edge `revalidateLayout` (`dinou/core/cache-revalidate.js`) even when invoked on a cold Edge/Cloudflare KV before any HTTP `GET` request, evaluated per-layout clock TTLs (`entry.revalidate`) along `activeLayoutChain` on both HTML and `/____rsc_layout____` requests (gated behind `!internalBuildId` during initial hydration), and fixed `hasStaticDynamicConfig` scoping on `/____rsc_layout____` for `revalidate = 0` layouts. When a layout's TTL expires or `revalidate = 0`, `activeLayoutChain` regenerates only `layout.rsc` / `shell.layout.json` and lazily recomposes child `index.html` / `shell.html` while preserving long-lived child `page.rsc` / `shell.page.json`; when a page's TTL expires (`isExpired`) or `revalidate = 0` (`isZeroRevalidatePage`), `handler.js` delegates to `revalidatePage(reqPath)` / `regeneratePprShell(..., { skipLayoutPersistence: true })` so cached ancestor `layout.rsc` payloads are reused without re-executing `layout.tsx`.
    - Refined the `_old.rsc` hydration guard (`Number(internalBuildId) < Number(currentGeneratedAt)`) in `dinou/core/handler.js` so `/____rsc_layout____` serves the current `layout.rsc` when a child page or slot revalidates (`T_page > T_layout`) rather than falling back to a stale `layout._old.rsc` from an earlier layout build.
  - Made `revalidatePage` and `revalidateLayout` (`dinou/core/cache-revalidate.js`, `dinou/core/handler.js`, `dinou/core/ppr-runtime.js`, and `dinou/core/cache-slot.js`) surgical (`{ onlyRefreshSlots: true }`) and serialized via an `AsyncLocalStorage`-backed reentrant queue (`enqueueRevalidation`) with a shared monotonic clock (`nextMonotonicGenTime`), and added `spliceDynamicHolesIntoShell` on **both** `/____rsc_page____` (`shell.page.json`) and `/____rsc_layout____` (`shell.layout.json`) for PPR routes so client-side refreshes (`router.refresh()` and `router.refresh({ layout: true })`) and soft navigations preserve the frozen static layout and page shells while splicing only live `<Suspense>` holes. This prevents race conditions during concurrent multi-slot refreshes (such as `refreshSlot("*", { fresh: true })`) where `revalidatePage` and `revalidateLayout` execute simultaneously, ensuring `shell.page.json` and `shell.layout.json` are refreshed and re-composed into `layout.rsc`, `page.rsc`, `shell.rsc`, `shell.html`, and `index.html` in deterministic causal order without re-executing `layout_functions.ts`, `layout.tsx`, `page_functions.ts` (`getProps`), or `page.tsx`.
  - Synchronized hybrid Static-to-Dynamic-to-Static transitions across `dinou/core/handler.js`, `dinou/core/cache-revalidate.js`, and `dinou/core/revalidating.js`: shared the `isDynamic` route state Map via `globalThis[Symbol.for("dinou.isDynamic.map")]`, fixed the argument order passed to `createBailoutProxy(target, label, markRevalDynamic)` inside `revalidatePage` and `revalidateLayout` so reading `ctx.req.cookies` / `headers` / `query` or mutating `ctx.res` during background ISR properly triggers dynamic bailout without overwriting static cache files on disk, and updated Step 4 ISG recovery in `handler.js` to inject `window.__DINOU_BUILD_ID__` and clear normalized route keys in `isDynamic` (or flip `window.__DINOU_USE_STATIC__` to `false` on mid-stream bailout).
  - Separated layout cache tag and slot tag tracking from page cache tag and slot tag tracking (`skipLayoutTags: true` and `runInLayoutSegment` / `runInPageSegment` in `dinou/core/ppr-context.js`, `dinou/core/get-jsx.js`, `dinou/core/render-jsx-to-client-jsx.js`, `dinou/core/cache-slot.js`, `dinou/core/handler.js`, and `dinou/core/layout-functions.js`) so tags returned by `layout_functions.ts` (`getCacheTags`) and layout-level `<DinouCacheSlot>` tags (`_layoutSlotTags`) are recorded exclusively in `layout.metadata.json` while page-level `<DinouCacheSlot>` tags (`_pageSlotTags`) are recorded exclusively in `metadata.json`, and ordered `revalidateTag(tag)` (`dinou/core/cache-revalidate.js`) to evict matching `slots/<id>` entries first, then await `revalidateLayout` for matching layout `tags`/`slotTags`, and finally await `revalidatePage` for matching page `tags`/`slotTags` without deleting `layout.metadata.json` or `metadata.json`.
  - Allowed `/____rsc_layout____` (`isLayoutReq` in `dinou/core/handler.js`) to serve cached `layout.rsc` on URLs with query parameters (including PPR routes where `window.__DINOU_USE_STATIC__` is `false`), while preserving per-request dynamic evaluation for layouts (or parallel `@slots`) that access `req.query`, `req.cookies`, or `req.headers` outside `<Suspense>` by emitting `X-Dinou-Dynamic: true` during SSG and persisting `dynamic: true` in `layout.metadata.json` (`dinou/core/generate-static.js`).
  - Prevented build-time SSG (`dinou/core/generate-static.js` and `dinou/deno/seed-kv.js`) from persisting empty `0-byte` `page.rsc` or `layout.rsc` files when a Server Component or Server Function emits a redirect (`x-rsc-redirect` or `Location` header), and guarded `platformContext.env.ASSETS.fetch` (`dinou/core/handler.js`) against serving empty `.rsc` payloads on Cloudflare Workers so redirect routes dynamically evaluate and emit `x-rsc-redirect` headers across all runtimes.
  - Extended `getDiscoveredLayouts` (`dinou/core/get-file-path-and-dynamic-params.js`) to detect `no_layout()` exports in both `page_functions.*` and `layout_functions.*` and emit `"!" + routePattern` markers into `window.__DINOU_LAYOUTS__`, allowing client-side `getLayoutKey(pathname)` (`dinou/core/client.jsx` and `dinou/core/client-webpack.jsx`) to return `null` on `no_layout` routes and render standalone pages without ancestor layouts.
  - Preserved `document.body.setAttribute("data-hydrated", "true")` synchronously during React's commit phase (`useLayoutEffect` in `Router` and `PageConsumer`) across client-side navigations that replace the root `<html><body>` tree (`reset_layout` and `no_layout` boundaries in `dinou/core/client.jsx`, `dinou/core/client-webpack.jsx`, and `dinou/core/slot.js`).
  - Enforced `validateParams`, `getStaticPaths`, and `allowISG() === false` defined in `layout_functions.ts` across both full-page SSR requests and segmented `/____rsc_layout____` / `/____rsc_page____` endpoints in both production and development modes (`dinou/core/layout-functions.js`, `dinou/core/get-jsx.js`, and `dinou/core/handler.js`), returning HTTP `404` and rendering `not_found.tsx` when dynamic layout parameters are invalid or unlisted.
  - Namespaced internal RSC hydration and refresh query parameters to `____build_id____` and `____v____` (`dinou/core/client.jsx` and `dinou/core/client-webpack.jsx`) and stripped both keys from `queryObj` upon request entry (`dinou/core/handler.js`), preventing collisions when user routes pass `?buildId=...` or `?v=...` query parameters and keeping `req.query` / `getProps({ query })` unpolluted.
  - Registered `dinou/core/slot.js` (`DinouPageSlot` and `DinouCacheSlotBoundary`) in the client manifest across all platform bundlers (`dinou/node/bundle-dual-engine.js`, `dinou/bun/build.js`, `dinou/deno/build.js`, and `dinou/cloudflare/build.js`).
- **Standalone Deno Binary Compilation (`build:deno:compile*`) & Optional `HOST` / `HOSTNAME` Binding**: Added the missing `--unstable-kv` flag to `deno compile` in `dinou/cli.js` so standalone compiled Deno executables have `Deno.openKv()` enabled at runtime matching `start:deno`, and added optional `process.env.HOST` / `process.env.HOSTNAME` (`Deno.env.get`) binding support in `dinou/node/build.js`, `dinou/bun/build.js`, and `dinou/deno/build.js` while preserving default dual-stack (`undefined`) listening when omitted.

### Changed
- **Self-Contained CLI Directory (`dinou/cli.js`)**: Relocated `cli.js` from the package root into the `dinou/` directory (`"bin": { "dinou": "./dinou/cli.js" }`) while keeping `eject.js` at the package root, unifying the CLI location between standard installed mode (`node_modules/dinou/dinou/cli.js`) and ejected mode (`./dinou/cli.js`) and enabling `dinou/cli.js` to resolve `#commander` directly through `dinou/package.json` subpath imports.
- **High-Density AI-Agent-Ready `README.md` Specification**: Replaced the legacy ~10,000-line (465 KB) `README.md` with a compact, single-pass technical reference (~500 lines / ~21 KB) engineered so AI coding agents can read the complete framework architecture, CLI commands, routing & lifecycle contracts, public API exports, Dual-Mode Vendoring (`-u` / `--unvendorized`), and 3-Dimensional Caching invariants (Horizontal Segmentation with `revalidateLayout` and lazy HTML re-composition, Partial Prerendering, `<DinouCacheSlot>` Micro-ISR, and Triple Synergy) in a single tool call, while directing human developers to [dinou.dev](https://dinou.dev) for full tutorials and interactive documentation.

### Deprecated
- **`{ cascade: true }` Option in `revalidatePath` and `revalidateTag`**: Passing a second `options` parameter (`{ cascade?: boolean }`) to `revalidatePath(path, options)` or `revalidateTag(tag, options)` is now deprecated and ignored (logging a runtime deprecation warning in `dinou/core/cache-revalidate.js` and marked `@deprecated` in `dinou/server.d.ts`). Zero hydration mismatch across ancestor and descendant routes is now guaranteed automatically and non-destructively via lazy `index.html` and nested `layout.rsc` re-composition without cascading full page rebuilds.

## [9.0.2] - 2026-10-27

### Performance
- **Direct NODE_OPTIONS Injection in Unvendorized Mode (`-u`)**: Injected `--conditions=unvendorized` directly into `process.env.NODE_OPTIONS` from `dinou/cli.js` when launching child commands. Downstream build scripts and adapters (`ensureVendorMode()`) now detect active unvendorized resolution on their very first boot, completely eliminating intermediate Node.js child process re-spawns and shaving ~700–1000 ms off production builds and dev server cold starts.

## [9.0.1] - 2026-10-27

### Fixed
- **CLI Unvendorized Mode Path Resolution and Command Rewriting (`-u`)**: Fixed an issue in `dinou/cli.js` where running in unvendorized mode (`-u` / `--unvendorized` / `DINOU_UNVENDORIZED=true`) inside directories containing spaces caused the flag to be incorrectly injected within directory paths, resulting in `MODULE_NOT_FOUND` errors. The internal command parser now reliably handles double-quoted paths and compound command chains (`&&`, `||`, `;`), ensuring robust and idempotent `-u` flag placement across all child Node processes.

## [9.0.0] - 2026-10-25

### Added
- **Additive Vendoring System (Zero-Drift & Instant Cold Starts)**: Pre-bundled 36 build-time and runtime utility dependencies directly inside `dinou/compiled/` with native Node.js Subpath Imports (`#...`). Projects boot with zero node_modules traversal overhead while keeping all dependencies declared in `package.json`.
- **Dual-Mode Import Resolution (Vendorized by Default / Unvendorized on Demand)**:
  - **Default Mode**: Resolves `#pkg` directly to `dinou/compiled/<pkg>/index.js` for fast startup and isolated bundling.
  - **Unvendorized Mode (`-u` / `--unvendorized` / `DINOU_UNVENDORIZED=true`)**: Transparent fallback to standard `node_modules/<pkg>` via Node subpath import condition `unvendorized`.
  - Transparent CLI detection via `dinou/core/ensure-vendor-mode.js` across `dinou/node/dev.js`, `dinou/node/build.js`, `dinou/esbuild/build.js`, and `dinou/adapters/node.js`.
- **Ejected CLI Runner (`dinou/cli.js`)**: Updated `dinou eject` to generate streamlined npm scripts delegating directly to `dinou/cli.js` (e.g. `node dinou/cli.js dev`). This eliminates the limitations of chaining commands with `&&` in `npm run`, properly preserves argument forwarding across all commands (such as passing `-u` or custom flags), and automatically extends the execution PATH so ejected applications run seamlessly without global binary dependencies.
- **Unified Multi-Entrypoint Shared Chunks**: Multi-entrypoint vendors (such as `mini-css-extract-plugin` and `mini-css-extract-plugin/loader`) use code-splitting chunks (`splitting: true`) to share symbols, avoiding plugin configuration mismatch in Webpack pipelines.
- **Cross-Bundler Parity**: Exact dual-mode behavior tested and verified across **esbuild**, **Rollup**, and **Webpack** both in standard and ejected modes.

## [8.1.2] - 2026-10-25

### Fixed
- **HMR & Fast Refresh Granular Module Resolution (`rollup-plugin-esm-hmr` & client runtime)**: Resolved an issue where saving components with common names or navigating code-split routes caused unintended full-browser reloads (`location.reload()`) and wiped React state in active tabs.
  - **Exact Relative Chunk Matching (Rollup)**: Removed loose substring matching on `path.basename()` (`.includes(baseName)`) in `rollup-plugin-esm-hmr.js`, which falsely flagged unrelated chunks sharing similar names (e.g. multiple `counter.tsx`, `button.tsx`, or `card.tsx` across different directories) as modified. Replaced with exact normalized relative path matching (`chunkFileNameLower === relClean`).
  - **Code-Splitting Safe Client Runtime (`esm-hmr/client.js`)**: Updated `applyUpdate()` across both Rollup and esbuild client runtimes to gracefully ignore (`return true`) update events for chunks that are not currently mounted in the active page (`!state`). Full page reload is now strictly reserved for active modules that explicitly decline HMR (`state.isDeclined`), ensuring open tabs, multi-page workflows, and independent route states remain intact.

## [8.1.1] - 2026-10-24

### Fixed
- **HMR & Fast Refresh Full-Reload Regression (`dev.js`)**: Fixed an issue where minor keystrokes or text edits inside documentation and markdown pages falsely triggered a full browser reload (`location.reload()`) instead of Fast Refresh or an in-place RSC stream update.
  - Replaced naive substring matching (`content.includes("use server")`) with AST-level Server Function action detection (`transformServerFunctions`) during development watcher cycles, preventing pages containing mentions or snippets of `"use server"` from being erroneously treated as server action modules.
  - Dynamically synchronized `knownServerFiles` and `knownClientFiles` tracking sets after each rebuild batch to prevent perpetual `serverDirectiveChanged` false positives on subsequent keystrokes.
  - Excluded pure Server Component route entries (`page.tsx`, `layout.tsx` without `"use client"`) from the client bundler queue (`!isPageRoute`), reducing incremental rebuild times to ~140ms and reliably streaming targeted `{ type: "rsc-update" }` events without reloading the page.

## [8.1.0] - 2026-10-23

### Added
- **Function-Level Server Functions & Closure Hoisting**: Added full support for `"use server"` directives inside function bodies—both in utility files and inline closures within Server Components. Dinou's compiler statically detects captured lexical variables, hoists nested functions to top-level module exports (`$$dinou_action_<name>_<id>`), and binds closures (`.bind(null, ...args)`) for native React 19 RSC streaming and RPC execution via `POST /____server_function____`.
- **Server Functions as Props**: Server Components can now pass Server Functions (including inline closures and bound instances) directly as props to Client Components. They can be seamlessly invoked inside client event handlers, transitions (`useTransition`), form actions (`<form action={...}>`), or React 19's `useActionState`.
- **Auto-Exporting of Top-Level Actions**: Top-level functions declaring `"use server"` without an explicit `export` are automatically exported at compile time, allowing the HTTP RPC dispatcher to dynamically load them via ESM `import()` without extra boilerplate.
- **Granular Manifest Tree-Shaking**: Updated `server-functions-manifest.json` generation across all bundlers (Rollup, Webpack, esbuild) and runtimes. In files containing function-level actions, only functions with `"use server"` in their body are registered in the manifest, keeping private utilities hidden. Unreferenced ("orphan") action modules are completely excluded.
- **Discovery of Function-Level Actions in Bundler Crawlers**: Enhanced entry crawlers across esbuild, Webpack, and Rollup to detect pages, layouts, and component or utility files containing body-level `"use server"` (`hasServerFunctions`). These files are now properly registered in `serverFiles` for manifest generation while continuing recursive traversal of their styles and static assets.

### Changed
- **Deterministic Builds via Pinned Dependencies**: Pinned all internal compiler and build toolchain dependencies (`esbuild`, `webpack`, `rollup`, `@swc/core`, `@babel/*`, PostCSS, and loaders) to exact versions (removing `^` carets). This guarantees 100% reproducible, zero-drift builds across all environments and prevents upstream regressions from affecting end-user applications.
- **Aligned React 19 RSC Protocol & Peer Dependencies**: Synchronized `@roggc/react-server-dom-esm` and `react-server-dom-webpack` to `19.3.1`. Updated Dinou's `peerDependencies` to `react >=19.3.1` and `react-dom >=19.3.1` for complete protocol parity across all bundlers without peer dependency warnings.

### Fixed
- **Fail-Fast Validation for Server Functions Proxy**: Added build-time checks across esbuild, Rollup, and Webpack to immediately fail with a descriptive error if `serverFunctionProxy.js` is missing from the client manifest in production, preventing silent 404 dynamic import failures in the browser.
- **esbuild Manifest Propagation Fix**: Ensured the client manifest reference is correctly passed by reference to `serverFunctionsPlugin` in production builds, resolving dynamic import 404s when invoking Server Functions from Client Components.
- **Webpack 5.112+ Internal Path Compatibility Shim**: Added a module resolution shim (`patch-webpack-internals.js`) in `webpack.config.js` to redirect legacy `react-server-dom-webpack` internal paths to Webpack 5.112+'s reorganized directory structure.
- **DRY Single-Source Definition of `defineConfig`**: Refactored `dinou/index.js` to re-export `defineConfig` directly from `./core/config.js` instead of maintaining duplicate definitions.

## [8.0.3] - 2026-10-22

### Fixed
- **Type-Safe Route Pattern Autocompletion in Segment Configs**: Added generic constraints (`TRouteOrParams extends DinouRoutePattern | object = any`) to `PageFunctions` and `LayoutFunctions`, as well as `RouteParams<T extends DinouRoutePattern = DinouRoutePattern>`. This enables immediate IDE / TypeScript autocompletion for known project routes when typing string literals (`PageFunctions<"..."`) and strict compile-time validation against typos in route strings, while preserving full backward compatibility for parameter dictionaries and custom interfaces (`PageFunctions<CustomParams>`).
- **Direct `defineConfig` Import from `"dinou"`**: Added an esbuild resolution plugin (`dinou-config-alias`) in `load-dinou-config.js` to alias exact `"dinou"` specifier imports to `"dinou/config"` when bundling configuration files (`dinou.config.ts`, `dinou.config.mjs`, etc.). This allows importing `defineConfig` directly from `"dinou"` (`import { defineConfig } from "dinou"`) without triggering Node.js native ESM `ERR_UNKNOWN_FILE_EXTENSION` errors from unbundled React JSX components (`redirect.jsx`, `link.jsx`) in `dinou/index.js`, while keeping all other subpath imports (`dinou/adapters/*`, `dinou/config`) intact.

## [8.0.2] - 2026-10-22

### Fixed
- **Type-Safe Routing Ambient Inclusions**: Dinou no longer modifies `dinou-env.d.ts` at runtime. Ambient route declarations (`.dinou/types/routes.d.ts`) are now consumed directly via `tsconfig.json` (`".dinou/types/**/*.d.ts"`), preventing `TS6053` errors on fresh clones and keeping Git working trees clean.

## [8.0.1] - 2026-10-21

### Fixed
- **CLI & Adapter Build Banners**: Normalized terminal ready banner and build logs across all adapters (Node.js, Cloudflare, Deno, Bun, Static Export) removing hardcoded legacy version labels.

## [8.0.0] - 2026-10-20

### ⚠️ Breaking Changes
> **Note**: For standard Dinou applications using `import` and the Dinou CLI, upgrading from v7 to v8 is completely seamless and requires zero code changes.

- **Native ESM Framework (`"type": "module"`)**: Dinou is now distributed and executed strictly as native ECMAScript Modules (ESM). `package.json` includes `"type": "module"`, allowing all framework and consumer code to run with modern ESM semantics.
- **Source & Extension Unification (`.mjs` -> `.js`)**: Eliminated the hybrid extension fragmentation (`.mjs` vs `.js`). All framework build scripts, CLI commands, adapters, and entrypoints now use standard `.js` extension across the codebase.
- **Package Exports Modernization**: Dropped legacy CommonJS conditional exports (`"require"`) and `.mjs` targets in `package.json`. All public subpaths (`dinou`, `dinou/server`, `dinou/config`, `dinou/adapters/*`) resolve directly to standard ESM `.js` targets.
- **Universal Edge Renderer Singleton (`__DINOU_EDGE_RENDERER__`)**: Replaced dynamic module resolution in dual-bundle compilation with an explicit global singleton (`globalThis.__DINOU_EDGE_RENDERER__`), guaranteeing that React 19 RSC streaming and Server Function serialization share identical context across runtime engines.

### Changed
- **CLI & Eject Architecture Modernization**:
  - Migrated `cli.js` to native ESM imports using Commander.
  - Refactored `eject.js` into an idiomatic ESM module exporting `eject()`.
  - Updated all ejected `npm run` scripts to reference standard `.js` entry points across all adapters and bundlers (Esbuild, Rollup, Webpack).
- **Core Cleanup & Canonical Config Resolution**:
  - Removed obsolete root wrapper `dinou/config.js`, establishing `dinou/core/config.js` as the sole canonical implementation for the `"dinou/config"` export.
  - Formatted and aligned root `package.json` fields according to modern ecosystem conventions.

### Fixed
- **Layout `allowISG: false` False 404 on Static Routes**: Fixed a bug in `handler.js` where setting `allowISG: false` in layout functions caused production requests to prematurely return an unconditional `404 Not Found`. The handler now properly verifies parameter matches against `staticPathsSet` (`getStaticPaths`) and confirms whether pre-rendered layout artifacts (`layout.rsc`) exist on disk before blocking unauthorized dynamic paths.

## [7.3.0]

### Added
- **Universal Setup Files & Environment Polyfills**:
  - Early-stage execution guarantee: Setup scripts are injected at Line 1 of all compilation bundles before any module imports or engine code run, enabling browser/canvas polyfills (`DOMMatrix`, `ImageData`, `Path2D`) and APM/telemetry agents without ejecting.
  - Unified configuration hierarchy: `plugin.setupFiles` (plugins run first) -> explicit `setupFiles: [...]` in `dinou.config.*` (strict source of truth; replaces convention) -> zero-config root convention `./dinou.setup.(mjs|js|ts)`.
  - Comprehensive multi-platform support: Injected uniformly across Node.js (`Pass A`, `Pass B`, `Pass C`), Bun native AOT, Cloudflare Workers, Deno / Deno Deploy, Static Site Generation (SSG), and Hot-Reload Dev Server.
  - Added TypeScript definitions for `setupFiles?: string[]` in both `DinouConfig` and `DinouPlugin`.

### Fixed
- **Bun Standalone Compilation Port Collision (`EADDRINUSE`)**:
  - Resolved port binding conflict when compiling the Node.js orchestrator into a standalone executable using `bun build --compile`.
  - Separated exports in `.dinou/node/server.mjs`: `fetch` is now exported exclusively as a named export (`export { fetch }`), while `export default` exposes `{ port, startServer }`, preventing Bun's runtime from launching a duplicate background `Bun.serve` instance over Node's `http.createServer()`.
  - Robust `isMain` execution detection supporting both Node.js (`process.argv[1]`) and compiled Bun binaries (`import.meta.main`).

## [7.2.0]

### Added
- **Plugin Hook `configureServer`**: Attach WebSockets (Socket.IO, WS) and native Node.js HTTP middlewares before server startup without ejecting.
- **Node Standalone Binary Compilation**: Added `dinou build:node:compile` and cross-compilation matrix (`:linux`, `:linux_arm`, `:mac`, `:win`).
- **Client-Side Server Function Auth Hooks**: Added `window.__DINOU_SERVER_FUNCTION_HEADERS__` and `window.__DINOU_GET_AUTH_TOKEN__` to inject dynamic JWT/Bearer authorization headers into `"use server"` calls.
- **Esbuild-Powered Config Loader**: `dinou.config.*` is automatically pre-bundled with Esbuild, enabling native `tsconfig.json` path aliases (`@/*`) and TypeScript configuration files out of the box.

### Changed
- Removed legacy `babel-esm-loader.js` and cleaned up residual loader registrations.

## [7.1.0] - 2026-10-16

### Added
- **Default export configuration object**: Added support for defining route lifecycle hooks and settings (`getProps`, `revalidate`, `ppr`, `getStaticPaths`, `allowISG`, `validateParams`, `getCacheTags`) as a consolidated configuration object exported via `export default` in both `page_functions` and `layout_functions` (ideal for strongly typed contracts like `PageFunctions<TParams, TProps>` or `LayoutFunctions`), while maintaining full backward compatibility with individual named exports.
- **Static PPR analysis for default exports**: Extended AST analysis (SWC & Babel fallbacks) and runtime resolution to detect and extract `ppr` configurations declared within default-exported objects and variable bindings.

### Removed
- **Dead rendering utility**: Removed unused legacy synchronous `renderJSXToClientJSX` helper.

### Fixed
- **Documentation anchors**: Fixed broken anchor links and table of contents (TOC) navigation in `README.md`.

## [7.0.0] - 2026-10-12

### ⚠️ Breaking Changes
- **`getProps` Contract: Direct Props Object Return**: Eliminated the legacy artificial wrapper `{ page: { ... } }`. In v7, `getProps` directly returns the object that is injected as top-level props into the route component in `page.tsx` (e.g. `{ user, title }`).
- **`revalidate` Time Unit: Strictly Seconds (`s`)**: Cache revalidation intervals are now strictly specified in seconds. Legacy millisecond values (e.g. `60000ms`) must be divided by 1000 (e.g. `60s`).
- **Elimination of `export const dynamic` (Single Source of Truth via `revalidate`)**: The `dynamic` export keyword has been completely removed. `revalidate` is now the sole authority for route execution and caching: `revalidate = 0` (Dynamic SSR), `revalidate >= 1` (ISR with background re-generation), and `revalidate = false` (Static SSG).
- **Ahead-of-Time (AOT) SSG Compilation vs. Server Startup**: Static site generation no longer executes at server boot time during `dinou start`. All static HTML and RSC Flight payloads are now pre-rendered strictly during the build step (`dinou build`), enabling instant (0ms) production server startup. CI/CD pipelines must provide CMS and database credentials during `npm run build`.
- **Layout Lifecycle & State Preservation (Horizontal Segmentation)**: Layout components (`layout.tsx`) never unmount or re-execute when navigating between sibling routes. Client state (form inputs, video playback, active tabs) is 100% preserved across navigations.
- **Express Decoupling & Modern Plugin System**: Removed Express dependency and the `onServerInit(app)` plugin hook. Custom plugins now hook into standard Web APIs via `onRequest(request, context)` and `onResponse(response, context)` defined in `dinou.config.mjs`.
- **Development Assets 100% In-Memory by Default**: `dinou dev` operates entirely in RAM via `globalThis.__DINOU_MEM_FILES__` (<0.5ms response times) to eliminate disk I/O bottlenecks and Windows antivirus penalties. The `.dinou/public/` folder is no longer generated on disk during development (use `DINOU_WRITE_TO_DISK=true` to force physical disk writes).

### Added
- **Layered Segmentation Architecture**:
  * **Horizontal Segmentation (`layout_functions.{ts,js}`)**: Decoupled layout server lifecycles, enabling independent data loading (`getProps`), independent layout ISR caching (`revalidate`), independent Partial Prerendering (`ppr`), and route parameter validation (`validateParams`) without touching child pages.
  * **Vertical Segmentation (`<DinouCacheSlot>` & `refreshSlot`)**: Sub-page micro-ISR component allowing individual UI sub-trees to be cached and revalidated independently without re-evaluating parent layouts or siblings, coupled with the client-side `refreshSlot(slotId)` hook for live, in-place widget updates with zero page reload.
- **Partial Prerendering (PPR) Engine**:
  * First-class PPR support enabled globally (`ppr: true` in `dinou.config.mjs`), per layout (`layout_functions.ts`), or per page (`page_functions.ts`).
  * Emits an instant static shell prelude at 0ms TTFB while concurrently streaming dynamic holes via React 19 `<Suspense>`.
- **Zero-Runtime Type-Safe Routing**:
  * Inferred compile-time type safety derived directly from folder bracket naming conventions (`[slug]`, `[...slug]`, `[[...slug]]`, `(auth)`).
  * Auto-generated type exports from `"dinou"`: `DinouRoute`, `DinouRoutePattern`, `PageProps<T>`, `LayoutProps<T>`, `ErrorProps<T>`, and `RouteParams<T>`.
- **Surgical Page Cache Invalidation (`revalidatePage`)**:
  * Added `revalidatePage(pattern)` to `"dinou/server"` to purge all compiled cache entries for a parameterized route pattern across the cluster in a single invocation.
- **Centralized ESM Configuration (`dinou.config.mjs`) & `defineConfig`**:
  * Introduced native ESM configuration file with type-safe `defineConfig` helper for configuring plugins, storage adapters, `reactStrictMode`, and `ppr`.
- **Native Path Aliasing (`tsconfig.json`)**:
  * Zero-config path alias resolution (`@/*`, `~/*`) across TypeScript, JSX, CSS modules (`@import "@/styles/..."`), and static assets across all supported bundlers (Esbuild, Rollup, Webpack).
- **React StrictMode by Default in Development**:
  * Client components are automatically wrapped in `<React.StrictMode>` during development to surface side-effects early (configurable via `dinou.config.mjs`).
- **Private Folders with Underscore Prefix (`_folder`)**:
  * Directories prefixed with an underscore (e.g. `_components/`, `_archived/`) are strictly quarantined and ignored by the route scanner.
- **Universal Web Standards Request Handler (`dinou/core/handler.js`)**: Completely decoupled Dinou's core runtime from Node.js and Express. SSR, RSC streaming, Server Functions, routing, and static asset serving are now driven by a pure `(Request) => Promise<Response>` handler built exclusively on Web Standards (`Request`, `Response`, `ReadableStream`, `Headers`):
  * **Double Crash & Error Boundary Resilience**: Captures secondary failures if a custom application error boundary component crashes during rendering, gracefully returning a reliable fallback HTML document without bringing down the server.
  * **Streaming Header & Cookie Mutation**: Supports dynamic response header and cookie updates (`ctx.res.setHeader`, `ctx.res.cookie`) directly from async Server Components and Server Functions during streaming SSR renders.
- **Edge & Node Dual-Bundle Architecture (3-Pass Compilation)**: Solved the fundamental module condition collision between RSC (`react-server`) and SSR (`browser`) across Edge runtimes and Node.js:
  * **Pass A (RSC Engine)**: Bundles Server Components and Server Functions under `conditions: ["react-server"]` using `@roggc/react-server-dom-esm` with client references converted to proxies.
  * **Pass B (SSR Engine)**: Bundles client components and `react-dom/server.edge` under `conditions: ["browser"]` for true, native HTML streaming.
  * **Pass C (Worker & Server Orchestrator)**: Merges both isolated engines into self-contained, high-performance runtime entrypoints (`.dinou/cloudflare/worker.js`, `.dinou/deno/main.js`, `.dinou/bun/server.js`, and `.dinou/node/server.mjs`).
- **0-Fork Single-Process Development Server (`dinou/node/dev.mjs`)**: Replaced multi-process orchestration (`concurrently`) with a unified, zero-fork single-process dev architecture:
  * Eliminates port race conditions, zombie child processes, and out-of-order interleaved terminal logs.
  * Direct in-memory coordination between the bundler dev watcher (Esbuild, Rollup, Webpack) and the Dinou HTTP development server.
- **Interactive Terminal Activity Dashboard & Braille Spinner (`dinou/node/terminal-status.mjs`)**:
  * Zero-dependency, CI/TTY-safe interactive status indicator utilizing smooth Unicode Braille spinner animations (`⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏`).
  * Non-intrusive stream interception on `process.stdout` and `process.stderr` that pins the live activity indicator to the bottom line without flickering or breaking compiler output.
  * Automatic graceful fallback in non-interactive CI environments (e.g. GitHub Actions) to suppress ANSI control codes.
  * Stylized, branded startup and ready banners displaying local URLs, active bundler, and initialization timings.
- **Standalone Native Binary Compilation (Zero-Node Deployment)**:
  * **Deno Standalone Executables**: Multi-target compilation via `deno compile` with automated cross-compilation scripts for Linux (`x86_64`, `arm64`), macOS (`Apple Silicon`), and Windows (`x64`).
  * **Bun Standalone Executables**: Multi-target binary compilation via `bun build --compile` generating self-contained single-file servers for Linux (`x64`, `arm64`), macOS (`arm64`), and Windows (`x64`).
  * **Self-Contained Binaries**: Binaries are emitted to `dist/`, running natively with zero runtime dependencies (no Node.js, Deno, or Bun required on target production hosts or minimal container images).
- **Pure Bun Pipeline (`build:bun:pure`)**:
  * End-to-end Bun-native build workflow executing Esbuild and the Bun bundler entirely within Bun (`bun dinou/esbuild/build.mjs && bun ./dinou/bun/build.mjs`), bypassing Node.js completely for pure Bun CI/CD environments.
- **Configurable Bun Socket Timeout & Streaming Protection (`IDLE_TIMEOUT`)**:
  * Integrated a configurable `idleTimeout` (defaulting to a safe `120` seconds, customizable via `process.env.IDLE_TIMEOUT`) in both the native Bun adapter (`dinou/adapters/bun.js`) and generated Bun standalone orchestrators (`dinou/bun/build.mjs`).
  * Prevents Bun's aggressive default 10-second TCP socket idle cutoff (`net::ERR_EMPTY_RESPONSE`) during prolonged streaming SSR, async Server Functions, and AI LLM response pipelines.
- **Native React 19 HTML Streaming on Edge**: Full support for progressive HTML streaming on Cloudflare Workers, Deno, and Bun via official React 19 `renderToReadableStream` from `react-dom/server.edge`. Suspense boundaries and asynchronous Server Components now stream progressive HTML directly to the browser with instant shell flushing.
- **Semantic Client Module Validation (`isSupportedClientModule`)**: Content-based module validator in Cloudflare and Deno builders:
  * Guarantees zero false positives for user components located in `src/` (e.g. `src/system/`, `src/design-system/`).
  * Semantically detects and rejects incompatible non-ESM distribution formats in `node_modules` (such as SystemJS `System.register` or UMD wrapper bundles lacking ESM exports).
- **Build-Time Static Generation (`dinou/core/run-ssg.js`)**: Static pre-rendering (SSG) now executes directly during the build step (`build:esbuild`, `build:rollup`, `build:webpack`) rather than at server startup. All static HTML and RSC payload files are generated into `.dinou/dist2` at compile time, eliminating server cold-start latency and enabling instant static exports.
- **Zero-Dependency Native Runtime Adapters**:
  * **Bun Adapter (`dinou/adapters/bun.js`)**: High-performance Bun native server utilizing zero-copy `Bun.file()` for `.dinou/dist3` production asset serving, configurable `IDLE_TIMEOUT`, and streaming RSC/SSR.
  * **Deno & Deno Deploy Adapter (`dinou/adapters/deno.js`)**: Native `Deno.serve()` integration with built-in asset streaming and automatic edge detection.
  * **Cloudflare Workers Adapter (`dinou/adapters/cloudflare.js`)**: Full edge worker integration supporting Workerd runtime, asset fetching, ISR via Cloudflare KV, and streaming responses.
  * **Netlify Functions Adapter (`dinou/adapters/netlify.js`)**: Standard edge/serverless handler ready for Netlify Functions v2 with `preferStatic: true`.
  * **Node / Express Adapter (`dinou/core/http-adapter.js`)**: Bi-directional bridge converting Node.js `IncomingMessage` and `ServerResponse` to Web Standard `Request` and `Response`, making the server a lightweight consumer of `handleRequest`.
- **Pluggable Storage System & Edge ISR (`dinou/core/storage-adapter.js`)**: Decoupled SSG/ISR cache and revalidation from Node's filesystem.
  * Added `StorageAdapter` interface with `FSStorageAdapter` (Node/Bun filesystem), `MemoryStorageAdapter` (ephemeral/testing), `DenoKVStorage` (distributed Edge KV), and `CloudflareKVStorage` (Cloudflare KV via `env.DINOU_CACHE`).
  * **Distributed Edge ISR on Deno Deploy & Cloudflare**: Automated fallback to global edge key-value databases, enabling Incremental Static Regeneration without a persistent local disk.
  * Exported `setStorageAdapter`, `getStorageAdapter`, `StorageAdapter`, `FSStorageAdapter`, `MemoryStorageAdapter`, `DenoKVStorage`, and `CloudflareKVStorage` from `dinou/server`.
- **Edge Linkers & Static Route Generators**:
  * **Cloudflare Linker (`dinou/cloudflare/build.mjs`)**: Prepares and bundles self-contained worker entries using multi-bundler manifest inlining and Esbuild edge bundling.
  * **Deno Linker (`dinou/deno/build.mjs`)**: Bundles complete edge applications targeting Deno Deploy (`deployctl`).
  * **Multi-Bundler Manifest Support**: Edge linkers automatically detect client and server function manifests whether generated by Esbuild, Rollup, or Webpack, with cross-platform path normalization for Windows and Linux.
- **Standalone Static Export (`dinou/core/export-static.mjs`)**: Added `export-static` command (with Esbuild, Rollup, and Webpack variants) to export pre-rendered static HTML and assets into an `out/` directory, ready for zero-configuration deployment to Surge.sh, GitHub Pages, Cloudflare Pages, Netlify, and S3.
- **CLI & Eject Commands**:
  * Added CLI and `package.json` scripts: `start:bun`, `start:deno`, `build:cloudflare`, `build:deno`, `build:bun:compile`, `build:deno:compile`, `export-static` (and bundler-specific sub-commands for Rollup and Webpack).
  * Synchronized `dinou eject` to copy all v7 architecture files (`terminal-status.mjs`, standalone compile scripts, dual-bundle linkers, and adapters) to ejected user repositories.
  * Added `./adapters/bun`, `./adapters/deno`, `./adapters/cloudflare`, and `./adapters/netlify` subpath exports in root `package.json`.

### Changed
- **Peer Dependencies Updated to React 19.3.0+**: Dinou v7 now requires `react >= 19.3.0` and `react-dom >= 19.3.0` for full React Server Components, Server Functions (`"use server"`), and `react-dom/server.edge` streaming.
- **Hardened State-Preserving React Fast Refresh (Esbuild & Rollup)**:
  * **Rollup**: Decoupled development builds from React Compiler to eliminate AST collisions and component state loss, stabilizing component identities and hook signatures via `reactRefreshScopedId` for instantaneous, resilient hot reloading.
  * **Esbuild**: Hardened and optimized the Rust-powered `@swc/core` Fast Refresh transform, restricting it strictly to user components and entrypoints to prevent initialization conflicts on client runtime roots.
- **Webpack 5 Flexible Module Resolution (`javascript/auto`)**: Added `type: "javascript/auto"` on JS/TS loader rules in `dinou/webpack/webpack.config.js`, ensuring flawless compilation of Server Functions (`actions.js`) and ESM/CJS interop regardless of whether `"type": "module"` is configured in `package.json`.
- **Webpack 5 Dev Server & Safe Context Resolution**: Hardened `AsyncLocalStorage` and request context resolution in `dinou/core/request-context.js` and loader registries to compile cleanly under Webpack 5 without triggering strict Node built-in module bundling errors.
- **Build-Time SSG Pipeline**: Production builds across Esbuild, Rollup, and Webpack now automatically invoke the SSG pipeline at build completion, ensuring all edge runtimes and static hosts have pre-rendered assets immediately available upon deployment.
- **Renamed Asset Convention from `favicons/` to `public/`**:
  * Semantically renamed the root asset directory convention to `public/` across all bundlers (Esbuild, Rollup, Webpack).
  * Any files placed in `public/` (e.g. `robots.txt`, `sitemap.xml`, `favicon.ico`, static images) are served directly at the root (`/`) and copied to production builds.
  * Seamless backward compatibility preserved for existing projects still using `favicons/`.
- **Streamlined Production Start**: Production execution scripts (`start`, `start:esbuild`, `start:rollup`) now run directly via `cross-env NODE_ENV=production node ./dinou/core/server.js` without requiring manual `--conditions react-server` or `--import` loader flags.

## [6.1.1] - 2026-09-19

### Bug Fixes
- **TypeScript exports**: Added missing `"types"` condition to the root `"."` export mapping in `package.json`, fixing module declaration resolution under `"moduleResolution": "bundler"`.

## [6.1.0] - 2026-09-18

### Added
- **Ambient types export**: Added `./env` subpath export for built-in asset and CSS module type declarations via `dinou-env.d.ts` (supporting both Server and Client Components without cluttering `src/`).

### Fixed
- **Package exports**: Added missing `./server` export mapping in root `package.json`, fixing TypeScript resolution for non-ejected installations.

## [6.0.1] - 2026-09-14

### Fixed
- **ESM Loader Module Harmonization (Dev Mode)**: Fixed module instance bifurcation in Node.js by synchronizing URL resolution between static ESM imports (`babel-esm-loader.js`) and dynamic Server Function imports (`import-module.js`) using consistent `?mtime` cache-busting. Server Functions and SSR now share the exact same in-memory module instances and state across page reloads without requiring `globalThis` or disk persistence.
- **Loader Query Param Sanitization**: Stripped query parameters from `parentURL` and `specifier` in `get-abs-path-with-ext.js` to prevent path resolution and extension lookup issues on relative imports decorated with `?mtime`.
- **Asset & CSS Loader Safe Resolution**: Ensured asset and CSS hooks in `babel-esm-loader.js` strip query strings before calling `fileURLToPath` and Node's `require()`.
- **Loader Return URL Consistency**: Updated `babel-esm-loader.js` `load` hooks to preserve the incoming resolved module URL across all code paths, avoiding cache mismatches in Node's module graph.

## [6.0.0] - 2026-09-13

### Changed
- **Unified `.dinou/` Directory for Build Artifacts & Manifests**: Relocated all compiler outputs, client/server bundles, and runtime metadata under a single `.dinou/` root directory instead of generating multiple folders across the project root.
  * **Build Artifacts Relocation**:
    - `dist2` (pre-rendered static & ISR HTML/RSC payloads) moved to `.dinou/dist2`
    - `dist3` (production bundles & manifests) moved to `.dinou/dist3`
    - `public` (development client bundles & compiled CSS) moved to `.dinou/public`
    - `react_client_manifest` moved to `.dinou/react_client_manifest`
    - `server_functions_manifest` moved to `.dinou/server_functions_manifest`
  * **Clean Project Root & Improved DX**: Eliminates root-level clutter, giving projects a clean, minimal, and production-ready structure.
  * **User Assets Isolation**: The root `public/` directory is now exclusively reserved for user static assets (images, favicons, fonts), preventing compiler bundles from mixing with user files.
  * **Simplified `.gitignore`**: Projects now only require a single `.dinou/` entry in `.gitignore` instead of managing multiple build directory rules.
  * **Effortless Cache Invalidation**: Wiping the compilation cache or performing clean builds can now be done in one command by deleting `.dinou/` (`rm -rf .dinou`).
  * **Full Multi-Bundler Alignment**: Updated all Rollup, Esbuild, and Webpack compiler runners and custom manifest plugins to resolve into `.dinou/` seamlessly across development and production environments.

## [5.2.0] - 2026-07-13

### Added
- **Lightweight Plugin System & `dinou.config.js` support**: Added native support for extending the framework without manually modifying the core Express server.
  * **Config Loader**: Automatically loads a `dinou.config.js` file at the root of the project to initialize custom plugins.
  * **`onServerInit(app)` Hook**: Allows plugins to register global Express middlewares, custom endpoints (like webhooks), or API routes.
  * **`onRequestContext(req, res, context)` Hook**: Allows plugins to inject custom properties (like `locale` or `userId`) into the RSC context across standard page requests, Server Actions, and dynamic compilation child processes.
  * **Try-Catch Isolation**: Wrapped plugin hooks in safe boundaries with named logging to prevent third-party plugin errors from crashing the server.

### Fixed
- **URL resolution for search params**: Fixed `useSearchParams` and `usePathname` to work correctly with URL hashes.
- **Server Actions with FormData**: Fixed server actions to correctly handle FormData arguments, supporting formData in any position in the args list.

## [5.1.2] - 2026-07-12

### Fixed
- **Client Link Import Resolution**: Fixed `TypeError: Failed to resolve module specifier 'dinou/core/link.jsx'` client-side crashes occurring when importing and rendering `<Link>` from `"dinou"` inside Server Components under Esbuild and Rollup compilation environments.

## [5.1.1] - 2026-07-12

### Fixed
- **Safe Route Invalidation (`revalidatePath`)**: Added graceful try-catch error handling to `revalidatePath` to capture missing or invalid route resolution errors. It now logs a console warning instead of re-throwing exceptions, preventing runtime crashes in server functions or webhooks when targeting non-existent routes.

## [5.1.0] - 2026-07-11

### Added
- **On-Demand Revalidation API**: Added `revalidatePath` and `revalidateTag` exports to the new `"dinou/server"` server-only entry point.
  - **`revalidatePath(path)`**: Triggers the purge and background regeneration of static files for the targeted route. Fully supports relative path navigation inputs (e.g. `./` or `detalles`), resolved dynamically at runtime using the active request context and the `referer` header.
  - **`revalidateTag(tag)`**: Scans statically generated outputs to locate and regenerate all routes associated with the matching cache tag.
- **Route Caching Tags (`getCacheTags`)**: Integrated support for defining a custom `getCacheTags(params)` function inside route-level `page_functions` files. Registered tags are saved into the route's `metadata.json` during compile time and subsequent on-demand builds for tag-based invalidation queries.
- **Lazy Load Module Boundaries**: Implemented dynamic CJS `require` and ESM `import()` layers inside the `"dinou/server"` entry point. This safely halts recursive import chains, preventing client-side bundlers and SSR rendering subprocesses from evaluating server-exclusive Node.js runtime code.

### Fixed
- **Slot Error Boundary Recovery during Static Site Generation (SSG)**: Implemented isolated try-catch evaluation blocks and local `error.jsx` fallback resolutions for layout slots inside `build-static-pages.js`. This matches the runtime router's slot containment behavior, preventing slot-level crashes from bubbling up and aborting compile-time builds or revalidation processes.
- **HTTP Status Retrieval Bug in Static Serving (`getStatus`)**: Corrected the invocation of the status manifest retrieval logic in `server.js` (replacing the faulty `getStatus[reqPath]` property lookup with the correct `getStatus(reqPath)` function call). This ensures the server serves pre-rendered static pages with their recorded status codes (e.g. `500` for slot/page errors) instead of falling back to a `200 OK` default.

## [5.0.3] - 2026-07-09

### Added
- **Native React 19 Server Actions & `callServer` Support**: Enabled full integration for submitting forms directly from Server Components using the native `<form action={ServerAction}>` pattern.
  - **Client-side Integration**: Implemented the global `callServer` option hook within `createFromFetch` in both the ESM client (`client.jsx`) and Webpack client (`client-webpack.jsx`). React now intercepts form submits and marshals arguments through Dinou's `createServerFunctionProxy` seamlessly.
  - **Server-side Module Loader Integration**: Updated `babel-esm-loader.js` to automatically scan `"use server"` files and register exported functions using React's `registerServerReference` runtime call.
- **Route-Level Soft Navigation Error Recovery**: Integrated client-side React `ErrorBoundary` support wrapping the router context. If rendering crashes during a soft navigation or initial mount (on either Server or Client components), the router captures the failure and dynamically fetches `/____rsc_payload_error____` to render the custom slot-based error page fallback, avoiding white screens and React root unmounts.


## [5.0.2] - 2026-07-08

### 🛡️ Security & Route Control
* **Route Validation in RSC Payload Endpoints**: Unified security checks across endpoints. Direct requests to fetch RSC payloads (`/____rsc_payload____/*`) now enforce `validateParams()` and `allowISG()` checks matching the main HTML document loader behavior. This prevents direct payload scraping or scanning of blocked/invalid dynamic route parameters.

### 🐛 Bug Fixes
* **Sequential Compilation in ISR & ISG**: Resolved a critical race condition that caused disk cache desynchronization and persistent hydration mismatch errors.
  * **Issue**: `Promise.all` compiled the RSC payload and HTML page in parallel. The HTML generator read the `rsc.rsc` file from disk before the new payload finished writing, saving a stale timestamp/state in the static HTML file.
  * **Solution**: Refactored `revalidating.js` and `generating-isg.js` to execute sequentially. The RSC payload is compiled and committed first, ensuring the HTML compiler reads the freshly generated RSC file.
* **ESM Loader Compatibility for Slot Error Boundaries (`importModule` vs `require`)**: Fixed a server-side crash when using React client hooks inside slot error components (`error.tsx`).
  * **Issue**: The framework used CommonJS `require()` to import the slot error components, bypassing the registered ESM custom loader (`register-loader.mjs`). This caused `"use client"` components to be evaluated as Server Components, failing with `useState is not a function`.
  * **Solution**: Updated `get-jsx.js` and `get-error-jsx.js` to load slot error modules using `await importModule()`, ensuring they are correctly resolved as Client Component References.

## [5.0.1] - 2026-07-07

### Fixed
- **ESM SSR Navigation Context Resolution**: Replaced direct `require` with a dynamic loader hook (`__dinou_require__` or `module.require`) in `navigation.js` to resolve the request context inside ESM SSR execution trees (e.g., Esbuild and Rollup client bundlers), preventing `ReferenceError: require is not defined` and resolving client component hydration mismatches during route resolution.

## [5.0.0] - 2026-07-05

### Added
- **Dynamic Parameter Validation (`validateParams`)**: Support for defining `validateParams` in `page_functions.ts` to validate route parameters on the server and return a 404 response immediately if invalid.
- **ISG Generation Opt-Out (`allowISG`)**: Support for defining `allowISG` in `page_functions.ts` to disable on-demand Incremental Static Generation (ISG) for undeclared route parameters.
- **Anti-Bot Shield**: Integrated an in-memory Express middleware firewall to detect and block common bot scans and malicious queries instantly.

### Refactored
- **Native RSC Flight Payload Streaming**: Major architectural refactor replacing process-to-process custom JSX serialization/deserialization with React's native streaming of RSC Flight payloads via `createFromNodeStream` on the SSR process.

## [4.0.16] - 2026-06-30

### Fixed
- **Cookie Deletion Attributes**: Reconstructed streaming cookie deletion to serialize and include `domain`, `secure`, and `sameSite` properties, ensuring browsers match scopes and delete cookies correctly.
- **Defensive Redirects**: Added a safety check in `resolveRelativeUrl` to fallback to `/` if the destination path is invalid (such as undefined or null), avoiding server crashes.
- **TypeScript Type Definitions**: Updated the `clearCookie` signature in `index.d.ts` to accept the full `CookieOptions` interface, resolving compilation errors when using `sameSite` or `secure` attributes.

## [4.0.15] - 2026-06-29

### Added
- **VFS Routing Cache**: Introduced an in-memory Virtual File System (VFS) to cache filesystem structures under `src/` at production startup, resolving dynamic routes entirely in-memory and eliminating synchronous event loop-blocking disk I/O.

### Fixed
- **Cross-Platform Separators**: Normalized Server Functions manifest keys and runtime lookup checks to consistently use forward slashes (`/`), preventing OS path format mismatches (`\` vs `/`) and subsequent `400 Bad Request` execution errors.

## [4.0.14] - 2026-06-29
### Added
- **Soft Redirects**: Exposes the SPA transition navigation internally via `window.__DINOU_ROUTER_NAVIGATE__` to enable smooth client-side redirects from both Server Functions and RSC payloads, keeping the React client state intact and preventing full browser page reloads.
### Fixed
- **External Links Interception**: Restored native browser navigation for external domains, protocol-relative links (`//...`), and special protocols (`mailto:`, `tel:`, etc.) by preventing the SPA router from capturing or prefetching non-internal routes.

## [4.0.13] - 2026-06-29

### Added
- **Universal Redirects**: Full support for redirects on Server Components, `getProps`, Server Actions, and client SPA navigation.
- **Standard Relative Paths**: Support for relative paths (`../sibling`, `./child`, `?query`, `#hash`) matching directory-first URL resolution.
- **Absolute Link Hover**: Links now render resolved absolute paths to ensure correct browser previews and right-click behaviors.

### Fixed
- **RSC Stream Stability**: Resolved socket crashes (`Connection closed`) and duplicate Express header warnings when redirects occur during streamed RSC requests.
- **SSR Process Leaks**: Render processes are now cleaned up immediately after an HTML redirect is triggered.

### Security
- **Redirect Sanitization**: Blocked unsafe external domains (`https://...`), protocol-relative URLs (`//...`), and scripting payloads (`javascript:...`).

### Refactored
- **Shared Helpers**: Unified path resolution logic into a shared module (`url-resolver.js`).

## [4.0.12] - 2026-06-28

### Security
- **Fix DOM XSS / Script Injection Vulnerability:** Replaced inline HTML/Script injection (`<script>` tags executed via `createContextualFragment` in client-side proxies) with a secure, data-driven line-based protocol for active streams and custom HTTP headers/JSON payload signaling for redirects.
- **CSP (Content Security Policy) Compatibility:** Removed all `'unsafe-inline'` script injections, ensuring full compatibility with strict security policies.

### Fixed
- **Stream Redirection & Cookie Handling:** Improved robustness and predictability of stream reading in server-function proxies by switching to a line-by-line (`\n` delimited) streaming command parser, eliminating regex-based tag extraction.

## [4.0.11]

### Fixed

- Security: Fix server functions endpoint vulnerability and add improvements.

## [4.0.10]

### Fixed

- Server Functions endpoint vulnerability.

## [4.0.9]

### Changed

- Remove unused dependency '@pmmmwh/react-refresh-webpack-plugin'.
- Delete unnecessary commented code and translate comments to English.

## [4.0.8]

### Changed

- Increase versions of concurrently and copy-webpack-plugin for vulnerabilities.
- Uninstall css-modules-require-hook and create dinou/core/css-require-hook.js.

## [4.0.7]

### Fixed

- env vars in getProps and json files in esbuild.

## [4.0.6]

### Fixed

- Execute page_functions on not_found page too in getJSX.

## [4.0.5]

### Fixed

- Pass props to RootLayout in BuildStaticPages.

## [4.0.4]

### Fixed

- Use Server Functions as Actions in Forms.
- Webpack config ignore pattern.
- buildStaticPages: pass context to getProps.
- refresh: actually do refresh of the same page.

### Added

- React Compiler to Webpack (dev, prod), Rollup (dev, prod), and esbuild (prod).

## [4.0.3]

### Fixed

- Add missing headers (e.g. authorization) to headers whitelist.

## [4.0.2]

### Fixed

- Export dinou as ESM too.

## [4.0.1]

### Fixed

- Starting sequence of the server (generate static pages on background).

## [4.0.0]

### 🚀 Major Release

This release marks a significant milestone for Dinou.

**Key Highlights:**

- **Public Typed API:** Import everything directly from `dinou`.
- **Hybrid Rendering Engine:** Automatic static/dynamic switching (Bailout).
- **SPA Experience:** Soft navigation, prefetching, and client-side caching.
- **Security Hardening:** Context isolation in Server Functions.

---

### 💥 Breaking Changes

- **Server Functions Context:** The `{ req, res }` object is **no longer injected** as the last argument to Server Functions.
  - **Migration:** Use the new `getContext()` hook inside your function body to access request/response objects.
- **Page Props:** Pages and Layouts no longer receive `searchParams` or `query` as props.
  - **Migration:** Use the `useSearchParams()` hook for client-side or server-side access.

### ✨ Features

#### 📦 Core & API

- **`dinou` Export:** Introduced the main package export containing all hooks, types, and utilities.
- **`getContext()`:** New synchronous utility function to safely access `req` (cookies, headers, query) and `res` (cookie setting, redirects) within Server Components and Server Functions.
- **Universal `redirect()`:** Intelligent redirect helper that performs an HTTP 307 on the server (hard navigation) and a router replacement on the client (soft navigation).

#### ⚡ Rendering & Performance

- **ISG (Incremental Static Generation):** New pages can now be generated on-demand after build time.
- **Automatic Bailout:** The engine now automatically opts out of static generation if dynamic APIs (cookies, headers, searchParams) are accessed during render.
- **Async `getStaticPaths`:** `getStaticPaths` in page functions can now be asynchronous, allowing for database-driven static paths.
- **ISR Fixes:** Complete overhaul of the Incremental Static Regeneration system for reliability.

#### 🧭 Routing & Navigation

- **Soft Navigation (SPA):** Full client-side router implementation. Navigating between pages no longer triggers a full browser refresh.
- **`<Link>` Component:** New component with built-in:
  - **Prefetching:** Loads data on hover.
  - **Freshness Control:** `fresh` prop to bypass cache.
  - **Scroll Management:** Intelligent scroll restoration.
- **Nested Dynamic Routes:** Support for complex nested dynamic patterns (e.g., `/shop/[category]/[product]`).
- **New Hooks:**
  - `useRouter()`: Programmatic navigation (`push`, `replace`, `back`, `forward`, `refresh`).
  - `usePathname()`: Reactive current path access.
  - `useSearchParams()`: Reactive query string access.
  - `useNavigationLoading()`: Global navigation state for loading indicators.
- **`ClientRedirect`:** Component for immediate client-side redirection on mount.

### 🛡️ Security

- **Context Isolation:** Removed implicit context passing to prevent accidental leakage of sensitive request data in Server Functions.
- **Typed Headers & Cookies:** `getContext().req.headers` and `cookies` are now fully typed and read-only by default to enforce security best practices.

### 🐛 Fixed

- **Static Generation:** Fixed `collectPages` (buildStaticPages) to correctly identify and generate nested dynamic routes.
- **Dynamic Parameters:** Fixed `getFilePathAndDynamicParams` logic to correctly resolve complex nested slugs and catch-all routes.
- **RSC Stream:** Corrected handling of `BigInt` and `Map` types during the RSC stream transfer.

### 🧪 Testing

- **E2E Suite:** Introduced a comprehensive End-to-End test suite using **Playwright** to ensure framework stability across routing, rendering, and hydration scenarios.

## [3.0.6]

### Security

- Fix: Use fixes from React versions 19.2.3 and improve security of server function endpoint.

## [3.0.5]

### Security

- Fix: set minimum version for react-server-dom-webpack to 19.2.1.

## [3.0.4]

### Security

- Fix CVE-2025-55182 (React2Shell) – Remote Code Execution in React Server Components
  - Updated internal react-server-dom-esm to custom build from React main (includes upstream security patch)
  - All Dinou apps using Server Components / Server Actions are now protected

## [3.0.3]

### Fixed

- esbuild: stabe chunk names plugin (windows).
- esbuild: assets plugin.

## [3.0.2]

### Fixed

- Fix esbuild development change between server and client components.
- Fix rollup development change between server and client components.
- Fix CSS entries for webpack.

## [3.0.1]

### Fixed

- esbuild doesn't give error when 'favicons' folder doesn't exist in root directory.

## [3.0.0]

### Added

- esbuild integration (the one used by default).
- rollup integration (optionally used).
- webpack integration (optionally used).

## [2.4.1]

### Fixed

- Use hashed names for bundled files in production.

## [2.4.0]

### Fixed

- rollup-plugin-react-client-manifest: now emits assets and csss correctly for server components.

### Changed

- Now all folders and files ejected are grouped in dinou folder. What was before dinou folder now is dinou/core folder.
- README.md, updated.

## [2.3.3]

### Fixed

- babel-esm-loader: check filePath is a file when resolving. This avoids crash when you have a file named equal than a folder in the same directory.

## [2.3.2]

### Fixed

- Do not use `for await` when it is not necessary in buildStaticPages.

## [2.3.1]

### Fixed

- Build for ES modules (ESM).

## [2.3.0]

### Added

- Support for ES modules (ESM). Dinou can now import and use ESM-only packages inside React components.

## [2.2.0]

### Fixed

- buildStaticPages - collectPages.
- getFilePathAndDynamicParams.

### Added

- Cookies support. Now getProps receive params, query, and cookies as parameters (function getProps(params, query, cookies)).

## [2.1.1]

### Fixed

- Warning in Rollup about serverFunctionProxy.

## [2.1.0]

### Added

- Server Functions handling.

## [2.0.3]

### Fixed

- Fixed cross-platform path handling using Node.js `path` module for macOS/Linux compatibility in `get-jsx.js`, `get-error-jsx.js`, and `build-static-pages.js`.
- Added `awaitWriteFinish` to `chokidar` in `server.js` to avoid parsing incomplete manifest files on macOS.

## [2.0.2]

### Fixed

- Watch server components in react manifest plugin.

## [2.0.1]

### Fixed

- Use createFromFetch from react-server-dom-esm in client-error.jsx.

## [2.0.0]

### Changed

- Migrated build system from Webpack to Rollup for both development and production.

## [1.10.1]

### Fixed

- Layout receives prop from getProps when using reset_layout.

- Don't serve static pages when query params are used.

## [1.10.0]

### Added

- Support for additional assets or media file extensions (image, audio, and video).

## [1.9.3]

### Changed

- README.md.

## [1.9.2]

### Changed

- README.md.

- Don't show overlay of react-refresh on error.

## [1.9.1]

### Added

- CHANGELOG.md.

## [1.9.0]

### Added

- `react-refresh` for better hot reloading during development.

## [1.8.0]

### Changed

- Separation of webpack folders, one for production (`dist3`) and another for development (`____public____`).

## [1.7.2]

### Fixed

- Use of images.

## [1.7.1]

### Fixed

- Attempt to fix the use of images (partially fixed).

## [1.7.0]

### Added

- ISR and SSG.

## [1.6.0]

### Added

- Error handling.

## [1.5.0]

### Added

- Reset layout functionality.

## [1.4.3]

### Fixed

- tsconfig-paths for babel.

## [1.4.2]

### Fixed

- Use babel again instead of esbuild.

## [1.4.1]

⚠️ **WARNING:** This version contains major issues due to the switch to `esbuild`. It is recommended to skip directly to version `1.4.2` or later.

### Fixed

- Webpack infinite loop.

## [1.4.0]

⚠️ **WARNING:** This version contains major issues due to the switch to `esbuild`. It is recommended to skip directly to version `1.4.2` or later.

### Added

- Support for base alias (absolute import paths).

## [1.3.1]

⚠️ **WARNING:** This version contains major issues due to the switch to `esbuild`. It is recommended to skip directly to version `1.4.2` or later.

### Changed

- README.md.

## [1.3.0]

⚠️ **WARNING:** This version contains major issues due to the switch to `esbuild`. It is recommended to skip directly to version `1.4.2` or later.

### Added

- Use of images.

## [1.2.0]

⚠️ **WARNING:** This version contains major issues due to the switch to `esbuild`. It is recommended to skip directly to version `1.4.2` or later.

### Added

- Tailwind.css and styles support.

## [1.1.1]

### Changed

- README.md

## [1.1.0]

### Added

- Capability to manage `favicons` folder.

## [1.0.4]

### Changed

- README.md

## [1.0.3]

### Added

- Preparation for ISR

## [1.0.2]

### Fixed

- Webpack config file.

## [1.0.1]

### Changed

- Apparently nothing changed

## [1.0.0]

### Added

- Initial commit.
