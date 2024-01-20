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
export declare const getFailure: <R, E, A>(ref: RefAsyncData<R, E, A>) => RefSubject.Filtered<R, never, E>
```

Added in v1.20.0

## getSuccess

**Signature**

```ts
export declare const getSuccess: <R, E, A>(ref: RefAsyncData<R, E, A>) => RefSubject.Filtered<R, never, A>
```

Added in v1.20.0

# conversions

## asSink

Convert RefAsyncData into a Sink.

**Signature**

```ts
export declare const asSink: <R, E, A>(ref: RefAsyncData<R, E, A>) => Sink.Sink<R, E, A>
```

Added in v1.20.0

# updates

## awaitLoading

Await for the AsyncData to stop loading.

**Signature**

```ts
export declare const awaitLoading: <R, E, A>(
  data: RefAsyncData<R, E, A>
) => Effect.Effect<
  Scope.Scope | R,
  never,
  AsyncData.NoData | AsyncData.Failure<E> | AsyncData.Success<A> | AsyncData.Optimistic<E, A>
>
```

Added in v1.20.0

## awaitLoadingOrRefreshing

Await for the AsyncData to stop loading or refreshing.

**Signature**

```ts
export declare const awaitLoadingOrRefreshing: <R, E, A>(
  data: RefAsyncData<R, E, A>
) => Effect.Effect<
  Scope.Scope | R,
  never,
  AsyncData.NoData | AsyncData.Failure<E> | AsyncData.Success<A> | AsyncData.Optimistic<E, A>
