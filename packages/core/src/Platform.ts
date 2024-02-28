/**
 * @since 1.0.0
 */

import type { PathInput } from "@effect/platform/Http/Router"
import type { ServerRequest } from "@effect/platform/Http/ServerRequest"
import * as HttpServer from "@effect/platform/HttpServer"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import { CurrentRoute, type RouteGuard, type RouteMatcher } from "@typed/router"
import { RenderContext, renderHtmlTemplate, RenderTemplate } from "@typed/template"
import { htmlResponse } from "@typed/template/Platform"
import type { RenderEvent } from "@typed/template/RenderEvent"

import { CurrentEnvironment } from "@typed/environment"
import { GetRandomValues, getRandomValuesNode } from "@typed/id"
import * as Navigation from "@typed/navigation"
import { Data, Effect, Layer, Option, ReadonlyArray } from "effect"
import type { CoreServices } from "./CoreServices.js"

/**
 * @since 1.0.0
 */
export class GuardsNotMatched extends Data.TaggedError("@typed/router/GuardsNotMatched")<{
  readonly request: HttpServer.request.ServerRequest
  readonly guards: ReadonlyArray.NonEmptyReadonlyArray<RouteGuard<any, any, any, any, any, any, any>>
}> {}

/**
 * @since 1.0.0
 */
export function toHttpRouter<E, R, E2 = never, R2 = never>(
  matcher: RouteMatcher<RenderEvent, E, R>,
  options?: {
    layout?: (content: Fx.Fx<RenderEvent, E, R>) => Fx.Fx<RenderEvent, E2, R2>
    base?: string
    environment?: "server" | "static"
  }
): HttpServer.router.Router<
  Exclude<R | R2, CoreServices> | ServerRequest,
  E | E2 | GuardsNotMatched
> {
  let router: HttpServer.router.Router<
    | Exclude<R | R2, Navigation.Navigation | CurrentRoute>
    | RenderTemplate
    | RenderContext.RenderContext
    | ServerRequest,
    E | E2 | GuardsNotMatched
  > = HttpServer.router.empty
  const guardsByPath = ReadonlyArray.groupBy(matcher.guards, (guard) => guard.route.path)

  for (const [path, guards] of Object.entries(guardsByPath)) {
    const route = guards[0].route

    router = HttpServer.router.get(
      router,
      path as PathInput,
      Effect.flatMap(HttpServer.request.ServerRequest, (request) =>
        Effect.gen(function*(_) {
          yield* _(Effect.logDebug(`Attempting guards`))

          // Attempt to match a guard
          for (const guard of guards) {
            const match = yield* _(guard.guard(request.url))
            if (Option.isSome(match)) {
              yield* _(
                Effect.logDebug(`Matched guard for path`),
                Effect.annotateSpans("route.params", match.value),
                Effect.annotateLogs("route.params", match.value)
              )

              const ref = yield* _(RefSubject.of(match.value))
              const renderable = guard.match(RefSubject.take(ref, 1))
              const template = Fx.unify(options?.layout ? options.layout(renderable) : renderable).pipe(
                Fx.withSpan("render_template"),
                Fx.continueWith(() =>
                  Fx.make<never>(() =>
                    Effect.logDebug(`Rendered Tempate`).pipe(
                      Effect.annotateSpans("route.params", match.value),
                      Effect.annotateLogs("route.params", match.value)
                    )
                  )
                ),
                Fx.annotateSpans("route.params", match.value),
                Fx.annotateLogs("route.params", match.value)
              )

              return yield* _(htmlResponse(template))
            }
          }
          return yield* _(Effect.fail(new GuardsNotMatched({ request, guards })))
        }).pipe(
          Effect.provide(Layer.mergeAll(
            Navigation.initialMemory({ url: request.url, base: options?.base }),
            CurrentRoute.layer(route as any)
          )),
          Effect.withSpan("check_route_guards"),
          Effect.annotateSpans("route.path", path),
          Effect.annotateLogs("route.path", path)
        ))
    )
  }

  return router.pipe(
    HttpServer.router.provideServiceEffect(
      GetRandomValues,
      Effect.map(
        Effect.promise(() => import("node:crypto")),
        (crypto) => (length: number) => Effect.succeed(getRandomValuesNode(crypto, length))
      )
    ),
    HttpServer.router.provideService(CurrentEnvironment, CurrentEnvironment.of(options?.environment ?? "server")),
    HttpServer.router.provideServiceEffect(RenderTemplate, RenderContext.RenderContext.with(renderHtmlTemplate)),
    HttpServer.router.provideServiceEffect(
      RenderContext.RenderContext,
      RenderContext.make({ environment: options?.environment ?? "server" })
    )
  ) as HttpServer.router.Router<
    Exclude<R | R2, CoreServices> | ServerRequest,
    E | E2 | GuardsNotMatched
  >
}
