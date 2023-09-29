/**
 * RemoteData is a data type that represents the state of a remote resource.
 * @since 1.0.0
 */

import * as Chunk from "effect/Chunk"
import * as Either from "effect/Either"
import * as Equal from "effect/Equal"
import type * as Equivalence from "effect/Equivalence"
import { dual, identity, pipe } from "effect/Function"
import * as Hash from "effect/Hash"
import * as Option from "effect/Option"
import type { Pipeable } from "effect/Pipeable"
import { pipeArguments } from "effect/Pipeable"
import type * as Unify from "effect/Unify"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"

/**
 * RemoteData is a data type that represents the state of a remote resource.
 * @since 1.0.0
 */
export type RemoteData<E, A> = NoData | Loading | Failure<E> | Success<A>

/**
 * @since 1.0.0
 */
export namespace RemoteData {
  /**
   * A helper for a remotedata that has any values.
   * @since 1.0.0
   */
  export type Any = RemoteData<any, any>

  /**
   * A helper extracting the error type from a RemoteData
   * @since 1.0.0
   */
  export type Error<T> = [T] extends [never] ? never
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    : [T] extends [RemoteData<infer E, infer _>] ? E
    : never

  /**
   * A helper extracting the success type from a RemoteData
   * @since 1.0.0
   */
  export type Success<T> = [T] extends [never] ? never
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    : [T] extends [RemoteData<infer _, infer A>] ? A
    : never

  /**
   * A type for representing the variance of RemoteData
   * @since 1.0.0
   */
  export interface Variance<E, A> {
    readonly _E: (_: never) => E
    readonly _A: (_: never) => A
  }

  /**
   * @category models
   * @since 1.0.0
   */
  export interface Unify<A extends { [Unify.typeSymbol]?: any }> extends Effect.EffectUnify<A> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    RemoteData: () => A[Unify.typeSymbol] extends RemoteData<infer E0, infer A0> | infer _ ? RemoteData<E0, A0>
      : never
  }

  /**
   * @category models
   * @since 1.0.0
   */
  export interface UnifyBlackList extends Effect.EffectUnifyBlacklist {
    Effect?: true
  }
}

/**
 * The initial state of a RemoteData where no data has been loaded or has been cleared.
 * @since 1.0.0
 */
export interface NoData extends Effect.Effect<never, Cause.NoSuchElementException, never>, Pipeable {
  readonly state: "NoData" // We use state here instead of _tag because we want to be a sub-type of Effect which has a _tag

  [Unify.typeSymbol]?: unknown
  [Unify.unifySymbol]?: RemoteData.Unify<this>
  [Unify.blacklistSymbol]?: RemoteData.UnifyBlackList
}

/**
 * The second state of a RemoteData where data is attempting to be loaded.
 * @since 1.0.0
 */
export interface Loading extends Effect.Effect<never, LoadingException, never>, Pipeable {
  readonly state: "Loading"

  [Unify.typeSymbol]?: unknown
  [Unify.unifySymbol]?: RemoteData.Unify<this>
  [Unify.blacklistSymbol]?: RemoteData.UnifyBlackList
}

/**
 * The TypeId for a LoadingException
 * @since 1.0.0
 */
export const LoadingExceptionTypeId = Symbol.for("@typed/remote-data/LoadingException")

/**
 * The TypeId for a LoadingException
 * @since 1.0.0
 */
export type LoadingExceptionTypeId = typeof LoadingExceptionTypeId

/**
 * A LoadingException is thrown when a remote resource fails to load
 * and is being used as an Effect.
 * @since 1.0.0
 */
export interface LoadingException {
  readonly [LoadingExceptionTypeId]: LoadingExceptionTypeId
  readonly _tag: "LoadingException"
  readonly message?: string
}

/**
 * Create a LoadingException
 * @since 1.0.0
 */
export const LoadingException: (message?: string) => LoadingException = makeException<LoadingException>(
  {
    [LoadingExceptionTypeId]: LoadingExceptionTypeId
  },
  "LoadingException"
)

