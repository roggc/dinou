// dinou/index.d.ts
import { IncomingHttpHeaders } from "http";

// ====================================================================
// REQUEST PROPERTIES TYPES (REQ)
// ====================================================================

/**
 * Represents the query object (URL parameters) passed to the SSR process.
 */
export type Query = Record<string, string | string[] | undefined>;

/**
 * Represents the serialized cookies object.
 */
export type Cookies = Record<string, string>;

/**
 * Represents the serialized headers object.
 */
export type Headers = IncomingHttpHeaders;

// ====================================================================
// RESPONSE PROXY INTERFACE (RES)
// ====================================================================

export type CookieOptions = {
  domain?: string;
  encode?: (val: string) => string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  priority?: "low" | "medium" | "high";
  sameSite?: boolean | "lax" | "strict" | "none";
  secure?: boolean;
  signed?: boolean;
};

/**
 * Interface that simulates Express response functions (res),
 * but which send IPC commands to the main process during SSR.
 */
export interface ResponseProxy {
  /**
   * Sends a command to set a cookie.
   * @param name The name of the cookie.
   * @param value The value of the cookie.
   * @param options Configuration options for the cookie.
   */
  cookie(name: string, value: string, options?: CookieOptions): void;

  /**
   * Sends a command to the main process to clear a cookie.
   * @param name Name of the cookie to clear.
   * @param options Cookie options (e.g., domain, path).
   */
  clearCookie(name: string, options?: CookieOptions): void;

  /**
   * Sends a command to the main process to set an HTTP header.
   * @param name Header name (e.g., 'Content-Type').
   * @param value Header value.
   */
  setHeader(name: string, value: string | ReadonlyArray<string>): void;

  /**
   * Sends commands to the main process to set the status and redirect.
   */
  redirect(status: number, url: string): void;
  redirect(url: string): void;
  status(code: number): void;
}

// ====================================================================
// MAIN CONTEXT STORE INTERFACE
// ====================================================================

/**
 * The complete context object stored in AsyncLocalStorage.
 */
export interface RequestContextStore {
  /**
   * Serialized request data transferred from the main process.
   */
  req: {
    query: Query;
    cookies: Cookies;
    headers: Headers;
    path: string;
    method: "GET" | "POST" | string;
    env?: Record<string, any>;
    ctx?: any;
    [key: string]: any;
  };

  /**
   * The response proxy that allows SSR components to execute
   * response functions in the main process.
   */
  res: ResponseProxy;

  /**
   * Platform host environment (Cloudflare env, D1, KV, R2, etc.).
   */
  env?: Record<string, any>;

  /**
   * Platform execution context (Cloudflare ctx, waitUntil, etc.).
   */
  ctx?: any;

  /**
   * Any custom properties attached to context by plugins (e.g., context.user, context.auth).
   */
  [key: string]: any;
}

// ====================================================================
// DINOU CONFIGURATION & PLUGIN INTERFACES
// ====================================================================

export type NodeMiddleware = (
  req: import("node:http").IncomingMessage,
  res: import("node:http").ServerResponse,
  next: () => void
) => void | Promise<void>;

export interface ServerHookContext {
  /** The underlying Node.js http.Server instance */
  server: import("node:http").Server;
  /** Whether the server is running in development mode */
  isDev: boolean;
  /** Register a raw Node.js middleware (req, res, next) executed before Dinou routes */
  use(middleware: NodeMiddleware): void;
}

export interface DinouPlugin {
  name?: string;
  /**
   * Hook invoked when the Node.js HTTP server is instantiated,
   * allowing plugins to attach WebSockets (Socket.IO, ws), listeners, or raw Node middlewares.
   */
  configureServer?(context: ServerHookContext): Promise<void> | void;

  /**
   * Array of setup/polyfill file paths to be executed at the earliest stage
   * and injected into all bundled engines before any modules are loaded.
   */
  setupFiles?: string[];

  /**
   * Universal Web Standards middleware and webhook handler.
   * Runs on every incoming HTTP request before React rendering.
   * If a Response is returned, Dinou sends it immediately and terminates the request.
   * If nothing is returned, execution continues and any mutations to `context`
   * are preserved and accessible in Server Components and Server Functions via getContext().
   */
  onRequest?(
    request: Request,
    context: RequestContextStore
  ): Promise<Response | void> | Response | void;

  /**
   * Legacy context hook for backwards compatibility.
   */
  onRequestContext?(simReq: any, resBridge: any, context: any): void;
}

export interface DinouConfig {
  /**
   * Enable or disable React StrictMode in development mode.
   * When enabled, React double-invokes render and effect functions in development to catch side-effects.
   * @default true
   */
  reactStrictMode?: boolean;

  /**
   * Global Partial Prerendering (PPR) configuration.
   * When enabled globally, all static-eligible routes generate static shells with Suspense streaming holes.
   * Can also be enabled or disabled per route or layout in page_functions.ts or layout_functions.ts.
   * @default false
   */
  ppr?: boolean;

  /**
   * Global default for Incremental Static Generation (allowISG) on dynamic segments.
   * Can be overridden per segment in page_functions.ts or layout_functions.ts.
   * @default true
   */
  allowISG?: boolean;

  /**
   * Custom storage adapter for ISR / ISG page caching.
   */
  storage?: any;

  /**
   * Array of setup/polyfill file paths to be executed at the earliest stage
   * before any server or client components are imported.
   * If provided, overrides the root `dinou.setup.(mjs|js|ts)` convention.
   */
  setupFiles?: string[];

  /**
   * Array of Dinou plugins.
   */
  plugins?: DinouPlugin[];
}

/**
 * Route Segment Configuration for Partial Prerendering (PPR).
 * In Dinou, export `const ppr = true;` or `export function ppr(): boolean`
 * in your page_functions.ts or layout_functions.ts to enable instant static shell delivery with dynamic Suspense streaming holes.
 */
export type PPRConfig = boolean | (() => boolean | Promise<boolean>);

export type AllowUndefinedStaticPath<TParams> =
  0 extends 1 & TParams
    ? undefined
    : [TParams[keyof TParams]] extends [never]
      ? never
      : {} extends TParams
        ? undefined
        : never;

export type ToStaticPathParamValue<V> =
  [V] extends [never]
    ? never
    : [Exclude<V, undefined>] extends [ReadonlyArray<string>]
      ? string[] | Extract<V, undefined>
      : [Exclude<V, undefined>] extends [string]
        ? string | number | Extract<V, undefined>
        : V;

export type ToStaticPathParams<P> = {
  [K in keyof P]: ToStaticPathParamValue<P[K]>;
};

/**
 * A single static path item returned or defined by `getStaticPaths`.
 * Can be:
 * - A string: e.g. `"alpha"` for dynamic segment `[slug]`
 * - A number: e.g. `1` for dynamic segment `[id]`
 * - A string array: e.g. `["docs", "getting-started"]` for catch-all segment `[...slug]` or `[]` for `[[...slug]]`
 * - `undefined`: when all dynamic segments in the route are optional (e.g. `[[category]]` or `[[...slug]]`)
 * - A parameter object: e.g. `{ slug: "alpha", id: 1 }`
 */
