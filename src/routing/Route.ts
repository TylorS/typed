import { Cast } from 'Any/Cast'
import { And } from '@typed/fp/common/exports'
import { RemoveSlash } from './ReplaceSlash'

import { RouteParam } from './RouteParam'

export type RoutePart = string | RouteParam<string> | Route<RouteParts>
export type RouteParts = ReadonlyArray<RoutePart>

export interface Route<P extends RouteParts> {
  readonly path: PartsToPath<NormalizeParts<P>>
  readonly parts: NormalizeParts<P>
}

export type ValuesOf<A extends Route<RouteParts>> = PartsToValues<A['parts']>

export type PartsToPath<P extends RouteParts, R extends string = ``> = P extends readonly [infer A, ...infer Rest]
  ? PartsToPath<Cast<Rest, RouteParts>, `${R}/${PartToPath<Cast<A, RoutePart>>}`>
  : P extends readonly [infer A]
  ? `${R}/${PartToPath<Cast<A, RoutePart>>}`
  : R

export type PartToPath<A extends RoutePart> = A extends Route<infer Parts>
  ? PartsToPath<Parts>
  : A extends RouteParam<infer R>
  ? `:${R}`
  : Cast<A, string>

export type NormalizeParts<P extends RouteParts, Normalized extends RouteParts = []> = P extends readonly [infer A, ...infer Rest]
  ? NormalizeParts<Cast<Rest, RouteParts>, [...Normalized, ...NormalizePart<Cast<A, RoutePart>>]>
  : P extends readonly [infer A]
  ? [...Normalized, ...NormalizePart<Cast<A, RoutePart>>]
  : Normalized

export type NormalizePart<A extends RoutePart> = [A] extends [Route<infer Parts>]
  ? Parts
  : [A] extends [RouteParam<infer K>]
  ? [RouteParam<K>]
  : [RemoveSlash<Cast<A, string>>]

export type PartsToValues<A extends RouteParts> = And<{
  [K in keyof A]: A[K] extends RouteParam<infer R> ? Record<R, string> : unknown
}>

export function createRoute<A extends Route<RouteParts>>(path: A['path']): A {
  const parts = path.split(/\/+/g).filter(Boolean)

  return {
    path,
    parts,
  } as A
}
