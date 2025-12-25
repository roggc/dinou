# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [4.0.0]

### Security

- BREAKING: Server functions no longer receive context as the last argument.
- FEATURE: Added getContext() for cleaner, import-based context access.

### Fixed

- FIX: Fixed BigInt/Map serialization using RSC stream instead of JSON.

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