export type StaticPathItem<TParams = Record<string, string | number | string[] | undefined>> =
  | string
  | number
  | string[]
  | TParams
  | AllowUndefinedStaticPath<TParams>;

/**
 * Result array or promise of array for `getStaticPaths`.
 */
export type StaticPathsResult<TParams = Record<string, string | number | string[] | undefined>> =
  | StaticPathItem<TParams>[]
  | Promise<StaticPathItem<TParams>[]>;

export interface RouteSegmentConfig<
  TParams = any,
  TProps = any,
  TStaticPathParams = TParams
> {
  /**
   * Partial Prerendering (PPR) flag.
   * Can be declared as a constant or a function (sync or async) in page_functions or layout_functions.
   * @default false
   */
  ppr?: PPRConfig;

  /**
   * Route caching and revalidation strategy in seconds (s). Single source of truth for page rendering mode.
   * - `0` (or `< 1`): Dynamically rendered on every request (dynamic SSR, bypassing static cache).
   * - `>= 1`: Pre-rendered/cached with Incremental Static Regeneration (ISR) expiring after the specified seconds.
   * - `false` (or omitted): Statically pre-rendered and cached forever until on-demand revalidation via `revalidatePath` or `revalidateTag`.
   *
   * Can be declared as a number, false, or as a sync/async function in `page_functions.ts` or `layout_functions.ts`.
   */
  revalidate?: number | false | (() => number | false | Promise<number | false>);

  /**
   * Cache tags associated with this route segment for on-demand invalidation via `revalidateTag(tag)`.
   * Can be declared as a sync/async function `getCacheTags(params)` or as a constant array `getCacheTags = [...]`.
   */
  getCacheTags?: string[] | ((params?: TParams) => string[] | Promise<string[]>);

  /**
   * Generates static path parameter objects or values for dynamic route segments during build time (SSG).
   * Supports returning:
   * - Array of strings (e.g. `["alpha", "beta"]`)
   * - Array of numbers (e.g. `[1, 2, 3]`)
   * - Array of string arrays for catch-all routes (e.g. `[["docs", "intro"], ["docs", "setup"]]`)
   * - `undefined` entries when all dynamic segments are optional (e.g. `[undefined, "electronics"]`)
   * - Array of parameter objects (e.g. `[{ slug: "alpha" }, { slug: "beta" }]`)
   *
   * Can be declared as a sync or async function, or as a constant array in `page_functions.ts` or `layout_functions.ts`.
   */
  getStaticPaths?:
    | StaticPathItem<TStaticPathParams>[]
    | (() => StaticPathsResult<TStaticPathParams>);

  /**
   * Server-side loader that fetches or calculates props passed directly to the Page or Layout component.
   */
  getProps?: (params?: TParams) => TProps | Promise<TProps>;

  /**
   * Parameter validator hook. If it returns false, Dinou halts rendering and returns 404 Not Found.
   */
  validateParams?: (params?: TParams) => boolean | Promise<boolean>;

  /**
   * Controls whether on-demand Incremental Static Generation (ISG) is allowed for ungenerated paths.
   * @default true
   */
  allowISG?: boolean | (() => boolean | Promise<boolean>);
}

/**
 * Type-safe interface representing the available exports in `page_functions.ts`.
 * Accepts either a route pattern string (e.g. `"/products/[id]"`) or a direct parameters dictionary.
 */
export type PageFunctions<
  TRouteOrParams extends DinouRoutePattern | object = any,
  TProps = any
> = RouteSegmentConfig<
  0 extends 1 & TRouteOrParams
    ? any
    : [TRouteOrParams] extends [DinouRoutePattern]
      ? RouteParams<Extract<TRouteOrParams, DinouRoutePattern>>
      : TRouteOrParams,
  TProps,
  0 extends 1 & TRouteOrParams
    ? any
    : [TRouteOrParams] extends [DinouRoutePattern]
      ? StaticPathParams<Extract<TRouteOrParams, DinouRoutePattern>>
      : ToStaticPathParams<TRouteOrParams>
>;

/**
 * Type-safe interface representing the available exports in `layout_functions.ts`.
 * Accepts either a layout segment pattern string (e.g. `"/[organization]"`, including intermediate layouts without a sibling `page.tsx`)
 * or a direct parameters dictionary.
 */
export type LayoutFunctions<
  TRouteOrParams extends DinouLayoutPattern | object = any,
  TProps = any
> = RouteSegmentConfig<
  0 extends 1 & TRouteOrParams
    ? any
    : [TRouteOrParams] extends [DinouLayoutPattern]
      ? LayoutParams<Extract<TRouteOrParams, DinouLayoutPattern>>
      : TRouteOrParams,
  TProps,
  0 extends 1 & TRouteOrParams
    ? any
    : [TRouteOrParams] extends [DinouLayoutPattern]
      ? StaticPathParams<Extract<TRouteOrParams, DinouLayoutPattern>>
      : ToStaticPathParams<TRouteOrParams>
>;

/**
 * Type-safe configuration helper for dinou.config.ts / dinou.config.js / dinou.config.mjs.
 */
export declare function defineConfig(config: DinouConfig): DinouConfig;

// ====================================================================
// MAIN EXPORTED FUNCTIONS (SERVER SIDE)
// ====================================================================

/**
 * Gets the current request context (req and res proxy) synchronously.
 * It must be called within a Server Function or an SSR component
 * wrapped inside requestStorage.run().
 * * NOTE: If no context is active, this function returns undefined.
 * The consumer must handle the guard clause (e.g., if (!context) return;).
 * @returns {RequestContextStore | undefined} The current context object or undefined if called out of scope.
 */
export declare function getContext(): RequestContextStore | undefined;

/**
 * Opts the enclosing `<Suspense>` boundary out of becoming a Dynamic PPR Hole
 * when wrapping an async Server Component on a PPR route (`ppr = true`).
 *
 * Call `noDynamic()` synchronously at the top of your async Server Component
 * (before its first `await`) so Dinou resolves its promise at build time and
 * bakes the rendered output directly into the Static Shell (`shell.html`).
 */
export declare function noDynamic(): void;

import type { ReactNode } from "react";

// ====================================================================
// NAVIGATION UTILITIES & COMPONENTS
// ====================================================================

/**
 * Props for the ClientRedirect component.
 */
export interface ClientRedirectProps {
  /** The destination URL to navigate to. */
  to: string;
}

/**
 * A Client Component that triggers a client-side navigation (replace) immediately upon mounting.
 * * Usually, you don't need to use this directly; use the `redirect()` helper instead.
 * * @param props - The component props containing the destination.
 */
export declare function ClientRedirect(props: ClientRedirectProps): ReactNode;

/**
 * Universal redirect function for Server Components and Server Functions.
 * * It handles the logic intelligently based on the context:
 * 1. **Server-Side (Hard Navigation):** If headers haven't been sent, it performs a real HTTP 307 redirect (better for SEO and performance).
 * 2. **Client-Side / Streaming (Soft Navigation):** If the response stream has started or we are on the client, it returns a component that triggers a SPA navigation.
 * * @param destination - The path URL to redirect to (e.g., "/login").
 * @returns A React Node that handles the redirection.
 * * @example
 * // In a Server Component
 * export default async function Page() {
 * const user = await getUser();
 * if (!user) {
 * return redirect("/login");
 * }
 * return <div>Welcome {user.name}</div>;
 * }
 */
