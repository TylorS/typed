/**
 * AsyncData represents a piece of data which is acquired asynchronously with loading, failure, and progress states
 * in addition to Option-like states of NoData and Success.
 *
 * @since 1.0.0
 */

import type { Effect } from "effect"
import * as Cause from "effect/Cause"
import * as Data from "effect/Data"
import * as Duration from "effect/Duration"
import * as Either from "effect/Either"
import * as Equal from "effect/Equal"
import * as Equivalence from "effect/Equivalence"
import * as Exit from "effect/Exit"
import { dual } from "effect/Function"
import * as Option from "effect/Option"
import * as Unify from "effect/Unify"
import * as internal from "./internal/async-data.js"
import { FAILURE_TAG, LOADING_TAG, NO_DATA_TAG, OPTIMISTIC_TAG, SUCCESS_TAG } from "./internal/tag.js"
import * as Progress from "./Progress.js"
import { AsyncDataTypeId } from "./TypeId.js"

const getCurrentTimestamp = () => Date.now()

/**
 * AsyncData represents a piece of data which is acquired asynchronously with loading, failure, and progress states
 * in addition to Option-like states of NoData and Success.
 *
 * @since 1.0.0
 */
export type AsyncData<E, A> = NoData | Loading | Failure<E> | Success<A> | Optimistic<E, A>

/**
 * @since 1.0.0
 */
export namespace AsyncData {
  /**
   * @since 1.0.0
   */
  export type Error<T> = [T] extends [AsyncData<infer E, infer _>] ? E : never

  /**
   * @since 1.0.0
   */
  export type Success<T> = [T] extends [AsyncData<infer _, infer A>] ? A : never

  /**
   * @category models
   * @since 1.0.0
   */
  export interface Unify<A extends { [Unify.typeSymbol]?: any }> extends Effect.EffectUnify<A> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    AsyncData: () => Unify_<A[Unify.typeSymbol]> extends AsyncData<infer E0, infer A0> | infer _ ? AsyncData<E0, A0>
      : never
  }

  type Unify_<T extends AsyncData<any, any>> = T extends NoData ? AsyncData<never, never> :
    T extends Loading ? AsyncData<never, never> :
    T extends Failure<infer E> ? AsyncData<E, never>
    : T extends Success<infer A> ? AsyncData<never, A>
    : never

  /**
   * @category models
   * @since 1.0.0
   */
  export interface IgnoreList extends Effect.EffectUnifyIgnore {
    Effect: true
  }
}

/**
 * @since 1.0.0
 */
export class NoData extends Data.TaggedError(NO_DATA_TAG)<{}> {
  /**
   * @since 1.0.0
   */
  readonly [AsyncDataTypeId]: AsyncDataTypeId = AsyncDataTypeId

  /**
   * @since 1.0.0
   */
  readonly [Unify.typeSymbol]!: unknown
  /**
   * @since 1.0.0
   */
  readonly [Unify.unifySymbol]!: AsyncData.Unify<this>
  /**
   * @since 1.0.0
   */
  readonly [Unify.ignoreSymbol]!: AsyncData.IgnoreList
}

/**
 * @since 1.0.0
 */
export const noData: {
  (): NoData
  <E, A>(): AsyncData<E, A>
} = (): NoData => new NoData()

/**
 * @since 1.0.0
 */
export class Loading extends Data.TaggedError(LOADING_TAG)<LoadingOptions> {
  /**
   * @since 1.0.0
   */
  readonly [AsyncDataTypeId]: AsyncDataTypeId = AsyncDataTypeId

  /**
   * @since 1.0.0
   */
  readonly [Unify.typeSymbol]!: unknown
  /**
   * @since 1.0.0
   */
  readonly [Unify.unifySymbol]!: AsyncData.Unify<this>
  /**
   * @since 1.0.0
   */
  readonly [Unify.ignoreSymbol]!: AsyncData.IgnoreList
}

/**
 * @since 1.0.0
 */
export type LoadingOptions = {
  readonly timestamp: number // Date.now()
  readonly progress: Option.Option<Progress.Progress>
}

/**
 * @since 1.0.0
 */
export type OptionalPartial<A> = [
  {
    [K in keyof A]+?: [A[K]] extends [Option.Option<infer R>] ? R | undefined : A[K]
  }
] extends [infer R] ? { readonly [K in keyof R]: R[K] } : never

/**
 * @since 1.0.0
 */
