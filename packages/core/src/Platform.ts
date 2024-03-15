/**
 * @since 1.0.0
 */

import { FileSystem } from "@effect/platform/FileSystem"
import type { PathInput } from "@effect/platform/Http/Router"
import type { ServerRequest } from "@effect/platform/Http/ServerRequest"
import * as Http from "@effect/platform/HttpServer"
import { Path } from "@effect/platform/Path"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import { CurrentRoute, type RouteMatch, type RouteMatcher } from "@typed/router"
import { getUrlFromServerRequest, htmlResponse } from "@typed/template/Platform"
import type { RenderEvent } from "@typed/template/RenderEvent"

import type { PlatformError } from "@effect/platform/Error"
import * as Navigation from "@typed/navigation"
import type { TypedOptions } from "@typed/vite-plugin"
import type { Scope } from "effect"
import { Data, Effect, identity, Layer, Option, ReadonlyArray } from "effect"

/**
 * @since 1.0.0
 */
export class GuardsNotMatched extends Data.TaggedError("@typed/router/GuardsNotMatched")<{
  readonly request: Http.request.ServerRequest
  readonly guards: ReadonlyArray.NonEmptyReadonlyArray<RouteMatch<any, any, any, any, any, any, any>>
}> {}

/**
 * @since 1.0.0
 */
export type LayoutTemplate<
  Content extends Fx.Fx<RenderEvent | null, any, any>,
  E,
  R
> = (
  params: {
    readonly content: Content
    readonly request: ServerRequest
  }
) => Fx.Fx<RenderEvent | null, E, R>

/**
 * @since 1.0.0
 */
export function toHttpRouter<
  E,
  R,
  E2 = never,
  R2 = never
>(
  matcher: RouteMatcher<RenderEvent | null, E, R>,
  options?: {
    layout?: LayoutTemplate<Fx.Fx<RenderEvent | null, E, R>, E2, R2>
    base?: string
    environment?: "server" | "static"
  }
): Http.router.Router<
  | ServerRequest
  | Exclude<R | R2, Navigation.Navigation | CurrentRoute>,
  E | E2 | GuardsNotMatched
> {
  let router: Http.router.Router<
    | Exclude<R | R2, Navigation.Navigation | CurrentRoute>
    | ServerRequest,
    E | E2 | GuardsNotMatched
  > = Http.router.empty
  const guardsByPath = ReadonlyArray.groupBy(matcher.guards, ({ guard }) => guard.route.path)

  for (const [path, guards] of Object.entries(guardsByPath)) {
    const route = guards[0].guard.route

    router = Http.router.get(
      router,
      path as PathInput,
      Effect.flatMap(Http.request.ServerRequest, (request) => {
        const url = getUrlFromServerRequest(request)
        const path = Navigation.getCurrentPathFromUrl(url)

        return Effect.gen(function*(_) {
          yield* _(Effect.logDebug(`Attempting guards`))

          // Attempt to match a guard
          for (const guard of guards) {
            const match = yield* _(guard.guard(request.url))
            if (Option.isSome(match)) {
              yield* _(
                Effect.logDebug(`Matched guard for path`),
                Effect.annotateLogs("route.params", match.value)
              )

              const ref = yield* _(RefSubject.of(match.value))
              const content = guard.match(RefSubject.take(ref, 1))
              const params = { content, request }
              const template = Fx.unify(options?.layout ? options.layout(params) : content).pipe(
                Fx.withSpan("render_template"),
                Fx.onExit(() => Effect.annotateLogs(Effect.logDebug(`Rendered Template`), "route.params", match.value)),
                Fx.annotateSpans("route.params", match.value),
                Fx.annotateLogs("route.params", match.value)
              )

              return yield* _(htmlResponse(template))
            }
          }
          return yield* _(Effect.fail(new GuardsNotMatched({ request, guards })))
        }).pipe(
          Effect.provide(Layer.mergeAll(
            Navigation.initialMemory({ url, base: options?.base }),
            CurrentRoute.layer(route as any)
          )),
          Effect.withSpan("check_route_guards"),
          Effect.annotateSpans("route.path", path),
          Effect.annotateLogs("route.path", path)
        )
      })
    )
  }

  return router
}

export function staticFiles(
  serverOutputDirectory: string,
  enabled: boolean,
  options: TypedOptions
): <R, E>(
  self: Http.router.Router<R, E>
) => Http.router.Router<
  | FileSystem
  | Path
  | Http.platform.Platform
  | Exclude<R, Scope.Scope | Http.request.ServerRequest | Http.router.RouteContext>,
  PlatformError | E
> {
  const addStaticFileServer = Http.router.mountApp(
    `/${options.assetDirectory}`,
    Effect.gen(function*(_) {
      const request = yield* _(Http.request.ServerRequest)
      const fs = yield* _(FileSystem)
      const path = yield* _(Path)
      const filePath = path.resolve(
        serverOutputDirectory,
        path.join(options.relativeServerToClientOutputDirectory, request.url)
      )

      if (yield* _(fs.exists(filePath + ".gz"))) {
        return yield* _(
          Http.response.file(filePath + ".gz", {
            headers: Http.headers.unsafeFromRecord({ "Content-Encoding": "gzip" })
          })
        )
      }

      return yield* _(Http.response.file(filePath))
    }),
    { includePrefix: true }
  )

  return enabled ? addStaticFileServer : identity as any
}
