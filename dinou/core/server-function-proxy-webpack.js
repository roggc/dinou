import { createFromFetch } from "react-server-dom-webpack/client";

function createServerFunctionProxy(id) {
  return new Proxy(() => { }, {
    apply: async (_target, _thisArg, args) => {
      let body;
      const headers = {
        "x-server-function-call": "1",
      };

      if (args[0] instanceof FormData) {
        const formData = args[0];

        formData.append("__dinou_func_id", id);

        if (args.length > 1) {
          formData.append("__dinou_args", JSON.stringify(args.slice(1)));
        }

        body = formData;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({ id, args });
      }
      const res = await fetch("/____server_function____", {
        method: "POST",
        headers,
        body,
      });

      if (!res.ok) throw new Error("Server function failed");

      // Check header first
      const redirectUrl = res.headers.get("X-Dinou-Redirect");
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return new Promise(() => { });
      }

      const contentType = res.headers.get("content-type") || "";

      // Reject unexpected HTML responses entirely to prevent security bugs
      if (contentType.includes("text/html")) {
        const html = await res.text();
        console.warn("[Dinou] Received unexpected HTML response from server function:", html);
        throw new Error("Unexpected HTML response from server function");
      }

      // Check if it's application/json (Scenario A clean redirect or json response)
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data && data.redirect) {
          window.location.href = data.redirect;
          return new Promise(() => { });
        }
        return data;
      }

      // Case 2: RSC or Hybrid Stream (Buffered)
      if (contentType.includes("text/x-component")) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        const readableStream = new ReadableStream({
          async start(controller) {
            let buffer = ""; // 📦 PERSISTENT STATE
            let isRedirecting = false;

            try {
              while (true) {
                const { done, value } = await reader.read();

                if (done) {
                  if (buffer.length > 0) {
                    if (buffer.startsWith("D:")) {
                      try {
                        const payload = JSON.parse(buffer.slice(2));
                        if (payload.type === "redirect") {
                          isRedirecting = true;
                          window.location.href = payload.url;
                        } else if (payload.type === "cookie") {
                          document.cookie = payload.cookie;
                        }
                      } catch (e) {
                        console.error("[Dinou] Failed to parse stream command line at end:", e);
                      }
                    } else {
                      controller.enqueue(encoder.encode(buffer));
                    }
                  }
                  break;
                }

                // 1. ACCUMULATE
                buffer += decoder.decode(value, { stream: true });

                // 2. PROCESS COMPLETE LINES
                const lastNewlineIndex = buffer.lastIndexOf("\n");
                if (lastNewlineIndex !== -1) {
                  const completeChunk = buffer.slice(0, lastNewlineIndex + 1);
                  buffer = buffer.slice(lastNewlineIndex + 1);

                  const lines = completeChunk.split("\n");
                  let cleanChunk = "";

                  for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (!line && i === lines.length - 1) {
                      continue;
                    }

                    if (line.startsWith("D:")) {
                      try {
                        const payload = JSON.parse(line.slice(2));
                        if (payload.type === "redirect") {
                          isRedirecting = true;
                          window.location.href = payload.url;
                        } else if (payload.type === "cookie") {
                          document.cookie = payload.cookie;
                        }
                      } catch (e) {
                        console.error("[Dinou] Failed to parse stream command line:", e);
                      }
                    } else {
                      cleanChunk += line + "\n";
                    }
                  }

                  if (cleanChunk) {
                    controller.enqueue(encoder.encode(cleanChunk));
                  }
                }
              }
            } catch (err) {
              controller.error(err);
            } finally {
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

if (typeof window !== "undefined") {
  window.__SERVER_FUNCTION_PROXY_LIB__ = { createServerFunctionProxy };
}

export { createServerFunctionProxy };
export default { createServerFunctionProxy };