export const loading: {
  (options?: OptionalPartial<LoadingOptions>): Loading
  <E, A>(options?: OptionalPartial<LoadingOptions>): AsyncData<E, A>
} = (options?: OptionalPartial<LoadingOptions>): Loading =>
  new Loading({
    [AsyncDataTypeId]: AsyncDataTypeId,
    timestamp: options?.timestamp ?? getCurrentTimestamp(),
    progress: Option.fromNullable(options?.progress)
  } as any)

/**
 * @since 1.0.0
 */
export interface Failure<out E> extends Effect.Effect<never, E, never> {
  readonly [AsyncDataTypeId]: AsyncDataTypeId

  /**
   * @since 1.18.0
   */
  readonly _tag: typeof FAILURE_TAG

  /**
   * @since 1.18.0
   */
  readonly cause: Cause.Cause<E>

  /**
   * @since 1.20.0
   */
  readonly timestamp: number // Date.now()

  /**
   * @since 1.18.0
   */
  readonly refreshing: Option.Option<Loading>

  /**
   * @since 1.18.0
   */
  readonly [Unify.typeSymbol]: unknown

  /**
   * @since 1.18.0
   */
  readonly [Unify.unifySymbol]: AsyncData.Unify<this>

  /**
   * @since 1.18.0
   */
  readonly [Unify.ignoreSymbol]: AsyncData.IgnoreList
}

/**
 * @since 1.0.0
 */
export type FailureOptions = {
  readonly timestamp: number // Date.now()
  readonly refreshing: Option.Option<Loading>
}

/**
 * @since 1.0.0
 */
export const failCause: {
  <E>(cause: Cause.Cause<E>, options?: OptionalPartial<FailureOptions>): Failure<E>
  <E, A>(cause: Cause.Cause<E>, options?: OptionalPartial<FailureOptions>): AsyncData<E, A>
} = <E>(cause: Cause.Cause<E>, options?: OptionalPartial<FailureOptions>): Failure<E> =>
  new internal.FailureImpl(
    cause,
    options?.timestamp ?? getCurrentTimestamp(),
    Option.fromNullable(options?.refreshing)
  ) as any

/**
 * @since 1.0.0
 */
export const fail: {
  <E>(error: E, options?: OptionalPartial<FailureOptions>): Failure<E>
  <E, A>(error: E, options?: OptionalPartial<FailureOptions>): AsyncData<E, A>
} = <E>(error: E, options?: OptionalPartial<FailureOptions>): Failure<E> => failCause<E>(Cause.fail(error), options)

/**
 * @since 1.0.0
 */
export interface Success<out A> extends Effect.Effect<never, never, A> {
  readonly [AsyncDataTypeId]: AsyncDataTypeId

  readonly _tag: typeof SUCCESS_TAG
  readonly value: A
  /**
   * @since 1.20.0
   */
  readonly timestamp: number // Date.now()
  readonly refreshing: Option.Option<Loading>

  readonly [Unify.typeSymbol]: unknown
  readonly [Unify.unifySymbol]: AsyncData.Unify<this>
  readonly [Unify.ignoreSymbol]: AsyncData.IgnoreList
}

/**
 * @since 1.0.0
 */
export type SuccessOptions = {
  readonly timestamp: number // Date.now()
  readonly refreshing: Option.Option<Loading>
}

/**
 * @since 1.0.0
 */
export const success: {
  <A>(value: A, options?: OptionalPartial<SuccessOptions>): Success<A>
  <E, A>(value: A, options?: OptionalPartial<SuccessOptions>): AsyncData<E, A>
} = <A>(value: A, options?: OptionalPartial<SuccessOptions>): Success<A> =>
  new internal.SuccessImpl(
    value,
    options?.timestamp ?? getCurrentTimestamp(),
    Option.fromNullable(options?.refreshing)
  ) as any

/**
 * @since 1.0.0
 */
export interface Optimistic<E, A> extends Effect.Effect<never, never, A> {
  readonly [AsyncDataTypeId]: AsyncDataTypeId
  readonly _tag: "Optimistic"
  readonly value: A
  readonly timestamp: number // Date.now()
  readonly previous: AsyncData<E, A>

  readonly [Unify.typeSymbol]: unknown
  readonly [Unify.unifySymbol]: AsyncData.Unify<this>
  readonly [Unify.ignoreSymbol]: AsyncData.IgnoreList
}

/**
 * @since 1.0.0
 */
export interface OptimisticOptions {
  readonly timestamp: number // Date.now()
}

const isAsyncDataFirst = (args: IArguments) => isAsyncData(args[0])

/**
 * @since 1.0.0
 */
