import * as Context from '@fp-ts/data/Context'
import * as Option from '@fp-ts/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import { flow, pipe } from '@fp-ts/data/Function'
import * as Fx from '@typed/fx'
import * as html from '@typed/html'
import * as Path from '@typed/path'
import * as Route from '@typed/route'
import { context } from '@fp-ts/data'
import { Hole } from '@typed/html'
import * as dom from '@typed/dom'

export interface Router<R = never, P extends string = string> {
  /**
   * The base route the Router is starting from.
   */
  readonly route: Route.Route<R, P>

  /**
   * The current path of the application
   */
  readonly currentPath: Fx.RefSubject<string>

  /**
   * The current matched params of the router
   */
  readonly params: Fx.Fx<never, never, Path.ParamsOf<P>>

  /**
   * The current outlet of this Router
   */
  readonly outlet: Fx.RefSubject<Option.Option<html.Placeholder | Hole | Node>>

  /**
   * Helper for constructing a path from a route relative to the router.
   */
  readonly createPath: <R2 extends Route.Route<any, string>, P extends Route.ParamsOf<R2>>(
    route: R2,
    ...[params]: [keyof P] extends [never] ? [] : [P]
  ) => Effect.Effect<
    R,
    never,
    Path.PathJoin<
      [Path.Interpolate<Route.PathOf<R>, Route.ParamsOf<R>>, Path.Interpolate<Route.PathOf<R2>, P>]
    >
  >

  /**
   * Helper for constructing a nested router
   */
  readonly define: <R2, Path2 extends string>(
    route: Route.Route<R2, Path2>,
  ) => Router<R | R2, Path.PathJoin<[P, Path2]>>

  /**
   * Provide all the resources needed for a Router
   */
  readonly provideEnvironment: (environment: Context.Context<R>) => Router<never, P>
}

export const Tag = Context.Tag<Router>()

export const Router = Object.assign(
  function makeRouter<R = never, P extends string = string>(
    route: Route.Route<R, P>,
    currentPath: Fx.RefSubject<string>,
  ): Router<R, P> {
    const outlet = Fx.RefSubject.unsafeMake(
      (): Option.Option<html.Placeholder | Hole | Node> => Option.none,
    )

    const createPath = <R2 extends Route.Route<any, string>, P extends Route.ParamsOf<R2>>(
      other: R2,
      ...[params]: [keyof P] extends [never] ? [] : [P]
    ): Effect.Effect<
      R,
      never,
      Path.PathJoin<
        [
          Path.Interpolate<Route.PathOf<R>, Route.ParamsOf<R>>,
          Path.Interpolate<Route.PathOf<R2>, P>,
        ]
      >
    > =>
      Effect.gen(function* ($) {
        const path = yield* $(currentPath.get)
        const fullRoute = route.concat(other)
        const baseParams = yield* $(route.match(path))

        if (Option.isNone(baseParams)) {
          return yield* $(
            Effect.dieMessage('Can not create a path when the parent Route is not matched'),
          )
        }

        return fullRoute.make({ ...baseParams.value, ...params } as any) as any
      })

    const router: Router<R, P> = {
      route,
      currentPath,
      params: pipe(
        currentPath,
        Fx.switchMapEffect(route.match),
        Fx.compact,
        Fx.skipRepeats,
      ) as Router<R, P>['params'],
      outlet,
      createPath: createPath as Router<R, P>['createPath'],
      define: <R2, Path2 extends string>(other: Route.Route<R2, Path2>) =>
        makeRouter(route.concat(other), currentPath),
      provideEnvironment: (env) => provideEnvironment(env)(router),
    }

    return router
  },
  Tag,
  {
    get: Effect.service(Tag),
    with: Effect.serviceWith(Tag),
    withEffect: Effect.serviceWithEffect(Tag),
    withFx: Fx.serviceWithFx(Tag),
    provide:
      (currentPath: Fx.RefSubject<string>) =>
      <R, E, A>(self: Effect.Effect<R, E, A>): Effect.Effect<Exclude<R, Router>, E, A> =>
        Effect.provideService(Tag)(Router(Route.base as Route.Route<never, string>, currentPath))(
          self,
        ),
    provideFx:
      (currentPath: Fx.RefSubject<string>) =>
      <R, E, A>(self: Fx.Fx<R, E, A>): Fx.Fx<Exclude<R, Router>, E, A> =>
        Fx.provideService(Tag, Router(Route.base as Route.Route<never, string>, currentPath))(self),
  },
)

