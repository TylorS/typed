/**
 * @since 1.0.0
 */

import type { HttpServerRequest } from "@effect/platform"
import { Headers, HttpServerResponse } from "@effect/platform"
import type * as Fx from "@typed/fx/Fx"
import { toStream } from "@typed/fx/Stream"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import * as Stream from "effect/Stream"
import { renderToHtml } from "./Html.js"
import type { RenderEvent } from "./RenderEvent.js"

const HTML_CONTENT_TYPE = "text/html"
const CAMEL_CASE_CONTENT_TYPE = { contentType: HTML_CONTENT_TYPE }
const HYPHENATED_CONTENT_TYPE = { "content-type": HTML_CONTENT_TYPE }

/**
 * @since 1.0.0
 */
export function htmlResponse<E, R>(
  fx: Fx.Fx<RenderEvent | null, E, R>,
  options?: HttpServerResponse.Options
): Effect.Effect<HttpServerResponse.HttpServerResponse, E, R> {
  return Effect.contextWithEffect((ctx) =>
    HttpServerResponse.stream(
      Stream.provideContext(Stream.encodeText(toStream(renderToHtml(fx))), ctx),
      {
        ...CAMEL_CASE_CONTENT_TYPE,
        ...options,
        headers: Headers.unsafeFromRecord({ ...HYPHENATED_CONTENT_TYPE, ...options?.headers })
      }
    )
  )
}

/**
 * @since 1.0.0
 */
export function htmlResponseString(
  html: string,
  options?: HttpServerResponse.Options
): HttpServerResponse.HttpServerResponse {
  return HttpServerResponse.raw(
    html,
    {
      ...CAMEL_CASE_CONTENT_TYPE,
      ...options,
      headers: Headers.unsafeFromRecord({ ...HYPHENATED_CONTENT_TYPE, ...options?.headers })
    }
  )
}

/**
 * @since 1.0.0
 */
export function getUrlFromServerRequest(request: HttpServerRequest.HttpServerRequest): URL {
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
