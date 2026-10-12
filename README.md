# **Dinou**

[![Documentation](https://img.shields.io/badge/docs-dinou.dev-blue?style=flat-square)](https://dinou.dev) [![Version](https://img.shields.io/badge/version-7.0.0-orange?style=flat-square)](https://www.npmjs.com/package/dinou)

### **Full-Stack React 19 Framework**

---

The ejectable React 19 framework built on web standards. Build full-stack applications with native React Server Components (RSC), progressive streaming SSR, compile-time type-safe routing, dual-dimensional caching, and universal multi-platform deployment (Node.js, Bun, Deno, Cloudflare Workers, Netlify, and pure static hosts) with zero vendor lock-in.

## Key Features

- **Native React 19 RSC & Progressive Web Streams:** Render database queries, markdown parsers, and heavy backend dependencies exclusively on the server with 0kb client JavaScript overhead. Dinou streams progressive React Flight wire payloads and HTML over standard W3C Web Streams (`renderToReadableStream`) directly into the DOM with instant shell flushing.
- **Universal 3-Pass In-Memory Dual-Bundle Engine (Zero-Fork):** Solves React 19's conflicting module conditions (`"react-server"` vs. `"browser"`) within a single in-process pipeline via standard W3C Web Streams. Completely eliminates `child_process.fork()` and inter-process serialization latency, delivering an **82% memory reduction** (~22 MB flat idle footprint) and enabling native execution on edge isolates.
- **Compile-Time Type-Safe Routing:** Bidirectional type safety with zero runtime bundle overhead. Generates route definitions in real time: autocompletes and validates `<Link href="...">` and `useRouter().push(...)`, while strictly typing route parameters with `PageProps<T>`, `LayoutProps<T>`, `RouteParams<T>`, and `ErrorProps<T>`.
- **Persistent Nested Layouts & Zero-Remount:** Folders in `src/` map directly to URLs with nested `layout.tsx` files that wrap child pages without remounting during navigation, preserving client state, form inputs, audio playback, and scroll positions. Layouts feature independent data and cache lifecycles (`layout_functions.ts`).
- **Dual-Dimensional Caching (Horizontal & Vertical):**
  - *Horizontal (Route-Level):* Static Site Generation (`revalidate = false`), strict seconds-based Incremental Static Regeneration (`revalidate = N`), and dynamic on-demand Server-Side Rendering (`revalidate = 0`).
  - *Vertical (Component-Level):* Micro-ISR via `<DinouCacheSlot>` to embed high-frequency reactive sections with micro-revalidation intervals (e.g., 5s) inside long-lived static shells, refreshable independently from the client (`refreshSlot`) or purged globally by tag (`revalidateTag`).
- **Partial Prerendering (PPR):** Unifies instant static edge delivery with dynamic personalization in a single request. Serves an edge-cached static shell in under 20ms while personalized `<Suspense>` holes concurrently stream over a single HTTP connection.
- **Server Functions & Direct Suspense Streaming ("Dinou Pattern"):** Asynchronous functions marked with `"use server"` can be called directly from Client Components (`"use client"`) wrapped inside `<Suspense>` boundaries. They can return rendered React components over Flight RPC, eliminating synthetic REST/GraphQL API boilerplate.
- **Bundler Agnostic with 100% Feature Parity:** Pre-configured, zero-config pipelines for **esbuild** (sub-millisecond dev server & HMR), **Rollup** (pristine ES module output for Cloudflare Workers & Edge), and **Webpack** (React Compiler and legacy npm compatibility) with identical dual-bundle output.
- **Universal Multi-Platform Deployment:** Build once with React 19 and deploy the exact same application code to Node.js, Bun (standalone single-binary `bun build --compile`), Deno (native single-file binaries `deno compile`), Cloudflare Workers (native workerd + Cloudflare KV for ISR), Netlify, or pure static exports.
- **Universal W3C Web Middleware (`onRequest`):** Intercept requests and high-frequency webhooks (Stripe, Clerk, GitHub) at the HTTP layer in `dinou.config.mjs` returning native Web `Response` objects in <2ms, completely bypassing React component rendering.
- **Hardened State-Preserving Fast Refresh:** Under 5ms HMR powered by Rust (`@swc/core`) and WebSockets that patches updates into running applications while preserving active form inputs, counters, and component state across edits.
- **100% Ejectable & AI-Friendly Architecture:** Run `npx dinou eject` (or `npm run eject`) at any time to extract Dinou's complete compiler, server runtime, and React 19 flight pipeline directly into your project. Transparent, web standards-based, and free of proprietary black-box macros for seamless AI pair programming.

## Table of contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick Start (CLI)](#quick-start-cli)
  - [Manual Setup](#manual-setup)
    - [1. Install Dependencies](#1-install-dependencies)
    - [2. Project Structure & Files](#2-project-structure--files)
    - [3. TypeScript Configuration](#3-typescript-configuration)
    - [4. Package Scripts](#4-package-scripts)
    - [5. Configure .gitignore](#5-configure-gitignore)
    - [6. Start Development Server](#6-start-development-server)
  - [Building for Production & Target Runtimes](#building-for-production--target-runtimes)
    - [Bundler Flexibility (esbuild, Rollup, Webpack)](#bundler-flexibility-esbuild-rollup-webpack)
    - [First-Class Multi-Runtime Targets](#first-class-multi-runtime-targets)
- [Routing & Layouts](#routing--layouts)
  - [1. Overview & Directory Conventions](#1-overview--directory-conventions)
    - [1.1. Core File Conventions](#11-core-file-conventions)
    - [1.2. In-Memory Route Resolution](#12-in-memory-route-resolution)
  - [2. Route Types & Pattern Matching](#2-route-types--pattern-matching)
    - [2.1. Static & Dynamic Segments](#21-static--dynamic-segments)
    - [2.2. Catch-All & Optional Catch-All](#22-catch-all--optional-catch-all)
    - [2.3. The Strict No-Gap Rule](#23-the-strict-no-gap-rule)
  - [3. Route Parameters & Validation](#3-route-parameters--validation)
    - [3.1. Dynamic Params Prop Injection](#31-dynamic-params-prop-injection)
    - [3.2. Route Validation (validateParams)](#32-route-validation-validateparams)
    - [3.3. Query Parameters Access](#33-query-parameters-access)
  - [4. Layouts & Special Files](#4-layouts--special-files)
    - [4.1. Nested Layouts (layout.tsx)](#41-nested-layouts-layouttsx)
    - [4.2. Horizontal Segmentation & layout_functions.ts](#42-horizontal-segmentation--layout_functionsts)
    - [4.3. Layout Control Flags (reset_layout, no_layout)](#43-layout-control-flags-reset_layout-no_layout)
    - [4.4. Error Pages (error.tsx)](#44-error-pages-errortsx)
    - [4.5. Custom 404 Pages (not_found.tsx)](#45-custom-404-pages-not_foundtsx)
  - [5. Route Organization & Parallel Slots](#5-route-organization--parallel-slots)
    - [5.1. Route Groups (folder)](#51-route-groups-folder)
    - [5.2. Escaping Route Scanning with Underscore (_folder)](#52-escaping-route-scanning-with-underscore-_folder)
    - [5.3. Parallel Routes & Slots (@slot)](#53-parallel-routes--slots-slot)
    - [5.4. Slot Error Containment Architecture](#54-slot-error-containment-architecture)
- [Navigation](#navigation)
  - [1. Navigation Overview](#1-navigation-overview)
  - [2. The `<Link>` Component & Prefetching](#2-the-link-component--prefetching)
  - [3. Programmatic Navigation (useRouter)](#3-programmatic-navigation-userouter)
  - [4. Client Router Cache & The fresh Prop](#4-client-router-cache--the-fresh-prop)
    - [4.1. How the Client Router Cache Works](#41-how-the-client-router-cache-works)
    - [4.2. Cache Invalidation with the fresh Prop](#42-cache-invalidation-with-the-fresh-prop)
    - [4.3. Comparison: When to Use Which Mechanism](#43-comparison-when-to-use-which-mechanism)
  - [5. Route Transitions (useNavigationLoading)](#5-route-transitions-usenavigationloading)
  - [6. Relative Routing Rules](#6-relative-routing-rules)
- [Type-Safe Routing](#type-safe-routing)
  - [1. Overview & Zero-Runtime Guarantee](#1-overview--zero-runtime-guarantee)
    - [1.1. Outward Navigation vs. Inward Consumption](#11-outward-navigation-vs-inward-consumption)
    - [1.2. Zero-Runtime Cost (0 Extra Bytes)](#12-zero-runtime-cost-0-extra-bytes)
  - [2. Quick Start for Developers](#2-quick-start-for-developers)
    - [2.1. Level 1: Links & Navigation](#21-level-1-links--navigation)
    - [2.2. Level 2: Typed Pages, Layouts & Server Functions](#22-level-2-typed-pages-layouts--server-functions)
    - [2.3. Quick Reference: Core Types](#23-quick-reference-core-types)
  - [3. Parameter Mapping Reference Table](#3-parameter-mapping-reference-table)
  - [4. Advanced Usage & Real-World Recipes](#4-advanced-usage--real-world-recipes)
    - [4.1. IDE Autocomplete Workflow (Ctrl + Space)](#41-ide-autocomplete-workflow-ctrl--space)
    - [4.2. Typed Error Pages with ErrorProps](#42-typed-error-pages-with-errorprops)
    - [4.3. Custom Navigation Components with DinouRoute](#43-custom-navigation-components-with-dinouroute)
    - [4.4. Dynamic Navigation with Typed Interpolation](#44-dynamic-navigation-with-typed-interpolation)
  - [5. Technical Architecture: Under the Hood](#5-technical-architecture-under-the-hood)
  - [6. Lifecycle: Dev Server & Production Builds](#6-lifecycle-dev-server--production-builds)
  - [7. Backward Compatibility Guarantee](#7-backward-compatibility-guarantee)
- [Component Architecture: Server and Client Components](#component-architecture-server-and-client-components)
  - [1. Overview & Dual-Component Model](#1-overview--dual-component-model)
    - [1.1. The RSC Mental Model](#11-the-rsc-mental-model)
  - [2. Server Components (RSC)](#2-server-components-rsc)
    - [2.1. Capabilities & Backend Access](#21-capabilities--backend-access)
    - [2.2. Constraints & Limitations](#22-constraints--limitations)
  - [3. Client Components](#3-client-components)
    - [3.1. Interactivity & Browser APIs](#31-interactivity--browser-apis)
    - [3.2. Server Pre-Rendering Notice](#32-server-pre-rendering-notice)
  - [4. The "use client" Directive](#4-the-use-client-directive)
    - [4.1. Establishing Module Boundaries](#41-establishing-module-boundaries)
    - [4.2. Import Cascading Behavior](#42-import-cascading-behavior)
  - [5. Data Serialization Boundary](#5-data-serialization-boundary)
    - [5.1. Supported Data Types](#51-supported-data-types)
    - [5.2. Passing Promises & React 19 use()](#52-passing-promises--react-19-use)
  - [6. Architectural Patterns & Best Practices](#6-architectural-patterns--best-practices)
    - [6.1. Interactive Leaves at the Edges (Recommended)](#61-interactive-leaves-at-the-edges-recommended)
    - [6.2. Composition: Server Components as Children](#62-composition-server-components-as-children)
    - [6.3. Client-First with Server Data (getProps)](#63-client-first-with-server-data-getprops)
    - [6.4. Granular Caching with <DinouCacheSlot> (Vertical Micro-ISR)](#64-granular-caching-with-dinoucacheslot-vertical-micro-isr)
    - [6.5. The Synergy: Partial Prerendering (PPR) + <DinouCacheSlot>](#65-the-synergy-partial-prerendering-ppr--dinoucacheslot)
    - [6.6. When Should You Use <DinouCacheSlot>?](#66-when-should-you-use-dinoucacheslot)
    - [6.7. Common Traps & Anti-Patterns to Avoid](#67-common-traps--anti-patterns-to-avoid)
- [Data Fetching: The 13 Strategies](#data-fetching-the-13-strategies)
  - [Overview: The 13-Strategy Architecture](#overview-the-13-strategy-architecture)
  - [Data Fetching & Rendering Strategies Matrix](#data-fetching--rendering-strategies-matrix)
  - [1. RSC Direct await (SSG)](#1-rsc-direct-await-ssg)
  - [2. RSC Direct await (Dynamic SSR)](#2-rsc-direct-await-dynamic-ssr)
  - [3. RSC with <Suspense> (SSG)](#3-rsc-with-suspense-ssg)
  - [4. RSC with <Suspense> (Dynamic Streaming SSR)](#4-rsc-with-suspense-dynamic-streaming-ssr)
  - [5. RSC + <Suspense> + <DinouCacheSlot> (Static SSG / Asymmetric ISR)](#5-rsc--suspense--dinoucacheslot-static-ssg--asymmetric-isr)
  - [6. RSC + <Suspense> + <DinouCacheSlot> (Dynamic Micro-ISR)](#6-rsc--suspense--dinoucacheslot-dynamic-micro-isr)
  - [7. RSC with <Suspense> (PPR Hybrid)](#7-rsc-with-suspense-ppr-hybrid)
  - [8. PPR + <DinouCacheSlot> (Peak Performance Synergy)](#8-ppr--dinoucacheslot-peak-performance-synergy)
  - [9. RSC Promise ➔ Client use() (React 19)](#9-rsc-promise--client-use-react-19)
  - [10. Client-First getProps (SSG)](#10-client-first-getprops-ssg)
  - [11. Client-First getProps (Dynamic SSR)](#11-client-first-getprops-dynamic-ssr)
  - [12. Client Calling Server Function (Initial Mount - Dynamic RPC)](#12-client-calling-server-function-initial-mount---dynamic-rpc)
  - [13. Client Server Functions (User Actions & Mutations)](#13-client-server-functions-user-actions--mutations)
  - [Architectural Decision Guide](#architectural-decision-guide)
- [Static & Dynamic Rendering Strategies](#static--dynamic-rendering-strategies)
  - [Overview: Static by Default Architecture](#overview-static-by-default-architecture)
  - [1. Static Site Generation (SSG) & Bailout](#1-static-site-generation-ssg--bailout)
  - [2. The Unified revalidate Strategy (Strict Seconds)](#2-the-unified-revalidate-strategy-strict-seconds)
  - [3. Partial Prerendering (PPR)](#3-partial-prerendering-ppr)
  - [4. Vertical Segmentation: Micro-ISR (`<DinouCacheSlot>`)](#4-vertical-segmentation-micro-isr-dinoucacheslot)
  - [5. High-Traffic Synergy: PPR + `<DinouCacheSlot>`](#5-high-traffic-synergy-ppr--dinoucacheslot)
  - [6. Incremental Static Generation (ISG on-demand)](#6-incremental-static-generation-isg-on-demand)
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

Start building modern, full-stack React 19 applications in seconds. Choose between the automated CLI generator or manual configuration for full architectural control.

### Prerequisites

Before getting started, ensure your local environment meets the minimum requirements. Dinou is engineered to leverage modern JavaScript standards with zero transpile overhead:

- **Node.js 20.6.0+ (Required):** Dinou utilizes Node's modern native ES module customization hooks (`module.register`) for zero-fork server execution and Web Standard APIs (`Request`, `Response`, `ReadableStream`, `Headers`) natively supported in modern Node.js versions.
- **Bun 1.1+ (Optional):** If you plan to run on Bun or compile self-contained standalone native executables using `npm run build:bun:compile`.
- **Deno 2.0+ (Optional):** If you target Deno or cross-compile single-file binaries for Linux, macOS, or Windows using `npm run build:deno:compile`.
- **Cloudflare Wrangler (Optional):** Required if you deploy to Cloudflare Workers with `npm run build:cloudflare` and preview locally with `wrangler dev`.

### Quick Start (CLI)

The fastest way to scaffold a ready-to-code Dinou application is using the official CLI starter. It sets up TypeScript, Tailwind CSS, sample Server Components, and the recommended directory layout:

```bash
# 1. Initialize a new Dinou application
npx create-dinou@latest my-app
# or
npm create dinou@latest my-app

# 2. Enter project directory
cd my-app

# 3. Launch development server (default: esbuild)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view your live application.

### Manual Setup

Prefer to wire up everything manually? Follow these step-by-step instructions to configure Dinou from scratch with complete transparency:

#### 1. Install Dependencies

Initialize your project folder and install React 19, React DOM, and the `dinou` framework package:

```bash
# Create and enter directory
mkdir my-dinou-app
cd my-dinou-app

# Initialize package.json
npm init -y

# Install React 19 and Dinou
npm install react react-dom dinou

# Install TypeScript definitions for IDE intellisense
npm install -D @types/react @types/react-dom
```

#### 2. Project Structure & Files

Create the `src` directory with a root page (`src/page.tsx`) and the recommended root document layout (`src/layout.tsx`):

```tsx
// src/page.tsx - React Server Component (RSC)
export default function Page() {
  return (
    <main className="p-8 max-w-4xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">
        Hello from Dinou!
      </h1>
      <p className="text-muted-foreground">
        Rendered natively on the server with React 19 and zero client JavaScript overhead.
      </p>
    </main>
  );
}
```

```tsx
// src/layout.tsx - Root document layout
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My Dinou App</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

The root `layout.tsx` defines the shared `<html>` and `<body>` document shell, metadata, and global providers so you don't have to repeat them on each page.

##### Recommended Directory Anatomy

```
my-dinou-app/
├── public/                # Static root assets (served directly at /)
│   ├── favicon.ico
│   ├── robots.txt
│   └── site.webmanifest
├── src/
│   ├── page.tsx           # Root page component (RSC)
│   ├── layout.tsx         # Root document layout (<html/head/body>)
│   └── globals.css        # Styles / Tailwind CSS
├── dinou.config.ts        # Framework configuration (optional: ppr, plugins)
├── dinou-env.d.ts         # Ambient framework typings
├── tsconfig.json          # TypeScript configuration
├── package.json
└── .gitignore
```

#### 3. TypeScript Configuration

Dinou does not force you to use TypeScript—you are completely free to write your application in standard JavaScript (`.js` / `.jsx`). However, even for pure JavaScript projects, defining a `tsconfig.json` in your project root is strongly recommended:

- **Import Aliases:** Dinou's build engines (esbuild, Rollup, Webpack) automatically read `compilerOptions.paths` from `tsconfig.json` to resolve clean path aliases like `@/*` into `src/*`.
- **IDE Autocomplete:** With `"allowJs": true`, code editors (VS Code, Cursor) use `tsconfig.json` to provide full autocomplete, auto-imports, and path resolution across all `.js` and `.jsx` files.

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"]
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

Create `dinou-env.d.ts` in your root directory:

```typescript
/// <reference types="dinou/env" />
```

The `dinou/env` reference automatically declares ambient typings for static assets (SVGs, images, web fonts) and CSS modules without manual type boilerplate.

#### 4. Package Scripts

Add the standard Dinou scripts to your `package.json` to control development, multi-runtime production builds (Node, Cloudflare, Deno, Bun), binary compilation, static exports, and ejecting:

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
    "start:node": "dinou start:node",
    "build:cloudflare": "dinou build:cloudflare",
    "build:deno": "dinou build:deno",
    "build:deno:compile": "dinou build:deno:compile",
    "start:deno": "dinou start:deno",
    "build:bun": "dinou build:bun",
    "build:bun:compile": "dinou build:bun:compile",
    "start:bun": "dinou start:bun",
    "export-static": "dinou export-static",
    "eject": "dinou eject"
  }
}
```

> **Note:** For the complete catalog of targeted platform cross-compilation scripts (such as Windows, macOS, Linux ARM/x64), see the [Complete CLI Scripts Catalog](#complete-cli-scripts-catalog-100-scripts-reference).

#### 5. Configure .gitignore

Create a `.gitignore` file to ignore dependencies, environment variables, build outputs, and Dinou caches:

```gitignore
node_modules
.dinou
out
dist
.wrangler
.env
```

- `.dinou/` holds internal dev artifacts and runtime builds.
- `out/` contains pages generated by `export-static`.
- `dist/` stores compiled single-executable binaries (Deno / Bun).
- `.wrangler/` stores local state when testing Cloudflare Workers.

#### 6. Start Development Server

Run the development server with the fast esbuild bundler (default), or choose Rollup or Webpack:

```bash
# Start with default ultra-fast esbuild
npm run dev

# Or start with Rollup or Webpack
npm run dev:rollup
npm run dev:webpack
```

### Building for Production & Target Runtimes

Dinou provides both bundler freedom (**esbuild**, **Rollup**, **Webpack**) and universal runtime deployment (**Node.js**, **Cloudflare Workers**, **Deno**, **Bun**, or **Static SSG**) from a single codebase in `src/` with zero code changes.

#### Bundler Flexibility (esbuild, Rollup, Webpack)

By default, Dinou uses **esbuild** for sub-second cold starts and in-memory compilation. When enterprise plugins or custom loaders are required, you can switch seamlessly to **Rollup** or **Webpack** with 100% feature parity:

```bash
# Start development with your preferred bundler
npm run dev          # Default: esbuild
npm run dev:rollup   # Dedicated Rollup in-memory engine
npm run dev:webpack  # Dedicated Webpack engine
```

For advanced compiler tuning, custom plugins, and SWC options, visit the [Bundlers Guide](#-bundlers--running-the-app).

#### First-Class Multi-Runtime Targets

Compile your application for any execution environment without altering component logic:

- **Node.js Production Server:**
  ```bash
  npm run build:node && npm run start:node
  ```
- **Cloudflare Workers (Edge):**
  ```bash
  npm run build:cloudflare && npx wrangler dev
  ```
- **Self-Contained Executable Binary (Deno / Bun):**
  ```bash
  npm run build:deno:compile # or build:bun:compile
  ```
  Outputs standalone single-file executables directly to `dist/`.
- **Pure Static Site Export (SSG):**
  ```bash
  npm run export-static
  ```
  Pre-rendered HTML and RSC Flight payloads output directly to `out/`.

For complete deployment guides, Docker setups, and cloud hosting instructions, see the [Deployment Guide](#-deployment-guide).

## Routing & Layouts

Master Dinou's file-system router: nested layouts with independent Horizontal ISR, parallel slots with error isolation, route parameters, and layout control flags.

> [!TIP]
> **Looking for Type-Safe Routing?**
> Dinou v7 introduces zero-runtime type safety with auto-generated route definitions, IDE autocomplete, and typed `PageProps` & `<Link>`.

---

### 1. Overview & Directory Conventions

Every public route in Dinou maps directly to a folder inside `src/` containing an entrypoint file (`page.tsx`, `page.jsx`, `page.ts`, or `page.js`). By default, pages are **React Server Components (RSC)** rendered natively on the server with zero client bundle overhead.

#### 1.1. Core File Conventions

- `src/page.tsx` → `/`
- `src/blog/page.tsx` → `/blog`
- `src/blog/[slug]/page.tsx` → `/blog/hello-world`
- `src/dashboard/settings/page.tsx` → `/dashboard/settings`

#### 1.2. In-Memory Route Resolution

You never write central routing tables or configure URL maps manually. The folder structure inside `src/` is your single source of truth.

When a request arrives (for example, `/blog/hello-world`), Dinou matches it entirely in memory:

- **Instant matching:** Directly locates `src/blog/[slug]/page.tsx` in memory with zero subprocess overhead or disk I/O latency.
- **Parameter extraction:** Automatically parses dynamic segments into typed params (e.g. `{ slug: "hello-world" }`).
- **Layout nesting:** Automatically wraps the page inside its parent layouts (`src/layout.tsx` → `src/blog/layout.tsx`).

You can use `.tsx`, `.ts`, `.jsx`, or `.js` interchangeably across all pages and layouts.

---

### 2. Route Types & Pattern Matching

Dinou provides expressive pattern matching for static, dynamic, optional, and catch-all URL segments:

#### 2.1. Static & Dynamic Segments

| Pattern | Folder Structure | URL Match Example | Parsed `params` |
| :--- | :--- | :--- | :--- |
| **Static** | `src/about/page.tsx` | `/about` | `{}` |
| **Dynamic** | `src/blog/[slug]/page.tsx` | `/blog/hello` | `{ slug: "hello" }` |
| **Optional Single** | `src/shop/[[category]]/page.tsx` | `/shop`<br>`/shop/shoes` | `{ category: undefined }`<br>`{ category: "shoes" }` |

#### 2.2. Catch-All & Optional Catch-All

| Pattern | Folder Structure | URL Match Example | Parsed `params` |
| :--- | :--- | :--- | :--- |
| **Catch-all (Required)** | `src/docs/[...slug]/page.tsx` | `/docs/routing/params` | `{ slug: ["routing", "params"] }` |
| **Optional Catch-all** | `src/docs/[[...slug]]/page.tsx` | `/docs`<br>`/docs/a/b` | `{ slug: [] }`<br>`{ slug: ["a", "b"] }` |

Catch-all segments (`[...slug]`) consume all remaining path segments into a string array. Because they consume the remainder of the URL, Catch-all segments must always be the **terminal (last) segment** of a path definition.

#### 2.3. The Strict No-Gap Rule

Dinou enforces a strict No-Gap Rule when resolving nested optional segments such as `/inventory/[[warehouse]]/[[aisle]]`:

##### ✅ Allowed: Trailing Omission
You can omit optional segments only if they are omitted from the tail end of the URL:
- `/inventory/main/a1` ✅ (both provided: `{ warehouse: "main", aisle: "a1" }`)
- `/inventory/main` ✅ (`aisle` omitted: `{ warehouse: "main", aisle: undefined }`)
- `/inventory` ✅ (both omitted: `{ warehouse: undefined, aisle: undefined }`)

##### ❌ Forbidden: Intercalated Gaps
You cannot omit an earlier optional parameter while setting a later one:
- `/inventory//a1` ❌ (empty gap / skipped `warehouse` while setting `aisle`: ambiguous URL structure rejected)

---

### 3. Route Parameters & Validation

Dinou provides a clean, unified data contract. Route parameters are extracted from the URL and injected directly into components and server functions.

#### 3.1. Dynamic Params Prop Injection

In Dinou v7, parameters are strictly typed using `PageProps`, `LayoutProps`, `ErrorProps`, and `RouteParams`:

- `page.tsx` components: `Page({ params }: PageProps<"/blog/[slug]">)`
- `layout.tsx` components: `Layout({ params, children }: LayoutProps<"/blog/[slug]">)`
- `error.tsx` pages: `Error({ error, params }: ErrorProps<"/blog/[slug]">)`
- `not_found.tsx` 404 pages: `NotFound({ params }: PageProps<"/blog/[slug]">)`
- Parallel slot pages (`@slot/page.tsx`): `SlotPage({ params }: PageProps<"/dashboard/[teamId]">)`
- Server data fetching: `getProps(params: RouteParams<"/blog/[slug]">)` in `page_functions.ts`

```tsx
// src/blog/[slug]/page.tsx
import type { PageProps } from "dinou";

interface BlogPostProps extends PageProps<"/blog/[slug]"> {
  post?: { title: string; content: string };
}

export default function BlogPost({ params, post }: BlogPostProps) {
  // ✅ params.slug is strongly typed as string automatically
  return (
    <article className="p-6">
      <h1 className="text-2xl font-bold">{post?.title ?? params.slug}</h1>
      <p className="mt-2 text-muted-foreground">{post?.content}</p>
    </article>
  );
}
```

> [!IMPORTANT]
> **Strict Signature Rule:**
> In `page_functions.ts` and `layout_functions.ts`, Dinou passes the parameters dictionary directly as the first argument: use `getProps(params)` and `validateParams(params)` (do not write `getProps({ params })`). However, in React components (`page.tsx`, `layout.tsx`, `error.tsx`, `not_found.tsx`), `params` is passed as a component prop: `export default function Page({ params })`.

#### 3.2. Route Validation (validateParams)

Exporting a `validateParams(params)` function from `page_functions.ts` or `layout_functions.ts` lets you enforce semantic validation rules before data fetching or rendering begins. Returning `false` (or a Promise that resolves to `false`) immediately aborts the request and issues a clean 404 response:

```tsx
// src/product/[id]/page_functions.ts
import type { RouteParams } from "dinou";

export function validateParams(params: RouteParams<"/product/[id]">) {
  // Ensure the product ID is strictly numeric; otherwise render 404
  return /^\d+$/.test(params.id);
}

export async function getProps(params: RouteParams<"/product/[id]">) {
  // Only called if validateParams returned true
  const product = await db.products.findById(params.id);
  return { product };
}
```

**Guaranteed behavior across all rendering modes:**
- **Dynamic SSR:** Returns an instant 404 without running `getProps`, preventing wasteful database queries on invalid URLs.
- **Incremental Static Generation (ISG / ISR):** Prevents invalid URLs from triggering on-demand page generation or polluting edge caches with broken pages.
- **Static Site Exports (SSG):** Only valid parameter combinations generate HTML files during `dinou export`.

#### 3.3. Query Parameters Access

Query parameters (e.g. `?search=react&sort=asc`) are deliberately isolated from static route matching to preserve edge cache stability. In Dinou, `useSearchParams()` is a universal hook that works seamlessly in both Server Components and Client Components:

```tsx
import { useSearchParams } from "dinou";

// Works identically in Server Components & "use client"!
export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("search") ?? "";
  return <div>Search: {q}</div>;
}
```

##### Outside React Components (page_functions.ts & Server Functions)
Outside React components (where hooks cannot run), access the active query via `getContext().req.query`:

```tsx
import { getContext } from "dinou";

// src/search/page_functions.ts
// getContext() is available in getProps, validateParams, etc.
export async function getProps() {
  const { req } = getContext();
  const search = req.query?.search;
  return { search };
}
```

```tsx
"use server"; // Declared at the top of the file
import { getContext } from "dinou";

// src/actions/items.ts
export async function filterItems() {
  const { req } = getContext();
  const search = req.query?.search;
  return db.items.find({ q: search });
}
```

---

### 4. Layouts & Special Files

Dinou provides special files that cascade down the directory hierarchy. They allow you to compose nested layouts, manage independent ISR lifecycles, isolate errors, and break out of hierarchies using control flags.

#### 4.1. Nested Layouts (layout.tsx)

A `layout.tsx` wraps all child pages and sub-layouts in its directory. On client navigation between sibling pages, parent layouts preserve their React state, input fields, scroll position, and DOM tree without re-mounting.

A layout component receives `children`, `params`, any parallel slots (e.g. `sidebar`), and props returned by `layout_functions.ts`:

```tsx
// src/dashboard/[teamId]/layout.tsx
import type { ReactNode } from "react";
import type { LayoutProps } from "dinou";

interface DashboardLayoutProps extends LayoutProps<"/dashboard/[teamId]"> {
  sidebar?: ReactNode; // Parallel slot (@sidebar)
}

export default function DashboardLayout({
  children,
  params,
  sidebar,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r p-4">{sidebar}</aside>
      <main className="flex-1 p-6">
        <h1 className="text-xl font-bold">Team: {params.teamId}</h1>
        {children}
      </main>
    </div>
  );
}
```

#### 4.2. Horizontal Segmentation & layout_functions.ts

In traditional SSR frameworks, layout shells and child pages are tightly coupled. Navigating to a dynamic child route often forces the entire layout to re-evaluate, resetting video playback, collapsing open menus, or wiping sidebar search state.

Dinou v7 introduces **Horizontal Layered Segmentation**. Layouts and pages travel on completely separate execution, streaming, and caching pathways:

1. **The Layout Plane:** Renders exclusively the outer layout shell and any parallel slots, establishing the boundary where child page content is mounted.
   - Governed by `layout_functions.ts`
   - Maintains its own independent cache TTL
   - Never unmounts or re-executes during sibling navigations
2. **The Page Plane:** Renders exclusively the active leaf page component (`<Page />`) and streams into the layout's page slot.
   - Governed by `page_functions.ts`
   - Can be highly dynamic or real-time SSR
   - Navigating between siblings updates only this plane

##### Decoupled Lifecycles in Practice: layout_functions.ts

Because layouts and pages are horizontally decoupled, they can declare completely independent caching lifetimes (TTL / ISR). A layout shell can cache for hours while its child pages revalidate every few seconds:

```tsx
// src/dashboard/[teamId]/layout_functions.ts - Independent Layout ISR
import type { RouteParams } from "dinou";

// 1. Data Fetching for the Layout Shell
export async function getProps(params: RouteParams<"/dashboard/[teamId]">) {
  const team = await fetchTeamData(params.teamId);
  return { team };
}

// 2. Independent Cache Lifetime (1 hour)
// Child pages inside this dashboard can update every 5 seconds without invalidating this shell!
export const revalidate = 3600;

// 3. Granular Invalidation Tags (constant or function getCacheTags)
// Calling revalidateTag("team-shell") purges only the layout without wiping child page caches.
export const getCacheTags = ["team-shell"];
```

Props returned by `getProps` in `layout_functions.ts` are automatically injected into `layout.tsx` as top-level props alongside `children`, `params`, and any parallel slots.

#### 4.3. Layout Control Flags (reset_layout, no_layout)

Dinou allows you to break out of the nested layout hierarchy using empty flag files (files without extensions) placed in the route directory:

| Flag File | Applies To | Architectural Effect |
| :--- | :--- | :--- |
| `reset_layout` | `layout.tsx` | **Resets the layout tree.** This layout becomes the new root layout, completely ignoring all parent layouts (including `src/layout.tsx`). Perfect for marketing landing pages or auth portals. |
| `no_layout` | `page.tsx`, `not_found.tsx`, `error.tsx` | **Bypasses all layouts entirely across the route.** The page, custom 404, and error boundary render raw without any parent layout wrappers (ideal for embeddable widgets, checkout modals, or pure HTML canvas views). |
| `no_layout_error` | `error.tsx` | **Granular override:** prevents parent layouts from wrapping the error boundary UI only, while preserving layouts for the regular page. |
| `no_layout_not_found` | `not_found.tsx` | **Granular override:** prevents parent layouts from wrapping the custom 404 page only, while preserving layouts for the regular page. |

##### Example: Standalone Landing Page
- `src/landing/layout.tsx`
- `src/landing/reset_layout` (empty file)
- `src/landing/page.tsx`
- → The landing page ignores the root `src/layout.tsx` header and navigation bar.

#### 4.4. Error Pages (error.tsx)

Create an `error.tsx` file in any route directory to catch and isolate runtime errors locally. If an exception occurs in a child component, Dinou bubbles up to the closest `error.tsx`, rendering it while keeping all parent layouts interactive:

```tsx
// src/dashboard/[teamId]/error.tsx
import type { ErrorProps } from "dinou";

// Native: ErrorProps infers params and types the captured error
export default function DashboardError({
  error,
  params,
}: ErrorProps<"/dashboard/[teamId]">) {
  return (
    <div className="p-6 rounded-xl border border-rose-500/20 bg-rose-50/20">
      <h3 className="text-rose-600 font-bold">Failed to load team {params.teamId}</h3>
      <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
      {error.stack && (
        <pre className="mt-3 p-3 bg-slate-900 text-slate-100 rounded text-xs overflow-auto">
          {error.stack}
        </pre>
      )}
    </div>
  );
}
```

> [!NOTE]
> **Security Note:** For production deployments, `error.stack` is automatically stripped by Dinou to prevent internal file paths and system details from leaking. In development mode, the full cleaned stack trace is provided.

#### 4.5. Custom 404 Pages (not_found.tsx)

Define custom 404 views by placing `not_found.tsx` in any route directory. When an unmatched URL segment is requested, Dinou bubbles up to render the closest `not_found.tsx` template inside its enclosing layout.

##### Scoped to Route Segment
```tsx
// src/blog/[slug]/not_found.tsx (Scoped to /blog/[slug])
import { Link, type PageProps } from "dinou";

// Strongly types params.slug as string
export default function NotFound({ params }: PageProps<"/blog/[slug]">) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h2 className="text-3xl font-bold">404 - Article Not Found</h2>
      <p className="mt-2 text-muted-foreground">
        The article "{params.slug}" could not be located.
      </p>
      <Link
        href="/"
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm"
      > 
        Back to Home
      </Link>
    </div>
  );
}
```

##### Global Root 404 Fallback
```tsx
// src/not_found.tsx (Global Root Fallback)
import { Link, type PageProps } from "dinou";

// PageProps<"/"> strictly ensures no dynamic params are accidentally accessed
export default function GlobalNotFound({ params }: PageProps<"/">) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h2 className="text-3xl font-bold">404 - Page Not Found</h2>
      <p className="mt-2 text-muted-foreground">
        The requested page does not exist on this server.
      </p>
      <Link
        href="/"
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm"
      > 
        Back to Home
      </Link>
    </div>
  );
}
```

##### Can 404 Pages Receive Server Props via getProps?
**Yes.** If you define a `page_functions.{ts,js}` file in the same route directory as `not_found.tsx`, Dinou executes its `getProps(params)` server lifecycle and merges the returned data directly into the component's props alongside `params`:

```tsx
// 1. Sibling server contract: src/blog/[slug]/page_functions.ts
export async function getProps(params: { slug: string }) {
  const suggestions = await db.posts.findMany({ take: 3 });
  return { suggestions };
}

// 2. 404 Page: src/blog/[slug]/not_found.tsx
import { Link, type PageProps } from "dinou";

interface NotFoundProps extends PageProps<"/blog/[slug]"> {
  suggestions: { id: string; title: string; slug: string }[];
}

export default function NotFound({ params, suggestions }: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h2 className="text-3xl font-bold">404 - Article Not Found</h2>
      <p className="mt-2 text-muted-foreground">
        Could not find "{params.slug}". Here are some recommended articles:
      </p>
      {suggestions && (
        <ul className="mt-4 space-y-1">
          {suggestions.map((item) => (
            <li key={item.id}>
              <Link
                href={`/blog/${item.slug}`}
                className="text-primary hover:underline text-sm font-medium"
              >
                &rarr; {item.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

> **Difference with `error.tsx`:** While `not_found.tsx` can safely execute `getProps`, `error.tsx` pages never invoke server contracts (they receive strictly `ErrorProps`) to prevent compounding unhandled server exceptions.

---

### 5. Route Organization & Parallel Slots

Dinou provides dedicated directory conventions to organize enterprise codebases cleanly and compose parallel UI slots without impacting URL ergonomics:

#### 5.1. Route Groups (folder)

Folders wrapped in parentheses (e.g. `(auth)`, `(marketing)`) are omitted from the public URL path. They serve two fundamental architectural purposes in Dinou:

- **Logical Organization:** Group related routes together without introducing unwanted segment prefixes in the URL.
- **Multiple Root Layouts:** Apply completely different top-level layout wrappers to different areas of your application without URL changes.

##### Multiple Root Layouts in Practice
In conventional file-system routers, a single global layout forces all pages to share the same top navigation bar and footer. With Dinou Route Groups, you can create independent root layouts for marketing pages versus authentication screens:

```
src/
├── (marketing)/                # Public layout branch
│   ├── layout.tsx              # Navbar, Footer, Hero
│   ├── page.tsx                # → /
│   ├── about/page.tsx          # → /about
│   └── pricing/page.tsx        # → /pricing
└── (auth)/                     # Minimalist auth branch
    ├── layout.tsx              # Centered card, no Navbar
    ├── login/page.tsx          # → /login
    └── register/page.tsx       # → /register
```

**How Dinou Resolves Layouts:**
- **Independent Filesystem Paths:** `src/(marketing)/layout.tsx` and `src/(auth)/layout.tsx` live in distinct disk directories, so there is zero file collision.
- **Request to `/pricing`:** Dinou crawls into `(marketing)`, matches `pricing/page.tsx`, and wraps it exclusively with the marketing layout.
- **Request to `/login`:** Dinou crawls into `(auth)`, matches `login/page.tsx`, and wraps it exclusively with the auth layout.
- **Root Hierarchy:** If you also place a top-level `src/layout.tsx`, both groups nest inside it (e.g. for HTML `<head>` or global fonts). If omitted, each group acts as a completely separate root layout.

##### Avoid URL Path Collisions
Because parenthesized folder names are stripped from the public URL, different route groups cannot define identical URL paths. For example, creating both `src/(marketing)/about/page.tsx` and `src/(auth)/about/page.tsx` would cause a build/resolution collision because both map to `/about`.

#### 5.2. Escaping Route Scanning with Underscore (_folder)

In Dinou, you do not need to prefix folders like `components/`, `hooks/`, or `utils/` with an underscore. Any directory that simply does not contain a `page.tsx` (or `page.jsx`) is already completely ignored by the router and will never register a route.

##### The Real Purpose of "_": Legacy Code & Archived Pages
The sole and specific purpose of prefixing a directory with an underscore (`_folderName`) is to escape the in-process route scanner when dealing with legacy code, drafts, or archived folders that actually contain `page.tsx` / `page.jsx` files inside them:

```
src/blog/
├── page.tsx             → /blog (Active public route)
├── components/          (No page.tsx → already safe without "_")
│   └── post-card.tsx
└── _legacy_v1/          (Contains page.tsx, but "_" forces scanner to skip it!)
    ├── page.tsx         (SKIPPED — NOT a route)
    └── [slug]/page.tsx  (SKIPPED — NOT a route)
```

Whenever Dinou's scanner encounters a folder starting with `_`, it completely bypasses that directory tree, ensuring that stale, archived, or legacy page files are never compiled into the production router.

#### 5.3. Parallel Routes & Slots (@slot)

Parallel routes allow you to render multiple independent pages simultaneously inside the same parent layout (e.g., `@sidebar`, `@analytics`, `@modal`):

**Folder Structure:**
- `src/dashboard/@sidebar/page.tsx`
- `src/dashboard/@analytics/page.tsx`
- `src/dashboard/page.tsx` (main `children`)
- `src/dashboard/layout.tsx`

**Layout Prop Injection:**
Slots are passed as named props directly alongside `children`:

```tsx
import type { ReactNode } from "react";
import type { LayoutProps } from "dinou";

interface DashboardLayoutProps extends LayoutProps<"/dashboard"> {
  sidebar?: ReactNode;
  analytics?: ReactNode;
}

export default function Layout({
  children,
  sidebar,
  analytics,
}: DashboardLayoutProps) {
  return (
    <div className="flex">
      <aside>{sidebar}</aside>
      <main>{children}</main>
      <section>{analytics}</section>
    </div>
  );
}
```

#### 5.4. Slot Error Containment Architecture

Dinou isolates errors within parallel slots to prevent a single widget failure from crashing the entire page:

- **Slot with `error.tsx`:** If the slot fails, only that specific slot renders its local error UI. The rest of the page and sibling slots remain completely operational.
- **Slot without `error.tsx`:** If an unhandled exception occurs in a slot with no `error.tsx`, Dinou safely falls back to rendering `null` for that slot without taking down the page.
- **Layout & Sibling Resilience:** Sibling slots, the main `children` page, and parent layouts remain fully mounted and interactive even if an individual slot fails to render.

## Navigation

Master Dinou's client-side SPA navigation: smooth soft transitions, automatic hover prefetching, the Client Router Cache lifecycle, cache busting with the `fresh` prop, imperative `useRouter` controls, and Directory-First relative routing.

> [!TIP]
> **Looking for Type-Safe Navigation?**
> Dinou generates automatic route types so `<Link href="...">` and `router.push("...")` provide zero-runtime autocomplete and compile-time error checking.

---

### 1. Navigation Overview

In Dinou, navigating between routes does not trigger a full browser refresh (`window.location.reload`). Instead, Dinou operates as a high-performance single-page application (SPA):

- **Preserved Shell:** Persistent layouts (`layout.tsx`) never unmount, maintaining video playback, active form inputs, scroll positions, and local component state across page changes.
- **Flight Streaming:** Only the newly navigated route's Server Components are fetched over the wire via React Flight payloads.
- **Concurrent Transitions:** Transitions execute inside React 19's `startTransition`, ensuring that the current UI stays fully responsive and interactive during data fetching.

---

### 2. The `<Link>` Component & Prefetching

The primary way to navigate between pages is the `<Link>` component imported from `"dinou"`. It intercepts click events, prevents hard reloads, and handles background prefetching:

```tsx
import { Link } from "dinou";

export function NavigationBar() {
  return (
    <nav className="flex gap-4">
      {/* ✅ Type-Safe href: autocompleted in your IDE via DinouRoute */}
      <Link href="/dashboard">Dashboard</Link>

      {/* ✅ Dynamic interpolation typed against registered routes */}
      <Link href={`/blog/${post.slug}`}>Post</Link>

      {/* Disable prefetch for heavy routes or rarely visited pages */}
      <Link href="/analytics" prefetch={false}>
        Analytics
      </Link>

      {/* ❌ TypeScript compile error on invalid/dead links when using type-safe routing */}
      {/* <Link href="/broken-link">Broken</Link> */}
    </nav>
  );
}
```

> [!NOTE]
> **Native HTML `<a>` Anchor Elements:**
> In Dinou, standard HTML `<a>` tags also automatically trigger client-side soft navigation via global event delegation. However, `<Link>` is recommended because it provides compile-time type safety, background prefetching on hover, and the `fresh` prop.

---

### 3. Programmatic Navigation (useRouter)

To navigate imperatively from event handlers, timers, or form submissions, use the `useRouter()` hook inside Client Components (`"use client"`):

```tsx
"use client";

import { useRouter } from "dinou";

export default function LoginButton() {
  const router = useRouter();

  const handleLogin = async () => {
    await loginUser();
    
    // Navigate programmatically
    router.push("/dashboard");
    
    // Or force fresh data after mutation:
    // router.push("/dashboard", { fresh: true });
  };

  return <button onClick={handleLogin}>Log In</button>;
}
```

#### Method Reference

| Method | Behavior & Description |
| :--- | :--- |
| `router.push(href, options)` | Navigates to the route and adds a new entry to the browser history stack. Supports `{ fresh: true }`. |
| `router.replace(href, options)` | Navigates to the route, replacing the current history entry without pushing a new history state. Supports `{ fresh: true }`. |
| `router.back()` | Navigates back to the previous page in history (equivalent to clicking the browser Back button). |
| `router.forward()` | Navigates forward to the next page in the history stack. |
| `router.refresh()` | **Soft Reload:** Re-fetches the current route data from the server and updates server components without losing client React state or scroll position. |
| `router.refreshSlot(slotId)` | Re-fetches and updates an individual `<DinouCacheSlot>` component without re-rendering the surrounding page. |

---

### 4. Client Router Cache & The fresh Prop

To deliver instant page transitions without unnecessary server requests, Dinou features an in-memory Client Router Cache. Understanding how this cache operates is key to knowing when and why to use the `fresh` prop.

#### 4.1. How the Client Router Cache Works

During client execution, Dinou maintains three dedicated in-memory caches in the browser tab:

1. **`pageCache`:** Stores prefetched and visited RSC promises keyed by `pathname + search`.
2. **`scrollCache`:** Retains exact window and container scroll coordinates keyed by history state ID.
3. **`popstate`:** Reads from `pageCache` and restores scroll without network requests on back/forward.

##### The Navigation Lifecycle
1. **On Hover:** When the mouse enters a `<Link href="/pricing">`, Dinou automatically prefetches the route payload in the background and stores the pending RSC promise directly into `pageCache`.
2. **On Click:** The router initiates navigation to `"/pricing"`. Because the payload was already prefetched into `pageCache`, the transition renders instantly with 0ms network latency.
3. **On Back / Forward:** Browser `popstate` events read from `pageCache` and restore the previous scroll position from `scrollCache` without making any network requests.

#### 4.2. Cache Invalidation with the fresh Prop

While caching provides instantaneous navigation, pages with volatile data or pages visited immediately after a mutation (e.g., checkout, profile updates, or inventory counters) need fresh server state. The `fresh` prop provides explicit, predictable cache busting:

##### What happens under the hood when fresh is true:
- **No Stale Prefetch:** Hovering over a `<Link fresh>` does not prefetch potentially stale data before the user actually clicks.
- **Cache Eviction:** Upon navigation, the router explicitly runs `pageCache.delete(targetUrl)`, removing any prior cached RSC promise.
- **Live Re-Execution:** Issues a fresh HTTP request directly to the server, re-executing server components and page functions with latest data.

##### Usage Examples:
```tsx
// Ideal for live feeds, stock tickers, or carts
<Link href="/live-feed" fresh>
  Live Feed
</Link>
```

```tsx
// Navigate after a mutation to force fresh server data
const handleUpdate = async () => {
  await updateProfile(data);
  router.push("/profile", { fresh: true });
};
```

#### 4.3. Comparison: When to Use Which Mechanism

| Mechanism / Scope | Cache Behavior | Network Request | Typical Use Case |
| :--- | :--- | :--- | :--- |
| **Standard `<Link>`** | Uses `pageCache` if prefetched or visited | 0ms if in cache; single request on first visit | General navigation, blogs, docs, marketing pages |
| **`<Link fresh>` / `{ fresh: true }`** | Purges `pageCache.delete(url)` | Always fetches live RSC payload from server | Post-mutation redirects, active carts, volatile feeds |
| **`router.refresh()`** | Purges `pageCache.delete(currentPath)` | Re-fetches current route in-place | Polling, server function response handling, reload button |
| **Hard Reload (F5)** | Destroys all memory (all caches lost) | Full HTML document download + re-hydration | Emergency fallback; loses all client state |

---

### 5. Route Transitions (useNavigationLoading)

In Dinou, all client-side navigations execute concurrently inside React 19's `startTransition`. This ensures that the current view remains fully interactive and visible while the target page's Server Components stream in from the server.

To inform users that a transition is occurring behind the scenes, Dinou provides the `useNavigationLoading()` hook:

- Returns `true` while a route payload is actively streaming or preparing in the background, and resets to `false` the moment React 19 commits the new page tree.
- Evaluates to `false` during server-side rendering (SSR), preventing hydration mismatches and flickering when the document first mounts.

#### Example: Global Top Navigation Progress Bar

Mount a client loading indicator in your root layout to provide visual feedback (similar to GitHub or YouTube) whenever a route transition is pending:

```tsx
"use client";

import { useNavigationLoading } from "dinou";

export function NavigationProgressBar() {
  const isNavigating = useNavigationLoading();

  if (!isNavigating) return null;

  return (
    <div
      role="progressbar"
      aria-label="Page loading"
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-blue-500/20 overflow-hidden pointer-events-none"
    >
      <div className="h-full bg-blue-600 dark:bg-blue-400 animate-pulse w-full transition-all duration-300" />
    </div>
  );
}
```

> [!TIP]
> Because prefetched links resolve instantly in 0ms directly from `pageCache`, this progress bar only surfaces on fresh fetches (such as navigation with `fresh: true` or un-prefetched dynamic routes), keeping transitions ultra snappy.

---

### 6. Relative Routing Rules

Dinou resolves relative navigation paths (such as `about`, `./about`, or `../dashboard`) using a **Directory-First Convention**. This provides intuitive navigation that accurately mirrors your file system.

In a standard web browser, a URL like `/blog/hello` (without a trailing slash) treats `hello` as a file name, so a link to `about` resolves to `/blog/about`.

In Dinou, every route is treated as a directory because physically, each page is a folder containing a `page.tsx` component (e.g. `src/blog/hello/page.tsx`). Resolving relatively from a page navigates relative to that route's folder:

| Current Path | Relative Target | Resolved Path |
| :--- | :--- | :--- |
| `/blog/hello` | `about` | `/blog/hello/about` |
| `/blog/hello` | `./about` | `/blog/hello/about` |
| `/blog/hello` | `../about` | `/blog/about` |

This rule applies uniformly across all navigation methods, including the `<Link>` component and programmatic calls like `router.push()`.

## Type-Safe Routing

Dinou v7 introduces a built-in, compile-time Type-Safe Routing engine with **zero runtime overhead**. During development and build time, Dinou automatically inspects your `src/` directory and generates ambient TypeScript definitions in `.dinou/types/routes.d.ts`.

---

### 1. Overview & Zero-Runtime Guarantee

Unlike traditional routing setups that require external schema validators or proprietary bundler plugins, Dinou generates strict TypeScript definitions directly from your file system.

#### 1.1. Outward Navigation vs. Inward Consumption

The system operates across two complementary architectural planes:

1. **Outward Navigation (Level 1):** Protects outbound transitions. When using `<Link href="...">`, `router.push("...")`, or passing routes to reusable UI components with `DinouRoute`, TypeScript autocompletes valid routes, verifies dynamic template strings, and raises compile-time errors on dead links or typos.
2. **Inward Consumption (Level 2):** Enforces inbound parameter safety. Pages, layouts, error boundaries, and server data loaders consume parameters strongly typed by route template strings via `PageProps<T>`, `LayoutProps<T>`, `ErrorProps<T>`, and `RouteParams<T>`.

#### 1.2. Zero-Runtime Cost (0 Extra Bytes)

All route type validation occurs entirely within the TypeScript compiler. The emitted `.dinou/types/routes.d.ts` file contains ambient type declarations and is never bundled into your client JavaScript or server execution bundle:

- **0 bytes added** to production client bundles.
- **0 runtime performance overhead** on route matching or transitions.
- **0 external dependencies** required for type validation.

---

### 2. Quick Start for Developers

#### 2.1. Level 1: Links & Navigation

Import `<Link>` or `useRouter` from `"dinou"`. Your IDE will immediately suggest all valid static routes, parameterized dynamic routes, relative paths, queries, and hashes:

```tsx
import { Link, useRouter } from "dinou";

export default function Navigation({ post }: { post: { slug: string } }) {
  const router = useRouter();

  return (
    <nav className="flex gap-4">
      {/* ✅ Instant autocompletion in your IDE */}
      <Link href="/docs/routing">Routing Guide</Link>

      {/* ✅ Dynamic routes with typed template strings */}
      <Link href={`/blog/${post.slug}`}>View Post</Link>

      {/* ✅ Seamless support for queries, hashes, relative paths, and external URLs */}
      <Link href="/demo?tab=settings#section-1">Settings</Link>
      <Link href="../contact">Relative</Link>
      <Link href="https://github.com/roggc/dinou">GitHub</Link>

      {/* ❌ TypeScript compile-time error when pointing to a non-existent route */}
      {/* <Link href="/unknown-route" /> */}

      <button onClick={() => router.push("/docs/api-reference")}>
        View API Reference
      </button>
    </nav>
  );
}
```

#### 2.2. Level 2: Typed Pages, Layouts & Server Functions

Type your components and data fetching functions by passing the route template string as a generic:

```tsx
import type { PageProps, LayoutProps, RouteParams } from "dinou";

// 1. src/blog/[slug]/page.tsx
export default function BlogPost({ params }: PageProps<"/blog/[slug]">) {
  // ✅ params.slug is strongly typed as string
  return <h1>Post: {params.slug}</h1>;

  // ❌ TypeScript error: Property 'id' does not exist on type '{ slug: string }'
  // return <h1>{params.id}</h1>;
}

// 2. src/blog/[slug]/layout.tsx
export function BlogLayout({ children, params }: LayoutProps<"/blog/[slug]">) {
  // ✅ params.slug is strongly typed; children is typed as ReactNode
  return (
    <section>
      <header>Category: {params.slug}</header>
      <main>{children}</main>
    </section>
  );
}

// 3. src/blog/[slug]/page_functions.ts
export async function getProps(params: RouteParams<"/blog/[slug]">) {
  // ✅ Directly types the raw params object without params: any
  return {
    postTitle: `Post: ${params.slug}`,
  };
}
```

#### 2.3. Quick Reference: Core Types

| Exported Type | Primary Purpose | Canonical Example |
| :--- | :--- | :--- |
| `PageProps<T>` | React Page components (`page.tsx`) | `Page({ params }: PageProps<"/blog/[slug]">)` |
| `LayoutProps<T>` | React Layout components (`layout.tsx`) | `Layout({ children, params }: LayoutProps<"/blog/[slug]">)` |
| `ErrorProps<T>` | React Error Page components (`error.tsx`) | `Error({ error, params }: ErrorProps<"/blog/[slug]">)` |
| `RouteParams<T>` | Pure functions, data loaders & services (`getProps`, API helpers) | `getProps(params: RouteParams<"/blog/[slug]">)` |
| `DinouRoute` | URL props, `<Link>`, `router.push()` & custom navigation components | `interface NavProps { href: DinouRoute }` |

---

### 3. Parameter Mapping Reference Table

Dinou deterministically transforms your file-system folder naming conventions into strict TypeScript definitions:

| Filesystem Convention | Inferred Parameter Type | Route Example | Type of `params` |
| :--- | :--- | :--- | :--- |
| **Static Route** | No parameters | `src/about/page.tsx` | `Record<string, never>` |
| **Single Dynamic `[id]`** | `string` | `src/blog/[id]/page.tsx` | `{ id: string }` |
| **Catch-All `[...slug]`** | `string[]` | `src/docs/[...slug]/page.tsx` | `{ slug: string[] }` |
| **Optional Dynamic `[[lang]]`** | `string \| undefined` | `src/[[lang]]/page.tsx` | `{ lang?: string }` |
| **Optional Catch-All `[[...opt]]`** | `string[] \| undefined` | `src/shop/[[...opt]]/page.tsx` | `{ opt?: string[] }` |
| **Multiple Dynamic Segments** | Combined by segment | `src/users/[uId]/posts/[pId]/page.tsx` | `{ uId: string; pId: string }` |
| **Nested Optionals** | Positional dependent | `src/inv/[[wh]]/[[aisle]]/page.tsx` | `{ wh?: string; aisle?: string }` |

> [!WARNING]
> **Be cautious with trailing slashes in dynamic links!**
>
> In TypeScript, template literal types evaluate `${string}` as matching *any* string, including the empty string `""` (because `"" extends string` evaluates to `true`).
>
> **The scenario:** Consider a nested route such as `src/posts/[id]/[slug]/page.tsx`, whose generated template literal type is `` `/posts/${string | number}/${string | number}` ``.
>
> If a developer accidentally leaves off the second parameter but appends a trailing slash:
> ```tsx
> <Link href={`/posts/${id}/`}>View</Link>
> ```
> TypeScript matches the first parameter with `id`, the slash with literal `/`, and the second parameter with empty string `""`. However, at runtime Dinou normalizes trailing slashes, requesting `/posts/123` (which results in a **404 Not Found** because no `page.tsx` exists at the parent segment).
>
> **Best Practice:** Always avoid trailing slashes when building dynamic URLs. Written without the trailing slash (`` `/posts/${id}` ``), TypeScript accurately flags the missing parameter at compile-time.

---

### 4. Advanced Usage & Real-World Recipes

#### 4.1. IDE Autocomplete Workflow (Ctrl + Space)

When typing a component, type `PageProps<"">` and press **Ctrl + Space** (or **Cmd + Space** on macOS). Your editor will list every registered route pattern in the project:

```tsx
import type { PageProps } from "dinou";

// Trigger Ctrl + Space inside "" to pick from project routes
export default function BlogPost({ params }: PageProps<"/blog/[slug]">) {
  return <h1>{params.slug}</h1>;
}
```

#### 4.2. Typed Error Pages with ErrorProps

Error boundaries in Dinou v7 strongly type both the captured `error` and the current route's parameters:

```tsx
"use client";

import { useRouter, type ErrorProps } from "dinou";

export default function BlogPostError({ params, error }: ErrorProps<"/blog/[slug]">) {
  const router = useRouter();

  return (
    <div className="error-card p-6 border rounded-xl bg-destructive/10">
      <h2>Failed to load post: {params.slug}</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      {/* Soft reload via Dinou client router */}
      <button onClick={() => router.refresh()}>Try Again</button>
    </div>
  );
}
```

#### 4.3. Custom Navigation Components with DinouRoute

When creating design-system components (e.g., custom buttons, sidebar items, dropdown menus), use the exported `DinouRoute` union type to pass through autocomplete and validation:

```tsx
import type { DinouRoute } from "dinou";
import { Link } from "dinou";

interface NavButtonProps {
  href: DinouRoute; // 👈 Inherits full autocompletion and route validation
  label: string;
}

export function NavButton({ href, label }: NavButtonProps) {
  return (
    <Link href={href} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium">
      {label}
    </Link>
  );
}

// In your application code:
const menu: { label: string; href: DinouRoute }[] = [
  { label: "Overview", href: "/docs" },              // ✅ Autocompleted
  { label: "Routing", href: "/docs/routing" },        // ✅ Autocompleted
  // { label: "Broken", href: "/non-existent-page" }, // ❌ TypeScript compile error!
];
```

#### 4.4. Dynamic Navigation with Typed Interpolation

Dinou types template literal strings against dynamic route definitions, catching broken template strings while accepting valid parameters:

```tsx
import { Link, useRouter } from "dinou";

interface Product {
  id: string;
  name: string;
}

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();

  return (
    <div className="card p-4 border rounded-xl">
      {/* String interpolation verified against `/products/${string | number}` */}
      <Link href={`/products/${product.id}`}>{product.name}</Link>

      <button onClick={() => router.push(`/products/${product.id}`)}>
        View Details
      </button>
    </div>
  );
}
```

---

### 5. Technical Architecture: Under the Hood

Dinou coordinates compilation, route scanning, and TypeScript declarations through a zero-dependency architecture:

1. **Filesystem `src/` Directory:** Synchronous read and structural crawl of all page and layout files.
2. **Scanner (`generate-route-types`):** Low-overhead in-memory scanner completes in under 2ms.
3. **Type Emission (`.dinou/types/routes.d.ts`):** Emits ambient module declarations extending the `"dinou"` package interface with exact union types (`DinouRoute`) and parameter maps (`DinouRouteParams`).
4. **IDE & TypeScript Consumption:** VS Code, Cursor, and the TypeScript compiler immediately read the declarations via `tsconfig.json` without requiring editor restarts or language server reboots.

---

### 6. Lifecycle: Dev Server & Production Builds

How Dinou keeps route typings strictly synchronized across local development and deployment pipelines:

- **6.1. Local Dev (Hot Watcher):** During `npm run dev`, Dinou arms a low-overhead filesystem watcher on `src/`. Whenever a `page.(tsx|jsx|ts|js)` file is added, renamed, or deleted, `.dinou/types/routes.d.ts` regenerates in under 2ms.
- **6.2. Production Builds:** Running `npm run build` runs route type generation as step 0 before bundling. If code references a non-existent route, TypeScript type checking fails the build before deploying.
- **6.3. CI / Type Checkers:** Run `npx tsc --noEmit` in CI pipelines to validate link integrity across the entire project deterministically.

---

### 7. Backward Compatibility Guarantee

- **100% Backward Compatible:** Existing components without explicit generic parameters continue to work without modification. You can continue using `export default function Page({ params }: any)` or generic `PageProps` during progressive migrations.
- **Graceful Fallback Mode:** If `.dinou/types/routes.d.ts` has not yet been generated (e.g., fresh clone prior to `npm run dev` or `npm run build`), types gracefully fallback to permissive strings (`string & {}`), ensuring clean `git checkout` and initial install steps without blocking developer workflows.

## Component Architecture: Server and Client Components

Dinou is built natively on the **React 19 Server Components (RSC)** specification. Rather than treating your entire application as a single monolithic client-side bundle, Dinou partitions components into two distinct execution environments:
- **Server Components (RSC):** The default component type in Dinou. Rendered to HTML on the server (SSR) with zero client JavaScript. Never hydrated in the browser, eliminating bundle overhead while providing direct access to databases, the filesystem, and private secrets.
- **Client Components:** Opt-in with `"use client"`. Also pre-rendered to HTML on the server (SSR) for instant first paint, and then hydrated with interactive JavaScript in the browser to enable local state (`useState`, `useActionState`), event listeners (`onClick`), and browser APIs.

### 1. Overview & Dual-Component Model

Dinou's dual-component model allows you to seamlessly mix server-rendered backbones with interactive client islands:

| Feature | Server Components (RSC) | Client Components |
| :--- | :--- | :--- |
| **Default in Dinou?** | **Yes** (all components inside `src/`) | No (requires explicit `"use client"`) |
| **Execution Environment** | Server only (Node.js, Bun, Deno, Cloudflare Workers) | Server (pre-rendering SSR) + Browser (hydration) |
| **Client JS Bundle Impact** | **0 KB** (Zero client JavaScript overhead) | Ships component JS code to the browser |
| **Backend & Secret Access** | Direct access to DB, ORM, filesystem, private env vars | Cannot access backend resources or private secrets |
| **Interactivity & State** | Pure static output; no state or DOM event listeners | Full React state, hooks, effects, and DOM events |
| **Data Fetching Pattern** | Direct top-level `await` inside component body | Props passed from RSC, React 19 `use()`, or Server Functions |

#### 1.1. The RSC Mental Model

Think of **Server Components** as the backbone of your application that orchestrates data fetching, layouts, and non-interactive UI (rendering pure HTML with zero client JavaScript). **Client Components** act as interactive "islands" or leaves embedded inside the server tree.

The server streams HTML and React Flight JSON representations across an open HTTP connection. The browser consumes this stream without ever downloading the JavaScript source code of your Server Components.

---

### 2. Server Components (RSC)

In Dinou, **every component inside `src/` is a Server Component by default** unless explicitly marked with `"use client"`. They execute exclusively on the server and never ship their implementation code to the browser.

#### 2.1. Capabilities & Backend Access

- **Direct Async Execution:** Server Components can be `async` functions. You can `await` database queries, ORM calls, microservices, or files directly inside the component body.
- **Zero Client Bundle Impact:** Large dependencies imported into Server Components (e.g., Markdown parsers, SQL drivers, encryption packages) are never downloaded or executed by the browser.
- **Secure Secret Access:** Database credentials, private API keys, and environment variables stay strictly on the server without risk of client exposure.
- **Automatic Streaming with `<Suspense>`:** When slow asynchronous operations are wrapped in React `<Suspense>`, the layout shell and fallback UI can be delivered immediately without waiting for slow queries, while data streams progressively into the HTTP response.

```tsx
// src/users/page.tsx (Server Component by default)
import { getContext } from "dinou";
import { db } from "@/lib/db"; // Never bundled to the client!

export default async function UsersPage() {
  // Direct backend query without an intermediary REST API
  const users = await db.user.findMany({ take: 10 });

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Registered Users</h1>
      <ul className="mt-4 divide-y">
        {users.map((user) => (
          <li key={user.id} className="py-2 flex justify-between">
            <span>{user.name}</span>
            <span className="text-xs font-mono text-muted-foreground">{user.email}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

> [!NOTE]
> **TTFB & Execution Timing Note:**
> - **Static by Default (SSG):** In Dinou, this page is pre-rendered at build time by default. The database query runs during `npm run build`, serving static HTML to visitors with **instant TTFB (0ms server wait)**.
> - **Dynamic Routes:** If the route is marked dynamic (e.g. `revalidate = 0` in `page_functions.ts` or reading cookies), a top-level `await` blocks the entire HTTP response until the query finishes. To preserve instant TTFB on dynamic routes, delegate the `await` to a child component wrapped in React `<Suspense>`.

##### Non-Blocking Streaming with React `<Suspense>`

By delegating asynchronous queries to child components wrapped in `<Suspense>`, the outer layout and fallback UI are sent immediately:

```tsx
// src/users/page.tsx - Non-blocking streaming layout
import { Suspense } from "react";
import { db } from "@/lib/db";
import { UsersSkeleton } from "./skeleton";

export default function UsersPage() {
  return (
    <main className="p-8 max-w-4xl mx-auto">
      {/* 1. The outer shell is sent immediately (instant TTFB) */}
      <h1 className="text-2xl font-bold">Registered Users</h1>

      {/* 2. Displays fallback while the child query resolves */}
      <Suspense fallback={<UsersSkeleton />}>
        <UsersList />
      </Suspense>
    </main>
  );
}

// Child component handles the async query independently
async function UsersList() {
  const users = await db.user.findMany({ take: 10 });
  return (
    <ul className="mt-4 divide-y">
      {users.map((u) => (
        <li key={u.id} className="py-2 flex justify-between">
          <span>{u.name}</span>
          <span className="text-xs font-mono text-muted-foreground">{u.email}</span>
        </li>
      ))}
    </ul>
  );
}
```

##### How `<Suspense>` Behaves Across Rendering Strategies

| Strategy | Compiler & Runtime Behavior | Fallback Skeleton Behavior | Trade-off |
| :--- | :--- | :--- | :--- |
| **Pure SSG (Static)** | The compiler automatically awaits all Suspense boundaries during `npm run build` and writes the resolved HTML directly into the static artifact. | Visitors **never** see the loading skeleton because the fallback is eliminated once the build settles. | `0ms` TTFB from CDN edge, but data reflects build-time state (stale until next build/revalidation). |
| **Pure Dynamic SSR** | The server flushes the layout shell and `<Suspense fallback={<Skeleton />}>` immediately over the open HTTP connection. | The user sees the skeleton while waiting, and React streams the resolved HTML chunk when the query finishes. | 100% fresh data and non-blocking layout, but incurs continuous server compute costs, DB load, and request-time latency. |
| **Partial Prerendering (PPR)** | The outer layout shell and the fallback skeleton are pre-rendered at build time and served immediately with `0ms` TTFB from the CDN edge. | The skeleton renders instantly from static cache, while the server concurrently executes only the dynamic query and streams live data into the hole. | Combines the instant delivery of SSG with the fresh, live data of dynamic SSR at minimal server compute cost. |

#### 2.2. Constraints & Limitations

Because Server Components do not execute in the browser, they cannot use browser-specific or client-interactive features:
- **Cannot use state or lifecycle hooks:** `useState`, `useEffect`, `useReducer`, `useLayoutEffect`.
- **Cannot attach interactive client DOM event listeners:** `onClick`, `onChange`, `onSubmit`, `onKeyDown`.
- **Cannot access browser globals:** `window`, `document`, `localStorage`, `navigator`, `geolocation`.
- **Cannot consume (read) React Context directly:** Server Components cannot call `useContext()` or `use(Context)`. (While Server Components can render `<Context>` providers for client children, they cannot read context values themselves).

---

### 3. Client Components

Client Components provide rich, real-time client-side interactivity. They enable event handlers, local component state, animations, and access to browser APIs.

#### 3.1. Interactivity & Browser APIs

Client Components have complete access to the client-side React ecosystem:
- Full state management with `useState`, `useReducer`, and React 19 `useActionState`.
- Side effects, timers, and DOM subscriptions via `useEffect` and `useLayoutEffect`.
- DOM event handling (clicks, hovers, drags, keystrokes, form submissions).
- Browser Web APIs (`localStorage`, Geolocation, `IntersectionObserver`, Audio).
- Consuming React Context providers created on the client.

#### 3.2. Server Pre-Rendering Notice

A common point of confusion is assuming Client Components execute exclusively in the browser. In Dinou, **Client Components are pre-rendered on the server to HTML during initial page load** to ensure instant First Contentful Paint (FCP) and optimal SEO indexing before hydrating in the browser.

> [!WARNING]
> **SSR Execution Safety Rule:**
> Because Client Components run on the server during pre-rendering, accessing browser globals directly in the root of the component function (e.g. `const token = localStorage.getItem("token")`) will throw a server runtime error.
> 
> Always defer browser-only API access inside `useEffect` or guard it with an environment check:
> ```tsx
> if (typeof window !== "undefined") {
>   const token = localStorage.getItem("auth_token");
> }
> ```

---

### 4. The `"use client"` Directive

To declare a component as a Client Component, add the `"use client"` directive at the very top of the file, before any import statements or comments.

#### 4.1. Establishing Module Boundaries

The directive is not a runtime function call—it is an instruction to the bundler (esbuild, Rollup, Webpack) that defines the network split point:

```tsx
"use client"; // Must be at the very top of the file!

import { useState } from "react";

export function Counter({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = useState(initial);

  return (
    <button
      onClick={() => setCount((c) => c + 1)}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
    >
      Count: {count}
    </button>
  );
}
```

#### 4.2. Import Cascading Behavior

Once a file declares `"use client"`, all components, utility modules, and third-party libraries imported by that file are automatically treated as part of the client bundle. You do not need to add `"use client"` to child modules imported by a Client Component.

---

### 5. Data Serialization Boundary

When passing props from a Server Component to a Client Component, data crosses the network boundary (serialized as React Flight JSON). Props passed across this boundary must be **serializable**.

#### 5.1. Supported Data Types

- **Serializable (Allowed across boundary):**
  - **Primitives:** `string`, `number`, `boolean`, `null`, `undefined`, `bigint`.
  - **Plain Objects & Arrays:** Objects with serializable values (e.g. `{ id: 1, name: "Dinou" }`).
  - **Dates:** `Date` objects are serialized and reconstructed by React on the client.
  - **React Elements (JSX):** Server Components passed as `children` or named slot props.
  - **Promises:** Passed directly from Server to Client (read with React 19's native `use()`).
  - **Server Functions:** Bound action functions declared with `"use server"`.
- **Non-Serializable (Blocked across boundary):**
  - **Client Functions:** Cannot pass client callbacks (e.g. `onClick={() => ...}`) from Server Components.
  - **Class Instances:** Complex prototypes, database connections, and ORM class instances (e.g. Prisma models with methods) will lose their prototype.
  - **Symbols & WeakMaps:** Non-enumerable or memory-bound JavaScript data structures.
  - **Browser DOM Elements:** Native HTML DOM nodes (`window`, `document.body`).

#### 5.2. Passing Promises & React 19 `use()`

React 19 supports passing an unresolved **Promise** as a prop from a Server Component to a Client Component. The Client Component reads the promise synchronously using the `use()` hook, automatically triggering Suspense fallbacks until the promise settles:

```tsx
// Server Component
import { Suspense } from "react";
import { UserProfile } from "./user-profile"; // "use client"

export default function Page() {
  // Start fetching without awaiting!
  const userPromise = fetchUserData();

  return (
    <Suspense fallback={<div>Loading profile skeleton...</div>}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

```tsx
// Client Component (user-profile.tsx)
"use client";
import { use } from "react";

export function UserProfile({ userPromise }: { userPromise: Promise<{ name: string; role: string }> }) {
  // Unwraps the promise value seamlessly inside Suspense without useEffect
  const user = use(userPromise);
  return <h2>Hello, {user.name} ({user.role})</h2>;
}
```

---

### 6. Architectural Patterns & Best Practices

Dinou empowers you to choose the exact architectural balance between server performance and client ergonomics. Follow these battle-tested patterns for optimal architecture:

#### 6.1. Interactive Leaves at the Edges (Recommended)

Keep your layouts, route pages, and static wrappers as Server Components. Only push the `"use client"` boundary down to small, interactive "leaf" components (such as an upvote button, search box, or dropdown menu).

```
src/dashboard/layout.tsx              → Server Component (zero client JS)
src/dashboard/page.tsx                → Server Component (fetches data directly)
src/dashboard/_components/search-bar.tsx  → "use client" (interactive leaf)
src/dashboard/_components/action-button.tsx  → "use client" (interactive leaf)
```

#### 6.2. Composition: Server Components as Children

A Client Component **cannot directly import a Server Component** (because bundling a Server Component into the client module would defeat the RSC boundary). However, a Client Component can receive Server Components as `children` or via named JSX props!

```tsx
// Client Component: ModalContainer.tsx
"use client";
import { useState, type ReactNode } from "react";

export function ModalContainer({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      {isOpen && (
        <div className="modal-backdrop">
          {/* children is rendered on the server and passed as pre-rendered JSX! */}
          {children}
        </div>
      )}
    </div>
  );
}

// Server Component: page.tsx
import { ModalContainer } from "./ModalContainer";
import { HeavyServerProfile } from "./HeavyServerProfile"; // Server Component

export default function Page() {
  return (
    <ModalContainer>
      {/* HeavyServerProfile remains 100% on the server! */}
      <HeavyServerProfile />
    </ModalContainer>
  );
}
```

#### 6.3. Client-First with Server Data (`getProps`)

If you are building an interactive canvas, video editor, or complex SPA dashboard and prefer traditional React where you can use `useState` and `onClick` anywhere in the page without boundary splitting, use Dinou's **Client-First Model**:

```tsx
// src/canvas/page_functions.ts - Runs securely on the server
import { db } from "@/lib/db";

export async function getProps(params: { id: string }) {
  const project = await db.projects.findById(params.id);
  return { project };
}

// src/canvas/page.tsx - Entire page is a Client Component
"use client";
import { useState } from "react";

export default function CanvasPage({ project }: { project: any }) {
  // Full access to state, effects, and events everywhere in the file!
  const [layers, setLayers] = useState(project.initialLayers);

  return (
    <div onClick={() => console.log("clicked")}>
      <Toolbar onAddLayer={(l) => setLayers([...layers, l])} />
      <Stage layers={layers} />
    </div>
  );
}
```

> [!TIP]
> **Advantage:** Fast development speed and traditional React ergonomics, while preserving secure backend data fetching and SSR pre-rendering.

#### 6.4. Granular Caching with `<DinouCacheSlot>` (Vertical Micro-ISR)

A common architectural trap in dynamic RSC applications is converting heavy server widgets into Client Components just to gain client-side memory caching (such as SWR or TanStack Query). In Dinou, `<DinouCacheSlot>` provides **component-level server caching (Vertical Segmentation)** directly in the RSC layer.

- **The Common Mistake (Demoting to Client):** To avoid running an expensive 2-second database query on every dynamic page load, developers often convert the widget to `"use client"` with a client cache. This bloats the client JS bundle, loses direct database access, exposes internal API endpoints, and introduces client-side network waterfalls.
- **Dinou's Solution (`<DinouCacheSlot>`):** Keep the component on the server! `<DinouCacheSlot>` caches the rendered RSC Flight payload of that specific subtree on the server for a designated TTL (e.g. 300s). The rest of the page remains 100% dynamic, while the expensive subtree serves in 0ms.

##### Can a `<DinouCacheSlot>` Contain Client Components?

**Yes, absolutely.** While `<DinouCacheSlot>` itself is an async Server Component that executes exclusively on the server, its children can freely render interactive Client Components. Dinou caches the Client Component reference along with its pre-computed props. The client hydrates it normally with full interactivity (events, state, animations):

```tsx
// 1. Client Component: interactive-chart.tsx (Hydrates with 100% interactivity)
"use client";
import { useState } from "react";

export function InteractiveChart({ data }: { data: any }) {
  const [zoom, setZoom] = useState(1);
  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold">Metrics (Zoom: {zoom}x)</span>
        <button
          onClick={() => setZoom((z) => z + 1)}
          className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded"
        >
          Zoom In
        </button>
      </div>
      <canvas data-zoom={zoom} />
    </div>
  );
}

// 2. Server Component: page.tsx (Dynamic page with an isolated cached slot)
import { Suspense } from "react";
import { DinouCacheSlot } from "dinou";
import { db } from "@/lib/db";
import { UserGreeting } from "./UserGreeting"; // Reads user session/cookies
import { GreetingSkeleton, AnalyticsSkeleton } from "./skeletons";
import { InteractiveChart } from "./interactive-chart"; // Client Component

// Server Component performing the heavy query
async function HeavyAnalyticsWidget() {
  const analyticsData = await db.analytics.aggregateBigData(); // 2-second query
  return <InteractiveChart data={analyticsData} />;
}

export default function DashboardPage() {
  return (
    <main className="space-y-6 p-8">
      {/* Dynamic personal component: reads cookies/session without blocking initial layout delivery (preserves fast TTFB) */}
      <Suspense fallback={<GreetingSkeleton />}>
        <UserGreeting />
      </Suspense>

      {/* Micro-ISR hole: wrapped in Suspense so cache misses stream without blocking TTFB */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <DinouCacheSlot id="analytics-slot" duration={300} tags={["analytics"]}>
          <HeavyAnalyticsWidget />
        </DinouCacheSlot>
      </Suspense>
    </main>
  );
}
```

- **Why wrap in `<Suspense>`?** While `<DinouCacheSlot>` works without it on cache hits, on a *cache miss* (cold start or expired TTL) an unwrapped slot would block the entire HTTP response during the heavy query. Wrapping it in `<Suspense>` guarantees instant TTFB by streaming the layout and skeleton immediately.
- **What about `UserGreeting`?** In dynamic SSR, wrapping `UserGreeting` in `<Suspense>` ensures that reading user session or auth cookies does not delay the initial response, keeping TTFB fast. In PPR, it also prevents dynamic request data from de-optimizing the build-time static shell.
- **In-Place Client Refresh:** Any Client Component can trigger an on-demand re-render of only this slot using `refreshSlot("analytics-slot")` from `"dinou"` without reloading the page or resetting state in other components.
- **On-Demand Invalidation:** Server Functions and webhooks can invalidate the slot cache immediately via `revalidateTag("analytics")`.

#### 6.5. The Synergy: Partial Prerendering (PPR) + `<DinouCacheSlot>`

What happens when you nest `<DinouCacheSlot>` inside a React `<Suspense>` boundary on a page with **Partial Prerendering (PPR)**? You unlock the highest performance profile possible in full-stack web engineering: **zero-delay initial delivery paired with near-zero streaming delay and 99.9% database query offloading**.

| Metric | PPR Alone (Without Slot) | PPR + `<DinouCacheSlot>` |
| :--- | :--- | :--- |
| **Architecture** | Static shell + on-demand dynamic execution | Instant shell + cached streaming hole |
| **TTFB (First Byte)** | `0ms` from CDN edge (instant outer layout) | `0ms` from CDN edge (instant outer layout) |
| **Skeleton Duration** | The user waits the full query duration (e.g. 1,200ms) on *every single request* while the server executes the query. | **~5ms!** Subsequent visitors receive the cached RSC stream chunk almost immediately; the skeleton barely blinks. |
| **Database Load** | 10,000 visitors per minute = **10,000 database queries** executed on the server. | 10,000 visitors per minute with `duration={60}` = **1 database query** per minute (**99.99% reduction**). |

##### Implementation Example

Wrap the slow asynchronous Server Component with `<DinouCacheSlot>`, and then enclose both inside React `<Suspense>`:

```tsx
// src/dashboard/page.tsx - High-traffic operational dashboard
import { Suspense } from "react";
import { DinouCacheSlot } from "dinou";
import { db } from "@/lib/db";
import { MetricsSkeleton } from "./MetricsSkeleton";
import { InteractiveMetricsChart } from "./InteractiveMetricsChart"; // "use client"

// Heavy async Server Component
async function HeavyMetricsSubtree() {
  // Heavy aggregation across millions of database rows (e.g. 1.5 seconds)
  const aggregatedStats = await db.telemetry.aggregateOperations();
  return <InteractiveMetricsChart data={aggregatedStats} />;
}

export default function DashboardPage() {
  return (
    <main className="p-8 space-y-6 max-w-5xl mx-auto">
      {/* 1. PPR Static Shell: Delivered instantly with 0ms TTFB from edge CDN */}
      <header className="border-b pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Operations Command Center</h1>
        <p className="text-sm text-muted-foreground">Real-time system telemetry and infrastructure health.</p>
      </header>

      {/* 2. PPR Dynamic Boundary + Cache Slot:
             - Fallback skeleton sent immediately in initial layout
             - Dynamic hole streams from server cache in ~5ms for subsequent users
             - Database query executes only ONCE every 60 seconds */}
      <Suspense fallback={<MetricsSkeleton />}>
        <DinouCacheSlot id="operations-telemetry" duration={60} tags={["telemetry"]}>
          <HeavyMetricsSubtree />
        </DinouCacheSlot>
      </Suspense>
    </main>
  );
}
```

- **Instant TTFB:** Outer shell and fallback skeleton arrive at `0ms` from CDN edge.
- **99.9% Query Relief:** Caches the dynamic stream chunk on the server during the TTL window.
- **Surgical Invalidation:** Call `revalidateTag("telemetry")` or `refreshSlot()` to update without full-page reloads.

#### 6.6. When Should You Use `<DinouCacheSlot>?`

A common question in full-stack architecture is: *Does `<DinouCacheSlot>` only make sense for dynamic components or subtrees?*

**The short answer:** While dynamic routes and PPR are where it delivers exponential returns, it also unlocks unique capabilities for static pages (such as **asymmetric revalidation** and **in-place client slot refreshes**). Understanding when to use it boils down to the distinction between **Horizontal Segmentation** (route/layout-level) and **Vertical Segmentation** (component-level).

##### When NOT to Use `<DinouCacheSlot>` (Redundant or Anti-Patterns)

1. **100% Static Pages (SSG):** If an entire route is pre-rendered at build time with no revalidation, it is already cached as immutable HTML at the CDN Edge. Wrapping parts of it in a slot adds zero caching benefit.
2. **Wrapping the Entire Page:** Wrapping your entire `page.tsx` body inside a slot reinvents horizontal caching. Use `export const revalidate = 300` in `page_functions.ts` instead.
3. **Unpartitioned Private Data:** Wrapping personal user data (e.g. private user carts or session tokens) with a static slot ID will cache that private data for the first user and leak it to subsequent visitors.

##### When `<DinouCacheSlot>` Delivers 10x Value (Recommended Scenarios)

1. **Heavy, Computationally Expensive Widgets in Dynamic / Authenticated Pages:** Dynamic pages (reading cookies, auth tokens, or search params) cannot be cached at the CDN or route level because each user receives a customized response. However, many widgets on that page (stock tickers, trending feeds, heavy SQL analytics) are identical across users. `<DinouCacheSlot>` isolates the expensive widget with its own TTL:

```tsx
// src/routes/dashboard/page.tsx (Dynamic authenticated SSR)
import { Suspense } from "react";
import { DinouCacheSlot } from "dinou";
import { getSession } from "@/lib/auth";
import { GlobalMetricsWidget } from "./metrics";

export default async function DashboardPage() {
  const session = await getSession(); // Evaluated dynamically per user

  return (
    <div className="p-6">
      <h1>Welcome back, {session.user.name}</h1> {/* 100% Live & personal */}

      {/* Global widget: cached for 10 minutes on the server across all users */}
      <Suspense fallback={<div>Loading global telemetry...</div>}>
        <DinouCacheSlot id="global-metrics" duration={600} tags={["metrics"]}>
          <GlobalMetricsWidget />
        </DinouCacheSlot>
      </Suspense>
    </div>
  );
}
```

2. **Dynamic Holes in Partial Prerendering (PPR) — The Ultimate Synergy:** In PPR, the static shell ships instantly from CDN (0ms TTFB), while dynamic holes stream in via React Suspense. Without a slot, **100,000 visitors trigger 100,000 database hits**. Placing `<DinouCacheSlot>` inside the hole means only the first request queries the DB; the other 99,999 stream the cached RSC Flight payload in **~2-5ms**.

3. **Static or ISR Pages with Asymmetric Lifecycles & Targeted Refreshes:** This is where `<DinouCacheSlot>` proves it is **not limited to dynamic pages**. You can use it in static/ISR pages for two critical architectural advantages:
   - **A. Asymmetric Revalidation Lifecycles:** Suppose a product page has heavy media and specifications that rarely change (cached for 24 hours: `revalidate = 86400`). But live stock pricing fluctuates every 60 seconds. A slot lets the pricing widget expire every 60s without re-rendering the whole page!
   - **B. Surgical In-Place Client Refresh (`refreshSlot`):** A Client Component can trigger an on-demand re-render of *only this Server Component* using `refreshSlot(slotId)` without refreshing the browser page or losing client state (scroll position, inputs, audio):

```tsx
// 1. In your Page (Server Component): Asymmetric slot inside static route
<DinouCacheSlot id={`price-${product.id}`} duration={60} tags={["pricing"]}>
  <LivePriceCalculator productId={product.id} />
</DinouCacheSlot>

// 2. In an interactive Client Component: refresh ONLY that slot
"use client";
import { refreshSlot } from "dinou";

export function RefreshPriceButton({ productId }: { productId: string }) {
  return (
    <button onClick={() => refreshSlot(`price-${productId}`, { fresh: true })}>
      Check Latest Stock & Price
    </button>
  );
}
```

##### Quick Decision Checklist

| Question / Requirement | Recommended Action | Reason |
| :--- | :--- | :--- |
| **Dynamic or PPR route with heavy queries?** | Wrap with `<DinouCacheSlot>` inside `<Suspense>` | Protects database from repetitive execution and streams cached RSC Flight chunks in ~2-5ms. |
| **Asymmetric expiration within a page?** | Use `<DinouCacheSlot>` | Decouples widget TTL (e.g. 60s) from overall page TTL (e.g. 24h) without re-rendering the entire page. |
| **Need surgical, targeted client refreshes?** | Use `<DinouCacheSlot>` + `refreshSlot()` | Updates just that server subtree in-place without page reload or state loss. |
| **Pure SSG with uniform expiration?** | **Do NOT** use `<DinouCacheSlot>` | Let build-time SSG and CDN Edge caching handle the entire page with zero runtime overhead. |

#### 6.7. Common Traps & Anti-Patterns to Avoid

- **Trap 1: Placing `"use client"` at the root layout.** Marking `src/layout.tsx` as a Client Component cascades the client boundary to every single page in your application. Root layouts should always be Server Components to protect secrets and enable streaming.
- **Trap 2: Direct Server Component imports in Client files.** Never write `import ServerComponent from "./ServerComponent"` inside a file containing `"use client"`. Use the Composition Pattern (Section 6.2) and pass it as `children` instead.
- **Trap 3: Accessing browser APIs in component body during SSR.** Calling `window.innerWidth` or `localStorage.getItem()` outside of a `useEffect` in a Client Component causes server pre-rendering crashes. Always wrap browser calls in `useEffect` or an environment check (`if (typeof window !== "undefined")`).
- **Trap 4: Passing non-serializable objects across boundaries.** Do not pass callback functions or ORM model class instances with methods as props to Client Components. Extract plain JavaScript objects or use Server Functions (`"use server"`) for actions.
- **Trap 5: Fetching data in Client Components via `useEffect` on mount.** In modern RSC architectures, fetching on mount via `useEffect` creates network waterfalls, causes layout shifts, and misses server streaming. Pass data from Server Components or use Strategy 9 (RSC Promise) / Strategy 12 (Server Function RPC).

---

## Data Fetching: The 13 Strategies

A comprehensive case-by-case engineering guide covering each of the **13 data fetching and rendering patterns** available in Dinou. Every strategy is examined with concrete code snippets, runtime lifecycle behavior, TTFB metrics, server load characteristics, and production trade-offs.

Dinou provides unprecedented architectural flexibility by separating:
1. **Where code executes:** Server Component vs. Client Component.
2. **When data is fetched:** Build time (SSG) vs. Per-request (SSR) vs. On-demand RPC.
3. **How data is delivered:** Blocking TTFB vs. Progressive HTTP Streaming vs. Micro-ISR Caching.

### Data Fetching & Rendering Strategies Matrix

| # | Strategy / Pattern | Execution Context | TTFB (First Byte) | Stream / Content Ready | Server & DB Load | Network Waterfall? | Data Freshness | Ideal Use Case |
| :-: | :--- | :--- | :--- | :--- | :--- | :-: | :--- | :--- |
| **1** | **RSC Direct `await` (SSG)**<br>Top-level `await` or `getProps` in Server Component | Build Time (`npm run build`) | `0ms` (CDN Edge) | Instant (`0ms`) | Zero at Runtime | None | Fixed at build | Blogs, documentation, static marketing pages. |
| **2** | **RSC Direct `await` (Dynamic SSR)**<br>Top-level `await` or `getProps` without `<Suspense>` | Per Request (Server) | Slow (Blocked) | N/A (Blocks TTFB) | Heavy (100% queries) | None | 100% Live | Private views where UI requires a single critical query and waiting is acceptable. |
| **3** | **RSC with `<Suspense>` (SSG)**<br>Static route with async component boundary | Build Time (Compiler awaits) | `0ms` (CDN Edge) | Instant (`0ms`) | Zero at Runtime | None | Fixed at build | Decoupled async components in static pages; outputs final HTML without showing fallback. |
| **4** | **RSC with `<Suspense>` (Dynamic Streaming SSR)**<br>Streaming SSR on demand (without PPR) | Per Request (Server streaming) | Fast (Early Layout) | Waits for DB (1-3s) | Heavy (100% queries) | None | 100% Live | Dynamic routes on runtimes without edge caching or when PPR is disabled. |
| **5** | **RSC + `<Suspense>` + `<DinouCacheSlot>` (Static / Asymmetric ISR)**<br>Pre-rendered static shell with decoupled slot TTL | Build Time (Pre-rendered) + On-Demand Slot Reval | `0ms` (CDN Edge) | Instant (`~0-2ms`) | Near-Zero (Decoupled) | None | Decoupled TTL / `refreshSlot()` | Static/ISR pages containing a widget (stock, pricing) needing fast updates (60s) or surgical in-place client refreshes. |
| **6** | **RSC + `<Suspense>` + `<DinouCacheSlot>` (Dynamic Micro-ISR)**<br>Dynamic streaming with vertical Micro-ISR | Per Request (Cache hit: `~2ms` / Miss: async query) | Fast (Early Layout) | Instant (`~2ms` Cache) | Near-Zero (99% Offload) | None | TTL / Tag Reval | Dynamic routes (with session/cookies) containing heavy widgets (analytics, feeds). Flushes layout instantly; slot streams from cache. |
| **7** | **RSC with `<Suspense>` (PPR Hybrid)**<br>Partial Prerendering (Static Shell + Live Uncached Hole) | Static Shell (Build) + Live Hole (Server on every request) | `0ms` (Shell from Edge) | Slow (Hole waits for DB) | Heavy (100% Hole queries) | None | 100% Live | Instant static layout from Edge with zero-delay live streamed data for real-time personalization. |
| **8** | **PPR + `<DinouCacheSlot>` (Peak Performance Synergy)**<br>Static Edge Shell + Cached Streamed Hole | Edge CDN (Shell) + Server Cache Storage (Slot) | `0ms` (Edge) + `~5ms` (Slot) | Instant (`~2-5ms` Cache) | Near-Zero (99.9% Offload) | None | TTL / Tag Reval | **Peak Performance:** Instant CDN paint (`0ms` TTFB) with 99.9% DB offload. Ideal for high-traffic stores, trending catalogs, and viral portals. |
| **9** | **RSC Promise ➔ Client `use()` (React 19)**<br>RSC initiates un-awaited Promise; Client unwraps via `use()` | Server starts query; Client suspends | `0ms` (with PPR) / Fast | Waits for Promise | Heavy (Live query) | None | 100% Live | Interactive stateful widgets (charts, canvas, filters) needing fresh streaming data without client fetch waterfalls. |
| **10** | **Client-First `getProps` (SSG)**<br>`page_functions.ts` + Client Component | Build Time (`npm run build`) | `0ms` (CDN Edge) | Instant (`0ms`) | Zero at Runtime | None | Fixed at build | Dinou Client-First model for highly interactive static web applications with SPA ergonomics. |
| **11** | **Client-First `getProps` (Dynamic SSR)**<br>`page_functions.ts` + Client Component in SSR | Per Request (Server awaits `getProps`) | Slow (Blocked) | N/A (Blocks TTFB) | Heavy (100% queries) | None | 100% Live | Complex SPAs where developers prefer classic React hooks and tolerate TTFB wait. |
| **12** | **Client Calling Server Function (Initial Mount - Dynamic RPC)**<br>Client Component calls `"use server"` on initial mount | Client RPC on mount | Fast (Shell Only) | Delayed (Waterfall) | Heavy (100% RPC queries) | **YES** (Waterfall) | 100% Live | Supported for isolated widgets, but sub-optimal compared to Strategy 9 due to the second HTTP round trip. |
| **13** | **Client Server Functions (User Actions & Mutations)**<br>Invoked on user button click, form submit, or mutation | Client on user action (POST RPC) | N/A (Post-Load) | N/A (User Event) | On-Demand | None | 100% Live | Standard mutation pattern: Server Functions called inside `useTransition` or form action to mutate DB and revalidate cache. |

---

### 1. RSC Direct await (SSG)

> **Static Site Generation**  
> **TTFB:** `0ms (CDN Edge)` | **Stream Ready:** `Instant (0ms)` | **Server & DB Load:** `Zero at Runtime` | **Waterfall:** `None` | **Data Freshness:** `Build Time`

**How it works:** The default behavior in Dinou. When a page has no dynamic parameters, headers, or cookies, Dinou executes the top-level `await` query during `npm run build`. The compiler resolves the promise, generates static `index.html`, and bakes the pre-compiled binary RSC payload (`page.rsc`).

```tsx
// src/blog/page.tsx (Static Route by Default)
import db from "@/lib/db"; // Stays 100% on the server

export default async function BlogIndexPage() {
  // Executed ONCE during build time ('npm run build')
  const posts = await db.posts.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Engineering Blog</h1>
      <div className="divide-y">
        {posts.map((post) => (
          <article key={post.id} className="py-4">
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <p className="text-muted-foreground text-sm">{post.excerpt}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
```

- **Zero Database Cost:** Millions of visitors can hit the CDN without a single query reaching your database.
- **0kb Client JavaScript:** No React client runtime is shipped for this data layer; the browser receives pure semantic HTML.
- **Ideal For:** Documentation, corporate sites, blogs, release notes, and marketing pages.

#### Server Component Equivalence: `getProps` vs Direct `await`

When a page is a Server Component, fetching data via `getProps` in `page_functions.ts` is functionally equivalent to executing queries directly with top-level `await` inside the component body (Strategies 1 & 2).

Both patterns run exclusively on the server prior to rendering, introduce zero client JavaScript bundle overhead, exhibit identical database latency, and produce the exact same static HTML and pre-compiled `.rsc` payload. The primary architectural purpose of `getProps` is when utilizing the **Client-First Model** (Strategies 10 & 11), where it extracts data on the server to feed directly as initial props into interactive Client Component pages (`"use client"`).

---

### 2. RSC Direct await (Dynamic SSR)

> **Blocking Dynamic SSR**  
> **TTFB:** `Slow (Blocked)` | **Stream Ready:** `N/A (All-or-Nothing)` | **Server & DB Load:** `Heavy (100% queries)` | **Waterfall:** `None` | **Data Freshness:** `100% Live`

**How it works:** The component performs an un-Suspended top-level `await` on a route that is dynamic (e.g., due to reading request headers, cookies, or declaring `export const revalidate = 0` in `page_functions.ts`). The Node.js server halts the HTTP response until the database returns the data.

```typescript
// src/account/billing/page_functions.ts
export const revalidate = 0; // Force dynamic SSR on every request
```

```tsx
// src/account/billing/page.tsx
import { cookies } from "dinou/server";
import db from "@/lib/db";

export default async function BillingPage() {
  const sessionId = cookies().get("session_id");
  if (!sessionId) throw new Error("Unauthorized");

  // BLOCKS TTFB: The browser receives 0 bytes until this query resolves
  const invoices = await db.invoices.findBySession(sessionId);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Billing History</h1>
      <table className="w-full mt-4">
        {invoices.map((inv) => (
          <tr key={inv.id}>
            <td>{inv.date}</td>
            <td>${inv.amount}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}
```

- **Latency Penalty:** If the database query takes 800ms, the visitor stares at a blank screen for 800ms before First Contentful Paint (FCP).
- **When Acceptable:** Secure internal portals, critical authentication gates, or lightweight single-record lookups where streaming complexity is unnecessary.

---

### 3. RSC with `<Suspense>` (SSG)

> **Static Compilation Settle**  
> **TTFB:** `0ms (CDN Edge)` | **Stream Ready:** `Instant (0ms)` | **Server & DB Load:** `Zero at Runtime` | **Waterfall:** `None` | **Data Freshness:** `Fixed at Build`

**How it works:** You wrap asynchronous child components inside React `<Suspense>` on a static route. During `npm run build`, Dinou's compiler automatically waits for all Suspense boundaries to settle. The final emitted HTML includes the resolved markup directly; visitors never see the fallback skeleton.

```tsx
// src/docs/page.tsx (Static Route with Suspense)
import { Suspense } from "react";
import db from "@/lib/db";
import { DocSkeleton } from "./skeleton";

export default function DocsPage() {
  return (
    <div className="docs-layout">
      <header><h1>API Reference</h1></header>
      {/* Compiler settles this during 'npm run build': */}
      <Suspense fallback={<DocSkeleton />}>
        <AsyncChangelog />
      </Suspense>
    </div>
  );
}

async function AsyncChangelog() {
  const versions = await db.changelog.findLatest();
  return <ChangelogList items={versions} />;
}
```

- **Architectural Cleanliness:** Allows writing decoupled async components without worrying whether the page is static or dynamic.
- **Zero Flash of Skeleton:** Because it is pre-rendered at build time, the browser renders the fully populated UI instantly on initial load.

---

### 4. RSC with `<Suspense>` (Dynamic Streaming SSR)

> **Streaming SSR**  
> **TTFB:** `Fast (Early Layout)` | **Stream Ready:** `Waits for DB (1-3s)` | **Server & DB Load:** `Heavy (100% queries)` | **Waterfall:** `None` | **Data Freshness:** `100% Live`

**How it works:** The page layout and headers are flushed immediately to the browser (fast TTFB). The slow child component executes its database query concurrently. Once resolved, the server sends an HTML chunk through the open HTTP connection that swaps out the skeleton fallback without refreshing the page.

```typescript
// src/analytics/page_functions.ts
export const revalidate = 0; // Dynamic streaming SSR
```

```tsx
// src/analytics/page.tsx
import { Suspense } from "react";
import db from "@/lib/db";
import { AnalyticsSkeleton } from "./skeleton";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Flushed immediately in chunk 1 (Early TTFB) */}
      <header>
        <h1 className="text-2xl font-bold">Revenue Analytics</h1>
        <p className="text-muted-foreground text-sm">Real-time calculations</p>
      </header>

      {/* Flushes skeleton in chunk 1, then streams resolved HTML in chunk 2 */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <SlowHeavyMetrics />
      </Suspense>
    </div>
  );
}

async function SlowHeavyMetrics() {
  // Heavy 1.5-second aggregation query:
  const data = await db.analytics.aggregateMonthlyRevenue();
  return <MetricsTable stats={data} />;
}
```

- **UX Advantage:** The visitor immediately sees navigation, page shell, and skeleton placeholders instead of an unresponsive blank screen.
- **Caveat:** Every single request still runs the full database query. For high traffic, protect this with Strategy 6.

#### Architectural Equivalence: Async Server Component vs Server Function UI Return

Instead of declaring an inline async Server Component (`SlowHeavyMetrics`), you can alternatively execute the query inside an isolated Server Function (tagged with `"use server"`) that directly renders and returns the JSX component tree, and invoke it directly inside `<Suspense>`:

```typescript
// src/analytics/server-functions.ts
"use server";

import db from "@/lib/db";
import { MetricsTable } from "./metrics-table";

export async function getMetricsTable() {
  const data = await db.analytics.aggregateMonthlyRevenue();
  return <MetricsTable stats={data} />;
}
```

```tsx
// src/analytics/page.tsx
import { Suspense } from "react";
import { AnalyticsSkeleton } from "./skeleton";
import { getMetricsTable } from "./server-functions";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">Revenue Analytics</h1>
      </header>

      {/* Directly invoke getMetricsTable() inside Suspense (no wrapper component needed!) */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        {getMetricsTable()}
      </Suspense>
    </div>
  );
}
```

Both patterns are functionally equivalent during dynamic streaming:
- **Direct Promise Children:** In React Server Components, `<Suspense>` natively accepts a `Promise<ReactNode>` directly as children (`{getMetricsTable()}`), eliminating boilerplate async wrapper components.
- **Identical HTTP Streaming Behavior:** In both cases, the initial layout shell and `<AnalyticsSkeleton />` are flushed immediately in chunk 1 (fast TTFB). When the query resolves, the server streams the rendered HTML/RSC payload into chunk 2.
- **Zero Client JavaScript:** Database logic, ORM queries, and credentials remain 100% on the server in both solutions.
- **Versatility Bonus:** Returning the JSX tree from a Server Function allows the exact same function to be triggered on-demand by Client Components later (e.g., a "Refresh Metrics" button or live filter) via Dinou's UI streaming RPC.

---

### 5. RSC + `<Suspense>` + `<DinouCacheSlot>` (Static SSG / Asymmetric ISR)

> **Static (SSG) + Micro-ISR**  
> **TTFB:** `0ms (CDN Edge)` | **Stream Ready:** `Instant (~0-2ms)` | **Server & DB Load:** `Near-Zero` | **Waterfall:** `None` | **Data Freshness:** `Decoupled TTL / refreshSlot()`

**How it works:** Solves the "all-or-nothing" revalidation problem. The base outer page and layout are pre-rendered at build time (Static Site Generation - SSG) or configured with long-term ISR (e.g., 24 hours) delivered with `0ms` TTFB from Edge CDN. Meanwhile, an inner volatile component is wrapped in `<DinouCacheSlot>` with a fast TTL (e.g., 60 seconds). The heavy outer page remains immutable at the Edge CDN, while the slot revalidates independently in server memory/KV storage.

```typescript
// src/products/[slug]/page_functions.ts
export const revalidate = 86400; // Outer page revalidates once every 24 hours
```

```tsx
// src/products/[slug]/page.tsx
import { Suspense } from "react";
import { DinouCacheSlot } from "dinou/server";
import { LivePriceTicker, StaticDescription } from "./components";

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  return (
    <div className="product-view">
      {/* Static product description: cached at Edge CDN for 24h */}
      <StaticDescription slug={params.slug} />

      {/* Asymmetric Micro-ISR: revalidates every 60s or via refreshSlot() */}
      <Suspense fallback={<p>Checking live pricing...</p>}>
        <DinouCacheSlot id={`price-${params.slug}`} revalidate={60} tag="pricing">
          <LivePriceTicker slug={params.slug} />
        </DinouCacheSlot>
      </Suspense>
    </div>
  );
}
```

- **Targeted Invalidation:** Calling `refreshSlot("price-prod-1")` or wildcard `refreshSlot("price-*")` from a client button or webhook refreshes only the price widget without rebuilding the 24-hour page cache.
- **Massive Cost Savings:** Prevents volatile widgets from causing full-page rebuild cascades across thousands of static pages.

---

### 6. RSC + `<Suspense>` + `<DinouCacheSlot>` (Dynamic Micro-ISR)

> **Server Cache Stream**  
> **TTFB:** `Fast (Early Layout)` | **Stream Ready:** `~2ms (Cache Hit)` | **Server & DB Load:** `Near-Zero (99% Offload)` | **Waterfall:** `None` | **Data Freshness:** `TTL / Tag Reval`

**How it works:** Used on dynamic routes that depend on user sessions, cookies, or headers. The layout shell streams immediately. Inside the page, heavy components are protected by `<DinouCacheSlot>`. On cache hit, the pre-computed RSC binary chunk is pulled from memory/KV in ~2ms and streamed down without querying PostgreSQL/MongoDB.

```typescript
// src/feed/page_functions.ts
export const revalidate = 0; // Dynamic route with per-request session
```

```tsx
// src/feed/page.tsx
import { Suspense } from "react";
import { DinouCacheSlot } from "dinou/server";
import { UserGreeting, GlobalTrendingWidget } from "./components";

export default function FeedPage() {
  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      {/* 1. Dynamic per-user greeting (computed live on each request) */}
      <div className="col-span-2">
        <UserGreeting />
      </div>

      {/* 2. Global trending feed: cached for 300s in server memory (Micro-ISR) */}
      <aside className="col-span-1">
        <Suspense fallback={<p>Loading trends...</p>}>
          <DinouCacheSlot id="global-trending" revalidate={300} tag="trends">
            <GlobalTrendingWidget />
          </DinouCacheSlot>
        </Suspense>
      </aside>
    </div>
  );
}
```

- **Stream Speed:** Instead of waiting 1.5 seconds for the database on every page visit, the slot resolves in `~2ms` from RAM.
- **Ideal For:** Social feeds, dashboards, recommendations, and search suggestions in authenticated web apps.

---

### 7. RSC with `<Suspense>` (PPR Hybrid)

> **Partial Prerendering**  
> **TTFB:** `0ms (Shell from Edge)` | **Stream Ready:** `Slow (Waits for DB)` | **Server & DB Load:** `Heavy (100% queries)` | **Waterfall:** `None` | **Data Freshness:** `100% Live`

**How it works:** The page enables Partial Prerendering via `export const ppr = true`. At build time, Dinou pre-renders the navigation bar, footer, and component skeletons into immutable CDN artifacts. When a visitor arrives, the Edge CDN responds in `0ms` with the static shell. Simultaneously, the server executes the dynamic hole and streams the live HTML into the open connection.

```typescript
// src/catalog/page_functions.ts
export const ppr = true; // Enables Partial Prerendering
```

```tsx
// src/catalog/page.tsx
import { Suspense } from "react";
import db from "@/lib/db";
import { StockSkeleton } from "./skeleton";

export default function CatalogPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* 0ms TTFB: Served directly from Edge CDN */}
      <header>
        <h1 className="text-3xl font-bold">Catalog & Inventory</h1>
        <p className="text-muted-foreground">Shell painted in 0ms.</p>
      </header>

      {/* Dynamic Hole: Executed on request and streamed live */}
      <Suspense fallback={<StockSkeleton />}>
        <LiveStockBalance />
      </Suspense>
    </div>
  );
}

async function LiveStockBalance() {
  // Query executed on every request:
  const stock = await db.warehouse.getLiveInventory();
  return <p className="font-mono text-emerald-600">{stock} units remaining</p>;
}
```

- **Eliminates the SSR Bottleneck:** The browser parses stylesheets and scripts in `0ms` while the server computes data in the background.
- **Notice:** Because the dynamic hole is uncached, heavy traffic will still send 100% of queries to the database. See Strategy 8 for caching the hole.

---

### 8. PPR + `<DinouCacheSlot>` (Peak Performance Synergy)

> **PPR Hybrid Synergy (Recommended)**  
> **TTFB:** `0ms (Edge CDN)` | **Stream Ready:** `~2-5ms (RAM Cache)` | **Server & DB Load:** `99.9% Offload` | **Waterfall:** `None` | **Data Freshness:** `TTL / Tag Reval`

**How it works:** The gold standard for high-traffic web applications. Combines Partial Prerendering with component-level Micro-ISR. The Edge CDN delivers the static shell in `0ms` TTFB. The server streams the dynamic hole almost instantly (`~2ms`) because the sub-tree is cached in memory/KV storage. Visitors see zero visible skeleton flicker, while database queries are reduced by 99.9%.

```typescript
// src/trending/page_functions.ts
export const ppr = true; // Static Edge Shell
```

```tsx
// src/trending/page.tsx
import { Suspense } from "react";
import { DinouCacheSlot } from "dinou/server";
import { TrendingGrid, TrendingSkeleton } from "./components";

export default function TrendingPage() {
  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      {/* 1. Static Layout: delivered immediately with 0ms TTFB from CDN Edge */}
      <header>
        <h1 className="text-3xl font-bold">Trending Products</h1>
        <p className="text-muted-foreground text-sm">Ultra-high traffic viral catalog.</p>
      </header>

      {/* 2. Micro-ISR Slot: resolves in ~2ms from server memory/KV cache without DB query */}
      <Suspense fallback={<TrendingSkeleton />}>
        <DinouCacheSlot id="viral-trending" revalidate={120} tag="trending">
          <TrendingGrid />
        </DinouCacheSlot>
      </Suspense>
    </main>
  );
}
```

- **Benchmarked Throughput:** Under a spike of 50,000 requests/minute, only 1 query hits the database every 120 seconds.
- **User Experience:** `0ms` TTFB first paint + `~2ms` content resolution = feels like a static page with near-live freshness.

---

### 9. RSC Promise ➔ Client `use()` (React 19)

> **Promise Streaming**  
> **TTFB:** `0ms (with PPR) / Fast` | **Stream Ready:** `Waits for Promise` | **Server & DB Load:** `Heavy (Live query)` | **Waterfall:** `None` | **Data Freshness:** `100% Live`

**How it works:** In React 19, Server Components can start an asynchronous data fetch without `await`, and pass the raw `Promise` across the flight serialization boundary to a Client Component. The Client Component unwraps it synchronously using the native `use()` hook inside `<Suspense>`. No `useEffect`, no client fetch cascades, and no duplicate network requests!

```tsx
// src/search/page.tsx (Server Component)
import { Suspense } from "react";
import db from "@/lib/db";
import { SearchResultsClient } from "./search-results-client";

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q || "";

  // Start query WITHOUT awaiting! Passes un-awaited Promise to client:
  const resultsPromise = db.products.search({ query });

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Search Catalog</h1>
      <Suspense key={query} fallback={<p className="text-muted-foreground">Searching catalog...</p>}>
        <SearchResultsClient promise={resultsPromise} />
      </Suspense>
    </main>
  );
}
```

```tsx
// src/search/search-results-client.tsx
"use client";

import { use, useState } from "react";

export function SearchResultsClient({ promise }: { promise: Promise<Product[]> }) {
  // Native React 19 hook: unwraps the Flight RPC promise directly
  const products = use(promise);
  const [filterPrice, setFilterPrice] = useState(100);

  return (
    <div>
      <input 
        type="range" 
        max={500} 
        value={filterPrice} 
        onChange={(e) => setFilterPrice(+e.target.value)} 
      />
      <ul>
        {products.filter((p) => p.price <= filterPrice).map((p) => (
          <li key={p.id}>{p.name} - ${p.price}</li>
        ))}
      </ul>
    </div>
  );
}
```

- **Zero Waterfall:** The server initiates the query before the client even finishes parsing JavaScript.
- **Interactive State:** The client component immediately has access to full client hooks (`useState`, `useMemo`) to filter or mutate UI state.

---

### 10. Client-First `getProps` (SSG)

> **Static Client Model**  
> **TTFB:** `0ms (CDN Edge)` | **Stream Ready:** `Instant (0ms)` | **Server & DB Load:** `Zero at Runtime` | **Waterfall:** `None` | **Data Freshness:** `Fixed at Build`

**How it works:** The page uses Dinou's Client-First Model. Data is retrieved on the server at build time via `getProps` in `page_functions.ts`, while `page.tsx` is an interactive Client Component marked with `"use client"`. The build generates static HTML with pre-serialized props, which hydrates into a full SPA on load.

```typescript
// src/whiteboard/page_functions.ts
import db from "@/lib/db";

export async function getProps() {
  const defaultTemplates = await db.templates.findDefaults();
  return { defaultTemplates };
}
```

```tsx
// src/whiteboard/page.tsx
"use client";

import { useState } from "react";
import { CanvasStage, ToolPalette } from "@/components/canvas";

export default function WhiteboardPage({ defaultTemplates }: { defaultTemplates: any[] }) {
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplates[0]);

  return (
    <div className="h-screen flex flex-col">
      <ToolPalette onSelect={setSelectedTemplate} />
      <CanvasStage initialData={selectedTemplate} />
    </div>
  );
}
```

- **Ergonomics:** Perfect for developers migrating from Vite/CRA who want classic React hooks everywhere without losing SSG SEO and `0ms` TTFB.

---

### 11. Client-First `getProps` (Dynamic SSR)

> **Dynamic Client SSR**  
> **TTFB:** `Slow (Blocked)` | **Stream Ready:** `N/A (Blocks TTFB)` | **Server & DB Load:** `Heavy (100% queries)` | **Waterfall:** `None` | **Data Freshness:** `100% Live`

**How it works:** The same Client-First approach as Strategy 10, but configured for on-demand dynamic execution (e.g., dynamic params or `revalidate = 0`). On every request, the server executes `getProps`, passes the data into the client page component, and renders the initial HTML document.

```typescript
// src/editor/[docId]/page_functions.ts
import db from "@/lib/db";

export const revalidate = 0; // Dynamic SSR

export async function getProps(params: { docId: string }) {
  const document = await db.documents.findById(params.docId);
  return { document };
}
```

```tsx
// src/editor/[docId]/page.tsx
"use client";

import { useState } from "react";

export default function DocumentEditor({ document }: { document: any }) {
  const [content, setContent] = useState(document.initialBody);

  return (
    <div className="editor-container">
      <textarea value={content} onChange={(e) => setContent(e.target.value)} />
    </div>
  );
}
```

- **Trade-off:** Because the server waits for `getProps` before sending the first byte, TTFB is slower compared to streaming patterns.
- **Advantage:** Eliminates client-side spinner flashing upon initial navigation compared to classic Single Page Apps.

---

### 12. Client Calling Server Function (Initial Mount - Dynamic RPC)

> **Initial Mount RPC**  
> **TTFB:** `Fast (Shell Only)` | **Stream Ready:** `Delayed (Waterfall)` | **Server & DB Load:** `Heavy (100% RPC)` | **Waterfall:** `YES (Waterfall)` | **Data Freshness:** `100% Live`

**How it works:** A Client Component triggers a Server Function on initial mount via RPC. In Dinou and modern React 19, this is accomplished without legacy `useEffect` hooks; instead, the initial Server Function promise is initialized in state or component instantiation and unwrapped synchronously using React 19's native `use()` hook inside `<Suspense>`.

```typescript
// src/dashboard/server-functions.ts
"use server";

import db from "@/lib/db";

export async function fetchDashboardStats() {
  const count = await db.users.count();
  const active = await db.users.countActiveSessions();
  return { count, active };
}
```

```tsx
// src/dashboard/dashboard-stats-widget.tsx
"use client";

import { useState, use, Suspense } from "react";
import { fetchDashboardStats } from "./server-functions";

function StatsContent({ promise }: { promise: Promise<{ count: number; active: number }> }) {
  // Pure React 19 use() unrolls the Flight RPC promise within Suspense (no useEffect!)
  const data = use(promise);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-3 border rounded-lg bg-card">
        <span className="text-xs text-muted-foreground block">Total Users</span>
        <strong className="text-xl">{data.count}</strong>
      </div>
      <div className="p-3 border rounded-lg bg-card">
        <span className="text-xs text-muted-foreground block">Active Sessions</span>
        <strong className="text-xl text-emerald-600">{data.active}</strong>
      </div>
    </div>
  );
}

export function DashboardStatsWidget() {
  // Initiates Server Function RPC on initial mount without useEffect:
  const [statsPromise] = useState(() => fetchDashboardStats());

  return (
    <div className="p-4 border rounded-xl space-y-3">
      <h3 className="font-semibold text-sm">System Overview</h3>
      <Suspense fallback={<p className="text-xs text-muted-foreground">Loading metrics over RPC...</p>}>
        <StatsContent promise={statsPromise} />
      </Suspense>
    </div>
  );
}
```

- **Modern React 19 Ergonomics:** Unrolls promises synchronously with `use()` inside `<Suspense>`. Eliminates legacy `useEffect` lifecycle hooks, manual loading flags (`isLoading`, `error`), and fetch boilerplate.
- **Network Round Trip:** Supported and idiomatic for standalone client widgets, but incurs a second client-side HTTP round trip after hydration. When you control the parent route, prefer **Strategy 9 (RSC Promise)** to initiate the promise on the server and eliminate the extra round trip.

---

### 13. Client Server Functions (User Actions & Mutations)

> **Type-Safe RPC Mutations**  
> **TTFB:** `N/A (Post-Load)` | **Stream Ready:** `N/A (User Event)` | **Server & DB Load:** `On-Demand` | **Waterfall:** `None` | **Data Freshness:** `100% Live`

**How it works:** The official, idiomatic role for Server Functions. Invoked exclusively in response to user-triggered events (button clicks, form submissions, drag-and-drop actions). Server Functions execute securely on the server, mutate state, and trigger on-demand cache revalidation via `revalidateTag` or `revalidatePath`.

```typescript
// src/cart/server-functions.ts
"use server";

import db from "@/lib/db";
import { revalidateTag } from "dinou/server";

export async function addToCart(productId: string, quantity: number) {
  // Direct server mutation with ORM
  await db.cart.addItem({ productId, quantity });

  // On-demand invalidation: purges cache tag across CDNs and Micro-ISR slots
  await revalidateTag("cart");

  return { success: true };
}
```

```tsx
// src/cart/add-to-cart-button.tsx
"use client";

import { useTransition } from "react";
import { addToCart } from "./server-functions";

export function AddToCartButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await addToCart(productId, 1);
    });
  };

  return (
    <button onClick={handleClick} disabled={isPending} className="btn-primary">
      {isPending ? "Adding..." : "Add to Cart"}
    </button>
  );
}
```

- **Strict Rule:** Only call Server Functions in mutative event contexts. Never invoke them during the render phase or inside components.
- **Type Safety:** Arguments and return types are inferred end-to-end between client and server without manual fetch boilerplate.

---

### Architectural Decision Guide

When deciding which strategy to apply to a new feature or page, follow this quick decision tree:

- **Is the content public or marketing?**
  - ➔ **Strategy 1 (RSC SSG):** `0ms` TTFB, 0kb client JS, 100% CDN cached.
  - ➔ If parts change periodically: **Strategy 5 (Static SSG / Asymmetric ISR)**.
- **High-traffic store or viral catalog?**
  - ➔ **Strategy 8 (PPR + CacheSlot):** Instant `0ms` Edge layout + `~2ms` cached hole. 99.9% database query offload.
- **Interactive tool, canvas, or complex editor?**
  - ➔ **Strategy 10 / 11 (Client-First):** Server gets data via `getProps`, page is a 100% interactive client component.
- **Live search filter or client widget?**
  - ➔ **Strategy 9 (React 19 `use()`):** Start query on server, stream raw promise to client component without waterfalls.


---

## Static & Dynamic Rendering Strategies

Dinou is **Static by Default**. It provides a continuum of rendering strategies—from build-time SSG and stale-while-revalidate ISR to real-time Dynamic SSR, revolutionary **Partial Prerendering (PPR)**, and component-level Micro-ISR with `<DinouCacheSlot>`.

### Overview: Static by Default Architecture

In Dinou, every route is assumed to be static until proven otherwise. During `dinou build`, the compiler analyzes route segments, components, and loader functions to evaluate whether a route can be pre-rendered or requires real-time request data:

1. **Static by Default:** Routes without dynamic dependencies are pre-rendered into immutable HTML and RSC payloads at build time, achieving **0ms TTFB** at the CDN edge.
2. **Dynamic Bailout:** When a page reads cookies, request headers, or sets `revalidate: 0`, Dinou automatically bails out to Live SSR on every incoming request.
3. **Hybrid Continuum:** Escape the binary choice: stream dynamic components into a static shell with **PPR**, or isolate component caching with **`<DinouCacheSlot>`**.

---

### 1. Static Site Generation (SSG) & Bailout

Pure static rendering pre-generates HTML and RSC files during the build phase (`npm run build`). Production server startup is instantaneous, and static pages achieve the fastest possible Time to First Byte (TTFB) cached by Edge CDNs globally.

#### 1.1. Pure Static Pre-rendering

Any page that does not consume request-specific headers, cookies, or query parameters and does not set `revalidate < 1` is automatically generated as static HTML:

```tsx
// src/about/page.tsx
// Automatically rendered as static HTML during build time ('npm run build')
export default function AboutPage() {
  return (
    <article className="prose">
      <h1>About Us</h1>
      <p>This page is pre-rendered once and served statically forever.</p>
    </article>
  );
}
```

#### 1.2. Automatic Static Bailout

If a Server Component reads request-specific data at render time without wrapping it inside a dynamic streaming boundary (React `<Suspense>` with Partial Prerendering / PPR enabled), Dinou automatically "bails out" of static generation and transitions the entire page into Dynamic SSR for that request:

```tsx
// src/profile/page.tsx
import { getContext } from "dinou";
import db from "@/lib/db";

export default async function ProfilePage() {
  const context = getContext();

  // ⚠️ Reading cookies outside <Suspense> triggers an Automatic Static Bailout
  // This page will now be rendered dynamically on every incoming request
  const sessionToken = context?.req.cookies["session_token"];
  const user = await db.users.findByToken(sessionToken);

  return <h1>Welcome back, {user?.name}</h1>;
}
```

##### Bailout Triggers in Server Components

Automatic bailout occurs when reading `context.req.cookies`, `context.req.headers`, or `context.req.query` (URL search parameters) during server component execution without wrapping the access in a React `<Suspense>` boundary.

##### What about Client Components and `useSearchParams()`?

Client Components (`"use client"`) that call `useSearchParams()` **do not trigger dynamic bailout**. The page remains 100% static (SSG). During build time, the component is pre-rendered with an empty parameter set, and live URL parameters are synchronized in the browser upon hydration.

> [!TIP]
> **Preventing Hydration Mismatches with Search Parameters:**  
> If a Client Component immediately renders `searchParams.get("q")` in its initial JSX markup, the server-generated static HTML (where the query was empty at build time) will differ from the live browser DOM (e.g. `?q=react`), triggering a React hydration mismatch error.
> 
> **Recommended Fix:** Keep initial render deterministic, then read and apply live search parameters inside `useEffect()` after mounting:
> ```tsx
> // src/components/search-filter.tsx
> "use client";
> 
> import { useSearchParams } from "dinou";
> import { useState, useEffect } from "react";
> 
> export function SearchFilter() {
>   const searchParams = useSearchParams();
>   const [query, setQuery] = useState<string | null>(null);
> 
>   useEffect(() => {
>     // Synchronize client-side only after mounting -> eliminates hydration mismatch
>     setQuery(searchParams.get("q") ?? "");
>   }, [searchParams]);
> 
>   if (query === null) {
>     return <span className="text-muted-foreground">Loading filter...</span>;
>   }
> 
>   return <span>Filter: <strong>{query}</strong></span>;
> }
> ```
> *Alternative (Live SSR):* If the initial HTML sent over the wire must contain search parameters for SEO, switch the page to Live SSR by exporting `export const revalidate = 0;` in `page_functions.ts`.

---

### 2. The Unified `revalidate` Strategy (Strict Seconds)

In Dinou v7, the `revalidate` export in `page_functions.ts` (or `layout_functions.ts`) serves as the single source of truth for route rendering behavior. It is measured **strictly in seconds (s)**:

| Value of `revalidate` | Strategy | Description |
| :--- | :--- | :--- |
| `false` (or omitted) | **Pure Static (SSG)** | Pre-rendered once at build time. Cached indefinitely until manual invalidation. |
| `0` (or number < 1) | **Dynamic SSR** | Rendered on every incoming HTTP request on the fly. |
| `N` (number >= 1) | **Time-Based ISR** | Pre-rendered, served instantly from cache, and revalidated in the background every `N` seconds. |

#### 2.1. Dynamic SSR (`revalidate < 1` or `0`)

To force a page to render dynamically on every single request (escaping the default static generation), set `revalidate` to `0`:

```typescript
// src/analytics/live/page_functions.ts

// Escapes static generation: executes dynamic SSR on every request
export const revalidate = 0;
```

> [!NOTE]
> **Migration from Legacy `dynamic` Export:** In older versions of Dinou, dynamic rendering was toggled via `export function dynamic()`. In Dinou v7, the `dynamic` export has been completely removed. Setting `export const revalidate = 0;` is the official unified mechanism to escape static generation.

#### 2.2. Incremental Static Regeneration (`revalidate >= 1`)

When `revalidate >= 1`, Dinou serves pre-rendered static HTML/RSC payloads while regenerating the page in the background at most once every `N` seconds (stale-while-revalidate):

```typescript
// src/blog/page_functions.ts

// Rebuilds the cached page in the background at most once every 60 seconds
export const revalidate = 60; // Strict seconds (1 minute)
```

- **Background Revalidation Flow:** The first request after the 60s window receives the cached page immediately. Dinou re-executes the server render in the background. Subsequent visitors see the freshly generated version.
- **Edge ISR Storage Adapters:** On edge platforms like Deno Deploy and Cloudflare Workers, ISR seamlessly uses distributed key-value storage (`DenoKVStorage`, `CloudflareKVStorage`, `MemoryStorage`) without needing a persistent disk.

---

### 3. Partial Prerendering (PPR)

Partial Prerendering (PPR) resolves the decades-old dilemma between static and dynamic rendering. Instead of forcing an entire page to be 100% static or 100% dynamic, PPR delivers a **pre-rendered static shell instantly (0ms TTFB)**, while streaming dynamic holes in parallel over the same HTTP response.

#### 3.1. Hybrid Architecture: Static Shell + Dynamic Holes

At build time, Dinou compiles the layout, navigation, and static components into an immutable HTML shell. Any dynamic component wrapped in React `<Suspense>` is saved as a streaming placeholder hole (`<div data-ppr-hole="slot-id">...fallback...</div>`).

##### The Single HTTP Response Timeline

1. **0ms (Instant TTFB):** The browser receives the static shell with skeleton fallbacks directly from Edge CDN cache. Visual layout is painted immediately.
2. **Request Processing:** Concurrently, Dinou executes the async Server Components inside `<Suspense>` on the server.
3. **Streaming In-Place:** As each Suspense promise resolves, the HTML chunk and RSC payload are streamed down the same HTTP connection, replacing the skeleton with real content without full page reloads.

##### Data Freshness: Pure SSG vs. Partial Prerendering

- **Without PPR (Frozen Build Data):** Data is baked into the build artifact. Live inventory or user carts are stale upon deployment. Applications historically resorted to legacy client-side `useEffect() + fetch()` anti-patterns, suffering waterfalls, layout shifts, and spinners.
- **With PPR (Request-Time Fresh Data):** The visual shell is delivered at `0ms` TTFB from the edge, while the component inside `<Suspense>` executes on the server on every incoming request. You get 100% fresh, live database data streamed directly to the browser without client fetch waterfalls.

##### PPR as a Bailout Boundary: Containing Dynamic De-optimization

Without PPR, dynamic data access is infectious: if a single nested component reads request cookies or headers, Dinou triggers an Automatic Static Bailout for the **entire page**, destroying static pre-rendering and edge caching for the whole route.

With PPR enabled (`ppr = true`), React `<Suspense>` acts as an **isolated sandbox**. Dynamic data consumption inside the boundary does not escape to parent or sibling components:

```tsx
// src/store/page.tsx
import { Suspense } from "react";
import { getContext } from "dinou";
import db from "@/lib/db";
import { ProductGallery } from "@/components/gallery";
import { CartBadgeSkeleton } from "@/components/skeletons";

// ⚠️ Dynamic component: reads request-specific session cookie
async function LiveCartBadge() {
  const context = getContext();
  const sessionToken = context?.req.cookies["session_id"];
  const cart = await db.carts.findActive(sessionToken);

  return <div className="cart-badge">Items: {cart?.itemCount ?? 0}</div>;
}

export default function StorePage() {
  return (
    <main className="container">
      {/* 1. Static Shell: 0ms TTFB, pre-rendered during build */}
      <header className="navbar">
        <h1>Flagship Store</h1>
        
        {/* 2. PPR Boundary: Isolates cookie bailout exclusively to this hole */}
        <Suspense fallback={<CartBadgeSkeleton />}>
          <LiveCartBadge />
        </Suspense>
      </header>

      {/* 3. Static Sibling: Remains 100% static and edge-cached */}
      <ProductGallery />
    </main>
  );
}
```

- **❌ Without PPR (Full-Page Bailout):** Reading `cookies["session_id"]` turns the entire page into dynamic SSR. Edge caching is lost, and the visitor waits with a blank screen.
- **✅ With PPR (Isolated Hole Bailout):** The cookie bailout is quarantined inside `<Suspense>`. The navbar and product gallery are delivered instantly at `0ms` TTFB. Only the cart badge executes on the server and streams into place.

#### 3.2. Enabling PPR & Specificity Hierarchy

Dinou provides granular control over Partial Prerendering across three hierarchical levels:

1. **Page Level (`page_functions.ts`) — Highest Priority:** A page can override any parent layout or global configuration:
   ```typescript
   // src/shop/products/[slug]/page_functions.ts
   export const ppr = true; // Guarantees PPR on product details
   ```
2. **Layout Level (`layout_functions.ts`) — Subtree Cascading:** Applies to that layout and cascades to all its descendant subroutes:
   ```typescript
   // src/admin/layout_functions.ts
   export const ppr = false; // Disables PPR for /admin and ALL subroutes
   ```
3. **Global Configuration (`dinou.config.mjs`):** Enables PPR globally across all eligible routes:
   ```javascript
   // dinou.config.mjs
   import { defineConfig } from "dinou";
   export default defineConfig({ ppr: true });
   ```

---

### 4. Vertical Segmentation: Micro-ISR (`<DinouCacheSlot>`)

Traditional full-stack frameworks only offer **Horizontal Segmentation** (caching an entire URL route or layout shell). When a dynamic page contains an expensive database widget, developers are often forced into an architectural trap: converting the widget to a Client Component with client-side cache libraries (SWR, TanStack Query), introducing bundle bloat, waterfall requests, and layout shifts.

Dinou v7 introduces **Vertical Segmentation** with `<DinouCacheSlot>` from `"dinou/server"`. It keeps components securely on the server as React Server Components (RSC) while caching their rendered serialized Flight payload in server storage with dedicated TTLs and invalidation tags.

#### 4.1. Component Caching: Dynamic vs. Static Patterns

`<DinouCacheSlot>` functions as a universal caching primitive across two core architectural patterns:

##### Implementation Pattern 1: Dynamic SSR Dashboard with Cached Slot

The route runs in Live SSR mode (evaluating user cookies and personal greetings live). The heavy analytics calculation is cached on the server for 300 seconds and wrapped in React `<Suspense>`:

```tsx
// src/dashboard/page.tsx
import { Suspense } from "react";
import { DinouCacheSlot } from "dinou/server";
import { FastUserProfile, SlowAnalyticsWidget } from "./widgets";
import { AnalyticsSkeleton } from "./skeletons";

export default function DashboardPage() {
  return (
    <main className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {/* 1. Dynamic Component: Evaluated live on every request (reads session/cookies) */}
      <FastUserProfile />

      {/* 2. Micro-ISR Slot: Cached on the server for 300 seconds */}
      {/* ⚠️ Wrapped in <Suspense> so cache misses stream without blocking TTFB */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <DinouCacheSlot id="analytics-widget" tag="analytics" revalidate={300}>
          <SlowAnalyticsWidget />
        </DinouCacheSlot>
      </Suspense>
    </main>
  );
}
```

##### Implementation Pattern 2: Static / ISR Product Page with Asymmetric Slot

The parent route has a slow horizontal revalidation of 24 hours (`revalidate: 86400`). Inside it, a volatile inventory counter revalidates vertically every 60 seconds (`revalidate={60}`) or on-demand:

```tsx
// src/products/[slug]/page_functions.ts
export const revalidate = 86400; // Slow horizontal revalidation (24h)

// src/products/[slug]/page.tsx
import { Suspense } from "react";
import { DinouCacheSlot } from "dinou/server";
import { ProductHero, ProductDescription } from "./static-widgets";
import { LiveStockCounter, StockSkeleton } from "./stock-widgets";

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  return (
    <main className="container py-8 space-y-6">
      {/* 1. Heavy Static Content: Cached at the CDN edge for 24 hours */}
      <ProductHero slug={params.slug} />
      <ProductDescription slug={params.slug} />

      {/* 2. Asymmetric Micro-ISR Slot: Revalidates vertically every 60s */}
      <Suspense fallback={<StockSkeleton />}>
        <DinouCacheSlot 
          id={`stock-${params.slug}`} 
          tag={`stock-${params.slug}`} 
          revalidate={60}
        >
          <LiveStockCounter slug={params.slug} />
        </DinouCacheSlot>
      </Suspense>
    </main>
  );
}
```

> [!IMPORTANT]
> **Boundary Placement: Why `<Suspense>` Must Wrap `<DinouCacheSlot>`**  
> `<DinouCacheSlot>` is itself an asynchronous Server Component. When it awaits storage or renders on a cache miss, React encounters a pending promise in the parent page tree. Without an outer `<Suspense>`, suspension bubbles to the root, blocking the entire HTTP response and delaying fast sibling components.
> 
> **The Rule of Hierarchy:**
> 1. `<Suspense fallback={<Skeleton />}>` → Controls browser streaming & instant visual layout.
> 2. `<DinouCacheSlot revalidate={300}>` → Controls server cache storage, TTL, and cache tags.
> 3. `<SlowAnalyticsWidget />` → Executes database queries and business logic.

#### 4.2. Interactive Revalidation & On-Demand Purging

Dinou provides specialized mechanisms to refresh or purge `<DinouCacheSlot>` instances without reloading the browser page:

##### Client-Side In-Place Refresh (`refreshSlot`)

Any interactive Client Component can trigger a surgical re-render of only that slot without full page reload or state loss:

```tsx
"use client";
import { refreshSlot, useRouter } from "dinou";

export function RefreshButton() {
  const router = useRouter();

  return (
    <div className="flex gap-2">
      {/* Option 1: Standalone (respects server slot TTL) */}
      <button onClick={() => refreshSlot("analytics-widget")}>
        Refresh Metrics
      </button>

      {/* Option 2: Force fresh (bypasses server slot TTL immediately) */}
      <button onClick={() => router.refreshSlot("analytics-widget", { fresh: true })}>
        Force Fresh
      </button>
    </div>
  );
}
```

- **`refreshSlot(id)` (Default):** Refreshes the client DOM with the server's current state. If the slot's server TTL has not expired, it returns cached server JSX without touching your database (protecting against button spam and traffic spikes).
- **`refreshSlot(id, { fresh: true })` (Bypass):** Hard revalidation. Forces the server to ignore unexpired TTL, immediately re-run queries against the database, and update both cache and client.

##### Server-Side Tag Invalidation (`revalidateTag`)

Mutations purge slots globally via `revalidateTag()` on the server, while the client immediately pulls the fresh result via `refreshSlot()`:

```tsx
// src/app/feed/actions.ts
"use server";
import { revalidateTag } from "dinou/server";
import db from "@/lib/db";

export async function publishPost(formData: FormData) {
  const content = formData.get("content") as string;
  await db.posts.insert({ content, createdAt: new Date() });

  // Purges cache globally for ALL future visitors across CDNs and Micro-ISR slots
  await revalidateTag("feed");
}
```

##### Zero Skeleton Flash (`startTransition` + Stale-Preserving Fallback)

While the server re-renders an expired slot during an interactive refresh, the user does **NOT** see a blank skeleton flash or layout shift. Dinou's internal client boundary wraps slot updates in `React.startTransition` and sets `fallback: children` (the previous DOM content). The existing widget stays interactive and visible until the new server stream arrives, then swaps seamlessly.

To display an inline loading indicator on the button itself, wrap `refreshSlot` inside React's standard `useTransition()`:

```tsx
"use client";
import { useTransition } from "react";
import { refreshSlot } from "dinou";

export function RefreshAnalyticsButton() {
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(() => {
      refreshSlot("analytics-widget");
    });
  };

  return (
    <button onClick={handleRefresh} disabled={isPending}>
      {isPending ? "Refreshing Metrics..." : "Refresh Metrics"}
    </button>
  );
}
```

#### 4.3. Horizontal vs. Vertical Segmentation & Anti-Patterns

| Dimension | Scope | Configuration | Best For |
| :--- | :--- | :--- | :--- |
| **Horizontal Segmentation** | Route / Segment Level | `page_functions.ts`, `layout_functions.ts` | Whole-page SSG, ISR, and layout persistence. |
| **Vertical Segmentation** | Component Subtree Level | `<DinouCacheSlot>` from `dinou/server` | Independent widget TTLs, asymmetric revalidation, and in-place client refreshes. |

##### When NOT to Use `<DinouCacheSlot>`

1. **100% Static Pages (SSG):** If an entire route is pre-rendered at build time with no revalidation, it is already cached as immutable HTML at the CDN. Slots add zero benefit.
2. **Wrapping the Entire Page:** Wrapping the entire `page.tsx` body inside a slot reinvents horizontal caching. Declare `export const revalidate = 300` in `page_functions.ts` instead.
3. **Unpartitioned Private User Data:** Never wrap private user data (such as a specific user's cart or session token) with a static slot ID. This would cache user A's private data and leak it to user B.

---

### 5. High-Traffic Synergy: PPR + `<DinouCacheSlot>`

Nesting `<DinouCacheSlot>` inside a React `<Suspense>` boundary on a route with Partial Prerendering (PPR) unlocks the highest performance profile possible: **zero-delay initial delivery (`0ms` TTFB)** paired with **near-zero streaming delay (`~2ms`)** and **99.9% database query offloading**.

- **PPR Alone (Uncached Dynamic Hole):** 0ms static shell from Edge CDN, but the hole waits for live DB execution (e.g. 1.5s) on *every single request*. 10,000 visitors/min = 10,000 live DB queries.
- **PPR + `<DinouCacheSlot>` (Cached Streamed Hole):** 0ms static shell from Edge CDN + hole resolves from server cache in `~2ms`. 10,000 visitors/min = **1 database query per TTL window** (99.9% database offload).

#### Implementation Pattern: High-Traffic Telemetry Dashboard

```typescript
// src/telemetry/page_functions.ts
import type { PageFunctions } from "dinou";

// Enable Partial Prerendering on this high-traffic route
export const ppr: PageFunctions["ppr"] = true;
```

```tsx
// src/telemetry/page.tsx
import { Suspense } from "react";
import { DinouCacheSlot } from "dinou/server";
import { TelemetryHeader, TelemetryFooter } from "./static-shell";
import { HeavyMetricsGraph, GraphSkeleton } from "./graph-widgets";

export default function TelemetryPage() {
  return (
    <main className="container py-8 space-y-6">
      {/* 1. Static Shell: Delivered instantly in 0ms TTFB from Edge CDN */}
      <TelemetryHeader />

      {/* 2. PPR Dynamic Hole + Micro-ISR Slot:
             - Fallback skeleton sent immediately in initial layout
             - Hole streams from server cache in ~2ms for subsequent visitors
             - Database query runs only ONCE every 60 seconds */}
      <Suspense fallback={<GraphSkeleton />}>
        <DinouCacheSlot id="operations-telemetry" tag="telemetry" revalidate={60}>
          <HeavyMetricsGraph />
        </DinouCacheSlot>
      </Suspense>

      <TelemetryFooter />
    </main>
  );
}
```

---

### 6. Incremental Static Generation (ISG on-demand)

While ISR updates existing pre-rendered pages, **ISG (Incremental Static Generation)** generates new dynamic paths on demand that were omitted from the build-time `getStaticPaths` list.

#### 6.1. On-Demand Path Generation

Any route path omitted from `getStaticPaths` will be generated dynamically when the first visitor requests it, cached, and then served as static HTML to subsequent visitors:

```typescript
// src/products/[id]/page_functions.ts

// Pre-render only the top 10 products at build time:
export const getStaticPaths = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

// Any other ID (e.g. /products/452) will be generated on-demand
// on its first visitor and cached permanently.
```

#### 6.2. Governance APIs (`validateParams` & `allowISG`)

Dinou provides strict server-side governance exports to secure on-demand generation against cache pollution and DDoS:

- **`validateParams(params)`:** Validates route parameters before generation begins. Returning `false` halts rendering immediately and serves an instant 404:
  ```typescript
  export function validateParams(params: { id: string }) {
    return /^\d+$/.test(params.id); // Only allow numeric IDs
  }
  ```
- **`allowISG`:** Disables on-demand generation entirely. When set to `false`, any path not pre-rendered in `getStaticPaths` returns 404 without querying the server:
  ```typescript
  export const allowISG = false; // Strict SSG only
  ```

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
