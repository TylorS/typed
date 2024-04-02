import type { Default } from "@effect/platform/Http/App"
import type { Method } from "@effect/platform/Http/Method"
import type { RouteNotFound } from "@effect/platform/Http/ServerError"
import type { Navigation } from "@typed/navigation"
import type { CurrentRoute } from "@typed/router"
import * as MatchInput from "@typed/router/MatchInput"
import { Chunk } from "effect"
import { dual } from "effect/Function"
import { RouterImpl, type RouterTypeId } from "./internal/router.js"
import * as RouteHandler from "./RouteHandler.js"

/**
 * @since 1.0.0
 */
export interface Router<E, R>
  extends Default<Exclude<R, CurrentRoute | RouteHandler.CurrentParams<any> | Navigation>, E | RouteNotFound>
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
  readonly app: Default<R, E>
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
  <Prefix extends MatchInput.MatchInput.Any, R2, E2>(
    prefix: Prefix,
    app: Default<R2, E2>
  ): <E, R>(router: Router<E, R>) => Router<E2 | E, R2 | R>

  <E, R, Prefix extends MatchInput.MatchInput.Any, R2, E2>(
    router: Router<E, R>,
    prefix: Prefix,
    app: Default<R2, E2>
  ): Router<E | E2, R | R2>
} = dual(3, <E, R, Prefix extends MatchInput.MatchInput.Any, R2, E2>(
  router: Router<E, R>,
  prefix: Prefix,
  app: Default<R2, E2>
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
