import { Path } from '@typed/fp/Path/exports'
import * as P2R from 'path-to-regexp'

import { GetRouteValue, Route, RouteParts } from './Route'

export type CreatePathOptions = P2R.ParseOptions & P2R.TokensToFunctionOptions

/**
 * Create a function to generate a Path from a given set of Route values.
 */
export function createPath<A extends Route<RouteParts>>(route: A, options: CreatePathOptions = {}) {
  const compile = P2R.compile(route.path, { encode: encodeURIComponent, ...options })

  return (values: GetRouteValue<A>): Path => Path.wrap(compile(values as object))
}
