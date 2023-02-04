// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../vavite.d.ts" />
import type { Express } from 'express'

import { parsePort } from './parsePort.js'

export interface ListenOptions {
  readonly httpDevServer?: typeof import('vavite/http-dev-server').default
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
  if (options.httpDevServer) {
    listenHttpDevServer(app, options.httpDevServer, callback)
  } else {
    listenExpressServer(app, options, callback)
  }
}

export function listenHttpDevServer(
  app: Express,
  httpDevServer: NonNullable<typeof import('vavite/http-dev-server').default>,
  callback: (port: number, host?: string) => void = (p) =>
    console.log(`Server listening at port ${p}`),
): void {
  httpDevServer.on('request', app)
  const address = httpDevServer.address()
  const port = typeof address === 'string' ? parseInt(address, 10) : address?.port ?? 3000

  callback(port)
}

export function listenExpressServer(
  app: Express,
  options: ListenOptions = {},
  callback: (port: number, host?: string) => void,
) {
  // Otherwise, start the server for production
  const port = parsePort(options.port ?? 3000)

  const { host } = options

  if (host) {
    app.listen(port, host, () => callback(port, host))
  } else {
    app.listen(port, () => callback(port))
  }
}
