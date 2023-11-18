import * as Headers from "@effect/platform/Http/Headers"
import type { ServerRequest } from "@effect/platform/Http/ServerRequest"
import * as HttpServer from "@effect/platform/HttpServer"
import type * as Fx from "@typed/fx/Fx"
import { renderToStream } from "@typed/template/Html"
import type * as RenderContext from "@typed/template/RenderContext"
import type { RenderEvent } from "@typed/template/RenderEvent"
import type { RenderTemplate } from "@typed/template/RenderTemplate"
import { Effect, Option, Stream } from "effect"

const HTML_CONTENT_TYPE = "text/html"
const CAMEL_CASE_CONTENT_TYPE = { contentType: HTML_CONTENT_TYPE }
const HYPHENATED_CONTENT_TYPE = { "content-type": HTML_CONTENT_TYPE }

export function htmlResponse<R, E>(
  fx: Fx.Fx<R, E, RenderEvent>,
  options?: HttpServer.response.Options
): Effect.Effect<RenderContext.RenderContext | Exclude<R, RenderTemplate>, E, HttpServer.response.ServerResponse> {
  return Effect.contextWithEffect((ctx) =>
    HttpServer.response.stream(
      Stream.provideContext(renderToStream(fx), ctx),
      {
        ...CAMEL_CASE_CONTENT_TYPE,
        ...options,
        headers: { ...HYPHENATED_CONTENT_TYPE, ...options?.headers }
      }
    )
  )
}

export function htmlResponseString(
  html: string,
  options?: HttpServer.response.Options
): HttpServer.response.ServerResponse {
  return HttpServer.response.raw(
    html,
    {
      ...CAMEL_CASE_CONTENT_TYPE,
      ...options,
      headers: { ...HYPHENATED_CONTENT_TYPE, ...options?.headers }
    }
  )
}

export function getUrlFromServerRequest(request: ServerRequest): URL {
  const { headers } = request
  const host = Headers.get(headers, "x-forwarded-host").pipe(
    Option.orElse(() => Headers.get(headers, "host")),
    Option.getOrElse(() => "localhost")
  )
  const protocol = Headers.get(headers, "x-forwarded-proto").pipe(
    Option.orElse(() => Headers.get(headers, "protocol")),
    Option.getOrElse(() => "http")
  )

  return new URL(request.url, `${protocol}://${host}`)
}
