/**
 * AsyncData represents a piece of data which is acquired asynchronously with loading, failure, and progress states
 * in addition to Option-like states of NoData and Success.
 *
 * @since 1.0.0
 */

import type { Effect } from "effect"
import { Cause, Data, Equal, Equivalence, Exit, Option, Unify } from "effect"
import { dual } from "effect/Function"
import * as internal from "./internal/async-data"
import { FAILURE_TAG, LOADING_TAG, NO_DATA_TAG, SUCCESS_TAG } from "./internal/tag"
import * as Progress from "./Progress"

/**
 * AsyncData represents a piece of data which is acquired asynchronously with loading, failure, and progress states
 * in addition to Option-like states of NoData and Success.
 *
 * @since 1.0.0
 */
export type AsyncData<E, A> = NoData | Loading | Failure<E> | Success<A>

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
  readonly progress: Option.Option<Progress.Progress>
}

/**
 * @since 1.0.0
 */
export type OptionalPartial<A> = {
  [K in keyof A]+?: [A[K]] extends [Option.Option<infer R>] ? R | undefined : A[K]
}

/**
 * @since 1.0.0
 */
export const loading: {
  (options?: OptionalPartial<LoadingOptions>): Loading
  <E, A>(options?: OptionalPartial<LoadingOptions>): AsyncData<E, A>
} = (options?: OptionalPartial<LoadingOptions>): Loading =>
  new Loading({
    progress: Option.fromNullable(options?.progress)
  })

/**
 * @since 1.0.0
 */
export interface Failure<E> extends Effect.Effect<never, E, never> {
  /**
   * @since 1.18.0
   */
  readonly _tag: typeof FAILURE_TAG

  /**
   * @since 1.18.0
   */
  readonly cause: Cause.Cause<E>

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
    Option.fromNullable(options?.refreshing)
  )

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
export interface Success<A> extends Effect.Effect<never, never, A> {
  readonly _tag: typeof SUCCESS_TAG
  readonly value: A
  readonly refreshing: Option.Option<Loading>

  readonly [Unify.typeSymbol]: unknown
  readonly [Unify.unifySymbol]: AsyncData.Unify<this>
  readonly [Unify.ignoreSymbol]: AsyncData.IgnoreList
}

/**
 * @since 1.0.0
 */
export type SuccessOptions = {
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
    Option.fromNullable(options?.refreshing)
  )

/**
 * @since 1.0.0
 */
export const isSuccess = <E, A>(data: AsyncData<E, A>): data is Success<A> => data._tag === SUCCESS_TAG

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
  isSuccess(data) || isFailure(data) ? Option.isSome(data.refreshing) : false

/**
 * @since 1.0.0
 */
export const isLoadingOrRefreshing = <E, A>(data: AsyncData<E, A>): data is Loading | Refreshing<E, A> =>
  isLoading(data) || isRefreshing(data)

/**
 * @since 1.0.0
 */
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

/**
 * @since 1.0.0
 */
export const map: {
  <A, B>(f: (a: A) => B): <E>(data: AsyncData<E, A>) => AsyncData<E, B>
  <E, A, B>(data: AsyncData<E, A>, f: (a: A) => B): AsyncData<E, B>
} = dual(2, function<E, A, B>(data: AsyncData<E, A>, f: (a: A) => B): AsyncData<E, B> {
  return isSuccess(data) ?
    success(f(data.value), {
      refreshing: Option.getOrUndefined(data.refreshing)
    }) :
    data
})

/**
 * @since 1.0.0
 */
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
  isSuccess(data) ? Option.some(data.value) : Option.none()

const optionProgressEq = Option.getEquivalence(Progress.equals)

const loadingEquivalence: Equivalence.Equivalence<Loading> = Equivalence.struct({
  _tag: Equivalence.string,
  progress: optionProgressEq
})

const optionLoadingEq = Option.getEquivalence(loadingEquivalence)

const failureEquivalence: Equivalence.Equivalence<Failure<any>> = Equivalence.struct({
  _tag: Equivalence.string,
  cause: Equal.equals,
  refreshing: optionLoadingEq
})

const successEquivalence = <A>(valueEq: Equivalence.Equivalence<A>): Equivalence.Equivalence<Success<A>> =>
  Equivalence.struct({
    _tag: Equivalence.string,
    value: valueEq,
    refreshing: optionLoadingEq
  })

/**
 * @since 1.0.0
 */
export const getEquivalence =
  <E, A>(valueEq: Equivalence.Equivalence<A> = Equal.equals): Equivalence.Equivalence<AsyncData<E, A>> => (a, b) => {
    if (a === b) return true

    return match(a, {
      NoData: () => isNoData(b),
      Loading: (l1) => isLoading(b) ? loadingEquivalence(l1, b) : false,
      Failure: (_, f1) => isFailure(b) ? failureEquivalence(f1, b) : false,
      Success: (_, s1) => isSuccess(b) ? successEquivalence(valueEq)(s1, b) : false
    })
  }
