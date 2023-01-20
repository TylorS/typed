// This is an optional optimization to load routes lazily so that
// when reloadOn option is set to "static-deps-change",
// changes to the route handlers will not trigger a reload.

import type { RequestHandler } from 'express'
import viteDevServer from 'vavite/vite-dev-server'

// Feel free to remove this and import routes directly.
export function lazyExpressHandler(importer: () => Promise<RequestHandler>): RequestHandler {
  return async (req, res, next) => {
    try {
      const routeHandler = await importer()
      routeHandler(req, res, next)
    } catch (err) {
      if (viteDevServer && err instanceof Error) viteDevServer.ssrFixStacktrace(err)
      next(err)
    }
  }
}
