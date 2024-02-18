---
title: AsyncData.ts
nav_order: 1
parent: "@typed/fx"
---

## AsyncData overview

AsyncData integrations with Fx.

Added in v1.20.0

---

<h2 class="text-delta">Table of contents</h2>

- [Filtered](#filtered)
  - [getFailure](#getfailure)
  - [getSuccess](#getsuccess)
- [conversions](#conversions)
  - [asSink](#assink)
- [updates](#updates)
  - [awaitLoading](#awaitloading)
  - [awaitLoadingOrRefreshing](#awaitloadingorrefreshing)
  - [startLoading](#startloading)
  - [stopLoading](#stoploading)
- [utils](#utils)
  - [RefAsyncData (interface)](#refasyncdata-interface)
  - [asyncDataRequest](#asyncdatarequest)
  - [done](#done)
  - [fail](#fail)
  - [failCause](#failcause)
  - [mapInput](#mapinput)
  - [mapInputEffect](#mapinputeffect)
  - [matchAsyncData](#matchasyncdata)
  - [matchAsyncDataArray](#matchasyncdataarray)
  - [optimistic](#optimistic)
  - [runAsyncData](#runasyncdata)
  - [runIfExpired](#runifexpired)
  - [runIfNoData](#runifnodata)
  - [succeed](#succeed)

---

# Filtered

## getFailure

**Signature**

```ts
export declare const getFailure: <A, E, R>(ref: RefAsyncData<A, E, R>) => RefSubject.Filtered<E, never, R>
```

Added in v1.20.0

## getSuccess

**Signature**

```ts
export declare const getSuccess: <A, E, R>(ref: RefAsyncData<A, E, R>) => RefSubject.Filtered<A, never, R>
```

Added in v1.20.0

# conversions

## asSink

Convert RefAsyncData into a Sink.

**Signature**

```ts
export declare const asSink: <A, E, R>(ref: RefAsyncData<A, E, R>) => Sink.Sink<A, E, R>
```

Added in v1.20.0

# updates

## awaitLoading

Await for the AsyncData to stop loading.

**Signature**

```ts
export declare const awaitLoading: <A, E, R>(
  data: RefAsyncData<A, E, R>
) => Effect.Effect<
  AsyncData.NoData | AsyncData.Failure<E> | AsyncData.Success<A> | AsyncData.Optimistic<A, E>,
  never,
  Scope.Scope | R
>
```

Added in v1.20.0

## awaitLoadingOrRefreshing

Await for the AsyncData to stop loading or refreshing.

**Signature**

```ts
export declare const awaitLoadingOrRefreshing: <A, E, R>(
  data: RefAsyncData<A, E, R>
) => Effect.Effect<
  AsyncData.NoData | AsyncData.Failure<E> | AsyncData.Success<A> | AsyncData.Optimistic<A, E>,
  never,
  Scope.Scope | R
>
```

Added in v1.20.0

## startLoading

Change the current value of a RefAsyncData to a loading or refreshing state.

**Signature**

```ts
export declare const startLoading: <A, E, R>(
  ref: RefAsyncData<A, E, R>
) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
```

Added in v1.20.0

## stopLoading

Change the current value of a RefAsyncData to a non-loading/non-refreshing state.

**Signature**

```ts
export declare const stopLoading: <A, E, R>(
  ref: RefAsyncData<A, E, R>
) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
```

Added in v1.20.0

# utils

## RefAsyncData (interface)

**Signature**

```ts
export interface RefAsyncData<A, E = never, R = never>
  extends RefSubject.RefSubject<AsyncData.AsyncData<A, E>, never, R> {}
```

Added in v1.20.0

## asyncDataRequest

**Signature**

```ts
export declare function asyncDataRequest<A, E, R>(
  effect: Effect.Effect<A, E, R>
): Fx.Fx<AsyncData.AsyncData<A, E>, never, R>
```

Added in v1.20.0

## done

Set Exit value of RefAsyncData

**Signature**

```ts
export declare const done: {
  <E, A>(exit: Exit.Exit<A, E>): <R>(ref: RefAsyncData<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
  <A, E, R>(ref: RefAsyncData<A, E, R>, exit: Exit.Exit<A, E>): Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
}
```

Added in v1.20.0

## fail

Fail with a given error

**Signature**

```ts
export declare const fail: {
  <E>(
    error: E,
    options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
  ): <R, A>(ref: RefAsyncData<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
  <A, E, R>(
    ref: RefAsyncData<A, E, R>,
    error: E,
    options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
  ): Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
}
```

Added in v1.20.0

## failCause

Fail with a given cause

**Signature**

```ts
export declare const failCause: {
  <E>(
    cause: Cause.Cause<E>,
    options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
  ): <R, A>(ref: RefAsyncData<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
  <A, E, R>(
    ref: RefAsyncData<A, E, R>,
    cause: Cause.Cause<E>,
    options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
  ): Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
}
```

Added in v1.20.0

## mapInput

Map the input value

**Signature**

```ts
export declare const mapInput: <A, E, R, B>(ref: RefAsyncData<A, E, R>, f: (b: B) => A) => Sink.Sink<B, E, R>
```

Added in v1.20.0

## mapInputEffect

Map the input value using an Effect

**Signature**

```ts
export declare const mapInputEffect: <A, E, R, R2, B>(
  ref: RefAsyncData<A, E, R>,
  f: (b: B) => Effect.Effect<A, E, R2>
) => Sink.Sink<B, E, R | R2>
```

Added in v1.20.0

## matchAsyncData

**Signature**

```ts
export declare const matchAsyncData: {
  <E1, A, B, E2, R2, C, E3, R3, D, E4, R4, F, E5, R5>(matchers: {
    readonly NoData: Fx.Fx<B, E2, R2>
    readonly Loading: (progress: RefSubject.Filtered<Progress>) => Fx.Fx<C, E3, R3>
    readonly Failure: (error: RefSubject.Computed<E1, never, never>) => Fx.Fx<D, E4, R4>
    readonly Success: (value: RefSubject.RefSubject<A, never, never>) => Fx.Fx<F, E5, R5>
  }): <E, R>(
    fx: Fx.Fx<AsyncData.AsyncData<A, E1>, E, R>
  ) => Fx.Fx<B | C | D | F, E2 | E3 | E4 | E5 | E, R2 | R3 | R4 | R5 | R>
  <R, E, E1, A, B, E2, R2, C, E3, R3, D, E4, R4, F, E5, R5>(
    fx: Fx.Fx<AsyncData.AsyncData<A, E1>, E, R>,
    matchers: {
      readonly NoData: Fx.Fx<B, E2, R2>
      readonly Loading: (progress: RefSubject.Filtered<Progress>) => Fx.Fx<C, E3, R3>
      readonly Failure: (error: RefSubject.Computed<E1, never, never>) => Fx.Fx<D, E4, R4>
      readonly Success: (value: RefSubject.RefSubject<A, never, never>) => Fx.Fx<F, E5, R5>
    }
  ): Fx.Fx<B | C | D | F, E | E2 | E3 | E4 | E5, R | R2 | R3 | R4 | R5>
}
```

Added in v1.20.0

## matchAsyncDataArray

**Signature**

```ts
export declare const matchAsyncDataArray: {
  <E1, A, K extends PropertyKey, B, E2, R2, C, E3, R3, D, E4, R4, F, E5, R5>(
    getKey: (a: A) => K,
    matchers: {
      readonly NoData: Fx.Fx<B, E2, R2>
      readonly Loading: (progress: RefSubject.Filtered<Progress>) => Fx.Fx<C, E3, R3>
      readonly Failure: (error: RefSubject.Computed<E1, never, never>) => Fx.Fx<D, E4, R4>
      readonly Success: (value: RefSubject.RefSubject<A, never, never>, key: K) => Fx.Fx<F, E5, R5>
    }
  ): <E, R>(
    fx: Fx.Fx<AsyncData.AsyncData<readonly A[], E1>, E, R>
  ) => Fx.Fx<B | C | D | readonly F[], E2 | E3 | E4 | E5 | E, Scope.Scope | R2 | R3 | R4 | R5 | R>
  <R, E, E1, A, K extends PropertyKey, B, E2, R2, C, E3, R3, D, E4, R4, F, E5, R5>(
    fx: Fx.Fx<AsyncData.AsyncData<readonly A[], E1>, E, R>,
    getKey: (a: A) => K,
    matchers: {
      readonly NoData: Fx.Fx<B, E2, R2>
      readonly Loading: (progress: RefSubject.Filtered<Progress>) => Fx.Fx<C, E3, R3>
      readonly Failure: (error: RefSubject.Computed<E1, never, never>) => Fx.Fx<D, E4, R4>
      readonly Success: (value: RefSubject.RefSubject<A, never, never>, key: K) => Fx.Fx<F, E5, R5>
    }
  ): Fx.Fx<B | C | D | readonly F[], E | E2 | E3 | E4 | E5, Scope.Scope | R | R2 | R3 | R4 | R5>
}
```

Added in v1.20.0

## optimistic

Update with an optimistic value

**Signature**

```ts
export declare const optimistic: {
  <A>(
    value: A,
    options?: AsyncData.OptionalPartial<AsyncData.OptimisticOptions>
  ): <E, R>(ref: RefAsyncData<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
  <A, E, R>(
    ref: RefAsyncData<A, E, R>,
    value: A,
    options?: AsyncData.OptionalPartial<AsyncData.OptimisticOptions>
  ): Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
}
```

Added in v1.20.0

## runAsyncData

**Signature**

```ts
export declare const runAsyncData: {
  <R2, A, E>(
    effect: Effect.Effect<A, E, R2>
  ): <R>(ref: RefAsyncData<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R2 | R>
  <A, E, R, R2>(
    ref: RefAsyncData<A, E, R>,
    effect: Effect.Effect<A, E, R2>
  ): Effect.Effect<AsyncData.AsyncData<A, E>, never, R | R2>
}
```

Added in v1.20.0

## runIfExpired

**Signature**

```ts
export declare const runIfExpired: {
  <R2, A, E>(
    effect: Effect.Effect<A, E, R2>,
    options: { readonly ttl: Duration.DurationInput; readonly now?: number }
  ): <R>(ref: RefAsyncData<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R2 | R>
  <A, E, R, R2>(
    ref: RefAsyncData<A, E, R>,
    effect: Effect.Effect<A, E, R2>,
    options: { readonly ttl: Duration.DurationInput; readonly now?: number }
  ): Effect.Effect<AsyncData.AsyncData<A, E>, never, R | R2>
}
```

Added in v1.20.0

## runIfNoData

**Signature**

```ts
export declare const runIfNoData: {
  <R2, A, E>(
    effect: Effect.Effect<A, E, R2>
  ): <R>(ref: RefAsyncData<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R2 | R>
  <A, E, R, R2>(
    ref: RefAsyncData<A, E, R>,
    effect: Effect.Effect<A, E, R2>
  ): Effect.Effect<AsyncData.AsyncData<A, E>, never, R | R2>
}
```

Added in v1.20.0

## succeed

Succeed with a value

**Signature**

```ts
export declare const succeed: {
  <A>(
    value: A,
    options?: AsyncData.OptionalPartial<AsyncData.SuccessOptions>
  ): <E, R>(ref: RefAsyncData<A, E, R>) => Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
  <A, E, R>(
    ref: RefAsyncData<A, E, R>,
    value: A,
    options?: AsyncData.OptionalPartial<AsyncData.SuccessOptions>
  ): Effect.Effect<AsyncData.AsyncData<A, E>, never, R>
}
```

Added in v1.20.0
