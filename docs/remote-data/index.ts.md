---
title: index.ts
nav_order: 1
parent: "@typed/remote-data"
---

## index overview

RemoteData is a data type that represents the state of a remote resource.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [errors](#errors)
  - [NoSuchElementException](#nosuchelementexception)
- [refinements](#refinements)
  - [isNoSuchElementException](#isnosuchelementexception)
- [utils](#utils)
  - [Failure (interface)](#failure-interface)
  - [Loading (interface)](#loading-interface)
  - [LoadingException](#loadingexception)
  - [LoadingException (interface)](#loadingexception-interface)
  - [LoadingExceptionTypeId](#loadingexceptiontypeid)
  - [LoadingExceptionTypeId (type alias)](#loadingexceptiontypeid-type-alias)
  - [NoData (interface)](#nodata-interface)
  - [Refreshing (type alias)](#refreshing-type-alias)
  - [RemoteData (type alias)](#remotedata-type-alias)
  - [RemoteData (namespace)](#remotedata-namespace)
    - [Unify (interface)](#unify-interface)
    - [UnifyBlackList (interface)](#unifyblacklist-interface)
    - [Variance (interface)](#variance-interface)
    - [Any (type alias)](#any-type-alias)
    - [Error (type alias)](#error-type-alias)
    - [Success (type alias)](#success-type-alias)
  - [Success (interface)](#success-interface)
  - [all](#all)
  - [catchAll](#catchall)
  - [catchAllCause](#catchallcause)
  - [fail](#fail)
  - [failCause](#failcause)
  - [flatMap](#flatmap)
  - [fromEither](#fromeither)
  - [fromExit](#fromexit)
  - [fromOption](#fromoption)
  - [getEquivalence](#getequivalence)
  - [getOrElse](#getorelse)
  - [getOrNull](#getornull)
  - [getOrUndefined](#getorundefined)
  - [isFailure](#isfailure)
  - [isLoading](#isloading)
  - [isLoadingException](#isloadingexception)
  - [isLoadingOrRefreshing](#isloadingorrefreshing)
  - [isNoData](#isnodata)
  - [isRefreshing](#isrefreshing)
  - [isRemoteData](#isremotedata)
  - [isSuccess](#issuccess)
  - [loading](#loading)
  - [map](#map)
  - [mapError](#maperror)
  - [mapErrorCause](#maperrorcause)
  - [match](#match)
  - [noData](#nodata)
  - [stopLoading](#stoploading)
  - [struct](#struct)
  - [success](#success)
  - [toLoading](#toloading)
  - [toOption](#tooption)
  - [toOptionCause](#tooptioncause)
  - [toOptionError](#tooptionerror)
  - [tuple](#tuple)
  - [unannotate](#unannotate)
  - [unwrapEffect](#unwrapeffect)
  - [zip](#zip)
  - [zipWith](#zipwith)

---

# errors

## NoSuchElementException

Represents a checked exception which occurs when an expected element was
unable to be found.

**Signature**

```ts
export declare const NoSuchElementException: (message?: string | undefined) => Cause.NoSuchElementException
```

Added in v1.0.0

# refinements

## isNoSuchElementException

Returns `true` if the specified value is an `NoSuchElementException`, `false`
otherwise.

**Signature**

```ts
export declare const isNoSuchElementException: (u: unknown) => u is Cause.NoSuchElementException
```

Added in v1.0.0

# utils

## Failure (interface)

One possibility for the third state of a RemoteData where data has failed to load
with some value `E`. This state can be refreshed:true when the data is being
reloaded after an initial failure.

**Signature**

```ts
export interface Failure<E> extends Effect.Effect<never, E, never>, Pipeable {
  readonly state: 'Failure'
  readonly cause: Cause.Cause<E>
  readonly refreshing: boolean

  [Unify.typeSymbol]?: unknown
  [Unify.unifySymbol]?: RemoteData.Unify<this>
  [Unify.blacklistSymbol]?: RemoteData.UnifyBlackList
}
```

Added in v1.0.0

## Loading (interface)

The second state of a RemoteData where data is attempting to be loaded.

**Signature**

```ts
export interface Loading extends Effect.Effect<never, LoadingException, never>, Pipeable {
  readonly state: 'Loading'

  [Unify.typeSymbol]?: unknown
  [Unify.unifySymbol]?: RemoteData.Unify<this>
  [Unify.blacklistSymbol]?: RemoteData.UnifyBlackList
}
```

Added in v1.0.0

## LoadingException

Create a LoadingException

**Signature**

```ts
export declare const LoadingException: (message?: string) => LoadingException
```

Added in v1.0.0

## LoadingException (interface)

A LoadingException is thrown when a remote resource fails to load
and is being used as an Effect.

**Signature**

```ts
export interface LoadingException {
  readonly [LoadingExceptionTypeId]: LoadingExceptionTypeId
  readonly _tag: 'LoadingException'
  readonly message?: string
}
```

Added in v1.0.0

## LoadingExceptionTypeId

The TypeId for a LoadingException

**Signature**

```ts
export declare const LoadingExceptionTypeId: typeof LoadingExceptionTypeId
```

Added in v1.0.0

## LoadingExceptionTypeId (type alias)

The TypeId for a LoadingException

**Signature**

```ts
export type LoadingExceptionTypeId = typeof LoadingExceptionTypeId
```

Added in v1.0.0

## NoData (interface)

The initial state of a RemoteData where no data has been loaded or has been cleared.

**Signature**

```ts
export interface NoData extends Effect.Effect<never, Cause.NoSuchElementException, never>, Pipeable {
  readonly state: 'NoData' // We use state here instead of _tag because we want to be a sub-type of Effect which has a _tag

  [Unify.typeSymbol]?: unknown
  [Unify.unifySymbol]?: RemoteData.Unify<this>
  [Unify.blacklistSymbol]?: RemoteData.UnifyBlackList
}
```

Added in v1.0.0

## Refreshing (type alias)

The Refreshing state of a RemoteData

**Signature**

```ts
export type Refreshing<E, A> = (Failure<E> | Success<A>) & { readonly refreshing: true }
```

Added in v1.0.0

## RemoteData (type alias)

RemoteData is a data type that represents the state of a remote resource.

**Signature**

```ts
export type RemoteData<E, A> = NoData | Loading | Failure<E> | Success<A>
```

Added in v1.0.0

## RemoteData (namespace)

Added in v1.0.0

### Unify (interface)

**Signature**

```ts
export interface Unify<A extends { [Unify.typeSymbol]?: any }> extends Effect.EffectUnify<A> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  RemoteData: () => A[Unify.typeSymbol] extends RemoteData<infer E0, infer A0> | infer _ ? RemoteData<E0, A0> : never
}
```

Added in v1.0.0

### UnifyBlackList (interface)

**Signature**

```ts
export interface UnifyBlackList extends Effect.EffectUnifyBlacklist {
  Effect?: true
}
```

Added in v1.0.0

### Variance (interface)

A type for representing the variance of RemoteData

**Signature**

```ts
export interface Variance<E, A> {
  readonly _E: (_: never) => E
  readonly _A: (_: never) => A
}
```

Added in v1.0.0

### Any (type alias)

A helper for a remotedata that has any values.

**Signature**

```ts
export type Any = RemoteData<any, any>
```

Added in v1.0.0

### Error (type alias)

A helper extracting the error type from a RemoteData

**Signature**

```ts
export type Error<T> = [T] extends [never]
  ? never
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [T] extends [RemoteData<infer E, infer _>]
  ? E
  : never
```

Added in v1.0.0

### Success (type alias)

A helper extracting the success type from a RemoteData

**Signature**

```ts
export type Success<T> = [T] extends [never]
  ? never
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [T] extends [RemoteData<infer _, infer A>]
  ? A
  : never
```

Added in v1.0.0

## Success (interface)

One possibility for the third state of a RemoteData where data has successfully
loaded with some value `A`. This state can be refreshed:true when the data is being
reloaded after an initial success.

**Signature**

```ts
export interface Success<A> extends Effect.Effect<never, never, A>, Pipeable {
  readonly state: 'Success'
  readonly value: A
  readonly refreshing: boolean

  [Unify.typeSymbol]?: unknown
  [Unify.unifySymbol]?: RemoteData.Unify<this>
  [Unify.blacklistSymbol]?: RemoteData.UnifyBlackList
}
```

Added in v1.0.0

## all

Combine the success values of multiple RemoteData values.

**Signature**

```ts
export declare function all<Data extends ReadonlyArray<RemoteData.Any> | Readonly<Record<string, RemoteData.Any>>>(
  data: Data
): RemoteData<RemoteData.Error<Data[keyof Data]>, { readonly [K in keyof Data]: RemoteData.Success<Data[K]> }>
```

Added in v1.0.0

## catchAll

Recover from a failure with another RemoteData

**Signature**

```ts
export declare const catchAll: {
  <E, E1, B>(f: (e: E, refreshing: boolean) => RemoteData<E1, B>): <A>(data: RemoteData<E, A>) => RemoteData<E1, B | A>
  <E, A, E1, B>(data: RemoteData<E, A>, f: (e: E, refreshing: boolean) => RemoteData<E1, B>): RemoteData<E1, A | B>
}
```

Added in v1.0.0

## catchAllCause

Recover from a failure with another RemoteData

**Signature**

```ts
export declare const catchAllCause: {
  <E, E1, B>(f: (e: Cause.Cause<E>, refreshing: boolean) => RemoteData<E1, B>): <A>(
    data: RemoteData<E, A>
  ) => RemoteData<E1, B | A>
  <E, A, E1, B>(data: RemoteData<E, A>, f: (e: Cause.Cause<E>, refreshing: boolean) => RemoteData<E1, B>): RemoteData<
    E1,
    A | B
  >
}
```

Added in v1.0.0

## fail

Construct a Failure from a value

**Signature**

```ts
export declare function fail<E>(error: E, refreshing: boolean = false): Failure<E>
```

Added in v1.0.0

## failCause

Construct a Failure from a Cause

**Signature**

```ts
export declare function failCause<E>(cause: Cause.Cause<E>, refreshing: boolean = false): Failure<E>
```

Added in v1.0.0

## flatMap

Chain together a function that returns a RemoteData

**Signature**

```ts
export declare const flatMap: {
  <A, E2, B>(f: (a: A, refreshing: boolean) => RemoteData<E2, B>): <E1>(
    data: RemoteData<E1, A>
  ) => RemoteData<E2 | E1, B>
  <E1, A, E2, B>(data: RemoteData<E1, A>, f: (a: A, refreshing: boolean) => RemoteData<E2, B>): RemoteData<E1 | E2, B>
}
```

Added in v1.0.0

## fromEither

Construct a RemoteData from an Either

**Signature**

```ts
export declare function fromEither<E, A>(either: Either.Either<E, A>): RemoteData<E, A>
```

Added in v1.0.0

## fromExit

Convert an Exit<E, A> to a RemoteData<E, A>

**Signature**

```ts
export declare function fromExit<E, A>(exit: Exit.Exit<E, A>): RemoteData<E, A>
```

Added in v1.0.0

## fromOption

Construct a RemoteData from an Option

**Signature**

```ts
export declare function fromOption<A>(option: Option.Option<A>): RemoteData<never, A>
```

Added in v1.0.0

## getEquivalence

Get an Equivalence for RemoteData

**Signature**

```ts
export declare const getEquivalence: <E, A>(
  E: Equivalence.Equivalence<E>,
  A: Equivalence.Equivalence<A>
) => Equivalence.Equivalence<RemoteData<E, A>>
```

Added in v1.0.0

## getOrElse

Get the success value of a RemoteData or return a default value

**Signature**

```ts
export declare const getOrElse: {
  <B>(f: () => B): <E, A>(data: RemoteData<E, A>) => B | A
  <E, A, B>(data: RemoteData<E, A>, f: () => B): A | B
}
```

Added in v1.0.0

## getOrNull

Get the success value of a RemoteData or return `null`

**Signature**

```ts
export declare const getOrNull: <E, A>(data: RemoteData<E, A>) => A | null
```

Added in v1.0.0

## getOrUndefined

Get the success value of a RemoteData or return `undefined`

**Signature**

```ts
export declare const getOrUndefined: <E, A>(data: RemoteData<E, A>) => A | undefined
```

Added in v1.0.0

## isFailure

Check if a RemoteData is Failure

**Signature**

```ts
export declare function isFailure<E, A>(data: RemoteData<E, A>): data is Failure<E>
```

Added in v1.0.0

## isLoading

Check if a RemoteData is Loading

**Signature**

```ts
export declare function isLoading<E, A>(data: RemoteData<E, A>): data is Loading
```

Added in v1.0.0

## isLoadingException

Check if a value is a LoadingException

**Signature**

```ts
export declare function isLoadingException(e: unknown): e is LoadingException
```

Added in v1.0.0

## isLoadingOrRefreshing

Check if a RemoteData is Loading or Refreshing

**Signature**

```ts
export declare function isLoadingOrRefreshing<E, A>(data: RemoteData<E, A>): data is Loading | Refreshing<E, A>
```

Added in v1.0.0

## isNoData

Check if a RemoteData is NoData

**Signature**

```ts
export declare function isNoData<E, A>(data: RemoteData<E, A>): data is NoData
```

Added in v1.0.0

## isRefreshing

Check if a RemoteData is Refreshing

**Signature**

```ts
export declare function isRefreshing<E, A>(data: RemoteData<E, A>): data is Refreshing<E, A>
```

Added in v1.0.0

## isRemoteData

Check if a value is a RemoteData.

**Signature**

```ts
export declare function isRemoteData<E, A>(u: unknown): u is RemoteData<E, A>
```

Added in v1.0.0

## isSuccess

Check if a RemoteData is Success

**Signature**

```ts
export declare function isSuccess<E, A>(data: RemoteData<E, A>): data is Success<A>
```

Added in v1.0.0

## loading

A singleton instance of Loading

**Signature**

```ts
export declare const loading: Loading
```

Added in v1.0.0

## map

Map over the success value of a RemoteData

**Signature**

```ts
export declare const map: {
  <A, B>(f: (a: A) => B): <E>(data: RemoteData<E, A>) => RemoteData<E, B>
  <E, A, B>(data: RemoteData<E, A>, f: (a: A) => B): RemoteData<E, B>
}
```

Added in v1.0.0

## mapError

Map over the failure value of a RemoteData

**Signature**

```ts
export declare const mapError: {
  <E, E1>(f: (e: E) => E1): <A>(data: RemoteData<E, A>) => RemoteData<E1, A>
  <E, E1, A>(data: RemoteData<E, A>, f: (e: E) => E1): RemoteData<E1, A>
}
```

Added in v1.0.0

## mapErrorCause

Map over the failure cause of a RemoteData

**Signature**

```ts
export declare const mapErrorCause: {
  <E, E1>(f: (e: Cause.Cause<E>) => Cause.Cause<E1>): <A>(data: RemoteData<E, A>) => RemoteData<E1, A>
  <E, E1, A>(data: RemoteData<E, A>, f: (e: Cause.Cause<E>) => Cause.Cause<E1>): RemoteData<E1, A>
}
```

Added in v1.0.0

## match

Match over the states of a RemoteData.

**Signature**

```ts
export declare const match: {
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
}
```

Added in v1.0.0

## noData

A singleton instance of NoData

**Signature**

```ts
export declare const noData: NoData
```

Added in v1.0.0

## stopLoading

Change the state of a RemoteData to NoData or Refreshing=false.

**Signature**

```ts
export declare const stopLoading: <E, A>(data: RemoteData<E, A>) => RemoteData<E, A>
```

Added in v1.0.0

## struct

Combine the success values of a struct RemoteData values.

**Signature**

```ts
export declare function struct<Data extends Readonly<Record<string, RemoteData.Any>>>(
  data: Data
): RemoteData<RemoteData.Error<Data[keyof Data]>, { readonly [K in keyof Data]: RemoteData.Success<Data[K]> }>
```

Added in v1.0.0

## success

Construct a Success from a value

**Signature**

```ts
export declare function success<A>(value: A, refreshing: boolean = false): Success<A>
```

Added in v1.0.0

## toLoading

Change the state of a RemoteData to Loading or Refreshing=true.

**Signature**

```ts
export declare const toLoading: <E, A>(data: RemoteData<E, A>) => RemoteData<E, A>
```

Added in v1.0.0

## toOption

Convert a RemoteData to an Option of its possible success value.

**Signature**

```ts
export declare const toOption: <E, A>(data: RemoteData<E, A>) => Option.Option<A>
```

Added in v1.0.0

## toOptionCause

Convert a RemoteData to an Option of its possible failure cause.

**Signature**

```ts
export declare const toOptionCause: <E, A>(data: RemoteData<E, A>) => Option.Option<Cause.Cause<E>>
```

Added in v1.0.0

## toOptionError

Convert a RemoteData to an Option of its possible failure value.

**Signature**

```ts
export declare const toOptionError: <E, A>(data: RemoteData<E, A>) => Option.Option<E>
```

Added in v1.0.0

## tuple

Combine the success values of multiple RemoteData values.

**Signature**

```ts
export declare function tuple<Data extends ReadonlyArray<RemoteData.Any>>(
  ...data: Data
): RemoteData<RemoteData.Error<Data[number]>, { readonly [K in keyof Data]: RemoteData.Success<Data[K]> }>
```

Added in v1.0.0

## unannotate

Unannotate a cause held within a RemoteData. Useful for testing.

**Signature**

```ts
export declare function unannotate<E, A>(data: RemoteData<E, A>): RemoteData<E, A>
```

Added in v1.0.0

## unwrapEffect

Unwrap an Effect into a RemoteData.

**Signature**

```ts
export declare function unwrapEffect<R, E, A>(
  effect: Effect.Effect<R, E, A>
): Effect.Effect<R, never, RemoteData<ExcludeRemoteDataExceptions<E>, A>>
```

Added in v1.0.0

## zip

Combine the success values of two RemoteData values.

**Signature**

```ts
export declare const zip: {
  <E2, B>(that: RemoteData<E2, B>): <E1, A>(self: RemoteData<E1, A>) => RemoteData<E2 | E1, readonly [A, B]>
  <E1, A, E2, B>(self: RemoteData<E1, A>, that: RemoteData<E2, B>): RemoteData<E1 | E2, readonly [A, B]>
}
```

Added in v1.0.0

## zipWith

Combine the success values of two RemoteData values.

**Signature**

```ts
export declare const zipWith: {
  <A, E2, B, C>(that: RemoteData<E2, B>, f: (a: A, b: B) => C): <E1>(self: RemoteData<E1, A>) => RemoteData<E2 | E1, C>
  <E1, A, E2, B, C>(self: RemoteData<E1, A>, that: RemoteData<E2, B>, f: (a: A, b: B) => C): RemoteData<E1 | E2, C>
}
```

Added in v1.0.0
