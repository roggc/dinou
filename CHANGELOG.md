# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [10.0.3] - 2026-11-23

### Fixed

#### PPR & Causal Snapshot Consistency
- **Eliminated React `#418` hydration mismatches during PPR Stale-While-Revalidate (SWR) expiration** (`dinou/core/handler.js`, `dinou/core/ppr-runtime.js`, `dinou/core/cache-revalidate.js`, `dinou/core/storage-adapter.js`): Preloaded causal snapshots of `shell.page.json` and `shell.layout.json` — automatically falling back to atomic previous snapshots (`shell.page._old.json` / `shell.layout._old.json`) when storage `metadata.generatedAt` advances past the served HTML's timestamp — **before** launching background SWR revalidations (`revalidatePage` / `revalidateLayout` for 1s PPR shell TTLs, page shell slot TTLs, and layout shell slot TTLs) and `/____rsc_page____` SWR refreshes. Prevents stale SSR HTML from being paired with newly overwritten inline Flight payloads (`__DINOU_RSC_P__` / `__DINOU_RSC_L__`).
- **Closed sub-millisecond `FileSystemStorage` PPR commit-window race under concurrent stampede** (`dinou/core/handler.js`): Extracted the HTML's embedded `window.__DINOU_BUILD_ID__` timestamp when comparing against `latestPageMeta.generatedAt` during causal PPR shell snapshotting, ensuring concurrent requests hitting the window between writing `metadata.json`/`shell.page.json` and overwriting `index.html` still detect `latestPageMeta.generatedAt > htmlGenAt` and select `shell.page._old.json`.
- **Fixed PPR dynamic hole error isolation to preserve zero-`#418` hydration of the static shell & healthy sibling holes** (`dinou/core/ppr-runtime.js`): Rendered the isolated `[PPR Error: ...]` fallback element via `renderHtmlStream` inside `<!--$-->...<!--/$-->` Suspense markers AND spliced the exact matching fallback element into `resolvedHolesMap` so inline `__DINOU_RSC_P__` / `__DINOU_RSC_L__` scripts are still emitted cleanly (instead of being dropped on hole failure and causing client refetch crashes or `#418` mismatches); also wrapped `PprDynamicHoleBoundary` in a matching isolated `try/catch` for soft-navigation `/____rsc_page____` resilience.
- **Supported imperative `getContext().res.redirect()` and `redirect()` inside PPR dynamic holes after shell prelude flush** (`dinou/core/handler.js`, `dinou/core/ppr-runtime.js`): Captured `context._redirectLocation` without mutating the already-sent PPR response bridge during `_isPprRuntimeResume`, and streamed an immediate client redirect `<script>` (`window.location.replace(...)`) into the active PPR response stream so both declarative `return redirect(...)` and imperative `ctx.res.redirect(...)` redirect cleanly without hanging.

#### Multi-Level Horizontal Segmentation & Per-Level Layout Isolation
- **Decoupled multi-level layout stacks (`Root → L1 → L2 → ...`) via per-level own-fragment composition** (`dinou/core/layout-composition.js`, `dinou/core/handler.js`, `dinou/core/cache-revalidate.js`, `dinou/core/generate-static.js`, `dinou/core/storage-adapter.js`, `dinou/core/get-jsx.js`):
  - Persisted isolated per-level `shell.layout.own.json` fragments along with `ownGeneratedAt`, `ownHoles`, `ownSuspenseCount`, `ownSlotTags`, and `ownPpr` metadata, plus deterministic PPR hole ID offset shifting (`shiftPprHoleIdsInTree`) during chain composition.
  - **Surgical child layout revalidation:** Calling `revalidateLayout(L2)` now renders only `L2` and splices it into cached ancestor `shell.layout.own.json` fragments without re-executing `L1` or higher ancestors.
  - **Non-re-executing ancestor cascades (`recomposeOnly`):** Revalidating an ancestor layout (`L1`) now recomposes descendant layouts (`L2`, `L3`) from their cached `shell.layout.own.json` without re-executing descendant layout components and without resetting descendant `ownGeneratedAt` ISR TTL clocks.
  - **Slot persistence across layout recompositions:** Refreshing a `<DinouCacheSlot>` inside a layout (`onlyRefreshSlots: true`) now updates that level's `shell.layout.own.json`, ensuring subsequent descendant recompositions retain refreshed slot values rather than reverting to build-time snapshots.
- **Preserved static ancestor & page caching under asymmetric dynamic layouts (`revalidate = 0`)** (`dinou/core/handler.js`, `dinou/core/cache-revalidate.js`, `dinou/core/layout-composition.js`):
  - Persisted `shell.page.json` unconditionally for all static and PPR pages (not only routes with PPR or `<DinouCacheSlot>`).
  - Executed only dynamic layout levels (`revalidate = 0`) fresh in the live request context while composing cached static ancestor layouts (`shell.layout.own.json`) and cached static pages (`shell.page.json`) on both full-page `GET` and `/____rsc_layout____` requests.
  - Prevented `revalidateLayout` and `revalidatePath` from ever caching or freezing `revalidate = 0` layouts into `layout.rsc` / `shell.layout.own.json`, and prevented `revalidatePage` under a dynamic layout from falling back to full `getJSX` or re-executing static ancestors.
- **Fixed alternating static/dynamic layout chains (`S → D → S → S` and `S → D → S → D`)** (`dinou/core/handler.js`, `dinou/core/generate-static.js`, `dinou/core/cache-revalidate.js`):
  - Isolated per-level `ownDynamicState` during SSG Pass 1 so a dynamic ancestor layout (`revalidate = 0`) no longer pollutes static descendant layouts with `dynamic: true` or blocks persisting their `shell.layout.own.json`.
  - Emitted `X-Dinou-Own-Static` / `X-Dinou-Has-Dynamic-Ancestor` headers during SSG and recorded `hasDynamicAncestor: true` in `layout.metadata.json` (without freezing a stale composed `layout.rsc` across the dynamic ancestor).
  - Handled `hasDynamicAncestor` on `/____rsc_layout____` requests to splice live dynamic ancestors between cached static levels, and added surgical `ownOnlyUnderDynamicAncestor` support in `revalidateLayout` so revalidating `L3` under a dynamic `L2` updates only `L3/shell.layout.own.json` without re-executing `L1` or `Page` or caching `L2`.
- **Reused cached static layout chains when serving dynamic pages (`S → S → D`)** (`dinou/core/handler.js`): Generalized per-level layout composition on production `GET` requests to cover dynamic or uncached non-PPR pages (`revalidate = 0` or implicit cookie/header bailout) beneath all-static layouts, rendering only `segment: "page"` live with the real request context and splicing it into cached `shell.layout.own.json` ancestors instead of falling back to full `getJSX` and re-executing every layout on every request.
- **Detected implicit dynamic bailout layouts (`lMeta?.dynamic`) on `GET` requests** (`dinou/core/handler.js`): Checked persisted `layout.metadata.json` (`lMeta?.dynamic === true`) alongside explicit `layoutConfig.isDynamic` (`revalidate = 0`) when building `activeLayoutsForRoute`, ensuring layouts that implicitly bail out by reading cookies or headers trigger asymmetric per-level composition (live layout execution with cached static ancestors and static child pages).
- **Fixed shared `isDynamic` route-map pollution breaking `page.rsc` caching on soft `<Link>` navigation** (`dinou/core/handler.js`): Kept `isDynamic.get(reqPath)` isolated for page-level dynamic state and used a request-local `dynamicState` object whenever dynamicity originates only from an ancestor layout, preventing soft `<Link>` navigations (`/____rsc_page____/<route>`) to static pages under dynamic layouts from bypassing cached `page.rsc` and re-executing the page live.
- **Enabled per-level PPR shell preservation under asymmetric dynamic layouts (`L1 PPR → L2 Dynamic → Page PPR`)** (`dinou/core/layout-composition.js`, `dinou/core/handler.js`):
  - Added `spliceSingleLayoutOwnHoles(entry, storage, options)` in `layout-composition.js` to splice live dynamic PPR holes directly into any static PPR layout level's cached `shell.layout.own.json` without re-executing its static shell.
  - Extended per-level runtime composition in `handler.js` (both production `GET` SSR and dynamic `/____rsc_layout____`) to cover routes combining dynamic layouts (`revalidate = 0` or implicit bailout) with PPR ancestor/descendant layouts and PPR child pages (including query-parameter URLs like `?mode=...`), reusing cached `shell.page.json` + `noDynamic()` collapsed static Suspense and cached `shell.layout.own.json` while executing only dynamic layout levels and live PPR holes with zero `#418` hydration errors.
- **Fixed same-millisecond `revalidatePath` / `revalidatePage` layout-timestamp overwrite causing React `#418` hydration mismatches** (`dinou/core/cache-revalidate.js`): When `revalidateLayout` and `revalidatePage` executed within the same millisecond (`now <= prevGenTime`, e.g., on fast Bun/Linux runtimes), `revalidatePage` previously applied a global ISO-timestamp regex replacement across the already-composed `newHtml` — overwriting the layout's timestamp in `index.html` while `layout.rsc` kept its original timestamp. Moved same-millisecond page timestamp bumping ahead of `renderHtmlStream` (updating only `pageRscForCompose` and `pendingShellPageJson` when `!didSpliceOnlyPageSlots`), removed the post-composition HTML regex overwrite, and guarded `revalidateLayout`'s same-millisecond timestamp bump with `!didRecomposeOnly && !didSpliceOnlyLayoutSlots` while keeping `shell.layout*.json` synchronized.

#### Vertical Segmentation (`<DinouCacheSlot>`)
- **Fixed nested `<DinouCacheSlot>` `fresh: true` propagation leak** (`dinou/core/cache-slot.js`): Updated `refreshNestedSlotsInTree` to pass `fresh: false` when hydrating nested child `<DinouCacheSlot>` boundaries inside a refreshed parent slot, ensuring `refreshSlot("outer", { fresh: true })` refreshes only the outer slot while preserving cached inner slots across arbitrary nesting depths.
- **Propagated shared `<DinouCacheSlot>` refreshes across multiple routes and layouts on first hit** (`dinou/core/cache-slot.js`, `dinou/core/handler.js`, `dinou/core/cache-revalidate.js`):
  - Added single-pass `inspectSlotsFreshness(slotTags, hostGeneratedAt)` detecting both TTL expiration (`hasExpired`) and externally refreshed shared slots (`slot.generatedAt > hostGeneratedAt` → `hasNewer`) without extra storage reads.
  - Integrated `hasNewer` across cached HTML hits (before causal PPR shell snapshots), `/____rsc_page____`, `/____rsc_layout____`, and asymmetric dynamic-layout composition so any static/PPR route or layout hosting a shared slot refreshed on another route synchronously splices the already-cached fresh slot JSX on the first request without re-executing the host component or causing `#418` hydration races.
  - Reordered `getSlotJSX` host persistence to update matching layouts before the current page and committed `revalidateLayout` timestamps monotonically (`Math.max(newGenTime, Date.now())`) so host timestamps stay `>=` freshly rendered slot timestamps.
- **Fixed multi-instance `<DinouCacheSlotBoundary>` fan-out & deduplication on client `refreshSlot()`** (`dinou/core/slot.js`): Replaced per-instance `dinou:refresh-slot` listeners and single-ref `slotOverrideCache` with a unified per-`slotId` dispatcher (`entry.subscribers` `Set` + `baseChildrenSet`). When the same `slotId` is mounted simultaneously in multiple places (e.g., Layout and Page on the same screen), `refreshSlot()` now issues a single `/____rsc_slot____` request and updates every mounted boundary simultaneously instead of overwriting `latestReqId` and dropping earlier instances, while avoiding cross-route background fetches for unmounted slots during wildcard `refreshSlot("*")`.
- **Preserved last-known-good `slot.json` fallback when `revalidateTag()` fails during slot regeneration** (`dinou/core/cache-slot.js`, `dinou/core/cache-revalidate.js`): Snapshotted invalidated slot entries before deletion in `revalidateTag` and recorded thrown slot regenerations in `dinou.slot.failed.renders`, restoring the last-known-good `slot.json` exclusively for slots whose regeneration threw an error so subsequent `refreshSlot()` calls and cached hosts degrade cleanly instead of returning `404` or losing fallback content.
- **Fixed `<DinouCacheSlot>` refresh & metadata persistence for static/PPR layouts and pages beneath dynamic ancestor layouts** (`dinou/core/handler.js`, `dinou/core/cache-revalidate.js`, `dinou/core/cache-slot.js`, `dinou/core/generate-static.js`):
  - Emitted `X-Dinou-Slot-Tags` during SSG Pass 1 and persisted `slotTags` on `hasDynamicAncestor` layouts (and checked both `slotTags` and `ownSlotTags` in `getSlotJSX`) so slots inside a static/PPR layout beneath a dynamic ancestor (`L1 PPR → L2 Dynamic → L3 PPR+Slot`) are discovered on `refreshSlot()` and `revalidateTag()`.
  - Added an `ownOnlyUnderDynamicAncestor` slot-splice path in `revalidateLayout(..., { onlyRefreshSlots: true })` so refreshing a slot inside `L3` under dynamic `L2` updates `L3/shell.layout.own.json` without re-executing `L3`'s static shell or freezing `L2`.
  - Updated SSG Step 5B (`/____rsc_page____`) in `generate-static.js` to persist `metadata.json` (`slotTags`, `holes`, `ppr`, `pagePpr`, `tags`, `revalidate`) for non-dynamic static/PPR pages underneath dynamic layouts (where Step 5A skips freezing `index.html`), ensuring page-shell `<DinouCacheSlot>` refreshes persist cleanly across reloads.
