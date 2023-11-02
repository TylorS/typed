import {
  currentTimestamp,
  FailureImpl,
  hasDataOptions,
  hasEquality,
  isTaggedRecord,
  SuccessImpl
} from "@typed/async-data/internal/async-data"
import * as Progress from "@typed/async-data/Progress"
import type { Effect } from "effect"
import { Cause, Data, Duration, Equal, Equivalence, Exit, Option, Unify } from "effect"
import { dual } from "effect/Function"

export const NO_DATA_TAG = "NoData" as const

export const LOADING_TAG = "Loading" as const

export const FAILURE_TAG = "Failure" as const

export const SUCCESS_TAG = "Success" as const

export type AsyncData<E, A> = NoData | Loading | Failure<E> | Success<A>

export namespace AsyncData {
  export type Error<T> = [T] extends [AsyncData<infer E, infer _>] ? E : never

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
  export interface UnifyBlackList extends Effect.EffectUnifyBlacklist {
    Effect: true
  }
}

export interface NoDataOptions {
  readonly timestamp: bigint // Clock.currentTimeNanos
}

export class NoData extends Data.TaggedError(NO_DATA_TAG)<NoDataOptions> {
  [Unify.typeSymbol]!: unknown;
  [Unify.unifySymbol]!: AsyncData.Unify<this>;
  [Unify.blacklistSymbol]!: AsyncData.UnifyBlackList
}

export const noData: {
  (): NoData
  <E, A>(): AsyncData<E, A>
} = (options?: NoDataOptions): NoData =>
  new NoData({
    timestamp: options?.timestamp ?? currentTimestamp()
  })

export class Loading extends Data.TaggedError(LOADING_TAG)<LoadingOptions> {
  [Unify.typeSymbol]!: unknown;
  [Unify.unifySymbol]!: AsyncData.Unify<this>;
  [Unify.blacklistSymbol]!: AsyncData.UnifyBlackList
}

export type LoadingOptions = {
  readonly timestamp: bigint // Clock.currentTimeNanos
  readonly progress: Option.Option<Progress.Progress>
}

export type OptionalPartial<A> = {
  [K in keyof A]+?: [A[K]] extends [Option.Option<infer R>] ? R | undefined : A[K]
}

export const loading: {
  (options?: OptionalPartial<LoadingOptions>): Loading
  <E, A>(options?: OptionalPartial<LoadingOptions>): AsyncData<E, A>
} = (options?: OptionalPartial<LoadingOptions>): Loading =>
  new Loading({
    timestamp: options?.timestamp || currentTimestamp(),
    progress: Option.fromNullable(options?.progress)
  })

export interface Failure<E> extends Effect.Effect<never, E, never> {
  readonly _tag: typeof FAILURE_TAG
  readonly cause: Cause.Cause<E>
  readonly timestamp: bigint // Clock.currentTimeNanos
  readonly refreshing: Option.Option<Loading>

  readonly [Unify.typeSymbol]: unknown
  readonly [Unify.unifySymbol]: AsyncData.Unify<this>
  readonly [Unify.blacklistSymbol]: AsyncData.UnifyBlackList
}

export type FailureOptions = {
  readonly timestamp: bigint // Clock.currentTimeNanos
  readonly refreshing: Option.Option<Loading>
}

export const failCause: {
  <E>(cause: Cause.Cause<E>, options?: OptionalPartial<FailureOptions>): Failure<E>
  <E, A>(cause: Cause.Cause<E>, options?: OptionalPartial<FailureOptions>): AsyncData<E, A>
} = <E>(cause: Cause.Cause<E>, options?: OptionalPartial<FailureOptions>): Failure<E> =>
  new FailureImpl(cause, options?.timestamp || currentTimestamp(), Option.fromNullable(options?.refreshing))

export const fail: {
  <E>(error: E, options?: OptionalPartial<FailureOptions>): Failure<E>
  <E, A>(error: E, options?: OptionalPartial<FailureOptions>): AsyncData<E, A>
} = <E>(error: E, options?: OptionalPartial<FailureOptions>): Failure<E> => failCause<E>(Cause.fail(error), options)

export interface Success<A> extends Effect.Effect<never, never, A> {
  readonly _tag: typeof SUCCESS_TAG
  readonly value: A
  readonly timestamp: bigint // Clock.currentTimeNanos
  readonly refreshing: Option.Option<Loading>
}

