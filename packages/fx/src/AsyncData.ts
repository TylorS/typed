/**
 * AsyncData integrations with Fx.
 * @since 1.20.0
 */

import * as AsyncData from "@typed/async-data/AsyncData"
import type { Progress } from "@typed/async-data/Progress"
import * as Cause from "effect/Cause"
import type * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import type * as Exit from "effect/Exit"
import { dual } from "effect/Function"
import type * as Scope from "effect/Scope"
import * as Fx from "./Fx.js"
import * as RefSubject from "./RefSubject.js"
import * as Sink from "./Sink.js"
import { RefSubjectTypeId } from "./TypeId.js"

/**
 * @since 1.20.0
 */
export function asyncDataRequest<R, E, A>(effect: Effect.Effect<R, E, A>): Fx.Fx<R, never, AsyncData.AsyncData<E, A>> {
  return Fx.make((sink) =>
    Effect.flatMap(
      Effect.zipRight(sink.onSuccess(AsyncData.loading()), Effect.exit(effect)),
      (exit) => sink.onSuccess(AsyncData.fromExit(exit))
    )
  )
}

/**
 * @since 1.20.0
 */
export interface RefAsyncData<R, E, A> extends RefSubject.RefSubject<R, never, AsyncData.AsyncData<E, A>> {}

/**
 * @since 1.20.0
 */
export const runAsyncData: {
  <R2, E, A>(
    effect: Effect.Effect<R2, E, A>
  ): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>
  <R, E, A, R2>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>
  ): Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>
} = dual(2, function runAsyncData<R, E, A, R2>(
  ref: RefAsyncData<R, E, A>,
  effect: Effect.Effect<R2, E, A>
): Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>> {
  return ref.runUpdates(({ get, set }) =>
    Effect.uninterruptibleMask((restore) =>
      Effect.flatMap(
        Effect.flatMap(
          Effect.flatMap(get, (current) => set(AsyncData.startLoading(current))),
          () => Effect.exit(restore(effect))
        ),
        (exit) => set(AsyncData.fromExit(exit))
      )
    )
  )
})

/**
 * @since 1.20.0
 */
export const matchAsyncData: {
  <E1, A, R2, E2, B, R3, E3, C, R4, E4, D, R5, E5, F>(
    matchers: {
      readonly NoData: Fx.Fx<R2, E2, B>
      readonly Loading: (progress: RefSubject.Filtered<never, never, Progress>) => Fx.Fx<R3, E3, C>
      readonly Failure: (error: RefSubject.Computed<never, never, E1>) => Fx.Fx<R4, E4, D>
      readonly Success: (value: RefSubject.RefSubject<never, never, A>) => Fx.Fx<R5, E5, F>
    }
  ): <R, E>(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, A>>
  ) => Fx.Fx<R | R2 | R3 | R4 | R5, E | E2 | E3 | E4 | E5, B | C | D | F>

  <R, E, E1, A, R2, E2, B, R3, E3, C, R4, E4, D, R5, E5, F>(fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, A>>, matchers: {
    readonly NoData: Fx.Fx<R2, E2, B>
    readonly Loading: (progress: RefSubject.Filtered<never, never, Progress>) => Fx.Fx<R3, E3, C>
    readonly Failure: (error: RefSubject.Computed<never, never, E1>) => Fx.Fx<R4, E4, D>
    readonly Success: (value: RefSubject.RefSubject<never, never, A>) => Fx.Fx<R5, E5, F>
  }): Fx.Fx<R | R2 | R3 | R4 | R5, E | E2 | E3 | E4 | E5, B | C | D | F>
} = dual(2, function matchAsyncData<R, E, E1, A, R2, E2, B, R3, E3, C, R4, E4, D, R5, E5, F>(
  fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, A>>,
  matchers: {
    readonly NoData: Fx.Fx<R2, E2, B>
    readonly Loading: (progress: RefSubject.Filtered<never, never, Progress>) => Fx.Fx<R3, E3, C>
    readonly Failure: (
      error: RefSubject.Computed<never, never, E1>,
      failure: RefSubject.RefSubject<never, never, AsyncData.Failure<E1>>
    ) => Fx.Fx<R4, E4, D>
    readonly Success: (
      value: RefSubject.RefSubject<never, never, A>,
      data: RefSubject.RefSubject<never, never, AsyncData.Success<A> | AsyncData.Optimistic<E1, A>>
    ) => Fx.Fx<R5, E5, F>
  }
): Fx.Fx<R | R2 | R3 | R4 | R5, E | E2 | E3 | E4 | E5, B | C | D | F> {
  return Fx.withKey(
    fx,
    {
      getKey: (a: AsyncData.AsyncData<E1, A>) => a._tag === "Optimistic" ? "Success" : a._tag,
      onValue: (ref, key): Fx.Fx<R | R2 | R3 | R4 | R5, E | E2 | E3 | E4 | E5, B | C | D | F> => {
        switch (key) {
          case "NoData":
            return matchers.NoData
          case "Loading":
            return matchers.Loading(
              RefSubject.filterMap(ref as RefSubject.RefSubject<never, never, AsyncData.Loading>, (l) => l.progress)
            )
          case "Failure": {
            const failure = ref as RefSubject.RefSubject<never, never, AsyncData.Failure<E1>>
            return matchers.Failure(
              RefSubject.mapEffect(
                failure,
                (f) =>
                  Either.match(Cause.failureOrCause(f.cause), {
                    onLeft: Effect.succeed,
                    onRight: Effect.failCause
                  })
              ),
              failure
            )
          }
          case "Success": {
            const success = ref as RefSubject.RefSubject<
              never,
              never,
              AsyncData.Success<A> | AsyncData.Optimistic<E1, A>
            >

            return matchers.Success(
              RefSubject.transformOrFail(
                success,
                (s) => Effect.succeed(s.value),
                (value) =>
                  Effect.map(
                    success,
                    (d) => AsyncData.map(d, () => value) as AsyncData.Success<A> | AsyncData.Optimistic<E1, A>
                  )
              ),
              success
            )
          }
        }
      }
    }
  )
})

