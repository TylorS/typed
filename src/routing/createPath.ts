import * as P2R from 'path-to-regexp'

import { Route, RouteParts, ValuesOf } from './Route'

export function createPath<A extends Route<RouteParts>>(route: A) {
  const compile = P2R.compile(route.path)

  return (values: ValuesOf<A>) => compile(values as object)
}
