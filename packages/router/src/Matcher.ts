import { CurrentEnvironment } from "@typed/environment"
import type * as Computed from "@typed/fx/Computed"
import * as Fx from "@typed/fx/Fx"
import * as Guard from "@typed/fx/Guard"
import * as Match from "@typed/fx/Match"
import type * as RefSubject from "@typed/fx/RefSubject"
import * as Navigation from "@typed/navigation"
import type * as Path from "@typed/path"
import * as Route from "@typed/route"
import type { CurrentRoute } from "@typed/router/CurrentRoute"
import { makeHref, withCurrentRoute } from "@typed/router/CurrentRoute"
import { Effect, Option, type Scope } from "effect"

// TODO: Link component
// TODO: Form component
// TODO: view transitions - opt-in via link/form component
// TODO: scroll restoration
// TODO: Utilize scroll events on Window to capture scroll positions and elements

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
    f: (destination: typeof Navigation.CurrentDestination) => Fx.Fx<R2, E2, B>
  ) => Fx.Fx<
    Navigation.Navigation | CurrentEnvironment | R | Exclude<R2, Scope.Scope>,
    Exclude<E | E2, Navigation.RedirectError>,
    A | B
  >

  readonly redirect: <const P extends string>(
    route: Route.Route<P> | P,
    ...[params]: [keyof Path.ParamsOf<P>] extends [never] ? [{}?] : [Path.ParamsOf<P>]
  ) => Fx.Fx<
    Navigation.Navigation | CurrentRoute | CurrentEnvironment | R,
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
  ): RouteMatcher<R | R2, E | E2, A | B>
  match<const P extends string, R2, E2, B, R3, E3, C>(
    route: Route.Route<P> | P,
    guard: Guard.Guard<Path.ParamsOf<P>, R2, E2, B>,
    f: (ref: RefSubject.RefSubject<never, never, B>) => Fx.Fx<R3, E3, C>
  ): RouteMatcher<R | R2 | R3, E | E2 | E3, A | C>

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
        match: guard as any
      }]) as any
    } else {
      return new RouteMatcherImpl<R | R2 | R3, E | E2 | E3, A | C>([...this.guards, {
        route,
        guard: getGuard(route, guard as any),
        match: f as any
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
  ): RouteMatcher<R | R2 | R3, E | E2 | E3, A | C> {
    if (arguments.length === 2) {
      return this.match(route, (ref) => ref.map(guard as any))
    } else {
      return this.match(route, guard as any, (ref) => ref.map(f as any))
    }
  }

  notFound<R2, E2, B>(
    f: (destination: Computed.Computed<Navigation.Navigation, never, Navigation.Destination>) => Fx.Fx<R2, E2, B>
  ): Fx.Fx<
    R | Exclude<R2, Scope.Scope> | CurrentEnvironment | Navigation.Navigation,
    Exclude<E | E2, Navigation.RedirectError>,
    A | B
  > {
    const onNotFound = Fx.scoped(Fx.from(f(Navigation.CurrentDestination)))

    return Fx.fromFxEffect(CurrentEnvironment.with((env) => {
      let matcher: Match.ValueMatcher<R | Exclude<R2, Scope.Scope> | Navigation.Navigation, E | E2, string, A | B> =
        Match.value(
          env !== "browser" ? Fx.take(Navigation.CurrentPath, 1) : Navigation.CurrentPath
        )

      for (const { guard, match, route } of this.guards) {
        matcher = matcher.when(guard, (ref) => Fx.scoped(Fx.middleware(Fx.from(match(ref)), withCurrentRoute(route))))
      }

      return Fx.filterMapErrorEffect(matcher.getOrElse(() => onNotFound), (e) =>
        Navigation.isRedirectError(e)
          ? Effect.as(Effect.orDie(Navigation.handleRedirect(e)), Option.none())
          : Effect.succeedSome(e as Exclude<E | E2, Navigation.RedirectError>))
    }))
  }

  redirect<const P extends string>(
    route: P | Route.Route<P>,
    ...params: [keyof Path.ParamsOf<P>] extends [never] ? [{}?] : [Path.ParamsOf<P>]
  ): Fx.Fx<R | Navigation.Navigation | CurrentEnvironment | CurrentRoute, Exclude<E, Navigation.RedirectError>, A> {
    return this.notFound(() => makeHref(route, ...params).mapEffect((s) => Effect.fail(Navigation.redirectToPath(s))))
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

export function empty(): RouteMatcher<never, never, never> {
  return new RouteMatcherImpl<never, never, never>([]) as any
}

export const { match, to } = empty()
