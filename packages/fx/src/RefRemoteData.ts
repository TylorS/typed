import * as Either from '@effect/data/Either'
import * as Equivalence from '@effect/data/Equivalence'
import * as Option from '@effect/data/Option'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import * as Fiber from '@effect/io/Fiber'
import * as SynchronizedRef from '@effect/io/Ref/Synchronized'
import * as Scope from '@effect/io/Scope'
import * as RemoteData from '@typed/remote-data'
import fastDeepEqual from 'fast-deep-equal'

import { Computed } from './Computed.js'
import { Fx } from './Fx.js'
import { RefSubject, makeRef } from './RefSubject.js'
import { drain } from './observe.js'
import { skipWhile } from './skipWhile.js'
import { take } from './slice.js'
import { switchMap } from './switchMap.js'

export interface RefRemoteData<E, A> extends RefSubject<never, RemoteData.RemoteData<E, A>> {
  // Constructors/Setters
  readonly succeed: (value: A) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  readonly failCause: (
    error: Cause.Cause<E>,
  ) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  readonly fail: (error: E) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  readonly fromExit: (
    exit: Exit.Exit<E, A>,
  ) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  readonly fromEither: (
    either: Either.Either<E, A>,
  ) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  readonly fromOption: (
    option: Option.Option<A>,
  ) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>

  // Computed
  readonly mapValueEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ) => Computed<R2, E2, RemoteData.RemoteData<E, B>>
  readonly mapValue: <B>(f: (a: A) => B) => Computed<never, never, RemoteData.RemoteData<E, B>>

  // Effects
  readonly runEffect: <R>(
    effect: Effect.Effect<R, E, A>,
  ) => Effect.Effect<R | Scope.Scope, never, boolean>

  readonly awaitNotLoading: Effect.Effect<Scope.Scope, never, void>

  // Matching
  readonly matchFx: <R2, E2, B, R3, E3, C, R4, E4, D, R5, E5, F>(options: {
    onNoData: () => Fx<R2, E2, B>
    onLoading: () => Fx<R3, E3, C>
    onFailure: (cause: Cause.Cause<E>, refreshing: boolean) => Fx<R4, E4, D>
    onSuccess: (value: A, refreshing: boolean) => Fx<R5, E5, F>
  }) => Fx<R2 | R3 | R4 | R5, E2 | E3 | E4 | E5, B | C | D | F>

  readonly matchEffect: <R2, E2, B, R3, E3, C, R4, E4, D, R5, E5, F>(options: {
    onNoData: () => Effect.Effect<R2, E2, B>
    onLoading: () => Effect.Effect<R3, E3, C>
    onFailure: (cause: Cause.Cause<E>, refreshing: boolean) => Effect.Effect<R4, E4, D>
    onSuccess: (value: A, refreshing: boolean) => Effect.Effect<R5, E5, F>
  }) => Computed<R2 | R3 | R4 | R5, E2 | E3 | E4 | E5, B | C | D | F>

  // States
  readonly toLoading: Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  readonly stopLoading: Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  readonly isLoading: Computed<never, never, boolean>
  readonly isRefreshing: Computed<never, never, boolean>
  readonly isLoadingOrRefreshing: Computed<never, never, boolean>
  readonly isFailure: Computed<never, never, boolean>
  readonly isSuccess: Computed<never, never, boolean>
}