// TODO: Add API for configuring a loading indicator
// TODO: Compiler should be able to attach information to each Route instance, and when available
//       the APIs should read that information for the server to wait on the correct elements

export interface RouteMatcher<R = never, E = never, A = unknown> {
  // Where things are actually stored immutably
  readonly routes: ReadonlyMap<
    Route.Route<any, string>,
    (params: Fx.Fx<never, never, any>) => Fx.Fx<any, any, any>
  >

  // Add Routes

  readonly match: <R2, P extends string, R3, E3, B>(
    route: Route.Route<R2, P>,
    f: (params: Path.ParamsOf<P>) => Fx.Fx<R3, E3, B>,
  ) => RouteMatcher<R | R2, E | E3, A | B>

  readonly matchFx: <R2, P extends string, R3, E3, B>(
    route: Route.Route<R2, P>,
    f: (params: Fx.Fx<never, never, Path.ParamsOf<P>>) => Fx.Fx<R3, E3, B>,
  ) => RouteMatcher<R | R2, E | E3, A | B>

  readonly matchEffect: <R2, P extends string, R3, E3, B>(
    route: Route.Route<R2, P>,
    f: (params: Path.ParamsOf<P>) => Effect.Effect<R3, E3, B>,
  ) => RouteMatcher<R | R2, E | E3, A | B>

  // Provide resources

  readonly provideEnvironment: (environment: Context.Context<R>) => RouteMatcher<never, E, A>

  readonly provideService: <R2>(
    tag: Context.Tag<R2>,
    service: R2,
  ) => RouteMatcher<Exclude<R, R2>, E, A>

  readonly provideLayer: <R2, E2, S>(
    layer: Layer.Layer<R2, E2, S>,
  ) => RouteMatcher<Exclude<R, S> | R2, E | E2, A>

  // Runners that turn a RouterMatcher back into an Fx.
  // Error handling should be handled after converting to an Fx for maximum flexibility.

  readonly notFound: <R2, E2, B>(
    f: (path: string) => Fx.Fx<R2, E2, B>,
  ) => Fx.Fx<Router | R | R2, Exclude<E | E2, Redirect>, A | B>

  readonly notFoundEffect: <R2, E2, B>(
    f: (path: string) => Effect.Effect<R2, E2, B>,
  ) => Fx.Fx<Router | R | R2, Exclude<E | E2, Redirect>, A | B>

  readonly redirectTo: <R2, P extends string>(
    route: Route.Route<R2, P>,
    ...params: [keyof Path.ParamsOf<P>] extends [never] ? [] : [Path.ParamsOf<P>]
  ) => Fx.Fx<Router | R | R2, Exclude<E, Redirect>, A>
}

export const outlet: Fx.Fx<Router, never, html.Placeholder | null> = pipe(
  Router.withFx((r) => r.outlet),
  Fx.map(Option.getOrNull),
)

export const currentPath: Fx.Fx<Router, never, string> = Router.withFx((r) => r.currentPath)

export function provideEnvironment<R>(environment: context.Context<R>) {
  return <P extends string>(router: Router<R, P>): Router<never, P> => {
    const provided: Router<never, P> = {
      ...router,
      route: Route.provideEnvironment(environment)(router.route),
      createPath: ((other, ...params) =>
        Effect.provideEnvironment(environment)(router.createPath(other, ...params))) as Router<
        never,
        P
      >['createPath'],
      provideEnvironment: (env) => provideEnvironment(env)(provided),
    }

    return provided
  }
}

