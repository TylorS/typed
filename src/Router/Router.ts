import * as Effect from '@effect/core/io/Effect'
import { Layer, fromEffect } from '@effect/core/io/Layer'
import { pipe } from '@tsplus/stdlib/data/Function'
import { Maybe, getEquivalence } from '@tsplus/stdlib/data/Maybe'
import { Tag } from '@tsplus/stdlib/service/Tag'
import * as Fx from '@typed/fx'
import { any } from 'node_modules/@tsplus/stdlib/prelude/Equivalence.js'

import { CurrentPath } from './CurrentPath.js'
import * as Path from './Path.js'
import * as Route from './Route.js'

export interface Router<R extends Route.Route<string, any, any> = Route.Route<string>> {
  readonly route: R

  readonly params: Fx.Fx<
    CurrentPath | Route.ResourcesOf<R>,
    Route.ErrorsOf<R>,
    Maybe<Path.ParamsOf<Route.PathOf<R>>>
  >

  readonly define: <R2 extends Route.Route<string, any, any>>(
    route: R2,
  ) => Effect.Effect<
    CurrentPath,
    never,
    Router<
      Route.Route<
        Path.PathJoin<[Route.PathOf<R>, Route.PathOf<R2>]>,
        Route.ResourcesOf<R> | Route.ResourcesOf<R2>,
        Route.ErrorsOf<R> | Route.ErrorsOf<R2>
      >
    >
  >
}

export function makeRouter<R extends Route.Route<string, any, any>>(
  route: R,
): Effect.Effect<CurrentPath, never, Router<R>> {
  return Effect.serviceWith(CurrentPath, ({ currentPath }): Router<R> => {
    return {
      route,
      params: pipe(
        currentPath,
        Fx.mapEffect(route.match),
        Fx.skipRepeats(getEquivalence(any)),
      ) as Router<R>['params'],
      define: ((route2) => makeRouter(Route.concatRoute(route, route2))) as Router<R>['define'],
    }
  })
}

/**
 * Tag for the "base" router instance which utilizes the base route to allow full matching elsewhere.
 * If you require nested routers, you should use the `define` method primarily and pass it around as
 * a value at that point. If you require DI for that nested Router cool, but I would suggest creating
 * our own Tag and using it.
 */
export const Router = Tag<Router>()

export const live: Layer<CurrentPath, never, Router> = fromEffect(Router)(
  makeRouter(Route.baseRoute),
)

/**
 * Get the base Router
 */
export const getRouter: Effect.Effect<Router, never, Router> = Effect.service(Router)