export type SuccessOptions = {
  readonly timestamp: bigint // Clock.currentTimeNanos
  readonly refreshing: Option.Option<Loading>
}

export const success: {
  <A>(value: A, options?: OptionalPartial<SuccessOptions>): Success<A>
  <E, A>(value: A, options?: OptionalPartial<SuccessOptions>): AsyncData<E, A>
} = <A>(value: A, options?: OptionalPartial<SuccessOptions>): Success<A> =>
  new SuccessImpl(value, options?.timestamp || currentTimestamp(), Option.fromNullable(options?.refreshing))

export const isSuccess = <E, A>(data: AsyncData<E, A>): data is Success<A> => data._tag === SUCCESS_TAG

export const isFailure = <E, A>(data: AsyncData<E, A>): data is Failure<E> => data._tag === FAILURE_TAG

export const isLoading = <E, A>(data: AsyncData<E, A>): data is Loading => data._tag === LOADING_TAG

export const isNoData = <E, A>(data: AsyncData<E, A>): data is NoData => data._tag === NO_DATA_TAG

export type Refreshing<E, A> = RefreshingFailure<E> | RefreshingSuccess<A>

export interface RefreshingFailure<E> extends Failure<E> {
  readonly refreshing: Option.Some<Loading>
}

export interface RefreshingSuccess<A> extends Success<A> {
  readonly refreshing: Option.Some<Loading>
}

export const isRefreshing = <E, A>(data: AsyncData<E, A>): data is Refreshing<E, A> =>
  isSuccess(data) || isFailure(data) ? Option.isSome(data.refreshing) : false

export const isLoadingOrRefreshing = <E, A>(data: AsyncData<E, A>): data is Loading | Refreshing<E, A> =>
  isLoading(data) || isRefreshing(data)

export const match: {
  <E, A, R1, R2, R3, R4>(
    matchers: {
      NoData: (data: NoData) => R1
      Loading: (data: Loading) => R2
      Failure: (cause: Cause.Cause<E>, data: Failure<E>) => R3
      Success: (value: A, data: Success<A>) => R4
    }
  ): (data: AsyncData<E, A>) => Unify.Unify<R1 | R2 | R3 | R4>

  <E, A, R1, R2, R3, R4>(
    data: AsyncData<E, A>,
    matchers: {
      NoData: (data: NoData) => R1
      Loading: (data: Loading) => R2
      Failure: (cause: Cause.Cause<E>, data: Failure<E>) => R3
      Success: (value: A, data: Success<A>) => R4
    }
  ): Unify.Unify<R1 | R2 | R3 | R4>
} = dual(2, <E, A, R1, R2, R3, R4>(data: AsyncData<E, A>, matchers: {
  NoData: (data: NoData) => R1
  Loading: (data: Loading) => R2
  Failure: (cause: Cause.Cause<E>, data: Failure<E>) => R3
  Success: (value: A, data: Success<A>) => R4
}): Unify.Unify<R1 | R2 | R3 | R4> => {
  if (isSuccess(data)) {
    return matchers.Success(data.value, data) as Unify.Unify<R1 | R2 | R3 | R4>
  } else if (isFailure(data)) {
    return matchers.Failure(data.cause, data) as Unify.Unify<R1 | R2 | R3 | R4>
  } else if (isLoading(data)) {
    return matchers.Loading(data) as Unify.Unify<R1 | R2 | R3 | R4>
  } else {
    return matchers.NoData(data) as Unify.Unify<R1 | R2 | R3 | R4>
  }
})

export const map: {
  <A, B>(f: (a: A) => B): <E>(data: AsyncData<E, A>) => AsyncData<E, B>
  <E, A, B>(data: AsyncData<E, A>, f: (a: A) => B): AsyncData<E, B>
} = dual(2, function<E, A, B>(data: AsyncData<E, A>, f: (a: A) => B): AsyncData<E, B> {
  return isSuccess(data) ?
    success(f(data.value), {
      timestamp: data.timestamp,
      refreshing: Option.getOrUndefined(data.refreshing)
    }) :
    data
})

export const flatMap: {
  <A, E2, B>(f: (a: A, options: SuccessOptions) => AsyncData<E2, B>): <E>(data: AsyncData<E, A>) => AsyncData<E | E2, B>
  <E, A, E2, B>(data: AsyncData<E, A>, f: (a: A, options: SuccessOptions) => AsyncData<E, B>): AsyncData<E | E2, B>
} = dual(
  2,
  function<E, A, E2, B>(
    data: AsyncData<E, A>,
    f: (a: A, options: SuccessOptions) => AsyncData<E2, B>
  ): AsyncData<E | E2, B> {
    return isSuccess(data) ? f(data.value, data) : data
  }
)