/**
 * One possibility for the third state of a RemoteData where data has failed to load
 * with some value `E`. This state can be refreshed:true when the data is being
 * reloaded after an initial failure.
 * @since 1.0.0
 */
export interface Failure<E> extends Effect.Effect<never, E, never>, Pipeable {
  readonly state: "Failure"
  readonly cause: Cause.Cause<E>
  readonly refreshing: boolean

  [Unify.typeSymbol]?: unknown
  [Unify.unifySymbol]?: RemoteData.Unify<this>
  [Unify.blacklistSymbol]?: RemoteData.UnifyBlackList
}

/**
 * One possibility for the third state of a RemoteData where data has successfully
 * loaded with some value `A`. This state can be refreshed:true when the data is being
 * reloaded after an initial success.
 * @since 1.0.0
 */
export interface Success<A> extends Effect.Effect<never, never, A>, Pipeable {
  readonly state: "Success"
  readonly value: A
  readonly refreshing: boolean

  [Unify.typeSymbol]?: unknown
  [Unify.unifySymbol]?: RemoteData.Unify<this>
  [Unify.blacklistSymbol]?: RemoteData.UnifyBlackList
}

/**
 * Check if a value is a RemoteData.
 * @since 1.0.0
 */
export function isRemoteData<E, A>(u: unknown): u is RemoteData<E, A> {
  return (
    u !== null &&
    typeof u === "object" &&
    "state" in u &&
    (isNoData(u as any) || isLoading(u as any) || isFailure(u as any) || isSuccess(u as any))
  )
}

/**
 * Match over the states of a RemoteData.
 * @since 1.0.0
 */
export const match: {
  <E, A, R1, R2, R3, R4>(matchers: {
    readonly onNoData: () => R1
    readonly onLoading: () => R2
    readonly onFailure: (cause: Cause.Cause<E>, refreshing: boolean) => R3
    readonly onSuccess: (value: A, refreshing: boolean) => R4
  }): (data: RemoteData<E, A>) => R1 | R2 | R3 | R4

  <E, A, R1, R2, R3, R4>(
    data: RemoteData<E, A>,
    matchers: {
      readonly onNoData: () => R1
      readonly onLoading: () => R2
      readonly onFailure: (cause: Cause.Cause<E>, refreshing: boolean) => R3
      readonly onSuccess: (value: A, refreshing: boolean) => R4
    }
  ): R1 | R2 | R3 | R4
} = dual(
  2,
  function match<E, A, R1, R2, R3, R4>(
    data: RemoteData<E, A>,
    matchers: {
      readonly onNoData: () => R1
      readonly onLoading: () => R2
      readonly onFailure: (cause: Cause.Cause<E>, refreshing: boolean) => R3
      readonly onSuccess: (value: A, refreshing: boolean) => R4
    }
  ): R1 | R2 | R3 | R4 {
    switch (data.state) {
      case "NoData":
        return matchers.onNoData()
      case "Loading":
        return matchers.onLoading()
      case "Failure":
        return matchers.onFailure((data as Failure<E>).cause, (data as Failure<E>).refreshing)
      case "Success":
        return matchers.onSuccess((data as Success<A>).value, (data as Success<A>).refreshing)
    }
  }
)

/**
 * Change the state of a RemoteData to Loading or Refreshing=true.
 * @since 1.0.0
 */
export const toLoading = <E, A>(data: RemoteData<E, A>): RemoteData<E, A> =>
  match(data, {
    onNoData: () => loading,
    onLoading: () => loading,
    onFailure: (cause) => failCause(cause, true),
    onSuccess: (value) => succeed(value, true)
  })

/**
 * Change the state of a RemoteData to NoData or Refreshing=false.
 * @since 1.0.0
 */
export const stopLoading = <E, A>(data: RemoteData<E, A>): RemoteData<E, A> =>
  match(data, {
    onNoData: () => noData,
    onLoading: () => noData,
    onFailure: (cause) => failCause(cause, false),
    onSuccess: (value) => succeed(value, false)
  })

