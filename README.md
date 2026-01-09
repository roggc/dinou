# **Dinou**

### **A Full-Stack React 19 Framework**

---

Support for React Server Components (RSC), Server-Side Rendering (SSR), Static Generation (SSG), Incremental Static Generation (ISG), and Incremental Static Regeneration (ISR).

## Key Features

- **Native React Server Components:** Built on the React 19 core, leveraging Suspense and Streaming for optimal performance.
- **Hybrid Rendering Engine:** Static by default (SSG). Automatically switches to Dynamic Rendering (SSR) when request-specific data (cookies, headers) is detected.
- **Full-Featured Router:** Client-side soft navigation including `push`, `replace`, `back`, `forward`, and `refresh` (soft reload).
- **Generation Strategies:** Comprehensive support for Incremental Static Regeneration (ISR) and Incremental Static Generation (ISG).
- **Data Fetching & State:** Optimized patterns using `react-enhanced-suspense` (with `resourceId`) and `jotai-wrapper` for seamless server-client state synchronization and mutations.
- **Smart Navigation:** `<Link>` component with automatic prefetching and opt-in `fresh` data fetching for volatile states.
- **File-System Routing:** Automatic routing based on `page.{jsx,tsx,js,ts}` files located within the `src` directory structure.

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

| Pattern                | File Path                       | URL Example   | Params (`params`)           | Search Params (`searchParams`) |
| :--------------------- | :------------------------------ | :------------ | :-------------------------- | :----------------------------- |
| **Static**             | `src/page.jsx`                  | `/`           | `{}`                        | `{}`                           |
| **Dynamic**            | `src/blog/[slug]/page.jsx`      | `/blog/hello` | `{ slug: "hello" }`         | `{}`                           |
| **Optional Dynamic**   | `src/blog/[[slug]]/page.jsx`    | `/blog`       | `{ slug: undefined }`       | `{}`                           |
| **Catch-all**          | `src/blog/[...slug]/page.jsx`   | `/blog/a/b/c` | `{ slug: ["a", "b", "c"] }` | `{}`                           |
| **Optional Catch-all** | `src/blog/[[...slug]]/page.jsx` | `/blog`       | `{ slug: [] }`              | `{}`                           |

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

A layout component receives a `children` prop, `params`, `searchParams`, and any parallel slot (e.g., `sidebar`) defined in the same folder scope.

```jsx
// src/dashboard/layout.jsx
export default async function Layout({
  children,
  params,
  searchParams,
  sidebar,
}) {
  return (
    <div className="dashboard-grid">
      {sidebar}
      <main>{children}</main>
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
export async function getProps() {
  // fetch data if necessary
  const data = await fetchData();
  return { page: { data }, layout: { data } };
}
```

### Error Handling (`error.jsx`)

Create an `error.jsx` file to define an error page for a route segment. If a page throws an error (Server or Client not controlled by an Error Boundary), Dinou looks for the closest `error.jsx` in the directory hierarchy (bubbling up). `error.jsx` pages also receive `params` and `searchParams` props.

```jsx
// Error pages can be Client Components or Server Components
"use client";

export default function Page({ error, params, searchParams }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
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

Create a `not_found.jsx` file to customize the 404 UI. Like errors, Dinou renders the closest `not_found.jsx` found traversing up from the requested URL. `not_found.jsx` pages also receive `params` and `searchParams` props.

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

> **Design Note:** `getProps` only receives `params`. To use request-specific data like `searchParams` or `cookies`, fetch data directly inside your Server Components using `Suspense` to avoid blocking the initial HTML render.

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

## 📚 API Reference

### 1. Components

#### `<Link>`

The primary way to navigate between pages in Dinou. It enables client-side navigation (SPA feel) without full page reloads.

- **Props:**
  - `href` (string): The path to navigate to.
  - `...props`: Standard anchor tag attributes (`className`, `id`, etc.).

```jsx
import { Link } from "dinou";

<Link href="/about" className="nav-link">
  Go to About
</Link>;
```

---

### 2. Universal Utilities

Functions that work in both Server and Client environments to handle flow control.

#### `redirect(destination)`

Redirects the user to a new URL.

- **Server Behavior:** Sets HTTP 307 status header (if headers haven't been sent) for SEO-friendly redirects.
- **Client Behavior:** Renders a component that triggers an immediate client-side navigation.
- **Usage:** Should be used with `return` to stop the current component rendering.

```jsx
import { redirect, getContext } from "dinou";

export default function Dashboard() {
  const { req } = getContext();
  const user = req.cookies.token;

  if (!user) {
    // ✋ Stops rendering and redirects
    return redirect("/login");
  }

  return <div>Welcome back!</div>;
}
```

---

### 3. Server-Only Utilities

Functions available **only** for Server Components.

#### `getContext()`

Retrieves the current request and response context.

- **Returns:** Object `{ req, res }`.
- **req:** Access to `headers`, `cookies`, `query`, `path`, `method`.
- **res:** Methods to set `status`, `setHeader`, or server-side `redirect`.
- **⚠️ Warning:** Do not use inside Client Components. It causes hydration mismatches and exposes sensitive server data in the HTML source.

```javascript
import { getContext } from "dinou";

