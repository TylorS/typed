import { none, some } from 'fp-ts/lib/Option'
import * as P2R from 'path-to-regexp'

import { createRoute, Route, RouteParts, ValuesOf } from './Route'
import { RouteParam } from './RouteParam'

export const matchRoute = <A extends Route<RouteParts>>(route: A) => {
  const match = P2R.match(route.path)

  return (path: string) => {
    const values = match(path)

    if (!values) {
      return none
    }

    return some(values.params as ValuesOf<A>)
  }
}
