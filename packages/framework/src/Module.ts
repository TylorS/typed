import * as Fx from '@typed/fx'
import { Renderable } from '@typed/html'
import * as Route from '@typed/route'
import * as Router from '@typed/router'

import { IntrinsicServices } from './IntrinsicServices.js'

export interface Module<out R, P extends string> {
  readonly route: Route.Route<IntrinsicServices, P>

  readonly main: Module.Main<R, this['route']>

  readonly meta?: Module.Meta
}

export namespace Module {
  export interface Meta {
    readonly layout?: Fx.Fx<IntrinsicServices, Router.Redirect, Renderable>
  }

  export interface Main<out R2, out R extends Route.Route<any, any>> {
    (params: Fx.Fx<never, Router.Redirect, Route.ParamsOf<R>>): Fx.Fx<
      IntrinsicServices | Route.ResourcesOf<R> | R2,
      Router.Redirect,
      Renderable
    >
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type ResourcesOf<T> = [T] extends [Module<infer R, infer _>] ? R : never

  export function make<R, P extends string, R2>(
    route: Route.Route<R | IntrinsicServices, P>,
    main: Main<R2, typeof route>,
    meta?: Module.Meta,
  ): Module<R | R2, P> {
    return { route, main, meta } as Module<R | R2, P>
  }
}
