import { Match } from '@typed/fp/logic/exports'
import { none, some } from 'fp-ts/Option'
import * as P2R from 'path-to-regexp'

import { GetRouteValue, Route, RouteParts } from './Route'

export type MatchRouteOptions = P2R.ParseOptions &
  P2R.TokensToRegexpOptions &
  P2R.RegexpToFunctionOptions

/**
 * Create Match function for a Route. It does *not* do decoding
 * of your values into types, if that is required you'll do it separate to this.
 */
export const matchRoute = <A extends Route<RouteParts>>(
  route: A,
  options: MatchRouteOptions = {},
): Match<string, GetRouteValue<A>> => {
  const match = P2R.match(route.path, { decode: decodeURIComponent, ...options })

  return (path: string) => {
    const values = match(path)

    if (!values) {
      return none
    }

    return some(values.params as GetRouteValue<A>)
  }
}
