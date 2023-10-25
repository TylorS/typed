/**
 * A RefRemoteData is a RefSubject that holds a RemoteData value.
 * @since 1.18.0
 */

import * as AsyncData from "@typed/async-data/AsyncData"
import type { IdentifierConstructor, IdentifierOf } from "@typed/context"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Sink from "@typed/fx/Sink"
import { type Duration, Option } from "effect"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import type { Schedule } from "effect/Schedule"

// TODO: Integration with Request
// TODO: Computed types
// TODO: Destructors
// TODO: UI primitives??

/**
 * A RefAsyncData is a RefSubject that holds a AsyncData value.
 * @since 1.18.0
 * @category models
 */
export interface RefAsyncData<R, E, A> extends RefSubject.RefSubject<R, never, AsyncData.AsyncData<E, A>> {}

/**
 * Create a RefRemoteData
 * @since 1.18.0
 * @category constructors
 */
export const make: <E, A>() => Effect.Effect<
  never,
  never,
  RefSubject.RefSubject<never, never, AsyncData.AsyncData<E, A>>
> = <E, A>() => RefSubject.of(AsyncData.noData<E, A>())

/**
 * Create a Tagged RefRemoteData
 * @since 1.18.0
 * @category constructors
 */
export const tagged: <E, A>() => {
  <const I extends IdentifierConstructor<any>>(
    identifier: (id: <const T>(uniqueIdentifier: T) => IdentifierConstructor<T>) => I
  ): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, AsyncData.AsyncData<E, A>>

  <const I>(identifier: I): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, AsyncData.AsyncData<E, A>>
} = <E, A>() => RefSubject.tagged<never, AsyncData.AsyncData<E, A>>()

/**
 * Change the current value of a RefRemoteData to a loading or refreshing state.
 * @since 1.18.0
 * @category updates
 */
export const startLoading: <R, E, A>(
  ref: RefAsyncData<R, E, A>
) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>> = <R, E, A>(ref: RefAsyncData<R, E, A>) =>
  ref.update(AsyncData.startLoading)

/**
 * Change the current value of a RefAsyncData to a non-loading/non-refreshing state.
 * @since 1.18.0
 * @category updates
 */
export const stopLoading: <R, E, A>(
  ref: RefAsyncData<R, E, A>
) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>> = <R, E, A>(ref: RefAsyncData<R, E, A>) =>
  ref.update(AsyncData.stopLoading)

export const run: {
  <R2, E, A>(
    effect: Effect.Effect<R2, E, A>
  ): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>

  <R, E, A, R2>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>
  ): Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>
} = dual(
  2,
  <R, E, A, R2>(ref: RefAsyncData<R, E, A>, effect: Effect.Effect<R2, E, A>) =>
    ref.runUpdate((get, set) =>
      Effect.gen(function*(_) {
        const initial = yield* _(get)

        yield* _(set(AsyncData.startLoading(initial)))
        const exit = yield* _(Effect.exit(effect))
        return yield* _(set(AsyncData.fromExit(exit)))
      }), (current) => Effect.sync(() => AsyncData.stopLoading(current)))
)

export const runIfNoData: {
  <R2, E, A>(
    effect: Effect.Effect<R2, E, A>
  ): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>

  <R, E, A, R2>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>
  ): Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>
} = dual(
  2,
  <R, E, A, R2>(ref: RefAsyncData<R, E, A>, effect: Effect.Effect<R2, E, A>) =>
    ref.runUpdate((get, set) =>
      Effect.gen(function*(_) {
        const initial = yield* _(get)

        if (AsyncData.isNoData(initial) || (AsyncData.isFailure(initial) && Option.isNone(initial.refreshing))) {
          yield* _(set(AsyncData.startLoading(initial)))
          const exit = yield* _(Effect.exit(effect))
          return yield* _(set(AsyncData.fromExit(exit)))
        }

        return initial
      }), (current) => Effect.sync(() => AsyncData.stopLoading(current)))
)

