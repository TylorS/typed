/**
 * A RefRemoteData is a RefSubject that holds a RemoteData value.
 * @since 1.18.0
 */

import * as AsyncData from "@typed/async-data/AsyncData"
import type { Progress } from "@typed/async-data/Progress"
import type { IdentifierConstructor, IdentifierOf } from "@typed/context"
import type * as Computed from "@typed/fx/Computed"
import type * as Filtered from "@typed/fx/Filtered"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Sink from "@typed/fx/Sink"
import { RefSubjectTypeId } from "@typed/fx/TypeId"
import { Either, Option } from "effect"
import type { Exit } from "effect"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import type { Schedule } from "effect/Schedule"

/**
 * A RefAsyncData is a RefSubject that holds a AsyncData value.
 * @since 1.18.0
 * @category models
 */
export interface RefAsyncData<R, E, A> extends RefSubject.RefSubject<R, never, AsyncData.AsyncData<E, A>> {}

export namespace RefAsyncData {
  export interface Tagged<I, E, A> extends RefSubject.RefSubject.Tagged<I, never, AsyncData.AsyncData<E, A>> {}
}

/**
 * Create a RefRemoteData
 * @since 1.18.0
 * @category constructors
 */
export const make: <E, A>() => Effect.Effect<
  never,
  never,
  RefAsyncData<never, E, A>
> = <E, A>() => RefSubject.of(AsyncData.noData<E, A>(), AsyncData.getEquivalence())

/**
 * Create a Tagged RefRemoteData
 * @since 1.18.0
 * @category constructors
 */
export const tagged = <E, A>(): {
  <const I extends IdentifierConstructor<any>>(
    identifier: (id: <const T>(uniqueIdentifier: T) => IdentifierConstructor<T>) => I
  ): RefAsyncData.Tagged<IdentifierOf<I>, E, A>
  <const I>(identifier: I | string): RefAsyncData.Tagged<IdentifierOf<I>, E, A>
} => RefSubject.tagged<never, AsyncData.AsyncData<E, A>>()

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
        return yield* _(set(AsyncData.done(exit)))
      }), (current) => Effect.succeed(AsyncData.stopLoading(current)))
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
          return yield* _(set(AsyncData.done(exit)))
        }

        return initial
      }), (current) => Effect.succeed(AsyncData.stopLoading(current)))
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

export const mapInputEffect = <R, E, A, R2, B>(
  ref: RefAsyncData<R, E, A>,
  f: (b: B) => Effect.Effect<R2, E, A>
): Sink.WithContext<R | R2, E, B> => Sink.mapEffect(asSink(ref), f)

export const mapInput = <R, E, A, B>(
  ref: RefAsyncData<R, E, A>,
  f: (b: B) => A
): Sink.WithContext<R, E, B> => Sink.map(asSink(ref), f)

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
} = dual((args) => args.length === 3 || RefSubjectTypeId in args[0], <R, E, A>(
  ref: RefAsyncData<R, E, A>,
  cause: Cause.Cause<E>,
  options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
) => ref.set(AsyncData.failCause(cause, options)))

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
} = dual((args) => args.length === 3 || RefSubjectTypeId in args[0], <R, E, A>(
  ref: RefAsyncData<R, E, A>,
  error: E,
  options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
) => ref.set(AsyncData.fail(error, options)))

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
} = dual((args) => args.length === 3 || RefSubjectTypeId in args[0], <R, E, A>(
  ref: RefAsyncData<R, E, A>,
  value: A,
  options?: AsyncData.OptionalPartial<AsyncData.SuccessOptions>
) => ref.set(AsyncData.success(value, options)))

export const done: {
  <E, A>(exit: Exit.Exit<E, A>): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
  <R, E, A>(ref: RefAsyncData<R, E, A>, exit: Exit.Exit<E, A>): Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
} = dual((args) => args.length === 3 || RefSubjectTypeId in args[0], <R, E, A>(
  ref: RefAsyncData<R, E, A>,
  exit: Exit.Exit<E, A>
) => ref.set(AsyncData.done(exit)))

