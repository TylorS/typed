import { Fx } from '@typed/fx'
import { Renderable } from '@typed/html'
import { ParamsOf } from '@typed/path'
import { Route } from '@typed/route'
import * as Router from '@typed/router'
import { Redirect, RouteMatcher } from '@typed/router'

import { IntrinsicServices } from './IntrinsicServices.js'
import { Module } from './Module.js'
import { isFallbackFileName, isLayoutFileName } from './fileNames.js'

export type Modules = ReadonlyArray<Module<never, any> | Module<any, any>>

export type Fallback = RenderableFallback | RedirectFallback<any>

export interface RenderableFallback {
  readonly type: 'Renderable'
  readonly fallback: (path: string) => Fx<IntrinsicServices, Router.Redirect, Renderable>
}

export function RenderableFallback(
  fallback: (path: string) => Fx<IntrinsicServices, Router.Redirect, Renderable>,
): RenderableFallback {
  return {
    type: 'Renderable',
    fallback,
  }
}

export interface RedirectFallback<P extends string> {
  readonly type: 'Redirect'
  readonly route: Route<IntrinsicServices, P>
  readonly params?: ParamsOf<P>
}

export function RedirectFallback<P extends string>(
  route: Route<IntrinsicServices, P>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  ...[params]: [keyof ParamsOf<P>] extends [never] ? [{}?] : [ParamsOf<P>]
): RedirectFallback<P> {
  return {
    type: 'Redirect',
    route,
    params: params as RedirectFallback<P>['params'],
  }
}

export function buildModules<M extends Modules>(
  modules: readonly [...M],
): RouteMatcher<Module.ResourcesOf<M[number]>, Redirect> {
  return orderModulesByRoute(modules as M)
    .map(moduleToRouteMatcher)
    .reduce(RouteMatcher.concat)
}

export function moduleToRouteMatcher<R>(
  module: Module<R, string>,
): Router.RouteMatcher<R | IntrinsicServices, Router.Redirect> {
  const { route, main, meta } = module
  const matcher = Router.matchFx(route, main)

  if (meta?.layout) {
    return matcher.withLayout(meta.layout)
  }

  return matcher
}

// Ensure that routes are ordered deterministically
function orderModulesByRoute(modules: Modules): Modules {
  return modules.slice().sort((a, b) => pathCardinality(a.route.path, b.route.path)) as any
}

export function pathCardinality(a: string, b: string): number {
  // Root route should always go to the end
  if (a === '/') return 1
  if (b === '/') return -1

  // Fallback/Layout should be processed first
  if (isFallbackFileName(a) || isLayoutFileName(a)) return -1
  if (isFallbackFileName(b) || isLayoutFileName(b)) return 1

  const aLength = pathLength(a)
  const bLength = pathLength(b)

  // If the path lengths are the same, then we want to sort alphabetically
  if (aLength === bLength) {
    return a < b ? -1 : a > b ? 1 : 0
  }

  return aLength - bLength
}

function pathLength(a: string): number {
  return a.split(/\//g).length
}