>
```

Added in v1.20.0

## startLoading

Change the current value of a RefAsyncData to a loading or refreshing state.

**Signature**

```ts
export declare const startLoading: <R, E, A>(
  ref: RefAsyncData<R, E, A>
) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
```

Added in v1.20.0

## stopLoading

Change the current value of a RefAsyncData to a non-loading/non-refreshing state.

**Signature**

```ts
export declare const stopLoading: <R, E, A>(
  ref: RefAsyncData<R, E, A>
) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
```

Added in v1.20.0

# utils

## RefAsyncData (interface)

**Signature**

```ts
export interface RefAsyncData<R, E, A> extends RefSubject.RefSubject<R, never, AsyncData.AsyncData<E, A>> {}
```

Added in v1.20.0

## asyncDataRequest

**Signature**

```ts
export declare function asyncDataRequest<R, E, A>(
  effect: Effect.Effect<R, E, A>
): Fx.Fx<R, never, AsyncData.AsyncData<E, A>>
```

Added in v1.20.0

## done

Set Exit value of RefAsyncData

**Signature**

```ts
export declare const done: {
  <E, A>(exit: Exit.Exit<E, A>): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
  <R, E, A>(ref: RefAsyncData<R, E, A>, exit: Exit.Exit<E, A>): Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
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
  ): <R, A>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
  <R, E, A>(
    ref: RefAsyncData<R, E, A>,
    error: E,
    options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
  ): Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
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
  ): <R, A>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
  <R, E, A>(
    ref: RefAsyncData<R, E, A>,
    cause: Cause.Cause<E>,
    options?: AsyncData.OptionalPartial<AsyncData.FailureOptions>
  ): Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
}
```

Added in v1.20.0

## mapInput

Map the input value

**Signature**

```ts
export declare const mapInput: <R, E, A, B>(ref: RefAsyncData<R, E, A>, f: (b: B) => A) => Sink.Sink<R, E, B>
```

Added in v1.20.0

## mapInputEffect

Map the input value using an Effect

**Signature**

```ts
export declare const mapInputEffect: <R, E, A, R2, B>(
  ref: RefAsyncData<R, E, A>,
  f: (b: B) => Effect.Effect<R2, E, A>
) => Sink.Sink<R | R2, E, B>
```

Added in v1.20.0

## matchAsyncData

**Signature**

```ts
export declare const matchAsyncData: {
  <E1, A, R2, E2, B, R3, E3, C, R4, E4, D, R5, E5, F>(matchers: {
    readonly NoData: Fx.Fx<R2, E2, B>
    readonly Loading: (progress: RefSubject.Filtered<never, never, Progress>) => Fx.Fx<R3, E3, C>
    readonly Failure: (error: RefSubject.Computed<never, never, E1>) => Fx.Fx<R4, E4, D>
    readonly Success: (value: RefSubject.RefSubject<never, never, A>) => Fx.Fx<R5, E5, F>
  }): <R, E>(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, A>>
  ) => Fx.Fx<R2 | R3 | R4 | R5 | R, E2 | E3 | E4 | E5 | E, B | C | D | F>
  <R, E, E1, A, R2, E2, B, R3, E3, C, R4, E4, D, R5, E5, F>(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, A>>,
    matchers: {
      readonly NoData: Fx.Fx<R2, E2, B>
      readonly Loading: (progress: RefSubject.Filtered<never, never, Progress>) => Fx.Fx<R3, E3, C>
      readonly Failure: (error: RefSubject.Computed<never, never, E1>) => Fx.Fx<R4, E4, D>
      readonly Success: (value: RefSubject.RefSubject<never, never, A>) => Fx.Fx<R5, E5, F>
    }
  ): Fx.Fx<R | R2 | R3 | R4 | R5, E | E2 | E3 | E4 | E5, B | C | D | F>
}
```

Added in v1.20.0

## matchAsyncDataArray

**Signature**

```ts
export declare const matchAsyncDataArray: {
  <E1, A, K extends PropertyKey, R2, E2, B, R3, E3, C, R4, E4, D, R5, E5, F>(
    getKey: (a: A) => K,
    matchers: {
      readonly NoData: Fx.Fx<R2, E2, B>
      readonly Loading: (progress: RefSubject.Filtered<never, never, Progress>) => Fx.Fx<R3, E3, C>
      readonly Failure: (error: RefSubject.Computed<never, never, E1>) => Fx.Fx<R4, E4, D>
      readonly Success: (value: RefSubject.RefSubject<never, never, A>, key: K) => Fx.Fx<R5, E5, F>
    }
  ): <R, E>(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, readonly A[]>>
  ) => Fx.Fx<Scope.Scope | R2 | R3 | R4 | R5 | R, E2 | E3 | E4 | E5 | E, B | C | D | readonly F[]>
  <R, E, E1, A, K extends PropertyKey, R2, E2, B, R3, E3, C, R4, E4, D, R5, E5, F>(
    fx: Fx.Fx<R, E, AsyncData.AsyncData<E1, readonly A[]>>,
    getKey: (a: A) => K,
    matchers: {
      readonly NoData: Fx.Fx<R2, E2, B>
      readonly Loading: (progress: RefSubject.Filtered<never, never, Progress>) => Fx.Fx<R3, E3, C>
      readonly Failure: (error: RefSubject.Computed<never, never, E1>) => Fx.Fx<R4, E4, D>
      readonly Success: (value: RefSubject.RefSubject<never, never, A>, key: K) => Fx.Fx<R5, E5, F>
    }
  ): Fx.Fx<Scope.Scope | R | R2 | R3 | R4 | R5, E | E2 | E3 | E4 | E5, B | C | D | readonly F[]>
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
  ): <R, E>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
  <R, E, A>(
    ref: RefAsyncData<R, E, A>,
    value: A,
    options?: AsyncData.OptionalPartial<AsyncData.OptimisticOptions>
  ): Effect.Effect<R, never, AsyncData.AsyncData<E, A>>
}
```

Added in v1.20.0

## runAsyncData

**Signature**

```ts
export declare const runAsyncData: {
  <R2, E, A>(
    effect: Effect.Effect<R2, E, A>
  ): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R2 | R, never, AsyncData.AsyncData<E, A>>
  <R, E, A, R2>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>
  ): Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>
}
```

Added in v1.20.0

## runIfExpired

**Signature**

```ts
export declare const runIfExpired: {
  <R2, E, A>(
    effect: Effect.Effect<R2, E, A>,
    options: { readonly ttl: Duration.DurationInput; readonly now?: number }
  ): <R>(ref: RefAsyncData<R, E, A>) => Effect.Effect<R2 | R, never, AsyncData.AsyncData<E, A>>
  <R, E, A, R2>(
    ref: RefAsyncData<R, E, A>,
    effect: Effect.Effect<R2, E, A>,
    options: { readonly ttl: Duration.DurationInput; readonly now?: number }
  ): Effect.Effect<R | R2, never, AsyncData.AsyncData<E, A>>
}
```

Added in v1.20.0

## runIfNoData

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

Added in v1.20.0

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

Added in v1.20.0
