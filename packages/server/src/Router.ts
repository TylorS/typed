import type { Default } from "@effect/platform/Http/App"
import type { Method } from "@effect/platform/Http/Method"
import type { RouteNotFound } from "@effect/platform/Http/ServerError"
import type { Navigation } from "@typed/navigation"
import type { CurrentRoute, MatchInput } from "@typed/router"
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
  readonly routes: Chunk.Chunk<RouteHandler.RouteHandler<MatchInput.Any, E, R>>
  readonly mounts: Chunk.Chunk<Mount<E, R>>
}

/**
 * @since 1.0.0
 */
export interface Mount<E, R> {
  readonly prefix: MatchInput.Any
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
<I extends MatchInput.Any, E, R>(
  route: I,
  handler: RouteHandler.Handler<I, E, R>
) => addHandler(RouteHandler.make(method)(route, handler))

/**
 * @since 1.0.0
 */
export const get = make("GET")

/**
 * @since 1.0.0
 */
export const post = make("POST")

/**
 * @since 1.0.0
 */
export const put = make("PUT")
const delete_ = make("DELETE")

/**
 * @since 1.0.0
 */
export { delete_ as delete }

/**
 * @since 1.0.0
 */
export const patch = make("PATCH")

/**
 * @since 1.0.0
 */
export const options = make("OPTIONS")

/**
 * @since 1.0.0
 */
export const head = make("HEAD")

/**
 * @since 1.0.0
 */
export const all = make("*")
