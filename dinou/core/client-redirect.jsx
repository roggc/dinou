// dinou/core/client-redirect.jsx
"use client";

import { useRouter } from "./navigation.js";

export function ClientRedirect({ to }) {
  const router = useRouter();

  if (typeof window !== "undefined") {
    Promise.resolve().then(() => {
      if (window.__DINOU_ROUTER_NAVIGATE__) {
        window.__DINOU_ROUTER_NAVIGATE__(to, { replace: true });
      } else {
        router.replace(to);
      }
    });
    // Suspend to prevent React from committing this intermediate page
    throw new Promise(() => {});
  }

  return null;
}
