"use client";

import { useRouter, usePathname } from "./navigation.js";
import { resolveUrl, isExternalUrl } from "./navigation-utils.js";

export function Link({
  href,
  children,
  prefetch = true,
  fresh = false,
  ...props
}) {
  const { push } = useRouter();
  const pathname = usePathname();
  const resolvedHref = resolveUrl(href, pathname);

  const handlePrefetch = () => {
    if (!prefetch || !href || fresh || isExternalUrl(href)) return;
    if (window.__DINOU_PREFETCH__) {
      window.__DINOU_PREFETCH__(resolvedHref);
    }
  };

  const handleClick = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || isExternalUrl(href)) return;

    e.preventDefault();
    push(href, { fresh });
  };

  return (
    <a
      href={resolvedHref}
      onClick={handleClick}
      onMouseEnter={handlePrefetch}
      {...props}
    >
      {children}
    </a>
  );
}
