import type { Progress } from "@typed/async-data/Progress"
import { Cause, Data, Effect, Effectable, Equal, Hash, Match, Option, pipe, Unify } from "effect"
import { constant, dual } from "effect/Function"

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

export class NoData extends Data.TaggedError(NO_DATA_TAG)<{}> {
  [Unify.typeSymbol]!: unknown;
  [Unify.unifySymbol]!: AsyncData.Unify<this>;
  [Unify.blacklistSymbol]!: AsyncData.UnifyBlackList
}

export const noData: {
  (): NoData
  <E, A>(): AsyncData<E, A>
} = (): NoData => new NoData()

export class Loading extends Data.TaggedError(LOADING_TAG)<LoadingOptions> {
  [Unify.typeSymbol]!: unknown;
  [Unify.unifySymbol]!: AsyncData.Unify<this>;
  [Unify.blacklistSymbol]!: AsyncData.UnifyBlackList
}

export type LoadingOptions = {
  readonly timestamp: bigint // Clock.currentTimeNanos
  readonly progress: Option.Option<Progress>
}

export const loading: {
  (options?: Partial<LoadingOptions>): Loading
  <E, A>(options?: Partial<LoadingOptions>): AsyncData<E, A>
} = (options?: Partial<LoadingOptions>): Loading =>
  new Loading({
    timestamp: options?.timestamp || currentTimestamp(),
    progress: options?.progress || Option.none()
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
  <E>(cause: Cause.Cause<E>, options?: FailureOptions): Failure<E>
  <E, A>(cause: Cause.Cause<E>, options?: FailureOptions): AsyncData<E, A>
} = <E>(cause: Cause.Cause<E>, options?: FailureOptions): Failure<E> =>
  new FailureImpl(cause, options?.timestamp || currentTimestamp(), options?.refreshing || Option.none())

export const fail: {
  <E>(error: E, options?: FailureOptions): Failure<E>
  <E, A>(error: E, options?: FailureOptions): AsyncData<E, A>
} = <E>(error: E, options?: FailureOptions): Failure<E> => failCause<E>(Cause.fail(error), options)

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
  <A>(value: A, options?: Partial<SuccessOptions>): Success<A>
  <E, A>(value: A, options?: Partial<SuccessOptions>): AsyncData<E, A>
} = <A>(value: A, options?: Partial<SuccessOptions>): Success<A> =>
  new SuccessImpl(value, options?.timestamp || currentTimestamp(), options?.refreshing || Option.none())

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

export const type = <E, A>(): Match.Matcher<
  AsyncData<E, A>,
  Match.Types.Without<never>,
  AsyncData<E, A>,
  never,
  never
> => Match.type<AsyncData<E, A>>()

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
  return isSuccess(data) ? success(f(data.value), data) : data
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
    return Option.isSome(data.refreshing) ? data : success(data.value, { ...data, refreshing: Option.some(loading()) })
  } else if (isFailure(data)) {
    return Option.isSome(data.refreshing)
      ? data
      : failCause(data.cause, { ...data, refreshing: Option.some(loading()) })
  } else {
    return loading()
  }
}

export const stopLoading = <E, A>(data: AsyncData<E, A>): AsyncData<E, A> => {
  if (isSuccess(data)) {
    return Option.isSome(data.refreshing)
      ? success(data.value, { ...data, refreshing: Option.none() }) :
      data
  } else if (isFailure(data)) {
    return Option.isSome(data.refreshing)
      ? failCause(data.cause, { ...data, refreshing: Option.none() })
      : data
  } else {
    return loading()
  }
}

export function isAsyncData<E, A>(u: unknown): u is AsyncData<E, A> {
  if (isTaggedRecord(u) && hasEquality(u)) {
    switch (u._tag) {
      case NO_DATA_TAG:
        return true
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

// Internal

const defaultClock = Effect.runSync(Effect.clock)
const currentTimestamp = () => defaultClock.unsafeCurrentTimeNanos()

class FailureImpl<E> extends Effectable.Class<never, E, never> implements Failure<E> {
  readonly _tag = "Failure"

  commit: () => Effect.Effect<never, E, never>;

  [Unify.typeSymbol]!: unknown;
  [Unify.unifySymbol]!: AsyncData.Unify<this>;
  [Unify.blacklistSymbol]!: AsyncData.UnifyBlackList

  constructor(readonly cause: Cause.Cause<E>, readonly timestamp: bigint, readonly refreshing: Option.Option<Loading>) {
    super()

    this.commit = constant(Effect.failCause(cause))
  }

  [Equal.symbol](that: unknown) {
    return that instanceof FailureImpl
      && Equal.equals(this.cause, that.cause)
      && Equal.equals(this.timestamp, that.timestamp)
      && Equal.equals(this.refreshing, that.refreshing)
  }

  [Hash.symbol]() {
    return pipe(
      Hash.string(this._tag),
      Hash.combine(Hash.hash(this.cause)),
      Hash.combine(Hash.hash(this.timestamp)),
      Hash.combine(Hash.hash(this.refreshing))
    )
  }
}

class SuccessImpl<A> extends Effectable.Class<never, never, A> implements Success<A> {
  readonly _tag = "Success"

  commit: () => Effect.Effect<never, never, A>;

  [Unify.typeSymbol]!: unknown;
  [Unify.unifySymbol]!: AsyncData.Unify<this>;
  [Unify.blacklistSymbol]!: AsyncData.UnifyBlackList

  constructor(readonly value: A, readonly timestamp: bigint, readonly refreshing: Option.Option<Loading>) {
    super()

    this.commit = constant(Effect.succeed(value))
  }

  [Equal.symbol](that: unknown) {
    return that instanceof SuccessImpl
      && Equal.equals(this.value, that.value)
      && Equal.equals(this.timestamp, that.timestamp)
      && Equal.equals(this.refreshing, that.refreshing)
  }

  [Hash.symbol]() {
    return pipe(
      Hash.string(this._tag),
      Hash.combine(Hash.hash(this.value)),
      Hash.combine(Hash.hash(this.timestamp)),
      Hash.combine(Hash.hash(this.refreshing))
    )
  }
}

function hasDataOptions(u: Record<PropertyKey, unknown>): boolean {
  if ("timestamp" in u && "refreshing" in u) {
    return typeof u.timestamp === "bigint" && Option.isOption(u.refreshing)
  } else return false
}

function hasEquality(u: Record<PropertyKey, unknown>): boolean {
  return Equal.symbol in u && Hash.symbol in u
}

function isTaggedRecord(u: unknown): u is Record<PropertyKey, unknown> & { readonly _tag: unknown } {
  return isRecord(u) && "_tag" in u
}

function isRecord(u: unknown): u is Record<PropertyKey, unknown> {
  return typeof u === "object" && u !== null && !Array.isArray(u)
}
