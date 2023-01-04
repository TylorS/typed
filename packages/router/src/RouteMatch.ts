/* eslint-disable @typescript-eslint/ban-types */
import * as Layer from '@effect/io/Layer'
import { flow } from '@fp-ts/data/Function'
import * as Context from '@typed/context'
import * as Fx from '@typed/fx'
import * as html from '@typed/html'
import * as Path from '@typed/path'
import * as Route from '@typed/route'

export interface RouteMatch<R, E, P extends string> {
  readonly route: Route.Route<R, P>

  readonly layout?: Fx.Fx<R, E, html.Renderable>

  readonly match: (params: Fx.Fx<never, never, Path.ParamsOf<P>>) => Fx.Fx<R, E, html.Renderable>

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