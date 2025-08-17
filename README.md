# **dinou**: **A Minimal React 19 Framework**

[**dinou**](https://dinou.dev) is a **minimal React 19 framework**. dinou means 19 in Catalan. You can create a dinou [app](https://github.com/roggc/dinou-app) by running the command **`npx create-dinou@latest my-app`**.

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

- Run `npm run dev` (or `npx dinou dev`) to see the page in action in your browser.

- If you run `npm run eject` (or `npx dinou eject`), dinou will be ejected and copied to your root project folder, so you can customize it.

dinou main features are:

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

- Error handling with `error.tsx` pages, differentiationg behaviour in production and in development.

## Table of contents

- [Routing system, layouts, pages, not found pages, ...](#routing-system-layouts-pages-not-found-pages-)

- [page_functions.ts (or `.tsx`, `.js`, `.jsx`)](#page_functionsts-or-tsx-js-jsx)

- [Fetching data with `Suspense`](#fetching-data-with-suspense)

- [Fetching data in the server without `Suspense` (revisited)](#fetching-data-in-the-server-without-suspense-revisited)

- [`page_functions.ts` (revisited)](#page_functionsts-revisited)

- [Server Components](#server-components)

- [Client Components](#client-components)

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

- [How to run a dinou app](#how-to-run-a-dinou-app)

- [Eject dinou](#eject-dinou)

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

  export async function getProps(params: { name: string }) {
    const data = await new Promise<string>((r) =>
      setTimeout(() => r(`Hello ${params.name}`), 2000)
    );

    return { page: { data }, layout: { title: data } };
  }
  ```

- `getStaticPaths`: function to get the values of a dynamic param in the route for which SSG will be applied. Fetching data in the server with `getProps` or within the body of a Server Component increases the FCP (First Contentful Paint), that is, when the user sees something on the screen, when rendering dynamically, that is, on the fly. So this technique must only be used if acompanied by SSG (Static Site Generation). This means that at build time the data is fetched so when a user requests a page statically generated at build time he/she hasn't to wait for the data to be fetched on the server. This is good for SEO, when data is necessary for SEO.

  ```typescript
  // src/dynamic/[name]/page_functions.ts

  export async function getProps(params: { name: string }) {
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

- There is an alternative that do not increase FCP even when rendering dynamically and that is to use `Suspense` for data fetching, either in the server and in the client.

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

  import { Suspense } from "react";
  import { getPost } from "./get-post";
  import Post from "./post";
  import type { PostType } from "./post";

  export default function Page({ data }: { data: string }) {
    const getPost2 = async () => {
      const post = await new Promise<PostType>((r) =>
        setTimeout(
          () => r({ title: "Post Title2", content: "Post content2" }),
          1000
        )
      );

      return <Post post={post} />;
    };

    return (
      <>
        <Suspense fallback={<div>Loading...</div>}>{getPost()}</Suspense>
        <Suspense fallback={<div>Loading2...</div>}>{getPost2()}</Suspense>
      </>
    );
  }
  ```

- The same can be done with `page.tsx` being a Server Component.

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

  export async function getProps(params: { names: string[] }) {
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

  export async function getProps(params: { names: string[] }) {
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

  export async function getProps(params: { name: string }) {
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

  export async function getProps(params: { name: string }) {
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

  export async function getProps() {
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

  export async function getProps(params: { id: string }) {
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

- Client components need to have the directive `"use client";` at the top of the file if they are not imported in other client components. That's the case of pages for example, that they are not imported directly in another client component. So when defining pages as client components **remember to use the directive `"use client";`**. The same applies for layouts, not found pages and error pages. In general, to avoid surprises, is a good practice to put the directive `"use client";` in all client components.

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
            <title>dinou app</title>
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
        <title>dinou app</title>
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

dinou is ready to manage env vars in the code that runs on the Server side (Server Functions, Server Components, and `getProps` function). Create an `.env` file in your project (and add it to your `.gitignore` file to not expose sensitive data to the public) and define there your env variables:

```bash
# .env
# define here your env vars
MY_VAR=my_value
```

## Styles (Tailwind.css, .module.css, and .css)

dinou is ready to use Tailwind.css, `.module.css`, and `.css` styles. All styles will be generated in a file in `public` folder named `styles.css`. So you must include this in your `page.tsx` or `layout.tsx` file, in the `head` tag:

```typescript
<link href="/styles.css" rel="stylesheet"></link>
```

- Example with client components:

  ```typescript
  // src/layout.tsx
  "use client";

  import type { ReactNode } from "react";
  import "./global.css";

  export default function Layout({ children }: { children: ReactNode }) {
    return (
      <html lang="en">
        <head>
          <title>dinou app</title>
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
  /* global.css */
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

- **Only styles imported under `"use client"` directive will be detected by dinou and generated in a `styles.css` in `public` folder**. This means that if you want to use server components instead of client components, then you must create an additional file (e.g. `styles.ts`) where you use the `"use client"` directive and import all the `.css` files used in server components.

- Example with server components:

  ```typescript
  // src/layout.tsx
  import type { ReactNode } from "react";

  export default async function Layout({ children }: { children: ReactNode }) {
    return (
      <html lang="en">
        <head>
          <title>dinou app</title>
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
  /* global.css */
  @import "tailwindcss";

  .test1 {
    background-color: purple;
  }
  ```

  ```typescript
  // src/page.tsx
  import styles from "./page.module.css";

  export default async function Page() {
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

  ```typescript
  // src/styles.ts
  "use client"; // <-- This is key.
  import "./global.css";
  import "./page.module.css";
  ```

## Assets or media files (image, video, and sound)

dinou supports the use of assets in your components. Supported file extensions are: `.png`, `.jpeg`, `.jpg`, `.gif`, `.svg`, `.webp`, `.avif`, `.ico`, `.mp4`, `.webm`, `.ogg`, `.mov`, `.avi`, `.mkv`, `.mp3`, `.wav`, `.flac`, `.m4a`, `.aac`, `.mjpeg`, and `.mjpg`.

To use an asset in your component just import it as a default import:

```typescript
// src/component.tsx
"use client";

import image from "./image.png"; // import the image from where it is located (inside src folder)

export default function Component() {
  return <img src={image} alt="image" />;
}
```

**Only assets imported under `"use client"` directive will be detected by dinou and generated in `public` folder**. If you use **server components**, then you must create an additional file (e.g. `assets.ts`) with the `"use client"` directive and import there the assets too:

```typescript
// src/assets.ts
"use client";

import "./image.png";
```

```typescript
// src/component.tsx
import image from "./image.png"; // import the image from where it is located (inside src folder)

export default async function Component() {
  return <img src={image} alt="image" />;
}
```

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

If you miss a certain file extension you can eject and customize dinou to meet your requirements. Just eject and add the extension in these three places: `rollup.config.js`, `dinou/server.js`, and `dinou/render-html.js`. Just look for the place were all the extensions are mentioned and add yours in these three files.

## Import alias (e.g. `"@/..."`)

dinou is ready to support import alias, as `import some from "@/..."`. If you want to use them just define the options in `tsconfig.json` or `jsconfig.json`:

```json
// tsconfig.json
{
  "compilerOptions": {
    // other options
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"]
  // other configuration fields
}
```

```json
// jsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

## How to run a dinou app

Run `npm run dev` (or `npx dinou dev`) to start the dinou app in development mode. Wait for the logs of the bundler (`waiting for changes...`) and the server (`Listening on port <port>`) to load the page on your browser. In development, the bundler will emit its files in `public` folder.

Run `npm run build` (or `npx dinou build`) to build the app and `npm start` (or `npx dinou start`) to run it. In production, the bundler will emit its files in `dist3` folder.

## Eject dinou

- You can eject dinou with the command `npm run eject` (or `npx dinou eject`). This will copy the files defining dinou in the root folder of the project (grouped in a `dinou` folder). You will have full control and customization capabilities.

## 🚀 Deployment

Projects built with **dinou** can be deployed to any platform that supports Node.js with custom flags.

### ✅ Recommended: DigitalOcean App Platform

dinou works seamlessly on [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform). You can deploy your project easily without needing any special configuration.

**Why it works well:**

- Full control over the Node.js runtime

- Supports the required `--conditions react-server` flag

- Simple integration via GitHub/GitLab or manual repo

### ❌ Not supported: Netlify

At the moment, **Netlify is not compatible with dinou, because it does not allow passing the `--conditions react-server` flag when starting a Node.js app**. This flag is essential for the app to work.

If Netlify adds support for custom runtime flags in the future, dinou compatibility might become possible.

### 🛠 Other Platforms

If you're deploying on other Node.js-compatible platforms (like Render, Fly.io, Railway, etc.), ensure that:

- You can pass custom flags (`--conditions react-server`) to Node.js

## 📦 Changelog

For a detailed list of changes, enhancements, and bug fixes across versions, see the [CHANGELOG.md](./CHANGELOG.md).

## License

dinou is licensed under the [MIT License](https://github.com/roggc/dinou/blob/master/LICENSE.md).
