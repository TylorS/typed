/**
 * @since 1.0.0
 */

import type { HttpApp, HttpMethod, HttpServerError, HttpServerResponse } from "@effect/platform"
import { HttpRouter, HttpServerRespondable } from "@effect/platform"
import type * as Navigation from "@typed/navigation"
import * as Route from "@typed/route"
import type * as TypedRouter from "@typed/router"
import * as MatchInput from "@typed/router/MatchInput"
import type * as Cause from "effect/Cause"
import * as Chunk from "effect/Chunk"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import * as Option from "effect/Option"
import * as HttpRouteHandler from "./HttpRouteHandler.js"
import { RouterImpl, RouterTypeId, runRouteMatcher, setupRouteContext } from "./internal/router.js"

/**
 * @since 1.0.0
 */
export interface HttpRouter<E, R> extends
  HttpApp.Default<
    E | HttpServerError.HttpServerError,
    TypedRouter.CurrentRoute | Exclude<R, HttpRouteHandler.CurrentParams<any> | Navigation.Navigation>
  >
{
  readonly [RouterTypeId]: RouterTypeId
  readonly routes: Chunk.Chunk<HttpRouteHandler.RouteHandler<MatchInput.MatchInput.Any, E, R>>
  readonly mounts: Chunk.Chunk<Mount<E, R>>
}

/**
 * @since 1.0.0
 */
export class Mount<E, R> {
  constructor(
    readonly prefix: MatchInput.MatchInput.Any,
    readonly app: HttpApp.Default<E, R>,
    readonly options?: { readonly includePrefix?: boolean | undefined }
  ) {}
}

/**
 * @since 1.0.0
 */
export const empty: HttpRouter<never, never> = new RouterImpl(Chunk.empty(), Chunk.empty())

/**
 * @since 1.0.0
 */
export const addHandler: {
  <I extends HttpRouteHandler.RouteHandler.Any>(
    handler: I
  ): <E, R>(
    router: HttpRouter<E, R>
  ) => HttpRouter<
    E | HttpRouteHandler.RouteHandler.Error<I>,
    R | HttpRouteHandler.RouteHandler.Context<I>
  >

  <E, R, I extends HttpRouteHandler.RouteHandler.Any>(
    router: HttpRouter<E, R>,
    handler: I
  ): HttpRouter<
    E | HttpRouteHandler.RouteHandler.Error<I>,
    R | HttpRouteHandler.RouteHandler.Context<I>
  >
} = dual(2, <E, R, I extends HttpRouteHandler.RouteHandler.Any>(
  router: HttpRouter<E, R>,
  handler: I
): HttpRouter<
  E | HttpRouteHandler.RouteHandler.Error<I>,
  R | HttpRouteHandler.RouteHandler.Context<I>
> => {
  return new RouterImpl<
    E | HttpRouteHandler.RouteHandler.Error<I>,
    R | HttpRouteHandler.RouteHandler.Context<I>,
    E,
    R
  >(
    Chunk.append(router.routes, handler),
    router.mounts
  )
})

const make = (method: HttpMethod.HttpMethod | "*") =>
<I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => addHandler(HttpRouteHandler.make(method)(route, handler))

/**
 * @since 1.0.0
 */
export const get: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E2 | E | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, HttpRouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
> = make("GET")

/**
 * @since 1.0.0
 */
export const post: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E2 | E | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, HttpRouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
> = make("POST")

/**
 * @since 1.0.0
 */
export const put: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E2 | E | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, HttpRouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
> = make("PUT")

const delete_: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E | E2 | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, HttpRouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
> = make("DELETE")

export {
  /**
   * @since 1.0.0
   */
  delete_ as delete
}

/**
 * @since 1.0.0
 */
export const patch: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  HttpRouteHandler.RouteNotMatched | E2 | E | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, HttpRouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
> = make("PATCH")

/**
 * @since 1.0.0
 */
export const options: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E2 | E | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, HttpRouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
> = make("OPTIONS")

/**
 * @since 1.0.0
 */
export const head: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E2 | E | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, HttpRouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
> = make("HEAD")

/**
 * @since 1.0.0
 */
