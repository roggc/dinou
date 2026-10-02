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

export interface DinouPlugin {
  name?: string;
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
   * Can also be enabled per route by declaring `export const ppr = true;` in page.tsx.
   * @default false
   */
  ppr?: boolean;

  /**
   * Custom storage adapter for ISR / ISG page caching.
   */
  storage?: any;

  /**
   * Array of Dinou plugins.
   */
  plugins?: DinouPlugin[];
}

/**
 * Route Segment Configuration for Partial Prerendering (PPR).
 * In Dinou, export `const ppr = true;` (or `export const experimental_ppr = true;` for Next.js parity)
 * in your page.tsx or layout.tsx to enable instant static shell delivery with dynamic Suspense streaming holes.
 */
export type PPRConfig = boolean;

export interface RouteSegmentConfig {
  /**
   * Partial Prerendering (PPR) flag.
   * @default false
   */
  ppr?: boolean;

  /**
   * Next.js compatibility alias for PPR.
   * @default false
   */
  experimental_ppr?: boolean;

  /**
   * Incremental Static Regeneration revalidation time in seconds, or false to cache indefinitely.
   */
  revalidate?: number | false;

  /**
   * Dynamic rendering strategy.
   */
  dynamic?: boolean | "auto" | "force-dynamic" | "force-static";

  /**
   * Cache tags associated with this route for on-demand invalidation.
   */
  tags?: string[];
}

/**
 * Type-safe configuration helper for dinou.config.js / dinou.config.mjs.
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
 * A Client Component hook that lets you read the current URL's pathname.
 * This hook triggers a re-render when the route changes.
 *
 * @returns {string} The current pathname (e.g., "/dashboard") without search parameters.
 * @example
 * const pathname = usePathname();
 * if (pathname === '/active') { ... }
 */
export declare function usePathname(): string;

/**
 * A Client Component hook that lets you read the current URL's search parameters.
 * This hook triggers a re-render when the route changes.
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
export declare function useRouter(): {
  /**
   * Navigate to the provided href. Pushes a new entry into the history stack.
   * @param href - The URL to navigate to (e.g., "/about").
   * @param options - Optional configuration for the navigation (e.g., force fresh data).
   */
  push: (href: string, options?: NavigationOptions) => void;

  /**
   * Navigate to the provided href. Replaces the current entry in the history stack.
   * @param href - The URL to navigate to.
   * @param options - Optional configuration for the navigation.
   */
  replace: (href: string, options?: NavigationOptions) => void;

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
   * 1. Clears the client-side cache for the current route.
   * 2. Re-fetches fresh RSC payload from the server.
   * 3. Re-renders the page components without a full browser refresh.
   *
   * Useful for updating the UI after a mutation (e.g., form submission) or to poll for new data.
   */
  refresh: () => void;

  /**
   * Refreshes a specific DinouCacheSlot without re-rendering the rest of the page.
   * @param slotId - The slot identifier or tag.
   * @param options - Optional configuration ({ fresh?: boolean }).
   */
  refreshSlot: (slotId: string, options?: { fresh?: boolean }) => void;
};

/**
 * Programmatically refreshes a specific DinouCacheSlot in the browser without reloading the page.
 * @param slotId - The slot identifier or tag to refresh.
 * @param options - Optional configuration ({ fresh?: boolean }).
 */
export declare function refreshSlot(slotId: string, options?: { fresh?: boolean }): void;

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
 * It extends standard HTML <a> attributes, allowing className, style, etc.
 */
export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * The destination URL or path.
   * * Supports absolute paths (e.g., `/dashboard`).
   * * Supports relative paths (e.g., `../settings` or `details`).
   */
  href: string;

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
}

/**
 * A client-side navigation component that renders an `<a>` tag.
 * It automatically handles:
 * 1. **Soft Navigation:** Transitions between pages without a full browser reload.
 * 2. **Prefetching:** Loads the target route data on hover (if enabled).
 * 3. **Freshness:** Can force a re-fetch of data via the `fresh` prop.
 * 4. **Relative Routing:** Resolves paths like standard filesystem navigation.
 * 5. **Scroll Management:** Preserves or resets scroll position intelligently.
 *
 * @example
 * <Link href="/about" className="text-blue-500">
 * Go to About
 * </Link>
 *
 * @example
 * <Link href="/dashboard" fresh>
 * Dashboard (Force Refresh)
 * </Link>
 */
export declare function Link(props: LinkProps): ReactNode;
