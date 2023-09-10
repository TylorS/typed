import * as Option from "@effect/data/Option"
import { type Bounds, mergeBounds } from "@typed/fx/internal/bounds"
import * as Fusion from "./fusion"

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
  readonly bounds: Bounds
}

export const Slice = (bounds: Bounds): Slice => ({ _tag: "Slice", bounds })

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
    FilterMap: (op1, op2) => Fusion.Replace(FilterMap((a: any) => op2.f(op1.f(a)))),
    Slice: (_, op2) => Fusion.Commute(op2)
  },
  Filter: {
    Map: (op1, op2) => Fusion.Replace(FilterMap((a: any) => op1.f(a) ? Option.some(op2.f(a)) : Option.none())),
    Filter: (op1, op2) => Fusion.Replace(Filter((a: any) => op1.f(a) && op2.f(a))),
    FilterMap: (op1, op2) => Fusion.Replace(FilterMap((a) => op1.f(a) ? op2.f(a) : Option.none())),
    Slice: (_, op2) => Fusion.Append(op2)
  },
  FilterMap: {
    Map: (op1, op2) => Fusion.Replace(FilterMap((a: any) => Option.map(op1.f(a), op2.f))),
    Filter: (op1, op2) =>
      Fusion.Replace(FilterMap((a: any) => Option.flatMap(op1.f(a), (b) => op2.f(b) ? Option.some(b) : Option.none()))),
    FilterMap: (op1, op2) => Fusion.Replace(FilterMap((a: any) => Option.flatMap(op1.f(a), op2.f))),
    Slice: (_, op2) => Fusion.Append(op2)
  },
  Slice: {
    Map: (_, op2) => Fusion.Append(op2),
    Filter: (_, op2) => Fusion.Append(op2),
    FilterMap: (_, op2) => Fusion.Append(op2),
    Slice: (op1, op2) => Fusion.Replace(Slice(mergeBounds(op1.bounds, op2.bounds)))
  }
}

export function fuseSyncOperators(op1: SyncOperator, op2: SyncOperator): Fusion.FusionDecision<SyncOperator> {
  return SyncOperatorFusionMap[op1._tag][op2._tag](op1 as any, op2 as any)
}