- **Fixed concurrent nested `<DinouCacheSlot>` override reversion during wildcard `refreshSlot("*")`** (`dinou/core/slot.js`): Assigned a monotonic `batchId` per `dinou:refresh-slot` event and propagated it unconditionally through `SlotRenderBatchContext` (`globalThis.__DINOU_SLOT_BATCH_CONTEXT__`) inside `DinouCacheSlotBoundary` (keeping fiber identity invariant so nested client `useState` counters are preserved). When a parent and nested child slot refresh concurrently under `refreshSlot("*")` and the outer slot resolves after the inner slot carrying a stale inner snapshot, the inner boundary matches `ancestorBatchId === cachedOverride.batchId`, adopts the new `children` reference into `baseChildrenSet`, and retains its fresh override.
- **Prevented `inStaticShell` metadata poisoning on dynamic-hole slots and added background SWR trigger inside `getSlotJSX`** (`dinou/core/cache-slot.js`): Restricted `isPprShellBuild` in `DinouCacheSlot` to `!isSlotEndpointReq && !reqCtxForMeta?._isPprRuntimeResume` so `/____rsc_slot____` refreshes and `_isPprRuntimeResume` dynamic-hole renders never persist `inStaticShell: true` onto dynamic-hole slots (while preserving SWR eligibility on both static/PPR shells and dynamic SSR routes). Guarded `serveStaleWhileRevalidate` in `getSlotJSX` with `!getContext()?._isPprRuntimeResume` and launched deduplicated `backgroundRevalidations` (`getSlotJSX(targetId, { fresh: true })`) whenever `serveStaleWhileRevalidate` serves a stale nested slot, preventing expired nested slots from remaining permanently stale.
- **Eliminated Cloudflare Workers (`workerd`) cross-request `IoContext` crashes during concurrent/rapid slot refreshes & revalidations** (`dinou/core/cache-revalidate.js`, `dinou/core/cache-slot.js`, `dinou/core/layout-composition.js`, `dinou/core/handler.js`, `dinou/core/storage-adapter.js`):
  - Bypassed the module-global `revalState.queue` promise chain (`enqueueRevalidation`) and cross-request `inflightLayoutRevalidations` sharing when running under Cloudflare Workers (`navigator.userAgent === "Cloudflare-Workers"`), preventing Request B's `revalidatePage`/`revalidateLayout` callback from executing inside Request A's `IoContext` (which caused `Cannot perform I/O on behalf of a different request` followed by `The Workers runtime canceled this request because it detected that your Worker's code had hung` → `500 Internal Server Error` during wildcard `refreshSlot("*")` and back-to-back layout/page slot refreshes).
  - Prevented cross-request sharing of I/O-bound `preEvaluatingRoutes` (`cache-slot.js`) and `inFlightGenerations` (`handler.js`) on Cloudflare Workers, stopped reading per-request `env.ASSETS` from `globalThis.__DINOU_ENV__` across requests (`cache-revalidate.js`, `cache-slot.js`, `layout-composition.js`), resolved `CloudflareKVStorage` bindings dynamically from the active request's `requestStorage`, and wrapped `handleRequest` in `requestStorage.run(rootContext, ...)` so all background ISR/slot `ctx.waitUntil(...)` revalidations inherit their own request's `env.ASSETS` binding and preserve `_old` causal snapshots (`#418`-free on first SSG→ISR regeneration).
- **Suppressed WebKit in-flight RSC hydration fetch aborts during PPR dynamic-hole `redirect()`** (`dinou/core/ppr-runtime.js`, `dinou/core/client.jsx`, `dinou/core/client-webpack.jsx`): Set `window.__DINOU_STATIC_EXPORT_UNLOADING__ = true` immediately before hard `window.location.replace()` / `window.location.href` redirects emitted by PPR dynamic holes (and hard client redirects), and checked `isStaticExportUnloading()` unconditionally at the entry of `getPagePayload` and `getLayoutPayload`, preventing WebKit's aborted-navigation fetch rejections (`"... due to access control checks."`) from surfacing as uncaught `pageerror`s.

#### React `useId()` & Client Router Context Integrity
- **Unified per-level scoped layout `useId()` generation between SSR HTML and `layout.rsc`** (`dinou/core/ppr-context.js`, `dinou/core/render-jsx-to-client-jsx.js`, `dinou/core/get-jsx.js`, `dinou/core/layout-composition.js`): Scoped layout `useId()` IDs per layout level (`_layout_<scope>_dS_<n>_`) to prevent collisions across independently rendered layout levels, and propagated `scopePrefix` via `markLayoutRootElement` / `getLayoutRootScope` during full `getJSX` renders so SSR HTML and independently compiled `layout.rsc` payloads always emit identical IDs with zero hydration mismatches.
- **Made `RouterContext` a `globalThis` singleton in client bundles** (`dinou/core/navigation.js`): Stored `RouterContext` on `globalThis.__DINOU_ROUTER_CONTEXT__` (matching `DinouPageContext`), resolving `"warning: navigate called outside Router"` where `"use client"` components importing `{ Link, useRouter } from "dinou"` in ejected or workspace-linked monorepo setups received a separate `RouterContext` instance from the runtime shell.

## [10.0.2] - 2026-11-21

