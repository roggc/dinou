"use client";

import { useRouter, usePathname } from "./navigation.js";
import { resolveUrl, isExternalUrl } from "./navigation-utils.js";

export function Link({
  href,
  to,
  children,
  prefetch = true,
  fresh = false,
  onClick,
  ...props
}) {
  const targetHref = href || to || "";
  const { push } = useRouter();
  const pathname = usePathname();
  const resolvedHref = resolveUrl(targetHref, pathname);

  const handlePrefetch = () => {
    if (!prefetch || !targetHref || fresh || isExternalUrl(targetHref)) return;
    if (window.__DINOU_PREFETCH__) {
      window.__DINOU_PREFETCH__(resolvedHref);
    }
  };

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }

    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || isExternalUrl(targetHref)) return;

    e.preventDefault();
    if (targetHref) {
      push(targetHref, { fresh });
    }
  };

  return (
    <a
      {...props}
      href={resolvedHref || undefined}
      onClick={handleClick}
      onMouseEnter={handlePrefetch}
    >
      {children}
    </a>
  );
}

export default Link;
