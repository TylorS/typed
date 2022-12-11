import * as Effect from '@effect/core/io/Effect'
import { Layer, fromEffect, provideToAndMerge } from '@effect/core/io/Layer'
import * as Ref from '@effect/core/io/Ref'
import { flow } from '@fp-ts/data/Function'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Maybe from '@tsplus/stdlib/data/Maybe'
import { Tag } from '@tsplus/stdlib/service/Tag'
import * as Fx from '@typed/fx'

import { pushState } from '../DOM/History.js'

import * as CurrentPath from './CurrentPath.js'
import * as Path from './Path.js'
import * as Route from './Route.js'

export interface Router<R extends Route.Route<any, any, any> = Route.Route<string>> {
  readonly route: R

  readonly params: Fx.Fx<
    CurrentPath.CurrentPath | Route.ResourcesOf<R>,
    Route.ErrorsOf<R>,
    Maybe.Maybe<Route.ParamsOf<R>>
  >

  readonly define: <R2 extends Route.Route<any, any, any>>(
    route: R2,
  ) => Router<
    Route.Route<
      Path.PathJoin<[Route.PathOf<R>, Route.PathOf<R2>]>,
      Route.ResourcesOf<R> | Route.ResourcesOf<R2>,
      Route.ErrorsOf<R> | Route.ErrorsOf<R2>
    >
  >
}

export function makeRouter<R extends Route.Route<any, any, any>>(
  route: R,
): Effect.Effect<CurrentPath.CurrentPath, never, Router<R>> {
  return Effect.serviceWith(
    CurrentPath.CurrentPath,
    (currentPath): Router<R> => makeRouterWithCurrentPath(route, currentPath),
  )
}

function makeRouterWithCurrentPath<R extends Route.Route<any, any, any>>(
  route: R,
  currentPath: CurrentPath.CurrentPath,
): Router<R> {
  const matched = pipe(
    currentPath.currentPath,
    Fx.switchMap((p) =>
      Fx.fromEffect(
        route.match(p) as Effect.Effect<
          Route.ResourcesOf<R>,
          Route.ErrorsOf<R>,
          Maybe.Maybe<Route.ParamsOf<R>>
        >,
      ),
    ),
    Fx.multicast,
  )

  const router: Router<R> = {
    route,
    params: matched as Router<R>['params'],
    define: ((route2) =>
      makeRouterWithCurrentPath(
        Route.concatRoute(route, route2),
        currentPath,
      )) as Router<R>['define'],
  }

  return router
}

/**
 * Tag for the "base" router instance which utilizes the base route to allow full matching elsewhere.
 * If you require nested routers, you should use the `define` method primarily and pass it around as
 * a value at that point. If you require DI for that nested Router cool, but I would suggest creating
 * our own Tag and using it.
 */
export const Router = Tag<Router>()

export const base: Layer<CurrentPath.CurrentPath, never, Router> = fromEffect(Router)(
  makeRouter(Route.baseRoute),
)

export const routerLayer: Layer<
  Location | History | Window,
  never,
  Router | CurrentPath.CurrentPath
> = pipe(CurrentPath.currentPathLayer, provideToAndMerge(base))

/**
 * Get the base Router
 */
export const getRouter: Effect.Effect<Router, never, Router> = Effect.service(Router)

export const empty = RouteMatcher<never, never, never>(new Map())

export const { match, noMatch } = empty

// TODO: Allow providing resources to a route matcher

export interface RouteMatcher<R, E, A> {
  readonly matches: ReadonlyMap<
    Route.Route<any, any, any>,
    (params: Fx.Fx<never, never, Path.ParamsOf<string>>) => Fx.Fx<R, E, A>
  >

  readonly match: <Route extends Route.Route<any, any, any>, R2, E2, B>(
    route: Route,
    f: (params: Route.ParamsOf<Route>) => Fx.Fx<R2, E2, B>,
  ) => RouteMatcher<R | R2 | Route.ResourcesOf<Route>, E | E2 | Route.ErrorsOf<Route>, A | B>

  readonly matchFx: <Route extends Route.Route<any, any, any>, R2, E2, B>(
    route: Route,
    f: (params: Fx.Fx<never, never, Route.ParamsOf<Route>>) => Fx.Fx<R2, E2, B>,
  ) => RouteMatcher<R | R2 | Route.ResourcesOf<Route>, E | E2 | Route.ErrorsOf<Route>, A | B>

  readonly provideService: <S>(tag: Tag<S>, service: S) => RouteMatcher<Exclude<R, S>, E, A>

  readonly provideLayer: <R2, E2, S>(
    layer: Layer<R2, E2, S>,
  ) => RouteMatcher<R2 | Exclude<R, S>, E | E2, A>

