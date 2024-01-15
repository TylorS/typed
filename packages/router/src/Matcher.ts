/**
 * @since 1.0.0
 */

import { CurrentEnvironment } from "@typed/environment"
import * as Fx from "@typed/fx/Fx"
import * as Guard from "@typed/fx/Guard"
import * as Match from "@typed/fx/Match"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Navigation from "@typed/navigation"
import type * as Path from "@typed/path"
import * as Route from "@typed/route"
import type { Scope } from "effect"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import type { CurrentRoute } from "./CurrentRoute.js"
import { makeHref, withCurrentRoute } from "./CurrentRoute.js"

// TODO: Form component
// TODO: view transitions - opt-in via link/form component
// TODO: scroll restoration
// TODO: Utilize scroll events on Window to capture scroll positions and elements

/**
 * @since 1.0.0
 */
export interface RouteMatcher<R, E, A> {
  readonly match: {
    <const P extends string, R2, E2, B>(
      route: Route.Route<P> | P,
      f: (ref: RefSubject.RefSubject<never, never, Path.ParamsOf<P>>) => Fx.Fx<R2, E2, B>
    ): RouteMatcher<R | Exclude<R2, Scope.Scope>, E | E2, A | B>

    <const P extends string, R2, E2, B, R3, E3, C>(
      route: Route.Route<P> | P,
      guard: Guard.Guard<Path.ParamsOf<P>, R2, E2, B>,
      f: (ref: RefSubject.RefSubject<never, never, B>) => Fx.Fx<R3, E3, C>
    ): RouteMatcher<R | Exclude<R2, Scope.Scope> | Exclude<R3, Scope.Scope>, E | E2 | E3, A | C>
  }

  readonly to: {
    <const P extends string, B>(
      route: Route.Route<P> | P,
      f: (params: Path.ParamsOf<P>) => B
    ): RouteMatcher<R, E, A | B>

    <const P extends string, R2, E2, B, R3, E3, C>(
      route: Route.Route<P> | P,
      guard: Guard.Guard<Path.ParamsOf<P>, R2, E2, B>,
      f: (b: B) => C
    ): RouteMatcher<R | Exclude<R2, Scope.Scope> | Exclude<R3, Scope.Scope>, E | E2 | E3, A | C>
  }

  readonly notFound: <R2, E2, B>(
    f: (destination: typeof Navigation.CurrentEntry) => Fx.Fx<R2, E2, B>
  ) => Fx.Fx<
    Navigation.Navigation | CurrentEnvironment | R | R2 | Scope.Scope,
    Exclude<E | E2, Navigation.RedirectError>,
    A | B
  >

  readonly redirect: <const P extends string>(
    route: Route.Route<P> | P,
    ...[params]: [keyof Path.ParamsOf<P>] extends [never] ? [{}?] : [Path.ParamsOf<P>]
  ) => Fx.Fx<
    Navigation.Navigation | CurrentRoute | CurrentEnvironment | R | Scope.Scope,
    Exclude<E, Navigation.RedirectError>,
    A
  >
}

interface RouteGuard {
  readonly route: Route.Route<any>
  readonly guard: Guard.Guard<string, any, any, any>
  readonly match: (ref: RefSubject.RefSubject<never, never, any>) => Fx.Fx<any, any, any>
}

class RouteMatcherImpl<R, E, A> implements RouteMatcher<R, E, A> {
  constructor(readonly guards: ReadonlyArray<RouteGuard>) {
    this.match = this.match.bind(this)
    this.to = this.to.bind(this)
    this.notFound = this.notFound.bind(this)
    this.redirect = this.redirect.bind(this)
  }

  match<const P extends string, R2, E2, B>(
    route: Route.Route<P> | P,
    f: (ref: RefSubject.RefSubject<never, never, Path.ParamsOf<P>>) => Fx.Fx<R2, E2, B>
  ): RouteMatcher<R | Exclude<R2, Scope.Scope>, E | E2, A | B>
  match<const P extends string, R2, E2, B, R3, E3, C>(
    route: Route.Route<P> | P,
    guard: Guard.Guard<Path.ParamsOf<P>, R2, E2, B>,
    f: (ref: RefSubject.RefSubject<never, never, B>) => Fx.Fx<R3, E3, C>
  ): RouteMatcher<R | Exclude<R2 | R3, Scope.Scope>, E | E2 | E3, A | C>