export const optimistic: {
  <A>(value: A, options?: OptionalPartial<OptimisticOptions>): <E>(previous: AsyncData<E, A>) => Optimistic<E, A>
  <E, A>(previous: AsyncData<E, A>, value: A, options?: OptionalPartial<OptimisticOptions>): Optimistic<E, A>
} = dual(
  (args) => args.length === 3 || isAsyncDataFirst(args),
  <E, A>(previous: AsyncData<E, A>, value: A, options?: OptionalPartial<OptimisticOptions>): Optimistic<E, A> =>
    new internal.OptimisticImpl(
      value,
      options?.timestamp ?? getCurrentTimestamp(),
      // We don't want to nest Optimistic values, so we unwrap the previous value if it's already optimistic
      previous._tag === "Optimistic" ? previous.previous : previous
    ) as any
)

/**
 * @since 1.0.0
 */
export const isSuccess = <E, A>(data: AsyncData<E, A>): data is Success<A> => data._tag === SUCCESS_TAG

/**
 * @since 1.0.0
 */
export const isOptimistic = <E, A>(data: AsyncData<E, A>): data is Optimistic<E, A> => data._tag === OPTIMISTIC_TAG

/**
 * @since 1.0.0
 */
export const isFailure = <E, A>(data: AsyncData<E, A>): data is Failure<E> => data._tag === FAILURE_TAG

/**
 * @since 1.0.0
 */
export const isLoading = <E, A>(data: AsyncData<E, A>): data is Loading => data._tag === LOADING_TAG

/**
 * @since 1.0.0
 */
export const isNoData = <E, A>(data: AsyncData<E, A>): data is NoData => data._tag === NO_DATA_TAG

/**
 * @since 1.0.0
 */
export type Refreshing<E, A> = RefreshingFailure<E> | RefreshingSuccess<A>

/**
 * @since 1.0.0
 */
export interface RefreshingFailure<E> extends Failure<E> {
  readonly refreshing: Option.Some<Loading>
}

/**
 * @since 1.0.0
 */
export interface RefreshingSuccess<A> extends Success<A> {
  readonly refreshing: Option.Some<Loading>
}

/**
 * @since 1.0.0
 */
export const isRefreshing = <E, A>(data: AsyncData<E, A>): data is Refreshing<E, A> =>
  isSuccess(data) || isFailure(data)
    ? Option.isSome(data.refreshing)
    : isOptimistic(data)
    ? isRefreshing(data.previous)
    : false

/**
 * @since 1.0.0
 */
export const isLoadingOrRefreshing = <E, A>(data: AsyncData<E, A>): data is Loading | Refreshing<E, A> =>
  isLoading(data) || isRefreshing(data) || (isOptimistic(data) && isLoadingOrRefreshing(data.previous))

/**
 * @since 1.0.0
 */
export const match: {
  <E, A, R1, R2, R3, R4, R5>(
    matchers: {
      NoData: (data: NoData) => R1
      Loading: (data: Loading) => R2
      Failure: (cause: Cause.Cause<E>, data: Failure<E>) => R3
      Success: (value: A, data: Success<A>) => R4
      Optimistic: (value: A, data: Optimistic<E, A>) => R5
    }
  ): (data: AsyncData<E, A>) => Unify.Unify<R1 | R2 | R3 | R4 | R5>

  <E, A, R1, R2, R3, R4, R5>(
    data: AsyncData<E, A>,
    matchers: {
      NoData: (data: NoData) => R1
      Loading: (data: Loading) => R2
      Failure: (cause: Cause.Cause<E>, data: Failure<E>) => R3
      Success: (value: A, data: Success<A>) => R4
      Optimistic: (value: A, data: Optimistic<E, A>) => R5
    }
  ): Unify.Unify<R1 | R2 | R3 | R4 | R5>
} = dual(2, <E, A, R1, R2, R3, R4, R5>(data: AsyncData<E, A>, matchers: {
  NoData: (data: NoData) => R1
  Loading: (data: Loading) => R2
  Failure: (cause: Cause.Cause<E>, data: Failure<E>) => R3
  Success: (value: A, data: Success<A>) => R4
  Optimistic: (value: A, data: Optimistic<E, A>) => R5
}): Unify.Unify<R1 | R2 | R3 | R4> => {
  if (isSuccess(data)) {
    return matchers.Success(data.value, data) as Unify.Unify<R1 | R2 | R3 | R4>
  } else if (isFailure(data)) {
    return matchers.Failure(data.cause, data) as Unify.Unify<R1 | R2 | R3 | R4>
  } else if (isLoading(data)) {
    return matchers.Loading(data) as Unify.Unify<R1 | R2 | R3 | R4>
  } else if (isNoData(data)) {
    return matchers.NoData(data) as Unify.Unify<R1 | R2 | R3 | R4>
  } else {
    return matchers.Optimistic(data.value, data) as Unify.Unify<R1 | R2 | R3 | R4>
  }
})