export declare function redirect(destination: string): ReactNode;

/**
 * Universal hook (works in both Server Components and Client Components) that lets you read the current URL's pathname.
 * On the client, this hook triggers a re-render when the route changes.
 *
 * @returns {string} The current pathname (e.g., "/dashboard") without search parameters.
 * @example
 * const pathname = usePathname();
 * if (pathname === '/active') { ... }
 */
export declare function usePathname(): string;

/**
 * Universal hook (works in both Server Components and Client Components) that lets you read the current URL's search parameters.
 * On the client, this hook triggers a re-render when the route changes.
 *
 * @returns {URLSearchParams} A read-only version of the standard URLSearchParams interface.
 * @example
 * const searchParams = useSearchParams();
 * const page = searchParams.get('page');
 */
export declare function useSearchParams(): URLSearchParams;

// ====================================================================
// SHARED TYPES
// ====================================================================

/**
 * Configuration options for programmatic navigation.
 */
export interface NavigationOptions {
  /**
   * If `true`, the router will ignore the client-side cache for the target URL
   * and force a new request to the server to get fresh data.
   *
   * Useful for navigation after mutations or to highly volatile pages.
   * @default false
   */
  fresh?: boolean;
}

/**
 * A Client Component hook that allows you to programmatically navigate between routes.
 *
 * @returns {object} An object containing navigation methods.
 * @example
 * const router = useRouter();
 *
 * // Standard navigation
 * router.push('/dashboard');
 *
 * // Force fresh data
 * router.push('/settings', { fresh: true });
 *
 * // Go back
 * router.back();
 *
 * // Soft refresh (re-fetch data without full reload)
 * router.refresh();
 */
// ====================================================================
// TYPE-SAFE ROUTING (Level 1 & Level 2 — Hierarchical & Horizontal)
// ====================================================================

export namespace DinouRouter {
  export interface Register {
    // When .dinou/types/routes.d.ts is generated, it augments this interface.
  }
}

/**
 * Union of all valid navigable routes in the application (`page.*`).
 * When typed routes are generated, autocompletes known routes.
 * Falls back to string if not yet generated or in loose mode.
 */
export type DinouRoute = DinouRouter.Register extends { route: infer R extends string }
  ? R
  : string;

/**
 * Utility types to parse received runtime dynamic route parameters from a route string pattern.
 * e.g. ExtractRouteParams<"/blog/[id]"> => { id: string }
 * e.g. ExtractRouteParams<"/docs/[...slug]"> => { slug: string[] }
 * e.g. ExtractRouteParams<"/shop/[[...slug]]"> => { slug: string[] } (normalized to [] at runtime on root path)
 * e.g. ExtractRouteParams<"/item/[[code]]"> => { code?: string }
 */
export type ExtractSegmentParam<Segment extends string> =
  Segment extends `[[...${infer Param}]]`
    ? { [K in Param]: string[] }
    : Segment extends `[[${infer Param}]]`
    ? { [K in Param]?: string }
    : Segment extends `[...${infer Param}]`
    ? { [K in Param]: string[] }
    : Segment extends `[${infer Param}]`
    ? { [K in Param]: string }
    : {};

export type ExtractRouteParams<Path extends string> =
  Path extends `/${infer Rest}`
    ? ExtractRouteParams<Rest>
    : Path extends `${infer Start}/${infer Rest}`
    ? ExtractSegmentParam<Start> & ExtractRouteParams<Rest>
    : ExtractSegmentParam<Path>;

/**
 * Utility types to parse input route parameters (for `<Link params>`, `router.push`, and `getStaticPaths`),
 * where optional catch-all segments `[[...slug]]` remain optional (`{ slug?: string[] }`).
 */
export type ExtractNavigableSegmentParam<Segment extends string> =
  Segment extends `[[...${infer Param}]]`
    ? { [K in Param]?: string[] }
    : Segment extends `[[${infer Param}]]`
    ? { [K in Param]?: string }
    : Segment extends `[...${infer Param}]`
    ? { [K in Param]: string[] }
    : Segment extends `[${infer Param}]`
    ? { [K in Param]: string }
    : {};

export type ExtractNavigableRouteParams<Path extends string> =
  Path extends `/${infer Rest}`
    ? ExtractNavigableRouteParams<Rest>
    : Path extends `${infer Start}/${infer Rest}`
    ? ExtractNavigableSegmentParam<Start> & ExtractNavigableRouteParams<Rest>
    : ExtractNavigableSegmentParam<Path>;

export type SimplifyParams<T> = { [K in keyof T]: T[K] };

export type FallbackRouteParams<Path extends string> =
  [string] extends [Path]
    ? Record<string, string | string[] | undefined>
    : [`/@${string}`] extends [Path]
      ? Record<string, string | string[] | undefined>
      : keyof ExtractRouteParams<Path> extends never
        ? Record<string, never>
        : SimplifyParams<ExtractRouteParams<Path>>;

export type FallbackNavigableParams<Path extends string> =
  [string] extends [Path]
    ? Record<string, string | string[] | undefined>
    : [`/@${string}`] extends [Path]
      ? Record<string, string | string[] | undefined>
      : keyof ExtractNavigableRouteParams<Path> extends never
        ? Record<string, never>
        : SimplifyParams<ExtractNavigableRouteParams<Path>>;

/**
 * Resolved parameter dictionary accepted by `getStaticPaths` object items for a segment pattern `Path`.
 * Keeps optional catch-all segments (`[[...slug]]`) optional and allows `string | number` for single segments.
 */
export type StaticPathParams<Path extends string> =
  [string] extends [Path]
    ? Record<string, string | number | string[] | undefined>
    : [`/@${string}`] extends [Path]
      ? Record<string, string | number | string[] | undefined>
      : Path extends string
        ? DinouRouter.Register extends { navigableParams: infer NP }
          ? CleanRoutePath<Path> extends keyof NP
            ? SimplifyParams<ToStaticPathParams<NP[CleanRoutePath<Path>]>>
            : SimplifyParams<ToStaticPathParams<FallbackNavigableParams<CleanRoutePath<Path>>>>
          : SimplifyParams<ToStaticPathParams<FallbackNavigableParams<CleanRoutePath<Path>>>>
        : never;

export type FormatPatternKeys<K extends string> =
  [K] extends [never]
    ? string
    : K | (K extends `/${infer Rest}` ? (Rest extends "" ? never : Rest) : never);

export type FormatOptionalPatternKeys<K extends string> =
  [K] extends [never]
    ? never
    : K | (K extends `/${infer Rest}` ? (Rest extends "" ? never : Rest) : never);

export type IsUnion<T, U = T> = T extends any ? ([U] extends [T] ? false : true) : never;

export type CleanRoutePath<T extends string> =
  T extends "" ? "/" : T extends `/${string}` ? T : `/${T}`;

/**
 * All known page route patterns in the application (e.g. "/blog/[slug]", "/t-params/[[slug]]").
 * Autocompletes all project page routes when typing PageProps<"..."> or PageFunctions<"...">.
 */
