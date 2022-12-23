import * as Layer from '@effect/io/Layer'
import * as dom from '@typed/dom'
import * as Fx from '@typed/fx'
import * as html from '@typed/html'
import { RenderContext } from '@typed/html'
import * as Route from '@typed/route'
import * as Router from '@typed/router'

export type IntrinsicServices = dom.DomServices | Router.Router | RenderContext

export interface Module<R, Routes extends ReadonlyArray<Route.Route<any, any>>> {
  /**
   * The component for which we will be rendering into the DOM
   */
  readonly main: Fx.Fx<
    IntrinsicServices | R | Route.ResourcesOf<Routes[number]>,
    never,
    html.Hole | Node
  >

  /**
   * The routes at which to mount the component
   */
  readonly routes: readonly [...Routes]

  /**
   * The environment required to run the module
   */
  readonly environment: Layer.Layer<IntrinsicServices, never, R | Route.ResourcesOf<Routes[number]>>

  /**
   * Server-side rendering will use these queries to determine when to flush your streams to the Response.
   * If these are not provided, the vite plugin will attempt to statically analyze your code to determine
   * the values to use here.
   */
  readonly querySelectors?: readonly string[]
}

export function make<R, Routes extends ReadonlyArray<Route.Route<any, any>>>(
  module: Module<R, Routes>,
): Module<R, Routes> {
  return module
}