const causeEquivalence = <E>(
  E: Equivalence.Equivalence<E>
): Equivalence.Equivalence<Cause.Cause<E>> => {
  const ChunkE = Chunk.getEquivalence(E)
  return (x, y) => {
    if (x === y) return true

    const failuresX = Cause.failures(x)
    const failuresY = Cause.failures(y)

    // Manually compare E with the use of ChunkE
    if (failuresX.length !== failuresY.length || !ChunkE(failuresX, failuresY)) return false

    // utilize the default Equal instance for Cause
    return Equal.equals(x, y)
  }
}

/**
 * Get an Equivalence for RemoteData
 * @since 1.0.0
 */
export const getEquivalence = <E, A>(
  E: Equivalence.Equivalence<E>,
  A: Equivalence.Equivalence<A>
): Equivalence.Equivalence<RemoteData<E, A>> => {
  const CauseE = causeEquivalence(E)
  return (a, b) => {
    if (a === b) return true
    else if (isNoData(a)) return isNoData(b)
    else if (isLoading(a)) return isLoading(b)
    else if (isFailure(a)) return isFailure(b) && CauseE(a.cause, b.cause)
    else if (isSuccess(a)) return isSuccess(b) && A(a.value, b.value)
    else return false
  }
}

const variance = {
  _R: identity,
  _E: identity,
  _A: identity
}
const eqAny = getEquivalence(Equal.equals, Equal.equals)
const proto = {
  _tag: "Commit",
  [Effect.EffectTypeId]: variance,
  i0: undefined,
  i1: undefined,
  i2: undefined,
  [Equal.symbol](this: RemoteData<any, any>, that: any) {
    return isRemoteData(that) && eqAny(this, that)
  },
  [Hash.symbol](this: RemoteData<any, any>) {
    switch (this.state) {
      case "NoData":
      case "Loading":
        return Hash.string(this.state)
      case "Failure":
        return pipe(
          Hash.string(this.state),
          Hash.combine(Hash.hash((this as Failure<any>).cause)),
          Hash.combine(Hash.hash((this as Failure<any>).refreshing))
        )
      case "Success":
        return pipe(
          Hash.string(this.state),
          Hash.combine(Hash.hash((this as Success<any>).value)),
          Hash.combine(Hash.hash((this as Success<any>).refreshing))
        )
    }
  },
  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return pipeArguments(this, arguments)
  }
}

const noSuchElementException = Effect.suspend(() => Effect.fail(Cause.NoSuchElementException()))
const commitNoSuchElementException = () => noSuchElementException
const loadingException = Effect.suspend(() => Effect.fail(LoadingException()))
const commitLoadingException = () => loadingException
const noDataString = `RemoteData(NoData)`
const loadingString = `RemoteData(Loading)`
const failureString = <E extends string>(E: E, refreshing: boolean) =>
  `RemoteData(Failure(${E})${refreshing ? `, refreshing=true` : ""})`
const successString = <A extends string>(A: A, refreshing: boolean) =>
  `RemoteData(Success(${A})${refreshing ? `, refreshing=true` : ""})`

/**
 * A singleton instance of NoData
 * @since 1.0.0
 */
export const noData: NoData = (() => {
  const data = Object.create(proto)

  data.state = "NoData"
  data.commit = commitNoSuchElementException
  data.toString = () => noDataString

  return data
})()

/**
 * A singleton instance of Loading
 * @since 1.0.0
 */
export const loading: Loading = (() => {
  const data = Object.create(proto)

  data.state = "Loading"
  data.commit = commitLoadingException
  data.toString = () => loadingString

  return data
})()

/**
 * Construct a Failure from a Cause
 * @since 1.0.0
 */
export function failCause<E>(cause: Cause.Cause<E>, refreshing: boolean = false): Failure<E> {
  const data = Object.create(proto)

  data.state = "Failure"
  data.cause = cause
  data.refreshing = refreshing
  data.commit = () => Effect.failCause(cause)
  data.toString = () => failureString(Cause.pretty(cause), refreshing)

  return data
}

/**
 * Construct a Failure from a value
 * @since 1.0.0
 */
export function fail<E>(error: E, refreshing: boolean = false): Failure<E> {
  return failCause(Cause.fail(error), refreshing)
}

/**
 * Construct a Success from a value
 * @since 1.0.0
 */
