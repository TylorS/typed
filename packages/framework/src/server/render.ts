import * as HashMap from '@effect/data/HashMap'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as ServerRequest from '@effect/platform/Http/ServerRequest'
import * as ServerResponse from '@effect/platform/Http/ServerResponse'
import * as Fx from '@typed/fx'
import { RenderEvent, RenderTemplate } from '@typed/html'
import * as htmlServer from '@typed/html/server'

import { HtmlModule } from '../HtmlModule.js'
import { IntrinsicServices } from '../IntrinsicServices.js'

import { server } from './layer.js'

const textEncoder = new TextEncoder()
const htmlResponseOption: ServerResponse.Options = {
  status: 200,
  contentType: 'text/html',
}

export function renderToHtmlStream<R, E>(
  html: HtmlModule,
  render: (request: ServerRequest.ServerRequest) => Fx.Fx<R, E, RenderEvent>,
): Effect.Effect<
  ServerRequest.ServerRequest | Exclude<R, IntrinsicServices | RenderTemplate>,
  never,
  ServerResponse.ServerResponse
> {
  return Effect.contextWithEffect((context) =>
    Effect.gen(function* (_) {
      const request = yield* _(ServerRequest.ServerRequest)
      const stream = render(request).pipe(
        htmlServer.renderToHtmlStream,
        Fx.startWith(html.before),
        Fx.continueWith(() => Fx.succeed(html.after)),
        Fx.map(stringToUint8Array),
        Fx.provideSomeContext(context),
        Fx.provideSomeLayer(
          server({
            initialUrl: getUrlFromServerRequest(request),
          }),
        ),
        Fx.scoped,
        Fx.toStream,
      )

      return ServerResponse.stream(stream as any, htmlResponseOption)
    }),
  )
}

export function renderToHtml<R, E, R2 = never, E2 = never>(
  html: HtmlModule,
  render: (request: ServerRequest.ServerRequest) => Fx.Fx<R, E, RenderEvent>,
  transformHtml?: (
    request: ServerRequest.ServerRequest,
    html: string,
  ) => Effect.Effect<R2, E2, string>,
): Effect.Effect<
  Exclude<R | R2 | ServerRequest.ServerRequest, IntrinsicServices | RenderTemplate>,
  E | E2,
  ServerResponse.ServerResponse
> {
  return ServerRequest.ServerRequest.pipe(
    Effect.flatMap((request) =>
      render(request).pipe(
        htmlServer.renderToHtml,
        Effect.flatMap((content) => {
          const fullHtml = html.before + content + html.after

          if (transformHtml) {
            return Effect.map(transformHtml(request, fullHtml), (html) =>
              ServerResponse.raw(html, htmlResponseOption),
            )
          }

          return Effect.succeed(ServerResponse.raw(fullHtml, htmlResponseOption))
        }),
        Effect.provideSomeLayer(
          server({
            initialUrl: getUrlFromServerRequest(request),
          }),
        ),
        Effect.scoped,
      ),
    ),
  ) as any
}

export function stringToUint8Array(s: string): Uint8Array {
  return textEncoder.encode(s)
}

export function getUrlFromServerRequest(request: ServerRequest.ServerRequest): URL {
  const { headers } = request
  const host = HashMap.get(headers, 'x-forwarded-host').pipe(
    Option.orElse(() => HashMap.get(headers, 'host')),
    Option.getOrElse(() => 'localhost'),
  )
  const protocol = HashMap.get(headers, 'x-forwarded-proto').pipe(
    Option.orElse(() => HashMap.get(headers, 'x-forwarded-protocol')),
    Option.orElse(() => HashMap.get(headers, 'protocol')),
    Option.getOrElse(() => 'http'),
  )

  return new URL(request.url, `${protocol}://${host}`)
}
