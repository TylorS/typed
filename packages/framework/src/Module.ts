import type * as Effect from '@effect/io/Effect'
import type * as Layer from '@effect/io/Layer'
import * as Fx from '@typed/fx'
import type { Renderable } from '@typed/html'
import type * as Route from '@typed/route'
import type * as Router from '@typed/router'

import type { IntrinsicServices } from './IntrinsicServices.js'

/**
 * A module is a runtime representation of a route and its main function
 * when constructing a runtime/browser: module.
 */
export interface Module<out R, out E, P extends string> {
  readonly route: Route.Route<R, E, P>

  readonly main: Main<R, E, this['route']>

  readonly meta?: Module.Meta
}

export namespace Module {
  export interface Meta {
    readonly layout?: Fx.Fx<IntrinsicServices, Router.Redirect, Renderable>
    readonly getStaticPaths?: Effect.Effect<IntrinsicServices, never, ReadonlyArray<string>>
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type ResourcesOf<T> = [T] extends [Module<infer R, infer _, infer R2>]
    ? R | Route.ResourcesOf<R2>
    : never

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type ErrorsOf<T> = [T] extends [Module<infer _, infer E, infer R2>]
    ? E | Route.ErrorsOf<R2>
    : never

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type RouteOf<T> = [T] extends [Module<infer _, infer _, infer R2>] ? R2 : never

  export function make<R, E, P extends string, R2, E2>(
    route: Route.Route<R | IntrinsicServices, E, P>,
    main: Main<R2, E2, typeof route>,
    meta?: Module.Meta,
  ): Module<R | R2, E | E2, P> {
    return { route, main, meta } as Module<R | R2, E | E2, P>
  }
}

export interface Main<out Resources, out Errors, out R extends Route.Route<any, any, any>> {
  (params: Main.ParamsOf<R>): Fx.Fx<
    IntrinsicServices | Route.ResourcesOf<R> | Resources,
    Errors | Route.ErrorsOf<R> | Router.Redirect,
    Renderable
  >
}

export namespace Main {
  export type ParamsOf<T extends Route.Route<any, any, any>> = Fx.Fx<
    never,
    Router.Redirect | Route.ErrorsOf<T>,
    Route.ParamsOf<T>
  >

  export type For<R extends Route.Route<any, any, any>, R2, E2> = Main<R2, E2, R>

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type LayerOf<T extends Main<any, any, any>> = T extends Main<infer R, infer _, infer R2>
    ? Layer.Layer<IntrinsicServices, never, Exclude<R | Route.ResourcesOf<R2>, IntrinsicServices>>
    : never

  export function make<R, E, P extends string>(route: Route.Route<R, E, P>) {
    return <R2, E2>(main: Main<R2, E2, typeof route>): Main<R2, E2, typeof route> => main
  }

  export function lazy<R, E, P extends string>(route: Route.Route<R, E, P>) {
    return <R2, E2>(main: () => Promise<Main<R2, E2, typeof route>>): Main<R2, E2, typeof route> =>
      (params) =>
        Fx.promiseFx(() => main().then((m) => m(params)))
  }

  export function layer<M extends Main<any, any, any>>(main: M) {
    return (layer: LayerOf<typeof main>): typeof layer => layer
  }
}
