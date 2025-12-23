// public/server-function-proxy.js
import { createFromFetch } from "@roggc/react-server-dom-esm/client";

export function createServerFunctionProxy(id) {
  return new Proxy(() => {}, {
    apply: async (_target, _thisArg, args) => {
      const res = await fetch("/____server_function____", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-server-function-call": "1",
        },
        body: JSON.stringify({ id, args }),
      });

      if (!res.ok) throw new Error("Server function failed");

      const contentType = res.headers.get("content-type") || "";

      // Caso 1: HTML puro (Redirect simple)
      if (contentType.includes("text/html")) {
        const html = await res.text();
        const range = document.createRange();
        const documentFragment = range.createContextualFragment(html);
        document.body.appendChild(documentFragment);
        return new Promise(() => {});
      }

      // Caso 2: RSC o Stream Híbrido (Bufferizado)
      if (contentType.includes("text/x-component")) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        const scriptRegex = /<script>(.*?)<\/script>/gs;

        const readableStream = new ReadableStream({
          async start(controller) {
            let buffer = ""; // 📦 ESTADO PERSISTENTE
            let isRedirecting = false;

            try {
              while (true) {
                const { done, value } = await reader.read();

                if (done) {
                  // Si queda algo en el buffer al terminar, lo mandamos (siempre que no sea un script roto)
                  if (buffer.length > 0) {
                    // CHECK CORRECTO: Buscamos el inicio del tag, tenga o no el cierre >
                    if (buffer.includes("<script")) {
                      console.warn(
                        "[Dinou] Stream ended with incomplete script. Discarding tail."
                      );
                      // No hacemos enqueue.
                    } else {
                      // Es contenido seguro (ej: "a < b" o un json cortado que React manejará)
                      controller.enqueue(encoder.encode(buffer));
                    }
                  }
                  break;
                }

                // 1. ACUMULAR
                buffer += decoder.decode(value, { stream: true });

                // 2. PROCESAR SCRIPTS COMPLETOS
                // Buscamos pares completos de <script>...</script>
                let match;

                // Ejecutamos todos los scripts completos que encontremos
                while ((match = scriptRegex.exec(buffer)) !== null) {
                  const fullMatch = match[0];
                  const scriptContent = match[1];

                  // Detectar redirect
                  if (scriptContent.includes("window.location.href")) {
                    isRedirecting = true;
                  }

                  // Inyectar al DOM
                  const range = document.createRange();
                  const fragment = range.createContextualFragment(fullMatch); // fullMatch incluye tags para contexto correcto
                  document.body.appendChild(fragment);
                }

                // 3. LIMPIAR SCRIPTS PROCESADOS DEL BUFFER
                // Una vez ejecutados, los borramos para que no vayan a React
                buffer = buffer.replace(scriptRegex, "");

                // 4. CALCULAR QUÉ ES SEGURO ENVIAR (La lógica anti-corte)
                // Necesitamos saber si el buffer termina con algo que PARECE el inicio de un script
                // Patrones peligrosos al final: <, <s, <sc, <scr, <scri, <scrip, <script

                let cutoffIndex = buffer.length; // Por defecto enviamos todo

                // A) Si hay un <script> abierto pero no cerrado en el buffer
                const openScriptIndex = buffer.indexOf("<script>");
                if (openScriptIndex !== -1) {
                  // Guardamos todo desde el <script> en adelante
                  cutoffIndex = openScriptIndex;
                } else {
                  // B) Si no hay script abierto, miramos si el final parece un tag cortado
                  // Regex: Busca '<' seguido opcionalmente de s, c, r, i, p, t AL FINAL de la cadena ($)
                  const partialTagMatch = buffer.match(/<s?c?r?i?p?t?$/);

                  if (partialTagMatch) {
                    // Guardamos desde donde empieza la sospecha
                    cutoffIndex = partialTagMatch.index;
                  }
                }

                // 5. ENVIAR LO SEGURO
                const safeChunk = buffer.slice(0, cutoffIndex);
                // Lo que sobra se queda en el buffer para la siguiente vuelta (chunk)
                buffer = buffer.slice(cutoffIndex);

                if (safeChunk) {
                  controller.enqueue(encoder.encode(safeChunk));
                }
              }
            } catch (err) {
              controller.error(err);
            } finally {
              // Si NO es redirect, cerramos. Si es redirect, dejamos colgando (tu truco maestro).
              if (!isRedirecting) {
                controller.close();
              }
            }
          },
        });

        return createFromFetch(Promise.resolve(new Response(readableStream)));
      }
      return res.json();
    },
  });
}
