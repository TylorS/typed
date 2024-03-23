/// <reference types="vite/client" />
/// <reference types="@typed/vite-plugin-types" />

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
import * as Router from "@typed/router"
import { getUrlFromServerRequest, htmlResponse } from "@typed/template/Platform"
import type { RenderEvent } from "@typed/template/RenderEvent"
import assetManifest from "virtual:asset-manifest"
import * as typedOptions from "virtual:typed-options"
import { getHeadAndScript } from "./Vite.js"

import type { PlatformError } from "@effect/platform/Error"
import * as Navigation from "@typed/navigation"
import type { RouteInput } from "@typed/route"
import type { RenderContext, RenderQueue, RenderTemplate } from "@typed/template"
import type { TypedOptions } from "@typed/vite-plugin"
import type { Scope } from "effect"
import { Data, Effect, identity, Layer, Option, ReadonlyArray } from "effect"

/**
 * @since 1.0.0
 */
export class GuardsNotMatched extends Data.TaggedError("@typed/router/GuardsNotMatched")<{
  readonly request: Http.request.ServerRequest
  readonly route: RouteInput<any, any, any, any>
  readonly guards: ReadonlyArray.NonEmptyReadonlyArray<Router.RouteMatch<any, any, any, any, any, any, any>>
}> {}

/**
 * @since 1.0.0
 */
export type LayoutParams<Content extends Fx.Fx<RenderEvent | null, any, any>> = {
  readonly content: Content
  readonly request: ServerRequest
  readonly head: Fx.Fx<
    RenderEvent | null,
    never,
    RenderContext.RenderContext | RenderQueue.RenderQueue | RenderTemplate | Scope.Scope
  >
  readonly script: Fx.Fx<
    RenderEvent | null,
    never,
    RenderContext.RenderContext | RenderQueue.RenderQueue | RenderTemplate | Scope.Scope
  >
}

/**
 * @since 1.0.0
 */
export type LayoutTemplate<
  Content extends Fx.Fx<RenderEvent | null, any, any>,
  E,
  R
> = (
  params: LayoutParams<Content>
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
  matcher: Router.RouteMatcher<RenderEvent | null, E, R>,
  options?: {
    layout?: LayoutTemplate<Fx.Fx<RenderEvent | null, E, R>, E2, R2>
    base?: string
    environment?: "server" | "static"
  }
): Http.router.Router<
  | ServerRequest
  | Exclude<R | R2, Navigation.Navigation | Router.CurrentRoute>,
  E | E2 | GuardsNotMatched
> {
  let router: Http.router.Router<
    | Exclude<R | R2, Navigation.Navigation | Router.CurrentRoute>
    | ServerRequest,
    E | E2 | GuardsNotMatched
  > = Http.router.empty
  const guardsByPath = ReadonlyArray.groupBy(matcher.guards, ({ guard }) => guard.route.path)
  const { head, script } = getHeadAndScript(typedOptions.clientEntry, assetManifest)

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
              const template = Fx.unify(options?.layout ? options.layout({ content, request, head, script }) : content)
                .pipe(
                  Fx.withSpan("render_template"),
                  Fx.onExit((exit) =>
                    exit.pipe(
                      Effect.matchCauseEffect({
                        onFailure: (cause) => Effect.logError(`Failed to render Template`, cause),
                        onSuccess: () => Effect.logDebug(`Rendered Template`)
                      }),
                      Effect.annotateLogs("route.params", match.value)
                    )
                  ),
                  Fx.annotateSpans("route.params", match.value),
                  Fx.annotateLogs("route.params", match.value)
                )

              return yield* _(htmlResponse(template))
            }
          }
          return yield* _(Effect.fail(new GuardsNotMatched({ request, route, guards })))
        }).pipe(
          Effect.provide(
            Layer.mergeAll(
              Navigation.initialMemory({ url, base: options?.base }),
              Router.layer(route as any)
            )
          ),
          Effect.withSpan("check_route_guards"),
          Effect.annotateSpans("route.path", path),
          Effect.annotateLogs("route.path", path)
        )
      })
    )
  }

  return router
}

/**
 * A very simple static file middleware with support for gzip'd files.
 *
 * @since 1.0.0
 */
export function staticFiles(
  { cacheControl, enabled, options, serverOutputDirectory }: {
    serverOutputDirectory: string
    enabled: boolean
    options: TypedOptions
    cacheControl?: (filePath: string) => {
      readonly maxAge: number
      readonly immutable?: boolean
    }
  }
): <R, E>(
  self: Http.app.Default<R, E>
) => Effect.Effect<
  Http.response.ServerResponse,
  E | PlatformError,
  ServerRequest | R | Http.platform.Platform | FileSystem | Path
> {
  if (!enabled) {
    return identity
  }

  return <R, E>(
    self: Http.app.Default<R, E>
  ): Http.app.Default<
    ServerRequest | Http.platform.Platform | FileSystem | Path | R,
    E | PlatformError
  > =>
    Effect.gen(function*(_) {
      const request = yield* _(Http.request.ServerRequest)
      const fs = yield* _(FileSystem)
      const path = yield* _(Path)
      // TODO: We should probably modify the request url to also look for html files
      const filePath = path.resolve(
        serverOutputDirectory,
        path.join(options.relativeServerToClientOutputDirectory, request.url)
      )
      const gzipFilePath = filePath + ".gz"

      if (yield* _(isFile(fs, gzipFilePath))) {
        return yield* _(
          Http.response.file(gzipFilePath, {
            headers: Http.headers.unsafeFromRecord(gzipHeaders(filePath, cacheControl))
          })
        )
      } else if (yield* _(isFile(fs, filePath))) {
        return yield* _(Http.response.file(filePath, {
          headers: Http.headers.unsafeFromRecord(cacheControlHeaders(filePath, cacheControl))
        }))
      } else {
        return yield* _(self)
      }
    })
}

function isFile(fs: FileSystem, path: string) {
  return fs.stat(path).pipe(
    Effect.map((stat) => stat.type === "File"),
    Effect.catchAll(() => Effect.succeed(false))
  )
}

function gzipHeaders(filePath: string, cacheControl?: (filePath: string) => { maxAge: number; immutable?: boolean }) {
  return {
    "Content-Encoding": "gzip",
    ...cacheControlHeaders(filePath, cacheControl)
  }
}

function cacheControlHeaders(
  filePath: string,
  cacheControl?: (filePath: string) => { maxAge: number; immutable?: boolean }
) {
  if (!cacheControl) {
    return {}
  }
  const { immutable, maxAge } = cacheControl(filePath)

  return {
    "Cache-Control": `${immutable ? "public, " : ""}max-age=${maxAge}`
  }
}
