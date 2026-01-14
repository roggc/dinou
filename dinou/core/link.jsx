"use client";

import { useRouter } from "./navigation.js";
import { resolveUrl } from "./navigation-utils.js";

export function Link({
  href,
  children,
  prefetch = true,
  fresh = false,
  ...props
}) {
  const { push } = useRouter();

  const handlePrefetch = () => {
    if (!prefetch || !href || fresh) return;
    const finalPath = resolveUrl(href, window.location.pathname);
    if (window.__DINOU_PREFETCH__) {
      window.__DINOU_PREFETCH__(finalPath);
    }
  };

  const handleClick = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    push(href, { fresh });
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={handlePrefetch}
      {...props}
    >
      {children}
    </a>
  );
}