export const all: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: HttpRouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: HttpRouter<E, R>
) => HttpRouter<
  E2 | E | HttpRouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, HttpRouteHandler.CurrentParams<I>>, Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, Navigation.Navigation>
> = make("*")

/**
 * @since 1.0.0
 */
export const mountApp: {
  <Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
    prefix: Prefix,
    app: HttpApp.Default<E2, R2>,
    options?: { includePrefix?: boolean | undefined }
  ): <E, R>(router: HttpRouter<E, R>) => HttpRouter<E2 | E, R2 | R>

  <E, R, Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
    router: HttpRouter<E, R>,
    prefix: Prefix,
    app: HttpApp.Default<E2, R2>,
    options?: { includePrefix?: boolean | undefined }
  ): HttpRouter<E | E2, R | R2>
} = dual(
  (args) => typeof args[0] === "object" && RouterTypeId in args[0],
  <E, R, Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
    router: HttpRouter<E, R>,
    prefix: Prefix,
    app: HttpApp.Default<E2, R2>,
    options?: { includePrefix?: boolean | undefined }
  ): HttpRouter<E | E2, R | R2> => {
    const prefixRoute = getRouteGuard(prefix)

    return new RouterImpl<E | E2, R | R2, E, R>(
      router.routes,
      Chunk.append(
        router.mounts,
        new Mount(
          prefixRoute,
          app,
          options
        )
      )
    )
  }
)

/**
 * @since 1.0.0
 */
export const mount: {
  <Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
    prefix: Prefix,
    router: HttpRouter<E2, R2>
  ): <E, R>(parentRouter: HttpRouter<E, R>) => HttpRouter<E | E2, R | R2>

  <E, R, Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
    parentRouter: HttpRouter<E, R>,
    prefix: Prefix,
    router: HttpRouter<E2, R2>
  ): HttpRouter<E | E2, R | R2>
} = dual(3, <E, R, Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
  parentRouter: HttpRouter<E, R>,
  prefix: Prefix,
  router: HttpRouter<E2, R2>
): HttpRouter<E | E2, R | R2> => {
  const prefixRoute = getRouteGuard(prefix)

  return new RouterImpl<E | E2, R | R2, E | E2, R | R2>(
    Chunk.appendAll(
      parentRouter.routes,
      Chunk.map(
        router.routes,
        (r) => HttpRouteHandler.make(r.method)(MatchInput.concat(prefixRoute, r.route), r.handler)
      )
    ),
    Chunk.appendAll(
      parentRouter.mounts,
      Chunk.map(router.mounts, (m) => new Mount(MatchInput.concat(prefixRoute, m.prefix), m.app, m.options))
    )
  )
})

function getRouteGuard<const I extends MatchInput.MatchInput.Any | string>(routeOrPath: I) {
  if (typeof routeOrPath === "string") return MatchInput.asRouteGuard(Route.parse(routeOrPath))
  return MatchInput.asRouteGuard(routeOrPath)
}

/**
 * Note this will only function properly if your route's paths are compatible with the platform router.
 *
 * @since 1.0.0
 */
export const toPlatformRouter = <E, R>(
  router: HttpRouter<E, R>
): HttpRouter.HttpRouter<
  E | HttpServerError.RouteNotFound | HttpRouteHandler.RouteNotMatched,
  TypedRouter.CurrentRoute | R
> => {
  let platformRouter: HttpRouter.HttpRouter<
    E | HttpRouteHandler.RouteNotMatched,
    R | TypedRouter.CurrentRoute
  > = HttpRouter.empty

  for (const mount of router.mounts) {
    platformRouter = HttpRouter.mountApp(
      platformRouter,
      // TODO: Maybe we should do a best-effort to convert the path to a platform compatible path
      MatchInput.getPath(mount.prefix) as any,
      Effect.gen(function*() {
        const ctx = yield* setupRouteContext
        const response = yield* runRouteMatcher<E, R>(
          mount.prefix,
          mount.app,
          ctx.path,
          ctx.url,
          ctx.existingParams
        )

        if (Option.isSome(response)) {
          return response.value
        }

        return yield* new HttpRouteHandler.RouteNotMatched({ request: ctx.request, route: mount.prefix })
      }),
      mount.options
    )
  }

  for (const routeHandler of router.routes) {
    platformRouter = HttpRouteHandler.toPlatformRoute(routeHandler)(platformRouter)
  }

  return platformRouter
}

