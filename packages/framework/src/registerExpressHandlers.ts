import express from 'express'

import type { FetchHandler } from './FetchHandler.js'
import { registerFetchHandler } from './fetch-express.js'

export function registerExpressHandlers<H extends ReadonlyArray<FetchHandler<never, any>>>(
  handlers: H,
): express.Router {
  // eslint-disable-next-line import/no-named-as-default-member
  const router = express.Router({ mergeParams: true })

  handlers.forEach((handler) => registerFetchHandler(router, handler))

  return router
}
