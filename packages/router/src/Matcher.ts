/**
 * @since 1.0.0
 */

import { CurrentEnvironment } from "@typed/environment"
import * as Fx from "@typed/fx/Fx"
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

/**
 * @since 1.0.0
 */
export interface RouteMatcher<out A, out E, out R> {
  readonly guards: ReadonlyArray<RouteMatch<string, any, A, E, R, E, R>>

  readonly match: <
    const P extends string,
    B = Path.ParamsOf<P>,
    E2 = never,
    R2 = never,
    C = never,
    E3 = never,
    R3 = never
  >(
    route: P | Route.RouteInput<P, B, E2, R2>,
    f: (ref: RefSubject.RefSubject<B>) => Fx.Fx<C, E3, R3>
  ) => RouteMatcher<A | C, E | E2 | E3, R | Exclude<R2, Scope.Scope> | Exclude<R3, Scope.Scope>>

  readonly to: <
    const P extends string,
    B = Path.ParamsOf<P>,
    E2 = never,
    R2 = never,
    C = never,
    E3 = never,
    R3 = never
  >(
    route: P | Route.RouteInput<P, B, E2, R2>,
    f: (b: B) => C
  ) => RouteMatcher<A | C, E | E2 | E3, R | Exclude<R2, Scope.Scope> | Exclude<R3, Scope.Scope>>

  readonly notFound: {
    <B, E2, R2>(
      f: (destination: typeof Navigation.CurrentEntry) => Fx.Fx<B, E2, R2>
    ): Fx.Fx<
      A | B,
      Exclude<E | E2, Navigation.RedirectError>,
      Navigation.Navigation | CurrentEnvironment | R | R2 | Scope.Scope
    >

    <B, E2, R2>(
      f: (destination: typeof Navigation.CurrentEntry) => Effect.Effect<B, E2, R2>
    ): Fx.Fx<
      A | B,
      Exclude<E | E2, Navigation.RedirectError>,
      Navigation.Navigation | CurrentEnvironment | R | R2 | Scope.Scope
    >
  }

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
export interface RouteMatch<
  P extends string,
  A,
  O,
  E = never,
  R = never,
  E2 = never,
  R2 = never
> {
  readonly guard: Route.RouteGuard<P, A, E, R>
  readonly match: (ref: RefSubject.RefSubject<A>) => Fx.Fx<O, E2, R2>
}

/**
 * @since 1.0.0
 */
export function RouteMatch<P extends string, A, O, E = never, R = never, E2 = never, R2 = never>(
  guard: Route.RouteGuard<P, A, E, R>,
  match: (ref: RefSubject.RefSubject<A>) => Fx.Fx<O, E2, R2>
): RouteMatch<P, A, O, E, R, E2, R2> {
  return { guard, match }
}

class RouteMatcherImpl<A, E, R> implements RouteMatcher<A, E, R> {
  constructor(readonly guards: ReadonlyArray<RouteMatch<any, any, any, any, any, any, any>>) {
    this.match = this.match.bind(this)
    this.to = this.to.bind(this)
    this.notFound = this.notFound.bind(this)
    this.redirect = this.redirect.bind(this)
  }

  match<P extends string, B, E2, R2, C, E3, R3>(
    route: P | Route.RouteInput<P, B, E2, R2>,
    f: (ref: RefSubject.RefSubject<B>) => Fx.Fx<C, E3, R3>
  ): RouteMatcher<A | C, E | E2 | E3, R | Exclude<R2, Scope.Scope> | Exclude<R3, Scope.Scope>> {
    return new RouteMatcherImpl<any, any, any>([...this.guards, RouteMatch(getRouteGuard(route), f)])
  }

  to<P extends string, B, E2, R2, C, E3, R3>(
    route: P | Route.RouteInput<P, B, E2, R2>,
    f: (b: B) => C
  ): RouteMatcher<A | C, E | E2 | E3, R | Exclude<R2, Scope.Scope> | Exclude<R3, Scope.Scope>> {
    return this.match(route, Fx.map(f))
  }

  notFound<B, E2, R2>(
    f: (
      destination: RefSubject.Computed<Navigation.Destination, never, Navigation.Navigation>
    ) => Fx.Fx<B, E2, R2>
  ): Fx.Fx<
    A | B,
    Exclude<E | E2, Navigation.RedirectError>,
    R | R2 | CurrentEnvironment | Navigation.Navigation | Scope.Scope
  >

  notFound<B, E2, R2>(
    f: (
      destination: RefSubject.Computed<Navigation.Destination, never, Navigation.Navigation>
    ) => Effect.Effect<B, E2, R2>
  ): Fx.Fx<
    A | B,
    Exclude<E | E2, Navigation.RedirectError>,
    R | R2 | CurrentEnvironment | Navigation.Navigation | Scope.Scope
  >

  notFound<B, E2, R2>(
    f: (
      destination: RefSubject.Computed<Navigation.Destination, never, Navigation.Navigation>
    ) => Fx.Fx<B, E2, R2> | Effect.Effect<B, E2, R2>
  ): Fx.Fx<
    A | B,
    Exclude<E | E2, Navigation.RedirectError>,
    R | R2 | CurrentEnvironment | Navigation.Navigation | Scope.Scope
  > {
    return Fx.fromFxEffect(CurrentEnvironment.with((env) => {
      const handler = f(Navigation.CurrentEntry)
      const onNotFound = Fx.scoped(Fx.isFx(handler) ? handler : Fx.fromEffect(handler))
      let matcher: Match.ValueMatcher<string, A | B, E | E2, R | R2 | Navigation.Navigation | Scope.Scope> = Match
        .value(
          // Only if we're rendering in a DOM-based environment should we allow for routing to last indefinitely
          env === "dom" || env === "test:dom" ? Navigation.CurrentPath : Fx.take(Navigation.CurrentPath, 1)
        )

      for (const { guard, match } of this.guards) {
        matcher = matcher.when(guard, (ref) => Fx.middleware(match(ref), withCurrentRoute(guard.route)))
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

function getRouteGuard<P extends string, A, E, R>(
  route: P | Route.RouteInput<P, A, E, R>
): Route.RouteGuard<P, A, E, R> {
  if (typeof route === "string") {
    return Route.asRouteGuard(Route.fromPath(route))
  } else {
    return Route.asRouteGuard(route)
  }
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
