# **Dinou**

[![Documentation](https://img.shields.io/badge/docs-dinou.dev-blue?style=flat-square)](https://dinou.dev) [![Version](https://img.shields.io/badge/version-9.0.0-orange?style=flat-square)](https://www.npmjs.com/package/dinou)

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
- [Page & Layout Functions (page_functions.ts & layout_functions.ts)](#page--layout-functions-page_functionsts--layout_functionsts)
  - [Overview & Horizontal Segmentation](#overview--horizontal-segmentation)
  - [1. getProps (Direct Component Props)](#1-getprops-direct-component-props)
  - [2. getStaticPaths (Static Generation)](#2-getstaticpaths-static-generation)
    - [2.1. Constant Array vs Function Export](#21-constant-array-vs-function-export)
    - [2.2. Return Formats](#22-return-formats)
    - [2.3. Simple Dynamic Routes](#23-simple-dynamic-routes)
    - [2.4. Catch-all Routes](#24-catch-all-routes)
    - [2.5. Automatic Route Propagation (Recursion)](#25-automatic-route-propagation-recursion)
    - [2.6. Nested Pages & The "Chain of Responsibility"](#26-nested-pages--the-chain-of-responsibility)
    - [2.7. Nested & Pass-through Segments](#27-nested--pass-through-segments)
    - [2.8. Async Support (CMS & DB)](#28-async-support-cms--db)
  - [3. validateParams (Route Parameter Validation)](#3-validateparams-route-parameter-validation)
  - [4. allowISG (Incremental Static Opt-Out)](#4-allowisg-incremental-static-opt-out)
  - [5. revalidate (ISR & Dynamic SSR Escape)](#5-revalidate-isr--dynamic-ssr-escape)
  - [6. getCacheTags (Cache Tagging)](#6-getcachetags-cache-tagging)
  - [7. ppr (Partial Prerendering)](#7-ppr-partial-prerendering)
  - [8. End-to-End Type-Safe Example](#8-end-to-end-type-safe-example)
- [Static & Dynamic Rendering Strategies](#static--dynamic-rendering-strategies)
  - [Overview: Static by Default Architecture](#overview-static-by-default-architecture)
  - [1. Static Site Generation (SSG) & Bailout](#1-static-site-generation-ssg--bailout)
    - [1.1. Pure Static Pre-rendering](#11-pure-static-pre-rendering)
    - [1.2. Automatic Static Bailout](#12-automatic-static-bailout)
  - [2. The Unified revalidate Strategy (Strict Seconds)](#2-the-unified-revalidate-strategy-strict-seconds)
    - [2.1. Dynamic SSR (revalidate < 1 or 0)](#21-dynamic-ssr-revalidate--1-or-0)
    - [2.2. Incremental Static Regeneration (revalidate >= 1)](#22-incremental-static-regeneration-revalidate--1)
  - [3. Partial Prerendering (PPR)](#3-partial-prerendering-ppr)
    - [3.1. Hybrid Architecture: Static Shell + Dynamic Holes](#31-hybrid-architecture-static-shell--dynamic-holes)
    - [3.2. Enabling PPR & Specificity Hierarchy](#32-enabling-ppr--specificity-hierarchy)
  - [4. Vertical Segmentation: Micro-ISR (<DinouCacheSlot>)](#4-vertical-segmentation-micro-isr-dinoucacheslot)
    - [4.1. Component Caching: Dynamic vs. Static Patterns](#41-component-caching-dynamic-vs-static-patterns)
    - [4.2. Interactive Revalidation & On-Demand Purging](#42-interactive-revalidation--on-demand-purging)
    - [4.3. Horizontal vs. Vertical Segmentation & Anti-Patterns](#43-horizontal-vs-vertical-segmentation--anti-patterns)
  - [5. High-Traffic Synergy: PPR + <DinouCacheSlot>](#5-high-traffic-synergy-ppr--dinoucacheslot)
  - [6. Incremental Static Generation (ISG on-demand)](#6-incremental-static-generation-isg-on-demand)
    - [6.1. On-Demand Path Generation](#61-on-demand-path-generation)
    - [6.2. Governance APIs (validateParams & allowISG)](#62-governance-apis-validateparams--allowisg)
  - [7. Complete Rendering Strategies Matrix](#7-complete-rendering-strategies-matrix)
- [Server Functions ("use server")](#server-functions-use-server)
  - [Overview & "use server" Directive](#overview--use-server-directive)
  - [1. Returning Live React Components (UI Streaming)](#1-returning-live-react-components-ui-streaming)
  - [2. Server Actions & Form Mutations](#2-server-actions--form-mutations)
    - [2.1. Server Actions in Forms](#21-server-actions-in-forms)
    - [2.2. React 19 Hooks: useActionState & useFormStatus](#22-react-19-hooks-useactionstate--useformstatus)
    - [2.3. Optimistic Updates with useOptimistic](#23-optimistic-updates-with-useoptimistic)
  - [3. Request Context, Cookies & Headers (getContext)](#3-request-context-cookies--headers-getcontext)
    - [3.1. Reading Query, Headers & Cookies](#31-reading-query-headers--cookies)
    - [3.2. Setting & Clearing Cookies](#32-setting--clearing-cookies)
  - [4. Redirections (redirect)](#4-redirections-redirect)
    - [4.1. The 4 Execution Contexts (HTTP 302 vs. Client Transition)](#41-the-4-execution-contexts-http-302-vs-client-transition)
    - [4.2. Universal Redirection Matrix](#42-universal-redirection-matrix)
- [On-Demand Revalidation](#on-demand-revalidation)
  - [Overview & Multi-Tier Architecture](#overview--multi-tier-architecture)
  - [1. revalidatePage (Surgical Page Invalidation)](#1-revalidatepage-surgical-page-invalidation)
    - [1.1. Usage in Server Functions](#11-usage-in-server-functions)
  - [2. revalidatePath (Route & Segment Purge)](#2-revalidatepath-route--segment-purge)
    - [2.1. Cascading Revalidation ({ cascade: true })](#21-cascading-revalidation--cascade-true)
  - [3. Granularity & Path Resolution (Page vs Segment)](#3-granularity--path-resolution-page-vs-segment)
    - [3.1. revalidatePage vs revalidatePath](#31-revalidatepage-vs-revalidatepath)
    - [3.2. Absolute & Relative Route Paths](#32-absolute--relative-route-paths)
  - [4. revalidateTag (Cross-Cutting Invalidation)](#4-revalidatetag-cross-cutting-invalidation)
    - [4.1. Tag Assignment (getCacheTags)](#41-tag-assignment-getcachetags)
    - [4.2. Targeted Resolution (Layout vs Page vs Slot)](#42-targeted-resolution-layout-vs-page-vs-slot)
    - [4.3. Golden Rules of Invalidation](#43-golden-rules-of-invalidation)
    - [4.4. Invalidating <DinouCacheSlot> Subtrees](#44-invalidating-dinoucacheslot-subtrees)
  - [5. Client-Side Surgical Revalidation & Router Caching](#5-client-side-surgical-revalidation--router-caching)
    - [5.1. The Router Caches (pageCache & layoutCache)](#51-the-router-caches-pagecache--layoutcache)
    - [5.2. Bypassing Client Cache with <Link fresh>](#52-bypassing-client-cache-with-link-fresh)
    - [5.3. router.refresh() & Layout Invalidation](#53-routerrefresh--layout-invalidation)
    - [5.4. refreshSlot & router.refreshSlot](#54-refreshslot--routerrefreshslot)
  - [6. Pluggable Storage Adapters](#6-pluggable-storage-adapters)
    - [6.1. Why Adapters Matter for Revalidation](#61-why-adapters-matter-for-revalidation)
    - [6.2. Supported Storage Adapters & Configuration](#62-supported-storage-adapters--configuration)
  - [7. Webhook Integrations (Headless CMS)](#7-webhook-integrations-headless-cms)
  - [8. Strategy Comparison Matrix](#8-strategy-comparison-matrix)
    - [8.1. Server-Side Invalidation Mechanisms](#81-server-side-invalidation-mechanisms)
    - [8.2. Client-Side Router Refresh Mechanisms](#82-client-side-router-refresh-mechanisms)
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
- [The Dinou Pattern](#the-dinou-pattern)
  - [The Concept & Architecture](#the-concept--architecture)
    - [Flight RPC & Headless Updaters](#flight-rpc--headless-updaters)
    - [5-Step Execution Lifecycle](#5-step-execution-lifecycle)
  - [Step-by-Step Implementation](#step-by-step-implementation)
    - [1. The Global Store (Zustand)](#1-the-global-store-zustand)
    - [2. The Headless Client Updater](#2-the-headless-client-updater)
    - [3. The Server Function Mutation](#3-the-server-function-mutation)
    - [4. Server Data Query Function](#4-server-data-query-function)
    - [5. Display Component (Client Component)](#5-display-component-client-component)
    - [6. Putting It All Together in the Page](#6-putting-it-all-together-in-the-page)
  - [Zero-Dependency Option: Native useSyncExternalStore](#zero-dependency-option-native-usesyncexternalstore)
  - [Comparison & Key Advantages](#comparison--key-advantages)
- [React Compiler & StrictMode](#react-compiler--strictmode)
  - [Overview: Automatic Memoization](#overview-automatic-memoization)
  - [1. Code Comparison: Plain React vs Hooks](#1-code-comparison-plain-react-vs-hooks)
  - [2. Bundler Integration Matrix](#2-bundler-integration-matrix)
    - [2.1. Why Dev vs Prod Bundler Behavior Differs](#21-why-dev-vs-prod-bundler-behavior-differs)
  - [3. React StrictMode (Default: true)](#3-react-strictmode-default-true)
    - [3.1. Why StrictMode is Vital for the React Compiler](#31-why-strictmode-is-vital-for-the-react-compiler)
    - [3.2. Configuring reactStrictMode in dinou.config.mjs](#32-configuring-reactstrictmode-in-dinouconfigmjs)
  - [4. Guidelines for Compiler Purity](#4-guidelines-for-compiler-purity)
- [Public Directory (`public/`)](#public-directory-public)
  - [1. Overview & Architecture](#1-overview--architecture)
    - [Bypassing Bundlers (.dinou/dist3)](#bypassing-bundlers-dinoudist3)
    - [Recommended Directory Structure](#recommended-directory-structure)
  - [2. URL Mapping & Serving](#2-url-mapping--serving)
  - [3. Common Use Cases](#3-common-use-cases)
    - [Favicons & App Icons](#favicons--app-icons)
    - [robots.txt & sitemap.xml (SEO)](#robotstxt--sitemapxml-seo)
    - [Domain Verification & .well-known](#domain-verification--well-known)
    - [OpenGraph & Social Share Cards](#opengraph--social-share-cards)
  - [4. public/ vs. Imported Assets (src/)](#4-public-vs-imported-assets-src)
- [Styles & CSS Architecture](#styles--css-architecture)
  - [Styling in Dinou](#styling-in-dinou)
  - [Linking /styles.css](#linking-stylescss)
    - [React 19 precedence Attribute](#react-19-precedence-attribute)
  - [Tailwind CSS (v4 Engine)](#tailwind-css-v4-engine)
    - [Custom @theme & Directives](#custom-theme--directives)
  - [CSS Modules (*.module.css)](#css-modules-modulecss)
    - [Scoped Class Names & Resolution](#scoped-class-names--resolution)
  - [Global CSS & Path Aliases](#global-css--path-aliases)
  - [Instant CSS Hot Module Replacement](#instant-css-hot-module-replacement)
  - [TypeScript Declarations (dinou/env)](#typescript-declarations-dinouenv)
  - [Complete End-to-End Example](#complete-end-to-end-example)
- [Assets & Media](#assets--media)
  - [Assets & Media in Dinou](#assets--media-in-dinou)
  - [Imported Assets vs. Public Directory](#imported-assets-vs-public-directory)
  - [Supported Extensions (21 Formats)](#supported-extensions-21-formats)
  - [Usage in Server & Client Components](#usage-in-server--client-components)
  - [Path Aliases in Asset Imports](#path-aliases-in-asset-imports)
  - [Production Build Output (.dinou/dist3/assets/)](#production-build-output-dinoudist3assets)
  - [TypeScript Declarations (dinou/env)](#typescript-declarations-dinouenv-1)
  - [Extending Custom Formats (Eject)](#extending-custom-formats-eject)
- [Environment Variables & Secrets](#environment-variables--secrets)
  - [Environment Variables in Dinou](#environment-variables-in-dinou)
  - [The Server-Only Security Model](#the-server-only-security-model)
    - [Where Environment Variables Work](#where-environment-variables-work)
    - [Safe Propagation to Client Components](#safe-propagation-to-client-components)
  - [Defining .env Files](#defining-env-files)
  - [Multi-Platform Runtimes](#multi-platform-runtimes)
    - [Node.js & Bun (process.env)](#nodejs--bun-processenv)
    - [Cloudflare Workers (process.env & Bindings)](#cloudflare-workers-processenv--bindings)
    - [Deno (process.env & --allow-env)](#deno-processenv----allow-env)
  - [Type-Safe Environment Validation (Zod)](#type-safe-environment-validation-zod)
  - [Anti-Leak Security & Bot Shield](#anti-leak-security--bot-shield)
- [Import Aliases & Path Resolution](#import-aliases--path-resolution)
  - [Import Aliases in Dinou](#import-aliases-in-dinou)
  - [Configuring tsconfig.json](#configuring-tsconfigjson)
    - [Defining Multiple Granular Aliases](#defining-multiple-granular-aliases)
  - [Where Aliases Work (Code, CSS, & Assets)](#where-aliases-work-code-css--assets)
    - [1. TypeScript & JavaScript Modules](#1-typescript--javascript-modules)
    - [2. CSS @import Rules](#2-css-import-rules)
    - [3. Asset & Media Imports](#3-asset--media-imports)
  - [Automatic Extension & Index Resolution](#automatic-extension--index-resolution)
  - [IDE Autocomplete & Refactoring Support](#ide-autocomplete--refactoring-support)
  - [Best Practices & Common Gotchas](#best-practices--common-gotchas)
- [Configuration & Plugins](#configuration--plugins)
  - [Configuration & Plugin System](#configuration--plugin-system)
  - [The dinou.config.mjs File](#the-dinouconfigmjs-file)
  - [Top-Level Configuration Options](#top-level-configuration-options)
    - [1. Global Partial Prerendering (ppr)](#1-global-partial-prerendering-ppr)
    - [2. React StrictMode (reactStrictMode)](#2-react-strictmode-reactstrictmode)
    - [3. Storage Adapter (storage)](#3-storage-adapter-storage)
    - [4. Plugins Array (plugins)](#4-plugins-array-plugins)
  - [Dinou Plugin Architecture (onRequest)](#dinou-plugin-architecture-onrequest)
    - [The context Object (RequestContextStore)](#the-context-object-requestcontextstore)
    - [Pattern 1: Short-Circuit & Webhooks (Returning Response)](#pattern-1-short-circuit--webhooks-returning-response)
    - [Pattern 2: Middleware & Context Mutation (getContext)](#pattern-2-middleware--context-mutation-getcontext)
  - [Real-World Plugin Examples](#real-world-plugin-examples)
  - [Registration & Execution Pipeline Order](#registration--execution-pipeline-order)
  - [Fault Isolation & Error Handling](#fault-isolation--error-handling)
- [Bundlers & Build Tooling](#bundlers--build-tooling)
  - [Bundlers in Dinou](#bundlers-in-dinou)
  - [esbuild, Rollup, & Webpack Compared](#esbuild-rollup--webpack-compared)
    - [1. esbuild (Default & Lightning Fast)](#1-esbuild-default--lightning-fast)
    - [2. Rollup (Optimized Tree-Shaking)](#2-rollup-optimized-tree-shaking)
    - [3. Webpack (Enterprise & React Compiler)](#3-webpack-enterprise--react-compiler)
  - [The Dual-Bundle Engine Architecture](#the-dual-bundle-engine-architecture)
  - [Complete Dinou v7 Scripts Matrix](#complete-dinou-v7-scripts-matrix)
    - [Development Scripts (dinou dev)](#development-scripts-dinou-dev)
    - [Node.js Build & Start](#nodejs-build--start)
    - [Cloudflare Workers & Pages](#cloudflare-workers--pages)
    - [Deno & Standalone Compiles](#deno--standalone-compiles)
    - [Bun Runtime & Standalone Compiles](#bun-runtime--standalone-compiles)
    - [Static HTML Export (dinou export-static)](#static-html-export-dinou-export-static)
  - [Recommended package.json Setup](#recommended-packagejson-setup)
  - [Which Bundler & Target Should You Choose?](#which-bundler--target-should-you-choose)
- [Deployment Guide](#deployment-guide)
  - [Deploy Everywhere with Dinou v7](#deploy-everywhere-with-dinou-v7)
  - [Supported Deployment Targets](#supported-deployment-targets)
    - [1. Node.js (Docker, Fly.io, Railway, Render)](#1-nodejs-docker-flyio-railway-render)
    - [2. Netlify (Serverless Functions v2)](#2-netlify-serverless-functions-v2)
    - [3. Cloudflare Workers & Pages](#3-cloudflare-workers--pages)
    - [4. Deno Deploy (deno-edge) & Standalone Binaries](#4-deno-deploy-deno-edge--standalone-binaries)
    - [5. Bun Runtime & Standalone Executables](#5-bun-runtime--standalone-executables)
    - [6. Static Export (GitHub Pages, S3, CDN)](#6-static-export-github-pages-s3-cdn)
  - [Production Docker Setup](#production-docker-setup)
  - [Managing Production Environment Secrets](#managing-production-environment-secrets)
  - [Production Pre-Flight Checklist](#production-pre-flight-checklist)
- [Eject Dinou](#eject-dinou)
  - [Ejecting Dinou: Framework Sovereignty](#ejecting-dinou-framework-sovereignty)
  - [How to Eject (CLI & Scripts)](#how-to-eject-cli--scripts)
  - [What Happens When You Eject?](#what-happens-when-you-eject)
  - [Anatomy of the Ejected dinou/ Directory](#anatomy-of-the-ejected-dinou-directory)
  - [When to Consider Ejecting](#when-to-consider-ejecting)
  - [Ejection in the Agentic Era](#ejection-in-the-agentic-era)
  - [Practical Customization Examples](#practical-customization-examples)
    - [1. Adding Custom Server Middleware & Guards](#1-adding-custom-server-middleware--guards)
    - [2. Extending the Bundler Pipeline](#2-extending-the-bundler-pipeline)
  - [Best Practices for Ejected Projects](#best-practices-for-ejected-projects)
- [Complete API Reference](#complete-api-reference)
  - [1. Components (dinou)](#1-components-dinou)
    - [`<Link>`](#link)
    - [`<ClientRedirect>`](#clientredirect)
  - [2. Hooks & Navigation (dinou)](#2-hooks--navigation-dinou)
    - [redirect()](#redirect)
    - [useSearchParams()](#usesearchparams)
    - [usePathname()](#usepathname)
    - [useRouter()](#userouter)
    - [refreshSlot()](#refreshslot)
    - [useNavigationLoading()](#usenavigationloading)
  - [3. Type-Safe Routing (dinou)](#3-type-safe-routing-dinou)
    - [`PageProps`](#pageprops)
    - [`LayoutProps`](#layoutprops)
    - [`ErrorProps`](#errorprops)
    - [PageFunctions & LayoutFunctions](#pagefunctions--layoutfunctions)
    - [`RouteParams`](#routeparams)
    - [DinouRoute](#dinouroute)
    - [DinouRoutePattern](#dinouroutepattern)
  - [4. Server Context & Config (dinou)](#4-server-context--config-dinou)
    - [getContext()](#getcontext)
    - [defineConfig()](#defineconfig)
    - [DinouPlugin](#dinouplugin)
  - [5. Server Cache & Revalidation (dinou/server)](#5-server-cache--revalidation-dinouserver)
    - [revalidatePage()](#revalidatepage)
    - [revalidatePath()](#revalidatepath)
    - [revalidateTag()](#revalidatetag)
    - [`<DinouCacheSlot>`](#dinoucacheslot)
  - [6. Storage Adapters (dinou/server)](#6-storage-adapters-dinouserver)
    - [Built-In Adapters](#built-in-adapters)
    - [StorageAdapter Interface](#storageadapter-interface)
    - [Custom Storage Engine](#custom-storage-engine)
  - [7. Route Lifecycles & Config](#7-route-lifecycles--config)
    - [getProps()](#getprops)
    - [revalidate](#revalidate)
    - [ppr](#ppr)
    - [getCacheTags](#getcachetags)
    - [getStaticPaths](#getstaticpaths)
    - [allowISG](#allowisg)
    - [validateParams()](#validateparams)
- [Dinou Complete Cheatsheet](#dinou-complete-cheatsheet)
  - [1. File Conventions](#1-file-conventions-cheatsheet)
    - [Route Components & Lifecycles](#route-components--lifecycles)
    - [Layout Control Flags (Empty Files)](#layout-control-flags-empty-files)
    - [Route Escaping (`_prefix`)](#route-escaping-_prefix)
  - [2. Route Syntax & Types](#2-route-syntax--types)
    - [Route Patterns & Inferred Params](#route-patterns--inferred-params)
    - [Type-Safe Routing Helpers (`dinou`)](#type-safe-routing-helpers-dinou)
  - [3. Server Lifecycle Contracts](#3-server-lifecycle-contracts)
    - [Exported Contracts Table](#exported-contracts-table)
    - [Revalidation Modes (SSR vs ISR vs SSG)](#revalidation-modes-ssr-vs-isr-vs-ssg)
  - [4. Client Navigation & Hooks](#4-client-navigation--hooks)
    - [Link & Redirection Primitives](#link--redirection-primitives)
    - [Router & Navigation Hooks](#router--navigation-hooks)
  - [5. Server Primitives & Cache](#5-server-primitives--cache)
    - [getContext & DinouCacheSlot](#getcontext--dinoucacheslot)
    - [On-Demand Cache Invalidation (`dinou/server`)](#on-demand-cache-invalidation-dinouserver)
  - [6. Decision Matrix: When to Use What](#6-decision-matrix-when-to-use-what)
    - [Cache Invalidation: Which method should you call?](#cache-invalidation-which-method-should-you-call)
    - [Redirection: Which redirection strategy should you use?](#redirection-which-redirection-strategy-should-you-use)
    - [Route Parameter Access: Where should you read route data?](#route-parameter-access-where-should-you-read-route-data)
- [Changelog](#changelog)
- [License](#license)


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
    "dinou-env.d.ts",
    ".dinou/types/**/*.d.ts"
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

> **Note:** For the complete catalog of targeted platform cross-compilation scripts (such as Windows, macOS, Linux ARM/x64), see the [Complete CLI Scripts Catalog](#complete-dinou-v7-scripts-matrix).

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

For advanced compiler tuning, custom plugins, and SWC options, visit the [Bundlers Guide](#bundlers--build-tooling).

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

For complete deployment guides, Docker setups, and cloud hosting instructions, see the [Deployment Guide](#deployment-guide).

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

## Page & Layout Functions (page_functions.ts & layout_functions.ts)

In Dinou, every route segment can independently configure its data fetching, static pre-rendering, cache lifecycles, and parameter validation without cluttering component UI code. 

- **`page_functions.ts`**: Placed alongside `page.tsx`. Configures data fetching (`getProps`), static paths (`getStaticPaths`), cache strategy (`revalidate`), Partial Prerendering (`ppr`), cache tags (`getCacheTags`), and parameter validation (`validateParams`) specifically for that page.
- **`layout_functions.ts`**: Placed alongside `layout.tsx`. Supplies data directly to the layout component (`getProps`) and manages segment-level cache strategy (`revalidate`, `ppr`) independently from child pages.

### Overview & Horizontal Segmentation

Dinou strictly separates server-side data orchestration and cache configuration from presentation UI:

```
src/blog/
├── layout.tsx                # Presentation shell (RSC)
├── layout_functions.ts       # Layout cache strategy (revalidate = 300) & getProps
└── [slug]/
    ├── page.tsx              # Page presentation (RSC or "use client")
    └── page_functions.ts     # Page data fetching (getProps), paths, and validation
```

#### The Unified Architectural Contract: `RouteSegmentConfig<TParams, TProps>`

In Dinou, every server-side configuration file implements the exact same foundational contract: **`RouteSegmentConfig`**. This is the framework's underlying "abstract" interface defining all segment capabilities. For day-to-day application code, Dinou exports two concrete, role-based aliases: **`PageFunctions`** (for pages) and **`LayoutFunctions`** (for layouts):

```typescript
// Exported directly from "dinou":

/**
 * Foundational "abstract" interface governing all route segments in Dinou.
 */
export interface RouteSegmentConfig<TParams = any, TProps = any> {
  // Partial Prerendering (PPR) configuration
  ppr?: boolean | (() => boolean | Promise<boolean>);

  // Cache & revalidation strategy (< 1 = Dynamic SSR, >= 1 = ISR, false = Static)
  revalidate?: number | false | (() => number | false | Promise<number | false>);

  // Cache tags for on-demand invalidation via revalidateTag(tag)
  getCacheTags?: string[] | ((params?: TParams) => string[] | Promise<string[]>);

  // Path generator for SSG (constant array or sync/async function)
  getStaticPaths?: StaticPathItem<TParams>[] | (() => StaticPathsResult<TParams>);

  // Server loader providing direct props to the component
  getProps?: (params?: TParams) => TProps | Promise<TProps>;

  // Parameter validator guard (returns false to halt and return 404)
  validateParams?: (params?: TParams) => boolean | Promise<boolean>;

  // Controls whether Incremental Static Generation (ISG) is allowed for ungenerated paths
  allowISG?: boolean | (() => boolean | Promise<boolean>);
}

/**
 * Concrete semantic alias to import and use in 'page_functions.ts'
 */
export type PageFunctions<
  TRouteOrParams extends DinouRoutePattern | object = any,
  TProps = any
> = RouteSegmentConfig<
  [TRouteOrParams] extends [string] ? RouteParams<TRouteOrParams> : TRouteOrParams,
  TProps
>;

/**
 * Concrete semantic alias to import and use in 'layout_functions.ts'
 */
export type LayoutFunctions<
  TRouteOrParams extends DinouRoutePattern | object = any,
  TProps = any
> = RouteSegmentConfig<
  [TRouteOrParams] extends [string] ? RouteParams<TRouteOrParams> : TRouteOrParams,
  TProps
>;
```

| Where to use | Type to import | Purpose |
| :--- | :--- | :--- |
| `src/.../page_functions.ts` | `PageFunctions` | Types data loading (`getProps`), static paths, and cache for the **page**. |
| `src/.../layout_functions.ts` | `LayoutFunctions` | Types data loading (`getProps`) and independent cache for the **layout** shell. |
| Plugins & Shared Utils | `RouteSegmentConfig` | Base "abstract" interface for generic utilities that process arbitrary route segments. |

##### 3 Architectural Reasons for Separation

1. **Semantic Intent:** Seeing `import type { PageFunctions }` in a page file immediately clarifies intent and self-documents that the functions belong to the page tier.
2. **Mental Separation:** Reinforces Dinou's horizontal segment isolation: layouts have independent cache lifetimes and props from child pages.
3. **Future Extensibility:** If future Dinou versions introduce layout-only properties (e.g. scroll boundaries) or page-only hooks, your application code remains completely decoupled and non-breaking.

---

### 1. getProps (Direct Component Props)

Use `getProps` to load data on the server based on route `params` and pass it directly to your component.

> [!NOTE]
> **v7 Direct Return Contract:**
> In Dinou v7, `getProps` directly returns the props object (`{ ... }`). The legacy wrapper `{ page: { ... }, layout: { ... } }` has been deprecated because pages and layouts now have their own dedicated configuration files.

- **Arguments:** `params?: TParams` (The normalized dynamic route parameters)
- **Returns:** `TProps | Promise<TProps>` (Injected directly as the component's props)

#### Example: Type-Safe Page Component Loader

```typescript
// src/blog/[slug]/page_functions.ts
import type { PageFunctions, RouteParams } from "dinou";
import { db, type Post } from "@/lib/db";

export interface BlogPostData {
  post: Post;
}

// Best Practice: Type getProps using PageFunctions for strict parameters & return contract
export const getProps: PageFunctions<RouteParams<"/blog/[slug]">, BlogPostData>["getProps"] = async (params) => {
  const post = await db.getPost(params?.slug);
  // Directly returns BlogPostData for page.tsx
  return { post };
};
```

```tsx
// src/blog/[slug]/page.tsx
import type { PageProps } from "dinou";
import type { BlogPostData } from "./page_functions";

// Best Practice: Extend PageProps with the loader's returned BlogPostData
interface BlogPostProps extends PageProps<"/blog/[slug]">, BlogPostData {}

export default function BlogPost({ params, post }: BlogPostProps) {
  return (
    <article>
      <span className="text-xs text-muted-foreground">Route: /blog/{params.slug}</span>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}
```

#### Example: Type-Safe Layout Component Loader

```typescript
// src/blog/layout_functions.ts
import type { LayoutFunctions } from "dinou";
import { db } from "@/lib/db";

export interface BlogLayoutData {
  categories: string[];
}

// Best Practice: Type layout server functions with LayoutFunctions
export const getProps: LayoutFunctions<any, BlogLayoutData>["getProps"] = async () => {
  const categories = await db.getCategories();
  // Directly returns props for layout.tsx
  return { categories };
};
```

```tsx
// src/blog/layout.tsx
import type { LayoutProps } from "dinou";
import type { BlogLayoutData } from "./layout_functions";

// Best Practice: Extend LayoutProps for automatic typing of children and params
interface BlogLayoutProps extends LayoutProps, BlogLayoutData {}

export default function BlogLayout({
  children,
  categories,
}: BlogLayoutProps) {
  return (
    <div className="blog-shell">
      <aside className="blog-sidebar">
        <h3>Categories</h3>
        <ul>
          {categories.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </aside>
      <main>{children}</main>
    </div>
  );
}
```

#### Deep-Dive Architecture: Why `getProps` Only Receives `params` & The Dynamic Bailout Mechanism

##### Resource Identity & Cache Integrity

Route `params` (e.g. `/blog/[slug]`) identify the *resource*, not the visitor. Because the content for a given route is identical for everyone, Dinou can run `getProps` in advance—at build time (SSG) or on first request (ISR)—and safely pre-render and cache the HTML (in static storage, server memory, reverse proxies, or CDNs). 

In contrast, `cookies`, `headers`, and `query params` belong to a specific HTTP connection. If `getProps` relied on them, the output could contain private user data, making shared caching impossible and forcing the server to render every request on demand.

##### The Dynamic Bailout Mechanism

If you call `getContext()` inside `getProps` to read request-time connection data:

| Property Accessed | Behavior | Why? |
| :--- | :--- | :--- |
| `context.request.headers` | ❌ **Build Error (SSG) / Dynamic Bailout (SSR)** | Headers vary per client request. Accessing them invalidates shared static caching. |
| `context.request.cookies` | ❌ **Build Error (SSG) / Dynamic Bailout (SSR)** | Cookies are user-specific (sessions, auth). Cannot be baked into shared HTML. |
| `context.searchParams` | ❌ **Build Error (SSG) / Dynamic Bailout (SSR)** | Query strings vary infinitely (`?ref=...`, `?utm_source=...`). Cannot be pre-rendered at build time. |
| `context.params` | ✅ **Allowed Everywhere (SSG, ISR, SSR, PPR)** | Identifies the route resource (`[slug]`). Pure and deterministically cacheable. |

##### The Recommended Pattern: Where Each Type of Data Belongs

To keep pages pre-renderable (SSG/ISR) and instant to load, organize your data into its natural layer: route data in `getProps`, session cookies inside `<Suspense>`, and query parameters via the universal `useSearchParams()` hook:

```typescript
// src/blog/[slug]/page_functions.ts
import type { PageFunctions, RouteParams } from "dinou";
import { db, type Post } from "@/lib/db";

export interface BlogPostData {
  post: Post;
}

// 1. Pure route loader: depends solely on params
// Cached statically for all visitors (SSG / ISR)
export const getProps: PageFunctions<RouteParams<"/blog/[slug]">, BlogPostData>["getProps"] = async (params) => {
  const post = await db.getPost(params?.slug);
  return { post };
};
```

```tsx
// src/blog/[slug]/page.tsx
import { Suspense } from "react";
import type { PageProps } from "dinou";
import type { BlogPostData } from "./page_functions";
import { UserSession } from "./user-session";
import { RelatedPosts } from "./related-posts";
import { SearchFilter } from "./search-filter";

interface BlogPostProps extends PageProps<"/blog/[slug]">, BlogPostData {}

export default function BlogPostPage({ params, post }: BlogPostProps) {
  return (
    <article className="post-container">
      {/* 1. Instant static shell: delivered immediately from cache */}
      <header>
        <span className="text-xs text-muted-foreground">Route: /blog/{params.slug}</span>
        <h1>{post.title}</h1>
        {/* Client Component using useSearchParams() for instant input sync */}
        <SearchFilter />
      </header>

      <div className="post-body">{post.content}</div>

      {/* 2. Dynamic cookie component streamed via Suspense */}
      <Suspense fallback={<div className="text-xs text-muted-foreground">Loading session...</div>}>
        <UserSession />
      </Suspense>

      {/* 3. Server Component using useSearchParams() streamed via Suspense */}
      <Suspense fallback={<div className="text-xs text-muted-foreground">Filtering articles...</div>}>
        <RelatedPosts />
      </Suspense>
    </article>
  );
}
```

```tsx
// src/blog/[slug]/user-session.tsx (Server Component)
import { getContext } from "dinou";
import { auth } from "@/lib/auth";

// Cookie & auth access isolated inside Suspense:
// Streaming this component prevents getProps from bailing out to Dynamic SSR!
export async function UserSession() {
  const { req } = getContext();
  const sessionToken = req?.cookies?.session;
  const user = sessionToken ? await auth.verify(sessionToken) : null;

  if (!user) {
    return <a href="/login" className="text-xs font-semibold">Sign In</a>;
  }

  return (
    <aside className="user-badge">
      <span>Welcome back, <strong>{user.name}</strong>!</span>
    </aside>
  );
}
```

```tsx
// src/blog/[slug]/related-posts.tsx (Server Component)
import { useSearchParams } from "dinou";
import { db } from "@/lib/db";

// Universal hook in a Server Component:
// Reads ctx.req.query to fetch filtered data from the DB on the server.
// Because it reads query, wrap it in <Suspense> in page.tsx so the post shell stays static!
export async function RelatedPosts() {
  const searchParams = useSearchParams();
  const tag = searchParams.get("tag") ?? "featured";
  const articles = await db.getPostsByTag(tag);

  return (
    <section className="related-posts">
      <h3>Articles matching "?tag={tag}"</h3>
      <ul>
        {articles.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </section>
  );
}
```

```tsx
// src/blog/[slug]/search-filter.tsx (Client Component)
"use client";

import { useSearchParams } from "dinou";

// Universal hook in a Client Component:
// Reads URL params on the browser for reactive input state without contacting the server
export function SearchFilter() {
  const searchParams = useSearchParams();
  const currentTag = searchParams.get("tag") ?? "";

  return (
    <input
      type="search"
      defaultValue={currentTag}
      placeholder="Filter by tag (?tag=...)..."
      className="text-xs border rounded px-2 py-1"
    />
  );
}
```

| Data Layer | Handled In | Lifecycle & Strategy |
| :--- | :--- | :--- |
| **1. Route Data (Params)** | `getProps` in `page_functions.ts` | Pure and cacheable for all visitors (SSG / ISR). |
| **2. Cookies & Headers** | Server Components wrapped in `<Suspense>` | Streams dynamically without bailing out the static page shell. |
| **3. Universal useSearchParams()** | Server or Client Components with `<Suspense>` | Works in **Server Components** (streamed) and **Client Components** (instant UI). |

---

### 2. getStaticPaths (Static Generation)

Defines which dynamic parameter combinations should be pre-rendered at build time (SSG). By default, any dynamic path not returned is generated on-demand when first requested and cached statically for all subsequent visitors (Incremental Static Generation / ISG), unless disabled via `allowISG: false` (which strictly restricts routes to the pre-rendered list and returns 404 for any other path).

#### 2.1. Constant Array vs Function Export

In Dinou v7, `getStaticPaths` supports both a **constant array export** (for known, fixed paths) and a **synchronous or asynchronous function export** (for dynamic data sources like databases or headless CMSs):

```typescript
// 1. Constant Array Export (Zero runtime overhead, ideal for fixed routes or locales)
// src/blog/[slug]/page_functions.ts
import type { PageFunctions, RouteParams } from "dinou";

export const getStaticPaths: PageFunctions<RouteParams<"/blog/[slug]">]["getStaticPaths"] = [
  "welcome",
  "getting-started",
  "release-notes",
];
```

```typescript
// 2. Async Function Export (Queries databases or headless CMSs at build time)
// src/blog/[slug]/page_functions.ts
import type { PageFunctions, RouteParams } from "dinou";
import { db } from "@/lib/db";

export const getStaticPaths: PageFunctions<RouteParams<"/blog/[slug]">]["getStaticPaths"] = async () => {
  const posts = await db.post.findMany({ select: { slug: true } });
  return posts.map((p) => p.slug);
};
```

#### 2.2. Return Formats

Dinou accommodates simple, catch-all, and multi-segment architectures with flexible item formats:

| Route Type | Accepted Format | Example Return | Pre-rendered URLs |
| :--- | :--- | :--- | :--- |
| **Simple (`[id]` or `[slug]`)** | `string[]` | `number[]` | `["foo", "bar"]` or `[1, 2, 3]` | `/blog/foo`, `/blog/bar` |
| **Optional Simple (`[[id]]`)** | `(string | number | undefined)[]` | `[undefined, "foo", "bar"]` | `/shop`, `/shop/foo`, `/shop/bar` |
| **Catch-all (`[...slug]`)** | `string[][]` | `[["a", "b"], ["c"]]` | `/docs/a/b`, `/docs/c` |
| **Optional Catch-all (`[[...slug]]`)** | `(string[] | undefined)[]` | `[undefined, ["a"], ["a", "b"]]` | `/docs`, `/docs/a`, `/docs/a/b` |
| **Multi-Segment / Nested (`[cat]/[id]`)** | `Record<string, string | string[]>[]` | `[{ cat: "shoes", id: "100" }]` | `/shop/shoes/100` |

#### 2.3. Simple Dynamic Routes

Simple dynamic routes match a single URL segment. Dinou supports both required segments (`[id]`) and optional segments (`[[category]]`):

```typescript
// src/blog/[id]/page_functions.ts (Required segment [id])
import type { PageFunctions, RouteParams } from "dinou";

export const getStaticPaths: PageFunctions<RouteParams<"/blog/[id]">]["getStaticPaths"] = [
  "1",
  "2",
  "3",
]; // Generates: /blog/1, /blog/2, /blog/3
```

```typescript
// src/shop/[[category]]/page_functions.ts (Optional segment [[category]])
import type { PageFunctions, RouteParams } from "dinou";

// Pass undefined to pre-render the root route (/shop) without a parameter
export const getStaticPaths: PageFunctions<RouteParams<"/shop/[[category]]">]["getStaticPaths"] = [
  undefined, // Generates: /shop
  "shoes",   // Generates: /shop/shoes
  "shirts",  // Generates: /shop/shirts
];
```

#### 2.4. Catch-all Routes

Catch-all routes match multiple dynamic path segments. Dinou supports both standard catch-alls (`[...slug]`) and optional catch-alls (`[[...slug]]`):

```typescript
// src/docs/[...slug]/page_functions.ts (Required catch-all [...slug])
import type { PageFunctions, RouteParams } from "dinou";

export const getStaticPaths: PageFunctions<RouteParams<"/docs/[...slug]">]["getStaticPaths"] = [
  ["intro"],              // Generates: /docs/intro
  ["api", "v1", "auth"],  // Generates: /docs/api/v1/auth
];
```

```typescript
// src/docs/[[...slug]]/page_functions.ts (Optional catch-all [[...slug]])
import type { PageFunctions, RouteParams } from "dinou";

export const getStaticPaths: PageFunctions<RouteParams<"/docs/[[...slug]]">]["getStaticPaths"] = [
  undefined,              // Generates: /docs (root)
  ["intro"],              // Generates: /docs/intro
  ["api", "v1", "auth"],  // Generates: /docs/api/v1/auth
];
```

#### 2.5. Automatic Route Propagation (Recursion)

Static parameters automatically propagate downwards through the directory tree. If you define values for a segment, Dinou will recursively generate all nested static sub-pages under those values.

```
src/blog/[slug]/
├── page.tsx          # Page: /blog/[slug]
├── page_functions.ts # Returns ["post-a", "post-b"]
└── details/
    └── page.tsx      # Nested static page
```

If `getStaticPaths` in `blog/[slug]` returns `["post-a", "post-b"]`, Dinou generates 4 static pages:
1. `/blog/post-a`
2. `/blog/post-a/details`
3. `/blog/post-b`
4. `/blog/post-b/details`

#### 2.6. Nested Pages & The "Chain of Responsibility"

When nesting routes where both the parent and the child segment have their own `page.tsx`, static generation follows a strict top-down "chain of responsibility":

```
src/shop/[category]/
├── page.tsx              # Parent page: /shop/[category]
├── page_functions.ts     # Parent gatekeeper
└── [id]/
    ├── page.tsx          # Child page: /shop/[category]/[id]
    └── page_functions.ts # Child generator
```

Because the parent folder contains a `page.tsx`, Dinou must generate valid parent pages first before it can traverse down to the child level. The parent acts as a mandatory gatekeeper:

1. **If parent returns `[]`:** Dinou halts at the parent level and never invokes the child `[id]/page_functions.ts`. No product pages are generated.
2. **When parent resolves its categories:** It unlocks the child level:

```typescript
// 1. Parent: src/shop/[category]/page_functions.ts
import type { PageFunctions, RouteParams } from "dinou";

export const getStaticPaths: PageFunctions<RouteParams<"/shop/[category]">]["getStaticPaths"] = [
  "shoes",
  "shirts",
];

// 2. Child: src/shop/[category]/[id]/page_functions.ts
import type { PageFunctions, RouteParams } from "dinou";

export const getStaticPaths: PageFunctions<RouteParams<"/shop/[category]/[id]">]["getStaticPaths"] = [
  "100",
  "200",
];

// Automatically generates 4 static pages:
// /shop/shoes/100, /shop/shoes/200
// /shop/shirts/100, /shop/shirts/200
```

> [!TIP]
> **Rule of Thumb:**
> - If an intermediate folder has its own `page.tsx`, define a `page_functions.ts` at that folder level with scalar arrays (`string[]`).
> - If an intermediate folder does **not** have a `page.tsx`, you can define all nested parameters together in the leaf `page_functions.ts` using an Object Array.

#### 2.7. Nested & Pass-through Segments

When you have multiple dynamic segments in a path without intermediate pages (the intermediate folders do not have a `page.tsx`), the leaf segment returns an **Object** mapping all parameter names at once:

```
src/shop/[category]/[brand]/[...specs]/
└── page.tsx # Only leaf has a page.tsx
```

```typescript
// src/shop/[category]/[brand]/[...specs]/page_functions.ts
import type { PageFunctions, RouteParams } from "dinou";

export const getStaticPaths: PageFunctions<RouteParams<"/shop/[category]/[brand]/[...specs]">]["getStaticPaths"] = [
  {
    category: "electronics",
    brand: "apple",
    specs: ["m3", "16gb"], // → Pre-renders: /shop/electronics/apple/m3/16gb
  },
  {
    category: "clothing",
    brand: "nike",
    specs: ["running", "shoes", "size-10"], // → Pre-renders: /shop/clothing/nike/running/shoes/size-10
  },
];
```

#### 2.8. Async Support (CMS & DB)

`getStaticPaths` can be an `async` function, allowing you to query external headless CMSs, databases, or REST APIs during the build:

```typescript
// src/products/[id]/page_functions.ts
import type { PageFunctions, RouteParams } from "dinou";
import { db } from "@/lib/db";

export const getStaticPaths: PageFunctions<RouteParams<"/products/[id]">]["getStaticPaths"] = async () => {
  // Queries your database at build time (npm run build)
  const products = await db.products.findMany({ select: { id: true } });
  return products.map((product) => String(product.id));
};
```

---

### 3. validateParams (Route Parameter Validation)

Validates dynamic parameters (such as `[id]` or `[...slug]`) on the server prior to rendering. If `validateParams` returns `false` (or a falsy value), Dinou immediately terminates request processing and issues a **404 Not Found** response.

- **Arguments:** `params?: TParams` (The normalized route parameters object)
- **Returns:** `boolean | Promise<boolean>` (Return `false` to abort and render 404)

```typescript
// src/products/[id]/page_functions.ts
import type { PageFunctions, RouteParams } from "dinou";

type ProductParams = RouteParams<"/products/[id]">;

// 1. Synchronous validation: guarantees id is purely numeric
export const validateParams: PageFunctions<ProductParams>["validateParams"] = (params) => {
  return /^[0-9]+$/.test(params?.id ?? "");
};
```

```typescript
// src/blog/[slug]/page_functions.ts
import type { PageFunctions, RouteParams } from "dinou";
import { db } from "@/lib/db";

type BlogParams = RouteParams<"/blog/[slug]">;

// 2. Asynchronous validation: verifies record existence before rendering
export const validateParams: PageFunctions<BlogParams>["validateParams"] = async (params) => {
  if (!params?.slug) return false;
  const exists = await db.posts.exists({ slug: params.slug });
  return exists;
};
```

> [!NOTE]
> **Execution Timing:** `validateParams` executes **before** `getProps`. If validation fails, `getProps` will never run, preventing unnecessary database lookups.

---

### 4. allowISG (Incremental Static Opt-Out)

Controls whether dynamic paths that were not pre-rendered at build time (via `getStaticPaths` during `dinou build`) are allowed to be generated on-demand on the first incoming user request.

In Dinou v7, pre-rendering happens strictly during the build phase, ensuring production server startup is instantaneous.

- **Default (`true`):** Any valid path not pre-generated at build time is generated on-demand when the first visitor requests it, and subsequently cached statically (Incremental Static Generation / ISG).
- **Opt-Out (`false`):** Strictly restricts accessible routes to those explicitly returned by `getStaticPaths`. Any request for a path not pre-rendered immediately returns a **404 Not Found** without invoking `getProps` or running SSR.

```typescript
// src/docs/[slug]/page_functions.ts
import type { PageFunctions, RouteParams } from "dinou";

// Strict SSG: only these two articles exist; all other /docs/[slug] return 404
export const getStaticPaths: PageFunctions<RouteParams<"/docs/[slug]">]["getStaticPaths"] = [
  "installation",
  "architecture",
];

// Disallows on-demand generation for unlisted slugs
export const allowISG: PageFunctions["allowISG"] = false;
```

---

### 5. revalidate (ISR & Dynamic SSR Escape)

The `revalidate` export is Dinou's single source of truth for route caching and rendering behavior. It is measured in **seconds (s)**.

| Revalidate Value | Strategy | Lifecycle & Behavior |
| :--- | :--- | :--- |
| **`revalidate < 1` (or `0`)** | **Dynamic SSR** | Escapes static generation. The page is rendered dynamically on every incoming request with live database reads. |
| **`revalidate >= 1`** | **Incremental Static Regeneration (ISR)** | The page is cached statically for `N` seconds. Requests within the window receive instant cached HTML (`0ms` TTFB). After `N` seconds, a background regeneration is triggered. |
| **`revalidate = false`** | **Pure SSG (Default)** | The page is rendered once at build time and cached indefinitely until the next build or manual purge. |

```typescript
// src/metrics/page_functions.ts - Real-time dynamic SSR
import type { PageFunctions } from "dinou";

// Escapes SSG: executes getProps on every request
export const revalidate: PageFunctions["revalidate"] = 0;
```

```typescript
// src/store/[id]/page_functions.ts - 60-second ISR
import type { PageFunctions, RouteParams } from "dinou";

export const revalidate: PageFunctions["revalidate"] = 60; // 1 minute ISR
```

```typescript
// Conditional revalidation based on environment
export const revalidate: PageFunctions["revalidate"] = () => {
  return process.env.NODE_ENV === "development" ? 0 : 3600;
};
```

---

### 6. getCacheTags (Cache Tagging)

Assigns custom tags to the static page cache files, allowing the page to be purged and regenerated on-demand using `revalidateTag(tag)` (**On-Demand Revalidation**).

```typescript
// src/products/[id]/page_functions.ts
import type { PageFunctions, RouteParams } from "dinou";

type ProductParams = RouteParams<"/products/[id]">;

// 1. Constant Array
export const getCacheTags: PageFunctions["getCacheTags"] = ["catalog", "products"];

// 2. Synchronous Function (derives tags from route parameters)
export const getCacheTags: PageFunctions<ProductParams>["getCacheTags"] = (params) => {
  return ["catalog", `product-${params?.id}`];
};

// 3. Asynchronous Function (queries external tags or taxonomy)
export const getCacheTags: PageFunctions<ProductParams>["getCacheTags"] = async (params) => {
  const categories = await db.categories.forProduct(params?.id);
  return ["catalog", ...categories.map((c) => `category-${c.slug}`)];
};
```

#### On-Demand Invalidation via Server Function

When data changes, call `revalidateTag()` in a Server Function or webhook to instantly invalidate all cached files tagged with that identifier:

```typescript
// src/actions/products.ts
"use server";

import { revalidateTag } from "dinou";
import { db } from "@/lib/db";

export async function updateProduct(id: string, data: any) {
  await db.products.update({ where: { id }, data });
  // Instantly invalidates /products/[id] and any catalog pages sharing the tag
  await revalidateTag(`product-${id}`);
}
```

---

### 7. ppr (Partial Prerendering)

Partial Prerendering (PPR) combines the instant TTFB (Time to First Byte) of a static page with the real-time capabilities of dynamic server-side rendering over a single HTTP response.

#### How PPR Works: Instant Shell + Progressive Streaming

PPR eliminates the traditional trade-off between static and dynamic rendering by dividing the page into two phases over a single HTTP connection:
1. **Instant Static Shell:** Delivered immediately (`0ms` TTFB) from CDN edge or server cache. Includes layouts, navigation, and fallback skeletons.
2. **Dynamic Progressive Streaming:** Live components wrapped in React `<Suspense>` execute concurrently on the server and stream their resolved HTML chunks directly into the page.

```typescript
// src/dashboard/page_functions.ts
import type { PageFunctions } from "dinou";

// Enables Partial Prerendering for this route segment
export const ppr: PageFunctions["ppr"] = true;
```

```tsx
// src/dashboard/page.tsx
import { Suspense } from "react";
import { UserGreeting, UserGreetingSkeleton } from "./user-greeting";
import { LiveMetrics, MetricsSkeleton } from "./live-metrics";

export default function DashboardPage() {
  return (
    <div className="dashboard-layout">
      {/* Static Shell: Pre-rendered at build time (0ms TTFB) */}
      <header className="dashboard-header">
        <h1>Management Console</h1>
      </header>

      {/* Dynamic Holes: Streamed progressively over the open HTTP connection */}
      <Suspense fallback={<UserGreetingSkeleton />}>
        <UserGreeting />
      </Suspense>

      <Suspense fallback={<MetricsSkeleton />}>
        <LiveMetrics />
      </Suspense>
    </div>
  );
}
```

---

### 8. End-to-End Type-Safe Example

To achieve complete type safety, autocompletion, and compile-time validation in your routes, import `PageFunctions` and `LayoutFunctions` from `"dinou"` and pass your parameter and props types:

#### 1. Defining `src/blog/[slug]/page_functions.ts`

```typescript
// src/blog/[slug]/page_functions.ts
import type { PageFunctions, RouteParams } from "dinou";
import { db, type Post } from "@/lib/db";

// 1. Strict route parameters derived from URL pattern
export type BlogParams = RouteParams<"/blog/[slug]">;

// 2. Define data contract passed to the component
export interface BlogPageProps {
  post: Post;
  views: number;
}

// 3. Page configuration with full type inference
export const ppr: PageFunctions["ppr"] = true;
export const revalidate: PageFunctions["revalidate"] = 60; // 1 min ISR

export const getStaticPaths: PageFunctions<BlogParams>["getStaticPaths"] = [
  "welcome",
  "announcement",
];

export const getProps: PageFunctions<BlogParams, BlogPageProps>["getProps"] = async (params) => {
  const post = await db.posts.findUnique({ where: { slug: params?.slug } });
  if (!post) throw new Error("Post not found");
  return { post, views: 100 };
};

export const validateParams: PageFunctions<BlogParams>["validateParams"] = (params) => {
  return Boolean(params?.slug && params.slug.length > 2);
};

export const getCacheTags: PageFunctions<BlogParams>["getCacheTags"] = (params) => {
  return ["blog", `post-${params?.slug}`];
};
```

#### 2. Consuming Props in `src/blog/[slug]/page.tsx`

```tsx
// src/blog/[slug]/page.tsx
import { Suspense } from "react";
import type { PageProps } from "dinou";
import type { BlogPageProps } from "./page_functions";
import { RealtimeViews, ViewsSkeleton } from "./components";

// Extend PageProps to receive both route params and loader data with full type safety
interface BlogPostPageProps extends PageProps<"/blog/[slug]">, BlogPageProps {}

export default function BlogPostPage({ params, post }: BlogPostPageProps) {
  return (
    <article className="max-w-2xl mx-auto py-8">
      {/* 1. Static shell (pre-rendered at build time, delivered with 0ms TTFB) */}
      <span className="text-xs text-muted-foreground font-mono">/blog/{params.slug}</span>
      <h1 className="text-3xl font-bold">{post.title}</h1>
      <div className="text-sm text-muted-foreground my-2">
        By {post.author} • published {post.publishedAt}
      </div>
      <div className="prose mt-6">{post.content}</div>

      {/* 2. PPR Dynamic Stream: Real-time analytics streamed in via Suspense */}
      <Suspense fallback={<ViewsSkeleton />}>
        <RealtimeViews slug={params.slug} />
      </Suspense>
    </article>
  );
}
```

#### 3. Defining `src/blog/layout_functions.ts`

```typescript
// src/blog/layout_functions.ts
import type { LayoutFunctions, RouteParams } from "dinou";
import { db } from "@/lib/db";

// 1. Layout parameters for /blog (static route segment without dynamic params = {})
type BlogLayoutParams = RouteParams<"/blog">;

// 2. Define layout data contract
export interface BlogCategory {
  id: string;
  name: string;
  count: number;
}

export interface BlogLayoutData {
  categories: BlogCategory[];
  featuredSlug: string;
}

// 3. Dedicated layout loader typed via LayoutFunctions
export const getProps: LayoutFunctions<BlogLayoutParams, BlogLayoutData>["getProps"] = async () => {
  const categories = await db.categories.findMany();
  const featured = await db.posts.findFirst({ where: { featured: true } });

  // Injected directly as props into layout.tsx
  return {
    categories,
    featuredSlug: featured?.slug ?? "welcome",
  };
};

// 4. Segment-level caching strategy for the layout shell
export const revalidate: LayoutFunctions["revalidate"] = 300; // Layout revalidates every 5 mins
export const ppr: LayoutFunctions["ppr"] = true;
```

#### 4. Consuming Props in `src/blog/layout.tsx`

```tsx
// src/blog/layout.tsx
import type { LayoutProps } from "dinou";
import type { BlogLayoutData } from "./layout_functions";

// Extend LayoutProps to receive children, segment params, and layout loader data
interface BlogLayoutComponentProps extends LayoutProps<"/blog">, BlogLayoutData {}

export default function BlogLayout({
  children,
  categories,
  featuredSlug,
}: BlogLayoutComponentProps) {
  return (
    <div className="blog-container">
      <aside className="blog-sidebar">
        <h3>Categories</h3>
        <ul>
          {categories.map((c) => (
            <li key={c.id}>
              {c.name} ({c.count})
            </li>
          ))}
        </ul>
      </aside>
      <main className="blog-content">
        {children}
      </main>
    </div>
  );
}
```

#### Alternative Object Destructuring Pattern

If you prefer defining all configurations in a single typed object before exporting, use object destructuring:

```typescript
// 1. Page Config Object in src/blog/[slug]/page_functions.ts
const pageConfig: PageFunctions<BlogParams, BlogPageProps> = {
  ppr: true,
  revalidate: 60,
  getStaticPaths: ["welcome", "announcement"],
  getProps: async (params) => {
    const post = await fetchPost(params?.slug);
    return { post, views: 100 };
  },
  validateParams: (params) => Boolean(params?.slug),
  getCacheTags: (params) => ["blog", `post-${params?.slug}`],
};

export const { ppr, revalidate, getStaticPaths, getProps, validateParams, getCacheTags } = pageConfig;

// 2. Layout Config Object in src/blog/layout_functions.ts
const layoutConfig: LayoutFunctions<any, BlogLayoutData> = {
  revalidate: 300,
  ppr: true,
  getProps: async () => ({
    categories: await fetchCategories(),
    featuredSlug: "welcome",
  }),
};

export const { revalidate, ppr, getProps } = layoutConfig;
```

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
### 7. Complete Rendering Strategies Matrix

Summary of all rendering strategies supported natively by Dinou v7:

| Strategy | How to Configure | TTFB | Freshness | Database Load | Best For |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pure SSG** | Default / `revalidate = false` | `0ms` (Instant) | Build-time | `0` queries (Build-time only) | Landing pages, marketing, documentation |
| **ISR** | `revalidate = N` (`N >= 1`) | `0ms` (Cached) | Stale-while-revalidate | 1 query per TTL (`0` on cache hits) | Blogs, catalogs, news feeds |
| **Dynamic SSR** | `revalidate = 0` | Request-time (Blocked) | 100% Real-time | Heavy: 100% queries on every request | User settings, banking, checkout |
| **PPR (Partial Prerendering)** | `ppr = true` + `<Suspense>` | `0ms` (Shell from Edge) | 100% Real-time (Holes) | Heavy: 100% Hole queries on every request | E-commerce, dashboards with static shells |
| **Micro-ISR (Static / Asymmetric ISR)** | `<DinouCacheSlot>` (in Static/ISR page) | `0ms` (CDN Edge) | Decoupled Slot TTL / Tags | Low: Isolated to expired slots | Static product/catalog pages with volatile widgets (stock, prices) |
| **Micro-ISR (Dynamic SSR)** | `<DinouCacheSlot>` (in Dynamic SSR page) | Fast (Early Layout / Slot-cached) | Component TTL / Tags | Low: Isolated to expired slots | Dynamic user dashboards with heavy SQL calculations |
| **PPR + Micro-ISR (Synergy)** | `ppr = true` + `<DinouCacheSlot>` | `0ms` (Edge) + `~2ms` (Hole) | Cached Streamed Hole | Near-Zero: 1 query per slot TTL (99.9% reduction) | High-concurrency e-commerce, telemetry dashboards |
| **ISG (Incremental Static)** | `allowISG = true` (default) | `0ms` (after 1st hit) | Cached permanently | 1 query on 1st generation (`0` thereafter) | Long-tail e-commerce products, dynamic paths |

> [!TIP]
> For deep-dive code recipes, runtime execution timing, TTFB charts, and production trade-offs across all 13 rendering and data fetching patterns, see [Data Fetching: The 13 Strategies](#data-fetching-the-13-strategies) below.

---

## Server Functions ("use server")

Server Functions are asynchronous RPC endpoints that run exclusively in the server runtime. In Dinou, you declare them by adding the `"use server"` directive at the top of a dedicated action file (**module-level directive**).

### Overview & "use server" Directive

| Capability | Architectural Benefit |
| :--- | :--- |
| **Zero API Boilerplate** | No manual route handlers, `fetch()` boilerplate, or JSON serialization required. Dinou generates typed Flight RPC endpoints (`POST /____server_function____`) automatically. |
| **JSX & Data Returns** | Unlike standard RPCs that only return JSON, Dinou Server Functions can return fully rendered React components streamed over Flight RPC (*The Dinou Pattern*). |
| **Security & Secrets** | Secret keys, database connections, and ORM calls are never bundled into the client-side JavaScript chunk. |
| **Form & Action Synergy** | Native integration with HTML `<form action={...}>` and React 19 primitives (`useActionState`, `useFormStatus`, `useOptimistic`). |

---

### 1. Returning Live React Components (UI Streaming)

Dinou uniquely allows Server Functions to return fully rendered React component trees directly over Flight RPC. In Server Components, the component is awaited directly inside native `<Suspense>`; in Client Components, the returned promise is unwrapped with React 19's `use()` hook:

#### Pattern A: Server Function (Returning Rendered JSX)

```tsx
// src/actions/get-post-card.tsx
"use server"; // 👈 Module-level directive in Dinou

import db from "@/lib/db";
import { PostCard } from "@/components/post-card";

export async function getPostCard(postId: string) {
  const post = await db.posts.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");

  // Returns a rendered JSX component directly over Flight RPC!
  return <PostCard post={post} />;
}
```

#### Pattern B: Consuming in Server Components (Async / Await)

Directly `await` the Server Function inside an async component. React streams HTML progressively as promises resolve:

```tsx
// src/blog/page.tsx
// Server Component: directly await the Server Function with React 19 Suspense
import { Suspense } from "react";
import { getPostCard } from "@/actions/get-post-card";

async function PostSlot({ id }: { id: string }) {
  // Directly awaited on the server during SSR / streaming
  return await getPostCard(id);
}

export default function BlogPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Featured Story</h1>
      
      {/* Native React 19 Suspense fallback */}
      <Suspense fallback={<div className="skeleton h-48 w-full rounded" />}>
        <PostSlot id="post-101" />
      </Suspense>
    </section>
  );
}
```

#### Pattern C: Consuming in Client Components (with React 19 `use()`)

Dispatches Flight RPC returning a Promise. React 19's native `use(promise)` unrolls it synchronously inside `<Suspense>` without external state libraries, and re-suspends cleanly on promise update:

```tsx
// src/blog/page.tsx
// Client Component: unwrap the Flight RPC promise with React 19 use()
"use client";

import { useState, use, Suspense } from "react";
import { getPostCard } from "@/actions/get-post-card";

function PostStream({ promise }: { promise: Promise<React.ReactNode> }) {
  // Pure React 19 'use()' unrolls the promise within Suspense
  const content = use(promise);
  return <>{content}</>;
}

export default function BlogPage() {
  const [postId, setPostId] = useState("post-1");
  const [postPromise, setPostPromise] = useState(() => getPostCard("post-1"));

  const loadPost = (id: string) => {
    setPostId(id);
    setPostPromise(getPostCard(id));
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Featured Story</h1>

      <div className="flex gap-2">
        <button onClick={() => loadPost("post-1")} className="btn">Post 1</button>
        <button onClick={() => loadPost("post-2")} className="btn">Post 2</button>
      </div>

      {/* Re-suspends cleanly on promise update */}
      <Suspense key={postId} fallback={<p>Streaming post from server...</p>}>
        <PostStream promise={postPromise} />
      </Suspense>
    </section>
  );
}
```

> [!NOTE]
> **Execution Comparison: Server vs. Client Components**
> - **In Server Components (Async / Await):** Directly `await` the Server Function inside an async component. React streams HTML progressively as promises resolve.
> - **In Client Components (with `use()`)**: Dispatches Flight RPC returning a Promise. React 19's native `use(promise)` unrolls it synchronously inside `<Suspense>` without external state libraries.

---

### 2. Server Actions & Form Mutations

Dinou integrates seamlessly with standard HTML forms and React 19 form actions for data mutations.

#### 2.1. Server Actions in Forms

You can pass a Server Action directly to the native HTML `<form action={...}>` attribute:

```tsx
// src/components/newsletter-page.tsx
"use client";

import { subscribeNewsletter } from "@/actions/subscribe";

export default function NewsletterPage() {
  return (
    <form action={subscribeNewsletter} className="flex gap-2">
      <input name="email" type="email" placeholder="name@domain.com" required className="input" />
      <button type="submit" className="btn-primary">Subscribe</button>
    </form>
  );
}
```

```typescript
// src/actions/subscribe.ts
"use server"; // 👈 Required at the module level in Dinou

import db from "@/lib/db";

export async function subscribeNewsletter(formData: FormData) {
  const email = formData.get("email") as string;
  await db.subscribers.create({ data: { email } });
}
```

> [!NOTE]
> **Module-Level Directives & Client Execution**
> Dinou requires the `"use server"` directive to be placed at the **top of the action file** (not inline within function bodies). When a form submits, Dinou's client runtime transparently dispatches a Flight RPC request (`POST /____server_function____`) to execute the server action and receive updated UI state.

> [!TIP]
> **What does `subscribeNewsletter` return? (Understanding `void` / `undefined`)**
> This action returns `Promise<void>`, which resolves to **`undefined`**. In pure React 19 form actions (`<form action={subscribeNewsletter}>`), this is completely standard for *fire-and-forget* mutations: the browser submits the form data, the server executes the database write, and no state payload is needed by the UI.
>
> **When should a Server Action return a value?** If your UI needs to display interactive feedback (such as *"Subscribed successfully!"* or validation errors), the action should return a serializable payload (e.g. `{ success: true, message: "..." }`) and be wired to React 19's **`useActionState`** hook (as shown below in Section 2.2). Other common patterns include performing a server-side `redirect()` or calling `revalidatePath()` before completing.

---

#### 2.2. React 19 Hooks: useActionState & useFormStatus

For rich interactive forms with validation feedback and loading spinners, use React 19's standard hooks:

- **`useActionState` (React 19)**: Captures the returned state (errors, success payload) and pending status of the Server Action across submissions.
- **`useFormStatus` (`react-dom`)**: Reads the pending submission status of the parent `<form>` without prop drilling.

```tsx
// src/components/create-post-form.tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createPostAction, type FormState } from "@/actions/posts";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Saving..." : "Publish Post"}
    </button>
  );
}

const initialState: FormState = { success: false, message: "" };

export function CreatePostForm() {
  // useActionState binds the server action to form state and tracks submission
  const [state, formAction, isPending] = useActionState(createPostAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.message && (
        <div className={state.success ? "text-green-500" : "text-red-500"}>
          {state.message}
        </div>
      )}

      <input name="title" placeholder="Post title" required className="input" />
      <textarea name="content" placeholder="Write content..." required className="textarea" />
      
      <SubmitButton />
    </form>
  );
}
```

```typescript
// src/actions/posts.ts
"use server"; // 👈 Module-level directive required in Dinou

import db from "@/lib/db";

export type FormState = {
  success: boolean;
  message: string;
};

// Server Action receives (prevState, formData) when bound to useActionState
export async function createPostAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();

  if (!title || title.length < 3) {
    return { success: false, message: "Title must be at least 3 characters." };
  }

  if (!content) {
    return { success: false, message: "Content cannot be empty." };
  }

  await db.posts.create({ data: { title, content } });
  return { success: true, message: "Post published successfully!" };
}
```

---

#### 2.3. Optimistic Updates with useOptimistic

With React 19's `useOptimistic`, you can update the user interface immediately before the server responds:

```tsx
// src/components/like-button.tsx
"use client";

import { useOptimistic, useTransition } from "react";
import { toggleLikeAction } from "@/actions/likes";

export function LikeButton({ postId, initialLikes }: { postId: string; initialLikes: number }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticLikes, setOptimisticLikes] = useOptimistic(
    initialLikes,
    (current, update: number) => current + update
  );

  const handleClick = () => {
    startTransition(async () => {
      setOptimisticLikes(1); // Optimistically increment in 0ms on client
      await toggleLikeAction(postId); // Dispatches Server Action via Flight RPC
    });
  };

  return (
    <button onClick={handleClick} disabled={isPending} className="btn-like">
      ❤️ {optimisticLikes}
    </button>
  );
}
```

```typescript
// src/actions/likes.ts
"use server"; // 👈 Module-level directive required in Dinou

import db from "@/lib/db";

export async function toggleLikeAction(postId: string) {
  // Updates like count on the database
  await db.posts.update({
    where: { id: postId },
    data: { likes: { increment: 1 } },
  });

  return { success: true };
}
```

> [!NOTE]
> **Why is there no `<Suspense>` boundary here?**
> `<Suspense>` only activates when a component *suspends* (by throwing a pending Promise, such as with `React.use(promise)` or an async Server Component).
>
> In contrast, **`useOptimistic` does the exact opposite of suspending**: it synchronously paints the temporary new value (e.g. switching immediately from `10` to `11`) in **0ms** on the client, avoiding loading spinners or skeleton fallbacks entirely while the Server Action runs in the background. It relies strictly on React 19 transitions (`useTransition` or Form Actions). If the server call succeeds, React seamlessly commits the real server state; if it fails, React automatically rolls back to the initial value with zero boilerplate.

---

### 3. Request Context, Cookies & Headers (getContext)

Dinou provides `getContext()` (exported from `"dinou"`) to access the underlying request and response lifecycle synchronously within any Server Function or SSR component.

**RequestContextStore API Reference:**
- `context.req.cookies`: Dictionary of incoming client cookies (e.g. `cookies["session_token"]`).
- `context.req.headers`: Incoming HTTP headers dictionary (e.g. `headers["user-agent"]`).
- `context.req.query`: URL search parameters.
- `context.res.cookie(name, value, options)`: Sets an HTTP cookie with options (`httpOnly`, `secure`, `maxAge`, `sameSite`, `path`, etc.).
- `context.res.clearCookie(name, options)`: Clears a cookie from the client.

#### 3.1. Reading Query, Headers & Cookies

```typescript
// src/actions/auth-check.ts
"use server";

import { getContext } from "dinou";

export async function getCurrentUser() {
  const context = getContext();
  if (!context) return null;

  const sessionToken = context.req.cookies["session_token"];
  const userAgent = context.req.headers["user-agent"];

  if (!sessionToken) return null;
  return await verifySession(sessionToken);
}
```

#### 3.2. Setting & Clearing Cookies

```typescript
// src/actions/login.ts
"use server";

import { getContext } from "dinou";

export async function loginAction(formData: FormData) {
  const context = getContext();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const session = await authenticateUser(email, password);

  // Set secure HTTP-only session cookie
  context?.res.cookie("session_token", session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    path: "/",
  });

  return { success: true };
}

export async function logoutAction() {
  const context = getContext();
  // Clear the cookie upon logout
  context?.res.clearCookie("session_token", { path: "/" });
  return { success: true };
}
```

---

### 4. Redirections (redirect)

Dinou provides a universal `redirect(destination)` utility exported from `"dinou"`:

- **In Server Functions (Soft SPA Navigation):** When called inside a Server Function (e.g. form mutations or RPC calls), Dinou automatically performs a smooth client-side transition to the destination route via the SPA router **without a full page reload**.
- **In Server Components (Initial SSR):** If headers have not yet been sent, Dinou issues a clean HTTP 302 redirect for SEO and search engine crawlers. If response streaming has already started, it completes the transition on the client upon hydration.
- **In Client Components (Declarative Redirects):** When called directly in client components during render, it triggers an immediate client router replacement (`router.replace()`) without reloading the page.

```typescript
// src/actions/checkout.ts
"use server";

import { redirect } from "dinou";
import db from "@/lib/db";

export async function completeOrder(orderId: string) {
  await db.orders.updateStatus(orderId, "PAID");

  // Automatically navigates the client router to the success page
  return redirect(`/checkout/${orderId}/success`);
}
```

#### 4.1. The 4 Execution Contexts (HTTP 302 vs. Client Transition)

A foundational question when handling redirects across hybrid architectures is: *How does Dinou determine whether `redirect()` issues an HTTP 302 vs. a client-side transition, and is calling `redirect()` in a Server Component equivalent to invoking it via a Server Function?*

> [!NOTE]
> **The Equivalence Principle in Server Components**
> Calling `redirect()` directly inside a Server Component vs. calling an imported Server Function (e.g., `await verifyUser()`) from that Server Component is **functionally identical**. Because both run inside the same server Node.js process during the same SSR request lifecycle, they share the exact same request context and streaming state.

##### Context 1: SSR Root (page_functions.ts, page.tsx, Plugin) -> HTTP 302

Occurs inside `getProps()` in `page_functions.ts`, at the top level of the root `page.tsx` Server Component (outside any `<Suspense>` boundary), or in a global plugin hook (`onRequest`) in `dinou.config.mjs`. Because zero HTML bytes have reached the wire (`headersSent === false`), Dinou issues a clean **HTTP 302** with a `Location` header. **Crucial for SEO crawlers and search indexers.**

```typescript
// src/dashboard/page_functions.ts
import { redirect, getContext } from "dinou";

export async function getProps() {
  const { req } = getContext();
  if (!req.cookies.session_token) {
    // Evaluated before page rendering -> HTTP 302 redirect
    return redirect("/login");
  }
  return { user: { name: "Alex" } };
}
```

```tsx
// src/dashboard/page.tsx (Server Component root)
import { redirect, getContext } from "dinou";

export default async function DashboardPage() {
  const { req } = getContext();
  if (!req.cookies.session_token) {
    // At root before stream begins -> HTTP 302 redirect
    return redirect("/login");
  }

  return <h1>Welcome to Dashboard</h1>;
}
```

```javascript
// dinou.config.mjs (Global Plugin Hook)
import { defineConfig } from "dinou/config";

export default defineConfig({
  plugins: [
    {
      name: "auth-guard",
      async onRequest(request, context) {
        const url = new URL(request.url);
        const cookieHeader = request.headers.get("cookie") || "";
        // Runs pre-flight before SSR or route resolution
        if (url.pathname.startsWith("/dashboard") && !cookieHeader.includes("session_token=")) {
          return Response.redirect(new URL("/login", request.url), 302);
        }
      },
    },
  ],
});
```

##### Context 2: SSR Deferred (<Suspense>) -> Client Hydration

Occurs inside an async child wrapped in `<Suspense fallback={<Skeleton />}>`. React opens the HTTP connection with status `200 OK` immediately to stream the initial shell. At HTTP protocol level, an open `200 OK` stream cannot turn into a `302`. Dinou safely emits `<ClientRedirect />`, completing the transition upon browser hydration without breaking the stream:

```tsx
// src/reports/page.tsx (Server Component)
import { Suspense } from "react";
import { redirect } from "dinou";

async function RestrictedReport() {
  const isAllowed = await checkUserAccess();
  if (!isAllowed) {
    // 200 OK stream already open -> <ClientRedirect />
    return redirect("/unauthorized");
  }
  return <div>Financial Metrics</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading financial report...</p>}>
      <RestrictedReport />
    </Suspense>
  );
}
```

##### Context 3: Server Function from Client -> Soft SPA Navigation

Triggered from browser interactions (form actions or button clicks) via a dedicated `POST` request. Dinou executes the server mutation and intercepts `redirect()` before streaming (headers unsent), returning redirect metadata. The client proxy navigates via the SPA router **without a full page reload**:

```typescript
// src/actions/cart.ts
"use server";

import { redirect } from "dinou";
import db from "@/lib/db";

export async function checkoutAction(formData: FormData) {
  const order = await db.orders.create({ /* ... */ });

  // Dedicated POST: soft SPA navigation in browser without page reload
  return redirect(`/orders/${order.id}`);
}
```

##### Context 4: Client Component (Render) -> Client Router Replacement

Executes 100% in the browser with zero server roundtrip. Immediately dispatches `router.replace()` in the client SPA router, updating route and UI in 0ms:

```tsx
// src/components/client-guard.tsx
"use client";

import { redirect } from "dinou";

export function ClientGuard({ isAllowed }: { isAllowed: boolean }) {
  if (!isAllowed) {
    // In-browser render: executes router.replace() in SPA router
    return redirect("/forbidden");
  }

  return <button className="btn">Control Panel</button>;
}
```

---

#### 4.2. Universal Redirection Matrix

| Invocation Context | Headers Sent? | Resulting Mechanism | Recommended For |
| :--- | :--- | :--- | :--- |
| **1. SSR Root**<br>(`page_functions.ts`, root `page.tsx`, Plugin) | **No** | **Hard HTTP Redirect (Status 302)**<br>Server issues an `HTTP/1.1 302 Found` with a `Location` header. The browser or search crawler intercepts it at the protocol level and fetches the new page as a fresh document. | Auth guards (`getProps`), root guards, global middleware plugins, SEO canonicals |
| **2. SSR: Deferred**<br>(`<Suspense>`) | **Yes**<br>*(200 OK stream open)* | **Streaming Fallback (`<ClientRedirect />`)**<br>Because the `200 OK` chunked stream cannot be rewritten to a `302`, Dinou injects `<ClientRedirect />` into the stream. The browser router transitions upon hydration without aborting the connection. | Deferred conditional access, late data-dependent checks inside Suspense |
| **3. Server Function**<br>*(from Client Action)* | **No**<br>*(standard POST)* | **Soft SPA Navigation (Status 200)**<br>Server returns HTTP `200 OK` with redirection metadata. Dinou's client runtime intercepts it and navigates via the SPA router without a full page reload or loss of client state. | Form submissions, shopping cart checkout, stateful mutations |
| **4. Client Component**<br>*(Render)* | **N/A**<br>*(in-browser)* | **Client Router Replacement (`router.replace()`)**<br>Executes 100% in the browser with zero server roundtrip. Immediately dispatches `router.replace()` in the client SPA router, updating route and UI in 0ms. | Pure UI state redirection, client-side permission gates |

> [!TIP]
> **Looking for Cache Revalidation?**
> Learn how to purge stale SSG pages and ISR cache slots on-demand using `revalidatePath` and `revalidateTag` in [On-Demand Revalidation](#on-demand-revalidation) below.

---

## On-Demand Revalidation

High-performance web applications cannot rely exclusively on time-based expiration (TTL). On-Demand Revalidation in Dinou enables instantaneous cache purging and static regeneration across four specialized tiers:

### Overview & Multi-Tier Architecture

| Invalidation Tier | API & Mechanism | Architectural Scope |
| :--- | :--- | :--- |
| **Surgical Page** | `revalidatePage(path)` | Regenerates exclusively `page.rsc` and `index.html`, leaving all parent layout shells completely untouched. |
| **Route Segment** | `revalidatePath(path)` | Purges page RSC, HTML, and any `layout.rsc` in that segment. Supports recursive propagation with `{ cascade: true }`. |
| **Cross-Cutting Tag** | `revalidateTag(tag)` | Selectively updates layouts, pages, or micro-slots across disparate routes sharing a common metadata tag key. |
| **Micro-Slot** | `<DinouCacheSlot>` | Isolates volatile component subtrees refreshed independently via `refreshSlot()` or targeted `revalidateTag()`. |

Server revalidation APIs are exported from the server-only endpoint `"dinou/server"`, keeping browser client bundles clean, lightweight, and secure.

> [!CAUTION]
> **Strict Execution Rules: Where to Call Revalidation APIs**
> - **Only in Mutative Event Contexts:** Revalidation APIs (`revalidatePage`, `revalidatePath`, `revalidateTag`) are mutative side-effects. They must only be invoked inside **Server Functions** (`"use server"`) or **HTTP Webhook endpoints** (such as Headless CMS publishing events).
> - **Never Inside Components or `getProps`:** Calling revalidation during the component render phase or within `getProps` creates an **infinite regeneration loop**, causing severe CPU exhaustion and server crashes.

---

### 1. revalidatePage (Surgical Page Invalidation)

Exported from `"dinou/server"`, `revalidatePage(path)` is specifically designed for scenarios where **only the leaf page content has changed**. It provides two critical advantages:

1. **Maximum Performance:** Avoids the CPU and disk/KV I/O costs of re-rendering and recompiling unaffected parent layouts.
2. **Architectural Safety:** By leaving all `layout.rsc` files untouched, it guarantees that parent layout definitions remain completely stable, eliminating any danger of introducing accidental **Hydration Mismatches** into child routes.

> [!WARNING]
> **The Layout Revalidation Trap: Preventing Hydration Mismatches**
> In full-stack React frameworks, revalidating a layout is an operation that carries subtle architectural risks. When a layout (`layout.rsc`) is regenerated, all underlying child routes still have their static pre-rendered `index.html` baked with the **previous layout markup**.
>
> If a user performs a **hard reload (F5)** or accesses a child route directly by URL, the browser first displays the stale `index.html` shell. When the incoming streaming RSC resolves with the newly regenerated `layout.rsc`, React 19 detects conflicting DOM trees and triggers a **Hydration Mismatch error** accompanied by visible UI flashes.
>
> **Why `revalidatePage` is safe:** It only updates the leaf `page.rsc` and that page's specific `index.html`. Because parent layouts remain completely untouched, zero child routes are put at risk. (When a layout *does* need to change, use `revalidatePath(path, { cascade: true })` to propagate fresh HTML to all children).

#### 1.1. Usage in Server Functions

Call `revalidatePage` directly inside your Server Functions or route handlers:

```typescript
// src/blog/server-functions.ts
"use server";

import { revalidatePage } from "dinou/server";
import db from "@/lib/db";

export async function updateArticle(slug: string, newContent: string) {
  await db.articles.update({
    where: { slug },
    data: { content: newContent, updatedAt: new Date() },
  });

  // Regenerates ONLY page.rsc and index.html for this blog post
  // Parent layout.rsc is NOT touched!
  await revalidatePage(`/blog/${slug}`);
}
```

> [!NOTE]
> **What does `revalidatePage` do internally?**
> - **Regenerates `page.rsc`:** Runs the server component renderer for that route and atomically promotes the new binary RSC stream.
> - **Regenerates `index.html`:** Re-renders the complete HTML for initial visits and SEO crawlers.
> - **Zero Layout Overhead:** Leaves all layout files (`layout.rsc`) completely untouched, saving valuable CPU cycles on complex or shared layouts.
> - **Full Edge KV Parity:** In Edge runtimes (Cloudflare Workers, Deno KV), it updates the KV keys for `page.rsc` and `index.html` atomically.

---

### 2. revalidatePath (Route & Segment Purge)

Exported from `"dinou/server"`, `revalidatePath` is the comprehensive segment revalidation method. It rebuilds the static files in that directory, including any `layout.tsx` residing in that folder:

```typescript
// src/dashboard/server-functions.ts
"use server";

import { revalidatePath } from "dinou/server";

export async function refreshDashboard() {
  // Revalidates /dashboard (page.rsc, index.html, and layout.rsc if present in that folder)
  await revalidatePath("/dashboard");
}
```

#### 2.1. Cascading Revalidation ({ cascade: true })

When updating a shared layout (such as a dashboard shell with dynamic sidebar menus, breadcrumbs, or notifications), simply revalidating the layout is not enough for full static consistency. Pass `{ cascade: true }`:

```typescript
// src/dashboard/server-functions.ts
"use server";

import { revalidatePath } from "dinou/server";

export async function updateDashboardNavigation() {
  // Revalidates /dashboard and cascades revalidatePage to ALL child routes
  await revalidatePath("/dashboard", { cascade: true });
}
```

> [!NOTE]
> **How Cascading Revalidation Operates Internally:**
> 1. **Primary Revalidation:** Dinou revalidates the target route `/dashboard` (`layout.rsc`, `page.rsc`, and `index.html`).
> 2. **Safety Guard Condition:** The cascade **only activates if a layout in that route was actually revalidated**. If the route contains no layout, no unnecessary cascade is triggered.
> 3. **Recursive Propagation:** Dinou discovers all child sub-routes (e.g. `/dashboard/analytics`, `/dashboard/settings`, `/dashboard/users`) and automatically invokes `revalidatePage(childPath)` on each one in parallel.

---

### 3. Granularity & Path Resolution (Page vs Segment)

Having introduced both `revalidatePage` and `revalidatePath`, this section contrasts their architectural scopes and details how paths are resolved in server execution contexts.

#### 3.1. revalidatePage vs revalidatePath

| Feature | `revalidatePage(path)` | `revalidatePath(path)` |
| :--- | :--- | :--- |
| **Page RSC (`page.rsc`)** | Regenerated | Regenerated |
| **HTML (`index.html`)** | Regenerated | Regenerated |
| **Segment Layout (`layout.rsc`)** | **Untouched (0ms CPU)** | Regenerated (if layout exists) |
| **Cascade Option** | Not applicable (single leaf) | Supported: `{ cascade: true }` |
| **Ideal Use Case** | Article updates, product price edits, comment additions | Section navigation updates, module-wide changes, layout alterations |

#### 3.2. Absolute & Relative Route Paths

Both `revalidatePage` and `revalidatePath` accept absolute route pathnames or relative paths resolved from the calling browser URL:

```typescript
// src/products/server-functions.ts
"use server";

import { revalidatePath, revalidatePage } from "dinou/server";
import db from "@/lib/db";

export async function updateCategory(categoryId: string, data: any) {
  await db.categories.update({ where: { id: categoryId }, data });

  // 1. Absolute path: Revalidates /catalog (page.rsc, index.html, layout.rsc)
  await revalidatePath("/catalog");

  // 2. Relative paths inside Server Functions (resolved via HTTP referer):
  // Revalidate the current invoking leaf page surgically (e.g. /catalog/edit)
  await revalidatePage("./");

  // Revalidate an adjacent route segment (e.g. /catalog/featured)
  await revalidatePath("../featured");
}
```

---

### 4. revalidateTag (Cross-Cutting Invalidation)

Purges all static pages, layouts, and component subtrees tagged with a specific key string across your entire application with a single call:

```typescript
// src/products/server-functions.ts
"use server";

import { revalidateTag } from "dinou/server";
import db from "@/lib/db";

export async function syncInventory() {
  // Invalidates all routes and slots carrying the "products" tag
  await revalidateTag("products");
}
```

#### 4.1. Tag Assignment (getCacheTags)

Tags are assigned in `page_functions.ts` or `layout_functions.ts` via constant arrays or dynamic functions:

##### Pattern 1: Constant Array Export (Fixed Static Tags)

```typescript
// src/blog/page_functions.ts
import type { PageFunctions } from "dinou";

export const getCacheTags: PageFunctions["getCacheTags"] = [
  "blog",
  "marketing",
];
```

##### Pattern 2: Function Export (Dynamic Parameterized Tags)

```typescript
// src/products/[id]/page_functions.ts
import type { RouteParams } from "dinou";

export function getCacheTags(params: RouteParams<"/products/[id]">) {
  return ["products", `product-${params.id}`];
}
```

##### Pattern 3: Full Typed Contract with PageFunctions / LayoutFunctions

```typescript
// src/products/[id]/page_functions.ts
import type { PageFunctions, RouteParams } from "dinou";

export const getCacheTags: PageFunctions<
  RouteParams<"/products/[id]">
>["getCacheTags"] = (params) => {
  return ["products", `product-${params?.id}`];
};
```

> [!NOTE]
> **Transparent Sync and Async Support**
> The type declaration remains identical whether `getCacheTags` is synchronous or `async` (such as querying a database or CMS with `await`). Dinou's return contract (`string[] | Promise<string[]>`) and `RouteParams` polymorphically accommodate both forms without requiring separate types.

---

#### 4.2. Targeted Resolution (Layout vs Page vs Slot)

In Dinou, `revalidateTag(tag, options?)` inspects where the tag was defined and executes the most surgical revalidation action possible:

- **Tag in Layout (`layout_functions.ts`):**
  - **Default (`revalidateTag(tag)`):** Dinou runs internal `revalidateLayout(path)`, regenerating **exclusively `layout.rsc`**. Child pages and HTML remain untouched for maximum speed!
  - **With cascade (`revalidateTag(tag, { cascade: true })`):** Dinou executes `revalidatePath(path, { cascade: true })`, regenerating `layout.rsc` and cascading to all child pages to bake the new layout into their `index.html` (eliminating hydration mismatches).
- **Tag in Page (`page_functions.ts`):**
  - Dinou executes **`revalidatePage(path)`**, regenerating **exclusively `page.rsc` and `index.html`**.
  - Parent layouts remain completely untouched—even if the page shares a folder with a `layout.tsx`—avoiding unnecessary layout recompilations.
- **Tag in Slot (`<DinouCacheSlot>`):**
  - Dinou purges **only the slot directory or KV key** without touching the host page or layouts.
  - The component fragment is re-rendered on the next visit or updated in-place via client `refreshSlot`.

---

#### 4.3. Golden Rules of Invalidation

1. **Rule 1: Surgical Shell Revalidation:** Declare the tag **only in `layout_functions.ts`** (e.g. `["dashboard-shell"]`). Rebuilding the layout shell regenerates only `layout.rsc` and does not trigger expensive re-rendering of all child pages.
2. **Rule 2: Surgical Page Revalidation:** Use `revalidatePage("/path")` or declare the tag **only in `page_functions.ts`** (e.g. `["post-view"]`). Only that concrete page and its HTML will recompile.
3. **Rule 3: Full Module Invalidation (Layout + Children):** Use `revalidatePath("/dashboard", { cascade: true })`, call `revalidateTag("dashboard", { cascade: true })`, or share the same tag in both `layout_functions.ts` and child `page_functions.ts`. This guarantees zero hydration mismatches when structural navigation changes.

> [!CAUTION]
> **Critical Scale Alert: Hydration Mismatch vs. Server Crash (100k+ Pages)**
> - **The Hydration Mismatch Hazard:** Because surgical layout revalidation updates only `layout.rsc`, existing static `index.html` files remain unchanged. While SPA client navigation stays instant and perfectly synchronized, a hard browser reload (F5 or direct link) will receive the older static HTML with the prior layout markup, which can trigger a **Hydration Mismatch** when React 19 hydrates against the fresh `layout.rsc` stream.
> - **Why NOT use `cascade: true` at scale?** If your application features a large product catalog (e.g. 100,000+ pre-rendered pages), running `cascade: true` on a shared or root layout will attempt to regenerate 100,000 static HTML files simultaneously. This causes sudden CPU saturation, memory exhaustion, and catastrophic server crashes or gateway timeouts.
>
> **Scale-Safe Architectural Solutions (Without Cascading):**
> - **Defer Volatile State to Client Components:** Keep the server layout shell structurally invariant. Mutable or fast-changing UI elements (e.g. promo banners, flash deals, cart badges, user session data) should be Client Components (`"use client"`) that render an invariant placeholder or container in SSR and populate fresh data on the client. Because the static HTML never changes, there is zero risk of Hydration Mismatch on hard reloads (F5), and zero child pages need regeneration.
> - **Leverage Partial Prerendering (PPR) with `<Suspense>`:** Wrap dynamic layout sections in `<Suspense fallback={<Skeleton />}>`. Dinou serves the static shell instantly (0ms TTFB) and streams live, personalized server chunks down the open HTTP connection, avoiding stale baked HTML in `index.html` without re-rendering child pages.
> - **Scope Cascading Tags to Bounded Sub-Layouts:** Never attach layout revalidation tags to root or large-catalog wrappers. Keep root shells purely static, and reserve layout tagging with `cascade: true` strictly for bounded feature modules (such as `/dashboard` or `/account`) where child routes are limited to a small, predictable number of pages.
> - **Rely on Lazy Time-Based ISR for Catalog Pages:** When child pages define `revalidate = N`, they naturally re-render their full static HTML on demand upon the next user visit, absorbing layout updates gradually in the background without any upfront mass-regeneration spike.

---

#### 4.4. Invalidating <DinouCacheSlot> Subtrees

`revalidateTag` works seamlessly with micro-cached component subtrees created via `<DinouCacheSlot>`:

```tsx
// Inside any page or layout Server Component:
import { Suspense } from "react";
import { DinouCacheSlot } from "dinou/server";
import { TrendingProducts, TrendingSkeleton } from "@/components/trending";

<Suspense fallback={<TrendingSkeleton />}>
  <DinouCacheSlot id="trending-grid" tag="trending" revalidate={600}>
    <TrendingProducts />
  </DinouCacheSlot>
</Suspense>
```

```typescript
// In your Server Function:
"use server";

import { revalidateTag } from "dinou/server";

export async function refreshTrends() {
  await revalidateTag("trending");
  // Only the <TrendingProducts> slot payload is purged; the parent page stays cached!
}
```

---

### 5. Client-Side Surgical Revalidation & Router Caching

Dinou provides a seamless SPA router experience with in-memory caching and granular refresh capabilities directly in the browser:

#### 5.1. The Router Caches (pageCache & layoutCache)

Dinou maintains two distinct in-memory client caches in the browser:
- **`pageCache`**: In-memory Map of page-level RSC streams.
- **`layoutCache`**: In-memory Map of layout shell RSC streams.

#### 5.2. Bypassing Client Cache with <Link fresh>

To ensure immediate freshness during navigation without waiting for server TTLs or router cache eviction, use the `fresh` prop on the `<Link>` component:

```tsx
import { Link } from "dinou";

// Forces the client router to bypass and evict its in-memory pageCache for /feed,
// guaranteeing a real HTTP request to fetch fresh data from the server.
<Link href="/feed" fresh>
  View Latest Feed
</Link>
```

> [!NOTE]
> `<Link fresh>` deletes the client in-memory cache for that destination; it does not clear static files on the server. If the server route is static, the server will return the compiled static RSC payload.

---

#### 5.3. router.refresh() & Layout Invalidation

The `useRouter()` hook provides a powerful `refresh()` method that reconciles React components without losing ephemeral client state (such as input focus, form draft text, or scroll position):

```tsx
"use client";

import { useRouter } from "dinou";

export function RefreshControl() {
  const router = useRouter();

  // 1. Standard Soft Refresh (Default)
  // Clears only pageCache; leaves layoutCache intact (1 network request, 0 layout flicker)
  const handlePageRefresh = () => {
    router.refresh();
  };

  // 2. Full Refresh (Including Layout Shell)
  // Clears pageCache AND purges active layoutCache (fetches both fresh layout & page)
  const handleGlobalRefresh = () => {
    router.refresh({ layout: true });
  };

  return (
    <div className="flex gap-2">
      <button onClick={handlePageRefresh}>Refresh Page</button>
      <button onClick={handleGlobalRefresh}>Refresh All (Shell + Page)</button>
    </div>
  );
}
```

| Method Call | `pageCache` | `layoutCache` | RSC Network Requests | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **`router.refresh()`** | Deleted | Preserved | 1 (page only) | Post-mutation updates, comment submissions, data table refreshes |
| **`router.refresh({ layout: true })`** | Deleted | Deleted | 2 (layout + page) | Tenant switching, avatar changes, global theme or org updates in navbar |

---

#### 5.4. refreshSlot & router.refreshSlot

To refresh an isolated component without re-rendering sibling components or parent pages, use `refreshSlot`:

```tsx
"use client";

import { refreshSlot, useRouter } from "dinou";

export function LiveAnalyticsButton() {
  const router = useRouter();

  const handleUpdate = () => {
    // 1. Direct standalone function:
    refreshSlot("analytics-summary", { fresh: true });

    // 2. Or via router instance (identical signature and options):
    // router.refreshSlot("analytics-summary", { fresh: true });
  };

  return <button onClick={handleUpdate}>Live Refresh Metrics</button>;
}
```

- **Default (Omitted or `fresh: false`):** Respects the server storage cache. If the slot has not exceeded its `revalidate` TTL, the server returns the cached JSX directly without re-executing the component.
- **With `fresh: true` (Forced Server Recomputation):** Bypasses and ignores any unexpired server cache. Forces Dinou to immediately re-evaluate the Server Component, generate new JSX, overwrite the storage cache with the fresh timestamp, and stream it to the client.

---

### 6. Pluggable Storage Adapters

#### 6.1. Why Adapters Matter for Revalidation

Revalidation (`revalidatePage`, `revalidatePath`, `revalidateTag`) is fundamentally the process of **purging and rebuilding static cache artifacts**:
- **RSC Streams (`page.rsc`, `layout.rsc`):** Pre-rendered Flight binary streams served during client SPA transitions.
- **Rendered HTML (`index.html`):** Fully hydrated HTML markup served for initial page loads and search crawlers.
- **Metadata & TTL (`meta.json`):** Expiration timestamps, ISR time-to-live (TTL), and assigned cache tags for surgical resolution.

##### 3 Real-World Challenges Solved by Adapters:
1. **Clustered Deployments (Single Node vs. Clusters):** By default, Dinou writes to local disk (`FileSystemStorage`). If you scale to multiple Kubernetes pods behind a load balancer, each pod has an isolated disk. Solved by **`RedisStorage`** (shared cluster state).
2. **Edge & Serverless (Zero-Config):** In serverless runtimes like Cloudflare Workers, there is no writable filesystem. Dinou auto-binds to your `DINOU_CACHE` KV namespace via `wrangler.toml` (or Deno KV via `Deno.openKv()`) with zero manual config in `dinou.config.mjs`.
3. **Fast Testing & Mocking:** Unit tests, CI pipelines, and ephemeral mock runs require ultra-fast execution without disk clutter. Solved by **`MemoryStorage`** (ephemeral RAM Map).

> [!NOTE]
> **Zero Code Modifications Across Infrastructures**
> Because your application code only interacts with high-level revalidation functions like `revalidateTag("products")` or `revalidatePath("/catalog")`, your UI and server components remain 100% identical whether running on local Node.js (`FileSystemStorage`), Kubernetes (`RedisStorage`), or Cloudflare Workers (`CloudflareKVStorage`).

---

#### 6.2. Supported Storage Adapters & Configuration

| Adapter Class | Target Environment | Characteristics |
| :--- | :--- | :--- |
| **`FileSystemStorage`** | Node.js / Bun / Docker | **Default.** Zero config, atomic file writes on local disk. |
| **`RedisStorage`** | Distributed Clusters | Shared cluster cache across Kubernetes pods or multi-container VPS. |
| **`CloudflareKVStorage`** | Cloudflare Workers | Globally replicated edge key-value storage. Auto-bound via `DINOU_CACHE` in `wrangler.toml` (zero config). |
| **`DenoKVStorage`** | Deno Deploy / Deno KV | Built-in distributed ACID key-value store. Auto-bound via `Deno.openKv()` (zero config). |
| **`MemoryStorage`** | Testing / CI / Mocks | In-memory ephemeral Map for unit tests and local mock runs. |

In Node.js / Bun environments, override the default local disk storage by declaring a distributed adapter in `dinou.config.mjs`:

```typescript
// dinou.config.mjs
import { defineConfig } from "dinou";
import { RedisStorage } from "dinou/server";
import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

export default defineConfig({
  // Cluster-wide distributed cache storage for ISR and revalidation
  storage: new RedisStorage(redis, "dinou-cache:"),
});
```

##### MemoryStorage: In-Memory Testing & CI Workflows

`MemoryStorage` stores all ISR artifacts inside a JavaScript in-memory `Map`:
1. **Isolated Testing (Vitest / Jest):** Calling `setStorageAdapter(new MemoryStorage())` gives every test a pristine, isolated store in 0 microseconds without cleaning temp folders.
2. **Zero-Infra CI Pipelines (GitHub Actions):** Validate full ISR and revalidation lifecycles (`revalidateTag`, `revalidatePath`) in automated CI runners without external Redis containers.
3. **Hardened Read-Only Docker Containers:** Enables full caching inside container RAM under `docker --read-only` where disk writes fail with `EROFS`.
4. **Resilient Edge Worker Fallback:** In Cloudflare Workers where `DINOU_CACHE` KV is omitted, Dinou automatically falls back to MemoryStorage inside the isolate RAM without crashing.

```typescript
// 1. In dinou.config.mjs (conditional for CI / test environment)
import { defineConfig } from "dinou";
import { MemoryStorage, RedisStorage } from "dinou/server";

export default defineConfig({
  storage: process.env.NODE_ENV === "test"
    ? new MemoryStorage()
    : new RedisStorage(redisClient, "dinou-cache:"),
});

// 2. Or directly in your test suite (Vitest / Jest) for total test isolation
import { setStorageAdapter, MemoryStorage, revalidateTag } from "dinou/server";
import { beforeEach, test, expect } from "vitest";

beforeEach(() => {
  // Reset cache state with a clean, isolated in-memory store before every test
  setStorageAdapter(new MemoryStorage());
});
```

---

### 7. Webhook Integrations (Headless CMS)

External events, such as a Headless CMS (Sanity, Strapi, Contentful) publishing content or an e-commerce inventory sync, can trigger on-demand revalidation in Dinou. Webhook endpoints are created via **Web Standards Plugins** using the `onRequest` hook in `dinou.config.mjs`:

```typescript
// dinou.config.mjs
import { defineConfig } from "dinou";
import { revalidateTag, revalidatePage, revalidatePath } from "dinou/server";

export default defineConfig({
  plugins: [
    {
      name: "revalidation-webhook",
      async onRequest(request) {
        const url = new URL(request.url);

        // Intercept POST requests to /api/revalidate
        if (url.pathname === "/api/revalidate" && request.method === "POST") {
          try {
            const { tag, page, path, cascade } = await request.json();

            if (tag) {
              await revalidateTag(tag);
            }
            if (page) {
              // Surgical page-only revalidation
              await revalidatePage(page);
            }
            if (path) {
              // Route revalidation with optional layout cascade
              await revalidatePath(path, { cascade: Boolean(cascade) });
            }

            return Response.json({ revalidated: true, timestamp: Date.now() });
          } catch (err: any) {
            return Response.json({ error: err.message }, { status: 500 });
          }
        }
      },
    },
  ],
});
```

> [!TIP]
> **Production Tip: Securing Public Webhook Endpoints**
> In production, verify an authorization header (such as `request.headers.get("authorization") === `Bearer ...``) or a cryptographic HMAC webhook signature from your CMS provider to ensure only authorized callers can trigger revalidation cycles.

---

### 8. Strategy Comparison Matrix

#### 8.1. Server-Side Invalidation Mechanisms

| Strategy | Invocation Context | Revalidation Scope | Recommended For |
| :--- | :--- | :--- | :--- |
| **Time-Based ISR** (`revalidate = N`) | Route config (`page_functions.ts`) | Route page + HTML | Automatic background freshness for low-to-medium dynamic content. |
| **`revalidatePage(path)`** | Server Function / Webhook Plugin | **Target page only (HTML + RSC)** | Surgical route mutation; guarantees zero impact on parent layout shells. |
| **`revalidatePath(path)`** | Server Function / Webhook Plugin | Target page + layout segment | Standard route mutation when both page content and layout segment update. |
| **`revalidatePath(path, { cascade: true })`** | Server Function / Webhook Plugin | **Layout shell + all descendant child pages** | Deep structural invalidation; recursively purges and rebuilds all children. |
| **`revalidateTag(tag)`** | Server Function / Webhook Plugin | Matching layout, page, or `<DinouCacheSlot>` | Surgical multi-route purge without touching parent layout shells. |
| **`revalidateTag(tag, { cascade: true })`** | Server Function / Webhook Plugin | **Tagged layout shell + all child pages** | Full module invalidation when layout structural dependencies affect all children. |

#### 8.2. Client-Side Router Refresh Mechanisms

Executed inside Client Components and user interactions to invalidate browser router caches without triggering a full browser window reload (F5):

| Mechanism | Invocation Context | Client Cache Impact | Preserves UI State? | Bypasses Server Storage? |
| :--- | :--- | :--- | :--- | :--- |
| **`<Link fresh>`** | `<Link>` navigation | Bypasses & evicts `pageCache` | No (navigates to route) | No (serves server storage cache) |
| **`router.refresh()`** | `useRouter()` hook | Evicts `pageCache` for current URL | **Yes** (inputs, scroll, layout preserved) | No (serves server storage cache) |
| **`router.refresh({ layout: true })`** | `useRouter()` hook | Evicts both `pageCache` & `layoutCache` | **Yes** (inputs & scroll preserved; layout re-renders) | No (serves server storage cache) |
| **`refreshSlot(id, [options])`** | `refreshSlot` / `useRouter()` | Re-fetches and replaces slot DOM only | **Yes** (entire page, layout & scroll preserved) | Only with `{ fresh: true }` |

---

## Data Fetching: The 13 Strategies

### Overview: The 13-Strategy Architecture

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

## The Dinou Pattern

In full-stack React applications, mutations often trigger broad page re-renders or full route re-fetches. This can cause unnecessary re-renders of unrelated components, reset unsaved form inputs, or cause visible layout shifts.

The **Dinou Pattern** offers a modern alternative by leveraging the unique ability of Server Functions to return Client Components directly over the React Flight RPC protocol. After executing a mutation securely in Node.js, the server returns an invisible **Headless State Updater** component that:

1. Mounts on the client (rendering `null`, emitting 0 DOM nodes and 0 layout shifts).
2. Executes a client-side `useEffect` upon mounting to notify a store.
3. Selectively invalidates only dependent queries, streaming the updated UI via React 19 `<Suspense>` and `use()` without full-page reloads.

### The Concept & Architecture

#### Flight RPC & Headless Updaters

Because Server Functions communicate using the React Flight protocol rather than plain JSON REST endpoints, the server can return serialized references to Client Components with custom props:

- **Server Authority:** The Server Function owns the business logic, validates inputs, and updates the database in a secure Node.js runtime.
- **Client Synchronization:** Returning the headless component allows the server to orchestrate client state transitions without coupling to client network listeners.

#### 5-Step Execution Lifecycle

The following flow illustrates how the mutation, stream, store update, and surgical re-render operate in unison:

1. **Client Invocation:** User submits an action; client invokes the Server Function (e.g. `addPatternTask()`) and sets a mutation promise into a headless boundary.
2. **Backend Mutation (Node.js):** The Server Function writes changes safely to the database or external services on the server.
3. **Flight Stream Response:** Rather than raw JSON, the server streams back the invisible `<PatternTaskUpdater />` Client Component.
4. **Headless Mount & Store Update:** The updater mounts (rendering `null`), and its `useEffect` invalidates the key in the global store (e.g. `useTaskStore.getState().invalidateTasks()`).
5. **Surgical Stream Re-fetch:** Only the dependent query `<Suspense>` boundary re-fetches and streams the updated list, leaving form focus and scroll untouched.

### Step-by-Step Implementation

Here is the complete, modular implementation showing how Server Functions, Flight RPC, and Zustand orchestrate surgical reactivity without route revalidations:

#### 1. The Global Store (Zustand)

A minimal store holding a reactive invalidation key. Any global state manager (such as Zustand, Jotai, or Redux) works identically:

```typescript
// src/stores/task-store.ts
import { create } from "zustand";

interface TaskStore {
  tasksKey: number;
  invalidateTasks: () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasksKey: 0;
  invalidateTasks: () => set((state) => ({ tasksKey: state.tasksKey + 1 })),
}));
```

> [!NOTE]
> **Why it matters:** Calling `invalidateTasks()` increments `tasksKey`, signaling subscribing components to re-fetch their Suspense stream without triggering route-wide re-renders.

#### 2. The Headless Client Updater

An invisible Client Component that renders `null` (0 DOM elements), but invokes the store's invalidation action when mounted:

```tsx
// src/components/pattern-updater.tsx
"use client";
import { useEffect } from "react";
import { useTaskStore } from "../stores/task-store";

export default function PatternTaskUpdater({ id }: { id?: string }) {
  useEffect(() => {
    // Atomically signal the store outside the render cycle
    useTaskStore.getState().invalidateTasks();
  }, [id]);

  return null; // Headless component: emits zero DOM nodes and 0 layout shifts
}
```

#### 3. The Server Function Mutation

Performs the backend mutation in Node.js and returns the Headless Updater component over Flight RPC:

```tsx
// src/server-functions/pattern-demo.tsx
"use server";
import type { ReactNode } from "react";
import PatternTaskUpdater from "../components/pattern-updater";
import { tasksDb } from "./db";

export async function addPatternTask(text: string): Promise<ReactNode> {
  const trimmed = text.trim();
  const id = Math.random().toString(36).substring(2, 9);
  
  if (trimmed) {
    tasksDb.unshift({
      id,
      text: trimmed,
      createdAt: new Date().toLocaleTimeString(),
    });
  }

  // The server orchestrates the client by returning the Headless Updater!
  return <PatternTaskUpdater key={id} id={id} />;
}
```

#### 4. Server Data Query Function

Fetches and renders the updated list directly on the server:

```tsx
// src/server-functions/pattern-demo.tsx (continued)
"use server";
import type { ReactNode } from "react";
import PatternTasksList from "../components/pattern-tasks-list";
import { tasksDb } from "./db";

export async function fetchPatternTasks(): Promise<ReactNode> {
  return <PatternTasksList tasks={[...tasksDb]} />;
}
```

#### 5. Display Component (Client Component)

Renders the list of tasks received from the server query:

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
    return <p className="text-muted-foreground text-sm">No tasks yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li key={task.id} className="p-2.5 rounded-lg border bg-card flex justify-between">
          <span>{task.text}</span>
          <span className="text-xs text-muted-foreground">{task.createdAt}</span>
        </li>
      ))}
    </ul>
  );
}
```

#### 6. Putting It All Together in the Page

The view coordinates mutation promises and queries with React 19's native `use()` hook and `<Suspense>`:

```tsx
// src/page.tsx
"use client";
import { useState, useEffect, Suspense, use, type ReactNode } from "react";
import { addPatternTask, fetchPatternTasks } from "./server-functions/pattern-demo";
import { useTaskStore } from "./stores/task-store";

function TasksStream({ promise }: { promise: Promise<ReactNode> }) {
  // Native React 19: unroll the Flight stream promise
  const content = use(promise);
  return <>{content}</>;
}

function MutationStream({ promise }: { promise: Promise<ReactNode> }) {
  const content = use(promise);
  return <>{content}</>;
}

export default function Page() {
  const tasksKey = useTaskStore((state) => state.tasksKey);
  const [text, setText] = useState("");
  const [isMutating, setIsMutating] = useState(false);
  const [mutationKey, setMutationKey] = useState(0);
  const [mutationPromise, setMutationPromise] = useState<Promise<ReactNode> | null>(null);
  const [tasksPromise, setTasksPromise] = useState<Promise<ReactNode>>(() => fetchPatternTasks());

  // Invalidate and re-fetch only when the store increments tasksKey
  useEffect(() => {
    if (tasksKey > 0) {
      setTasksPromise(fetchPatternTasks());
    }
  }, [tasksKey]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isMutating) return;

    setIsMutating(true);
    setMutationKey((k) => k + 1);
    const p = addPatternTask(trimmed);
    p.finally(() => {
      setIsMutating(false);
      setText("");
    });
    setMutationPromise(p);
  };

  return (
    <div className="space-y-6">
      {/* 1. Mutation Form */}
      <form onSubmit={handleAddTask} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="New task..."
          disabled={isMutating}
          className="border rounded px-3 py-1.5 flex-1"
        />
        <button
          type="submit"
          disabled={isMutating || !text.trim()}
          className="bg-emerald-600 text-white px-4 py-1.5 rounded disabled:opacity-50"
        >
          {isMutating ? "Adding..." : "Add Task"}
        </button>
      </form>

      {/* 2. Headless Mutation Stream Boundary */}
      {mutationPromise && (
        <Suspense key={mutationKey} fallback={null}>
          <MutationStream promise={mutationPromise} />
        </Suspense>
      )}

      {/* 3. Dependent Data Stream Boundary */}
      <Suspense
        key={tasksKey}
        fallback={<p className="text-muted-foreground text-sm">Loading tasks...</p>}
      >
        <TasksStream promise={tasksPromise} />
      </Suspense>
    </div>
  );
}
```

> [!TIP]
> **How It Works:**
> 1. User submits the form, initiating `addPatternTask()` without full-page reloads.
> 2. The mutation promise is passed to a headless `<Suspense>` boundary.
> 3. Server mutates the database in Node.js and returns `<PatternTaskUpdater />` over Flight RPC.
> 4. `PatternTaskUpdater` mounts, executing its `useEffect` to call `useTaskStore.getState().invalidateTasks()`.
> 5. The store notifies the page, calling `fetchPatternTasks()` to obtain the fresh stream.
> 6. Only the tasks list `<Suspense>` boundary updates smoothly, keeping inputs, state, and scroll position completely intact.

##### Production Notes: Error Handling & React Lifecycle

- **Server-Side Mutation Errors & Atomic Rollbacks:** Flight RPC streams server errors as rejected promises. If the Server Function throws in Node.js, the promise rejects on the client and the Headless Updater **never mounts**. This guarantees that your client-side store is never corrupted with failed mutation state:

```typescript
try {
  const p = addPatternTask(trimmed);
  setMutationPromise(p);
  await p; // If Node.js throws, execution jumps to catch
} catch (error) {
  // Headless updater never mounted; store was NOT modified!
  console.error("Mutation failed on server:", error);
  toast.error("Failed to add task");
}
```

- **Consecutive Mutation Keys:** When triggering multiple rapid mutations, incrementing `setMutationKey((k) => k + 1)` on the `<Suspense key=...>` boundary forces React to cleanly unmount the previous updater and mount the new one fresh.
- **Lightweight Headless Footprint:** Keep Headless Updaters purely functional with zero DOM output (`return null`). They exist solely as the reactive bridge between the Server Function RPC response and the client-side store.

### Zero-Dependency Option: Native useSyncExternalStore

If you prefer not to include any third-party state libraries in your client bundle, you can achieve the exact same surgical reactivity using React 19's native `useSyncExternalStore` hook:

```typescript
// src/stores/native-store.ts
import { useSyncExternalStore } from "react";

let tasksKey = 0;
const listeners = new Set<() => void>();

export const nativeTaskStore = {
  getSnapshot: () => tasksKey,
  invalidateTasks: () => {
    tasksKey += 1;
    listeners.forEach((listener) => listener());
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useNativeTasksKey(): number {
  return useSyncExternalStore(
    nativeTaskStore.subscribe,
    nativeTaskStore.getSnapshot,
    nativeTaskStore.getSnapshot // Server snapshot for SSR hydration safety
  );
}
```

In your Headless Updater, simply invoke `nativeTaskStore.invalidateTasks()` instead of `useTaskStore.getState().invalidateTasks()`. The lifecycle, Flight RPC streaming, and selective re-fetching behavior remain 100% identical.

### Comparison & Key Advantages

Comparing the Dinou Pattern against traditional client-side data fetching (REST / React Query):

| Feature | The Dinou Pattern | REST / React Query (SPA) |
| :--- | :--- | :--- |
| **Reactivity Scope** | **Surgical** (targeted boundary only) | Surgical (query key invalidation) |
| **Form / Input Focus** | **100% Preserved** (zero blur or reset) | Preserved |
| **Bundle Overhead** | **~1 KB** (Zustand) or **0 KB** (Native) | ~12–15 KB (client query library) |
| **Backend Architecture** | **Direct Node.js Server Functions** (`"use server"`) | Requires dedicated HTTP API endpoints (`/api/...`) |
| **Data Transport** | **React Flight RPC** (typed component streaming) | JSON serialization + manual client fetch logic |
| **Boilerplate** | **Zero** API routes, controllers, or fetch hooks | Manual endpoints, fetch hooks, error states, and types |
| **DOM Impact** | **0 DOM nodes** emitted by headless updater | N/A (data only) |

- **Surgical Reactivity:** Only the targeted component re-fetches and re-renders. Inputs, local states, and other UI sections remain completely untouched.
- **Zero Friction State Management:** Pairs seamlessly with your existing global store (Zustand, Jotai, or Redux) or native `useSyncExternalStore` alongside React 19's Flight RPC and `<Suspense>`.

---

## React Compiler & StrictMode

Forget about manual `useMemo` and `useCallback`. Dinou integrates the React Compiler (React 19+) to automatically optimize component renders at build time, backed by `reactStrictMode` by default to ensure seamless parity between development and production.

### Overview: Automatic Memoization

Dinou comes with the **React Compiler** enabled out of the box. The compiler understands JavaScript semantics and the Rules of React. It automatically memoizes values, JSX subtrees, and function references, preventing unnecessary re-renders across your application.

- **Cleaner Codebase:** Write idiomatic, plain React. Eliminates manual dependency arrays, hook boilerplate, and premature memoization mistakes.
- **Surgical Runtime Performance:** Applies fine-grained memoization at the statement level, frequently outperforming manual optimizations by deeply tracking internal data flow.

### 1. Code Comparison: Plain React vs Hooks

**Legacy React (Manual Optimization with Hooks):**

```tsx
function OrderSummary({ items, filter }: { items: Item[]; filter: string }) {
  // Manual memoization with fragile dependency arrays
  const filtered = useMemo(() => {
    return items.filter((item) => item.category === filter);
  }, [items, filter]);

  // Manual callback to prevent breaking child component memoization
  const handleSelect = useCallback((id: string) => {
    trackSelection(id);
  }, []);

  return <OrderList items={filtered} onSelect={handleSelect} />;
}
```

**Dinou: Plain Idiomatic React (React Compiler Active):**

```tsx
function OrderSummary({ items, filter }: { items: Item[]; filter: string }) {
  // ✨ Automatically memoized by the React Compiler
  const filtered = items.filter((item) => item.category === filter);

  // ✨ Function reference automatically stabilized
  const handleSelect = (id: string) => {
    trackSelection(id);
  };

  return <OrderList items={filtered} onSelect={handleSelect} />;
}
```

### 2. Bundler Integration Matrix

Dinou adopts a targeted compilation model across supported bundlers to optimize the balance between **instant developer iteration (HMR)** and **maximum production performance**:

| Bundler | Development | Production | Compilation Strategy |
| :--- | :---: | :---: | :--- |
| **Webpack** | ✅ **Enabled** | ✅ **Enabled** | Executes React Compiler in both Dev and Prod for identical AST transformation. |
| **Rollup** | ❌ *Disabled* | ✅ **Enabled** | **Fast Iteration Priority:** Bypasses compiler overhead in dev for fast iteration; fully optimizes production builds. |
| **Esbuild** | ❌ *Disabled* | ✅ **Enabled** | **Sub-millisecond HMR:** Maintains native sub-millisecond Rust SWC HMR in dev; compiles with React Compiler in production. |

#### 2.1. Why Dev vs Prod Bundler Behavior Differs

The React Compiler performs intensive Static Analysis and Abstract Syntax Tree (AST) parsing via Babel:

- **For Esbuild & Rollup in Dev:** Injecting Babel AST transformation into Esbuild or Rollup during development would negate their primary advantage: sub-millisecond Hot Module Replacement (HMR). Dinou disables the compiler in dev mode for these tools to preserve instantaneous live reloading.
- **For Webpack:** Webpack already operates a pipeline amenable to AST plugins, allowing the React Compiler to run consistently in development and production.
- **For Production:** All bundlers (Webpack, Rollup, and Esbuild) run with the React Compiler enabled to guarantee maximum production runtime efficiency.

### 3. React StrictMode (Default: `true`)

Dinou introduces `reactStrictMode: true` by default in development mode.

#### 3.1. Why StrictMode is Vital for the React Compiler

A critical challenge with disabling the React Compiler during development (as with Esbuild and Rollup) is ensuring that **what works in development behaves identically in production**.

The React Compiler assumes that your components follow the **Rules of React**—specifically, that component rendering is pure and free of side effects.

When `reactStrictMode` is enabled in development, React **intentionally double-invokes** component renders, initializer functions, and updater callbacks:

- **Exposes Impure Renders:** If a component mutates external variables or performs side effects during render, the double invocation immediately breaks the UI in dev mode, alerting you.
- **Guarantees Production Safety:** Because impurities are caught early in development, your code is proven to be pure. When Esbuild or Rollup enables the React Compiler in production, the compiled memoization output is guaranteed to behave 100% identically to development!

#### 3.2. Configuring `reactStrictMode` in `dinou.config.mjs`

`reactStrictMode` is enabled by default in Dinou. You can configure it explicitly in your configuration file:

```javascript
// dinou.config.mjs
import { defineConfig } from "dinou";

export default defineConfig({
  /**
   * React StrictMode configuration for development mode.
   * Double-invokes render and effect functions in development to catch side-effects.
   * @default true
   */
  reactStrictMode: true,
});
```

### 4. Guidelines for Compiler Purity

To get the maximum benefit from the React Compiler and StrictMode in Dinou, follow these core principles:

1. **Keep Component Render Functions Pure:** Given the same inputs (props, state, context), a component should always return the same JSX. Never mutate global variables or arguments passed to the component during render.
2. **Treat Props and State as Immutable:** Never mutate `props.user.name = "new"` directly. Always create new object references when updating state (e.g. `{ ...user, name: "new" }`).
3. **Isolate Side Effects to `useEffect` or Server Functions:** Timers, DOM subscriptions, and network mutations belong inside event handlers or `useEffect`, never in the component body.

---

## Public Directory (`public/`)

Static asset delivery in Dinou. The `public/` directory serves favicons, `robots.txt`, sitemaps, domain verification files, and unbundled media directly from `.dinou/dist3` without passing through bundlers.

### 1. Overview & Architecture

Dinou provides a dedicated `public/` folder located at the root of your project (parallel to `src/` and `package.json`). This directory is the single home for all static files that must be accessible at fixed, unhashed URLs on the root path (`/`).

#### Bypassing Bundlers (`.dinou/dist3`)

Unlike application code, stylesheets, or imported media which are parsed and bundled by Webpack, Rollup, or Esbuild, files placed in `public/` **completely bypass the bundler pipeline**:

- **Development Mode (`dinou dev`):** Dinou's dev server intercepts static file requests matching paths in `public/` and streams them instantly from disk with zero build step, hot-reloading, or cache latency.
- **Production Build (`dinou build`):** During the build process, Dinou executes a direct recursive copy from `./public` into `.dinou/dist3`. The runtime web engine serves these files directly with optimal HTTP headers (ETag, Content-Type, Cache-Control).

**The Dinou Static Asset Pipeline Flow:**

```
./public/ (robots.txt, favicon.ico, images/)
  ── Direct Copy (No Bundler: zero AST parse, no hash renaming) ──>
.dinou/dist3/ (Served at root URL path /)
```

> [!NOTE]
> **Why Bypassing the Bundler Matters:**
> Third-party crawlers, browsers, and verification bots require exact, unchanging file paths like `/robots.txt`, `/favicon.ico`, or `/google12345.html`. If these passed through a bundler, they would be renamed with content hashes (e.g. `robots.a7b9c.txt`) or inlined as data URIs, breaking external protocol compliance.

#### Recommended Directory Structure

Here is the standard layout of a production Dinou project using the `public/` folder:

```bash
my-dinou-app/
├── public/
│   ├── favicon.ico                 # Legacy & fallback browser favicon
│   ├── favicon-16x16.png           # Small tab icon
│   ├── favicon-32x32.png           # Standard tab icon
│   ├── apple-touch-icon.png        # iOS home screen bookmark icon (180x180)
│   ├── site.webmanifest            # Progressive Web App (PWA) manifest
│   ├── robots.txt                  # Web crawler instructions
│   ├── sitemap.xml                 # Search engine sitemap index
│   ├── googlea1b2c3d4e5f6.html     # Google Search Console domain verification
│   ├── .well-known/                # Mobile app links & security metadata
│   │   ├── assetlinks.json         # Android App Links
│   │   └── apple-app-site-association # iOS Universal Links
│   └── images/
│       ├── og-image.png            # OpenGraph / Twitter social card
│       └── logo-transparent.png    # Unbundled high-res brand marks
├── src/
│   └── app/
│       ├── layout.tsx              # Root HTML shell linking public assets
│       └── page.tsx
├── dinou.config.mjs
└── package.json
```

### 2. URL Mapping & Serving

Every file and nested folder inside `public/` is served directly from the root URL (`/`). **You must never include `/public/` in the URL path**.

| Filesystem Path | Public URL Path | Status |
| :--- | :--- | :--- |
| `public/favicon.ico` | `/favicon.ico` | ✓ Correct |
| `public/robots.txt` | `/robots.txt` | ✓ Correct |
| `public/images/og-image.png` | `/images/og-image.png` | ✓ Correct |
| `public/favicon.ico` | ~~/public/favicon.ico~~ | ✗ **404 Not Found** |

### 3. Common Use Cases

#### Favicons & App Icons

To provide branding across desktop browsers, mobile devices, and PWA home-screen bookmarks:

1. Generate your icon bundle using a standard tool (like favicon.io or RealFaviconGenerator).
2. Place the generated icon files directly in `public/`.
3. Reference them in your Root Layout (`src/app/layout.tsx`) inside the `<head>` element:

```tsx
// src/app/layout.tsx
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>My Dinou Application</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Favicon & Multi-Resolution App Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Global Styles */}
        <link href="/styles.css" rel="stylesheet" precedence="default" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

#### robots.txt & sitemap.xml (SEO)

Search engine bots like Googlebot expect crawler instructions and sitemaps at standard URLs. Create `public/robots.txt`:

```txt
# public/robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/private/

# Sitemap location
Sitemap: https://mydinouapp.com/sitemap.xml
```

And create your static sitemap index at `public/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://mydinouapp.com/</loc>
    <lastmod>2026-10-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://mydinouapp.com/docs</loc>
    <lastmod>2026-10-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

#### Domain Verification & .well-known

Domain ownership verification files (Google Search Console, Apple Pay, Pinterest, Bing) can be dropped straight into `public/`:

```bash
# Google Search Console verification:
# Placed in: public/google1a2b3c4d5e6f.html
# Accessible at: https://mydinouapp.com/google1a2b3c4d5e6f.html
```

For mobile deep-linking protocols (Universal Links on iOS and App Links on Android), create a `.well-known` directory inside `public/`:

```bash
# Apple Universal Links:
public/.well-known/apple-app-site-association -> https://mydinouapp.com/.well-known/apple-app-site-association

# Android App Links:
public/.well-known/assetlinks.json -> https://mydinouapp.com/.well-known/assetlinks.json
```

#### OpenGraph & Social Share Cards

Social platforms (Twitter/X, LinkedIn, Discord, Facebook) scrape static images when links to your site are shared. Store your social preview cards in `public/images/` and link them in your HTML `<head>`:

```tsx
// Inside your root layout <head>
<meta property="og:title" content="Dinou - High Performance Full-Stack Framework" />
<meta property="og:description" content="Next-generation React framework with 2D micro-segmentation and in-process execution." />
<meta property="og:image" content="https://mydinouapp.com/images/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://mydinouapp.com/images/og-image.png" />
```

### 4. public/ vs. Imported Assets (src/)

Dinou provides two distinct mechanisms for handling assets. Choose the right pattern for your use case:

| Feature | Static Directory (`public/`) | Imported Assets (`src/`) |
| :--- | :--- | :--- |
| **Filesystem Location** | `public/**/*` | `src/**/*` |
| **Bundler Processing** | None (Bypasses bundlers entirely) | Processed by Webpack, Rollup, or Esbuild |
| **Production Destination** | `.dinou/dist3/**/*` | `.dinou/dist3/assets/*` |
| **URL Path & Naming** | **Fixed, exact filename** (e.g. `/favicon.ico`) | **Path-hashed filename** (e.g. `/assets/logo-a9f2bc.png`) |
| **Referencing Syntax** | `<img src="/images/hero.png" />` | `import hero from "./hero.png";`<br />`<img src={hero} />` |
| **Best For** | Favicons, robots.txt, sitemaps, verification files, PDFs, OpenGraph cards | Component UI icons, bundled CSS background images, media imported in JS/TSX |

---

## Styles & CSS Architecture

### Styling in Dinou

Dinou provides built-in, out-of-the-box support for the modern CSS ecosystem without requiring complex bundler setup. Under the hood, Dinou orchestrates PostCSS, `@tailwindcss/postcss`, Autoprefixer, and `postcss-modules` to:

- **Extract all styles** across Server and Client Components into a single, optimized production bundle served at `/styles.css`.
- **Eliminate CSS specificity conflicts** by compiling CSS Modules with cryptographic scoped hashing.
- **Provide sub-millisecond Hot Module Replacement (HMR)** in development, updating styles in place without full page reloads or React state loss.
- **Resolve TypeScript path aliases** (such as `@/styles/tokens.css`) directly inside your CSS `@import` rules.

- **Tailwind CSS v4:** Modern CSS-first engine. No `tailwind.config.js` required; configured with native `@theme` blocks.
- **CSS Modules:** Locally scoped classes for component-level isolation with automatic TypeScript ambient declarations.
- **Single-File Extraction:** All styles coalesce into `/styles.css`, eliminating Flash of Unstyled Content (FOUC).

### Linking /styles.css

Because Dinou bundles all global styles, Tailwind classes, and CSS module rules into a unified stylesheet, you **must manually link** the stylesheet in your root layout or document `<head>`:

```html
<link href="/styles.css" rel="stylesheet" precedence="default" />
```

#### React 19 precedence Attribute

In React 19 and React Server Components (RSC), `<link rel="stylesheet">` tags accept a special `precedence` attribute (e.g. `precedence="default"`). This tells the React runtime:

1. **Resource Hoisting:** React hoists the link tag into the document `<head>` automatically, even if rendered inside a nested sub-component or layout.
2. **Suspense & Streaming Synchronization:** React pauses rendering of stream-dependent HTML until the critical stylesheet has finished loading in the browser, preventing Flash of Unstyled Content (FOUC).
3. **Deduplication:** If multiple components request `/styles.css` with the same precedence, React ensures only a single link tag is rendered in the final DOM.

### Tailwind CSS (v4 Engine)

Dinou incorporates the official **Tailwind CSS v4** engine via `@tailwindcss/postcss`. Tailwind v4 is fundamentally CSS-native: there is no JavaScript config file (`tailwind.config.js`) required by default.

To enable Tailwind CSS across your application, simply import it at the top of your global CSS file (typically `src/globals.css`):

```css
/* src/globals.css */
@import "tailwindcss";
```

#### Custom @theme & Directives

In Tailwind v4, custom colors, fonts, spacing, and breakpoints are defined directly in CSS using the `@theme` directive:

```css
/* src/globals.css */
@import "tailwindcss";

@theme {
  --color-brand-primary: #3b82f6;
  --color-brand-dark: #1e293b;
  --font-display: "Inter", system-ui, sans-serif;
  --radius-badge: 0.375rem;
}

/* Custom utility definitions */
@utility text-balance {
  text-wrap: balance;
}

/* Base style overrides */
@layer base {
  body {
    @apply bg-background text-foreground antialiased;
  }
}
```

> [!NOTE]
> Classes like `bg-brand-primary`, `font-display`, and `text-balance` are generated automatically by Tailwind v4 during compilation.

### CSS Modules (*.module.css)

When you want component-scoped styling without utility classes or global selector collisions, use **CSS Modules**. Any file ending in `.module.css` is processed automatically by Dinou's PostCSS module compiler.

#### Scoped Class Names & Resolution

During compilation, Dinou transforms local class names into globally unique identifiers using its internal `createScopedName` generator:

```css
/* src/components/card.module.css */
.card {
  padding: 1.5rem;
  border-radius: 0.75rem;
  background-color: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: #3b82f6;
}
```

Import the module object in your component and apply the scoped keys:

```tsx
// src/components/card.tsx
"use client";

import styles from "./card.module.css";

export function FeatureCard({ title, badge }: { title: string; badge: string }) {
  return (
    <div className={styles.card}>
      <span className={styles.badge}>{badge}</span>
      <h3 className="text-lg font-bold mt-2">{title}</h3>
    </div>
  );
}
```

> [!TIP]
> The compiled DOM renders classes like `_card__card___a1b2c`, guaranteeing zero styling overlap with any other card component in the application.

### Global CSS & Path Aliases

You can import CSS files anywhere in your application tree:

- **Root Layout:** Import `./globals.css` in your root `src/layout.tsx` to establish base reset rules, design tokens, and Tailwind directives.
- **Component Files:** Import local stylesheets or third-party library CSS (e.g. `import "katex/dist/katex.min.css";`) directly inside the component that uses them.
- **CSS `@import` with Path Aliases:** Dinou integrates `postcss-import` with its internal path alias resolver. You can reference paths configured in your `tsconfig.json` inside CSS files:

```css
/* src/styles/main.css */
@import "@/styles/tokens.css";
@import "@/styles/typography.css";
@import "tailwindcss";
```

### Instant CSS Hot Module Replacement

> [!TIP]
> **Sub-Millisecond HMR & Zero State Loss:** During development, Dinou incrementally recompiles modified `.css` and `.module.css` files and updates `/styles.css` in place via WebSocket. Styles refresh instantly with **zero full page reloads**, keeping component state, form inputs, dialogs, and scroll positions intact.

### TypeScript Declarations (dinou/env)

Built-in ambient type declarations for CSS Modules and static media assets are provided directly via `dinou/env`. Create or verify a `dinou-env.d.ts` file at the root of your project:

```typescript
/// <reference types="dinou/env" />
```

Ensure your `tsconfig.json` includes the declaration file and specifies `"moduleResolution": "bundler"`:

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
    "dinou-env.d.ts",
    ".dinou/types/**/*.d.ts"
  ]
}
```

### Complete End-to-End Example

The following cohesive example shows how the root layout, Tailwind v4 global CSS, CSS modules, and page components function together harmoniously:

**1. Root Layout (`src/layout.tsx`):**

```tsx
// src/layout.tsx
"use client";

import type { ReactNode } from "react";
import "./globals.css"; // Imports Tailwind v4 & global tokens

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My Dinou App</title>
        {/* Critical single-bundle stylesheet with React 19 precedence */}
        <link href="/styles.css" rel="stylesheet" precedence="default" />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
```

**2. Global Styles & Tailwind v4 (`src/globals.css`):**

```css
/* src/globals.css */
@import "tailwindcss";

@theme {
  --color-brand: #10b981;
  --color-brand-hover: #059669;
  --radius-panel: 1rem;
}

:root {
  --card-bg: #ffffff;
  --border-color: #e2e8f0;
}

@media (prefers-color-scheme: dark) {
  :root {
    --card-bg: #0f172a;
    --border-color: #1e293b;
  }
}

.custom-gradient {
  background: linear-gradient(135deg, var(--color-brand) 0%, #f59e0b 100%);
}
```

**3. CSS Module (`src/card.module.css`):**

```css
/* src/card.module.css */
.card {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-panel);
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-brand);
}
```

**4. Page Component (`src/page.tsx`):**

```tsx
// src/page.tsx
"use client";

import styles from "./card.module.css";

export default function HomePage() {
  return (
    <main className="container max-w-2xl mx-auto py-12 px-4 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Styling with Dinou
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Combines Tailwind utility classes with locally scoped CSS Modules.
        </p>
      </header>

      {/* Using scoped CSS Module styles alongside Tailwind utilities */}
      <div className={styles.card}>
        <span className={styles.badge}>Modular Component</span>
        <h2 className="text-xl font-bold mt-2">Zero Style Bleed</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Scoped classes are automatically hashed and isolated by Dinou PostCSS.
        </p>
        <button className="mt-4 px-4 py-2 custom-gradient text-white rounded-lg font-medium shadow hover:opacity-90 transition">
          Interactive Button
        </button>
      </div>
    </main>
  );
}
```

---

## Assets & Media

### Assets & Media in Dinou

In Dinou, media files imported into JavaScript or TypeScript components are treated as first-class module dependencies. When you import an asset (e.g. `import logo from "./logo.png"`), the active bundler (esbuild, rollup, or webpack):

1. **Fingerprints the file:** Generates a deterministic path/name-based hash.
2. **Emits the asset:** Copies the file to the client distribution directory under `.dinou/dist3/assets/[name]-[hash].[ext]`.
3. **Returns a string URL:** Resolves the JavaScript import to the final public URL string (e.g. `"/assets/logo-8f1e2a.png"`).

- **RSC & SSR Safe:** Imports resolve to plain URL strings, rendering identically in server SSR HTML and client hydration with zero mismatch.
- **Zero Name Collisions:** Deterministic path-scoped hashes prevent filename collisions when different components import assets with the same name.
- **TypeScript Verified:** Built-in ambient declarations in `dinou/env` prevent broken imports and typos at build time.

### Imported Assets vs. Public Directory

In Dinou, files imported inside your code (`src/**/*`) are processed by bundlers, fingerprinted with deterministic path-based hashes, and emitted into `.dinou/dist3/assets/*` with immutable caching. In contrast, files placed in `public/` bypass bundlers entirely and are copied directly into the web root with fixed, unhashed URLs (ideal for `favicon.ico`, `robots.txt`, and verification files).

> [!TIP]
> For a detailed side-by-side comparison between `public/` static files and bundled assets, see the [Public Directory vs. Imported Assets Matrix](#4-public-vs-imported-assets-src).

### Supported Extensions (21 Formats)

Dinou recognizes 21 media extensions out-of-the-box across images, video, and audio:

| Category | Format Extensions | Common MIME Types |
| :--- | :--- | :--- |
| **Images (10)** | `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.avif`, `.ico`, `.mjpeg`, `.mjpg` | `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`, `image/avif` |
| **Video (6)** | `.mp4`, `.webm`, `.ogg`, `.mov`, `.avi`, `.mkv` | `video/mp4`, `video/webm`, `video/ogg`, `video/quicktime` |
| **Audio (5)** | `.mp3`, `.wav`, `.flac`, `.m4a`, `.aac` | `audio/mpeg`, `audio/wav`, `audio/flac`, `audio/aac` |

### Usage in Server & Client Components

Importing media files works identically in both Server Components (RSC) and Client Components (`"use client"`). Imported assets resolve to fingerprinted URL strings that can be passed directly to standard JSX elements like `<img>`, `<video>`, `<audio>`, or Web Audio APIs:

**1. Images in Server / Client Components (`src/components/avatar.tsx`):**

```tsx
// src/components/avatar.tsx
import userAvatar from "./avatar.webp";
import defaultIcon from "./user-placeholder.svg";

export function UserAvatar({ hasCustomPhoto }: { hasCustomPhoto?: boolean }) {
  const photoSrc = hasCustomPhoto ? userAvatar : defaultIcon;

  return (
    <div className="relative w-12 h-12 rounded-full overflow-hidden border">
      <img
        src={photoSrc}
        alt="User profile avatar"
        width={48}
        height={48}
        loading="lazy"
        className="object-cover w-full h-full"
      />
    </div>
  );
}
```

**2. Video & Audio in Client Components (`src/components/media-hero.tsx`):**

```tsx
// src/components/media-hero.tsx
"use client";

import heroBgVideo from "./hero-ambient.mp4";
import heroWebmVideo from "./hero-ambient.webm";
import chimeAudio from "./welcome-chime.mp3";

export function MediaHero() {
  const playSound = () => {
    const audio = new Audio(chimeAudio);
    audio.play().catch(() => {});
  };

  return (
    <div className="relative h-96 flex items-center justify-center overflow-hidden rounded-2xl">
      {/* Background Video with multiple format fallbacks */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover -z-10"
      >
        <source src={heroWebmVideo} type="video/webm" />
        <source src={heroBgVideo} type="video/mp4" />
      </video>

      <div className="text-center text-white space-y-4 p-6 bg-black/40 backdrop-blur-sm rounded-xl">
        <h1 className="text-3xl font-bold">Experience Dinou</h1>
        <button
          onClick={playSound}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition shadow"
        >
          Play Welcome Chime
        </button>
      </div>
    </div>
  );
}
```

### Path Aliases in Asset Imports

Dinou's bundlers resolve path aliases configured in `tsconfig.json` for media imports as well as code modules. You do not need to use fragile relative paths like `../../assets/logo.png`:

```tsx
// Clean path alias resolution
import companyLogo from "@/assets/brand/logo.svg";
import heroBanner from "@/assets/images/banner.webp";
```

### Production Build Output (.dinou/dist3/assets/)

When building for production (`dinou build`), Dinou bundles and emits all imported media files into the client distribution directory under `.dinou/dist3/assets/`, assigning each file a scoped, deterministic name:

```text
.dinou/dist3/assets/
├── logo-4b2a8f.png
├── banner-9c1d3e.webp
└── intro-sound-7e2f1a.mp3
```

> [!NOTE]
> This structure ensures that assets imported across different components never collide in filename, while keeping bundled media cleanly separated from root static files.

### TypeScript Declarations (dinou/env)

Ambient type declarations for all 21 media extensions are packaged directly into `dinou/env`. Verify that `dinou-env.d.ts` exists in your project root:

```typescript
/// <reference types="dinou/env" />
```

And confirm your `tsconfig.json` includes the reference:

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
    "dinou-env.d.ts",
    ".dinou/types/**/*.d.ts"
  ]
}
```

### Extending Custom Formats (Eject)

If your application requires specialized binary formats (e.g. `.hdr`, `.glb`, `.gltf` for 3D graphics, or `.wasm`), you can [eject Dinou](#eject-dinou) to take full ownership of the pipeline.

In an ejected project, simply add your custom extensions to the array in `dinou/core/asset-extensions.js`:

```javascript
// dinou/core/asset-extensions.js
const extensions = [
  "png", "jpg", "jpeg", "gif", "svg", "webp", "avif", "ico",
  "mp4", "webm", "ogg", "mov", "avi", "mkv",
  "mp3", "wav", "flac", "m4a", "aac",
  "mjpeg", "mjpg",
  // Custom additions:
  "glb", "gltf", "hdr"
];
```

> [!TIP]
> All three bundlers (esbuild, rollup, webpack) and the dual-engine runtime will automatically recognize and fingerprint your new file extensions.

---

## Environment Variables & Secrets

### Environment Variables in Dinou

Dinou isolates all environment variables strictly to the server runtime. Values are never automatically bundled, replaced, or inlined into client-side JavaScript chunks, ensuring secrets like database passwords or private API keys remain 100% on the server.

- **Zero Client Inlining:** Bundlers never inject `process.env` into client chunks. Secrets never reach the browser.
- **Multi-Runtime Ready:** Use `process.env` across Node, Bun, and Deno, and `getContext().env` for Cloudflare Workers bindings.
- **Bot Shield Protected:** Dinou's core HTTP scanner defense immediately rejects external requests targeting `.env` files.

### The Server-Only Security Model

In Dinou, **Client Components cannot access `process.env` directly**. If a client component needs a configuration value (such as a public analytics ID or Stripe publishable key), pass it explicitly as a prop from a Server Component.

#### Where Environment Variables Work

You can safely access environment variables in any server-side execution context:

- **Server Components (RSC):** Read database URLs or CMS tokens while rendering initial HTML on the server.
- **Server Functions ("use server"):** Access private payment APIs, database pools, and hashing secrets in RPC mutations.
- **Page Functions (getProps):** Fetch data before page execution in `page_functions.ts` using backend keys.
- **Plugins & Server Config:** Read environment variables (such as `PORT` or service keys) in `dinou.config.mjs` and plugins.

```tsx
// src/server-functions/checkout.ts
"use server";

import Stripe from "stripe";

// Securely read secret key inside Server Function
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function createCheckoutSession(amount: number) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{ price_data: { currency: "usd", unit_amount: amount }, quantity: 1 }],
    mode: "payment",
    success_url: `${process.env.APP_URL}/success`,
    cancel_url: `${process.env.APP_URL}/cancel`,
  });

  return session.url;
}
```

#### Safe Propagation to Client Components

When a Client Component requires a public configuration value (such as a public client ID or feature flag), pass it down through props from an enclosing Server Component:

```tsx
// src/page.tsx (Server Component)
import PaymentWidget from "./components/payment-widget"; // Client Component

export default function CheckoutPage() {
  // Explicitly extract ONLY the safe public key to send to the browser
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

  return (
    <main className="container max-w-xl mx-auto py-8">
      <h1>Complete Your Order</h1>
      <PaymentWidget publishableKey={publishableKey} />
    </main>
  );
}
```

> [!NOTE]
> By making data transfer across the server-client boundary explicit, code reviews immediately flag any sensitive secrets inadvertently sent to the client.

### Defining .env Files

In local development, Dinou loads variables from your project root `.env` file:

```bash
# .env (Local development template)
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/my_app_dev"

# Third-party credentials
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
GITHUB_CLIENT_ID="Iv1..."
GITHUB_CLIENT_SECRET="ghs_..."

# Application URLs
APP_URL="http://localhost:3000"
```

> [!TIP]
> **Security Best Practices:**
> - **Never commit .env to git:** Always ensure `.env` and `.env.*` are in your `.gitignore` file (except `.env.example`).
> - **Commit a .env.example:** Maintain a clean `.env.example` containing required variable names with placeholder values to onboard new team members.
> - **Production Environments:** In production (Fly.io, Railway, AWS, Docker), inject secrets via the host provider's native environment configuration dashboard rather than shipping a file.

### Multi-Platform Runtimes

Dinou is runtime-agnostic. For standard environment variables and secrets (like `DATABASE_URL` or `API_SECRET`), you can write `process.env` uniformly across all deployment targets:

#### Node.js & Bun (process.env)

In Node.js and Bun server adapters, environment variables reside natively on the global `process.env` object:

```typescript
const dbUrl = process.env.DATABASE_URL;
const port = Number(process.env.PORT || 3000);
```

> Bun also provides `Bun.env` as an alias, but `process.env` is fully supported across both runtimes.

#### Cloudflare Workers (process.env & Bindings)

In Cloudflare Workers, standard text secrets and environment variables configured in `wrangler.toml` or the Cloudflare dashboard are available via `process.env` (when `compatibility_flags = ["nodejs_compat"]` is enabled) or via `getContext().env`:

> [!NOTE]
> **Cloudflare Resource Bindings vs. Environment Variables:** By definition, `.env` files and `process.env` only store plain text strings. However, Cloudflare also provides **Resource Bindings** (live JavaScript instances with async methods for KV, D1 SQL databases, and R2 buckets) through its runtime `env` object. In Dinou, you can access both text secrets and live resource bindings uniformly anywhere on the server via `getContext().env`.

```typescript
import { getContext } from "dinou";

// Inside page_functions.ts (getProps), Server Components, or Server Functions:
export async function getProps(params) {
  // 1. Text secrets (work via process.env or getContext().env):
  const apiSecret = process.env.MY_API_SECRET;

  // 2. Cloudflare Resource Bindings (KV, D1, R2 live objects):
  const { env } = getContext();
  const kv = env?.MY_KV_NAMESPACE;
  const user = kv ? await kv.get("user:123") : null;

  return { user };
}
```

Inside Server Functions (`"use server"`), call `getContext()` directly to access D1 databases (`env.DB`) or KV namespaces for database queries and mutations.

#### Deno (process.env & --allow-env)

In Deno, environment variable access is protected by Deno's security sandbox. When launching Dinou on Deno, enable the `--allow-env` permission flag:

```bash
deno run --allow-net --allow-read --allow-write --allow-env dinou/adapters/deno.js
```

With `--allow-env` active, Deno's native Node compatibility allows you to read variables via `process.env.KEY` uniformly, or via `Deno.env.get("KEY")`.

### Type-Safe Environment Validation (Zod)

Missing environment variables in production are notorious for causing silent failures or runtime crashes. We recommend validating your environment variables at application startup using a lightweight schema validator such as **Zod**:

```typescript
// src/lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1, "STRIPE_PUBLISHABLE_KEY is required"),
});

// Parse and validate process.env
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  throw new Error("Invalid configuration. Check terminal output for details.");
}

export const env = parsed.data;
```

Now you can import the validated `env` object in your Server Components and Server Functions with full TypeScript autocompletion and compile-time type safety:

```typescript
// Full TypeScript autocomplete and guaranteed presence:
import { env } from "@/lib/env";

const db = connectToDatabase(env.DATABASE_URL);
```

### Anti-Leak Security & Bot Shield

Malicious web crawlers and vulnerability scanners frequently search for exposed `.env` files on web servers by issuing requests like:

```text
GET /.env
GET /api/.env
GET /public/.env
```

> [!IMPORTANT]
> **Dinou Core Scanner Defense:** Dinou includes a built-in **Anti-Bot Shield** in `dinou/core/handler.js`. The framework automatically matches incoming request paths against common bot attack patterns (including `/\.env$/i`, `/\.git\b/i`, `/\.sql$/i`, etc.) and immediately terminates them before any static file resolver or server route can be triggered.

**Production Deployment Checklist:**
- Verify `.env` is listed in `.gitignore` and `.dockerignore`.
- Configure platform secrets via your host's dashboard or CLI (e.g. `railway variables set`, `fly secrets set`, `wrangler secret put`).
- Ensure sensitive API credentials are only referenced inside Server Components or Server Functions.
- Use schema validation (like Zod) to catch missing variables immediately on server boot.

---

## Import Aliases & Path Resolution

Configure clean, refactor-proof import paths across your codebase using standard `tsconfig.json` path mappings — supported seamlessly across code, stylesheets, and assets.

### Import Aliases in Dinou

In large projects, deeply nested relative paths like `../../../../components/ui/button` are fragile, difficult to read, and break whenever a file is moved to another directory.

Dinou provides **zero-config path alias support** by reading your standard `tsconfig.json` directly. Even in plain JavaScript projects, using a `tsconfig.json` with `"allowJs": true` is the recommended standard across modern tooling.

| Fragile Relative Imports (Before) | Clean Aliased Imports (With Dinou) |
| :--- | :--- |
| `import { Button } from "../../../components/button";` | `import { Button } from "@/components/button";` |
| `import { db } from "../../../../lib/db";` | `import { db } from "@/lib/db";` |
| `import logo from "../../assets/logo.svg";` | `import logo from "@/assets/logo.svg";` |

---

### Configuring tsconfig.json

To enable the standard `@/*` alias pointing to your `src/` directory, configure `paths` in your project root `tsconfig.json`:

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
    "dinou-env.d.ts",
    ".dinou/types/**/*.d.ts"
  ]
}
```

> [!NOTE]
> **Using Plain JavaScript?**
> Even if your project is written entirely in JavaScript (`.js` / `.jsx`), maintain a `tsconfig.json` with `"allowJs": true`. This gives your editor and Dinou's build tools identical resolution semantics and full autocompletion without any TypeScript syntax required in your code.

#### Defining Multiple Granular Aliases

You are not limited to just `@/*`. You can declare multiple granular aliases to organize domain layers cleanly:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@server/*": ["src/server-functions/*"],
      "@lib/*": ["src/lib/*"],
      "@styles/*": ["src/styles/*"],
      "@assets/*": ["src/assets/*"]
    }
  }
}
```

Dinou parses every alias mapping at startup, resolving wildcards (`/*`) relative to the project root.

---

### Where Aliases Work (Code, CSS, & Assets)

Unlike setups where aliases only work inside JavaScript/TypeScript files, Dinou propagates alias resolution across all asset types in your build pipeline:

#### 1. TypeScript & JavaScript Modules

Use aliases freely in Server Components (RSC), Client Components (`"use client"`), Server Functions (`"use server"`), and Page Functions:

```tsx
// src/app/dashboard/page.tsx
import { UserCard } from "@/components/user-card";
import { fetchUserMetrics } from "@/server/metrics";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const metrics = await fetchUserMetrics();
  return <UserCard data={metrics} formattedTime={formatDate(Date.now())} />;
}
```

#### 2. CSS @import Rules

Dinou's PostCSS pipeline integrates `postcss-import` with the alias resolver. You can reference path aliases directly inside global CSS or CSS modules:

```css
/* src/styles/theme.css */
@import "@/styles/tokens.css";
@import "@/styles/typography.css";

:root {
  --font-primary: var(--brand-font);
}
```

The resolver resolves `@/styles/tokens.css` to `src/styles/tokens.css` automatically during stylesheet extraction.

#### 3. Asset & Media Imports

Media files (images, SVGs, audio, video) can also be imported using path aliases:

```tsx
// src/components/hero.tsx
import heroImage from "@/assets/images/hero-banner.webp";
import logoSvg from "@/assets/brand/logo.svg";

export function Hero() {
  return (
    <div className="hero">
      <img src={logoSvg} alt="Brand Logo" className="h-10" />
      <img src={heroImage} alt="Hero Banner" className="rounded-xl shadow-lg" />
    </div>
  );
}
```

---

### Automatic Extension & Index Resolution

When importing via aliases, you do not need to specify file extensions or trailing `/index` files:

| Import Statement | Resolved Disk Path |
| :--- | :--- |
| `import { Card } from "@/components/card";` | `src/components/card.tsx` (or `.ts`, `.jsx`, `.js`) |
| `import { Modal } from "@/components/modal";` | `src/components/modal/index.tsx` (directory index) |
| `import { db } from "@/lib/db";` | `src/lib/db.ts` |

---

### IDE Autocomplete & Refactoring Support

Because Dinou uses standard TypeScript compiler configurations, modern development environments (VS Code, Cursor, WebStorm, Neovim) provide full first-class support without any plugins:

- **IntelliSense & Auto-Import:** Typing component names automatically suggests the clean `@/` alias import.
- **Jump to Definition:** `Cmd+Click` (or `Ctrl+Click` / `F12`) navigates directly to the target source file across aliases.
- **Safe File Renaming:** Renaming or moving files in your IDE updates all aliased import paths across your codebase automatically.

---

### Best Practices & Common Gotchas

- **Ensure `"moduleResolution": "bundler"` is set:** In modern TypeScript, `"moduleResolution": "bundler"` accurately mirrors how Dinou's dual-bundler engine resolves files without requiring explicit `.js` file extensions on TypeScript imports.
- **Paths resolve relative to tsconfig.json:** With modern TypeScript (`"moduleResolution": "bundler"`), `paths` mappings resolve directly relative to the project root without needing the deprecated `baseUrl` option.
- **Avoid Circular Dependency Loops:** While aliases make it easy to import anything from anywhere, maintain clear architecture layers (e.g. components import from `@/lib`, but `@/lib` utilities should not import React UI components) to avoid circular reference warnings.

---

## Configuration & Plugins

Customize your Dinou application with `dinou.config.mjs`, enable global Partial Prerendering (PPR), configure React StrictMode, and hook into the request lifecycle using Web Standards plugins.

### Configuration & Plugin System

In **Dinou v7**, the configuration and plugin architecture is built entirely on modern **Web Standards** (the standard `Request` and `Response` interfaces).

Through `dinou.config.mjs`, you can:

- **Enable Global PPR:** Automatically generate static shells with dynamic streaming Suspense holes for all static-eligible routes.
- **Configure React StrictMode:** Ensure dev-time safety and compiler compatibility across your component tree.
- **Mount Universal Middlewares:** Intercept incoming HTTP requests, enforce security policies, or handle webhooks without ejecting.
- **Propagate Server Context:** Attach session, user, or localization data to `context`, instantly accessible in Server Components and Server Functions via `getContext()`.

| Feature | Description |
| :--- | :--- |
| **Web Standards First** | Native `Request` & `Response` APIs. Zero dependency on legacy Node.js Express wrappers. |
| **PPR & Rendering Flags** | Control global Partial Prerendering and React StrictMode from a single configuration source. |
| **Context Propagation** | Inject authenticated user or tenant data into RSC via `AsyncLocalStorage` and `getContext()`. |

---

### The dinou.config.mjs File

Dinou automatically discovers your configuration file at the root of your project. The recommended format is ES Modules (`dinou.config.mjs` or `dinou.config.ts`) using the `defineConfig` helper:

```typescript
// dinou.config.mjs
import { defineConfig } from "dinou";
// Optional: import storage adapters if running custom ISR persistence
// import { CloudflareKVStorage } from "dinou/server";

export default defineConfig({
  // Global Partial Prerendering default (can be overridden per route)
  ppr: false,

  // React StrictMode in development (defaults to true in v7)
  reactStrictMode: true,

  // Custom storage adapter for ISR / route caching (defaults to FileSystemStorage in Node / KV in Deno)
  // storage: new CloudflareKVStorage(env.MY_KV),

  // Array of Web Standards plugins
  plugins: [],
});
```

> [!NOTE]
> Dinou also supports `dinou.config.js`, `dinou.config.cjs`, and `dinou.config.ts`.

---

### Top-Level Configuration Options

The `DinouConfig` schema provides top-level controls for runtime behavior and compilation:

#### 1. Global Partial Prerendering (ppr)

**Dinou v7** introduces first-class **Partial Prerendering (PPR)**. When `ppr: true` is configured globally in `dinou.config.mjs`:

- All static-eligible routes pre-render an instant static HTML shell at build/ISR time.
- Dynamic components wrapped in React `<Suspense>` leave streaming placeholder holes that resume and stream from the server upon request.

```javascript
// dinou.config.mjs
export default defineConfig({
  ppr: true, // Enables Partial Prerendering across all eligible routes
});
```

> [!TIP]
> You can still override PPR on a per-route or per-layout basis inside `page_functions.ts` or `layout_functions.ts` by exporting `export const ppr = false;`.

#### 2. React StrictMode (reactStrictMode)

In Dinou v7, `reactStrictMode` defaults to `true`. When active in development mode, React intentionally invokes components and effects twice to identify unintended side effects and ensure strict compliance with the React Compiler.

```javascript
// dinou.config.mjs
export default defineConfig({
  // Enabled by default (recommended). Set to false to disable:
  reactStrictMode: false,
});
```

#### 3. Storage Adapter (storage)

Dinou's ISR and ISG caching engine uses a pluggable storage adapter. By default, Dinou uses the local filesystem (in Node.js/Bun) or Deno KV (in Deno). You can supply a custom storage adapter (such as Redis or Cloudflare KV) in `dinou.config.mjs`:

```javascript
// dinou.config.mjs
import { myCustomRedisStorage } from "./src/lib/storage-redis";

export default defineConfig({
  storage: myCustomRedisStorage,
});
```

#### 4. Plugins Array (plugins)

An array of plugin objects conforming to the `DinouPlugin` interface, executed sequentially on every incoming request.

---

### Dinou Plugin Architecture (onRequest)

In Dinou v7, a plugin is an object containing an optional `name` and the `onRequest` lifecycle hook:

```typescript
export interface DinouPlugin {
  name?: string;
  onRequest?(
    request: Request,
    context: RequestContextStore
  ): Promise<Response | void> | Response | void;
}
```

The `onRequest` hook receives the standard Web `Request` object and Dinou's mutable `RequestContextStore`.

#### The context Object (RequestContextStore)

The `context` parameter provides access to parsed request metadata, response mutation helpers, platform edge bindings, and custom shared state:

```typescript
export interface RequestContextStore {
  /** Parsed incoming request metadata */
  req: {
    path: string;                    // Normalized URL pathname (e.g. "/admin/settings")
    method: string;                  // HTTP method ("GET", "POST", etc.)
    cookies: Record<string, string>; // Parsed cookie key-value pairs
    headers: Record<string, string>; // Lowercased incoming HTTP headers
    query: Record<string, string>;   // Parsed URL search parameters
    env?: Record<string, any>;       // Platform environment bindings
    ctx?: any;                       // Platform execution context
  };

  /** Outgoing response mutation helpers */
  res: {
    cookie(name: string, value: string, options?: CookieOptions): void;
    clearCookie(name: string, options?: CookieOptions): void;
    setHeader(name: string, value: string): void;
    status(code: number): void;
    redirect(url: string): void;
    redirect(status: number, url: string): void;
  };

  /** Direct platform bindings (Cloudflare Workers KV, D1, R2, etc.) */
  env?: Record<string, any>;

  /** Platform runtime context (e.g. ctx.waitUntil for background execution) */
  ctx?: { waitUntil(promise: Promise<any>): void };

  /** Custom state attached by plugins (context.user, context.session, etc.) */
  [key: string]: any;
}
```

| Property | Type | Description |
| :--- | :--- | :--- |
| `context.req` | `Object` | Parsed request helpers: `cookies`, `headers`, `query`, `path`, and `method`. |
| `context.res` | `ResponseProxy` | Response mutation helpers: `cookie()`, `clearCookie()`, `setHeader()`, `status()`, and `redirect()`. |
| `context.env` | `Record<string, any>` | Direct platform bindings in serverless/edge runtimes (e.g. Cloudflare KV, D1 databases, R2 buckets). |
| `context.ctx` | `ExecutionContext` | Platform execution context, allowing `ctx.waitUntil(promise)` for non-blocking background tasks without delaying the HTTP response. |
| `context[key]` | `any` | Any custom property attached directly to `context` (e.g. `context.user`, `context.session`) is preserved in `AsyncLocalStorage` and accessible anywhere via `getContext()`. |

The `onRequest` hook can execute in two distinct operational patterns:

#### Pattern 1: Short-Circuit & Webhooks (Returning Response)

If `onRequest` returns a Web `Response` instance, Dinou **immediately returns that response to the client** and aborts further processing. React Server Component rendering is completely bypassed:

```typescript
const healthCheckPlugin = {
  name: "health-check",
  onRequest(request) {
    const url = new URL(request.url);
    if (url.pathname === "/healthz") {
      return Response.json({ status: "ok", timestamp: Date.now() });
    }
  },
};
```

#### Pattern 2: Middleware & Context Mutation (getContext)

If `onRequest` returns `void` (or `undefined`), request processing continues normally. Any property attached to `context` is preserved in `AsyncLocalStorage` and becomes accessible in any server-side module:

```typescript
const userSessionPlugin = {
  name: "user-session",
  async onRequest(request, context) {
    const sessionCookie = context.req.cookies["session_id"];
    if (sessionCookie) {
      // Validate session and attach user object
      const user = await validateSession(sessionCookie);
      context.user = user;
    }
  },
};
```

In your Server Components or Server Functions, consume the attached data using `getContext()`:

```tsx
// src/app/profile/page.tsx (Server Component)
import { getContext } from "dinou";

export default function ProfilePage() {
  const context = getContext();
  const user = context?.user;

  if (!user) {
    return <p>Please sign in to view your profile.</p>;
  }

  return <h1>Welcome back, {user.name}!</h1>;
}
```

---

### Real-World Plugin Examples

In production applications, plugins allow you to keep authentication guards, raw webhook endpoints, and pipeline registration cleanly separated and composable:

**1. Authentication Guard (`plugins/auth-guard.ts`):**

```typescript
// plugins/auth-guard.ts
import type { DinouPlugin } from "dinou";

export function authGuardPlugin(): DinouPlugin {
  return {
    name: "auth-guard",
    async onRequest(request, context) {
      const url = new URL(request.url);

      // Protect /admin routes
      if (url.pathname.startsWith("/admin")) {
        const token = context.req.cookies["auth_token"];
        if (!token) {
          // Redirect unauthorized visitors immediately
          return Response.redirect(new URL("/login", request.url), 302);
        }

        const user = await verifyToken(token);
        if (!user || user.role !== "admin") {
          return new Response("Forbidden", { status: 403 });
        }

        // Attach verified user to context
        context.user = user;
      }
    },
  };
}
```

**2. Stripe Webhook Listener (`plugins/stripe-webhook.ts`):**

```typescript
// plugins/stripe-webhook.ts
import type { DinouPlugin } from "dinou";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export function stripeWebhookPlugin(): DinouPlugin {
  return {
    name: "stripe-webhook",
    async onRequest(request) {
      const url = new URL(request.url);
      if (url.pathname === "/api/webhooks/stripe" && request.method === "POST") {
        const sig = request.headers.get("stripe-signature");
        const rawBody = await request.text();

        try {
          const event = stripe.webhooks.constructEvent(
            rawBody,
            sig!,
            process.env.STRIPE_WEBHOOK_SECRET!
          );

          if (event.type === "checkout.session.completed") {
            // Process payment event
          }

          return Response.json({ received: true });
        } catch (err: any) {
          return new Response(`Webhook Error: ${err.message}`, { status: 400 });
        }
      }
    },
  };
}
```

**3. Composition in `dinou.config.mjs`:**

```typescript
// dinou.config.mjs
import { defineConfig } from "dinou";
import { requestLoggerPlugin } from "./plugins/logger";
import { stripeWebhookPlugin } from "./plugins/stripe-webhook";
import { authGuardPlugin } from "./plugins/auth-guard";

export default defineConfig({
  ppr: true,
  reactStrictMode: true,
  plugins: [
    // 1. Observability: Runs first on every incoming request
    requestLoggerPlugin(),

    // 2. Webhooks: Intercepts /api/webhooks/* and short-circuits early
    stripeWebhookPlugin(),

    // 3. Auth Guard: Validates credentials and enriches context.user
    authGuardPlugin(),
  ],
});
```

---

### Registration & Execution Pipeline Order

To register your plugins, pass them into the `plugins` array of `defineConfig` in `dinou.config.mjs` (as shown in the configuration example above). Dinou executes plugins sequentially according to their position in the array:

1. **Strict Sequential Execution:** Plugins execute top-to-bottom in the exact order they are declared in the array (`plugins[0]` → `plugins[1]` → `plugins[2]`). Dinou awaits each plugin's `onRequest` promise before evaluating the next.
2. **Short-Circuit Precedence:** If a plugin returns a `Response` instance (e.g. returning `Response.json()` from a webhook or `Response.redirect()` from a guard), the pipeline terminates **immediately**. Subsequent plugins in the array and React page rendering are completely skipped.
3. **Cumulative Context Sharing:** Context mutations are cumulative. A plugin downstream in the array receives the exact `context` object enriched by previous upstream plugins.

**Recommended Layering Order:**

- **Layer 1 (Global Observability & Headers):** Request logging, performance metrics, and CORS headers.
- **Layer 2 (Public Webhooks & Health Checks):** Webhook listeners that must bypass authentication (e.g., Stripe, Clerk, `/healthz`).
- **Layer 3 (Session & Tenant Identification):** Cookie parsers, auth token validation, and multi-tenant resolution that mutate `context`.
- **Layer 4 (Route Guards & Permissions):** Access-control checks that inspect `context.user` and issue redirects if unauthorized.

---

### Fault Isolation & Error Handling

Dinou provides built-in try-catch fault isolation for all active plugins:

- **Plugin Attribution:** Plugins are identified by their `name` property. If an unhandled exception occurs inside `onRequest`, Dinou logs an informative error attributing the failure to that specific plugin name:
  ```
  [Dinou Plugin Error: "my-plugin"]: TypeError ...
  ```
- **Graceful Fallback:** If an unhandled exception is thrown by a plugin, Dinou catches it safely and returns a standard `500 Internal Server Error` response, preventing server crash or zombie process states.

---

## Bundlers & Build Tooling

Dinou features first-class multi-bundler architecture supporting **esbuild**, **Rollup**, and **Webpack** across Node.js, Cloudflare, Deno, Bun, and standalone compiled binaries.

### Bundlers in Dinou

Unlike rigid meta-frameworks that lock you into a single proprietary bundler, Dinou is architected with a pluggable, agnostic build core. Dinou provides native, pre-configured pipelines for three premier JavaScript bundlers:

- **esbuild (Default):** Written in Go. Delivers sub-millisecond build cycles and instant HMR feedback loops in local development.
- **Rollup:** The industry benchmark for clean ES Module output, advanced tree-shaking, and surgical code splitting.
- **Webpack:** The most battle-tested enterprise bundler with universal package compatibility and built-in React Compiler integration in dev and prod.

| Bundler | Strengths | React Compiler Support | Best Used For |
| :--- | :--- | :--- | :--- |
| **esbuild (Default)** | 10×–100× faster startup, sub-millisecond rebuilds, native Go machine code | Active in production builds (skipped in dev for instant speed) | Daily local development and rapid feature building |
| **Rollup** | Cleanest ESM chunk output, maximum tree-shaking, surgical scope hoisting | Active in production builds | Production builds where bundle size and edge execution efficiency are paramount |
| **Webpack** | Universal npm compatibility, advanced source maps, granular chunk splitting | Active in **both development and production** | Enterprise projects with diverse npm dependencies or testing React Compiler in dev |

---

### esbuild, Rollup, & Webpack Compared

#### 1. esbuild (Default & Lightning Fast)

`esbuild` is Dinou's default bundler. Because it is compiled to native Go machine code, it avoids JavaScript runtime overhead during compilation.

- **Strengths:** Near-instant cold start, sub-second incremental rebuilds, and low memory usage.
- **React Compiler Behavior:** In Dinou v7, esbuild skips the React Compiler in development for speed, but runs it during production builds.
- **Best Used For:** Daily local development and rapid feature building.

#### 2. Rollup (Optimized Tree-Shaking)

`Rollup` excels at analyzing ES Module import/export graphs to eliminate dead code and produce minimal client payloads.

- **Strengths:** Cleanest chunk output, excellent scope hoisting, and strict standard ESM alignment.
- **React Compiler Behavior:** Runs the React Compiler during production builds.
- **Best Used For:** Production builds where bundle size and edge execution efficiency are paramount.

#### 3. Webpack (Enterprise & React Compiler)

`Webpack` provides deep compatibility with legacy npm packages, complex module interop, and full compiler transforms.

- **Strengths:** Broadest package compatibility, robust source-map generation, and granular chunk splitting.
- **React Compiler Behavior:** Runs the React Compiler in **both development and production**. If you want to test React Compiler memoization locally, use `dinou dev:webpack`.
- **Best Used For:** Enterprise projects with diverse npm dependencies or teams validating React Compiler in dev.

---

### The Dual-Bundle Engine Architecture

React Server Components (RSC) require a specialized build architecture. For every build or development run, Dinou orchestrates two parallel pipelines:

- **1. Server Pipeline (RSC & Runtime):** Compiles Server Components, Server Functions (`"use server"`), and Page Functions for Node.js, Cloudflare, Deno, or Bun runtimes.
- **2. Client Pipeline (Browser & CSS):** Extracts Client Components (`"use client"`), processes styles into `/styles.css`, fingerprints assets, and produces the React Client Manifest.

The **React Client Manifest** connects the two: when the server encounters a `<ClientComponent />`, it serializes a reference that the client browser hydrates seamlessly over Flight RPC.

---

### Complete Dinou v7 Scripts Matrix

Dinou v7 exposes a complete set of CLI commands. Every command supports specifying your bundler (`:esbuild`, `:rollup`, `:webpack`) or omitting it to use the default:

#### Development Scripts (dinou dev)

Starts the development server with Hot Module Replacement (HMR) and in-memory compilation:

| Command | Bundler Engine | Description |
| :--- | :--- | :--- |
| `dinou dev` | esbuild (Default) | Fastest dev server startup with instant Fast Refresh. |
| `dinou dev:esbuild` | esbuild | Explicit esbuild development command. |
| `dinou dev:rollup` | Rollup | Rollup-powered development server with ESM HMR. |
| `dinou dev:webpack` | Webpack | Webpack dev server with React Compiler active in dev. |

#### Node.js Build & Start

Compiles and runs the standalone Node.js server from `.dinou/node/server.mjs`:

| Command | Action | Bundler |
| :--- | :--- | :--- |
| `dinou build:node` | Compile for Node.js production server | esbuild (Default) |
| `dinou build:node:esbuild` | Compile for Node.js production server | esbuild |
| `dinou build:node:rollup` | Compile for Node.js production server | Rollup |
| `dinou build:node:webpack` | Compile for Node.js production server | Webpack |
| `dinou start:node` | Run built Node.js server (PORT=3000) | Default |
| `dinou start:node:esbuild` | Run built Node.js server (esbuild bundle) | esbuild |
| `dinou start:node:rollup` | Run built Node.js server (Rollup bundle) | Rollup |
| `dinou start:node:webpack` | Run built Node.js server (Webpack bundle) | Webpack |

#### Cloudflare Workers & Pages

Compiles your application into an edge-native worker bundle:

| Command | Bundler | Output Target |
| :--- | :--- | :--- |
| `dinou build:cloudflare` | esbuild (Default) | `.dinou/cloudflare/` |
| `dinou build:cloudflare:esbuild` | esbuild | `.dinou/cloudflare/` |
| `dinou build:cloudflare:rollup` | Rollup | `.dinou/cloudflare/` |
| `dinou build:cloudflare:webpack` | Webpack | `.dinou/cloudflare/` |

#### Deno & Standalone Compiles

Build for Deno KV runtime, or compile directly into a **self-contained standalone executable binary** with zero system dependencies:

| Command | Description |
| :--- | :--- |
| `dinou build:deno` | Builds Deno bundle with KV storage support. (Also `:esbuild`, `:rollup`, `:webpack`) |
| `dinou start:deno` | Runs the compiled Deno server with `--unstable-kv`. |
| `dinou build:deno:compile` | Produces a standalone binary (`dist/deno-server`) for your current OS. |
| `dinou build:deno:compile:linux` | Cross-compiles x86_64 Linux standalone executable. |
| `dinou build:deno:compile:linux_arm` | Cross-compiles ARM64 Linux standalone executable (Raspberry Pi / Graviton). |
| `dinou build:deno:compile:mac` | Cross-compiles macOS standalone binary (Apple Silicon / Intel). |
| `dinou build:deno:compile:win` | Cross-compiles Windows standalone executable (`dist/deno-server-win.exe`). |

> [!TIP]
> Every compile command supports bundler suffixes (e.g. `dinou build:deno:compile:linux:rollup`).

#### Bun Runtime & Standalone Compiles

Target the ultra-fast Bun JavaScript runtime with standard or pure native modes:

| Category | Commands | Description |
| :--- | :--- | :--- |
| **Standard Bun** | `dinou build:bun`<br>`dinou start:bun` | Builds and runs your app with Bun runtime. Supports `:esbuild`, `:rollup`, `:webpack`. |
| **Bun Standalone Binary** | `dinou build:bun:compile` | Compiles your app into a standalone binary using `bun build --compile`. Supports cross-compilation (`:linux`, `:linux_arm`, `:mac`, `:win"). |
| **Pure Bun Mode** | `dinou build:bun:pure`<br>`dinou build:bun:pure:compile` | Uses Bun's native pure bundler pipeline and compiles single-file binaries across Linux, Mac, and Windows. |

#### Static HTML Export (dinou export-static)

Crawls and generates a 100% static HTML/CSS/JS export in `out/` ready to host on Surge.sh, GitHub Pages, Cloudflare Pages, AWS S3, Netlify, or Apache/Nginx:

```bash
# Static export with default bundler (esbuild)
dinou export-static

# Static export with specific bundlers
dinou export-static:esbuild
dinou export-static:rollup
dinou export-static:webpack
```

---

### Recommended package.json Setup

Copy and paste the complete `"scripts"` block directly into your project's `package.json`:

```json
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
```

---

### Which Bundler & Target Should You Choose?

- **Local Development → esbuild:** Always use `dinou dev` (esbuild) for daily work. Its sub-millisecond compilation and memory caching provide the fastest iteration feedback.
- **Edge Deployments → Rollup:** For Cloudflare Workers or serverless edge targets where cold start and payload size matter most, `dinou build:cloudflare:rollup` yields optimal tree-shaking.
- **Enterprise & React Compiler → Webpack:** If testing React Compiler memoization in dev or migrating enterprise code with non-standard CommonJS modules, `dinou dev:webpack` is your best choice.
- **Self-Contained Shipments → Deno / Bun Compile:** To deploy to bare-metal servers or minimal Docker containers without installing Node.js, run `dinou build:deno:compile` or `dinou build:bun:compile` to produce a single binary file.

---

## Deployment Guide

Dinou v7 features universal deployment flexibility: deploy as a standalone Node.js server, on Netlify Serverless Functions v2, at the edge with Cloudflare Workers, on Deno or Bun, or compiled into single native binaries.

### Deploy Everywhere with Dinou v7

Before Dinou v7, deploying React Server Components to serverless platforms (like Netlify) was impossible due to the need to pass the `--conditions react-server` flag. While on a VPS or custom server (like DigitalOcean) you could configure Node runtime flags, serverless and edge environments offered no control over them.

**Dinou v7 solves this completely**: through its pre-bundled dual-engine architecture, server bundles are compiled with all React Server conditions pre-resolved at build time. You can now deploy Dinou to virtually any infrastructure:

| Platform | Runtime Type | Description |
| :--- | :--- | :--- |
| **Node.js & Containers** | Standalone Server | Standalone servers on Railway, Fly.io, Render, DigitalOcean, AWS, or Docker. |
| **Netlify Serverless v2** | Serverless Functions v2 | Native Functions v2 adapter with zero-config edge routing and static CDN caching. |
| **Cloudflare Workers** | Edge V8 Engine | Global sub-millisecond cold starts on Cloudflare Workers and Pages with KV & D1. |
| **Deno Deploy (Edge)** | Global Edge Cloud | Multi-region edge runtime targeting `deno-edge` with built-in Deno KV persistence. |

---

### Supported Deployment Targets

Dinou provides dedicated build commands and adapters for each target runtime:

| Deployment Target | Build Command | Start / Output |
| :--- | :--- | :--- |
| **Node.js Server** | `dinou build:node` | `dinou start:node` |
| **Netlify (Functions v2)** | `dinou build:node` | Automated via `netlify.toml` |
| **Cloudflare Workers** | `dinou build:cloudflare` | `wrangler deploy` |
| **Deno Deploy (Edge / Cloud)** | `dinou build:deno` | `deno deploy --project=<app> .dinou/deno/main.js` |
| **Deno Standalone Server** | `dinou build:deno` | `dinou start:deno` |
| **Deno Standalone Binary** | `dinou build:deno:compile` | `./dist/deno-server` |
| **Bun Runtime** | `dinou build:bun` / `dinou build:bun:pure` | `dinou start:bun` |
| **Bun Standalone Binary** | `dinou build:bun:compile` / `dinou build:bun:pure:compile` | `./dist/server` |
| **Static HTML Export (SSG)** | `dinou export-static` | `out/` (Static HTML & Assets) |

#### 1. Node.js (Docker, Fly.io, Railway, Render)

The Node.js target compiles your application into a pre-bundled, standalone production server in `.dinou/node/server.mjs`:

```bash
# 1. Compile for Node.js
dinou build:node

# 2. Start the production server (defaults to PORT 3000)
dinou start:node
```

**PaaS & Cloud Hosts (Railway, Render, Fly.io, DigitalOcean App Platform):**
Set **Build Command** to `npm run build:node` and **Start Command** to `npm run start:node`. All platform-assigned ports (`PORT`) are detected automatically, and Dinou's pre-bundled architecture eliminates any need for manual Node flags.

#### 2. Netlify (Serverless Functions v2)

In **Dinou v7**, Netlify is a first-class supported serverless target. During `npm run build`, Dinou automatically pre-bundles a specialized **Netlify Functions v2 Adapter** directly into `.dinou/dist3/server/netlify.js`.

**Step 1:** Configure your project with a `netlify.toml` file in the repository root:

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".dinou/dist3"

[build.environment]
  NODE_VERSION = "22"

[environment]
  NODE_ENV = "production"

[functions]
  directory = ".dinou/dist3/server"
  node_bundler = "none"
  included_files = [
    "package.json",
    "tsconfig.json",
    "dinou.config.*",
    "src/**",
    "dinou/**",
    ".dinou/**",
    "node_modules/**",
    "!node_modules/@swc/**",
    "!node_modules/typescript/**",
    "!node_modules/webpack*/**",
    "!node_modules/@esbuild/**",
    "!node_modules/esbuild/**",
    "!node_modules/@rollup/**",
    "!node_modules/rollup/**",
    "!node_modules/.cache/**",
    "!node_modules/@types/**"
  ]
```

**Step 2:** Deploy to Netlify:

```bash
# Option A: Automatic Git-based CI/CD (Recommended)
git push origin main

# Option B: Manual deployment using Netlify CLI (requires local build)
npm run build
npx netlify deploy --prod
```

> [!NOTE]
> **How Netlify Functions v2 Works in Dinou:**
> The pre-bundled adapter in `.dinou/dist3/server/netlify.js` exports `config = { path: "/*", preferStatic: true }`. Because `preferStatic: true` is active, Netlify serves all client assets, CSS, images, and pre-rendered pages directly from `.dinou/dist3` through its global edge CDN with zero compute cost. Dynamic routes, SSR streaming, and React Server Functions are routed to the serverless function automatically. With `node_bundler = "none"`, Netlify runs the pre-bundled adapter cleanly without double-bundling conflicts.

#### 3. Cloudflare Workers & Pages

Dinou provides native ahead-of-time compilation for Cloudflare's V8-based `workerd` edge runtime. It compiles Server Components and SSR into standard W3C Web Streams with sub-millisecond cold starts across 300+ cities:

**Step 1:** Compile your application for Cloudflare Workers:

```bash
# Build edge worker bundle (.dinou/cloudflare/worker.js)
npm run build:cloudflare
```

**Step 2:** Configure your project with a `wrangler.toml` file in the repository root:

```toml
# wrangler.toml
name = "my-dinou-app"
main = ".dinou/cloudflare/worker.js"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

# Serve client bundles, CSS, and static assets directly via Cloudflare CDN
[assets]
directory = ".dinou/dist3"

# Optional: Bind KV namespace for persistent ISR route caching
# [[kv_namespaces]]
# binding = "DINOU_CACHE"
# id = "<your-kv-namespace-id>"
```

**Step 3:** Test locally or deploy to Cloudflare:

```bash
# Preview locally with Wrangler (defaults to port 3000)
npx wrangler dev

# Deploy to Cloudflare Workers edge network
npx wrangler deploy
```

> [!NOTE]
> **How Cloudflare Workers Works in Dinou v7:**
> Dinou generates a self-contained Dual-Bundle orchestrator at `.dinou/cloudflare/worker.js`. Static assets and pre-rendered pages are served instantly by Cloudflare's global CDN through `env.ASSETS`. When bound to `env.DINOU_CACHE`, Dinou automatically activates `CloudflareKVStorage` to persist Incremental Static Regeneration (ISR) route caches across the edge. Secrets, D1 databases, and R2 buckets are injected seamlessly into Server Components via `getContext().env`.

#### 4. Deno Deploy (deno-edge) & Standalone Binaries

Dinou provides native compilation for the **Deno Deploy** global edge cloud (targeting the `deno-edge` runtime), standalone Deno server execution, and **zero-dependency single-file binary compilation**:

**A. Deno Deploy (Serverless Global Edge - `deno-edge`):**
When running `dinou build:deno`, Dinou packages your RSC and SSR engines specifically optimized for the `deno-edge` runtime into `.dinou/deno/main.js`. Dinou integrates natively with **Deno KV** (`Deno.openKv()`), allowing ISR-cached pages, dynamic KV stores, and sessions to persist across Deno's global edge network (35+ regions) with zero database configuration.

```bash
# 1. Build bundle targeting Deno Edge (deno-edge)
dinou build:deno

# 2. Deploy directly to Deno Deploy using native Deno CLI (Deno 2+):
deno deploy --project=<my-project> .dinou/deno/main.js
```

**B. Deno Standalone Server (VPS / Docker):**
To run your application using the standard Deno runtime locally or in self-hosted Linux containers:

```bash
# Build and run with standard Deno runtime
dinou build:deno
dinou start:deno
```

**C. Zero-Dependency Standalone Binaries (`deno compile`):**
Compile your entire Dinou application, the V8 JavaScript engine, Deno runtime, and embedded Deno KV database into a single self-contained executable file. The target server does not need Node, Deno, or Bun installed:

```bash
# Compile standalone binary for current OS
dinou build:deno:compile
./dist/deno-server

# Cross-compile for any operating system / architecture:
dinou build:deno:compile:linux      # x86_64 Linux
dinou build:deno:compile:linux_arm  # ARM64 Linux (AWS Graviton, Raspberry Pi)
dinou build:deno:compile:mac        # Apple macOS binary
dinou build:deno:compile:win        # Microsoft Windows executable
```

#### 5. Bun Runtime & Standalone Executables

Run your application under the high-performance Bun JavaScript runtime:

```bash
# 1. Standard Bun build and execution
dinou build:bun
dinou start:bun

# 2. Pure Bun (100% Bun execution, 0 Node.js on the machine)
dinou build:bun:pure
dinou start:bun

# 3. Standalone Bun single-file binary compilation
dinou build:bun:compile
./dist/server

# 4. Pure Bun standalone binary compilation (100% Bun from build to exe)
dinou build:bun:pure:compile
./dist/server

# Cross-compilation targets:
dinou build:bun:compile:linux      # x86_64 Linux
dinou build:bun:compile:linux_arm  # ARM64 Linux (AWS Graviton)
dinou build:bun:compile:mac        # Apple macOS (Apple Silicon)
dinou build:bun:compile:win        # Windows executable (.exe)
```

#### 6. Static Export (GitHub Pages, S3, CDN)

If your application consists purely of static or pre-rendered pages without dynamic server-side computation, you can export 100% static HTML:

```bash
# Generates complete static site in out/
dinou export-static
```

Deploy the generated `out/` directory directly to GitHub Pages, Cloudflare Pages, Amazon S3, Surge, or any static file server (Nginx/Apache).

---

### Production Docker Setup

Here is an optimized, multi-stage production `Dockerfile` for deploying Dinou on any container orchestration platform:

```dockerfile
# Multi-Stage Production Dockerfile for Dinou
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build:node

# Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy minimal production artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.dinou ./.dinou
# (Optional) Only include if your project is ejected:
# COPY --from=builder /app/dinou ./dinou

# Run as non-root user for security
USER node

EXPOSE 3000
CMD ["npm", "run", "start:node"]
```

---

### Managing Production Environment Secrets

In production, never ship a `.env` file inside your Docker container or git repository. Configure secrets directly in your hosting provider's dashboard or CLI:

- **Railway:** Project Settings → Variables.
- **Fly.io:** `fly secrets set DATABASE_URL="..."`.
- **Netlify:** Site Configuration → Environment variables.
- **Cloudflare:** `wrangler secret put MY_SECRET`.
- **Deno Deploy:** Project Settings → Environment Variables (or via `deno deploy`).

---

### Production Pre-Flight Checklist

- **Validate Build Locally:** Run `npm run build:node && npm run start:node` locally to verify clean compilation before pushing to CI/CD.
- **Environment Variables Configured:** Verify database connection strings and third-party API keys are set in your platform dashboard.
- **Static Asset Caching:** Fast browser caching for instant subsequent loads (handled automatically by Dinou for all hashed bundles in `/assets/*`).
- **SSL / HTTPS Active:** Ensure your production domain uses HTTPS (automatic on Netlify, Cloudflare, Railway, and Fly.io; configure via Caddy or Nginx with Let's Encrypt if using a self-hosted VPS).

---

## Eject Dinou

Gain complete ownership over your technology stack. Eject Dinou to unpack the entire dual-engine React 19 compiler, runtime adapters, and server runtime logic directly into your repository.

### Ejecting Dinou: Framework Sovereignty

In most modern web frameworks, the server runtime, bundling logic, and React Server Component compiler are hidden behind opaque `node_modules` dependencies. If you encounter an edge-case bug, need a bespoke compilation transform, or want to deploy to an unsupported infrastructure, you are forced to wait for upstream releases or battle monkey-patching hacks.

Ejecting extracts the entire framework into a `dinou/` folder at the root of your project, making your tech stack 100% configurable and hackable—while continuing to work seamlessly out of the box.

---

### How to Eject (CLI & Scripts)

You can eject Dinou at any point in your project lifecycle with a single command:

```bash
# Using the Dinou CLI directly
npx dinou eject

# Or using an npm script (if defined in your package.json)
npm run eject
```

Ejection is instantaneous and leaves your existing application code in `src/` completely untouched.

---

### What Happens When You Eject?

When you execute `dinou eject`, the framework performs four automated steps:

1. **Framework Source Extraction:** Copies the complete, production-grade Dinou engine into a local `dinou/` folder at the root of your project. This includes the universal HTTP handler, the RSC streaming engine, SSR HTML renderer, all three bundlers (esbuild, Rollup, Webpack), and all platform adapters.
2. **Direct Script Re-routing:** Updates your `package.json` scripts so they point directly to your local files (e.g. `node dinou/node/dev.mjs` and `node dinou/node/build.mjs`) instead of opaque global CLI binary shims.
3. **Automatic Ejected Mode Detection (`isEjected`):** All bundler configurations automatically check for the existence of the local `dinou/` directory. When detected, imports like `import { Link } from "dinou"` resolve directly to your local `./dinou` code rather than `node_modules/dinou`.
4. **Zero Application Disruption:** Your application components, pages, layouts, API routes, and styles in `src/` remain 100% identical. Your app boots and builds immediately with zero regressions.

---

### Anatomy of the Ejected dinou/ Directory

Once ejected, your project root contains a clean, well-organized `dinou/` folder:

```bash
dinou/
├── core/                           # Universal Framework Engine
│   ├── handler.js                  # Web Standards HTTP request pipeline
│   ├── rsc-renderer.js             # React 19 Server Components wire-format serializer
│   ├── render-html.js              # Server-Side Rendering (SSR) HTML streaming
│   ├── get-file-path-and-dynamic-params.js  # File-system router & param extractor
│   ├── slot.js                     # Parallel routes (@slot) & layout resolution
│   ├── storage-adapter.js          # Multi-backend ISR & KV caching abstraction
│   ├── generate-static.js          # SSG pre-generation & static export
│   └── revalidating.js             # Background ISR revalidator & cache purger
│
├── adapters/                       # Deployment Runtime Adapters
│   ├── node.mjs                    # Standalone Node.js HTTP server (Docker, VPS)
│   ├── bun.js                      # High-speed Bun runtime adapter
│   ├── deno.js                     # Multi-region Deno & Deno Deploy (deno-edge) adapter
│   ├── cloudflare.js               # Cloudflare Workers & Pages edge worker
│   └── netlify.js                  # Netlify Functions v2 serverless adapter
│
├── esbuild/                        # esbuild compilation & dev configurations
│   ├── build.mjs                   # Dual-bundle production build pipeline
│   └── build-client.mjs            # Client-side bundle orchestrator
│
├── rollup/                         # Rollup production bundler setup
│   └── rollup.config.js            # Dual-bundle Tree-shaking pipeline
│
├── webpack/                        # Webpack bundler setup
│   └── webpack.config.js           # Enterprise-grade Webpack 5 pipeline
│
└── node/                           # Node.js development & build scripts
    ├── dev.mjs                     # Multi-engine development server & HMR
    └── build.mjs                   # Production bundle compiler
```

> [!TIP]
> **Eject and explore with your AI agent:** Every module inside the `dinou/` directory is clean, standard JavaScript written with native Web Standards. Have your AI coding assistant (like Gemini Antigravity, Cursor, or Claude) explore the architecture, explain execution flows, or implement custom runtime features directly in your repo.

---

### When to Consider Ejecting

Ejection is not required for typical applications; Dinou v7 out of the box provides multi-bundler compilation, edge adapters, and plugin support. However, ejecting is invaluable when you need:

- **Custom Compilers & Assets:** Add support for custom file types, specialized loaders (SVGs, WebAssembly, 3D models), or custom bundler plugins directly into `dinou/esbuild/`, `dinou/rollup/`, or `dinou/webpack/`.
- **Server Logic Control:** Inspect and customize how HTTP requests are handled, add low-level metrics, or modify streaming responses directly in `dinou/core/handler.js`.
- **Run on Any Platform:** Deploy Dinou anywhere—from Electron and Tauri desktop apps to custom AWS Lambda microVMs—by creating a custom runtime adapter in `dinou/adapters/`.
- **Transparent Error Diagnosis:** Stack traces point directly to readable source files in your repo instead of minified `node_modules`. You and your AI agent can inspect the exact code that failed and fix it immediately.

---

### Ejection in the Agentic Era

In the era of autonomous coding agents (such as **Gemini Antigravity**, **Claude Code**, **Cursor**, and **Copilot**), framework ejection transitions from a legacy last resort to a **core architectural advantage**:

- **Breaking the node_modules Boundary:** Autonomous agents only have read/write access within your repository boundaries. In closed frameworks, agents hit a hard wall whenever a requirement involves server internals, bundling pipelines, or runtime flags. Ejecting places your entire stack inside the agent's actionable workspace.
- **Grounded Reasoning, Zero Hallucinations:** Instead of guessing how a proprietary, black-box framework routes requests or serializes state under the hood, your agent reads clean, readable Web Standards source code. Transparent files eliminate LLM hallucinations and enable surgical, confident refactoring.
- **Autonomous End-to-End Problem Solving:** Your AI partner can evolve the framework alongside your application—adapting streaming pipelines, crafting custom caching layers, or writing new runtime adapters on the fly without waiting for upstream releases.

---

### Practical Customization Examples

Here are two common ways teams customize their ejected Dinou framework:

#### 1. Adding Custom Server Middleware & Guards

To intercept incoming traffic, inject custom healthchecks, or authenticate protected routes before waking up React, simply edit `handleRequest` in `dinou/core/handler.js`:

```javascript
// dinou/core/handler.js
export async function handleRequest(request, platformContext = {}) {
  const url = new URL(request.url);

  // 1. Instant zero-compute healthcheck without invoking React
  if (url.pathname === "/healthz") {
    return Response.json({ status: "ok", uptime: process.uptime() });
  }

  // 2. Pre-flight authentication guard before React Server Components run
  if (url.pathname.startsWith("/admin")) {
    const token = request.headers.get("x-admin-token");
    if (!token || token !== process.env.ADMIN_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  // ...continue standard Dinou routing, ISR caching, and RSC/SSR streaming
}
```

#### 2. Extending the Bundler Pipeline

To add a custom esbuild plugin (such as a specialized SVG compiler or asset loader), edit `dinou/esbuild/build.mjs`:

```javascript
// dinou/esbuild/build.mjs
import { myCustomPlugin } from "./plugins/my-plugin.mjs";

// ...after collecting entryPoints:
const buildConfig = getConfigEsbuildProd({
  entryPoints,
  manifest,
  outdir,
});

// Inject your custom plugin into the production build pipeline:
buildConfig.plugins.push(myCustomPlugin());

await esbuild.build(buildConfig);
```

---

### Best Practices for Ejected Projects

- **Commit `dinou/` to Git:** Treat your ejected `dinou/` directory as first-class source code in your repository so your entire team shares identical build and runtime logic.
- **Keep Edits Modular:** When adding custom features, create dedicated files (such as `dinou/core/my-feature.js`) rather than stuffing thousands of lines into single files.
- **Validate Across Bundlers:** If your project uses multiple bundlers, test that your modifications work cleanly in your target bundler (e.g. `npm run build:node:esbuild`).

---

## Complete API Reference

Explore all exports across `dinou`, `dinou/server`, and route lifecycle contracts (`page_functions.ts` & `layout_functions.ts`) with TypeScript signatures, runtime behavior, and practical usage patterns.

### 1. Components (`dinou`)


Declarative universal and client components exported directly from `dinou`.

---


#### `<Link>`

The primary declarative navigation primitive in Dinou. Renders a semantic HTML `<a>` tag enhanced with client-side SPA soft navigation, automatic background prefetching on hover, relative filesystem path resolution, and optional cache bypassing.

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **href** | `DinouRoute \| string` | — | Primary destination URL. Strongly typed with `DinouRoute` for compile-time validation and IDE autocomplete. Supports absolute paths (`/dashboard`), relative paths (`./settings`, `../billing`), query strings, and external URLs. |
| **to** | `DinouRoute \| string` | — | Alias for `href` provided for compatibility with React Router and Remix codebases (evaluated as `href \|\| to`). |
| **prefetch** | `boolean` | `true` | Whether to prefetch the destination RSC payload and code bundle on `onMouseEnter`. Ignored when `fresh={true}` or when targeting external URLs. |
| **fresh** | `boolean` | `false` | Forces an on-demand server roundtrip upon navigation, bypassing any client-side router cache. Automatically skips hover prefetching when set to `true`. |
| **...props** | `AnchorHTMLAttributes` | — | All standard HTML anchor attributes (`className`, `target`, `rel`, `style`, `aria-*`, `onClick`). Custom `onClick` handlers execute first; calling `e.preventDefault()` prevents soft navigation. |

##### Key Features

- **Client-Side Soft Navigation:** Intercepts link clicks to fetch RSC flight payloads in the background, updating views without destroying React client state or triggering full browser reloads.
- **Automatic Hover Prefetching:** Pre-fetches the destination's RSC payload and JavaScript chunk on `onMouseEnter`, ensuring near-instantaneous page transitions upon click.
- **Relative Filesystem Pathing:** Resolves links analogously to filesystem paths based on the current URL pathname:
  - **Absolute (`/`):** Resolves from the application root (e.g. `/dashboard`).
  - **Relative Child (`./`):** Resolves under the current segment (e.g. from `/products`, navigating to `./details` resolves to `/products/details`).
  - **Relative Sibling (`../`):** Navigates up one directory level (e.g. from `/users/settings`, navigating to `../profile` resolves to `/users/profile`).
- **Cache Busting with `fresh`:** Setting `fresh={true}` commands the client router to bypass local memory caches and request an authoritative fresh RSC stream from the server.

##### Usage Patterns

```tsx
// src/components/nav-bar.tsx (Client Component)
"use client";

import { Link, usePathname } from "dinou";

export function NavigationBar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/orders", label: "Orders" },
    { href: "/analytics", label: "Analytics" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <nav className="flex items-center gap-4 p-4 border-b">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

```tsx
// src/components/order-actions.tsx (Client Component)
"use client";

import { Link } from "dinou";

export function OrderQuickActions() {
  return (
    <div className="flex items-center gap-3">
      {/* Normal soft navigation with hover prefetch */}
      <Link href="/orders/archive" className="text-xs text-muted-foreground hover:underline">
        View Archive
      </Link>

      {/* Forced server round-trip: bypasses client RSC cache */}
      <Link
        href="/orders/live"
        fresh
        prefetch={false}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700"
      >
        <span>Live Monitor (Force Fresh)</span>
      </Link>
    </div>
  );
}
```

```tsx
// src/app/dashboard/settings/page.tsx
"use client";

import { Link } from "dinou";

export default function SettingsSubNav() {
  const handleAuditClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Custom logging or analytics before navigation
    console.log("Navigating to security audit");
    // Calling e.preventDefault() here would cancel soft navigation
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Relative Child navigation: resolves to /dashboard/settings/security */}
      <Link href="./security" onClick={handleAuditClick} className="text-sm font-medium">
        Security Settings
      </Link>

      {/* Relative Sibling navigation: resolves to /dashboard/billing */}
      <Link href="../billing" className="text-sm text-muted-foreground">
        Billing & Subscriptions
      </Link>

      {/* External Link: automatically falls back to native browser navigation */}
      <Link
        href="https://status.example.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-500 underline"
      >
        System Status
      </Link>
    </div>
  );
}
```

---


#### `<ClientRedirect>`

A declarative Client Component that triggers an immediate, seamless route replacement upon mounting in the browser. It renders no DOM markup (`null`) and executes a soft router replacement (`replace: true`), ensuring that the redirected URL does not create trap loops in the user's browser back history.

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **to** | `string` | Required | The destination path to navigate to. Supports absolute internal paths (`"/auth/sign-in"`), relative paths (`"./onboarding"`), and query parameters (`"/pricing?plan=pro"`). |

##### Architecture: Declarative Companion & History Replacement

- **Declarative Companion to `redirect()`:** While `redirect()` is the imperative function typically used with early returns (e.g. `return redirect("/login")`), `<ClientRedirect>` is the underlying JSX component returned by `redirect()`. It allows expressing redirections declaratively directly inside your JSX tree.
- **History Replacement (`replace: true`):** When executed, `<ClientRedirect>` performs a `router.replace()` rather than a `push()`. This replaces the current entry in the browser's history stack so users clicking the browser Back button are not bounced forward again in an infinite redirect loop.

##### Usage Patterns

```tsx
// src/components/billing-gate.tsx (Client Component)
"use client";

import { ClientRedirect } from "dinou";

interface BillingGateProps {
  hasActiveSubscription: boolean;
  children: React.ReactNode;
}

export function BillingGate({ hasActiveSubscription, children }: BillingGateProps) {
  // Declarative ternary redirection directly inside JSX
  return hasActiveSubscription ? (
    <>{children}</>
  ) : (
    <ClientRedirect to="/pricing?upgrade=required" />
  );
}
```

```tsx
// src/components/client-guard.tsx (Client Component)
"use client";

import { ClientRedirect } from "dinou";
import { useAuth } from "@/hooks/use-auth";

export function ClientAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading session...</div>;
  }

  if (!user) {
    // Replaces browser history with /sign-in immediately upon mount
    return <ClientRedirect to="/auth/sign-in?from=/dashboard" />;
  }

  return <>{children}</>;
}
```

```tsx
// Pattern A: Imperative function return (Universal: Server & Client)
import { redirect } from "dinou";

export default function PageA({ isAllowed }: { isAllowed: boolean }) {
  if (!isAllowed) {
    return redirect("/unauthorized");
  }
  return <div>Welcome to Page A</div>;
}

// Pattern B: Declarative JSX Component (Client Component)
import { ClientRedirect } from "dinou";

export function PageB({ isAllowed }: { isAllowed: boolean }) {
  if (!isAllowed) {
    return <ClientRedirect to="/unauthorized" />;
  }
  return <div>Welcome to Page B</div>;
}
```


---

### 2. Hooks & Navigation (`dinou`)


Universal and client navigation hooks exported directly from `dinou`.

---


#### `redirect()`

Dinou's universal, polymorphic redirection primitive. It safely interrupts the current execution pipeline and redirects the browser or crawler to the destination path. Rather than relying on rigid browser-only APIs or uncatchable exceptions, `redirect()` automatically adapts its underlying transport mechanism to the active runtime context (Initial SSR, Active Streaming, RSC Flight, Server Functions, or Client Components).

> [!IMPORTANT]
> **Architectural Contract: Always Use the "return redirect(...)" Pattern**
>
> In Dinou, always return the redirection result:
>
> ```typescript
> // ❌ Anti-pattern: Missing return statement
> if (!isAuthenticated) {
>   redirect("/login");
>   // Execution continues! Component attempts to render unauthorized data
> }
>
> // ✅ Correct:
> return redirect("/login");
> // Exits immediately & returns ReactNode (<ClientRedirect />)
> ```
>
> **Why this design?**
> - **Clean TypeScript types:** Satisfies `Promise<ReactNode>` in async Server Components without requiring type assertions or casting.
> - **Safe inside `try/catch`:** Because it is a normal declarative element and not an unhandled exception, your application error boundaries and `catch` blocks won't accidentally intercept or cancel the navigation.
> - **Works inside `<Suspense>`:** When an async component redirects after the HTTP stream has already started (`200 OK`), Dinou safely streams `<ClientRedirect />` down to the browser to navigate upon hydration, avoiding unexpected Error Boundary crashes.

##### The 5 Polymorphic Runtime Execution Modes

1. **Initial SSR & Pre-flight (Headers Unsent) — `HTTP 302 Found`**
   - **Context:** Occurs when called inside `getProps()` in `page_functions.ts`, at the top level of the root `page.tsx` Server Component (before stream initialization), or inside a global plugin hook (`onRequest`).
   - **Behavior:** Because zero HTML bytes have reached the wire (`headersSent === false`), Dinou issues an immediate **HTTP 302 Found** with a `Location` header. **Critical for SEO crawlers and search indexers.**

2. **RSC Flight Navigation — `x-rsc-redirect: /dest`**
   - **Context:** Occurs during client-side SPA route transitions when the client browser requests a React Server Component flight payload via Dinou's internal flight endpoint.
   - **Behavior:** Dinou responds with an `x-rsc-redirect: /dest` header with status `200 OK`. Dinou's client router intercepts this header and transitions to the target route smoothly without destroying client application state.

3. **Server Functions (`"use server"`) — `Soft SPA Navigation`**
   - **Context:** Invoked from browser form actions or event handlers via a dedicated HTTP `POST` request.
   - **Behavior:** The server executes the mutation and returns redirection metadata. The client RPC proxy intercepts it and drives an SPA router transition (`router.replace()`) **without a full page reload**, preserving client state and scroll position.

4. **Deferred Streaming SSR (`<Suspense>`) — `Hydration Fallback`**
   - **Context:** Occurs when an async component wrapped in `<Suspense>` redirects after React has already opened the HTTP connection with status `200 OK` to stream the document shell.
   - **Behavior:** Because an open `200 OK` stream cannot turn into a `302`, Dinou injects `<ClientRedirect />` into the stream and writes an inline script fallback, completing the transition upon browser mount without aborting the connection.

5. **Client Components In-Render (0ms Client Dispatch) — `router.replace() (0ms)`**
   - **Context:** When called inside a Client Component during browser rendering.
   - **Behavior:** No network roundtrip is initiated. Dinou returns `<ClientRedirect />` whose `useEffect` hook immediately invokes `router.replace()` in the client SPA router, updating the view instantaneously.

##### Core Architectural Principles

- **The Equivalence Principle in Server Components:** Calling `redirect()` directly inside a Server Component vs. calling an imported Server Function (e.g. `await requireAuth()`) from that Server Component is **functionally identical**. Because both execute inside the exact same Node.js SSR worker during the same request lifecycle, they share the identical `AsyncLocalStorage` context store and streaming pipeline.
- **Built-in Open-Redirect Protection:** Dinou's runtime includes automatic path sanitization. Target paths must resolve to a valid internal route (starting with a single `/`). Protocol-relative targets (e.g. `//evil.com`) or unauthorized external schemes are sanitized, safeguarding your application against open-redirect phishing vulnerabilities.

##### Runtime Execution Reference Matrix

| Invocation Context | Headers Sent? | HTTP Status / Header | Client Transition | Best Used For |
| :--- | :--- | :--- | :--- | :--- |
| **Root SSR / `page_functions.ts` / Plugin** | <span style="color:#10b981;font-weight:600">No</span> | HTTP 302 Found<br>Location: /url | Full browser navigation (hard reload) | Auth walls, root route guards, SEO canonicals |
| **RSC Flight Navigation** | <span style="color:#10b981;font-weight:600">No</span> | HTTP 200 OK<br>x-rsc-redirect: /url | Soft SPA navigation (zero full reload) | Client-side Link clicks to guarded server routes |
| **Server Functions (`"use server"`)** | <span style="color:#10b981;font-weight:600">No</span> (dedicated POST) | HTTP 200 OK<br>RPC redirect payload | Soft SPA navigation (`router.replace`) | Form mutations, cart checkout, login actions |
| **Deferred SSR (Inside `<Suspense>`)** | <span style="color:#f59e0b;font-weight:600">Yes</span> (200 stream open) | HTTP 200 OK (Chunked)<br>`<ClientRedirect />` | SPA transition upon browser hydration | Late permission checks inside streamed async UI |
| **Client Components (In-render)** | N/A (in-browser) | None (0ms local dispatch) | Immediate `router.replace()` | Declarative client state gates, wizard step navigation |

##### Implementation Examples Across Architectures

```tsx
// 1. React Server Component (src/admin/page.tsx)
import { Suspense } from "dinou";
import { redirect, getContext } from "dinou";

// Root pre-flight check (Headers unsent -> HTTP 302 for crawlers)
export default async function AdminPage() {
  const { req } = getContext();
  if (!req.cookies.auth_token) {
    return redirect("/login");
  }

  return (
    <div>
      <h1>Admin Management</h1>
      <Suspense fallback={<p>Verifying advanced permissions...</p>}>
        <RestrictedMetrics />
      </Suspense>
    </div>
  );
}

// Deferred check inside Suspense (Headers already sent -> <ClientRedirect />)
async function RestrictedMetrics() {
  const hasAccess = await checkSuperAdmin();
  if (!hasAccess) {
    return redirect("/admin/insufficient-permissions");
  }
  return <div>Superadmin Metrics Content</div>;
}
```

```typescript
// 2. Server Function (src/actions/checkout.ts)
"use server";

import { redirect } from "dinou";
import db from "@/lib/db";

export async function processPayment(formData: FormData) {
  const cartId = formData.get("cartId") as string;
  const order = await db.orders.charge(cartId);

  // Dedicated POST mutation:
  // Dinou returns redirect metadata; client executes a smooth SPA transition
  // without losing React state or reloading the entire browser window!
  return redirect(`/orders/${order.id}/confirmed`);
}
```

```typescript
// 3. Route Lifecycle Contract (src/settings/page_functions.ts)
import { redirect, getContext } from "dinou";

export async function getProps() {
  const { req } = getContext();

  // Evaluated before any JSX rendering begins:
  // Short-circuits the pipeline with an immediate HTTP 302 Found
  if (!req.cookies.session_id) {
    return redirect("/login?from=/settings");
  }

  const profile = await fetchUserProfile(req.cookies.session_id);
  return { profile };
}
```

```tsx
// 4. Client Component (src/components/client-guard.tsx)
"use client";

import { redirect } from "dinou";

interface GuardProps {
  isAuthenticated: boolean;
  children: React.ReactNode;
}

export function ClientAuthGuard({ isAuthenticated, children }: GuardProps) {
  if (!isAuthenticated) {
    // Evaluates in browser render: dispatches router.replace() in 0ms!
    return redirect("/auth/sign-in");
  }

  return <>{children}</>;
}
```

```javascript
// 5. Global Plugin / Middleware (dinou.config.mjs)
import { defineConfig } from "dinou/config";

export default defineConfig({
  plugins: [
    {
      name: "legacy-redirects",
      // Universal Web Standards hook (runs on Edge, Workers, Node & Bun)
      async onRequest(request, context) {
        const url = new URL(request.url);

        // Permanent 301 SEO redirection for legacy URLs
        if (url.pathname === "/old-docs" || url.pathname.startsWith("/docs/v1")) {
          return Response.redirect(new URL("/docs", request.url), 301);
        }

        // Temporary 307 redirect preserving HTTP method
        if (url.pathname === "/legacy-api/upload") {
          return Response.redirect(new URL("/api/v2/upload", request.url), 307);
        }
      },
    },
  ],
});
```

##### Choosing the Right Redirection Mechanism

- **In Plugins & Middlewares (`onRequest` in `dinou.config.mjs`):** Return a native Web Standards `Response.redirect(url, status)`. Dinou detects `result instanceof Response` and terminates the request immediately (<1ms) before route matching, file I/O, or React rendering starts.
- **In Server Components & `page_functions.ts`:** Use the universal `return redirect("/path")` helper (which automatically defaults to HTTP 302 on unsent headers). If you require an explicit status code (such as a permanent `301 Moved Permanently` for SEO canonical URLs), obtain the context via `const { res } = getContext();` and invoke `res.redirect(301, "/path")`.

---


#### `useSearchParams()`

A dual-nature hook that provides access to the current URL's query parameters. Works seamlessly in both Server Components and Client Components with specialized performance characteristics for each environment.

##### in Server Components


In Server Components, `useSearchParams()` resolves synchronously from the incoming HTTP request context via `AsyncLocalStorage`. It introduces **zero client bundle overhead** and eliminates props drilling across nested server components.

| Aspect | Behavior in Server Components |
| :--- | :--- |
| **Execution Environment** | Server runtime (Node.js, Bun, Deno, Cloudflare Workers). |
| **Client Bundle Impact** | **0 KB** (stripped entirely from client bundles). |
| **Data Origin** | HTTP request store via `AsyncLocalStorage` (`ctx.req.query`). |
| **Primary Purpose** | **Server Data Loading:** Direct database filtering, pagination offset calculation, search query execution. |
| **Props Drilling** | None. Deeply nested server components read query params directly. |

```tsx
// src/components/product-catalog.tsx (Server Component)
import { useSearchParams } from "dinou";
import { db } from "@/lib/db";

export default async function ProductCatalog() {
  // Resolves query parameters synchronously on the server during SSR or SSG
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? "all";
  const page = Number(searchParams.get("page") ?? "1");

  const products = await db.products.findMany({
    where: category === "all" ? {} : { category },
    skip: (page - 1) * 20,
    take: 20,
  });

  return (
    <div>
      <h2>Category: {category} (Page {page})</h2>
      <ul>
        {products.map((p) => (
          <li key={p.id}>{p.name} - ${p.price}</li>
        ))}
      </ul>
    </div>
  );
}
```

> **SSG vs Dynamic SSR & PPR for Query Parameters:**
> Because static pre-rendering (SSG) compiles HTML at build time when no client query string exists, `searchParams` evaluates with empty parameters during build. If your Server Component requires live query parameters per visitor, configure:
> - **Dynamic SSR:** Set `export const revalidate = 0;` in `page_functions.ts` to render on every request.
> - **Partial Prerendering (PPR):** Set `export const ppr = true;` and wrap the query-dependent component in `<Suspense>` to serve an instant static shell from Edge CDN (0ms TTFB) while streaming dynamic query results.

##### in Client Components


In Client Components, `useSearchParams()` is a reactive hook returning a `URLSearchParams` object. Whenever the URL changes (via `router.push()`, `<Link>`, or browser history), components re-render with updated values while preserving local state.

| Aspect | Behavior in Client Components |
| :--- | :--- |
| **Execution Environment** | Browser runtime (with initial SSR hydration). |
| **Client Bundle Impact** | Included in client JavaScript bundle. |
| **Data Origin** | Live browser URL (`window.location.search`). |
| **Primary Purpose** | **UI Interactivity:** Filter inputs, tab switches, triggering URL navigations. |
| **State Preservation** | Local component state (`useState`, input focus) is preserved during navigation. |

```tsx
// src/components/search-filter.tsx (Client Component)
"use client";

import { useSearchParams, useRouter } from "dinou";

export default function SearchFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";

  const handleSearch = (newQuery: string) => {
    const params = new URLSearchParams(searchParams);
    if (newQuery) {
      params.set("q", newQuery);
    } else {
      params.delete("q");
    }

    // Updates the URL seamlessly without a full page reload
    router.push(`?${params.toString()}`);
  };

  return (
    <div>
      <input
        type="search"
        defaultValue={currentQuery}
        placeholder="Search products..."
        onChange={(e) => handleSearch(e.target.value)}
      />
      <p>Active query: {currentQuery}</p>
    </div>
  );
}
```

> **SSG Hydration Best Practice:**
> If a Client Component renders query-dependent HTML on a statically pre-rendered route (SSG), synchronize query params after mount via `useEffect` (Pattern A) to prevent hydration mismatches, or switch the route to dynamic SSR (`export const revalidate = 0;` in `page_functions.ts`, Pattern B).

---


#### `usePathname()`

A dual-nature hook that provides access to the current URL pathname. Works in both Server Components and Client Components.

##### in Server Components


In Server Components, `usePathname()` resolves synchronously from the active HTTP request context. It adds **0 KB** to the client JavaScript bundle.

| Aspect | Behavior in Server Components |
| :--- | :--- |
| **Execution Environment** | Server runtime (Node.js, Bun, Deno, Cloudflare Workers). |
| **Client Bundle Impact** | **0 KB** (stripped completely from client bundle). |
| **Data Origin** | HTTP request store via `AsyncLocalStorage` (`ctx.req.path`). |
| **Primary Purpose** | **Layout Architecture:** Conditional headers, server breadcrumbs, canonical meta tags. |
| **Static Caching (SSG)** | **100% Deterministic;** path is known at build time per page segment. Zero hydration mismatch risk. |

```tsx
// src/components/server-header.tsx (Server Component)
import { usePathname } from "dinou";

export default async function ServerHeader() {
  const pathname = usePathname();
  const isAdminSection = pathname.startsWith("/admin");

  return (
    <header className="border-b px-6 py-4 flex items-center justify-between">
      <div className="font-bold text-lg">Acme Cloud</div>
      {isAdminSection ? (
        <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">
          Admin Console
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">
          Public Area &bull; {pathname}
        </span>
      )}
    </header>
  );
}
```

##### in Client Components


In Client Components, `usePathname()` is a reactive hook that provides the current browser URL pathname and triggers re-renders on route changes.

```tsx
// src/components/nav-link.tsx (Client Component)
"use client";

import { usePathname, Link } from "dinou";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
}

export function NavLink({ href, children, exact = false }: NavLinkProps) {
  const pathname = usePathname();

  // Exact match for homepage, prefix match for nested sections
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground font-semibold"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
```

---


#### `useRouter()`

The core programmatic navigation hook for Client Components. Provides programmatic methods for navigating, replacing history, soft refreshing server data, and surgically refreshing cache slots.

##### Methods Reference


| Method | Signature | Description |
| :--- | :--- | :--- |
| **push()** | `(href: string, options?: RouterOptions) => Promise<void>` | Pushes a new entry onto the browser history stack and navigates to the destination route. |
| **replace()** | `(href: string, options?: RouterOptions) => Promise<void>` | Replaces the current history entry with the destination URL (avoids back-button trap loops). |
| **refresh()** | `(options?: RefreshOptions) => Promise<void>` | Soft-reloads the active page by re-fetching fresh RSC flight payloads from the server while preserving client state. |
| **refreshSlot()** | `(slotId: string, options?: SlotRefreshOptions) => Promise<void>` | Surgically revalidates an isolated `<DinouCacheSlot>` subtree without re-rendering the surrounding page or layout. |
| **back()** | `() => void` | Navigates back one step in browser history (equivalent to `window.history.back()`). |
| **forward()** | `() => void` | Navigates forward one step in browser history (equivalent to `window.history.forward()`). |

##### Client Cache & Options


| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **fresh** | `boolean` | `false` | When `true`, bypasses the client-side router memory cache and forces an authoritative server fetch. |
| **prefetch** | `boolean` | `true` | Pre-fetches target route RSC payloads into the client cache ahead of navigation. |
| **layout** | `boolean` | `false` | When passed to `router.refresh({ layout: true })`, forces re-fetching and re-rendering of all ancestor layout segments. |
| **replace** | `boolean` | `false` | When passed to `router.push(url, { replace: true })`, executes history replacement instead of pushing. |

> **Soft Reload (`router.refresh()`) vs. Hard Reload (`window.location.reload()`):**
> `router.refresh()` fetches an updated RSC stream directly from the server, preserves React state (`useState`, input focus, open dialogs), and maintains scroll position with zero blank screen flashes.

##### Production Patterns


```tsx
// src/components/create-product-form.tsx (Client Component)
"use client";

import { useTransition, useState } from "react";
import { useRouter } from "dinou";
import { createProductAction } from "@/actions/products";

export function CreateProductForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await createProductAction(formData);
        // Navigate with fresh: true to bypass client cache and display live data
        router.push(`/products/${result.id}`, { fresh: true });
      } catch (err: any) {
        setError(err.message || "Failed to create product");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Product name..." required />
      <button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Product"}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
```

---


#### `refreshSlot()`

Imperative client function enabling surgical on-demand revalidation of isolated `<DinouCacheSlot>` components without re-executing the surrounding page Server Component or resetting client UI state. Can be imported and invoked anywhere in client code, including event handlers, WebSocket listeners, or external state stores.

##### Parameters & Wildcard


| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **slotId** | `string` | Required | The unique `id` matching the target `<DinouCacheSlot id="...">`. Passing **`"*"`** revalidates all mounted cache slots on the current page simultaneously. |
| **options.fresh** | `boolean` | `false` | When `true`, bypasses server storage TTLs, forces immediate backend execution, updates cache storage, and delivers fresh UI. |

##### Targeted Revalidation Architecture


- **Surgical Component Updates:** Unlike full route reloads, `refreshSlot()` communicates directly with the specific mounted `<DinouCacheSlot>` sub-tree. Parent layouts and sibling components are untouched.
- **Client vs. Server Revalidation:** Server functions (`revalidateTag`, `revalidatePath`) purge cached storage records on the backend. `refreshSlot()` actively pulls and updates the live rendered UI in the user's browser session.
- **Why `refreshSlot("*", { fresh: true })` is Unique:** When `router.refresh()` runs, mounted `<DinouCacheSlot>` components continue serving their cached output if their `revalidate` TTL is unexpired. `refreshSlot("*", { fresh: true })` is the only mechanism that commands every slot on the page to bypass storage and re-render live on the server.

##### Production Patterns


```typescript
// src/services/realtime-socket.ts (Pure TypeScript / Non-React)
import { refreshSlot } from "dinou";

const socket = new WebSocket("wss://api.example.com/realtime");

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === "PRICE_UPDATE") {
    // Surgically revalidates only the specific ticker slot in the active page
    refreshSlot(`ticker-${message.symbol.toLowerCase()}`, { fresh: true });
  }

  if (message.type === "NOTIFICATION_RECEIVED") {
    // Updates the unread counter badge slot
    refreshSlot("notifications-badge", { fresh: true });
  }
};
```

```tsx
// src/components/dashboard-toolbar.tsx (Client Component)
"use client";

import { refreshSlot } from "dinou";

export function DashboardToolbar() {
  const handleRefreshAll = () => {
    // "*" instructs Dinou to revalidate every mounted <DinouCacheSlot> across the page
    refreshSlot("*", { fresh: true });
  };

  return (
    <button onClick={handleRefreshAll} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium">
      Refresh All Widgets
    </button>
  );
}
```

---


#### `useNavigationLoading()`

Reactive Client Hook that returns `true` whenever a page navigation, history traversal, or soft router reload is actively in flight, and `false` once the transition completes and the new DOM is painted.

##### Trigger Events & SSR


| Navigation Source | Trigger API | Toggles Loading? | Details |
| :--- | :--- | :--- | :--- |
| **Link Click** | `<Link href="...">` | **Yes** | Active during RSC payload fetch and code chunk download. |
| **Programmatic** | `router.push()` / `replace()` | **Yes** | Active during programmatic SPA navigation transitions. |
| **History Traversal** | Browser Back / Forward | **Yes** | Active during browser popstate history restoration. |
| **Soft Route Reload** | `router.refresh()` | **Yes** | Active while refetching the active route's RSC payload. |
| **Targeted Micro-ISR** | `refreshSlot()` | No | Localized slot revalidations use isolated Suspense boundaries. |
| **Data Streaming** | `<Suspense fallback={...}>` | No | Late-arriving streamed chunks render fallbacks independently. |

##### Non-Blocking Concurrent Transitions


- **Responsive UI:** Navigations execute within React's concurrent `startTransition`. The current screen remains interactive and scrollable while the server computes the destination page.
- **Atomic Screen Replacement:** The existing view is preserved until the server has streamed enough of the new route to render its initial shell. `useNavigationLoading()` flips back to `false` precisely when the new DOM is painted, eliminating blank flashes.

##### Production Indicators


```tsx
// src/components/top-progress-bar.tsx (Client Component)
"use client";

import { useNavigationLoading } from "dinou";

export function TopProgressBar() {
  const isNavigating = useNavigationLoading();

  if (!isNavigating) return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-primary overflow-hidden"
    >
      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse" />
    </div>
  );
}
```


---

### 3. Type-Safe Routing (`dinou`)


Dinou v7 introduces zero-runtime type safety with auto-generated declaration files and seamless IDE autocompletion for routes and parameters.

---


#### `PageProps`

Official TypeScript interface for typing React Page components (`page.tsx`). Takes the route pattern string (constrained by `DinouRoutePattern`) as a generic parameter and automatically infers the strongly typed `params` object.

```tsx
import type { PageProps } from "dinou";

// 1. Single dynamic route: trigger Ctrl + Space inside "" to pick from registered routes
export default function BlogPost({ params }: PageProps<"/blog/[slug]">) {
  // ✅ params.slug is strongly typed as string
  return <h1>Post: {params.slug}</h1>;
}

// 2. Catch-all dynamic route
export function DocsPage({ params }: PageProps<"/docs/[...slug]">) {
  // ✅ params.slug is strongly typed as string[]
  return <h1>Document: {params.slug.join("/")}</h1>;
}
```

---


#### `LayoutProps`

Official TypeScript interface for typing React Layout components (`layout.tsx`). In addition to inferred `params`, it strictly types `children: React.ReactNode`.

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

---


#### `ErrorProps`

Official TypeScript interface for typing React Error Page components (`error.tsx`). In addition to inferred `params`, it strictly types the caught `error: Error`.

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

---

#### PageFunctions & LayoutFunctions


Canonical TypeScript interfaces for typing server lifecycle files (`page_functions.ts` and `layout_functions.ts`). Exported from `dinou` and re-exported from `dinou/server` for developer convenience. Both interfaces accept either a route pattern string directly (e.g. `"/blog/[slug]"`) or a direct parameters dictionary, providing complete compile-time type safety, IDE autocompletion, and index-access typing (e.g. `PageFunctions["revalidate"]`) without boilerplate.

```typescript
import type { PageFunctions, LayoutFunctions } from "dinou";

// 1. Direct route string pattern (automatically infers route parameters)
export const getProps: PageFunctions<
  "/blog/[slug]",
  { postTitle: string }
>["getProps"] = async (params) => {
  return { postTitle: `Article: ${params.slug}` };
};

// 2. Strict index-access typing for layout_functions.ts
export const ppr: LayoutFunctions["ppr"] = true;
export const revalidate: LayoutFunctions["revalidate"] = 3600;
```

---


#### `RouteParams`

A standalone utility type representing the inferred parameters dictionary of a given route pattern. While `PageProps` and `PageFunctions` resolve route strings directly, `RouteParams` is ideal for typing Server Actions, services, or custom helper functions that do not inherit framework props automatically.

| Pattern Segment | Route Example | Inferred `RouteParams<T>` |
| :--- | :--- | :--- |
| **`[id]`** | `/products/[id]` | `{ id: string }` |
| **`[...slug]`** | `/docs/[...slug]` | `{ slug: string[] }` |
| **`[[...slug]]`** | `/shop/[[...slug]]` | `{ slug?: string[] }` |
| **`[[tab]]`** | `/settings/[[tab]]` | `{ tab?: string }` |

```typescript
import type { RouteParams } from "dinou";

// 1. Single dynamic parameter
export async function getAuthorBio(params: RouteParams<"/blog/[slug]">) {
  return fetchBioBySlug(params.slug); // params.slug is string
}

// 2. Catch-all dynamic parameter
export async function getDocsContent(params: RouteParams<"/docs/[...slug]">) {
  return fetchDocsByPath(params.slug.join("/")); // params.slug is string[]
}
```

---

#### DinouRoute


A union type representing all valid destinations in the application. It powers `<Link href>` and `router.push(href)`, automatically validating internal application routes, queries (`?key=val`), hashes (`#section`), relative paths (`./`, `../`), and external URLs (`https://...`).

```tsx
import type { DinouRoute } from "dinou";
import { Link, useRouter } from "dinou";

// 1. Typing custom navigation components
interface NavButtonProps {
  href: DinouRoute;
  label: string;
}

export function NavButton({ href, label }: NavButtonProps) {
  return <Link href={href}>{label}</Link>;
}

// 2. Programmatic navigation with useRouter
export function ActionPanel() {
  const router = useRouter();

  const handleNavigate = (destination: DinouRoute) => {
    router.push(destination);
  };

  return <button onClick={() => handleNavigate("/docs/api-reference")}>API Reference</button>;
}
```

---

#### DinouRoutePattern


A union type representing all registered filesystem folder patterns across your application (e.g. `"/blog/[slug]"`, `"/docs/[...slug]"`). It is used as the generic constraint for `PageProps<T>` and `LayoutProps<T>`, enabling instant IDE autocomplete via `Ctrl + Space` and guaranteeing compliance with TypeScript declaration emit rules (TS4058).

```tsx
import type { DinouRoutePattern, PageProps } from "dinou";

// Creating strongly typed page helper wrappers or metadata generators
export function definePageMeta<T extends DinouRoutePattern>(
  route: T,
  generator: (props: PageProps<T>) => { title: string; description?: string }
) {
  return generator;
}

// ✅ Valid: autocompletes route patterns and infers correct params
export const postMeta = definePageMeta("/blog/[slug]", ({ params }) => {
  return { title: `Reading: ${params.slug}` };
});
```


---

### 4. Server Context & Config (`dinou`)


Universal Web Standards context management and root configuration primitives exported directly from `dinou`.

---

#### getContext()


Synchronously accesses the active HTTP request and response context store from anywhere within a Server Component, Server Function (`"use server"`), or route lifecycle contract (`page_functions.ts`). Powered by Node.js `AsyncLocalStorage`.

##### Request & Response Store


The returned `RequestContextStore` provides:

- **`req` (Incoming Request Store):**
  - `req.cookies`: Parsed incoming HTTP cookie key-value dictionary (e.g. `ctx.req.cookies.session_token`).
  - `req.query`: Parsed URL search parameters dictionary (e.g. `ctx.req.query.tab`).
  - `req.headers`: Normalized HTTP request headers dictionary (e.g. `ctx.req.headers["user-agent"]`).
  - `req.path`: Active URL pathname string (e.g. `"/dashboard/orders"`).
  - `req.method`: Uppercase HTTP request method (`"GET"`, `"POST"`, etc.).
  - `req.env`: Runtime environment variables or platform host bindings (Cloudflare D1, KV, R2).
- **`res` (Outgoing Response Mutator):**
  - `res.cookie(name, value, options?)`: Sets an outgoing HTTP `Set-Cookie` response header.
  - `res.clearCookie(name, options?)`: Expires and removes an HTTP cookie.
  - `res.header(name, value)`: Appends or overrides an outgoing HTTP response header before stream flush.
  - `res.status(statusCode)`: Sets the HTTP status code (defaults to `200 OK`).
  - `res.redirect(status?, url)`: Executes a native HTTP redirect (defaults to `302`).
- **`ctx[customKey]` (Plugin State Sharing):**
  - Any custom data attached to `context` inside a plugin's `onRequest(request, context)` hook (such as `context.user` or `context.session`) is preserved across the request lifecycle and accessible synchronously via `getContext()`.

> **Server-Only Sandbox:**
> Never invoke `getContext()` inside a Client Component running in the browser. In browser environments, Dinou logs an error and returns an empty object. Always read confidential cookies or database records in Server Components or `getProps`, sanitize the data, and pass only safe props to Client Components.

##### Production Patterns


```tsx
// src/app/profile/page.tsx (Server Component)
import { getContext, redirect } from "dinou";
import { db } from "@/lib/db";

export default async function ProfilePage() {
  const ctx = getContext();
  if (!ctx) return null;

  // Read authenticated session cookie securely on the server
  const sessionToken = ctx.req.cookies.auth_session;
  if (!sessionToken) {
    return redirect("/login?from=/profile");
  }

  const clientIp = ctx.req.headers["x-forwarded-for"] || "127.0.0.1";
  const user = await db.users.findByToken(sessionToken);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
      <p className="text-sm text-muted-foreground">Session IP: {clientIp}</p>
    </div>
  );
}
```

```typescript
// src/actions/preferences.ts (Server Function)
"use server";

import { getContext } from "dinou";

export async function updateThemePreference(theme: "light" | "dark" | "system") {
  const ctx = getContext();
  if (!ctx) throw new Error("Context unavailable");

  // Mutate an outgoing HTTP response cookie from the server action
  ctx.res.cookie("preferred_theme", theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return { success: true, theme };
}
```

```tsx
// Retrieving Plugin State in Server Components
// 1. Plugin attaches authenticated user in dinou.config.mjs:
//    context.user = await verifySession(token);

// 2. Server Component retrieves plugin state with zero prop-drilling:
import { getContext } from "dinou";

export default async function DashboardPage() {
  const ctx = getContext();
  const currentUser = ctx?.user;

  return (
    <div>
      <h1>Welcome back, {currentUser?.name || "Guest"}</h1>
      <p>Role: {currentUser?.role || "anonymous"}</p>
    </div>
  );
}
```

---

#### defineConfig()


Type-safe configuration helper providing autocomplete, IntelliSense, and schema validation for your application's root configuration file (`dinou.config.mjs`, `dinou.config.js`, or `dinou.config.ts`).

##### Configuration Schema


| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **reactStrictMode** | `boolean` | `true` | Enables React 19 StrictMode double-rendering in development mode. Helps detect unexpected side effects and ensures strict concurrent rendering compatibility with React Compiler. |
| **ppr** | `boolean` | `false` | Global default for Partial Prerendering. When enabled, static-eligible routes pre-render an instant static HTML shell while streaming dynamic `<Suspense>` holes. Can be overridden per layout or route in `page_functions.ts`. |
| **storage** | `StorageAdapter` | `FileSystemStorage` | Configures the storage backend for ISR HTML pages, RSC flight payloads, and cache slot records. Accepts built-in adapters (`RedisStorage`, `MemoryStorage`) or custom implementations. |
| **plugins** | `DinouPlugin[]` | `[]` | Array of Web Standards lifecycle middleware plugins executed on every incoming HTTP request before route matching or React rendering. |

##### Production Configuration


```javascript
// dinou.config.mjs (Production ESM)
import { defineConfig } from "dinou";
import { RedisStorage } from "dinou/server";
import Redis from "ioredis";

export default defineConfig({
  reactStrictMode: true,
  ppr: false,

  // Distributed multi-region ISR cache storage
  storage: new RedisStorage(
    new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    })
  ),

  // Universal Web Standards request plugins
  plugins: [
    {
      name: "security-headers",
      async onRequest(request, context) {
        // Enforce HTTPS in production environments
        const proto = request.headers.get("x-forwarded-proto");
        if (process.env.NODE_ENV === "production" && proto === "http") {
          const httpsUrl = request.url.replace("http://", "https://");
          return Response.redirect(httpsUrl, 301);
        }
      },
    },
  ],
});
```

---

#### DinouPlugin


TypeScript interface defining middleware plugins for Dinou. Plugins hook into the server request lifecycle using native Web Standards (`Request` and `Response`).

| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| **name** | `string` | Optional | Descriptive plugin identifier used for telemetry, diagnostics, and error reporting in logs. |
| **onRequest** | `(request: Request, context: RequestContextStore) => Promise<Response \| void> \| Response \| void` | Optional | Universal middleware hook executed sequentially on every incoming HTTP request before React rendering. Returning a standard Web `Response` aborts the request immediately (<1ms). Returning `void` continues execution and preserves any custom properties attached to `context` for downstream Server Components. |

##### Lifecycle & Early Exit


- **Early Exit (`Response` Returned):** If `onRequest` returns a `Response` instance (e.g. `Response.redirect()`, `Response.json()`), Dinou terminates the request immediately (<1ms). It completely bypasses React rendering, routing, and database lookups. Ideal for authentication walls, health checks, and bot blocking.
- **Pass-Through & Context Enrichment (`void`):** If `onRequest` returns nothing (or `undefined`), execution proceeds to the React rendering pipeline. Any custom properties attached to `context` (e.g. `context.user = session`) are preserved in `AsyncLocalStorage` and accessible synchronously in Server Components via `getContext()`.

##### Production Plugins


```typescript
// src/plugins/auth-guard.ts (Early Exit Pattern)
import type { DinouPlugin } from "dinou";

export const authGuardPlugin: DinouPlugin = {
  name: "auth-guard",
  async onRequest(request, context) {
    const url = new URL(request.url);

    // Intercept secured API endpoints before React loads
    if (url.pathname.startsWith("/api/admin")) {
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer secret_admin_token")) {
        // Fast-path early exit: terminates request in <1ms
        return Response.json(
          { error: "Forbidden: invalid administrative token" },
          { status: 403, headers: { "Cache-Control": "no-store" } }
        );
      }
    }
  },
};
```

```typescript
// src/plugins/geo-enrichment.ts (Context Enrichment Pattern)
import type { DinouPlugin } from "dinou";

export const geoPlugin: DinouPlugin = {
  name: "geo-enrichment",
  async onRequest(request, context) {
    const country = request.headers.get("cf-ipcountry") || "US";
    const city = request.headers.get("cf-ipcity") || "San Francisco";

    // Enrich request context object with geo metadata
    context.geo = {
      country,
      city,
      isEu: ["DE", "FR", "ES", "IT", "NL"].includes(country),
    };

    // Returns void -> execution proceeds to React rendering.
    // Downstream Server Components read context.geo via getContext()!
  },
};
```


---

### 5. Server Cache & Revalidation (`dinou/server`)


Server-side cache management, on-demand invalidation, and Micro-ISR components exported from `dinou/server`.

---

#### revalidatePage()


Surgically evicts and regenerates the cached artifacts (`index.html` and `page.rsc`) of a single specific route. It leaves shared layout caches (`layout.rsc`), parent routes, and child subroutes completely untouched.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **path** | `string` | Required | The exact route path to revalidate (e.g. `"/blog/first-post"` or `"/products/123"`). Must start with `/`. |

##### Production Patterns

```typescript
// src/actions/update-article.ts (Server Action)
"use server";

import { revalidatePage } from "dinou/server";
import { db } from "@/lib/db";

export async function updateArticle(slug: string, content: string) {
  // 1. Update database record
  await db.articles.update({ where: { slug }, data: { content } });

  // 2. Purge only the article's page.rsc and index.html
  // Leaves parent /blog layout and global navigation cache untouched
  await revalidatePage(`/blog/${slug}`);

  return { success: true };
}
```

---

#### revalidatePath()


Asynchronously invalidates and regenerates the targeted page **and its segment layout** (`layout.rsc`). When invoked with `{ cascade: true }` on a route that defines a layout, it recursively invalidates all child subroutes beneath that route segment.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **path** | `string` | Required | The target route path to revalidate (e.g. `"/docs"` or `"/products"`). |
| **options.cascade** | `boolean` | `false` | When `true` and the targeted route defines a layout (`layout.tsx`), Dinou revalidates that layout and automatically cascades down to all child subroutes inheriting it (e.g. revalidating `/docs` with cascade also purges `/docs/routing`, `/docs/rendering`, etc.). If no layout exists at that segment, it revalidates only the page and skips cascading. |

> **Cascade Invalidation Requires a Segment Layout:**
> The `cascade: true` option only activates if the specified route segment defines an active `layout.tsx`. Cascading in Dinou is fundamentally tied to invalidating a shared ancestor layout payload. If a targeted path does not contain a layout, Dinou revalidates only that single page and skips traversing child subroutes.

##### Production Patterns

```typescript
// src/actions/docs-actions.ts (Cascade Invalidation)
"use server";

import { revalidatePath } from "dinou/server";
import { cms } from "@/lib/cms";

export async function publishDocSection(sectionId: string) {
  // 1. Publish new section in CMS
  await cms.navigation.publish(sectionId);

  // 2. Invalidate /docs layout AND cascade down to all child routes
  // Purges /docs/routing, /docs/rendering, /docs/api-reference, etc.
  // Guarantees all nested pages display the updated sidebar with zero hydration mismatch
  await revalidatePath("/docs", { cascade: true });

  return { success: true };
}
```

---

#### revalidateTag()


Cross-cutting cache invalidation primitive that purges cached artifacts across disparate routes, layouts, or `<DinouCacheSlot>` components sharing the specified cache tag.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **tag** | `string` | Required | Cache tag identifier to purge (e.g. `"products"`, `"inventory"`, or `"user-123"`). Matches tags assigned via `getCacheTags` or the `tag` prop on `<DinouCacheSlot>`. |
| **options.cascade** | `boolean` | `false` | When `true` and the tag is attached to a layout segment (`layout_functions.ts`), Dinou purges the layout and cascades invalidation down to all child pages inheriting that layout. |

##### Tag Resolution Hierarchy

| Scope | Assignment Point | Invalidation Impact | Cascades to Subroutes? |
| :--- | :--- | :--- | :--- |
| **Page Tag** | `page_functions.ts` (`getCacheTags`) | Purges matching `page.rsc` and `index.html`. | No. Isolated strictly to the page segment. |
| **Layout Tag** | `layout_functions.ts` (`getCacheTags`) | Purges matching `layout.rsc`. | Only if `cascade: true` is explicitly set. |
| **Slot Tag** | `<DinouCacheSlot tag="...">` | Purges matching slot cache record in storage. | No. Confined to the isolated component slot. |

##### Golden Rules of Tag Invalidation

1. **Page tags never purge parent or child layouts.** A tag assigned in `page_functions.ts` affects only that specific route's page output.
2. **Layout tags only cascade when targeted.** Invalidate layout tags with `{ cascade: true }` to refresh all pages rendered under a changed shared layout.
3. **Slot tags are surgical.** Tags assigned to `<DinouCacheSlot>` never trigger full page invalidations; they purge only the slot's stored HTML/JSON in storage.

##### Production Patterns

```typescript
// src/actions/inventory.ts (Server Action)
"use server";

import { revalidateTag } from "dinou/server";
import { db } from "@/lib/db";

export async function restockProduct(productId: string, quantity: number) {
  // 1. Update inventory in database
  await db.inventory.increment(productId, quantity);

  // 2. Invalidate all pages and cache slots tagged with this product
  // Purges /products/[id] page, catalog badges, and inventory counter slots
  await revalidateTag(`product-${productId}`);

  // 3. Invalidate global catalog listings
  await revalidateTag("products");

  return { success: true };
}
```

---


#### `<DinouCacheSlot>`

A server-side component primitive enabling independent, localized Micro-ISR caching for sub-trees of React Server Components within a page or layout. Allows high-velocity sections (like stock tickers or notification badges) to have their own cache lifetimes and invalidation tags independent of parent page caching.

##### Props & Micro-ISR


| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **id** | `string` | Optional | Unique identifier for targeted client-side slot refreshing via `refreshSlot(id)` or `router.refreshSlot(id)`. If omitted, Dinou falls back to using the first provided `tag`. |
| **revalidate** | `number` | `false` (Forever) | Time-based TTL in seconds. Automatically refreshes and persists the slot subtree in the background once the timer expires. |
| **tag / tags** | `string \| string[]` | `undefined` | Cache tag or array of tags for server-side on-demand invalidation via `revalidateTag(tag)`. |
| **children** | `ReactNode \| (() => Promise<ReactNode> \| ReactNode)` | Required | The Server Component subtree to isolate, render, and cache independently. |

##### Architecture: Micro-ISR & State Preservation

- **Independent Storage Persistence:** Dinou executes the slot's child components once, caches their rendered output in your storage backend (Redis, Memory, or FileSystem), and serves that cached payload to subsequent visitors. Database queries inside the slot never re-run until its TTL expires or an invalidation is triggered.
- **Client State Preservation:** When a slot refreshes (either via time-based micro-ISR or `refreshSlot`), only that specific subtree updates in the browser DOM. Outer forms, input focus, scroll position, and client React state remain completely undisturbed.

##### Production Slot Patterns


```tsx
// src/components/crypto-ticker-slot.tsx (Server Component)
import { DinouCacheSlot } from "dinou/server";
import { fetchCryptoPrices } from "@/lib/crypto";

export function CryptoTickerSection() {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <h2 className="text-sm font-semibold mb-2">Live Market Watch</h2>
      
      {/* Caches ticker independently for 15 seconds */}
      <DinouCacheSlot id="crypto-ticker" revalidate={15} tag="crypto">
        <LiveCryptoPrices />
      </DinouCacheSlot>
    </div>
  );
}

async function LiveCryptoPrices() {
  const prices = await fetchCryptoPrices();
  return (
    <div className="flex gap-4 font-mono text-xs">
      <span>BTC: ${prices.btc.toLocaleString()}</span>
      <span>ETH: ${prices.eth.toLocaleString()}</span>
      <span>SOL: ${prices.sol.toLocaleString()}</span>
    </div>
  );
}
```

```tsx
// src/components/cart-badge-slot.tsx (Server Component)
import { DinouCacheSlot } from "dinou/server";
import { getContext } from "dinou";
import db from "@/lib/db";

export function CartBadgeSlot() {
  const ctx = getContext();
  const userId = ctx?.req.cookies.user_id || "guest";

  return (
    // Cached until a mutation calls revalidateTag(`cart-${userId}`)
    <DinouCacheSlot
      id="header-cart"
      tag={[`cart-${userId}`, "cart"]}
    >
      <CartCounter userId={userId} />
    </DinouCacheSlot>
  );
}

async function CartCounter({ userId }: { userId: string }) {
  const count = await db.cart.getItemCount(userId);
  return <span className="badge font-bold">{count} items</span>;
}
```


---

### 6. Storage Adapters (`dinou/server`)


Storage abstractions and persistence engines exported from `dinou/server`.

Dinou completely decouples ISR and Micro-ISR caching logic from physical storage media. All pre-rendered HTML, RSC route payloads, segment layouts, and slot fragments are read and written through a unified `StorageAdapter` interface.

- **Physical Decoupling:** Switch between local disk, distributed memory caches, edge KV stores, or custom object storage without modifying application components or data loaders.
- **Companion Metadata:** Every cached entry preserves associated metadata, including generation timestamps (`generatedAt`), assigned cache tags, and ISR revalidation windows.
- **Cluster Sharing:** In multi-instance setups (Kubernetes, Cloud Run, Edge workers), adapters like `RedisStorage` or `CloudflareKVStorage` share generated artifacts globally across all nodes.

---

#### Built-In Adapters


| Adapter Class | Constructor Signature | Mechanism & Serialization | Recommended Environments |
| :--- | :--- | :--- | :--- |
| **FileSystemStorage** | `new FileSystemStorage(baseDir?: string)` | Writes raw HTML/RSC payloads and companion `.meta.json` files directly to local disk. | Local dev, single-node Docker containers, VPS servers (default: `.dinou/dist2`). |
| **RedisStorage** | `new RedisStorage(redisClient: any, prefix?: string)` | Serializes content and metadata together as JSON strings under configurable key prefix (default: `"dinou:cache:"`). | Multi-container Kubernetes clusters, AWS ECS, Google Cloud Run, distributed Node.js. |
| **CloudflareKVStorage** | `new CloudflareKVStorage(kvNamespace: any)` | Leverages Cloudflare KV native metadata attributes via `getWithMetadata()` and `put(..., { metadata })`. | Cloudflare Workers & Pages at global edge scale. |
| **DenoKVStorage** | `new DenoKVStorage(kvInstance?: any)` | Stores atomic key-value records with automatic 16KB payload chunking for large HTML/RSC artifacts. | Deno Deploy & distributed edge runtimes. |
| **MemoryStorage** | `new MemoryStorage()` | Maintains an in-memory JavaScript `Map` storing `{ content, metadata }` tuples in process memory. | Unit testing, ephemeral CI/CD runners, preview sandboxes. |

> **Global Storage Utilities:**
> Dinou exports `getStorageAdapter()` to access the active storage instance anywhere on the server, and `setStorageAdapter(adapter)` to dynamically swap the storage engine during initialization or test suites.

---

#### StorageAdapter Interface


Abstract base class defining the contract for all storage engines in Dinou.

| Method | Signature | Required? | Description |
| :--- | :--- | :--- | :--- |
| **get(key)** | `(key: string) => Promise<{ content: string; metadata?: any } \| null>` | Yes | Retrieves the cached content string and companion metadata. Returns `null` on cache miss. |
| **set(key, content, metadata?)** | `(key: string, content: string, metadata?: any) => Promise<void>` | Yes | Persists the rendered HTML, RSC stream, or slot JSON alongside its companion metadata object. |
| **has(key)** | `(key: string) => Promise<boolean>` | Yes | Fast existence check to verify if a valid cache artifact exists without deserializing full content. |
| **delete(key)** | `(key: string) => Promise<void>` | Yes | Removes the targeted cached artifact and associated metadata files or keys. |
| **keys(prefix?)** | `(prefix?: string) => Promise<string[]> \| string[]` | Optional | Enumerates stored artifact keys. Required for `revalidateTag()` scanning and `revalidatePath({ cascade: true })` child discovery in Edge runtimes. |

---

#### Custom Storage Engine


Configure distributed caching with built-in adapters like `RedisStorage` or extend `StorageAdapter` to implement a custom database or object storage backend.

```javascript
// dinou.config.mjs (Redis Cluster)
import { defineConfig } from "dinou";
import { RedisStorage } from "dinou/server";
import Redis from "ioredis";

// Connect to shared Redis cache (AWS ElastiCache, Upstash, or Redis cluster)
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export default defineConfig({
  // Share ISR pages and <DinouCacheSlot> fragments across all Docker / K8s replicas
  storage: new RedisStorage(redis, "dinou:cache:"),
});
```

```typescript
// src/lib/storage/sqlite-storage.ts (Custom Engine Example)
import { StorageAdapter } from "dinou/server";
import Database from "better-sqlite3";

export class SQLiteStorage extends StorageAdapter {
  private db: Database.Database;

  constructor(dbPath: string = ".dinou/cache.db") {
    super();
    this.db = new Database(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dinou_cache (
        key TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        metadata TEXT
      );
    `);
  }

  async get(key: string) {
    const row = this.db
      .prepare("SELECT content, metadata FROM dinou_cache WHERE key = ?")
      .get(key) as { content: string; metadata: string | null } | undefined;

    if (!row) return null;

    return {
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    };
  }

  async set(key: string, content: string, metadata: any = null): Promise<void> {
    const metaStr = metadata ? JSON.stringify(metadata) : null;
    this.db
      .prepare(
        "INSERT INTO dinou_cache (key, content, metadata) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET content = excluded.content, metadata = excluded.metadata"
      )
      .run(key, content, metaStr);
  }

  async has(key: string): Promise<boolean> {
    const row = this.db.prepare("SELECT 1 FROM dinou_cache WHERE key = ?").get(key);
    return Boolean(row);
  }

  async delete(key: string): Promise<void> {
    this.db.prepare("DELETE FROM dinou_cache WHERE key = ?").run(key);
  }

  async keys(prefix: string = ""): Promise<string[]> {
    const rows = this.db
      .prepare("SELECT key FROM dinou_cache WHERE key LIKE ?")
      .all(`${prefix}%`) as { key: string }[];
    return rows.map((r) => r.key);
  }
}
```

> **What is the Redis Key Prefix?**
> The `prefix` parameter in `new RedisStorage(redis, prefix)` defines the namespace prepended to every key stored in Redis (default: `"dinou:cache:"`). For example, when caching `/catalog`, the actual key in Redis is `dinou:cache:catalog/index.html`. This prevents key collisions when Redis is shared with other application caches.


---

### 7. Route Lifecycles & Config


Dinou strictly decouples UI components from server-side lifecycle contracts. Route lifecycles are declared in parallel `page_functions.ts` (or `layout_functions.ts`) files.

---

#### getProps()


The primary server-side data loader for route segments. Executed exclusively on the server before JSX component rendering begins. Data returned from `getProps()` is passed directly into the corresponding `page.tsx` or `layout.tsx` component as props.

##### Parameters & Execution


| Parameter | Type | Description |
| :--- | :--- | :--- |
| **params** | `Record<string, string \| string[]>` | Inferred dynamic route parameters matching filesystem tokens (e.g. `{ id: "123" }` for `[id]` or `{ slug: ["a", "b"] }` for `[...slug]`). |
| **query** | `Record<string, string \| string[]>` | Parsed incoming HTTP URL search parameters dictionary (e.g. `{ tab: "overview", page: "2" }`). |

```typescript
// src/app/products/[id]/page_functions.ts
import type { PageFunctions } from "dinou";
import { db } from "@/lib/db";

export const getProps: PageFunctions<"/products/[id]">["getProps"] = async (params) => {
  const product = await db.products.findUnique({
    where: { id: params.id },
  });

  return { product };
};
```

```tsx
// src/app/products/[id]/page.tsx (Consuming Loader Props)
interface ProductPageProps {
  product: { id: string; name: string; price: number };
}

export default function ProductPage({ product }: ProductPageProps) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>Price: ${product.price}</p>
    </div>
  );
}
```

---

#### revalidate


Route-level cache lifetime configuration constant in `page_functions.ts` or `layout_functions.ts`. Dictates the Incremental Static Regeneration (ISR) strategy for the segment.

| Value | Strategy | Description |
| :--- | :--- | :--- |
| **`false`** (Default) | **Permanent SSG** | Pre-rendered at build time or upon first request; cached permanently in storage until purged on-demand via `revalidateTag()` or `revalidatePath()`. |
| **`0`** | **Dynamic SSR** | Bypasses storage caches completely; re-executes and streams dynamically on every incoming request. |
| **`number > 0`** | **Time-Based ISR** | Cached in storage for the specified number of seconds. Once the TTL expires, the next visitor triggers background regeneration. |

```typescript
// src/app/blog/[slug]/page_functions.ts
import type { PageFunctions } from "dinou";

// Revalidates this article in the background every 1 hour (3600 seconds)
export const revalidate: PageFunctions["revalidate"] = 3600;
```

---

#### ppr


Route-level Partial Prerendering (PPR) configuration toggle in `page_functions.ts` or `layout_functions.ts`. Enables or disables hybrid static-shell delivery with streaming dynamic Suspense holes for this route segment, overriding the global `ppr` setting in `dinou.config.mjs`.

| Value | Behavior | Description |
| :--- | :--- | :--- |
| **`true`** | **PPR Enabled** | Generates an instant static HTML shell from CDN edge while streaming dynamic `<Suspense>` blocks over the open HTTP connection. |
| **`false`** | **PPR Disabled** | Disables Partial Prerendering for this route branch, falling back to traditional full-page SSG or SSR. |
| **Omitted** | **Inherit** | Inherits PPR configuration from the parent layout or global `dinou.config.mjs`. |

```typescript
// src/app/dashboard/layout_functions.ts
import type { LayoutFunctions } from "dinou";

// Enables Partial Prerendering for the entire /dashboard branch
export const ppr: LayoutFunctions["ppr"] = true;
```

---

#### getCacheTags


Route-level cache tagging contract in `page_functions.ts` or `layout_functions.ts`. Associates semantic cache tags with the generated page or layout artifacts, enabling surgical cross-cutting invalidation via `revalidateTag(tag)`.

```typescript
// src/app/products/[id]/page_functions.ts
import type { PageFunctions } from "dinou";

// Assigns tags based on dynamic route parameters
export const getCacheTags: PageFunctions<"/products/[id]">["getCacheTags"] = (params) => {
  return [
    "products",
    `product-${params.id}`,
  ];
};
```

---

#### getStaticPaths


Build-time static path pre-generation contract for dynamic routes (`[slug]`, `[...slug]`). Defines the set of parameter combinations pre-rendered to static HTML during `dinou build`.

##### Supported Return Signatures

| Return Type | Description | Best Used For |
| :--- | :--- | :--- |
| **`string[]`** | Array of string paths (e.g. `["post-1", "post-2"]`). | Single-segment dynamic routes (`[slug]`). |
| **`Array<Record<string, string>>`** | Array of parameter dictionaries (e.g. `[{ id: "1" }, { id: "2" }]`). | Multi-segment or catch-all routes (`[category]/[slug]`). |
| **`Array<{ params, props? }>`** | Objects containing `params` and optional pre-computed `props`. | High-performance builds: skips redundant database lookups during build. |

```typescript
// src/app/blog/[slug]/page_functions.ts
import type { PageFunctions } from "dinou";
import { db } from "@/lib/db";

export const getStaticPaths: PageFunctions<"/blog/[slug]">["getStaticPaths"] = async () => {
  const posts = await db.posts.findMany({ select: { slug: true } });
  return posts.map((post) => post.slug);
};
```

---

#### allowISG


Defines the fallback policy for dynamic routes when a requested path was **not** pre-generated at build time by `getStaticPaths`.

| Value | Fallback Behavior | Use Case |
| :--- | :--- | :--- |
| **`true`** (Default) | **Incremental Static Generation (ISG):** Dinou generates the missing page on-demand upon first visit, serves the generated HTML, and persists it to the storage adapter for subsequent visitors. | Large catalogs, blogs, user-generated content. |
| **`false`** | **Strict 404:** Immediately returns a clean 404 Not Found HTTP response without invoking `getProps` or rendering the page. | Fixed-path documentation, legal pages, gated routes. |

```typescript
// src/app/docs/[...slug]/page_functions.ts
import type { PageFunctions } from "dinou";

// Only pre-rendered paths are valid; unknown slugs immediately return 404
export const allowISG: PageFunctions["allowISG"] = false;
```

---

#### validateParams()


Route perimeter guard that evaluates incoming dynamic route parameters before pipeline execution. Returning `false` immediately terminates the request with a clean 404 Not Found HTTP response without invoking `getProps` or evaluating downstream components.

- **Pre-Execution Perimeter Veto:** Evaluates dynamic parameters at the route boundary before `getProps` executes. Prevents expensive database queries or server load when requests contain malformed, illegal, or malicious parameter inputs.
- **Sync and Async Evaluation:** Supports both synchronous format assertions (regex pattern checks, numeric boundaries, UUID formats) and asynchronous validations (database lookups, tenant membership verification) returning a Promise resolving to a boolean.
- **Layout Subtree Protection:** Exporting `validateParams` in `layout_functions.ts` validates segment parameters (such as organization slugs) and guards the entire subtree, halting requests before any child layout or nested page executes.

```typescript
// src/app/users/[id]/page_functions.ts (Synchronous Numeric Guard)
import type { PageFunctions } from "dinou";

// Rejects non-numeric parameters immediately (e.g. /users/abc -> 404)
export const validateParams: PageFunctions<"/users/[id]">["validateParams"] = (params) => {
  return /^[0-9]+$/.test(params.id);
};

export const getProps: PageFunctions<"/users/[id]">["getProps"] = async (params) => {
  // params.id is guaranteed to be a valid numeric string here
  return { userId: Number(params.id) };
};
```

```typescript
// src/app/[organization]/layout_functions.ts (Async Subtree Perimeter Guard)
import type { LayoutFunctions } from "dinou";
import { db } from "@/lib/database";

// Asynchronous perimeter guard protecting an entire organization branch
export const validateParams: LayoutFunctions<"/[organization]">["validateParams"] = async (params) => {
  const tenant = await db.organizations.findUnique({
    where: { slug: params.organization },
    select: { active: true },
  });

  return Boolean(tenant?.active);
};
```

---

## Dinou Complete Cheatsheet

`Executive Reference` · `Dinou v7`

At-a-glance high-density desktop reference for file conventions, dynamic route syntax, server lifecycle contracts, client navigation hooks, and architectural decision matrices.

> [!TIP]
> **Need deep-dive signatures and multi-line snippets?**
> This cheatsheet provides concise signatures and decision tables. Full implementations are documented in the [Complete API Reference](#complete-api-reference).

---

### 1. File Conventions Cheatsheet

`Filesystem`

Directories inside `src/app/` directly map to URL paths. Standardized file names define UI leaves, layout shells, and decoupled server contracts.

#### Route Components & Lifecycles

| Filename | Role | Scope | Key Responsibility |
| :--- | :--- | :--- | :--- |
| `page.{tsx,jsx,ts,js}` | Route Page UI | `Universal` | Primary UI component rendered for the route segment. Receives server props returned by `getProps`. |
| `layout.{tsx,jsx,ts,js}` | Layout Shell | `Universal` | Persistent UI wrapper wrapping child segments. Preserves client state across child navigations. |
| `error.{tsx,jsx,ts,js}` | 500 Error Page | `Universal` | Error UI rendered when an unhandled server or client exception occurs within this route subtree. |
| `not_found.{tsx,jsx,ts,js}` | 404 Page | `Universal` | Rendered when a segment does not exist or when `validateParams()` returns `false`. Receives `params` and any server props returned by `getProps` if `page_functions` is present. |
| `page_functions.{ts,js}` | Page Server Lifecycle | `Server Only` | Decoupled server contract for `page.tsx`: `getProps`, `revalidate`, `ppr`, `getStaticPaths`, `getCacheTags`. |
| `layout_functions.{ts,js}` | Layout Server Lifecycle | `Server Only` | Decoupled server contract for `layout.tsx`: independent `getProps` and `ppr` execution. |

> [!NOTE]
> **Hierarchical Bubble-Up:** Dinou bubbles unhandled errors and 404s upward to the closest ancestor handler. A nested `src/app/blog/[slug]/not_found.tsx` intercepts 404s before the root `src/app/not_found.tsx`.

#### Layout Control Flags (Empty Files)

Create these **empty files** (zero bytes, no extension) inside a route directory to modify layout inheritance without writing custom wrapper logic:

| Flag File | Target | Architectural Effect |
| :--- | :--- | :--- |
| `no_layout` | `page.tsx` | Renders the page completely bare, bypassing all parent layouts. Ideal for print templates, popups, or embeddable iframes. |
| `reset_layout` | `layout.tsx` | **Resets the layout stack.** Discards all ancestor layouts; this folder's `layout.tsx` becomes the isolated new Root Layout for this branch. |
| `no_layout_error` | `error.tsx` | Renders the segment's 500 error page without any surrounding layout shells. |
| `no_layout_not_found` | `not_found.tsx` | Renders the segment's 404 not found page without any surrounding layout shells. |

#### Route Escaping (`_prefix`)

Any directory prefixed with an underscore (`_folder`) is completely ignored by the route compiler.

> [!NOTE]
> **When to use Underscore Folders:**
> Standard project folders (e.g. `components/`, `hooks/`, `utils/`) do **NOT** require an underscore prefix; Dinou only treats a folder as a route if it contains a `page.*` file. Use `_` exclusively to quarantine legacy or backup folders containing `page.*` files (e.g., `src/app/_archived-v1/page.tsx`).

---

### 2. Route Syntax & Types

`Type Safety`

Dinou provides zero-runtime type safety by inferring route parameter types directly from folder bracket naming conventions.

#### Route Patterns & Inferred Params

| Folder Pattern | Example URL | Inferred `params` Type | Behavior |
| :--- | :--- | :--- | :--- |
| `/about` | `/about` | `{}` | Static segment. Exactly matches literal path. |
| `/blog/[slug]` | `/blog/hello-world` | `{ slug: string }` | Single required dynamic parameter. |
| `/docs/[...slug]` | `/docs/api/routing` | `{ slug: string[] }` | Catch-all. Matches 1 or more trailing segments. |
| `/shop/[[...slug]]` | `/shop`, `/shop/shoes/nike` | `{ slug?: string[] }` | Optional catch-all. Matches 0 or more trailing segments. |
| `/dash/[[tab]]` | `/dash`, `/dash/billing` | `{ tab?: string }` | Optional single parameter. |
| `/(auth)/login` | `/login` | `{}` | Route group. Organizes files without adding a URL segment. |

#### Type-Safe Routing Helpers (`dinou`)

| Helper Type | TypeScript Signature | Purpose | API Ref |
| :--- | :--- | :--- | :---: |
| `PageProps<T>` | `{ params: RouteParams<T>, searchParams: ... }` | Type signature for `page.tsx` default export component. | [Docs](#pageprops) |
| `LayoutProps<T>` | `{ children: React.ReactNode, params: RouteParams<T> }` | Type signature for `layout.tsx` default export component. | [Docs](#layoutprops) |
| `ErrorProps<T>` | `{ error: Error, params: RouteParams<T> }` | Type signature for `error.tsx` page component. | [Docs](#errorprops) |
| `RouteParams<T>` | Extracted parameter dictionary based on string literal pattern | Typed `params` argument for `getProps`, `getCacheTags`, or `validateParams`. | [Docs](#routeparams) |
| `DinouRoute` | Union of concrete path strings: `"/about" | "/contact" | ...` | Level 1 type safety: powers IDE autocomplete & link validation for `<Link href="...">`. | [Docs](#dinouroute) |
| `DinouRoutePattern` | Union of parameterized patterns: `"/blog/[slug]" | ...` | Level 2 type safety: generic constraint for route contract functions and props. | [Docs](#dinouroutepattern) |

---

### 3. Server Lifecycle Contracts

`Server Only`

Contracts declared in `page_functions.ts` (or `layout_functions.ts`). Executed exclusively on the server, completely decoupled from React render passes.

#### Exported Contracts Table

| Exported Contract | Signature | Default | Execution & Purpose | API Ref |
| :--- | :--- | :--- | :--- | :---: |
| `getProps(params)` | `(params) => Promise<T> | T` | `{}` | Server data loader. Return value is directly passed as props to `page.tsx` or `layout.tsx`. | [Docs](#getprops) |
| `revalidate` | `number | false | (() => ...)` | `false` (SSG) | Cache TTL in seconds. `0` = SSR (dynamic), `>= 1` = ISR, `false` = Static SSG. | [Docs](#revalidate) |
| `ppr` | `boolean | (() => boolean | Promise<boolean>)` | `false` | Enables Partial Prerendering: static shell built at build time, dynamic holes stream via React Suspense. | [Docs](#ppr) |
| `getCacheTags(params)` | `(params) => string[] | Promise<string[]>` | `[]` | Associates cache tags with the route for targeted on-demand invalidation via `revalidateTag(tag)`. | [Docs](#getcachetags) |
| `getStaticPaths()` | `() => StaticPathItem[] | Promise<...>` | `[]` | Pre-generates dynamic parameter combinations during build time for SSG rendering. | [Docs](#getstaticpaths) |
| `allowISG` | `boolean | (() => boolean | Promise<boolean>)` | `true` | When `true`, ungenerated paths render on-demand on first visit. When `false`, ungenerated paths return 404. | [Docs](#allowisg) |
| `validateParams(params)` | `(params) => boolean | Promise<boolean>` | `() => true` | Route parameter gatekeeper. Returning `false` immediately terminates with a 404 before calling `getProps`. | [Docs](#validateparams) |

#### Revalidation Modes (SSR vs ISR vs SSG)

| Export Value | Rendering Mode | Cache Behavior | Ideal Use Case |
| :--- | :--- | :--- | :--- |
| `export const revalidate = 0;` | **Dynamic SSR** | Evaluated fresh on every HTTP request. Never cached in static storage. | User accounts, checkout pages, real-time analytics. |
| `export const revalidate = 60;` | **ISR (Regeneration)** | Served from cache for N seconds. Next visit serves stale cache and triggers background re-generation. | E-commerce product pages, news feeds, search result pages. |
| `export const revalidate = false;` | **Static (SSG)** | Prerendered at build time and cached indefinitely until purged via on-demand invalidation. | Marketing landing pages, documentation, blog posts. |

---

### 4. Client Navigation & Hooks

`dinou`

Declarative navigation components and reactive client hooks for routing state and micro-ISR slot manipulation.

#### Link & Redirection Primitives

| Export | Scope | Signature / Props | Behavior | API Ref |
| :--- | :--- | :--- | :--- | :---: |
| `<Link>` | `Universal` | `href, fresh?, prefetch?, replace?, target?` | SPA navigation component. Prevents full reloads. Set `fresh` to bypass client cache. | [Docs](#link) |
| `<ClientRedirect>` | `Client` | `to: string, replace?: boolean` | Declarative redirect rendered inside component tree during render phase. | [Docs](#clientredirect) |
| `redirect()` | `Universal` | `(path: string, status?: number) => never` | HTTP 307 on server (pre-header flush) or SPA client replace if streaming/client. | [Docs](#redirect) |

#### Router & Navigation Hooks

| Hook / Helper | Scope | Returned Interface | Common Use Case | API Ref |
| :--- | :--- | :--- | :--- | :---: |
| `useRouter()` | `Client` | `{ push, replace, refresh, refreshSlot, back, forward }` | Imperative programmatic navigation, page refreshes, and slot updates. | [Docs](#userouter) |
| `usePathname()` | `Universal` | `string` (e.g. `"/dashboard"`) | Active navigation highlights, breadcrumbs, and layout route branching. | [Docs](#usepathname) |
| `useSearchParams()` | `Universal` | `ReadonlyURLSearchParams` (`.get()`, `.has()`) | Reading query strings (`?q=react&sort=asc`) in Server or Client components. | [Docs](#usesearchparams) |
| `useNavigationLoading()` | `Client` | `boolean` | Global top loading bar or spinner indicators during pending transitions. | [Docs](#usenavigationloading) |
| `refreshSlot(slotId)` | `Client` | `(slotId: string) => Promise<void>` | Re-fetches a specific `<DinouCacheSlot>` without refreshing the rest of the page. | [Docs](#refreshslot) |

---

### 5. Server Primitives & Cache

`dinou & dinou/server`

Server-side context providers, micro-ISR slot primitives, and cluster cache purge APIs.

#### getContext & DinouCacheSlot

| Export | Package | Signature | Purpose & Mechanics | API Ref |
| :--- | :--- | :--- | :--- | :---: |
| `getContext()` | `dinou` | `() => ServerContext | null` | Synchronous HTTP access via AsyncLocalStorage: `req.cookies`, `req.headers`, `res.cookie()`, `res.setHeader()`. | [Docs](#getcontext) |
| `<DinouCacheSlot>` | `dinou/server` | `id, revalidate?, tag?, tags?` | Micro-ISR server component. Caches an independent sub-tree without re-evaluating parent layouts or siblings. | [Docs](#dinoucacheslot) |
| `defineConfig(config)` | `dinou` | `(config: DinouConfig) => DinouConfig` | Type helper for `dinou.config.mjs` (reactStrictMode, ppr, storage, plugins). | [Docs](#defineconfig) |
| `Storage Adapters` | `dinou/server` | `MemoryStorage, RedisStorage` | ISR storage engines for single server or distributed multi-instance clusters. | [Docs](#built-in-adapters) |

#### On-Demand Cache Invalidation (`dinou/server`)

| Function | Target | Signature | Purge Effect | API Ref |
| :--- | :--- | :--- | :--- | :---: |
| `revalidateTag(tag)` | Tags (Pages & Slots) | `(tag: string) => Promise<void>` | Purges all pages and `<DinouCacheSlot>` components tagged with the identifier across the cluster. | [Docs](#revalidatetag) |
| `revalidatePath(path)` | Exact Route Path | `(path: string) => Promise<void>` | Purges the cached HTML and data for a specific pathname and triggers background re-generation. | [Docs](#revalidatepath) |
| `revalidatePage(pattern)` | Route Pattern | `(pattern: string) => Promise<void>` | Purges all compiled cache instances matching a route pattern or page component. | [Docs](#revalidatepage) |

---

### 6. Decision Matrix: When to Use What

`Architectural Guide`

Quick comparative decision tables to help you pick the right primitive for caching, navigation, and state access without trial and error.

#### Cache Invalidation: Which method should you call?

| Method | Caller Environment | Scope of Impact | When to Choose It |
| :--- | :--- | :--- | :--- |
| `revalidateTag(tag)` | Server (Action / Webhook / API) | Multi-page & multi-slot cluster | **Recommended for shared data models:** when updating a database record (e.g., product or article) that appears across lists, detail pages, and sidebar widgets. |
| `revalidatePath(path)` | Server (Action / Webhook / API) | Single static route path | When you know the exact URL that changed and want to purge its HTML/JSON (e.g. `"/pricing"` or `"/about"`). |
| `refreshSlot(slotId)` | Client Component (Browser) | Single targeted slot on current page | **Zero layout re-render:** when an interactive client widget updates (e.g. cart badge counter or mini ticker) without touching the rest of the page. |
| `router.refresh()` | Client Component (Browser) | Entire active page | When a client action needs fresh server props for the whole page without losing client state or scrolling to top. |

#### Redirection: Which redirection strategy should you use?

| Strategy | Context / Location | HTTP / Browser Mechanism | When to Choose It |
| :--- | :--- | :--- | :--- |
| `redirect(path)` in `getProps` | Server (`page_functions.ts`) | Real HTTP 307 Response | **Fastest & cleanest:** Auth guards, permission checks, or missing data redirects executed before any HTML or component rendering begins. |
| `redirect(path)` in Component | Universal (Server or Client) | HTTP 307 if headers unsent; SPA navigation if stream started | When redirection criteria depend on intermediate component tree logic. |
| `<ClientRedirect to="..." />` | Client Component (JSX render) | Client-side router push/replace | Declarative fallback rendering in client tabs, wizard step redirections, or empty states. |
| `router.replace(url)` | Client Event Handler | History replace without entry | Post-submission redirect where clicking browser "Back" should not re-submit the action (e.g. login form, payment checkout). |

#### Route Parameter Access: Where should you read route data?

| Access Pattern | Environment | Return Type | When to Choose It |
| :--- | :--- | :--- | :--- |
| `params` in `page.tsx` (`PageProps`) | Universal (Server or Client) | `RouteParams<Pattern>` | Directly rendering route tokens in the page view (e.g. `<h1>Product #{params.id}</h1>`) with compile-time type validation. |
| `params` in `layout.tsx` (`LayoutProps`) | Universal (Server or Client) | `RouteParams<Pattern>` | Shared navigation headers, dynamic breadcrumbs, or sidebars that wrap child segments for that parameter. |
| `params` in `getProps(params)` | Server Only (`page_functions.ts`) | `RouteParams<Pattern>` | Fetching database records or querying external APIs based on dynamic route IDs before rendering. |
| `params` in `not_found.tsx` (`PageProps`) | Universal (Server or Client) | `RouteParams<Pattern>` | Scoped 404 views displaying the missing item ID (e.g. `Item "{params.slug}" not found`). |
| `params` in `error.tsx` (`ErrorProps`) | Universal (Server or Client) | `RouteParams<Pattern>` | Scoped 500 error pages showing diagnostic context or retry options for that specific resource. |
| `usePathname()` | Universal (Server or Client) | `string` | Navigation bars, sidebars, or layout components that need to detect the current URL path without relying on child props. |
| `useSearchParams()` | Universal (Server or Client) | `ReadonlyURLSearchParams` | Reading query string parameters (filters, pagination, search keywords) in either server or client components. |


---

## Changelog

For a detailed list of changes, enhancements, and bug fixes across versions, see the [CHANGELOG.md](./CHANGELOG.md).

## License

Dinou is licensed under the [MIT License](./LICENSE.md).
