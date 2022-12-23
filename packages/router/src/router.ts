import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import * as Duration from '@fp-ts/data/Duration'
import { flow, pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'
import * as Context from '@typed/context'
import { Location, History, addDocumentListener, addWindowListener } from '@typed/dom'
import * as Fx from '@typed/fx'
import * as html from '@typed/html'
import { Hole } from '@typed/html'
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

export const Router = Object.assign(function makeRouter<R = never, P extends string = string>(
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
Context.Tag<Router>())

// TODO: Add API for configuring a loading indicator
// TODO: Compiler should be able to attach information to each Route instance, and when available
//       the APIs should read that information for the server to wait on the correct elements

export interface RouteMatcher<R = never, E = never, A = unknown> {
  // Where things are actually stored immutably
  readonly routes: ReadonlyMap<
    Route.Route<any, any>,
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

export function provideEnvironment<R>(environment: Context.Context<R>) {
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
  ...[params]: [keyof Path.ParamsOf<P>] extends [never] ? [] : [Path.ParamsOf<P>]
): Effect.Effect<Router, Redirect, never> =>
  pipe(
    Router.withEffect((r) => r.createPath(route as any, params as any)),
    Effect.flatMap(redirect),
  )

redirectTo.fx = <R, P extends string>(
  route: Route.Route<R, P>,
  ...params: [keyof Path.ParamsOf<P>] extends [never] ? [] : [Path.ParamsOf<P>]
): Fx.Fx<Router, Redirect, never> =>
  pipe(
    Router.withEffect((r) => r.createPath(route as any, params as any)),
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
        new Map(Array.from(routes).map(([k, v]) => [k, flow(v, Fx.provideService(tag)(service))])),
      ),
    provideLayer: (layer) =>
      RouterMatcher(
        new Map(Array.from(routes).map(([k, v]) => [k, flow(v, Fx.provideLayer(layer))])),
      ),
    notFound: <R2, E2, B>(f: (path: string) => Fx.Fx<R2, E2, B>) =>
      Router.withFx((router) => {
        const matchers = Array.from(routes).map(([child, f]) => {
          // Construct *stable* references to the rendering of this componenet
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
          Fx.skipRepeats, // Stable render references are used to avoid mounting the same component twice
          Fx.switchLatest,
          Fx.switchMapError((error) => {
            // Intercept redirect requests and update the router
            if (Redirect.is(error)) {
              return pipe(
                router.currentPath.set(error.path),
                Fx.fromEffect,
                Fx.delay(Duration.millis(0)),
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

export namespace RouterMatcher {
  export const empty = RouterMatcher<never, never, never>(new Map())

  export const concat = <R, E, A, R2, E2, B>(
    matcher: RouteMatcher<R, E, A>,
    matcher2: RouteMatcher<R2, E2, B>,
  ): RouteMatcher<R | R2, E | E2, A | B> =>
    RouterMatcher(new Map([...matcher.routes, ...matcher2.routes]))
}

export const { matchFx, match, matchEffect } = RouterMatcher<never, never, never>(new Map())

export const makeRouter: Effect.Effect<
  Location | History | Window | Document | Scope.Scope,
  never,
  Router
> = Effect.gen(function* ($) {
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
        ),
        addWindowListener('popstate'),
        addWindowListener('hashchange'),
        historyEvents,
      ),
      Fx.debounce(Duration.millis(0)),
      Fx.map(() => getCurrentPath(location)),
      Fx.skipRepeats,
      Fx.switchMapEffect((path) => currentPath.set(path)),
      Fx.forkScoped,
    ),
  )

  // Make our base router
  return Router(Route.base, currentPath) as Router
})

export const live = Router.layerSoped(makeRouter)

function getCurrentPath(location: Location) {
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
