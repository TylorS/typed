import * as Context from '@fp-ts/data/Context'
import * as Option from '@fp-ts/data/Option'
import { RefSubject } from '@typed/fx'
import * as html from '@typed/html'
import * as Path from '@typed/path'
import * as Route from '@typed/route'

export interface Router<R = never, E = never, P extends string = string> {
  readonly route: Route.Route<R, E, P>

  readonly currentPath: RefSubject<string>

  readonly outlet: RefSubject<Option.Option<html.Placeholder>>

  readonly createPath: <R2 extends Route.Route<any, any, string>, P extends Route.ParamsOf<R2>>(
    route: R2,
    ...[params]: [keyof P] extends [never] ? [] : [P]
  ) => Path.PathJoin<
    [Path.Interpolate<Route.PathOf<R>, Route.ParamsOf<R>>, Path.Interpolate<Route.PathOf<R2>, P>]
  >
}

export const Router = Object.assign(Context.Tag<Router>(), {})

// TODO: Devise a router capable of working in multiple environments
// TODO: Should allow passing params as a stream as well as an object to matches
// TODO: Should require 404 matching or a redirect to nest a Router and instantiate routes
// TODO: Allow route failures to be redirected to a 404 page
