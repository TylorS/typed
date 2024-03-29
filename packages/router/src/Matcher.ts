/**
 * @since 1.0.0
 */

import * as Fx from "@typed/fx/Fx"
import * as Match from "@typed/fx/Match"
import type * as RefSubject from "@typed/fx/RefSubject"
import type { Navigation } from "@typed/navigation"
import { CurrentPath, isRedirectError, navigate, RedirectError } from "@typed/navigation"
import type * as Route from "@typed/route"
import type { Scope } from "effect"
import { Data, Effect, Option, pipe, Unify } from "effect"
import { dual } from "effect/Function"
import { hasProperty } from "effect/Predicate"
import type { CurrentRoute } from "./CurrentRoute.js"
import { makeHref } from "./CurrentRoute.js"
import type { MatchInput } from "./MatchInput.js"
import * as RouteMatch from "./RouteMatch.js"

/**
 * @since 1.0.0
 */
export const RouteMatcherTypeId = Symbol.for("@typed/router/RouteMatcher")

/**
 * @since 1.0.0
 */
export type RouteMatcherTypeId = typeof RouteMatcherTypeId

/**
 * @since 1.0.0
 */
export interface RouteMatcher<Matches extends RouteMatch.RouteMatch.Any> {
  readonly [RouteMatcherTypeId]: RouteMatcherTypeId

  readonly matches: ReadonlyArray<Matches>

  readonly add: <I extends RouteMatch.RouteMatch.Any>(match: I) => RouteMatcher<Matches | I>

  readonly match: <I extends MatchInput.Any, A, E, R>(
    input: I,
    match: (ref: RefSubject.RefSubject<MatchInput.Success<I>>) => Fx.Fx<A, E, R>
  ) => RouteMatcher<
    | Matches
    | RouteMatch.RouteMatch<
      MatchInput.Route<I>,
      MatchInput.Success<I>,
      MatchInput.Error<I>,
      MatchInput.Context<I>,
      A,
      E,
      R
    >
  >

  readonly switch: <I extends MatchInput.Any, A, E, R>(
    input: I,
    match: (ref: MatchInput.Success<I>) => Fx.Fx<A, E, R>
  ) => RouteMatcher<
    | Matches
    | RouteMatch.RouteMatch<
      MatchInput.Route<I>,
      MatchInput.Success<I>,
      MatchInput.Error<I>,
      MatchInput.Context<I>,
      A,
      E,
      R | Scope.Scope
    >
  >

  readonly effect: <I extends MatchInput.Any, A, E, R>(
    input: I,
    match: (ref: MatchInput.Success<I>) => Effect.Effect<A, E, R>
  ) => RouteMatcher<
    | Matches
    | RouteMatch.RouteMatch<
      MatchInput.Route<I>,
      MatchInput.Success<I>,
      MatchInput.Error<I>,
      MatchInput.Context<I>,
      A,
      E,
      R | Scope.Scope
    >
  >

  readonly to: <I extends MatchInput.Any, B>(
    input: I,
    f: (value: MatchInput.Success<I>) => B
  ) => RouteMatcher<
    | Matches
    | RouteMatch.RouteMatch<
      MatchInput.Route<I>,
      MatchInput.Success<I>,
      MatchInput.Error<I>,
      MatchInput.Context<I>,
      B,
      never,
      Scope.Scope
    >
  >
}

/**
 * @since 1.0.0
 */
export namespace RouteMatcher {
  /**
   * @since 1.0.0
   */
  export type Any = RouteMatcher<RouteMatch.RouteMatch.Any>

  /**
   * @since 1.0.0
   */
  export type Context<T> = T extends RouteMatcher<infer Matches> ? RouteMatch.RouteMatch.Context<Matches> : never
}

class RouteMatcherImpl<Matches extends RouteMatch.RouteMatch.Any> implements RouteMatcher<Matches> {
  readonly [RouteMatcherTypeId]: RouteMatcherTypeId = RouteMatcherTypeId

  constructor(readonly matches: ReadonlyArray<Matches>) {
    this.add = this.add.bind(this)
    this.match = this.match.bind(this)
    this.switch = this.switch.bind(this)
    this.effect = this.effect.bind(this)
    this.to = this.to.bind(this)
  }

  add<I extends RouteMatch.RouteMatch.Any>(match: I): RouteMatcher<Matches | I> {
    return new RouteMatcherImpl([...this.matches, match])
  }

