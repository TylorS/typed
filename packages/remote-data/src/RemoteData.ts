import * as Chunk from '@effect/data/Chunk'
import * as Either from '@effect/data/Either'
import * as Equal from '@effect/data/Equal'
import * as Equivalence from '@effect/data/Equivalence'
import { identity, dual, pipe } from '@effect/data/Function'
import * as Hash from '@effect/data/Hash'
import * as Option from '@effect/data/Option'
import { Pipeable, pipeArguments } from '@effect/data/Pipeable'
import type * as Unify from '@effect/data/Unify'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'

export type RemoteData<E, A> = NoData | Loading | Failure<E> | Success<A>

export namespace RemoteData {
  export type Any = RemoteData<any, any>

  export type Error<T> = [T] extends [never]
    ? never
    : // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [T] extends [RemoteData<infer E, infer _>]
    ? E
    : never

  export type Success<T> = [T] extends [never]
    ? never
    : // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [T] extends [RemoteData<infer _, infer A>]
    ? A
    : never

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
    RemoteData: () => A[Unify.typeSymbol] extends RemoteData<infer E0, infer A0> | infer _
      ? RemoteData<E0, A0>
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

export interface NoData
  extends Effect.Effect<never, Cause.NoSuchElementException, never>,
    Pipeable {
  readonly state: 'NoData' // We use state here instead of _tag because we want to be a sub-type of Effect which has a _tag

  [Unify.typeSymbol]?: unknown
  [Unify.unifySymbol]?: RemoteData.Unify<this>
  [Unify.blacklistSymbol]?: RemoteData.UnifyBlackList
}

export interface Loading extends Effect.Effect<never, LoadingException, never>, Pipeable {
  readonly state: 'Loading'

  [Unify.typeSymbol]?: unknown
  [Unify.unifySymbol]?: RemoteData.Unify<this>
  [Unify.blacklistSymbol]?: RemoteData.UnifyBlackList
}

export interface LoadingException {
  readonly _tag: 'LoadingException'
}

export const LoadingException: LoadingException = { _tag: 'LoadingException' }

export interface Failure<E> extends Effect.Effect<never, E, never>, Pipeable {
  readonly state: 'Failure'
  readonly cause: Cause.Cause<E>
  readonly refreshing: boolean

  [Unify.typeSymbol]?: unknown
  [Unify.unifySymbol]?: RemoteData.Unify<this>
  [Unify.blacklistSymbol]?: RemoteData.UnifyBlackList
}

export interface Success<A> extends Effect.Effect<never, never, A>, Pipeable {
  readonly state: 'Success'
  readonly value: A
  readonly refreshing: boolean

  [Unify.typeSymbol]?: unknown
  [Unify.unifySymbol]?: RemoteData.Unify<this>
  [Unify.blacklistSymbol]?: RemoteData.UnifyBlackList
}

export function isRemoteData<E, A>(u: unknown): u is RemoteData<E, A> {
  return (
    u !== null &&
    typeof u === 'object' &&
    'state' in u &&
    (isNoData(u as any) || isLoading(u as any) || isFailure(u as any) || isSuccess(u as any))
  )
}

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
    },
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
    },
  ): R1 | R2 | R3 | R4 {
    switch (data.state) {
      case 'NoData':
        return matchers.onNoData()
      case 'Loading':
        return matchers.onLoading()
      case 'Failure':
        return matchers.onFailure((data as Failure<E>).cause, (data as Failure<E>).refreshing)
      case 'Success':
        return matchers.onSuccess((data as Success<A>).value, (data as Success<A>).refreshing)
    }
  },
)

export const toLoading = <E, A>(data: RemoteData<E, A>): RemoteData<E, A> =>
  match(data, {
    onNoData: () => loading,
    onLoading: () => loading,
    onFailure: (cause) => failCause(cause, true),
    onSuccess: (value) => success(value, true),
  })

export const stopLoading = <E, A>(data: RemoteData<E, A>): RemoteData<E, A> =>
  match(data, {
    onNoData: () => noData,
    onLoading: () => noData,
    onFailure: (cause) => failCause(cause, false),
    onSuccess: (value) => success(value, false),
  })

