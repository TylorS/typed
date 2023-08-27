import { createServer } from 'node:http'
import type * as Net from 'node:net'

import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import * as ServerRequest from '@effect/platform/Http/ServerRequest'
import * as ServerResponse from '@effect/platform/Http/ServerResponse'
import * as Http from '@effect/platform-node/HttpServer'
import * as NodeContext from '@effect/platform-node/NodeContext'
import * as Fx from '@typed/fx'
import { RenderEvent, RenderTemplate } from '@typed/html'
import httpDevServer from 'vavite/http-dev-server'
import viteDevServer from 'vavite/vite-dev-server'

import { HtmlModule } from '../HtmlModule.js'
import { IntrinsicServices } from '../IntrinsicServices.js'

import { renderToHtml, renderToHtmlStream } from './render.js'

const isDev = !!httpDevServer && !!viteDevServer

export function renderHtml<R, E>(
  html: HtmlModule,
  render: (request: ServerRequest.ServerRequest) => Fx.Fx<R, E, RenderEvent>,
): Effect.Effect<
  ServerRequest.ServerRequest | Exclude<R, IntrinsicServices | RenderTemplate>,
  E,
  ServerResponse.ServerResponse
> {
  if (isDev) {
    return renderToHtml(html, render, (req, html) =>
      Effect.promise(() => viteDevServer!.transformIndexHtml(req.url, html)),
    )
  }

  return renderToHtmlStream(html, render)
}

export function serve<R, E>(
  app: Http.app.Default<R, E>,
  options: Net.ListenOptions,
): Layer.Layer<
  Exclude<
    Exclude<
      Exclude<Exclude<R, ServerRequest.ServerRequest>, Scope.Scope>,
      Http.server.Server | Http.etag.Generator
    >,
    NodeContext.NodeContext
  >,
  Http.error.ServeError,
  never
> {
  const listenOptions = httpDevServer ? serverToListenOptions(httpDevServer, options) : options

  return app.pipe(
    Http.server.serve(Http.middleware.loggerTracer),
    Layer.scopedDiscard,
    Layer.use(Http.server.layer(() => createOrUseViteDevServer(listenOptions), listenOptions)),
    Layer.use(NodeContext.layer),
  )
}

function logServerStart(options: Net.ListenOptions) {
  console.info(
    `Server running at http://${options.host || 'localhost'}${
      options.port ? `:${options.port}` : ''
    }`,
  )
}

function createOrUseViteDevServer(options: Net.ListenOptions) {
  if (isDev) {
    const server = httpDevServer!

    // Don't allow Effect to call listen to avoid trying to start
    // on a different port
    server.listen = (...args) => {
      const cb = args.reverse().find((arg) => typeof arg === 'function')

      if (cb) {
        cb()
      }

      return server
    }

    return server
  } else {
    // TODO: Figure out how to serve using http2 and doing file pushing

    const server = createServer()

    // Log when server starts
    server.on('listening', () => logServerStart(options))

    return server
  }
}

function serverToListenOptions(server: NonNullable<typeof httpDevServer>, opts: Net.ListenOptions) {
  const address = server.address()

  // Set host and port to match the vite dev server
  if (address && typeof address === 'object') {
    opts.host = address.address
    opts.port = address.port
  }

  return opts
}
