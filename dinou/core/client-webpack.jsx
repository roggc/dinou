import { use } from "react";
import { createFromFetch } from "react-server-dom-webpack/client";
import { hydrateRoot } from "react-dom/client";

const cache = new Map();
const route = window.location.href.replace(window.location.origin, "");

function Root() {
  let content = cache.get(route);
  if (!content) {
    content = createFromFetch(
      fetch(
        window.__DINOU_USE_OLD_RSC__
          ? "/____rsc_payload_old____" + route
          : "/____rsc_payload____" + route
      )
    );
    cache.set(route, content);
  }

  return use(content);
}

hydrateRoot(document, <Root />);

// HMR
if (import.meta.hot) {
  import.meta.hot.accept();
}