const causeEquivalence = <E>(
  E: Equivalence.Equivalence<E>,
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

export const getEquivalence = <E, A>(
  E: Equivalence.Equivalence<E>,
  A: Equivalence.Equivalence<A>,
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
  _A: identity,
}
const eqAny = getEquivalence(Equal.equals, Equal.equals)
const proto = {
  _tag: 'Commit',
  [Effect.EffectTypeId]: variance,
  i0: undefined,
  i1: undefined,
  i2: undefined,
  [Equal.symbol](this: RemoteData<any, any>, that: any) {
    return isRemoteData(that) && eqAny(this, that)
  },
  [Hash.symbol](this: RemoteData<any, any>) {
    switch (this.state) {
      case 'NoData':
      case 'Loading':
        return Hash.string(this.state)
      case 'Failure':
        return pipe(
          Hash.string(this.state),
          Hash.combine(Hash.hash((this as Failure<any>).cause)),
          Hash.combine(Hash.hash((this as Failure<any>).refreshing)),
        )
      case 'Success':
        return pipe(
          Hash.string(this.state),
          Hash.combine(Hash.hash((this as Success<any>).value)),
          Hash.combine(Hash.hash((this as Success<any>).refreshing)),
        )
    }
  },
  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return pipeArguments(this, arguments)
  },
}

const noSuchElementException = Effect.fail(Cause.NoSuchElementException())
const commitNoSuchElementException = () => noSuchElementException
const loadingException = Effect.fail(LoadingException)
const commitLoadingException = () => loadingException
const noDataString = `RemoteData(NoData)`
const loadingString = `RemoteData(Loading)`
const failureString = <E extends string>(E: E, refreshing: boolean) =>
  `RemoteData(Failure(${E})${refreshing ? `, refreshing=true` : ''})`
const successString = <A extends string>(A: A, refreshing: boolean) =>
  `RemoteData(Success(${A})${refreshing ? `, refreshing=true` : ''})`

export const noData: NoData = (() => {
  const data = Object.create(proto)

  data.state = 'NoData'
  data.commit = commitNoSuchElementException
  data.toString = () => noDataString

  return data
})()

export const loading: Loading = (() => {
  const data = Object.create(proto)

  data.state = 'Loading'
  data.commit = commitLoadingException
  data.toString = () => loadingString

  return data
})()

export function failCause<E>(cause: Cause.Cause<E>, refreshing: boolean = false): Failure<E> {
  const data = Object.create(proto)

  data.state = 'Failure'
  data.cause = cause
  data.refreshing = refreshing
  data.commit = () => Effect.failCause(cause)
  data.toString = () => failureString(Cause.pretty(cause), refreshing)

  return data
}

export function fail<E>(error: E, refreshing: boolean = false): Failure<E> {
  return failCause(Cause.fail(error), refreshing)
}

export function success<A>(value: A, refreshing: boolean = false): Success<A> {
  const data = Object.create(proto)

  data.state = 'Success'
  data.value = value
  data.refreshing = refreshing
  data.commit = () => Effect.succeed(value)
  data.toString = () => successString(JSON.stringify(value), refreshing)

  return data
}

export function isNoData<E, A>(data: RemoteData<E, A>): data is NoData {
  return data.state === 'NoData'
}

export function isLoading<E, A>(data: RemoteData<E, A>): data is Loading {
  return data.state === 'Loading'
}

export function isFailure<E, A>(data: RemoteData<E, A>): data is Failure<E> {
  return data.state === 'Failure'
}

export function isSuccess<E, A>(data: RemoteData<E, A>): data is Success<A> {
  return data.state === 'Success'
}

export function isRefreshing<E, A>(
  data: RemoteData<E, A>,
): data is (Failure<E> | Success<A>) & { readonly refreshing: true } {
  return isFailure(data) || isSuccess(data) ? data.refreshing : false
}

export function isLoadingOrRefreshing<E, A>(data: RemoteData<E, A>): boolean {
  return isLoading(data) || isRefreshing(data)
}

export function fromEither<E, A>(either: Either.Either<E, A>): RemoteData<E, A> {
  return Either.match(either, {
    onLeft: (e) => failCause(Cause.fail(e)),
    onRight: success,
  })
}