export function succeed<A>(value: A, refreshing: boolean = false): Success<A> {
  const data = Object.create(proto)

  data.state = "Success"
  data.value = value
  data.refreshing = refreshing
  data.commit = () => Effect.succeed(value)
  data.toString = () => successString(JSON.stringify(value), refreshing)

  return data
}

/**
 * Check if a RemoteData is NoData
 * @since 1.0.0
 */
export function isNoData<E, A>(data: RemoteData<E, A>): data is NoData {
  return data.state === "NoData"
}

/**
 * Check if a RemoteData is Loading
 * @since 1.0.0
 */
export function isLoading<E, A>(data: RemoteData<E, A>): data is Loading {
  return data.state === "Loading"
}

/**
 * Check if a RemoteData is Failure
 * @since 1.0.0
 */
export function isFailure<E, A>(data: RemoteData<E, A>): data is Failure<E> {
  return data.state === "Failure"
}

/**
 * Check if a RemoteData is Success
 * @since 1.0.0
 */
export function isSuccess<E, A>(data: RemoteData<E, A>): data is Success<A> {
  return data.state === "Success"
}

/**
 * The Refreshing state of a RemoteData
 * @since 1.0.0
 */
export type Refreshing<E, A> = (Failure<E> | Success<A>) & { readonly refreshing: true }

/**
 * Check if a RemoteData is Refreshing
 * @since 1.0.0
 */
export function isRefreshing<E, A>(data: RemoteData<E, A>): data is Refreshing<E, A> {
  return isFailure(data) || isSuccess(data) ? data.refreshing : false
}

/**
 * Check if a RemoteData is Loading or Refreshing
 * @since 1.0.0
 */
export function isLoadingOrRefreshing<E, A>(
  data: RemoteData<E, A>
): data is Loading | Refreshing<E, A> {
  return isLoading(data) || isRefreshing(data)
}

/**
 * Construct a RemoteData from an Either
 * @since 1.0.0
 */
export function fromEither<E, A>(either: Either.Either<E, A>): RemoteData<E, A> {
  return Either.match(either, {
    onLeft: (e) => failCause(Cause.fail(e)),
    onRight: succeed
  })
}

/**
 * Construct a RemoteData from an Option
 * @since 1.0.0
 */
export function fromOption<A>(option: Option.Option<A>): RemoteData<never, A> {
  return Option.match(option, {
    onNone: () => noData,
    onSome: succeed
  })
}

/**
 * Convert a RemoteData to an Option of its possible success value.
 * @since 1.0.0
 */
export const toOption = <E, A>(data: RemoteData<E, A>): Option.Option<A> =>
  isSuccess(data) ? Option.some(data.value) : Option.none()

/**
 * Convert a RemoteData to an Option of its possible failure cause.
 * @since 1.0.0
 */
export const toOptionCause = <E, A>(data: RemoteData<E, A>): Option.Option<Cause.Cause<E>> =>
  isFailure(data) ? Option.some(data.cause) : Option.none()

/**
 * Convert a RemoteData to an Option of its possible failure value.
 * @since 1.0.0
 */
export const toOptionError = <E, A>(data: RemoteData<E, A>): Option.Option<E> =>
  isFailure(data) ? Either.getLeft(Cause.failureOrCause(data.cause)) : Option.none()

/**
 * Convert an Exit<E, A> to a RemoteData<E, A>
 * @since 1.0.0
 */
export function fromExit<E, A>(exit: Exit.Exit<E, A>): RemoteData<E, A> {
  return Exit.match(exit, {
    onFailure: unwrapCause,
    onSuccess: succeed
  })
}

/**
 * Map over the success value of a RemoteData
 * @since 1.0.0
 */
export const map: {
  <A, B>(f: (a: A) => B): <E>(data: RemoteData<E, A>) => RemoteData<E, B>
  <E, A, B>(data: RemoteData<E, A>, f: (a: A) => B): RemoteData<E, B>
} = Object.assign(dual(2, function map<E, A, B>(data: RemoteData<E, A>, f: (a: A) => B): RemoteData<E, B> {
  if (isSuccess(data)) {
    return succeed(f(data.value), data.refreshing)
  } else {
    return data
  }
}))

