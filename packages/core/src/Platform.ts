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

import type { BadArgument, PlatformError } from "@effect/platform/Error"
import * as Navigation from "@typed/navigation"
import type { Route } from "@typed/route"
import type { RenderContext, RenderQueue, RenderTemplate } from "@typed/template"
import type { TypedOptions } from "@typed/vite-plugin"
import type { Scope } from "effect"
import { Data, Effect, identity, Layer, Option, Array } from "effect"

/**
 * @since 1.0.0
 */
export class GuardsNotMatched extends Data.TaggedError("@typed/router/GuardsNotMatched")<{
  readonly request: Http.request.ServerRequest
  readonly route: Route.Any
  readonly matches: Array.NonEmptyReadonlyArray<Router.RouteMatch.RouteMatch.Any>
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
  M extends Router.RouteMatch.RouteMatch<Route.Any, any, any, any, RenderEvent | null, any, any>,
  E2 = never,
  R2 = never
>(
  matcher: Router.RouteMatcher<M>,
  options?: {
    layout?: LayoutTemplate<
      Fx.Fx<RenderEvent | null, Router.RouteMatch.RouteMatch.Error<M>, Router.RouteMatch.RouteMatch.Context<M>>,
      E2,
      R2
    >
    base?: string
    environment?: "server" | "static"
  }
): Http.router.Router<
  | ServerRequest
  | Exclude<Router.RouteMatch.RouteMatch.Context<M> | R2, Navigation.Navigation | Router.CurrentRoute>,
  Router.RouteMatch.RouteMatch.Error<M> | E2 | GuardsNotMatched
> {
  let router: Http.router.Router<
    | Exclude<Router.RouteMatch.RouteMatch.Context<M> | R2, Navigation.Navigation | Router.CurrentRoute>
    | ServerRequest,
    Router.RouteMatch.RouteMatch.Error<M> | E2 | GuardsNotMatched
  > = Http.router.empty
  const guardsByPath = Array.groupBy(matcher.matches, ({ route }) => route.path)
  const { head, script } = getHeadAndScript(typedOptions.clientEntry, assetManifest)

  for (const [path, matches] of Object.entries(guardsByPath)) {
    const route = matches[0].route

    router = Http.router.get(
      router,
      path as PathInput,
      Effect.flatMap(Http.request.ServerRequest, (request) => {
        const url = getUrlFromServerRequest(request)
        const path = Navigation.getCurrentPathFromUrl(url)

        return Effect.gen(function*(_) {
          yield* _(Effect.logDebug(`Attempting guards`))

          // Attempt to match a guard
          for (const match of matches) {
            const matched = yield* _(match.guard(request.url))
            if (Option.isSome(matched)) {
              yield* _(
                Effect.logDebug(`Matched guard for path`),
                Effect.annotateLogs("route.params", matched.value)
              )

              const ref = yield* _(RefSubject.of(matched.value))
              const content = match.match(RefSubject.take(ref, 1))
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

              return yield* _(htmlResponse(template))
            }
          }
          return yield* _(Effect.fail(new GuardsNotMatched({ request, route, matches })))
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
): <E, R>(
  self: Http.app.Default<E, R>
) => Effect.Effect<
  Http.response.ServerResponse,
  E  | BadArgument | PlatformError,
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
    "Content-Type": getContentType(filePath.slice(0, -3)),
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
    "Cache-Control": `${immutable ? "public, " : ""}max-age=${maxAge}`,
  }
}

const mimeTypesToExtensions = {
  "application/atom+xml": ["atom"],
  "application/java-archive": ["jar","war","ear"],
  "application/javascript": ["js"],
  "application/json": ["json"],
  "application/mac-binhex40": ["hqx"],
  "application/msword": ["doc"],
  "application/octet-stream": ["bin","exe","dll","deb","dmg","iso","img","msi","msp","msm"],
  "application/pdf": ["pdf"],
  "application/postscript": ["ps","eps","ai"],
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
  "application/x-perl": ["pl","pm"],
  "application/x-pilot": ["prc","pdb"],
  "application/x-rar-compressed": ["rar"],
  "application/x-redhat-package-manager": ["rpm"],
  "application/x-sea": ["sea"],
  "application/x-shockwave-flash": ["swf"],
  "application/x-stuffit": ["sit"],
  "application/x-tcl": ["tcl","tk"],
  "application/x-x509-ca-cert": ["der","pem","crt"],
  "application/x-xpinstall": ["xpi"],
  "application/xhtml+xml": ["xhtml"],
  "application/xspf+xml": ["xspf"],
  "application/zip": ["zip"],
  "audio/midi": ["mid","midi","kar"],
  "audio/mpeg": ["mp3"],
  "audio/ogg": ["ogg"],
  "audio/x-m4a": ["m4a"],
  "audio/x-realaudio": ["ra"],
  "font/woff": ["woff"],
  "font/woff2": ["woff2"],
  "image/avif": ["avif"],
  "image/gif": ["gif"],
  "image/jpeg": ["jpeg","jpg"],
  "image/png": ["png"],
  "image/svg+xml": ["svg","svgz"],
  "image/tiff": ["tif","tiff"],
  "image/vnd.wap.wbmp": ["wbmp"],
  "image/webp": ["webp"],
  "image/x-icon": ["ico"],
  "image/x-jng": ["jng"],
  "image/x-ms-bmp": ["bmp"],
  "text/css": ["css"],
  "text/html": ["html","htm","shtml"],
  "text/mathml": ["mml"],
  "text/plain": ["txt"],
  "text/vnd.sun.j2me.app-descriptor": ["jad"],
  "text/vnd.wap.wml": ["wml"],
  "text/x-component": ["htc"],
  "text/xml": ["xml"],
  "video/3gpp": ["3gpp","3gp"],
  "video/mp2t": ["ts"],
  "video/mp4": ["mp4"],
  "video/mpeg": ["mpeg","mpg"],
  "video/quicktime": ["mov"],
  "video/webm": ["webm"],
  "video/x-flv": ["flv"],
  "video/x-m4v": ["m4v"],
  "video/x-mng": ["mng"],
  "video/x-ms-asf": ["asx","asf"],
  "video/x-ms-wmv": ["wmv"],
  "video/x-msvideo": ["avi"],
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
  return extensionsToMimeTypes[extension] ?? "application/octet-stream"
}
