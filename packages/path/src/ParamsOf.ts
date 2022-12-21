import { Optional, Prefix, QueryParams } from './ast.js'
import { RemoveLeadingSlash } from './helpers.js'

// eslint-disable-next-line @typescript-eslint/ban-types
export type ParamsOf<Path extends string> = [PathToParts<Path>] extends [infer R] ? R : {}

export type PathToParts<P extends string> = P extends `${infer Head}${QueryParams<infer R>}`
  ? readonly [...PathToParts<Head>, QueryParams<R>]
  : P extends `${infer Head}/${infer Tail}`
  ? readonly [...PathToParts<Head>, ...PathToParts<Tail>]
  : P extends `${infer Head}${Optional<Prefix<infer P, infer Q>>}${infer Tail}`
  ? readonly [...PathToParts<Head>, Optional<Prefix<P, Q>>, ...PathToParts<`${Tail}`>]
  : P extends `${infer Head}${Prefix<infer P, infer Q>}${infer Tail}`
  ? readonly [...PathToParts<Head>, Prefix<P, Q>, ...PathToParts<`${Tail}`>]
  : `` extends P
  ? readonly []
  : readonly [RemoveLeadingSlash<P>]