export const runIfOutdated: {
  <R2, E, A>(
    effect: Effect.Effect<R2, E, A>,
    timeToLive: Duration.DurationInput
  ): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>

  <R, E, A, R2>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>,
    timeToLive: Duration.DurationInput
  ): Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>
} = dual(
  3,
  <R, E, A, R2>(ref: RefAsyncData<R, E, A>, effect: Effect.Effect<R2, E, A>, timeToLive: Duration.DurationInput) =>
    ref.runUpdate((get, set) =>
      Effect.gen(function*(_) {
        const initial = yield* _(get)

        if (
          AsyncData.isNoData(initial)
          || ((AsyncData.isFailure(initial) || AsyncData.checkIsOutdated(initial, timeToLive)) &&
            Option.isNone(initial.refreshing))
        ) {
          yield* _(set(AsyncData.startLoading(initial)))
          const exit = yield* _(Effect.exit(effect))
          return yield* _(set(AsyncData.fromExit(exit)))
        }

        return initial
      }), (current) => Effect.sync(() => AsyncData.stopLoading(current)))
)

export const runRepeat: {
  <R2, E, A, R3, X>(
    effect: Effect.Effect<R2, E, A>,
    schedule: Schedule<R3, unknown, X>
  ): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R | R2 | R3, never, AsyncData.AsyncData<E, A>>

  <R, E, A, R2, R3, X>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>,
    schedule: Schedule<R3, unknown, X>
  ): Effect.Effect<R | R2 | R3, never, AsyncData.AsyncData<E, A>>
} = dual(
  3,
  <R, E, A, R2, R3, X>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>,
    schedule: Schedule<R3, unknown, X>
  ) => Effect.repeat(run(ref, effect), schedule)
)

export const runRetry: {
  <R2, E, A, R3, X>(
    effect: Effect.Effect<R2, E, A>,
    schedule: Schedule<R3, unknown, X>
  ): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R | R2 | R3, never, AsyncData.AsyncData<E, A>>

  <R, E, A, R2, R3, X>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>,
    schedule: Schedule<R3, unknown, X>
  ): Effect.Effect<R | R2 | R3, never, AsyncData.AsyncData<E, A>>
} = dual(
  3,
  <R, E, A, R2, R3, X>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>,
    schedule: Schedule<R3, unknown, X>
  ) => Effect.retry(run(ref, effect), schedule)
)

export const runRetryN: {
  <R2, E, A>(
    effect: Effect.Effect<R2, E, A>,
    amount: number
  ): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>

  <R, E, A, R2>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>,
    amount: number
  ): Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>
} = dual(
  3,
  <R, E, A, R2>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>,
    amount: number
  ) => Effect.retryN(run(ref, effect), amount)
)

export const awaitLoading = <R, E, A>(
  data: RefAsyncData<R, E, A>
): Effect.Effect<R, never, AsyncData.AsyncData<E, A>> =>
  data.pipe(
    Fx.dropWhile((data) => Effect.succeed(AsyncData.isLoading(data))),
    Fx.take(1),
    Fx.toReadonlyArray,
    Effect.map((x) => x[0])
  )

export const awaitLoadingOrRefreshing = <R, E, A>(
  data: RefAsyncData<R, E, A>
): Effect.Effect<R, never, AsyncData.AsyncData<E, A>> =>
  data.pipe(
    Fx.dropWhile((data) => Effect.succeed(AsyncData.isLoadingOrRefreshing(data))),
    Fx.take(1),
    Fx.toReadonlyArray,
    Effect.map((x) => x[0])
  )

export const asSink = <R, E, A>(ref: RefAsyncData<R, E, A>): Sink.WithContext<R, E, A> =>
  Sink.WithContext((cause) => ref.set(AsyncData.failCause(cause)), (a) => ref.set(AsyncData.success(a)))
