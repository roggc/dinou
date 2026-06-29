# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
