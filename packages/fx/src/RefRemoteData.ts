/**
 * A RefRemoteData is a RefSubject that holds a RemoteData value.
 * @since 1.18.0
 */

import type * as Either from "@effect/data/Either"
import { dual } from "@effect/data/Function"
import type * as Option from "@effect/data/Option"
import type * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import type * as Exit from "@effect/io/Exit"
import type * as Computed from "@typed/fx/Computed"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import * as RemoteData from "@typed/remote-data"

/**
 * A RefRemoteData is a RefSubject that holds a RemoteData value.
 * @since 1.18.0
 * @category models
 */
export interface RefRemoteData<E, A> extends RefSubject.RefSubject<never, RemoteData.RemoteData<E, A>> {}

/**
 * Create a RefRemoteData
 * @since 1.18.0
 * @category constructors
 */
export const make: <E, A>() => Effect.Effect<never, never, RefSubject.RefSubject<never, RemoteData.RemoteData<E, A>>> =
  <E, A>() => RefSubject.of<RemoteData.RemoteData<E, A>>(RemoteData.noData)

/**
 * Change the current value of a RefRemoteData to a loading or refreshing state.
 * @since 1.18.0
 * @category updates
 */
export const toLoading: <E, A>(ref: RefRemoteData<E, A>) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>> = <
  E,
  A
>(ref: RefRemoteData<E, A>) => ref.update(RemoteData.toLoading)

/**
 * Change the current value of a RefRemoteData to a non-loading/non-refreshing state.
 * @since 1.18.0
 * @category updates
 */
export const stopLoading: <E, A>(ref: RefRemoteData<E, A>) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>> =
  <E, A>(ref: RefRemoteData<E, A>) => ref.update(RemoteData.stopLoading)

/**
 * Update the state with a failure cause.
 * @since 1.18.0
 * @category updates
 */
export const failCause: {
  <E>(cause: Cause.Cause<E>): <A>(ref: RefRemoteData<E, A>) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  <E, A>(ref: RefRemoteData<E, A>, cause: Cause.Cause<E>): Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
} = dual(
  2,
  <E, A>(ref: RefRemoteData<E, A>, cause: Cause.Cause<E>) => ref.set(RemoteData.failCause(cause))
)

/**
 * Update the state with a failure.
 * @since 1.18.0
 * @category updates
 */
export const fail: {
  <E>(error: E): <A>(ref: RefRemoteData<E, A>) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  <E, A>(ref: RefRemoteData<E, A>, error: E): Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
} = dual(2, <E, A>(ref: RefRemoteData<E, A>, error: E) => ref.set(RemoteData.fail(error)))

/**
 * Update the state with a success.
 * @since 1.18.0
 * @category updates
 */
export const succeed: {
  <A>(value: A): <E>(ref: RefRemoteData<E, A>) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  <E, A>(ref: RefRemoteData<E, A>, value: A): Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
} = dual(2, <E, A>(ref: RefRemoteData<E, A>, value: A) => ref.set(RemoteData.succeed(value)))

/**
 * Returns true if the current state is NoData.
 * @since 1.18.0
 * @category computed
 */
export const isNoData = <E, A>(ref: RefRemoteData<E, A>): Computed.Computed<never, never, boolean> =>
  ref.map(RemoteData.isNoData)

/**
 * Returns true if the current state is Loading.
 * @since 1.18.0
 * @category computed
 */
export const isLoading = <E, A>(ref: RefRemoteData<E, A>): Computed.Computed<never, never, boolean> =>
  ref.map(RemoteData.isLoading)

/**
 * Returns true if the current state is Failure.
 * @since 1.18.0
 * @category computed
 */
export const isFailure = <E, A>(ref: RefRemoteData<E, A>): Computed.Computed<never, never, boolean> =>
  ref.map(RemoteData.isFailure)

/**
 * Returns true if the current state is Success.
 * @since 1.18.0
 * @category computed
 */
