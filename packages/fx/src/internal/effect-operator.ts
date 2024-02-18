import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import * as Sink from "../Sink.js"
import * as SyncOp from "./sync-operator.js"
import * as SyncProducer from "./sync-producer.js"

// Effect operators are a subset of operators which can be safely fused together assynchronously

export type EffectOperator =
  | MapEffect<any, any, any, any>
  | TapEffect<any, any, any, any>
  | FilterEffect<any, any, any>
  | FilterMapEffect<any, any, any, any>

export interface MapEffect<A, B, E2, R2> {
  readonly _tag: "MapEffect"
  readonly f: (a: A) => Effect.Effect<B, E2, R2>
}

export const MapEffect = <A, B, E2, R2>(f: (a: A) => Effect.Effect<B, E2, R2>): MapEffect<A, B, E2, R2> => ({
  _tag: "MapEffect",
  f
})

export interface TapEffect<A, B, E2, R2> {
  readonly _tag: "TapEffect"
  readonly f: (a: A) => Effect.Effect<B, E2, R2>
}

export const TapEffect = <A, B, E2, R2>(f: (a: A) => Effect.Effect<B, E2, R2>): TapEffect<A, B, E2, R2> => ({
  _tag: "TapEffect",
  f
})

export interface FilterEffect<A, R2, E2> {
  readonly _tag: "FilterEffect"
  readonly f: (a: A) => Effect.Effect<boolean, E2, R2>
}

export const FilterEffect = <A, R2, E2>(f: (a: A) => Effect.Effect<boolean, E2, R2>): FilterEffect<A, R2, E2> => ({
  _tag: "FilterEffect",
  f
})

export interface FilterMapEffect<A, B, E2, R2> {
  readonly _tag: "FilterMapEffect"
  readonly f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>
}

export const FilterMapEffect = <A, B, E2, R2>(
  f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>
): FilterMapEffect<A, B, E2, R2> => ({ _tag: "FilterMapEffect", f })

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
    TapEffect: (op1, op2) => MapEffect((a: any) => Effect.tap(op1.f(a), op2.f)),
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
            onSome: (b) => Effect.as(op2.f(b), Option.some(b))
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

// TODO: We should probably do more specific fusions
export function liftSyncOperator(op: SyncOp.SyncOperator): EffectOperator {
  return SyncOp.matchSyncOperator(op, {
    Filter: (op): EffectOperator => FilterEffect((a) => Effect.succeed(op.f(a))),
    FilterMap: (op) => FilterMapEffect((a) => Effect.succeed(op.f(a))),
    Map: (op) => MapEffect((a) => Effect.succeed(op.f(a)))
  })
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
  sink: Sink.Sink<any, any, R>
): Sink.Sink<any, any, R> {
  return matchEffectOperator(operator, {
    MapEffect: (op) => Sink.mapEffect(sink, op.f),
    FilterEffect: (op) => Sink.filterEffect(sink, op.f),
    FilterMapEffect: (op) => Sink.filterMapEffect(sink, op.f),
    TapEffect: (op) => Sink.tapEffect(sink, op.f)
  })
}

export function compileCauseEffectOperatorSink<R>(
  operator: EffectOperator,
  sink: Sink.Sink<any, any, R>
): Sink.Sink<any, any, R> {
  return matchEffectOperator(operator, {
    MapEffect: (op) =>
      Sink.make(
        (a) =>
          Effect.matchCauseEffect(
            op.f(a),
            Sink.make((cause2) => sink.onFailure(Cause.sequential(a, cause2)), sink.onFailure)
          ),
        sink.onSuccess
      ),
    FilterEffect: (op) =>
      Sink.make(
        (a) =>
          Effect.matchCauseEffect(
            op.f(a),
            Sink.make(
              (cause2) => sink.onFailure(Cause.sequential(a, cause2)),
              (b) => b ? sink.onFailure(a) : Effect.unit
            )
          ),
        sink.onSuccess
      ),
    FilterMapEffect: (op) =>
      Sink.make(
        (a) =>
          Effect.matchCauseEffect(
            op.f(a),
            Sink.make(
              (cause2) => sink.onFailure(Cause.sequential(a, cause2)),
              Option.match({
                onNone: () => Effect.unit,
                onSome: sink.onFailure
              })
            )
          ),
        sink.onSuccess
      ),
    TapEffect: (op) =>
      Sink.make(
        (a) =>
          Effect.matchCauseEffect(
            Effect.as(op.f(a), a),
            Sink.make((cause2) => sink.onFailure(Cause.sequential(a, cause2)), sink.onFailure)
          ),
        sink.onSuccess
      )
  })
}

