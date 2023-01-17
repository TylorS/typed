import type express from 'express'

import type { FetchHandler } from './FetchHandler.js'
import { registerFetchHandler } from './fetch-express.js'

export function registerExpressHandlers<H extends ReadonlyArray<FetchHandler<never, any>>>(
  handlers: H,
) {
  return (app: express.Express): void => {
    for (const handler of handlers) {
      registerFetchHandler(app, handler)
    }
  }
}
