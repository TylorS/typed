import type * as Option from "@effect/data/Option"
import type * as Effect from "@effect/io/Effect"

// Effect operators are a subset of operators which can be safely fused together assynchronously

export type EffectOperator =
  | MapEffect<any, any, any, any>
  | TapEffect<any, any, any, any>
  | FilterEffect<any, any, any>
  | FilterMapEffect<any, any, any, any>
  | LoopEffect<any, any, any, any, any>

export interface MapEffect<A, R2, E2, B> {
  readonly _tag: "MapEffect"
  readonly f: (a: A) => Effect.Effect<R2, E2, B>
}

export const MapEffect = <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): MapEffect<A, R2, E2, B> => ({ _tag: "MapEffect", f })

export interface TapEffect<A, R2, E2, B> {
  readonly _tag: "TapEffect"
  readonly f: (a: A) => Effect.Effect<R2, E2, B>
}

export const TapEffect = <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): TapEffect<A, R2, E2, B> => ({ _tag: "TapEffect", f })

export interface FilterEffect<A, R2, E2> {
  readonly _tag: "FilterEffect"
  readonly f: (a: A) => Effect.Effect<R2, E2, boolean>
}

export const FilterEffect = <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): FilterEffect<A, R2, E2> => ({ _tag: "FilterEffect", f })

export interface FilterMapEffect<A, R2, E2, B> {
  readonly _tag: "FilterMapEffect"
  readonly f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
}

export const FilterMapEffect = <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>): FilterMapEffect<A, R2, E2, B> => ({ _tag: "FilterMapEffect", f })

export interface LoopEffect<A, R2, E2, B, C> { 
  readonly _tag: "LoopEffect"
  readonly f: (b: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>
  readonly seed: B
}