  readonly noMatch: <R2, E2, B>(
    f: () => Fx.Fx<R2, E2, B>,
  ) => Fx.Fx<R | R2 | Router | CurrentPath.CurrentPath, E | E2, A | B>

  readonly redirect: <P extends string, R2, E2>(
    route: Route.Route<P, R2, E2>,
    ...[params]: [keyof Route.ParamsOf<typeof route>] extends [never]
      ? []
      : [Route.ParamsOf<typeof route>]
  ) => Fx.Fx<R | Router | History | CurrentPath.CurrentPath, E, A | void>
}

export function RouteMatcher<R, E, A>(
  matches: ReadonlyMap<
    Route.Route<any, any, any>,
    (params: Path.ParamsOf<string>) => Fx.Fx<R, E, A>
  >,
): RouteMatcher<R, E, A> {
  const matcher: RouteMatcher<R, E, A> = {
    matches,
    match: <Route extends Route.Route<any, any, any>, R2, E2, B>(
      route: Route,
      f: (params: Route.ParamsOf<Route>) => Fx.Fx<R2, E2, B>,
    ): RouteMatcher<R | R2 | Route.ResourcesOf<Route>, E | E2 | Route.ErrorsOf<Route>, A | B> =>
      RouteMatcher(new Map<any, any>([...matches, [route, Fx.switchMap(f)]])),
    matchFx: <Route extends Route.Route<any, any, any>, R2, E2, B>(
      route: Route,
      f: (params: Fx.Fx<never, never, Route.ParamsOf<Route>>) => Fx.Fx<R2, E2, B>,
    ): RouteMatcher<R | R2 | Route.ResourcesOf<Route>, E | E2 | Route.ErrorsOf<Route>, A | B> =>
      RouteMatcher(new Map<any, any>([...matches, [route, f]])),
    provideService: <S>(tag: Tag<S>, service: S): RouteMatcher<Exclude<R, S>, E, A> =>
      RouteMatcher(
        new Map(
          Array.from(matches).map(([route, match]) => [
            route,
            flow(match, Fx.provideService(tag, service)),
          ]),
        ),
      ),
    provideLayer: <R2, E2, S>(
      layer: Layer<R2, E2, S>,
    ): RouteMatcher<R2 | Exclude<R, S>, E | E2, A> =>
      RouteMatcher(
        new Map(
          Array.from(matches).map(([route, match]) => [
            route,
            flow(match, Fx.provideSomeLayer(layer)),
          ]),
        ),
      ),
    noMatch: (f) => runRouteMatcher(matcher, f),
    redirect: (route, ...[params]) =>
      runRouteMatcher(matcher, () =>
        Fx.fromEffect(pushState(route.createPath((params || {}) as Route.ParamsOf<typeof route>))),
      ),
  }

  return matcher
}

export function runRouteMatcher<R, E, A, R2, E2, B>(
  matcher: RouteMatcher<R, E, A>,
  noMatch: () => Fx.Fx<R2, E2, B>,
): Fx.Fx<R | R2 | Router | CurrentPath.CurrentPath, E | E2, A | B> {
  return Fx.hold(
    Fx.fromFxGen(function* ($) {
      const { currentPath } = yield* $(CurrentPath.CurrentPath)
      const router = yield* $(Router)
      const routes = Array.from(matcher.matches).map(
        ([route, match]) => [Route.concatRoute(router.route, route), match] as const,
      )
      const paramsSubject = yield* $(Fx.makeSubject<never, any>())
      const previousRoute = yield* $(
        Ref.makeRef((): Route.Route<any, any, any> | undefined => undefined),
      )

      return pipe(
        currentPath,
        Fx.exhaustMapLatest((path) =>
          Fx.fromEffect(
            Effect.gen(function* ($) {
              const previous = yield* $(previousRoute.get)
              for (const [route, match] of routes) {
                const params = yield* $(route.match(path))

                if (Maybe.isSome(params)) {
                  if (previous === route) {
                    yield* $(paramsSubject.emit(params.value))

                    return Maybe.none
                  }

                  yield* $(previousRoute.set(route))

                  return Maybe.some(
                    pipe(
                      paramsSubject,
                      Fx.startWith(params.value),
                      match,
                      Fx.provideService(Router, (yield* $(makeRouter(route))) as Router),
                      Fx.hold,
                    ),
                  )
                }
              }

              yield* $(previousRoute.set(undefined))

              return Maybe.some(noMatch())
            }),
          ),
        ),
        Fx.filterMap((x: Maybe.Maybe<Fx.Fx<R | R2, E | E2, A | B>>) => x),
        Fx.switchMap((x) => x),
      )
    }),
  )
}
