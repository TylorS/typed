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
export function asyncDataRequest<A, E, R>(effect: Effect.Effect<A, E, R>): Fx.Fx<AsyncData.AsyncData<A, E>, never, R> {
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
export interface RefAsyncData<A, E = never, R = never>
  extends RefSubject.RefSubject<AsyncData.AsyncData<A, E>, never, R>
{}

/**
 * @since 1.20.0
 */
export const runAsyncData: {
  <R2, A, E>(
    effect: Effect.Effect<A, E, R2>
  ): <R>(ref: RefAsyncData<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R | R2>
  <A, E, R, R2>(
    ref: RefAsyncData<A, E, R>,
    effect: Effect.Effect<A, E, R2>
  ): Effect.Effect<AsyncData.AsyncData<A, E>, never, R | R2>
} = dual(2, function runAsyncData<A, E, R, R2>(
  ref: RefAsyncData<A, E, R>,
  effect: Effect.Effect<A, E, R2>
): Effect.Effect<AsyncData.AsyncData<A, E>, never, R | R2> {
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
  <E1, A, B, E2, R2, C, E3, R3, D, E4, R4, F, E5, R5>(
    matchers: {
      readonly NoData: Fx.Fx<B, E2, R2>
      readonly Loading: (progress: RefSubject.Filtered<Progress>) => Fx.Fx<C, E3, R3>
      readonly Failure: (error: RefSubject.Computed<E1>) => Fx.Fx<D, E4, R4>
      readonly Success: (value: RefSubject.RefSubject<A>) => Fx.Fx<F, E5, R5>
    }
  ): <E, R>(
    fx: Fx.Fx<AsyncData.AsyncData<A, E1>, E, R>
  ) => Fx.Fx<B | C | D | F, E | E2 | E3 | E4 | E5, R | R2 | R3 | R4 | R5>

  <R, E, E1, A, B, E2, R2, C, E3, R3, D, E4, R4, F, E5, R5>(fx: Fx.Fx<AsyncData.AsyncData<A, E1>, E, R>, matchers: {
    readonly NoData: Fx.Fx<B, E2, R2>
    readonly Loading: (progress: RefSubject.Filtered<Progress>) => Fx.Fx<C, E3, R3>
    readonly Failure: (error: RefSubject.Computed<E1>) => Fx.Fx<D, E4, R4>
    readonly Success: (value: RefSubject.RefSubject<A>) => Fx.Fx<F, E5, R5>
  }): Fx.Fx<B | C | D | F, E | E2 | E3 | E4 | E5, R | R2 | R3 | R4 | R5>
} = dual(2, function matchAsyncData<R, E, E1, A, B, E2, R2, C, E3, R3, D, E4, R4, F, E5, R5>(
  fx: Fx.Fx<AsyncData.AsyncData<A, E1>, E, R>,
  matchers: {
    readonly NoData: Fx.Fx<B, E2, R2>
    readonly Loading: (progress: RefSubject.Filtered<Progress>) => Fx.Fx<C, E3, R3>
    readonly Failure: (
      error: RefSubject.Computed<E1>,
      failure: RefSubject.RefSubject<AsyncData.Failure<E1>>
    ) => Fx.Fx<D, E4, R4>
    readonly Success: (
      value: RefSubject.RefSubject<A>,
      data: RefSubject.RefSubject<AsyncData.Success<A> | AsyncData.Optimistic<A, E1>>
    ) => Fx.Fx<F, E5, R5>
  }
): Fx.Fx<B | C | D | F, E | E2 | E3 | E4 | E5, R | R2 | R3 | R4 | R5> {
  return Fx.withKey(
    fx,
    {
      getKey: (a: AsyncData.AsyncData<A, E1>) => a._tag === "Optimistic" ? "Success" : a._tag,
      onValue: (ref, key): Fx.Fx<B | C | D | F, E | E2 | E3 | E4 | E5, R | R2 | R3 | R4 | R5> => {
        switch (key) {
          case "NoData":
            return matchers.NoData
          case "Loading":
            return matchers.Loading(
              RefSubject.filterMap(ref as RefSubject.RefSubject<AsyncData.Loading>, (l) => l.progress)
            )
          case "Failure": {
            const failure = ref as RefSubject.RefSubject<AsyncData.Failure<E1>>
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
            const success = ref as RefSubject.RefSubject<AsyncData.Success<A> | AsyncData.Optimistic<A, E1>>

            return matchers.Success(
              RefSubject.transformOrFail(
                success,
                (s) => Effect.succeed(s.value),
                (value) =>
                  Effect.map(
                    success,
                    (d) => AsyncData.map(d, () => value) as AsyncData.Success<A> | AsyncData.Optimistic<A, E1>
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
  <E1, A, K extends PropertyKey, B, E2, R2, C, E3, R3, D, E4, R4, F, E5, R5>(
    getKey: (a: A) => K,
    matchers: {
      readonly NoData: Fx.Fx<B, E2, R2>
      readonly Loading: (progress: RefSubject.Filtered<Progress>) => Fx.Fx<C, E3, R3>
      readonly Failure: (error: RefSubject.Computed<E1>) => Fx.Fx<D, E4, R4>
      readonly Success: (value: RefSubject.RefSubject<A>, key: K) => Fx.Fx<F, E5, R5>
    }
  ): <E, R>(
    fx: Fx.Fx<AsyncData.AsyncData<ReadonlyArray<A>, E1>, E, R>
  ) => Fx.Fx<B | C | D | ReadonlyArray<F>, E | E2 | E3 | E4 | E5, Scope.Scope | R | R2 | R3 | R4 | R5>

  <R, E, E1, A, K extends PropertyKey, B, E2, R2, C, E3, R3, D, E4, R4, F, E5, R5>(
    fx: Fx.Fx<AsyncData.AsyncData<ReadonlyArray<A>, E1>, E, R>,
    getKey: (a: A) => K,
    matchers: {
      readonly NoData: Fx.Fx<B, E2, R2>
      readonly Loading: (progress: RefSubject.Filtered<Progress>) => Fx.Fx<C, E3, R3>
      readonly Failure: (error: RefSubject.Computed<E1>) => Fx.Fx<D, E4, R4>
      readonly Success: (value: RefSubject.RefSubject<A>, key: K) => Fx.Fx<F, E5, R5>
    }
  ): Fx.Fx<B | C | D | ReadonlyArray<F>, E | E2 | E3 | E4 | E5, Scope.Scope | R | R2 | R3 | R4 | R5>
} = dual(
  3,
  function matchAsyncDataArray<R, E, E1, A, K extends PropertyKey, B, E2, R2, C, E3, R3, D, E4, R4, F, E5, R5>(
    fx: Fx.Fx<AsyncData.AsyncData<ReadonlyArray<A>, E1>, E, R>,
    getKey: (a: A) => K,
    matchers: {
      readonly NoData: Fx.Fx<B, E2, R2>
      readonly Loading: (progress: RefSubject.Filtered<Progress>) => Fx.Fx<C, E3, R3>
      readonly Failure: (
        error: RefSubject.Computed<E1>
      ) => Fx.Fx<D, E4, R4>
      readonly Success: (
        value: RefSubject.RefSubject<A>,
        key: K
      ) => Fx.Fx<F, E5, R5>
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
  <R2, A, E>(
    effect: Effect.Effect<A, E, R2>
  ): <R>(ref: RefAsyncData<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R | R2>
  <A, E, R, R2>(
    ref: RefAsyncData<A, E, R>,
    effect: Effect.Effect<A, E, R2>
  ): Effect.Effect<AsyncData.AsyncData<A, E>, never, R | R2>
} = dual(2, function runIfNoData<A, E, R, R2>(
  ref: RefAsyncData<A, E, R>,
  effect: Effect.Effect<A, E, R2>
): Effect.Effect<AsyncData.AsyncData<A, E>, never, R | R2> {
  return Effect.flatMap(
    ref,
    (current) => AsyncData.isNoData(current) ? runAsyncData(ref, effect) : Effect.succeed(current)
  )
})

/**
 * @since 1.20.0
 */
export const runIfExpired: {
  <R2, A, E>(
    effect: Effect.Effect<A, E, R2>,
    options: { readonly ttl: Duration.DurationInput; readonly now?: number }
  ): <R>(ref: RefAsyncData<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R | R2>

  <A, E, R, R2>(
    ref: RefAsyncData<A, E, R>,
    effect: Effect.Effect<A, E, R2>,
    options: { readonly ttl: Duration.DurationInput; readonly now?: number }
  ): Effect.Effect<AsyncData.AsyncData<A, E>, never, R | R2>
} = dual(3, function runIfExpired<A, E, R, R2>(
  ref: RefAsyncData<A, E, R>,
  effect: Effect.Effect<A, E, R2>,
  { now, ttl }: { readonly ttl: Duration.DurationInput; readonly now?: number }
): Effect.Effect<AsyncData.AsyncData<A, E>, never, R | R2> {
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
export const awaitLoading = <A, E, R>(
  data: RefAsyncData<A, E, R>
): Effect.Effect<Exclude<AsyncData.AsyncData<A, E>, AsyncData.Loading>, never, R | Scope.Scope> =>
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
export const awaitLoadingOrRefreshing = <A, E, R>(
  data: RefAsyncData<A, E, R>
): Effect.Effect<Exclude<AsyncData.AsyncData<A, E>, AsyncData.Loading>, never, R | Scope.Scope> =>
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
export const startLoading: <A, E, R>(
  ref: RefAsyncData<A, E, R>
) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R> = <A, E, R>(ref: RefAsyncData<A, E, R>) =>
  RefSubject.update(ref, AsyncData.startLoading)

/**
 * Change the current value of a RefAsyncData to a non-loading/non-refreshing state.
 * @since 1.20.0
 * @category updates
 */
export const stopLoading: <A, E, R>(
  ref: RefAsyncData<A, E, R>
) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R> = <A, E, R>(ref: RefAsyncData<A, E, R>) =>
  RefSubject.update(ref, AsyncData.stopLoading)

/**
 * Convert RefAsyncData into a Sink.
 * @since 1.20.0
 * @category conversions
 */
export const asSink = <A, E, R>(ref: RefAsyncData<A, E, R>): Sink.Sink<A, E, R> =>
  Sink.make(
    (cause) => RefSubject.set(ref, AsyncData.failCause(cause)),
    (a) => RefSubject.set(ref, AsyncData.success(a))
  )

/**
 * Map the input value using an Effect
 * @since 1.20.0
 */
export const mapInputEffect = <A, E, R, R2, B>(
  ref: RefAsyncData<A, E, R>,
  f: (b: B) => Effect.Effect<A, E, R2>
): Sink.Sink<B, E, R | R2> => Sink.mapEffect(asSink(ref), f)

/**
 * Map the input value
 * @since 1.20.0
 */
export const mapInput = <A, E, R, B>(
  ref: RefAsyncData<A, E, R>,
  f: (b: B) => A
): Sink.Sink<B, E, R> => Sink.map(asSink(ref), f)

const isRefFirst = (args: IArguments) => args.length === 3 || RefSubjectTypeId in args[0]

/**
 * Fail with a given cause
 * @since 1.20.0
 */
export const failCause: {
  <E>(
    cause: Cause.Cause<E>,
    options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
  ): <R, A>(ref: RefAsyncData<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R>

  <A, E, R>(
    ref: RefAsyncData<A, E, R>,
    cause: Cause.Cause<E>,
    options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
  ): Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
} = dual(isRefFirst, <A, E, R>(
  ref: RefAsyncData<A, E, R>,
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
  ): <R, A>(ref: RefAsyncData<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R>

  <A, E, R>(
    ref: RefAsyncData<A, E, R>,
    error: E,
    options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
  ): Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
} = dual(isRefFirst, <A, E, R>(
  ref: RefAsyncData<A, E, R>,
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
  ): <E, R>(ref: RefAsyncData<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R>

  <A, E, R>(
    ref: RefAsyncData<A, E, R>,
    value: A,
    options?: AsyncData.OptionalPartial<AsyncData.SuccessOptions>
  ): Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
} = dual(
  isRefFirst,
  <A, E, R>(
    ref: RefAsyncData<A, E, R>,
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
  ): <E, R>(ref: RefAsyncData<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R>

  <A, E, R>(
    ref: RefAsyncData<A, E, R>,
    value: A,
    options?: AsyncData.OptionalPartial<AsyncData.OptimisticOptions>
  ): Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
} = dual(
  isRefFirst,
  <A, E, R>(
    ref: RefAsyncData<A, E, R>,
    value: A,
    options?: AsyncData.OptionalPartial<AsyncData.OptimisticOptions>
  ) => RefSubject.update(ref, AsyncData.optimistic(value, options))
)

/**
 * Set Exit value of RefAsyncData
 * @since 1.20.0
 */
export const done: {
  <E, A>(exit: Exit.Exit<A, E>): <R>(ref: RefAsyncData<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
  <A, E, R>(ref: RefAsyncData<A, E, R>, exit: Exit.Exit<A, E>): Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
} = dual(
  2,
  <A, E, R>(
    ref: RefAsyncData<A, E, R>,
    exit: Exit.Exit<A, E>
  ) => RefSubject.set(ref, AsyncData.done(exit))
)

/**
 * @since 1.20.0
 * @category Filtered
 */
export const getFailure = <A, E, R>(ref: RefAsyncData<A, E, R>): RefSubject.Filtered<E, never, R> =>
  RefSubject.filterMap(ref, AsyncData.getFailure)

/**
 * @since 1.20.0
 * @category Filtered
 */
export const getSuccess = <A, E, R>(ref: RefAsyncData<A, E, R>): RefSubject.Filtered<A, never, R> =>
  RefSubject.filterMap(ref, AsyncData.getSuccess)