  match<I extends MatchInput.Any, A, E, R>(
    input: I,
    match: (ref: RefSubject.RefSubject<MatchInput.Success<I>>) => Fx.Fx<A, E, R>
  ) {
    return this.add(RouteMatch.fromInput(input, match))
  }

  switch<I extends MatchInput.Any, A, E, R>(
    input: I,
    match: (ref: MatchInput.Success<I>) => Fx.Fx<A, E, R>
  ) {
    return this.match(input, Fx.switchMap(match))
  }

  effect<I extends MatchInput.Any, A, E, R>(
    input: I,
    match: (ref: MatchInput.Success<I>) => Effect.Effect<A, E, R>
  ) {
    return this.match(input, Fx.switchMapEffect(match))
  }

  to<I extends MatchInput.Any, B>(
    input: I,
    f: (value: MatchInput.Success<I>) => B
  ) {
    return this.match(input, Fx.map(f))
  }
}

/**
 * @since 1.0.0
 */
export function make<Matches extends RouteMatch.RouteMatch.Any>(
  matches: ReadonlyArray<Matches>
): RouteMatcher<Matches> {
  return new RouteMatcherImpl(matches)
}

/**
 * @since 1.0.0
 */
export const empty: RouteMatcher<never> = make<never>([])

const { effect, match, switch: switch_, to } = empty

export {
  /**
   * @since 1.0.0
   */
  effect,
  /**
   * @since 1.0.0
   */
  match,
  /**
   * @since 1.0.0
   */
  switch_ as switch,
  /**
   * @since 1.0.0
   */
  to
}

/**
 * @since 1.0.0
 */
export const catchRedirectError = <A, E, R>(
  fx: Fx.Fx<A, E | RedirectError, R>
): Fx.Fx<A, Exclude<E, RedirectError>, R | Scope.Scope | Navigation> =>
  Fx.filterMapErrorEffect(
    fx,
    Unify.unify((_) =>
      isRedirectError(_)
        ? Effect.as(Effect.forkScoped(Effect.ignoreLogged(navigate(_.path, _.options))), Option.none())
        : Effect.succeedSome(_ as Exclude<typeof _, RedirectError>)
    )
  )

/**
 * @since 1.0.0
 */
export const notFound: {
  <A, E, R>(
    onNotFound: Fx.Fx<A, E, R>
  ): <Matches extends RouteMatch.RouteMatch.Any>(router: RouteMatcher<Matches>) => Fx.Fx<
    A | RouteMatch.RouteMatch.Success<Matches>,
    Exclude<E | RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
    Scope.Scope | Navigation | R | RouteMatch.RouteMatch.Context<Matches>
  >

  <Matches extends RouteMatch.RouteMatch.Any, A, E, R>(
    router: RouteMatcher<Matches>,
    onNotFound: Fx.Fx<A, E, R>
  ): Fx.Fx<
    A | RouteMatch.RouteMatch.Success<Matches>,
    Exclude<E | RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
    Scope.Scope | Navigation | R | RouteMatch.RouteMatch.Context<Matches>
  >
} = dual(2, function notFound<Matches extends RouteMatch.RouteMatch.Any, A, E, R>(
  router: RouteMatcher<Matches>,
  onNotFound: Fx.Fx<A, E, R>
): Fx.Fx<
  A | RouteMatch.RouteMatch.Success<Matches>,
  Exclude<E | RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
  R | Navigation | RouteMatch.RouteMatch.Context<Matches> | Scope.Scope
> {
  let matcher = Match.value(CurrentPath) as Match.ValueMatcher<
    string,
    RouteMatch.RouteMatch.Success<Matches>,
    RouteMatch.RouteMatch.Error<Matches>,
    RouteMatch.RouteMatch.Context<Matches> | Navigation | Scope.Scope
  >

  for (const match of router.matches) {
    matcher = matcher.when(match.guard, match.match)
  }

  return catchRedirectError(matcher.getOrElse(() => onNotFound))
})

/**
 * @since 1.0.0
 */
