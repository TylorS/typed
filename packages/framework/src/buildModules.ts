import * as Router from '@typed/router'
import { Redirect, RouteMatcher } from '@typed/router'

import type { IntrinsicServices } from './IntrinsicServices.js'
import type { Module } from './Module.js'
import { isEnvironmentFileName, isFallbackFileName, isLayoutFileName } from './fileNames.js'

export type Modules = ReadonlyArray<Module<never, any> | Module<any, any>>

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
  // Layout should be processed first
  if (isLayoutFileName(a)) return -1
  if (isLayoutFileName(b)) return 1

  // Environment should be processed second
  if (isEnvironmentFileName(a)) return -1
  if (isEnvironmentFileName(b)) return 1

  // Fallback should be processed third
  if (isFallbackFileName(a)) return -1
  if (isFallbackFileName(b)) return 1

  // Root route should always go to the end
  if (a === '/') return 1
  if (b === '/') return -1

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
