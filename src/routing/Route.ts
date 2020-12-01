import { And } from '@typed/fp/common/exports'
import { Cast } from 'Any/Cast'

import { RemoveSlash } from './ReplaceSlash'
import { RouteParam } from './RouteParam'

const pathSplitRegex = /\/+/g

/**
 * A data-type to represent a Route as is usable by path-to-regexp
 */
export interface Route<P extends RouteParts> {
  readonly path: PartsToPath<NormalizeParts<P>>
  readonly parts: NormalizeParts<P>
}

/**
 * Valid Route Parts
 */
export type RoutePart = string | RouteParam<string> | Route<RouteParts>

/**
 * A Tuple of Route Parts
 */
export type RouteParts = ReadonlyArray<RoutePart>

/**
 * A constructor for creating a type-safe path from a Route.
 */
export function createRoute<A extends Route<RouteParts>>(path: A['path']): A {
  const parts = path.split(pathSplitRegex).filter(Boolean)

  return {
    path,
    parts,
  } as A
}

/**
 * Extract an object from RouteParts
 */
export type GetRouteValue<A extends Route<RouteParts>> = PartsToValues<GetRouteParts<A>>

/**
 * Get the generated path from a Route
 */
export type GetRoutePath<A extends Route<RouteParts>> = A['path']

/**
 * Get a tuple of path parts from a Route
 */
export type GetRouteParts<A extends Route<RouteParts>> = A['parts']

/**
 * Convert a Tuple of Path parts back into a Path
 */
export type PartsToPath<P extends RouteParts, R extends string = ``> = P extends readonly [
  infer A,
  ...infer Rest
]
  ? PartsToPath<Cast<Rest, RouteParts>, `${R}/${PartToPath<Cast<A, RoutePart>>}`>
  : P extends readonly [infer A]
  ? `${R}/${PartToPath<Cast<A, RoutePart>>}`
  : R

/**
 * Convert a RoutePart into a Path
 */
export type PartToPath<A extends RoutePart> = A extends Route<infer Parts>
  ? PartsToPath<Parts>
  : A extends RouteParam<infer R>
  ? `:${R}`
  : Cast<A, string>

/**
 * Ensure double-slashes don't end up in paths
 */
export type NormalizeParts<
  P extends RouteParts,
  Normalized extends RouteParts = []
> = P extends readonly [infer A, ...infer Rest]
  ? NormalizeParts<Cast<Rest, RouteParts>, [...Normalized, ...NormalizePart<Cast<A, RoutePart>>]>
  : P extends readonly [infer A]
  ? [...Normalized, ...NormalizePart<Cast<A, RoutePart>>]
  : Normalized

/**
 * Remove slashes from a RoutePart
 */
export type NormalizePart<A extends RoutePart> = [A] extends [Route<infer Parts>]
  ? Parts
  : [A] extends [RouteParam<infer K>]
  ? [RouteParam<K>]
  : [RemoveSlash<Cast<A, string>>]

/**
 * Converts RouteParts into a Record of values.
 */
export type PartsToValues<A extends RouteParts> = And<
  {
    [K in keyof A]: A[K] extends RouteParam<infer R> ? Record<R, string> : unknown
  }
>