export interface Redirect {
  readonly _tag: 'Redirect'
  readonly path: string
}

export namespace Redirect {
  export const make = (path: string): Redirect => ({ _tag: 'Redirect', path })

  export const is = (r: unknown): r is Redirect =>
    typeof r === 'object' && r !== null && '_tag' in r && r._tag === 'Redirect'
}

export function redirect(path: string) {
  return Effect.fail<Redirect>(Redirect.make(path))
}

redirect.fx = (path: string) => Fx.fail<Redirect>(Redirect.make(path))

export const redirectTo = <R, P extends string>(
  route: Route.Route<R, P>,
  ...params: [keyof Path.ParamsOf<P>] extends [never] ? [] : [Path.ParamsOf<P>]
): Effect.Effect<Router, Redirect, never> =>
  pipe(
    Router.withEffect((r) => r.createPath(route, ...(params as any))),
    Effect.flatMap(redirect),
  )

redirectTo.fx = <R, P extends string>(
  route: Route.Route<R, P>,
  ...params: [keyof Path.ParamsOf<P>] extends [never] ? [] : [Path.ParamsOf<P>]
): Fx.Fx<Router, Redirect, never> =>
  pipe(
    Router.withEffect((r) => r.createPath(route, ...(params as any))),
    Fx.fromEffect,
    Fx.switchMap(redirect.fx),
  )

export function RouterMatcher<R, E, A>(
  routes: RouteMatcher<R, E, A>['routes'],
): RouteMatcher<R, E, A> {
  const matcher: RouteMatcher<R, E, A> = {
    routes,
    matchFx: (route, f) => RouterMatcher(new Map(routes).set(route, f)),
    match: (route, f) => RouterMatcher(new Map(routes).set(route, Fx.switchMap(f))),
    matchEffect: (route, f) => RouterMatcher(new Map(routes).set(route, Fx.switchMapEffect(f))),
    provideEnvironment: (environment) =>
      RouterMatcher(
        new Map(
          Array.from(routes).map(([k, v]) => [k, flow(v, Fx.provideEnvironment(environment))]),
        ),
      ),
    provideService: (tag, service) =>
      RouterMatcher(
        new Map(Array.from(routes).map(([k, v]) => [k, flow(v, Fx.provideService(tag, service))])),
      ),
    provideLayer: (layer) =>
      RouterMatcher(
        new Map(Array.from(routes).map(([k, v]) => [k, flow(v, Fx.provideLayer(layer))])),
      ),
    notFound: <R2, E2, B>(f: (path: string) => Fx.Fx<R2, E2, B>) =>
      Router.withFx((router) => {
        const matchers = Array.from(routes).map(([child, f]) => {
          return [child, f(router.define(child).params)] as const
        })

        return pipe(
          router.currentPath,
          Fx.skipRepeats,
          Fx.switchMapEffect((path) =>
            Effect.gen(function* ($) {
              for (const [child, render] of matchers) {
                const result = yield* $(child.match(path))

                if (Option.isSome(result)) {
                  return render as Fx.Fx<R | R2, E | E2, A | B>
                }
              }

              return f(path) as Fx.Fx<R | R2, E | E2, A | B>
            }),
          ),
          Fx.skipRepeats,
          Fx.switchLatest,
          Fx.switchMapError((error) => {
            if (Redirect.is(error)) {
              return pipe(
                router.currentPath.set(error.path),
                Fx.fromEffect,
                Fx.flatMap(() => Fx.never),
              )
            }

            return Fx.fail(error as Exclude<E | E2, Redirect>)
          }),
        )
      }),
    notFoundEffect: (f) => matcher.notFound((path) => Fx.fromEffect(f(path))),
    redirectTo: ((route, ...params) =>
      matcher.notFound(() => redirectTo.fx(route, ...params))) as RouteMatcher<
      R,
      E,
      A
    >['redirectTo'],
  }

  return matcher
}

