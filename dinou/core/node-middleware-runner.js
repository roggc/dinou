// dinou/core/node-middleware-runner.js
// Shared Node.js configureServer hook runner and Connect/Express-style
// (req, res, next) middleware executor for dev and production servers.

/**
 * Executes a single Node.js HTTP middleware `(req, res, next)`.
 * Supports:
 * - Synchronous `next()` middlewares
 * - Async Promise-returning middlewares (`async (req, res, next) => { ... }`)
 * - Callback-async Connect/Express middlewares (`cors`, `helmet`, `compression`, etc.)
 * - `next(err)` error propagation
 * - Direct response termination (`res.end()`, `res.writeHead()`)
 * - External `server.on("request")` hijacking (e.g. Socket.IO `/socket.io/` polling
 *   where `mw` returns synchronously without calling `next()` and Socket.IO ends `res`).
 *
 * @param {Function} mw
 * @param {import("node:http").IncomingMessage} req
 * @param {import("node:http").ServerResponse} res
 * @returns {Promise<boolean>} `true` if Dinou should continue handling the request, `false` if handled/short-circuited
 */
async function runSingleNodeMiddleware(mw, req, res) {
  let nextCalled = false;
  let nextError = null;
  let resolveWait = null;

  const next = (err) => {
    if (nextCalled) return;
    nextCalled = true;
    if (err !== undefined && err !== null) {
      nextError = err instanceof Error ? err : new Error(String(err));
    }
    if (resolveWait) {
      const fn = resolveWait;
      resolveWait = null;
      fn();
    }
  };

  const ret = mw(req, res, next);

  if (ret && typeof ret.then === "function") {
    await ret;
    if (nextError) throw nextError;
    if (res.writableEnded || res.headersSent) return false;
    return nextCalled;
  }

  if (nextError) throw nextError;
  if (res.writableEnded || res.headersSent) return false;
  if (nextCalled) return true;

  // A middleware with fewer than 3 declared parameters `(req, res) => {}` cannot call `next`
  if (typeof mw === "function" && mw.length < 3) {
    return false;
  }

  await new Promise((resolve) => {
    let settled = false;
    let fallbackTimer = null;
    const done = () => {
      if (settled) return;
      settled = true;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      if (typeof res.off === "function") {
        res.off("finish", done);
        res.off("close", done);
      } else if (typeof res.removeListener === "function") {
        res.removeListener("finish", done);
        res.removeListener("close", done);
      }
      resolve();
    };

    resolveWait = done;

    if (typeof res.once === "function") {
      res.once("finish", done);
      res.once("close", done);
    } else {
      // Fallback only for synthetic plain-object mocks without EventEmitter methods
      fallbackTimer = setTimeout(done, 100);
    }
  });

  if (nextError) throw nextError;
  if (res.writableEnded || res.headersSent) return false;
  return nextCalled;
}

/**
 * Runs all registered Node middlewares in sequence.
 * Returns `true` if request processing should continue to Dinou's router,
 * or `false` if a middleware terminated or hijacked the response.
 *
 * @param {Function[]} middlewares
 * @param {import("node:http").IncomingMessage} req
 * @param {import("node:http").ServerResponse} res
 * @returns {Promise<boolean>}
 */
export async function runNodeMiddlewares(middlewares, req, res) {
  if (!Array.isArray(middlewares) || middlewares.length === 0) {
    return !(res.writableEnded || res.headersSent);
  }
  for (const mw of middlewares) {
    if (res.writableEnded || res.headersSent) {
      return false;
    }
    const shouldContinue = await runSingleNodeMiddleware(mw, req, res);
    if (!shouldContinue || res.writableEnded || res.headersSent) {
      return false;
    }
  }
  return true;
}

/**
 * Invokes `plugin.configureServer` for each configured plugin with per-plugin
 * error isolation so one faulty plugin never blocks subsequent plugins.
 *
 * @param {object} options
 * @param {Array} options.plugins
 * @param {import("node:http").Server} options.server
 * @param {boolean} options.isDev
 * @param {Function[]} options.middlewares
 */
export async function applyConfigureServerPlugins({
  plugins,
  server,
  isDev,
  middlewares,
}) {
  if (!Array.isArray(plugins) || plugins.length === 0) {
    return;
  }
  const serverContext = {
    server,
    isDev: Boolean(isDev),
    use(middleware) {
      if (typeof middleware === "function") {
        middlewares.push(middleware);
      }
    },
  };
  for (const plugin of plugins) {
    if (plugin && typeof plugin.configureServer === "function") {
      try {
        await plugin.configureServer(serverContext);
      } catch (err) {
        console.error(
          `[Dinou Plugin Error: "${plugin.name || "unnamed"}" (configureServer)]:`,
          err
        );
      }
    }
  }
}

export default {
  runNodeMiddlewares,
  applyConfigureServerPlugins,
};

