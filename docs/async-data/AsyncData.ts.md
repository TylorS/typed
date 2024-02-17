---
title: AsyncData.ts
nav_order: 1
parent: "@typed/async-data"
---

## AsyncData overview

AsyncData represents a piece of data which is acquired asynchronously with loading, failure, and progress states
in addition to Option-like states of NoData and Success.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [AsyncData (type alias)](#asyncdata-type-alias)
  - [AsyncData (namespace)](#asyncdata-namespace)
    - [IgnoreList (interface)](#ignorelist-interface)
    - [Unify (interface)](#unify-interface)
    - [Error (type alias)](#error-type-alias)
    - [Success (type alias)](#success-type-alias)
  - [Failure (interface)](#failure-interface)
  - [FailureOptions (type alias)](#failureoptions-type-alias)
  - [Loading (class)](#loading-class)
    - [[AsyncDataTypeId] (property)](#asyncdatatypeid-property)
    - [[Unify.typeSymbol] (property)](#unifytypesymbol-property)
    - [[Unify.unifySymbol] (property)](#unifyunifysymbol-property)
    - [[Unify.ignoreSymbol] (property)](#unifyignoresymbol-property)
  - [LoadingOptions (type alias)](#loadingoptions-type-alias)
  - [NoData (class)](#nodata-class)
    - [[AsyncDataTypeId] (property)](#asyncdatatypeid-property-1)
    - [[Unify.typeSymbol] (property)](#unifytypesymbol-property-1)
    - [[Unify.unifySymbol] (property)](#unifyunifysymbol-property-1)
    - [[Unify.ignoreSymbol] (property)](#unifyignoresymbol-property-1)
  - [Optimistic (interface)](#optimistic-interface)
  - [OptimisticOptions (interface)](#optimisticoptions-interface)
  - [OptionalPartial (type alias)](#optionalpartial-type-alias)
  - [Refreshing (type alias)](#refreshing-type-alias)
  - [RefreshingFailure (interface)](#refreshingfailure-interface)
  - [RefreshingSuccess (interface)](#refreshingsuccess-interface)
  - [Success (interface)](#success-interface)
  - [SuccessOptions (type alias)](#successoptions-type-alias)
  - [dataEqual](#dataequal)
  - [done](#done)
  - [fail](#fail)
  - [failCause](#failcause)
  - [flatMap](#flatmap)
  - [fromEither](#fromeither)
  - [fromExit](#fromexit)
  - [getEquivalence](#getequivalence)
  - [getFailure](#getfailure)
  - [getSuccess](#getsuccess)
  - [isAsyncData](#isasyncdata)
  - [isExpired](#isexpired)
  - [isFailure](#isfailure)
  - [isLoading](#isloading)
  - [isLoadingOrRefreshing](#isloadingorrefreshing)
  - [isNoData](#isnodata)
  - [isOptimistic](#isoptimistic)
  - [isRefreshing](#isrefreshing)
  - [isSuccess](#issuccess)
  - [loading](#loading)
  - [map](#map)
  - [match](#match)
  - [noData](#nodata)
  - [optimistic](#optimistic)
  - [startLoading](#startloading)
  - [stopLoading](#stoploading)
  - [success](#success)

---

# utils

## AsyncData (type alias)

AsyncData represents a piece of data which is acquired asynchronously with loading, failure, and progress states
in addition to Option-like states of NoData and Success.

**Signature**

```ts
export type AsyncData<A, E = never> = NoData | Loading | Failure<E> | Success<A> | Optimistic<A, E>
```

Added in v1.0.0

## AsyncData (namespace)

Added in v1.0.0

### IgnoreList (interface)

**Signature**

```ts
export interface IgnoreList extends Effect.EffectUnifyIgnore {
  Effect: true
}
```

Added in v1.0.0

### Unify (interface)

**Signature**

```ts
export interface Unify<A extends { [Unify.typeSymbol]?: any }> extends Effect.EffectUnify<A> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  AsyncData: () => Unify_<A[Unify.typeSymbol]> extends AsyncData<infer E0, infer A0> | infer _
    ? AsyncData<E0, A0>
    : never
}
```

Added in v1.0.0

### Error (type alias)

**Signature**

```ts
export type Error<T> = [T] extends [AsyncData<infer _, infer E>] ? E : never
```

Added in v1.0.0

### Success (type alias)

**Signature**

```ts
export type Success<T> = [T] extends [AsyncData<infer A, infer _>] ? A : never
```

Added in v1.0.0

## Failure (interface)

**Signature**

```ts
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
```

Added in v1.0.0

## FailureOptions (type alias)

**Signature**

```ts
export type FailureOptions = {
  readonly timestamp: number // Date.now()
  readonly refreshing: Option.Option<Loading>
}
```

Added in v1.0.0

## Loading (class)

**Signature**

```ts
export declare class Loading
```

Added in v1.0.0

### [AsyncDataTypeId] (property)

**Signature**

```ts
readonly [AsyncDataTypeId]: typeof AsyncDataTypeId
```

Added in v1.0.0

### [Unify.typeSymbol] (property)

**Signature**

```ts
readonly [Unify.typeSymbol]: unknown
```

Added in v1.0.0

### [Unify.unifySymbol] (property)

**Signature**

```ts
readonly [Unify.unifySymbol]: AsyncData.Unify<this>
```

Added in v1.0.0

### [Unify.ignoreSymbol] (property)

**Signature**

```ts
readonly [Unify.ignoreSymbol]: AsyncData.IgnoreList
```

Added in v1.0.0

## LoadingOptions (type alias)

**Signature**

```ts
export type LoadingOptions = {
  readonly timestamp: number // Date.now()
  readonly progress: Option.Option<Progress.Progress>
}
```

Added in v1.0.0

## NoData (class)

**Signature**

```ts
export declare class NoData
```

Added in v1.0.0

### [AsyncDataTypeId] (property)

**Signature**

```ts
readonly [AsyncDataTypeId]: typeof AsyncDataTypeId
```

Added in v1.0.0

### [Unify.typeSymbol] (property)

**Signature**

```ts
readonly [Unify.typeSymbol]: unknown
```

Added in v1.0.0

### [Unify.unifySymbol] (property)

**Signature**

```ts
readonly [Unify.unifySymbol]: AsyncData.Unify<this>
```

Added in v1.0.0

### [Unify.ignoreSymbol] (property)

**Signature**

```ts
readonly [Unify.ignoreSymbol]: AsyncData.IgnoreList
```

Added in v1.0.0

## Optimistic (interface)

**Signature**

```ts
export interface Optimistic<A, E = never> extends Effect.Effect<never, never, A> {
  readonly [AsyncDataTypeId]: AsyncDataTypeId
  readonly _tag: "Optimistic"
  readonly value: A
  readonly timestamp: number // Date.now()
  readonly previous: AsyncData<A, E>

  readonly [Unify.typeSymbol]: unknown
  readonly [Unify.unifySymbol]: AsyncData.Unify<this>
  readonly [Unify.ignoreSymbol]: AsyncData.IgnoreList
}
```

Added in v1.0.0

## OptimisticOptions (interface)

**Signature**

```ts
export interface OptimisticOptions {
  readonly timestamp: number // Date.now()
}
```

Added in v1.0.0

## OptionalPartial (type alias)

**Signature**

```ts
export type OptionalPartial<A> = [
  {
    [K in keyof A]+?: [A[K]] extends [Option.Option<infer R>] ? R | undefined : A[K]
  }
] extends [infer R]
  ? { readonly [K in keyof R]: R[K] }
  : never
```

Added in v1.0.0

## Refreshing (type alias)

**Signature**

```ts
export type Refreshing<A, E> = RefreshingFailure<E> | RefreshingSuccess<A>
```

Added in v1.0.0

## RefreshingFailure (interface)

**Signature**

```ts
export interface RefreshingFailure<E> extends Failure<E> {
  readonly refreshing: Option.Some<Loading>
}
```

Added in v1.0.0

## RefreshingSuccess (interface)

**Signature**

```ts
export interface RefreshingSuccess<A> extends Success<A> {
  readonly refreshing: Option.Some<Loading>
}
```

Added in v1.0.0

## Success (interface)

**Signature**

```ts
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
```

Added in v1.0.0

## SuccessOptions (type alias)

**Signature**

```ts
export type SuccessOptions = {
  readonly timestamp: number // Date.now()
  readonly refreshing: Option.Option<Loading>
}
```

Added in v1.0.0

## dataEqual

Checks if two AsyncData are equal, disregarding the timestamps associated with them. Useful for testing
without needing to manage timestamps.

**Signature**

```ts
export declare function dataEqual<A, E>(first: AsyncData<A, E>, second: AsyncData<A, E>): boolean
```

Added in v1.0.0

## done

**Signature**

```ts
export declare const done: <A, E = never>(exit: Exit.Exit<A, E>) => AsyncData<A, E>
```

Added in v1.0.0

## fail

**Signature**

```ts
export declare const fail: {
  <E>(error: E, options?: OptionalPartial<FailureOptions>): Failure<E>
  <A, E>(error: E, options?: OptionalPartial<FailureOptions>): AsyncData<A, E>
}
```

Added in v1.0.0

## failCause

**Signature**

```ts
export declare const failCause: {
  <E>(cause: Cause.Cause<E>, options?: OptionalPartial<FailureOptions>): Failure<E>
  <A, E>(cause: Cause.Cause<E>, options?: OptionalPartial<FailureOptions>): AsyncData<A, E>
}
```

Added in v1.0.0

## flatMap

**Signature**

```ts
export declare const flatMap: {
  <A, E, B, E2>(
    f: (a: A, data: Success<A> | Optimistic<A, E>) => AsyncData<B, E2>
  ): (data: AsyncData<A, E>) => AsyncData<B, E | E2>
  <A, E, B, E2>(
    data: AsyncData<A, E>,
    f: (a: A, data: Success<A> | Optimistic<A, E>) => AsyncData<B, E>
  ): AsyncData<B, E | E2>
}
```

Added in v1.0.0

## fromEither

**Signature**

```ts
export declare function fromEither<E, A>(either: Either.Either<E, A>): AsyncData<A, E>
```

Added in v1.0.0

## fromExit

**Signature**

```ts
export declare function fromExit<A, E>(exit: Exit.Exit<A, E>): AsyncData<A, E>
```

Added in v1.0.0

## getEquivalence

**Signature**

```ts
export declare const getEquivalence: <A, E>(
  valueEq?: Equivalence.Equivalence<A>
) => Equivalence.Equivalence<AsyncData<A, E>>
```

Added in v1.0.0

## getFailure

**Signature**

```ts
export declare const getFailure: <A, E>(data: AsyncData<A, E>) => Option.Option<E>
```

Added in v1.0.0

## getSuccess

**Signature**

```ts
export declare const getSuccess: <A, E>(data: AsyncData<A, E>) => Option.Option<A>
```

Added in v1.0.0

## isAsyncData

**Signature**

```ts
export declare const isAsyncData: <A, E>(u: unknown) => u is AsyncData<A, E>
```

Added in v1.0.0

## isExpired

**Signature**

```ts
export declare const isExpired: {
  (ttl: Duration.DurationInput, now?: number): <A, E>(data: AsyncData<A, E>) => boolean
  <A, E>(data: AsyncData<A, E>, ttl: Duration.DurationInput, now?: number): boolean
}
```

Added in v1.0.0

## isFailure

**Signature**

```ts
export declare const isFailure: <A, E>(data: AsyncData<A, E>) => data is Failure<E>
```

Added in v1.0.0

## isLoading

**Signature**

```ts
export declare const isLoading: <A, E>(data: AsyncData<A, E>) => data is Loading
```

Added in v1.0.0

## isLoadingOrRefreshing

**Signature**

```ts
export declare const isLoadingOrRefreshing: <A, E>(data: AsyncData<A, E>) => data is Loading | Refreshing<A, E>
```

Added in v1.0.0

## isNoData

**Signature**

```ts
export declare const isNoData: <A, E>(data: AsyncData<A, E>) => data is NoData
```

Added in v1.0.0

## isOptimistic

**Signature**

```ts
export declare const isOptimistic: <A, E>(data: AsyncData<A, E>) => data is Optimistic<A, E>
```

Added in v1.0.0

## isRefreshing

**Signature**

```ts
export declare const isRefreshing: <A, E>(data: AsyncData<A, E>) => data is Refreshing<A, E>
```

Added in v1.0.0

## isSuccess

**Signature**

```ts
export declare const isSuccess: <A, E>(data: AsyncData<A, E>) => data is Success<A>
```

Added in v1.0.0

## loading

**Signature**

```ts
export declare const loading: {
  (options?: OptionalPartial<LoadingOptions>): Loading
  <A, E>(options?: OptionalPartial<LoadingOptions>): AsyncData<A, E>
}
```

Added in v1.0.0

## map

**Signature**

```ts
export declare const map: {
  <A, B>(f: (a: A) => B): <E>(data: AsyncData<A, E>) => AsyncData<B, E>
  <A, E, B>(data: AsyncData<A, E>, f: (a: A) => B): AsyncData<B, E>
}
```

Added in v1.0.0

## match

**Signature**

```ts
export declare const match: {
  <A, E, R1, R2, R3, R4, R5>(matchers: {
    NoData: (data: NoData) => R1
    Loading: (data: Loading) => R2
    Failure: (cause: Cause.Cause<E>, data: Failure<E>) => R3
    Success: (value: A, data: Success<A>) => R4
    Optimistic: (value: A, data: Optimistic<A, E>) => R5
  }): (data: AsyncData<A, E>) => Unify.Unify<R1 | R2 | R3 | R4 | R5>
  <A, E, R1, R2, R3, R4, R5>(
    data: AsyncData<A, E>,
    matchers: {
      NoData: (data: NoData) => R1
      Loading: (data: Loading) => R2
      Failure: (cause: Cause.Cause<E>, data: Failure<E>) => R3
      Success: (value: A, data: Success<A>) => R4
      Optimistic: (value: A, data: Optimistic<A, E>) => R5
    }
  ): Unify.Unify<R1 | R2 | R3 | R4 | R5>
}
```

Added in v1.0.0

## noData

**Signature**

```ts
export declare const noData: { (): NoData; <A, E>(): AsyncData<A, E> }
```

Added in v1.0.0

## optimistic

**Signature**

```ts
export declare const optimistic: {
  <A>(value: A, options?: OptionalPartial<OptimisticOptions>): <E>(previous: AsyncData<A, E>) => Optimistic<A, E>
  <A, E = never>(previous: AsyncData<A, E>, value: A, options?: OptionalPartial<OptimisticOptions>): Optimistic<A, E>
}
```

Added in v1.0.0

## startLoading

**Signature**

```ts
export declare const startLoading: <A, E>(data: AsyncData<A, E>) => AsyncData<A, E>
```

Added in v1.0.0

## stopLoading

**Signature**

```ts
export declare const stopLoading: <A, E>(data: AsyncData<A, E>) => AsyncData<A, E>
```

Added in v1.0.0

## success

**Signature**

```ts
export declare const success: {
  <A>(value: A, options?: OptionalPartial<SuccessOptions>): Success<A>
  <A, E>(value: A, options?: OptionalPartial<SuccessOptions>): AsyncData<A, E>
}
```

Added in v1.0.0
