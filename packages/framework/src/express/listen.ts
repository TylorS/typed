// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../vavite.d.ts" />
import type { Express } from 'express'
import httpDevServer from 'vavite/http-dev-server'

import { parsePort } from './parsePort.js'

export interface ListenOptions {
  readonly host?: string
  readonly port?: number
}

export function listen(
  app: Express,
  options: ListenOptions = {},
  callback: (port: number, host?: string) => void = (p) =>
    console.log(`Server listening at port ${p}`),
): void {
  // httpDevServer will resolve to undefined when import.meta.env.PROD is true and be
  // dead-code eliminated from your production build.
  if (import.meta.env.DEV && httpDevServer) {
    httpDevServer.on('request', app)
    const address = httpDevServer.address()
    const port = typeof address === 'string' ? parseInt(address, 10) : address?.port ?? 3000

    callback(port)
  } else {
    // Otherwise, start the server for production
    const port = parsePort(options.port ?? 3000)

    if (options.host) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      app.listen(port, options.host, () => callback(port, options.host!))
    } else {
      app.listen(port, () => callback(port))
    }
  }
}
