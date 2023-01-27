/* eslint-disable @typescript-eslint/ban-types */
import * as Effect from '@effect/io/Effect'
import type * as Layer from '@effect/io/Layer'
import type * as Scope from '@effect/io/Scope'
import { pipe } from '@fp-ts/core/Function'
import * as Option from '@fp-ts/core/Option'
import * as Context from '@typed/context'
import { Document, Location, History, addWindowListener } from '@typed/dom'
import * as Fx from '@typed/fx'
import type * as html from '@typed/html'
import { RenderContext } from '@typed/html'
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
  readonly provideContext: (environment: Context.Context<R>) => Router<never, P>

  /**
   * The parent router if one exists
   */
  readonly parent: Option.Option<Router<any, string>>
}

export const Router = Object.assign(function makeRouter<R = never, P extends string = string>(
  route: Route.Route<R, P>,
  currentPath: Fx.RefSubject<string>,
  parent: Option.Option<Router<any, string>> = Option.none(),
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
      makeRouter(route.concat(other), currentPath, Option.some(router as any)),
    provideContext: (env) => provideContext(env)(router),
    parent,
  }

  return router
},
Context.Tag<Router>('@typed/router/Router'))

export const outlet: Fx.Fx<RenderContext | Router, never, html.Renderable> = RenderContext.withFx(
  ({ environment }) =>
    Router.withFx((r) =>
      environment === 'browser'
        ? r.outlet
        : pipe(
            r.outlet,
            Fx.skipUntil((x) => x !== null),
            Fx.take(1),
          ),
    ),
)

export const currentPath: Fx.Fx<Router, never, string> = Router.withFx((r) => r.currentPath)

export function provideContext<R>(environment: Context.Context<R>) {
  return <P extends string>(router: Router<R, P>): Router<never, P> => {
    const provided: Router<never, P> = {
      ...router,
      params: pipe(router.params, Fx.provideContext(environment)),
      route: Route.provideContext(environment)(router.route),
      createPath: ((other, ...params) =>
        Effect.provideContext<R>(environment)(router.createPath(other, ...params))) as Router<
        never,
        P
      >['createPath'],
      provideContext: (env) => provideContext(env)(provided),
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

// TOOD: Add support for reading <base> tag for default Router path.

export const makeRouter = (
  currentPath?: Fx.RefSubject<string>,
): Effect.Effect<Location | History | Window | Document | Scope.Scope, never, Router> =>
  Effect.gen(function* ($) {
    const history = yield* $(History.get)
    const location = yield* $(Location.get)

    if (!currentPath) {
      currentPath = Fx.RefSubject.unsafeMake(() => getCurrentPathFromLocation(location))
    }

    // Patch history events to emit an event when the path changes
    const historyEvents = yield* $(patchHistory)

    // Update the current path when events occur:
    // - popstate
    // - hashchange
    // - history events
    yield* $(
      pipe(
        Fx.mergeAll(addWindowListener('popstate'), addWindowListener('hashchange'), historyEvents),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        Fx.switchMapEffect(() => currentPath!.set(getCurrentPathFromLocation(location))),
        Fx.forkScoped,
      ),
    )

    // Listen to path changes and update the current history location, if necessary
    yield* $(
      pipe(
        currentPath,
        Fx.skipRepeats,
        Fx.observe((path) =>
          Effect.sync(() => {
            if (path !== getCurrentPathFromLocation(location)) {
              history.pushState({}, '', path)
            }
          }),
        ),
        Effect.forkScoped,
      ),
    )

    // Find the configured base path
    const document = yield* $(Document.get)
    const base = document.querySelector('base')
    const baseHref = base ? getBasePathFromHref(base.href) : '/'

    // Make our base router
    return Router(Route.Route(baseHref), currentPath) as Router
  })

export const live = (
  currentPath?: Fx.RefSubject<string>,
): Layer.Layer<Location | History | Window | Document, never, Router<never, string>> =>
  Router.layerScoped(makeRouter(currentPath))

export function getCurrentPathFromLocation(location: Location | HTMLAnchorElement | URL) {
  return location.pathname + location.search + location.hash
}

export const getCurrentPath = Router.withEffect((r) => r.currentPath.get)

export const getBasePath = Router.with((r) => {
  const routers: Router<any, any>[] = [r]
  let current: Router<any, any> = r

  while (Option.isSome(current.parent)) {
    current = current.parent.value
    routers.push(current)
  }

  return routers.reduceRight((acc, r) => Path.pathJoin(r.route.path, acc), '')
})

const patchHistory = Effect.gen(function* ($) {
  const history = yield* $(History.get)
  const historyEvents = Fx.Subject.unsafeMake<never, void>()
  const runtime = yield* $(Effect.runtime<never>())
  const cleanup = patchHistory_(history, () => runtime.unsafeFork(historyEvents.event()))

  // unpatch history upon finalization
  yield* $(Effect.addFinalizer(() => Effect.sync(cleanup)))

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

  // Reset history to original state
  return () => {
    history.pushState = pushState
    history.replaceState = replaceState
    history.go = go
    history.back = back
    history.forward = forward
  }
}

function getBasePathFromHref(href: string) {
  try {
    const url = new URL(href)

    return getCurrentPathFromLocation(url)
  } catch {
    return href
  }
}
