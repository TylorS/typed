import * as Layer from '@effect/io/Layer'
import * as Fx from '@typed/fx'
import { Renderable } from '@typed/html'
import * as Route from '@typed/route'
import * as Router from '@typed/router'

import { IntrinsicServices } from './IntrinsicServices.js'

export interface Module<out R, P extends string> {
  readonly route: Route.Route<R, P>

  readonly main: Main<R, this['route']>

  readonly meta?: Module.Meta
}

export namespace Module {
  export interface Meta {
    readonly layout?: Fx.Fx<IntrinsicServices, Router.Redirect, Renderable>
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type ResourcesOf<T> = T extends Module<infer R, infer _> ? R : never

  export function make<R, P extends string, R2>(
    route: Route.Route<R | IntrinsicServices, P>,
    main: Main<R2, typeof route>,
    meta?: Module.Meta,
  ): Module<R | R2, P> {
    return { route, main, meta } as Module<R | R2, P>
  }
}

export interface Main<out R2, out R extends Route.Route<any, any>> {
  (params: Main.ParamsOf<R>): Fx.Fx<
    IntrinsicServices | Route.ResourcesOf<R> | R2,
    Router.Redirect,
    Renderable
  >
}

export namespace Main {
  export type ParamsOf<T extends Route.Route<any, any>> = Fx.Fx<
    never,
    Router.Redirect,
    Route.ParamsOf<T>
  >

  export type For<R extends Route.Route<any, any>, R2> = Main<R2, R>

  export type LayerOf<T extends Main<any, any>> = T extends Main<infer R, infer R2>
    ? Layer.Layer<IntrinsicServices, never, Exclude<R | Route.ResourcesOf<R2>, IntrinsicServices>>
    : never

  export function make<R extends Route.Route<any, any>>(route: R) {
    return <R2>(main: Main<R2, typeof route>): Main<R2, R> => main
  }

  export function lazy<R extends Route.Route<any, any>>(route: R) {
    return <R2>(main: () => Promise<Main<R2, typeof route>>): Main<R2, R> =>
      (params) =>
        Fx.promiseFx(() => main().then((m) => m(params)))
  }

  export function layer<R, R2 extends Route.Route<any, any>>(main: Main<R, R2>) {
    return (layer: LayerOf<typeof main>): typeof layer => layer
  }
}