export function compileEffectLoop<B, A, C, E2, R2>(
  operator: EffectOperator,
  loop: (b: B, a: A) => Effect.Effect<readonly [C, B], E2, R2>
): (b: B, i: any) => Effect.Effect<Option.Option<readonly [C, B]>, E2, R2> {
  return matchEffectOperator(operator, {
    MapEffect: (op) => (b, i) => Effect.map(Effect.flatMap(op.f(i), (a) => loop(b, a)), Option.some),
    TapEffect: (op) => (b, i) => Effect.map(Effect.flatMap(op.f(i), () => loop(b, i)), Option.some),
    FilterEffect: (op) => (b, i) =>
      Effect.flatMap(op.f(i), (a) => a ? Effect.map(loop(b, i), Option.some) : Effect.succeedNone),
    FilterMapEffect: (op) => (b, i) =>
      Effect.flatMap(
        op.f(i),
        Option.match({
          onNone: () => Effect.succeedNone,
          onSome: (a) => Effect.map(loop(b, a), Option.some)
        })
      )
  })
}

export function compileEffectReducer<B, A, R2, E2>(
  operator: EffectOperator,
  loop: (b: B, a: A) => Effect.Effect<B, E2, R2>
): (b: B, i: any) => Effect.Effect<Option.Option<B>, E2, R2> {
  return matchEffectOperator(operator, {
    MapEffect: (op) => (b, i) => Effect.map(Effect.flatMap(op.f(i), (a) => loop(b, a)), Option.some),
    TapEffect: (op) => (b, i) => Effect.map(Effect.flatMap(op.f(i), () => loop(b, i)), Option.some),
    FilterEffect: (op) => (b, i) =>
      Effect.flatMap(op.f(i), (a) => a ? Effect.map(loop(b, i), Option.some) : Effect.succeedNone),
    FilterMapEffect: (op) => (b, i) =>
      Effect.flatMap(
        op.f(i),
        Option.match({
          onNone: () => Effect.succeedNone,
          onSome: (a) => Effect.map(loop(b, a), Option.some)
        })
      )
  })
}

export function runSyncReduce<A, B, R2, E2>(
  producer: SyncProducer.SyncProducer<A>,
  op: EffectOperator,
  seed: B,
  f: (acc: B, a: any) => B
): Effect.Effect<B, E2, R2> {
  return matchEffectOperator(op, {
    MapEffect: (op) => SyncProducer.runReduceEffect(producer, seed, (acc, a) => Effect.map(op.f(a), (b) => f(acc, b))),
    TapEffect: (op) => SyncProducer.runReduceEffect(producer, seed, (acc, a) => Effect.map(op.f(a), () => f(acc, a))),
    FilterEffect: (op) =>
      SyncProducer.runReduceEffect(producer, seed, (acc, a) => Effect.map(op.f(a), (b) => b ? acc : f(acc, a))),
    FilterMapEffect: (op) =>
      SyncProducer.runReduceEffect(producer, seed, (acc, a) =>
        Effect.map(
          op.f(a),
          Option.match({
            onNone: () => acc,
            onSome: (b) => f(acc, b)
          })
        ))
  })
}