export const isSuccess = <E, A>(ref: RefRemoteData<E, A>): Computed.Computed<never, never, boolean> =>
  ref.map(RemoteData.isSuccess)

/**
 * Returns true if the current state is refreshing.
 * @since 1.18.0
 * @category computed
 */
export const isRefreshing = <E, A>(ref: RefRemoteData<E, A>): Computed.Computed<never, never, boolean> =>
  ref.map(RemoteData.isRefreshing)

/**
 * Returns true if the current state is loading or refreshing.
 * @since 1.18.0
 * @category computed
 */
export const isLoadingOrRefreshing = <E, A>(ref: RefRemoteData<E, A>): Computed.Computed<never, never, boolean> =>
  ref.map(RemoteData.isLoadingOrRefreshing)

/**
 * Update that state with an Either
 * @since 1.18.0
 * @category updates
 */
export const fromEither: {
  <E, A>(
    either: Either.Either<E, A>
  ): (ref: RefRemoteData<E, A>) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  <E, A>(
    ref: RefRemoteData<E, A>,
    either: Either.Either<E, A>
  ): Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
} = dual(2, <E, A>(ref: RefRemoteData<E, A>, either: Either.Either<E, A>) => ref.set(RemoteData.fromEither(either)))

/**
 * Update that state with an Option
 * @since 1.18.0
 * @category updates
 */
export const fromOption: {
  <A>(
    option: Option.Option<A>
  ): <E>(ref: RefRemoteData<E, A>) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  <E, A>(
    ref: RefRemoteData<E, A>,
    option: Option.Option<A>
  ): Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
} = dual(2, <E, A>(ref: RefRemoteData<E, A>, option: Option.Option<A>) => ref.set(RemoteData.fromOption(option)))

/**
 * Update that state with an Exit
 * @since 1.18.0
 * @category updates
 */
export const fromExit: {
  <E, A>(
    either: Exit.Exit<E, A>
  ): (ref: RefRemoteData<E, A>) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  <E, A>(
    ref: RefRemoteData<E, A>,
    exit: Exit.Exit<E, A>
  ): Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
} = dual(2, <E, A>(ref: RefRemoteData<E, A>, exit: Exit.Exit<E, A>) => ref.set(RemoteData.fromExit(exit)))

/**
 * Extract the success value from a RefRemoteData
 * @since 1.18.0
 * @category computed
 */
export const toOption = <E, A>(ref: RefRemoteData<E, A>): Computed.Computed<never, never, Option.Option<A>> =>
  ref.map(RemoteData.toOption)

/**
 * Extract the error value from a RefRemoteData
 * @since 1.18.0
 * @category computed
 */
export const toOptionError = <E, A>(
  ref: RefRemoteData<E, A>
): Computed.Computed<never, never, Option.Option<E>> => ref.map(RemoteData.toOptionError)

/**
 * map the success value of a RefRemoteData
 * @since 1.18.0
 * @category computed
 */
export const map: {
  <A, B>(f: (a: A) => B): <E>(ref: RefRemoteData<E, A>) => Computed.Computed<never, never, RemoteData.RemoteData<E, B>>
  <E, A, B>(ref: RefRemoteData<E, A>, f: (a: A) => B): Computed.Computed<never, never, RemoteData.RemoteData<E, B>>
} = dual(2, <E, A, B>(ref: RefRemoteData<E, A>, f: (a: A) => B) => ref.map(RemoteData.map(f)))

/**
 * map the error value of a RefRemoteData
 * @since 1.18.0
 * @category computed
 */
export const mapError: {
  <E, E2>(
    f: (e: E) => E2
  ): <A>(ref: RefRemoteData<E, A>) => Computed.Computed<never, never, RemoteData.RemoteData<E2, A>>
  <E, A, E2>(ref: RefRemoteData<E, A>, f: (e: E) => E2): Computed.Computed<never, never, RemoteData.RemoteData<E2, A>>
} = dual(2, <E, A, E2>(ref: RefRemoteData<E, A>, f: (e: E) => E2) => ref.map(RemoteData.mapError(f)))

