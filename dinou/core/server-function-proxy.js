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

      // Case 1: Pure HTML (Simple Redirect)
      if (contentType.includes("text/html")) {
        const html = await res.text();
        const range = document.createRange();
        const documentFragment = range.createContextualFragment(html);
        document.body.appendChild(documentFragment);
        return new Promise(() => {});
      }

      // Case 2: RSC or Hybrid Stream (Buffered)
      if (contentType.includes("text/x-component")) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        const scriptRegex = /<script>(.*?)<\/script>/gs;

        const readableStream = new ReadableStream({
          async start(controller) {
            let buffer = ""; // 📦 PERSISTENT STATE
            let isRedirecting = false;

            try {
              while (true) {
                const { done, value } = await reader.read();

                if (done) {
                  // If something remains in the buffer upon finishing, we send it (as long as it's not a broken script)
                  if (buffer.length > 0) {
                    // CHECK: We search for the tag start, whether it has the closing > or not
                    if (buffer.includes("<script")) {
                      console.warn(
                        "[Dinou] Stream ended with incomplete script. Discarding tail."
                      );
                      // We do not enqueue.
                    } else {
                      // It is safe content (e.g., "a < b" or a cut JSON that React will handle)
                      controller.enqueue(encoder.encode(buffer));
                    }
                  }
                  break;
                }

                // 1. ACCUMULATE
                buffer += decoder.decode(value, { stream: true });

                // 2. PROCESS COMPLETE SCRIPTS
                // We search for complete pairs of <script>...</script>
                let match;

                // We execute all complete scripts we find
                while ((match = scriptRegex.exec(buffer)) !== null) {
                  const fullMatch = match[0];
                  const scriptContent = match[1];

                  // Detect redirect
                  if (scriptContent.includes("window.location.href")) {
                    isRedirecting = true;
                  }

                  // Inject to DOM
                  const range = document.createRange();
                  const fragment = range.createContextualFragment(fullMatch); // fullMatch includes tags for correct context
                  document.body.appendChild(fragment);
                }

                // 3. CLEAN PROCESSED SCRIPTS FROM BUFFER
                // Once executed, we remove them so they don't go to React
                buffer = buffer.replace(scriptRegex, "");

                // 4. CALCULATE WHAT IS SAFE TO SEND (The anti-cut logic)
                // We need to know if the buffer ends with something that LOOKS like the start of a script
                // Dangerous patterns at the end: <, <s, <sc, <scr, <scri, <scrip, <script

                let cutoffIndex = buffer.length; // Default send everything

                // A) If there is an open but not closed <script> in the buffer
                const openScriptIndex = buffer.indexOf("<script>");
                if (openScriptIndex !== -1) {
                  // We keep everything from the <script> onwards
                  cutoffIndex = openScriptIndex;
                } else {
                  // B) If no open script, check if the end looks like a cut tag
                  // Regex: Looks for '<' optionally followed by s, c, r, i, p, t AT THE END of the string ($)
                  const partialTagMatch = buffer.match(/<s?c?r?i?p?t?$/);

                  if (partialTagMatch) {
                    // We save from where the suspicion starts
                    cutoffIndex = partialTagMatch.index;
                  }
                }

                // 5. SEND SAFE CONTENT
                const safeChunk = buffer.slice(0, cutoffIndex);
                // What remains stays in the buffer for the next loop (chunk)
                buffer = buffer.slice(cutoffIndex);

                if (safeChunk) {
                  controller.enqueue(encoder.encode(safeChunk));
                }
              }
            } catch (err) {
              controller.error(err);
            } finally {
              // If it is NOT a redirect, we close. If it is a redirect, we leave hanging (your master trick).
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