/**
 * @since 1.20.0
 */
export const matchAsyncDataArray: {
  <E1, A, K extends PropertyKey, R2, E2, B, R3, E3, C, R4, E4, D, R5, E5, F>(
    getKey: (a: A) => K,
    matchers: {
      readonly NoData: Fx.Fx<R2, E2, B>
      readonly Loading: (progress: RefSubject.Filtered<never, never, Progress>) => Fx.Fx<R3, E3, C>
      readonly Failure: (error: RefSubject.Computed<never, never, E1>) => Fx.Fx<R4, E4, D>
      readonly Success: (value: RefSubject.RefSubject<never, never, A>, key: K) => Fx.Fx<R5, E5, F>
    }
  ): <R, E>(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, ReadonlyArray<A>>>
  ) => Fx.Fx<Scope.Scope | R | R2 | R3 | R4 | R5, E | E2 | E3 | E4 | E5, B | C | D | ReadonlyArray<F>>

  <R, E, E1, A, K extends PropertyKey, R2, E2, B, R3, E3, C, R4, E4, D, R5, E5, F>(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, ReadonlyArray<A>>>,
    getKey: (a: A) => K,
    matchers: {
      readonly NoData: Fx.Fx<R2, E2, B>
      readonly Loading: (progress: RefSubject.Filtered<never, never, Progress>) => Fx.Fx<R3, E3, C>
      readonly Failure: (error: RefSubject.Computed<never, never, E1>) => Fx.Fx<R4, E4, D>
      readonly Success: (value: RefSubject.RefSubject<never, never, A>, key: K) => Fx.Fx<R5, E5, F>
    }
  ): Fx.Fx<Scope.Scope | R | R2 | R3 | R4 | R5, E | E2 | E3 | E4 | E5, B | C | D | ReadonlyArray<F>>
} = dual(
  3,
  function matchAsyncDataArray<R, E, E1, A, K extends PropertyKey, R2, E2, B, R3, E3, C, R4, E4, D, R5, E5, F>(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, ReadonlyArray<A>>>,
    getKey: (a: A) => K,
    matchers: {
      readonly NoData: Fx.Fx<R2, E2, B>
      readonly Loading: (progress: RefSubject.Filtered<never, never, Progress>) => Fx.Fx<R3, E3, C>
      readonly Failure: (
        error: RefSubject.Computed<never, never, E1>
      ) => Fx.Fx<R4, E4, D>
      readonly Success: (
        value: RefSubject.RefSubject<never, never, A>,
        key: K
      ) => Fx.Fx<R5, E5, F>
    }
  ) {
    return matchAsyncData(fx, {
      NoData: matchers.NoData,
      Loading: matchers.Loading,
      Failure: matchers.Failure,
      Success: (value) => Fx.keyed(value, { getKey, onValue: matchers.Success })
    })
  }
)

