/**
 * A RefRemoteData is a RefSubject that holds a RemoteData value.
 * @since 1.18.0
 */

import type { IdentifierConstructor, IdentifierOf } from "@typed/context"
import type * as Computed from "@typed/fx/Computed"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import * as RemoteData from "@typed/remote-data"
import type * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import type * as Either from "effect/Either"
import type * as Exit from "effect/Exit"
import { dual } from "effect/Function"
import type * as Option from "effect/Option"

/**
 * A RefRemoteData is a RefSubject that holds a RemoteData value.
 * @since 1.18.0
 * @category models
 */
export interface RefRemoteData<R, E, A> extends RefSubject.RefSubject<R, never, RemoteData.RemoteData<E, A>> {}

/**
 * Create a RefRemoteData
 * @since 1.18.0
 * @category constructors
 */
export const make: <E, A>() => Effect.Effect<
  never,
  never,
  RefSubject.RefSubject<never, never, RemoteData.RemoteData<E, A>>
> = <E, A>() => RefSubject.of<RemoteData.RemoteData<E, A>>(RemoteData.noData)

/**
 * Create a Tagged RefRemoteData
 * @since 1.18.0
 * @category constructors
 */
export const tagged: <E, A>() => {
  <const I extends IdentifierConstructor<any>>(
    identifier: (id: <const T>(uniqueIdentifier: T) => IdentifierConstructor<T>) => I
  ): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, RemoteData.RemoteData<E, A>>

  <const I>(identifier: I): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, RemoteData.RemoteData<E, A>>
} = <E, A>() => RefSubject.tagged<never, RemoteData.RemoteData<E, A>>()

/**
 * Change the current value of a RefRemoteData to a loading or refreshing state.
 * @since 1.18.0
 * @category updates
 */
export const toLoading: <R, E, A>(
  ref: RefRemoteData<R, E, A>
) => Effect.Effect<R, never, RemoteData.RemoteData<E, A>> = <R, E, A>(ref: RefRemoteData<R, E, A>) =>
  ref.update(RemoteData.toLoading)

/**
 * Change the current value of a RefRemoteData to a non-loading/non-refreshing state.
 * @since 1.18.0
 * @category updates
 */
export const stopLoading: <R, E, A>(
  ref: RefRemoteData<R, E, A>
) => Effect.Effect<R, never, RemoteData.RemoteData<E, A>> = <R, E, A>(ref: RefRemoteData<R, E, A>) =>
  ref.update(RemoteData.stopLoading)

/**
 * Update the state with a failure cause.
 * @since 1.18.0
 * @category updates
 */
export const failCause: {
  <E>(
    cause: Cause.Cause<E>
  ): <R, A>(ref: RefRemoteData<R, E, A>) => Effect.Effect<R, never, RemoteData.RemoteData<E, A>>
  <R, E, A>(
    ref: RefRemoteData<R, E, A>,
    cause: Cause.Cause<E>
  ): Effect.Effect<R, never, RemoteData.RemoteData<E, A>>
} = dual(
  2,
  <R, E, A>(ref: RefRemoteData<R, E, A>, cause: Cause.Cause<E>) => ref.set(RemoteData.failCause(cause))
)

/**
 * Update the state with a failure.
 * @since 1.18.0
 * @category updates
 */
export const fail: {
  <E>(error: E): <R, A>(ref: RefRemoteData<R, E, A>) => Effect.Effect<R, never, RemoteData.RemoteData<E, A>>
  <R, E, A>(ref: RefRemoteData<R, E, A>, error: E): Effect.Effect<R, never, RemoteData.RemoteData<E, A>>
} = dual(2, <R, E, A>(ref: RefRemoteData<R, E, A>, error: E) => ref.set(RemoteData.fail(error)))

/**
 * Update the state with a success.
 * @since 1.18.0
 * @category updates
 */
