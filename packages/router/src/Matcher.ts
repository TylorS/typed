/**
 * @since 1.0.0
 */

import { CurrentEnvironment } from "@typed/environment"
import * as Fx from "@typed/fx/Fx"
import * as Match from "@typed/fx/Match"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Guard from "@typed/guard"
import * as Navigation from "@typed/navigation"
import type * as Path from "@typed/path"
import * as Route from "@typed/route"
import type { Scope } from "effect"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import type { CurrentRoute } from "./CurrentRoute.js"
import { makeHref, withCurrentRoute } from "./CurrentRoute.js"

/**
 * @since 1.0.0
 */
export interface RouteMatcher<out A, out E, out R> {
  readonly guards: ReadonlyArray<RouteGuard<string, any, A, E, R, E, R>>

  readonly match: {
    <const P extends string, B, E2, R2>(
      route: Route.Route<P> | P,
      f: (ref: RefSubject.RefSubject<Path.ParamsOf<P>>) => Fx.Fx<B, E2, R2>
    ): RouteMatcher<A | B, E | E2, R | Exclude<R2, Scope.Scope>>

    <const P extends string, B, E2, R2, C, E3, R3>(
      route: Route.Route<P> | P,
      guard: Guard.Guard<Path.ParamsOf<P>, B, E2, R2>,
      f: (ref: RefSubject.RefSubject<B>) => Fx.Fx<C, E3, R3>
    ): RouteMatcher<A | C, E | E2 | E3, R | Exclude<R2, Scope.Scope> | Exclude<R3, Scope.Scope>>
  }

  readonly to: {
    <const P extends string, B>(
      route: Route.Route<P> | P,
      f: (params: Path.ParamsOf<P>) => B
    ): RouteMatcher<A | B, E, R>

    <const P extends string, B, E2, R2, C, E3, R3>(
      route: Route.Route<P> | P,
      guard: Guard.Guard<Path.ParamsOf<P>, B, E2, R2>,
      f: (b: B) => C
    ): RouteMatcher<A | C, E | E2 | E3, R | Exclude<R2, Scope.Scope> | Exclude<R3, Scope.Scope>>
  }

  readonly notFound: <B, E2, R2>(
    f: (destination: typeof Navigation.CurrentEntry) => Fx.Fx<B, E2, R2>
  ) => Fx.Fx<
    A | B,
    Exclude<E | E2, Navigation.RedirectError>,
    Navigation.Navigation | CurrentEnvironment | R | R2 | Scope.Scope
  >

  readonly redirect: <const P extends string>(
    route: Route.Route<P> | P,
    ...params: [keyof Path.ParamsOf<P>] extends [never] ? [{}?] : [Path.ParamsOf<P>]
  ) => Fx.Fx<
    A,
    Exclude<E, Navigation.RedirectError>,
    Navigation.Navigation | CurrentRoute | CurrentEnvironment | R | Scope.Scope
  >
}

/**
 * @since 1.0.0
 */
export interface RouteGuard<
  P extends string,
  A,
  O,
  E = never,
  R = never,
  E2 = never,
  R2 = never
> {
  readonly route: Route.Route<P>
  readonly guard: Guard.Guard<string, A, E, R>
  readonly match: (ref: RefSubject.RefSubject<A>) => Fx.Fx<O, E2, R2>
}

class RouteMatcherImpl<A, E, R> implements RouteMatcher<A, E, R> {
  constructor(readonly guards: ReadonlyArray<RouteGuard<any, any, any, any, any, any, any>>) {
    this.match = this.match.bind(this)
    this.to = this.to.bind(this)
    this.notFound = this.notFound.bind(this)
    this.redirect = this.redirect.bind(this)
  }

  match(
    ...args: any
  ) {
    const route = getRoute(args[0])
    if (args.length === 2) {
      return new RouteMatcherImpl([...this.guards, {
        route,
        guard: getGuard(route),
        match: (ref: any) => Fx.scoped(args[1](ref))
      }]) as any
    } else {
      return new RouteMatcherImpl([...this.guards, {
        route,
        guard: getGuard(route, args[1]),
        match: (ref: any) => Fx.scoped(args[2](ref))
      }]) as any
    }
  }

  to(
    ...args: any
  ) {
    const route = getRoute(args[0])
    if (args.length === 2) {
      return this.match(route, (ref: any) => RefSubject.map(ref, args[1]))
    } else {
      return this.match(route, args[1], (ref: any) => RefSubject.map(ref, args[2]))
    }
  }

  notFound<B, E2, R2>(
    f: (destination: RefSubject.Computed<Navigation.Destination, never, Navigation.Navigation>) => Fx.Fx<B, E2, R2>
  ): Fx.Fx<
    A | B,
    Exclude<E | E2, Navigation.RedirectError>,
    R | R2 | CurrentEnvironment | Navigation.Navigation | Scope.Scope
  > {
    return Fx.fromFxEffect(CurrentEnvironment.with((env) => {
      const onNotFound = Fx.scoped(f(Navigation.CurrentEntry))
      let matcher: Match.ValueMatcher<string, A | B, E | E2, R | R2 | Navigation.Navigation | Scope.Scope> = Match
        .value(
          // Only if we're rendering in a DOM-based environment should we allow for routing to last indefinitely
          env === "dom" || env === "test:dom" ? Navigation.CurrentPath : Fx.take(Navigation.CurrentPath, 1)
        )

      for (const { guard, match, route } of this.guards) {
        matcher = matcher.when(guard, (ref) => Fx.middleware(match(ref), withCurrentRoute(route)))
      }

      return Fx.filterMapErrorEffect(matcher.getOrElse(() => onNotFound), (e) =>
        Navigation.isRedirectError(e)
          // Fork the redirect to ensure it does not occur within the same runUpdates as the initial navigation
          ? Effect.as(Effect.forkScoped(Navigation.handleRedirect(e)), Option.none())
          : Effect.succeedSome(e as Exclude<E | E2, Navigation.RedirectError>))
    }))
  }

  redirect<const P extends string>(
    route: P | Route.Route<P>,
    ...params: [keyof Path.ParamsOf<P>] extends [never] ? [{}?] : [Path.ParamsOf<P>]
  ): Fx.Fx<
    A,
    Exclude<E, Navigation.RedirectError>,
    R | Navigation.Navigation | CurrentEnvironment | CurrentRoute | Scope.Scope
  > {
    return this.notFound(() =>
      RefSubject.mapEffect(makeHref(route, ...params), (s) => Effect.fail(Navigation.redirectToPath(s)))
    )
  }
}
function getGuard<const P extends string, B, E2, R2>(
  path: Route.Route<P>,
  guard?: Guard.Guard<Path.ParamsOf<P>, B, E2, R2>
) {
  if (guard) {
    return Guard.compose(path, guard)
  } else {
    return path.asGuard()
  }
}

function getRoute<const P extends string>(route: Route.Route<P> | P): Route.Route<P> {
  return typeof route === "string" ? Route.fromPath(route) : route
}

/**
 * @since 1.0.0
 */
export function empty(): RouteMatcher<never, never, never> {
  return new RouteMatcherImpl<never, never, never>([]) as any
}

/**
 * @since 1.18.0
 */
export const {
  /**
   * @since 1.0.0
   */
  match,
  /**
   * @since 1.0.0
   */
  to
} = empty()
