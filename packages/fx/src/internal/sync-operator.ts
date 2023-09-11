import * as Option from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import { WithContext } from "@typed/fx/internal/sink"
import * as Fusion from "./fusion"

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
    ) => Fusion.FusionDecision<SyncOperator>
  }
}

const SyncOperatorFusionMap: SyncOperatorFusionMap = {
  Map: {
    Map: (op1, op2) => Fusion.Replace(Map((a: any) => op2.f(op1.f(a)))),
    Filter: (op1, op2) =>
      Fusion.Replace(FilterMap((a: any) => {
        const b = op1.f(a)
        return op2.f(b) ? Option.some(b) : Option.none()
      })),
    FilterMap: (op1, op2) => Fusion.Replace(FilterMap((a: any) => op2.f(op1.f(a))))
  },
  Filter: {
    Map: (op1, op2) => Fusion.Replace(FilterMap((a: any) => op1.f(a) ? Option.some(op2.f(a)) : Option.none())),
    Filter: (op1, op2) => Fusion.Replace(Filter((a: any) => op1.f(a) && op2.f(a))),
    FilterMap: (op1, op2) => Fusion.Replace(FilterMap((a) => op1.f(a) ? op2.f(a) : Option.none()))
  },
  FilterMap: {
    Map: (op1, op2) => Fusion.Replace(FilterMap((a: any) => Option.map(op1.f(a), op2.f))),
    Filter: (op1, op2) =>
      Fusion.Replace(FilterMap((a: any) => Option.flatMap(op1.f(a), (b) => op2.f(b) ? Option.some(b) : Option.none()))),
    FilterMap: (op1, op2) => Fusion.Replace(FilterMap((a: any) => Option.flatMap(op1.f(a), op2.f)))
  }
}

export function fuseSyncOperators(op1: SyncOperator, op2: SyncOperator): Fusion.FusionDecision<SyncOperator> {
  return SyncOperatorFusionMap[op1._tag][op2._tag](op1 as any, op2 as any)
}

export function matchSyncOperator<A>(operator: SyncOperator, matchers: {
  readonly Map: (f: Map<any, any>) => A
  readonly Filter: (f: Filter<any>) => A
  readonly FilterMap: (f: FilterMap<any, any>) => A
}): A {
  switch (operator._tag) {
    case "Map":
      return matchers.Map(operator)
    case "Filter":
      return matchers.Filter(operator)
    case "FilterMap":
      return matchers.FilterMap(operator)
  }
}

export function compileSyncOperatorSink<R>(
  operator: SyncOperator,
  sink: WithContext<R, any, any>
): WithContext<R, any, any> {
  return matchSyncOperator(operator, {
    Map: (op) => WithContext(sink.onFailure, (a) => sink.onSuccess(op.f(a))),
    Filter: (op) => WithContext(sink.onFailure, (a) => op.f(a) ? sink.onSuccess(a) : Effect.unit),
    FilterMap: (op) =>
      WithContext(sink.onFailure, (a) =>
        Option.match(op.f(a), {
          onNone: () => Effect.unit,
          onSome: sink.onSuccess
        }))
  })
}

export function compileSyncLoop<A, B, C>(
  operator: SyncOperator,
  f: (b: B, a: A) => readonly [C, B]
): (b: B, a: any) => Option.Option<readonly [C, B]> {
  return matchSyncOperator(operator, {
    Map: (op) => (b, a) => Option.some(f(b, op.f(a))),
    Filter: (op) => (b, a) => op.f(a) ? Option.some(f(b, a)) : Option.none(),
    FilterMap: (op) => (b, i) => Option.map(op.f(i), (a) => f(b, a))
  })
}