/**
 * Map over the failure value of a RemoteData
 * @since 1.0.0
 */
export const mapError: {
  <E, E1>(f: (e: E) => E1): <A>(data: RemoteData<E, A>) => RemoteData<E1, A>
  <E, E1, A>(data: RemoteData<E, A>, f: (e: E) => E1): RemoteData<E1, A>
} = dual(2, function mapError<E, E1, A>(data: RemoteData<E, A>, f: (e: E) => E1): RemoteData<
  E1,
  A
> {
  if (isFailure(data)) {
    return failCause(Cause.map(data.cause, f), data.refreshing)
  } else {
    return data
  }
})

/**
 * Map over the failure cause of a RemoteData
 * @since 1.0.0
 */
export const mapErrorCause: {
  <E, E1>(
    f: (e: Cause.Cause<E>) => Cause.Cause<E1>
  ): <A>(data: RemoteData<E, A>) => RemoteData<E1, A>
  <E, E1, A>(data: RemoteData<E, A>, f: (e: Cause.Cause<E>) => Cause.Cause<E1>): RemoteData<E1, A>
} = dual(2, function mapErrorCause<
  E,
  E1,
  A
>(data: RemoteData<E, A>, f: (e: Cause.Cause<E>) => Cause.Cause<E1>): RemoteData<E1, A> {
  if (isFailure(data)) {
    return failCause(f(data.cause), data.refreshing)
  } else {
    return data
  }
})

/**
 * Chain together a function that returns a RemoteData
 * @since 1.0.0
 */
export const flatMap: {
  <A, E2, B>(
    f: (a: A, refreshing: boolean) => RemoteData<E2, B>
  ): <E1>(data: RemoteData<E1, A>) => RemoteData<E1 | E2, B>
  <E1, A, E2, B>(
    data: RemoteData<E1, A>,
    f: (a: A, refreshing: boolean) => RemoteData<E2, B>
  ): RemoteData<E1 | E2, B>
} = dual(2, function flatMap<
  E1,
  A,
  E2,
  B
>(data: RemoteData<E1, A>, f: (a: A, refreshing: boolean) => RemoteData<E2, B>): RemoteData<
  E1 | E2,
  B
> {
  if (isSuccess(data)) {
    return f(data.value, data.refreshing)
  } else {
    return data
  }
})

/**
 * Recover from a failure with another RemoteData
 * @since 1.0.0
 */
export const catchAllCause: {
  <E, E1, B>(
    f: (e: Cause.Cause<E>, refreshing: boolean) => RemoteData<E1, B>
  ): <A>(data: RemoteData<E, A>) => RemoteData<E1, A | B>
  <E, A, E1, B>(
    data: RemoteData<E, A>,
    f: (e: Cause.Cause<E>, refreshing: boolean) => RemoteData<E1, B>
  ): RemoteData<E1, A | B>
} = dual(2, function catchAllCause<
  E,
  A,
  E1,
  B
>(data: RemoteData<E, A>, f: (e: Cause.Cause<E>, refreshing: boolean) => RemoteData<E1, B>): RemoteData<
  E1,
  A | B
> {
  if (isFailure(data)) {
    return f(data.cause, data.refreshing)
  } else {
    return data
  }
})

/**
 * Recover from a failure with another RemoteData
 * @since 1.0.0
 */
export const catchAll: {
  <E, E1, B>(
    f: (e: E, refreshing: boolean) => RemoteData<E1, B>
  ): <A>(data: RemoteData<E, A>) => RemoteData<E1, A | B>

  <E, A, E1, B>(
    data: RemoteData<E, A>,
    f: (e: E, refreshing: boolean) => RemoteData<E1, B>
  ): RemoteData<E1, A | B>
} = dual(2, function catchAll<
  E,
  A,
  E1,
  B
>(data: RemoteData<E, A>, f: (e: E, refreshing: boolean) => RemoteData<E1, B>): RemoteData<
  E1,
  A | B
> {
  if (isFailure(data)) {
    return Either.match(Cause.failureOrCause(data.cause), {
      onLeft: (e) => f(e, data.refreshing),
      onRight: () => data as Failure<never>
    })
  } else {
    return data
  }
})

