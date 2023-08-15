import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import { Tag } from '@typed/context'
import { DomServicesElementParams } from '@typed/dom'
import * as Fx from '@typed/fx'
import * as Navigation from '@typed/navigation'
import { ParamsOf, PathJoin } from '@typed/path'
import { Route, RouteOptions } from '@typed/route'

export interface Router<in out P extends string = string> {
  /**
   * The base Route for this Router instance.
   */
  readonly route: Route<P>

  /**
   * The current params for the current path.
   */
  readonly params: Fx.Filtered<never, never, ParamsOf<P>>

  /**
   * Construct a new Router instance by defining a new Route which is concatenated
   * to the current Route.
   */
  readonly define: <P2 extends string>(
    route: Route<P2>,
    overrides?: RouteOptions,
  ) => Router<PathJoin<[P, P2]>>

  /**
   * The parent Router instance if one exists.
   */
  readonly parent: Option.Option<Router<string>>

  /**
   * The Navigation Service
   */
  readonly navigation: Navigation.Navigation
}

export const Router = Tag<Router>('Router')

export const navigation: Layer.Layer<Navigation.Navigation, never, Router> = Router.layer(
  Effect.gen(function* ($) {
    const navigation = yield* $(Navigation.Navigation)
    const currentPath = navigation.currentEntry.map((destination) =>
      getCurrentPathFromUrl(destination.url),
    )

    function makeRouter<P extends string>(
      route: Route<P>,
      parent: Option.Option<Router<any>>,
    ): Router<P> {
      const router: Router<P> = {
        route,
        navigation,
        params: currentPath.filterMap(route.match),
        define: <P2 extends string>(
          other: Route<P2>,
          overrides?: RouteOptions,
        ): Router<PathJoin<[P, P2]>> =>
          makeRouter(route.concat(other, overrides), Option.some(router)),
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

export const dom = (
  options?: Navigation.DomNavigationOptions & DomServicesElementParams,
): Layer.Layer<Navigation.NavigationServices, never, Navigation.Navigation | Router> =>
  Layer.provideMerge(Navigation.dom(options), navigation)

export const memory = (
  options: Navigation.MemoryNavigationOptions,
): Layer.Layer<never, never, Navigation.Navigation | Router> =>
  Layer.provideMerge(Navigation.memory(options), navigation)

const routerNavigation: Layer.Layer<Router, never, Navigation.Navigation> = Layer.effectContext(
  Effect.map(Router, (router) => Navigation.Navigation.build(router.navigation).context),
)

const provideRouterNavigationEffect = Effect.provideSomeLayer(routerNavigation)
const provideRouterNavigationFx = Fx.provideSomeLayer(routerNavigation)

export const back: Effect.Effect<Router, never, Navigation.Destination> =
  provideRouterNavigationEffect(Navigation.back)

export const canGoBack: Effect.Effect<Router, never, boolean> & Fx.Fx<Router, never, boolean> =
  Object.assign(
    provideRouterNavigationEffect(Navigation.canGoBack),
    provideRouterNavigationFx(Navigation.canGoBack),
  )

export const canGoForward: Effect.Effect<Router, never, boolean> & Fx.Fx<Router, never, boolean> =
  Object.assign(
    provideRouterNavigationEffect(Navigation.canGoForward),
    provideRouterNavigationFx(Navigation.canGoForward),
  )

export const cancelNavigation = Navigation.cancelNavigation

export const forward = provideRouterNavigationEffect(Navigation.forward)

export const navigate: (
  url: string,
  options?: Navigation.NavigateOptions,
) => Effect.Effect<Router, never, Navigation.Destination> = (url, options) =>
  provideRouterNavigationEffect(Navigation.navigate(url, options))

export const push: (
  url: string,
  options?: Omit<Navigation.NavigateOptions, 'history'>,
) => Effect.Effect<Router, never, Navigation.Destination> = (url, options) =>
  navigate(url, { ...options, history: 'push' })

export const replace: (
  url: string,
  options?: Omit<Navigation.NavigateOptions, 'history'>,
) => Effect.Effect<Router, never, Navigation.Destination> = (url, options) =>
  navigate(url, { ...options, history: 'replace' })

export const reload: Effect.Effect<Router, never, Navigation.Destination> =
  provideRouterNavigationEffect(Navigation.reload)
