import type { Default } from "@effect/platform/Http/App"
import type { Method } from "@effect/platform/Http/Method"
import * as PlatformRouter from "@effect/platform/Http/Router"
import type { RouteNotFound } from "@effect/platform/Http/ServerError"
import type { Navigation } from "@typed/navigation"
import type { CurrentRoute } from "@typed/router"
import * as MatchInput from "@typed/router/MatchInput"
import { Chunk, Effect, Option } from "effect"
import { dual } from "effect/Function"
import { RouterImpl, type RouterTypeId, runRouteMatcher, setupRouteContext } from "./internal/router.js"
import * as RouteHandler from "./RouteHandler.js"

/**
 * @since 1.0.0
 */
export interface Router<E, R>
  extends Default<E | RouteNotFound, Exclude<R, CurrentRoute | RouteHandler.CurrentParams<any> | Navigation>>
{
  readonly [RouterTypeId]: RouterTypeId
  readonly routes: Chunk.Chunk<RouteHandler.RouteHandler<MatchInput.MatchInput.Any, E, R>>
  readonly mounts: Chunk.Chunk<Mount<E, R>>
}

/**
 * @since 1.0.0
 */
export interface Mount<E, R> {
  readonly prefix: MatchInput.MatchInput.Any
  readonly app: Default<E, R>
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
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, CurrentRoute | Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, CurrentRoute | Navigation>
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
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, CurrentRoute | Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, CurrentRoute | Navigation>
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
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, CurrentRoute | Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, CurrentRoute | Navigation>
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
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, CurrentRoute | Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, CurrentRoute | Navigation>
> = make("PUT")

const delete_: <I extends MatchInput.MatchInput.Any, E2, R2>(
  route: I,
  handler: RouteHandler.Handler<I, E2, R2>
) => <E, R>(
  router: Router<E, R>
) => Router<
  E | E2 | RouteHandler.RouteNotMatched | MatchInput.MatchInput.Error<I>,
  | R
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, CurrentRoute | Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, CurrentRoute | Navigation>
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
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, CurrentRoute | Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, CurrentRoute | Navigation>
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
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, CurrentRoute | Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, CurrentRoute | Navigation>
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
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, CurrentRoute | Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, CurrentRoute | Navigation>
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
  | Exclude<Exclude<R2, RouteHandler.CurrentParams<I>>, CurrentRoute | Navigation>
  | Exclude<MatchInput.MatchInput.Context<I>, CurrentRoute | Navigation>
> = make("*")

/**
 * @since 1.0.0
 */
export const mountApp: {
  <Prefix extends MatchInput.MatchInput.Any, E2, R2>(
    prefix: Prefix,
    app: Default<E2, R2>
  ): <E, R>(router: Router<E, R>) => Router<E2 | E, R2 | R>

  <E, R, Prefix extends MatchInput.MatchInput.Any, E2, R2>(
    router: Router<E, R>,
    prefix: Prefix,
    app: Default<E2, R2>
  ): Router<E | E2, R | R2>
} = dual(3, <E, R, Prefix extends MatchInput.MatchInput.Any, E2, R2>(
  router: Router<E, R>,
  prefix: Prefix,
  app: Default<E2, R2>
): Router<E | E2, R | R2> =>
  new RouterImpl<E | E2, R | R2, E, R>(
    router.routes,
    Chunk.append(router.mounts, { prefix, app })
  ))

/**
 * @since 1.0.0
 */
export const mount: {
  <Prefix extends MatchInput.MatchInput.Any, E2, R2>(
    prefix: Prefix,
    router: Router<E2, R2>
  ): <E, R>(parentRouter: Router<E, R>) => Router<E | E2, R | R2>

  <E, R, Prefix extends MatchInput.MatchInput.Any, E2, R2>(
    parentRouter: Router<E, R>,
    prefix: Prefix,
    router: Router<E2, R2>
  ): Router<E | E2, R | R2>
} = dual(3, <E, R, Prefix extends MatchInput.MatchInput.Any, E2, R2>(
  parentRouter: Router<E, R>,
  prefix: Prefix,
  router: Router<E2, R2>
): Router<E | E2, R | R2> =>
  new RouterImpl<E | E2, R | R2, E | E2, R | R2>(
    Chunk.appendAll(
      parentRouter.routes,
      Chunk.map(router.routes, (r) => RouteHandler.make(r.method)(MatchInput.concat(prefix, r.route), r.handler))
    ),
    Chunk.appendAll(
      parentRouter.mounts,
      Chunk.map(router.mounts, (m) => ({ prefix: MatchInput.concat(prefix, m.prefix), app: m.app }))
    )
  ))

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
      })
    )
  }

  for (const routeHandler of router.routes) {
    platformRouter = RouteHandler.toPlatformRoute(routeHandler)(platformRouter)
  }

  return platformRouter
}
