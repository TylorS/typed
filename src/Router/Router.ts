import * as Effect from '@effect/core/io/Effect'
import { Layer, fromEffect, provideToAndMerge } from '@effect/core/io/Layer'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Maybe from '@tsplus/stdlib/data/Maybe'
import { Tag } from '@tsplus/stdlib/service/Tag'
import * as Fx from '@typed/fx'

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

  readonly match: <R2, E2, A>(
    f: (a: Route.ParamsOf<R>) => Fx.Fx<R2 | Router<R>, E2, A> | Fx.Fx<R2 | Router, E2, A>,
  ) => Fx.Fx<
    Exclude<CurrentPath.CurrentPath | Route.ResourcesOf<R> | R2, Router<R> | Router>,
    Route.ErrorsOf<R> | E2,
    A
  >

  readonly with: <R2, E2, A>(
    f: (
      a: Fx.Fx<
        CurrentPath.CurrentPath | Route.ResourcesOf<R>,
        Route.ErrorsOf<R>,
        Route.ParamsOf<R>
      >,
    ) => Fx.Fx<R2 | Router<R>, E2, A> | Fx.Fx<R2 | Router, E2, A>,
  ) => Fx.Fx<
    Exclude<CurrentPath.CurrentPath | Route.ResourcesOf<R> | R2, Router<R> | Router>,
    Route.ErrorsOf<R> | E2,
    A
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
  const matched = Fx.multicast(
    pipe(
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
    ),
  )

  const router: Router<R> = {
    route,
    params: matched as Router<R>['params'],
    match: (<R2, E2, A>(f: (a: Route.ParamsOf<R>) => Fx.Fx<R2, E2, A>) =>
      pipe(
        matched,
        Fx.switchMap((x) =>
          Maybe.isNone(x) ? Fx.succeed(x) : pipe(f(x.value), Fx.map(Maybe.some)),
        ),
        Fx.filterMap((x) => x),
        Fx.provideService(Router, router as any),
      )) as Router<R>['match'],
    with: (<R2, E2, A>(
      f: (
        a: Fx.Fx<
          CurrentPath.CurrentPath | Route.ResourcesOf<R>,
          Route.ErrorsOf<R>,
          Route.ParamsOf<R>
        >,
      ) => Fx.Fx<CurrentPath.CurrentPath | Route.ResourcesOf<R> | R2, Route.ErrorsOf<R> | E2, A>,
    ) =>
      pipe(
        matched,
        Fx.filterMap((x) => x),
        f,
        Fx.provideService(Router, router as any),
      )) as Router<R>['with'],
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

export const live: Layer<Location | History | Window, never, Router> = pipe(
  CurrentPath.live,
  provideToAndMerge(base),
)

/**
 * Get the base Router
 */
export const getRouter: Effect.Effect<Router, never, Router> = Effect.service(Router)

export function matchAll<Matches extends ReadonlyArray<Fx.Fx<any, any, any>>>(
  matches: (router: Router) => readonly [...Matches],
) {
  return Fx.fromFxGen(function* ($) {
    const router = yield* $(getRouter)

    return Fx.mergeAll(matches(router))
  })
}
