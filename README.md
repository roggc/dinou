# **Dinou**

### **A Full-Stack React 19 Framework**

---

Support for React Server Components (RSC), Server-Side Rendering (SSR), Static Generation (SSG), Incremental Static Generation (ISG), and Incremental Static Regeneration (ISR).

## Key Features

- **Native React Server Components:** Built on the React 19 core, leveraging Suspense and Streaming for optimal performance.
- **Hybrid Rendering Engine:** Static by default (SSG). Automatically switches to Dynamic Rendering (SSR) when request-specific data (cookies, headers, search params) is detected.
- **Full-Featured Router:** Client-side soft navigation including `push`, `replace`, `back`, `forward`, and `refresh` (soft reload).
- **Generation Strategies:** Comprehensive support for Incremental Static Regeneration (ISR) and Incremental Static Generation (ISG).
- **Data Fetching & State:** Optimized patterns using `react-enhanced-suspense` (with `resourceId`) and `jotai-wrapper` for seamless server-client state synchronization and mutations.
- **Smart Navigation:** `<Link>` component with automatic prefetching and opt-in `fresh` data fetching for volatile states.
- **File-System Routing:** Automatic routing based on `page.{jsx,tsx,js,ts}` files located within the `src` directory structure.

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
- [Advanced Patterns: The "Dinou Pattern"](#advanced-patterns-the-dinou-pattern)
  - [The Concept](#the-concept)
  - [Implementation](#implementation)
- [Page Configuration (`page_functions.ts`)](#page-configuration-page_functionsts)
  - [1. `getProps` (Static/Layout Data Injection)](#1-getprops-staticlayout-data-injection)
  - [2. `getStaticPaths` (Static Generation)](#2-getstaticpaths-static-generation)
  - [3. `revalidate` (ISR)](#3-revalidate-isr)
  - [4. `dynamic` (Force SSR)](#4-dynamic-force-ssr)
- [📚 API Reference](#-api-reference)
  - [1. Components (`dinou`)](#1-components-dinou)
  - [2. Hooks & Utilities (`dinou`)](#2-hooks--utilities-dinou)
  - [3. Server-Only Utilities (`dinou`)](#3-server-only-utilities-dinou)
  - [4. Page Configuration (`page_functions.ts`)](#4-page-configuration-page_functionsts)
  - [5. File Conventions Cheatsheet](#5-file-conventions-cheatsheet)
- [🎨 Favicons](#-favicons)
- [🔐 Environment Variables (`.env`)](#-environment-variables-env)
- [💅 Styles (Tailwind, CSS Modules, & Global CSS)](#-styles-tailwind-css-modules--global-css)
  - [1. Link the Stylesheet](#1-link-the-stylesheet)
  - [2. Full Example (Layout + Global CSS + Modules)](#2-full-example-layout--global-css--modules)
- [🖼️ Assets & Media](#️-assets--media)
- [🔗 Import Aliases (`@/`)](#-import-aliases-)
- [⚡ Bundlers & Running the App](#-bundlers--running-the-app)
  - [Development](#development)
  - [Production Build](#production-build)
  - [Start Production Server](#start-production-server)
- [⏏️ Eject Dinou](#️-eject-dinou)
- [🚀 Deployment](#-deployment)
- [📦 Changelog](#-changelog)
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
export async function getProps({ params }) {
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

## Advanced Patterns: The "Dinou Pattern"

Dinou introduces a powerful pattern for handling mutations and list updates without full page reloads. By combining **Server Functions**, **Global State** (e.g., `jotai-wrapper`), and **`react-enhanced-suspense`**, you can achieve granular reactivity.

### The Concept

In Dinou, **Server Functions can return Client Components**. We leverage this to return a "Headless State Updater" component after a mutation. This component renders nothing but updates a global `resourceId` atom (key), triggering a re-fetch of specific data.

### Implementation

#### 1. The Global Store

Define an atom to hold the `resourceId` key.

```javascript
// src/atoms.js
import { atom } from "jotai";
import getAPIFromAtoms from "jotai-wrapper";

export const { useAtom, useSetAtom, useAtomValue, getAtom, selectAtom } =
  getAPIFromAtoms({
    tasksListKey: atom(0),
    isAddTask: atom(false),
    // rest of atoms...
  });
```

#### 2. The Headless Updater (Client Component)

A tiny component whose only job is to update the atoms when it mounts.

```jsx
"use client";
import { useEffect } from "react";
import { useSetAtom } from "@/atoms";

export default function AddTaskUpdater() {
  const setTasksListKey = useSetAtom("tasksListKey");
  const setIsAddTask = useSetAtom("isAddTask");

  useEffect(() => {
    // Update the key to force a re-fetch
    setTasksListKey((k) => k + 1);
    setIsAddTask(false);
  }, [setTasksListKey, setIsAddTask]);

  return null; // It renders nothing visually
}
```

#### 3. The Server Function (Mutation)

Performs the database operation and **returns the Client Component**.

```jsx
"use server";
import AddTaskUpdater from "../components/add-task-updater";
import { tasks } from "./db";

export async function addTask(text) {
  // Perform DB mutation
  tasks.push(text);

  // 🪄 Magic: Return the updater to run logic on the client
  return <AddTaskUpdater />;
}
```

#### 4. The Page (Consuming the Pattern)

Use `react-enhanced-suspense` with the `resourceId` prop. When the `resourceId` (in this case `tasksListKey`) changes, the Server Function (`tasksList`) is re-evaluated.

```jsx
"use client";
import Suspense from "react-enhanced-suspense";
import { useAtomValue, useAtom } from "@/atoms";
import { addTask } from "./server-functions/add-task";
import { tasksList } from "./server-functions/tasks-list";
import { useState } from "react";

export default function Page() {
  const tasksListKey = useAtomValue("tasksListKey");
  const [isAddTask, setIsAddTask] = useAtom("isAddTask");
  const [text, setText] = useState("");

  return (
    <div>
      {/* The Mutation Form */}
      <input type="text" onChange={(e) => setText(e.target.value)} />
      <button onClick={() => setIsAddTask(true)}>Add Task</button>

      {/* Conditionally render the mutation suspense */}
      {isAddTask && (
        <Suspense fallback="Adding task..." resourceId="add-task">
          {() => addTask(text)}
        </Suspense>
      )}

      {/* The Reactive List */}
      {/* Changing resourceId forces Suspense to re-fetch tasksList */}
      <Suspense
        fallback={<div>Loading tasks...</div>}
        resourceId={`tasks-list-${tasksListKey}`}
      >
        {() => tasksList()}
      </Suspense>
    </div>
  );
}
```

#### 5. The Data Fetching Components

The Server Function responsible for fetching data:

```jsx
// src/server-functions/tasks-list.jsx
"use server";
import { tasks } from "./db";
import TasksListDisplay from "../components/tasks-list-display";

export async function tasksList() {
  return <TasksListDisplay tasks={tasks} />;
}
```

The Client Component responsible for rendering the list:

```jsx
// src/components/tasks-list-display.jsx
"use client";

export default function TasksListDisplay({ tasks }) {
  return (
    <div>
      {tasks.map((t, index) => (
        <div key={index}>{t}</div>
      ))}
    </div>
  );
}
```

## Page Configuration (`page_functions.ts`)

For advanced control over rendering behavior, data fetching, and static generation, you can create a `page_functions.ts` (or `.js`) file next to your `page.jsx`.

### 1. `getProps` (Static/Layout Data Injection)

Use this function to fetch data based on the **route parameters** and inject it into your Page and Layout.

> **Design Note:** `getProps` only receives `params`. To use request-specific data like `searchParams` or `cookies`, fetch data directly inside your Server Components using `Suspense` or Hooks to avoid blocking the initial HTML render.

- **Arguments:** `{ params }` (The dynamic route parameters).
- **Returns:** An object with `page` and `layout` keys containing the props.

```typescript
// src/blog/[slug]/page_functions.ts

export async function getProps({ params }) {
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

## 📚 API Reference

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

### 2. Hooks & Utilities (`dinou`)

Functions available in **both** Server and Client environments.

#### `redirect(destination)`

Stops execution and redirects the user.

- **Server:** Sets HTTP 307 header (if headers not sent).
- **Client:** Renders `<ClientRedirect />`.
- **Usage:** Use with `return` to halt rendering.

```javascript
import { redirect } from "dinou";
if (!user) return redirect("/login");
```

#### `useSearchParams()`

Returns a standard [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) object to read the query string.

```javascript
import { useSearchParams } from "dinou";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  return <div>Result: {query}</div>;
}
```

**Behavior & Static Generation (Bailout):**

| Component Type       | Behavior during Build                              | Result                                                                                                                        |
| :------------------- | :------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| **Server Component** | Accessing this hook triggers a **Static Bailout**. | The page opts out of SSG and switches to **Dynamic Rendering** (SSR) on demand.                                               |
| **Client Component** | Does **NOT** trigger a bailout.                    | The page remains **Static (SSG)**. The initial HTML renders with empty params, and the browser updates values upon hydration. |

> **⚠️ Client Component Warning:**
> If used in a Client Component on a static page, be aware of **Hydration Mismatches**. The server renders with empty params (since they don't exist at build time), but the browser renders with the real URL.
> **Recommendation:** If the initial UI depends heavily on params, pass them as props from a Server Component to force Dynamic Rendering.

**Common Methods:**

- `.get(name)`: Returns the first value.
- `.getAll(name)`: Returns all values (useful for `?id=1&id=2`).
- `.has(name)`: Checks existence.
- `.toString()`: Returns the query string.

#### `usePathname()`

Returns the current URL pathname as a `string` (e.g., `/blog/post-1`).

#### `useRouter()` (Client Only)

Provides programmatic navigation methods.

- **Methods:** `.push(href)`, `.replace(href)`, `.back()`, `.forward()`, `.refresh()`.
- **Note:** Only works inside Client Components (`"use client"`).

#### `useNavigationLoading()` (Client Only)

Returns a `boolean` indicating if a client-side navigation is in progress.

---

### 3. Server-Only Utilities (`dinou`)

#### `getContext()`

Retrieves the request/response context. **Server Components Only**.

- **Returns:** `{ req, res }`.
- **req:** `headers`, `cookies`, `query`, `path`, `method`.
- **res:** `status()`, `setHeader()`, `redirect()`, `cookie()`, `clearCookie()`.

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

### 4. Page Configuration (`page_functions.ts`)

Export these functions from `page_functions.{ts,js}` to configure the associated `page.tsx`.

#### `getStaticPaths()`

Defines paths for Static Site Generation (SSG).

- **Returns:** `Array<string | string[] | Object>`.

```typescript
export function getStaticPaths() {
  return [{ slug: "foo", id: "bar" }];
}
```

#### `getProps({ params })`

**Async** function to fetch data on the server and pass it as props to the Page component and to the Root Layout (if exists).

- **Receives:** Object with resolved `params`.
- **Returns:** Object with the props.

```typescript
export async function getProps({ params }) {
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

---

### 5. File Conventions Cheatsheet

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

## 🎨 Favicons

To add a favicon to your application:

1. Generate your assets using a tool like [favicon.io](https://favicon.io/).
2. Unzip the downloaded folder.
3. Rename the folder to `favicons` and place it in the **root** of your project.
4. Update your root `layout.tsx` (or `page.tsx`) to include the references in the `<head>` tag:

```typescript
"use client";

import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Dinou App</title>
        <link rel="icon" type="image/png" href="/favicon.ico" />
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
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## 🔐 Environment Variables (`.env`)

Dinou automatically loads environment variables for server-side code (Server Components, Server Functions, and `getProps`).

1. Create a `.env` file in the root of your project.
2. Add `.env` to your `.gitignore` to prevent exposing sensitive keys.

```bash
# .env
API_SECRET=my_secret_value
DB_HOST=localhost
```

## 💅 Styles (Tailwind, CSS Modules, & Global CSS)

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

**`src/css.d.ts`** (TypeScript support for modules):

```typescript
declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}
```

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

**TypeScript Configuration:**
To avoid type errors, create a declaration file (e.g., `src/assets.d.ts`):

```typescript
declare module "*.png" {
  const value: string;
  export default value;
}
// Repeat for other extensions used (jpg, svg, mp4, etc.)
```

> **Customization:** If you need to support additional extensions, you can [eject](#-eject-dinou) Dinou and modify `dinou/core/asset-extensions.js`.

## 🔗 Import Aliases (`@/`)

Dinou supports import aliases (e.g., `import Button from "@/components/Button"`). Configure paths in your `tsconfig.json`.

**`tsconfig.json` (TypeScript):**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "allowJs": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
```

## ⚡ Bundlers & Running the App

Dinou is flexible and integrates with three major bundlers: **esbuild** (default), **Rollup**, and **Webpack**.

### Development

Starts the development server with hot reloading. Files are emitted to the `public` folder.

| Command               | Bundler     | Description                |
| :-------------------- | :---------- | :------------------------- |
| `npm run dev`         | **esbuild** | Default. Fastest startup.  |
| `npm run dev:esbuild` | **esbuild** | Explicit esbuild command.  |
| `npm run dev:rollup`  | **Rollup**  | Uses Rollup for bundling.  |
| `npm run dev:webpack` | **Webpack** | Uses Webpack for bundling. |

### Production Build

Compiles the application for production. Files are emitted to the `dist3` folder.

| Command                 | Bundler                |
| :---------------------- | :--------------------- |
| `npm run build`         | **esbuild** (Default)  |
| `npm run build:esbuild` | **esbuild** (Explicit) |
| `npm run build:rollup`  | **Rollup**             |
| `npm run build:webpack` | **Webpack**            |

### Start Production Server

Runs the built application from the `dist3` folder.

| Command                 | Description                         |
| :---------------------- | :---------------------------------- |
| `npm start`             | Same as `npm run start:esbuild`.    |
| `npm run start:esbuild` | Use it after building with esbuild. |
| `npm run start:rollup`  | Use it after building with Rollup.  |
| `npm run start:webpack` | Use it after building with Webpack. |

## ⏏️ Eject Dinou

If you need full control over the configuration or internal logic, you can "eject" the framework.

```bash
npm run eject
# or
npx dinou eject
```

This will copy the entire Dinou core into a `dinou/` folder in your project root, allowing you to modify build scripts, server logic, and configuration files directly.

## 🚀 Deployment

Dinou apps can be deployed to any platform supporting Node.js, provided you can pass custom flags.

### ✅ Recommended: DigitalOcean App Platform

Dinou works seamlessly on DigitalOcean. It allows full control over the runtime command, essential for the required `--conditions react-server` flag.

### ❌ Not Supported: Netlify

Netlify is currently incompatible because it does not support passing custom Node.js flags (`--conditions react-server`) during runtime.

### 🛠 Other Platforms (Render, Fly.io, Railway, etc.)

Ensure your platform allows customization of the start command. Your start command should look like:

```bash
node --conditions react-server dist3/index.js
```

_(Or use `npm start` if your package.json scripts are configured correctly)._

## 📦 Changelog

For a detailed list of changes, enhancements, and bug fixes across versions, see the [CHANGELOG.md](./CHANGELOG.md).

## 📄 License

Dinou is licensed under the [MIT License](./LICENSE.md).