export const notFoundWith: {
  <A, E, R>(
    onNotFound: Effect.Effect<A, E, R>
  ): <Matches extends RouteMatch.RouteMatch.Any>(router: RouteMatcher<Matches>) => Fx.Fx<
    A | RouteMatch.RouteMatch.Success<Matches>,
    Exclude<E | RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
    R | Navigation | RouteMatch.RouteMatch.Context<Matches> | Scope.Scope
  >

  <Matches extends RouteMatch.RouteMatch.Any, A, E, R>(
    router: RouteMatcher<Matches>,
    onNotFound: Effect.Effect<A, E, R>
  ): Fx.Fx<
    A | RouteMatch.RouteMatch.Success<Matches>,
    Exclude<E | RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
    R | Navigation | RouteMatch.RouteMatch.Context<Matches> | Scope.Scope
  >
} = dual(2, function notFoundWith<Matches extends RouteMatch.RouteMatch.Any, A, E, R>(
  router: RouteMatcher<Matches>,
  onNotFound: Effect.Effect<A, E, R>
): Fx.Fx<
  A | RouteMatch.RouteMatch.Success<Matches>,
  Exclude<E | RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
  R | Navigation | RouteMatch.RouteMatch.Context<Matches> | Scope.Scope
> {
  return notFound(router, Fx.fromEffect(onNotFound))
})

/**
 * @since 1.0.0
 */
export function isRouteMatcher<M extends RouteMatch.RouteMatch.Any = RouteMatch.RouteMatch.Any>(
  value: unknown
): value is RouteMatcher<M> {
  return hasProperty(value, RouteMatcherTypeId)
}

/**
 * @since
 */
export const redirectWith: {
  <E, R>(
    effect: Effect.Effect<string, E, R>
  ): <Matches extends RouteMatch.RouteMatch.Any>(router: RouteMatcher<Matches>) => Fx.Fx<
    RouteMatch.RouteMatch.Success<Matches>,
    Exclude<E | RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
    Navigation | Scope.Scope | R | RouteMatch.RouteMatch.Context<Matches>
  >

  <Matches extends RouteMatch.RouteMatch.Any, E, R>(
    router: RouteMatcher<Matches>,
    effect: Effect.Effect<string, E, R>
  ): Fx.Fx<
    RouteMatch.RouteMatch.Success<Matches>,
    Exclude<E | RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
    Navigation | Scope.Scope | R | RouteMatch.RouteMatch.Context<Matches>
  >
} = dual(2, function redirectWith<Matches extends RouteMatch.RouteMatch.Any, E, R>(
  router: RouteMatcher<Matches>,
  effect: Effect.Effect<string, E, R>
) {
  return notFoundWith(router, Effect.flatMap(effect, (path) => new RedirectError({ path })))
})

/**
 * @since 1.0.0
 */
export const redirectTo: {
  <R extends Route.Route.Any>(
    route: R,
    ...params: Route.Route.ParamsList<R>
  ): <Matches extends RouteMatch.RouteMatch.Any>(router: RouteMatcher<Matches>) => Fx.Fx<
    RouteMatch.RouteMatch.Success<Matches>,
    RedirectRouteMatchError<R> | Exclude<RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
    Scope.Scope | Navigation | CurrentRoute | RouteMatch.RouteMatch.Context<Matches>
  >

  <Matches extends RouteMatch.RouteMatch.Any, R extends Route.Route.Any>(
    router: RouteMatcher<Matches>,
    route: R,
    ...params: Route.Route.ParamsList<R>
  ): Fx.Fx<
    RouteMatch.RouteMatch.Success<Matches>,
    RedirectRouteMatchError<R> | Exclude<RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
    Scope.Scope | Navigation | CurrentRoute | RouteMatch.RouteMatch.Context<Matches>
  >
} = dual(
  (args) => isRouteMatcher(args[0]),
  function redirect<Matches extends RouteMatch.RouteMatch.Any, R extends Route.Route.Any>(
    router: RouteMatcher<Matches>,
    route: R,
    ...params: Route.Route.ParamsList<R>
  ): Fx.Fx<
    RouteMatch.RouteMatch.Success<Matches>,
    RedirectRouteMatchError<R> | Exclude<RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
    Scope.Scope | Navigation | CurrentRoute | RouteMatch.RouteMatch.Context<Matches>
  > {
    return redirectWith(
      router,
      pipe(
        Effect.catchTag(
          makeHref<R>(route, ...params),
          "NoSuchElementException",
          () => Effect.fail(new RedirectRouteMatchError<R>(route, (params[0] || {}) as Route.Route.Params<R>))
        ),
        Effect.flatMap((path) => new RedirectError({ path }))
      )
    )
  }
)

/**
 * @since 1.0.0
 */
export class RedirectRouteMatchError<R extends Route.Route.Any> extends Data.TaggedError("RedirectRouteMatchError") {
  constructor(readonly route: R, readonly params: Route.Route.Params<R>) {
    super()
  }
}
