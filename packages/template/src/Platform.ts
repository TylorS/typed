import * as HttpServer from "@effect/platform/HttpServer"
import type * as Fx from "@typed/fx/Fx"
import { renderToStream } from "@typed/template/Html"
import type * as RenderContext from "@typed/template/RenderContext"
import type { RenderEvent } from "@typed/template/RenderEvent"
import type { RenderTemplate } from "@typed/template/RenderTemplate"
import { Effect, Stream } from "effect"

export function htmlResponse<R, E>(
  fx: Fx.Fx<R, E, RenderEvent>,
  options?: HttpServer.response.Options
): Effect.Effect<RenderContext.RenderContext | Exclude<R, RenderTemplate>, E, HttpServer.response.ServerResponse> {
  return Effect.contextWithEffect((ctx) =>
    HttpServer.response.stream(
      renderToStream(fx).pipe(Stream.provideContext(ctx)),
      { contentType: "text/html", ...options, headers: { "content-type": "text/html", ...options?.headers } }
    )
  )
}
