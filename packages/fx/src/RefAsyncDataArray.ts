import type * as AsyncData from "@typed/async-data/AsyncData"
import type { IdentifierConstructor, IdentifierOf } from "@typed/context/Identifier"
import type * as Computed from "@typed/fx/Computed"
import * as Fx from "@typed/fx/Fx"
import * as RefAsyncData from "@typed/fx/RefAsyncData"
import type { Scope } from "effect"
import type * as Effect from "effect/Effect"
import { dual } from "effect/Function"

export interface RefAsyncDataArray<R, E, A> extends RefAsyncData.RefAsyncData<R, E, ReadonlyArray<A>> {}

export namespace RefAsyncDataArray {
  export interface Tagged<I, E, A> extends RefAsyncData.RefAsyncData.Tagged<I, E, ReadonlyArray<A>> {}
}

export const make = <E, A>(): Effect.Effect<Scope.Scope, never, RefAsyncDataArray<never, E, A>> =>
  RefAsyncData.make<E, ReadonlyArray<A>>()

export const tagged = <E, A>(): {
  <const I extends IdentifierConstructor<any>>(
    identifier: (id: <const T>(uniqueIdentifier: T) => IdentifierConstructor<T>) => I
  ): RefAsyncDataArray.Tagged<IdentifierOf<I>, E, A>
  <const I>(identifier: I | string): RefAsyncDataArray.Tagged<IdentifierOf<I>, E, A>
} => RefAsyncData.tagged<E, ReadonlyArray<A>>()

export const matchKeyed: {
  <
    E1,
    A,
    B,
    NoData extends Fx.FxInput<any, any, any>,
    Loading extends Fx.FxInput<any, any, any>,
    Failure extends Fx.FxInput<any, any, any>,
    Success extends Fx.FxInput<any, any, any>
  >(
    getKey: (a: A) => B,
    matchers: {
      NoData: () => NoData
      Loading: (data: RefAsyncData.LoadingComputed) => Loading
      Failure: (data: Computed.Computed<never, never, E1>, computed: RefAsyncData.FailureComputed<E1>) => Failure
      Success: (value: Computed.Computed<never, never, A>, computed: RefAsyncData.SuccessComputed) => Success
    }
  ): <R, E>(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, ReadonlyArray<A>>>
  ) => Fx.Fx<
    R | Fx.Fx.Context<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    E | Fx.Fx.Error<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    | Fx.Fx.Success<Fx.Fx.FromInput<NoData | Loading | Failure>>
    | ReadonlyArray<Fx.Fx.Success<Fx.Fx.FromInput<Success>>>
  >

  <
    R,
    E,
    E1,
    A,
    B,
    NoData extends Fx.FxInput<any, any, any>,
    Loading extends Fx.FxInput<any, any, any>,
    Failure extends Fx.FxInput<any, any, any>,
    Success extends Fx.FxInput<any, any, any>
  >(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, ReadonlyArray<A>>>,
    getKey: (a: A) => B,
    matchers: {
      NoData: () => NoData
      Loading: (data: RefAsyncData.LoadingComputed) => Loading
      Failure: (data: Computed.Computed<never, never, E1>, computed: RefAsyncData.FailureComputed<E1>) => Failure
      Success: (value: Computed.Computed<never, never, A>, computed: RefAsyncData.SuccessComputed) => Success
    }
  ): Fx.Fx<
    R | Fx.Fx.Context<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    E | Fx.Fx.Error<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    | Fx.Fx.Success<Fx.Fx.FromInput<NoData | Loading | Failure>>
    | ReadonlyArray<Fx.Fx.Success<Fx.Fx.FromInput<Success>>>
  >
} = dual(
  3,
  <
    R,
    E,
    E1,
    A,
    B,
    NoData extends Fx.FxInput<any, any, any>,
    Loading extends Fx.FxInput<any, any, any>,
    Failure extends Fx.FxInput<any, any, any>,
    Success extends Fx.FxInput<any, any, any>
  >(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, ReadonlyArray<A>>>,
    getKey: (a: A) => B,
    matchers: {
      NoData: () => NoData
      Loading: (data: RefAsyncData.LoadingComputed) => Loading
      Failure: (data: Computed.Computed<never, never, E1>, computed: RefAsyncData.FailureComputed<E1>) => Failure
      Success: (value: Computed.Computed<never, never, A>, computed: RefAsyncData.SuccessComputed) => Success
    }
  ): Fx.Fx<
    R | Fx.Fx.Context<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    E | Fx.Fx.Error<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    | Fx.Fx.Success<Fx.Fx.FromInput<NoData | Loading | Failure>>
    | ReadonlyArray<Fx.Fx.Success<Fx.Fx.FromInput<Success>>>
  > => {
    return RefAsyncData.matchKeyed(fx, {
      NoData: matchers.NoData,
      Loading: matchers.Loading,
      Failure: matchers.Failure,
      Success: (ref, computed) => Fx.keyed(ref, getKey, (ref) => matchers.Success(ref, computed))
    }) as any
  }
)
