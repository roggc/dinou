// dinou/core/client-redirect.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "./navigation.js";

export function ClientRedirect({ to }) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.setAttribute("data-hydrated", "true");
      if (window.__DINOU_ROUTER_NAVIGATE__) {
        window.__DINOU_ROUTER_NAVIGATE__(to, { replace: true });
      } else if (router && router.replace) {
        router.replace(to);
      } else {
        window.location.href = to;
      }
    }
  }, [to, router]);

  return null;
}

export default ClientRedirect;

