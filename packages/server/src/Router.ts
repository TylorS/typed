/**
 * @since 1.0.0
 */

import type { Default } from "@effect/platform/Http/App"
import type { Method } from "@effect/platform/Http/Method"
import * as PlatformRouter from "@effect/platform/Http/Router"
import type { RouteNotFound } from "@effect/platform/Http/ServerError"
import type { ServerResponse } from "@effect/platform/Http/ServerResponse"
import type * as Navigation from "@typed/navigation"
import * as Route from "@typed/route"
import type * as TypedRouter from "@typed/router"
import * as MatchInput from "@typed/router/MatchInput"
import type * as Cause from "effect/Cause"
import * as Chunk from "effect/Chunk"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import * as Option from "effect/Option"
import { RouterImpl, RouterTypeId, runRouteMatcher, setupRouteContext } from "./internal/router.js"
import * as RouteHandler from "./RouteHandler.js"

/**
 * @since 1.0.0
 */
export interface Router<E, R> extends
  Default<
    E | RouteNotFound,
    Exclude<R, TypedRouter.CurrentRoute | RouteHandler.CurrentParams<any> | Navigation.Navigation>
  >
{
  readonly [RouterTypeId]: RouterTypeId
  readonly routes: Chunk.Chunk<RouteHandler.RouteHandler<MatchInput.MatchInput.Any, E, R>>
  readonly mounts: Chunk.Chunk<Mount<E, R>>
}

/**
 * @since 1.0.0
 */
export class Mount<E, R> {
  constructor(
    readonly prefix: MatchInput.MatchInput.Any,
    readonly app: Default<E, R>,
    readonly options?: { readonly includePrefix?: boolean | undefined }
  ) {}
}

/**
 * @since 1.0.0
 */
export const empty: Router<never, never> = new RouterImpl(Chunk.empty(), Chunk.empty())

/**
 * @since 1.0.0
 */
export const addHandler: {
  <I extends RouteHandler.RouteHandler.Any>(
    handler: I
  ): <E, R>(
    router: Router<E, R>
  ) => Router<E | RouteHandler.RouteHandler.Error<I>, R | RouteHandler.RouteHandler.Context<I>>

  <E, R, I extends RouteHandler.RouteHandler.Any>(
    router: Router<E, R>,
    handler: I
  ): Router<E | RouteHandler.RouteHandler.Error<I>, R | RouteHandler.RouteHandler.Context<I>>
} = dual(2, <E, R, I extends RouteHandler.RouteHandler.Any>(
  router: Router<E, R>,
  handler: I
): Router<E | RouteHandler.RouteHandler.Error<I>, R | RouteHandler.RouteHandler.Context<I>> => {
  return new RouterImpl<E | RouteHandler.RouteHandler.Error<I>, R | RouteHandler.RouteHandler.Context<I>, E, R>(
    Chunk.append(router.routes, handler),
    router.mounts
  )
})

const make = (method: Method | "*") =>
<I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
): <E, R>(
  router: Router<E, R>
) => Router<
  E2 | RouteHandler.RouteNotMatched | E | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, TypedRouter.CurrentRoute | Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, TypedRouter.CurrentRoute | Navigation.Navigation>
> => addHandler(RouteHandler.make(method)(route, handler))

/**
 * @since 1.0.0
 */
export const get: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  E2 | E | RouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, TypedRouter.CurrentRoute | Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, TypedRouter.CurrentRoute | Navigation.Navigation>
> = make("GET")

/**
 * @since 1.0.0
 */
export const post: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  E2 | E | RouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, TypedRouter.CurrentRoute | Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, TypedRouter.CurrentRoute | Navigation.Navigation>
> = make("POST")

/**
 * @since 1.0.0
 */
export const put: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  E2 | E | RouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, TypedRouter.CurrentRoute | Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, TypedRouter.CurrentRoute | Navigation.Navigation>
> = make("PUT")

const delete_: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  E | E2 | RouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, TypedRouter.CurrentRoute | Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, TypedRouter.CurrentRoute | Navigation.Navigation>
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
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  RouteHandler.RouteNotMatched | E2 | E | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, TypedRouter.CurrentRoute | Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, TypedRouter.CurrentRoute | Navigation.Navigation>
> = make("PATCH")

/**
 * @since 1.0.0
 */
export const options: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  E2 | E | RouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, TypedRouter.CurrentRoute | Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, TypedRouter.CurrentRoute | Navigation.Navigation>
> = make("OPTIONS")

/**
 * @since 1.0.0
 */
export const head: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  E2 | E | RouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, TypedRouter.CurrentRoute | Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, TypedRouter.CurrentRoute | Navigation.Navigation>
> = make("HEAD")

/**
 * @since 1.0.0
 */
export const all: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  E2 | E | RouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, TypedRouter.CurrentRoute | Navigation.Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, TypedRouter.CurrentRoute | Navigation.Navigation>
> = make("*")

/**
 * @since 1.0.0
 */
