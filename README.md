# Dinou

[![Documentation](https://img.shields.io/badge/docs-dinou.dev-blue?style=flat-square)](https://dinou.dev)
[![Version](https://img.shields.io/badge/version-9.4.0-orange?style=flat-square)](https://www.npmjs.com/package/dinou)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](./LICENSE.md)

**The Ejectable Full-Stack React 19 Framework.**

Build full-stack web applications with native **React Server Components (RSC)**, progressive streaming SSR, compile-time type-safe routing, **3-Dimensional Caching** (**Horizontal Segmentation**, **Vertical `<DinouCacheSlot>` Micro-ISR**, and **Temporal Segmentation / Partial Prerendering (PPR)**), **Dual-Mode Vendoring**, and universal multi-platform deployment (**Node.js**, **Bun**, **Deno**, **Cloudflare Workers**, **Netlify**, and **Static Export**) with zero vendor lock-in.

> 📚 **Full Documentation, Guides & Interactive Tutorials:** **[https://dinou.dev](https://dinou.dev)**
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
8. [Configuration (`dinou.config.mjs`), Middleware (`onRequest`) & Storage Adapters](#8-configuration-dinouconfigmjs-middleware-onrequest--storage-adapters)
9. [Styling, Assets, Environment Variables & Aliases](#9-styling-assets-environment-variables--aliases)
10. [Bundlers, Deployment Targets, Dual-Mode Vendoring & Eject](#10-bundlers-deployment-targets-dual-mode-vendoring--eject)
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
| `dinou build` / `build:node` | `build:node:{esbuild,rollup,webpack}` | Build production bundle and pre-render static routes for Node.js. |
| `dinou start` / `start:node` | `start:node:{esbuild,rollup,webpack}` | Start production Node.js server. |
| `dinou build:cloudflare` | `build:cloudflare:{esbuild,rollup,webpack}` | Build for Cloudflare Workers (`workerd` + KV). |
| `dinou build:bun` / `start:bun` | `build:bun:{esbuild,rollup,webpack}` | Build and start for Bun runtime (`build:bun:pure` runs 100% under Bun). |
| `dinou build:deno` / `start:deno` | `build:deno:{esbuild,rollup,webpack}` | Build and seed Deno KV for Deno / Deno Deploy. |
| `dinou build:{node,bun,deno}:compile` | `...compile:{linux,linux_arm,mac,win}:{bundler}` | Compile standalone single-file native executable (`dist/`). |
| `dinou export-static` | `export-static:{esbuild,rollup,webpack}` | Export pure static site to `dist/` (HTML + RSC payloads + assets). |
| `dinou typegen` | — | Generate `.dinou/types/routes.d.ts` & `.dinou/routes/**/dinou.{js,d.ts}`. |
| `dinou eject` | — | Eject full Dinou compiler & runtime into `./dinou` at project root. |

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
├── dinou.config.mjs            # Optional framework config, plugins, storage & middleware
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
| `[[...slug]]` | `src/shop/[[...slug]]/page.tsx` | `/shop`, `/shop/a/b` (0+ segments) | `{ slug?: string[] }` |
| `(group)` | `src/(marketing)/pricing/page.tsx` | `/pricing` | Organization group (omitted from URL). |
| `_escaped` | `src/_legacy/page.tsx` | *(Ignored)* | Folders starting with `_` are ignored by the route scanner. |
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
Inside any route or `@slot` folder in `src/`, import from `"./dinou"`—or `"../dinou"` from a nested helper subfolder like `_components/` (resolved via TS `rootDirs` and bundler plugins; defers to any user `dinou.*` file in `src/`). Segment contracts (`PageProps`, `LayoutProps` with auto-inferred `@slot` props, `SlotProps`, `ErrorProps`, `NotFoundProps`, `PageFunctions`, `LayoutFunctions`, `RouteParams`, `ROUTE`) and relative navigation (`<Link>`, `useRouter()`) are pre-bound to that folder:
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
| `ppr` | `boolean \| (() => boolean \| Promise<boolean>)` | `false` (or global `dinou.config.mjs`) | Enables **Partial Prerendering** strictly for **this segment** (no parent-to-child inheritance; falls back to `dinou.config.mjs`). |
| `getCacheTags` | `string[] \| ((params) => string[] \| Promise<string[]>)` | `[]` | Tags associated with this page or layout segment for surgical invalidation via `revalidateTag(tag)`. |
| `getProps` | `(params) => TProps \| Promise<TProps>` | `{}` | Server-only loader; spreads props onto `page.tsx` (`not_found.tsx`) or `layout.tsx`. Un-awaited `Promise`/`Promise[]` values stream directly to `"use client"` `use(promise)` inside `<Suspense>` without blocking TTFB. |
| `getStaticPaths` | `StaticPathItem[] \| (() => StaticPathsResult)` | `[]` | Pre-generates paths at build time (`["a"]`, numbers, catch-all `[["a", "b"]]`, or param objects `[{ slug: "a" }]`). |
| `validateParams` | `(params) => boolean \| Promise<boolean>` | `() => true` | Per-segment guard run **before** `getProps`/rendering with accumulated `params`; returning `false` returns HTTP 404 across HTML, layout RSC, and page RSC. |
| `allowISG` | `boolean \| (() => boolean \| Promise<boolean>)` | `true` (or global `dinou.config.mjs`) | Per-segment ISG control: `true` caches unknown params on demand; `false` returns 404. Static layouts ignore `allowISG = false`; valid pre-rendered dynamic layouts preserve child `allowISG = true`. |

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
  - `revalidate?: number`: Slot TTL in seconds (`0` = never cached; `> 0` = time-based Micro-ISR; omitted = cached until invalidated).
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

**Partial Prerendering (PPR)** is Dinou's **Temporal Segmentation** axis: it splits a single route across *time*, delivering the pre-rendered **Static Shell (`shell.html`)** at $t = 0\text{ ms}$ (build/revalidation time) while streaming personalized or live **`<Suspense>` Dynamic Holes** concurrently at request time over the same HTTP connection.

Enable PPR globally (`dinou.config.mjs` `ppr: true`) or per-segment (`export const ppr = true | false` in `page_functions.ts` / `layout_functions.ts`). **`ppr` is strictly per-segment with zero parent-to-child inheritance** (falling back to `dinou.config.mjs`, default `false`), supporting mixed-PPR chains (e.g. `ppr = false` layout -> `ppr = true` nested layout -> `ppr = false` page) in isolated scopes.

#### How `<Suspense>` Boundaries, Dynamic PPR Holes & `noDynamic()` Work:
1. **`<Suspense>` Is the Single Boundary (`ppr = true` vs. `ppr = false`):**
   - **Outside `<Suspense>`** (top-level `async` Page/Layout, `getProps`, or unwrapped child `async` Server Components): Awaited at build/revalidation time and baked directly into the **Static Shell (`shell.html`)**. *(Accessing `req.cookies`, `req.headers`, `req.query`, calling `useSearchParams()` in a Server Component, or rendering `<DinouCacheSlot revalidate={0}>` outside `<Suspense>` triggers a Full-Page Dynamic Bailout).*
   - **Inside `<Suspense fallback={...}>` (Default = Dynamic PPR Hole):** On `ppr = true` segments, **any `async` Server Component** (postponed immediately at its first `await` with zero build latency), any `"use client"` component receiving an **un-awaited `Promise` (or `Promise[]`) prop**, any **Server Component** reading `getContext()` (`req.cookies`, `req.headers`, `req.query`) / `useSearchParams()`, or `<DinouCacheSlot revalidate={0}>` automatically becomes a **Dynamic PPR Hole** (`data-ppr-hole`). Its `<Suspense>` fallback is baked into `shell.html` (`0ms` TTFB) and the resolved content streams live over the same HTTP response at request time. *(By contrast, a `"use client"` component calling `useSearchParams()` does not create a server PPR hole or bailout: it stays in the Static Shell, hydrates with an empty `URLSearchParams` for zero `#418` mismatch, and immediately syncs with the live URL. On `ppr = false` segments, `<Suspense>` subtrees resolve statically at build time into `index.html`).*
2. **Static `<Suspense>` Opt-Out via `noDynamic()` (`"dinou"` or `"dinou/server"`):**
   - If an `async` Server Component inside `<Suspense>` on a `ppr = true` route should instead resolve at build time into the **Static Shell (`shell.html`)** (e.g., static Markdown/syntax highlighting), call **`noDynamic()`** synchronously at the top of the component **before its first `await`**.
   - At runtime, leaf static `<Suspense>` boundaries opted out via `noDynamic()` automatically short-circuit (`0ms`, zero re-execution) when sibling dynamic holes stream. *(If `req.cookies`, `req.headers`, or `req.query` is read inside a `noDynamic()` subtree, dynamic bailout always wins).*
3. **Single-Request Streaming:** On incoming HTTP requests, Dinou flushes the cached `shell.html` immediately and concurrently streams all Dynamic PPR Holes over the same HTTP response stream. If a `ppr = true` route has zero dynamic holes (`holes: []`), Dinou serves `shell.html` directly with zero runtime component execution.

---

### 5.4. The Triple Synergy (Horizontal + Vertical + Temporal / PPR)

All three dimensions compose simultaneously in the same route tree:
- **Layout Level:** Can be Static (HS), Dynamic (HS), or PPR (`layout_functions.ts` with `ppr = true`), and can contain `<DinouCacheSlot>` components both in the **Layout Static Shell** and inside **Layout Dynamic `<Suspense>` Holes**.
- **Page Level:** Can be Static (HS), Dynamic (HS), or PPR (`page_functions.ts` with `ppr = true`), and can contain `<DinouCacheSlot>` components both in the **Page Static Shell** and inside **Page Dynamic `<Suspense>` Holes**:
  - **`<DinouCacheSlot>` Outside `<Suspense>` (or Wrapping an Inner `<Suspense>`)**: Resolves at build time into the **Static Shell (`shell.html` + `slot.json`)**, preserving any inner `<Suspense>` node in `slot.json` and using non-blocking background SWR upon TTL expiration.
  - **`<Suspense>` Wrapping `<DinouCacheSlot>` (`<Suspense><DinouCacheSlot>...</DinouCacheSlot></Suspense>`)**: Acts as a **Cached Dynamic PPR Hole** by default on `ppr = true` routes (unless opted out via `noDynamic()`), baking the `<Suspense>` fallback into `shell.html` and caching `slot.json` across runtime hole streams.
- **Synergy Invalidation Invariants:**
  1. Invalidating a `<DinouCacheSlot>` inside a **PPR Dynamic Hole** (`revalidateTag("hole-slot")`) updates only that slot on the next request without regenerating `shell.html` or sibling slots.
  2. Invalidating a `<DinouCacheSlot>` inside a **PPR Static Shell** (`revalidateTag("shell-slot")`) purges the slot and automatically enqueues background regeneration of the host `shell.html` (and `layout.rsc` if the slot lives in the layout shell), while leaving sibling cached slots untouched.
  3. Calling `refreshSlot(idOrTag, { fresh: true })` (or `refreshSlot("*", { fresh: true })`) from the browser updates slots live in the DOM across the Layout Shell, Layout Holes, Page Shell, and Page Holes simultaneously, **and** enqueues background regeneration of any affected static shells so a subsequent F5 hard reload serves the exact updated slot tokens with **zero hydration mismatch**.
- **Single-Pass Inline RSC Streaming & Scoped Server `useId()`:**
  - **Single-Pass Inline RSC Streaming (`__DINOU_RSC_L__` & `__DINOU_RSC_P__`):** On dynamic SSR, PPR resumes, and first-time ISG renders/bailouts, Dinou evaluates layouts and page **once per request** and streams segmented Flight payloads inline in `<script>` tags, eliminating extra `/____rsc_layout____` & `/____rsc_page____` round-trips and `#418` hydration mismatches.
  - **Deterministic Segment-Scoped `useId()` in Server Components:** Sync and `async` Server Components support `useId()` (plus stateless `useMemo` / `useCallback`), generating collision-free IDs scoped per segment (`_layout_...`, `_page_...`, `_slot_...`, `_hole_...`) across Horizontal Segmentation, `<DinouCacheSlot>` refreshes, and PPR holes.

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
| `redirect(url)` | Universal | `(destination: string) => ReactNode` | In `getProps` or Server Functions/Components before headers flush: sends real HTTP `307 Temporary Redirect` (or `X-Dinou-Redirect` in RPC). If streaming has already started or on client: renders `<ClientRedirect to={destination} />`. |
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
Call `getContext()` (from `"dinou"` or `"dinou/server"`) synchronously inside any Server Component, `getProps`, `validateParams`, or `"use server"` function:
```ts
import { getContext } from "dinou";

export async function updateThemeAction(theme: string) {
  "use server";
  const ctx = getContext();
  if (!ctx) return; // undefined during static build time if no request is active

  const currentCookie = ctx.req.cookies["theme"];
  const userAgent = ctx.req.headers["user-agent"];

  ctx.res.cookie("theme", theme, { path: "/", httpOnly: true, maxAge: 86400 });
  ctx.res.setHeader("X-Custom-Header", "updated");
}
```
- `ctx.req`: `{ query, cookies, headers, path, method, env, ctx }`
- `ctx.res`: `{ cookie(name, val, opts?), clearCookie(name, opts?), setHeader(name, val), status(code), redirect(statusOrUrl, url?) }`
- `ctx.env` / `ctx.ctx`: Platform bindings (e.g., Cloudflare Workers `env.DB`, `env.KV`, `ctx.waitUntil`).

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

## 8. Configuration (`dinou.config.mjs`), Middleware (`onRequest`) & Storage Adapters

Create `dinou.config.mjs` (or `.js` / `.ts`) at the project root using `defineConfig` from `"dinou"` (or `"dinou/config"`):

```js
import { defineConfig } from "dinou";
import { RedisStorage } from "dinou/server";

export default defineConfig({
  reactStrictMode: true, // Default: true
  ppr: false,            // Global PPR default per segment (can be overridden in page_functions / layout_functions)
  allowISG: true,        // Global ISG default for dynamic segments (set false for strict SSG-only 404 mode)
  setupFiles: ["./dinou.setup.ts"],
  // storage: new RedisStorage(redisClient, "dinou:"),
  plugins: [
    {
      name: "auth-and-webhooks",
      // 1. Universal Web Standards HTTP Middleware & Webhook Handler
      async onRequest(request, context) {
        const url = new URL(request.url);

        // Short-circuit webhooks or API endpoints (<2ms, bypasses React)
        if (url.pathname === "/api/health") {
          return Response.json({ ok: true });
        }

        // Mutate context for downstream Server Components & Server Functions
        context.user = { id: request.headers.get("x-user-id") ?? "guest" };
      },

      // 2. Optional Node.js HTTP Server Hook (WebSockets, raw Node middleware)
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
- `FileSystemStorage(baseDir?)`: Default on Node.js & Bun (persists to `.dinou/dist2`).
- `CloudflareKVStorage(kvNamespace)`: Default on Cloudflare Workers when `env.DINOU_CACHE` KV binding is present.
- `DenoKVStorage(kvInstance?)`: Default on Deno / Deno Deploy.
- `MemoryStorage()`: In-memory fallback when no persistent store is configured.
- `RedisStorage(redisClient, prefix?)`: Distributed cluster cache for multi-instance deployments.
- Custom adapter: extend `StorageAdapter` (`get(key)`, `set(key, content, metadata?)`, `has(key)`, `delete(key)`) or call `setStorageAdapter(adapter)`.

---

## 9. Styling, Assets, Environment Variables & Aliases

- **Global CSS & Tailwind CSS v4:** Import `./styles.css` in `src/layout.tsx` (compiled automatically via PostCSS + `@tailwindcss/postcss` + `autoprefixer` into `/styles.css`) and link it in `<head>`:
  ```tsx
  import "./styles.css";
  // Inside RootLayout <head>:
  <link rel="stylesheet" href="/styles.css" precedence="default" />
  ```
- **CSS Modules:** Any `*.module.css` file returns scoped class names (`import styles from "./card.module.css"`).
- **Media & Asset Imports:** Import 21+ formats (`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.avif`, `.ico`, `.mp4`, `.webm`, `.ogg`, `.mp3`, `.wav`, `.flac`, `.aac`, `.woff`, `.woff2`, `.eot`, `.ttf`, `.otf`, `.pdf`) in Server or Client Components for hashed URLs; reference `dinou/env` in `dinou-env.d.ts` for TS types.
- **Public Directory (`public/`):** Files in `public/` are copied verbatim to `.dinou/dist3/` and served at the root URL (`/favicon.ico`, `/robots.txt`).
- **Path Aliases (`tsconfig.json`):** Configure `compilerOptions.paths` (e.g. `"@/*": ["./src/*"]`) in `tsconfig.json`. Dinou automatically resolves aliases across TypeScript/JSX, CSS `@import`, and asset imports in all three bundlers (esbuild, Rollup, Webpack).
- **Environment Variables:** `.env` files are loaded on the server via `dotenv`. For security, `process.env` secrets are **server-only** and never bundled into client code; pass public values explicitly as props from Server Components to Client Components.

---

## 10. Bundlers, Deployment Targets, Dual-Mode Vendoring & Eject

### Multi-Bundler Parity
Dinou provides 100% feature parity across three bundlers:
- **esbuild** (Default): Fastest builds and HMR.
- **Rollup** (`:rollup`): Clean ES module output.
- **Webpack** (`:webpack`): Includes `babel-plugin-react-compiler` automatic memoization in production builds.

### Deployment Targets
- **Node.js:** `npm run build && npm start` (entry: `dinou/adapters/node`).
- **Cloudflare Workers:** `npm run build:cloudflare && npx wrangler deploy` (generates `.dinou/cloudflare/worker.js`).
- **Bun:** `npm run build:bun && npm run start:bun` (or `npm run build:bun:compile` for standalone binary).
- **Deno:** `npm run build:deno && npm run start:deno` (or `npm run build:deno:compile` for standalone binary).
- **Netlify:** Uses `dinou/adapters/netlify` serverless entry.
- **Static Export:** `npm run export-static` outputs a self-contained static site into `dist/`.

### Dual-Mode Vendoring (`--unvendorized` / `-u`)
By default, Dinou runs in **Vendorized Mode**, resolving Babel, PostCSS, Tailwind, Rollup/Webpack plugins, `ws`, `chokidar`, etc. from pre-compiled zero-install bundles in `dinou/compiled/` via `package.json` `#imports`.
Pass `-u` / `--unvendorized` (e.g. `npm run dev -- -u`, `npx dinou build -u`, or `DINOU_UNVENDORIZED=true`) to resolve those packages from your `node_modules` via `--conditions=unvendorized`.

### Ejecting (`npx dinou eject`)
Running `npx dinou eject` copies the complete Dinou framework into `./dinou` at your project root and rewrites `package.json` scripts and imports to use `./dinou/index.js`, `./dinou/server.js`, and `./dinou/cli.js`, giving you 100% ownership of the compiler and runtime.

---

## 11. Complete Public Exports Cheat-Sheet

### Package `"dinou"`
| Export | Kind | Description |
| :--- | :--- | :--- |
| `Link` | Component | Client SPA navigation `<Link href/to="..." params? from? prefetch? fresh? />` |
| `ClientRedirect` | Component | Client mount redirect `<ClientRedirect to="..." />` |
| `redirect` | Function | Universal redirect `redirect("/path")` (HTTP 307 or SPA redirect) |
| `useRouter` | Hook (Client) | `{ push, replace, back, forward, refresh, refreshSlot }` |
| `usePathname` | Hook (Universal) | Current URL pathname string |
| `useSearchParams` | Hook (Universal) | Current `URLSearchParams` (Server: dynamic/PPR hole; Client: zero-`#418` hydration sync) |
| `useNavigationLoading` | Hook (Client) | Boolean pending navigation state |
| `refreshSlot` | Function (Client) | `refreshSlot(slotIdOrTag, { fresh?: boolean }): Promise<void>` (supports `"*"` wildcard) |
| `getContext` | Function (Server) | Returns `{ req, res, env, ctx, ...custom }` from `AsyncLocalStorage` |
| `noDynamic` | Function (Server) | Opts enclosing `<Suspense>` out of becoming a Dynamic PPR Hole on `ppr = true` routes |
| `defineConfig` | Function | Type-safe helper for `dinou.config.mjs` |
| `PageProps<T, P>`, `LayoutProps<T, P>`, `SlotProps<T>`, `ErrorProps<T>`, `NotFoundProps<T, P>`, `PageFunctions<T, P>`, `LayoutFunctions<T, P>`, `RouteSegmentConfig`, `PPRConfig`, `StaticPathItem`, `StaticPathsResult`, `RouteParams<T>`, `LayoutParams<T>`, `LayoutSlots<T>`, `SlotParams<T>`, `ErrorParams<T>`, `DinouRoute`, `DinouLinkTarget`, `DinouFromRoute`, `DinouRoutePattern`, `DinouLayoutPattern`, `DinouSlotPattern`, `DinouErrorPattern`, `DinouNotFoundPattern`, `DinouSegmentPattern`, `DinouRouter`, `CleanRoutePath`, `ExtractRouteParams`, `ExtractSegmentParam`, `LinkProps`, `ScopedLinkProps`, `ScopedLinkComponent`, `ScopedUseRouterHook`, `ClientRedirectProps`, `NavigationOptions`, `RequestContextStore`, `ResponseProxy`, `CookieOptions`, `Query`, `Cookies`, `Headers`, `DinouConfig`, `DinouPlugin`, `ServerHookContext`, `NodeMiddleware` | TypeScript Types | Complete compile-time routing, segment prop, slot, relative navigation, context, and plugin types |

### Contextual Virtual Module `"./dinou"` (Inside `src/` Route & `@slot` Folders, or `"../dinou"` from Nested `_components/`)
| Export | Kind | Description |
| :--- | :--- | :--- |
| `ROUTE` | Constant (`string`) | Exact URL route pattern of that folder (e.g. `"/blog/[slug]"`) |
| `Link`, `useRouter` | Component / Hook | Pre-bound to `from={ROUTE}` so relative paths (`"sub"`, `"./sub"`, `"../other"`) validate & resolve without `from` |
| `PageProps<TProps?>`, `LayoutProps<TProps?>`, `SlotProps`, `ErrorProps`, `NotFoundProps<TProps?>`, `PageFunctions<TProps?>`, `LayoutFunctions<TProps?>`, `RouteParams<T?>`, `LinkProps` | TypeScript Types | Zero-boilerplate segment & link contracts pre-bound to that folder (`LayoutProps` auto-infers sibling `@slot` props) |
| All other `"dinou"` values & types | Re-exports | Full parity with `"dinou"` (`defineConfig`, `getContext`, `noDynamic`, hooks, `redirect`, `ClientRedirect`, types) |

### Package `"dinou/server"`
| Export | Kind | Description |
| :--- | :--- | :--- |
| `DinouCacheSlot` | Server Component | `<DinouCacheSlot id? tag? tags? revalidate?>{children}</DinouCacheSlot>` |
| `getContext` | Function (Server) | Returns `{ req, res, env, ctx, ...custom }` from `AsyncLocalStorage` (also in `"dinou"`) |
| `noDynamic` | Function (Server) | Opts enclosing `<Suspense>` out of becoming a Dynamic PPR Hole (also in `"dinou"`) |
| `revalidateTag` | Function (Server) | `await revalidateTag(tag)` — invalidates tagged pages, layouts & slots |
| `revalidatePath` | Function (Server) | `await revalidatePath(path)` — invalidates route layout + page |
| `revalidatePage` | Function (Server) | `await revalidatePage(path)` — invalidates only `page.rsc` + `index.html` |
| `revalidateLayout` | Function (Server) | `await revalidateLayout(path)` — invalidates only `layout.rsc` (lazy HTML re-composition) |
| `StorageAdapter`, `FileSystemStorage`, `CloudflareKVStorage`, `DenoKVStorage`, `MemoryStorage`, `RedisStorage`, `getStorageAdapter`, `setStorageAdapter` | Storage API | Pluggable cache storage engines for SSG / ISR / PPR / `DinouCacheSlot` |
| `DinouCacheSlotProps`, `StorageItem`, plus all routing, segment, slot, context & plugin types from `"dinou"` | TypeScript Types | Complete server-side & routing TypeScript definitions re-exported from `"dinou/server"` |

### Package `"dinou/config"` & Additional Subpaths
| Subpath | Export / Purpose | Description |
| :--- | :--- | :--- |
| `"dinou/config"` | `defineConfig` (+ types from `index.d.ts`) | Dedicated config-only entry point (`dinou/core/config.js`) for `dinou.config.{mjs,js,ts}` |
| `"dinou/env"` | Ambient TypeScript definitions | `/// <reference types="dinou/env" />` — declares module types for 21+ static asset & media extensions |
| `"dinou/adapters/{node,bun,deno,cloudflare,netlify}"` | Platform runtime adapters | Server entry points for each deployment runtime |

> **Import Safety:** `"dinou"`, contextual `"./dinou"`, and any `import type` are safe in both Server and `"use client"` modules. Runtime value imports from `"dinou/server"` are **Server-Only** (`node:*`).

---

## License

[MIT](./LICENSE.md)