export type DinouRoutePattern = DinouRouter.Register extends { params: infer P }
  ? FormatPatternKeys<Extract<keyof P, string>>
  : string;

/**
 * Registered parallel `@slot` patterns when `.dinou/types/routes.d.ts` is present (`never` if the project has no `@slot` folders).
 */
export type DinouRegisteredSlotPattern = DinouRouter.Register extends { slotParams: infer SP }
  ? FormatOptionalPatternKeys<Extract<keyof SP, string>>
  : DinouRouter.Register extends { params: unknown }
    ? never
    : string;

/**
 * All known parallel `@slot` patterns in the application (e.g. "/dashboard/[org]/@analytics", "/@modal").
 * Autocompletes `@slot` folders when typing SlotProps<"...">.
 */
export type DinouSlotPattern = DinouRouter.Register extends { slotParams: infer SP }
  ? ([Extract<keyof SP, string>] extends [never]
      ? `/@${string}` | `${string}/@${string}`
      : FormatOptionalPatternKeys<Extract<keyof SP, string>>)
  : string;

/**
 * All known layout segment patterns in the application (e.g. "/", "/workspace/[org]"),
 * including intermediate horizontal layouts that have no sibling `page.tsx`.
 */
export type DinouLayoutPattern = DinouRouter.Register extends { layoutParams: infer LP }
  ? FormatPatternKeys<Extract<keyof LP, string>>
  : DinouRoutePattern;

/**
 * All known error boundary segment patterns in the application (`error.tsx`),
 * including page routes, intermediate folders, and parallel `@slot` folders.
 */
export type DinouErrorPattern = DinouRouter.Register extends { errorParams: infer EP }
  ? FormatPatternKeys<Extract<keyof EP, string>>
  : DinouRoutePattern;

/**
 * All known segment patterns valid for `not_found.tsx` boundaries (root, page routes,
 * intermediate `not_found.tsx` folders, and intermediate layout folders), excluding `@slot` folders.
 */
export type DinouNotFoundPattern = DinouRouter.Register extends { params: infer P }
  ? FormatPatternKeys<
      | Extract<keyof P, string>
      | (DinouRouter.Register extends { layoutParams: infer LP }
          ? Extract<keyof LP, string>
          : never)
    >
  : string;

/**
 * Union of all valid horizontal & hierarchical segment patterns (pages, layouts, parallel `@slots`, and error boundaries).
 */
export type DinouSegmentPattern =
  | DinouRoutePattern
  | DinouLayoutPattern
  | DinouRegisteredSlotPattern
  | DinouErrorPattern;

/**
 * Internal helper that resolves segment parameter dictionaries across generated maps
 * (`params`, `layoutParams`, `slotParams`, `errorParams`) with template-literal fallback.
 */
export type LookupSingleSegmentParams<K extends string> =
  DinouRouter.Register extends { params: infer P }
    ? K extends keyof P
      ? P[K]
      : DinouRouter.Register extends { layoutParams: infer LP }
        ? K extends keyof LP
          ? LP[K]
          : DinouRouter.Register extends { slotParams: infer SP }
            ? K extends keyof SP
              ? SP[K]
              : DinouRouter.Register extends { errorParams: infer EP }
                ? K extends keyof EP
                  ? EP[K]
                  : FallbackRouteParams<K>
                : FallbackRouteParams<K>
            : FallbackRouteParams<K>
        : FallbackRouteParams<K>
    : FallbackRouteParams<K>;

export type LookupSegmentParams<T extends string> =
  [string] extends [T]
    ? Record<string, string | string[] | undefined>
    : [`/@${string}`] extends [T]
      ? Record<string, string | string[] | undefined>
      : T extends string
        ? LookupSingleSegmentParams<CleanRoutePath<T>>
        : never;

/**
 * Resolved route parameter types for a route, layout, or parallel slot segment.
 * Prioritizes the generated parameter maps from `.dinou/types/routes.d.ts`,
 * and falls back to template literal extraction.
 */
export type RouteParams<T extends DinouSegmentPattern = DinouRoutePattern> =
  LookupSegmentParams<T>;

/**
 * Resolved cumulative dynamic parameters for a Layout segment (`layout.tsx` / `layout_functions.ts`),
 * including intermediate layouts without a sibling `page.tsx`.
 */
export type LayoutParams<T extends DinouLayoutPattern = DinouLayoutPattern> =
  [string] extends [T]
    ? Record<string, string | string[] | undefined>
    : T extends string
      ? DinouRouter.Register extends { layoutParams: infer LP }
        ? CleanRoutePath<T> extends keyof LP
          ? LP[CleanRoutePath<T>]
          : LookupSegmentParams<T>
        : LookupSegmentParams<T>
      : never;

/**
 * Auto-inferred parallel `@slot` ReactNode props injected into a Layout at segment `T`
 * (e.g. `{ sidebar?: ReactNode; analytics?: ReactNode }`).
 */
export type LayoutSlots<T extends string = string> =
  [T] extends [never]
    ? {}
    : [string] extends [T]
      ? {}
      : true extends IsUnion<CleanRoutePath<T>>
        ? {}
        : DinouRouter.Register extends { layoutSlots: infer LS }
          ? CleanRoutePath<T> extends keyof LS
            ? SimplifyParams<LS[CleanRoutePath<T>]>
            : {}
          : {};

/**
 * Resolved cumulative dynamic parameters for a Parallel `@slot` page (`@slot/page.tsx`).
 */
export type SlotParams<T extends DinouSlotPattern = DinouSlotPattern> =
  [string] extends [T]
    ? Record<string, string | string[] | undefined>
    : [`/@${string}`] extends [T]
      ? Record<string, string | string[] | undefined>
      : T extends string
        ? DinouRouter.Register extends { slotParams: infer SP }
          ? CleanRoutePath<T> extends keyof SP
            ? SP[CleanRoutePath<T>]
            : LookupSegmentParams<T>
          : LookupSegmentParams<T>
        : never;

/**
 * Resolved cumulative dynamic parameters for an Error boundary (`error.tsx`),
 * including intermediate directory boundaries and `@slot/error.tsx`.
 */
export type ErrorParams<T extends DinouErrorPattern = DinouErrorPattern> =
  [string] extends [T]
    ? Record<string, string | string[] | undefined>
    : T extends string
      ? DinouRouter.Register extends { errorParams: infer EP }
        ? CleanRoutePath<T> extends keyof EP
          ? EP[CleanRoutePath<T>]
          : LookupSegmentParams<T>
        : LookupSegmentParams<T>
      : never;

/**
 * Props for Dinou Page components (`page.tsx`, `not_found.tsx`, or `@slot/page.tsx`).
 * Optionally accepts a second type argument `TProps` for custom props returned by `page_functions.ts` (`getProps`).
 *
 * @example
 * export default function Page({ params }: PageProps<"/blog/[id]">) {
 *   return <h1>Post {params.id}</h1>;
 * }
 */
export type PageProps<
  T extends DinouRoutePattern | DinouRegisteredSlotPattern = DinouRoutePattern,
  TProps extends object = {}
> = SimplifyParams<
  {
    params: RouteParams<T>;
  } & TProps
