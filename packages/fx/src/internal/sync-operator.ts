import * as ReadonlyArray from "effect/ReadonlyArray"

import * as Effect from "effect/Effect"
import { flow } from "effect/Function"
import * as Option from "effect/Option"
import * as Sink from "../Sink.js"
import * as SyncProducer from "./sync-producer.js"

// Sync operators are a subset of operators which can be safely fused together synchronously

export type SyncOperator =
  | Map<any, any>
  | Filter<any>
  | FilterMap<any, any>

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

type SyncOperatorFusionMap = {
  readonly [K in SyncOperator["_tag"]]: {
    readonly [K2 in SyncOperator["_tag"]]: (
      op1: Extract<SyncOperator, { readonly _tag: K }>,
      op2: Extract<SyncOperator, { readonly _tag: K2 }>
    ) => SyncOperator
  }
}

const SyncOperatorFusionMap: SyncOperatorFusionMap = {
  Map: {
    Map: (op1, op2) => Map(flow(op1.f, op2.f)),
    Filter: (op1, op2) =>
      FilterMap((a: any) => {
        const b = op1.f(a)
        return op2.f(b) ? Option.some(b) : Option.none()
      }),
    FilterMap: (op1, op2) => FilterMap(flow(op1.f, op2.f))
  },
  Filter: {
    Map: (op1, op2) => FilterMap((a: any) => op1.f(a) ? Option.some(op2.f(a)) : Option.none()),
    Filter: (op1, op2) => Filter((a: any) => op1.f(a) && op2.f(a)),
    FilterMap: (op1, op2) => FilterMap((a) => op1.f(a) ? op2.f(a) : Option.none())
  },
  FilterMap: {
    Map: (op1, op2) => FilterMap((a: any) => Option.map(op1.f(a), op2.f)),
    Filter: (op1, op2) =>
      FilterMap((a: any) => Option.flatMap(op1.f(a), (b) => op2.f(b) ? Option.some(b) : Option.none())),
    FilterMap: (op1, op2) => FilterMap((a: any) => Option.flatMap(op1.f(a), op2.f))
  }
}

export function fuseSyncOperators(op1: SyncOperator, op2: SyncOperator): SyncOperator {
  return SyncOperatorFusionMap[op1._tag][op2._tag](op1 as any, op2 as any)
}

export function matchSyncOperator<A>(operator: SyncOperator, matchers: {
  readonly Map: (f: Map<any, any>) => A
  readonly Filter: (f: Filter<any>) => A
  readonly FilterMap: (f: FilterMap<any, any>) => A
}): A {
  return matchers[operator._tag](operator as any)
}

export function compileSyncOperatorSink<R>(
  operator: SyncOperator,
  sink: Sink.Sink<any, any, R>
): Sink.Sink<any, any, R> {
  return matchSyncOperator(operator, {
    Map: (op) => Sink.map(sink, op.f),
    Filter: (op) => Sink.filter(sink, op.f),
    FilterMap: (op) => Sink.filterMap(sink, op.f)
  })
}

export function compileCauseSyncOperatorSink<R>(
  operator: SyncOperator,
  sink: Sink.Sink<any, any, R>
): Sink.Sink<any, any, R> {
  return matchSyncOperator(operator, {
    Map: (op) => Sink.make((a) => sink.onFailure(op.f(a)), sink.onSuccess),
    Filter: (op) => Sink.make((a) => op.f(a) ? sink.onFailure(a) : Effect.unit, sink.onSuccess),
    FilterMap: (op) =>
      Sink.make((a) =>
        Option.match(op.f(a), {
          onNone: () => Effect.unit,
          onSome: sink.onFailure
        }), sink.onSuccess)
  })
}

export function compileSyncReducer<A, B, C>(
  operator: SyncOperator,
  f: (b: B, a: A) => C
): (b: B, a: any) => Option.Option<C> {
  return matchSyncOperator(operator, {
    Map: (op) => (b, a) => Option.some(f(b, op.f(a))),
    Filter: (op) => (b, a) => op.f(a) ? Option.some(f(b, a)) : Option.none(),
    FilterMap: (op) => (b, i) => Option.map(op.f(i), (a) => f(b, a))
  })
}

export function applyArray<A, B>(array: ReadonlyArray<A>, operator: SyncOperator): ReadonlyArray<B> {
  return matchSyncOperator(operator, {
    Map: (op) => ReadonlyArray.map(array, op.f),
    Filter: (op) => ReadonlyArray.filter(array, op.f),
    FilterMap: (op) => ReadonlyArray.filterMap(array, op.f)
  })
}

export function applyArrayReducer<A, B>(
  array: Iterable<any>,
  operator: SyncOperator,
  seed: B,
  f: (acc: B, a: A) => B
): B {
  return matchSyncOperator(operator, {
    Map: (op) => ReadonlyArray.reduce(array, seed, (b, a) => f(b, op.f(a))),
    Filter: (op) => ReadonlyArray.reduce(array, seed, (b, a) => op.f(a) ? f(b, a) : b),
    FilterMap: (op) =>
      ReadonlyArray.reduce(array, seed, (b, a) => {
        const o = op.f(a)
        if (Option.isSome(o)) return f(b, o.value)
        else return b
      })
  })
}

export function runSyncReduce<A, B>(
  producer: SyncProducer.SyncProducer<A>,
  op: SyncOperator,
  seed: B,
  f: (acc: B, a: any) => B
): B {
  return SyncProducer.matchSyncProducer(producer, {
    Success: (a) =>
      matchSyncOperator(op, {
        Map: (op) => f(seed, op.f(a)),
        Filter: (op) => op.f(a) ? f(seed, a) : seed,
        FilterMap: (op) =>
          Option.match(op.f(a), {
            onNone: () => seed,
            onSome: (a) => f(seed, a)
          })
      }),
    FromSync: (g) => f(seed, g()),
    FromArray: (array) => applyArrayReducer(array, op, seed, f),
    FromIterable: (iterable) => applyArrayReducer(iterable, op, seed, f)
  })
}
