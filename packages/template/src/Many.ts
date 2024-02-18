/**
 * @since 1.0.0
 */
import type * as AsyncData from "@typed/async-data/AsyncData"
import type { Progress } from "@typed/async-data/Progress"
import * as RefAsyncData from "@typed/fx/AsyncData"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import type { Scope } from "effect"
import { get, getOption } from "effect/Context"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import { isSome } from "effect/Option"
import type { NoInfer } from "effect/Types"
import { HydrateContext } from "./internal/HydrateContext.js"
import { MANY_HOLE } from "./Meta.js"
import { RenderContext } from "./RenderContext.js"
import { HtmlRenderEvent, type RenderEvent } from "./RenderEvent.js"

/**
 * @since 1.0.0
 */
export function many<A, E, R, B extends PropertyKey, R2, E2>(
  values: Fx.Fx<ReadonlyArray<A>, E, R>,
  getKey: (a: NoInfer<A>) => B,
  f: (a: RefSubject.RefSubject<NoInfer<A>>, key: B) => Fx.Fx<RenderEvent, E2, R2>
): Fx.Fx<RenderEvent | ReadonlyArray<RenderEvent>, E | E2, R | R2 | Scope.Scope | RenderContext> {
  return Fx.fromFxEffect(
    Effect.contextWith(
      (context): Fx.Fx<RenderEvent | ReadonlyArray<RenderEvent>, E | E2, R | R2 | RenderContext | Scope.Scope> => {
        const ctx = get(context, RenderContext)
        const hydrateContext = getOption(context, HydrateContext)

        // When rendering HTML, we want to ensure that we order our HTML events in the same order
        // as the templates are defined which is why we use mergeOrdered. We also want to ensure that
        // our templates end, so we take only the first of our source values and also ensure that a subscription
        // to our RefSubjects only include its first event.
        if (ctx.environment === "server" || ctx.environment === "static") {
          return Fx.fromFxEffect(
            Effect.map(Fx.first(values), (values) =>
              Fx.mergeOrdered(
                values.map((value) =>
                  Fx.fromFxEffect(Effect.map(RefSubject.of(value), (ref) => {
                    const key = getKey(value)
                    return Fx.append(f(RefSubject.take(ref, 1), key), HtmlRenderEvent(MANY_HOLE(key)))
                  }))
                )
              ))
          )
        }

        // If we're hydrating, attempt to provide the correct HydrateContext to rendering Fx
        if (isSome(hydrateContext) && hydrateContext.value.hydrate) {
          return Fx.keyed(values, {
            getKey,
            onValue: (ref, key) =>
              Fx.provideService(f(ref, key), HydrateContext, { ...hydrateContext.value, manyIndex: key.toString() })
          })
        }

        // In other environments we just used Fx.keyed to allow indefinite subscriptions to RefSubjects
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
      Failure: (data: RefSubject.Computed<E1>, computed: TODO) => Failure
      Success: (value: RefSubject.Computed<A>, computed: TODO) => Success
    }
  ): <E, R>(
    fx: Fx.Fx<AsyncData.AsyncData<ReadonlyArray<A>, E1>, E, R>
  ) => Fx.Fx<
    Fx.Fx.Success<NoData | Loading | Failure | Success>,
    E | Fx.Fx.Error<NoData | Loading | Failure | Success>,
    R | Fx.Fx.Context<NoData | Loading | Failure | Success>
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
    fx: Fx.Fx<AsyncData.AsyncData<ReadonlyArray<A>, E1>, E, R>,
    getKey: (a: A) => B,
    matchers: {
      NoData: () => NoData
      Loading: (data: TODO) => Loading
      Failure: (data: RefSubject.Computed<E1>, computed: TODO) => Failure
      Success: (value: RefSubject.Computed<A>, computed: TODO) => Success
    }
  ): Fx.Fx<
    Fx.Fx.Success<NoData | Loading | Failure | Success>,
    E | Fx.Fx.Error<NoData | Loading | Failure | Success>,
    R | Fx.Fx.Context<NoData | Loading | Failure | Success>
  >
} = dual(
  3,
  <
    R,
    E,
    E1,
    A,
    B extends PropertyKey,
    NoData extends Fx.Fx<RenderEvent, any, any>,
    Loading extends Fx.Fx<RenderEvent, any, any>,
    Failure extends Fx.Fx<RenderEvent, any, any>,
    Success extends Fx.Fx<RenderEvent, any, any>
  >(
    fx: Fx.Fx<AsyncData.AsyncData<ReadonlyArray<A>, E1>, E, R>,
    getKey: (a: A) => B,
    matchers: {
      NoData: NoData
      Loading: (data: RefSubject.Filtered<Progress>) => Loading
      Failure: (data: RefSubject.Computed<E1>) => Failure
      Success: (value: RefSubject.Computed<A>, key: B) => Success
    }
  ): Fx.Fx<
    RenderEvent | ReadonlyArray<RenderEvent>,
    E | Fx.Fx.Error<NoData | Loading | Failure | Success>,
    R | Fx.Fx.Context<NoData | Loading | Failure | Success>
  > => {
    return RefAsyncData.matchAsyncData(fx, {
      NoData: matchers.NoData,
      Loading: matchers.Loading,
      Failure: matchers.Failure,
      Success: (ref) => many(ref, getKey, matchers.Success)
    })
  }
)