export function makeRefRemoteData<E, A>(
  E: Equivalence.Equivalence<E> = fastDeepEqual,
  A: Equivalence.Equivalence<A> = fastDeepEqual,
): Effect.Effect<Scope.Scope, never, RefRemoteData<E, A>> {
  return Effect.gen(function* ($) {
    const ref = yield* $(
      makeRef(
        Effect.succeed<RemoteData.RemoteData<E, A>>(RemoteData.noData),
        RemoteData.getEquivalence(E, A),
      ),
    )
    const succeed = (value: A) => ref.set(RemoteData.success(value))
    const failCause = (error: Cause.Cause<E>) => ref.set(RemoteData.failCause(error))
    const mapValueEffect = <R2, E2, B>(
      f: (a: A, refreshing: boolean) => Effect.Effect<R2, E2, B>,
    ): Computed<R2, E2, RemoteData.RemoteData<E, B>> =>
      ref.mapEffect((data) =>
        RemoteData.match(data, {
          onNoData: () => Effect.succeed(RemoteData.noData as RemoteData.RemoteData<E, B>),
          onLoading: () => Effect.succeed(RemoteData.loading),
          onFailure: (cause, refreshing) => Effect.succeed(RemoteData.failCause(cause, refreshing)),
          onSuccess: (a, refreshing) =>
            f(a, refreshing).pipe(Effect.map((b) => RemoteData.success(b, refreshing))),
        }),
      )

    const toLoading = ref.update(RemoteData.toLoading)
    const stopLoading = ref.update(RemoteData.stopLoading)
    const isLoading = ref.map(RemoteData.isLoading)
    const isRefreshing = ref.map(RemoteData.isRefreshing)
    const isLoadingOrRefreshing = ref.map(RemoteData.isLoadingOrRefreshing)

    // Ensure there can only ever be one loading fiber
    const currentFiber = yield* $(
      SynchronizedRef.make<Fiber.Fiber<never, boolean>>(Fiber.succeed(false)),
    )

    const runEffect = <R>(effect: Effect.Effect<R, E, A>) =>
      SynchronizedRef.updateAndGetEffect(currentFiber, (fiber) =>
        Fiber.interrupt(fiber).pipe(
          Effect.flatMap(() =>
            ref.multiUpdate((current, set) =>
              Effect.if(RemoteData.isLoadingOrRefreshing(current), {
                onFalse: set(RemoteData.toLoading(current)).pipe(
                  Effect.zipRight(effect),
                  Effect.exit,
                  Effect.flatMap((exit) => set(RemoteData.fromExit(exit))),
                  Effect.as(true),
                ),
                onTrue: Effect.as(stopLoading, false),
              }).pipe(Effect.onInterrupt(() => stopLoading)),
            ),
          ),
          Effect.forkScoped,
        ),
      ).pipe(Effect.flatMap(Fiber.join))

    const matchFx = <R2, E2, B, R3, E3, C, R4, E4, D, R5, E5, F>(options: {
      onNoData: () => Fx<R2, E2, B>
      onLoading: () => Fx<R3, E3, C>
      onFailure: (cause: Cause.Cause<E>, refreshing: boolean) => Fx<R4, E4, D>
      onSuccess: (value: A, refreshing: boolean) => Fx<R5, E5, F>
    }) =>
      switchMap(
        ref,
        (data): Fx<R2 | R3 | R4 | R5, E2 | E3 | E4 | E5, B | C | D | F> =>
          RemoteData.match(data, options),
      )

    const matchEffect = <R2, E2, B, R3, E3, C, R4, E4, D, R5, E5, F>(options: {
      onNoData: () => Effect.Effect<R2, E2, B>
      onLoading: () => Effect.Effect<R3, E3, C>
      onFailure: (cause: Cause.Cause<E>, refreshing: boolean) => Effect.Effect<R4, E4, D>
      onSuccess: (value: A, refreshing: boolean) => Effect.Effect<R5, E5, F>
    }) =>
      ref.mapEffect(
        (data): Effect.Effect<R2 | R3 | R4 | R5, E2 | E3 | E4 | E5, B | C | D | F> =>
          RemoteData.match(data, options),
      )

    const awaitNotLoading = drain(take(skipWhile(ref, RemoteData.isLoadingOrRefreshing), 1))

    const refRemoteData: RefRemoteData<E, A> = Object.assign(ref, {
      awaitNotLoading,
      fail: (error: E) => failCause(Cause.fail(error)),
      failCause,
      fromEither: (either: Either.Either<E, A>) => ref.set(RemoteData.fromEither(either)),
      fromExit: (exit: Exit.Exit<E, A>) => ref.set(RemoteData.fromExit(exit)),
      fromOption: (option: Option.Option<A>) => ref.set(RemoteData.fromOption(option)),
      isFailure: ref.map(RemoteData.isFailure),
      isLoading,
      isLoadingOrRefreshing,
      isRefreshing,
      isSuccess: ref.map(RemoteData.isSuccess),
      mapValue: <B>(f: (a: A) => B) => mapValueEffect((a) => Effect.sync(() => f(a))),
      mapValueEffect,
      matchEffect: matchEffect,
      matchFx: matchFx,
      runEffect,
      stopLoading,
      succeed,
      toLoading,
    })

    return refRemoteData
  })
}
