// dinou/core/client-redirect.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "./navigation.js";

export function ClientRedirect({ to }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [to, router]);

  return null;
}
