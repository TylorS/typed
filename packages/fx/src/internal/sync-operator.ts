import type * as Option from "@effect/data/Option"

// Sync operators are a subset of operators which can be safely fused together synchronously

export type SyncOperator = 
  | Map<any, any>
  | Filter<any>
  | FilterMap<any, any>
  | Slice // Kind of a special case as it will commute with Map only

export interface Map<A, B> { 
  readonly _tag: "Map"
  readonly f: (a: A) => B
}

export const Map = <A, B>(f: (a: A) => B): Map<A, B> => ({ _tag: "Map", f })

export interface Filter<A> { 
  readonly _tag: "Filter"
  readonly f: (a: A) => boolean
}

export const Filter = <A>(f: (a: A) => boolean): Filter<A> => ({ _tag: "Filter", f })

export interface FilterMap<A, B> { 
  readonly _tag: "FilterMap"
  readonly f: (a: A) => Option.Option<B>
}

export const FilterMap = <A, B>(f: (a: A) => Option.Option<B>): FilterMap<A, B> => ({ _tag: "FilterMap", f })

export interface Slice { 
  readonly _tag: "Slice"
  readonly start: number
  readonly end: number
}

export const Slice = (start: number, end: number): Slice => ({ _tag: "Slice", start, end })