export function fromOption<A>(option: Option.Option<A>): RemoteData<never, A> {
  return Option.match(option, {
    onNone: () => noData,
    onSome: success,
  })
}

export const toOption = <E, A>(data: RemoteData<E, A>): Option.Option<A> =>
  isSuccess(data) ? Option.some(data.value) : Option.none()

export const toOptionCause = <E, A>(data: RemoteData<E, A>): Option.Option<Cause.Cause<E>> =>
  isFailure(data) ? Option.some(data.cause) : Option.none()

export const toOptionError = <E, A>(data: RemoteData<E, A>): Option.Option<E> =>
  isFailure(data) ? Either.getLeft(Cause.failureOrCause(data.cause)) : Option.none()

export function fromExit<E, A>(exit: Exit.Exit<E, A>): RemoteData<E, A> {
  return Exit.match<E, A, RemoteData<E, A>>(exit, {
    onFailure: unwrapCause,
    onSuccess: success,
  })
}

export const map: {
  <A, B>(f: (a: A) => B): <E>(data: RemoteData<E, A>) => RemoteData<E, B>
  <E, A, B>(data: RemoteData<E, A>, f: (a: A) => B): RemoteData<E, B>
} = dual(2, function map<E, A, B>(data: RemoteData<E, A>, f: (a: A) => B): RemoteData<E, B> {
  if (isSuccess(data)) {
    return success(f(data.value), data.refreshing)
  } else {
    return data as Failure<E> | NoData | Loading
  }
})

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
    return data as Success<A> | NoData | Loading
  }
})

export const mapErrorCause: {
  <E, E1>(
    f: (e: Cause.Cause<E>) => Cause.Cause<E1>,
  ): <A>(data: RemoteData<E, A>) => RemoteData<E1, A>
  <E, E1, A>(data: RemoteData<E, A>, f: (e: Cause.Cause<E>) => Cause.Cause<E1>): RemoteData<E1, A>
} = dual(2, function mapErrorCause<
  E,
  E1,
  A,
>(data: RemoteData<E, A>, f: (e: Cause.Cause<E>) => Cause.Cause<E1>): RemoteData<E1, A> {
  if (isFailure(data)) {
    return failCause(f(data.cause), data.refreshing)
  } else {
    return data as Success<A> | NoData | Loading
  }
})

export function unannotate<E, A>(data: RemoteData<E, A>): RemoteData<E, A> {
  return mapErrorCause(data, Cause.unannotate)
}

export const flatMap: {
  <A, E2, B>(
    f: (a: A, refreshing: boolean) => RemoteData<E2, B>,
  ): <E1>(data: RemoteData<E1, A>) => RemoteData<E1 | E2, B>
  <E1, A, E2, B>(
    data: RemoteData<E1, A>,
    f: (a: A, refreshing: boolean) => RemoteData<E2, B>,
  ): RemoteData<E1 | E2, B>
} = dual(2, function flatMap<
  E1,
  A,
  E2,
  B,
>(data: RemoteData<E1, A>, f: (a: A, refreshing: boolean) => RemoteData<E2, B>): RemoteData<
  E1 | E2,
  B
> {
  if (isSuccess(data)) {
    return f(data.value, data.refreshing)
  } else {
    return data as Failure<E1> | NoData | Loading
  }
})

export const catchAllCause: {
  <E, E1, B>(
    f: (e: Cause.Cause<E>, refreshing: boolean) => RemoteData<E1, B>,
  ): <A>(data: RemoteData<E, A>) => RemoteData<E1, A | B>
  <E, A, E1, B>(
    data: RemoteData<E, A>,
    f: (e: Cause.Cause<E>, refreshing: boolean) => RemoteData<E1, B>,
  ): RemoteData<E1, A | B>
} = dual(2, function catchAllCause<
  E,
  A,
  E1,
  B,
>(data: RemoteData<E, A>, f: (e: Cause.Cause<E>, refreshing: boolean) => RemoteData<E1, B>): RemoteData<
  E1,
  A | B
> {
  if (isFailure(data)) {
    return f(data.cause, data.refreshing)
  } else {
    return data as Success<A> | NoData | Loading
  }
})

