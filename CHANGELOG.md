# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
