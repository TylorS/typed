/**
 * Convert a list of values to a ConsList
 */
export type ToConsList<A extends readonly any[]> = [] extends A
  ? unknown
  : ((...a: A) => any) extends (t: infer T, ...ts: infer TS) => any
  ? [T, ToConsList<TS>]
  : never

/**
 * Unnest a Flattened ConsList
 */
export type UnNest<T, Fallback = unknown> = T extends any[]
  ? {
      [K in keyof T]: T[K] extends [infer TT] ? (TT extends any[] ? UnNest<TT> : TT) : T[K]
    }[number]
  : Fallback

/**
 * Lazily flatten a ConsList to an Intersection
 */
export type FlattenIntersection<A, S> = A extends [infer H]
  ? S & H
  : A extends [infer H, infer T]
  ? [FlattenIntersection<T, S & H>]
  : S

/**
 * Lazily flatten a ConsList to a Union
 */
export type FlattenUnion<A, S> = A extends [infer H]
  ? S | H
  : A extends [infer H, infer T]
  ? [FlattenUnion<T, S | H>]
  : S
