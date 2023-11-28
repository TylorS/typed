/**
 * @since 1.0.0
 */
import type * as AsyncData from "@typed/async-data/AsyncData"
import type * as Computed from "@typed/fx/Computed"
import * as Fx from "@typed/fx/Fx"
import * as RefAsyncData from "@typed/fx/RefAsyncData"
import * as RefSubject from "@typed/fx/RefSubject"
import { makeHold } from "@typed/fx/Subject"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import { RenderContext } from "./RenderContext.js"
import { type RenderEvent } from "./RenderEvent.js"

/**
 * @since 1.0.0
 */
export function many<R, E, A, B, R2, E2>(
  values: Fx.Fx<R, E, ReadonlyArray<A>>,
  getKey: (a: A) => B,
  f: (a: RefSubject.RefSubject<never, never, A>, key: B) => Fx.Fx<R2, E2, RenderEvent>
): Fx.Fx<R | R2 | RenderContext, E | E2, RenderEvent | ReadonlyArray<RenderEvent>> {
  return Fx.fromFxEffect(
    RenderContext.with((ctx): Fx.Fx<R | R2 | RenderContext, E | E2, RenderEvent | ReadonlyArray<RenderEvent>> => {
      if (ctx.environment === "browser") {
        return Fx.keyed(values, getKey, f)
      }

      return Fx.fromFxEffect(
        Effect.map(Fx.first(values), (values) =>
          values._tag === "None" ? Fx.empty : Fx.mergeBuffer(
            values.value.map((value) => {
              const ref = RefSubject.unsafeMake(Effect.succeed(value), makeHold())

              return f({ ...ref, ...Fx.take(ref, 1) } as RefSubject.RefSubject<never, never, A>, getKey(value))
            })
          ))
      )
    })
  )
}

/**
 * @since 1.0.0
 */
export const manyAsyncData: {
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
    R | Fx.Fx.Context<NoData | Loading | Failure | Success>,
    E | Fx.Fx.Error<NoData | Loading | Failure | Success>,
    Fx.Fx.Success<NoData | Loading | Failure | Success>
  >

  <
    R,
    E,
    E1,
    A,
    B,
    NoData extends Fx.Fx<any, any, any>,
    Loading extends Fx.Fx<any, any, any>,
    Failure extends Fx.Fx<any, any, any>,
    Success extends Fx.Fx<any, any, any>
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
    R | Fx.Fx.Context<NoData | Loading | Failure | Success>,
    E | Fx.Fx.Error<NoData | Loading | Failure | Success>,
    Fx.Fx.Success<NoData | Loading | Failure | Success>
  >
} = dual(
  3,
  <
    R,
    E,
    E1,
    A,
    NoData extends Fx.Fx<any, any, RenderEvent>,
    Loading extends Fx.Fx<any, any, RenderEvent>,
    Failure extends Fx.Fx<any, any, RenderEvent>,
    Success extends Fx.Fx<any, any, RenderEvent>,
    B
  >(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, ReadonlyArray<A>>>,
    matchers: {
      NoData: () => NoData
      Loading: (data: RefAsyncData.LoadingComputed) => Loading
      Failure: (data: Computed.Computed<never, never, E1>, computed: RefAsyncData.FailureComputed<E1>) => Failure
      Success: (value: Computed.Computed<never, never, A>, computed: RefAsyncData.SuccessComputed) => Success
    },
    getKey: (a: A) => B
  ): Fx.Fx<
    R | Fx.Fx.Context<NoData | Loading | Failure | Success>,
    E | Fx.Fx.Error<NoData | Loading | Failure | Success>,
    Fx.Fx.Success<NoData | Loading | Failure | Success>
  > => {
    return RefAsyncData.matchKeyed(fx, {
      NoData: matchers.NoData,
      Loading: matchers.Loading,
      Failure: matchers.Failure,
      Success: (ref, computed) => many(ref, getKey, (ref) => matchers.Success(ref, computed))
    }) as any
  }
)
