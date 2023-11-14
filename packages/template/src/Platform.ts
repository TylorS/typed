import * as HttpServer from "@effect/platform/HttpServer"
import type * as Fx from "@typed/fx/Fx"
import { renderToStream } from "@typed/template/Html"
import type * as RenderContext from "@typed/template/RenderContext"
import type { RenderEvent } from "@typed/template/RenderEvent"
import type { RenderTemplate } from "@typed/template/RenderTemplate"
import { Effect, Stream } from "effect"

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