export const startLoading = <E, A>(data: AsyncData<E, A>): AsyncData<E, A> => {
  if (isSuccess(data)) {
    return Option.isSome(data.refreshing) ? data : success(data.value, { ...data, refreshing: loading() })
  } else if (isFailure(data)) {
    return Option.isSome(data.refreshing)
      ? data
      : failCause(data.cause, { ...data, refreshing: loading() })
  } else {
    return loading()
  }
}

export const stopLoading = <E, A>(data: AsyncData<E, A>): AsyncData<E, A> => {
  if (isSuccess(data)) {
    return Option.isSome(data.refreshing)
      ? success(data.value, { ...data, refreshing: undefined }) :
      data
  } else if (isFailure(data)) {
    return Option.isSome(data.refreshing)
      ? failCause(data.cause, { ...data, refreshing: undefined })
      : data
  } else {
    return loading()
  }
}

export function isAsyncData<E, A>(u: unknown): u is AsyncData<E, A> {
  if (isTaggedRecord(u) && hasEquality(u)) {
    switch (u._tag) {
      case NO_DATA_TAG:
        return "timstamp" in u && typeof u.timestamp === "bigint"
      case LOADING_TAG:
        return "progress" in u && Option.isOption(u.progress)
      case FAILURE_TAG:
        return hasDataOptions(u) && "cause" in u && Cause.isCause(u.cause)
      case SUCCESS_TAG:
        return hasDataOptions(u) && "value" in u
      default:
        return false
    }
  } else return false
}

export const done = <E, A>(exit: Exit.Exit<E, A>): AsyncData<E, A> =>
  Exit.match(exit, {
    onFailure: (cause) => failCause(cause),
    onSuccess: (value) => success(value)
  })

export const checkIsOutdated = <E, A>(
  data: AsyncData<E, A>,
  timeToLive: Duration.DurationInput,
  currentTime?: bigint
): data is Success<A> => {
  if (isSuccess(data)) {
    if (currentTime === undefined) {
      currentTime = currentTimestamp()
    }
    const updatedTime = data.timestamp
    const difference = Duration.nanos(currentTime - updatedTime)

    return Duration.greaterThanOrEqualTo(difference, timeToLive)
  }

  return false
}

export const getFailure = <E, A>(data: AsyncData<E, A>): Option.Option<E> =>
  isFailure(data) ? Cause.failureOption(data.cause) : Option.none()

export const getSuccess = <E, A>(data: AsyncData<E, A>): Option.Option<A> =>
  isSuccess(data) ? Option.some(data.value) : Option.none()

const optionProgressEq = Option.getEquivalence(Progress.equals)

const loadingEquivalence: Equivalence.Equivalence<Loading> = Equivalence.struct({
  _tag: Equivalence.string,
  timestamp: Equivalence.bigint,
  progress: optionProgressEq
})

const optionLoadingEq = Option.getEquivalence(loadingEquivalence)

const failureEquivalence: Equivalence.Equivalence<Failure<any>> = Equivalence.struct({
  _tag: Equivalence.string,
  cause: Equal.equals,
  timestamp: Equivalence.bigint,
  refreshing: optionLoadingEq
})

const successEquivalence = <A>(valueEq: Equivalence.Equivalence<A>): Equivalence.Equivalence<Success<A>> =>
  Equivalence.struct({
    _tag: Equivalence.string,
    value: valueEq,
    timestamp: Equivalence.bigint,
    refreshing: optionLoadingEq
  })

export const getEquivalence =
  <E, A>(valueEq: Equivalence.Equivalence<A> = Equal.equals): Equivalence.Equivalence<AsyncData<E, A>> => (a, b) => {
    if (a === b) return true

    return match(a, {
      NoData: () => isNoData(b) ? Equivalence.bigint(a.timestamp, b.timestamp) : false,
      Loading: (l1) => isLoading(b) ? loadingEquivalence(l1, b) : false,
      Failure: (_, f1) =>
        isFailure(b)
          ? failureEquivalence(f1, b)
          : false,
      Success: (_, s1) =>
        isSuccess(b)
          ? successEquivalence(valueEq)(s1, b)
          : false
    })
  }
