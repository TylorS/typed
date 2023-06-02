import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import { Tag } from '@typed/context'
import { Computed } from '@typed/fx'
import { Navigation } from '@typed/navigation'
import { ParamsOf, PathJoin } from '@typed/path'
import { Route } from '@typed/route'

export interface Router<in out P extends string = string> {
  /**
   * The base Route for this Router instance.
   */
  readonly route: Route<P>

  /**
   * The current params for the current path.
   */
  readonly params: Computed<never, never, Option.Option<ParamsOf<P>>>

  /**
   * Construct a new Router instance by defining a new Route which is concatenated
   * to the current Route.
   */
  readonly define: <P2 extends string>(route: Route<P2>) => Router<PathJoin<[P, P2]>>

  /**
   * The parent Router instance if one exists.
   */
  readonly parent: Option.Option<Router<string>>
}

export const Router = Tag<Router>('Router')

export const navigation: Layer.Layer<Navigation, never, Router> = Router.layer(
  Effect.gen(function* ($) {
    const navigation = yield* $(Navigation)
    const currentPath = navigation.currentEntry.map((destination) =>
      getCurrentPathFromUrl(destination.url),
    )

    function makeRouter<
      P extends string,
    >(route: Route<P>, parent: Option.Option<Router<any>>): Router<P> {
      const router: Router<P> = {
        route,
        params: currentPath.map(route.match),
        define: <P2 extends string>(other: Route<P2>): Router<PathJoin<[P, P2]>> =>
          makeRouter(route.concat(other), Option.some(router)),
        parent,
      }

      return router
    }

    return makeRouter(Route(navigation.base), Option.none())
  }),
)

export function getCurrentPathFromUrl(url: URL): string {
  return url.pathname + url.search + url.hash
}
