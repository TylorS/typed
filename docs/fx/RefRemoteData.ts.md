---
title: RefRemoteData.ts
nav_order: 14
parent: "@typed/fx"
---

## RefRemoteData overview

A RefRemoteData is a RefSubject that holds a RemoteData value.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [switchMap](#switchmap)
- [computed](#computed)
  - [getOrElse](#getorelse)
  - [getOrNull](#getornull)
  - [getOrUndefined](#getorundefined)
  - [isFailure](#isfailure)
  - [isLoading](#isloading)
  - [isLoadingOrRefreshing](#isloadingorrefreshing)
  - [isNoData](#isnodata)
  - [isRefreshing](#isrefreshing)
  - [isSuccess](#issuccess)
  - [map](#map)
  - [mapError](#maperror)
  - [mapErrorCause](#maperrorcause)
  - [toOption](#tooption)
  - [toOptionError](#tooptionerror)
- [constructors](#constructors)
  - [make](#make)
- [models](#models)
  - [RefRemoteData (interface)](#refremotedata-interface)
- [updates](#updates)
  - [fail](#fail)
  - [failCause](#failcause)
  - [fromEither](#fromeither)
  - [fromExit](#fromexit)
  - [fromOption](#fromoption)
  - [stopLoading](#stoploading)
  - [succeed](#succeed)
  - [toLoading](#toloading)

---

# combinators

## switchMap

Map the success value of an Fx of a RemoteData to a new Fx of a RemoteData.

**Signature**

```ts
export declare const switchMap: {
  <A, R2, E2, E3, B>(f: (a: A) => Fx.Fx<R2, E2, RemoteData.RemoteData<E3, B>>): <R, E, E1>(
    fx: Fx.Fx<R, E, RemoteData.RemoteData<E1, A>>
  ) => Fx.Fx<R2 | R, E2 | E, RemoteData.RemoteData<E3 | E1, B>>
  <R, E, E1, A, R2, E2, E3, B>(
    fx: Fx.Fx<R, E, RemoteData.RemoteData<E1, A>>,
    f: (a: A) => Fx.Fx<R2, E2, RemoteData.RemoteData<E3, B>>
  ): Fx.Fx<R | R2, E | E2, RemoteData.RemoteData<E1 | E3, B>>
}
```

Added in v1.18.0

# computed

## getOrElse

Get the success value or a default value.

**Signature**

```ts
export declare const getOrElse: {
  <B>(orElse: () => B): <E, A>(ref: RefRemoteData<E, A>) => Computed.Computed<never, never, B | A>
  <E, A, B>(ref: RefRemoteData<E, A>, orElse: () => B): Computed.Computed<never, never, A | B>
}
```

Added in v1.18.0

## getOrNull

Get the success value or null.

**Signature**

```ts
export declare const getOrNull: <E, A>(ref: RefRemoteData<E, A>) => Computed.Computed<never, never, A | null>
```

Added in v1.18.0

## getOrUndefined

Get the success value or undefined.

**Signature**

```ts
export declare const getOrUndefined: <E, A>(ref: RefRemoteData<E, A>) => Computed.Computed<never, never, A | undefined>
```

Added in v1.18.0

## isFailure

Returns true if the current state is Failure.

**Signature**

```ts
export declare const isFailure: <E, A>(ref: RefRemoteData<E, A>) => Computed.Computed<never, never, boolean>
```

Added in v1.18.0

## isLoading

Returns true if the current state is Loading.

**Signature**

```ts
export declare const isLoading: <E, A>(ref: RefRemoteData<E, A>) => Computed.Computed<never, never, boolean>
```

Added in v1.18.0

## isLoadingOrRefreshing

Returns true if the current state is loading or refreshing.

**Signature**

```ts
export declare const isLoadingOrRefreshing: <E, A>(ref: RefRemoteData<E, A>) => Computed.Computed<never, never, boolean>
```

Added in v1.18.0

## isNoData

Returns true if the current state is NoData.

**Signature**

```ts
export declare const isNoData: <E, A>(ref: RefRemoteData<E, A>) => Computed.Computed<never, never, boolean>
```

Added in v1.18.0

## isRefreshing

Returns true if the current state is refreshing.

**Signature**

```ts
export declare const isRefreshing: <E, A>(ref: RefRemoteData<E, A>) => Computed.Computed<never, never, boolean>
```

Added in v1.18.0

## isSuccess

Returns true if the current state is Success.

**Signature**

```ts
export declare const isSuccess: <E, A>(ref: RefRemoteData<E, A>) => Computed.Computed<never, never, boolean>
```

Added in v1.18.0

## map

map the success value of a RefRemoteData

**Signature**

```ts
export declare const map: {
  <A, B>(f: (a: A) => B): <E>(ref: RefRemoteData<E, A>) => Computed.Computed<never, never, RemoteData.RemoteData<E, B>>
  <E, A, B>(ref: RefRemoteData<E, A>, f: (a: A) => B): Computed.Computed<never, never, RemoteData.RemoteData<E, B>>
}
```

Added in v1.18.0

## mapError

map the error value of a RefRemoteData

**Signature**

```ts
export declare const mapError: {
  <E, E2>(f: (e: E) => E2): <A>(
    ref: RefRemoteData<E, A>
  ) => Computed.Computed<never, never, RemoteData.RemoteData<E2, A>>
  <E, A, E2>(ref: RefRemoteData<E, A>, f: (e: E) => E2): Computed.Computed<never, never, RemoteData.RemoteData<E2, A>>
}
```

Added in v1.18.0

## mapErrorCause

map the cause value of a RefRemoteData

**Signature**

```ts
export declare const mapErrorCause: {
  <E, E2>(f: (e: Cause.Cause<E>) => Cause.Cause<E2>): <A>(
    ref: RefRemoteData<E, A>
  ) => Computed.Computed<never, never, RemoteData.RemoteData<E2, A>>
  <E, A, E2>(ref: RefRemoteData<E, A>, f: (e: Cause.Cause<E>) => Cause.Cause<E2>): Computed.Computed<
    never,
    never,
    RemoteData.RemoteData<E2, A>
  >
}
```

Added in v1.18.0

## toOption

Extract the success value from a RefRemoteData

**Signature**

```ts
export declare const toOption: <E, A>(ref: RefRemoteData<E, A>) => Computed.Computed<never, never, Option.Option<A>>
```

Added in v1.18.0

## toOptionError

Extract the error value from a RefRemoteData

**Signature**

```ts
export declare const toOptionError: <E, A>(
  ref: RefRemoteData<E, A>
) => Computed.Computed<never, never, Option.Option<E>>
```

Added in v1.18.0

# constructors

## make

Create a RefRemoteData

**Signature**

```ts
export declare const make: <E, A>() => Effect.Effect<
  never,
  never,
  RefSubject.RefSubject<never, RemoteData.RemoteData<E, A>>
>
```

Added in v1.18.0

# models

## RefRemoteData (interface)

A RefRemoteData is a RefSubject that holds a RemoteData value.

**Signature**

```ts
export interface RefRemoteData<E, A> extends RefSubject.RefSubject<never, RemoteData.RemoteData<E, A>> {}
```

Added in v1.18.0

# updates

## fail

Update the state with a failure.

**Signature**

```ts
export declare const fail: {
  <E>(error: E): <A>(ref: RefRemoteData<E, A>) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  <E, A>(ref: RefRemoteData<E, A>, error: E): Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
}
```

Added in v1.18.0

## failCause

Update the state with a failure cause.

**Signature**

```ts
export declare const failCause: {
  <E>(cause: Cause.Cause<E>): <A>(ref: RefRemoteData<E, A>) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  <E, A>(ref: RefRemoteData<E, A>, cause: Cause.Cause<E>): Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
}
```

Added in v1.18.0

## fromEither

Update that state with an Either

**Signature**

```ts
export declare const fromEither: {
  <E, A>(either: Either.Either<E, A>): (
    ref: RefRemoteData<E, A>
  ) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  <E, A>(ref: RefRemoteData<E, A>, either: Either.Either<E, A>): Effect.Effect<
    never,
    never,
    RemoteData.RemoteData<E, A>
  >
}
```

Added in v1.18.0

## fromExit

Update that state with an Exit

**Signature**

```ts
export declare const fromExit: {
  <E, A>(either: Exit.Exit<E, A>): (
    ref: RefRemoteData<E, A>
  ) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  <E, A>(ref: RefRemoteData<E, A>, exit: Exit.Exit<E, A>): Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
}
```

Added in v1.18.0

## fromOption

Update that state with an Option

**Signature**

```ts
export declare const fromOption: {
  <A>(option: Option.Option<A>): <E>(
    ref: RefRemoteData<E, A>
  ) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  <E, A>(ref: RefRemoteData<E, A>, option: Option.Option<A>): Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
}
```

Added in v1.18.0

## stopLoading

Change the current value of a RefRemoteData to a non-loading/non-refreshing state.

**Signature**

```ts
export declare const stopLoading: <E, A>(
  ref: RefRemoteData<E, A>
) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
```

Added in v1.18.0

## succeed

Update the state with a success.

**Signature**

```ts
export declare const succeed: {
  <A>(value: A): <E>(ref: RefRemoteData<E, A>) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
  <E, A>(ref: RefRemoteData<E, A>, value: A): Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
}
```

Added in v1.18.0

## toLoading

Change the current value of a RefRemoteData to a loading or refreshing state.

**Signature**

```ts
export declare const toLoading: <E, A>(
  ref: RefRemoteData<E, A>
) => Effect.Effect<never, never, RemoteData.RemoteData<E, A>>
```

Added in v1.18.0