/**
 * @since 1.0.0
 */
export const map: {
  <A, B>(f: (a: A) => B): <E>(data: AsyncData<E, A>) => AsyncData<E, B>
  <E, A, B>(data: AsyncData<E, A>, f: (a: A) => B): AsyncData<E, B>
} = dual(2, function map<E, A, B>(data: AsyncData<E, A>, f: (a: A) => B): AsyncData<E, B> {
  if (isSuccess(data)) {
    return success(f(data.value), {
      timestamp: data.timestamp,
      refreshing: Option.getOrUndefined(data.refreshing)
    })
  } else if (isOptimistic(data)) {
    return optimistic(map(data.previous, f), f(data.value), { timestamp: data.timestamp })
  } else {
    return data
  }
})

/**
 * @since 1.0.0
 */
export const flatMap: {
  <E, A, E2, B>(
    f: (a: A, data: Success<A> | Optimistic<E, A>) => AsyncData<E2, B>
  ): (data: AsyncData<E, A>) => AsyncData<E | E2, B>
  <E, A, E2, B>(
    data: AsyncData<E, A>,
    f: (a: A, data: Success<A> | Optimistic<E, A>) => AsyncData<E, B>
  ): AsyncData<E | E2, B>
} = dual(
  2,
  function<E, A, E2, B>(
    data: AsyncData<E, A>,
    f: (a: A, data: Success<A> | Optimistic<E, A>) => AsyncData<E2, B>
  ): AsyncData<E | E2, B> {
    if (isSuccess(data) || isOptimistic(data)) {
      return f(data.value, data)
    } else {
      return data
    }
  }
)

/**
 * @since 1.0.0
 */
export const startLoading = <E, A>(data: AsyncData<E, A>): AsyncData<E, A> => {
  if (isSuccess(data)) {
    return Option.isSome(data.refreshing) ? data : success(data.value, { ...data, refreshing: loading() })
  } else if (isFailure(data)) {
    return Option.isSome(data.refreshing)
      ? data
      : failCause(data.cause, { ...data, refreshing: loading() })
  } else if (isOptimistic(data)) {
    return optimistic(startLoading(data.previous), data.value, data)
  } else {
    return loading()
  }
}

/**
 * @since 1.0.0
 */
export const stopLoading = <E, A>(data: AsyncData<E, A>): AsyncData<E, A> => {
  if (isSuccess(data)) {
    return Option.isSome(data.refreshing) ? success(data.value) : data
  } else if (isFailure(data)) {
    return Option.isSome(data.refreshing) ? failCause(data.cause) : data
  } else if (isOptimistic(data)) {
    return optimistic(stopLoading(data.previous), data.value, data)
  } else {
    return noData()
  }
}

/**
 * @since 1.0.0
 */
export const isAsyncData: <E, A>(u: unknown) => u is AsyncData<E, A> = internal.isAsyncData

/**
 * @since 1.0.0
 */
export const done = <E, A>(exit: Exit.Exit<E, A>): AsyncData<E, A> =>
  Exit.match(exit, {
    onFailure: (cause) => failCause(cause),
    onSuccess: (value) => success(value)
  })

/**
 * @since 1.0.0
 */
export const getFailure = <E, A>(data: AsyncData<E, A>): Option.Option<E> =>
  isFailure(data) ? Cause.failureOption(data.cause) : Option.none()

/**
 * @since 1.0.0
 */
export const getSuccess = <E, A>(data: AsyncData<E, A>): Option.Option<A> =>
  isSuccess(data) || isOptimistic(data) ? Option.some(data.value) : Option.none()

const optionProgressEq = Option.getEquivalence(Progress.equals)

const loadingEquivalence: Equivalence.Equivalence<Loading> = Equivalence.struct({
  _tag: Equivalence.string,
  timestamp: Equivalence.number,
  progress: optionProgressEq
})

const optionLoadingEq = Option.getEquivalence(loadingEquivalence)

const failureEquivalence: Equivalence.Equivalence<Failure<any>> = Equivalence.struct({
  _tag: Equivalence.string,
  cause: Equal.equals,
  timestamp: Equivalence.number,
  refreshing: optionLoadingEq
})