export const match: {
  <
    E1,
    A,
    R2 = never,
    E2 = never,
    B = never,
    R3 = never,
    E3 = never,
    C = never,
    R4 = never,
    E4 = never,
    D = never,
    R5 = never,
    E5 = never,
    F = never
  >(
    matchers: {
      NoData: (data: AsyncData.NoData) => Fx.FxInput<R2, E2, B>
      Loading: (data: AsyncData.Loading) => Fx.FxInput<R3, E3, C>
      Failure: (cause: Cause.Cause<E1>, data: AsyncData.Failure<E1>) => Fx.FxInput<R4, E4, D>
      Success: (value: A, data: AsyncData.Success<A>) => Fx.FxInput<R5, E5, F>
    }
  ): <R, E>(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, A>>
  ) => Fx.Fx<R | R2 | R3 | R4 | R5, E | E2 | E3 | E4 | E5, B | C | D | F>

  <
    R,
    E,
    E1,
    A,
    R2 = never,
    E2 = never,
    B = never,
    R3 = never,
    E3 = never,
    C = never,
    R4 = never,
    E4 = never,
    D = never,
    R5 = never,
    E5 = never,
    F = never
  >(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, A>>,
    matchers: {
      NoData: (data: AsyncData.NoData) => Fx.FxInput<R2, E2, B>
      Loading: (data: AsyncData.Loading) => Fx.FxInput<R3, E3, C>
      Failure: (cause: Cause.Cause<E1>, data: AsyncData.Failure<E1>) => Fx.FxInput<R4, E4, D>
      Success: (value: A, data: AsyncData.Success<A>) => Fx.FxInput<R5, E5, F>
    }
  ): Fx.Fx<R | R2 | R3 | R4 | R5, E | E2 | E3 | E4 | E5, B | C | D | F>
} = dual(2, <R, E, E1, A, R2, E2, B, R3, E3, C, R4, E4, D, R5, E5, F>(
  fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, A>>,
  matchers: {
    NoData: (data: AsyncData.NoData) => Fx.FxInput<R2, E2, B>
    Loading: (data: AsyncData.Loading) => Fx.FxInput<R3, E3, C>
    Failure: (cause: Cause.Cause<E1>, data: AsyncData.Failure<E1>) => Fx.FxInput<R4, E4, D>
    Success: (value: A, data: AsyncData.Success<A>) => Fx.FxInput<R5, E5, F>
  }
): Fx.Fx<R | R2 | R3 | R4 | R5, E | E2 | E3 | E4 | E5, B | C | D | F> => Fx.switchMap(fx, AsyncData.match(matchers)))

export const matchKeyed: {
  <
    E1,
    A,
    NoData extends Fx.FxInput<any, any, any>,
    Loading extends Fx.FxInput<any, any, any>,
    Failure extends Fx.FxInput<any, any, any>,
    Success extends Fx.FxInput<any, any, any>
  >(
    matchers: {
      NoData: () => NoData
      Loading: (data: LoadingComputed) => Loading
      Failure: (data: Computed.Computed<never, never, E1>, computed: FailureComputed<E1>) => Failure
      Success: (value: Computed.Computed<never, never, A>, computed: SuccessComputed) => Success
    }
  ): <R, E>(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, A>>
  ) => Fx.Fx<
    R | Fx.Fx.Context<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    E | Fx.Fx.Error<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    Fx.Fx.Success<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>
  >

  <
    R,
    E,
    E1,
    A,
    NoData extends Fx.FxInput<any, any, any>,
    Loading extends Fx.FxInput<any, any, any>,
    Failure extends Fx.FxInput<any, any, any>,
    Success extends Fx.FxInput<any, any, any>
  >(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, A>>,
    matchers: {
      NoData: () => NoData
      Loading: (data: LoadingComputed) => Loading
      Failure: (data: Computed.Computed<never, never, E1>, computed: FailureComputed<E1>) => Failure
      Success: (value: Computed.Computed<never, never, A>, computed: SuccessComputed) => Success
    }
  ): Fx.Fx<
    R | Fx.Fx.Context<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    E | Fx.Fx.Error<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    Fx.Fx.Success<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>
  >
} = dual(
  2,
  <
    R,
    E,
    E1,
    A,
    NoData extends Fx.FxInput<any, any, any>,
    Loading extends Fx.FxInput<any, any, any>,
    Failure extends Fx.FxInput<any, any, any>,
    Success extends Fx.FxInput<any, any, any>
  >(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, A>>,
    matchers: {
      NoData: () => NoData
      Loading: (data: LoadingComputed) => Loading
      Failure: (data: Computed.Computed<never, never, E1>, computed: FailureComputed<E1>) => Failure
      Success: (value: Computed.Computed<never, never, A>, computed: SuccessComputed) => Success
    }
  ): Fx.Fx<
    R | Fx.Fx.Context<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    E | Fx.Fx.Error<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>,
    Fx.Fx.Success<Fx.Fx.FromInput<NoData | Loading | Failure | Success>>
  > =>
    Fx.matchTags(fx, {
      NoData: () => matchers.NoData(),
      Loading: (ref) => matchers.Loading({ progress: ref.map((r) => r.progress) }),
      Failure: (ref) =>
        matchers.Failure(
          ref.mapEffect(({ cause }) =>
            Cause.failureOrCause(cause).pipe(Either.flip, Effect.catchAll(Effect.failCause))
          ),
          {
            cause: ref.map((r) => r.cause),
            refreshing: ref.map((r) => r.refreshing)
          }
        ),
      Success: (ref) =>
        matchers.Success(
          ref.map((r) => r.value),
          {
            refreshing: ref.map((r) => r.refreshing)
          }
        )
    })
)

export type LoadingComputed = {
  readonly progress: Computed.Computed<never, never, Option.Option<Progress>>
}

export type FailureComputed<E> = {
  readonly cause: Computed.Computed<never, never, Cause.Cause<E>>
  readonly refreshing: Computed.Computed<never, never, Option.Option<AsyncData.Loading>>
}

export type SuccessComputed = {
  readonly refreshing: Computed.Computed<never, never, Option.Option<AsyncData.Loading>>
}

export const getFailure = <R, E, A>(ref: RefAsyncData<R, E, A>): Filtered.Filtered<R, never, E> =>
  ref.filterMap(AsyncData.getFailure)

export const getSuccess = <R, E, A>(ref: RefAsyncData<R, E, A>): Filtered.Filtered<R, never, A> =>
  ref.filterMap(AsyncData.getSuccess)
