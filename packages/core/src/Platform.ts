/**
 * @since 1.0.0
 */

/// <reference types="vite/client" />
/// <reference types="@typed/vite-plugin-types" />

import { FileSystem } from "@effect/platform/FileSystem"
import type { PathInput } from "@effect/platform/Http/Router"
import type { ServerRequest } from "@effect/platform/Http/ServerRequest"
import * as Http from "@effect/platform/HttpServer"
import { Path } from "@effect/platform/Path"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Router from "@typed/router"
import { RouteHandler, ServerRouter } from "@typed/server"
import { getUrlFromServerRequest, htmlResponse } from "@typed/template/Platform"
import type { RenderEvent } from "@typed/template/RenderEvent"
import assetManifest from "virtual:asset-manifest"
import * as typedOptions from "virtual:typed-options"
import { getHeadAndScript } from "./Vite.js"

import type { BadArgument, PlatformError } from "@effect/platform/Error"
import * as Navigation from "@typed/navigation"
import * as Route from "@typed/route"
import type { RenderContext, RenderQueue, RenderTemplate } from "@typed/template"
import type { TypedOptions } from "@typed/vite-plugin"
import * as Array from "effect/Array"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import { identity } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import type * as Scope from "effect/Scope"

/**
 * @since 1.0.0
 */
export class GuardsNotMatched extends Data.TaggedError("GuardsNotMatched")<{
  readonly request: Http.request.ServerRequest
  readonly route: Route.Route.Any
  readonly matches: Array.NonEmptyReadonlyArray<Router.RouteMatch.RouteMatch.Any>
}> {}

/**
 * @since 1.0.0
 */
