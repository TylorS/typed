import * as AsyncData from "@typed/async-data/AsyncData"
import type { IdentifierConstructor, IdentifierOf } from "@typed/context/Identifier"
import type * as Computed from "@typed/fx/Computed"
import type * as Filtered from "@typed/fx/Filtered"
import * as Fx from "@typed/fx/Fx"
import * as RefAsyncData from "@typed/fx/RefAsyncData"
import type { RefSubject } from "@typed/fx/RefSubject"
import type { Effect } from "effect/Effect"
import { dual } from "effect/Function"

export interface RefAsyncDataArray<R, E, A> extends RefAsyncData.RefAsyncData<R, E, ReadonlyArray<A>> {}

export namespace RefAsyncDataArray {
  export interface Tagged<I, E, A> extends RefAsyncData.RefAsyncData.Tagged<I, E, ReadonlyArray<A>> {}
}

export const make = <E, A>(): Effect<never, never, RefAsyncDataArray<never, E, A>> =>
  RefAsyncData.make<E, ReadonlyArray<A>>()

export const tagged = <E, A>(): {
  <const I extends IdentifierConstructor<any>>(
    identifier: (id: <const T>(uniqueIdentifier: T) => IdentifierConstructor<T>) => I
  ): RefSubject.Tagged<IdentifierOf<I>, never, AsyncData.AsyncData<E, ReadonlyArray<A>>>
  <const I>(identifier: I): RefSubject.Tagged<IdentifierOf<I>, never, AsyncData.AsyncData<E, ReadonlyArray<A>>>
} => RefAsyncData.tagged<E, ReadonlyArray<A>>()

export const matchKeyed: {
  <
    E1,
    A,
    NoData extends Fx.FxInput<any, any, any>,
    Loading extends Fx.FxInput<any, any, any>,
    Failure extends Fx.FxInput<any, any, any>,
    Success extends Fx.FxInput<any, any, any>,
    B
  >(
    matchers: {
      NoData: () => NoData
      Loading: (data: RefAsyncData.LoadingComputed) => Loading
      Failure: (data: Filtered.Filtered<never, never, E1>, computed: RefAsyncData.FailureComputed<E1>) => Failure
      Success: (value: Computed.Computed<never, never, A>, computed: RefAsyncData.SuccessComputed) => Success
    },
    getKey: (a: A) => B
  ): <R, E>(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, ReadonlyArray<A>>>
  ) => Fx.Fx<
    R | Fx.Fx.Context<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    E | Fx.Fx.Error<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    Fx.Fx.Success<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>
  >

  <
    R,
    E,
    E1,
    A,
    NoData extends Fx.FxInput<any, any, any>,
    Loading extends Fx.FxInput<any, any, any>,
    Failure extends Fx.FxInput<any, any, any>,
    Success extends Fx.FxInput<any, any, any>,
    B
  >(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, ReadonlyArray<A>>>,
    matchers: {
      NoData: () => NoData
      Loading: (data: RefAsyncData.LoadingComputed) => Loading
      Failure: (data: Filtered.Filtered<never, never, E1>, computed: RefAsyncData.FailureComputed<E1>) => Failure
      Success: (value: Computed.Computed<never, never, A>, computed: RefAsyncData.SuccessComputed) => Success
    },
    getKey: (a: A) => B
  ): Fx.Fx<
    R | Fx.Fx.Context<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    E | Fx.Fx.Error<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    Fx.Fx.Success<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>
  >
} = dual(
  3,
  <
    R,
    E,
    E1,
    A,
    NoData extends Fx.FxInput<any, any, any>,
    Loading extends Fx.FxInput<any, any, any>,
    Failure extends Fx.FxInput<any, any, any>,
    Success extends Fx.FxInput<any, any, any>,
    B
  >(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, ReadonlyArray<A>>>,
    matchers: {
      NoData: (data: RefAsyncData.NoDataComputed) => NoData
      Loading: (data: RefAsyncData.LoadingComputed) => Loading
      Failure: (data: Filtered.Filtered<never, never, E1>, computed: RefAsyncData.FailureComputed<E1>) => Failure
      Success: (value: Computed.Computed<never, never, A>, computed: RefAsyncData.SuccessComputed) => Success
    },
    getKey: (a: A) => B
  ): Fx.Fx<
    R | Fx.Fx.Context<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    E | Fx.Fx.Error<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    ReadonlyArray<Fx.Fx.Success<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>>
  > => {
    return Fx.matchTags(fx, {
      NoData: (ref) => matchers.NoData({ timestamp: ref.map((r) => r.timestamp) }),
      Loading: (ref) =>
        matchers.Loading({
          timestamp: ref.map((r) => r.timestamp),
          progress: ref.filterMap((r) => r.progress)
        }),
      Failure: (ref) =>
        matchers.Failure(
          ref.filterMap(AsyncData.getFailure),
          {
            cause: ref.map((r) => r.cause),
            timestamp: ref.map((r) => r.timestamp),
            refreshing: ref.filterMap((r) => r.refreshing)
          }
        ),
      Success: (ref) => {
        const computed = {
          timestamp: ref.map((r) => r.timestamp),
          refreshing: ref.filterMap((r) => r.refreshing)
        }

        return Fx.keyed(ref.map((r) => r.value), (ref) => matchers.Success(ref, computed), getKey)
      }
    }) as any
  }
)