### Fixed
- **HTML5 Standards Mode & `<script type="importmap">` `<head>` Injection (`dinou/core/edge-ssr.js`):**
  - Fixed an issue in Esbuild and Rollup builds where `<script type="importmap">` was prepended at byte `0` before `<!DOCTYPE html>`, which triggered browser Quirks Mode (`document.compatMode === "BackCompat"`), caused HTML5 validation errors, and pushed `<title>`, `<meta name="description">`, and Open Graph (`og:*` / `twitter:*`) tags past the 16–32 KB `<head>` scan buffer used by social preview scrapers in larger apps.
  - Injected `<script type="importmap">` strictly inside `<head>` right before `</head>` (or before the first `<script type="module">` in `<head>`), keeping `<!DOCTYPE html>` at byte `0` (`document.compatMode === "CSS1Compat"`) and keeping SEO / Open Graph metadata within the first ~1–2 KB of the HTML response across Node.js, Bun, Deno, Cloudflare Workers, Netlify Functions, Dev, SSG, ISR, PPR shells, and Static Export.
  - Automatically relocated any earlier `<link rel="modulepreload">` tags inside `<head>` (such as React 19's `bootstrapModules` preload) to immediately follow `<script type="importmap">` before `</head>`, ensuring spec-compliant import map resolution across Chrome, Firefox, and Safari.
  - Added byte-level `Uint8Array` ASCII boundary detection (`createImportMapTransformStream` and `injectImportMapIntoHeadSegment`) so multi-byte UTF-8 characters split across streaming chunks are never corrupted, `<body>` chunks stream with zero decode/re-encode overhead, and `no_layout` bare fragments or `<head>`-less documents never stall streaming.

## [10.0.1] - 2026-11-21

### Fixed
- **Static Export Client RSC Stream-Abort Race in Firefox (`dinou/core/client.jsx`, `dinou/core/client-webpack.jsx`)**: Buffered static-export `page.rsc` and `layout.rsc` responses into an in-memory `ArrayBuffer` (`bufferStaticExportResponse`) before handing them to React Flight's `createFromFetch`, preventing Firefox from throwing an unhandled `TypeError: Error in input stream` when a non-RSC static HTML fallback triggers `window.location.replace()` while a parallel `.rsc` response stream (such as `/layout.rsc`) is still in flight; also added `isStaticExportUnloading()` guards to `hydrateRoot`'s `onUncaughtError` and `onCaughtError` handlers alongside `onRecoverableError` (without affecting progressive streaming in server/edge modes).

## [10.0.0] - 2026-11-21

> **Upgrading from v9?** Read the complete [Migration Guide from v9 to v10](https://dinou.dev/docs/migration/v9-to-v10) for step-by-step before/after examples and a verification checklist.

### Breaking Changes
- **Underscore (`_folder`) Directories Are Now Completely Excluded**: Any `_`-prefixed directory subtree inside `src/` (e.g. `src/_components/`, `src/_lib/`, `src/_plugins/`) is now excluded from routing, bundlers, manifests, VFS, dev watchers, route types, and Server Functions (`403`). Importing from `src/_*` in active code now fails at compile time (`checkForbiddenUnderscoreImport`). Rename active helper folders to clean names without a leading underscore (any folder without `page.*` is already ignored by Dinou's router); `_`-prefixed *files* (e.g. `src/blog/_helper.ts`) remain valid.
- **Per-Segment `ppr` Resolution (No Parent-to-Child Inheritance)**: Exporting `export const ppr = true` in a parent `layout_functions.ts` no longer cascades to child layouts or pages. Enable `ppr: true` globally in `dinou.config.ts` or declare `export const ppr = true` explicitly on each child segment that needs PPR.
- **Deployment & Build Output Paths Changed**:
  - **Cloudflare Workers (`wrangler.toml`)**: Update `[assets] directory` from `".dinou/dist3"` to `".dinou/cloudflare/assets"`.
  - **Netlify Functions v2 (`netlify.toml`)**: Point `[functions] directory` to `".dinou/netlify/functions"` with `command = "npm run build:netlify"`, `publish = ".dinou/dist3"`, and `included_files = [".dinou/dist2/**"]` (or `".dinou/dist1/server"` if using the dist1 server entrypoint).
  - **Internal Manifests**: `.dinou/react_client_manifest` and `.dinou/server_functions_manifest` have been removed and all internal manifests (including `manifest.json`) moved into `.dinou/dist1`.
- **Removed Legacy `favicons/` Directory**: Root `favicons/` copying and watching have been removed. Move any remaining favicon files into `public/` (which also now supports PWA `public/manifest.json` at the domain root).
- **`plugin.onRequest` Skipped During Build-Time SSG**: `plugin.onRequest` and `plugin.onRequestContext` no longer run during build-time static generation (`isSSG === true`), executing only on live runtime HTTP requests. Statically pre-rendered Server Components that previously relied on context properties set by `onRequest` should add a safe fallback (e.g. deriving state from `getContext().req?.path`).
- **Strict Client Isolation for Unprefixed `process.env.*`**: Unprefixed `process.env.*` accesses inside `"use client"` components now strictly evaluate to `undefined` during both SSR/SSG and browser execution. Prefix intentional build-time public client variables with `DINOU_PUBLIC_*` or pass runtime values from a Server Component via `getContext().env`.
- **Strict Type-Safe Routing & Removed Transitive Dependencies**:
  - `<Link>` and `useRouter().push` / `replace` now validate routes against `.dinou/types/routes.d.ts` (type dynamic external/callback strings as `DinouLinkTarget`), and received `[[...slug]]` segment `params` are now strictly `string[]`.
  - Removed 7 obsolete legacy dependencies (`dotenv`, `cross-env`, `@esbuild-plugins/tsconfig-paths`, `rollup-plugin-tsconfig-paths`, `tsconfig-paths-webpack-plugin`, `esbuild-copy-static-files`, `rollup-plugin-copy`). Install `cross-env` directly in `devDependencies` if custom project scripts invoke it.

### Added
- **Global Default `allowISG` Configuration in `dinou.config.*` (`index.d.ts`, `layout-functions.js`, `handler.js`)**: Added `allowISG?: boolean` (default: `true`) to `defineConfig(...)` in `dinou.config.*`. When set to `allowISG: false`, all dynamic route segments (`layout` and `page`) across the project default to `allowISG = false` (strict SSG-only mode, returning `404` for any dynamic parameter not pre-rendered at build time) unless a segment explicitly opts in with `allowISG = true` in its own `page_functions.ts` or `layout_functions.ts`.
- **End-to-End Hierarchical & Horizontal Type-Safe Routing (`index.d.ts`, `server.d.ts`, `cli.js`, `generate-route-types.js`, `link.jsx`, `navigation.js`, `navigation-utils.js`, `node/dev.js`)**:
  - **Expanded Route Topology & `dinou typegen` CLI**: Added `npx dinou typegen` (plus automatic regeneration in `dev` watchers and production builds across all bundlers/runtimes) to generate `.dinou/types/routes.d.ts` with full parameter and slot maps (`DinouNavigableParamsMap`, `DinouRouteParamsMap`, `DinouLayoutParamsMap`, `DinouLayoutSlotsMap`, `DinouSlotParamsMap`, `DinouErrorParamsMap`) covering pages, intermediate layouts, parallel `@slots` (including slots inside `(group)` folders and nested sub-routes inside `@slot` trees), `error.tsx`, and `not_found.tsx` boundaries.
  - **Typed Segment Contracts & `dinou/server` Declarations**: Added generic helper types `PageProps`, `LayoutProps` (with automatic sibling `@slot` `ReactNode` prop inference via `LayoutSlots`), `SlotProps`, `ErrorProps`, `NotFoundProps`, `PageFunctions`, `LayoutFunctions`, `RouteParams`, `LayoutParams`, `SlotParams`, and `ErrorParams` in `index.d.ts`, and expanded `server.d.ts` so `dinou/server` re-exports all core routing and segment types alongside `DinouCacheSlot`, `getContext`, `noDynamic`, revalidation helpers, and storage adapters.
  - **Dynamic `params` Interpolation & Strict Relative `from` Navigation**: `<Link>` and `useRouter().push` / `replace` now accept dynamic route patterns (`[param]`, `[[optional]]`, `[...catchAll]`, `[[...optionalCatchAll]]`) with compile-time validated `params` objects and automatic URL-segment encoding (`interpolateRouteParams`), as well as strict relative targets (`"sub"`, `"./sub"`, `"../other"`) validated at compile time and resolved at runtime via `<Link from="..." to="..." />` and `router.push("...", { from: "..." })`.
- **Zero-Boilerplate Route-Contextual `"./dinou"` Virtual Modules (`generate-route-types.js`, `resolve-contextual-dinou.js`, `node/dev.js`, `esbuild/*`, `rollup/rollup.config.js`, `webpack/webpack.config.js`, `node/bundle-dual-engine.js`, `bun/build.js`, `deno/build.js`, `cloudflare/build.js`)**:
  - `generateRouteTypes` now emits `.dinou/routes/<relDir>/dinou.{js,d.ts}` for every route and `@slot` directory in `src/`. Paired with TypeScript `rootDirs: ["src", ".dinou/routes"]` and built-in bundler resolver plugins (`esbuildContextualDinouPlugin`, `rollupContextualDinouPlugin`, `webpackContextualDinouPlugin`), route files can `import { Link, useRouter, ROUTE, type PageProps, type LayoutProps, type SlotProps, type ErrorProps, type NotFoundProps, type PageFunctions, type LayoutFunctions, type RouteParams } from "./dinou"` (or `"../dinou"` from a nested helper subfolder such as `components/`) with all types and relative navigation (`from={ROUTE}`) pre-bound to the enclosing route directory without manual route string literals (while deferring cleanly to any user-authored `dinou.*` file in `src/`).
- **`DinouConfig.reactCompiler` Option**: Added `reactCompiler?: boolean` (default `true`) to `defineConfig()` / `DinouConfig` (`dinou.config.ts`) to optionally toggle `babel-plugin-react-compiler` globally across Esbuild, Rollup, and Webpack production builds.
- **PWA `public/manifest.json` Support**: Moving Dinou's internal chunk manifest to `.dinou/dist1/manifest.json` frees `/manifest.json` at the domain root for standard Progressive Web App manifests (`public/manifest.json`) across all bundlers, runtimes, Cloudflare Workers `env.ASSETS`, and `dinou export-static`.
- **Standalone Static Export SPA Navigation (`dinou export-static`)**:
  - Added `shouldExportDist2File` and `injectStaticExportFlag` so `dinou export-static` exports strictly `index.html` (with `window.__DINOU_STATIC_EXPORT__ = true` injected), `page.rsc`, and `layout.rsc` from `.dinou/dist2` into `out/`, excluding all internal ISR/PPR/Slot metadata JSONs (`metadata.json`, `layout.metadata.json`, `shell.*`, `rsc.rsc`, `slots/*`, `status-manifest.json`, `*._old.*`).
  - Updated `dinou/core/client.jsx` and `dinou/core/client-webpack.jsx` so standalone static sites hydrate and perform full client-side `<Link>` SPA navigation & hover prefetching directly against `/<route>/page.rsc` and `/<layout>/layout.rsc` without requiring a Dinou server, falling back cleanly to native browser navigation if a target path has no `.rsc` payload.
- **Shared Static Asset Security, Caching & MIME Engine (`dinou/core/static-assets.js`)**:
  - Added safe `decodeURIComponent` normalization (supporting filenames with spaces such as `/docs/brochure%202026.pdf`), strict `path.resolve` confinement against directory traversal (`%2e%2e`, backslashes), and hidden dotfile blocking (`/.env`, `/.git/*`, `/.DS_Store`) while explicitly allowing `/.well-known/*` (including extensionless `/.well-known/apple-app-site-association` served as `application/json; charset=utf-8`).
  - Added smart `Cache-Control` differentiation: `public, max-age=31536000, immutable` for content-hashed bundler chunks and `/assets/*`, and `public, max-age=0, must-revalidate` for unhashed `public/*` assets (`favicon.ico`, `robots.txt`, `sitemap.xml`, `manifest.json`, `site.webmanifest`, `styles.css`, etc.).
  - Expanded static MIME dictionary across Node.js, Bun, Deno, and Cloudflare Workers (`application/xml`, `application/manifest+json`, `application/pdf`, `image/avif`, `image/gif`, `font/ttf`, `font/otf`, `application/wasm`, `video/mp4`, `video/webm`, `audio/mpeg`, `audio/ogg`, `audio/wav`, etc.).
- **Universal CSS Modules in Server Components & SSR**: Added `dinou/core/server-css-modules-plugin.js`, enabling `import styles from "./card.module.css"` natively across React Server Components (RSC) and Client Component SSR in `dinou dev`, `dinou build` (`Node.js`, `Bun`, `Deno`, `Cloudflare Workers`), and `dinou export-static` with zero hydration mismatches.
- **Unified PostCSS & CSS `url(...)` Asset Pipeline**: Added `dinou/core/postcss-pipeline.js` (`createBasePostCssPlugins`, `createPostCssUrlAssetsPlugin`) across Esbuild, Rollup, and Webpack—automatically resolving relative, `node_modules`, and `tsconfig.json` aliased `url(...)` assets to `/assets/<hash><ext>` while preserving root-relative `public/` URLs (`url("/hero.svg")`), `data:`, external URLs, and SVG `#fragment` identifiers.
- **Font Asset Support**: Added `.woff`, `.woff2`, `.ttf`, `.otf`, and `.eot` extensions to `dinou/core/asset-extensions.js`, `dinou/assets.d.ts` (`dinou/env`), and Edge/Bun/Deno server loaders.
- **Zero-Reload CSS & RSC HMR in Webpack Dev Mode**: Added WebSocket `dinou-hmr` handling (`style-update` and `rsc-update`) to `dinou/core/client-webpack.jsx`.
- **Custom `assetExtensions` in `dinou.config.*` with Auto-Generated TypeScript Declarations**: Added `assetExtensions?: string[]` to `DinouConfig` (e.g. `defineConfig({ assetExtensions: ["glb", "gltf", "hdr", "wasm"] })`), enabling custom binary/3D/media asset imports across Esbuild, Rollup, Webpack, and all 5 runtimes without ejecting, while `dinou typegen` automatically emits ambient `declare module "*.<ext>"` declarations in `.dinou/types/routes.d.ts`.
- **RFC 9110 HTTP Byte-Range (`206 Partial Content`) Media Streaming**: Added `parseHttpByteRange` and `Accept-Ranges: bytes` / `206 Partial Content` / `416 Range Not Satisfiable` support across `dinou dev` and standalone Node.js, Bun, and Deno servers for native `<video>` and `<audio>` timeline scrubbing and Safari playback, alongside built-in MIME types for `.avi`, `.mkv`, `.mjpeg`, `.mjpg`, `.opus`, `.glb`, `.gltf`, and `.hdr`.
- **`DINOU_PUBLIC_*` Client Environment Variables & Standard `.env*` Hierarchy**:
  - Added `dinou/core/env.js` and `dinou/core/runtime-env.js` supporting the full `.env.<NODE_ENV>.local` → `.env.local` (skipped in `test`) → `.env.<NODE_ENV>` → `.env` precedence hierarchy (never overriding real OS/CLI shell variables) across all bundlers (`esbuild`, `rollup`, `webpack`), CLI commands (`dev`, `build`, `start`, `export-static`, `typegen`), and standalone Node.js, Bun, and Deno servers.
  - Added compile-time `DINOU_PUBLIC_*` inlining across Esbuild, Rollup, Webpack, and Dual-Engine SSR (`Pass B`), plus live `.env*` hot-reloading in `dinou dev` without restarting the dev server.
  - Automatic TypeScript IntelliSense augmentation for `NodeJS.ProcessEnv` in `.dinou/types/routes.d.ts` (emitting `.env*` and `.env.example` variable names without ever writing secret values) and `DinouEnv` interface for typed `getContext().env` bindings.
- **Unified TypeScript-Spec `tsconfig.json` & `jsconfig.json` Path Aliases Engine (`dinou/core/tsconfig-aliases.js`)**: Full support for multiple granular aliases (`@components/*`, `@server/*`, `@lib/*`, `@styles/*`, `@assets/*`), longest-prefix specificity sorting, exact single-file mappings, prefix/suffix wildcards, multi-target fallback arrays, recursive `"extends"` chains (including monorepo parent configs with `baseUrl`, TypeScript 5.0+ array `extends`, `node_modules` presets, and `${configDir}`), TypeScript ESM `.js` → `.ts`/`.tsx` extension substitution, `dinou.config.ts` aliased imports, and live hot-reloading of `tsconfig.json` / `jsconfig.json` in `dinou dev` across Esbuild, Rollup, and Webpack.
- **Ahead-of-Time (AOT) `dinou.config.*` Bundling Across All Runtimes & Serverless Targets**: `dinou.config.{ts,mjs,js,cjs}` and configured plugins are now statically compiled into production Node.js, Cloudflare Workers (`workerd`), Bun, Deno, standalone compiled binaries (`dist/server`), and `.dinou/dist1/server/` (`handler.js`, `netlify.js`) via `prepareDist1ServerEntries`, removing any runtime dependency on `esbuild` or raw `.ts` configuration files.
- **Live Hot-Reload for `dinou.config.*` & `dinou.setup.*` in `dinou dev`**: Editing root configuration or setup files now automatically reloads plugins, re-applies `configureServer` middlewares and listeners without duplicating event handlers, refreshes `setupFiles`, regenerates route types, and broadcasts a live client reload.
- **Normalized SPA-Safe `context.req.path` (`rawPath` & `isRscRequest`)**: `context.req.path` now normalizes internal `/____rsc_page____/*`, `/____rsc_layout____/*`, `/____rsc_payload____/*`, `/____rsc_payload_error____/*`, and `/____rsc_slot____/*` wire paths to their clean logical route pathname (e.g. `"/dashboard"`), exposing `context.req.rawPath` and `context.req.isRscRequest` on `RequestContextStore`.
- **Full `tsconfig.json` / `jsconfig.json` Alias & Extensionless Support in `setupFiles`**: `resolveSetupFiles` now resolves path aliases (`"@/polyfills"`), extensionless specifiers (`"./src/polyfills"`), and npm package subpaths across `plugin.setupFiles` and `config.setupFiles`.
- Pre-compiled `#fast-glob` and `#resolve` into `dinou/compiled/` (alongside `css-loader/runtime` —with normalized `./runtime/getUrl.js` resolution for CSS `url(...)` imports— and `mini-css-extract-plugin/hmr` CommonJS assets) and added automatic obsolete-directory pruning to `dinou/scripts/build-vendors.js`.
- **Dedicated AOT Dual-Bundle Netlify Functions v2 Output & CLI Commands**: Production builds (`dinou build`, `dinou build:node`, and new `dinou build:netlify[:esbuild|:rollup|:webpack]` commands) now emit a single-file, self-contained Netlify Functions v2 bundle at `.dinou/netlify/functions/ssr.mjs` (`config = { path: "/*", preferStatic: true }`), reducing `netlify.toml` `included_files` to `[".dinou/dist2/**"]` without bundling `node_modules/**` or `src/**`.
- **Transactional `dinou uneject [version]` Command & `"uneject"` Script**: Ejected projects can now revert back to `node_modules/dinou` in a single command (`npm run uneject` or `node dinou/cli.js uneject [version]`), automatically restoring `package.json` scripts, reinstalling `dinou` via the detected package manager (`npm`, `pnpm`, `yarn`, or `bun`) with automatic rollback if installation fails, and removing `./dinou`.

### Changed
- **Underscore (`_folder`) Directories Now Escape Routing, Bundlers, VFS & Server Functions Completely (`generate-route-types.js`, `resolve-contextual-dinou.js`, `route-generator.js`, `vfs.js`, `handler.js`, `esbuild/helpers-esbuild/get-esbuild-entries.js`, `esbuild/helpers-esbuild/swc-disk-cache.js`, `rollup/rollup-plugins/rollup-plugin-react-client-manifest.js`, `webpack/webpack.config.js`, `webpack/helpers/get-webpack-entries.js`, `node/dev.js`, `node/bundle-dual-engine.js`, `bun/build.js`, `deno/build.js`, `cloudflare/build.js`)**:
  - **Full Directory Exclusion ("Parking / Archiving")**: Previously, `_`-prefixed directories in `src/` only opted out of URL routing while still being scanned by bundlers, manifests, and the VFS. Now, any `_`-prefixed directory subtree inside `src/` (`_*/**` and `**/_*/**`) is completely excluded from file-system routing, server `routeModules`, client and server function manifests (including `ReactServerWebpackPlugin` client reference discovery and runtime manifest ingestion), CSS and static asset extraction, SWC dev disk cache (`.dinou/swc/`), VFS snapshots, live dev watchers (including live `folder` ↔ `_folder` directory rename pruning), and production builds across all bundlers and runtimes (`esbuild`, `rollup`, `webpack`, Node, Bun, Deno, and Cloudflare)—while keeping `_`-prefixed *files* inside active directories (e.g., `src/blog/_helper.ts`) valid and rejecting crafted `POST /____server_function____` calls targeting `_`-prefixed directories in `src/` with `403 { error: "Forbidden access" }`.
  - **Fallback Contextual `"./dinou"` Shims & Route Type Exclusion**: `dinou typegen` excludes `_`-prefixed directory subtrees from `.dinou/types/routes.d.ts` (so active `<Link>` references to escaped routes fail `tsc` immediately) while emitting permissive fallback `.dinou/routes/_.../dinou.{js,d.ts}` shims (`ROUTE: string`, dynamic segment parameter inference, and local sibling `@slot` prop inference) whenever an escaped subtree contains route files, omitting shims for non-route `_` folders, and pruning stale shims automatically on rename.
  - **Didactic Compile-Time Bundler Guard (`checkForbiddenUnderscoreImport`)**: Wired into `esbuildContextualDinouPlugin`, `rollupContextualDinouPlugin`, and `webpackContextualDinouPlugin` so any active module in `src/` that imports from a `_`-prefixed directory inside `src/` (via relative specifier, `@/` or `~/` path alias, or `src/...`) fails immediately at dev/build time with an actionable error explaining that `_`-prefixed folders are ignored by Dinou's router and bundlers (and that active helper folders such as `src/components` do not require a leading `_`).
- **Per-Segment `ppr` Resolution Without Parent-to-Child Inheritance (`ppr-context.js`, `render-jsx-to-client-jsx.js`, `layout-functions.js`, `get-jsx.js`, `build-static-pages.js`, `generate-static.js`, `handler.js`, `ppr-runtime.js`, `cache-revalidate.js`)**:
  - **No Cascading Inheritance Across Segments**: Removed implicit parent-to-child `ppr` inheritance from parent layouts to child layouts and pages. Each segment (`layout`, nested `layout`, or `page`) now resolves its `ppr` flag strictly from its own `layout_functions.ts` / `page_functions.ts`, falling back directly to the project-wide default in `dinou.config.*` (`ppr: false` by default, or `true` when enabled globally).
  - **Independent Per-Segment PPR Execution Scopes**: Each layout root element and page root element is now tagged with its own `effectivePpr` boolean (`markLayoutRootElement`, `markPageRootElement`) and evaluated inside its own segment-scoped `AsyncLocalStorage` context (`runInLayoutSegment`, `runInPageSegment`). On mixed-PPR routes (e.g., a `ppr = true` parent layout wrapping a `ppr = false` nested layout or page, or vice versa), `<Suspense>` boundaries inside `ppr = false` segments resolve statically at build time without registering false-positive `ppr-hole-*` placeholders, and reading dynamic request APIs (`req.cookies`, `req.headers`, `req.query`, `revalidate = 0`) inside a `ppr = false` segment (even inside `<Suspense>`) properly triggers a full-route dynamic bailout.
  - **Isolated Page Segment Rendering (`getJSX` with `{ segment: "page" }`)**: When rendering a standalone page RSC payload (`/____rsc_page____`), `getJSX` now skips traversing and executing parent layouts and `@slots`, avoiding redundant server work and preventing layout `<Suspense>` boundaries from shifting page PPR hole indices.
- **Coherent Per-Segment `allowISG` and `validateParams` Evaluation (`handler.js`, `layout-functions.js`)**:
  - **Segment-Scoped Parameter Checks (`isLayoutSegmentBlocked`)**: Layout `allowISG` and `validateParams` now evaluate along the active layout chain (`getActiveLayoutChain`, respecting `no_layout` and `reset_layout`) using only the dynamic parameters accumulated up to that layout segment (`entry.dParams`) and checking `.dinou/dist2/${cleanLayoutKey}/layout.rsc` in production.
  - **Static Layouts Ignore `allowISG = false`**: A static parent layout with no dynamic parameters of its own (`Object.keys(dParams).length === 0`) no longer blocks dynamic child pages when `allowISG = false` is set on the layout.
  - **Preserving Child Page `allowISG = true` Under Valid Dynamic Layouts**: When a dynamic parent layout (e.g. `/team/[team]` with `allowISG = false`) has a valid, pre-rendered parameter (`team = "alpha"`), it no longer overwrites `allowISGValue = false` for child dynamic pages (`/team/alpha/posts/[postId]` with `allowISG = true`), allowing new child parameters (`post-2`) to be generated and cached on-demand via ISG.
  - **Full `404` Consistency Across All Endpoints**: When any active layout segment rejects its dynamic parameter via `validateParams` or `allowISG = false`, Dinou now returns `404 Not Found` consistently across full HTML (`GET /route`), layout RSC (`GET /____rsc_layout____/route`), and page RSC (`GET /____rsc_page____/route`).
- **Physical Static Webroot Isolation (`.dinou/dist1`, `.dinou/dist3` & `.dinou/cloudflare/assets`)**:
  - Isolated `.dinou/dist3` exclusively for publicly servable static assets (`public/*`, imported `/assets/*`, hashed client JS chunks, and `styles.css`). Consolidated compiled server bundles (`.dinou/dist1/server/handler.js`, `netlify.js`, `package.json`) and **all** internal bundler/RSC manifests (`manifest.json`, `react-client-manifest.json`, `server-functions-manifest.json`, and Webpack `react-ssr-manifest.json`) directly into `.dinou/dist1` across Esbuild, Rollup, and Webpack (eliminating `.dinou/react_client_manifest` and `.dinou/server_functions_manifest`, and using `.dinou/node-dev` for optional disk manifests in dev mode). Note: Netlify deployments should point `[functions] directory = ".dinou/netlify/functions"` (via `dinou build:netlify`), or `".dinou/dist1/server"` if using the dist1 fallback entrypoint.
  - Isolated Cloudflare Workers static assets inside `.dinou/cloudflare/assets` (`[assets] directory = ".dinou/cloudflare/assets"` in `wrangler.toml`), keeping `.dinou/dist3` 100% untouched: public static files sit at `.dinou/cloudflare/assets/*` while internal `.dinou/dist2` SSG/ISR/PPR/Slot cache artifacts are isolated inside `.dinou/cloudflare/assets/__dinou_dist2/*` (returning `404` on direct external HTTP requests while read internally via `fetchCloudflareDist2Asset`).
- **Unified `public/` Directory (Removed Legacy `favicons/`)**: Standardized on `public/` at the project root as the single directory for unhashed static files across dev and production builds, removing legacy `favicons/` directory copying and watching.
- **Production CSS Minification Parity**: Standardized production `/styles.css` minification across Esbuild, Rollup, and Webpack via `esbuild.transformSync(..., { loader: "css", minify: true })`.
- **`plugin.onRequest` Build-Time SSG vs. Runtime Contract**: `plugin.onRequest` and `plugin.onRequestContext` no longer execute during build-time SSG (`platformContext.isSSG === true`), preventing auth redirects and request loggers from blocking static page generation while continuing to execute on every runtime HTTP request ahead of both dynamic routes and pre-rendered/cached SSG, ISR, and PPR routes.
- **Shared Node `configureServer` Middleware Runner (`dinou/core/node-middleware-runner.js`)**: Unified `dinou dev` and `dinou start` middleware execution with native support for synchronous, `async` Promise, and callback-async Connect/Express `(req, res, next)` middlewares (e.g. `cors`, `helmet`), `next(err)` error propagation, Socket.IO external listener hijacking, and per-plugin `configureServer` fault isolation.
- Replaced `cross-env` and `npx` shell command wrappers in `dinou/cli.js` with structured `spawnSync` step execution and direct `rollup` / `webpack-cli` JS binary resolution, enabling 100% Node-free execution in `build:node:pure:*` and `build:bun:pure:*` across Esbuild, Rollup, and Webpack.
- Removed 7 obsolete legacy packages (`dotenv`, `cross-env`, `@esbuild-plugins/tsconfig-paths`, `rollup-plugin-tsconfig-paths`, `tsconfig-paths-webpack-plugin`, `esbuild-copy-static-files`, `rollup-plugin-copy`) from `dependencies`, `#imports`, and `dinou/compiled/`, consolidating the active vendor catalog to 31 packages.
- **Selective `package.json` Script Rewriting on `dinou eject`**: `dinou eject` now only rewrites Dinou scripts that already existed in the user's `package.json` (plus adding `"build:vendors"` and `"uneject"` and removing `"eject"`), preserving custom scripts and concise `package.json` files without injecting ~150 unused script entries.
- **Friendly Already-Ejected Guard on `dinou eject`**: Running `dinou eject` inside an already-ejected workspace now exits cleanly with an informational message instead of throwing `ERR_MODULE_NOT_FOUND` or overwriting custom edits inside `./dinou`.
- **Multi-Root `build:vendors` Resolution**: `dinou/scripts/build-vendors.js` now resolves toolchain packages across `[projectRoot, dinouRoot, node_modules/dinou]`, allowing ejected projects to override dependencies in their root `package.json` and recompile `./dinou/compiled/` cleanly under `pnpm`, `npm`, `yarn`, and `bun`.

### Fixed
- **Un-awaited `Promise` Props Passed from Server Components or `getProps` to Client Components (`render-jsx-to-client-jsx.js`)**: Previously, passing an un-awaited `Promise` (or array of `Promise`s) as a prop from a Server Component (`Strategy 9`) or `getProps` (`Strategy 12`) to a `"use client"` component inside `<Suspense>` caused `asyncRenderJSXToClientJSX` to recursively `await` and unwrap the `Promise` into a plain object on the server, blocking TTFB and throwing `TypeError: An unsupported type was passed to use(): [object Object]` in the browser. `asyncRenderJSXToClientJSX` now detects thenables via `isThenable()` (while guarding against `react-server-dom-webpack` Client Reference Proxies) and preserves raw `Promise` instances untouched so React Flight streams them directly to `use(promise)` on the client.
- **PPR Dynamic Holes (`export const ppr = true`) for `<Suspense>` Wrapping Client Components with `Promise` Props (`render-jsx-to-client-jsx.js`, `ppr-runtime.js`, `edge-ssr.js`)**: Previously, on Partial Prerendering routes, `<Suspense>` boundaries only registered a dynamic PPR hole (`ppr-hole-*`) when they contained an `async` Server Component, ignoring `<Suspense>` boundaries wrapping a Client Component with an un-awaited `Promise` prop (`holes: []`). Detecting a thenable prop inside `<Suspense>` during a PPR build now triggers `markDynamicAccess("async-suspense")` to register the `ppr-hole-*` in `shell.html` and `metadata.json`, and `handlePprResume` streams the resolved hole with React 19 `<Suspense>` hydration markers (`<!--$-->...<!--/$-->`) before executing the trailing client entry `<script>` so it hydrates with zero mismatch (`#418`).
- **Duplicate Server Execution and Hydration Mismatches (`#418`) on Initial Load via Inline RSC Streaming (`get-jsx.js`, `render-jsx-to-client-jsx.js`, `handler.js`, `ppr-runtime.js`, `client.jsx`, `client-webpack.jsx`)**: Previously, on dynamic routes, PPR runtime resumes, and first-time ISG renders/bailouts, `GET /route` discarded the Flight RSC payloads after generating SSR HTML, forcing the browser to issue separate `GET /____rsc_layout____` and `GET /____rsc_page____` requests during `hydrateRoot()`. Executing Server Components, `@slots`, `getProps`, and PPR dynamic holes a second time in separate HTTP requests caused React Hydration Error `#418` whenever non-deterministic values (`Date.now()`, random IDs, or uncached `DinouCacheSlot` data) differed between the SSR HTML and the hydration RSC payloads. `getJSX` and `handlePprResume` now evaluate the layout and page trees once per request, deduplicate deferred `<Suspense>` hole promises across streams, and stream the segmented Flight payloads (`window.__DINOU_RSC_L__` and `window.__DINOU_RSC_P__`) inline inside `<script>` tags in the initial HTML response (flushed at safe `</script>` boundaries) so `hydrateRoot()` consumes them directly without extra network round-trips or double execution.
- **Hydration Mismatch (`#418`) Between Static/ISG `index.html` and Cached `layout.rsc` / `layout.static.rsc` / `page.rsc` (`handler.js`, `cache-revalidate.js`)**: Previously, when generating a static/ISG `index.html` on-demand or after `revalidatePath`, `handler.js` rendered the HTML from a newly evaluated layout instance while `/____rsc_layout_static____` served an earlier cached `layout.rsc` (or spliced live PPR holes on a `ppr = false` child page inside a `ppr = true` layout), and `/____rsc_page_static____` bypassed the cached `page.rsc` if a concurrent background ISR revalidation flipped `dynamicState.value = true`. Non-PPR static/ISG pages now compose `index.html` directly from the leaf layout's cached `layout.rsc` (or `layout.static.rsc` when the parent layout has PPR holes) plus the precomputed `page.rsc`, preserve cached `page.rsc` delivery when a static build ID (`____build_id____`) is requested, and persist `shell.page.json` atomically alongside `shell.html`.
- **Isomorphic `useSearchParams()` PPR Dynamic Holes, `DinouCacheSlot` Isolation, and Zero-`#418` Selective Hydration (`navigation.js`, `ppr-runtime.js`, `handler.js`, `request-context.js`)**:
  - **Server Components Inside `<Suspense>` on PPR Routes (`export const ppr = true`)**: Previously, `useSearchParams()` wrapped `ctx.req.query` in a bare `try / catch (e) {}` block that swallowed `Symbol.for("dinou.ppr.postpone")`, `Symbol.for("react.postpone")`, and `Symbol.for("dinou.ppr.skipStatic")`, causing `<Suspense>` boundaries calling `useSearchParams()` in a Server Component to silently freeze as empty static content (`""`) instead of registering a dynamic PPR hole (`ppr-hole-*`). `useSearchParams()` now rethrows PPR postpone and `DinouCacheSlot` skip signals (and falls back to `globalThis[Symbol.for("dinou.request.context.current")]`), registering a dynamic PPR hole when wrapped in `<Suspense>` and triggering a full-route dynamic bailout when called outside `<Suspense>`.
  - **Client Components (`"use client"`) on Static & PPR Routes**: During `handlePprResume` (`Pass B` HTML generation), `useSearchParams()` now detects Client Component SSR execution (`ctx._isPprRuntimeResume && isClientSsrRender`) and returns an empty `URLSearchParams` so `Pass B` SSR matches both the build-time `shell.html` and the cached `shell.rsc` payload (even for Client Components nested inside a dynamic Server Component `<Suspense>` hole). Similarly, lazy HTML re-composition after layout revalidation in `handler.js` now sanitizes `recomposeSimReq` (`query: {}, cookies: {}`).
  - **Selective `<Suspense>` Hydration Synchronization (`useSyncExternalStore`)**: Replaced the `document.body.dataset.hydrated` / `useEffect` check in `useSearchParams()` with `React.useSyncExternalStore(emptySubscribe, () => false, () => true)` gated on `window.__DINOU_USE_STATIC__ || window.__DINOU_PPR_RESUME__`. This prevents React 19 Hydration Error `#418` when `<Router />` commits before lazy-loaded `"use client"` chunks inside `<Suspense>` boundaries finish hydrating, while immediately synchronizing with the live URL query parameters after each boundary hydrates.
- **Production Hydration Mismatch (`#418`) in Parallel `@slot` Error Pages When Page Also Throws (`get-error-jsx.js`)**: Previously, when both a parallel `@slot` (with its own `@slot/error.tsx`) and the page threw an error in production, `getErrorJSX` sanitized the slot's `error.message` to a generic string in the SSR HTML while `/____rsc_layout____` (`getJSX`) passed `e.message || "Unknown Error"` to the slot's error page. `getErrorJSX` now preserves `e.message || "Unknown Error"` for isolated `@slot` error pages, matching `getJSX`.
- **Process-Wide `globalThis` Singletons, Cross-Bundle `DinouServerHooksDispatcher` Protection, and `ReactSharedInternals` Resolution (`ppr-context.js`, `render-jsx-to-client-jsx.js`, `revalidating.js`, `cache-slot.js`, `get-jsx.js`, `rollup.config.js`)**:
  - **Process-Wide Context & Cache Singletons**: Anchored all `AsyncLocalStorage`, `WeakMap`, `WeakSet`, `Map`, and `Set` stores in `ppr-context.js`, `render-jsx-to-client-jsx.js`, and `revalidating.js` on `globalThis[Symbol.for(...)]` and enforced mutual exclusion between `runInPageSegment` and `runInLayoutSegment`, preventing split context stores across `esbuild` code-splitting chunks during incremental HMR rebuilds in `dev:*` and between unbundled `dinou/core/*` modules and `.dinou/node/rsc-engine.mjs` during `run-ssg.js`.
  - **Cross-Bundle Dispatcher Immutability & `__SERVER_INTERNALS__` Scoping**: Marked `DinouServerHooksDispatcher` with `_dinouIsServerHooksDispatcher: true`, delegated `dinouPatchedUseId` / `dinouPatchedUse` through `globalThis[Symbol.for("dinou.server.hooks.impl")]`, and restricted `patchInternalsDispatcherSetter` strictly to `__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE` (never installing the setter on `__CLIENT_INTERNALS_...` used by `react-dom/server`), preventing cross-bundle `useId()` corruption (`_page_dS_*` leaking into layouts/slots) and preserving native `_R_...` SSR hydration IDs for `"use client"` components in development mode.
  - **Bundler-Clean CJS `react` & `@roggc/react-server-dom-esm` Resolution**: Updated `getReactInternalsList()` to resolve `node_modules/react/index.js` and `node_modules/react/react.react-server.js` via `req.resolve("react/package.json")` (bypassing `"exports"` subpath encapsulation without triggering Webpack `Critical dependency` warnings), updated `@roggc/react-server-dom-esm/server.node` subpath imports, and silenced Rollup `MODULE_LEVEL_DIRECTIVE` warnings on `"use client"` / `"use server"` directives.
- **Deterministic Multi-Branch Backtracking, Specificity Precedence, and Boundary/Layout Resolution in the File-System Router (`get-file-path-and-dynamic-params.js`, `discover-layouts.js`, `vfs.js`, `client.jsx`, `client-webpack.jsx`, `handler.js`, `get-error-jsx.js`)**:
  - **Backtracking & Tier Precedence**: Replaced greedy single-pass directory matching with full multi-branch backtracking and deterministic specificity tiers (`static` > `[param]` > `[[optional]]` > `[...catchAll]` > `[[...optionalCatchAll]]`), sorting `readdirSync` and VFS directory entries lexicographically (`vfs.js`) for OS-independent routing.
  - **Route Groups `(group)`, Syntax Hardening & Scoped Boundaries**: Fixed backtracking across multiple sibling `(group)` folders and nested `(outer)/(inner)` group chains; blocked literal router syntax segments (`(group)`, `[param]`, `@slot`, `_private`, raw or URL-encoded) in incoming request paths; and scoped `no_layout`, `reset_layout`, `error.tsx`, and `not_found.tsx` resolution strictly along the matched route lineage (passing `slotParams` when resolving `@slot/error.tsx`).
  - **Client SPA Active Layout Key Resolution (`getLayoutKey`)**: Added pattern-based page layout rules (`discover-layouts.js`) consumed by `client.jsx` and `client-webpack.jsx` so SPA transitions into `(group)` routes with `no_layout`, optional `[[param]]`, or catch-all segments compute the exact active layout key without mismatched `/____rsc_layout____` fetches.
- **Static Path Composition & On-Demand Route Resolution in Static Generation (`build-static-pages.js`)**: Fixed `collectPages` when nested `getStaticPaths` return primitive values or catch-all arrays beneath intermediate static segments (`STATIC_PARAM_NAME` preservation, leaf `targetParamName` binding, and `!Array.isArray(pathItem)` guard), replaced manual folder walking in on-demand `buildStaticPage(reqPath)` with `getFilePathAndDynamicParams(...)` so `(group)`, optional, and catch-all routes resolve identically to runtime requests, and passed `slotParams` to `@slot/error.tsx` during SSG.
- **Mixed Per-Segment PPR Dynamic Bailout & `noDynamic()` Layout Refresh Splicing (`handler.js`, `generate-static.js`, `get-jsx.js`)**: Prevented persisting or splicing cached PPR shells (`!rscDynamicState.value` / `!dynamicState.value` in `handler.js`, `layoutMeta.ppr = false` on `X-Dinou-Dynamic: true` in `generate-static.js`) when an outer `ppr = false` layout bails out dynamically (e.g., reading `req.cookies` inside `<Suspense>`) above a `ppr = true` nested layout or page, and passed `skipLayoutProbe: true` during `spliceDynamicHolesIntoShell` (`handler.js`, `get-jsx.js`) so `noDynamic()` static `<Suspense>` boundaries in `ppr = true` layouts and `@slots` are not re-executed on `router.refresh({ layout: true })`.
- **Duplicate DOM Nodes When Client Router Transitions Preempt Deferred Streaming SSR `<Suspense>` (`$RB` / `$RV`) Completion (`slot.js`, `client.jsx`, `client-webpack.jsx`)**: Previously, when `<Router />` hydrated its outer shell while a streaming SSR `<Suspense>` boundary (`$RC`) had queued its `<template id="B:N">` and `<div hidden id="S:N">` pair in `window.$RB` awaiting React DOM's deferred `$RV` pass, triggering an immediate `router.refresh(...)`, `navigate(...)`, or `popstate` transition swapped in a new RSC `<Suspense>` fiber and detached `<template id="B:N">` before `$RV` ran—leaving a stale duplicate SSR DOM subtree mounted alongside the newly committed RSC content. Added `flushPendingSsrStreams()` before client router transitions (`navigate`, `refresh`, and `popstate`) so ready `$RB` boundaries swap cleanly into the live DOM prior to fiber replacement, and `pruneOrphanedSsrStreams()` in `useLayoutEffect` to purge any orphaned `<div hidden id="S:...">` nodes whose `<template id="B:...">` markers were already detached.
- **Stylesheet HMR Hydration Race Condition Under Concurrent Load (`esbuild/react-refresh/esm-hmr/client.js`, `rollup/react-refresh/esm-hmr/client.js`)**: Deferred `<link rel="stylesheet">` cache-busting (`?t=...`) mutations on `style-update` HMR messages until `document.body[data-hydrated="true"]` (with a 3s fallback), preventing React Hydration Error `#418` on `<link precedence="default">` elements when file watchers emit CSS updates while a page is mid-hydration.
- **Client Router `fresh` Navigation & Browser Subresource Cache Bypass (`client.jsx`, `client-webpack.jsx`)**: `navigate(href, { fresh: true })` (`<Link fresh>` and `router.push(url, { fresh: true })`) now increments the client router `version` counter (`?____v____=<n>`) inside `startTransition`—matching `router.refresh()` so same-route `fresh` navigations re-evaluate `pagePromise` without invalidating server-side SSG/ISR caches—and `getPagePayload` / `getLayoutPayload` now pass `{ cache: "no-store" }` to `fetch(...)` to prevent browser in-memory caches (notably WebKit) from reusing prior RSC responses outside `pageCache` and `layoutCache`.
- **`AsyncLocalStorage` Request Context Isolation When Streaming Server Components Returned by Server Functions (`handler.js`)**: Wrapped `pipeRSC(returnValue, ...)` in `POST /____server_function____` (as well as `renderRSCStream(errorJsx, ...)` in the SSR error fallback) inside `requestStorage.run(context, () => ...)`. Previously, `pipeRSC` ran outside the `AsyncLocalStorage` scope after `await fn(...args)` resolved, causing async Server Components (and nested `<Suspense>` Server Components) returned by `"use server"` functions to lose their `AsyncLocalStorage` store across `await` boundaries and fall back to the shared `getCurrentContext()` pointer under concurrent requests.
- **Type-Safe Optional Catch-All (`[[...slug]]`) Runtime vs. Navigation Params**: Updated route type generation (`dinou/core/generate-route-types.js`) and fallback parameter inference (`dinou/index.d.ts`, `dinou/server.d.ts`) so received segment `params` in `PageProps`, `LayoutProps`, `SlotProps`, `ErrorProps`, `NotFoundProps`, and `PageFunctions` / `LayoutFunctions` lifecycles (`getProps`, `validateParams`, `getCacheTags`) are strictly typed as `string[]` (matching Dinou's runtime `[]` normalization on base routes without `undefined` checks), while keeping `[[...slug]]` optional in `<Link params>`, `router.push` / `router.replace`, and `getStaticPaths` parameter objects.
- **`getStaticPaths` Strict Type Checking for Optional & Numeric Segments**: Refined `StaticPathItem`, `StaticPathParams`, and contextual `"./dinou"` `PageFunctions` / `LayoutFunctions` definitions so `undefined` entries (e.g. `[undefined, "electronics"]` to pre-render the base route) compile cleanly under `strict: true` when all dynamic segments in the route are optional (`[[param]]`, `[[...slug]]`), while remaining disallowed on routes with required dynamic segments, and allowed `number` values alongside `string` inside `getStaticPaths` parameter objects.
- **False Dynamic Bailout on Client `useSearchParams()` in ISG & ISR**: Fixed a server-rendering bug where calling `useSearchParams()` inside a `"use client"` component accessed `ctx.req.query` through `createBailoutProxy` during React Fizz HTML SSR (`renderHtmlStream`), falsely flagging the render as dynamic. Client Components calling `useSearchParams()` no longer prevent on-demand ISG pages from caching to storage or de-optimize static ISR routes into permanent Dynamic SSR during background revalidation, while Server Components calling `useSearchParams()` continue to trigger Automatic Static Bailout (or register Dynamic PPR Holes inside `<Suspense>`) as intended.
- **Multi-Value & Empty-String Query Parameters in `req.query` and `useSearchParams()` SSR Hydration (`handler.js`, `navigation.js`)**: Fixed `req.query` parsing in `handler.js` where `Object.fromEntries(url.searchParams.entries())` overwrote repeated query keys with only the last value instead of accumulating `string[]` arrays as declared by `Query` (`Record<string, string | string[] | undefined>`, while ignoring `__proto__`), and updated server-side `useSearchParams()` serialization (`queryObjectToURLSearchParams`) in `navigation.js` to preserve empty-string values (`?key=` where `val === ""`) instead of dropping falsy strings—preventing React hydration mismatches during `dev` and live dynamic SSR when URLs contain repeated (`?tag=a&tag=b`) or empty (`?empty=`) query parameters.
- **Windows File-Lock Resilience & Dev Watcher Route-Type Sync (`generate-route-types.js`, `node/dev.js`)**: Hardened `generateRouteTypes` on Windows against transient `EPERM`/`EBUSY` file locks (caused by TypeScript language servers, `tsconfig` path resolvers, or real-time file scanners during live directory renames) by using `fs.rmSync` with built-in retries and scheduling non-blocking `.unref()` deferred retries when writing `.dinou/types/routes.d.ts` or pruning stale `.dinou/routes/**/dinou.{js,d.ts}` shims, and updated `generateEntryFiles()` in `node/dev.js` so `dev:rollup` and `dev:webpack` also re-synchronize route types during debounced structural rebuilds.
- **False Dynamic Bailout on `<Suspense>`-Wrapped `<DinouCacheSlot>` in ISG (`ppr = false`)**: Fixed a bug in `DinouCacheSlot` where checking for incoming URL query parameters (`Object.keys(reqCtx.req.query)`) inside a runtime `<Suspense>` boundary accessed `req.query` through `createBailoutProxy` (`ownKeys` trap), falsely triggering Automatic Static Bailout even when no query parameters were present. Non-PPR on-demand ISG routes (`ppr = false`) wrapping `<DinouCacheSlot revalidate >= 1>` inside `<Suspense>` now cache cleanly to storage (`index.html` + `slots/<id>/slot.json`), preserve `isDynamic === false` across unread marketing query strings (`?utm_source=...`), and refresh Micro-ISR slots independently without re-rendering the parent page. Also unwrapped internal `req.headers` inspection in `normalizeRevalidatePath` and tightened `DinouCacheSlotProps` TypeScript types from `any` to `ReactNode`.
- **Server Functions (UI Component Streaming `callServer`)**: Fixed `createServerFunctionProxy` (`dinou/core/server-function-proxy.js` and `dinou/core/server-function-proxy-webpack.js`) omitting the `{ callServer }` option when decoding `text/x-component` Flight streams via `createFromFetch`, which previously caused nested Server Functions inside streamed JSX / async Server Components to throw `Trying to call a function from "use server" but the callServer option was not implemented in your router runtime`.
- **Server Functions (`export default` Support Across Compilers)**: Fixed a Babel AST crash in `transformServerFunctions` when using function-level `"use server"` on `export default` functions, and registered `default` Server Function exports with `registerServerReference` across all server/SSR build pipelines (`node`, `dev`, `cloudflare`, `bun`, and `deno`) so default-exported actions can be passed from Server Components as well as imported in Client Components.
- **Server Functions (Windows Manifest Casing in Rollup & Webpack)**: Fixed Rollup and Webpack `serverFiles` discovery lowercasing full filesystem paths on Windows, which previously wrote lowercase keys into `server-functions-manifest.json` and caused `400 Invalid export name` rejections on mixed-case dynamic routes (e.g. `[userId]`) or camelCase action files; added a case-insensitive manifest and route-module lookup fallback in `handler.js` and `import-module.js`.
- **Relative Path Resolution in `revalidateLayout` & URL Helpers**: Fixed `revalidateLayout("./")`, `revalidateLayout("..")`, and relative sibling paths (`revalidateLayout("../billing")`) failing inside Server Functions due to bypassing `normalizeRevalidatePath`; stripped `?query` and `#hash` suffixes from base paths in `normalizeRevalidatePath` and `resolveRelativeUrl` before resolving relative segments so `"./"` never resolves to the parent directory; and prevented `normalizeRevalidatePath` from falling back to `"/____server_function____"` when neither `x-dinou-current-path` nor `Referer` is present.
- **`RedisStorage` Tag Revalidation, Key Normalization & Cluster Tombstones**: Implemented `RedisStorage.keys(prefix)` across `node-redis` v4/v5 (`scanIterator`), `ioredis` (`scanStream`), Upstash (`keys`), and cursor `scan` clients so `revalidateTag()` works out of the box on Redis; normalized Windows backslashes (`\` -> `/`), leading/trailing slashes, and `route` <-> `route/index.html` / companion metadata keys across storage adapters; added options object support (`new RedisStorage(client, { prefix, hydrateFromDisk })`); and added Redis-backed deletion tombstones and tag invalidation timestamps so multi-pod clusters never resurrect invalidated `.dinou/dist2` artifacts.
- **`DinouConfig.storage` Typing, Runtime Binding, SSG Isolation & `.dinou/dist2` Hydration**: Added `storage?: StorageAdapter` to `DinouConfig` TypeScript definitions; guarded runtime `initStorage()` across Node, Bun, Deno, and Cloudflare entrypoints from overwriting custom storage adapters; isolated `generateStatic()` (`__DINOU_IS_SSG_BUILD__`) so build-time SSG always writes to `.dinou/dist2` without polluting live `RedisStorage` instances; and added lazy `.dinou/dist2` hydration (`readDist2Fallback`) for cold distributed storage pods while keeping `MemoryStorage` isolated by default for unit testing.
- **Standalone / Vitest Revalidation Crashes (`ReferenceError: getBuildStaticPage is not defined`)**: Unified `revalidatePage`, `revalidatePath`, `revalidateLayout`, and `revalidateTag` onto `getStorageAdapter()` across all runtimes, cleanly evicting cached entries in standalone test/worker environments instead of calling removed legacy build helpers.
- **3D Slot Splicing on Cold Distributed Pods & Host Segment ISR TTL Preservation**: Preserved `shell.page.json` / `shell.layout.json` and `*metadata.json` lookup across `.dinou/dist2` during slot-only tag invalidations (`onlyRefreshSlots: true`) without clobbering updated runtime metadata, and preserved `pageGeneratedAt` / `layoutGeneratedAt` during slot-only splices so frequent `<DinouCacheSlot>` refreshes never starve host `page.tsx` or `layout.tsx` time-based ISR TTLs.
- **Per-Parameter `getCacheTags(params)` Isolation on Dynamic Routes**: Fixed `pageFunctionsConfigCache` caching the evaluated `getCacheTags(params)` array from the first rendered parameter on dynamic routes (e.g. `[slug]`) and reusing it for all subsequent dynamic parameters during SSG and ISG, ensuring `revalidateTag()` accurately targets each parameter's own cache tags.
- **Cold-Start `<DinouCacheSlot>` Discovery Isolation & False ISR Bailout Prevention**: Scoped `slotRegistry` nested-slot discovery to matching route hierarchies first, isolated slot discovery and cold route pre-evaluation inside a side-effect-free `requestStorage` + PPR context, and guarded `createBailoutProxy`, `revalidatePage`, `revalidateLayout`, and request `markDynamic` checks while `isSlotDiscoveryActive()` is active so dynamic `req.cookies` / `req.headers` / `req.query` or `res.*` accesses in other routes' slots never poison `onlyRefreshSlots` revalidations or downgrade static/ISR pages to Dynamic SSR.
- **Ancestor-First Layout `<DinouCacheSlot>` Tag Revalidation & Child Layout Shell Isolation**: Sorted `FileSystemStorage.keys()`, `.dinou/dist2` metadata walks, SSG layout pre-rendering, and `revalidateTag()` layout queues in deterministic ancestor-first order so OS filesystem entry ordering (such as Linux `ext4` `htree`) or sibling directory names never stamp parent layouts newer than their descendants during slot refreshes; separated ancestor full-layout generation (`layoutGeneratedAt`) from slot-only splices (`generatedAt`) across cached HTML, `____rsc_layout____`, and `revalidatePage()` chains so refreshing a parent layout `<DinouCacheSlot>` splices child `shell.layout.json` artifacts without re-executing child `layout.tsx` components; and mapped `shell.layout.json` companion metadata to `layout.metadata.json` in `FileSystemStorage`.
- **Progressive `<Suspense>` Streaming in Production on Dynamic SSR Routes**: Removed the unconditional `process.env.NODE_ENV === "production"` eager-resolution guard in `asyncRenderJSXToClientJSX` (`dinou/core/render-jsx-to-client-jsx.js`) and replaced it with context-aware dynamic streaming detection (`shouldStreamDynamicSuspense`). Dynamic SSR routes (`revalidate = 0`, prior dynamic bailout via `cookies`/`headers`/`query`, URLs carrying `?query` parameters inspected via `unwrapBailoutProxy` without tripping `BailoutProxy`, and `POST /____server_function____` contexts) now flush the initial HTML/RSC shell and `<Suspense fallback>` immediately in production via `DinouSuspenseHoleBoundary`, while SSG builds, ISR/tag background revalidations, PPR shell builds, and clean ISG candidate routes continue settling `<Suspense>` boundaries eagerly into static HTML without skeleton flashes.
- **Direct `Promise<ReactNode>` JSX Children Across PPR, SSG, Streaming SSR & `<DinouCacheSlot>`**: Fixed `asyncRenderJSXToClientJSX` (`dinou/core/render-jsx-to-client-jsx.js`) and PPR hole traversers (`spliceDynamicHolesIntoShell` and `streamDynamicHoles` in `dinou/core/ppr-runtime.js`) so direct `Promise<ReactNode>` expressions in Server JSX (such as `<Suspense fallback={<Skeleton />}>{getMetricsTable()}</Suspense>` and `<DinouCacheSlot id="metrics">{getMetricsTable()}</DinouCacheSlot>`) properly register `ppr-hole-*` boundaries during PPR builds, await and recursively transform resolved Server Component subtrees (including slot/hole-scoped `useId()`), and serialize resolved DOM trees into `slot.json` instead of `{}`—while preserving raw un-awaited `Promise` props passed to `"use client"` components for non-blocking React 19 `use(promise)` Flight streaming.
- **Pass B (`ssr-engine`) Server Reference Isolation Across All Runtimes**: Fixed `serverReferencesPluginSsr` and `ssr-client-manifest` across `node/dev.js`, `node/bundle-dual-engine.js`, `cloudflare/build.js`, `bun/build.js`, and `deno/build.js` so `"use server"` implementations, server-only imports (`import "server-only"`), and server module state are never bundled into or executed inside the browser-conditioned Client SSR engine. SSR server references now emit pure canonical `registerServerReference` stubs (`file:///src/...#action`) that defer in-render client RPC calls (`useState(() => fetchServerFn())` + `use()`) cleanly to client `<Suspense>` mount via React 19's `Symbol.for("react.recoverable")` digest without server `onError` noise, SSG hangs, hydration warnings, or leaked filesystem paths in `<form action>` hidden inputs.
- **Server Function Error Message & `digest` Propagation**: Fixed `dinou/core/server-function-proxy.js`, `dinou/core/server-function-proxy-webpack.js`, and `dinou/core/handler.js` so errors thrown inside `"use server"` functions preserve their `error.message` and optional `error.digest` on rejected client Promises instead of always throwing `"Server function failed"`.
- **Rollup Client Manifest `#default` Parity**: Updated `rollup-plugin-react-client-manifest.js` (`setManifestEntry`) to register both `fileUrl` and `${fileUrl}#default` (plus Windows drive-letter variants) for default-exported `"use client"` components, matching `esbuild` and `webpack`.
- **Esbuild React Compiler Full Client Subgraph Compilation**: Fixed `babelReactCompilerPlugin` in `dinou/esbuild/plugins-esbuild/babel-react-compiler-plugin.js` where an `isAnEntryPoint` guard caused child components and custom hooks without their own `"use client"` directive to skip `babel-plugin-react-compiler` in production builds, while unnecessarily compiling Dinou's own ejected runtime files. Moved `babelReactCompilerPlugin` after `serverFunctionsPlugin` in `get-config-esbuild-prod.js` and added defense-in-depth `"use server"` guards plus `@babel/plugin-syntax-import-meta` parity.
- **Rollup Production `"use server"` Pre-Transform Ordering**: Updated `dinou/rollup/rollup-plugins/rollup-plugin-server-functions.js` to run `transform` with `order: "pre"`, ensuring module-level and inline `"use server"` functions are converted into lightweight RPC proxies before `babel-plugin-react-compiler` processes the client module graph.
- **Vendorized Babel & React Compiler Resolution Across All Bundlers**: Replaced bare string plugin/preset/loader specifiers in Esbuild, Rollup, and Webpack configs with direct subpath imports (`#babel/preset-react`, `#babel/preset-typescript`, `#babel/plugin-syntax-import-meta`, `#babel-plugin-react-compiler`, `#babel-loader`, `#rollup-plugin-delete`) so strict `pnpm` installations and ejected projects require zero hoisted Babel packages.
- **Multi-Bundler `public/` Parity**: Replaced `rollup-plugin-copy` (which flattened nested subdirectories in `public/**/*`) with recursive `copyStaticDirectoriesToOutdir` and enabled `dot: true` in Webpack's `CopyWebpackPlugin` so nested directories, filenames with spaces, and `public/.well-known/*` behave identically across Esbuild, Rollup, and Webpack.
- **Cloudflare Workers `public/` Asset Routing**: Fixed `dinou/adapters/cloudflare.js` and `dinou/cloudflare/build.js` so `public/*` files of all extensions (`/sitemap.xml`, `/docs/*.pdf`, `/media/*.mp4`, `/google*.html`, `/.well-known/*`, `/manifest.json`) are served via `env.ASSETS` instead of falling through to the RSC router as `404`, and removed the obsolete `.assetsignore` hack that previously blocked user `/manifest.json` uploads.
- **Dev vs Build Manifest Isolation**: Guarded `dinou/core/get-asset-from-manifest.js`, `dinou/core/manifest-provider.js`, `dinou/node/bundle-dual-engine.js`, and `dinou/node/dev.js` so `dinou dev` reads disk fallback manifests strictly from `.dinou/node-dev` while `dinou build` writes and reads strictly from `.dinou/dist1`.
- **Windows Drive-Letter Case Determinism in `createScopedName`**: Normalized `src` context and file paths in `dinou/core/createScopedName.js` so CSS Module class hashes match 100% regardless of Windows uppercase/lowercase drive letters (`C:\` vs `c:\`) or path separators.
- **Incremental Dev CSS Preservation & Tailwind v4 `.tsx` Refresh**: Fixed Esbuild's `postcss-extract-plugin.js` and Rollup's `rollup-plugin-react-client-manifest.js` wiping unchanged global stylesheets on incremental rebuilds, and added automatic Tailwind v4 stylesheet re-evaluation when `.tsx`/`.jsx` files add new utility classes.
- **JSONC `tsconfig.json` Comments, Trailing Commas & Webpack CSS `@import` Aliases**: Fixed `tsconfig.json` parsing with comments and trailing commas in `get-abs-path-with-ext.js` and `get-config-esbuild-prod.js`, and wired `postcss-import` alias resolution into both `.css` and `.module.css` rules in Webpack.
- **Server Component Stylesheet Discovery**: Fixed `Set.prototype.add(...arr)` dropping multiple CSS imports in a single Server Component, added `error.tsx` and `not_found.tsx` CSS discovery, supported bare `node_modules` stylesheet imports (e.g. `import "katex/dist/katex.min.css"` and `"style"` export conditions) in Server Components, and removed blind compilation of unimported `.css` files in Esbuild.
- **Deterministic `public/styles.css` Coexistence & Collision Protection**: Fixed `postcss-extract-plugin.js` shadowing static `public/styles.css` with an empty in-memory buffer when no CSS is imported in `src/`, and prevented `copyStaticDirectoriesToOutdir` / `CopyWebpackPlugin` from overwriting compiled `/styles.css` in production builds when both `public/styles.css` and `src/` CSS imports exist (emitting an explicit collision warning across Esbuild, Rollup, and Webpack while preserving nested `public/<dir>/styles.css` files).
- **Dev Fast Refresh / HMR initialization race (`dev:esbuild` & `dev:rollup`)**: Enforced deterministic ESM evaluation order by prepending `import "/runtime.js";` to `/main.js` and hardened Esbuild's React Refresh module wrapper (`$RefreshSig$` / `$RefreshReg$`) with safe fallbacks so client components with hooks never crash with `TypeError: $RefreshSig$ is not a function` on fast reloads (`F5`).
- **ISR background revalidation hydration race (`React error #418`)**: Preserved freshly regenerated `layout.rsc` payloads across 2-cycle ISR revalidations instead of deleting them mid-flight when a concurrent request reads a newly written `index.html`.
- **Content + Path Asset Fingerprinting (`/assets/[name]-[hash].[ext]`)**: Replaced path-only `createScopedName` asset naming with an OS-independent SHA-256 digest of `relPosixPath + "\0" + fileBytes`, preventing stale 1-year `immutable` browser/CDN caches when media files are updated at the same path while preserving zero-collision folder scoping and deduplicating CSS `url(...)` and JS/TS imports.
- **Full Bundler & Runtime Asset Parity (Esbuild, Rollup, Webpack × Node, Bun, Deno, Cloudflare)**: Fixed `swcRedirectPlugin` crashing `dinou dev:esbuild` on relative asset imports inside `"use client"` components; fixed Webpack production builds and Rollup incremental watch rebuilds dropping assets imported exclusively in Server Components; replaced `dataurl` asset loaders in Cloudflare Workers, Bun, and Deno builds with `createServerAssetPlugin` (eliminating SSR hydration mismatches, Base64 Worker bloat, and `No loader is configured` crashes on `.mp4`/`.avif`/`.gif`/`.webm`/audio files); unified custom `tsconfig.json`/`jsconfig.json` path aliases and `node_modules` asset resolution; and wired live asset rebuilds in `dinou dev`.
- **Cloudflare Workers static asset `Content-Type` fallback (`cloudflare/build.js` & `adapters/cloudflare.js`)**: Populated missing or generic `application/octet-stream` `Content-Type` headers from `env.ASSETS.fetch` via `getStaticContentType` so formats omitted by Wrangler's built-in MIME table (such as `.hdr` or custom `assetExtensions`) serve deterministic MIME headers at the edge.
- **Multi-batch dev HMR / reload broadcast preservation (`dinou/node/dev.js`)**: Accumulated pending `reload`, `style-update`, and `rsc-update` notifications across consecutive Chokidar rebuild batches so structural or Server Component updates (such as injecting a new `"use server"` action alongside a Client Component edit) are never dropped when file-watcher events split across sequential rebuild iterations.
- **Environment Variable Loading, SSR Secret Isolation, Unified `getContext().env` & Anti-Bot Shield**:
  - Fixed a regression where `.env` files were ignored in `dinou dev` (`esbuild` & `rollup`), `dinou build` (`esbuild` & `rollup`), `dinou start`, `dinou export-static`, Deno builds, and `dinou dev:webpack` port selection.
  - Fixed a critical SSR/SSG security leak and client hydration crash where accessing unprefixed `process.env.*` inside `"use client"` components leaked server secrets into Pass B SSR/SSG HTML and threw `ReferenceError: process is not defined` in browsers across Esbuild, Rollup, and Webpack.
  - Unified `getContext().env` via a live zero-copy `Proxy` (`createUnifiedEnv`) so plain-text secrets and Cloudflare Workers bindings (KV, D1, R2) resolve consistently across Cloudflare Edge, Node.js, Bun, Deno, Netlify, and SSG, synced Edge string bindings onto `process.env`, wrapped `plugin.onRequest` and `page_functions` / `layout_functions` config hooks in `AsyncLocalStorage`, and fixed `getContext()` TypeScript return type (`RequestContextStore`).
  - Hardened the Anti-Bot Shield and static build pipelines to block `.env.*` and percent-encoded probes (`/.env.production`, `/%2eenv`, `/.%65nv`) with `404` before routing/ISG and physically exclude any accidental `public/.env*` files from `.dinou/dist3`, `.dinou/cloudflare/assets`, and `out/`.
- **Custom Path Aliases in `dinou dev` & Edge/Server Runtimes**: Fixed `createDevExternalPackagesPlugin` in `dinou/node/dev.js` and hardcoded `commonAlias` maps in `node`, `cloudflare`, `bun`, `deno`, `esbuild/build.js`, and `rollup/rollup.config.js` (`serverConfig`) where any alias other than `@/*` was treated as an external `node_modules` package and crashed at runtime with `ERR_MODULE_NOT_FOUND`.
- **Aliased Stylesheet & CSS Module Imports in Rollup & Esbuild Prod**: Replaced `rollup-plugin-tsconfig-paths` and `@esbuild-plugins/tsconfig-paths` (which delegated to TypeScript's JS-only module resolver and failed on `.css` / `.module.css` imports and `jsconfig.json` projects) with Dinou's unified alias plugins.
- **Esbuild Dev `.dinou/swc` Mirror Resolution with Explicit `baseUrl`**: Fixed `get-config-esbuild.js` resolving `.dinou/swc` mirror targets relative to `compilerOptions.baseUrl` (which broke projects setting `"baseUrl": "./src"`), and isolated SWC compilation from disk `mkdir` retries in `swc-disk-cache.js`.
- **Underscore (`_folder`) Escape Enforcement Across Custom Aliases**: Updated `checkForbiddenUnderscoreImport` in `dinou/core/resolve-contextual-dinou.js` so custom `tsconfig.json` / `jsconfig.json` aliases pointing into `_`-prefixed directories under `src/` are blocked consistently across all bundlers.
- **Background ISR TTL Commit Timestamp & In-Flight RSC Deduplication**: Fixed `revalidatePage` in `dinou/core/cache-revalidate.js` stamping `generatedAt` / `pageGeneratedAt` at the start of rendering instead of at causal commit time (which subtracted slow SSR/render latency from the route's `revalidate` TTL and could prematurely trigger back-to-back background regenerations under heavy load while keeping `window.__DINOU_BUILD_ID__` synchronized), and unified trailing-slash `regenerating` key checks in `dinou/core/handler.js` so concurrent RSC requests serve stale cached payloads instead of firing duplicate revalidations.
- **Automatic `x-rsc-redirect` Translation for `onRequest` Redirects on `<Link>` Navigations**: Returning a `3xx` `Response.redirect(...)` (or calling `context.res.redirect(...)`) inside `onRequest` during client-side RSC fetches (`/____rsc_page____/*` and `/____rsc_layout____/*`) now translates cleanly into an `x-rsc-redirect` response (preserving `Set-Cookie` headers) across Esbuild, Rollup, and Webpack instead of feeding redirected HTML into React's Flight stream parser.
- **`context.res` Mutations Preserved in `onRequest` & PPR Resume**: Fixed `context.res.redirect()` not halting `onRequest`, prevented default `200` status and `Cache-Control: no-store` from overwriting explicit `context.res.status()` / `context.res.setHeader("Cache-Control", ...)` calls, preserved `bridge.cookies` in `handlePprResume`, and merged accumulated `context.res` headers and cookies onto returned `Response` instances.
- **Single-Execution Guarantee for `setupFiles`**: Removed duplicate `inject: setupFiles` across Pass B and Pass C so initialization side effects (such as `Sentry.init()` or OpenTelemetry SDK registration) execute once at Line 1 rather than three times per isolate boot or twice per HMR save.
- **Rollup `.dinou/dist1` Cleanup Ordering**: Moved production `.dinou/dist1` cleanup in `dinou/rollup/rollup.config.js` ahead of `prepareDist1ServerEntries` so Rollup's `buildStart` hook no longer deletes generated server bootstrap entries before `serverConfig` runs.
- **Windows Drive-Letter Casing in `<script type="importmap">` Generation**: Normalized Windows `file:///X:` drive-letter prefix stripping across Node Dual-Engine, Bun, Deno, Cloudflare Workers, and `dinou dev` so lowercase drive-letter entries (`file:///d:/...`) emitted by Rollup on Windows no longer leak absolute build-machine `file:///` paths into HTML import maps (while keeping all directory and file paths strictly case-sensitive across Linux, macOS, and Windows).
- **`<Link>` Hover-Prefetch & Parallel Segment `x-rsc-redirect` Race Conditions (`client.jsx`, `client-webpack.jsx`)**: Fixed client-side RSC redirects (`x-rsc-redirect`) where clicking a `<Link>` while its hover-prefetch was still in flight suppressed the redirect and stalled navigation, hovering a `<Link>` to a route with a redirecting layout prematurely redirected without a click, or parallel `layout` + `page` RSC fetches triggered duplicate stale redirects.
- Declared `@babel/generator`, `@babel/types`, `fast-glob`, and `resolve` as direct dependencies in `package.json` and `dinou/package.json`, and switched `dinou/node/dev.js`, `dinou/webpack/webpack.config.js`, and core/bundler entry helpers to Dinou-scoped module resolution (`#chokidar`, `#css-loader`, `postcss-loader`, `#fast-glob`, `#resolve`) for strict `pnpm` compatibility.
- Fixed Webpack 5.112+ `react-server-dom-webpack/plugin` loading under Bun (`build:node:pure:webpack`, `build:bun:pure:webpack`) via `loadReactServerWebpackPlugin()` in `dinou/webpack/helpers/patch-webpack-internals.js`.
- Fixed `-u` / `--unvendorized` / `DINOU_UNVENDORIZED=true` activation (including `.env*` files) under Bun, `dinou typegen -u`, `export-static.js`, and `run-ssg.js` by passing `--conditions=unvendorized` in `execArgv` while preserving existing `process.execArgv` flags.
- Fixed missing `DINOU_BUILD_TOOL=rollup` propagation across Node, Deno, and Bun build/SSG/start commands (plus explicit `DINOU_BUILD_TOOL=esbuild` propagation in Esbuild SSG), and removed unused dev-only `react-refresh` entrypoints (`runtime`, `react-refresh-entry`) from Esbuild production builds.
- **Netlify Functions v2 & `.dinou/dist1/server/` Dynamic SSR, `.tsx` Routes & Read-Only Lambda Compatibility**: Migrated `.dinou/netlify/functions/ssr.mjs`, `.dinou/dist1/server/{netlify.js,handler.js}`, and `dinou/adapters/netlify.js` to Dinou's AOT Dual-Bundle Engine (`rsc-engine` + `ssr-engine`) with `MemoryStorage({ hydrateFromDisk: true })` by default, `Netlify.env` unification, and `context.waitUntil()` ISR support—eliminating `500 Internal Server Error: No renderer available` on dynamic/404 routes, runtime `.tsx` import crashes without `--conditions=react-server`, and `EROFS` errors on AWS Lambda's read-only `/var/task` filesystem across Esbuild, Rollup, and Webpack.
- **Multi-Bundle React Dispatcher Isolation**: Scoped `globalThis.__DINOU_EDGE_RENDERER__` and `globalThis.__webpack_require__` per `handleRequest()` and `renderHtml()` invocation across Node, Netlify, Cloudflare, Bun, and Deno Dual-Bundles so multiple compiled bundles loaded in the same process never collide on internal `React` hook dispatchers.
- **Cloudflare, Bun & Deno Runtime Adapters (`dinou/adapters/{cloudflare,bun,deno}.js`)**: Updated `dinou/adapters/cloudflare.js` to delegate to `.dinou/cloudflare/worker.js` and preserve explicit storage adapters; propagated `HOST` (`hostname`) and enforced fail-fast non-zero exit codes when `dinou start:bun` or `dinou start:deno` are invoked without a prior production build.
- **Guaranteed `.dinou/dist2` Directory & Nested `.dinou` Esbuild Server Functions Guard**: `generate-static.js` now always creates `.dinou/dist2` even for 100% dynamic apps (preventing Docker `COPY` / Netlify `included_files` failures), `readDist2Fallback` falls back to `Deno.cwd()`, and Esbuild's `serverFunctionsPlugin` checks `.dinou/` relative to the project root instead of matching parent directory substrings.
- **Live Ejected Module Resolution Across `pnpm` / `yarn` & Webpack `"dinou/config"`**: Esbuild, Rollup, and Webpack now resolve `"dinou"`, `"dinou/server"`, `"dinou/config"`, and `"dinou/adapters/*"` directly to `<projectRoot>/dinou/...` whenever `./dinou` exists, ensuring live framework edits take effect immediately even when package managers copy a static snapshot into `node_modules/dinou`, and fixing `import { defineConfig } from "dinou/config"` in Webpack Ejected Mode.
- **Immediate `getProps()` Redirect Short-Circuit (`page_functions.ts` & `layout_functions.ts`)**: Exposes `context._hasRedirected` in `dinou/core/handler.js` and short-circuits `dinou/core/get-jsx.js` immediately after `getProps()`, page rendering, `@slot` rendering, `getLayoutProps()`, and layout rendering whenever a redirect occurs — preventing `<Page />` / `<Layout />` components from executing with undefined props or turning SPA `x-rsc-redirect` responses into 500 errors.
- **External URL Handling in `router.push()`, `router.replace()`, and `<ClientRedirect>`**: `navigate()` in both `dinou/core/client.jsx` and `dinou/core/client-webpack.jsx` now detects external URLs via `isExternalUrl()` and delegates to `window.location.assign()` / `window.location.replace()`, preventing cross-origin `History.pushState` `SecurityError` crashes.
- **`<Link>` Native Browser Yielding (`target="_blank"`, `download`, Non-Primary Clicks)**: `dinou/core/link.jsx` and the global anchor click handlers in `client.jsx` / `client-webpack.jsx` now skip hover prefetching and SPA interception when `target` is set to a non-`_self` value, when `download` is present, or when `e.button !== 0`.
- **Hash Fragment Normalization for Client RSC Cache & `{ fresh: true }`**: `navigate()`, `getPagePayload()`, and `__DINOU_PREFETCH__` now strip `#hash` fragments from `pageCache` keys, `route` state, and RSC fetch URLs while preserving `#hash` in browser history — ensuring `?____v____=` and `?____build_id____=` are never placed inside the URL fragment and avoiding duplicate cache entries.
- **Referentially Stable `useRouter()` & Static-Export `useSearchParams()` Hydration**: Memoizes the object returned by `useRouter()` on `RouterContext` so local state updates do not unnecessarily re-run `useEffect(..., [router])` hooks, includes `window.__DINOU_STATIC_EXPORT__` in `useSearchParams()`'s static hydration guard, and corrects the `redirect()` JSDoc in `dinou/index.d.ts` from HTTP 307 to HTTP 302.
- **SSG `revalidate = 0` Detection (`||` → `??`) & Build-Time Redirect Short-Circuit (`dinou/core/build-static-pages.js`, `dinou/core/generate-static-rsc.js`)**: Replaces falsy `||` fallbacks with nullish coalescing (`??`) across all `revalidate` lookups in `collectPages()`, `buildStaticPages()`, and `buildStaticPage()` so `export const revalidate = 0` is no longer coerced to `undefined` and mistakenly pre-rendered at build time (also calling `markAsDynamic()` in `buildStaticPage()` before returning early). Additionally exposes `_hasRedirected` on SSG/ISR mock contexts and short-circuits `build-static-pages.js` immediately after `getProps()`, `@slot` renders, and `getLayoutProps()` whenever a redirect occurs, preventing build-time `TypeError` logs on guarded pages/layouts.
- **Bun Static Asset `<a download="...">` Filename Parity (`dinou/bun/build.js`)**: Sets `"content-disposition": "inline"` on `Bun.file(...)` static asset responses (`200` and `206` Range) so `Bun.serve()` does not auto-inject `content-disposition: filename="..."` — which previously overrode the HTML `<a download="...">` attribute in Chromium and Firefox — while preserving zero-copy `sendfile` delivery and full parity with Node, Deno, and Cloudflare.
- **Single-Pass TypeScript Performance Optimization for Contextual Route Types (`dinou/index.d.ts`)**: Hoists `SplitRouteSegments<CleanRoutePath<TFrom>>` out of union distributions in `DistributeRelative*` and computes completions, non-completion patterns, and dynamic templates in a single `RelativeTargetRecord` pass in `DinouRelativeLinkTarget<TFrom>`, eliminating redundant per-route traversals and `O(N²)` `Exclude<>` union diffs (~8× faster `tsc` and IDE type-checking on large route trees with identical type-safety guarantees).
- **ISR Stale-While-Revalidate TOCTOU Deduplication (`dinou/core/cache-revalidate.js`, `dinou/core/handler.js`)**: Adds an `onlyIfExpired` guard inside `enqueueRevalidation()` for both `revalidatePage()` and `revalidateLayout()` (with `:ttl` / `:force` separation in `inFlightKey` so explicit `revalidatePath()`/`revalidateTag()` calls are never coalesced with TTL refreshes), claims `regenerating.add(reqPath)` synchronously before launching background SWR tasks, re-checks `latestMeta` in the non-streaming fallback path, and guards `pageRevalidate !== undefined && pageRevalidate !== null` — preventing concurrent requests that observed a stale snapshot from triggering a redundant back-to-back regeneration immediately after the first SWR commit.
- **Memoized Contextual `"./dinou"` `useRouter()` (`dinou/core/generate-route-types.js`)**: Wrapped generated route-contextual `useRouter()` wrappers in a `react-server`-safe `useMemo(..., [router])` so Client Components importing `useRouter` from `"./dinou"` retain referential stability across unrelated local re-renders and avoid spurious `useEffect(..., [router])` teardowns.
- **Contextual `dinou.d.ts` Type Re-Export Parity (`dinou/core/generate-route-types.js`)**: Re-exported `DinouEnv`, `DinouNavigableRoutePatternMap`, `DinouNavigableRouteKey`, `DinouDynamicRoutePattern`, `DinouDynamicRouteWithSuffix`, `DinouEffectiveRoutePattern`, and `ScopedLinkTargetForFrom` from `"dinou"` in all generated `.dinou/routes/**/dinou.d.ts` declarations.
- **`getContext()` `rawPath` & `isRscRequest` Consistency and Sub-Context Isolation (`dinou/core/handler.js`, `dinou/core/request-context.js`)**: Excluded internal `rawPath` and `isRscRequest` wire transport fields from `copyCustomContextProperties()` `req` cloning so RSC wire metadata never leaks onto sub-contexts, and ensured `createServerFunctionContext()` as well as server/browser `getContext()` fallback stores consistently populate `req.rawPath` and `req.isRscRequest`.
- **`CloudflareKVStorage` Pagination & `has()` Fallback (`dinou/core/storage-adapter.js`)**: Implemented cursor-based pagination in `CloudflareKVStorage.keys(prefix)` so `revalidateTag()` no longer truncates at Cloudflare KV's 1,000-key limit, and added folder/index (`<key>/index.html`) fallback parity to `CloudflareKVStorage.has(key)`.
- **`DenoKVStorage` Trailing-Slash Normalization (`dinou/core/storage-adapter.js`)**: Stripped trailing slashes in `DenoKVStorage._cleanKey()` to match `FileSystemStorage`, `MemoryStorage`, `RedisStorage`, and `CloudflareKVStorage` across `get()`, `has()`, `set()`, and `delete()`.
- **`<DinouCacheSlot>` Combined `tag` + `tags` Merging & `revalidate < 1` Parity (`dinou/core/cache-slot.js`, `dinou/server.d.ts`)**: Merged and deduplicated `tag` and `tags` when both props are supplied; unified `< 1` no-cache semantics across `DinouCacheSlot`, `getSlotJSX()`, and `hasExpiredSlots()`; and widened `DinouCacheSlotProps.revalidate` to `number | false`.
- **Cold-Start / Multi-Pod `revalidateTag(slotId)` & Cold `revalidatePath()` Layout Detection (`dinou/core/cache-revalidate.js`, `dinou/core/cache-slot.js`, `dinou/core/storage-adapter.js`)**: Matched `id`-only `<DinouCacheSlot id="...">` records via `meta.slotId` / directory name even when the in-memory `slotRegistry` is cold (including checking `slotId` against tag invalidation timestamps in Cloudflare `env.ASSETS` and `readDist2Fallback`, and calling `markTagInvalidatedAsync` on non-`keys()` adapters), and detected exact segment `layout.tsx` files in `revalidatePath()` when storage is cold.
- **Authoritative `validateParams()` & `allowISG: false` Veto on Cached SPA RSC Requests (`dinou/core/handler.js`)**: Moved layout and page perimeter checks ahead of cached `page.rsc` / `layout.rsc` delivery on `/____rsc_page____/*`, `/____rsc_layout____/*`, and `/____rsc_payload____/*` so deactivated tenants/items return `404 Not Found` on SPA navigation just like direct HTML requests, and reversed layout perimeter evaluation order to strict **root-to-child** so a failing ancestor layout short-circuits before child layouts or child `page_functions.ts` execute.
- **`allowISG: false` Parameter Normalization for Numeric & Array `getStaticPaths` Objects (`dinou/core/handler.js`, `dinou/core/layout-functions.js`)**: Normalized `number`, `string[]`, and `undefined` values symmetrically when constructing and querying `staticPathsSet` so routes declaring `getStaticPaths = [{ id: 1 }]` or `[{ slug: ["docs", "intro"] }]` with `allowISG = false` no longer falsely 404 in `dinou dev`, cold storage, or Cloudflare Workers.
- **SSG `layout_functions.ts` `getStaticPaths` Support Across All Dynamic Bracket Types (`dinou/core/build-static-pages.js`)**: Extended `layout_functions.ts` `getStaticPaths` and `hasLocalLayout` discovery in `buildStaticPages()` from required `[param]` folders to optional `[[param]]`, catch-all `[...slug]`, and optional catch-all `[[...slug]]` segments.
- **Build-Time Numeric `getStaticPaths` Segment Coercion & Parent-Param Filtering (`dinou/core/build-static-pages.js`, `dinou/core/get-file-path-and-dynamic-params.js`)**: Coerced numeric `getStaticPaths` segments (e.g. `[{ id: 1 }]`, `[{ tenant: "acme", id: 1 }]`) to strings in `collectPages()` (with defensive string normalization in `matchRouteTree()`) so static pre-rendering no longer throws `TypeError: seg.startsWith is not a function`, and skipped mismatched child `getStaticPaths` entries whose ancestor params were already bound by a parent dynamic layout.
- **Named-Over-Default Export Precedence for `revalidate` & `allowISG` (`dinou/core/handler.js`, `dinou/core/layout-functions.js`, `dinou/core/cache-revalidate.js`)**: Fixed inverted function-first resolution ternaries in `page_functions` and `layout_functions` so named constant overrides (e.g. `export const revalidate = 0` / `false`, `export const allowISG = false` / `true`) always take precedence over `export default` function definitions without invoking the shadowed default functions, while preserving default-function invocation when no named export is present.

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