/**
 * @since 1.0.0
 */
export const fromPlatformRouter = <E, R>(
  platformRouter: HttpRouter.HttpRouter<E, R>
): HttpRouter<E, R> => {
  let router: HttpRouter<any, any> = empty

  for (const [prefix, app, options] of platformRouter.mounts) {
    router = mountApp(router, Route.parse(prefix), app, options)
  }

  for (const platformRoute of platformRouter.routes) {
    router = addHandler(
      router,
      HttpRouteHandler.make(platformRoute.method)(
        Route.parse(platformRoute.path),
        platformRoute.handler.pipe(Effect.flatMap(HttpServerRespondable.toResponse))
      )
    )
  }

  return router
}

/**
 * @since 1.0.0
 */
export const catchAllCause: {
  <E, E2, R2>(
    onCause: (cause: Cause.Cause<E>) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): <R>(router: HttpRouter<E, R>) => HttpRouter<E2, R | R2>

  <E, R, E2, R2>(
    router: HttpRouter<E, R>,
    onCause: (cause: Cause.Cause<E>) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): HttpRouter<E2, R | R2>
} = dual(2, <E, R, E2, R2>(
  router: HttpRouter<E, R>,
  onCause: (cause: Cause.Cause<E>) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
): HttpRouter<E2, R | R2> =>
  new RouterImpl(
    Chunk.map(router.routes, (handler) => HttpRouteHandler.catchAllCause(handler, onCause)),
    Chunk.map(
      router.mounts,
      (mount) => new Mount(mount.prefix, Effect.catchAllCause(mount.app, onCause), mount.options)
    )
  ))

/**
 * @since 1.0.0
 */
export const catchAll: {
  <E, E2, R2>(
    onCause: (cause: E) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): <R>(router: HttpRouter<E, R>) => HttpRouter<E2, R | R2>

  <E, R, E2, R2>(
    router: HttpRouter<E, R>,
    onCause: (cause: E) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): HttpRouter<E2, R | R2>
} = dual(2, <E, R, E2, R2>(
  router: HttpRouter<E, R>,
  onCause: (cause: E) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
): HttpRouter<E2, R | R2> =>
  new RouterImpl(
    Chunk.map(router.routes, (handler) => HttpRouteHandler.catchAll(handler, onCause)),
    Chunk.map(router.mounts, (mount) =>
      new Mount(
        mount.prefix,
        Effect.catchAll(mount.app, onCause),
        mount.options
      ))
  ))

/**
 * @since 1.0.0
 */
export const catchTag: {
  <E, const Tag extends E extends { readonly _tag: string } ? E["_tag"] : never, E2, R2>(
    tag: Tag,
    onError: (error: Extract<E, { readonly _tag: Tag }>) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): <R>(router: HttpRouter<E, R>) => HttpRouter<E2 | Exclude<E, { readonly _tag: Tag }>, R | R2>

  <E, R, const Tag extends E extends { readonly _tag: string } ? E["_tag"] : never, E2, R2>(
    router: HttpRouter<E, R>,
    tag: Tag,
    onError: (error: Extract<E, { readonly _tag: Tag }>) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): HttpRouter<E2 | Exclude<E, { readonly _tag: Tag }>, R | R2>
} = dual(
  3,
  <E, R, const Tag extends (E extends { readonly _tag: string } ? E["_tag"] : never), E2, R2>(
    router: HttpRouter<E, R>,
    tag: Tag,
    onError: (error: Extract<E, { readonly _tag: Tag }>) => Effect.Effect<HttpServerResponse.HttpServerResponse, E2, R2>
  ): HttpRouter<Exclude<E, { readonly _tag: Tag }> | E2, R | R2> =>
    new RouterImpl(
      Chunk.map(router.routes, (handler) => HttpRouteHandler.catchTag(handler, tag, onError)),
      Chunk.map(router.mounts, (mount) =>
        new Mount(mount.prefix, Effect.catchTag(mount.app, tag as any, onError), mount.options))
    )
)
