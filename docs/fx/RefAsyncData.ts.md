---
title: RefAsyncData.ts
nav_order: 14
parent: "@typed/fx"
---

## RefAsyncData overview

A RefAsyncData is a RefSubject that holds an AsyncData value.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [Filtered](#filtered)
  - [getFailure](#getfailure)
  - [getSuccess](#getsuccess)
- [constructors](#constructors)
  - [make](#make)
  - [tagged](#tagged)
- [conversions](#conversions)
  - [asSink](#assink)
- [models](#models)
  - [RefAsyncData (interface)](#refasyncdata-interface)
- [updates](#updates)
  - [awaitLoading](#awaitloading)
  - [awaitLoadingOrRefreshing](#awaitloadingorrefreshing)
  - [run](#run)
  - [runIfNoData](#runifnodata)
  - [runRepeat](#runrepeat)
  - [runRetry](#runretry)
  - [runRetryN](#runretryn)
  - [startLoading](#startloading)
  - [stopLoading](#stoploading)
- [utils](#utils)
  - [FailureComputed (type alias)](#failurecomputed-type-alias)
  - [LoadingComputed (type alias)](#loadingcomputed-type-alias)
  - [RefAsyncData (namespace)](#refasyncdata-namespace)
    - [Tagged (interface)](#tagged-interface)
  - [SuccessComputed (type alias)](#successcomputed-type-alias)
  - [done](#done)
  - [fail](#fail)
  - [failCause](#failcause)
  - [mapInput](#mapinput)
  - [mapInputEffect](#mapinputeffect)
  - [match](#match)
  - [matchKeyed](#matchkeyed)
  - [succeed](#succeed)

---

# Filtered

## getFailure

**Signature**

```ts
export declare const getFailure: <R, E, A>(ref: RefAsyncData<R, E, A>) => Filtered.Filtered<R, never, E>
```

Added in v1.18.0

## getSuccess

**Signature**

```ts
export declare const getSuccess: <R, E, A>(ref: RefAsyncData<R, E, A>) => Filtered.Filtered<R, never, A>
```

Added in v1.18.0

# constructors

## make

Create a RefAsyncData

**Signature**

```ts
export declare const make: <E, A>() => Effect.Effect<Scope.Scope, never, RefAsyncData<never, E, A>>
```

Added in v1.18.0

## tagged

Create a Tagged RefAsyncData

**Signature**

```ts
export declare const tagged: <E, A>() => {
  <const I extends IdentifierConstructor<any>>(
    identifier: (id: <const T>(uniqueIdentifier: T) => IdentifierConstructor<T>) => I
  ): RefAsyncData.Tagged<IdentifierOf<I>, E, A>
  <const I>(identifier: string | I): RefAsyncData.Tagged<IdentifierOf<I>, E, A>
}
```

Added in v1.18.0

# conversions

## asSink

Convert RefAsyncData into a Sink.

**Signature**

```ts
export declare const asSink: <R, E, A>(ref: RefAsyncData<R, E, A>) => Sink.WithContext<R, E, A>
```

Added in v1.18.0

# models

## RefAsyncData (interface)

A RefAsyncData is a RefSubject that holds an AsyncData value.

**Signature**

```ts
export interface RefAsyncData<R, E, A> extends RefSubject.RefSubject<R, never, AsyncData.AsyncData<E, A>> {}
```

Added in v1.18.0

# updates

## awaitLoading

Await for the AsyncData to stop loading.

**Signature**

```ts
export declare const awaitLoading: <R, E, A>(
  data: RefAsyncData<R, E, A>
) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
```

Added in v1.18.0

## awaitLoadingOrRefreshing

Await for the AsyncData to stop loading or refreshing.

**Signature**

```ts
export declare const awaitLoadingOrRefreshing: <R, E, A>(
  data: RefAsyncData<R, E, A>
) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
```

Added in v1.18.0

## run

Run an Effect that will first start by setting the state to loading/refreshing, and
then setting the value to the Exit of the Effect. If interrupted it will stop loading/refreshing
the data.

**Signature**

```ts
export declare const run: {
  <R2, E, A>(
    effect: Effect.Effect<R2, E, A>
  ): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R2 | R, never, AsyncData.AsyncData<E, A>>
  <R, E, A, R2>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>
  ): Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>
}
```

Added in v1.18.0

## runIfNoData

Run an Effect that will first start by setting the state to loading/refreshing if the current value is NoData, and
then setting the value to the Exit of the Effect. If interrupted it will stop loading/refreshing
the data.

**Signature**

```ts
export declare const runIfNoData: {
  <R2, E, A>(
    effect: Effect.Effect<R2, E, A>
  ): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R2 | R, never, AsyncData.AsyncData<E, A>>
  <R, E, A, R2>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>
  ): Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>
}
```

Added in v1.18.0

## runRepeat

Repeat an Effect on a Schedule

**Signature**

```ts
export declare const runRepeat: {
  <R2, E, A, R3, X>(
    effect: Effect.Effect<R2, E, A>,
    schedule: Schedule<R3, unknown, X>
  ): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R2 | R3 | R, never, AsyncData.AsyncData<E, A>>
  <R, E, A, R2, R3, X>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>,
    schedule: Schedule<R3, unknown, X>
  ): Effect.Effect<R | R2 | R3, never, AsyncData.AsyncData<E, A>>
}
```

Added in v1.18.0

## runRetry

Retry an Effect on a Schedule

**Signature**

```ts
export declare const runRetry: {
  <R2, E, A, R3, X>(
    effect: Effect.Effect<R2, E, A>,
    schedule: Schedule<R3, unknown, X>
  ): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R2 | R3 | R, never, AsyncData.AsyncData<E, A>>
  <R, E, A, R2, R3, X>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>,
    schedule: Schedule<R3, unknown, X>
  ): Effect.Effect<R | R2 | R3, never, AsyncData.AsyncData<E, A>>
}
```

Added in v1.18.0

## runRetryN

Retry an Effect `n` times

**Signature**

```ts
export declare const runRetryN: {
  <R2, E, A>(
    effect: Effect.Effect<R2, E, A>,
    amount: number
  ): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R2 | R, never, AsyncData.AsyncData<E, A>>
  <R, E, A, R2>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>,
    amount: number
  ): Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>
}
```

Added in v1.18.0

## startLoading

Change the current value of a RefAsyncData to a loading or refreshing state.

**Signature**

```ts
export declare const startLoading: <R, E, A>(
  ref: RefAsyncData<R, E, A>
) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
```

Added in v1.18.0

## stopLoading

Change the current value of a RefAsyncData to a non-loading/non-refreshing state.

**Signature**

```ts
export declare const stopLoading: <R, E, A>(
  ref: RefAsyncData<R, E, A>
) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
```

Added in v1.18.0

# utils

## FailureComputed (type alias)

**Signature**

```ts
export type FailureComputed<E> = {
  readonly cause: Computed.Computed<never, never, Cause.Cause<E>>
  readonly refreshing: Computed.Computed<never, never, Option.Option<AsyncData.Loading>>
}
```

Added in v1.18.0

## LoadingComputed (type alias)

**Signature**

```ts
export type LoadingComputed = {
  readonly progress: Computed.Computed<never, never, Option.Option<Progress>>
}
```

Added in v1.18.0

## RefAsyncData (namespace)

Added in v1.18.0

### Tagged (interface)

**Signature**

```ts
export interface Tagged<I, E, A> extends RefSubject.RefSubject.Tagged<I, never, AsyncData.AsyncData<E, A>> {}
```

Added in v1.18.0

## SuccessComputed (type alias)

**Signature**

```ts
export type SuccessComputed = {
  readonly refreshing: Computed.Computed<never, never, Option.Option<AsyncData.Loading>>
}
```

Added in v1.18.0

## done

Set Exit value of RefAsyncData

**Signature**

```ts
export declare const done: {
  <E, A>(exit: Exit.Exit<E, A>): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
  <R, E, A>(ref: RefAsyncData<R, E, A>, exit: Exit.Exit<E, A>): Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
}
```

Added in v1.18.0

## fail

Fail with a given error

**Signature**

```ts
export declare const fail: {
  <E>(
    error: E,
    options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
  ): <R, A>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
  <R, E, A>(
    ref: RefAsyncData<R, E, A>,
    error: E,
    options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
  ): Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
}
```

Added in v1.18.0

## failCause

Fail with a given cause

**Signature**

```ts
export declare const failCause: {
  <E>(
    cause: Cause.Cause<E>,
    options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
  ): <R, A>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
  <R, E, A>(
    ref: RefAsyncData<R, E, A>,
    cause: Cause.Cause<E>,
    options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
  ): Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
}
```

Added in v1.18.0

## mapInput

Map the input value

**Signature**

```ts
export declare const mapInput: <R, E, A, B>(ref: RefAsyncData<R, E, A>, f: (b: B) => A) => Sink.WithContext<R, E, B>
```

Added in v1.18.0

## mapInputEffect

Map the input value using an Effect

**Signature**

```ts
export declare const mapInputEffect: <R, E, A, R2, B>(
  ref: RefAsyncData<R, E, A>,
  f: (b: B) => Effect.Effect<R2, E, A>
) => Sink.WithContext<R | R2, E, B>
```

Added in v1.18.0

## match

Match over the states of AsyncData with an Fx

**Signature**

```ts
export declare const match: {
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
  >(matchers: {
    NoData: (data: AsyncData.NoData) => Fx.FxInput<R2, E2, B>
    Loading: (data: AsyncData.Loading) => Fx.FxInput<R3, E3, C>
    Failure: (cause: Cause.Cause<E1>, data: AsyncData.Failure<E1>) => Fx.FxInput<R4, E4, D>
    Success: (value: A, data: AsyncData.Success<A>) => Fx.FxInput<R5, E5, F>
  }): <R, E>(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, A>>
  ) => Fx.Fx<R2 | R3 | R4 | R5 | R, E2 | E3 | E4 | E5 | E, B | C | D | F>
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
}
```

Added in v1.18.0

## matchKeyed

Match over the states of AsyncData with an Fx using persistent workflows.

**Signature**

```ts
export declare const matchKeyed: {
  <
    E1,
    A,
    NoData extends Fx.FxInput<any, any, any>,
    Loading extends Fx.FxInput<any, any, any>,
    Failure extends Fx.FxInput<any, any, any>,
    Success extends Fx.FxInput<any, any, any>
  >(matchers: {
    NoData: () => NoData
    Loading: (data: LoadingComputed) => Loading
    Failure: (data: Computed.Computed<never, never, E1>, computed: FailureComputed<E1>) => Failure
    Success: (value: Computed.Computed<never, never, A>, computed: SuccessComputed) => Success
  }): <R, E>(
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
}
```

Added in v1.18.0

## succeed

Succeed with a value

**Signature**

```ts
export declare const succeed: {
  <A>(
    value: A,
    options?: AsyncData.OptionalPartial<AsyncData.SuccessOptions>
  ): <R, E>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
  <R, E, A>(
    ref: RefAsyncData<R, E, A>,
    value: A,
    options?: AsyncData.OptionalPartial<AsyncData.SuccessOptions>
  ): Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
}
```

Added in v1.18.0