>;

/**
 * Props for Dinou Parallel Slot Page components (`@slot/page.tsx`).
 *
 * @example
 * export default function AnalyticsSlot({ params }: SlotProps<"/workspace/[org]/@analytics">) {
 *   return <aside>Org: {params.org}</aside>;
 * }
 */
export interface SlotProps<T extends DinouSlotPattern = DinouSlotPattern> {
  params: SlotParams<T>;
}

/**
 * Props for Dinou Layout components (`layout.tsx`), including intermediate layouts without a sibling `page.tsx`.
 * Automatically includes any sibling parallel `@slot` props (`ReactNode`) defined at that segment,
 * and optionally accepts a second type argument `TProps` for custom props returned by `layout_functions.ts` (`getProps`).
 *
 * @example
 * export default function WorkspaceLayout({ children, params, sidebar }: LayoutProps<"/workspace/[org]">) {
 *   return <div>{sidebar}<main>{children}</main></div>;
 * }
 */
export type LayoutProps<
  T extends DinouLayoutPattern = DinouLayoutPattern,
  TProps extends object = {}
> = SimplifyParams<
  {
    children: ReactNode;
    params: LayoutParams<T>;
  } & LayoutSlots<T> &
    TProps
>;

/**
 * Props for Dinou Error Page components (`error.tsx`), including intermediate and `@slot/error.tsx` boundaries.
 *
 * @example
 * export default function ErrorPage({ error, params }: ErrorProps<"/blog/[id]">) {
 *   return <h1>Error loading {params.id}: {error.message}</h1>;
 * }
 */
export interface ErrorProps<T extends DinouErrorPattern = DinouErrorPattern> {
  error: Error;
  params: ErrorParams<T>;
}

/**
 * Props for Dinou Not-Found Page components (`not_found.tsx`), including root, leaf,
 * and intermediate directory 404 boundaries (with or without a sibling `page.tsx`).
 * Optionally accepts a second type argument `TProps` for custom props returned by a sibling `page_functions.ts` (`getProps`).
 *
 * @example
 * export default function WorkspaceNotFound({ params }: NotFoundProps<"/workspace/[org]">) {
 *   return <h1>Nothing found in {params.org}</h1>;
 * }
 */
export type NotFoundProps<
  T extends DinouNotFoundPattern = DinouNotFoundPattern,
  TProps extends object = {}
> = SimplifyParams<
  {
    params: RouteParams<T>;
  } & TProps
>;

// ====================================================================
// DYNAMIC ROUTE PATTERN, STRICT RELATIVE (`from`) & PARAMS TYPES
// ====================================================================

export type ToLinkInputParamValue<V> =
  [V] extends [never]
    ? never
    : [Exclude<V, undefined>] extends [ReadonlyArray<string>]
      ? ReadonlyArray<string | number> | Extract<V, undefined>
      : [Exclude<V, undefined>] extends [string]
        ? string | number | Extract<V, undefined>
        : V;

export type ToLinkInputParams<P> = {
  [K in keyof P]: ToLinkInputParamValue<P[K]>;
};

export type DinouNavigableRoutePatternMap =
  DinouRouter.Register extends { navigableParams: infer NP }
    ? NP
    : DinouRouter.Register extends { params: infer P }
      ? P
      : never;

export type DinouNavigableRouteKey =
  [DinouNavigableRoutePatternMap] extends [never]
    ? never
    : Extract<keyof DinouNavigableRoutePatternMap, string>;

export type DinouDynamicRoutePattern =
  [DinouNavigableRoutePatternMap] extends [never]
    ? never
    : Extract<DinouNavigableRouteKey, `${string}[${string}]${string}`>;

export type DinouDynamicRouteWithSuffix =
  | DinouDynamicRoutePattern
  | ((
      | `${DinouDynamicRoutePattern}?${string}`
      | `${DinouDynamicRoutePattern}#${string}`
    ) & Record<never, never>);

/**
 * Union of all valid non-relative targets accepted by `<Link>`, `router.push()`, and `router.replace()`
 * when `from` is omitted. Combines concrete/interpolated `DinouRoute` URLs with exact dynamic route patterns
 * (e.g. `"/blog/[slug]"`) so IDEs surface dynamic routes in `Ctrl + Space` autocomplete
 * while requiring a typed `params` object whenever a `[param]` pattern is selected.
 */
export type DinouLinkTarget = DinouRoute | DinouDynamicRouteWithSuffix;

export type BuildDirectoryPrefixes<
  Segs extends string[],
  Acc extends string = ""
> = Segs extends [infer Head extends string, ...infer Tail extends string[]]
  ? `${Acc}/${Head}` | BuildDirectoryPrefixes<Tail, `${Acc}/${Head}`>
  : "/";

export type ExtractParentDirectories<Path extends string> =
  Path extends any ? BuildDirectoryPrefixes<SplitRouteSegments<Path>> : never;

export type PeelOptionalRouteSegments<Path extends string> =
  | Path
  | (Path extends `${infer Prefix}/[[${string}]]`
      ? PeelOptionalRouteSegments<Prefix extends "" ? "/" : Prefix>
      : never);

export type DinouEffectiveRoutePattern =
  PeelOptionalRouteSegments<DinouNavigableRouteKey>;

export type DinouFromSlashRoute =
  | DinouNavigableRouteKey
  | (DinouRouter.Register extends { layoutParams: infer LP }
      ? Extract<keyof LP, string>
      : never)
  | (DinouRouter.Register extends { layoutSlots: infer LS }
      ? Extract<keyof LS, string>
      : never)
  | (DinouRouter.Register extends { errorParams: infer EP }
      ? Exclude<Extract<keyof EP, string>, `${string}/@${string}`>
      : never)
  | ExtractParentDirectories<DinouNavigableRouteKey>;

/**
 * Valid origin directory patterns accepted by the `from` prop on `<Link>` and `{ from }` option on `useRouter()`.
 * Autocompletes leading-slash route/directory patterns (e.g. `"/t-slots/[slug]/contact"`) while also accepting
 * non-leading-slash equivalents (e.g. `"t-slots/[slug]/contact"`).
 */
export type DinouFromRoute =
  [DinouNavigableRoutePatternMap] extends [never]
    ? string
    : | DinouFromSlashRoute
      | ((DinouFromSlashRoute extends `/${infer Rest}`
          ? Rest extends ""
            ? never
            : Rest
          : never) & Record<never, never>);

export type SplitRouteSegments<Path extends string> =
  Path extends "/" | ""
    ? []
    : Path extends `/${infer Rest}`
      ? SplitRouteSegments<Rest>
      : Path extends `${infer Head}/${infer Tail}`
        ? [Head, ...SplitRouteSegments<Tail>]
        : [Path];

export type StripCommonPrefix<
  FromSegs extends string[],
  TargetSegs extends string[]
> = FromSegs extends [infer FHead extends string, ...infer FTail extends string[]]
  ? TargetSegs extends [FHead, ...infer TTail extends string[]]
    ? StripCommonPrefix<FTail, TTail>
    : [FromSegs, TargetSegs]
  : [FromSegs, TargetSegs];

