// public/server-function-proxy.js
import { createFromFetch } from "@matthamlin/react-server-dom-esm/client";

export function createServerFunctionProxy(id) {
  return new Proxy(() => {}, {
    apply: async (_target, _thisArg, args) => {
      const res = await fetch("/____server_function____", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, args }),
      });
      if (!res.ok) throw new Error("Server function failed");

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/x-component")) {
        return createFromFetch(Promise.resolve(res));
      } else {
        return res.json();
      }
    },
  });
}
