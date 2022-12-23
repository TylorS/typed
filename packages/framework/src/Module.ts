import * as Fx from '@typed/fx'
import * as Path from '@typed/path'
import * as Route from '@typed/route'
import { matchFx, RouteMatcher } from '@typed/router'

import { IntrinsicServices } from './IntrinsicServices.js'

export interface Module<P extends string> {
  readonly route: Route.Route<IntrinsicServices, P>

  readonly main: (
    params: Fx.Fx<never, never, Path.ParamsOf<P>>,
  ) => Fx.Fx<IntrinsicServices, never, Node>
}

export namespace Module {
  export function make<P extends string>(
    route: Route.Route<IntrinsicServices, P>,
    main: (params: Fx.Fx<never, never, Path.ParamsOf<P>>) => Fx.Fx<IntrinsicServices, never, Node>,
  ): Module<P> {
    return { route, main }
  }

  export function toMatcher<Path extends string>(
    module: Module<Path>,
  ): RouteMatcher<IntrinsicServices, never, Node> {
    return matchFx(module.route, module.main)
  }
}