/**
 * map the cause value of a RefRemoteData
 * @since 1.18.0
 * @category computed
 */
export const mapErrorCause: {
  <E, E2>(
    f: (e: Cause.Cause<E>) => Cause.Cause<E2>
  ): <A>(ref: RefRemoteData<E, A>) => Computed.Computed<never, never, RemoteData.RemoteData<E2, A>>
  <E, A, E2>(
    ref: RefRemoteData<E, A>,
    f: (e: Cause.Cause<E>) => Cause.Cause<E2>
  ): Computed.Computed<never, never, RemoteData.RemoteData<E2, A>>
} = dual(
  2,
  <E, A, E2>(ref: RefRemoteData<E, A>, f: (e: Cause.Cause<E>) => Cause.Cause<E2>) =>
    ref.map(RemoteData.mapErrorCause(f))
)

/**
 * Map the success value of an Fx of a RemoteData to a new Fx of a RemoteData.
 * @since 1.18.0
 * @category combinators
 */
export const switchMap: {
  <A, R2, E2, E3, B>(
    f: (a: A) => Fx.Fx<R2, E2, RemoteData.RemoteData<E3, B>>
  ): <R, E, E1>(
    fx: Fx.Fx<R, E, RemoteData.RemoteData<E1, A>>
  ) => Fx.Fx<R | R2, E | E2, RemoteData.RemoteData<E1 | E3, B>>

  <R, E, E1, A, R2, E2, E3, B>(
    fx: Fx.Fx<R, E, RemoteData.RemoteData<E1, A>>,
    f: (a: A) => Fx.Fx<R2, E2, RemoteData.RemoteData<E3, B>>
  ): Fx.Fx<R | R2, E | E2, RemoteData.RemoteData<E1 | E3, B>>
} = dual(2, function switchMap<R, E, E1, A, R2, E2, E3, B>(
  fx: Fx.Fx<R, E, RemoteData.RemoteData<E1, A>>,
  f: (a: A) => Fx.Fx<R2, E2, RemoteData.RemoteData<E3, B>>
): Fx.Fx<R | R2, E | E2, RemoteData.RemoteData<E1 | E3, B>> {
  return Fx.switchMap(
    fx,
    (data) =>
      RemoteData.match(data, {
        onNoData: (): Fx.Fx<R2, E | E2, RemoteData.RemoteData<E1 | E3, B>> => Effect.succeed(RemoteData.noData),
        onLoading: (): Fx.Fx<R2, E | E2, RemoteData.RemoteData<E1 | E3, B>> => Effect.succeed(RemoteData.loading),
        onFailure: (e): Fx.Fx<R2, E | E2, RemoteData.RemoteData<E1 | E3, B>> => Effect.succeed(RemoteData.failCause(e)),
        onSuccess: f
      })
  )
})

/**
 * Get the success value or a default value.
 * @since 1.18.0
 * @category computed
 */
export const getOrElse: {
  <B>(orElse: () => B): <E, A>(ref: RefRemoteData<E, A>) => Computed.Computed<never, never, A | B>
  <E, A, B>(ref: RefRemoteData<E, A>, orElse: () => B): Computed.Computed<never, never, A | B>
} = dual(2, <E, A, B>(ref: RefRemoteData<E, A>, orElse: () => B) => ref.map(RemoteData.getOrElse(orElse)))

/**
 * Get the success value or null.
 * @since 1.18.0
 * @category computed
 */
export const getOrNull = <E, A>(ref: RefRemoteData<E, A>): Computed.Computed<never, never, A | null> =>
  ref.map(RemoteData.getOrNull)

/**
 * Get the success value or undefined.
 * @since 1.18.0
 * @category computed
 */
export const getOrUndefined = <E, A>(ref: RefRemoteData<E, A>): Computed.Computed<never, never, A | undefined> =>
  ref.map(RemoteData.getOrUndefined)
