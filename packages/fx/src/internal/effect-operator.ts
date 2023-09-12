import * as Option from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import { WithContext } from "@typed/fx/internal/sink"
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
  }
}

export function matchEffectOperator<A, B, C, D>(
  operator: EffectOperator,
  matchers: {
    readonly MapEffect: (f: MapEffect<any, any, any, any>) => A
    readonly TapEffect: (f: TapEffect<any, any, any, any>) => B
    readonly FilterEffect: (f: FilterEffect<any, any, any>) => C
    readonly FilterMapEffect: (f: FilterMapEffect<any, any, any, any>) => D
  }
): A | B | C | D {
  switch (operator._tag) {
    case "MapEffect":
      return matchers.MapEffect(operator)
    case "TapEffect":
      return matchers.TapEffect(operator)
    case "FilterEffect":
      return matchers.FilterEffect(operator)
    case "FilterMapEffect":
      return matchers.FilterMapEffect(operator)
  }
}

export function compileEffectOperatorSink<R>(
  operator: EffectOperator,
  sink: WithContext<R, any, any>
): WithContext<R, any, any> {
  return matchEffectOperator(operator, {
    MapEffect: (op) => WithContext(sink.onFailure, (a) => Effect.matchCauseEffect(op.f(a), sink)),
    FilterEffect: (op) =>
      WithContext(
        sink.onFailure,
        (a) =>
          Effect.matchCauseEffect(op.f(a), {
            onFailure: sink.onFailure,
            onSuccess: (b) => b ? sink.onSuccess(a) : Effect.unit
          })
      ),
    FilterMapEffect: (op) =>
      WithContext(sink.onFailure, (a) =>
        Effect.matchCauseEffect(op.f(a), {
          onFailure: sink.onFailure,
          onSuccess: Option.match({
            onNone: () => Effect.unit,
            onSome: sink.onSuccess
          })
        })),
    TapEffect: (op) => WithContext(sink.onFailure, (a) => Effect.matchCauseEffect(Effect.as(op.f(a), a), sink))
  })
}

export function compileCauseEffectOperatorSink<R>(
  operator: EffectOperator,
  sink: WithContext<R, any, any>
): WithContext<R, any, any> {
  return matchEffectOperator(operator, {
    MapEffect: (op) =>
      WithContext(
        (a) => Effect.matchCauseEffect(op.f(a), WithContext(sink.onFailure, sink.onFailure)),
        sink.onSuccess
      ),
    FilterEffect: (op) =>
      WithContext(
        (a) =>
          Effect.matchCauseEffect(op.f(a), {
            onFailure: sink.onFailure,
            onSuccess: (b) => b ? sink.onFailure(a) : Effect.unit
          }),
        sink.onSuccess
      ),
    FilterMapEffect: (op) =>
      WithContext((a) =>
        Effect.matchCauseEffect(op.f(a), {
          onFailure: sink.onFailure,
          onSuccess: Option.match({
            onNone: () => Effect.unit,
            onSome: sink.onFailure
          })
        }), sink.onSuccess),
    TapEffect: (op) =>
      WithContext(
        (a) => Effect.matchCauseEffect(Effect.as(op.f(a), a), WithContext(sink.onFailure, sink.onFailure)),
        sink.onSuccess
      )
  })
}

export function compileEffectLoop<B, A, R2, E2, C>(
  operator: EffectOperator,
  loop: (b: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>
): (b: B, i: any) => Effect.Effect<R2, E2, Option.Option<readonly [C, B]>> {
  return matchEffectOperator(operator, {
    MapEffect: (op) => (b, i) => op.f(i).pipe(Effect.flatMap((a) => loop(b, a)), Effect.map(Option.some)),
    TapEffect: (op) => (b, i) => op.f(i).pipe(Effect.flatMap(() => loop(b, i)), Effect.map(Option.some)),
    FilterEffect: (op) => (b, i) =>
      op.f(i).pipe(
        Effect.flatMap((a) => a ? Effect.map(loop(b, i), Option.some) : Effect.succeedNone)
      ),
    FilterMapEffect: (op) => (b, i) =>
      op.f(i).pipe(
        Effect.flatMap(Option.match({
          onNone: () => Effect.succeedNone,
          onSome: (a) => Effect.map(loop(b, a), Option.some)
        }))
      )
  })
}