export const { matchFx, match, matchEffect } = RouterMatcher<never, never, never>(new Map())

export const makeRouter: Effect.Effect<
  Location | History | Window | Document | Scope.Scope,
  never,
  Router
> = Effect.gen(function* ($) {
  const runtime = yield* $(Effect.runtime<never>())
  const location = yield* $(dom.getLocation)
  const history = yield* $(dom.getHistory)
  const currentPath = yield* $(Fx.makeRef<string>(() => getCurrentPath(location)))
  const router = Router(Route.base, currentPath)

  const updateCurrentPath = Effect.gen(function* ($) {
    yield* $(Effect.yieldNow()) // Allow location to be updated
    yield* $(currentPath.set(getCurrentPath(location)))
  })

  const updatePathNow = () => runtime.unsafeRunAsync(updateCurrentPath)

  // Listen to popstate events
  yield* $(
    pipe(
      dom.addWindowListener('popstate'),
      Fx.tap(() => updateCurrentPath),
      Fx.drain,
      Effect.forkScoped,
    ),
  )

  // Listen to hashchange events
  yield* $(
    pipe(
      dom.addWindowListener('hashchange'),
      Fx.tap(() => updateCurrentPath),
      Fx.drain,
      Effect.forkScoped,
    ),
  )

  // Listen to all link clicks to intercept for path changes
  yield* $(
    pipe(
      dom.addDocumentListener('click'),
      Fx.merge(dom.addDocumentListener('touchend')),
      Fx.filter(shouldInterceptLinkClick),
      Fx.observe(() => updateCurrentPath),
      Effect.forkScoped,
    ),
  )

  // Patch history to update the currentPath when changed
  patchHistory(history, updatePathNow)

  return router as Router
})

export const live = Layer.scoped(Router)(makeRouter)

function getCurrentPath(location: Location) {
  return location.pathname + location.search + location.hash
}

function patchHistory(history: History, updatePathNow: () => void) {
  const pushState = history.pushState.bind(history)
  const replaceState = history.replaceState.bind(history)
  const go = history.go.bind(history)
  const back = history.back.bind(history)
  const forward = history.forward.bind(history)

  history.pushState = function (state, title, url) {
    pushState(state, title, url)
    updatePathNow()
  }

  history.replaceState = function (state, title, url) {
    replaceState(state, title, url)
    updatePathNow()
  }

  history.go = function (delta) {
    go(delta)
    updatePathNow()
  }

  history.back = function () {
    back()
    updatePathNow()
  }

  history.forward = function () {
    forward()
    updatePathNow()
  }
}

function shouldInterceptLinkClick(ev: MouseEvent | TouchEvent): boolean {
  if (ev.which !== 1) return false
  if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return false
  if (ev.defaultPrevented) return false

  let el = ev.target as Element | null
  const eventPath = (ev as any).path || (ev.composedPath ? ev.composedPath() : null)

  if (eventPath) {
    for (let i = 0; i < eventPath.length; i++) {
      if (
        !eventPath[i].nodeName ||
        eventPath[i].nodeName.toUpperCase() !== 'A' ||
        !eventPath[i].href
      )
        continue

      el = eventPath[i]
      break
    }
  }

  if (el?.nodeName.toUpperCase() !== 'A') return false

  const target = el as HTMLAnchorElement

  // Ensure same origin
  if (target.origin !== location.origin) return false

  // Ignore if tag has
  // 1. "download" attribute
  // 2. rel="external" attribute
  if (target.hasAttribute('download') || target.getAttribute('rel') === 'external') return false

  // ensure non-hash for the same path
  const link = target.getAttribute('href')
  if ((target as HTMLAnchorElement).hash || '#' === link) return false

  // Check for mailto: in the href
  if (link && link.indexOf('mailto:') > -1) return false

  // We made it! We'll intercept this event and update history
  ev.preventDefault()

  return true
}
