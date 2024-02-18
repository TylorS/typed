/**
 * @since 1.0.0
 */

import type { PathInput } from "@effect/platform/Http/Router"
import type { ServerRequest } from "@effect/platform/Http/ServerRequest"
import * as HttpServer from "@effect/platform/HttpServer"
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
export function toHttpRouter<E, R>(
  matcher: RouteMatcher<RenderEvent, E, R>
): HttpServer.router.Router<
  R | RenderTemplate | RenderContext.RenderContext | ServerRequest | Scope.Scope,
  E | GuardsNotMatched
> {
  let router: HttpServer.router.Router<
    R | RenderTemplate | RenderContext.RenderContext | ServerRequest | Scope.Scope,
    E | GuardsNotMatched
  > = HttpServer.router.empty
  const guardsByPath = ReadonlyArray.groupBy(matcher.guards, (guard) => guard.route.path)

  for (const [path, guards] of Object.entries(guardsByPath)) {
    router = HttpServer.router.get(
      router,
      path as PathInput,
      Effect.gen(function*(_) {
        // Attempt to match a guard
        for (const guard of guards) {
          const match = yield* _(guard.guard(path))
          if (Option.isSome(match)) {
            const renderable = guard.match(match.value)
            return yield* _(htmlResponse(renderable))
          }
        }
        const request = yield* _(HttpServer.request.ServerRequest)
        return yield* _(Effect.fail(new GuardsNotMatched({ request, guards })))
      })
    )
  }

  return router
}