export type HasVariableLengthSegment<Segs extends string[]> =
  Segs extends [infer Head extends string, ...infer Tail extends string[]]
    ? Head extends `[...${string}]` | `[[${string}]]`
      ? true
      : HasVariableLengthSegment<Tail>
    : false;

export type HasDynamicSegment<Segs extends string[]> =
  Segs extends [infer Head extends string, ...infer Tail extends string[]]
    ? Head extends `[${string}]`
      ? true
      : HasDynamicSegment<Tail>
    : false;

export type ToDotDotSegments<Segs extends string[]> =
  Segs extends [string, ...infer Tail extends string[]]
    ? ["..", ...ToDotDotSegments<Tail>]
    : [];

export type JoinSlash<Segs extends string[]> =
  Segs extends []
    ? ""
    : Segs extends [infer Only extends string]
      ? Only
      : Segs extends [infer Head extends string, ...infer Tail extends string[]]
        ? `${Head}/${JoinSlash<Tail>}`
        : "";

export type SegmentToTemplate<Seg extends string> =
  Seg extends `[[...${string}]]`
    ? `${string}`
    : Seg extends `[[${string}]]`
      ? `${string | number}`
      : Seg extends `[...${string}]`
        ? `${string}`
        : Seg extends `[${string}]`
          ? `${string | number}`
          : Seg;

export type MapSegmentsToTemplate<Segs extends string[]> =
  Segs extends [infer Head extends string, ...infer Tail extends string[]]
    ? [SegmentToTemplate<Head>, ...MapSegmentsToTemplate<Tail>]
    : [];

export type SharesFirstSegment<
  FromSegs extends string[],
  TargetSegs extends string[]
> = FromSegs extends [infer FH extends string, ...string[]]
  ? TargetSegs extends [FH, ...string[]]
    ? true
    : false
  : true;

export type ComputeRelativeCompletionSingle<
  FromSegs extends string[],
  TargetSegs extends string[]
> = StripCommonPrefix<FromSegs, TargetSegs> extends [
  infer RemFrom extends string[],
  infer RemTarget extends string[]
]
  ? RemFrom extends []
    ? RemTarget extends []
      ? "."
      : `${JoinSlash<RemTarget>}` | `./${JoinSlash<RemTarget>}`
    : HasVariableLengthSegment<RemFrom> extends true
      ? never
      : RemTarget extends []
        ? JoinSlash<ToDotDotSegments<RemFrom>>
        : SharesFirstSegment<FromSegs, TargetSegs> extends true
          ? JoinSlash<[...ToDotDotSegments<RemFrom>, ...RemTarget]>
          : never
  : never;

export type ComputeRelativeAllPatternsSingle<
  FromSegs extends string[],
  TargetSegs extends string[]
> = StripCommonPrefix<FromSegs, TargetSegs> extends [
  infer RemFrom extends string[],
  infer RemTarget extends string[]
]
  ? RemFrom extends []
    ? RemTarget extends []
      ? "." | "./"
      : `${JoinSlash<RemTarget>}` | `./${JoinSlash<RemTarget>}`
    : HasVariableLengthSegment<RemFrom> extends true
      ? never
      : JoinSlash<[...ToDotDotSegments<RemFrom>, ...RemTarget]>
  : never;

export type ComputeRelativeTemplateSingle<
  FromSegs extends string[],
  TargetSegs extends string[]
> = StripCommonPrefix<FromSegs, TargetSegs> extends [
  infer RemFrom extends string[],
  infer RemTarget extends string[]
]
  ? HasDynamicSegment<RemTarget> extends false
    ? never
    : RemFrom extends []
      ? | JoinSlash<MapSegmentsToTemplate<RemTarget>>
        | `./${JoinSlash<MapSegmentsToTemplate<RemTarget>>}`
      : HasVariableLengthSegment<RemFrom> extends true
        ? never
        : JoinSlash<[...ToDotDotSegments<RemFrom>, ...MapSegmentsToTemplate<RemTarget>]>
  : never;

export type DistributeRelativeCompletions<
  FromPath extends string,
  Targets extends string
> = Targets extends any
  ? ComputeRelativeCompletionSingle<
      SplitRouteSegments<FromPath>,
      SplitRouteSegments<Targets>
    >
  : never;

export type DistributeAllRelativePatterns<
  FromPath extends string,
  Targets extends string
> = Targets extends any
  ? ComputeRelativeAllPatternsSingle<
      SplitRouteSegments<FromPath>,
      SplitRouteSegments<Targets>
    >
  : never;

export type DistributeRelativeTemplates<
  FromPath extends string,
  Targets extends string
> = Targets extends any
  ? ComputeRelativeTemplateSingle<
      SplitRouteSegments<FromPath>,
      SplitRouteSegments<Targets>
    >
  : never;

export type DinouRelativeDynamicPattern<TFrom extends string> = Extract<
  DistributeAllRelativePatterns<CleanRoutePath<TFrom>, DinouEffectiveRoutePattern>,
  `${string}[${string}]${string}`
>;

/**
 * Valid relative navigation targets from origin `TFrom` (supporting both bare `"sub"` and `"./sub"`,
 * as well as `".."` / `"../sibling"`, query/hash suffixes, and dynamic relative segments).
 */
export type DinouRelativeLinkTarget<TFrom extends string> =
  [DinouNavigableRoutePatternMap] extends [never]
    ? string
    : [string] extends [TFrom]
      ? string
      : | DistributeRelativeCompletions<CleanRoutePath<TFrom>, DinouEffectiveRoutePattern>
        | ((
            | Exclude<
                DistributeAllRelativePatterns<CleanRoutePath<TFrom>, DinouEffectiveRoutePattern>,
                DistributeRelativeCompletions<CleanRoutePath<TFrom>, DinouEffectiveRoutePattern>
              >
            | DistributeRelativeTemplates<CleanRoutePath<TFrom>, DinouEffectiveRoutePattern>
            | `${
                | DistributeAllRelativePatterns<CleanRoutePath<TFrom>, DinouEffectiveRoutePattern>
                | DistributeRelativeTemplates<CleanRoutePath<TFrom>, DinouEffectiveRoutePattern>
              }?${string}`
            | `${
                | DistributeAllRelativePatterns<CleanRoutePath<TFrom>, DinouEffectiveRoutePattern>
                | DistributeRelativeTemplates<CleanRoutePath<TFrom>, DinouEffectiveRoutePattern>
              }#${string}`
          ) & Record<never, never>);

export type DinouLinkTargetForFrom<TFrom extends string | undefined> =
  [TFrom] extends [undefined]
    ? DinouLinkTarget
    : DinouRelativeLinkTarget<Extract<TFrom, string>>;

/**
 * Unified target union for route-contextual `<Link>` and `useRouter()` imported from `"./dinou"`.
 * Combines strictly validated relative paths from `TFrom` (`"sub"`, `"./sub"`, `"../..."`)
 * with all valid absolute static routes, dynamic route patterns, queries, hashes, and external URLs.
 */
export type DinouScopedLinkTarget<TFrom extends string> =
  | DinouRelativeLinkTarget<TFrom>
  | DinouLinkTarget;

export type ScopedLinkTargetForFrom<
  TDefaultFrom extends string,
  TFrom extends DinouFromRoute | undefined
