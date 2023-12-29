/**
 * @since 1.0.0
 */
import type * as AsyncData from "@typed/async-data/AsyncData"
import * as RefAsyncData from "@typed/fx/AsyncData"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import type { Scope } from "effect"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import type { NoInfer } from "effect/Types"
import { RenderContext } from "./RenderContext.js"
import { type RenderEvent } from "./RenderEvent.js"

/**
 * @since 1.0.0
 */
export function many<R, E, A, B extends PropertyKey, R2, E2>(
  values: Fx.Fx<R, E, ReadonlyArray<A>>,
  getKey: (a: NoInfer<A>) => B,
  f: (a: RefSubject.RefSubject<never, never, NoInfer<A>>, key: B) => Fx.Fx<R2, E2, RenderEvent>
): Fx.Fx<R | R2 | Scope.Scope | RenderContext, E | E2, RenderEvent | ReadonlyArray<RenderEvent>> {
  return Fx.fromFxEffect(
    RenderContext.with(
      (ctx): Fx.Fx<R | R2 | RenderContext | Scope.Scope, E | E2, RenderEvent | ReadonlyArray<RenderEvent>> => {
        if (ctx.environment === "server" || ctx.environment === "static") {
          return Fx.fromFxEffect(
            Effect.map(Fx.first(values), (values) =>
              Fx.mergeOrdered(
                values.map((value) => Fx.fromFxEffect(Effect.map(RefSubject.of(value), (ref) => f(ref, getKey(value)))))
              ))
          )
        }

        return Fx.keyed(values, {
          getKey,
          onValue: f
        })
      }
    )
  )
}

type TODO = any

/**
 * @since 1.0.0
 */
export const manyAsyncData: {
  <
    E1,
    A,
    B extends PropertyKey,
    NoData extends Fx.Fx<any, any, any>,
    Loading extends Fx.Fx<any, any, any>,
    Failure extends Fx.Fx<any, any, any>,
    Success extends Fx.Fx<any, any, any>
  >(
    getKey: (a: A) => B,
    matchers: {
      NoData: () => NoData
      Loading: (todo: TODO) => Loading
      Failure: (data: RefSubject.Computed<never, never, E1>, computed: TODO) => Failure
      Success: (value: RefSubject.Computed<never, never, A>, computed: TODO) => Success
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
    B extends PropertyKey,
    NoData extends Fx.Fx<any, any, any>,
    Loading extends Fx.Fx<any, any, any>,
    Failure extends Fx.Fx<any, any, any>,
    Success extends Fx.Fx<any, any, any>
  >(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, ReadonlyArray<A>>>,
    getKey: (a: A) => B,
    matchers: {
      NoData: () => NoData
      Loading: (data: TODO) => Loading
      Failure: (data: RefSubject.Computed<never, never, E1>, computed: TODO) => Failure
      Success: (value: RefSubject.Computed<never, never, A>, computed: TODO) => Success
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
    B extends PropertyKey,
    NoData extends Fx.Fx<any, any, RenderEvent>,
    Loading extends Fx.Fx<any, any, RenderEvent>,
    Failure extends Fx.Fx<any, any, RenderEvent>,
    Success extends Fx.Fx<any, any, RenderEvent>
  >(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, ReadonlyArray<A>>>,
    getKey: (a: A) => B,
    matchers: {
      NoData: NoData
      Loading: (data: TODO) => Loading
      Failure: (data: RefSubject.Computed<never, never, E1>, computed: TODO) => Failure
      Success: (value: RefSubject.Computed<never, never, A>, computed: TODO) => Success
    }
  ): Fx.Fx<
    R | Fx.Fx.Context<NoData | Loading | Failure | Success>,
    E | Fx.Fx.Error<NoData | Loading | Failure | Success>,
    Fx.Fx.Success<NoData | Loading | Failure | Success>
  > => {
    return RefAsyncData.matchAsyncData(fx, {
      NoData: matchers.NoData,
      Loading: matchers.Loading,
      Failure: matchers.Failure,
      Success: (ref, computed) => many(ref, getKey, (ref) => matchers.Success(ref, computed))
    }) as any
  }
)
