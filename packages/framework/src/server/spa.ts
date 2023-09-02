import type * as Net from 'node:net'

import * as Duration from '@effect/data/Duration'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as ServerRequest from '@effect/platform/Http/ServerRequest'
import * as Http from '@effect/platform-node/HttpServer'
import * as Fx from '@typed/fx'
import { RenderEvent, RenderTemplate } from '@typed/html'
import { assetDirectory, clientOutputDirectory } from 'typed:config'

import { HtmlModule } from '../HtmlModule.js'
import { IntrinsicServices } from '../IntrinsicServices.js'

import { cacheControl, staticFileMiddleware } from './middleware.js'
import { ServeContext, renderHtml, serve } from './server.js'

export type SpaContext =
  | ServeContext
  | Http.router.RouteContext
  | RenderTemplate
  | IntrinsicServices

export function spa<R, E>(
  html: HtmlModule,
  render: (request: ServerRequest.ServerRequest) => Fx.Fx<R, E, RenderEvent>,
  options: Net.ListenOptions & { readonly staticFiles?: boolean },
): Effect.Effect<Exclude<R, SpaContext>, Http.error.ServeError, never> {
  const app = Http.router.empty.pipe(
    Http.router.get(`${html.basePath || '/'}*`, renderHtml(html, render)),
    staticFileMiddleware({
      enable: options.staticFiles ?? false,
      directory: clientOutputDirectory,
      include: [`${assetDirectory}/**/*`],
      setHeaders: cacheControl({
        maxAge: Duration.days(365),
        immutable: true,
        etag: true,
      }),
    }),
  )

  return Layer.launch(serve(app, options)) as Effect.Effect<
    Exclude<R, SpaContext>,
    Http.error.ServeError,
    never
  >
}