/**
 * Get the success value of a RemoteData or return a default value
 * @since 1.0.0
 */
export const getOrElse: {
  <B>(f: () => B): <E, A>(data: RemoteData<E, A>) => A | B
  <E, A, B>(data: RemoteData<E, A>, f: () => B): A | B
} = dual(2, function getOrElse<E, A, B>(data: RemoteData<E, A>, f: () => B): A | B {
  if (isSuccess(data)) {
    return data.value
  } else {
    return f()
  }
})

/**
 * Get the success value of a RemoteData or return `null`
 * @since 1.0.0
 */
export const getOrNull = getOrElse(() => null)

/**
 * Get the success value of a RemoteData or return `undefined`
 * @since 1.0.0
 */
export const getOrUndefined = getOrElse(() => undefined)

/**
 * Combine the success values of two RemoteData values.
 * @since 1.0.0
 */
export const zipWith: {
  <A, E2, B, C>(
    that: RemoteData<E2, B>,
    f: (a: A, b: B) => C
  ): <E1>(self: RemoteData<E1, A>) => RemoteData<E1 | E2, C>
  <E1, A, E2, B, C>(
    self: RemoteData<E1, A>,
    that: RemoteData<E2, B>,
    f: (a: A, b: B) => C
  ): RemoteData<E1 | E2, C>
} = dual(3, function zipWith<
  E,
  A,
  E2,
  B,
  C
>(self: RemoteData<E, A>, that: RemoteData<E2, B>, f: (a: A, b: B) => C): RemoteData<E | E2, C> {
  return match(self, {
    onNoData: () => noData,
    onLoading: () => loading,
    onFailure: (selfCause, selfRefreshing) => {
      if (isFailure(that)) {
        return failCause(Cause.sequential(selfCause, that.cause), selfRefreshing && that.refreshing)
      } else {
        return failCause(selfCause, selfRefreshing)
      }
    },
    onSuccess: (selfValue, selfRefreshing) => {
      if (isSuccess(that)) {
        return succeed(f(selfValue, that.value), selfRefreshing && that.refreshing)
      } else {
        return that
      }
    }
  })
})

/**
 * Combine the success values of two RemoteData values.
 * @since 1.0.0
 */
export const zip: {
  <E2, B>(
    that: RemoteData<E2, B>
  ): <E1, A>(self: RemoteData<E1, A>) => RemoteData<E1 | E2, readonly [A, B]>
  <E1, A, E2, B>(
    self: RemoteData<E1, A>,
    that: RemoteData<E2, B>
  ): RemoteData<E1 | E2, readonly [A, B]>
} = dual(2, function zip<
  E1,
  A,
  E2,
  B
>(self: RemoteData<E1, A>, that: RemoteData<E2, B>): RemoteData<E1 | E2, readonly [A, B]> {
  return zipWith(self, that, (a, b) => [a, b] as const)
})

/**
 * Combine the success values of multiple RemoteData values.
 * @since 1.0.0
 */
export function tuple<Data extends ReadonlyArray<RemoteData.Any>>(
  ...data: Data
): RemoteData<
  RemoteData.Error<Data[number]>,
  { readonly [K in keyof Data]: RemoteData.Success<Data[K]> }
> {
  const failures: Array<Failure<RemoteData.Error<Data[number]>>> = []
  const successes: Array<Success<RemoteData.Success<Data[number]>>> = []
  const length = data.length
  let isLoading = false

  for (let i = 0; i < length; i++) {
    const d = data[i]

    if (isSuccess(d)) {
      successes.push(d)
    } else if (isFailure(d)) {
      failures.push(d)
    } else if (isNoData(d)) {
      // NoData override all other states
      return d
    } else {
      isLoading = true
    }
  }

  if (isLoading) {
    return loading
  }

  if (failures.length > 0) {
    let cause: Cause.Cause<RemoteData.Error<Data[number]>> = Cause.empty
    let refreshing = false

    for (let i = 0; i < failures.length; i++) {
      const f = failures[i]

      cause = Cause.sequential(cause, f.cause)
      refreshing = refreshing && f.refreshing
    }

    return failCause(cause, refreshing)
  }

  return succeed(
    successes.map((s) => s.value),
    successes.every((s) => s.refreshing)
  ) as any
}