export const succeed: {
  <A>(value: A): <R, E>(ref: RefRemoteData<R, E, A>) => Effect.Effect<R, never, RemoteData.RemoteData<E, A>>
  <R, E, A>(ref: RefRemoteData<R, E, A>, value: A): Effect.Effect<R, never, RemoteData.RemoteData<E, A>>
} = dual(2, <R, E, A>(ref: RefRemoteData<R, E, A>, value: A) => ref.set(RemoteData.succeed(value)))

/**
 * Returns true if the current state is NoData.
 * @since 1.18.0
 * @category computed
 */
export const isNoData = <R, E, A>(ref: RefRemoteData<R, E, A>): Computed.Computed<R, never, boolean> =>
  ref.map(RemoteData.isNoData)

/**
 * Returns true if the current state is Loading.
 * @since 1.18.0
 * @category computed
 */
export const isLoading = <R, E, A>(ref: RefRemoteData<R, E, A>): Computed.Computed<R, never, boolean> =>
  ref.map(RemoteData.isLoading)

/**
 * Returns true if the current state is Failure.
 * @since 1.18.0
 * @category computed
 */
export const isFailure = <R, E, A>(ref: RefRemoteData<R, E, A>): Computed.Computed<R, never, boolean> =>
  ref.map(RemoteData.isFailure)

/**
 * Returns true if the current state is Success.
 * @since 1.18.0
 * @category computed
 */
export const isSuccess = <R, E, A>(ref: RefRemoteData<R, E, A>): Computed.Computed<R, never, boolean> =>
  ref.map(RemoteData.isSuccess)

/**
 * Returns true if the current state is refreshing.
 * @since 1.18.0
 * @category computed
 */
export const isRefreshing = <R, E, A>(ref: RefRemoteData<R, E, A>): Computed.Computed<R, never, boolean> =>
  ref.map(RemoteData.isRefreshing)

/**
 * Returns true if the current state is loading or refreshing.
 * @since 1.18.0
 * @category computed
 */
export const isLoadingOrRefreshing = <R, E, A>(ref: RefRemoteData<R, E, A>): Computed.Computed<R, never, boolean> =>
  ref.map(RemoteData.isLoadingOrRefreshing)

/**
 * Update that state with an Either
 * @since 1.18.0
 * @category updates
 */
export const setEither: {
  <R, E, A>(
    either: Either.Either<E, A>
  ): (ref: RefRemoteData<R, E, A>) => Effect.Effect<R, never, RemoteData.RemoteData<E, A>>
  <R, E, A>(
    ref: RefRemoteData<R, E, A>,
    either: Either.Either<E, A>
  ): Effect.Effect<R, never, RemoteData.RemoteData<E, A>>
} = dual(
  2,
  <R, E, A>(ref: RefRemoteData<R, E, A>, either: Either.Either<E, A>) => ref.set(RemoteData.fromEither(either))
)

/**
 * Update that state with an Option
 * @since 1.18.0
 * @category updates
 */
export const setOption: {
  <A>(
    option: Option.Option<A>
  ): <R, E>(ref: RefRemoteData<R, E, A>) => Effect.Effect<R, never, RemoteData.RemoteData<E, A>>
  <R, E, A>(
    ref: RefRemoteData<R, E, A>,
    option: Option.Option<A>
  ): Effect.Effect<R, never, RemoteData.RemoteData<E, A>>
} = dual(2, <R, E, A>(ref: RefRemoteData<R, E, A>, option: Option.Option<A>) => ref.set(RemoteData.fromOption(option)))

/**
 * Update that state with an Exit
 * @since 1.18.0
 * @category updates
 */
export const done: {
  <E, A>(
    either: Exit.Exit<E, A>
  ): <R>(ref: RefRemoteData<R, E, A>) => Effect.Effect<R, never, RemoteData.RemoteData<E, A>>
  <R, E, A>(
    ref: RefRemoteData<R, E, A>,
    exit: Exit.Exit<E, A>
  ): Effect.Effect<R, never, RemoteData.RemoteData<E, A>>
} = dual(2, <R, E, A>(ref: RefRemoteData<R, E, A>, exit: Exit.Exit<E, A>) => ref.set(RemoteData.fromExit(exit)))

