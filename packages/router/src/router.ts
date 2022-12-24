/* eslint-disable @typescript-eslint/ban-types */
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import * as Duration from '@fp-ts/data/Duration'
import { flow, pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'
import * as Context from '@typed/context'
import { Location, History, addDocumentListener, addWindowListener } from '@typed/dom'
import * as Fx from '@typed/fx'
import * as html from '@typed/html'
import * as Path from '@typed/path'
import * as Route from '@typed/route'

export interface Router<out R = never, in out P extends string = string> {
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
  readonly params: Fx.Fx<R, never, Path.ParamsOf<P>>

  /**
   * The current outlet of this Router
   */
  readonly outlet: Fx.RefSubject<html.Renderable>

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

export const Router = Object.assign(function makeRouter<R = never, P extends string = string>(
  route: Route.Route<R, P>,
  currentPath: Fx.RefSubject<string>,
): Router<R, P> {
  const outlet = Fx.RefSubject.unsafeMake((): html.Renderable => null)

  const createPath = <R2 extends Route.Route<any, string>, P extends Route.ParamsOf<R2>>(
    other: R2,
    ...[params]: [keyof P] extends [never] ? [] : [P]
  ): Effect.Effect<
    R,
    never,
    Path.PathJoin<
      [Path.Interpolate<Route.PathOf<R>, Route.ParamsOf<R>>, Path.Interpolate<Route.PathOf<R2>, P>]
    >
  > =>
    Effect.gen(function* ($) {
      const path = yield* $(currentPath.get)
      const baseParams = yield* $(route.match(path))

      if (Option.isNone(baseParams)) {
        return yield* $(
          Effect.dieMessage(
            `Can not create path when the parent can not be matched.
                Parent Route: ${route.path}
                Current Route: ${other.path}
                Current Path: ${path}`,
          ),
        )
      }

      return route.concat(other).make({ ...baseParams.value, ...params } as any) as any
    })

  const router: Router<R, P> = {
    route,
    currentPath,
    params: pipe(currentPath, Fx.switchMapEffect(route.match), Fx.compact, Fx.skipRepeats),
    outlet,
    createPath: createPath as Router<R, P>['createPath'],
    define: <R2, Path2 extends string>(other: Route.Route<R2, Path2>) =>
      makeRouter(route.concat(other), currentPath),
    provideEnvironment: (env) => provideEnvironment(env)(router),
  }

  return router
},
Context.Tag<Router>())

// TODO: Add API for configuring a loading indicator
// TODO: Compiler should be able to attach information to each Route instance, and when available
//       the APIs should read that information for the server to wait on the correct elements

export interface RouteMatch<R, E, P extends string> {
  readonly route: Route.Route<R, P>

  readonly match: (params: Fx.Fx<never, never, Path.ParamsOf<P>>) => Fx.Fx<R, E, html.Renderable>

  readonly layout?: Fx.Fx<R, E, html.Renderable>

  readonly provideEnvironment: (environment: Context.Context<R>) => RouteMatch<never, E, P>

  readonly provideService: <S>(tag: Context.Tag<S>, service: S) => RouteMatch<Exclude<R, S>, E, P>

  readonly provideLayer: <R2, S>(
    layer: Layer.Layer<R2, never, S>,
  ) => RouteMatch<R2 | Exclude<R, S>, E, P>
}

export function RouteMatch<R, P extends string, R2, E2, R3, E3>(
  route: Route.Route<R, P>,
  match: (params: Fx.Fx<never, never, Path.ParamsOf<P>>) => Fx.Fx<R2, E2, html.Renderable>,
  layout?: Fx.Fx<R3, E3, html.Renderable>,
): RouteMatch<R | R2 | R3, E2 | E3, P> {
  const routeMatch: RouteMatch<R | R2 | R3, E2 | E3, P> = {
    route,
    match,
    layout,
    provideEnvironment: (env) =>
      RouteMatch(
        Route.provideEnvironment(env)(route),
        flow(match, Fx.provideSomeEnvironment(env)),
        layout ? Fx.provideEnvironment(env)(layout) : undefined,
      ),
    provideService: (tag, service) =>
      RouteMatch(
        Route.provideService(tag, service)(route),
        flow(match, Fx.provideService(tag)(service)),
        layout ? Fx.provideService(tag)(service)(layout) : undefined,
      ),
    provideLayer: (layer) =>
      RouteMatch(
        Route.provideLayer(layer)(route),
        flow(match, Fx.provideSomeLayer(layer)),
        layout ? Fx.provideSomeLayer(layer)(layout) : undefined,
      ),
  }

  return routeMatch
}

export interface RouteMatcher<R = never, E = never> {
  // Where things are actually stored immutably
  readonly routes: ReadonlyMap<Route.Route<any, any>, RouteMatch<any, any, any>>

  // Add Routes

  readonly match: <R2, P extends string, R3, E3>(
    route: Route.Route<R2, P>,
    f: (params: Path.ParamsOf<P>) => Fx.Fx<R3, E3, html.Renderable>,
  ) => RouteMatcher<R | R2, E | E3>

  readonly matchFx: <R2, P extends string, R3, E3>(
    route: Route.Route<R2, P>,
    f: (params: Fx.Fx<never, never, Path.ParamsOf<P>>) => Fx.Fx<R3, E3, html.Renderable>,
  ) => RouteMatcher<R | R2, E | E3>

  readonly matchEffect: <R2, P extends string, R3, E3>(
    route: Route.Route<R2, P>,
    f: (params: Path.ParamsOf<P>) => Effect.Effect<R3, E3, html.Renderable>,
  ) => RouteMatcher<R | R2, E | E3>

  // Add Layout

  readonly withLayout: <R2, E2>(fx: Fx.Fx<R2, E2, html.Renderable>) => RouteMatcher<R | R2, E | E2>

  // Provide resources

  readonly provideEnvironment: <R2>(
    environment: Context.Context<R2>,
  ) => RouteMatcher<Exclude<R, R2>, E>

  readonly provideService: <R2>(
    tag: Context.Tag<R2>,
    service: R2,
  ) => RouteMatcher<Exclude<R, R2>, E>

  readonly provideLayer: <R2, S>(
    layer: Layer.Layer<R2, never, S>,
  ) => RouteMatcher<Exclude<R, S> | R2, E>

  // Runners that turn a RouterMatcher back into an Fx.
  // Error handling should be handled after converting to an Fx for maximum flexibility.

  readonly notFound: <R2, E2>(
    f: (path: string) => Fx.Fx<R2, E2, html.Renderable>,
  ) => Fx.Fx<Router | R | R2, Exclude<E | E2, Redirect>, html.Renderable>

  readonly notFoundEffect: <R2, E2>(
    f: (path: string) => Effect.Effect<R2, E2, html.Renderable>,
  ) => Fx.Fx<Router | R | R2, Exclude<E | E2, Redirect>, html.Renderable>

  readonly redirectTo: <R2, P extends string>(
    route: Route.Route<R2, P>,
    ...params: [keyof Path.ParamsOf<P>] extends [never]
      ? // eslint-disable-next-line @typescript-eslint/ban-types
        [{}?]
      : [(path: string) => Path.ParamsOf<P>]
  ) => Fx.Fx<Router | R | R2, Exclude<E, Redirect>, html.Renderable>

  /**
   * @internal
   */
  readonly run: Fx.Fx<Router | R, Exclude<E, Redirect>, html.Renderable | null>
}

export const outlet: Fx.Fx<Router, never, html.Renderable> = Router.withFx((r) => r.outlet)

export const currentPath: Fx.Fx<Router, never, string> = Router.withFx((r) => r.currentPath)

export function provideEnvironment<R>(environment: Context.Context<R>) {
  return <P extends string>(router: Router<R, P>): Router<never, P> => {
    const provided: Router<never, P> = {
      ...router,
      params: pipe(router.params, Fx.provideEnvironment(environment)),
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
  ...[params]: [keyof Path.ParamsOf<P>] extends [never] ? [{}?] : [Path.ParamsOf<P>]
): Effect.Effect<Router, Redirect, never> =>
  pipe(
    Router.withEffect((r) => r.createPath(route as any, params as any)),
    Effect.flatMap(redirect),
  )

redirectTo.fx = <R, P extends string>(
  route: Route.Route<R, P>,
  ...params: [keyof Path.ParamsOf<P>] extends [never] ? [{}?] : [(path: string) => Path.ParamsOf<P>]
): Fx.Fx<Router, Redirect, never> =>
  pipe(
    Router.withEffect((r) => r.createPath(route as any, params as any)),
    Fx.fromEffect,
    Fx.switchMap(redirect.fx),
  )

export function RouteMatcher<R, E>(routes: RouteMatcher<R, E>['routes']): RouteMatcher<R, E> {
  const matcher: RouteMatcher<R, E> = {
    routes,
    matchFx: (route, f) => RouteMatcher(new Map(routes).set(route, RouteMatch(route, f))),
    match: (route, f) =>
      RouteMatcher(new Map(routes).set(route, RouteMatch(route, Fx.switchMap(f)))),
    matchEffect: (route, f) =>
      RouteMatcher(new Map(routes).set(route, RouteMatch(route, Fx.switchMapEffect(f)))),
    withLayout: (layout) =>
      RouteMatcher(
        new Map(
          Array.from(routes).map(([k, match]) => [
            k,
            RouteMatch(match.route, match.match, match.layout ?? layout),
          ]),
        ),
      ),
    provideEnvironment: (environment) =>
      RouteMatcher(
        new Map(Array.from(routes).map(([k, v]) => [k, v.provideEnvironment(environment)])),
      ),
    provideService: (tag, service) =>
      RouteMatcher(
        new Map(Array.from(routes).map(([k, v]) => [k, v.provideService(tag, service)])),
      ),
    provideLayer: (layer) =>
      RouteMatcher(new Map(Array.from(routes).map(([k, v]) => [k, v.provideLayer(layer)]))),
    notFound: <R2, E2>(f: (path: string) => Fx.Fx<R2, E2, html.Renderable>) =>
      Router.withFx((router) => {
        // Create stable references to the route matchers
        const matchers = Array.from(routes.values()).map(
          (v) => [v, runRouteMatch(router, v)] as const,
        )

        let previousFiber: Fiber.RuntimeFiber<any, any> | undefined
        let previousLayout: Fx.Fx<any, any, html.Renderable> | undefined
        let previousRender: Fx.Fx<any, any, html.Renderable> | undefined

        const samplePreviousValues = () => ({
          fiber: previousFiber,
          layout: previousLayout,
          render: previousRender,
        })

        // This function helps us to ensure shared layouts are only rendered once
        // and the outlet content is changed
        const verifyShouldRerender = (
          match: RouteMatch<any, any, any>,
          render: Fx.Fx<any, any, html.Renderable>,
        ): Effect.Effect<any, any, Option.Option<Fx.Fx<any, any, html.Renderable>>> =>
          Effect.gen(function* ($) {
            const previous = samplePreviousValues()

            // Update the previous values
            previousRender = render
            previousLayout = match.layout
            previousFiber = undefined

            // Skip rerendering if the render function is the same
            if (previous.render === render) {
              return Option.none
            }

            // If we have a layout, we need to render it and use the route outlet.
            if (match.layout) {
              // Render into the route outlet
              previousFiber = yield* $(
                pipe(render, Fx.observe(router.outlet.set), Effect.forkScoped),
              )

              return Option.some(match.layout)
            }

            // Interrupt the previous fiber if it exists
            if (previous.fiber) {
              yield* $(Fiber.interrupt(previous.fiber))
            }

            // If we don't have a layout, but we did, we need to clear the outlet
            if (previous.layout) {
              yield* $(router.outlet.set(null))
            }

            // Otherwise use the render function directly
            return Option.some(render)
          })

        return pipe(
          router.currentPath,
          Fx.skipRepeats,
          Fx.switchMapEffect((path) =>
            Effect.gen(function* ($) {
              // Attempt to find the best match
              for (const [match, render] of matchers) {
                const result = yield* $(match.route.match(path))

                if (Option.isSome(result)) {
                  return yield* $(verifyShouldRerender(match, render))
                }
              }

              // If we didn't find a match, render the not found page

              // cleanup any fiber
              if (previousFiber) {
                yield* $(Fiber.interrupt(previousFiber))
              }

              // Cleanup
              previousFiber = undefined
              previousLayout = undefined
              previousRender = undefined

              return Option.some(f(path))
            }),
          ),
          Fx.compact,
          Fx.skipRepeats, // Stable render references are used to avoid mounting the same component twice
          Fx.switchLatest,
          Fx.switchMapError((error) => {
            // Intercept redirect requests and update the router
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
      matcher.notFound(() => redirectTo.fx(route, ...params))) as RouteMatcher<R, E>['redirectTo'],
    run: Fx.suspend(() => matcher.notFoundEffect(() => Effect.succeed(null))),
  }

  return matcher
}

export namespace RouteMatcher {
  export const empty = RouteMatcher<never, never>(new Map())

  export const concat = <R, E, R2, E2>(
    matcher: RouteMatcher<R, E>,
    matcher2: RouteMatcher<R2, E2>,
  ): RouteMatcher<R | R2, E | E2> => RouteMatcher(new Map([...matcher.routes, ...matcher2.routes]))
}

export const { matchFx, match, matchEffect } = RouteMatcher<never, never>(new Map())

export const makeRouter: Effect.Effect<
  Location | History | Window | Document | Scope.Scope,
  never,
  Router
> = Effect.gen(function* ($) {
  const history = yield* $(History.get)
  const location = yield* $(Location.get)
  const currentPath = yield* $(Fx.makeRef<string>(() => getCurrentPath(location)))

  // Patch history events to emit an event when the path changes
  const historyEvents = yield* $(patchHistory)

  // Update the current path when events occur:
  // - click
  // - touchend
  // - popstate
  // - hashchange
  // - history events
  yield* $(
    pipe(
      Fx.mergeAll(
        pipe(
          addDocumentListener('click'),
          Fx.merge(addDocumentListener('touchend')),
          Fx.filter(shouldInterceptLinkClick(location)),
          Fx.map((ev) => getCurrentPath(ev.target as HTMLAnchorElement)),
        ),
        pipe(
          Fx.mergeAll(
            addWindowListener('popstate'),
            addWindowListener('hashchange'),
            historyEvents,
          ),
          Fx.debounce(Duration.millis(0)),
          Fx.map(() => getCurrentPath(location)),
        ),
      ),
      Fx.switchMapEffect((path) => currentPath.set(path)),
      Fx.forkScoped,
    ),
  )

  // Listen to path changes and update the current history location

  yield* $(
    pipe(
      currentPath,
      Fx.skipRepeats,
      Fx.observe((path) => Effect.sync(() => history.pushState({}, '', path))),
      Effect.forkDaemon,
    ),
  )

  // Make our base router
  return Router(Route.base, currentPath) as Router
})

export const live = Router.layerSoped(makeRouter)

function getCurrentPath(location: Location | HTMLAnchorElement) {
  return location.pathname + location.search + location.hash
}

const patchHistory = Effect.gen(function* ($) {
  const history = yield* $(History.get)
  const historyEvents = Fx.Subject.unsafeMake<never, void>()
  const runtime = yield* $(Effect.runtime<never>())

  patchHistory_(history, () => runtime.unsafeRunAsync(historyEvents.event()))

  return historyEvents
})

function patchHistory_(history: History, sendEvent: () => void) {
  const pushState = history.pushState.bind(history)
  const replaceState = history.replaceState.bind(history)
  const go = history.go.bind(history)
  const back = history.back.bind(history)
  const forward = history.forward.bind(history)

  history.pushState = function (state, title, url) {
    pushState(state, title, url)
    sendEvent()
  }

  history.replaceState = function (state, title, url) {
    replaceState(state, title, url)
    sendEvent()
  }

  history.go = function (delta) {
    go(delta)
    sendEvent()
  }

  history.back = function () {
    back()
    sendEvent()
  }

  history.forward = function () {
    forward()
    sendEvent()
  }
}

function shouldInterceptLinkClick(location: Location) {
  return (ev: MouseEvent | TouchEvent): boolean => {
    // Event Filtering

    // Only intercept left clicks
    if (ev.which !== 1) return false
    // Don't intercept modified clicks
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return false
    // Don't intercept if default prevented already
    if (ev.defaultPrevented) return false

    // Attempt to find an anchor element
    const target = findAnchorElement(ev)

    if (!target) return false

    // Link Filtering

    // Ensure same origin
    if (target.origin !== location.origin) return false
    // Don't intercept download links
    if (target.hasAttribute('download')) return false
    // Don't intercept links marked as external, should have full page load
    if (target.rel === 'external') return false
    // Don't bother with hash changes, hash change events work well
    if (target.hash || target.href === '#') return false
    // Don't bother with non-http(s) protocols
    if (target.protocol && !target.protocol.startsWith('http')) return false

    // We made it! We'll intercept this event and update history
    ev.preventDefault()

    return true
  }
}

function findAnchorElement(ev: MouseEvent | TouchEvent): HTMLAnchorElement | null {
  const eventPath = (ev as any).path || (ev.composedPath ? ev.composedPath() : null)

  // Attempt to find our link
  let el = ev.target as Element | null
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

  // If it is not a link, we don't care
  if (el?.nodeName.toUpperCase() !== 'A') return null

  return el as HTMLAnchorElement
}

function runRouteMatch<R, E, P extends string>(
  router: Router,
  { route, match }: RouteMatch<R, E, P>,
): Fx.Fx<R, E, html.Renderable> {
  return Fx.gen(function* ($) {
    const env = yield* $(Effect.environment<R>())
    const nestedRouter = router.define(route)
    const params = pipe(nestedRouter.params, Fx.provideEnvironment(env))

    return pipe(
      match(params as unknown as Fx.Fx<never, never, Path.ParamsOf<P>>),
      Router.provideFx(nestedRouter as Router),
    )
  })
}
