// dinou/core/client-redirect.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "./navigation.js"; // Ajusta ruta si es necesario

export function ClientRedirect({ to }) {
  const router = useRouter();

  useEffect(() => {
    // Usamos replace para no ensuciar el historial (back button debe saltar esto)
    router.replace(to);
  }, [to, router]);

  // No renderizamos nada visualmente
  return null;
}
