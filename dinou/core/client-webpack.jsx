import { use } from "react";
import { createFromFetch } from "react-server-dom-webpack/client";
import { hydrateRoot } from "react-dom/client";

const cache = new Map();
const route = window.location.href.replace(window.location.origin, "");

function Root() {
  let content = cache.get(route);
  if (!content) {
    content = createFromFetch(fetch("/____rsc_payload____" + route));
    cache.set(route, content);
  }

  return use(content);
}

hydrateRoot(document, <Root />);

// HMR
if (import.meta.hot) {
  import.meta.hot.accept();
}