/**
 * Combine the success values of a struct RemoteData values.
 * @since 1.0.0
 */
export function struct<Data extends Readonly<Record<string, RemoteData.Any>>>(
  data: Data
): RemoteData<
  RemoteData.Error<Data[keyof Data]>,
  { readonly [K in keyof Data]: RemoteData.Success<Data[K]> }
> {
  return map(
    tuple(...Object.entries(data).map(([k, data]) => map(data, (data) => [k, data] as const))),
    Object.fromEntries
  )
}

/**
 * Combine the success values of multiple RemoteData values.
 * @since 1.0.0
 */
export function all<
  Data extends ReadonlyArray<RemoteData.Any> | Readonly<Record<string, RemoteData.Any>>
>(
  data: Data
): RemoteData<
  RemoteData.Error<Data[keyof Data]>,
  { readonly [K in keyof Data]: RemoteData.Success<Data[K]> }
> {
  if (Array.isArray(data)) {
    return tuple(...data) as any
  } else {
    return struct(data as Readonly<Record<string, RemoteData.Any>>) as any
  }
}

type ExcludeRemoteDataExceptions<E> = Exclude<E, Cause.NoSuchElementException | LoadingException>

/**
 * Unwrap an Effect into a RemoteData.
 * @since 1.0.0
 */
export function unwrapEffect<R, E, A>(
  effect: Effect.Effect<R, E, A>
): Effect.Effect<R, never, RemoteData<ExcludeRemoteDataExceptions<E>, A>> {
  return pipe(
    effect,
    Effect.matchCause({
      onFailure: unwrapCause,
      onSuccess: succeed
    })
  )
}

function unwrapCause<E>(cause: Cause.Cause<E>): RemoteData<ExcludeRemoteDataExceptions<E>, never> {
  // Empty cause maps to NoData
  if (Cause.isEmpty(cause)) return noData

  const failures = Cause.failures(cause)
  let isLoading = false

  for (let i = 0; i < failures.length; i++) {
    const f = Chunk.unsafeGet(failures, i)

    // Immediately fail with NoSuchElementException mapping to NoData
    if (Cause.isNoSuchElementException(f)) return noData
    // Track if any of the failures are LoadingException, allow continuing to find any other possible NoSuchElementException
    else if (isLoadingException(f)) isLoading = true
  }

  // If there were no NoSuchElementExceptions, and there was a LoadingException, return Loading
  if (isLoading) return loading

  // Otherwise return Failure with these two states appropriately handled
  return failCause(cause as Cause.Cause<ExcludeRemoteDataExceptions<E>>)
}

/**
 * Check if a value is a LoadingException
 * @since 1.0.0
 */
export function isLoadingException(e: unknown): e is LoadingException {
  return (
    // Fast path for the most common case
    e === LoadingException ||
    (typeof e === "object" && e !== null && "_tag" in e && e._tag === "LoadingException")
  )
}

export {
  /**
   * Returns `true` if the specified value is an `NoSuchElementException`, `false`
   * otherwise.
   *
   * @since 1.0.0
   * @category refinements
   */
  isNoSuchElementException,
  /**
   * Represents a checked exception which occurs when an expected element was
   * unable to be found.
   *
   * @since 1.0.0
   * @category errors
   */
  NoSuchElementException
} from "effect/Cause"

function makeException<T extends { _tag: string; message?: string }>(
  proto: Omit<T, "message" | "_tag">,
  tag: T["_tag"]
) {
  const _tag = {
    value: tag,
    enumerable: true
  }
  const protoWithToString = {
    ...proto,
    toString(this: { _tag: string; message?: string }): string {
      return `${this._tag}: ${this.message}`
    }
  }
  return (message?: string): T =>
    Object.create(protoWithToString, {
      _tag,
      message: {
        value: message,
        enumerable: true
      }
    })
}