export type LayoutParams<Content extends Fx.Fx<RenderEvent | null, any, any>> = {
  readonly content: Content
  readonly request: ServerRequest
  readonly head:
    | Fx.Fx<
      RenderEvent | null,
      never,
      RenderContext.RenderContext | RenderQueue.RenderQueue | RenderTemplate | Scope.Scope
    >
    | null
  readonly script:
    | Fx.Fx<
      RenderEvent | null,
      never,
      RenderContext.RenderContext | RenderQueue.RenderQueue | RenderTemplate | Scope.Scope
    >
    | null
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
  M extends Router.RouteMatch.RouteMatch<Route.Route.Any, any, any, any, RenderEvent | null, any, any>,
  E2 = never,
  R2 = never
>(
  matcher: Router.RouteMatcher<M>,
  options?: {
    clientEntry?: string
    layout?: LayoutTemplate<
      Fx.Fx<RenderEvent | null, Router.RouteMatch.RouteMatch.Error<M>, Router.RouteMatch.RouteMatch.Context<M>>,
      E2,
      R2
    >
    base?: string
    environment?: "server" | "static"
  }
): Http.router.Router<
  Router.RouteMatch.RouteMatch.Error<M> | E2 | GuardsNotMatched,
  | ServerRequest
  | Exclude<Router.RouteMatch.RouteMatch.Context<M> | R2, Navigation.Navigation | Router.CurrentRoute>
> {
  let router: Http.router.Router<
    Router.RouteMatch.RouteMatch.Error<M> | E2 | GuardsNotMatched,
    | Exclude<Router.RouteMatch.RouteMatch.Context<M> | R2, Navigation.Navigation | Router.CurrentRoute>
    | ServerRequest
  > = Http.router.empty
  const guardsByPath = Array.groupBy(matcher.matches, ({ route }) => {
    const withoutQuery = route.path.split("?")[0]
    return withoutQuery.endsWith("\\") ? withoutQuery.slice(0, -1) : withoutQuery
  })
  const { head, script } = options?.clientEntry ?
    getHeadAndScript(typedOptions.clientEntries[options.clientEntry], assetManifest) :
    {
      head: null,
      script: null
    }
  const baseRoute = Route.parse(options?.base ?? "/")
  for (const [path, matches] of Object.entries(guardsByPath)) {
    const route = matches[0].route

    router = Http.router.get(
      router,
      path as PathInput,
      Effect.flatMap(Http.request.ServerRequest, (request) => {
        const url = getUrlFromServerRequest(request)
        const path = Navigation.getCurrentPathFromUrl(url)

        return Effect.gen(function*() {
          yield* Effect.logDebug(`Attempting guards`)

          // Attempt to match a guard
          for (const match of matches) {
            const matched = yield* match.guard(path)
            if (Option.isSome(matched)) {
              yield* Effect.logDebug(`Matched guard for path`), Effect.annotateLogs("route.params", matched.value)

              const ref = yield* RefSubject.of(matched.value)
              const content = match.match(RefSubject.take(ref, 1)).pipe(Fx.provide(Router.layer(route)))
              const template = Fx.unify(options?.layout ? options.layout({ content, request, head, script }) : content)
                .pipe(
                  Fx.withSpan("render_template"),
                  Fx.onExit((exit) =>
                    exit.pipe(
                      Effect.matchCauseEffect({
                        onFailure: (cause) => Effect.logError(`Failed to render Template`, cause),
                        onSuccess: () => Effect.logDebug(`Rendered Template`)
                      }),
                      Effect.annotateLogs("route.params", matched.value)
                    )
                  ),
                  Fx.annotateSpans("route.params", matched.value),
                  Fx.annotateLogs("route.params", matched.value)
                )

              return yield* htmlResponse(template)
            }
          }
          return yield* Effect.fail(new GuardsNotMatched({ request, route, matches }))
        }).pipe(
          Effect.provide(
            Layer.mergeAll(
              Navigation.initialMemory({ url, base: options?.base }),
              Router.layer(baseRoute)
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
): <E, R>(
  self: Http.app.Default<E, R>
) => Effect.Effect<
  Http.response.ServerResponse,
  E | BadArgument | PlatformError,
  ServerRequest | R | Http.platform.Platform | FileSystem | Path
> {
  if (!enabled) {
    return identity as any
  }

  return <E, R>(
    self: Http.app.Default<E, R>
  ): Http.app.Default<
    E | BadArgument | PlatformError,
    ServerRequest | Http.platform.Platform | FileSystem | Path | R
  > =>
    Effect.gen(function*() {
      const request = yield* Http.request.ServerRequest
      const fs = yield* FileSystem
      const path = yield* Path
      // TODO: We should probably modify the request url to also look for html files
      const filePath = path.resolve(
        serverOutputDirectory,
        path.join(options.relativeServerToClientOutputDirectory, request.url)
      )
      const gzipFilePath = filePath + ".gz"

      if (yield* isFile(fs, gzipFilePath)) {
        return yield* Http.response.file(gzipFilePath, {
          headers: Http.headers.unsafeFromRecord(gzipHeaders(filePath, cacheControl)),
          contentType: getContentType(filePath)
        })
      } else if (yield* isFile(fs, filePath)) {
        // TODO: We should support gzip'ing files on the fly
        return yield* Http.response.file(filePath, {
          headers: Http.headers.unsafeFromRecord(cacheControlHeaders(filePath, cacheControl))
        })
      } else {
        return yield* self
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
    "content-encoding": "gzip",
    "content-type": getContentType(filePath),
    ...cacheControlHeaders(filePath, cacheControl)
  }
}

function cacheControlHeaders(
  filePath: string,
  cacheControl?: (filePath: string) => { maxAge: number; immutable?: boolean }
): { "cache-control"?: string } {
  if (!cacheControl) {
    return {}
  }
  const { immutable, maxAge } = cacheControl(filePath)

  return {
    "cache-control": `${immutable ? "public, " : ""}max-age=${maxAge}`
  }
}

const mimeTypesToExtensions = {
  "application/atom+xml": ["atom"],
  "application/java-archive": ["jar", "war", "ear"],
  "application/javascript": ["js"],
  "application/json": ["json"],
  "application/mac-binhex40": ["hqx"],
  "application/msword": ["doc"],
  "application/octet-stream": ["bin", "exe", "dll", "deb", "dmg", "iso", "img", "msi", "msp", "msm"],
  "application/pdf": ["pdf"],
  "application/postscript": ["ps", "eps", "ai"],
  "application/rss+xml": ["rss"],
  "application/rtf": ["rtf"],
  "application/vnd.apple.mpegurl": ["m3u8"],
  "application/vnd.google-earth.kml+xml": ["kml"],
  "application/vnd.google-earth.kmz": ["kmz"],
  "application/vnd.ms-excel": ["xls"],
  "application/vnd.ms-fontobject": ["eot"],
  "application/vnd.ms-powerpoint": ["ppt"],
  "application/vnd.oasis.opendocument.graphics": ["odg"],
  "application/vnd.oasis.opendocument.presentation": ["odp"],
  "application/vnd.oasis.opendocument.spreadsheet": ["ods"],
  "application/vnd.oasis.opendocument.text": ["odt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["pptx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "application/vnd.wap.wmlc": ["wmlc"],
  "application/wasm": ["wasm"],
  "application/x-7z-compressed": ["7z"],
  "application/x-cocoa": ["cco"],
  "application/x-java-archive-diff": ["jardiff"],
  "application/x-java-jnlp-file": ["jnlp"],
  "application/x-makeself": ["run"],
  "application/x-perl": ["pl", "pm"],
  "application/x-pilot": ["prc", "pdb"],
  "application/x-rar-compressed": ["rar"],
  "application/x-redhat-package-manager": ["rpm"],
  "application/x-sea": ["sea"],
  "application/x-shockwave-flash": ["swf"],
  "application/x-stuffit": ["sit"],
  "application/x-tcl": ["tcl", "tk"],
  "application/x-x509-ca-cert": ["der", "pem", "crt"],
  "application/x-xpinstall": ["xpi"],
  "application/xhtml+xml": ["xhtml"],
  "application/xspf+xml": ["xspf"],
  "application/zip": ["zip"],
  "audio/midi": ["mid", "midi", "kar"],
  "audio/mpeg": ["mp3"],
  "audio/ogg": ["ogg"],
  "audio/x-m4a": ["m4a"],
  "audio/x-realaudio": ["ra"],
  "font/woff": ["woff"],
  "font/woff2": ["woff2"],
  "image/avif": ["avif"],
  "image/gif": ["gif"],
  "image/jpeg": ["jpeg", "jpg"],
  "image/png": ["png"],
  "image/svg+xml": ["svg", "svgz"],
  "image/tiff": ["tif", "tiff"],
  "image/vnd.wap.wbmp": ["wbmp"],
  "image/webp": ["webp"],
  "image/x-icon": ["ico"],
  "image/x-jng": ["jng"],
  "image/x-ms-bmp": ["bmp"],
  "text/css": ["css"],
  "text/html": ["html", "htm", "shtml"],
  "text/mathml": ["mml"],
  "text/plain": ["txt"],
  "text/vnd.sun.j2me.app-descriptor": ["jad"],
  "text/vnd.wap.wml": ["wml"],
  "text/x-component": ["htc"],
  "text/xml": ["xml"],
  "video/3gpp": ["3gpp", "3gp"],
  "video/mp2t": ["ts"],
  "video/mp4": ["mp4"],
  "video/mpeg": ["mpeg", "mpg"],
  "video/quicktime": ["mov"],
  "video/webm": ["webm"],
  "video/x-flv": ["flv"],
  "video/x-m4v": ["m4v"],
  "video/x-mng": ["mng"],
  "video/x-ms-asf": ["asx", "asf"],
  "video/x-ms-wmv": ["wmv"],
  "video/x-msvideo": ["avi"]
}

const extensionsToMimeTypes = Object.entries(mimeTypesToExtensions).reduce(
  (acc, [mimeType, extensions]) => {
    for (const extension of extensions) {
      acc[extension] = mimeType
    }
    return acc
  },
  {} as Record<string, string>
)

/**
 * @since 1.0.0
 */
export const getContentType = (filePath: string) => {
  const extension = filePath.split(".").pop() ?? ""
  return extensionsToMimeTypes[extension]
}

/**
 * @since 1.0.0
 */
export function toServerRouter<
  M extends Router.RouteMatch.RouteMatch<Route.Route.Any, any, any, any, RenderEvent | null, any, any>,
  E2 = never,
  R2 = never
>(
  matcher: Router.RouteMatcher<M>,
  options?: {
    clientEntry?: string
    layout?: LayoutTemplate<
      Fx.Fx<RenderEvent | null, Router.RouteMatch.RouteMatch.Error<M>, Router.RouteMatch.RouteMatch.Context<M>>,
      E2,
      R2
    >
    base?: string
  }
): ServerRouter.Router<
  Router.RouteMatch.RouteMatch.Error<M> | E2 | GuardsNotMatched,
  | ServerRequest
  | Exclude<Router.RouteMatch.RouteMatch.Context<M> | R2, Navigation.Navigation | Router.CurrentRoute>
> {
  let router: ServerRouter.Router<
    Router.RouteMatch.RouteMatch.Error<M> | E2 | GuardsNotMatched,
    | Exclude<Router.RouteMatch.RouteMatch.Context<M> | R2, Navigation.Navigation | Router.CurrentRoute>
    | ServerRequest
  > = ServerRouter.empty
  const guardsByPath = Array.groupBy(matcher.matches, ({ route }) => {
    const withoutQuery = route.path.split("?")[0]
    return withoutQuery.endsWith("\\") ? withoutQuery.slice(0, -1) : withoutQuery
  })
  const { head, script } = options?.clientEntry ?
    getHeadAndScript(typedOptions.clientEntries[options.clientEntry], assetManifest) :
    {
      head: null,
      script: null
    }
  const baseRoute = Route.parse(options?.base ?? "/")

  for (const [path, matches] of Object.entries(guardsByPath)) {
    if (matches.length === 1) {
      router = ServerRouter.addHandler(router, fromMatches(baseRoute, matches[0].route, matches, head, script, options))
    } else {
      router = ServerRouter.addHandler(
        router,
        fromMatches(baseRoute, Route.parse(path), matches, head, script, options)
      )
    }
  }

  return router
}

const fromMatches = <R extends Route.Route.Any>(
  baseRoute: Route.Route.Any,
  route: R,
  matches: Array.NonEmptyArray<Router.RouteMatch.RouteMatch.Any>,
  head: ReturnType<typeof getHeadAndScript>["head"] | null,
  script: ReturnType<typeof getHeadAndScript>["script"] | null,
  options?: {
    layout?: LayoutTemplate<
      Fx.Fx<RenderEvent | null, any, any>,
      any,
      any
    >
    base?: string
  }
) => {
  return RouteHandler.get(
    route,
    Effect.flatMap(Http.request.ServerRequest, (request) => {
      const url = RouteHandler.getUrlFromServerRequest(request)
      const path = Navigation.getCurrentPathFromUrl(url)

      return Effect.gen(function*() {
        yield* Effect.logDebug(`Attempting guards`)

        const currentRoute = yield* Router.CurrentRoute

        for (const match of matches) {
          // Attempt to match a guard
          const matched = yield* match.guard(path)
          if (Option.isSome(matched)) {
            yield* Effect.logDebug(`Matched guard for path`), Effect.annotateLogs("route.params", matched.value)

            const ref = yield* RefSubject.of(matched.value)
            const content = match.match(RefSubject.take(ref, 1)).pipe(
              // Ensure content receives the current route
              Fx.provide(Router.CurrentRoute.layer(currentRoute))
            )
            const template = Fx.unify(
              options?.layout ?
                options.layout({ request, content, head, script }).pipe(Fx.provide(
                  // Ensure layout only receives the parent route
                  Router.CurrentRoute.layer(Option.match(currentRoute.parent, {
                    onNone: () => Router.makeCurrentRoute(Route.end),
                    onSome: identity
                  }))
                )) :
                content
            )
              .pipe(
                Fx.withSpan("render_template"),
                Fx.onExit((exit) =>
                  exit.pipe(
                    Effect.matchCauseEffect({
                      onFailure: (cause) => Effect.logError(`Failed to render Template`, cause),
                      onSuccess: () => Effect.logDebug(`Rendered Template`)
                    }),
                    Effect.annotateLogs("route.params", matched.value)
                  )
                ),
                Fx.annotateSpans("route.params", matched.value),
                Fx.annotateLogs("route.params", matched.value)
              )

            return yield* htmlResponse(template)
          }
        }

        return yield* Effect.fail(new GuardsNotMatched({ request, route, matches }))
      }).pipe(
        Effect.provide(
          Layer.mergeAll(
            Navigation.initialMemory({ url, base: options?.base }),
            Router.layer(baseRoute)
          )
        ),
        Effect.withSpan("check_route_guards"),
        Effect.annotateSpans("route.path", path),
        Effect.annotateLogs("route.path", path)
      )
    })
  )
}