  match<const P extends string, R2, E2, B, R3, E3, C>(
    pathOrRoute: Route.Route<P> | P,
    guard:
      | Guard.Guard<Path.ParamsOf<P>, R2, E2, B>
      | ((ref: RefSubject.RefSubject<never, never, B>) => Fx.Fx<R3, E3, C>),
    f?: (ref: RefSubject.RefSubject<never, never, B>) => Fx.Fx<R3, E3, C>
  ): RouteMatcher<R | R2 | R3, E | E2 | E3, A | C> {
    const route = getRoute(pathOrRoute)

    if (arguments.length === 2) {
      return new RouteMatcherImpl<R | R2 | R3, E | E2 | E3, A | C>([...this.guards, {
        route,
        guard: getGuard(route),
        match: (ref) => Fx.scoped((guard as any)!(ref))
      }]) as any
    } else {
      return new RouteMatcherImpl<R | R2 | R3, E | E2 | E3, A | C>([...this.guards, {
        route,
        guard: getGuard(route, guard as any),
        match: (ref) => Fx.scoped((f as any)!(ref))
      }]) as any
    }
  }

  to<const P extends string, R2, E2, B>(
    route: Route.Route<P> | P,
    f: (params: Path.ParamsOf<P>) => B
  ): RouteMatcher<R | R2, E | E2, A | B>

  to<const P extends string, R2, E2, B, R3, E3, C>(
    route: Route.Route<P> | P,
    guard: Guard.Guard<Path.ParamsOf<P>, R2, E2, B>,
    f: (b: B) => C
  ): RouteMatcher<R | R2 | R3, E | E2 | E3, A | C>

  to<const P extends string, R2, E2, B, R3, E3, C>(
    route: Route.Route<P> | P,
    guard: Guard.Guard<Path.ParamsOf<P>, R2, E2, B> | ((b: B) => C),
    f?: (b: B) => C
  ): RouteMatcher<R | Exclude<R2 | R3, Scope.Scope>, E | E2 | E3, A | C> {
    if (arguments.length === 2) {
      return this.match(route, (ref) => RefSubject.map(ref, guard as any))
    } else {
      return this.match(route, guard as any, (ref) => RefSubject.map(ref, f as any))
    }
  }

  notFound<R2, E2, B>(
    f: (destination: RefSubject.Computed<Navigation.Navigation, never, Navigation.Destination>) => Fx.Fx<R2, E2, B>
  ): Fx.Fx<
    R | R2 | CurrentEnvironment | Navigation.Navigation | Scope.Scope,
    Exclude<E | E2, Navigation.RedirectError>,
    A | B
  > {
    return Fx.fromFxEffect(CurrentEnvironment.with((env) => {
      const onNotFound = Fx.scoped(f(Navigation.CurrentEntry))
      let matcher: Match.ValueMatcher<R | R2 | Navigation.Navigation | Scope.Scope, E | E2, string, A | B> = Match
        .value(
          // Only if we're rendering in a DOM-based environment should we allow for routing to last indefinitely
          env === "server" || env === "static" ? Fx.take(Navigation.CurrentPath, 1) : Navigation.CurrentPath
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
    R | Navigation.Navigation | CurrentEnvironment | CurrentRoute | Scope.Scope,
    Exclude<E, Navigation.RedirectError>,
    A
  > {
    return this.notFound(() =>
      RefSubject.mapEffect(makeHref(route, ...params), (s) => Effect.fail(Navigation.redirectToPath(s)))
    )
  }
}

function getGuard<const P extends string, R2, E2, B>(
  path: Route.Route<P>,
  guard?: Guard.Guard<Path.ParamsOf<P>, R2, E2, B>
) {
  if (guard) {
    return Guard.compose(Route.asGuard(getRoute(path)), guard)
  } else {
    return Route.asGuard(getRoute(path))
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
