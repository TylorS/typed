/**
 * @since 1.0.0
 */

import * as Headers from "@effect/platform/Http/Headers"
import type { ServerRequest } from "@effect/platform/Http/ServerRequest"
import * as HttpServer from "@effect/platform/HttpServer"
import type * as Fx from "@typed/fx/Fx"
import { toStream } from "@typed/fx/Stream"
import { Effect, Option, Stream } from "effect"
import { renderToHtml } from "./Html"
import type * as RenderContext from "./RenderContext"
import type { RenderEvent } from "./RenderEvent"
import type { RenderTemplate } from "./RenderTemplate"

const HTML_CONTENT_TYPE = "text/html"
const CAMEL_CASE_CONTENT_TYPE = { contentType: HTML_CONTENT_TYPE }
const HYPHENATED_CONTENT_TYPE = { "content-type": HTML_CONTENT_TYPE }

/**
 * @since 1.0.0
 */
export function htmlResponse<R, E>(
  fx: Fx.Fx<R, E, RenderEvent>,
  options?: HttpServer.response.Options
): Effect.Effect<RenderContext.RenderContext | Exclude<R, RenderTemplate>, E, HttpServer.response.ServerResponse> {
  return Effect.contextWithEffect((ctx) =>
    HttpServer.response.stream(
      Stream.provideContext(Stream.encodeText(toStream(renderToHtml(fx))), ctx),
      {
        ...CAMEL_CASE_CONTENT_TYPE,
        ...options,
        headers: { ...HYPHENATED_CONTENT_TYPE, ...options?.headers }
      }
    )
  )
}

/**
 * @since 1.0.0
 */
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

/**
 * @since 1.0.0
 */
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