export default function Page() {
  const { req } = getContext();
  console.log(req.headers["user-agent"]);
}
```

---

### 4. Navigation Hooks

Hooks to access routing information. They work in both environments but trigger **Static Bailout** when used in Server Components.

#### `useSearchParams()`

Read the current URL query parameters.

- **Returns:** [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams).
- **Note:** In Server Components, accessing this opts the page out of Static Generation.

#### `usePathname()`

Read the current URL pathname (e.g., `/blog/post-1`).

- **Returns:** `string`.

#### `useRouter()` (Client Only)

Programmatic navigation for Client Components (`"use client"`).

- **Methods:**
  - `.push(href)`: Navigate to a new route.
  - `.replace(href)`: Navigate without adding to history.
  - `.back()`: Go back in history.

#### `useNavigationLoading()` (Client Only)

A hook to detect if a client-side navigation is currently in progress. Useful for showing global progress bars or spinners.

- **Returns:** `boolean` (`true` when navigating, `false` when idle).

```jsx
"use client";
import { useNavigationLoading } from "dinou/navigation";

export default function LoadingBar() {
  const isLoading = useNavigationLoading();
  return isLoading ? <div className="spinner" /> : null;
}
```

---

### 5. Page Configuration (`page_functions.ts`)

Exports used to configure the behavior of a `page.tsx` during the build process.

#### `getStaticPaths()`

Defines a list of paths to be statically generated at build time (SSG).

- **Returns:** `Array<string | string[] | Object>`.
- **Features:** Supports deep nesting, optional segments, and static bridges.

```typescript
export function getStaticPaths() {
  return [
    { slug: "hello", lang: "en" }, // Complex route
    ["a", "b"], // Catch-all route
  ];
}
```

#### `dynamic`

Controls the rendering mode of the page.

- **Values:**
  - `undefined` (default): Auto-detect. Static if possible, Dynamic if bailout detected (headers/cookies/searchParams).
  - `"force-dynamic"`: Skips static generation entirely. Always SSR.
  - `"force-static"`: Forces static generation. Build will fail if dynamic data is accessed.

```typescript
// page_functions.ts
export const dynamic = "force-dynamic";
```

### ⚠️ Security Warning: `getContext` in Client Components

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

### `useSearchParams`

A universal hook to access URL query parameters. It works in both Server and Client Components, but behaves differently during the build process.

```javascript
import { useSearchParams } from "dinou/navigation";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  return <div>Searching for: {query}</div>;
}
```

#### Behavior & Static Generation (Bailout)

| Component Type       | Behavior during Build                                       | Result                                                                                                                                    |
| :------------------- | :---------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **Server Component** | Accessing `useSearchParams` triggers a **Static Bailout**.  | The page automatically opts out of SSG and becomes **Dynamic Rendering** (SSR).                                                           |
| **Client Component** | Accessing `useSearchParams` does **NOT** trigger a bailout. | The page remains **Static (SSG)**. The initial HTML will render with empty params, and the browser will update the values upon hydration. |

> **⚠️ Important for Client Components:**
> If you use this hook in a Client Component within a static page, be aware of **Hydration Mismatches**. The server renders with empty params (`null`), but the browser renders with the real URL.
>
> **Recommended:** If your Client Component heavily depends on search params for its initial UI (e.g., a filtered list), pass the params from a Server Component as props to force Dynamic Rendering, or handle the loading state gracefully.

#### API

Returns a standard [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) object.

- `.get(name)`: Returns the first value.
- `.getAll(name)`: Returns all values (for arrays like `?id=1&id=2`).
- `.has(name)`: Checks existence.
- `.toString()`: Returns the query string.

[**Dinou**](https://dinou.dev) is a **React 19 framework**. "dinou" means 19 in Catalan. You can create a Dinou [app](https://github.com/roggc/dinou-app) by running the command **`npx create-dinou@latest my-app`**.

Or you can create one by yourself with the following steps:

- Create an npm project (`npm init -y`)

- Install dependencies (`npm i react react-dom dinou`)

- Create scripts in `package.json` for convenience:

  - "dev": "dinou dev"

  - "build": "dinou build"

  - "start": "dinou start"

  - "eject": "dinou eject"

- Create an `src` folder with a `page.jsx` (or `.tsx`)

  ```typescript
  "use client";

  export default function Page() {
    return <>hi world!</>;
  }
  ```

````

- Run `npm run dev` (or `npx dinou dev`) to see the page in action in your browser.

- If you run `npm run eject` (or `npx dinou eject`), Dinou will be ejected and copied to your root project folder, so you can customize it.

Dinou main features are:

- File-based routing system.

- SSR (Server Side Rendering)

- SSG (Static Site Generation)

- ISR (Incremental Static Regeneration)

- Pure React 19: Server Functions, `Suspense`, Server Components, ...

- TypeScript or JavaScript

- Full control and customization through the command `npm run eject` (`npx dinou eject`)

- Support for the use of `.css`, `.module.css`, and `Tailwind.css`

- Support for the use of images in your components (`.png`, `.jpeg`, `.jpg`, `.gif`, `.svg`, `.webp`)

- Support for the use of an import alias in `tsconfig.json` or `jsconfig.json` file.

- Error handling with `error.tsx` pages, differentiating behaviour in production and in development.

## Table of contents

- [Routing system, layouts, pages, not found pages, ...](#routing-system-layouts-pages-not-found-pages-)

- [page_functions.ts (or `.tsx`, `.js`, `.jsx`)](#page_functionsts-or-tsx-js-jsx)

- [Fetching data with `Suspense`](#fetching-data-with-suspense)

- [Fetching data in the server without `Suspense` (revisited)](#fetching-data-in-the-server-without-suspense-revisited)

- [`page_functions.ts` (revisited)](#page_functionsts-revisited)

- [Server Components](#server-components)

- [Client Components](#client-components)

- [Server Functions](#server-functions)

- [Dynamic Parameters (`params` prop)](#dynamic-parameters-params-prop)

- [Query Parameters (`query` prop)](#query-parameters-query-prop)

- [Navigation between pages (routes)](#navigation-between-pages-routes)

- [Routing System revisited (in depth)](#routing-system-revisited-in-depth)

  - [Base Directory](#base-directory)

  - [Route Types](#route-types)

    - [Static Routes](#static-routes)

    - [Dynamic Routes](#dynamic-routes)

    - [Optional Dynamic Routes](#optional-dynamic-routes)

    - [Catch-All Routes](#catch-all-routes)

    - [Optional Catch-All Routes](#optional-catch-all-routes)

    - [Route Groups](#route-groups)

    - [Parallel Routes (Slots)](#parallel-routes-slots)

  - [Layouts](#layouts)

  - [Not Found Handling](#not-found-handling)

  - [Error Handling](#error-handling)

- [`favicons` folder](#favicons-folder)

- [`.env` file](#env-file)

- [Styles (Tailwind.css, .module.css, and .css)](#styles-tailwindcss-modulecss-and-css)

- [Assets or media files (image, video, and sound)](#assets-or-media-files-image-video-and-sound)

- [Import alias (e.g. `"@/..."`)](#import-alias-eg-)

- [How to run a Dinou app](#how-to-run-a-dinou-app)

- [Eject Dinou](#eject-dinou)

- [🚀 Deployment](#-deployment)

- [📦 Changelog](#-changelog)

- [License](#license)

## Routing system, layouts, pages, not found pages, ...

- Routes are defined by defining a `page.tsx` file (or `.jsx`) in a folder.

- Route "/" corresponds to the `src` folder.

- You can define layouts and nested layouts by defining a `layout.tsx` (or `.jsx`) file in a folder. A layout file found in a folder wraps a layout file found in a more nested folder, and finally composition of all layouts found in a route hierarchy wraps the `page` component or `not_found` component.

- You can define not found pages by defining `not_found.tsx` (or `.jsx`) file in a folder. If more than a `not_found.tsx` file is found in a route hierarchy, the more nested one will be used.

- If you don't want a `page` to be applied layouts define a `no_layout` file (without extension) in the same folder. A `no_layout` file, if present, also applies to the `not_found` file if present in the same folder. There exists also a `no_layout_not_found` file if you don't want a `not_found` file to be applied layouts but you do in `page` component.

- `reset_layout` file (without extension) if present in the same folder as a `layout.tsx` file, will ignore previous layouts in the layout hierarchy.

- If found any `error.tsx` (or `.jsx`) page in the route hierarchy, the more nested one will be rendered in case of error in the page. Layouts are also applied to error pages if no `no_layout` or `no_layout_error` files (without extension) exists in the folder where `error.tsx` is defined.

## page_functions.ts (or `.tsx`, `.js`, `.jsx`)

`page_functions.ts` is a file for defining four diferent possible functions. These are:

- `getProps`: a function to fetch data in the server and pass this data as props to the page component and the root layout (if exists).

  ```typescript
  // src/dynamic/[name]/page_functions.ts
  export async function getProps(
    params: { name: string },
    query: Record<string, string>,
    cookies: Record<string, string>
  ) {
    const data = await new Promise<string>((r) =>
      setTimeout(() => r(`Hello ${params.name}`), 2000)
    );

    return { page: { data }, layout: { title: data } };
  }
  ```

- `getStaticPaths`: function to get the values of a dynamic param in the route for which SSG will be applied. Fetching data in the server with `getProps` or within the body of a Server Component increases the FCP (First Contentful Paint), that is, when the user sees something on the screen, when rendering dynamically, that is, on the fly. So this technique must only be used if acompanied by SSG (Static Site Generation). This means that at build time the data is fetched so when a user requests a page statically generated at build time he/she hasn't to wait for the data to be fetched on the server. This is good for SEO, when data is necessary for SEO.

  ```typescript
  // src/dynamic/[name]/page_functions.ts
  export async function getProps(
    params: { name: string },
    query: Record<string, string>,
    cookies: Record<string, string>
  ) {
    const data = await new Promise<string>((r) =>
      setTimeout(() => r(`Hello ${params.name}`), 2000)
    );

    return { page: { data }, layout: { title: data } };
  }

  export function getStaticPaths() {
    return ["albert", "johan", "roger", "alex"];
  }
  ```

- `dynamic`: this function is for when we want the page to be rendered dynamically, bypassing a possible statically generated file. It must return `true` to render a page dynamically. Otherwise the rendering system will use the statically generated file if exists.

  ```typescript
  export function dynamic() {
    return true;
  }
  ```

- `revalidate`: this function is for when we want to revalidate data fetched in SSG.

  ```typescript
  export function revalidate() {
    return 60000; // ms
  }
  ```

## Fetching data with `Suspense`

- We have already seen that data can be fetched on the server with the `getProps` function or within the body of a Server Component, but this needs to be accompanied of a mechanism of SSG of the page/s to not increase the FCP.

- There is an alternative that do not increase FCP even when rendering dynamically and that is to use `Suspense` for data fetching, either in the server (in a Server Component) and in the client (in a Client Component).

  ```typescript
  // src/posts/post.tsx
  "use client";

  export type PostType = {
    title: string;
    content: string;
  };

  export default function Post({ post }: { post: PostType }) {
    return (
      <>
        <h1>{post.title}</h1>
        <div>{post.content}</div>
      </>
    );
  }
  ```

  ```typescript
  // src/posts/get-post.tsx
  "use server";

  import Post from "./post";
  import type { PostType } from "./post";

  export async function getPost() {
    const post = await new Promise<PostType>((r) =>
      setTimeout(
        () => r({ title: "Post Title", content: "Post content" }),
        1000
      )
    );

    return <Post post={post} />;
  }
  ```

  ```typescript
  // src/posts/page.tsx
  "use client";

  import Suspense from "react-enhanced-suspense";
  import { getPost } from "./get-post";

  export default function Page() {
    return (
      <>
        <Suspense fallback={<div>Loading...</div>} resourceId="get-post">
          {() => getPost()}
        </Suspense>
      </>
    );
  }
  ```

- In Client Components, the `resourceId` prop together with passing a function to the `children` prop of `Suspense` from `react-enhanced-suspense` makes the promise returned by the Server Function stable between re-renders, and it is only reinvoked the Server Function whenever the `resourceId` changes.

- The same can be done with `page.tsx` being a Server Component. In that case we would not use the `resourceId` prop and we will call directly the Server Function:

  ```typescript
  // src/posts/page.tsx
  import Suspense from "react-enhanced-suspense";
  import { getPost } from "./get-post";

  export default async function Page({ data }: { data: string }) {
    return (
      <>
        <Suspense fallback={<div>Loading...</div>}>{getPost()}</Suspense>
      </>
    );
  }
  ```

- `Suspense` from [react-enhanced-suspense](https://www.npmjs.com/package/react-enhanced-suspense) is React's `Suspense` when no extra prop is used.

## Fetching data in the server without `Suspense` (revisited)

This option is useful for SSG (Static Site Generated) pages. **When used with dynamic rendering (no SSG) it increases the FCP (First Contentful Paint), that is, when the user sees something rendered on the page**.

The recommended way to use it is with `page.tsx` being a Client Component and defining a **`page_functions.ts`** with **`getProps`** function defined and exported. The other option is to use a Server Component for `page.tsx` instead of a Client Component and do the fetch in the body of the Server Component (`async` function) or, what is equivalent, use the `getProps` function defined and exported in `page_functions.ts` too.

Pages in **static routes** (e.g. `/some/route`) are statically generated (SSG) if no `dynamic` function returning `true` is defined and exported in a `page_functions.ts`. Therefore, statically generated pages for static routes will be served if no query params are present in the request. **If there are query params pages will be served dynamically**.

Pages in **dynamic routes** (e.g. `/[id]`, or `/[[id]]`, `[...id]`, `[[...id]]`) are statically generated (SSG) if no `dynamic` function returning `true` is defined and exported in a `page_functions.ts`, for those values of the dynamic param returned by function `getStaticPaths` defined and exported in `page_functions.ts`. Again, if **query params** are used in the request of the page, then it will be **rendered dynamically**, affecting the FCP (increasing it). Or those requests using dynamic params not returned by `getStaticPaths` will also be rendered dynamically.

- Example with **optional catch-all dynamic route**:

  ```typescript
  // src/catch-all-optional/[[..names]]/page.tsx
  "use client";

  export default function Page({
    params: { names },
    data,
  }: {
    params: { names: string[] };
    data: string;
  }) {
    return (
      <>
        {names}
        {data}
      </>
    );
  }
  ```

  ```typescript
  // src/catch-all-optional/[[..names]]/page_functions.ts
  export async function getProps(
    params: { names: string[] },
    query: Record<string, string>,
    cookies: Record<string, string>
  ) {
    const data = await new Promise<string>((r) =>
      setTimeout(() => r(`Hello ${params.names.join(",")}`), 2000)
    );

    return { page: { data }, layout: { title: data } };
  }

  export function getStaticPaths() {
    return [["albert"], ["johan"], ["roger"], ["alex"], ["albert", "johan"]];
  }
  ```

  In this case statically generated routes will be `/catch-all-optional`, `/catch-all-optional/albert`, `/catch-all-optional/johan`, `/catch-all-optional/roger`, `/catch-all-optional/alex`, and `/catch-all-optional/albert/johan`. Any other route starting by `/catch-all-optional/*` will be rendered dynamically, increasing the FCP by 2 secs (2000 ms) in this particular case.

  The same example works with `page.tsx` being a Server Component.

- Example with **catch-all dynamic route**:

  ```typescript
  // src/catch-all/[...names]/page.tsx
  "use client";

  export default function Page({
    params: { names },
    data,
  }: {
    params: { names: string[] };
    data: string;
  }) {
    return (
      <>
        {names}
        {data}
      </>
    );
  }
  ```

  ```typescript
  // src/catch-all/[...names]/page_functions.ts
  export async function getProps(
    params: { names: string[] },
    query: Record<string, string>,
    cookies: Record<string, string>
  ) {
    const data = await new Promise<string>((r) =>
      setTimeout(() => r(`Hello ${params.names.join(",")}`), 2000)
    );

    return { page: { data }, layout: { title: data } };
  }

  export function getStaticPaths() {
    return [["albert"], ["johan"], ["roger"], ["alex"], ["albert", "johan"]];
  }
  ```

  In this case statically generated routes will be `/catch-all/albert`, `/catch-all/johan`, `/catch-all/roger`, `/catch-all/alex`, and `/catch-all/albert/johan`. `/catch-all` will render `not_found.tsx` page (the more nested one existing in the route hierarchy) if no `page.tsx` is defined in this route. Any other route starting by `/catch-all/*` will be rendered dynamically, increasing the FCP by 2 secs (2000 ms) in this particular case.

  The same example works with `page.tsx` being a Server Component.

- Example with **optional dynamic route**:

  ```typescript
  // src/optional/[[name]]/page.tsx
  "use client";

  export default function Page({
    params: { name },
    data,
  }: {
    params: { name: string };
    data: string;
  }) {
    return (
      <>
        {name}
        {data}
      </>
    );
  }
  ```

  ```typescript
  // src/optional/[[name]]/page_functions.ts
  export async function getProps(
    params: { name: string },
    query: Record<string, string>,
    cookies: Record<string, string>
  ) {
    const data = await new Promise<string>((r) =>
      setTimeout(() => r(`Hello ${params.name ?? ""}`), 2000)
    );

    return { page: { data }, layout: { title: data } };
  }

  export function getStaticPaths() {
    return ["albert", "johan", "roger", "alex"];
  }
  ```

  In this case statically generated routes will be `/optional`, `/optional/albert`, `/optional/johan`, `/optional/roger`, and `/optional/alex`. Any other route as `/optional/other-name` will be rendered dynamically, increasing the FCP by 2 secs (2000 ms) in this particular case.

  The same example works with `page.tsx` being a Server Component.

- Example with **dynamic route**:

  ```typescript
  // src/dynamic/[name]/page.tsx
  "use client";

  export default function Page({
    params: { name },
    data,
  }: {
    params: { name: string };
    data: string;
  }) {
    return (
      <>
        {name}
        {data}
      </>
    );
  }
  ```

  ```typescript
  // src/dynamic/[name]/page_functions.ts
  export async function getProps(
    params: { name: string },
    query: Record<string, string>,
    cookies: Record<string, string>
  ) {
    const data = await new Promise<string>((r) =>
      setTimeout(() => r(`Hello ${params.name}`), 2000)
    );

    return { page: { data }, layout: { title: data } };
  }

  export function getStaticPaths() {
    return ["albert", "johan", "roger", "alex"];
  }
  ```

  In this case statically generated routes will be `/dynamic/albert`, `/dynamic/johan`, `/dynamic/roger`, and `/dynamic/alex`. `/dynamic` will render `not_found.tsx` page (the more nested one existing in the route hierarchy) if no `page.tsx` is defined in this route. Any other route as `/dynamic/other-name` will be rendered dynamically, increasing the FCP by 2 secs (2000 ms) in this particular case.

  The same example works with `page.tsx` being a Server Component.

- Example with **static route**:

  ```typescript
  // src/static/page.tsx
  "use client";

  export default function Page({ data }: { data: string }) {
    return <>{data}</>;
  }
  ```

  ```typescript
  // src/static/page_functions.ts
  export async function getProps(
    params: Record<string, string>,
    query: Record<string, string>,
    cookies: Record<string, string>
  ) {
    const data = await new Promise<string>((r) =>
      setTimeout(() => r(`data`), 2000)
    );

    return { page: { data }, layout: { title: data } };
  }
  ```

  In this case the static generated route will be `/static`. If query params are passed to the route (e.g. `/static?some-param`) the route will be rendered dynamically, increasing the FCP by 2 secs (2000 ms) in this particular case.

  The same example works with `page.tsx` being a Server Component.

## `page_functions.ts` (revisited)

The framework supports a `page_functions.ts` (or `.tsx`, `.jsx`, `.js`) file in any route directory to define route-specific logic, such as static path generation, dynamic rendering control, revalidation of fetched data in SSG, and custom page and root layout props.

- Supported Functions:

  - **`getStaticPaths`**: Defines static paths for dynamic routes during SSG.

  - **`getProps`**: This is where you can fetch your data. Fetches or computes additional props for a page or root layout.

  - **`dynamic`**: Controls whether a route is dynamically rendered (bypassing SSG).

  - **`revalidate`**: Specifies a time in ms for when we want to revalidate data fetched during SSG.

- Example:

  ```typescript
  // src/blog/[id]/page_functions.tsx
  export function getStaticPaths() {
    // Return an array of possible 'id' values for SSG
    return ["1", "2", "3"];
  }

  export async function getProps(
    params: { id: string },
    query: Record<string, string>,
    cookies: Record<string, string>
  ) {
    // Fetch data based on the 'id' parameter
    const post = await fetch(`https://api.example.com/posts/${params.id}`).then(
      (res) => res.json()
    );
    return { page: { post }, layout: { title: post.title } };
  }

  export function dynamic() {
    // Force dynamic rendering (skip SSG) if needed
    return false; // Set to true to bypass SSG
  }

  export function revalidate() {
    return 60000;
  }
  ```

- How It Works:

  - `getStaticPaths`: Used for dynamic routes (`[id]`), optional dynamic routes (`[[id]]`), catch-all routes (`[...slug]`), or optional catch-all routes (`[[...slug]]`). The returned paths are pre-rendered during SSG.

  - `getProps`: The returned props are merged with `params` and `query` and passed to the `page.tsx` component. The same for the root layout (if exists).

  - `dynamic`: If `dynamic() { return true; }`, the route is rendered dynamically at request time, bypassing SSG.

  - `revalidate`: The returned time by this function marks when a statically generated page will be regenerated in the background (ISR or Incremental Static Regeneration).

- Usage in a page:

  ```typescript
  // src/blog/[id]/page.tsx
  "use client";

  export default function Page({
    params,
    post,
  }: {
    params: { id: string };
    post: { title: string; content: string };
  }) {
    return (
      <div>
        <h1>{post.title}</h1>
        <p>{post.content}</p>
      </div>
    );
  }
  ```

- Usage in root layout (the first layout in the route hierarchy):

  ```typescript
  "use client";

  import type { ReactNode } from "react";

  export default function Layout({
    children,
    sidebar,
    title,
  }: {
    children: ReactNode;
    sidebar: ReactNode;
    title: string;
  }) {
    return (
      <html lang="en">
        <head>
          <title>{title ?? "react 19 app"}</title>
        </head>
        <body>
          {sidebar}
          {children}
        </body>
      </html>
    );
  }
  ```

## Server Components

- Server Components in this implementation are distinguished by the fact they are `async` functions. So when defining them, **make them `async` always**, whether or not they use `await` in their definition or function body. This is necessary for the framework to know they are Server Components and execute them.

## Client Components

- Client Components need to have the directive `"use client";` at the top of the file if they are not imported in other Client Components. That's the case of pages for example, that they are not imported directly in another Client Component. So when defining pages as Client Components **remember to use the directive `"use client";`**. The same applies for layouts, not found pages and error pages. In general, to avoid surprises, is a good practice to put the directive `"use client";` in all Client Components.

## Server Functions

- Server Functions are functions executed in the server. To define a Server Function use the directive `"use server";` at the top of the file where you define the Server Function. **Server Functions** can be invoked from either a Server Component or a Client Component and **can return Client Components**.

- You can access the `req` and `res` objects from express in the Server Function by adding an extra parameter in the definition, the last one:

```typescript
"use server";

export async function doSomething(myParam, { req, res }) {
  // ...
}
```

- In the previous example, the Server Function should be called only with `myParam` as argument. The last argument with references to `req` and `res` from `express` is added by Dinou.

## Dynamic Parameters (`params` prop)

- Components (`page.tsx`, `layout.tsx`, and `not_found.tsx`) receive a `params` prop that contains **dynamic parameters** (from the route, e.g., `{ id: "123" }` for `/blog/[id]`).

- Examples:

  - For `/blog/[id]/page.tsx`, accessing `/blog/123` passes `{ params: { id: "123" } }`.

  - For `/wiki/[...slug]/page.tsx`, accessing `/wiki/a/b` passes `{ params: { slug: ["a", "b"] } }`.

  - For `/blog/[[category]]/page.tsx`, accessing `/blog` passes `{ params: { category: undefined } }`, and `/blog/tech` passes `{ params: { category: "tech" } }`.

  - For `/wiki/[[...slug]]/page.tsx`, accessing `/wiki` passes `{ params: { slug: [] } }`, and `/wiki/a/b` passes `{ params: { slug: ["a", "b"] } }`.

## Query Parameters (`query` prop)

- Components (`page.tsx`, `layout.tsx`, and `not_found.tsx`) receive a `query` prop that contains **query parameters** from the URL (e.g., `{query: { category: "tech" }}` for `?category=tech`).

- Examples:

  - For `/blog/[id]/page.tsx`, accessing `/blog/123?category=tech` passes `{ query: { category: "tech" }, params: {id: 123} }`. <!--In SSG, it passes `{ query: {} }`.>

  - For `/search/page.tsx`, accessing `/search?term=react&page=2` passes `{ query: { term: "react", page: "2" }, params: {} }`. <!--In SSG, it passes `{ query: {} }`.>

  - For `/blog/[[category]]/page.tsx`, accessing `/blog/tech?sort=asc` passes `{ params: { category: "tech" }, query: { sort: "asc" } }`. <!--In SSG, it passes `{ params: { category: "tech" }, query: {} }`.>

  - For `/wiki/[...slug]/page.tsx`, accessing `/wiki/a/b?lang=en` passes `{ params: { slug: ["a", "b"] }, query: { lang: "en" } }`.<!-- In SSG, it passes `{ params: { slug: ["a", "b"] }, query: {} }`.>

  - For `/search/page.tsx`, accessing `/search` passes `{ query: {}, params: {} }`.

- **Example Usage**:

  ```typescript
  // src/blog/[id]/page.tsx
  "use client";

  export default function Page({
    params,
    query,
  }: {
    params: { id: string };
    query: { category: string | undefined; sort: string | undefined };
  }) {
    return (
      <div>
        <h1>Blog ID: {params.id}</h1>
        <h2>Category: {query.category ?? "none"}</h2>
        <p>Sort Order: {query.sort ?? "default"}</p>
      </div>
    );
  }
  ```

## Navigation between pages (routes)

- To navigate programmatically between pages you do:

  ```typescript
  // src/route/page.tsx
  "use client";

  export default function Page() {
    const handleNavigate = () => {
      window.location.assign("/route-2?foo=bar");
    };

    return (
      <div>
        <button onClick={handleNavigate}>Go to /route-2</button>
      </div>
    );
  }
  ```

- Use anchor tags to allow the user navigate between pages:

  ```typescript
  // src/page.tsx
  export default async function Page() {
    return (
      <>
        <a href="/route-1?foo=bar">go to route-1</a>
      </>
    );
  }
  ```

## Routing System revisited (in depth)

The routing system is file-based and supports static routes, dynamic routes, optional dynamic routes, catch-all routes, optional catch-all routes, route groups, and parallel routes (slots).

### Base Directory

- All routes are resolved relative to the `src/` directory.

- A route is defined by a `page.tsx` (or `.jsx`) file in a directory.

- Layouts are defined by `layout.tsx` (or `.jsx`) files, which wrap the content of pages or nested layouts.

- Not found pages are defined by `not_found.tsx` (or `.jsx`) files.

- Slots are defined by folders starting with `@` (e.g., `@sidebar`), containing a `page.tsx` file.

### Route Types

- #### Static Routes

  - Defined by a directory structure with a `page.tsx` file.

  - Examples:

    - `src/page.tsx` → "/"

    - `src/about/page.tsx` → "/about" (or "/about/")

    - `src/blog/post/page.tsx` → "/blog/post" (or "/blog/post/")

  - The `page.tsx` file in each directory defines the content for that route.

- #### Dynamic Routes

  - Defined by directories named with square brackets, e.g., `[param]`.

  - The parameter value is extracted from the URL and passed to the page component as `params[param]`.

  - Example:

    - `src/blog/[id]/page.tsx` → "/blog/:id"

    - Accessing `/blog/123` passes `{params: { id: "123" }}` to the `page.tsx` component.

  - Requires a `page.tsx` file in the dynamic directory.

- #### Optional Dynamic Routes

  - Defined by directories named `[[param]]`.

  - Matches a single segment or no segment at all.

  - Example:

    - `src/blog/[[category]]/page.tsx` → "/blog" or "/blog/:category"

    - Accessing `/blog` passes `{params: { category: undefined }}`.

    - Accessing `/blog/tech` passes `{params: { category: "tech" }}`.

- #### Catch-All Routes

  - Defined by directories named `[...param]`.

  - Captures all remaining URL segments as an array in `params[param]`.

  - Example:

    - `src/wiki/[...slug]/page.tsx` → "/wiki/\*"

    - Accessing `/wiki/a/b/c` passes `{params: { slug: ["a", "b", "c"] }}`.

  - Useful for handling arbitrary nested paths.

- #### Optional Catch-All Routes

  - Defined by directories named `[[...param]]`.

  - Similar to catch-all routes but also matches the parent route (i.e., when no segments are provided).

  - Example:

    - `src/wiki/[[...slug]]/page.tsx` → "/wiki" or "/wiki/\*"

    - Accessing `/wiki` passes `{params: { slug: [] }}`.

    - Accessing `/wiki/a/b` passes `{params: { slug: ["a", "b"] }}`.

  - Provides flexibility for routes that may or may not have additional segments.

- #### Route Groups

  - Defined by directories named with parentheses, e.g., `(group)`.

  - Used to organize routes without affecting the URL structure.

  - Example:

    - `src/(auth)/login/page.tsx` → "/login"

    - `src/(auth)/signup/page.tsx` → "/signup"

    - The `(auth)` directory is ignored in the URL, so both routes are at the root level.

  - Useful for grouping related routes (e.g., authentication-related pages) without adding a URL prefix.

- #### Parallel Routes (Slots)

  - Defined by directories starting with `@`, e.g., `@sidebar`.

  - Slots are injected into **layouts** as props, allowing parallel content rendering.

  - Example:

    - `src/@sidebar/page.tsx`

    - `src/page.tsx`

    - `src/layout.tsx`

    - The `@sidebar/page.tsx` content is passed to the `layout.tsx` as `props.sidebar`.

    - In `layout.tsx`, you can render the slot like: `{props.sidebar}`.

  - Example in code:

    ```typescript
    "use client";

    import type { ReactNode } from "react";

    export default function Layout({
      children,
      sidebar,
    }: {
      children: ReactNode;
      sidebar: ReactNode;
    }) {
      return (
        <html lang="en">
          <head>
            <title>Dinou app</title>
          </head>
          <body>
            {sidebar}
            {children}
          </body>
        </html>
      );
    }
    ```

  - Slots can be used to render sidebars, headers, or other parallel content.

### Layouts

- Layouts are defined by `layout.tsx` files in the route hierarchy.

- They wrap the content of pages or nested layouts, receiving children (the page or nested layout) and any slots as props.

- Example:

  - `src/layout.tsx`

  - `src/page.tsx`

  - The `layout.tsx` wraps the `page.tsx` content for the "/" route.

- Nested layouts are supported:

  - `src/layout.tsx`

  - `src/blog/layout.tsx`

  - `src/blog/post/page.tsx`

  - For "/blog/post", the `src/layout.tsx` wraps the `src/blog/layout.tsx`, which wraps the `page.tsx` content.

- If a **`no_layout`** file exists in a directory (**without extension**), the layout hierarchy is skipped, and only the page content is rendered.

- If a **`reset_layout`** file (**without extension**) exists in a directory where a `layout.tsx` file is defined, previous layouts in the hierarchy will be ignored.

### Not Found Handling

- If no `page.tsx` is found for a route, the system looks for a `not_found.tsx` file in the route hierarchy.

- Example:

  - `src/not_found.tsx`

  - If "/invalid/route" is accessed and no matching `page.tsx` is found, the `not_found.tsx` component is rendered.

- If no `not_found.tsx` exists, a default "Page not found" message is returned.

- Layouts are applied to `not_found.tsx` pages too, unless a `no_layout` or **`no_layout_not_found`** files (**without extension**) are found in the directory in which the `not_found.tsx` page is defined, in which case layouts will not be applied to `not_found.tsx` page.

### Error Handling

- In case of error in a page, the more nested `error.tsx` (or `.jsx`) page will rendered if exists. **If it does not exist, then in production the error will be written in the console, and in development a default error page will be rendered informing about the error message and the error stack**.

- Layouts are applied to `error.tsx` pages, if no `no_layout` or `no_layout_error` files (without extension) exists in the folder where `error.tsx` is defined.

- `error.tsx` pages are **dynamically rendered**, so avoid using server components (async functions) and fetching data in their body definition because this will delay the rendering of the page. Use `Suspense` instead if you need to fetch data.

- There not exists a `error_functions.ts` functionality, so there is no `getProps` for error pages. Again, if you need to fetch data use `Suspense`.

- The error page receives `params`, `query`, and `error`. `error` is an object with properties `message` and `stack` which are strings.

- Example:

  ```typescript
  "use client";

  export default function Page({
    error: { message, stack },
  }: {
    error: Error;
  }) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-3xl font-bold text-red-600">Error</h1>
          <p className="text-lg text-gray-700">
            An unexpected error has occurred. Please try again later.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </a>
        </div>
        <div className="mt-6 text-sm text-gray-500">
          <pre className="whitespace-pre-wrap break-words">{message}</pre>
          <pre className="whitespace-pre-wrap break-words">{stack}</pre>
        </div>
      </main>
    );
  }
  ```

## `favicons` folder

If you want to show a favicon, generate one with an online tool (e.g. [favicon.io](https://favicon.io/)), unzip the downloaded folder with the favicons, paste it in the root of the project and rename it to `favicons`. Then update your `layout` or `page` to include this in the `head` tag:

```typescript
"use client";

import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Dinou app</title>
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
        <link rel="manifest" href="/site.webmanifest"></link>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

Then you will have your favicon in your web app.

## `.env` file

Dinou is ready to manage env vars in the code that runs on the Server side (Server Functions, Server Components, and `getProps` function). Create an `.env` file in your project (and add it to your `.gitignore` file to not expose sensitive data to the public) and define there your env variables:

```bash
# .env
# define here your env vars
MY_VAR=my_value
```

## Styles (Tailwind.css, .module.css, and .css)

Dinou is ready to use Tailwind.css, `.module.css`, and `.css` styles. All styles will be generated in a file in `public` folder named `styles.css`. So you must include this in your `page.tsx` or `layout.tsx` file, in the `head` tag:

```typescript
<link href="/styles.css" rel="stylesheet"></link>
```

- Example with Client Components (is the same for Server Components):

  ```typescript
  // src/layout.tsx
  "use client";

  import type { ReactNode } from "react";
  import "./globals.css";

  export default function Layout({ children }: { children: ReactNode }) {
    return (
      <html lang="en">
        <head>
          <title>Dinou app</title>
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
          <link rel="manifest" href="/site.webmanifest"></link>
          <link href="/styles.css" rel="stylesheet"></link>
        </head>
        <body>{children}</body>
      </html>
    );
  }
  ```

  ```css
  /* src/globals.css */
  @import "tailwindcss";

  .test1 {
    background-color: purple;
  }
  ```

  ```typescript
  // src/page.tsx
  "use client";

  import styles from "./page.module.css";

  export default function Page() {
    return (
      <div className={`text-red-500 test1 ${styles.test2}`}>hi world!</div>
    );
  }
  ```

  ```css
  /* src/page.module.css */
  .test2 {
    text-decoration: underline;
  }
  ```

  ```typescript
  // src/css.d.ts
  declare module "*.module.css" {
    const classes: { [key: string]: string };
    export default classes;
  }
  ```

- The above will produce the text `hi world!` in red, underlined, and with a purple background color.

## Assets or media files (image, video, and sound)

Dinou supports the use of assets in your components. Supported file extensions are: `.png`, `.jpeg`, `.jpg`, `.gif`, `.svg`, `.webp`, `.avif`, `.ico`, `.mp4`, `.webm`, `.ogg`, `.mov`, `.avi`, `.mkv`, `.mp3`, `.wav`, `.flac`, `.m4a`, `.aac`, `.mjpeg`, and `.mjpg`.

To use an asset in your component just import it as a default import:

```typescript
// src/component.tsx
"use client";