const successEquivalence = <A>(valueEq: Equivalence.Equivalence<A>): Equivalence.Equivalence<Success<A>> =>
  Equivalence.struct({
    _tag: Equivalence.string,
    value: valueEq,
    timestamp: Equivalence.number,
    refreshing: optionLoadingEq
  })

const optimisticEquivalence = <E, A>(
  valueEq: Equivalence.Equivalence<A>
): Equivalence.Equivalence<Optimistic<E, A>> => {
  let previousEq: Equivalence.Equivalence<AsyncData<E, A>> | undefined
  const get = () => {
    if (previousEq === undefined) {
      previousEq = getEquivalence(valueEq)
    }
    return previousEq
  }

  return Equivalence.struct({
    _tag: Equivalence.string,
    value: valueEq,
    timestamp: Equivalence.number,
    previous: (a, b) => get()(a, b)
  })
}

/**
 * @since 1.0.0
 */
export const getEquivalence = <E, A>(
  valueEq: Equivalence.Equivalence<A> = Equal.equals
): Equivalence.Equivalence<AsyncData<E, A>> => {
  const successEq_ = successEquivalence(valueEq)
  const optimisticEq_ = optimisticEquivalence(valueEq)
  return (a, b) => {
    if (a === b) return true

    return match(a, {
      NoData: () => isNoData(b),
      Loading: (l1) => isLoading(b) ? loadingEquivalence(l1, b) : false,
      Failure: (_, f1) => isFailure(b) ? failureEquivalence(f1, b) : false,
      Success: (_, s1) => isSuccess(b) ? successEq_(s1, b) : false,
      Optimistic: (_, o1) => isOptimistic(b) ? optimisticEq_(o1, b) : false
    })
  }
}

/**
 * @since 1.0.0
 */
export function fromExit<E, A>(exit: Exit.Exit<E, A>): AsyncData<E, A> {
  return Exit.match(exit, {
    onFailure: (cause) => failCause(cause),
    onSuccess: (value) => success(value)
  })
}

/**
 * @since 1.0.0
 */
export function fromEither<E, A>(either: Either.Either<E, A>): AsyncData<E, A> {
  return Either.match(either, {
    onLeft: (e) => fail(e),
    onRight: (a) => success(a)
  })
}

/**
 * @since 1.0.0
 */
export const isExpired: {
  (ttl: Duration.DurationInput, now?: number): <E, A>(data: AsyncData<E, A>) => boolean
  <E, A>(data: AsyncData<E, A>, ttl: Duration.DurationInput, now?: number): boolean
} = dual(isAsyncDataFirst, function isExpired<E, A>(
  data: AsyncData<E, A>,
  ttl: Duration.DurationInput,
  now: number = getCurrentTimestamp()
): boolean {
  return match(data, {
    NoData: () => true,
    Loading: ({ timestamp }) => isPastTTL(timestamp, ttl, now),
    Failure: (_, f) =>
      Option.isNone(f.refreshing)
        ? isPastTTL(f.timestamp, ttl, now)
        : isPastTTL(f.refreshing.value.timestamp, ttl, now),
    Success: (_, s) =>
      Option.isNone(s.refreshing)
        ? isPastTTL(s.timestamp, ttl, now) :
        isPastTTL(s.refreshing.value.timestamp, ttl, now),
    Optimistic: (_, o) =>
      isPastTTL(o.timestamp, ttl, now) || (o.previous._tag === NO_DATA_TAG ? false : isExpired(o.previous, ttl, now))
  })
})

function isPastTTL(timestamp: number, ttl: Duration.DurationInput, now: number): boolean {
  const millis = Duration.toMillis(ttl)

  return now - timestamp >= millis
}

/**
 * Checks if two AsyncData are equal, disregarding the timestamps associated with them. Useful for testing
 * without needing to manage timestamps.
 *
 * @since 1.0.0
 */
export function dataEqual<E, A>(first: AsyncData<E, A>, second: AsyncData<E, A>): boolean {
  return match(first, {
    NoData: () => isNoData(second),
    Loading: (l) => isLoading(second) && Equal.equals(l.progress, second.progress),
    Failure: (_, f1) =>
      isFailure(second) && Equal.equals(f1.cause, second.cause) && Equal.equals(f1.refreshing, second.refreshing),
    Success: (_, s1) =>
      isSuccess(second) && Equal.equals(s1.value, second.value) && Equal.equals(s1.refreshing, second.refreshing),
    Optimistic: (_, o1) =>
      isOptimistic(second) && Equal.equals(o1.value, second.value) && dataEqual(o1.previous, second.previous)
  })
}
