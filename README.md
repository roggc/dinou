# Dinou

[![Documentation](https://img.shields.io/badge/docs-dinou.dev-blue?style=flat-square)](https://dinou.dev)
[![Version](https://img.shields.io/badge/version-10.0.5-orange?style=flat-square)](https://www.npmjs.com/package/dinou)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](./LICENSE.md)

**The Ejectable Full-Stack React 19 Framework.**

Build full-stack web applications with native **React Server Components (RSC)**, progressive streaming SSR, compile-time type-safe routing, **3-Dimensional Caching** (**Horizontal Segmentation**, **Vertical `<DinouCacheSlot>` Micro-ISR**, and **Temporal Segmentation / Partial Prerendering (PPR)**), **Dual-Mode Vendoring**, and universal multi-platform deployment (**Node.js**, **Bun**, **Deno**, **Cloudflare Workers**, **Netlify**, and **Static Export**) with zero vendor lock-in.

> 📚 **Full Documentation, Guides & Interactive Tutorials:** **[https://dinou.dev](https://dinou.dev)** · **LLM Docs:** [llms.txt](https://dinou.dev/llms.txt) · [llms-full.txt](https://dinou.dev/llms-full.txt)
>
> 🤖 **AI Agent Ready:** This `README.md` is intentionally engineered as a **high-density, single-pass technical specification (< 700 lines / < 45 KB)** so AI coding agents can read the entire framework architecture, public APIs, and caching invariants in a single tool call.

---

## Table of Contents

1. [Quick Start & CLI](#1-quick-start--cli)
2. [Project Structure & File Conventions](#2-project-structure--file-conventions)
3. [Routing, Parallel Slots & Type-Safe Routing](#3-routing-parallel-slots--type-safe-routing)
4. [Route Lifecycles (`page_functions.ts` & `layout_functions.ts`)](#4-route-lifecycles-page_functionsts--layout_functionsts)
5. [The 3-Dimensional Caching & Rendering Engine](#5-the-3-dimensional-caching--rendering-engine)
   - [5.1. Dimension 1: Horizontal Segmentation (Layout vs. Page Isolation)](#51-dimension-1-horizontal-segmentation-layout-vs-page-isolation)
   - [5.2. Dimension 2: Vertical Segmentation (`<DinouCacheSlot>` Micro-ISR)](#52-dimension-2-vertical-segmentation-dinoucacheslot-micro-isr)
   - [5.3. Dimension 3: Temporal Segmentation — Partial Prerendering (PPR)](#53-dimension-3-temporal-segmentation--partial-prerendering-ppr)
   - [5.4. The Triple Synergy (Horizontal + Vertical + Temporal / PPR)](#54-the-triple-synergy-horizontal--vertical--temporal--ppr)
6. [Client Navigation, Router Cache & Hooks](#6-client-navigation-router-cache--hooks)
7. [Server Functions (`"use server"`), Context & The Dinou Pattern](#7-server-functions-use-server-context--the-dinou-pattern)
8. [Configuration (`dinou.config.ts`), Middleware (`onRequest`) & Storage Adapters](#8-configuration-dinouconfigts-middleware-onrequest--storage-adapters)
9. [Styling, Assets, Environment Variables & Aliases](#9-styling-assets-environment-variables--aliases)
10. [Bundlers, Deployment Targets, Dual-Mode Vendoring & Eject / Uneject](#10-bundlers-deployment-targets-dual-mode-vendoring--eject--uneject)
11. [Complete Public Exports Cheat-Sheet](#11-complete-public-exports-cheat-sheet)

---

## 1. Quick Start & CLI

### Prerequisites
- **Node.js 20.6.0+** (Required)
- **Bun 1.1+** / **Deno 2.0+** / **Wrangler** (Optional, for target-specific builds/compiles)

### Create a New App
```bash
npx create-dinou@latest my-app
cd my-app
npm run dev
```

### Core CLI Commands (`npx dinou <command>`)

All commands accept **`-u` / `--unvendorized`** (e.g. `npm run dev -- -u`, `npx dinou dev -u`, or `DINOU_UNVENDORIZED=true`) to resolve toolchain packages from `node_modules` instead of `dinou/compiled/`.

| Command | Bundler Variants (`:esbuild` default, `:rollup`, `:webpack`) | Description |
| :--- | :--- | :--- |
| `dinou dev` | `dev:esbuild`, `dev:rollup`, `dev:webpack` | Start development server with HMR & Fast Refresh. |
| `dinou build` / `build:node` | `build:node:{esbuild,rollup,webpack}` | Build production bundle and pre-render static routes for Node.js (and Netlify). |
| `dinou start` / `start:node` | `start:node:{esbuild,rollup,webpack}` | Start production Node.js server (`.dinou/node/server.mjs`). |
| `dinou build:netlify` | `build:netlify:{esbuild,rollup,webpack}` | Build dedicated single-file AOT Netlify Functions v2 bundle (`.dinou/netlify/functions/ssr.mjs`). |
| `dinou build:cloudflare` | `build:cloudflare:{esbuild,rollup,webpack}` | Build for Cloudflare Workers (`workerd`, `.dinou/cloudflare/assets`, KV). |
| `dinou build:bun` / `start:bun` | `build:bun:{esbuild,rollup,webpack}` | Build and start for Bun runtime (`build:bun:pure` runs 100% under Bun). |
| `dinou build:deno` / `start:deno` | `build:deno:{esbuild,rollup,webpack}` | Build and seed Deno KV for Deno / Deno Deploy. |
| `dinou build:{node,bun,deno}:compile` | `...compile:{linux,linux_arm,mac,win}:{bundler}` | Compile standalone single-file native executable (`dist/server`). |
| `dinou export-static` | `export-static:{esbuild,rollup,webpack}` | Export standalone static SPA site to `out/` (`index.html`, `page.rsc`, `layout.rsc`, assets). |
| `dinou typegen` | — | Generate `.dinou/types/routes.d.ts` & `.dinou/routes/**/dinou.{js,d.ts}`. |
| `dinou eject` / `uneject` | — | Eject full Dinou compiler & runtime into `./dinou`, or transactionally revert via `npm run uneject`. |

---

## 2. Project Structure & File Conventions

Routes live directly inside **`src/`** (not `src/app/`). A directory becomes a route if it contains a `page.{tsx,jsx,ts,js}` file.

```text
my-app/
├── public/                     # Static files served at "/" (copied to .dinou/dist3)
├── src/
│   ├── layout.tsx              # Root Layout (wraps <html>, <head>, <body>)
│   ├── layout_functions.ts     # Root Layout server lifecycle (getProps, getStaticPaths, allowISG, revalidate, getCacheTags, ppr)
│   ├── page.tsx                # Home route ("/")
│   ├── page_functions.ts       # Home route server lifecycle (getProps, revalidate, getCacheTags, ppr)
│   ├── error.tsx               # Root 500 error boundary page
│   ├── not_found.tsx           # Root 404 page
│   └── blog/
│       └── [slug]/
│           ├── page.tsx        # Dynamic route ("/blog/:slug")
│           └── page_functions.ts
├── dinou.config.ts             # Optional framework config, plugins, storage & middleware (.ts/.mjs/.js/.cjs)
├── dinou.setup.ts              # Optional early setup/polyfill file injected into all environments
├── dinou-env.d.ts              # Ambient asset declarations (/// <reference types="dinou/env" />)
└── tsconfig.json               # TypeScript config (rootDirs: ["src", ".dinou/routes"] + ".dinou/types/**/*.d.ts")
```

### Special Route Files (`src/**/`)

| File | Scope | Role & Behavior |
| :--- | :--- | :--- |
| `page.{tsx,jsx,ts,js}` | Universal (`async` RSC or `"use client"`) | Primary UI for the URL segment. Receives `{ params }` plus all props returned by `getProps`. |
| `layout.{tsx,jsx,ts,js}` | Universal (`async` RSC or `"use client"`) | Persistent wrapper around child routes. Does **not** remount on child SPA navigation. Receives `{ children, params, ...parallelSlots }` plus props from `layout_functions.ts` `getProps`. |
| `page_functions.{ts,js}` | Server-Only | Exports `getProps`, `getStaticPaths`, `validateParams`, `allowISG`, `revalidate`, `getCacheTags`, `ppr`. |
| `layout_functions.{ts,js}` | Server-Only | Exports `getProps`, `getStaticPaths`, `validateParams`, `allowISG`, `revalidate`, `getCacheTags`, `ppr` for the layout segment independently of child pages. |
| `error.{tsx,jsx,ts,js}` | Universal | Renders when an unhandled error occurs in the segment or its descendants (bubbles up to closest ancestor `error.*`). Receives `{ error, params }`. |
| `not_found.{tsx,jsx,ts,js}` | Universal | Renders on unmatched URLs or when `validateParams` returns `false` / `allowISG = false` (bubbles up to closest ancestor `not_found.*`). Receives `{ params }` plus props from `getProps` if present. |

### Layout Control Flags (Empty 0-Byte Files)
Create an empty file (no extension) inside any route folder to alter layout inheritance:
- `no_layout`: Renders `page.tsx` bare without **any** ancestor layouts.
- `reset_layout`: Discards ancestor layouts above this folder; this folder's `layout.tsx` becomes the new root layout for this subtree.
- `no_layout_error`: Renders `error.tsx` without ancestor layouts.
- `no_layout_not_found`: Renders `not_found.tsx` without ancestor layouts.

---

## 3. Routing, Parallel Slots & Type-Safe Routing

### Folder Naming Patterns

| Pattern | Example Path | URL Matched | Inferred `params` Type |
| :--- | :--- | :--- | :--- |
| `about` | `src/about/page.tsx` | `/about` | `{}` |
| `[slug]` | `src/blog/[slug]/page.tsx` | `/blog/hello` | `{ slug: string }` |
| `[[slug]]` | `src/item/[[slug]]/page.tsx` | `/item`, `/item/42` | `{ slug?: string }` |
| `[...slug]` | `src/docs/[...slug]/page.tsx` | `/docs/a/b/c` (1+ segments) | `{ slug: string[] }` |
| `[[...slug]]` | `src/shop/[[...slug]]/page.tsx` | `/shop`, `/shop/a/b` (0+ segments) | `{ slug: string[] }` (runtime `[]` on base; optional in `<Link params>` & `getStaticPaths`) |
| `(group)` | `src/(marketing)/pricing/page.tsx` | `/pricing` | Organization group (omitted from URL). |
| `_escaped` | `src/_legacy/page.tsx` | *(Excluded)* | Completely excluded from routing, bundlers, VFS, route types & Server Functions (`403`). Importing `src/_*` from active code fails at compile time (active helper folders like `src/components/` need no `_`). |
| `@slot` | `src/dashboard/@analytics/page.tsx` | `/dashboard` | **Parallel Route Slot:** injected as prop `analytics` into `src/dashboard/layout.tsx`. Isolated error boundary per slot. |

> **Specificity, Backtracking & Pass-Through Folders:** The router resolves competing branches deterministically using full multi-branch and `(group)` backtracking ordered by specificity (`static` > `[slug]` > `[[slug]]` > `[...slug]` > `[[...slug]]`), rejects literal router-syntax segments (`(group)`, `[param]`, `@slot`, `_private`) in URLs, and supports pass-through folders without `page.tsx` (e.g. `src/api/v1/users/page.tsx`).

### Compile-Time Type-Safe Routing & Contextual `"./dinou"` Modules
Dinou generates `.dinou/types/routes.d.ts` and per-folder `.dinou/routes/<relDir>/dinou.{js,d.ts}` modules during `dev`, `build`, or `npx dinou typegen`. Configure `tsconfig.json` with `rootDirs`:
```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "ESNext", "moduleResolution": "bundler", "jsx": "react-jsx",
    "strict": true, "noEmit": true, "skipLibCheck": true,
    "rootDirs": ["src", ".dinou/routes"], "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src", "dinou-env.d.ts", ".dinou/types/**/*.d.ts"]
}
```

#### 1. Zero-Boilerplate Route-Contextual Imports (`from "./dinou"`)
Inside any route or `@slot` folder in `src/`, import from `"./dinou"`—or `"../dinou"` from a nested helper subfolder like `components/` (resolved via TS `rootDirs` and bundler plugins; defers to any user `dinou.*` file in `src/`). Segment contracts (`PageProps`, `LayoutProps` with auto-inferred `@slot` props, `SlotProps`, `ErrorProps`, `NotFoundProps`, `PageFunctions`, `LayoutFunctions`, `RouteParams`, `ROUTE`) and relative navigation (`<Link>`, `useRouter()`) are pre-bound to that folder:
```tsx
// src/blog/[slug]/page_functions.ts
import type { PageFunctions } from "./dinou";

export const getProps: PageFunctions["getProps"] = async (params) => {
  // params is typed as { slug: string }
  return { title: `Post ${params.slug}` };
};

// src/blog/[slug]/page.tsx
import { Link, type PageProps } from "./dinou";

export default async function BlogPage({ params, title }: PageProps<{ title: string }>) {
  return (
    <article>
      <h1>{title} ({params.slug})</h1>
      {/* Strict relative link (no `from` needed) & dynamic `params` interpolation */}
      <Link to="comments">Comments</Link>
      <Link to="/blog/[slug]" params={{ slug: "next-post" }}>Next</Link>
    </article>
  );
}
```

#### 2. Explicit Global Imports (`from "dinou"` — Anywhere, Including `src/components/`)
Outside a specific route folder (or when using explicit route literals), pass the segment pattern to `"dinou"` generics (`PageProps<"/blog/[slug]", { title: string }>`, `LayoutProps<"/dashboard">` with auto-inferred `@slot` props, `SlotProps<"/dashboard/@analytics">`, `ErrorProps<"/blog/[slug]">`, `NotFoundProps<"/blog/[slug]">`, `PageFunctions<"/blog/[slug]">`, `LayoutFunctions<"/dashboard">`), and pass `from` for strict relative links (`<Link from="/blog/[slug]" to="comments" />` or `router.push("comments", { from: "/blog/[slug]" })`).

---

## 4. Route Lifecycles (`page_functions.ts` & `layout_functions.ts`)

Both `page_functions.ts` and `layout_functions.ts` share the `RouteSegmentConfig` contract:

| Export | Signature / Type | Default | Behavior |
| :--- | :--- | :--- | :--- |
| `revalidate` | `number \| false \| (() => number \| false \| Promise<...>)` | `false` | **`false`**: Permanent SSG/ISG until on-demand invalidation.<br>**`0` (or `< 1`)**: Dynamic SSR on every request.<br>**`>= 1`**: Time-based ISR (TTL in seconds; stale-while-revalidate in background). |
| `ppr` | `boolean \| (() => boolean \| Promise<boolean>)` | `false` (or global `dinou.config.*`) | Enables **Partial Prerendering** strictly for **this segment** (no parent-to-child inheritance; falls back to `dinou.config.*`). |
| `getCacheTags` | `string[] \| ((params) => string[] \| Promise<string[]>)` | `[]` | Tags associated with this page or layout segment for surgical invalidation via `revalidateTag(tag)`. |
| `getProps` | `(params) => TProps \| Promise<TProps>` | `{}` | Server-only loader; spreads props onto `page.tsx` (`not_found.tsx`) or `layout.tsx`. Un-awaited `Promise`/`Promise[]` values stream directly to `"use client"` `use(promise)` inside `<Suspense>` without blocking TTFB. |
| `getStaticPaths` | `StaticPathItem[] \| (() => StaticPathsResult)` | `[]` | Pre-generates paths at build time (`["a"]`, numbers, catch-all `[["a", "b"]]`, `undefined` for optional routes, or param objects `[{ slug: "a" }]`). |
| `validateParams` | `(params) => boolean \| Promise<boolean>` | `() => true` | Per-segment guard run **before** `getProps`/rendering (and before cached RSC delivery) root-to-child with accumulated `params`; returning `false` returns HTTP 404 across HTML, layout RSC, and page RSC. |
| `allowISG` | `boolean \| (() => boolean \| Promise<boolean>)` | `true` (or global `dinou.config.*`) | Per-segment ISG control: `true` caches unknown params on demand; `false` returns 404. Static layouts ignore `allowISG = false`; valid pre-rendered dynamic layouts preserve child `allowISG = true`. |

---

## 5. The 3-Dimensional Caching & Rendering Engine

Dinou features three orthogonal caching and rendering dimensions—**Horizontal**, **Vertical**, and **Temporal**—that work standalone or in **Triple Synergy**:

```
1. HORIZONTAL (HS)  : Layout Cache (layout.rsc) !== Page Cache (page.rsc)
2. VERTICAL (Slot)  : <DinouCacheSlot> sub-tree RSC cached/refreshed by ID or Tag
3. TEMPORAL (PPR)   : Instant Static Shell (shell.html) + Streaming <Suspense> Holes
```

### 5.1. Dimension 1: Horizontal Segmentation (Layout vs. Page Isolation)

In Dinou, **`layout.tsx` (`layout_functions.ts`)** and **`page.tsx` (`page_functions.ts`)** have **completely independent cache lifecycles** and storage artifacts:
- Layout artifacts: `layout.rsc` + `layout.metadata.json` (with its own `revalidate` TTL and `getCacheTags`).
- Page artifacts: `page.rsc` + `index.html` + `metadata.json` (with its own `revalidate` TTL and `getCacheTags`).

#### Asymmetric Combinations Supported:
1. **Static Layout (`revalidate = false`) + Dynamic Page (`revalidate = 0`)**: On every request or SPA navigation, the layout is served from cache (`layout.rsc`) without re-executing `layout.tsx`, while `page.tsx` renders dynamically.
2. **Dynamic Layout (`revalidate = 0`) + Static Page (`revalidate = false`)**: The page payload (`page.rsc`) stays cached while the layout evaluates dynamically per request.
3. **Independent ISR Timers**: e.g., Layout `revalidate = 3600` (1h) + Page `revalidate = 10` (10s).

#### Surgical Revalidation & Zero Hydration Mismatch (`Lazy HTML Re-Composition`):
When you invalidate **only** a layout (`revalidateLayout("/dashboard")` or `revalidateTag("layout-tag")`):
- Dinou regenerates **only** `layout.rsc` without re-executing child `page.tsx` components (preserving all cached child `page.rsc` payloads).
- On the next hard request or F5 reload, if an ancestor `layout.rsc` is newer than the cached `index.html`, Dinou **lazily re-composes `index.html`** from the fresh `layout.rsc` + cached `page.rsc`, guaranteeing **zero React hydration mismatch** without cascading page re-renders.

---

### 5.2. Dimension 2: Vertical Segmentation (`<DinouCacheSlot>` Micro-ISR)

**Vertical Segmentation** isolates component subtrees *inside* a layout or page: `<DinouCacheSlot>` (`"dinou/server"`) caches any RSC subtree independently from its host.

```tsx
import { DinouCacheSlot } from "dinou/server";

export default async function DashboardPage() {
  return (
    <main>
      {/* Cached for 30s and tagged with "Gold-Price" and "market" */}
      <DinouCacheSlot id="gold-ticker" revalidate={30} tags={["Gold-Price", "market"]}>
        {() => <LiveGoldTicker />}
      </DinouCacheSlot>
    </main>
  );
}
```

#### Key Capabilities & Rules of `<DinouCacheSlot>`:
- **Props:**
  - `id?: string`: Explicit slot identifier (auto-derived if omitted, though explicit `id` is recommended for live client `refreshSlot`).
  - `tag?: string` / `tags?: string[]`: Semantic cache tags for `revalidateTag(tag)` and `refreshSlot(tag)`.
  - `revalidate?: number | false`: Slot TTL in seconds (`0` or `< 1` = never cached; `>= 1` = time-based Micro-ISR; `false` or omitted = cached until invalidated).
  - `children`: Either JSX (`<AsyncServerComponent />`) or a lazy factory function (`() => <AsyncServerComponent />`).
- **Works in Both Dynamic & Static Hosts:**
  - Inside a **Dynamic Page (`revalidate = 0`)**: The host page re-renders on every request, while `<DinouCacheSlot>` subtrees hit cache without re-running their DB queries.
  - Inside a **Static Page (`revalidate = false` or `ppr = true` Static Shell)**: `revalidateTag(tag)` updates the slot and re-composes the static host/shell. On TTL expiry (`revalidate >= 1`), Dinou uses **non-blocking Background SWR**: serving cached `index.html`/`shell.html` immediately (`0ms` TTFB) while regenerating `slot.json` and recomposing host HTML/RSC in the background.
- **Nested `<DinouCacheSlot>` Isolation:** A `<DinouCacheSlot>` can contain inner `<DinouCacheSlot>` components. Invalidating or refreshing the **inner** slot re-evaluates **only** the inner slot while the outer slot stays cached.
- **Client Components & Server Action Props Inside Slots:** `<DinouCacheSlot>` subtrees can render `"use client"` components and pass `"use server"` functions as props; Dinou preserves client reference manifests and action bindings across slot serialization.
- **Stampede Protection:** Concurrent cache-miss requests for the same slot key are deduplicated in-flight onto a single render promise.
- **Live Client-Side Surgical Refresh (`refreshSlot`):**
  Call `refreshSlot(idOrTag, { fresh?: boolean })` (from `"dinou"`) or `useRouter().refreshSlot(idOrTag, { fresh?: boolean })` from any Client Component:
  - Targets a specific slot by **`id`**, by **`tag`**, or **all mounted slots via wildcard `"*"`**.
  - `{ fresh: true }` forces a cache bypass and updates the server slot cache; `{ fresh: false }` (default) serves from cache unless expired/invalidated.
  - **100% State Preservation:** Updating a slot in the browser surgically patches only that slot's Virtual DOM subtree; sibling Client Components in the layout, page, or other slots keep 100% of their local React state (`useState`, inputs, counters).

---

### 5.3. Dimension 3: Temporal Segmentation — Partial Prerendering (PPR)

**Partial Prerendering (PPR)** is Dinou's **Temporal Segmentation** axis: it splits a single route across *time*, delivering the pre-rendered **Static Shell (`shell.html`)** at `t = 0ms` (build/revalidation time) while streaming personalized or live **`<Suspense>` Dynamic Holes** concurrently at request time over the same HTTP connection.

Enable PPR globally (`dinou.config.*` `ppr: true`) or per-segment (`export const ppr = true | false` in `page_functions.ts` / `layout_functions.ts`). **`ppr` is strictly per-segment with zero parent-to-child inheritance** (falling back to `dinou.config.*`, default `false`), supporting mixed-PPR chains (e.g. `ppr = false` layout -> `ppr = true` nested layout -> `ppr = false` page) in isolated scopes.

#### How `<Suspense>` Boundaries, Dynamic PPR Holes & `noDynamic()` Work:
1. **`<Suspense>` Is the Single Boundary (`ppr = true` vs. `ppr = false`):**
   - **Outside `<Suspense>`** (top-level `async` Page/Layout, `getProps`, or unwrapped `async` RSCs): Awaited at build/revalidation time and baked into `shell.html`. *(Reading `req.cookies`/`headers`/`query`, calling `useSearchParams()` in an RSC, or rendering `<DinouCacheSlot revalidate={0}>` outside `<Suspense>` triggers a Full-Page Dynamic Bailout).*
   - **Inside `<Suspense fallback={...}>` (Default = Dynamic PPR Hole):** On `ppr = true` segments, any `async` RSC (postponed at its first `await`), any `"use client"` component with an un-awaited `Promise`/`Promise[]` prop, any RSC reading `req.cookies`/`headers`/`query` or `useSearchParams()`, or `<DinouCacheSlot revalidate={0}>` becomes a **Dynamic PPR Hole** (`data-ppr-hole`): fallback baked into `shell.html` (`0ms` TTFB), live content streamed per request. *(`"use client"` `useSearchParams()` stays in the Static Shell with zero `#418` hydration mismatch. On `ppr = false` segments, `<Suspense>` resolves statically into `index.html`).*
2. **Static `<Suspense>` Opt-Out via `noDynamic()` (`"dinou"` / `"dinou/server"`):**
   - Call **`noDynamic()`** synchronously at the top of an `async` RSC inside `<Suspense>` (before its first `await`) to bake it into `shell.html` at build time and short-circuit (`0ms`) at runtime. *(Reading `req.cookies`/`headers`/`query` inside `noDynamic()` still triggers dynamic bailout).*
3. **Single-Request Streaming:** Dinou flushes `shell.html` immediately and streams all Dynamic PPR Holes over the same HTTP response. With zero holes (`holes: []`), `shell.html` is served directly with zero runtime execution.

---

### 5.4. The Triple Synergy (Horizontal + Vertical + Temporal / PPR)

All three dimensions compose simultaneously in the same route tree:
- **Layout Level:** Can be Static (HS), Dynamic (HS), or PPR (`layout_functions.ts` with `ppr = true`), and can contain `<DinouCacheSlot>` components both in the **Layout Static Shell** and inside **Layout Dynamic `<Suspense>` Holes**.
- **Page Level:** Can be Static (HS), Dynamic (HS), or PPR (`page_functions.ts` with `ppr = true`), and can contain `<DinouCacheSlot>` components both in the **Page Static Shell** and inside **Page Dynamic `<Suspense>` Holes**:
  - **`<DinouCacheSlot>` Outside `<Suspense>` (or Wrapping an Inner `<Suspense>`)**: Resolves at build time into the **Static Shell (`shell.html` + `slot.json`)**, preserving any inner `<Suspense>` node in `slot.json` and using non-blocking background SWR upon TTL expiration.
  - **`<Suspense>` Wrapping `<DinouCacheSlot>` (`<Suspense><DinouCacheSlot>...</DinouCacheSlot></Suspense>`)**: Acts as a **Cached Dynamic PPR Hole** by default on `ppr = true` routes (unless opted out via `noDynamic()`), baking the `<Suspense>` fallback into `shell.html` and caching `slot.json` across runtime hole streams.
- **Synergy Invalidation Invariants:**
  1. `revalidateTag("hole-slot")` for a slot inside a **PPR Dynamic Hole** updates only that slot without regenerating `shell.html` or sibling slots.
  2. `revalidateTag("shell-slot")` for a slot inside a **PPR Static Shell** purges the slot and enqueues background regeneration of `shell.html` (and `layout.rsc` if in a layout shell) without touching sibling slots.
  3. `refreshSlot(idOrTag | "*", { fresh: true })` updates mounted slots live across Layout/Page Shells & Holes and enqueues background shell regeneration so F5 reloads match with zero hydration mismatch.
- **Single-Pass Inline RSC Streaming & Scoped `useId()`:**
  - Dynamic SSR, PPR resumes, and first-time ISG renders evaluate layouts and page **once per request** and stream Flight payloads inline (`__DINOU_RSC_L__` / `__DINOU_RSC_P__`), preventing extra `/____rsc_*` round-trips and `#418` mismatches.
  - Sync and `async` RSCs support `useId()` (plus `useMemo`/`useCallback`) with collision-free IDs scoped per segment (`_layout_`, `_page_`, `_slot_`, `_hole_`).

---

## 6. Client Navigation, Router Cache & Hooks

Import navigation primitives from `"dinou"` (or from route-contextual `"./dinou"` inside route folders to pre-bind `from` for relative targets):

```tsx
"use client";
import {
  Link,
  ClientRedirect,
  redirect,
  useRouter,
  usePathname,
  useSearchParams,
  useNavigationLoading,
  refreshSlot,
} from "dinou";
```

| Primitive | Scope | Signature / Props | Key Behavior |
| :--- | :--- | :--- | :--- |
| `<Link>` | Universal | `href` (or `to`), `params?`, `from?`, `prefetch?: boolean` (`true`), `fresh?: boolean` (`false`) | Soft SPA navigation; hover RSC prefetch (`prefetch`); `fresh` bypasses `pageCache`. Interpolates `[param]`/`[[param]]`/`[...slug]`/`[[...slug]]` via `params` and validates/resolves relative paths (`"sub"`, `"./sub"`, `"../other"`) via `from` (pre-bound in `"./dinou"`). |
| `useRouter()` | Client | `{ push, replace, back, forward, refresh, refreshSlot }` | `push`/`replace(href, { fresh?, params?, from? })` (`from` pre-bound in `"./dinou"`), `refresh({ layout?: boolean })` (page RSC, or layout + page when `layout: true`), `refreshSlot(idOrTag, { fresh? })`. |
| `usePathname()` | Universal | `() => string` | Returns current URL pathname (e.g. `"/blog/hello"`). Works in both Server Components and Client Components. |
| `useSearchParams()` | Universal | `() => URLSearchParams` | Read-only `URLSearchParams`. **Server Components:** reads `ctx.req.query` (PPR hole inside `<Suspense>` on `ppr = true`; dynamic bailout outside `<Suspense>`). **Client Components:** stays in Static/PPR Shell, hydrates empty via `useSyncExternalStore` (zero `#418`), then syncs with live URL. |
| `useNavigationLoading()` | Client | `() => boolean` | Returns `true` while a client-side route transition is in flight. |
| `redirect(url)` | Universal | `(destination: string) => ReactNode` | In `getProps` or Server Functions/Components before headers flush: sends real HTTP `302 Found` (or `x-rsc-redirect` on soft RSC navigation) and short-circuits rendering. If streaming has already started or on client: renders `<ClientRedirect to={destination} />`. |
| `<ClientRedirect>` | Client | `<ClientRedirect to="/login" />` | Triggers immediate client-side `replace` navigation upon mount. |
| `refreshSlot()` | Client | `(slotIdOrTag: string, opts?: { fresh?: boolean }) => Promise<void>` | Standalone helper (identical to `useRouter().refreshSlot`) to refresh one or all (`"*"`) `<DinouCacheSlot>` instances live in the browser; resolves once refreshes settle. |

---

## 7. Server Functions (`"use server"`), Context & The Dinou Pattern

### Server Functions & Actions (`"use server"`)
Any file or async function marked with `"use server"` runs exclusively on the server and can be passed to or imported directly into Client Components (`"use client"`):
- **Three Supported Scopes:** (1) Module-level `"use server"` files, (2) Function-body `"use server"` inside mixed utility files (granular manifest tree-shaking exposes only marked functions while allowing direct `"use client"` imports), and (3) Inline `"use server"` functions defined inside Server Components (including lexical closure capture).
- Supports standard React 19 form actions (`<form action={myAction}>`, `useActionState`, `useFormStatus`, `useOptimistic`) and direct RPC calls (`await myAction(arg1, arg2)`), including `FormData` uploads.
- **Security:** Bundlers automatically strip the implementation from the client bundle and replace it with a Flight RPC proxy (`/____server_function____`).

### Reading & Mutating Request Context (`getContext()`)
Call `getContext()` (from `"dinou"`, `"dinou/server"`, or contextual `"./dinou"`) synchronously inside any Server Component, `page_functions.ts` / `layout_functions.ts`, `plugin.onRequest`, or `"use server"` function (always returns a non-nullable `RequestContextStore` on the server with `env` populated):
```ts
import { getContext } from "dinou";

export async function updateThemeAction(theme: string) {
  "use server";
  const { req, res } = getContext();

  const currentCookie = req.cookies["theme"];
  const userAgent = req.headers["user-agent"];

  res.cookie("theme", theme, { path: "/", httpOnly: true, maxAge: 86400 });
  res.setHeader("X-Custom-Header", "updated");
}
```
- `ctx.req`: `{ query, cookies, headers, path, rawPath, isRscRequest, method, env, ctx }` (`req.path` is normalized even on internal `/____rsc_*` SPA fetches).
- `ctx.res`: `{ cookie(name, val, opts?), clearCookie(name, opts?), setHeader(name, val), status(code), redirect(statusOrUrl, url?) }`
- `ctx.env` / `ctx.ctx`: Unified zero-copy `DinouEnv` proxy across Cloudflare bindings (`env.DB`, `env.KV`, `env.R2`, secrets), `Netlify.env`, `process.env`, and `Deno.env`, plus platform context (`ctx.waitUntil`).

### Server-to-Client Promise Streaming (`use(promise)`)
Server Components and `getProps()` can pass raw, un-awaited `Promise` (or `Promise[]`) props directly to `"use client"` components wrapped in `<Suspense>`, streaming resolution over React Flight to React 19's `use(promise)` on the client without blocking TTFB (and registering a Dynamic PPR Hole automatically on `ppr = true` segments).

### The Dinou Pattern (Streaming Server Components from Server Functions)
In Dinou, a `"use server"` function can return **rendered JSX (including async Server Components and `<Suspense>` trees)** directly to a Client Component over React Flight RPC:
```tsx
// src/actions.tsx
"use server";
export async function searchProductsView(query: string) {
  const items = await db.products.search(query);
  return (
    <ul>
      {items.map((item) => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
}
```
```tsx
// src/search-client.tsx
"use client";
import { useState, Suspense } from "react";
import { searchProductsView } from "./actions";

export function SearchBox() {
  const [viewPromise, setViewPromise] = useState<Promise<React.ReactNode> | null>(null);
  return (
    <div>
      <button onClick={() => setViewPromise(searchProductsView("shoes"))}>Search</button>
      <Suspense fallback={<p>Loading...</p>}>{viewPromise}</Suspense>
    </div>
  );
}
```

### On-Demand Server Cache Invalidation (`"dinou/server"`)
```ts
import {
  revalidateTag,
  revalidatePath,
  revalidatePage,
  revalidateLayout,
} from "dinou/server";

await revalidateTag("products");          // Purges all pages, layouts & DinouCacheSlots with tag "products"
await revalidatePath("/blog/hello");      // Purges both layout (if any) and page at "/blog/hello"
await revalidatePage("/dashboard/stats"); // Purges only page.rsc + index.html (preserves cached layout.rsc)
await revalidateLayout("/dashboard");     // Purges only layout.rsc (preserves child page.rsc payloads; lazily re-composes index.html)
```

---

## 8. Configuration (`dinou.config.ts`), Middleware (`onRequest`) & Storage Adapters

Create `dinou.config.ts` (or `.mjs` / `.js` / `.cjs`) at the project root using `defineConfig` from `"dinou"` (or `"dinou/config"`). Config files and plugins are compiled AOT into every production bundle (zero runtime `esbuild` dependency) and hot-reload in `dinou dev`:

```ts
import { defineConfig } from "dinou";
import { RedisStorage } from "dinou/server";

export default defineConfig({
  reactCompiler: true,         // Default: true (babel-plugin-react-compiler across Esbuild, Rollup & Webpack prod builds)
  reactStrictMode: true,       // Default: true (dev only)
  ppr: false,                  // Global PPR default per segment (overridable in page_functions / layout_functions)
  allowISG: true,              // Global ISG default for dynamic segments (set false for strict SSG-only 404 mode)
  assetExtensions: ["glb"],    // Optional extra static binary/media extensions (auto-typed by dinou typegen)
  setupFiles: ["@/polyfills"], // Runs once at Line 1 before modules load (supports tsconfig aliases)
  // storage: new RedisStorage(redisClient, { prefix: "dinou:", hydrateFromDisk: true }),
  plugins: [
    {
      name: "auth-and-webhooks",
      // 1. Universal Web Standards HTTP Middleware & Webhook Handler (skipped during build-time SSG)
      async onRequest(request, context) {
        // context.req.path is normalized even on SPA /____rsc_* fetches
        if (context.req.path === "/api/health" && request.method === "GET") {
          return Response.json({ ok: true }); // Short-circuits React rendering (<2ms)
        }

        // Mutate context for downstream Server Components & Server Functions
        context.user = { id: request.headers.get("x-user-id") ?? "guest" };
      },

      // 2. Optional Node.js HTTP Server Hook (WebSockets, Socket.IO, Connect/Express middleware)
      configureServer({ server, isDev, use }) {
        use((req, res, next) => {
          res.setHeader("X-Powered-By", "Dinou");
          next();
        });
      },
    },
  ],
});
```

### Pluggable ISR Storage Adapters (`"dinou/server"`)
- `FileSystemStorage(baseDir?)`: Default on Node.js, Bun & Deno (persists to `.dinou/dist2`).
- `CloudflareKVStorage(kvNamespace)`: Default on Cloudflare Workers when `env.DINOU_CACHE` KV binding is present (with cursor-paginated `keys()`).
- `DenoKVStorage(kvInstance?)`: Default on Deno / Deno Deploy when Deno KV is available.
- `MemoryStorage({ hydrateFromDisk? })`: Default on Netlify Functions v2 (`hydrateFromDisk: true`) and isolated unit tests (`hydrateFromDisk: false`).
- `RedisStorage(redisClient, prefixOrOptions?)`: Distributed cluster cache (`node-redis`, `ioredis`, Upstash) with cluster tombstones & tag invalidation timestamps.
- Custom adapter: extend `StorageAdapter` (`get(key)`, `set(key, content, metadata?)`, `has(key)`, `delete(key)`, optional `keys(prefix?)`) or call `setStorageAdapter(adapter)`.

---

## 9. Styling, Assets, Environment Variables & Aliases

- **Global CSS & Tailwind CSS v4:** Import `./styles.css` in `src/layout.tsx` (compiled automatically via PostCSS + `@tailwindcss/postcss` + `autoprefixer` into `/styles.css`, minified in production across all 3 bundlers) and link it in `<head>`:
  ```tsx
  import "./styles.css";
  // Inside RootLayout <head>:
  <link rel="stylesheet" href="/styles.css" precedence="default" />
  ```
- **CSS Modules & `url(...)`:** Any `*.module.css` works natively in both Server Components (RSC) and Client Components with zero hydration mismatches; relative/aliased CSS `url(...)` assets fingerprint into `/assets/[name]-[hash].[ext]`.
- **Media & Asset Imports:** 26 built-in extensions (8 image, 7 video, 6 audio, 5 font formats) plus custom `assetExtensions` in `dinou.config.*`, content+path hashed to `/assets/[name]-[hash].[ext]`; reference `dinou/env` in `dinou-env.d.ts` for TS types.
- **Public Directory (`public/`):** Unhashed root static files (`/favicon.ico`, `/robots.txt`, `/sitemap.xml`, `/manifest.json`, `/.well-known/*`, `/llms.txt`) copied to `.dinou/dist3/` with RFC 9110 `206` byte-range streaming and dotfile/`.env*` protection (`404`).
- **Path Aliases (`tsconfig.json` / `jsconfig.json`):** Full `paths`, `baseUrl`, recursive `extends`, and `${configDir}` resolution across TS/JSX, CSS `@import`/`url(...)`, `setupFiles`, `dinou.config.ts`, and assets in all 3 bundlers with dev hot-reload.
- **Environment Variables & `DINOU_PUBLIC_*`:** Native `.env.<NODE_ENV>.local` → `.env.local` → `.env.<NODE_ENV>` → `.env` hierarchy (OS vars win; dev hot-reload; auto-typed `NodeJS.ProcessEnv`). Unprefixed `process.env.*` evaluates to `undefined` in `"use client"`; `DINOU_PUBLIC_*` inlines at build time across all bundlers/runtimes. On the server, prefer `getContext().env` for Node, Bun, Deno, Cloudflare (KV/D1/R2), and Netlify parity.

---

## 10. Bundlers, Deployment Targets, Dual-Mode Vendoring & Eject / Uneject

### Multi-Bundler Parity & React Compiler
Dinou provides 100% feature parity across three bundlers—with **`babel-plugin-react-compiler` enabled by default in production across all three** (toggle via `reactCompiler` in `dinou.config.*` or opt out locally with `"use no memo"`):
- **esbuild** (Default): Fastest builds and HMR (SWC disk cache + Esbuild).
- **Rollup** (`:rollup`): Clean ES module output.
- **Webpack** (`:webpack`): Full Webpack 5 ecosystem compatibility.

### Deployment Targets
- **Node.js:** `npm run build && npm start` (emits `.dinou/node/server.mjs`; standalone binaries via `build:node:compile` / `build:node:pure:compile`).
- **Netlify Functions v2:** `npm run build:netlify` (or `npm run build`) emits a self-contained AOT bundle at `.dinou/netlify/functions/ssr.mjs` (`publish = ".dinou/dist3"`, `included_files = [".dinou/dist2/**"]`).
- **Cloudflare Workers:** `npm run build:cloudflare && npx wrangler deploy` (emits `.dinou/cloudflare/worker.js` + `[assets] directory = ".dinou/cloudflare/assets"`, `run_worker_first = true`, `html_handling = "none"`).
- **Bun:** `npm run build:bun && npm run start:bun` (or `build:bun:compile` / `build:bun:pure:compile` → `dist/server`).
- **Deno:** `npm run build:deno && npm run start:deno` (or `build:deno:compile` → `dist/deno-server`).
- **Static Export (SPA):** `npm run export-static` exports standalone HTML + `.rsc` SPA navigation payloads + static assets into `out/`.

### Dual-Mode Vendoring (`--unvendorized` / `-u`)
By default, Dinou runs in **Vendorized Mode**, resolving 31 pre-compiled zero-drift toolchain bundles from `dinou/compiled/` via `package.json` `#imports`. Pass `-u` / `--unvendorized` (e.g. `npm run dev -- -u`, `npx dinou build -u`, or `DINOU_UNVENDORIZED=true`) to resolve those packages directly from `node_modules` via `--conditions=unvendorized`.

### Reversible Eject & Uneject (`dinou eject` / `npm run uneject`)
`npx dinou eject` copies Dinou into `./dinou`, selectively rewrites existing Dinou scripts in `package.json`, adds `"build:vendors"` and `"uneject"`, and links `"dinou": "file:./dinou"` (user `"dinou"` imports stay untouched). Run `npm run uneject` (or `npm run uneject -- <version>`) anytime to transactionally restore `package.json`, reinstall `dinou` (with automatic rollback on failure), and remove `./dinou`.

---

## 11. Complete Public Exports Cheat-Sheet

### Package `"dinou"`
| Export | Kind | Description |
| :--- | :--- | :--- |
| `Link` | Component | Client SPA navigation `<Link href/to="..." params? from? prefetch? fresh? />` |
| `ClientRedirect` | Component | Client mount redirect `<ClientRedirect to="..." />` |
| `redirect` | Function | Universal redirect `redirect("/path")` (HTTP 302, SPA `x-rsc-redirect`, or `<ClientRedirect />`) |
| `useRouter` | Hook (Client) | `{ push, replace, back, forward, refresh, refreshSlot }` (referentially stable) |
| `usePathname` | Hook (Universal) | Current URL pathname string |
| `useSearchParams` | Hook (Universal) | Current `URLSearchParams` (Server: dynamic/PPR hole; Client: zero-`#418` hydration sync) |
| `useNavigationLoading` | Hook (Client) | Boolean pending navigation state |
| `refreshSlot` | Function (Client) | `refreshSlot(slotIdOrTag, { fresh?: boolean }): Promise<void>` (supports `"*"` wildcard) |
| `getContext` | Function (Server) | Returns `{ req, res, env, ctx, ...custom }` (`RequestContextStore`) from `AsyncLocalStorage` |
| `noDynamic` | Function (Server) | Opts enclosing `<Suspense>` out of becoming a Dynamic PPR Hole on `ppr = true` routes |
| `defineConfig` | Function | Type-safe helper for `dinou.config.{ts,mjs,js,cjs}` |
| `PageProps<T, P>`, `LayoutProps<T, P>`, `SlotProps<T>`, `ErrorProps<T>`, `NotFoundProps<T, P>`, `PageFunctions<T, P>`, `LayoutFunctions<T, P>`, `RouteSegmentConfig`, `PPRConfig`, `StaticPathItem`, `StaticPathsResult`, `RouteParams<T>`, `LayoutParams<T>`, `LayoutSlots<T>`, `SlotParams<T>`, `ErrorParams<T>`, `DinouRoute`, `DinouLinkTarget`, `DinouFromRoute`, `DinouRoutePattern`, `DinouLayoutPattern`, `DinouSlotPattern`, `DinouErrorPattern`, `DinouNotFoundPattern`, `DinouSegmentPattern`, `DinouRouter`, `CleanRoutePath`, `ExtractRouteParams`, `ExtractSegmentParam`, `LinkProps`, `ScopedLinkProps`, `ScopedLinkComponent`, `ScopedUseRouterHook`, `ClientRedirectProps`, `NavigationOptions`, `DinouEnv`, `RequestContextStore`, `ResponseProxy`, `CookieOptions`, `Query`, `Cookies`, `Headers`, `DinouConfig`, `DinouPlugin`, `ServerHookContext`, `NodeMiddleware` | TypeScript Types | Complete compile-time routing, segment prop, slot, relative navigation, context, env, and plugin types |

### Contextual Virtual Module `"./dinou"` (Inside `src/` Route & `@slot` Folders, or `"../dinou"` from Nested `components/`)
| Export | Kind | Description |
| :--- | :--- | :--- |
| `ROUTE` | Constant (`string`) | Exact URL route pattern of that folder (e.g. `"/blog/[slug]"`) |
| `Link`, `useRouter` | Component / Hook | Pre-bound to `from={ROUTE}` so relative paths (`"sub"`, `"./sub"`, `"../other"`) validate & resolve without `from` |
| `PageProps<TProps?>`, `LayoutProps<TProps?>`, `SlotProps`, `ErrorProps`, `NotFoundProps<TProps?>`, `PageFunctions<TProps?>`, `LayoutFunctions<TProps?>`, `RouteParams<T?>`, `LinkProps` | TypeScript Types | Zero-boilerplate segment & link contracts pre-bound to that folder (`LayoutProps` auto-infers sibling `@slot` props) |
| All other `"dinou"` values & types | Re-exports | Full parity with `"dinou"` (`defineConfig`, `getContext`, `noDynamic`, hooks, `redirect`, `ClientRedirect`, types including `DinouEnv`) |

### Package `"dinou/server"`
| Export | Kind | Description |
| :--- | :--- | :--- |
| `DinouCacheSlot` | Server Component | `<DinouCacheSlot id? tag? tags? revalidate?>{children}</DinouCacheSlot>` |
| `getContext` | Function (Server) | Returns `{ req, res, env, ctx, ...custom }` from `AsyncLocalStorage` (also in `"dinou"`) |
| `noDynamic` | Function (Server) | Opts enclosing `<Suspense>` out of becoming a Dynamic PPR Hole (also in `"dinou"`) |
| `revalidateTag` | Function (Server) | `await revalidateTag(tag)` — invalidates tagged pages, layouts & slots |
| `revalidatePath` | Function (Server) | `await revalidatePath(path)` — invalidates route layout + page (supports relative paths in Server Functions) |
| `revalidatePage` | Function (Server) | `await revalidatePage(path)` — invalidates only `page.rsc` + `index.html` |
| `revalidateLayout` | Function (Server) | `await revalidateLayout(path)` — invalidates only `layout.rsc` (lazy HTML re-composition) |
| `StorageAdapter`, `FileSystemStorage`, `CloudflareKVStorage`, `DenoKVStorage`, `MemoryStorage`, `RedisStorage`, `getStorageAdapter`, `setStorageAdapter` | Storage API | Pluggable cache storage engines for SSG / ISR / PPR / `DinouCacheSlot` |
| `DinouCacheSlotProps`, `StorageItem`, `MemoryStorageOptions`, `RedisStorageOptions`, plus all routing, segment, slot, context & plugin types from `"dinou"` | TypeScript Types | Complete server-side & routing TypeScript definitions re-exported from `"dinou/server"` |

### Package `"dinou/config"` & Additional Subpaths
| Subpath | Export / Purpose | Description |
| :--- | :--- | :--- |
| `"dinou/config"` | `defineConfig`, `getContext`, `noDynamic` (+ types from `index.d.ts`) | Dedicated config entry point (`dinou/core/config.js`) for `dinou.config.{ts,mjs,js,cjs}` |
| `"dinou/env"` | Ambient TypeScript definitions | `/// <reference types="dinou/env" />` — declares module types for all 26 built-in static asset & media extensions |
| `"dinou/adapters/{node,bun,deno,cloudflare,netlify}"` | Platform runtime adapters | Server entry points for each deployment runtime |

> **Import Safety:** `"dinou"`, contextual `"./dinou"`, and any `import type` are safe in both Server and `"use client"` modules. Runtime value imports from `"dinou/server"` are **Server-Only** (`node:*`).

---

## License

[MIT](./LICENSE.md)