/**
 * @since 1.20.0
 */
export const runIfNoData: {
  <R2, E, A>(
    effect: Effect.Effect<R2, E, A>
  ): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>
  <R, E, A, R2>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>
  ): Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>
} = dual(2, function runIfNoData<R, E, A, R2>(
  ref: RefAsyncData<R, E, A>,
  effect: Effect.Effect<R2, E, A>
): Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>> {
  return Effect.flatMap(
    ref,
    (current) => AsyncData.isNoData(current) ? runAsyncData(ref, effect) : Effect.succeed(current)
  )
})

/**
 * @since 1.20.0
 */
export const runIfExpired: {
  <R2, E, A>(
    effect: Effect.Effect<R2, E, A>,
    options: { readonly ttl: Duration.DurationInput; readonly now?: number }
  ): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>

  <R, E, A, R2>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>,
    options: { readonly ttl: Duration.DurationInput; readonly now?: number }
  ): Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>
} = dual(3, function runIfExpired<R, E, A, R2>(
  ref: RefAsyncData<R, E, A>,
  effect: Effect.Effect<R2, E, A>,
  { now, ttl }: { readonly ttl: Duration.DurationInput; readonly now?: number }
): Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>> {
  return Effect.flatMap(
    ref,
    (current) => AsyncData.isExpired(current, ttl, now) ? runAsyncData(ref, effect) : Effect.succeed(current)
  )
})

/**
 * Await for the AsyncData to stop loading.
 * @since 1.20.0
 * @category updates
 */
export const awaitLoading = <R, E, A>(
  data: RefAsyncData<R, E, A>
): Effect.Effect<R | Scope.Scope, never, Exclude<AsyncData.AsyncData<E, A>, AsyncData.Loading>> =>
  data.pipe(
    Fx.dropWhile(AsyncData.isLoading),
    Fx.take(1),
    Fx.toReadonlyArray,
    Effect.map((x) => x[0])
  )

/**
 * Await for the AsyncData to stop loading or refreshing.
 * @since 1.20.0
 * @category updates
 */
export const awaitLoadingOrRefreshing = <R, E, A>(
  data: RefAsyncData<R, E, A>
): Effect.Effect<R | Scope.Scope, never, Exclude<AsyncData.AsyncData<E, A>, AsyncData.Loading>> =>
  data.pipe(
    Fx.dropWhile(AsyncData.isLoadingOrRefreshing),
    Fx.take(1),
    Fx.toReadonlyArray,
    Effect.map((x) => x[0])
  )

/**
 * Change the current value of a RefAsyncData to a loading or refreshing state.
 * @since 1.20.0
 * @category updates
 */
export const startLoading: <R, E, A>(
  ref: RefAsyncData<R, E, A>
) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>> = <R, E, A>(ref: RefAsyncData<R, E, A>) =>
  RefSubject.update(ref, AsyncData.startLoading)

/**
 * Change the current value of a RefAsyncData to a non-loading/non-refreshing state.
 * @since 1.20.0
 * @category updates
 */
export const stopLoading: <R, E, A>(
  ref: RefAsyncData<R, E, A>
) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>> = <R, E, A>(ref: RefAsyncData<R, E, A>) =>
  RefSubject.update(ref, AsyncData.stopLoading)

/**
 * Convert RefAsyncData into a Sink.
 * @since 1.20.0
 * @category conversions
 */
export const asSink = <R, E, A>(ref: RefAsyncData<R, E, A>): Sink.Sink<R, E, A> =>
  Sink.make(
    (cause) => RefSubject.set(ref, AsyncData.failCause(cause)),
    (a) => RefSubject.set(ref, AsyncData.success(a))
  )