/**
 * Extract the success value from a RefRemoteData
 * @since 1.18.0
 * @category computed
 */
export const toOption = <R, E, A>(ref: RefRemoteData<R, E, A>): Computed.Computed<R, never, Option.Option<A>> =>
  ref.map(RemoteData.toOption)

/**
 * Extract the error value from a RefRemoteData
 * @since 1.18.0
 * @category computed
 */
export const toOptionError = <R, E, A>(
  ref: RefRemoteData<R, E, A>
): Computed.Computed<R, never, Option.Option<E>> => ref.map(RemoteData.toOptionError)

/**
 * map the success value of a RefRemoteData
 * @since 1.18.0
 * @category computed
 */
export const map: {
  <A, B>(
    f: (a: A) => B
  ): <R, E>(ref: RefRemoteData<R, E, A>) => Computed.Computed<R, never, RemoteData.RemoteData<E, B>>
  <R, E, A, B>(ref: RefRemoteData<R, E, A>, f: (a: A) => B): Computed.Computed<R, never, RemoteData.RemoteData<E, B>>
} = dual(2, <R, E, A, B>(ref: RefRemoteData<R, E, A>, f: (a: A) => B) => ref.map(RemoteData.map(f)))

/**
 * map the error value of a RefRemoteData
 * @since 1.18.0
 * @category computed
 */
export const mapError: {
  <E, E2>(
    f: (e: E) => E2
  ): <R, A>(ref: RefRemoteData<R, E, A>) => Computed.Computed<R, never, RemoteData.RemoteData<E2, A>>
  <R, E, A, E2>(
    ref: RefRemoteData<R, E, A>,
    f: (e: E) => E2
  ): Computed.Computed<R, never, RemoteData.RemoteData<E2, A>>
} = dual(2, <R, E, A, E2>(ref: RefRemoteData<R, E, A>, f: (e: E) => E2) => ref.map(RemoteData.mapError(f)))

/**
 * map the cause value of a RefRemoteData
 * @since 1.18.0
 * @category computed
 */
export const mapErrorCause: {
  <E, E2>(
    f: (e: Cause.Cause<E>) => Cause.Cause<E2>
  ): <R, A>(ref: RefRemoteData<R, E, A>) => Computed.Computed<R, never, RemoteData.RemoteData<E2, A>>
  <R, E, A, E2>(
    ref: RefRemoteData<R, E, A>,
    f: (e: Cause.Cause<E>) => Cause.Cause<E2>
  ): Computed.Computed<R, never, RemoteData.RemoteData<E2, A>>
} = dual(
  2,
  <R, E, A, E2>(ref: RefRemoteData<R, E, A>, f: (e: Cause.Cause<E>) => Cause.Cause<E2>) =>
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
    (data): Fx.Fx<R2, E2, RemoteData.RemoteData<E1 | E3, B>> =>
      RemoteData.isSuccess(data) ? f(data.value) : Effect.succeed(data)
  )
})

/**
 * Get the success value or a default value.
 * @since 1.18.0
 * @category computed
 */
export const getOrElse: {
  <B>(orElse: () => B): <R, E, A>(ref: RefRemoteData<R, E, A>) => Computed.Computed<R, never, A | B>
  <R, E, A, B>(ref: RefRemoteData<R, E, A>, orElse: () => B): Computed.Computed<R, never, A | B>
} = dual(2, <R, E, A, B>(ref: RefRemoteData<R, E, A>, orElse: () => B) => ref.map(RemoteData.getOrElse(orElse)))

/**
 * Get the success value or null.
 * @since 1.18.0
 * @category computed
 */
export const getOrNull = <R, E, A>(ref: RefRemoteData<R, E, A>): Computed.Computed<R, never, A | null> =>
  ref.map(RemoteData.getOrNull)

/**
 * Get the success value or undefined.
 * @since 1.18.0
 * @category computed
 */
export const getOrUndefined = <R, E, A>(ref: RefRemoteData<R, E, A>): Computed.Computed<R, never, A | undefined> =>
  ref.map(RemoteData.getOrUndefined)
