# **Dinou**

[![Documentation](https://img.shields.io/badge/docs-dinou.dev-blue?style=flat-square)](https://dinou.dev) [![Version](https://img.shields.io/badge/version-7.0.0-orange?style=flat-square)](https://www.npmjs.com/package/dinou)

### **Lightweight-Ejectable Full-Stack React 19 Framework**

---

Support for React Server Components (RSC), Server Functions, Server-Side Rendering (SSR), Static Generation (SSG), Incremental Static Generation (ISG), Incremental Static Regeneration (ISR), and Universal Multi-Platform Deployment (Node.js, Bun, Deno, Cloudflare Workers, Netlify, Static Hosts).

## Key Features

- **Universal 3-Pass AOT Dual-Bundle Pipeline (0-Fork):** High-performance single-process architecture compiling discrete `"react-server"` and standard client bundles, completely eliminating `child_process.fork()` and inter-process serialization. Delivers an **82% memory reduction** (~22 MB flat idle footprint) and sub-millisecond TTFB.
- **React Server Components & Progressive Streaming:** Native React 19 RSC architecture streaming HTML and Flight RPC payloads progressively via Web Streams (`renderToReadableStream`) on Edge/Bun and Node.js with instant shell flushing.
- **Compile-Time Type-Safe Routing:** Bidirectional type safety with zero runtime overhead. Level 1 validates `<Link href="...">` and `useRouter().push(...)`, while Level 2 strictly types route parameters with `PageProps<T>`, `LayoutProps<T>`, `RouteParams<T>`, and `ErrorProps<T>`.
- **Layered Segmentation & Zero-Remount Layouts:** Layouts are compiled as independent endpoints with isolated data lifecycles (`layout_functions.ts`). Parent layouts never unmount or lose DOM/audio/input state during client-side SPA transitions.
- **Vertical Micro-ISR (`<DinouCacheSlot>`):** Embed high-frequency reactive sections with micro-revalidation intervals (e.g. 5s) inside long-lived static pages without evicting the surrounding shell.
- **Hardened State-Preserving Fast Refresh:** Near-instant component hot-reloading in development powered by Rust (`@swc/core`) in Esbuild and scoped ESM HMR in Rollup that preserves component and form state across edits.
- **Universal W3C Web Middleware (`onRequest`):** Zero vendor lock-in middleware in `dinou.config.js` executing native Web Standard `Request` and `Response` objects across Node.js, Bun, Deno, Cloudflare Workers, and Netlify.
- **Standalone Native Binary Compilation:** Compiles your entire application into a single, self-contained executable binary server via `bun build --compile` and `deno compile` with zero runtime dependencies.
- **Server Functions & "Dinou Pattern":** Functions marked with `"use server"` that execute on the server and can return rendered React components (Server or Client) over Flight RPC, enabling zero-dependency reactive state stores.
- **Single Source of Truth Caching:** Strict seconds-based `revalidate` API (`false` = SSG, `0` = dynamic SSR, `N` = time-based ISR in seconds).
- **Client Router:** Client-side soft navigation (`push`, `replace`, `back`, `forward`, `refresh`) with `<Link fresh>` and `useNavigationLoading` hook.
- **Bundler Agnostic:** 100% feature parity across Esbuild (default), Rollup, and Webpack.

## Table of contents

- [Getting Started](#getting-started)
  - [Quick Start (CLI)](#quick-start-cli)
  - [Manual Setup](#manual-setup)
- [Routing](#routing)
  - [Basic & Dynamic Routes](#basic--dynamic-routes)
  - [Type-Safe Routing (Level 1 & Level 2)](#type-safe-routing-level-1--level-2)
  - [Important: Optional Segments Rules](#important-optional-segments-rules)
  - [Advanced Routing](#advanced-routing)
  - [Navigation](#navigation)
- [Layouts & Hierarchical Rendering](#layouts--hierarchical-rendering)
  - [Layouts (`layout.jsx`)](#layouts-layoutjsx)
  - [Independent Layout Lifecycles (`layout_functions.ts`)](#independent-layout-lifecycles-layout_functionsts)
  - [Zero-Remount Layout Preservation](#zero-remount-layout-preservation)
  - [Error Handling (`error.jsx`)](#error-handling-errorjsx)
  - [Not Found (`not_found.jsx`)](#not-found-not_foundjsx)
  - [Advanced Layout Control (Flags)](#advanced-layout-control-flags)
- [Server and Client Components](#server-and-client-components)
  - [Server Components (Default)](#server-components-default)
  - [Client Components (`"use client"`)](#client-components-use-client)
  - [Composition Patterns](#composition-patterns)
- [Data Fetching](#data-fetching)
  - [Async Data in Server Components](#async-data-in-server-components)
  - [Streaming with `<Suspense>`](#streaming-with-suspense)
- [Rendering Strategies](#rendering-strategies)
  - [Zero-Config Hybrid Model](#zero-config-hybrid-model)
  - [Static Site Generation (SSG at Build Time)](#static-site-generation-ssg-at-build-time)
  - [Incremental Static Regeneration (ISR)](#incremental-static-regeneration-isr)
  - [Incremental Static Generation (ISG)](#incremental-static-generation-isg)
  - [Vertical Segmentation: Micro-ISR (`<DinouCacheSlot>`)](#vertical-segmentation-micro-isr-dinoucacheslot)
  - [Partial Prerendering (PPR)](#partial-prerendering-ppr)
- [Server Functions (`"use server"`) & Suspense](#server-functions-use-server--suspense)
  - [Usage in Server Components (Streaming)](#usage-in-server-components-streaming)
  - [Usage in Client Components (Reactive)](#usage-in-client-components-reactive)
  - [Server Actions (Form Mutations)](#server-actions-form-mutations)
- [Advanced Patterns: The "Dinou Pattern"](#advanced-patterns-the-dinou-pattern)
  - [The Concept](#the-concept)
  - [Implementation](#implementation)
- [Page Configuration (`page_functions.ts`)](#page-configuration-page_functionsts)
  - [1. `getProps` (Direct Props Return)](#1-getprops-direct-props-return)
  - [2. `getStaticPaths` (Static Generation)](#2-getstaticpaths-static-generation)
  - [3. `revalidate` (Strict Seconds: SSG, SSR, ISR)](#3-revalidate-strict-seconds-ssg-ssr-isr)
  - [4. `validateParams` (Route Parameter Validation)](#4-validateparams-route-parameter-validation)
  - [5. `allowISG` (Control On-Demand Generation)](#5-allowisg-control-on-demand-generation)
  - [6. `getCacheTags` (Route Caching Tags)](#6-getcachetags-route-caching-tags)
  - [7. `ppr` (Partial Prerendering Toggle)](#7-ppr-partial-prerendering-toggle)
- [Layout Configuration (`layout_functions.ts`)](#layout-configuration-layout_functionsts)
- [Configuration API (`dinou.config.js`)](#configuration-api-dinouconfigjs)
  - [1. Universal Middleware (`onRequest`)](#1-universal-middleware-onrequest)
  - [2. SWC Disk-Mirror (`useSwcDiskMirror`)](#2-swc-disk-mirror-useswcdiskmirror)
- [⚡ React Compiler & Automatic Optimizations](#-react-compiler--automatic-optimizations)
  - [Integration Strategy](#integration-strategy)
  - [Code Example](#code-example)
- [📖 API Reference](#-api-reference)
  - [1. Components (`dinou` & `dinou/server`)](#1-components-dinou--dinouserver)
  - [2. Hooks & Navigation (`dinou`)](#2-hooks--navigation-dinou)
  - [3. Type-Safe Routing (`dinou`)](#3-type-safe-routing-dinou)
  - [4. Server Context & Config (`dinou` & `dinou/config`)](#4-server-context--config-dinou--dinouconfig)
  - [5. Server Cache & Revalidation (`dinou/server`)](#5-server-cache--revalidation-dinouserver)
  - [6. Storage Adapters (`dinou/server`)](#6-storage-adapters-dinouserver)
  - [7. Runtime Adapters (`dinou/adapters/*`)](#7-runtime-adapters-dinouadapters)
  - [8. File Conventions & Route Escaping](#8-file-conventions--route-escaping)
- [📁 Static Assets & Public Folder (`public/`)](#-static-assets--public-folder-public)
- [🔐 Environment Variables (`.env`)](#-environment-variables-env)
- [🎨 Styles (Tailwind, CSS Modules, & Global CSS)](#-styles-tailwind-css-modules--global-css)
  - [1. Link the Stylesheet](#1-link-the-stylesheet)
  - [2. Full Example (Layout + Global CSS + Modules)](#2-full-example-layout--global-css--modules)
- [🖼️ Assets & Media](#️-assets--media)
- [🏷️ TypeScript & Import Aliases (`@/`)](#️-typescript--import-aliases-)
- [⚡ Bundlers & Running the App](#-bundlers--running-the-app)
  - [Development](#development)
  - [Production Build & SSG](#production-build--ssg)
  - [Start Production Server (Node, Bun, Deno)](#start-production-server-node-bun-deno)
  - [Edge Application Bundling (Cloudflare & Deno Deploy)](#edge-application-bundling-cloudflare--deno-deploy)
  - [Standalone Native Binary Compilation](#standalone-native-binary-compilation-zero-node-deployment)
  - [Standalone Static Export](#standalone-static-export)
  - [Complete CLI Scripts Catalog (100 Scripts Reference)](#complete-cli-scripts-catalog-100-scripts-reference)
- [📦 Eject Dinou](#-eject-dinou)
- [🚀 Deployment Guide](#-deployment-guide)
  - [1. Node.js Platforms (DigitalOcean, Render, Railway, Fly.io, Docker)](#1-nodejs-platforms-digitalocean-render-railway-flyio-docker)
  - [2. Bun Standalone Server](#2-bun-standalone-server)
  - [3. Deno Deploy & Edge](#3-deno-deploy--edge)
  - [4. Cloudflare Workers / Pages](#4-cloudflare-workers--pages)
  - [5. Netlify (Serverless Functions v2)](#5-netlify-serverless-functions-v2)
  - [6. Pure Static Hosting (Surge.sh, GitHub Pages, Cloudflare Pages, S3)](#6-pure-static-hosting-surgesh-github-pages-cloudflare-pages-s3)
- [📜 Changelog](#-changelog)
- [📄 License](#-license)

## Getting Started

### Quick Start (CLI)

The fastest way to scaffold a new application is using the CLI generator:

```bash
npx create-dinou@latest my-app
cd my-app
npm run dev
```

### Manual Setup

Alternatively, you can set up a project manually:

1. **Install dependencies:**

   ```bash
   npm install react react-dom dinou
   ```

2. **Create the structure:**
   Create a `src` directory in the root of your project and add an entry `page.jsx` file:

   ```jsx
   // src/page.jsx
   export default function Page() {
     return <h1>Hello, Dinou!</h1>;
   }
   ```

3. **Start the server:**

   ```bash
   npx dinou dev
   ```

## Routing

Dinou uses a file-system based router. Files named `page.{jsx,tsx,js,ts}` inside the `src` directory automatically become routes.

### Basic & Dynamic Routes

| Pattern                | File Path                       | URL Example   | Params (`params`)           |
| :--------------------- | :------------------------------ | :------------ | :-------------------------- |
| **Static**             | `src/page.jsx`                  | `/`           | `{}`                        |
| **Dynamic**            | `src/blog/[slug]/page.jsx`      | `/blog/hello` | `{ slug: "hello" }`         |
| **Optional Dynamic**   | `src/blog/[[slug]]/page.jsx`    | `/blog`       | `{ slug: undefined }`       |
| **Catch-all**          | `src/blog/[...slug]/page.jsx`   | `/blog/a/b/c` | `{ slug: ["a", "b", "c"] }` |
| **Optional Catch-all** | `src/blog/[[...slug]]/page.jsx` | `/blog`       | `{ slug: [] }`              |

> **Note:** To access query parameters (e.g. `?q=hello`), use the `useSearchParams()` hook. They are NOT passed as props.

### Type-Safe Routing (Level 1 & Level 2)

Dinou v7 features an automatic, bidirectional, compile-time type-safe routing engine with **zero runtime overhead**. During development and build time, the route scanner watches `src/` and generates `.dinou/types/routes.d.ts`.

#### Level 1: Outward Navigation (`<Link>`, `useRouter`, `DinouRoute`)

The `<Link>` component and `router.push()` / `router.replace()` strictly validate that the destination `href` exists in your application routes, providing instant IDE autocompletion and compile errors on typos:

```tsx
import { Link, useRouter } from "dinou";

export default function Nav() {
  const router = useRouter();

  return (
    <nav>
      {/* Autocompletes valid routes; TypeScript errors if the route does not exist */}
      <Link href="/about">About Us</Link>

      {/* Dynamic routes can be cast with 'as const' */}
      <Link href={`/blog/${slug}` as const}>Read Post</Link>

      <button onClick={() => router.push("/dashboard")}>
        Dashboard
      </button>
    </nav>
  );
}
```

To create reusable design-system buttons or navigation links, use the exported `DinouRoute` type:

```tsx
import type { DinouRoute } from "dinou";

interface ActionButtonProps {
  label: string;
  to: DinouRoute;
}

export function ActionButton({ label, to }: ActionButtonProps) {
  return <Link href={to}>{label}</Link>;
}
```

#### Level 2: Inward Consumption (`PageProps`, `LayoutProps`, `RouteParams`, `ErrorProps`)

Pages, layouts, and error components use strongly-typed generics to infer route parameters automatically:

```tsx
// src/blog/[category]/[slug]/page.tsx
import type { PageProps, RouteParams } from "dinou";

// Strongly type params by passing the route template string:
type BlogPostProps = PageProps<"/blog/[category]/[slug]">;

export async function getProps(params: RouteParams<"/blog/[category]/[slug]">) {
  // params.category: string
  // params.slug: string
  const post = await db.fetchPost(params.category, params.slug);
  return { post }; // Direct props return in Dinou v7!
}

export default function BlogPostPage({ params, post }: BlogPostProps) {
  return (
    <article>
      <h1>{post.title}</h1>
      <p>Category: {params.category} | Slug: {params.slug}</p>
    </article>
  );
}
```

#### Parameter Mapping Reference

| Filesystem Path Pattern | Normalized Route Pattern | Resolved TypeScript `params` Type | Description |
| :--- | :--- | :--- | :--- |
| `src/page.tsx` | `"/"` | `{}` | Root homepage |
| `src/about/page.tsx` | `"/about"` | `{}` | Static segment |
| `src/users/[id]/page.tsx` | `"/users/[id]"` | `{ id: string }` | Single dynamic parameter |
| `src/shop/[cat]/[item]/page.tsx` | `"/shop/[cat]/[item]"` | `{ cat: string; item: string }` | Multiple dynamic parameters |
| `src/docs/[...slug]/page.tsx` | `"/docs/[...slug]"` | `{ slug: string[] }` | Catch-all dynamic segments |
| `src/settings/[[tab]]/page.tsx` | `"/settings/[[tab]]"` | `{ tab?: string }` | Optional dynamic segment |
| `src/archive/[[...slug]]/page.tsx` | `"/archive/[[...slug]]"` | `{ slug?: string[] }` | Optional catch-all segments |

### Important: Optional Segments Rules

Dinou supports deep nesting of optional segments (`[[...]]` or `[[slug]]`), but it enforces a strict **No-Gap Rule**.

> **The Rule:** You cannot skip an intermediate optional segment. You can only omit parameters if they are at the **end of the URL**.

#### ✅ Allowed: "Trailing Omission"

You can leave optional segments undefined, but only if they are the last ones in the structure.

- **Structure:** `src/inventory/[[warehouse]]/[[aisle]]/page.tsx`

| URL                  | Result (`params`)                            | Status                          |
| :------------------- | :------------------------------------------- | :------------------------------ |
| `/inventory/main/a1` | `{ warehouse: "main", aisle: "a1" }`         | ✅ **Full**                     |
| `/inventory/main`    | `{ warehouse: "main", aisle: undefined }`    | ✅ **Valid** (Last one omitted) |
| `/inventory`         | `{ warehouse: undefined, aisle: undefined }` | ✅ **Valid** (All omitted)      |

#### ❌ Forbidden: "Intercalated Undefined" (Gaps)

It is **not possible** to define a later segment while skipping an earlier one.

- **Structure:** `src/inventory/[[warehouse]]/[[aisle]]/page.tsx`

| Goal                                    | Result                                                                                 |
| :-------------------------------------- | :------------------------------------------------------------------------------------- |
| **Skip `warehouse` but define `aisle`** | ❌ **Forbidden**: You cannot provide an `aisle` without providing a `warehouse` first. |

#### Catch-all Constraints

Due to their "greedy" nature (consuming the rest of the URL), Catch-all segments (`[...]` and `[[...]]`) must always be the **terminal (last) segment** of a route definition. You cannot place other static or dynamic folders inside a Catch-all folder.

---

### Advanced Routing

#### Route Groups `(folder)`

Folders wrapped in parentheses are omitted from the URL path. This is useful for organizational purposes.

- `src/(auth)/login/page.jsx` → **`/login`**
- `src/(marketing)/about/page.jsx` → **`/about`**
- `src/(marketing)/(nested)/about/page.jsx` → **`/about`**

**Why use them?**
Route Groups allow you to keep your project structure logical without affecting the public URL structure. For example, grouping all authentication-related routes together.

#### Parallel Routes `@slot`

You can define slots (e.g., `@sidebar`, `@header`) to render multiple pages in the same layout simultaneously.

- `src/dashboard/@sidebar/page.jsx`
- `src/dashboard/(group-a)/@bottom/page.jsx`
- `src/dashboard/layout.jsx` → Receives `sidebar` and `bottom` as props.

> **Note:** Slots must be located in the same logical folder as the layout they serve.

**Why use them?**
Parallel routes allow independent UI sections and **Error Containment**:

1. **Server Component with `error.jsx`:** If the slot fails, only that specific slot renders the error UI.
2. **Server Component without `error.jsx`:** If the slot fails, it renders `null` safely.
3. **Client Component:** Without an explicit React Error Boundary, an unhandled error here will crash the entire page.

### Navigation

#### Using `<Link>` (Recommended)

The `<Link>` component provides optimized client-side transitions with automatic prefetching.

```jsx
"use client";
import { Link } from "dinou";

export default function Menu() {
  return (
    <nav>
      {/* Prefetches data automatically on hover/viewport */}
      <Link href="/about">About Us</Link>

      {/* Opt-in for fresh data (bypasses client cache) */}
      <Link href="/dashboard" fresh>
        Dashboard
      </Link>
    </nav>
  );
}
```

> **Note:** Standard HTML `<a>` tags also trigger client-side soft navigation via global event delegation in Dinou, but they lack the smart features (prefetching, `fresh` prop) provided by the `<Link>` component.

#### Programmatic Navigation

Use the `useRouter` hook inside Client Components (`"use client"`).

```jsx
"use client";
import { useRouter } from "dinou";

export default function Controls() {
  const router = useRouter();

  return (
    <div>
      <button onClick={() => router.push("/home")}>Push</button>
      <button onClick={() => router.replace("/home")}>Replace</button>
      <button onClick={() => router.back()}>Go Back</button>
      <button onClick={() => router.forward()}>Go Forward</button>

      {/* Soft Reload: Refetches server data without losing component state */}
      <button onClick={() => router.refresh()}>Refresh Data</button>
    </div>
  );
}
```

#### Relative Routing (Directory-First Convention)

Relative paths in both `<Link>` and programmatic navigation (`router.push`) resolve by treating the current path segment as a directory. The framework internally appends a trailing slash `/` to the current pathname before resolving.

| Current Path | Target Path | Resolves To (Dinou) | Resolves To (Native Browser) |
| :----------- | :---------- | :------------------ | :--------------------------- |
| `/blog/post` | `details`   | `/blog/post/details`| `/blog/details`              |
| `/blog/post` | `./details` | `/blog/post/details`| `/blog/details`              |
| `/blog/post` | `../about`  | `/blog/about`       | `/about`                     |

To navigate from `/blog/post` to `/blog/about`, use `../about` or the absolute path `/blog/about`.

## Layouts & Hierarchical Rendering

Dinou uses a nested routing system. Layouts, Error pages, and Not Found pages cascade down the directory hierarchy.

### Layouts (`layout.jsx`)

Layouts wrap pages and child layouts. They persist across navigation, preserving state and preventing unnecessary re-renders.

A layout component receives a `children` prop, `params` (route parameters), and any parallel slot (e.g., `sidebar`) defined in the same folder scope.

> **Note:** `searchParams` are NOT passed to layouts.

```tsx
// src/dashboard/layout.tsx
import type { LayoutProps } from "dinou";

export default async function Layout({
  children,
  params,
  sidebar
}: LayoutProps<"/dashboard"> & { sidebar?: React.ReactNode }) {
  return (
    <div className="dashboard-grid">
      <aside>{sidebar}</aside>
      <main>
        <h1>Dashboard for {params.teamId}</h1>
        {children}
      </main>
    </div>
  );
}
```

Layouts are **nested** by default. A page at `src/dashboard/settings/page.jsx` will be wrapped by:

1. `src/layout.jsx` (Root Layout)
2. `src/dashboard/layout.jsx` (Dashboard Layout)
3. `src/dashboard/settings/page.jsx` (The Page)

### Independent Layout Lifecycles (`layout_functions.ts`)

In Dinou v7, layout data fetching is **completely decoupled from pages**. Instead of defining layout data inside `page_functions.ts`, layouts have their own independent lifecycle file named **`layout_functions.ts`** in the same directory:

```typescript
// src/dashboard/layout_functions.ts
export const revalidate = 300; // Cache this layout independently for 5 minutes (strict seconds)

export async function getProps() {
  const notifications = await fetchUnreadNotifications();
  return { notifications };
}
```

```tsx
// src/dashboard/layout.tsx
import type { LayoutProps } from "dinou";

export default function DashboardLayout({
  children,
  notifications
}: LayoutProps<"/dashboard"> & { notifications: any[] }) {
  return (
    <div className="dashboard-shell">
      <aside>Unread notifications: {notifications.length}</aside>
      <main>{children}</main>
    </div>
  );
}
```

- **Horizontal Segmentation:** Navigating between sibling pages (e.g. `/dashboard/analytics` to `/dashboard/settings`) requests **only the inner page slot RSC stream**. The parent layout is neither re-rendered on the server nor remounted on the client.

### Zero-Remount Layout Preservation

In Dinou v7, parent layouts remain mounted in the React DOM during client-side navigation. This preserves:
- Audio/video playback state
- Open sidebar/modal/drawer states
- Scroll positions of sub-containers
- Client-side form input values

### Error Handling (`error.jsx`)

Create an `error.jsx` (or `error.tsx`) file to define an error page for a route segment. In Dinou v7, `error.tsx` is rendered as a **Server Component** by default and wrapped in a two-level resilience boundary:
1. **`SlotErrorBoundary`:** If a page crashes during SSR or streaming, the error is isolated inside `<DinouPageSlot>`. Parent layouts and navigations remain fully interactive.
2. **`InnerErrorBoundary`:** Catches root-level layout crashes without crashing the process.

```tsx
// src/error.tsx
import type { ErrorProps } from "dinou";

export default function ErrorPage({ error, params }: ErrorProps) {
  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <p className="error-message">{error.message}</p>
      {/* In development, error.stack is available. In production, error.stack is automatically sanitized to undefined */}
      {error.stack && (
        <pre className="error-stack">{error.stack}</pre>
      )}
    </div>
  );
```

### Not Found (`not_found.jsx`)

Create a `not_found.jsx` file to customize the 404 UI. Like errors, Dinou renders the closest `not_found.jsx` found traversing up from the requested URL.

`not_found.jsx` receives `params` as a prop. To access search parameters, use `useSearchParams()`.

### Advanced Layout Control (Flags)

Sometimes you need to break out of the standard nested hierarchy (e.g., a Landing Page that shouldn't share the App Layout). Dinou uses **"Flag Files"** (empty files with no extension) to control this behavior.

Place these files in the same directory as your component to activate the behavior.

| Flag File             | Applies To                               | Description                                                                                                                                       |
| :-------------------- | :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| `reset_layout`        | `layout.jsx`                             | **Resets the layout tree.** This layout becomes the new Root, ignoring all parent layouts. Perfect for separating Marketing pages from App pages. |
| `no_layout`           | `page.jsx`, `error.jsx`, `not_found.jsx` | Prevents the component from being wrapped by _any_ layout in the hierarchy.                                                                       |
| `no_layout_error`     | `error.jsx`                              | Specifically prevents layouts only for the Error page.                                                                                            |
| `no_layout_not_found` | `not_found.jsx`                          | Specifically prevents layouts only for the Not Found page.                                                                                        |

#### Example: Isolate a Landing Page

If you have a marketing page at `src/marketing/page.jsx` and you don't want it to inherit the Root Layout:

1. Create `src/marketing/layout.jsx` (Your marketing layout).
2. Create an empty file named `reset_layout` inside `src/marketing/`.
3. **Result:** `src/marketing/page.jsx` will only use the marketing layout, ignoring the global root layout.

## Server and Client Components

Dinou is built natively on React 19 Server Components (RSC). Understanding the boundary between Server and Client Components is fundamental to building optimal full-stack applications.

### Server Components (Default)

By default, every page, layout, and component inside the `src/` directory is a **Server Component**.

- **Zero Client Bundle Impact:** Server Components execute only on the server/edge. Their code, dependencies, and internal logic are never downloaded by the client browser.
- **Direct Backend & Database Access:** You can directly query databases, access the filesystem, or communicate with private internal microservices using standard `async/await`.
- **Security by Default:** Database credentials, secrets, and private tokens stay securely on the server without risk of leaking into client bundles.
- **Progressive Streaming:** Output is streamed progressively to the client as standard HTML and React Flight RPC payloads.

```jsx
// src/page.jsx (Server Component by default)
import db from "@/lib/db";

export default async function Page() {
  const user = await db.users.findFirst();
  return <h1>Welcome back, {user.name}!</h1>;
}
```

### Client Components (`"use client"`)

When a component needs browser APIs, React state, or user event listeners, declare it as a **Client Component** by placing the `"use client"` directive at the very top of the file (before any imports).

- **Use cases:** React state and lifecycle hooks (`useState`, `useReducer`, `useEffect`), event handlers (`onClick`, `onChange`, `onSubmit`), browser APIs (`localStorage`, `window`, `navigator`), and Dinou client hooks (`useSearchParams`, `useRouter`, `useNavigationLoading`).
- **SSR & Hydration:** Client Components are still pre-rendered on the server to fast initial HTML, and then hydrated with interactive JavaScript in the browser.

```jsx
// src/components/counter.jsx
"use client";

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount((c) => c + 1)}>
      Clicked {count} times
    </button>
  );
}
```

### Composition Patterns

To maximize performance, keep Client Components as leaves at the edges of your component tree.

- **Passing Server Components as Children:** A Client Component can accept Server Components via the `children` prop or custom props. The child Server Component runs on the server and its code is not included in the client bundle:

```jsx
// src/components/modal.jsx (Client Component)
"use client";

import { useState } from "react";

export default function Modal({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle Dialog</button>
      {isOpen && <div className="dialog">{children}</div>}
    </div>
  );
}

// src/page.jsx (Server Component)
import Modal from "@/components/modal";
import UserAnalytics from "@/components/user-analytics"; // Server Component

export default function Page() {
  return (
    <Modal>
      {/* UserAnalytics executes purely on the server */}
      <UserAnalytics />
    </Modal>
  );
}
```

---

## Data Fetching

Data fetching in Dinou is direct, declarative, and built on native JavaScript promises without external query wrappers.

### Async Data in Server Components

Server Components can be declared as `async` functions, allowing you to `await` data directly within your component:

```jsx
// src/blog/page.jsx
import db from "@/lib/db";

export default async function BlogPage() {
  const posts = await db.query("SELECT * FROM posts ORDER BY date DESC");

  return (
    <main>
      <h1>Latest Posts</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

### Streaming with `<Suspense>`

For components with slower or delayed data sources, wrap them in React's native `<Suspense>`. Dinou streams the fast shell and static UI immediately using `renderToPipeableStream`, and then streams the deferred Server Component HTML chunk over the wire the instant its promise resolves.

#### 1. The Slow Async Component (`src/components/heavy-analytics.jsx`)

A standard asynchronous Server Component that fetches data:

```jsx
// src/components/heavy-analytics.jsx (Server Component)
import db from "@/lib/db";

export default async function HeavyAnalytics() {
  // Simulates a heavy database query or slow external API
  const metrics = await db.analytics.aggregate({ timeRange: "30d" });

  return (
    <div className="analytics-card">
      <h3>Monthly Visitors: {metrics.totalVisits}</h3>
      <p>Conversion Rate: {metrics.conversionRate}%</p>
    </div>
  );
}
```

#### 2. The Fast Component (`src/components/quick-stats.jsx`)

A lightweight component that has no async delay:

```jsx
// src/components/quick-stats.jsx (Server Component)
export default function QuickStats() {
  return (
    <div className="quick-stats">
      <p>System Status: 🟢 All systems operational</p>
    </div>
  );
}
```

#### 3. The Page Streaming the Components (`src/dashboard/page.jsx`)

Wrap the slow async component in `<Suspense>`:

```jsx
// src/dashboard/page.jsx (Server Component)
import { Suspense } from "react";
import QuickStats from "@/components/quick-stats";
import HeavyAnalytics from "@/components/heavy-analytics";

export default function DashboardPage() {
  return (
    <main>
      <h1>Dashboard Overview</h1>

      {/* 1. Renders and streams to the client immediately */}
      <QuickStats />

      {/* 2. Streams the fallback initially, then streams HeavyAnalytics once resolved */}
      <Suspense fallback={<p className="loading-badge">Loading real-time analytics...</p>}>
        <HeavyAnalytics />
      </Suspense>
    </main>
  );
}
```

> **Client-Side Data Fetching:** To trigger or refresh data queries from inside Client Components, use [Server Functions](#server-functions-use-server--suspense) with React 19's native `use()` hook and `<Suspense>`.

---

## Rendering Strategies

Dinou incorporates an intelligent **Zero-Config Hybrid Rendering Engine**. You do not need to manually configure routes as "Static" or "Dynamic"—the framework automatically detects the optimal strategy.

### Zero-Config Hybrid Model

1. **Static by Default (SSG):** If a route does not access request-specific information (cookies, headers, search parameters), Dinou generates static HTML and RSC payloads into `.dinou/dist2/`.
2. **Dynamic on Demand (SSR):** If a route accesses request-time headers, cookies, or query parameters via `getContext()`, Dinou automatically bails out of static generation and renders the page dynamically per request.

```jsx
// src/profile/page.jsx
import { getContext } from "dinou";
import { fetchUser } from "@/lib/auth";

export default async function ProfilePage() {
  const ctx = getContext();
  
  // Accessing request cookies automatically switches this page to Dynamic SSR
  const token = ctx?.req.cookies?.session_token;
  if (!token) return <p>Please log in</p>;

  const user = await fetchUser(token);
  return <h1>Welcome, {user.name}</h1>;
}
```

### Static Site Generation (SSG at Build Time)

In Dinou v7, static pre-rendering runs automatically during the production build (`npm run build`). All static routes and catch-all dynamic paths declared via `getStaticPaths()` in `page_functions.ts` are generated into `.dinou/dist2/` before the server starts. This enables zero cold-start latency and instant static site exports (`npm run export-static`).

### Incremental Static Regeneration (ISR)

Incremental Static Regeneration allows you to serve pre-rendered static pages while periodically refreshing them in the background when content changes.

In Dinou v7, `revalidate` is the **single source of truth** for route rendering behavior, and all time units are **strictly in seconds**:

| Value of `revalidate` | Strategy | Description |
| :--- | :--- | :--- |
| `false` | **Pure Static (SSG)** | Pre-rendered once at build time. Cached indefinitely until manual invalidation. |
| `0` | **Dynamic SSR** | Rendered on every incoming HTTP request on the fly. |
| `N` (number > 0) | **Time-Based ISR** | Pre-rendered, served instantly from cache, and revalidated in the background every `N` seconds (stale-while-revalidate). |

Export `revalidate` from your route's `page_functions.ts`:

```typescript
// src/blog/page_functions.ts

// This page will regenerate in the background at most once every 60 seconds
export const revalidate = 60; // Strict seconds (1 minute)
```

- **How it works:** When a request arrives after the revalidation window has elapsed, the cached page is served immediately (stale-while-revalidate), while Dinou regenerates the new page in the background.
- **On-Demand Revalidation:** You can also trigger immediate cache purging from Server Functions or webhooks using `revalidatePage("/blog/post-1")`, `revalidatePath("/blog")`, or `revalidateTag("posts")` (see [On-Demand Revalidation](#4-server-only-invalidation-primitives-dinouserver)).
- **Edge ISR:** On edge platforms like Deno Deploy and Cloudflare Workers, ISR seamlessly uses distributed key-value storage (`DenoKVStorage`, `CloudflareKVStorage`) without needing a persistent disk.

### Incremental Static Generation (ISG)

For dynamic routes with millions of potential pages (e.g. `/products/[id]`), generating every single page at build time is impractical. Dinou supports **ISG**: pages not pre-rendered at build time are rendered and cached on their very first request, and served as static files for all subsequent requests.

### Vertical Segmentation: Micro-ISR (`<DinouCacheSlot>`)

When a page contains both static content and rapidly changing components, wrapping the high-frequency component in `<DinouCacheSlot>` enables independent caching:

```tsx
import { DinouCacheSlot } from "dinou/server";

export const revalidate = 3600; // Whole page shell cached for 1 hour

export default function MarketOverviewPage() {
  return (
    <div>
      <h1>Global Stock Exchange</h1>
      <p>This static analysis refreshes once per hour.</p>

      {/* This specific slot refreshes every 10 seconds independently */}
      <DinouCacheSlot id="live-stock-ticker" revalidate={10}>
        <LiveTicker />
      </DinouCacheSlot>
    </div>
  );
}
```

- When the page is requested, Dinou stitches together the cached page shell with the current cache state of the slot.
- Invalidation can target the slot directly without evicting the surrounding page.

### Partial Prerendering (PPR)

Partial Prerendering combines the speed of static pre-rendering with the real-time capabilities of dynamic SSR.
1. **Build Time:** The static shell of the page is rendered to static HTML. Dynamic components wrapped in `Suspense` are assigned a deterministic placeholder hole (`<div data-ppr-hole="slot-id">...fallback...</div>`).
2. **First Byte:** The edge server immediately streams the static shell (0ms TTFB).
3. **PPR Stream:** While the client paints the shell, the server resolves dynamic promises and streams replacement chunks down the open HTTP connection without blocking navigation.

---

## Server Functions (`"use server"`) & Suspense

Dinou supports **Server Functions**, allowing you to call server-side logic directly from your components like a type-safe Remote Procedure Call (RPC). A standout feature of Dinou is that Server Functions can return **rendered React components** (Server or Client Components), not just JSON data.

1. Define a function with `"use server"` at the top of the file.
2. Import and call it from any component.

```jsx
// src/server-functions/get-post.jsx
"use server";
import db from "./db";
import Post from "@/components/post.jsx";

export async function getPost(postId) {
  const data = await db.query("SELECT * FROM posts WHERE id = ?", [postId]);

  // Returns pre-rendered JSX directly from Node/Edge over Flight RPC
  return <Post post={data} />;
}
```

### Usage in Server Components (Streaming)

In Server Components, you can stream the result directly to the browser as soon as the database operation completes using React's native `<Suspense>`:

```jsx
// src/[id]/page.jsx (Server Component)
import { Suspense } from "react";
import { getPost } from "@/server-functions/get-post";

export default async function Page({ params: { id } }) {
  return (
    <div>
      <Suspense fallback={<p>Loading post from server...</p>}>
        {getPost(id)}
      </Suspense>
    </div>
  );
}
```

### Usage in Client Components (Reactive)

In Client Components (`"use client"`), Server Functions return a standard JavaScript Promise. You can resolve and stream them using pure React 19 primitives: **`<Suspense>`** and the **`use()`** hook.

```tsx
// src/[id]/page.tsx (Client Component)
"use client";

import { Suspense, use, useState, type ReactNode } from "react";
import { getPost } from "@/server-functions/get-post";

// Helper component that unwraps the Server Function promise
function PostStream({ promise }: { promise: Promise<ReactNode> }) {
  const content = use(promise);
  return <>{content}</>;
}

export default function Page({ params: { id } }: { params: { id: string } }) {
  // Hold the promise in React state to re-evaluate on demand
  const [postPromise, setPostPromise] = useState<Promise<ReactNode>>(() => getPost(id));

  return (
    <div>
      <button onClick={() => setPostPromise(getPost(id))}>
        Refresh Post
      </button>

      {/* Streams the Server Component output as it arrives over Flight RPC */}
      <Suspense fallback={<p>Streaming post...</p>}>
        <PostStream promise={postPromise} />
      </Suspense>
    </div>
  );
}
```

> **Granular Mutations & Invalidation:** For managing mutations that atomically update global state and re-fetch dependent data queries with zero external dependencies, see [The "Dinou Pattern"](#advanced-patterns-the-dinou-pattern).

### Server Actions (Form Mutations)

Server Functions can also be used as **Server Actions** by passing them to the `action` prop of a `<form>`. This allows you to handle form submissions and data mutations directly on the server without creating API endpoints manually.

1.  **Automatic FormData:** The function receives a `FormData` object containing the input values.
2.  **Progressive Enhancement:** Forms work even before JavaScript loads.
3.  **Redirects:** Use `getContext` to redirect after a successful mutation.

```javascript
// src/actions/create-post.js
"use server";
import { getContext } from "dinou";
import { addPost } from "@/db/posts.js";

export async function createPost(formData) {
  const context = getContext();
  const title = formData.get("title");
  const content = formData.get("content");

  await addPost({ title, content });

  context?.res?.redirect("/posts");
}
```

#### 1. In Server Components (Zero-JS Progressive Enhancement)

Server Actions can be used directly inside **Server Components** without needing `"use client"`. This enables true Progressive Enhancement: forms submit and execute on the server even if JavaScript is disabled or still downloading in the browser:

```jsx
// src/new-post/page.jsx (Server Component)
import { createPost } from "@/actions/create-post";

export default function NewPostPage() {
  return (
    <form action={createPost}>
      {/* The 'name' attribute is required for FormData extraction */}
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required />

      <button type="submit">Create Post</button>
    </form>
  );
}
```

#### 2. In Client Components (Interactive with `useFormStatus`)

You can also pass Server Actions to forms inside **Client Components** (`"use client"`). This allows you to integrate client-side interactivity, such as disabling buttons or displaying spinners with React's `useFormStatus` hook:

```jsx
// src/new-post/page.jsx (Client Component)
"use client";

import { useFormStatus } from "react-dom";
import { createPost } from "@/actions/create-post";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Create Post"}
    </button>
  );
}

export default function Page() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required />

      <SubmitButton />
    </form>
  );
}
```

## Advanced Patterns: The "Dinou Pattern"

Dinou introduces a powerful architectural pattern for handling mutations and data synchronization with surgical reactivity and **zero external dependencies**.

### The Concept

In standard React Server Components architectures, mutating data often triggers a full-route revalidation or requires complex client-side cache synchronizers.

In Dinou, **Server Functions can return Client Components over Flight RPC**. The **"Dinou Pattern"** leverages this unique capability:

1. A mutation Server Function executes in the backend (database mutation).
2. Instead of returning raw JSON or triggering a heavy route refresh, it returns an invisible **Headless Client Component** (an "Updater").
3. When this updater streams down and mounts in the browser, its `useEffect` triggers a lightweight, native React store (`useSyncExternalStore`).
4. Any dependent UI listening to that store key automatically refetches and streams its updated Server Component UI into a standard React 19 `<Suspense>` boundary.

> **Zero Dependencies:** This pattern relies entirely on pure React 19 primitives (`useSyncExternalStore`, `use()`, `Suspense`). Optionally, you can substitute the store with any state manager of your choice (Jotai, Zustand, Nanostores, Redux), but no third-party library is required.

---

### Architectural Flow

```
[1. User Form] --(Calls Server Function)--> [2. Node/Edge DB Mutation]
                                                      |
                                            (Returns Headless Component)
                                                      |
                                                      v
[5. Refetched UI] <-- (useSyncExternalStore) <-- [3. <PatternTaskUpdater /> mounts]
      ^                        ^
      |                        |
[<Suspense>]             [4. Global Key++]
```

---

### Implementation Example

#### 1. The Global Store (`src/pattern-store.ts`)

A pure React 19 store using `useSyncExternalStore` (0 dependencies, SSR-compatible):

```typescript
// src/pattern-store.ts
import { useSyncExternalStore } from "react";

let tasksListKey = 0;
const listeners = new Set<() => void>();

export const patternStore = {
  getSnapshot: () => tasksListKey,
  incrementTasksListKey: () => {
    tasksListKey += 1;
    listeners.forEach((listener) => listener());
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useTasksListKey(): number {
  return useSyncExternalStore(
    patternStore.subscribe,
    patternStore.getSnapshot,
    patternStore.getSnapshot // SSR compatibility
  );
}
```

> **Note:** If you already use a state management library (such as Jotai or Zustand), you can use an atom or store selector here instead of `useSyncExternalStore`.

#### 2. The Headless Updater (`src/components/pattern-updater.tsx`)

A tiny Client Component that emits no visual DOM, but executes state synchronization upon mounting in the browser:

```tsx
// src/components/pattern-updater.tsx
"use client";

import { useEffect } from "react";
import { patternStore } from "../pattern-store";

export default function PatternTaskUpdater({
  id,
  taskText,
}: {
  id?: string;
  taskText?: string;
}) {
  useEffect(() => {
    // When mounted on the client after Server Function response,
    // atomically updates the store key, invalidating dependent queries
    patternStore.incrementTasksListKey();
  }, [id, taskText]);

  return null; // Headless: emits no DOM nodes
}
```

#### 3. The Server Functions (`src/server-functions/pattern-demo.tsx`)

Server Functions marked with `"use server"` can perform database operations and return React components:

```tsx
// src/server-functions/pattern-demo.tsx
"use server";

import type { ReactNode } from "react";
import PatternTaskUpdater from "../components/pattern-updater";
import PatternTasksList from "../components/pattern-tasks-list";
import { tasksDb } from "./db";

/**
 * 1. Mutation: Executes in Node.js/Edge and returns the Headless updater
 */
export async function addPatternTask(text: string): Promise<ReactNode> {
  const trimmed = text.trim();
  const id = Math.random().toString(36).substring(2, 9);
  
  if (trimmed) {
    tasksDb.unshift({ id, text: trimmed, createdAt: new Date().toLocaleTimeString() });
  }

  // Magic: The server orchestrates the client by returning the updater component
  return <PatternTaskUpdater key={id} id={id} taskText={trimmed} />;
}

/**
 * 2. Query: Returns the data pre-rendered on the server via Flight RPC
 */
export async function fetchPatternTasks(): Promise<ReactNode> {
  return <PatternTasksList tasks={[...tasksDb]} />;
}
```

#### 4. The Client Page (`src/page.tsx`)

Consuming the pattern using native React 19 `<Suspense>` and the `use()` hook:

```tsx
// src/page.tsx
"use client";

import { useState, useEffect, Suspense, use, type ReactNode } from "react";
import { addPatternTask, fetchPatternTasks } from "./server-functions/pattern-demo";
import { useTasksListKey } from "./pattern-store";

// Helper component resolving promises via native React 19 `use()`
function Stream({ promise }: { promise: Promise<ReactNode> }) {
  const content = use(promise);
  return <>{content}</>;
}

export default function Page() {
  const tasksListKey = useTasksListKey();
  const [text, setText] = useState("");
  const [isMutating, setIsMutating] = useState(false);
  const [mutationPromise, setMutationPromise] = useState<Promise<ReactNode> | null>(null);
  const [tasksPromise, setTasksPromise] = useState<Promise<ReactNode>>(() => fetchPatternTasks());

  // When the Headless Updater increments tasksListKey in the store,
  // we request the fresh list from the server (Flight streaming)
  useEffect(() => {
    if (tasksListKey > 0) {
      setTasksPromise(fetchPatternTasks());
    }
  }, [tasksListKey]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isMutating) return;

    setIsMutating(true);
    const p = addPatternTask(trimmed);
    p.finally(() => {
      setIsMutating(false);
      setText("");
    });
    setMutationPromise(p);
  };

  return (
    <div>
      {/* 1. Mutation Form */}
      <form onSubmit={handleAddTask}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="New task..."
          disabled={isMutating}
        />
        <button type="submit" disabled={isMutating || !text.trim()}>
          {isMutating ? "Adding..." : "Add Task"}
        </button>
      </form>

      {/* 2. Mutation Stream (Mounts the Headless Updater) */}
      {mutationPromise && (
        <Suspense fallback={<div>Executing mutation on server...</div>}>
          <Stream promise={mutationPromise} />
        </Suspense>
      )}

      {/* 3. Reactive Tasks List Stream */}
      <Suspense fallback={<div>Loading updated list...</div>}>
        <Stream promise={tasksPromise} />
      </Suspense>
    </div>
  );
}
```

#### 5. The Display Component (`src/components/pattern-tasks-list.tsx`)

A standard Client Component rendering the task items:

```tsx
// src/components/pattern-tasks-list.tsx
"use client";

export interface PatternTaskItem {
  id: string;
  text: string;
  createdAt: string;
}

export default function PatternTasksList({ tasks }: { tasks: PatternTaskItem[] }) {
  if (!tasks || tasks.length === 0) {
    return <p>No tasks found.</p>;
  }

  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>
          <span>{task.text}</span> — <small>{task.createdAt}</small>
        </li>
      ))}
    </ul>
  );
}
```

---

## Page Configuration (`page_functions.ts`)

For advanced control over rendering behavior, data fetching, and static generation, you can create a `page_functions.ts` (or `.js`) file next to your `page.jsx`.

### 1. `getProps` (Direct Props Return)

Use this function to fetch data based on the **route parameters** and inject it directly into your Page component.

> **Design Note:** In Dinou v7, `getProps` returns props directly without wrapping them in `{ page: ... }`. To provide data to layouts, use the independent `layout_functions.ts` file in the layout's folder.
> While `getProps` receives strongly-typed route `params`, you can also read cookies, headers, or query parameters by calling `getContext()` on the server.
> Because `getProps` blocks rendering at request time for dynamic routes, keep it fast. If you need slow dynamic fetches, defer them to a `Suspense` boundary wrapping a Server Function.

- **Arguments:** `params: RouteParams<T>` (The dynamic route parameters).
- **Returns:** An object containing props passed directly to `page.tsx`.

```typescript
// src/blog/[slug]/page_functions.ts
import type { RouteParams } from "dinou";

export async function getProps(params: RouteParams<"/blog/[slug]">) {
  // 1. Fetch data based on the URL path (e.g., /blog/my-post)
  const post = await db.getPost(params.slug);

  // 2. Return props directly to page.tsx
  return { post };
}
```

### 2. `getStaticPaths` (Static Generation)

Defines which dynamic paths should be pre-rendered at server start (SSG).

- **ISG (Incremental Static Generation):** Paths not returned here will be generated on-demand when requested for the first time.

**Return Format:**

Dinou is flexible with the return format depending on the complexity of your route:

| Route Type                  | Best Format            | Example Return                    |
| :-------------------------- | :--------------------- | :-------------------------------- |
| **Simple** (`[id]`)         | `Array<string>`        | `["1", "2"]`                      |
| **Catch-all** (`[...slug]`) | `Array<Array<string>>` | `[["a", "b"], ["c"]]`             |
| **Nested / Complex**        | `Array<Object>`        | `[{ id: "1", category: "tech" }]` |

#### Simple Dynamic Routes

```typescript
// src/blog/[id]/page_functions.ts
export function getStaticPaths() {
  return ["1", "2", "hello"];
  // Generates: /blog/1, /blog/2, /blog/hello
}
```

#### Catch-all Routes

```typescript
// src/docs/[...slug]/page_functions.ts
export function getStaticPaths() {
  return [
    ["intro"], // /docs/intro
    ["api", "v1", "auth"], // /docs/api/v1/auth
  ];
}
```

#### Automatic Route Propagation (Recursion)

One of Dinou's most powerful features is that **static parameters propagate downwards**. If you define values for a segment, Dinou will automatically generate all static sub-pages nested within that segment.

**Example Structure:**

- `src/blog/[slug]/page.tsx` (+ `page_functions.ts`)
- `src/blog/[slug]/details/page.tsx` (Nested static page)

If `getStaticPaths` in `blog/[slug]` returns `["post-a", "post-b"]`, Dinou generates **4 pages**:

1.  `/blog/post-a`
2.  `/blog/post-a/details`
3.  `/blog/post-b`
4.  `/blog/post-b/details`

#### Nested Pages & The "Chain of Responsibility"

When nesting routes, **dependency flows downwards**. If an intermediate segment (whether static or dynamic) contains a `page.tsx`, it becomes a required step in the generation chain.

If a parent page fails to define its own paths (e.g., returns an empty array), **the generator stops there**. It will never reach the child pages, regardless of whether the children have valid `getStaticPaths` defined.

**Scenario:**

- `src/case3/[slug]/page.tsx` (Parent Page)
- `src/case3/[slug]/[id]/page.tsx` (Child Page)

In this structure, `[id]` depends physically on `[slug]` existing first.

**❌ Broken Chain:**
If `src/case3/[slug]/page_functions.ts` returns `[]` (no paths):

1. Dinou tries to build `/case3/[slug]`.
2. No paths are returned. No folders are created.
3. **Result:** The build process never attempts to generate `[id]`, because the parent directory `/case3/foo/` was never created.

**✅ Functional Chain:**
The parent must resolve its own level for the children to run.

```typescript
// src/case3/[slug]/page_functions.ts
export function getStaticPaths() {
  // 1. Defines the parent folders
  return ["foo", "bar"];
}
```

```typescript
// src/case3/[slug]/[id]/page_functions.ts
export function getStaticPaths() {
  // 2. Now runs inside /case3/foo/ and /case3/bar/
  return ["100", "200"];
}
```

> **Rule of Thumb:** Every `page.tsx` in the hierarchy is responsible for "opening the door" to its children.

#### Nested & Complex Routes (Pass-through Segments)

When you have multiple dynamic segments in a path **without intermediate pages**, you must return an **Object** to map values to all parameter names involved.

```typescript
// Structure: src/shop/[category]/[...specs]/[[brand]]/page_functions.ts
// (Assuming [category] and [...specs] do NOT have their own page.tsx)

export function getStaticPaths() {
  return [
    {
      category: "electronics",
      specs: ["m3", "16gb"],
      brand: "apple",
    },
    {
      category: "clothing",
      specs: ["cotton", "white"],
      brand: undefined, // Valid: optional and at the end of the route
    },
  ];
}
```

> **Reminder:** According to the **No-Gap Rule**, you can use `undefined` for an intermediate optional segment **only if all subsequent segments are also `undefined`**. You cannot leave a "gap" (an undefined segment followed by a defined one).

#### Normalization Guarantee

Dinou ensures that `params` are consistent between SSG and SSR:

- **Catch-all** segments will always be an `Array` (e.g., `undefined` becomes `[]`, `"val"` becomes `["val"]`).
- **Optional Single** segments remain `undefined` if omitted.

### 3. `revalidate` (Strict Seconds: SSG, SSR, ISR)

In Dinou v7, `revalidate` is the **single source of truth** for route rendering behavior. The legacy `dynamic` export has been eliminated in favor of unified `revalidate` semantics with **strict seconds (`s`)**:

| Value of `revalidate` | Rendering Mode | Behavior |
| :--- | :--- | :--- |
| `false` | **Pure Static (SSG)** | Pre-rendered once at build time. Cached indefinitely until manual invalidation. |
| `0` | **Dynamic SSR** | Rendered on every incoming HTTP request on the fly. Replaces legacy `dynamic()`. |
| `N` (number > 0) | **Time-Based ISR** | Pre-rendered, served instantly from cache, and revalidated in the background every `N` seconds. |

- **Type:** `number | false` (or a function returning `number | false`). Time is strictly in **seconds**.

```typescript
// src/dashboard/page_functions.ts

// Revalidates in the background at most once every 60 seconds
export const revalidate = 60; // Strict seconds (1 minute)
```

> **Hierarchical Segment Reconciliation (`Math.min`):**  
> When routes and layouts nest, Dinou reconciles caching policies using `Math.min(layoutRevalidate, pageRevalidate)`. If a layout sets `revalidate: 300` and a child page sets `revalidate: 60`, the combined response is cached for 60 seconds. If any ancestor layout or leaf page specifies `revalidate = 0`, the entire route response executes dynamically on the server with `Cache-Control: no-store`.

### 4. `validateParams` (Route Parameter Validation)

Allows validating dynamic parameters on the server prior to rendering or static generation. Returning `false` blocks rendering and returns a 404 response.

- **Arguments:** `params` (The dynamic route parameters).
- **Returns:** `boolean` or `Promise<boolean>`.

```typescript
// src/posts/[id]/page_functions.ts
export function validateParams(params) {
  // Reject route parameter and return 404 instantly if not numeric
  return typeof params.id === "string" && /^\d+$/.test(params.id);
}
```

### 5. `allowISG` (Control On-Demand Generation)

Enables or disables Incremental Static Generation (ISG) on-demand for dynamic routes. If disabled (returns `false`), routes not pre-rendered at server startup via `getStaticPaths` will return a 404 instead of generating dynamically on-demand.

- **Returns:** `boolean` or `Promise<boolean>`.

```typescript
// src/items/[id]/page_functions.ts
export function allowISG() {
  // Only serve paths generated at startup by getStaticPaths.
  // Abort on-demand generation for other IDs.
  return false;
}
```

### 6. `getCacheTags` (Route Caching Tags)

Associates invalidation tags with the pre-rendered or dynamic route for tag-based on-demand revalidation.

- **Arguments:** `params` (The dynamic route parameters).
- **Returns:** `string[]` or `Promise<string[]>` (an array of cache tags).

```typescript
// src/posts/[id]/page_functions.ts
export async function getCacheTags(params) {
  // Tag this page with a generic collection tag and a specific resource tag
  return ["posts", `post-${params.id}`];
}
```

### 7. `ppr` (Partial Prerendering Toggle)

Enables Partial Prerendering on this specific route or branch, streaming dynamic `<Suspense>` holes into an instant static shell:

- **Type:** `boolean` or `() => boolean | Promise<boolean>`.

```typescript
// src/dashboard/page_functions.ts
export const ppr = true;
```

---

## Layout Configuration (`layout_functions.ts`)

In Dinou v7, layouts have their own dedicated lifecycle configuration file named **`layout_functions.ts`** placed alongside `layout.tsx`. This keeps layout data fetching and caching completely independent from nested pages.

`layout_functions.ts` supports the full suite of server lifecycle contracts:
- **`getProps(params)`**: Server data fetching scoped strictly to the layout shell.
- **`revalidate`**: Sets the baseline caching policy for this entire layout branch (strict seconds).
- **`ppr`**: Enables Partial Prerendering across all child routes in this branch.
- **`getCacheTags(params)`**: Assigns tags to the layout shell (`layout.rsc`).
- **`getStaticPaths()`**: Pre-renders layout shells for multi-tenant or localized segments (e.g. `/[lang]/layout.tsx`).
- **`validateParams(params)`**: Subtree perimeter guard protecting the entire layout branch before any child page runs.
- **`allowISG()`**: Controls on-demand generation for the layout subtree.

```typescript
// src/dashboard/layout_functions.ts
import type { LayoutFunctions } from "dinou";

// Layout caching interval (strict seconds)
export const revalidate: LayoutFunctions["revalidate"] = 300; // 5 minutes

export const getProps: LayoutFunctions<"/dashboard">["getProps"] = async () => {
  const [user, notifications] = await Promise.all([
    fetchCurrentUser(),
    fetchUnreadNotifications()
  ]);

  // Injected directly as props into src/dashboard/layout.tsx
  return { user, notifications };
};
```

---

## Configuration API (`dinou.config.js`)

Dinou projects can be customized via a `dinou.config.js` (or `.ts`) file in the project root:

```javascript
// dinou.config.js
import { defineConfig } from "dinou/config";

export default defineConfig({
  // Default bundler: 'esbuild' | 'rollup' | 'webpack'
  bundler: "esbuild",

  // Default dev server port (auto-prompts if port is in use)
  port: 3000,

  // Global W3C Web Middleware (Node.js, Bun, Deno, Cloudflare Workers, Netlify)
  async onRequest(req, next) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/protected")) {
      const auth = req.headers.get("Authorization");
      if (!auth) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    return next();
  },

  // Enable SWC disk-mirror caching for instant cold starts in large codebases (500+ routes)
  useSwcDiskMirror: false
});
```

### 1. Universal Middleware (`onRequest`)
Unlike legacy Node frameworks tied to Express or Koa, Dinou's `onRequest` operates on standard W3C Web APIs (`Request` and `Response`). It runs universally before any Dinou internal handler across Node.js, Bun, Deno, Cloudflare Workers, and Netlify.

### 2. SWC Disk-Mirror (`useSwcDiskMirror`)
In development, Dinou compiles everything 100% in-memory into RAM. For enterprise projects with hundreds of routes, setting `useSwcDiskMirror: true` caches AST transforms in `.dinou/dev-cache/` for instant cold starts.

## ⚡ React Compiler & Automatic Optimizations

Dinou integrates the **React Compiler** (React 19+) out of the box. It analyzes your code and automatically applies fine-grained memoization to values and functions.

This means you can stop manually writing `useMemo`, `useCallback`, and `React.memo`. Just write clean, idiomatic JavaScript, and Dinou ensures maximum performance at build time.

### Integration Strategy

Dinou uses a sophisticated hybrid strategy to balance **Developer Experience (DX)** with **Production Performance**:

| Bundler     |     Development     | Production | Status                                                                                                                           |
| :---------- | :-----------------: | :--------: | :------------------------------------------------------------------------------------------------------------------------------- |
| **Webpack** | ✅ Enabled  | ✅ Enabled | Full optimization in both environments. |
| **Rollup**  | ❌ Disabled | ✅ Enabled | **Fast Refresh Priority:** Disabled in Dev to preserve component state during HMR; fully enabled in Prod for maximum AOT optimization. |
| **Esbuild** | ❌ Disabled | ✅ Enabled | **Speed & Fast Refresh:** Disabled in Dev for sub-millisecond Rust SWC Fast Refresh; injected in Prod for maximum AOT optimization. |

### Code Example

**The Old Way (Manual Optimization):**

```jsx
function ExpensiveComponent({ data }) {
  // Manual dependency management required
  const processed = useMemo(() => heavyMath(data), [data]);

  const handleClick = useCallback(() => {
    console.log(processed);
  }, [processed]);

  return <Child onAction={handleClick} />;
}
```

**The Dinou Way:**

```jsx
function ExpensiveComponent({ data }) {
  // ✨ Automatically memoized by Dinou
  const processed = heavyMath(data);

  // ✨ Automatically stable reference
  const handleClick = () => {
    console.log(processed);
  };

  return <Child onAction={handleClick} />;
}
```

## 📖 API Reference

### 1. Components (`dinou` & `dinou/server`)

#### `<Link>`

The primary way to navigate between pages. Enables client-side navigation (SPA transition) without full page reloads.

- **Props:**
  - `href` (string): The target path. Supports both **absolute** and **relative** paths.
  - `prefetch` (boolean): If `true`, preloads the code and data for the destination route when the user hovers over the link. Defaults to `true`.
  - `fresh` (boolean): If `true`, bypasses the client-side router cache and forces a fetch of the latest data from the server. Defaults to `false`.
  - `...props`: Standard HTML anchor attributes (`className`, `id`, `target`, etc.).

**Path Resolution:**
Dinou resolves paths similar to a file system:

| Type                   | Syntax            | Example      | Description                                                          |
| :--------------------- | :---------------- | :----------- | :------------------------------------------------------------------- |
| **Absolute**           | Starts with `/`   | `/about`     | Navigates from the root of the app.                                  |
| **Relative (Child)**   | No slash or `./`  | `team`       | Appends to the current path (e.g., `/about` → `/about/team`).        |
| **Relative (Sibling)** | Starts with `../` | `../contact` | Go up one level, then down (e.g., `/about/team` → `/about/contact`). |

```jsx
import { Link } from "dinou";

// Absolute path
<Link href="/dashboard">Home</Link>

// Relative path (Go deeper)
<Link href="./settings">Settings</Link>

// Relative path (Go up/Sibling)
<Link href="../profile">Profile</Link>

// With options
<Link href="/volatile-data" fresh={true} prefetch={false}>
  Live Status
</Link>
```

#### `<ClientRedirect>`

A utility component that triggers an immediate client-side navigation when rendered.

- **Props:** `to` (string) - The destination URL.
- **Usage:** While you can use this directly, it is recommended to use the `redirect()` helper function instead for better server-side handling.

```jsx
import { ClientRedirect } from "dinou";
// Forces navigation to home
return <ClientRedirect to="/" />;
```

#### `<DinouCacheSlot>` (from `"dinou/server"`)

A React Server Component primitive for **Micro-ISR (Vertical Segmentation)**. Isolates high-frequency dynamic sub-trees inside long-lived static or ISR pages with dedicated micro-caching lifecycles, eliminating full-page cache invalidations and saving costly database queries:

- **Props:**
  - `id` (string): Unique identifier for this slot (required for targeted slot refreshes).
  - `revalidate` (number, optional): Time-to-live cache duration in **seconds** (e.g. `revalidate={10}`).
  - `tag` / `tags` (string | string[], optional): Cache tags for targeted invalidation via `revalidateTag`.
  - `children` (ReactNode): The server component tree to cache independently.

```jsx
import { DinouCacheSlot } from "dinou/server";
import { StockTicker } from "./stock-ticker";

export default function FinanceDashboard() {
  return (
    <div className="dashboard-grid">
      <StaticSidebar />
      <main>
        {/* High-frequency component cached for 10 seconds independently */}
        <DinouCacheSlot id="live-stock-ticker" tag="stocks" revalidate={10}>
          <StockTicker />
        </DinouCacheSlot>
        <StaticAnalyticsCharts />
      </main>
    </div>
  );
}
```

### 2. Hooks & Navigation (`dinou`)

#### `redirect(destination)`

Dinou's universal, polymorphic redirection primitive. Rather than throwing an internal JavaScript exception, `redirect(destination)` returns a valid React element (`<ClientRedirect to={destination} />` of type `ReactNode`) and adapts its transport mechanism to the active runtime context:
- **Server Components & `page_functions.ts`:** Issues an immediate HTTP 302 Found before stream initialization (`headersSent === false`).
- **Server Streaming & `<Suspense>`:** Injects `<ClientRedirect />` into the open 200 OK stream, executing soft redirection upon mounting in the browser without crashing error boundaries.
- **Server Functions (`"use server"`):** Returns redirection metadata; client RPC proxy intercepts it and executes a smooth SPA transition (`router.replace()`) without full page reloads.
- **Client Components:** Returns `<ClientRedirect />` whose `useEffect` hook immediately dispatches `router.replace()` in 0ms.

> **Always precede with `return`:** Because `redirect()` returns a React element rather than throwing an exception, you must always write:
> ```javascript
> if (!user) return redirect("/login");
> ```

#### `useSearchParams()` (Universal Hook)

Returns a standard Web [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) object representing the query parameters of the current URL. In Dinou, `useSearchParams()` is a **universal hook** that operates across both backend and browser execution environments:

- **In Server Components:** Resolves synchronously from the active HTTP request context (via Node.js / V8 `AsyncLocalStorage`) during SSR, streaming, and static site generation. Query parameters are NOT passed via component props, eliminating props drilling across server component trees:
  ```tsx
  // src/products/page.tsx (Server Component)
  import { useSearchParams } from "dinou";
  import { db } from "@/lib/db";

  export default async function ProductsPage() {
    const searchParams = useSearchParams();
    const category = searchParams.get("category");
    const products = await db.products.findMany({
      where: category ? { category } : undefined,
    });
    return <h1>Category: {category || "All"}</h1>;
  }
  ```
- **In Client Components:** Fully reactive hook. Whenever the URL changes (via `router.push()`, `<Link>`, or browser Back/Forward), the component automatically re-renders with the latest values while preserving local `useState` and scroll position.
- **SSG vs SSR Strategy:** During static build generation (SSG), `searchParams` evaluates with empty parameters. For live, per-visitor query parameters on the server, choose either:
  1. **Dynamic SSR:** Set `export const revalidate = 0;` in `page_functions.ts`.
  2. **Partial Prerendering (PPR):** Set `export const ppr = true;` and wrap the query-dependent component in React `<Suspense>` to deliver an instant static shell while streaming query results.

#### `usePathname()` (Universal Hook)

Returns the normalized current URL pathname as a `string` (e.g., `"/blog/post-1"`). In Dinou, `usePathname()` is a **universal hook** operating across both backend and browser environments:

- **In Server Components:** Resolves synchronously from the active HTTP request context (via `AsyncLocalStorage`) during SSR, streaming, and build-time SSG. Pathname is completely deterministic, resulting in **zero hydration mismatches**.
- **In Client Components:** Reactive hook that re-renders immediately upon navigation.
- **Automatic Normalization:** Dinou automatically strips trailing slashes (e.g. `/dashboard/` becomes `"/dashboard"`), query strings (`?tab=preview`), and hash fragments (`#section-1`). Root route always resolves to `"/"`.

```tsx
import { usePathname } from "dinou";

export default function Header() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  return <span>{isAdmin ? "Admin Console" : `Current Path: ${pathname}`}</span>;
}
```

#### `useRouter()` (Client Components Only)

Provides programmatic navigation, browser history controls, and cache refreshing methods inside Client Components (`"use client"`).

- **Methods:**
  - `.push(href, options?)`: Navigate to a new route. Accepts `{ fresh: true }` to bypass client `pageCache` and force an on-demand server roundtrip. Fully type-safe via `DinouRoute`.
  - `.replace(href, options?)`: Replace the current history stack entry without pushing a new one. Supports `{ fresh: true }`.
  - `.back()`: Navigate back in browser history (`window.history.back()`).
  - `.forward()`: Navigate forward in browser history (`window.history.forward()`).
  - `.refresh(options?)`: Soft reload. Re-fetches Server Component data without reloading the browser window or losing client state (`useState`, form inputs, scroll position). By default refreshes the page; pass `{ layout: true }` to also invalidate and re-fetch layout Server Components.
  - `.refreshSlot(slotId, options?)`: Surgical refresh. Re-fetches and updates a specific `<DinouCacheSlot>` in the browser without re-evaluating the rest of the page. Supports `options: { fresh?: boolean }`.

```tsx
"use client";
import { useRouter } from "dinou";

export default function Controls() {
  const router = useRouter();

  return (
    <div>
      <button onClick={() => router.back()}>Back</button>
      <button onClick={() => router.refresh()}>Refresh Page</button>
      <button onClick={() => router.refresh({ layout: true })}>Refresh with Layout</button>
      <button onClick={() => router.refreshSlot("cart-counter", { fresh: true })}>
        Refresh Cart Slot
      </button>
    </div>
  );
}
```

#### `refreshSlot(slotId, options?)` (Universal Standalone Function)

A standalone client-side helper that triggers targeted, isolated revalidation of one or all `<DinouCacheSlot>` components on the active page. Because it is a pure JavaScript function rather than a React hook, it can be called from anywhere in your client application—including React components, external event listeners, WebSocket handlers, and state management stores.

- **Arguments:**
  - `slotId` (string): The identifier matching the `id` prop of a mounted `<DinouCacheSlot>`.
  - `options` (object, optional): `{ fresh?: boolean }`. When `fresh: true`, bypasses server cache and forces live re-computation.
- **Wildcard `"*"` Support:** Passing `"*"` targets **every active `<DinouCacheSlot>` mounted on the current page simultaneously**, executing their revalidations in parallel in a single call:
  ```javascript
  import { refreshSlot } from "dinou";

  // Revalidate all active slots on the page in parallel
  refreshSlot("*", { fresh: true });

  // Or surgical slot update from an external WebSocket event
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "PRICE_UPDATE") {
      refreshSlot(`ticker-${data.symbol.toLowerCase()}`, { fresh: true });
    }
  };
  ```

#### `useNavigationLoading()` (Client Components Only)

Returns a `boolean` indicating whether an asynchronous SPA client-side route navigation or soft refresh is currently in progress. Subscribes to React 19's `startTransition` concurrent state.

- **SSR Safety:** On the server (during SSR and static build generation), `useNavigationLoading()` unconditionally returns `false`. This guarantees that initial server-rendered HTML documents are never emitted with flashing loading indicators, eliminating layout shifts and preventing hydration mismatch errors.

```tsx
"use client";
import { useNavigationLoading } from "dinou";

export default function TopProgressBar() {
  const isNavigating = useNavigationLoading();
  if (!isNavigating) return null;
  return <div className="fixed top-0 left-0 right-0 h-1 bg-blue-600 animate-pulse" />;
}
```

---

### 3. Type-Safe Routing (`dinou`)

Dinou v7 introduces zero-runtime type safety with auto-generated declaration files and seamless IDE autocompletion for routes and parameters.

#### `PageProps<T>`

Official TypeScript interface for typing React Page components (`page.tsx`). Takes the route pattern string (constrained by `DinouRoutePattern`) as a generic parameter and automatically infers the strongly typed `params` object:

```tsx
import type { PageProps } from "dinou";

// Trigger Ctrl + Space inside "" to pick from registered routes
export default function BlogPost({ params }: PageProps<"/blog/[slug]">) {
  // params.slug is strongly typed as string
  return <h1>Post: {params.slug}</h1>;
}
```

#### `LayoutProps<T>`

Official TypeScript interface for typing React Layout components (`layout.tsx`). In addition to inferred `params`, it strictly types `children: React.ReactNode`:

```tsx
import type { LayoutProps } from "dinou";

export default function BlogLayout({ children, params }: LayoutProps<"/blog/[slug]">) {
  return (
    <section>
      <header>Category: {params.slug}</header>
      <main>{children}</main>
    </section>
  );
}
```

#### `ErrorProps<T>`

Official TypeScript interface for typing React Error components (`error.tsx`). In addition to inferred `params`, it strictly types the caught `error: Error`:

```tsx
import type { ErrorProps } from "dinou";

export default function DashboardError({ error, params }: ErrorProps<"/dashboard/[teamId]">) {
  return (
    <div>
      <h2>Failed to load team {params.teamId}</h2>
      <p>{error.message}</p>
    </div>
  );
}
```

#### `PageFunctions<TParams, TProps>` & `LayoutFunctions<TParams, TProps>`

Canonical TypeScript interfaces for typing server lifecycle contracts (`page_functions.ts` and `layout_functions.ts`). Exported from `dinou` and re-exported from `dinou/server`. Supports direct route pattern generics (e.g. `"/blog/[slug]"`) or index-access typing:

```typescript
import type { PageFunctions, LayoutFunctions } from "dinou";

// Automatic route parameter inference
export const getProps: PageFunctions<"/blog/[slug]", { title: string }>["getProps"] = async (params) => {
  return { title: `Article: ${params.slug}` };
};

// Strict index-access typing for layout_functions.ts
export const ppr: LayoutFunctions["ppr"] = true;
export const revalidate: LayoutFunctions["revalidate"] = 3600;
```

#### `RouteParams<T>`

Standalone utility type representing the inferred parameters dictionary of a given route pattern. Ideal for typing Server Actions, services, or custom helper functions:

```typescript
import type { RouteParams } from "dinou";

export async function fetchDoc(params: RouteParams<"/docs/[...slug]">) {
  // params.slug is strongly typed as string[]
  return db.docs.find(params.slug.join("/"));
}
```

#### `DinouRoute` & `DinouRoutePattern`

- **`DinouRoute`:** Union type of all valid navigation destinations. Validates internal routes, query strings, hashes, relative paths, and external URLs for `<Link href>` and `router.push()`.
- **`DinouRoutePattern`:** Union type of all registered filesystem folder patterns across your application (e.g. `"/blog/[slug]"`). Generic constraint for `PageProps<T>` and `LayoutProps<T>`.

---

### 4. Server Context & Config (`dinou` & `dinou/config`)

#### `getContext()` (from `"dinou"`)

Retrieves the request and response context synchronously via Node.js / V8 `AsyncLocalStorage`. Available inside Server Components, Server Functions (`"use server"`), and route lifecycle contracts (`page_functions.ts` and `layout_functions.ts`):

- **Returns:** `{ req, res }` and custom context properties attached by plugins:
  - **`req`:** `headers`, `cookies`, `query`, `path`, `method`, `env`.
  - **`res`:** `status()`, `setHeader()`, `redirect()`, `cookie()`, `clearCookie()`.
  - **Custom plugin context:** Any data injected inside `onRequest(request, context)` (such as `context.user` or `context.geo`) is directly accessible via `getContext()`.

#### ⚠️ Security Warning: `getContext` in Client Components

While `getContext()` technically runs during the SSR pass of Client Components, **never invoke it inside a Client Component**:
- **Data Leak:** Sensitive headers, cookies, or auth tokens read into initial HTML are baked into the page source code.
- **Hydration Crash:** `getContext` does not exist in the browser and will fail during client execution.
- **✅ Correct Pattern:** Read sensitive context in a **Server Component** and pass only sanitized, safe props to Client Components.

#### `defineConfig()` & `DinouPlugin`

Type-safe configuration helper providing autocomplete and schema validation for `dinou.config.mjs` (or `.js`, `.ts`):

```javascript
// dinou.config.mjs
import { defineConfig } from "dinou/config";
import { RedisStorage } from "dinou/server";
import Redis from "ioredis";

export default defineConfig({
  // Selected bundler: 'esbuild' (default) | 'rollup' | 'webpack'
  bundler: "esbuild",
  port: 3000,
  reactStrictMode: true,
  ppr: false,

  // Distributed multi-instance ISR cache storage
  storage: new RedisStorage(new Redis(process.env.REDIS_URL)),

  // Universal Web Standards request plugins (Middleware)
  plugins: [
    {
      name: "auth-guard",
      async onRequest(request, context) {
        const url = new URL(request.url);

        // Fast-path early exit: terminates request immediately in <1ms
        if (url.pathname.startsWith("/api/protected")) {
          const auth = request.headers.get("Authorization");
          if (!auth) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
        }

        // Pass-through: enrich context for downstream Server Components
        context.user = await verifyUser(request);
      },
    },
  ],
});
```

---

### 5. Server Cache & Revalidation (`dinou/server`)

Dinou v7 introduces a three-tiered invalidation hierarchy to give you exact control over what gets revalidated:

| Function | Scope | Impact | When to Use |
| :--- | :--- | :--- | :--- |
| `revalidatePage(path)` | **Surgical Page** | Regenerates `page.rsc` and `index.html` only. Does NOT touch layouts. | When page data changes but layout remains intact. |
| `revalidatePath(path, options?)` | **Cascading Path** | Regenerates route files. With `{ cascade: true }`, cascades to all child pages. | When updating route structure or cascading layout changes. |
| `revalidateTag(tag, options?)` | **Cross-Cutting Tag** | Revalidates all routes and `<DinouCacheSlot>` instances tagged with `tag`. | When a database mutation affects multiple routes or slots. |

#### `revalidatePage(path)`

Surgically revalidates only the page component (`page.rsc`) and its HTML (`index.html`) for a specific route path, without re-rendering or touching any layout.

- **Arguments:** `path` (string): The route path to revalidate.
- **Returns:** `Promise<void>`.

```javascript
import { revalidatePage } from "dinou/server";

export async function updatePostAction(id, content) {
  "use server";
  await db.updatePost(id, content);
  // Revalidates ONLY the blog post page without touching header/footer/sidebar layouts
  await revalidatePage(`/blog/${id}`);
}
```

#### `revalidatePath(path, options?)`

Triggers background regeneration of cached static files for the targeted route path. Supports relative paths (e.g. `./` or `details`), resolved relative to the request referer context at runtime.

- **Arguments:**
  - `path` (string): The route to revalidate.
  - `options` (object | "layout", optional): `{ cascade?: boolean }`. When `{ cascade: true }`, if a layout is present, revalidation cascades to all child routes to ensure zero hydration mismatch.
- **Returns:** `Promise<void>`.

```javascript
import { revalidatePath } from "dinou/server";

export async function publishCategoryAction(category) {
  "use server";
  // Cascades invalidation through all pages nested inside /shop/[category]
  await revalidatePath(`/shop/${category}`, { cascade: true });
}
```

#### `revalidateTag(tag, options?)`

Triggers background regeneration of all routes and `<DinouCacheSlot>` instances registered with the matching cache tag.

- **Arguments:**
  - `tag` (string): The cache tag to invalidate.
  - `options` (object | "layout", optional): `{ cascade?: boolean }`. For layout tags, passing `{ cascade: true }` cascades page revalidation down through all descendant pages.
- **Returns:** `Promise<void>`.

```javascript
import { revalidateTag } from "dinou/server";

export async function stockPriceUpdateAction() {
  "use server";
  // Invalidates all DinouCacheSlot components and pages tagged with "stocks"
  await revalidateTag("stocks");
}
```

---

### 6. Storage Adapters (`dinou/server`)

Dinou completely decouples ISR and Micro-ISR caching logic from physical storage media. All pre-rendered HTML, RSC route payloads, segment layouts, and slot fragments are read and written through a unified `StorageAdapter` interface:

#### Built-In Storage Adapters

| Adapter | Target Environment | Description |
| :--- | :--- | :--- |
| `FileSystemStorage` | Node.js / Bun (Default) | Persists cache artifacts directly to local disk (`.dinou/dist2/`). |
| `MemoryStorage` | Serverless / Testing | High-speed volatile in-memory cache (`Map<string, StorageItem>`). |
| `RedisStorage` | Multi-node Docker / K8s | Distributed cache using Redis/Upstash with key prefixing (`"dinou:cache:"`). |
| `DenoKVStorage` | Deno Deploy / Edge | Globally distributed edge storage using `Deno.openKv()`. |
| `CloudflareKVStorage` | Cloudflare Workers | Serverless edge storage using Cloudflare Workers KV bindings. |

#### Storage Configuration & Helpers

```javascript
// dinou.config.mjs
import { defineConfig } from "dinou/config";
import { RedisStorage } from "dinou/server";
import Redis from "ioredis";

export default defineConfig({
  // Configure shared Redis storage across all server instances
  storage: new RedisStorage(new Redis(process.env.REDIS_URL), "dinou:cache:"),
});
```

- **`getStorageAdapter()`:** Retrieves the active `StorageAdapter` instance on the server.
- **`setStorageAdapter(adapter)`:** Programmatically swaps the storage engine during server bootstrap or automated test suites.
- **Custom Adapters:** Extend the abstract `StorageAdapter` class to implement custom engines (e.g. SQLite, MongoDB, S3/R2) by implementing `get`, `set`, `has`, `delete`, and `keys`.

---

### 7. Runtime Adapters (`dinou/adapters/*`)

Dinou provides dedicated, zero-dependency adapters that map native platform requests into Dinou's universal Web Standards request handler (`(Request) => Promise<Response>`):

```javascript
// Node.js (AOT Dual-Bundle)
import server from "dinou/adapters/node";

// Cloudflare Workers
import worker from "dinou/adapters/cloudflare";
export default worker;

// Bun (High-throughput & Streaming)
import server from "dinou/adapters/bun";
export default server;

// Deno
import { fetch } from "dinou/adapters/deno";
Deno.serve(fetch);

// Netlify Functions v2
export { default, config } from "dinou/adapters/netlify";
```

---

### 8. File Conventions & Route Escaping

Dinou recognizes specific filenames to build the routing and lifecycle hierarchy.

#### Route Components & Lifecycle Contracts

| Filename | Environment | Description |
| :--- | :--- | :--- |
| `page.{jsx,tsx,js,ts}` | Server or Client | The unique UI for a route. |
| `layout.{jsx,tsx,js,ts}` | Server or Client | Wraps the page and children segments. Preserved across child navigations. |
| `page_functions.{ts,js}` | Server-Only | Lifecycle hooks for page: `getProps`, `getStaticPaths`, `revalidate`, `ppr`, etc. |
| `layout_functions.{ts,js}` | Server-Only | Independent lifecycle hooks for layout: dedicated `getProps`, `revalidate`, `ppr`, etc. |
| `error.{jsx,tsx,js,ts}` | Server (Default) | UI for runtime errors within the segment. Supports `<ErrorProps<T>>`. |
| `not_found.{jsx,tsx,js,ts}` | Server or Client | UI for 404 not found pages within the segment. |

#### Layout Control Flags (Empty Files)

Create these empty files to alter how layouts apply to a specific route directory:

| Filename | Effect |
| :--- | :--- |
| `no_layout` | The `page.tsx` in this folder will **NOT** be wrapped in any layout. |
| `reset_layout` | Resets the layout hierarchy. The first layout found inside this folder becomes the Root Layout. |
| `no_layout_error` | The `error.tsx` in this folder will render without any layout. |
| `no_layout_not_found` | The `not_found.tsx` in this folder will render without any layout. |

#### Route Escaping (`_prefix`)

Any directory prefixed with an underscore (`_folder`) is **completely ignored** by the route compiler. Use underscore folders for:
- Colocating private components, hooks, or utilities inside `src/` (e.g. `src/dashboard/_components/widget.tsx`).
- Temporarily archiving or drafting routes containing `page.tsx` without exposing them publicly (e.g. `src/_drafts/page.tsx`).

## 📁 Static Assets & Public Folder (`public/`)

Dinou provides a standard **`public/`** directory at the root of your project for uncompiled static assets. Any file placed inside `public/` is automatically copied to `.dinou/dist3/` during production builds and served directly from the root URL path (`/`).

### Typical `public/` Structure:
```
my-dinou-app/
├── public/
│   ├── favicon.ico
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   ├── site.webmanifest
│   ├── robots.txt
│   ├── sitemap.xml
│   └── og-image.png
├── src/
└── package.json
```

### Linking Assets in Root Layout:
Update your root `layout.tsx` (or `page.tsx`) to reference your static assets:

```typescript
"use client";

import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Dinou App</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

> **Note on Static Routes:** Static files in `public/` take precedence over dynamic application routes. For example, `public/robots.txt` will be served immediately without executing React Server Components.
>
> **Backward Compatibility:** Dinou maintains full backward compatibility for existing projects using the legacy `favicons/` folder. Both `public/` and `favicons/` are supported simultaneously.

## 🔐 Environment Variables (`.env`)

Dinou automatically loads environment variables for server-side code (Server Components, Server Functions, and `getProps`).

1. Create a `.env` file in the root of your project.
2. Add `.env` to your `.gitignore` to prevent exposing sensitive keys.

```bash
# .env
API_SECRET=my_secret_value
DB_HOST=localhost
```

## 🎨 Styles (Tailwind, CSS Modules, & Global CSS)

Dinou supports **Tailwind CSS**, **CSS Modules** (`.module.css`), and standard **Global CSS** (`.css`) out of the box.

Dinou bundles all your styles into a single file served at `/styles.css`. You **must** manually link this file in your root layout or page.

### 1. Link the Stylesheet

Add the link tag to the `<head>` of your root component:

```typescript
<link href="/styles.css" rel="stylesheet" />
```

### 2. Full Example (Layout + Global CSS + Modules)

**`src/layout.tsx`** (Client Component example):

```typescript
"use client";

import type { ReactNode } from "react";
import "./globals.css"; // Import global styles here

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Dinou App</title>
        {/* Favicons omitted for brevity */}
        <link href="/styles.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**`src/globals.css`** (Tailwind setup):

```css
@import "tailwindcss";

.custom-bg {
  background-color: purple;
}
```

**`src/page.tsx`** (Using CSS Modules):

```typescript
"use client";

import styles from "./page.module.css";

export default function Page() {
  return (
    <div className={`text-red-500 custom-bg ${styles.underlined}`}>
      Hello World!
    </div>
  );
}
```

**`src/page.module.css`**:

```css
.underlined {
  text-decoration: underline;
}
```

> **TypeScript Support:** You do not need to create manual `src/css.d.ts` files. Dinou includes built-in ambient types for CSS Modules via `dinou/env`. Simply reference `dinou-env.d.ts` in your project root (see [TypeScript & Import Aliases](#-typescript--import-aliases-)).

## 🖼️ Assets & Media

You can import media files directly into your components. Dinou supports a wide range of extensions:

- **Images:** `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.avif`, `.ico`, `.mjpeg`, `.mjpg`
- **Audio/Video:** `.mp4`, `.webm`, `.ogg`, `.mov`, `.avi`, `.mkv`, `.mp3`, `.wav`, `.flac`, `.m4a`, `.aac`

**Usage:**

```typescript
// src/component.tsx
"use client";
import logo from "./logo.png";

export default function Component() {
  return <img src={logo} alt="Logo" />;
}
```

> **Built-in TypeScript Support:** You do not need to create manual `src/assets.d.ts` files. Dinou includes built-in ambient declarations for all supported image and media formats through `dinou/env`. Simply include `dinou-env.d.ts` at the root of your project.

> **Customization:** If you need to support additional extensions, you can [eject](#-eject-dinou) Dinou and modify `dinou/core/asset-extensions.js`.

## 🏷️ TypeScript & Import Aliases (`@/`)

Dinou provides first-class TypeScript support with zero clutter. Ambient type declarations for assets (images, videos, audio), CSS Modules (`*.module.css`), and framework globals are provided by Dinou's built-in `./env` export.

### 1. Ambient Declarations (`dinou-env.d.ts`)

Create a `dinou-env.d.ts` file at the root of your project:

```typescript
// dinou-env.d.ts
/// <reference types="dinou/env" />
```

This automatically provides complete type declarations across your entire project without needing separate `css.d.ts` or `assets.d.ts` files inside `src/`.

### 2. Recommended `tsconfig.json`

Configure paths and bundler module resolution in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "src/*"
      ]
    },
    "allowJs": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "bundler"
  },
  "include": [
    "src",
    "dinou-env.d.ts"
  ]
}
```

## ⚡ Bundlers & Running the App

Dinou is flexible and bundler-agnostic, integrating with three major compilers: **esbuild** (default), **Rollup**, and **Webpack**. In Dinou v7, commands are organized into intuitive families for development, production, edge bundling, and static site export.

### Development

Starts the development server with hot module reloading. In Dinou v7, development runs as a **unified single process (0-forks)** without `concurrently`, eliminating port race conditions, zombie processes, and providing clean serialized logs alongside a live non-intrusive Unicode Braille activity spinner:

| Command               | Bundler     | Description                |
| :-------------------- | :---------- | :------------------------- |
| `npm run dev`         | **esbuild** | Default. Fastest startup with Rust-powered SWC Fast Refresh. |
| `npm run dev:esbuild` | **esbuild** | Explicit esbuild command.  |
| `npm run dev:rollup`  | **Rollup**  | Uses Rollup with state-preserving ESM HMR. |
| `npm run dev:webpack` | **Webpack** | Uses Webpack with Webpack Dev Server. |

### Production Build & SSG

Compiles client/server bundles into `.dinou/dist3` and **automatically pre-renders all static pages (SSG) into `.dinou/dist2`** at build time:

| Command | Bundler / Runtime | Description |
| :--- | :--- | :--- |
| `npm run build` | **Node.js** (Default) | Production build & SSG with default bundler (`esbuild`). |
| `npm run build:node` | **Node.js** | Explicit Node.js AOT Dual-Bundle build. |
| `npm run build:node:esbuild` | **Node.js (esbuild)** | Node.js AOT production build with esbuild. |
| `npm run build:node:rollup` | **Node.js (Rollup)** | Full tree-shaking Node.js production build with Rollup. |
| `npm run build:node:webpack` | **Node.js (Webpack)** | Enterprise Node.js production build with Webpack. |
| `npm run build:bun` | **Bun** | Generates standalone Bun AOT bundle (`.dinou/bun/server.js`). |
| `npm run build:bun:pure` | **Bun (Pure)** | Pure Bun-native build pipeline (no Node.js required). |

### Start Production Server (Node, Bun, Deno)

Runs the production server. In Dinou v7, Node.js production start uses the clean AOT pre-bundled server:

| Command | Runtime | Description |
| :--- | :--- | :--- |
| `npm start` | **Node.js** | Runs production AOT server (`npm run start:node`). |
| `npm run start:node` | **Node.js** | Starts standalone `.dinou/node/server.mjs`. |
| `npm run start:node:esbuild` | **Node.js (esbuild)** | Starts esbuild-compiled Node server. |
| `npm run start:node:rollup` | **Node.js (Rollup)** | Starts Rollup-compiled Node server. |
| `npm run start:node:webpack` | **Node.js (Webpack)** | Starts Webpack-compiled Node server. |
| `npm run start:bun` | **Bun** | High-performance Bun server with zero-copy assets and configurable `IDLE_TIMEOUT`. |
| `npm run start:deno` | **Deno** | Deno standalone server with explicit sandbox permissions. |

### Edge Application Bundling (Cloudflare & Deno Deploy)

Packages your entire application into a single self-contained Edge bundle with inlined manifests:

| Command | Target | Output Artifact |
| :--- | :--- | :--- |
| `npm run build:cloudflare` | **Cloudflare Workers** | `.dinou/cloudflare/worker.js` |
| `npm run build:cloudflare:esbuild` | **Cloudflare (esbuild)** | `.dinou/cloudflare/worker.js` |
| `npm run build:cloudflare:rollup` | **Cloudflare (Rollup)** | `.dinou/cloudflare/worker.js` |
| `npm run build:cloudflare:webpack` | **Cloudflare (Webpack)** | `.dinou/cloudflare/worker.js` |
| `npm run build:deno` | **Deno Deploy / Edge** | `.dinou/deno/main.js` |
| `npm run build:deno:esbuild` | **Deno Deploy (esbuild)** | `.dinou/deno/main.js` |
| `npm run build:deno:rollup` | **Deno Deploy (Rollup)** | `.dinou/deno/main.js` |
| `npm run build:deno:webpack` | **Deno Deploy (Webpack)** | `.dinou/deno/main.js` |

### Standalone Native Binary Compilation (Zero-Node Deployment)

Compiles your entire Dinou application into a single, self-contained native executable binary with zero runtime dependencies on the target host:

| Command | Engine | Output Binary | Target Platform |
| :--- | :--- | :--- | :--- |
| `npm run build:bun:compile` | **Bun** | `dist/server` | Current Host OS |
| `npm run build:bun:compile:linux` | **Bun** | `dist/server-linux` | Linux x64 |
| `npm run build:bun:compile:linux_arm` | **Bun** | `dist/server-linux-arm` | Linux ARM64 |
| `npm run build:bun:compile:mac` | **Bun** | `dist/server-mac` | macOS x64/ARM64 |
| `npm run build:bun:compile:win` | **Bun** | `dist/server-win.exe` | Windows x64 |
| `npm run build:deno:compile` | **Deno** | `dist/deno-server` | Current Host OS |
| `npm run build:deno:compile:linux` | **Deno** | `dist/deno-server-linux` | Linux x64 |
| `npm run build:deno:compile:linux_arm` | **Deno** | `dist/deno-server-linux-arm` | Linux ARM64 |
| `npm run build:deno:compile:mac` | **Deno** | `dist/deno-server-mac` | macOS x64/ARM64 |
| `npm run build:deno:compile:win` | **Deno** | `dist/deno-server-win.exe` | Windows x64 |

### Standalone Static Export

Generates a standalone, serverless static website in the `out/` directory for zero-cost static hosting:

| Command | Bundler | Output Directory |
| :--- | :--- | :--- |
| `npm run export-static` | **esbuild** (Default) | `out/` |
| `npm run export-static:esbuild` | **esbuild** | `out/` |
| `npm run export-static:rollup` | **Rollup** | `out/` |
| `npm run export-static:webpack` | **Webpack** | `out/` |

### Complete CLI Scripts Catalog (100 Scripts Reference)

In Dinou v7, all build, development, compilation, and export operations are unified into the official `dinou` CLI binary. In standard (non-ejected) mode, `package.json` scripts map directly to `dinou <command>`.

Below is the complete catalog of **100 standard scripts** supported by Dinou v7 across all deployment targets and bundlers:

<details>
<summary><strong>🔍 Click to expand the full 100 scripts <code>package.json</code> catalog</strong></summary>

```json
{
  "scripts": {
    "dev": "dinou dev",
    "build": "dinou build",
    "start": "dinou start",
    "dev:esbuild": "dinou dev:esbuild",
    "dev:rollup": "dinou dev:rollup",
    "dev:webpack": "dinou dev:webpack",
    "build:node": "dinou build:node",
    "build:node:esbuild": "dinou build:node:esbuild",
    "build:node:rollup": "dinou build:node:rollup",
    "build:node:webpack": "dinou build:node:webpack",
    "start:node": "dinou start:node",
    "start:node:esbuild": "dinou start:node:esbuild",
    "start:node:rollup": "dinou start:node:rollup",
    "start:node:webpack": "dinou start:node:webpack",
    "build:cloudflare": "dinou build:cloudflare",
    "build:cloudflare:esbuild": "dinou build:cloudflare:esbuild",
    "build:cloudflare:rollup": "dinou build:cloudflare:rollup",
    "build:cloudflare:webpack": "dinou build:cloudflare:webpack",
    "build:deno": "dinou build:deno",
    "build:deno:esbuild": "dinou build:deno:esbuild",
    "build:deno:rollup": "dinou build:deno:rollup",
    "build:deno:webpack": "dinou build:deno:webpack",
    "build:deno:compile": "dinou build:deno:compile",
    "build:deno:compile:esbuild": "dinou build:deno:compile:esbuild",
    "build:deno:compile:rollup": "dinou build:deno:compile:rollup",
    "build:deno:compile:webpack": "dinou build:deno:compile:webpack",
    "build:deno:compile:linux": "dinou build:deno:compile:linux",
    "build:deno:compile:linux:esbuild": "dinou build:deno:compile:linux:esbuild",
    "build:deno:compile:linux:rollup": "dinou build:deno:compile:linux:rollup",
    "build:deno:compile:linux:webpack": "dinou build:deno:compile:linux:webpack",
    "build:deno:compile:linux_arm": "dinou build:deno:compile:linux_arm",
    "build:deno:compile:linux_arm:esbuild": "dinou build:deno:compile:linux_arm:esbuild",
    "build:deno:compile:linux_arm:rollup": "dinou build:deno:compile:linux_arm:rollup",
    "build:deno:compile:linux_arm:webpack": "dinou build:deno:compile:linux_arm:webpack",
    "build:deno:compile:mac": "dinou build:deno:compile:mac",
    "build:deno:compile:mac:esbuild": "dinou build:deno:compile:mac:esbuild",
    "build:deno:compile:mac:rollup": "dinou build:deno:compile:mac:rollup",
    "build:deno:compile:mac:webpack": "dinou build:deno:compile:mac:webpack",
    "build:deno:compile:win": "dinou build:deno:compile:win",
    "build:deno:compile:win:esbuild": "dinou build:deno:compile:win:esbuild",
    "build:deno:compile:win:rollup": "dinou build:deno:compile:win:rollup",
    "build:deno:compile:win:webpack": "dinou build:deno:compile:win:webpack",
    "start:deno": "dinou start:deno",
    "build:bun": "dinou build:bun",
    "build:bun:esbuild": "dinou build:bun:esbuild",
    "build:bun:rollup": "dinou build:bun:rollup",
    "build:bun:webpack": "dinou build:bun:webpack",
    "build:bun:compile": "dinou build:bun:compile",
    "build:bun:compile:esbuild": "dinou build:bun:compile:esbuild",
    "build:bun:compile:rollup": "dinou build:bun:compile:rollup",
    "build:bun:compile:webpack": "dinou build:bun:compile:webpack",
    "build:bun:compile:linux": "dinou build:bun:compile:linux",
    "build:bun:compile:linux:esbuild": "dinou build:bun:compile:linux:esbuild",
    "build:bun:compile:linux:rollup": "dinou build:bun:compile:linux:rollup",
    "build:bun:compile:linux:webpack": "dinou build:bun:compile:linux:webpack",
    "build:bun:compile:linux_arm": "dinou build:bun:compile:linux_arm",
    "build:bun:compile:linux_arm:esbuild": "dinou build:bun:compile:linux_arm:esbuild",
    "build:bun:compile:linux_arm:rollup": "dinou build:bun:compile:linux_arm:rollup",
    "build:bun:compile:linux_arm:webpack": "dinou build:bun:compile:linux_arm:webpack",
    "build:bun:compile:mac": "dinou build:bun:compile:mac",
    "build:bun:compile:mac:esbuild": "dinou build:bun:compile:mac:esbuild",
    "build:bun:compile:mac:rollup": "dinou build:bun:compile:mac:rollup",
    "build:bun:compile:mac:webpack": "dinou build:bun:compile:mac:webpack",
    "build:bun:compile:win": "dinou build:bun:compile:win",
    "build:bun:compile:win:esbuild": "dinou build:bun:compile:win:esbuild",
    "build:bun:compile:win:rollup": "dinou build:bun:compile:win:rollup",
    "build:bun:compile:win:webpack": "dinou build:bun:compile:win:webpack",
    "build:bun:pure": "dinou build:bun:pure",
    "build:bun:pure:esbuild": "dinou build:bun:pure:esbuild",
    "build:bun:pure:rollup": "dinou build:bun:pure:rollup",
    "build:bun:pure:webpack": "dinou build:bun:pure:webpack",
    "build:bun:pure:compile": "dinou build:bun:pure:compile",
    "build:bun:pure:compile:esbuild": "dinou build:bun:pure:compile:esbuild",
    "build:bun:pure:compile:rollup": "dinou build:bun:pure:compile:rollup",
    "build:bun:pure:compile:webpack": "dinou build:bun:pure:compile:webpack",
    "build:bun:pure:compile:linux": "dinou build:bun:pure:compile:linux",
    "build:bun:pure:compile:linux:esbuild": "dinou build:bun:pure:compile:linux:esbuild",
    "build:bun:pure:compile:linux:rollup": "dinou build:bun:pure:compile:linux:rollup",
    "build:bun:pure:compile:linux:webpack": "dinou build:bun:pure:compile:linux:webpack",
    "build:bun:pure:compile:linux_arm": "dinou build:bun:pure:compile:linux_arm",
    "build:bun:pure:compile:linux_arm:esbuild": "dinou build:bun:pure:compile:linux_arm:esbuild",
    "build:bun:pure:compile:linux_arm:rollup": "dinou build:bun:pure:compile:linux_arm:rollup",
    "build:bun:pure:compile:linux_arm:webpack": "dinou build:bun:pure:compile:linux_arm:webpack",
    "build:bun:pure:compile:mac": "dinou build:bun:pure:compile:mac",
    "build:bun:pure:compile:mac:esbuild": "dinou build:bun:pure:compile:mac:esbuild",
    "build:bun:pure:compile:mac:rollup": "dinou build:bun:pure:compile:mac:rollup",
    "build:bun:pure:compile:mac:webpack": "dinou build:bun:pure:compile:mac:webpack",
    "build:bun:pure:compile:win": "dinou build:bun:pure:compile:win",
    "build:bun:pure:compile:win:esbuild": "dinou build:bun:pure:compile:win:esbuild",
    "build:bun:pure:compile:win:rollup": "dinou build:bun:pure:compile:win:rollup",
    "build:bun:pure:compile:win:webpack": "dinou build:bun:pure:compile:win:webpack",
    "start:bun": "dinou start:bun",
    "start:bun:esbuild": "dinou start:bun:esbuild",
    "start:bun:rollup": "dinou start:bun:rollup",
    "start:bun:webpack": "dinou start:bun:webpack",
    "export-static": "dinou export-static",
    "export-static:esbuild": "dinou export-static:esbuild",
    "export-static:rollup": "dinou export-static:rollup",
    "export-static:webpack": "dinou export-static:webpack",
    "eject": "dinou eject"
  }
}
```

</details>

#### Breakdown by Target & Lifecycle:

- **Unified Dev Servers (4 scripts):** `dev` (runs `dev:esbuild` by default), `dev:esbuild`, `dev:rollup`, `dev:webpack`.
- **Node.js AOT & Production Start (8 scripts):** `build:node`, `build:node:esbuild`, `build:node:rollup`, `build:node:webpack` with corresponding `start:node`, `start:node:esbuild`, `start:node:rollup`, `start:node:webpack`.
- **Cloudflare Workers (4 scripts):** `build:cloudflare`, `build:cloudflare:esbuild`, `build:cloudflare:rollup`, `build:cloudflare:webpack`.
- **Deno Deploy & Standalone Compilation (21 scripts):** `build:deno` (+ bundler variants), `start:deno`, and cross-platform native binary compilation (`build:deno:compile:*` targeting host, `linux`, `linux_arm`, `mac`, `win`).
- **Bun Runtime, Pure Mode & Compilation (38 scripts):** Node-compatible Bun builds (`build:bun:*`), pure native Bun builds (`build:bun:pure:*`), binary compilation (`build:bun:compile:*` and `build:bun:pure:compile:*`), and runtime runners (`start:bun:*`).
- **Static Site Generation / Standalone Export (4 scripts):** `export-static`, `export-static:esbuild`, `export-static:rollup`, `export-static:webpack`.
- **Eject (1 script):** `eject` converts the project from standard CLI delegation to local source ownership.

## 📦 Eject Dinou

If you need full control over the configuration or internal logic, you can "eject" the framework.

```bash
npm run eject
# or
npx dinou eject
```

This will copy the entire Dinou core into a `dinou/` folder in your project root, allowing you to modify build scripts, server logic, and configuration files directly.

## 🚀 Deployment Guide

Dinou v7 is **completely runtime-agnostic**. Built strictly on Web Standards (`Request`, `Response`, `ReadableStream`, `Headers`), Dinou applications can be deployed to any platform in the JavaScript ecosystem without vendor lock-in.

---

### 1. Node.js Platforms (DigitalOcean, Render, Railway, Fly.io, Docker)

Dinou works seamlessly on any Node.js hosting provider without requiring custom Node flags.

#### DigitalOcean App Platform (Recommended PaaS):
1. Connect your GitHub repository to DigitalOcean App Platform.
2. Configure your build settings:
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
   - **HTTP Port**: `3000` (Dinou automatically binds to `process.env.PORT`).

#### Docker / VPS (Ubuntu, Debian, PM2):
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
```

---

### 2. Bun Standalone Server

Bun delivers ultra-fast startup times and high-throughput static asset serving via zero-copy `Bun.file()`:

1. Build your application for Bun:
   ```bash
   npm run build:bun
   # or in a 100% Bun environment without Node.js:
   npm run build:bun:pure
   ```
2. Start with Bun:
   ```bash
   npm run start:bun
   ```
   *(Configurable via `PORT` environment variable, defaults to `3000`)*.

> **Streaming & AI Timeout Protection:** Dinou pre-configures Bun with a safe `idleTimeout` of 120 seconds (overriding Bun's default 10s cutoff) to protect streaming SSR, async Server Functions, and AI LLM completions. You can customize this by setting the `IDLE_TIMEOUT` environment variable (e.g. `IDLE_TIMEOUT=60`).

---

### 3. Deno Deploy & Edge

Deploy to Deno's global edge network across 35+ regions with automated Deno KV storage for Edge ISR:

1. Bundle for Deno:
   ```bash
   npm run build:deno
   ```
   *(Generates standalone bundle `.dinou/deno/main.js`)*.
2. Deploy via Deno CLI:
   ```bash
   deployctl deploy --project=<your-project-name> .dinou/deno/main.js
   ```
   > **Edge ISR Support:** On Deno Deploy, Dinou automatically detects `Deno.openKv()` and configures `DenoKVStorage`, giving your application globally distributed Incremental Static Regeneration without needing a local filesystem.

---

### 4. Cloudflare Workers / Pages

Deploy directly to Cloudflare's serverless edge infrastructure:

1. Bundle for Cloudflare:
   ```bash
   npm run build:cloudflare
   ```
   *(Generates `.dinou/cloudflare/worker.js` with inlined route manifests)*.
2. Configure `wrangler.jsonc` or `wrangler.toml` in your root:
   ```json
   {
     "name": "my-dinou-app",
     "main": ".dinou/cloudflare/worker.js",
     "compatibility_date": "2025-03-01",
     "compatibility_flags": ["nodejs_compat"],
     "assets": {
       "directory": ".dinou/dist3",
       "binding": "ASSETS"
     }
   }
   ```
3. Deploy with Wrangler:
   ```bash
   npx wrangler deploy
   ```

---

### 5. Netlify (Serverless Functions v2)

Deploy seamlessly to Netlify using the official zero-dependency adapter:

1. Create `netlify/functions/dinou.js`:
   ```javascript
   export { default, config } from "dinou/adapters/netlify";
   ```
2. Configure `netlify.toml` in your project root:
   ```toml
   [build]
     command = "npm run build"
     publish = ".dinou/dist3"

   [functions]
     directory = "netlify/functions"
   ```
3. Push to your Git repository connected to Netlify. Client assets from `.dinou/dist3` are served globally from Netlify CDN at edge speed, while dynamic SSR and Server Functions route directly to the serverless function.

---

### 6. Pure Static Hosting (Surge.sh, GitHub Pages, Cloudflare Pages, S3)

If your project consists of static pages (`SSG`) and doesn't require on-demand server rendering, export it as a standalone static site:

1. Export static bundle:
   ```bash
   npm run export-static
   ```
   *(Builds the app and unifies `.dinou/dist3` assets and `.dinou/dist2` pre-rendered HTML into an `out/` folder)*.
2. Deploy the `out/` folder anywhere:
   - **Surge.sh**: `npx surge out my-app.surge.sh`
   - **GitHub Pages**: `npx gh-pages -d out`
   - **Cloudflare Pages (Direct Upload)**: `npx wrangler pages deploy out`
   - **AWS S3 / DO Spaces**: Sync the `out/` directory directly to your bucket with CDN enabled.

---

## 📜 Changelog

For a detailed list of changes, enhancements, and bug fixes across versions, see the [CHANGELOG.md](./CHANGELOG.md).

## 📄 License

Dinou is licensed under the [MIT License](./LICENSE.md).