import image from "./image.png"; // import the image from where it is located (inside src folder)

export default function Component() {
  return <img src={image} alt="image" />;
}
```

Works the same for Server Components.

For typescript, you should create a declaration file like this:

```typescript
// src/assets.d.ts
declare module "*.jpeg" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.png" {
  const value: string;
  export default value;
}

// and continue with the rest of supported file extensions
```

If you miss a certain file extension you can eject and customize Dinou to meet your requirements. Just eject and add the extension in this place: `dinou/core/asset-extensions.js`. Just look for the place were all the extensions are mentioned and add yours in this file.

## Import alias (e.g. `"@/..."`)

Dinou is ready to support import alias, as `import some from "@/..."`. If you want to use them just define the options in `tsconfig.json`:

```json
// tsconfig.json for a js project
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "allowJs": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

```json
// tsconfig.json for a ts project
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

## How to run a Dinou app

Run `npm run dev` (or `npx dinou dev`) to start the Dinou app in development mode. Wait for the logs of the bundler (`waiting for changes...`) and the server (`Listening on port 3000`) to load the page on your browser. In development, the bundler will emit its files in `public` folder.

Run `npm run build` (or `npx dinou build`) to build the app and `npm start` (or `npx dinou start`) to run it. In production, the bundler will emit its files in `dist3` folder.

## Eject Dinou

- You can eject Dinou with the command `npm run eject` (or `npx dinou eject`). This will copy the files defining Dinou in the root folder of the project (grouped in a `dinou` folder). You will have full control and customization capabilities.

## 🚀 Deployment

Projects built with **Dinou** can be deployed to any platform that supports Node.js with custom flags.

### ✅ Recommended: DigitalOcean App Platform

Dinou works seamlessly on [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform). You can deploy your project easily without needing any special configuration.

**Why it works well:**

- Full control over the Node.js runtime

- Supports the required `--conditions react-server` flag

- Simple integration via GitHub/GitLab or manual repo

### ❌ Not supported: Netlify

At the moment, **Netlify is not compatible with Dinou, because it does not allow passing the `--conditions react-server` flag when starting a Node.js app**. This flag is essential for the app to work.

If Netlify adds support for custom runtime flags in the future, Dinou compatibility might become possible.

### 🛠 Other Platforms

If you're deploying on other Node.js-compatible platforms (like Render, Fly.io, Railway, etc.), ensure that:

- You can pass custom flags (`--conditions react-server`) to Node.js

## 📦 Changelog

For a detailed list of changes, enhancements, and bug fixes across versions, see the [CHANGELOG.md](./CHANGELOG.md).

## License

Dinou is licensed under the [MIT License](https://github.com/roggc/dinou/blob/master/LICENSE.md).
````