> =
  [TFrom] extends [undefined]
    ? DinouScopedLinkTarget<TDefaultFrom>
    : DinouLinkTargetForFrom<TFrom>;

export type StripUrlSuffix<T extends string> =
  T extends `${infer Base}?${string}`
    ? StripUrlSuffix<Base>
    : T extends `${infer Base}#${string}`
      ? StripUrlSuffix<Base>
      : T;

export type IsExternalLinkHref<T extends string> =
  T extends
    | `http://${string}`
    | `https://${string}`
    | `//${string}`
    | `mailto:${string}`
    | `tel:${string}`
    ? true
    : false;

export type IsInternalBracketPattern<T extends string> =
  IsExternalLinkHref<T> extends true
    ? false
    : StripUrlSuffix<T> extends `${string}[${string}]${string}`
      ? true
      : false;

export type ValidatedLinkHref<THref extends string> =
  [string] extends [THref]
    ? THref
    : DinouRouter.Register extends { route: unknown }
      ? THref extends any
        ? IsInternalBracketPattern<THref> extends true
          ? StripUrlSuffix<THref> extends DinouDynamicRoutePattern
            ? THref
            : never
          : THref
        : never
      : THref;

export type HasInvalidBracketPatternForFrom<
  TFrom extends string | undefined,
  THref extends string
> =
  [string] extends [THref]
    ? never
    : DinouRouter.Register extends { route: unknown }
      ? THref extends any
        ? IsInternalBracketPattern<THref> extends true
          ? [TFrom] extends [undefined]
            ? StripUrlSuffix<THref> extends DinouDynamicRoutePattern
              ? never
              : true
            : [string] extends [Extract<TFrom, string>]
              ? never
              : StripUrlSuffix<THref> extends `/${string}`
                ? StripUrlSuffix<THref> extends DinouDynamicRoutePattern
                  ? never
                  : true
                : StripUrlSuffix<THref> extends DinouRelativeDynamicPattern<Extract<TFrom, string>>
                  ? never
                  : true
          : never
        : never
      : never;

export type HasInvalidBracketPattern<THref extends string> =
  HasInvalidBracketPatternForFrom<undefined, THref>;

export type HasBracketPattern<THref extends string> =
  [string] extends [THref]
    ? never
    : THref extends any
      ? IsInternalBracketPattern<THref> extends true
        ? true
        : never
      : never;

export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void
    ? I
    : never;

export type ResolveSingleLinkParams<Path extends string> =
  [DinouNavigableRoutePatternMap] extends [never]
    ? SimplifyParams<ToLinkInputParams<FallbackNavigableParams<CleanRoutePath<Path>>>>
    : CleanRoutePath<Path> extends keyof DinouNavigableRoutePatternMap
      ? SimplifyParams<ToLinkInputParams<DinouNavigableRoutePatternMap[CleanRoutePath<Path>]>>
      : SimplifyParams<ToLinkInputParams<FallbackNavigableParams<CleanRoutePath<Path>>>>;

export type ResolveLinkParams<THref extends string> = SimplifyParams<
  UnionToIntersection<
    THref extends any
      ? IsInternalBracketPattern<THref> extends true
        ? ResolveSingleLinkParams<StripUrlSuffix<THref>>
        : {}
      : never
  >
>;

export type LinkParamsPropsForFrom<
  TFrom extends string | undefined,
  THref extends string
> =
  [HasInvalidBracketPatternForFrom<TFrom, THref>] extends [never]
    ? [HasBracketPattern<THref>] extends [never]
      ? { params?: never }
      : {} extends ResolveLinkParams<THref>
        ? { params?: ResolveLinkParams<THref> }
        : { params: ResolveLinkParams<THref> }
    : { params: never };

export type LinkParamsProps<THref extends string> =
  LinkParamsPropsForFrom<undefined, THref>;

export type RouterNavigationArgs<THref extends string> =
  [HasInvalidBracketPattern<THref>] extends [never]
    ? [HasBracketPattern<THref>] extends [never]
      ? [options?: NavigationOptions & { from?: never; params?: never }]
      : {} extends ResolveLinkParams<THref>
        ? [options?: NavigationOptions & { from?: never; params?: ResolveLinkParams<THref> }]
        : [options: NavigationOptions & { from?: never; params: ResolveLinkParams<THref> }]
    : [options: never];

export type RouterRelativeNavigationOptions<
  TFrom extends DinouFromRoute,
  THref extends string
> =
  [HasInvalidBracketPatternForFrom<TFrom, THref>] extends [never]
    ? [HasBracketPattern<THref>] extends [never]
      ? NavigationOptions & { from: TFrom; params?: never }
      : {} extends ResolveLinkParams<THref>
        ? NavigationOptions & { from: TFrom; params?: ResolveLinkParams<THref> }
        : NavigationOptions & { from: TFrom; params: ResolveLinkParams<THref> }
    : never;

export interface DinouRouterNavigateFn {
  /**
   * Navigate to an absolute route, dynamic route pattern (with `{ params }`), query/hash, or external URL.
   */
  <THref extends DinouLinkTarget = DinouRoute>(
    href: THref,
    ...args: RouterNavigationArgs<NoInfer<THref>>
  ): void;

  /**
   * Navigate to a strictly validated relative route (`"sub"`, `"./sub"`, `"../other"`) from `options.from`.
   */
  <
    TFrom extends DinouFromRoute,
    THref extends DinouRelativeLinkTarget<TFrom> = DinouRelativeLinkTarget<TFrom>
  >(
    href: THref,
    options: RouterRelativeNavigationOptions<TFrom, NoInfer<THref>>
  ): void;
}

export type ScopedRouterNavigationArgs<
  TDefaultFrom extends string,
  THref extends string
> =
  [HasInvalidBracketPatternForFrom<TDefaultFrom, THref>] extends [never]
    ? [HasBracketPattern<THref>] extends [never]
      ? [options?: NavigationOptions & { from?: never; params?: never }]
      : {} extends ResolveLinkParams<THref>
        ? [options?: NavigationOptions & { from?: never; params?: ResolveLinkParams<THref> }]
        : [options: NavigationOptions & { from?: never; params: ResolveLinkParams<THref> }]
    : [options: never];

export interface ScopedDinouRouterNavigateFn<TDefaultFrom extends string> {
  /**
   * Navigate to a strictly validated relative route from this folder (`"sub"`, `"./sub"`, `"../other"`),
   * an absolute route, a dynamic route pattern (with `{ params }`), query/hash, or external URL —
   * without needing to pass `{ from }`.
   */
  <THref extends DinouScopedLinkTarget<TDefaultFrom> = DinouScopedLinkTarget<TDefaultFrom>>(
    href: THref,
    ...args: ScopedRouterNavigationArgs<TDefaultFrom, NoInfer<THref>>
  ): void;

  /**
   * Navigate to a strictly validated relative route from an explicit `options.from` origin override.
   */
  <
    TFrom extends DinouFromRoute,
    THref extends DinouRelativeLinkTarget<TFrom> = DinouRelativeLinkTarget<TFrom>
  >(
    href: THref,
    options: RouterRelativeNavigationOptions<TFrom, NoInfer<THref>>
  ): void;
}

