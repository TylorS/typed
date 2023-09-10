import * as Option from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import type { SyncOperator } from "@typed/fx/internal/sync-operator"

// Effect operators are a subset of operators which can be safely fused together assynchronously

export type EffectOperator =
  | MapEffect<any, any, any, any>
  | TapEffect<any, any, any, any>
  | FilterEffect<any, any, any>
  | FilterMapEffect<any, any, any, any>

export interface MapEffect<A, R2, E2, B> {
  readonly _tag: "MapEffect"
  readonly f: (a: A) => Effect.Effect<R2, E2, B>
}

export const MapEffect = <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): MapEffect<A, R2, E2, B> => ({
  _tag: "MapEffect",
  f
})

export interface TapEffect<A, R2, E2, B> {
  readonly _tag: "TapEffect"
  readonly f: (a: A) => Effect.Effect<R2, E2, B>
}

export const TapEffect = <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): TapEffect<A, R2, E2, B> => ({
  _tag: "TapEffect",
  f
})

export interface FilterEffect<A, R2, E2> {
  readonly _tag: "FilterEffect"
  readonly f: (a: A) => Effect.Effect<R2, E2, boolean>
}

export const FilterEffect = <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): FilterEffect<A, R2, E2> => ({
  _tag: "FilterEffect",
  f
})

export interface FilterMapEffect<A, R2, E2, B> {
  readonly _tag: "FilterMapEffect"
  readonly f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
}

export const FilterMapEffect = <A, R2, E2, B>(
  f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
): FilterMapEffect<A, R2, E2, B> => ({ _tag: "FilterMapEffect", f })

type EffectOperatorFusionMap = {
  readonly [K in EffectOperator["_tag"]]: {
    readonly [K2 in EffectOperator["_tag"]]: (
      op1: Extract<EffectOperator, { readonly _tag: K }>,
      op2: Extract<EffectOperator, { readonly _tag: K2 }>
    ) => EffectOperator
  }
}

const EffectOperatorFusionMap: EffectOperatorFusionMap = {
  MapEffect: {
    MapEffect: (op1, op2) => MapEffect((a: any) => Effect.flatMap(op1.f(a), op2.f)),
    TapEffect: (op1, op2) => TapEffect((a: any) => Effect.tap(op1.f(a), op2.f)),
    FilterEffect: (op1, op2) =>
      FilterMapEffect((a: any) =>
        Effect.flatMap(
          op1.f(a),
          (b) => Effect.map(op2.f(b), (b2) => b2 ? Option.some(b) : Option.none())
        )
      ),
    FilterMapEffect: (op1, op2) => FilterMapEffect((a: any) => Effect.flatMap(op1.f(a), op2.f))
  },
  TapEffect: {
    MapEffect: (op1, op2) => MapEffect((a: any) => Effect.flatMap(op1.f(a), () => op2.f(a))),
    TapEffect: (op1, op2) => TapEffect((a: any) => Effect.flatMap(op1.f(a), () => op2.f(a))),
    FilterEffect: (op1, op2) => FilterEffect((a: any) => Effect.flatMap(op1.f(a), () => op2.f(a))),
    FilterMapEffect: (op1, op2) => FilterMapEffect((a: any) => Effect.flatMap(op1.f(a), () => op2.f(a)))
  },
  FilterEffect: {
    MapEffect: (op1, op2) =>
      FilterMapEffect((a: any) =>
        Effect.flatMap(
          op1.f(a),
          (b) => b ? Effect.map(op2.f(a), Option.some) : Effect.succeedNone
        )
      ),
    TapEffect: (op1, op2) => FilterEffect((a: any) => Effect.tap(op1.f(a), () => op2.f(a))),
    FilterEffect: (op1, op2) =>
      FilterEffect((a: any) =>
        Effect.zip(
          op1.f(a),
          op2.f(a)
        ).pipe(
          Effect.map(([b1, b2]) => b1 && b2)
        )
      ),
    FilterMapEffect: (op1, op2) =>
      FilterMapEffect((a: any) =>
        Effect.flatMap(
          op1.f(a),
          (b) => b ? op2.f(a) : Effect.succeedNone
        )
      )
  },
  FilterMapEffect: {
    MapEffect: (op1, op2) =>
      FilterMapEffect((a: any) =>
        Effect.flatMap(
          op1.f(a),
          Option.match({
            onNone: () => Effect.succeedNone,
            onSome: op2.f
          })
        )
      ),
    TapEffect: (op1, op2) =>
      FilterMapEffect((a: any) =>
        Effect.flatMap(
          op1.f(a),
          Option.match({
            onNone: () => Effect.succeedNone,
            onSome: (b) => op2.f(a).pipe(Effect.map(() => b))
          })
        )
      ),
    FilterEffect: (op1, op2) =>
      FilterMapEffect((a: any) =>
        Effect.flatMap(
          op1.f(a),
          Option.match({
            onNone: () => Effect.succeedNone,
            onSome: (b) =>
              op2.f(b)
                .pipe(
                  Effect.map((b2) => b2 ? Option.some(b) : Option.none())
                )
          })
        )
      ),
    FilterMapEffect: (op1, op2) =>
      FilterMapEffect((a: any) =>
        Effect.flatMap(
          op1.f(a),
          Option.match({
            onNone: () => Effect.succeedNone,
            onSome: (b) => op2.f(b)
          })
        )
      )
  }
}

export function fuseEffectOperators(op1: EffectOperator, op2: EffectOperator): EffectOperator {
  return EffectOperatorFusionMap[op1._tag][op2._tag](op1 as any, op2 as any)
}

export function liftSyncOperator(op: SyncOperator): EffectOperator {
  switch (op._tag) {
    case "Filter":
      return FilterEffect((a) => Effect.sync(() => op.f(a)))
    case "FilterMap":
      return FilterMapEffect((a) => Effect.sync(() => op.f(a)))
    case "Map":
      return MapEffect((a) => Effect.sync(() => op.f(a)))
    case "Slice": {
      throw new Error("Cannot lift Slice operator")
    }
  }
}
