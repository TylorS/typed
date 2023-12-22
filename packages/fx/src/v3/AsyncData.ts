import * as AsyncData from "@typed/async-data/AsyncData"
import type { Progress } from "@typed/async-data/Progress"
import type { Duration } from "effect"
import { Cause, Effect, Either, Option } from "effect"
import { dual } from "effect/Function"
import * as Fx from "./Fx"
import * as RefSubject from "./RefSubject"

export function asyncDataRequest<R, E, A>(effect: Effect.Effect<R, E, A>): Fx.Fx<R, never, AsyncData.AsyncData<E, A>> {
  return Fx.make((sink) =>
    Effect.flatMap(
      Effect.zipRight(
        sink.onSuccess(AsyncData.noData()),
        Effect.zipRight(sink.onSuccess(AsyncData.loading()), Effect.exit(effect))
      ),
      (exit) => sink.onSuccess(AsyncData.fromExit(exit))
    )
  )
}

export interface RefAsyncData<R, E, A> extends RefSubject.RefSubject<R, never, AsyncData.AsyncData<E, A>> {}

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
          Effect.tap(get, (current) => set(AsyncData.startLoading(current))),
          () => Effect.exit(restore(effect))
        ),
        (exit) => set(AsyncData.fromExit(exit))
      )
    )
  )
})

export const matchAsyncData: {
  <E1, A, R2, E2, B, R3, E3, C, R4, E4, D, R5, E5, F>(
    matchers: {
      readonly NoData: Fx.Fx<R2, E2, B>
      readonly Loading: (progress: RefSubject.Filtered<never, never, Progress>) => Fx.Fx<R3, E3, C>
      readonly Failure: (
        error: RefSubject.Computed<never, never, E1>,
        options: {
          readonly timestamp: RefSubject.Computed<never, never, number>
          readonly progress: RefSubject.Filtered<never, never, Progress>
        }
      ) => Fx.Fx<R4, E4, D>
      readonly Success: (
        value: RefSubject.Computed<never, never, A>,
        options: {
          readonly timestamp: RefSubject.Computed<never, never, number>
          readonly progress: RefSubject.Filtered<never, never, Progress>
        }
      ) => Fx.Fx<R5, E5, F>
    }
  ): <R, E>(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, A>>
  ) => Fx.Fx<R | R2 | R3 | R4 | R5, E | E2 | E3 | E4 | E5, B | C | D | F>

  <R, E, E1, A, R2, E2, B, R3, E3, C, R4, E4, D, R5, E5, F>(fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, A>>, matchers: {
    readonly NoData: Fx.Fx<R2, E2, B>
    readonly Loading: (progress: RefSubject.Filtered<never, never, Progress>) => Fx.Fx<R3, E3, C>
    readonly Failure: (error: RefSubject.Computed<never, never, E1>, options: {
      readonly timestamp: RefSubject.Computed<never, never, number>
      readonly progress: RefSubject.Filtered<never, never, Progress>
    }) => Fx.Fx<R4, E4, D>
    readonly Success: (value: RefSubject.Computed<never, never, A>, options: {
      readonly timestamp: RefSubject.Computed<never, never, number>
      readonly progress: RefSubject.Filtered<never, never, Progress>
    }) => Fx.Fx<R5, E5, F>
  }): Fx.Fx<R | R2 | R3 | R4 | R5, E | E2 | E3 | E4 | E5, B | C | D | F>
} = dual(2, function matchAsyncData<R, E, E1, A, R2, E2, B, R3, E3, C, R4, E4, D, R5, E5, F>(
  fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, A>>,
  matchers: {
    readonly NoData: Fx.Fx<R2, E2, B>
    readonly Loading: (progress: RefSubject.Filtered<never, never, Progress>) => Fx.Fx<R3, E3, C>
    readonly Failure: (
      error: RefSubject.Computed<never, never, E1>,
      options: {
        readonly timestamp: RefSubject.Computed<never, never, number>
        readonly progress: RefSubject.Filtered<never, never, Progress>
      }
    ) => Fx.Fx<R4, E4, D>
    readonly Success: (
      value: RefSubject.Computed<never, never, A>,
      options: {
        readonly timestamp: RefSubject.Computed<never, never, number>
        readonly progress: RefSubject.Filtered<never, never, Progress>
      }
    ) => Fx.Fx<R5, E5, F>
  }
) {
  return Fx.matchTags(fx, {
    NoData: () => matchers.NoData,
    Loading: (loading) => matchers.Loading(RefSubject.filterMap(loading, (l) => l.progress)),
    Failure: (failure) =>
      matchers.Failure(
        RefSubject.mapEffect(failure, (f) =>
          Either.match(Cause.failureOrCause(f.cause), {
            onLeft: Effect.succeed,
            onRight: Effect.failCause
          })),
        {
          timestamp: RefSubject.map(failure, (f) => f.timestamp),
          progress: RefSubject.filterMap(failure, (f) => Option.flatMap(f.refreshing, (l) => l.progress))
        }
      ),
    Success: (success) =>
      matchers.Success(RefSubject.map(success, (s) => s.value), {
        timestamp: RefSubject.map(success, (s) => s.timestamp),
        progress: RefSubject.filterMap(success, (f) => Option.flatMap(f.refreshing, (l) => l.progress))
      })
  })
})

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
