# **Dinou**

[![Documentation](https://img.shields.io/badge/docs-dinou.dev-blue?style=flat-square)](https://dinou.dev) [![Version](https://img.shields.io/badge/version-7.0.0-orange?style=flat-square)](https://www.npmjs.com/package/dinou)

### **Lightweight-Ejectable Full-Stack React 19 Framework**

---

Support for React Server Components (RSC), Server Functions, Server-Side Rendering (SSR), Static Generation (SSG), Incremental Static Generation (ISG), Incremental Static Regeneration (ISR), and Universal Multi-Platform Deployment (Node.js, Bun, Deno, Cloudflare Workers, Netlify, Static Hosts).

## Key Features

- **React Server Components:** Native integration of React 19 Server Components, streaming HTML/RSC payloads progressively using `renderToPipeableStream` and Suspense.
- **Server Functions:** Functions marked with `"use server"` that execute on the server and can be called from client components. Supports returning rendered React components (Server or Client) directly to the client.
- **Automatic Static Bailout:** Static by default (SSG). Bypasses static files and evaluates dynamically at request time if the request accesses headers, cookies, or query parameters.
- **Client Router:** Client-side soft navigation (`push`, `replace`, `back`, `forward`, `refresh`) with a `useNavigationLoading` hook to track transition loading states.
- **Generation Strategies:** Support for background Incremental Static Regeneration (ISR) and on-demand Incremental Static Generation (ISG) which generates and caches pages on their very first request.
- **Bundler Agnostic:** Supports Webpack, Rollup, and Esbuild as build engines, chosen by executing the corresponding npm or npx script (e.g., `dev:rollup`, `build:webpack`).
- **Navigation Prefetching:** `<Link>` component with automatic prefetching on hover, and an opt-in `fresh` prop to bypass the client cache.
- **File-System Routing:** Routing based on `page.{jsx,tsx}` file paths, supporting optional segments, catch-all paths, Route Groups, and Parallel Route slots (with layout error containment).

## Table of contents

- [Getting Started](#getting-started)
  - [Quick Start (CLI)](#quick-start-cli)
  - [Manual Setup](#manual-setup)
- [Routing](#routing)
  - [Basic & Dynamic Routes](#basic--dynamic-routes)
  - [Important: Optional Segments Rules](#important-optional-segments-rules)
  - [Advanced Routing](#advanced-routing)
  - [Navigation](#navigation)
- [Layouts & Hierarchical Rendering](#layouts--hierarchical-rendering)
  - [Layouts (`layout.jsx`)](#layouts-layoutjsx)
  - [Error Handling (`error.jsx`)](#error-handling-errorjsx)
  - [Not Found (`not_found.jsx`)](#not-found-not_foundjsx)
  - [Advanced Layout Control (Flags)](#advanced-layout-control-flags)
- [Data Fetching & Rendering](#data-fetching--rendering)
  - [Server Components (Async Data)](#server-components-async-data)
  - [Hybrid Rendering Engine](#hybrid-rendering-engine)
  - [Incremental Static Regeneration (ISR)](#incremental-static-regeneration-isr)
  - [Client Components](#client-components)
- [Server Functions (`"use server"`) & Suspense](#server-functions-use-server--suspense)
  - [Usage in Client Components (Reactive)](#usage-in-client-components-reactive)
  - [Usage in Server Components (Streaming)](#usage-in-server-components-streaming)
  - [Server Actions (Form Mutations)](#server-actions-form-mutations)
- [Advanced Patterns: The "Dinou Pattern"](#advanced-patterns-the-dinou-pattern)
  - [The Concept](#the-concept)
  - [Implementation](#implementation)
- [Page Configuration (`page_functions.ts`)](#page-configuration-page_functionsts)
  - [1. `getProps` (Static/Layout Data Injection)](#1-getprops-staticlayout-data-injection)
  - [2. `getStaticPaths` (Static Generation)](#2-getstaticpaths-static-generation)
  - [3. `revalidate` (ISR)](#3-revalidate-isr)
  - [4. `dynamic` (Force SSR)](#4-dynamic-force-ssr)
  - [5. `validateParams` (Route Parameter Validation)](#5-validateparams-route-parameter-validation)
  - [6. `allowISG` (Control On-Demand Generation)](#6-allowisg-control-on-demand-generation)
  - [7. `getCacheTags` (Route Caching Tags)](#7-getcachetags-route-caching-tags)
- [⚡ React Compiler & Automatic Optimizations](#-react-compiler--automatic-optimizations)
  - [Integration Strategy](#integration-strategy)
  - [Code Example](#code-example)
- [📖 API Reference](#-api-reference)
  - [1. Components (`dinou`)](#1-components-dinou)
  - [2. Utilities (`dinou`)](#2-utilities-dinou)
  - [3. Client Hooks (`dinou` - Client Components Only)](#3-client-hooks-dinou---client-components-only)
  - [4. Server-Only Utilities (`dinou` & `dinou/server`)](#4-server-only-utilities)
  - [5. Pluggable Storage & Edge ISR (`dinou/server`)](#5-pluggable-storage--edge-isr-dinouserver)
  - [6. Runtime Adapters (`dinou/adapters/*`)](#6-runtime-adapters-dinouadapters)
  - [7. Page Configuration (`page_functions.ts`)](#7-page-configuration-page_functionsts)
  - [8. File Conventions Cheatsheet](#8-file-conventions-cheatsheet)
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
  - [Standalone Static Export](#standalone-static-export)
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

      {/* Opt-in for fresh data (bypasses cache) */}
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

      {/* Soft Reload: Refetches server data without a browser refresh */}
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

```jsx
// src/dashboard/layout.jsx
export default async function Layout({ children, params, sidebar }) {
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

**Fetching data in Layouts:**
The Root Layout that applies to a specific page can receive additional props by defining a `getProps` function in a `page_functions.ts` file located alongside the page:

```typescript
// src/foo/bar/page_functions.ts
export async function getProps(params) {
  // fetch data using route params
  const data = await fetchData(params.id);
  // 'layout' props are injected into the Root Layout for this page
  return { page: { data }, layout: { title: data.name } };
}
```

### Error Handling (`error.jsx`)

Create an `error.jsx` file to define an error page for a route segment. If a page throws an error (Server or Client not controlled by an Error Boundary), Dinou looks for the closest `error.jsx` in the directory hierarchy (bubbling up).

`error.jsx` receives `error` (object) and `params` as props.

```jsx
// Error pages can be Client Components or Server Components
"use client";

export default function Page({ error, params }) {
  return (
    <div>
      <h2>Something went wrong in {params.slug}!</h2>
      <p>{`${error.name}: ${error.message}`}</p>
      {/* error.stack is only defined in development, not in production */}
      {error.stack && (
        <pre style={{ background: "#eee", padding: "1rem" }}>{error.stack}</pre>
      )}
    </div>
  );
}
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

## Data Fetching & Rendering

Dinou leverages React 19 Server Components to allow direct data access on the server without sending that logic to the client.

### Server Components (Async Data)

You can define a React Server Component by using an `async` function.

```jsx
// src/blog/page.jsx
import db from "@/lib/db";

export default async function Page() {
  const posts = await db.query("SELECT * FROM posts");

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### Hybrid Rendering Engine

Dinou employs a **Zero-Config Hybrid Model**. You do not need to configure pages as "Static" or "Dynamic" manually. The framework decides at runtime:

1. **Static (SSG):** Pages are pre-rendered at start time by default.
2. **Dynamic (SSR):** If a page utilizes request-specific APIs (Cookies, Headers, Search Params), it automatically opts out of static generation and renders on demand.

```jsx
import { getContext } from "dinou";

export default async function Profile() {
  const ctx = getContext();
  if (!ctx) return null;

  // accessing cookies automatically switches this page to Dynamic Rendering (SSR)
  const token = ctx.req.cookies.session_token;

  const user = await fetchUser(token);
  return <h1>Hello, {user.name}</h1>;
}
```

### Incremental Static Regeneration (ISR)

You can enable ISR to update static pages in the background without rebuilding the entire site. Export a `revalidate` function from your `page_functions.ts`.

```typescript
// src/blog/page_functions.ts

// This page will regenerate at most once every 60 seconds
export function revalidate() {
  return 60000; // time in milliseconds
}
```

### Client Components

To add interactivity (useState, useEffect, event listeners), place the `"use client"` directive at the top of your file.

```jsx
"use client";

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

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

### Usage in Client Components (Reactive with React 19)

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

#### Usage in Components

You can import the function and use it directly in your JSX. You can also use the `useFormStatus` hook (from React 19) to show loading states while the action is executing.

```jsx
// src/new-post/page.jsx
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
      {/* The 'name' attribute is required for FormData extraction */}
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

### 1. `getProps` (Static/Layout Data Injection)

Use this function to fetch data based on the **route parameters** and inject it into your Page and Layout.

> **Design Note:** While `getProps` only receives the route `params` as its parameter, you can still read cookies, headers, or query parameters by calling `getContext()` since the function executes on the server.
> Because `getProps` blocks the rendering process at request time, keep it fast for dynamic routes. Note that this does not affect pre-rendered static pages (SSG) since their data is fetched at server startup. In Incremental Static Generation (ISG), it only blocks the very first request by the first visitor before the page is cached. If you need slow dynamic fetches on dynamic routes, defer them to a `Suspense` boundary wrapping a Server Function.

- **Arguments:** `params` (The dynamic route parameters).
- **Returns:** An object with `page` and `layout` keys containing the props.

```typescript
// src/blog/[slug]/page_functions.ts

export async function getProps(params) {
  // 1. Fetch data based on the URL path (e.g., /blog/my-post)
  const post = await db.getPost(params.slug);

  // 2. Return data.
  // 'page' props go to page.jsx
  // 'layout' props go to layout.jsx (useful for setting document titles dynamically)
  return {
    page: { post },
    layout: { title: post.title },
  };
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

### 3. `revalidate` (ISR)

Enables Incremental Static Regeneration. Defines the cache lifetime of a static page in milliseconds.

- **Returns:** `number` (milliseconds).
- If it returns `0` (or is not defined), the page remains static indefinitely (unless rebuilt).

```typescript
// src/dashboard/page_functions.ts
export function revalidate() {
  return 60000; // Regenerate at most once every 60 seconds
}
```

### 4. `dynamic` (Force SSR)

Forces a page to be rendered dynamically (Server-Side Rendering) on every request, bypassing static generation.

- **Returns:** `boolean`.

```typescript
// src/profile/page_functions.ts
export function dynamic() {
  return true; // Always render on demand (SSR)
}
```

### 5. `validateParams` (Route Parameter Validation)

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

### 6. `allowISG` (Control On-Demand Generation)

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

### 7. `getCacheTags` (Route Caching Tags)

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

## ⚡ React Compiler & Automatic Optimizations

Dinou integrates the **React Compiler** (React 19+) out of the box. It analyzes your code and automatically applies fine-grained memoization to values and functions.

This means you can stop manually writing `useMemo`, `useCallback`, and `React.memo`. Just write clean, idiomatic JavaScript, and Dinou ensures maximum performance at build time.

### Integration Strategy

Dinou uses a sophisticated hybrid strategy to balance **Developer Experience (DX)** with **Production Performance**:

| Bundler     |     Development     | Production | Status                                                                                                                           |
| :---------- | :-----------------: | :--------: | :------------------------------------------------------------------------------------------------------------------------------- |
| **Webpack** |     ✅ Enabled      | ✅ Enabled | Full optimization.                                                                                                               |
| **Rollup**  |     ✅ Enabled      | ✅ Enabled | Full optimization.                                                                                                               |
| **Esbuild** | ⚡ **Native Speed** | ✅ Enabled | **Hybrid Mode:** Dev prioritizes instant HMR (Hot Module Replacement), while Prod injects the compiler for maximum optimization. |

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

### 1. Components (`dinou`)

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

---

### 2. Utilities (`dinou`)

Functions available in server and client environments.

#### `redirect(destination)`

Immediately halts rendering/execution and redirects the user. Works in Server Components, Client Components, Server Functions, and Page Functions.

- **Relative Paths:** Supports relative destinations resolving directory-first (filesystem style), matching the resolution rules of `<Link>` and programmatic navigation.
- **Server:** Sets HTTP 307 header (if headers are not sent).
- **Client:** Renders `<ClientRedirect />` internally to trigger soft client-side transition.
- **Usage:** Always use with `return` to immediately stop rendering:
  ```javascript
  import { redirect } from "dinou";
  if (!user) return redirect("/login");
  ```

---

### 3. Client Hooks (`dinou` - Client Components Only)

Hooks that can **only** be used inside Client Components (files starting with `"use client"`). In React 19, calling these hooks inside a Server Component will throw a compilation/runtime crash.

#### `useSearchParams()`

Returns a standard [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) object representing the query parameters of the current URL.

```javascript
import { useSearchParams } from "dinou";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  return <div>Result: {query}</div>;
}
```

- **Static Generation (Bailout):** Accessing `useSearchParams()` in a Client Component does **NOT** trigger a static bailout at server startup. The page remains static (SSG). The server pre-renders the page with empty query parameters, and the client updates the values upon hydration in the browser.
- **Hydration Warning:** If the initial UI depends heavily on query parameters, pass them as props from a Server Component or Page Functions instead to avoid UI flickering/hydration mismatches.

#### `usePathname()`

Returns the normalized current URL pathname as a `string` (e.g., `/blog/post-1`).

```javascript
import { usePathname } from "dinou";

export default function PageInfo() {
  const pathname = usePathname();
  return <p>Current path: {pathname}</p>;
}
```

#### `useRouter()`

Provides programmatic navigation methods.

- **Methods:**
  - `.push(href)`: Navigate to a new route. Supports relative pathnames (directory-first convention).
  - `.replace(href)`: Replace the current history entry. Supports relative pathnames.
  - `.back()`: Navigate back in history.
  - `.forward()`: Navigate forward in history.
  - `.refresh()`: Soft reload. Re-fetches Server Component data without reloading the browser.

```javascript
import { useRouter } from "dinou";

export default function BackButton() {
  const router = useRouter();
  return <button onClick={() => router.back()}>Back</button>;
}
```

#### `useNavigationLoading()`

Returns a `boolean` indicating if a client-side navigation transition is currently in progress.

```javascript
import { useNavigationLoading } from "dinou";

export default function LoadingBar() {
  const isLoading = useNavigationLoading();
  return isLoading ? <div className="loading-spinner" /> : null;
}
```

---

### 4. Server-Only Utilities

#### `getContext()` (from `"dinou"`)

Retrieves the request/response context. Available **only** inside server-side execution threads (Server Components, `page_functions` like `getProps`, and Server Functions).

- **Returns:** `{ req, res }`.
- **req:** `headers`, `cookies`, `query`, `path`, `method`.
- **res:** `status()`, `setHeader()`, `redirect()`, `cookie()`, `clearCookie()`.

#### On-Demand Revalidation (from `"dinou/server"`)

These server-only utilities must be imported from the `"dinou/server"` entry point.

##### `revalidatePath(path)`

Triggers background regeneration of static files for the targeted route path. Supports relative paths (e.g. `./` or `detalles`), resolved relative to the request referer context at runtime.

- **Arguments:** `path` (a string representing the route to revalidate).
- **Returns:** `void`.

```javascript
import { revalidatePath } from "dinou/server";

export async function action() {
  revalidatePath("/blog/posts");
}
```

##### `revalidateTag(tag)`

Triggers background regeneration of all routes registered with the matching cache tag.

- **Arguments:** `tag` (a string representing the tag to invalidate).
- **Returns:** `void`.

```javascript
import { revalidateTag } from "dinou/server";

export async function action() {
  revalidateTag("posts");
}
```

#### ⚠️ Security Warning: `getContext` in Client Components

While `getContext()` technically works during the Server-Side Rendering (SSR) phase of Client Components, **using it directly inside a Client Component is strongly discouraged**.

```javascript
"use client";
import { getContext } from "dinou";

// ❌ DANGEROUS PATTERN
export default function UserProfile() {
  const ctx = getContext(); // Runs on server during SSR
  return <div>{ctx.req.headers["authorization"]}</div>;
  // ⚠️ The sensitive header is now baked into the public HTML source code!
}
```

**Risks:**

1.  **Data Leak:** Any data read from `getContext` during SSR is serialized into the initial HTML. If you mistakenly render sensitive data (like tokens or internal headers), it will be visible in the page source (`View Source`), even if React hydration fails later.
2.  **Hydration Mismatch:** The browser execution will fail because `getContext` is not available in the browser, causing the UI to break or flicker.

**✅ Correct Pattern:**
Fetch sensitive data in a **Server Component** and pass only the necessary, safe fields as props.

```javascript
// src/profile/page.tsx (Server Component)
import { getContext } from "dinou";
import ClientProfile from "./client-profile";

export default function Page() {
  const ctx = getContext();
  // Extract ONLY what is safe for the client
  const safeUser = { name: ctx.req.cookies.username };

  return <ClientProfile user={safeUser} />;
}
```

---

---

### 5. Pluggable Storage & Edge ISR (`dinou/server`)

Dinou v7 features a decoupled, pluggable storage architecture. Incremental Static Regeneration (ISR) and static page caching are managed via a uniform storage interface rather than hardcoded local filesystem operations.

#### `setStorageAdapter(adapter)`
Sets the global storage adapter for Dinou runtime caching and ISR invalidation.

```typescript
import { setStorageAdapter, MemoryStorageAdapter } from "dinou/server";

// Configure in-memory storage (useful for unit tests or ephemeral environments)
setStorageAdapter(new MemoryStorageAdapter());
```

#### `getStorageAdapter()`
Returns the currently active storage adapter instance.

#### Built-in Storage Adapters:
| Adapter Class | Platform Target | Persistence Strategy |
| :--- | :--- | :--- |
| **`FSStorageAdapter`** (Default) | Node.js, Bun, Docker, VPS | Writes static pages and RSC payloads to `.dinou/dist2/`. |
| **`MemoryStorageAdapter`** | Ephemeral, Automated Testing | Fast in-memory `Map` store. Resets on process exit. |
| **`DenoKVStorage`** | Deno Deploy & Edge | Uses native `Deno.openKv()` for global multi-region Edge ISR. |
| **`StorageAdapter`** | Custom backends | Abstract base class to implement custom stores (Redis, Cloudflare KV, Upstash, S3). |

---

### 6. Runtime Adapters (`dinou/adapters/*`)

Dinou provides dedicated, zero-dependency adapters that map native platform requests into Dinou's universal Web Standards request handler (`(Request) => Promise<Response>`):

```javascript
// Cloudflare Workers
import worker from "dinou/adapters/cloudflare";
export default worker;

// Bun
import { fetch } from "dinou/adapters/bun";
export default { fetch };

// Deno
import { fetch } from "dinou/adapters/deno";
Deno.serve(fetch);

// Netlify Functions v2
export { default, config } from "dinou/adapters/netlify";
```

### 7. Page Configuration (`page_functions.ts`)

Export these functions from `page_functions.{ts,js}` to configure the associated `page.tsx`.

#### `getStaticPaths()`

Defines paths for Static Site Generation (SSG).

- **Returns:** `Array<string | string[] | Object>`.

```typescript
export function getStaticPaths() {
  return [{ slug: "foo", id: "bar" }];
}
```

#### `getProps(params)`

**Async** function to fetch data on the server and pass it as props to the Page component and to the Root Layout (if exists).

- **Receives:** Resolved `params` object.
- **Returns:** Object with the props.

```typescript
export async function getProps(params) {
  const data = await db.getItem(params.id);
  return { page: { item: data }, layout: { title: data.title } }; // Available as props in page.tsx and Root Layout of this particular page.
}
```

#### `revalidate()`

Sets the Incremental Static Regeneration (ISR) time in **milliseconds**.

- **Returns:** Number (ms). `0` means no revalidate (always the same static page).

```typescript
export function revalidate() {
  return 60000;
} // Regenerate static page every 1 minute
```

#### `dynamic()`

Whether to bypass static generation or not (e.g. use dynamic rendering).

- **Returns:** `true`, `false`.

```typescript
export function dynamic() {
  return true;
}
```

#### `validateParams(params)`

Validates dynamic parameters on the server prior to rendering or static generation. Returning `false` blocks the request and returns a 404 response.

- **Receives:** Resolved `params` object.
- **Returns:** `boolean` or `Promise<boolean>`.

```typescript
export function validateParams(params) {
  return /^\d+$/.test(params.id);
}
```

#### `allowISG()`

Controls on-demand Incremental Static Generation (ISG) for routes not generated at server startup.

- **Returns:** `boolean` or `Promise<boolean>`.

```typescript
export function allowISG() {
  return false; // Only serve getStaticPaths, return 404 for others
}
```

#### `getCacheTags(params)`

Defines cache tags associated with the pre-rendered page for tag-based invalidation.

- **Receives:** Resolved `params` object.
- **Returns:** `string[]` or `Promise<string[]>` (an array of cache tag strings).

```typescript
export function getCacheTags(params) {
  return ["posts", `post-${params.id}`];
}
```

---

### 8. File Conventions Cheatsheet

Dinou recognizes specific filenames to build the routing hierarchy.

#### Route Components

| Filename                    | Environment      | Description                                    |
| :-------------------------- | :--------------- | :--------------------------------------------- |
| `page.{jsx,tsx,js,ts}`      | Server or Client | The unique UI for a route.                     |
| `layout.{jsx,tsx,js,ts}`    | Server or Client | Wraps the page and children segments.          |
| `error.{jsx,tsx,js,ts}`     | Server or Client | UI for 500 errors within the segment.          |
| `not_found.{jsx,tsx,js,ts}` | Server or Client | UI for 404 not found pages within the segment. |

#### Layout Control Flags (Empty Files)

Create these empty files to alter how layouts apply to a specific route directory.

| Filename              | Effect                                                                                               |
| :-------------------- | :--------------------------------------------------------------------------------------------------- |
| `no_layout`           | The `page.tsx` in this folder will **NOT** be applied any layout.                                    |
| `reset_layout`        | Resets the layout hierarchy. The first layout found from within this folder becomes the Root Layout. |
| `no_layout_error`     | The `error.tsx` in this folder will render without any layout.                                       |
| `no_layout_not_found` | The `not-found.tsx` in this folder will render without any layout.                                   |

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

Starts the development server with hot module reloading:

| Command               | Bundler     | Description                |
| :-------------------- | :---------- | :------------------------- |
| `npm run dev`         | **esbuild** | Default. Fastest startup.  |
| `npm run dev:esbuild` | **esbuild** | Explicit esbuild command.  |
| `npm run dev:rollup`  | **Rollup**  | Uses Rollup for bundling.  |
| `npm run dev:webpack` | **Webpack** | Uses Webpack for bundling. |

### Production Build & SSG

Compiles client/server bundles into `.dinou/dist3` and **automatically pre-renders all static pages (SSG) into `.dinou/dist2`** at build time:

| Command                 | Bundler                | Description                                       |
| :---------------------- | :--------------------- | :------------------------------------------------ |
| `npm run build`         | **esbuild** (Default)  | Fast production bundle & pre-rendering.           |
| `npm run build:esbuild` | **esbuild** (Explicit) | Explicit esbuild build script.                    |
| `npm run build:rollup`  | **Rollup**             | Full tree-shaking production build.               |
| `npm run build:webpack` | **Webpack**            | Enterprise Webpack production build.              |

### Start Production Server (Node, Bun, Deno)

Runs the production server. In Dinou v7, Node.js production start is completely clean and flagless:

| Command                 | Runtime            | Description                                                |
| :---------------------- | :----------------- | :--------------------------------------------------------- |
| `npm start`             | **Node.js**        | Runs production server (`cross-env NODE_ENV=production node ./dinou/core/server.js`). |
| `npm run start:esbuild` | **Node.js**        | Explicit start for esbuild build.                          |
| `npm run start:rollup`  | **Node.js**        | Explicit start for Rollup build.                           |
| `npm run start:webpack` | **Node.js**        | Start with Webpack runtime flag.                           |
| `npm run start:bun`     | **Bun**            | High-performance Bun native server with zero-copy assets.  |
| `npm run start:deno`    | **Deno**           | Deno standalone server with explicit sandbox permissions.  |

### Edge Application Bundling (Cloudflare & Deno Deploy)

Packages your entire application into a single self-contained Edge bundle with inlined manifests:

| Command                           | Target                    | Output Artifact                     |
| :-------------------------------- | :------------------------ | :---------------------------------- |
| `npm run build:cloudflare`        | **Cloudflare Workers**    | `.dinou/cloudflare/worker.js`       |
| `npm run build:cloudflare:rollup` | **Cloudflare (Rollup)**   | `.dinou/cloudflare/worker.js`       |
| `npm run build:cloudflare:webpack`| **Cloudflare (Webpack)**  | `.dinou/cloudflare/worker.js`       |
| `npm run build:deno`              | **Deno Deploy / Edge**    | `.dinou/deno/main.js`              |
| `npm run build:deno:rollup`       | **Deno Deploy (Rollup)**  | `.dinou/deno/main.js`              |
| `npm run build:deno:webpack`      | **Deno Deploy (Webpack)** | `.dinou/deno/main.js`              |

### Standalone Static Export

Generates a standalone, serverless static website in the `out/` directory for zero-cost static hosting:

| Command                        | Bundler                | Output Directory |
| :----------------------------- | :--------------------- | :--------------- |
| `npm run export-static`        | **esbuild** (Default)  | `out/`          |
| `npm run export-static:esbuild`| **esbuild**            | `out/`          |
| `npm run export-static:rollup` | **Rollup**             | `out/`          |
| `npm run export-static:webpack`| **Webpack**            | `out/`          |

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

1. Build your application:
   ```bash
   npm run build
   ```
2. Start with Bun:
   ```bash
   npm run start:bun
   ```
   *(Configurable via `PORT` environment variable, defaults to `3000`)*.

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
