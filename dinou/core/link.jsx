"use client";

import { useRouter, usePathname } from "./navigation.js";
import {
  resolveUrl,
  isExternalUrl,
  interpolateRouteParams,
} from "./navigation-utils.js";

export function Link({
  href,
  to,
  from,
  params,
  children,
  prefetch = true,
  fresh = false,
  onClick,
  ...props
}) {
  const targetHref = interpolateRouteParams(href || to || "", params);
  const { push } = useRouter();
  const pathname = usePathname();
  const resolvedHref = resolveUrl(targetHref, pathname, from);
  const isNonSelfTarget = Boolean(props.target && props.target !== "_self");
  const isDownload = props.download !== undefined && props.download !== false;

  const handlePrefetch = () => {
    if (
      !prefetch ||
      !targetHref ||
      fresh ||
      isNonSelfTarget ||
      isDownload ||
      isExternalUrl(targetHref)
    ) {
      return;
    }
    if (window.__DINOU_PREFETCH__) {
      window.__DINOU_PREFETCH__(resolvedHref);
    }
  };

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }

    if (e.defaultPrevented) return;
    if (
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      isNonSelfTarget ||
      isDownload ||
      isExternalUrl(targetHref)
    ) {
      return;
    }

    e.preventDefault();
    if (targetHref) {
      push(resolvedHref || targetHref, { fresh });
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