export type ScopedUseRouterHook<TDefaultFrom extends string> = () => {
  push: ScopedDinouRouterNavigateFn<TDefaultFrom>;
  replace: ScopedDinouRouterNavigateFn<TDefaultFrom>;
  back: () => void;
  forward: () => void;
  refresh: (options?: { layout?: boolean }) => void;
  refreshSlot: (slotId: string, options?: { fresh?: boolean }) => Promise<void>;
};

export declare function useRouter(): {
  /**
   * Navigate to the provided href. Pushes a new entry into the history stack.
   * Supports interpolated URLs (`/blog/${slug}`), autocompleted dynamic patterns with `{ params }`,
   * and strict relative paths with `{ from }` (`router.push("sub", { from: "/blog/[slug]" })`).
   */
  push: DinouRouterNavigateFn;

  /**
   * Navigate to the provided href. Replaces the current entry in the history stack.
   * Supports interpolated URLs (`/blog/${slug}`), autocompleted dynamic patterns with `{ params }`,
   * and strict relative paths with `{ from }` (`router.replace("sub", { from: "/blog/[slug]" })`).
   */
  replace: DinouRouterNavigateFn;

  /**
   * Navigate back in the browser's history.
   * Equivalent to clicking the browser's Back button or executing `window.history.back()`.
   */
  back: () => void;

  /**
   * Navigate forward in the browser's history.
   * Equivalent to clicking the browser's Forward button or executing `window.history.forward()`.
   */
  forward: () => void;

  /**
   * Refresh the current route.
   *
   * This triggers a "Soft Reload":
   * 1. Clears the client-side cache for the current page (`pageCache`).
   * 2. Re-fetches fresh RSC payload from the server.
   * 3. Re-renders the page components without a full browser refresh, preserving client state.
   *
   * By default, it refreshes only the page. Pass `{ layout: true }` to also invalidate and re-fetch the layout.
   *
   * Useful for updating the UI after a mutation (e.g., form submission) or to poll for new data.
   *
   * @param options - Optional configuration (`{ layout?: boolean }`).
   */
  refresh: (options?: { layout?: boolean }) => void;

  /**
   * Refreshes a specific DinouCacheSlot without re-rendering the rest of the page.
   * @param slotId - The slot identifier or tag.
   * @param options - Optional configuration ({ fresh?: boolean }).
   */
  refreshSlot: (slotId: string, options?: { fresh?: boolean }) => Promise<void>;
};

/**
 * Programmatically refreshes a specific DinouCacheSlot in the browser without reloading the page.
 * Returns a Promise that resolves once matching slot refreshes have settled.
 * @param slotId - The slot identifier or tag to refresh.
 * @param options - Optional configuration ({ fresh?: boolean }).
 */
export declare function refreshSlot(slotId: string, options?: { fresh?: boolean }): Promise<void>;

/**
 * A Client Component hook that returns true if a navigation (SPA transition) is currently in progress.
 * Useful for showing progress bars or loading spinners globally.
 *
 * @returns {boolean} True if navigation is pending, false otherwise.
 */
export declare function useNavigationLoading(): boolean;

import type { AnchorHTMLAttributes } from "react";

// ====================================================================
// LINK COMPONENT
// ====================================================================

/**
 * Props for the Dinou Link component.
 * Extends standard HTML `<a>` attributes and supports:
 * - Static & interpolated URLs (`href="/about"`, `href={\`/blog/\${slug}\`}`)
 * - Autocompleted dynamic route patterns with required `params` (`to="/blog/[slug]" params={{ slug }}`)
 * - Strictly validated relative paths with required `from` (`from="/blog/[slug]" to="sub"` or `to="./sub"`)
 */
export type LinkProps<
  TFrom extends DinouFromRoute | undefined = undefined,
  THref extends DinouLinkTargetForFrom<TFrom> = DinouLinkTargetForFrom<TFrom>
> = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  /**
   * Origin route/directory pattern (e.g. `"/workspace/[org]/contact"`) used to strictly
   * validate and autocomplete relative navigation targets (`"sub"`, `"./sub"`, `"../other"`).
   */
  from?: TFrom;

  /**
   * The destination URL, dynamic route pattern, or (when `from` is specified) relative path.
   */
  href?: THref;

  /**
   * Alias for `href` (React Router / Remix compatibility).
   */
  to?: THref;

  /**
   * Whether to prefetch the RSC payload when the mouse enters the link area (hover).
   * This makes navigation feel instant upon clicking.
   * @default true
   */
  prefetch?: boolean;

  /**
   * If `true`, clicking this link will force a fresh fetch from the server,
   * bypassing the client-side cache (if enabled) for the target route.
   *
   * Use this for links to pages where data freshness is critical.
   * @default false
   */
  fresh?: boolean;
} & LinkParamsPropsForFrom<NoInfer<TFrom>, NoInfer<THref>>;

/**
 * A client-side navigation component that renders an `<a>` tag.
 * It automatically handles:
 * 1. **Soft Navigation:** Transitions between pages without a full browser reload.
 * 2. **Prefetching:** Loads the target route data on hover (if enabled).
 * 3. **Freshness:** Can force a re-fetch of data via the `fresh` prop.
 * 4. **Dynamic Params Interpolation:** Accepts `params={{ slug }}` when `href`/`to` uses a `[param]` pattern.
 * 5. **Strict Relative Routing:** Validates and autocompletes `"sub"`, `"./sub"`, and `"../..."` when `from` is specified.
 * 6. **Scroll Management:** Preserves or resets scroll position intelligently.
 */
export declare function Link<
  TFrom extends DinouFromRoute | undefined = undefined,
  THref extends DinouLinkTargetForFrom<TFrom> = DinouLinkTargetForFrom<TFrom>
>(props: LinkProps<TFrom, THref>): ReactNode;

/**
 * Props for a route-contextual `<Link>` imported from `"./dinou"`.
 * Pre-binds `from` to `TDefaultFrom` so relative targets (`"sub"`, `"./sub"`, `"../other"`)
 * autocomplete and validate automatically without passing `from`, while also accepting
 * absolute/dynamic routes and optional `from` overrides.
 */
export type ScopedLinkProps<
  TDefaultFrom extends string,
  TFrom extends DinouFromRoute | undefined = undefined,
  THref extends ScopedLinkTargetForFrom<TDefaultFrom, TFrom> = ScopedLinkTargetForFrom<
    TDefaultFrom,
    TFrom
  >
> = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  from?: TFrom;
  href?: THref;
  to?: THref;
  prefetch?: boolean;
  fresh?: boolean;
} & LinkParamsPropsForFrom<
  [NoInfer<TFrom>] extends [undefined] ? TDefaultFrom : NoInfer<TFrom>,
  NoInfer<THref>
>;

export type ScopedLinkComponent<TDefaultFrom extends string> = <
  TFrom extends DinouFromRoute | undefined = undefined,
  THref extends ScopedLinkTargetForFrom<TDefaultFrom, TFrom> = ScopedLinkTargetForFrom<
    TDefaultFrom,
    TFrom
  >
>(
  props: ScopedLinkProps<TDefaultFrom, TFrom, THref>
) => ReactNode;
