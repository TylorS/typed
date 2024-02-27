/**
 * @since 1.0.0
 */

import type { PathInput } from "@effect/platform/Http/Router"
import type { ServerRequest } from "@effect/platform/Http/ServerRequest"
import * as HttpServer from "@effect/platform/HttpServer"
import type { Fx } from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import type { RouteGuard, RouteMatcher } from "@typed/router"
import type { RenderContext, RenderTemplate } from "@typed/template"
import { htmlResponse } from "@typed/template/Platform"
import type { RenderEvent } from "@typed/template/RenderEvent"

import type { Scope } from "effect"
import { Data, Effect, Option, ReadonlyArray } from "effect"

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
  layout?: (content: Fx<RenderEvent, E, R>) => Fx<RenderEvent, E2, R2>
): HttpServer.router.Router<
  R | R2 | RenderTemplate | RenderContext.RenderContext | ServerRequest | Scope.Scope,
  E | E2 | GuardsNotMatched
> {
  let router: HttpServer.router.Router<
    R | R2 | RenderTemplate | RenderContext.RenderContext | ServerRequest | Scope.Scope,
    E | E2 | GuardsNotMatched
  > = HttpServer.router.empty
  const guardsByPath = ReadonlyArray.groupBy(matcher.guards, (guard) => guard.route.path)

  for (const [path, guards] of Object.entries(guardsByPath)) {
    router = HttpServer.router.get(
      router,
      path as PathInput,
      Effect.gen(function*(_) {
        const request = yield* _(HttpServer.request.ServerRequest)

        // Attempt to match a guard
        for (const guard of guards) {
          const match = yield* _(guard.guard(request.url))
          if (Option.isSome(match)) {
            const ref = yield* _(RefSubject.of(match.value))
            const renderable = guard.match(ref)
            return yield* _(htmlResponse<E | E2, R | R2>(layout ? layout(renderable) : renderable))
          }
        }
        return yield* _(Effect.fail(new GuardsNotMatched({ request, guards })))
      })
    )
  }

  return router
}