export const catchAll: {
  <E, E1, B>(
    f: (e: E, refreshing: boolean) => RemoteData<E1, B>,
  ): <A>(data: RemoteData<E, A>) => RemoteData<E1, A | B>

  <E, A, E1, B>(
    data: RemoteData<E, A>,
    f: (e: E, refreshing: boolean) => RemoteData<E1, B>,
  ): RemoteData<E1, A | B>
} = dual(2, function catchAll<
  E,
  A,
  E1,
  B,
>(data: RemoteData<E, A>, f: (e: E, refreshing: boolean) => RemoteData<E1, B>): RemoteData<
  E1,
  A | B
> {
  if (isFailure(data)) {
    return Either.match(Cause.failureOrCause(data.cause), {
      onLeft: (e) => f(e, data.refreshing),
      onRight: () => data as Failure<never>,
    })
  } else {
    return data as Success<A> | NoData | Loading
  }
})

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

export const getOrNull = getOrElse(() => null)
export const getOrUndefined = getOrElse(() => undefined)

export const zipWith: {
  <A, E2, B, C>(
    that: RemoteData<E2, B>,
    f: (a: A, b: B) => C,
  ): <E1>(self: RemoteData<E1, A>) => RemoteData<E1 | E2, C>
  <E1, A, E2, B, C>(
    self: RemoteData<E1, A>,
    that: RemoteData<E2, B>,
    f: (a: A, b: B) => C,
  ): RemoteData<E1 | E2, C>
} = dual(3, function zipWith<
  E,
  A,
  E2,
  B,
  C,
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
        return success(f(selfValue, that.value), selfRefreshing && that.refreshing)
      } else {
        return that
      }
    },
  }) as any
})

export const zip: {
  <E2, B>(
    that: RemoteData<E2, B>,
  ): <E1, A>(self: RemoteData<E1, A>) => RemoteData<E1 | E2, readonly [A, B]>
  <E1, A, E2, B>(
    self: RemoteData<E1, A>,
    that: RemoteData<E2, B>,
  ): RemoteData<E1 | E2, readonly [A, B]>
} = dual(2, function zip<
  E1,
  A,
  E2,
  B,
>(self: RemoteData<E1, A>, that: RemoteData<E2, B>): RemoteData<E1 | E2, readonly [A, B]> {
  return zipWith(self, that, (a, b) => [a, b] as const)
})

export function tuple<Data extends readonly RemoteData.Any[]>(
  ...data: Data
): RemoteData<
  RemoteData.Error<Data[number]>,
  { readonly [K in keyof Data]: RemoteData.Success<Data[K]> }
> {
  const failures: Failure<RemoteData.Error<Data[number]>>[] = []
  const successes: Success<RemoteData.Success<Data[number]>>[] = []
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

  return success(
    successes.map((s) => s.value),
    successes.every((s) => s.refreshing),
  ) as any
}

export function struct<Data extends Readonly<Record<string, RemoteData.Any>>>(
  data: Data,
): RemoteData<
  RemoteData.Error<Data[keyof Data]>,
  { readonly [K in keyof Data]: RemoteData.Success<Data[K]> }
> {
  return map(
    tuple(...Object.entries(data).map(([k, data]) => map(data, (data) => [k, data] as const))),
    Object.fromEntries,
  )
}

export function all<
  Data extends readonly RemoteData.Any[] | Readonly<Record<string, RemoteData.Any>>,
>(
  data: Data,
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

export function unwrapEffect<R, E, A>(
  effect: Effect.Effect<R, E, A>,
): Effect.Effect<R, never, RemoteData<ExcludeRemoteDataExceptions<E>, A>> {
  return pipe(
    effect,
    Effect.matchCause({
      onFailure: unwrapCause,
      onSuccess: success,
    }),
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

export function isLoadingException(e: unknown): e is LoadingException {
  return (
    // Fast path for the most common case
    e === LoadingException ||
    (typeof e === 'object' && e !== null && '_tag' in e && e._tag === 'LoadingException')
  )
}

export { NoSuchElementException, isNoSuchElementException } from '@effect/io/Cause'