export const mountApp: {
  <Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
    prefix: Prefix,
    app: Default<E2, R2>,
    options?: { includePrefix?: boolean | undefined }
  ): <E, R>(router: Router<E, R>) => Router<E2 | E, R2 | R>

  <E, R, Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
    router: Router<E, R>,
    prefix: Prefix,
    app: Default<E2, R2>,
    options?: { includePrefix?: boolean | undefined }
  ): Router<E | E2, R | R2>
} = dual(
  (args) => typeof args[0] === "object" && RouterTypeId in args[0],
  <E, R, Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
    router: Router<E, R>,
    prefix: Prefix,
    app: Default<E2, R2>,
    options?: { includePrefix?: boolean | undefined }
  ): Router<E | E2, R | R2> => {
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
    router: Router<E2, R2>
  ): <E, R>(parentRouter: Router<E, R>) => Router<E | E2, R | R2>

  <E, R, Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
    parentRouter: Router<E, R>,
    prefix: Prefix,
    router: Router<E2, R2>
  ): Router<E | E2, R | R2>
} = dual(3, <E, R, Prefix extends MatchInput.MatchInput.Any | string, E2, R2>(
  parentRouter: Router<E, R>,
  prefix: Prefix,
  router: Router<E2, R2>
): Router<E | E2, R | R2> => {
  const prefixRoute = getRouteGuard(prefix)

  return new RouterImpl<E | E2, R | R2, E | E2, R | R2>(
    Chunk.appendAll(
      parentRouter.routes,
      Chunk.map(router.routes, (r) => RouteHandler.make(r.method)(MatchInput.concat(prefixRoute, r.route), r.handler))
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
  router: Router<E, R>
): PlatformRouter.Router<E | RouteHandler.RouteNotMatched, R> => {
  let platformRouter: PlatformRouter.Router<
    E | RouteHandler.RouteNotMatched,
    R
  > = PlatformRouter.empty

  for (const mount of router.mounts) {
    platformRouter = PlatformRouter.mountApp(
      platformRouter,
      // TODO: Maybe we should do a best-effort to convert the path to a platform compatible path
      MatchInput.getPath(mount.prefix),
      Effect.gen(function*() {
        const ctx = yield* setupRouteContext
        const response = yield* runRouteMatcher<E, R>(
          mount.prefix,
          mount.app,
          ctx.path,
          ctx.url,
          ctx.existingParams,
          ctx.parentRoute
        )

        if (Option.isSome(response)) {
          return response.value
        }

        return yield* new RouteHandler.RouteNotMatched({ request: ctx.request, route: mount.prefix })
      }),
      mount.options
    )
  }

  for (const routeHandler of router.routes) {
    platformRouter = RouteHandler.toPlatformRoute(routeHandler)(platformRouter)
  }

  return platformRouter
}

/**
 * @since 1.0.0
 */
export const fromPlatformRouter = <E, R>(
  platformRouter: PlatformRouter.Router<E, R>
): Router<E, R> => {
  let router: Router<any, any> = empty

  for (const [prefix, app, options] of platformRouter.mounts) {
    router = mountApp(router, Route.parse(prefix), app, options)
  }

  for (const platformRoute of platformRouter.routes) {
    router = addHandler(
      router,
      RouteHandler.make(platformRoute.method)(Route.parse(platformRoute.path), platformRoute.handler)
    )
  }

  return router
}

/**
 * @since 1.0.0
 */
export const catchAllCause: {
  <E, E2, R2>(
    onCause: (cause: Cause.Cause<E>) => Effect.Effect<ServerResponse, E2, R2>
  ): <R>(router: Router<E, R>) => Router<E2, R | R2>

  <E, R, E2, R2>(
    router: Router<E, R>,
    onCause: (cause: Cause.Cause<E>) => Effect.Effect<ServerResponse, E2, R2>
  ): Router<E2, R | R2>
} = dual(2, <E, R, E2, R2>(
  router: Router<E, R>,
  onCause: (cause: Cause.Cause<E>) => Effect.Effect<ServerResponse, E2, R2>
): Router<E2, R | R2> =>
  new RouterImpl(
    Chunk.map(router.routes, (handler) => RouteHandler.catchAllCause(handler, onCause)),
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
    onCause: (cause: E) => Effect.Effect<ServerResponse, E2, R2>
  ): <R>(router: Router<E, R>) => Router<E2, R | R2>

  <E, R, E2, R2>(router: Router<E, R>, onCause: (cause: E) => Effect.Effect<ServerResponse, E2, R2>): Router<E2, R | R2>
} = dual(2, <E, R, E2, R2>(
  router: Router<E, R>,
  onCause: (cause: E) => Effect.Effect<ServerResponse, E2, R2>
): Router<E2, R | R2> =>
  new RouterImpl(
    Chunk.map(router.routes, (handler) => RouteHandler.catchAll(handler, onCause)),
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
    onError: (error: Extract<E, { readonly _tag: Tag }>) => Effect.Effect<ServerResponse, E2, R2>
  ): <R>(router: Router<E, R>) => Router<E2 | Exclude<E, { readonly _tag: Tag }>, R | R2>

  <E, R, const Tag extends E extends { readonly _tag: string } ? E["_tag"] : never, E2, R2>(
    router: Router<E, R>,
    tag: Tag,
    onError: (error: Extract<E, { readonly _tag: Tag }>) => Effect.Effect<ServerResponse, E2, R2>
  ): Router<E2 | Exclude<E, { readonly _tag: Tag }>, R | R2>
} = dual(
  3,
  <E, R, const Tag extends (E extends { readonly _tag: string } ? E["_tag"] : never), E2, R2>(
    router: Router<E, R>,
    tag: Tag,
    onError: (error: Extract<E, { readonly _tag: Tag }>) => Effect.Effect<ServerResponse, E2, R2>
  ): Router<Exclude<E, { readonly _tag: Tag }> | E2, R | R2> =>
    new RouterImpl(
      Chunk.map(router.routes, (handler) => RouteHandler.catchTag(handler, tag, onError)),
      Chunk.map(router.mounts, (mount) =>
        new Mount(mount.prefix, Effect.catchTag(mount.app, tag as any, onError), mount.options))
    )
)
