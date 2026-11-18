// dinou/core/config.js
// Type helper for defining Dinou configuration and plugins
import { getContext } from "./request-context.js";
import { noDynamic } from "./no-dynamic.js";

export function defineConfig(config) {
  return config;
}

export { getContext, noDynamic };
export default defineConfig;