/**
 * Map the input value using an Effect
 * @since 1.20.0
 */
export const mapInputEffect = <R, E, A, R2, B>(
  ref: RefAsyncData<R, E, A>,
  f: (b: B) => Effect.Effect<R2, E, A>
): Sink.Sink<R | R2, E, B> => Sink.mapEffect(asSink(ref), f)

/**
 * Map the input value
 * @since 1.20.0
 */
export const mapInput = <R, E, A, B>(
  ref: RefAsyncData<R, E, A>,
  f: (b: B) => A
): Sink.Sink<R, E, B> => Sink.map(asSink(ref), f)

const isRefFirst = (args: IArguments) => args.length === 3 || RefSubjectTypeId in args[0]

/**
 * Fail with a given cause
 * @since 1.20.0
 */
export const failCause: {
  <E>(
    cause: Cause.Cause<E>,
    options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
  ): <R, A>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>

  <R, E, A>(
    ref: RefAsyncData<R, E, A>,
    cause: Cause.Cause<E>,
    options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
  ): Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
} = dual(isRefFirst, <R, E, A>(
  ref: RefAsyncData<R, E, A>,
  cause: Cause.Cause<E>,
  options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
) => RefSubject.set(ref, AsyncData.failCause(cause, options)))

/**
 * Fail with a given error
 * @since 1.20.0
 */
export const fail: {
  <E>(
    error: E,
    options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
  ): <R, A>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>

  <R, E, A>(
    ref: RefAsyncData<R, E, A>,
    error: E,
    options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
  ): Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
} = dual(isRefFirst, <R, E, A>(
  ref: RefAsyncData<R, E, A>,
  error: E,
  options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
) => RefSubject.set(ref, AsyncData.fail(error, options)))

/**
 * Succeed with a value
 * @since 1.20.0
 */
export const succeed: {
  <A>(
    value: A,
    options?: AsyncData.OptionalPartial<AsyncData.SuccessOptions>
  ): <R, E>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>

  <R, E, A>(
    ref: RefAsyncData<R, E, A>,
    value: A,
    options?: AsyncData.OptionalPartial<AsyncData.SuccessOptions>
  ): Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
} = dual(
  isRefFirst,
  <R, E, A>(
    ref: RefAsyncData<R, E, A>,
    value: A,
    options?: AsyncData.OptionalPartial<AsyncData.SuccessOptions>
  ) => RefSubject.set(ref, AsyncData.success(value, options))
)

/**
 * Update with an optimistic value
 * @since 1.20.0
 */
export const optimistic: {
  <A>(
    value: A,
    options?: AsyncData.OptionalPartial<AsyncData.OptimisticOptions>
  ): <R, E>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>

  <R, E, A>(
    ref: RefAsyncData<R, E, A>,
    value: A,
    options?: AsyncData.OptionalPartial<AsyncData.OptimisticOptions>
  ): Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
} = dual(
  isRefFirst,
  <R, E, A>(
    ref: RefAsyncData<R, E, A>,
    value: A,
    options?: AsyncData.OptionalPartial<AsyncData.OptimisticOptions>
  ) => RefSubject.update(ref, AsyncData.optimistic(value, options))
)

/**
 * Set Exit value of RefAsyncData
 * @since 1.20.0
 */
export const done: {
  <E, A>(exit: Exit.Exit<E, A>): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
  <R, E, A>(ref: RefAsyncData<R, E, A>, exit: Exit.Exit<E, A>): Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
} = dual(
  2,
  <R, E, A>(
    ref: RefAsyncData<R, E, A>,
    exit: Exit.Exit<E, A>
  ) => RefSubject.set(ref, AsyncData.done(exit))
)

/**
 * @since 1.20.0
 * @category Filtered
 */
export const getFailure = <R, E, A>(ref: RefAsyncData<R, E, A>): RefSubject.Filtered<R, never, E> =>
  RefSubject.filterMap(ref, AsyncData.getFailure)

/**
 * @since 1.20.0
 * @category Filtered
 */
export const getSuccess = <R, E, A>(ref: RefAsyncData<R, E, A>): RefSubject.Filtered<R, never, A> =>
  RefSubject.filterMap(ref, AsyncData.getSuccess)
