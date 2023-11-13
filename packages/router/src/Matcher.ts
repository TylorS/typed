import type * as Computed from "@typed/fx/Computed"
import * as Fx from "@typed/fx/Fx"
import * as Guard from "@typed/fx/Guard"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Navigation from "@typed/navigation"
import type * as Path from "@typed/path"
import * as Route from "@typed/route"
import { Cause, Deferred, Effect, Exit, Option, Scope } from "effect"
import { constant } from "effect/Function"
import { isNonEmptyReadonlyArray, reduce } from "effect/ReadonlyArray"

export interface RouteMatcher<R, E, A> {
  readonly match: {
    <const P extends string, R2, E2, B>(
      route: Route.Route<P> | P,
      f: (ref: RefSubject.RefSubject<never, never, Path.ParamsOf<P>>) => Fx.FxInput<R2, E2, B>
    ): RouteMatcher<R | Exclude<R2, Scope.Scope>, E | E2, A | B>

    <const P extends string, R2, E2, B, R3, E3, C>(
      route: Route.Route<P> | P,
      guard: Guard.Guard<Path.ParamsOf<P>, R2, E2, B>,
      f: (ref: RefSubject.RefSubject<never, never, B>) => Fx.FxInput<R3, E3, C>
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

  // TODO: Needs to handle RedirectErrors
  notFound<R2, E2, B>(
    f: (destination: typeof Navigation.CurrentDestination) => Fx.FxInput<R2, E2, B>
  ): Fx.Fx<Navigation.Navigation | R | Exclude<R2, Scope.Scope>, E | E2, A | B>
}

interface RouteGuard {
  readonly guard: Guard.Guard<string, any, any, any>
  readonly match: (ref: RefSubject.RefSubject<never, never, any>) => Fx.FxInput<any, any, any>
}

class RouteMatcherImpl<R, E, A> implements RouteMatcher<R, E, A> {
  constructor(readonly guards: ReadonlyArray<RouteGuard>) {
    this.match = this.match.bind(this)
    this.to = this.to.bind(this)
    this.notFound = this.notFound.bind(this)
  }

  match<const P extends string, R2, E2, B>(
    route: Route.Route<P> | P,
    f: (ref: RefSubject.RefSubject<never, never, Path.ParamsOf<P>>) => Fx.FxInput<R2, E2, B>
  ): RouteMatcher<R | R2, E | E2, A | B>
  match<const P extends string, R2, E2, B, R3, E3, C>(
    route: Route.Route<P> | P,
    guard: Guard.Guard<Path.ParamsOf<P>, R2, E2, B>,
    f: (ref: RefSubject.RefSubject<never, never, B>) => Fx.FxInput<R3, E3, C>
  ): RouteMatcher<R | R2 | R3, E | E2 | E3, A | C>

  match<const P extends string, R2, E2, B, R3, E3, C>(
    route: Route.Route<P> | P,
    guard:
      | Guard.Guard<Path.ParamsOf<P>, R2, E2, B>
      | ((ref: RefSubject.RefSubject<never, never, B>) => Fx.FxInput<R3, E3, C>),
    f?: (ref: RefSubject.RefSubject<never, never, B>) => Fx.FxInput<R3, E3, C>
  ): RouteMatcher<R | R2 | R3, E | E2 | E3, A | C> {
    if (arguments.length === 2) {
      return new RouteMatcherImpl<R | R2 | R3, E | E2 | E3, A | C>([...this.guards, {
        guard: getGuard(route),
        match: guard as any
      }]) as any
    } else {
      return new RouteMatcherImpl<R | R2 | R3, E | E2 | E3, A | C>([...this.guards, {
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
    f: (destination: Computed.Computed<Navigation.Navigation, never, Navigation.Destination>) => Fx.FxInput<R2, E2, B>
  ): Fx.Fx<R | Exclude<R2, Scope.Scope> | Navigation.Navigation, E | E2, A | B> {
    return Fx.suspend(() => {
      const { guards } = this
      const refSubjects = new WeakMap<RouteGuard, RefSubject.RefSubject<never, never, any>>()
      const onNotFound = Fx.scoped(Fx.from(f(Navigation.CurrentDestination)))
      const getRefSubject = (routeGuard: RouteGuard, value: any) =>
        Effect.gen(function*(_) {
          let refSubject = refSubjects.get(routeGuard)

          if (refSubject) {
            yield* _(refSubject.set(value))
          } else {
            refSubject = yield* _(RefSubject.of(value))
          }

          return refSubject
        })

      let previous: RouteGuard | undefined

      return Fx.withFlattenStrategy<R | Exclude<R2, Scope.Scope> | Navigation.Navigation, E | E2, A | B>(
        ({ fork, scope, sink }) => {
          return Effect.gen(function*(_) {
            const navigation = yield* _(Navigation.Navigation)

            const run = (fx: Fx.Fx<R | R2, E | E2, A | B>) =>
              Effect.gen(function*(_) {
                const deferred = yield* _(Deferred.make<Navigation.RedirectError, void>())

                yield* _(
                  Fx.run(Fx.tap(fx, constant(Deferred.succeed(deferred, undefined))), sink),
                  fork
                )

                return Option.some(Deferred.await(deferred))
              })

            const onDestination = (destination: Navigation.Destination) =>
              Effect.gen(function*(_) {
                const currentPath = Navigation.getCurrentPathFromUrl(destination.url)
                // Allow failures to be accumulated, such that errors do not break the overall match
                // and additional matchers can be attempted against first
                const causes: Array<Cause.Cause<E>> = []

                if (previous) {
                  const matchedExit = yield* _(previous.guard(currentPath), Effect.exit)
                  if (Exit.isSuccess(matchedExit)) {
                    const matched = matchedExit.value

                    if (Option.isSome(matched)) {
                      yield* _(getRefSubject(previous, matched.value))
                      return Option.none()
                    }
                  } else {
                    causes.push(matchedExit.cause)
                  }
                }

                for (const current of guards) {
                  // Don't test this case twice
                  if (current === previous) continue

                  const matchedExit = yield* _(current.guard(currentPath), Effect.exit)

                  if (Exit.isSuccess(matchedExit)) {
                    const matched = matchedExit.value

                    if (Option.isSome(matched)) {
                      const refSubject = yield* _(getRefSubject(current, matched.value))
                      previous = current

                      return yield* _(run(Fx.from(current.match(refSubject))))
                    }
                  } else {
                    causes.push(matchedExit.cause)
                  }
                }

                if (isNonEmptyReadonlyArray(causes)) {
                  const [first, ...rest] = causes

                  yield* _(sink.onFailure(reduce(rest, first, Cause.sequential)))
                }

                if (previous === undefined) {
                  return yield* _(run(onNotFound))
                } else {
                  return Option.none()
                }
              })

            yield* _(
              navigation.onNavigation<R, never>(onDestination),
              Effect.provideService(Scope.Scope, scope)
            )

            yield* _(navigation.current, Effect.flatMap(onDestination))

            // TODO: We should figure out how to kill this early for the server
            // Make @typed/environemnt a shared interface for this behavior
            return yield* _(Effect.never)
          })
        },
        Fx.Switch
      )
    })
  }
}

function getGuard<const P extends string, R2, E2, B>(
  path: Route.Route<P> | P,
  guard?: Guard.Guard<Path.ParamsOf<P>, R2, E2, B>
) {
  const routeGuard = Route.asGuard(getRoute(path))

  if (guard) {
    return Guard.flatMap(routeGuard, guard)
  } else {
    return routeGuard
  }
}

function getRoute<const P extends string>(route: Route.Route<P> | P): Route.Route<P> {
  return typeof route === "string" ? Route.fromPath(route) : route
}

export function empty(): RouteMatcher<never, never, never> {
  return new RouteMatcherImpl<never, never, never>([])
}

export const { match, to } = empty()
